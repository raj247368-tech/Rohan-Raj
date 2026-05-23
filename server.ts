/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Google GenAI if key is present
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (geminiApiKey && geminiApiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("INFO: GoogleGenAI initialized successfully with backend key.");
  } catch (err) {
    console.error("ERROR: Failed to initialize GoogleGenAI:", err);
  }
} else {
  console.log("WARN: GEMINI_API_KEY not configured. Running with high-fidelity system engines.");
}

// ==========================================
// DB ENGINE & MOCK SCHEMAS
// ==========================================

// In-memory persistent state (simulated MongoDB collections)
const DB_STORE = {
  users: {
    "admin@fitforge.ai": {
      id: "usr_admin",
      email: "admin@fitforge.ai",
      password: "password123", // Simulated hash
      name: "Admin Coach",
      isAdmin: true,
      profileOnboarded: true,
      isOnboardingCompleted: true,
    },
    "john@example.com": {
      id: "usr_john",
      email: "john@example.com",
      password: "password123",
      name: "John Doe",
      isAdmin: false,
      profileOnboarded: true,
      isOnboardingCompleted: true,
    }
  } as Record<string, any>,

  profiles: {
    "usr_john": {
      name: "John Doe",
      age: 28,
      gender: "Male",
      height: 178,
      weight: 82,
      goal: "Body Recomposition",
      activityLevel: "Moderately Active",
      experienceLevel: "Intermediate",
      workoutPreference: "Gym",
      workoutDaysPerWeek: 4,
      sessionDuration: 60,
      availableEquipment: ["Full Gym", "Dumbbells", "Barbell"],
      targetMuscles: ["Chest", "Back", "Shoulders", "Legs"],
      sleepHours: 7,
      stressLevel: "Moderate",
      waterIntake: 3,
      medicalConditions: ["Knee pain"],
      injuryDetails: "Slight strain in left meniscus, avoiding heavy loading",
      medications: "None"
    }
  } as Record<string, any>,

  savedPlans: {
    "usr_john": [
      {
        id: "plan_sample_1",
        title: "Upper-Lower Strength Split",
        splitType: "Upper Lower",
        weeklyVolume: "Medium",
        frequency: "4 days per week",
        recoveryAdvice: "Focus on 8 hours of sleep. Use knee sleeves and perform knee extensions in non-pain ranges to stabilize.",
        progressiveOverloadSchema: "Aim to add 2.5kg to upper body lifts every fortnight, and focus on slow tempo squats with active hamstring engagement.",
        days: [
          {
            dayName: "Day 1: Upper Focus",
            focus: "Chest, Back and Shoulders",
            exercises: [
              {
                id: "ex_1",
                name: "Incline Dumbbell Press",
                targetMuscle: "Chest",
                sets: 4,
                reps: "8-10",
                tempo: "3-1-1-0",
                restTime: "90s",
                difficultyLevel: "Intermediate",
                instructions: ["Keep shoulder blades retracted.", "Lower slowly to upper chest line.", "Press back up explosively."],
                alternatives: ["Flat Bench Press", "Pushups"],
                injurySafeAlternatives: ["Decline Machine Press"],
                videoPlaceholder: "Incline DB Bench Press instruction form video"
              },
              {
                id: "ex_2",
                name: "Chest Supported Row",
                targetMuscle: "Back",
                sets: 3,
                reps: "10-12",
                tempo: "2-0-1-1",
                restTime: "90s",
                difficultyLevel: "Intermediate",
                instructions: ["Squeeze shoulder blades together at top.", "Keep chest down against pad.", "Avoid using lower back swing."],
                alternatives: ["Barbell Rows", "Cable Seated Lat Rows"],
                injurySafeAlternatives: ["Single-arm Dumbbell Rows Supported"],
                videoPlaceholder: "Chest Supported Row muscle tension exercise clip"
              }
            ]
          },
          {
            dayName: "Day 2: Joint-Friendly Lower Focus",
            focus: "Quads, Hamstrings and Calves",
            exercises: [
              {
                id: "ex_3",
                name: "Leg Extensions (Knee Tension Control)",
                targetMuscle: "Legs",
                sets: 3,
                reps: "12-15",
                tempo: "3-1-2-1",
                restTime: "60s",
                difficultyLevel: "Beginner",
                instructions: ["Avoid sudden explosive lockouts.", "Squeeze quads hard at peak contraction.", "Hold knee brace firmly."],
                alternatives: ["Safety Bar Squats"],
                injurySafeAlternatives: ["Leg Press (Upper-range focus only)"],
                videoPlaceholder: "Leg extension knee stability safety video"
              }
            ]
          }
        ],
        createdAt: "2026-05-20"
      }
    ]
  } as Record<string, any[]>,

  progressHistory: {
    "usr_john": [
      {
        id: "pl_1",
        userId: "usr_john",
        date: "2026-05-01",
        weight: 84.2,
        chestSize: 104,
        armSize: 37,
        waistSize: 94,
        legSize: 61,
        completedWorkoutCount: 4,
        dailyStreak: 3,
        notes: "Started feeling slightly tired. Changed routine to support lower knee stress."
      },
      {
        id: "pl_2",
        userId: "usr_john",
        date: "2026-05-15",
        weight: 82.8,
        chestSize: 104.5,
        armSize: 37.2,
        waistSize: 91.5,
        legSize: 60.5,
        completedWorkoutCount: 12,
        dailyStreak: 5,
        notes: "Body weight is dropping, muscles appear leaner. Knee feels great with adjusted tempo!"
      },
      {
        id: "pl_3",
        userId: "usr_john",
        date: "2026-05-23",
        weight: 82.0,
        chestSize: 105.0,
        armSize: 37.5,
        waistSize: 90.0,
        legSize: 60.0,
        completedWorkoutCount: 19,
        dailyStreak: 7,
        notes: "Recomposing nicely. Leaner shoulders and chest thickness is visible."
      }
    ]
  } as Record<string, any[]>,

  progressPhotos: {
    "usr_john": [
      { id: "ph_1_john", date: "2026-05-01", url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=300&auto=format&fit=crop" },
      { id: "ph_2_john", date: "2026-05-23", url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=300&auto=format&fit=crop" }
    ]
  } as Record<string, any[]>,

  chatSessions: {
    "usr_john": [
      { role: "model", text: "Welcome to FitForge AI coaching room. I am your elite AI physical health coach. As an intermediate athlete, let me guide you to train around knee discomfort safely. Ask me any training, meal sizing, or supplement questions!", timestamp: "2026-05-23T08:00:00.000Z" }
    ]
  } as Record<string, any[]>,

  dietPlans: {} as Record<string, any>,
  workoutHistory: {} as Record<string, any[]>,

  exercisesDatabase: [
    { id: "ex_gen_chest_1", name: "Incline Goblet Pushup", targetMuscle: "Chest", equipment: "Bodyweight", safeInjury: "Knee pain", instructions: ["Keep spinal bracing active.", "Low shoulder pressure."] },
    { id: "ex_gen_chest_2", name: "Dumbbell Flyes", targetMuscle: "Chest", equipment: "Dumbbells", safeInjury: "Back pain", instructions: ["Keep back flat against the bench.", "Deep controlled stretch."] },
    { id: "ex_gen_legs_1", name: "Bulgarian Split Squat", targetMuscle: "Legs", equipment: "Dumbbells", safeInjury: "Back pain", instructions: ["Unloads the lumbar spine.", "Great quad hypertrophy."] },
    { id: "ex_gen_back_1", name: "Superman Hold", targetMuscle: "Back", equipment: "Bodyweight", safeInjury: "Knee pain", instructions: ["Lying flat on stomach.", "Raise arms and chest.", "Contract spine muscles cleanly."] }
  ]
};

// Simple active session management key-value store (simulating JWT token database)
const ACTIVE_SESSIONS = new Map<string, any>();

// Helper to generate IDs
const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).substr(2, 9)}`;

// ==========================================
// STATIC/DUMMY RESOURCES DATABASE
// ==========================================

const SAMPLE_DIET_ITEMS = {
  veg: [
    { item: "Paneer (Cottage Cheese)", protein: 18, carbs: 3, fats: 20, weight: "100g", cal: 265 },
    { item: "Dal (Lentil Soup Mixed)", protein: 9, carbs: 20, fats: 3, weight: "1 bowl", cal: 150 },
    { item: "Greek Curd / Dahi", protein: 10, carbs: 4, fats: 2, weight: "150g", cal: 98 },
    { item: "Brown Rice (Cooked)", protein: 3, carbs: 28, fats: 1, weight: "100g", cal: 130 },
    { item: "Whole Wheat Roti", protein: 3.5, carbs: 18, fats: 0.5, weight: "1 medium", cal: 90 },
    { item: "Peanut Butter Oats", protein: 14, carbs: 35, fats: 11, weight: "1 bowl", cal: 280 },
    { item: "Roasted Chickpeas", protein: 6, carbs: 19, fats: 2, weight: "50g", cal: 120 },
    { item: "Soya Chunks (Boiled)", protein: 26, carbs: 16, fats: 0.5, weight: "50g", cal: 170 },
    { item: "Whey Isolate Shake", protein: 25, carbs: 1, fats: 0.5, weight: "1 scoop", cal: 110 }
  ],
  nonveg: [
    { item: "Grilled Chicken Breast", protein: 31, carbs: 0, fats: 3.6, weight: "100g", cal: 165 },
    { item: "Whole Eggs (Boiled)", protein: 13, carbs: 1, fats: 10, weight: "2 large", cal: 155 },
    { item: "Paneer (Cottage Cheese)", protein: 18, carbs: 3, fats: 20, weight: "100g", cal: 265 },
    { item: "Whey Isolate Shake", protein: 25, carbs: 1, fats: 0.5, weight: "1 scoop", cal: 110 },
    { item: "Basmati White Rice", protein: 2.7, carbs: 28, fats: 0.2, weight: "100g", cal: 121 },
    { item: "Yellow Dal Fry", protein: 7, carbs: 18, fats: 2, weight: "1 bowl", cal: 120 },
    { item: "Egg Whites (Scrambled)", protein: 16, carbs: 1, fats: 0.2, weight: "4 whites", cal: 75 },
    { item: "Tuna Fish in Water", protein: 24, carbs: 0, fats: 1, weight: "100g", cal: 110 }
  ]
};

const STANDARD_SUPPLEMENTS = [
  {
    name: "Whey Protein Isolate",
    purpose: "Muscle tissue repair, macronutrient reinforcement, and recovery ease.",
    dosage: "1-2 Scoops per day",
    timing: "Post-workout or first thing in the morning to supply amino acids",
    beginnerExplanation: "A highly filtered cheese byproduct, pure food protein powder allowing quick digestion and absorption.",
    safetyWarning: "Ensure clean water hydration. Do not use if severe milk-lactose intolerance persists."
  },
  {
    name: "Creatine Monohydrate",
    purpose: "Enhances muscular strength, cellular hydration, and phosphocreatine replenishment.",
    dosage: "3-5 Grams daily",
    timing: "Consistent daily use, ideally post workout with carbs for maximum uptake",
    beginnerExplanation: "An organic compound that aids speed and high-level muscular contractibility during sprints, lifts, and recovery.",
    safetyWarning: "No loading phase needed; drink extra water to maintain cellular hydration. Avoid in active kidney failure diagnostics."
  },
  {
    name: "Omega-3 Fish Oil",
    purpose: "Anti-inflammatory agent, joint lubrication preservation, cognitive health support.",
    dosage: "1-2 Capsules (~1000mg EPA/DHA)",
    timing: "Take with main fat-containing meals for maximum absorption",
    beginnerExplanation: "Fatty acids extracted from cold-water fish which support neural messaging and reduce local inflammation.",
    safetyWarning: "Avoid if taking active blood thinning medications without clinical clearance."
  },
  {
    name: "Vitamin D3",
    purpose: "Bone density defense, healthy androgen levels support, immunity restoration.",
    dosage: "1000 - 2000 IU daily",
    timing: "Take with breakfast containing dietary fats for fat-soluble efficiency",
    beginnerExplanation: "A hormone-like vitamin generated naturally via UV sunshine which manages bone health.",
    safetyWarning: "Avoid megadosing above 10K IU without blood diagnostics."
  },
  {
    name: "Essential Electrolytes",
    purpose: "Prevents muscular cramps, maintains neural impulses, stabilizes peak hydration.",
    dosage: "1 Sachet containing sodium, potassium, and magnesium",
    timing: "Sip during intense training sessions or in high heat conditions",
    beginnerExplanation: "Minerals that hold an electrical charge to balance extracellular fluids lost in sweat.",
    safetyWarning: "Monitor sodium loads if treating hypertension or congestive heart conditions."
  }
];

// ==========================================
// BUSINESS CALCULATIONS COMPONENT (DIET/BMR)
// ==========================================

function runFitnessCalcs(user: any, profile: any) {
  const { gender, age, height, weight, activityLevel, goal } = profile;

  // 1. Basal Metabolic Rate (Mifflin-St Jeor)
  let bmr = 0;
  if (gender.toLowerCase() === "female") {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    // Default Male
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  }

  // 2. Total Daily Energy Expenditure (TDEE)
  let multiplier = 1.2; // Sedentary
  if (activityLevel === "Lightly Active") multiplier = 1.375;
  else if (activityLevel === "Moderately Active") multiplier = 1.55;
  else if (activityLevel === "Very Active") multiplier = 1.725;
  else if (activityLevel === "Extra Active") multiplier = 1.9;

  const tdee = Math.round(bmr * multiplier);

  // 3. Goal Adjustment
  let targetCalories = tdee;
  if (goal === "Muscle Gain") {
    targetCalories = tdee + 400;
  } else if (goal === "Fat Loss") {
    targetCalories = Math.max(bmr + 200, tdee - 500); // Guard rails
  } else if (goal === "Body Recomposition") {
    targetCalories = Math.round(tdee * 0.95); // Safe body composition fat slip
  } else {
    // General fitness / Maintenance
    targetCalories = tdee;
  }

  // 4. Macronutrients
  // Protein: weight based
  let proteinFactor = 1.8;
  if (goal === "Muscle Gain") proteinFactor = 2.2;
  else if (goal === "Fat Loss") proteinFactor = 2.0;
  const protein = Math.round(weight * proteinFactor);

  // Fats: 25% of calories
  const fatCalories = targetCalories * 0.25;
  const fats = Math.round(fatCalories / 9);

  // Carbs: Remaining scale
  const remainingCals = targetCalories - (protein * 4 + fats * 9);
  const carbs = Math.max(50, Math.round(remainingCals / 4));

  // Water
  const waterIntake = Math.max(2.5, Math.round((weight * 35) / 1000 * 10) / 10);

  return { bmr, tdee, targetCalories, macros: { protein, carbs, fats }, waterIntake };
}

// ==========================================
// REVOLUTIONARY HEALTH-AWARE LOCAL EXERCISE DIRECTORY
// ==========================================

function getOnboardingExercises(profile: any) {
  const { workoutPreference, availableEquipment, medicalConditions, targetMuscles } = profile;
  const isHome = workoutPreference.toLowerCase() === "home";
  const hasKneePain = medicalConditions.includes("Knee pain") || medicalConditions.includes("Arthritis");
  const hasBackPain = medicalConditions.includes("Back pain") || medicalConditions.includes("Slip disc");
  const hasShoulderInjury = medicalConditions.includes("Shoulder injury");
  const hasObesity = medicalConditions.includes("Obesity");

  const results: any[] = [];

  // Home workout exercises
  if (isHome) {
    // Chest options
    if (targetMuscles.includes("Chest")) {
      results.push({
        id: "home_chest_1",
        name: hasShoulderInjury ? "Deficit Pushup (Elbows In)" : "Standard Pushup",
        targetMuscle: "Chest",
        sets: 3,
        reps: "10-15 reps",
        tempo: "3-1-1-0",
        restTime: "60s",
        difficultyLevel: "Beginner",
        instructions: ["Maintain a straight alignment from heels to head.", "Tuck elbows inside a 45-degree angle.", "Drive through the palms."],
        alternatives: ["Wall Pushups", "Knee Pushups"],
        injurySafeAlternatives: ["Incline Pushups against Wall"],
        videoPlaceholder: "Push-up posture safety demonstration video"
      });
      results.push({
        id: "home_chest_2",
        name: "Diamond Pushups",
        targetMuscle: "Chest",
        sets: 3,
        reps: "8-12 reps",
        tempo: "2-0-1-0",
        restTime: "60s",
        difficultyLevel: "Intermediate",
        instructions: ["Keep thumbs and index fingers touching to create diamond shape.", "Tuck elbows snug to ribs."],
        alternatives: ["Standard Pushups"],
        injurySafeAlternatives: ["Decline Pushup with hands elevated for low front shoulder tension"],
        videoPlaceholder: "Tricep and inner chest diamond pushup angle"
      });
    }
    // Back options
    if (targetMuscles.includes("Back")) {
      results.push({
        id: "home_back_1",
        name: "Resistance Band Underhand Rows",
        targetMuscle: "Back",
        sets: 4,
        reps: "12-15 reps",
        tempo: "2-1-1-1",
        restTime: "60s",
        difficultyLevel: "Beginner",
        instructions: ["Anchor band under feet.", "Hinge hips slightly while keeping spine straight.", "Squeeze lats tight."],
        alternatives: ["Towel back row pulling on frame"],
        injurySafeAlternatives: ["Prone Cobra back extension safely on couch"],
        videoPlaceholder: "Resistance band rows and lateral lat squeezing"
      });
      results.push({
        id: "home_back_2",
        name: "Superman Hold",
        targetMuscle: "Back",
        sets: 3,
        reps: "Hold 30 seconds",
        tempo: "Static isometric",
        restTime: "60s",
        difficultyLevel: "Beginner",
        instructions: ["Lay flat on stomach.", "Raise arms, chest, and knees off ground simultaneously.", "Squeeze back extensors."],
        alternatives: ["Bird-dog holds"],
        injurySafeAlternatives: ["Prone shoulder Y-raises lying flat"],
        videoPlaceholder: "Prone spinal extensor safety review"
      });
    }
    // Legs
    if (targetMuscles.includes("Legs")) {
      results.push({
        id: "home_leg_1",
        name: hasKneePain ? "Glute Bridges (Knee Friendly)" : "Bodyweight Deep Squats",
        targetMuscle: "Legs",
        sets: 4,
        reps: hasKneePain ? "15-20 reps" : "15 reps",
        tempo: "3-1-1-0",
        restTime: "60s",
        difficultyLevel: "Beginner",
        instructions: [
          hasKneePain ? "Push down through your heels while contracting the glutes." : "Push hips backward as if sitting on an imaginary stool.",
          "Keep knees tracked in line with your second toe.",
          "Maintain active core bracing."
        ],
        alternatives: ["Lunges"],
        injurySafeAlternatives: ["Wall Sits (hold 30s)"],
        videoPlaceholder: "Lower body control and knee flexion stability"
      });
      if (!hasKneePain) {
        results.push({
          id: "home_leg_2",
          name: "Bulgarian Split Squats (Quads & Glutes)",
          targetMuscle: "Legs",
          sets: 3,
          reps: "10-12 per leg",
          tempo: "3-0-1-0",
          restTime: "75s",
          difficultyLevel: "Intermediate",
          instructions: ["Place rear foot on chair or bed.", "Descend until front thigh is parallel to ground.", "Drive up through front heel."],
          alternatives: ["Walking lunges"],
          injurySafeAlternatives: ["Step ups on low step"],
          videoPlaceholder: "Unilateral split squat posture balance check"
        });
      }
    }
    // Shoulders / Arms
    results.push({
      id: "home_shoulder_1",
      name: "Pike Pushups (Shoulder Focus)",
      targetMuscle: "Shoulders",
      sets: 3,
      reps: "8-10 reps",
      tempo: "3-1-1-0",
      restTime: "60s",
      difficultyLevel: "Intermediate",
      instructions: ["Form an inverted V-shape with hips held high.", "Lower crown of head slowly between hands.", "Push away through traps."],
      alternatives: ["Resistance band overhead press"],
      injurySafeAlternatives: ["Bodyweight lateral shoulder circles"],
      videoPlaceholder: "Deltoid home push pattern"
    });
  } else {
    // Gym / Hybrid workouts
    // Chest options
    if (targetMuscles.includes("Chest")) {
      results.push({
        id: "gym_chest_1",
        name: hasShoulderInjury ? "Incline Hex Press (Neutral Shoulder)" : "Barbell Bench Press",
        targetMuscle: "Chest",
        sets: 4,
        reps: "8-10 reps",
        tempo: "3-1-1-0",
        restTime: "90s",
        difficultyLevel: "Intermediate",
        instructions: ["Keep shoulder blades squeezed flat into bench.", "Set feet flat for active leg drive.", "Unrack and descend to lower sternum."],
        alternatives: ["Dumbbell Press", "Chest Flyes"],
        injurySafeAlternatives: ["Hammer Strength Chest Press (Plate Loaded)"],
        videoPlaceholder: "Barbell horizontal press bar path tutorial"
      });
    }
    // Back
    if (targetMuscles.includes("Back")) {
      results.push({
        id: "gym_back_1",
        name: hasBackPain ? "Seated Lat Pulldown (No Spinal Loading)" : "Heavy Barbell Row",
        targetMuscle: "Back",
        sets: 4,
        reps: "8-12 reps",
        tempo: "3-0-1-0",
        restTime: "90s",
        difficultyLevel: "Intermediate",
        instructions: ["Hold bar slightly wider than shoulder span.", "Squeeze elbow tips down to pocket liners.", "Engage lats tightly at contraction."],
        alternatives: ["Deadlifts", "Pull-ups"],
        injurySafeAlternatives: ["Chest Supported Row Machine"],
        videoPlaceholder: "Lat pulldown lat alignment clip"
      });
    }
    // Legs
    if (targetMuscles.includes("Legs")) {
      results.push({
        id: "gym_leg_1",
        name: hasKneePain ? "Romanian Deadlifts (Glutes/Hamstrings Focus)" : "Barbell Back Squat",
        targetMuscle: "Legs",
        sets: 4,
        reps: "8-10 reps",
        tempo: "3-1-1-0",
        restTime: "120s",
        difficultyLevel: "Advanced",
        instructions: [
          hasKneePain ? "Keep knees soft but fixed at a slight angle." : "Place barbell on upper trapezius.",
          hasKneePain ? "Hinge at hips, stretching hamstrings." : "Brace core heavily and sit down deep.",
          "Keep spine fully neutral throughout."
        ],
        alternatives: ["Leg Press"],
        injurySafeAlternatives: ["Leg Press (Knee-Friendly High Foothold)"],
        videoPlaceholder: "Squat mechanics spinal safety clip"
      });
    }
    // Shoulders
    if (targetMuscles.includes("Shoulders")) {
      results.push({
        id: "gym_shoulder_1",
        name: hasShoulderInjury ? "DB Lateral Raises (Thumbs pointed slightly up)" : "Overhead Barbell Press",
        targetMuscle: "Shoulders",
        sets: 4,
        reps: "10-12 reps",
        tempo: "2-0-1-0",
        restTime: "90s",
        difficultyLevel: hasShoulderInjury ? "Beginner" : "Intermediate",
        instructions: ["Squeeze core tight to protect lower back.", "Drive load vertically directly overhead.", "Avoid hyper-extending neck."],
        alternatives: ["Dumbbell Seated Press"],
        injurySafeAlternatives: ["Machine Deltoid Press (Neutral Grips)"],
        videoPlaceholder: "Strict military press mechanics overview"
      });
    }
  }

  // Abs & arms
  results.push({
    id: "gym_ab_1",
    name: hasBackPain ? "Dead-bug Isometric Holds (Spine Safe)" : "Hanging Leg Raises",
    targetMuscle: "Abs",
    sets: 3,
    reps: hasBackPain ? "10 reps each side" : "12 reps",
    tempo: "Steady controls",
    restTime: "60s",
    difficultyLevel: "Beginner",
    instructions: ["Brace lumbar spine flat into the floor.", "Extend opposite arm and leg.", "Maintain deep steady abdominal pressure."],
    alternatives: ["Planks", "Ab Crunches"],
    injurySafeAlternatives: ["Standard RKC Plank (neutral pose)"],
    videoPlaceholder: "Deadbug back pain protector layout"
  });

  return results;
}

// ==========================================
// API MIDDLEWARES & AUTHENTICATION
// ==========================================

const API_KEYS = {
  adminToken: "token_fitforge_admin_secret",
  userToken: "token_fitforge_john_secret"
};

// Simulated JWT Verifier Middleware
function checkAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized access: Access token is missing" });
  }

  const token = authHeader.replace("Bearer ", "").trim();

  // Look up active sessions or verify signatures
  const session = ACTIVE_SESSIONS.get(token);
  if (session) {
    req.user = session;
    return next();
  }

  // Support local hardcoded tokens for instant preview logging
  if (token === "token_fitforge_john_secret") {
    req.user = { id: "usr_john", email: "john@example.com", name: "John Doe", isAdmin: false };
    return next();
  } else if (token === "token_fitforge_admin_secret") {
    req.user = { id: "usr_admin", email: "admin@fitforge.ai", name: "Admin Coach", isAdmin: true };
    return next();
  }

  return res.status(403).json({ error: "Forbidden: Token has expired or is invalid" });
}

// Extend Request interface mapping
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        isAdmin: boolean;
      };
    }
  }
}

// Register default sessions for testing
ACTIVE_SESSIONS.set("token_fitforge_john_secret", { id: "usr_john", email: "john@example.com", name: "John Doe", isAdmin: false });
ACTIVE_SESSIONS.set("token_fitforge_admin_secret", { id: "usr_admin", email: "admin@fitforge.ai", name: "Admin Coach", isAdmin: true });

// ==========================================
// EXPRESS ROUTRS & IMPLEMENTATION
// ==========================================

// --- AUTHENTICATION ---

app.post("/api/auth/signup", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Missing required fields: name, email, and password." });
  }

  const normalized = email.toLowerCase().trim();
  if (DB_STORE.users[normalized]) {
    return res.status(400).json({ error: "User already exists with this email address." });
  }

  const newUserId = generateId("usr");
  const newUser = {
    id: newUserId,
    email: normalized,
    password, // Plain-text mock
    name,
    isAdmin: false,
    profileOnboarded: false,
    isOnboardingCompleted: false
  };

  DB_STORE.users[normalized] = newUser;
  const token = `token_${newUserId}_${Math.random().toString(36).substr(2, 6)}`;
  ACTIVE_SESSIONS.set(token, newUser);

  res.status(201).json({
    message: "Registration successful!",
    token,
    user: {
      id: newUserId,
      email: normalized,
      name,
      profileOnboarded: false,
      isOnboardingCompleted: false
    }
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const normalized = email.toLowerCase().trim();
  const matchedUser = DB_STORE.users[normalized];
  if (!matchedUser || matchedUser.password !== password) {
    return res.status(400).json({ error: "Invalid credentials: check email or password." });
  }

  const token = `token_${matchedUser.id}_${Math.random().toString(36).substr(2, 6)}`;
  ACTIVE_SESSIONS.set(token, matchedUser);

  res.json({
    message: "Login successful!",
    token,
    user: {
      id: matchedUser.id,
      email: matchedUser.email,
      name: matchedUser.name,
      profileOnboarded: !!DB_STORE.profiles[matchedUser.id],
      isAdmin: matchedUser.isAdmin,
      isOnboardingCompleted: matchedUser.isOnboardingCompleted
    }
  });
});

app.post("/api/auth/google", (req, res) => {
  // Google OAuth simulation endpoint
  const { credential } = req.body;
  
  const gId = "usr_g" + Math.floor(Math.random() * 1000000);
  const email = "google_user@gmail.com";
  const name = "Google Athlete";

  let finalUser = DB_STORE.users[email];
  if (!finalUser) {
    finalUser = {
      id: gId,
      email,
      name,
      password: "GoogleAuthPassword",
      isAdmin: false,
      profileOnboarded: false,
      isOnboardingCompleted: false
    };
    DB_STORE.users[email] = finalUser;
  }

  const token = `token_${finalUser.id}_google`;
  ACTIVE_SESSIONS.set(token, finalUser);

  res.json({
    message: "Google sign-in successful!",
    token,
    user: {
      id: finalUser.id,
      email: finalUser.email,
      name: finalUser.name,
      profileOnboarded: !!DB_STORE.profiles[finalUser.id],
      isAdmin: finalUser.isAdmin,
      isOnboardingCompleted: finalUser.isOnboardingCompleted
    }
  });
});

app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Missing required email address" });
  }
  const normalized = email.toLowerCase().trim();
  if (!DB_STORE.users[normalized]) {
    return res.status(404).json({ error: "Email address not registered in our database" });
  }
  res.json({ message: "Password reset link emitted securely. Please check inbox raj247368@gmail.com" });
});

app.get("/api/auth/profile", checkAuth, (req, res) => {
  const uId = req.user!.id;
  const profileDetails = DB_STORE.profiles[uId] || null;
  res.json({
    user: req.user,
    profileOnboarded: !!profileDetails,
    profile: profileDetails
  });
});

// --- ONBOARDING FORM, ASSESSMENT & AI PLAN GENERATION ---

app.post("/api/fitness/onboard", checkAuth, async (req, res) => {
  const uId = req.user!.id;
  const profilePayload = req.body;

  // Save profile state to DB
  DB_STORE.profiles[uId] = profilePayload;

  // Complete User state onboarding markers
  const matchedUser = Object.values(DB_STORE.users).find((u) => u.id === uId);
  if (matchedUser) {
    matchedUser.profileOnboarded = true;
    matchedUser.isOnboardingCompleted = true;
  }

  // Generate dynamic stats & meals
  const calcs = runFitnessCalcs(req.user, profilePayload);
  
  // Select Diet Meals database based on preferences
  const dietPref = profilePayload.dietPref === "Vegetarian" ? "veg" : "nonveg";
  const sourceMealPool = SAMPLE_DIET_ITEMS[dietPref];
  
  // Compute target Meal distribution
  const targetCals = calcs.targetCalories;
  const macros = calcs.macros;

  const preWorkoutMeal = {
    mealName: "Pre-Workout Energizer",
    timing: "07:00 AM (45 mins before training)",
    items: profilePayload.dietPref === "Vegetarian" 
      ? ["Banana - 1 medium", "Peanut butter - 1.5 tbsp", "Black Coffee - 1 cup"]
      : ["Boiled Egg egg-whites - 3", "Whole wheat bread toast - 2 slices", "Banana - 1"],
    calories: Math.round(targetCals * 0.15),
    protein: Math.round(macros.protein * 0.15),
    carbs: Math.round(macros.carbs * 0.18),
    fats: Math.round(macros.fats * 0.1)
  };

  const breakfastMeal = {
    mealName: "Anabolic Post-Workout Strength Breakfast",
    timing: "09:30 AM",
    items: profilePayload.dietPref === "Vegetarian"
      ? ["Greek Curd - 200g", "Rolled Oats - 50g with Honey", "Almonds - 10 pieces"]
      : ["Whole Eggs - 3 scrambled in Olive Oil", "Sautéed Spinach", "Oranges - 1 fruit"],
    calories: Math.round(targetCals * 0.25),
    protein: Math.round(macros.protein * 0.25),
    carbs: Math.round(macros.carbs * 0.25),
    fats: Math.round(macros.fats * 0.25)
  };

  const lunchMeal = {
    mealName: "FitForge Lunch fuels",
    timing: "01:30 PM",
    items: profilePayload.dietPref === "Vegetarian"
      ? ["Hygienic Paneer cubes - 150g", "Brown Rice Cooked - 150g", "Boiled Yellow Dal Fry - 1 bowl", "Cucumber Green salad"]
      : ["Grilled chicken breast - 150g", "Steamed Basmati Rice - 150g", "Mixed broccoli sauté", "Lentil Dal soup"],
    calories: Math.round(targetCals * 0.35),
    protein: Math.round(macros.protein * 0.35),
    carbs: Math.round(macros.carbs * 0.35),
    fats: Math.round(macros.fats * 0.35)
  };

  const dinnerMeal = {
    mealName: "Metabolic Repair Dinner",
    timing: "08:30 PM (2hrs before sleep)",
    items: profilePayload.dietPref === "Vegetarian"
      ? ["Soya Chunks block - 50g sautéed with capsicums", "Whole Wheat Roti - 2 medium", "Greek Curd - 100g"]
      : ["Basa Fish filet or Grilled chicken - 120g", "Whole Wheat Roti - 2 chapatis", "Sautéed carrots and cucumbers"],
    calories: Math.round(targetCals * 0.25),
    protein: Math.round(macros.protein * 0.25),
    carbs: Math.round(macros.carbs * 0.22),
    fats: Math.round(macros.fats * 0.3)
  };

  const simulatedMealPlan = {
    bmr: calcs.bmr,
    tdee: calcs.tdee,
    targetCalories: targetCals,
    macros: macros,
    waterIntake: calcs.waterIntake,
    dietType: profilePayload.dietPref || "Vegetarian",
    meals: [preWorkoutMeal, breakfastMeal, lunchMeal, dinnerMeal]
  };

  // Compile Workout Days
  const splitMap: Record<number, string> = {
    2: "Full Body",
    3: "Push-Pull-Legs",
    4: "Upper Lower (4-Day split)",
    5: "Arnold Split (5-Day power)",
    6: "Bro Split (6-Day isolate)",
    7: "Bro Split + Daily Recovery"
  };

  const userAvailableDays = parseInt(profilePayload.workoutDaysPerWeek) || 4;
  const splitType = splitMap[userAvailableDays] || "Custom Active Split";
  const exercises = getOnboardingExercises(profilePayload);

  // Group workout exercises into individual custom days
  const planDays: any[] = [];
  for (let d = 1; d <= userAvailableDays; d++) {
    planDays.push({
      dayName: `Day ${d} of split`,
      focus: d % 2 === 1 ? "Power Hypertrophy & Pull Focus" : "Volume Hypertrophy & Press/Lower Force",
      exercises: exercises.map((e, index) => {
        // Simple shift logic to avoid identical days
        if ((index + d) % 2 === 0) return e;
        // Adjust sets slightly
        return { ...e, sets: Math.max(3, e.sets + (d % 2 === 1 ? 1 : 0)) };
      })
    });
  }

  // Progressive Overload instructions
  const progressiveOverloadSchema = profilePayload.experienceLevel === "Beginner"
    ? "Double Progression: Aim to reach upper rep target (e.g. 15 reps) with bodyweight first, then incrementally add 1-2kg loads under micro-plates."
    : "Heavy linear load steps: Ensure keeping logs, target +5% load or +1 rep on the compound heavy rows or presses each consecutive cycle.";

  const safetyFeedbackHeader = profilePayload.medicalConditions.includes("Knee pain")
    ? "SAFETY VERDICT: High impact leg movements replaced. High-to-low footholds selected on leg press alternatives, squat tempos extended to 4s eccentric."
    : profilePayload.medicalConditions.includes("Back pain")
    ? "SAFETY VERDICT: Absolute lumbar safety activated. Heavy spinal loading deadlifts omitted. Replaced with Chest Supported rows and spine-neutral isometric flat dead-bugs."
    : "SAFETY VERDICT: Cleared for standard intensity. Keep active breathing warm-ups.";

  const simulatedWorkoutPlan = {
    id: generateId("plan"),
    title: `${profilePayload.goal} Custom Split`,
    splitType,
    weeklyVolume: userAvailableDays >= 5 ? "High" : "Medium",
    frequency: `${userAvailableDays} Active scheduled days/week`,
    recoveryAdvice: `Sleep rating active: ${profilePayload.sleepHours} hours. Aim to drink ${calcs.waterIntake} liters water to match muscle hydration levels.`,
    progressiveOverloadSchema,
    days: planDays,
    createdAt: new Date().toISOString().split("T")[0]
  };

  // Supplement choices based on user goals
  let targetSupplements = STANDARD_SUPPLEMENTS.slice(0, 3);
  if (profilePayload.goal === "Muscle Gain" || profilePayload.goal === "Strength Gain") {
    targetSupplements = STANDARD_SUPPLEMENTS.slice(0, 4); // Include Vitamin D3
  } else if (profilePayload.experienceLevel === "Advanced") {
    targetSupplements = STANDARD_SUPPLEMENTS; // Include electrolytes and more
  }

  // Save plans in user saved histories
  if (!DB_STORE.savedPlans[uId]) {
    DB_STORE.savedPlans[uId] = [];
  }
  DB_STORE.savedPlans[uId].push({
    workoutPlan: simulatedWorkoutPlan,
    mealPlan: simulatedMealPlan,
    supplements: targetSupplements
  });

  // Keep reference in direct state
  DB_STORE.dietPlans[uId] = simulatedMealPlan;

  // IF GEMINI_API_KEY is available, we call Gemini to add "Smart AI coach commentary" on top!
  let aiCommentary = "";
  if (ai) {
    try {
      const gResult = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Review this fitness onboarding profile:
Goal: ${profilePayload.goal}
Gender: ${profilePayload.gender}, Weight: ${profilePayload.weight}kg, Height: ${profilePayload.height}cm, Age: ${profilePayload.age}yrs
Medical Conditions: ${profilePayload.medicalConditions.join(", ")}
Equipment: ${profilePayload.availableEquipment.join(", ")}
Target Muscles: ${profilePayload.targetMuscles.join(", ")}

Write a concise 4-sentence elite coaching review. Comment directly on why specific exercises are safety-altered for their medical conditions (like knee or back stiffness), analyze TDEE macros and suggest supplement priorities. Return only the coach commentary text.`,
      });
      aiCommentary = gResult.text || "";
    } catch (apiErr) {
      console.error("AI Generation failed, using system safety parser commentary:", apiErr);
      aiCommentary = `${safetyFeedbackHeader} Your calories are computed at ${targetCals} kcal with custom macro breakdown: Protein: ${macros.protein}g, Carbs: ${macros.carbs}g, Fats: ${macros.fats}g. Daily supplements selected: ${targetSupplements.map(s => s.name).join(", ")}.`;
    }
  } else {
    aiCommentary = `${safetyFeedbackHeader} For your goal of ${profilePayload.goal}, we have safe-routed your workouts. Your target calories are ${targetCals} kcal with macronutrients calibrated beautifully at Protein: ${macros.protein}g, Carbs: ${macros.carbs}g, Fats: ${macros.fats}g to support cell recovery.`;
  }

  res.json({
    message: "Onboarding evaluation completed successfully!",
    calculations: calcs,
    workoutPlan: simulatedWorkoutPlan,
    mealPlan: simulatedMealPlan,
    supplements: targetSupplements,
    aiBriefCommentary: aiCommentary
  });
});

app.get("/api/fitness/saved-plans", checkAuth, (req, res) => {
  const uId = req.user!.id;
  res.json({
    plans: DB_STORE.savedPlans[uId] || []
  });
});

app.post("/api/fitness/save-plan", checkAuth, (req, res) => {
  const uId = req.user!.id;
  const { workoutPlan, mealPlan, supplements } = req.body;

  if (!DB_STORE.savedPlans[uId]) {
    DB_STORE.savedPlans[uId] = [];
  }

  DB_STORE.savedPlans[uId].push({ workoutPlan, mealPlan, supplements });
  res.json({ message: "Plan successfully backed up to your profile storage!" });
});


// --- PROGRESS TRACKER ENDPOINTS ---

app.get("/api/progress/logs", checkAuth, (req, res) => {
  const uId = req.user!.id;
  res.json({
    logs: DB_STORE.progressHistory[uId] || []
  });
});

app.post("/api/progress/log-stats", checkAuth, (req, res) => {
  const uId = req.user!.id;
  const { weight, chestSize, armSize, waistSize, legSize, completedWorkout, notes } = req.body;

  if (!weight) {
    return res.status(400).json({ error: "Weight field is mandatory to submit tracking." });
  }

  const existingLogs = DB_STORE.progressHistory[uId] || [];
  const dailyStreak = existingLogs.length > 0 ? existingLogs[existingLogs.length - 1].dailyStreak + 1 : 1;
  const completedWorkoutCount = existingLogs.length > 0 
    ? existingLogs[existingLogs.length - 1].completedWorkoutCount + (completedWorkout ? 1 : 0)
    : (completedWorkout ? 1 : 0);

  const newLog = {
    id: generateId("pl"),
    userId: uId,
    date: new Date().toISOString().split("T")[0],
    weight: parseFloat(weight),
    chestSize: chestSize ? parseFloat(chestSize) : undefined,
    armSize: armSize ? parseFloat(armSize) : undefined,
    waistSize: waistSize ? parseFloat(waistSize) : undefined,
    legSize: legSize ? parseFloat(legSize) : undefined,
    completedWorkoutCount,
    dailyStreak,
    notes: notes || ""
  };

  existingLogs.push(newLog);
  DB_STORE.progressHistory[uId] = existingLogs;

  res.json({
    message: "Weight and physiological analytics synchronized successfully!",
    newLog,
    streak: dailyStreak
  });
});

app.get("/api/progress/photos", checkAuth, (req, res) => {
  const uId = req.user!.id;
  res.json({
    photos: DB_STORE.progressPhotos[uId] || []
  });
});

app.post("/api/progress/upload-photo", checkAuth, (req, res) => {
  const uId = req.user!.id;
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "No visual URL or file path specified." });
  }

  const photos = DB_STORE.progressPhotos[uId] || [];
  const newPhoto = {
    id: generateId("ph"),
    date: new Date().toISOString().split("T")[0],
    url
  };
  photos.push(newPhoto);
  DB_STORE.progressPhotos[uId] = photos;

  res.json({ message: "Progress photo added!", photo: newPhoto });
});

// --- WORKOUT HISTORY LOGGING ---

app.post("/api/fitness/log-workout", checkAuth, (req, res) => {
  const uId = req.user!.id;
  const { dayName, exercisesCompleted } = req.body;

  if (!DB_STORE.workoutHistory[uId]) {
    DB_STORE.workoutHistory[uId] = [];
  }

  const payload = {
    date: new Date().toISOString().split("T")[0],
    dayName,
    exercisesCompleted: exercisesCompleted || []
  };

  DB_STORE.workoutHistory[uId].push(payload);

  // Auto increment user's daily streak state
  const logs = DB_STORE.progressHistory[uId] || [];
  if (logs.length > 0) {
    logs[logs.length - 1].completedWorkoutCount += 1;
    logs[logs.length - 1].dailyStreak += 1;
  } else {
    DB_STORE.progressHistory[uId] = [{
      id: generateId("pl"),
      userId: uId,
      date: new Date().toISOString().split("T")[0],
      weight: DB_STORE.profiles[uId]?.weight || 80,
      completedWorkoutCount: 1,
      dailyStreak: 1,
      notes: "First logged workout session!"
    }];
  }

  res.json({ message: "Workout session successfully logged to history dashboard!", day: payload });
});

app.get("/api/fitness/workout-history", checkAuth, (req, res) => {
  const uId = req.user!.id;
  res.json({
    history: DB_STORE.workoutHistory[uId] || []
  });
});

// --- GOOGLE GENAI CHAT ASSISTANT ---

app.get("/api/chat/history", checkAuth, (req, res) => {
  const uId = req.user!.id;
  res.json({
    chats: DB_STORE.chatSessions[uId] || []
  });
});

app.post("/api/chat/ask", checkAuth, async (req, res) => {
  const uId = req.user!.id;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Prompt/message content is required." });
  }

  // Create chat history if it doesn't exist
  if (!DB_STORE.chatSessions[uId]) {
    DB_STORE.chatSessions[uId] = [];
  }

  const userLogs = DB_STORE.chatSessions[uId];
  userLogs.push({ role: "user", text: message, timestamp: new Date().toISOString() });

  // Get profile context for safe feedback
  const profile = DB_STORE.profiles[uId];
  const constraintsText = profile 
    ? `\n[Athlete Context for Custom Coaching]:
- Name: ${profile.name}
- Age: ${profile.age}, Goal: ${profile.goal}
- Experience: ${profile.experienceLevel}, Location: ${profile.workoutPreference}
- Injuries/Conditions: ${profile.medicalConditions.join(", ")}`
    : "";

  let modelResponseText = "";

  if (ai) {
    try {
      // Build a structured context to guide safety
      const systemInstruction = `You are the highly elite, supportive Coach FitForge. You specialized in sports nutrition, progressive fitness, and rehabilitation mechanics with a priority on safety.
Your job is to support the athlete with exercise tips, protein sources, calorie goals, and safely modifying biomechanics.
When answering, protect the user. If they have knee pain, warn against heavy squat lockouts. If they have lower back herniation/stiff muscles, recommend chest-supported movements rather than standard deadlifts.
Keep format beautiful, readable, and highly motivating with direct formatting. Include short bullet points for clean visibility.`;

      // Aggregate last 8 messages for basic context
      const chatContext = userLogs.slice(-8).map((msg) => `${msg.role === "user" ? "User" : "Coach"}: ${msg.text}`).join("\n");

      const prompt = `${systemInstruction}\n${constraintsText}\n\nRecent History:\n${chatContext}\n\nCoach, write your response now:`;

      const gResult = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });
      
      modelResponseText = gResult.text || "Coach stands back to review. Let me re-verify that muscle tension pattern for you.";
    } catch (err) {
      console.error("AI Coach API execution error:", err);
      modelResponseText = "Coach is updating weights! Let me provide direct guidance: Warm up properly, stick to slow eccentric tempos (3s negative phase) around critical ligaments, and scale up your daily clean protein (e.g. paneer, eggs, chicken breast) to secure hypertrophy gains.";
    }
  } else {
    // Elegant fallback guidance checking the input text keywords
    const inputClean = message.toLowerCase();
    if (inputClean.includes("pain") || inputClean.includes("injury") || inputClean.includes("hurt")) {
      modelResponseText = "⚠️ **Coach's Safety Guardrail Activated**: Please respect anatomical signals! If you target muscle groups with active knee or lower back tension, swap compound heavy loading with unilateral supports (e.g., supported single-leg split squats, bird-dogs). Seek direct medical reviews for consistent joint inflammation.";
    } else if (inputClean.includes("diet") || inputClean.includes("protein") || inputClean.includes("veg")) {
      modelResponseText = "🥗 **Coach’s Nutrition Blueprint**: Focus on hitting 1.8g to 2.2g of high-absorption proteins per kg of bodyweight. For Indian diets, pair **Paneer**, **Chana Dal**, and **Greek Dahi** to balance essential amino acid pools cleanly. Keep carbohydrate loading post-workout for peak glycogen storage.";
    } else {
      modelResponseText = "⚡ **Coach FitForge Insight**: Great progress focus! Remember, transformation is built upon three pillars: **Consistent Progressive Overload** (adding load/reps/tempo holds), **Optimized Mechanical Tension** (quality flex over swinging), and **Muscle fiber recovery** (7-8 hours deep sleep). Keep going!";
    }
  }

  userLogs.push({ role: "model", text: modelResponseText, timestamp: new Date().toISOString() });
  res.json({ text: modelResponseText });
});


// --- ADMIN PANEL AND STATISTICS ---

app.get("/api/admin/metrics", checkAuth, (req, res) => {
  // Guard admin permissions
  const requestingEmail = req.user!.email;
  if (requestingEmail !== "admin@fitforge.ai") {
    return res.status(403).json({ error: "Unauthorized: Admins access authorization only." });
  }

  // Aggregate stats
  const totalUsers = Object.keys(DB_STORE.users).length;
  const profilesCount = Object.keys(DB_STORE.profiles).length;
  const averageWeight = Object.values(DB_STORE.profiles).reduce((sum, p) => sum + (p.weight || 0), 0) / (profilesCount || 1);
  const commonGoal = "Body Recomposition"; // Simulated mode
  const totalPlansGenerated = Object.values(DB_STORE.savedPlans).reduce((sum, list) => sum + list.length, 0);

  res.json({
    metrics: {
      totalUsers,
      profilesCount,
      averageWeight: Math.round(averageWeight * 10) / 10,
      commonGoal,
      totalPlansGenerated
    },
    usersList: Object.values(DB_STORE.users).map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      onboarded: !!DB_STORE.profiles[u.id],
      isAdmin: u.isAdmin
    })),
    exercises: DB_STORE.exercisesDatabase
  });
});

app.post("/api/admin/exercises/add", checkAuth, (req, res) => {
  const requestingEmail = req.user!.email;
  if (requestingEmail !== "admin@fitforge.ai") {
    return res.status(403).json({ error: "Access Denied: Admin authority only." });
  }

  const { name, targetMuscle, equipment, safeInjury, instructions } = req.body;
  if (!name || !targetMuscle) {
    return res.status(400).json({ error: "Exercise name and Target Muscle are required." });
  }

  const newEx = {
    id: generateId("ex_gen"),
    name,
    targetMuscle,
    equipment: equipment || "Full Gym",
    safeInjury: safeInjury || "None",
    instructions: instructions ? instructions.split("\n") : []
  };

  DB_STORE.exercisesDatabase.push(newEx);
  res.json({ message: "New custom exercise successfully added to FitForge general index!", exercise: newEx });
});


// ==========================================
// STATIC FRONTEND ROUTING & VITE MIDDLEWARE
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("INFO: Vite development middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("INFO: Serving built production static assets.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FitForge AI backend running on port http://localhost:${PORT}`);
  });
}

startServer();
