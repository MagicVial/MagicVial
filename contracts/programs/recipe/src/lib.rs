use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};
use solana_program::sysvar::clock::Clock;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod recipe {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        authority_bump: u8,
    ) -> Result<()> {
        let recipe_authority = &mut ctx.accounts.recipe_authority;
        recipe_authority.authority = ctx.accounts.authority.key();
        recipe_authority.bump = authority_bump;
        
        msg!("Recipe program initialized");
        
        Ok(())
    }

    pub fn create_recipe(
        ctx: Context<CreateRecipe>,
        name: String,
        description: String,
        difficulty: RecipeDifficulty,
        crafting_time: u64,
        success_rate: u8,
        ingredients: Vec<Ingredient>,
        result_name: String,
        result_description: String,
        result_rarity: String,
    ) -> Result<()> {
        // Validate inputs
        require!(!name.is_empty(), RecipeError::EmptyName);
        require!(!description.is_empty(), RecipeError::EmptyDescription);
        require!(crafting_time > 0, RecipeError::InvalidCraftingTime);
        require!(success_rate > 0 && success_rate <= 100, RecipeError::InvalidSuccessRate);
        require!(!ingredients.is_empty(), RecipeError::NoIngredients);
        require!(!result_name.is_empty(), RecipeError::EmptyResultName);
        require!(!result_description.is_empty(), RecipeError::EmptyResultDescription);
        require!(!result_rarity.is_empty(), RecipeError::EmptyResultRarity);
        
        // Further validate ingredients
        let mut total_materials = 0;
        for ingredient in &ingredients {
            require!(ingredient.quantity > 0, RecipeError::InvalidIngredientQuantity);
            total_materials += ingredient.quantity;
        }
        
        require!(total_materials > 0, RecipeError::NoMaterials);
        require!(ingredients.len() <= 10, RecipeError::TooManyIngredients);
        
        // Create the recipe account
        let recipe = &mut ctx.accounts.recipe;
        recipe.name = name;
        recipe.description = description;
        recipe.difficulty = difficulty;
        recipe.crafting_time = crafting_time;
        recipe.success_rate = success_rate;
        recipe.creator = ctx.accounts.creator.key();
        recipe.is_approved = false; // Recipes need approval before they can be used
        recipe.is_enabled = true;
        recipe.created_at = Clock::get()?.unix_timestamp;
        recipe.updated_at = recipe.created_at;
        recipe.ingredients = ingredients;
        recipe.result_name = result_name;
        recipe.result_description = result_description;
        recipe.result_rarity = result_rarity;
        recipe.times_crafted = 0;
        
        msg!("Recipe created successfully: {}", recipe.name);
        
        Ok(())
    }
    
    pub fn approve_recipe(
        ctx: Context<ApproveRecipe>,
        is_approved: bool,
    ) -> Result<()> {
        // Only the recipe authority can approve recipes
        let recipe = &mut ctx.accounts.recipe;
        
        recipe.is_approved = is_approved;
        recipe.updated_at = Clock::get()?.unix_timestamp;
        
        msg!("Recipe approval status updated: {}", is_approved);
        
        Ok(())
    }
    
    pub fn set_recipe_enabled(
        ctx: Context<UpdateRecipeStatus>,
        is_enabled: bool,
    ) -> Result<()> {
        let recipe = &mut ctx.accounts.recipe;
        
        // Only the recipe creator or authority can update the status
        require!(
            recipe.creator == ctx.accounts.authority.key() || 
            ctx.accounts.recipe_authority.authority == ctx.accounts.authority.key(),
            RecipeError::Unauthorized
        );
        
        recipe.is_enabled = is_enabled;
        recipe.updated_at = Clock::get()?.unix_timestamp;
        
        msg!("Recipe status updated: enabled = {}", is_enabled);
        
        Ok(())
    }
    
    pub fn start_crafting(
        ctx: Context<StartCrafting>,
    ) -> Result<()> {
        let recipe = &ctx.accounts.recipe;
        let crafting = &mut ctx.accounts.crafting;
        
        // Validate recipe is approved and enabled
        require!(recipe.is_approved, RecipeError::RecipeNotApproved);
        require!(recipe.is_enabled, RecipeError::RecipeDisabled);
        
        // Initialize crafting session
        crafting.recipe = recipe.key();
        crafting.crafter = ctx.accounts.crafter.key();
        crafting.start_time = Clock::get()?.unix_timestamp;
        crafting.estimated_completion_time = crafting.start_time + recipe.crafting_time as i64;
        crafting.status = CraftingStatus::InProgress;
        
        // Increment recipe usage counter
        // Need to get a mutable reference to recipe
        let mutable_recipe = &mut ctx.accounts.recipe;
        mutable_recipe.times_crafted += 1;
        
        msg!("Crafting started for recipe: {}", recipe.name);
        
        Ok(())
    }
    
    pub fn complete_crafting(
        ctx: Context<CompleteCrafting>,
    ) -> Result<()> {
        let crafting = &mut ctx.accounts.crafting;
        let recipe = &ctx.accounts.recipe;
        
        // Validate crafting is in progress
        require!(
            crafting.status == CraftingStatus::InProgress, 
            RecipeError::InvalidCraftingStatus
        );
        
        // Validate crafter is the one who started crafting
        require!(
            crafting.crafter == ctx.accounts.crafter.key(),
            RecipeError::Unauthorized
        );
        
        // Validate crafting time has passed
        let current_time = Clock::get()?.unix_timestamp;
        require!(
            current_time >= crafting.estimated_completion_time,
            RecipeError::CraftingNotReady
        );
        
        // Determine success or failure based on recipe success rate
        // In a real implementation, this would use a verifiable random function
        // For this example, we'll use a simple hash of various timestamps
        let crafting_seed = (current_time.wrapping_mul(recipe.times_crafted as i64)) as u64;
        let random_value = crafting_seed % 100;
        let success = random_value < recipe.success_rate as u64;
        
        // Update crafting session
        crafting.completion_time = Some(current_time);
        crafting.status = if success {
            CraftingStatus::Completed
        } else {
            CraftingStatus::Failed
        };
        
        msg!(
            "Crafting {} for recipe: {}",
            if success { "succeeded" } else { "failed" },
            recipe.name
        );
        
        // In a complete implementation, this would mint the result token if successful
        
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(authority_bump: u8)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + RecipeAuthority::LEN,
        seeds = [b"recipe_authority".as_ref()],
        bump = authority_bump,
    )]
    pub recipe_authority: Account<'info, RecipeAuthority>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(
    name: String,
    description: String,
    difficulty: RecipeDifficulty,
    crafting_time: u64,
    success_rate: u8,
    ingredients: Vec<Ingredient>,
    result_name: String,
    result_description: String,
    result_rarity: String,
)]
pub struct CreateRecipe<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Recipe::LEN + 
                (ingredients.len() * Ingredient::LEN) +
                name.len() + description.len() + 
                result_name.len() + result_description.len() + result_rarity.len() + 
                200, // extra space for future fields
    )]
    pub recipe: Account<'info, Recipe>,
    
    #[account(
        seeds = [b"recipe_authority".as_ref()],
        bump = recipe_authority.bump,
    )]
    pub recipe_authority: Account<'info, RecipeAuthority>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ApproveRecipe<'info> {
    #[account(mut)]
    pub recipe: Account<'info, Recipe>,
    
    #[account(
        seeds = [b"recipe_authority".as_ref()],
        bump = recipe_authority.bump,
        constraint = recipe_authority.authority == authority.key() @ RecipeError::Unauthorized,
    )]
    pub recipe_authority: Account<'info, RecipeAuthority>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateRecipeStatus<'info> {
    #[account(mut)]
    pub recipe: Account<'info, Recipe>,
    
    #[account(
        seeds = [b"recipe_authority".as_ref()],
        bump = recipe_authority.bump,
    )]
    pub recipe_authority: Account<'info, RecipeAuthority>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StartCrafting<'info> {
    #[account(
        init,
        payer = crafter,
        space = 8 + Crafting::LEN,
        seeds = [b"crafting".as_ref(), recipe.key().as_ref(), crafter.key().as_ref()],
        bump,
    )]
    pub crafting: Account<'info, Crafting>,
    
    #[account(mut)]
    pub recipe: Account<'info, Recipe>,
    
    #[account(mut)]
    pub crafter: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CompleteCrafting<'info> {
    #[account(
        mut,
        seeds = [b"crafting".as_ref(), recipe.key().as_ref(), crafter.key().as_ref()],
        bump,
    )]
    pub crafting: Account<'info, Crafting>,
    
    #[account(
        constraint = crafting.recipe == recipe.key() @ RecipeError::InvalidRecipe,
    )]
    pub recipe: Account<'info, Recipe>,
    
    #[account(mut)]
    pub crafter: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
pub struct RecipeAuthority {
    pub authority: Pubkey,
    pub bump: u8,
}

impl RecipeAuthority {
    pub const LEN: usize = 32 + 1; // pubkey + bump
}

#[account]
pub struct Recipe {
    pub name: String,
    pub description: String,
    pub difficulty: RecipeDifficulty,
    pub ingredients: Vec<Ingredient>,
    pub crafting_time: u64, // in seconds
    pub success_rate: u8,   // percentage, 1-100
    pub creator: Pubkey,
    pub is_approved: bool,
    pub is_enabled: bool,
    pub created_at: i64,
    pub updated_at: i64,
    pub result_name: String,
    pub result_description: String,
    pub result_rarity: String,
    pub times_crafted: u64,
}

impl Recipe {
    pub const LEN: usize = 4 + // string prefix for name
                         4 + // string prefix for description
                         1 + // difficulty enum
                         4 + // vec prefix for ingredients
                         8 + // crafting_time
                         1 + // success_rate
                         32 + // creator
                         1 + // is_approved
                         1 + // is_enabled
                         8 + // created_at
                         8 + // updated_at
                         4 + // string prefix for result_name
                         4 + // string prefix for result_description
                         4 + // string prefix for result_rarity
                         8;  // times_crafted
}

#[account]
pub struct Crafting {
    pub recipe: Pubkey,
    pub crafter: Pubkey,
    pub start_time: i64,
    pub estimated_completion_time: i64,
    pub completion_time: Option<i64>,
    pub status: CraftingStatus,
}

impl Crafting {
    pub const LEN: usize = 32 + // recipe
                          32 + // crafter
                          8 +  // start_time
                          8 +  // estimated_completion_time
                          9 +  // completion_time (Option<i64>)
                          1;   // status enum
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub struct Ingredient {
    pub material_mint: Pubkey,
    pub quantity: u64,
}

impl Ingredient {
    pub const LEN: usize = 32 + // material_mint
                           8;   // quantity
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum RecipeDifficulty {
    Beginner,
    Intermediate,
    Advanced,
    Master,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum CraftingStatus {
    InProgress,
    Completed,
    Failed,
    Cancelled,
}

#[error_code]
pub enum RecipeError {
    #[msg("Name cannot be empty")]
    EmptyName,
    
    #[msg("Description cannot be empty")]
    EmptyDescription,
    
    #[msg("Crafting time must be greater than zero")]
    InvalidCraftingTime,
    
    #[msg("Success rate must be between 1 and 100")]
    InvalidSuccessRate,
    
    #[msg("No ingredients specified")]
    NoIngredients,
    
    #[msg("Result name cannot be empty")]
    EmptyResultName,
    
    #[msg("Result description cannot be empty")]
    EmptyResultDescription,
    
    #[msg("Result rarity cannot be empty")]
    EmptyResultRarity,
    
    #[msg("Ingredient quantity must be greater than zero")]
    InvalidIngredientQuantity,
    
    #[msg("Total materials must be greater than zero")]
    NoMaterials,
    
    #[msg("Too many ingredients, maximum is 10")]
    TooManyIngredients,
    
    #[msg("Recipe is not approved")]
    RecipeNotApproved,
    
    #[msg("Recipe is disabled")]
    RecipeDisabled,
    
    #[msg("Invalid crafting status")]
    InvalidCraftingStatus,
    
    #[msg("Crafting is not ready for completion")]
    CraftingNotReady,
    
    #[msg("Invalid recipe")]
    InvalidRecipe,
    
    #[msg("Unauthorized access")]
    Unauthorized,
} 