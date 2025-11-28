
// const express = require('express');
// const router = express.Router();

// // ✅ REMOVED: HarshitPreBuiltPlanRoutes
// const HarshitCustomPlanRoutes = require('./HarshitCustomPlanRoutes');
// const HarshitWorkoutRoutes = require('./HarshitWorkoutRoutes');

// // ✅ ONLY custom plans and workouts remain
// router.use('/harshit-custom-plans', HarshitCustomPlanRoutes);
// router.use('/harshit-workouts', HarshitWorkoutRoutes);

// module.exports = router;

const express = require('express');
const router = express.Router();

const HarshitCustomPlanRoutes = require('./HarshitCustomPlanRoutes');
const HarshitWorkoutRoutes = require('./HarshitWorkoutRoutes');

// ✅ REMOVED: HarshitPreBuiltPlanRoutes
router.use('/harshit-custom-plans', HarshitCustomPlanRoutes);
router.use('/harshit-workouts', HarshitWorkoutRoutes);

module.exports = router;
