import React, { useState, useCallback } from "react";
import {
  DriveCyclePoint,
  AnalysisPoint,
  FormulaOverrides,
  DEFAULT_FORMULA_OVERRIDES,
  DEFAULT_VEHICLE_OVERRIDE,
  VehicleParamsOverride,
  analyzeDriveCycle,
  PREDEFINED_CYCLES,
} from "./utils/motorPhysics";
import { DriveCycleEditor } from "./components/DriveCycleEditor";
import { FormulaEditor } from "./components/FormulaEditor";
import { KPICards } from "./components/KPICards";
import { AnalysisCharts } from "./components/AnalysisCharts";
import { DataTable } from "./components/DataTable";
import { VehicleParams } from "./components/VehicleParams";
import { CyclePreview } from "./components/CyclePreview";
import { LossPieChart } from "./components/LossPieChart";
import {
  Zap, BarChart2, Table2, Settings2, ChevronRight,
  AlertCircle, Settings, ChevronDown, ChevronUp,
} from "lucide-react";

type ViewTab = "dashboard" | "table" | "formulas";

const INITIAL_CYCLE_NAME = "City Bus Cycle";
const INITIAL_CYCLE = [...PREDEFINED_CYCLES[INITIAL_CYCLE_NAME]];

// ─── Vehicle Presets ─────────────────────────────────────────
interface VehiclePreset {
  name: string;
  params: VehicleParamsOverride;
}

const VEHICLE_PRESETS: VehiclePreset[] = [
  {
    name: "🚌 6-Ph City Bus",
    params: { ...DEFAULT_VEHICLE_OVERRIDE },
  },
  {
    name: "🚌 3-Ph City Bus",
    params: {
      ...DEFAULT_VEHICLE_OVERRIDE,
      motor_phases: 3, motor_ratedPower_kW: 120, motor_peakPower_kW: 180,
      motor_ratedCurrent_A: 200, motor_peakCurrent_A: 380,
      motor_busVoltage_V: 540, inv_phases: 3, inv_numSwitches: 6,
      inv_voltageRating_V: 900, inv_currentRating_A: 450,
    },
  },
  {
    name: "🚛 Heavy Truck 40T",
    params: {
      ...DEFAULT_VEHICLE_OVERRIDE,
      gvw_kg: 40000, fdr: 7.5, tyre_radius_m: 0.54,
      frontalArea_m2: 9.2, dragCoeff: 0.65,
      motor_ratedPower_kW: 200, motor_peakPower_kW: 320,
      motor_ratedTorque_Nm: 2000, motor_peakTorque_Nm: 3500,
      motor_ratedCurrent_A: 340, motor_peakCurrent_A: 580,
      motor_busVoltage_V: 750,
    },
  },
  {
    name: "🚐 3-Ph Mini Bus",
    params: {
      ...DEFAULT_VEHICLE_OVERRIDE,
      gvw_kg: 8000, fdr: 5.2, tyre_radius_m: 0.42,
      frontalArea_m2: 5.4, dragCoeff: 0.55,
      motor_phases: 3, motor_ratedPower_kW: 80, motor_peakPower_kW: 120,
      motor_ratedTorque_Nm: 600, motor_peakTorque_Nm: 1100,
      motor_ratedSpeed_rpm: 2000, motor_maxSpeed_rpm: 3500,
      motor_ratedCurrent_A: 150, motor_peakCurrent_A: 280,
      motor_busVoltage_V: 400,
      inv_phases: 3, inv_numSwitches: 6,
      inv_voltageRating_V: 750, inv_currentRating_A: 300,
    },
  },
  {
    name: "🏭 Mining Truck",
    params: {
      ...DEFAULT_VEHICLE_OVERRIDE,
      gvw_kg: 55000, fdr: 9.0, tyre_radius_m: 0.62,
      frontalArea_m2: 12.0, dragCoeff: 0.7, frictionCoeff: 0.015,
      motor_ratedPower_kW: 300, motor_peakPower_kW: 480,
      motor_ratedTorque_Nm: 3000, motor_peakTorque_Nm: 5500,
      motor_ratedCurrent_A: 480, motor_peakCurrent_A: 800,
      motor_busVoltage_V: 900,
    },
  },
];

// ─── Main App ────────────────────────────────────────────────
export default function App() {
  const [cycleName, setCycleName] = useState(INITIAL_CYCLE_NAME);
  const [cyclePoints, setCyclePoints] = useState<DriveCyclePoint[]>(INITIAL_CYCLE);
  const [formulaOverrides, setFormulaOverrides] = useState<FormulaOverrides>(DEFAULT_FORMULA_OVERRIDES);
  const [gradeAngle, setGradeAngle] = useState(0);
  const [activeView, setActiveView] = useState<ViewTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisPoint[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vp, setVp] = useState<VehicleParamsOverride>(DEFAULT_VEHICLE_OVERRIDE);
  const [showVehicleEditor, setShowVehicleEditor] = useState(false);
  const [showMotorEditor, setShowMotorEditor] = useState(false);
  const [showInverterEditor, setShowInverterEditor] = useState(false);

  const setVpField = (field: keyof VehicleParamsOverride, val: number) => {
    setVp(prev => ({ ...prev, [field]: val }));
    setHasRun(false);
  };

  // ─── Handle Run ───────────────────────────────────────────
  const handleRun = useCallback(() => {
    if (cyclePoints.length < 2) {
      setError("Please enter at least 2 drive cycle points.");
      return;
    }
    setError(null);
    try {
      const sorted = [...cyclePoints].sort((a, b) => a.time_s - b.time_s);
      const result = analyzeDriveCycle(sorted, formulaOverrides, gradeAngle, vp);
      setAnalysisResult(result);
      setHasRun(true);
      setLastRun(new Date());
    } catch (e) {
      setError("Analysis error: " + (e instanceof Error ? e.message : String(e)));
    }
  }, [cyclePoints, formulaOverrides, gradeAngle, vp]);

  const handleCycleChange = useCallback((pts: DriveCyclePoint[]) => {
    setCyclePoints(pts);
    setHasRun(false);
  }, []);

  const hasData = hasRun && analysisResult.length > 0;
  const motorLabel = `${vp.motor_phases}-Ph ${vp.motor_ratedPower_kW}kW`;
  const invLabel   = `${vp.inv_phases}-Ph ${vp.inv_numSwitches}SW`;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── TOP NAV ─────────────────────────────────────────── */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">EV Motor & Controller</div>
              <div className="text-xs text-gray-400 leading-tight">Loss Analyzer Dashboard</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1 ml-4 bg-gray-800 rounded-lg p-1">
            <NavBtn active={activeView === "dashboard"} icon={<BarChart2 size={14} />} label="Dashboard" onClick={() => setActiveView("dashboard")} />
            <NavBtn active={activeView === "table"} icon={<Table2 size={14} />} label="Data Table" onClick={() => setActiveView("table")} />
            <NavBtn active={activeView === "formulas"} icon={<Settings2 size={14} />} label="Formulas" onClick={() => setActiveView("formulas")} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastRun && <span className="text-xs text-gray-500">Last run: {lastRun.toLocaleTimeString()}</span>}
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5">
            <label className="text-xs text-gray-400">Road Grade:</label>
            <input type="number" className="w-14 bg-gray-700 text-white text-xs px-2 py-0.5 rounded border border-gray-600 focus:outline-none focus:border-blue-400 text-center"
              value={gradeAngle} min={-15} max={15} step={0.5}
              onChange={(e) => setGradeAngle(parseFloat(e.target.value) || 0)} />
            <span className="text-xs text-gray-400">°</span>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg transition" onClick={handleRun}>
            <ChevronRight size={16} /> Run Analysis
          </button>
        </div>
      </header>

      {/* ── MOBILE TABS ──────────────────────────────────────── */}
      <div className="md:hidden flex bg-gray-900 border-b border-gray-800 px-2 py-1 gap-1">
        <NavBtn active={activeView === "dashboard"} icon={<BarChart2 size={14} />} label="Dashboard" onClick={() => setActiveView("dashboard")} />
        <NavBtn active={activeView === "table"} icon={<Table2 size={14} />} label="Data Table" onClick={() => setActiveView("table")} />
        <NavBtn active={activeView === "formulas"} icon={<Settings2 size={14} />} label="Formulas" onClick={() => setActiveView("formulas")} />
      </div>

      {/* ── ERROR BANNER ─────────────────────────────────────── */}
      {error && (
        <div className="bg-red-950 border-b border-red-800 px-4 py-2 flex items-center gap-2">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <span className="text-red-300 text-sm">{error}</span>
          <button className="ml-auto text-red-400 hover:text-red-300 text-xs" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── SIDEBAR ─────────────────────────────────────────── */}
        <aside className={`shrink-0 bg-gray-900 border-r border-gray-800 overflow-y-auto transition-all duration-200 ${sidebarOpen ? "w-80 xl:w-96" : "w-0 overflow-hidden"}`}>
          <div className="p-3 space-y-3 min-w-80 xl:min-w-96">
            <div className="bg-gray-800 rounded-lg px-3 py-2 border border-gray-700">
              <label className="text-xs text-gray-400">Cycle Name</label>
              <input className="w-full bg-transparent text-white text-sm font-semibold focus:outline-none mt-0.5" value={cycleName} onChange={(e) => setCycleName(e.target.value)} />
            </div>
            <DriveCycleEditor points={cyclePoints} onChange={handleCycleChange} cycleName={cycleName} onNameChange={setCycleName} />
            <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg transition" onClick={handleRun}>
              <ChevronRight size={18} /> Run Analysis ({cyclePoints.length} pts)
            </button>
            {!hasRun && cyclePoints.length >= 2 && (
              <div className="text-xs text-yellow-500 text-center flex items-center justify-center gap-1">
                <AlertCircle size={12} /> Click "Run Analysis" to compute results
              </div>
            )}
          </div>
        </aside>

        {/* ── SIDEBAR TOGGLE ───────────────────────────────────── */}
        <button className="shrink-0 bg-gray-800 hover:bg-gray-700 border-r border-gray-700 px-1 transition flex items-center" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <span className={`text-gray-400 text-xs transition-transform duration-200 ${sidebarOpen ? "" : "rotate-180"}`}>◀</span>
        </button>

        {/* ── MAIN PANEL ───────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeView === "dashboard" && (
            <>

              {/* ══ VEHICLE SECTION ══ */}
              <ConfigSection
                icon={<Settings size={16} className="text-orange-400" />}
                title="🚛 Vehicle"
                open={showVehicleEditor}
                onToggle={() => setShowVehicleEditor(v => !v)}
                badges={[
                  { label: "GVW", value: vp.gvw_kg.toLocaleString() + " kg", color: "orange" },
                  { label: "FDR", value: vp.fdr.toString(), color: "blue" },
                  { label: "r", value: vp.tyre_radius_m + "m", color: "emerald" },
                ]}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <ParamInput label="GVW" unit="kg" value={vp.gvw_kg} min={1000} max={80000} step={100} description="Gross vehicle weight incl. payload" color="orange" onChange={v => setVpField("gvw_kg", v)} />
                  <ParamInput label="Final Drive Ratio (FDR)" unit="" value={vp.fdr} min={1} max={20} step={0.001} description="Motor RPM ÷ Wheel RPM" color="blue" onChange={v => setVpField("fdr", v)} />
                  <ParamInput label="Tyre Radius" unit="m" value={vp.tyre_radius_m} min={0.2} max={0.8} step={0.001} description="Effective rolling radius" color="emerald" onChange={v => setVpField("tyre_radius_m", v)} />
                  <ParamInput label="Rolling Friction Coeff" unit="" value={vp.frictionCoeff} min={0.003} max={0.05} step={0.001} description="0.008 = road, 0.015 = gravel" color="yellow" onChange={v => setVpField("frictionCoeff", v)} />
                  <ParamInput label="Frontal Area" unit="m²" value={vp.frontalArea_m2} min={1} max={20} step={0.1} description="Vehicle front cross-section" color="purple" onChange={v => setVpField("frontalArea_m2", v)} />
                  <ParamInput label="Drag Coefficient (Cd)" unit="" value={vp.dragCoeff} min={0.2} max={1.2} step={0.01} description="Aerodynamic drag (0.6 = bus)" color="red" onChange={v => setVpField("dragCoeff", v)} />
                </div>
              </ConfigSection>

              {/* ══ MOTOR SECTION ══ */}
              <ConfigSection
                icon={<Zap size={16} className="text-blue-400" />}
                title="⚡ Motor"
                open={showMotorEditor}
                onToggle={() => setShowMotorEditor(v => !v)}
                badges={[
                  { label: "Phases", value: vp.motor_phases + "-Ph", color: vp.motor_phases === 3 ? "emerald" : "blue" },
                  { label: "Rated", value: vp.motor_ratedPower_kW + " kW", color: "blue" },
                  { label: "Poles", value: (vp.motor_polePairs * 2) + "-pole", color: "purple" },
                ]}
              >
                {/* Phase toggle */}
                <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="text-xs font-semibold text-white mb-2">Motor Phase Configuration</p>
                  <div className="flex gap-3">
                    {[3, 6].map(ph => (
                      <button key={ph}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold border transition ${vp.motor_phases === ph ? "bg-blue-600 border-blue-500 text-white" : "bg-gray-700 border-gray-600 text-gray-400 hover:bg-gray-600"}`}
                        onClick={() => { setVpField("motor_phases", ph); setVpField("inv_phases", ph); setVpField("inv_numSwitches", ph * 2); }}>
                        {ph}-Phase
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {vp.motor_phases === 3 ? "3-Phase: Standard single inverter. Lower cost, simpler control." : "6-Phase: Dual 3-phase winding. Higher power density, lower harmonic current, fault tolerance."}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <ParamInput label="Pole Pairs" unit="" value={vp.motor_polePairs} min={1} max={12} step={1} description="Pole pairs (×2 = total poles)" color="purple" onChange={v => setVpField("motor_polePairs", v)} />
                  <ParamInput label="Rated Power" unit="kW" value={vp.motor_ratedPower_kW} min={10} max={1000} step={5} description="Continuous rated output" color="blue" onChange={v => setVpField("motor_ratedPower_kW", v)} />
                  <ParamInput label="Peak Power" unit="kW" value={vp.motor_peakPower_kW} min={10} max={1500} step={5} description="Short-term peak (30s)" color="blue" onChange={v => setVpField("motor_peakPower_kW", v)} />
                  <ParamInput label="Rated Torque" unit="Nm" value={vp.motor_ratedTorque_Nm} min={50} max={10000} step={50} description="Continuous rated torque" color="orange" onChange={v => setVpField("motor_ratedTorque_Nm", v)} />
                  <ParamInput label="Peak Torque" unit="Nm" value={vp.motor_peakTorque_Nm} min={50} max={15000} step={50} description="Short-term peak torque" color="orange" onChange={v => setVpField("motor_peakTorque_Nm", v)} />
                  <ParamInput label="Rated Speed" unit="RPM" value={vp.motor_ratedSpeed_rpm} min={100} max={6000} step={50} description="Base / rated speed" color="emerald" onChange={v => setVpField("motor_ratedSpeed_rpm", v)} />
                  <ParamInput label="Max Speed" unit="RPM" value={vp.motor_maxSpeed_rpm} min={500} max={12000} step={100} description="Maximum operating speed" color="emerald" onChange={v => setVpField("motor_maxSpeed_rpm", v)} />
                  <ParamInput label="Rated Current" unit="Arms" value={vp.motor_ratedCurrent_A} min={10} max={2000} step={10} description="Continuous rated phase current" color="yellow" onChange={v => setVpField("motor_ratedCurrent_A", v)} />
                  <ParamInput label="Peak Current" unit="Arms" value={vp.motor_peakCurrent_A} min={10} max={3000} step={10} description="Peak phase current (30s limit)" color="red" onChange={v => setVpField("motor_peakCurrent_A", v)} />
                  <ParamInput label="DC Bus Voltage" unit="V" value={vp.motor_busVoltage_V} min={100} max={1500} step={10} description="Battery / DC link voltage" color="yellow" onChange={v => setVpField("motor_busVoltage_V", v)} />
                  <ParamInput label="Rated Efficiency" unit="%" value={Math.round(vp.motor_ratedEff * 100)} min={70} max={99} step={1} description="Motor efficiency at rated point" color="emerald" onChange={v => setVpField("motor_ratedEff", v / 100)} />
                </div>
              </ConfigSection>

              {/* ══ INVERTER SECTION ══ */}
              <ConfigSection
                icon={<Settings2 size={16} className="text-purple-400" />}
                title="🔧 Inverter / Controller"
                open={showInverterEditor}
                onToggle={() => setShowInverterEditor(v => !v)}
                badges={[
                  { label: "Config", value: invLabel, color: "purple" },
                  { label: "Rating", value: vp.inv_voltageRating_V + "V / " + vp.inv_currentRating_A + "A", color: "blue" },
                ]}
              >
                <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="text-xs font-semibold text-white mb-1">Inverter Configuration</p>
                  <p className="text-xs text-gray-400">
                    Currently: <span className="text-purple-300 font-bold">{vp.inv_phases}-Phase</span> inverter with <span className="text-yellow-300 font-bold">{vp.inv_numSwitches} IGBT switches</span> ({vp.inv_phases} half-bridges × 2).
                    {vp.inv_phases === 6 ? " Dual 3-phase topology with two separate 3-phase bridges sharing the same DC bus." : " Single 3-phase bridge."}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <ParamInput label="IGBT Voltage Rating" unit="V" value={vp.inv_voltageRating_V} min={200} max={3300} step={100} description="IGBT blocking voltage rating" color="purple" onChange={v => setVpField("inv_voltageRating_V", v)} />
                  <ParamInput label="IGBT Current Rating" unit="A" value={vp.inv_currentRating_A} min={50} max={3000} step={50} description="IGBT peak collector current" color="purple" onChange={v => setVpField("inv_currentRating_A", v)} />
                </div>
              </ConfigSection>

              {/* ══ PRESETS ══ */}
              <div className="bg-gray-900 rounded-xl border border-gray-700 p-3">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Quick Vehicle Presets</p>
                <div className="flex flex-wrap gap-2">
                  {VEHICLE_PRESETS.map(preset => (
                    <button key={preset.name}
                      className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-blue-500 text-xs text-gray-300 hover:text-white transition"
                      onClick={() => { setVp(preset.params); setHasRun(false); }}>
                      {preset.name}
                    </button>
                  ))}
                  <button className="px-3 py-1.5 rounded-lg bg-red-900 hover:bg-red-800 border border-red-700 text-xs text-red-300 hover:text-white transition"
                    onClick={() => { setVp(DEFAULT_VEHICLE_OVERRIDE); setHasRun(false); }}>
                    ↺ Reset
                  </button>
                </div>
                {!hasRun && (
                  <div className="mt-2 flex items-center gap-2 bg-yellow-950 border border-yellow-800 rounded-lg px-3 py-1.5">
                    <AlertCircle size={12} className="text-yellow-400 shrink-0" />
                    <span className="text-yellow-300 text-xs">Parameters changed — click <strong>Run Analysis</strong> to apply</span>
                  </div>
                )}
              </div>

              {/* Vehicle Specs panel */}
              <VehicleParams
                gvw_kg={vp.gvw_kg}
                fdr={vp.fdr}
                tyre_radius_m={vp.tyre_radius_m}
                tyre_size_label={vp.tyre_radius_m.toFixed(3) + "m radius"}
                motorPhases={vp.motor_phases}
                motorPolePairs={vp.motor_polePairs}
                motorRatedPower_kW={vp.motor_ratedPower_kW}
                motorPeakPower_kW={vp.motor_peakPower_kW}
                motorRatedTorque_Nm={vp.motor_ratedTorque_Nm}
                motorPeakTorque_Nm={vp.motor_peakTorque_Nm}
                motorRatedSpeed_rpm={vp.motor_ratedSpeed_rpm}
                motorMaxSpeed_rpm={vp.motor_maxSpeed_rpm}
                motorRatedCurrent_A={vp.motor_ratedCurrent_A}
                motorPeakCurrent_A={vp.motor_peakCurrent_A}
                motorBusVoltage_V={vp.motor_busVoltage_V}
                invPhases={vp.inv_phases}
                invNumSwitches={vp.inv_numSwitches}
                invVoltageRating_V={vp.inv_voltageRating_V}
                invCurrentRating_A={vp.inv_currentRating_A}
                frictionCoeff={vp.frictionCoeff}
                frontalArea_m2={vp.frontalArea_m2}
                dragCoeff={vp.dragCoeff}
              />

              <CyclePreview points={cyclePoints} cycleName={cycleName} />

              {!hasData && (
                <div className="bg-gray-900 rounded-xl border border-gray-700 p-12 text-center">
                  <div className="text-5xl mb-4">⚡</div>
                  <div className="text-white text-lg font-semibold mb-2">Ready to Analyze</div>
                  <div className="text-gray-400 text-sm mb-6">Configure your vehicle above, then click <span className="text-blue-400 font-semibold">Run Analysis</span></div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-xl mx-auto text-xs text-gray-500">
                    <InfoChip label="Motor" value={motorLabel} />
                    <InfoChip label="Inverter" value={invLabel} />
                    <InfoChip label="FDR" value={vp.fdr.toString()} />
                    <InfoChip label="GVW" value={vp.gvw_kg.toLocaleString() + " kg"} />
                  </div>
                  <button className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg transition" onClick={handleRun}>
                    🚀 Run Analysis
                  </button>
                </div>
              )}

              {hasData && (
                <>
                  <div className="flex items-center gap-3 bg-emerald-950 border border-emerald-800 rounded-xl px-4 py-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-300 text-xs font-semibold">Analysis Complete — {cycleName} — {analysisResult.length} data points</span>
                    <span className="text-emerald-600 text-xs ml-auto">Duration: {analysisResult[analysisResult.length - 1]?.time_s.toFixed(0)}s</span>
                  </div>
                  <KPICards data={analysisResult} />
                  <LossPieChart data={analysisResult} />
                  <AnalysisCharts data={analysisResult} />
                </>
              )}
            </>
          )}

          {activeView === "table" && (
            !hasData
              ? <EmptyState onRun={handleRun} message="Run an analysis first to see the data table." />
              : <DataTable data={analysisResult} />
          )}

          {activeView === "formulas" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <FormulaEditor overrides={formulaOverrides} onChange={(fo) => { setFormulaOverrides(fo); setHasRun(false); }} />
              <FormulaReference overrides={formulaOverrides} vp={vp} />
            </div>
          )}
        </main>
      </div>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="bg-gray-900 border-t border-gray-800 px-4 py-2 text-xs text-gray-600 flex items-center justify-between shrink-0">
        <div>EV Motor & Controller Loss Analyzer — {vp.motor_phases}-Phase {vp.motor_ratedPower_kW}kW, {vp.motor_busVoltage_V}V DC Bus</div>
        <div className="flex items-center gap-4">
          <span>FDR: <span className="text-blue-400 font-semibold">{vp.fdr}</span> | Tyre: <span className="text-emerald-400 font-semibold">{vp.tyre_radius_m}m</span> | GVW: <span className="text-orange-400 font-semibold">{vp.gvw_kg.toLocaleString()} kg</span></span>
          <span>Motor: <span className="text-blue-300">{vp.motor_phases}-Ph, {vp.motor_polePairs * 2}-pole</span> | Inv: <span className="text-purple-300">{vp.inv_phases}-Ph, {vp.inv_numSwitches}SW</span></span>
        </div>
      </footer>
    </div>
  );
}

// ─── ConfigSection ────────────────────────────────────────────
const ConfigSection: React.FC<{
  icon: React.ReactNode;
  title: string;
  open: boolean;
  onToggle: () => void;
  badges: { label: string; value: string; color: "blue" | "emerald" | "orange" | "purple" | "yellow" | "red" }[];
  children: React.ReactNode;
}> = ({ icon, title, open, onToggle, badges, children }) => (
  <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
    <div className="px-4 py-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between cursor-pointer" onClick={onToggle}>
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-white font-semibold text-sm">{title}</h2>
        <span className="text-xs text-gray-500">(click to edit)</span>
      </div>
      <div className="flex items-center gap-2">
        {badges.map(b => <Badge key={b.label} label={b.label} value={b.value} color={b.color} />)}
        {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </div>
    </div>
    {open && <div className="p-4">{children}</div>}
  </div>
);

// ─── NavBtn ──────────────────────────────────────────────────
const NavBtn: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${active ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-700"}`} onClick={onClick}>
    {icon} {label}
  </button>
);

const InfoChip: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-gray-800 rounded-lg px-3 py-2 border border-gray-700">
    <div className="text-gray-500">{label}</div>
    <div className="text-gray-200 font-semibold mt-0.5">{value}</div>
  </div>
);

const EmptyState: React.FC<{ onRun: () => void; message: string }> = ({ onRun, message }) => (
  <div className="bg-gray-900 rounded-xl border border-gray-700 p-12 text-center">
    <div className="text-4xl mb-3">📊</div>
    <div className="text-gray-300 text-sm mb-4">{message}</div>
    <button className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition" onClick={onRun}>Run Analysis</button>
  </div>
);

const Badge: React.FC<{ label: string; value: string; color: "blue" | "emerald" | "orange" | "purple" | "yellow" | "red" }> = ({ label, value, color }) => {
  const colorMap = {
    blue:    "bg-blue-900 text-blue-300 border-blue-700",
    emerald: "bg-emerald-900 text-emerald-300 border-emerald-700",
    orange:  "bg-orange-900 text-orange-300 border-orange-700",
    purple:  "bg-purple-900 text-purple-300 border-purple-700",
    yellow:  "bg-yellow-900 text-yellow-300 border-yellow-700",
    red:     "bg-red-900 text-red-300 border-red-700",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${colorMap[color]}`}>{label}: {value}</span>;
};

const ParamInput: React.FC<{
  label: string; unit: string; value: number; min: number; max: number;
  step: number; description: string; color: "blue" | "orange" | "emerald" | "purple" | "yellow" | "red";
  onChange: (v: number) => void;
}> = ({ label, unit, value, min, max, step, description, color, onChange }) => {
  const textColorMap = { blue: "text-blue-400", orange: "text-orange-400", emerald: "text-emerald-400", purple: "text-purple-400", yellow: "text-yellow-400", red: "text-red-400" };
  const borderColorMap = { blue: "border-blue-500 focus:border-blue-400", orange: "border-orange-500 focus:border-orange-400", emerald: "border-emerald-500 focus:border-emerald-400", purple: "border-purple-500 focus:border-purple-400", yellow: "border-yellow-500 focus:border-yellow-400", red: "border-red-500 focus:border-red-400" };
  return (
    <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
      <label className={`text-xs font-semibold uppercase tracking-wide ${textColorMap[color]}`}>{label}</label>
      <p className="text-xs text-gray-500 mb-2">{description}</p>
      <div className="flex items-center gap-2">
        <input type="number" className={`flex-1 bg-gray-700 text-white text-sm px-3 py-2 rounded border focus:outline-none ${borderColorMap[color]}`}
          value={value} min={min} max={max} step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)} />
        {unit && <span className="text-xs text-gray-400 shrink-0">{unit}</span>}
      </div>
      <input type="range" className="w-full mt-2 accent-blue-500" value={value} min={min} max={max} step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))} />
      <div className="flex justify-between text-xs text-gray-600 mt-0.5">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
};

// ─── FormulaReference ─────────────────────────────────────────
const FormulaReference: React.FC<{ overrides: FormulaOverrides; vp: VehicleParamsOverride }> = ({ overrides, vp }) => (
  <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
    <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
      <h2 className="text-white font-semibold text-sm">📐 Formula Reference & Theory</h2>
      <p className="text-xs text-gray-500 mt-0.5">Updates live from your configuration</p>
    </div>
    <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
      <Section title="1. Speed → Motor RPM" color="blue">
        <Formula>Motor RPM = (V_kmh / 3.6 / (2π × r_tyre)) × 60 × FDR</Formula>
        <Formula>{`= (V / 3.6 / (2π × ${vp.tyre_radius_m})) × 60 × ${vp.fdr}`}</Formula>
        <Note>@60km/h → {((60 / 3.6 / (2 * Math.PI * vp.tyre_radius_m)) * 60 * vp.fdr).toFixed(1)} RPM</Note>
      </Section>
      <Section title="2. Vehicle Forces" color="orange">
        <Formula>{`F_inertia = ${vp.gvw_kg} × a [N]`}</Formula>
        <Formula>{`F_rolling = ${vp.gvw_kg} × 9.81 × ${vp.frictionCoeff} = ${(vp.gvw_kg * 9.81 * vp.frictionCoeff).toFixed(0)} N`}</Formula>
        <Formula>{`F_drag = 0.5 × 1.225 × ${vp.dragCoeff} × ${vp.frontalArea_m2} × v² [N]`}</Formula>
        <Formula>F_total = F_inertia + F_rolling + F_drag + F_grade</Formula>
      </Section>
      <Section title="3. Torque Conversion" color="purple">
        <Formula>{`Wheel Torque = F_total × ${vp.tyre_radius_m} [Nm]`}</Formula>
        <Formula>{`Motor Torque = Wheel Torque / ${vp.fdr} [Nm]`}</Formula>
        <Note>Clamped to peak torque curve (scaled to {vp.motor_peakTorque_Nm} Nm peak)</Note>
      </Section>
      <Section title="4. Motor Current (4 Regions)" color="emerald">
        <Note>Region 1: P &lt; {overrides.region1_powerLimit_kW}kW AND rpm &lt; {overrides.region1_rpmLimit}</Note>
        <Formula>{`I = ((T/${overrides.region1_torqueDivisor})/${overrides.region1_sqrtFactor}) × ${overrides.region1_pf}`}</Formula>
        <Note>Region 2: P &gt; {overrides.region1_powerLimit_kW}kW AND rpm &gt; {overrides.region1_rpmLimit}</Note>
        <Formula>{`I = Power_kW × ${overrides.region2_multiplier}`}</Formula>
        <Note>Region 3: P &lt; {overrides.region1_powerLimit_kW}kW AND rpm &gt; {overrides.region1_rpmLimit}</Note>
        <Formula>{`I = Power_kW × ${overrides.region3_multiplier}`}</Formula>
        <Note>Region 4: P &gt; {overrides.region1_powerLimit_kW}kW AND rpm &lt; {overrides.region1_rpmLimit}</Note>
        <Formula>{`torque > ${overrides.region4_torqueThreshold_Nm}Nm → ×${overrides.region4a_pf} | else → ×${overrides.region4b_pf}`}</Formula>
      </Section>
      <Section title="5. Motor Losses" color="red">
        <Formula>{`P_copper = ${vp.motor_phases} × I² × ${overrides.motor_statorR_ohm}Ω [W]`}</Formula>
        <Formula>{`P_iron = ${overrides.motor_ironLossCoeff} × RPM^1.5 × T^0.5 [W]`}</Formula>
        <Formula>{`P_mech = ${overrides.motor_mechLossCoeff} × RPM² [W]`}</Formula>
      </Section>
      <Section title="6. Inverter Losses" color="cyan">
        <Note>{vp.inv_phases}-Phase inverter: {vp.inv_numSwitches} IGBT switches</Note>
        <Formula>{`P_cond = ${vp.inv_numSwitches} × ${overrides.igbt_Vce_sat}V × I × 0.5 [W]`}</Formula>
        <Formula>{`P_sw = ${vp.inv_numSwitches} × (Eon+Eoff+Err) × Fsw × V_scale × I_scale`}</Formula>
      </Section>
    </div>
  </div>
);

const Section: React.FC<{ title: string; color: string; children: React.ReactNode }> = ({ title, color, children }) => {
  const colorMap: Record<string, string> = {
    blue: "text-blue-400 border-blue-800", orange: "text-orange-400 border-orange-800",
    purple: "text-purple-400 border-purple-800", emerald: "text-emerald-400 border-emerald-800",
    red: "text-red-400 border-red-800", cyan: "text-cyan-400 border-cyan-800",
  };
  const [tc, bc] = (colorMap[color] ?? "text-gray-300 border-gray-700").split(" ");
  return (
    <div className={`border-l-2 pl-3 ${bc}`}>
      <h3 className={`text-xs font-bold mb-1.5 ${tc}`}>{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
};

const Formula: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="font-mono text-xs bg-gray-800 text-emerald-300 px-2 py-1 rounded border border-gray-700 whitespace-pre-wrap break-all">{children}</div>
);

const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-xs text-gray-500 italic">{children}</div>
);
