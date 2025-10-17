import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, Users, ChefHat } from "lucide-react";
import { mockMeals } from "@/lib/mockMeals";

interface MealDetailPageProps {
  params: {
    mealId: string;
  };
}

export default function MealDetailPage({ params }: MealDetailPageProps) {
  const meal = mockMeals[params.mealId];

  if (!meal) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Week
        </Link>

        {/* Hero Image */}
        <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden mb-8">
          <Image
            src={meal.image}
            alt={meal.name}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Title and Description */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{meal.name}</h1>
          <p className="text-lg text-muted-foreground">{meal.description}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm">Prep Time</span>
            </div>
            <p className="text-2xl font-semibold">{meal.prepTime} min</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <ChefHat className="w-5 h-5" />
              <span className="text-sm">Cook Time</span>
            </div>
            <p className="text-2xl font-semibold">{meal.cookTime} min</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Users className="w-5 h-5" />
              <span className="text-sm">Servings</span>
            </div>
            <p className="text-2xl font-semibold">{meal.servings}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <span className="text-sm">Calories</span>
            </div>
            <p className="text-2xl font-semibold">{meal.nutrition.calories}</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Ingredients */}
          <div className="md:col-span-1">
            <h2 className="text-2xl font-bold mb-4">Ingredients</h2>
            <div className="bg-card border border-border rounded-lg p-6">
              <ul className="space-y-3">
                {meal.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium">{ingredient.amount}</span>
                      <span className="text-muted-foreground ml-2">{ingredient.name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Instructions */}
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold mb-4">Instructions</h2>
            <div className="bg-card border border-border rounded-lg p-6">
              <ol className="space-y-4">
                {meal.instructions.map((instruction, index) => (
                  <li key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    <p className="flex-1 pt-1">{instruction}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Nutrition Table */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Nutrition Information</h2>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-semibold">Nutrient</th>
                  <th className="text-right p-4 font-semibold">Amount per Serving</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="p-4">Calories</td>
                  <td className="p-4 text-right font-semibold">{meal.nutrition.calories} kcal</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-4">Protein</td>
                  <td className="p-4 text-right font-semibold">{meal.nutrition.protein}g</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-4">Carbohydrates</td>
                  <td className="p-4 text-right font-semibold">{meal.nutrition.carbs}g</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-4">Fat</td>
                  <td className="p-4 text-right font-semibold">{meal.nutrition.fat}g</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}