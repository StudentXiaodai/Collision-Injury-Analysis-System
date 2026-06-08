import { RestraintConfig } from "../types";

export interface SolverParams {
  m_head: number;
  m_thorax: number;
  m_pelvis: number;
  k_belt: number;
  c_belt: number;
  s_belt: number;
  k_airbag: number;
  c_airbag: number;
  g_airbag: number;
  n: number;
  k_chest_eff: number;
  k_neck_ax: number;
  c_neck_ax: number;
  k_neck_rot: number;
  c_neck_rot: number;
  L_neck: number;
  k_femur_left: number;
  k_femur_right: number;
  g_knee_left: number;
  g_knee_right: number;
  k_rib_lat: number;
  c_rib_lat: number;
  gap_thorax: number;
  k_abd_lat: number;
  c_abd_lat: number;
  gap_abdomen: number;
  k_pelvis_lat: number;
  c_pelvis_lat: number;
  gap_pelvis: number;
}

// Solid baseline presets in case file read is not used or fails
export const DEFAULT_SOLVER_PARAMS: SolverParams = {
  m_head: 4.5,
  m_thorax: 22.0,
  m_pelvis: 18.0,
  k_belt: 18000,
  c_belt: 1800,
  s_belt: 0.03,
  k_airbag: 22000,
  c_airbag: 1200,
  g_airbag: 0.09,
  n: 1.4,
  k_chest_eff: 95000,
  k_neck_ax: 50000,
  c_neck_ax: 1800,
  k_neck_rot: 220,
  c_neck_rot: 18,
  L_neck: 0.12,
  k_femur_left: 70000,
  k_femur_right: 70000,
  g_knee_left: 0.06,
  g_knee_right: 0.06,
  k_rib_lat: 12000,
  c_rib_lat: 800,
  gap_thorax: 0.05,
  k_abd_lat: 8000,
  c_abd_lat: 600,
  gap_abdomen: 0.04,
  k_pelvis_lat: 15000,
  c_pelvis_lat: 1000,
  gap_pelvis: 0.03,
};

export interface FrontalSolverOutput {
  timeS: number[];
  headRelX: number[];
  headAccelAbsG: number[];
  thoraxRelX: number[];
  thoraxAccelAbsG: number[];
  pelvisRelX: number[];
  pelvisAccelAbsG: number[];
  chestDeflectionM: number[];
  neckFzN: number[];
  neckMyNm: number[];
  femurLeftN: number[];
  femurRightN: number[];
}

export interface SideSolverOutput {
  timeS: number[];
  ribDeflectionM: number[];
  abdomenForceN: number[];
  pubicForceN: number[];
  confidence: {
    side_chest: "low" | "medium" | "high";
    abdomen: "low" | "medium" | "high";
    pelvis: "low" | "medium" | "high";
  };
  warnings: string[];
}

/**
 * Solves Frontal Proxy Biomechanics
 */
export function solveFrontalProxy(
  timeS: number[],
  accelMps2: number[], // Vehicle deceleration (should be negative values or absolute values)
  restraint: RestraintConfig,
  params: SolverParams = DEFAULT_SOLVER_PARAMS
): FrontalSolverOutput {
  const n = timeS.length;
  const numSteps = n;

  // Let's ensure the sign of vehicle acceleration is formatted as a positive load
  // Crash pulse is usually specified positive (e.g. 20g deceleration) or negative.
  // We'll work under positive vehicle deceleration pulse.
  const a_vehicle = accelMps2.map(Math.abs);

  // Solves state variables over time
  const headRelX = new Array(numSteps).fill(0);
  const headRelV = new Array(numSteps).fill(0);
  const headAccelAbsG = new Array(numSteps).fill(0);

  const thoraxRelX = new Array(numSteps).fill(0);
  const thoraxRelV = new Array(numSteps).fill(0);
  const thoraxAccelAbsG = new Array(numSteps).fill(0);

  const pelvisRelX = new Array(numSteps).fill(0);
  const pelvisRelV = new Array(numSteps).fill(0);
  const pelvisAccelAbsG = new Array(numSteps).fill(0);

  const chestDeflectionM = new Array(numSteps).fill(0);
  const neckFzN = new Array(numSteps).fill(0);
  const neckMyNm = new Array(numSteps).fill(0);
  const femurLeftN = new Array(numSteps).fill(0);
  const femurRightN = new Array(numSteps).fill(0);

  // ODE numerical solving coefficients (Euler method)
  let x_th = 0, v_th = 0;
  let x_hd = 0, v_hd = 0;
  let x_pl = 0, v_pl = 0;

  const belted = restraint.belted;
  const airbag = restraint.frontal_airbag_deployed !== false; // defaults to true if omitted but belted
  const load_limiter = restraint.load_limiter_kN ? restraint.load_limiter_kN * 1000 : 4000; // default 4 kN limit
  const pretensioner = restraint.pretensioner !== false; // 预紧器默认开启，减少安全带初始松弛
  const seatPos = restraint.seat_track_position || "mid"; // 座椅位置：front/mid/rear

  // 根据座椅位置调整乘员与转向管柱/仪表板的初始间隙
  // 前置座椅：乘员更靠近前方，间隙较小
  // 中置座椅：标准间隙
  // 后置座椅：乘员远离前方，间隙较大
  const seatOffsetMap = { front: -0.05, mid: 0.0, rear: 0.05 };
  const seatOffset = seatOffsetMap[seatPos as keyof typeof seatOffsetMap] || 0;

  for (let i = 1; i < numSteps; i++) {
    const dt = timeS[i] - timeS[i - 1];
    if (dt <= 0) continue;

    const av = a_vehicle[i];

    // 1. Thorax dynamics
    let F_belt = 0;
    if (belted) {
      // 预紧器效果：减少安全带初始松弛量（s_belt 从 0.03m 降低到 0.01m）
      const effectiveSlack = pretensioner ? params.s_belt * 0.33 : params.s_belt;
      const delta_belt = Math.max(0, x_th - effectiveSlack);
      F_belt = params.k_belt * delta_belt + (delta_belt > 0 ? params.c_belt * v_th : 0);
      F_belt = Math.min(F_belt, load_limiter);
    } else {
      // Unbelted occupant travels forward and contacts car interiors
      // 座椅位置影响未系安全带时乘员与内饰的接触距离
      const interiorContactDist = 0.40 + seatOffset; // 前置更近(0.35m)，后置更远(0.45m)
      const delta_interior = Math.max(0, x_th - interiorContactDist);
      F_belt = params.k_belt * 5.0 * delta_interior + (delta_interior > 0 ? params.c_belt * 2.0 * v_th : 0);
    }

    const a_th_rel = av - F_belt / params.m_thorax;
    v_th += a_th_rel * dt;
    x_th += v_th * dt;

    thoraxRelX[i] = x_th;
    thoraxRelV[i] = v_th;
    thoraxAccelAbsG[i] = Math.max(0, Math.abs(F_belt / params.m_thorax / 9.80665));

    // Dynamic chest deflection is driven by safety belt loading
    chestDeflectionM[i] = F_belt / params.k_chest_eff;

    // 2. Head dynamics
    let F_airbag = 0;
    if (airbag) {
      // 座椅位置影响气囊引爆后与头部的接触间隙
      const effectiveAirbagGap = params.g_airbag + seatOffset * 0.5; // 座椅位置对气囊间隙的影响减半
      const delta_bag = Math.max(0, x_hd - effectiveAirbagGap);
      F_airbag = params.k_airbag * Math.pow(delta_bag, params.n) + (delta_bag > 0 ? params.c_airbag * v_hd : 0);
    } else {
      // Unshielded head hits windshield structure after 50cm
      // 座椅位置影响头部与挡风玻璃的接触距离
      const windshieldDist = 0.48 + seatOffset;
      const delta_windshield = Math.max(0, x_hd - windshieldDist);
      F_airbag = params.k_airbag * 8.0 * Math.pow(delta_windshield, params.n) + (delta_windshield > 0 ? params.c_airbag * 3.0 * v_hd : 0);
    }

    // Neck reaction force: models elastic coupling with chest
    const Fz_neck = params.k_neck_ax * (x_hd - x_th) + params.c_neck_ax * (v_hd - v_th);
    const a_hd_rel = av - (F_airbag + Fz_neck) / params.m_head;
    v_hd += a_hd_rel * dt;
    x_hd += v_hd * dt;

    headRelX[i] = x_hd;
    headRelV[i] = v_hd;
    // head absolute acceleration G includes safety loading and neck reactions
    const headForceAbs = F_airbag + Fz_neck;
    headAccelAbsG[i] = Math.max(0, Math.abs(headForceAbs / params.m_head / 9.80665));

    neckFzN[i] = Fz_neck;
    // Bending torque based on head rotation proxy (relative head displacement compared to thorax)
    const dTheta = (x_hd - x_th) / params.L_neck;
    const dOmega = (v_hd - v_th) / params.L_neck;
    neckMyNm[i] = params.k_neck_rot * dTheta + params.c_neck_rot * dOmega;

    // 3. Pelvis/Femur dynamics
    let F_lap = 0;
    if (belted) {
      // 预紧器同样减少腰部安全带初始松弛
      const effectiveLapSlack = pretensioner ? params.s_belt * 0.33 : params.s_belt;
      const delta_lap = Math.max(0, x_pl - effectiveLapSlack);
      F_lap = params.k_belt * 0.4 * delta_lap + (delta_lap > 0 ? params.c_belt * 0.5 * v_pl : 0);
    }

    // 座椅位置影响膝盖与仪表板的接触间隙
    // 前置座椅膝盖更早接触，后置座椅膝盖接触距离更远
    const kneeGapLeft = params.g_knee_left + seatOffset;
    const kneeGapRight = params.g_knee_right + seatOffset;
    const delta_knee_l = Math.max(0, x_pl - kneeGapLeft);
    const F_f_left = params.k_femur_left * delta_knee_l + (delta_knee_l > 0 ? 500 * v_pl : 0);

    const delta_knee_r = Math.max(0, x_pl - kneeGapRight);
    const F_f_right = params.k_femur_right * delta_knee_r + (delta_knee_r > 0 ? 500 * v_pl : 0);

    const a_pl_rel = av - (F_lap + F_f_left + F_f_right) / params.m_pelvis;
    v_pl += a_pl_rel * dt;
    x_pl += v_pl * dt;

    pelvisRelX[i] = x_pl;
    pelvisRelV[i] = v_pl;
    pelvisAccelAbsG[i] = Math.max(0, Math.abs((F_lap + F_f_left + F_f_right) / params.m_pelvis / 9.80665));

    femurLeftN[i] = -F_f_left; // negative indicates compressive femur force
    femurRightN[i] = -F_f_right;
  }

  // Backfill index 0 with baseline limits
  headAccelAbsG[0] = headAccelAbsG[1] || 0;
  thoraxAccelAbsG[0] = thoraxAccelAbsG[1] || 0;
  pelvisAccelAbsG[0] = pelvisAccelAbsG[1] || 0;

  return {
    timeS,
    headRelX,
    headAccelAbsG,
    thoraxRelX,
    thoraxAccelAbsG,
    pelvisRelX,
    pelvisAccelAbsG,
    chestDeflectionM,
    neckFzN,
    neckMyNm,
    femurLeftN,
    femurRightN,
  };
}

/**
 * Solves Side Proxy Biomechanics (incorporates door panel intrusions)
 */
export function solveSideProxy(
  timeS: number[],
  accelMps2: number[],
  intrusionCm: number[] | null | undefined,
  doorVelocityMps: number[] | null | undefined,
  doorContactForceN: number[] | null | undefined,
  params: SolverParams = DEFAULT_SOLVER_PARAMS
): SideSolverOutput {
  const n = timeS.length;
  const warnings: string[] = [];
  const confidence = {
    side_chest: "high" as "low" | "medium" | "high",
    abdomen: "high" as "low" | "medium" | "high",
    pelvis: "high" as "low" | "medium" | "high",
  };

  const ribDeflectionM = new Array(n).fill(0);
  const abdomenForceN = new Array(n).fill(0);
  const pubicForceN = new Array(n).fill(0);

  // Check if intrusion telemetry or contact inputs exist
  const hasIntrusion = intrusionCm && intrusionCm.length > 0 && Math.max(...intrusionCm) > 0;
  const hasVelocity = doorVelocityMps && doorVelocityMps.length > 0 && Math.max(...doorVelocityMps.map(Math.abs)) > 0;
  const hasForce = doorContactForceN && doorContactForceN.length > 0 && Math.max(...doorContactForceN.map(Math.abs)) > 0;

  if (!hasIntrusion && !hasVelocity && !hasForce) {
    // Falls back to low-confidence mode
    confidence.side_chest = "low";
    confidence.abdomen = "low";
    confidence.pelvis = "low";
    warnings.push("side_missing_intrusion_input");

    // Estimate generic door collision dynamics based on absolute vehicle pulse
    const maxVehicleDecel = Math.max(...accelMps2.map(Math.abs)); // absolute peak
    // Generate virtual standard intrusion logs based on impulse amplitude
    const estimatedMaxIntrusionM = 0.12 * (maxVehicleDecel / 300); // 12cm compression at 30g deceleration
    for (let i = 0; i < n; i++) {
      // Sinusoidal intrusion profile peaking at mid-crash duration (e.g. 50-70ms)
      const ratio = timeS[i] / (timeS[n - 1] || 0.1);
      const intrusionM = estimatedMaxIntrusionM * Math.sin(ratio * Math.PI);
      
      ribDeflectionM[i] = Math.max(0, intrusionM - params.gap_thorax) * 0.35;
      abdomenForceN[i] = Math.max(0, intrusionM - params.gap_abdomen) * 11000;
      pubicForceN[i] = Math.max(0, intrusionM - params.gap_pelvis) * 8500;
    }

    return { timeS, ribDeflectionM, abdomenForceN, pubicForceN, confidence, warnings };
  }

  // We have intrusion inputs! Let's solve relative door-occupant interactions
  // Convert intrusion in cm to meters
  const intrusionM = intrusionCm ? intrusionCm.map((c) => c / 100) : new Array(n).fill(0);

  // Solves state variables of occupant relative to car
  let x_th = 0, v_th = 0;
  let x_abd = 0, v_abd = 0;
  let x_pl = 0, v_pl = 0;

  const a_vehicle = accelMps2.map(Math.abs);

  for (let i = 1; i < n; i++) {
    const dt = timeS[i] - timeS[i - 1];
    if (dt <= 0) continue;

    const av = a_vehicle[i];

    // Door displacement in occupant reference space
    const x_door = intrusionM[i] || 0;
    // Numerical derivative for door speed
    let v_door = 0;
    if (doorVelocityMps && doorVelocityMps[i] !== undefined) {
      v_door = doorVelocityMps[i];
    } else {
      v_door = ((intrusionM[i] || 0) - (intrusionM[i - 1] || 0)) / dt;
    }

    // 1. Thorax compression
    const gap_th = params.gap_thorax;
    const delta_rib = Math.max(0, x_door - x_th - gap_th);
    const F_rib_lat = params.k_rib_lat * delta_rib + (delta_rib > 0 ? params.c_rib_lat * (v_door - v_th) : 0);

    const a_th_rel = av - F_rib_lat / params.m_thorax;
    v_th += a_th_rel * dt;
    x_th += v_th * dt;

    ribDeflectionM[i] = delta_rib * 0.85; // coefficient representing biological deflection

    // 2. Abdomen compression & contact forces
    const gap_ab = params.gap_abdomen;
    const delta_abd = Math.max(0, x_door - x_abd - gap_ab);
    const F_abd_lat = params.k_abd_lat * delta_abd + (delta_abd > 0 ? params.c_abd_lat * (v_door - v_abd) : 0);

    const a_abd_rel = av - F_abd_lat / (params.m_thorax * 0.4); // abdomen mass is part of upper torso model
    v_abd += a_abd_rel * dt;
    x_abd += v_abd * dt;

    abdomenForceN[i] = F_abd_lat;

    // 3. Pelvis / Pubic compression & contact forces
    const gap_pl = params.gap_pelvis;
    const delta_pl = Math.max(0, x_door - x_pl - gap_pl);
    const F_pl_lat = params.k_pelvis_lat * delta_pl + (delta_pl > 0 ? params.c_pelvis_lat * (v_door - v_pl) : 0);

    const a_pl_rel = av - F_pl_lat / params.m_pelvis;
    v_pl += a_pl_rel * dt;
    x_pl += v_pl * dt;

    pubicForceN[i] = F_pl_lat;
  }

  return {
    timeS,
    ribDeflectionM,
    abdomenForceN,
    pubicForceN,
    confidence: {
      side_chest: hasIntrusion ? "high" : "medium",
      abdomen: hasIntrusion ? "high" : "medium",
      pelvis: hasIntrusion ? "high" : "medium",
    },
    warnings,
  };
}
