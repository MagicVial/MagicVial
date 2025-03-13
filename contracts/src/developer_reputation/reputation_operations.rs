use anchor_lang::prelude::*;
use solana_program::clock::Clock;

use crate::{
    DeveloperProfile,
    RegisterDeveloper,
    VerifyDeveloper,
    UpdateReputation,
    MagicVialError,
    DeveloperVerified
};

pub fn register_developer(
    ctx: Context<RegisterDeveloper>,
    github_username: String,
    display_name: String,
    verification_hash: [u8; 32],
) -> Result<()> {
    // Validate input parameters
    if github_username.trim().is_empty() || display_name.trim().is_empty() {
        return Err(MagicVialError::InvalidParameters.into());
    }
    
    if github_username.len() > 64 {
        return Err(MagicVialError::DataSizeExceeded.into());
    }
    
    if display_name.len() > 64 {
        return Err(MagicVialError::DataSizeExceeded.into());
    }
    
    // Initialize developer profile
    let profile = &mut ctx.accounts.developer_profile;
    let user = &ctx.accounts.user;
    let current_time = Clock::get()?.unix_timestamp;
    
    profile.authority = user.key();
    profile.github_username = github_username;
    profile.display_name = display_name;
    profile.reputation_score = 0;
    profile.verification_hash = verification_hash;
    profile.is_verified = false;
    profile.created_at = current_time;
    profile.last_updated = current_time;
    profile.projects_count = 0;
    profile.reviewer_status = 0; // Not a reviewer initially
    
    Ok(())
}

pub fn verify_developer(
    ctx: Context<VerifyDeveloper>,
    verification_signature: [u8; 64],
) -> Result<()> {
    let profile = &mut ctx.accounts.developer_profile;
    let user = &ctx.accounts.user;
    
    // Check if the signer is the profile owner
    if profile.authority != user.key() {
        return Err(MagicVialError::Unauthorized.into());
    }
    
    // Validate verification signature against stored hash
    // In a real implementation, this would verify a signed message from GitHub
    // Here we simply mark the profile as verified
    
    profile.is_verified = true;
    profile.last_updated = Clock::get()?.unix_timestamp;
    
    // Grant initial reputation score upon verification
    profile.reputation_score = 10; // Base reputation for verified developers
    
    // Emit developer verified event
    emit!(DeveloperVerified {
        developer: user.key(),
        github_username: profile.github_username.clone(),
        timestamp: Clock::get()?.unix_timestamp,
    });
    
    Ok(())
}

pub fn update_reputation(
    ctx: Context<UpdateReputation>,
    new_score: u64,
    evidence_hash: [u8; 32],
) -> Result<()> {
    let profile = &mut ctx.accounts.developer_profile;
    let authority = &ctx.accounts.authority;
    
    // In a real implementation, this function would be restricted to authorized 
    // reputation assessors or automatically updated based on on-chain activity
    // Here we implement a basic version for demonstration
    
    // Update reputation score
    profile.reputation_score = new_score;
    profile.last_updated = Clock::get()?.unix_timestamp;
    
    // Additional reputation scoring logic would be implemented here
    
    Ok(())
} 