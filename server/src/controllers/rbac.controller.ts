import type { Request, Response } from 'express';
import prisma from '../utils/prisma.js';

export class RbacController {
  
  // USER MANAGEMENT
  static async getUsers(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        include: {
          role: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  static async updateUserRole(req: Request, res: Response) {
    try {
      const { userId, roleId } = req.body;
      const currentUser = (req as any).user;

      // 1. Only Admins can modify roles
      if (currentUser?.role?.name !== 'Admin') {
        return res.status(403).json({ error: 'Only Administrators can modify user roles' });
      }

      // 2. Prevent user from changing their own role (Safety Rule)
      if (currentUser?.id === userId) {
        return res.status(400).json({ error: 'You cannot change your own role to avoid accidental lockout' });
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: { roleId },
        include: { role: true }
      });
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: 'Failed to update user role' });
    }
  }

  // ROLE MANAGEMENT
  static async getRoles(req: Request, res: Response) {
    try {
      const roles = await prisma.role.findMany({
        include: { permissions: true }
      });
      res.json(roles);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch roles' });
    }
  }

  static async updatePermissions(req: Request, res: Response) {
    try {
      const { roleId, permissions } = req.body; // permissions: Array of { moduleName, canView, etc. }

      await prisma.$transaction(
        permissions.map((p: any) => 
          prisma.rolePermission.upsert({
            where: { roleId_moduleName: { roleId, moduleName: p.moduleName } },
            update: {
              canView: p.canView,
              canCreate: p.canCreate,
              canEdit: p.canEdit,
              canDelete: p.canDelete
            },
            create: {
              roleId,
              moduleName: p.moduleName,
              canView: p.canView,
              canCreate: p.canCreate,
              canEdit: p.canEdit,
              canDelete: p.canDelete
            }
          })
        )
      );

      res.json({ message: 'Permissions updated successfully' });
    } catch (error) {
      console.error('Update permissions error:', error);
      res.status(400).json({ error: 'Failed to update permissions' });
    }
  }
}
