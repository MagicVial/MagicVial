# Changelog

All notable changes to the MagicVial project will be documented in this file.

## [V1.0.2] - 2023-10-15

### Added
- Created `scripts/cleanup.sh` for removing unnecessary files and directories
- Created `scripts/prepare_project.sh` for standardizing project structure
- Added improved README.md with comprehensive project overview
- Implemented simplified Solana client for easier integration
- Enhanced material system with rarity support
- Added recipe discovery mechanism
- Implemented alchemy success rate algorithms

### Changed
- Reorganized contract structure into modular components:
  - Separated `material`, `recipe`, `crafting`, `guild`, and `token` modules
  - Updated lib.rs to properly import all modules
- Restructured project directories for better organization
- Improved type definitions in Solana client code

### Fixed
- Resolved type errors in solanaClient.ts
- Fixed import issues with AnchorProvider
- Corrected PublicKey.findProgramAddress usage to PublicKey.findProgramAddressSync
- Standardized naming conventions across codebase

### Documentation
- Added detailed project structure to README.md
- Included development status section in documentation
- Updated installation instructions
- Added feature list and overview 