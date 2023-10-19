import {AbiCoder, ethers, Signer} from "ethers";
import {UserOperationJson} from "../aaWallet/AaWallet";
import {IServerPaymaster} from "./IServerPaymaster";

export class ServerVerifyingPaymaster implements IServerPaymaster {
    protected signer: Signer
    readonly paymaster: string
    readonly validUntil: number
    readonly validAfter: number
    protected abiCoder = AbiCoder.defaultAbiCoder()

    protected constructor(signerWithProvider: Signer, paymaster: string, validUntil?: number, validAfter?: number) {
        this.validAfter = Date.now() / 1000
        this.validUntil ??= validAfter + 15 * 60
        this.paymaster = paymaster
    }

    sign = async (op: UserOperationJson, chainId: string) => {
        const pmHash = ethers.keccak256(this.abiCoder.encode(
            ['address', 'uint256', 'bytes32', 'bytes32',
                'uint256', 'uint256', 'uint256', 'uint256', 'uint256',
                'uint256', 'address', 'uint48', 'uint48'],
            [op.sender, op.nonce, ethers.keccak256(op.initCode), ethers.keccak256(op.callData),
                op.callGasLimit, op.verificationGasLimit, op.preVerificationGas, op.maxFeePerGas, op.maxPriorityFeePerGas,
                chainId, this.paymaster, this.validUntil, this.validAfter]))
        const signature = await this.signer.signMessage(pmHash)
        op.paymasterAndData = ethers.concat([this.paymaster, this.abiCoder.encode(['uint48', 'uint48'], [this.validUntil, this.validAfter]), signature])
        return op
    }
}
