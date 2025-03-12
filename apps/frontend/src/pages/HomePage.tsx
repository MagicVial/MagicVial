import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Material, Recipe, Guild } from '../types';
import { getMaterials, getRecipes, getGuilds } from '../api/solana';

const HomePage: React.FC = () => {
  const { connected } = useWallet();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch showcase data
        const materialsData = await getMaterials();
        const recipesData = await getRecipes();
        const guildsData = await getGuilds();
        
        // Only display a subset of data
        setMaterials(materialsData.slice(0, 4));
        setRecipes(recipesData.slice(0, 3));
        setGuilds(guildsData.slice(0, 2));
      } catch (error) {
        console.error('Failed to fetch homepage data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <HomeContainer>
      {/* Hero Section */}
      <HeroSection>
        <HeroContent>
          <HeroTitle>
            Explore the Magical World of <GradientText>Alchemy</GradientText>
          </HeroTitle>
          <HeroSubtitle>
            Collect materials, create recipes, craft items, and begin your magical journey
          </HeroSubtitle>
          <HeroButtons>
            {connected ? (
              <PrimaryButton to="/crafting">Start Crafting</PrimaryButton>
            ) : (
              <ConnectWalletButton />
            )}
            <SecondaryButton to="/materials">Explore Materials</SecondaryButton>
          </HeroButtons>
        </HeroContent>
        <HeroGraphic>
          <FloatingPotion color="#FF6B6B" delay={0} top="20%" left="10%" />
          <FloatingPotion color="#4ECDC4" delay={1} top="60%" left="20%" />
          <FloatingPotion color="#FFD166" delay={0.5} top="30%" left="80%" />
          <CauldronImage src="/images/cauldron.svg" alt="Magic Cauldron" />
        </HeroGraphic>
      </HeroSection>

      {/* Features Section */}
      <FeaturesSection>
        <SectionTitle>MagicVial Platform Features</SectionTitle>
        <FeaturesGrid>
          <FeatureCard>
            <FeatureIcon>⚗️</FeatureIcon>
            <FeatureTitle>Collect Rare Materials</FeatureTitle>
            <FeatureDescription>
              Explore the world to collect unique alchemy materials and unlock rare recipes.
            </FeatureDescription>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>📜</FeatureIcon>
            <FeatureTitle>Discover Mysterious Recipes</FeatureTitle>
            <FeatureDescription>
              Through experimentation and research, discover and master ancient alchemy recipes to create powerful items.
            </FeatureDescription>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>🔮</FeatureIcon>
            <FeatureTitle>Craft Magical Items</FeatureTitle>
            <FeatureDescription>
              Combine your materials and recipes to craft unique magical items and showcase your alchemy talents.
            </FeatureDescription>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>🏛️</FeatureIcon>
            <FeatureTitle>Join Alchemy Guilds</FeatureTitle>
            <FeatureDescription>
              Collaborate with like-minded alchemists, share knowledge and resources, and complete grand guild quests.
            </FeatureDescription>
          </FeatureCard>
        </FeaturesGrid>
      </FeaturesSection>

      {/* Materials Preview */}
      {!isLoading && (
        <MaterialsSection>
          <SectionHeader>
            <SectionTitle>Rare Materials</SectionTitle>
            <ViewAllLink to="/materials">View All &rarr;</ViewAllLink>
          </SectionHeader>
          <MaterialsGrid>
            {materials.map((material) => (
              <MaterialCard key={material.id}>
                <MaterialIcon>{material.icon}</MaterialIcon>
                <MaterialInfo>
                  <MaterialName>{material.name}</MaterialName>
                  <MaterialRarity rarity={material.rarity}>
                    Rarity Level {material.rarity}
                  </MaterialRarity>
                </MaterialInfo>
              </MaterialCard>
            ))}
          </MaterialsGrid>
        </MaterialsSection>
      )}

      {/* Alchemy Process */}
      <ProcessSection>
        <SectionTitle>Alchemy Process</SectionTitle>
        <ProcessSteps>
          <ProcessStep>
            <StepNumber>1</StepNumber>
            <StepTitle>Collect Materials</StepTitle>
            <StepDescription>
              Explore the world to gather alchemy materials of various grades for crafting items.
            </StepDescription>
          </ProcessStep>
          <StepArrow>→</StepArrow>
          <ProcessStep>
            <StepNumber>2</StepNumber>
            <StepTitle>Learn Recipes</StepTitle>
            <StepDescription>
              Study ancient alchemy texts to master different item crafting recipes and techniques.
            </StepDescription>
          </ProcessStep>
          <StepArrow>→</StepArrow>
          <ProcessStep>
            <StepNumber>3</StepNumber>
            <StepTitle>Craft Items</StepTitle>
            <StepDescription>
              Place materials in the cauldron according to the recipe and use alchemy to create powerful items.
            </StepDescription>
          </ProcessStep>
        </ProcessSteps>
      </ProcessSection>

      {/* Recipes Preview */}
      {!isLoading && (
        <RecipesSection>
          <SectionHeader>
            <SectionTitle>Featured Recipes</SectionTitle>
            <ViewAllLink to="/recipes">View All &rarr;</ViewAllLink>
          </SectionHeader>
          <RecipesGrid>
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id}>
                <RecipeIcon>{recipe.icon}</RecipeIcon>
                <RecipeContent>
                  <RecipeName>{recipe.name}</RecipeName>
                  <RecipeDifficulty difficulty={recipe.difficulty}>
                    Difficulty: {recipe.difficulty}/10
                  </RecipeDifficulty>
                  <RecipeIngredients>
                    {recipe.ingredients.slice(0, 2).map((ingredient, index) => (
                      <span key={index}>
                        {ingredient.name} x{ingredient.amount}
                        {index < Math.min(recipe.ingredients.length, 2) - 1 ? ', ' : ''}
                      </span>
                    ))}
                    {recipe.ingredients.length > 2 && '...'}
                  </RecipeIngredients>
                </RecipeContent>
              </RecipeCard>
            ))}
          </RecipesGrid>
        </RecipesSection>
      )}

      {/* Guilds Section */}
      {!isLoading && (
        <GuildsSection>
          <SectionHeader>
            <SectionTitle>Popular Guilds</SectionTitle>
            <ViewAllLink to="/guilds">Explore Guilds &rarr;</ViewAllLink>
          </SectionHeader>
          <GuildsGrid>
            {guilds.map((guild) => (
              <GuildCard key={guild.id}>
                <GuildBanner>
                  <GuildIcon>{guild.icon}</GuildIcon>
                </GuildBanner>
                <GuildContent>
                  <GuildName>{guild.name}</GuildName>
                  <GuildMembers>{guild.memberCount} Members</GuildMembers>
                  <GuildSpecialty>Specialty: {guild.specialty}</GuildSpecialty>
                </GuildContent>
              </GuildCard>
            ))}
          </GuildsGrid>
        </GuildsSection>
      )}

      {/* Call to Action */}
      <CtaSection>
        <CtaContent>
          <CtaTitle>Ready to Begin Your Alchemy Journey?</CtaTitle>
          <CtaSubtitle>
            Connect your Solana wallet to start collecting materials, learning recipes, and crafting items.
          </CtaSubtitle>
          <CtaButtons>
            {connected ? (
              <PrimaryButton to="/crafting">Enter Workshop</PrimaryButton>
            ) : (
              <ConnectWalletButton />
            )}
          </CtaButtons>
        </CtaContent>
      </CtaSection>
    </HomeContainer>
  );
};

// Animations
const float = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// Styled Components
const HomeContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const HeroSection = styled.section`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 120px 0 80px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    padding: 100px 0 60px;
    text-align: center;
  }
`;

const HeroContent = styled.div`
  flex: 1;
  max-width: 600px;
  
  @media (max-width: 768px) {
    margin-bottom: 40px;
  }
`;

const HeroTitle = styled.h1`
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 20px;
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const GradientText = styled.span`
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
`;

const HeroSubtitle = styled.p`
  font-size: 1.2rem;
  margin-bottom: 30px;
  line-height: 1.6;
  color: var(--text-color-secondary);
`;

const HeroButtons = styled.div`
  display: flex;
  gap: 15px;
  
  @media (max-width: 768px) {
    justify-content: center;
    flex-wrap: wrap;
  }
`;

const PrimaryButton = styled(Link)`
  display: inline-block;
  background: var(--primary-gradient);
  color: white;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 30px;
  text-decoration: none;
  transition: all 0.3s ease;
  border: none;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }
`;

const SecondaryButton = styled(Link)`
  display: inline-block;
  background: transparent;
  color: var(--primary-color);
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 30px;
  text-decoration: none;
  transition: all 0.3s ease;
  border: 2px solid var(--primary-color);
  
  &:hover {
    background: rgba(106, 17, 203, 0.1);
    transform: translateY(-3px);
  }
`;

const ConnectWalletButton = styled(WalletMultiButton)`
  background: var(--primary-gradient) !important;
  color: white !important;
  font-weight: 600 !important;
  padding: 12px 24px !important;
  border-radius: 30px !important;
  transition: all 0.3s ease !important;
  border: none !important;
  
  &:hover {
    transform: translateY(-3px) !important;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2) !important;
  }
`;

const HeroGraphic = styled.div`
  flex: 1;
  position: relative;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

interface FloatingPotionProps {
  color: string;
  delay: number;
  top: string;
  left: string;
}

const FloatingPotion = styled.div<FloatingPotionProps>`
  position: absolute;
  width: 60px;
  height: 80px;
  border-radius: 50%;
  background: ${props => props.color};
  top: ${props => props.top};
  left: ${props => props.left};
  animation: ${float} 6s ease-in-out infinite;
  animation-delay: ${props => props.delay}s;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  
  &::before {
    content: '';
    position: absolute;
    top: -15px;
    left: 50%;
    transform: translateX(-50%);
    width: 30px;
    height: 15px;
    background: #444;
    border-radius: 15px 15px 0 0;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 10px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
  }
`;

const CauldronImage = styled.img`
  width: 250px;
  height: 250px;
  animation: ${pulse} 4s ease-in-out infinite;
`;

const SectionTitle = styled.h2`
  font-size: 2.2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 50px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -15px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 4px;
    background: var(--primary-gradient);
    border-radius: 4px;
  }
`;

const FeaturesSection = styled.section`
  padding: 80px 0;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
`;

const FeatureCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 40px 30px;
  background: var(--bg-color-light);
  border-radius: 20px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
  }
`;

const FeatureIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 20px;
`;

const FeatureTitle = styled.h3`
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 15px;
  color: var(--text-color);
`;

const FeatureDescription = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-color-secondary);
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
  }
`;

const ViewAllLink = styled(Link)`
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:hover {
    text-decoration: underline;
  }
`;

const MaterialsSection = styled.section`
  padding: 80px 0;
`;

const MaterialsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
`;

const MaterialCard = styled.div`
  display: flex;
  align-items: center;
  padding: 15px;
  background: var(--bg-color-light);
  border-radius: 15px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
`;

const MaterialIcon = styled.div`
  font-size: 2.5rem;
  margin-right: 15px;
  min-width: 50px;
  text-align: center;
`;

const MaterialInfo = styled.div`
  flex: 1;
`;

const MaterialName = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 5px;
`;

interface MaterialRarityProps {
  rarity: number;
}

const MaterialRarity = styled.div<MaterialRarityProps>`
  font-size: 0.85rem;
  color: ${props => {
    if (props.rarity >= 4) return '#FF6B6B';
    if (props.rarity >= 3) return '#FFD166';
    if (props.rarity >= 2) return '#06D6A0';
    return '#118AB2';
  }};
`;

const ProcessSection = styled.section`
  padding: 80px 0;
  background: var(--bg-color-light);
  border-radius: 30px;
  margin: 40px 0;
`;

const ProcessSteps = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
  }
`;

const ProcessStep = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 250px;
`;

const StepNumber = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--primary-gradient);
  color: white;
  font-weight: bold;
  font-size: 1.5rem;
  margin-bottom: 15px;
`;

const StepTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 10px;
`;

const StepDescription = styled.p`
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--text-color-secondary);
`;

const StepArrow = styled.div`
  font-size: 2rem;
  color: var(--primary-color);
  font-weight: bold;
  
  @media (max-width: 768px) {
    transform: rotate(90deg);
  }
`;

const RecipesSection = styled.section`
  padding: 80px 0;
`;

const RecipesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const RecipeCard = styled.div`
  display: flex;
  align-items: center;
  padding: 20px;
  background: var(--bg-color-light);
  border-radius: 15px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
`;

const RecipeIcon = styled.div`
  font-size: 2.5rem;
  margin-right: 20px;
  min-width: 50px;
  text-align: center;
`;

const RecipeContent = styled.div`
  flex: 1;
`;

const RecipeName = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 8px;
`;

interface RecipeDifficultyProps {
  difficulty: number;
}

const RecipeDifficulty = styled.div<RecipeDifficultyProps>`
  font-size: 0.9rem;
  color: ${props => {
    if (props.difficulty >= 8) return '#FF6B6B';
    if (props.difficulty >= 5) return '#FFD166';
    return '#06D6A0';
  }};
  margin-bottom: 8px;
`;

const RecipeIngredients = styled.div`
  font-size: 0.9rem;
  color: var(--text-color-secondary);
`;

const GuildsSection = styled.section`
  padding: 80px 0;
`;

const GuildsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const GuildCard = styled.div`
  background: var(--bg-color-light);
  border-radius: 15px;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
`;

const GuildBanner = styled.div`
  height: 120px;
  background: var(--primary-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const GuildIcon = styled.div`
  font-size: 3rem;
  color: white;
`;

const GuildContent = styled.div`
  padding: 20px;
`;

const GuildName = styled.h3`
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 10px;
`;

const GuildMembers = styled.div`
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  margin-bottom: 5px;
`;

const GuildSpecialty = styled.div`
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--primary-color);
`;

const CtaSection = styled.section`
  padding: 80px 0;
  margin: 40px 0;
  background: var(--primary-gradient);
  border-radius: 30px;
  text-align: center;
`;

const CtaContent = styled.div`
  max-width: 700px;
  margin: 0 auto;
  padding: 0 20px;
`;

const CtaTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const CtaSubtitle = styled.p`
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 30px;
  line-height: 1.6;
`;

const CtaButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

export default HomePage; 