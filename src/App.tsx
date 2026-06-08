import React from "react";
import { CollisionType, RestraintConfig, AnalysisResponse } from "./domain/types";
import { StepScenario } from "./ui/wizard/StepScenario";
import { StepData } from "./ui/wizard/StepData";
import { StepOccupant } from "./ui/wizard/StepOccupant";
import { StepRun } from "./ui/wizard/StepRun";
import { StepResults } from "./ui/wizard/StepResults";
import { ShieldAlert, ArrowLeft, ArrowRight, RefreshCw, Layers, ShieldCheck, Heart } from "lucide-react";

export default function App() {
  // Global Wizard State
  const [currentStep, setCurrentStep] = React.useState<number>(1);
  const [apiError, setApiError] = React.useState<string | null>(null);

  // Scenario configuration state (Step 1)
  const [collisionType, setCollisionType] = React.useState<CollisionType>("frontal");
  const [impactSide, setImpactSide] = React.useState<"left" | "right" | "none" | null>(null);

  // Telemetry signals state (Step 2)
  const [speedKph, setSpeedKph] = React.useState<number>(50);
  const [deltaVKph, setDeltaVKph] = React.useState<number>(40);
  const [pdofDeg, setPdofDeg] = React.useState<number>(0);

  // Template baseline moderate frontal values as initial load
  const [timeMs, setTimeMs] = React.useState<number[]>([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
  const [accelG, setAccelG] = React.useState<number[]>([0, -3, -8, -14, -24, -20, -13, -7, -3, -1, 0]);
  const [intrusionCm, setIntrusionCm] = React.useState<number[] | null>(null);

  // Restraint configuration state (Step 3)
  const [restraint, setRestraint] = React.useState<RestraintConfig>({
    belted: true,
    belt_type: "lap_shoulder",
    frontal_airbag_deployed: true,
    side_airbag_deployed: false,
    pretensioner: true,
    load_limiter_kN: 4.0,
    seat_track_position: "mid",
  });

  // Solver analysis outputs
  const [responsePayload, setResponsePayload] = React.useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);

  // Reset standard attributes when switching collision directional categories
  React.useEffect(() => {
    if (collisionType === "side") {
      setImpactSide("left");
      setPdofDeg(90);
      setIntrusionCm([0, 1.2, 3.5, 6.8, 12.4, 15.2, 13.5, 9.8, 5.5, 2.1, 0.5]);
      setRestraint({
        belted: true,
        belt_type: "lap_shoulder",
        frontal_airbag_deployed: false,
        side_airbag_deployed: true,
        pretensioner: true,
        load_limiter_kN: 4.0,
        seat_track_position: "mid",
      });
    } else {
      setImpactSide(null);
      setPdofDeg(0);
      setIntrusionCm(null);
      setRestraint({
        belted: true,
        belt_type: "lap_shoulder",
        frontal_airbag_deployed: true,
        side_airbag_deployed: false,
        pretensioner: true,
        load_limiter_kN: 4.0,
        seat_track_position: "mid",
      });
    }
  }, [collisionType]);

  // Dispatch analysis request POST
  const triggerSolvers = async () => {
    setLoading(true);
    setApiError(null);
    try {
      // Standardize payload models
      const signals = collisionType === "frontal"
        ? {
            time_ms: timeMs,
            accel_g: accelG,
            pulse_axis: "x" as "x" | "y"
          }
        : {
            time_ms: timeMs,
            accel_g: accelG,
            pulse_axis: "y" as "x" | "y",
            intrusion_cm: intrusionCm
          };

      const payload = {
        mode: "vehicle_pulse_proxy",
        occupant_model: "50th_percentile_male",
        scenario: {
          collision_type: collisionType,
          impact_side: impactSide,
          vehicle_speed_kph: speedKph,
          delta_v_kph: deltaVKph,
          pdof_deg: pdofDeg
        },
        signals: signals,
        restraint: restraint
      };

      const res = await fetch("/api/v1/injury-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.ok) {
        setResponsePayload(data);
        setCurrentStep(4); // Go to Step 4 simulator progress loader
      } else {
        setApiError(data.error || "Biomechanics processing endpoint failure");
      }
    } catch (e: any) {
      setApiError(e.message || "Failed to make communication connection with processing endpoint");
    } finally {
      setLoading(false);
    }
  };

  const restartOverviewFlow = () => {
    setCurrentStep(1);
    setResponsePayload(null);
    setApiError(null);
    // Reload template frontal moderate defaults
    setCollisionType("frontal");
    setSpeedKph(50);
    setDeltaVKph(40);
    setPdofDeg(0);
    setTimeMs([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    setAccelG([0, -3, -8, -14, -24, -20, -13, -7, -3, -1, 0]);
    setIntrusionCm(null);
    setRestraint({
      belted: true,
      belt_type: "lap_shoulder",
      frontal_airbag_deployed: true,
      side_airbag_deployed: false,
      pretensioner: true,
      load_limiter_kN: 4.0,
      seat_track_position: "mid",
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between selection:bg-yellow-200">
      {/* 1. Header Banner */}
      <header className="bg-white border-b-2 border-black sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-white border-2 border-black flex items-center justify-center font-display font-black text-xl italic shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] select-none">
              CS
            </div>
            <div>
              <span className="font-display font-black text-slate-900 text-lg tracking-tight uppercase block">
                COLLISION INJURY<span className="text-blue-600">.v2</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono tracking-widest block uppercase mt-0.5 font-bold">
                PHYSICS & BIOMECHANICAL SOLVER PLATFORM
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">DEMO MODEL RUN</p>
              <p className="text-[9px] text-slate-400 font-mono">STATUS: ONLINE / STABLE</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-yellow-300 text-black border-2 border-black flex items-center justify-center font-mono font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none">
              AC
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Wizard container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        
        {/* Step Indicator Bar (only visible during setup phases) */}
        {currentStep <= 3 && (
          <div className="bento-card bg-slate-50 p-4">
            <nav aria-label="Progress" className="w-full">
              <ol className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-3">
                {[
                  { step: 1, label: "碰撞场景", info: "正面或侧向受载" },
                  { step: 2, label: "冲击数据", info: "车速及减速度脉冲" },
                  { step: 3, label: "乘员约束", info: "安全带与气囊配置" },
                ].map((item) => {
                  const isActive = currentStep === item.step;
                  const isCompleted = currentStep > item.step;

                  return (
                    <li key={item.step} className="flex-1 w-full">
                      <button
                        type="button"
                        disabled={!isCompleted && !isActive}
                        onClick={() => setCurrentStep(item.step)}
                        className={`w-full text-left p-4 border-2 transition-all flex items-center gap-3.5 ${
                          isActive
                            ? "bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            : isCompleted
                            ? "bg-blue-50/60 border-black text-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-50 cursor-pointer"
                            : "bg-slate-100/40 border-slate-300 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        <span className={`w-7 h-7 border-2 font-mono font-black flex items-center justify-center shrink-0 text-xs ${
                          isActive
                            ? "bg-yellow-300 text-black border-black"
                            : isCompleted
                            ? "bg-blue-500 text-white border-black"
                            : "bg-slate-200 text-slate-400 border-slate-300"
                        }`}>
                          0{item.step}
                        </span>
                        <div>
                          <span className="text-xs font-display font-black uppercase tracking-tight block">{item.label}</span>
                          <span className="text-[10px] block opacity-80 mt-0.5 font-medium">{item.info}</span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>
        )}

        {/* API Error banner */}
        {apiError && (
          <div className="bento-card bg-red-50 border-2 border-black p-5 flex items-start gap-4">
            <ShieldAlert className="w-6 h-6 text-red-650 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-display font-black text-red-950 uppercase text-xs tracking-wide">生物工程解算通路故障</h3>
              <p className="text-xs text-red-700 leading-relaxed font-mono">{apiError}</p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={triggerSolvers}
                  className="px-3.5 py-1.5 bg-red-500 hover:bg-red-400 text-white border-2 border-black font-black text-[10px] tracking-wider uppercase transition flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>立即重试</span>
                </button>
                <button
                  type="button"
                  onClick={() => setApiError(null)}
                  className="text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-black ml-2"
                >
                  [忽略警告]
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stage View Router Box */}
        <div className="bento-card bg-white p-6 md:p-8 flex-1">
          {currentStep === 1 && (
            <StepScenario
              collisionType={collisionType}
              onChangeCollisionType={setCollisionType}
              impactSide={impactSide}
              onChangeImpactSide={setImpactSide}
            />
          )}

          {currentStep === 2 && (
            <StepData
              collisionType={collisionType}
              speedKph={speedKph}
              onChangeSpeedKph={setSpeedKph}
              deltaVKph={deltaVKph}
              onChangeDeltaVKph={setDeltaVKph}
              pdofDeg={pdofDeg}
              onChangePdofDeg={setPdofDeg}
              timeMs={timeMs}
              accelG={accelG}
              onChangeTelemetry={(time, accel, intrusion) => {
                setTimeMs(time);
                setAccelG(accel);
                setIntrusionCm(intrusion);
              }}
              intrusionCm={intrusionCm}
            />
          )}

          {currentStep === 3 && (
            <StepOccupant
              collisionType={collisionType}
              restraint={restraint}
              onChangeRestraint={setRestraint}
            />
          )}

          {currentStep === 4 && (
            <StepRun onCompleteAnalysis={() => setCurrentStep(5)} />
          )}

          {currentStep === 5 && (
            <StepResults
              response={responsePayload}
              onRestart={restartOverviewFlow}
            />
          )}
        </div>

        {/* 3. Bottom Wizard Nav controls */}
        {currentStep <= 3 && (
          <div className="flex items-center justify-between border-t-2 border-black pt-6 mt-2">
            <div>
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="bento-button bento-button-sec px-5 py-2.5 text-xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>上一步 (Back)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={restartOverviewFlow}
                  className="text-xs font-black uppercase tracking-wider text-slate-500 hover:text-black underline underline-offset-4 decoration-2"
                >
                  清空并重置输入
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500 font-extrabold font-mono tracking-wider uppercase hidden sm:inline-block">
                PROGRESS STAGE: 0{currentStep} / 03
              </span>
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    // Quick validation checks on Step 2
                    if (currentStep === 2 && timeMs.length === 0) {
                      alert("请先配置有效的碰撞减速度时序数据！");
                      return;
                    }
                    setCurrentStep(currentStep + 1);
                  }}
                  className="bento-button px-6 py-2.5 text-xs flex items-center gap-1.5"
                >
                  <span>下一步 (Next)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={triggerSolvers}
                  className="bento-button bg-blue-600 hover:bg-blue-500 border-2 border-black text-white px-7 py-2.5 text-xs flex items-center gap-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>正在求解碰撞 (CRUNCHING)...</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-4 h-4 text-white" />
                      <span>开始解算物理模型</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 4. Footer credits */}
      <footer className="bg-white border-t-2 border-black py-8 mt-12 text-center text-[10px] text-slate-500 space-y-3 shadow-[0_-4px_0px_0px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 border border-black animate-ping"></div>
          <span className="font-display font-black text-xs uppercase tracking-tight text-slate-900">Biomechanical Research Standard FMVSS 208/214</span>
        </div>
        <p className="max-w-2xl mx-auto leading-normal px-4">
          本软件为前排乘员力学碰撞防护设计方案的可视化原型。
          所有减速、压缩、受载变形指标均由物理公式及弹簧动力学方程组多格常微积分算得。
        </p>
        <p className="font-mono text-[9px] uppercase tracking-widest text-slate-400 mt-2">
          Developed under Safety Engineering Guidelines © 2026 HELIX SYSTEMS GLOBAL
        </p>
      </footer>
    </div>
  );
}

function Loader2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
