import {HardhatUserConfig} from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-abi-exporter";
import * as dotenv from 'dotenv';

dotenv.config();

const config: HardhatUserConfig = {
    abiExporter: [{
        runOnCompile: true,
        clear: true,
        path: './abi-pretty',
        pretty: true
    }],
    solidity: {
        compilers: [{
            version: "0.8.19",
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200,
                },
                viaIR: true
            },
        }]
    },
    networks: {
        arbigoerli: {
            url: "https://arbitrum-goerli.publicnode.com",
            // accounts: [process.env.prikey as string],
            timeout: 60000,
        }
    },
    etherscan: {
        apiKey: process.env.goerli
    },
};

export default config;
