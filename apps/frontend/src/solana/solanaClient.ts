import { 
  Connection, 
  PublicKey, 
  Transaction, 
  sendAndConfirmTransaction, 
  Keypair,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  SYSVAR_CLOCK_PUBKEY
} from '@solana/web3.js';
import { 
  Program, 
  Provider, 
  BN, 
  web3,
  utils,
  Idl
} from '@project-serum/anchor';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction
} from '@solana/spl-token';
import { WalletContextState } from '@solana/wallet-adapter-react';

// 定义合约程序ID
const MATERIAL_PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');
const RECIPE_PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');
const CRAFTING_PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');
const GUILD_PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// 物料类型枚举
export enum MaterialType {
  Basic = 'Basic',
  Rare = 'Rare',
  Seasonal = 'Seasonal',
  Mysterious = 'Mysterious'
}

// 稀有度枚举
export enum Rarity {
  Common = 'Common',
  Rare = 'Rare',
  Epic = 'Epic',
  Legendary = 'Legendary'
}

// 配方难度枚举
export enum RecipeDifficulty {
  Beginner = 0,
  Intermediate = 1,
  Advanced = 2,
  Master = 3
}

// 合成状态枚举
export enum CraftingStatus {
  InProgress = 0,
  Completed = 1,
  Failed = 2,
  Cancelled = 3
}

// 工会角色枚举
export enum GuildRole {
  Member = 0,
  Contributor = 1,
  Officer = 2,
  Founder = 3
}

// 材料类型接口
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

// 配方类型接口
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

// 材料配方组成接口
export interface IngredientData {
  materialMint: PublicKey;
  quantity: BN;
}

// 合成记录接口
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

// 材料输入接口
export interface MaterialInputData {
  materialMint: PublicKey;
  amount: BN;
}

// 工会数据接口
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

// 会员身份接口
export interface MembershipData {
  guild: PublicKey;
  member: PublicKey;
  role: GuildRole;
  joinedAt: BN;
  reputation: BN;
  contribution: BN;
  isActive: boolean;
}

// 工会任务接口
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

  // 设置钱包
  setWallet(wallet: WalletContextState) {
    this.wallet = wallet;
  }

  // 设置程序IDLs
  setProgramIdls(materialIdl: Idl, recipeIdl: Idl, craftingIdl: Idl, guildIdl: Idl) {
    if (!this.wallet) {
      throw new Error('钱包尚未设置');
    }
    
    const provider = new Provider(
      this.connection,
      this.wallet as any,
      { commitment: 'confirmed' }
    );
    
    this.materialProgram = new Program(materialIdl, MATERIAL_PROGRAM_ID, provider);
    this.recipeProgram = new Program(recipeIdl, RECIPE_PROGRAM_ID, provider);
    this.craftingProgram = new Program(craftingIdl, CRAFTING_PROGRAM_ID, provider);
    this.guildProgram = new Program(guildIdl, GUILD_PROGRAM_ID, provider);
  }

  // 检查程序是否已初始化
  private checkPrograms() {
    if (!this.materialProgram || !this.recipeProgram || !this.craftingProgram || !this.guildProgram) {
      throw new Error('程序IDL尚未设置');
    }
    
    if (!this.wallet || !this.wallet.publicKey) {
      throw new Error('钱包未连接');
    }
  }

  // ========== 材料系统接口 ==========

  // 初始化材料系统
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
      console.error('初始化材料系统失败:', error);
      throw error;
    }
  }

  // 创建材料NFT
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
      console.error('创建材料失败:', error);
      throw error;
    }
  }

  // 铸造材料NFT
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
      console.error('铸造材料失败:', error);
      throw error;
    }
  }

  // 查询材料信息
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
      console.error('查询材料失败:', error);
      throw error;
    }
  }

  // ========== 配方系统接口 ==========

  // 初始化配方系统
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
      console.error('初始化配方系统失败:', error);
      throw error;
    }
  }

  // 创建配方
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
      console.error('创建配方失败:', error);
      throw error;
    }
  }

  // 批准配方
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
      console.error('批准配方失败:', error);
      throw error;
    }
  }

  // 开始制作
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
      console.error('开始制作失败:', error);
      throw error;
    }
  }

  // 完成制作
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
      console.error('完成制作失败:', error);
      throw error;
    }
  }

  // 查询配方信息
  async getRecipe(recipeAddress: PublicKey): Promise<RecipeData> {
    this.checkPrograms();
    
    try {
      const recipe = await this.recipeProgram!.account.recipe.fetch(recipeAddress);
      return recipe as unknown as RecipeData;
    } catch (error) {
      console.error('查询配方失败:', error);
      throw error;
    }
  }

  // ========== 合成系统接口 ==========

  // 初始化合成系统
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
      console.error('初始化合成系统失败:', error);
      throw error;
    }
  }

  // 开始高级合成
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
      // 使用一个Keypair的公钥来存储数量（这是一个hack，实际上不推荐这么做）
      // 在实际实现中，应该使用更合适的方式传递参数
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
      console.error('开始高级合成失败:', error);
      throw error;
    }
  }

  // 验证材料
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
      console.error('验证材料失败:', error);
      throw error;
    }
  }

  // 消耗材料
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
      console.error('消耗材料失败:', error);
      throw error;
    }
  }

  // 完成高级合成
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
      console.error('完成高级合成失败:', error);
      throw error;
    }
  }

  // 查询合成记录
  async getCraftingRecord(craftingRecordAddress: PublicKey): Promise<CraftingData> {
    this.checkPrograms();
    
    try {
      const craftingRecord = await this.craftingProgram!.account.craftingRecord.fetch(craftingRecordAddress);
      return craftingRecord as unknown as CraftingData;
    } catch (error) {
      console.error('查询合成记录失败:', error);
      throw error;
    }
  }

  // ========== 工会系统接口 ==========

  // 初始化工会系统
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
      console.error('初始化工会系统失败:', error);
      throw error;
    }
  }

  // 创建工会
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
      console.error('创建工会失败:', error);
      throw error;
    }
  }

  // 加入工会
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
      console.error('加入工会失败:', error);
      throw error;
    }
  }

  // 向工会贡献
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
      console.error('向工会贡献失败:', error);
      throw error;
    }
  }

  // 提升工会成员
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
      console.error('提升成员失败:', error);
      throw error;
    }
  }

  // 创建工会任务
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
      console.error('创建工会任务失败:', error);
      throw error;
    }
  }

  // 接受工会任务
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
      console.error('接受工会任务失败:', error);
      throw error;
    }
  }

  // 完成工会任务
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
      console.error('完成工会任务失败:', error);
      throw error;
    }
  }

  // 查询工会信息
  async getGuild(guildAddress: PublicKey): Promise<GuildData> {
    this.checkPrograms();
    
    try {
      const guild = await this.guildProgram!.account.guild.fetch(guildAddress);
      return guild as unknown as GuildData;
    } catch (error) {
      console.error('查询工会失败:', error);
      throw error;
    }
  }

  // 查询成员身份
  async getMembership(membershipAddress: PublicKey): Promise<MembershipData> {
    this.checkPrograms();
    
    try {
      const membership = await this.guildProgram!.account.membership.fetch(membershipAddress);
      return membership as unknown as MembershipData;
    } catch (error) {
      console.error('查询成员身份失败:', error);
      throw error;
    }
  }

  // 查询工会任务
  async getGuildQuest(questAddress: PublicKey): Promise<GuildQuestData> {
    this.checkPrograms();
    
    try {
      const quest = await this.guildProgram!.account.guildQuest.fetch(questAddress);
      return quest as unknown as GuildQuestData;
    } catch (error) {
      console.error('查询工会任务失败:', error);
      throw error;
    }
  }

  // ========== 辅助函数 ==========

  // 查找Metadata地址
  async findMetadataAddress(mint: PublicKey): Promise<PublicKey> {
    return (await PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    ))[0];
  }

  // 查找Edition地址
  async findEditionAddress(mint: PublicKey): Promise<PublicKey> {
    return (await PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
        Buffer.from('edition'),
      ],
      TOKEN_METADATA_PROGRAM_ID
    ))[0];
  }
}

export default SolanaClient; 