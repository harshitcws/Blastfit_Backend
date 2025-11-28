const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  video: { type: String },
  equipment: { type: String },
  muscles: { type: String },
  metadata: {
    muscleGroups: [String],
    difficulty: String,
    avoidFor: [String],
    priorityTags: [String],
    type: String,
    recommendedFor: [String],
  },
  intensity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  type: {
    type: String,
    enum: ['assistance', 'warmup', 'stretch', 'main', 'finisher'],
    default: 'main'
  },
  views: { type: Number, default: 0 }
  
}, { timestamps: true });

module.exports = mongoose.model('Exercise', ExerciseSchema);
