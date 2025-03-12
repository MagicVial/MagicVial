import express, { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { auth, authorize } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @route POST /api/users/register
 * @desc Register a new user with wallet
 * @access Public
 */
router.post('/register', [
  body('walletAddress').isString().trim().notEmpty().withMessage('Wallet address is required'),
  body('username').isString().trim().notEmpty().withMessage('Username is required'),
  body('email').isEmail().optional().withMessage('Please provide a valid email address'),
  body('avatar').isString().optional()
], async (req: Request, res: Response) => {
  // Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  try {
    const { walletAddress, username, email, avatar } = req.body;
    
    // This is a mock - in a real application, check if wallet address already exists, then save to database
    // Also check if username is already in use
    
    // Create new user
    const newUser = {
      id: 'user' + Math.floor(Math.random() * 1000),
      walletAddress,
      username,
      email: email || null,
      avatar: avatar || '/images/avatars/default.png',
      role: 'user',
      experience: 0,
      level: 1,
      reputation: 0,
      joinedAt: new Date(),
      lastLogin: new Date()
    };
    
    // Generate authentication token
    const token = 'mock_jwt_token';
    
    res.status(201).json({
      success: true,
      data: {
        user: newUser,
        token
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Error registering user:', error);
    
    // Handle duplicate key error
    if ((error as any).code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address or username already exists',
        message: 'Please use a different wallet address or username'
      });
    }
    
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @route POST /api/users/login
 * @desc Log in a user with wallet signature
 * @access Public
 */
router.post('/login', [
  body('walletAddress').isString().trim().notEmpty().withMessage('Wallet address is required'),
  body('signature').isString().optional().withMessage('Signature is required')
], async (req: Request, res: Response) => {
  // Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  try {
    const { walletAddress, signature } = req.body;
    
    // This is a mock - in a real application, verify signature and get user from database
    
    // Find user
    const user = {
      id: 'user123',
      walletAddress,
      username: 'Test User',
      email: 'test@example.com',
      avatar: '/images/avatars/default.png',
      role: 'user',
      experience: 1500,
      level: 2,
      reputation: 120,
      joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      lastLogin: new Date()
    };
    
    // Generate authentication token
    const token = 'mock_jwt_token';
    
    // Update last login time
    // In a real application, this would be updated in the database
    
    res.status(200).json({
      success: true,
      data: {
        user,
        token
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @route GET /api/users/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', auth, async (req: Request, res: Response) => {
  try {
    // In a real application, user info would be retrieved from req.user
    // For demo purposes, mock data is used here
    const user = {
      id: 'user123',
      walletAddress: '0x1234567890abcdef',
      username: 'Current User',
      email: 'user@example.com',
      avatar: '/images/avatars/user123.png',
      role: 'user',
      experience: 3500,
      level: 4,
      reputation: 250,
      joinedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      achievements: [
        { id: 1, name: 'Novice Alchemist', description: 'Complete your first crafting', unlockedAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000) },
        { id: 3, name: 'Material Collector', description: 'Collect 10 different materials', unlockedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) }
      ],
      stats: {
        recipesCreated: 5,
        itemsCrafted: 28,
        craftingSuccessRate: 82
      }
    };
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @route PUT /api/users/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', [
  auth,
  body('username').isString().trim().optional(),
  body('email').isEmail().optional().withMessage('Please provide a valid email address'),
  body('avatar').isString().optional()
], async (req: Request, res: Response) => {
  // Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  try {
    // In a real application, user info would be retrieved from req.user
    // and then updated in the database
    
    // Mock updated user
    const updatedUser = {
      id: 'user123',
      walletAddress: '0x1234567890abcdef',
      username: req.body.username || 'Updated Username',
      email: req.body.email || 'updated@example.com',
      avatar: req.body.avatar || '/images/avatars/user123.png',
      role: 'user',
      experience: 3500,
      level: 4,
      reputation: 250
    };
    
    res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'User profile updated'
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    
    // Handle duplicate key error
    if ((error as any).code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Username already exists',
        message: 'Please use a different username'
      });
    }
    
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @route GET /api/users/inventory
 * @desc Get user's material inventory
 * @access Private
 */
router.get('/inventory', auth, async (req: Request, res: Response) => {
  try {
    // In a real application, this would be retrieved from the database
    // based on the currently authenticated user
    
    // Mock user inventory
    const inventory = [
      { materialId: 1, name: 'Basic Potion Bottle', type: 'Basic', rarity: 'Common', quantity: 15, imageUrl: '/images/materials/potion_bottle.png' },
      { materialId: 2, name: 'Mystic Essence', type: 'Rare', rarity: 'Rare', quantity: 5, imageUrl: '/images/materials/essence.png' },
      { materialId: 3, name: 'Autumn Leaf', type: 'Seasonal', rarity: 'Common', quantity: 30, imageUrl: '/images/materials/autumn_leaf.png' },
      { materialId: 4, name: 'Dragon Breath Flower', type: 'Rare', rarity: 'Epic', quantity: 2, imageUrl: '/images/materials/dragon_flower.png' }
    ];
    
    res.status(200).json({ success: true, data: inventory });
  } catch (error) {
    console.error('Error getting user inventory:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @route GET /api/users/crafted-items
 * @desc Get user's crafted items
 * @access Private
 */
router.get('/crafted-items', auth, async (req: Request, res: Response) => {
  try {
    // In a real application, this would be retrieved from the database
    // based on the currently authenticated user
    
    // Mock user crafted items
    const craftedItems = [
      { id: 101, name: 'Basic Healing Potion', description: 'A simple potion that restores a small amount of health', rarity: 'Common', quantity: 5, craftedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), quality: 85 },
      { id: 102, name: 'Mana Restoration Elixir', description: 'An elixir that restores a moderate amount of mana', rarity: 'Rare', quantity: 2, craftedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), quality: 78 },
      { id: 103, name: 'Invisibility Potion', description: 'Become invisible for a short time after use', rarity: 'Epic', quantity: 1, craftedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), quality: 92 }
    ];
    
    res.status(200).json({ success: true, data: craftedItems });
  } catch (error) {
    console.error('Error getting user crafted items:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router; 