// enrichExercises.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const Exercise = require('./models/exercise'); 
const { contraindicationsMap} = require('./services/contraindicationsMap');
//const { exerciseTaggingProfiles } = require('./exerciseTaggingProfiles.enriched');

const profilesModule = require('./exerciseTaggingProfiles.enriched');
console.log("Profiles Module:", profilesModule);
const exerciseTaggingProfiles = profilesModule.exerciseTaggingProfiles || [];

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// Type detection keywords
const warmupKeywords = ['warm up', 'warmup', 'mobility', 'stretch', 'jump rope', 'dynamic', 'neck roll', 'arm circle'];
const finisherKeywords = ['finisher', 'burnout', 'high knees', 'burpee', 'sprint', 'mountain climber', 'jumping jack'];
const lowIntensityKeywords = ['march', 'arm circle', 'neck roll', 'light', 'easy', 'gentle'];
const highIntensityKeywords = ['burpee', 'sprint', 'jump', 'explosive', 'climber', 'blast'];

// Detect exercise type
function detectType(title) {
  const t = title.toLowerCase();
  if (warmupKeywords.some(k => t.includes(k))) return 'warmup';
  if (finisherKeywords.some(k => t.includes(k))) return 'finisher';
  return 'main';
}

// Detect intensity
function detectIntensity(title) {
  const t = title.toLowerCase();
  if (lowIntensityKeywords.some(k => t.includes(k))) return 'low';
  if (highIntensityKeywords.some(k => t.includes(k))) return 'high';
  return 'medium';
}

// Try to enrich from tagging profiles
function matchProfile(exercise) {
  const title = exercise.title.toLowerCase();

  for (const profile of exerciseTaggingProfiles) {
    const match = (profile.match || []).some(k => title.includes(k.toLowerCase()));
    const titleMatch = (profile.titleContains || []).some(k => title.includes(k.toLowerCase()));

    if (match || titleMatch) return profile;
  }
  return null;
}

// Enrichment runner
async function enrichExercises() {
  await connectDB();
  const all = await Exercise.find({});
  console.log(`📦 Found ${all.length} exercises`);

  const unmapped = [];

  for (const ex of all) {
    let changed = false;

    // Detect type/intensity if missing
    if (!ex.type) {
      ex.type = detectType(ex.title);
      changed = true;
    }
    if (!ex.intensity) {
      ex.intensity = detectIntensity(ex.title);
      changed = true;
    }

    // Match tagging profile
    const profile = matchProfile(ex);
    if (profile) {
      ex.metadata = ex.metadata || {};

      if (!ex.metadata.muscleGroups?.length && profile.muscleGroups) {
        ex.metadata.muscleGroups = profile.muscleGroups;
        changed = true;
      }
      if (!ex.metadata.priorityTags?.length && profile.priorityTags) {
        ex.metadata.priorityTags = profile.priorityTags;
        changed = true;
      }
      if (!ex.metadata.recommendedFor?.length && profile.recommendedFor) {
        ex.metadata.recommendedFor = profile.recommendedFor;
        changed = true;
      }
      if (!ex.metadata.avoidFor?.length && profile.avoidFor) {
        ex.metadata.avoidFor = profile.avoidFor;
        changed = true;
      }
      if (!ex.metadata.type && profile.type) {
        ex.metadata.type = profile.type;
        changed = true;
      }
      if (!ex.metadata.difficulty && profile.difficulty) {
        ex.metadata.difficulty = profile.difficulty;
        changed = true;
      }
    } else {
      // Track unmapped exercises
      unmapped.push({ id: ex._id, title: ex.title });
    }

    if (changed) {
      await ex.save();
      console.log(`✅ Updated: ${ex.title}`);
    }
  }

  // Save unmapped exercises into JSON file
  const outPath = path.join(__dirname, 'unmappedExercises.json');
  fs.writeFileSync(outPath, JSON.stringify(unmapped, null, 2));
  console.log(`\n📋 Enrichment complete!`);
  console.log(`⚠️ Unmapped exercises: ${unmapped.length}`);
  console.log(`📝 Saved to ${outPath}`);

  process.exit(0);
}

enrichExercises().catch(err => {
  console.error('💥 Error during enrichment:', err);
  process.exit(1);
});
