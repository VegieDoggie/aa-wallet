import {ethers} from "ethers";
import {AaWallet, Action, VERSION} from "../../src/aaWallet/AaWallet";
import config from "./config.json"
import {toUserOperationJson} from "../../src/utils/utils";

/*
* 记录1: privateKey1使用老版的mint, approve, stake报错，原因出在call gas预估上
* 记录2: Stackup 的SimpleAccount不符合最新规范，导致一直报错，最终反编译才查出来!!!
*   1- 报错哈希 0x8122de51807a6a5ce3d1069ed43312a823ff301d034f9ebdf86b812ce2695ea2
*               => delegatecall: 0x8abb13360b87be5eeb1b98647a016add927a136c
*   2- 反编译 0x8abb13360b87be5eeb1b98647a016add927a136c
*               => https://library.dedaub.com/ethereum/address/0x8abb13360b87be5eeb1b98647a016add927a136c/decompiled
*   3- 定位报错函数 executeBatch => TMD不符合v6规范
*   4- 按照Stackup规范交易 => 成功! 0x5ad2542df6fdad3bdb6e7874620b1fb88c71667fdcfd84ca0efc91f7de161546
* */
async function main() {
    // 1-Without Paymaster init: aaWallet prepay,need user call EntryPoint.depositTo(aaWallet)
    // 2-With Paymaster: paymaster prepay

    // console.log(ethers.keccak256(AbiCoder.defaultAbiCoder().encode(["string"], [Math.random().toString()])))
    const signer = new ethers.Wallet(config.privateKey1, new ethers.JsonRpcProvider(config.rpc))
    const aaWallet = await AaWallet.connect(signer, {version: VERSION.v5})
    console.log(signer.address, aaWallet.address)
    const uniFace = new ethers.Interface(config.abi)
    const mint: Action = {
        dest: config.erc20,
        func: uniFace.encodeFunctionData('sudoMint', [aaWallet.address, 10000n * 10n ** 18n]),
    }
    const approve: Action = {
        dest: config.erc20,
        func: uniFace.encodeFunctionData('approve', [config.platform, 10000n * 10n ** 18n]),
    }
    const stake: Action = {
        dest: config.platform,
        func: uniFace.encodeFunctionData('stake', [config.erc20, 1n * 10n ** 18n]),
    }
    // const tx = await signer.sendTransaction({
    //     to: aaWallet.address,
    //     data: aaWallet.calldata([mint, approve, stake]),
    //     gasLimit: 3000000
    // })
    const op = await aaWallet.sign([mint, approve, stake])
    console.log(toUserOperationJson(op))
    await sendPostRequest(toUserOperationJson(op), aaWallet.chainId)
}

async function sendPostRequest(op: any, chainId: bigint, url = 'http://localhost:3000/api/aa') {
    const response = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            method: "SendUserOperation",
            params: {
                userOperation: op,
                chainId: chainId.toString(10),
            }
        })
    });
    if (!response.ok) {
        return undefined
    }
    return await response.json();
}

main().then()
