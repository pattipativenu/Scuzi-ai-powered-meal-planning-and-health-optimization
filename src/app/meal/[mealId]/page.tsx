"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Clock, Users, ChevronLeft, Plus, Minus, Flame } from "lucide-react";
import { motion } from "framer-motion";

interface MealData {
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
  image_base64?: string;
}

export default function MealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const mealId = params.mealId as string;
  
  const [meal, setMeal] = useState<MealData | null>(null);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mealId) {
      loadMealData();
    }
  }, [mealId]);

  const loadMealData = async () => {
    try {
      setLoading(true);
      
      // First check localStorage for immediate access
      const cachedMeals = localStorage.getItem("currentMealPlan");
      if (cachedMeals) {
        const meals = JSON.parse(cachedMeals) as MealData[];
        const [day, mealType] = mealId.split("-");
        
        const foundMeal = meals.find(
          (m: MealData) => m.day === day && m.meal_type === mealType
        );
        
        if (foundMeal) {
          setMeal(foundMeal);
          setServings(foundMeal.servings);
          setLoading(false);
          return;
        }
      }

      // Fall back to API if not in cache
      const response = await fetch("/api/plan-ahead/retrieve");
      const data = await response.json();
      
      if (data.status === "success" && data.mealPlan?.meals) {
        const [day, mealType] = mealId.split("-");
        
        const foundMeal = data.mealPlan.meals.find(
          (m: MealData) => m.day === day && m.meal_type === mealType
        );
        
        if (foundMeal) {
          setMeal(foundMeal);
          setServings(foundMeal.servings);
        } else {
          setError("Meal not found. Please generate a meal plan first.");
        }
      } else {
        setError("No meal plan found. Please generate a meal plan first.");
      }
    } catch (error) {
      console.error("Error loading meal:", error);
      setError("Failed to load meal details.");
    } finally {
      setLoading(false);
    }
  };

  const adjustServings = (newServings: number) => {
    if (newServings < 1) return;
    setServings(newServings);
  };

  const calculateIngredientAmount = (amount: string) => {
    if (!meal) return amount;
    
    const ratio = servings / meal.servings;
    
    const numberMatch = amount.match(/^([\d.\/]+)\s*(.*)$/);
    if (numberMatch) {
      const originalAmount = eval(numberMatch[1]);
      const unit = numberMatch[2];
      const newAmount = (originalAmount * ratio).toFixed(1).replace(/\.0$/, "");
      return `${newAmount} ${unit}`;
    }
    
    return amount;
  };

  const calculateNutrition = (value: number) => {
    if (!meal) return value;
    const ratio = servings / meal.servings;
    return Math.round(value * ratio);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (error || !meal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <h2 className="text-2xl font-bold mb-4">Recipe Not Found</h2>
          <p className="text-muted-foreground mb-6">
            {error || "This recipe doesn't exist. Please generate your meal plan first."}
          </p>
          <button
            onClick={() => router.push("/plan-ahead")}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-primary/90 transition-all"
          >
            Go to Plan Ahead
          </button>
        </div>
      </div>
    );
  }

  const imageUrl = meal.image || 
                   (meal.image_base64 ? `data:image/png;base64,${meal.image_base64}` : null) || 
                   "/placeholder-meal.jpg";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Plan</span>
        </button>

        {/* Recipe Layout: 60% Left | 40% Right */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Panel: Recipe Details (60%) */}
          <div className="lg:col-span-3">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span className="px-2 py-1 bg-secondary rounded-full text-xs font-medium">
                  {meal.day}
                </span>
                <span>•</span>
                <span>{meal.meal_type}</span>
              </div>
              <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: '"Right Grotesk Spatial", sans-serif' }}>
                {meal.name}
              </h1>
              <p className="text-lg text-muted-foreground">{meal.description}</p>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-wrap gap-4 mb-8"
            >
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-5 h-5 text-primary" />
                <span className="font-medium">Prep:</span>
                <span className="text-muted-foreground">{meal.prep_time} min</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-5 h-5 text-primary" />
                <span className="font-medium">Cook:</span>
                <span className="text-muted-foreground">{meal.cook_time} min</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-medium">Servings:</span>
                <span className="text-muted-foreground">{meal.servings}</span>
              </div>
            </motion.div>

            {/* Instructions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-lg p-6"
            >
              <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: '"Right Grotesk Wide", sans-serif' }}>
                Instructions
              </h2>
              <ol className="space-y-4">
                {meal.instructions.map((instruction, index) => (
                  <li key={index} className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </span>
                    <p className="text-muted-foreground pt-1">{instruction}</p>
                  </li>
                ))}
              </ol>
            </motion.div>
          </div>

          {/* Right Panel: Image, Ingredients, Nutrition (40%) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Meal Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative w-full aspect-square rounded-2xl overflow-hidden"
            >
              <Image
                src={imageUrl}
                alt={meal.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 40vw"
                priority
              />
            </motion.div>

            {/* Serving Adjuster */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Servings</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => adjustServings(servings - 1)}
                    className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-xl font-semibold w-8 text-center">{servings}</span>
                  <button
                    onClick={() => adjustServings(servings + 1)}
                    className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Ingredients */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card border border-border rounded-lg p-6"
            >
              <h3 className="text-xl font-semibold mb-4" style={{ fontFamily: '"Right Grotesk Wide", sans-serif' }}>
                Ingredients
              </h3>
              <ul className="space-y-3">
                {meal.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{ingredient.name}</span>
                    <span className="font-medium">{calculateIngredientAmount(ingredient.amount)}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Nutrition */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-card border border-border rounded-lg p-6"
            >
              <h3 className="text-xl font-semibold mb-4" style={{ fontFamily: '"Right Grotesk Wide", sans-serif' }}>
                Nutrition
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="text-sm text-muted-foreground">Calories</span>
                  </div>
                  <span className="font-semibold">{calculateNutrition(meal.nutrition.calories)}</span>
                </div>
                <div className="h-px bg-border"></div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Protein</span>
                  <span className="font-medium">{calculateNutrition(meal.nutrition.protein)}g</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Carbs</span>
                  <span className="font-medium">{calculateNutrition(meal.nutrition.carbs)}g</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fat</span>
                  <span className="font-medium">{calculateNutrition(meal.nutrition.fat)}g</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}