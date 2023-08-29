import fs from 'fs'
import path from 'path'
import {ethers} from 'ethers'
import {JsonFragment} from "ethers/src.ts/abi/fragments";

async function main() {
    // console.log(ethers.keccak256(ethers.toUtf8Bytes("executeBatch(address[],uint256[],bytes[])")).substring(0,10))
    // getSignature("SimpleAccount", "executeBatch","samples")
    getFunction("SimpleAccountFactory", "0x8cb84e18","samples")
}

function getSignature(contractName: string, functionName: string, dir?: string): void {
    const contractAbiPath = path.join(__dirname, `../artifacts/contracts/${dir ?? ''}/${contractName}.sol/${contractName}.json`)
    const contractAbi = JSON.parse(fs.readFileSync(contractAbiPath, 'utf-8')).abi as JsonFragment[]
    for (let functionAbi of contractAbi) {
        if (functionAbi.name === functionName) {
            const types = functionAbi?.inputs?.map((input: any) => input.type).join(',')
            const func = `${functionAbi.name}(${types})`
            const sig = ethers.keccak256(ethers.toUtf8Bytes(func)).substring(0, 10)
            console.log(`Function "${func}": ${sig}`)
            return
        }
    }
    console.error(`Function "${functionName}" not found in ABI.`)
}

function getFunction(contractName: string, signature: string, dir?: string): void {
    const contractAbiPath = path.join(__dirname, `../artifacts/contracts/${dir ?? ''}/${contractName}.sol/${contractName}.json`)
    const contractAbi = JSON.parse(fs.readFileSync(contractAbiPath, 'utf-8')).abi as JsonFragment[]
    for (let item of contractAbi) {
        const types = item?.inputs?.map((input: any) => input.type).join(',')
        const func = `${item.name}(${types})`
        const sig = ethers.keccak256(ethers.toUtf8Bytes(func)).substring(0, 10)
        if (sig === signature) {
            console.log(`Signature "${signature}": ${func}`)
            return
        }
    }
    console.log(`Signature "${signature}": not found in ABI.`)
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
