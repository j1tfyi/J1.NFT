import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { FC, useCallback, useMemo, useState } from 'react';
import { notify } from "../utils/notifications";
import useUserSOLBalanceStore from '../stores/useUserSOLBalanceStore';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { generateSigner, transactionBuilder, publicKey, some } from '@metaplex-foundation/umi';
import { fetchCandyMachine, mintV2, mplCandyMachine, safeFetchCandyGuard } from "@metaplex-foundation/mpl-candy-machine";
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { setComputeUnitLimit } from '@metaplex-foundation/mpl-toolbox';
import { clusterApiUrl } from '@solana/web3.js';
import * as bs58 from 'bs58';
import { mintGroups, groupPricing } from '../config';

// These access the environment variables we defined in the .env file
const quicknodeEndpoint = process.env.NEXT_PUBLIC_RPC || clusterApiUrl('mainnet-beta');
const candyMachineAddress = publicKey(process.env.NEXT_PUBLIC_CANDY_MACHINE_ID);
const treasury = publicKey(process.env.NEXT_PUBLIC_TREASURY);

export const CandyMint: FC = () => {
    const { connection } = useConnection();
    const wallet = useWallet();
    const { getUserSOLBalance } = useUserSOLBalanceStore();
    const [selectedGroup, setSelectedGroup] = useState<string>('public');

    const umi = useMemo(() =>
        createUmi(quicknodeEndpoint)
            .use(walletAdapterIdentity(wallet))
            .use(mplCandyMachine())
            .use(mplTokenMetadata()),
        [wallet, mplCandyMachine, walletAdapterIdentity, mplTokenMetadata, quicknodeEndpoint, createUmi]
    );

    const onClick = useCallback(async () => {
        if (!wallet.publicKey) {
            console.log('error', 'Wallet not connected!');
            notify({ type: 'error', message: 'error', description: 'Wallet not connected!' });
            return;
        }

        try {
            const candyMachine = await fetchCandyMachine(
                umi,
                candyMachineAddress,
            );
            const candyGuard = await safeFetchCandyGuard(
                umi,
                candyMachine.mintAuthority,
            );

            const nftMint = generateSigner(umi);

            const mintArgs: any = {};

            console.log('Minting with group:', selectedGroup);
            console.log('MintArgs:', mintArgs);

            const mintConfig: any = {
                candyMachine: candyMachine.publicKey,
                candyGuard: candyGuard?.publicKey,
                nftMint,
                collectionMint: candyMachine.collectionMint,
                collectionUpdateAuthority: candyMachine.authority,
                mintArgs,
            };

            // Don't use group parameter - mint from default guards only
            // Groups may not be configured on this candy machine

            const transaction = await transactionBuilder()
                .add(setComputeUnitLimit(umi, { units: 800_000 }))
                .add(mintV2(umi, mintConfig));
            const { signature } = await transaction.sendAndConfirm(umi, {
                confirm: { commitment: "confirmed" },
            });
            const txid = bs58.encode(signature);
            console.log('success', `Mint successful! ${txid}`)
            notify({ type: 'success', message: 'Mint successful!', txid });

            getUserSOLBalance(wallet.publicKey, connection);
        } catch (error: any) {
            notify({ type: 'error', message: `Error minting!`, description: error?.message });
            console.log('error', `Mint failed! ${error?.message}`);
        }
    }, [wallet, connection, getUserSOLBalance, umi, candyMachineAddress, treasury, selectedGroup]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', width: '100%', maxWidth: '600px' }}>
                <button
                    onClick={() => setSelectedGroup('bb')}
                    style={{
                        padding: '15px',
                        background: selectedGroup === 'bb' ? 'linear-gradient(135deg, #cc0000 0%, #ff3333 100%)' : 'linear-gradient(135deg, #990000 0%, #cc0000 100%)',
                        border: selectedGroup === 'bb' ? '2px solid #ff0000' : '2px solid #990000',
                        borderRadius: '8px',
                        color: 'white',
                        fontFamily: 'Audiowide, sans-serif',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: selectedGroup === 'bb' ? '0 6px 25px rgba(153, 0, 0, 0.6)' : '0 4px 20px rgba(153, 0, 0, 0.4)',
                        transform: selectedGroup === 'bb' ? 'translateY(-3px) scale(1.05)' : 'none'
                    }}
                >
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>BB Group</div>
                    <div style={{ fontSize: '1.1em', textShadow: '0 0 8px rgba(204, 0, 0, 0.5)' }}>{groupPricing.bb} SOL</div>
                </button>
                <button
                    onClick={() => setSelectedGroup('og')}
                    style={{
                        padding: '15px',
                        background: selectedGroup === 'og' ? 'linear-gradient(135deg, #cc0000 0%, #ff3333 100%)' : 'linear-gradient(135deg, #990000 0%, #cc0000 100%)',
                        border: selectedGroup === 'og' ? '2px solid #ff0000' : '2px solid #990000',
                        borderRadius: '8px',
                        color: 'white',
                        fontFamily: 'Audiowide, sans-serif',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: selectedGroup === 'og' ? '0 6px 25px rgba(153, 0, 0, 0.6)' : '0 4px 20px rgba(153, 0, 0, 0.4)',
                        transform: selectedGroup === 'og' ? 'translateY(-3px) scale(1.05)' : 'none'
                    }}
                >
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>OG Group</div>
                    <div style={{ fontSize: '1.1em', textShadow: '0 0 8px rgba(204, 0, 0, 0.5)' }}>{groupPricing.og} SOL</div>
                </button>
                <button
                    onClick={() => setSelectedGroup('j1t')}
                    style={{
                        padding: '15px',
                        background: selectedGroup === 'j1t' ? 'linear-gradient(135deg, #cc0000 0%, #ff3333 100%)' : 'linear-gradient(135deg, #990000 0%, #cc0000 100%)',
                        border: selectedGroup === 'j1t' ? '2px solid #ff0000' : '2px solid #990000',
                        borderRadius: '8px',
                        color: 'white',
                        fontFamily: 'Audiowide, sans-serif',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: selectedGroup === 'j1t' ? '0 6px 25px rgba(153, 0, 0, 0.6)' : '0 4px 20px rgba(153, 0, 0, 0.4)',
                        transform: selectedGroup === 'j1t' ? 'translateY(-3px) scale(1.05)' : 'none'
                    }}
                >
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>J1T Group</div>
                    <div style={{ fontSize: '1.1em', textShadow: '0 0 8px rgba(204, 0, 0, 0.5)' }}>{groupPricing.j1t} SOL</div>
                </button>
                <button
                    onClick={() => setSelectedGroup('public')}
                    style={{
                        padding: '15px',
                        background: selectedGroup === 'public' ? 'linear-gradient(135deg, #cc0000 0%, #ff3333 100%)' : 'linear-gradient(135deg, #990000 0%, #cc0000 100%)',
                        border: selectedGroup === 'public' ? '2px solid #ff0000' : '2px solid #990000',
                        borderRadius: '8px',
                        color: 'white',
                        fontFamily: 'Audiowide, sans-serif',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: selectedGroup === 'public' ? '0 6px 25px rgba(153, 0, 0, 0.6)' : '0 4px 20px rgba(153, 0, 0, 0.4)',
                        transform: selectedGroup === 'public' ? 'translateY(-3px) scale(1.05)' : 'none'
                    }}
                >
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Public Mint</div>
                    <div style={{ fontSize: '1.1em', textShadow: '0 0 8px rgba(204, 0, 0, 0.5)' }}>{groupPricing.public} SOL</div>
                </button>
            </div>
            <button
                style={{
                    padding: '16px',
                    fontSize: '28px',
                    minWidth: '300px',
                    borderRadius: '10px',
                    border: '2px solid #990000',
                    background: 'linear-gradient(135deg, #990000 0%, #cc0000 100%)',
                    color: 'white',
                    fontFamily: 'Audiowide, sans-serif',
                    cursor: wallet.publicKey ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 20px rgba(153, 0, 0, 0.4)',
                    textShadow: '0 0 8px rgba(255, 255, 255, 0.3)',
                    opacity: wallet.publicKey ? 1 : 0.5
                }}
                onClick={onClick}
                disabled={!wallet.publicKey}
                onMouseEnter={(e) => {
                    if (wallet.publicKey) {
                        e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 6px 25px rgba(153, 0, 0, 0.6)';
                        e.currentTarget.style.borderColor = '#ff0000';
                        e.currentTarget.style.background = 'linear-gradient(135deg, #cc0000 0%, #ff3333 100%)';
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(153, 0, 0, 0.4)';
                    e.currentTarget.style.borderColor = '#990000';
                    e.currentTarget.style.background = 'linear-gradient(135deg, #990000 0%, #cc0000 100%)';
                }}
            >
                Mint NFT - {groupPricing[selectedGroup as keyof typeof groupPricing]} SOL
            </button>
        </div>
    );
};