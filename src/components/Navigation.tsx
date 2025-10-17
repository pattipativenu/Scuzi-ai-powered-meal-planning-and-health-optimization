"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
{ name: "Home", href: "/" },
{ name: "Plan Ahead", href: "/plan-ahead" },
{ name: "Pantry", href: "/pantry" },
{ name: "Account", href: "/account" }];


export function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div>
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg" style={{ fontFamily: '"Right Grotesk Spatial", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"' }}>
              <span className="!whitespace-pre-line">SCUZI</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) =>
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === link.href ?
                "text-foreground" :
                "text-muted-foreground"}`
                }
                style={{ fontFamily: 'var(--font-heading)' }}>

                  {link.name}
                </Link>
              )}
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center gap-4">
              {navLinks.map((link) =>
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs font-medium transition-colors ${
                pathname === link.href ?
                "text-foreground" :
                "text-muted-foreground"}`
                }>

                  {link.name}
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>);

}