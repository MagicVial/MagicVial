import { clusterApiUrl } from '@solana/web3.js';

// 集群选项
export enum ClusterType {
  MAINNET = 'mainnet-beta',
  TESTNET = 'testnet',
  DEVNET = 'devnet',
  LOCALNET = 'localnet'
}

// 当前选择的集群
const DEFAULT_CLUSTER = process.env.REACT_APP_CLUSTER as ClusterType || ClusterType.DEVNET;

// 集群端点配置
const ENDPOINTS = {
  [ClusterType.MAINNET]: process.env.REACT_APP_MAINNET_ENDPOINT || clusterApiUrl('mainnet-beta'),
  [ClusterType.TESTNET]: process.env.REACT_APP_TESTNET_ENDPOINT || clusterApiUrl('testnet'),
  [ClusterType.DEVNET]: process.env.REACT_APP_DEVNET_ENDPOINT || clusterApiUrl('devnet'),
  [ClusterType.LOCALNET]: 'http://localhost:8899',
};

// RPC节点端点
export const CLUSTER_ENDPOINT = ENDPOINTS[DEFAULT_CLUSTER];

// 项目程序ID
export const PROGRAM_ID = process.env.REACT_APP_PROGRAM_ID || ''; // 实际生产中需要填写真实的程序ID

// 启用自动确认
export const AUTO_APPROVE_TRANSACTION = process.env.REACT_APP_AUTO_APPROVE_TRANSACTION === 'true';

// 交易确认确认数
export const TRANSACTION_CONFIRMATIONS = Number(process.env.REACT_APP_TRANSACTION_CONFIRMATIONS || 1);

// 超时设置（毫秒）
export const TIMEOUT = Number(process.env.REACT_APP_TIMEOUT || 60000);

// 记录当前网络配置
console.log(`连接到Solana ${DEFAULT_CLUSTER} 网络: ${CLUSTER_ENDPOINT}`);

// 导出当前网络类型
export const CLUSTER = DEFAULT_CLUSTER;

// 钱包配置
export const WALLET_CONFIG = {
  autoConnect: true,                    // 自动连接最近使用的钱包
  reuseConnection: true,               // 重用上一次的连接
  connectTimeoutMs: 10000,             // 连接超时时间（毫秒）
  disconnectTimeoutMs: 5000,           // 断开连接超时时间（毫秒）
  reconnectionDelayMs: 1000,           // 重连延迟时间（毫秒）
  maxReconnectionAttempts: 5,          // 最大重连尝试次数
};

// 交易选项
export const TX_OPTIONS = {
  maxRetries: 3,                       // 最大重试次数
  skipPreflight: false,                // 跳过预检
  preflightCommitment: 'confirmed',    // 预检承诺级别
  commitment: 'confirmed',             // 承诺级别
};

// NFT配置
export const NFT_CONFIG = {
  metaplexUrl: 'https://api.metaplex.solana.com/',
  arweaveUrl: 'https://arweave.net/',
};

// 导出网络配置函数
export function getNetworkConfig() {
  return {
    cluster: CLUSTER,
    endpoint: CLUSTER_ENDPOINT,
    programId: PROGRAM_ID,
  };
}

// 导出整合后的所有配置
export const SolanaConfig = {
  cluster: CLUSTER,
  endpoint: CLUSTER_ENDPOINT,
  programId: PROGRAM_ID,
  wallet: WALLET_CONFIG,
  transaction: TX_OPTIONS,
  nft: NFT_CONFIG,
  autoApprove: AUTO_APPROVE_TRANSACTION,
  confirmations: TRANSACTION_CONFIRMATIONS,
  timeout: TIMEOUT,
};

export default SolanaConfig; 