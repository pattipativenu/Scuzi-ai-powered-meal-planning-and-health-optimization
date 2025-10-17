"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";
import type { Meal } from "@/types/meal";

interface MealCardProps {
  meal: Meal;
  size?: "small" | "medium" | "large";
}

export const MealCard = ({ meal, size = "medium" }: MealCardProps) => {
  const sizeClasses = {
    small: "w-48 h-64",
    medium: "w-64 h-80",
    large: "w-80 h-96",
  };

  const imageSizes = {
    small: "h-32",
    medium: "h-48",
    large: "h-56",
  };

  return (
    <Link href={`/meal/${meal.id}`}>
      <div
        className={`${sizeClasses[size]} bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02] border border-border flex flex-col`}
      >
        <div className={`${imageSizes[size]} relative bg-muted`}>
          <Image
            src={meal.image}
            alt={meal.name}
            fill
            className="object-cover"
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
      </div>
    </Link>
  );
};