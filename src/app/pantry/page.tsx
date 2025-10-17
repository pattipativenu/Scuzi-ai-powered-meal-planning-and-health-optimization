"use client";

import { useState, useMemo } from "react";
import { nextWeekMeals } from "@/lib/mockMeals";
import { Refrigerator, Snowflake, Package, ShoppingCart } from "lucide-react";

export default function PantryPage() {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  // Aggregate all ingredients from next week's meals
  const ingredients = useMemo(() => {
    const ingredientMap = new Map<string, { name: string; amount: string; category: string }>();

    Object.values(nextWeekMeals).forEach((dayMeals) => {
      Object.values(dayMeals).forEach((meal) => {
        if (meal) {
          meal.ingredients.forEach((ingredient) => {
            const key = `${ingredient.category}-${ingredient.name}`;
            if (ingredientMap.has(key)) {
              // If ingredient already exists, you could combine amounts
              // For simplicity, we'll just keep the first occurrence
            } else {
              ingredientMap.set(key, {
                name: ingredient.name,
                amount: ingredient.amount,
                category: ingredient.category,
              });
            }
          });
        }
      });
    });

    // Group by category
    const grouped = {
      freezer: [] as typeof Array.prototype,
      fridge: [] as typeof Array.prototype,
      cupboard: [] as typeof Array.prototype,
    };

    ingredientMap.forEach((ingredient, key) => {
      grouped[ingredient.category as keyof typeof grouped].push({ ...ingredient, key });
    });

    return grouped;
  }, []);

  const toggleItem = (key: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(key)) {
      newChecked.delete(key);
    } else {
      newChecked.add(key);
    }
    setCheckedItems(newChecked);
  };

  const createShoppingList = () => {
    const uncheckedItems = Array.from(
      new Set([
        ...ingredients.freezer.map((i) => i.key),
        ...ingredients.fridge.map((i) => i.key),
        ...ingredients.cupboard.map((i) => i.key),
      ])
    ).filter((key) => !checkedItems.has(key));

    if (uncheckedItems.length === 0) {
      alert("All items are already available! No shopping list needed.");
    } else {
      alert(`Shopping list created with ${uncheckedItems.length} items!`);
    }
  };

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    items: Array<{ key: string; name: string; amount: string }>
  ) => (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-3 p-2 hover:bg-secondary/50 rounded transition-colors">
            <input
              type="checkbox"
              id={item.key}
              checked={checkedItems.has(item.key)}
              onChange={() => toggleItem(item.key)}
              className="w-5 h-5 rounded border-border accent-primary cursor-pointer"
            />
            <label htmlFor={item.key} className="flex-1 cursor-pointer">
              <span className="font-medium">{item.name}</span>
              <span className="text-sm text-muted-foreground ml-2">— {item.amount}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Pantry</h1>
          <p className="text-lg text-muted-foreground">
            All ingredients needed for next week's meals. Check off items you already have.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Items</p>
            <p className="text-2xl font-bold">
              {ingredients.freezer.length + ingredients.fridge.length + ingredients.cupboard.length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Already Have</p>
            <p className="text-2xl font-bold text-primary">{checkedItems.size}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Need to Buy</p>
            <p className="text-2xl font-bold text-destructive">
              {ingredients.freezer.length +
                ingredients.fridge.length +
                ingredients.cupboard.length -
                checkedItems.size}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-center">
            <button
              onClick={createShoppingList}
              className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Create Shopping List
            </button>
          </div>
        </div>

        {/* Ingredient Sections */}
        <div className="space-y-6">
          {renderSection(
            "Freezer Items",
            <Snowflake className="w-6 h-6 text-primary" />,
            ingredients.freezer
          )}
          {renderSection(
            "Fridge Items",
            <Refrigerator className="w-6 h-6 text-primary" />,
            ingredients.fridge
          )}
          {renderSection(
            "Cupboard Items",
            <Package className="w-6 h-6 text-primary" />,
            ingredients.cupboard
          )}
        </div>
      </div>
    </div>
  );
}