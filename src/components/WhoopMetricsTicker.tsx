"use client";

interface WhoopMetrics {
  connected: boolean;
  sleep?: string;
  strain?: string;
  calories?: number;
  recovery?: number;
  hrv?: number;
  rhr?: number;
  avgHeartRate?: number;
  spo2?: string;
  skinTemp?: string;
  respiratoryRate?: string;
}

interface WhoopMetricsTickerProps {
  metrics: WhoopMetrics;
}

export default function WhoopMetricsTicker({ metrics }: WhoopMetricsTickerProps) {
  if (!metrics.connected) return null;

  const metricsData = [
    { icon: "💚", label: "Recovery", value: metrics.recovery, unit: "%" },
    { icon: "😴", label: "Sleep", value: metrics.sleep, unit: "h" },
    { icon: "💪", label: "Strain", value: metrics.strain, unit: "" },
    { icon: "🔥", label: "Calories", value: metrics.calories, unit: "kcal" },
    { icon: "❤️", label: "RHR", value: metrics.rhr, unit: "bpm" },
    { icon: "💓", label: "HRV", value: metrics.hrv, unit: "ms" },
    { icon: "🫀", label: "Avg HR", value: metrics.avgHeartRate, unit: "bpm" },
    { icon: "🫁", label: "Resp Rate", value: metrics.respiratoryRate, unit: "/min" },
    { icon: "🌡️", label: "Skin Temp", value: metrics.skinTemp, unit: "°C" },
    { icon: "🩺", label: "SpO2", value: metrics.spo2, unit: "%" },
  ].filter(metric => {
    const val = metric.value;
    return val !== null && val !== undefined && val !== "" && val !== 0;
  });

  if (metricsData.length === 0) return null;

  // Duplicate metrics for seamless loop
  const duplicatedMetrics = [...metricsData, ...metricsData, ...metricsData];

  return (
    <div className="relative overflow-hidden bg-[#2a3942] border-t border-[#3d4f5a]">
      <div className="flex animate-scroll-rtl whitespace-nowrap py-2">
        {duplicatedMetrics.map((metric, index) => (
          <div
            key={index}
            className="inline-flex items-center gap-1.5 px-4 text-xs"
          >
            <span className="text-base">{metric.icon}</span>
            <span className="text-[#8696a0] font-medium">{metric.label}:</span>
            <span className="text-white font-semibold">
              {metric.value}{metric.unit}
            </span>
            <span className="text-[#8696a0] mx-2">•</span>
          </div>
        ))}
      </div>

      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#2a3942] to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#2a3942] to-transparent pointer-events-none" />
    </div>
  );
}