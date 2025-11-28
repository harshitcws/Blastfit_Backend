const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Exercise = require('./models/exercise'); // ✅ Adjust if your path is different

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/YOUR_DB_NAME'); // ✅ Update fallback if needed
    console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// Define keyword pools
const warmupKeywords = ['warm up', 'warmup', 'mobility', 'stretch', 'jump rope', 'march', 'neck roll', 'arm circle', 'dynamic'];
const finisherKeywords = ['finisher', 'burnout', 'high knees', 'burpee', 'sprint', 'mountain climber', 'jumping jack'];
const lowIntensityKeywords = ['march', 'arm circle', 'neck roll', 'light', 'easy', 'step', 'gentle'];
const highIntensityKeywords = ['burpee', 'sprint', 'jump', 'climber', 'blast', 'explosive', 'intense'];

// Classify exercise type
function detectType(title) {
  const t = title.toLowerCase();
  if (warmupKeywords.some(k => t.includes(k))) return 'warmup';
  if (finisherKeywords.some(k => t.includes(k))) return 'finisher';
  return 'main';
}

// Classify intensity level
function detectIntensity(title) {
  const t = title.toLowerCase();
  if (lowIntensityKeywords.some(k => t.includes(k))) return 'low';
  if (highIntensityKeywords.some(k => t.includes(k))) return 'high';
  return 'medium';
}

// Enrichment function
async function enrichExercises() {
  await connectDB();

  const all = await Exercise.find();
  console.log(`📦 Found ${all.length} exercises`);

  const updates = await Promise.all(
    all.map(async (ex) => {
      const type = detectType(ex.title);
      const intensity = detectIntensity(ex.title);

      // Avoid overwriting if already set
      ex.type = ex.type || type;
      ex.intensity = ex.intensity || intensity;

      return ex.save();
    })
  );

  console.log(`✅ Enriched ${updates.length} exercises`);
  process.exit();
}

// Run
enrichExercises().catch(err => {
  console.error('💥 Error during enrichment:', err);
  process.exit(1);
});
