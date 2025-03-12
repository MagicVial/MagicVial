/**
 * Global configuration for the MagicVial frontend application
 */

// Solana network configuration
export const SOLANA_NETWORK = process.env.REACT_APP_SOLANA_NETWORK || 'devnet';
export const CLUSTER_ENDPOINT = process.env.REACT_APP_SOLANA_RPC_HOST || 'https://api.devnet.solana.com';

// Program IDs for Solana smart contracts
export const MATERIAL_PROGRAM_ID = process.env.REACT_APP_MATERIAL_PROGRAM_ID || '5fTW2K2BumgLbxNRFJ1GBxKGxewDzWyUJEQCXEVZ1HWs'; // Mock ID
export const RECIPE_PROGRAM_ID = process.env.REACT_APP_RECIPE_PROGRAM_ID || '8DDPvEAjQz6CyUSyKBsBh5eMXco8bMnYhyGTzNSZoxYB';     // Mock ID
export const GUILD_PROGRAM_ID = process.env.REACT_APP_GUILD_PROGRAM_ID || 'GUiLdpQBQCvWt8noxMxjEz8kBKjydLJQpS7hLRdKNvkr';       // Mock ID

// Application settings
export const DEFAULT_LANGUAGE = 'en';
export const DEFAULT_THEME = 'dark';

// Crafting settings
export const CRAFTING_TIMEOUT_MINUTES = 120; // Maximum time a crafting can remain active

// Material related settings
export const MAX_MATERIAL_RARITY = 5;
export const MAX_RECIPE_DIFFICULTY = 10;

// UI settings
export const ITEMS_PER_PAGE = 12;
export const MOBILE_BREAKPOINT = 768;

// Feature flags
export const FEATURES = {
  ENABLE_ACHIEVEMENTS: true,
  ENABLE_GUILDS: true,
  ENABLE_MARKETPLACE: false, // Upcoming feature
  ENABLE_TRADING: false     // Upcoming feature
};

// App version
export const APP_VERSION = '0.1.0';

// UI Settings
export const THEME = {
  // Primary colors
  primary: '#9945FF',
  primaryLight: 'rgba(153, 69, 255, 0.2)',
  primaryDark: '#8432e6',
  
  // Secondary colors
  secondary: '#14F195',
  secondaryLight: 'rgba(20, 241, 149, 0.2)',
  secondaryDark: '#10C77A',
  
  // Gray scale
  gray100: '#F7FAFC',
  gray200: '#EDF2F7',
  gray300: '#E2E8F0',
  gray400: '#CBD5E0',
  gray500: '#A0AEC0',
  gray600: '#718096',
  gray700: '#4A5568',
  gray800: '#2D3748',
  gray900: '#1A202C',
  
  // Background
  background: '#000000',
  backgroundLight: 'rgba(0, 0, 0, 0.2)',
  backgroundDark: 'rgba(0, 0, 0, 0.5)',
  
  // Rarity colors
  rarityCommon: '#CBD5E0',
  rarityUncommon: '#48BB78',
  rarityRare: '#4299E1',
  rarityEpic: '#9F7AEA',
  rarityLegendary: '#ED8936'
};

// API endpoints
export const API = {
  baseUrl: 'https://api.magicvial.xyz',
  ipfsGateway: 'https://gateway.ipfs.io/ipfs/'
};

// Time constants (in milliseconds)
export const TIME = {
  secondMs: 1000,
  minuteMs: 60 * 1000,
  hourMs: 60 * 60 * 1000,
  dayMs: 24 * 60 * 60 * 1000
};

// App metadata
export const APP = {
  name: 'MagicVial',
  description: 'Decentralized Alchemy Platform on Solana',
  version: '0.1.0',
  website: 'https://magicvial.xyz',
  twitter: 'https://twitter.com/magicvial',
  discord: 'https://discord.gg/magicvial',
  github: 'https://github.com/magicvial'
}; 