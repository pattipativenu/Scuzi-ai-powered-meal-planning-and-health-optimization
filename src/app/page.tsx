"use client";

import { MealCard } from "@/components/MealCard";
import { AnimatedHeroSection } from "@/components/AnimatedHeroSection";
import { currentWeekMeals, healthySnacks, breakfastRecipes, freezableDinners } from "@/lib/mockMeals";
import { ChevronRight, Star } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { addDays, format } from "date-fns";

export default function Home() {
  // Calculate dates dynamically
  const getCurrentWeekDates = () => {
    const today = new Date();
    return [
      { day: "Monday", date: format(today, "d MMM"), nextWeekDate: format(addDays(today, 7), "d MMM") },
      { day: "Tuesday", date: format(addDays(today, 1), "d MMM"), nextWeekDate: format(addDays(today, 8), "d MMM") },
      { day: "Wednesday", date: format(addDays(today, 2), "d MMM"), nextWeekDate: format(addDays(today, 9), "d MMM") },
      { day: "Thursday", date: format(addDays(today, 3), "d MMM"), nextWeekDate: format(addDays(today, 10), "d MMM") },
      { day: "Friday", date: format(addDays(today, 4), "d MMM"), nextWeekDate: format(addDays(today, 11), "d MMM") },
      { day: "Saturday", date: format(addDays(today, 5), "d MMM"), nextWeekDate: format(addDays(today, 12), "d MMM") },
      { day: "Sunday", date: format(addDays(today, 6), "d MMM"), nextWeekDate: format(addDays(today, 13), "d MMM") }
    ];
  };

  const daysOfWeek = getCurrentWeekDates();
  const mealTypes = ["breakfast", "lunch", "snack", "dinner"] as const;

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
    }, 5000); // Change review every 5 seconds

    return () => clearInterval(interval);
  }, [reviews.length]);

  // Mock history data (would come from API in production)
  const historyRecipes = [
  ...healthySnacks,
  ...breakfastRecipes,
  ...freezableDinners];


  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(255, 255, 255)' }}>
      {/* Hero Section */}
      <AnimatedHeroSection />

      {/* Current Week's Meals */}
      <section className="py-16" style={{ backgroundColor: 'rgb(255, 255, 255)' }}>
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-baseline justify-between mb-12">
            <h2 className="!font-semibold !text-3xl">
              Current Week's Meals
            </h2>
            <Link
              href="/plan-ahead"
              style={{
                fontFamily: '"Right Grotesk Wide", sans-serif',
                fontWeight: 500,
                fontSize: '16px',
                lineHeight: '24px',
                color: 'rgb(39, 39, 42)'
              }}
              className="hover:underline flex items-center gap-1 !font-semibold"
            >
              View Next Week Meals
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Desktop & Tablet: Vertical Days with Horizontal Meals */}
          <div className="hidden md:block space-y-10">
            {daysOfWeek.map(({ day, date, nextWeekDate }) => (
              <div key={day}>
                <div className="flex items-baseline gap-3 mb-6">
                  <h3 
                    style={{
                      fontFamily: '"Right Grotesk Wide", sans-serif',
                      fontWeight: 500,
                      fontSize: '16px',
                      color: 'rgb(39, 39, 42)'
                    }}
                  >
                    {day}, {date}
                  </h3>
                  <span 
                    style={{
                      fontFamily: '"Right Grotesk Wide", sans-serif',
                      fontWeight: 500,
                      fontSize: '16px',
                      color: 'rgb(39, 39, 42)',
                      opacity: 0.7
                    }}
                  >
                    | Next Week: {nextWeekDate}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {mealTypes.map((mealType) => {
                    const meal = currentWeekMeals[day]?.[mealType];
                    return meal ? (
                      <MealCard key={`${day}-${mealType}`} meal={meal} size="medium" />
                    ) : (
                      <div 
                        key={`${day}-${mealType}`} 
                        className="h-full min-h-[320px] bg-gray-100 rounded-[20px] flex items-center justify-center" 
                        style={{
                          fontFamily: '"General Sans", sans-serif',
                          fontSize: '15px',
                          lineHeight: '21px',
                          color: 'rgb(163, 163, 163)'
                        }}
                      >
                        No {mealType}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile: Keep existing mobile layout */}
          <div className="md:hidden space-y-6">
            {daysOfWeek.map(({ day, date }) => (
              <div key={day}>
                <h3 className="text-lg font-semibold mb-3 px-2">{day}, {date}</h3>
                <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                  {mealTypes.map((mealType) => {
                    const meal = currentWeekMeals[day]?.[mealType];
                    return meal ? (
                      <div key={`${day}-${mealType}`} className="snap-start flex-shrink-0 w-64">
                        <MealCard meal={meal} size="medium" />
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="py-16" style={{ backgroundColor: 'rgb(255, 255, 255)' }}>
        <div className="max-w-[1400px] mx-auto px-6">
          <h2 
            style={{
              fontFamily: '"Right Grotesk Spatial", sans-serif',
              fontWeight: 500,
              fontSize: '30px',
              lineHeight: '36px',
              color: 'rgb(39, 39, 42)',
              marginBottom: '32px'
            }}
          >
            History
          </h2>
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {historyRecipes.map((recipe) => (
              <div key={recipe.id} className="flex-shrink-0 w-64">
                <MealCard meal={recipe} size="medium" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Reviews Carousel */}
      <section className="py-16" style={{ backgroundColor: 'rgb(255, 255, 255)' }}>
        <div className="max-w-4xl mx-auto px-20">
          <div className="relative rounded-2xl shadow-lg p-12 text-center min-h-[280px] flex flex-col justify-center" style={{ backgroundColor: 'rgb(255, 255, 255)' }}>
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) =>
              <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
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
                  fontFamily: '"General Sans", sans-serif',
                  fontWeight: 400,
                  fontSize: '15px',
                  lineHeight: '21px',
                  color: 'rgb(17, 24, 39)',
                  marginBottom: '24px',
                  maxWidth: '600px',
                  margin: '0 auto 24px'
                }}>
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
                    <p style={{
                    fontFamily: '"Right Grotesk Wide", sans-serif',
                    fontWeight: 500,
                    fontSize: '16px',
                    lineHeight: '24px',
                    color: 'rgb(39, 39, 42)'
                  }}>
                      {review.name}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Carousel Indicators */}
            <div className="flex justify-center gap-2 mt-8">
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
                fontWeight: 500,
                fontSize: '30px',
                lineHeight: '36px',
                color: 'rgb(255, 255, 255)',
                marginBottom: '16px'
              }}>
                SCUZI
              </h3>
              <p style={{
                fontFamily: '"General Sans", sans-serif',
                fontWeight: 400,
                fontSize: '15px',
                lineHeight: '21px',
                color: 'rgb(209, 213, 219)'
              }}>
                Your home for easy, delicious meal prep recipes powered by AI.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h3 style={{
                fontFamily: '"Right Grotesk Spatial", sans-serif',
                fontWeight: 500,
                fontSize: '30px',
                lineHeight: '36px',
                color: 'rgb(255, 255, 255)',
                marginBottom: '16px'
              }}>
                Quick Links
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/" className="hover:text-white transition-colors" style={{
                    fontFamily: '"General Sans", sans-serif',
                    fontWeight: 400,
                    fontSize: '15px',
                    lineHeight: '21px',
                    color: 'rgb(209, 213, 219)'
                  }}>
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/plan-ahead" className="hover:text-white transition-colors" style={{
                    fontFamily: '"General Sans", sans-serif',
                    fontWeight: 400,
                    fontSize: '15px',
                    lineHeight: '21px',
                    color: 'rgb(209, 213, 219)'
                  }}>
                    Plan Ahead
                  </Link>
                </li>
                <li>
                  <Link href="/pantry" className="hover:text-white transition-colors" style={{
                    fontFamily: '"General Sans", sans-serif',
                    fontWeight: 400,
                    fontSize: '15px',
                    lineHeight: '21px',
                    color: 'rgb(209, 213, 219)'
                  }}>
                    Pantry
                  </Link>
                </li>
                <li>
                  <Link href="/account" className="hover:text-white transition-colors" style={{
                    fontFamily: '"General Sans", sans-serif',
                    fontWeight: 400,
                    fontSize: '15px',
                    lineHeight: '21px',
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
                fontWeight: 500,
                fontSize: '30px',
                lineHeight: '36px',
                color: 'rgb(255, 255, 255)',
                marginBottom: '16px'
              }}>
                Legal
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#" className="hover:text-white transition-colors" style={{
                    fontFamily: '"General Sans", sans-serif',
                    fontWeight: 400,
                    fontSize: '15px',
                    lineHeight: '21px',
                    color: 'rgb(209, 213, 219)'
                  }}>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors" style={{
                    fontFamily: '"General Sans", sans-serif',
                    fontWeight: 400,
                    fontSize: '15px',
                    lineHeight: '21px',
                    color: 'rgb(209, 213, 219)'
                  }}>
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors" style={{
                    fontFamily: '"General Sans", sans-serif',
                    fontWeight: 400,
                    fontSize: '15px',
                    lineHeight: '21px',
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
            <p className="text-center" style={{
              fontFamily: '"General Sans", sans-serif',
              fontWeight: 400,
              fontSize: '13px',
              color: 'rgb(163, 163, 163)'
            }}>
              © 2025 Scuzi Health AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}