import React, { useState } from "react";
import { AnalysisPoint } from "../utils/motorPhysics";
import { Download } from "lucide-react";

interface Props {
  data: AnalysisPoint[];
}

type Column = {
  key: keyof AnalysisPoint;
  label: string;
  unit: string;
  decimals: number;
  color: string;
};

const COLUMNS: Column[] = [
  { key: "time_s", label: "Time", unit: "s", decimals: 1, color: "text-gray-300" },
  { key: "speed_kmh", label: "Speed", unit: "km/h", decimals: 1, color: "text-blue-400" },
  { key: "acceleration_ms2", label: "Accel.", unit: "m/s²", decimals: 3, color: "text-purple-400" },
  { key: "motorRPM", label: "Motor RPM", unit: "rpm", decimals: 0, color: "text-indigo-400" },
  { key: "motorTorque_Nm", label: "Motor Torque", unit: "Nm", decimals: 1, color: "text-yellow-400" },
  { key: "motorPower_kW", label: "Power", unit: "kW", decimals: 2, color: "text-green-400" },
  { key: "current_Arms", label: "Current", unit: "Arms", decimals: 1, color: "text-orange-400" },
  { key: "F_inertia_N", label: "F_inertia", unit: "N", decimals: 0, color: "text-red-400" },
  { key: "F_rolling_N", label: "F_roll", unit: "N", decimals: 0, color: "text-emerald-400" },
  { key: "F_drag_N", label: "F_drag", unit: "N", decimals: 0, color: "text-cyan-400" },
  { key: "F_total_N", label: "F_total", unit: "N", decimals: 0, color: "text-pink-400" },
  { key: "copperLoss_W", label: "Cu Loss", unit: "W", decimals: 1, color: "text-red-300" },
  { key: "ironLoss_W", label: "Fe Loss", unit: "W", decimals: 1, color: "text-amber-300" },
  { key: "mechLoss_W", label: "Mech Loss", unit: "W", decimals: 1, color: "text-violet-300" },
  { key: "totalMotorLoss_W", label: "Motor Loss", unit: "W", decimals: 1, color: "text-red-400" },
  { key: "motorEfficiency", label: "Motor η", unit: "%", decimals: 1, color: "text-emerald-400" },
  { key: "igbtConductionLoss_W", label: "IGBT Cond.", unit: "W", decimals: 1, color: "text-blue-300" },
  { key: "diodeConductionLoss_W", label: "Diode Cond.", unit: "W", decimals: 1, color: "text-cyan-300" },
  { key: "igbtSwitchLoss_W", label: "SW Loss", unit: "W", decimals: 1, color: "text-orange-300" },
  { key: "totalInverterLoss_W", label: "Inv. Loss", unit: "W", decimals: 1, color: "text-blue-400" },
  { key: "inverterEfficiency", label: "Inv. η", unit: "%", decimals: 1, color: "text-teal-400" },
  { key: "totalSystemLoss_W", label: "Sys. Loss", unit: "W", decimals: 1, color: "text-pink-400" },
  { key: "systemEfficiency", label: "Sys. η", unit: "%", decimals: 1, color: "text-lime-400" },
];

export const DataTable: React.FC<Props> = ({ data }) => {
  const [page, setPage] = useState(0);
  const [showCols, setShowCols] = useState<Set<string>>(new Set(COLUMNS.map(c => c.key)));
  const [showColPicker, setShowColPicker] = useState(false);
  const rowsPerPage = 20;

  const totalPages = Math.ceil(data.length / rowsPerPage);
  const pageData = data.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const visibleCols = COLUMNS.filter((c) => showCols.has(c.key));

  const toggleCol = (key: string) => {
    const next = new Set(showCols);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setShowCols(next);
  };

  const handleExportCSV = () => {
    const header = visibleCols.map((c) => `${c.label}(${c.unit})`).join(",");
    const rows = data.map((d) =>
      visibleCols.map((c) => {
        const val = d[c.key] as number;
        return val.toFixed(c.decimals);
      }).join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "motor_analysis.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const fmt = (val: number, decimals: number) => {
    if (isNaN(val) || !isFinite(val)) return "–";
    return val.toFixed(decimals);
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <h2 className="text-white font-semibold text-sm">Analysis Data Table</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
            {data.length} rows
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="text-xs px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white transition"
            onClick={() => setShowColPicker(!showColPicker)}
          >
            Columns
          </button>
          <button
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white transition"
            onClick={handleExportCSV}
          >
            <Download size={12} /> Export CSV
          </button>
        </div>
      </div>

      {/* Column picker */}
      {showColPicker && (
        <div className="px-4 py-3 bg-gray-850 border-b border-gray-700">
          <p className="text-xs text-gray-400 mb-2 font-medium">Toggle Columns:</p>
          <div className="flex flex-wrap gap-2">
            {COLUMNS.map((c) => (
              <button
                key={c.key}
                className={`text-xs px-2 py-1 rounded border transition ${
                  showCols.has(c.key)
                    ? "bg-blue-800 border-blue-600 text-blue-200"
                    : "bg-gray-800 border-gray-600 text-gray-500"
                }`}
                onClick={() => toggleCol(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="text-xs w-full">
          <thead className="bg-gray-800 sticky top-0">
            <tr>
              {visibleCols.map((c) => (
                <th key={c.key} className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                  <div className={`${c.color}`}>{c.label}</div>
                  <div className="text-gray-500 font-normal">{c.unit}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, ri) => (
              <tr
                key={ri}
                className={ri % 2 === 0 ? "bg-gray-900" : "bg-gray-800 bg-opacity-50"}
              >
                {visibleCols.map((c) => (
                  <td key={c.key} className={`px-3 py-1.5 whitespace-nowrap ${c.color}`}>
                    {fmt(row[c.key] as number, c.decimals)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-700 bg-gray-800">
        <button
          className="text-xs px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-40 transition"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          ← Prev
        </button>
        <span className="text-xs text-gray-400">
          Page {page + 1} / {totalPages} — Rows {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, data.length)}
        </span>
        <button
          className="text-xs px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-40 transition"
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
        >
          Next →
        </button>
      </div>
    </div>
  );
};
