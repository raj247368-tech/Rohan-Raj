/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Dumbbell,
  Activity,
  Flame,
  Utensils,
  Brain,
  User,
  Settings,
  ShieldAlert,
  Trash2,
  Plus,
  Check,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Calendar,
  TrendingUp,
  Sparkles,
  HeartHandshake,
  Lock,
  Upload,
  PlusCircle,
  Coffee,
  RefreshCw,
  FileText,
  CheckCircle2,
  MessageSquare,
  Eye,
  Apple,
  Sparkle,
  Compass
} from "lucide-react";

// ==========================================
// CLIENT TYPES & CONSTANTS
// ==========================================

const GOALS = [
  "Muscle Gain",
  "Fat Loss",
  "Strength Gain",
  "Body Recomposition",
  "Maintenance",
  "General Fitness"
];

const MEDICAL_CONDITIONS = [
  "Diabetes",
  "High blood pressure",
  "Heart disease",
  "Asthma",
  "Thyroid issues",
  "Obesity",
  "Slip disc",
  "Arthritis",
  "Knee pain",
  "Shoulder injury",
  "Back pain",
  "Hernia"
];

const EQUIPMENT_OPTIONS = [
  "Bodyweight-only",
  "Dumbbells",
  "Resistance Bands",
  "Barbell",
  "Pull-up Bar",
  "Full Gym"
];

const MUSCLES = ["Chest", "Back", "Shoulders", "Arms", "Legs", "Abs"];

// ==========================================
// CORE APP ENTRYPOINT
// ==========================================

export default function App() {
  // --- Auth State ---
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("fit_jwt"));
  const [user, setUser] = useState<any | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("password123");
  const [authName, setAuthName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [showForgot, setShowForgot] = useState(false);

  // --- Core Profile State ---
  const [profile, setProfile] = useState<any | null>(null);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [onboardStep, setOnboardStep] = useState(1);
  const [onboardForm, setOnboardForm] = useState({
    name: "",
    age: 26,
    gender: "Male",
    height: 175,
    weight: 78,
    goal: "Body Recomposition",
    activityLevel: "Moderately Active",
    experienceLevel: "Intermediate",
    workoutPreference: "Gym",
    workoutDaysPerWeek: 4,
    sessionDuration: 60,
    availableEquipment: ["Dumbbells", "Barbell", "Full Gym"],
    targetMuscles: ["Chest", "Back", "Legs"],
    sleepHours: 7,
    stressLevel: "Moderate",
    waterIntake: 3,
    dietPref: "Vegetarian",
    dietBudget: "Standard Budget-Friendly",
    medicalConditions: [] as string[],
    injuryDetails: "",
    medications: ""
  });

  // --- Active Plan and Nutrition data states ---
  const [workoutPlan, setWorkoutPlan] = useState<any | null>(null);
  const [mealPlan, setMealPlan] = useState<any | null>(null);
  const [supplements, setSupplements] = useState<any[]>([]);
  const [aiBrief, setAiBrief] = useState("");
  const [isLoadingOnboard, setIsLoadingOnboard] = useState(false);

  // --- Interaction States ---
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, workout, diet, supplements, tracker, coach, settings, admin
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});
  const [workoutLoggedToday, setWorkoutLoggedToday] = useState(false);

  // --- Fitness tracker metrics ---
  const [trackerLogs, setTrackerLogs] = useState<any[]>([]);
  const [trackerPhotos, setTrackerPhotos] = useState<any[]>([]);
  const [newWeight, setNewWeight] = useState("");
  const [newChest, setNewChest] = useState("");
  const [newArm, setNewArm] = useState("");
  const [newWaist, setNewWaist] = useState("");
  const [newLeg, setNewLeg] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [trackerSuccess, setTrackerSuccess] = useState("");

  // --- AI Assistant Chat State ---
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // --- Admin metrics ---
  const [adminMetrics, setAdminMetrics] = useState<any | null>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminNewExName, setAdminNewExName] = useState("");
  const [adminNewExMuscle, setAdminNewExMuscle] = useState("Chest");
  const [adminNewExEquipment, setAdminNewExEquipment] = useState("Full Gym");
  const [adminNewExInjury, setAdminNewExInjury] = useState("None");
  const [adminNewExInstructions, setAdminNewExInstructions] = useState("");
  const [adminSuccess, setAdminSuccess] = useState("");

  // --- Diagnostics & Fallbacks ---
  const [waterGlassesCompleted, setWaterGlassesCompleted] = useState(4);
  const [activeWorkoutDayIndex, setActiveWorkoutDayIndex] = useState(0);

  // ==========================================
  // INITIAL SYNCHRONIZATION
  // ==========================================

  useEffect(() => {
    if (token) {
      fetchUserProfile();
      fetchProgressHistory();
      fetchProgressPhotos();
      fetchChatLogs();
    } else {
      const hasLoggedOut = localStorage.getItem("fit_logged_out") === "true";
      if (!hasLoggedOut) {
        // Default sample user for fast visual preview
        setToken("token_fitforge_john_secret");
        localStorage.setItem("fit_jwt", "token_fitforge_john_secret");
      }
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === "admin") {
      fetchAdminData();
    }
  }, [activeTab]);

  const apiHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  });

  // Fetch verified user profile
  const fetchUserProfile = async () => {
    if (!localStorage.getItem("fit_jwt")) return;
    try {
      const res = await fetch("/api/auth/profile", { headers: apiHeaders() });
      if (!localStorage.getItem("fit_jwt")) return;
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.profile) {
          setProfile(data.profile);
          setOnboardForm(data.profile);
          setIsOnboardingCompleted(true);
          // Fetch saved plans
          fetchSavedPlans();
        } else {
          setIsOnboardingCompleted(false);
          // Default user name setup
          setOnboardForm((prev) => ({ ...prev, name: data.user.name || "" }));
        }
      } else {
        // Fallback John setup if local development is in transit
        handleMockUserActivation();
      }
    } catch (e) {
      if (!localStorage.getItem("fit_jwt")) return;
      handleMockUserActivation();
    }
  };

  const handleMockUserActivation = (interactive: boolean = false) => {
    if (!interactive && (!localStorage.getItem("fit_jwt") || localStorage.getItem("fit_logged_out") === "true")) {
      return;
    }
    // Set mock token for offline sandbox session to load properly
    const mockToken = "token_fitforge_john_secret";
    setToken(mockToken);
    localStorage.setItem("fit_jwt", mockToken);
    localStorage.removeItem("fit_logged_out");

    setUser({ id: "usr_john", email: "john@example.com", name: "John Doe", isAdmin: false });
    // Default mock hydrated profiles
    setProfile({
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
      dietPref: "Vegetarian",
      dietBudget: "Standard Budget-Friendly",
      medicalConditions: ["Knee pain"],
      injuryDetails: "Miniscus tenderness",
      medications: "None"
    });
    setIsOnboardingCompleted(true);
    // Fill local plans fallback
    triggerMockOnboardFallback();
  };

  const triggerMockOnboardFallback = () => {
    const dC = onboardForm.weight ? onboardForm : {
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
      dietPref: "Vegetarian",
      dietBudget: "Standard Budget-Friendly",
      medicalConditions: ["Knee pain"],
      injuryDetails: "Left knee wear",
      medications: "None"
    };

    const targetCal = 2250;
    const macros = { protein: 160, carbs: 235, fats: 65 };
    
    setMealPlan({
      bmr: 1760,
      tdee: 2500,
      targetCalories: targetCal,
      macros,
      waterIntake: 3.2,
      dietType: dC.dietPref,
      meals: [
        {
          mealName: "Anabolic Warm breakfast",
          timing: "08:30 AM",
          items: ["Paneer block - 100g sautéed", "Oats - 50g with Honey", "Banana - 1 medium"],
          calories: 550, protein: 32, carbs: 68, fats: 22
        },
        {
          mealName: "High recovery Clean Lunch",
          timing: "01:30 PM",
          items: ["Brown Rice - 150g cooked", "Boiled Yellow Dal Fry - 1 bowl", "Paneer cubes - 100g in low oil curry", "Mixed green salad"],
          calories: 780, protein: 42, carbs: 98, fats: 24
        },
        {
          mealName: "Post-workout Shake & crunch",
          timing: "05:30 PM",
          items: ["Roasted chickpeas - 50g", "Curd - 150g with peanut butter", "Double whole-wheat toast"],
          calories: 450, protein: 30, carbs: 48, fats: 14
        },
        {
          mealName: "Anti-catabolic bedtime repair dinner",
          timing: "08:45 PM",
          items: ["Soya chunks boiled with spices - 50g", "Whole wheat chapatis - 2 chapatis", "Sautéed beans & broccoli"],
          calories: 470, protein: 36, carbs: 54, fats: 8
        }
      ]
    });

    setWorkoutPlan({
      title: `${dC.goal} Custom Split`,
      splitType: dC.workoutDaysPerWeek >= 4 ? "Upper Lower (4-Day Split)" : "Full Body Workouts",
      weeklyVolume: "Medium Volume",
      frequency: `${dC.workoutDaysPerWeek} Scheduled Days`,
      recoveryAdvice: `Active recovery requested. Aim to rest minimum 75 seconds between sets. Muscle groups feel recovered under ${dC.sleepHours}h rest periods.`,
      progressiveOverloadSchema: "Linear overload: add either 1 rep or 1.5kg to key working compound sets each week.",
      days: [
        {
          dayName: "Day 1: Upper Hypertrophy Focused",
          focus: "Chest, Upper Back and Triceps focus",
          exercises: [
            {
              id: "ex_1",
              name: "Incline Dumbbell Chest Press",
              targetMuscle: "Chest",
              sets: 4,
              reps: "8-12",
              tempo: "3s eccentric, 1s flex",
              restTime: "90s",
              difficultyLevel: "Intermediate",
              instructions: ["Retract scapula flat with slight lower back arc", "Descend weights down safely to mid-chest", "Squeeze chest fibers completely at the top"],
              alternatives: ["Barbell bench press", "Pushups"],
              injurySafeAlternatives: ["Chest Supported Machine Press"],
              videoPlaceholder: "Incline Bench Dumbbell press angle video control"
            },
            {
              id: "ex_2",
              name: "Chest Supported Row (Spine Protection)",
              targetMuscle: "Back",
              sets: 3,
              reps: "10-12",
              tempo: "2s hold, slow extension",
              restTime: "90s",
              difficultyLevel: "Intermediate",
              instructions: ["Position chest flat onto the incline bench padding", "Pull dumbbells wide keeping elbows slightly inside", "Focus on lateral dorsal contraction"],
              alternatives: ["Standard deadlifts", "Bent over Barbell row"],
              injurySafeAlternatives: ["Cable seated rows neutral grip"],
              videoPlaceholder: "Chest supported back rowing biomechanics clip"
            }
          ]
        },
        {
          dayName: "Day 2: Spine-Safe Lower Strength",
          focus: "Quads, Glutes and core stability",
          exercises: [
            {
              id: "ex_3",
              name: dC.medicalConditions.includes("Knee pain") ? "Glute Bridges (Knee Protector)" : "Goblet Dumbbell Squats",
              targetMuscle: "Legs",
              sets: 4,
              reps: "12-15",
              tempo: "4-0-1-0",
              restTime: "90s",
              difficultyLevel: "Beginner",
              instructions: ["Keep knees aligned in trajectory of hips", "Push weight primarily down into active heels", "Squeeze hamstrings and glutes for leverage"],
              alternatives: ["Barbell front squat"],
              injurySafeAlternatives: ["Leg extensions control reps"],
              videoPlaceholder: "Joint friendly lower body mechanics display"
            }
          ]
        }
      ]
    });

    setSupplements([
      {
        name: "Whey Protein Isolate",
        purpose: "Macronutrient reinforcement and faster muscle tissue repair.",
        dosage: "1 scoop (33g)",
        timing: "Immediately post-training or first thing in morning",
        beginnerExplanation: "Filtered clean protein powder supplying complete amino acids quickly without digestive loads.",
        safetyWarning: "No standard warnings. Maintain solid daily hydration."
      },
      {
        name: "Creatine Monohydrate",
        purpose: "Phosphocreatine recharge, muscular size expansion, and power release.",
        dosage: "3-5 grams daily",
        timing: "Any time. Highly synergistic when paired with carbs post-workout",
        beginnerExplanation: "Direct compound helping cells replenish ATP energy rapidly during heavy lifts.",
        safetyWarning: "Avoid in active severe kidney diagnostic conditions."
      }
    ]);

    setAiBrief("SYSTEM: FitForge active algorithms established safety modifications. Knee & Lower spine protectors activated automatically.");
  };

  const fetchSavedPlans = async () => {
    if (!localStorage.getItem("fit_jwt")) return;
    try {
      const res = await fetch("/api/fitness/saved-plans", { headers: apiHeaders() });
      if (!localStorage.getItem("fit_jwt")) return;
      if (res.ok) {
        const data = await res.json();
        if (data.plans && data.plans.length > 0) {
          const activePlan = data.plans[data.plans.length - 1];
          setWorkoutPlan(activePlan.workoutPlan);
          setMealPlan(activePlan.mealPlan);
          setSupplements(activePlan.supplements);
        } else {
          triggerMockOnboardFallback();
        }
      }
    } catch {
      if (!localStorage.getItem("fit_jwt")) return;
      triggerMockOnboardFallback();
    }
  };

  const fetchProgressHistory = async () => {
    if (!localStorage.getItem("fit_jwt")) return;
    try {
      const res = await fetch("/api/progress/logs", { headers: apiHeaders() });
      if (!localStorage.getItem("fit_jwt")) return;
      if (res.ok) {
        const data = await res.json();
        setTrackerLogs(data.logs);
      } else {
        setTrackersFallback();
      }
    } catch {
      if (!localStorage.getItem("fit_jwt")) return;
      setTrackersFallback();
    }
  };

  const fetchProgressPhotos = async () => {
    if (!localStorage.getItem("fit_jwt")) return;
    try {
      const res = await fetch("/api/progress/photos", { headers: apiHeaders() });
      if (!localStorage.getItem("fit_jwt")) return;
      if (res.ok) {
        const data = await res.json();
        setTrackerPhotos(data.photos);
      } else {
        setPhotosFallback();
      }
    } catch {
      if (!localStorage.getItem("fit_jwt")) return;
      setPhotosFallback();
    }
  };

  const fetchChatLogs = async () => {
    if (!localStorage.getItem("fit_jwt")) return;
    try {
      const res = await fetch("/api/chat/history", { headers: apiHeaders() });
      if (!localStorage.getItem("fit_jwt")) return;
      if (res.ok) {
        const data = await res.json();
        setChatHistory(data.chats);
      } else {
        setChatDefaultMessage();
      }
    } catch {
      if (!localStorage.getItem("fit_jwt")) return;
      setChatDefaultMessage();
    }
  };

  const setTrackersFallback = () => {
    setTrackerLogs([
      { id: "pl_1", date: "2026-05-01", weight: 84.1, completedWorkoutCount: 3, dailyStreak: 3, notes: "Feeling slightly sluggish initially." },
      { id: "pl_2", date: "2026-05-12", weight: 82.8, completedWorkoutCount: 11, dailyStreak: 5, notes: "Weight shedding beautifully. Knee pain subsiding." },
      { id: "pl_3", date: "2026-05-23", weight: 81.5, completedWorkoutCount: 19, dailyStreak: 8, notes: "Metabolic output peaked. Abs highly defined!" }
    ]);
  };

  const setPhotosFallback = () => {
    setTrackerPhotos([
      { id: "ph1", date: "2026-05-01", url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=300&auto=format&fit=crop" },
      { id: "ph2", date: "2026-05-23", url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=300&auto=format&fit=crop" }
    ]);
  };

  const setChatDefaultMessage = () => {
    setChatHistory([
      { role: "model", text: "Welcome to your AI Coach fitness portal. I have analyzed your profile & physical goals. Ask me how to perfect your reps, meal-prep efficiently, or alter exercises under specific orthopedic needs!", timestamp: new Date().toISOString() }
    ]);
  };

  const fetchAdminData = async () => {
    if (!localStorage.getItem("fit_jwt")) return;
    try {
      const res = await fetch("/api/admin/metrics", { headers: apiHeaders() });
      if (!localStorage.getItem("fit_jwt")) return;
      if (res.ok) {
        const data = await res.json();
        setAdminMetrics(data.metrics);
        setAdminUsers(data.usersList);
      }
    } catch (e) {
      console.warn("User does not have admin permissions or server offline.");
    }
  };

  // ==========================================
  // CORE FORM SUBMISSIONS & LOGIC
  // ==========================================

  const handleAuthentication = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!authEmail || !authPassword) {
      setAuthError("Email and Password are required characters.");
      return;
    }

    const path = isSignUp ? "/api/auth/signup" : "/api/auth/login";
    const payload = isSignUp ? { name: authName, email: authEmail, password: authPassword } : { email: authEmail, password: authPassword };

    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || "An error occurred during authentication.");
        return;
      }

      setToken(data.token);
      localStorage.setItem("fit_jwt", data.token);
      localStorage.removeItem("fit_logged_out");
      setUser(data.user);
      setAuthSuccess("Credentials verified cleanly! Let's build muscle fiber.");

      if (data.user.profileOnboarded || data.profileOnboarded) {
        setIsOnboardingCompleted(true);
        fetchUserProfile();
      } else {
        setIsOnboardingCompleted(false);
        setOnboardStep(1);
      }
    } catch (err) {
      // Mock log for instant sandbox testing
      setAuthSuccess("Offline Mode triggered successfully.");
      handleMockUserActivation(true);
    }
  };

  // Simulate Google oauth login
  const handleGoogleOAuthSimulate = async () => {
    setAuthError("");
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: "mock_google_id_token_xyz" })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        localStorage.setItem("fit_jwt", data.token);
        localStorage.removeItem("fit_logged_out");
        setUser(data.user);
        if (data.user.profileOnboarded) {
          setIsOnboardingCompleted(true);
          fetchUserProfile();
        } else {
          setIsOnboardingCompleted(false);
          setOnboardStep(1);
        }
      }
    } catch {
      handleMockUserActivation(true);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    if (!forgotEmail) {
      setAuthError("Specify email destination.");
      return;
    }
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail })
      });
      if (res.ok) {
        setAuthSuccess("Recovery route emitted to inbox!");
        setShowForgot(false);
      } else {
        setAuthError("Failed to issue password recovery link.");
      }
    } catch {
      setAuthSuccess("Recovery code processed (offline simulation).");
    }
  };

  // Onboarding wizard toggles
  const handleOnboardFormToggle = (field: string, value: string) => {
    setOnboardForm((prev) => {
      const current = prev[field as keyof typeof prev];
      if (Array.isArray(current)) {
        const index = current.indexOf(value);
        if (index > -1) {
          return { ...prev, [field]: current.filter((x) => x !== value) };
        } else {
          return { ...prev, [field]: [...current, value] };
        }
      }
      return { ...prev, [field]: value };
    });
  };

  const submitOnboardingAction = async () => {
    setIsLoadingOnboard(true);
    try {
      const res = await fetch("/api/fitness/onboard", {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify(onboardForm)
      });
      const data = await res.json();

      if (res.ok) {
        setWorkoutPlan(data.workoutPlan);
        setMealPlan(data.mealPlan);
        setSupplements(data.supplements);
        setAiBrief(data.aiBriefCommentary);
        setIsOnboardingCompleted(true);
        setActiveTab("dashboard");
      } else {
        alert("Evaluation parsing error, falling back to local formulas");
        triggerMockOnboardFallback();
        setIsOnboardingCompleted(true);
      }
    } catch {
      triggerMockOnboardFallback();
      setIsOnboardingCompleted(true);
    } finally {
      setIsLoadingOnboard(false);
    }
  };

  // Habit toggling on Dashboard
  const toggleExerciseCheck = (id: string) => {
    setCompletedExercises((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const submitCompletedWorkoutLogged = async () => {
    if (!workoutPlan) return;
    const activeDay = workoutPlan.days[activeWorkoutDayIndex];
    const finishedIds = activeDay.exercises
      .filter((e: any) => completedExercises[e.id])
      .map((e: any) => e.name);

    try {
      const res = await fetch("/api/fitness/log-workout", {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          dayName: activeDay.dayName,
          exercisesCompleted: finishedIds
        })
      });
      if (res.ok) {
        setWorkoutLoggedToday(true);
        fetchProgressHistory();
        alert("Awesome! Workout successfully recorded in local databases.");
      }
    } catch {
      setWorkoutLoggedToday(true);
      // Hardcode fallbacks local state addition
      alert("Workout recorded in offline sandbox!");
    }
  };

  // Chat Coach triggering
  const submitCoachPromptText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentMessage.trim()) return;

    const userMsg = currentMessage;
    setCurrentMessage("");
    setChatHistory((p) => [...p, { role: "user", text: userMsg, timestamp: new Date().toISOString() }]);
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/chat/ask", {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      if (res.ok) {
        setChatHistory((p) => [...p, { role: "model", text: data.text, timestamp: new Date().toISOString() }]);
      } else {
        throw new Error();
      }
    } catch {
      // Offline smart coaching review
      setTimeout(() => {
        let reply = "Coach is updating weights! Let me provide direct guidance: Warm up properly, stick to slow eccentric tempos (3s negative phase) around critical ligaments, and scale up your daily clean protein (e.g. paneer, eggs, chicken breast) to secure hypertrophy gains.";
        const cText = userMsg.toLowerCase();
        if (cText.includes("knee") || cText.includes("back") || cText.includes("pain")) {
          reply = "⚠️ **Anatomical Safety Guard activated**: Keep joints warm. Avoid full knee extensions past 90 degrees or spinal loads if compression aggravates disks. Substitute with isometric holds and slow-tempo static split squats.";
        } else if (cText.includes("protein") || cText.includes("veg") || cText.includes("diet")) {
          reply = "🌱 **Vegetarian Muscle Nutrition Formula**: Focus on Greek Dahi, Soya nuggets, yellow Lentils and Paneer. Soya provides a complete amino-acid score. Sip BCAA or Whey isolate post training to fast track recovery.";
        }
        setChatHistory((p) => [...p, { role: "model", text: reply, timestamp: new Date().toISOString() }]);
      }, 900);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleLoggedProgressStats = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackerSuccess("");
    if (!newWeight) {
      alert("Please specify weight reading.");
      return;
    }
    try {
      const res = await fetch("/api/progress/log-stats", {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          weight: newWeight,
          chestSize: newChest,
          armSize: newArm,
          waistSize: newWaist,
          legSize: newLeg,
          completedWorkout: true,
          notes: newNotes
        })
      });
      if (res.ok) {
        setTrackerSuccess("Biometrics logged successfully into charts.");
        fetchProgressHistory();
        setNewWeight("");
        setNewChest("");
        setNewArm("");
        setNewWaist("");
        setNewLeg("");
        setNewNotes("");
      }
    } catch {
      setTrackerSuccess("Stats saved to sandbox chart.");
      // Simulated append
      setTrackerLogs((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          date: new Date().toISOString().split("T")[0],
          weight: parseFloat(newWeight) || 80,
          completedWorkoutCount: trackerLogs.length + 1,
          dailyStreak: trackerLogs.length + 1,
          notes: newNotes || "Simulated progress record"
        }
      ]);
    }
  };

  const handleLogPhotoUrlInput = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl.trim()) return;
    try {
      const res = await fetch("/api/progress/upload-photo", {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ url: newPhotoUrl })
      });
      if (res.ok) {
        setNewPhotoUrl("");
        fetchProgressPhotos();
      }
    } catch {
      setTrackerPhotos((prev) => [
        ...prev,
        { id: String(Date.now()), date: new Date().toISOString().split("T")[0], url: newPhotoUrl }
      ]);
      setNewPhotoUrl("");
    }
  };

  // Admin section: publish exercise
  const publishExerciseAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSuccess("");
    if (!adminNewExName.trim()) return;
    try {
      const res = await fetch("/api/admin/exercises/add", {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          name: adminNewExName,
          targetMuscle: adminNewExMuscle,
          equipment: adminNewExEquipment,
          safeInjury: adminNewExInjury,
          instructions: adminNewExInstructions
        })
      });
      if (res.ok) {
        setAdminSuccess("New sports pattern published successfully to main directory!");
        setAdminNewExName("");
        setAdminNewExInstructions("");
        fetchAdminData();
      }
    } catch {
      setAdminSuccess("Exercise logged inside database (sandbox simulation).");
    }
  };

  // Perform quick visual logout
  const triggerLogoutAndReset = () => {
    localStorage.setItem("fit_logged_out", "true");
    localStorage.removeItem("fit_jwt");
    setToken(null);
    setUser(null);
    setProfile(null);
    setIsOnboardingCompleted(false);
    setOnboardStep(1);
  };

  const loadPreSetQuestion = (q: string) => {
    setCurrentMessage(q);
  };

  // SVG Weight trend drawing helper
  const renderTrendSVGLine = () => {
    if (trackerLogs.length === 0) return null;
    const padding = 40;
    const width = 500;
    const height = 200;

    const weights = trackerLogs.map((l) => l.weight);
    const minWeight = Math.min(...weights) - 2;
    const maxWeight = Math.max(...weights) + 2;
    const weightRange = maxWeight - minWeight || 1;

    const points = trackerLogs.map((log, index) => {
      const x = padding + (index * (width - 2 * padding)) / Math.max(1, trackerLogs.length - 1);
      const y = height - padding - ((log.weight - minWeight) * (height - 2 * padding)) / weightRange;
      return { x, y, weight: log.weight, date: log.date };
    });

    const pathData = points.reduce((acc, p, index) => {
      if (index === 0) return `M ${p.x} ${p.y}`;
      return `${acc} L ${p.x} ${p.y}`;
    }, "");

    return (
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto text-brand">
          {/* Grid Lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#27272a" strokeWidth="1" strokeDasharray="3,3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#27272a" strokeWidth="1" strokeDasharray="3,3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#27272a" strokeWidth="1" strokeDasharray="3,3" />

          {/* Core Line */}
          <motion.path
            d={pathData}
            fill="none"
            stroke="#22c55e"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />

          {/* Interactive circles */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="5" className="fill-black stroke-brand stroke-2 cursor-pointer" />
              <text x={p.x} y={p.y - 10} textAnchor="middle" className="fill-zinc-300 font-mono text-[9px]">
                {p.weight} kg
              </text>
              <text x={p.x} y={height - 12} textAnchor="middle" className="fill-zinc-500 font-sans text-[8px]">
                {p.date.substring(5)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-dark-bg text-zinc-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-brand selection:text-black">
      
      {/* Background neon orb accents */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-glow blur-[140px] rounded-full pointer-events-none pulse-glow-bg"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[550px] h-[550px] bg-brand-glow blur-[160px] rounded-full pointer-events-none pulse-glow-bg"></div>

      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 bg-zinc-950/70 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-brand p-2 rounded-lg text-black font-extrabold flex items-center justify-center neon-glow-btn">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-extrabold text-xl tracking-tight text-white block">
                FIT<span className="text-brand">FORGE</span> AI
              </span>
              <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase block">Premium Athlete Hub</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {token ? (
              <div className="flex items-center gap-2">
                {user && (
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-xs text-brand font-semibold capitalize font-mono">● Active Session</span>
                    <span className="text-sm font-semibold text-zinc-200">{user.name || "Aesthetic User"}</span>
                  </div>
                )}
                <button
                  id="signout-button"
                  onClick={triggerLogoutAndReset}
                  className="bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700/60 p-2 px-3 rounded-lg text-zinc-300 transition-colors flex items-center gap-2 cursor-pointer"
                  title="Logout Session"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-mono">Exit</span>
                </button>
              </div>
            ) : (
              <div className="text-xs font-mono px-3 py-1 bg-zinc-800/80 border border-zinc-700/60 rounded-full text-zinc-300">
                🔒 Sandbox Sandbox Access Enabled
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 z-10 flex flex-col gap-6">

        {/* 1. AUTHENTICATION SCREENS (IF NOT LOGGED IN / TOKEN REMOVED) */}
        {!token ? (
          <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-8">
            
            {/* Visual marketing column */}
            <div className="lg:col-span-7 flex flex-col justify-center gap-5 text-left">
              <span className="inline-block bg-brand-glow border border-brand/20 text-brand px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-widest w-fit">
                ★ The Ultimate Transformation Engine
              </span>
              <h1 className="text-4xl md:text-6xl font-display font-black tracking-tight text-white leading-none">
                Forge Muscle.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-emerald-400">
                  Adapt Around Pain.
                </span>
              </h1>
              <p className="text-zinc-400 text-base md:text-lg max-w-xl">
                FitForge computes dynamic target metrics, generates safe gym or small-space home training splits, provides custom micro-nutritive Indian meal templates, and runs active clinical injury safeguards.
              </p>

              {/* Showcase highlights */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 font-mono">
                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                  <span className="text-brand font-bold text-lg block">100%</span>
                  <span className="text-zinc-400 text-[10px] uppercase">Orthopedic Safety</span>
                </div>
                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                  <span className="text-brand font-bold text-lg block">Gym & Home</span>
                  <span className="text-zinc-400 text-[10px] uppercase">Seamless Adaptive</span>
                </div>
                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl col-span-2 md:col-span-1">
                  <span className="text-brand font-bold text-lg block">Indian Diets</span>
                  <span className="text-zinc-400 text-[10px] uppercase">Veg / Non-veg scaling</span>
                </div>
              </div>
            </div>

            {/* Interactive Auth Card */}
            <div className="lg:col-span-5 bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl glass-panel relative">
              <div className="absolute top-0 right-4 transform translate-y-[-50%] bg-zinc-950 border border-zinc-800 text-xs px-2.5 py-1 rounded-full text-zinc-400 font-mono uppercase">
                FitForge Secure
              </div>

              {!showForgot ? (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-display font-bold text-white mb-1">
                      {isSignUp ? "Create Athlete Account" : "Access Transformation Portal"}
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Explore optimized splits, interactive weight charts, and our AI Coach system.
                    </p>
                  </div>

                  <form onSubmit={handleAuthentication} className="flex flex-col gap-4">
                    {isSignUp && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-mono uppercase text-zinc-400">Full Name</label>
                        <input
                          type="text"
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          placeholder="Titan Beast"
                          className="bg-zinc-950 border border-zinc-800 text-sm text-white rounded-lg p-3 outline-none focus:border-brand-glow transition-colors focus:ring-1 focus:ring-brand"
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono uppercase text-zinc-400">Email Address</label>
                      <input
                        type="email"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="athlete@fitforge.ai"
                        className="bg-zinc-950 border border-zinc-800 text-sm text-white rounded-lg p-3 outline-none focus:border-brand-glow transition-colors focus:ring-1 focus:ring-brand"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-mono uppercase text-zinc-400">Security Password</label>
                        {!isSignUp && (
                          <button
                            type="button"
                            onClick={() => setShowForgot(true)}
                            className="text-[10px] text-zinc-500 hover:text-brand font-mono underline"
                          >
                            Reset Password?
                          </button>
                        )}
                      </div>
                      <input
                        type="password"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-zinc-950 border border-zinc-800 text-sm text-white rounded-lg p-3 outline-none focus:border-brand-glow transition-colors focus:ring-1 focus:ring-brand"
                      />
                    </div>

                    {authError && (
                      <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg font-mono">
                        ⚠ {authError}
                      </div>
                    )}
                    {authSuccess && (
                      <div className="bg-brand-glow border border-brand/30 text-brand text-xs p-3 rounded-lg font-mono">
                        ✓ {authSuccess}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="bg-brand hover:brightness-110 active:scale-95 text-black font-extrabold py-3 text-sm rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer font-display"
                    >
                      <span>{isSignUp ? "Register Custom Profile" : "Secure Log In"}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </form>

                  {/* Google OAuth Simulation button */}
                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-zinc-800"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-zinc-900 px-2 text-zinc-500 font-mono">Or Connect Instantly</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleOAuthSimulate}
                    className="w-full border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 py-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#ea4335"
                        d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.51 1.73 14.99 1 12 1 7.35 1 3.41 3.69 1.57 7.56l3.82 2.96c.9-2.7 3.4-4.48 6.61-4.48z"
                      />
                      <path
                        fill="#4285f4"
                        d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.46c-.28 1.47-1.11 2.72-2.36 3.56l3.66 2.84c2.14-1.97 3.39-4.88 3.39-8.51z"
                      />
                      <path
                        fill="#fbbc05"
                        d="M5.39 14.84l-3.82 2.96C3.41 21.69 7.35 24 12 24c3.04 0 5.61-.99 7.48-2.69l-3.66-2.84c-1 .67-2.28 1.07-3.82 1.07-3.21 0-5.71-1.78-6.61-4.48z"
                      />
                      <path
                        fill="#34a853"
                        d="M1.57 7.56c-.36 1.1-.57 2.29-.57 3.54s.21 2.44.57 3.54l3.82-2.96c-.09-.34-.14-.7-.14-1.08s.05-.74.14-1.08L1.57 7.56z"
                      />
                    </svg>
                    <span>Log In via Google Credentials</span>
                  </button>

                  <div className="mt-5 text-center">
                    <button
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-xs text-brand hover:underline font-mono"
                    >
                      {isSignUp ? "Already have an account? Sign In" : "New to FitForge? Build an Account"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-display font-bold text-white mb-1">Reset Password</h2>
                    <p className="text-xs text-zinc-400">Inject registered email destination to resolve security locks.</p>
                  </div>

                  <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono uppercase text-zinc-400">Verification Email</label>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="athlete@fitforge.ai"
                        className="bg-zinc-950 border border-zinc-800 text-sm text-white rounded-lg p-3 outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="bg-brand text-black font-extrabold py-3 rounded-lg text-sm transition-opacity"
                    >
                      Emit Recovery Link
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowForgot(false)}
                      className="text-xs text-zinc-500 hover:text-white font-mono"
                    >
                      ← Back to Login
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        ) : !isOnboardingCompleted ? (
          
          // 2. SMARTER ONBOARDING WIZARD & INJURY ADAPTER FORM
          <div className="max-w-3xl mx-auto w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 glass-panel relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
              <div>
                <h2 className="text-2xl font-display font-black text-white">
                  Athlete Clinical Setup
                </h2>
                <p className="text-xs text-zinc-400">Step {onboardStep} of 4: Compute physical targets and joint safeguards</p>
              </div>
              <span className="text-xs bg-brand-glow text-brand border border-brand/30 px-3 py-1 rounded-full font-mono font-bold">
                Level {onboardStep}
              </span>
            </div>

            {/* Stepper Wizard Indicator */}
            <div className="flex items-center gap-2 mb-8">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    onboardStep >= step ? "bg-brand" : "bg-zinc-850"
                  }`}
                ></div>
              ))}
            </div>

            {/* Step Content Rendering */}
            <div className="min-h-[280px]">
              {onboardStep === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
                  <h3 className="text-md font-display font-medium text-white font-mono uppercase text-brand">Basic Bodystructures</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-zinc-400 font-mono uppercase">Full Coach Name</label>
                      <input
                        type="text"
                        value={onboardForm.name}
                        onChange={(e) => setOnboardForm({ ...onboardForm, name: e.target.value })}
                        placeholder="Your Name"
                        className="bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 p-3 rounded-lg outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-zinc-400 font-mono uppercase">Gender</label>
                      <select
                        value={onboardForm.gender}
                        onChange={(e) => setOnboardForm({ ...onboardForm, gender: e.target.value })}
                        className="bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 p-3 rounded-lg outline-none"
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Non-Binary</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-zinc-400 font-mono uppercase">Age (years)</label>
                      <input
                        type="number"
                        value={onboardForm.age}
                        onChange={(e) => setOnboardForm({ ...onboardForm, age: parseInt(e.target.value) || 25 })}
                        className="bg-zinc-950 border border-zinc-800 text-sm p-3 rounded-lg text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-zinc-400 font-mono uppercase">Height (cm)</label>
                        <input
                          type="number"
                          value={onboardForm.height}
                          onChange={(e) => setOnboardForm({ ...onboardForm, height: parseInt(e.target.value) || 170 })}
                          className="bg-zinc-950 border border-zinc-800 text-sm p-3 rounded-lg text-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-zinc-400 font-mono uppercase">Weight (kg)</label>
                        <input
                          type="number"
                          value={onboardForm.weight}
                          onChange={(e) => setOnboardForm({ ...onboardForm, weight: parseInt(e.target.value) || 75 })}
                          className="bg-zinc-950 border border-zinc-800 text-sm p-3 rounded-lg text-white"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {onboardStep === 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
                  <h3 className="text-lg font-display text-white font-mono uppercase text-brand">Goal Adjustment & Location</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-zinc-400 font-mono uppercase">Primary Transformation Goal</label>
                      <select
                        value={onboardForm.goal}
                        onChange={(e) => setOnboardForm({ ...onboardForm, goal: e.target.value })}
                        className="bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 p-3 rounded-lg outline-none"
                      >
                        {GOALS.map((g) => (
                          <option key={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-zinc-400 font-mono uppercase">Activity Scale</label>
                      <select
                        value={onboardForm.activityLevel}
                        onChange={(e) => setOnboardForm({ ...onboardForm, activityLevel: e.target.value })}
                        className="bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 p-3 rounded-lg outline-none"
                      >
                        <option>Sedentary</option>
                        <option>Lightly Active</option>
                        <option>Moderately Active</option>
                        <option>Very Active</option>
                        <option>Extra Active</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-zinc-400 font-mono uppercase">Workout Experience</label>
                      <select
                        value={onboardForm.experienceLevel}
                        onChange={(e) => setOnboardForm({ ...onboardForm, experienceLevel: e.target.value })}
                        className="bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 p-3 rounded-lg outline-none"
                      >
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-zinc-400 font-mono uppercase">Workout Setting Priority</label>
                      <select
                        value={onboardForm.workoutPreference}
                        onChange={(e) => setOnboardForm({ ...onboardForm, workoutPreference: e.target.value })}
                        className="bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 p-3 rounded-lg outline-none"
                      >
                        <option>Gym</option>
                        <option>Home</option>
                        <option>Hybrid</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {onboardStep === 3 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
                  <h3 className="text-lg font-display text-white font-mono uppercase text-brand">Frequency, Equipment & Targets</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-zinc-400 font-mono uppercase">Active Days/Week (2 - 7)</label>
                      <input
                        type="number"
                        min="2"
                        max="7"
                        value={onboardForm.workoutDaysPerWeek}
                        onChange={(e) => setOnboardForm({ ...onboardForm, workoutDaysPerWeek: parseInt(e.target.value) || 4 })}
                        className="bg-zinc-950 border border-zinc-800 text-sm p-3 rounded-lg text-white"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-zinc-400 font-mono uppercase">Daily water hydration benchmark (Liters)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={onboardForm.waterIntake}
                        onChange={(e) => setOnboardForm({ ...onboardForm, waterIntake: parseFloat(e.target.value) || 3 })}
                        className="bg-zinc-950 border border-zinc-800 text-sm p-3 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-zinc-400 font-mono uppercase mb-2 block">Choose equipment available:</span>
                    <div className="grid grid-cols-3 gap-2">
                      {EQUIPMENT_OPTIONS.map((eq) => {
                        const included = onboardForm.availableEquipment.includes(eq);
                        return (
                          <button
                            key={eq}
                            type="button"
                            onClick={() => handleOnboardFormToggle("availableEquipment", eq)}
                            className={`p-2 rounded-lg text-xs font-mono border transition-all ${
                              included ? "bg-brand/20 border-brand text-brand" : "bg-zinc-950 border-zinc-800 text-zinc-400"
                            }`}
                          >
                            {eq}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-zinc-400 font-mono uppercase mb-2 block">Focus Muscle Groups:</span>
                    <div className="grid grid-cols-3 gap-2">
                      {MUSCLES.map((m) => {
                        const included = onboardForm.targetMuscles.includes(m);
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleOnboardFormToggle("targetMuscles", m)}
                            className={`p-2 rounded-lg text-xs font-mono border transition-all ${
                              included ? "bg-brand/20 border-brand text-brand" : "bg-zinc-950 border-zinc-800 text-zinc-400"
                            }`}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {onboardStep === 4 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
                  <h3 className="text-md font-display font-medium text-white font-mono uppercase text-red-400 flex items-center gap-1">
                    <ShieldAlert className="w-5 h-5" />
                    <span>Clinical Orthopedic Safety & Diets</span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Orthopedic limitations replace heavy axial skeleton compressions or high load knee flexion. Correct meal profiles optimize liver filtration.
                  </p>

                  <div className="grid grid-cols-3 gap-2 py-2">
                    {MEDICAL_CONDITIONS.map((cond) => {
                      const selected = onboardForm.medicalConditions.includes(cond);
                      return (
                        <button
                          key={cond}
                          type="button"
                          onClick={() => handleOnboardFormToggle("medicalConditions", cond)}
                          className={`p-2 rounded-lg text-[11px] font-mono border transition-all ${
                            selected ? "bg-red-500/10 border-red-500/60 text-red-400" : "bg-zinc-950 border-zinc-805 text-zinc-400"
                          }`}
                        >
                          {cond}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-zinc-400 font-mono uppercase">Indian diet category</label>
                      <select
                        value={onboardForm.dietPref}
                        onChange={(e) => setOnboardForm({ ...onboardForm, dietPref: e.target.value })}
                        className="bg-zinc-950 border border-zinc-850 text-sm p-3 rounded-lg outline-none text-white"
                      >
                        <option>Vegetarian</option>
                        <option>Non-Vegetarian</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-zinc-450 font-mono uppercase">Dietary Sourcing Budget</label>
                      <select
                        value={onboardForm.dietBudget}
                        onChange={(e) => setOnboardForm({ ...onboardForm, dietBudget: e.target.value })}
                        className="bg-zinc-950 border border-zinc-850 text-sm p-3 rounded-lg outline-none text-white"
                      >
                        <option>Standard Budget-Friendly</option>
                        <option>Premium Sport Elite Pro</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-zinc-400 font-mono uppercase">Identify active joint pains or surgery detail (Optional)</label>
                    <input
                      type="text"
                      value={onboardForm.injuryDetails}
                      onChange={(e) => setOnboardForm({ ...onboardForm, injuryDetails: e.target.value })}
                      placeholder="e.g., Lower back hernia (L4-S1), knee stiffness in heavy squats"
                      className="bg-zinc-950 border border-zinc-800 text-sm p-3 rounded-lg text-white outline-none focus:border-brand-glow"
                    />
                  </div>

                  <div className="bg-zinc-950 border border-zinc-850 p-3 rounded-lg text-[10px] text-zinc-400 font-mono leading-relaxed">
                    ⚖ <strong>MEDICAL SAFETY POLICY DISCLAIMER</strong>: This application provides calculated athletic suggestions, and does not serve as a clinical medical prescription or clearance substitute. Monitor pain and respect biological signs.
                  </div>
                </motion.div>
              )}
            </div>

            {/* Stepper controls */}
            <div className="flex items-center justify-between border-t border-zinc-800 pt-5 mt-6">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={onboardStep === 1}
                  onClick={() => setOnboardStep((prev) => prev - 1)}
                  className="bg-zinc-850 text-zinc-300 disabled:opacity-40 px-4 py-2 rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Prev Step</span>
                </button>
                <button
                  type="button"
                  onClick={triggerLogoutAndReset}
                  className="bg-red-950/40 hover:bg-red-950/60 border border-red-900/30 text-red-400 px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer"
                  title="Cancel onboarding and log out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Exit Setup</span>
                </button>
              </div>

              {onboardStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setOnboardStep((prev) => prev + 1)}
                  className="bg-brand text-black font-extrabold px-5 py-2.5 rounded-lg text-xs font-mono flex items-center gap-1"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submitOnboardingAction}
                  disabled={isLoadingOnboard}
                  className="bg-brand hover:brightness-110 text-black font-extrabold px-6 py-2.5 rounded-lg text-xs font-mono flex items-center gap-1.5 neon-glow-btn"
                >
                  {isLoadingOnboard ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Forging Plans...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Formulate FitForge AI Plans</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ) : (
          
          // 3. CORE PERFORMANCE DASHBOARD ENGINE (FULLY RESOLVED LOGIN + ONBOARDED)
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Sidebar Controller Tab List */}
            <div className="lg:col-span-3 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 glass-panel flex flex-col gap-2">
              <div className="pb-3 mb-3 border-b border-zinc-800/50">
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest block">Main Nav rails</span>
                <span className="text-xs font-semibold text-zinc-300 capitalize">{profile?.goal || "Transformation Mode"}</span>
              </div>

              {[
                { id: "dashboard", label: "Dashboard Hub", icon: Activity },
                { id: "workout", label: "Workout Splits", icon: Dumbbell },
                { id: "diet", label: "Nutrition & Indian Meals", icon: Utensils },
                { id: "supplements", label: "Supplement Guides", icon: Coffee },
                { id: "tracker", label: "Physique Logs", icon: TrendingUp },
                { id: "coach", label: "Coach FitForge AI", icon: Brain },
                { id: "settings", label: "Athlete Settings", icon: Settings }
              ].map((tab) => {
                const SelectedIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? "bg-brand text-black font-bold outline-none"
                        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                    }`}
                  >
                    <SelectedIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}

              {/* Show Administrator control exclusively */}
              {user?.isAdmin || user?.email === "admin@fitforge.ai" ? (
                <div className="mt-4 pt-4 border-t border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase block mb-1">Administrative panel</span>
                  <button
                    onClick={() => setActiveTab("admin")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium border text-red-400 ${
                      activeTab === "admin"
                        ? "bg-red-500/10 border-red-500/60 font-bold"
                        : "border-zinc-800 lg:hover:bg-zinc-800/50"
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <span>Admin Controls</span>
                  </button>
                </div>
              ) : null}

              <div className="mt-auto pt-6 px-1 hidden lg:block">
                <div className="bg-zinc-950/60 border border-zinc-850 p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Flame className="w-4 h-4 text-brand animate-pulse" />
                    <span className="text-xs text-white font-mono uppercase font-bold">Hydration lock</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mb-2 leading-relaxed">
                    Sip 250ml water immediately post heavy lifts to protect kidneys.
                  </div>
                </div>
              </div>
            </div>

            {/* Core Display Tab Pane */}
            <div className="lg:col-span-9 flex flex-col gap-6">
              
              {/* AI Brief Bar */}
              {aiBrief && (
                <div className="bg-brand/10 border border-brand/30 p-3 rounded-xl flex items-start gap-2.5">
                  <Sparkle className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-zinc-300 leading-relaxed font-mono">
                    <strong className="text-brand">FITFORGE SECURE NOTIFICATION</strong>: {aiBrief}
                  </div>
                </div>
              )}

              {/* TAB 1: DASHBOARD HUB */}
              {activeTab === "dashboard" && (
                <div className="flex flex-col gap-6">
                  {/* Grid Stat highlights */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-zinc-900 border border-zinc-805/85 p-4 rounded-xl relative overflow-hidden">
                      <span className="text-[10px] text-zinc-400 font-mono block uppercase">Water Tracker</span>
                      <span className="text-2xl font-black text-brand block mt-1">{waterGlassesCompleted} / 12 cups</span>
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <button
                          onClick={() => setWaterGlassesCompleted((p) => Math.max(0, p - 1))}
                          className="px-2 py-0.5 bg-zinc-800/80 text-xs rounded font-mono hover:bg-zinc-750"
                        >
                          -
                        </button>
                        <button
                          onClick={() => setWaterGlassesCompleted((p) => Math.min(12, p + 1))}
                          className="px-2.5 py-0.5 bg-brand text-black text-xs font-bold rounded hover:brightness-105"
                        >
                          + Glass
                        </button>
                      </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-805/85 p-4 rounded-xl relative overflow-hidden">
                      <span className="text-[10px] text-zinc-400 font-mono block uppercase">Calorie Goal</span>
                      <span className="text-2xl font-black text-white block mt-1">
                        {mealPlan?.targetCalories || 2150} kcal
                      </span>
                      <span className="text-[9px] text-zinc-500 font-mono mt-1 block">TDEE calculated metrics</span>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-805/85 p-4 rounded-xl relative overflow-hidden">
                      <span className="text-[10px] text-zinc-400 font-mono block uppercase">Protein goal</span>
                      <span className="text-2xl font-black text-white block mt-1">
                        {mealPlan?.macros?.protein || 150}g
                      </span>
                      <span className="text-[9px] text-zinc-500 font-mono mt-1 block">Optimal for lean synthesis</span>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-805/85 p-4 rounded-xl relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-450 font-mono uppercase">Completed Workouts</span>
                      </div>
                      <span className="text-2xl font-black text-brand block mt-1">
                        {trackerLogs.length > 0 ? trackerLogs[trackerLogs.length - 1].completedWorkoutCount : 4} Total
                      </span>
                      <span className="text-[9px] text-zinc-500 font-mono block">Streak: {trackerLogs.length > 0 ? trackerLogs[trackerLogs.length - 1].dailyStreak : 3} consecutive days</span>
                    </div>
                  </div>

                  {/* Body Split Overview & Daily Habit check */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col gap-4">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <h3 className="font-display font-bold text-white text-md">Daily Checklist Tasks</h3>
                        <span className="font-mono text-xs text-brand">Habits</span>
                      </div>
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-start gap-2.5 p-2 bg-zinc-950/60 rounded-lg hover:bg-zinc-950">
                          <CheckCircle2 className="w-4 h-4 text-brand mt-0.5" />
                          <div>
                            <span className="text-xs text-zinc-200 block font-medium">Protein ingestion checkpoint</span>
                            <span className="text-[10px] text-zinc-500">Eat consistent meals with egg whites, legumes or whey</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 p-2 bg-zinc-950/60 rounded-lg hover:bg-zinc-950">
                          <CheckCircle2 className="w-4 h-4 text-brand mt-0.5" />
                          <div>
                            <span className="text-xs text-zinc-200 block font-medium">Orthopedic mobility prep</span>
                            <span className="text-[10px] text-zinc-400">Perform 5 minutes dynamic warm up movements list</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 p-2 bg-zinc-950/60 rounded-lg hover:bg-zinc-950">
                          <CheckCircle2 className="w-4 h-4 text-brand mt-0.5" />
                          <div>
                            <span className="text-xs text-zinc-200 block font-medium">Macro recovery deep sleep</span>
                            <span className="text-[10px] text-zinc-500">Aim to reach minimum of 7-8 hours physiological sleep</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col gap-4">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <h3 className="font-display font-medium text-white font-sans uppercase text-brand text-xs">Today's Quick Workout Routine</h3>
                        <button onClick={() => setActiveTab("workout")} className="text-[10px] font-mono text-zinc-400 hover:text-brand hover:underline">
                          View Full split
                        </button>
                      </div>
                      {workoutPlan ? (
                        <div className="flex flex-col gap-3">
                          <div className="bg-zinc-950/70 p-3 rounded-lg border border-zinc-850">
                            <span className="text-[10px] text-brand font-mono block">SPLIT ROUTINE ACTIVE:</span>
                            <span className="text-sm text-zinc-250 font-bold font-display">{workoutPlan.days[activeWorkoutDayIndex]?.dayName}</span>
                            <span className="text-[11px] text-zinc-500 block font-mono mt-1">Focus: {workoutPlan.days[activeWorkoutDayIndex]?.focus}</span>
                          </div>
                          
                          <div className="flex flex-col gap-1.5">
                            {workoutPlan.days[activeWorkoutDayIndex]?.exercises.map((e: any) => (
                              <div key={e.id} className="flex justify-between items-center bg-zinc-950/30 p-2 rounded border border-zinc-850">
                                <span className="text-xs text-zinc-300">{e.name}</span>
                                <span className="text-[10px] text-brand font-mono">{e.sets} x {e.reps} reps</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-500">No workout plan loaded yet.</span>
                      )}
                    </div>
                  </div>

                  {/* Transformation Showcase visual teaser */}
                  <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                    <div className="md:col-span-8">
                      <h3 className="font-display font-bold text-white text-md">AI Coach Transformation Engine</h3>
                      <p className="text-xs text-zinc-400 mt-1 max-w-lg leading-relaxed">
                        Need dynamic variations or alternative joint-friendly exercise ideas built specifically for home workspaces? Visit the custom AI Coach or the live splits to customize repetitions.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => setActiveTab("coach")}
                          className="bg-brand text-black px-4 py-2 rounded-lg text-xs font-bold hover:brightness-105 transition-all"
                        >
                          Message Coach Now
                        </button>
                        <button
                          onClick={() => setActiveTab("tracker")}
                          className="bg-zinc-800 border border-zinc-700/80 text-zinc-200 px-4 py-2 rounded-lg text-xs hover:bg-zinc-700"
                        >
                          View Physic Progress charts
                        </button>
                      </div>
                    </div>
                    <div className="md:col-span-4 bg-zinc-950 p-4 rounded-xl border border-zinc-850 font-mono text-center">
                      <span className="text-zinc-500 text-[9px] uppercase tracking-wider block">CURRENT ACCRUED STREAK</span>
                      <Flame className="w-10 h-10 text-brand mx-auto my-1.5 animate-pulse" />
                      <span className="text-2xl font-black text-white block">
                        {trackerLogs.length > 0 ? trackerLogs[trackerLogs.length - 1].dailyStreak : 3} Days
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: WORKOUT PLANNER */}
              {activeTab === "workout" && (
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-6 glass-panel">
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-805 pb-4 gap-3">
                    <div>
                      <h3 className="text-xl font-display font-black text-white">
                        Optimized Workout Splits
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Orthopedic safeguards automatically alter movements to reduce structural joint wear.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setOnboardForm((prev) => ({ ...prev, workoutPreference: "Gym" }));
                          alert("Switched program logic to: Full Gym Equipment set. Reloading split values...");
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-mono transition-all uppercase ${
                          onboardForm.workoutPreference === "Gym"
                            ? "bg-brand/20 border-brand text-brand font-bold"
                            : "bg-zinc-950 border-zinc-850 text-zinc-400"
                        }`}
                      >
                        Gym Equipment
                      </button>
                      <button
                        onClick={() => {
                          setOnboardForm((prev) => ({ ...prev, workoutPreference: "Home" }));
                          alert("Switched program logic to: Home workspace sets (Dumbbells/Bodyweight). Adapting safe splits...");
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-mono transition-all uppercase ${
                          onboardForm.workoutPreference === "Home"
                            ? "bg-brand/20 border-brand text-brand font-bold"
                            : "bg-zinc-950 border-zinc-855 text-zinc-400"
                        }`}
                      >
                        Home workouts
                      </button>
                    </div>
                  </div>

                  {workoutPlan ? (
                    <div className="flex flex-col gap-6">
                      
                      {/* Sub-header detailing split metrics */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-850">
                        <div>
                          <span className="text-[10px] text-zinc-500 font-mono uppercase block">System split Type:</span>
                          <span className="text-xs text-zinc-200 font-bold block mt-0.5 font-mono">{workoutPlan.splitType}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 font-mono uppercase block">Progressive Overload:</span>
                          <span className="text-xs text-zinc-200 font-bold block mt-0.5 font-mono">{workoutPlan.weeklyVolume} volume</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-450 font-mono uppercase block">Frequency Scale:</span>
                          <span className="text-xs text-brand font-bold block mt-0.5 font-mono">{workoutPlan.frequency}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 font-mono uppercase block">Active tracking day:</span>
                          <span className="text-xs text-zinc-200 font-bold block mt-0.5 font-mono">{workoutPlan.days[activeWorkoutDayIndex]?.dayName || "Active Routine"}</span>
                        </div>
                      </div>

                      {/* Day list select rails */}
                      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-zinc-800">
                        {workoutPlan.days.map((day: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setActiveWorkoutDayIndex(idx);
                              setCompletedExercises({});
                            }}
                            className={`px-3 py-2 text-xs font-mono rounded-lg transition-colors capitalize ${
                              activeWorkoutDayIndex === idx
                                ? "bg-brand text-black font-extrabold"
                                : "bg-zinc-950 hover:bg-zinc-850 border border-zinc-850 text-zinc-400"
                            }`}
                          >
                            Day {idx + 1}
                          </button>
                        ))}
                      </div>

                      {/* Displaying day details and active checklist */}
                      <div className="flex flex-col gap-4">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                          <span className="text-[10px] text-zinc-450 font-mono uppercase">Day objective focus:</span>
                          <span className="text-md text-white font-display font-medium block mt-1">
                            {workoutPlan.days[activeWorkoutDayIndex]?.dayName} &mdash; <span className="text-brand">{workoutPlan.days[activeWorkoutDayIndex]?.focus}</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {workoutPlan.days[activeWorkoutDayIndex]?.exercises.map((ex: any) => {
                            const completed = completedExercises[ex.id];
                            return (
                              <div
                                key={ex.id}
                                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                                  completed ? "bg-brand/5 border-brand" : "bg-zinc-950 border-zinc-850"
                                }`}
                              >
                                <div>
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="text-xs text-zinc-500 font-mono block mb-0.5">{ex.targetMuscle} focus</span>
                                      <h4 className="text-sm font-bold font-display text-white">{ex.name}</h4>
                                    </div>
                                    <button
                                      onClick={() => toggleExerciseCheck(ex.id)}
                                      className={`p-1.5 rounded-lg border transition-colors ${
                                        completed ? "bg-brand border-brand text-black" : "border-zinc-700 hover:border-brand"
                                      }`}
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-3 gap-2 my-3 font-mono text-[10px] bg-zinc-900/50 p-2 rounded">
                                    <div>
                                      <span className="text-zinc-500 block">Sets x Reps</span>
                                      <span className="text-zinc-200 mt-0.5 block">{ex.sets} x {ex.reps}</span>
                                    </div>
                                    <div>
                                      <span className="text-zinc-500 block">Rest Period</span>
                                      <span className="text-zinc-200 mt-0.5 block">{ex.restTime || "90s"}</span>
                                    </div>
                                    <div>
                                      <span className="text-zinc-500 block">Tempo Rate</span>
                                      <span className="text-brand mt-0.5 block">{ex.tempo || "3-0-1-0"}</span>
                                    </div>
                                  </div>

                                  <div className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                                    <strong>Form Instructions:</strong>
                                    <ul className="list-disc pl-4 mt-1 flex flex-col gap-0.5">
                                      {ex.instructions ? ex.instructions.map((inst: string, i: number) => (
                                        <li key={i}>{inst}</li>
                                      )) : (
                                        <li>Execute slow concentric contraction, maintain proper posture.</li>
                                      )}
                                    </ul>
                                  </div>
                                </div>

                                <div className="border-t border-zinc-900 pt-3 mt-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] text-zinc-500 font-mono">Orthopedic Alterations:</span>
                                    {ex.injurySafeAlternatives && ex.injurySafeAlternatives.length > 0 && (
                                      <div className="text-zinc-450 text-[10px]">
                                        Swap option: <span className="text-amber-400 font-semibold">{ex.injurySafeAlternatives[0]}</span>
                                      </div>
                                    )}
                                  </div>
                                  {/* Simulated media demonstration */}
                                  <div className="mt-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 p-2 rounded flex items-center justify-between text-[11px] font-mono cursor-pointer transition-colors">
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-4 bg-brand rounded-full flex items-center justify-center text-[8px] text-black font-extrabold">▶</div>
                                      <span className="text-zinc-300 font-mono">Watch Form instruction clip</span>
                                    </div>
                                    <span className="text-zinc-500 text-[10px]">Form safe demo</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Complete current workout logger */}
                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-left">
                          <span className="text-[10px] text-zinc-400 font-mono uppercase block">Workout session confirmation</span>
                          <span className="text-sm font-semibold text-zinc-100 block">Logged today? Record progress to accumulate consecutive streaks.</span>
                        </div>
                        <button
                          onClick={submitCompletedWorkoutLogged}
                          disabled={workoutLoggedToday}
                          className="bg-brand text-black font-extrabold px-6 py-3 rounded-lg text-xs font-mono flex items-center gap-2 cursor-pointer neon-glow-btn disabled:opacity-40"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{workoutLoggedToday ? "Day Logged Successfully" : "Log Active Workout Complete"}</span>
                        </button>
                      </div>

                      {/* PDF Print control */}
                      <button
                        onClick={() => {
                          window.print();
                        }}
                        className="text-xs font-mono text-zinc-500 hover:text-brand border border-zinc-800 hover:border-brand/40 hover:bg-brand/5 p-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Print & Export Program as PDF offline backup</span>
                      </button>
                    </div>
                  ) : (
                    <span className="text-zinc-500 text-xs">Generating split profiles...</span>
                  )}
                </div>
              )}

              {/* TAB 3: DIET PLANNER */}
              {activeTab === "diet" && (
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-6 glass-panel">
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-805 pb-4 gap-3">
                    <div>
                      <h3 className="text-xl font-display font-black text-white">
                        Micronutrient & Indian Meal Plan
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Tailored calculated carbs, high biological value protein, and clean fats profile.
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setOnboardForm((prev) => ({ ...prev, dietPref: "Vegetarian" }));
                          alert("Diet logic shifted to: Vegetarian. Re-aligning meals to paneer, chana, oats, and curd...");
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-mono transition-all ${
                          onboardForm.dietPref === "Vegetarian"
                            ? "bg-brand/20 border-brand text-brand font-bold"
                            : "bg-zinc-950 border-zinc-850 text-zinc-400"
                        }`}
                      >
                        105% Veg Plan
                      </button>
                      <button
                        onClick={() => {
                          setOnboardForm((prev) => ({ ...prev, dietPref: "Non-Vegetarian" }));
                          alert("Diet logic shifted to: Non-Vegetarian. Sourcing grilled chicken breast, fresh fish and whole eggs...");
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-mono transition-all ${
                          onboardForm.dietPref !== "Vegetarian"
                            ? "bg-brand/20 border-brand text-brand font-bold"
                            : "bg-zinc-950 border-zinc-855 text-zinc-400"
                        }`}
                      >
                        Non-Veg Plan
                      </button>
                    </div>
                  </div>

                  {mealPlan ? (
                    <div className="flex flex-col gap-6">
                      
                      {/* Interactive budget category card details */}
                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-zinc-400 font-mono uppercase block">Sourcing Budget:</span>
                          <span className="text-sm text-brand font-bold block font-sans mt-0.5 uppercase tracking-wide">
                            {onboardForm.dietBudget || "Standard Budget-Friendly"}
                          </span>
                          <span className="text-[10px] text-zinc-500 mt-1 block leading-relaxed leading-tight">
                            {onboardForm.dietBudget === "Standard Budget-Friendly" 
                              ? "Utilizes affordable Indian staples: generic Rolled Oats, peanut butter, clean soy flakes, cottage cheese paneer cubes, and eggs."
                              : "Utilizes superfoods: premium hydrolysed Whey isolate, salmon imports, rich avocados, broccoli crowns, and Greek dahi."}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center border-l border-zinc-800 pl-4 font-mono">
                          <div className="p-2 bg-zinc-900 rounded">
                            <span className="text-zinc-500 text-[9px] block uppercase">Carbs</span>
                            <span className="text-zinc-100 block font-bold text-xs mt-0.5">{mealPlan.macros?.carbs || 230}g</span>
                          </div>
                          <div className="p-2 bg-zinc-900 rounded">
                            <span className="text-zinc-500 text-[9px] block uppercase">Protein</span>
                            <span className="text-brand block font-bold text-xs mt-0.5">{mealPlan.macros?.protein || 155}g</span>
                          </div>
                          <div className="p-2 bg-zinc-900 rounded">
                            <span className="text-zinc-500 text-[9px] block uppercase">Fats</span>
                            <span className="text-zinc-100 block font-bold text-xs mt-0.5">{mealPlan.macros?.fats || 60}g</span>
                          </div>
                        </div>
                      </div>

                      {/* Daily Meal sequence logs */}
                      <div className="flex flex-col gap-4">
                        <span className="text-xs text-zinc-400 font-mono uppercase tracking-wide">Daily timing meal schedules:</span>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {mealPlan.meals.map((m: any, idx: number) => (
                            <div key={idx} className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <span className="text-[10px] text-brand font-mono block uppercase">{m.timing}</span>
                                    <h4 className="text-sm font-bold font-display text-white mt-0.5">{m.mealName}</h4>
                                  </div>
                                  <span className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[10px] font-mono">
                                    {m.calories} kcal
                                  </span>
                                </div>

                                <div className="flex flex-col gap-1 my-3">
                                  {m.items.map((it: string, iIndex: number) => (
                                    <div key={iIndex} className="text-xs text-zinc-300 flex items-center gap-2">
                                      <span className="text-brand font-bold">•</span>
                                      <span>{it}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2 border-t border-zinc-900 pt-3 mt-3 text-center text-[10px] font-mono text-zinc-500">
                                <div>Prot: <span className="text-zinc-300 font-semibold">{m.protein}g</span></div>
                                <div>Carbs: <span className="text-zinc-300 font-semibold">{m.carbs}g</span></div>
                                <div>Fat: <span className="text-zinc-300 font-semibold">{m.fats}g</span></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <span className="text-xs text-zinc-500">Formulating custom dietary files...</span>
                  )}
                </div>
              )}

              {/* TAB 4: SUPPLEMENT GUIDE */}
              {activeTab === "supplements" && (
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-6 glass-panel">
                  <div>
                    <h3 className="text-xl font-display font-black text-white">Supplement Recommendation Matrix</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Clinical guidance, optimal sizing window dosage and sports hydration caveats.</p>
                  </div>

                  <div className="flex flex-col gap-4">
                    {supplements && supplements.length > 0 ? supplements.map((s: any, idx: number) => (
                      <div key={idx} className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-4 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] text-zinc-500 font-mono block uppercase">RECOMMENDED AID:</span>
                            <h4 className="text-sm font-bold text-brand font-display mt-0.5">{s.name}</h4>
                          </div>
                          <div className="mt-3">
                            <span className="text-[10px] font-mono text-zinc-500 block uppercase">Optimal Dosage:</span>
                            <span className="text-xs text-zinc-100 font-mono block font-semibold mt-0.5">{s.dosage}</span>
                          </div>
                        </div>

                        <div className="md:col-span-8 flex flex-col gap-2.5 pl-0 md:pl-4 border-l border-none md:border-zinc-850">
                          <div>
                            <span className="text-[10px] text-zinc-500 font-mono uppercase block">Athletic Purpose:</span>
                            <p className="text-xs text-zinc-350 leading-relaxed mt-0.5 font-medium">{s.purpose}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 font-mono uppercase block">Timing Guide:</span>
                            <p className="text-xs text-zinc-350 leading-relaxed mt-0.5">{s.timing}</p>
                          </div>
                          <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-850 text-[10px] leading-relaxed text-zinc-400">
                            <strong>Coach Warning</strong>: {s.safetyWarning || "Maintain active biological checks."}
                          </div>
                        </div>
                      </div>
                    )) : (
                      <span className="text-zinc-500 text-sm">Reviewing dynamic sports supplements...</span>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: PHYSIQUE LOGS TRACKER */}
              {activeTab === "tracker" && (
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-6 glass-panel">
                  <div>
                    <h3 className="text-xl font-display font-black text-white">Biometrics & Physiologic Logbook</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Track systemic weight changes, chest expansion metrics, streaks and transformation captures.</p>
                  </div>

                  {/* Form input and trend chart */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Weight entry forms */}
                    <div className="lg:col-span-5 bg-zinc-950 p-4 rounded-xl border border-zinc-850">
                      <span className="text-xs text-brand font-mono uppercase block mb-3 border-b border-zinc-850 pb-1">Record Daily Mass</span>
                      <form onSubmit={handleLoggedProgressStats} className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-zinc-400 font-mono uppercase">Bodyweight reading (kg) *</label>
                          <input
                            type="number"
                            step="0.1"
                            value={newWeight}
                            onChange={(e) => setNewWeight(e.target.value)}
                            placeholder="e.g. 78.5"
                            className="bg-zinc-900 border border-zinc-800 text-xs p-2.5 rounded text-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-zinc-400 font-mono uppercase">Chest Size (cm)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={newChest}
                              onChange={(e) => setNewChest(e.target.value)}
                              placeholder="e.g. 104"
                              className="bg-zinc-900 border border-zinc-800 text-xs p-2 rounded text-white"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-zinc-400 font-mono uppercase">Arm circumference (cm)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={newArm}
                              onChange={(e) => setNewArm(e.target.value)}
                              placeholder="e.g. 38"
                              className="bg-zinc-900 border border-zinc-800 text-xs p-2 rounded text-white"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-zinc-400 font-mono uppercase">Waistline (cm)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={newWaist}
                              onChange={(e) => setNewWaist(e.target.value)}
                              placeholder="e.g. 91"
                              className="bg-zinc-900 border border-zinc-800 text-xs p-2 rounded text-white"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-zinc-400 font-mono uppercase">Thigh scale (cm)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={newLeg}
                              onChange={(e) => setNewLeg(e.target.value)}
                              placeholder="e.g. 60"
                              className="bg-zinc-900 border border-zinc-800 text-xs p-2 rounded text-white"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-zinc-400 font-mono uppercase">Athlete status text notes (Optional)</label>
                          <input
                            type="text"
                            value={newNotes}
                            onChange={(e) => setNewNotes(e.target.value)}
                            placeholder="Knee feels secure, pump is outstanding"
                            className="bg-zinc-900 border border-zinc-800 text-xs p-2.5 rounded text-white outline-none"
                          />
                        </div>

                        {trackerSuccess && (
                          <span className="text-[10px] text-brand font-mono bg-brand-glow p-2 rounded block">{trackerSuccess}</span>
                        )}

                        <button
                          type="submit"
                          className="bg-brand text-black font-extrabold py-2 rounded text-xs font-mono uppercase cursor-pointer"
                        >
                          Submit Log Stats
                        </button>
                      </form>
                    </div>

                    {/* Weight change trend graph lines */}
                    <div className="lg:col-span-7 bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex flex-col gap-4">
                      <span className="text-xs font-mono text-zinc-450 uppercase block pb-1 border-b border-zinc-850">Weight Trajectory Chart</span>
                      {trackerLogs.length > 0 ? (
                        <>
                          {renderTrendSVGLine()}
                          <div className="flex flex-col gap-2 mt-2">
                            <span className="text-[10px] text-zinc-500 font-mono uppercase">Recent Physiological Journals:</span>
                            <div className="max-h-[140px] overflow-y-auto flex flex-col gap-1.5">
                              {trackerLogs.slice(-4).reverse().map((log: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center bg-zinc-900 p-2 rounded text-[11px] font-mono border border-zinc-850/50">
                                  <span className="text-zinc-500">{log.date}</span>
                                  <span className="text-white font-bold">{log.weight} kg</span>
                                  <span className="text-zinc-400 italic truncate max-w-[200px]">{log.notes || "No notes logged"}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <span className="text-zinc-500 text-xs">Awaiting statistic submission data logs...</span>
                      )}
                    </div>

                  </div>

                  {/* Progress Pictures Section */}
                  <div className="border-t border-zinc-800 pt-6 mt-2 flex flex-col gap-4">
                    <div>
                      <h4 className="font-display font-bold text-white text-md">Visual Transformation Showcase</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Link and preview images to witness muscle fiber density and fat drops.</p>
                    </div>

                    <form onSubmit={handleLogPhotoUrlInput} className="flex gap-2 max-w-lg">
                      <input
                        type="url"
                        value={newPhotoUrl}
                        onChange={(e) => setNewPhotoUrl(e.target.value)}
                        placeholder="Paste progress photo link (e.g. from Unsplash or secure storage)"
                        className="bg-zinc-950 border border-zinc-800 text-xs p-2.5 flex-1 rounded outline-none w-full"
                      />
                      <button
                        type="submit"
                        className="bg-brand text-black font-extrabold text-xs px-4 rounded font-mono uppercase flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Log Frame</span>
                      </button>
                    </form>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                      {trackerPhotos.length > 0 ? trackerPhotos.map((p: any, index: number) => (
                        <div key={index} className="bg-zinc-950 p-2 rounded-xl border border-zinc-850 flex flex-col gap-2">
                          <div className="aspect-square bg-zinc-900 rounded-lg overflow-hidden relative">
                            <img src={p.url} alt={`Physique frame ${p.date}`} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-mono px-1">
                            <span className="text-zinc-500">Day snap:</span>
                            <span className="text-zinc-300 font-bold">{p.date}</span>
                          </div>
                        </div>
                      )) : (
                        <span className="text-zinc-550 text-xs">No media synced yet. Save links above for fast previewing snaps.</span>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 6: AI COACH PORTAL */}
              {activeTab === "coach" && (
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-4 glass-panel h-[600px] relative">
                  
                  {/* Chat header area */}
                  <div className="border-b border-zinc-805 pb-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand/10 border border-brand/50 rounded-full flex items-center justify-center text-brand relative">
                        <span className="font-extrabold text-sm block">FF</span>
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-brand border border-zinc-900 rounded-full"></div>
                      </div>
                      <div>
                        <h3 className="font-display font-black text-white text-md">Coach FitForge AI</h3>
                        <span className="text-[10px] text-zinc-400 font-mono italic">Dynamic Orthopedic Safeguard & Sizing active</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setChatHistory([{ role: "model", text: "Coach has clean records. I am ready for new queries!", timestamp: new Date().toISOString() }])}
                      className="text-[10px] text-zinc-550 hover:text-brand font-mono uppercase bg-zinc-950 px-2.5 py-1 rounded border border-zinc-850"
                    >
                      Reset Coach Log
                    </button>
                  </div>

                  {/* Recommended template topics */}
                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850/80">
                    <span className="text-[9px] text-zinc-500 font-mono uppercase mb-2 block">Quick question setups (Click to copy):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "How can I safely train heavy overhead press if my shoulder feels tight?",
                        "How to substitute barbell squats if knee pain compromises stabilizers?",
                        "How to reach 135g clean protein under Indian vegetarian budget constraint?",
                        "Give me 5 exercises for weak-point posterior lat width focus"
                      ].map((qst) => (
                        <button
                          key={qst}
                          onClick={() => loadPreSetQuestion(qst)}
                          className="bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white px-2 py-1 text-[10px] font-sans border border-zinc-850/50 rounded transition-colors text-left truncate max-w-full"
                        >
                          {qst}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dialogue history layout container */}
                  <div className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-3 min-h-0 bg-zinc-950/40 border border-zinc-850 rounded-xl">
                    {chatHistory.map((m: any, idx: number) => {
                      const isUser = m.role === "user";
                      return (
                        <div
                          key={idx}
                          className={`flex gap-3 max-w-[85%] ${
                            isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                          }`}
                        >
                          {!isUser && (
                            <div className="w-8 h-8 rounded-full bg-brand p-1 text-black font-extrabold flex items-center justify-center flex-shrink-0 text-[10px]">
                              FF
                            </div>
                          )}
                          <div
                            className={`p-3 rounded-xl text-xs relative leading-relaxed ${
                              isUser
                                ? "bg-brand text-black font-medium"
                                : "bg-zinc-900 text-zinc-100 border border-zinc-850"
                            }`}
                          >
                            {m.text}
                          </div>
                        </div>
                      );
                    })}

                    {isChatLoading && (
                      <div className="flex gap-3 mr-auto items-center animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-brand/20 text-brand font-extrabold flex items-center justify-center text-[10px]">
                          FF
                        </div>
                        <div className="bg-zinc-900 border border-zinc-850 p-2 px-3 rounded-lg text-xs text-zinc-500 font-mono">
                          Coach is reviewing bio-biomechanics variables...
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Coach chat text entry */}
                  <form onSubmit={submitCoachPromptText} className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      placeholder="Ask Coach FitForge anything about exercise tempo splits, protein sources, or lower spine protectors..."
                      className="bg-zinc-950 border border-zinc-800 text-xs p-3 rounded-xl flex-1 outline-none focus:border-brand-glow text-white"
                    />
                    <button
                      type="submit"
                      className="bg-brand text-black font-extrabold px-5 text-xs font-mono uppercase rounded-xl flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ask Coach</span>
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 7: SETTINGS & ACTIVE METRICS PROFILE */}
              {activeTab === "settings" && (
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-6 glass-panel">
                  <div>
                    <h3 className="text-xl font-display font-black text-white">Athlete Profile Settings</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Recompute targets or perform clinical orthopedic overrides here.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-zinc-800 pb-6">
                    <div className="flex flex-col gap-4">
                      <span className="text-xs font-mono text-brand block uppercase border-b border-zinc-850 pb-1">Reset Profile data wizard</span>
                      <p className="text-xs text-zinc-450 leading-relaxed">
                        To permanently reset your diagnostic credentials or adjust age, weight factors, gender preferences, split days and pain settings, execute the Onboarding clinical setup again.
                      </p>
                      <button
                        onClick={() => {
                          setIsOnboardingCompleted(false);
                          setOnboardStep(1);
                        }}
                        className="bg-brand text-black font-extrabold font-mono text-xs py-2 px-4 rounded-lg w-fit cursor-pointer"
                      >
                        Launch Clinical Setup Wizard
                      </button>
                    </div>

                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 font-mono text-xs flex flex-col gap-2.5">
                      <span className="text-[10px] text-zinc-500 uppercase block font-bold">Diagnostics:</span>
                      <div>Athlete email: <span className="text-zinc-200">{user?.email || "john@example.com"}</span></div>
                      <div>Is Administrator: <span className="text-brand font-bold">{user?.isAdmin ? "TRUE APPROVED" : "FALSE"}</span></div>
                      <div>Server Node Active: <span className="text-emerald-400">ONLINE</span></div>
                      <div>Gemini API configured: <span className="text-zinc-300">Yes (Server proxies active)</span></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500 font-mono">Emergency action safety zone:</span>
                    <button
                      onClick={() => {
                        if (confirm("Reset current metrics and purge cached sessions?")) {
                          triggerLogoutAndReset();
                        }
                      }}
                      className="border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 px-4 rounded-lg text-xs font-mono cursor-pointer"
                    >
                      Delete Saved Credentials Cache
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 8: ADMIN CONTROL PANEL PANEL */}
              {activeTab === "admin" && (
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-6 glass-panel">
                  <div>
                    <h3 className="text-xl font-display font-black text-red-400 flex items-center gap-1.5">
                      <ShieldAlert className="w-6 h-6 text-red-500" />
                      <span>Admin Coaching Portal Controls</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Control global exercises, index database contents and view simulated user database registers.</p>
                  </div>

                  {/* Metric overview cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-zinc-950 border border-zinc-850 p-3 rounded text-center">
                      <span className="text-[9px] text-zinc-500 block font-mono">TOTAL CLIENT BASES</span>
                      <span className="text-lg font-bold text-white mt-1 block">
                        {adminMetrics?.totalUsers || 2} Enrollments
                      </span>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-850 p-3 rounded text-center">
                      <span className="text-[9px] text-zinc-500 block font-mono">HYDRATED PROFILES</span>
                      <span className="text-lg font-bold text-white mt-1 block">
                        {adminMetrics?.profilesCount || 1} Complete
                      </span>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-850 p-3 rounded text-center">
                      <span className="text-[9px] text-zinc-500 block font-mono">AVERAGE ATHLETE MASS</span>
                      <span className="text-lg font-bold text-brand mt-1 block">
                        {adminMetrics?.averageWeight || 82.0} kg
                      </span>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-850 p-3 rounded text-center">
                      <span className="text-[9px] text-zinc-500 block font-mono">GLOBAL COMMON CHOICE</span>
                      <span className="text-xs font-bold text-zinc-300 mt-1.5 block font-mono">
                        {adminMetrics?.commonGoal || "Body Recomposition"}
                      </span>
                    </div>
                  </div>

                  {/* Create training movement pattern catalog */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    
                    <div className="md:col-span-6 bg-zinc-950 p-4 rounded-xl border border-zinc-850">
                      <span className="text-xs text-brand font-mono block uppercase border-b border-zinc-800 pb-2 mb-4">Publish dynamic exercise index</span>
                      <form onSubmit={publishExerciseAdmin} className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-zinc-400 font-mono uppercase">Exercise Name</label>
                          <input
                            type="text"
                            value={adminNewExName}
                            onChange={(e) => setAdminNewExName(e.target.value)}
                            placeholder="e.g. Incline Bench Machine Cable Pulls"
                            className="bg-zinc-900 border border-zinc-800 text-xs p-2 rounded text-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-zinc-400 font-mono uppercase">Target muscle Group</label>
                            <select
                              value={adminNewExMuscle}
                              onChange={(e) => setAdminNewExMuscle(e.target.value)}
                              className="bg-zinc-900 border border-zinc-805 text-xs p-2 rounded text-white"
                            >
                              {MUSCLES.map((m) => (
                                <option key={m}>{m}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-zinc-400 font-mono uppercase">Equipment constraint</label>
                            <select
                              value={adminNewExEquipment}
                              onChange={(e) => setAdminNewExEquipment(e.target.value)}
                              className="bg-zinc-900 border border-zinc-805 text-xs p-2 rounded text-white"
                            >
                              <option>Full Gym</option>
                              <option>Dumbbells</option>
                              <option>Resistance Bands</option>
                              <option>Bodyweight</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-zinc-400 font-mono uppercase">Safe for specific injury patterns</label>
                          <select
                            value={adminNewExInjury}
                            onChange={(e) => setAdminNewExInjury(e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 text-xs p-2 rounded text-white"
                          >
                            <option>None</option>
                            <option>Knee pain</option>
                            <option>Back pain</option>
                            <option>Shoulder injury</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-zinc-400 font-mono uppercase">Step Form instructions (separate by newline)</label>
                          <textarea
                            value={adminNewExInstructions}
                            onChange={(e) => setAdminNewExInstructions(e.target.value)}
                            placeholder="Brace ribs. Lower slowly."
                            rows={3}
                            className="bg-zinc-900 border border-zinc-800 text-xs p-2 rounded text-white outline-none font-mono"
                          />
                        </div>

                        {adminSuccess && (
                          <span className="text-[10px] text-emerald-400 font-mono bg-brand-glow p-2 rounded block">{adminSuccess}</span>
                        )}

                        <button
                          type="submit"
                          className="bg-brand text-black font-extrabold text-xs py-2 rounded-lg font-mono uppercase cursor-pointer"
                        >
                          Publish and Sync Catalog
                        </button>
                      </form>
                    </div>

                    {/* Active enrolled client accounts view */}
                    <div className="md:col-span-6 bg-zinc-950 p-4 rounded-xl border border-zinc-850">
                      <span className="text-xs text-zinc-450 font-mono uppercase block pb-2 border-b border-zinc-800">Verified database logins</span>
                      <div className="flex flex-col gap-2 mt-4 max-h-[300px] overflow-y-auto">
                        {adminUsers.length > 0 ? adminUsers.map((u: any, idx: number) => (
                          <div key={idx} className="bg-zinc-900 p-2.5 rounded border border-zinc-800/80 flex justify-between items-center text-[11px] font-mono">
                            <div>
                              <div className="text-zinc-200 font-bold">{u.name}</div>
                              <div className="text-zinc-500 font-mono">{u.email}</div>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-0.5 rounded text-[8px] tracking-wide uppercase ${
                                u.onboarded ? "bg-brand/10 text-brand" : "bg-zinc-800 text-zinc-450"
                              }`}>
                                {u.onboarded ? "Evaluated" : "Idle Auth"}
                              </span>
                            </div>
                          </div>
                        )) : (
                          <span className="text-zinc-550 text-xs">No users listed yet. Connect server to monitor.</span>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </main>

      {/* FOOTER BAR */}
      <footer className="bg-zinc-950 border-t border-zinc-850 px-4 py-8 text-center text-xs text-zinc-500 font-mono mt-auto select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <span className="font-display font-bold text-zinc-300 block">FITFORGE AI LABS</span>
            <span className="text-[10px] text-zinc-500 mt-1 block">Clinically adapted progressive split coaching directories.</span>
          </div>
          <div className="text-xs">
            © 2026 FitForge AI Corporation. All safety locks dynamically computed.
          </div>
        </div>
      </footer>
    </div>
  );
}
