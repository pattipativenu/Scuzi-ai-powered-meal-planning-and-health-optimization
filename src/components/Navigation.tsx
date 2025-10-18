"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Camera, Upload } from "lucide-react";
import { useState, useEffect, useRef } from "react";

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
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);

  const placeholders = [
    "Have leftovers? I can make a meal.",
    "Want to know nutrition of your meal? Let me know.",
    "Need a meal plan? I can do that.",
    "Worried about your food or have a doubt about your food? Ask me."
  ];

  // Rotate placeholder text
  useEffect(() => {
    if (!searchQuery && searchOpen) {
      const interval = setInterval(() => {
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [searchQuery, searchOpen, placeholders.length]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };

    if (searchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [searchOpen]);

  // Close on Esc key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
      }
    };

    if (searchOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [searchOpen]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && !isGenerating) {
      setIsGenerating(true);
      const encodedQuery = encodeURIComponent(searchQuery.trim());
      router.push(`/generate/${encodedQuery}`);
      
      setSearchQuery("");
      setSearchOpen(false);
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <nav className="sticky top-0 z-50 border-b border-border" style={{ backgroundColor: "rgb(209, 222, 38)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg" style={{ fontFamily: '"Right Grotesk Spatial", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"' }}>
              <span className="!whitespace-pre-line">SCUZI</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {/* Floating Search Box Container */}
              <div className="relative" ref={searchRef}>
                {/* Floating Search Input */}
                {searchOpen && (
                  <div 
                    className="absolute right-14 top-1/2 -translate-y-1/2 z-50 animate-in fade-in slide-in-from-right-2 duration-300"
                    style={{
                      width: "320px",
                      height: "48px"
                    }}
                  >
                    <form onSubmit={handleSearch} className="relative w-full h-full">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={isGenerating ? "Generating your recipe…" : placeholders[placeholderIndex]}
                        className="w-full h-full pl-4 pr-20 rounded-xl bg-white shadow-lg border-0 focus:outline-none focus:ring-2 focus:ring-black/10 transition-all shimmer-placeholder"
                        style={{
                          fontFamily: '"Right Grotesk Wide", ui-sans-serif, system-ui, sans-serif',
                          fontWeight: 500,
                          fontSize: "16px",
                          lineHeight: "24px",
                          color: "rgb(39, 39, 42)"
                        }}
                        autoFocus
                        disabled={isGenerating}
                      />
                      
                      {/* Icons Container */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <button
                          type="button"
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Take photo"
                        >
                          <Camera className="w-4 h-4" style={{ color: "rgb(39, 39, 42)" }} />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Upload photo"
                        >
                          <Upload className="w-4 h-4" style={{ color: "rgb(39, 39, 42)" }} />
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Search Icon Button */}
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                  title="Search recipes"
                >
                  <Search className="w-5 h-5" style={{ color: "rgb(39, 39, 42)" }} />
                </button>
              </div>
              
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
          
          {/* Mobile Search Bar (Expandable below nav) */}
          {searchOpen && (
            <div className="md:hidden pb-4">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isGenerating ? "Generating your recipe…" : placeholders[placeholderIndex]}
                  className="w-full px-4 py-3 pr-24 rounded-lg border-2 border-gray-900/20 focus:border-gray-900 focus:outline-none transition-colors shimmer-placeholder"
                  style={{ 
                    fontFamily: '"Right Grotesk Wide", ui-sans-serif, system-ui, sans-serif',
                    fontSize: "16px"
                  }}
                  autoFocus
                  disabled={isGenerating}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    type="button"
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Take photo"
                  >
                    <Camera className="w-4 h-4" style={{ color: "rgb(39, 39, 42)" }} />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Upload photo"
                  >
                    <Upload className="w-4 h-4" style={{ color: "rgb(39, 39, 42)" }} />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}