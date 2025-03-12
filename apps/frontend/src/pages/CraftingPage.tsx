import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useCrafting } from '../contexts/CraftingContext';
import { useRecipes } from '../contexts/RecipesContext';
import { useMaterials } from '../contexts/MaterialsContext';
import { Crafting, Recipe, MaterialRarity } from '../types';
import { formatRelativeTime, getRarityColor, calculateTimeLeft } from '../utils/helpers';

// Mock active crafting sessions data
const MOCK_ACTIVE_CRAFTING = [
  {
    id: '1',
    recipeName: 'Basic Fire Potion',
    startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    endTime: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
    progress: 67,
    ingredients: [
      { name: 'Fire Essence', amount: 2, supplied: true },
      { name: 'Mountain Copper', amount: 1, supplied: true }
    ],
    resultName: 'Fire Potion',
    resultRarity: 'Common'
  },
  {
    id: '2',
    recipeName: 'Nightfall Elixir',
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    endTime: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
    progress: 72,
    ingredients: [
      { name: 'Shadow Dust', amount: 1, supplied: true },
      { name: 'Magic Crystal', amount: 2, supplied: true },
      { name: 'Moonlight Silver', amount: 1, supplied: true }
    ],
    resultName: 'Nightfall Elixir',
    resultRarity: 'Rare'
  }
];

// Mock available recipes
const MOCK_AVAILABLE_RECIPES = [
  { 
    id: '1', 
    name: 'Basic Fire Potion', 
    difficulty: 'Easy', 
    ingredients: [
      { name: 'Fire Essence', amount: 2, userHas: 15 },
      { name: 'Mountain Copper', amount: 1, userHas: 20 }
    ],
    craftingTime: 45, // minutes
    resultName: 'Fire Potion',
    resultRarity: 'Common',
    successRate: 90
  },
  { 
    id: '2', 
    name: 'Nightfall Elixir', 
    difficulty: 'Medium', 
    ingredients: [
      { name: 'Shadow Dust', amount: 1, userHas: 2 },
      { name: 'Magic Crystal', amount: 2, userHas: 5 },
      { name: 'Moonlight Silver', amount: 1, userHas: 8 }
    ],
    craftingTime: 165, // minutes
    resultName: 'Nightfall Elixir',
    resultRarity: 'Rare',
    successRate: 75
  },
  { 
    id: '3', 
    name: 'Dragon Scale Armor', 
    difficulty: 'Hard', 
    ingredients: [
      { name: 'Dragon Scale', amount: 1, userHas: 1 },
      { name: 'Moonlight Silver', amount: 3, userHas: 8 },
      { name: 'Magic Crystal', amount: 2, userHas: 5 }
    ],
    craftingTime: 480, // minutes
    resultName: 'Dragon Scale Armor',
    resultRarity: 'Legendary',
    successRate: 60
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

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: #14F195;
  margin: 2rem 0 1rem;
`;

const CraftingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
`;

const CraftingCard = styled.div`
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #333;
`;

const CraftingHeader = styled.div`
  background-color: rgba(20, 241, 149, 0.1);
  padding: 1rem;
  border-bottom: 1px solid #333;
`;

const CraftingName = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: #14F195;
`;

const CraftingInfo = styled.div`
  padding: 1rem;
`;

const CraftingDetail = styled.p`
  font-size: 0.9rem;
  color: #CBD5E0;
  margin: 0.2rem 0;
`;

const ProgressContainer = styled.div`
  margin: 1rem 0;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  height: 12px;
  overflow: hidden;
`;

const ProgressBar = styled.div<{ progress: number }>`
  height: 100%;
  width: ${props => props.progress}%;
  background: linear-gradient(90deg, #9945FF, #14F195);
`;

const TimeRemaining = styled.div`
  font-size: 0.9rem;
  color: #CBD5E0;
  margin-bottom: 1rem;
  text-align: center;
`;

const IngredientsContainer = styled.div`
  margin-top: 1rem;
`;

const IngredientItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px dashed rgba(153, 69, 255, 0.3);
  font-size: 0.9rem;
`;

const IngredientStatus = styled.span<{ supplied?: boolean, hasEnough?: boolean }>`
  color: ${props => {
    if (props.supplied) return '#14F195';
    if (props.hasEnough) return '#14F195';
    return '#FC8181';
  }};
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

const RecipeResult = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StartCraftingButton = styled.button`
  width: 100%;
  background-color: #9945FF;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.7rem 1rem;
  margin-top: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #8432e6;
  }
  
  &:disabled {
    background-color: #4A5568;
    cursor: not-allowed;
  }
`;

const CompleteCraftingButton = styled(StartCraftingButton)`
  background-color: #14F195;
  
  &:hover {
    background-color: #10C77A;
  }
`;

const ConnectPrompt = styled.div`
  text-align: center;
  padding: 3rem;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  border: 1px solid #333;
  margin: 2rem 0;
`;

interface ActiveCrafting {
  id: string;
  recipeName: string;
  startTime: Date;
  endTime: Date;
  progress: number;
  ingredients: {
    name: string;
    amount: number;
    supplied: boolean;
  }[];
  resultName: string;
  resultRarity: string;
}

interface AvailableRecipe {
  id: string;
  name: string;
  difficulty: string;
  ingredients: {
    name: string;
    amount: number;
    userHas: number;
  }[];
  craftingTime: number;
  resultName: string;
  resultRarity: string;
  successRate: number;
}

const CraftingPage: React.FC = () => {
  const { connected } = useWallet();
  const { craftings, loading, error, startCrafting, completeCrafting } = useCrafting();

  return (
    <PageContainer>
      <Header>
        <Title>Alchemy Crafting</Title>
        {!connected && <WalletMultiButton />}
      </Header>

      {connected ? (
        <>
          <SectionTitle>Active Crafting Sessions</SectionTitle>
          {craftings.length > 0 ? (
            <CraftingGrid>
              {craftings.map(crafting => (
                <CraftingCard key={crafting.id}>
                  <CraftingHeader>
                    <CraftingName>{crafting.recipeName}</CraftingName>
                  </CraftingHeader>
                  
                  <CraftingInfo>
                    <CraftingDetail>
                      Started: {formatRelativeTime(crafting.startTime)}
                    </CraftingDetail>
                    
                    <ProgressContainer>
                      <ProgressBar progress={crafting.progress} />
                    </ProgressContainer>
                    
                    <TimeRemaining>
                      {calculateTimeLeft(crafting.startTime, crafting.craftingTime * 60 * 1000)}
                    </TimeRemaining>
                    
                    <IngredientsContainer>
                      {crafting.ingredients.map((ingredient, idx) => (
                        <IngredientItem key={idx}>
                          <span>{ingredient.name} x{ingredient.amount}</span>
                          <IngredientStatus supplied={ingredient.supplied}>
                            {ingredient.supplied ? 'Supplied' : 'Required'}
                          </IngredientStatus>
                        </IngredientItem>
                      ))}
                    </IngredientsContainer>
                    
                    <RecipeResult>
                      <ResultName>{crafting.resultName}</ResultName>
                      <ResultRarity rarity={crafting.resultRarity}>
                        {crafting.resultRarity}
                      </ResultRarity>
                    </RecipeResult>
                    
                    {crafting.progress >= 100 && (
                      <CompleteCraftingButton
                        onClick={() => completeCrafting(crafting.id)}
                      >
                        Collect Result
                      </CompleteCraftingButton>
                    )}
                  </CraftingInfo>
                </CraftingCard>
              ))}
            </CraftingGrid>
          ) : (
            <p>You don't have any active crafting sessions.</p>
          )}
          
          <SectionTitle>Available Recipes</SectionTitle>
          <CraftingGrid>
            {MOCK_AVAILABLE_RECIPES.map(recipe => (
              <CraftingCard key={recipe.id}>
                <CraftingHeader>
                  <CraftingName>{recipe.name}</CraftingName>
                </CraftingHeader>
                
                <CraftingInfo>
                  <CraftingDetail>
                    Difficulty: {recipe.difficulty}
                  </CraftingDetail>
                  <CraftingDetail>
                    Crafting Time: {recipe.craftingTime} minutes
                  </CraftingDetail>
                  <CraftingDetail>
                    Success Rate: {recipe.successRate}%
                  </CraftingDetail>
                  
                  <IngredientsContainer>
                    <CraftingDetail>Required Ingredients:</CraftingDetail>
                    {recipe.ingredients.map((ingredient, idx) => (
                      <IngredientItem key={idx}>
                        <span>{ingredient.name} x{ingredient.amount}</span>
                        <IngredientStatus hasEnough={ingredient.userHas >= ingredient.amount}>
                          {ingredient.userHas}/{ingredient.amount}
                        </IngredientStatus>
                      </IngredientItem>
                    ))}
                  </IngredientsContainer>
                  
                  <RecipeResult>
                    <ResultName>{recipe.resultName}</ResultName>
                    <ResultRarity rarity={recipe.resultRarity}>
                      {recipe.resultRarity}
                    </ResultRarity>
                  </RecipeResult>
                  
                  <StartCraftingButton
                    onClick={() => startCrafting(recipe.id)}
                  >
                    Start Crafting
                  </StartCraftingButton>
                </CraftingInfo>
              </CraftingCard>
            ))}
          </CraftingGrid>
        </>
      ) : (
        <ConnectPrompt>
          <h2>Please Connect Your Wallet</h2>
          <p>You need to connect your Solana wallet to view and start crafting</p>
        </ConnectPrompt>
      )}
    </PageContainer>
  );
};

export default CraftingPage; 