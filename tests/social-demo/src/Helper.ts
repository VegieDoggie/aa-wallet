import {TorusWalletConnectorPlugin} from "@web3auth/torus-wallet-connector-plugin";
import {C} from "@/config/c";
import {WalletConnectV1Adapter} from "@web3auth/wallet-connect-v1-adapter";
import {MetamaskAdapter} from "@web3auth/metamask-adapter";
import {TorusWalletAdapter} from "@web3auth/torus-evm-adapter";
import {Web3Auth} from "@web3auth/modal";

export const combine = async (web3auth: Web3Auth) => {

    // plugins and adapters are optional and can be added as per your requirement
    // read more about plugins here: https://web3auth.io/docs/sdk/web/plugins/

    // adding torus wallet connector plugin

    const torusPlugin = new TorusWalletConnectorPlugin(C.Torus.Goerli);
    await web3auth.addPlugin(torusPlugin);

    // read more about adapters here: https://web3auth.io/docs/sdk/web/adapters/

    // adding wallet connect v1 adapter

    const walletConnectV1Adapter = new WalletConnectV1Adapter(C.ConnectV1.Goerli);

    web3auth.configureAdapter(walletConnectV1Adapter);

    // adding metamask adapter

    const metamaskAdapter = new MetamaskAdapter(C.Metamask.Goerli);
    // we can change the above settings using this function
    // metamaskAdapter.setAdapterSettings();

    // it will add/update  the metamask adapter in to web3auth class
    web3auth.configureAdapter(metamaskAdapter);

    const torusWalletAdapter = new TorusWalletAdapter(C.Torus.Goerli);

    // it will add/update  the torus-evm adapter in to web3auth class
    web3auth.configureAdapter(torusWalletAdapter);

    return torusPlugin
}
