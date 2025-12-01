const HarshitCustomPlanService = require('../services/HarshitCustomPlanService');

// Generate custom workouts and save to appropriate plan type
exports.harshitGenerateCustomWorkouts = async (req, res) => {
  try {
    const harshitFilters = req.body;
    const harshitUserId = req.user?.id;
    const harshitUserRole = req.user?.role; // ✅ NEW: Get user role
    
    console.log('Harshit: Generating custom workouts for user:', harshitUserId);
    
    // User directly provides workouts
    const harshitGeneratedWorkouts = {
      warmups: harshitFilters.warmups || [],
      main: harshitFilters.main || [],
      finishers: harshitFilters.finishers || []
    };
    
    // Plan data
    const harshitPlanData = {
      title: harshitFilters.title || 'Custom Workout Plan',
      subtitle: harshitFilters.subtitle || 'Created manually',
      description: harshitFilters.description || '',
      duration: harshitFilters.duration || { min: 30, max: 45 },
      calories: harshitFilters.calories || [300],
      workoutTypes: harshitFilters.workoutTypes || ['custom'],
      muscles: harshitFilters.muscles || [],
      sortBy: harshitFilters.sortBy || 'custom',
      difficulty: harshitFilters.difficulty || 'beginner',
      warmups: harshitGeneratedWorkouts.warmups,
      main: harshitGeneratedWorkouts.main,
      finishers: harshitGeneratedWorkouts.finishers,
      totalExercises: harshitFilters.totalExercises || 0,
      totalDuration: harshitFilters.totalDuration || 0,
      totalCalories: harshitFilters.totalCalories || 0
    };
    
    // Create new custom plan
    const harshitSavedPlan = await HarshitCustomPlanService.harshitCreateCustomPlan(
      harshitPlanData, 
      harshitUserId,
      { 
        name: req.user?.name, 
        email: req.user?.email,
        role: harshitUserRole // ✅ NEW: Pass role
      }
    );

    res.json({
      success: true,
      message: 'Harshit: Custom plan created successfully',
      plan: harshitSavedPlan,
      workouts: harshitGeneratedWorkouts
    });

  } catch (error) {
    console.error('Harshit: Generate custom workouts error:', error);
    res.status(500).json({
      success: false,
      message: 'Harshit: Failed to create custom plan: ' + error.message
    });
  }
};