use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use solana_program::{
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvar::{rent::Rent, Sysvar},
};

// Module imports
pub mod errors;
pub mod token_creator;
pub mod developer_reputation;
pub mod liquidity_protocol;
pub mod verification;

// Re-export key components
pub use errors::*;
pub use token_creator::*;
pub use developer_reputation::*;
pub use liquidity_protocol::*;
pub use verification::*;

// MagicVial Contract Entry Point
pub mod programs {
    pub mod material;
    pub mod recipe;
    pub mod crafting;
    pub mod guild;
    pub mod token;
}

// Re-export modules for convenience
pub use programs::material;
pub use programs::recipe;
pub use programs::crafting;
pub use programs::guild;
pub use programs::token;

declare_id!("MVia1LtH6EbzKLmH5BUxY8rNR2UdGoJSBhK5yN124Gi");

/// Main program module for MagicVial
#[program]
pub mod magicvial {
    use super::*;
    
    /// Initialize a new token with the specified parameters
    pub fn create_token(
        ctx: Context<CreateToken>,
        name: String,
        symbol: String,
        uri: String,
        decimals: u8,
        total_supply: u64,
        tokenomics_template: u8,
    ) -> Result<()> {
        token_creator::token_operations::create_token(
            ctx, name, symbol, uri, decimals, total_supply, tokenomics_template
        )
    }
    
    /// Create liquidity pool on Pump.fun for a token
    pub fn create_liquidity_pool(
        ctx: Context<CreateLiquidityPool>,
        initial_price: u64,
        initial_liquidity: u64,
    ) -> Result<()> {
        liquidity_protocol::liquidity_operations::create_liquidity_pool(
            ctx, initial_price, initial_liquidity
        )
    }
    
    /// Register a developer profile with GitHub verification
    pub fn register_developer(
        ctx: Context<RegisterDeveloper>,
        github_username: String,
        display_name: String,
        verification_hash: [u8; 32],
    ) -> Result<()> {
        developer_reputation::reputation_operations::register_developer(
            ctx, github_username, display_name, verification_hash
        )
    }
    
    /// Verify a developer's GitHub account
    pub fn verify_developer(
        ctx: Context<VerifyDeveloper>,
        verification_signature: [u8; 64],
    ) -> Result<()> {
        developer_reputation::reputation_operations::verify_developer(
            ctx, verification_signature
        )
    }
    
    /// Update developer reputation score
    pub fn update_reputation(
        ctx: Context<UpdateReputation>,
        new_score: u64,
        evidence_hash: [u8; 32],
    ) -> Result<()> {
        developer_reputation::reputation_operations::update_reputation(
            ctx, new_score, evidence_hash
        )
    }
    
    /// Submit a project for community verification
    pub fn submit_for_verification(
        ctx: Context<SubmitForVerification>,
        project_name: String,
        project_description: String,
        github_repo: String,
        documentation_uri: String,
    ) -> Result<()> {
        verification::verification_operations::submit_for_verification(
            ctx, project_name, project_description, github_repo, documentation_uri
        )
    }
    
    /// Review a submitted project (by verified reviewer)
    pub fn review_project(
        ctx: Context<ReviewProject>,
        review_score: u8,
        review_comment: String,
        review_category: u8,
    ) -> Result<()> {
        verification::verification_operations::review_project(
            ctx, review_score, review_comment, review_category
        )
    }
    
    /// Claim liquidity incentives for maintaining a healthy market
    pub fn claim_liquidity_incentive(
        ctx: Context<ClaimLiquidityIncentive>,
    ) -> Result<()> {
        liquidity_protocol::liquidity_operations::claim_liquidity_incentive(ctx)
    }
}

// Context Structures
#[derive(Accounts)]
pub struct CreateToken<'info> {
    #[account(init, payer = developer, space = TokenConfig::LEN)]
    pub token_config: Account<'info, TokenConfig>,
    
    #[account(mut)]
    pub token_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub developer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CreateLiquidityPool<'info> {
    #[account(mut)]
    pub token_config: Account<'info, TokenConfig>,
    
    #[account(mut)]
    pub token_mint: Account<'info, Mint>,
    
    #[account(init, payer = developer, space = LiquidityPool::LEN)]
    pub liquidity_pool: Account<'info, LiquidityPool>,
    
    #[account(mut)]
    pub developer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RegisterDeveloper<'info> {
    #[account(init, payer = user, space = DeveloperProfile::LEN)]
    pub developer_profile: Account<'info, DeveloperProfile>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifyDeveloper<'info> {
    #[account(mut)]
    pub developer_profile: Account<'info, DeveloperProfile>,
    
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateReputation<'info> {
    #[account(mut)]
    pub developer_profile: Account<'info, DeveloperProfile>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct SubmitForVerification<'info> {
    #[account(mut)]
    pub developer_profile: Account<'info, DeveloperProfile>,
    
    #[account(init, payer = developer, space = ProjectVerification::LEN)]
    pub project_verification: Account<'info, ProjectVerification>,
    
    #[account(mut)]
    pub developer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReviewProject<'info> {
    #[account(mut)]
    pub project_verification: Account<'info, ProjectVerification>,
    
    #[account(mut)]
    pub reviewer_profile: Account<'info, DeveloperProfile>,
    
    #[account(mut)]
    pub reviewer: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimLiquidityIncentive<'info> {
    #[account(mut)]
    pub liquidity_pool: Account<'info, LiquidityPool>,
    
    #[account(mut)]
    pub token_config: Account<'info, TokenConfig>,
    
    #[account(mut)]
    pub liquidity_provider: Signer<'info>,
    
    #[account(mut)]
    pub provider_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

// Data Structures
#[account]
pub struct TokenConfig {
    pub developer: Pubkey,
    pub mint: Pubkey,
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub decimals: u8,
    pub supply_cap: u64,
    pub created_at: i64,
    pub features: u32, // Bitfield of enabled features
    pub tokenomics_template: u8,
    pub is_verified: bool,
}

impl TokenConfig {
    pub const LEN: usize = 8 + // discriminator
        32 + // developer pubkey
        32 + // mint pubkey
        64 + // name
        16 + // symbol
        128 + // uri
        1 + // decimals
        8 + // supply_cap
        8 + // created_at
        4 + // features
        1 + // tokenomics_template
        1 + // is_verified
        64; // padding
}

#[account]
pub struct LiquidityPool {
    pub token_mint: Pubkey,
    pub pool_authority: Pubkey,
    pub initial_price: u64,
    pub current_price: u64,
    pub total_liquidity: u64,
    pub trading_volume_24h: u64,
    pub last_update_time: i64,
    pub incentives_claimed: u64,
    pub is_active: bool,
}

impl LiquidityPool {
    pub const LEN: usize = 8 + // discriminator
        32 + // token_mint
        32 + // pool_authority
        8 + // initial_price
        8 + // current_price
        8 + // total_liquidity
        8 + // trading_volume_24h
        8 + // last_update_time
        8 + // incentives_claimed
        1 + // is_active
        32; // padding
}

#[account]
pub struct DeveloperProfile {
    pub authority: Pubkey,
    pub github_username: String,
    pub display_name: String,
    pub reputation_score: u64,
    pub verification_hash: [u8; 32],
    pub is_verified: bool,
    pub created_at: i64,
    pub last_updated: i64,
    pub projects_count: u32,
    pub reviewer_status: u8, // 0 = not reviewer, 1 = pending, 2 = approved
}

impl DeveloperProfile {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority pubkey
        64 + // github_username
        64 + // display_name
        8 + // reputation_score
        32 + // verification_hash
        1 + // is_verified
        8 + // created_at
        8 + // last_updated
        4 + // projects_count
        1 + // reviewer_status
        32; // padding
}

#[account]
pub struct ProjectVerification {
    pub developer: Pubkey,
    pub project_name: String,
    pub project_description: String,
    pub github_repo: String,
    pub documentation_uri: String,
    pub submission_time: i64,
    pub avg_review_score: u8,
    pub reviews_count: u32,
    pub verification_status: u8, // 0 = pending, 1 = verified, 2 = rejected
}

impl ProjectVerification {
    pub const LEN: usize = 8 + // discriminator
        32 + // developer pubkey
        64 + // project_name
        256 + // project_description
        128 + // github_repo
        128 + // documentation_uri
        8 + // submission_time
        1 + // avg_review_score
        4 + // reviews_count
        1 + // verification_status
        32; // padding
}

// Events
#[event]
pub struct TokenCreated {
    pub token_mint: Pubkey,
    pub developer: Pubkey,
    pub name: String,
    pub symbol: String,
    pub total_supply: u64,
    pub tokenomics_template: u8,
    pub timestamp: i64,
}

#[event]
pub struct LiquidityPoolCreated {
    pub token_mint: Pubkey,
    pub pool_address: Pubkey,
    pub initial_price: u64,
    pub initial_liquidity: u64,
    pub timestamp: i64,
}

#[event]
pub struct DeveloperVerified {
    pub developer: Pubkey,
    pub github_username: String,
    pub timestamp: i64,
}

#[event]
pub struct ProjectSubmitted {
    pub project_id: Pubkey,
    pub developer: Pubkey,
    pub project_name: String,
    pub timestamp: i64,
}

#[event]
pub struct ProjectReviewed {
    pub project_id: Pubkey,
    pub reviewer: Pubkey,
    pub score: u8,
    pub timestamp: i64,
} 