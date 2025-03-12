import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  AppSettings, 
  Material, 
  UserMaterial, 
  Recipe, 
  UserRecipe, 
  Crafting, 
  Guild, 
  UserProfile 
} from '../types';
import { 
  getMaterials, 
  getRecipes, 
  getUserMaterials, 
  getUserRecipes, 
  getUserCraftings, 
  getGuilds,
  getUserProfile
} from '../api/solana';
import { DEFAULT_LANGUAGE, DEFAULT_THEME } from '../config/settings';

// Define the state structure
interface AppState {
  isLoading: boolean;
  materials: Material[];
  userMaterials: UserMaterial[];
  recipes: Recipe[];
  userRecipes: UserRecipe[];
  craftings: Crafting[];
  guilds: Guild[];
  userProfile: UserProfile | null;
  settings: AppSettings;
  error: string | null;
}

// Initial state
const initialState: AppState = {
  isLoading: true,
  materials: [],
  userMaterials: [],
  recipes: [],
  userRecipes: [],
  craftings: [],
  guilds: [],
  userProfile: null,
  settings: {
    language: DEFAULT_LANGUAGE,
    theme: 'dark',
    soundEnabled: true,
    notificationsEnabled: true
  },
  error: null
};

// Define action types
type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_MATERIALS'; payload: Material[] }
  | { type: 'SET_USER_MATERIALS'; payload: UserMaterial[] }
  | { type: 'SET_RECIPES'; payload: Recipe[] }
  | { type: 'SET_USER_RECIPES'; payload: UserRecipe[] }
  | { type: 'SET_CRAFTINGS'; payload: Crafting[] }
  | { type: 'ADD_CRAFTING'; payload: Crafting }
  | { type: 'UPDATE_CRAFTING'; payload: Crafting }
  | { type: 'SET_GUILDS'; payload: Guild[] }
  | { type: 'SET_USER_PROFILE'; payload: UserProfile }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'SET_ERROR'; payload: string | null };

// Reducer function
const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_MATERIALS':
      return { ...state, materials: action.payload };
    case 'SET_USER_MATERIALS':
      return { ...state, userMaterials: action.payload };
    case 'SET_RECIPES':
      return { ...state, recipes: action.payload };
    case 'SET_USER_RECIPES':
      return { ...state, userRecipes: action.payload };
    case 'SET_CRAFTINGS':
      return { ...state, craftings: action.payload };
    case 'ADD_CRAFTING':
      return { ...state, craftings: [...state.craftings, action.payload] };
    case 'UPDATE_CRAFTING':
      return {
        ...state,
        craftings: state.craftings.map(crafting =>
          crafting.id === action.payload.id ? action.payload : crafting
        )
      };
    case 'SET_GUILDS':
      return { ...state, guilds: action.payload };
    case 'SET_USER_PROFILE':
      return { ...state, userProfile: action.payload };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

// Create context
interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  refreshUserData: () => Promise<void>;
  refreshAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

// Provider component
interface AppContextProviderProps {
  children: React.ReactNode;
}

export const AppContextProvider: React.FC<AppContextProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { connected, publicKey } = useWallet();

  // Fetch user data when wallet is connected
  const refreshUserData = async () => {
    if (!connected || !publicKey) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const [userMaterials, userRecipes, craftings, userProfile] = await Promise.all([
        getUserMaterials(publicKey.toString()),
        getUserRecipes(publicKey.toString()),
        getUserCraftings(publicKey.toString()),
        getUserProfile(publicKey.toString())
      ]);

      dispatch({ type: 'SET_USER_MATERIALS', payload: userMaterials });
      dispatch({ type: 'SET_USER_RECIPES', payload: userRecipes });
      dispatch({ type: 'SET_CRAFTINGS', payload: craftings });
      dispatch({ type: 'SET_USER_PROFILE', payload: userProfile });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('Error fetching user data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load user data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Fetch all data, including global data
  const refreshAllData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Fetch global data
      const [materials, recipes, guilds] = await Promise.all([
        getMaterials(),
        getRecipes(),
        getGuilds()
      ]);

      dispatch({ type: 'SET_MATERIALS', payload: materials });
      dispatch({ type: 'SET_RECIPES', payload: recipes });
      dispatch({ type: 'SET_GUILDS', payload: guilds });
      
      // Fetch user data if connected
      if (connected && publicKey) {
        await refreshUserData();
      }
      
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('Error fetching data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Load data when the app starts
  useEffect(() => {
    refreshAllData();
  }, []);

  // Refresh user data when wallet connection changes
  useEffect(() => {
    if (connected && publicKey) {
      refreshUserData();
    }
  }, [connected, publicKey]);

  // Apply theme setting
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.settings.theme);
    
    // Save settings to localStorage
    localStorage.setItem('magicvial-settings', JSON.stringify(state.settings));
  }, [state.settings.theme]);

  // Load settings from localStorage on first load
  useEffect(() => {
    const savedSettings = localStorage.getItem('magicvial-settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        dispatch({ type: 'UPDATE_SETTINGS', payload: parsedSettings });
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, refreshUserData, refreshAllData }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = (): AppContextProps => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
}; 