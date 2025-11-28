const mongoose = require('mongoose');
const UserExerciseHistory = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  history: { type: Map, of: { sets: Number, reps: Number } }
});
module.exports = mongoose.model('UserExerciseHistory', UserExerciseHistory);
