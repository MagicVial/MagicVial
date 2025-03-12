import { 
  Connection, 
  PublicKey, 
  Transaction, 
  clusterApiUrl, 
  SystemProgram, 
  LAMPORTS_PER_SOL 
} from '@solana/web3.js';
import { 
  Program, 
  Idl, 
} from '@project-serum/anchor';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { 
  Material, 
  UserMaterial, 
  Recipe, 
  UserRecipe, 
  Crafting, 
  Guild, 
  UserProfile, 
  MaterialType, 
  MaterialRarity,
  Achievement
} from '../types';
import { CLUSTER_ENDPOINT, MATERIAL_PROGRAM_ID, RECIPE_PROGRAM_ID, GUILD_PROGRAM_ID } from '../config/settings';
import { generateRandomId } from '../utils/helpers';

// Constants
export const SOLANA_NETWORK = 'devnet';
export const CONNECTION = new Connection(clusterApiUrl(SOLANA_NETWORK), 'confirmed');

// Material contract related constants
export const MATERIAL_PROGRAM_ID_KEY = new PublicKey(MATERIAL_PROGRAM_ID);
export const RECIPE_PROGRAM_ID_KEY = new PublicKey(RECIPE_PROGRAM_ID);
export const GUILD_PROGRAM_ID_KEY = new PublicKey(GUILD_PROGRAM_ID);

// Contract interface
export interface MaterialProgram extends Idl {
  instructions: {
    initialize: {
      accounts: {
        authority: any;
        materialAuthority: any;
        systemProgram: any;
      };
      args: [];
    };
    createMaterial: {
      accounts: {
        authority: any;
        materialAuthority: any;
        material: any;
        mint: any;
        metadata: any;
        tokenProgram: any;
        systemProgram: any;
        rent: any;
        metadataProgram: any;
      };
      args: [
        {
          name: string;
          symbol: string;
          uri: string;
          materialType: number;
          rarity: number;
          maxSupply: number;
        }
      ];
    };
    mintMaterial: {
      accounts: {
        authority: any;
        materialAuthority: any;
        material: any;
        mint: any;
        userToken: any;
        tokenProgram: any;
      };
      args: [
        {
          amount: number;
        }
      ];
    };
  };
  accounts: {
    materialAuthority: {
      authority: PublicKey;
    };
    material: {
      mint: PublicKey;
      materialType: number;
      rarity: number;
      currentSupply: number;
      maxSupply: number;
      active: boolean;
    };
  };
}

// Utility function: Create Provider
export const getProvider = (wallet: any) => {
  if (!wallet.publicKey) throw new Error('Wallet not connected');
  
  // Using wallet-adapter-react provider instead of AnchorProvider
  return {
    connection: CONNECTION,
    wallet,
    publicKey: wallet.publicKey,
  };
};

// Get materials list
export const getMaterials = async (): Promise<Material[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  return mockMaterials;
};

// Get recipes list
export const getRecipes = async (): Promise<Recipe[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 700));
  return mockRecipes;
};

// Get user's materials
export const getUserMaterials = async (walletAddress?: string): Promise<UserMaterial[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));
  // In a real application, this would query on-chain data based on wallet address
  return mockUserMaterials;
};

// Get user recipes
export const getUserRecipes = async (walletAddress?: string): Promise<UserRecipe[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  // In a real application, this would query on-chain data based on wallet address
  return mockUserRecipes;
};

// Create material
export const createMaterial = async (
  wallet: WalletContextState, 
  name: string,
  symbol: string,
  uri: string,
  materialType: MaterialType,
  rarity: MaterialRarity,
  maxSupply: number
): Promise<string> => {
  if (!wallet.publicKey) throw new Error('Wallet not connected');
  
  try {
    // Actual implementation would use contract
    console.log('Creating material:', { name, symbol, uri, materialType, rarity, maxSupply });
    return 'tx_hash_placeholder';
  } catch (error) {
    console.error('Failed to create material:', error);
    throw error;
  }
};

// Mint material
export const mintMaterial = async (
  wallet: WalletContextState,
  materialId: string,
  amount: number
): Promise<string> => {
  if (!wallet.publicKey) throw new Error('Wallet not connected');
  
  try {
    // Actual implementation would use contract
    console.log('Minting material:', { materialId, amount });
    return 'tx_hash_placeholder';
  } catch (error) {
    console.error('Failed to mint material:', error);
    throw error;
  }
};

// Create recipe
export const createRecipe = async (
  wallet: WalletContextState,
  name: string,
  description: string,
  inputs: Array<{materialId: string, amount: number}>,
  output: {materialId: string, amount: number},
  difficulty: number,
  craftingTime: number
): Promise<string> => {
  if (!wallet.publicKey) throw new Error('Wallet not connected');
  
  try {
    // Actual implementation would use contract
    console.log('Creating recipe:', { name, description, inputs, output, difficulty, craftingTime });
    return 'tx_hash_placeholder';
  } catch (error) {
    console.error('Failed to create recipe:', error);
    throw error;
  }
};

// Start crafting
export const startCrafting = async (recipeId: string, walletAddress?: string): Promise<Crafting> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Create new crafting record
  const recipe = mockRecipes.find(r => r.id === recipeId);
  if (!recipe) {
    throw new Error('Recipe not found');
  }
  
  const now = new Date();
  const completesAt = new Date(now.getTime() + recipe.craftingTime * 60000);
  
  const newCrafting: Crafting = {
    id: generateRandomId(),
    recipeId,
    recipe,
    startedAt: now,
    completesAt,
    status: 'inProgress',
    userAddress: walletAddress || 'unknown'
  };
  
  // In a real application, this would call the Solana contract for crafting
  // and would deduct user materials
  
  // Add the new crafting to mock data (for demonstration only)
  mockCraftings.push(newCrafting);
  
  return newCrafting;
};

// Complete crafting
export const completeCrafting = async (craftingId: string, walletAddress?: string): Promise<Crafting> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Find crafting record
  const craftingIndex = mockCraftings.findIndex(c => c.id === craftingId);
  if (craftingIndex === -1) {
    throw new Error('Crafting record not found');
  }
  
  // Update crafting record
  const crafting = mockCraftings[craftingIndex];
  
  const updatedCrafting: Crafting = {
    ...crafting,
    status: 'completed'
  };
  
  // In a real application, this would call the Solana contract to complete crafting
  // and would add the crafting result to the user's inventory
  
  // Update mock data (for demonstration only)
  mockCraftings[craftingIndex] = updatedCrafting;
  
  return updatedCrafting;
};

// Get user's ongoing craftings
export const getUserCraftings = async (walletAddress?: string): Promise<Crafting[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));
  // In a real application, this would query on-chain data based on wallet address
  return mockCraftings;
};

// Join guild
export const joinGuild = async (guildId: string, walletAddress?: string): Promise<UserProfile> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Find guild
  const guild = mockGuilds.find(g => g.id === guildId);
  if (!guild) {
    throw new Error('Guild not found');
  }
  
  // Update user profile
  const updatedProfile = {
    ...mockUserProfile,
    guild: guildId
  };
  
  // In a real application, this would call the Solana contract to join a guild
  
  // Update mock data (for demonstration only)
  guild.memberCount += 1;
  mockUserProfile = updatedProfile;
  
  return updatedProfile;
};

// Leave guild
export const leaveGuild = async (walletAddress?: string): Promise<UserProfile> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Get current guild
  const guildId = mockUserProfile.guild;
  if (!guildId) {
    throw new Error('User is not a member of any guild');
  }
  
  // Find guild
  const guild = mockGuilds.find(g => g.id === guildId);
  if (guild) {
    guild.memberCount = Math.max(0, guild.memberCount - 1);
  }
  
  // Update user profile
  const updatedProfile = {
    ...mockUserProfile,
    guild: null
  };
  
  // In a real application, this would call the Solana contract to leave a guild
  
  // Update mock data (for demonstration only)
  mockUserProfile = updatedProfile;
  
  return updatedProfile;
};

// Create guild
export const createGuild = async (
  name: string, 
  description: string, 
  specialty: string, 
  walletAddress?: string
): Promise<Guild> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Create new guild
  const now = new Date();
  
  const newGuild: Guild = {
    id: generateRandomId(),
    name,
    description,
    icon: '⚔️', // Default icon
    founderAddress: walletAddress || 'unknown',
    foundedAt: now,
    memberCount: 1, // Founder himself
    specialty
  };
  
  // In a real application, this would call the Solana contract to create a guild
  
  // Add the new guild to mock data (for demonstration only)
  mockGuilds.push(newGuild);
  
  // Update user profile, add user to new guild
  mockUserProfile.guild = newGuild.id;
  
  return newGuild;
};

// Get guilds list
export const getGuilds = async (): Promise<Guild[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  return mockGuilds;
};

// Get user profile
export const getUserProfile = async (walletAddress?: string): Promise<UserProfile> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  // In a real application, this would query on-chain data based on wallet address
  return mockUserProfile;
};

// Get SOL balance
export const getSolBalance = async (wallet: WalletContextState): Promise<number> => {
  if (!wallet.publicKey) throw new Error('Wallet not connected');
  
  try {
    const balance = await CONNECTION.getBalance(wallet.publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Failed to get SOL balance:', error);
    throw error;
  }
};

// Mock data
const mockMaterials: Material[] = [
  {
    id: '1',
    name: 'Fire Essence',
    description: 'A lively fire element essence, the base material for fire magic potions',
    icon: '🔥',
    type: MaterialType.ELEMENT,
    rarity: MaterialRarity.UNCOMMON,
    discoveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
    source: 'Collected from volcanic areas',
    elements: ['Fire']
  },
  {
    id: '2',
    name: 'Moon Herb',
    description: 'A mysterious herb that blooms only under moonlight, with powerful magical properties',
    icon: '🌿',
    type: MaterialType.HERB,
    rarity: MaterialRarity.RARE,
    discoveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60), // 60 days ago
    source: 'Collected from moonlight forests',
    elements: ['Water', 'Light']
  },
  {
    id: '3',
    name: 'Star Ore',
    description: 'A rare mineral extracted from meteors, containing star energy',
    icon: '💎',
    type: MaterialType.MINERAL,
    rarity: MaterialRarity.EPIC,
    discoveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90), // 90 days ago
    source: 'Mined from meteor craters',
    elements: ['Earth', 'Star']
  },
  {
    id: '4',
    name: 'Dragon Breath Dust',
    description: 'A rare dust formed by the dragon\'s breath, extremely rare',
    icon: '✨',
    type: MaterialType.ESSENCE,
    rarity: MaterialRarity.LEGENDARY,
    discoveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180), // 180 days ago
    source: 'Explored from dragon nests',
    elements: ['Fire', 'Wind', 'Dragon']
  },
  {
    id: '5',
    name: 'Magic Crystal',
    description: 'A special crystal that catalyzes magical reactions, a must-have for alchemists',
    icon: '🔮',
    type: MaterialType.CATALYST,
    rarity: MaterialRarity.UNCOMMON,
    discoveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45), // 45 days ago
    source: 'Collected from magic caves',
    elements: ['Magic']
  },
  {
    id: '6',
    name: 'Ghost Flower',
    description: 'A transparent flower that grows on graves, only visible under a full moon',
    icon: '👻',
    type: MaterialType.HERB,
    rarity: MaterialRarity.RARE,
    discoveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 75), // 75 days ago
    source: 'Collected from ancient graveyards',
    elements: ['Dark', 'Ghost']
  },
  {
    id: '7',
    name: 'Deep Sea Pearl',
    description: 'A pearl produced by deep sea mollusks, containing water element energy',
    icon: '🦪',
    type: MaterialType.ESSENCE,
    rarity: MaterialRarity.UNCOMMON,
    discoveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 50), // 50 days ago
    source: 'Collected from deep sea',
    elements: ['Water']
  },
  {
    id: '8',
    name: 'Thunder Fragment',
    description: 'A rare magic fragment left after a thunder strike, containing powerful thunder energy',
    icon: '⚡',
    type: MaterialType.ELEMENT,
    rarity: MaterialRarity.RARE,
    discoveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40), // 40 days ago
    source: 'Collected from thunder areas',
    elements: ['Thunder']
  }
];

const mockUserMaterials: UserMaterial[] = [
  { 
    id: '1',
    materialId: '1',
    material: mockMaterials[0],
    amount: 5,
    acquiredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15) // 15 days ago
  },
  { 
    id: '2',
    materialId: '2',
    material: mockMaterials[1],
    amount: 3,
    acquiredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10) // 10 days ago
  },
  { 
    id: '3',
    materialId: '3',
    material: mockMaterials[2],
    amount: 1,
    acquiredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) // 5 days ago
  },
  { 
    id: '4',
    materialId: '5',
    material: mockMaterials[4],
    amount: 8,
    acquiredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3) // 3 days ago
  },
  { 
    id: '5',
    materialId: '7',
    material: mockMaterials[6],
    amount: 4,
    acquiredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1) // 1 day ago
  }
];

const mockRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Healing Potion',
    description: 'A basic potion that can quickly heal minor wounds',
    icon: '💚',
    ingredients: [
      { id: '1', name: 'Fire Essence', icon: '🔥', amount: 2 },
      { id: '2', name: 'Moon Herb', icon: '🌿', amount: 1 }
    ],
    result: {
      id: 'result_1',
      name: 'Healing Potion',
      icon: '💚',
      amount: 1
    },
    difficulty: 3,
    craftingTime: 5, // minutes
    discoveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20) // 20 days ago
  },
  {
    id: '2',
    name: 'Magic Recovery Potion',
    description: 'A potion that can quickly recover magic power',
    icon: '💙',
    ingredients: [
      { id: '3', name: 'Magic Crystal', icon: '🔮', amount: 3 },
      { id: '4', name: 'Deep Sea Pearl', icon: '🦪', amount: 2 }
    ],
    result: {
      id: 'result_2',
      name: 'Magic Recovery Potion',
      icon: '💙',
      amount: 1
    },
    difficulty: 5,
    craftingTime: 10, // minutes
    discoveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15) // 15 days ago
  },
  {
    id: '3',
    name: 'Dragon Breath Potion',
    description: 'A potion that can temporarily spray flames',
    icon: '🔥',
    ingredients: [
      { id: '5', name: 'Fire Essence', icon: '🔥', amount: 5 },
      { id: '6', name: 'Dragon Breath Dust', icon: '✨', amount: 1 },
      { id: '7', name: 'Magic Crystal', icon: '🔮', amount: 2 }
    ],
    result: {
      id: 'result_3',
      name: 'Dragon Breath Potion',
      icon: '🔥',
      amount: 1
    },
    difficulty: 8,
    craftingTime: 30, // minutes
    discoveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) // 5 days ago
  }
];

const mockUserRecipes: UserRecipe[] = [
  { 
    id: '1',
    recipeId: '1',
    recipe: mockRecipes[0],
    learnedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days ago
    timesUsed: 5,
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1) // 1 day ago
  },
  { 
    id: '2',
    recipeId: '2',
    recipe: mockRecipes[1],
    learnedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    timesUsed: 2,
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) // 2 days ago
  }
];

// Create mock achievements
const mockAchievements: Achievement[] = [
  {
    id: '1',
    name: 'First Steps',
    description: 'Started your alchemy journey',
    icon: '🔰',
    requirement: 'Join the platform',
    reward: 'Starter potion',
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) // 30 days ago
  },
  {
    id: '2',
    name: 'Collector',
    description: 'Collected 5 different materials',
    icon: '🧪',
    requirement: 'Collect 5 materials',
    reward: '50 XP',
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15) // 15 days ago
  },
  {
    id: '3',
    name: 'Apprentice Alchemist',
    description: 'Created your first potion',
    icon: '⚗️',
    requirement: 'Create any potion',
    reward: 'Alchemy recipe book',
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10) // 10 days ago
  }
];

const mockCraftings: Crafting[] = [
  {
    id: '1',
    recipeId: '1',
    recipe: mockRecipes[0],
    startedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    completesAt: new Date(Date.now() - 1000 * 60 * 55), // 55 minutes ago
    status: 'completed',
    userAddress: 'user123'
  },
  {
    id: '2',
    recipeId: '2',
    recipe: mockRecipes[1],
    startedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    completesAt: new Date(Date.now() - 1000 * 60 * 20), // 20 minutes ago
    status: 'completed',
    userAddress: 'user123'
  },
  {
    id: '3',
    recipeId: '3',
    recipe: mockRecipes[2],
    startedAt: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
    completesAt: new Date(Date.now() + 1000 * 60 * 20), // 20 minutes from now
    status: 'inProgress',
    userAddress: 'user123'
  }
];

const mockGuilds: Guild[] = [
  {
    id: '1',
    name: 'Star Alchemist Guild',
    description: 'Focused on star magic and high-level alchemy, a mysterious guild',
    icon: '✨',
    founderAddress: '8Kzw8fXgXxjTZU5cEWKQJFSLWbYTTem4QXZLxgLjqgN3',
    foundedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100), // 100 days ago
    memberCount: 42,
    specialty: 'Stellar Alchemy'
  },
  {
    id: '2',
    name: 'Herb Scholar Association',
    description: 'A scholar organization dedicated to researching various magical plants and herb properties',
    icon: '🌿',
    founderAddress: '6JkKdP3yhPH5ZZLYcFdDCAkVwdLd2mZVrXEZ9cEXcLbV',
    foundedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 80), // 80 days ago
    memberCount: 78,
    specialty: 'Herbology'
  },
  {
    id: '3',
    name: 'Rune Magic Research Institute',
    description: 'A secret organization dedicated to researching ancient runes and magic runes',
    icon: '📜',
    founderAddress: '3KzHXLDAtux5EAMErXmrfSRQZtNZZ4BgTNPytr9SJbr1',
    foundedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60), // 60 days ago
    memberCount: 36,
    specialty: 'Runeology'
  }
];

let mockUserProfile: UserProfile = {
  address: 'user123',
  displayName: 'Magic Apprentice',
  avatar: '🧙‍♂️',
  level: 3,
  experience: 450,
  guild: '1', // Star Alchemist Guild
  joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
  achievements: mockAchievements,
  materials: mockUserMaterials,
  recipes: mockUserRecipes,
  craftings: mockCraftings
}; 