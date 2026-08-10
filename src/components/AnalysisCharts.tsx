import React, { useState } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Scatter,
  ComposedChart,
} from "recharts";
import { AnalysisPoint } from "../utils/motorPhysics";

interface Props {
  data: AnalysisPoint[];
}

const CHART_TABS = [
  "Drive Cycle",
  "Motor Operating",
  "Motor Losses",
  "Inverter Losses",
  "Efficiency",
  "Energy Balance",
  "Force Analysis",
  "Operating Map",
];

// Downsample data for performance
function downsample(data: AnalysisPoint[], maxPts = 300): AnalysisPoint[] {
  if (data.length <= maxPts) return data;
  const step = Math.ceil(data.length / maxPts);
  return data.filter((_, i) => i % step === 0);
}

const TOOLTIP_STYLE = {
  backgroundColor: "#1f2937",
  border: "1px solid #374151",
  borderRadius: "8px",
  fontSize: "11px",
  color: "#e5e7eb",
};

const AXIS_STYLE = { fill: "#9ca3af", fontSize: 10 };

interface TooltipPayloadItem {
  color: string;
  name: string;
  value: number | string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={TOOLTIP_STYLE} className="p-2 shadow-xl max-w-xs">
      <div className="text-gray-400 text-xs mb-1 font-semibold">t = {Number(label).toFixed(1)}s</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span style={{ color: p.color }} className="w-2 h-2 rounded-full inline-block" />
          <span className="text-gray-300">{p.name}:</span>
          <span className="text-white font-semibold">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export const AnalysisCharts: React.FC<Props> = ({ data }) => {
  const [activeTab, setActiveTab] = useState("Drive Cycle");
  const ds = downsample(data);



  const renderChart = () => {
    switch (activeTab) {
      case "Drive Cycle":
        return (
          <div className="space-y-4">
            <ChartBox title="Vehicle Speed Profile">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={ds}>
                  <defs>
                    <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time_s" tick={AXIS_STYLE} label={{ value: "Time (s)", position: "insideBottomRight", offset: -5, fill: "#9ca3af", fontSize: 10 }} />
                  <YAxis tick={AXIS_STYLE} label={{ value: "Speed (km/h)", angle: -90, position: "insideLeft", fill: "#9ca3af", fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="speed_kmh" stroke="#3b82f6" fill="url(#speedGrad)" name="Speed (km/h)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartBox>
            <ChartBox title="Acceleration Profile">
              <ResponsiveContainer width="100%" height={180}>
                <ComposedChart data={ds}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time_s" tick={AXIS_STYLE} />
                  <YAxis tick={AXIS_STYLE} label={{ value: "Accel (m/s²)", angle: -90, position: "insideLeft", fill: "#9ca3af", fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="4 4" />
                  <Bar dataKey="acceleration_ms2" name="Acceleration (m/s²)" fill="#8b5cf6" opacity={0.8} radius={[2, 2, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartBox>
          </div>
        );

      case "Motor Operating":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <ChartBox title="Motor RPM">
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={ds}>
                    <defs>
                      <linearGradient id="rpmGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time_s" tick={AXIS_STYLE} />
                    <YAxis tick={AXIS_STYLE} domain={[0, 3200]} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={3000} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Max 3000", fill: "#ef4444", fontSize: 9 }} />
                    <ReferenceLine y={1750} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Rated 1750", fill: "#f59e0b", fontSize: 9 }} />
                    <Area type="monotone" dataKey="motorRPM" stroke="#a855f7" fill="url(#rpmGrad)" name="Motor RPM" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartBox>
              <ChartBox title="Motor Torque">
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={ds}>
                    <defs>
                      <linearGradient id="torqueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time_s" tick={AXIS_STYLE} />
                    <YAxis tick={AXIS_STYLE} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={1273} stroke="#10b981" strokeDasharray="3 3" label={{ value: "Rated 1273Nm", fill: "#10b981", fontSize: 9 }} />
                    <Area type="monotone" dataKey="motorTorque_Nm" stroke="#f59e0b" fill="url(#torqueGrad)" name="Motor Torque (Nm)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartBox>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ChartBox title="Motor Power">
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={ds}>
                    <defs>
                      <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time_s" tick={AXIS_STYLE} />
                    <YAxis tick={AXIS_STYLE} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={144} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Rated 144kW", fill: "#f59e0b", fontSize: 9 }} />
                    <ReferenceLine y={213} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Peak 213kW", fill: "#ef4444", fontSize: 9 }} />
                    <Area type="monotone" dataKey="motorPower_kW" stroke="#10b981" fill="url(#powerGrad)" name="Power (kW)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartBox>
              <ChartBox title="Phase Current (Arms)">
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={ds}>
                    <defs>
                      <linearGradient id="currentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time_s" tick={AXIS_STYLE} />
                    <YAxis tick={AXIS_STYLE} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={240} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Rated 240A", fill: "#f59e0b", fontSize: 9 }} />
                    <ReferenceLine y={460} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Peak 460A", fill: "#ef4444", fontSize: 9 }} />
                    <Area type="monotone" dataKey="current_Arms" stroke="#ef4444" fill="url(#currentGrad)" name="Current (Arms)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartBox>
            </div>
          </div>
        );

      case "Motor Losses":
        return (
          <div className="space-y-4">
            <ChartBox title="Motor Loss Breakdown Over Time">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={ds}>
                  <defs>
                    <linearGradient id="cuGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="feGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="mechGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time_s" tick={AXIS_STYLE} label={{ value: "Time (s)", position: "insideBottomRight", offset: -5, fill: "#9ca3af", fontSize: 10 }} />
                  <YAxis tick={AXIS_STYLE} label={{ value: "Loss (W)", angle: -90, position: "insideLeft", fill: "#9ca3af", fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#d1d5db" }} />
                  <Area type="monotone" dataKey="copperLoss_W" stackId="1" stroke="#ef4444" fill="url(#cuGrad)" name="Copper Loss (W)" dot={false} strokeWidth={1.5} />
                  <Area type="monotone" dataKey="ironLoss_W" stackId="1" stroke="#f59e0b" fill="url(#feGrad)" name="Iron Loss (W)" dot={false} strokeWidth={1.5} />
                  <Area type="monotone" dataKey="mechLoss_W" stackId="1" stroke="#8b5cf6" fill="url(#mechGrad)" name="Mech Loss (W)" dot={false} strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartBox>
            <ChartBox title="Total Motor Loss vs Power">
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={ds}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time_s" tick={AXIS_STYLE} />
                  <YAxis yAxisId="left" tick={AXIS_STYLE} label={{ value: "Loss (W)", angle: -90, position: "insideLeft", fill: "#9ca3af", fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={AXIS_STYLE} label={{ value: "Power (kW)", angle: 90, position: "insideRight", fill: "#9ca3af", fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#d1d5db" }} />
                  <Area yAxisId="left" type="monotone" dataKey="totalMotorLoss_W" stroke="#ef4444" fill="#ef444420" name="Total Motor Loss (W)" dot={false} strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="motorPower_kW" stroke="#10b981" name="Motor Power (kW)" dot={false} strokeWidth={1.5} strokeDasharray="5 5" />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartBox>
          </div>
        );

      case "Inverter Losses":
        return (
          <div className="space-y-4">
            <ChartBox title="Inverter Loss Breakdown (6-Phase IGBT Inverter, 1200V/500A)">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={ds}>
                  <defs>
                    <linearGradient id="igbtCond" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="dCond" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="swLoss" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time_s" tick={AXIS_STYLE} label={{ value: "Time (s)", position: "insideBottomRight", offset: -5, fill: "#9ca3af", fontSize: 10 }} />
                  <YAxis tick={AXIS_STYLE} label={{ value: "Loss (W)", angle: -90, position: "insideLeft", fill: "#9ca3af", fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#d1d5db" }} />
                  <Area type="monotone" dataKey="igbtConductionLoss_W" stackId="1" stroke="#3b82f6" fill="url(#igbtCond)" name="IGBT Conduction (W)" dot={false} strokeWidth={1.5} />
                  <Area type="monotone" dataKey="diodeConductionLoss_W" stackId="1" stroke="#22d3ee" fill="url(#dCond)" name="Diode Conduction (W)" dot={false} strokeWidth={1.5} />
                  <Area type="monotone" dataKey="igbtSwitchLoss_W" stackId="1" stroke="#f97316" fill="url(#swLoss)" name="Switching Loss (W)" dot={false} strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartBox>
            <ChartBox title="Motor vs Inverter Loss Comparison">
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={ds}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time_s" tick={AXIS_STYLE} />
                  <YAxis tick={AXIS_STYLE} label={{ value: "Loss (W)", angle: -90, position: "insideLeft", fill: "#9ca3af", fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#d1d5db" }} />
                  <Line type="monotone" dataKey="totalMotorLoss_W" stroke="#ef4444" name="Motor Loss (W)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="totalInverterLoss_W" stroke="#3b82f6" name="Inverter Loss (W)" dot={false} strokeWidth={2} />
                  <Area type="monotone" dataKey="totalSystemLoss_W" stroke="#8b5cf6" fill="#8b5cf620" name="System Total Loss (W)" dot={false} strokeWidth={1} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartBox>
          </div>
        );

      case "Efficiency":
        return (
          <div className="space-y-4">
            <ChartBox title="Efficiency Over Drive Cycle">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={ds}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time_s" tick={AXIS_STYLE} label={{ value: "Time (s)", position: "insideBottomRight", offset: -5, fill: "#9ca3af", fontSize: 10 }} />
                  <YAxis tick={AXIS_STYLE} domain={[50, 100]} label={{ value: "Efficiency (%)", angle: -90, position: "insideLeft", fill: "#9ca3af", fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#d1d5db" }} />
                  <ReferenceLine y={93} stroke="#10b981" strokeDasharray="4 4" label={{ value: "Rated 93%", fill: "#10b981", fontSize: 9 }} />
                  <Line type="monotone" dataKey="motorEfficiency" stroke="#10b981" name="Motor Eff. (%)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="inverterEfficiency" stroke="#3b82f6" name="Inverter Eff. (%)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="systemEfficiency" stroke="#f59e0b" name="System Eff. (%)" dot={false} strokeWidth={2} strokeDasharray="6 3" />
                </LineChart>
              </ResponsiveContainer>
            </ChartBox>
            <div className="grid grid-cols-2 gap-4">
              <ChartBox title="Motor Efficiency Distribution">
                <EfficiencyHistogram data={data} field="motorEfficiency" color="#10b981" label="Motor" />
              </ChartBox>
              <ChartBox title="Inverter Efficiency Distribution">
                <EfficiencyHistogram data={data} field="inverterEfficiency" color="#3b82f6" label="Inverter" />
              </ChartBox>
            </div>
          </div>
        );

      case "Energy Balance":
        return (
          <div className="space-y-4">
            <ChartBox title="Cumulative Energy vs Time">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={ds}>
                  <defs>
                    <linearGradient id="tractGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="mLossGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="iLossGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time_s" tick={AXIS_STYLE} label={{ value: "Time (s)", position: "insideBottomRight", offset: -5, fill: "#9ca3af", fontSize: 10 }} />
                  <YAxis tick={AXIS_STYLE} label={{ value: "Energy (Wh)", angle: -90, position: "insideLeft", fill: "#9ca3af", fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#d1d5db" }} />
                  <Area type="monotone" dataKey="energyTraction_Wh" stroke="#10b981" fill="url(#tractGrad)" name="Traction Energy (Wh)" dot={false} strokeWidth={2} />
                  <Area type="monotone" dataKey="energyMotorLoss_Wh" stroke="#ef4444" fill="url(#mLossGrad)" name="Motor Loss Energy (Wh)" dot={false} strokeWidth={2} />
                  <Area type="monotone" dataKey="energyInverterLoss_Wh" stroke="#3b82f6" fill="url(#iLossGrad)" name="Inverter Loss Energy (Wh)" dot={false} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartBox>
            <ChartBox title="Energy Sankey Breakdown">
              <EnergySankey data={data} />
            </ChartBox>
          </div>
        );

      case "Force Analysis":
        return (
          <div className="space-y-4">
            <ChartBox title="Force Components Over Time">
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={ds}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time_s" tick={AXIS_STYLE} label={{ value: "Time (s)", position: "insideBottomRight", offset: -5, fill: "#9ca3af", fontSize: 10 }} />
                  <YAxis tick={AXIS_STYLE} label={{ value: "Force (N)", angle: -90, position: "insideLeft", fill: "#9ca3af", fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#d1d5db" }} />
                  <ReferenceLine y={0} stroke="#6b7280" />
                  <Area type="monotone" dataKey="F_total_N" stroke="#f59e0b" fill="#f59e0b20" name="Total Force (N)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="F_inertia_N" stroke="#ef4444" name="Inertia Force (N)" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="F_rolling_N" stroke="#10b981" name="Rolling Resistance (N)" dot={false} strokeWidth={1.5} strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="F_drag_N" stroke="#3b82f6" name="Aero Drag (N)" dot={false} strokeWidth={1.5} strokeDasharray="4 2" />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartBox>
            <ChartBox title="Wheel Torque vs Motor Torque">
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={ds}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time_s" tick={AXIS_STYLE} />
                  <YAxis yAxisId="wheel" tick={AXIS_STYLE} label={{ value: "Wheel Torque (Nm)", angle: -90, position: "insideLeft", fill: "#9ca3af", fontSize: 10 }} />
                  <YAxis yAxisId="motor" orientation="right" tick={AXIS_STYLE} label={{ value: "Motor Torque (Nm)", angle: 90, position: "insideRight", fill: "#9ca3af", fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#d1d5db" }} />
                  <Area yAxisId="wheel" type="monotone" dataKey="wheelTorque_Nm" stroke="#f59e0b" fill="#f59e0b20" name="Wheel Torque (Nm)" dot={false} strokeWidth={2} />
                  <Line yAxisId="motor" type="monotone" dataKey="motorTorque_Nm" stroke="#ef4444" name="Motor Torque (Nm)" dot={false} strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartBox>
          </div>
        );

      case "Operating Map":
        return (
          <div className="space-y-4">
            <ChartBox title="Motor Operating Points on Torque-Speed Map">
              <OperatingMap data={data} />
            </ChartBox>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 bg-gray-900 p-1 rounded-xl border border-gray-700">
        {CHART_TABS.map((tab) => (
          <button
            key={tab}
            className={`text-xs px-3 py-1.5 rounded-lg transition font-medium ${
              activeTab === tab
                ? "bg-blue-600 text-white shadow"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Chart content */}
      <div>{renderChart()}</div>
    </div>
  );
};

// ─── Sub-components ──────────────────────────────────────────

const ChartBox: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
    <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">{title}</h3>
    {children}
  </div>
);

const EfficiencyHistogram: React.FC<{
  data: AnalysisPoint[];
  field: keyof AnalysisPoint;
  color: string;
  label: string;
}> = ({ data, field, color }) => {
  // Build histogram
  const bins = Array.from({ length: 10 }, (_, i) => ({
    range: `${50 + i * 5}-${55 + i * 5}%`,
    count: 0,
    rangeStart: 50 + i * 5,
  }));

  data.forEach((d) => {
    const val = d[field] as number;
    if (val > 0) {
      const binIdx = Math.min(9, Math.floor((val - 50) / 5));
      if (binIdx >= 0) bins[binIdx].count++;
    }
  });

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={bins} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="range" tick={{ ...AXIS_STYLE, fontSize: 8 }} interval={1} />
        <YAxis tick={AXIS_STYLE} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(val) => [`${val} points`, "Count"]}
        />
        <Bar dataKey="count" fill={color} radius={[3, 3, 0, 0]} opacity={0.85} />
      </BarChart>
    </ResponsiveContainer>
  );
};

const EnergySankey: React.FC<{ data: AnalysisPoint[] }> = ({ data }) => {
  if (!data.length) return null;
  const last = data[data.length - 1];
  const traction = last.energyTraction_Wh;
  const motorLoss = last.energyMotorLoss_Wh;
  const invLoss = last.energyInverterLoss_Wh;
  const total = traction + motorLoss + invLoss;

  if (total <= 0) return <div className="text-gray-500 text-xs p-4">No energy data</div>;

  const pTraction = (traction / total) * 100;
  const pMotor = (motorLoss / total) * 100;
  const pInv = (invLoss / total) * 100;

  const bars = [
    { label: "Traction Output", value: traction, pct: pTraction, color: "#10b981" },
    { label: "Motor Heat Loss", value: motorLoss, pct: pMotor, color: "#ef4444" },
    { label: "Inverter Heat Loss", value: invLoss, pct: pInv, color: "#3b82f6" },
  ];

  return (
    <div className="space-y-3 px-4 py-4">
      <div className="text-xs text-gray-400 mb-1">Total Input: <span className="text-white font-semibold">{total.toFixed(1)} Wh</span></div>
      {bars.map((b) => (
        <div key={b.label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-300">{b.label}</span>
            <span style={{ color: b.color }} className="font-semibold">
              {b.value.toFixed(1)} Wh ({b.pct.toFixed(1)}%)
            </span>
          </div>
          <div className="h-6 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, b.pct)}%`, backgroundColor: b.color, opacity: 0.85 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Torque-speed operating map with efficiency contours
const OperatingMap: React.FC<{ data: AnalysisPoint[] }> = ({ data }) => {
  const opPoints = data
    .filter((d) => d.motorRPM > 10 && d.motorTorque_Nm > 0)
    .map((d) => ({ x: Math.round(d.motorRPM), y: Math.round(d.motorTorque_Nm) }));

  // Peak torque boundary
  const peakCurve = [
    { x: 0.1, y: 3216 }, { x: 100, y: 3256 }, { x: 213, y: 3250 },
    { x: 490, y: 3240 }, { x: 764, y: 2940 }, { x: 1085, y: 1972 },
    { x: 1407, y: 1469 }, { x: 1725, y: 1169 }, { x: 2045, y: 970 },
    { x: 2362, y: 828 }, { x: 2680, y: 720 }, { x: 2998, y: 636 },
  ];

  const contCurve = [
    { x: 225, y: 1065 }, { x: 792, y: 1053 }, { x: 1358, y: 960 },
    { x: 1592, y: 834 }, { x: 1826, y: 731 }, { x: 2061, y: 641 },
    { x: 2296, y: 566 }, { x: 2529, y: 497 }, { x: 2765, y: 429 },
    { x: 2999, y: 371 },
  ];

  return (
    <div>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart margin={{ top: 10, right: 20, bottom: 30, left: 50 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
          <XAxis
            dataKey="x"
            type="number"
            domain={[0, 3200]}
            tick={AXIS_STYLE}
            label={{ value: "Speed (RPM)", position: "insideBottom", offset: -10, fill: "#9ca3af", fontSize: 11 }}
          />
          <YAxis
            dataKey="y"
            type="number"
            domain={[0, 3500]}
            tick={AXIS_STYLE}
            label={{ value: "Torque (Nm)", angle: -90, position: "insideLeft", offset: 15, fill: "#9ca3af", fontSize: 11 }}
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            contentStyle={TOOLTIP_STYLE}
            formatter={(val, name) => [typeof val === 'number' ? val.toFixed(0) : val, name]}
          />
          <Legend wrapperStyle={{ fontSize: "11px", color: "#d1d5db" }} />

          {/* Peak torque boundary */}
          <Line
            data={peakCurve}
            type="monotone"
            dataKey="y"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            name="Peak Torque Limit"
            legendType="line"
          />

          {/* Continuous torque boundary */}
          <Line
            data={contCurve}
            type="monotone"
            dataKey="y"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            strokeDasharray="6 3"
            name="Continuous Torque Limit"
            legendType="line"
          />

          {/* Operating points */}
          <Scatter
            data={opPoints}
            fill="#3b82f6"
            opacity={0.6}
            name="Operating Points"
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="text-xs text-gray-500 text-center mt-1">
        Blue dots = drive cycle operating points | Peak efficiency ~94.5% at ~900RPM / 540Nm
      </div>
    </div>
  );
};


