const User = require('../models/user');
const Exercise = require('../models/exercise');
const Workout = require('../models/WorkoutPlan');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Get counts
    const userCount = await User.countDocuments();
    const exerciseCount = await Exercise.countDocuments();
    const workoutCount = await Workout.countDocuments();
    
    // Get recent activities (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Recent user registrations
    const recentUsers = await User.find({ 
      createdAt: { $gte: oneDayAgo } 
    }).sort({ createdAt: -1 }).limit(5);
    
    // Recent exercise updates/creations
    const recentExercises = await Exercise.find({ 
      $or: [
        { createdAt: { $gte: oneDayAgo } },
        { updatedAt: { $gte: oneDayAgo } }
      ]
    }).sort({ updatedAt: -1 }).limit(5);
    
    // Recent workout completions
    const recentWorkouts = await Workout.find({ 
      completedAt: { $gte: oneDayAgo } 
    }).sort({ completedAt: -1 }).limit(5);
    
    // Format activities
    const activities = [];
    
    // Add user registrations to activities
    recentUsers.forEach(user => {
      const timestamp = user.createdAt ? new Date(user.createdAt) : new Date();
      activities.push({
        type: 'user_registered',
        message: 'New user registered',
        timestamp,
        metadata: { userId: user._id, username: user.username }
      });
    });
    
    // Add exercise updates to activities
    recentExercises.forEach(exercise => {
      const createdAt = exercise.createdAt ? new Date(exercise.createdAt) : null;
      const updatedAt = exercise.updatedAt ? new Date(exercise.updatedAt) : null;

      let isNew = false;
      let timestamp = createdAt || updatedAt || new Date();

      if (createdAt && updatedAt) {
        isNew = createdAt.getTime() === updatedAt.getTime();
        timestamp = isNew ? createdAt : updatedAt;
      }

      activities.push({
        type: isNew ? 'exercise_created' : 'exercise_updated',
        message: isNew ? 'New exercise added' : 'Exercise updated',
        timestamp,
        metadata: { exerciseId: exercise._id, exerciseName: exercise.name }
      });
    });
    
    // Add workout completions to activities
    recentWorkouts.forEach(workout => {
      const timestamp = workout.completedAt ? new Date(workout.completedAt) : new Date();
      activities.push({
        type: 'workout_completed',
        message: 'User completed workout',
        timestamp,
        metadata: { 
          workoutId: workout._id, 
          userId: workout.userId,
          workoutName: workout.name 
        }
      });
    });
    
    // Sort activities by timestamp (newest first) and limit to 10
    const recentActivities = activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)
      .map(activity => ({
        ...activity,
        timeAgo: getTimeAgo(activity.timestamp)
      }));
    
    res.json({
      counts: {
        users: userCount,
        exercises: exerciseCount,
        workouts: workoutCount
      },
      recentActivities
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard stats' });
  }
};

// Helper function to format time ago
function getTimeAgo(timestamp) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
}

const getPublicStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const rawExerciseCount = await Exercise.countDocuments();
const exerciseCount = Math.floor(rawExerciseCount / 100) * 100;
    const workoutsCompleted = await Workout.countDocuments();
    
    res.status(200).json({
      success: true,
      data: {
        userCount,
        exerciseCount,
        workoutsCompleted
      }
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
};

// Exports
module.exports = {
  getDashboardStats,
  getPublicStats
};
