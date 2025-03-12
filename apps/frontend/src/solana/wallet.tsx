import React, { FC, ReactNode, useMemo } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  SolletWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// 默认导入钱包适配器样式
import '@solana/wallet-adapter-react-ui/styles.css';

interface SolanaWalletProvidersProps {
  children: ReactNode;
}

export const SolanaWalletProviders: FC<SolanaWalletProvidersProps> = ({ children }) => {
  // 可以设置为 'mainnet-beta', 'testnet', 'devnet' 或 自定义 RPC URL
  const network = WalletAdapterNetwork.Devnet;

  // 也可以提供自定义 RPC 端点
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // @solana/wallet-adapter-wallets 包含所有钱包适配器
  // 以及一些用于初始化常见钱包的辅助函数
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new SolletWalletAdapter({ network }),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}; 