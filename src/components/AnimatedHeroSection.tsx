"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export function AnimatedHeroSection() {
  const [imageError, setImageError] = useState(false);

  return (
    <section className="relative overflow-hidden bg-white py-16 md:py-12 lg:py-4">
      <div className="mx-auto px-2 sm:px-6 lg:px-12 max-w-[98vw] sm:max-w-[95vw] lg:max-w-[96vw]">
        {/* Hero Content with Yellow Background - L-shaped container */}
        <div
          className="relative rounded-[33px] overflow-hidden"
          style={{ backgroundColor: "rgb(247, 248, 212)" }}
        >
          {/* Mobile Layout */}
          <div className="block md:hidden">
            <div className="px-4 py-8 text-center space-y-4">
              {/* H1 Title */}
              <h1
                className="heading-h3"
                style={{
                  color: "rgb(0, 0, 0)",
                }}
              >
                your home for easy, delicious meal prep recipes
              </h1>

              {/* Tagline */}
              <p
                style={{ color: "rgb(0, 0, 0)", fontSize: "14px" }}
                className="max-w-xs mx-auto"
              >
                AI-powered meals personalized for you, fueled by your WHOOP
                data.
              </p>

              {/* Start Planning Button - Full width on mobile */}
              <div className="pt-2">
                <Link
                  href="/personalize"
                  className="btn inline-flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors shadow-lg w-full max-w-xs mx-auto"
                >
                  Start Planning
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Mobile Image - Touches bottom with curvature */}
            <div className="relative h-[280px] -mx-0 -mb-0 rounded-b-[33px] overflow-hidden">
              {!imageError ? (
                <Image
                  src="https://scuziassests.s3.us-east-1.amazonaws.com/mealprepmobile-1_2025-05-15-142854_zkhw.png"
                  alt="Delicious meal prep"
                  fill
                  priority
                  unoptimized
                  className="object-cover object-center"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-secondary bg-gray-100 rounded-b-[33px]">
                  <div className="text-center space-y-2">
                    <h4>Image not accessible</h4>
                    <p className="text-sm">
                      Check S3 bucket permissions and CORS
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tablet Layout (768px - 1024px) */}
          <div className="hidden md:block lg:hidden">
            <div className="px-12 py-20 text-center space-y-8">
              {/* H1 Title */}
              <h1
                className="heading-h1 max-w-2xl mx-auto"
                style={{ color: "rgb(0, 0, 0)" }}
              >
                your home for easy, delicious meal prep recipes
              </h1>

              {/* Tagline */}
              <p style={{ color: "rgb(0, 0, 0)" }} className="max-w-lg mx-auto">
                AI-powered meals personalized for you, fueled by your WHOOP
                data.
              </p>

              {/* Start Planning Button - Centered */}
              <div className="pt-4">
                <Link
                  href="/personalize"
                  className="btn inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
                >
                  Start Planning
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* Tablet Image - Reaches edges with bottom curvature */}
            <div className="relative h-[400px] -mx-0 -mb-0 rounded-b-[33px] overflow-hidden">
              {!imageError ? (
                <Image
                  src="https://scuziassests.s3.us-east-1.amazonaws.com/hero%20image.webp"
                  alt="Delicious meal prep"
                  fill
                  priority
                  unoptimized
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-secondary bg-gray-100">
                  <div className="text-center space-y-2">
                    <h4>Image not accessible</h4>
                    <p className="text-sm">
                      Check S3 bucket permissions and CORS
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Layout (>1024px) */}
          <div className="hidden lg:grid lg:grid-cols-2 lg:items-center lg:min-h-[85vh]">
            {/* Left Side - Text Content */}
            <div className="px-20 py-20 space-y-6">
              {/* H1 Title */}
              <h1 className="heading-h1" style={{ color: "rgb(0, 0, 0)" }}>
                your home for easy, delicious meal prep recipes
              </h1>

              {/* Tagline */}
              <p style={{ color: "rgb(0, 0, 0)" }} className="max-w-md">
                AI-powered meals personalized for you, fueled by your WHOOP
                data.
              </p>

              {/* Start Planning Button - Left aligned */}
              <div className="pt-4">
                <Link
                  href="/personalize"
                  className="btn inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
                >
                  Start Planning
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* Right Side - Hero Image - Touches top, bottom, right edges */}
            <div className="relative h-full min-h-[85vh] -mt-0 -mb-0 -mr-0 rounded-r-[33px] overflow-hidden">
              {!imageError ? (
                <Image
                  src="https://scuziassests.s3.us-east-1.amazonaws.com/hero%20image.webp"
                  alt="Delicious meal prep"
                  fill
                  priority
                  unoptimized
                  className="object-cover object-right"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-secondary bg-gray-100">
                  <div className="text-center space-y-2">
                    <h4>Image not accessible</h4>
                    <p className="text-sm">
                      Check S3 bucket permissions and CORS
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
