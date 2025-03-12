use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use solana_program::sysvar::clock::Clock;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod guild {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        authority_bump: u8,
    ) -> Result<()> {
        let guild_authority = &mut ctx.accounts.guild_authority;
        guild_authority.authority = ctx.accounts.authority.key();
        guild_authority.bump = authority_bump;
        
        msg!("Guild system initialized");
        
        Ok(())
    }

    pub fn create_guild(
        ctx: Context<CreateGuild>,
        name: String,
        description: String,
        emblem_uri: String,
        min_contribution_required: u64,
        is_public: bool,
    ) -> Result<()> {
        // Validate inputs
        require!(!name.is_empty(), GuildError::EmptyName);
        require!(!description.is_empty(), GuildError::EmptyDescription);
        require!(!emblem_uri.is_empty(), GuildError::EmptyEmblemUri);
        
        // Create the guild
        let guild = &mut ctx.accounts.guild;
        guild.name = name;
        guild.description = description;
        guild.emblem_uri = emblem_uri;
        guild.founder = ctx.accounts.founder.key();
        guild.is_public = is_public;
        guild.min_contribution_required = min_contribution_required;
        guild.member_count = 1; // Founder is first member
        guild.created_at = Clock::get()?.unix_timestamp;
        guild.updated_at = guild.created_at;
        guild.total_reputation = 0;
        guild.reputation_coefficient = 100; // 100 = 1.0x (using fixed point)
        
        // Create founder membership
        let membership = &mut ctx.accounts.founder_membership;
        membership.guild = guild.key();
        membership.member = ctx.accounts.founder.key();
        membership.role = GuildRole::Founder;
        membership.joined_at = guild.created_at;
        membership.reputation = 0;
        membership.contribution = 0;
        membership.is_active = true;
        
        msg!("Guild created: {}", guild.name);
        
        Ok(())
    }
    
    pub fn join_guild(
        ctx: Context<JoinGuild>,
        guild_bump: u8,
    ) -> Result<()> {
        let guild = &mut ctx.accounts.guild;
        
        // Ensure guild allows joining
        require!(
            guild.is_public || ctx.accounts.inviter.key() == guild.founder,
            GuildError::NotAllowedToJoin
        );
        
        // Check if already a member
        require!(
            !membership_exists(
                ctx.accounts.member.key(),
                guild.key(),
                &ctx.remaining_accounts
            ),
            GuildError::AlreadyMember
        );
        
        // Create membership
        let membership = &mut ctx.accounts.membership;
        membership.guild = guild.key();
        membership.member = ctx.accounts.member.key();
        membership.role = GuildRole::Member;
        membership.joined_at = Clock::get()?.unix_timestamp;
        membership.reputation = 0;
        membership.contribution = 0;
        membership.is_active = true;
        
        // Update guild
        guild.member_count += 1;
        guild.updated_at = membership.joined_at;
        
        msg!("New member joined guild: {}", guild.name);
        
        Ok(())
    }
    
    pub fn contribute_to_guild(
        ctx: Context<ContributeToGuild>,
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, GuildError::InvalidContributionAmount);
        
        let membership = &mut ctx.accounts.membership;
        let guild = &mut ctx.accounts.guild;
        
        // Ensure active membership
        require!(membership.is_active, GuildError::InactiveMembership);
        
        // Transfer tokens to guild treasury
        let cpi_accounts = Transfer {
            from: ctx.accounts.member_token_account.to_account_info(),
            to: ctx.accounts.guild_treasury.to_account_info(),
            authority: ctx.accounts.member.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;
        
        // Update membership contribution
        membership.contribution += amount;
        
        // Update reputation based on contribution
        // Reputation formula: contribution * reputation_coefficient / 100
        let reputation_gain = (amount as u128)
            .checked_mul(guild.reputation_coefficient as u128)
            .ok_or(GuildError::ArithmeticError)?
            .checked_div(100)
            .ok_or(GuildError::ArithmeticError)? as u64;
        
        membership.reputation = membership.reputation
            .checked_add(reputation_gain)
            .ok_or(GuildError::ArithmeticError)?;
        
        // Update guild's total reputation
        guild.total_reputation = guild.total_reputation
            .checked_add(reputation_gain)
            .ok_or(GuildError::ArithmeticError)?;
        
        guild.updated_at = Clock::get()?.unix_timestamp;
        
        // Check if member meets requirements for role promotion
        if membership.role == GuildRole::Member && 
           membership.contribution >= guild.min_contribution_required {
            membership.role = GuildRole::Contributor;
            msg!("Member promoted to Contributor in guild: {}", guild.name);
        }
        
        msg!("Contribution of {} made to guild treasury: {}", amount, guild.name);
        
        Ok(())
    }
    
    pub fn promote_member(
        ctx: Context<PromoteMember>,
        new_role: GuildRole,
    ) -> Result<()> {
        let membership = &mut ctx.accounts.membership;
        let promoter_membership = &ctx.accounts.promoter_membership;
        
        // Ensure membership relationships
        require!(
            membership.guild == promoter_membership.guild,
            GuildError::MembershipMismatch
        );
        
        // Validate role hierarchy
        require!(
            promoter_role_can_promote(promoter_membership.role, new_role),
            GuildError::InsufficientPrivileges
        );
        
        // Ensure not demoting (except Founder who can do anything)
        require!(
            promoter_membership.role == GuildRole::Founder || new_role > membership.role,
            GuildError::CannotDemote
        );
        
        // Update role
        membership.role = new_role;
        
        msg!("Member promoted to {:?} in guild", new_role);
        
        Ok(())
    }
    
    pub fn leave_guild(
        ctx: Context<LeaveGuild>,
    ) -> Result<()> {
        // Prevent founder from leaving
        require!(
            ctx.accounts.membership.role != GuildRole::Founder,
            GuildError::FounderCannotLeave
        );
        
        // Mark membership as inactive
        ctx.accounts.membership.is_active = false;
        
        // Update guild
        let guild = &mut ctx.accounts.guild;
        guild.member_count = guild.member_count.saturating_sub(1);
        guild.updated_at = Clock::get()?.unix_timestamp;
        
        msg!("Member left guild: {}", guild.name);
        
        Ok(())
    }
    
    pub fn create_guild_quest(
        ctx: Context<CreateGuildQuest>,
        title: String,
        description: String,
        reward_amount: u64,
        expiry_time: i64,
        required_role: GuildRole,
        required_reputation: u64,
    ) -> Result<()> {
        // Validate inputs
        require!(!title.is_empty(), GuildError::EmptyQuestTitle);
        require!(!description.is_empty(), GuildError::EmptyQuestDescription);
        require!(reward_amount > 0, GuildError::InvalidRewardAmount);
        require!(
            expiry_time > Clock::get()?.unix_timestamp,
            GuildError::InvalidExpiryTime
        );
        
        // Check guild treasury has enough to cover reward
        let guild_treasury = Account::<TokenAccount>::try_from(&ctx.accounts.guild_treasury)?;
        require!(
            guild_treasury.amount >= reward_amount,
            GuildError::InsufficientTreasuryFunds
        );
        
        // Create the quest
        let quest = &mut ctx.accounts.quest;
        quest.guild = ctx.accounts.guild.key();
        quest.creator = ctx.accounts.creator.key();
        quest.title = title;
        quest.description = description;
        quest.reward_amount = reward_amount;
        quest.created_at = Clock::get()?.unix_timestamp;
        quest.expiry_time = expiry_time;
        quest.is_completed = false;
        quest.is_cancelled = false;
        quest.required_role = required_role;
        quest.required_reputation = required_reputation;
        quest.assignee = None;
        
        msg!("Guild quest created: {}", quest.title);
        
        Ok(())
    }
    
    pub fn accept_guild_quest(
        ctx: Context<AcceptGuildQuest>,
    ) -> Result<()> {
        let quest = &mut ctx.accounts.quest;
        
        // Ensure quest is still available
        require!(!quest.is_completed, GuildError::QuestAlreadyCompleted);
        require!(!quest.is_cancelled, GuildError::QuestCancelled);
        require!(quest.assignee.is_none(), GuildError::QuestAlreadyAssigned);
        
        // Check expiry
        let current_time = Clock::get()?.unix_timestamp;
        require!(
            current_time < quest.expiry_time,
            GuildError::QuestExpired
        );
        
        // Check member meets requirements
        let membership = &ctx.accounts.membership;
        require!(
            membership.is_active,
            GuildError::InactiveMembership
        );
        require!(
            membership.role >= quest.required_role,
            GuildError::InsufficientRole
        );
        require!(
            membership.reputation >= quest.required_reputation,
            GuildError::InsufficientReputation
        );
        
        // Assign quest
        quest.assignee = Some(ctx.accounts.member.key());
        
        msg!("Guild quest accepted: {}", quest.title);
        
        Ok(())
    }
    
    pub fn complete_guild_quest(
        ctx: Context<CompleteGuildQuest>,
        quest_bump: u8,
    ) -> Result<()> {
        let quest = &mut ctx.accounts.quest;
        
        // Ensure quest is still active
        require!(!quest.is_completed, GuildError::QuestAlreadyCompleted);
        require!(!quest.is_cancelled, GuildError::QuestCancelled);
        
        // Check expiry
        let current_time = Clock::get()?.unix_timestamp;
        require!(
            current_time < quest.expiry_time,
            GuildError::QuestExpired
        );
        
        // Check quest is assigned to this member
        require!(
            quest.assignee == Some(ctx.accounts.member.key()),
            GuildError::NotQuestAssignee
        );
        
        // Transfer reward from guild treasury to member
        let seeds = &[
            b"guild".as_ref(),
            quest.guild.as_ref(),
            &[quest_bump],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.guild_treasury.to_account_info(),
            to: ctx.accounts.member_token_account.to_account_info(),
            authority: ctx.accounts.guild.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, quest.reward_amount)?;
        
        // Mark quest as completed
        quest.is_completed = true;
        
        // Update membership - add reputation for completing quest
        let membership = &mut ctx.accounts.membership;
        let reputation_gain = quest.reward_amount / 10; // Simplified formula
        
        membership.reputation = membership.reputation
            .checked_add(reputation_gain)
            .ok_or(GuildError::ArithmeticError)?;
        
        // Update guild's total reputation
        let guild = &mut ctx.accounts.guild;
        guild.total_reputation = guild.total_reputation
            .checked_add(reputation_gain)
            .ok_or(GuildError::ArithmeticError)?;
        
        guild.updated_at = current_time;
        
        msg!("Guild quest completed: {}", quest.title);
        
        Ok(())
    }
}

// Helper function to check if a membership already exists in the provided accounts
fn membership_exists(
    member: Pubkey,
    guild: Pubkey,
    remaining_accounts: &[AccountInfo],
) -> bool {
    for account_info in remaining_accounts {
        if let Ok(existing_membership) = Account::<Membership>::try_from(account_info) {
            if existing_membership.member == member && 
               existing_membership.guild == guild &&
               existing_membership.is_active {
                return true;
            }
        }
    }
    false
}

// Helper function to check if a promoter role can promote to a specific role
fn promoter_role_can_promote(promoter_role: GuildRole, new_role: GuildRole) -> bool {
    match promoter_role {
        GuildRole::Founder => true, // Founder can promote to any role
        GuildRole::Officer => {
            // Officers can promote to Contributor or Member
            new_role == GuildRole::Contributor || new_role == GuildRole::Member
        }
        GuildRole::Contributor | GuildRole::Member => false, // These roles cannot promote
    }
}

#[derive(Accounts)]
#[instruction(authority_bump: u8)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + GuildAuthority::LEN,
        seeds = [b"guild_authority".as_ref()],
        bump = authority_bump,
    )]
    pub guild_authority: Account<'info, GuildAuthority>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(
    name: String,
    description: String,
    emblem_uri: String,
    min_contribution_required: u64,
    is_public: bool,
)]
pub struct CreateGuild<'info> {
    #[account(
        init,
        payer = founder,
        space = 8 + Guild::LEN + 
            name.len() + description.len() + emblem_uri.len() + 
            100, // buffer for future fields
    )]
    pub guild: Account<'info, Guild>,
    
    #[account(
        init,
        payer = founder,
        space = 8 + Membership::LEN,
        seeds = [b"membership".as_ref(), guild.key().as_ref(), founder.key().as_ref()],
        bump,
    )]
    pub founder_membership: Account<'info, Membership>,
    
    #[account(mut)]
    pub founder: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(guild_bump: u8)]
pub struct JoinGuild<'info> {
    #[account(
        mut,
        seeds = [b"guild".as_ref(), guild.key().as_ref()],
        bump = guild_bump,
    )]
    pub guild: Account<'info, Guild>,
    
    #[account(
        init,
        payer = member,
        space = 8 + Membership::LEN,
        seeds = [b"membership".as_ref(), guild.key().as_ref(), member.key().as_ref()],
        bump,
    )]
    pub membership: Account<'info, Membership>,
    
    /// CHECK: Only used for verification if guild is not public
    pub inviter: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub member: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ContributeToGuild<'info> {
    #[account(mut)]
    pub guild: Account<'info, Guild>,
    
    #[account(
        mut,
        constraint = membership.guild == guild.key() @ GuildError::MembershipMismatch,
        constraint = membership.member == member.key() @ GuildError::UnauthorizedMember,
    )]
    pub membership: Account<'info, Membership>,
    
    #[account(
        mut,
        constraint = member_token_account.owner == member.key() @ GuildError::UnauthorizedTokenAccount,
    )]
    pub member_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = guild_treasury.owner == guild.key() @ GuildError::InvalidTreasuryAccount,
    )]
    pub guild_treasury: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub member: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct PromoteMember<'info> {
    #[account(mut)]
    pub guild: Account<'info, Guild>,
    
    #[account(
        mut,
        constraint = membership.guild == guild.key() @ GuildError::MembershipMismatch,
    )]
    pub membership: Account<'info, Membership>,
    
    #[account(
        constraint = promoter_membership.guild == guild.key() @ GuildError::MembershipMismatch,
        constraint = promoter_membership.member == promoter.key() @ GuildError::UnauthorizedMember,
        constraint = promoter_membership.is_active @ GuildError::InactiveMembership,
    )]
    pub promoter_membership: Account<'info, Membership>,
    
    #[account(mut)]
    pub promoter: Signer<'info>,
}

#[derive(Accounts)]
pub struct LeaveGuild<'info> {
    #[account(mut)]
    pub guild: Account<'info, Guild>,
    
    #[account(
        mut,
        constraint = membership.guild == guild.key() @ GuildError::MembershipMismatch,
        constraint = membership.member == member.key() @ GuildError::UnauthorizedMember,
    )]
    pub membership: Account<'info, Membership>,
    
    #[account(mut)]
    pub member: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(
    title: String,
    description: String,
    reward_amount: u64,
    expiry_time: i64,
    required_role: GuildRole,
    required_reputation: u64,
)]
pub struct CreateGuildQuest<'info> {
    #[account(mut)]
    pub guild: Account<'info, Guild>,
    
    #[account(
        constraint = creator_membership.guild == guild.key() @ GuildError::MembershipMismatch,
        constraint = creator_membership.member == creator.key() @ GuildError::UnauthorizedMember,
        constraint = creator_membership.is_active @ GuildError::InactiveMembership,
        // Only officers and founders can create quests
        constraint = creator_membership.role == GuildRole::Founder || 
                     creator_membership.role == GuildRole::Officer 
                     @ GuildError::InsufficientPrivileges,
    )]
    pub creator_membership: Account<'info, Membership>,
    
    #[account(
        init,
        payer = creator,
        space = 8 + GuildQuest::LEN + title.len() + description.len() + 100,
    )]
    pub quest: Account<'info, GuildQuest>,
    
    #[account(
        constraint = guild_treasury.owner == guild.key() @ GuildError::InvalidTreasuryAccount,
    )]
    pub guild_treasury: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct AcceptGuildQuest<'info> {
    #[account(mut)]
    pub guild: Account<'info, Guild>,
    
    #[account(
        mut,
        constraint = quest.guild == guild.key() @ GuildError::QuestGuildMismatch,
    )]
    pub quest: Account<'info, GuildQuest>,
    
    #[account(
        constraint = membership.guild == guild.key() @ GuildError::MembershipMismatch,
        constraint = membership.member == member.key() @ GuildError::UnauthorizedMember,
    )]
    pub membership: Account<'info, Membership>,
    
    #[account(mut)]
    pub member: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(quest_bump: u8)]
pub struct CompleteGuildQuest<'info> {
    #[account(
        mut,
        seeds = [b"guild".as_ref(), guild.key().as_ref()],
        bump = quest_bump,
    )]
    pub guild: Account<'info, Guild>,
    
    #[account(
        mut,
        constraint = quest.guild == guild.key() @ GuildError::QuestGuildMismatch,
    )]
    pub quest: Account<'info, GuildQuest>,
    
    #[account(
        mut,
        constraint = membership.guild == guild.key() @ GuildError::MembershipMismatch,
        constraint = membership.member == member.key() @ GuildError::UnauthorizedMember,
        constraint = membership.is_active @ GuildError::InactiveMembership,
    )]
    pub membership: Account<'info, Membership>,
    
    #[account(
        mut,
        constraint = member_token_account.owner == member.key() @ GuildError::UnauthorizedTokenAccount,
    )]
    pub member_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = guild_treasury.owner == guild.key() @ GuildError::InvalidTreasuryAccount,
    )]
    pub guild_treasury: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub member: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct GuildAuthority {
    pub authority: Pubkey,
    pub bump: u8,
}

impl GuildAuthority {
    pub const LEN: usize = 32 + 1; // pubkey + bump
}

#[account]
pub struct Guild {
    pub name: String,
    pub description: String,
    pub emblem_uri: String,
    pub founder: Pubkey,
    pub is_public: bool,
    pub min_contribution_required: u64,
    pub member_count: u32,
    pub created_at: i64,
    pub updated_at: i64,
    pub total_reputation: u64,
    pub reputation_coefficient: u32, // Fixed point: 100 = 1.0x
}

impl Guild {
    pub const LEN: usize = 4 + // string prefix for name
                          4 + // string prefix for description
                          4 + // string prefix for emblem_uri
                          32 + // founder
                          1 + // is_public
                          8 + // min_contribution_required
                          4 + // member_count
                          8 + // created_at
                          8 + // updated_at
                          8 + // total_reputation
                          4;  // reputation_coefficient
}

#[account]
pub struct Membership {
    pub guild: Pubkey,
    pub member: Pubkey,
    pub role: GuildRole,
    pub joined_at: i64,
    pub reputation: u64,
    pub contribution: u64,
    pub is_active: bool,
}

impl Membership {
    pub const LEN: usize = 32 + // guild
                           32 + // member
                           1 +  // role enum
                           8 +  // joined_at
                           8 +  // reputation
                           8 +  // contribution
                           1;   // is_active
}

#[account]
pub struct GuildQuest {
    pub guild: Pubkey,
    pub creator: Pubkey,
    pub title: String,
    pub description: String,
    pub reward_amount: u64,
    pub created_at: i64,
    pub expiry_time: i64,
    pub is_completed: bool,
    pub is_cancelled: bool,
    pub required_role: GuildRole,
    pub required_reputation: u64,
    pub assignee: Option<Pubkey>,
}

impl GuildQuest {
    pub const LEN: usize = 32 + // guild
                            32 + // creator
                            4 +  // string prefix for title
                            4 +  // string prefix for description
                            8 +  // reward_amount
                            8 +  // created_at
                            8 +  // expiry_time
                            1 +  // is_completed
                            1 +  // is_cancelled
                            1 +  // required_role enum
                            8 +  // required_reputation
                            33;  // Option<Pubkey>
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, PartialOrd, Debug)]
pub enum GuildRole {
    Member,
    Contributor,
    Officer,
    Founder,
}

#[error_code]
pub enum GuildError {
    #[msg("Guild name cannot be empty")]
    EmptyName,
    
    #[msg("Guild description cannot be empty")]
    EmptyDescription,
    
    #[msg("Guild emblem URI cannot be empty")]
    EmptyEmblemUri,
    
    #[msg("Not allowed to join this guild")]
    NotAllowedToJoin,
    
    #[msg("Already a member of this guild")]
    AlreadyMember,
    
    #[msg("Invalid contribution amount")]
    InvalidContributionAmount,
    
    #[msg("Arithmetic error")]
    ArithmeticError,
    
    #[msg("Membership guild mismatch")]
    MembershipMismatch,
    
    #[msg("Unauthorized member")]
    UnauthorizedMember,
    
    #[msg("Unauthorized token account")]
    UnauthorizedTokenAccount,
    
    #[msg("Invalid treasury account")]
    InvalidTreasuryAccount,
    
    #[msg("Inactive membership")]
    InactiveMembership,
    
    #[msg("Insufficient privileges for this action")]
    InsufficientPrivileges,
    
    #[msg("Cannot demote a member")]
    CannotDemote,
    
    #[msg("Founder cannot leave the guild")]
    FounderCannotLeave,
    
    #[msg("Guild quest title cannot be empty")]
    EmptyQuestTitle,
    
    #[msg("Guild quest description cannot be empty")]
    EmptyQuestDescription,
    
    #[msg("Invalid reward amount")]
    InvalidRewardAmount,
    
    #[msg("Invalid expiry time")]
    InvalidExpiryTime,
    
    #[msg("Insufficient treasury funds")]
    InsufficientTreasuryFunds,
    
    #[msg("Quest guild mismatch")]
    QuestGuildMismatch,
    
    #[msg("Quest already completed")]
    QuestAlreadyCompleted,
    
    #[msg("Quest has been cancelled")]
    QuestCancelled,
    
    #[msg("Quest already assigned")]
    QuestAlreadyAssigned,
    
    #[msg("Quest has expired")]
    QuestExpired,
    
    #[msg("Insufficient role for this quest")]
    InsufficientRole,
    
    #[msg("Insufficient reputation for this quest")]
    InsufficientReputation,
    
    #[msg("Not the assignee of this quest")]
    NotQuestAssignee,
} 