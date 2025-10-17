import { MealCard } from "@/components/MealCard";
import { AnimatedHeroSection } from "@/components/AnimatedHeroSection";
import { currentWeekMeals, healthySnacks, breakfastRecipes, freezableDinners } from "@/lib/mockMeals";
import { ChevronRight, Star, Users } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const mealTypes = ["breakfast", "lunch", "snack", "dinner"] as const;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Animated with AWS Titan Generated Images */}
      <AnimatedHeroSection />

      {/* Current Week's Meals */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Current Week's Meals</h2>
            <Link
              href="/plan-ahead"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View Next Week
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Desktop: Vertical Days with Horizontal Meals */}
          <div className="hidden md:block space-y-8">
            {daysOfWeek.map((day) => (
              <div key={day} className="border-l-4 border-primary pl-6">
                <h3 className="text-xl font-semibold mb-4">{day}</h3>
                <div className="grid grid-cols-4 gap-4">
                  {mealTypes.map((mealType) => {
                    const meal = currentWeekMeals[day]?.[mealType];
                    return meal ? (
                      <MealCard key={`${day}-${mealType}`} meal={meal} size="small" />
                    ) : (
                      <div key={`${day}-${mealType}`} className="w-48 h-64 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                        No {mealType}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile: Horizontal Scroll per Day */}
          <div className="md:hidden space-y-6">
            {daysOfWeek.map((day) => (
              <div key={day}>
                <h3 className="text-lg font-semibold mb-3 px-2">{day}</h3>
                <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                  {mealTypes.map((mealType) => {
                    const meal = currentWeekMeals[day]?.[mealType];
                    return meal ? (
                      <div key={`${day}-${mealType}`} className="snap-start flex-shrink-0">
                        <MealCard meal={meal} size="small" />
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Healthy Snacks Section */}
      <section className="py-16 bg-secondary/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">Healthy Snacks</h2>
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {healthySnacks.map((snack) => (
              <div key={snack.id} className="flex-shrink-0">
                <MealCard meal={snack} size="medium" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Breakfast Recipes Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">Breakfast Recipes</h2>
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {breakfastRecipes.map((recipe) => (
              <div key={recipe.id} className="flex-shrink-0">
                <MealCard meal={recipe} size="medium" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-secondary/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-3 bg-primary/10 px-6 py-3 rounded-full mb-4">
            <Users className="w-5 h-5 text-primary" />
            <span className="font-semibold">Used and loved by over 100,000 home cooks</span>
          </div>
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 fill-primary text-primary" />
            ))}
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            "This app has completely transformed how I approach meal planning. I save so much time and money, and my family loves the variety!"
          </p>
        </div>
      </section>

      {/* Most Freezable Dinners */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">Most Freezable Dinners</h2>
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {freezableDinners.map((dinner) => (
              <div key={dinner.id} className="flex-shrink-0">
                <MealCard meal={dinner} size="medium" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-4">About</h3>
              <p className="text-sm text-muted-foreground">
                MealPrep helps you plan delicious, healthy meals with ease.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/" className="hover:text-foreground">Home</Link></li>
                <li><Link href="/plan-ahead" className="hover:text-foreground">Plan Ahead</Link></li>
                <li><Link href="/pantry" className="hover:text-foreground">Pantry</Link></li>
                <li><Link href="/account" className="hover:text-foreground">Account</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-foreground">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} MealPrep. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}