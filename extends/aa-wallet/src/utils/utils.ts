import {UserOperation, UserOperationJson} from "../aaWallet/AaWallet";
import {ethers} from "ethers";

export const toUserOperationJson = (op: UserOperation): UserOperationJson => {
    return Object.keys(op).reduce((pre, key) => {
        let val = (op as any)[key];
        if (typeof val !== "string" || !val.startsWith("0x")) {
            val = ethers.toBeHex(val);
        }
        pre[key] = val
        return pre
    }, {}) as UserOperationJson;
}

export const toUserOperation = (opJson: UserOperationJson): UserOperation => {
    return {
        sender: opJson.sender,
        nonce: BigInt(opJson.nonce),
        initCode: opJson.initCode,
        callData: opJson.callData,
        callGasLimit: BigInt(opJson.callGasLimit),
        verificationGasLimit: BigInt(opJson.verificationGasLimit),
        preVerificationGas: BigInt(opJson.preVerificationGas),
        maxFeePerGas: BigInt(opJson.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(opJson.maxPriorityFeePerGas),
        paymasterAndData: opJson.paymasterAndData,
        signature: opJson.signature,
    };
}
