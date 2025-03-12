import React, { useState } from 'react';
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

const ProfileContainer = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ProfileSidebar = styled.div`
  background-color: #1E2142;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const AvatarContainer = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  background-color: #0F1429;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  margin-bottom: 1.5rem;
  border: 2px solid #9945FF;
`;

const AlchemistName = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
`;

const WalletAddress = styled.div`
  font-size: 0.8rem;
  color: #9945FF;
  margin-bottom: 1.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  text-align: center;
`;

const AlchemistLevel = styled.div`
  background-color: #9945FF20;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  color: #9945FF;
  font-weight: 600;
  margin-bottom: 1.5rem;
`;

const StatsContainer = styled.div`
  width: 100%;
  margin-top: 1rem;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #9945FF20;
  
  &:last-child {
    border-bottom: none;
  }
`;

const StatLabel = styled.div`
  color: #FFFFFF80;
`;

const StatValue = styled.div`
  font-weight: 600;
  color: #FFFFFF;
`;

const ProfileContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #9945FF50;
`;

const EmptyState = styled.div`
  background-color: #14162E;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  color: #FFFFFF80;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #9945FF50;
`;

const Tab = styled.div<{ active: boolean }>`
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  position: relative;
  color: ${props => props.active ? '#FFFFFF' : '#FFFFFF80'};
  font-weight: ${props => props.active ? '600' : '400'};
  
  &:after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: #9945FF;
    opacity: ${props => props.active ? '1' : '0'};
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    color: #FFFFFF;
  }
`;

const Profile: React.FC = () => {
  const wallet = useWallet();
  const [activeTab, setActiveTab] = useState(0);
  
  if (!wallet.connected) {
    return (
      <PageContainer>
        <PageTitle>Alchemist Profile</PageTitle>
        <NotConnectedMessage>
          <h2>Connect Wallet to View Profile</h2>
          <p>You need to connect your wallet to access your alchemist profile.</p>
          <WalletMultiButton />
        </NotConnectedMessage>
      </PageContainer>
    );
  }
  
  // Truncate wallet address for display
  const displayAddress = wallet.publicKey ? 
    `${wallet.publicKey.toString().slice(0, 4)}...${wallet.publicKey.toString().slice(-4)}` : 
    '';
  
  return (
    <PageContainer>
      <PageTitle>Alchemist Profile</PageTitle>
      
      <ProfileContainer>
        <ProfileSidebar>
          <AvatarContainer>
            ✨
          </AvatarContainer>
          <AlchemistName>Novice Alchemist</AlchemistName>
          <WalletAddress>{displayAddress}</WalletAddress>
          <AlchemistLevel>Level 1</AlchemistLevel>
          
          <StatsContainer>
            <StatRow>
              <StatLabel>Experience</StatLabel>
              <StatValue>0 / 1000 XP</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Crafts Attempted</StatLabel>
              <StatValue>0</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Successful Crafts</StatLabel>
              <StatValue>0</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Success Rate</StatLabel>
              <StatValue>0%</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Recipes Learned</StatLabel>
              <StatValue>0</StatValue>
            </StatRow>
          </StatsContainer>
        </ProfileSidebar>
        
        <ProfileContent>
          <TabsContainer>
            <Tab active={activeTab === 0} onClick={() => setActiveTab(0)}>
              Inventory
            </Tab>
            <Tab active={activeTab === 1} onClick={() => setActiveTab(1)}>
              Crafting History
            </Tab>
            <Tab active={activeTab === 2} onClick={() => setActiveTab(2)}>
              Achievements
            </Tab>
          </TabsContainer>
          
          {activeTab === 0 && (
            <div>
              <SectionTitle>Your Crafted Items</SectionTitle>
              <EmptyState>
                You haven't crafted any items yet. Visit the Laboratory to start crafting!
              </EmptyState>
            </div>
          )}
          
          {activeTab === 1 && (
            <div>
              <SectionTitle>Crafting History</SectionTitle>
              <EmptyState>
                Your crafting history will appear here once you start crafting.
              </EmptyState>
            </div>
          )}
          
          {activeTab === 2 && (
            <div>
              <SectionTitle>Achievements</SectionTitle>
              <EmptyState>
                Complete crafting milestones to earn achievements!
              </EmptyState>
            </div>
          )}
        </ProfileContent>
      </ProfileContainer>
    </PageContainer>
  );
};

export default Profile; 