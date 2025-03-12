use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

// Import our other program interfaces
use crate::material::{MaterialInstance, ConsumeMaterial};
use crate::recipe::Recipe;

declare_id!("craXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

#[program]
pub mod magic_vial_crafting {
    use super::*;

    // Initialize the crafting system
    pub fn initialize(
        ctx: Context<Initialize>,
        fee_percentage: u8,
    ) -> Result<()> {
        require!(fee_percentage <= 100, CraftingError::InvalidFeePercentage);
        
        let crafting_config = &mut ctx.accounts.crafting_config;
        crafting_config.authority = ctx.accounts.authority.key();
        crafting_config.fee_destination = ctx.accounts.fee_destination.key();
        crafting_config.fee_percentage = fee_percentage;
        crafting_config.paused = false;
        
        Ok(())
    }

    // Craft a new item using a recipe
    pub fn craft(
        ctx: Context<Craft>,
        material_instances: Vec<Pubkey>,
    ) -> Result<()> {
        // Check if crafting system is paused
        require!(!ctx.accounts.crafting_config.paused, CraftingError::CraftingPaused);
        
        // Check if recipe is approved and not disabled
        require!(ctx.accounts.recipe.approved, CraftingError::RecipeNotApproved);
        require!(!ctx.accounts.recipe.disabled, CraftingError::RecipeDisabled);
        
        // Verify materials match recipe requirements
        require!(
            material_instances.len() == ctx.accounts.recipe.material_types.len(),
            CraftingError::MaterialMismatch
        );
        
        // Verify the crafting fee is sufficient
        let fee_amount = calculate_fee(
            ctx.accounts.recipe.difficulty,
            ctx.accounts.crafting_config.fee_percentage,
        );
        require!(ctx.accounts.payment_amount >= fee_amount, CraftingError::InsufficientFee);
        
        // Process the crafting fee payment
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.crafter_token.to_account_info(),
                    to: ctx.accounts.fee_destination_token.to_account_info(),
                    authority: ctx.accounts.crafter.to_account_info(),
                },
            ),
            fee_amount,
        )?;
        
        // Consume materials (would call the material program for each material)
        // This is simplified and would need cross-program invocation
        
        // Calculate crafting success based on recipe success rate and crafter's experience
        let success = determine_crafting_success(
            ctx.accounts.recipe.success_rate,
            ctx.accounts.crafter_stats.experience_level,
            ctx.accounts.recent_blockhash.key(),
            ctx.accounts.crafter.key(),
        );
        
        // Create the crafting record
        let crafting_record = &mut ctx.accounts.crafting_record;
        crafting_record.crafter = ctx.accounts.crafter.key();
        crafting_record.recipe = ctx.accounts.recipe.key();
        crafting_record.timestamp = Clock::get()?.unix_timestamp;
        crafting_record.materials_used = material_instances;
        crafting_record.success = success;
        
        // If successful, determine the result type based on weighted probabilities
        if success {
            // Select result based on weights and mint the result
            // This is simplified and would need cross-program invocation
            crafting_record.result_type = select_result_type(
                &ctx.accounts.recipe.result_types,
                &ctx.accounts.recipe.result_weights,
                ctx.accounts.recent_blockhash.key(),
                crafting_record.timestamp,
            );
            
            // Update crafter stats
            let crafter_stats = &mut ctx.accounts.crafter_stats;
            crafter_stats.successful_crafts += 1;
            crafter_stats.experience_points += get_experience_points(ctx.accounts.recipe.difficulty);
            
            // Level up if enough experience points
            if crafter_stats.experience_points >= get_level_threshold(crafter_stats.experience_level) {
                crafter_stats.experience_level += 1;
            }
        } else {
            // Handle failed crafting
            // Could still mint a "failed experiment" token
            let crafter_stats = &mut ctx.accounts.crafter_stats;
            crafter_stats.failed_crafts += 1;
            crafter_stats.experience_points += get_experience_points(ctx.accounts.recipe.difficulty) / 2;
        }
        
        Ok(())
    }

    // Update crafting fee percentage
    pub fn update_fee_percentage(
        ctx: Context<UpdateConfig>,
        new_fee_percentage: u8,
    ) -> Result<()> {
        require!(new_fee_percentage <= 100, CraftingError::InvalidFeePercentage);
        
        let crafting_config = &mut ctx.accounts.crafting_config;
        crafting_config.fee_percentage = new_fee_percentage;
        
        Ok(())
    }

    // Pause or unpause crafting system
    pub fn set_pause_state(
        ctx: Context<UpdateConfig>,
        paused: bool,
    ) -> Result<()> {
        let crafting_config = &mut ctx.accounts.crafting_config;
        crafting_config.paused = paused;
        
        Ok(())
    }
}

// Helper functions (would be implementation details)
fn calculate_fee(difficulty: u8, fee_percentage: u8) -> u64 {
    let base_fee: u64 = 1_000_000; // 0.001 SOL in lamports
    let difficulty_multiplier = difficulty as u64;
    let fee_multiplier = fee_percentage as u64;
    
    base_fee.saturating_mul(difficulty_multiplier).saturating_mul(fee_multiplier) / 100
}

fn determine_crafting_success(base_success_rate: u8, crafter_level: u8, recent_blockhash: Pubkey, crafter: Pubkey) -> bool {
    // This is a simplified implementation
    // In a real contract, use a more sophisticated randomness source
    
    // Add level bonus (1% per level, up to 20%)
    let level_bonus = std::cmp::min(crafter_level, 20);
    let adjusted_success_rate = base_success_rate.saturating_add(level_bonus);
    
    // Generate a pseudo-random number using blockhash and crafter address
    let mut data = [0u8; 32];
    let blockhash_bytes = recent_blockhash.to_bytes();
    let crafter_bytes = crafter.to_bytes();
    
    for i in 0..32 {
        data[i] = blockhash_bytes[i] ^ crafter_bytes[i % 32];
    }
    
    // Use first byte as percentage (0-255, scale to 0-100)
    let roll = data[0] as u16 * 100 / 255;
    
    roll < adjusted_success_rate as u16
}

fn select_result_type(result_types: &Vec<Pubkey>, result_weights: &Vec<u8>, recent_blockhash: Pubkey, timestamp: i64) -> Pubkey {
    // This is a simplified implementation
    
    // Sum weights
    let total_weight: u16 = result_weights.iter().map(|&w| w as u16).sum();
    
    // Generate a pseudo-random number
    let mut data = [0u8; 32];
    let blockhash_bytes = recent_blockhash.to_bytes();
    let timestamp_bytes = timestamp.to_le_bytes();
    
    for i in 0..32 {
        data[i] = blockhash_bytes[i] ^ (if i < 8 { timestamp_bytes[i] } else { 0 });
    }
    
    // Use first two bytes as random value
    let roll = ((data[0] as u16) << 8 | data[1] as u16) % total_weight;
    
    // Select result based on weights
    let mut current_weight = 0;
    for i in 0..result_types.len() {
        current_weight += result_weights[i] as u16;
        if roll < current_weight {
            return result_types[i];
        }
    }
    
    // Fallback (should never happen)
    result_types[0]
}

fn get_experience_points(difficulty: u8) -> u64 {
    difficulty as u64 * 10
}

fn get_level_threshold(current_level: u8) -> u64 {
    (current_level as u64 + 1) * 1000
}

#[account]
pub struct CraftingConfig {
    pub authority: Pubkey,        // Admin authority
    pub fee_destination: Pubkey,  // Where crafting fees go
    pub fee_percentage: u8,       // Fee percentage (0-100)
    pub paused: bool,             // Whether crafting is paused
}

#[account]
pub struct CrafterStats {
    pub crafter: Pubkey,           // Crafter's address
    pub experience_points: u64,    // Total XP earned
    pub experience_level: u8,      // Current level
    pub successful_crafts: u64,    // Number of successful crafts
    pub failed_crafts: u64,        // Number of failed crafts
    pub created_at: i64,           // When this account was created
}

#[account]
pub struct CraftingRecord {
    pub crafter: Pubkey,           // Who performed the crafting
    pub recipe: Pubkey,            // Recipe used
    pub timestamp: i64,            // When crafting occurred
    pub materials_used: Vec<Pubkey>, // Material instances consumed
    pub success: bool,             // Whether crafting was successful
    pub result_type: Pubkey,       // Resulting item type (if successful)
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 128)]
    pub crafting_config: Account<'info, CraftingConfig>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub fee_destination: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Craft<'info> {
    #[account(init, payer = crafter, space = 8 + 256)]
    pub crafting_record: Account<'info, CraftingRecord>,
    
    pub crafting_config: Account<'info, CraftingConfig>,
    
    pub recipe: Account<'info, Recipe>,
    
    #[account(
        init_if_needed,
        payer = crafter,
        space = 8 + 128,
        seeds = [b"crafter-stats", crafter.key().as_ref()],
        bump
    )]
    pub crafter_stats: Account<'info, CrafterStats>,
    
    #[account(mut)]
    pub crafter: Signer<'info>,
    
    #[account(mut)]
    pub crafter_token: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub fee_destination_token: Account<'info, TokenAccount>,
    
    pub recent_blockhash: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(mut, has_one = authority @ CraftingError::UnauthorizedAccess)]
    pub crafting_config: Account<'info, CraftingConfig>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[error_code]
pub enum CraftingError {
    #[msg("Crafting system is currently paused")]
    CraftingPaused,
    
    #[msg("Recipe is not approved")]
    RecipeNotApproved,
    
    #[msg("Recipe is disabled")]
    RecipeDisabled,
    
    #[msg("Materials do not match recipe requirements")]
    MaterialMismatch,
    
    #[msg("Insufficient fee provided")]
    InsufficientFee,
    
    #[msg("Fee percentage must be between 0 and 100")]
    InvalidFeePercentage,
    
    #[msg("Unauthorized access")]
    UnauthorizedAccess,
}