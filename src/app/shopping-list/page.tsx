"use client";

import { useState } from "react";
import { Refrigerator, Snowflake, Package, Check, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Category = "freezer" | "fridge" | "cupboard";

interface ShoppingItem {
  name: string;
  quantity: number;
  unit: string;
  category: Category;
  checked: boolean;
}

export default function ShoppingListPage() {
  const router = useRouter();
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([
    // Freezer items
    { name: "Frozen Chicken Thighs", quantity: 3, unit: "lbs", category: "freezer", checked: false },
    { name: "Frozen Mixed Vegetables", quantity: 2, unit: "bags", category: "freezer", checked: false },
    { name: "Vanilla Ice Cream", quantity: 1, unit: "pint", category: "freezer", checked: false },
    { name: "Frozen Strawberries", quantity: 1, unit: "bag", category: "freezer", checked: false },
    
    // Fridge items
    { name: "Whole Milk", quantity: 1, unit: "gallon", category: "fridge", checked: false },
    { name: "Plain Greek Yogurt", quantity: 4, unit: "cups", category: "fridge", checked: false },
    { name: "Mozzarella Cheese", quantity: 8, unit: "oz", category: "fridge", checked: false },
    { name: "Fresh Arugula", quantity: 1, unit: "bag", category: "fridge", checked: false },
    { name: "Organic Eggs", quantity: 18, unit: "pieces", category: "fridge", checked: false },
    { name: "Red Bell Peppers", quantity: 2, unit: "pieces", category: "fridge", checked: false },
    { name: "Baby Carrots", quantity: 1, unit: "bag", category: "fridge", checked: false },
    
    // Cupboard items
    { name: "Jasmine Rice", quantity: 2, unit: "lbs", category: "cupboard", checked: false },
    { name: "Extra Virgin Olive Oil", quantity: 1, unit: "bottle", category: "cupboard", checked: false },
    { name: "Chickpeas", quantity: 3, unit: "cans", category: "cupboard", checked: false },
    { name: "Rolled Oats", quantity: 1, unit: "container", category: "cupboard", checked: false },
    { name: "Raw Almonds", quantity: 1, unit: "bag", category: "cupboard", checked: false },
    { name: "Whole Wheat Pasta", quantity: 2, unit: "boxes", category: "cupboard", checked: false },
    { name: "Crushed Tomatoes", quantity: 4, unit: "cans", category: "cupboard", checked: false },
    { name: "Organic Honey", quantity: 1, unit: "jar", category: "cupboard", checked: false },
  ]);

  const toggleItem = (index: number) => {
    setShoppingItems(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const getCategoryIcon = (category: Category) => {
    switch (category) {
      case "freezer":
        return <Snowflake className="w-5 h-5" />;
      case "fridge":
        return <Refrigerator className="w-5 h-5" />;
      case "cupboard":
        return <Package className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: Category) => {
    switch (category) {
      case "freezer":
        return "rgb(59, 130, 246)";
      case "fridge":
        return "rgb(20, 184, 166)";
      case "cupboard":
        return "rgb(217, 119, 6)";
    }
  };

  const handlePushToPantry = async () => {
    const checkedItems = shoppingItems.filter(item => item.checked);
    
    if (checkedItems.length === 0) {
      toast.error("Please select items to add to pantry");
      return;
    }

    // Convert shopping items to pantry format
    const pantryItems = checkedItems.map(item => ({
      ingredientName: item.name,
      quantity: item.quantity,
      category: item.category,
      unit: item.unit,
      lastUpdated: new Date().toISOString().split('T')[0],
      isNew: true
    }));

    // Get existing pantry items from localStorage
    const existingPantry = JSON.parse(localStorage.getItem('pantryItems') || '[]');
    
    // Merge with new items
    const updatedPantry = [...existingPantry, ...pantryItems];
    
    // Save to localStorage
    localStorage.setItem('pantryItems', JSON.stringify(updatedPantry));
    
    toast.success(`Added ${checkedItems.length} items to pantry`);
    
    // Remove checked items from shopping list
    setShoppingItems(prev => prev.filter(item => !item.checked));
  };

  const groupedItems = {
    freezer: shoppingItems.filter(item => item.category === "freezer"),
    fridge: shoppingItems.filter(item => item.category === "fridge"),
    cupboard: shoppingItems.filter(item => item.category === "cupboard"),
  };

  const checkedCount = shoppingItems.filter(item => item.checked).length;

  return (
    <div className="min-h-screen bg-background md:pt-0 pt-40 md:pb-0 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="heading-h2 mb-2">
              shopping list
            </h1>
            <p className="text-muted-foreground" style={{ fontFamily: '"General Sans", sans-serif' }}>
              AI-generated grocery list based on your meal plans
            </p>
          </div>
        </div>

        {/* Push to Pantry Button */}
        {checkedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <button
              onClick={handlePushToPantry}
              className="bg-black text-white px-4 md:px-6 py-3 rounded-full hover:bg-gray-800 transition-all font-medium text-sm flex items-center gap-2 w-full md:w-auto justify-center"
              style={{ fontFamily: '"Right Grotesk Wide", sans-serif' }}
            >
              Push {checkedCount} item{checkedCount !== 1 ? 's' : ''} to Pantry
            </button>
          </motion.div>
        )}

        {/* Shopping Items by Category */}
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="bg-card border border-border rounded-xl overflow-hidden">
              <div 
                className="px-6 py-4 border-b border-border flex items-center gap-3"
                style={{ backgroundColor: `${getCategoryColor(category as Category)}15` }}
              >
                <div style={{ color: getCategoryColor(category as Category) }}>
                  {getCategoryIcon(category as Category)}
                </div>
                <h3 
                  className="text-lg font-semibold capitalize"
                  style={{ 
                    fontFamily: '"Right Grotesk Wide", sans-serif',
                    color: getCategoryColor(category as Category)
                  }}
                >
                  {category}
                </h3>
                <span className="text-sm text-muted-foreground">
                  ({items.length} items)
                </span>
              </div>
              
              <div className="divide-y divide-border/30">
                {items.map((item, index) => {
                  const globalIndex = shoppingItems.findIndex(si => si === item);
                  return (
                    <motion.div
                      key={`${item.name}-${index}`}
                      initial={{ opacity: 1 }}
                      animate={{ 
                        opacity: item.checked ? 0.6 : 1,
                        scale: item.checked ? 0.98 : 1
                      }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors"
                    >
                      <button
                        onClick={() => toggleItem(globalIndex)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          item.checked
                            ? 'bg-black border-black text-white'
                            : 'border-border hover:border-black'
                        }`}
                      >
                        {item.checked && <Check className="w-3 h-3" />}
                      </button>
                      
                      <div className="flex-1">
                        <span 
                          className={`text-base ${item.checked ? 'line-through' : ''}`}
                          style={{ fontFamily: '"General Sans", sans-serif' }}
                        >
                          {item.name}
                        </span>
                      </div>
                      
                      <span 
                        className="text-sm font-medium text-muted-foreground"
                        style={{ fontFamily: '"Right Grotesk Wide", sans-serif' }}
                      >
                        {item.quantity} {item.unit}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}