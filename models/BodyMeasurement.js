const mongoose = require("mongoose");

const BodyMeasurementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  date: { type: String, required: true }, // "YYYY-MM-DD"
  
  chest: Number,
  shoulders: Number,
  abs: Number,
  biceps: Number,
  quads: Number,
  calves: Number,

  unit: { type: String, default: "cm" },
}, { timestamps: true });

module.exports = mongoose.model("BodyMeasurement", BodyMeasurementSchema);
