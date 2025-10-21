"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Clock,
  ChefHat,
  Users,
  ArrowLeft,
  Plus,
  Minus,
  Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MealData {
  day: string;
  meal_type: string;
  original_meal_type?: string;
  meal_id?: string;
  name: string;
  tagline?: string;
  description: string;
  whyThisMeal?: string;
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
    fiber?: number;
    sodium?: number;
    saturated_fat?: number;
    sugars?: number;
    serving_unit?: string;
    summary?: string;
  };
  image: string;
  image_base64?: string;
  tags?: string[];
  raw_ingredients?: any;
  raw_nutrition?: any;
  raw_method?: any;
}

export default function MealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const mealId = params.mealId as string;

  const [meal, setMeal] = useState<MealData | null>(null);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(1);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "ingredients" | "methods" | "nutrition"
  >("ingredients");
  const [cookingMode, setCookingMode] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [isChangingMeal, setIsChangingMeal] = useState(false);
  const [mealTransition, setMealTransition] = useState(false);
  const [changeMessage, setChangeMessage] = useState("");

  // Cooking Mode Component
  const CookingModeToggle = ({ className = "" }) => (
    <div
      className={`bg-gray-50 rounded-lg p-4 flex items-center justify-between ${className}`}
    >
      <div>
        <h4 className="font-semibold">Cooking mode</h4>
        <p className="text-sm text-muted-foreground">
          Keep your screen awake as you cook
        </p>
      </div>
      <button
        onClick={() => {
          setCookingMode(!cookingMode);
          if (!cookingMode) {
            // Request screen wake lock
            if ("wakeLock" in navigator) {
              navigator.wakeLock.request("screen").catch(() => {
                console.log("Wake lock failed");
              });
            }
          }
        }}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          cookingMode ? "bg-black" : "bg-gray-300"
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            cookingMode ? "translate-x-6" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );

  // Mock reviews data
  const mockReviews = [
    {
      id: 1,
      rating: 5,
      comment:
        "This recipe is absolutely delicious! The flavors blend perfectly and it's so nutritious.",
      author: "Sarah M.",
      date: "2 days ago",
    },
    {
      id: 2,
      rating: 4,
      comment:
        "Great recipe for post-workout meals. Really helps with recovery based on my WHOOP data.",
      author: "Mike R.",
      date: "1 week ago",
    },
    {
      id: 3,
      rating: 5,
      comment:
        "Perfect balance of protein and carbs. My sleep score improved after eating this regularly.",
      author: "Emma L.",
      date: "2 weeks ago",
    },
    {
      id: 4,
      rating: 4,
      comment:
        "Easy to make and tastes amazing. The prep time is exactly as stated.",
      author: "David K.",
      date: "3 weeks ago",
    },
    {
      id: 5,
      rating: 5,
      comment:
        "This has become my go-to meal. Love how Scuzi personalizes it to my health data.",
      author: "Lisa P.",
      date: "1 month ago",
    },
    {
      id: 6,
      rating: 4,
      comment:
        "Fantastic recipe! My HRV improved significantly after incorporating this into my routine.",
      author: "Tom W.",
      date: "1 month ago",
    },
  ];

  const averageRating =
    mockReviews.reduce((sum, review) => sum + review.rating, 0) /
    mockReviews.length;

  useEffect(() => {
    const loadMeal = async () => {
      try {
        console.log(`🔍 Loading meal with ID: ${mealId}`);

        // Try RDS meal ID format first (B-0001, LD-0001, etc.)
        const response = await fetch(`/api/meals/${mealId}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.meal) {
            console.log(`✅ Found meal: ${data.meal.name}`);
            setMeal(data.meal);
            setLoading(false);
            return;
          }
        }

        // If not found, try current week meals for Day-MealType format
        if (mealId.includes('-')) {
          const [day, mealType] = mealId.split('-');
          const currentWeekResponse = await fetch('/api/meals/current-week');
          const currentWeekData = await currentWeekResponse.json();
          
          if (currentWeekData.status === 'success' && currentWeekData.meals) {
            const foundMeal = currentWeekData.meals.find(
              (m: any) => m.day === day && m.meal_type === mealType
            );
            
            if (foundMeal) {
              console.log(`✅ Found current week meal: ${foundMeal.name}`);
              setMeal(foundMeal);
              setLoading(false);
              return;
            }
          }
        }

        setError("Meal not found");
        setLoading(false);
      } catch (error) {
        console.error("❌ Error loading meal:", error);
        setError("Failed to load meal details");
        setLoading(false);
      }
    };

    loadMeal();
  }, [mealId]);

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

  const handleChangeMeal = async () => {
    if (!meal || isChangingMeal) return;

    setIsChangingMeal(true);
    
    try {
      console.log(`🔄 Changing meal: ${meal.meal_id || mealId}`);
      
      // Get the current meal ID (prefer meal_id from database)
      const currentMealId = meal.meal_id || mealId;
      
      const response = await fetch(`/api/meals/alternatives/${currentMealId}`);
      const data = await response.json();

      if (data.success && data.meal) {
        console.log(`✅ Found alternative: ${data.meal.name}`);
        
        // Add smooth transition effect
        setMealTransition(true);
        
        // Small delay for transition effect
        setTimeout(() => {
          // Update the meal data with the new alternative
          setMeal(data.meal);
          
          // Reset servings to the new meal's default
          setServings(data.meal.servings || 1);
          
          // Update the URL to reflect the new meal
          window.history.replaceState(null, '', `/meal/${data.meal.meal_id}`);
          
          console.log(`🎯 Changed from ${meal.name} to ${data.meal.name}`);
          
          // Show success message
          setChangeMessage(`Changed to ${data.meal.name}!`);
          setTimeout(() => setChangeMessage(""), 3000);
          
          // Remove transition effect
          setTimeout(() => setMealTransition(false), 100);
        }, 200);
      } else {
        console.warn('No alternative meals found:', data.message);
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Error changing meal:', error);
      // You could show an error toast here
    } finally {
      setIsChangingMeal(false);
    }
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
            {error ||
              "This recipe doesn't exist. Please generate your meal plan first."}
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

  const imageUrl =
    meal.image ||
    (meal.image_base64 ? `data:image/png;base64,${meal.image_base64}` : null) ||
    "/placeholder-meal.jpg";

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Version */}
      <div className="hidden md:block">
        <div className="max-w-[1600px] mx-auto px-6 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Plan</span>
          </button>

          {/* Main Container - Full Width Layout */}
          <div className="w-full">
            {/* Recipe Header Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: mealTransition ? 0.3 : 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-16 lg:items-end"
            >
              {/* Left: Recipe Info (2 columns) - Aligned to bottom */}
              <div className="lg:col-span-2 space-y-8 lg:pb-0">
                <h1 className="text-4xl font-bold leading-tight">{meal.name}</h1>

                {/* Rating and Meta Info */}
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-6 h-6 ${
                            i < Math.floor(averageRating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-2xl">
                      {averageRating.toFixed(1)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-lg text-muted-foreground">
                    <Users className="w-6 h-6" />
                    <span className="font-medium">
                      {mockReviews.length} Notes
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-lg text-muted-foreground">
                    <Clock className="w-6 h-6" />
                    <span className="font-medium">
                      {meal.prep_time + meal.cook_time} min cook
                    </span>
                  </div>
                </div>

                {/* Why This Meal Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900">Why this meal is important</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {meal.whyThisMeal || meal.description || 'This delicious and nutritious recipe is optimized based on your WHOOP data to support your recovery, energy levels, and overall wellness goals.'}
                  </p>
                  
                  {/* Tags */}
                  {meal.tags && meal.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {meal.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Created by Scuzi and Change Meal Button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-lg text-muted-foreground">
                    <ChefHat className="w-6 h-6" />
                    <span className="font-medium">
                      created by <strong>Scuzi</strong>
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button 
                      onClick={handleChangeMeal}
                      disabled={isChangingMeal}
                      className="px-4 py-2 bg-gray-100 hover:bg-blue-500 hover:text-white text-gray-700 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {isChangingMeal ? 'Finding Alternative...' : 'Change Meal'}
                    </button>
                    {changeMessage && (
                      <span className="text-sm text-green-600 font-medium animate-fade-in">
                        {changeMessage}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Large Recipe Image (3 columns) */}
              <div className="lg:col-span-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl group cursor-pointer"
                >
                  <Image
                    src={imageUrl}
                    alt={meal.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 60vw"
                    priority
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* Tab Navigation - Full Width */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <div className="flex border-b border-border">
                {[
                  { id: "ingredients", label: "Ingredients" },
                  { id: "methods", label: "Method" },
                  { id: "nutrition", label: "Nutrition" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-4 px-6 font-medium text-center transition-colors border-b-2 ${
                      activeTab === tab.id
                        ? "border-black text-black"
                        : "border-transparent text-muted-foreground hover:text-black"
                    }`}
                    style={{ fontFamily: '"Right Grotesk Wide", sans-serif' }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Tab Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-16"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === "ingredients" && (
                    <div className="space-y-6">
                      <CookingModeToggle />
                      {/* Servings Adjuster */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-semibold">Servings</h3>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => adjustServings(servings - 1)}
                            className="w-10 h-10 rounded-full border border-border hover:bg-gray-50 flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          <span className="text-2xl font-bold w-8 text-center">
                            {servings}
                          </span>
                          <button
                            onClick={() => adjustServings(servings + 1)}
                            className="w-10 h-10 rounded-full border border-border hover:bg-gray-50 flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Ingredients List */}
                      <div className="space-y-4">
                        {meal.ingredients.map((ingredient, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center py-3 border-b border-border/30"
                          >
                            <span className="text-lg">{ingredient.name}</span>
                            <span className="text-lg font-medium text-muted-foreground">
                              {calculateIngredientAmount(ingredient.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "methods" && (
                    <div className="space-y-8">
                      <CookingModeToggle />
                      {meal.instructions.map((instruction, index) => (
                        <div key={index}>
                          <div className="flex gap-6 pb-8">
                            <span className="flex-shrink-0 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold text-xl">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <h3 className="heading-h4 mb-4">
                                step {index + 1}
                              </h3>
                              <p className="text-lg text-muted-foreground leading-relaxed">
                                {instruction}
                              </p>
                            </div>
                          </div>
                          {index < meal.instructions.length - 1 && (
                            <div className="border-b border-border/20 mb-8" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "nutrition" && (
                    <div className="space-y-6">
                      <CookingModeToggle />
                      <h3 className="heading-h4 text-muted-foreground">
                        nutritional information per serving:
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-border/30">
                          <span className="text-lg font-medium">Calories</span>
                          <span className="text-lg font-semibold">
                            {calculateNutrition(meal.nutrition.calories)}kcal
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-border/30">
                          <span className="text-lg font-medium">Fat</span>
                          <span className="text-lg font-semibold">
                            {calculateNutrition(meal.nutrition.fat)}g
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-border/30">
                          <span className="text-lg font-medium">
                            Saturated Fat
                          </span>
                          <span className="text-lg font-semibold">
                            {calculateNutrition(meal.nutrition.saturated_fat || Math.round(meal.nutrition.fat * 0.3))}g
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-border/30">
                          <span className="text-lg font-medium">
                            Dietary Fibre
                          </span>
                          <span className="text-lg font-semibold">
                            {calculateNutrition(meal.nutrition.fiber || Math.round(meal.nutrition.carbs * 0.15))}g
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-border/30">
                          <span className="text-lg font-medium">
                            Carbohydrates
                          </span>
                          <span className="text-lg font-semibold">
                            {calculateNutrition(meal.nutrition.carbs)}g
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-border/30">
                          <span className="text-lg font-medium">Sugars</span>
                          <span className="text-lg font-semibold">
                            {calculateNutrition(meal.nutrition.sugars || Math.round(meal.nutrition.carbs * 0.25))}g
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-border/30">
                          <span className="text-lg font-medium">Protein</span>
                          <span className="text-lg font-semibold">
                            {calculateNutrition(meal.nutrition.protein)}g
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-border/30">
                          <span className="text-lg font-medium">Sodium</span>
                          <span className="text-lg font-semibold">
                            {calculateNutrition(meal.nutrition.sodium || Math.round(meal.nutrition.calories * 0.3))}mg
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Rating Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center mb-12"
            >
              <h3 className="heading-h3 mb-4">did you like this recipe?</h3>
              <div className="flex items-center justify-center gap-4 mb-4">
                <button className="w-16 h-16 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                  👍
                </button>
                <button className="w-16 h-16 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                  👎
                </button>
              </div>
              <p className="text-muted-foreground">
                You need to be logged in to leave your rating
              </p>
            </motion.div>

            {/* Leave a Note Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-12"
            >
              <h3 className="text-2xl font-semibold mb-6">Leave a note</h3>
              <CookingModeToggle className="mb-6" />
              <div className="space-y-4">
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your thoughts about this recipe..."
                  className="w-full p-6 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-lg"
                  rows={4}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg text-muted-foreground">
                      Rating:
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          className="w-8 h-8 text-gray-300 hover:text-yellow-400 transition-colors"
                        >
                          <Star className="w-full h-full" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    disabled={!reviewText.trim()}
                    className="px-6 py-3 bg-black text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                  >
                    Post Note
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Notes Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <h3 className="text-2xl font-semibold mb-6">
                Notes ({mockReviews.length})
              </h3>
              <div className="space-y-6">
                {mockReviews.map((review) => (
                  <div key={review.id} className="flex gap-4">
                    <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold">
                      {review.author.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold">{review.author}</span>
                        <span className="text-sm text-muted-foreground">
                          {review.date}
                        </span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile Version */}
      <div className="md:hidden min-h-screen bg-background">
        <div className="px-4 py-6 space-y-6">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Plan</span>
          </button>

          {/* Recipe Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full aspect-square rounded-2xl overflow-hidden group cursor-pointer"
          >
            <Image
              src={imageUrl}
              alt={meal.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="100vw"
              priority
            />
          </motion.div>

          {/* Recipe Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h1 className="text-2xl font-bold leading-tight">{meal.name}</h1>

            {/* Rating and Meta */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-bold">{averageRating.toFixed(1)}</span>
              </div>

              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{mockReviews.length} Notes</span>
              </div>

              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{meal.prep_time + meal.cook_time} min cook</span>
              </div>
            </div>

            {/* Why This Meal Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Why this meal is important</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {meal.whyThisMeal || meal.description || 'This delicious and nutritious recipe is optimized based on your WHOOP data to support your recovery, energy levels, and overall wellness goals.'}
              </p>
              
              {/* Tags */}
              {meal.tags && meal.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {meal.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Created by and Change Meal Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ChefHat className="w-4 h-4" />
                <span>
                  created by <strong>Scuzi</strong>
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <button 
                  onClick={handleChangeMeal}
                  disabled={isChangingMeal}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-blue-500 hover:text-white text-gray-700 rounded-lg text-sm font-medium transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isChangingMeal ? 'Finding...' : 'Change Meal'}
                </button>
                {changeMessage && (
                  <span className="text-xs text-green-600 font-medium animate-fade-in">
                    {changeMessage}
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex border-b border-border">
              {[
                { id: "ingredients", label: "Ingredients" },
                { id: "methods", label: "Method" },
                { id: "nutrition", label: "Nutrition" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-3 px-4 font-medium text-center transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? "border-black text-black"
                      : "border-transparent text-muted-foreground"
                  }`}
                  style={{ fontFamily: '"Right Grotesk Wide", sans-serif' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Tab Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "ingredients" && (
                  <div className="space-y-4">
                    <CookingModeToggle />
                    {/* Servings */}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Servings</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => adjustServings(servings - 1)}
                          className="w-8 h-8 rounded-full border border-border flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-lg w-6 text-center">
                          {servings}
                        </span>
                        <button
                          onClick={() => adjustServings(servings + 1)}
                          className="w-8 h-8 rounded-full border border-border flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Ingredients List */}
                    <div className="space-y-3">
                      {meal.ingredients.map((ingredient, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center py-2 border-b border-border/30"
                        >
                          <span>{ingredient.name}</span>
                          <span className="font-medium text-muted-foreground">
                            {calculateIngredientAmount(ingredient.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "methods" && (
                  <div className="space-y-6">
                    <CookingModeToggle />

                    {/* Method Steps */}
                    <div className="space-y-6">
                      {meal.instructions.map((instruction, index) => (
                        <div key={index}>
                          <div className="flex gap-4 pb-6">
                            <span className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <h4 className="font-semibold mb-2">
                                Step {index + 1}
                              </h4>
                              <p className="text-muted-foreground leading-relaxed">
                                {instruction}
                              </p>
                            </div>
                          </div>
                          {index < meal.instructions.length - 1 && (
                            <div className="border-b border-border/20 mb-6" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "nutrition" && (
                  <div className="space-y-4">
                    <CookingModeToggle />
                    <h4 className="font-semibold text-muted-foreground">
                      Nutritional information per serving:
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-border/30">
                        <span className="font-medium">Calories</span>
                        <span className="font-semibold">
                          {calculateNutrition(meal.nutrition.calories)}kcal
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/30">
                        <span className="font-medium">Fat</span>
                        <span className="font-semibold">
                          {calculateNutrition(meal.nutrition.fat)}g
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/30">
                        <span className="font-medium">Saturated Fat</span>
                        <span className="font-semibold">
                          {calculateNutrition(meal.nutrition.saturated_fat || Math.round(meal.nutrition.fat * 0.3))}g
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/30">
                        <span className="font-medium">Dietary Fibre</span>
                        <span className="font-semibold">
                          {calculateNutrition(meal.nutrition.fiber || Math.round(meal.nutrition.carbs * 0.15))}g
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/30">
                        <span className="font-medium">Carbohydrates</span>
                        <span className="font-semibold">
                          {calculateNutrition(meal.nutrition.carbs)}g
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/30">
                        <span className="font-medium">Sugars</span>
                        <span className="font-semibold">
                          {calculateNutrition(meal.nutrition.sugars || Math.round(meal.nutrition.carbs * 0.25))}g
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/30">
                        <span className="font-medium">Protein</span>
                        <span className="font-semibold">
                          {calculateNutrition(meal.nutrition.protein)}g
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/30">
                        <span className="font-medium">Sodium</span>
                        <span className="font-semibold">
                          {calculateNutrition(meal.nutrition.sodium || Math.round(meal.nutrition.calories * 0.3))}mg
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Rating Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center space-y-4"
          >
            <h3 className="text-xl font-semibold">Did you like this recipe?</h3>
            <div className="flex items-center justify-center gap-4">
              <button className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl">
                👍
              </button>
              <button className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl">
                👎
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              You need to be logged in to leave your rating
            </p>
          </motion.div>

          {/* Leave a Note */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-semibold">Leave a note</h3>
            <CookingModeToggle />
            <div className="space-y-3">
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your thoughts about this recipe..."
                className="w-full p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                rows={4}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rating:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        className="w-6 h-6 text-gray-300 hover:text-yellow-400 transition-colors"
                      >
                        <Star className="w-full h-full" />
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  disabled={!reviewText.trim()}
                  className="px-4 py-2 bg-black text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                >
                  Post Note
                </button>
              </div>
            </div>
          </motion.div>

          {/* Notes Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-4 pb-8"
          >
            <h3 className="text-xl font-semibold">
              Notes ({mockReviews.length})
            </h3>
            <div className="space-y-4">
              {mockReviews.map((review) => (
                <div key={review.id} className="flex gap-3">
                  <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {review.author.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">
                        {review.author}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {review.date}
                      </span>
                      <div className="flex items-center ml-auto">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
