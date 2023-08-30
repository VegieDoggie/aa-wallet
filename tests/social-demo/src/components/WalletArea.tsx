import React, {useEffect} from 'react';
import {ethers} from "ethers";
import {ECDSAProvider} from "@zerodev/sdk";
import {SmartAccountSigner} from "@alchemy/aa-core";


function WalletArea(signer: ethers.Signer) {
    useEffect(() => {
        const init = async () => {
            // TODO 流程化测试
            // const ecdsaProvider = await ECDSAProvider.init({
            //     projectId,
            //     // The signer
            //     owner: signer as any as SmartAccountSigner,
            // });

            // ecdsaProvider.sendUserOperation()
        }
        init().then()
    })

    return (
        <div>

        </div>
    );
}

export default WalletArea;
