import { notFound } from "next/navigation";
import { Clock, ChefHat, Utensils, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface RecipeData {
  recipe_id: string;
  title: string;
  meal_type: string;
  ingredients: string[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  prep_time: string;
  cook_time: string;
  image_s3_url: string;
  created_at: string;
}

async function getRecipe(recipeId: string): Promise<RecipeData | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/recipes/${recipeId}`,
      { cache: "no-store" }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.recipe;
  } catch (error) {
    console.error("Error fetching recipe:", error);
    return null;
  }
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ recipeId: string }>;
}) {
  const { recipeId } = await params;
  const recipe = await getRecipe(recipeId);

  if (!recipe) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* Recipe Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
              {recipe.meal_type}
            </span>
          </div>
          <h1 className="text-4xl font-bold mb-4">{recipe.title}</h1>
          <div className="flex items-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Prep: {recipe.prep_time}</span>
            </div>
            <div className="flex items-center gap-2">
              <ChefHat className="w-4 h-4" />
              <span className="text-sm">Cook: {recipe.cook_time}</span>
            </div>
          </div>
        </div>

        {/* Recipe Image */}
        <div className="mb-8 rounded-lg overflow-hidden bg-card border border-border">
          <div className="relative w-full h-[400px]">
            <Image
              src={recipe.image_s3_url}
              alt={recipe.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Ingredients & Nutrition */}
          <div className="lg:col-span-1 space-y-6">
            {/* Ingredients */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Utensils className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Ingredients</h2>
              </div>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-muted-foreground"
                  >
                    <span className="text-primary mt-1">•</span>
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Nutrition */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Nutrition Facts</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-border">
                  <span className="text-muted-foreground">Calories</span>
                  <span className="font-semibold">{recipe.nutrition.calories}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border">
                  <span className="text-muted-foreground">Protein</span>
                  <span className="font-semibold">{recipe.nutrition.protein}g</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border">
                  <span className="text-muted-foreground">Fat</span>
                  <span className="font-semibold">{recipe.nutrition.fat}g</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Carbs</span>
                  <span className="font-semibold">{recipe.nutrition.carbs}g</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Instructions */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Instructions</h2>
              <ol className="space-y-4">
                {recipe.instructions.map((instruction, index) => (
                  <li key={index} className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </span>
                    <p className="text-muted-foreground pt-1">{instruction}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}