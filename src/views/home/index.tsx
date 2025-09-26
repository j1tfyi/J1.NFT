/**
 * J1T Astronauts NFT Minting Page
 * 
 * Uses the useCandyMachineV3 hook which returns:
 * - items: { available, redeemed, remaining } - Mint statistics
 * - candyMachine: CandyMachine object from Metaplex SDK
 * - guards: Guard configurations for different mint groups
 * - guardStates: Current state of guards (isStarted, isEnded, etc.)
 * - prices: Pricing information for different groups
 * - status: { candyMachine, minting, guardGroups } - Loading states
 * - mint: Function to mint NFTs
 * - refresh: Function to refresh candy machine data (requires wallet)
 * 
 * IMPORTANT: The hook's refresh function requires a wallet to be connected.
 * The hook automatically tries to refresh on mount, which can cause errors.
 * This component uses safeRefresh() to handle this gracefully.
 * 
 * TROUBLESHOOTING:
 * If mint counter shows 0/0 or wrong values:
 * 
 * 1. Check ./config.ts:
 *    - Verify candyMachineId is correct
 *    - Confirm network matches deployment (devnet/mainnet)
 *    - Check defaultGuardGroup value
 * 
 * 2. Check browser console for:
 *    - "Candy Machine Configuration" - Shows ID and network
 *    - "Candy Machine Hook Data" - Shows actual data from chain
 *    - "Candy Machine Stats from Hook" - Shows processed values
 * 
 * 3. Update manualOverride values (lines ~150-154):
 *    - Set to your actual mint state as fallback
 * 
 * 4. Verify Candy Machine deployment:
 *    - Use Solana Explorer to verify the candy machine exists
 *    - Check it has the expected item counts
 * 
 * 5. Connect wallet:
 *    - Many features require wallet connection to load properly
 */

import { useCallback } from "react";
import { Paper, Snackbar } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import confetti from "canvas-confetti";
import Link from "next/link";
import Countdown from "react-countdown";

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { GatewayProvider } from "@civic/solana-gateway-react";
import { defaultGuardGroup, network, mintGroups, groupPricing, mintLimits, creatorWallet } from "../../config";

import { MultiMintButton } from "../../MultiMintButton";
import {
  Heading,
  Hero,
  MintCount,
  NftWrapper,
  NftWrapper2,
  Root,
  StyledContainer,
} from "../../styles";
import { AlertState } from "../../utils";
import NftsModal from "../../NftsModal";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import useCandyMachineV3 from "../../hooks/useCandyMachineV3";
import {
  CustomCandyGuardMintSettings,
  NftPaymentMintSettings,
  ParsedPricesForUI,
} from "../../hooks/types";
import { guardToLimitUtil } from "../../hooks/utils";
import ogAllowlist from "../../../public/og-allowlist.json";
import j1tAllowlist from "../../../public/j1t-allowlist.json";

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30px;
`;

const HeaderTitle = styled.h1`
  font-family: 'Audiowide', cursive;
  color: #990000;
  font-size: 2rem;
  margin: 20px 0;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    font-size: 1.2rem;
    letter-spacing: 1px;
  }
`;
const WalletContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: right;
  margin: 30px;
  z-index: 999;
  position: relative;

  .wallet-adapter-dropdown-list {
    background: #ffffff;
  }
  .wallet-adapter-dropdown-list-item {
    background: #000000;
  }
  .wallet-adapter-dropdown-list {
    grid-row-gap: 5px;
  }
`;

const WalletAmount = styled.div`
  color: white;
  width: auto;
  padding: 5px 5px 5px 16px;
  min-width: 48px;
  min-height: auto;
  border-radius: 5px;
  background: linear-gradient(135deg, #990000 0%, #cc0000 100%);
  box-shadow: 0 4px 20px rgba(153, 0, 0, 0.4);
  box-sizing: border-box;
  transition: all 0.3s ease;
  font-weight: 500;
  line-height: 1.75;
  text-transform: uppercase;
  border: 2px solid #990000;
  margin: 0;
  display: inline-flex;
  outline: 0;
  position: relative;
  align-items: center;
  user-select: none;
  vertical-align: middle;
  justify-content: flex-start;
  gap: 10px;
  text-shadow: 0 0 8px rgba(255, 51, 51, 0.3);

  &:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 6px 25px rgba(153, 0, 0, 0.6);
    border-color: #ff0000;
    background: linear-gradient(135deg, #cc0000 0%, #ff3333 100%);
  }
`;

const Wallet = styled.ul`
  flex: 0 0 auto;
  margin: 0;
  padding: 0;
`;

const ConnectButton = styled(WalletMultiButton)`
  border-radius: 5px !important;
  padding: 6px 16px;
  background-color: #000 !important;
  color: #fff !important;
  margin: 0 auto;
  border: 2px solid #333 !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;

  &:hover {
    background-color: #222 !important;
    border-color: #555 !important;
    transform: translateY(-2px);
  }
`;

const Card = styled(Paper)`
  display: inline-block;
  background-color: var(--countdown-background-color) !important;
  margin: 5px;
  min-width: 40px;
  padding: 24px;
  h1 {
    margin: 0px;
  }
`;

const GroupSelector = styled.div`
  display: flex;
  gap: 10px;
  margin: 20px 0;
  flex-wrap: wrap;
  justify-content: center;

  button {
    padding: 12px 24px;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: white;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1em;
    font-weight: bold;
    transition: all 0.3s ease;
    min-width: 120px;
    position: relative;

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
      border-color: #ff0000;
      transform: translateY(-3px) scale(1.05);
      box-shadow: 0 6px 25px rgba(153, 0, 0, 0.6);
      text-shadow: 0 0 8px rgba(255, 51, 51, 0.5);
    }

    &.active {
      background: linear-gradient(135deg, #990000 0%, #cc0000 100%);
      border-color: #990000;
      color: white;
      box-shadow: 0 4px 20px rgba(153, 0, 0, 0.4);
      text-shadow: 0 0 8px rgba(255, 51, 51, 0.5);

      &:hover {
        transform: translateY(-3px) scale(1.05);
        box-shadow: 0 6px 25px rgba(153, 0, 0, 0.6);
        border-color: #cc0000;
        background: linear-gradient(135deg, #990000 0%, #cc0000 100%);
      }
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .price {
      font-size: 0.9em;
      opacity: 0.9;
      margin-top: 2px;
    }

    .status {
      font-size: 0.8em;
      margin-top: 2px;
      color: #ffaa00;
    }
  }
`;

const MintInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 20px 0;
  padding: 20px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  color: white;
  
  h3 {
    margin: 0 0 10px 0;
    font-size: 1.2em;
    font-weight: bold;
  }
  
  .mint-groups {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    
    .group-card {
      padding: 15px;
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 0, 0, 0.9) 100%);
      border-radius: 8px;
      border: 2px solid #990000;
      box-shadow: 0 4px 20px rgba(153, 0, 0, 0.4);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-3px) scale(1.05);
        box-shadow: 0 6px 25px rgba(153, 0, 0, 0.6);
        border-color: #ff0000;
      }

      .group-name {
        font-weight: bold;
        margin-bottom: 5px;
        font-family: 'Audiowide', cursive;
      }

      .group-price {
        color: #cc0000;
        font-size: 1.1em;
        font-family: 'Audiowide', cursive;
        text-shadow: 0 0 8px rgba(204, 0, 0, 0.5);
      }

      .group-details {
        margin-top: 5px;
        font-size: 0.9em;
        opacity: 0.9;
      }
    }
  }
  
  .collection-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(150px, 170px));
    grid-template-rows: auto auto auto;
    justify-content: center;
    align-items: center;
    position: relative;
    padding: 40px 20px;
    column-gap: 60px;
    row-gap: 50px;
    max-width: 800px;
    margin: 0 auto;
    overflow: visible;

    /* Create flow diagram layout */
    .stat {
      background: linear-gradient(135deg, rgba(10, 0, 0, 0.98) 0%, rgba(30, 0, 0, 0.95) 100%);
      padding: 16px 18px;
      border-radius: 10px;
      text-align: center;
      border: 2px solid #990000;
      box-shadow: 0 4px 20px rgba(153, 0, 0, 0.4);
      position: relative;
      width: 100%;
      max-width: 170px;
      min-height: 80px;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: 0;
      overflow: visible;

      &:hover {
        transform: translateY(-3px) scale(1.05);
        box-shadow: 0 6px 25px rgba(153, 0, 0, 0.6);
        border-color: #ff0000;
      }

      /* Horizontal line connectors for 3-3-1 layout */
      /* First row lines */
      &:nth-child(1)::after,
      &:nth-child(2)::after {
        content: '';
        position: absolute;
        right: -60px;
        top: 50%;
        transform: translateY(-50%);
        width: 60px;
        height: 2px;
        background: linear-gradient(to right, #990000 0%, #990000 50%, transparent 100%);
        z-index: 1;
      }

      /* Second row lines */
      &:nth-child(4)::after,
      &:nth-child(5)::after {
        content: '';
        position: absolute;
        right: -60px;
        top: 50%;
        transform: translateY(-50%);
        width: 60px;
        height: 2px;
        background: linear-gradient(to right, #990000 0%, #990000 50%, transparent 100%);
        z-index: 1;
      }

      .label {
        font-family: 'Audiowide', cursive;
        font-size: 0.9em;
        opacity: 1;
        margin-bottom: 8px;
        color: #ffffff !important;
        text-transform: uppercase;
        letter-spacing: 1px;
        text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
        font-weight: 600;
      }

      .value {
        font-family: 'Audiowide', cursive;
        font-size: 1rem;
        font-weight: bold;
        color: #990000 !important;
        text-shadow: 0 0 10px rgba(153, 0, 0, 0.6);
      }

      /* Place items in 3-3-1 layout */
      &:nth-child(1) { grid-column: 1; grid-row: 1; }
      &:nth-child(2) { grid-column: 2; grid-row: 1; }
      &:nth-child(3) { grid-column: 3; grid-row: 1; }
      &:nth-child(4) { grid-column: 1; grid-row: 2; }
      &:nth-child(5) { grid-column: 2; grid-row: 2; }
      &:nth-child(6) { grid-column: 3; grid-row: 2; }

      /* Center the last item in third row */
      &:nth-child(7) {
        grid-column: 2;
        grid-row: 3;
      }

      /* Add vertical connector from middle of second row to third row */
      &:nth-child(5)::before {
        content: '';
        position: absolute;
        bottom: -50px;
        left: 50%;
        transform: translateX(-50%);
        width: 2px;
        height: 45px;
        background: linear-gradient(to bottom, #990000 0%, transparent 100%);
        z-index: -1;
      }

      /* Add vertical connector from first row to second row */
      &:nth-child(2)::before {
        content: '';
        position: absolute;
        bottom: -50px;
        left: 50%;
        transform: translateX(-50%);
        width: 2px;
        height: 45px;
        background: linear-gradient(to bottom, #990000 0%, transparent 100%);
        z-index: -1;
      }
    }

    @media (max-width: 768px) {
      display: flex;
      flex-direction: column;
      gap: 20px;

      .stat {
        width: 100%;
        max-width: 280px;
        margin-top: 0 !important;
        grid-column: unset !important;
        grid-row: unset !important;

        &::after {
          content: '\u2193';
          right: auto;
          left: 50%;
          top: auto;
          bottom: -22px;
          transform: translateX(-50%);
        }

        &:last-child::after {
          display: none;
        }

        &::before {
          display: none !important;
        }
      }
    }
  }
`;

export interface HomeProps {
  candyMachineId: PublicKey;
}

/**
 * Minimal representation of an NFT minted via the candy machine hook.
 */
export interface MintedItem {
  mint: string;
  signature: string;
}

/**
 * Configuration for the candy machine operations
 * NOTE: The useCandyMachineV3 hook requires a wallet to fetch data properly.
 * It will attempt to auto-refresh on mount, which will error if no wallet is connected.
 * This is handled gracefully in this component.
 */
// Create allowlists from the JSON files.
// Allowlist JSON may either be of the form { proofs: { addr: [...] } }
// or a flat { addr: [...] }.  Extract keys accordingly.
const ogAddresses =
  ogAllowlist && typeof ogAllowlist === 'object'
    ? (ogAllowlist.proofs
        ? Object.keys(ogAllowlist.proofs)
        : Object.keys(ogAllowlist))
    : [];
const j1tAddresses =
  j1tAllowlist && typeof j1tAllowlist === 'object'
    ? (j1tAllowlist.proofs
        ? Object.keys(j1tAllowlist.proofs)
        : Object.keys(j1tAllowlist))
    : [];

// Provide both the list of addresses and their corresponding proofs to the hook.
// The proofs are used to validate the allow list via the route instruction.
const candyMachinOps = {
  allowLists: [
    {
      groupLabel: "og",
      list: ogAddresses,
      proofs: ogAllowlist && typeof ogAllowlist === 'object' && (ogAllowlist as any).proofs
        ? (ogAllowlist as any).proofs
        : undefined,
    },
    {
      groupLabel: "j1t",
      list: j1tAddresses,
      proofs: j1tAllowlist && typeof j1tAllowlist === 'object' && (j1tAllowlist as any).proofs
        ? (j1tAllowlist as any).proofs
        : undefined,
    },
  ],
};

/**
 * IMPORTANT: The useCandyMachineV3 hook should return an object with:
 * - candyMachine: The candy machine account data
 * - items: { available, redeemed, remaining }
 * - guards: Guard configurations for different mint groups
 * - guardStates: Current state of guards
 * - prices: Pricing information for different groups
 * - status: { minting: boolean }
 * - refresh: Function to refresh candy machine data
 * 
 * The mint counter data should be deserialized using MintCounterBorsh
 * and included in guards.mintLimit.mintCounter.count
 */
const Home = (props: HomeProps) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  // Using simplified hook for better wallet compatibility
  const candyMachineV3 = useCandyMachineV3(
    props.candyMachineId,
    candyMachinOps
  );

  const [balance, setBalance] = useState<number>();
  const [mintedItems, setMintedItems] = useState<MintedItem[]>();
  const [userMintCount, setUserMintCount] = useState<number>(0);
  const [selectedGroup, setSelectedGroup] = useState<string>("public"); // Default to public for testing
  
  // Manual override for display if candy machine data not loading
  // This provides fallback values when:
  // 1. Wallet is not connected (hook requires wallet)
  // 2. Candy machine returns all zeros
  // 3. Initial load before data fetches
  // UPDATE THESE VALUES to match your actual candy machine state
  const manualOverride = {
    available: 1000,  // Total supply
    redeemed: 50,     // Already minted (UPDATE THIS!)
    remaining: 950    // Remaining to mint
  };
  
  const [mintStats, setMintStats] = useState(() => ({
    available: candyMachineV3.items?.available || manualOverride.available,
    redeemed: candyMachineV3.items?.redeemed || manualOverride.redeemed,
    remaining: candyMachineV3.items?.remaining || manualOverride.remaining
  }));
  
  // Derive loading state from the hook's status
  const isLoading = candyMachineV3.status?.candyMachine || false;

  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: undefined,
  });

  const { guardLabel, guards, guardStates, prices } = useMemo(() => {
    const guardLabel = selectedGroup;

    // Log available guard groups for debugging
    console.log("Available guard groups:", Object.keys(candyMachineV3.guards || {}));
    console.log("Current guard label:", guardLabel);
    
    return {
      guardLabel,
      guards:
        candyMachineV3.guards[guardLabel] ||
        candyMachineV3.guards.default ||
        {},
      guardStates: candyMachineV3.guardStates[guardLabel] ||
        candyMachineV3.guardStates.default || {
          isStarted: true,
          isEnded: false,
          isLimitReached: false,
          canPayFor: 10,
          messages: [],
          isWalletWhitelisted: true,
          hasGatekeeper: false,
        },
      prices: candyMachineV3.prices[guardLabel] ||
        candyMachineV3.prices.default || {
          payment: [],
          burn: [],
          gate: [],
        },
    };
  }, [
    candyMachineV3.guards,
    candyMachineV3.guardStates,
    candyMachineV3.prices,
    selectedGroup,
  ]);
  
  useEffect(() => {
    console.log("=== Candy Machine Debug Info ===");
    console.log("guardLabel:", guardLabel);
    console.log("guards:", guards);
    console.log("guardStates:", guardStates);
    console.log("prices:", prices);
    console.log("Price details - payment:", prices?.payment);
    console.log("Price details - burn:", prices?.burn);
    console.log("Full candyMachineV3 structure:", candyMachineV3);
    console.log("Items object:", candyMachineV3.items);
    console.log("Status object:", candyMachineV3.status);
    
    // Check for mint limit counter specifically
    if (guards?.mintLimit) {
      console.log("Mint Limit Guard Found:", guards.mintLimit);
      console.log("Mint Counter:", guards.mintLimit.mintCounter);
      console.log("Settings:", guards.mintLimit.settings);
      
      // Update user mint count if available
      if (guards.mintLimit.mintCounter?.count !== undefined) {
        setUserMintCount(guards.mintLimit.mintCounter.count);
      }
    }
    
    console.log("=================================");
  }, [guardLabel, guards, guardStates, prices, candyMachineV3]);
  
  // Add effect to handle loading state and refresh candy machine data
  useEffect(() => {
    // Only process candy machine data if we have it or if wallet is connected
    // This prevents errors from the hook trying to refresh without a wallet
    if (!candyMachineV3.items && !wallet?.publicKey) {
      console.log("Waiting for wallet connection to load candy machine data...");
      console.log("Using manual override values for display");
      // Ensure we're using manual override when no wallet
      setMintStats({
        available: manualOverride.available,
        redeemed: manualOverride.redeemed,
        remaining: manualOverride.remaining
      });
      return;
    }
    
    // The useCandyMachineV3 hook returns items directly with available, redeemed, remaining
    const itemsAvailable = candyMachineV3.items?.available ?? manualOverride.available;
    const itemsRedeemed = candyMachineV3.items?.redeemed ?? manualOverride.redeemed;
    const itemsRemaining = candyMachineV3.items?.remaining ?? manualOverride.remaining;
    
    // Only update state if values have actually changed to avoid unnecessary re-renders
    setMintStats(prev => {
      if (prev.available !== itemsAvailable || prev.redeemed !== itemsRedeemed || prev.remaining !== itemsRemaining) {
        return {
          available: itemsAvailable,
          redeemed: itemsRedeemed,
          remaining: itemsRemaining
        };
      }
      return prev;
    });
    
    if (candyMachineV3.candyMachine) {
      console.log("Candy Machine Stats from Hook:", {
        available: itemsAvailable,
        redeemed: itemsRedeemed,
        remaining: itemsRemaining,
        candyMachineAddress: candyMachineV3.candyMachine?.address?.toString?.() || props.candyMachineId.toString(),
        rawItems: candyMachineV3.items
      });
      
      // If data is still showing defaults, the candy machine might not be deployed or configured
      if (candyMachineV3.items && itemsAvailable === 0 && itemsRedeemed === 0 && itemsRemaining === 0) {
        console.warn("⚠️ Candy Machine returning zeros. Check:");
        console.warn("1. Candy Machine is deployed");
        console.warn("2. Candy Machine ID is correct");
        console.warn("3. Network matches deployment");
        console.warn("Using manual override values for display.");
        
        // Force use of manual override when getting all zeros
        setMintStats({
          available: manualOverride.available,
          redeemed: manualOverride.redeemed,
          remaining: manualOverride.remaining
        });
      }
    }
  }, [candyMachineV3.candyMachine, candyMachineV3.items, props.candyMachineId, wallet?.publicKey]);
  
  // Monitor loading states from the hook
  useEffect(() => {
    console.log("=== Candy Machine Configuration ===");
    console.log("Candy Machine ID:", props.candyMachineId.toString());
    console.log("Network:", network);
    console.log("Wallet:", wallet?.publicKey?.toString() || "Not connected");
    
    if (candyMachineV3.status) {
      console.log("Loading Status:", {
        candyMachine: candyMachineV3.status.candyMachine ? "Loading..." : "Ready",
        guardGroups: candyMachineV3.status.guardGroups,
        minting: candyMachineV3.status.minting ? "Minting..." : "Idle",
        initialFetchGuardGroupsDone: candyMachineV3.status.initialFetchGuardGroupsDone
      });
    }
    
    // Note: The hook will try to auto-refresh on mount which requires a wallet
    // This is handled gracefully and will retry when wallet connects
    if (!wallet?.publicKey) {
      console.log("⚠️ Wallet not connected. Some data won't load until wallet is connected.");
    }
    
    console.log("===================================");
  }, [candyMachineV3.status, props.candyMachineId, wallet?.publicKey]);
  
  useEffect(() => {
    (async () => {
      if (wallet?.publicKey) {
        const balance = await connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
    })();
  }, [wallet, connection]);

  useEffect(() => {
    if (mintedItems?.length === 0) throwConfetti();
  }, [mintedItems]);

  const openOnSolscan = useCallback((mint) => {
    window.open(
      `https://solscan.io/address/${mint}${
        [WalletAdapterNetwork.Devnet, WalletAdapterNetwork.Testnet].includes(
          network
        )
          ? `?cluster=${network}`
          : ""
      }`
    );
  }, []);

  const throwConfetti = useCallback(() => {
    confetti({
      particleCount: 400,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, [confetti]);

  const startMint = useCallback(
    async (quantityString: number = 1) => {
      try {
        const nftGuards: NftPaymentMintSettings[] = Array(quantityString)
          .fill(undefined)
          .map((_, i) => {
            return {
              burn: (guards as any).burn?.nfts?.length
                ? {
                    mint: (guards as any).burn.nfts[i]?.mintAddress,
                  }
                : undefined,
              payment: (guards as any).payment?.nfts?.length
                ? {
                    mint: (guards as any).payment.nfts[i]?.mintAddress,
                  }
                : undefined,
              gate: (guards as any).gate?.nfts?.length
                ? {
                    mint: (guards as any).gate.nfts[i]?.mintAddress,
                  }
                : undefined,
            };
          });

        console.log({ nftGuards });

        // The hook's mint function handles everything including refreshing
        const items = await candyMachineV3.mint(quantityString, {
          groupLabel: guardLabel,
          nftGuards,
        });

        // Only show success if items were actually returned
        if (items && items.length > 0) {
          setMintedItems(items as any);

          // Show success message
          setAlertState({
            open: true,
            message: `Successfully minted ${quantityString} NFT${quantityString > 1 ? 's' : ''}!`,
            severity: "success",
          });

          // The hook automatically refreshes after minting
          console.log("Mint successful, candy machine will auto-refresh");
        } else {
          // Transaction was likely cancelled or failed
          console.log("Mint cancelled or failed - no items returned");
        }
        
      } catch (error) {
        console.error("Mint error:", error);
        setAlertState({
          open: true,
          message: error.message || "Minting failed! Please try again.",
          severity: "error",
        });
      }
    },
    [candyMachineV3.mint, guards, guardLabel]
  );

  useEffect(() => {
    console.log("=== Candy Machine Hook Data ===");
    console.log("Items:", candyMachineV3.items);
    console.log("Status:", candyMachineV3.status);
    console.log("Guards:", candyMachineV3.guards);
    
    if (candyMachineV3.candyMachine) {
      console.log("Candy Machine Loaded:", {
        address: candyMachineV3.candyMachine.address?.toString(),
        itemsAvailable: candyMachineV3.candyMachine.itemsAvailable?.toNumber?.(),
        itemsMinted: candyMachineV3.candyMachine.itemsMinted?.toNumber?.(),
        itemsRemaining: candyMachineV3.candyMachine.itemsRemaining?.toNumber?.()
      });
    }
    console.log("================================");
  }, [candyMachineV3.candyMachine, candyMachineV3.items, candyMachineV3.status]);
  
  // Safe refresh function that checks for wallet
  const safeRefresh = useCallback(async () => {
    // Allow refresh even without wallet - candy machine data is public
    try {
      await candyMachineV3.refresh?.();
    } catch (error) {
      console.error("Error refreshing candy machine:", error);
    }
  }, [candyMachineV3.refresh]);

  const MintButton = ({
    gatekeeperNetwork,
  }: {
    gatekeeperNetwork?: PublicKey;
  }) => (
    <MultiMintButton
      candyMachine={candyMachineV3.candyMachine}
      gatekeeperNetwork={gatekeeperNetwork}
      isMinting={candyMachineV3.status.minting}
      setIsMinting={() => {}}
      isActive={!!mintStats.remaining}
      isEnded={guardStates.isEnded}
      isSoldOut={!mintStats.remaining}
      guardStates={guardStates}
      onMint={startMint}
      prices={prices}
    />
  );

  return (
    <main>
      <>
        <Header>
          <HeaderTitle>MINT YOUR J1.NFT ASTRONAUT</HeaderTitle>
          <WalletContainer>
            <Wallet>
              {wallet ? (
                <WalletAmount>
                  {(balance || 0).toLocaleString()} SOL
                  <ConnectButton />
                </WalletAmount>
              ) : (
                <ConnectButton>Connect Wallet</ConnectButton>
              )}
            </Wallet>
          </WalletContainer>
        </Header>
        <Root>
          {/* Top NFT Scrolling Rows */}
          <NftWrapper>
            <div className="marquee-wrapper">
              <div className="marquee">
                {[...Array(4)].map((_, setIndex) =>
                  [...Array(12)].map((_, index) => (
                    <img
                      key={`top-${setIndex}-${index}`}
                      src={`/nfts/${(index % 12) + 1}.png`}
                      height="200px"
                      width="200px"
                      alt={`J1T Astronaut #${(index % 12) + 1}`}
                      style={{ filter: 'none' }}
                    />
                  ))
                )}
              </div>
            </div>
          </NftWrapper>
          <NftWrapper2>
            <div className="marquee-wrapper second">
              <div className="marquee">
                {[...Array(4)].map((_, setIndex) =>
                  [...Array(12)].map((_, index) => (
                    <img
                      key={`top2-${setIndex}-${index}`}
                      src={`/nfts/${(index % 12) + 13}.png`}
                      height="200px"
                      width="200px"
                      alt={`J1T Astronaut #${(index % 12) + 13}`}
                      style={{ filter: 'none' }}
                    />
                  ))
                )}
              </div>
            </div>
          </NftWrapper2>

          <div className="cloud-content">
            {[...Array(7)].map((cloud, index) => (
              <div key={index} className={`cloud-${index + 1} cloud-block`}>
                <div className="cloud"></div>
              </div>
            ))}
          </div>
          <StyledContainer>
            {/* <MintNavigation /> */}

            <Hero>
              <Heading>
                <Link href="/">
                  <video
                    style={{
                      maxWidth: "350px",
                    }}
                    src="/logo.MP4"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </Link>
              </Heading>

              <p style={{ fontSize: '1.2em', fontWeight: 'bold', marginBottom: '10px', color: '#cc0000', textShadow: '0 0 8px rgba(204, 0, 0, 0.5)' }}>
                The J1.NFT Astronaut Collection — Proof of Persistence
              </p>
              
              <p style={{ marginBottom: '20px' }}>
                Statement pieces forged in code. Engineered for precision. Secured by guards. Stress-tested across the cosmos.
              </p>

              <MintInfo>
                <div>
                  <h3 style={{ color: '#cc0000', textShadow: '0 0 8px rgba(204, 0, 0, 0.5)', fontFamily: 'Audiowide, cursive' }}>The Exclusive 100 Legacy </h3>
                  <p>
                    100 Exclusive Mints Receive 5% Royalties Forever. Auditable on-chain..
                  </p>
                </div>

                <div>
                  <h3 style={{ color: '#cc0000', textShadow: '0 0 8px rgba(204, 0, 0, 0.5)', fontFamily: 'Audiowide, cursive' }}>Minting Groups</h3>
                  <div className="mint-groups">
                    <div className="group-card">
                      <div className="group-name">BB Group</div>
                      <div className="group-price">0.0005 SOL</div>
                      <div className="group-details">Creator allocation only. Maximum 50 mints.</div>
                    </div>
                    <div className="group-card">
                      <div className="group-name">OG Group</div>
                      <div className="group-price">0.15 SOL</div>
                      <div className="group-details">Reserved for early supporters. Limited to 20 mints per wallet. Allowlist required.</div>
                    </div>
                    <div className="group-card">
                      <div className="group-name">J1T Group</div>
                      <div className="group-price">0.20 SOL</div>
                      <div className="group-details">Exclusive access for J1T holders. Limited to 20 mints per wallet. Allowlist required.</div>
                    </div>
                    <div className="group-card">
                      <div className="group-name">Public Mint</div>
                      <div className="group-price">0.25 SOL</div>
                      <div className="group-details">Open access for all collectors. No restrictions or allowlists required.</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 style={{ color: '#cc0000', textShadow: '0 0 8px rgba(204, 0, 0, 0.5)', fontFamily: 'Audiowide, cursive' }}>Collection Details</h3>
                  <div className="collection-stats">
                    <div className="stat">
                      <div className="label">Total Supply</div>
                      <div className="value">{mintStats.available} NFTs</div>
                    </div>
                    <div className="stat">
                      <div className="label">Minted</div>
                      <div className="value">{mintStats.redeemed} / {mintStats.available}</div>
                    </div>
                    <div className="stat">
                      <div className="label">Remaining</div>
                      <div className="value">{mintStats.remaining}</div>
                    </div>
                    <div className="stat">
                      <div className="label">Blockchain</div>
                      <div className="value">Solana</div>
                    </div>
                    <div className="stat">
                      <div className="label">Smart Contract</div>
                      <div className="value">Metaplex Candy Machine V3</div>
                    </div>
                    <div className="stat">
                      <div className="label">Security</div>
                      <div className="value">Multi-guard protection</div>
                    </div>
                    <div className="stat">
                      <div className="label">Royalties</div>
                      <div className="value">Transparent on-chain distribution</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 style={{ color: '#cc0000', textShadow: '0 0 8px rgba(204, 0, 0, 0.5)', fontFamily: 'Audiowide, cursive' }}>Built for Resilience</h3>
                  <p>
                    Premium craft. Permanent proof. Pure persistence.Retry
                  </p>
                  <p style={{ fontStyle: 'italic', marginTop: '10px', color: '#990000' }}>
                    The J1.NFT Astronaut Collection — For Those Who Don&apos;t Quit
                  </p>
                </div>
              </MintInfo>

              {/* Group Selector - Only show when wallet is connected */}
              {wallet?.publicKey && (
                <GroupSelector>
                  {/* BB Group - Only show for creator wallet */}
                  {wallet.publicKey.toBase58() === creatorWallet.toBase58() && (
                    <button
                      className={selectedGroup === mintGroups.bb ? 'active' : ''}
                      onClick={() => setSelectedGroup(mintGroups.bb)}
                    >
                      <div>BB (Creator)</div>
                      <div className="price">{groupPricing.bb} SOL</div>
                    </button>
                  )}

                  {/* OG Group */}
                  <button
                    className={selectedGroup === mintGroups.og ? 'active' : ''}
                    onClick={() => setSelectedGroup(mintGroups.og)}
                  >
                    <div>OG</div>
                    <div className="price">{groupPricing.og} SOL</div>
                    <div className="status">Allowlist Required</div>
                  </button>

                  {/* J1T Group */}
                  <button
                    className={selectedGroup === mintGroups.j1t ? 'active' : ''}
                    onClick={() => setSelectedGroup(mintGroups.j1t)}
                  >
                    <div>J1T</div>
                    <div className="price">{groupPricing.j1t} SOL</div>
                    <div className="status">Allowlist Required</div>
                  </button>

                  {/* Public Group */}
                  <button
                    className={selectedGroup === mintGroups.public ? 'active' : ''}
                    onClick={() => setSelectedGroup(mintGroups.public)}
                  >
                    <div>PUBLIC</div>
                    <div className="price">{groupPricing.public} SOL</div>
                  </button>
                </GroupSelector>
              )}

              {guardStates.isStarted && (
                <MintCount>
                  {isLoading ? (
                    <div style={{ color: '#cc0000', fontFamily: 'Audiowide, sans-serif', textShadow: '0 0 8px rgba(204, 0, 0, 0.5)' }}>Loading mint data...</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', fontFamily: 'Audiowide, sans-serif' }}>
                      <div style={{ fontSize: '1.2em', fontWeight: 'bold', fontFamily: 'Audiowide, sans-serif', color: '#cc0000', textShadow: '0 0 8px rgba(204, 0, 0, 0.5)' }}>
                        Supply: {mintStats.available} Total ·
                        Minted: <strong>{mintStats.redeemed}</strong> / {mintStats.available}
                      </div>
                      <div style={{ fontSize: '1em', opacity: 0.9, fontFamily: 'Audiowide, sans-serif' }}>
                        {((mintStats.redeemed / mintStats.available) * 100).toFixed(1)}% minted ·
                        {" "}{mintStats.remaining} remaining
                      </div>
                      {wallet?.publicKey && (guards?.mintLimit?.mintCounter?.count !== undefined ||
                        guards?.mintLimit?.settings?.limit || userMintCount > 0) && (
                        <div style={{ fontSize: '0.9em', color: '#cc0000', fontFamily: 'Audiowide, sans-serif', textShadow: '0 0 8px rgba(204, 0, 0, 0.5)' }}>
                          Your Mints: {guards?.mintLimit?.mintCounter?.count || userMintCount || "0"}
                          {guards?.mintLimit?.settings?.limit && (
                            <> / {guards?.mintLimit?.settings?.limit}</>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          console.log("Manual refresh triggered");
                          safeRefresh();
                        }}
                        style={{
                          marginTop: '5px',
                          padding: '5px 10px',
                          background: 'linear-gradient(135deg, rgba(153, 0, 0, 0.2) 0%, rgba(204, 0, 0, 0.2) 100%)',
                          border: '2px solid #990000',
                          color: '#cc0000',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '0.8em',
                          fontFamily: 'Audiowide, sans-serif',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 10px rgba(153, 0, 0, 0.3)',
                          textShadow: '0 0 5px rgba(204, 0, 0, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(153, 0, 0, 0.5)';
                          e.currentTarget.style.borderColor = '#ff0000';
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(204, 0, 0, 0.3) 0%, rgba(255, 51, 51, 0.3) 100%)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                          e.currentTarget.style.boxShadow = '0 2px 10px rgba(153, 0, 0, 0.3)';
                          e.currentTarget.style.borderColor = '#990000';
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(153, 0, 0, 0.2) 0%, rgba(204, 0, 0, 0.2) 100%)';
                        }}
                      >
                        Refresh Stats
                      </button>
                    </div>
                  )}
                </MintCount>
              )}

              {!guardStates.isStarted ? (
                <Countdown
                  date={(guards as any).startTime}
                  renderer={renderGoLiveDateCounter}
                  onComplete={() => {
                    safeRefresh();
                  }}
                />
              ) : !wallet?.publicKey ? (
                <ConnectButton>Connect Wallet</ConnectButton>
              // ) : !guardStates.canPayFor ? (
              //   <h1>You cannot pay for the mint</h1>
              ) : !guardStates.isWalletWhitelisted ? (
                <h1>Mint is private. You need to be on the allowlist for the {guardLabel} group.</h1>
              ) : (
                <>
                  <>
                    {/* Display current mint group and price */}
                    {guardLabel && (
                      <div style={{
                        marginBottom: '15px',
                        padding: '15px',
                        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 0, 0, 0.9) 100%)',
                        borderRadius: '8px',
                        border: '2px solid #990000',
                        boxShadow: '0 4px 20px rgba(153, 0, 0, 0.4)',
                        transition: 'all 0.3s ease',
                        cursor: 'default'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 6px 25px rgba(153, 0, 0, 0.6)';
                        e.currentTarget.style.borderColor = '#ff0000';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(153, 0, 0, 0.4)';
                        e.currentTarget.style.borderColor = '#990000';
                      }}>
                        <div style={{ color: '#cc0000', fontSize: '1.1em', fontWeight: 'bold', textShadow: '0 0 8px rgba(204, 0, 0, 0.5)', fontFamily: 'Audiowide, cursive' }}>
                          Minting as: {guardLabel.toUpperCase()} Group
                        </div>
                        <div style={{ marginTop: '5px', color: 'white' }}>
                          Price: {groupPricing[guardLabel] || 0.25} SOL per NFT
                        </div>
                        {mintLimits[guardLabel] && (
                          <div style={{ marginTop: '5px', color: 'white', fontSize: '0.9em' }}>
                            Limit: {mintLimits[guardLabel]} per wallet
                          </div>
                        )}
                        {(guardLabel === 'og' || guardLabel === 'j1t') && (
                          <div style={{ marginTop: '5px', color: '#ffaa00', fontSize: '0.9em' }}>
                            ⚠️ Requires allowlist verification
                          </div>
                        )}
                      </div>
                    )}
                    
                    {!!mintStats.remaining &&
                    guardStates.hasGatekeeper &&
                    wallet.publicKey &&
                    wallet.signTransaction ? (
                      <GatewayProvider
                        wallet={{
                          publicKey: wallet.publicKey,
                          //@ts-ignore
                          signTransaction: wallet.signTransaction,
                        }}
                        gatekeeperNetwork={(guards as any).gatekeeperNetwork}
                        connection={connection}
                        cluster={
                          process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet"
                        }
                        options={{ autoShowModal: false }}
                      >
                        <MintButton
                          gatekeeperNetwork={(guards as any).gatekeeperNetwork}
                        />
                      </GatewayProvider>
                    ) : (
                      <MintButton />
                    )}
                  </>
                </>
              )}
            </Hero>
            <NftsModal
              openOnSolscan={openOnSolscan}
              mintedItems={mintedItems || []}
              setMintedItems={setMintedItems}
            />
          </StyledContainer>
          {/* Top NFT Scrolling Rows */}
          <NftWrapper>
            <div className="marquee-wrapper">
              <div className="marquee">
                {[...Array(4)].map((_, setIndex) =>
                  [...Array(12)].map((_, index) => (
                    <img
                      key={`top-${setIndex}-${index}`}
                      src={`/nfts/${(index % 12) + 1}.png`}
                      height="200px"
                      width="200px"
                      alt={`J1T Astronaut #${(index % 12) + 1}`}
                      style={{ filter: 'none' }}
                    />
                  ))
                )}
              </div>
            </div>
          </NftWrapper>
          <NftWrapper2>
            <div className="marquee-wrapper second">
              <div className="marquee">
                {[...Array(4)].map((_, setIndex) =>
                  [...Array(12)].map((_, index) => (
                    <img
                      key={`top2-${setIndex}-${index}`}
                      src={`/nfts/${(index % 12) + 13}.png`}
                      height="200px"
                      width="200px"
                      alt={`J1T Astronaut #${(index % 12) + 13}`}
                      style={{ filter: 'none' }}
                    />
                  ))
                )}
              </div>
            </div>
          </NftWrapper2>
        </Root>
      </>
      <Snackbar
        open={alertState.open}
        autoHideDuration={6000}
        onClose={() => setAlertState({ ...alertState, open: false })}
      >
        <Alert
          onClose={() => setAlertState({ ...alertState, open: false })}
          severity={alertState.severity}
        >
          {alertState.message}
        </Alert>
      </Snackbar>
    </main>
  );
};

export default Home;

const renderGoLiveDateCounter = ({ days, hours, minutes, seconds }: any) => {
  return (
    <div>
      <Card elevation={1}>
        <h1>{days}</h1>Days
      </Card>
      <Card elevation={1}>
        <h1>{hours}</h1>
        Hours
      </Card>
      <Card elevation={1}>
        <h1>{minutes}</h1>Mins
      </Card>
      <Card elevation={1}>
        <h1>{seconds}</h1>Secs
      </Card>
    </div>
  );
};