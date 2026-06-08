import React from "react";
import { Loader2, CheckCircle2, Shield, Settings, Server } from "lucide-react";

interface StepRunProps {
  onCompleteAnalysis: () => void;
}

export function StepRun({ onCompleteAnalysis }: StepRunProps) {
  const [phase, setPhase] = React.useState(0);
  const [statusText, setStatusText] = React.useState("正在初始化解算器资源...");

  React.useEffect(() => {
    const phases = [
      {
        text: "正在读取车辆测试加速度脉冲并插值重采样 (dt = 0.0005 s)...",
        duration: 900,
      },
      {
        text: "正在计算主方向角 (PDOF) 各轴分量，积分速度检查 (Delta-V)...",
        duration: 900,
      },
      {
        text: "正在联立方程，求解各部位质量-弹簧阻尼 (ODE) 时序分量...",
        duration: 1000,
      },
      {
        text: "正在核对 HIC15 区间积分极大值，评定 Nij 颈载复合张压曲面...",
        duration: 800,
      },
      {
        text: "正在加载 NCAP 生物学损伤风险模型，整合 AIS 伤残特征图谱...",
        duration: 700,
      },
    ];

    let currentPhase = 0;
    const runNextPhase = () => {
      if (currentPhase < phases.length) {
        setStatusText(phases[currentPhase].text);
        setPhase(currentPhase + 1);
        setTimeout(() => {
          currentPhase++;
          runNextPhase();
        }, phases[currentPhase].duration);
      } else {
        // Completed all computational phases, proceed to results
        onCompleteAnalysis();
      }
    };

    runNextPhase();
  }, [onCompleteAnalysis]);

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-h-[380px] text-center space-y-6">
      <div className="relative flex items-center justify-center">
        {/* Core rotating loader visual wrapper with retro black border styling */}
        <Loader2 className="w-16 h-16 text-black animate-spin stroke-[2]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Shield className="w-6 h-6 text-blue-600 animate-pulse" />
        </div>
      </div>

      <div className="space-y-2 max-w-sm">
        <h3 className="font-display font-black text-[#0f172a] text-lg uppercase tracking-tight">解算动力学生物学模型中</h3>
        <p className="text-xs text-blue-600 font-bold font-mono h-4">{statusText}</p>
        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
          基于多层时格数值积分，正在求解碰撞周期。
        </p>
      </div>

      {/* Progress list ticks */}
      <div className="w-full max-w-xs space-y-3.5 text-left border-t-2 border-black/10 pt-5">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wide">
          <span className="text-slate-500 flex items-center gap-2">
            <Server className="w-4 h-4 text-black shrink-0" />
            <span>输入载荷插值与方向对齐</span>
          </span>
          {phase >= 2 ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <span className="text-[10px] text-blue-600 font-black animate-pulse font-mono">CALC</span>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wide">
          <span className="text-slate-500 flex items-center gap-2">
            <Settings className="w-4 h-4 text-black shrink-0" />
            <span>假体质量弹簧 ODE 联立方程组</span>
          </span>
          {phase >= 4 ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : phase >= 3 ? (
            <span className="text-[10px] text-amber-500 font-black animate-pulse font-mono">CRUNCH</span>
          ) : (
            <span className="w-2.5 h-2.5 rounded-none border border-black bg-slate-200" />
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wide">
          <span className="text-slate-500 flex items-center gap-2">
            <Shield className="w-4 h-4 text-black shrink-0" />
            <span>核心损伤准则与NCAP风险图景</span>
          </span>
          {phase >= 5 ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <span className="w-2.5 h-2.5 rounded-none border border-black bg-slate-200" />
          )}
        </div>
      </div>
    </div>
  );
}
