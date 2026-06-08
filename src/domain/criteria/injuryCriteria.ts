/**
 * Evaluates HIC15 (Head Injury Criterion over a maximum 15ms window)
 */
export function computeHic15(input: { timeS: number[]; resultantAccelG: number[] }): number {
  const { timeS, resultantAccelG } = input;
  const n = timeS.length;
  if (n < 2) return 0;

  // Precompute cumulative integral using trapezoidal rule for constant-time sub-range integration
  const cumInt: number[] = new Array(n).fill(0);
  for (let i = 1; i < n; i++) {
    const dt = timeS[i] - timeS[i - 1];
    const avg = (resultantAccelG[i] + resultantAccelG[i - 1]) / 2;
    cumInt[i] = cumInt[i - 1] + avg * dt;
  }

  let maxHic = 0;

  // Slide windows [t1, t2] such that t2 - t1 <= 0.015s
  let r = 0;
  for (let l = 0; l < n; l++) {
    const t1 = timeS[l];
    // Advance r to find maximum allowable t2
    while (r < n && timeS[r] - t1 <= 0.015001) {
      r++;
    }
    
    // Evaluate all sub-windows starting at l, ending between l+1 and r-1
    for (let k = l + 1; k < r; k++) {
      const dt = timeS[k] - t1;
      if (dt <= 0.001) continue; // Skip extremely tiny intervals to avoid division issues

      const integral = cumInt[k] - cumInt[l];
      const avgA = integral / dt;
      const hicVal = dt * Math.pow(Math.max(0, avgA), 2.5);
      if (hicVal > maxHic) {
        maxHic = hicVal;
      }
    }
  }

  return parseFloat(maxHic.toFixed(2));
}

/**
 * Computes 3ms clip (the acceleration exceeded for a cumulative duration of 3 ms)
 */
export function computeClip3ms(timeS: number[], resultantG: number[]): number {
  if (resultantG.length === 0) return 0;
  if (timeS.length < 2) return resultantG[0] || 0;

  // Find average dt
  const totalDuration = timeS[timeS.length - 1] - timeS[0];
  const dt = totalDuration / (timeS.length - 1);
  const targetSamples = Math.round(0.003 / dt); // 3ms worth of samples

  // Sort values descending
  const sorted = [...resultantG].sort((a, b) => b - a);

  // The clip value is the value that is exceeded for exactly 3ms
  const index = Math.min(sorted.length - 1, Math.max(0, targetSamples));
  return parseFloat(sorted[index].toFixed(2));
}

/**
 * Computes Viscous Criterion (VC)
 * Dval is displacement/deflection in meters.
 * Dconstant is chest depth (e.g., 0.229 for frontal thorax, 0.170 for side impact).
 */
export function computeViscousCriterion(timeS: number[], deflectionM: number[], dConstant: number): number {
  const n = timeS.length;
  if (n < 5) return 0;

  let maxVC = 0;

  for (let i = 2; i < n - 2; i++) {
    const dt = timeS[i + 1] - timeS[i];
    if (dt <= 0) continue;

    // Numerical derivative of deflection: central difference 5-point stencil
    // V(t) = [8*(D(t+dt)-D(t-dt)) - (D(t+2dt)-D(t-2dt))] / (12*dt)
    const d_t_prev1 = deflectionM[i - 1];
    const d_t_next1 = deflectionM[i + 1];
    const d_t_prev2 = deflectionM[i - 2];
    const d_t_next2 = deflectionM[i + 2];

    const v_t = (8 * (d_t_next1 - d_t_prev1) - (d_t_next2 - d_t_prev2)) / (12 * dt);

    // Instantaneous compression ratio C(t) = D(t) / Dconstant
    const c_t = deflectionM[i] / dConstant;

    const vc_instant = v_t * c_t;
    if (vc_instant > maxVC) {
      maxVC = vc_instant;
    }
  }

  // Fallback if stencil fails or result is very small, return absolute peak of instantaneous product
  if (maxVC === 0) {
    for (let i = 1; i < n - 1; i++) {
      const v_t = (deflectionM[i + 1] - deflectionM[i - 1]) / (timeS[i + 1] - timeS[i - 1]);
      const c_t = deflectionM[i] / dConstant;
      const vc_instant = v_t * c_t;
      if (vc_instant > maxVC) {
        maxVC = vc_instant;
      }
    }
  }

  return parseFloat(maxVC.toFixed(3));
}

/**
 * Computes Nij peak and returns intermediate details (axial tension, compression limits)
 */
export function computeNij(input: {
  timeS: number[];
  fzN: number[];
  myNm: number[];
}): {
  nij: number;
  peakTensionN: number;
  peakCompressionN: number;
  peakFlexionNm: number;
  peakExtensionNm: number;
} {
  const { timeS, fzN, myNm } = input;
  const n = timeS.length;

  let maxNij = 0;
  let peakTensionDecimal = 0;
  let peakCompressionDecimal = 0;
  let peakFlexionDecimal = 0;
  let peakExtensionDecimal = 0;

  for (let i = 0; i < n; i++) {
    const fz = fzN[i];
    const my = myNm[i];

    // Track peak states for reference
    if (fz > 0) {
      if (fz > peakTensionDecimal) peakTensionDecimal = fz;
    } else {
      if (Math.abs(fz) > peakCompressionDecimal) peakCompressionDecimal = Math.abs(fz);
    }

    if (my > 0) {
      if (my > peakFlexionDecimal) peakFlexionDecimal = my;
    } else {
      if (Math.abs(my) > peakExtensionDecimal) peakExtensionDecimal = Math.abs(my);
    }

    // Nij calculation: select intercepts by sign
    // Tensile/Compressive intercept:
    // Tension (Fz > 0) -> Fint = 4170 N
    // Compression (Fz < 0) -> Fint = 4000 N
    const Fint = fz >= 0 ? 4170 : 4000;

    // Flexion/Extension intercept:
    // Flexion (My > 0) -> Mint = 310 Nm
    // Extension (My < 0) -> Mint = 135 Nm
    const Mint = my >= 0 ? 310 : 135;

    const nij_instant = Math.abs(fz) / Fint + Math.abs(my) / Mint;
    if (nij_instant > maxNij) {
      maxNij = nij_instant;
    }
  }

  return {
    nij: parseFloat(maxNij.toFixed(3)),
    peakTensionN: parseFloat(peakTensionDecimal.toFixed(1)),
    peakCompressionN: parseFloat(peakCompressionDecimal.toFixed(1)),
    peakFlexionNm: parseFloat(peakFlexionDecimal.toFixed(1)),
    peakExtensionNm: parseFloat(peakExtensionDecimal.toFixed(1)),
  };
}

/**
 * Computes peak femur compression as absolute peak of compression force (negative values)
 */
export function computeFemurPeak(valuesN: number[]): number {
  if (valuesN.length === 0) return 0;
  const absValues = valuesN.map(Math.abs);
  const maxForce = Math.max(...absValues);
  return parseFloat(maxForce.toFixed(1));
}
