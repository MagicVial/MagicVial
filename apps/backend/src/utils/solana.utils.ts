import { Connection, PublicKey, Transaction, Keypair, SystemProgram } from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Solana Utilities Class
 * Provides utility methods for interacting with the Solana blockchain
 */
export class SolanaUtils {
  private connection: Connection;
  private endpoint: string;
  
  /**
   * Constructor
   * @param endpoint Solana RPC endpoint
   */
  constructor(endpoint?: string) {
    this.endpoint = endpoint || process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    this.connection = new Connection(this.endpoint, 'confirmed');
  }
  
  /**
   * Get Solana connection instance
   * @returns Solana connection instance
   */
  getConnection(): Connection {
    return this.connection;
  }
  
  /**
   * Get account balance
   * @param publicKey Public key string
   * @returns SOL balance
   */
  async getBalance(publicKey: string): Promise<number> {
    try {
      const pubKey = new PublicKey(publicKey);
      const balance = await this.connection.getBalance(pubKey);
      return balance / 1e9; // Convert to SOL
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw new Error('Error getting account balance');
    }
  }
  
  /**
   * Verify wallet signature
   * @param walletAddress Wallet address
   * @param message Original message
   * @param signature Signature
   * @returns Whether verification was successful
   */
  async verifySignature(walletAddress: string, message: string, signature: string): Promise<boolean> {
    try {
      // TODO: Implement signature verification logic
      // This is a simple verification example, in real applications you need to use real cryptographic verification
      return true;
    } catch (error) {
      console.error('Failed to verify signature:', error);
      throw new Error('Error verifying wallet signature');
    }
  }
  
  /**
   * Get Token balance
   * @param walletAddress Wallet address
   * @param tokenMintAddress Token Mint address
   * @returns Token balance
   */
  async getTokenBalance(walletAddress: string, tokenMintAddress: string): Promise<number> {
    try {
      const walletPubkey = new PublicKey(walletAddress);
      const tokenMintPubkey = new PublicKey(tokenMintAddress);
      
      // Find Token account
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        walletPubkey,
        { mint: tokenMintPubkey }
      );
      
      if (tokenAccounts.value.length === 0) {
        return 0;
      }
      
      // Get balance
      const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
      return balance;
    } catch (error) {
      console.error('Failed to get Token balance:', error);
      throw new Error('Error getting Token balance');
    }
  }
  
  /**
   * Get NFT data
   * @param nftMintAddress NFT Mint address
   * @returns NFT metadata
   */
  async getNftMetadata(nftMintAddress: string): Promise<any> {
    try {
      // TODO: Implement NFT metadata retrieval
      // In a real application, this would call Metaplex or other services to get NFT metadata
      return {
        name: 'MagicVial NFT',
        symbol: 'MVNFT',
        description: 'A MagicVial NFT',
        image: 'https://example.com/nft.png',
        attributes: []
      };
    } catch (error) {
      console.error('Failed to get NFT metadata:', error);
      throw new Error('Error getting NFT metadata');
    }
  }
  
  /**
   * Check transaction status
   * @param signature Transaction signature
   * @returns Transaction status
   */
  async checkTransactionStatus(signature: string): Promise<string> {
    try {
      const status = await this.connection.getSignatureStatus(signature);
      
      if (!status || !status.value) {
        return 'unknown';
      }
      
      if (status.value.err) {
        return 'failed';
      }
      
      return status.value.confirmationStatus || 'unknown';
    } catch (error) {
      console.error('Failed to check transaction status:', error);
      throw new Error('Error checking transaction status');
    }
  }
}

// Export singleton instance
export const solanaUtils = new SolanaUtils();