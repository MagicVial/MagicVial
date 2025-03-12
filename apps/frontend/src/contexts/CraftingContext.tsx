import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getUserCraftings, startCrafting, completeCrafting } from '../api/solana';
import { Crafting } from '../types';

interface CraftingContextType {
  craftings: Crafting[];
  loading: boolean;
  error: string | null;
  refreshCraftings: () => Promise<void>;
  startCraftingProcess: (recipeId: string) => Promise<string | null>;
  completeCraftingProcess: (craftingId: string) => Promise<string | null>;
}

const CraftingContext = createContext<CraftingContextType>({
  craftings: [],
  loading: false,
  error: null,
  refreshCraftings: async () => {},
  startCraftingProcess: async () => null,
  completeCraftingProcess: async () => null,
});

export const useCrafting = () => useContext(CraftingContext);

interface CraftingProviderProps {
  children: ReactNode;
}

export const CraftingProvider: React.FC<CraftingProviderProps> = ({ children }) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  
  const [craftings, setCraftings] = useState<Crafting[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCraftings = async () => {
    if (!wallet.connected) {
      setCraftings([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const craftingsData = await getUserCraftings(wallet);
      setCraftings(craftingsData);
    } catch (err) {
      console.error('Failed to fetch craftings:', err);
      setError('Failed to load your crafting sessions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const startCraftingProcess = async (recipeId: string): Promise<string | null> => {
    if (!wallet.connected) {
      setError('Please connect your wallet first.');
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const txHash = await startCrafting(wallet, recipeId);
      await refreshCraftings();
      return txHash;
    } catch (err) {
      console.error('Failed to start crafting:', err);
      setError('Failed to start crafting. Please try again later.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const completeCraftingProcess = async (craftingId: string): Promise<string | null> => {
    if (!wallet.connected) {
      setError('Please connect your wallet first.');
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const txHash = await completeCrafting(wallet, craftingId);
      await refreshCraftings();
      return txHash;
    } catch (err) {
      console.error('Failed to complete crafting:', err);
      setError('Failed to complete crafting. Please try again later.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Load craftings when wallet connects
  useEffect(() => {
    if (wallet.connected) {
      refreshCraftings();
    } else {
      setCraftings([]);
    }
  }, [wallet.connected, connection]);

  const value = {
    craftings,
    loading,
    error,
    refreshCraftings,
    startCraftingProcess,
    completeCraftingProcess,
  };

  return (
    <CraftingContext.Provider value={value}>
      {children}
    </CraftingContext.Provider>
  );
}; 