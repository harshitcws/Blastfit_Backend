const mongoose = require('mongoose');
const Exercise = require('./models/exercise');
const dotenv = require('dotenv');
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lift_verse_pro');
    console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const warmupTitles = [
    'ARM CIRCLES', 'ARM SCISSORS','SIDE ARM RAISES', 'CHIN TUCK',
    'INCHWORM', 'BIRD DOG', 'JUMPING JACK','SIDE NECK STRETCH', 
    'NECK ROTATION STRETCH', 'STANDING LEG CIRCLES', 'LATERAL LEG SWINGS',
    'HIGH KNEE RUN', 'STANDING KNEE HUGS', 'KNEE CIRCLES','UPPER BACK STRETCH'
  ];
  
  const finisherTitles = [
    'BURPEES', 'MOUNTAIN CLIMBER', 'JUMPING JACK',
    'PUSHUP BURNOUT', 'HIGH KNEES', 'JUMP SQUATS', 'SNAP JUMPS',
    'ZIG ZAG HOPS PLYOMETRIC', 'SKATER JUMP', 'SKATER',
    'FAST FEET', 'PLANK JACKS', 'SPLIT JUMP SQUAT', 'POWER LUNGE',
    'BACKWARD JUMP', 'SINGLE LEG BROAD JUMP', 'HIGH KNEE SKIPS'
  ];
  
  const intensityMap = {
    'ARM CIRCLES': 'low',
    'ARM SCISSORS': 'medium',
    'SIDE ARM RAISES': 'medium',
    'CHIN TUCK': 'medium',
    'SIDE NECK STRETCH': 'medium',
    'NECK ROTATION STRETCH': 'medium',
    'INCHWORM': 'low',
    'BIRD DOG': 'low',
    'JUMPING JACK': 'medium',
    'SIDE BEND PRESS': 'low',
    'STANDING LEG CIRCLES': 'low',
    'LATERAL LEG SWINGS': 'low',
    'HIGH KNEE RUN': 'medium',
    'STANDING KNEE HUGS': 'medium',
    'KNEE CIRCLES': 'low',
    'BURPEES': 'high',
    'MOUNTAIN CLIMBER': 'high',
    'PUSHUP BURNOUT': 'high',
    'HIGH KNEES': 'high',
    'JUMP SQUATS': 'high',
    'SNAP JUMPS': 'high',
    'ZIG ZAG HOPS PLYOMETRIC': 'high',
    'SKATER JUMP': 'high',
    'SKATER': 'high',
    'FAST FEET': 'high',
    'PLANK JACKS': 'high',
    'SPLIT JUMP SQUAT': 'high',
    'POWER LUNGE': 'high',
    'BACKWARD JUMP': 'medium',
    'SINGLE LEG BROAD JUMP': 'medium',
    'HIGH KNEE SKIPS': 'medium'
  };

  const normalize = str => str.replace(/\s+/g, ' ').trim().toLowerCase();

  const warmupSet = new Set(warmupTitles.map(normalize));
const finisherSet = new Set(finisherTitles.map(normalize));

  
async function patchExercises() {
  await connectDB();
  const all = await Exercise.find();

  let warmCount = 0, finCount = 0;

  for (const ex of all) {
    const titleNorm = normalize(ex.title);

    if (warmupSet.has(titleNorm)) {
    console.log('✅ Warmup match:', ex.title, '->', titleNorm);
    ex.type = 'warmup';
    ex.intensity = intensityMap[titleNorm];
    await ex.save();
    warmCount++;
    } else if (finisherSet.has(titleNorm)) {
    console.log('🔥 Finisher match:', ex.title, '->', titleNorm);
    ex.type = 'finisher';
    ex.intensity = intensityMap[titleNorm];
    await ex.save();
    finCount++;
    } /*else {
    console.log('❌ No match for:', ex.title, '->', titleNorm);
    }*/

  }


  console.log(`✅ Warmups tagged: ${warmCount}, Finishers tagged: ${finCount}`);
  process.exit();
}

patchExercises().catch(err => {
  console.error('❌ Patch failed:', err);
  process.exit(1);
});
