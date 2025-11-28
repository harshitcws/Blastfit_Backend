const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
  },
  age: {
    type: Number,
    default: null,
  },
  height: {
    type: Number,
    default: null,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: null,
  },
  address: {
    type: String,
    default: null,
  },
  phone: {
    type: String,
    default: null,
  },
  profilePicture: {
    type: String,
    default: null,
  },   restDays: [{ type: String }],

  password: {
    type: String,
    // required: [true, 'Password is required'],
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  // Step-by-step signup fields:
  primaryFitnessGoal: { type: String },
  weight: { type: Number },
  weightLabel: { type: String },
  heightLabel: { type: String },
  fitnessExperience: { type: Boolean }, 
  physicalLimitation:{type: String},
  workoutDaysPerWeek: { type: Number },
  exercisePreferences: [{ type: String }], // e.g., ['Yoga', 'Strength']
  calorieGoalPerDay: { type: Number },
  otp: {
    type: Number,
    default: null,
  },
  passresetOtp: {
    type: Number,
    default: null,
  },
  otpExpires: {
    type: Date,
    default: null,
  },
  passresetOtpExpires: {
    type: Date,
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }]

}, { timestamps: true });

// Encrypt password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to match password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
