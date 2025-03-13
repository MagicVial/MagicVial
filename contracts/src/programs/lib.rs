use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token};
use solana_program::sysvar::{clock};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod magic_vial {
    use super::*;

    // Initialize the MagicVial platform
    pub fn initialize(ctx: Context<Initialize>, params: InitializeParams) -> Result<()> {
        let magic_vial = &mut ctx.accounts.magic_vial;
        magic_vial.authority = ctx.accounts.authority.key();
        magic_vial.treasury = ctx.accounts.treasury.key();
        magic_vial.total_materials = 0;
        magic_vial.total_recipes = 0;
        magic_vial.total_crafts = 0;
        magic_vial.crafting_fee_bps = params.crafting_fee_bps;
        magic_vial.guild_discount_bps = params.guild_discount_bps;

        emit!(PlatformInitialized {
            authority: magic_vial.authority,
            treasury: magic_vial.treasury,
        });

        Ok(())
    }

    // Add a new material type to the system
    pub fn add_material(ctx: Context<AddMaterial>, params: MaterialParams) -> Result<()> {
        let magic_vial = &mut ctx.accounts.magic_vial;
        let material = &mut ctx.accounts.material;

        material.name = params.name;
        material.material_type = params.material_type;
        material.rarity = params.rarity;
        material.seasonal = params.seasonal;
        material.season_id = params.season_id;
        material.max_supply = params.max_supply;
        material.current_supply = 0;
        material.authority = ctx.accounts.authority.key();
        material.material_id = magic_vial.total_materials;
        material.bump = *ctx.bumps.get("material").unwrap();

        magic_vial.total_materials = magic_vial.total_materials.checked_add(1).unwrap();

        emit!(MaterialAdded {
            material_id: material.material_id,
            name: material.name.clone(),
            material_type: material.material_type,
            rarity: material.rarity,
        });

        Ok(())
    }

    // Register a new recipe
    pub fn add_recipe(ctx: Context<AddRecipe>, params: RecipeParams) -> Result<()> {
        let magic_vial = &mut ctx.accounts.magic_vial;
        let recipe = &mut ctx.accounts.recipe;

        recipe.name = params.name;
        recipe.description = params.description;
        recipe.recipe_type = params.recipe_type;
        recipe.difficulty = params.difficulty;
        recipe.success_rate_bps = params.success_rate_bps;
        recipe.required_materials = params.required_materials;
        recipe.required_amounts = params.required_amounts;
        recipe.required_guild_level = params.required_guild_level;
        recipe.output_types = params.output_types;
        recipe.output_weights = params.output_weights;
        recipe.is_active = true;
        recipe.creator = ctx.accounts.authority.key();
        recipe.recipe_id = magic_vial.total_recipes;
        recipe.creation_time = clock::Clock::get()?.unix_timestamp;
        recipe.bump = *ctx.bumps.get("recipe").unwrap();

        magic_vial.total_recipes = magic_vial.total_recipes.checked_add(1).unwrap();

        emit!(RecipeAdded {
            recipe_id: recipe.recipe_id,
            name: recipe.name.clone(),
            recipe_type: recipe.recipe_type,
            difficulty: recipe.difficulty,
        });

        Ok(())
    }

    // Craft a new item using a recipe
    pub fn craft_item(ctx: Context<CraftItem>, params: CraftParams) -> Result<()> {
        let magic_vial = &mut ctx.accounts.magic_vial;
        let recipe = &ctx.accounts.recipe;
        let crafter = &ctx.accounts.crafter;
        let craft_result = &mut ctx.accounts.craft_result;
        
        // Validate recipe is active
        require!(recipe.is_active, CustomError::RecipeNotActive);
        
        // Calculate success probability (could be more complex with additional factors)
        let base_success_rate = recipe.success_rate_bps;
        
        // Use recipe materials - in a real implementation we would check user has materials
        // and burn them as part of the crafting process
        
        // Determine if craft successful using slot as randomness source
        // In production, you'd want a more sophisticated randomness source
        let clock = clock::Clock::get()?;
        let random_value: u64 = (clock.slot as u64).wrapping_add(clock.unix_timestamp as u64);
        let is_successful = random_value % 10000 < base_success_rate as u64;
        
        // Set up craft result
        craft_result.crafter = ctx.accounts.authority.key();
        craft_result.recipe_id = recipe.recipe_id;
        craft_result.craft_id = magic_vial.total_crafts;
        craft_result.success = is_successful;
        craft_result.creation_time = clock.unix_timestamp;
        
        if is_successful {
            // Select output type from weighted possibilities
            let output_index = select_weighted_output(&recipe.output_weights, random_value)?;
            craft_result.result_type = recipe.output_types[output_index];
            craft_result.rarity = determine_rarity(recipe.difficulty, random_value)?;
        } else {
            // Failed experiment
            craft_result.result_type = 0; // 0 = failed experiment
            craft_result.rarity = 1; // Common rarity for failures
        }
        
        magic_vial.total_crafts = magic_vial.total_crafts.checked_add(1).unwrap();
        
        emit!(ItemCrafted {
            craft_id: craft_result.craft_id,
            crafter: craft_result.crafter,
            recipe_id: craft_result.recipe_id,
            success: craft_result.success,
            result_type: craft_result.result_type,
            rarity: craft_result.rarity,
        });
        
        Ok(())
    }

    // Create a new guild
    pub fn create_guild(ctx: Context<CreateGuild>, params: GuildParams) -> Result<()> {
        let guild = &mut ctx.accounts.guild;
        
        guild.name = params.name;
        guild.description = params.description;
        guild.founder = ctx.accounts.authority.key();
        guild.members = vec![ctx.accounts.authority.key()];
        guild.member_roles = vec![0]; // 0 = Founder role
        guild.level = 1;
        guild.experience = 0;
        guild.creation_time = clock::Clock::get()?.unix_timestamp;
        guild.bump = *ctx.bumps.get("guild").unwrap();
        
        emit!(GuildCreated {
            guild_id: params.guild_id,
            name: guild.name.clone(),
            founder: guild.founder,
        });
        
        Ok(())
    }
}

// Helper functions
fn select_weighted_output(weights: &[u16], random_value: u64) -> Result<usize> {
    let total_weight: u16 = weights.iter().sum();
    let mut remaining = (random_value % total_weight as u64) as u16;
    
    for (i, &weight) in weights.iter().enumerate() {
        if remaining < weight {
            return Ok(i);
        }
        remaining = remaining.saturating_sub(weight);
    }
    
    // Default to first output if something went wrong
    Ok(0)
}

fn determine_rarity(difficulty: u8, random_value: u64) -> Result<u8> {
    // Simple rarity determination algorithm
    // Higher difficulty means higher chance of rare results
    let rarity_roll = random_value % 100;
    
    let rarity = match (rarity_roll, difficulty) {
        (0..=59, _) => 1,     // Common (60%)
        (60..=84, _) => 2,    // Uncommon (25%)
        (85..=94, _) => 3,    // Rare (10%)
        (95..=98, _) => 4,    // Epic (4%)
        (99, _) => 5,         // Legendary (1%)
        _ => 1,               // Default to common
    };
    
    Ok(rarity)
}

// Contexts
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + MagicVialPlatform::SPACE
    )]
    pub magic_vial: Account<'info, MagicVialPlatform>,
    
    /// CHECK: Treasury account that will receive fees
    pub treasury: AccountInfo<'info>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddMaterial<'info> {
    #[account(mut)]
    pub magic_vial: Account<'info, MagicVialPlatform>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + Material::SPACE,
        seeds = [
            b"material",
            magic_vial.total_materials.to_le_bytes().as_ref(),
        ],
        bump
    )]
    pub material: Account<'info, Material>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddRecipe<'info> {
    #[account(mut)]
    pub magic_vial: Account<'info, MagicVialPlatform>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + Recipe::SPACE,
        seeds = [
            b"recipe",
            magic_vial.total_recipes.to_le_bytes().as_ref(),
        ],
        bump
    )]
    pub recipe: Account<'info, Recipe>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CraftItem<'info> {
    #[account(mut)]
    pub magic_vial: Account<'info, MagicVialPlatform>,
    
    #[account(
        seeds = [
            b"recipe",
            recipe.recipe_id.to_le_bytes().as_ref(),
        ],
        bump = recipe.bump
    )]
    pub recipe: Account<'info, Recipe>,
    
    #[account(
        mut,
        seeds = [
            b"crafter",
            authority.key().as_ref(),
        ],
        bump = crafter.bump
    )]
    pub crafter: Account<'info, Crafter>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + CraftResult::SPACE,
        seeds = [
            b"craft_result",
            magic_vial.total_crafts.to_le_bytes().as_ref(),
        ],
        bump
    )]
    pub craft_result: Account<'info, CraftResult>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(params: GuildParams)]
pub struct CreateGuild<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Guild::SPACE,
        seeds = [
            b"guild",
            params.guild_id.to_le_bytes().as_ref(),
        ],
        bump
    )]
    pub guild: Account<'info, Guild>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

// Accounts

#[account]
pub struct MagicVialPlatform {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub total_materials: u64,
    pub total_recipes: u64,
    pub total_crafts: u64,
    pub crafting_fee_bps: u16,
    pub guild_discount_bps: u16,
}

impl MagicVialPlatform {
    pub const SPACE: usize = 32 + 32 + 8 + 8 + 8 + 2 + 2;
}

#[account]
pub struct Material {
    pub material_id: u64,
    pub name: String,
    pub material_type: u8, // 1 = basic, 2 = rare, 3 = seasonal, 4 = mysterious
    pub rarity: u8,        // 1-5 scale
    pub seasonal: bool,
    pub season_id: Option<u8>,
    pub max_supply: Option<u64>,
    pub current_supply: u64,
    pub authority: Pubkey,
    pub bump: u8,
}

impl Material {
    pub const SPACE: usize = 8 + 50 + 1 + 1 + 1 + 2 + 9 + 8 + 32 + 1;
}

#[account]
pub struct Recipe {
    pub recipe_id: u64,
    pub name: String,
    pub description: String,
    pub recipe_type: u8,    // 1 = basic, 2 = advanced, 3 = community, 4 = legendary
    pub difficulty: u8,     // 1-10 scale
    pub success_rate_bps: u16, // Base success rate in basis points (10000 = 100%)
    pub required_materials: Vec<u64>, // Material IDs
    pub required_amounts: Vec<u16>,  // Amounts of each material
    pub required_guild_level: Option<u8>,
    pub output_types: Vec<u16>,  // Possible output types
    pub output_weights: Vec<u16>, // Probability weights for outputs
    pub is_active: bool,
    pub creator: Pubkey,
    pub creation_time: i64,
    pub bump: u8,
}

impl Recipe {
    pub const SPACE: usize = 8 + 50 + 200 + 1 + 1 + 2 + 100 + 100 + 2 + 100 + 100 + 1 + 32 + 8 + 1;
}

#[account]
pub struct Crafter {
    pub authority: Pubkey,
    pub experience: u64,
    pub reputation: i64,
    pub total_crafts: u64,
    pub successful_crafts: u64,
    pub guild: Option<Pubkey>,
    pub bump: u8,
}

impl Crafter {
    pub const SPACE: usize = 32 + 8 + 8 + 8 + 8 + 33 + 1;
}

#[account]
pub struct CraftResult {
    pub craft_id: u64,
    pub crafter: Pubkey,
    pub recipe_id: u64,
    pub success: bool,
    pub result_type: u16,
    pub rarity: u8,
    pub creation_time: i64,
}

impl CraftResult {
    pub const SPACE: usize = 8 + 32 + 8 + 1 + 2 + 1 + 8;
}

#[account]
pub struct Guild {
    pub name: String,
    pub description: String,
    pub founder: Pubkey,
    pub members: Vec<Pubkey>,
    pub member_roles: Vec<u8>,  // 0 = founder, 1 = admin, 2 = member
    pub level: u8,
    pub experience: u64,
    pub creation_time: i64,
    pub bump: u8,
}

impl Guild {
    pub const SPACE: usize = 50 + 200 + 32 + 1000 + 100 + 1 + 8 + 8 + 1;
}

// Params
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeParams {
    pub crafting_fee_bps: u16,
    pub guild_discount_bps: u16,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct MaterialParams {
    pub name: String,
    pub material_type: u8,
    pub rarity: u8,
    pub seasonal: bool,
    pub season_id: Option<u8>,
    pub max_supply: Option<u64>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct RecipeParams {
    pub name: String,
    pub description: String,
    pub recipe_type: u8,
    pub difficulty: u8,
    pub success_rate_bps: u16,
    pub required_materials: Vec<u64>,
    pub required_amounts: Vec<u16>,
    pub required_guild_level: Option<u8>,
    pub output_types: Vec<u16>,
    pub output_weights: Vec<u16>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CraftParams {
    // Any additional parameters for crafting can go here
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct GuildParams {
    pub guild_id: u64,
    pub name: String,
    pub description: String,
}

// Events
#[event]
pub struct PlatformInitialized {
    pub authority: Pubkey,
    pub treasury: Pubkey,
}

#[event]
pub struct MaterialAdded {
    pub material_id: u64,
    pub name: String,
    pub material_type: u8,
    pub rarity: u8,
}

#[event]
pub struct RecipeAdded {
    pub recipe_id: u64,
    pub name: String,
    pub recipe_type: u8,
    pub difficulty: u8,
}

#[event]
pub struct ItemCrafted {
    pub craft_id: u64,
    pub crafter: Pubkey,
    pub recipe_id: u64,
    pub success: bool,
    pub result_type: u16,
    pub rarity: u8,
}

#[event]
pub struct GuildCreated {
    pub guild_id: u64,
    pub name: String,
    pub founder: Pubkey,
}

// Error Codes
#[error_code]
pub enum CustomError {
    #[msg("Recipe is not currently active")]
    RecipeNotActive,
    #[msg("Not enough materials for crafting")]
    InsufficientMaterials,
    #[msg("Guild level requirement not met")]
    GuildLevelRequirementNotMet,
    #[msg("Invalid recipe parameters")]
    InvalidRecipeParameters,
} 