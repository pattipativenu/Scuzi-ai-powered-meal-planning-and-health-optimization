"use client";

import { useState, useEffect } from "react";
import { Refrigerator, Snowflake, Package, ShoppingCart, Plus, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

type Category = "freezer" | "fridge" | "cupboard" | "all";

interface PantryItem {
  ingredientName: string;
  quantity: number;
  category: string;
  unit: string | null;
  lastUpdated: string;
}

interface NeedToBuyItem {
  ingredientName: string;
  currentQuantity: number;
  category: string;
  unit: string;
  suggestedQuantity: number;
}

interface ShoppingListItem {
  id: number;
  ingredientName: string;
  quantity: number;
  category: string;
  unit: string | null;
  isPurchased: boolean;
  createdAt: string;
}

export default function PantryPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [inventory, setInventory] = useState<PantryItem[]>([]);
  const [needToBuy, setNeedToBuy] = useState<NeedToBuyItem[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showShoppingDialog, setShowShoppingDialog] = useState(false);
  const [showViewItemsDialog, setShowViewItemsDialog] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // Redirect if not authenticated
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/pantry");
    }
  }, [session, isPending, router]);

  // Fetch all data
  useEffect(() => {
    if (session?.user) {
      fetchAllData();
    }
  }, [session]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const userId = session?.user?.id;
      
      // Fetch inventory, need-to-buy, and shopping list in parallel
      const [inventoryRes, needToBuyRes, shoppingListRes] = await Promise.all([
        fetch(`/api/pantry/inventory?userId=${userId}`),
        fetch(`/api/pantry/need-to-buy?userId=${userId}`),
        fetch(`/api/pantry/shopping-list?userId=${userId}`)
      ]);

      const inventoryData = await inventoryRes.json();
      const needToBuyData = await needToBuyRes.json();
      const shoppingListData = await shoppingListRes.json();

      if (inventoryData.success) {
        setInventory(inventoryData.inventory || []);
      }
      
      if (needToBuyData.success) {
        setNeedToBuy(needToBuyData.needToBuy || []);
      }
      
      if (shoppingListData.success) {
        setShoppingList(shoppingListData.shoppingList || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load pantry data");
    } finally {
      setIsLoading(false);
    }
  };

  const createShoppingList = async () => {
    if (needToBuy.length === 0) {
      toast.info("All items are fully stocked! No shopping list needed.");
      return;
    }

    try {
      const userId = session?.user?.id;
      const res = await fetch("/api/pantry/shopping-list/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success(`Shopping list created with ${data.itemsAdded} items!`);
        setShowShoppingDialog(true);
        await fetchAllData(); // Refresh data
      } else {
        toast.error(data.error || "Failed to create shopping list");
      }
    } catch (error) {
      console.error("Error creating shopping list:", error);
      toast.error("Failed to create shopping list");
    }
  };

  const handleViewItems = () => {
    setShowShoppingDialog(false);
    setShowViewItemsDialog(true);
  };

  const toggleItemSelection = (itemId: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const confirmPurchase = async () => {
    if (selectedItems.size === 0) {
      toast.error("Please select at least one item to confirm purchase");
      return;
    }

    try {
      const userId = session?.user?.id;
      const itemIds = Array.from(selectedItems);
      
      const res = await fetch("/api/pantry/shopping-list/confirm-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, itemIds })
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success(`Successfully purchased ${data.itemsUpdated} items!`);
        setShowViewItemsDialog(false);
        setSelectedItems(new Set());
        await fetchAllData(); // Refresh data
      } else {
        toast.error(data.error || "Failed to confirm purchase");
      }
    } catch (error) {
      console.error("Error confirming purchase:", error);
      toast.error("Failed to confirm purchase");
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "freezer":
        return <Snowflake className="w-6 h-6" />;
      case "fridge":
        return <Refrigerator className="w-6 h-6" />;
      case "cupboard":
        return <Package className="w-6 h-6" />;
      default:
        return <Package className="w-6 h-6" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "freezer":
        return "rgb(59, 130, 246)"; // blue
      case "fridge":
        return "rgb(20, 184, 166)"; // teal
      case "cupboard":
        return "rgb(217, 119, 6)"; // beige/orange
      default:
        return "rgb(107, 114, 128)";
    }
  };

  const filteredInventory = selectedCategory === "all" 
    ? inventory 
    : inventory.filter(item => item.category === selectedCategory);

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            Pantry
          </h1>
          <p className="text-lg text-muted-foreground" style={{ fontFamily: '"General Sans", sans-serif' }}>
            Track your ingredients and manage your shopping needs
          </p>
        </div>

        {/* Category Selector - Horizontal */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {[
            { id: "all" as Category, label: "All Items", icon: null },
            { id: "freezer" as Category, label: "Freezer", icon: <Snowflake className="w-5 h-5" /> },
            { id: "fridge" as Category, label: "Fridge", icon: <Refrigerator className="w-5 h-5" /> },
            { id: "cupboard" as Category, label: "Cupboard", icon: <Package className="w-5 h-5" /> }
          ].map((cat) => (
            <motion.button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all flex-shrink-0"
              style={{
                backgroundColor: selectedCategory === cat.id ? getCategoryColor(cat.id) : "transparent",
                borderColor: selectedCategory === cat.id ? getCategoryColor(cat.id) : "var(--color-border)",
                color: selectedCategory === cat.id ? "white" : "var(--color-foreground)"
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {cat.icon}
              <span style={{ fontFamily: '"Right Grotesk Wide", sans-serif', fontWeight: 500 }}>
                {cat.label}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-1" style={{ fontFamily: '"General Sans", sans-serif' }}>
              Total Items
            </p>
            <p className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              {inventory.length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-1" style={{ fontFamily: '"General Sans", sans-serif' }}>
              In Stock
            </p>
            <p className="text-3xl font-bold text-green-600" style={{ fontFamily: "var(--font-heading)" }}>
              {inventory.filter(i => i.quantity > 0).length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-1" style={{ fontFamily: '"General Sans", sans-serif' }}>
              Need to Buy
            </p>
            <p className="text-3xl font-bold text-destructive" style={{ fontFamily: "var(--font-heading)" }}>
              {needToBuy.length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 flex items-center justify-center">
            <button
              onClick={createShoppingList}
              className="w-full bg-black text-white px-4 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
              style={{ fontFamily: '"Right Grotesk Wide", sans-serif' }}
            >
              <ShoppingCart className="w-5 h-5" />
              Create Shopping List
            </button>
          </div>
        </div>

        {/* Inventory Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {filteredInventory.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-xl text-muted-foreground" style={{ fontFamily: '"General Sans", sans-serif' }}>
                  No items in this category
                </p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ fontFamily: "var(--font-heading)" }}>
                  {selectedCategory !== "all" && getCategoryIcon(selectedCategory)}
                  {selectedCategory === "all" ? "All Ingredients" : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Items`}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredInventory.map((item, index) => (
                    <motion.div
                      key={`${item.ingredientName}-${index}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-lg border border-border hover:shadow-lg transition-all"
                      style={{
                        backgroundColor: item.quantity <= 0 ? "rgba(239, 68, 68, 0.1)" : "var(--color-secondary)"
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div style={{ color: getCategoryColor(item.category) }}>
                            {getCategoryIcon(item.category)}
                          </div>
                          <span className="font-semibold" style={{ fontFamily: '"Right Grotesk Wide", sans-serif' }}>
                            {item.ingredientName}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold" style={{ 
                          fontFamily: "var(--font-heading)",
                          color: item.quantity <= 0 ? "var(--color-destructive)" : "var(--color-foreground)"
                        }}>
                          ×{item.quantity}
                        </span>
                        <span className="text-sm text-muted-foreground" style={{ fontFamily: '"General Sans", sans-serif' }}>
                          {item.unit || "units"}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Need to Buy Section */}
            {needToBuy.length > 0 && (
              <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-400" style={{ fontFamily: "var(--font-heading)" }}>
                  Items to Purchase
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {needToBuy.map((item, index) => (
                    <div
                      key={`need-${item.ingredientName}-${index}`}
                      className="p-4 rounded-lg bg-white dark:bg-gray-900 border border-red-300 dark:border-red-700"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div style={{ color: getCategoryColor(item.category) }}>
                          {getCategoryIcon(item.category)}
                        </div>
                        <span className="font-semibold" style={{ fontFamily: '"Right Grotesk Wide", sans-serif' }}>
                          {item.ingredientName}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground" style={{ fontFamily: '"General Sans", sans-serif' }}>
                        Suggested: {item.suggestedQuantity} {item.unit}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Shopping Dialog */}
        <AnimatePresence>
          {showShoppingDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowShoppingDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-card rounded-2xl p-8 max-w-md w-full shadow-2xl border border-border"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                    Shopping List Created!
                  </h3>
                  <p className="text-muted-foreground" style={{ fontFamily: '"General Sans", sans-serif' }}>
                    Your shopping list has been generated
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={handleViewItems}
                    className="w-full bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                    style={{ fontFamily: '"Right Grotesk Wide", sans-serif' }}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    View Items
                  </button>
                  <button
                    onClick={() => setShowShoppingDialog(false)}
                    className="w-full bg-secondary text-foreground px-6 py-3 rounded-lg font-semibold hover:bg-secondary/80 transition-all"
                    style={{ fontFamily: '"Right Grotesk Wide", sans-serif' }}
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Items Dialog */}
        <AnimatePresence>
          {showViewItemsDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowViewItemsDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-card rounded-2xl p-8 max-w-2xl w-full shadow-2xl border border-border max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                    Shopping List
                  </h3>
                  <button
                    onClick={() => setShowViewItemsDialog(false)}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 mb-6">
                  {shoppingList.filter(item => !item.isPurchased).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer"
                      onClick={() => toggleItemSelection(item.id)}
                    >
                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                        selectedItems.has(item.id) 
                          ? "bg-black border-black" 
                          : "border-gray-300"
                      }`}>
                        {selectedItems.has(item.id) && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <div style={{ color: getCategoryColor(item.category) }}>
                        {getCategoryIcon(item.category)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold" style={{ fontFamily: '"Right Grotesk Wide", sans-serif' }}>
                          {item.ingredientName}
                        </p>
                        <p className="text-sm text-muted-foreground" style={{ fontFamily: '"General Sans", sans-serif' }}>
                          {item.quantity} {item.unit || "units"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={confirmPurchase}
                    disabled={selectedItems.size === 0}
                    className="flex-1 bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: '"Right Grotesk Wide", sans-serif' }}
                  >
                    Confirm Purchase ({selectedItems.size})
                  </button>
                  <button
                    onClick={() => setShowViewItemsDialog(false)}
                    className="px-6 py-3 rounded-lg border-2 border-border font-semibold hover:bg-secondary transition-all"
                    style={{ fontFamily: '"Right Grotesk Wide", sans-serif' }}
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}