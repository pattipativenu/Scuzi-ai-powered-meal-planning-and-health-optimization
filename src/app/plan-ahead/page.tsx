"use client";

import { MealCard } from "@/components/MealCard";
import { HealthInsightsLoader } from "@/components/HealthInsightsLoader";
import { useWhoopInsights } from "@/hooks/useWhoopInsights";
import { Calendar, Clock, Flame, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import type { Meal } from "@/types/meal";

interface GeneratedMeal {
  day: string;
  meal_type: string;
  name: string;
  description: string;
  ingredients: Array<{ name: string; amount: string }>;
  instructions: string[];
  prep_time: number;
  cook_time: number;
  servings: number;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  image: string;
}

export default function PlanAheadPage() {
  const [meals, setMeals] = useState<GeneratedMeal[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [error, setError] = useState("");
  const [expandedDays, setExpandedDays] = useState<string[]>(["Monday"]);
  const [mealProgress, setMealProgress] = useState(0);
  const [isStoring, setIsStoring] = useState(false);
  const { insights } = useWhoopInsights();

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const mealTypes = ["Breakfast", "Lunch", "Snack", "Dinner"];
  const MAX_MEALS = 28;

  // Load existing meal plan on mount
  useEffect(() => {
    loadExistingMealPlan();
  }, []);

  const loadExistingMealPlan = async () => {
    try {
      // First check localStorage for immediate access
      const cachedMeals = localStorage.getItem("currentMealPlan");
      if (cachedMeals) {
        const parsed = JSON.parse(cachedMeals);
        setMeals(parsed);
        return;
      }

      // Fall back to API
      const response = await fetch("/api/plan-ahead/retrieve");
      const data = await response.json();
      
      if (data.status === "success" && data.mealPlan?.meals) {
        setMeals(data.mealPlan.meals);
        // Cache to localStorage
        localStorage.setItem("currentMealPlan", JSON.stringify(data.mealPlan.meals));
      }
    } catch (error) {
      console.error("Error loading meal plan:", error);
    }
  };

  const handleGenerateMeals = async () => {
    setIsGenerating(true);
    setError("");
    setMealProgress(0);
    setGenerationStep("Loading meals from library...");

    try {
      // Step 1: Generate meals from library (already has images)
      setGenerationStep("Selecting optimal meals from your library...");
      setMealProgress(5);
      
      const generateResponse = await fetch("/api/plan-ahead/generate-from-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!generateResponse.ok) {
        throw new Error("Failed to generate meals from library");
      }

      const generateData = await generateResponse.json();
      
      if (generateData.status !== "success") {
        throw new Error(generateData.message || "Failed to generate meals");
      }

      // Simulate progress for better UX
      setMealProgress(15);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setGenerationStep("Optimizing meal variety and nutrition...");
      setMealProgress(20);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setMealProgress(MAX_MEALS);
      
      // Step 2: Display meals immediately AND cache to localStorage
      setMeals(generateData.meals);
      localStorage.setItem("currentMealPlan", JSON.stringify(generateData.meals));
      
      setGenerationStep("Meal plan ready!");
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setGenerationStep("");
      setIsGenerating(false);

      // Step 3: Store to DB in the background
      storeMealsInBackground(generateData.meals, "Generated from meals library");
      
    } catch (error) {
      console.error("Error generating meals:", error);
      setError(error instanceof Error ? error.message : "Failed to generate meals from library");
      setIsGenerating(false);
      setGenerationStep("");
      setMealProgress(0);
    }
  };

  const storeMealsInBackground = async (mealsToStore: GeneratedMeal[], whoopSummary: string) => {
    setIsStoring(true);
    
    try {
      // Store via Lambda
      const lambdaResponse = await fetch("/api/plan-ahead/lambda-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meals: mealsToStore }),
      });

      const lambdaData = await lambdaResponse.json();
      
      if (lambdaData.status === "success") {
        // Save reference
        const saveResponse = await fetch("/api/plan-ahead/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            meals: lambdaData.meals,
            whoopSummary,
            dietaryPreferences: "",
          }),
        });

        if (!saveResponse.ok) {
          console.warn("Failed to save meal plan reference");
        }

        if (lambdaData.failedCount > 0) {
          console.warn(`${lambdaData.failedCount} meals failed to store to permanent storage`);
        }
      } else {
        console.error("Failed to store meals to permanent storage:", lambdaData.message);
      }
    } catch (error) {
      console.error("Error storing meals in background:", error);
    } finally {
      setIsStoring(false);
    }
  };

  const toggleDay = (day: string) => {
    setExpandedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Group meals by day
  const mealsByDay = daysOfWeek.map((day) => ({
    day,
    meals: meals.filter((m) => m.day === day),
  }));

  const totalMeals = meals.length;
  const totalPrepTime = meals.reduce((sum, m) => sum + (m.prep_time || 0) + (m.cook_time || 0), 0);
  const totalCalories = meals.reduce((sum, m) => sum + (m.nutrition?.calories || 0), 0);

  // Convert GeneratedMeal to Meal format for MealCard
  const convertToMeal = (meal: GeneratedMeal): Meal => {
    // Handle both image_base64 (from generate-images) and image (from lambda-store/retrieve)
    let imageUrl = meal.image;
    
    // If image_base64 exists but no image URL, convert to data URL
    if (!imageUrl && (meal as any).image_base64) {
      imageUrl = `data:image/png;base64,${(meal as any).image_base64}`;
    }
    
    // If S3 URL, use proxy to avoid 403 errors
    if (imageUrl && imageUrl.includes('s3.') && imageUrl.includes('.amazonaws.com')) {
      imageUrl = `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
    }
    
    // Fallback to placeholder if no image
    if (!imageUrl) {
      imageUrl = "/placeholder-meal.jpg";
    }
    
    return {
      id: `${meal.day}-${meal.meal_type}`,
      name: meal.name,
      description: meal.description,
      image: imageUrl,
      category: meal.meal_type.toLowerCase() as "breakfast" | "lunch" | "snack" | "dinner",
      prepTime: meal.prep_time,
      cookTime: meal.cook_time,
      servings: meal.servings,
      ingredients: meal.ingredients.map((ing) => ({
        name: ing.name,
        amount: ing.amount,
        category: "cupboard" as const,
      })),
      instructions: meal.instructions,
      nutrition: meal.nutrition,
    };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Header with Generate Button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1
              className="text-4xl font-bold mb-2"
              style={{
                fontFamily: '"Right Grotesk Spatial", sans-serif',
              }}
            >
              Plan Ahead
            </h1>
            <p className="text-lg text-muted-foreground">
              {meals.length > 0
                ? "Your AI-generated personalized meal plan"
                : "Generate a 7-day meal plan based on your WHOOP data"}
            </p>
          </div>
          <button
            onClick={handleGenerateMeals}
            disabled={isGenerating}
            className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-all font-medium text-[16px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{
              fontFamily: '"Right Grotesk Wide", sans-serif',
            }}
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-5 h-5 animate-pulse" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {meals.length > 0 ? "Regenerate Meals" : "Generate Meals"}
              </>
            )}
          </button>
        </div>

        {/* Loading State with WHOOP Insights */}
        {isGenerating && (
          <HealthInsightsLoader
            insights={insights}
            progress={mealProgress}
            totalMeals={MAX_MEALS}
            isComplete={mealProgress >= MAX_MEALS}
          />
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 mb-8"
          >
            <p className="text-destructive font-medium">{error}</p>
          </motion.div>
        )}

        {/* Placeholder State */}
        {!isGenerating && meals.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p
              className="text-xl text-muted-foreground"
              style={{
                fontFamily: '"General Sans", sans-serif',
              }}
            >
              I'm ready to generate meals. Click the button to get started.
            </p>
          </motion.div>
        )}

        {/* Meals Display */}
        {meals.length > 0 && !isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Summary Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Total Meals</span>
                </div>
                <p className="text-3xl font-bold">{totalMeals}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Estimated Prep Time</span>
                </div>
                <p className="text-3xl font-bold">
                  {Math.round(totalPrepTime / 60)}h {totalPrepTime % 60}m
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Flame className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Weekly Calories</span>
                </div>
                <p className="text-3xl font-bold">{totalCalories.toLocaleString()}</p>
              </div>
            </div>

            {/* Collapsible Days */}
            <div className="space-y-4">
              {mealsByDay.map(({ day, meals: dayMeals }) => (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleDay(day)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <h3
                      className="text-lg font-medium"
                      style={{
                        fontFamily: '"Right Grotesk Wide", sans-serif',
                      }}
                    >
                      {day}
                    </h3>
                    {expandedDays.includes(day) ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>

                  <AnimatePresence>
                    {expandedDays.includes(day) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
                          {mealTypes.map((mealType) => {
                            const meal = dayMeals.find((m) => m.meal_type === mealType);
                            return meal ? (
                              <MealCard
                                key={`${day}-${mealType}`}
                                meal={convertToMeal(meal)}
                                size="medium"
                              />
                            ) : (
                              <div
                                key={`${day}-${mealType}`}
                                className="h-full min-h-[320px] bg-muted rounded-[20px] flex items-center justify-center text-muted-foreground text-sm"
                              >
                                No {mealType}
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}