use anchor_lang::prelude::*;
use thiserror::Error;

#[error_code]
pub enum MagicVialError {
    #[msg("Operation not allowed: Unauthorized")]
    Unauthorized,
    
    #[msg("Invalid token parameters")]
    InvalidTokenParameters,
    
    #[msg("Token supply cap exceeded")]
    SupplyCapExceeded,
    
    #[msg("Invalid tokenomics template")]
    InvalidTokenomicsTemplate,
    
    #[msg("Developer profile already registered")]
    DeveloperProfileAlreadyExists,
    
    #[msg("Developer not verified")]
    DeveloperNotVerified,
    
    #[msg("Invalid verification signature")]
    InvalidVerificationSignature,
    
    #[msg("Invalid reputation update evidence")]
    InvalidReputationEvidence,
    
    #[msg("Insufficient reputation score")]
    InsufficientReputationScore,
    
    #[msg("Project already submitted for verification")]
    ProjectAlreadySubmitted,
    
    #[msg("Reviewer not authorized")]
    ReviewerNotAuthorized,
    
    #[msg("Invalid review score")]
    InvalidReviewScore,
    
    #[msg("Liquidity pool already exists")]
    LiquidityPoolAlreadyExists,
    
    #[msg("Invalid liquidity amount")]
    InvalidLiquidityAmount,
    
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
    
    #[msg("No liquidity incentives to claim")]
    NoLiquidityIncentives,
    
    #[msg("Liquidity pool not active")]
    LiquidityPoolNotActive,
    
    #[msg("Operation rate limited")]
    RateLimited,
    
    #[msg("Data size exceeded")]
    DataSizeExceeded,
    
    #[msg("Invalid input parameters")]
    InvalidParameters,
    
    #[msg("Project not found")]
    ProjectNotFound,
    
    #[msg("Developer profile not found")]
    DeveloperProfileNotFound,
} 