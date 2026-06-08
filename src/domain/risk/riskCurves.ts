/**
 * Numerical approximation of the error function (erf)
 * Precision is better than 1.5e-7 (Handbook of Mathematical Functions, formula 7.1.26)
 */
export function erf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return sign * y;
}

/**
 * Standard Normal Cumulative Distribution Function (Phi)
 */
export function normalCDF(x: number): number {
  return 0.5 * (1.0 + erf(x / Math.sqrt(2.0)));
}

/**
 * Head AIS3+ Risk based on HIC15
 * P_head_AIS3plus = Phi((ln(HIC15) - 7.45231) / 0.73998)
 */
export function headAis3RiskFromHic15(hic15: number): number {
  if (hic15 <= 0) return 0;
  const val = (Math.log(hic15) - 7.45231) / 0.73998;
  return parseFloat(normalCDF(val).toFixed(4));
}

/**
 * Neck AIS3+ Risk based on Nij and Peak Loads
 * P_neck_nij = 1 / (1 + exp(3.2269 - 1.9688 * Nij))
 * P_neck_tension = 1 / (1 + exp(10.9745 - 2.375 * T_kN))
 * P_neck_compression = 1 / (1 + exp(10.9745 - 2.375 * C_kN))
 */
export function neckAis3Risk(nij: number, tensionN: number = 0, compressionN: number = 0): number {
  // Convert Newtons to kilonewtons (kN)
  const tkN = tensionN / 1000;
  const ckN = compressionN / 1000;

  const p_nij = 1 / (1 + Math.exp(3.2269 - 1.9688 * nij));
  const p_tension = 1 / (1 + Math.exp(10.9745 - 2.375 * tkN));
  const p_compression = 1 / (1 + Math.exp(10.9745 - 2.375 * ckN));

  const p_neck = Math.max(p_nij, p_tension, p_compression);
  return parseFloat(p_neck.toFixed(4));
}

/**
 * Frontal Chest AIS3+ Risk based on Deflection in mm
 * P_chest_AIS3plus = 1 / (1 + exp(10.5456 - 1.568 * D_chest_mm^0.4612))
 */
export function frontalChestAis3Risk(deflectionMm: number): number {
  if (deflectionMm <= 0) return 0;
  // Apply exponent power to deflection
  const p_chest = 1 / (1 + Math.exp(10.5456 - 1.568 * Math.pow(deflectionMm, 0.4612)));
  return parseFloat(p_chest.toFixed(4));
}

/**
 * Femur AIS2+ Risk based on Compression in N
 * P_femur_AIS2plus = 1 / (1 + exp(5.795 - 0.5196 * F_femur_kN))
 */
export function femurAis2Risk(forceN: number): number {
  const f_kN = forceN / 1000;
  const p_femur = 1 / (1 + Math.exp(5.795 - 0.5196 * f_kN));
  return parseFloat(p_femur.toFixed(4));
}

/**
 * Side Chest AIS3+ Risk based on Rib deflection in mm
 * P_side_chest_AIS3plus = 1 / (1 + exp(5.3895 - 0.0919 * D_rib_mm))
 */
export function sideChestAis3Risk(deflectionMm: number): number {
  if (deflectionMm <= 0) return 0;
  const p_chest = 1 / (1 + Math.exp(5.3895 - 0.0919 * deflectionMm));
  return parseFloat(p_chest.toFixed(4));
}

/**
 * Side Abdomen AIS3+ Risk based on Abdominal Force in Newtons
 * P_abdomen_AIS3plus = 1 / (1 + exp(6.04044 - 0.002133 * F_abdomen_N))
 */
export function sideAbdomenAis3Risk(forceN: number): number {
  if (forceN <= 0) return 0;
  const p_abd = 1 / (1 + Math.exp(6.04044 - 0.002133 * forceN));
  return parseFloat(p_abd.toFixed(4));
}

/**
 * Side Pelvis AIS3+ Risk based on Pubic Symphysis Force in Newtons
 * P_pelvis_AIS3plus = 1 / (1 + exp(7.5969 - 0.0011 * F_pubic_N))
 */
export function sidePelvisAis3Risk(forceN: number): number {
  if (forceN <= 0) return 0;
  const p_pelvis = 1 / (1 + Math.exp(7.5969 - 0.0011 * forceN));
  return parseFloat(p_pelvis.toFixed(4));
}

/**
 * Maps probability of injury to standard AIS level and risk tier labels
 */
export function estimateAisAndTier(prob: number, isAis2Curve: boolean = false): {
  ais_est: number;
  risk_level: "low" | "moderate" | "high";
  risk_score: number;
} {
  const risk_score = Math.round(prob * 100);
  let risk_level: "low" | "moderate" | "high" = "low";
  let ais_est = 0;

  if (prob >= 0.50) {
    risk_level = "high";
    ais_est = isAis2Curve ? 2 : 3;
  } else if (prob >= 0.20) {
    risk_level = "moderate";
    ais_est = 2;
  } else if (prob >= 0.05) {
    risk_level = "low";
    ais_est = 1;
  } else {
    risk_level = "low";
    ais_est = 0;
  }

  return { ais_est, risk_level, risk_score };
}
