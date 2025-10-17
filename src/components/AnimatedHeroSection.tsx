"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";

interface AnimatedHeroSectionProps {
  foodImages?: string[];
  cookingImages?: string[];
  snackImages?: string[];
}

export function AnimatedHeroSection({
  foodImages = [],
  cookingImages = [],
  snackImages = [],
}: AnimatedHeroSectionProps) {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState({
    food: foodImages,
    cooking: cookingImages,
    snacks: snackImages,
  });

  // Generate images if not provided
  useEffect(() => {
    if (foodImages.length === 0 || cookingImages.length === 0 || snackImages.length === 0) {
      generateAllImages();
    }
  }, []);

  const generateAllImages = async () => {
    setLoading(true);
    try {
      const [foodRes, cookingRes, snacksRes] = await Promise.all([
        fetch("/api/generate-hero-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: "food", count: 8 }),
        }),
        fetch("/api/generate-hero-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: "cooking", count: 8 }),
        }),
        fetch("/api/generate-hero-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: "snacks", count: 8 }),
        }),
      ]);

      const [foodData, cookingData, snacksData] = await Promise.all([
        foodRes.json(),
        cookingRes.json(),
        snacksRes.json(),
      ]);

      setImages({
        food: foodData.images || [],
        cooking: cookingData.images || [],
        snacks: snacksData.images || [],
      });
    } catch (error) {
      console.error("Failed to generate hero images:", error);
    } finally {
      setLoading(false);
    }
  };

  // Duplicate arrays for seamless loop
  const duplicatedFood = [...images.food, ...images.food];
  const duplicatedCooking = [...images.cooking, ...images.cooking];
  const duplicatedSnacks = [...images.snacks, ...images.snacks];

  return (
    <section
      className="relative py-16 md:py-24 overflow-hidden"
      style={{ backgroundColor: "rgb(247, 248, 212)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
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
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors shadow-lg"
            >
              Start Planning
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Right Side - Animated Image Rows */}
          <div className="relative h-[600px] hidden lg:block">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-12 h-12 animate-spin text-gray-900" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 h-full">
                {/* Row 1 - Food Images (Scroll Up) */}
                <div className="relative h-full overflow-hidden rounded-lg">
                  <div className="animate-scroll-up hover:animation-pause">
                    {duplicatedFood.map((img, idx) => (
                      <div
                        key={`food-${idx}`}
                        className="mb-4"
                      >
                        <img
                          src={img}
                          alt={`Food ${idx + 1}`}
                          className="w-full h-48 object-cover rounded-lg shadow-md"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Row 2 - Cooking/People Images (Scroll Down) */}
                <div className="relative h-full overflow-hidden rounded-lg">
                  <div className="animate-scroll-down hover:animation-pause">
                    {duplicatedCooking.map((img, idx) => (
                      <div
                        key={`cooking-${idx}`}
                        className="mb-4"
                      >
                        <img
                          src={img}
                          alt={`Cooking ${idx + 1}`}
                          className="w-full h-48 object-cover rounded-lg shadow-md"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Row 3 - Snack Images (Scroll Up, Clipped at Bottom) */}
                <div className="relative h-full overflow-hidden rounded-lg mask-gradient">
                  <div className="animate-scroll-up hover:animation-pause">
                    {duplicatedSnacks.map((img, idx) => (
                      <div
                        key={`snack-${idx}`}
                        className="mb-4"
                      >
                        <img
                          src={img}
                          alt={`Snack ${idx + 1}`}
                          className="w-full h-48 object-cover rounded-lg shadow-md"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile - Two Column Layout */}
          <div className="relative h-[400px] lg:hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-12 h-12 animate-spin text-gray-900" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 h-full">
                {/* Column 1 - Food Images (Scroll Up) */}
                <div className="relative h-full overflow-hidden rounded-lg">
                  <div className="animate-scroll-up-mobile hover:animation-pause">
                    {duplicatedFood.map((img, idx) => (
                      <div
                        key={`food-mobile-${idx}`}
                        className="mb-3"
                      >
                        <img
                          src={img}
                          alt={`Food ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg shadow-md"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2 - Cooking Images (Scroll Down) */}
                <div className="relative h-full overflow-hidden rounded-lg">
                  <div className="animate-scroll-down-mobile hover:animation-pause">
                    {duplicatedCooking.map((img, idx) => (
                      <div
                        key={`cooking-mobile-${idx}`}
                        className="mb-3"
                      >
                        <img
                          src={img}
                          alt={`Cooking ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg shadow-md"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}