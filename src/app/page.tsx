"use client";

import {Web3Auth} from "@web3auth/modal";
import {useEffect, useState} from "react";
import {Config} from "@/config/config";
import styled from "styled-components";
import {ethers} from "ethers";
import {SmartAccountSponsor} from "@/service/SmartAccountSponsor";
import {ChainId} from "@biconomy/core-types";

const Main235 = styled.div`
  display: grid;
  grid-template-rows: repeat(auto-fit, minmax(1fr, 5fr));
`

const Between = styled.div`
  display: flex;
  justify-content: space-between;
`

const Button = styled.button`
  width: 6vw;
  min-width: 80px;
  height: 2.5vw;
  display: flex;
  justify-content: center;
  align-items: center;
`

const Title = styled.div`
  height: 5vw;
  font-size: 2rem;
  align-content: center;
  justify-content: center;
  color: #007e8d;
`

const Content = styled.div`
  border: #0d0f12 solid 1px;
  overflow-x: scroll
`

export default function App() {
    const [web3auth, setWeb3auth] = useState<Web3Auth>();
    const [loggedIn, setLoggedIn] = useState(false);
    const [smartAccount, setSmartAccount] = useState<SmartAccountSponsor>();
    const [content, setContent] = useState<string>("Undo Nothing!");
    const [pending, setPending] = useState(false);
    const refresh = async () => {
        setLoggedIn(web3auth?.status === "connected")
        if (web3auth?.provider) {
            const provider = new ethers.providers.Web3Provider(web3auth.provider);
            const signer = provider.getSigner();
            const smartAccount = await SmartAccountSponsor.New(signer, ChainId.ARBITRUM_GOERLI_TESTNET, {debug: true});
            setSmartAccount(smartAccount)
            // const priKey = await web3auth.provider.request({method: "eth_private_key"})
            // const wallet = new ethers.Wallet(priKey as string)
            // console.log("EOA:", wallet.address)
            // console.log("EOA PriKey:", priKey)
        }
    }

    useEffect(() => {
        const init = async () => {
            try {
                const web3auth = new Web3Auth(Config.Web3Auth.Goerli);
                setWeb3auth(web3auth);
                await web3auth.initModal();
            } catch (error) {
                console.error(error);
            }
        };
        init().then(refresh);
    }, []);

    const login = async () => {
        await web3auth!.connect();
        await refresh();
    };

    const logout = async () => {
        await web3auth!.logout();
        await refresh();
    };

    const mock = async () => {
        if (smartAccount) {
            setPending(true)
            const uniFace = new ethers.utils.Interface(Config.abi)
            const mint = {
                to: Config.erc20,
                data: uniFace.encodeFunctionData('sudoMint', [smartAccount.smartAccountAddress, 10000n * 10n ** 18n]),
            } as any
            const approve = {
                to: Config.erc20,
                data: uniFace.encodeFunctionData('approve', [Config.platform, 10000n * 10n ** 18n]),
            } as any
            const stake = {
                to: Config.platform,
                data: uniFace.encodeFunctionData('stake', [Config.erc20, 1n * 10n ** 18n]),
            } as any
            const partialUserOp = await smartAccount.buildUserOp([mint, approve, stake])
            const transactionDetails = await smartAccount.sendTransaction(partialUserOp)
            setPending(false)
            setContent(JSON.stringify(transactionDetails, null, 2))
        } else {
            console.log(`ERROR: missing smartAccount!!!`)
        }
    }

    const title = () => {
        return (
            <Title>
                Demo For Social-AA
            </Title>
        )
    }

    if (loggedIn) {
        return (
            <Main235>
                <Between>
                    {title()}
                    <Button onClick={logout} className="card">
                        Log Out
                    </Button>
                </Between>
                <div>
                    <button onClick={mock} className="card">
                        (with paymaster) Try [mint, approve, stake]
                    </button>
                </div>
                <Content>
                            <pre>
                            {pending ? "正在交易中..." :content}
                            </pre>
                </Content>
            </Main235>
        )
    }
    return (
        <Main235>
            <Between>
                {title()}
                <Button onClick={login} className="card">
                    Login
                </Button>
            </Between>
        </Main235>
    )
}
