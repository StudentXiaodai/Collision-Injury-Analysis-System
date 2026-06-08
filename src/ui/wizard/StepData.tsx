import React from "react";
import { HelpCircle, ChevronRight, Upload, FileJson, AlertTriangle } from "lucide-react";

interface StepDataProps {
  collisionType: "frontal" | "side";
  speedKph: number;
  onChangeSpeedKph: (val: number) => void;
  deltaVKph: number;
  onChangeDeltaVKph: (val: number) => void;
  pdofDeg: number;
  onChangePdofDeg: (val: number) => void;
  timeMs: number[];
  accelG: number[];
  onChangeTelemetry: (time: number[], accel: number[], intrusion: number[] | null) => void;
  intrusionCm: number[] | null;
}

export function StepData({
  collisionType,
  speedKph,
  onChangeSpeedKph,
  deltaVKph,
  onChangeDeltaVKph,
  pdofDeg,
  onChangePdofDeg,
  timeMs,
  accelG,
  onChangeTelemetry,
  intrusionCm,
}: StepDataProps) {
  const [profiles, setProfiles] = React.useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);

  // Raw text editors for telemetry pasting/editing
  const [timeRaw, setTimeRaw] = React.useState("");
  const [accelRaw, setAccelRaw] = React.useState("");
  const [intrusionRaw, setIntrusionRaw] = React.useState("");

  // Populate dynamic text editor inputs when coordinates change
  React.useEffect(() => {
    setTimeRaw(timeMs.join(", "));
    setAccelRaw(accelG.join(", "));
    if (intrusionCm) {
      setIntrusionRaw(intrusionCm.join(", "));
    } else {
      setIntrusionRaw("");
    }
  }, [timeMs, accelG, intrusionCm]);

  // Load available profiles from server
  React.useEffect(() => {
    fetch("/api/v1/golden-cases")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProfiles(data);
          // Auto-select standard moderate case as default if matching type
          const matched = data.find((p) => p.collision_type === collisionType && p.id.includes("moderate"));
          if (matched) {
            handleLoadProfile(matched.id);
          } else if (data.length > 0) {
            handleLoadProfile(data[0].id);
          }
        }
      })
      .catch((err) => console.error("Failed to load scenario profiles:", err));
  }, [collisionType]);

  const handleLoadProfile = async (id: string) => {
    if (!id) return;
    setLoading(true);
    setSelectedProfileId(id);
    try {
      const res = await fetch(`/api/v1/golden-cases/${id}`);
      const data = await res.json();
      if (data && data.scenario) {
        onChangeSpeedKph(data.scenario.vehicle_speed_kph || 50);
        onChangeDeltaVKph(data.scenario.delta_v_kph || 40);
        onChangePdofDeg(data.scenario.pdof_deg || 0);

        if (data.signals) {
          onChangeTelemetry(
            data.signals.time_ms || [],
            data.signals.accel_g || [],
            data.signals.intrusion_cm || null
          );
        }
      }
    } catch (e) {
      console.error("Failed to fetch target telemetry preset:", e);
    } finally {
      setLoading(false);
    }
  };

  // Process text editors and commit back to parent
  const handleApplyCustomData = () => {
    try {
      const parsedTime = timeRaw
        .split(/[\s,;]+/)
        .map((x) => parseFloat(x))
        .filter((n) => !isNaN(n));
      const parsedAccel = accelRaw
        .split(/[\s,;]+/)
        .map((x) => parseFloat(x))
        .filter((n) => !isNaN(n));

      let parsedIntrusion: number[] | null = null;
      if (collisionType === "side" && intrusionRaw.trim()) {
        parsedIntrusion = intrusionRaw
          .split(/[\s,;]+/)
          .map((x) => parseFloat(x))
          .filter((n) => !isNaN(n));
      }

      if (parsedTime.length === 0 || parsedTime.length !== parsedAccel.length) {
        alert("请输入具有相同长度的时间序列和加速度信号数组！");
        return;
      }

      if (parsedIntrusion && parsedIntrusion.length !== parsedTime.length) {
        alert("门板侵入量的点数必须与时间/加速度列长度完全相同！");
        return;
      }

      onChangeTelemetry(parsedTime, parsedAccel, parsedIntrusion);
      alert("自定义碰撞荷载信号配置载入成功！");
    } catch (e) {
      alert("解析输入数据失败，请确认输入的坐标格式！");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-left py-1">
        <h2 className="text-2xl font-display font-black tracking-tight text-slate-900 uppercase font-bold">Step 2: 输入车体冲击力学波形数据</h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          指定宏观碰撞碰撞车速、Delta-V 及各方向角 (PDOF)，并导入或定制车身加速度脉冲 (Pulse)。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Quick Scenario Presets */}
        <div className="bento-card bg-slate-50 p-5 lg:col-span-1 space-y-4">
          <div className="flex items-center gap-2 text-slate-900">
            <FileJson className="w-5 h-5 text-blue-600" />
            <h3 className="font-display font-black tracking-tight text-sm uppercase">快速载入金样例波形</h3>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
            为您预置了中国保险汽车安全指数 (C-IASI) / 国标新车安全评价规程 (C-NCAP) 
            典型测试标准的真实传感器荷载基线。
          </p>

          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              请选择测试波形预置：
            </label>
            <select
              title="测试波形预置"
              value={selectedProfileId}
              onChange={(e) => handleLoadProfile(e.target.value)}
              className="w-full bg-white border-2 border-black p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
            >
              <option value="">-- 请选择预置样例 --</option>
              {profiles
                .filter((p) => p.collision_type === collisionType)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id.replace(/-/g, " ").toUpperCase()} ({p.speed}km/h)
                  </option>
                ))}
            </select>
          </div>

          <div className="border-t-2 border-black/10 pt-4 space-y-3">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              场景关键能量指标：
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-2.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase block mb-0.5">撞击前速</span>
                <span className="font-mono font-black text-slate-900">{speedKph} km/h</span>
              </div>
              <div className="bg-white p-2.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase block mb-0.5">速度变化 (ΔV)</span>
                <span className="font-mono font-black text-slate-900">{deltaVKph} km/h</span>
              </div>
            </div>
            <div className="bg-white p-2.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center">
              <span className="text-[9px] text-slate-500 font-bold uppercase block mb-0.5">撞击主方向角 (PDOF)</span>
              <span className="font-mono font-black text-slate-900">{pdofDeg} 度 (Deg)</span>
            </div>
          </div>
        </div>

        {/* Right column: Parameter fields and text table editors */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Edit speed parameters manually */}
          <div className="bento-card bg-white p-5 space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-black/5 pb-2.5">
              <ChevronRight className="w-4 h-4 text-slate-900" />
              <h3 className="font-display font-black text-slate-900 text-xs uppercase tracking-tight">调置宏观能量参数 / Boundary Values</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                  车辆主车速 (kph):
                </label>
                <input
                  type="number"
                  value={speedKph}
                  onChange={(e) => onChangeSpeedKph(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-50 border-2 border-black px-3 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                  设计速度变幅 ΔV (kph):
                </label>
                <input
                  type="number"
                  value={deltaVKph}
                  onChange={(e) => onChangeDeltaVKph(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-50 border-2 border-black px-3 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                  撞击角 PDOF (deg):
                </label>
                <input
                  type="number"
                  value={pdofDeg}
                  onChange={(e) => onChangePdofDeg(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border-2 border-black px-3 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section: Telemetry Signal Array pasting */}
          <div className="bento-card bg-white p-5 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black/5 pb-2.5">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-slate-900" />
                <h3 className="font-display font-black text-slate-900 text-xs uppercase tracking-tight">自定义车辆减加速度信号</h3>
              </div>
              <button
                type="button"
                onClick={handleApplyCustomData}
                className="text-[10px] bg-black text-white px-3 py-1.5 font-bold border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              >
                应用自定义波形
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                  时间轴 (Time Sequence, ms — 逗号分割)：
                </label>
                <textarea
                  title="时间轴数据"
                  value={timeRaw}
                  onChange={(e) => setTimeRaw(e.target.value)}
                  className="w-full h-12 bg-slate-50 border-2 border-black p-2 text-[11px] font-mono leading-relaxed outline-none resize-none focus:bg-white font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                  车体减速度信号 (Vehicle Deceleration, g — 逗号分割)：
                </label>
                <textarea
                  title="减速度方向数据"
                  value={accelRaw}
                  onChange={(e) => setAccelRaw(e.target.value)}
                  className="w-full h-12 bg-slate-50 border-2 border-black p-2 text-[11px] font-mono leading-relaxed outline-none resize-none focus:bg-white font-semibold text-slate-900"
                />
              </div>

              {collisionType === "side" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                      左门板动态侵入量 (Intrusion Distance, cm)：
                    </label>
                    {!intrusionRaw.trim() && (
                      <span className="bento-badge bg-yellow-300 text-black px-1.5 py-0.5 rounded flex items-center gap-1 font-bold animate-pulse">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        LOW CONFIDENCE ACTIVE
                      </span>
                    )}
                  </div>
                  <textarea
                    title="门板向内侵入量数据"
                    value={intrusionRaw}
                    onChange={(e) => setIntrusionRaw(e.target.value)}
                    placeholder="例如: 0, 1.5, 4.2, 7.8, 12, 11, 8.5, 5.0, 1"
                    className="w-full h-12 bg-slate-50 border-2 border-black p-2 text-[11px] font-mono leading-relaxed outline-none resize-none focus:bg-white font-semibold text-slate-900"
                  />
                </div>
              )}
            </div>

            <div className="flex items-start gap-2.5 text-[10px] text-slate-600 bg-blue-50/50 border border-black p-3.5 leading-relaxed font-medium">
              <HelpCircle className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
              <span>
                输入信号必须大小保持一致（目前已载入 <strong>{timeMs.length}</strong> 点）。
                在侧面碰撞分析下，门板向内侧侵入速度和挤压形变量是胸腹致命伤的决定因，不输入侵入时态信号也可以计算，但伤害评估置信度将被降为 <strong>LOW (Est)</strong>。
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
