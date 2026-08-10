import React, { useState } from "react";
import { FormulaOverrides, DEFAULT_FORMULA_OVERRIDES } from "../utils/motorPhysics";
import { Settings, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

interface Props {
  overrides: FormulaOverrides;
  onChange: (fo: FormulaOverrides) => void;
}

interface FieldDef {
  key: keyof FormulaOverrides;
  label: string;
  unit: string;
  description: string;
  min?: number;
  max?: number;
  step?: number;
}

const FORMULA_FIELDS: { section: string; color: string; fields: FieldDef[] }[] = [
  {
    section: "Region 1: Power < 144kW AND rpm < 1600  →  I = ((T/4.7)/1.414) × PF",
    color: "blue",
    fields: [
      {
        key: "region1_powerLimit_kW",
        label: "Power Limit",
        unit: "kW",
        description: "Max power for Region 1 formula",
        min: 50, max: 300, step: 1,
      },
      {
        key: "region1_rpmLimit",
        label: "RPM Limit",
        unit: "RPM",
        description: "Max RPM for Region 1 formula",
        min: 500, max: 3000, step: 50,
      },
      {
        key: "region1_torqueDivisor",
        label: "Torque Divisor",
        unit: "",
        description: "I = ((T / divisor) / √2) × PF",
        min: 1, max: 20, step: 0.1,
      },
      {
        key: "region1_sqrtFactor",
        label: "√2 Factor",
        unit: "",
        description: "Peak-to-RMS conversion factor (√2 = 1.414)",
        min: 1.0, max: 2.0, step: 0.001,
      },
      {
        key: "region1_pf",
        label: "Power Factor",
        unit: "",
        description: "Motor power factor in Region 1 (default 0.84)",
        min: 0.5, max: 1.0, step: 0.01,
      },
    ],
  },
  {
    section: "Region 2: Power > 144kW AND rpm > 1600  →  I = Power(kW) × multiplier",
    color: "purple",
    fields: [
      {
        key: "region2_multiplier",
        label: "Multiplier",
        unit: "",
        description: "I (A) = Power_kW × multiplier  (default 0.63)",
        min: 0.1, max: 5.0, step: 0.01,
      },
    ],
  },
  {
    section: "Region 3: Power < 144kW AND rpm > 1600  →  I = Power(kW) × multiplier",
    color: "green",
    fields: [
      {
        key: "region3_multiplier",
        label: "Multiplier",
        unit: "",
        description: "I (A) = Power_kW × multiplier  (default 1.05)",
        min: 0.1, max: 5.0, step: 0.01,
      },
    ],
  },
  {
    section: "Region 4: Power > 144kW AND rpm < 1600  →  Split by torque threshold",
    color: "red",
    fields: [
      {
        key: "region4_torqueThreshold_Nm",
        label: "Torque Threshold",
        unit: "Nm",
        description: "Boundary between Region 4a (above) and 4b (below)",
        min: 100, max: 3000, step: 50,
      },
      {
        key: "region4a_pf",
        label: "PF — Region 4a (torque > threshold)",
        unit: "",
        description: "I = ((T/4.7)/1.414) × PF  for torque > threshold  (default 0.725)",
        min: 0.1, max: 2.0, step: 0.001,
      },
      {
        key: "region4b_pf",
        label: "PF — Region 4b (torque ≤ threshold)",
        unit: "",
        description: "I = ((T/4.7)/1.414) × PF  for torque ≤ threshold  (default 0.9)",
        min: 0.1, max: 2.0, step: 0.001,
      },
    ],
  },
  {
    section: "IGBT Inverter Loss Parameters (1200V / 500A Reference)",
    color: "orange",
    fields: [
      {
        key: "igbt_Vce_sat",
        label: "Vce_sat",
        unit: "V",
        description: "IGBT saturation voltage",
        min: 0.5, max: 4.0, step: 0.05,
      },
      {
        key: "igbt_Vf_diode",
        label: "Vf Diode",
        unit: "V",
        description: "Freewheeling diode forward voltage",
        min: 0.5, max: 3.0, step: 0.05,
      },
      {
        key: "igbt_Eon_mJ",
        label: "E_on",
        unit: "mJ",
        description: "Turn-ON switching energy @ ref conditions",
        min: 1, max: 200, step: 1,
      },
      {
        key: "igbt_Eoff_mJ",
        label: "E_off",
        unit: "mJ",
        description: "Turn-OFF switching energy @ ref conditions",
        min: 1, max: 150, step: 1,
      },
      {
        key: "igbt_Err_mJ",
        label: "E_rr",
        unit: "mJ",
        description: "Diode reverse recovery energy",
        min: 1, max: 100, step: 1,
      },
      {
        key: "igbt_fsw_Hz",
        label: "Fsw",
        unit: "Hz",
        description: "PWM switching frequency",
        min: 1000, max: 20000, step: 500,
      },
    ],
  },
  {
    section: "Motor Loss Model Coefficients",
    color: "green",
    fields: [
      {
        key: "motor_statorR_ohm",
        label: "Stator R",
        unit: "Ω/phase",
        description: "Per-phase stator resistance (6 phases)",
        min: 0.001, max: 0.5, step: 0.001,
      },
      {
        key: "motor_ironLossCoeff",
        label: "Iron Loss K",
        unit: "",
        description: "Iron loss coefficient: P_iron = K × RPM^1.5 × T^0.5",
        min: 0.00001, max: 0.01, step: 0.00001,
      },
      {
        key: "motor_mechLossCoeff",
        label: "Mech Loss K",
        unit: "",
        description: "Mechanical loss coefficient: P_mech = K × RPM²",
        min: 0.00001, max: 0.005, step: 0.00001,
      },
    ],
  },
];

export const FormulaEditor: React.FC<Props> = ({ overrides, onChange }) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "Region 1: Low-Speed / Low-Power Current Formula": true,
    "Region 2: High-Speed / Constant-Power Current Formula": true,
    "IGBT Inverter Loss Parameters (1200V / 500A Reference)": true,
    "Motor Loss Model Coefficients": true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleChange = (key: keyof FormulaOverrides, val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onChange({ ...overrides, [key]: num });
    }
  };

  const handleReset = () => {
    onChange({ ...DEFAULT_FORMULA_OVERRIDES });
  };

  const colorMap: Record<string, string> = {
    blue: "border-blue-700 bg-blue-950",
    purple: "border-purple-700 bg-purple-950",
    orange: "border-orange-700 bg-orange-950",
    green: "border-green-700 bg-green-950",
  };

  const headerColorMap: Record<string, string> = {
    blue: "bg-blue-900 text-blue-300",
    purple: "bg-purple-900 text-purple-300",
    orange: "bg-orange-900 text-orange-300",
    green: "bg-green-900 text-green-300",
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Settings size={16} className="text-yellow-400" />
          <h2 className="text-white font-semibold text-sm">Formula & Parameter Editor</h2>
        </div>
        <button
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white transition"
          onClick={handleReset}
        >
          <RefreshCw size={12} /> Reset Defaults
        </button>
      </div>

      <div className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
        {/* Formula display */}
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <p className="text-xs text-yellow-400 font-mono font-semibold mb-1">Current Formula Reference</p>
          <div className="space-y-1 text-xs font-mono text-gray-300">
            <div className="text-blue-300">
              <span className="text-gray-500">// Region 1 (P &lt; {overrides.region1_powerLimit_kW}kW AND RPM &lt; {overrides.region1_rpmLimit})</span>
            </div>
            <div className="text-emerald-300">
              I = ((T / {overrides.region1_torqueDivisor}) / {overrides.region1_sqrtFactor}) × {overrides.region1_pf}
            </div>
            <div className="text-blue-300 mt-1">
              <span className="text-gray-500">// Region 2 (High speed / constant power)</span>
            </div>
            <div className="text-emerald-300">
              I = P_kW × 1000 / (√{overrides.region2_phases} × V_phase × {overrides.region2_pf})
            </div>
            <div className="text-blue-300 mt-1">
              <span className="text-gray-500">// Motor Losses</span>
            </div>
            <div className="text-emerald-300">
              P_cu = 6 × I² × {overrides.motor_statorR_ohm}Ω
            </div>
            <div className="text-emerald-300">
              P_iron = {overrides.motor_ironLossCoeff} × RPM^1.5 × T^0.5
            </div>
          </div>
        </div>

        {/* Parameter sections */}
        {FORMULA_FIELDS.map(({ section, color, fields }) => (
          <div key={section} className={`rounded-lg border ${colorMap[color]} overflow-hidden`}>
            <button
              className={`w-full flex items-center justify-between px-4 py-2 ${headerColorMap[color]} text-xs font-semibold`}
              onClick={() => toggleSection(section)}
            >
              <span>{section}</span>
              {openSections[section] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {openSections[section] && (
              <div className="p-3 grid grid-cols-1 gap-2">
                {fields.map((field) => (
                  <div key={field.key} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-gray-200 font-medium">{field.label}</span>
                        {field.unit && (
                          <span className="text-xs text-gray-500">({field.unit})</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{field.description}</p>
                    </div>
                    <input
                      type="number"
                      className="w-28 bg-gray-800 text-gray-100 text-xs px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-blue-400 text-right"
                      value={overrides[field.key]}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
