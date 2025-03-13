use anchor_lang::prelude::*;
use solana_program::clock::Clock;

use crate::{
    DeveloperProfile,
    ProjectVerification,
    SubmitForVerification,
    ReviewProject,
    MagicVialError,
    ProjectSubmitted,
    ProjectReviewed
};

pub fn submit_for_verification(
    ctx: Context<SubmitForVerification>,
    project_name: String,
    project_description: String,
    github_repo: String,
    documentation_uri: String,
) -> Result<()> {
    // Validate input parameters
    if project_name.trim().is_empty() || github_repo.trim().is_empty() {
        return Err(MagicVialError::InvalidParameters.into());
    }
    
    if project_name.len() > 64 {
        return Err(MagicVialError::DataSizeExceeded.into());
    }
    
    if project_description.len() > 256 {
        return Err(MagicVialError::DataSizeExceeded.into());
    }
    
    if github_repo.len() > 128 {
        return Err(MagicVialError::DataSizeExceeded.into());
    }
    
    if documentation_uri.len() > 128 {
        return Err(MagicVialError::DataSizeExceeded.into());
    }
    
    // Check if the developer profile is verified
    let developer_profile = &mut ctx.accounts.developer_profile;
    let developer = &ctx.accounts.developer;
    
    if !developer_profile.is_verified {
        return Err(MagicVialError::DeveloperNotVerified.into());
    }
    
    if developer_profile.authority != developer.key() {
        return Err(MagicVialError::Unauthorized.into());
    }
    
    // Initialize project verification
    let project_verification = &mut ctx.accounts.project_verification;
    let current_time = Clock::get()?.unix_timestamp;
    
    project_verification.developer = developer.key();
    project_verification.project_name = project_name.clone();
    project_verification.project_description = project_description;
    project_verification.github_repo = github_repo;
    project_verification.documentation_uri = documentation_uri;
    project_verification.submission_time = current_time;
    project_verification.avg_review_score = 0;
    project_verification.reviews_count = 0;
    project_verification.verification_status = 0; // Pending
    
    // Increment the developer's project count
    developer_profile.projects_count += 1;
    
    // Emit project submitted event
    emit!(ProjectSubmitted {
        project_id: project_verification.key(),
        developer: developer.key(),
        project_name,
        timestamp: current_time,
    });
    
    Ok(())
}

pub fn review_project(
    ctx: Context<ReviewProject>,
    review_score: u8,
    review_comment: String,
    review_category: u8,
) -> Result<()> {
    // Validate input parameters
    if review_score > 100 {
        return Err(MagicVialError::InvalidReviewScore.into());
    }
    
    // Check if the reviewer is authorized
    let reviewer_profile = &ctx.accounts.reviewer_profile;
    let reviewer = &ctx.accounts.reviewer;
    
    if reviewer_profile.authority != reviewer.key() {
        return Err(MagicVialError::Unauthorized.into());
    }
    
    if reviewer_profile.reviewer_status != 2 { // Not an approved reviewer
        return Err(MagicVialError::ReviewerNotAuthorized.into());
    }
    
    if !reviewer_profile.is_verified {
        return Err(MagicVialError::DeveloperNotVerified.into());
    }
    
    // Update project verification with review
    let project = &mut ctx.accounts.project_verification;
    let current_time = Clock::get()?.unix_timestamp;
    
    // Calculate new average review score
    let total_score = project.avg_review_score as u32 * project.reviews_count + review_score as u32;
    project.reviews_count += 1;
    project.avg_review_score = (total_score / project.reviews_count) as u8;
    
    // Update verification status if enough reviews
    if project.reviews_count >= 3 {
        if project.avg_review_score >= 70 {
            project.verification_status = 1; // Verified
        } else {
            project.verification_status = 2; // Rejected
        }
    }
    
    // Emit project reviewed event
    emit!(ProjectReviewed {
        project_id: project.key(),
        reviewer: reviewer.key(),
        score: review_score,
        timestamp: current_time,
    });
    
    Ok(())
} 