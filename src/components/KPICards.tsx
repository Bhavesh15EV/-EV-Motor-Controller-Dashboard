import React from "react";
import { AnalysisPoint } from "../utils/motorPhysics";
import { Zap, Thermometer, Activity, BarChart2, Gauge, TrendingUp } from "lucide-react";

interface Props {
  data: AnalysisPoint[];
}

function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function max(arr: number[]): number {
  if (!arr.length) return 0;
  return Math.max(...arr);
}
function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

export const KPICards: React.FC<Props> = ({ data }) => {
  if (!data.length) return null;

  const motoringData = data.filter((d) => d.motorTorque_Nm > 0);

  const avgMotorEff = avg(motoringData.map((d) => d.motorEfficiency));
  const avgInvEff = avg(motoringData.map((d) => d.inverterEfficiency));
  const avgSysEff = avg(motoringData.map((d) => d.systemEfficiency));
  const peakMotorLoss = max(data.map((d) => d.totalMotorLoss_W));
  const peakInvLoss = max(data.map((d) => d.totalInverterLoss_W));
  const peakPower = max(data.map((d) => d.motorPower_kW));
  const peakRPM = max(data.map((d) => d.motorRPM));
  const peakTorque = max(data.map((d) => d.motorTorque_Nm));
  const peakCurrent = max(data.map((d) => d.current_Arms));
  const last = data[data.length - 1];
  const totalMotorLoss_Wh = last.energyMotorLoss_Wh;
  const totalInvLoss_Wh = last.energyInverterLoss_Wh;
  const totalTraction_Wh = last.energyTraction_Wh;
  const totalInput_Wh = totalTraction_Wh + totalMotorLoss_Wh + totalInvLoss_Wh;
  const avgPeakCurrent = avg(motoringData.map((d) => d.current_Arms));
  const cycleDuration = last.time_s;
  const distance_km =
    sum(
      data.slice(1).map((d, i) => {
        const prev = data[i];
        const dt = d.time_s - prev.time_s;
        const v = (d.speed_kmh + prev.speed_kmh) / 2 / 3.6;
        return v * dt;
      })
    ) / 1000;

  const kpiGroups = [
    {
      title: "Efficiency",
      color: "emerald",
      icon: <Gauge size={18} />,
      items: [
        { label: "Avg Motor Eff.", value: avgMotorEff.toFixed(1), unit: "%" },
        { label: "Avg Inverter Eff.", value: avgInvEff.toFixed(1), unit: "%" },
        { label: "Avg System Eff.", value: avgSysEff.toFixed(1), unit: "%" },
      ],
    },
    {
      title: "Peak Losses",
      color: "red",
      icon: <Thermometer size={18} />,
      items: [
        { label: "Peak Motor Loss", value: (peakMotorLoss / 1000).toFixed(2), unit: "kW" },
        { label: "Peak Inverter Loss", value: (peakInvLoss / 1000).toFixed(2), unit: "kW" },
        { label: "Peak Total Loss", value: ((peakMotorLoss + peakInvLoss) / 1000).toFixed(2), unit: "kW" },
      ],
    },
    {
      title: "Energy Balance",
      color: "blue",
      icon: <Zap size={18} />,
      items: [
        { label: "Total Input Energy", value: totalInput_Wh.toFixed(1), unit: "Wh" },
        { label: "Motor Loss Energy", value: totalMotorLoss_Wh.toFixed(1), unit: "Wh" },
        { label: "Inverter Loss Energy", value: totalInvLoss_Wh.toFixed(1), unit: "Wh" },
      ],
    },
    {
      title: "Motor Operating",
      color: "purple",
      icon: <Activity size={18} />,
      items: [
        { label: "Peak Power", value: peakPower.toFixed(1), unit: "kW" },
        { label: "Peak Motor RPM", value: peakRPM.toFixed(0), unit: "RPM" },
        { label: "Peak Torque", value: peakTorque.toFixed(0), unit: "Nm" },
      ],
    },
    {
      title: "Electrical",
      color: "yellow",
      icon: <BarChart2 size={18} />,
      items: [
        { label: "Peak Current", value: peakCurrent.toFixed(1), unit: "Arms" },
        { label: "Avg Current", value: avgPeakCurrent.toFixed(1), unit: "Arms" },
        { label: "Bus Voltage", value: "600", unit: "V DC" },
      ],
    },
    {
      title: "Cycle Summary",
      color: "orange",
      icon: <TrendingUp size={18} />,
      items: [
        { label: "Cycle Duration", value: cycleDuration.toFixed(0), unit: "s" },
        { label: "Distance", value: distance_km.toFixed(2), unit: "km" },
        { label: "Energy/100km", value: totalInput_Wh > 0 && distance_km > 0 ? ((totalInput_Wh / 1000 / distance_km) * 100).toFixed(1) : "–", unit: "kWh/100km" },
      ],
    },
  ];

  const colorMap: Record<string, { bg: string; border: string; icon: string; badge: string; value: string }> = {
    emerald: {
      bg: "bg-emerald-950",
      border: "border-emerald-800",
      icon: "text-emerald-400",
      badge: "bg-emerald-900 text-emerald-300",
      value: "text-emerald-300",
    },
    red: {
      bg: "bg-red-950",
      border: "border-red-800",
      icon: "text-red-400",
      badge: "bg-red-900 text-red-300",
      value: "text-red-300",
    },
    blue: {
      bg: "bg-blue-950",
      border: "border-blue-800",
      icon: "text-blue-400",
      badge: "bg-blue-900 text-blue-300",
      value: "text-blue-300",
    },
    purple: {
      bg: "bg-purple-950",
      border: "border-purple-800",
      icon: "text-purple-400",
      badge: "bg-purple-900 text-purple-300",
      value: "text-purple-300",
    },
    yellow: {
      bg: "bg-yellow-950",
      border: "border-yellow-800",
      icon: "text-yellow-400",
      badge: "bg-yellow-900 text-yellow-300",
      value: "text-yellow-300",
    },
    orange: {
      bg: "bg-orange-950",
      border: "border-orange-800",
      icon: "text-orange-400",
      badge: "bg-orange-900 text-orange-300",
      value: "text-orange-300",
    },
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {kpiGroups.map((group) => {
        const c = colorMap[group.color];
        return (
          <div key={group.title} className={`${c.bg} border ${c.border} rounded-xl p-3`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={c.icon}>{group.icon}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
                {group.title}
              </span>
            </div>
            <div className="space-y-2">
              {group.items.map((item) => (
                <div key={item.label}>
                  <div className="text-xs text-gray-500">{item.label}</div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-lg font-bold ${c.value}`}>{item.value}</span>
                    <span className="text-xs text-gray-500">{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
