import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';

// Extend Request interface to include user information
declare global {
  namespace Express {
    interface Request {
      user?: any;
      token?: string;
    }
  }
}

/**
 * Authentication middleware
 * Validates user JWT token and adds user information to the request object
 */
export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token not provided',
        message: 'Please provide a valid authentication token'
      });
    }
    
    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_here') as any;
    
    // Find user
    const user = await User.findOne({ _id: decoded.id, isActive: true });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User does not exist or is inactive',
        message: 'Authorization failed'
      });
    }
    
    // Add user and token to request object
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if ((error as any).name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Authorization failed'
      });
    }
    
    if ((error as any).name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Please log in again'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Problem occurred during authentication'
    });
  }
};

/**
 * Role authorization middleware
 * Checks if user has the required role
 */
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
        message: 'Please log in first'
      });
    }
    
    const hasRole = roles.includes(req.user.role);
    
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'You do not have permission to perform this action'
      });
    }
    
    next();
  };
}; 