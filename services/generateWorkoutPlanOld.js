const Exercise = require('../models/exercise');
const UserExerciseHistory = require('../models/userExerciseHistory');
const { contraindicationsMap, exerciseTaggingProfiles } = require('./contraindicationsMap');

// --- Helper Modules ---

/**
 * Determines if an exercise should be skipped due to user's physical limitations.
 */
function isContraindicated(exercise, limitations, gender) {
  const title = exercise.title.toLowerCase();
  // check conditions
  for (const lim of limitations) {
    const cond = contraindicationsMap.find(c =>
      c.condition.toLowerCase() === lim.toLowerCase() ||
      c.aliases?.some(a => lim.toLowerCase().includes(a.toLowerCase()))
    );
    if (cond?.keywords?.some(kw => title.includes(kw))) return true;
  }
  // Optional: female-specific filter
  if (gender === 'female' && title.includes('barbell overhead press')) return true;
  return false;
}

/**
 * Adds metadata tags (e.g. type, difficulty) to enriched exercise objects.
 */
function enrichExercise(ex) {
  const base = ex.toObject ? ex.toObject() : { ...ex };
  const title = base.title.toLowerCase();
  const tag = exerciseTaggingProfiles.find(p =>
    p.match?.some(m => title.includes(m)) ||
    p.titleContains?.some(tc => title.includes(tc))
  );
  return tag ? { ...base, ...tag } : base;
}

/**
 * Sorts exercises based on how well they match the user's muscle preferences.
 */
function prioritizeExercises(exList, prefs) {
  return exList.sort((a, b) => {
    const aMatch = prefs.some(p => a.muscles?.toLowerCase().includes(p));
    const bMatch = prefs.some(p => b.muscles?.toLowerCase().includes(p));
    return aMatch === bMatch ? 0 : aMatch ? -1 : 1;
  });
}

// --- Data Pools & Mappings ---

const preferenceSynonyms = {
  jogging: ['jog', 'run', 'treadmill'],
  walking: ['walk', 'steps', 'brisk'],
  biking: ['bike', 'cycling'],
  cardio: ['aerobic', 'interval'],
  weightlift: ['dumbbell', 'barbell', 'strength'],
  yoga: ['stretch', 'asana'],
  hiking: ['trail', 'hike'],
};

const warmupPoolNames = [
  'Jumping Jacks', 'Mountain Climbers', 'Burpees', 'Plank Hold (on Elbows)'
];
const finisherPoolNames = [
  'Burpees', 'Jump Squats', 'Mountain Climbers', 'Pushup Burnout'
];

const METs = {
  Burpees: 8,
  'Dumbbell Walking Lunge': 5,
  'Mountain Climbers': 8,
  'Jumping Jacks': 8,
  'Plank Hold (on Elbows)': 3,
  'Pushup Burnout': 6,
  'Jump Squats': 7
};

/** Estimate calories using MET, weight, and exercise volume */
function estimateCalories(sets, reps, weightKg = 70, title = '') {
  const met = METs[title] || 4;
  const totalReps = sets * reps;
  const minutes = totalReps * 0.5 / 60;
  return Math.round((met * 3.5 * weightKg * minutes) / 200);
}

// --- Main Workout Planner ---

module.exports = async function generateWorkoutPlan(user) {
  const {
    _id: userId,
    workoutDaysPerWeek,
    exercisePreferences = [],
    primaryFitnessGoal,
    fitnessExperience,
    calorieGoalPerDay,
    physicalLimitation,
    gender,
    weightKg
  } = user;

  const prefs = exercisePreferences.flat().map(p => p.toLowerCase());
  const limitations = Array.isArray(physicalLimitation)
    ? physicalLimitation
    : JSON.parse(physicalLimitation || '[]');

  const experiencePhase = fitnessExperience
    ? ['Intermediate','Intermediate','Experienced','Experienced']
    : ['Beginner','Beginner','Beginner','Beginner'];

  // Step A: Fetch & filter
  const allKeywords = prefs.flatMap(p => [p, ...(preferenceSynonyms[p] || [])]);
  const regexFilters = allKeywords.map(k => new RegExp(k, 'i'));
  const rawExercises = await Exercise.find(
    regexFilters.length
      ? { $or: regexFilters.map(rx => ({ title: { $regex: rx } })) }
      : {}
  );

  const safe = rawExercises.filter(ex =>
    !isContraindicated(ex, limitations, gender)
  );

  const enriched = prioritizeExercises(
    safe.map(enrichExercise), prefs
  );

  const warmups = enriched.filter(ex => warmupPoolNames.includes(ex.title));
  const finishers = enriched.filter(ex => finisherPoolNames.includes(ex.title));

  // Load/exercise history
  let history = {};
  try {
    const histDoc = await UserExerciseHistory.findOne({ userId });
    history = histDoc?.history || {};
  } catch {
    history = {};
  }

  const blocks = [];
  let totalCalories = 0;

  for (let week = 1; week <= 4; week++) {
    const setsReps = week <= 2 ? { sets: 3, reps: 12 }
                     : week <= 3 ? { sets: 4, reps: 10 }
                     : { sets: 5, reps: 8 };

    const perSession = experiencePhase[week - 1] === 'Beginner' ? 1
                         : experiencePhase[week - 1] === 'Intermediate' ? 2 : 3;

    const sessions = [];

    for (let day = 0; day < workoutDaysPerWeek; day++) {
      const idx = (week - 1) * workoutDaysPerWeek + day;
      const rawMain = enriched.slice(idx * perSession, idx * perSession + perSession);

      // Select warmups and finishers
      const w1 = warmups[(idx + week) % warmups.length];
      const w2 = warmups[(idx + week + 1) % warmups.length];
      const f1 = finishers[(idx + day) % finishers.length];
      const f2 = finishers[(idx + day + 1) % finishers.length];

      const exercises = [];

      if (w2) exercises.push({ phase: 'warmup', ...w2, sets:1, reps:5 });
      if (w1) exercises.push({ phase: 'warmup', ...w1, sets:1, reps:5 });

      rawMain.forEach(ex => {
        const prev = history[ex._id]?.reps || setsReps.reps;
        const newReps = Math.min(prev + 1, setsReps.reps);
        exercises.push({
          phase: 'main',
          _id: ex._id,
          title: ex.title,
          img: ex.img,
          sets: setsReps.sets,
          reps: newReps
        });
        history[ex._id] = { sets: setsReps.sets, reps: newReps };
      });

      if (f1) exercises.push({ phase: 'finisher', ...f1, sets:1, reps:10 });
      if (f2) exercises.push({ phase: 'finisher', ...f2, sets:1, reps:10 });

      const cals = exercises.reduce((sum, ex) =>
        sum + estimateCalories(ex.sets, ex.reps, weightKg, ex.title), 0);

      totalCalories += cals;
      sessions.push({ day: `Day ${day+1}`, calories: cals, exercises });
    }
    blocks.push({ name: `Week ${week}`, sessions });
  }

  // Save updated history
  await UserExerciseHistory.findOneAndUpdate(
    { userId },
    { userId, history },
    { upsert: true }
  );

  const totalDays = workoutDaysPerWeek * 4;
  const expected = calorieGoalPerDay * totalDays;
  const deficit = expected - totalCalories;

  return {
    goal: primaryFitnessGoal || 'General Fitness',
    frequency: workoutDaysPerWeek,
    blocks,
    caloriesBurnedTotal: totalCalories,
    caloriesBurnedPerDay: Math.round(totalCalories / totalDays),
    calorieDeficit: deficit,
    meetsCalorieGoal: totalCalories >= expected,
    message: "🩺 This is a recommendation only—please consult your physician."
  };
};
