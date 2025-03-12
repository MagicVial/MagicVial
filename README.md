# MagicVial - Solana-based Alchemy Game

<p align="center">
  <img src="assets/logos/magicvial_logo.svg" alt="MagicVial Logo" width="200">
</p>

<h1 align="center">MagicVial - Solana-based Alchemy Game</h1>

<p align="center">
  <a href="https://magicvial.co">Website</a> •
  <a href="https://x.com/magicVial_AI_">Twitter</a> •
  <a href="https://github.com/MagicVial/MagicVial">GitHub</a>
</p>

## Project Overview

MagicVial is a decentralized alchemy game built on the Solana blockchain that allows players to collect materials, discover recipes, and craft magical potions and items. The game leverages blockchain technology to provide true ownership of in-game assets and an immersive crafting experience.

## Table of Contents

- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Core Systems](#core-systems)
- [Data Models](#data-models)
- [Key Components](#key-components)
- [Authentication Flow](#authentication-flow)
- [Crafting Process](#crafting-process)
- [Blockchain Integration](#blockchain-integration)
- [API Documentation](#api-documentation)
- [Development Setup](#development-setup)
- [Deployment](#deployment)

## Architecture

MagicVial follows a modern full-stack architecture with a clear separation between frontend and backend services, enhanced with Solana blockchain integration:

```
MagicVial/
├── apps/
│   ├── frontend/          # React-based web application
│   │   ├── public/        # Static assets
│   │   ├── src/           # Source code
│   │   │   ├── components/# Reusable UI components
│   │   │   ├── contexts/  # React context providers
│   │   │   ├── hooks/     # Custom React hooks
│   │   │   ├── pages/     # Page components
│   │   │   ├── services/  # API and blockchain interaction services
│   │   │   ├── styles/    # Global styles and themes
│   │   │   ├── types/     # TypeScript type definitions
│   │   │   └── utils/     # Utility functions
│   │   └── ...
│   │
│   └── backend/           # Node.js API service
│       ├── src/
│       │   ├── config/    # Configuration files
│       │   ├── controllers/# Request handlers
│       │   ├── middleware/# Express middleware
│       │   ├── models/    # Database models
│       │   ├── routes/    # API route definitions
│       │   ├── services/  # Business logic services
│       │   ├── types/     # TypeScript type definitions
│       │   └── utils/     # Utility functions
│       └── ...
│
├── programs/              # Solana smart contracts
│   ├── materials/         # Materials program
│   ├── recipes/           # Recipes program
│   └── crafting/          # Crafting program
│
└── tests/                 # Integration and unit tests
```

The architecture follows these key principles:

1. **Separation of Concerns**: Clear division between presentation, business logic, and data access
2. **Modularity**: Components and services are designed to be reusable and self-contained
3. **Type Safety**: Comprehensive TypeScript typing throughout the codebase
4. **Blockchain Integration**: Seamless integration with the Solana blockchain

## Technology Stack

### Frontend
- **React 18**: Component-based UI library
- **TypeScript**: For type safety and improved developer experience
- **Styled Components**: CSS-in-JS styling solution
- **React Context API**: For state management
- **React Router**: For client-side routing
- **Wallet Adapter**: For Solana wallet integration

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web framework for API endpoints
- **TypeScript**: For type safety
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: For authentication
- **Winston**: For logging

### Blockchain
- **Solana**: High-performance blockchain
- **Solana Web3.js**: For blockchain interactions
- **Anchor Framework**: For program development and interaction
- **SPL Token**: For token operations

### Development Tools
- **ESLint/Prettier**: For code formatting and linting
- **Jest**: For testing
- **Yarn/NPM**: For package management
- **Git**: For version control

## Core Systems

### Material System

Materials are the building blocks of the alchemy system, with different types and rarities that affect their value and utility in crafting.

#### Material Types
- Basic: Common ingredients used in simple recipes
- Rare: Special ingredients that enhance crafting results
- Seasonal: Time-limited materials available during special events
- Mystic: Powerful materials with special properties

#### Material Rarity
- Common: Easily obtainable
- Rare: Less common, requires effort to find
- Epic: Very rare, provides significant benefits
- Legendary: Extremely rare, powerful effects

```typescript
// Material Model
export interface IMaterial extends Document {
  name: string;
  description: string;
  type: 'Basic' | 'Rare' | 'Seasonal' | 'Mystic';
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  icon: string;
  maxStack: number;
  isTransferable: boolean;
  isConsumable: boolean;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Recipe System

Recipes define how materials can be combined to create potions and items. They have different difficulty levels and success rates.

```typescript
// Recipe Model
export interface IRecipe extends Document {
  name: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Master';
  ingredients: IngredientRequirement[];
  craftingTime: number; // in seconds
  successRate: number; // percentage, 1-100
  resultItem: ResultItem;
  creator: mongoose.Types.ObjectId;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### User System

The user system manages profiles, inventories, and crafting progress.

```typescript
// User Model
export interface IUser extends Document {
  walletAddress: string;
  username: string;
  email?: string;
  avatar?: string;
  bio?: string;
  role: 'user' | 'moderator' | 'admin';
  experience: number;
  level: number;
  achievements: string[];
  joinedGuilds: mongoose.Types.ObjectId[];
  lastLogin: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  calculateLevel(): number;
  generateAuthToken(): string;
}
```

## Data Models

### Material Schema
```typescript
const MaterialSchema: Schema = new Schema({
  name: {
    type: String,
    trim: true,
    unique: true,
    required: [true, 'Material name is required'],
    minlength: [2, 'Material name must be at least 2 characters'],
    maxlength: [50, 'Material name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    required: [true, 'Material description is required'],
    minlength: [10, 'Material description must be at least 10 characters'],
    maxlength: [500, 'Material description cannot exceed 500 characters']
  },
  type: {
    type: String,
    required: [true, 'Material type is required'],
    enum: ['Basic', 'Rare', 'Seasonal', 'Mystic'],
    default: 'Basic'
  },
  rarity: {
    type: String,
    required: [true, 'Material rarity is required'],
    enum: ['Common', 'Rare', 'Epic', 'Legendary'],
    default: 'Common'
  },
  // Additional fields...
}, {
  timestamps: true
});
```

### Recipe Schema
```typescript
const RecipeSchema: Schema = new Schema({
  name: {
    type: String,
    trim: true,
    unique: true,
    required: [true, 'Recipe name is required'],
    minlength: [3, 'Recipe name must be at least 3 characters'],
    maxlength: [100, 'Recipe name cannot exceed 100 characters']
  },
  difficulty: {
    type: String,
    required: [true, 'Difficulty is required'],
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Master'],
    default: 'Beginner'
  },
  ingredients: [{
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
      required: [true, 'Material ID is required']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    }
  }],
  // Additional fields...
}, {
  timestamps: true
});
```

## Key Components

### Recipe Page

The Recipes page is a core component that allows users to browse, filter, and initiate crafting of recipes.

```typescript
const RecipesPage: React.FC = () => {
  // State management for recipes
  const { connected, publicKey } = useWallet();
  const { recipes, userRecipes, loading, error } = useRecipes();
  const { materials, userMaterials } = useMaterials();
  
  // Check if user has the necessary materials
  const canCraftRecipe = (recipe: Recipe): boolean => {
    if (!connected || !userMaterials) return false;
    
    return recipe.ingredients.every(ingredient => {
      const userMaterial = userMaterials.find(m => m.id === ingredient.materialId);
      return userMaterial && userMaterial.quantity >= ingredient.quantity;
    });
  };
  
  // Start crafting process
  const handleStartCrafting = async (recipeId: string) => {
    if (!connected || !publicKey) return;
    
    try {
      // Initiate crafting transaction
      // In a production environment, this would interact with Solana
    } catch (error) {
      console.error('Crafting error:', error);
    }
  };
  
  // Render recipe cards, filters, and details
}
```

### Authentication Flow

The authentication system uses wallet-based authentication with JWT tokens for API authorization.

```typescript
// Authentication middleware
export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token not provided',
        message: 'Please provide a valid authentication token'
      });
    }
    
    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_here') as any;
    
    // Find user
    const user = await User.findOne({ _id: decoded.id, isActive: true });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User does not exist or is inactive',
        message: 'Authorization failed'
      });
    }
    
    // Add user and token to request object
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    // Error handling...
  }
};
```

## Data Flow

The application implements a unidirectional data flow pattern:

1. **User Interaction**: The user interacts with the UI (e.g., selects a recipe to craft)
2. **Context/Service**: The relevant context or service processes the interaction
3. **API Request**: If needed, an API request is made to the backend
4. **Business Logic**: The backend processes the request, applying business rules
5. **Database Operation**: If needed, the backend performs database operations
6. **Blockchain Interaction**: If required, the backend or frontend interacts with the Solana blockchain
7. **Response**: The result is returned to the UI
8. **State Update**: The UI state is updated to reflect the changes
9. **Re-render**: Components are re-rendered to display the new state

### Example Flow: Crafting a Recipe

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ User selects│     │ Frontend    │     │ Backend API │     │ Solana      │
│ a recipe to │────►│ validates   │────►│ processes   │────►│ blockchain  │
│ craft       │     │ materials   │     │ crafting    │     │ transaction │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                           │                                       │
                           │                                       │
                           ▼                                       ▼
                    ┌─────────────┐                        ┌─────────────┐
                    │ Update UI   │◄───────────────────────│ Transaction │
                    │ with result │                        │ confirmation │
                    └─────────────┘                        └─────────────┘
```

## Blockchain Integration

The application integrates with the Solana blockchain through a set of utility functions and services.

### Solana Utilities

```typescript
export class SolanaUtils {
  private connection: Connection;
  private endpoint: string;
  
  constructor(endpoint?: string) {
    this.endpoint = endpoint || process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    this.connection = new Connection(this.endpoint, 'confirmed');
  }
  
  async getBalance(publicKey: string): Promise<number> {
    try {
      const pubKey = new PublicKey(publicKey);
      const balance = await this.connection.getBalance(pubKey);
      return balance / 1e9; // Convert to SOL
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw new Error('Error getting account balance');
    }
  }
  
  // Additional methods for blockchain interactions...
}
```

## API Documentation

The backend API provides endpoints for managing materials, recipes, users, and crafting operations.

### Material Endpoints

```
GET    /api/materials        - Get all materials
GET    /api/materials/:id    - Get a single material
POST   /api/materials        - Create a new material (Admin)
PUT    /api/materials/:id    - Update a material (Admin)
DELETE /api/materials/:id    - Delete a material (Admin)
GET    /api/materials/type/:type    - Get materials by type
GET    /api/materials/rarity/:rarity - Get materials by rarity
```

### Recipe Endpoints

```
GET    /api/recipes          - Get all recipes
GET    /api/recipes/:id      - Get a recipe by ID
GET    /api/recipes/user/:userId - Get user's discovered recipes
POST   /api/recipes          - Create a new recipe
```

### User Endpoints

```
POST   /api/users/register   - Register a new user
POST   /api/users/login      - Log in a user
GET    /api/users/profile    - Get current user profile
PUT    /api/users/profile    - Update user profile
GET    /api/users/inventory  - Get user's material inventory
GET    /api/users/crafted-items - Get user's crafted items
```

## Development Setup

### Prerequisites

- Node.js (v16+)
- MongoDB
- Yarn or NPM
- Solana CLI tools (for blockchain development)
- A Solana wallet (Phantom, Solflare, etc.)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/MagicVial/MagicVial.git
   cd MagicVial
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in both `apps/frontend` and `apps/backend`
   - Configure the environment variables as needed

4. Start the development servers:
   ```bash
   # Start the backend
   cd apps/backend
   yarn dev
   
   # In a separate terminal, start the frontend
   cd apps/frontend
   yarn dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Deployment

### Frontend Deployment

1. Build the frontend:
   ```bash
   cd apps/frontend
   yarn build
   ```

2. Deploy the built files to your hosting service (e.g., Vercel, Netlify, AWS S3)

### Backend Deployment

1. Build the backend:
   ```bash
   cd apps/backend
   yarn build
   ```

2. Deploy to your server or cloud provider (e.g., Heroku, AWS, DigitalOcean)

### Solana Program Deployment

1. Build the Solana programs:
   ```bash
   cd programs
   anchor build
   ```

2. Deploy to Solana devnet for testing:
   ```bash
   anchor deploy --provider.cluster devnet
   ```

3. After thorough testing, deploy to Solana mainnet

## Future Roadmap

1. **Phase 1: Core Gameplay**
   - Material collection
   - Basic crafting
   - Recipe discovery

2. **Phase 2: Social Features**
   - Guilds system
   - Trading marketplace
   - Collaborative crafting

3. **Phase 3: Advanced Mechanics**
   - Recipe creation by players
   - Rare material expeditions
   - Special crafting events

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Developed with ❤️ by the MagicVial Team 