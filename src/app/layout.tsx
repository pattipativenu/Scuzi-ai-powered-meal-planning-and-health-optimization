"use client";

import "./globals.css";
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
  
  // Chat page needs special layout handling
  const isChatPage = pathname === '/chat';

  return (
    <html lang="en">
      <head>
        <title>Scuzi AI - Food & Health Chat</title>
        <meta name="description" content="AI-powered meal planning and health chat" />
      </head>
      <body className="antialiased">
        {isChatPage ? (
          // Chat page: Special layout for desktop/tablet fixed positioning, mobile unchanged
          <div className="md:h-screen md:overflow-hidden flex flex-col min-h-screen overflow-hidden md:bg-gray-50">
            {/* Top Navigation - Fixed on all screen sizes */}
            <div className="fixed top-0 left-0 right-0 z-50">
              <Navigation />
            </div>
            
            {/* Chat Content - Full height with nav padding */}
            <main className="md:h-full flex-1 overflow-y-auto scrollbar-hide pb-20 md:bg-gray-50 md:pb-0 pt-40">
              {children}
            </main>
            
            {/* Bottom Navigation - Same as before */}
            <BottomNavigation />
          </div>
        ) : (
          // Regular pages: Normal layout structure
          <div className="md:contents flex flex-col min-h-screen overflow-hidden">
            {/* Top Navigation - Always visible and fixed */}
            <div className="fixed top-0 left-0 right-0 z-50">
              <Navigation />
            </div>
            
            {/* Main Content Area - Scrollable with proper padding for fixed nav */}
            <main className="md:flex-none flex-1 overflow-y-auto scrollbar-hide md:pb-0 pb-20 pt-20 md:pt-40">
              {children}
            </main>
            
            {/* Bottom Navigation - Mobile only, always visible */}
            <BottomNavigation />
            
            {/* Floating Ask Scuzi Button - Only on Home, Plan Ahead, Pantry */}
            {showFloatingButton && <FloatingAskScuzi />}
          </div>
        )}
        
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}