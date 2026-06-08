import React from "react";
import { AnalysisResponse } from "../../domain/types";
import { HeatmapBody } from "../../components/HeatmapBody";
import { RiskSummary } from "../../components/RiskSummary";
import { CriteriaTable } from "../../components/CriteriaTable";
import { PulseChart } from "../../components/PulseChart";
import { AreaChart, FileDown, RotateCcw, AlertCircle, Sparkles } from "lucide-react";

interface StepResultsProps {
  response: AnalysisResponse | null;
  onRestart: () => void;
}

export function StepResults({ response, onRestart }: StepResultsProps) {
  const [selectedRegionId, setSelectedRegionId] = React.useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  if (!response) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white border border-slate-100 rounded-2xl shadow-sm min-h-[380px] text-center">
        <AlertCircle className="w-12 h-12 text-slate-300 stroke-[1.5]" />
        <p className="text-sm text-slate-400 mt-3">未收到分析计算响应结果，请返回上一步重新解算。</p>
        <button
          type="button"
          onClick={onRestart}
          className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 transition"
        >
          重新开始
        </button>
      </div>
    );
  }

  const { scenario_summary, criteria, injury_assessment, heatmap, proxy_time_series, confidence, warnings } = response;
  const colType = scenario_summary.collision_type;

  const handleExportJson = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `collision_injury_report_${colType}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      alert("导出失败");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & header widgets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black/10 pb-5">
        <div className="text-left">
          <h2 className="text-2xl font-display font-black tracking-tight text-slate-900 uppercase flex items-center gap-2">
            <span>分析结果报告 (Biomechanical Evaluation Report)</span>
            <Sparkles className="w-5 h-5 text-blue-600" />
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium select-none">
            测试场景：
            <span className="font-extrabold text-[#0f172a] uppercase ml-1">
              {colType === "frontal" ? "正面碰撞 Frontal 50%M" : "侧面碰撞 Side 50%M"}
            </span>
            <span className="mx-2 text-slate-350">•</span>
            撞速：
            <span className="font-extrabold text-[#0f172a] ml-1">{scenario_summary.vehicle_speed_kph} kph</span>
            <span className="mx-2 text-slate-350">•</span>
            速度变幅 ΔV：
            <span className="font-extrabold text-[#0f172a] ml-1">{scenario_summary.delta_v_kph} kph</span>
          </p>
        </div>

        {/* Action triggers */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-black border-2 border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all font-display font-black uppercase text-xs cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-black shrink-0" />
            <span>导出 JSON 报告</span>
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-black text-white border-2 border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all font-display font-black uppercase text-xs cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-white shrink-0" />
            <span>重新开始 (Reset)</span>
          </button>
        </div>
      </div>

      {/* Double Column Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Left Column: Visual Vector Heatmap (occupies 2/5 width) */}
        <div className="lg:col-span-2 h-full">
          <HeatmapBody
            regions={heatmap}
            selectedRegionId={selectedRegionId}
            onSelectRegion={setSelectedRegionId}
          />
        </div>

        {/* Right Column: Detailed Qualitative Summaries & Cards (occupies 3/5 width) */}
        <div className="lg:col-span-3">
          <RiskSummary
            assessment={injury_assessment}
            confidence={confidence}
            warnings={warnings}
            selectedRegionId={selectedRegionId}
            onSelectRegion={setSelectedRegionId}
            jointRiskProb={scenario_summary.joint_risk_prob}
          />
        </div>
      </div>

      {/* Collapsible Advanced Analytics Block */}
      <div className="bento-card bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-slate-100/70 border-b-2 border-black font-display font-black text-slate-900 text-xs uppercase tracking-wider transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <AreaChart className="w-4 h-4 text-blue-650 shrink-0" />
            <span>查看高级力学对齐波形与安全标准法证明明细 (Advanced Biomechanics)</span>
          </div>
          <span className="text-xs text-blue-650 font-black font-mono">
            {showAdvanced ? "[- CLOSE]" : "[+ EXPAND]"}
          </span>
        </button>

        {showAdvanced && (
          <div className="p-6 space-y-6 bg-white transition-all anim-fade-in">
            {/* Waveform curves */}
            {proxy_time_series ? (
              <PulseChart timeSeries={proxy_time_series} collisionType={colType} />
            ) : (
              <div className="text-center py-6 text-xs text-slate-450 font-mono font-bold bg-slate-50 border-2 border-dashed border-slate-300">
                当前运行在 direct 模式，无估算波形回执。
              </div>
            )}

            {/* Criteria regulatory calculations table */}
            <CriteriaTable criteria={criteria} collisionType={colType} />
          </div>
        )}
      </div>
    </div>
  );
}
