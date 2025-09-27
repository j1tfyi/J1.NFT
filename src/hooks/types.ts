import { PublicKey } from "@solana/web3.js";

export type Token = {
  mint: PublicKey;
  balance: number;
  decimals: number;
};
export type TokenPayment$Gate = {
  mint: PublicKey;
  amount: number;
  symbol?: string;
  decimals: number;
};

// export type SolPayment = {
//   type: "sol";
//   amount: number;
//   decimals: number;
// };

// export type TokenPayment = {
//   type: "token";
//   mint: PublicKey;
//   amount: number;
//   symbol?: string;
//   decimals: number;
// };

// export type NftPayment = {
//   type: "nft";
//   nfts: Metadata[];
// };

// export type PaymentGuard = {
//   criteria: "pay" | "have";
// } & (SolPayment | TokenPayment | NftPayment);

export type GuardGroup = {
  startTime?: Date;
  endTime?: Date;
  payment?: {
    sol?: {
      amount: number;
      decimals: number;
    };
    token?: TokenPayment$Gate;
    nfts?: any[];
    requiredCollection?: PublicKey;
  };
  burn?: {
    token?: TokenPayment$Gate;
    nfts?: any[];
    requiredCollection?: PublicKey;
  };
  gate?: {
    token?: TokenPayment$Gate;
    nfts?: any[];
    requiredCollection?: PublicKey;
  };
  mintLimit?: any;
  redeemLimit?: number;
  allowed?: PublicKey[];
  allowList?: Uint8Array;
  gatekeeperNetwork?: PublicKey;
};


export type GuardGroupStates = {
  isStarted: boolean;
  isEnded: boolean;
  canPayFor: number;
  messages: string[];
  isLimitReached: boolean;
  isWalletWhitelisted: boolean;
  hasGatekeeper: boolean;
};

export type PaymentRequired = {
  label: string;
  price: number;
  mint?: PublicKey;
  decimals?: number;
  kind: string;
};
export type ParsedPricesForUI = {
  payment: PaymentRequired[];
  burn: PaymentRequired[];
  gate: PaymentRequired[];
};


export type AllowLists = {
  groupLabel?: string;
  list: (string | Uint8Array)[];
}[];

