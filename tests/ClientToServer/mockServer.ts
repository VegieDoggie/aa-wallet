import * as http from 'http';
import config from "./config.json";
import {UserOperation} from "../../src/aaWallet/AaWallet";
import {Contract, ethers, Wallet} from "ethers";
import {ERC4337} from "../../src/config/erc4337";
import EntryPointAbi from "../../src/config/abi/EntryPoint.json";
import {EntryPoint} from "../../src/config/typechain";

type SendUserOperation = {
    method: string
    params: {
        userOperation: UserOperation
        chainId: string
    }
}

const METHOD = {
    SendUserOperation: "SendUserOperation"
}
const signer = new Wallet(config.bundlerPri1, new ethers.JsonRpcProvider(config.rpc))
const entryPoint = new Contract(ERC4337.EntryPoint, EntryPointAbi, signer) as any as EntryPoint

async function main() {
    const server = http.createServer((req, res) => {
        res.setHeader('Content-Type', 'application/json');
        if (req.url === '/api/aa') {
            // {method:'',params:''}
            let reqData = '';
            req.on('data', (chunk) => {
                reqData += chunk;
            });
            req.on('end', async () => {
                try {
                    const sop: SendUserOperation = JSON.parse(reqData);
                    switch (sop.method) {
                        case METHOD.SendUserOperation:
                            console.log(sop)
                            await entryPoint.handleOps([sop.params.userOperation], config.beneficiary, {gasLimit: 3000000})
                            break;
                        default:
                            res.end(JSON.stringify({error: 'Not found method'}));
                    }
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                }
                res.end(JSON.stringify({message: "success"}));
            });
        } else {
            res.statusCode = 404;
            res.end(JSON.stringify({error: 'Not found'}));
        }
    });

    const PORT = 3000;
    server.listen(PORT, () => {
        console.log(`Server is listening on port ${PORT}`);
    });
}

main().then()
