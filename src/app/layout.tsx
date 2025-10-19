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
  return (
    <html lang="en">
      <body className="antialiased">
        {/* Top Navigation - Fixed on mobile */}
        <Navigation />
        
        {/* Main Content - Scrollable with proper padding */}
        <main className="md:min-h-screen pt-[64px] pb-[80px] md:pt-0 md:pb-0 overflow-y-auto scrollbar-hide">
          {children}
        </main>
        
        {/* Bottom Navigation - Mobile only */}
        <BottomNavigation />
        
        {/* Floating Ask Scuzi Button - Handles visibility internally */}
        <FloatingAskScuzi />
        
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}