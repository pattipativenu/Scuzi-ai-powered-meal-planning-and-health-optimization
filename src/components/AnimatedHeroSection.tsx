"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function AnimatedHeroSection() {
  const [imageError, setImageError] = useState(false);

  return (
    <section className="relative py-20 md:py-28 lg:py-32 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center !w-full !h-full rounded-[2rem] p-8 md:p-12 lg:p-16" style={{ backgroundColor: "rgb(247, 248, 212)" }}>
          {/* Left Side - Text Content */}
          <div className="z-10 space-y-6">
            <h1 
              className="font-medium leading-tight"
              style={{
                fontFamily: '"Right Grotesk Spatial", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
                fontStyle: "normal",
                fontWeight: 500,
                fontSize: "clamp(32px, 5vw, 48px)",
                lineHeight: "1.2",
                color: "rgb(0, 0, 0)"
              }}
            >
              Your home for easy, delicious meal prep recipes
            </h1>
            <p 
              className="leading-relaxed"
              style={{
                fontFamily: '"Right Grotesk Spatial", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
                fontStyle: "normal",
                fontWeight: 500,
                fontSize: "clamp(18px, 3vw, 24px)",
                lineHeight: "1.5",
                color: "rgb(0, 0, 0)"
              }}
            >
              Plan your week with confidence. Get organized, save time, and enjoy healthy meals every day.
            </p>
            <Link
              href="/plan-ahead"
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors shadow-lg"
              style={{
                fontFamily: '"Right Grotesk Spatial", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
                fontWeight: 500
              }}
            >
              Start Planning
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Right Side - Hero Image */}
          <div className="relative h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden rounded-3xl">
            {!imageError ? (
              <Image
                src="https://scuziassests.s3.us-east-1.amazonaws.com/hero%20image.webp"
                alt="Delicious meal prep"
                fill
                className="object-cover object-center"
                onError={() => setImageError(true)}
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-100 rounded-3xl">
                <div className="text-center space-y-2">
                  <p className="font-semibold">Image not accessible</p>
                  <p className="text-sm">Check S3 bucket permissions and CORS</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}