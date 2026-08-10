import React, { useState, useCallback } from "react";
import { DriveCyclePoint, PREDEFINED_CYCLES } from "../utils/motorPhysics";
import { PlusCircle, Trash2, Upload, Download, RefreshCw, ChevronDown } from "lucide-react";

interface Props {
  points: DriveCyclePoint[];
  onChange: (pts: DriveCyclePoint[]) => void;
  cycleName: string;
  onNameChange: (name: string) => void;
}

export const DriveCycleEditor: React.FC<Props> = ({ points, onChange, cycleName, onNameChange }) => {
  const [showTable, setShowTable] = useState(true);
  const [pasteText, setPasteText] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleAddRow = () => {
    const last = points[points.length - 1];
    const newPt: DriveCyclePoint = {
      time_s: last ? last.time_s + 10 : 0,
      speed_kmh: last ? last.speed_kmh : 0,
    };
    onChange([...points, newPt]);
  };

  const handleRemoveRow = (idx: number) => {
    onChange(points.filter((_, i) => i !== idx));
  };

  const handleCellChange = (idx: number, field: keyof DriveCyclePoint, val: string) => {
    const updated = points.map((p, i) => {
      if (i !== idx) return p;
      return { ...p, [field]: parseFloat(val) || 0 };
    });
    onChange(updated);
  };

  const handleLoadPreset = (name: string) => {
    onNameChange(name);
    onChange([...PREDEFINED_CYCLES[name]]);
    setDropdownOpen(false);
  };

  const handlePaste = useCallback(() => {
    const lines = pasteText.trim().split("\n");
    const pts: DriveCyclePoint[] = [];
    for (const line of lines) {
      const parts = line.trim().split(/[\t,;]+/);
      if (parts.length >= 2) {
        const t = parseFloat(parts[0]);
        const s = parseFloat(parts[1]);
        if (!isNaN(t) && !isNaN(s)) {
          pts.push({ time_s: t, speed_kmh: s });
        }
      }
    }
    if (pts.length > 0) {
      onChange(pts);
      setPasteText("");
      setShowPaste(false);
    }
  }, [pasteText, onChange]);

  const handleExport = () => {
    const header = "Time(s),Speed(km/h)\n";
    const rows = points.map(p => `${p.time_s},${p.speed_kmh}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cycleName.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    onChange([{ time_s: 0, speed_kmh: 0 }]);
    onNameChange("Custom");
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <h2 className="text-white font-semibold text-sm">Drive Cycle Editor</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900 text-blue-300 border border-blue-700">
            {points.length} pts
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Preset selector */}
          <div className="relative">
            <button
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-indigo-700 hover:bg-indigo-600 text-white transition"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              Load Preset <ChevronDown size={12} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-8 z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-xl min-w-48 overflow-hidden">
                {Object.keys(PREDEFINED_CYCLES).map((name) => (
                  <button
                    key={name}
                    className="block w-full text-left px-4 py-2 text-xs text-gray-200 hover:bg-gray-700 transition"
                    onClick={() => handleLoadPreset(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white transition"
            onClick={() => setShowPaste(!showPaste)}
          >
            <Upload size={12} /> Paste CSV
          </button>
          <button
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white transition"
            onClick={handleExport}
          >
            <Download size={12} /> Export
          </button>
          <button
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-red-900 hover:bg-red-800 text-white transition"
            onClick={handleClear}
          >
            <RefreshCw size={12} /> Clear
          </button>
          <button
            className="text-xs px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white transition"
            onClick={() => setShowTable(!showTable)}
          >
            {showTable ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {/* Paste area */}
      {showPaste && (
        <div className="p-4 bg-gray-850 border-b border-gray-700">
          <p className="text-xs text-gray-400 mb-2">
            Paste time-speed data (tab/comma/semicolon separated, one row per line):
          </p>
          <textarea
            className="w-full h-28 bg-gray-800 text-gray-200 text-xs font-mono px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500 resize-none"
            placeholder={"0\t0\n10\t20\n30\t40\n..."}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
          <button
            className="mt-2 text-xs px-4 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white transition"
            onClick={handlePaste}
          >
            Import Data
          </button>
        </div>
      )}

      {/* Table */}
      {showTable && (
        <div className="overflow-y-auto" style={{ maxHeight: 300 }}>
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-800 text-gray-400">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Time (s)</th>
                <th className="px-3 py-2 text-left">Speed (km/h)</th>
                <th className="px-3 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {points.map((pt, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-gray-900" : "bg-gray-850"}>
                  <td className="px-3 py-1 text-gray-500">{idx + 1}</td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      className="w-24 bg-gray-800 text-gray-100 px-2 py-0.5 rounded border border-gray-700 focus:outline-none focus:border-blue-500"
                      value={pt.time_s}
                      onChange={(e) => handleCellChange(idx, "time_s", e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      className="w-24 bg-gray-800 text-gray-100 px-2 py-0.5 rounded border border-gray-700 focus:outline-none focus:border-blue-500"
                      value={pt.speed_kmh}
                      onChange={(e) => handleCellChange(idx, "speed_kmh", e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <button
                      className="text-red-500 hover:text-red-400 transition"
                      onClick={() => handleRemoveRow(idx)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add row */}
      {showTable && (
        <div className="px-4 py-2 border-t border-gray-700">
          <button
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition"
            onClick={handleAddRow}
          >
            <PlusCircle size={14} /> Add Row
          </button>
        </div>
      )}
    </div>
  );
};
