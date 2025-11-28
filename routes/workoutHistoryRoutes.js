


const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {WorkoutHistory} = require('../controllers/workoutHistoryController');
const { getWorkoutHistory } = require('../controllers/workoutHistoryController');



console.log("Workout History Routes loaded");
router.post('/complete', protect, WorkoutHistory);
router.get('/Workouthistory/:userId', getWorkoutHistory);

module.exports = router;
