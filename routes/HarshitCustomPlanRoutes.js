const express = require('express');
const router = express.Router();
const HarshitCustomPlanController = require('../controllers/HarshitCustomPlanController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// ✅ IMPORTANT: Specific routes MUST come before dynamic routes
router.post('/', HarshitCustomPlanController.harshitCreateCustomPlan);
router.get('/my-plans', HarshitCustomPlanController.harshitGetUserCustomPlans);
router.get('/public', HarshitCustomPlanController.harshitGetPublicPlans);
router.get('/shared-with-me', HarshitCustomPlanController.harshitGetSharedWithMePlans);

// ✅ Dynamic routes come AFTER all specific routes
router.get('/:harshitPlanId', HarshitCustomPlanController.harshitGetCustomPlanDetails);
router.put('/:harshitPlanId', HarshitCustomPlanController.harshitUpdateCustomPlan);
router.delete('/:harshitPlanId', HarshitCustomPlanController.harshitDeleteCustomPlan);
router.post('/:harshitPlanId/workouts', HarshitCustomPlanController.harshitAddWorkoutsToCustomPlan);

// ✅ NEW: Share routes
router.post('/:harshitPlanId/share', HarshitCustomPlanController.harshitShareCustomPlan);
router.post('/:harshitPlanId/unshare', HarshitCustomPlanController.harshitUnshareCustomPlan);
router.post('/:harshitPlanId/accept', HarshitCustomPlanController.harshitAcceptCustomPlanShare);
router.post('/:harshitPlanId/reject', HarshitCustomPlanController.harshitRejectCustomPlanShare);

module.exports = router;