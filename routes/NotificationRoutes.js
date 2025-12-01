const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/NotificationController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

router.get('/', NotificationController.getNotifications);
router.put('/:notificationId/read', NotificationController.markAsRead);
router.put('/read-all', NotificationController.markAllAsRead);
router.delete('/:notificationId', NotificationController.deleteNotification);

module.exports = router;