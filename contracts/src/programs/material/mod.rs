use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

declare_id!("matXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

#[program]
pub mod magic_vial_material {
    use super::*;

    // Initialize a new material type
    pub fn initialize_material_type(
        ctx: Context<InitializeMaterialType>,
        name: String,
        description: String,
        material_type: u8, // 1: Basic, 2: Rare, 3: Seasonal, 4: Mysterious
        rarity: u8,        // 1-5, higher is rarer
        uri: String,
        season_id: Option<u8>, // Season identifier for seasonal materials
        attributes: Option<Vec<MaterialAttribute>>, // Optional special attributes
        success_rate_bonus: u8, // Bonus to crafting success rate (0-50)
        discovery_difficulty: u8, // How hard to discover (1-100)
    ) -> Result<()> {
        require!(rarity >= 1 && rarity <= 5, MaterialError::InvalidRarity);
        require!(success_rate_bonus <= 50, MaterialError::InvalidBonus);
        require!(discovery_difficulty <= 100, MaterialError::InvalidDiscoveryDifficulty);
        
        let material_type_info = &mut ctx.accounts.material_type_info;
        material_type_info.name = name;
        material_type_info.description = description;
        material_type_info.material_type = material_type;
        material_type_info.rarity = rarity;
        material_type_info.uri = uri;
        material_type_info.authority = ctx.accounts.authority.key();
        material_type_info.enabled = true;
        material_type_info.created_at = Clock::get()?.unix_timestamp;
        material_type_info.season_id = season_id;
        
        // Store attributes if provided
        if let Some(attrs) = attributes {
            material_type_info.attributes = attrs;
        }
        
        material_type_info.success_rate_bonus = success_rate_bonus;
        material_type_info.discovery_difficulty = discovery_difficulty;
        
        // Set expiry timestamp for seasonal materials
        if let Some(season) = season_id {
            // Season materials expire after approximately 3 months
            // This is simplified and would be managed by governance in reality
            material_type_info.expires_at = Some(Clock::get()?.unix_timestamp + 7_776_000); // 90 days
        } else {
            material_type_info.expires_at = None;
        }

        Ok(())
    }

    // Mint a new material instance
    pub fn mint_material(
        ctx: Context<MintMaterial>,
        amount: u64,
    ) -> Result<()> {
        // Check if material type is still valid
        if let Some(expires_at) = ctx.accounts.material_type_info.expires_at {
            let current_time = Clock::get()?.unix_timestamp;
            require!(current_time < expires_at, MaterialError::MaterialExpired);
        }
        
        require!(ctx.accounts.material_type_info.enabled, MaterialError::MaterialDisabled);
        
        let material_instance = &mut ctx.accounts.material_instance;
        material_instance.material_type = ctx.accounts.material_type_info.key();
        material_instance.owner = ctx.accounts.owner.key();
        material_instance.amount = amount;
        material_instance.created_at = Clock::get()?.unix_timestamp;
        material_instance.rarity = ctx.accounts.material_type_info.rarity;
        material_instance.material_type_enum = ctx.accounts.material_type_info.material_type;

        // For NFT representation, mint 1 token to the owner
        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.owner_token.to_account_info(),
                    authority: ctx.accounts.mint.to_account_info(),
                },
            ),
            1,
        )?;

        Ok(())
    }

    // Discover a material (for exploration gameplay)
    pub fn discover_material(
        ctx: Context<DiscoverMaterial>,
        area_id: u8,
        explorer_level: u8,
    ) -> Result<()> {
        // Verify the material can be discovered in this area
        let material_type_info = &ctx.accounts.material_type_info;
        
        // Check if material is discoverable
        require!(material_type_info.enabled, MaterialError::MaterialDisabled);
        
        // Check for seasonal expiry
        if let Some(expires_at) = material_type_info.expires_at {
            let current_time = Clock::get()?.unix_timestamp;
            require!(current_time < expires_at, MaterialError::MaterialExpired);
        }
        
        // Calculate discovery chance based on explorer level and material difficulty
        let discovery_chance = calculate_discovery_chance(
            explorer_level,
            material_type_info.discovery_difficulty,
            material_type_info.rarity,
        );
        
        // Use recent blockhash for randomness (in production would use a VRF)
        let recent_blockhash = ctx.accounts.recent_blockhash.key();
        let explorer = ctx.accounts.explorer.key();
        let current_time = Clock::get()?.unix_timestamp;
        
        let successful_discovery = determine_discovery_success(
            discovery_chance,
            recent_blockhash,
            explorer,
            current_time,
        );
        
        require!(successful_discovery, MaterialError::DiscoveryFailed);
        
        // If discovery successful, mint material to the explorer
        let discovery_record = &mut ctx.accounts.discovery_record;
        discovery_record.explorer = explorer;
        discovery_record.material_type = material_type_info.key();
        discovery_record.timestamp = current_time;
        discovery_record.area_id = area_id;
        
        // Mint a small amount of the discovered material
        // In production implementation, would use CPI to the mint_material instruction
        
        Ok(())
    }

    // Transfer material ownership
    pub fn transfer_material(
        ctx: Context<TransferMaterial>,
    ) -> Result<()> {
        let material_instance = &mut ctx.accounts.material_instance;
        material_instance.owner = ctx.accounts.new_owner.key();

        // Transfer the NFT token
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.current_owner_token.to_account_info(),
                    to: ctx.accounts.new_owner_token.to_account_info(),
                    authority: ctx.accounts.current_owner.to_account_info(),
                },
            ),
            1,
        )?;

        Ok(())
    }

    // Consume material (for crafting)
    pub fn consume_material(
        ctx: Context<ConsumeMaterial>,
        amount: u64,
    ) -> Result<()> {
        let material_instance = &mut ctx.accounts.material_instance;
        require!(material_instance.amount >= amount, MaterialError::InsufficientAmount);
        
        material_instance.amount -= amount;

        // If completely consumed, burn the NFT
        if material_instance.amount == 0 {
            token::burn(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    token::Burn {
                        mint: ctx.accounts.mint.to_account_info(),
                        from: ctx.accounts.owner_token.to_account_info(),
                        authority: ctx.accounts.owner.to_account_info(),
                    },
                ),
                1,
            )?;
        }

        Ok(())
    }
    
    // Combine two materials to upgrade (material synthesis)
    pub fn synthesize_materials(
        ctx: Context<SynthesizeMaterials>,
    ) -> Result<()> {
        // Check that both input materials are the same type
        require!(
            ctx.accounts.material_instance_1.material_type == ctx.accounts.material_instance_2.material_type,
            MaterialError::IncompatibleMaterials
        );
        
        // Check that both materials have sufficient quantity
        require!(ctx.accounts.material_instance_1.amount >= 5, MaterialError::InsufficientAmount);
        require!(ctx.accounts.material_instance_2.amount >= 5, MaterialError::InsufficientAmount);
        
        // Get material type info
        let material_type = &ctx.accounts.material_type_info;
        
        // Check if this material type can be synthesized to a higher level
        require!(material_type.rarity < 5, MaterialError::MaxRarityReached);
        
        // Consume 5 from each input material
        ctx.accounts.material_instance_1.amount -= 5;
        ctx.accounts.material_instance_2.amount -= 5;
        
        // If either material is fully consumed, burn its NFT
        if ctx.accounts.material_instance_1.amount == 0 {
            token::burn(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    token::Burn {
                        mint: ctx.accounts.material_instance_1_mint.to_account_info(),
                        from: ctx.accounts.material_instance_1_token.to_account_info(),
                        authority: ctx.accounts.crafter.to_account_info(),
                    },
                ),
                1,
            )?;
        }
        
        if ctx.accounts.material_instance_2.amount == 0 {
            token::burn(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    token::Burn {
                        mint: ctx.accounts.material_instance_2_mint.to_account_info(),
                        from: ctx.accounts.material_instance_2_token.to_account_info(),
                        authority: ctx.accounts.crafter.to_account_info(),
                    },
                ),
                1,
            )?;
        }
        
        // In a real implementation, would mint a new material of higher rarity
        // using cross-program invocation to mint_material

        Ok(())
    }
    
    // Initialize a new season (admin only)
    pub fn initialize_season(
        ctx: Context<InitializeSeason>,
        season_id: u8,
        name: String,
        description: String,
        duration_days: u16,
    ) -> Result<()> {
        let season = &mut ctx.accounts.season;
        season.season_id = season_id;
        season.name = name;
        season.description = description;
        season.start_time = Clock::get()?.unix_timestamp;
        season.end_time = Clock::get()?.unix_timestamp + (duration_days as i64 * 86400);
        season.authority = ctx.accounts.authority.key();
        
        Ok(())
    }
}

// Helper function for discovery chance
fn calculate_discovery_chance(explorer_level: u8, difficulty: u8, rarity: u8) -> u8 {
    let base_chance = 50; // 50% base chance
    let level_bonus = explorer_level.saturating_mul(2); // 2% per level
    let difficulty_penalty = difficulty.saturating_div(4); // 0.25% penalty per difficulty point
    let rarity_penalty = rarity.saturating_mul(10); // 10% penalty per rarity level
    
    base_chance.saturating_add(level_bonus)
               .saturating_sub(difficulty_penalty)
               .saturating_sub(rarity_penalty)
               .min(95) // Cap at 95% chance
}

// Helper function for discovery success determination
fn determine_discovery_success(chance: u8, blockhash: Pubkey, explorer: Pubkey, timestamp: i64) -> bool {
    // Use blockhash, explorer, and timestamp to generate pseudo-randomness
    // In production, would use a verifiable random function
    let mut data = [0u8; 32];
    let blockhash_bytes = blockhash.to_bytes();
    let explorer_bytes = explorer.to_bytes();
    let timestamp_bytes = timestamp.to_le_bytes();
    
    for i in 0..32 {
        data[i] = blockhash_bytes[i] ^ 
                 explorer_bytes[i % 32] ^ 
                 (if i < 8 { timestamp_bytes[i] } else { 0 });
    }
    
    // Use first byte as percentage (0-255)
    let roll = data[0] as u16 * 100 / 255;
    
    roll < chance as u16
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum AttributeEffect {
    SuccessBonus,
    ExperienceBonus,
    DiscoveryBonus,
    DurabilityBonus,
    CraftingSpeed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MaterialAttribute {
    pub name: String,
    pub effect: AttributeEffect,
    pub value: u8,
}

#[account]
pub struct MaterialTypeInfo {
    pub name: String,           // Material name
    pub description: String,    // Material description
    pub material_type: u8,      // Material type category
    pub rarity: u8,             // Rarity score (1-5)
    pub uri: String,            // Metadata URI
    pub authority: Pubkey,      // Authority that can modify this type
    pub enabled: bool,          // Whether this material is still available
    pub created_at: i64,        // Creation timestamp
    pub attributes: Vec<MaterialAttribute>, // Special attributes
    pub success_rate_bonus: u8, // Bonus to crafting success (0-50%)
    pub discovery_difficulty: u8, // How hard to discover (1-100)
    pub season_id: Option<u8>,  // Season this material belongs to (if seasonal)
    pub expires_at: Option<i64>, // When this material expires (for seasonal)
}

#[account]
pub struct MaterialInstance {
    pub material_type: Pubkey,  // Reference to the material type
    pub owner: Pubkey,          // Current owner
    pub amount: u64,            // Quantity of this material
    pub created_at: i64,        // Creation timestamp
    pub rarity: u8,             // Cached rarity from material type
    pub material_type_enum: u8, // Cached material type from material type
}

#[account]
pub struct Season {
    pub season_id: u8,          // Unique season identifier
    pub name: String,           // Season name
    pub description: String,    // Season description
    pub start_time: i64,        // Season start time
    pub end_time: i64,          // Season end time
    pub authority: Pubkey,      // Admin authority
}

#[account]
pub struct DiscoveryRecord {
    pub explorer: Pubkey,       // Who discovered the material
    pub material_type: Pubkey,  // What was discovered
    pub timestamp: i64,         // When it was discovered
    pub area_id: u8,            // Where it was discovered
}

#[derive(Accounts)]
pub struct InitializeMaterialType<'info> {
    #[account(init, payer = authority, space = 8 + 1024)]
    pub material_type_info: Account<'info, MaterialTypeInfo>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintMaterial<'info> {
    #[account(init, payer = authority, space = 8 + 128)]
    pub material_instance: Account<'info, MaterialInstance>,
    
    pub material_type_info: Account<'info, MaterialTypeInfo>,
    
    #[account(
        init,
        payer = authority,
        mint::decimals = 0,
        mint::authority = mint,
    )]
    pub mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = owner,
    )]
    pub owner_token: Account<'info, TokenAccount>,
    
    pub owner: AccountInfo<'info>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct DiscoverMaterial<'info> {
    #[account(init, payer = explorer, space = 8 + 128)]
    pub discovery_record: Account<'info, DiscoveryRecord>,
    
    pub material_type_info: Account<'info, MaterialTypeInfo>,
    
    #[account(mut)]
    pub explorer: Signer<'info>,
    
    pub recent_blockhash: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct TransferMaterial<'info> {
    #[account(mut, has_one = owner @ MaterialError::InvalidOwner)]
    pub material_instance: Account<'info, MaterialInstance>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(mut, has_one = mint)]
    pub current_owner_token: Account<'info, TokenAccount>,
    
    #[account(mut, has_one = mint)]
    pub new_owner_token: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub current_owner: Signer<'info>,
    
    #[account(mut)]
    pub new_owner: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ConsumeMaterial<'info> {
    #[account(mut, has_one = owner @ MaterialError::InvalidOwner)]
    pub material_instance: Account<'info, MaterialInstance>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(mut, has_one = mint)]
    pub owner_token: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SynthesizeMaterials<'info> {
    #[account(mut, has_one = owner @ MaterialError::InvalidOwner)]
    pub material_instance_1: Account<'info, MaterialInstance>,
    
    #[account(mut, has_one = owner @ MaterialError::InvalidOwner)]
    pub material_instance_2: Account<'info, MaterialInstance>,
    
    pub material_type_info: Account<'info, MaterialTypeInfo>,
    
    #[account(mut)]
    pub material_instance_1_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub material_instance_2_mint: Account<'info, Mint>,
    
    #[account(mut, has_one = mint)]
    pub material_instance_1_token: Account<'info, TokenAccount>,
    
    #[account(mut, has_one = mint)]
    pub material_instance_2_token: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub crafter: Signer<'info>,
    
    #[account(constraint = crafter.key() == material_instance_1.owner && 
                        crafter.key() == material_instance_2.owner)]
    pub owner: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct InitializeSeason<'info> {
    #[account(init, payer = authority, space = 8 + 512)]
    pub season: Account<'info, Season>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[error_code]
pub enum MaterialError {
    #[msg("Insufficient material amount")]
    InsufficientAmount,
    
    #[msg("Invalid material owner")]
    InvalidOwner,
    
    #[msg("Material type has expired")]
    MaterialExpired,
    
    #[msg("Material type is disabled")]
    MaterialDisabled,
    
    #[msg("Discovery attempt failed")]
    DiscoveryFailed,
    
    #[msg("Materials are incompatible for synthesis")]
    IncompatibleMaterials,
    
    #[msg("Material has reached maximum rarity level")]
    MaxRarityReached,
    
    #[msg("Rarity must be between 1 and 5")]
    InvalidRarity,
    
    #[msg("Success rate bonus cannot exceed 50")]
    InvalidBonus,
    
    #[msg("Discovery difficulty must be between 1 and 100")]
    InvalidDiscoveryDifficulty,
} 