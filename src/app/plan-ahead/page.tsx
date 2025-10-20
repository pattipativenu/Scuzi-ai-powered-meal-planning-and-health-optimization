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

  // Load existing meal plan on mount - PERSISTENT MEALS
  useEffect(() => {
    loadExistingMealPlan();
  }, []);

  const loadExistingMealPlan = async () => {
    try {
      // First check localStorage for immediate access
      const cachedMeals = localStorage.getItem("persistentMealPlan");
      if (cachedMeals) {
        const parsed = JSON.parse(cachedMeals);
        console.log("📱 Loaded persistent meal plan from localStorage:", parsed.length, "meals");
        setMeals(parsed);
        return;
      }

      // Fall back to API to check for saved meal plan
      const response = await fetch("/api/plan-ahead/retrieve");
      const data = await response.json();
      
      if (data.status === "success" && data.mealPlan?.meals) {
        console.log("💾 Loaded persistent meal plan from database:", data.mealPlan.meals.length, "meals");
        setMeals(data.mealPlan.meals);
        // Cache to localStorage with persistent key
        localStorage.setItem("persistentMealPlan", JSON.stringify(data.mealPlan.meals));
      } else {
        console.log("📝 No existing meal plan found - user needs to generate first plan");
      }
    } catch (error) {
      console.error("Error loading meal plan:", error);
    }
  };

  const handleGenerateMeals = async () => {
    setIsGenerating(true);
    setError("");
    setMealProgress(0);
    setGenerationStep("Analyzing your WHOOP health data...");

    try {
      // Step 1: Check meal library and generation capabilities
      setGenerationStep("Checking meal library and your health data...");
      setMealProgress(2);
      
      let apiEndpoint = "/api/plan-ahead/generate-from-library";
      let capabilities;
      
      try {
        // First try library-based generation (preferred)
        const libraryResponse = await fetch(apiEndpoint);
        
        if (libraryResponse.ok) {
          capabilities = await libraryResponse.json();
          console.log("✅ Using meal library generation mode");
        } else {
          console.warn("Library API not ready, falling back to AI generation");
          
          // Fallback to AI generation
          apiEndpoint = "/api/plan-ahead/generate-ai-meals";
          const aiResponse = await fetch(apiEndpoint);
          
          if (!aiResponse.ok) {
            // Final fallback
            apiEndpoint = "/api/plan-ahead/generate-ai-meals-fallback";
            const fallbackResponse = await fetch(apiEndpoint);
            
            if (!fallbackResponse.ok) {
              throw new Error("All meal generation APIs are unavailable");
            }
            
            capabilities = await fallbackResponse.json();
            console.log("✅ Using fallback AI generation mode");
          } else {
            capabilities = await aiResponse.json();
            console.log("✅ Using AI generation mode");
          }
        }
      } catch (error) {
        console.error("All meal generation APIs failed:", error);
        throw new Error("Meal generation is currently unavailable. Please try again later.");
      }

      // Step 2: Start meal generation
      const isLibraryMode = apiEndpoint.includes('generate-from-library');
      setGenerationStep(isLibraryMode
        ? "Selecting optimal meals from library based on your WHOOP data..."
        : capabilities.has_whoop_data 
          ? "Analyzing your WHOOP data to personalize meals..." 
          : capabilities.mode === "fallback" 
            ? "Generating test meals (fallback mode)..."
            : "Generating personalized meals with AI...");
      setMealProgress(5);
      
      const generateResponse = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          regenerate: meals.length > 0,
          shuffleOnly: false 
        }),
      });

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        console.error("AI meal generation failed:", errorText);
        
        // Check if it's an HTML error page
        if (errorText.includes("<!DOCTYPE")) {
          throw new Error("AI meal generation service is currently unavailable. Please check your configuration and try again.");
        }
        
        // Try to parse as JSON for structured errors
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.suggestion === "shuffle_existing") {
            const shouldShuffle = confirm(
              `${errorData.message}\n\nClick OK to shuffle existing meals, or Cancel to generate completely new ones.`
            );
            
            if (shouldShuffle) {
              return handleShuffleMeals();
            } else {
              return handleGenerateNewMeals();
            }
          }
          throw new Error(errorData.error || "Failed to generate AI meals");
        } catch (parseError) {
          throw new Error("AI meal generation failed. Please try again.");
        }
      }

      const generateData = await generateResponse.json();

      // Step 3: Simulate progress updates during generation
      if (generateData.step !== "completed") {
        if (isLibraryMode) {
          setGenerationStep("Analyzing your WHOOP health patterns...");
          setMealProgress(10);
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          setGenerationStep("Selecting meals that match your needs...");
          setMealProgress(20);
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          setGenerationStep("Creating your personalized meal plan...");
          setMealProgress(25);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else if (capabilities.mode === "fallback") {
          setGenerationStep("Creating test meal plan...");
          setMealProgress(15);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          setGenerationStep("Generating personalized recipes with Claude AI...");
          setMealProgress(10);
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          setGenerationStep("Creating meal images with Titan AI...");
          setMealProgress(15);
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          setGenerationStep("Storing meals in your library...");
          setMealProgress(25);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      setMealProgress(MAX_MEALS);
      
      // Step 4: Display meals immediately AND cache to localStorage (PERSISTENT)
      setMeals(generateData.meals);
      localStorage.setItem("persistentMealPlan", JSON.stringify(generateData.meals));
      console.log("💾 Saved new meal plan with", generateData.meals.length, "UNIQUE meals");
      
      setGenerationStep(isLibraryMode
        ? "Meal plan ready! Selected from library based on your WHOOP data."
        : capabilities.has_whoop_data 
          ? "AI meal plan ready! Personalized for your WHOOP data." 
          : capabilities.mode === "fallback"
            ? "Test meal plan ready! (Configure Bedrock for full AI)"
            : "AI meal plan ready!");
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setGenerationStep("");
      setIsGenerating(false);

      console.log("✅ AI meal generation completed:", {
        type: generateData.generation_type,
        whoop_data: capabilities.has_whoop_data,
        processing_time: generateData.processing_time_ms,
        insights: generateData.whoop_insights
      });
      
    } catch (error) {
      console.error("Error generating AI meals:", error);
      setError(error instanceof Error ? error.message : "Failed to generate AI-powered meals");
      setIsGenerating(false);
      setGenerationStep("");
      setMealProgress(0);
    }
  };

  const handleShuffleMeals = async () => {
    setIsGenerating(true);
    setError("");
    setMealProgress(0);
    setGenerationStep("Shuffling your existing meals...");

    try {
      const shuffleResponse = await fetch("/api/plan-ahead/generate-ai-meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shuffleOnly: true }),
      });

      const shuffleData = await shuffleResponse.json();
      
      if (!shuffleResponse.ok) {
        throw new Error(shuffleData.error || "Failed to shuffle meals");
      }

      setMealProgress(MAX_MEALS);
      setMeals(shuffleData.meals);
      localStorage.setItem("persistentMealPlan", JSON.stringify(shuffleData.meals));
      console.log("🔀 Shuffled to new meal selection with", shuffleData.meals.length, "UNIQUE meals");
      
      setGenerationStep("Meals shuffled successfully!");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setGenerationStep("");
      setIsGenerating(false);
      
    } catch (error) {
      console.error("Error shuffling meals:", error);
      setError(error instanceof Error ? error.message : "Failed to shuffle meals");
      setIsGenerating(false);
      setGenerationStep("");
      setMealProgress(0);
    }
  };

  const handleGenerateNewMeals = async () => {
    setIsGenerating(true);
    setError("");
    setMealProgress(0);
    setGenerationStep("Generating completely new AI meals...");

    try {
      const generateResponse = await fetch("/api/plan-ahead/generate-ai-meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          regenerate: true,
          shuffleOnly: false 
        }),
      });

      const generateData = await generateResponse.json();
      
      if (!generateResponse.ok) {
        throw new Error(generateData.error || "Failed to generate new AI meals");
      }

      // Simulate progress
      setGenerationStep("Creating new recipes with Claude AI...");
      setMealProgress(10);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setGenerationStep("Generating fresh meal images...");
      setMealProgress(20);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setMealProgress(MAX_MEALS);
      setMeals(generateData.meals);
      localStorage.setItem("persistentMealPlan", JSON.stringify(generateData.meals));
      console.log("🆕 Generated completely new meal plan with", generateData.meals.length, "UNIQUE meals");
      
      setGenerationStep("New AI meal plan ready!");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setGenerationStep("");
      setIsGenerating(false);
      
    } catch (error) {
      console.error("Error generating new meals:", error);
      setError(error instanceof Error ? error.message : "Failed to generate new AI meals");
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
    // Handle different image field names (image, imageUrl, image_base64)
    let imageUrl = meal.image || (meal as any).imageUrl;
    
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
    
    // Ensure all required fields are present with safe defaults
    const safeIngredients = meal.ingredients || [];
    const safeInstructions = meal.instructions || ["Follow recipe instructions"];
    const safeNutrition = meal.nutrition || {
      calories: 400,
      protein: 20,
      carbs: 40,
      fat: 15
    };
    
    return {
      id: `${meal.day}-${meal.meal_type}`,
      name: meal.name || "Unnamed Meal",
      description: meal.description || "Delicious and nutritious meal",
      image: imageUrl,
      category: meal.meal_type.toLowerCase() as "breakfast" | "lunch" | "snack" | "dinner",
      prepTime: meal.prep_time || 15,
      cookTime: meal.cook_time || 15,
      servings: meal.servings || 2,
      ingredients: safeIngredients.map((ing) => ({
        name: typeof ing === 'string' ? ing : (ing.name || 'Unknown ingredient'),
        amount: typeof ing === 'string' ? "as needed" : (ing.amount || "as needed"),
        category: "cupboard" as const,
      })),
      instructions: safeInstructions,
      nutrition: safeNutrition,
    };
  };

  return (
    <div className="min-h-screen bg-background md:pt-0 pt-40 md:pb-0 pb-20">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
        {/* Header with Generate Button */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 gap-4">
          {/* Mobile Layout */}
          <div className="block md:hidden">
            <p className="text-lg font-medium text-foreground mb-4">
              {meals.length > 0
                ? "Your AI-generated personalized meal plan powered by WHOOP data"
                : "Generate a 7-day AI meal plan personalized with your WHOOP health data"}
            </p>
            <button
              onClick={handleGenerateMeals}
              disabled={isGenerating}
              className="bg-black text-white px-4 py-3 rounded-full hover:bg-gray-800 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 w-full justify-center whitespace-nowrap"
              style={{
                fontFamily: '"Right Grotesk Wide", sans-serif',
              }}
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  AI Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {meals.length > 0 ? "Get New Meals" : "Generate Meal Plan"}
                </>
              )}
            </button>
          </div>

          {/* Tablet Layout */}
          <div className="hidden md:block lg:hidden">
            <h1 className="heading-h2 mb-2">
              plan ahead
            </h1>
            <p className="text-base text-muted-foreground max-w-md">
              {meals.length > 0
                ? "Your AI-generated personalized meal plan powered by WHOOP data"
                : "Generate a 7-day AI meal plan personalized with your WHOOP health data"}
            </p>
            <button
              onClick={handleGenerateMeals}
              disabled={isGenerating}
              className="bg-black text-white px-4 py-3 rounded-full hover:bg-gray-800 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mt-4 whitespace-nowrap"
              style={{
                fontFamily: '"Right Grotesk Wide", sans-serif',
              }}
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  Selecting Meals...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {meals.length > 0 ? "Get New Meals" : "Generate Meal Plan"}
                </>
              )}
            </button>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex lg:justify-between lg:items-center w-full">
            <div>
              <h1 className="heading-h1 mb-2">
                plan ahead
              </h1>
              <p className="text-lg text-muted-foreground">
                {meals.length > 0
                  ? "Your AI-generated personalized meal plan powered by WHOOP data"
                  : "Generate a 7-day AI meal plan personalized with your WHOOP health data"}
              </p>
            </div>
            <button
              onClick={handleGenerateMeals}
              disabled={isGenerating}
              className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-all font-medium text-[16px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
              style={{
                fontFamily: '"Right Grotesk Wide", sans-serif',
              }}
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  Selecting Meals...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {meals.length > 0 ? "Get New Meals" : "Generate Meal Plan"}
                </>
              )}
            </button>
          </div>
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
            {/* Mobile: Single row layout */}
            <div className="grid grid-cols-3 md:hidden gap-2 mb-8">
              <div className="bg-card border border-border rounded-lg p-3">
                <div className="flex flex-col items-center text-center">
                  <Calendar className="w-4 h-4 text-primary mb-1" />
                  <span className="text-xs text-muted-foreground">Total Meals</span>
                  <p className="text-lg font-bold">{totalMeals}</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <div className="flex flex-col items-center text-center">
                  <Clock className="w-4 h-4 text-primary mb-1" />
                  <span className="text-xs text-muted-foreground">Prep Time</span>
                  <p className="text-lg font-bold">
                    {Math.round(totalPrepTime / 60)}h {totalPrepTime % 60}m
                  </p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <div className="flex flex-col items-center text-center">
                  <Flame className="w-4 h-4 text-primary mb-1" />
                  <span className="text-xs text-muted-foreground">Calories</span>
                  <p className="text-lg font-bold">{Math.round(totalCalories / 1000)}k</p>
                </div>
              </div>
            </div>

            {/* Tablet & Desktop: Original layout */}
            <div className="hidden md:grid md:grid-cols-3 gap-4 mb-8">
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
                        {/* Mobile & Tablet: Horizontal scrolling */}
                        <div className="lg:hidden p-6">
                          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                            {mealTypes.map((mealType) => {
                              const meal = dayMeals.find((m) => m.meal_type === mealType);
                              return meal ? (
                                <div key={`${day}-${mealType}`} className="flex-shrink-0 w-[280px]">
                                  <MealCard
                                    meal={convertToMeal(meal)}
                                    size="medium"
                                  />
                                </div>
                              ) : (
                                <div
                                  key={`${day}-${mealType}`}
                                  className="flex-shrink-0 w-[280px] h-[320px] bg-muted rounded-[20px] flex items-center justify-center text-muted-foreground text-sm"
                                >
                                  No {mealType}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Desktop: Grid layout */}
                        <div className="hidden lg:block">
                          <div className="grid grid-cols-4 gap-6 p-6">
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