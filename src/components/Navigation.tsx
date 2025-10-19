"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { WhoopMiniMetrics } from "@/components/WhoopMiniMetrics";
import { useWhoopConnect } from "@/hooks/useWhoopConnect";

export function Navigation() {
  const pathname = usePathname();
  const { connect, isLoading: whoopLoading } = useWhoopConnect();

  const handleWhoopConnect = async () => {
    await connect();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 md:sticky md:border-b md:border-border">
      {/* Mobile-only unified top navigation */}
      <div className="md:hidden" style={{ backgroundColor: "rgb(246, 248, 115)" }}>
        <div className="flex items-center justify-between px-4 py-3">
          {/* WHOOP Button - Left */}
          <button
            onClick={handleWhoopConnect}
            disabled={whoopLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black text-white hover:bg-gray-800 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <span style={{ 
              fontFamily: '"Right Grotesk Wide", sans-serif', 
              fontWeight: 500, 
              fontSize: "11px", 
              textTransform: "uppercase", 
              letterSpacing: "0.3px" 
            }}>
              WHOOP
            </span>
          </button>

          {/* SCUZI - Center */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <h1 style={{
              fontFamily: '"Right Grotesk Spatial", sans-serif',
              fontSize: "28px",
              fontWeight: 800,
              letterSpacing: "1px",
              color: "rgb(0, 0, 0)"
            }}>
              SCUZI
            </h1>
          </Link>

          {/* WHOOP Metrics - Right */}
          <div className="flex-shrink-0 max-w-[140px] overflow-hidden">
            <WhoopMiniMetrics />
          </div>
        </div>
      </div>

      {/* Desktop navigation - placeholder for future desktop implementation */}
      <div className="hidden md:block">
        <div style={{ backgroundColor: "rgb(209, 222, 38)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-6 h-20">
              <Link href="/" className="flex items-center gap-2 font-semibold text-lg" style={{ fontFamily: '"Right Grotesk Spatial", sans-serif' }}>
                <span>SCUZI</span>
              </Link>
            </div>
          </div>
        </div>
        <div style={{ backgroundColor: "rgb(250, 250, 250)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 h-20">
              <button
                onClick={handleWhoopConnect}
                disabled={whoopLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white hover:bg-gray-800 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                <span style={{ 
                  fontFamily: '"Right Grotesk Wide", sans-serif', 
                  fontWeight: 500, 
                  fontSize: "12px", 
                  textTransform: "uppercase", 
                  letterSpacing: "0.3px" 
                }}>
                  {whoopLoading ? "CONNECTING..." : "WHOOP CONNECT"}
                </span>
              </button>
              <div className="flex-1 overflow-hidden">
                <WhoopMiniMetrics />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}