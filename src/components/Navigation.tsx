"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Camera, Upload, Menu, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const navLinks = [
  { name: "Home Page", href: "/" },
  { name: "Plan Ahead", href: "/plan-ahead" },
  { name: "Pantry", href: "/pantry" },
  { name: "Account", href: "/account" }
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

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

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      sessionStorage.setItem('chatInitialQuery', searchQuery.trim());
      sessionStorage.setItem('chatAutoSend', 'true');
      router.push('/chat');
      setSearchQuery("");
    }
  };

  const handleSearchIconClick = () => {
    if (searchQuery.trim()) {
      sessionStorage.setItem('chatInitialQuery', searchQuery.trim());
      sessionStorage.setItem('chatAutoSend', 'true');
      router.push('/chat');
      setSearchQuery("");
    } else {
      // Just navigate to chat if no query
      router.push('/chat');
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(mediaStream);
      setShowCamera(true);
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Camera not available:", error);
      // Fallback to file upload
      fileInputRef.current?.click();
    }
  };

  const capturePhoto = () => {
    if (cameraVideoRef.current) {
      const video = cameraVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg");
        
        // Store image and navigate to chat
        sessionStorage.setItem('chatInitialImage', imageData);
        if (searchQuery.trim()) {
          sessionStorage.setItem('chatInitialQuery', searchQuery.trim());
        }
        sessionStorage.setItem('chatAutoSend', 'true');
        
        closeCamera();
        router.push('/chat');
        setSearchQuery("");
      }
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Store image and navigate to chat
        sessionStorage.setItem('chatInitialImage', reader.result as string);
        if (searchQuery.trim()) {
          sessionStorage.setItem('chatInitialQuery', searchQuery.trim());
        }
        sessionStorage.setItem('chatAutoSend', 'true');
        router.push('/chat');
        setSearchQuery("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraClick = () => {
    startCamera();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="flex-1 relative">
            <video
              ref={cameraVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
          <div className="bg-white p-4 flex justify-center gap-4">
            <button
              onClick={closeCamera}
              className="px-6 py-3 text-[rgb(39,39,42)] hover:bg-gray-100 rounded-lg transition-colors"
              style={{
                fontFamily: '"Right Grotesk Wide", sans-serif',
                fontSize: '16px',
                fontWeight: 500
              }}
            >
              Cancel
            </button>
            <button
              onClick={capturePhoto}
              className="bg-[rgb(209,222,38)] hover:bg-[rgb(209,222,38)]/90 text-[rgb(39,39,42)] rounded-full w-16 h-16 flex items-center justify-center"
            >
              <Camera className="h-8 w-8" />
            </button>
          </div>
        </div>
      )}

      <nav className="sticky top-0 z-50 border-b border-border" style={{ backgroundColor: "rgb(209, 222, 38)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-6 h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg flex-shrink-0" style={{ fontFamily: '"Right Grotesk Spatial", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"' }}>
              <span className="!whitespace-pre-line">SCUZI</span>
            </Link>

            {/* Always-Visible Search Bar */}
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
                
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                
                {/* Icons Container */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    className="p-2 hover:bg-black/5 rounded-lg transition-colors icon-glow"
                    title="Take photo"
                    onClick={handleCameraClick}
                  >
                    <Camera className="w-5 h-5" style={{ color: "rgb(39, 39, 42)" }} />
                  </button>
                  <button
                    type="button"
                    className="p-2 hover:bg-black/5 rounded-lg transition-colors icon-glow"
                    title="Upload photo"
                    onClick={handleUploadClick}
                  >
                    <Upload className="w-5 h-5" style={{ color: "rgb(39, 39, 42)" }} />
                  </button>
                  <button
                    type="button"
                    onClick={handleSearchIconClick}
                    className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                    title="Search"
                  >
                    <Search className="w-5 h-5" style={{ color: "rgb(39, 39, 42)" }} />
                  </button>
                </div>
              </form>
            </div>

            {/* Desktop: Hamburger Menu */}
            <div className="hidden md:block relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                title="Menu"
              >
                {menuOpen ? (
                  <X className="w-6 h-6" style={{ color: "rgb(39, 39, 42)" }} />
                ) : (
                  <Menu className="w-6 h-6" style={{ color: "rgb(39, 39, 42)" }} />
                )}
              </button>

              {/* Dropdown Menu */}
              {menuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 animate-in fade-in slide-in-from-top-2 duration-200"
                  style={{
                    border: "1px solid rgba(0,0,0,0.1)"
                  }}
                >
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={`block px-4 py-3 transition-colors hover:bg-gray-50 ${
                        pathname === link.href ? "bg-gray-100" : ""
                      }`}
                      style={{ 
                        fontFamily: '"Right Grotesk Wide", ui-sans-serif, system-ui, sans-serif',
                        fontWeight: 500,
                        fontSize: "16px",
                        lineHeight: "24px",
                        color: "rgb(39, 39, 42)"
                      }}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile: Hamburger Menu */}
            <div className="md:hidden relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                title="Menu"
              >
                {menuOpen ? (
                  <X className="w-5 h-5" style={{ color: "rgb(39, 39, 42)" }} />
                ) : (
                  <Menu className="w-5 h-5" style={{ color: "rgb(39, 39, 42)" }} />
                )}
              </button>

              {/* Mobile Dropdown Menu */}
              {menuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 animate-in fade-in slide-in-from-top-2 duration-200"
                  style={{
                    border: "1px solid rgba(0,0,0,0.1)"
                  }}
                >
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={`block px-4 py-3 transition-colors hover:bg-gray-50 ${
                        pathname === link.href ? "bg-gray-100" : ""
                      }`}
                      style={{ 
                        fontFamily: '"Right Grotesk Wide", ui-sans-serif, system-ui, sans-serif',
                        fontWeight: 500,
                        fontSize: "14px",
                        lineHeight: "20px",
                        color: "rgb(39, 39, 42)"
                      }}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}