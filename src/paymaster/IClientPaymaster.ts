import {UserOperation} from "../aaWallet/AaWallet";


export interface IClientPaymaster {
    sign : (op: UserOperation, chainId: string)=>Promise<UserOperation>;
}
