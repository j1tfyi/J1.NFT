import type { NextPage } from "next";
import Head from "next/head";
import { HomeView } from "../views";
import { candyMachineId } from "../config";

const Home: NextPage = (props) => {
  return (
    <>
      <Head>
        <title>J1.NFT Astronaut Mint</title>
        <meta name="description" content="Mint your J1.NFT Astronaut - Proof of Persistence" />
      </Head>
      <HomeView candyMachineId={candyMachineId} />
    </>
  );
};

export default Home;
