use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

declare_id!("mvXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

#[program]
pub mod magic_vial_token {
    use super::*;

    // Initialize a new MagicVial token
    pub fn initialize(
        ctx: Context<Initialize>,
        name: String,
        symbol: String,
        uri: String,
        total_supply: u64,
    ) -> Result<()> {
        let token_info = &mut ctx.accounts.token_info;
        token_info.name = name;
        token_info.symbol = symbol;
        token_info.uri = uri;
        token_info.decimals = 9;
        token_info.authority = ctx.accounts.authority.key();
        token_info.total_supply = total_supply;

        // Mint the initial supply to the authority
        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.authority_token.to_account_info(),
                    authority: ctx.accounts.mint.to_account_info(),
                },
            ),
            total_supply,
        )?;

        Ok(())
    }

    // Transfer tokens between accounts
    pub fn transfer(ctx: Context<Transfer>, amount: u64) -> Result<()> {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.from.to_account_info(),
                    to: ctx.accounts.to.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
        )?;

        Ok(())
    }

    // Burn tokens
    pub fn burn(ctx: Context<Burn>, amount: u64) -> Result<()> {
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Burn {
                    mint: ctx.accounts.mint.to_account_info(),
                    from: ctx.accounts.from.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
        )?;

        Ok(())
    }
}

#[account]
pub struct TokenInfo {
    pub name: String,       // Token name
    pub symbol: String,     // Token symbol
    pub uri: String,        // Token metadata URI
    pub decimals: u8,       // Decimal precision
    pub authority: Pubkey,  // Token authority address
    pub total_supply: u64,  // Total supply
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 256)]
    pub token_info: Account<'info, TokenInfo>,
    
    #[account(
        init,
        payer = authority,
        mint::decimals = 9,
        mint::authority = mint,
    )]
    pub mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = authority,
    )]
    pub authority_token: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Transfer<'info> {
    pub mint: Account<'info, Mint>,
    
    #[account(mut, has_one = mint)]
    pub from: Account<'info, TokenAccount>,
    
    #[account(mut, has_one = mint)]
    pub to: Account<'info, TokenAccount>,
    
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Burn<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(mut, has_one = mint)]
    pub from: Account<'info, TokenAccount>,
    
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
} 