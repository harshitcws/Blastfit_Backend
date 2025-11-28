const Exercise = require('../models/exercise');

const { exerciseTaggingProfiles } = require('../services/contraindicationsMap');

// GET all exercises
exports.getAllExercises = async (req, res) => {
  try {
    const exercises = await Exercise.find();
    res.status(200).json(exercises);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch exercises', error });
  }
};

// GET single exercise by ID
exports.getExerciseById = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' });
    res.status(200).json(exercise);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch exercise', error });
  }
};

// POST create new exercise
exports.createExercise = async (req, res) => {
  try {
    const newExercise = new Exercise(req.body);
    const savedExercise = await newExercise.save();
    res.status(201).json(savedExercise);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create exercise', error });
  }
};

// PUT update exercise
exports.updateExercise = async (req, res) => {
  try {
    const updated = await Exercise.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Exercise not found' });
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update exercise', error });
  }
};

// DELETE exercise
exports.deleteExercise = async (req, res) => {
  try {
    const deleted = await Exercise.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Exercise not found' });
    res.status(200).json({ message: 'Exercise deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete exercise', error });
  }
};

//Enrichexercise collection with metadata:


exports.enrichExercises = async (req, res) => {
  try {
    const allExercises = await Exercise.find();

    let updatedCount = 0;

    for (let exercise of allExercises) {
      const title = exercise.title.toLowerCase();

      const matchedProfile = exerciseTaggingProfiles.find(profile =>
        profile.titleContains?.some(keyword => title.includes(keyword)) ||
        profile.match?.some(keyword => title.includes(keyword))
      );

      if (matchedProfile) {
        exercise.metadata = {
          muscleGroups: matchedProfile.muscleGroups || [],
          difficulty: matchedProfile.difficulty || 'Beginner',
          avoidFor: matchedProfile.avoidFor || [],
          priorityTags: matchedProfile.priorityTags || [],
          type: matchedProfile.type || 'Bodyweight',
          recommendedFor: matchedProfile.recommendedFor || [],
        };
        await exercise.save();
        updatedCount++;
      }
    }

    res.json({ success: true, message: `${updatedCount} exercises enriched.` });
  } catch (err) {
    console.error('Enrichment failed:', err);
    res.status(500).json({ success: false, error: 'Failed to enrich exercises.' });
  }
};

// PATCH update exercise views count
exports.updateExerciseViews = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' });
    // Exercise.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true })

    exercise.views = (exercise.views || 0) + 1;
    const updatedExercise = await exercise.save();

    res.status(200).json(updatedExercise);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update views', error });
  }
}

// GET exercises by search query
exports.searchExercises = async (req, res) => {
  try {
    const query = req.query.q || '';
    console.log('Search query:', query);
    const regex = new RegExp(query, 'i'); // case-insensitive

    const results = await Exercise.find({
      $or: [
        { title: regex },
        { muscles: regex },
        { equipment: regex },
        { description: regex }
      ]
    });
    console.log('Search results:', results.length, 'found');
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
};

// Filter exercises based on muscles and difficulty level: 
exports.filterExercises = async (req, res) => {
  try {
    const { muscle, intensity } = req.query;
    let filter = {};

    if (muscle) {
      filter.muscles = new RegExp(`^${muscle}$`, 'i'); // exact match ignoring case
    }

    if (intensity) {
      filter.intensity = new RegExp(`^${intensity}$`, 'i');
    }

    const results = await Exercise.find(filter);
    res.json(results);
  } catch (error) {
    console.error('Filter error:', error);
    res.status(500).json({ message: 'Filtering failed', error: error.message });
  }
};
exports.features = async (req, res) => {
  console.log('Fetching exercises grouped by equipment...');
  try {
    const exercises = await Exercise.find({});
    console.log('Total exercises fetched:', exercises.length);

    const intensityConfig = {
      low:    { reps: 10, sets: 2, calories: 50, duration: "30s" },
      medium: { reps: 15, sets: 3, calories: 100, duration: "45s" },
      high:   { reps: 20, sets: 4, calories: 150, duration: "60s" },
    };

    const grouped = exercises.reduce((acc, exercise) => {
      let equipments = Array.isArray(exercise.equipment) ? exercise.equipment : [exercise.equipment];
      if (!equipments[0]) return acc;

      equipments.forEach(eq => {
        if (!acc[eq]) acc[eq] = [];

        if (acc[eq].length < 5) {
          // Add intensity based calculated values
          const config = intensityConfig[exercise.intensity] || {};

          acc[eq].push({
            ...exercise.toObject(),
            reps: config.reps || null,
            sets: config.sets || null,
            calories: config.calories || null,
            duration: config.duration || null,
          });
        }
      });

      return acc;
    }, {});

    console.log('Grouped keys:', Object.keys(grouped));
    res.status(200).json({ success: true, data: grouped });
  } catch (error) {
    console.error('Error fetching exercises by equipment:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


// exports.featuresByMuscles = async (req, res) => {
//   console.log('Fetching exercises grouped by muscles...');
//   try {
//     const exercises = await Exercise.find({});
//     console.log('Total exercises fetched:', exercises.length);

//     const intensityConfig = {
//       low:    { reps: 10, sets: 2, calories: 50, duration: "30s" },
//       medium: { reps: 15, sets: 3, calories: 100, duration: "45s" },
//       high:   { reps: 20, sets: 4, calories: 150, duration: "60s" },
//     };

//     const grouped = exercises.reduce((acc, exercise) => {
//       // muscles might be a comma-separated string
//       let musclesList = Array.isArray(exercise.muscles)
//         ? exercise.muscles
//         : exercise.muscles?.split(',').map(m => m.trim()) || [];

//       if (musclesList.length === 0) return acc;

//       musclesList.forEach(muscle => {
//         if (!acc[muscle]) acc[muscle] = [];

//         if (acc[muscle].length < 5) { // max 5 per muscle
//           const config = intensityConfig[exercise.intensity] || {};

//           acc[muscle].push({
//             ...exercise.toObject(),
//             reps: config.reps || null,
//             sets: config.sets || null,
//             calories: config.calories || null,
//             duration: config.duration || null,
//           });
//         }
//       });

//       return acc;
//     }, {});

//     console.log('Grouped muscles:', Object.keys(grouped));
//     res.status(200).json({ success: true, data: grouped });
//   } catch (error) {
//     console.error('Error fetching exercises by muscles:', error);
//     res.status(500).json({ success: false, message: 'Server Error' });
//   }
// };
