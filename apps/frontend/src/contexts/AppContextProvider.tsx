import React, { ReactNode } from 'react';
import { MaterialsProvider } from './MaterialsContext';
import { RecipesProvider } from './RecipesContext';
import { GuildsProvider } from './GuildsContext';
import { CraftingProvider } from './CraftingContext';
import { 
  ConnectionProvider, 
  WalletProvider 
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  SolletWalletAdapter,
  SolletExtensionWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';
import { NETWORK } from '../config/settings';

// Import wallet adapter styles
require('@solana/wallet-adapter-react-ui/styles.css');

interface AppContextProviderProps {
  children: ReactNode;
}

export const AppContextProvider: React.FC<AppContextProviderProps> = ({ children }) => {
  // You can also provide a custom RPC endpoint
  const endpoint = useMemo(() => clusterApiUrl(NETWORK), []);

  // Set up supported wallets
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new SolletWalletAdapter(),
      new SolletExtensionWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <MaterialsProvider>
            <RecipesProvider>
              <GuildsProvider>
                <CraftingProvider>
                  {children}
                </CraftingProvider>
              </GuildsProvider>
            </RecipesProvider>
          </MaterialsProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}; 