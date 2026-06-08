import React from "react";
import { CollisionType } from "../../domain/types";
import { ShieldAlert, Split, ArrowLeftRight, HelpCircle } from "lucide-react";

interface StepScenarioProps {
  collisionType: CollisionType;
  onChangeCollisionType: (type: CollisionType) => void;
  impactSide: "left" | "right" | "none" | null;
  onChangeImpactSide: (side: "left" | "right" | "none" | null) => void;
}

export function StepScenario({
  collisionType,
  onChangeCollisionType,
  impactSide,
  onChangeImpactSide,
}: StepScenarioProps) {
  return (
    <div className="space-y-6">
      <div className="text-left py-1">
        <h2 className="text-2xl font-display font-black tracking-tight text-slate-900 uppercase">Step 1: 请选择车辆碰撞发生边界场景</h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          不同的碰撞受载力学路径决定了假人保护装置和损伤风险模型的主要求解方法。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Frontal Collision */}
        <div
          onClick={() => {
            onChangeCollisionType("frontal");
            onChangeImpactSide(null);
          }}
          className={`p-6 border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[190px] ${
            collisionType === "frontal"
              ? "border-black bg-blue-100 text-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -translate-x-1 -translate-y-1"
              : "border-black bg-white hover:bg-slate-50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="p-3 border-2 border-black bg-blue-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <ShieldAlert className="w-6 h-6 shrink-0" />
            </div>
            {collisionType === "frontal" && (
              <span className="bento-badge bg-black text-white px-2.5 py-1">
                SELECTED
              </span>
            )}
          </div>
          
          <div className="mt-5">
            <h3 className="font-display font-black text-slate-900 text-base uppercase tracking-tight">正面碰撞 (Frontal)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-normal font-medium">
              车辆前方遭受撞击。此场景主要核算头部HIC阻尼减速、颈部Nij拉压及胸腔受安全带紧压位移，大腿股骨轴向反力。
            </p>
          </div>
        </div>

        {/* Card 2: Side Impact */}
        <div
          onClick={() => {
            onChangeCollisionType("side");
            onChangeImpactSide("left"); // default to left struck side
          }}
          className={`p-6 border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[190px] ${
            collisionType === "side"
              ? "border-black bg-amber-100 text-slate-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -translate-x-1 -translate-y-1"
              : "border-black bg-white hover:bg-slate-50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="p-3 border-2 border-black bg-amber-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Split className="w-6 h-6 shrink-0" />
            </div>
            {collisionType === "side" && (
              <span className="bento-badge bg-black text-white px-2.5 py-1">
                SELECTED
              </span>
            )}
          </div>

          <div className="mt-5">
            <h3 className="font-display font-black text-slate-900 text-base uppercase tracking-tight">侧向碰撞 (Side)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-normal font-medium">
              车辆受到侧翼（B柱或车门柱）的强烈撞压。主要关注车门侵入速度引发的胸胁骨压缩、腹部积载负合和骨盆耻骨合力。
            </p>
          </div>
        </div>
      </div>

      {/* Conditional settings for struck side in side impact */}
      {collisionType === "side" && (
        <div className="p-5 bg-amber-50/80 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-4 anim-fade-in">
          <div className="flex items-center gap-2 text-slate-900 font-display font-black text-xs uppercase tracking-wider">
            <ArrowLeftRight className="w-4 h-4 text-slate-700" />
            <span>请选定乘员舱中驾驶假人遭受撞击的侧翼：</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onChangeImpactSide("left")}
              className={`px-4 py-2 text-xs border-2 transition-all font-display font-black ${
                impactSide === "left"
                  ? "bg-black text-white border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-white text-slate-700 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-50"
              }`}
            >
              左侧遭受撞击 (Left Side)
            </button>
            <button
              type="button"
              onClick={() => onChangeImpactSide("right")}
              className={`px-4 py-2 text-xs border-2 transition-all font-display font-black ${
                impactSide === "right"
                  ? "bg-black text-white border-black shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-white text-slate-700 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-50"
              }`}
            >
              右侧遭受撞击 (Right Side)
            </button>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">
            撞击侧决定侧气帘展开策略以及门板对乘员左/右骨盆、大腿等部位的受力影响方向。
          </p>
        </div>
      )}

      {/* Helpful background info */}
      <div className="bg-orange-50 border-2 border-black p-4 flex items-start gap-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
        <HelpCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-[11px] text-slate-600 leading-normal font-medium">
          车辆安全性设计高度依赖于碰撞力的引导规划。正面碰撞中，乘员受到前围档阻和座椅安全套的双向约束；
          而在侧面碰撞中，由于车门至假人体表的横向横移安全腔隙极窄（通常仅有5~15cm），其损伤往往对侵入率以及侧气垫卸载能力具有极高的物理敏感性。
        </p>
      </div>
    </div>
  );
}
