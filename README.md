# J1.NFT Astronaut Collection

<div align="center">
  <img src="public/astro-logo.png" alt="J1.NFT Astronaut" width="300"/>
</div>

Official minting interface for the J1.NFT Astronaut Collection — Statement pieces forged in code. Engineered for precision. Secured by guards. Stress-tested across the cosmos.

## Overview

This is the official minting dApp for the J1.NFT Astronaut Collection on Solana. Built with Next.js and Metaplex Candy Machine V3 using the UMI framework.

### Collection Features

- **Limited Edition**: 100 unique astronaut NFTs
- **Multi-Tier Minting**: OG, J1T, and Public mint groups
- **Allowlist Protection**: Merkle tree-based verification for exclusive tiers
- **Guard-Based Access**: Candy Machine guards for time-based launches, payment gates, and mint limits

## Getting Started

### Prerequisites

- Node.js 14+
- Yarn package manager

### Installation

```bash
yarn install
```

### Development

Run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the minting interface.

### Build for Production

```bash
yarn build
```

## Configuration

### Candy Machine Setup

Update `/src/config.ts` with your Candy Machine details:

- `candyMachineId`: Your Candy Machine public key
- `network`: Solana cluster (mainnet-beta/devnet)
- `defaultGuardGroup`: Default mint group
- `mintGroups`: Configuration for OG, J1T, and Public groups
- `groupPricing`: SOL pricing for each tier
- `creatorWallet`: Treasury wallet address

### Allowlists

Merkle tree allowlists are stored in:
- `/public/og-allowlist.json` - OG tier wallets
- `/public/j1t-allowlist.json` - J1T tier wallets

## Technical Stack

- **Framework**: Next.js with TypeScript
- **Blockchain**: Solana (mainnet-beta)
- **NFT Standard**: Metaplex Candy Machine V3
- **SDK**: @metaplex-foundation/umi
- **Wallet Adapter**: Solana Wallet Adapter (React UI)
- **Styling**: Styled Components + Tailwind CSS + DaisyUI
- **Deployment**: Vercel

## Minting Process

### Allowlist Minting (OG/J1T)

The allowlist minting process uses a 2-step approach:

1. **Route Instruction**: Stores Merkle proof in a PDA
2. **Mint Instruction**: Verifies proof from PDA and mints NFT

This architecture is required by Candy Machine V3's allowList guard.

### Guard Configuration

Active guards:
- `startDate` / `endDate`: Time-based mint windows
- `solPayment`: SOL payment requirement
- `allowList`: Merkle tree verification
- `mintLimit`: Per-wallet mint limits
- `redeemedAmount`: Total supply limits

## Project Structure

```
├── public/              # Static assets (NFT images, allowlists, logo)
├── src/
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React contexts (wallet, network)
│   ├── hooks/           # Custom hooks (useCandyMachineV3)
│   ├── styles/          # Styled components
│   ├── views/           # Page views (home, basics)
│   ├── config.ts        # Candy Machine configuration
│   └── utils.ts         # Utility functions
```

## Deployment

Deployed on Vercel:

```bash
npx vercel --prod
```

## Contributing

This is a production NFT minting interface. For issues or feature requests, please open an issue in the repository.

## License

Built for J1.NFT — The Exclusive 100 Legacy