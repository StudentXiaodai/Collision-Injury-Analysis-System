import React from "react";
import { HeatmapItem } from "../domain/types";

interface HeatmapBodyProps {
  regions: HeatmapItem[];
  selectedRegionId: string | null;
  onSelectRegion: (id: string | null) => void;
}

export function HeatmapBody({ regions, selectedRegionId, onSelectRegion }: HeatmapBodyProps) {
  // Index region details quickly
  const regionMap = React.useMemo(() => {
    return new Map(regions.map((r) => [r.region_id, r]));
  }, [regions]);

  const getRegionColor = (id: string, defaultColor: string = "#e2e8f0"): string => {
    const item = regionMap.get(id);
    return item ? item.color : defaultColor;
  };

  const getRegionLevel = (id: string): string => {
    const item = regionMap.get(id);
    return item ? `${item.risk_level.toUpperCase()} (AIS ${item.ais_est})` : "NO DATA";
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full min-h-[460px]">
      <div className="text-center mb-5">
        <h3 className="font-display font-black text-[#0f172a] text-base uppercase tracking-tight">乘员伤亡分布热力拓扑</h3>
        <p className="font-sans text-xs text-slate-500 mt-1 font-medium select-none">
          点击或悬停各个身体部位来校核物理载荷时序明细
        </p>
      </div>

      <div className="relative w-full max-w-[280px] flex justify-center">
        {/* Render a polished, natural human silhouette of a driver sitting down */}
        <svg
          viewBox="0 0 200 350"
          className="w-full h-[320px] select-none"
        >
          {/* Defs for glossy glow effects or shading */}
          <defs>
            <radialGradient id="shadowGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Seat / Cabin backing structure silhouette (cool slate background accent) */}
          <path
            d="M 20 280 L 50 280 L 120 240 Q 140 210 135 150 L 138 60 Q 150 40 140 30"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="16"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.25"
          />
          <path
            d="M 50 280 L 30 330"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.25"
          />

          {/* Base shadow glow */}
          <ellipse cx="100" cy="330" rx="60" ry="10" fill="url(#shadowGlow)" />

          {/* 1. HEAD Region - More natural head shape */}
          <g
            id="heatmap-head"
            className="cursor-pointer transition-all duration-300 hover:scale-[1.02] origin-[120px_45px]"
            onClick={() => onSelectRegion(selectedRegionId === "head" ? null : "head")}
          >
            <title>HEAD: {getRegionLevel("head")}</title>
            <path
              d="M 125,20 
                 C 110,18 95,25 88,40 
                 C 84,50 86,60 88,70
                 C 95,78 110,80 125,78
                 C 138,76 145,60 143,42
                 C 141,28 135,22 125,20 Z"
              fill={getRegionColor("head")}
              className={`transition-all duration-300 ${
                selectedRegionId === "head" ? "stroke-black stroke-4 scale-103 filter drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" : "stroke-black hover:stroke-black hover:stroke-3"
              }`}
            />
            {/* Simple eye for better human look */}
            <circle cx="98" cy="45" r="2.5" fill="#000000" />
          </g>

          {/* 2. NECK Region - More natural neck shape */}
          <g
            id="heatmap-neck"
            className="cursor-pointer transition-all duration-300 origin-[115px_85px]"
            onClick={() => onSelectRegion(selectedRegionId === "neck" ? null : "neck")}
          >
            <title>NECK: {getRegionLevel("neck")}</title>
            <path
              d="M 108,78 L 122,78 L 120,98 L 110,98 Z"
              fill={getRegionColor("neck")}
              className={`transition-all duration-300 ${
                selectedRegionId === "neck" ? "stroke-black stroke-4 scale-103 filter drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" : "stroke-black hover:stroke-black hover:stroke-3"
              }`}
            />
          </g>

          {/* 3. CHEST / THORAX Region - More natural chest shape */}
          <g
            id="heatmap-chest"
            className="cursor-pointer transition-all duration-300 origin-[115px_140px]"
            onClick={() => onSelectRegion(selectedRegionId === "chest" ? null : "chest")}
          >
            <title>CHEST: {getRegionLevel("chest")}</title>
            <path
              d="M 105,98 
                 Q 90,102 82,120 
                 Q 78,140 80,160
                 L 110,165
                 Q 125,160 128,140
                 L 128,115
                 Q 125,102 105,98 Z"
              fill={getRegionColor("chest")}
              className={`transition-all duration-300 ${
                selectedRegionId === "chest" ? "stroke-black stroke-4 scale-103 filter drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" : "stroke-black hover:stroke-black hover:stroke-3"
              }`}
            />
          </g>

          {/* 4. ABDOMEN Region - More natural abdomen shape */}
          <g
            id="heatmap-abdomen"
            className="cursor-pointer transition-all duration-300 origin-[108px_195px]"
            onClick={() => onSelectRegion(selectedRegionId === "abdomen" ? null : "abdomen")}
          >
            <title>ABDOMEN: {getRegionLevel("abdomen")}</title>
            <path
              d="M 80,160 
                 Q 78,185 84,205 
                 L 115,208 
                 Q 122,190 122,165 
                 L 110,165 Z"
              fill={getRegionColor("abdomen")}
              className={`transition-all duration-300 ${
                selectedRegionId === "abdomen" ? "stroke-black stroke-4 scale-103 filter drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" : "stroke-black hover:stroke-black hover:stroke-3"
              }`}
            />
          </g>

          {/* 5. PELVIS Region - More natural pelvis shape */}
          <g
            id="heatmap-pelvis"
            className="cursor-pointer transition-all duration-300 origin-[102px_235px]"
            onClick={() => onSelectRegion(selectedRegionId === "pelvis" ? null : "pelvis")}
          >
            <title>PELVIS: {getRegionLevel("pelvis")}</title>
            <path
              d="M 84,205 
                 Q 88,235 78,250 
                 L 118,252 
                 Q 125,232 115,208 Z"
              fill={getRegionColor("pelvis")}
              className={`transition-all duration-300 ${
                selectedRegionId === "pelvis" ? "stroke-black stroke-4 scale-103 filter drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" : "stroke-black hover:stroke-black hover:stroke-3"
              }`}
            />
          </g>

          {/* 6. LEFT FEMUR / THIGH Region - More natural thigh shape */}
          <g
            id="heatmap-left_femur"
            className="cursor-pointer transition-all duration-300 origin-[68px_280px]"
            onClick={() => onSelectRegion(selectedRegionId === "left_femur" ? null : "left_femur")}
          >
            <title>LEFT FEMUR: {getRegionLevel("left_femur")}</title>
            <path
              d="M 78,250
                 C 62,255 48,260 38,275
                 C 32,285 35,295 45,298
                 C 58,300 90,295 118,252
                 L 118,252 Z"
              fill={getRegionColor("left_femur")}
              className={`transition-all duration-300 ${
                selectedRegionId === "left_femur" ? "stroke-black stroke-4 scale-103 filter drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" : "stroke-black hover:stroke-black hover:stroke-3"
              }`}
            />
          </g>

          {/* 7. RIGHT FEMUR / THIGH Region - More natural thigh shape */}
          <g
            id="heatmap-right_femur"
            className="cursor-pointer transition-all duration-300 origin-[60px_295px]"
            onClick={() => onSelectRegion(selectedRegionId === "right_femur" ? null : "right_femur")}
          >
            <title>RIGHT FEMUR: {getRegionLevel("right_femur")}</title>
            <path
              d="M 72,258
                 C 56,263 42,268 32,283
                 C 26,293 28,305 38,308
                 C 52,310 84,305 110,260 Z"
              fill={getRegionColor("right_femur")}
              className={`transition-all duration-300 ${
                selectedRegionId === "right_femur" ? "stroke-black stroke-4 scale-103 filter drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" : "stroke-black hover:stroke-black hover:stroke-3"
              }`}
              opacity="0.85"
            />
          </g>

          {/* Left leg lower calf (static decorative, completes visual sanity) */}
          <path
            d="M 38,275 L 30,325 Q 28,332 22,331 Q 16,330 18,320 L 26,275 Z"
            fill="#e2e8f0"
            stroke="#000000"
            strokeWidth="1.5"
            opacity="0.8"
          />

          {/* Simple nose and mouth for better human appearance */}
          <path d="M 92,52 Q 90,56 94,58" fill="none" stroke="#000000" strokeWidth="1.2" />
          <path d="M 90,62 Q 95,66 100,62" fill="none" stroke="#000000" strokeWidth="1" />
        </svg>
      </div>

      {/* Interactive Legend block */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[10px] text-slate-800 border-t-2 border-black/10 pt-4 w-full mt-2 font-bold select-none uppercase tracking-wide">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-[#22c55e] border border-black" />
          <span>Low (0-20)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-[#84cc16] border border-black" />
          <span>Minor (20-40)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-[#eab308] border border-black" />
          <span>Moderate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-[#f97316] border border-black" />
          <span>Severe</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-[#ef4444] border border-black" />
          <span>Critical (80+)</span>
        </div>
      </div>
    </div>
  );
}
