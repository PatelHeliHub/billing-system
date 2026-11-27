import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'secret';
    
    const decoded: any = jwt.verify(token!, secret);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { 
        role: {
          include: { permissions: true }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const authorize = (moduleName: string, permission: 'canView' | 'canCreate' | 'canEdit' | 'canDelete') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !user.role) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    // Admin bypass: Admins have full access to everything
    if (user.role.name === 'Admin') {
      return next();
    }

    const rolePermission = user.role.permissions.find(
      (p: any) => p.moduleName === moduleName
    );

    if (!rolePermission || !rolePermission[permission]) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission for this action' });
    }

    next();
  };
};
