import mongoose, { Document, Schema } from 'mongoose';

// Material interface
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

// Material schema
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
  icon: {
    type: String,
    default: '/images/materials/default.png'
  },
  maxStack: {
    type: Number,
    default: 99,
    min: [1, 'Max stack must be at least 1']
  },
  isTransferable: {
    type: Boolean,
    default: true
  },
  isConsumable: {
    type: Boolean,
    default: false
  },
  isEnabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indexes for efficient queries
MaterialSchema.index({ name: 1 });
MaterialSchema.index({ type: 1 });
MaterialSchema.index({ rarity: 1 });
MaterialSchema.index({ isEnabled: 1 });

// Static methods for common queries
MaterialSchema.static('findByType', function(type: string) {
  return this.find({ type, isEnabled: true });
});

MaterialSchema.static('findByRarity', function(rarity: string) {
  return this.find({ rarity, isEnabled: true });
});

// Pre-save hook to check for unique name
MaterialSchema.pre('save', async function(next) {
  const material = this as IMaterial;
  
  if (material.isModified('name')) {
    const nameExists = await mongoose.models.Material.findOne({ 
      name: material.name, 
      _id: { $ne: material._id } 
    });
    
    if (nameExists) {
      const error = new Error('Material name already exists') as any;
      error.code = 11000; // MongoDB duplicate key error code
      return next(error);
    }
  }
  
  next();
});

// Create and export model
export default mongoose.model<IMaterial>('Material', MaterialSchema); 