"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, Star } from "lucide-react";
import type { Meal } from "@/types/meal";
import { motion } from "framer-motion";

interface MealCardProps {
  meal: Meal;
  size?: "small" | "medium" | "large";
}

export const MealCard = ({ meal, size = "medium" }: MealCardProps) => {
  // Enhanced responsive sizing for mobile-first design
  const imageHeight = size === "small" ? "h-[180px]" : size === "large" ? "h-[280px]" : "h-[240px]";
  const padding = size === "small" ? "p-4" : "p-4";
  const titleSize = size === "small" ? "text-base" : "text-lg";
  const descSize = size === "small" ? "text-sm" : "text-sm";
  const metaSize = size === "small" ? "text-xs" : "text-xs";
  const iconSize = size === "small" ? "w-3.5 h-3.5" : "w-4 h-4";
  const badgePadding = size === "small" ? "px-2 py-0.5" : "px-2 py-1";
  
  // Dummy rating for hackathon (4.5 stars)
  const rating = 4.5;
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  return (
    <Link href={`/meal/${meal.meal_id || meal.id || 'unknown'}`}>
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="bg-card rounded-[16px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-border flex flex-col h-full group"
      >
        <div className={`relative bg-muted ${imageHeight} overflow-hidden`}>
          {meal.image && meal.image !== "/placeholder-meal.jpg" && meal.image.trim() !== "" ? (
            <Image
              src={meal.image}
              alt={meal.name}
              fill
              className="object-cover w-full h-full transition-transform duration-300 hover:scale-110"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              priority={false}
              onError={(e) => {
                console.log(`❌ Image failed to load: ${meal.image}`);
                // Fallback to placeholder if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div class="w-full h-full flex flex-col items-center justify-center text-center p-4 bg-gray-100">
                      <div class="text-2xl mb-2">📷</div>
                      <div class="text-xs text-gray-500">Image Unavailable</div>
                    </div>
                  `;
                }
              }}
              onLoad={() => {
                console.log(`✅ Image loaded successfully: ${meal.name}`);
              }}
            />
          ) : (
            // 🎯 CLASS B MEAL PLACEHOLDER
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 bg-gray-100">
              <div className="text-2xl mb-2">📷</div>
              <div className="text-xs text-gray-500">Image Unavailable</div>
            </div>
          )}
        </div>
        <div className={`${padding} flex-1 flex flex-col gap-3 group-hover:translate-y-[-2px] transition-transform duration-300`}>
          <h4 className={`${titleSize} line-clamp-2 font-semibold`}>
            {meal.name}
          </h4>
          
          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < fullStars
                      ? "fill-yellow-400 text-yellow-400"
                      : i === fullStars && hasHalfStar
                      ? "fill-yellow-400/50 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-gray-700">{rating}</span>
          </div>

          {/* Tags */}
          {meal.tags && meal.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {meal.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium"
                >
                  {tag}
                </span>
              ))}
              {meal.tags.length > 3 && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full font-medium">
                  +{meal.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Description - more visible */}
          <p className={`${descSize} text-gray-600 line-clamp-2 flex-1 leading-relaxed`}>
            {meal.description}
          </p>
          
          {/* Prep time and calories */}
          <div className={`flex items-center justify-between ${metaSize} text-muted-foreground`}>
            <div className="flex items-center gap-1">
              <Clock className={iconSize} />
              <span className="font-medium">
                {meal.prepTime || (meal.prepTime === 0 ? 0 : 15)} min
              </span>
            </div>
            <span className={`${badgePadding} bg-green-100 text-green-800 rounded-full font-semibold`}>
              {meal.nutrition?.calories || 0} cal
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};