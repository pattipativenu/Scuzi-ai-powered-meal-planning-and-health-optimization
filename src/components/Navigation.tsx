"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Plan Ahead", href: "/plan-ahead" },
  { name: "Pantry", href: "/pantry" },
  { name: "Account", href: "/account" }
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && !isGenerating) {
      setIsGenerating(true);
      
      try {
        const response = await fetch("/api/recipes/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchQuery.trim() }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate recipe");
        }

        const data = await response.json();
        
        // Navigate to the recipe page using the correct path
        router.push(`/recipe/${data.recipe.recipe_id}`);
        
        // Reset search
        setSearchQuery("");
        setSearchOpen(false);
      } catch (error) {
        console.error("Error generating recipe:", error);
        alert(error instanceof Error ? error.message : "Failed to generate recipe. Please try again.");
      } finally {
        setIsGenerating(false);
      }
    }
  };

  return (
    <div>
      {/* Fullscreen Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-16 h-16 animate-spin mx-auto text-primary" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Generating Your Recipe</h2>
              <p className="text-muted-foreground">Claude 3.5 Sonnet is creating "{searchQuery}"...</p>
            </div>
          </div>
        </div>
      )}

      <nav className="sticky top-0 z-50 border-b border-border" style={{ backgroundColor: "rgb(209, 222, 38)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg" style={{ fontFamily: '"Right Grotesk Spatial", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"' }}>
              <span className="!whitespace-pre-line">SCUZI</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {/* Search Icon */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                title="Search recipes"
              >
                <Search className="w-5 h-5" style={{ color: "rgb(39, 39, 42)" }} />
              </button>
              
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors hover:opacity-80 ${
                    pathname === link.href ? "opacity-100" : "opacity-90"
                  }`}
                  style={{ 
                    fontFamily: '"Right Grotesk Wide", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
                    fontStyle: "normal",
                    fontWeight: 500,
                    fontSize: "16px",
                    lineHeight: "24px",
                    color: "rgb(39, 39, 42)"
                  }}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center gap-4">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                title="Search recipes"
              >
                <Search className="w-5 h-5" style={{ color: "rgb(39, 39, 42)" }} />
              </button>
              
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors ${
                    pathname === link.href ? "opacity-100" : "opacity-90"
                  }`}
                  style={{ 
                    fontFamily: '"Right Grotesk Wide", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
                    fontStyle: "normal",
                    fontWeight: 500,
                    fontSize: "14px",
                    lineHeight: "20px",
                    color: "rgb(39, 39, 42)"
                  }}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Search Bar (Expandable) */}
          {searchOpen && (
            <div className="pb-4">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search recipes... (e.g., 'chicken curry', 'pancake breakfast')"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-900/20 focus:border-gray-900 focus:outline-none transition-colors"
                  style={{ 
                    fontFamily: '"Right Grotesk Wide", ui-sans-serif, system-ui, sans-serif',
                    fontSize: "16px"
                  }}
                  autoFocus
                  disabled={isGenerating}
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </form>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}