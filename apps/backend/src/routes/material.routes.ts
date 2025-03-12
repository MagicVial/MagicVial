import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { 
  getMaterials, 
  getMaterial, 
  createMaterial, 
  updateMaterial, 
  deleteMaterial, 
  getMaterialsByType, 
  getMaterialsByRarity
} from '../controllers/material.controller';
import { auth, authorize } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validateRequest';

const router = express.Router();

/**
 * @route GET /api/materials
 * @desc Get all materials
 * @access Public
 */
router.get('/', getMaterials);

/**
 * @route GET /api/materials/:id
 * @desc Get a single material
 * @access Public
 */
router.get('/:id', [
  param('id').isNumeric().withMessage('Material ID must be numeric')
], validateRequest, getMaterial);

/**
 * @route POST /api/materials
 * @desc Create a new material
 * @access Admin
 */
router.post('/', [
  auth,
  authorize(['admin']),
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  body('description').isString().trim().notEmpty().withMessage('Description is required'),
  body('type').isString().trim().notEmpty().withMessage('Type is required'),
  body('rarity').isString().trim().notEmpty().withMessage('Rarity is required')
], validateRequest, createMaterial);

/**
 * @route PUT /api/materials/:id
 * @desc Update a material
 * @access Admin
 */
router.put('/:id', [
  auth,
  authorize(['admin']),
  param('id').isNumeric().withMessage('Material ID must be numeric'),
  body('name').isString().trim().optional(),
  body('description').isString().trim().optional(),
  body('type').isString().trim().optional(),
  body('rarity').isString().trim().optional()
], validateRequest, updateMaterial);

/**
 * @route DELETE /api/materials/:id
 * @desc Delete a material
 * @access Admin
 */
router.delete('/:id', [
  auth,
  authorize(['admin']),
  param('id').isNumeric().withMessage('Material ID must be numeric')
], validateRequest, deleteMaterial);

/**
 * @route GET /api/materials/type/:type
 * @desc Get materials by type
 * @access Public
 */
router.get('/type/:type', [
  param('type').isString().trim().notEmpty().withMessage('Type is required')
], validateRequest, getMaterialsByType);

/**
 * @route GET /api/materials/rarity/:rarity
 * @desc Get materials by rarity
 * @access Public
 */
router.get('/rarity/:rarity', [
  param('rarity').isString().trim().notEmpty().withMessage('Rarity is required')
], validateRequest, getMaterialsByRarity);

export default router; 