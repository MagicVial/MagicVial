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
}

#[derive(Accounts)]
pub struct CreateRecipe<'info> {
    #[account(init, payer = creator, space = 8 + 1024)]
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

// Simple account to track admin status
#[account]
pub struct AuthorityType {
    pub authority: Pubkey,
    pub is_admin: bool,
}

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
} 