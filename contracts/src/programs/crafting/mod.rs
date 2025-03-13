use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

// Import our other program interfaces
use crate::material::{MaterialInstance, MaterialTypeInfo, ConsumeMaterial, AttributeEffect};
use crate::recipe::{Recipe, RecordCrafting};

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
        guild_boost: Option<u8>, // Optional boost from guild membership
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
        
        // Load material data for success calculation (simplified for now)
        // In reality, would use CPI to verify materials and their attributes
        let material_bonus = get_material_bonus(&material_instances);
        
        // Calculate crafting success based on recipe success rate and multiple factors
        let success_factors = SuccessFactors {
            base_rate: ctx.accounts.recipe.success_rate,
            crafter_level: ctx.accounts.crafter_stats.experience_level,
            crafter_streak: ctx.accounts.crafter_stats.success_streak,
            material_bonus, 
            guild_boost,
            recipe_attempts: ctx.accounts.recipe.times_crafted, // Familiarity bonus
            time_of_day_bonus: get_time_of_day_bonus(),
            is_seasonal_event: is_seasonal_event_active(),
        };
        
        let success_rate = calculate_success_rate(success_factors);
        
        // Generate randomness for success determination
        let success = determine_crafting_success(
            success_rate,
            ctx.accounts.recent_blockhash.key(),
            ctx.accounts.crafter.key(),
            Clock::get()?.unix_timestamp,
        );
        
        // Create the crafting record
        let crafting_record = &mut ctx.accounts.crafting_record;
        crafting_record.crafter = ctx.accounts.crafter.key();
        crafting_record.recipe = ctx.accounts.recipe.key();
        crafting_record.timestamp = Clock::get()?.unix_timestamp;
        crafting_record.materials_used = material_instances;
        crafting_record.success = success;
        crafting_record.calculated_success_rate = success_rate;
        
        // Update recipe statistics (cross-program invocation)
        // In reality, would use CPI to call record_crafting_attempt on the recipe program
        
        // Update crafter stats 
        let crafter_stats = &mut ctx.accounts.crafter_stats;
        
        if success {
            // If successful, determine the result type based on weighted probabilities
            // This is simplified and would need cross-program invocation to get result type data
            crafting_record.result_type = select_result_type(
                &ctx.accounts.recipe.result_types,
                &ctx.accounts.recipe.result_weights,
                ctx.accounts.recent_blockhash.key(),
                crafting_record.timestamp,
                crafter_stats.experience_level,
            );
            
            // Determine rarity roll with potential critical success
            let (rarity_level, is_critical) = determine_result_rarity(
                ctx.accounts.recent_blockhash.key(),
                ctx.accounts.crafter.key(),
                crafting_record.timestamp + 1, // Different seed than success determination
                crafter_stats.experience_level,
                ctx.accounts.recipe.difficulty,
            );
            
            crafting_record.result_rarity = rarity_level;
            crafting_record.is_critical_success = is_critical;
            
            // Update crafter stats
            crafter_stats.successful_crafts += 1;
            crafter_stats.success_streak += 1;
            crafter_stats.experience_points += get_experience_points(
                ctx.accounts.recipe.difficulty, 
                true, 
                is_critical,
            );
            
            // Level up if enough experience points
            if crafter_stats.experience_points >= get_level_threshold(crafter_stats.experience_level) {
                crafter_stats.experience_level += 1;
                crafter_stats.success_streak = 0; // Reset streak on level up as a balance mechanic
            }
        } else {
            // Handle failed crafting
            // Could still mint a "failed experiment" token
            // Determine if this is an "interesting failure" worth keeping
            let interesting_failure = determine_interesting_failure(
                ctx.accounts.recent_blockhash.key(),
                ctx.accounts.crafter.key(),
                crafting_record.timestamp + 2, // Different seed
                ctx.accounts.recipe.difficulty,
            );
            
            crafting_record.is_interesting_failure = interesting_failure;
            
            // Update crafter stats
            crafter_stats.failed_crafts += 1;
            crafter_stats.success_streak = 0; // Reset streak on failure
            crafter_stats.experience_points += get_experience_points(
                ctx.accounts.recipe.difficulty, 
                false, 
                false,
            );
        }
        
        // Record crafting attempt for guild achievements if in a guild
        if let Some(guild_id) = crafter_stats.guild {
            // In reality, would use CPI to update guild stats
            crafting_record.guild = Some(guild_id);
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
    
    // Join a guild
    pub fn join_guild(
        ctx: Context<GuildMembership>,
        guild_id: Pubkey,
    ) -> Result<()> {
        let crafter_stats = &mut ctx.accounts.crafter_stats;
        crafter_stats.guild = Some(guild_id);
        
        Ok(())
    }
    
    // Leave current guild
    pub fn leave_guild(
        ctx: Context<GuildMembership>,
    ) -> Result<()> {
        let crafter_stats = &mut ctx.accounts.crafter_stats;
        require!(crafter_stats.guild.is_some(), CraftingError::NotInGuild);
        
        crafter_stats.guild = None;
        
        Ok(())
    }
    
    // Start a seasonal event
    pub fn start_seasonal_event(
        ctx: Context<ManageSeasonalEvent>,
        event_name: String,
        description: String,
        duration_hours: u16,
        success_rate_bonus: u8,
    ) -> Result<()> {
        require!(success_rate_bonus <= 25, CraftingError::InvalidBonus);
        
        let seasonal_event = &mut ctx.accounts.seasonal_event;
        seasonal_event.name = event_name;
        seasonal_event.description = description;
        seasonal_event.start_time = Clock::get()?.unix_timestamp;
        seasonal_event.end_time = Clock::get()?.unix_timestamp + (duration_hours as i64 * 3600);
        seasonal_event.success_rate_bonus = success_rate_bonus;
        seasonal_event.active = true;
        
        Ok(())
    }
    
    // End a seasonal event early
    pub fn end_seasonal_event(
        ctx: Context<ManageSeasonalEvent>,
    ) -> Result<()> {
        let seasonal_event = &mut ctx.accounts.seasonal_event;
        seasonal_event.active = false;
        seasonal_event.end_time = Clock::get()?.unix_timestamp;
        
        Ok(())
    }
}

// Success factors for crafting
struct SuccessFactors {
    base_rate: u8,           // Base success rate from recipe
    crafter_level: u8,       // Crafter's experience level
    crafter_streak: u16,     // Consecutive successful crafts
    material_bonus: u8,      // Bonus from material attributes
    guild_boost: Option<u8>, // Optional boost from guild membership
    recipe_attempts: u64,    // How many times this recipe has been crafted globally
    time_of_day_bonus: u8,   // Bonus based on time of day
    is_seasonal_event: bool, // Whether a seasonal event is active
}

// Helper functions (would be implementation details)
fn calculate_fee(difficulty: u8, fee_percentage: u8) -> u64 {
    let base_fee: u64 = 1_000_000; // 0.001 SOL in lamports
    let difficulty_multiplier = difficulty as u64;
    let fee_multiplier = fee_percentage as u64;
    
    base_fee.saturating_mul(difficulty_multiplier).saturating_mul(fee_multiplier) / 100
}

fn get_material_bonus(material_instances: &Vec<Pubkey>) -> u8 {
    // In a real implementation, would use CPI to query material attributes
    // For now, just return a placeholder value
    5 // 5% bonus
}

fn get_time_of_day_bonus() -> u8 {
    // In a real implementation, would calculate based on current time
    // For now, just return a placeholder value
    2 // 2% bonus
}

fn is_seasonal_event_active() -> bool {
    // In a real implementation, would query for active seasonal events
    // For now, just return a placeholder value
    false
}

fn calculate_success_rate(factors: SuccessFactors) -> u8 {
    // Start with base rate
    let mut success_rate = factors.base_rate;
    
    // Add level bonus (1% per level, up to 20%)
    let level_bonus = std::cmp::min(factors.crafter_level, 20);
    success_rate = success_rate.saturating_add(level_bonus);
    
    // Add streak bonus (0.5% per streak, up to 10%)
    let streak_bonus = std::cmp::min(factors.crafter_streak / 2, 10) as u8;
    success_rate = success_rate.saturating_add(streak_bonus);
    
    // Add material attribute bonus
    success_rate = success_rate.saturating_add(factors.material_bonus);
    
    // Add guild boost if applicable
    if let Some(boost) = factors.guild_boost {
        success_rate = success_rate.saturating_add(boost);
    }
    
    // Add familiarity bonus (recipe attempts)
    // 0.1% per attempt, up to 5%
    let familiarity_bonus = std::cmp::min((factors.recipe_attempts / 10) as u8, 5);
    success_rate = success_rate.saturating_add(familiarity_bonus);
    
    // Add time of day bonus
    success_rate = success_rate.saturating_add(factors.time_of_day_bonus);
    
    // Add seasonal event bonus
    if factors.is_seasonal_event {
        success_rate = success_rate.saturating_add(10); // 10% bonus during events
    }
    
    // Cap at 95% to always leave some chance of failure
    std::cmp::min(success_rate, 95)
}

fn determine_crafting_success(success_rate: u8, recent_blockhash: Pubkey, crafter: Pubkey, timestamp: i64) -> bool {
    // Generate a pseudo-random number using blockhash, crafter address, and timestamp
    let mut data = [0u8; 32];
    let blockhash_bytes = recent_blockhash.to_bytes();
    let crafter_bytes = crafter.to_bytes();
    let timestamp_bytes = timestamp.to_le_bytes();
    
    for i in 0..32 {
        data[i] = blockhash_bytes[i] ^ 
                 crafter_bytes[i % 32] ^ 
                 (if i < 8 { timestamp_bytes[i] } else { 0 });
    }
    
    // Use first byte as percentage (0-255, scale to 0-100)
    let roll = data[0] as u16 * 100 / 255;
    
    roll < success_rate as u16
}

fn select_result_type(result_types: &Vec<Pubkey>, result_weights: &Vec<u8>, recent_blockhash: Pubkey, timestamp: i64, crafter_level: u8) -> Pubkey {
    // Sum weights
    let total_weight: u16 = result_weights.iter().map(|&w| w as u16).sum();
    
    // Generate a pseudo-random number
    let mut data = [0u8; 32];
    let blockhash_bytes = recent_blockhash.to_bytes();
    let timestamp_bytes = timestamp.to_le_bytes();
    let level_bytes = [crafter_level, 0, 0, 0, 0, 0, 0, 0];
    
    for i in 0..32 {
        data[i] = blockhash_bytes[i] ^ 
                 (if i < 8 { timestamp_bytes[i] } else { 0 }) ^
                 (if i < 8 { level_bytes[i] } else { 0 });
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

fn determine_result_rarity(
    recent_blockhash: Pubkey, 
    crafter: Pubkey, 
    timestamp: i64, 
    crafter_level: u8,
    recipe_difficulty: u8,
) -> (u8, bool) {
    // Generate pseudo-random bytes
    let mut data = [0u8; 32];
    let blockhash_bytes = recent_blockhash.to_bytes();
    let crafter_bytes = crafter.to_bytes();
    let timestamp_bytes = timestamp.to_le_bytes();
    
    for i in 0..32 {
        data[i] = blockhash_bytes[i] ^ 
                 crafter_bytes[i % 32] ^ 
                 (if i < 8 { timestamp_bytes[i] } else { 0 });
    }
    
    // Use different parts of the random data for different calculations
    
    // Determine if it's a critical success (1% chance + 0.1% per level)
    let critical_threshold = 10 + crafter_level;
    let critical_roll = data[2]; // 0-255
    let is_critical = critical_roll < critical_threshold;
    
    // Determine rarity (1-5)
    // Base chance for each rarity:
    // 1: 40%, 2: 30%, 3: 20%, 4: 9%, 5: 1%
    
    // Higher crafter level and recipe difficulty increase chances of higher rarity
    // Level gives up to +10% chance of better rarity
    // Difficulty adjusts base chances
    
    let level_bonus = crafter_level.saturating_div(10); // 0-10% bonus
    let rarity_roll = data[3] as u16; // 0-255
    
    // Critical success always gives at least rarity 3
    if is_critical {
        // For criticals: rarity 3: 50%, rarity 4: 40%, rarity 5: 10%
        if rarity_roll < 128 {
            return (3, true);
        } else if rarity_roll < 230 {
            return (4, true);
        } else {
            return (5, true);
        }
    }
    
    // Normal rarity distribution
    let adjusted_roll = rarity_roll.saturating_add(level_bonus as u16);
    
    // Adjust thresholds based on recipe difficulty (harder recipes have better rewards)
    let difficulty_factor = recipe_difficulty.saturating_div(20); // 0-5 adjustment
    
    if adjusted_roll < (102 - difficulty_factor as u16) { // ~40% - difficulty adjustment
        return (1, false);
    } else if adjusted_roll < (179 - difficulty_factor as u16) { // ~30% - difficulty adjustment
        return (2, false);
    } else if adjusted_roll < (230 - difficulty_factor as u16) { // ~20% - difficulty adjustment
        return (3, false);
    } else if adjusted_roll < (253 - difficulty_factor as u16) { // ~9% - difficulty adjustment
        return (4, false);
    } else {
        return (5, false); // ~1% + difficulty adjustment
    }
}

fn determine_interesting_failure(
    recent_blockhash: Pubkey, 
    crafter: Pubkey, 
    timestamp: i64, 
    recipe_difficulty: u8,
) -> bool {
    // Generate pseudo-random bytes
    let mut data = [0u8; 32];
    let blockhash_bytes = recent_blockhash.to_bytes();
    let crafter_bytes = crafter.to_bytes();
    let timestamp_bytes = timestamp.to_le_bytes();
    
    for i in 0..32 {
        data[i] = blockhash_bytes[i] ^ 
                 crafter_bytes[i % 32] ^ 
                 (if i < 8 { timestamp_bytes[i] } else { 0 });
    }
    
    // Higher difficulty increases chance of interesting failure
    // Base 5% chance, +0.5% per difficulty point
    let interesting_threshold = 13 + (recipe_difficulty / 2);
    let roll = data[4];
    
    roll < interesting_threshold
}

fn get_experience_points(difficulty: u8, success: bool, critical: bool) -> u64 {
    let base_xp = difficulty as u64 * 10;
    
    if !success {
        // Failed attempts give half XP
        return base_xp / 2;
    }
    
    if critical {
        // Critical successes give 50% bonus XP
        return base_xp + (base_xp / 2);
    }
    
    base_xp
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
    pub guild: Option<Pubkey>,     // Guild membership (if any)
    pub success_streak: u16,       // Current streak of successful crafts
}

#[account]
pub struct CraftingRecord {
    pub crafter: Pubkey,           // Who performed the crafting
    pub recipe: Pubkey,            // Recipe used
    pub timestamp: i64,            // When crafting occurred
    pub materials_used: Vec<Pubkey>, // Material instances consumed
    pub success: bool,             // Whether crafting was successful
    pub result_type: Pubkey,       // Resulting item type (if successful)
    pub result_rarity: u8,         // Rarity of result (1-5)
    pub is_critical_success: bool, // Whether this was a critical success
    pub is_interesting_failure: bool, // Whether a failed craft produced something
    pub calculated_success_rate: u8, // What the final success rate was
    pub guild: Option<Pubkey>,     // Guild affiliation during crafting
}

#[account]
pub struct SeasonalEvent {
    pub name: String,             // Event name
    pub description: String,      // Event description 
    pub start_time: i64,          // When event started
    pub end_time: i64,            // When event ends
    pub success_rate_bonus: u8,   // Success rate bonus during event
    pub active: bool,             // Whether event is active
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
    #[account(init, payer = crafter, space = 8 + 512)]
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

#[derive(Accounts)]
pub struct GuildMembership<'info> {
    #[account(
        mut,
        seeds = [b"crafter-stats", crafter.key().as_ref()],
        bump
    )]
    pub crafter_stats: Account<'info, CrafterStats>,
    
    #[account(mut)]
    pub crafter: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ManageSeasonalEvent<'info> {
    #[account(init_if_needed, payer = authority, space = 8 + 512)]
    pub seasonal_event: Account<'info, SeasonalEvent>,
    
    pub crafting_config: Account<'info, CraftingConfig>,
    
    #[account(mut, constraint = authority.key() == crafting_config.authority @ CraftingError::UnauthorizedAccess)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
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
    
    #[msg("Not currently in a guild")]
    NotInGuild,
    
    #[msg("Success rate bonus cannot exceed 25")]
    InvalidBonus,
}