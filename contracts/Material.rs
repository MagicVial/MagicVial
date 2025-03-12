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
        rarity: u8,        // 1-100, higher is rarer
        uri: String,
    ) -> Result<()> {
        let material_type_info = &mut ctx.accounts.material_type_info;
        material_type_info.name = name;
        material_type_info.description = description;
        material_type_info.material_type = material_type;
        material_type_info.rarity = rarity;
        material_type_info.uri = uri;
        material_type_info.authority = ctx.accounts.authority.key();
        material_type_info.enabled = true;
        material_type_info.created_at = Clock::get()?.unix_timestamp;

        Ok(())
    }

    // Mint a new material instance
    pub fn mint_material(
        ctx: Context<MintMaterial>,
        amount: u64,
    ) -> Result<()> {
        let material_instance = &mut ctx.accounts.material_instance;
        material_instance.material_type = ctx.accounts.material_type_info.key();
        material_instance.owner = ctx.accounts.owner.key();
        material_instance.amount = amount;
        material_instance.created_at = Clock::get()?.unix_timestamp;

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
}

#[account]
pub struct MaterialTypeInfo {
    pub name: String,           // Material name
    pub description: String,    // Material description
    pub material_type: u8,      // Material type category
    pub rarity: u8,             // Rarity score
    pub uri: String,            // Metadata URI
    pub authority: Pubkey,      // Authority that can modify this type
    pub enabled: bool,          // Whether this material is still available
    pub created_at: i64,        // Creation timestamp
}

#[account]
pub struct MaterialInstance {
    pub material_type: Pubkey,  // Reference to the material type
    pub owner: Pubkey,          // Current owner
    pub amount: u64,            // Quantity of this material
    pub created_at: i64,        // Creation timestamp
}

#[derive(Accounts)]
pub struct InitializeMaterialType<'info> {
    #[account(init, payer = authority, space = 8 + 512)]
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

#[error_code]
pub enum MaterialError {
    #[msg("Insufficient material amount")]
    InsufficientAmount,
    
    #[msg("Invalid material owner")]
    InvalidOwner,
} 