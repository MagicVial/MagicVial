# Development Guide

This document provides comprehensive instructions for setting up your development environment and working with the MagicVial codebase.

## Development Environment Setup

### Prerequisites

Before you start, make sure you have the following tools installed:

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **Rust** (v1.65 or higher)
- **Solana CLI** (v1.16 or higher)
- **Anchor Framework** (v0.27 or higher)
- **Git** (v2.30 or higher)

### Setting Up Solana Development Environment

1. Install Solana CLI:

```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.16.0/install)"
```

2. Install Anchor Framework:

```bash
npm install -g @coral-xyz/anchor-cli
```

3. Set up a local Solana validator:

```bash
solana-test-validator
```

### Project Setup

1. Clone the repository:

```bash
git clone https://github.com/magicvial-co/magicvial.git
cd magicvial
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit the `.env` file with your local configuration.

## Project Structure

The MagicVial project follows a modular architecture:

```
MagicVial/
├── apps/                         # Application code
│   ├── frontend/                 # React frontend
│   │   ├── public/               # Static assets
│   │   ├── src/                  # Source code
│   │   │   ├── components/       # UI components
│   │   │   ├── contexts/         # React contexts
│   │   │   ├── hooks/            # Custom hooks
│   │   │   ├── pages/            # Page components
│   │   │   ├── services/         # Service layers
│   │   │   └── utils/            # Utility functions
│   │   ├── package.json          # Frontend dependencies
│   │   └── vite.config.js        # Vite configuration
│   └── backend/                  # Node.js backend
│       ├── src/                  # Source code
│       │   ├── api/              # API routes
│       │   ├── config/           # Configuration
│       │   ├── controllers/      # Request handlers
│       │   ├── middleware/       # Express middleware
│       │   ├── models/           # Data models
│       │   └── services/         # Business logic
│       └── package.json          # Backend dependencies
├── contracts/                    # Solana smart contracts
│   ├── programs/                 # Anchor programs
│   │   └── magicvial/            # MagicVial program
│   │       ├── src/              # Contract source code
│   │       └── Cargo.toml        # Rust dependencies
│   ├── tests/                    # Contract tests
│   └── Anchor.toml               # Anchor configuration
├── docs/                         # Documentation
├── scripts/                      # Utility scripts
└── shared/                       # Shared libraries and types
    ├── types/                    # TypeScript type definitions
    └── utils/                    # Shared utility functions
```

## Development Workflow

### Frontend Development

The frontend is built with React and Vite.

1. Start the frontend development server:

```bash
cd apps/frontend
npm start
```

This will launch the development server at `http://localhost:3000`.

2. Building for production:

```bash
cd apps/frontend
npm run build
```

This will create optimized production files in the `dist` directory.

### Backend Development

The backend is built with Node.js and Express.

1. Start the backend development server:

```bash
cd apps/backend
npm start
```

This will launch the API server at `http://localhost:4000`.

2. Running tests:

```bash
cd apps/backend
npm test
```

### Smart Contract Development

The smart contracts are built with Rust and the Anchor framework.

1. Build the smart contracts:

```bash
cd contracts
anchor build
```

2. Deploy to localnet:

```bash
cd contracts
anchor deploy
```

3. Running tests:

```bash
cd contracts
anchor test
```

## Testing

### Unit Testing

For frontend and backend:

```bash
npm run test:unit
```

### Integration Testing

For API and service integration:

```bash
npm run test:integration
```

### End-to-End Testing

For complete application flow:

```bash
npm run test:e2e
```

## Debugging

### Frontend Debugging

- Use the React Developer Tools browser extension
- Check browser console (F12) for errors
- Use `console.log()` statements in your code

### Backend Debugging

- Check server logs
- Use tools like Postman to test API endpoints
- Add `console.log()` statements in your code

### Smart Contract Debugging

- Use Anchor's logging with `msg!` macro
- Inspect transaction logs with `solana logs`
- Use Anchor's error handling for descriptive errors

## Code Conventions

### TypeScript

- Use strict typing
- Follow the ESLint configuration
- Use async/await for asynchronous code
- Document public functions and interfaces

### Rust

- Follow Rust's official style guide
- Use Rust's Result and Option types for error handling
- Document public functions with rustdoc comments
- Write comprehensive tests for all functionality

## Deployment

### Frontend Deployment

1. Build the production files:

```bash
cd apps/frontend
npm run build
```

2. Deploy to your hosting provider (e.g., Vercel, Netlify).

### Backend Deployment

1. Build the production files:

```bash
cd apps/backend
npm run build
```

2. Deploy to your hosting provider (e.g., AWS, Heroku).

### Smart Contract Deployment

1. Build the smart contracts:

```bash
cd contracts
anchor build
```

2. Deploy to Solana mainnet:

```bash
solana config set --url mainnet-beta
anchor deploy
```

## Continuous Integration

The project uses GitHub Actions for CI/CD:

- Linting and type checking
- Running unit and integration tests
- Building production assets
- Deploying to staging and production environments

## Additional Resources

- [Solana Documentation](https://docs.solana.com/)
- [Anchor Framework Documentation](https://www.anchor-lang.com/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Troubleshooting

### Common Issues

1. **Solana connection errors**:
   - Make sure your local validator is running
   - Check network configuration in `.env`
   - Verify wallet connection

2. **Build errors**:
   - Ensure all dependencies are installed
   - Check for TypeScript errors
   - Validate Rust compilation

3. **Test failures**:
   - Ensure test environment is properly set up
   - Check for stale test data
   - Verify test configuration

If you encounter any issues not covered here, please open a GitHub issue or contact the development team at dev@magicvial.co. 