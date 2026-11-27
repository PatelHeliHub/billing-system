import type { Request, Response } from 'express';
import prisma from '../utils/prisma.js';

export class NotificationController {
  
  static async getUserNotifications(req: Request, res: Response) {
    try {
      // In a real app, userId would come from req.user.id (auth middleware)
      // Since we are mocking/simplified, we can get userId from query or body
      // But for POS/Dashboard, let's just get the first admin's notifications for now
      // or all if no user specified to simulate the panel.
      const { userId } = req.query;

      const where: any = {};
      if (userId) where.userId = String(userId);

      const notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      const unreadCount = await prisma.notification.count({
        where: { ...where, isRead: false }
      });

      res.json({ notifications, unreadCount });
    } catch (error) {
      console.error('Fetch notifications error:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }

  static async markAsRead(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      
      const notification = await prisma.notification.update({
        where: { id },
        data: { isRead: true }
      });

      res.json(notification);
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(400).json({ error: 'Failed to update notification' });
    }
  }

  static async markAllAsRead(req: Request, res: Response) {
    try {
      const { userId } = req.body;
      
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      });

      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Mark all as read error:', error);
      res.status(400).json({ error: 'Failed to update notifications' });
    }
  }
}
