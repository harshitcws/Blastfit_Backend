const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  saveMeasurement,
  getAllMeasurements,
  getMeasurementByDate
} = require('../controllers/bodyMeasurementController');

// CREATE or UPDATE
router.post('/save', protect, saveMeasurement);

// GET ALL OF USER
router.get('/:userId', protect, getAllMeasurements);

// GET SPECIFIC DATE
router.get('/:userId/:date', protect, getMeasurementByDate);

module.exports = router;
