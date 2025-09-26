import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";

// Network configuration - mainnet for J1T project
export const network = WalletAdapterNetwork.Mainnet;

// RPC Host - Using QuickNode endpoint from .env or fallback to mainnet
export const rpcHost = process.env.NEXT_PUBLIC_RPC ||
  process.env.NEXT_PUBLIC_RPC_URL ||
  clusterApiUrl(network);

// Backup RPC endpoints for failover
export const backupRpcHosts = [
  "https://api.mainnet-beta.solana.com",
  "https://solana-api.projectserum.com",
  "https://rpc.ankr.com/solana"
];

// J1T Candy Machine configuration
export const candyMachineId = new PublicKey(
  process.env.NEXT_PUBLIC_CANDY_MACHINE_ID ||
  process.env.NEXT_PUBLIC_CM ||
    "2wkyBKfkkQWyXKWLex21CWerY2CtcPWpqV2nkSatUU74"
);

// Candy Guard configuration (confirmed on-chain)
export const candyGuardId = new PublicKey(
  process.env.NEXT_PUBLIC_CG ||
    "DHy6MiUEVGfYAoUCfGdMF8UGbfjiprikrUUtuPCBK5D"
);

// Collection mint
export const collectionMint = new PublicKey(
  process.env.NEXT_PUBLIC_COLL ||
    "8gyRBtEr2HTEpKYZo1DWjhvYgJoyb3XAJKJUCQLAZF2u"
);

// Creator/Authority wallet
export const creatorWallet = new PublicKey(
  process.env.NEXT_PUBLIC_CREATOR ||
  process.env.NEXT_PUBLIC_TREASURY ||
    "GeCQaXoVoPhyCqGDtrej2pjMAZRoVZ4PTacEL7LW2Lz4"
);

// Default guard group - undefined means use default guards
export const defaultGuardGroup =
  process.env.NEXT_PUBLIC_DEFAULT_GUARD_GROUP || undefined;

// Available groups for J1T project
export const mintGroups = {
  bb: "bb",      // Creator only - 0.0005 SOL
  og: "og",      // OG allowlist - 0.15 SOL
  j1t: "j1t",    // J1T allowlist - 0.20 SOL
  public: "public" // Public mint - 0.25 SOL
};

// Group pricing (in SOL)
export const groupPricing = {
  bb: 0.0005,
  og: 0.15,
  j1t: 0.20,
  public: 0.25
};

// Mint limits per group
export const mintLimits = {
  bb: 50,      // Max 50 per wallet (creator only)
  og: 20,      // Max 20 per wallet
  j1t: 20,     // Max 20 per wallet
  public: null // No limit for public
};

// BB group restricted to creator wallet only
export const bbRestrictedWallet = creatorWallet.toBase58();

// Network checks
export const isMainnet =
  network === WalletAdapterNetwork.Mainnet ||
  rpcHost.includes("mainnet");

export const isDevnet =
  rpcHost.includes("devnet");

// Explorer URL helper
export const getExplorerUrl = (address: string, type: "tx" | "address" = "address") => {
  const cluster = isMainnet ? "" : `?cluster=${network}`;
  return `https://solscan.io/${type}/${address}${cluster}`;
};

// Connection configuration for better reliability
export const connectionConfig = {
  commitment: "confirmed" as const,
  confirmTransactionInitialTimeout: 90000,
  disableRetryOnRateLimit: false,
  wsEndpoint: undefined,
};

// Compute unit configuration for candy machine v3
export const CU_LIMIT = Math.min(
  1_400_000,
  Math.max(800_000, Number(process.env.NEXT_PUBLIC_CU_LIMIT || 1_000_000))
);

export const CU_PRICE_MICRO = Math.max(
  1000,
  Number(process.env.NEXT_PUBLIC_CU_PRICE_MICRO || 5000)
);

// Create connection instance with retry logic
export const createConnection = (rpcUrl: string = rpcHost) => {
  return new Connection(rpcUrl, {
    ...connectionConfig,
    httpHeaders: {
      'Content-Type': 'application/json',
    }
  });
};

export const connection = createConnection();

// Connection with failover support
export const getHealthyConnection = async (): Promise<Connection> => {
  const endpoints = [rpcHost, ...backupRpcHosts];

  for (const endpoint of endpoints) {
    try {
      const testConnection = createConnection(endpoint);
      await testConnection.getVersion();
      console.log(`Using RPC endpoint: ${endpoint}`);
      return testConnection;
    } catch (error) {
      console.warn(`RPC endpoint ${endpoint} failed health check:`, error);
      continue;
    }
  }

  console.warn('All RPC endpoints failed, using default connection');
  return connection;
};

// Debug mode
export const DEBUG = process.env.NEXT_PUBLIC_DEBUG === "1";

// Proof files version (for cache busting)
export const PROOFS_VERSION = process.env.NEXT_PUBLIC_PROOFS_VERSION || "1";

// Batch minting configuration
export const BATCH_SIZE = Math.max(1, Math.min(5, Number(process.env.NEXT_PUBLIC_BATCH_SIZE || 1)));

// Wallet adapter configuration
export const walletConfig = {
  autoConnect: false,
  localStorageKey: 'walletAdapter',
  onError: (error: any) => {
    console.error('Wallet adapter error:', error);
  }
};

// Transaction configuration for better reliability
export const transactionConfig = {
  skipPreflight: false,
  preflightCommitment: 'confirmed' as const,
  maxRetries: 3,
  minContextSlot: undefined,
};

// Candy Machine specific configuration
export const candyMachineConfig = {
  maxRetries: 3,
  retryDelay: 2000,
  confirmationTimeout: 60000,
  allowlistRetries: 2,
  batchSize: 1,
  retryOnInsufficientBalance: false,
  retryOnSlotHashMismatch: true,
};

// Export all configuration as a single object for convenience
export const config = {
  network,
  rpcHost,
  backupRpcHosts,
  candyMachineId,
  candyGuardId,
  collectionMint,
  creatorWallet,
  defaultGuardGroup,
  mintGroups,
  groupPricing,
  mintLimits,
  bbRestrictedWallet,
  isMainnet,
  isDevnet,
  connection,
  connectionConfig,
  transactionConfig,
  walletConfig,
  candyMachineConfig,
  DEBUG,
  PROOFS_VERSION,
  BATCH_SIZE,
  CU_LIMIT,
  CU_PRICE_MICRO,
  getExplorerUrl,
  createConnection,
  getHealthyConnection,
};

export default config;