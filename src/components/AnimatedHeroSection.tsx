"use client";

import { ChevronRight, Activity, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useWhoopConnect } from "@/hooks/useWhoopConnect";

export function AnimatedHeroSection() {
  const [imageError, setImageError] = useState(false);
  const { metrics, isLoading, connect, disconnect, isConnected } = useWhoopConnect();

  const getMetricsDisplay = () => {
    const items = [];
    if (metrics.recovery) items.push({ label: "Recovery", value: `${metrics.recovery}%` });
    if (metrics.sleep) items.push({ label: "Sleep", value: `${metrics.sleep}h` });
    if (metrics.strain) items.push({ label: "Strain", value: metrics.strain });
    if (metrics.calories) items.push({ label: "Calories", value: `${metrics.calories} kcal` });
    if (metrics.hrv) items.push({ label: "HRV", value: `${metrics.hrv} ms` });
    if (metrics.rhr) items.push({ label: "RHR", value: `${metrics.rhr} bpm` });
    if (metrics.avgHeartRate) items.push({ label: "Avg HR", value: `${metrics.avgHeartRate} bpm` });
    if (metrics.spo2) items.push({ label: "SpO2", value: `${metrics.spo2}%` });
    if (metrics.skinTemp) items.push({ label: "Skin Temp", value: `${metrics.skinTemp}°C` });
    if (metrics.respiratoryRate) items.push({ label: "Respiratory", value: `${metrics.respiratoryRate} br/min` });
    return items;
  };

  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-white !opacity-100 lg:!py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* WHOOP Connect Section */}
        {!isConnected ?
        <div className="mb-8 flex justify-start">
            <button
            onClick={connect}
            disabled={isLoading}
            className="inline-flex items-center gap-2 bg-black text-white py-3 rounded-full font-semibold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed !gap-[7px] !text-sm !px-[17px]">

              <Activity className="w-5 h-5" />
              {isLoading ? "Connecting..." : "WHOOP CONNECT"}
            </button>
          </div> :

        <div className="mb-8 relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-1">
            <div className="bg-white rounded-xl p-4 relative">
              <button
              onClick={disconnect}
              className="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
              title="Disconnect WHOOP">

                <X className="w-4 h-4 text-gray-600" />
              </button>
              
              <div className="overflow-hidden relative">
                <div className="flex gap-8 animate-scroll-rtl">
                  {/* Triple the metrics for seamless loop */}
                  {[...Array(3)].map((_, setIndex) =>
                <div key={setIndex} className="flex gap-8 flex-shrink-0">
                      {getMetricsDisplay().map((metric, idx) =>
                  <div key={`${setIndex}-${idx}`} className="flex items-center gap-3 px-6 py-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg flex-shrink-0">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                              {metric.label}
                            </span>
                            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                              {metric.value}
                            </span>
                          </div>
                        </div>
                  )}
                    </div>
                )}
                </div>
              </div>
            </div>
          </div>
        }

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center !w-full !h-full p-8 md:p-12 lg:p-16 !px-[65px] !py-[110px] !rounded-[25px]" style={{ backgroundColor: "rgb(247, 248, 212)" }}>
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
<div className="relative overflow-hidden rounded-[33px] w-full h-full">
  {!imageError ? (
    <Image
      src="https://scuziassests.s3.us-east-1.amazonaws.com/hero%20image.webp"
      alt="Delicious meal prep"
      fill
      className="object-cover object-right rounded-[33px] absolute top-0 right-0 bottom-0"
      onError={() => setImageError(true)}
      unoptimized
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-100 rounded-[33px]">
      <div className="text-center space-y-2">
        <p className="font-semibold">Image not accessible</p>
        <p className="text-sm">Check S3 bucket permissions and CORS</p>
      </div>
    </div>
  )}
</div>

        </div>
      </div>
    </section>);

}