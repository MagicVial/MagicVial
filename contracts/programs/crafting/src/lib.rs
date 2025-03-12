use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use solana_program::sysvar::clock::Clock;
use material_nft::program::MaterialNft as MaterialNftProgram;
use material_nft::cpi::accounts::MintMaterial;
use recipe::program::Recipe as RecipeProgram;
use recipe::cpi::accounts::{CompleteCrafting, StartCrafting};
use recipe::CraftingStatus;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod crafting {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        authority_bump: u8,
    ) -> Result<()> {
        let crafting_authority = &mut ctx.accounts.crafting_authority;
        crafting_authority.authority = ctx.accounts.authority.key();
        crafting_authority.bump = authority_bump;
        
        msg!("Crafting system initialized");
        
        Ok(())
    }

    pub fn start_crafting(
        ctx: Context<StartCraftingProcess>,
        recipe_id: Pubkey,
    ) -> Result<()> {
        // Call to the recipe program to start crafting
        let cpi_program = ctx.accounts.recipe_program.to_account_info();
        let cpi_accounts = StartCrafting {
            crafting: ctx.accounts.recipe_crafting.to_account_info(),
            recipe: ctx.accounts.recipe.to_account_info(),
            crafter: ctx.accounts.crafter.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        };
        
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        recipe::cpi::start_crafting(cpi_ctx)?;
        
        // Create local crafting record
        let crafting_record = &mut ctx.accounts.crafting_record;
        crafting_record.recipe = recipe_id;
        crafting_record.recipe_crafting = ctx.accounts.recipe_crafting.key();
        crafting_record.crafter = ctx.accounts.crafter.key();
        crafting_record.start_time = Clock::get()?.unix_timestamp;
        crafting_record.status = CraftingStatus::InProgress;
        
        // Store input materials for verification during completion
        for material_input in ctx.remaining_accounts.chunks(2) {
            let material_mint = material_input[0].key();
            let material_amount = material_input[1].key().to_bytes(); // Hacky way to pass amount
            let amount = u64::from_le_bytes(material_amount[0..8].try_into().unwrap());
            
            crafting_record.input_materials.push(MaterialInput {
                material_mint,
                amount,
            });
        }
        
        msg!("Crafting process started for recipe: {}", recipe_id);
        
        Ok(())
    }
    
    pub fn verify_materials(
        ctx: Context<VerifyMaterials>,
    ) -> Result<()> {
        let crafting_record = &mut ctx.accounts.crafting_record;
        
        // Ensure crafting is in progress
        require!(
            crafting_record.status == CraftingStatus::InProgress,
            CraftingError::InvalidCraftingStatus
        );
        
        // Check all required materials are present
        let mut remaining_materials = crafting_record.input_materials.clone();
        
        for material_token in ctx.remaining_accounts.chunks(2) {
            let material_mint = material_token[0].key();
            let material_token_account = &material_token[1];
            
            // Find the material in our requirements
            if let Some(pos) = remaining_materials.iter().position(|m| m.material_mint == material_mint) {
                // Verify the token account belongs to the crafter
                let token_account = Account::<TokenAccount>::try_from(material_token_account)?;
                require!(
                    token_account.owner == ctx.accounts.crafter.key(),
                    CraftingError::InvalidTokenAccount
                );
                
                // Verify sufficient balance
                require!(
                    token_account.amount >= remaining_materials[pos].amount,
                    CraftingError::InsufficientMaterialBalance
                );
                
                // Remove the verified material
                remaining_materials.remove(pos);
            }
        }
        
        // Ensure all materials were verified
        require!(
            remaining_materials.is_empty(),
            CraftingError::MissingMaterials
        );
        
        crafting_record.materials_verified = true;
        
        msg!("Materials verified for crafting: {}", crafting_record.recipe);
        
        Ok(())
    }
    
    pub fn consume_materials(
        ctx: Context<ConsumeMaterials>,
    ) -> Result<()> {
        let crafting_record = &ctx.accounts.crafting_record;
        
        // Ensure crafting is in progress and materials verified
        require!(
            crafting_record.status == CraftingStatus::InProgress,
            CraftingError::InvalidCraftingStatus
        );
        require!(
            crafting_record.materials_verified,
            CraftingError::MaterialsNotVerified
        );
        
        // Consume the materials by transferring tokens to the vault
        for (i, material_info) in ctx.remaining_accounts.chunks(3).enumerate() {
            let material_token_account = &material_info[0];
            let destination_token_account = &material_info[1];
            let token_program = &material_info[2];
            
            let amount = crafting_record.input_materials[i].amount;
            
            // Transfer tokens to vault
            let cpi_accounts = Transfer {
                from: material_token_account.to_account_info(),
                to: destination_token_account.to_account_info(),
                authority: ctx.accounts.crafter.to_account_info(),
            };
            let cpi_program = token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            token::transfer(cpi_ctx, amount)?;
        }
        
        // Update crafting record
        let mutable_record = &mut ctx.accounts.crafting_record;
        mutable_record.materials_consumed = true;
        
        msg!("Materials consumed for crafting: {}", crafting_record.recipe);
        
        Ok(())
    }
    
    pub fn complete_crafting(
        ctx: Context<CompleteCraftingProcess>,
        result_uri: String,
    ) -> Result<()> {
        let crafting_record = &ctx.accounts.crafting_record;
        
        // Ensure crafting is in progress and materials consumed
        require!(
            crafting_record.status == CraftingStatus::InProgress,
            CraftingError::InvalidCraftingStatus
        );
        require!(
            crafting_record.materials_consumed,
            CraftingError::MaterialsNotConsumed
        );
        
        // Call to the recipe program to complete crafting
        let cpi_program = ctx.accounts.recipe_program.to_account_info();
        let cpi_accounts = CompleteCrafting {
            crafting: ctx.accounts.recipe_crafting.to_account_info(),
            recipe: ctx.accounts.recipe.to_account_info(),
            crafter: ctx.accounts.crafter.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        };
        
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        recipe::cpi::complete_crafting(cpi_ctx)?;
        
        // Check if crafting was successful
        let recipe_crafting = ctx.accounts.recipe_crafting.to_account_info();
        let crafting_data = recipe_crafting.data.borrow();
        
        // In a real implementation, we'd deserialize the account
        // For now, we'll use a simplification and just check if the status byte at a specific position is 1 (Completed)
        // let crafting: recipe::Crafting = recipe::Crafting::try_deserialize(&mut data.as_ref())?;
        let crafting_status_successful = crafting_data[80] == 1; // Assuming status enum is at position 80
        
        // Update our crafting record
        let mutable_record = &mut ctx.accounts.crafting_record;
        mutable_record.status = if crafting_status_successful {
            CraftingStatus::Completed
        } else {
            CraftingStatus::Failed
        };
        mutable_record.completion_time = Some(Clock::get()?.unix_timestamp);
        
        // If successful, mint the result item
        if crafting_status_successful {
            // Get result metadata from recipe
            let recipe_data = ctx.accounts.recipe.try_borrow_data()?;
            
            // In a real implementation, we'd properly deserialize the recipe
            // For now, we'll simulate that we got the result info from the recipe
            
            // Call to material NFT program to mint the result
            let seeds = &[
                b"crafting_authority".as_ref(),
                &[ctx.accounts.crafting_authority.bump],
            ];
            let signer = &[&seeds[..]];
            
            let cpi_program = ctx.accounts.material_program.to_account_info();
            let cpi_accounts = MintMaterial {
                material: ctx.accounts.result_material.to_account_info(),
                mint: ctx.accounts.result_mint.to_account_info(),
                metadata: ctx.accounts.result_metadata.to_account_info(),
                edition: ctx.accounts.result_edition.to_account_info(),
                token_account: ctx.accounts.result_token_account.to_account_info(),
                material_authority: ctx.accounts.material_authority.to_account_info(),
                payer: ctx.accounts.crafter.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
                token_metadata_program: ctx.accounts.token_metadata_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            };
            
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            
            // In a real implementation, we'd pass the correct amount
            let mint_amount = 1;
            
            // Mint the result item
            material_nft::cpi::mint_material(cpi_ctx, mint_amount)?;
            
            msg!("Crafting completed successfully: {}", crafting_record.recipe);
        } else {
            // Refund a portion of materials on failure (could be implemented in a separate function)
            msg!("Crafting failed: {}", crafting_record.recipe);
        }
        
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(authority_bump: u8)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + CraftingAuthority::LEN,
        seeds = [b"crafting_authority".as_ref()],
        bump = authority_bump,
    )]
    pub crafting_authority: Account<'info, CraftingAuthority>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(recipe_id: Pubkey)]
pub struct StartCraftingProcess<'info> {
    #[account(
        init,
        payer = crafter,
        space = 8 + CraftingRecord::LEN,
        seeds = [b"crafting_record".as_ref(), recipe_id.as_ref(), crafter.key().as_ref()],
        bump,
    )]
    pub crafting_record: Account<'info, CraftingRecord>,
    
    /// CHECK: This account is checked in the CPI call
    #[account(mut)]
    pub recipe_crafting: UncheckedAccount<'info>,
    
    /// CHECK: This account is checked in the CPI call
    #[account(mut)]
    pub recipe: UncheckedAccount<'info>,
    
    pub recipe_program: Program<'info, RecipeProgram>,
    
    #[account(mut)]
    pub crafter: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct VerifyMaterials<'info> {
    #[account(
        mut,
        constraint = crafting_record.crafter == crafter.key() @ CraftingError::Unauthorized,
    )]
    pub crafting_record: Account<'info, CraftingRecord>,
    
    #[account(mut)]
    pub crafter: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ConsumeMaterials<'info> {
    #[account(
        mut,
        constraint = crafting_record.crafter == crafter.key() @ CraftingError::Unauthorized,
        constraint = crafting_record.materials_verified @ CraftingError::MaterialsNotVerified,
    )]
    pub crafting_record: Account<'info, CraftingRecord>,
    
    #[account(mut)]
    pub crafter: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CompleteCraftingProcess<'info> {
    #[account(
        mut,
        constraint = crafting_record.crafter == crafter.key() @ CraftingError::Unauthorized,
        constraint = crafting_record.materials_consumed @ CraftingError::MaterialsNotConsumed,
    )]
    pub crafting_record: Account<'info, CraftingRecord>,
    
    /// CHECK: This is the crafting record in the recipe program
    #[account(
        mut,
        constraint = crafting_record.recipe_crafting == recipe_crafting.key() @ CraftingError::InvalidRecipeCrafting,
    )]
    pub recipe_crafting: UncheckedAccount<'info>,
    
    /// CHECK: This is the recipe in the recipe program
    #[account(
        constraint = crafting_record.recipe == recipe.key() @ CraftingError::InvalidRecipe,
    )]
    pub recipe: UncheckedAccount<'info>,
    
    #[account(
        seeds = [b"crafting_authority".as_ref()],
        bump = crafting_authority.bump,
    )]
    pub crafting_authority: Account<'info, CraftingAuthority>,
    
    /// CHECK: This is the material authority in the material-nft program
    pub material_authority: UncheckedAccount<'info>,
    
    /// CHECK: This is the result material account
    #[account(mut)]
    pub result_material: UncheckedAccount<'info>,
    
    /// CHECK: This is the result mint account
    #[account(mut)]
    pub result_mint: UncheckedAccount<'info>,
    
    /// CHECK: This is the result metadata account
    #[account(mut)]
    pub result_metadata: UncheckedAccount<'info>,
    
    /// CHECK: This is the result edition account
    #[account(mut)]
    pub result_edition: UncheckedAccount<'info>,
    
    /// CHECK: This is the result token account
    #[account(mut)]
    pub result_token_account: UncheckedAccount<'info>,
    
    pub recipe_program: Program<'info, RecipeProgram>,
    pub material_program: Program<'info, MaterialNftProgram>,
    
    #[account(mut)]
    pub crafter: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    /// CHECK: This is the token metadata program
    pub token_metadata_program: UncheckedAccount<'info>,
    pub rent: Sysvar<'info, Rent>,
}

#[account]
pub struct CraftingAuthority {
    pub authority: Pubkey,
    pub bump: u8,
}

impl CraftingAuthority {
    pub const LEN: usize = 32 + 1; // pubkey + bump
}

#[account]
pub struct CraftingRecord {
    pub recipe: Pubkey,
    pub recipe_crafting: Pubkey,
    pub crafter: Pubkey,
    pub start_time: i64,
    pub completion_time: Option<i64>,
    pub status: CraftingStatus,
    pub materials_verified: bool,
    pub materials_consumed: bool,
    pub input_materials: Vec<MaterialInput>,
}

impl CraftingRecord {
    pub const LEN: usize = 32 + // recipe
                          32 + // recipe_crafting
                          32 + // crafter
                          8 +  // start_time
                          9 +  // completion_time (Option<i64>)
                          1 +  // status enum
                          1 +  // materials_verified
                          1 +  // materials_consumed
                          4 + (10 * MaterialInput::LEN); // vec of up to 10 materials
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub struct MaterialInput {
    pub material_mint: Pubkey,
    pub amount: u64,
}

impl MaterialInput {
    pub const LEN: usize = 32 + // material_mint
                           8;   // amount
}

#[error_code]
pub enum CraftingError {
    #[msg("Invalid crafting status")]
    InvalidCraftingStatus,
    
    #[msg("Materials have not been verified")]
    MaterialsNotVerified,
    
    #[msg("Materials have not been consumed")]
    MaterialsNotConsumed,
    
    #[msg("Invalid token account")]
    InvalidTokenAccount,
    
    #[msg("Insufficient material balance")]
    InsufficientMaterialBalance,
    
    #[msg("Missing required materials")]
    MissingMaterials,
    
    #[msg("Invalid recipe")]
    InvalidRecipe,
    
    #[msg("Invalid recipe crafting record")]
    InvalidRecipeCrafting,
    
    #[msg("Unauthorized access")]
    Unauthorized,
} 