import React from 'react';
import styled from 'styled-components';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  color: #FFFFFF;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #9945FF;
`;

const NotConnectedMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem;
  gap: 1.5rem;
`;

const ComingSoonContainer = styled.div`
  background-color: #1E2142;
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
`;

const ComingSoonIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const ComingSoonTitle = styled.h2`
  font-size: 2rem;
  margin-bottom: 1rem;
`;

const ComingSoonDescription = styled.p`
  font-size: 1.2rem;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

const Recipes: React.FC = () => {
  const wallet = useWallet();
  
  if (!wallet.connected) {
    return (
      <PageContainer>
        <PageTitle>Recipe Book</PageTitle>
        <NotConnectedMessage>
          <h2>Connect Wallet to Access Recipes</h2>
          <p>You need to connect your wallet to view and learn recipes.</p>
          <WalletMultiButton />
        </NotConnectedMessage>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      <PageTitle>Recipe Book</PageTitle>
      
      <ComingSoonContainer>
        <ComingSoonIcon>📜</ComingSoonIcon>
        <ComingSoonTitle>Recipe Book Coming Soon</ComingSoonTitle>
        <ComingSoonDescription>
          The Recipe Book feature is currently under development. Soon, you'll be able to discover, learn, and create new alchemy recipes here!
        </ComingSoonDescription>
      </ComingSoonContainer>
    </PageContainer>
  );
};

export default Recipes; 