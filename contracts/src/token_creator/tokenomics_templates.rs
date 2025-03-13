use anchor_lang::prelude::*;
use crate::MagicVialError;

// Feature flags for token configurations
pub const FEATURE_TRANSFERABLE: u32 = 1 << 0;
pub const FEATURE_BURNABLE: u32 = 1 << 1;
pub const FEATURE_MINTABLE: u32 = 1 << 2;
pub const FEATURE_FREEZE_AUTHORITY: u32 = 1 << 3;
pub const FEATURE_TRANSACTION_FEE: u32 = 1 << 4;
pub const FEATURE_ANTI_BOT: u32 = 1 << 5;
pub const FEATURE_VESTING: u32 = 1 << 6;
pub const FEATURE_DAO_VOTING: u32 = 1 << 7;
pub const FEATURE_ROYALTIES: u32 = 1 << 8;

// Tokenomics template structure
pub struct TokenomicsTemplate {
    pub name: &'static str,
    pub description: &'static str,
    pub features: u32,
    pub distribution: Vec<DistributionAllocation>,
    pub vesting_periods: Option<Vec<VestingPeriod>>,
}

// Distribution allocation structure
pub struct DistributionAllocation {
    pub purpose: &'static str,
    pub percentage: u8,   // 0-100
    pub vesting_id: Option<u8>,
}

// Vesting period structure
pub struct VestingPeriod {
    pub id: u8,
    pub cliff_months: u8,
    pub total_months: u8,
    pub release_frequency: ReleaseFrequency,
}

// Release frequency enum
pub enum ReleaseFrequency {
    OneTime,
    Monthly,
    Quarterly,
    Annually,
}

// Get tokenomics template by ID
pub fn get_tokenomics_template(template_id: u8) -> Result<TokenomicsTemplate> {
    match template_id {
        1 => Ok(standard_utility_token()),
        2 => Ok(community_token()),
        3 => Ok(dao_governance_token()),
        4 => Ok(defi_token()),
        5 => Ok(meme_token()),
        6 => Ok(nft_project_token()),
        7 => Ok(gaming_token()),
        8 => Ok(social_token()),
        _ => Err(MagicVialError::InvalidTokenomicsTemplate.into()),
    }
}

// Standard utility token template
fn standard_utility_token() -> TokenomicsTemplate {
    TokenomicsTemplate {
        name: "Standard Utility Token",
        description: "Balanced tokenomics for utility tokens with team vesting",
        features: FEATURE_TRANSFERABLE | FEATURE_BURNABLE | FEATURE_MINTABLE,
        distribution: vec![
            DistributionAllocation { purpose: "Team", percentage: 20, vesting_id: Some(1) },
            DistributionAllocation { purpose: "Community", percentage: 40, vesting_id: None },
            DistributionAllocation { purpose: "Ecosystem", percentage: 15, vesting_id: None },
            DistributionAllocation { purpose: "Marketing", percentage: 10, vesting_id: None },
            DistributionAllocation { purpose: "Development", percentage: 10, vesting_id: Some(2) },
            DistributionAllocation { purpose: "Liquidity", percentage: 5, vesting_id: None },
        ],
        vesting_periods: Some(vec![
            VestingPeriod { id: 1, cliff_months: 12, total_months: 36, release_frequency: ReleaseFrequency::Monthly },
            VestingPeriod { id: 2, cliff_months: 6, total_months: 24, release_frequency: ReleaseFrequency::Monthly },
        ]),
    }
}

// Community token template
fn community_token() -> TokenomicsTemplate {
    TokenomicsTemplate {
        name: "Community Token",
        description: "Community-focused token with majority public allocation",
        features: FEATURE_TRANSFERABLE | FEATURE_BURNABLE | FEATURE_DAO_VOTING,
        distribution: vec![
            DistributionAllocation { purpose: "Team", percentage: 10, vesting_id: Some(1) },
            DistributionAllocation { purpose: "Community", percentage: 60, vesting_id: None },
            DistributionAllocation { purpose: "Ecosystem", percentage: 15, vesting_id: None },
            DistributionAllocation { purpose: "Marketing", percentage: 5, vesting_id: None },
            DistributionAllocation { purpose: "Development", percentage: 5, vesting_id: Some(1) },
            DistributionAllocation { purpose: "Liquidity", percentage: 5, vesting_id: None },
        ],
        vesting_periods: Some(vec![
            VestingPeriod { id: 1, cliff_months: 6, total_months: 24, release_frequency: ReleaseFrequency::Monthly },
        ]),
    }
}

// DAO governance token template
fn dao_governance_token() -> TokenomicsTemplate {
    TokenomicsTemplate {
        name: "DAO Governance Token",
        description: "Governance-focused token with voting features",
        features: FEATURE_TRANSFERABLE | FEATURE_DAO_VOTING | FEATURE_VESTING,
        distribution: vec![
            DistributionAllocation { purpose: "Core Contributors", percentage: 15, vesting_id: Some(1) },
            DistributionAllocation { purpose: "Community", percentage: 50, vesting_id: None },
            DistributionAllocation { purpose: "Governance", percentage: 20, vesting_id: None },
            DistributionAllocation { purpose: "Ecosystem Growth", percentage: 10, vesting_id: None },
            DistributionAllocation { purpose: "Liquidity", percentage: 5, vesting_id: None },
        ],
        vesting_periods: Some(vec![
            VestingPeriod { id: 1, cliff_months: 12, total_months: 48, release_frequency: ReleaseFrequency::Monthly },
        ]),
    }
}

// DeFi token template
fn defi_token() -> TokenomicsTemplate {
    TokenomicsTemplate {
        name: "DeFi Token",
        description: "Token designed for decentralized finance applications",
        features: FEATURE_TRANSFERABLE | FEATURE_BURNABLE | FEATURE_TRANSACTION_FEE | FEATURE_ANTI_BOT,
        distribution: vec![
            DistributionAllocation { purpose: "Team", percentage: 15, vesting_id: Some(1) },
            DistributionAllocation { purpose: "Community", percentage: 30, vesting_id: None },
            DistributionAllocation { purpose: "Liquidity Mining", percentage: 25, vesting_id: None },
            DistributionAllocation { purpose: "Treasury", percentage: 15, vesting_id: None },
            DistributionAllocation { purpose: "Marketing", percentage: 5, vesting_id: None },
            DistributionAllocation { purpose: "Development", percentage: 5, vesting_id: Some(1) },
            DistributionAllocation { purpose: "Liquidity", percentage: 5, vesting_id: None },
        ],
        vesting_periods: Some(vec![
            VestingPeriod { id: 1, cliff_months: 12, total_months: 36, release_frequency: ReleaseFrequency::Monthly },
        ]),
    }
}

// Meme token template
fn meme_token() -> TokenomicsTemplate {
    TokenomicsTemplate {
        name: "Meme Token",
        description: "Simple tokenomics for community meme tokens",
        features: FEATURE_TRANSFERABLE | FEATURE_BURNABLE | FEATURE_ANTI_BOT,
        distribution: vec![
            DistributionAllocation { purpose: "Team", percentage: 5, vesting_id: Some(1) },
            DistributionAllocation { purpose: "Community", percentage: 70, vesting_id: None },
            DistributionAllocation { purpose: "Marketing", percentage: 15, vesting_id: None },
            DistributionAllocation { purpose: "Liquidity", percentage: 10, vesting_id: None },
        ],
        vesting_periods: Some(vec![
            VestingPeriod { id: 1, cliff_months: 3, total_months: 12, release_frequency: ReleaseFrequency::Monthly },
        ]),
    }
}

// NFT project token template
fn nft_project_token() -> TokenomicsTemplate {
    TokenomicsTemplate {
        name: "NFT Project Token",
        description: "Token designed for NFT projects with royalty features",
        features: FEATURE_TRANSFERABLE | FEATURE_BURNABLE | FEATURE_ROYALTIES,
        distribution: vec![
            DistributionAllocation { purpose: "Team", percentage: 20, vesting_id: Some(1) },
            DistributionAllocation { purpose: "Community", percentage: 30, vesting_id: None },
            DistributionAllocation { purpose: "NFT Holders", percentage: 25, vesting_id: None },
            DistributionAllocation { purpose: "Marketing", percentage: 10, vesting_id: None },
            DistributionAllocation { purpose: "Development", percentage: 10, vesting_id: Some(1) },
            DistributionAllocation { purpose: "Liquidity", percentage: 5, vesting_id: None },
        ],
        vesting_periods: Some(vec![
            VestingPeriod { id: 1, cliff_months: 6, total_months: 24, release_frequency: ReleaseFrequency::Monthly },
        ]),
    }
}

// Gaming token template
fn gaming_token() -> TokenomicsTemplate {
    TokenomicsTemplate {
        name: "Gaming Token",
        description: "Token designed for gaming applications with in-game utility",
        features: FEATURE_TRANSFERABLE | FEATURE_BURNABLE | FEATURE_MINTABLE,
        distribution: vec![
            DistributionAllocation { purpose: "Team", percentage: 15, vesting_id: Some(1) },
            DistributionAllocation { purpose: "Players", percentage: 40, vesting_id: None },
            DistributionAllocation { purpose: "In-game Rewards", percentage: 20, vesting_id: None },
            DistributionAllocation { purpose: "Marketing", percentage: 10, vesting_id: None },
            DistributionAllocation { purpose: "Development", percentage: 10, vesting_id: Some(1) },
            DistributionAllocation { purpose: "Liquidity", percentage: 5, vesting_id: None },
        ],
        vesting_periods: Some(vec![
            VestingPeriod { id: 1, cliff_months: 6, total_months: 24, release_frequency: ReleaseFrequency::Monthly },
        ]),
    }
}

// Social token template
fn social_token() -> TokenomicsTemplate {
    TokenomicsTemplate {
        name: "Social Token",
        description: "Token designed for content creators and social platforms",
        features: FEATURE_TRANSFERABLE | FEATURE_BURNABLE | FEATURE_ROYALTIES,
        distribution: vec![
            DistributionAllocation { purpose: "Creator", percentage: 25, vesting_id: Some(1) },
            DistributionAllocation { purpose: "Community", percentage: 40, vesting_id: None },
            DistributionAllocation { purpose: "Platform Growth", percentage: 15, vesting_id: None },
            DistributionAllocation { purpose: "Marketing", percentage: 10, vesting_id: None },
            DistributionAllocation { purpose: "Development", percentage: 5, vesting_id: Some(1) },
            DistributionAllocation { purpose: "Liquidity", percentage: 5, vesting_id: None },
        ],
        vesting_periods: Some(vec![
            VestingPeriod { id: 1, cliff_months: 3, total_months: 18, release_frequency: ReleaseFrequency::Monthly },
        ]),
    }
} 