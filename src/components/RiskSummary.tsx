import React from "react";
import { RegionAssessment, HeatmapItem } from "../domain/types";
import { Shield, AlertTriangle, CheckCircle, Info } from "lucide-react";

interface RiskSummaryProps {
  assessment: {
    head: RegionAssessment;
    neck: RegionAssessment;
    chest: RegionAssessment;
    abdomen: RegionAssessment;
    pelvis: RegionAssessment;
    left_femur: RegionAssessment;
    right_femur: RegionAssessment;
  };
  confidence: {
    overall: "low" | "medium" | "high";
    [key: string]: any;
  };
  warnings: string[];
  selectedRegionId: string | null;
  onSelectRegion: (id: string | null) => void;
  jointRiskProb: number;
}

// Map technical driver names to clean user-friendly messages
const DRIVER_TRANSLATIONS: { [key: string]: string } = {
  hic15_exceeds_threshold: "HIC15指标超标：头部减速度在15ms区间内累计过高",
  high_inertial_impact: "高惯性冲击：未系安全带或未触发气囊导致二次碰撞头部受载严重",
  nij_exceeds_critical_intercept: "Nij弯曲/拉伸极限超标：颈部受剪切拉伸复合力矩",
  high_axial_tensile_tension: "颈部高张压力：拉伸轴向力超过极限临界点",
  sternal_displacement_high: "胸廓位移严重：安全带拉力或高载荷限力器引发胸部高度压缩",
  high_inertial_thoracic_deceleration: "胸椎惯性高加速度：极高的车身瞬间撞击力回馈",
  femur_axial_tension_high: "股骨瞬间轴向力超标：膝盖碰撞中控台下挡板",
  nominal_restraint_buffer: "约束保护缓冲器状态理想：气囊与限力安全带配合大幅降低了荷载",
  nominal_neck_structural_stiffness: "颈椎受载处于正常弹性形变缓冲带内",
  nominal_impact_attenuation_absorption: "胸廓约束吸收能量效率表现良好",
  nominal_contact_cushioning: "软内饰接触及发泡缓冲层起到了良好的降载效果",
  nominal_knee_bolster_contact: "膝部气囊或软质Bolster挡板卸油阀表现理想",
  high_lateral_contact_pressure_abdominal: "侧向腹部接触挤压：车门侵入速度过高直接压迫腹部器官",
  pubic_symphysis_load_exceeds_safe_limit: "耻骨联合侧向荷载超标：骨盆侧向强力挤压，容易引发生物学损伤",
  rib_deflection_exceeds_standard: "侧胁骨折压缩严重：侧面车体强烈挤压变形波及胸腔"
};

export function RiskSummary({
  assessment,
  confidence,
  warnings,
  selectedRegionId,
  onSelectRegion,
  jointRiskProb,
}: RiskSummaryProps) {
  // Compute overall statistics
  const maxAIS = React.useMemo(() => {
    return Math.max(...Object.values(assessment).map((a) => a.ais_est));
  }, [assessment]);

  const worstRegions = React.useMemo(() => {
    const sorted = Object.entries(assessment)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.risk_probability - a.risk_probability);
    return sorted.filter((r) => r.risk_probability >= 0.20);
  }, [assessment]);

  let severityTitle = "低损伤风险 (Minor)";
  let severityTheme = "bg-emerald-300 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
  if (maxAIS >= 3 || jointRiskProb >= 0.6) {
    severityTitle = "高损伤风险 (Critical)";
    severityTheme = "bg-rose-300 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
  } else if (maxAIS >= 1 || jointRiskProb >= 0.2) {
    severityTitle = "中度损伤风险 (Moderate)";
    severityTheme = "bg-amber-300 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Overall Severity Dashboard card */}
      <div className={`p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${severityTheme}`}>
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase font-black text-slate-800 block mb-1">
            综合乘员评价
          </span>
          <h2 className="text-xl font-display font-black tracking-tight uppercase">{severityTitle}</h2>
          <p className="text-xs mt-1.5 font-semibold">
            集成多部位联合风险模型求解所得的联合致命伤亡概率 (AIS3+)：
            <span className="font-mono font-black underline decoration-2">{(jointRiskProb * 100).toFixed(1)}%</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-center px-4 py-2 bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-[10px] font-mono font-black block">MAX AIS</div>
            <div className="text-xl font-black font-mono">AIS {maxAIS}</div>
          </div>
        </div>
      </div>

      {/* 2. Low Confidence & Warning Alert Banners */}
      {confidence.overall === "low" && (
        <div className="p-4 bg-amber-100 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-black mt-0.5 shrink-0" />
          <div>
            <h4 className="text-slate-900 font-display font-black text-xs uppercase tracking-wide">低计算置信度提醒 (Low Confidence Estimate)</h4>
            <p className="text-[11px] text-slate-705 mt-1 leading-relaxed font-semibold">
              侧向碰撞缺乏门板内部侵入速度、侵入量时序参数。侧碰胸、腹和骨盆伤害是高动态接触事件，
              空载车体加速度不能真实代表约束接触，当前结果基于标定默认值估算。请在Step 2添加侵入时序数据。
            </p>
          </div>
        </div>
      )}

      {warnings.length > 0 && warnings.includes("pulse_delta_v_mismatch") && (
        <div className="p-3 bg-blue-50 border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] flex items-start gap-2.5">
          <Info className="w-4 h-4 text-slate-950 mt-0.5 shrink-0" />
          <p className="text-[11px] text-slate-700 leading-normal font-semibold">
            碰撞脉冲信号积分核算的速度变化 (Delta-V) 与您在Step 2表格或摘要填写的参数相差 
            &gt;15%。求解器已自动依照脉冲实际波形积分大小计算。
          </p>
        </div>
      )}

      {/* 3. Dynamic Region detail card based on Heatmap selection */}
      <div className="bento-card bg-slate-50 p-5">
        {selectedRegionId ? (
          <div>
            <div className="flex items-center justify-between border-b-2 border-black/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="bento-badge px-2 py-0.5 bg-black text-white">
                  部位诊断
                </span>
                <h3 className="text-slate-900 font-display font-black text-xs uppercase">
                  {selectedRegionId === "head" && "头部 HEAD"}
                  {selectedRegionId === "neck" && "颈部 NECK"}
                  {selectedRegionId === "chest" && "胸部 CHEST / THORAX"}
                  {selectedRegionId === "abdomen" && "腹部 ABDOMEN"}
                  {selectedRegionId === "pelvis" && "骨盆 PELVIS"}
                  {selectedRegionId === "left_femur" && "左大腿 L_FEMUR"}
                  {selectedRegionId === "right_femur" && "右大腿 R_FEMUR"}
                </h3>
              </div>
              <button
                type="button"
                className="text-[10px] font-bold text-slate-500 hover:text-black uppercase tracking-wider underline underline-offset-2"
                onClick={() => onSelectRegion(null)}
              >
                重置选择 [X]
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white p-3 border-2 border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] text-center">
                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">局部伤亡率</span>
                <span className="text-xl font-black font-mono text-slate-950 block mt-1">
                  {assessment[selectedRegionId as keyof typeof assessment].risk_score}%
                </span>
              </div>
              <div className="bg-white p-3 border-2 border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] text-center">
                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">伤残分级</span>
                <span className="text-xl font-black font-mono text-slate-950 block mt-1">
                  AIS {assessment[selectedRegionId as keyof typeof assessment].ais_est}
                </span>
              </div>
            </div>

            <div className="space-y-3.5">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">核心驱动力学指标：</span>
                <div className="flex items-center justify-between text-xs text-slate-900 bg-white px-3 py-2.5 border-2 border-black">
                  <span className="font-bold">
                    {assessment[selectedRegionId as keyof typeof assessment].criteria.primary}
                  </span>
                  <span className="font-mono font-black underline decoration-2">
                    {assessment[selectedRegionId as keyof typeof assessment].criteria.value}{" "}
                    {assessment[selectedRegionId as keyof typeof assessment].criteria.unit}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">生物力学损害因 (Drivers)：</span>
                <div className="flex flex-col gap-2">
                  {assessment[selectedRegionId as keyof typeof assessment].drivers.map((driver) => (
                    <div
                      key={driver}
                      className="text-[11px] text-slate-700 bg-white p-2 border border-black flex items-center gap-2 font-medium"
                    >
                      <span className="w-2 h-2 bg-blue-550 border border-black shrink-0" />
                      <span>{DRIVER_TRANSLATIONS[driver] || driver}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-4 pt-3 border-t-2 border-black/5">
                <span>信号来源: 
                  <span className="text-slate-900 font-extrabold ml-1 font-mono">
                    {assessment[selectedRegionId as keyof typeof assessment].signal_source === "direct" ? "DUMMY TEST" : "PROXY ESTIMATE"}
                  </span>
                </span>
                <span>映射公式: 
                  <span className="text-slate-900 font-extrabold ml-1 font-mono">
                    {assessment[selectedRegionId as keyof typeof assessment].mapping_method === "risk_curve" ? "RISK CURVE" : "STEP THRESHOLD"}
                  </span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 flex flex-col items-center justify-center space-y-2">
            <Info className="w-8 h-8 text-black stroke-[1.5]" />
            <p className="text-xs text-slate-600 font-medium max-w-[240px] leading-relaxed">
              请点击左侧三维热力拓扑上的特定身体部位，或者在下方卡片中点击放大其受损因子的力学计算细节。
            </p>
          </div>
        )}
      </div>

      {/* 4. Complete Body Parts List */}
      <div className="space-y-3">
        <span className="text-[10px] font-mono tracking-widest uppercase font-black text-slate-500 block">
          受力解组部位列表 (Body Topology Metrics)
        </span>
        <div className="grid grid-cols-1 gap-2.5">
          {Object.entries(assessment).map(([id, p]) => {
            const isSelected = selectedRegionId === id;
            const regionName = {
              head: "头部 Head",
              neck: "颈部 Neck",
              chest: "胸部 Chest / Thorax",
              abdomen: "腹部 Abdomen",
              pelvis: "骨盆 Pelvis",
              left_femur: "左股骨 L-Femur",
              right_femur: "右股骨 R-Femur",
            }[id] || id;

            let badgeColor = "bg-white border-green-500 text-green-700";
            if (p.risk_level === "high") badgeColor = "bg-rose-100 border-rose-500 text-rose-800";
            else if (p.risk_level === "moderate") badgeColor = "bg-amber-100 border-amber-500 text-amber-800";

            return (
              <div
                key={id}
                onClick={() => onSelectRegion(isSelected ? null : id)}
                className={`p-3.5 border-2 cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? "bg-blue-50 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5"
                    : "bg-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[3.5px_3.5px_0px_0px_rgba(0,0,0,1)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 border border-black shrink-0"
                    style={{
                      backgroundColor:
                        p.risk_level === "high"
                          ? "#f87171"
                          : p.risk_level === "moderate"
                          ? "#fbbf24"
                          : "#34d399",
                    }}
                  />
                  <div>
                    <span className="text-xs font-display font-black text-slate-900 block">
                      {regionName}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono font-medium block mt-0.5">
                      {p.criteria.primary}: {p.criteria.value} {p.criteria.unit}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 border border-black font-mono font-black text-[9px] uppercase tracking-wider ${badgeColor}`}>
                    AIS {p.ais_est}
                  </span>
                  <span className="text-xs font-black font-mono text-slate-900 w-12 text-right">
                    {p.risk_score}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
