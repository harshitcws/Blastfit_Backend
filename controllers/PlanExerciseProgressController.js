const PlanExerciseProgress = require('../models/PlanExerciseProgress');
const HarshitCustomPlan = require('../models/HarshitCustomPlan');

// Mark exercise as completed for a plan
exports.completeExercise = async (req, res) => {
  console.log('plan complete')
  try {
    const { planId, exerciseId, exerciseTitle } = req.body;
    const userId = req.user?._id || req.user?.id;
console.log('plan complete',req)
    if (!planId || !exerciseId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: planId, exerciseId'
      });
    }

    console.log(`✅ Exercise completion: User ${userId}, Plan ${planId}, Exercise ${exerciseId}`);

    // Find or create progress record
    let progress = await PlanExerciseProgress.findOne({ planId, userId });

    if (!progress) {
      // Get total exercises from plan
      const plan = await HarshitCustomPlan.findById(planId);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Plan not found'
        });
      }

      const totalExercises = (plan.warmups?.length || 0) + 
                            (plan.main?.length || 0) + 
                            (plan.finishers?.length || 0);

      progress = new PlanExerciseProgress({
        planId,
        userId,
        totalExercises,
        completedExercises: [],
        totalCompleted: 0
      });
    }

    // Check if exercise already completed (prevent duplicates)
    const alreadyCompleted = progress.completedExercises.some(
      ex => {
        const exId = ex.exerciseId?.toString() || ex.exerciseId;
        const newExId = exerciseId?.toString() || exerciseId;
        return exId === newExId;
      }
    );

    if (!alreadyCompleted) {
      // Add exercise to completed list
      progress.completedExercises.push({
        exerciseId,
        exerciseTitle: exerciseTitle || 'Exercise',
        completedAt: new Date()
      });

      progress.totalCompleted = progress.completedExercises.length;
      progress.percentage = progress.totalExercises > 0 
        ? Math.round((progress.totalCompleted / progress.totalExercises) * 100)
        : 0;

      // Check if all exercises completed
      if (progress.totalCompleted >= progress.totalExercises && progress.totalExercises > 0) {
        progress.isCompleted = true;
        progress.completedAt = new Date();
      }

      await progress.save();

      // Check if we need to create notifications for other users in the plan
      await checkAndCreateProgressNotifications(planId, userId, progress);
      
      console.log(`✅ Exercise marked as completed. Progress: ${progress.totalCompleted}/${progress.totalExercises}`);
    }

    res.json({
      success: true,
      message: 'Exercise marked as completed',
      progress: {
        totalCompleted: progress.totalCompleted,
        totalExercises: progress.totalExercises,
        percentage: progress.percentage,
        isCompleted: progress.isCompleted
      }
    });

  } catch (error) {
    console.error('❌ Complete exercise error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get progress for a specific plan
exports.getPlanProgress = async (req, res) => {
  try {
    const { planId } = req.params;
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const progress = await PlanExerciseProgress.findOne({ planId, userId });

    if (!progress) {
      // Return default progress
      const plan = await HarshitCustomPlan.findById(planId);
      const totalExercises = plan 
        ? (plan.warmups?.length || 0) + (plan.main?.length || 0) + (plan.finishers?.length || 0)
        : 0;

      return res.json({
        success: true,
        progress: {
          totalCompleted: 0,
          totalExercises,
          percentage: 0,
          isCompleted: false,
          completedExercises: []
        }
      });
    }

    res.json({
      success: true,
      progress: {
        totalCompleted: progress.totalCompleted,
        totalExercises: progress.totalExercises,
        percentage: progress.percentage,
        isCompleted: progress.isCompleted,
        completedExercises: progress.completedExercises
      }
    });

  } catch (error) {
    console.error('❌ Get plan progress error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get progress for all users in a shared plan (for Friends Progress)
exports.getSharedPlanProgress = async (req, res) => {
  try {
    const { planId } = req.params;
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    console.log(`📊 Getting shared progress for plan: ${planId}, user: ${userId}`);

    // Get plan and check if user has access
    const plan = await HarshitCustomPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Check if user is owner or has access via sharedWith
    const isOwner = plan.userId.toString() === userId.toString();
    const hasAccess = plan.sharedWith.some(s => 
      s.userId.toString() === userId.toString() && s.status === 'accepted'
    );

    if (!isOwner && !hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get all users who have access to this plan
    const userIds = [plan.userId];
    plan.sharedWith.forEach(share => {
      if (share.status === 'accepted' && share.userId) {
        userIds.push(share.userId);
      }
    });

    console.log(`👥 Users with access to plan: ${userIds.length}`);

    // Get progress for all users
    const allProgress = await PlanExerciseProgress.find({ 
      planId,
      userId: { $in: userIds }
    }).populate('userId', 'name email firstName lastName');

    // Format response - include owner's progress
    const ownerProgress = allProgress.find(p => 
      p.userId._id.toString() === plan.userId.toString()
    );
    
    // If owner doesn't have progress record, create default
    const User = require('../models/user');
    let usersProgress = [];

    // Add owner progress
    if (ownerProgress) {
      usersProgress.push({
        userId: ownerProgress.userId._id || ownerProgress.userId,
        userName: ownerProgress.userId.name || ownerProgress.userId.firstName || 'You',
        completedExercises: ownerProgress.totalCompleted || 0,
        totalExercises: ownerProgress.totalExercises || 0,
        percentage: ownerProgress.percentage || 0,
        isCompleted: ownerProgress.isCompleted || false,
        shareType: null // Owner doesn't have shareType
      });
    } else {
      const owner = await User.findById(plan.userId);
      const totalExercises = (plan.warmups?.length || 0) + (plan.main?.length || 0) + (plan.finishers?.length || 0);
      usersProgress.push({
        userId: plan.userId,
        userName: owner?.name || owner?.firstName || 'You',
        completedExercises: 0,
        totalExercises: totalExercises,
        percentage: 0,
        isCompleted: false,
        shareType: null
      });
    }

    // Add other users progress
    allProgress.forEach(p => {
      if (p.userId._id.toString() !== plan.userId.toString()) {
        const shareInfo = plan.sharedWith.find(s => 
          (s.userId?._id?.toString() || s.userId?.toString()) === (p.userId._id?.toString() || p.userId.toString())
        );
        
        usersProgress.push({
          userId: p.userId._id || p.userId,
          userName: p.userId.name || p.userId.firstName || p.userId.email || 'Friend',
          completedExercises: p.totalCompleted || 0,
          totalExercises: p.totalExercises || 0,
          percentage: p.percentage || 0,
          isCompleted: p.isCompleted || false,
          shareType: shareInfo?.shareType || 'follow_together'
        });
      }
    });

    // Also add shared users who don't have progress yet
    for (const share of plan.sharedWith) {
      if (share.status === 'accepted') {
        const shareUserId = share.userId?._id?.toString() || share.userId?.toString() || share.userId;
        const exists = usersProgress.some(u => u.userId.toString() === shareUserId.toString());
        
        if (!exists && shareUserId.toString() !== plan.userId.toString()) {
          const sharedUser = await User.findById(shareUserId);
          const totalExercises = (plan.warmups?.length || 0) + (plan.main?.length || 0) + (plan.finishers?.length || 0);
          usersProgress.push({
            userId: shareUserId,
            userName: sharedUser?.name || sharedUser?.firstName || sharedUser?.email || 'Friend',
            completedExercises: 0,
            totalExercises: totalExercises,
            percentage: 0,
            isCompleted: false,
            shareType: share.shareType || 'follow_together'
          });
        }
      }
    }

    // Determine winner (first to complete all exercises)
    const winner = usersProgress.find(u => u.isCompleted);
    const sortedByProgress = [...usersProgress].sort((a, b) => 
      b.completedExercises - a.completedExercises
    );

    console.log(`📊 Final progress data: ${usersProgress.length} users`);

    res.json({
      success: true,
      progress: usersProgress,
      winner: winner || null,
      plan: {
        _id: plan._id,
        title: plan.title,
        totalExercises: (plan.warmups?.length || 0) + (plan.main?.length || 0) + (plan.finishers?.length || 0)
      }
    });

  } catch (error) {
    console.error('❌ Get shared plan progress error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Enhanced Helper function to create notifications when user progresses
async function checkAndCreateProgressNotifications(planId, userId, progress) {
  try {
    const Notification = require('../models/Notification');
    const User = require('../models/user');
    const plan = await HarshitCustomPlan.findById(planId).populate('userId', 'name firstName lastName');
    
    if (!plan) return;

    // Get current user info
    const currentUser = await User.findById(userId);
    const currentUserName = currentUser?.name || currentUser?.firstName || currentUser?.email || 'A friend';

    console.log(`🔔 Checking progress notifications for plan: ${plan.title}, user: ${currentUserName}`);

    // Get all other users who have access to this plan
    const otherUsers = plan.sharedWith.filter(s => 
      s.userId.toString() !== userId.toString() && s.status === 'accepted'
    );

    // Also include the plan owner if they're not the current user
    const planOwnerId = plan.userId?._id?.toString() || plan.userId?.toString();
    if (planOwnerId && planOwnerId !== userId.toString()) {
      const ownerShare = plan.sharedWith.find(s => s.userId.toString() === planOwnerId);
      if (!ownerShare || ownerShare.status === 'accepted') {
        otherUsers.push({
          userId: plan.userId,
          shareType: null // Owner doesn't have shareType
        });
      }
    }

    console.log(`🔔 Will notify ${otherUsers.length} other users`);

    // Create notifications for other users
    for (const share of otherUsers) {
      const otherUserId = share.userId?._id || share.userId;
      if (!otherUserId) continue;
      
      try {
        // Get other user's progress
        const otherProgress = await PlanExerciseProgress.findOne({ planId, userId: otherUserId });
        
        let shouldNotify = false;
        let notificationMessage = '';
        
        if (!otherProgress) {
          // Other user hasn't started, current user is ahead by all completed exercises
          shouldNotify = true;
          notificationMessage = `${currentUserName} has started "${plan.title}" and completed ${progress.totalCompleted} exercise${progress.totalCompleted > 1 ? 's' : ''}`;
        } else if (progress.totalCompleted > otherProgress.totalCompleted) {
          // Current user is ahead
          const aheadBy = progress.totalCompleted - otherProgress.totalCompleted;
          shouldNotify = true;
          notificationMessage = `${currentUserName} is ahead by ${aheadBy} exercise${aheadBy > 1 ? 's' : ''} in "${plan.title}"`;
        } else if (progress.isCompleted && !otherProgress.isCompleted) {
          // Current user completed the plan
          shouldNotify = true;
          notificationMessage = `${currentUserName} has completed all exercises in "${plan.title}"! 🏆`;
        }
        
        if (shouldNotify && notificationMessage) {
          await Notification.create({
            userId: otherUserId,
            type: 'progress_update',
            title: `${currentUserName} is making progress`,
            message: notificationMessage,
            data: {
              planId: planId.toString(),
              type: 'progress',
              shareType: share.shareType || null,
              currentUserName: currentUserName
            },
            read: false
          });
          console.log(`✅ Progress notification sent to user: ${otherUserId}`);
        }
      } catch (userError) {
        console.error(`❌ Error creating notification for user ${otherUserId}:`, userError);
      }
    }
  } catch (error) {
    console.error('❌ Error creating progress notifications:', error);
  }
}