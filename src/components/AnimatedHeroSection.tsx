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
    <section className="relative py-12 md:py-16 overflow-hidden bg-white">
      <div className="mx-auto px-2 md:px-4 lg:px-6">
        {/* WHOOP Metrics Ticker - Only show when connected */}
        {isConnected && (
          <div className="mb-8 relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-1">
            <div className="bg-white rounded-xl p-4 relative">
              <button
                onClick={disconnect}
                className="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
                title="Disconnect WHOOP"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
              
              <div className="overflow-hidden relative">
                <div className="flex gap-8 animate-scroll-rtl">
                  {[...Array(3)].map((_, setIndex) => (
                    <div key={setIndex} className="flex gap-8 flex-shrink-0">
                      {getMetricsDisplay().map((metric, idx) => (
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
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hero Content with Yellow Background */}
        <div
          className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center rounded-[33px] px-12 md:px-16 lg:px-20 py-16 md:py-20 lg:py-28"
          style={{ backgroundColor: "rgb(247, 248, 212)" }}
        >
          {/* Left Side - Text Content */}
          <div className="z-10 space-y-6">
            <h1 style={{
              fontFamily: '"Right Grotesk Spatial", sans-serif',
              fontWeight: 700,
              fontSize: '65px',
              lineHeight: '58px',
              color: 'rgb(17, 24, 39)'
            }}
            className="hidden lg:block">

              Your home for easy, delicious meal prep recipes
            </h1>
            
            {/* Responsive heading for tablet/mobile */}
            <h1 style={{
              fontFamily: '"Right Grotesk Spatial", sans-serif',
              fontWeight: 700,
              color: 'rgb(17, 24, 39)'
            }}
            className="lg:hidden text-4xl md:text-5xl leading-tight">

              Your home for easy, delicious meal prep recipes
            </h1>
            
            <p style={{
              fontFamily: '"General Sans", sans-serif',
              fontWeight: 400,
              fontSize: '15px',
              lineHeight: '21px',
              color: 'rgb(17, 24, 39)'
            }}>
              Plan your week with confidence. Get organized, save time, and enjoy healthy meals every day.
            </p>
            
            <Link
              href="/plan-ahead"
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
              style={{
                fontFamily: '"Right Grotesk Wide", sans-serif',
                fontWeight: 500,
                fontSize: '16px',
                lineHeight: '24px'
              }}>

              Start Planning
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Right Side - Hero Image */}
          <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden rounded-[0px_33px_33px_0px] -mt-16 md:-mt-20 lg:-mt-28 -mb-16 md:-mb-20 lg:-mb-28 -mr-12 md:-mr-16 lg:-mr-20">
            {!imageError ?
            <Image
              src="https://scuziassests.s3.us-east-1.amazonaws.com/hero%20image.webp"
              alt="Delicious meal prep"
              fill
              priority
              unoptimized
              className="object-contain object-right"
              onError={() => setImageError(true)} /> :


            <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-100 rounded-[0px_33px_33px_0px]">
                <div className="text-center space-y-2">
                  <p className="font-semibold">Image not accessible</p>
                  <p className="text-sm">Check S3 bucket permissions and CORS</p>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </section>
  );
}