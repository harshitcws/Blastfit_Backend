// const HarshitPreBuiltPlanService = require('../services/HarshitPreBuiltPlanService');
// const HarshitCustomPlanService = require('../services/HarshitCustomPlanService');

// // Generate custom workouts and save to appropriate plan type
// // exports.harshitGenerateCustomWorkouts = async (req, res) => {
// //   try {
// //     const harshitFilters = req.body;
// //     const harshitUserId = req.user?.id;
    
// //     console.log('Harshit: Generating custom workouts for user:', harshitUserId);
    
// //     // Mock workout generation - replace with your actual logic
// //     const harshitGeneratedWorkouts = await generateWorkoutsBasedOnFilters(harshitFilters);
    
// //     let harshitSavedPlan;
    
// //     if (harshitFilters.planId && harshitFilters.planType === 'preBuilt') {
// //       // Add workouts to existing pre-built plan
// //       harshitSavedPlan = await HarshitPreBuiltPlanService.harshitAddWorkoutsToPreBuiltPlan(
// //         harshitFilters.planId, 
// //         harshitGeneratedWorkouts
// //       );
// //     } else if (harshitFilters.planId && harshitFilters.planType === 'custom') {
// //       // Add workouts to existing custom plan
// //       harshitSavedPlan = await HarshitCustomPlanService.harshitAddWorkoutsToCustomPlan(
// //         harshitFilters.planId, 
// //         harshitUserId, 
// //         harshitGeneratedWorkouts
// //       );
// //     } else {
// //       // Create new custom plan for user
// //       const harshitPlanData = {
// //         title: harshitFilters.title || 'Custom Workout Plan',
// //         subtitle: 'Generated based on your preferences',
// //         duration: {
// //           min: harshitFilters.duration?.[0] || 10,
// //           max: harshitFilters.duration?.[1] || 60
// //         },
// //         calories: harshitFilters.calories || [300],
// //         workoutTypes: harshitFilters.workoutTypes || [],
// //         muscles: harshitFilters.muscles || [],
// //         sortBy: harshitFilters.sortBy || 'popular',
// //         warmups: harshitGeneratedWorkouts.warmups || [],
// //         main: harshitGeneratedWorkouts.main || [],
// //         finishers: harshitGeneratedWorkouts.finishers || [],
// //         difficulty: harshitFilters.difficulty || 'beginner'
// //       };
      
// //       harshitSavedPlan = await HarshitCustomPlanService.harshitCreateCustomPlan(
// //         harshitPlanData, 
// //         harshitUserId,
// //         { name: req.user?.name, email: req.user?.email }
// //       );
// //     }

// //     res.json({
// //       success: true,
// //       plan: harshitSavedPlan,
// //       workouts: harshitGeneratedWorkouts,
// //       planType: harshitFilters.planId ? (harshitFilters.planType === 'preBuilt' ? 'preBuilt' : 'custom') : 'custom'
// //     });

// //   } catch (error) {
// //     console.error('Harshit: Generate custom workouts error:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Harshit: Failed to generate workouts: ' + error.message
// //     });
// //   }
// // };
// exports.harshitGenerateCustomWorkouts = async (req, res) => {
//   try {
//     const harshitFilters = req.body;
//     const harshitUserId = req.user?.id;
    
//     console.log('Harshit: Generating custom workouts for user:', harshitUserId);
    
//     // ✅ FIX: User directly provides workouts, no need to generate
//     const harshitGeneratedWorkouts = {
//       warmups: harshitFilters.warmups || [],
//       main: harshitFilters.main || [],
//       finishers: harshitFilters.finishers || []
//     };
    
//     let harshitSavedPlan;
    
//     // ✅ FIX: Remove planType logic since we're only creating custom plans
//     const harshitPlanData = {
//       title: harshitFilters.title || 'Custom Workout Plan',
//       subtitle: harshitFilters.subtitle || 'Created manually',
//       description: harshitFilters.description || '',
//       duration: harshitFilters.duration || { min: 30, max: 45 },
//       calories: harshitFilters.calories || [300],
//       workoutTypes: harshitFilters.workoutTypes || ['custom'],
//       muscles: harshitFilters.muscles || [],
//       sortBy: harshitFilters.sortBy || 'custom',
//       difficulty: harshitFilters.difficulty || 'beginner',
//       warmups: harshitGeneratedWorkouts.warmups,
//       main: harshitGeneratedWorkouts.main,
//       finishers: harshitGeneratedWorkouts.finishers,
//       totalExercises: harshitFilters.totalExercises || 0,
//       totalDuration: harshitFilters.totalDuration || 0,
//       totalCalories: harshitFilters.totalCalories || 0
//     };
    
//     // ✅ FIX: Always create new custom plan
//     harshitSavedPlan = await HarshitCustomPlanService.harshitCreateCustomPlan(
//       harshitPlanData, 
//       harshitUserId,
//       { name: req.user?.name, email: req.user?.email }
//     );

//     res.json({
//       success: true,
//       message: 'Harshit: Custom plan created successfully',
//       plan: harshitSavedPlan,
//       workouts: harshitGeneratedWorkouts
//     });

//   } catch (error) {
//     console.error('Harshit: Generate custom workouts error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Harshit: Failed to create custom plan: ' + error.message
//     });
//   }
// };
// // Mock workout generation function
// const generateWorkoutsBasedOnFilters = async (filters) => {
//   // Replace this with your actual workout generation logic
//   return {
//     warmups: [
//       {
//         title: "Dynamic Stretching",
//         description: "Warm up your muscles",
//         duration: 300,
//         estCalories: 50,
//         muscles: ["full body"],
//         intensity: "low",
//         type: "warmup"
//       }
//     ],
//     main: [
//       {
//         title: "Push Ups",
//         description: "Basic push ups",
//         duration: 600,
//         estCalories: 100,
//         muscles: ["chest", "arms"],
//         intensity: "medium",
//         type: "main"
//       }
//     ],
//     finishers: [
//       {
//         title: "Cool Down Stretches",
//         description: "Stretch and relax",
//         duration: 300,
//         estCalories: 30,
//         muscles: ["full body"],
//         intensity: "low",
//         type: "finisher"
//       }
//     ]
//   };
// };

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
