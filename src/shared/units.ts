export type TimeUnit = "ms" | "s";
export type AccelUnit = "g" | "m/s^2";

const G_CONSTANT = 9.80665;

export function toSeconds(value: number, unit: TimeUnit = "ms"): number {
  return unit === "ms" ? value / 1000 : value;
}

export function toMetersPerSecondSquared(value: number, unit: AccelUnit = "g"): number {
  return unit === "g" ? value * G_CONSTANT : value;
}

export function toGs(value: number, unit: AccelUnit = "m/s^2"): number {
  return unit === "m/s^2" ? value / G_CONSTANT : value;
}

export function toKph(mps: number): number {
  return mps * 3.6;
}

export function toMps(kph: number): number {
  return kph / 3.6;
}
