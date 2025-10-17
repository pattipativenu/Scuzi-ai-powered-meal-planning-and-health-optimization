="use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Clock, ChefHat, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Recipe {
  recipe_id: string;
  meal_name: string;
  servings: number;
  meal_type: string;
  ingredients: Array<{ name: string; quantity: number; unit: string }>;
  instructions: string[];
  nutrition_table: {
    calories: string;
    protein: string;
    carbohydrates: string;
    fat: string;
    fiber: string;
    sugar: string;
  };
  prep_time_minutes: number;
  cook_time_minutes: number;
  image_s3_url: string;
}

export default function GenerateRecipePage() {
  const params = useParams();
  const router = useRouter();
  const query = decodeURIComponent(params.query as string);
  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function generateRecipe() {
      try {
        const response = await fetch("/api/recipes/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate recipe");
        }

        const data = await response.json();
        setRecipe(data.recipe);
      } catch (err) {
        console.error("Recipe generation failed:", err);
        setError(err instanceof Error ? err.message : "Failed to generate recipe");
      } finally {
        setLoading(false);
      }
    }

    generateRecipe();
  }, [query]);

  // Full-screen loading state
  if (loading) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ backgroundColor: "rgb(247, 248, 212)" }}
      >
        <div className="text-center space-y-6 max-w-md px-4">
          <Loader2 
            className="w-20 h-20 animate-spin mx-auto" 
            style={{ color: "rgb(39, 39, 42)" }}
          />
          <div className="space-y-3">
            <h1 
              className="text-4xl font-semibold"
              style={{ 
                fontFamily: '"Right Grotesk Spatial", ui-sans-serif, system-ui, sans-serif',
                fontWeight: 500,
                color: "rgb(39, 39, 42)"
              }}
            >
              Generating your recipe… 🍳
            </h1>
            <p 
              className="text-lg"
              style={{ 
                fontFamily: '"Right Grotesk Wide", ui-sans-serif, system-ui, sans-serif',
                color: "rgb(63, 63, 70)"
              }}
            >
              Please wait while Claude creates your personalized meal for<br />
              <strong>"{query}"</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !recipe) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-6xl">😞</div>
          <h2 className="text-2xl font-bold">Failed to generate recipe</h2>
          <p className="text-muted-foreground">{error || "Please try again."}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Recipe display
  return (
    <div className="min-h-screen bg-background">
      {/* Header with Back Button */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>

      {/* Recipe Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Title and Meta */}
        <div className="space-y-4">
          <h1 
            className="text-5xl font-bold"
            style={{ fontFamily: '"Right Grotesk Spatial", ui-sans-serif, system-ui, sans-serif' }}
          >
            {recipe.meal_name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <ChefHat className="w-4 h-4" />
              {recipe.meal_type}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Prep: {recipe.prep_time_minutes} min
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Cook: {recipe.cook_time_minutes} min
            </span>
            <span>Servings: {recipe.servings}</span>
          </div>
        </div>

        {/* Image */}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted">
          <Image
            src={recipe.image_s3_url}
            alt={recipe.meal_name}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Ingredients */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold" style={{ fontFamily: '"Right Grotesk Spatial", ui-sans-serif' }}>
            Ingredients
          </h2>
          <ul className="space-y-2 bg-card border border-border rounded-lg p-6">
            {recipe.ingredients.map((ingredient, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>
                  <strong>{ingredient.name}</strong> — {ingredient.quantity} {ingredient.unit}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Instructions */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold" style={{ fontFamily: '"Right Grotesk Spatial", ui-sans-serif' }}>
            Instructions
          </h2>
          <ol className="space-y-4">
            {recipe.instructions.map((step, idx) => (
              <li key={idx} className="flex gap-4">
                <span 
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm"
                >
                  {idx + 1}
                </span>
                <p className="flex-1 pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Nutrition Table */}
        <section className="space-y-4">
          <h2 className="text-3xl font-semibold" style={{ fontFamily: '"Right Grotesk Spatial", ui-sans-serif' }}>
            Nutrition Information
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Object.entries(recipe.nutrition_table).map(([key, value]) => (
              <div 
                key={key}
                className="bg-card border border-border rounded-lg p-4 text-center"
              >
                <div className="text-2xl font-bold text-primary">{value}</div>
                <div className="text-sm text-muted-foreground capitalize mt-1">
                  {key}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer Actions */}
        <div className="flex gap-4 pt-8 border-t border-border">
          <Link
            href="/"
            className="flex-1 py-3 px-6 bg-primary text-primary-foreground rounded-lg text-center hover:opacity-90 transition-opacity font-semibold"
          >
            Back to Home
          </Link>
          <Link
            href="/account"
            className="flex-1 py-3 px-6 bg-secondary text-secondary-foreground rounded-lg text-center hover:opacity-90 transition-opacity font-semibold"
          >
            View History
          </Link>
        </div>
      </div>
    </div>
  );
}