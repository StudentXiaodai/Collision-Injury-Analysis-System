import { toSeconds, toMetersPerSecondSquared, toKph } from "../../shared/units";

export interface NormalizedPulseResult {
  timeS: number[];
  accelMps2: number[];
  deltaVFromPulseMps: number;
  deltaVFromPulseKph: number;
  warnings: string[];
}

/**
 * Linearly interpolates a value at x given array of xs and ys
 */
export function interpolate(x: number, xs: number[], ys: number[]): number {
  if (xs.length === 0) return 0;
  if (xs.length === 1) return ys[0];
  if (x <= xs[0]) return ys[0];
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1];

  // Binary search for interval
  let low = 0;
  let high = xs.length - 1;
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (xs[mid] <= x) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const x0 = xs[low];
  const x1 = xs[high];
  const y0 = ys[low];
  const y1 = ys[high];

  if (x1 === x0) return y0;
  const t = (x - x0) / (x1 - x0);
  return y0 + t * (y1 - y0);
}

/**
 * Performs trapezoidal numerical integration
 */
export function integrateTrapezoid(timeS: number[], values: number[]): number {
  let area = 0;
  for (let i = 0; i < timeS.length - 1; i++) {
    const dt = timeS[i + 1] - timeS[i];
    const avg = (values[i] + values[i + 1]) / 2;
    area += avg * dt;
  }
  return area;
}

/**
 * Normalizes pulse signals (resampling, PDOF projection, integration checklist)
 */
export function normalizePulse(
  collisionType: "frontal" | "side",
  pdofDeg: number,
  timeMs: number[],
  accelG: number[],
  pulseAxis: "x" | "y",
  inputDeltaVKph: number,
  impactSide?: "left" | "right" | "none" | null
): NormalizedPulseResult {
  const warnings: string[] = [];

  if (timeMs.length === 0 || accelG.length === 0) {
    return {
      timeS: [],
      accelMps2: [],
      deltaVFromPulseMps: 0,
      deltaVFromPulseKph: 0,
      warnings: ["empty_pulse_data"],
    };
  }

  // 1. Convert units to SI (seconds and m/s^2)
  const sourceTimes = timeMs.map((t) => toSeconds(t, "ms"));
  const sourceAccels = accelG.map((a) => toMetersPerSecondSquared(a, "g"));

  // 2. Project acceleration according to PDOF
  // 车体前向: +x, 车体左向: +y, 竖直向上: +z
  // 正碰主分析轴: x (heading = 0)
  // 侧碰主分析轴: y (left heading = pi/2, right heading = -pi/2)
  let axisHeadingRad = 0;
  if (collisionType === "side") {
    if (impactSide === "right") {
      axisHeadingRad = -Math.PI / 2;
    } else {
      axisHeadingRad = Math.PI / 2;
    }
  }

  const pdofRad = (pdofDeg * Math.PI) / 180;
  const projection = Math.cos(pdofRad - axisHeadingRad);

  // Apply axis-projected acceleration
  const projectedAccels = sourceAccels.map((a) => a * projection);

  // 3. Resample linearly to dt = 0.0005 s (500 microseconds)
  const maxTime = sourceTimes[sourceTimes.length - 1];
  const dt = 0.0005;
  const timeS: number[] = [];
  const accelMps2: number[] = [];

  for (let t = 0; t <= maxTime; t += dt) {
    timeS.push(t);
    accelMps2.push(interpolate(t, sourceTimes, projectedAccels));
  }

  // Ensure last point is included if it was skipped
  if (maxTime % dt !== 0 && maxTime > 0) {
    timeS.push(maxTime);
    accelMps2.push(interpolate(maxTime, sourceTimes, projectedAccels));
  }

  // 4. Calculate integrated velocity change
  // Note: Collision decel pulse typically has negative values; integrate absolute value for Delta V comparison
  // or handle sign appropriately.
  const absAccels = accelMps2.map(Math.abs);
  const deltaVFromPulseMps = integrateTrapezoid(timeS, absAccels);
  const deltaVFromPulseKph = toKph(deltaVFromPulseMps);

  // 5. Compare with input delta_v_kph and warn if difference is greater than 15%
  if (inputDeltaVKph > 0) {
    const diffRatio = Math.abs(deltaVFromPulseKph - inputDeltaVKph) / inputDeltaVKph;
    if (diffRatio > 0.15) {
      warnings.push(`pulse_delta_v_mismatch`);
    }
  }

  return {
    timeS,
    accelMps2,
    deltaVFromPulseMps,
    deltaVFromPulseKph,
    warnings,
  };
}
