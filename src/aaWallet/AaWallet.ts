import {AbiCoder, Contract, ethers, JsonRpcApiProvider, Signer} from "ethers";
import EntryPointAbi from "../config/abi/EntryPoint.json";
import SimpleAccountAbi from "../config/abi/SimpleAccount.json";
import SimpleAccountFactoryAbi from "../config/abi/SimpleAccountFactory.json";
import {EntryPoint, SimpleAccountFactory, SimpleAccount} from "../config/typechain";
import {ERC4337} from "../config/erc4337";

export const VERSION = {
    v5: "v5", // v5 is missing <Action>.value!!!
    v6: "v6"
}

const EXECUTE_BATCH = {
    v6: {
        sig: ethers.keccak256(ethers.toUtf8Bytes("executeBatch(address[],uint256[],bytes[])")).substring(0, 10),
        type: ["address[]", "uint256[]", "bytes[]"],
    },
    v5: {
        sig: ethers.keccak256(ethers.toUtf8Bytes("executeBatch(address[],bytes[])")).substring(0, 10),
        type: ["address[]", "bytes[]"],
    }
}

/*
* AaWallet is an Abstraction Account, also called aa wallet
* Quick start(No paymaster):
*   (1) const op = AaWallet.connect(signer).sign(action);
*   (2) send `op` to bundler
*   (3) wait tx
* */
export class AaWallet {
    public address: string
    public readonly chainId: bigint
    public readonly version: string

    protected signer: Signer
    protected readonly user: string
    protected readonly salt: bigint
    protected readonly initCode: string;
    protected readonly creationCode: string;
    protected entryPoint: EntryPoint;
    protected aaAccount: SimpleAccount;
    protected aaAccountFactory: SimpleAccountFactory;
    protected abiCoder = AbiCoder.defaultAbiCoder()
    protected deployed = false

    protected constructor(signerWithProvider: Signer, user: string, aaAddress: string, chainId: bigint, opt = {} as AaWallet.Options) {
        this.address = aaAddress;
        this.version = opt.version ?? VERSION.v5;
        this.signer = signerWithProvider;
        this.user = user;
        this.salt = opt.salt ?? 0n;
        this.chainId = chainId;
        this.entryPoint = new Contract(opt.entryPoint ?? ERC4337.EntryPoint, EntryPointAbi, this.signer) as any as EntryPoint
        this.aaAccount = new Contract(aaAddress, SimpleAccountAbi, this.signer) as any as SimpleAccount
        this.aaAccountFactory = new Contract(opt.aaAccountFactory ?? ERC4337.SimpleAccount.Factory, SimpleAccountFactoryAbi, this.signer) as any as SimpleAccountFactory
        this.creationCode = this.aaAccountFactory.interface.encodeFunctionData("createAccount", [this.user, this.salt])
        this.initCode = ethers.concat([this.aaAccountFactory.target as string, this.creationCode])
    }

    public static connect = async (signerWithProvider: Signer, opt = {} as AaWallet.Options) => {
        if (!signerWithProvider.provider) throw new Error("signer is missing provider!");
        const [user, network] = await Promise.all([
            signerWithProvider.getAddress(),
            await signerWithProvider.provider.getNetwork()
        ])
        const aaAddress = "0x" + (await signerWithProvider.call({
            to: opt?.aaAccountFactory ?? ERC4337.SimpleAccount.Factory,
            data: ethers.keccak256(ethers.toUtf8Bytes("getAddress(address,uint256)")).substring(0, 10)
                + AbiCoder.defaultAbiCoder().encode(["address", "uint256"], [user, opt.salt ?? 0n]).substring(2),
            gasLimit: 3000000,
        })).substring(26)
        return new AaWallet(signerWithProvider, user, aaAddress, network.chainId, opt ?? {})
    }

    /*
    * sign <actions>, return UserOperation(then you can send to `bundler`)
    * @action - what you want aaWallet do
    * @middlewareFunc - optional, additional processing, like paymasterFunc: op ---> bundler ---> new op
    * */
    public sign = async (action: Action[], ...middlewareFunc: Array<(op: UserOperation, chainId: bigint) => Promise<UserOperation>>) => {
        // split Promise.all to prevent request limit
        const callData = this.calldata(action)
        const [nonce, isDeployed, callGasLimit, gasInfo] = await Promise.all([
            this.nonce(),
            this.isDeployed(),
            this.callGasLimit(callData),
            this.gasInfo()
        ])
        let userOp = {
            sender: this.aaAccount.target as string,
            nonce: nonce,
            initCode: isDeployed ? '0x' : this.initCode,
            callData: callData,
            callGasLimit: 55000n + callGasLimit, // entryPoint wrapper cost + entryPoint direct call gas
            // callGasLimit: 2000000n, // entryPoint wrapper cost + entryPoint direct call gas
            verificationGasLimit: 150000n + (isDeployed ? 0n : await this.creationGas()), // default verification gas ?+ create2 cost
            preVerificationGas: 21000n, // single tx ~21000 + calldata cost
            maxFeePerGas: gasInfo.maxFeePerGas,
            maxPriorityFeePerGas: gasInfo.maxPriorityFeePerGas,
            paymasterAndData: '0x',
            signature: '0x',
        } as UserOperation
        userOp.preVerificationGas += this.calldataCost(this.packUserOp(userOp))
        // userOp' -> middleware ..> middleware ..> middleware -> userOp
        if (middlewareFunc) {
            for (let i = 0; i < middlewareFunc.length; i++) {
                userOp = await middlewareFunc[i](userOp, this.chainId)
            }
        }
        // sign
        userOp.signature = await this.signature(userOp)
        return userOp
    }

    /*
    * wait the tx confirms, returns event log
    * */
    public wait = async (op: UserOperation, count = 30, tickerMill = 1.5 * 1000) => {
        const filter = {
            address: this.entryPoint.target,
            topics: [ethers.id('UserOperationEvent(bytes32,address,address,uint256,bool,uint256,uint256)'), this.userOpHash(op)],
        }
        for (let i = 0; i < count; i++) {
            const logs = await this.signer!.provider!.getLogs(filter)
            if (logs && logs.length > 0) {
                return logs[0]
            }
            await new Promise(resolve => setTimeout(resolve, tickerMill))
        }
        return undefined
    }

    /*
    * Is this AaWallet deployed on chain?
    * */
    public isDeployed = async () => {
        if (!this.deployed) {
            const code = await this.signer!.provider!.getCode(this.aaAccount.target);
            this.deployed = code.length > 2;
        }
        return this.deployed
    }

    public userOpHash = (op: UserOperation) => {
        const _opHash = ethers.keccak256(
            this.abiCoder.encode(
                ['address', 'uint256', 'bytes32', 'bytes32',
                    'uint256', 'uint256', 'uint256', 'uint256', 'uint256',
                    'bytes32'],
                [op.sender, op.nonce, ethers.keccak256(op.initCode), ethers.keccak256(op.callData),
                    op.callGasLimit, op.verificationGasLimit, op.preVerificationGas, op.maxFeePerGas, op.maxPriorityFeePerGas,
                    ethers.keccak256(op.paymasterAndData)]))
        return ethers.keccak256(
            this.abiCoder.encode(
                ['bytes32', 'address', 'uint256'],
                [_opHash, this.entryPoint.target, this.chainId])
        )
    }

    public signature = async (op: UserOperation) => {
        return await this.signer.signMessage(ethers.toBeArray(this.userOpHash(op)))
    }

    public callGasLimit = async (callData: string) => {
        return await this.signer!.provider!.estimateGas({
            from: this.entryPoint.target,
            to: this.aaAccount.target,
            data: callData
        })
    }

    public calldata = (action: ArrayLike<Action>, version ?: string) => {
        if (!action || action.length == 0) throw new Error("action can't be empty!");
        version ??= this.version
        if (action.length > 1) {
            let dest: string[] = [], value: bigint[] = [], func: string[] = []
            for (let i = 0; i < action.length; i++) {
                dest.push(action[i].dest)
                value.push(action[i].value ?? 0n)
                func.push(action[i].func)
            }
            switch (version) {
                case VERSION.v6:
                    if (value.every(v => v === 0n)) value = []
                    return EXECUTE_BATCH.v6.sig + this.abiCoder.encode(EXECUTE_BATCH.v6.type, [dest, value, func]).substring(2)
                case VERSION.v5:
                    return EXECUTE_BATCH.v5.sig + this.abiCoder.encode(EXECUTE_BATCH.v5.type, [dest, func]).substring(2)
                default:
                    throw new Error("Unknown SimpleAccount Version!")
            }
        }
        const {dest, value, func} = action[0]
        return this.aaAccount.interface.encodeFunctionData("execute", [dest, value ?? 0n, func]);
    }

    public nonce = async (version ?: string) => {
        version ??= this.version
        switch (version) {
            case VERSION.v6:
                return await this.entryPoint.getNonce(this.user, this.salt)
            case VERSION.v5:
                return await this.aaAccount.getNonce()
            default:
                throw new Error("Unknown SimpleAccount Version!")
        }
    }

    public gasInfo = async () => {
        const [block, maxPriorityFeePerGas, gasPrice] = await Promise.all([
            this.signer!.provider!.getBlock("latest"),
            this.safeRequestBigInt("eth_maxPriorityFeePerGas"),
            this.safeRequestBigInt("eth_gasPrice"),
        ]);
        if (block && block.baseFeePerGas) {
            return {
                maxFeePerGas: (block.baseFeePerGas * 2n) + maxPriorityFeePerGas!,
                maxPriorityFeePerGas: maxPriorityFeePerGas
            }
        }
        if (!gasPrice) throw new Error("The Gas-rpc-method(eth_gasPrice) is unsuitable")
        return {
            maxFeePerGas: gasPrice,
            maxPriorityFeePerGas: gasPrice
        }
    }

    public creationGas = async () => {
        return await this.signer!.provider!.estimateGas({to: this.aaAccountFactory.target, data: this.creationCode});
    };

    public packUserOp = (op: UserOperation) => {
        return this.abiCoder.encode(
            ['address', 'uint256', 'bytes', 'bytes',
                'uint256', 'uint256', 'uint256', 'uint256', 'uint256',
                'bytes', 'bytes'],
            [op.sender, op.nonce, op.initCode, op.callData,
                op.callGasLimit, op.verificationGasLimit, op.preVerificationGas, op.maxFeePerGas, op.maxPriorityFeePerGas,
                op.paymasterAndData, op.signature])
    }

    public calldataCost(data: string) {
        return BigInt(ethers.getBytes(data)
            .map(x => x === 0 ? 4 : 16)
            .reduce((sum, x) => sum + x))
    }

    protected safeRequestBigInt = async (method: string) => {
        try {
            return await (this.signer!.provider! as JsonRpcApiProvider).send(method, []).then(BigInt)
        } catch {
            return undefined
        }
    }
}

export declare namespace AaWallet {
    export type Options = Partial<{
        salt: bigint
        entryPoint: string
        aaAccountFactory: string
        version: string // default: v5, `StackUp` is v5 until 2023-08-29
    }>
}

export type UserOperation = {
    sender: string;
    nonce: bigint;
    initCode: string;
    callData: string;
    callGasLimit: bigint;
    verificationGasLimit: bigint;
    preVerificationGas: bigint;
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
    paymasterAndData: string;
    signature: string;
}

export type UserOperationJson = {
    sender: string;
    nonce: string;
    initCode: string;
    callData: string;
    callGasLimit: string;
    verificationGasLimit: string;
    preVerificationGas: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    paymasterAndData: string;
    signature: string;
}

export type Action = {
    dest: string;
    value?: bigint; // require version is v6+
    func: string;
}
