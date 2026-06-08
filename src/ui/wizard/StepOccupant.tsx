import React from "react";
import { RestraintConfig } from "../../domain/types";
import { User, ShieldCheck, ChevronRight, HelpCircle } from "lucide-react";

interface StepOccupantProps {
  collisionType: "frontal" | "side";
  restraint: RestraintConfig;
  onChangeRestraint: (val: RestraintConfig) => void;
}

export function StepOccupant({ collisionType, restraint, onChangeRestraint }: StepOccupantProps) {
  const isFrontal = collisionType === "frontal";

  // Quick state update helper
  const updateField = (key: keyof RestraintConfig, val: any) => {
    onChangeRestraint({
      ...restraint,
      [key]: val,
    });
  };

  // 同时更新多个字段的辅助函数（避免连续调用 updateField 导致状态覆盖）
  const updateFields = (updates: Partial<RestraintConfig>) => {
    onChangeRestraint({
      ...restraint,
      ...updates,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-left py-1">
        <h2 className="text-2xl font-display font-black tracking-tight text-slate-900 uppercase font-bold">Step 3: 确定假体乘员属性与舱面约束</h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          确定假人体型模态，并在安全带、带扣气爆收紧锁及各种气囊释放模块中确认其工作阈值。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Occupant profile details card */}
        <div className="bento-card bg-slate-50 p-5 lg:col-span-1 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 border-b-2 border-black/5 pb-3">
            <User className="w-5 h-5 text-blue-605" />
            <h3 className="font-display font-black tracking-tight text-sm uppercase">驾驶舱乘员模型 (Dummy Dummy)</h3>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">基准乘员尺码：</span>
              <span className="text-xs font-black text-slate-900 block mt-1">
                50th Percentile Adult Male (HIII-50th / WorldSID 50M)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px] pt-1">
              <div className="bg-white p-2.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-[9px] text-slate-500 font-bold uppercase block">名义假体质量</span>
                <span className="font-mono font-black text-slate-900 block mt-0.5">78.0 kg</span>
              </div>
              <div className="bg-white p-2.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-[9px] text-slate-500 font-bold uppercase block">名义直立身长</span>
                <span className="font-mono font-black text-slate-900 block mt-0.5">175.0 cm</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 font-medium leading-relaxed pt-1">
              目前版本已锁定世界公认用于前向碰撞认证的 <strong>Hybrid III 50th</strong> 及侧碰认证的 <strong>WorldSID 50百分位</strong> 成年男性中等体型假人。
              该假人的力学生物界限代表了乘用车开发中90%以上的能量测试覆盖率。
            </p>
          </div>
        </div>

        {/* Right Column: Cabin Restraints Checklist */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bento-card bg-white p-5 space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-black/5 pb-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-display font-black text-slate-900 text-xs uppercase tracking-tight">前排安全装配配置 / Restraints Dashboard</h3>
            </div>

            {/* Config Item 1: Safety belt active */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 gap-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">主安全带约束状态：</label>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => updateFields({ belted: true, belt_type: "lap_shoulder" })}
                    className={`px-3.5 py-2 border-2 text-xs font-display font-black transition-all ${
                      restraint.belted
                        ? "bg-emerald-300 border-black text-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]"
                        : "bg-white border-black text-slate-600 hover:bg-slate-50 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                    }`}
                  >
                    已系紧主安全带 (Belted)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateFields({ belted: false, belt_type: "none" })}
                    className={`px-3.5 py-2 border-2 text-xs font-display font-black transition-all ${
                      !restraint.belted
                        ? "bg-rose-300 border-black text-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]"
                        : "bg-white border-black text-slate-600 hover:bg-slate-50 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                    }`}
                  >
                    未系安全带 (Unbelted)
                  </button>
                </div>
              </div>

              {/* Only show belt tuning if belted is active */}
              {restraint.belted && (
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">
                      安全带预紧回缩气爆器 (Pretensioner):
                    </label>
                    <div className="flex items-center mt-1">
                      <input
                        type="checkbox"
                        id="pretens"
                        checked={!!restraint.pretensioner}
                        onChange={(e) => updateField("pretensioner", e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-2 border-black focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="pretens" className="text-xs text-slate-800 ml-2 font-bold cursor-pointer uppercase font-display">
                        前气爆收紧锁处于正常装调状态
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">
                      织带限力泄油阀阈值 (Load Limiter, kN)：
                    </label>
                    <select
                      title="织带限力泄油阀阈值"
                      value={restraint.load_limiter_kN || 4.0}
                      onChange={(e) => updateField("load_limiter_kN", parseFloat(e.target.value) || 4.0)}
                      className="bg-white border-2 border-black p-2.5 text-xs font-mono font-black text-slate-900 outline-none focus:border-blue-500"
                    >
                      <option value="3.0">3.0 kN (低载荷泄力型)</option>
                      <option value="4.0">4.0 kN (标准经典限力)</option>
                      <option value="5.0">5.0 kN (重载或美标限力)</option>
                      <option value="999.0">无限制 (硬锁卷收器)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Config Item 2: Airbags based on collision type */}
            <div className="border-t-2 border-black/5 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {isFrontal ? (
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">
                    方向盘主正面防护气囊 (Frontal Airbag)：
                  </label>
                  <label className="inline-flex items-center cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={!!restraint.frontal_airbag_deployed}
                      onChange={(e) => updateField("frontal_airbag_deployed", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="relative w-10 h-6 bg-slate-200 border-2 border-black rounded-none peer-focus:outline-none peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-black after:border-2 after:rounded-none after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-400"></div>
                    <span className="ms-3 text-xs font-bold text-slate-900 uppercase font-display">正常引爆 (Airbag Active)</span>
                  </label>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">
                    侧向引气帘模块 (Side Canopy Bag)：
                  </label>
                  <label className="inline-flex items-center cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={!!restraint.side_airbag_deployed}
                      onChange={(e) => updateField("side_airbag_deployed", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="relative w-10 h-6 bg-slate-200 border-2 border-black rounded-none peer-focus:outline-none peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-black after:border-2 after:rounded-none after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400"></div>
                    <span className="ms-3 text-xs font-bold text-slate-900 uppercase font-display">正常引爆 (Airbag Active)</span>
                  </label>
                </div>
              )}

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">
                  座椅纵向定滑轨挡位 (Seat Track Position)：
                </label>
                <div className="flex items-center gap-2 mt-1">
                  {["front", "mid", "rear"].map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => updateField("seat_track_position", pos)}
                      className={`px-3 py-1.5 border-2 text-xs font-display font-black transition-all ${
                        restraint.seat_track_position === pos
                          ? "bg-black border-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          : "bg-white border-black text-slate-600 hover:bg-slate-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                      }`}
                    >
                      {pos === "front" && "前置"}
                      {pos === "mid" && "中置"}
                      {pos === "rear" && "后置"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border-2 border-black p-4 flex items-start gap-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <HelpCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-slate-600 leading-normal font-medium">
              <strong>物理常识：</strong>当正面碰撞不系安全带或不展开气囊时，
              惯性载荷会驱使人体前移大约 40~50 厘米，最终与偏硬的转向管柱或挡风玻璃发生无缓冲刚性触碰 (G-load spike)。
              带有限力阀（如限位4kN，代表骨盆及织带张力不超过4000N）和预收紧锁定器的安全带可大幅控制人体躯干前移姿态，减少二次剧痛。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
