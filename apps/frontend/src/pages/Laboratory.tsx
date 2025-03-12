import React, { useState } from 'react';
import styled from 'styled-components';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Mock data for demonstration purposes
const MOCK_MATERIALS = [
  { id: 1, name: 'Basic Vial', type: 'Base', rarity: 'Common', quantity: 10, image: '/materials/basic_vial.png' },
  { id: 2, name: 'Mystic Essence', type: 'Rare', rarity: 'Rare', quantity: 3, image: '/materials/mystic_essence.png' },
  { id: 3, name: 'Autumn Leaf', type: 'Seasonal', rarity: 'Uncommon', quantity: 5, image: '/materials/autumn_leaf.png' },
  { id: 4, name: 'Unknown Powder', type: 'Mystery', rarity: 'Epic', quantity: 1, image: '/materials/unknown_powder.png' },
];

const MOCK_RECIPES = [
  { id: 1, name: 'Glowing Potion', difficulty: 'Easy', successRate: 90, materials: [{ id: 1, quantity: 2 }, { id: 3, quantity: 1 }] },
  { id: 2, name: 'Arcane Elixir', difficulty: 'Medium', successRate: 70, materials: [{ id: 1, quantity: 3 }, { id: 2, quantity: 1 }] },
  { id: 3, name: 'Void Extract', difficulty: 'Hard', successRate: 40, materials: [{ id: 2, quantity: 2 }, { id: 4, quantity: 1 }] },
];

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

const LabGrid = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const MaterialsPanel = styled.div`
  background-color: #1E2142;
  border-radius: 12px;
  padding: 1.5rem;
`;

const CraftingPanel = styled.div`
  background-color: #1E2142;
  border-radius: 12px;
  padding: 1.5rem;
`;

const PanelTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #9945FF50;
  padding-bottom: 0.5rem;
`;

const MaterialsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
`;

const MaterialItem = styled.div<{ selected: boolean }>`
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: 8px;
  background-color: ${props => props.selected ? '#9945FF20' : '#14162E'};
  cursor: pointer;
  border: ${props => props.selected ? '1px solid #9945FF' : '1px solid transparent'};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #9945FF20;
  }
`;

const MaterialImage = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: #0F1429;
  margin-right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
`;

const MaterialInfo = styled.div`
  flex: 1;
`;

const MaterialName = styled.div`
  font-weight: 600;
`;

const MaterialMeta = styled.div`
  font-size: 0.8rem;
  opacity: 0.7;
  display: flex;
  gap: 0.5rem;
`;

const MaterialQuantity = styled.div`
  font-weight: 600;
  color: #9945FF;
`;

const RecipeSelector = styled.div`
  margin-bottom: 2rem;
`;

const RecipeDropdown = styled.select`
  width: 100%;
  padding: 0.75rem;
  border-radius: 8px;
  background-color: #14162E;
  color: white;
  border: 1px solid #9945FF50;
  
  &:focus {
    outline: none;
    border-color: #9945FF;
  }
`;

const RecipeDetails = styled.div`
  background-color: #14162E;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const RecipeTitle = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 1rem;
`;

const RecipeMeta = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
`;

const RecipeMetaItem = styled.div`
  span {
    color: #9945FF;
    font-weight: 600;
  }
`;

const RecipeIngredients = styled.div`
  margin-bottom: 1.5rem;
`;

const IngredientsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const IngredientItem = styled.div<{ available: boolean }>`
  display: flex;
  align-items: center;
  opacity: ${props => props.available ? 1 : 0.5};
`;

const IngredientCheckmark = styled.div<{ available: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: ${props => props.available ? '#14F195' : 'transparent'};
  border: 1px solid ${props => props.available ? '#14F195' : '#FF5656'};
  margin-right: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:after {
    content: '✓';
    color: #14162E;
    display: ${props => props.available ? 'block' : 'none'};
  }
`;

const CraftButton = styled.button<{ disabled: boolean }>`
  width: 100%;
  padding: 1rem;
  border-radius: 8px;
  background-color: ${props => props.disabled ? '#9945FF50' : '#9945FF'};
  color: white;
  font-weight: 600;
  border: none;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${props => props.disabled ? '#9945FF50' : '#7324e2'};
  }
`;

const CraftingResult = styled.div<{ success?: boolean, visible: boolean }>`
  margin-top: 2rem;
  background-color: ${props => props.success ? '#14F19520' : '#FF565620'};
  border: 1px solid ${props => props.success ? '#14F195' : '#FF5656'};
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  display: ${props => props.visible ? 'block' : 'none'};
`;

const ResultTitle = styled.h4<{ success?: boolean }>`
  font-size: 1.25rem;
  color: ${props => props.success ? '#14F195' : '#FF5656'};
  margin-bottom: 1rem;
`;

const ResultImage = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 8px;
  background-color: #0F1429;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
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

const Laboratory: React.FC = () => {
  const wallet = useWallet();
  const [selectedMaterials, setSelectedMaterials] = useState<number[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<number | null>(null);
  const [craftingResult, setCraftingResult] = useState<{ success: boolean, resultName: string } | null>(null);
  
  const handleMaterialClick = (materialId: number) => {
    setSelectedMaterials(prev => {
      if (prev.includes(materialId)) {
        return prev.filter(id => id !== materialId);
      } else {
        return [...prev, materialId];
      }
    });
  };
  
  const handleRecipeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const recipeId = parseInt(e.target.value);
    setSelectedRecipe(recipeId || null);
    setCraftingResult(null);
  };
  
  const getCurrentRecipe = () => {
    if (!selectedRecipe) return null;
    return MOCK_RECIPES.find(recipe => recipe.id === selectedRecipe) || null;
  };
  
  const canCraft = () => {
    const recipe = getCurrentRecipe();
    if (!recipe) return false;
    
    // Check if user has all required materials
    return recipe.materials.every(req => {
      const material = MOCK_MATERIALS.find(m => m.id === req.id);
      return material && material.quantity >= req.quantity;
    });
  };
  
  const handleCraft = () => {
    const recipe = getCurrentRecipe();
    if (!recipe) return;
    
    // Simulate crafting with success probability
    const roll = Math.random() * 100;
    const success = roll <= recipe.successRate;
    
    setCraftingResult({
      success,
      resultName: success ? recipe.name : 'Failed Experiment'
    });
    
    // In a real application, this would call the smart contract
  };
  
  if (!wallet.connected) {
    return (
      <PageContainer>
        <PageTitle>Alchemy Laboratory</PageTitle>
        <NotConnectedMessage>
          <h2>Connect Wallet to Access Laboratory</h2>
          <p>You need to connect your wallet to start crafting magical items.</p>
          <WalletMultiButton />
        </NotConnectedMessage>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      <PageTitle>Alchemy Laboratory</PageTitle>
      
      <LabGrid>
        <MaterialsPanel>
          <PanelTitle>Your Materials</PanelTitle>
          <MaterialsList>
            {MOCK_MATERIALS.map(material => (
              <MaterialItem 
                key={material.id}
                selected={selectedMaterials.includes(material.id)}
                onClick={() => handleMaterialClick(material.id)}
              >
                <MaterialImage>
                  {material.type.charAt(0)}
                </MaterialImage>
                <MaterialInfo>
                  <MaterialName>{material.name}</MaterialName>
                  <MaterialMeta>
                    <span>{material.type}</span>
                    <span>•</span>
                    <span>{material.rarity}</span>
                  </MaterialMeta>
                </MaterialInfo>
                <MaterialQuantity>x{material.quantity}</MaterialQuantity>
              </MaterialItem>
            ))}
          </MaterialsList>
        </MaterialsPanel>
        
        <CraftingPanel>
          <PanelTitle>Crafting Station</PanelTitle>
          
          <RecipeSelector>
            <RecipeDropdown value={selectedRecipe || ''} onChange={handleRecipeChange}>
              <option value="">Select a Recipe</option>
              {MOCK_RECIPES.map(recipe => (
                <option key={recipe.id} value={recipe.id}>{recipe.name}</option>
              ))}
            </RecipeDropdown>
          </RecipeSelector>
          
          {selectedRecipe && getCurrentRecipe() && (
            <>
              <RecipeDetails>
                <RecipeTitle>{getCurrentRecipe()?.name}</RecipeTitle>
                <RecipeMeta>
                  <RecipeMetaItem>
                    Difficulty: <span>{getCurrentRecipe()?.difficulty}</span>
                  </RecipeMetaItem>
                  <RecipeMetaItem>
                    Success Rate: <span>{getCurrentRecipe()?.successRate}%</span>
                  </RecipeMetaItem>
                </RecipeMeta>
                
                <RecipeIngredients>
                  <h4>Required Materials:</h4>
                  <IngredientsList>
                    {getCurrentRecipe()?.materials.map(req => {
                      const material = MOCK_MATERIALS.find(m => m.id === req.id);
                      const available = material ? material.quantity >= req.quantity : false;
                      
                      return (
                        <IngredientItem key={req.id} available={available}>
                          <IngredientCheckmark available={available} />
                          {material?.name} x{req.quantity}
                        </IngredientItem>
                      );
                    })}
                  </IngredientsList>
                </RecipeIngredients>
                
                <CraftButton 
                  disabled={!canCraft()} 
                  onClick={handleCraft}
                >
                  Start Crafting
                </CraftButton>
              </RecipeDetails>
              
              <CraftingResult 
                visible={craftingResult !== null}
                success={craftingResult?.success}
              >
                <ResultTitle success={craftingResult?.success}>
                  {craftingResult?.success ? 'Crafting Successful!' : 'Crafting Failed'}
                </ResultTitle>
                <ResultImage>
                  {craftingResult?.success ? '✨' : '💥'}
                </ResultImage>
                <p>You created: <strong>{craftingResult?.resultName}</strong></p>
              </CraftingResult>
            </>
          )}
        </CraftingPanel>
      </LabGrid>
    </PageContainer>
  );
};

export default Laboratory; 