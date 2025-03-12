use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};
use mpl_token_metadata::{
    instruction as token_instruction,
    state::{Creator, DataV2},
};
use solana_program::{
    program::invoke_signed,
    pubkey::Pubkey,
    sysvar::clock::Clock,
};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod material_nft {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        authority_bump: u8,
    ) -> Result<()> {
        let material_authority = &mut ctx.accounts.material_authority;
        material_authority.authority = ctx.accounts.authority.key();
        material_authority.bump = authority_bump;
        
        msg!("Material NFT program initialized");
        
        Ok(())
    }

    pub fn create_material(
        ctx: Context<CreateMaterial>,
        name: String,
        symbol: String,
        uri: String,
        material_type: String,
        rarity: String,
        max_supply: u64,
    ) -> Result<()> {
        // Validate inputs
        require!(!name.is_empty(), ErrorCode::EmptyName);
        require!(!symbol.is_empty(), ErrorCode::EmptySymbol);
        require!(!uri.is_empty(), ErrorCode::EmptyUri);
        require!(!material_type.is_empty(), ErrorCode::EmptyType);
        require!(!rarity.is_empty(), ErrorCode::EmptyRarity);
        require!(max_supply > 0, ErrorCode::InvalidMaxSupply);
        
        // Create on-chain metadata for the material
        let authority_bump = ctx.accounts.material_authority.bump;
        let authority_seeds = &[
            b"material_authority".as_ref(),
            &[authority_bump],
        ];
        let signer_seeds = &[&authority_seeds[..]];
        
        // Create the metadata for the NFT
        let metadata_infos = vec![
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.material_authority.to_account_info(),
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.token_metadata_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ];
        
        // Create metadata creators array
        let creators = vec![
            // Material authority as first creator (verified)
            Creator {
                address: ctx.accounts.material_authority.key(),
                verified: true,
                share: 5,
            },
            // Original creator as second creator (not verified, will need to be verified later)
            Creator {
                address: ctx.accounts.authority.key(),
                verified: false,
                share: 95,
            },
        ];
        
        // Additional attributes for the material
        let mut attributes = format!(
            "{{\"attributes\":[{{\"trait_type\":\"Type\",\"value\":\"{}\"}},{{\"trait_type\":\"Rarity\",\"value\":\"{}\"}}]}}",
            material_type, rarity
        );
        
        // Create the metadata
        let data = DataV2 {
            name,
            symbol,
            uri,
            seller_fee_basis_points: 500, // 5% royalty
            creators: Some(creators),
            collection: None,
            uses: None,
        };
        
        // Invoke the metadata instruction
        let create_metadata_ix = token_instruction::create_metadata_accounts_v2(
            ctx.accounts.token_metadata_program.key(),
            ctx.accounts.metadata.key(),
            ctx.accounts.mint.key(),
            ctx.accounts.material_authority.key(),
            ctx.accounts.authority.key(),
            ctx.accounts.material_authority.key(), // Update authority
            data.name.clone(),
            data.symbol.clone(),
            data.uri.clone(),
            Some(data.creators.unwrap()),
            data.seller_fee_basis_points,
            true, // Update authority is signer
            true, // Is mutable
            None, // Collection
            None, // Uses
            Some(attributes), // Additional attributes
        );
        
        invoke_signed(
            &create_metadata_ix,
            &metadata_infos,
            signer_seeds,
        )?;
        
        // Create the material account
        let material = &mut ctx.accounts.material;
        material.mint = ctx.accounts.mint.key();
        material.material_type = material_type;
        material.rarity = rarity;
        material.current_supply = 0;
        material.max_supply = max_supply;
        material.created_at = Clock::get()?.unix_timestamp;
        material.updated_at = material.created_at;
        material.authority = ctx.accounts.authority.key();
        material.is_active = true;
        
        msg!("Material created successfully: {}", data.name);
        
        Ok(())
    }
    
    pub fn mint_material(
        ctx: Context<MintMaterial>,
        amount: u64,
    ) -> Result<()> {
        let material = &mut ctx.accounts.material;
        
        // Validate inputs
        require!(amount > 0, ErrorCode::InvalidMintAmount);
        require!(material.is_active, ErrorCode::MaterialInactive);
        require!(
            material.current_supply + amount <= material.max_supply,
            ErrorCode::ExceedsMaxSupply
        );
        
        // Update material supply
        material.current_supply += amount;
        material.updated_at = Clock::get()?.unix_timestamp;
        
        // Mint the tokens to the user
        let authority_bump = ctx.accounts.material_authority.bump;
        let authority_seeds = &[
            b"material_authority".as_ref(),
            &[authority_bump],
        ];
        let signer_seeds = &[&authority_seeds[..]];
        
        let cpi_accounts = anchor_spl::token::MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.material_authority.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(
            cpi_program,
            cpi_accounts,
            signer_seeds,
        );
        
        anchor_spl::token::mint_to(cpi_ctx, amount)?;
        
        msg!("Minted {} material tokens", amount);
        
        Ok(())
    }
    
    pub fn set_material_active(
        ctx: Context<UpdateMaterialStatus>,
        is_active: bool,
    ) -> Result<()> {
        let material = &mut ctx.accounts.material;
        
        // Only the material authority can update the status
        require!(
            material.authority == ctx.accounts.authority.key(),
            ErrorCode::Unauthorized
        );
        
        material.is_active = is_active;
        material.updated_at = Clock::get()?.unix_timestamp;
        
        msg!("Material status updated: active = {}", is_active);
        
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(authority_bump: u8)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + MaterialAuthority::LEN,
        seeds = [b"material_authority".as_ref()],
        bump = authority_bump,
    )]
    pub material_authority: Account<'info, MaterialAuthority>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CreateMaterial<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Material::LEN,
        seeds = [b"material".as_ref(), mint.key().as_ref()],
        bump,
    )]
    pub material: Account<'info, Material>,
    
    #[account(
        mut,
        seeds = [b"material_authority".as_ref()],
        bump = material_authority.bump,
    )]
    pub material_authority: Account<'info, MaterialAuthority>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub token_metadata_program: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintMaterial<'info> {
    #[account(
        mut,
        seeds = [b"material".as_ref(), mint.key().as_ref()],
        bump,
    )]
    pub material: Account<'info, Material>,
    
    #[account(
        mut,
        seeds = [b"material_authority".as_ref()],
        bump = material_authority.bump,
    )]
    pub material_authority: Account<'info, MaterialAuthority>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(
        init_if_needed,
        payer = receiver,
        associated_token::mint = mint,
        associated_token::authority = receiver,
    )]
    pub token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub receiver: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct UpdateMaterialStatus<'info> {
    #[account(
        mut,
        seeds = [b"material".as_ref(), material.mint.as_ref()],
        bump,
    )]
    pub material: Account<'info, Material>,
    
    #[account(
        mut,
        constraint = material.authority == authority.key(),
    )]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
pub struct MaterialAuthority {
    pub authority: Pubkey,
    pub bump: u8,
}

impl MaterialAuthority {
    pub const LEN: usize = 32 + 1; // pubkey + bump
}

#[account]
pub struct Material {
    pub mint: Pubkey,
    pub material_type: String, // Basic, Rare, Seasonal, Mysterious
    pub rarity: String,        // Common, Rare, Epic, Legendary
    pub current_supply: u64,
    pub max_supply: u64,
    pub created_at: i64,
    pub updated_at: i64,
    pub authority: Pubkey,
    pub is_active: bool,
}

impl Material {
    pub const LEN: usize = 32 + // mint
                           32 + // material_type (max)
                           16 + // rarity (max)
                           8 +  // current_supply
                           8 +  // max_supply
                           8 +  // created_at
                           8 +  // updated_at
                           32 + // authority
                           1;   // is_active
}

#[error_code]
pub enum ErrorCode {
    #[msg("Name cannot be empty")]
    EmptyName,
    
    #[msg("Symbol cannot be empty")]
    EmptySymbol,
    
    #[msg("URI cannot be empty")]
    EmptyUri,
    
    #[msg("Material type cannot be empty")]
    EmptyType,
    
    #[msg("Rarity cannot be empty")]
    EmptyRarity,
    
    #[msg("Max supply must be greater than zero")]
    InvalidMaxSupply,
    
    #[msg("Amount must be greater than zero")]
    InvalidMintAmount,
    
    #[msg("Material is not active")]
    MaterialInactive,
    
    #[msg("Mint amount exceeds maximum supply")]
    ExceedsMaxSupply,
    
    #[msg("Unauthorized access")]
    Unauthorized,
} 