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
  return (
    <Link href={`/meal/${meal.id}`}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="bg-card rounded-[20px] overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-border flex flex-col h-full"
      >
        <div className="relative bg-muted h-[240px]">
          <Image
            src={meal.image}
            alt={meal.name}
            fill
            className="object-cover w-full h-full"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{meal.name}</h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2 flex-1">
            {meal.description}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{meal.prepTime + meal.cookTime} min</span>
            <span className="ml-auto text-xs px-2 py-1 bg-secondary rounded-full">
              {meal.nutrition.calories} cal
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};