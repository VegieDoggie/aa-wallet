"use client";

import {Web3Auth} from "@web3auth/modal";
import {useEffect, useState} from "react";
import {C} from "@/config/c";
import styled from "styled-components";

const Between = styled.div`
  display: flex;
  justify-content: space-between;
`

const Button = styled.button`
  width: 10vw;
  height: 5vw;
`

const Title = styled.div`
  height: 5vw;
  font-size: 2rem;
  align-content: center;
  justify-content: center;
  color: #007e8d;
`

export default function App() {
    const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
    const [loggedIn, setLoggedIn] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                const web3auth = new Web3Auth(C.Web3Auth.Goerli);
                setWeb3auth(web3auth);
                await web3auth.initModal();
            } catch (error) {
                console.error(error);
            }
        };
        init().then(() => {
            setLoggedIn(web3auth?.status === "connected")
        });
    }, []);

    const login = async () => {
        await web3auth!.connect();
        setLoggedIn(web3auth?.status === "connected");
    };

    const logout = async () => {
        await web3auth!.logout();
        setLoggedIn(web3auth?.status === "connected");
    };

    if (loggedIn) {
        return (
            <>
                <Between>
                    <Title>
                        Social AA
                    </Title>
                    <Button onClick={logout} className="card">
                        Log Out
                    </Button>
                </Between>
                {/*TODO 把 web3auth.provider 传递下去*/}
            </>
        )
    }
    return (
        <>
            <Between>
                <Title>
                    Social Aa
                </Title>
                <Button onClick={login} className="card">
                    Login
                </Button>
            </Between>
        </>
    )
}
