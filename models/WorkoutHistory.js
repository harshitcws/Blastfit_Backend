const mongoose = require("mongoose");

const WorkoutHistorySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    unique: true 
  },

  // Lifetime totals
  totalDuration: { type: Number, default: 0 },     // total seconds
  totalSessions: { type: Number, default: 0 },     // session count
  totalDays: { type: Number, default: 0 },         // active days count
  caloriesBurned: { type: Number, default: 0 },    // ⭐ lifetime calories

  lastWorkoutDate: { type: Date },

  // Muscle frequency
  muscles: {
    type: Object,
    default: {}
  },

  // ⭐ DAILY CALORIES HISTORY
  dailyCalories: {
    type: Map,
    of: Number,
    default: {} 
    /*
      "2025-11-27": 350,
      "2025-11-26": 220,
      "2025-11-20": 100,
    */
  }
  
});

module.exports = mongoose.model("WorkoutHistory", WorkoutHistorySchema);
