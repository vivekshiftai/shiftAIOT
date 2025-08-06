import express from 'express';
import { notificationService } from '../services/notificationService';
import { authenticateToken, requirePermission, AuthRequest } from '../middleware/auth';
import { createRateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);
router.use(createRateLimiter('api'));

// Get all notifications
router.get('/', requirePermission('notification:read'), async (req: AuthRequest, res) => {
  try {
    const notifications = await notificationService.getNotifications(
      req.user!.organization_id,
      req.user!.id
    );
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Mark notification as read
router.patch('/:id/read', requirePermission('notification:write'), async (req: AuthRequest, res) => {
  try {
    await notificationService.markAsRead(req.params.id, req.user!.organization_id);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Mark all notifications as read
router.patch('/read-all', requirePermission('notification:write'), async (req: AuthRequest, res) => {
  try {
    await notificationService.markAllAsRead(req.user!.organization_id, req.user!.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Create notification (for testing)
router.post('/', requirePermission('notification:write'), async (req: AuthRequest, res) => {
  try {
    const notification = await notificationService.createNotification({
      ...req.body,
      organization_id: req.user!.organization_id,
      user_id: req.user!.id
    });
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;