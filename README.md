# MagicVial

A decentralized crafting and alchemy platform on Solana.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solana](https://img.shields.io/badge/Solana-v1.14-blue)](https://solana.com/)
[![Twitter Follow](https://img.shields.io/twitter/follow/MagicVial_?style=social)](https://x.com/MagicVial_)

## Overview

MagicVial is a blockchain-based platform that allows users to discover, craft, and trade magical items using various materials and recipes. The platform leverages the Solana blockchain for fast and cost-effective transactions.

## Features

- **Advanced Material System**: Different rarities, attributes, and seasonal materials
- **Recipe Discovery**: Discover new recipes through experimentation and exploration
- **Alchemy & Crafting**: Combine materials with varying success rates and rarity outcomes
- **Guild System**: Join guilds for collaborative crafting and enhanced benefits
- **Wallet Integration**: Seamless Solana wallet connection and transaction handling

## Project Structure

```
MagicVial/
├── apps/
│   ├── frontend/             # React frontend application
│   └── backend/              # Node.js backend services
├── contracts/                # Solana smart contracts
│   ├── src/
│   │   └── programs/         # Program modules
│   │       ├── material/     # Material system contract
│   │       ├── recipe/       # Recipe system contract
│   │       ├── crafting/     # Crafting system contract
│   │       ├── guild/        # Guild system contract
│   │       └── token/        # Token functionality
│   └── tests/                # Contract tests
├── docs/                     # Documentation
│   └── en/                   # English documentation
├── scripts/                  # Utility scripts
├── shared/                   # Shared code and types
└── .github/                  # GitHub workflows and templates
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- Yarn or npm
- Rust and Cargo (for Solana contract development)
- Solana CLI tools

### Installation

1. Clone the repository
   ```
   git clone https://github.com/MagicVial/MagicVial.git
   cd MagicVial
   ```

2. Install dependencies
   ```
   yarn install
   ```

3. Set up the development environment
   ```
   ./scripts/prepare_project.sh
   ```

4. Start the development servers
   ```
   yarn dev
   ```

## Development Status

### Completed
- Material system with rarity mechanisms
- Recipe discovery implementation
- Alchemy success rate algorithms
- Contract structure and organization
- Frontend wallet integration

### In Progress
- Guild system enhancements
- Frontend UI improvements
- Testing framework

### Planned
- Analytics dashboard
- Mobile responsiveness
- Additional integration with Solana ecosystem

## Documentation

For more detailed information, see the [documentation](./docs/en/).

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For any questions or inquiries, please contact us at dev@magicvial.co. 