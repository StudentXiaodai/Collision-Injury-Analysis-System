import React from "react";
import { Info, HelpCircle } from "lucide-react";

interface CriteriaTableProps {
  criteria: any;
  collisionType: "frontal" | "side";
}

export function CriteriaTable({ criteria, collisionType }: CriteriaTableProps) {
  const isFrontal = collisionType === "frontal";

  // Detailed standard mapping matching regulatory thresholds
  const metrics = React.useMemo(() => {
    if (isFrontal) {
      return [
        {
          key: "hic15",
          label: "HIC15 (头部受力指标)",
          value: criteria.hic15 || 0,
          unit: "—",
          limit: 700,
          desc: "超过 700 意味着头部遭受重创、颅脑AIS3+风险极高。",
          source: "NHTSA FMVSS 208 / NCAP (2008)"
        },
        {
          key: "head_3ms",
          label: "头部 3ms 累计减速度",
          value: criteria.head_3ms || 0,
          unit: "g",
          limit: 80,
          desc: "常压冲击下的惯性负荷，头部累积受载不可超 80g。",
          source: "NHTSA NCAP"
        },
        {
          key: "nij",
          label: "Nij (颈部受载复合指标)",
          value: criteria.nij || 0,
          unit: "—",
          limit: 1.0,
          desc: "融合颈部轴向拉压和前后弯矩的复合伤害准则，极限值为1.0。",
          source: "NHTSA FMVSS 208"
        },
        {
          key: "peak_neck_tension_n",
          label: "颈部大张力",
          value: criteria.peak_neck_tension_n || 0,
          unit: "N",
          limit: 4170,
          desc: "拉伸轴向载荷极值。50百阶成年男性安全极限为4170N。",
          source: "NHTSA / Eppinger et al."
        },
        {
          key: "peak_neck_compression_n",
          label: "颈部大压缩力",
          value: criteria.peak_neck_compression_n || 0,
          unit: "N",
          limit: 4000,
          desc: "压迫式颈椎受载荷保护上限为4000N。",
          source: "NHTSA"
        },
        {
          key: "chest_deflection_mm",
          label: "胸廓最大压缩位移",
          value: criteria.chest_deflection_mm || 0,
          unit: "mm",
          limit: 50,
          desc: "胸骨在安全带拉阻下的变形量，推荐不超 42mm (优秀)，法规上限 50/63mm。",
          source: "NHTSA FMVSS 208 / Euro NCAP"
        },
        {
          key: "femur_left_peak_n",
          label: "左股骨最大轴向压缩力",
          value: criteria.femur_left_peak_n || 0,
          unit: "N",
          limit: 10000,
          desc: "大腿受仪表盘撞击压迫拉力，保护上限为 10kN (10000N)。",
          source: "NHTSA FMVSS 208"
        },
        {
          key: "femur_right_peak_n",
          label: "右股骨最大轴向压缩力",
          value: criteria.femur_right_peak_n || 0,
          unit: "N",
          limit: 10000,
          desc: "右侧大腿受轴向挤压极限值为 10kN。",
          source: "NHTSA FMVSS 208"
        }
      ];
    } else {
      // Side impact criteria
      return [
        {
          key: "hic15",
          label: "HIC15 (头部受力指标)",
          value: criteria.hic15 || 0,
          unit: "—",
          limit: 700,
          desc: "侧门内饰、玻璃或柱状碰撞物引发的头部回弹受力指标。",
          source: "Euro NCAP / FMVSS 214"
        },
        {
          key: "side_rib_deflection_mm",
          label: "侧肋大压缩变形量",
          value: criteria.side_rib_deflection_mm || 0,
          unit: "mm",
          limit: 42,
          desc: "外板侧碰挤压胸部肋骨位移量，WorldSID极限保护值为 42mm。",
          source: "Euro NCAP WorldSID"
        },
        {
          key: "abdomen_force_n",
          label: "腹部复合峰值力",
          value: criteria.abdomen_force_n || 0,
          unit: "N",
          limit: 2500,
          desc: "侧门中下部饰板挤压下腹和内脏受力，超过2.51kN极易引发严重内脏出血。",
          source: "Euro NCAP Side Impact AOP"
        },
        {
          key: "pubic_force_n",
          label: "耻骨联合最大合力",
          value: criteria.pubic_force_n || 0,
          unit: "N",
          limit: 6000,
          desc: "骨盆受座垫侧围和车门防撞梁撞击，耻骨联合保护限额是6000N。",
          source: "Euro NCAP Side Impact / FMVSS 214"
        }
      ];
    }
  }, [criteria, isFrontal]);

  return (
    <div className="bento-card bg-white p-5">
      <div className="flex items-center gap-2 border-b-2 border-black/15 pb-3.5 mb-4">
        <Info className="w-5 h-5 text-blue-600 shrink-0" />
        <h3 className="font-display font-black text-slate-900 text-xs uppercase tracking-tight">生物力学主导因子危害核算明细 (Biomechanics Log)</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b-2 border-black text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-2">评测荷载指标 (Biomechanical Criteria)</th>
              <th className="py-3 px-2 text-right">实际求解值</th>
              <th className="py-3 px-2 text-center">安全参考上限</th>
              <th className="py-3 px-2">法规与标准源</th>
              <th className="py-3 px-2">局部载荷状态</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black/5">
            {metrics.map((item) => {
              const parsedVal = typeof item.value === "number" ? item.value : parseFloat(item.value);
              const exceeded = parsedVal > item.limit;
              const ratio = parsedVal / item.limit;

              let statusText = "符合要求 (Optimal)";
              let statusClass = "text-black bg-emerald-300 border-2 border-black";
              if (exceeded) {
                statusText = "超出限额 (Critical)";
                statusClass = "text-black bg-rose-300 border-2 border-black";
              } else if (ratio >= 0.7) {
                statusText = "接近临界 (Warning)";
                statusClass = "text-black bg-amber-300 border-2 border-black";
              }

              return (
                <tr key={item.key} className="hover:bg-slate-50/50 transition">
                  <td className="py-4 px-2">
                    <span className="font-sans font-extrabold text-slate-900 block">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block max-w-sm leading-relaxed mt-1">
                      {item.desc}
                    </span>
                  </td>
                  <td className="py-4 px-2 text-right font-mono font-black text-slate-950 text-sm">
                    {item.value} <span className="text-[10px] font-bold text-slate-500 ml-0.5">{item.unit}</span>
                  </td>
                  <td className="py-4 px-2 text-center font-mono font-bold text-slate-700">
                    {item.limit} {item.unit}
                  </td>
                  <td className="py-4 px-2 font-display font-black text-[10px] text-slate-600 uppercase tracking-wide">
                    {item.source}
                  </td>
                  <td className="py-4 px-2">
                    <span className={`inline-block px-2.5 py-1 text-[9px] font-mono tracking-wider font-black uppercase text-center ${statusClass}`}>
                      {statusText}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 p-4 border-2 border-dashed border-black mt-5">
        <h4 className="text-slate-900 font-display font-black text-xs mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
          <HelpCircle className="w-4 h-4 text-black shrink-0" />
          <span>引用法规与合规说明 (Regulatory Baseline Background)</span>
        </h4>
        <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
          上述限额主要参考自 <strong>NHTSA Federal Motor Vehicle Safety Standards (FMVSS 208 / 214)</strong>、
          美国联邦碰撞保护评测量级以及 <strong>Euro NCAP (CP-005 Data Acquisition and Injury Calculation)</strong> 
          成年乘员伤害保护验证协议手册。标定数据由 50百分位男性驾驶假体（Hybrid III / WorldSID 假人）极限基准载荷模型换算。
        </p>
      </div>
    </div>
  );
}
