// @ts-ignore
import React from 'react';
// @ts-ignore
import { Routes, Route, Navigate } from 'react-router-dom';
// @ts-ignore
import styled from 'styled-components';
// @ts-ignore
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
// @ts-ignore
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
// @ts-ignore
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
// @ts-ignore
import { clusterApiUrl } from '@solana/web3.js';

// Components
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import LoadingIndicator from './components/LoadingIndicator';

// Pages
import HomePage from './pages/HomePage';
import MaterialsPage from './pages/MaterialsPage';
import RecipesPage from './pages/RecipesPage';
import CraftingPage from './pages/CraftingPage';
import GuildsPage from './pages/GuildsPage';
import ProfilePage from './pages/ProfilePage';

// Context
import { AppContextProvider, useAppContext } from './contexts/AppContext';

// Config
import { SOLANA_NETWORK, CLUSTER_ENDPOINT } from './config/settings';

// Required for Solana wallet adapter
import '@solana/wallet-adapter-react-ui/styles.css';

const App: React.FC = () => {
  // Configure Solana connection
  const endpoint = CLUSTER_ENDPOINT || clusterApiUrl(SOLANA_NETWORK);
  
  // Set up supported wallets
  const wallets = [
    new PhantomWalletAdapter()
  ];
  
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <AppContextProvider>
            <AppContent />
          </AppContextProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

// Separate component to use context inside
const AppContent: React.FC = () => {
  const { state } = useAppContext();
  
  // Show loading indicator if initial data is loading
  if (state.isLoading) {
    return <LoadingIndicator fullscreen message="Loading MagicVial..." />;
  }
  
  return (
    <AppContainer>
      <Navigation />
      
      <MainContent>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/materials" element={<MaterialsPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/crafting" element={<CraftingPage />} />
          <Route path="/guilds" element={<GuildsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          
          {/* Redirect all unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainContent>
      
      <Footer />
    </AppContainer>
  );
};

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const MainContent = styled.main`
  flex: 1;
  padding-top: 70px; /* Account for fixed navbar */
`;

export default App; 