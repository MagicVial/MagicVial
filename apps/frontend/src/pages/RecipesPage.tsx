import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useRecipes } from '../contexts/RecipesContext';
import { useMaterials } from '../contexts/MaterialsContext';
import { Recipe, MaterialRarity, Material } from '../types';
import { formatRelativeTime, getRarityColor } from '../utils/helpers';
import { useAppContext } from '../contexts/AppContext';
import { startCrafting } from '../api/solana';

// Mock recipes data - in a real app, this would be fetched from the Solana blockchain
const MOCK_RECIPES = [
  { 
    id: '1', 
    name: 'Basic Fire Potion', 
    difficulty: 'Easy', 
    ingredients: [
      { name: 'Fire Essence', amount: 2 },
      { name: 'Mountain Copper', amount: 1 }
    ],
    resultName: 'Fire Potion',
    resultRarity: 'Common',
    successRate: 90,
    creator: 'MagicVial',
    discoveredAt: new Date(2023, 8, 15)
  },
  { 
    id: '2', 
    name: 'Nightfall Elixir', 
    difficulty: 'Medium', 
    ingredients: [
      { name: 'Shadow Dust', amount: 1 },
      { name: 'Magic Crystal', amount: 2 },
      { name: 'Moonlight Silver', amount: 1 }
    ],
    resultName: 'Nightfall Elixir',
    resultRarity: 'Rare',
    successRate: 75,
    creator: 'CryptoWizard',
    discoveredAt: new Date(2023, 9, 22)
  },
  { 
    id: '3', 
    name: 'Dragon Scale Armor', 
    difficulty: 'Hard', 
    ingredients: [
      { name: 'Dragon Scale', amount: 1 },
      { name: 'Moonlight Silver', amount: 3 },
      { name: 'Magic Crystal', amount: 2 }
    ],
    resultName: 'Dragon Scale Armor',
    resultRarity: 'Legendary',
    successRate: 60,
    creator: 'DragonMaster',
    discoveredAt: new Date(2023, 10, 5)
  }
];

const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #9945FF;
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  align-items: center;
  background-color: rgba(106, 17, 203, 0.05);
  padding: 1rem;
  border-radius: 8px;
`;

const Filter = styled.select`
  padding: 0.5rem 1rem;
  border-radius: 4px;
  background-color: #2D3748;
  color: white;
  border: 1px solid #4A5568;
  font-family: 'Noto Sans SC', 'Poppins', sans-serif;
`;

const SearchInput = styled.input`
  padding: 0.5rem 1rem;
  border-radius: 4px;
  background-color: #2D3748;
  color: white;
  border: 1px solid #4A5568;
  flex-grow: 1;
  min-width: 250px;
  font-family: 'Noto Sans SC', 'Poppins', sans-serif;
  
  &::placeholder {
    color: #A0AEC0;
  }
`;

const FilterCheckbox = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: rgba(106, 17, 203, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(106, 17, 203, 0.2);
  }
  
  input {
    margin: 0;
  }
`;

const RecipesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
`;

// Define RecipeCard interface
interface RecipeCardProps {
  hasRecipe?: boolean;
  canCraft?: boolean;
}

const RecipeCard = styled.div<RecipeCardProps>`
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #333;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  position: relative;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(153, 69, 255, 0.3);
  }
  
  ${props => props.hasRecipe && `
    &:before {
      content: 'Learned';
      position: absolute;
      top: 10px;
      right: 10px;
      background-color: var(--success-color);
      color: white;
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 10px;
      z-index: 1;
    }
  `}
  
  ${props => !props.hasRecipe && props.canCraft && `
    &:before {
      content: 'Craftable';
      position: absolute;
      top: 10px;
      right: 10px;
      background-color: var(--info-color);
      color: white;
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 10px;
      z-index: 1;
    }
  `}
`;

const RecipeHeader = styled.div`
  background-color: rgba(20, 241, 149, 0.1);
  padding: 1rem;
  border-bottom: 1px solid #333;
`;

const RecipeName = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: #14F195;
`;

const RecipeInfo = styled.div`
  padding: 1rem;
`;

const RecipeDetail = styled.p`
  font-size: 0.9rem;
  color: #CBD5E0;
  margin: 0.2rem 0;
`;

const RecipeIngredients = styled.div`
  margin-top: 1rem;
`;

const IngredientItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px dashed rgba(153, 69, 255, 0.3);
  font-size: 0.9rem;
`;

const RecipeResult = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ResultName = styled.div`
  font-weight: bold;
  color: #14F195;
`;

const ResultRarity = styled.span<{ rarity: string }>`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  background-color: ${props => {
    switch (props.rarity.toLowerCase()) {
      case 'common': return 'rgba(160, 174, 192, 0.3)';
      case 'uncommon': return 'rgba(72, 187, 120, 0.3)';
      case 'rare': return 'rgba(66, 153, 225, 0.3)';
      case 'epic': return 'rgba(159, 122, 234, 0.3)';
      case 'legendary': return 'rgba(237, 137, 54, 0.3)';
      default: return 'rgba(160, 174, 192, 0.3)';
    }
  }};
  color: ${props => {
    switch (props.rarity.toLowerCase()) {
      case 'common': return '#CBD5E0';
      case 'uncommon': return '#48BB78';
      case 'rare': return '#4299E1';
      case 'epic': return '#9F7AEA';
      case 'legendary': return '#ED8936';
      default: return '#CBD5E0';
    }
  }};
`;

const ConnectPrompt = styled.div`
  text-align: center;
  padding: 3rem;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  border: 1px solid #333;
  margin: 2rem 0;
`;

const CreateRecipeButton = styled.button`
  background-color: #9945FF;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #8432e6;
  }
`;

interface RecipeData {
  id: string;
  name: string;
  difficulty: string;
  ingredients: {
    name: string;
    amount: number;
  }[];
  resultName: string;
  resultRarity: string;
  successRate: number;
  creator: string;
  discoveredAt: Date;
}

// Add DifficultyProps interface definition
interface DifficultyProps {
  rarity: string;
}

// Add IngredientIcon definition
const IngredientIcon = styled.div`
  font-size: 1.5rem;
  margin-bottom: 5px;
`;

// RecipeDetails type interface
interface RecipeDetailsProps {
  recipe: Recipe | null;
  onClose: () => void;
  userHasRecipe: boolean;
  getMaterialName: (id: string) => string;
  getUserHasMaterial: (id: string) => boolean;
}

// Add craftLoading state
const RecipeDetails: React.FC<RecipeDetailsProps> = ({ recipe, onClose, userHasRecipe, getMaterialName, getUserHasMaterial }) => {
  const [craftLoading, setCraftLoading] = useState(false);
  const { publicKey } = useWallet();
  const { dispatch } = useAppContext();

  // Check if recipe can be crafted
  const canCraftRecipe = (recipe: Recipe): boolean => {
    if (!recipe) return false;
    
    return recipe.ingredients.every(ingredient => 
      getUserHasMaterial(ingredient.id)
    );
  };

  // Start crafting
  const handleStartCrafting = async (recipeId: string) => {
    if (!publicKey) return;
    
    try {
      setCraftLoading(true);
      const crafting = await startCrafting(recipeId, publicKey.toString());
      dispatch({ type: 'ADD_CRAFTING', payload: crafting });
      
      // Close modal
      onClose();
      
      // Show success message
      alert(`Successfully started crafting: ${crafting.recipe.name}`);
    } catch (error) {
      console.error('Failed to start crafting:', error);
      alert('Failed to start crafting. Please try again.');
    } finally {
      setCraftLoading(false);
    }
  };

  if (!recipe) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>✕</CloseButton>
        <RecipeIcon>{recipe.icon || '📜'}</RecipeIcon>
        <RecipeTitle>{recipe.name}</RecipeTitle>
        
        <DetailSection>
          <DetailLabel>Description</DetailLabel>
          <DetailText>{recipe.description || 'No description available'}</DetailText>
        </DetailSection>
        
        <DetailSection>
          <DetailLabel>Difficulty</DetailLabel>
          <RarityBadge rarity={MaterialRarity[recipe.difficulty].toLowerCase()}>
            {MaterialRarity[recipe.difficulty]}
          </RarityBadge>
        </DetailSection>
        
        <DetailSection>
          <DetailLabel>Crafting Time</DetailLabel>
          <DetailText>{recipe.craftingTime} minutes</DetailText>
        </DetailSection>
        
        <DetailSection>
          <DetailLabel>Required Materials</DetailLabel>
          <IngredientsGrid>
            {recipe.ingredients.map((ingredient, index) => (
              <IngredientItem 
                key={index}
                hasIngredient={getUserHasMaterial(ingredient.id)}
              >
                <IngredientIcon>{ingredient.icon || '🧪'}</IngredientIcon>
                <IngredientName>{ingredient.name}</IngredientName>
                <IngredientAmount>x{ingredient.amount}</IngredientAmount>
              </IngredientItem>
            ))}
          </IngredientsGrid>
        </DetailSection>
        
        <DetailSection>
          <DetailLabel>Discovered</DetailLabel>
          <DetailText>{recipe.discoveredAt ? formatRelativeTime(recipe.discoveredAt.getTime()) : 'Unknown'}</DetailText>
        </DetailSection>
        
        {userHasRecipe ? (
          <UserRecipeInfo>
            <UserRecipeIcon>📚</UserRecipeIcon>
            <UserRecipeText>You've learned this recipe</UserRecipeText>
          </UserRecipeInfo>
        ) : (
          <LearnRecipeButton 
            onClick={() => handleStartCrafting(recipe.id)}
            disabled={!canCraftRecipe(recipe) || craftLoading}
          >
            {craftLoading ? 'Starting...' : 'Start Crafting'}
          </LearnRecipeButton>
        )}
        
        {!canCraftRecipe(recipe) && (
          <CraftingError>You don't have all required materials</CraftingError>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

const RecipesPage: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const { recipes, userRecipes, loading, error } = useRecipes();
  const { materials, userMaterials } = useMaterials();
  const { state, dispatch } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [onlyLearned, setOnlyLearned] = useState<boolean>(false);
  const [onlyCraftable, setOnlyCraftable] = useState<boolean>(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Filter and sort recipes
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (recipe.description && recipe.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDifficulty = selectedDifficulty === 'all' || 
                              MaterialRarity[recipe.difficulty].toLowerCase() === selectedDifficulty;
    const matchesLearned = !onlyLearned || 
                          (connected && userHasRecipe(recipe.id));
    const matchesCraftable = !onlyCraftable || 
                             (connected && canCraftRecipe(recipe));
    
    return matchesSearch && matchesDifficulty && matchesLearned && matchesCraftable;
  });

  // Check if user has learned the recipe
  const userHasRecipe = (recipeId: string): boolean => {
    return userRecipes.some(r => r.recipeId === recipeId);
  };

  // Get material name
  const getMaterialName = (materialId: string): string => {
    const material = materials.find(m => m.id === materialId);
    return material ? material.name : 'Unknown Material';
  };

  // Check if user has all required materials
  const getUserHasMaterial = (materialId: string): boolean => {
    return userMaterials.some(m => m.materialId === materialId && m.balance > 0);
  };

  // Check if recipe can be crafted
  const canCraftRecipe = (recipe: Recipe): boolean => {
    if (!connected) return false;
    
    return recipe.ingredients.every(ingredient => {
      const userMaterial = userMaterials.find(m => m.materialId === ingredient.materialId);
      return userMaterial && userMaterial.balance >= ingredient.amount;
    });
  };

  // Open recipe details
  const openRecipeDetails = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  // Close recipe details
  const closeRecipeDetails = () => {
    setSelectedRecipe(null);
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <PageContainer>
      <Header>
        <Title>Recipe Collection</Title>
        {connected ? (
          <CreateRecipeButton>Create New Recipe</CreateRecipeButton>
        ) : (
          <WalletMultiButton />
        )}
      </Header>

      {connected ? (
        <>
          <FiltersContainer>
            <SearchInput 
              placeholder="Search recipes or materials..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <Filter 
              value={selectedDifficulty} 
              onChange={(e) => setSelectedDifficulty(e.target.value.toLowerCase())}
            >
              <option value="all">All Difficulties</option>
              <option value="common">Common</option>
              <option value="uncommon">Uncommon</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
            </Filter>
            
            <FilterCheckbox>
              <input
                type="checkbox"
                checked={onlyLearned}
                onChange={(e) => setOnlyLearned(e.target.checked)}
              />
              Show Learned Only
            </FilterCheckbox>
            
            <FilterCheckbox>
              <input
                type="checkbox"
                checked={onlyCraftable}
                onChange={(e) => setOnlyCraftable(e.target.checked)}
              />
              Show Craftable Only
            </FilterCheckbox>
          </FiltersContainer>

          {loading ? (
            <LoadingMessage>Loading recipes...</LoadingMessage>
          ) : error ? (
            <ErrorMessage>Error loading recipes: {error}</ErrorMessage>
          ) : filteredRecipes.length === 0 ? (
            <NoResultsMessage>No matching recipes found</NoResultsMessage>
          ) : (
            <RecipesGrid>
              {filteredRecipes.map(recipe => (
                <RecipeCard 
                  key={recipe.id} 
                  onClick={() => openRecipeDetails(recipe)}
                  hasRecipe={userHasRecipe(recipe.id)}
                  canCraft={canCraftRecipe(recipe)}
                >
                  <RecipeHeader>
                    <RecipeName>{recipe.name}</RecipeName>
                    <RecipeDetail>Difficulty: {MaterialRarity[recipe.difficulty]}</RecipeDetail>
                  </RecipeHeader>
                  <RecipeInfo>
                    <RecipeDetail>Success Rate: {recipe.successRate}%</RecipeDetail>
                    <RecipeDetail>Creator: {recipe.creator}</RecipeDetail>
                    <RecipeDetail>Date: {formatDate(recipe.discoveredAt)}</RecipeDetail>
                    
                    <RecipeIngredients>
                      <RecipeDetail>Required Materials:</RecipeDetail>
                      {recipe.ingredients.map((ingredient, idx) => (
                        <IngredientItem key={idx}>
                          <span>{ingredient.name}</span>
                          <span>x{ingredient.amount}</span>
                        </IngredientItem>
                      ))}
                    </RecipeIngredients>
                    
                    <RecipeResult>
                      <ResultName>{recipe.resultName}</ResultName>
                      <ResultRarity rarity={recipe.resultRarity}>
                        {recipe.resultRarity}
                      </ResultRarity>
                    </RecipeResult>
                  </RecipeInfo>
                </RecipeCard>
              ))}
            </RecipesGrid>
          )}
        </>
      ) : (
        <ConnectPrompt>
          <h2>Please Connect Your Wallet</h2>
          <p>You need to connect your Solana wallet to view and create recipes</p>
          <WalletMultiButton />
        </ConnectPrompt>
      )}

      <RecipeDetails 
        recipe={selectedRecipe} 
        onClose={closeRecipeDetails} 
        userHasRecipe={selectedRecipe ? userHasRecipe(selectedRecipe.id) : false}
        getMaterialName={getMaterialName}
        getUserHasMaterial={getUserHasMaterial}
      />
    </PageContainer>
  );
};

// Styled components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 20px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 30px;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  
  &:hover {
    color: var(--primary-color);
  }
`;

const RecipeIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 20px;
  text-align: center;
`;

const RecipeTitle = styled.h2`
  font-size: 2rem;
  text-align: center;
  margin-bottom: 30px;
  color: #333;
`;

const DetailSection = styled.div`
  margin-bottom: 20px;
`;

const DetailLabel = styled.h4`
  font-size: 1rem;
  color: #666;
  margin-bottom: 5px;
`;

const DetailText = styled.p`
  font-size: 1rem;
  line-height: 1.5;
  color: #333;
`;

const RarityBadge = styled.span<DifficultyProps>`
  display: inline-block;
  font-size: 0.9rem;
  padding: 5px 10px;
  border-radius: 15px;
  font-weight: bold;
  background-color: ${props => getRarityColor(props.rarity)};
  color: white;
`;

const IngredientsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 15px;
  margin-top: 10px;
`;

interface IngredientItemProps {
  hasIngredient: boolean;
}

const IngredientItem = styled.div<IngredientItemProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 10px;
  border-radius: 10px;
  background-color: ${props => props.hasIngredient ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)'};
  border: 1px solid ${props => props.hasIngredient ? 'rgba(46, 204, 113, 0.3)' : 'rgba(231, 76, 60, 0.3)'};
`;

const IngredientName = styled.span`
  font-size: 0.9rem;
  text-align: center;
`;

const IngredientAmount = styled.span`
  font-size: 0.8rem;
  font-weight: bold;
  color: #555;
`;

const UserRecipeInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, rgba(106, 17, 203, 0.1) 0%, rgba(37, 117, 252, 0.1) 100%);
  padding: 15px;
  border-radius: 10px;
  margin: 20px 0;
`;

const UserRecipeIcon = styled.div`
  font-size: 1.5rem;
`;

const UserRecipeText = styled.p`
  font-size: 1rem;
  font-weight: 500;
  color: var(--primary-color);
`;

const LearnRecipeButton = styled.button`
  width: 100%;
  padding: 15px;
  margin: 20px 0;
  border: none;
  border-radius: 10px;
  background: var(--primary-gradient);
  color: white;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: var(--transition);
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }
  
  &:active:not(:disabled) {
    transform: translateY(1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #777;
  }
`;

const CraftingError = styled.div`
  text-align: center;
  padding: 10px;
  color: var(--error-color);
  background-color: rgba(231, 76, 60, 0.1);
  border-radius: 10px;
  margin: 20px 0;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 50px;
  font-size: 1.2rem;
  color: #666;
  background-color: rgba(106, 17, 203, 0.05);
  border-radius: 10px;
  margin: 20px 0;
  animation: pulse 1.5s infinite;
  
  @keyframes pulse {
    0% {
      opacity: 0.6;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.6;
    }
  }
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 30px;
  color: var(--error-color);
  background-color: rgba(231, 76, 60, 0.1);
  border-radius: 10px;
  margin: 20px 0;
  border: 1px solid rgba(231, 76, 60, 0.3);
`;

const NoResultsMessage = styled.div`
  text-align: center;
  padding: 50px;
  font-size: 1.2rem;
  color: #666;
  background-color: #f9f9f9;
  border-radius: 10px;
  border: 1px dashed #ccc;
  
  &:before {
    content: '🔍';
    display: block;
    font-size: 2.5rem;
    margin-bottom: 15px;
  }
`;

export default RecipesPage; 