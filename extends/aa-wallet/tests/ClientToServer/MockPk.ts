import {Wallet} from "ethers";

function generateHex64(): string {
    let hexString = "";
    const characters = "0123456789abcdef";

    for (let i = 0; i < 64; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        hexString += characters[randomIndex];
    }

    return "0x" + hexString;
}

const pk = generateHex64()
console.log((new Wallet(pk)).address, pk)
