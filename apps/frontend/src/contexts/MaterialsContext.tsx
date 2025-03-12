import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getMaterials, getUserMaterials } from '../api/solana';
import { Material, UserMaterial } from '../types';

interface MaterialsContextType {
  materials: Material[];
  userMaterials: UserMaterial[];
  loading: boolean;
  error: string | null;
  refreshMaterials: () => Promise<void>;
  refreshUserMaterials: () => Promise<void>;
}

const MaterialsContext = createContext<MaterialsContextType>({
  materials: [],
  userMaterials: [],
  loading: false,
  error: null,
  refreshMaterials: async () => {},
  refreshUserMaterials: async () => {},
});

export const useMaterials = () => useContext(MaterialsContext);

interface MaterialsProviderProps {
  children: ReactNode;
}

export const MaterialsProvider: React.FC<MaterialsProviderProps> = ({ children }) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  
  const [materials, setMaterials] = useState<Material[]>([]);
  const [userMaterials, setUserMaterials] = useState<UserMaterial[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const materialsData = await getMaterials(wallet);
      setMaterials(materialsData);
    } catch (err) {
      console.error('Failed to fetch materials:', err);
      setError('Failed to load materials. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const refreshUserMaterials = async () => {
    if (!wallet.connected) {
      setUserMaterials([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const userMaterialsData = await getUserMaterials(wallet);
      setUserMaterials(userMaterialsData);
    } catch (err) {
      console.error('Failed to fetch user materials:', err);
      setError('Failed to load your materials. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Load materials on initial render
  useEffect(() => {
    refreshMaterials();
  }, [connection]);

  // Load user materials when wallet connects
  useEffect(() => {
    if (wallet.connected) {
      refreshUserMaterials();
    } else {
      setUserMaterials([]);
    }
  }, [wallet.connected, connection]);

  const value = {
    materials,
    userMaterials,
    loading,
    error,
    refreshMaterials,
    refreshUserMaterials,
  };

  return (
    <MaterialsContext.Provider value={value}>
      {children}
    </MaterialsContext.Provider>
  );
}; 