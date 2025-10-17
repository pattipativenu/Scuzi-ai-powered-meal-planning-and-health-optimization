import { MealCard } from "@/components/MealCard";
import { nextWeekMeals } from "@/lib/mockMeals";
import { Calendar, Clock, Flame } from "lucide-react";

export default function PlanAheadPage() {
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const mealTypes = ["breakfast", "lunch", "snack", "dinner"] as const;

  // Calculate summary stats
  const totalMeals = daysOfWeek.reduce((count, day) => {
    return count + Object.keys(nextWeekMeals[day] || {}).length;
  }, 0);

  const totalPrepTime = daysOfWeek.reduce((time, day) => {
    const dayMeals = nextWeekMeals[day] || {};
    return time + Object.values(dayMeals).reduce((dayTime, meal) => {
      return dayTime + (meal?.prepTime || 0) + (meal?.cookTime || 0);
    }, 0);
  }, 0);

  const totalCalories = daysOfWeek.reduce((cals, day) => {
    const dayMeals = nextWeekMeals[day] || {};
    return cals + Object.values(dayMeals).reduce((dayCals, meal) => {
      return dayCals + (meal?.nutrition.calories || 0);
    }, 0);
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Plan Ahead</h1>
          <p className="text-lg text-muted-foreground">
            Next week's meal plan to help you stay organized and prepared
          </p>
        </div>

        {/* Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total Meals</span>
            </div>
            <p className="text-3xl font-bold">{totalMeals}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Estimated Prep Time</span>
            </div>
            <p className="text-3xl font-bold">{Math.round(totalPrepTime / 60)}h {totalPrepTime % 60}m</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Weekly Calories</span>
            </div>
            <p className="text-3xl font-bold">{totalCalories.toLocaleString()}</p>
          </div>
        </div>

        {/* Week Toggle */}
        <div className="flex gap-2 mb-8">
          <button className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium">
            Next Week
          </button>
          <button className="px-4 py-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors">
            Current Week
          </button>
        </div>

        {/* Next Week's Meals */}
        <div className="space-y-8">
          {/* Desktop: Vertical Days with Horizontal Meals */}
          <div className="hidden md:block">
            {daysOfWeek.map((day) => (
              <div key={day} className="border-l-4 border-primary pl-6 mb-8">
                <h3 className="text-xl font-semibold mb-4">{day}</h3>
                <div className="grid grid-cols-4 gap-4">
                  {mealTypes.map((mealType) => {
                    const meal = nextWeekMeals[day]?.[mealType];
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
                    const meal = nextWeekMeals[day]?.[mealType];
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
      </div>
    </div>
  );
}