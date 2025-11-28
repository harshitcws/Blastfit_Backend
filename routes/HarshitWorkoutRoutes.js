const express = require('express');
const router = express.Router();
const HarshitWorkoutController = require('../controllers/HarshitWorkoutController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

router.post('/custom-plan', HarshitWorkoutController.harshitGenerateCustomWorkouts);

module.exports = router;