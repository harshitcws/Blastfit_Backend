const express = require('express');
const router = express.Router();
const PlanExerciseProgressController = require('../controllers/PlanExerciseProgressController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

router.post('/complete', PlanExerciseProgressController.completeExercise);
router.get('/plan/:planId', PlanExerciseProgressController.getPlanProgress);
router.get('/shared/:planId', PlanExerciseProgressController.getSharedPlanProgress);

module.exports = router;