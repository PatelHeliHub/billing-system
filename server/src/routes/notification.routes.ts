import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';

const router = Router();

router.get('/', NotificationController.getUserNotifications);
router.patch('/:id/read', NotificationController.markAsRead);
router.post('/read-all', NotificationController.markAllAsRead);

export default router;
