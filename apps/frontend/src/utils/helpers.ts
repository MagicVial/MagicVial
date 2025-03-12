import { MaterialRarity, MaterialType } from '../types';
import { TIME, THEME } from '../config/settings';

/**
 * Helper functions for the MagicVial application
 */

/**
 * Generates a random ID
 * @returns A random string ID
 */
export const generateRandomId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * Formats a date to a readable string
 * @param date The date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

/**
 * Formats a timestamp (in milliseconds) to a readable string
 * @param timestamp Timestamp in milliseconds
 * @returns Formatted date string
 */
export const formatTimestamp = (timestamp: number): string => {
  return formatDate(new Date(timestamp));
};

/**
 * Truncates a string if it's longer than maxLength
 * @param str The string to truncate
 * @param maxLength Maximum length of the string
 * @returns Truncated string
 */
export const truncateString = (str: string, maxLength: number): string => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
};

/**
 * Truncates a Solana wallet address
 * @param address The wallet address to truncate
 * @returns Truncated address (e.g. "Ax3dF...k7R9")
 */
export const truncateAddress = (address: string): string => {
  if (!address) return '';
  if (address.length <= 10) return address;
  return address.slice(0, 5) + '...' + address.slice(-4);
};

/**
 * Formats a number with commas
 * @param num The number to format
 * @returns Formatted number string
 */
export const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Calculates time remaining in a crafting process
 * @param completesAt Completion timestamp
 * @returns Object with days, hours, minutes, seconds remaining
 */
export const calculateTimeRemaining = (completesAt: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
} => {
  const now = new Date();
  const difference = completesAt.getTime() - now.getTime();
  
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
  }
  
  const totalSeconds = Math.floor(difference / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  
  return { days, hours, minutes, seconds, totalSeconds };
};

/**
 * Formats a time remaining object to a readable string
 * @param timeRemaining Object with time remaining data
 * @returns Formatted time string (e.g. "2h 15m 30s")
 */
export const formatTimeRemaining = (timeRemaining: {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}): string => {
  if (timeRemaining.days > 0) {
    return `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m`;
  }
  
  if (timeRemaining.hours > 0) {
    return `${timeRemaining.hours}h ${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
  }
  
  if (timeRemaining.minutes > 0) {
    return `${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
  }
  
  return `${timeRemaining.seconds}s`;
};

/**
 * Debounce function to limit how often a function can be called
 * @param func The function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T, 
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number | null = null;
  
  return (...args: Parameters<T>): void => {
    if (timeout) window.clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), wait);
  };
};

/**
 * Gets the enum key by value
 * @param enumObject The enum object
 * @param enumValue The enum value
 * @returns The enum key as string
 */
export const getEnumKeyByValue = <T extends { [key: string]: string | number }>(
  enumObject: T,
  enumValue: string | number
): string | undefined => {
  return Object.keys(enumObject).find(key => enumObject[key] === enumValue);
};

/**
 * Checks if a string is a valid JSON
 * @param str The string to check
 * @returns True if the string is valid JSON
 */
export const isValidJson = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Formats a relative time, converting timestamp to a representation relative to now
 * @param timestamp Timestamp (milliseconds)
 * @returns Formatted relative time string
 */
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} days ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} months ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} years ago`;
};

/**
 * Format date and time
 */
export const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date);
};

/**
 * Format material type to a readable string
 * @param materialType Material type enum value or string
 * @returns Formatted material type string
 */
export const formatMaterialType = (materialType: string): string => {
  switch (materialType) {
    case '0':
    case MaterialType[MaterialType.ELEMENT].toString():
      return 'Element';
    case '1':
    case MaterialType[MaterialType.HERB].toString():
      return 'Herb';
    case '2':
    case MaterialType[MaterialType.MINERAL].toString():
      return 'Mineral';
    case '3':
    case MaterialType[MaterialType.ESSENCE].toString():
      return 'Essence';
    case '4':
    case MaterialType[MaterialType.CATALYST].toString():
      return 'Catalyst';
    default:
      return 'Unknown';
  }
};

/**
 * Format time (minutes to hours and minutes)
 */
export const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  }
  return `${mins}m`;
};

/**
 * Format countdown time
 */
export const formatCountdown = (milliseconds: number): string => {
  if (milliseconds <= 0) {
    return 'Complete';
  }
  
  const seconds = Math.floor((milliseconds / 1000) % 60);
  const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Get material type display name
 */
export const getMaterialTypeName = (type: MaterialType): string => {
  switch (type) {
    case MaterialType.ELEMENT:
      return 'Element';
    case MaterialType.HERB:
      return 'Herb';
    case MaterialType.MINERAL:
      return 'Mineral';
    case MaterialType.ESSENCE:
      return 'Essence';
    case MaterialType.CATALYST:
      return 'Catalyst';
    default:
      return 'Unknown';
  }
};

/**
 * Get material rarity display name
 */
export const getMaterialRarityName = (rarity: MaterialRarity): string => {
  switch (rarity) {
    case MaterialRarity.COMMON:
      return 'Common';
    case MaterialRarity.UNCOMMON:
      return 'Uncommon';
    case MaterialRarity.RARE:
      return 'Rare';
    case MaterialRarity.EPIC:
      return 'Epic';
    case MaterialRarity.LEGENDARY:
      return 'Legendary';
    default:
      return 'Unknown';
  }
};

/**
 * Get corresponding color based on rarity
 * @param rarity Rarity string
 * @returns Corresponding color code
 */
export const getRarityColor = (rarity: string): string => {
  switch (rarity.toLowerCase()) {
    case 'common':
      return '#8F9E9F'; // Gray
    case 'uncommon':
      return '#4CAF50'; // Green
    case 'rare':
      return '#2196F3'; // Blue
    case 'epic':
      return '#9C27B0'; // Purple
    case 'legendary':
      return '#FF9800'; // Orange
    default:
      return '#8F9E9F'; // Default gray
  }
};

/**
 * Generate unique ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

/**
 * Shorten wallet address
 * @param address Full wallet address
 * @returns Shortened address display format
 */
export const shortenAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

/**
 * Check if browser supports Solana wallet
 */
export const isSolanaWalletSupported = (): boolean => {
  return typeof window !== 'undefined' && 'solana' in window;
};

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  const result = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = deepClone(obj[key]);
    }
  }
  
  return result;
};

/**
 * Calculate maximum mint amount
 */
export const calculateMaxMintAmount = (currentSupply: number, maxSupply: number): number => {
  return Math.max(0, maxSupply - currentSupply);
};

/**
 * Format SOL amount
 */
export const formatSolAmount = (amount: number): string => {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 9
  });
};

/**
 * Format price, display as SOL
 */
export const formatPrice = (lamports: number): string => {
  const sol = lamports / 1000000000;
  return `${sol.toFixed(4)} SOL`;
};

/**
 * Calculate remaining time (minutes and seconds)
 * @param startTime Start timestamp (milliseconds)
 * @param duration Duration (minutes)
 * @returns Remaining time (minutes)
 */
export const calculateTimeLeft = (startTime: number, duration: number): number => {
  const now = Date.now();
  const endTime = startTime + (duration * 60 * 1000);
  const diffInSeconds = Math.max(0, Math.floor((endTime - now) / 1000));
  return Math.ceil(diffInSeconds / 60);
};

/**
 * Format time to MM:SS format
 */
export const formatTimeMMSS = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Truncate text, add ellipsis if exceeds length
 */
export const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Randomly select an element from an array
 */
export const randomChoice = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

/**
 * Calculate element attribute background color
 */
export const getElementColor = (element: string): string => {
  const colors: Record<string, string> = {
    'fire': '#E74C3C',
    'water': '#3498DB',
    'air': '#ECF0F1',
    'earth': '#795548',
    'light': '#F1C40F',
    'dark': '#34495E',
    'nature': '#2ECC71',
    'arcane': '#9B59B6'
  };
  
  return colors[element.toLowerCase()] || '#7D8DA7';
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (part: number, total: number): number => {
  if (total === 0) return 0;
  return (part / total) * 100;
};

/**
 * Check if user has enough materials to make a recipe
 * @param recipe Recipe object
 * @param userMaterials User's materials array
 * @returns Whether there are enough materials
 */
export const hasEnoughMaterials = (
  recipe: { ingredients: Array<{ materialId: string; amount: number }> },
  userMaterials: Array<{ materialId: string; balance: number }>
): boolean => {
  if (!recipe || !recipe.ingredients || !userMaterials) return false;
  
  return recipe.ingredients.every(ingredient => {
    const userMaterial = userMaterials.find(um => um.materialId === ingredient.materialId);
    return userMaterial && userMaterial.balance >= ingredient.amount;
  });
};

/**
 * Calculate recipe completion percentage
 * @param startTime Start timestamp (milliseconds)
 * @param duration Duration (minutes)
 * @returns Completion percentage (0-100)
 */
export const calculateProgress = (startTime: number, duration: number): number => {
  if (!startTime || !duration) return 0;
  
  const now = Date.now();
  const endTime = startTime + (duration * 60 * 1000);
  
  if (now >= endTime) return 100;
  
  const totalDuration = duration * 60 * 1000;
  const elapsed = now - startTime;
  
  return Math.min(100, Math.floor((elapsed / totalDuration) * 100));
};

/**
 * Format amount, add thousands separator
 * @param amount Number amount
 * @returns Formatted amount string
 */
export const formatAmount = (amount: number): string => {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * Get random integer, range [min, max]
 * @param min Minimum value (inclusive)
 * @param max Maximum value (inclusive)
 * @returns Random integer
 */
export const getRandomInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}; 