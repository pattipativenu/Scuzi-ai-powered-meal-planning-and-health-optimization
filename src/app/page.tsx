"use client";

import { MealCard } from "@/components/MealCard";
import { AnimatedHeroSection } from "@/components/AnimatedHeroSection";
import { ChevronRight, Star } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { useHistoryFeed } from "@/hooks/useHistoryFeed";
import { useCurrentWeekMeals } from "@/hooks/useCurrentWeekMeals";
import { HistoryDetailDialog } from "@/components/HistoryDetailDialog";
import type { Meal } from "@/types/meal";
import type { HistoryItem } from "@/hooks/useHistoryFeed";

export default function Home() {
  // Fetch real current week meals from database
  const { meals: currentWeekMealsData, isLoading: mealsLoading } = useCurrentWeekMeals();

  // Calculate dates dynamically
  const getCurrentWeekDates = () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    return [
    { day: "Monday", date: format(weekStart, "d MMM") },
    { day: "Tuesday", date: format(addDays(weekStart, 1), "d MMM") },
    { day: "Wednesday", date: format(addDays(weekStart, 2), "d MMM") },
    { day: "Thursday", date: format(addDays(weekStart, 3), "d MMM") },
    { day: "Friday", date: format(addDays(weekStart, 4), "d MMM") },
    { day: "Saturday", date: format(addDays(weekStart, 5), "d MMM") },
    { day: "Sunday", date: format(addDays(weekStart, 6), "d MMM") }];

  };

  const daysOfWeek = getCurrentWeekDates();
  const mealTypes = ["breakfast", "lunch", "snack", "dinner"] as const;

  // Convert database meals to structured format
  const getMealForDayAndType = (day: string, mealType: string) => {
    const meal = currentWeekMealsData.find(
      (m) => m.day === day && m.meal_type.toLowerCase() === mealType.toLowerCase()
    );

    if (!meal) return null;

    return {
      id: `${meal.day}-${meal.meal_type}`,
      name: meal.name,
      description: meal.description,
      image: meal.image,
      category: meal.meal_type.toLowerCase() as "breakfast" | "lunch" | "snack" | "dinner",
      prepTime: meal.prep_time,
      cookTime: meal.cook_time,
      servings: meal.servings,
      ingredients: meal.ingredients.map((ing) => ({
        name: ing.name,
        amount: ing.amount,
        category: "cupboard" as const
      })),
      instructions: meal.instructions,
      nutrition: meal.nutrition
    } as Meal;
  };

  // Customer reviews data
  const reviews = [
  {
    name: "Sarah Johnson",
    rating: 5,
    review: "This app has completely transformed how I approach meal planning. I save so much time and money!",
    avatar: "SJ"
  },
  {
    name: "Michael Chen",
    rating: 5,
    review: "The AI recipe suggestions are incredible. My family loves the variety and I love how easy it is.",
    avatar: "MC"
  },
  {
    name: "Emily Rodriguez",
    rating: 5,
    review: "Best meal planning app I've ever used. The nutrition tracking and grocery lists are game-changers.",
    avatar: "ER"
  },
  {
    name: "David Thompson",
    rating: 5,
    review: "Scuzi has made healthy eating so much easier. The recipes are delicious and simple to follow.",
    avatar: "DT"
  },
  {
    name: "Lisa Anderson",
    rating: 5,
    review: "I can't imagine meal planning without Scuzi now. It's intuitive, smart, and saves me hours each week.",
    avatar: "LA"
  }];

  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [reviews.length]);

  // Fetch real history data from DynamoDB
  const { history, isLoading, error } = useHistoryFeed();

  // History detail dialog state
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleHistoryCardClick = (item: HistoryItem) => {
    setSelectedHistoryItem(item);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ backgroundColor: 'rgb(255, 255, 255)' }}>
      {/* Hero Section */}
      <div className="hero-container">
        <AnimatedHeroSection />
      </div>

      {/* Current Week's Meals */}
      <section className="py-8 md:py-16" style={{ backgroundColor: 'rgb(255, 255, 255)' }}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="flex items-baseline justify-between mb-6 md:mb-12">
            <h2>
              Current Week Meals
            </h2>
            <Link
              href="/plan-ahead"
              className="hidden md:flex hover:underline items-center gap-1 nav-link"
              style={{ color: 'rgb(39, 39, 42)' }}
            >
              View Next Week Meals
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Loading State */}
          {mealsLoading &&
          <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          }

          {/* No Meals State */}
          {!mealsLoading && currentWeekMealsData.length === 0 &&
          <div className="text-center py-20">
              <p
              style={{
                fontFamily: '"General Sans", sans-serif',
                fontSize: '15px',
                color: 'rgb(163, 163, 163)'
              }}>

                No meals planned for this week yet. Generate meals in Plan Ahead!
              </p>
            </div>
          }

          {/* Desktop & Tablet: Vertical Days with Horizontal Meals */}
          {!mealsLoading && currentWeekMealsData.length > 0 &&
          <div className="hidden md:block space-y-10">
              {daysOfWeek.map(({ day, date }) =>
            <div key={day}>
                  <div className="flex items-center justify-between mb-6">
                    <h4>
                      {day}, {date}
                    </h4>
                    <Link
                      href="/plan-ahead"
                      className="flex items-center gap-1 text-sm hover:underline text-secondary"
                    >
                      Next Week
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {mealTypes.map((mealType) => {
                  const meal = getMealForDayAndType(day, mealType);
                  return meal ?
                  <MealCard key={`${day}-${mealType}`} meal={meal} size="medium" /> :

                  <div
                    key={`${day}-${mealType}`}
                    className="h-full min-h-[320px] bg-gray-100 rounded-[20px] flex items-center justify-center text-disabled">

                          No {mealType}
                        </div>;

                })}
                  </div>
                </div>
            )}
            </div>
          }

          {/* Mobile: 2-column grid with optimized sizing */}
          {!mealsLoading && currentWeekMealsData.length > 0 &&
          <div className="md:hidden space-y-6">
              {daysOfWeek.map(({ day, date }) => {
            const dayMeals = mealTypes.map(type => getMealForDayAndType(day, type)).filter(Boolean);
            if (dayMeals.length === 0) return null;
            
            return (
              <div key={day}>
                  <div className="flex items-center justify-between mb-3 px-2">
                    <h4>
                      {day}, {date}
                    </h4>
                    <Link
                      href="/plan-ahead"
                      className="flex items-center gap-1 text-xs text-secondary"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-3 px-2">
                    {dayMeals.map((meal) => 
                      <div key={meal!.id} className="w-full">
                        <MealCard meal={meal!} size="small" />
                      </div>
                    )}
                  </div>
                </div>
            );
          })}
            </div>
          }
        </div>
      </section>

      {/* History Section - Real AI-Generated Content */}
      <section className="py-6 md:py-16" style={{ backgroundColor: 'rgb(255, 255, 255)' }}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <h2>Recent Chat History</h2>
          
          {isLoading &&
          <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          }
          
          {error &&
          <div className="text-center py-20">
              <p className="!text-black">
                Failed to load history: {error}
              </p>
            </div>
          }
          
          {!isLoading && !error && history.length === 0 &&
          <div className="text-center py-20">
              <p style={{
              fontFamily: '"General Sans", sans-serif',
              fontSize: '15px',
              color: 'rgb(163, 163, 163)'
            }}>
                No history yet. Start a conversation in the chat to see your AI-generated content here!
              </p>
            </div>
          }
          
          {!isLoading && !error && history.length > 0 &&
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
              {history.map((item) =>
            <div
              key={item.id}
              onClick={() => handleHistoryCardClick(item)}
              className="snap-start flex-shrink-0 w-[280px] bg-white rounded-[20px] shadow-md overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer">

                  {item.image_url ?
              <img
                src={item.image_url}
                alt={item.title}
                className="object-cover w-full h-[240px]" /> :

              <div className="w-full h-[240px] bg-gradient-to-br from-yellow-400 to-yellow-600 flex flex-col items-center justify-center gap-2">
                      <span style={{
                  fontFamily: '"Right Grotesk Wide", sans-serif',
                  fontSize: '48px',
                  fontWeight: 700,
                  color: 'white',
                  opacity: 0.8
                }}>
                        AI
                      </span>
                      <p className="text-sm" style={{
                  color: 'white',
                  opacity: 0.9
                }}>
                        Image is not available
                      </p>
                    </div>
              }
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                    className="px-2 py-1 rounded text-xs"
                    style={{
                      backgroundColor: 'rgb(254, 243, 199)',
                      color: 'rgb(146, 64, 14)'
                    }}>
                        {item.type.replace('_', ' ')}
                      </span>
                    </div>
                    <h4>
                      {item.title}
                    </h4>
                    <p className="line-clamp-2 text-secondary">
                      {item.description}
                    </p>
                    <p className="text-xs text-disabled">
                      {new Date(item.timestamp).toLocaleString("en-GB", {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}
                    </p>
                  </div>
                </div>
            )}
            </div>
          }
        </div>
      </section>

      {/* Customer Reviews Carousel */}
      <section className="py-6 md:py-16" style={{ backgroundColor: 'rgb(255, 255, 255)' }}>
        <div className="max-w-4xl mx-auto px-4 md:px-20">
          <div className="relative rounded-2xl shadow-lg p-6 md:p-12 text-center min-h-[200px] md:min-h-[280px] flex flex-col justify-center" style={{ backgroundColor: 'rgb(255, 255, 255)' }}>
            <div className="flex justify-center gap-1 mb-4 md:mb-6">
              {[...Array(5)].map((_, i) =>
              <Star key={i} className="w-5 h-5 md:w-6 md:h-6 fill-yellow-400 text-yellow-400" />
              )}
            </div>
            
            <div className="relative overflow-hidden">
              {reviews.map((review, index) =>
              <div
                key={index}
                className={`transition-opacity duration-500 ${
                index === currentReviewIndex ? 'opacity-100' : 'opacity-0 absolute inset-0'}`
                }>

                  <p style={{
                  color: 'rgb(0, 0, 0)',
                  marginBottom: '16px',
                  maxWidth: '500px',
                  margin: '0 auto 16px',
                  fontSize: '14px',
                  lineHeight: '20px'
                }} className="md:text-base md:leading-6">
                    "{review.review}"
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center" style={{
                    fontFamily: '"Right Grotesk Wide", sans-serif',
                    fontWeight: 500,
                    fontSize: '14px',
                    color: 'white'
                  }}>
                      {review.avatar}
                    </div>
                    <h4>
                      {review.name}
                    </h4>
                  </div>
                </div>
              )}
            </div>

            {/* Carousel Indicators */}
            <div className="flex justify-center gap-2 mt-4 md:mt-8">
              {reviews.map((_, index) =>
              <button
                key={index}
                onClick={() => setCurrentReviewIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                index === currentReviewIndex ?
                'bg-yellow-400 w-8' :
                'bg-gray-300 hover:bg-gray-400'}`
                }
                aria-label={`Go to review ${index + 1}`} />

              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12">
        <div className="max-w-7xl mx-auto px-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {/* Column 1: Brand */}
            <div>
              <h3 style={{
                fontFamily: '"Right Grotesk Spatial", sans-serif',
                color: 'rgb(255, 255, 255)'
              }}>
                SCUZI
              </h3>
              <p style={{ color: 'rgb(209, 213, 219)' }}>
                Your home for easy, delicious meal prep recipes powered by AI.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h3 style={{
                fontFamily: '"Right Grotesk Spatial", sans-serif',
                color: 'rgb(255, 255, 255)'
              }}>
                Quick Links
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/" className="hover:text-white transition-colors" style={{
                    color: 'rgb(209, 213, 219)'
                  }}>
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/plan-ahead" className="hover:text-white transition-colors" style={{
                    color: 'rgb(209, 213, 219)'
                  }}>
                    Plan Ahead
                  </Link>
                </li>
                <li>
                  <Link href="/pantry" className="hover:text-white transition-colors" style={{
                    color: 'rgb(209, 213, 219)'
                  }}>
                    Pantry
                  </Link>
                </li>
                <li>
                  <Link href="/account" className="hover:text-white transition-colors" style={{
                    color: 'rgb(209, 213, 219)'
                  }}>
                    Account
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Legal */}
            <div>
              <h3 style={{
                fontFamily: '"Right Grotesk Spatial", sans-serif',
                color: 'rgb(255, 255, 255)'
              }}>
                Legal
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#" className="hover:text-white transition-colors" style={{
                    color: 'rgb(209, 213, 219)'
                  }}>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors" style={{
                    color: 'rgb(209, 213, 219)'
                  }}>
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors" style={{
                    color: 'rgb(209, 213, 219)'
                  }}>
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright Section with Divider */}
          <div className="pt-8" style={{ borderTop: '1px solid #1f1f1f' }}>
            <p className="text-center text-xs text-disabled">
              © 2025 Scuzi Health AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* History Detail Dialog */}
      <HistoryDetailDialog
        item={selectedHistoryItem}
        open={dialogOpen}
        onOpenChange={setDialogOpen} />

    </div>
  );
}