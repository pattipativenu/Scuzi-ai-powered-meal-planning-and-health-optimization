"use client";

import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { Navigation } from "@/components/Navigation";
import { BottomNavigation } from "@/components/BottomNavigation";
import { FloatingAskScuzi } from "@/components/FloatingAskScuzi";
import { Toaster } from "@/components/ui/sonner";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children
}: Readonly<{
children: React.ReactNode;
}>) {
  const pathname = usePathname();
  
  // FloatingAskScuzi should only appear on Home, Plan Ahead, and Pantry
  const showFloatingButton = pathname === '/' || pathname === '/plan-ahead' || pathname === '/pantry';

  return (
    <html lang="en">
      <body className="antialiased">
        {/* Mobile-only: Fixed persistent layout structure */}
        <div className="md:contents flex flex-col min-h-screen overflow-hidden">
          {/* Top Navigation - Always visible except on chat page mobile */}
          <div className="md:relative md:top-auto fixed top-0 left-0 right-0 z-50">
            <Navigation />
          </div>
          
          {/* Main Content Area - Scrollable with proper padding on mobile */}
          <main className="md:flex-none flex-1 overflow-y-auto scrollbar-hide md:pb-0 pb-20">
            {children}
          </main>
          
          {/* Bottom Navigation - Mobile only, always visible */}
          <BottomNavigation />
          
          {/* Floating Ask Scuzi Button - Only on Home, Plan Ahead, Pantry */}
          {showFloatingButton && <FloatingAskScuzi />}
        </div>
        
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}