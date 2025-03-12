import { Request, Response } from 'express';
import { Material } from '../models/material.model';
import Logger from '../utils/logger';

/**
 * Get all materials
 * @route GET /api/materials
 */
export const getAllMaterials = async (req: Request, res: Response) => {
  try {
    // Mock data - In a real app, fetch from database
    const materials = await Material.find();
    
    Logger.info(`Retrieved ${materials.length} materials`);
    
    return res.status(200).json({
      success: true,
      count: materials.length,
      data: materials
    });
  } catch (error) {
    Logger.error(`Error retrieving materials: ${error}`);
    
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Error retrieving material list'
    });
  }
};

/**
 * Get single material
 * @route GET /api/materials/:id
 */
export const getMaterialById = async (req: Request, res: Response) => {
  try {
    const material = await Material.findById(req.params.id);
    
    if (!material) {
      Logger.warn(`Attempted to access non-existent material ID: ${req.params.id}`);
      
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Material not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: material
    });
  } catch (error) {
    Logger.error(`Error retrieving material: ${error}`);
    
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Error retrieving material'
    });
  }
};

/**
 * Create new material
 * @route POST /api/materials
 */
export const createMaterial = async (req: Request, res: Response) => {
  try {
    const material = await Material.create(req.body);
    
    Logger.info(`Created new material: ${material.name}`);
    
    return res.status(201).json({
      success: true,
      data: material
    });
  } catch (error) {
    Logger.error(`Error creating material: ${error}`);
    
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Error creating material'
    });
  }
};

/**
 * Update material
 * @route PUT /api/materials/:id
 */
export const updateMaterial = async (req: Request, res: Response) => {
  try {
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!material) {
      Logger.warn(`Attempted to update non-existent material ID: ${req.params.id}`);
      
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Material not found'
      });
    }
    
    Logger.info(`Updated material ID: ${req.params.id}`);
    
    return res.status(200).json({
      success: true,
      data: material
    });
  } catch (error) {
    Logger.error(`Error updating material: ${error}`);
    
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Error updating material'
    });
  }
};

/**
 * Delete material
 * @route DELETE /api/materials/:id
 */
export const deleteMaterial = async (req: Request, res: Response) => {
  try {
    const material = await Material.findByIdAndDelete(req.params.id);
    
    if (!material) {
      Logger.warn(`Attempted to delete non-existent material ID: ${req.params.id}`);
      
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Material not found'
      });
    }
    
    Logger.info(`Deleted material ID: ${req.params.id}`);
    
    return res.status(200).json({
      success: true,
      message: 'Material deleted successfully'
    });
  } catch (error) {
    Logger.error(`Error deleting material: ${error}`);
    
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Error deleting material'
    });
  }
};

/**
 * Get materials by type
 * @route GET /api/materials/type/:type
 */
export const getMaterialsByType = async (req: Request, res: Response) => {
  try {
    const materials = await Material.find({ type: req.params.type });
    
    Logger.info(`Retrieved ${materials.length} materials of type: ${req.params.type}`);
    
    return res.status(200).json({
      success: true,
      count: materials.length,
      data: materials
    });
  } catch (error) {
    Logger.error(`Error retrieving materials by type: ${error}`);
    
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Error retrieving materials by type'
    });
  }
};

/**
 * Get materials by rarity
 * @route GET /api/materials/rarity/:rarity
 */
export const getMaterialsByRarity = async (req: Request, res: Response) => {
  try {
    const materials = await Material.find({ rarity: req.params.rarity });
    
    Logger.info(`Retrieved ${materials.length} materials of rarity: ${req.params.rarity}`);
    
    return res.status(200).json({
      success: true,
      count: materials.length,
      data: materials
    });
  } catch (error) {
    Logger.error(`Error retrieving materials by rarity: ${error}`);
    
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Error retrieving materials by rarity'
    });
  }
}; 