use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

declare_id!("guiXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

#[program]
pub mod magic_vial_guild {
    use super::*;

    // Create a new guild
    pub fn create_guild(
        ctx: Context<CreateGuild>,
        name: String,
        description: String,
        image_uri: String,
        min_members: u8,
        min_vial_deposit: u64,
    ) -> Result<()> {
        // Validate input parameters
        require!(name.len() <= 50, GuildError::NameTooLong);
        require!(description.len() <= 200, GuildError::DescriptionTooLong);
        require!(min_members >= 3, GuildError::MinMembersTooLow);
        require!(min_vial_deposit >= 1000, GuildError::MinDepositTooLow);
        
        // Initialize guild account
        let guild = &mut ctx.accounts.guild;
        guild.name = name;
        guild.description = description;
        guild.image_uri = image_uri;
        guild.founder = ctx.accounts.founder.key();
        guild.treasury = ctx.accounts.treasury.key();
        guild.min_members = min_members;
        guild.min_vial_deposit = min_vial_deposit;
        guild.member_count = 1; // Founder is the first member
        guild.created_at = Clock::get()?.unix_timestamp;
        guild.active = true;
        
        // Make initial deposit to guild treasury
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.founder_token.to_account_info(),
                    to: ctx.accounts.treasury_token.to_account_info(),
                    authority: ctx.accounts.founder.to_account_info(),
                },
            ),
            min_vial_deposit,
        )?;
        
        // Create the first member (founder)
        let member = &mut ctx.accounts.founder_member;
        member.guild = guild.key();
        member.member = ctx.accounts.founder.key();
        member.role = GuildRole::Founder as u8;
        member.joined_at = Clock::get()?.unix_timestamp;
        member.contribution = min_vial_deposit;
        member.active = true;
        
        Ok(())
    }

    // Join an existing guild
    pub fn join_guild(
        ctx: Context<JoinGuild>,
        deposit_amount: u64,
    ) -> Result<()> {
        let guild = &mut ctx.accounts.guild;
        
        // Check guild is active
        require!(guild.active, GuildError::GuildInactive);
        
        // Check deposit amount meets minimum
        require!(deposit_amount >= guild.min_vial_deposit, GuildError::InsufficientDeposit);
        
        // Make deposit to guild treasury
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.joiner_token.to_account_info(),
                    to: ctx.accounts.treasury_token.to_account_info(),
                    authority: ctx.accounts.joiner.to_account_info(),
                },
            ),
            deposit_amount,
        )?;
        
        // Create new member
        let member = &mut ctx.accounts.new_member;
        member.guild = guild.key();
        member.member = ctx.accounts.joiner.key();
        member.role = GuildRole::Member as u8;
        member.joined_at = Clock::get()?.unix_timestamp;
        member.contribution = deposit_amount;
        member.active = true;
        
        // Update guild member count
        guild.member_count = guild.member_count.checked_add(1).unwrap();
        
        Ok(())
    }

    // Leave a guild
    pub fn leave_guild(
        ctx: Context<LeaveGuild>,
    ) -> Result<()> {
        let guild = &mut ctx.accounts.guild;
        let member = &mut ctx.accounts.member;
        
        // Check member is active in guild
        require!(member.active, GuildError::NotActiveMember);
        
        // Founders cannot leave their guild
        require!(member.role != GuildRole::Founder as u8, GuildError::FounderCannotLeave);
        
        // Mark member as inactive
        member.active = false;
        
        // Update guild member count
        guild.member_count = guild.member_count.checked_sub(1).unwrap();
        
        // If guild has no more members, mark it inactive
        if guild.member_count == 0 {
            guild.active = false;
        }
        
        Ok(())
    }

    // Create a guild crafting project
    pub fn create_project(
        ctx: Context<CreateProject>,
        name: String,
        description: String,
        target_recipe: Pubkey,
        vial_contribution: u64,
        deadline: i64,
    ) -> Result<()> {
        // Validate inputs
        require!(name.len() <= 50, GuildError::NameTooLong);
        require!(description.len() <= 200, GuildError::DescriptionTooLow);
        require!(vial_contribution > 0, GuildError::NoContribution);
        require!(deadline > Clock::get()?.unix_timestamp, GuildError::InvalidDeadline);
        
        // Only active guild members can create projects
        let member = &ctx.accounts.member;
        require!(member.active, GuildError::NotActiveMember);
        require!(member.role >= GuildRole::Officer as u8, GuildError::InsufficientPermission);
        
        // Initialize project
        let project = &mut ctx.accounts.project;
        project.guild = ctx.accounts.guild.key();
        project.name = name;
        project.description = description;
        project.creator = ctx.accounts.creator.key();
        project.target_recipe = target_recipe;
        project.vial_contribution = vial_contribution;
        project.created_at = Clock::get()?.unix_timestamp;
        project.deadline = deadline;
        project.status = ProjectStatus::Active as u8;
        
        // Make initial contribution from creator
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.creator_token.to_account_info(),
                    to: ctx.accounts.project_treasury.to_account_info(),
                    authority: ctx.accounts.creator.to_account_info(),
                },
            ),
            vial_contribution,
        )?;
        
        // Record creator's contribution
        let contribution = &mut ctx.accounts.creator_contribution;
        contribution.project = project.key();
        contribution.contributor = ctx.accounts.creator.key();
        contribution.amount = vial_contribution;
        contribution.contributed_at = Clock::get()?.unix_timestamp;
        
        Ok(())
    }

    // Contribute to a guild project
    pub fn contribute_to_project(
        ctx: Context<ContributeToProject>,
        amount: u64,
    ) -> Result<()> {
        // Validate contribution
        require!(amount > 0, GuildError::NoContribution);
        
        // Check project is active
        let project = &ctx.accounts.project;
        require!(project.status == ProjectStatus::Active as u8, GuildError::ProjectNotActive);
        
        // Check deadline not passed
        require!(project.deadline > Clock::get()?.unix_timestamp, GuildError::ProjectExpired);
        
        // Only active guild members can contribute
        let member = &ctx.accounts.member;
        require!(member.active, GuildError::NotActiveMember);
        
        // Make contribution
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.contributor_token.to_account_info(),
                    to: ctx.accounts.project_treasury.to_account_info(),
                    authority: ctx.accounts.contributor.to_account_info(),
                },
            ),
            amount,
        )?;
        
        // Record contribution
        let contribution = &mut ctx.accounts.contribution;
        contribution.project = project.key();
        contribution.contributor = ctx.accounts.contributor.key();
        contribution.amount = amount;
        contribution.contributed_at = Clock::get()?.unix_timestamp;
        
        Ok(())
    }

    // Update guild member role
    pub fn update_member_role(
        ctx: Context<UpdateMemberRole>,
        new_role: u8,
    ) -> Result<()> {
        // Validate role
        require!(new_role <= GuildRole::Founder as u8, GuildError::InvalidRole);
        require!(new_role != GuildRole::Founder as u8, GuildError::CannotAssignFounder);
        
        // Only founders and officers can change roles
        let admin_member = &ctx.accounts.admin_member;
        require!(admin_member.active, GuildError::NotActiveMember);
        require!(admin_member.role >= GuildRole::Officer as u8, GuildError::InsufficientPermission);
        
        // Founders can change any role, officers can only promote to Member
        if admin_member.role == GuildRole::Officer as u8 {
            require!(new_role <= GuildRole::Member as u8, GuildError::InsufficientPermission);
        }
        
        // Update target member's role
        let target_member = &mut ctx.accounts.target_member;
        target_member.role = new_role;
        
        Ok(())
    }
}

#[derive(Clone, Copy)]
pub enum GuildRole {
    Initiate = 0,
    Member = 1,
    Officer = 2,
    Founder = 3,
}

#[derive(Clone, Copy)]
pub enum ProjectStatus {
    Active = 0,
    Completed = 1,
    Failed = 2,
    Cancelled = 3,
}

#[account]
pub struct Guild {
    pub name: String,             // Guild name
    pub description: String,      // Guild description
    pub image_uri: String,        // Guild logo/image
    pub founder: Pubkey,          // Guild founder address
    pub treasury: Pubkey,         // Guild treasury address
    pub min_members: u8,          // Minimum required members
    pub min_vial_deposit: u64,    // Minimum VIAL deposit to join
    pub member_count: u8,         // Current member count
    pub created_at: i64,          // Creation timestamp
    pub active: bool,             // Whether guild is active
}

#[account]
pub struct GuildMember {
    pub guild: Pubkey,            // Guild this membership belongs to
    pub member: Pubkey,           // Member address
    pub role: u8,                 // Member role (see GuildRole enum)
    pub joined_at: i64,           // When member joined
    pub contribution: u64,        // Total VIAL contribution to guild
    pub active: bool,             // Whether membership is active
}

#[account]
pub struct GuildProject {
    pub guild: Pubkey,            // Guild this project belongs to
    pub name: String,             // Project name
    pub description: String,      // Project description
    pub creator: Pubkey,          // Project creator
    pub target_recipe: Pubkey,    // Recipe to be crafted
    pub vial_contribution: u64,   // Required VIAL contribution
    pub created_at: i64,          // Creation timestamp
    pub deadline: i64,            // Project deadline
    pub status: u8,               // Project status (see ProjectStatus enum)
}

#[account]
pub struct ProjectContribution {
    pub project: Pubkey,          // Project contributed to
    pub contributor: Pubkey,      // Contributor address
    pub amount: u64,              // Amount contributed
    pub contributed_at: i64,      // Contribution timestamp
}

#[derive(Accounts)]
pub struct CreateGuild<'info> {
    #[account(init, payer = founder, space = 8 + 512)]
    pub guild: Account<'info, Guild>,
    
    #[account(init, payer = founder, space = 8 + 128)]
    pub founder_member: Account<'info, GuildMember>,
    
    #[account(mut)]
    pub founder: Signer<'info>,
    
    #[account(mut)]
    pub founder_token: Account<'info, TokenAccount>,
    
    #[account(init, payer = founder, space = 8)]
    pub treasury: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub treasury_token: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct JoinGuild<'info> {
    #[account(mut)]
    pub guild: Account<'info, Guild>,
    
    #[account(init, payer = joiner, space = 8 + 128)]
    pub new_member: Account<'info, GuildMember>,
    
    #[account(mut)]
    pub joiner: Signer<'info>,
    
    #[account(mut)]
    pub joiner_token: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub treasury_token: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct LeaveGuild<'info> {
    #[account(mut)]
    pub guild: Account<'info, Guild>,
    
    #[account(mut, has_one = member @ GuildError::NotMember)]
    pub member: Account<'info, GuildMember>,
    
    #[account(mut)]
    pub member_signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct CreateProject<'info> {
    pub guild: Account<'info, Guild>,
    
    #[account(has_one = member @ GuildError::NotMember)]
    pub member: Account<'info, GuildMember>,
    
    #[account(init, payer = creator, space = 8 + 512)]
    pub project: Account<'info, GuildProject>,
    
    #[account(init, payer = creator, space = 8 + 128)]
    pub creator_contribution: Account<'info, ProjectContribution>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    #[account(mut)]
    pub creator_token: Account<'info, TokenAccount>,
    
    #[account(init, payer = creator, space = 8)]
    pub project_treasury: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ContributeToProject<'info> {
    pub guild: Account<'info, Guild>,
    
    #[account(has_one = member @ GuildError::NotMember)]
    pub member: Account<'info, GuildMember>,
    
    pub project: Account<'info, GuildProject>,
    
    #[account(init, payer = contributor, space = 8 + 128)]
    pub contribution: Account<'info, ProjectContribution>,
    
    #[account(mut)]
    pub contributor: Signer<'info>,
    
    #[account(mut)]
    pub contributor_token: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub project_treasury: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct UpdateMemberRole<'info> {
    pub guild: Account<'info, Guild>,
    
    #[account(has_one = member @ GuildError::NotMember)]
    pub admin_member: Account<'info, GuildMember>,
    
    #[account(mut)]
    pub target_member: Account<'info, GuildMember>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
}

#[error_code]
pub enum GuildError {
    #[msg("Name too long (max 50 characters)")]
    NameTooLong,
    
    #[msg("Description too long (max 200 characters)")]
    DescriptionTooLong,
    
    #[msg("Description too short (min 10 characters)")]
    DescriptionTooLow,
    
    #[msg("Guild requires at least 3 members")]
    MinMembersTooLow,
    
    #[msg("Minimum deposit too low (min 1000 VIAL)")]
    MinDepositTooLow,
    
    #[msg("Guild is not active")]
    GuildInactive,
    
    #[msg("Insufficient deposit amount")]
    InsufficientDeposit,
    
    #[msg("Not an active member of this guild")]
    NotActiveMember,
    
    #[msg("Founder cannot leave their guild")]
    FounderCannotLeave,
    
    #[msg("Not a member of this guild")]
    NotMember,
    
    #[msg("No contribution amount specified")]
    NoContribution,
    
    #[msg("Invalid deadline (must be in the future)")]
    InvalidDeadline,
    
    #[msg("Insufficient permission for this action")]
    InsufficientPermission,
    
    #[msg("Project is not active")]
    ProjectNotActive,
    
    #[msg("Project deadline has passed")]
    ProjectExpired,
    
    #[msg("Invalid role specified")]
    InvalidRole,
    
    #[msg("Cannot assign Founder role to another member")]
    CannotAssignFounder,
} 