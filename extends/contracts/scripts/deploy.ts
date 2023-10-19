import hre from "hardhat";

async function main() {

    // await deploy({isOpen: true}, "TestERC20", 18)
    // await deploy({isOpen: true}, "TestPlatform")

    // // 测试网部署AA体系
    // // => EntryPoint 0x09C98f2231E575538d0BAFD2065c54E8aeD242A0
    // await deploy({isOpen: true, extraDir: "core"}, "EntryPoint")
    // // => SimpleAccount 0x09C98f2231E575538d0BAFD2065c54E8aeD242A0
    // const context = {isOpen: true, extraDir: "samples"}
    // await deploy(context, "SimpleAccount", "0x09C98f2231E575538d0BAFD2065c54E8aeD242A0")
    // // => SimpleAccountFactory 0xb53B0EA245fE3eBe8EE077feCa4B17Bd7b2072a7
    // await deploy(context, "SimpleAccountFactory", "0x09C98f2231E575538d0BAFD2065c54E8aeD242A0")
    // // => VerifyingPaymaster ??
    // // await deploy(context, "VerifyingPaymaster", "0x09C98f2231E575538d0BAFD2065c54E8aeD242A0", ?)
}

export type Context = {
    isOpen?: boolean,
    extraDir?: string // 目标.sol文件不直接在contracts/下则需要指明间隔目录，形如: `base/`
}

async function deploy(context: Context, name: string, ...args: any) {
    const Instance = await hre.ethers.getContractFactory(name)
    const instance = await Instance.deploy(...args)
    console.log(`${name} deployed: ${instance.target}`)
    if (context?.isOpen) {
        await verify(context, name, instance.target as string, ...args)
    }
    return instance
}

// https://github.com/NomicFoundation/hardhat/tree/main/packages/hardhat-verify
async function verify(context: Context, name: string, address: string, ...args: any) {
    await hre.run("verify:verify", {
        contract: `contracts/${context?.extraDir ?? ''}${name}.sol:${name}`,
        address: address,
        constructorArguments: args ?? [],
    });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
