import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { DriveCyclePoint } from "../utils/motorPhysics";

interface Props {
  points: DriveCyclePoint[];
  cycleName: string;
}

export const CyclePreview: React.FC<Props> = ({ points, cycleName }) => {
  if (points.length < 2) return null;

  const maxSpeed = Math.max(...points.map((p) => p.speed_kmh));
  const duration = points[points.length - 1].time_s;
  const avgSpeed =
    points.reduce((a, b) => a + b.speed_kmh, 0) / points.length;
  const stopFraction =
    (points.filter((p) => p.speed_kmh === 0).length / points.length) * 100;

  // Distance estimate
  let dist = 0;
  for (let i = 1; i < points.length; i++) {
    const dt = points[i].time_s - points[i - 1].time_s;
    const v = ((points[i].speed_kmh + points[i - 1].speed_kmh) / 2) / 3.6;
    dist += v * dt;
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-blue-400 text-xs">▶</span>
          <h3 className="text-white font-semibold text-sm">{cycleName}</h3>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <Stat label="Duration" value={`${duration.toFixed(0)}s`} color="text-gray-300" />
          <Stat label="Max Speed" value={`${maxSpeed.toFixed(0)} km/h`} color="text-blue-400" />
          <Stat label="Avg Speed" value={`${avgSpeed.toFixed(1)} km/h`} color="text-emerald-400" />
          <Stat label="Distance" value={`${(dist / 1000).toFixed(2)} km`} color="text-purple-400" />
          <Stat label="Stop %  " value={`${stopFraction.toFixed(0)}%`} color="text-yellow-400" />
        </div>
      </div>
      <div className="p-3">
        <ResponsiveContainer width="100%" height={100}>
          <AreaChart data={points} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="previewGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="time_s"
              tick={{ fill: "#6b7280", fontSize: 9 }}
              label={{ value: "Time (s)", position: "insideBottomRight", offset: -5, fill: "#6b7280", fontSize: 9 }}
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 9 }}
              label={{ value: "km/h", angle: -90, position: "insideLeft", fill: "#6b7280", fontSize: 9 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "6px",
                fontSize: "11px",
              }}
              formatter={(val) => [`${typeof val === 'number' ? val.toFixed(1) : val} km/h`, "Speed"]}
              labelFormatter={(l) => `t=${l}s`}
            />
            <Area
              type="monotone"
              dataKey="speed_kmh"
              stroke="#3b82f6"
              fill="url(#previewGrad)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div className="text-center">
    <div className="text-gray-500">{label}</div>
    <div className={`font-semibold ${color}`}>{value}</div>
  </div>
);
