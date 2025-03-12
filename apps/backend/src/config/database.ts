import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection URI
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '27017';
const DB_NAME = process.env.DB_NAME || 'magicvial';
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;

// Build connection URI
let dbURI: string;

if (DB_USER && DB_PASSWORD) {
  dbURI = `mongodb://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
} else {
  dbURI = `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`;
}

// Connection options
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// Connect to database
export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(dbURI);
    console.log('Successfully connected to MongoDB database');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Listen for connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err: Error) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

// Gracefully close connection
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Application terminated, Mongoose connection closed');
  process.exit(0);
}); 