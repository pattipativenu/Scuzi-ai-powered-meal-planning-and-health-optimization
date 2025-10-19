"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";
import type { Meal } from "@/types/meal";
import { motion } from "framer-motion";

interface MealCardProps {
  meal: Meal;
  size?: "small" | "medium" | "large";
}

export const MealCard = ({ meal, size = "medium" }: MealCardProps) => {
  // Responsive sizing based on size prop
  const imageHeight = size === "small" ? "h-[160px]" : size === "large" ? "h-[280px]" : "h-[240px]";
  const padding = size === "small" ? "p-3" : "p-4";
  const titleSize = size === "small" ? "text-base" : "text-lg";
  const descSize = size === "small" ? "text-xs" : "text-sm";
  const metaSize = size === "small" ? "text-[10px]" : "text-xs";
  const iconSize = size === "small" ? "w-3 h-3" : "w-4 h-4";
  const badgePadding = size === "small" ? "px-1.5 py-0.5" : "px-2 py-1";

  return (
    <Link href={`/meal/${meal.id}`}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="bg-card rounded-[20px] overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-border flex flex-col h-full"
      >
        <div className={`relative bg-muted ${imageHeight}`}>
          <Image
            src={meal.image}
            alt={meal.name}
            fill
            className="object-cover w-full h-full"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        </div>
        <div className={`${padding} flex-1 flex flex-col`}>
          <h3 
            className={`font-semibold ${titleSize} mb-2 line-clamp-2`}
            style={{
              fontFamily: '"Right Grotesk Wide", sans-serif',
              color: 'rgb(39, 39, 42)'
            }}
          >
            {meal.name}
          </h3>
          <p 
            className={`${descSize} text-muted-foreground mb-3 line-clamp-2 flex-1`}
            style={{
              fontFamily: '"General Sans", sans-serif',
              color: 'rgb(107, 114, 128)'
            }}
          >
            {meal.description}
          </p>
          <div className={`flex items-center gap-2 ${metaSize} text-muted-foreground`}>
            <Clock className={iconSize} />
            <span style={{ fontFamily: '"General Sans", sans-serif' }}>
              {meal.prepTime + meal.cookTime} min
            </span>
            <span 
              className={`ml-auto ${metaSize} ${badgePadding} bg-secondary rounded-full font-medium`}
              style={{
                fontFamily: '"General Sans", sans-serif',
                color: 'rgb(39, 39, 42)'
              }}
            >
              {meal.nutrition.calories} cal
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};