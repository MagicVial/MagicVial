use anchor_lang::prelude::*;

declare_id!("recXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

#[program]
pub mod magic_vial_recipe {
    use super::*;

    // Create a new recipe
    pub fn create_recipe(
        ctx: Context<CreateRecipe>,
        name: String,
        description: String,
        recipe_type: u8, // 1: Basic, 2: Advanced, 3: Community, 4: Legendary
        difficulty: u8,  // 1-100, higher is more difficult
        success_rate: u8, // Base success rate (1-100)
        uri: String,
        material_types: Vec<Pubkey>,
        material_amounts: Vec<u64>,
        result_types: Vec<Pubkey>,
        result_weights: Vec<u8>,
        is_secret: bool, // Whether this recipe is initially hidden (must be discovered)
        hints: Vec<String>, // Optional hints for discovery
    ) -> Result<()> {
        require!(material_types.len() == material_amounts.len(), RecipeError::InputMismatch);
        require!(result_types.len() == result_weights.len(), RecipeError::OutputMismatch);
        require!(!material_types.is_empty(), RecipeError::NoMaterials);
        require!(!result_types.is_empty(), RecipeError::NoResults);

        let recipe = &mut ctx.accounts.recipe;
        recipe.name = name;
        recipe.description = description;
        recipe.recipe_type = recipe_type;
        recipe.difficulty = difficulty;
        recipe.success_rate = success_rate;
        recipe.uri = uri;
        recipe.creator = ctx.accounts.creator.key();
        recipe.approved = ctx.accounts.creator.key() == ctx.accounts.authority.key();
        recipe.created_at = Clock::get()?.unix_timestamp;
        recipe.material_types = material_types;
        recipe.material_amounts = material_amounts;
        recipe.result_types = result_types;
        recipe.result_weights = result_weights;
        recipe.is_secret = is_secret;
        recipe.hints = hints;
        recipe.discoverers = Vec::new();
        recipe.times_crafted = 0;
        recipe.successful_crafts = 0;
        recipe.failed_crafts = 0;
        
        // Calculate discovery threshold based on recipe difficulty and type
        recipe.discovery_threshold = calculate_discovery_threshold(recipe_type, difficulty);

        Ok(())
    }

    // Discover a recipe
    pub fn discover_recipe(
        ctx: Context<DiscoverRecipe>,
        explorer_level: u8,
        material_combinations: Vec<Pubkey>,
    ) -> Result<()> {
        let recipe = &mut ctx.accounts.recipe;
        
        // Check if recipe is secret and not already discovered by this user
        require!(recipe.is_secret, RecipeError::RecipeNotSecret);
        require!(
            !recipe.discoverers.contains(&ctx.accounts.explorer.key()),
            RecipeError::AlreadyDiscovered
        );
        
        // Validate material combinations
        let discovery_score = calculate_discovery_score(
            explorer_level,
            &material_combinations,
            &recipe.material_types,
        );
        
        // Check if discovery score meets threshold
        require!(
            discovery_score >= recipe.discovery_threshold,
            RecipeError::DiscoveryFailed
        );
        
        // Record discoverer
        recipe.discoverers.push(ctx.accounts.explorer.key());
        
        // If this is first discovery, give a bonus
        if recipe.discoverers.len() == 1 {
            // In a real implementation, would award a special token or achievement
            // This would be done through a cross-program invocation
        }
        
        // Create discovery record
        let discovery_record = &mut ctx.accounts.discovery_record;
        discovery_record.explorer = ctx.accounts.explorer.key();
        discovery_record.recipe = ctx.accounts.recipe.key();
        discovery_record.timestamp = Clock::get()?.unix_timestamp;
        discovery_record.is_first = recipe.discoverers.len() == 1;
        
        Ok(())
    }

    // Approve a community-created recipe
    pub fn approve_recipe(
        ctx: Context<ApproveRecipe>,
    ) -> Result<()> {
        require!(!ctx.accounts.recipe.approved, RecipeError::AlreadyApproved);
        
        let recipe = &mut ctx.accounts.recipe;
        recipe.approved = true;
        
        Ok(())
    }

    // Disable a recipe (no longer available for crafting)
    pub fn disable_recipe(
        ctx: Context<DisableRecipe>,
    ) -> Result<()> {
        let recipe = &mut ctx.accounts.recipe;
        recipe.disabled = true;
        
        Ok(())
    }

    // Update recipe success rate (for balancing)
    pub fn update_success_rate(
        ctx: Context<UpdateRecipe>,
        new_success_rate: u8,
    ) -> Result<()> {
        require!(new_success_rate <= 100, RecipeError::InvalidSuccessRate);
        
        let recipe = &mut ctx.accounts.recipe;
        recipe.success_rate = new_success_rate;
        
        Ok(())
    }
    
    // Mark recipe as crafted (called from crafting program)
    pub fn record_crafting_attempt(
        ctx: Context<RecordCrafting>,
        success: bool,
    ) -> Result<()> {
        let recipe = &mut ctx.accounts.recipe;
        recipe.times_crafted += 1;
        
        if success {
            recipe.successful_crafts += 1;
        } else {
            recipe.failed_crafts += 1;
        }
        
        Ok(())
    }
    
    // Add a community hint to a recipe
    pub fn add_recipe_hint(
        ctx: Context<AddRecipeHint>,
        hint: String,
    ) -> Result<()> {
        require!(hint.len() <= 100, RecipeError::HintTooLong);
        
        let recipe = &mut ctx.accounts.recipe;
        
        // Check if user has discovered the recipe
        require!(
            recipe.discoverers.contains(&ctx.accounts.contributor.key()),
            RecipeError::NotDiscovered
        );
        
        // Add the hint
        recipe.hints.push(hint);
        
        Ok(())
    }
}

// Helper function to calculate discovery threshold
fn calculate_discovery_threshold(recipe_type: u8, difficulty: u8) -> u8 {
    let base_threshold = match recipe_type {
        1 => 30, // Basic recipes are easier to discover
        2 => 50, // Advanced recipes are moderately difficult
        3 => 40, // Community recipes
        4 => 70, // Legendary recipes are hardest to discover
        _ => 50, // Default
    };
    
    let difficulty_factor = difficulty.saturating_div(5); // Each 5 points of difficulty adds 1 to threshold
    
    base_threshold.saturating_add(difficulty_factor).min(95) // Cap at 95%
}

// Helper function to calculate discovery score from materials
fn calculate_discovery_score(
    explorer_level: u8,
    provided_materials: &Vec<Pubkey>,
    recipe_materials: &Vec<Pubkey>,
) -> u8 {
    // Base score based on explorer level
    let level_bonus = explorer_level.saturating_div(2); // 1 point per 2 levels
    
    // Calculate match percentage for materials
    let mut matched_materials = 0;
    
    for material in provided_materials {
        if recipe_materials.contains(material) {
            matched_materials += 1;
        }
    }
    
    // Calculate percentage of correct materials
    let mut match_score = if !recipe_materials.is_empty() {
        ((matched_materials as f32 / recipe_materials.len() as f32) * 100.0) as u8
    } else {
        0
    };
    
    // Bonus for providing exactly the right materials (no extras)
    if matched_materials == recipe_materials.len() && provided_materials.len() == recipe_materials.len() {
        match_score = match_score.saturating_add(10);
    }
    
    // Apply level bonus
    match_score.saturating_add(level_bonus)
}

#[account]
pub struct Recipe {
    pub name: String,               // Recipe name
    pub description: String,        // Recipe description
    pub recipe_type: u8,            // Recipe type/category
    pub difficulty: u8,             // Difficulty level
    pub success_rate: u8,           // Base success rate
    pub uri: String,                // Metadata URI
    pub creator: Pubkey,            // Recipe creator
    pub approved: bool,             // Whether recipe is approved
    pub disabled: bool,             // Whether recipe is disabled
    pub created_at: i64,            // Creation timestamp
    pub material_types: Vec<Pubkey>, // Required material types
    pub material_amounts: Vec<u64>, // Required material amounts
    pub result_types: Vec<Pubkey>,  // Possible result types
    pub result_weights: Vec<u8>,    // Probability weights for results
    pub is_secret: bool,            // Whether recipe is initially hidden
    pub hints: Vec<String>,         // Discovery hints
    pub discoverers: Vec<Pubkey>,   // Users who discovered this recipe
    pub discovery_threshold: u8,    // Threshold score needed for discovery
    pub times_crafted: u64,         // Total times this recipe was used
    pub successful_crafts: u64,     // Successful crafting attempts
    pub failed_crafts: u64,         // Failed crafting attempts
}

#[account]
pub struct RecipeDiscoveryRecord {
    pub explorer: Pubkey,           // Who discovered the recipe
    pub recipe: Pubkey,             // Which recipe was discovered
    pub timestamp: i64,             // When it was discovered
    pub is_first: bool,             // Whether this was the first discovery
}

#[derive(Accounts)]
pub struct CreateRecipe<'info> {
    #[account(init, payer = creator, space = 8 + 2048)]
    pub recipe: Account<'info, Recipe>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    // Authority account is used to check if the creator is also
    // the authority (for auto-approval)
    pub authority: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct DiscoverRecipe<'info> {
    #[account(mut)]
    pub recipe: Account<'info, Recipe>,
    
    #[account(init, payer = explorer, space = 8 + 128)]
    pub discovery_record: Account<'info, RecipeDiscoveryRecord>,
    
    #[account(mut)]
    pub explorer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ApproveRecipe<'info> {
    #[account(mut)]
    pub recipe: Account<'info, Recipe>,
    
    #[account(mut, constraint = authority.key() != recipe.creator @ RecipeError::SelfApproval)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct DisableRecipe<'info> {
    #[account(mut)]
    pub recipe: Account<'info, Recipe>,
    
    #[account(mut, constraint = authority.key() == recipe.creator || authority_type.is_admin)]
    pub authority: Signer<'info>,
    
    // Account to check if the authority has admin privileges
    pub authority_type: Account<'info, AuthorityType>,
}

#[derive(Accounts)]
pub struct UpdateRecipe<'info> {
    #[account(mut)]
    pub recipe: Account<'info, Recipe>,
    
    #[account(mut, constraint = authority.key() == recipe.creator || authority_type.is_admin)]
    pub authority: Signer<'info>,
    
    // Account to check if the authority has admin privileges
    pub authority_type: Account<'info, AuthorityType>,
}

#[derive(Accounts)]
pub struct RecordCrafting<'info> {
    #[account(mut)]
    pub recipe: Account<'info, Recipe>,
    
    // Only the crafting program can call this
    #[account(constraint = authority.key() == crafting_program_id @ RecipeError::UnauthorizedCaller)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct AddRecipeHint<'info> {
    #[account(mut)]
    pub recipe: Account<'info, Recipe>,
    
    #[account(mut)]
    pub contributor: Signer<'info>,
}

// Simple account to track admin status
#[account]
pub struct AuthorityType {
    pub authority: Pubkey,
    pub is_admin: bool,
}

// Keep track of all known crafting program IDs
const crafting_program_id: Pubkey = pubkey!("craXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

#[error_code]
pub enum RecipeError {
    #[msg("Material types and amounts must have the same length")]
    InputMismatch,
    
    #[msg("Result types and weights must have the same length")]
    OutputMismatch,
    
    #[msg("Recipe must have at least one material")]
    NoMaterials,
    
    #[msg("Recipe must have at least one possible result")]
    NoResults,
    
    #[msg("Recipe is already approved")]
    AlreadyApproved,
    
    #[msg("Creators cannot approve their own recipes")]
    SelfApproval,
    
    #[msg("Success rate must be between 0 and 100")]
    InvalidSuccessRate,
    
    #[msg("Recipe is not secret and cannot be discovered")]
    RecipeNotSecret,
    
    #[msg("You have already discovered this recipe")]
    AlreadyDiscovered,
    
    #[msg("Discovery attempt failed")]
    DiscoveryFailed,
    
    #[msg("Only the crafting program can call this instruction")]
    UnauthorizedCaller,
    
    #[msg("Recipe hint is too long")]
    HintTooLong,
    
    #[msg("You have not discovered this recipe yet")]
    NotDiscovered,
} 