"use client";

import { User, Mail, Bell, Shield, CreditCard, LogOut, Loader2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { Recipe } from "@/types/recipe";

export default function AccountPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch("/api/recipes/history");
        const data = await response.json();
        
        if (response.ok) {
          setRecipes(data.recipes || []);
        }
      } catch (error) {
        console.error("Failed to fetch recipe history:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <div className="min-h-screen bg-background md:pt-0 pt-40 md:pb-0 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="heading-h1 mb-4">account</h1>
          <p className="text-lg text-muted-foreground">
            Manage your profile and preferences
          </p>
        </div>

        {/* Profile Section */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Venu P</h2>
              <p className="text-muted-foreground">venu@zohomail.com</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors">
            Edit Profile
          </button>
        </div>

        {/* History Section */}
        <div className="bg-card border border-border rounded-lg overflow-hidden mb-6">
          {/* Desktop & Tablet: Always expanded */}
          <div className="hidden md:block p-6">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-semibold">History</h3>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : recipes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No recipes generated yet. Start by searching for a recipe!
                </p>
                <button
                  onClick={() => router.push("/")}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Search Recipes
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {recipes.map((recipe) => (
                  <div
                    key={recipe.recipe_id}
                    onClick={() => router.push(`/recipe/${recipe.recipe_id}`)}
                    className="group cursor-pointer bg-background border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all"
                  >
                    <div className="aspect-video relative bg-muted">
                      <Image
                        src={recipe.image_s3_url}
                        alt={recipe.meal_name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                        {recipe.meal_name}
                      </h4>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                          {recipe.meal_type}
                        </span>
                        <span>{new Date(recipe.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mobile: Collapsible */}
          <div className="block md:hidden">
            <button
              onClick={() => toggleSection('history')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-semibold">History</h3>
              </div>
              {expandedSections.includes('history') ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>

            <AnimatePresence>
              {expandedSections.includes('history') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6">
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : recipes.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4 text-sm">
                          No recipes generated yet. Start by searching for a recipe!
                        </p>
                        <button
                          onClick={() => router.push("/")}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm"
                        >
                          Search Recipes
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recipes.slice(0, 3).map((recipe) => (
                          <div
                            key={recipe.recipe_id}
                            onClick={() => router.push(`/recipe/${recipe.recipe_id}`)}
                            className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg hover:shadow-sm transition-all cursor-pointer"
                          >
                            <div className="w-12 h-12 relative bg-muted rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={recipe.image_s3_url}
                                alt={recipe.meal_name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">
                                {recipe.meal_name}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                                  {recipe.meal_type}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(recipe.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {recipes.length > 3 && (
                          <button
                            onClick={() => router.push("/")}
                            className="w-full text-center py-2 text-primary hover:underline text-sm font-medium"
                          >
                            View All ({recipes.length} recipes)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-4">
          {[
            {
              id: 'email',
              icon: Mail,
              title: 'Email Preferences',
              description: 'Manage how you receive notifications and updates from Scuzi.',
              comingSoon: true
            },
            {
              id: 'notifications',
              icon: Bell,
              title: 'Notifications',
              description: 'Control which notifications you receive and when.',
              comingSoon: true
            },
            {
              id: 'privacy',
              icon: Shield,
              title: 'Privacy & Security',
              description: 'Manage your data privacy settings and security preferences.',
              comingSoon: true
            },
            {
              id: 'billing',
              icon: CreditCard,
              title: 'Subscription & Billing',
              description: 'View your subscription plan and manage billing information.',
              comingSoon: true
            }
          ].map((section) => (
            <div key={section.id} className="bg-card border border-border rounded-lg overflow-hidden">
              {/* Desktop & Tablet: Always expanded */}
              <div className="hidden md:block p-6">
                <div className="flex items-center gap-3 mb-4">
                  <section.icon className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-semibold">{section.title}</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  {section.description}
                </p>
                {section.comingSoon && (
                  <button className="text-primary hover:underline text-sm font-medium">
                    Coming Soon
                  </button>
                )}
              </div>

              {/* Mobile: Collapsible */}
              <div className="block md:hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <section.icon className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">{section.title}</h3>
                  </div>
                  {expandedSections.includes(section.id) ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>

                <AnimatePresence>
                  {expandedSections.includes(section.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6">
                        <p className="text-muted-foreground mb-4 text-sm">
                          {section.description}
                        </p>
                        {section.comingSoon && (
                          <button className="text-primary hover:underline text-sm font-medium">
                            Coming Soon
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>

        {/* Logout Button */}
        <div className="mt-8 pt-8 border-t border-border">
          <button className="flex items-center gap-2 text-destructive hover:underline font-medium">
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-8 bg-secondary/50 rounded-lg p-6 text-center">
          <h3 className="font-semibold mb-2">User Profile Management Coming Soon</h3>
          <p className="text-sm text-muted-foreground">
            We're working on bringing you comprehensive account management features. Stay tuned!
          </p>
        </div>
      </div>
    </div>
  );
}