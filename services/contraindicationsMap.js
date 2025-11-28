const contraindicationsMap = [
    {
      condition: "Back Pain",
      aliases: ["Lower back pain", "lumbago", "slipped disc", "herniated disc", "spinal pain"],
      keywords: ["deadlift", "bend", "crunch", "twist", "row", "superman", "sit-up", "leg raise", "waist"],
      riskTags: ["spine", "core", "bending", "load", "rotation"]
    },
    {
      condition: "Knee Pain",
      aliases: ["knee pain", "knee injury", "acl", "mcl", "meniscus", "patella"],
      keywords: ["squat", "lunge", "jump", "leg press", "step-up", "box jump", "plyo", "knee extension"],
      riskTags: ["knee", "impact", "load", "plyometric"]
    },
    {
      condition: "Shoulder Injury",
      aliases: ["shoulder pain", "rotator cuff", "shoulder impingement", "labrum tear"],
      keywords: ["shoulder", "press", "overhead", "snatch", "clean", "fly", "raise", "military press"],
      riskTags: ["shoulder", "overhead", "rotation", "load"]
    },
    {
      condition: "Joint Stiffness",
      aliases: ["stiff joints", "reduced mobility", "joint pain", "limited motion"],
      keywords: ["stretch", "flex", "range of motion", "rotation", "mobility"],
      riskTags: ["joint", "flexibility", "range", "rotation"]
    },
    {
      condition: "Arthritis",
      aliases: ["arthritis", "osteoarthritis", "rheumatoid", "joint degeneration"],
      keywords: ["grip", "jump", "load", "resistance", "weight", "high-impact", "step"],
      riskTags: ["joint", "impact", "resistance", "load", "grip"]
    },
    {
      condition: "Asthma",
      aliases: ["asthma", "breathing issue", "shortness of breath"],
      keywords: ["cardio", "run", "sprint", "cycling", "jumping jack", "burpee", "HIIT"],
      riskTags: ["cardio", "high intensity", "endurance"]
    },
    {
      condition: "Obesity",
      aliases: ["obesity", "obese", "overweight", "bmi"],
      keywords: ["jump", "box", "plyo", "burpee", "step-up", "run", "high knees"],
      riskTags: ["impact", "cardio", "joints", "plyometric"]
    },
    {
      condition: "High Blood Pressure",
      aliases: ["high blood pressure", "hypertension", "bp"],
      keywords: ["cardio", "sprint", "run", "burpee", "treadmill", "interval", "mountain climber"],
      riskTags: ["cardio", "high intensity", "heart", "endurance"]
    },
    {
      condition: "Fatigue",
      aliases: ["fatigue", "tiredness", "chronic fatigue", "low energy"],
      keywords: ["endurance", "long", "HIIT", "reps", "intensity", "circuit", "tabata"],
      riskTags: ["duration", "high intensity", "cardio"]
    },
    {
      condition: "Injury",
      aliases: ["General injury", "post-surgery", "recovery", "rehab"],
      keywords: ["explosive", "impact", "dynamic", "complex", "stabilizer"],
      riskTags: ["impact", "coordination", "advanced", "balance"]
    },
    {
      condition: "Pregnancy",
      aliases: ["pregnancy", "pregnant", "gestation", "trimester"],
      keywords: ["crunch", "twist", "sit-up", "laying", "bend", "plank", "bridge"],
      riskTags: ["core", "supine", "compression", "rotation"]
    },
    {
      condition: "Heart Condition",
      aliases: ["heart", "cardiac", "arrhythmia", "palpitation", "coronary"],
      keywords: ["cardio", "burpee", "run", "jump", "mountain climber", "interval", "HIIT"],
      riskTags: ["cardio", "high intensity", "endurance"]
    },
    {
      condition: "Neck Pain",
      aliases: ["neck pain", "cervical", "stiff neck"],
      keywords: ["neck", "flexion", "extension", "rotation", "lateral", "bridge"],
      riskTags: ["neck", "spine", "rotation", "stabilization"]
    },
    {
      condition: "Scoliosis",
      aliases: ["scoliosis", "curved spine"],
      keywords: ["twist", "rotation", "spine", "side bend", "bridge"],
      riskTags: ["spine", "rotation", "compression"]
    },
    {
      condition: "Hernia",
      aliases: ["hernia", "abdominal hernia", "inguinal", "umbilical"],
      keywords: ["crunch", "sit-up", "leg raise", "ab", "core", "twist", "plank"],
      riskTags: ["core", "abdominal pressure", "compression"]
    },
    {
      condition: "Ankle Instability",
      aliases: ["ankle instability", "sprained ankle", "ankle pain"],
      keywords: ["balance", "jump", "plyometric", "step-up", "single-leg"],
      riskTags: ["ankle", "balance", "impact", "unilateral"]
    },
    {
      condition: "Balance Issues",
      aliases: ["balance issue", "vertigo", "instability"],
      keywords: ["single-leg", "balance", "bosu", "stability", "one-legged"],
      riskTags: ["balance", "coordination", "stability", "unilateral"]
    },
    {
      condition: "Wrist Pain",
      aliases: ["wrist pain", "carpal tunnel", "tendonitis"],
      keywords: ["push-up", "plank", "press", "handstand", "curl"],
      riskTags: ["wrist", "load", "compression", "grip"]
    },
    {
      condition: "Elbow Injury",
      aliases: ["elbow pain", "tennis elbow", "golfer’s elbow"],
      keywords: ["curl", "extension", "push", "dip", "press"],
      riskTags: ["elbow", "load", "repetition", "extension"]
    },
    {
      condition: "Hip Pain",
      aliases: ["hip pain", "hip labrum", "tight hips"],
      keywords: ["lunge", "step-up", "bridge", "hip thrust", "rotation"],
      riskTags: ["hip", "rotation", "load", "mobility"]
    }
  ];
  
  //module.exports = contraindicationsMap;
  const exerciseTaggingProfiles = [
    {
      match: ["side bend", "oblique", "twist"],
      titleContains: ["side bend"],
      muscleGroups: ["Obliques", "Abdominals"],
      priorityTags: ["Core", "Waist"],
      recommendedFor: ["Waist Slimming", "Core Strength"],
      avoidFor: ["Lower Back Pain", "Scoliosis"],
      type: "Bodyweight",
      difficulty: "Intermediate"
    },
    {
      match: ["deadlift", "hamstring"],
      muscleGroups: ["Hamstrings", "Lower Back", "Glutes"],
      priorityTags: ["Posterior Chain", "Strength"],
      recommendedFor: ["Muscle Gain", "Strength"],
      avoidFor: ["Lower Back Pain", "Hernia"],
      type: "Barbell",
      difficulty: "Advanced"
    },
    {
      match: ["plank", "ab", "core"],
      muscleGroups: ["Abdominals"],
      priorityTags: ["Core"],
      recommendedFor: ["Stability", "Core Strength"],
      avoidFor: ["Hernia", "Pregnancy"],
      type: "Bodyweight",
      difficulty: "Beginner"
    },
    {
      match: ["lunge", "split squat"],
      muscleGroups: ["Quads", "Glutes", "Hamstrings"],
      priorityTags: ["Legs"],
      recommendedFor: ["Lower Body Strength"],
      avoidFor: ["Knee Pain", "Hip Pain", "Ankle Instability"],
      type: "Bodyweight",
      difficulty: "Intermediate"
    },
    {
      match: ["shoulder press", "overhead", "military press"],
      muscleGroups: ["Deltoids", "Triceps"],
      priorityTags: ["Upper Body", "Push"],
      recommendedFor: ["Shoulder Strength"],
      avoidFor: ["Shoulder Injury", "Neck Pain"],
      type: "Dumbbell",
      difficulty: "Intermediate"
    }
  ];
  
  module.exports = {
    contraindicationsMap,
    exerciseTaggingProfiles
  };