const express = require('express');
const {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} = require('../controllers/notificationController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Static routes before parameterized routes
router.get('/notifications', authenticate, getNotifications);
router.get('/notifications/unread-count', authenticate, getUnreadCount);
router.patch('/notifications/read-all', authenticate, markAllNotificationsRead);

// Parameterized routes
router.patch('/notifications/:notificationId/read', authenticate, markNotificationRead);
router.delete('/notifications/:notificationId', authenticate, deleteNotification);

module.exports = router;
