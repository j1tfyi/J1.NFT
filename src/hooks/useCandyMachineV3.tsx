import { Buffer } from "buffer";

// Ensure Buffer is globally available
if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || Buffer;
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  publicKey,
  some,
  generateSigner,
  transactionBuilder,
  PublicKey as UmiPublicKey,
} from "@metaplex-foundation/umi";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import {
  mplCandyMachine,
  mintV2,
  route,
  fetchCandyMachine,
  getMerkleRoot,
  getMerkleProof,
} from "@metaplex-foundation/mpl-candy-machine";
import { setComputeUnitLimit, setComputeUnitPrice } from "@metaplex-foundation/mpl-toolbox";

// Note: Merkle proofs in allowlist JSON files are hex-encoded, not base58

// Your config imports
import {
  candyMachineId,
  candyGuardId,
  collectionMint,
  creatorWallet,
  rpcHost,
  mintGroups,
  groupPricing
} from "../config";

interface GuardGroup {
  payment?: { sol?: { lamports: number } };
  mintLimit?: { settings?: { limit: number }; mintCounter?: { count: number } };
  allowed?: UmiPublicKey[];
}

interface ParsedPricesForUI {
  payment: Array<{ label: string; price: number; kind: string }>;
  burn: Array<any>;
  gate: Array<any>;
}

interface GuardGroupStates {
  isStarted: boolean;
  isEnded: boolean;
  isLimitReached: boolean;
  canPayFor: number;
  messages: string[];
  isWalletWhitelisted: boolean;
  hasGatekeeper: boolean;
}

export default function useCandyMachineV3Working(
  candyMachineIdInput: PublicKey | string,
  candyMachineOpts: {
    allowLists?: Array<{
      groupLabel: string;
      list: string[];
      /**
       * Optional mapping of wallet addresses to their Merkle proofs.
       * If provided, the hook will use these proofs instead of computing
       * a proof from the provided list. The proofs should be hex-encoded
       * hashes (32 bytes each) as strings.
       */
      proofs?: Record<string, string[]>;
    }>;
  } = {}
) {
  console.log("=== Using WORKING hook with Helius RPC ===");
  const wallet = useWallet();

  // Create Umi instance - your Helius RPC is already set in config
  const umi = useMemo(() => {
    console.log("Creating Umi with Helius RPC:", rpcHost);
    const umiInstance = createUmi(rpcHost).use(mplCandyMachine());

    // Only set wallet adapter when fully ready
    if (wallet.publicKey && wallet.signTransaction && wallet.connected) {
      try {
        umiInstance.use(walletAdapterIdentity(wallet));
        console.log("Wallet adapter set successfully");
      } catch (error) {
        console.warn("Failed to set wallet adapter:", error);
      }
    }

    return umiInstance;
  }, [wallet.publicKey, wallet.signTransaction, wallet.connected]);

  const [candyMachine, setCandyMachine] = useState<any>(null);
  const [guards, setGuards] = useState<Record<string, GuardGroup>>({});
  const [guardStates, setGuardStates] = useState<Record<string, GuardGroupStates>>({});
  const [prices, setPrices] = useState<Record<string, ParsedPricesForUI>>({});
  const [status, setStatus] = useState({
    candyMachine: false,
    guardGroups: false,
    minting: false,
    initialFetchGuardGroupsDone: false,
  });
  const [items, setItems] = useState({
    available: 0,
    remaining: 0,
    redeemed: 0,
  });

  // Convert IDs to Umi format
  const cmId = useMemo(() => {
    const idStr = typeof candyMachineIdInput === 'string'
      ? candyMachineIdInput
      : candyMachineIdInput.toBase58();
    return publicKey(idStr);
  }, [candyMachineIdInput]);

  const cgId = publicKey(candyGuardId.toBase58());

  // Merkle data (root and proof) for each allow-listed group.
  // If proofs are provided via candyMachineOpts.allowLists, decode them from base58.
  // Otherwise, compute the proof using getMerkleProof against the provided list.
  const merkles = useMemo(() => {
    if (!candyMachineOpts.allowLists?.length || !wallet.publicKey) {
      return {};
    }

    const merkleData: Record<string, { tree: UmiPublicKey; proof: UmiPublicKey[] }> = {};

    candyMachineOpts.allowLists.forEach(({ groupLabel, list, proofs }) => {
      const tree = getMerkleRoot(list) as unknown as UmiPublicKey;
      let proof: any[] = [];

      if (proofs && wallet.publicKey) {
        // If proofs are provided, decode the hex strings for the connected wallet.
        const encodedProof = proofs[wallet.publicKey.toBase58()] || [];
        proof = encodedProof.map((p) => Buffer.from(p, 'hex')) as unknown as UmiPublicKey[];
      } else if (wallet.publicKey) {
        // Otherwise compute the proof from the list of addresses.
        proof = getMerkleProof(list, wallet.publicKey.toBase58()) as unknown as UmiPublicKey[];
      }

      merkleData[groupLabel] = { tree, proof };

      if (proof.length > 0) {
        console.log(`Allowlist verified for ${groupLabel}: ${wallet.publicKey.toBase58()}`);
      } else {
        console.log(`Not on allowlist for ${groupLabel}: ${wallet.publicKey.toBase58()}`);
      }
    });

    return merkleData;
  }, [candyMachineOpts.allowLists, wallet.publicKey]);

  // Refresh function
  const refresh = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, candyMachine: true }));
      console.log("Refreshing candy machine data...");

      // Fetch candy machine
      const cm = await fetchCandyMachine(umi, cmId);

      // Transform to match expected format with address and toNumber() methods
      const cmAny = cm as any;
      const transformedCM = {
        ...cm,
        address: cm.publicKey,
        itemsAvailable: { toNumber: () => Number(cmAny.itemsAvailable || cmAny.data?.itemsAvailable || 1000) },
        itemsMinted: { toNumber: () => Number(cmAny.itemsRedeemed || cmAny.itemsMinted || cmAny.data?.itemsMinted || 0) },
        itemsRemaining: { toNumber: () => {
          const available = Number(cmAny.itemsAvailable || cmAny.data?.itemsAvailable || 1000);
          const minted = Number(cmAny.itemsRedeemed || cmAny.itemsMinted || cmAny.data?.itemsMinted || 0);
          return Math.max(0, available - minted);
        }}
      };

      setCandyMachine(transformedCM as any);

      // Extract items with multiple fallbacks
      const itemsAvailable = Number(
        (cm as any).itemsAvailable || 
        (cm as any).data?.itemsAvailable || 
        1000
      );
      const itemsRedeemed = Number(
        (cm as any).itemsRedeemed || 
        (cm as any).itemsMinted ||
        (cm as any).data?.itemsMinted ||
        0
      );
      const itemsRemaining = Math.max(0, itemsAvailable - itemsRedeemed);

      setItems({
        available: itemsAvailable,
        redeemed: itemsRedeemed,
        remaining: itemsRemaining,
      });

      console.log("Items loaded:", { itemsAvailable, itemsRedeemed, itemsRemaining });

      // Setup guards and states for all groups
      const parsedGuards: Record<string, GuardGroup> = {};
      const parsedStates: Record<string, GuardGroupStates> = {};
      const parsedPrices: Record<string, ParsedPricesForUI> = {};

      // Define all groups from your mintGroups config
      const allGroups = ["default", ...Object.values(mintGroups)];
      
      allGroups.forEach(groupLabel => {
        parsedGuards[groupLabel] = {};
        
        // Check allowlist status
        let isWhitelisted = true;
        let messages: string[] = [];
        
        if ((groupLabel === "og" || groupLabel === "j1t") && wallet.publicKey) {
          const merkleData = merkles[groupLabel];
          if (merkleData) {
            isWhitelisted = merkleData.proof.length > 0;
            if (!isWhitelisted) {
              messages.push(`Not on ${groupLabel} allowlist`);
            }
          } else {
            isWhitelisted = false;
            messages.push(`${groupLabel} allowlist not loaded`);
          }
        }
        
        parsedStates[groupLabel] = {
          isStarted: true,
          isEnded: false,
          isLimitReached: itemsRemaining <= 0,
          canPayFor: Math.min(10, itemsRemaining),
          messages,
          isWalletWhitelisted: isWhitelisted,
          hasGatekeeper: false,
        };

        const price = groupPricing[groupLabel as keyof typeof groupPricing] || 0.25;
        parsedPrices[groupLabel] = {
          payment: [{ label: "SOL", price, kind: "sol" }],
          burn: [],
          gate: [],
        };
      });

      setGuards(parsedGuards);
      setGuardStates(parsedStates);
      setPrices(parsedPrices);

      console.log("All data loaded successfully");

    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setStatus(prev => ({ ...prev, candyMachine: false, initialFetchGuardGroupsDone: true }));
    }
  }, [umi, cmId, merkles, wallet.publicKey]);

  // FIXED mint function - this is the key fix
  const mint = useCallback(
    async (
      quantity: number = 1,
      opts: {
        groupLabel?: string;
        nftGuards?: any[];
      } = {}
    ) => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error("Wallet not connected");
      }

      if (!candyMachine) {
        throw new Error("Candy machine not loaded");
      }

      const groupLabel = opts.groupLabel || "public";
      console.log(`Starting mint: ${quantity} NFTs for ${groupLabel} group`);

      // Validate allowlist BEFORE attempting mint
      if (groupLabel === "og" || groupLabel === "j1t") {
        const merkleData = merkles[groupLabel];
        if (!merkleData || merkleData.proof.length === 0) {
          throw new Error(`You are not on the ${groupLabel} allowlist`);
        }
        console.log(`Allowlist validation passed for ${groupLabel}`);
        console.log(`Merkle root for ${groupLabel}:`, Buffer.from(merkleData.tree).toString('hex'));
        console.log(`Merkle proof for ${groupLabel}:`, merkleData.proof.map((p: any) => Buffer.from(p).toString('hex')));
      }

      try {
        setStatus(prev => ({ ...prev, minting: true }));

        const mintedNfts = [];

        // Mint one at a time for maximum compatibility
        for (let i = 0; i < quantity; i++) {
          try {
            console.log(`Minting ${i + 1}/${quantity}...`);

            const nftMint = generateSigner(umi);
            const mintArgs: any = {};

            // For allowlist groups, first call route() to store proof in PDA
            if (groupLabel === "og" || groupLabel === "j1t") {
              const { tree, proof } = merkles[groupLabel];

              console.log(`Calling route instruction to store proof for ${groupLabel}`);
              console.log(`Merkle root:`, Buffer.from(tree).toString('hex'));
              console.log(`Merkle proof elements:`, proof.map((p: any) => Buffer.from(p).toString('hex')));

              // Call route instruction to store the proof in a PDA
              // Convert UmiPublicKey (base58 string) to Uint8Array
              const merkleRootBytes = Buffer.from(tree);
              const merkleProofBytes = proof.map((p: any) => Buffer.from(p));

              const routeTx = route(umi, {
                candyGuard: cgId,
                candyMachine: cmId,
                guard: 'allowList',
                routeArgs: {
                  path: 'proof',
                  merkleRoot: merkleRootBytes,
                  merkleProof: merkleProofBytes,
                },
                group: some(groupLabel),
              });

              await routeTx.sendAndConfirm(umi, {
                confirm: { commitment: 'confirmed' },
                send: { skipPreflight: false },
              });

              console.log(`Route instruction successful for ${groupLabel}`);

              // Now add merkleRoot to mintArgs (NOT the proof)
              mintArgs.allowList = { merkleRoot: tree };
            }

            // Add payment destination (required for solPayment guard)
            // Note: lamports amount is set in the guard config, we only pass destination
            mintArgs.solPayment = {
              destination: publicKey(creatorWallet.toBase58())
            };
            console.log(`Added solPayment destination:`, creatorWallet.toBase58());

            // Add mint limit if applicable
            const limitId = groupLabel === "og" ? 2 :
                            groupLabel === "j1t" ? 3 :
                            groupLabel === "bb" ? 1 : undefined;
            if (limitId) {
              mintArgs.mintLimit = { id: limitId };
            }

            console.log(`Building mint transaction for ${groupLabel} group with mintArgs:`, mintArgs);
            console.log(`Group parameter:`, groupLabel !== "default" && groupLabel !== "public" ? { value: groupLabel } : undefined);

            // Use UMI's native transaction builder - increased compute units for allowlist
            const tx = transactionBuilder()
              .add(setComputeUnitLimit(umi, { units: 1_200_000 }))
              .add(setComputeUnitPrice(umi, { microLamports: 10000 }))
              .add(mintV2(umi, {
                candyMachine: cmId,
                candyGuard: cgId,
                nftMint,
                collectionMint: publicKey(collectionMint.toBase58()),
                collectionUpdateAuthority: publicKey(creatorWallet.toBase58()),
                group: groupLabel !== "default" ? some(groupLabel) : undefined,
                mintArgs,
              }));

            const instructions = tx.getInstructions();
            console.log(`Transaction instructions count: ${instructions.length}`);
            console.log(`Serialized mintV2 instruction data:`, instructions[2]?.data ? Buffer.from(instructions[2].data).toString('hex') : 'No data');

            const result = await tx.sendAndConfirm(umi, {
              confirm: { commitment: 'confirmed' },
              send: { skipPreflight: true, maxRetries: 3 },
            });

            console.log(`Mint ${i + 1} successful, signature:`, Buffer.from(result.signature).toString('base64'));
            mintedNfts.push({ mint: nftMint, signature: result.signature });

            // Brief delay between mints
            if (i < quantity - 1) {
              await new Promise(resolve => setTimeout(resolve, 1500));
            }
          } catch (mintError: any) {
            console.error(`Mint ${i + 1} failed:`, mintError);

            // Handle user cancellation
            if (mintError?.message?.includes("cancelled") ||
                mintError?.message?.includes("rejected") ||
                mintError?.name === "WalletSignTransactionError") {
              console.log("User cancelled or wallet error");
              break;
            }

            // Handle specific errors
            if (mintError?.message?.includes("0x137") ||
                mintError?.message?.includes("sold out")) {
              throw new Error("Collection is sold out!");
            } else if (mintError?.message?.includes("0x135") ||
                       mintError?.message?.includes("insufficient")) {
              throw new Error("Insufficient SOL balance");
            } else if (mintError?.message?.includes("allowlist") ||
                       mintError?.message?.includes("not authorized")) {
              throw new Error(`Not authorized for ${groupLabel} group`);
            }

            console.warn(`Mint ${i + 1} failed, error:`, mintError.message);
          }
        }

        if (mintedNfts.length > 0) {
          console.log(`Successfully minted ${mintedNfts.length} NFT(s)`);
          // Refresh after successful mints
          setTimeout(() => refresh(), 2000);
        }

        return mintedNfts;

      } catch (error: any) {
        console.error("Mint process error:", error);
        throw error;
      } finally {
        setStatus(prev => ({ ...prev, minting: false }));
      }
    },
    [umi, wallet, candyMachine, merkles, refresh, cmId, cgId]
  );

  // Initial load
  useEffect(() => {
    refresh().catch(console.error);
  }, [refresh]);

  return {
    candyMachine,
    guards,
    guardStates,
    status,
    items,
    merkles,
    prices,
    mint,
    refresh,
  };
}