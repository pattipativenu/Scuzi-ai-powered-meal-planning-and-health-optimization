"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function GenerateRecipe() {
  const params = useParams();
  const query = params.query as string;
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecipe() {
      try {
        const res = await fetch("/api/recipes/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: decodeURIComponent(query) }),
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to generate recipe");
        }
        
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Recipe generation failed:", err);
        setError(err instanceof Error ? err.message : "Failed to generate recipe");
      } finally {
        setLoading(false);
      }
    }
    
    if (query) {
      fetchRecipe();
    }
  }, [query]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen" style={{ backgroundColor: "rgb(247, 248, 212)" }}>
        <h1 className="text-3xl font-semibold mb-4 font-heading">Generating your recipe… 🍳</h1>
        <p className="text-muted-foreground">Please wait while Claude 3.5 Sonnet creates your personalized meal.</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-destructive mb-4">{error || "Failed to generate recipe. Please try again."}</p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const recipe = data.recipe;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6 font-heading">{recipe.meal_name}</h1>
        
        {recipe.image_url && (
          <img 
            src={recipe.image_url} 
            alt={recipe.meal_name} 
            className="rounded-xl mb-6 w-full object-cover max-h-96"
          />
        )}
        
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">Meal Type:</span> {recipe.meal_type} • 
            <span className="font-semibold ml-2">Servings:</span> {recipe.servings} • 
            <span className="font-semibold ml-2">Prep:</span> {recipe.prep_time_minutes} min • 
            <span className="font-semibold ml-2">Cook:</span> {recipe.cook_time_minutes} min
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 font-heading">Ingredients</h2>
          <ul className="space-y-2">
            {recipe.ingredients.map((ingredient: any, idx: number) => (
              <li key={idx} className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  {ingredient.name} — {ingredient.quantity} {ingredient.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 font-heading">Instructions</h2>
          <ol className="space-y-3 list-decimal list-inside">
            {recipe.instructions.map((step: string, idx: number) => (
              <li key={idx} className="leading-relaxed">{step}</li>
            ))}
          </ol>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 font-heading">Nutrition Table</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(recipe.nutrition_table).map(([key, value]) => (
                <div key={key}>
                  <p className="text-sm text-muted-foreground capitalize">{key}</p>
                  <p className="text-lg font-semibold">{value as string}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push("/")}
          className="w-full md:w-auto px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}