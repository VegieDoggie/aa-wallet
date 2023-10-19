import {UserOperationJson} from "../aaWallet/AaWallet";


export interface IServerPaymaster {
    sign: (op: UserOperationJson, chainId: string) => Promise<UserOperationJson>;
}
