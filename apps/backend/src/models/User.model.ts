import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// User interface
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

// User schema
const UserSchema: Schema = new Schema({
  walletAddress: {
    type: String,
    required: [true, 'Wallet address is required'],
    unique: true,
    trim: true
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  avatar: {
    type: String,
    default: '/images/avatars/default.png'
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  experience: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  achievements: [{
    type: String
  }],
  joinedGuilds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guild'
  }],
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indexes for efficient queries
UserSchema.index({ walletAddress: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ level: -1 });

// Calculate level before saving
UserSchema.pre('save', async function(next) {
  if (this.isModified('experience')) {
    this.level = this.calculateLevel();
  }
  next();
});

// Method to calculate level
UserSchema.methods.calculateLevel = function(): number {
  // Simple formula to calculate level based on experience
  // For example, 1 level for every 1000 experience points
  return Math.floor(this.experience / 1000) + 1;
};

// Generate JWT token
UserSchema.methods.generateAuthToken = function(): string {
  const token = jwt.sign(
    { id: this._id, walletAddress: this.walletAddress, role: this.role },
    process.env.JWT_SECRET || 'defaultsecret',
    { expiresIn: '1d' }
  );
  return token;
};

// Static methods
UserSchema.statics.findByWalletAddress = function(walletAddress: string) {
  return this.findOne({ walletAddress });
};

UserSchema.statics.findTopByLevel = function(limit: number = 10) {
  return this.find({ isActive: true })
    .sort({ level: -1, experience: -1 })
    .limit(limit);
};

UserSchema.statics.findTopByReputation = function(limit: number = 10) {
  return this.find({ isActive: true })
    .sort({ reputation: -1 })
    .limit(limit);
};

// Create and export model
export default mongoose.model<IUser>('User', UserSchema); 