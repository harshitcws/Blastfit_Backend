const BodyMeasurement = require('../models/BodyMeasurement');

// CREATE or UPDATE Measurement
exports.saveMeasurement = async (req, res) => {
  try {
    const { userId, date, chest, shoulders, abs, biceps, quads, calves, unit } = req.body;

    let existing = await BodyMeasurement.findOne({ userId, date });

    if (existing) {
      existing.chest = chest;
      existing.shoulders = shoulders;
      existing.abs = abs;
      existing.biceps = biceps;
      existing.quads = quads;
      existing.calves = calves;
      existing.unit = unit;
      await existing.save();

      return res.json({ success: true, message: "Updated", data: existing });
    }

    const created = await BodyMeasurement.create(req.body);

    res.json({ success: true, message: "Created", data: created });

  } catch (e) {
    res.status(500).json({ success: false, message: "Server Error", error: e.message });
  }
};


// GET ALL MEASUREMENTS for USER
exports.getAllMeasurements = async (req, res) => {
  try {
    const { userId } = req.params;

    const data = await BodyMeasurement.find({ userId }).sort({ date: 1 });

    res.json({ success: true, data });

  } catch (e) {
    res.status(500).json({ success: false, message: "Server Error", error: e.message });
  }
};


// GET ONE measurement by date
exports.getMeasurementByDate = async (req, res) => {
  try {
    const { userId, date } = req.params;
    
    const data = await BodyMeasurement.findOne({ userId, date });

    res.json({ success: true, data });

  } catch (e) {
    res.status(500).json({ success: false, message: "Server Error", error: e.message });
  }
};
