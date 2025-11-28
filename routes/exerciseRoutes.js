const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getAllExercises,
  getExerciseById,
  createExercise,
  searchExercises,
  updateExercise,
  deleteExercise,
  updateExerciseViews,
  enrichExercises,
  filterExercises,
  features
} = require('../controllers/exerciseController');
const adminOnly = require('../middleware/adminOnly');

// Enrich exercises (Admin only)
router.post('/enrich', protect, adminOnly, enrichExercises);

// Search exercises
router.get('/search', protect, searchExercises);

// filter based on muscles and difficulty
router.get('/filter', protect, filterExercises);

// Get all exercises
router.get('/GetAllExercises', protect, getAllExercises);
router.get('/by-equipment', protect, features) ;
// Get single exercise by ID
router.get('/GetSingleExercise/:id', protect, getExerciseById);

// Create new exercise (Admin only)
router.post('/CreateNewExercise', protect, adminOnly, createExercise);

// Update exercise by ID (Admin only)
router.put('/UpdateExerciseByID/:id', protect, adminOnly, updateExercise);

// Delete exercise by ID (Admin only)
router.delete('/DeleteExerciseByID/:id', protect, adminOnly, deleteExercise);

// Increment exercise views (partial update)
router.patch('/IncrementExerciseViews/:id', protect, updateExerciseViews);
// Get exercises grouped by equipment (for features)

module.exports = router;
