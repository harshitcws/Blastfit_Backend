// controllers/workoutController.js
const generateWorkoutPlan = require('../services/generateWorkoutPlan');
const User = require('../models/user');
const WorkoutPlan = require('../models/WorkoutPlan');
const Exercise = require('../models/exercise');

// Generate workout plan for user
exports.generatePlanForUser = async (req, res) => {
  console.log('🔄 Generating workout plan for user:', req.user.id);
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      // Step 1: Generate workout plan (with full exercise data)
      const planData = await generateWorkoutPlan(user);
      
      // Step 2: Save only normalized plan (with exerciseId + sets/reps)
      const minimalBlocks = planData.blocks.map(block => ({
        name: block.name,
        sessions: block.sessions.map(session => ({
          day: session.day,
          muscleFocus: session.muscleFocus, // Add muscle focus
          targetMuscles: session.targetMuscles, // Add target muscles
          calories: session.calories,
          isAutoFilled: session.isAutoFilled || false,
          exercises: session.exercises.map(ex => ({
            exerciseId: ex._id,
            sets: ex.sets,
            reps: ex.reps,
            phase: ex.phase,
            intensity: ex.intensity,
            calories: ex.calories,
            duration: ex.duration
          }))
        }))
      }));

      const savedPlan = await WorkoutPlan.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          isCustom: false,
          goal: planData.goal,
          frequency: planData.frequency,
          musclePriority: planData.musclePriority,
          blocks: minimalBlocks,
          filters: {},
          splitDescription: planData.splitDescription, // Add split description
          updatedAt: new Date(),
          createdAt: new Date(),
        },
        { new: true, upsert: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Workout plan generated successfully',
        workoutPlan: savedPlan, // normalized
        enrichedPlan: planData   // complete, for frontend
      });

    } catch (error) {
      console.error('❌ Error generating workout plan:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error. Please try again later.'
      });
    }
};

exports.completeWeeks = async (req, res) => {
  const { weeks, mode } = req.body;
  const userId = req.user.id;

  if (!Array.isArray(weeks) || !['repeat', 'suggest'].includes(mode)) {
    return res.status(400).json({ success: false, message: 'Invalid input' });
  }

  try {
    const plan = await WorkoutPlan.findOne({ userId }).lean();
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const user = mode === 'suggest' ? await User.findById(userId) : null;
    const prefs = user ? (user.exercisePreferences || []).flat().map(p => p.toLowerCase().trim()) : [];

    const usedIds = plan.blocks.flatMap(b =>
      b.sessions.flatMap(s =>
        (s.exercises || []).map(e => e.exerciseId?.toString() || e._id?.toString())
      )
    );
    const uniqueUsed = [...new Set(usedIds)];
    const neededCount = weeks.length * plan.frequency * 2;

    for (const wk of weeks) {
      const idx = plan.blocks.findIndex(b => b.name.toLowerCase().includes(`week ${wk}`));
      if (idx === -1) continue;

      const block = plan.blocks[idx];

      // ✅ MODE: REPEAT
      if (mode === 'repeat') {
        const lastFull = [...plan.blocks].reverse().find(b => b.sessions.every(s => (s.exercises || []).length > 0));
        if (lastFull) {
          block.sessions = lastFull.sessions.map(s => ({
            day: s.day,
            muscleFocus: s.muscleFocus,
            targetMuscles: s.targetMuscles,
            exercises: s.exercises.map(e => ({ ...e })),
            isAutoFilled: true,
          }));
        }
        continue;
      }

      // ✅ MODE: SUGGEST
      if (mode === 'suggest') {
        const reused = await Exercise.find({ _id: { $in: uniqueUsed } }).limit(Math.floor(neededCount / 2));
        const universals = await Exercise.find({
          muscles: /yoga|walk|stretch|light|mobility|recovery/i,
          _id: { $nin: uniqueUsed }
        }).limit(neededCount - reused.length);

        const pool = [...reused, ...universals].sort(() => 0.5 - Math.random());

        const sessionSlice = pool.splice(0, plan.frequency * 2);
        block.sessions = Array.from({ length: plan.frequency }, (_, i) => ({
          day: `Day ${i + 1}`,
          muscleFocus: plan.blocks[0]?.sessions[i]?.muscleFocus || 'General',
          targetMuscles: plan.blocks[0]?.sessions[i]?.targetMuscles || ['Full Body'],
          isAutoFilled: true,
          exercises: (sessionSlice.slice(i * 2, i * 2 + 2) || []).map(ex => ({
            exerciseId: ex._id,
            title: ex.title,
            img: ex.img,
            equipment: ex.equipment,
            muscles: ex.muscles,
            description: ex.description,
            sets: 3,
            reps: 12,
            phase: 'main',
            intensity: 'medium'
          }))
        }));
      }
    }

    const updated = await WorkoutPlan.findOneAndUpdate(
      { userId },
      { $set: { blocks: plan.blocks } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      updated,
      message: 'Weeks completed. Consult physician before exercising 🩺'
    });
  } catch (err) {
    console.error('🔥 completeWeeks error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.fetchRecentWorkouts = async (req, res) => {
  try {
    const plans = await WorkoutPlan.find({ userId: req.user.id })
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    const recent = plans.map(plan => ({
      planId: plan._id,
      updatedAt: plan.updatedAt,
      blocks: plan.blocks.slice(-1), // show latest week block
    }));

    return res.json({ success: true, recent });
  } catch (err) {
    console.error('Error fetching recent workouts', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all plans for a user
exports.getAllPlans = async (req, res) => {
    try {
      const plans = await WorkoutPlan.find({ user: req.user.id }).sort({ createdAt: -1 });
      res.json({ success: true, plans });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to fetch plans' });
    }
  };
  
  // Get latest plan
  exports.getLatestPlan = async (req, res) => {
    try {
      const latestPlan = await WorkoutPlan.findOne({ user: req.user.id }).sort({ createdAt: -1 });
      if (!latestPlan) return res.status(404).json({ success: false, message: 'No workout plan found' });
      res.json({ success: true, plan: latestPlan });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to fetch latest plan' });
    }
  };
  
  // Update a specific plan
  exports.updatePlan = async (req, res) => {
    try {
      const planId = req.params.id;
      const updated = await WorkoutPlan.findOneAndUpdate(
        { _id: planId, user: req.user.id },
        { $set: req.body },
        { new: true }
      );
      if (!updated) return res.status(404).json({ success: false, message: 'Plan not found or unauthorized' });
      res.json({ success: true, updated });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to update plan' });
    }
  };
  
  // Delete a specific plan
  exports.deletePlan = async (req, res) => {
    try {
      const planId = req.params.id;
      const deleted = await WorkoutPlan.findOneAndDelete({ _id: planId, user: req.user.id });
      if (!deleted) return res.status(404).json({ success: false, message: 'Plan not found or unauthorized' });
      res.json({ success: true, message: 'Plan deleted successfully' });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to delete plan' });
    }
  };