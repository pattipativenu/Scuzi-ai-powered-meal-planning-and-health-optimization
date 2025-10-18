import { useState, useEffect } from "react";

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

export function useCurrentWeekMeals() {
  const [meals, setMeals] = useState<GeneratedMeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentWeekMeals();
  }, []);

  const fetchCurrentWeekMeals = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/meals/current-week");
      const data = await response.json();

      if (data.status === "success") {
        setMeals(data.meals || []);
      } else {
        setError(data.message || "Failed to fetch meals");
      }
    } catch (err) {
      console.error("Error fetching current week meals:", err);
      setError("Failed to fetch meals");
    } finally {
      setIsLoading(false);
    }
  };

  return { meals, isLoading, error, refetch: fetchCurrentWeekMeals };
}