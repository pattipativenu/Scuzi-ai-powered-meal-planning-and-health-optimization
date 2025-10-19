"use client";

import { useState, useEffect } from "react";
import { Refrigerator, Snowflake, Package, Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Category = "freezer" | "fridge" | "cupboard";

interface PantryItem {
  ingredientName: string;
  quantity: number;
  category: string;
  unit: string | null;
  lastUpdated: string;
}

export default function PantryPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [inventory, setInventory] = useState<PantryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);

  // Fetch inventory data only if authenticated
  useEffect(() => {
    if (session?.user) {
      fetchInventory();
    } else if (!isPending) {
      setIsLoading(false);
    }
  }, [session, isPending]);

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

  const filteredInventory = selectedCategory 
    ? inventory.filter(item => item.category === selectedCategory)
    : [];

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!session?.user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-6 flex justify-center">
            <Package className="w-16 h-16 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            Pantry
          </h1>
          <p className="text-lg text-muted-foreground mb-8" style={{ fontFamily: '"General Sans", sans-serif' }}>
            Sign in to view and manage your personal ingredient inventory
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login?redirect=/pantry"
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              style={{ fontFamily: '"Right Grotesk Wide", sans-serif', fontWeight: 500 }}
            >
              Sign In
            </Link>
            <Link
              href="/register?redirect=/pantry"
              className="px-6 py-3 border-2 border-black text-black rounded-lg hover:bg-gray-50 transition-colors"
              style={{ fontFamily: '"Right Grotesk Wide", sans-serif', fontWeight: 500 }}
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            Pantry
          </h1>
          <p className="text-muted-foreground" style={{ fontFamily: '"General Sans", sans-serif' }}>
            Live ingredient inventory from your meal plans (current + next week)
          </p>
        </div>

        {/* Storage Category Selector - Only 3 boxes */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          {[
            { id: "freezer" as Category, label: "Freezer", icon: <Snowflake className="w-8 h-8" /> },
            { id: "fridge" as Category, label: "Fridge", icon: <Refrigerator className="w-8 h-8" /> },
            { id: "cupboard" as Category, label: "Cupboard", icon: <Package className="w-8 h-8" /> }
          ].map((cat) => (
            <motion.button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 transition-all"
              style={{
                backgroundColor: selectedCategory === cat.id ? getCategoryColor(cat.id) : "transparent",
                borderColor: selectedCategory === cat.id ? getCategoryColor(cat.id) : "var(--color-border)",
                color: selectedCategory === cat.id ? "white" : "var(--color-foreground)"
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {cat.icon}
              <span style={{ fontFamily: '"Right Grotesk Wide", sans-serif', fontWeight: 500, fontSize: '18px' }}>
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
              {filteredInventory.length === 0 ? (
                <div className="text-center py-16">
                  <div className="flex justify-center mb-4" style={{ color: getCategoryColor(selectedCategory) }}>
                    {getCategoryIcon(selectedCategory)}
                  </div>
                  <p className="text-muted-foreground" style={{ fontFamily: '"General Sans", sans-serif' }}>
                    No items in {selectedCategory}
                  </p>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  {filteredInventory.map((item, index) => (
                    <div key={`${item.ingredientName}-${index}`}>
                      <div className="flex items-center justify-between p-6 hover:bg-secondary/50 transition-colors">
                        <div className="flex items-center gap-4 flex-1">
                          <span className="text-lg" style={{ fontFamily: '"General Sans", sans-serif' }}>
                            {item.ingredientName}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          {editingItem === item.ingredientName ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={editQuantity}
                                onChange={(e) => setEditQuantity(Number(e.target.value))}
                                className="w-20 px-3 py-1 border border-border rounded-lg text-center"
                                style={{ fontFamily: '"General Sans", sans-serif' }}
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveEdit(item.ingredientName)}
                                className="px-3 py-1 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
                                style={{ fontFamily: '"General Sans", sans-serif' }}
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingItem(null)}
                                className="px-3 py-1 border border-border rounded-lg text-sm hover:bg-secondary transition-colors"
                                style={{ fontFamily: '"General Sans", sans-serif' }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="text-xl font-semibold min-w-[80px] text-right" style={{ fontFamily: '"Right Grotesk Wide", sans-serif' }}>
                                {item.quantity} {item.unit || ""}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditItem(item.ingredientName, item.quantity)}
                                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                                  title="Edit quantity"
                                >
                                  <Pencil className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item.ingredientName)}
                                  className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                                  title="Delete item"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      {index < filteredInventory.length - 1 && (
                        <div className="border-t border-border/30" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Initial state - no category selected */}
        {!selectedCategory && (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground" style={{ fontFamily: '"General Sans", sans-serif' }}>
              Select a storage location to view items
            </p>
          </div>
        )}
      </div>
    </div>
  );
}