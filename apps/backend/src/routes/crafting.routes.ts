import express, { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';

const router = express.Router();

/**
 * @route POST /api/crafting/start
 * @desc Start a crafting process
 * @access Private
 */
router.post('/start', [
  body('recipeId').isInt().withMessage('Recipe ID must be an integer'),
  body('materialIds').isArray().withMessage('Material ID list must be an array')
], async (req: Request, res: Response) => {
  // Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  try {
    // This is a mock - in a real application, this would start a crafting process and save to database
    const craftingProcess = {
      id: Math.floor(Math.random() * 1000),
      recipeId: req.body.recipeId,
      startTime: new Date(),
      estimatedCompletionTime: new Date(Date.now() + 60000), // 1 minute later
      status: 'in_progress',
      progress: 0
    };
    
    res.status(200).json({ 
      success: true, 
      data: craftingProcess, 
      message: 'Crafting process started' 
    });
  } catch (error) {
    console.error('Error starting crafting process:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @route GET /api/crafting/status/:id
 * @desc Get crafting process status
 * @access Private
 */
router.get('/status/:id', [
  param('id').isInt().withMessage('Crafting process ID must be an integer')
], async (req: Request, res: Response) => {
  // Validate request params
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  try {
    const craftingId = parseInt(req.params.id);
    
    // This is a mock - in a real application, this would fetch status from database
    const craftingProcess = {
      id: craftingId,
      recipeId: 1,
      startTime: new Date(Date.now() - 30000), // 30 seconds ago
      estimatedCompletionTime: new Date(Date.now() + 30000), // 30 seconds later
      status: 'in_progress',
      progress: 50 // percentage
    };
    
    res.status(200).json({ success: true, data: craftingProcess });
  } catch (error) {
    console.error('Error getting crafting status:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @route POST /api/crafting/complete/:id
 * @desc Complete a crafting process
 * @access Private
 */
router.post('/complete/:id', [
  param('id').isInt().withMessage('Crafting process ID must be an integer')
], async (req: Request, res: Response) => {
  // Validate request params
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  try {
    const craftingId = parseInt(req.params.id);
    
    // This is a mock - in a real application, this would complete the crafting process and update database
    const completedCrafting = {
      id: craftingId,
      recipeId: 1,
      startTime: new Date(Date.now() - 60000), // 1 minute ago
      completionTime: new Date(),
      status: 'completed',
      progress: 100,
      result: {
        success: true,
        itemId: 101,
        name: 'Basic Healing Potion',
        quality: 85 // crafting quality percentage
      }
    };
    
    res.status(200).json({ 
      success: true, 
      data: completedCrafting, 
      message: 'Crafting process completed' 
    });
  } catch (error) {
    console.error('Error completing crafting process:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * @route GET /api/crafting/history
 * @desc Get user crafting history
 * @access Private
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    // This is a mock - in a real application, this would fetch user history from database
    const craftingHistory = [
      {
        id: 1,
        recipeId: 1,
        recipeName: 'Basic Healing Potion',
        startTime: new Date(Date.now() - 3600000), // 1 hour ago
        completionTime: new Date(Date.now() - 3540000), // 59 minutes ago
        status: 'completed',
        result: {
          success: true,
          itemId: 101,
          name: 'Basic Healing Potion',
          quality: 92
        }
      },
      {
        id: 2,
        recipeId: 2,
        recipeName: 'Mana Restoration Potion',
        startTime: new Date(Date.now() - 1800000), // 30 minutes ago
        completionTime: new Date(Date.now() - 1680000), // 28 minutes ago
        status: 'completed',
        result: {
          success: false,
          reason: 'Crafting failed'
        }
      }
    ];
    
    res.status(200).json({ success: true, data: craftingHistory });
  } catch (error) {
    console.error('Error getting crafting history:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router; 