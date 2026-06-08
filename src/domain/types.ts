export type CollisionType = "frontal" | "side";
export type AnalysisMode = "criteria_direct" | "vehicle_pulse_proxy";

export interface ScenarioConfig {
  collision_type: CollisionType;
  impact_side?: "left" | "right" | "none" | null;
  vehicle_speed_kph: number;
  delta_v_kph: number;
  pdof_deg: number;
}

export interface RestraintConfig {
  belted: boolean;
  belt_type?: "none" | "lap_shoulder";
  frontal_airbag_deployed?: boolean;
  side_airbag_deployed?: boolean;
  pretensioner?: boolean;
  load_limiter_kN?: number | null;
  seat_track_position?: "front" | "mid" | "rear";
}

export interface DirectSignals {
  time_ms: number[];
  head_ax_g: number[];
  head_ay_g: number[];
  head_az_g: number[];
  chest_deflection_mm: number[];
  neck_fz_n: number[];
  neck_my_nm: number[];
  femur_left_n: number[];
  femur_right_n: number[];
}

export interface ProxySignals {
  time_ms: number[];
  accel_g: number[];
  pulse_axis: "x" | "y";
  intrusion_cm?: number[] | null;
  door_velocity_mps?: number[] | null;
  door_contact_force_n?: number[] | null;
}

export interface AnalysisRequest {
  mode: AnalysisMode;
  occupant_model: string; // e.g. "50th_percentile_male"
  scenario: ScenarioConfig;
  signals: DirectSignals | ProxySignals;
  restraint?: RestraintConfig;
  options?: {
    return_proxy_time_series?: boolean;
  };
}

export interface RegionAssessment {
  risk_score: number;       // 0 - 100
  risk_probability: number; // 0.0 - 1.0
  risk_level: "low" | "moderate" | "high";
  ais_est: number;          // 0 - 6
  criteria: {
    primary: string;
    value: number;
    unit: string;
  };
  drivers: string[];
  signal_source: "direct" | "estimated";
  mapping_method: "risk_curve" | "threshold_based";
}

export interface HeatmapItem {
  region_id: string; // e.g. "head", "neck", "chest", "abdomen", "pelvis", "left_femur", "right_femur"
  intensity: number; // 0.0 - 1.0
  color: string;     // e.g. hex color
  risk_level: "low" | "moderate" | "high";
  ais_est: number;
  source_metric: string;
  value: number;
  unit: string;
}

export interface AnalysisResponse {
  scenario_summary: {
    collision_type: CollisionType;
    vehicle_speed_kph: number;
    delta_v_kph: number;
    joint_risk_prob: number;
  };
  criteria: {
    hic15?: number;
    head_3ms?: number;
    nij?: number;
    chest_deflection_mm?: number;
    chest_3ms?: number;
    vc_frontal?: number;
    femur_left_peak_n?: number;
    femur_right_peak_n?: number;
    // Side metrics
    side_rib_deflection_mm?: number;
    abdomen_force_n?: number;
    pubic_force_n?: number;
  };
  injury_assessment: {
    head: RegionAssessment;
    neck: RegionAssessment;
    chest: RegionAssessment;
    abdomen: RegionAssessment;
    pelvis: RegionAssessment;
    left_femur: RegionAssessment;
    right_femur: RegionAssessment;
  };
  heatmap: HeatmapItem[];
  proxy_time_series: any | null;
  confidence: {
    overall: "low" | "medium" | "high";
    head?: "low" | "medium" | "high";
    neck?: "low" | "medium" | "high";
    chest?: "low" | "medium" | "high";
    abdomen?: "low" | "medium" | "high";
    pelvis?: "low" | "medium" | "high";
    left_femur?: "low" | "medium" | "high";
    right_femur?: "low" | "medium" | "high";
  };
  warnings: string[];
  sources: string[];
}
