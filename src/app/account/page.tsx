"use client";

import { User, Mail, Bell, Shield, CreditCard, LogOut, Loader2, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Recipe } from "@/types/recipe";

export default function AccountPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-background md:pt-0 pt-40 md:pb-0 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Account</h1>
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
              <h2 className="text-2xl font-bold">John Doe</h2>
              <p className="text-muted-foreground">john.doe@example.com</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors">
            Edit Profile
          </button>
        </div>

        {/* History Section */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
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
                      alt={recipe.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                      {recipe.title}
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

        {/* Settings Sections */}
        <div className="space-y-4">
          {/* Email Preferences */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-semibold">Email Preferences</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Manage how you receive notifications and updates from MealPrep.
            </p>
            <button className="text-primary hover:underline text-sm font-medium">
              Coming Soon
            </button>
          </div>

          {/* Notifications */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-semibold">Notifications</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Control which notifications you receive and when.
            </p>
            <button className="text-primary hover:underline text-sm font-medium">
              Coming Soon
            </button>
          </div>

          {/* Privacy & Security */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-semibold">Privacy & Security</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Manage your data privacy settings and security preferences.
            </p>
            <button className="text-primary hover:underline text-sm font-medium">
              Coming Soon
            </button>
          </div>

          {/* Subscription */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-semibold">Subscription & Billing</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              View your subscription plan and manage billing information.
            </p>
            <button className="text-primary hover:underline text-sm font-medium">
              Coming Soon
            </button>
          </div>
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