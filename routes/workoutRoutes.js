// routes/workoutRoutes.js
const express = require('express');
const { generatePlanForUser , completeWeeks, fetchRecentWorkouts, getAllPlans, getLatestPlan, updatePlan, deletePlan} = require('../controllers/workoutController');
const { protect } = require('../middleware/authMiddleware'); 
const router = express.Router();
const generateCustomWorkoutPlan = require('../controllers/generateCustomWorkoutPlan');

router.post('/custom-plan', protect, generateCustomWorkoutPlan);


router.post('/generate', protect, generatePlanForUser);
router.post('/complete_weeks', protect, completeWeeks);
router.get('/recent', protect, fetchRecentWorkouts);

// Routes
router.get('/all', protect, getAllPlans);
router.get('/latest', protect, getLatestPlan);
router.put('/updatePlan/:id', protect, updatePlan);
router.delete('/deletePlan/:id', protect, deletePlan);


module.exports = router;
