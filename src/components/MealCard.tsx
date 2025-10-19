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
  // Enhanced responsive sizing for mobile-first design
  const imageHeight = size === "small" ? "h-[180px]" : size === "large" ? "h-[280px]" : "h-[240px]";
  const padding = size === "small" ? "p-4" : "p-4";
  const titleSize = size === "small" ? "text-base" : "text-lg";
  const descSize = size === "small" ? "text-sm" : "text-sm";
  const metaSize = size === "small" ? "text-xs" : "text-xs";
  const iconSize = size === "small" ? "w-3.5 h-3.5" : "w-4 h-4";
  const badgePadding = size === "small" ? "px-2 py-0.5" : "px-2 py-1";

  return (
    <Link href={`/meal/${meal.id}`}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="bg-card rounded-[16px] overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-border flex flex-col h-full"
      >
        <div className={`relative bg-muted ${imageHeight}`}>
          <Image
            src={meal.image}
            alt={meal.name}
            fill
            className="object-cover w-full h-full"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            priority={false}
          />
        </div>
        <div className={`${padding} flex-1 flex flex-col gap-2`}>
          <h3 
            className={`font-semibold ${titleSize} line-clamp-2`}
            style={{
              fontFamily: '"Right Grotesk Wide", sans-serif',
              color: 'rgb(39, 39, 42)'
            }}
          >
            {meal.name}
          </h3>
          <p 
            className={`${descSize} text-muted-foreground line-clamp-2 flex-1`}
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