// ============================================================
// EV Motor & Controller Physics Engine
// Fully configurable: 3-phase or 6-phase motor + inverter
// Vehicle, motor, and inverter parameters all editable at runtime
// ============================================================

// ─── VEHICLE PARAMETERS (defaults) ──────────────────────────
export const VEHICLE_PARAMS = {
  GVW_kg:           19500,
  tireRadius_m:     0.522,
  FDR:              6.428,
  frictionCoeff:    0.008,
  frontalArea_m2:   7.92,
  dragCoeff:        0.6,
  airDensity_kgm3:  1.225,
  height_m:         3.885,
  width_m:          2.6,
  gravity_ms2:      9.81,
  gradeAngle_deg:   0,
};

// ─── FULL VEHICLE + MOTOR + INVERTER OVERRIDE INTERFACE ─────
export interface VehicleParamsOverride {
  // Vehicle
  gvw_kg:           number;
  tyre_radius_m:    number;
  fdr:              number;
  frictionCoeff:    number;
  frontalArea_m2:   number;
  dragCoeff:        number;
  // Motor
  motor_phases:          number;   // 3 or 6
  motor_polePairs:       number;   // e.g. 4 → 8-pole
  motor_ratedPower_kW:   number;
  motor_peakPower_kW:    number;
  motor_ratedTorque_Nm:  number;
  motor_peakTorque_Nm:   number;
  motor_ratedSpeed_rpm:  number;
  motor_maxSpeed_rpm:    number;
  motor_ratedCurrent_A:  number;
  motor_peakCurrent_A:   number;
  motor_busVoltage_V:    number;
  motor_ratedEff:        number;   // e.g. 0.93
  // Inverter
  inv_phases:            number;   // 3 or 6
  inv_numSwitches:       number;   // auto-derived: phases * 2
  inv_voltageRating_V:   number;
  inv_currentRating_A:   number;
}

// ─── DEFAULT (6-phase city bus) ──────────────────────────────
export const DEFAULT_VEHICLE_OVERRIDE: VehicleParamsOverride = {
  gvw_kg:                19500,
  tyre_radius_m:         0.522,
  fdr:                   6.428,
  frictionCoeff:         0.008,
  frontalArea_m2:        7.92,
  dragCoeff:             0.6,
  motor_phases:          6,
  motor_polePairs:       4,
  motor_ratedPower_kW:   144,
  motor_peakPower_kW:    213,
  motor_ratedTorque_Nm:  1273,
  motor_peakTorque_Nm:   2200,
  motor_ratedSpeed_rpm:  1750,
  motor_maxSpeed_rpm:    3000,
  motor_ratedCurrent_A:  240,
  motor_peakCurrent_A:   460,
  motor_busVoltage_V:    650,
  motor_ratedEff:        0.93,
  inv_phases:            6,
  inv_numSwitches:       12,
  inv_voltageRating_V:   1200,
  inv_currentRating_A:   500,
};

// ─── MOTOR PARAMETERS (static defaults — used as fallback) ───
export const MOTOR_PARAMS = {
  ratedPower_kW:         144,
  peakPower_kW:          213,
  ratedTorque_Nm:        1273,
  peakTorque_Nm:         2200,
  ratedSpeed_rpm:        1750,
  peakSpeed_rpm:         2800,
  maxSpeed_rpm:          3000,
  phases:                6,
  polePairs:             4,
  ratedCurrent_Arms:     240,
  peakCurrent_Arms:      460,
  backEMF_VperKrpm:      401.31,
  maxBackEMF_V:          1324.34,
  busVoltage_V:          650,
  ratedEfficiency:       0.93,
  statorResistance_ohm:  0.012,
  ironLossCoeff:         0.00015,
  torqueConstant_NmPerA: 0.425532,
};

// ─── INVERTER PARAMETERS (static defaults — used as fallback) ─
export const IGBT_PARAMS = {
  voltageRating_V:  1200,
  currentRating_A:  500,
  Vce_sat:          1.75,
  Vf_diode:         1.4,
  Eon_mJ:           35,
  Eoff_mJ:          20,
  Err_mJ:           15,
  switchingFreq_Hz: 12000,
  numModules:       6,
};

// ─── MOTOR BOUNDARY CURVES ───────────────────────────────────
export const PEAK_TORQUE_CURVE: [number, number][] = [
  [0.1,    3216.3],
  [100,    3255.8],
  [213.3,  3249.5],
  [490.4,  3240.0],
  [764.5,  2940.1],
  [1084.6, 1971.9],
  [1407.0, 1468.9],
  [1724.8, 1169.3],
  [2044.8,  970.3],
  [2362.3,  827.5],
  [2680.5,  720.2],
  [2997.7,  635.8],
];

export const CONTINUOUS_TORQUE_CURVE: [number, number][] = [
  [225.1,  1064.9],
  [791.5,  1053.0],
  [1357.5,  960.1],
  [1592.0,  833.7],
  [1825.6,  731.1],
  [2060.6,  640.5],
  [2295.6,  566.0],
  [2529.1,  497.4],
  [2764.7,  428.6],
  [2999.4,  370.9],
];

// ─── INTERPOLATION ───────────────────────────────────────────
export function interpolate(curve: [number, number][], x: number): number {
  if (curve.length === 0) return 0;
  if (x <= curve[0][0]) return curve[0][1];
  if (x >= curve[curve.length - 1][0]) return curve[curve.length - 1][1];
  for (let i = 0; i < curve.length - 1; i++) {
    if (x >= curve[i][0] && x <= curve[i + 1][0]) {
      const t = (x - curve[i][0]) / (curve[i + 1][0] - curve[i][0]);
      return curve[i][1] + t * (curve[i + 1][1] - curve[i][1]);
    }
  }
  return curve[curve.length - 1][1];
}

export function interpolateLinear(curve: [number, number][], x: number): number {
  return interpolate(curve, x);
}

// ─── ACCELERATION FORMULA ────────────────────────────────────
// acc = MIN(0.8, (nextSpeed_kmh - currentSpeed_kmh) * (5/18))
export const MAX_ACCELERATION_MS2 = 0.8;

export function computeAcceleration(points: DriveCyclePoint[], i: number): number {
  let rawAcc: number;
  if (i < points.length - 1) {
    const dt = points[i + 1].time_s - points[i].time_s;
    if (dt <= 0) return 0;
    rawAcc = (points[i + 1].speed_kmh - points[i].speed_kmh) * (5 / 18) / dt;
  } else {
    const dt = points[i].time_s - points[i - 1].time_s;
    if (dt <= 0) return 0;
    rawAcc = (points[i].speed_kmh - points[i - 1].speed_kmh) * (5 / 18) / dt;
  }
  return rawAcc > 0
    ? Math.min(MAX_ACCELERATION_MS2, rawAcc)
    : Math.max(-MAX_ACCELERATION_MS2, rawAcc);
}

// ─── MOTOR RPM FROM VEHICLE SPEED ───────────────────────────
export function speedToMotorRPM(
  speed_kmh: number,
  vp?: VehicleParamsOverride
): number {
  const tireRadius = vp?.tyre_radius_m ?? VEHICLE_PARAMS.tireRadius_m;
  const fdr        = vp?.fdr           ?? VEHICLE_PARAMS.FDR;
  const speed_ms   = speed_kmh / 3.6;
  const wheelRPM   = (speed_ms / (2 * Math.PI * tireRadius)) * 60;
  return wheelRPM * fdr;
}

// ─── FORCES ON VEHICLE ───────────────────────────────────────
export function calculateForces(
  speed_kmh: number,
  acceleration_ms2: number,
  grade_deg: number = 0,
  vp?: VehicleParamsOverride
) {
  const GVW_kg         = vp?.gvw_kg         ?? VEHICLE_PARAMS.GVW_kg;
  const frictionCoeff  = vp?.frictionCoeff  ?? VEHICLE_PARAMS.frictionCoeff;
  const frontalArea_m2 = vp?.frontalArea_m2 ?? VEHICLE_PARAMS.frontalArea_m2;
  const dragCoeff      = vp?.dragCoeff      ?? VEHICLE_PARAMS.dragCoeff;
  const airDensity     = VEHICLE_PARAMS.airDensity_kgm3;
  const gravity_ms2    = VEHICLE_PARAMS.gravity_ms2;

  const speed_ms = speed_kmh / 3.6;
  const gradeRad = (grade_deg * Math.PI) / 180;

  const F_inertia = GVW_kg * acceleration_ms2;
  const F_rolling = GVW_kg * gravity_ms2 * frictionCoeff * Math.cos(gradeRad);
  const F_drag    = 0.5 * airDensity * dragCoeff * frontalArea_m2 * speed_ms * speed_ms;
  const F_grade   = GVW_kg * gravity_ms2 * Math.sin(gradeRad);
  const F_total   = F_inertia + F_rolling + F_drag + F_grade;

  return { F_inertia, F_rolling, F_drag, F_grade, F_total };
}

// ─── TORQUES ─────────────────────────────────────────────────
export function calculateTorques(F_total_N: number, vp?: VehicleParamsOverride) {
  const tireRadius     = vp?.tyre_radius_m ?? VEHICLE_PARAMS.tireRadius_m;
  const fdr            = vp?.fdr           ?? VEHICLE_PARAMS.FDR;
  const wheelTorque_Nm = F_total_N * tireRadius;
  const motorTorque_Nm = wheelTorque_Nm / fdr;
  return { wheelTorque_Nm, motorTorque_Nm };
}

// ─── CLAMP TORQUE TO MOTOR PEAK ──────────────────────────────
export function clampTorque(
  motorTorque_Nm: number,
  motorRPM: number,
  vp?: VehicleParamsOverride
): number {
  // Scale the peak torque curve by the user's peak torque setting
  const userPeakTorque  = vp?.motor_peakTorque_Nm ?? MOTOR_PARAMS.peakTorque_Nm;
  const defaultPeakTorque = MOTOR_PARAMS.peakTorque_Nm;
  const scale            = userPeakTorque / defaultPeakTorque;
  // Also scale RPM axis by max speed ratio
  const userMaxRPM       = vp?.motor_maxSpeed_rpm ?? MOTOR_PARAMS.maxSpeed_rpm;
  const defaultMaxRPM    = MOTOR_PARAMS.maxSpeed_rpm;
  const rpmScale         = defaultMaxRPM / userMaxRPM;

  const peakLimit = interpolateLinear(PEAK_TORQUE_CURVE, motorRPM * rpmScale) * scale;
  const clamped   = Math.min(Math.abs(motorTorque_Nm), peakLimit);
  return motorTorque_Nm >= 0 ? clamped : -clamped;
}

// ─── FORMULA OVERRIDES ───────────────────────────────────────
export interface FormulaOverrides {
  region1_powerLimit_kW:      number;
  region1_rpmLimit:           number;
  region1_torqueDivisor:      number;
  region1_sqrtFactor:         number;
  region1_pf:                 number;  // Power < limit AND rpm < limit
  region2_multiplier:         number;  // Power > limit AND rpm > limit  → power_kW * mult
  region3_multiplier:         number;  // Power < limit AND rpm > limit  → power_kW * mult
  region4a_pf:                number;  // Power > limit AND rpm < limit AND torque > threshold
  region4b_pf:                number;  // Power > limit AND rpm < limit AND torque ≤ threshold
  region4_torqueThreshold_Nm: number;
  region2_pf:                 number;  // kept for IGBT loss calcs
  region2_phases:             number;  // kept for IGBT loss calcs
  igbt_Vce_sat:               number;
  igbt_Vf_diode:              number;
  igbt_Eon_mJ:                number;
  igbt_Eoff_mJ:               number;
  igbt_Err_mJ:                number;
  igbt_fsw_Hz:                number;
  motor_statorR_ohm:          number;
  motor_ironLossCoeff:        number;
  motor_mechLossCoeff:        number;
}

export const DEFAULT_FORMULA_OVERRIDES: FormulaOverrides = {
  region1_powerLimit_kW:      144,
  region1_rpmLimit:           1600,
  region1_torqueDivisor:      4.7,
  region1_sqrtFactor:         1.414,
  region1_pf:                 0.84,
  region2_multiplier:         0.63,
  region3_multiplier:         1.05,
  region4a_pf:                0.725,
  region4b_pf:                0.9,
  region4_torqueThreshold_Nm: 1250,
  region2_pf:                 0.92,
  region2_phases:             3,
  igbt_Vce_sat:               1.75,
  igbt_Vf_diode:              1.4,
  igbt_Eon_mJ:                35,
  igbt_Eoff_mJ:               20,
  igbt_Err_mJ:                15,
  igbt_fsw_Hz:                12000,
  motor_statorR_ohm:          0.012,
  motor_ironLossCoeff:        0.00015,
  motor_mechLossCoeff:        0.00008,
};

// ─── MOTOR CURRENT ───────────────────────────────────────────
// Four regions (H = torque column):
//  Region 1: Power < limit  AND  rpm < limit  →  ((H/div)/√2) × PF
//  Region 2: Power > limit  AND  rpm > limit  →  power_kW × multiplier
//  Region 3: Power < limit  AND  rpm > limit  →  power_kW × multiplier
//  Region 4: Power > limit  AND  rpm < limit  →  split by torque threshold
//    4a: torque > threshold  →  ((H/div)/√2) × 0.725
//    4b: torque ≤ threshold  →  ((H/div)/√2) × 0.9
//
export function calculateMotorCurrent(
  motorTorque_Nm: number,
  motorRPM: number,
  motorPower_kW: number,
  fo?: FormulaOverrides,
  vp?: VehicleParamsOverride
): number {
  const absTorque = Math.abs(motorTorque_Nm);
  const absPower  = Math.abs(motorPower_kW);

  const powerLimit    = fo?.region1_powerLimit_kW      ?? 144;
  const rpmLimit      = fo?.region1_rpmLimit           ?? 1600;
  const torqueDivisor = fo?.region1_torqueDivisor      ?? 4.7;
  const sqrtFactor    = fo?.region1_sqrtFactor         ?? 1.414;
  const torqueBase    = (absTorque / torqueDivisor) / sqrtFactor;

  const peakCurrent = vp?.motor_peakCurrent_A ?? MOTOR_PARAMS.peakCurrent_Arms;

  const lowPower = absPower  < powerLimit;
  const lowRPM   = motorRPM < rpmLimit;

  if (lowPower && lowRPM) {
    const pf = fo?.region1_pf ?? 0.84;
    return torqueBase * pf;
  }

  if (!lowPower && !lowRPM) {
    const mult = fo?.region2_multiplier ?? 0.63;
    return Math.min(absPower * mult, peakCurrent);
  }

  if (lowPower && !lowRPM) {
    const mult = fo?.region3_multiplier ?? 1.05;
    return Math.min(absPower * mult, peakCurrent);
  }

  // Region 4: Power > limit AND rpm < limit
  const torqueThreshold = fo?.region4_torqueThreshold_Nm ?? 1250;
  if (absTorque > torqueThreshold) {
    const pf = fo?.region4a_pf ?? 0.725;
    return torqueBase * pf;
  } else {
    const pf = fo?.region4b_pf ?? 0.9;
    return torqueBase * pf;
  }
}

// ─── MOTOR EFFICIENCY ────────────────────────────────────────
export function getMotorEfficiency(
  torque_Nm: number,
  rpm: number,
  vp?: VehicleParamsOverride
): number {
  const absTorque   = Math.abs(torque_Nm);
  const maxRPM      = vp?.motor_maxSpeed_rpm  ?? MOTOR_PARAMS.maxSpeed_rpm;
  const peakTorque  = vp?.motor_peakTorque_Nm ?? MOTOR_PARAMS.peakTorque_Nm;
  if (rpm < 1 || absTorque < 1) return 0;

  const rpmN   = rpm       / maxRPM;
  const torqueN= absTorque / peakTorque;

  const rpm_peak = 900  / maxRPM;
  const T_peak   = 540  / peakTorque;

  const dRPM = (rpmN - rpm_peak) / 0.4;
  const dT   = (torqueN - T_peak) / 0.5;
  const dist = Math.sqrt(dRPM * dRPM + dT * dT);

  const eta_base  = 0.945 * Math.exp(-0.8 * dist * dist);
  const eta_floor = 0.60
    + 0.30 * Math.min(1, torqueN * 2) * Math.min(1, rpmN * 4);

  return Math.min(0.951, Math.max(eta_floor, eta_base));
}

// ─── MOTOR LOSSES ────────────────────────────────────────────
export function calculateMotorLosses(
  motorTorque_Nm: number,
  motorRPM: number,
  current_Arms: number,
  fo: FormulaOverrides,
  vp?: VehicleParamsOverride
) {
  const absTorque         = Math.abs(motorTorque_Nm);
  const omega_rads        = (motorRPM * 2 * Math.PI) / 60;
  const mechanicalPower_W = absTorque * omega_rads;
  const phases            = vp?.motor_phases ?? 6;

  // Copper loss scales with number of phases
  const copperLoss_W = phases * current_Arms * current_Arms * fo.motor_statorR_ohm;
  const ironLoss_W   = fo.motor_ironLossCoeff
    * Math.pow(motorRPM, 1.5)
    * Math.pow(absTorque + 1, 0.5);
  const mechLoss_W   = fo.motor_mechLossCoeff * Math.pow(motorRPM, 2);

  const totalMotorLoss_W = copperLoss_W + ironLoss_W + mechLoss_W;
  const inputPower_W     = mechanicalPower_W + totalMotorLoss_W;
  const efficiency       = inputPower_W > 0
    ? (mechanicalPower_W / inputPower_W) * 100
    : 0;

  return {
    copperLoss_W,
    ironLoss_W,
    mechLoss_W,
    totalMotorLoss_W,
    mechanicalPower_W,
    inputPower_W,
    efficiency: Math.min(efficiency, 99),
  };
}

// ─── INVERTER LOSSES ─────────────────────────────────────────
export function calculateInverterLosses(
  current_Arms: number,
  _motorRPM: number,
  dcVoltage_V: number,
  fo: FormulaOverrides,
  vp?: VehicleParamsOverride
) {
  // Number of switches = inv_phases × 2 (each leg has high + low switch)
  const invPhases   = vp?.inv_phases     ?? 6;
  const numSwitches = invPhases * 2;      // 6-ph → 12, 3-ph → 6
  const numDiodes   = numSwitches;
  const I_peak      = current_Arms * Math.sqrt(2);
  const D           = 0.5;

  const igbtConductionLoss_W  = numSwitches * fo.igbt_Vce_sat  * current_Arms * D;
  const diodeConductionLoss_W = numDiodes   * fo.igbt_Vf_diode * current_Arms * (1 - D);

  const voltageScale     = dcVoltage_V / 600;
  const currentScale     = I_peak / 300;
  const E_sw_J           = (fo.igbt_Eon_mJ + fo.igbt_Eoff_mJ + fo.igbt_Err_mJ) * 0.001;
  const igbtSwitchLoss_W = numSwitches * E_sw_J * fo.igbt_fsw_Hz
    * voltageScale * currentScale;

  const gateDriverLoss_W = invPhases * 3.33;  // ~20W for 6-ph, ~10W for 3-ph
  const busbarResistance = 0.0005;
  const busbarLoss_W     = current_Arms * current_Arms * busbarResistance * invPhases;

  const totalInverterLoss_W =
    igbtConductionLoss_W +
    diodeConductionLoss_W +
    igbtSwitchLoss_W +
    gateDriverLoss_W +
    busbarLoss_W;

  const sqrtPhases = Math.sqrt(invPhases);
  const inputPowerToInverter_W =
    Math.abs(current_Arms) * dcVoltage_V * sqrtPhases * 0.95;

  return {
    igbtConductionLoss_W,
    diodeConductionLoss_W,
    igbtSwitchLoss_W,
    gateDriverLoss_W,
    busbarLoss_W,
    totalInverterLoss_W,
    inputPowerToInverter_W,
    efficiency: inputPowerToInverter_W > 0
      ? ((inputPowerToInverter_W - totalInverterLoss_W) / inputPowerToInverter_W) * 100
      : 0,
  };
}

// ─── DATA TYPES ──────────────────────────────────────────────
export interface DriveCyclePoint {
  time_s:    number;
  speed_kmh: number;
}

export interface AnalysisPoint {
  time_s:               number;
  speed_kmh:            number;
  acceleration_ms2:     number;
  motorRPM:             number;
  wheelTorque_Nm:       number;
  motorTorque_Nm:       number;
  motorPower_kW:        number;
  current_Arms:         number;
  F_inertia_N:          number;
  F_rolling_N:          number;
  F_drag_N:             number;
  F_total_N:            number;
  copperLoss_W:         number;
  ironLoss_W:           number;
  mechLoss_W:           number;
  totalMotorLoss_W:     number;
  motorEfficiency:      number;
  igbtConductionLoss_W:  number;
  diodeConductionLoss_W: number;
  igbtSwitchLoss_W:      number;
  totalInverterLoss_W:   number;
  inverterEfficiency:    number;
  totalSystemLoss_W:     number;
  systemEfficiency:      number;
  energyMotorLoss_Wh:    number;
  energyInverterLoss_Wh: number;
  energyTraction_Wh:     number;
}

// ─── MAIN ANALYSIS FUNCTION ──────────────────────────────────
export function analyzeDriveCycle(
  points: DriveCyclePoint[],
  fo: FormulaOverrides,
  grade_deg: number = 0,
  vp?: VehicleParamsOverride
): AnalysisPoint[] {
  const results: AnalysisPoint[] = [];
  let cumMotorLoss_Wh    = 0;
  let cumInverterLoss_Wh = 0;
  let cumTraction_Wh     = 0;

  const busVoltage = vp?.motor_busVoltage_V ?? MOTOR_PARAMS.busVoltage_V;

  for (let i = 0; i < points.length; i++) {
    const pt     = points[i];
    const prevPt = i > 0 ? points[i - 1] : pt;
    const dt     = i > 0 ? pt.time_s - prevPt.time_s : 0;

    const acceleration_ms2 = computeAcceleration(points, i);

    const motorRPM = Math.max(0, speedToMotorRPM(pt.speed_kmh, vp));

    const forces = calculateForces(pt.speed_kmh, acceleration_ms2, grade_deg, vp);

    const { wheelTorque_Nm, motorTorque_Nm: rawMotorTorque } =
      calculateTorques(forces.F_total, vp);

    const motorTorque_Nm = clampTorque(rawMotorTorque, motorRPM, vp);

    const omega         = (motorRPM * 2 * Math.PI) / 60;
    const motorPower_kW = (motorTorque_Nm * omega) / 1000;

    const current_Arms = calculateMotorCurrent(
      motorTorque_Nm, motorRPM, motorPower_kW, fo, vp
    );

    const motorLosses = calculateMotorLosses(
      motorTorque_Nm, motorRPM, current_Arms, fo, vp
    );

    const invLosses = calculateInverterLosses(
      current_Arms, motorRPM, busVoltage, fo, vp
    );

    if (dt > 0 && motorTorque_Nm > 0) {
      cumMotorLoss_Wh    += (motorLosses.totalMotorLoss_W  * dt) / 3600;
      cumInverterLoss_Wh += (invLosses.totalInverterLoss_W * dt) / 3600;
      cumTraction_Wh     += (motorLosses.mechanicalPower_W * dt) / 3600;
    }

    const totalSystemLoss_W = motorLosses.totalMotorLoss_W + invLosses.totalInverterLoss_W;
    const inputToSystem     = motorLosses.inputPower_W + invLosses.totalInverterLoss_W;
    const systemEfficiency  = inputToSystem > 0
      ? ((inputToSystem - totalSystemLoss_W) / inputToSystem) * 100
      : 0;

    results.push({
      time_s:            pt.time_s,
      speed_kmh:         pt.speed_kmh,
      acceleration_ms2,
      motorRPM,
      wheelTorque_Nm,
      motorTorque_Nm,
      motorPower_kW,
      current_Arms,
      F_inertia_N:       forces.F_inertia,
      F_rolling_N:       forces.F_rolling,
      F_drag_N:          forces.F_drag,
      F_total_N:         forces.F_total,
      copperLoss_W:      motorLosses.copperLoss_W,
      ironLoss_W:        motorLosses.ironLoss_W,
      mechLoss_W:        motorLosses.mechLoss_W,
      totalMotorLoss_W:  motorLosses.totalMotorLoss_W,
      motorEfficiency:   motorLosses.efficiency,
      igbtConductionLoss_W:  invLosses.igbtConductionLoss_W,
      diodeConductionLoss_W: invLosses.diodeConductionLoss_W,
      igbtSwitchLoss_W:  invLosses.igbtSwitchLoss_W,
      totalInverterLoss_W:   invLosses.totalInverterLoss_W,
      inverterEfficiency:    invLosses.efficiency,
      totalSystemLoss_W,
      systemEfficiency,
      energyMotorLoss_Wh:    cumMotorLoss_Wh,
      energyInverterLoss_Wh: cumInverterLoss_Wh,
      energyTraction_Wh:     cumTraction_Wh,
    });
  }

  return results;
}

// ─── PREDEFINED DRIVE CYCLES ─────────────────────────────────
export const PREDEFINED_CYCLES: Record<string, DriveCyclePoint[]> = {
  "Custom":               [],
  "WLTC Class 3 (Urban)": generateWLTC_Urban(),
  "City Bus Cycle":       generateCityBus(),
  "Highway Cruise 80kmh": generateHighway(80),
  "Indian Bus Cycle":     generateIndianBus(),
};

function generateWLTC_Urban(): DriveCyclePoint[] {
  const pts: DriveCyclePoint[] = [];
  const profile = [
    [0,0],[10,15],[20,25],[30,25],[40,15],[50,0],
    [60,0],[70,20],[80,35],[90,40],[100,40],[110,35],
    [120,20],[130,0],[140,0],[150,25],[160,35],[170,45],
    [180,50],[190,50],[200,45],[210,35],[220,20],[230,0],
    [240,10],[260,30],[270,45],[280,50],[300,50],[310,40],
    [320,25],[330,0],
  ];
  profile.forEach(([t, s]) => pts.push({ time_s: t, speed_kmh: s }));
  return pts;
}

function generateCityBus(): DriveCyclePoint[] {
  const pts: DriveCyclePoint[] = [];
  const profile = [
    [0,0],[15,20],[30,40],[50,40],[65,20],[75,0],
    [90,0],[105,25],[120,45],[140,45],[155,30],[165,0],
    [180,0],[195,20],[210,40],[230,50],[260,50],[275,35],
    [285,10],[295,0],[310,0],[325,20],[340,40],[360,40],
    [375,20],[385,0],
  ];
  profile.forEach(([t, s]) => pts.push({ time_s: t, speed_kmh: s }));
  return pts;
}

function generateHighway(targetSpeed: number): DriveCyclePoint[] {
  const pts: DriveCyclePoint[] = [];
  for (let t = 0; t <= 600; t += 10) {
    let speed = targetSpeed;
    if (t < 60)  speed = (t / 60) * targetSpeed;
    if (t > 540) speed = ((600 - t) / 60) * targetSpeed;
    pts.push({ time_s: t, speed_kmh: speed });
  }
  return pts;
}

function generateIndianBus(): DriveCyclePoint[] {
  const pts: DriveCyclePoint[] = [];
  const profile = [
    [0,0],[20,15],[35,30],[55,30],[70,15],[80,0],
    [95,0],[110,20],[125,35],[145,35],[160,20],[170,0],
    [185,0],[200,18],[215,32],[235,40],[260,40],[275,30],
    [285,15],[295,0],[310,0],[325,22],[340,38],[360,42],
    [380,42],[395,28],[405,10],[415,0],[430,0],
    [445,20],[460,35],[480,35],[495,20],[505,0],
  ];
  profile.forEach(([t, s]) => pts.push({ time_s: t, speed_kmh: s }));
  return pts;
}
