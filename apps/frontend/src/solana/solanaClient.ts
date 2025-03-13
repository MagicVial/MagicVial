import { 
  Connection, 
  PublicKey, 
  Transaction, 
  sendAndConfirmTransaction, 
  Keypair,
  TransactionInstruction,
  SystemProgram,
} from '@solana/web3.js';
import { 
  Program, 
  BN, 
  Idl,
  AnchorProvider
} from '@project-serum/anchor';
import {
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { WalletContextState } from '@solana/wallet-adapter-react';

// Define constants that might be missing from imports
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
const SYSVAR_RENT_PUBKEY = new PublicKey('SysvarRent111111111111111111111111111111111');
const SYSVAR_CLOCK_PUBKEY = new PublicKey('SysvarC1ock11111111111111111111111111111111');

// Define contract program IDs
const MATERIAL_PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');
const RECIPE_PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');
const CRAFTING_PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');
const GUILD_PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// Material type enum
export enum MaterialType {
  Basic = 'Basic',
  Rare = 'Rare',
  Seasonal = 'Seasonal',
  Mysterious = 'Mysterious'
}

// Rarity enum
export enum Rarity {
  Common = 'Common',
  Rare = 'Rare',
  Epic = 'Epic',
  Legendary = 'Legendary'
}

// Recipe difficulty enum
export enum RecipeDifficulty {
  Beginner = 0,
  Intermediate = 1,
  Advanced = 2,
  Master = 3
}

// Crafting status enum
export enum CraftingStatus {
  InProgress = 0,
  Completed = 1,
  Failed = 2,
  Cancelled = 3
}

// Guild role enum
export enum GuildRole {
  Member = 0,
  Contributor = 1,
  Officer = 2,
  Founder = 3
}

// Material type interface
export interface MaterialData {
  mint: PublicKey;
  materialType: string;
  rarity: string;
  currentSupply: BN;
  maxSupply: BN;
  createdAt: BN;
  updatedAt: BN;
  authority: PublicKey;
  isActive: boolean;
}

// Recipe type interface
export interface RecipeData {
  name: string;
  description: string;
  difficulty: RecipeDifficulty;
  ingredients: IngredientData[];
  craftingTime: BN;
  successRate: number;
  creator: PublicKey;
  isApproved: boolean;
  isEnabled: boolean;
  createdAt: BN;
  updatedAt: BN;
  resultName: string;
  resultDescription: string;
  resultRarity: string;
  timesCrafted: BN;
}

// Recipe ingredient interface
export interface IngredientData {
  materialMint: PublicKey;
  quantity: BN;
}

// Crafting record interface
export interface CraftingData {
  recipe: PublicKey;
  recipeCrafting: PublicKey;
  crafter: PublicKey;
  startTime: BN;
  completionTime: BN | null;
  status: CraftingStatus;
  materialsVerified: boolean;
  materialsConsumed: boolean;
  inputMaterials: MaterialInputData[];
}

// Material input interface
export interface MaterialInputData {
  materialMint: PublicKey;
  amount: BN;
}

// Guild data interface
export interface GuildData {
  name: string;
  description: string;
  emblemUri: string;
  founder: PublicKey;
  isPublic: boolean;
  minContributionRequired: BN;
  memberCount: number;
  createdAt: BN;
  updatedAt: BN;
  totalReputation: BN;
  reputationCoefficient: number;
}

// Membership interface
export interface MembershipData {
  guild: PublicKey;
  member: PublicKey;
  role: GuildRole;
  joinedAt: BN;
  reputation: BN;
  contribution: BN;
  isActive: boolean;
}

// Guild quest interface
export interface GuildQuestData {
  guild: PublicKey;
  creator: PublicKey;
  title: string;
  description: string;
  rewardAmount: BN;
  createdAt: BN;
  expiryTime: BN;
  isCompleted: boolean;
  isCancelled: boolean;
  requiredRole: GuildRole;
  requiredReputation: BN;
  assignee: PublicKey | null;
}

class SolanaClient {
  private connection: Connection;
  private wallet: WalletContextState | null = null;
  private materialProgram: Program | null = null;
  private recipeProgram: Program | null = null;
  private craftingProgram: Program | null = null;
  private guildProgram: Program | null = null;
  
  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  // Set wallet
  setWallet(wallet: WalletContextState) {
    this.wallet = wallet;
  }

  // Set program IDLs
  setProgramIdls(materialIdl: Idl, recipeIdl: Idl, craftingIdl: Idl, guildIdl: Idl) {
    if (!this.wallet) {
      throw new Error('Wallet has not been set');
    }
    
    const provider = new AnchorProvider(this.connection, this.wallet, { commitment: 'confirmed' });
    
    this.materialProgram = new Program(materialIdl, MATERIAL_PROGRAM_ID, provider);
    this.recipeProgram = new Program(recipeIdl, RECIPE_PROGRAM_ID, provider);
    this.craftingProgram = new Program(craftingIdl, CRAFTING_PROGRAM_ID, provider);
    this.guildProgram = new Program(guildIdl, GUILD_PROGRAM_ID, provider);
  }

  // Check if programs are initialized
  private checkPrograms() {
    if (!this.materialProgram || !this.recipeProgram || !this.craftingProgram || !this.guildProgram) {
      throw new Error('Programs not initialized. Call setProgramIdls first');
    }
    
    if (!this.wallet || !this.wallet.publicKey) {
      throw new Error('Wallet not connected');
    }
  }

  // ========== Material system interface ==========

  // Initialize material system
  async initializeMaterialSystem(): Promise<string> {
    this.checkPrograms();
    
    const [materialAuthority, materialAuthorityBump] = await PublicKey.findProgramAddress(
      [Buffer.from('material_authority')],
      MATERIAL_PROGRAM_ID
    );
    
    try {
      const tx = await this.materialProgram!.rpc.initialize(
        materialAuthorityBump,
        {
          accounts: {
            materialAuthority,
            authority: this.wallet!.publicKey!,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
          }
        }
      );
      
      return tx;
    } catch (error) {
      console.error('Failed to initialize material system:', error);
      throw error;
    }
  }

  // Create material NFT
  async createMaterial(
    mint: PublicKey,
    name: string,
    symbol: string,
    uri: string,
    materialType: string,
    rarity: string,
    maxSupply: number
  ): Promise<string> {
    this.checkPrograms();
    
    const [materialAuthority] = await PublicKey.findProgramAddress(
      [Buffer.from('material_authority')],
      MATERIAL_PROGRAM_ID
    );
    
    const [material] = await PublicKey.findProgramAddress(
      [Buffer.from('material'), mint.toBuffer()],
      MATERIAL_PROGRAM_ID
    );
    
    const metadataAddress = await this.findMetadataAddress(mint);
    
    try {
      const tx = await this.materialProgram!.rpc.createMaterial(
        name,
        symbol,
        uri,
        materialType,
        rarity,
        new BN(maxSupply),
        {
          accounts: {
            material,
            materialAuthority,
            mint,
            metadata: metadataAddress,
            authority: this.wallet!.publicKey!,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
          }
        }
      );
      
      return tx;
    } catch (error) {
      console.error('Failed to create material:', error);
      throw error;
    }
  }

  // Mint material NFT
  async mintMaterial(
    materialMint: PublicKey,
    amount: number
  ): Promise<string> {
    this.checkPrograms();
    
    const [material] = await PublicKey.findProgramAddress(
      [Buffer.from('material'), materialMint.toBuffer()],
      MATERIAL_PROGRAM_ID
    );
    
    const [materialAuthority] = await PublicKey.findProgramAddress(
      [Buffer.from('material_authority')],
      MATERIAL_PROGRAM_ID
    );
    
    const tokenAccount = await getAssociatedTokenAddress(
      materialMint,
      this.wallet!.publicKey!
    );
    
    try {
      const tx = await this.materialProgram!.rpc.mintMaterial(
        new BN(amount),
        {
          accounts: {
            material,
            materialAuthority,
            mint: materialMint,
            tokenAccount,
            receiver: this.wallet!.publicKey!,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
          }
        }
      );
      
      return tx;
    } catch (error) {
      console.error('Failed to mint material:', error);
      throw error;
    }
  }

  // Get material information
  async getMaterial(materialMint: PublicKey): Promise<MaterialData> {
    this.checkPrograms();
    
    const [materialAddress] = await PublicKey.findProgramAddress(
      [Buffer.from('material'), materialMint.toBuffer()],
      MATERIAL_PROGRAM_ID
    );
    
    try {
      const material = await this.materialProgram!.account.material.fetch(materialAddress);
      return material as unknown as MaterialData;
    } catch (error) {
      console.error('Failed to get material information:', error);
      throw error;
    }
  }

  // ========== Recipe system interface ==========

  // Initialize recipe system
  async initializeRecipeSystem(): Promise<string> {
    this.checkPrograms();
    
    const [recipeAuthority, recipeAuthorityBump] = await PublicKey.findProgramAddress(
      [Buffer.from('recipe_authority')],
      RECIPE_PROGRAM_ID
    );
    
    try {
      const tx = await this.recipeProgram!.rpc.initialize(
        recipeAuthorityBump,
        {
          accounts: {
            recipeAuthority,
            authority: this.wallet!.publicKey!,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
          }
        }
      );
      
      return tx;
    } catch (error) {
      console.error('Failed to initialize recipe system:', error);
      throw error;
    }
  }

  // Create recipe
  async createRecipe(
    recipeKey: Keypair,
    name: string,
    description: string,
    difficulty: RecipeDifficulty,
    craftingTime: number,
    successRate: number,
    ingredients: { materialMint: PublicKey, quantity: number }[],
    resultName: string,
    resultDescription: string,
    resultRarity: string
  ): Promise<string> {
    this.checkPrograms();
    
    const [recipeAuthority] = await PublicKey.findProgramAddress(
      [Buffer.from('recipe_authority')],
      RECIPE_PROGRAM_ID
    );
    
    const formattedIngredients = ingredients.map(ing => ({
      materialMint: ing.materialMint,
      quantity: new BN(ing.quantity)
    }));
    
    try {
      const tx = await this.recipeProgram!.rpc.createRecipe(
        name,
        description,
        difficulty,
        new BN(craftingTime),
        successRate,
        formattedIngredients,
        resultName,
        resultDescription,
        resultRarity,
        {
          accounts: {
            recipe: recipeKey.publicKey,
            recipeAuthority,
            creator: this.wallet!.publicKey!,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
          },
          signers: [recipeKey]
        }
      );
      
      return tx;
    } catch (error) {
      console.error('Failed to create recipe:', error);
      throw error;
    }
  }

  // Approve recipe
  async approveRecipe(recipeAddress: PublicKey, isApproved: boolean): Promise<string> {
    this.checkPrograms();
    
    const [recipeAuthority] = await PublicKey.findProgramAddress(
      [Buffer.from('recipe_authority')],
      RECIPE_PROGRAM_ID
    );
    
    try {
      const tx = await this.recipeProgram!.rpc.approveRecipe(
        isApproved,
        {
          accounts: {
            recipe: recipeAddress,
            recipeAuthority,
            authority: this.wallet!.publicKey!,
            systemProgram: SystemProgram.programId
          }
        }
      );
      
      return tx;
    } catch (error) {
      console.error('Failed to approve recipe:', error);
      throw error;
    }
  }

  // Start crafting
  async startCrafting(recipeAddress: PublicKey): Promise<string> {
    this.checkPrograms();
    
    const [craftingAddress] = await PublicKey.findProgramAddress(
      [Buffer.from('crafting'), recipeAddress.toBuffer(), this.wallet!.publicKey!.toBuffer()],
      RECIPE_PROGRAM_ID
    );
    
    try {
      const tx = await this.recipeProgram!.rpc.startCrafting(
        {
          accounts: {
            crafting: craftingAddress,
            recipe: recipeAddress,
            crafter: this.wallet!.publicKey!,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
          }
        }
      );
      
      return tx;
    } catch (error) {
      console.error('Failed to start crafting:', error);
      throw error;
    }
  }

  // Complete crafting
  async completeCrafting(recipeAddress: PublicKey): Promise<string> {
    this.checkPrograms();
    
    const [craftingAddress] = await PublicKey.findProgramAddress(
      [Buffer.from('crafting'), recipeAddress.toBuffer(), this.wallet!.publicKey!.toBuffer()],
      RECIPE_PROGRAM_ID
    );
    
    try {
      const tx = await this.recipeProgram!.rpc.completeCrafting(
        {
          accounts: {
            crafting: craftingAddress,
            recipe: recipeAddress,
            crafter: this.wallet!.publicKey!,
            systemProgram: SystemProgram.programId
          }
        }
      );
      
      return tx;
    } catch (error) {
      console.error('Failed to complete crafting:', error);
      throw error;
    }
  }

  // Get recipe information
  async getRecipe(recipeAddress: PublicKey): Promise<RecipeData> {
    this.checkPrograms();
    
    try {
      const recipe = await this.recipeProgram!.account.recipe.fetch(recipeAddress);
      return recipe as unknown as RecipeData;
    } catch (error) {
      console.error('Failed to get recipe information:', error);
      throw error;
    }
  }

  // ========== Crafting system interface ==========

  // Initialize crafting system
  async initializeCraftingSystem(): Promise<string> {
    this.checkPrograms();
    
    const [craftingAuthority, craftingAuthorityBump] = await PublicKey.findProgramAddress(
      [Buffer.from('crafting_authority')],
      CRAFTING_PROGRAM_ID
    );
    
    try {
      const tx = await this.craftingProgram!.rpc.initialize(
        craftingAuthorityBump,
        {
          accounts: {
            craftingAuthority,
            authority: this.wallet!.publicKey!,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
          }
        }
      );
      
      return tx;
    } catch (error) {
      console.error('Failed to initialize crafting system:', error);
      throw error;
    }
  }

  // Start advanced crafting
  async startAdvancedCrafting(
    recipeAddress: PublicKey,
    recipeCraftingAddress: PublicKey,
    materialInputs: { materialMint: PublicKey, amount: number }[]
  ): Promise<string> {
    this.checkPrograms();
    
    const [craftingRecordAddress] = await PublicKey.findProgramAddress(
      [Buffer.from('crafting_record'), recipeAddress.toBuffer(), this.wallet!.publicKey!.toBuffer()],
      CRAFTING_PROGRAM_ID
    );
    
    const remainingAccounts = materialInputs.flatMap(input => {
      const materialMintPubkey = input.materialMint;
      const amountKey = new Keypair();
      // Use a Keypair's public key to store quantity (this is a hack, and not recommended in practice)
      // In a real implementation, a more appropriate way to pass parameters should be used
      const amountBytes = Buffer.alloc(32);
      amountBytes.writeBigUInt64LE(BigInt(input.amount), 0);
      // @ts-ignore
      amountKey.publicKey._bn = [...amountBytes];
      
      return [
        {
          pubkey: materialMintPubkey,
          isWritable: false,
          isSigner: false
        },
        {
          pubkey: amountKey.publicKey,
          isWritable: false,
          isSigner: false
        }
      ];
    });
    
    try {
      const tx = await this.craftingProgram!.rpc.startCrafting(
        recipeAddress,
        {
          accounts: {
            craftingRecord: craftingRecordAddress,
            recipeCrafting: recipeCraftingAddress,
            recipe: recipeAddress,
            recipeProgram: RECIPE_PROGRAM_ID,
            crafter: this.wallet!.publicKey!,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
          },
          remainingAccounts
        }
      );
      
      return tx;
    } catch (error) {
      console.error('Failed to start advanced crafting:', error);
      throw error;
    }
  }

  // Verify materials
  async verifyMaterials(
    craftingRecordAddress: PublicKey,
    materialTokenAccounts: { mint: PublicKey, tokenAccount: PublicKey }[]
  ): Promise<string> {
    this.checkPrograms();
    
    const remainingAccounts = materialTokenAccounts.flatMap(material => [
      {
        pubkey: material.mint,
        isWritable: false,
        isSigner: false
      },
      {
        pubkey: material.tokenAccount,
        isWritable: false,
        isSigner: false
      }
    ]);
    
    try {
      const tx = await this.craftingProgram!.rpc.verifyMaterials(
        {
          accounts: {
            craftingRecord: craftingRecordAddress,
            crafter: this.wallet!.publicKey!,
            systemProgram: SystemProgram.programId
          },
          remainingAccounts
        }
      );
      
      return tx;
    } catch (error) {
      console.error('Failed to verify materials:', error);
      throw error;
    }
  }

  // Consume materials
  async consumeMaterials(
    craftingRecordAddress: PublicKey,
    materialTransfers: { fromAccount: PublicKey, toAccount: PublicKey }[]
  ): Promise<string> {
    this.checkPrograms();
    
    const remainingAccounts = materialTransfers.flatMap(transfer => [
      {
        pubkey: transfer.fromAccount,
        isWritable: true,
        isSigner: false
      },
      {
        pubkey: transfer.toAccount,
        isWritable: true,
        isSigner: false
      },
      {
        pubkey: TOKEN_PROGRAM_ID,
        isWritable: false,
        isSigner: false
      }
    ]);
    
    try {
      const tx = await this.craftingProgram!.rpc.consumeMaterials(
        {
          accounts: {
            craftingRecord: craftingRecordAddress,
            crafter: this.wallet!.publicKey!,
            systemProgram: SystemProgram.programId
          },
          remainingAccounts
        }
      );
      
      return tx;
    } catch (error) {
      console.error('Failed to consume materials:', error);
      throw error;
    }
  }

  // Complete advanced crafting
  async completeAdvancedCrafting(
    craftingRecordAddress: PublicKey,
    recipeCraftingAddress: PublicKey,
    recipeAddress: PublicKey,
    resultParams: {
      materialAuthority: PublicKey;
      resultMaterial: PublicKey;
      resultMint: PublicKey;
      resultMetadata: PublicKey;
      resultEdition: PublicKey;
      resultTokenAccount: PublicKey;
    },
    resultUri: string
  ): Promise<string> {
    this.checkPrograms();
    
    const [craftingAuthority] = await PublicKey.findProgramAddress(
      [Buffer.from('crafting_authority')],
      CRAFTING_PROGRAM_ID
    );
    
    try {
      const tx = await this.craftingProgram!.rpc.completeCrafting(
        resultUri,
        {
          accounts: {
            craftingRecord: craftingRecordAddress,
            recipeCrafting: recipeCraftingAddress,
            recipe: recipeAddress,
            craftingAuthority,
            materialAuthority: resultParams.materialAuthority,
            resultMaterial: resultParams.resultMaterial,
            resultMint: resultParams.resultMint,
            resultMetadata: resultParams.resultMetadata,
            resultEdition: resultParams.resultEdition,
            resultTokenAccount: resultParams.resultTokenAccount,
            recipeProgram: RECIPE_PROGRAM_ID,
            materialProgram: MATERIAL_PROGRAM_ID,
            crafter: this.wallet!.publicKey!,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY
          }
        }
      );
      
      return tx;
    } catch (error) {
      console.error('Failed to complete advanced crafting:', error);
      throw error;
    }
  }

  // Get crafting record
  async getCraftingRecord(craftingRecordAddress: PublicKey): Promise<CraftingData> {
    this.checkPrograms();
    
    try {
      const craftingRecord = await this.craftingProgram!.account.craftingRecord.fetch(craftingRecordAddress);
      return craftingRecord as unknown as CraftingData;
    } catch (error) {
      console.error('Failed to get crafting record:', error);
      throw error;
    }
  }

  // ========== Guild system interface ==========

  // Initialize guild system
  async initializeGuildSystem(): Promise<string> {
    this.checkPrograms();
    
    const [guildAuthority, guildAuthorityBump] = await PublicKey.findProgramAddress(
      [Buffer.from('guild_authority')],
      GUILD_PROGRAM_ID
    );
    
    try {
      const tx = await this.guildProgram!.rpc.initialize(
        guildAuthorityBump,
        {
          accounts: {
            guildAuthority,
            authority: this.wallet!.publicKey!,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
          }
        }
      );
      
      return tx;
    } catch (error) {
      console.error('Failed to initialize guild system:', error);
      throw error;
    }
  }

  // Create guild
  async createGuild(
    guildKeypair: Keypair,
    name: string,
    description: string,
    emblemUri: string,
    minContributionRequired: number,
    isPublic: boolean
  ): Promise<string> {
    this.checkPrograms();
    
    const [founderMembershipAddress] = await PublicKey.findProgramAddress(
      [
        Buffer.from('membership'), 
        guildKeypair.publicKey.toBuffer(), 
        this.wallet!.publicKey!.toBuffer()
      ],
      GUILD_PROGRAM_ID
    );
    
    try {
      const tx = await this.guildProgram!.rpc.createGuild(
        name,
        description,
        emblemUri,
        new BN(minContributionRequired),
        isPublic,
        {
          accounts: {
            guild: guildKeypair.publicKey,
            founderMembership: founderMembershipAddress,
            founder: this.wallet!.publicKey!,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
          },
          signers: [guildKeypair]
        }
      );
      
      return tx;
    } catch (error) {
      console.error('Failed to create guild:', error);
      throw error;
    }
  }

  // Join guild
  async joinGuild(
    guildAddress: PublicKey,
    inviterPubkey: PublicKey,
    guildBump: number
  ): Promise<string> {
    this.checkPrograms();
    
    const [membershipAddress] = await PublicKey.findProgramAddress(
      [
        Buffer.from('membership'), 
        guildAddress.toBuffer(), 
        this.wallet!.publicKey!.toBuffer()
      ],
      GUILD_PROGRAM_ID
    );
    
    try {
      const tx = await this.guildProgram!.rpc.joinGuild(
        guildBump,
        {
          accounts: {
            guild: guildAddress,
            membership: membershipAddress,
            inviter: inviterPubkey,
            member: this.wallet!.publicKey!,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
          }
        }
      );
      
      return tx;
    } catch (error) {
      console.error('Failed to join guild:', error);
      throw error;
    }
  }

  // Contribute to guild
  async contributeToGuild(
    guildAddress: PublicKey,
    membershipAddress: PublicKey,
    memberTokenAccount: PublicKey,
    guildTreasury: PublicKey,
    amount: number
  ): Promise<string> {
    this.checkPrograms();
    
    try {
      const tx = await this.guildProgram!.rpc.contributeToGuild(
        new BN(amount),
        {
          accounts: {
            guild: guildAddress,
            membership: membershipAddress,
            memberTokenAccount,
            guildTreasury,
            member: this.wallet!.publicKey!,
            tokenProgram: TOKEN_PROGRAM_ID
          }
        }
      );
      
      return tx;
    } catch (error) {
      console.error('Failed to contribute to guild:', error);
      throw error;
    }
  }

  // Promote guild member
  async promoteMember(
    guildAddress: PublicKey,
    membershipToPromote: PublicKey,
    promoterMembership: PublicKey,
    newRole: GuildRole
  ): Promise<string> {
    this.checkPrograms();
    
    try {
      const tx = await this.guildProgram!.rpc.promoteMember(
        newRole,
        {
          accounts: {
            guild: guildAddress,
            membership: membershipToPromote,
            promoterMembership,
            promoter: this.wallet!.publicKey!
          }
        }
      );
      
      return tx;
    } catch (error) {
      console.error('Failed to promote member:', error);
      throw error;
    }
  }

  // Create guild quest
  async createGuildQuest(
    guildAddress: PublicKey,
    creatorMembership: PublicKey,
    questKeypair: Keypair,
    guildTreasury: PublicKey,
    title: string,
    description: string,
    rewardAmount: number,
    expiryTime: number,
    requiredRole: GuildRole,
    requiredReputation: number
  ): Promise<string> {
    this.checkPrograms();
    
    try {
      const tx = await this.guildProgram!.rpc.createGuildQuest(
        title,
        description,
        new BN(rewardAmount),
        new BN(expiryTime),
        requiredRole,
        new BN(requiredReputation),
        {
          accounts: {
            guild: guildAddress,
            creatorMembership,
            quest: questKeypair.publicKey,
            guildTreasury,
            creator: this.wallet!.publicKey!,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
          },
          signers: [questKeypair]
        }
      );
      
      return tx;
    } catch (error) {
      console.error('Failed to create guild quest:', error);
      throw error;
    }
  }

  // Accept guild quest
  async acceptGuildQuest(
    guildAddress: PublicKey,
    questAddress: PublicKey,
    membershipAddress: PublicKey
  ): Promise<string> {
    this.checkPrograms();
    
    try {
      const tx = await this.guildProgram!.rpc.acceptGuildQuest(
        {
          accounts: {
            guild: guildAddress,
            quest: questAddress,
            membership: membershipAddress,
            member: this.wallet!.publicKey!
          }
        }
      );
      
      return tx;
    } catch (error) {
      console.error('Failed to accept guild quest:', error);
      throw error;
    }
  }

  // Complete guild quest
  async completeGuildQuest(
    guildAddress: PublicKey,
    questAddress: PublicKey,
    membershipAddress: PublicKey,
    memberTokenAccount: PublicKey,
    guildTreasury: PublicKey,
    questBump: number
  ): Promise<string> {
    this.checkPrograms();
    
    try {
      const tx = await this.guildProgram!.rpc.completeGuildQuest(
        questBump,
        {
          accounts: {
            guild: guildAddress,
            quest: questAddress,
            membership: membershipAddress,
            memberTokenAccount,
            guildTreasury,
            member: this.wallet!.publicKey!,
            tokenProgram: TOKEN_PROGRAM_ID
          }
        }
      );
      
      return tx;
    } catch (error) {
      console.error('Failed to complete guild quest:', error);
      throw error;
    }
  }

  // Get guild information
  async getGuild(guildAddress: PublicKey): Promise<GuildData> {
    this.checkPrograms();
    
    try {
      const guild = await this.guildProgram!.account.guild.fetch(guildAddress);
      return guild as unknown as GuildData;
    } catch (error) {
      console.error('Failed to get guild information:', error);
      throw error;
    }
  }

  // Get membership information
  async getMembership(membershipAddress: PublicKey): Promise<MembershipData> {
    this.checkPrograms();
    
    try {
      const membership = await this.guildProgram!.account.membership.fetch(membershipAddress);
      return membership as unknown as MembershipData;
    } catch (error) {
      console.error('Failed to get membership information:', error);
      throw error;
    }
  }

  // Get guild quest information
  async getGuildQuest(questAddress: PublicKey): Promise<GuildQuestData> {
    this.checkPrograms();
    
    try {
      const quest = await this.guildProgram!.account.guildQuest.fetch(questAddress);
      return quest as unknown as GuildQuestData;
    } catch (error) {
      console.error('Failed to get guild quest information:', error);
      throw error;
    }
  }

  // ========== Helper functions ==========

  // Find Metadata address
  async findMetadataAddress(mint: PublicKey): Promise<PublicKey> {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )[0];
  }

  // Find Edition address
  async findEditionAddress(mint: PublicKey): Promise<PublicKey> {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
        Buffer.from('edition'),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )[0];
  }
}

export default SolanaClient; 