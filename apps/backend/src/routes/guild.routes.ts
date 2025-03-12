import express, { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';

const router = express.Router();

/**
 * @route GET /api/guilds
 * @desc Get all guilds
 * @access Public
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // This is a mock - in a real application, this would fetch from database
    const guilds = [
      {
        id: 1,
        name: 'Alchemist Association',
        description: 'Focused on advanced potions and magical items',
        level: 5,
        memberCount: 28,
        foundedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        isOpen: true
      },
      {
        id: 2,
        name: 'Herb Collectors Union',
        description: 'Focused on rare materials and basic recipe sharing',
        level: 3,
        memberCount: 15,
        foundedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        isOpen: true
      }
    ];
    
    res.status(200).json({ success: true, data: guilds });
  } catch (error) {
    console.error('Error getting guild list:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @route GET /api/guilds/:id
 * @desc Get guild by ID
 * @access Public
 */
router.get('/:id', [
  param('id').isInt().withMessage('Guild ID must be an integer')
], async (req: Request, res: Response) => {
  // Validate request params
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  try {
    const guildId = parseInt(req.params.id);
    
    // This is a mock - in a real application, this would fetch from database
    const guilds = [
      {
        id: 1,
        name: 'Alchemist Association',
        description: 'Focused on advanced potions and magical items',
        level: 5,
        memberCount: 28,
        foundedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        isOpen: true,
        leader: {
          id: 'user1',
          username: 'Master Alchemist'
        },
        recipes: [
          { id: 5, name: 'Advanced Healing Potion', difficulty: 'Advanced' },
          { id: 8, name: 'Invisibility Potion', difficulty: 'Master' }
        ]
      },
      {
        id: 2,
        name: 'Herb Collectors Union',
        description: 'Focused on rare materials and basic recipe sharing',
        level: 3,
        memberCount: 15,
        foundedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        isOpen: true,
        leader: {
          id: 'user2',
          username: 'Herb Collection Master'
        },
        recipes: [
          { id: 1, name: 'Basic Healing Potion', difficulty: 'Beginner' },
          { id: 3, name: 'Antidote Potion', difficulty: 'Intermediate' }
        ]
      }
    ];
    
    const guild = guilds.find(g => g.id === guildId);
    
    if (!guild) {
      return res.status(404).json({ success: false, error: 'Guild not found' });
    }
    
    res.status(200).json({ success: true, data: guild });
  } catch (error) {
    console.error('Error getting guild:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @route POST /api/guilds
 * @desc Create a new guild
 * @access Private
 */
router.post('/', [
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  body('description').isString().trim().notEmpty().withMessage('Description is required'),
  body('isOpen').isBoolean().optional().withMessage('isOpen must be a boolean')
], async (req: Request, res: Response) => {
  // Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  try {
    // This is a mock - in a real application, this would save to database
    const newGuild = {
      id: 3, // Generated ID
      name: req.body.name,
      description: req.body.description,
      level: 1,
      memberCount: 1, // Creator
      foundedAt: new Date(),
      isOpen: req.body.isOpen !== undefined ? req.body.isOpen : true,
      leader: {
        id: 'currentUser', // In a real application, this would be the current authenticated user's ID
        username: 'Current User'
      }
    };
    
    res.status(201).json({ 
      success: true, 
      data: newGuild, 
      message: 'Guild created successfully' 
    });
  } catch (error) {
    console.error('Error creating guild:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @route POST /api/guilds/join/:id
 * @desc Join a guild
 * @access Private
 */
router.post('/join/:id', [
  param('id').isInt().withMessage('Guild ID must be an integer')
], async (req: Request, res: Response) => {
  // Validate request params
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  try {
    const guildId = parseInt(req.params.id);
    
    // This is a mock - in a real application, this would update database
    // Check if guild exists, is open for joining, etc.
    
    res.status(200).json({ 
      success: true, 
      message: `Successfully joined guild with ID ${guildId}` 
    });
  } catch (error) {
    console.error('Error joining guild:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @route POST /api/guilds/leave/:id
 * @desc Leave a guild
 * @access Private
 */
router.post('/leave/:id', [
  param('id').isInt().withMessage('Guild ID must be an integer')
], async (req: Request, res: Response) => {
  // Validate request params
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  try {
    const guildId = parseInt(req.params.id);
    
    // This is a mock - in a real application, this would update database
    // Check if user is a guild member, not the guild leader, etc.
    
    res.status(200).json({ 
      success: true, 
      message: `Successfully left guild with ID ${guildId}` 
    });
  } catch (error) {
    console.error('Error leaving guild:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @route PUT /api/guilds/:id
 * @desc Update a guild
 * @access Private (Guild Leader)
 */
router.put('/:id', [
  param('id').isInt().withMessage('Guild ID must be an integer'),
  body('name').isString().trim().optional(),
  body('description').isString().trim().optional(),
  body('isOpen').isBoolean().optional()
], async (req: Request, res: Response) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  try {
    const guildId = parseInt(req.params.id);
    
    // This is a mock - in a real application, this would update database
    // Check if user is the guild leader
    
    const updatedGuild = {
      id: guildId,
      name: req.body.name || 'Updated Guild Name',
      description: req.body.description || 'Updated Guild Description',
      level: 1,
      memberCount: 5,
      foundedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      isOpen: req.body.isOpen !== undefined ? req.body.isOpen : true,
      leader: {
        id: 'currentUser',
        username: 'Current User'
      }
    };
    
    res.status(200).json({ 
      success: true, 
      data: updatedGuild, 
      message: 'Guild updated successfully' 
    });
  } catch (error) {
    console.error('Error updating guild:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router; 