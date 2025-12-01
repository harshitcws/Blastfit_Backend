const HarshitCustomPlanService = require('../services/HarshitCustomPlanService');

// Create custom plan
exports.harshitCreateCustomPlan = async (req, res) => {
  try {
    const harshitPlanData = req.body;
    const harshitUserId = req.user?._id || req.user?.id;
    
    if (!harshitUserId) {
      return res.status(401).json({
        success: false,
        message: 'Harshit: User authentication required'
      });
    }

    const harshitSavedPlan = await HarshitCustomPlanService.harshitCreateCustomPlan(
      harshitPlanData, 
      harshitUserId,
      { name: req.user?.name, email: req.user?.email, role: req.user?.role }
    );
    
    res.json({
      success: true,
      message: 'Harshit: Custom plan created successfully',
      plan: harshitSavedPlan
    });

  } catch (error) {
    console.error('Harshit: Create custom plan error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get user's custom plans
exports.harshitGetUserCustomPlans = async (req, res) => {
  try {
    const harshitUserId = req.user?._id || req.user?.id;
    const harshitUserRole = req.user?.role;
    
    if (!harshitUserId) {
      return res.status(401).json({
        success: false,
        message: 'Harshit: User authentication required'
      });
    }

    const harshitPlans = await HarshitCustomPlanService.harshitGetUserCustomPlans(
      harshitUserId, 
      harshitUserRole
    );
    
    res.json({
      success: true,
      plans: harshitPlans
    });

  } catch (error) {
    console.error('Harshit: Get user custom plans error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get custom plan details
exports.harshitGetCustomPlanDetails = async (req, res) => {
  try {
    const { harshitPlanId } = req.params;
    const harshitUserId = req.user?._id || req.user?.id;
    const harshitUserRole = req.user?.role;
    
    if (!harshitUserId) {
      return res.status(401).json({
        success: false,
        message: 'Harshit: User authentication required'
      });
    }

    const harshitPlan = await HarshitCustomPlanService.harshitGetCustomPlanById(
      harshitPlanId, 
      harshitUserId,
      harshitUserRole
    );
    
    if (!harshitPlan) {
      return res.status(404).json({
        success: false,
        message: 'Harshit: Custom plan not found or access denied'
      });
    }

    res.json({
      success: true,
      plan: harshitPlan
    });

  } catch (error) {
    console.error('Harshit: Get custom plan details error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update custom plan
exports.harshitUpdateCustomPlan = async (req, res) => {
  console.log('hitt update api ' )
  try {
    const { harshitPlanId } = req.params;
    const harshitUpdateData = req.body;
    const harshitUserId = req.user?._id || req.user?.id;
    const harshitUserRole = req.user?.role;
    
    if (!harshitUserId) {
      return res.status(401).json({
        success: false,
        message: 'Harshit: User authentication required'
      });
    }

    const harshitUpdatedPlan = await HarshitCustomPlanService.harshitUpdateCustomPlan(
      harshitPlanId, 
      harshitUserId,
      harshitUserRole,
      harshitUpdateData
    );
    
    if (!harshitUpdatedPlan) {
      return res.status(404).json({
        success: false,
        message: 'Harshit: Custom plan not found or access denied'
      });
    }

    res.json({
      success: true,
      message: 'Harshit: Custom plan updated successfully',
      plan: harshitUpdatedPlan
    });

  } catch (error) {
    console.error('Harshit: Update custom plan error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add workouts to custom plan
exports.harshitAddWorkoutsToCustomPlan = async (req, res) => {
  try {
    const { harshitPlanId } = req.params;
    const harshitWorkoutData = req.body;
    const harshitUserId = req.user?._id || req.user?.id;
    const harshitUserRole = req.user?.role;
    
    if (!harshitUserId) {
      return res.status(401).json({
        success: false,
        message: 'Harshit: User authentication required'
      });
    }

    const harshitUpdatedPlan = await HarshitCustomPlanService.harshitAddWorkoutsToCustomPlan(
      harshitPlanId, 
      harshitUserId,
      harshitUserRole,
      harshitWorkoutData
    );
    
    if (!harshitUpdatedPlan) {
      return res.status(404).json({
        success: false,
        message: 'Harshit: Custom plan not found or access denied'
      });
    }

    res.json({
      success: true,
      message: 'Harshit: Workouts added to custom plan successfully',
      plan: harshitUpdatedPlan
    });

  } catch (error) {
    console.error('Harshit: Add workouts to custom plan error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete custom plan
exports.harshitDeleteCustomPlan = async (req, res) => {
  try {
    const { harshitPlanId } = req.params;
    const harshitUserId = req.user?._id || req.user?.id;
    const harshitUserRole = req.user?.role;
    
    if (!harshitUserId) {
      return res.status(401).json({
        success: false,
        message: 'Harshit: User authentication required'
      });
    }

    const harshitDeletedPlan = await HarshitCustomPlanService.harshitDeleteCustomPlan(
      harshitPlanId, 
      harshitUserId,
      harshitUserRole
    );
    
    if (!harshitDeletedPlan) {
      return res.status(404).json({
        success: false,
        message: 'Harshit: Custom plan not found or access denied'
      });
    }

    res.json({
      success: true,
      message: 'Harshit: Custom plan deleted successfully',
      plan: harshitDeletedPlan
    });

  } catch (error) {
    console.error('Harshit: Delete custom plan error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ NEW: Get all public plans (for browsing)
exports.harshitGetPublicPlans = async (req, res) => {
  try {
    const harshitPlans = await HarshitCustomPlanService.harshitGetPublicPlans();
    
    res.json({
      success: true,
      plans: harshitPlans
    });

  } catch (error) {
    console.error('Harshit: Get public plans error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ NEW: Get plans shared with me (My Plans, Friends, Requests)
exports.harshitGetSharedWithMePlans = async (req, res) => {
  try {
    const harshitUserId = req.user?._id || req.user?.id;
    
    console.log('📋 Get shared with me plans - User ID:', harshitUserId);
    
    if (!harshitUserId) {
      return res.status(401).json({
        success: false,
        message: 'Harshit: User authentication required'
      });
    }

    const result = await HarshitCustomPlanService.harshitGetSharedWithMePlans(harshitUserId);
    
    console.log('📋 Shared plans result:', {
      sharedPlans: result.sharedPlans?.length || 0,
      friendsPlans: result.friendsPlans?.length || 0,
      pendingRequests: result.pendingRequests?.length || 0
    });
    
    res.json({
      success: true,
      sharedPlans: result.sharedPlans || [], // Plans shared by me
      friendsPlans: result.friendsPlans || [], // Plans shared with me (accepted)
      pendingRequests: result.pendingRequests || [] // Plans shared with me (pending)
    });

  } catch (error) {
    console.error('❌ Harshit: Get shared with me plans error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ NEW: Share custom plan (FIXED for admin users)
exports.harshitShareCustomPlan = async (req, res) => {
  try {
    const { harshitPlanId } = req.params;
    const { userIds, shareType } = req.body;
    const harshitUserId = req.user?._id || req.user?.id;
    const harshitUserRole = req.user?.role;
    
    console.log('🔗 Share plan request:', {
      planId: harshitPlanId,
      userIds,
      shareType,
      requesterId: harshitUserId,
      requesterRole: harshitUserRole
    });
    
    if (!harshitUserId) {
      return res.status(401).json({
        success: false,
        message: 'Harshit: User authentication required'
      });
    }

    if (!Array.isArray(userIds) || userIds.length === 0 || !['challenge', 'follow_together'].includes(shareType)) {
      return res.status(400).json({
        success: false,
        message: 'Harshit: Invalid share data'
      });
    }

    const harshitUpdatedPlan = await HarshitCustomPlanService.harshitSharePlan(
      harshitPlanId, 
      harshitUserId,
      harshitUserRole,
      { userIds, shareType }
    );
    
    if (!harshitUpdatedPlan) {
      return res.status(404).json({
        success: false,
        message: 'Harshit: Custom plan not found or access denied'
      });
    }

    // Create notifications for all users who received the request
    await createPlanRequestNotifications(harshitUserId, userIds, harshitPlanId, shareType, harshitUpdatedPlan.title);

    res.json({
      success: true,
      message: 'Harshit: Plan shared successfully',
      plan: harshitUpdatedPlan
    });

  } catch (error) {
    console.error('Harshit: Share custom plan error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to create notifications when plan is shared
async function createPlanRequestNotifications(senderId, receiverIds, planId, shareType, planTitle) {
  try {
    const Notification = require('../models/Notification');
    const User = require('../models/user');
    
    const sender = await User.findById(senderId);
    const senderName = sender?.name || sender?.firstName || 'Someone';

    const shareTypeText = shareType === 'challenge' ? 'competition' : 'follow together';
    const shareTypeEmoji = shareType === 'challenge' ? '🏆' : '🤝';

    console.log(`📢 Creating notifications for ${receiverIds.length} users`);

    for (const receiverId of receiverIds) {
      try {
        await Notification.create({
          userId: receiverId,
          type: 'plan_request',
          title: `${senderName} sent you a workout plan request`,
          message: `${senderName} wants you to join a ${shareTypeText} ${shareTypeEmoji} for "${planTitle}"`,
          data: {
            planId: planId.toString(),
            type: 'plan_request',
            shareType: shareType,
            senderId: senderId.toString(),
            senderName: senderName
          },
          read: false
        });
        console.log(`✅ Notification created for user: ${receiverId}`);
      } catch (notifError) {
        console.error(`❌ Failed to create notification for user ${receiverId}:`, notifError);
      }
    }
  } catch (error) {
    console.error('❌ Error creating plan request notifications:', error);
  }
}

// ✅ NEW: Unshare custom plan (remove self from sharedWith)
exports.harshitUnshareCustomPlan = async (req, res) => {
  try {
    const { harshitPlanId } = req.params;
    const harshitUserId = req.user?._id || req.user?.id;
    
    if (!harshitUserId) {
      return res.status(401).json({
        success: false,
        message: 'Harshit: User authentication required'
      });
    }

    const harshitUpdatedPlan = await HarshitCustomPlanService.harshitUnsharePlan(
      harshitPlanId, 
      harshitUserId
    );
    
    if (!harshitUpdatedPlan) {
      return res.status(404).json({
        success: false,
        message: 'Harshit: Custom plan not found or not shared with you'
      });
    }

    res.json({
      success: true,
      message: 'Harshit: Plan unshared successfully',
      plan: harshitUpdatedPlan
    });

  } catch (error) {
    console.error('Harshit: Unshare custom plan error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ NEW: Accept share invitation
exports.harshitAcceptCustomPlanShare = async (req, res) => {
  try {
    const { harshitPlanId } = req.params;
    const harshitUserId = req.user?._id || req.user?.id;
    
    if (!harshitUserId) {
      return res.status(401).json({
        success: false,
        message: 'Harshit: User authentication required'
      });
    }

    const harshitUpdatedPlan = await HarshitCustomPlanService.harshitAcceptPlanShare(
      harshitPlanId, 
      harshitUserId
    );
    
    if (!harshitUpdatedPlan) {
      return res.status(404).json({
        success: false,
        message: 'Harshit: Custom plan not found or no pending invitation'
      });
    }

    // Create acceptance notification for plan owner
    await createPlanAcceptanceNotification(harshitUserId, harshitPlanId, harshitUpdatedPlan);

    res.json({
      success: true,
      message: 'Harshit: Plan share accepted successfully',
      plan: harshitUpdatedPlan
    });

  } catch (error) {
    console.error('Harshit: Accept custom plan share error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ NEW: Reject share invitation
exports.harshitRejectCustomPlanShare = async (req, res) => {
  try {
    const { harshitPlanId } = req.params;
    const harshitUserId = req.user?._id || req.user?.id;
    
    if (!harshitUserId) {
      return res.status(401).json({
        success: false,
        message: 'Harshit: User authentication required'
      });
    }

    const harshitUpdatedPlan = await HarshitCustomPlanService.harshitRejectPlanShare(
      harshitPlanId, 
      harshitUserId
    );
    
    if (!harshitUpdatedPlan) {
      return res.status(404).json({
        success: false,
        message: 'Harshit: Custom plan not found or no pending invitation'
      });
    }

    res.json({
      success: true,
      message: 'Harshit: Plan share rejected successfully',
      plan: harshitUpdatedPlan
    });

  } catch (error) {
    console.error('Harshit: Reject custom plan share error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to create acceptance notification
async function createPlanAcceptanceNotification(acceptorId, planId, plan) {
  try {
    const Notification = require('../models/Notification');
    const User = require('../models/user');
    
    const acceptor = await User.findById(acceptorId);
    const acceptorName = acceptor?.name || acceptor?.firstName || 'Someone';

    // Notify the plan owner
    await Notification.create({
      userId: plan.userId,
      type: 'plan_accepted',
      title: `${acceptorName} accepted your plan`,
      message: `${acceptorName} accepted your invitation to join "${plan.title}"`,
      data: {
        planId: planId.toString(),
        type: 'plan_accepted',
        acceptorId: acceptorId.toString(),
        acceptorName: acceptorName
      },
      read: false
    });
  } catch (error) {
    console.error('Error creating acceptance notification:', error);
  }
}