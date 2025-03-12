import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Mock guilds data
const MOCK_GUILDS = [
  {
    id: '1',
    name: 'Celestial Alchemists',
    description: 'A prestigious guild focusing on celestial and rare material research. Members share knowledge and resources to advance alchemy science.',
    emblemUrl: 'https://via.placeholder.com/150/5D3FD3/FFFFFF?text=Celestial',
    memberCount: 86,
    founder: 'MasterAlchemist',
    reputation: 4250,
    quests: 12,
    isPublic: true
  },
  {
    id: '2',
    name: 'Shadow Brewers',
    description: 'Specializing in rare and mysterious potions, the Shadow Brewers push the boundaries of conventional alchemy with experimental techniques.',
    emblemUrl: 'https://via.placeholder.com/150/301934/FFFFFF?text=Shadow',
    memberCount: 42,
    founder: 'NightShade',
    reputation: 3120,
    quests: 8,
    isPublic: true
  },
  {
    id: '3',
    name: 'Elemental Masters',
    description: 'Masters of elemental manipulation, this guild focuses on harnessing the raw power of natural elements in their alchemical creations.',
    emblemUrl: 'https://via.placeholder.com/150/FF4500/FFFFFF?text=Elemental',
    memberCount: 124,
    founder: 'FlameHeart',
    reputation: 5680,
    quests: 18,
    isPublic: true
  }
];

// Mock user guild membership
const MOCK_USER_MEMBERSHIP = {
  guildId: '1',
  role: 'Member',
  joinedAt: new Date(2023, 6, 15),
  contribution: 120,
  reputation: 350
};

// Mock guild quests
const MOCK_GUILD_QUESTS = [
  {
    id: '1',
    guildId: '1',
    title: 'Collect Rare Moonlight Silver',
    description: 'The guild needs Moonlight Silver for upcoming research. Collect and contribute at least 5 units.',
    reward: 100,
    requiredReputation: 200,
    requiredRole: 'Member',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    assignee: null
  },
  {
    id: '2',
    guildId: '1',
    title: 'Create Fire Essence Extracts',
    description: 'Refine raw Fire Essence into high-quality extracts. The guild needs 10 extracts for a major crafting project.',
    reward: 250,
    requiredReputation: 300,
    requiredRole: 'Member',
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    assignee: 'YourUsername'
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

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #333;
  margin-bottom: 2rem;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 0.75rem 1.5rem;
  background-color: ${props => props.active ? 'rgba(153, 69, 255, 0.2)' : 'transparent'};
  color: ${props => props.active ? '#9945FF' : '#CBD5E0'};
  border: none;
  border-bottom: 2px solid ${props => props.active ? '#9945FF' : 'transparent'};
  font-size: 1rem;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: #9945FF;
  }
`;

const GuildGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const GuildCard = styled.div`
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #333;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(153, 69, 255, 0.3);
  }
`;

const GuildHeader = styled.div`
  position: relative;
  height: 120px;
  background: linear-gradient(90deg, rgba(153, 69, 255, 0.3), rgba(20, 241, 149, 0.3));
  display: flex;
  justify-content: center;
  align-items: center;
`;

const GuildEmblem = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 2px solid #9945FF;
  object-fit: cover;
`;

const GuildInfo = styled.div`
  padding: 1.5rem;
`;

const GuildName = styled.h3`
  font-size: 1.3rem;
  color: #14F195;
  margin-bottom: 0.5rem;
  text-align: center;
`;

const GuildDescription = styled.p`
  font-size: 0.9rem;
  color: #CBD5E0;
  margin-bottom: 1.5rem;
  line-height: 1.6;
`;

const GuildStats = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const GuildStat = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: #9945FF;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: #CBD5E0;
`;

const GuildFounder = styled.div`
  font-size: 0.9rem;
  color: #CBD5E0;
  text-align: right;
  margin-bottom: 1rem;
`;

const JoinGuildButton = styled.button`
  width: 100%;
  background-color: #9945FF;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.7rem 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #8432e6;
  }
`;

const MyGuildContainer = styled.div`
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #333;
  margin-bottom: 3rem;
`;

const MyGuildHeader = styled.div`
  background: linear-gradient(90deg, rgba(153, 69, 255, 0.3), rgba(20, 241, 149, 0.3));
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;
`;

const MyGuildInfo = styled.div`
  flex: 1;
`;

const MyGuildName = styled.h2`
  font-size: 1.8rem;
  color: #14F195;
  margin-bottom: 0.5rem;
`;

const MyGuildMemberInfo = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-top: 1rem;
`;

const MemberInfoItem = styled.div`
  background-color: rgba(0, 0, 0, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const MemberInfoLabel = styled.span`
  font-size: 0.8rem;
  color: #CBD5E0;
`;

const MemberInfoValue = styled.span`
  font-weight: bold;
  color: #9945FF;
`;

const MyGuildContent = styled.div`
  padding: 2rem;
`;

const ContributeSection = styled.div`
  background-color: rgba(20, 241, 149, 0.1);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const ContributeTitle = styled.h3`
  font-size: 1.2rem;
  color: #14F195;
  margin-bottom: 1rem;
`;

const ContributeForm = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  align-items: center;
`;

const ContributeInput = styled.input`
  padding: 0.5rem 1rem;
  border-radius: 4px;
  background-color: #2D3748;
  color: white;
  border: 1px solid #4A5568;
  flex-grow: 1;
  
  &::placeholder {
    color: #A0AEC0;
  }
`;

const ContributeButton = styled.button`
  background-color: #14F195;
  color: #1A202C;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #10C77A;
  }
`;

const QuestsSection = styled.div`
  margin-top: 2rem;
`;

const QuestsTitle = styled.h3`
  font-size: 1.2rem;
  color: #9945FF;
  margin-bottom: 1rem;
`;

const QuestCard = styled.div`
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid #333;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const QuestTitle = styled.h4`
  font-size: 1.1rem;
  color: #14F195;
  margin-bottom: 0.5rem;
`;

const QuestDescription = styled.p`
  font-size: 0.9rem;
  color: #CBD5E0;
  margin-bottom: 1rem;
  line-height: 1.6;
`;

const QuestDetails = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #CBD5E0;
  margin-bottom: 1rem;
`;

const QuestDetail = styled.span`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const QuestDetailValue = styled.span`
  color: #9945FF;
  font-weight: bold;
`;

const QuestActions = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const QuestButton = styled.button`
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
  
  &:disabled {
    background-color: #4A5568;
    cursor: not-allowed;
  }
`;

const CompleteQuestButton = styled(QuestButton)`
  background-color: #14F195;
  
  &:hover {
    background-color: #10C77A;
  }
`;

const CreateGuildButton = styled.button`
  background-color: #9945FF;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.7rem 1.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #8432e6;
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

interface Guild {
  id: string;
  name: string;
  description: string;
  emblemUrl: string;
  memberCount: number;
  founder: string;
  reputation: number;
  quests: number;
  isPublic: boolean;
}

interface GuildMembership {
  guildId: string;
  role: string;
  joinedAt: Date;
  contribution: number;
  reputation: number;
}

interface GuildQuest {
  id: string;
  guildId: string;
  title: string;
  description: string;
  reward: number;
  requiredReputation: number;
  requiredRole: string;
  deadline: Date;
  assignee: string | null;
}

const GuildsPage: React.FC = () => {
  const { connection } = useConnection();
  const { connected } = useWallet();
  const [activeTab, setActiveTab] = useState<'guilds' | 'myguild'>('guilds');
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [membership, setMembership] = useState<GuildMembership | null>(null);
  const [guildQuests, setGuildQuests] = useState<GuildQuest[]>([]);
  const [contributionAmount, setContributionAmount] = useState<string>('');

  useEffect(() => {
    if (connected) {
      // In a real application, we would fetch data from the Solana blockchain
      // Here we use mock data
      setGuilds(MOCK_GUILDS);
      setMembership(MOCK_USER_MEMBERSHIP);
      setGuildQuests(MOCK_GUILD_QUESTS);
    }
  }, [connected, connection]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleJoinGuild = (guildId: string) => {
    alert(`Joining guild with ID: ${guildId}`);
    // In a real app, this would call the Solana contract
  };

  const handleContribute = () => {
    if (!contributionAmount || isNaN(Number(contributionAmount))) {
      alert('Please enter a valid contribution amount');
      return;
    }
    
    alert(`Contributing ${contributionAmount} tokens to the guild`);
    // In a real app, this would call the Solana contract
    setContributionAmount('');
  };

  const handleAcceptQuest = (questId: string) => {
    alert(`Accepting quest with ID: ${questId}`);
    // In a real app, this would call the Solana contract
  };

  const handleCompleteQuest = (questId: string) => {
    alert(`Completing quest with ID: ${questId}`);
    // In a real app, this would call the Solana contract
  };

  const handleCreateGuild = () => {
    alert('Opening guild creation form');
    // In a real app, this would open a form to create a new guild
  };

  const getMembershipGuild = () => {
    if (!membership) return null;
    return guilds.find(guild => guild.id === membership.guildId);
  };

  const isUserEligibleForQuest = (quest: GuildQuest) => {
    if (!membership) return false;
    
    // Check if requirements are met
    const hasRequiredReputation = membership.reputation >= quest.requiredReputation;
    const hasRequiredRole = membership.role === quest.requiredRole || 
                          (membership.role === 'Officer' && quest.requiredRole === 'Member') ||
                          membership.role === 'Founder';
                          
    return hasRequiredReputation && hasRequiredRole && !quest.assignee;
  };

  const isUserAssignedToQuest = (quest: GuildQuest) => {
    return quest.assignee === 'YourUsername'; // In a real app, use the actual user identifier
  };

  return (
    <PageContainer>
      <Header>
        <Title>Alchemy Guilds</Title>
        {connected ? (
          !membership && <CreateGuildButton onClick={handleCreateGuild}>Create New Guild</CreateGuildButton>
        ) : (
          <WalletMultiButton />
        )}
      </Header>

      {connected ? (
        <>
          <TabsContainer>
            <Tab 
              active={activeTab === 'guilds'} 
              onClick={() => setActiveTab('guilds')}
            >
              Browse Guilds
            </Tab>
            
            {membership && (
              <Tab 
                active={activeTab === 'myguild'} 
                onClick={() => setActiveTab('myguild')}
              >
                My Guild
              </Tab>
            )}
          </TabsContainer>
          
          {activeTab === 'guilds' && (
            <GuildGrid>
              {guilds.map(guild => (
                <GuildCard key={guild.id}>
                  <GuildHeader>
                    <GuildEmblem src={guild.emblemUrl} alt={guild.name} />
                  </GuildHeader>
                  
                  <GuildInfo>
                    <GuildName>{guild.name}</GuildName>
                    <GuildDescription>{guild.description}</GuildDescription>
                    
                    <GuildStats>
                      <GuildStat>
                        <StatValue>{guild.memberCount}</StatValue>
                        <StatLabel>Members</StatLabel>
                      </GuildStat>
                      <GuildStat>
                        <StatValue>{guild.reputation}</StatValue>
                        <StatLabel>Reputation</StatLabel>
                      </GuildStat>
                      <GuildStat>
                        <StatValue>{guild.quests}</StatValue>
                        <StatLabel>Quests</StatLabel>
                      </GuildStat>
                    </GuildStats>
                    
                    <GuildFounder>Founded by {guild.founder}</GuildFounder>
                    
                    {!membership && (
                      <JoinGuildButton onClick={() => handleJoinGuild(guild.id)}>
                        Join Guild
                      </JoinGuildButton>
                    )}
                  </GuildInfo>
                </GuildCard>
              ))}
            </GuildGrid>
          )}
          
          {activeTab === 'myguild' && membership && (
            <div>
              <MyGuildContainer>
                {getMembershipGuild() && (
                  <>
                    <MyGuildHeader>
                      <GuildEmblem src={getMembershipGuild()?.emblemUrl} alt={getMembershipGuild()?.name} />
                      
                      <MyGuildInfo>
                        <MyGuildName>{getMembershipGuild()?.name}</MyGuildName>
                        <GuildDescription>{getMembershipGuild()?.description}</GuildDescription>
                        
                        <MyGuildMemberInfo>
                          <MemberInfoItem>
                            <MemberInfoLabel>Role:</MemberInfoLabel>
                            <MemberInfoValue>{membership.role}</MemberInfoValue>
                          </MemberInfoItem>
                          <MemberInfoItem>
                            <MemberInfoLabel>Joined:</MemberInfoLabel>
                            <MemberInfoValue>{formatDate(membership.joinedAt)}</MemberInfoValue>
                          </MemberInfoItem>
                          <MemberInfoItem>
                            <MemberInfoLabel>Reputation:</MemberInfoLabel>
                            <MemberInfoValue>{membership.reputation}</MemberInfoValue>
                          </MemberInfoItem>
                          <MemberInfoItem>
                            <MemberInfoLabel>Contribution:</MemberInfoLabel>
                            <MemberInfoValue>{membership.contribution}</MemberInfoValue>
                          </MemberInfoItem>
                        </MyGuildMemberInfo>
                      </MyGuildInfo>
                    </MyGuildHeader>
                    
                    <MyGuildContent>
                      <ContributeSection>
                        <ContributeTitle>Contribute to Guild Treasury</ContributeTitle>
                        <p>Contributing tokens to your guild increases your reputation and helps fund guild activities.</p>
                        
                        <ContributeForm>
                          <ContributeInput 
                            type="number" 
                            placeholder="Amount to contribute" 
                            value={contributionAmount}
                            onChange={(e) => setContributionAmount(e.target.value)}
                            min="1"
                          />
                          <ContributeButton onClick={handleContribute}>
                            Contribute
                          </ContributeButton>
                        </ContributeForm>
                      </ContributeSection>
                      
                      <QuestsSection>
                        <QuestsTitle>Guild Quests</QuestsTitle>
                        
                        {guildQuests.length > 0 ? (
                          guildQuests.map(quest => (
                            <QuestCard key={quest.id}>
                              <QuestTitle>{quest.title}</QuestTitle>
                              <QuestDescription>{quest.description}</QuestDescription>
                              
                              <QuestDetails>
                                <QuestDetail>
                                  Reward: <QuestDetailValue>{quest.reward} tokens</QuestDetailValue>
                                </QuestDetail>
                                <QuestDetail>
                                  Required Rep: <QuestDetailValue>{quest.requiredReputation}</QuestDetailValue>
                                </QuestDetail>
                                <QuestDetail>
                                  Deadline: <QuestDetailValue>{formatDate(quest.deadline)}</QuestDetailValue>
                                </QuestDetail>
                              </QuestDetails>
                              
                              <QuestActions>
                                {isUserAssignedToQuest(quest) ? (
                                  <CompleteQuestButton onClick={() => handleCompleteQuest(quest.id)}>
                                    Complete Quest
                                  </CompleteQuestButton>
                                ) : (
                                  <QuestButton 
                                    onClick={() => handleAcceptQuest(quest.id)}
                                    disabled={!isUserEligibleForQuest(quest)}
                                  >
                                    Accept Quest
                                  </QuestButton>
                                )}
                              </QuestActions>
                            </QuestCard>
                          ))
                        ) : (
                          <p>No active quests available.</p>
                        )}
                      </QuestsSection>
                    </MyGuildContent>
                  </>
                )}
              </MyGuildContainer>
            </div>
          )}
        </>
      ) : (
        <ConnectPrompt>
          <h2>Please Connect Your Wallet</h2>
          <p>You need to connect your Solana wallet to view and join guilds</p>
        </ConnectPrompt>
      )}
    </PageContainer>
  );
};

export default GuildsPage; 