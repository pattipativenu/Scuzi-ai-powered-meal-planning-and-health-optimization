"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";

const navLinks = [
{ name: "Home", href: "/" },
{ name: "Plan Ahead", href: "/plan-ahead" },
{ name: "Pantry", href: "/pantry" },
{ name: "Account", href: "/account" }];


export function Navigation() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement recipe search functionality
      console.log("Searching for:", searchQuery);
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
              {/* Search Icon */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                title="Search recipes"
              >
                <Search className="w-5 h-5" style={{ color: "rgb(39, 39, 42)" }} />
              </button>
              
              {navLinks.map((link) =>
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors hover:opacity-80 ${
                pathname === link.href ?
                "opacity-100" :
                "opacity-90"}`
                }
                style={{ 
                  fontFamily: '"Right Grotesk Wide", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
                  fontStyle: "normal",
                  fontWeight: 500,
                  fontSize: "16px",
                  lineHeight: "24px",
                  color: "rgb(39, 39, 42)"
                }}>

                  {link.name}
                </Link>
              )}
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
              
              {navLinks.map((link) =>
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors ${
                pathname === link.href ?
                "opacity-100" :
                "opacity-90"}`
                }
                style={{ 
                  fontFamily: '"Right Grotesk Wide", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
                  fontStyle: "normal",
                  fontWeight: 500,
                  fontSize: "14px",
                  lineHeight: "20px",
                  color: "rgb(39, 39, 42)"
                }}>

                  {link.name}
                </Link>
              )}
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
                  placeholder="Search recipes..."
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-900/20 focus:border-gray-900 focus:outline-none transition-colors"
                  style={{ 
                    fontFamily: '"Right Grotesk Wide", ui-sans-serif, system-ui, sans-serif',
                    fontSize: "16px"
                  }}
                  autoFocus
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </form>
            </div>
          )}
        </div>
      </nav>
    </div>);

}