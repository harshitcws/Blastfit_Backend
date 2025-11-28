const mongoose = require('mongoose');

const WorkoutPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // index, not unique
  },
  goal: {
    type: String,
    required: true,
  },
  frequency: {
    type: Number,
    required: true,
  },
  musclePriority: {
    type: [String],
    default: [],
  },
  isCustom: {
    type: Boolean,
    default: false
  },
  planName: {
    type: String, // e.g., "Morning Burn", "Core Blast"
    required: function() { return this.isCustom; }
  },
  filters: {
    type: Object // 🔍 optional — stores duration, intensity, etc.
  },
  blocks: [
    {
      name: { type: String, required: true }, // e.g., "Week 1-2: Foundation"
      sessions: [
        {
          day: { type: String, required: true }, // e.g., "Monday"
          isAutoFilled: { type: Boolean, default: false },
          exercises: [
            {
              exerciseId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Exercise',
                required: true,
              },
              sets: { type: Number, required: true },
              reps: { type: Number, required: true },
            }
          ]
        }
      ]
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('WorkoutPlan', WorkoutPlanSchema);
