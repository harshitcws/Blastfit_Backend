

// const HarshitCustomPlan = require('../models/HarshitCustomPlan');

// class HarshitCustomPlanService {
  
//   harshitCalculatePlanStats(harshitPlanData) {
//     const warmups = harshitPlanData.warmups || [];
//     const main = harshitPlanData.main || [];
//     const finishers = harshitPlanData.finishers || [];
    
//     return {
//       totalExercises: warmups.length + main.length + finishers.length,
//       totalDuration: this.harshitCalculateTotalDuration({ warmups, main, finishers }),
//       totalCalories: this.harshitCalculateTotalCalories({ warmups, main, finishers })
//     };
//   }

//   // Create custom plan for user/admin
//   async harshitCreateCustomPlan(harshitPlanData, harshitUserId, harshitUserData = {}) {
//     try {
//       const stats = this.harshitCalculatePlanStats(harshitPlanData);
      
//       // ✅ FIX: Admin plans are public, user plans are private
//       const isPublic = harshitUserData.role === 'admin';
//       console.log('Harshit: Creating plan for user:', {
//         userId: harshitUserId,
//         userName: harshitUserData.name,
//         userRole: harshitUserData.role,
//         isPublic: isPublic
//       });
      
//       const harshitPlan = new HarshitCustomPlan({
//         ...harshitPlanData,
//         ...stats,
//         userId: harshitUserId,
//         userName: harshitUserData.name || 'User',
//         userEmail: harshitUserData.email || '',
//         userRole: harshitUserData.role || 'user',
//         isPublic: isPublic, // Admin plans are public, user plans are private
//         isActive: true
//       });
      
//       const savedPlan = await harshitPlan.save();
//       console.log('Harshit: Plan created successfully:', {
//         planId: savedPlan._id,
//         isPublic: savedPlan.isPublic,
//         userRole: savedPlan.userRole
//       });
      
//       return savedPlan;
//     } catch (error) {
//       throw new Error(`Harshit: Failed to create custom plan: ${error.message}`);
//     }
//   }

//   // Get user's custom plans (only their own private plans)
//   async harshitGetUserCustomPlans(harshitUserId, harshitUserRole = 'user') {
//     try {
//       console.log('Harshit: Getting custom plans for user:', {
//         userId: harshitUserId,
//         userRole: harshitUserRole
//       });
      
//       // ✅ FIX: User sees only their own private plans
//       const userPlans = await HarshitCustomPlan.find({
//         userId: harshitUserId, // Only their own plans
//         isActive: true,
//         isPublic: false // Only private plans
//       }).sort({ createdAt: -1 });
      
//       console.log('Harshit: User fetched custom plans:', userPlans.length);
//       return userPlans;
//     } catch (error) {
//       throw new Error(`Harshit: Failed to get user custom plans: ${error.message}`);
//     }
//   }

//   // Get all public admin plans (for pre-built tab)
//   async harshitGetPublicPlans() {
//     try {
//       // ✅ FIX: Get only public admin plans
//       const publicPlans = await HarshitCustomPlan.find({ 
//         isPublic: true, 
//         isActive: true,
//         userRole: 'admin' // Only admin created plans
//       }).sort({ createdAt: -1 });
      
//       console.log('Harshit: Fetched public admin plans:', publicPlans.length);
//       return publicPlans;
//     } catch (error) {
//       throw new Error(`Harshit: Failed to get public plans: ${error.message}`);
//     }
//   }

//   // Get custom plan by ID (with access control)
//   async harshitGetCustomPlanById(harshitPlanId, harshitUserId, harshitUserRole = 'user') {
//     try {
//       const harshitPlan = await HarshitCustomPlan.findOne({ 
//         _id: harshitPlanId, 
//         isActive: true 
//       });
      
//       if (!harshitPlan) return null;
      
//       // Admin can access any plan
//       if (harshitUserRole === 'admin') return harshitPlan;
      
//       // User can access their own private plans or any public plan
//       if (harshitPlan.userId.toString() === harshitUserId || harshitPlan.isPublic) {
//         return harshitPlan;
//       }
      
//       return null; // Access denied
//     } catch (error) {
//       throw new Error(`Harshit: Failed to get custom plan: ${error.message}`);
//     }
//   }

//   // Update custom plan (with ownership/admin check)
//   async harshitUpdateCustomPlan(harshitPlanId, harshitUserId, harshitUserRole, harshitUpdateData) {
//     try {
//       const harshitPlan = await HarshitCustomPlan.findOne({ 
//         _id: harshitPlanId, 
//         isActive: true 
//       });
      
//       if (!harshitPlan) return null;
      
//       // Only owner or admin can update
//       if (harshitPlan.userId.toString() !== harshitUserId && harshitUserRole !== 'admin') {
//         return null;
//       }
      
//       return await HarshitCustomPlan.findOneAndUpdate(
//         { _id: harshitPlanId },
//         harshitUpdateData,
//         { new: true, runValidators: true }
//       );
//     } catch (error) {
//       throw new Error(`Harshit: Failed to update custom plan: ${error.message}`);
//     }
//   }

//   // Delete custom plan (soft delete with ownership check)
//   async harshitDeleteCustomPlan(harshitPlanId, harshitUserId, harshitUserRole) {
//     try {
//       const harshitPlan = await HarshitCustomPlan.findOne({ 
//         _id: harshitPlanId, 
//         isActive: true 
//       });
      
//       if (!harshitPlan) return null;
      
//       // Only owner or admin can delete
//       if (harshitPlan.userId.toString() !== harshitUserId && harshitUserRole !== 'admin') {
//         return null;
//       }
      
//       return await HarshitCustomPlan.findOneAndUpdate(
//         { _id: harshitPlanId },
//         { isActive: false },
//         { new: true }
//       );
//     } catch (error) {
//       throw new Error(`Harshit: Failed to delete custom plan: ${error.message}`);
//     }
//   }

//   // Add workouts to custom plan (with ownership check)
//   async harshitAddWorkoutsToCustomPlan(harshitPlanId, harshitUserId, harshitUserRole, harshitWorkoutData) {
//     try {
//       const harshitPlan = await HarshitCustomPlan.findOne({ 
//         _id: harshitPlanId, 
//         isActive: true 
//       });
      
//       if (!harshitPlan) return null;
      
//       // Only owner or admin can add workouts
//       if (harshitPlan.userId.toString() !== harshitUserId && harshitUserRole !== 'admin') {
//         return null;
//       }
      
//       const harshitUpdateData = {
//         warmups: harshitWorkoutData.warmups || [],
//         main: harshitWorkoutData.main || [],
//         finishers: harshitWorkoutData.finishers || [],
//         totalExercises: this.harshitCalculateTotalExercises(harshitWorkoutData),
//         totalDuration: this.harshitCalculateTotalDuration(harshitWorkoutData),
//         totalCalories: this.harshitCalculateTotalCalories(harshitWorkoutData),
//         updatedAt: new Date()
//       };

//       return await HarshitCustomPlan.findOneAndUpdate(
//         { _id: harshitPlanId },
//         harshitUpdateData,
//         { new: true }
//       );
//     } catch (error) {
//       throw new Error(`Harshit: Failed to add workouts to custom plan: ${error.message}`);
//     }
//   }

//   // Helper methods (unchanged)
//   harshitCalculateTotalExercises(harshitWorkoutData) {
//     return (harshitWorkoutData.warmups?.length || 0) + 
//            (harshitWorkoutData.main?.length || 0) + 
//            (harshitWorkoutData.finishers?.length || 0);
//   }

//   harshitCalculateTotalDuration(harshitWorkoutData) {
//     let harshitTotal = 0;
    
//     const harshitAddDuration = (harshitExercises) => {
//       harshitExercises?.forEach(harshitExercise => {
//         harshitTotal += harshitExercise.duration || 0;
//       });
//     };

//     harshitAddDuration(harshitWorkoutData.warmups);
//     harshitAddDuration(harshitWorkoutData.main);
//     harshitAddDuration(harshitWorkoutData.finishers);

//     return harshitTotal;
//   }

//   harshitCalculateTotalCalories(harshitWorkoutData) {
//     let harshitTotal = 0;
    
//     const harshitAddCalories = (harshitExercises) => {
//       harshitExercises?.forEach(harshitExercise => {
//         harshitTotal += harshitExercise.estCalories || 0;
//       });
//     };

//     harshitAddCalories(harshitWorkoutData.warmups);
//     harshitAddCalories(harshitWorkoutData.main);
//     harshitAddCalories(harshitWorkoutData.finishers);

//     return harshitTotal;
//   }
  
// }

// module.exports = new HarshitCustomPlanService();
// HarshitCustomPlanService.js
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
  async harshitUpdateCustomPlan(harshitPlanId, harshitUserId, harshitUserRole, harshitUpdateData) {
    try {
      const harshitPlan = await HarshitCustomPlan.findOne({ 
        _id: harshitPlanId, 
        isActive: true 
      });
      
      if (!harshitPlan) return null;
      
      // Only owner or admin can update
      if (harshitPlan.userId.toString() !== harshitUserId && harshitUserRole !== 'admin') {
        return null;
      }
      
      return await HarshitCustomPlan.findOneAndUpdate(
        { _id: harshitPlanId },
        harshitUpdateData,
        { new: true, runValidators: true }
      );
    } catch (error) {
      throw new Error(`Harshit: Failed to update custom plan: ${error.message}`);
    }
  }

  // Delete custom plan (soft delete with ownership check)
  async harshitDeleteCustomPlan(harshitPlanId, harshitUserId, harshitUserRole) {
    try {
      const harshitPlan = await HarshitCustomPlan.findOne({ 
        _id: harshitPlanId, 
        isActive: true 
      });
      
      if (!harshitPlan) return null;
      
      // Only owner or admin can delete
      if (harshitPlan.userId.toString() !== harshitUserId && harshitUserRole !== 'admin') {
        return null;
      }
      
      return await HarshitCustomPlan.findOneAndUpdate(
        { _id: harshitPlanId },
        { isActive: false },
        { new: true }
      );
    } catch (error) {
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

  // NEW: Share plan with users
  async harshitSharePlan(harshitPlanId, harshitRequesterId, harshitRequesterRole, { userIds, shareType }) {
    try {
      const harshitPlan = await HarshitCustomPlan.findOne({ 
        _id: harshitPlanId, 
        isActive: true 
      });
      
      if (!harshitPlan) return null;
      
      // Only owner or admin can share
      if (harshitPlan.userId.toString() !== harshitRequesterId && harshitRequesterRole !== 'admin') {
        return null;
      }
      
      userIds.forEach(userId => {
        const existingShare = harshitPlan.sharedWith.find(s => s.userId.toString() === userId);
        if (!existingShare) {
          harshitPlan.sharedWith.push({
            userId,
            status: 'pending',
            shareType
          });
        } // If exists, do nothing or update shareType if needed
      });
      
      await harshitPlan.save();
      return harshitPlan;
    } catch (error) {
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
      
      const shareIndex = harshitPlan.sharedWith.findIndex(s => s.userId.toString() === harshitUserId);
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
      
      const share = harshitPlan.sharedWith.find(s => s.userId.toString() === harshitUserId);
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
      const userId = typeof harshitUserId === 'string' 
        ? require('mongoose').Types.ObjectId(harshitUserId)
        : harshitUserId;

      console.log('📋 Getting shared plans for user:', userId);

      // Get plans where user is owner AND has shared with others
      const mySharedPlans = await HarshitCustomPlan.find({
        isActive: true,
        userId: userId,
        'sharedWith.0': { $exists: true } // Has at least one share
      })
      .populate('sharedWith.userId', 'name email')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

      console.log('📋 My shared plans found:', mySharedPlans.length);

      // Get plans shared with me (where I'm in sharedWith array)
      const plansSharedWithMe = await HarshitCustomPlan.find({
        isActive: true,
        'sharedWith.userId': userId
      })
      .populate('userId', 'name email')
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
          userName: plan.userName,
  userEmail: plan.userEmail,
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
              userName: plan.userName,
  userEmail: plan.userEmail,
              shareStatus: 'accepted',
              shareType: shareInfo.shareType
            });
          }
        }
      });

      return {
        sharedPlans, // My Plans tab - plans I've shared
        friendsPlans, // Friends tab - plans shared with me (accepted)
        pendingRequests // Requests tab - plans shared with me (pending)
      };
    } catch (error) {
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
      
      const share = harshitPlan.sharedWith.find(s => s.userId.toString() === harshitUserId);
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