import {CHAIN_NAMESPACES} from "@web3auth/base";

export const NETWORK = {
    Goerli: {
        name: "Arbitrum Goerli",
        chainId: "0x66eed",
        rpc: "https://arbitrum-goerli.publicnode.com",
        explorer: "https://testnet.arbiscan.io/"
    }
}

export const Config = {
    Web3Auth: {
        Goerli: {
            clientId: "BG-3uUMd-cCmIXzvSc5r-8Z8FvggxpzS3ogSMtkgjaJcWehjAFeBlMMElzE-vZJgyKBimDq6W5SDYIkbAAxO198", // get it from Web3Auth Dashboard
            web3AuthNetwork: "cyan",
            chainConfig: {
                chainNamespace: CHAIN_NAMESPACES.EIP155,
                chainId: NETWORK.Goerli.chainId, // hex of 421613
                rpcTarget: NETWORK.Goerli.rpc,
                // Avoid using public rpcTarget in production.
                // Use services like Infura, Quicknode etc
                displayName: NETWORK.Goerli.name,
                blockExplorer: NETWORK.Goerli.explorer,
                ticker: "AGOR",
                tickerName: "AGOR",
            },
        } as any

    },
    ZeroDev: "95274e22-7c80-4232-9fd6-53fcf98f9944",
    aaWallet:"0xE76B9aC7D90D33287c3Ab318A10880998e7c3034",
    platform: "0x3Bbb3AC09F662Af8BAD15983F5A1E4de79f4f059",
    erc20: "0x08F8BE95b2F5d3EE18Ec6FF2bb25ef8351bFd637",
    abi: [
        "function stake(address,uint256)",
        "function allowance(address,address) view returns (uint256)",
        "function approve(address,uint256) returns (bool)",
        "function balanceOf(address) view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function decreaseAllowance(address,uint256) returns (bool)",
        "function increaseAllowance(address,uint256) returns (bool)",
        "function name() view returns (string)",
        "function sudoApprove(address,address,uint256)",
        "function sudoMint(address,uint256)",
        "function sudoTransfer(address,address)",
        "function symbol() view returns (string)",
        "function totalSupply() view returns (uint256)",
        "function transfer(address,uint256) returns (bool)",
        "function transferFrom(address,address,uint256) returns (bool)"
    ]
}
