/**
 * Usage:
 *   node enrichBatch1.js [--in ./data_batches/batch1.json] [--out ./data_batches/batch1.enriched.json]
 *
 * What it does:
 *   - Loads batch1.json (100 raw exercises).
 *   - Infers/normalizes: type (warmup/main/stretch/assistance/finisher), intensity (low/medium/high),
 *     metadata: { muscleGroups, difficulty, avoidFor, priorityTags, type: Modality, recommendedFor }.
 *   - Uses your contraindications + tagging profiles (if available).
 *   - Writes batch1.enriched.json with the same length (100).
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Exercise = require('./models/exercise');
const dotenv = require('dotenv');
dotenv.config();
// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lift_verse_pro');
    console.log(`🚀 MongoDB Connected: ${conn.connection
.host}`);
  } catch (error) {
    console.error(`❌ Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// -------- CLI args --------
const args = process.argv.slice(2);
const inPath  = args.includes('--in')  ? args[args.indexOf('--in')+1]  : './exercise_batches/batch1.json';
const outPath = args.includes('--out') ? args[args.indexOf('--out')+1] : './exercise_batches/batch1.enriched.json';

// -------- Safe imports --------
let { contraindicationsMap, exerciseTaggingProfiles } = (() => {
  // Try user-provided profiles first
  try {
    const mod = require('./exerciseTaggingProfiles.enriched.js');
    return {
      contraindicationsMap: mod.contraindicationsMap || [],
      exerciseTaggingProfiles: mod.exerciseTaggingProfiles || []
    };
  } catch {
    // Fall back to the set you pasted earlier (trimmed + extended slightly)
    const fallbackContra = [
      { condition:"Back Pain", aliases:["Lower back pain","lumbago","slipped disc","herniated disc","spinal pain"], keywords:["deadlift","bend","crunch","twist","row","superman","sit-up","leg raise","waist"], riskTags:["spine","core","bending","load","rotation"] },
      { condition:"Knee Pain", aliases:["knee pain","knee injury","acl","mcl","meniscus","patella"], keywords:["squat","lunge","jump","leg press","step-up","box jump","plyo","knee extension"], riskTags:["knee","impact","load","plyometric"] },
      { condition:"Shoulder Injury", aliases:["shoulder pain","rotator cuff","shoulder impingement","labrum tear"], keywords:["shoulder","press","overhead","snatch","clean","fly","raise","military press"], riskTags:["shoulder","overhead","rotation","load"] },
      { condition:"Joint Stiffness", aliases:["stiff joints","reduced mobility","joint pain","limited motion"], keywords:["stretch","flex","range of motion","rotation","mobility"], riskTags:["joint","flexibility","range","rotation"] },
      { condition:"Arthritis", aliases:["arthritis","osteoarthritis","rheumatoid","joint degeneration"], keywords:["grip","jump","load","resistance","weight","high-impact","step"], riskTags:["joint","impact","resistance","load","grip"] },
      { condition:"Asthma", aliases:["asthma","breathing issue","shortness of breath"], keywords:["cardio","run","sprint","cycling","jumping jack","burpee","HIIT"], riskTags:["cardio","high intensity","endurance"] },
      { condition:"Obesity", aliases:["obesity","obese","overweight","bmi"], keywords:["jump","box","plyo","burpee","step-up","run","high knees"], riskTags:["impact","cardio","joints","plyometric"] },
      { condition:"High Blood Pressure", aliases:["high blood pressure","hypertension","bp"], keywords:["cardio","sprint","run","burpee","treadmill","interval","mountain climber"], riskTags:["cardio","high intensity","heart","endurance"] },
      { condition:"Fatigue", aliases:["fatigue","tiredness","chronic fatigue","low energy"], keywords:["endurance","long","HIIT","reps","intensity","circuit","tabata"], riskTags:["duration","high intensity","cardio"] },
      { condition:"Injury", aliases:["General injury","post-surgery","recovery","rehab"], keywords:["explosive","impact","dynamic","complex","stabilizer"], riskTags:["impact","coordination","advanced","balance"] },
      { condition:"Pregnancy", aliases:["pregnancy","pregnant","gestation","trimester"], keywords:["crunch","twist","sit-up","laying","bend","plank","bridge"], riskTags:["core","supine","compression","rotation"] },
      { condition:"Heart Condition", aliases:["heart","cardiac","arrhythmia","palpitation","coronary"], keywords:["cardio","burpee","run","jump","mountain climber","interval","HIIT"], riskTags:["cardio","high intensity","endurance"] },
      { condition:"Neck Pain", aliases:["neck pain","cervical","stiff neck"], keywords:["neck","flexion","extension","rotation","lateral","bridge"], riskTags:["neck","spine","rotation","stabilization"] },
      { condition:"Scoliosis", aliases:["scoliosis","curved spine"], keywords:["twist","rotation","spine","side bend","bridge"], riskTags:["spine","rotation","compression"] },
      { condition:"Hernia", aliases:["hernia","abdominal hernia","inguinal","umbilical"], keywords:["crunch","sit-up","leg raise","ab","core","twist","plank"], riskTags:["core","abdominal pressure","compression"] },
      { condition:"Ankle Instability", aliases:["ankle instability","sprained ankle","ankle pain"], keywords:["balance","jump","plyometric","step-up","single-leg"], riskTags:["ankle","balance","impact","unilateral"] },
      { condition:"Balance Issues", aliases:["balance issue","vertigo","instability"], keywords:["single-leg","balance","bosu","stability","one-legged"], riskTags:["balance","coordination","stability","unilateral"] },
      { condition:"Wrist Pain", aliases:["wrist pain","carpal tunnel","tendonitis"], keywords:["push-up","plank","press","handstand","curl"], riskTags:["wrist","load","compression","grip"] },
      { condition:"Elbow Injury", aliases:["elbow pain","tennis elbow","golfer’s elbow"], keywords:["curl","extension","push","dip","press"], riskTags:["elbow","load","repetition","extension"] },
      { condition:"Hip Pain", aliases:["hip pain","hip labrum","tight hips"], keywords:["lunge","step-up","bridge","hip thrust","rotation"], riskTags:["hip","rotation","load","mobility"] }
    ];
    const fallbackProfiles = [
      { match:["side bend","oblique","twist"], titleContains:["side bend"], muscleGroups:["Obliques","Abdominals"], priorityTags:["Core","Waist"], recommendedFor:["Waist Slimming","Core Strength"], avoidFor:["Lower Back Pain","Scoliosis"], type:"Bodyweight", difficulty:"Intermediate" },
      { match:["deadlift","hamstring"], muscleGroups:["Hamstrings","Lower Back","Glutes"], priorityTags:["Posterior Chain","Strength"], recommendedFor:["Muscle Gain","Strength"], avoidFor:["Lower Back Pain","Hernia"], type:"Barbell", difficulty:"Advanced" },
      { match:["plank","ab","core"], muscleGroups:["Abdominals"], priorityTags:["Core"], recommendedFor:["Stability","Core Strength"], avoidFor:["Hernia","Pregnancy"], type:"Bodyweight", difficulty:"Beginner" },
      { match:["lunge","split squat"], muscleGroups:["Quads","Glutes","Hamstrings"], priorityTags:["Legs"], recommendedFor:["Lower Body Strength"], avoidFor:["Knee Pain","Hip Pain","Ankle Instability"], type:"Bodyweight", difficulty:"Intermediate" },
      { match:["shoulder press","overhead","military press"], muscleGroups:["Deltoids","Triceps"], priorityTags:["Upper Body","Push"], recommendedFor:["Shoulder Strength"], avoidFor:["Shoulder Injury","Neck Pain"], type:"Dumbbell", difficulty:"Intermediate" },
    ];
    return { contraindicationsMap: fallbackContra, exerciseTaggingProfiles: fallbackProfiles };
  }
})();

// -------- Helpers --------
const norm = s => (s || '').toString().trim();
const lower = s => norm(s).toLowerCase();

const splitCSV = s =>
  norm(s)
    .split(/[,/|]/)
    .map(x => x.trim())
    .filter(Boolean);

// Role/type detection (DB role: warmup/main/stretch/assistance/finisher)
const kw = {
  warmup: ['warm up','warmup','mobility','prep','dynamic warm','activation','primer','arm circle','neck roll','jump rope','march'],
  stretch: ['stretch','yoga','mobility flow','pose'],
  finisher: ['finisher','burnout','tabata','amrap','emom','conditioning'],
  assistance: ['cardio','walk','run','jog','cycle','rowing','elliptical','stepper','sled','jump rope','boxing'],
  high: ['burpee','sprint','jump','plyo','explosive','climber','tabata','hiit','interval'],
  low: ['gentle','light','easy','rehab','recovery','intro','beginner','breath','slow','hold']
};

const detectRole = (title, equipment) => {
  const t = lower(title + ' ' + (equipment || ''));
  if (kw.warmup.some(k => t.includes(k))) return 'warmup';
  if (kw.stretch.some(k => t.includes(k))) return 'stretch';
  if (kw.finisher.some(k => t.includes(k))) return 'finisher';
  if (kw.assistance.some(k => t.includes(k))) return 'assistance';
  return 'main';
};

const detectIntensity = (title) => {
  const t = lower(title);
  if (kw.high.some(k => t.includes(k))) return 'high';
  if (kw.low.some(k => t.includes(k))) return 'low';
  return 'medium';
};

// Modality detection for metadata.type
const modalityFromEquipmentOrTitle = (title, equipment) => {
  const t = lower(title + ' ' + (equipment || ''));
  if (t.includes('barbell')) return 'Barbell';
  if (t.includes('dumbbell')) return 'Dumbbell';
  if (t.includes('kettlebell')) return 'Kettlebell';
  if (t.includes('resistance band') || t.includes('band')) return 'Band';
  if (t.includes('cable')) return 'Cable';
  if (t.includes('machine')) return 'Machine';
  if (t.includes('bodyweight') || t.includes('no equipment')) return 'Bodyweight';
  if (t.includes('bench')) return 'Bench';
  return 'Bodyweight';
};

// MuscleGroups inference
const MUSCLE_MAP = [
  { key:'Chest', match:['chest','pec'] },
  { key:'Back', match:['back','lat','lats','row'] },
  { key:'Shoulders', match:['shoulder','deltoid'] },
  { key:'Arms', match:['arm','bicep','tricep','forearm'] },
  { key:'Core', match:['core','ab','abs','oblique','obliques'] },
  { key:'Glutes', match:['glute','glutes','butt'] },
  { key:'Quads', match:['quad','quads'] },
  { key:'Hamstrings', match:['hamstring','hamstrings'] },
  { key:'Calves', match:['calf','calves'] },
  { key:'Neck', match:['neck'] },
  { key:'Hips', match:['hip','hips'] }
];

const inferMuscleGroups = (musclesField, title) => {
  const src = (splitCSV(musclesField).join(' ') + ' ' + (title || '')).toLowerCase();
  const groups = [];
  MUSCLE_MAP.forEach(({key, match}) => {
    if (match.some(m => src.includes(m))) groups.push(key);
  });
  return Array.from(new Set(groups));
};

// Difficulty guess from intensity + role
const difficultyFrom = (intensity, role) => {
  const i = lower(intensity);
  const r = lower(role);
  if (r === 'stretch' || r === 'warmup') return 'Beginner';
  if (i === 'low') return 'Beginner';
  if (i === 'high') return 'Advanced';
  return 'Intermediate';
};

// Priority tags by role / muscles
const priorityTagsFrom = (role, muscleGroups) => {
  const tags = new Set();
  if (role === 'warmup') tags.add('Warm-up');
  if (role === 'stretch') tags.add('Mobility');
  if (role === 'finisher') tags.add('Conditioning');
  if (muscleGroups.includes('Core')) tags.add('Core');
  if (muscleGroups.includes('Glutes') || muscleGroups.includes('Quads') || muscleGroups.includes('Hamstrings'))
    tags.add('Lower Body');
  if (muscleGroups.includes('Chest') || muscleGroups.includes('Back') || muscleGroups.includes('Shoulders') || muscleGroups.includes('Arms'))
    tags.add('Upper Body');
  return Array.from(tags);
};

// RecommendedFor by role / muscles
const recommendedForFrom = (role, muscleGroups) => {
  const out = new Set();
  if (role === 'stretch') out.add('Flexibility').add('Mobility');
  if (role === 'warmup') out.add('Preparation').add('Injury Prevention');
  if (role === 'finisher' || role === 'assistance') out.add('Fat Loss').add('Endurance');
  if (muscleGroups.includes('Core')) out.add('Core Strength');
  if (['main','assistance'].includes(role) && (muscleGroups.includes('Chest') || muscleGroups.includes('Back') ||
      muscleGroups.includes('Shoulders') || muscleGroups.includes('Arms') || muscleGroups.includes('Glutes') ||
      muscleGroups.includes('Quads') || muscleGroups.includes('Hamstrings')))
    out.add('Muscle Gain').add('Strength');
  return Array.from(out);
};

// Match a tagging profile (if any)
const matchProfile = (title) => {
  const t = lower(title);
  for (const p of (exerciseTaggingProfiles || [])) {
    const pool = [...(p.match || []), ...(p.titleContains || [])].map(lower);
    if (pool.some(k => t.includes(k))) return p;
  }
  return null;
};

// Build avoidFor from contraindications keywords if title matches
const avoidForFromContra = (title) => {
  const t = lower(title);
  const out = new Set();
  for (const cond of (contraindicationsMap || [])) {
    const keys = (cond.keywords || []).map(lower);
    if (keys.some(k => t.includes(k))) out.add(cond.condition);
  }
  return Array.from(out);
};

// Merge arrays safely (dedupe)
const mergeArr = (...arrs) => Array.from(new Set(arrs.flat().filter(Boolean)));

(async function run() {
  // Read input
  if (!fs.existsSync(inPath)) {
    console.error(`❌ Input not found: ${inPath}`);
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(inPath, 'utf-8'));
  if (!Array.isArray(raw)) {
    console.error('❌ batch file must be an array of exercises');
    process.exit(1);
  }

  const enriched = raw.map((ex) => {
    const title = ex.title || '';
    const role = ex.type || detectRole(title, ex.equipment);
    const intensity = ex.intensity || detectIntensity(title);

    // Base inferred metadata
    let muscleGroups = inferMuscleGroups(ex.muscles, title);
    const modality = modalityFromEquipmentOrTitle(title, ex.equipment);
    const basePriority = priorityTagsFrom(role, muscleGroups);
    const baseRecommended = recommendedForFrom(role, muscleGroups);
    const baseAvoid = avoidForFromContra(title);

    // Profile overlay (if matches)
    const prof = matchProfile(title);

    const metadata = {
      muscleGroups: mergeArr((ex.metadata && ex.metadata.muscleGroups) || [], muscleGroups, prof?.muscleGroups || []),
      difficulty: (ex.metadata && ex.metadata.difficulty) || prof?.difficulty || difficultyFrom(intensity, role),
      avoidFor: mergeArr((ex.metadata && ex.metadata.avoidFor) || [], prof?.avoidFor || [], baseAvoid),
      priorityTags: mergeArr((ex.metadata && ex.metadata.priorityTags) || [], basePriority, prof?.priorityTags || []),
      type: (ex.metadata && ex.metadata.type) || prof?.type || modality,
      recommendedFor: mergeArr((ex.metadata && ex.metadata.recommendedFor) || [], prof?.recommendedFor || [], baseRecommended),
    };

    return {
      ...ex,
      type: role,          // warmup | main | stretch | assistance | finisher
      intensity,           // low | medium | high
      metadata
    };
  });

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(enriched, null, 2), 'utf-8');

  // Quick summary
  const counts = enriched.reduce((acc, e) => {
    acc.role[e.type] = (acc.role[e.type] || 0) + 1;
    acc.intensity[e.intensity] = (acc.intensity[e.intensity] || 0) + 1;
    acc.mappedMeta += e.metadata && e.metadata.muscleGroups && e.metadata.muscleGroups.length ? 1 : 0;
    return acc;
  }, { role:{}, intensity:{}, mappedMeta:0 });

  console.log(`✅ Enriched ${enriched.length} exercises → ${outPath}`);
  console.log(`   Roles:`, counts.role);
  console.log(`   Intensity:`, counts.intensity);
  console.log(`   With muscleGroups: ${counts.mappedMeta}/${enriched.length}`);
})();
