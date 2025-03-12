import express from 'express';
import { param, body } from 'express-validator';
import * as recipeController from '../controllers/recipe.controller';
import { validateRequest } from '../middleware/validateRequest';

const router = express.Router();

/**
 * @route GET /api/recipes
 * @desc Get all recipes
 * @access Public
 */
// This is a mock - in a real application, data would be fetched from a database
router.get('/', recipeController.getAllRecipes);

// Example test data
const testRecipe = {
  id: 1,
  name: 'Basic Healing Potion',
  description: 'A simple potion that restores a small amount of health',
  difficulty: 'Beginner',
  ingredients: [
    { materialId: 1, name: 'Basic Vial', quantity: 1 },
    { materialId: 3, name: 'Autumn Leaf', quantity: 2 }
  ],
  craftingTime: 60, // seconds
  successRate: 90, // percentage
  resultItem: { id: 101, name: 'Basic Healing Potion', rarity: 'Common' }
};

const testRecipe2 = {
  id: 2,
  name: 'Mana Restoration Potion',
  description: 'Restores a moderate amount of mana',
  difficulty: 'Intermediate',
  ingredients: [
    { materialId: 1, name: 'Basic Vial', quantity: 1 },
    { materialId: 2, name: 'Mystic Essence', quantity: 1 }
  ],
  craftingTime: 120, // seconds
  successRate: 75, // percentage
  resultItem: { id: 102, name: 'Mana Restoration Potion', rarity: 'Rare' }
};

/**
 * @route GET /api/recipes/:id
 * @desc Get recipe by ID
 * @access Public
 */
router.get('/:id', 
  param('id').isNumeric().withMessage('Recipe ID must be numeric'),
  validateRequest,
  recipeController.getRecipeById
);

router.get('/user/:userId', recipeController.getUserRecipes);

router.post('/', recipeController.createRecipe);

router.use((err, req, res, next) => {
  console.error('Error retrieving recipes:', err);
  res.status(500).json({ message: 'Server error occurred' });
});

export default router;