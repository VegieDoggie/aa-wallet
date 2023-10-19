import fs from 'fs'
import path from 'path'
import {ethers} from 'ethers'
import {JsonFragment} from "ethers/src.ts/abi/fragments";

async function main() {
    // findSelector("SimpleAccount", "executeBatch","samples")
    findFunction("SimpleAccountFactory", "0x8cb84e18","samples")
}

function findSelector(contractName: string, functionName: string, dir?: string): void {
    const contractAbiPath = path.join(__dirname, `../artifacts/contracts/${dir ?? ''}/${contractName}.sol/${contractName}.json`)
    const contractAbi = JSON.parse(fs.readFileSync(contractAbiPath, 'utf-8')).abi as JsonFragment[]
    for (let functionAbi of contractAbi) {
        if (functionAbi.name === functionName) {
            const types = functionAbi?.inputs?.map((input: any) => input.type).join(',')
            const func = `${functionAbi.name}(${types})`
            const selector = ethers.keccak256(ethers.toUtf8Bytes(func)).substring(0, 10)
            console.log(`Function "${func}": ${selector}`)
            return
        }
    }
    console.error(`Function "${functionName}" not found in ABI.`)
}

function findFunction(contractName: string, selector: string, dir?: string): void {
    const contractAbiPath = path.join(__dirname, `../artifacts/contracts/${dir ?? ''}/${contractName}.sol/${contractName}.json`)
    const contractAbi = JSON.parse(fs.readFileSync(contractAbiPath, 'utf-8')).abi as JsonFragment[]
    for (let item of contractAbi) {
        const types = item?.inputs?.map((input: any) => input.type).join(',')
        const func = `${item.name}(${types})`
        const iSelector = ethers.keccak256(ethers.toUtf8Bytes(func)).substring(0, 10)
        if (iSelector === selector) {
            console.log(`Selector "${selector}": ${func}`)
            return
        }
    }
    console.log(`Selector "${selector}": not found in ABI.`)
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
