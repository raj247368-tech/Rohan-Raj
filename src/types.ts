/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  email: string;
  name: string;
  profileOnboarded: boolean;
  isOnboardingCompleted: boolean;
}

export interface UserProfile {
  name: string;
  age: number;
  gender: string;
  height: number; // in cm
  weight: number; // in kg
  goal: string; // Muscle Gain, Fat Loss, Strength Gain, Body Recomposition, Maintenance, General Fitness
  activityLevel: string; // Sedentary, Lightly Active, Moderately Active, Very Active, Extra Active
  experienceLevel: string; // Beginner, Intermediate, Advanced
  workoutPreference: string; // Gym, Home, Hybrid
  workoutDaysPerWeek: number; // 2-7
  sessionDuration: number; // in minutes
  availableEquipment: string[]; // Dumbbells, Resistance Bands, Barbell, Pull-up Bar, Bodyweight-only, Full Gym
  targetMuscles: string[]; // Chest, Back, Shoulders, Arms, Legs, Abs
  sleepHours: number;
  stressLevel: string; // Low, Moderate, High
  waterIntake: number; // in liters
  medicalConditions: string[]; // Diabetes, High blood pressure, Heart disease, Asthma, Thyroid issues, Obesity, Slip disc, Arthritis, Knee pain, Shoulder injury, Back pain, Hernia, None
  injuryDetails?: string;
  medications?: string;
}

export interface Exercise {
  id: string;
  name: string;
  targetMuscle: string;
  sets: number;
  reps: string; // e.g. "8-12", "12-15", "until failure"
  tempo: string; // e.g. "3-0-1-0" for eccentric, pause, concentric, pause
  restTime: string; // e.g. "90s"
  difficultyLevel: "Beginner" | "Intermediate" | "Advanced";
  instructions: string[];
  alternatives: string[];
  injurySafeAlternatives: string[];
  videoPlaceholder: string; // descriptive placeholder for simulated video
}

export interface WorkoutDay {
  dayName: string; // e.g., "Day 1: Push (Chest, Shoulders & Triceps)"
  focus: string;
  exercises: Exercise[];
}

export interface WorkoutPlan {
  id: string;
  title: string;
  splitType: string; // e.g., Push-Pull-Legs, Full Body, Upper-Lower
  weeklyVolume: string; // e.g., "High", "Medium", "Low"
  frequency: string; // e.g., "4 days per week"
  recoveryAdvice: string;
  progressiveOverloadSchema: string;
  days: WorkoutDay[];
  createdAt: string;
}

export interface Meal {
  mealName: string; // e.g., "Pre-Workout Breakfast"
  timing: string; // e.g., "07:30 AM"
  items: string[]; // e.g., ["Oats - 50g", "Paneer - 100g", "Banana - 1"]
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fats: number; // grams
}

export interface NutritionEngineResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  macros: {
    protein: number; // grams
    carbs: number; // grams
    fats: number; // grams
  };
  waterIntake: number; // liters
  dietType: string; // e.g. Vegetarian, Non-Vegetarian, Vegan
  meals: Meal[];
}

export interface Supplement {
  name: string;
  purpose: string;
  dosage: string;
  timing: string;
  beginnerExplanation: string;
  safetyWarning: string;
}

export interface ProgressPhoto {
  id: string;
  date: string;
  url: string; // placeholder text or actual mock visual
}

export interface ProgressLog {
  id: string;
  userId: string;
  date: string;
  weight: number;
  chestSize?: number;
  armSize?: number;
  waistSize?: number;
  legSize?: number;
  completedWorkoutCount: number;
  dailyStreak: number;
  notes?: string;
}

export interface MockDBState {
  users: Record<string, any>;
  profiles: Record<string, UserProfile>;
  savedPlans: Record<string, { workoutPlan?: WorkoutPlan; mealPlan?: NutritionEngineResult; supplements?: Supplement[] }[]>;
  progressHistory: Record<string, ProgressLog[]>;
  progressPhotos: Record<string, ProgressPhoto[]>;
  chatSessions: Record<string, { role: "user" | "model"; text: string; timestamp: string }[]>;
  workoutLogs: Record<string, { date: string; dayName: string; exercisesCompleted: string[] }[]>;
}
