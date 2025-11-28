// services/generateWorkoutPlan.js
const Exercise = require('../models/exercise');
const UserExerciseHistory = require('../models/userExerciseHistory');
const { contraindicationsMap, exerciseTaggingProfiles } = require('./contraindicationsMap');

// --- Helper Functions ---

function isContraindicated(ex, limitations = [], gender) {
  const title = ex.title.toLowerCase();
  for (const lim of limitations) {
    const cond = contraindicationsMap.find(c =>
      c.condition.toLowerCase() === lim.toLowerCase() ||
      c.aliases?.some(a => lim.toLowerCase().includes(a.toLowerCase()))
    );
    if (cond?.keywords?.some(kw => title.includes(kw))) return true;
  }
  if (gender === 'female' && title.includes('barbell overhead press')) return true;
  return false;
}

function enrichExercise(ex) {
  const base = ex.toObject ? ex.toObject() : { ...ex };
  const title = base.title.toLowerCase();
  const profile = exerciseTaggingProfiles.find(p =>
    p.match?.some(m => title.includes(m)) ||
    p.titleContains?.some(tc => title.includes(tc))
  );
  return profile ? { ...base, ...profile } : base;
}

function prioritizeExercises(list, prefs = []) {
  return list.sort((a, b) => {
    const aMatch = prefs.some(p => a.muscles?.toLowerCase().includes(p));
    const bMatch = prefs.some(p => b.muscles?.toLowerCase().includes(p));
    return aMatch === bMatch ? 0 : aMatch ? -1 : 1;
  });
}

// MET values for standardized exercises
const METs = {
  'Burpees': 8,
  'Dumbbell Walking Lunge': 5,
  'Mountain Climbers': 8,
  'Jumping Jacks': 8,
  'Plank Hold (on Elbows)': 3,
  'Pushup Burnout': 6,
  'Jump Squats': 7,
  'Default': 4
};

// Estimate calories
function estimateCalories(sets, reps, weight = 70, title = '') {
  const met = METs[title] || METs['Default'];
  const minutes = (sets * reps * 0.5) / 60;
  return Math.round((met * 3.5 * weight * minutes) / 200);
}

// Estimate duration in seconds
function estimateDuration(sets, reps) {
  return Math.round(sets * reps * 1);
}

// Pick unused mains
function selectMainExercises(mains, usedSet, count) {
  return mains.filter(m => !usedSet.has(m._id.toString())).slice(0, count);
}

// Goal-based rules
const goalExerciseRules = {
  'gain weight': { order: ['warmup', 'main', 'finisher'], intensity: 'low' },
  'lose weight': { order: ['warmup', 'main', 'finisher', 'stretch'], intensity: 'medium' },
  'build muscles': { order: ['warmup', 'main', 'finisher', 'assistance'], intensity: 'high' },
  'endurance': { order: ['warmup', 'main', 'finisher', 'assistance', 'stretch'], intensity: 'high' },
  'try': { order: ['warmup', 'main', 'finisher'], intensity: 'high' }
};

// Number of exercises per phase to match your new table
const phaseExtraExercises = {
  'gain weight': { warmup: 1, main: 0, finisher: 2, assistance: 1, stretch: 1 },
  'lose weight': { warmup: 1, main: 0, finisher: 2, assistance: 1, stretch: 2 },
  'build muscles': { warmup: 1, main: 0, finisher: 2, assistance: 2, stretch: 1 },
  'endurance': { warmup: 1, main: 0, finisher: 2, assistance: 2, stretch: 2 },
  'try': { warmup: 1, main: 0, finisher: 2, assistance: 1, stretch: 1 },
};

// Muscle splits based on workout days
const muscleSplits = {
  7: [
    ['Chest'],
    ['Back'],
    ['Legs'],
    ['Shoulders'],
    ['Biceps', 'Triceps'],
    ['Full Body'],
    ['Abs']
  ],
  6: [
    ['Chest', 'Triceps'],
    ['Back', 'Biceps'],
    ['Legs'],
    ['Shoulders'],
    ['Biceps', 'Triceps'],
    ['Abs']
  ],
  5: [
    ['Chest', 'Triceps'],
    ['Back', 'Biceps'],
    ['Legs'],
    ['Shoulders'],
    ['Abs']
  ],
  4: [
    ['Chest', 'Back'],
    ['Legs'],
    ['Shoulders', 'Biceps', 'Triceps'],
    ['Full Body']
  ],
  3: [
    ['Chest', 'Shoulders', 'Triceps'], // Push
    ['Back', 'Biceps'], // Pull
    ['Legs', 'Glutes', 'Calves'] // Legs
  ],
  2: [
    ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'], // Upper
    ['Legs', 'Glutes', 'Calves', 'Abs'] // Lower
  ],
  1: [
    ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Glutes', 'Calves', 'Abs'] // Full Body
  ]
};

// Function to get exercises for specific muscles
function getExercisesForMuscles(exercises, targetMuscles) {
  return exercises.filter(ex => {
    const exerciseMuscles = ex.muscles ? ex.muscles.split(',').map(m => m.trim()) : [];
    return targetMuscles.some(targetMuscle => 
      exerciseMuscles.some(exMuscle => 
        exMuscle.toLowerCase().includes(targetMuscle.toLowerCase())
      )
    );
  });
}

// Function to get muscle focus name for the session
function getMuscleFocusName(targetMuscles) {
  if (targetMuscles.length === 1) return targetMuscles[0];
  if (targetMuscles.includes('Full Body')) return 'Full Body';
  if (targetMuscles.includes('Chest') && targetMuscles.includes('Triceps')) return 'Chest & Triceps';
  if (targetMuscles.includes('Back') && targetMuscles.includes('Biceps')) return 'Back & Biceps';
  if (targetMuscles.includes('Shoulders') && targetMuscles.includes('Biceps') && targetMuscles.includes('Triceps')) return 'Shoulders & Arms';
  if (targetMuscles.includes('Chest') && targetMuscles.includes('Back')) return 'Chest & Back';
  if (targetMuscles.includes('Legs') && targetMuscles.includes('Glutes') && targetMuscles.includes('Calves')) return 'Legs';
  if (targetMuscles.length > 3) return 'Upper Body';
  return targetMuscles.join(' & ');
}

// Helper function to get split description
function getSplitDescription(days) {
  const descriptions = {
    7: "Each day one focus muscle/group",
    6: "Push/Pull/Legs + Repeat or Abs/Full Body", 
    5: "Combine related muscles",
    4: "Two major splits + combo days",
    3: "Classic Push / Pull / Legs",
    2: "Upper / Lower",
    1: "Full Body"
  };
  return descriptions[days] || "Custom split";
}

// --- Main Function ---
module.exports = async function generateWorkoutPlan(user) {
  const {
    _id: userId,
    workoutDaysPerWeek,
    exercisePreferences = [],
    fitnessExperience,
    calorieGoalPerDay,
    physicalLimitation,
    gender,
    weight = 70,
    primaryFitnessGoal
  } = user;

  const prefs = exercisePreferences.flat().map(p => p.toLowerCase());
  const limitations = Array.isArray(physicalLimitation)
    ? physicalLimitation
    : JSON.parse(physicalLimitation || '[]');

  const phasePlan = fitnessExperience
    ? ['Intermediate', 'Intermediate', 'Experienced', 'Experienced']
    : ['Beginner', 'Beginner', 'Beginner', 'Beginner'];

  const raw = await Exercise.find({});
  const safe = raw
    .filter(ex => !isContraindicated(ex, limitations, gender))
    .filter(ex => !(gender === 'male' && ex.title.toLowerCase().includes('female')));

  const warmups = safe.filter(ex => ex.type === 'warmup').map(enrichExercise);
  const finishers = safe.filter(ex => ex.type === 'finisher').map(enrichExercise);
  let mains = safe.filter(ex => ex.type === 'main').map(enrichExercise);
  mains = prioritizeExercises(mains, prefs);

  const histDoc = await UserExerciseHistory.findOne({ userId }).lean();
  const history = histDoc?.history || {};
  const usedMainIds = new Set();

  const rules = goalExerciseRules[primaryFitnessGoal?.toLowerCase()] || goalExerciseRules['try'];
  const extraCounts = phaseExtraExercises[primaryFitnessGoal?.toLowerCase()] || {};

  // Get muscle split based on workout days
  const split = muscleSplits[workoutDaysPerWeek] || muscleSplits[3]; // Default to 3 days if not found

  const blocks = [];
  let totalCalories = 0;

  for (let week = 1; week <= 4; week++) {
    const weekIdx = week - 1;
    const setsReps = week <= 2
      ? { sets: 3, reps: 12 }
      : week <= 3
      ? { sets: 4, reps: 10 }
      : { sets: 5, reps: 8 };

    const perSession = phasePlan[weekIdx] === 'Beginner'
      ? 1
      : phasePlan[weekIdx] === 'Intermediate'
      ? 2
      : 3;

    const sessions = [];

    for (let day = 0; day < workoutDaysPerWeek; day++) {
      const targetMuscles = split[day] || ['Full Body'];
      const muscleFocus = getMuscleFocusName(targetMuscles);
      
      // Get main exercises that target the specific muscles for this day
      const dayMainExercises = getExercisesForMuscles(mains, targetMuscles);
      const prioritizedDayMains = prioritizeExercises(dayMainExercises, prefs);

      const sessionExercises = [];

      rules.order.forEach(type => {
        let pool;
        switch(type) {
          case 'warmup': 
            pool = warmups; 
            break;
          case 'main': 
            pool = selectMainExercises(prioritizedDayMains, usedMainIds, perSession); 
            break;
          case 'finisher': 
            pool = finishers; 
            break;
          case 'assistance': 
            pool = safe.filter(ex => ex.type === 'assistance'); 
            break;
          case 'stretch': 
            pool = safe.filter(ex => ex.type === 'stretch'); 
            break;
        }
        if (!pool || pool.length === 0) return;

        const count = type === 'main' ? perSession : (extraCounts[type] || 1);

        for (let i = 0; i < count; i++) {
          if (pool.length === 0) continue;
          
          const ex = pool[(day + i) % pool.length];
          let sets = setsReps.sets;
          let reps = setsReps.reps;

          if (type === 'main') {
            const prev = history[ex._id]?.reps || setsReps.reps;
            reps = Math.min(prev + 1, setsReps.reps);
            usedMainIds.add(ex._id.toString());
            history[ex._id] = { sets, reps };
          }

          const calories = estimateCalories(sets, reps, weight, ex.title);
          const duration = estimateDuration(sets, reps);

          sessionExercises.push({
            phase: type,
            _id: ex._id,
            title: ex.title,
            img: ex.img,
            video: ex.video,
            sets,
            reps,
            intensity: rules.intensity,
            calories,
            duration,
            muscles: ex.muscles // Include muscles information
          });
        }
      });

      const sessionCalories = sessionExercises.reduce((sum, ex) => sum + ex.calories, 0);
      totalCalories += sessionCalories;

      sessions.push({
        day: `Day ${day + 1}`,
        muscleFocus: muscleFocus,
        targetMuscles: targetMuscles,
        calories: sessionCalories,
        exercises: sessionExercises
      });
    }

    blocks.push({ 
      name: `Week ${week}`, 
      sessions 
    });
  }

  await UserExerciseHistory.findOneAndUpdate(
    { userId },
    { userId, history },
    { upsert: true }
  );

  const totalDays = workoutDaysPerWeek * 4;
  const expected = (calorieGoalPerDay || 0) * totalDays;
  const deficit = expected - totalCalories;

  return {
    goal: primaryFitnessGoal || 'General Fitness',
    frequency: workoutDaysPerWeek,
    musclePriority: prefs,
    blocks,
    caloriesBurnedTotal: totalCalories,
    caloriesBurnedPerDay: Math.round(totalCalories / totalDays),
    calorieDeficit: deficit,
    meetsCalorieGoal: totalCalories >= expected,
    message: "🩺 This is a recommendation only — consult your physician.",
    splitDescription: getSplitDescription(workoutDaysPerWeek)
  };
};