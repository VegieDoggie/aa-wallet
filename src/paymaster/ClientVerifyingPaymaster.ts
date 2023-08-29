import {UserOperation} from "../aaWallet/AaWallet";
import {IClientPaymaster} from "./IClientPaymaster";

export class ClientVerifyingPaymaster implements IClientPaymaster {

    sign = async (op: UserOperation, chainId: string) => {
        return op
    }
}
