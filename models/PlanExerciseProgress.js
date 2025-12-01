// 
const mongoose = require('mongoose');

const PlanExerciseProgressSchema = new mongoose.Schema({
  planId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'HarshitCustomPlan', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  completedExercises: [{
    exerciseId: { type: String, required: true },
    exerciseTitle: { type: String },
    completedAt: { type: Date, default: Date.now }
  }],
  totalCompleted: { type: Number, default: 0 },
  totalExercises: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  finishedAt: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model(
  "PlanExerciseProgress",
  PlanExerciseProgressSchema
);
