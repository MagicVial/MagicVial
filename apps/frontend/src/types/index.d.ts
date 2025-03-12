import { PublicKey } from '@solana/web3.js';

/**
 * Material types in the alchemy system
 */
export enum MaterialType {
  ELEMENT = 0,  // Basic elements
  HERB = 1,     // Plant-based materials
  MINERAL = 2,  // Earth materials
  ESSENCE = 3,  // Magical essences
  CATALYST = 4, // Materials that accelerate reactions
  SPIRIT = 5,   // Ethereal materials
  SPECIAL = 6   // Unique materials
}

/**
 * Material rarity levels
 */
export enum MaterialRarity {
  COMMON = 0,    // Common materials - easily found
  UNCOMMON = 1,  // Uncommon materials - requires some effort to find
  RARE = 2,      // Rare materials - difficult to find
  EPIC = 3,      // Epic materials - very difficult to find
  LEGENDARY = 4, // Legendary materials - extremely rare
  MYTHIC = 5     // Mythic materials - almost impossible to find
}

/**
 * Achievement interface
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  reward: string;
  completedAt: Date | null;
}

/**
 * Material interface - base material in the system
 */
export interface Material {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: MaterialType;
  rarity: MaterialRarity;
  discoveredAt: Date;
  source: string;
  elements: string[];
}

/**
 * UserMaterial interface - materials owned by a user
 */
export interface UserMaterial {
  id: string;
  materialId: string;
  material: Material;
  amount: number;
  acquiredAt: Date;
}

/**
 * RecipeIngredient interface - ingredient needed for a recipe
 */
export interface RecipeIngredient {
  id: string;
  name: string;
  icon: string;
  amount: number;
}

/**
 * Recipe interface - formula for crafting items
 */
export interface Recipe {
  id: string;
  name: string;
  description: string;
  icon: string;
  ingredients: RecipeIngredient[];
  result: {
    id: string;
    name: string;
    icon: string;
    amount: number;
  };
  difficulty: number;
  craftingTime: number;
  discoveredAt: Date;
}

/**
 * UserRecipe interface - recipes learned by a user
 */
export interface UserRecipe {
  id: string;
  recipeId: string;
  recipe: Recipe;
  learnedAt: Date;
  timesUsed: number;
  lastUsedAt: Date | null;
}

/**
 * Crafting interface - ongoing crafting processes
 */
export interface Crafting {
  id: string;
  recipeId: string;
  recipe: Recipe;
  startedAt: Date;
  completesAt: Date;
  status: 'inProgress' | 'completed' | 'failed';
  userAddress: string;
}

/**
 * Guild interface - community organization
 */
export interface Guild {
  id: string;
  name: string;
  description: string;
  icon: string;
  founderAddress: string;
  foundedAt: Date;
  memberCount: number;
  specialty: string;
}

/**
 * Join guild status enum
 */
export enum JoinGuildStatus {
  SUCCESS = 'success',
  ALREADY_MEMBER = 'already_member',
  GUILD_FULL = 'guild_full',
  ERROR = 'error'
}

/**
 * UserProfile interface - user information
 */
export interface UserProfile {
  address: string;
  displayName: string;
  avatar: string;
  level: number;
  experience: number;
  guild: string | null;
  joinedAt: Date;
  achievements: Achievement[];
  materials: UserMaterial[];
  recipes: UserRecipe[];
  craftings: Crafting[];
}

/**
 * App settings interface - global app settings
 */
export interface AppSettings {
  // UI preferences
  language: string;
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  
  // Network configuration
  network?: 'mainnet-beta' | 'testnet' | 'devnet' | 'localnet';
  materialProgramId?: string;
  recipeProgramId?: string;
  guildProgramId?: string;
}

// Declare global namespaces to avoid type conflicts
declare global {
  interface Window {
    solana: any;
  }
} 