import React from 'react';
import styled from 'styled-components';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Link } from 'react-router-dom';

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  color: #FFFFFF;
`;

const HeroSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 4rem;
  width: 100%;
  max-width: 1200px;
`;

const Title = styled.h1`
  font-size: 3.5rem;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 1rem;
  
  span {
    color: #9945FF;
  }
`;

const Subtitle = styled.p`
  font-size: 1.5rem;
  max-width: 800px;
  margin-bottom: 3rem;
  line-height: 1.6;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-top: 1rem;
`;

const PrimaryButton = styled(Link)`
  background-color: #9945FF;
  color: white;
  padding: 0.8rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #7324e2;
    transform: translateY(-2px);
  }
`;

const SecondaryButton = styled(Link)`
  background-color: transparent;
  color: #9945FF;
  padding: 0.8rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  border: 2px solid #9945FF;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: rgba(153, 69, 255, 0.1);
    transform: translateY(-2px);
  }
`;

const FeaturesSection = styled.section`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 4rem;
  width: 100%;
  max-width: 1200px;
`;

const FeatureCard = styled.div`
  background-color: #1E2142;
  border-radius: 12px;
  padding: 2rem;
  width: 300px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(153, 69, 255, 0.2);
  }
`;

const FeatureIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #9945FF;
`;

const FeatureTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #FFFFFF;
`;

const FeatureDescription = styled.p`
  font-size: 1rem;
  line-height: 1.5;
  color: #FFFFFF;
`;

const CtaSection = styled.section`
  background-color: #1E2142;
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  width: 100%;
  max-width: 1000px;
`;

const CtaTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
`;

const CtaSubtitle = styled.p`
  font-size: 1.2rem;
  margin-bottom: 2rem;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
`;

const Home: React.FC = () => {
  const wallet = useWallet();
  
  return (
    <HomeContainer>
      <HeroSection>
        <Title>Welcome to <span>MagicVial</span></Title>
        <Subtitle>
          Transform from passive holder to active alchemist. Collect materials, discover recipes, and craft unique tokens in Solana's first interactive token ecosystem.
        </Subtitle>
        
        <ButtonContainer>
          {!wallet.connected ? (
            <WalletMultiButton />
          ) : (
            <PrimaryButton to="/laboratory">Enter Laboratory</PrimaryButton>
          )}
          <SecondaryButton to="/recipes">View Recipes</SecondaryButton>
        </ButtonContainer>
      </HeroSection>
      
      <FeaturesSection>
        <FeatureCard>
          <FeatureIcon>🧪</FeatureIcon>
          <FeatureTitle>Collect Materials</FeatureTitle>
          <FeatureDescription>
            Gather base, rare, seasonal, and mysterious materials through holding, tasks, and events.
          </FeatureDescription>
        </FeatureCard>
        
        <FeatureCard>
          <FeatureIcon>📜</FeatureIcon>
          <FeatureTitle>Discover Recipes</FeatureTitle>
          <FeatureDescription>
            Learn basic recipes, experiment with advanced combinations, and create community recipes.
          </FeatureDescription>
        </FeatureCard>
        
        <FeatureCard>
          <FeatureIcon>✨</FeatureIcon>
          <FeatureTitle>Craft Tokens</FeatureTitle>
          <FeatureDescription>
            Create tokens of varying rarity with unique attributes and utilities in the ecosystem.
          </FeatureDescription>
        </FeatureCard>
        
        <FeatureCard>
          <FeatureIcon>🏰</FeatureIcon>
          <FeatureTitle>Form Guilds</FeatureTitle>
          <FeatureDescription>
            Join forces with other alchemists to share resources, collaborate on recipes, and tackle challenges.
          </FeatureDescription>
        </FeatureCard>
      </FeaturesSection>
      
      <CtaSection>
        <CtaTitle>Start Your Alchemy Journey</CtaTitle>
        <CtaSubtitle>
          In MagicVial, holding isn't just waiting—it's creating. Begin your transformation from holder to alchemist today.
        </CtaSubtitle>
        
        <ButtonContainer>
          {!wallet.connected ? (
            <WalletMultiButton />
          ) : (
            <PrimaryButton to="/laboratory">Enter Laboratory</PrimaryButton>
          )}
        </ButtonContainer>
      </CtaSection>
    </HomeContainer>
  );
};

export default Home; 