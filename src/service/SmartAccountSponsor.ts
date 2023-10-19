import {Signer} from "ethers";
import {Bundler, IBundler} from "@biconomy/bundler";
import {BiconomyPaymaster, IHybridPaymaster, PaymasterMode, SponsorUserOperationDto} from "@biconomy/paymaster";
import {Transaction, UserOperation} from "@biconomy/core-types";
import {
    BiconomySmartAccount,
    BiconomySmartAccountConfig,
    DEFAULT_ENTRYPOINT_ADDRESS,
    Overrides
} from "@biconomy/account";


export type SmartAccountSponsorOverrides = {
    debug?: boolean
    bundlerKey?: string;
    paymasterKey?: string;
}

export class SmartAccountSponsor {
    smartAccount: BiconomySmartAccount;
    owner: string;
    smartAccountAddress: string;
    debug: boolean

    private constructor(smartAccount: BiconomySmartAccount, owner: string, smartAccountAddress: string, debug?: boolean) {
        this.smartAccount = smartAccount;
        this.owner = owner;
        this.smartAccountAddress = smartAccountAddress;
        this.debug = Boolean(debug)
    }

    static New = async (wallet: Signer, chainId: number, overrides?: SmartAccountSponsorOverrides) => {
        const bundler: IBundler = new Bundler({
            bundlerUrl: `https://bundler.biconomy.io/api/v2/${chainId}/${overrides?.bundlerKey ?? "nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44"}`,
            chainId: chainId,
            entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
        })
        const paymaster = new BiconomyPaymaster({
            paymasterUrl: `https://paymaster.biconomy.io/api/v1/${chainId}/${overrides?.paymasterKey ?? "vLtCApGzx.a74fe509-e670-40fa-a071-cff3fe7aed51"}`
        })
        const smartAccountConfig: BiconomySmartAccountConfig = {
            signer: wallet,
            chainId: chainId,
            bundler: bundler,
            paymaster: paymaster
        }
        const smartAccount = await (new BiconomySmartAccount(smartAccountConfig)).init()
        const owner = smartAccount.owner
        const smartAccountAddress = await smartAccount.getSmartAccountAddress()
        if (overrides?.debug) {
            console.log("chainId: ", chainId)
            console.log("owner: ", smartAccount.owner)
            console.log("address: ", await smartAccount.getSmartAccountAddress())
        }
        return new SmartAccountSponsor(smartAccount, owner, smartAccountAddress, overrides?.debug);
    }


    buildUserOp = async (transactions: Transaction[], overrides?: Overrides, skipBundlerGasEstimation?: boolean) => {
        const partialUserOp = await this.smartAccount.buildUserOp(transactions, overrides, skipBundlerGasEstimation)
        let paymasterServiceData: SponsorUserOperationDto = {
            mode: PaymasterMode.SPONSORED,
            calculateGasLimits: true, // Always recommended when using paymaster
        };
        const paymasterRes = await (this.smartAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>)
            .getPaymasterAndData(partialUserOp, paymasterServiceData);

        partialUserOp.paymasterAndData = paymasterRes.paymasterAndData;
        if (paymasterRes.callGasLimit && paymasterRes.verificationGasLimit && paymasterRes.preVerificationGas) {
            partialUserOp.callGasLimit = paymasterRes.callGasLimit;
            partialUserOp.verificationGasLimit = paymasterRes.verificationGasLimit;
            partialUserOp.preVerificationGas = paymasterRes.preVerificationGas;
        }
        if (this.debug) {
            console.log(`userOp: ${JSON.stringify(partialUserOp, null, "\t")}`);
        }
        return partialUserOp
    }

    sendTransaction = async (userOperation: Partial<UserOperation>) => {
        try {
            const userOpResponse = await this.smartAccount.sendUserOp(userOperation);
            const transactionDetails = await userOpResponse.wait();
            if (this.debug) {
                console.log(`userOp Hash: ${userOpResponse.userOpHash}`);
                console.log(`transactionDetails: ${JSON.stringify(transactionDetails, null, "\t")}`);
            }
            return transactionDetails
        } catch (e) {
            console.log("error received ", e);
        }
    }
}
