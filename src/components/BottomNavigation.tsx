"use client";

import { Home, Calendar, Package, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNavigation() {
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Calendar, label: "Plan Ahead", href: "/plan-ahead" },
    { icon: Package, label: "Pantry", href: "/pantry" },
    { icon: User, label: "Account", href: "/account" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] pb-safe">
      <div className="flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors"
            >
              <Icon
                className="w-6 h-6"
                style={{
                  color: active ? "rgb(39, 39, 42)" : "rgb(163, 163, 163)",
                  fill: active ? "rgb(39, 39, 42)" : "none",
                  strokeWidth: active ? 2.5 : 2,
                }}
              />
              <span
                style={{
                  fontFamily: '"General Sans", sans-serif',
                  fontSize: "11px",
                  fontWeight: active ? 600 : 400,
                  color: active ? "rgb(39, 39, 42)" : "rgb(163, 163, 163)",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}