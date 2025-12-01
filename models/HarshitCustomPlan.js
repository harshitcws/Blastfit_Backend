const mongoose = require('mongoose');

const harshitExerciseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  video: { type: String },
  image: { type: String },
  muscles: [{ type: String }],
  equipment: { type: String },
  intensity: { type: String },
  estCalories: { type: Number },
  duration: { type: Number },
  reps: { type: Number },
  sets: { type: Number },
  restTime: { type: Number },
  type: { type: String }
});

const harshitCustomPlanSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String },
  description: { type: String },
  imageName: { type: String, default: "1.png" },
  duration: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  calories: [{ type: Number }],
  workoutTypes: [{ type: String }],
  muscles: [{ type: String }],
  sortBy: { type: String, default: 'popular' },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  
  // Generated workout sessions
  warmups: [harshitExerciseSchema],
  main: [harshitExerciseSchema],
  finishers: [harshitExerciseSchema],
  
  // User specific
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String },
  userEmail: { type: String },
  userRole: { type: String, enum: ['user', 'admin'], default: 'user' }, // ✅ NEW: Track creator role
  
  // Metadata
  isActive: { type: Boolean, default: true },
  isShared: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: false }, // ✅ NEW: Admin plans are public
  
  // Shared with users
  sharedWith: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    shareType: { type: String, enum: ['challenge', 'follow_together'] }
  }],
  
  // Statistics
  totalExercises: { type: Number, default: 0 },
  totalDuration: { type: Number, default: 0 },
  totalCalories: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('HarshitCustomPlan', harshitCustomPlanSchema);