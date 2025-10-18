"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Camera, Upload, ArrowLeft } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WhoopMiniMetrics } from "@/components/WhoopMiniMetrics";

// Animation variants for the menu
const perspective = {
  initial: { opacity: 0, rotateX: 90, translateY: 80, translateX: -20 },
  enter: (i: number) => ({
    opacity: 1, rotateX: 0, translateY: 0, translateX: 0,
    transition: {
      duration: 0.65,
      delay: 0.5 + (i * 0.1),
      ease: [.215, .61, .355, 1],
      opacity: { duration: 0.35 }
    }
  }),
  exit: { opacity: 0, transition: { duration: 0.5, type: "linear", ease: [0.76, 0, 0.24, 1] } }
};

const slideIn = {
  initial: { opacity: 0, y: 20 },
  enter: (i: number) => ({
    opacity: 1, y: 0,
    transition: {
      duration: 0.5,
      delay: 0.75 + (i * 0.1),
      ease: [.215, .61, .355, 1]
    }
  }),
  exit: { opacity: 0, transition: { duration: 0.5, type: "tween", ease: "easeInOut" } }
};

const menuVariants = {
  open: {
    width: "480px",
    height: "650px",
    top: "0px",
    right: "-25px",
    transition: { duration: 0.75, type: "tween", ease: [0.76, 0, 0.24, 1] }
  },
  closed: {
    width: "100px",
    height: "40px",
    top: "0px",
    right: "0px",
    transition: { duration: 0.75, delay: 0.35, type: "tween", ease: [0.76, 0, 0.24, 1] }
  }
};

const navLinks = [
  { name: "home", href: "/" },
  { name: "plan ahead", href: "/plan-ahead" },
  { name: "pantry", href: "/pantry" },
  { name: "account", href: "/account" }
];

const footerLinks = [
  { title: "Facebook", href: "https://facebook.com" },
  { title: "LinkedIn", href: "https://linkedin.com" },
  { title: "Instagram", href: "https://instagram.com" },
  { title: "Twitter", href: "https://twitter.com" }
];

// PerspectiveText component for button animation
const PerspectiveText = ({ label }: { label: string }) => {
  return (
    <div className="flex flex-col justify-center items-center h-full w-full" style={{ transformStyle: "preserve-3d", transition: "transform 0.75s cubic-bezier(0.76, 0, 0.24, 1)" }}>
      <p className="uppercase font-bold m-0 pointer-events-none" style={{ transition: "all 0.75s cubic-bezier(0.76, 0, 0.24, 1)" }}>{label}</p>
      <p className="uppercase font-bold m-0 pointer-events-none absolute opacity-0" style={{ transformOrigin: "bottom center", transform: "rotateX(-90deg) translateY(9px)", transition: "all 0.75s cubic-bezier(0.76, 0, 0.24, 1)" }}>{label}</p>
    </div>
  );
};

// Button component
const MenuButton = ({ isActive, toggleMenu }: { isActive: boolean; toggleMenu: () => void }) => {
  return (
    <div className="absolute top-0 right-0 w-[100px] h-[40px] cursor-pointer rounded-[25px] overflow-hidden">
      <motion.div
        className="relative w-full h-full"
        animate={{ top: isActive ? "-100%" : "0%" }}
        transition={{ duration: 0.5, type: "tween", ease: [0.76, 0, 0.24, 1] }}
      >
        <div 
          className="w-full h-full flex items-center justify-center hover:[&_.perspectiveText]:rotate-x-90"
          style={{ backgroundColor: "rgb(209, 222, 38)" }}
          onClick={toggleMenu}
        >
          <PerspectiveText label="Menu" />
        </div>
        <div 
          className="w-full h-full flex items-center justify-center bg-black"
          onClick={toggleMenu}
        >
          <div className="flex flex-col justify-center items-center h-full w-full" style={{ transformStyle: "preserve-3d", transition: "transform 0.75s cubic-bezier(0.76, 0, 0.24, 1)" }}>
            <p className="uppercase font-bold m-0 pointer-events-none" style={{ color: "rgb(209, 222, 38)", transition: "all 0.75s cubic-bezier(0.76, 0, 0.24, 1)" }}>Close</p>
            <p className="uppercase font-bold m-0 pointer-events-none absolute opacity-0" style={{ color: "rgb(209, 222, 38)", transformOrigin: "bottom center", transform: "rotateX(-90deg) translateY(9px)", transition: "all 0.75s cubic-bezier(0.76, 0, 0.24, 1)" }}>Close</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Nav component
const Nav = ({ setMenuOpen }: { setMenuOpen: (open: boolean) => void }) => {
  return (
    <div className="flex flex-col justify-between h-full box-border p-[100px_40px_50px_40px]" style={{ color: "rgb(17, 24, 39)" }}>
      <div className="flex flex-col gap-[10px]">
        {navLinks.map((link, i) => (
          <div key={`b_${i}`} style={{ perspective: "120px", perspectiveOrigin: "bottom" }}>
            <motion.a
              href={link.href}
              custom={i}
              variants={perspective}
              initial="initial"
              animate="enter"
              exit="exit"
              onClick={() => setMenuOpen(false)}
              className="block cursor-pointer no-underline"
              style={{
                fontFamily: '"Right Grotesk Spatial", sans-serif',
                fontSize: "65px",
                lineHeight: "58px",
                fontWeight: 700,
                color: "rgb(17, 24, 39)"
              }}
            >
              {link.name}
            </motion.a>
          </div>
        ))}
      </div>
      <motion.div className="flex flex-wrap">
        {footerLinks.map((link, i) => (
          <motion.a
            variants={slideIn}
            custom={i}
            initial="initial"
            animate="enter"
            exit="exit"
            key={`f_${i}`}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-1/2 mt-[5px] no-underline"
            style={{
              color: "rgb(17, 24, 39)",
              fontSize: "14px"
            }}
          >
            {link.title}
          </motion.a>
        ))}
      </motion.div>
    </div>
  );
};

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const placeholders = [
    "Have leftovers? I can make a meal.",
    "Want to know nutrition of your meal? Let me know.",
    "Need a meal plan? I can do that.",
    "Worried about your food or have a doubt about your food? Ask me."
  ];

  // Rotate placeholder text
  useEffect(() => {
    if (!searchQuery) {
      const interval = setInterval(() => {
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [searchQuery, placeholders.length]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      sessionStorage.setItem('chatInitialQuery', searchQuery.trim());
    }
    router.push('/chat');
    setSearchQuery("");
  };

  const handleSearchIconClick = () => {
    if (searchQuery.trim()) {
      sessionStorage.setItem('chatInitialQuery', searchQuery.trim());
    }
    router.push('/chat');
    setSearchQuery("");
  };

  const handleGoBack = () => {
    router.push('/');
  };

  const isOnChatPage = pathname === '/chat';
  const hasSearchQuery = searchQuery.length > 0;

  return (
    <nav className="sticky top-0 z-50 border-b border-border">
      {/* Top Bar - Yellow Background */}
      <div style={{ backgroundColor: "rgb(209, 222, 38)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-6 h-20">
            {/* Chat Page Layout */}
            {isOnChatPage && (
              <>
                <div className="hidden md:flex items-center gap-4 absolute left-8">
                  <button
                    onClick={handleGoBack}
                    className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                    title="Go Back"
                  >
                    <ArrowLeft className="w-6 h-6" style={{ color: "rgb(39, 39, 42)" }} />
                  </button>
                  <Link href="/" className="flex items-center gap-2 font-semibold text-lg" style={{ fontFamily: '"Right Grotesk Spatial", ui-sans-serif, system-ui, sans-serif' }}>
                    <span>SCUZI</span>
                  </Link>
                </div>

                <div className="md:hidden flex items-center justify-between gap-6 w-full">
                  <Link href="/" className="flex items-center gap-2 font-semibold text-lg flex-shrink-0" style={{ fontFamily: '"Right Grotesk Spatial", ui-sans-serif, system-ui, sans-serif' }}>
                    <span>SCUZI</span>
                  </Link>

                  <div className="flex-1 max-w-2xl">
                    <form onSubmit={handleSearch} className="relative w-full">
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={placeholders[placeholderIndex]}
                        className="w-full h-11 pl-4 pr-28 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-black/10 transition-all shimmer-placeholder"
                        style={{
                          backgroundColor: "rgb(209, 222, 38)",
                          fontFamily: '"Right Grotesk Wide", ui-sans-serif, system-ui, sans-serif',
                          fontWeight: 500,
                          fontSize: "16px",
                          lineHeight: "24px",
                          color: "rgb(39, 39, 42)",
                          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.05)"
                        }}
                      />
                      
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                          type="button"
                          className="p-2 hover:bg-black/5 rounded-lg transition-all"
                          style={{ opacity: hasSearchQuery ? 1 : 0.4 }}
                          title="Take photo"
                          onClick={handleSearchIconClick}
                        >
                          <Camera className="w-5 h-5" style={{ color: "rgb(39, 39, 42)" }} />
                        </button>
                        <button
                          type="button"
                          className="p-2 hover:bg-black/5 rounded-lg transition-all"
                          style={{ opacity: hasSearchQuery ? 1 : 0.4 }}
                          title="Upload photo"
                          onClick={handleSearchIconClick}
                        >
                          <Upload className="w-5 h-5" style={{ color: "rgb(39, 39, 42)" }} />
                        </button>
                        <button
                          type="button"
                          onClick={handleSearchIconClick}
                          className="p-2 hover:bg-black/5 rounded-lg transition-all"
                          style={{ opacity: hasSearchQuery ? 1 : 0.4 }}
                          title="Search"
                        >
                          <Search className="w-5 h-5" style={{ color: "rgb(39, 39, 42)" }} />
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </>
            )}

            {/* Default Layout */}
            {!isOnChatPage && (
              <>
                <Link href="/" className="flex items-center gap-2 font-semibold text-lg flex-shrink-0 absolute left-8" style={{ fontFamily: '"Right Grotesk Spatial", ui-sans-serif, system-ui, sans-serif' }}>
                  <span>SCUZI</span>
                </Link>

                <div className="flex-1 max-w-2xl mx-auto">
                  <form onSubmit={handleSearch} className="relative w-full">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={placeholders[placeholderIndex]}
                      className="w-full h-11 pl-4 pr-28 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-black/10 transition-all shimmer-placeholder"
                      style={{
                        backgroundColor: "rgb(209, 222, 38)",
                        fontFamily: '"Right Grotesk Wide", ui-sans-serif, system-ui, sans-serif',
                        fontWeight: 500,
                        fontSize: "16px",
                        lineHeight: "24px",
                        color: "rgb(39, 39, 42)",
                        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.05)"
                      }}
                    />
                    
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        className="p-2 hover:bg-black/5 rounded-lg transition-all"
                        style={{ opacity: hasSearchQuery ? 1 : 0.4 }}
                        title="Take photo"
                        onClick={handleSearchIconClick}
                      >
                        <Camera className="w-5 h-5" style={{ color: "rgb(39, 39, 42)" }} />
                      </button>
                      <button
                        type="button"
                        className="p-2 hover:bg-black/5 rounded-lg transition-all"
                        style={{ opacity: hasSearchQuery ? 1 : 0.4 }}
                        title="Upload photo"
                        onClick={handleSearchIconClick}
                      >
                        <Upload className="w-5 h-5" style={{ color: "rgb(39, 39, 42)" }} />
                      </button>
                      <button
                        type="button"
                        onClick={handleSearchIconClick}
                        className="p-2 hover:bg-black/5 rounded-lg transition-all"
                        style={{ opacity: hasSearchQuery ? 1 : 0.4 }}
                        title="Search"
                      >
                        <Search className="w-5 h-5" style={{ color: "rgb(39, 39, 42)" }} />
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Second Row - Whitish Background with WHOOP Connect and Menu */}
      <div style={{ backgroundColor: "rgb(250, 250, 250)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 h-24">
            {/* WHOOP Connect Button */}
            <Link href="/connect" className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-black text-white hover:bg-gray-800 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              <span style={{ fontFamily: '"Right Grotesk Wide", sans-serif', fontWeight: 500, fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                WHOOP CONNECT
              </span>
            </Link>

            {/* WHOOP Mini Metrics */}
            <div className="hidden lg:flex flex-1 justify-center">
              <WhoopMiniMetrics />
            </div>

            {/* Menu Button with Animation */}
            <div className="relative h-[40px] flex items-center ml-auto">
              <motion.div
                className="rounded-[25px] absolute overflow-hidden"
                style={{ backgroundColor: "rgb(209, 222, 38)" }}
                variants={menuVariants}
                animate={menuOpen ? "open" : "closed"}
                initial="closed"
              >
                <AnimatePresence>
                  {menuOpen && <Nav setMenuOpen={setMenuOpen} />}
                </AnimatePresence>
              </motion.div>
              <MenuButton isActive={menuOpen} toggleMenu={() => setMenuOpen(!menuOpen)} />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}