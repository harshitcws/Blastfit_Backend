const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getDashboardStats, getPublicStats } = require('../controllers/dashboardController');
const adminOnly = require('../middleware/adminOnly');

// Get dashboard statistics (Admin only)
router.get('/stats', protect, adminOnly, getDashboardStats);
router.get('/public-stats', getPublicStats);

module.exports = router;