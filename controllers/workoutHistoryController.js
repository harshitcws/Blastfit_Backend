const WorkoutHistory = require('../models/WorkoutHistory');

exports.WorkoutHistory = async (req, res) => {
  try {
    const { userId, targetedMuscle, duration, caloriesBurned } = req.body;

    const todayFull = new Date();
    todayFull.setHours(0, 0, 0, 0);

    const todayKey = todayFull.toISOString().split("T")[0]; // yyyy-mm-dd

    let history = await WorkoutHistory.findOne({ userId });

    // FIRST WORKOUT → CREATE NEW RECORD
    if (!history) {
      const newHistory = new WorkoutHistory({
        userId,
        totalDuration: duration,
        totalSessions: 1,
        totalDays: 1,
        caloriesBurned: caloriesBurned,
        lastWorkoutDate: todayFull,
        muscles: { [targetedMuscle]: 1 },
        dailyCalories: { [todayKey]: caloriesBurned } // ⭐ add today calories
      });

      await newHistory.save();
      return res.json({ success: true, message: "History created", data: newHistory });
    }

    // ALWAYS UPDATE
    history.totalSessions += 1;
    history.totalDuration += duration;

    // lifetime calories
    history.caloriesBurned += caloriesBurned;

    // ⭐ DAILY CALORIES UPDATE
    const prev = history.dailyCalories.get(todayKey) || 0;
    history.dailyCalories.set(todayKey, prev + caloriesBurned);

    // NEW DAY CHECK
    const last = new Date(history.lastWorkoutDate);
    last.setHours(0, 0, 0, 0);

    const isNewDay = todayFull.getTime() !== last.getTime();

    if (isNewDay) {
      history.totalDays += 1;
      history.lastWorkoutDate = todayFull;

      history.muscles[targetedMuscle] =
        (history.muscles[targetedMuscle] || 0) + 1;
    }

    await history.save();

    res.json({
      success: true,
      message: "History updated successfully",
      data: history
    });

  } catch (error) {
    console.log("History Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getWorkoutHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const history = await WorkoutHistory.findOne({ userId });

    res.json({
      success: true,
      message: "Workout history fetched",
      data: history || null
    });

  } catch (error) {
    console.log("GET History Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
