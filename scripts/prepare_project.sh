#!/bin/bash

# Project preparation script for MagicVial
echo "Starting project preparation..."

# Ensure required directories exist
echo "Creating directory structure if needed..."

# Frontend structure
mkdir -p apps/frontend/src/{api,assets,components,config,contexts,hooks,pages,services,solana,styles,types,utils}

# Backend structure
mkdir -p apps/backend/src/{config,controllers,middlewares,models,routes,services,types,utils}

# Contract structure
mkdir -p contracts/src/programs/{material,recipe,crafting,guild,token}

# Documentation
mkdir -p docs/{en,assets}

# Scripts directory
mkdir -p scripts

# Shared code
mkdir -p shared/{types,utils}

# Ensure key files exist
echo "Ensuring key files exist..."

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
  echo "Creating .gitignore..."
  cat > .gitignore << EOL
# Node
node_modules/
npm-debug.log
yarn-debug.log
yarn-error.log
.pnpm-debug.log
.pnp.js

# Build artifacts
dist/
build/
*.tsbuildinfo

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Solana
.anchor/
target/
**/*.rs.bk
test-ledger/

# IDE
.idea/
.vscode/
*.iml
.project
.classpath

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Coverage
coverage/
.nyc_output/
EOL
fi

# Create README.md if it doesn't exist or is empty
if [ ! -s "README.md" ]; then
  echo "Creating README.md..."
  cat > README.md << EOL
# MagicVial

A decentralized crafting and alchemy platform on Solana.

## Overview

MagicVial is a blockchain-based platform that allows users to discover, craft, and trade magical items using various materials and recipes. The platform leverages the Solana blockchain for fast and cost-effective transactions.

## Features

- Material system with different rarities and attributes
- Recipe discovery mechanism
- Advanced alchemy with success rates and rarity outcomes
- Guild system for collaborative crafting
- Wallet integration for seamless transactions

## Getting Started

### Prerequisites

- Node.js (v16+)
- Yarn or npm
- Rust and Cargo (for Solana contract development)
- Solana CLI tools

### Installation

1. Clone the repository
   \`\`\`
   git clone https://github.com/MagicVial/MagicVial.git
   cd MagicVial
   \`\`\`

2. Install dependencies
   \`\`\`
   yarn install
   \`\`\`

3. Start the development server
   \`\`\`
   yarn dev
   \`\`\`

## Documentation

For more detailed information, see the [documentation](./docs/en/).

## Project Structure

- \`apps/\`: Frontend and backend applications
- \`contracts/\`: Solana smart contracts
- \`docs/\`: Documentation files
- \`shared/\`: Shared code between applications
- \`scripts/\`: Utility scripts

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For any questions or inquiries, please contact us at dev@magicvial.co.
EOL
fi

# Create minimal contract files if they don't exist
for module in material recipe crafting guild token; do
  if [ ! -f "contracts/src/programs/$module/mod.rs" ]; then
    echo "Creating minimal contract file for $module module..."
    mkdir -p "contracts/src/programs/$module"
    cat > "contracts/src/programs/$module/mod.rs" << EOL
use anchor_lang::prelude::*;

// This is a placeholder file for the $module module
// To be implemented based on project requirements
EOL
  fi
done

echo "Project preparation completed successfully!"
exit 0 