import { Cluster } from '@solana/web3.js';

// Cluster options
export enum SolanaCluster {
  MAINNET = 'mainnet-beta',
  TESTNET = 'testnet',
  DEVNET = 'devnet',
  LOCALNET = 'localnet',
}

// Currently selected cluster
export const DEFAULT_CLUSTER: Cluster = (process.env.REACT_APP_SOLANA_CLUSTER as Cluster) || SolanaCluster.DEVNET;

// Cluster endpoint configuration
export const CLUSTER_ENDPOINT = process.env.REACT_APP_SOLANA_API_URL || {
  [SolanaCluster.MAINNET]: 'https://api.mainnet-beta.solana.com',
  [SolanaCluster.TESTNET]: 'https://api.testnet.solana.com',
  [SolanaCluster.DEVNET]: 'https://api.devnet.solana.com',
  [SolanaCluster.LOCALNET]: 'http://localhost:8899',
}[DEFAULT_CLUSTER];

// RPC node endpoint
export const RPC_ENDPOINT = CLUSTER_ENDPOINT;

// Project program ID
export const PROGRAM_ID = process.env.REACT_APP_PROGRAM_ID || ''; // Actual program ID should be populated in production

// Enable auto-confirmation
export const AUTO_CONFIRM = true;

// Transaction confirmation count
export const CONFIRMATION_COUNT = 1;

// Timeout setting (ms)
export const REQUEST_TIMEOUT = 60000;

// Log current network config
console.log(`Connected to Solana ${DEFAULT_CLUSTER} network: ${CLUSTER_ENDPOINT}`);

// Export current network type
export const IS_PRODUCTION = DEFAULT_CLUSTER === SolanaCluster.MAINNET;

// Wallet configuration
export const WALLET_CONFIG = {
  autoConnect: true,                    // Automatically connect to the most recently used wallet
  reuseConnection: true,               // Reuse previous connection
  skipModal: false,                    // Don't skip the modal if there's only one wallet
}

// Transaction options
export const TX_OPTIONS = {
  maxRetries: 3,                       // Maximum retry attempts
  skipPreflight: false,                // Skip preflight check
  preflightCommitment: 'confirmed',    // Preflight commitment level
  commitment: 'confirmed',             // Commitment level
};

// NFT configuration
export const NFT_CONFIG = {
  metaplexUrl: 'https://api.metaplex.solana.com/',
  arweaveUrl: 'https://arweave.net/',
};

// Export network configuration function
export function getNetworkConfig() {
  return {
    cluster: DEFAULT_CLUSTER,
    endpoint: CLUSTER_ENDPOINT,
    programId: PROGRAM_ID,
  };
}

// Export all configurations
export const SolanaConfig = {
  cluster: DEFAULT_CLUSTER,
  endpoint: CLUSTER_ENDPOINT,
  programId: PROGRAM_ID,
  wallet: WALLET_CONFIG,
  transaction: TX_OPTIONS,
  nft: NFT_CONFIG,
  autoApprove: AUTO_CONFIRM,
  confirmations: CONFIRMATION_COUNT,
  timeout: REQUEST_TIMEOUT,
};

export default SolanaConfig; 