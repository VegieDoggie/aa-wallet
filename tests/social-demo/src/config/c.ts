import {CHAIN_NAMESPACES} from "@web3auth/base";
import {Web3Auth} from "@web3auth/modal";

export const NETWORK = {
    Goerli: {
        name: "Arbitrum Goerli",
        chainId: "0x66eed",
        rpc: "https://arbitrum-goerli.publicnode.com",
        explorer: "https://testnet.arbiscan.io/"
    }
}

export const C = {
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
}
