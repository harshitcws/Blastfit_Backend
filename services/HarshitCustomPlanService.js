const HarshitCustomPlan = require('../models/HarshitCustomPlan');

class HarshitCustomPlanService {
  
  harshitCalculatePlanStats(harshitPlanData) {
    const warmups = harshitPlanData.warmups || [];
    const main = harshitPlanData.main || [];
    const finishers = harshitPlanData.finishers || [];
    
    return {
      totalExercises: warmups.length + main.length + finishers.length,
      totalDuration: this.harshitCalculateTotalDuration({ warmups, main, finishers }),
      totalCalories: this.harshitCalculateTotalCalories({ warmups, main, finishers })
    };
  }

  // Create custom plan for user/admin
  async harshitCreateCustomPlan(harshitPlanData, harshitUserId, harshitUserData = {}) {
    try {
      const stats = this.harshitCalculatePlanStats(harshitPlanData);
      
      // ✅ FIX: Admin plans are public, user plans are private
      const isPublic = harshitUserData.role === 'admin';
      console.log('Harshit: Creating plan for user:', {
        userId: harshitUserId,
        userName: harshitUserData.name,
        userRole: harshitUserData.role,
        isPublic: isPublic
      });
      
      const harshitPlan = new HarshitCustomPlan({
        ...harshitPlanData,
        ...stats,
        userId: harshitUserId,
        userName: harshitUserData.name || 'User',
        userEmail: harshitUserData.email || '',
        userRole: harshitUserData.role || 'user',
        isPublic: isPublic, // Admin plans are public, user plans are private
        isActive: true
      });
      
      const savedPlan = await harshitPlan.save();
      console.log('Harshit: Plan created successfully:', {
        planId: savedPlan._id,
        isPublic: savedPlan.isPublic,
        userRole: savedPlan.userRole
      });
      
      return savedPlan;
    } catch (error) {
      throw new Error(`Harshit: Failed to create custom plan: ${error.message}`);
    }
  }

  // Get user's custom plans (only their own private plans for users, all their plans for admins)
  async harshitGetUserCustomPlans(harshitUserId, harshitUserRole = 'user') {
    try {
      console.log('Harshit: Getting custom plans for user:', {
        userId: harshitUserId,
        userRole: harshitUserRole
      });
      
      let query = { isActive: true, userId: harshitUserId };
      
      if (harshitUserRole === 'user') {
        query.isPublic = false; // Only private plans for users
      }
      // For admins, no isPublic filter - gets all their plans (which are typically public)
      
      const userPlans = await HarshitCustomPlan.find(query).sort({ createdAt: -1 });
      
      console.log('Harshit: User fetched custom plans:', userPlans.length);
      return userPlans;
    } catch (error) {
      throw new Error(`Harshit: Failed to get user custom plans: ${error.message}`);
    }
  }

  // Get all public admin plans (for pre-built tab)
  async harshitGetPublicPlans() {
    try {
      // ✅ FIX: Get only public admin plans
      const publicPlans = await HarshitCustomPlan.find({ 
        isPublic: true, 
        isActive: true,
        userRole: 'admin' // Only admin created plans
      }).sort({ createdAt: -1 });
      
      console.log('Harshit: Fetched public admin plans:', publicPlans.length);
      return publicPlans;
    } catch (error) {
      throw new Error(`Harshit: Failed to get public plans: ${error.message}`);
    }
  }

  // Get custom plan by ID (with access control)
  async harshitGetCustomPlanById(harshitPlanId, harshitUserId, harshitUserRole = 'user') {
    try {
      const harshitPlan = await HarshitCustomPlan.findOne({ 
        _id: harshitPlanId, 
        isActive: true 
      });
      
      if (!harshitPlan) return null;
      
      // Admin can access any plan
      if (harshitUserRole === 'admin') return harshitPlan;
      
      // Owner can access
      if (harshitPlan.userId.toString() === harshitUserId) return harshitPlan;
      
      // Public plans are accessible
      if (harshitPlan.isPublic) return harshitPlan;
      
      // Shared users can access if not rejected
      if (harshitPlan.sharedWith.some(s => 
        s.userId.toString() === harshitUserId && s.status !== 'rejected'
      )) {
        return harshitPlan;
      }
      
      return null; // Access denied
    } catch (error) {
      throw new Error(`Harshit: Failed to get custom plan: ${error.message}`);
    }
  }

  // Update custom plan (with ownership/admin check)
  // async harshitUpdateCustomPlan(harshitPlanId, harshitUserId, harshitUserRole, harshitUpdateData) {
  //   try {
  //     const harshitPlan = await HarshitCustomPlan.findOne({ 
  //       _id: harshitPlanId, 
  //       isActive: true 
  //     });
      
  //     if (!harshitPlan) return null;
      
  //     // Only owner or admin can update
  //     if (harshitPlan.userId.toString() !== harshitUserId && harshitUserRole !== 'admin') {
  //       return null;
  //     }
      
  //     return await HarshitCustomPlan.findOneAndUpdate(
  //       { _id: harshitPlanId },
  //       harshitUpdateData,
  //       { new: true, runValidators: true }
  //     );
  //   } catch (error) {
  //     throw new Error(`Harshit: Failed to update custom plan: ${error.message}`);
  //   }
  // }
async harshitUpdateCustomPlan(harshitPlanId, harshitUserId, harshitUserRole, harshitUpdateData) {
  try {
    // Convert both IDs to strings
    const planIdStr = harshitPlanId.toString();
    const userIdStr = harshitUserId.toString();

    console.log('✏️ Update plan request:', {
      planId: planIdStr,
      userId: userIdStr,
      userRole: harshitUserRole
    });

    const harshitPlan = await HarshitCustomPlan.findOne({
      _id: planIdStr,
      isActive: true
    });

    if (!harshitPlan) {
      console.log('❌ Plan not found or inactive');
      return null;
    }

    const planOwnerStr = harshitPlan.userId.toString();

    console.log('🔍 Update ownership check:', {
      planOwner: planOwnerStr,
      requester: userIdStr,
      isOwner: planOwnerStr === userIdStr,
      isAdmin: harshitUserRole === 'admin'
    });

    const isOwner = planOwnerStr === userIdStr;
    const isAdmin = harshitUserRole === 'admin';

    // ❌ Not owner or admin — no permission
    if (!isOwner && !isAdmin) {
      console.log('❌ Access denied - not owner');
      return null;
    }

    console.log('✅ Permission granted, updating plan...');

    const updatedPlan = await HarshitCustomPlan.findOneAndUpdate(
      { _id: planIdStr },
      harshitUpdateData,
      { new: true, runValidators: true }
    );

    console.log('✅ Plan updated successfully');
    return updatedPlan;

  } catch (error) {
    console.error('❌ Harshit: Failed to update plan:', error);
    throw new Error(`Harshit: Failed to update plan: ${error.message}`);
  }
}

  // Delete custom plan (soft delete with ownership check)
  // async harshitDeleteCustomPlan(harshitPlanId, harshitUserId, harshitUserRole) {
  //   try {
  //     const harshitPlan = await HarshitCustomPlan.findOne({ 
  //       _id: harshitPlanId, 
  //       isActive: true 
  //     });
      
  //     if (!harshitPlan) return null;
      
  //     // Only owner or admin can delete
  //     if (harshitPlan.userId.toString() !== harshitUserId && harshitUserRole !== 'admin') {
  //       return null;
  //     }
      
  //     return await HarshitCustomPlan.findOneAndUpdate(
  //       { _id: harshitPlanId },
  //       { isActive: false },
  //       { new: true }
  //     );
  //   } catch (error) {
  //     throw new Error(`Harshit: Failed to delete custom plan: ${error.message}`);
  //   }
  // }
// Delete custom plan (soft delete with ownership check) - FINAL FIXED VERSION
async harshitDeleteCustomPlan(harshitPlanId, harshitUserId, harshitUserRole) {
  try {
    // Convert both IDs to strings for safe comparison
    const planIdStr = harshitPlanId.toString();
    const userIdStr = harshitUserId.toString();

    console.log('🗑️ Delete plan request:', {
      planId: planIdStr,
      userId: userIdStr,
      userRole: harshitUserRole
    });

    const harshitPlan = await HarshitCustomPlan.findOne({ 
      _id: planIdStr, 
      isActive: true 
    });
    
    if (!harshitPlan) {
      console.log('❌ Plan not found or already deleted');
      return null;
    }

    const planOwnerStr = harshitPlan.userId.toString();
    
    console.log('🔍 Plan ownership check:', {
      planOwner: planOwnerStr,
      requester: userIdStr,
      isOwner: planOwnerStr === userIdStr,
      isAdmin: harshitUserRole === 'admin'
    });

    // ✅ FIXED: Clear permission check
    const isOwner = planOwnerStr === userIdStr;
    const isAdmin = harshitUserRole === 'admin';
    
    if (!isOwner && !isAdmin) {
      console.log('❌ Access denied - not owner or admin');
      return null;
    }

    console.log('✅ Permission granted, deleting plan...');

    // Soft delete the plan
    const deletedPlan = await HarshitCustomPlan.findOneAndUpdate(
      { _id: planIdStr },
      { 
        isActive: false, 
        deletedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    console.log('✅ Plan deleted successfully');
    return deletedPlan;

  } catch (error) {
    console.error('❌ Harshit: Failed to delete custom plan:', error);
    throw new Error(`Harshit: Failed to delete custom plan: ${error.message}`);
  }
}
  // Add workouts to custom plan (with ownership check)
  async harshitAddWorkoutsToCustomPlan(harshitPlanId, harshitUserId, harshitUserRole, harshitWorkoutData) {
    try {
      const harshitPlan = await HarshitCustomPlan.findOne({ 
        _id: harshitPlanId, 
        isActive: true 
      });
      
      if (!harshitPlan) return null;
      
      // Only owner or admin can add workouts
      if (harshitPlan.userId.toString() !== harshitUserId && harshitUserRole !== 'admin') {
        return null;
      }
      
      const harshitUpdateData = {
        warmups: harshitWorkoutData.warmups || [],
        main: harshitWorkoutData.main || [],
        finishers: harshitWorkoutData.finishers || [],
        totalExercises: this.harshitCalculateTotalExercises(harshitWorkoutData),
        totalDuration: this.harshitCalculateTotalDuration(harshitWorkoutData),
        totalCalories: this.harshitCalculateTotalCalories(harshitWorkoutData),
        updatedAt: new Date()
      };

      return await HarshitCustomPlan.findOneAndUpdate(
        { _id: harshitPlanId },
        harshitUpdateData,
        { new: true }
      );
    } catch (error) {
      throw new Error(`Harshit: Failed to add workouts to custom plan: ${error.message}`);
    }
  }

  // NEW: Share plan with users (FIXED for admin users)
  async harshitSharePlan(harshitPlanId, harshitRequesterId, harshitRequesterRole, { userIds, shareType }) {
    try {
      const harshitPlan = await HarshitCustomPlan.findOne({ 
        _id: harshitPlanId, 
        isActive: true 
      });
      
      if (!harshitPlan) {
        console.log('❌ Plan not found:', harshitPlanId);
        return null;
      }
      
      console.log('🔗 Checking permissions:', {
        planOwner: harshitPlan.userId.toString(),
        requester: harshitRequesterId.toString(),
        requesterRole: harshitRequesterRole
      });
      
      // ✅ FIX: Admin can share any plan, owner can share their own plans
      const isOwner = harshitPlan.userId.toString() === harshitRequesterId.toString();
      const isAdmin = harshitRequesterRole === 'admin';
      
      if (!isOwner && !isAdmin) {
        console.log('❌ Access denied - not owner or admin');
        return null;
      }
      
      console.log('✅ Permission granted, sharing with users:', userIds);
      
      // Add or update shares for each user
      userIds.forEach(userId => {
        const existingShareIndex = harshitPlan.sharedWith.findIndex(s => 
          s.userId.toString() === userId.toString()
        );
        
        if (existingShareIndex === -1) {
          // New share
          harshitPlan.sharedWith.push({
            userId,
            status: 'pending',
            shareType
          });
          console.log(`✅ Added new share for user: ${userId}`);
        } else {
          // Update existing share
          harshitPlan.sharedWith[existingShareIndex].status = 'pending';
          harshitPlan.sharedWith[existingShareIndex].shareType = shareType;
          console.log(`✅ Updated existing share for user: ${userId}`);
        }
      });
      
      await harshitPlan.save();
      console.log('✅ Plan shared successfully');
      return harshitPlan;
    } catch (error) {
      console.error('❌ Harshit: Failed to share plan:', error);
      throw new Error(`Harshit: Failed to share plan: ${error.message}`);
    }
  }

  // NEW: Remove share (unshare) for a specific user
  async harshitUnsharePlan(harshitPlanId, harshitUserId) {
    try {
      const harshitPlan = await HarshitCustomPlan.findOne({ 
        _id: harshitPlanId, 
        isActive: true 
      });
      
      if (!harshitPlan) return null;
      
      const shareIndex = harshitPlan.sharedWith.findIndex(s => s.userId.toString() === harshitUserId.toString());
      if (shareIndex === -1) return null;
      
      harshitPlan.sharedWith.splice(shareIndex, 1);
      await harshitPlan.save();
      return harshitPlan;
    } catch (error) {
      throw new Error(`Harshit: Failed to unshare plan: ${error.message}`);
    }
  }

  // NEW: Accept share
  async harshitAcceptPlanShare(harshitPlanId, harshitUserId) {
    try {
      const harshitPlan = await HarshitCustomPlan.findOne({ 
        _id: harshitPlanId, 
        isActive: true 
      });
      
      if (!harshitPlan) return null;
      
      const share = harshitPlan.sharedWith.find(s => s.userId.toString() === harshitUserId.toString());
      if (!share || share.status !== 'pending') return null;
      
      share.status = 'accepted';
      await harshitPlan.save();
      return harshitPlan;
    } catch (error) {
      throw new Error(`Harshit: Failed to accept plan share: ${error.message}`);
    }
  }

  // NEW: Get plans shared with current user
  async harshitGetSharedWithMePlans(harshitUserId) {
    try {
      // ✅ FIX: Convert to ObjectId if it's a string
      const mongoose = require('mongoose');
      const userId = mongoose.Types.ObjectId.isValid(harshitUserId) 
        ? harshitUserId
        : mongoose.Types.ObjectId(harshitUserId);

      console.log('📋 Getting shared plans for user:', userId);

      // Get plans where user is owner AND has shared with others
      const mySharedPlans = await HarshitCustomPlan.find({
        isActive: true,
        userId: userId,
        'sharedWith.0': { $exists: true } // Has at least one share
      })
      .populate('sharedWith.userId', 'name email firstName lastName')
      .populate('userId', 'name email firstName lastName')
      .sort({ createdAt: -1 });

      console.log('📋 My shared plans found:', mySharedPlans.length);

      // Get plans shared with me (where I'm in sharedWith array)
      const plansSharedWithMe = await HarshitCustomPlan.find({
        isActive: true,
        'sharedWith.userId': userId
      })
      .populate('userId', 'name email firstName lastName')
      .populate('sharedWith.userId', 'name email firstName lastName')
      .sort({ createdAt: -1 });

      console.log('📋 Plans shared with me found:', plansSharedWithMe.length);

      // Categorize plans
      const sharedPlans = []; // Plans shared by me (owner = me, has shares)
      const friendsPlans = []; // Plans shared with me (accepted, owner != me)
      const pendingRequests = []; // Plans shared with me (pending)

      // My shared plans (plans I own and have shared)
      mySharedPlans.forEach(plan => {
        sharedPlans.push({
          ...plan.toObject(),
          shareStatus: 'accepted', // Since I'm the owner
          shareType: plan.sharedWith[0]?.shareType || 'follow_together'
        });
      });

      // Plans shared with me
      const userIdStr = userId.toString();
      plansSharedWithMe.forEach(plan => {
        const shareInfo = plan.sharedWith.find(s => {
          const shareUserId = s.userId?._id?.toString() || s.userId?.toString() || s.userId;
          return shareUserId === userIdStr;
        });
        
        const planOwnerId = plan.userId?._id?.toString() || plan.userId?.toString() || plan.userId;
        const isOwner = planOwnerId === userIdStr;

        if (!isOwner && shareInfo) {
          if (shareInfo.status === 'pending') {
            pendingRequests.push({
              ...plan.toObject(),
              shareStatus: 'pending',
              shareType: shareInfo.shareType
            });
          } else if (shareInfo.status === 'accepted') {
            friendsPlans.push({
              ...plan.toObject(),
              shareStatus: 'accepted',
              shareType: shareInfo.shareType
            });
          }
        }
      });

      console.log('📋 Final categorized:', {
        sharedPlans: sharedPlans.length,
        friendsPlans: friendsPlans.length,
        pendingRequests: pendingRequests.length
      });

      return {
        sharedPlans, // My Plans tab - plans I've shared
        friendsPlans, // Friends tab - plans shared with me (accepted)
        pendingRequests // Requests tab - plans shared with me (pending)
      };
    } catch (error) {
      console.error('❌ Harshit: Failed to get shared plans:', error);
      throw new Error(`Harshit: Failed to get shared plans: ${error.message}`);
    }
  }

  // NEW: Reject share invitation
  async harshitRejectPlanShare(harshitPlanId, harshitUserId) {
    try {
      const harshitPlan = await HarshitCustomPlan.findOne({ 
        _id: harshitPlanId, 
        isActive: true 
      });
      
      if (!harshitPlan) return null;
      
      const share = harshitPlan.sharedWith.find(s => s.userId.toString() === harshitUserId.toString());
      if (!share || share.status !== 'pending') return null;
      
      share.status = 'rejected';
      await harshitPlan.save();
      return harshitPlan;
    } catch (error) {
      throw new Error(`Harshit: Failed to reject plan share: ${error.message}`);
    }
  }

  // Helper methods (unchanged)
  harshitCalculateTotalExercises(harshitWorkoutData) {
    return (harshitWorkoutData.warmups?.length || 0) + 
           (harshitWorkoutData.main?.length || 0) + 
           (harshitWorkoutData.finishers?.length || 0);
  }

  harshitCalculateTotalDuration(harshitWorkoutData) {
    let harshitTotal = 0;
    
    const harshitAddDuration = (harshitExercises) => {
      harshitExercises?.forEach(harshitExercise => {
        harshitTotal += harshitExercise.duration || 0;
      });
    };

    harshitAddDuration(harshitWorkoutData.warmups);
    harshitAddDuration(harshitWorkoutData.main);
    harshitAddDuration(harshitWorkoutData.finishers);

    return harshitTotal;
  }

  harshitCalculateTotalCalories(harshitWorkoutData) {
    let harshitTotal = 0;
    
    const harshitAddCalories = (harshitExercises) => {
      harshitExercises?.forEach(harshitExercise => {
        harshitTotal += harshitExercise.estCalories || 0;
      });
    };

    harshitAddCalories(harshitWorkoutData.warmups);
    harshitAddCalories(harshitWorkoutData.main);
    harshitAddCalories(harshitWorkoutData.finishers);

    return harshitTotal;
  }
  
}

module.exports = new HarshitCustomPlanService();