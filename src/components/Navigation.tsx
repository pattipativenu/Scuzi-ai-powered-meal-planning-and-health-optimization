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
      <nav className="sticky top-0 z-50 border-b border-border" style={{ backgroundColor: "rgb(209, 222, 38)" }}>
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
        </div>
      </nav>
    </div>);

}