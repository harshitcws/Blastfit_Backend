// controllers/generateCustomWorkoutPlan.js
const Exercise = require('../models/exercise');
const WorkoutPlan = require('../models/WorkoutPlan');

// Optional: contraindication knowledge base
let contraindicationsMap = [];
try {
  ({ contraindicationsMap } = require('../services/contraindicationsMap'));
} catch (_) {
  contraindicationsMap = [];
}

/* ----------------------------- helpers & maps ----------------------------- */

const norm = (s) => (s ?? '').toString().trim().toLowerCase();

const getRange = (val, fallbackMin, fallbackMax) => {
  if (Array.isArray(val)) {
    const [a, b] = val;
    const min = Number.isFinite(+a) ? +a : fallbackMin;
    const max = Number.isFinite(+b) ? +b : fallbackMax;
    return [Math.min(min, max), Math.max(min, max)];
  }
  if (val == null) return [fallbackMin, fallbackMax];
  const n = +val;
  return [n, n];
};

// UI workout types → DB Exercise.type (extend as needed)
const workoutTypeMap = {
  strength: 'main',
  cardio: 'assistance',
  walk: 'warmup',         // light steady movement
  run: 'assistance',
  yoga: 'stretch',
  hiit: 'finisher',
};

// Body part → muscles in DB `muscles` field
const bodyPartMusclesMap = {
  upper: ['Chest', 'Back', 'Shoulder', 'Arms', 'Biceps', 'Triceps', 'Neck', 'Traps', 'Forearms'],
  lower: ['Leg', 'Legs', 'Glutes', 'Hamstrings', 'Quads', 'Calves', 'Hips'],
  core:  ['Abs', 'Core', 'Obliques', 'Lower Back'],
  full: [
    'Chest','Back','Shoulder','Arms','Biceps','Triceps','Neck','Traps','Forearms',
    'Leg','Legs','Glutes','Hamstrings','Quads','Calves','Hips','Abs','Core','Obliques','Lower Back'
  ],
};

// sorting
const sortMapping = (sortBy) => {
  switch (norm(sortBy)) {
    case 'newest': return { createdAt: -1 };
    case 'highest rated': return { views: -1, createdAt: -1 }; // fallback (no rating field)
    case 'most popular':
    case 'popular':
    default: return { views: -1, createdAt: -1 };
  }
};

// quick contraindication check
const isContraindicated = (exerciseTitle, userLimitations = [], gender) => {
  const title = norm(exerciseTitle);
  const limits = Array.isArray(userLimitations)
    ? userLimitations
    : (typeof userLimitations === 'string' ? (JSON.parse(userLimitations || '[]') || []) : []);

  if (!limits.length || !contraindicationsMap.length) return false;

  for (const lim of limits) {
    const L = norm(lim);
    for (const cond of contraindicationsMap) {
      const names = [cond.condition, ...(cond.aliases || [])].map(norm);
      const matchesName = names.includes(L) || L.includes(names[0] || '');
      if (!matchesName) continue;
      if ((cond.keywords || []).some(kw => title.includes(norm(kw)))) {
        return true;
      }
    }
  }

  // example extra guard (tweak/remove as you maintain the map)
  if (gender && norm(gender) === 'female' && title.includes('barbell overhead press')) {
    return true;
  }

  return false;
};

// estimate calories for one card (very rough)
const estimateExerciseCalories = (exercise, minutes = 5, userWeightKg = 70) => {
  const metByType = ({
    warmup: 3.5,
    main: 5.5,       // generic strength-ish
    assistance: 6.0, // cardio/accessory
    stretch: 2.5,    // yoga/stretch
    finisher: 7.0
  })[norm(exercise.type)] ?? 5.0;

  const intensityFactor = ({
    low: 0.85,
    medium: 1.0,
    high: 1.2
  })[norm(exercise.intensity)] ?? 1.0;

  const MET = metByType * intensityFactor;
  const calories = MET * 3.5 * (userWeightKg || 70) / 200 * (minutes || 5);
  return Math.round(calories);
};

// first safe alternative: same muscles, not contraindicated
const findAlternative = async (badExercise, opts) => {
  const { userLimitations, gender, excludeIds = [], sortSpec } = opts || {};
  const muscle = (badExercise.muscles || '').split(',')[0]?.trim();
  const qry = {
    _id: { $nin: excludeIds.concat([badExercise._id]) },
    ...(muscle ? { muscles: new RegExp(muscle, 'i') } : {}),
  };
  const candidates = await Exercise.find(qry).sort(sortSpec).limit(25).lean();
  const safe = candidates.find(c => !isContraindicated(c.title, userLimitations, gender));
  return safe || null;
};

// pick first N items, respecting already-used IDs
const takeUnique = (arr, n, used) => {
  const out = [];
  for (const it of arr) {
    if (out.length >= n) break;
    const id = it._id.toString();
    if (!used.has(id)) {
      out.push(it);
      used.add(id);
    }
  }
  return out;
};

/* --------------------------------- handler -------------------------------- */

module.exports = async function generateCustomWorkoutPlan(req, res) {
  try {
    const user = req.user || {};
    const {
      duration,           // number | [min, max]
      calories,           // number | [min, max]
      workoutTypes = [],  // e.g. ["walk", "strength"]
      muscles = [],       // e.g. ["upper","full"]
      sortBy = 'Most Popular',
      planName
    } = req.body || {};

    // ranges
    const [minDur, maxDur] = getRange(duration, 20, 45);
    const [minCal, maxCal] = getRange(calories, 0, 9999);
    const targetDuration = Math.round((minDur + maxDur) / 2);

    const perExerciseMin = 5; // each card ≈ 5 minutes
    let targetSlots = Math.max(1, Math.floor(targetDuration / perExerciseMin));

    const sortSpec = sortMapping(sortBy);
    const allowedDbTypes = [...new Set(
      (workoutTypes || []).map(t => workoutTypeMap[norm(t)]).filter(Boolean)
    )];

    // muscles → regex OR
    const expandedMuscles = (muscles || []).flatMap(bp => bodyPartMusclesMap[norm(bp)] || []);
    const muscleRegex = expandedMuscles.length ? { $in: expandedMuscles.map(m => new RegExp(m, 'i')) } : undefined;

    // Pools by type (pre-filter by type + muscles if provided)
    const baseFind = async (type, limit = 300) => {
      const q = { ...(type ? { type } : {}) };
      if (muscleRegex) q.muscles = muscleRegex;
      return Exercise.find(q).sort(sortSpec).limit(limit).lean();
    };

    // Main candidates: if user specified types → union of those types; else default to main/assistance
    const mainTypes = allowedDbTypes.length ? allowedDbTypes : ['main', 'assistance', 'stretch'];
    const uniqueById = (arr) => {
      const seen = new Set();
      return arr.filter(x => (seen.has(x._id.toString()) ? false : (seen.add(x._id.toString()), true)));
    };

    const poolsByType = await Promise.all([
      baseFind('warmup', 150),
      baseFind('finisher', 150),
      ...mainTypes.map(t => baseFind(t, 500))
    ]);

    const warmupPool   = poolsByType[0];
    const finisherPool = poolsByType[1];
    const mainPool     = uniqueById([].concat(...poolsByType.slice(2)));

    // Always include at least 1 warmup (if available)
    const usedIds = new Set();
    let warmups = takeUnique(warmupPool, 1, usedIds);

    // Build mains until we approach targetSlots (reserve 0–1 finisher optionally)
    // Start with a seed of mains that match filters most closely
    const slotsForMain = Math.max(1, targetSlots - warmups.length - 1); // keep room for optional finisher
    let mains = takeUnique(mainPool, slotsForMain, usedIds);

    // If we didn’t get anything (filters too tight), broaden to ANY type (but keep muscles if provided)
    if (mains.length === 0) {
      const q = {};
      if (muscleRegex) q.muscles = muscleRegex;
      const broad = await Exercise.find(q).sort(sortSpec).limit(500).lean();
      mains = takeUnique(broad, slotsForMain, usedIds);
    }

    // If still nothing at all, last resort: any exercises
    if (warmups.length + mains.length === 0) {
      const any = await Exercise.find({}).sort(sortSpec).limit(targetSlots).lean();
      warmups = takeUnique(any.filter(x => norm(x.type) === 'warmup'), 1, usedIds);
      mains   = takeUnique(any, Math.max(1, targetSlots - warmups.length), usedIds);
    }

    // Calories pass 1: compute current
    const weightKg = user.weightKg || user.weight || 70;
    const mark = (ex) => ({
      ...ex,
      estCalories: estimateExerciseCalories(ex, perExerciseMin, weightKg),
    });

    // Attach warnings & alternatives (we KEEP contraindicated items, but tag & suggest)
    const userLimitations = user.physicalLimitation || [];
    const withSafety = async (items) => {
      const out = [];
      for (const it of items) {
        const warned = isContraindicated(it.title, userLimitations, user.gender);
        let alternative = null;
        if (warned) {
          alternative = await findAlternative(it, {
            userLimitations, gender: user.gender,
            excludeIds: Array.from(usedIds),
            sortSpec
          });
        }
        out.push({
          ...mark(it),
          warning: warned ? '⚠️ This exercise may not be suitable given your profile.' : undefined,
          alternative: alternative ? {
            _id: alternative._id,
            title: alternative.title,
            muscles: alternative.muscles,
            img: alternative.img,
            type: alternative.type,
            intensity: alternative.intensity
          } : undefined
        });
      }
      return out;
    };

    // Decorate
    warmups = await withSafety(warmups);
    mains   = await withSafety(mains);

    // Sum cals
    const sumCals = (arr) => arr.reduce((a, b) => a + (b.estCalories || 0), 0);
    let totalCalories = sumCals(warmups) + sumCals(mains);

    // If calories below min, add finishers until within range (or we hit a slot cap)
    const maxSlotsHard = Math.max(targetSlots, 12); // cap so we never explode list
    let finishers = [];
    const finPoolFiltered = finisherPool.filter(x => !usedIds.has(x._id.toString()));

    let i = 0;
    while (totalCalories < minCal && (warmups.length + mains.length + finishers.length) < maxSlotsHard) {
      const next = finPoolFiltered[i++];
      if (!next) break; // nothing more to add
      usedIds.add(next._id.toString());
      const decorated = await withSafety([next]);
      finishers.push(decorated[0]);
      totalCalories = sumCals(warmups) + sumCals(mains) + sumCals(finishers);
    }

    // If calories way above max, trim from mains (last items first)
    const trimFromEnd = (arr, over) => {
      const copy = arr.slice();
      while (over > 0 && copy.length > 1) { // keep at least one main
        const popped = copy.pop();
        over -= (popped.estCalories || 0);
      }
      return copy;
    };
    if (totalCalories > maxCal) {
      const overBy = totalCalories - maxCal;
      mains = trimFromEnd(mains, overBy);
      totalCalories = sumCals(warmups) + sumCals(mains) + sumCals(finishers);
    }

    // Ensure at least one finisher if we’re still below minCal and we have room and candidates
    if (finishers.length === 0 && totalCalories < minCal && finPoolFiltered.length) {
      const decorated = await withSafety([finPoolFiltered[0]]);
      finishers = decorated;
      totalCalories = sumCals(warmups) + sumCals(mains) + sumCals(finishers);
    }

    const totalExercises = warmups.length + mains.length + finishers.length;
    const calorieDifference =
      (minCal === 0 && maxCal === 9999) ? null :
      (totalCalories < minCal ? (minCal - totalCalories) :
       totalCalories > maxCal ? (totalCalories - maxCal) * -1 : 0);

    /* ----------------------------- persist a plan ----------------------------- */

    const sessionExercises = [
      ...warmups.map(e => ({ exerciseId: e._id, sets: 2, reps: 12 })),
      ...mains.map(e => ({
        exerciseId: e._id,
        // very light logic for sets/reps from intensity:
        sets: norm(e.intensity) === 'high' ? 4 : 3,
        reps: norm(e.intensity) === 'low' ? 15 : 10
      })),
      ...finishers.map(e => ({ exerciseId: e._id, sets: 3, reps: 12 })),
    ];

    const saved = await WorkoutPlan.create({
      userId: user._id,
      goal: user.primaryFitnessGoal || 'Custom',
      frequency: user.workoutDaysPerWeek || 1,
      isCustom: true,
      planName: planName || `Custom Plan - ${new Date().toISOString()}`,
      filters: { duration, calories, workoutTypes, muscles, sortBy },
      metrics: {
        totalCaloriesBurned: totalCalories,
        calorieDifference
      },
      blocks: [
        {
          name: 'Custom Plan',
          sessions: [
            { day: 'Day 1', exercises: sessionExercises }
          ]
        }
      ]
    });

    /* ------------------------------- respond ------------------------------- */

    return res.json({
      message: '🎯 Custom workout plan generated!',
      filters: { duration, calories, workoutTypes, muscles, sortBy },
      total: totalExercises,
      totalCaloriesBurned: totalCalories,
      calorieDifference,
      warmups,
      main: mains,
      finishers,
      templateId: saved._id
    });
  } catch (err) {
    console.error('❌ Error generating custom plan:', err);
    return res.status(500).json({ error: 'Failed to generate custom workout plan' });
  }
};
