"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, User } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Plan Ahead", href: "/plan-ahead" },
  { name: "Pantry", href: "/pantry" },
  { name: "Account", href: "/account" },
  { name: "AI Chat", href: "/ai-chat" }
];

export function Navigation() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div>
      {/* Fixed Navigation Bar */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/20 backdrop-blur-md shadow-sm"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.85)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Brand Name */}
            <Link 
              href="/" 
              className="font-medium transition-opacity hover:opacity-80"
              style={{ 
                fontFamily: '"Right Grotesk Spatial", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
                fontStyle: "normal",
                fontWeight: 500,
                fontSize: "30px",
                lineHeight: "36px",
                color: "rgb(0, 0, 0)"
              }}
            >
              SCUZI
            </Link>

            {/* Right Side: Icons + Join Button */}
            <div className="flex items-center gap-6">
              {/* Search Icon */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
                aria-label="Search"
              >
                <Search className="w-6 h-6" />
              </button>

              {/* Login Icon */}
              <button
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
                aria-label="Login"
              >
                <User className="w-6 h-6" />
              </button>

              {/* Join SCUZI Button */}
              <Link
                href="/join-scuzi"
                className="px-6 py-3 rounded-lg text-white font-medium transition-transform hover:scale-105 shadow-md"
                style={{
                  background: "linear-gradient(135deg, rgb(255, 87, 34), rgb(76, 175, 80))",
                  fontFamily: '"Right Grotesk Spatial", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
                  fontWeight: 500
                }}
              >
                Join SCUZI
              </Link>
            </div>
          </div>
        </div>

        {/* Search Overlay */}
        {searchOpen && (
          <div className="border-t border-border/20 bg-white/95 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <input
                type="text"
                placeholder="Search for recipes, ingredients, etc..."
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
          </div>
        )}
      </nav>

      {/* Page Navigation Links - Just Above Hero Section */}
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative transition-all hover:opacity-70 group ${
                  pathname === link.href ? "opacity-100" : "opacity-90"
                }`}
                style={{ 
                  fontFamily: '"Right Grotesk Spatial", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
                  fontStyle: "normal",
                  fontWeight: 500,
                  fontSize: "clamp(20px, 4vw, 30px)",
                  lineHeight: "36px",
                  color: "rgb(0, 0, 0)"
                }}
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black transition-all group-hover:w-full" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}