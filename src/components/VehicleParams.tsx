import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface VehicleParamsProps {
  gvw_kg: number; fdr: number; tyre_radius_m: number; tyre_size_label: string;
  motorPhases: number; motorPolePairs: number;
  motorRatedPower_kW: number; motorPeakPower_kW: number;
  motorRatedTorque_Nm: number; motorPeakTorque_Nm: number;
  motorRatedSpeed_rpm: number; motorMaxSpeed_rpm: number;
  motorRatedCurrent_A: number; motorPeakCurrent_A: number;
  motorBusVoltage_V: number;
  invPhases: number; invNumSwitches: number;
  invVoltageRating_V: number; invCurrentRating_A: number;
  frictionCoeff: number; frontalArea_m2: number; dragCoeff: number;
}

export const VehicleParams: React.FC<VehicleParamsProps> = (props) => {
  const { gvw_kg, fdr, tyre_radius_m, motorPhases, motorPolePairs,
    motorRatedPower_kW, motorPeakPower_kW, motorRatedTorque_Nm,
    motorPeakTorque_Nm, motorRatedSpeed_rpm, motorMaxSpeed_rpm,
    motorRatedCurrent_A, motorPeakCurrent_A, motorBusVoltage_V,
    invPhases, invNumSwitches, invVoltageRating_V, invCurrentRating_A,
    frictionCoeff, frontalArea_m2, dragCoeff } = props;

  const [open, setOpen] = useState(false);
  const tireCircumference_m = 2 * Math.PI * tyre_radius_m;
  const rpmAt60kmh = ((60 / 3.6 / tireCircumference_m) * 60 * fdr).toFixed(1);
  const speedAt1000rpm = ((1000 / fdr / 60) * tireCircumference_m * 3.6).toFixed(2);
  const rollingForce_N = (gvw_kg * 9.81 * frictionCoeff).toFixed(1);

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
      <button className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 hover:bg-gray-750 transition" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold text-sm">📋 Full System Specifications</span>
          <span className="text-xs bg-blue-900 text-blue-300 border border-blue-700 px-2 py-0.5 rounded-full">{motorPhases}-Ph Motor</span>
          <span className="text-xs bg-purple-900 text-purple-300 border border-purple-700 px-2 py-0.5 rounded-full">{invPhases}-Ph Inverter</span>
          <span className="text-xs bg-orange-900 text-orange-300 border border-orange-700 px-2 py-0.5 rounded-full">GVW: {gvw_kg.toLocaleString()}kg</span>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {open && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">

          {/* Vehicle */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <h3 className="text-yellow-400 font-semibold mb-2">🚌 Vehicle</h3>
            <div className="space-y-1.5 text-gray-300">
              <Param label="GVW" value={`${gvw_kg.toLocaleString()} kg`} highlight />
              <Param label="FDR" value={fdr.toString()} highlight />
              <Param label="Tyre Radius" value={`${tyre_radius_m} m`} highlight />
              <Param label="Tyre Circumference" value={`${tireCircumference_m.toFixed(4)} m`} />
              <Param label="Rolling Coeff" value={frictionCoeff.toString()} highlight />
              <Param label="Frontal Area" value={`${frontalArea_m2} m²`} highlight />
              <Param label="Drag Coeff (Cd)" value={dragCoeff.toString()} highlight />
            </div>
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-yellow-400 font-semibold mb-1.5">📐 Live Derived:</p>
              <div className="space-y-1.5">
                <Param label="Speed @ 1000 RPM" value={`${speedAt1000rpm} km/h`} highlight />
                <Param label="Motor RPM @ 60 km/h" value={`${rpmAt60kmh} RPM`} highlight />
                <Param label="Rolling Resistance" value={`${rollingForce_N} N`} highlight />
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-700">
              {[20, 40, 60, 80].map(spd => {
                const rpm = ((spd / 3.6 / tireCircumference_m) * 60 * fdr).toFixed(0);
                return (
                  <div key={spd} className="flex justify-between">
                    <span className="text-gray-400">{spd} km/h</span>
                    <span className="text-emerald-300 font-mono">{rpm} RPM</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Motor */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <h3 className="text-blue-400 font-semibold mb-2">⚡ Motor ({motorPhases}-Phase PMSM)</h3>
            <div className="space-y-1.5 text-gray-300">
              <Param label="Phase Config" value={`${motorPhases}-Phase`} highlight />
              <Param label="Pole Pairs" value={`${motorPolePairs} (${motorPolePairs * 2}-pole)`} highlight />
              <Param label="Rated Power" value={`${motorRatedPower_kW} kW`} highlight />
              <Param label="Peak Power" value={`${motorPeakPower_kW} kW`} />
              <Param label="Rated Torque" value={`${motorRatedTorque_Nm.toLocaleString()} Nm`} highlight />
              <Param label="Peak Torque" value={`${motorPeakTorque_Nm.toLocaleString()} Nm`} />
              <Param label="Rated Speed" value={`${motorRatedSpeed_rpm.toLocaleString()} RPM`} />
              <Param label="Max Speed" value={`${motorMaxSpeed_rpm.toLocaleString()} RPM`} />
              <Param label="Rated Current" value={`${motorRatedCurrent_A} Arms`} highlight />
              <Param label="Peak Current" value={`${motorPeakCurrent_A} Arms`} />
              <Param label="DC Bus Voltage" value={`${motorBusVoltage_V} V`} highlight />
            </div>
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-blue-400 font-semibold mb-1">📐 RPM Formula:</p>
              <div className="bg-gray-900 rounded p-2 font-mono text-xs text-emerald-300 space-y-1">
                <div>RPM = (V_kmh/3.6)</div>
                <div className="text-gray-500">{'     '}/ (2π × {tyre_radius_m})</div>
                <div className="text-gray-500">{'     '}× 60 × {fdr}</div>
                <div className="border-t border-gray-700 pt-1 text-yellow-300">@60km/h → {rpmAt60kmh} RPM ✓</div>
              </div>
            </div>
          </div>

          {/* Inverter */}
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
            <h3 className="text-orange-400 font-semibold mb-2">🔧 Inverter ({invPhases}-Phase)</h3>
            <div className="space-y-1.5 text-gray-300">
              <Param label="Phase Config" value={`${invPhases}-Phase`} highlight />
              <Param label="Topology" value={`${invNumSwitches} IGBT switches`} highlight />
              <Param label="Half-bridges" value={`${invPhases} legs`} />
              <Param label="Voltage Rating" value={`${invVoltageRating_V} V`} highlight />
              <Param label="Current Rating" value={`${invCurrentRating_A} A`} highlight />
            </div>
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-orange-400 font-semibold mb-1">ℹ️ Configuration:</p>
              <div className="text-gray-400 text-xs leading-relaxed">
                {invPhases === 6
                  ? "Dual 3-phase topology: two independent 3-phase bridges sharing the DC bus. Provides 30° phase shift reducing harmonic current. Fault tolerant — can continue at reduced power with one bridge."
                  : "Single 3-phase bridge. Standard VSI topology with 6 IGBT switches. Lower cost and simpler gate drive."}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-orange-400 font-semibold mb-1">📐 Loss Switches:</p>
              <div className="text-gray-400 text-xs">
                Conduction: {invNumSwitches} IGBTs + {invNumSwitches} diodes<br/>
                Switching: {invNumSwitches} switches × Eon/Eoff × Fsw
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Param: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-400">{label}</span>
    <span className={`font-medium ${highlight ? "text-yellow-300" : "text-gray-100"}`}>{value}</span>
  </div>
);
