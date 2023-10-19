import {ECDSAProvider} from '@zerodev/sdk';
import {LocalAccountSigner, UserOperationCallData} from "@alchemy/aa-core";
import {encodeFunctionData, parseAbi, createPublicClient, http, Hex} from 'viem';
import {arbitrumGoerli} from 'viem/chains';
import * as dotenv from 'dotenv';
dotenv.config();


/**
 * 记录: aa::erc20.sudoMint -> aa::erc20.approve -> aa::platform.stake
 * 结论: 每一次请求都需要花钱，扩展性也不好!
 * */
// TestERC20 0xB7AB4B26aB11f3c20a97810421fB9e3840C8d693
// TestPlatform 0x9b1681BB7A21c35302E1aE2e031F73e3DE0DdF47
const projectId = process.env.PROJECT_ID as string;
const owner = LocalAccountSigner.privateKeyToAccountSigner(process.env.PRIVATE_KEY as Hex);
const testERC20Addr = '0xB7AB4B26aB11f3c20a97810421fB9e3840C8d693';
const testPlatformAddr = '0x9b1681BB7A21c35302E1aE2e031F73e3DE0DdF47';
const contractABI = parseAbi([
    'function sudoMint(address,uint256)',
    'function approve(address,uint256)',
    'function stake(address,address,uint256)',
    'function balanceOf(address owner) external view returns (uint256 balance)'
]);
const publicClient = createPublicClient({
    chain: arbitrumGoerli,
    transport: http('https://arbitrum-goerli.public.blastapi.io'),
});

const main = async () => {
    try {
        const ecdsaProvider = await ECDSAProvider.init({
            projectId,
            owner,
        });
        const aaWalletAddr = await ecdsaProvider.getAddress();
        console.log('My aaWallet:', aaWalletAddr);

        // Mint TestERC20 and approve, then stake to TestPlatform
        const mint = {
            target: testERC20Addr,
            data: encodeFunctionData({
                abi: contractABI,
                functionName: 'sudoMint',
                args: [aaWalletAddr, 10000n * 10n ** 18n],
            }),
        } as UserOperationCallData
        const approve = {
            target: testERC20Addr,
            data: encodeFunctionData({
                abi: contractABI,
                functionName: 'approve',
                args: [aaWalletAddr, 10000n * 10n ** 18n],
            }),
        } as UserOperationCallData
        const stake = {
            target: testPlatformAddr,
            data: encodeFunctionData({
                abi: contractABI,
                functionName: 'stake',
                args: [testERC20Addr, aaWalletAddr, 1n * 10n ** 18n],
            }),
        } as UserOperationCallData
        const {hash} = await ecdsaProvider.sendUserOperation([mint, approve, stake]);
        await ecdsaProvider.waitForUserOperationTransaction(hash as Hex);

        // Check how many NFTs we have
        const balanceOf = await publicClient.readContract({
            address: aaWalletAddr,
            abi: contractABI,
            functionName: 'balanceOf',
            args: [aaWalletAddr],
        });
        console.log(`aaWallet balance for TestERC20: ${balanceOf}`);
    } catch (error) {
        console.error('Error:', error);
    }
}

main().then(() => process.exit(0));
