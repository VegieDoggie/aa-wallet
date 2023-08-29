import {Contract, ethers} from "ethers";
import SimpleAccountAbi from "../src/config/abi/SimpleAccount.json";
import {SimpleAccount} from "../src/config/typechain";

(async () => {
    const provider = new ethers.JsonRpcProvider("https://arbitrum-goerli.publicnode.com")
    const logs = await provider.getLogs({
        address: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
        topics: [ethers.id('UserOperationEvent(bytes32,address,address,uint256,bool,uint256,uint256)'),
            '0x802C826611A8F879270A541AACCBC23E66B1F30D3F1B4DC58F3EF7B873B22997'],
    });
    console.log(logs)
})()
