"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export function AnimatedHeroSection() {
  const [imageError, setImageError] = useState(false);

  return (
    <section
      className="relative py-16 md:py-24 overflow-hidden bg-white">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center !w-full !h-full">
          {/* Left Side - Text Content */}
          <div className="z-10 space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Your home for easy, delicious meal prep recipes
            </h1>
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
              Plan your week with confidence. Get organized, save time, and enjoy healthy meals every day.
            </p>
            <Link
              href="/plan-ahead"
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors shadow-lg">

              Start Planning
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Right Side - Hero Image */}
          <div className="relative h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden rounded-3xl">
            {!imageError ?
            <Image
              src="https://scuziassests.s3.us-east-1.amazonaws.com/hero%20image.webp"
              alt="Delicious meal prep"
              fill
              className="object-cover object-center"
              onError={() => setImageError(true)}
              unoptimized /> :


            <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-100 rounded-3xl">
                <div className="text-center space-y-2">
                  <p className="font-semibold">Image not accessible</p>
                  <p className="text-sm">Check S3 bucket permissions and CORS</p>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </section>);

}