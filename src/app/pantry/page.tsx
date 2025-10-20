"use client";

import { useState, useEffect } from "react";
import { Refrigerator, Snowflake, Package, Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

type Category = "freezer" | "fridge" | "cupboard";

interface PantryItem {
  ingredientName: string;
  quantity: number;
  category: string;
  unit: string | null;
  lastUpdated: string;
  isStaple?: boolean;
  isNew?: boolean;
}

export default function PantryPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>("cupboard");
  const [inventory, setInventory] = useState<PantryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [isCreatingList, setIsCreatingList] = useState(false);

  // Dummy data for demonstration
  const dummyInventory: PantryItem[] = [
    // Freezer items
    { ingredientName: "Frozen Chicken Breast", quantity: 2, category: "freezer", unit: "lbs", lastUpdated: "2024-01-15" },
    { ingredientName: "Frozen Broccoli", quantity: 1, category: "freezer", unit: "bag", lastUpdated: "2024-01-14" },
    { ingredientName: "Ice Cream", quantity: 1, category: "freezer", unit: "pint", lastUpdated: "2024-01-13" },
    { ingredientName: "Frozen Berries", quantity: 2, category: "freezer", unit: "cups", lastUpdated: "2024-01-12" },
    { ingredientName: "Frozen Pizza", quantity: 3, category: "freezer", unit: "pieces", lastUpdated: "2024-01-11" },
    { ingredientName: "Frozen Salmon", quantity: 4, category: "freezer", unit: "fillets", lastUpdated: "2024-01-10" },
    
    // Fridge items
    { ingredientName: "Fresh Milk", quantity: 1, category: "fridge", unit: "gallon", lastUpdated: "2024-01-15" },
    { ingredientName: "Greek Yogurt", quantity: 6, category: "fridge", unit: "cups", lastUpdated: "2024-01-14" },
    { ingredientName: "Cheddar Cheese", quantity: 8, category: "fridge", unit: "oz", lastUpdated: "2024-01-13" },
    { ingredientName: "Fresh Spinach", quantity: 1, category: "fridge", unit: "bag", lastUpdated: "2024-01-12" },
    { ingredientName: "Eggs", quantity: 12, category: "fridge", unit: "pieces", lastUpdated: "2024-01-11" },
    { ingredientName: "Bell Peppers", quantity: 3, category: "fridge", unit: "pieces", lastUpdated: "2024-01-10" },
    { ingredientName: "Carrots", quantity: 2, category: "fridge", unit: "lbs", lastUpdated: "2024-01-09" },
    { ingredientName: "Tomatoes", quantity: 5, category: "fridge", unit: "pieces", lastUpdated: "2024-01-08" },
    
    // Cupboard staple ingredients
    { ingredientName: "Olive Oil", quantity: 1, category: "cupboard", unit: "bottle", lastUpdated: "2024-01-14", isStaple: true },
    { ingredientName: "Vegetable Oil", quantity: 1, category: "cupboard", unit: "bottle", lastUpdated: "2024-01-14", isStaple: true },
    { ingredientName: "Salt", quantity: 1, category: "cupboard", unit: "container", lastUpdated: "2024-01-14", isStaple: true },
    { ingredientName: "Black Pepper", quantity: 1, category: "cupboard", unit: "container", lastUpdated: "2024-01-14", isStaple: true },
    { ingredientName: "Butter", quantity: 2, category: "cupboard", unit: "sticks", lastUpdated: "2024-01-14", isStaple: true },
    { ingredientName: "Chili Powder", quantity: 1, category: "cupboard", unit: "container", lastUpdated: "2024-01-13", isStaple: true },
    { ingredientName: "Chili Oil", quantity: 1, category: "cupboard", unit: "bottle", lastUpdated: "2024-01-13", isStaple: true },
    { ingredientName: "Garam Masala", quantity: 1, category: "cupboard", unit: "container", lastUpdated: "2024-01-13", isStaple: true },
    { ingredientName: "Cumin Powder", quantity: 1, category: "cupboard", unit: "container", lastUpdated: "2024-01-13", isStaple: true },
    { ingredientName: "Turmeric", quantity: 1, category: "cupboard", unit: "container", lastUpdated: "2024-01-12", isStaple: true },
    { ingredientName: "Garlic Powder", quantity: 1, category: "cupboard", unit: "container", lastUpdated: "2024-01-12", isStaple: true },
    { ingredientName: "Onion Powder", quantity: 1, category: "cupboard", unit: "container", lastUpdated: "2024-01-12", isStaple: true },
    { ingredientName: "Paprika", quantity: 1, category: "cupboard", unit: "container", lastUpdated: "2024-01-11", isStaple: true },
    { ingredientName: "Baking Powder", quantity: 1, category: "cupboard", unit: "container", lastUpdated: "2024-01-11", isStaple: true },
    { ingredientName: "Vanilla Extract", quantity: 1, category: "cupboard", unit: "bottle", lastUpdated: "2024-01-10", isStaple: true },
    
    // Cupboard regular items
    { ingredientName: "Brown Rice", quantity: 2, category: "cupboard", unit: "lbs", lastUpdated: "2024-01-15" },
    { ingredientName: "Basmati Rice", quantity: 3, category: "cupboard", unit: "lbs", lastUpdated: "2024-01-15" },
    { ingredientName: "Black Beans", quantity: 4, category: "cupboard", unit: "cans", lastUpdated: "2024-01-13" },
    { ingredientName: "Chickpeas", quantity: 3, category: "cupboard", unit: "cans", lastUpdated: "2024-01-13" },
    { ingredientName: "Quinoa", quantity: 1, category: "cupboard", unit: "bag", lastUpdated: "2024-01-12" },
    { ingredientName: "Almonds", quantity: 1, category: "cupboard", unit: "bag", lastUpdated: "2024-01-11" },
    { ingredientName: "Walnuts", quantity: 1, category: "cupboard", unit: "bag", lastUpdated: "2024-01-11" },
    { ingredientName: "Pasta", quantity: 3, category: "cupboard", unit: "boxes", lastUpdated: "2024-01-10" },
    { ingredientName: "Spaghetti", quantity: 2, category: "cupboard", unit: "boxes", lastUpdated: "2024-01-10" },
    { ingredientName: "Canned Tomatoes", quantity: 6, category: "cupboard", unit: "cans", lastUpdated: "2024-01-09" },
    { ingredientName: "Tomato Sauce", quantity: 4, category: "cupboard", unit: "cans", lastUpdated: "2024-01-09" },
    { ingredientName: "Oats", quantity: 1, category: "cupboard", unit: "container", lastUpdated: "2024-01-08" },
    { ingredientName: "Granola", quantity: 1, category: "cupboard", unit: "bag", lastUpdated: "2024-01-08" },
    { ingredientName: "Honey", quantity: 1, category: "cupboard", unit: "jar", lastUpdated: "2024-01-07" },
    { ingredientName: "Maple Syrup", quantity: 1, category: "cupboard", unit: "bottle", lastUpdated: "2024-01-07" },
    { ingredientName: "Peanut Butter", quantity: 1, category: "cupboard", unit: "jar", lastUpdated: "2024-01-06" },
    { ingredientName: "Almond Butter", quantity: 1, category: "cupboard", unit: "jar", lastUpdated: "2024-01-06" },
    
    // Fruits and dried goods
    { ingredientName: "Bananas", quantity: 6, category: "cupboard", unit: "pieces", lastUpdated: "2024-01-15" },
    { ingredientName: "Apples", quantity: 8, category: "cupboard", unit: "pieces", lastUpdated: "2024-01-15" },
    { ingredientName: "Oranges", quantity: 5, category: "cupboard", unit: "pieces", lastUpdated: "2024-01-14" },
    { ingredientName: "Dried Cranberries", quantity: 1, category: "cupboard", unit: "bag", lastUpdated: "2024-01-13" },
    { ingredientName: "Raisins", quantity: 1, category: "cupboard", unit: "box", lastUpdated: "2024-01-13" },
    { ingredientName: "Dates", quantity: 1, category: "cupboard", unit: "package", lastUpdated: "2024-01-12" },
    
    // Additional pantry items
    { ingredientName: "Coconut Oil", quantity: 1, category: "cupboard", unit: "jar", lastUpdated: "2024-01-11" },
    { ingredientName: "Sesame Oil", quantity: 1, category: "cupboard", unit: "bottle", lastUpdated: "2024-01-11" },
    { ingredientName: "Soy Sauce", quantity: 1, category: "cupboard", unit: "bottle", lastUpdated: "2024-01-10" },
    { ingredientName: "Balsamic Vinegar", quantity: 1, category: "cupboard", unit: "bottle", lastUpdated: "2024-01-10" },
    { ingredientName: "Apple Cider Vinegar", quantity: 1, category: "cupboard", unit: "bottle", lastUpdated: "2024-01-09" },
    { ingredientName: "Coconut Milk", quantity: 3, category: "cupboard", unit: "cans", lastUpdated: "2024-01-09" },
    { ingredientName: "Green Tea", quantity: 1, category: "cupboard", unit: "box", lastUpdated: "2024-01-08" },
    { ingredientName: "Coffee Beans", quantity: 1, category: "cupboard", unit: "bag", lastUpdated: "2024-01-08" },
  ];

  // Fetch inventory data if authenticated, or load from localStorage
  useEffect(() => {
    if (session?.user) {
      fetchInventory();
    } else {
      // Load from localStorage for demo purposes
      const storedItems = JSON.parse(localStorage.getItem('pantryItems') || '[]');
      if (storedItems.length > 0) {
        setInventory(storedItems);
      }
    }
  }, [session]);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const userId = session?.user?.id;
      const res = await fetch(`/api/pantry/inventory?userId=${userId}`);
      const data = await res.json();

      if (data.success) {
        setInventory(data.inventory || []);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Failed to load pantry data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditItem = (itemName: string, currentQuantity: number) => {
    setEditingItem(itemName);
    setEditQuantity(currentQuantity);
  };

  const handleSaveEdit = async (itemName: string) => {
    try {
      setInventory(prev => 
        prev.map(item => 
          item.ingredientName === itemName 
            ? { ...item, quantity: editQuantity }
            : item
        )
      );
      setEditingItem(null);
      toast.success("Quantity updated");
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update quantity");
    }
  };

  const handleDeleteItem = async (itemName: string) => {
    try {
      setInventory(prev => prev.filter(item => item.ingredientName !== itemName));
      toast.success("Item deleted");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    }
  };

  const handleCreateShoppingList = async () => {
    setIsCreatingList(true);
    
    // Simulate AI processing time with loading states
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    setIsCreatingList(false);
    
    // Navigate to shopping list page
    router.push('/shopping-list');
  };

  // Clear "New" badges after viewing items
  useEffect(() => {
    if (selectedCategory) {
      const timer = setTimeout(() => {
        const storedItems = JSON.parse(localStorage.getItem('pantryItems') || '[]');
        const updatedItems = storedItems.map((item: PantryItem) => ({
          ...item,
          isNew: false
        }));
        localStorage.setItem('pantryItems', JSON.stringify(updatedItems));
        
        // Update state if using localStorage items
        if (!session?.user && storedItems.length > 0) {
          setInventory(updatedItems);
        }
      }, 3000); // Clear "New" badges after 3 seconds of viewing

      return () => clearTimeout(timer);
    }
  }, [selectedCategory, session]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "freezer":
        return <Snowflake className="w-8 h-8" />;
      case "fridge":
        return <Refrigerator className="w-8 h-8" />;
      case "cupboard":
        return <Package className="w-8 h-8" />;
      default:
        return <Package className="w-8 h-8" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "freezer":
        return "rgb(59, 130, 246)";
      case "fridge":
        return "rgb(20, 184, 166)";
      case "cupboard":
        return "rgb(217, 119, 6)";
      default:
        return "rgb(107, 114, 128)";
    }
  };

  // Get stored items from localStorage
  const getStoredItems = () => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('pantryItems') || '[]');
    } catch {
      return [];
    }
  };
  
  const storedItems = getStoredItems();
  
  // Merge inventory: use API data if available, otherwise use dummy data + stored items
  const currentInventory = inventory.length > 0 
    ? [...inventory, ...storedItems] 
    : [...dummyInventory, ...storedItems];
    
  const filteredInventory = selectedCategory 
    ? currentInventory.filter(item => item.category === selectedCategory)
    : [];



  return (
    <div className="min-h-screen bg-background md:pt-0 pt-40 md:pb-0 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          {/* Desktop & Tablet: Show full header with button */}
          <div className="hidden md:block">
            <div className="flex justify-between items-start mb-2">
              <h1 className="heading-h1">
                pantry
              </h1>
              <button
                onClick={handleCreateShoppingList}
                disabled={isCreatingList}
                className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                style={{ fontFamily: '"Right Grotesk Wide", sans-serif' }}
              >
                {isCreatingList ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating List...
                  </>
                ) : (
                  "Create Shopping List"
                )}
              </button>
            </div>
            <p className="text-muted-foreground" style={{ fontFamily: '"General Sans", sans-serif' }}>
              Live ingredient inventory from your meal plans (current + next week)
            </p>
          </div>
          
          {/* Mobile: Show tagline and button */}
          <div className="block md:hidden">
            <p className="text-lg font-medium text-foreground mb-4" style={{ fontFamily: '"General Sans", sans-serif' }}>
              Live ingredient inventory from your meal plans (current + next week)
            </p>
            <button
              onClick={handleCreateShoppingList}
              disabled={isCreatingList}
              className="bg-black text-white px-4 py-3 rounded-full hover:bg-gray-800 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 w-full justify-center whitespace-nowrap"
              style={{ fontFamily: '"Right Grotesk Wide", sans-serif' }}
            >
              {isCreatingList ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating List...
                </>
              ) : (
                "Create Shopping List"
              )}
            </button>
          </div>
        </div>

        {/* Storage Category Selector */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 mb-12">
          {[
            { id: "freezer" as Category, label: "Freezer", icon: <Snowflake className="w-6 h-6 md:w-8 md:h-8" /> },
            { id: "fridge" as Category, label: "Fridge", icon: <Refrigerator className="w-6 h-6 md:w-8 md:h-8" /> },
            { id: "cupboard" as Category, label: "Cupboard", icon: <Package className="w-6 h-6 md:w-8 md:h-8" /> }
          ].map((cat) => (
            <motion.button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="flex flex-col items-center justify-center gap-2 md:gap-3 p-4 md:p-8 rounded-xl border-2 transition-all min-h-[100px] md:min-h-[120px]"
              style={{
                backgroundColor: selectedCategory === cat.id ? getCategoryColor(cat.id) : "transparent",
                borderColor: selectedCategory === cat.id ? getCategoryColor(cat.id) : "var(--color-border)",
                color: selectedCategory === cat.id ? "white" : "var(--color-foreground)"
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {cat.icon}
              <span className="text-sm md:text-lg font-medium" style={{ fontFamily: '"Right Grotesk Wide", sans-serif' }}>
                {cat.label}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Items Display */}
        <AnimatePresence mode="wait">
          {selectedCategory && (
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {isLoading ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="text-center py-16">
                  <div className="flex justify-center mb-4" style={{ color: getCategoryColor(selectedCategory) }}>
                    {getCategoryIcon(selectedCategory)}
                  </div>
                  <p className="text-muted-foreground" style={{ fontFamily: '"General Sans", sans-serif' }}>
                    No items in {selectedCategory}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Staple Ingredients Section (only for cupboard) */}
                  {selectedCategory === "cupboard" && filteredInventory.some(item => item.isStaple) && (
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                      <div className="px-6 py-4 bg-amber-50 dark:bg-amber-950/20 border-b border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-xs font-medium rounded-md">
                            Staple Items
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200" style={{ fontFamily: '"Right Grotesk Wide", sans-serif' }}>
                          Essential Cooking Ingredients
                        </h3>
                        <p className="text-sm text-amber-600 dark:text-amber-300" style={{ fontFamily: '"General Sans", sans-serif' }}>
                          Basic spices and cooking essentials
                        </p>
                      </div>
                      {filteredInventory.filter(item => item.isStaple).map((item, index) => (
                        <div key={`staple-${item.ingredientName}-${index}`}>
                          <div className="flex items-center justify-between p-4 md:p-6 hover:bg-secondary/50 transition-colors bg-amber-50/30 dark:bg-amber-950/10">
                            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm md:text-lg truncate" style={{ fontFamily: '"General Sans", sans-serif' }}>
                                  {item.ingredientName}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="px-2 py-0.5 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-xs font-medium rounded-full">
                                    Staple
                                  </span>
                                  {item.isNew && (
                                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-medium rounded-full border border-green-200 dark:border-green-800">
                                      New
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 md:gap-6 flex-shrink-0">
                              {editingItem === item.ingredientName ? (
                                <div className="flex items-center gap-1 md:gap-2">
                                  <input
                                    type="number"
                                    value={editQuantity}
                                    onChange={(e) => setEditQuantity(Number(e.target.value))}
                                    className="w-16 md:w-20 px-2 md:px-3 py-1 border border-border rounded-lg text-center text-sm"
                                    style={{ fontFamily: '"General Sans", sans-serif' }}
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleSaveEdit(item.ingredientName)}
                                    className="px-2 md:px-3 py-1 bg-black text-white rounded-lg text-xs md:text-sm hover:bg-gray-800 transition-colors"
                                    style={{ fontFamily: '"General Sans", sans-serif' }}
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingItem(null)}
                                    className="px-2 md:px-3 py-1 border border-border rounded-lg text-xs md:text-sm hover:bg-secondary transition-colors"
                                    style={{ fontFamily: '"General Sans", sans-serif' }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-lg md:text-xl font-semibold min-w-[60px] md:min-w-[80px] text-right" style={{ fontFamily: '"Right Grotesk Wide", sans-serif' }}>
                                    {item.quantity} {item.unit || ""}
                                  </span>
                                  <div className="flex items-center gap-1 md:gap-2">
                                    <button
                                      onClick={() => handleEditItem(item.ingredientName, item.quantity)}
                                      className="p-1.5 md:p-2 hover:bg-secondary rounded-lg transition-colors"
                                      title="Edit quantity"
                                    >
                                      <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground hover:text-foreground transition-colors" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteItem(item.ingredientName)}
                                      className="p-1.5 md:p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                                      title="Delete item"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          {index < filteredInventory.filter(item => item.isStaple).length - 1 && (
                            <div className="border-t border-border/30" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Regular Items Section */}
                  {filteredInventory.filter(item => !item.isStaple).length > 0 && (
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                      {selectedCategory === "cupboard" && filteredInventory.some(item => item.isStaple) && (
                        <div className="px-6 py-4 border-b border-border">
                          <h3 className="text-lg font-semibold" style={{ fontFamily: '"Right Grotesk Wide", sans-serif' }}>
                            Other Items
                          </h3>
                        </div>
                      )}
                      {filteredInventory.filter(item => !item.isStaple).map((item, index) => (
                        <div key={`regular-${item.ingredientName}-${index}`}>
                          <div className="flex items-center justify-between p-4 md:p-6 hover:bg-secondary/50 transition-colors">
                            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm md:text-lg truncate" style={{ fontFamily: '"General Sans", sans-serif' }}>
                                  {item.ingredientName}
                                </span>
                                {item.isNew && (
                                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-medium rounded-full border border-green-200 dark:border-green-800">
                                    New
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 md:gap-6 flex-shrink-0">
                              {editingItem === item.ingredientName ? (
                                <div className="flex items-center gap-1 md:gap-2">
                                  <input
                                    type="number"
                                    value={editQuantity}
                                    onChange={(e) => setEditQuantity(Number(e.target.value))}
                                    className="w-16 md:w-20 px-2 md:px-3 py-1 border border-border rounded-lg text-center text-sm"
                                    style={{ fontFamily: '"General Sans", sans-serif' }}
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleSaveEdit(item.ingredientName)}
                                    className="px-2 md:px-3 py-1 bg-black text-white rounded-lg text-xs md:text-sm hover:bg-gray-800 transition-colors"
                                    style={{ fontFamily: '"General Sans", sans-serif' }}
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingItem(null)}
                                    className="px-2 md:px-3 py-1 border border-border rounded-lg text-xs md:text-sm hover:bg-secondary transition-colors"
                                    style={{ fontFamily: '"General Sans", sans-serif' }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-lg md:text-xl font-semibold min-w-[60px] md:min-w-[80px] text-right" style={{ fontFamily: '"Right Grotesk Wide", sans-serif' }}>
                                    {item.quantity} {item.unit || ""}
                                  </span>
                                  <div className="flex items-center gap-1 md:gap-2">
                                    <button
                                      onClick={() => handleEditItem(item.ingredientName, item.quantity)}
                                      className="p-1.5 md:p-2 hover:bg-secondary rounded-lg transition-colors"
                                      title="Edit quantity"
                                    >
                                      <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground hover:text-foreground transition-colors" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteItem(item.ingredientName)}
                                      className="p-1.5 md:p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                                      title="Delete item"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          {index < filteredInventory.filter(item => !item.isStaple).length - 1 && (
                            <div className="border-t border-border/30" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>



        {/* AI Loading Modal */}
        <AnimatePresence>
          {isCreatingList && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center"
              >
                <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <h3 
                  className="text-xl font-semibold mb-2"
                  style={{ fontFamily: '"Right Grotesk Wide", sans-serif' }}
                >
                  Scuzi AI Creating Your Shopping List
                </h3>
                <p 
                  className="text-muted-foreground"
                  style={{ fontFamily: '"General Sans", sans-serif' }}
                >
                  Analyzing your pantry and meal plans to generate the perfect grocery list...
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}