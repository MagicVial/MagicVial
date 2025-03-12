import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getRecipes, getUserRecipes } from '../api/solana';
import { Recipe } from '../types';

interface RecipesContextType {
  recipes: Recipe[];
  userRecipes: any[]; // Using any since the actual type may vary
  loading: boolean;
  error: string | null;
  refreshRecipes: () => Promise<void>;
  refreshUserRecipes: () => Promise<void>;
}

const RecipesContext = createContext<RecipesContextType>({
  recipes: [],
  userRecipes: [],
  loading: false,
  error: null,
  refreshRecipes: async () => {},
  refreshUserRecipes: async () => {},
});

export const useRecipes = () => useContext(RecipesContext);

interface RecipesProviderProps {
  children: ReactNode;
}

export const RecipesProvider: React.FC<RecipesProviderProps> = ({ children }) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [userRecipes, setUserRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshRecipes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const recipesData = await getRecipes(wallet);
      setRecipes(recipesData);
    } catch (err) {
      console.error('Failed to fetch recipes:', err);
      setError('Failed to load recipes. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const refreshUserRecipes = async () => {
    if (!wallet.connected) {
      setUserRecipes([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const userRecipesData = await getUserRecipes(wallet);
      setUserRecipes(userRecipesData);
    } catch (err) {
      console.error('Failed to fetch user recipes:', err);
      setError('Failed to load your recipes. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Load recipes on initial render
  useEffect(() => {
    refreshRecipes();
  }, [connection]);

  // Load user recipes when wallet connects
  useEffect(() => {
    if (wallet.connected) {
      refreshUserRecipes();
    } else {
      setUserRecipes([]);
    }
  }, [wallet.connected, connection]);

  const value = {
    recipes,
    userRecipes,
    loading,
    error,
    refreshRecipes,
    refreshUserRecipes,
  };

  return (
    <RecipesContext.Provider value={value}>
      {children}
    </RecipesContext.Provider>
  );
}; 