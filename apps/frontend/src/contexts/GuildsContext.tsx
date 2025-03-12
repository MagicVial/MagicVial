import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getGuilds, getUserProfile } from '../api/solana';
import { Guild, GuildMembership } from '../types';

interface GuildsContextType {
  guilds: Guild[];
  membership: GuildMembership | null;
  loading: boolean;
  error: string | null;
  refreshGuilds: () => Promise<void>;
  refreshMembership: () => Promise<void>;
}

const GuildsContext = createContext<GuildsContextType>({
  guilds: [],
  membership: null,
  loading: false,
  error: null,
  refreshGuilds: async () => {},
  refreshMembership: async () => {},
});

export const useGuilds = () => useContext(GuildsContext);

interface GuildsProviderProps {
  children: ReactNode;
}

export const GuildsProvider: React.FC<GuildsProviderProps> = ({ children }) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [membership, setMembership] = useState<GuildMembership | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshGuilds = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const guildsData = await getGuilds();
      setGuilds(guildsData);
    } catch (err) {
      console.error('Failed to fetch guilds:', err);
      setError('Failed to load guilds. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const refreshMembership = async () => {
    if (!wallet.connected) {
      setMembership(null);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const userProfile = await getUserProfile(wallet);
      if (userProfile.guild) {
        const userGuildMembership: GuildMembership = {
          guildId: userProfile.guild.id,
          role: userProfile.guild.role,
          joinedAt: userProfile.guild.joinedAt,
          contribution: userProfile.guild.contribution,
          reputation: userProfile.guild.reputation
        };
        setMembership(userGuildMembership);
      } else {
        setMembership(null);
      }
    } catch (err) {
      console.error('Failed to fetch guild membership:', err);
      setError('Failed to load your guild membership. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Load guilds on initial render
  useEffect(() => {
    refreshGuilds();
  }, [connection]);

  // Load user guild membership when wallet connects
  useEffect(() => {
    if (wallet.connected) {
      refreshMembership();
    } else {
      setMembership(null);
    }
  }, [wallet.connected, connection]);

  const value = {
    guilds,
    membership,
    loading,
    error,
    refreshGuilds,
    refreshMembership,
  };

  return (
    <GuildsContext.Provider value={value}>
      {children}
    </GuildsContext.Provider>
  );
}; 