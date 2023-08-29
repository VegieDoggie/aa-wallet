import {Wallet} from "ethers";

function generateHex64(): string {
  let hexString = "";
  const characters = "0123456789abcdef";

  for (let i = 0; i < 64; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    hexString += characters[randomIndex];
  }

  return "0x"+hexString;
}

// console.log(generateHex64())
console.log((new Wallet("0x386f9424683a817819f8bf0ce288f792d7c0d69681a8ef853d9729c1f9cac648")).address)
