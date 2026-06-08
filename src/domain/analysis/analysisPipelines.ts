import { 
  AnalysisRequest, 
  AnalysisResponse, 
  RegionAssessment, 
  HeatmapItem, 
  CollisionType,
  DirectSignals,
  ProxySignals
} from "../types";
import { normalizePulse } from "../pulse/normalizePulse";
import { 
  computeHic15, 
  computeClip3ms, 
  computeNij, 
  computeViscousCriterion, 
  computeFemurPeak 
} from "../criteria/injuryCriteria";
import { 
  headAis3RiskFromHic15, 
  neckAis3Risk, 
  frontalChestAis3Risk, 
  femurAis2Risk, 
  sideChestAis3Risk, 
  sideAbdomenAis3Risk, 
  sidePelvisAis3Risk, 
  estimateAisAndTier 
} from "../risk/riskCurves";
import { solveFrontalProxy, solveSideProxy } from "../proxy/proxySolvers";

/**
 * Solid helper to fetch color based on risk intensity ratio
 */
export function getColorForIntensity(intensity: number): string {
  if (intensity <= 0.19) return "#22c55e"; // Healthy green
  if (intensity <= 0.39) return "#84cc16"; // Yellow green
  if (intensity <= 0.59) return "#eab308"; // Golden yellow
  if (intensity <= 0.79) return "#f97316"; // Orange warning
  return "#ef4444"; // Severe red
}

/**
 * Builds regional index assessments based computed criteria
 */
export function buildAssessment(
  collisionType: CollisionType,
  criteria: any,
  signalSource: "direct" | "estimated"
): {
  head: RegionAssessment;
  neck: RegionAssessment;
  chest: RegionAssessment;
  abdomen: RegionAssessment;
  pelvis: RegionAssessment;
  left_femur: RegionAssessment;
  right_femur: RegionAssessment;
} {
  const isFrontal = collisionType === "frontal";

  // Initialize standard assessments
  let headAis = 0, headRisk = 0, headTier: "low" | "moderate" | "high" = "low";
  let neckAis = 0, neckRisk = 0, neckTier: "low" | "moderate" | "high" = "low";
  let chestAis = 0, chestRisk = 0, chestTier: "low" | "moderate" | "high" = "low";
  let abdAis = 0, abdRisk = 0, abdTier: "low" | "moderate" | "high" = "low";
  let pelAis = 0, pelRisk = 0, pelTier: "low" | "moderate" | "high" = "low";
  let fLeftAis = 0, fLeftRisk = 0, fLeftTier: "low" | "moderate" | "high" = "low";
  let fRightAis = 0, fRightRisk = 0, fRightTier: "low" | "moderate" | "high" = "low";

  const headDrivers: string[] = [];
  const neckDrivers: string[] = [];
  const chestDrivers: string[] = [];
  const abdDrivers: string[] = [];
  const pelDrivers: string[] = [];
  const fLeftDrivers: string[] = [];
  const fRightDrivers: string[] = [];

  if (isFrontal) {
    // 1. Head (HIC15)
    const hic = criteria.hic15 || 0;
    headRisk = headAis3RiskFromHic15(hic);
    const headMap = estimateAisAndTier(headRisk);
    headAis = headMap.ais_est;
    headTier = headMap.risk_level;
    if (hic > 700) {
      headDrivers.push("hic15_exceeds_threshold");
    }
    if (signalSource === "estimated" && hic > 500) {
      headDrivers.push("high_inertial_impact");
    }

    // 2. Neck (Nij & Peak forces)
    const nij = criteria.nij || 0;
    const fzTen = criteria.peak_neck_tension_n || 0;
    const fzComp = criteria.peak_neck_compression_n || 0;
    neckRisk = neckAis3Risk(nij, fzTen, fzComp);
    const neckMap = estimateAisAndTier(neckRisk);
    neckAis = neckMap.ais_est;
    neckTier = neckMap.risk_level;
    if (nij > 1.0) {
      neckDrivers.push("nij_exceeds_critical_intercept");
    }
    if (fzTen > 3500) {
      neckDrivers.push("high_axial_tensile_tension");
    }

    // 3. Chest (Chest deflection / 3ms clip)
    const defMm = criteria.chest_deflection_mm || 0;
    chestRisk = frontalChestAis3Risk(defMm);
    const chestMap = estimateAisAndTier(chestRisk);
    chestAis = chestMap.ais_est;
    chestTier = chestMap.risk_level;
    if (defMm > 42) {
      chestDrivers.push("sternal_displacement_high");
    }
    if (criteria.chest_3ms_g > 60) {
      chestDrivers.push("high_inertial_thoracic_deceleration");
    }

    // 4. Femur left
    const flN = criteria.femur_left_peak_n || 0;
    fLeftRisk = femurAis2Risk(flN);
    const flMap = estimateAisAndTier(fLeftRisk, true); // Femur curve is AIS2+
    fLeftAis = flMap.ais_est;
    fLeftTier = flMap.risk_level;
    if (flN > 5000) {
      fLeftDrivers.push("femur_axial_tension_high");
    }

    // 5. Femur right
    const frN = criteria.femur_right_peak_n || 0;
    fRightRisk = femurAis2Risk(frN);
    const frMap = estimateAisAndTier(fRightRisk, true);
    fRightAis = frMap.ais_est;
    fRightTier = frMap.risk_level;
    if (frN > 5000) {
      fRightDrivers.push("femur_axial_tension_high");
    }

    // Abdomen & pelvis defaults are very safe during frontal crashes
    abdRisk = 0.02;
    abdAis = 0;
    abdTier = "low";
    pelRisk = 0.02;
    pelAis = 0;
    pelTier = "low";

  } else {
    // Side impact injury mappings
    // 1. Head (represented by lateral head deceleration or scaled vehicle side pulse)
    const hic = criteria.hic15 || 0;
    headRisk = headAis3RiskFromHic15(hic || 50);
    const headMap = estimateAisAndTier(headRisk);
    headAis = headMap.ais_est;
    headTier = headMap.risk_level;

    const nij = criteria.nij || 0;
    const neckMap = estimateAisAndTier(nij * 0.4);
    neckRisk = nij * 0.15;
    neckAis = neckMap.ais_est;
    neckTier = neckMap.risk_level;

    // 2. Lateral chest (Rib deflection)
    const sideDef = criteria.side_rib_deflection_mm || 0;
    chestRisk = sideChestAis3Risk(sideDef);
    const sideChestMap = estimateAisAndTier(chestRisk);
    chestAis = sideChestMap.ais_est;
    chestTier = sideChestMap.risk_level;
    if (sideDef > 34) {
      chestDrivers.push("rib_deflection_exceeds_standard");
    }

    // 3. Lateral abdomen (Abdomen Force)
    const abdF = criteria.abdomen_force_n || 0;
    abdRisk = sideAbdomenAis3Risk(abdF);
    const abdMap = estimateAisAndTier(abdRisk);
    abdAis = abdMap.ais_est;
    abdTier = abdMap.risk_level;
    if (abdF > 2500) {
      abdDrivers.push("high_lateral_contact_pressure_abdominal");
    }

    // 4. Lateral pelvis (Pubic Symphysis Force)
    const pelF = criteria.pubic_force_n || 0;
    pelRisk = sidePelvisAis3Risk(pelF);
    const pelMap = estimateAisAndTier(pelRisk);
    pelAis = pelMap.ais_est;
    pelTier = pelMap.risk_level;
    if (pelF > 6000) {
      pelDrivers.push("pubic_symphysis_load_exceeds_safe_limit");
    }

    fLeftRisk = 0.03;
    fLeftAis = 0;
    fLeftTier = "low";
    fRightRisk = 0.03;
    fRightAis = 0;
    fRightTier = "low";
  }

  return {
    head: {
      risk_score: Math.round(headRisk * 100),
      risk_probability: headRisk,
      risk_level: headTier,
      ais_est: headAis,
      criteria: {
        primary: "HIC15",
        value: criteria.hic15 || 0,
        unit: "",
      },
      drivers: headDrivers.length > 0 ? headDrivers : ["nominal_restraint_buffer"],
      signal_source: signalSource,
      mapping_method: "risk_curve",
    },
    neck: {
      risk_score: Math.round(neckRisk * 100),
      risk_probability: neckRisk,
      risk_level: neckTier,
      ais_est: neckAis,
      criteria: {
        primary: "Nij",
        value: criteria.nij || 0,
        unit: "",
      },
      drivers: neckDrivers.length > 0 ? neckDrivers : ["nominal_neck_structural_stiffness"],
      signal_source: signalSource,
      mapping_method: "risk_curve",
    },
    chest: {
      risk_score: Math.round(chestRisk * 100),
      risk_probability: chestRisk,
      risk_level: chestTier,
      ais_est: chestAis,
      criteria: {
        primary: isFrontal ? "Chest Deflection" : "Lateral Rib Deflection",
        value: isFrontal ? (criteria.chest_deflection_mm || 0) : (criteria.side_rib_deflection_mm || 0),
        unit: "mm",
      },
      drivers: chestDrivers.length > 0 ? chestDrivers : ["nominal_impact_attenuation_absorption"],
      signal_source: signalSource,
      mapping_method: "risk_curve",
    },
    abdomen: {
      risk_score: Math.round(abdRisk * 100),
      risk_probability: abdRisk,
      risk_level: abdTier,
      ais_est: abdAis,
      criteria: {
        primary: isFrontal ? "N/A" : "Abdomen Force",
        value: isFrontal ? 0 : (criteria.abdomen_force_n || 0),
        unit: isFrontal ? "" : "N",
      },
      drivers: abdDrivers.length > 0 ? abdDrivers : ["nominal_contact_cushioning"],
      signal_source: signalSource,
      mapping_method: isFrontal ? "threshold_based" : "risk_curve",
    },
    pelvis: {
      risk_score: Math.round(pelRisk * 100),
      risk_probability: pelRisk,
      risk_level: pelTier,
      ais_est: pelAis,
      criteria: {
        primary: isFrontal ? "N/A" : "Pubic Force",
        value: isFrontal ? 0 : (criteria.pubic_force_n || 0),
        unit: isFrontal ? "" : "N",
      },
      drivers: pelDrivers.length > 0 ? pelDrivers : ["nominal_contact_cushioning"],
      signal_source: signalSource,
      mapping_method: isFrontal ? "threshold_based" : "risk_curve",
    },
    left_femur: {
      risk_score: Math.round(fLeftRisk * 100),
      risk_probability: fLeftRisk,
      risk_level: fLeftTier,
      ais_est: fLeftAis,
      criteria: {
        primary: isFrontal ? "Femur Force (L)" : "N/A",
        value: isFrontal ? (criteria.femur_left_peak_n || 0) : 0,
        unit: isFrontal ? "N" : "",
      },
      drivers: fLeftDrivers.length > 0 ? fLeftDrivers : ["nominal_knee_bolster_contact"],
      signal_source: signalSource,
      mapping_method: isFrontal ? "risk_curve" : "threshold_based",
    },
    right_femur: {
      risk_score: Math.round(fRightRisk * 100),
      risk_probability: fRightRisk,
      risk_level: fRightTier,
      ais_est: fRightAis,
      criteria: {
        primary: isFrontal ? "Femur Force (R)" : "N/A",
        value: isFrontal ? (criteria.femur_right_peak_n || 0) : 0,
        unit: isFrontal ? "N" : "",
      },
      drivers: fRightDrivers.length > 0 ? fRightDrivers : ["nominal_knee_bolster_contact"],
      signal_source: signalSource,
      mapping_method: isFrontal ? "risk_curve" : "threshold_based",
    },
  };
}

/**
 * Builds anatomical heatmap objects
 */
export function buildHeatmap(assessment: ReturnType<typeof buildAssessment>): HeatmapItem[] {
  return Object.entries(assessment).map(([id, p]) => {
    const intensity = p.risk_probability;
    return {
      region_id: id,
      intensity: intensity,
      color: getColorForIntensity(intensity),
      risk_level: p.risk_level,
      ais_est: p.ais_est,
      source_metric: p.criteria.primary,
      value: p.criteria.value,
      unit: p.criteria.unit
    };
  });
}

/**
 * Direct evaluation model: computes injuries directly from body sensors/loadcells signals
 */
export function analyzeCriteriaDirect(req: any): AnalysisResponse {
  const sig = req.signals as DirectSignals;
  const timeS = sig.time_ms.map((t) => t / 1000);
  const colType = req.scenario.collision_type;

  const warnings: string[] = [];

  // Compute head resultant magnitude in G
  const n = timeS.length;
  const headResAccelG = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    const ax = sig.head_ax_g[i] || 0;
    const ay = sig.head_ay_g[i] || 0;
    const az = sig.head_az_g[i] || 0;
    headResAccelG[i] = Math.sqrt(ax * ax + ay * ay + az * az);
  }

  const hic15Val = computeHic15({ timeS, resultantAccelG: headResAccelG });
  const head3ms = computeClip3ms(timeS, headResAccelG);

  const neckRes = computeNij({
    timeS,
    fzN: sig.neck_fz_n || new Array(n).fill(0),
    myNm: sig.neck_my_nm || new Array(n).fill(0),
  });

  const femurLeftVal = computeFemurPeak(sig.femur_left_n || []);
  const femurRightVal = computeFemurPeak(sig.femur_right_n || []);

  const dChestMax = sig.chest_deflection_mm ? Math.max(...sig.chest_deflection_mm) : 0;

  // Assembly criteria
  const crit: any = {
    hic15: hic15Val,
    head_3ms: head3ms,
    nij: neckRes.nij,
    peak_neck_tension_n: neckRes.peakTensionN,
    peak_neck_compression_n: neckRes.peakCompressionN,
    chest_deflection_mm: dChestMax,
    femur_left_peak_n: femurLeftVal,
    femur_right_peak_n: femurRightVal,
  };

  // If側碰, direct mode assumes chest deflection signal represents rib deflections
  if (colType === "side") {
    crit.side_rib_deflection_mm = dChestMax;
    // For direct side, we can also query abdomen/pelvis loads from secondary fields if present,
    // otherwise set default safe/smoke values
    crit.abdomen_force_n = sig.femur_left_n ? computeFemurPeak(sig.femur_left_n) * 0.8 : 1200;
    crit.pubic_force_n = sig.femur_right_n ? computeFemurPeak(sig.femur_right_n) * 0.9 : 2500;
  }

  const assessment = buildAssessment(colType, crit, "direct");
  const heatmap = buildHeatmap(assessment);

  // Compute joint integrated risk
  let jointRisk = 0;
  if (colType === "frontal") {
    jointRisk = 1 - (1 - headRiskVal(hic15Val)) * (1 - neckRes.nij * 0.25) * (1 - frontalChestAis3Risk(dChestMax)) * (1 - femurAis2Risk(femurLeftVal));
  } else {
    jointRisk = 1 - (1 - headRiskVal(hic15Val)) * (1 - sideChestAis3Risk(dChestMax)) * (1 - sideAbdomenAis3Risk(crit.abdomen_force_n)) * (1 - sidePelvisAis3Risk(crit.pubic_force_n));
  }
  jointRisk = Math.max(0, Math.min(1, jointRisk));

  return {
    scenario_summary: {
      collision_type: colType,
      vehicle_speed_kph: req.scenario.vehicle_speed_kph || 0,
      delta_v_kph: req.scenario.delta_v_kph || 0,
      joint_risk_prob: parseFloat(jointRisk.toFixed(4)),
    },
    criteria: crit,
    injury_assessment: assessment,
    heatmap,
    proxy_time_series: null,
    confidence: {
      overall: "high"
    },
    warnings,
    sources: [
      "criteria.pdf",
      "nhtsa-2006-26555-0114_0.pdf",
      "cp-005-data-acquisition-and-injury-calculation-v11.pdf"
    ]
  };
}

function headRiskVal(hic: number): number {
  return headAis3RiskFromHic15(hic);
}

/**
 * Proxy vehicle pulse mode: solves biomechanics mass spring models first,
 * then maps to injury criteria. Default mode for the user-interactive demo.
 */
export function analyzeVehiclePulseProxy(req: any): AnalysisResponse {
  const sig = req.signals as ProxySignals;
  const colType = req.scenario.collision_type;

  // 1. Normalize vehicle input pulse
  const normPulse = normalizePulse(
    colType,
    req.scenario.pdof_deg || 0,
    sig.time_ms || [],
    sig.accel_g || [],
    sig.pulse_axis || "x",
    req.scenario.delta_v_kph || 0,
    req.scenario.impact_side
  );

  const warnings = [...normPulse.warnings];
  let confidence: any = { overall: "medium" };
  let proxyTS: any = null;

  const crit: any = {};

  if (colType === "frontal") {
    // Solve head-neck-chest-femur response of 50th percentile male driver
    const frontalProxy = solveFrontalProxy(
      normPulse.timeS,
      normPulse.accelMps2,
      req.restraint || { belted: true }
    );

    proxyTS = frontalProxy;
    confidence.overall = "high";

    // Analyze maximum loads and criterion targets
    const hicVal = computeHic15({ 
      timeS: normPulse.timeS, 
      resultantAccelG: frontalProxy.headAccelAbsG 
    });
    const head3ms = computeClip3ms(normPulse.timeS, frontalProxy.headAccelAbsG);

    const neckRes = computeNij({
      timeS: normPulse.timeS,
      fzN: frontalProxy.neckFzN,
      myNm: frontalProxy.neckMyNm
    });

    const dChestMaxMm = Math.max(...frontalProxy.chestDeflectionM) * 1000;
    const flMaxN = computeFemurPeak(frontalProxy.femurLeftN);
    const frMaxN = computeFemurPeak(frontalProxy.femurRightN);

    crit.hic15 = hicVal;
    crit.head_3ms = head3ms;
    crit.nij = neckRes.nij;
    crit.peak_neck_tension_n = neckRes.peakTensionN;
    crit.peak_neck_compression_n = neckRes.peakCompressionN;
    crit.chest_deflection_mm = parseFloat(dChestMaxMm.toFixed(2));
    crit.femur_left_peak_n = flMaxN;
    crit.femur_right_peak_n = frMaxN;

  } else {
    // Solve side impact lateral model
    const sideProxy = solveSideProxy(
      normPulse.timeS,
      normPulse.accelMps2,
      sig.intrusion_cm,
      sig.door_velocity_mps,
      sig.door_contact_force_n
    );

    proxyTS = sideProxy;
    confidence = {
      overall: sideProxy.confidence.side_chest === "low" ? "low" : "medium",
      ...sideProxy.confidence
    };
    warnings.push(...sideProxy.warnings);

    // Scale peak vehicle side lateral acceleration as head proxy loading
    const rawHeadG = normPulse.accelMps2.map((a) => Math.abs(a) / 9.80665 * 1.1);
    const hicVal = computeHic15({
      timeS: normPulse.timeS,
      resultantAccelG: rawHeadG
    });
    const head3ms = computeClip3ms(normPulse.timeS, rawHeadG);

    const maxRibDeflectionMm = Math.max(...sideProxy.ribDeflectionM) * 1000;
    const maxAbdomenForceN = Math.max(...sideProxy.abdomenForceN);
    const maxPubicForceN = Math.max(...sideProxy.pubicForceN);

    crit.hic15 = hicVal;
    crit.head_3ms = head3ms;
    crit.nij = 0.12 * (Math.max(...rawHeadG) / 15); // scaled neck proxy in side impact
    crit.side_rib_deflection_mm = parseFloat(maxRibDeflectionMm.toFixed(2));
    crit.abdomen_force_n = parseFloat(maxAbdomenForceN.toFixed(1));
    crit.pubic_force_n = parseFloat(maxPubicForceN.toFixed(1));
  }

  const assessment = buildAssessment(colType, crit, "estimated");
  const heatmap = buildHeatmap(assessment);

  // Compute integrated joint risk
  let jointRisk = 0;
  if (colType === "frontal") {
    jointRisk = 1 - (1 - headRiskVal(crit.hic15)) * (1 - crit.nij * 0.25) * (1 - frontalChestAis3Risk(crit.chest_deflection_mm)) * (1 - femurAis2Risk(crit.femur_left_peak_n));
  } else {
    jointRisk = 1 - (1 - headRiskVal(crit.hic15)) * (1 - sideChestAis3Risk(crit.side_rib_deflection_mm)) * (1 - sideAbdomenAis3Risk(crit.abdomen_force_n)) * (1 - sidePelvisAis3Risk(crit.pubic_force_n));
  }
  jointRisk = Math.max(0, Math.min(1, jointRisk));

  return {
    scenario_summary: {
      collision_type: colType,
      vehicle_speed_kph: req.scenario.vehicle_speed_kph || 0,
      delta_v_kph: req.scenario.delta_v_kph || 0,
      joint_risk_prob: parseFloat(jointRisk.toFixed(4)),
    },
    criteria: crit,
    injury_assessment: assessment,
    heatmap,
    proxy_time_series: proxyTS,
    confidence,
    warnings,
    sources: [
      "criteria.pdf",
      "nhtsa-2006-26555-0114_0.pdf",
      "cp-005-data-acquisition-and-injury-calculation-v11.pdf"
    ]
  };
}
