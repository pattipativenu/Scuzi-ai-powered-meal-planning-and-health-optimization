"use client";

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

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

interface WhoopDataChartProps {
  metrics: WhoopMetrics;
}

export default function WhoopDataChart({ metrics }: WhoopDataChartProps) {
  if (!metrics.connected) return null;

  // Prepare data for radar chart with normalized values (0-100 scale)
  const chartData = [
    {
      metric: 'Recovery',
      value: metrics.recovery || 0,
      fullMark: 100,
    },
    {
      metric: 'Sleep (h)',
      value: metrics.sleep ? (parseFloat(metrics.sleep) / 10) * 100 : 0, // Normalize to 0-100
      fullMark: 100,
    },
    {
      metric: 'Strain',
      value: metrics.strain ? (parseFloat(metrics.strain) / 21) * 100 : 0, // Max strain is 21
      fullMark: 100,
    },
    {
      metric: 'HRV (ms)',
      value: metrics.hrv ? Math.min((metrics.hrv / 200) * 100, 100) : 0, // Normalize to 200ms max
      fullMark: 100,
    },
    {
      metric: 'SpO2 (%)',
      value: metrics.spo2 ? parseFloat(metrics.spo2) : 0,
      fullMark: 100,
    },
  ].filter(item => item.value > 0);

  if (chartData.length === 0) return null;

  return (
    <div className="bg-[#1f2c33] rounded-lg p-4 border border-[#2a3942]">
      <h3 className="text-white text-sm font-semibold mb-3 text-center">Your WHOOP Metrics</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={chartData}>
          <PolarGrid stroke="#3d4f5a" />
          <PolarAngleAxis 
            dataKey="metric" 
            tick={{ fill: '#8696a0', fontSize: 11 }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={{ fill: '#8696a0', fontSize: 10 }}
          />
          <Radar 
            name="Metrics" 
            dataKey="value" 
            stroke="#00a884" 
            fill="#00a884" 
            fillOpacity={0.6}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2c33', 
              border: '1px solid #2a3942',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value: number) => [`${value.toFixed(1)}`, 'Score']}
          />
        </RadarChart>
      </ResponsiveContainer>
      
      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {metrics.recovery && (
          <MetricCard icon="💚" label="Recovery" value={`${metrics.recovery}%`} />
        )}
        {metrics.sleep && (
          <MetricCard icon="😴" label="Sleep" value={`${metrics.sleep}h`} />
        )}
        {metrics.strain && (
          <MetricCard icon="💪" label="Strain" value={metrics.strain} />
        )}
        {metrics.calories && (
          <MetricCard icon="🔥" label="Calories" value={`${metrics.calories}`} />
        )}
        {metrics.rhr && (
          <MetricCard icon="❤️" label="RHR" value={`${metrics.rhr} bpm`} />
        )}
        {metrics.hrv && (
          <MetricCard icon="💓" label="HRV" value={`${metrics.hrv} ms`} />
        )}
        {metrics.avgHeartRate && (
          <MetricCard icon="🫀" label="Avg HR" value={`${metrics.avgHeartRate} bpm`} />
        )}
        {metrics.respiratoryRate && (
          <MetricCard icon="🫁" label="Resp Rate" value={`${metrics.respiratoryRate}/min`} />
        )}
        {metrics.skinTemp && (
          <MetricCard icon="🌡️" label="Skin Temp" value={`${metrics.skinTemp}°C`} />
        )}
        {metrics.spo2 && (
          <MetricCard icon="🩺" label="SpO2" value={`${metrics.spo2}%`} />
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-[#2a3942] rounded-lg p-3 flex items-center gap-2">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[#8696a0] text-xs">{label}</p>
        <p className="text-white text-sm font-semibold truncate">{value}</p>
      </div>
    </div>
  );
}