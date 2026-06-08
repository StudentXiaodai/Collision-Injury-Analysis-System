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
        {/* Render a highly polished, stylized medical-silhouette vector of a driver sitting down */}
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

          {/* 1. HEAD Region */}
          <g
            id="heatmap-head"
            className="cursor-pointer transition-all duration-300 hover:scale-[1.02] origin-[125px_50px]"
            onClick={() => onSelectRegion(selectedRegionId === "head" ? null : "head")}
          >
            <title>HEAD: {getRegionLevel("head")}</title>
            {/* Draw sitting head profile facing left */}
            <path
              d="M 125,25 
                 C 112,23 98,28 94,42 
                 C 92,48 93,54 86,58
                 C 82,60 81,64 86,66
                 C 90,67 95,65 98,69
                 C 102,74 115,75 125,72
                 C 134,69 135,55 136,45
                 C 137,35 133,26 125,25 Z"
              fill={getRegionColor("head")}
              className={`transition-all duration-300 ${
                selectedRegionId === "head" ? "stroke-black stroke-4 scale-103 filter drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" : "stroke-black hover:stroke-black hover:stroke-3"
              }`}
            />
          </g>

          {/* 2. NECK Region */}
          <g
            id="heatmap-neck"
            className="cursor-pointer transition-all duration-300 origin-[118px_82px]"
            onClick={() => onSelectRegion(selectedRegionId === "neck" ? null : "neck")}
          >
            <title>NECK: {getRegionLevel("neck")}</title>
            <path
              d="M 112,72 L 126,71 L 123,94 L 111,92 Z"
              fill={getRegionColor("neck")}
              className={`transition-all duration-300 ${
                selectedRegionId === "neck" ? "stroke-black stroke-4 scale-103 filter drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" : "stroke-black hover:stroke-black hover:stroke-3"
              }`}
            />
          </g>

          {/* 3. CHEST / THORAX Region */}
          <g
            id="heatmap-chest"
            className="cursor-pointer transition-all duration-300 origin-[115px_145px]"
            onClick={() => onSelectRegion(selectedRegionId === "chest" ? null : "chest")}
          >
            <title>CHEST: {getRegionLevel("chest")}</title>
            <path
              d="M 111,92 
                 Q 90,105 85,128 
                 Q 80,150 82,175
                 L 115,185
                 Q 125,185 126,170
                 L 128,110
                 Q 125,93 111,92 Z"
              fill={getRegionColor("chest")}
              className={`transition-all duration-300 ${
                selectedRegionId === "chest" ? "stroke-black stroke-4 scale-103 filter drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" : "stroke-black hover:stroke-black hover:stroke-3"
              }`}
            />
          </g>

          {/* 4. ABDOMEN Region */}
          <g
            id="heatmap-abdomen"
            className="cursor-pointer transition-all duration-300 origin-[110px_205px]"
            onClick={() => onSelectRegion(selectedRegionId === "abdomen" ? null : "abdomen")}
          >
            <title>ABDOMEN: {getRegionLevel("abdomen")}</title>
            <path
              d="M 82,175 
                 Q 80,195 86,215 
                 L 118,218 
                 Q 125,200 125,185 
                 L 115,185 Z"
              fill={getRegionColor("abdomen")}
              className={`transition-all duration-300 ${
                selectedRegionId === "abdomen" ? "stroke-black stroke-4 scale-103 filter drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" : "stroke-black hover:stroke-black hover:stroke-3"
              }`}
            />
          </g>

          {/* 5. PELVIS Region */}
          <g
            id="heatmap-pelvis"
            className="cursor-pointer transition-all duration-300 origin-[105px_240px]"
            onClick={() => onSelectRegion(selectedRegionId === "pelvis" ? null : "pelvis")}
          >
            <title>PELVIS: {getRegionLevel("pelvis")}</title>
            <path
              d="M 86,215 
                 Q 92,250 80,265 
                 L 116,268 
                 Q 126,245 118,218 Z"
              fill={getRegionColor("pelvis")}
              className={`transition-all duration-300 ${
                selectedRegionId === "pelvis" ? "stroke-black stroke-4 scale-103 filter drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" : "stroke-black hover:stroke-black hover:stroke-3"
              }`}
            />
          </g>

          {/* 6. LEFT FEMUR / THIGH Region */}
          <g
            id="heatmap-left_femur"
            className="cursor-pointer transition-all duration-300 origin-[65px_275px]"
            onClick={() => onSelectRegion(selectedRegionId === "left_femur" ? null : "left_femur")}
          >
            <title>LEFT FEMUR: {getRegionLevel("left_femur")}</title>
            {/* Thigh extending forward left-down towards knee */}
            <path
              d="M 80,265
                 C 68,268 45,264 35,275
                 C 28,284 32,295 42,294
                 C 55,293 88,290 116,268
                 L 116,268 Z"
              fill={getRegionColor("left_femur")}
              className={`transition-all duration-300 ${
                selectedRegionId === "left_femur" ? "stroke-black stroke-4 scale-103 filter drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" : "stroke-black hover:stroke-black hover:stroke-3"
              }`}
            />
          </g>

          {/* 7. RIGHT FEMUR / THIGH Region */}
          <g
            id="heatmap-right_femur"
            className="cursor-pointer transition-all duration-300 origin-[55px_290px]"
            onClick={() => onSelectRegion(selectedRegionId === "right_femur" ? null : "right_femur")}
          >
            <title>RIGHT FEMUR: {getRegionLevel("right_femur")}</title>
            {/* Secondary offset thigh for depth */}
            <path
              d="M 75,271
                 C 61,274 42,271 31,284
                 C 25,294 30,305 40,303
                 C 54,302 82,298 108,272 Z"
              fill={getRegionColor("right_femur")}
              className={`transition-all duration-300 ${
                selectedRegionId === "right_femur" ? "stroke-black stroke-4 scale-103 filter drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" : "stroke-black hover:stroke-black hover:stroke-3"
              }`}
              opacity="0.85"
            />
          </g>

          {/* Left leg lower calf (static decorative, completes visual sanity) */}
          <path
            d="M 35,275 L 26,325 Q 24,332 18,331 Q 12,330 14,320 L 22,275 Z"
            fill="#e2e8f0"
            stroke="#000000"
            strokeWidth="1.5"
            opacity="0.8"
          />

          {/* Decorative body system wire connectors */}
          <circle cx="114" cy="46" r="3" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
          <circle cx="118" cy="82" r="3" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
          <circle cx="106" cy="140" r="3" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
          <circle cx="102" cy="198" r="3" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
          <circle cx="98" cy="242" r="3" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
          <circle cx="56" cy="278" r="3" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
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
