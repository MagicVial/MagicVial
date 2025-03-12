import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import * as dotenv from 'dotenv';
import { Connection } from '@solana/web3.js';
import { connectDatabase } from './config/database';
import { errorHandler, notFound } from './middleware/error.middleware';

// Import routes
import materialRoutes from './routes/material.routes';
import recipeRoutes from './routes/recipe.routes';
import craftingRoutes from './routes/crafting.routes';
import guildRoutes from './routes/guild.routes';
import userRoutes from './routes/user.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Solana connection
const solanaNetwork = process.env.SOLANA_NETWORK || 'devnet';
const solanaRpcUrl = process.env.SOLANA_RPC_URL || `https://api.${solanaNetwork}.solana.com`;
const solanaConnection = new Connection(solanaRpcUrl);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Pass solana connection to request
app.use((req: any, res, next) => {
  req.solanaConnection = solanaConnection;
  next();
});

// Routes
app.use('/api/materials', materialRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/crafting', craftingRoutes);
app.use('/api/guilds', guildRoutes);
app.use('/api/users', userRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    message: 'MagicVial API is running',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    solanaNetwork
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Path ${req.path} does not exist on this server`
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : err.name || 'Error',
    message: statusCode === 500 ? 'Something went wrong on our side' : message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`MagicVial API server running on port ${PORT}`);
  console.log(`Connected to Solana ${solanaNetwork} network at ${solanaRpcUrl}`);
});

export default app; 