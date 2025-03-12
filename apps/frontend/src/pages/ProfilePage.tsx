import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useMaterials } from '../contexts/MaterialsContext';
import { useRecipes } from '../contexts/RecipesContext';
import { useCrafting } from '../contexts/CraftingContext';
import { useGuilds } from '../contexts/GuildsContext';
import { UserMaterial, UserRecipe, Crafting, MaterialRarity, MaterialType } from '../types';
import { formatRelativeTime, shortenAddress, getRarityColor, formatMaterialType } from '../utils/helpers';

const tabs = ['Overview', 'Materials', 'Recipes', 'Achievements'];

const ProfilePage: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const { userMaterials, materials } = useMaterials();
  const { userRecipes, recipes } = useRecipes();
  const { craftings } = useCrafting();
  const { userProfile, guilds } = useGuilds();
  const [activeTab, setActiveTab] = useState(0);
  const [activeMaterialFilter, setActiveMaterialFilter] = useState<string | null>(null);
  const [activeRecipeFilter, setActiveRecipeFilter] = useState<string | null>(null);
  
  // Calculate various statistics
  const materialCount = userMaterials.length;
  const recipeCount = userRecipes.length;
  const completedCraftingCount = craftings.filter(c => c.completed).length;
  const achievementCount = userProfile?.achievements?.length || 0;
  
  // Get user's current guild
  const userGuild = userProfile?.guildId 
    ? guilds.find(g => g.id === userProfile.guildId)
    : null;
  
  // Filter materials by type
  const filteredMaterials = activeMaterialFilter
    ? userMaterials.filter(um => {
        const material = materials.find(m => m.id === um.materialId);
        return material && 
          (activeMaterialFilter === 'all' || 
           MaterialType[material.materialType].toLowerCase() === activeMaterialFilter);
      })
    : userMaterials;
  
  // Filter recipes by difficulty
  const filteredRecipes = activeRecipeFilter
    ? userRecipes.filter(ur => {
        const recipe = recipes.find(r => r.id === ur.recipeId);
        return recipe && 
          (activeRecipeFilter === 'all' || 
           MaterialRarity[recipe.difficulty].toLowerCase() === activeRecipeFilter);
      })
    : userRecipes;
  
  // Get material details
  const getMaterialDetails = (materialId: string) => {
    return materials.find(m => m.id === materialId);
  };
  
  // Get recipe details
  const getRecipeDetails = (recipeId: string) => {
    return recipes.find(r => r.id === recipeId);
  };
  
  // Switch to specified tab
  const handleTabChange = (index: number) => {
    setActiveTab(index);
  };
  
  if (!connected) {
    return (
      <PageContainer>
        <PageHeader>
          <h1>Alchemist Profile</h1>
          <p>View your material collection, mastered recipes, and alchemical achievements</p>
        </PageHeader>
        
        <ConnectWalletSection>
          <h2>Connect wallet to view your profile</h2>
          <p>Connect your Solana wallet to access your materials, recipes, alchemical activities, and achievements</p>
          <StyledWalletButton />
        </ConnectWalletSection>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      <PageHeader>
        <h1>Alchemist Profile</h1>
        <p>Manage your materials, recipes, and alchemical achievements</p>
      </PageHeader>
      
      <ProfileSection>
        <ProfileHeader>
          <ProfileAvatar>
            {userProfile?.avatar || '🧙‍♂️'}
          </ProfileAvatar>
          
          <ProfileInfo>
            <ProfileName>
              {userProfile?.displayName || 'Anonymous Alchemist'}
            </ProfileName>
            
            <ProfileAddress>
              {publicKey && shortenAddress(publicKey.toString())}
            </ProfileAddress>
            
            {userGuild && (
              <GuildBadge>
                <GuildIcon>{userGuild.emblem || '⚔️'}</GuildIcon>
                <GuildName>{userGuild.name}</GuildName>
              </GuildBadge>
            )}
          </ProfileInfo>
          
          <ProfileStats>
            <StatItem>
              <StatValue>{materialCount}</StatValue>
              <StatLabel>Materials</StatLabel>
            </StatItem>
            
            <StatItem>
              <StatValue>{recipeCount}</StatValue>
              <StatLabel>Recipes</StatLabel>
            </StatItem>
            
            <StatItem>
              <StatValue>{completedCraftingCount}</StatValue>
              <StatLabel>Crafting</StatLabel>
            </StatItem>
            
            <StatItem>
              <StatValue>{achievementCount}</StatValue>
              <StatLabel>Achievements</StatLabel>
            </StatItem>
          </ProfileStats>
        </ProfileHeader>
        
        <TabsContainer>
          <TabsHeader>
            {tabs.map((tab, index) => (
              <TabButton 
                key={index}
                active={activeTab === index}
                onClick={() => handleTabChange(index)}
              >
                {tab}
              </TabButton>
            ))}
          </TabsHeader>
          
          <TabContent>
            {activeTab === 0 && (
              <OverviewTab>
                <OverviewSection>
                  <SectionTitle>Personal Information</SectionTitle>
                  <InfoGrid>
                    <InfoItem>
                      <InfoLabel>Join Time</InfoLabel>
                      <InfoValue>
                        {userProfile?.joinedAt ? formatRelativeTime(userProfile.joinedAt) : 'Unknown'}
                      </InfoValue>
                    </InfoItem>
                    
                    <InfoItem>
                      <InfoLabel>Alchemical Level</InfoLabel>
                      <InfoValue>
                        {userProfile?.level || 1}
                      </InfoValue>
                    </InfoItem>
                    
                    <InfoItem>
                      <InfoLabel>Guild</InfoLabel>
                      <InfoValue>
                        {userGuild ? userGuild.name : 'Not in a Guild'}
                      </InfoValue>
                    </InfoItem>
                    
                    <InfoItem>
                      <InfoLabel>Completed Crafting</InfoLabel>
                      <InfoValue>
                        {completedCraftingCount}
                      </InfoValue>
                    </InfoItem>
                  </InfoGrid>
                </OverviewSection>
                
                <OverviewSection>
                  <SectionTitle>Latest Crafting</SectionTitle>
                  {craftings.length > 0 ? (
                    <RecentCraftings>
                      {craftings.slice(0, 3).map(crafting => {
                        const recipe = getRecipeDetails(crafting.recipeId);
                        return (
                          <CraftingItem key={crafting.id}>
                            <CraftingIcon>{recipe?.icon || '🧪'}</CraftingIcon>
                            <CraftingInfo>
                              <CraftingName>{recipe?.name || 'Unknown Potion'}</CraftingName>
                              <CraftingDate>
                                {crafting.completed 
                                  ? `Completed on ${formatRelativeTime(crafting.completedAt || 0)}` 
                                  : `Started on ${formatRelativeTime(crafting.startTime)}`}
                              </CraftingDate>
                            </CraftingInfo>
                            {crafting.completed && <CompletedTag>Completed</CompletedTag>}
                          </CraftingItem>
                        );
                      })}
                    </RecentCraftings>
                  ) : (
                    <EmptyMessage>No crafting activities yet</EmptyMessage>
                  )}
                </OverviewSection>
                
                <OverviewSection>
                  <SectionTitle>Rare Materials</SectionTitle>
                  {userMaterials.length > 0 ? (
                    <RareMaterials>
                      {userMaterials
                        .filter(um => {
                          const material = getMaterialDetails(um.materialId);
                          return material && material.rarity >= 3; // Epic or Legendary
                        })
                        .slice(0, 4)
                        .map(um => {
                          const material = getMaterialDetails(um.materialId);
                          return material ? (
                            <MaterialItem key={um.materialId}>
                              <MaterialIcon>{material.icon || '🧪'}</MaterialIcon>
                              <MaterialInfo>
                                <MaterialName>{material.name}</MaterialName>
                                <MaterialRarityBadge rarity={MaterialRarity[material.rarity].toLowerCase()}>
                                  {MaterialRarity[material.rarity]}
                                </MaterialRarityBadge>
                              </MaterialInfo>
                              <MaterialAmount>×{um.balance}</MaterialAmount>
                            </MaterialItem>
                          ) : null;
                        })}
                    </RareMaterials>
                  ) : (
                    <EmptyMessage>No rare materials collected yet</EmptyMessage>
                  )}
                </OverviewSection>
                
                {userProfile?.achievements && userProfile.achievements.length > 0 && (
                  <OverviewSection>
                    <SectionTitle>Latest Achievements</SectionTitle>
                    <RecentAchievements>
                      {userProfile.achievements.slice(0, 3).map((achievement, index) => (
                        <AchievementItem key={index}>
                          <AchievementIcon>{achievement.icon || '🏆'}</AchievementIcon>
                          <AchievementInfo>
                            <AchievementName>{achievement.name}</AchievementName>
                            <AchievementDate>
                              {formatRelativeTime(achievement.unlockedAt)}
                            </AchievementDate>
                          </AchievementInfo>
                        </AchievementItem>
                      ))}
                    </RecentAchievements>
                  </OverviewSection>
                )}
              </OverviewTab>
            )}
            
            {activeTab === 1 && (
              <MaterialsTab>
                <FiltersBar>
                  <FilterButton 
                    active={activeMaterialFilter === null || activeMaterialFilter === 'all'} 
                    onClick={() => setActiveMaterialFilter('all')}
                  >
                    All
                  </FilterButton>
                  <FilterButton 
                    active={activeMaterialFilter === 'element'} 
                    onClick={() => setActiveMaterialFilter('element')}
                  >
                    Element
                  </FilterButton>
                  <FilterButton 
                    active={activeMaterialFilter === 'herb'} 
                    onClick={() => setActiveMaterialFilter('herb')}
                  >
                    Herb
                  </FilterButton>
                  <FilterButton 
                    active={activeMaterialFilter === 'mineral'} 
                    onClick={() => setActiveMaterialFilter('mineral')}
                  >
                    Mineral
                  </FilterButton>
                  <FilterButton 
                    active={activeMaterialFilter === 'essence'} 
                    onClick={() => setActiveMaterialFilter('essence')}
                  >
                    Essence
                  </FilterButton>
                  <FilterButton 
                    active={activeMaterialFilter === 'catalyst'} 
                    onClick={() => setActiveMaterialFilter('catalyst')}
                  >
                    Catalyst
                  </FilterButton>
                </FiltersBar>
                
                {filteredMaterials.length > 0 ? (
                  <MaterialsGrid>
                    {filteredMaterials.map(userMaterial => {
                      const material = getMaterialDetails(userMaterial.materialId);
                      return material ? (
                        <MaterialCard key={userMaterial.materialId}>
                          <MaterialCardIcon>{material.icon || '🧪'}</MaterialCardIcon>
                          <MaterialCardContent>
                            <MaterialCardName>{material.name}</MaterialCardName>
                            <MaterialCardType>
                              {formatMaterialType(material.materialType.toString())}
                            </MaterialCardType>
                            <MaterialCardRarity rarity={MaterialRarity[material.rarity].toLowerCase()}>
                              {MaterialRarity[material.rarity]}
                            </MaterialCardRarity>
                          </MaterialCardContent>
                          <MaterialCardAmount>×{userMaterial.balance}</MaterialCardAmount>
                        </MaterialCard>
                      ) : null;
                    })}
                  </MaterialsGrid>
                ) : (
                  <EmptyMessage>No materials collected yet</EmptyMessage>
                )}
              </MaterialsTab>
            )}
            
            {activeTab === 2 && (
              <RecipesTab>
                <FiltersBar>
                  <FilterButton 
                    active={activeRecipeFilter === null || activeRecipeFilter === 'all'} 
                    onClick={() => setActiveRecipeFilter('all')}
                  >
                    All
                  </FilterButton>
                  <FilterButton 
                    active={activeRecipeFilter === 'common'} 
                    onClick={() => setActiveRecipeFilter('common')}
                  >
                    Common
                  </FilterButton>
                  <FilterButton 
                    active={activeRecipeFilter === 'uncommon'} 
                    onClick={() => setActiveRecipeFilter('uncommon')}
                  >
                    Uncommon
                  </FilterButton>
                  <FilterButton 
                    active={activeRecipeFilter === 'rare'} 
                    onClick={() => setActiveRecipeFilter('rare')}
                  >
                    Rare
                  </FilterButton>
                  <FilterButton 
                    active={activeRecipeFilter === 'epic'} 
                    onClick={() => setActiveRecipeFilter('epic')}
                  >
                    Epic
                  </FilterButton>
                  <FilterButton 
                    active={activeRecipeFilter === 'legendary'} 
                    onClick={() => setActiveRecipeFilter('legendary')}
                  >
                    Legendary
                  </FilterButton>
                </FiltersBar>
                
                {filteredRecipes.length > 0 ? (
                  <RecipesGrid>
                    {filteredRecipes.map(userRecipe => {
                      const recipe = getRecipeDetails(userRecipe.recipeId);
                      return recipe ? (
                        <RecipeCard key={userRecipe.recipeId}>
                          <RecipeCardIcon>{recipe.icon || '📜'}</RecipeCardIcon>
                          <RecipeCardContent>
                            <RecipeCardName>{recipe.name}</RecipeCardName>
                            <RecipeCardInfo>
                              <RecipeCardDifficulty difficulty={MaterialRarity[recipe.difficulty].toLowerCase()}>
                                {MaterialRarity[recipe.difficulty]}
                              </RecipeCardDifficulty>
                              <RecipeCardTime>
                                {recipe.craftingTime} minutes
                              </RecipeCardTime>
                            </RecipeCardInfo>
                          </RecipeCardContent>
                          <LearnedDate>
                            Learned on {formatRelativeTime(userRecipe.learnedAt)}
                          </LearnedDate>
                        </RecipeCard>
                      ) : null;
                    })}
                  </RecipesGrid>
                ) : (
                  <EmptyMessage>No recipes learned yet</EmptyMessage>
                )}
              </RecipesTab>
            )}
            
            {activeTab === 3 && (
              <AchievementsTab>
                {userProfile?.achievements && userProfile.achievements.length > 0 ? (
                  <AchievementsGrid>
                    {userProfile.achievements.map((achievement, index) => (
                      <AchievementCard key={index}>
                        <AchievementCardIcon>{achievement.icon || '��'}</AchievementCardIcon>
                        <AchievementCardContent>
                          <AchievementCardName>{achievement.name}</AchievementCardName>
                          <AchievementCardDesc>{achievement.description}</AchievementCardDesc>
                          <AchievementCardDate>
                            Achieved on {formatRelativeTime(achievement.unlockedAt)}
                          </AchievementCardDate>
                        </AchievementCardContent>
                      </AchievementCard>
                    ))}
                  </AchievementsGrid>
                ) : (
                  <EmptyMessage>No achievements earned yet</EmptyMessage>
                )}
              </AchievementsTab>
            )}
          </TabContent>
        </TabsContainer>
      </ProfileSection>
    </PageContainer>
  );
};

// Styles
const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const PageHeader = styled.header`
  margin-bottom: 40px;
  text-align: center;
  
  h1 {
    font-size: 2.5rem;
    color: var(--primary-color);
    margin-bottom: 10px;
  }
  
  p {
    font-size: 1.1rem;
    opacity: 0.8;
    max-width: 800px;
    margin: 0 auto;
  }
`;

const ConnectWalletSection = styled.div`
  background: linear-gradient(135deg, rgba(106, 17, 203, 0.2) 0%, rgba(37, 117, 252, 0.2) 100%);
  border-radius: 15px;
  padding: 30px;
  text-align: center;
  margin-bottom: 40px;
  
  h2 {
    font-size: 1.5rem;
    color: var(--primary-color);
    margin-bottom: 10px;
  }
  
  p {
    margin-bottom: 20px;
  }
`;

const StyledWalletButton = styled(WalletMultiButton)`
  background: var(--primary-gradient) !important;
  color: white !important;
  border-radius: 30px !important;
  padding: 12px 24px !important;
  transition: var(--transition) !important;
  
  &:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2) !important;
  }
`;

const ProfileSection = styled.section`
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--box-shadow);
  overflow: hidden;
`;

const ProfileHeader = styled.div`
  padding: 30px;
  background: linear-gradient(135deg, rgba(106, 17, 203, 0.1) 0%, rgba(37, 117, 252, 0.1) 100%);
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 30px;
  align-items: center;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    text-align: center;
  }
`;

const ProfileAvatar = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--primary-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: white;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    margin: 0 auto;
  }
`;

const ProfileInfo = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const ProfileName = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 5px;
  color: #333;
`;

const ProfileAddress = styled.p`
  font-size: 1rem;
  color: #666;
  margin-bottom: 10px;
`;

const GuildBadge = styled.div`
  display: inline-flex;
  align-items: center;
  background-color: rgba(106, 17, 203, 0.1);
  padding: 5px 12px;
  border-radius: 20px;
  
  @media (max-width: 768px) {
    margin: 0 auto;
  }
`;

const GuildIcon = styled.span`
  font-size: 1.2rem;
  margin-right: 8px;
`;

const GuildName = styled.span`
  font-size: 0.9rem;
  color: var(--primary-color);
  font-weight: 500;
`;

const ProfileStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const StatItem = styled.div`
  text-align: center;
  padding: 10px;
  border-radius: var(--border-radius-sm);
  background-color: white;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const TabsContainer = styled.div`
  background-color: white;
`;

const TabsHeader = styled.div`
  display: flex;
  border-bottom: 1px solid var(--border-color);
  
  @media (max-width: 576px) {
    flex-wrap: wrap;
  }
`;

interface TabButtonProps {
  active: boolean;
}

const TabButton = styled.button<TabButtonProps>`
  padding: 15px 25px;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  background: none;
  cursor: pointer;
  color: ${props => props.active ? 'var(--primary-color)' : '#666'};
  position: relative;
  transition: var(--transition);
  
  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => props.active ? 'var(--primary-gradient)' : 'transparent'};
    transition: var(--transition);
  }
  
  &:hover {
    color: var(--primary-color);
  }
  
  @media (max-width: 576px) {
    flex: 1;
    padding: 12px 15px;
    font-size: 0.9rem;
  }
`;

const TabContent = styled.div`
  padding: 30px;
`;

const OverviewTab = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const OverviewSection = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 15px;
  position: relative;
  padding-bottom: 10px;
  
  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 50px;
    height: 3px;
    background: var(--primary-gradient);
    border-radius: 3px;
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
`;

const InfoItem = styled.div`
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: var(--border-radius-sm);
`;

const InfoLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 5px;
`;

const InfoValue = styled.div`
  font-size: 1.1rem;
  font-weight: 500;
  color: #333;
`;

const RecentCraftings = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const CraftingItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: var(--border-radius-sm);
  background-color: #f9f9f9;
  position: relative;
`;

const CraftingIcon = styled.div`
  font-size: 2rem;
  margin-right: 15px;
`;

const CraftingInfo = styled.div`
  flex: 1;
`;

const CraftingName = styled.div`
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 3px;
`;

const CraftingDate = styled.div`
  font-size: 0.8rem;
  color: #666;
`;

const CompletedTag = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 0.8rem;
  background-color: var(--success-color);
  color: white;
  padding: 3px 8px;
  border-radius: 10px;
`;

const RareMaterials = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
`;

const MaterialItem = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: var(--border-radius-sm);
  background-color: #f9f9f9;
  gap: 10px;
`;

const MaterialIcon = styled.div`
  font-size: 1.8rem;
`;

const MaterialInfo = styled.div`
  flex: 1;
`;

const MaterialName = styled.div`
  font-size: 0.9rem;
  margin-bottom: 3px;
`;

interface RarityProps {
  rarity: string;
}

const MaterialRarityBadge = styled.div<RarityProps>`
  display: inline-block;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 8px;
  background-color: ${props => getRarityColor(props.rarity)};
  color: white;
`;

const MaterialAmount = styled.div`
  font-size: 1rem;
  font-weight: bold;
  color: var(--primary-color);
`;

const RecentAchievements = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const AchievementItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: var(--border-radius-sm);
  background-color: #f9f9f9;
`;

const AchievementIcon = styled.div`
  font-size: 1.8rem;
  margin-right: 15px;
`;

const AchievementInfo = styled.div`
  flex: 1;
`;

const AchievementName = styled.div`
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 3px;
`;

const AchievementDate = styled.div`
  font-size: 0.8rem;
  color: #666;
`;

const MaterialsTab = styled.div``;

const FiltersBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
`;

interface FilterButtonProps {
  active: boolean;
}

const FilterButton = styled.button<FilterButtonProps>`
  padding: 8px 15px;
  border-radius: 20px;
  border: none;
  background-color: ${props => props.active ? 'var(--primary-color)' : '#f0f0f0'};
  color: ${props => props.active ? 'white' : '#666'};
  font-size: 0.9rem;
  cursor: pointer;
  transition: var(--transition);
  
  &:hover {
    background-color: ${props => props.active ? 'var(--primary-color)' : '#e0e0e0'};
  }
`;

const MaterialsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
`;

const MaterialCard = styled.div`
  border-radius: var(--border-radius-md);
  background-color: #f9f9f9;
  padding: 15px;
  display: flex;
  align-items: center;
  position: relative;
`;

const MaterialCardIcon = styled.div`
  font-size: 2.5rem;
  margin-right: 15px;
`;

const MaterialCardContent = styled.div`
  flex: 1;
`;

const MaterialCardName = styled.div`
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 5px;
`;

const MaterialCardType = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 5px;
`;

const MaterialCardRarity = styled.div<RarityProps>`
  display: inline-block;
  font-size: 0.8rem;
  padding: 3px 8px;
  border-radius: 8px;
  background-color: ${props => getRarityColor(props.rarity)};
  color: white;
`;

const MaterialCardAmount = styled.div`
  position: absolute;
  top: 15px;
  right: 15px;
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--primary-color);
`;

const RecipesTab = styled.div``;

const RecipesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
`;

const RecipeCard = styled.div`
  border-radius: var(--border-radius-md);
  background-color: #f9f9f9;
  padding: 15px;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const RecipeCardIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 15px;
  text-align: center;
`;

const RecipeCardContent = styled.div`
  flex: 1;
`;

const RecipeCardName = styled.div`
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 10px;
  text-align: center;
`;

const RecipeCardInfo = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const RecipeCardDifficulty = styled.div<RarityProps>`
  display: inline-block;
  font-size: 0.8rem;
  padding: 3px 8px;
  border-radius: 8px;
  background-color: ${props => getRarityColor(props.difficulty)};
  color: white;
`;

const RecipeCardTime = styled.div`
  font-size: 0.8rem;
  color: #666;
`;

const LearnedDate = styled.div`
  font-size: 0.8rem;
  color: #666;
  text-align: center;
`;

const AchievementsTab = styled.div``;

const AchievementsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const AchievementCard = styled.div`
  border-radius: var(--border-radius-md);
  background-color: #f9f9f9;
  padding: 20px;
  display: flex;
  align-items: flex-start;
`;

const AchievementCardIcon = styled.div`
  font-size: 2.5rem;
  margin-right: 15px;
`;

const AchievementCardContent = styled.div`
  flex: 1;
`;

const AchievementCardName = styled.div`
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 5px;
`;

const AchievementCardDesc = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 10px;
`;

const AchievementCardDate = styled.div`
  font-size: 0.8rem;
  color: #777;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 30px;
  color: #666;
  background-color: #f5f5f5;
  border-radius: var(--border-radius-md);
`;

export default ProfilePage; 