import { AppProps } from 'next/app';
import Head from 'next/head';
import { FC } from 'react';
import { ContextProvider } from '../contexts/ContextProvider';
require('@solana/wallet-adapter-react-ui/styles.css');
require('../styles/globals.css');

const App: FC<AppProps> = ({ Component, pageProps }) => {
    return (
        <>
          <Head>
            <title>J1.NFT Astronaut Mint</title>
          </Head>

          <ContextProvider>
            <Component {...pageProps} />
          </ContextProvider>
        </>
    );
};

export default App;
