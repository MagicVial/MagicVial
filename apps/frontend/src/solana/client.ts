import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Keypair
} from '@solana/web3.js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { 
  Program, BN, Provider
} from '@project-serum/anchor';
import { useCallback, useEffect, useState } from 'react';

// Material related type definitions
export enum MaterialType {
  ELEMENT = 'element',
  GEM = 'gem',
  METAL = 'metal',
  HERB = 'herb',
  CREATURE = 'creature'
}

export enum MaterialRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export interface Material {
  id: string;
  name: string;
  type: MaterialType;
  rarity: MaterialRarity;
  supply: number;
  maxSupply: number;
  active: boolean;
}

// Recipe related type definitions
export interface RecipeIngredient {
  materialId: string;
  amount: number;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  resultMaterialId: string;
  resultAmount: number;
  creatorId: string;
  discoveredAt: Date;
  successRate: number;
}

// Hook for using Solana connection
export function useSolanaConnection() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction } = useWallet();
  
  // Check wallet connection status
  const isConnected = !!publicKey;
  
  // Get SOL balance
  const [balance, setBalance] = useState<number>(0);
  
  const getBalance = useCallback(async () => {
    if (!publicKey) return 0;
    try {
      const balanceInLamports = await connection.getBalance(publicKey);
      return balanceInLamports / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Failed to fetch balance', error);
      return 0;
    }
  }, [connection, publicKey]);
  
  // Initialize to get balance
  useEffect(() => {
    if (isConnected) {
      getBalance().then(setBalance);
    } else {
      setBalance(0);
    }
    
    // Refresh balance periodically
    const intervalId = setInterval(() => {
      if (isConnected) {
        getBalance().then(setBalance);
      }
    }, 15000);
    
    return () => clearInterval(intervalId);
  }, [isConnected, getBalance]);
  
  // Send SOL tokens
  const sendSol = useCallback(
    async (recipient: string, amount: number) => {
      if (!publicKey || !sendTransaction) return null;
      
      try {
        const recipientPubkey = new PublicKey(recipient);
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: recipientPubkey,
            lamports: amount * LAMPORTS_PER_SOL,
          })
        );
        
        const signature = await sendTransaction(transaction, connection);
        await connection.confirmTransaction(signature, 'confirmed');
        return signature;
      } catch (error) {
        console.error('Failed to send SOL', error);
        return null;
      }
    },
    [publicKey, sendTransaction, connection]
  );
  
  return {
    isConnected,
    publicKey,
    connection,
    balance,
    getBalance,
    sendSol,
    sendTransaction,
    signTransaction
  };
}

// Utility class - for direct blockchain interaction
export class SolanaClient {
  private connection: Connection;
  
  constructor(endpoint: string) {
    this.connection = new Connection(endpoint, 'confirmed');
  }
  
  // Get all material accounts by program ID
  async getAllMaterials(programId: string): Promise<Material[]> {
    try {
      // In a real application, this would call the actual program account query method
      // Here we return mock data
      return [
        {
          id: '1',
          name: 'Fire Essence',
          type: MaterialType.ELEMENT,
          rarity: MaterialRarity.COMMON,
          supply: 15,
          maxSupply: 1000,
          active: true
        },
        {
          id: '2',
          name: 'Magic Crystal',
          type: MaterialType.GEM,
          rarity: MaterialRarity.RARE,
          supply: 5,
          maxSupply: 100,
          active: true
        }
      ];
    } catch (error) {
      console.error('Failed to fetch materials', error);
      return [];
    }
  }
  
  // Get all recipes by program ID
  async getAllRecipes(programId: string): Promise<Recipe[]> {
    try {
      // In a real application, this would call the program's account query method
      // Here we return mock data
      return [
        {
          id: '1',
          name: 'Basic Magic Potion',
          ingredients: [
            { materialId: '1', amount: 2 },
            { materialId: '2', amount: 1 }
          ],
          resultMaterialId: '3',
          resultAmount: 1,
          creatorId: 'creator1',
          discoveredAt: new Date(),
          successRate: 80
        }
      ];
    } catch (error) {
      console.error('Failed to fetch recipes', error);
      return [];
    }
  }
}

// Export a singleton instance
export default new SolanaClient('https://api.devnet.solana.com'); 