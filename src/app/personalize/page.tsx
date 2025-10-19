"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useSession } from "@/lib/auth-client";

// Question types
type Question = {
  id: number;
  title: string;
  subtitle?: string;
  type: "multi-select" | "single-select";
  options: Array<{ emoji: string; label: string; value: string }>;
  field: string;
};

// All 8 questions
const questions: Question[] = [
  {
    id: 1,
    title: "What's most important to you?",
    subtitle: "This helps us understand what you're aiming for.",
    type: "multi-select",
    field: "user_goal",
    options: [
      { emoji: "💤", label: "Better Sleep", value: "better_sleep" },
      { emoji: "🔥", label: "Build Muscle", value: "build_muscle" },
      { emoji: "🏃", label: "Fat Loss", value: "fat_loss" },
      { emoji: "⚡", label: "More Energy", value: "more_energy" },
      { emoji: "❤️", label: "Improve Gut Health", value: "gut_health" },
      { emoji: "🧘", label: "Balanced Diet", value: "balanced_diet" },
    ],
  },
  {
    id: 2,
    title: "Do you have any allergies or dietary restrictions?",
    subtitle: "Select all that apply.",
    type: "multi-select",
    field: "user_allergies",
    options: [
      { emoji: "🥛", label: "Dairy", value: "dairy" },
      { emoji: "🥜", label: "Nuts", value: "nuts" },
      { emoji: "🌾", label: "Gluten", value: "gluten" },
      { emoji: "🍳", label: "Eggs", value: "eggs" },
      { emoji: "🍤", label: "Shellfish", value: "shellfish" },
      { emoji: "🧀", label: "Soy", value: "soy" },
      { emoji: "🚫", label: "None", value: "none" },
    ],
  },
  {
    id: 3,
    title: "Which cuisines do you love?",
    subtitle: "We'll make sure your meals match your taste.",
    type: "multi-select",
    field: "preferred_cuisines",
    options: [
      { emoji: "🍝", label: "Italian", value: "italian" },
      { emoji: "🍛", label: "Indian", value: "indian" },
      { emoji: "🍣", label: "Japanese", value: "japanese" },
      { emoji: "🥡", label: "Chinese", value: "chinese" },
      { emoji: "🌮", label: "Mexican", value: "mexican" },
      { emoji: "🥗", label: "Mediterranean", value: "mediterranean" },
      { emoji: "🍔", label: "American", value: "american" },
      { emoji: "🌍", label: "Fusion", value: "fusion" },
    ],
  },
  {
    id: 4,
    title: "How do you prefer to prepare your meals?",
    type: "single-select",
    field: "prep_style",
    options: [
      { emoji: "👨‍🍳", label: "From Scratch", value: "from_scratch" },
      { emoji: "🕒", label: "Quick & Simple", value: "quick_simple" },
      { emoji: "🥣", label: "Mix of Both", value: "mix_both" },
      { emoji: "🚫", label: "Ready-to-Eat Only", value: "ready_to_eat" },
    ],
  },
  {
    id: 5,
    title: "What kitchen equipment do you usually have access to?",
    type: "multi-select",
    field: "equipment",
    options: [
      { emoji: "🔪", label: "Stove", value: "stove" },
      { emoji: "🧑‍🍳", label: "Oven", value: "oven" },
      { emoji: "🧊", label: "Refrigerator", value: "refrigerator" },
      { emoji: "🍳", label: "Air Fryer", value: "air_fryer" },
      { emoji: "🥤", label: "Blender", value: "blender" },
      { emoji: "🍲", label: "Microwave", value: "microwave" },
    ],
  },
  {
    id: 6,
    title: "How many meals do you want us to plan per day?",
    type: "single-select",
    field: "meals_per_day",
    options: [
      { emoji: "🍽️", label: "3 Meals", value: "3" },
      { emoji: "🍴", label: "4 Meals", value: "4" },
      { emoji: "🥗", label: "5+ Meals", value: "5" },
    ],
  },
  {
    id: 7,
    title: "Do you follow any specific diet?",
    type: "single-select",
    field: "diet_type",
    options: [
      { emoji: "🥦", label: "Vegetarian", value: "vegetarian" },
      { emoji: "🥩", label: "Non-Veg", value: "non_veg" },
      { emoji: "🐟", label: "Pescatarian", value: "pescatarian" },
      { emoji: "🌱", label: "Vegan", value: "vegan" },
      { emoji: "⚖️", label: "No Preference", value: "no_preference" },
    ],
  },
  {
    id: 8,
    title: "How active are you daily?",
    type: "single-select",
    field: "activity_level",
    options: [
      { emoji: "🧘", label: "Sedentary", value: "sedentary" },
      { emoji: "🚶", label: "Lightly Active", value: "lightly_active" },
      { emoji: "🏋️", label: "Moderately Active", value: "moderately_active" },
      { emoji: "🏃‍♂️", label: "Very Active", value: "very_active" },
    ],
  },
];

export default function PersonalizePage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [direction, setDirection] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  // Initialize userId - either from session or generate temporary ID
  useEffect(() => {
    if (!isPending) {
      if (session?.user?.id) {
        setUserId(session.user.id);
      } else {
        // Generate temporary session ID for unauthenticated users
        let tempId = localStorage.getItem("temp_user_id");
        if (!tempId) {
          tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem("temp_user_id", tempId);
        }
        setUserId(tempId);
      }
    }
  }, [session, isPending]);

  // Load existing preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!userId) return;

      try {
        const response = await fetch(`/api/preferences?userId=${userId}`);
        const data = await response.json();

        if (data.success && data.preferences) {
          // Map database fields to form state
          const loadedAnswers: Record<string, string | string[]> = {};
          
          if (data.preferences.userGoal) loadedAnswers.user_goal = data.preferences.userGoal;
          if (data.preferences.userAllergies) loadedAnswers.user_allergies = data.preferences.userAllergies;
          if (data.preferences.preferredCuisines) loadedAnswers.preferred_cuisines = data.preferences.preferredCuisines;
          if (data.preferences.prepStyle) loadedAnswers.prep_style = data.preferences.prepStyle;
          if (data.preferences.equipment) loadedAnswers.equipment = data.preferences.equipment;
          if (data.preferences.mealsPerDay) loadedAnswers.meals_per_day = data.preferences.mealsPerDay.toString();
          if (data.preferences.dietType) loadedAnswers.diet_type = data.preferences.dietType;
          if (data.preferences.activityLevel) loadedAnswers.activity_level = data.preferences.activityLevel;

          setAnswers(loadedAnswers);
        }
      } catch (error) {
        console.error("Failed to load preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [userId]);

  // Auto-save function
  const saveToBackend = async () => {
    if (!userId) return;

    try {
      // Convert form state to API format
      const preferences = {
        userId,
        timestamp: new Date().toISOString(),
        userGoal: answers.user_goal || null,
        userAllergies: answers.user_allergies || null,
        preferredCuisines: answers.preferred_cuisines || null,
        prepStyle: answers.prep_style || null,
        equipment: answers.equipment || null,
        mealsPerDay: answers.meals_per_day ? parseInt(answers.meals_per_day as string) : null,
        dietType: answers.diet_type || null,
        activityLevel: answers.activity_level || null,
      };

      await fetch("/api/preferences/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
    } catch (error) {
      console.error("Failed to save preferences:", error);
    }
  };

  // Handle option selection
  const handleSelect = (value: string) => {
    const field = currentQuestion.field;
    
    if (currentQuestion.type === "multi-select") {
      const current = (answers[field] as string[]) || [];
      
      if (value === "none") {
        setAnswers({ ...answers, [field]: ["none"] });
      } else {
        const filtered = current.filter((v) => v !== "none");
        
        if (filtered.includes(value)) {
          setAnswers({ ...answers, [field]: filtered.filter((v) => v !== value) });
        } else {
          setAnswers({ ...answers, [field]: [...filtered, value] });
        }
      }
    } else {
      setAnswers({ ...answers, [field]: value });
    }
  };

  // Check if option is selected
  const isSelected = (value: string) => {
    const field = currentQuestion.field;
    const answer = answers[field];
    
    if (Array.isArray(answer)) {
      return answer.includes(value);
    }
    return answer === value;
  };

  // Handle next button
  const handleNext = async () => {
    setIsSaving(true);
    await saveToBackend();
    setIsSaving(false);

    if (currentStep < questions.length - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    } else {
      router.push("/personalize/summary");
    }
  };

  // Handle back button
  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    } else {
      // On first question, redirect to home page
      router.push("/");
    }
  };

  // Handle skip button
  const handleSkip = () => {
    setDirection(1);
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push("/personalize/summary");
    }
  };

  // Check if current question has answer
  const hasAnswer = () => {
    const answer = answers[currentQuestion.field];
    if (Array.isArray(answer)) {
      return answer.length > 0;
    }
    return !!answer;
  };

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -1000 : 1000,
      opacity: 0,
    }),
  };

  if (isLoading || isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "rgb(255, 255, 255)" }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "rgb(255, 255, 255)" }}>
      {/* Left Side - Questions */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-16">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-3">
            <span
              style={{
                fontFamily: '"Right Grotesk Wide", sans-serif',
                fontSize: "14px",
                fontWeight: 500,
                color: "rgb(107, 114, 128)",
              }}
            >
              Step {currentStep + 1} of {questions.length}
            </span>
            <span
              style={{
                fontFamily: '"Right Grotesk Wide", sans-serif',
                fontSize: "14px",
                fontWeight: 500,
                color: "rgb(107, 114, 128)",
              }}
            >
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-black rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Question Title */}
              <div className="space-y-3">
                <h1
                  style={{
                    fontFamily: '"Right Grotesk Spatial", sans-serif',
                    fontSize: "48px",
                    fontWeight: 700,
                    lineHeight: "1.1",
                    color: "rgb(17, 24, 39)",
                  }}
                >
                  {currentQuestion.title}
                </h1>
                {currentQuestion.subtitle && (
                  <p
                    style={{
                      fontFamily: '"General Sans", sans-serif',
                      fontSize: "18px",
                      color: "rgb(107, 114, 128)",
                    }}
                  >
                    {currentQuestion.subtitle}
                  </p>
                )}
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      isSelected(option.value)
                        ? "border-black bg-black text-white"
                        : "border-gray-200 bg-white hover:border-gray-400"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{option.emoji}</span>
                      <span
                        style={{
                          fontFamily: '"Right Grotesk Wide", sans-serif',
                          fontSize: "16px",
                          fontWeight: 500,
                        }}
                      >
                        {option.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-8">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            style={{
              fontFamily: '"Right Grotesk Wide", sans-serif',
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSkip}
              className="px-6 py-3 rounded-xl text-gray-600 hover:text-black transition-colors"
              style={{
                fontFamily: '"Right Grotesk Wide", sans-serif',
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
              style={{
                fontFamily: '"Right Grotesk Wide", sans-serif',
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              {isSaving ? "Saving..." : currentStep === questions.length - 1 ? "Complete" : "Next"}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Background Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://scuziassests.s3.us-east-1.amazonaws.com/WelcomeStep.webp')",
          }}
        />
      </div>
    </div>
  );
}