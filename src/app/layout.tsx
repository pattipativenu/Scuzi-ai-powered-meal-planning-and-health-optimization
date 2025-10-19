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
  const isOnChatPage = pathname === '/chat';

  return (
    <html lang="en">
      <body className="antialiased">
        <Navigation />
        {children}
        <Toaster richColors position="top-center" />
        
        {!isOnChatPage && <FloatingAskScuzi />}
        
        <BottomNavigation />
      </body>
    </html>);

}