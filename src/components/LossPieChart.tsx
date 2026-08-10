import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { AnalysisPoint } from "../utils/motorPhysics";

interface Props {
  data: AnalysisPoint[];
}

const RADIAN = Math.PI / 180;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderCustomizedLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  if (!percent || percent <= 0.04) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="600">
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

export const LossPieChart: React.FC<Props> = ({ data }) => {
  if (!data.length) return null;

  const last = data[data.length - 1];
  const traction = last.energyTraction_Wh;

  let copperLoss = 0, ironLoss = 0, mechLoss = 0, igbtCond = 0, swLoss = 0;
  for (let i = 1; i < data.length; i++) {
    const dt = data[i].time_s - data[i - 1].time_s;
    if (dt <= 0) continue;
    const d = data[i];
    copperLoss += (d.copperLoss_W * dt) / 3600;
    ironLoss += (d.ironLoss_W * dt) / 3600;
    mechLoss += (d.mechLoss_W * dt) / 3600;
    igbtCond += ((d.igbtConductionLoss_W + d.diodeConductionLoss_W) * dt) / 3600;
    swLoss += (d.igbtSwitchLoss_W * dt) / 3600;
  }

  const pieData = [
    { name: "Traction Output", value: Math.max(0, traction), color: "#10b981" },
    { name: "Copper Loss", value: Math.max(0, copperLoss), color: "#ef4444" },
    { name: "Iron Loss", value: Math.max(0, ironLoss), color: "#f59e0b" },
    { name: "Mech Loss", value: Math.max(0, mechLoss), color: "#8b5cf6" },
    { name: "IGBT Conduction", value: Math.max(0, igbtCond), color: "#3b82f6" },
    { name: "Switching Loss", value: Math.max(0, swLoss), color: "#f97316" },
  ].filter((d) => d.value > 0.01);

  const total = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
      <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">
        Energy Distribution Over Cycle
      </h3>
      <div className="flex flex-col md:flex-row items-center gap-4">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={95}
              innerRadius={40}
              dataKey="value"
              strokeWidth={2}
              stroke="#111827"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                fontSize: "11px",
              }}
              formatter={(val) => [
                `${typeof val === "number" ? val.toFixed(2) : val} Wh`,
                "",
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="w-full md:w-52 space-y-2 shrink-0">
          <div className="text-xs text-gray-400 mb-2 font-semibold">
            Total Input: <span className="text-white">{total.toFixed(1)} Wh</span>
          </div>
          {pieData.map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <div className="flex-1 text-xs text-gray-300 truncate">{d.name}</div>
              <div className="text-xs font-semibold shrink-0" style={{ color: d.color }}>
                {d.value.toFixed(1)} Wh
              </div>
              <div className="text-xs text-gray-500 w-10 text-right shrink-0">
                {total > 0 ? ((d.value / total) * 100).toFixed(1) : "0.0"}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
