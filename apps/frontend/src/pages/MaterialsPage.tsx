import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Material, MaterialType, MaterialRarity } from '../types';
import { getMaterials, getUserMaterials } from '../api/solana';
import { useWallet } from '@solana/wallet-adapter-react';

const MaterialsPage: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [userMaterials, setUserMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    type: 'all' as string | MaterialType,
    rarity: 'all' as string | MaterialRarity,
    owned: false,
    search: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const materialsData = await getMaterials();
        setMaterials(materialsData);
        
        if (connected && publicKey) {
          const userMaterialsData = await getUserMaterials(publicKey.toString());
          setUserMaterials(userMaterialsData);
        }
      } catch (error) {
        console.error('Failed to fetch materials data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [connected, publicKey]);

  // Get user material amount
  const getMaterialAmount = (materialId: string) => {
    if (!connected) return 0;
    const userMaterial = userMaterials.find(um => um.id === materialId);
    return userMaterial ? userMaterial.amount : 0;
  };

  // Filter materials
  const filteredMaterials = materials.filter(material => {
    // Type filter
    if (filter.type !== 'all' && material.type !== filter.type) return false;
    
    // Rarity filter
    if (filter.rarity !== 'all' && material.rarity !== Number(filter.rarity)) return false;
    
    // Show only owned
    if (filter.owned && getMaterialAmount(material.id) === 0) return false;
    
    // Search filter
    if (filter.search && !material.name.toLowerCase().includes(filter.search.toLowerCase())) return false;
    
    return true;
  });

  // Get material type name
  const getMaterialTypeName = (type: MaterialType) => {
    switch (type) {
      case MaterialType.HERB: return 'Herb';
      case MaterialType.MINERAL: return 'Mineral';
      case MaterialType.ESSENCE: return 'Essence';
      case MaterialType.CREATURE: return 'Creature';
      case MaterialType.CATALYST: return 'Catalyst';
      default: return 'Unknown';
    }
  };

  // Get rarity description
  const getRarityDescription = (rarity: MaterialRarity) => {
    switch (rarity) {
      case 1: return 'Common';
      case 2: return 'Uncommon';
      case 3: return 'Rare';
      case 4: return 'Epic';
      case 5: return 'Legendary';
      default: return 'Unknown';
    }
  };

  // Get rarity color
  const getRarityColor = (rarity: MaterialRarity) => {
    switch (rarity) {
      case 1: return '#B0B0B0'; // Common - Gray
      case 2: return '#4CAF50'; // Uncommon - Green
      case 3: return '#2196F3'; // Rare - Blue
      case 4: return '#9C27B0'; // Epic - Purple
      case 5: return '#FF9800'; // Legendary - Orange
      default: return '#B0B0B0';
    }
  };

  return (
    <Container>
      <PageHeader>
        <h1>Materials Library</h1>
        <p>Discover and collect various magical materials needed for alchemy</p>
      </PageHeader>

      <FilterSection>
        <FilterGroup>
          <FilterLabel>Search:</FilterLabel>
          <SearchInput
            type="text"
            placeholder="Enter material name..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          />
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Type:</FilterLabel>
          <FilterSelect
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          >
            <option value="all">All Types</option>
            <option value={MaterialType.HERB}>Herb</option>
            <option value={MaterialType.MINERAL}>Mineral</option>
            <option value={MaterialType.ESSENCE}>Essence</option>
            <option value={MaterialType.CREATURE}>Creature</option>
            <option value={MaterialType.CATALYST}>Catalyst</option>
          </FilterSelect>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Rarity:</FilterLabel>
          <FilterSelect
            value={filter.rarity}
            onChange={(e) => setFilter({ ...filter, rarity: e.target.value })}
          >
            <option value="all">All Rarities</option>
            <option value="1">Common</option>
            <option value="2">Uncommon</option>
            <option value="3">Rare</option>
            <option value="4">Epic</option>
            <option value="5">Legendary</option>
          </FilterSelect>
        </FilterGroup>

        {connected && (
          <FilterCheckbox>
            <input
              type="checkbox"
              id="owned-only"
              checked={filter.owned}
              onChange={(e) => setFilter({ ...filter, owned: e.target.checked })}
            />
            <label htmlFor="owned-only">Show Owned Only</label>
          </FilterCheckbox>
        )}
      </FilterSection>

      {loading ? (
        <LoadingSection>
          <LoadingSpinner />
          <p>Loading materials data...</p>
        </LoadingSection>
      ) : filteredMaterials.length === 0 ? (
        <NoResultsMessage>
          <p>No materials found matching your criteria</p>
          <ResetButton onClick={() => setFilter({ type: 'all', rarity: 'all', owned: false, search: '' })}>
            Reset Filters
          </ResetButton>
        </NoResultsMessage>
      ) : (
        <MaterialsGrid>
          {filteredMaterials.map((material) => (
            <MaterialCard key={material.id}>
              <MaterialIconContainer rarity={material.rarity}>
                <MaterialIcon>{material.icon}</MaterialIcon>
              </MaterialIconContainer>
              <MaterialContent>
                <MaterialName>{material.name}</MaterialName>
                <MaterialType>
                  Type: {getMaterialTypeName(material.type)}
                </MaterialType>
                <MaterialRarityTag rarity={material.rarity}>
                  {getRarityDescription(material.rarity)}
                </MaterialRarityTag>
                <MaterialDescription>{material.description}</MaterialDescription>
                <MaterialSource>
                  <SourceLabel>Source:</SourceLabel> {material.source}
                </MaterialSource>
                {connected && (
                  <MaterialAmount>
                    <AmountLabel>Owned:</AmountLabel> 
                    <AmountValue owned={getMaterialAmount(material.id) > 0}>
                      {getMaterialAmount(material.id)}
                    </AmountValue>
                  </MaterialAmount>
                )}
              </MaterialContent>
            </MaterialCard>
          ))}
        </MaterialsGrid>
      )}
    </Container>
  );
};

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const PageHeader = styled.div`
  text-align: center;
  margin-bottom: 40px;
  
  h1 {
    font-size: 2.5rem;
    margin-bottom: 10px;
    color: var(--text-color);
  }
  
  p {
    font-size: 1.1rem;
    color: var(--text-color-secondary);
  }
`;

const FilterSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
  background: var(--bg-color-light);
  padding: 20px;
  border-radius: var(--border-radius-md);
  box-shadow: var(--box-shadow);
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FilterLabel = styled.label`
  font-weight: 500;
  white-space: nowrap;
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: var(--border-radius-sm);
  width: 200px;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(106, 17, 203, 0.2);
  }
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: var(--border-radius-sm);
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(106, 17, 203, 0.2);
  }
`;

const FilterCheckbox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  
  input {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
  
  label {
    cursor: pointer;
    user-select: none;
  }
  
  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

const LoadingSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 0;
  
  p {
    margin-top: 20px;
    color: var(--text-color-secondary);
  }
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(106, 17, 203, 0.2);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const NoResultsMessage = styled.div`
  text-align: center;
  padding: 60px 0;
  color: var(--text-color-secondary);
`;

const ResetButton = styled.button`
  margin-top: 15px;
  padding: 8px 16px;
  background: var(--primary-gradient);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(106, 17, 203, 0.3);
  }
`;

const MaterialsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const MaterialCard = styled.div`
  display: flex;
  background: var(--bg-color-light);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  box-shadow: var(--box-shadow);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
  }
`;

interface MaterialIconContainerProps {
  rarity: number;
}

const MaterialIconContainer = styled.div<MaterialIconContainerProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  background: ${props => {
    switch (props.rarity) {
      case 1: return 'linear-gradient(135deg, #B0B0B0 0%, #D0D0D0 100%)';
      case 2: return 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)';
      case 3: return 'linear-gradient(135deg, #2196F3 0%, #03A9F4 100%)';
      case 4: return 'linear-gradient(135deg, #9C27B0 0%, #E040FB 100%)';
      case 5: return 'linear-gradient(135deg, #FF9800 0%, #FFC107 100%)';
      default: return 'linear-gradient(135deg, #B0B0B0 0%, #D0D0D0 100%)';
    }
  }};
`;

const MaterialIcon = styled.div`
  font-size: 2.5rem;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const MaterialContent = styled.div`
  flex: 1;
  padding: 15px;
`;

const MaterialName = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 8px;
  color: var(--text-color);
`;

const MaterialType = styled.div`
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  margin-bottom: 5px;
`;

interface MaterialRarityTagProps {
  rarity: number;
}

const MaterialRarityTag = styled.div<MaterialRarityTagProps>`
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
  background: ${props => {
    switch (props.rarity) {
      case 1: return '#B0B0B0';
      case 2: return '#4CAF50';
      case 3: return '#2196F3';
      case 4: return '#9C27B0';
      case 5: return '#FF9800';
      default: return '#B0B0B0';
    }
  }};
  padding: 3px 8px;
  border-radius: 12px;
  margin-bottom: 8px;
`;

const MaterialDescription = styled.p`
  font-size: 0.9rem;
  color: var(--text-color);
  margin-bottom: 10px;
  line-height: 1.5;
`;

const MaterialSource = styled.div`
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  margin-bottom: 5px;
`;

const SourceLabel = styled.span`
  font-weight: 600;
`;

const MaterialAmount = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  margin-top: 5px;
`;

const AmountLabel = styled.span`
  font-weight: 600;
  margin-right: 5px;
`;

interface AmountValueProps {
  owned: boolean;
}

const AmountValue = styled.span<AmountValueProps>`
  color: ${props => props.owned ? '#4CAF50' : '#B0B0B0'};
  font-weight: ${props => props.owned ? '600' : 'normal'};
`;

export default MaterialsPage; 