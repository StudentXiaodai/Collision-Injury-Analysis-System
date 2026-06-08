import React from "react";

interface PulseChartProps {
  timeSeries: {
    timeS: number[];
    [key: string]: number[];
  } | null;
  collisionType: "frontal" | "side";
}

export function PulseChart({ timeSeries, collisionType }: PulseChartProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(500);
  const height = 220;

  React.useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setWidth(Math.max(200, entry.contentRect.width));
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  if (!timeSeries || !timeSeries.timeS || timeSeries.timeS.length === 0) {
    return (
      <div className="flex items-center justify-center h-[240px] bg-slate-50 border-2 border-dashed border-black">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">正在等待分析求解产生波形曲线...</span>
      </div>
    );
  }

  const isFrontal = collisionType === "frontal";

  const timeS = timeSeries.timeS;
  const timeMs = timeS.map((t) => t * 1000);
  const totalPoints = timeS.length;

  const minX = 0;
  const maxX = Math.max(...timeMs);

  let line1Data: number[] = [];
  let line1Label = "车身减速度 G (Vehicle)";
  let line1Color = "#1d4ed8"; // Heavy Blue

  let line2Data: number[] = [];
  let line2Label = "";
  let line2Color = "";

  let line3Data: number[] = [];
  let line3Label = "";
  let line3Color = "";

  if (isFrontal) {
    line1Data = timeSeries.headAccelAbsG || [];
    line1Label = "头部绝对减速 (Head, g)";

    line2Data = timeSeries.thoraxAccelAbsG || [];
    line2Label = "胸椎绝对减速 (Thorax, g)";
    line2Color = "#15803d"; // Heavy Green

    const rawFem = timeSeries.femurLeftN || [];
    line3Data = rawFem.map((f) => Math.abs(f) / 100);
    line3Label = "左股骨力 (Femur, 100N)";
    line3Color = "#b45309"; // Heavy Amber
  } else {
    line1Data = (timeSeries.ribDeflectionM || []).map((d) => d * 1000);
    line1Label = "侧肋压缩量 (Rib, mm)";

    line2Data = (timeSeries.abdomenForceN || []).map((f) => f / 50);
    line2Label = "腹部挤压力 (Abdomen, 50N)";
    line2Color = "#db2777"; // Heavy Pink

    line3Data = (timeSeries.pubicForceN || []).map((f) => f / 100);
    line3Label = "骨盆耻骨荷载 (Pubic, 100N)";
    line3Color = "#6d28d9"; // Heavy Purple
  }

  const maxY = Math.max(
    10,
    ...line1Data,
    line2Data.length ? Math.max(...line2Data) : 0,
    line3Data.length ? Math.max(...line3Data) : 0
  ) * 1.1;

  const paddingLeft = 40;
  const paddingTop = 20;
  const paddingRight = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getPoint = (xVal: number, yVal: number) => {
    const xPct = maxX > 0 ? xVal / maxX : 0;
    const yPct = maxY > 0 ? yVal / maxY : 0;

    const x = paddingLeft + xPct * chartWidth;
    const y = paddingTop + (1 - yPct) * chartHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  const buildPath = (data: number[]) => {
    if (data.length === 0) return "";
    const points = data.map((yVal, idx) => {
      const xVal = timeMs[idx];
      return getPoint(xVal, yVal);
    });
    return `M ${points.join(" L ")}`;
  };

  const path1 = buildPath(line1Data);
  const path2 = buildPath(line2Data);
  const path3 = buildPath(line3Data);

  const xTicks = [0, Math.round(maxX * 0.25), Math.round(maxX * 0.5), Math.round(maxX * 0.75), Math.round(maxX)];
  const yTicks = [0, Math.round(maxY * 0.25), Math.round(maxY * 0.5), Math.round(maxY * 0.75), Math.round(maxY)];

  return (
    <div
      ref={containerRef}
      className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-[#0f172a] w-full"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black/15 pb-3 mb-4">
        <div>
          <h4 className="font-display font-black text-xs uppercase tracking-tight">
            部位运动物理信号时序反馈 (Biomechanical Transducers)
          </h4>
          <p className="text-[10px] text-slate-500 font-bold mt-0.5">
            ODE动力弹簧多通路联立求解状态
          </p>
        </div>

        {/* Legend block with thick border chips */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 border border-black text-slate-700">
            <span className="w-2.5 h-1.5 inline-block" style={{ backgroundColor: line1Color }} />
            <span>{line1Label}</span>
          </div>
          {line2Label && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 border border-black text-slate-700">
              <span className="w-2.5 h-1.5 inline-block" style={{ backgroundColor: line2Color }} />
              <span>{line2Label}</span>
            </div>
          )}
          {line3Label && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 border border-black text-slate-700">
              <span className="w-2.5 h-1.5 inline-block" style={{ backgroundColor: line3Color }} />
              <span>{line3Label}</span>
            </div>
          )}
        </div>
      </div>

      <svg width={width} height={height} className="overflow-visible select-none">
        {/* Horizontal background grids */}
        {yTicks.map((tick, i) => {
          const py = paddingTop + (1 - tick / maxY) * chartHeight;
          return (
            <g key={`ygrid-${i}`}>
              <line
                x1={paddingLeft}
                y1={py}
                x2={width - paddingRight}
                y2={py}
                stroke="#000000"
                strokeWidth="0.5"
                strokeDasharray="2,4"
                opacity="0.15"
              />
              <text
                x={paddingLeft - 8}
                y={py + 3}
                fill="#000000"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="end"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Vertical background grids */}
        {xTicks.map((tick, i) => {
          const px = paddingLeft + (tick / maxX) * chartWidth;
          return (
            <g key={`xgrid-${i}`}>
              <line
                x1={px}
                y1={paddingTop}
                x2={px}
                y2={height - paddingBottom}
                stroke="#000000"
                strokeWidth="0.5"
                strokeDasharray="2,4"
                opacity="0.15"
              />
              <text
                x={px}
                y={height - paddingBottom + 14}
                fill="#000000"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                {tick} ms
              </text>
            </g>
          );
        })}

        {/* Bounded Border Axes in bold Bento outer contour */}
        <rect
          x={paddingLeft}
          y={paddingTop}
          width={chartWidth}
          height={chartHeight}
          fill="none"
          stroke="#000000"
          strokeWidth="2"
        />

        {/* Waveform Line 1 */}
        {path1 && (
          <path
            d={path1}
            fill="none"
            stroke={line1Color}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Waveform Line 2 */}
        {path2 && (
          <path
            d={path2}
            fill="none"
            stroke={line2Color}
            strokeWidth="3.0"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Waveform Line 3 */}
        {path3 && (
          <path
            d={path3}
            fill="none"
            stroke={line3Color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4,2"
          />
        )}
      </svg>
    </div>
  );
}
