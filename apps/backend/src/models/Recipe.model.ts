import mongoose, { Document, Schema } from 'mongoose';

// Material requirement interface
interface IngredientRequirement {
  materialId: mongoose.Types.ObjectId;
  quantity: number;
}

// Result item interface
interface ResultItem {
  id: mongoose.Types.ObjectId;
  name: string;
  rarity: string;
}

// Recipe interface
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

// Recipe schema
const RecipeSchema: Schema = new Schema({
  name: {
    type: String,
    trim: true,
    unique: true,
    required: [true, 'Recipe name is required'],
    minlength: [3, 'Recipe name must be at least 3 characters'],
    maxlength: [100, 'Recipe name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    required: [true, 'Recipe description is required'],
    minlength: [10, 'Recipe description must be at least 10 characters'],
    maxlength: [1000, 'Recipe description cannot exceed 1000 characters']
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
  craftingTime: {
    type: Number,
    required: [true, 'Crafting time is required'],
    min: [1, 'Crafting time must be at least 1 second']
  },
  successRate: {
    type: Number,
    required: [true, 'Success rate is required'],
    min: [1, 'Success rate must be at least 1%'],
    max: [100, 'Success rate cannot exceed 100%']
  },
  resultItem: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Result item ID is required']
    },
    name: {
      type: String,
      required: [true, 'Result item name is required']
    },
    rarity: {
      type: String,
      required: [true, 'Result item rarity is required']
    }
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  isEnabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indexes for efficient queries
RecipeSchema.index({ name: 1 });
RecipeSchema.index({ difficulty: 1 });
RecipeSchema.index({ creator: 1 });
RecipeSchema.index({ 'resultItem.rarity': 1 });
RecipeSchema.index({ isEnabled: 1 });

export default mongoose.model<IRecipe>('Recipe', RecipeSchema); 