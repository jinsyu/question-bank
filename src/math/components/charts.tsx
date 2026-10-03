import { useId } from "react";
import type { ShapeScene, Visual } from "../content/types";
import { CHART_FONT, CHART_TITLE_FONT, CHART_W, LEGEND_H, PAD, SHAPE_FONT, SHAPE_MAX_ZOOM, chartLabel, chartLayout, isGraphScene, textWidth, type ChartVisual } from "./chart-layout";

const INK = "var(--ink)";
const SHADE = "var(--shade)";
const RULE = "var(--rule)";
const PAPER = "var(--paper)";

export function ShapeFigure({ scene }: { scene: ShapeScene }) {
  const { width, height, grid } = scene;
  const arrowId = `arrow-${useId()}`;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`h-auto w-full ${width > 300 ? "max-w-xl" : "max-w-sm"}`}
      // 작은 그림이 화면 폭만큼 부풀지 않게 원래 크기의 1.5배까지만
      style={{ maxWidth: `${Math.round(width * SHAPE_MAX_ZOOM)}px` }}
      role="img"
      aria-label={scene.label}
      // 그래프는 인쇄에서도 글자가 읽히게 조금 크게(globals.css)
      data-chart={isGraphScene(scene.label) ? "" : undefined}
    >
      <defs>
        <marker id={arrowId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={INK} />
        </marker>
      </defs>
      {grid &&
        Array.from({ length: Math.floor(width / grid) + 1 }, (_, i) => (
          <line key={`gx${i}`} x1={i * grid} y1={0} x2={i * grid} y2={height} stroke={RULE} strokeWidth={1} />
        ))}
      {grid &&
        Array.from({ length: Math.floor(height / grid) + 1 }, (_, i) => (
          <line key={`gy${i}`} x1={0} y1={i * grid} x2={width} y2={i * grid} stroke={RULE} strokeWidth={1} />
        ))}
      {scene.polygons?.map((p, i) => (
        <polygon
          key={`p${i}`}
          points={p.points.map((xy) => xy.join(",")).join(" ")}
          fill={p.fill === "paper" ? PAPER : p.fill ? SHADE : "transparent"}
          stroke={INK}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      ))}
      {scene.circles?.map((c, i) => (
        <circle key={`c${i}`} cx={c.c[0]} cy={c.c[1]} r={c.r} fill="transparent" stroke={INK} strokeWidth={2} />
      ))}
      {scene.arcs?.map((a, i) => {
        const at = (deg: number) => [a.c[0] + a.r * Math.cos((deg * Math.PI) / 180), a.c[1] - a.r * Math.sin((deg * Math.PI) / 180)];
        const [x1, y1] = at(a.from);
        const [x2, y2] = at(a.to);
        const large = (((a.to - a.from) % 360) + 360) % 360 > 180 ? 1 : 0;
        return <path key={`a${i}`} d={`M${x1},${y1} A${a.r},${a.r} 0 ${large} 0 ${x2},${y2}`} fill="none" stroke={INK} strokeWidth={a.width ?? 1.5} />;
      })}
      {scene.lines?.map((l, i) => (
        <line
          key={`l${i}`}
          x1={l.from[0]}
          y1={l.from[1]}
          x2={l.to[0]}
          y2={l.to[1]}
          stroke={INK}
          strokeWidth={l.width ?? 2}
          strokeLinecap="round"
          strokeDasharray={l.dashed ? "5 4" : undefined}
          markerEnd={l.arrows ? `url(#${arrowId})` : undefined}
          markerStart={l.arrows === "both" ? `url(#${arrowId})` : undefined}
        />
      ))}
      {scene.dots?.map(([x, y], i) => <circle key={`d${i}`} cx={x} cy={y} r={3.5} fill={INK} />)}
      {scene.texts?.map((t, i) => (
        <text key={`t${i}`} x={t.at[0]} y={t.at[1]} fontSize={SHAPE_FONT} textAnchor="middle" dominantBaseline="middle" fill={INK}>
          {t.text}
        </text>
      ))}
    </svg>
  );
}

/** 두 계열 범례: 표시(swatch) 28px + 4px + 이름, 항목 사이 18px, 가운데 정렬 */
function Legend({ names, y, cx, swatch }: { names: [string, string]; y: number; cx: number; swatch: (k: 0 | 1, x: number, y: number) => React.ReactNode }) {
  const widths = names.map((n) => 32 + textWidth(n));
  const left = cx - (widths[0] + 18 + widths[1]) / 2;
  return (
    <g>
      {names.map((n, k) => {
        const x0 = k === 0 ? left : left + widths[0] + 18;
        return (
          <g key={n}>
            {swatch(k as 0 | 1, x0, y)}
            <text x={x0 + 32} y={y} fontSize={CHART_FONT} dominantBaseline="middle" fill={INK}>
              {n}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/**
 * 막대그래프·꺾은선그래프 공통 틀: 눈금·가로축 이름, 두 계열이면 아래에 범례.
 * 배치는 chart-layout.ts(휴대폰 폭에서 글자 12px 이상, 눈금 글자는 겹치지 않게 몇 칸마다)
 */
function ChartFrame({
  visual,
  legend,
  children,
}: {
  visual: ChartVisual;
  legend?: (k: 0 | 1, x: number, y: number) => React.ReactNode;
  children: (x: (i: number) => number, y: (v: number) => number, band: number) => React.ReactNode;
}) {
  const { unit, title, second } = visual;
  const w = CHART_W;
  const L = chartLayout(visual);
  return (
    <svg
      viewBox={`0 0 ${w} ${L.height}`}
      className="h-auto w-full"
      // 넓은 화면에서 글자가 지나치게 커지지 않게
      style={{ maxWidth: `${Math.round(w * 1.35)}px` }}
      role="img"
      aria-label={chartLabel(visual)}
      data-chart=""
    >
      <text x={w / 2} y={16} fontSize={CHART_TITLE_FONT} textAnchor="middle" fill={INK} fontWeight="bold">
        {title}
      </text>
      <text x={4} y={PAD.top - 11} fontSize={CHART_FONT} fill={INK}>
        ({unit})
      </text>
      {L.ticks.map((t) => (
        <g key={t.value}>
          <line x1={PAD.left} y1={L.y(t.value)} x2={w - PAD.right} y2={L.y(t.value)} stroke={RULE} strokeWidth={1} />
          {t.labeled && (
            <text x={PAD.left - 5} y={L.y(t.value)} fontSize={CHART_FONT} textAnchor="end" dominantBaseline="middle" fill={INK}>
              {t.value}
            </text>
          )}
        </g>
      ))}
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={L.axisY} stroke={INK} strokeWidth={1.5} />
      <line x1={PAD.left} y1={L.axisY} x2={w - PAD.right} y2={L.axisY} stroke={INK} strokeWidth={1.5} />
      {L.labelLines.map((lines, i) => (
        <text key={i} x={L.x(i)} y={L.axisY + 18} fontSize={CHART_FONT} textAnchor="middle" fill={INK}>
          {lines.map((line, k) => (
            <tspan key={k} x={L.x(i)} dy={k === 0 ? 0 : 16}>
              {line}
            </tspan>
          ))}
        </text>
      ))}
      {children(L.x, L.y, L.band)}
      {second && legend && <Legend names={second.names} y={L.labelsBottom + LEGEND_H / 2} cx={w / 2} swatch={legend} />}
    </svg>
  );
}

/** 두 번째 계열 막대의 빗금 무늬(흑백 인쇄에서도 첫 계열의 색칠과 구별) */
function Hatch({ id }: { id: string }) {
  return (
    <defs>
      <pattern id={id} width={5} height={5} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width={5} height={5} fill={PAPER} />
        <line x1={0} y1={0} x2={0} y2={5} stroke={INK} strokeWidth={1.4} />
      </pattern>
    </defs>
  );
}

export function BarChart({ visual }: { visual: Extract<Visual, { kind: "bars" }> }) {
  const hatchId = `hatch-${useId()}`;
  const { values, second } = visual;
  const fillOf = (k: 0 | 1) => (k === 0 ? SHADE : `url(#${hatchId})`);
  return (
    <ChartFrame visual={visual} legend={(k, x, y) => <rect x={x + 7} y={y - 6} width={14} height={12} fill={fillOf(k)} stroke={INK} strokeWidth={1} />}>
      {(x, y, band) => {
        if (!second)
          return values.map((v, i) => <rect key={i} x={x(i) - band * 0.3} y={y(v)} width={band * 0.6} height={y(0) - y(v)} fill={SHADE} stroke={INK} strokeWidth={1} />);
        // 두 계열: 한 칸에 두 막대를 나란히(왼쪽 색칠, 오른쪽 빗금)
        const bw = band * 0.32;
        return (
          <>
            <Hatch id={hatchId} />
            {[values, second.values].map((vs, k) =>
              vs.map((v, i) => <rect key={`${k}-${i}`} x={x(i) - bw + k * bw} y={y(v)} width={bw} height={y(0) - y(v)} fill={fillOf(k as 0 | 1)} stroke={INK} strokeWidth={1} />),
            )}
          </>
        );
      }}
    </ChartFrame>
  );
}

/** 꺾은선의 점 모양: 첫 계열 ●, 두 번째 계열 ▲ */
function Marker({ k, cx, cy }: { k: 0 | 1; cx: number; cy: number }) {
  if (k === 0) return <circle cx={cx} cy={cy} r={3.5} fill={INK} />;
  return <polygon points={`${cx},${cy - 5} ${cx - 4.5},${cy + 3.5} ${cx + 4.5},${cy + 3.5}`} fill={INK} />;
}

const DASH = "6 4";

export function LineChart({ visual }: { visual: Extract<Visual, { kind: "line" }> }) {
  const all = visual.second ? [visual.values, visual.second.values] : [visual.values];
  return (
    <ChartFrame
      visual={visual}
      legend={(k, x, y) => (
        <>
          <line x1={x} y1={y} x2={x + 28} y2={y} stroke={INK} strokeWidth={2} strokeDasharray={k === 1 ? DASH : undefined} />
          <Marker k={k} cx={x + 14} cy={y} />
        </>
      )}
    >
      {(x, y) =>
        all.map((vs, k) => (
          <g key={k}>
            <polyline
              points={vs.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
              fill="none"
              stroke={INK}
              strokeWidth={2}
              strokeDasharray={k === 1 ? DASH : undefined}
            />
            {vs.map((v, i) => (
              <Marker key={i} k={k as 0 | 1} cx={x(i)} cy={y(v)} />
            ))}
          </g>
        ))
      }
    </ChartFrame>
  );
}

export function DataTable({ visual }: { visual: Extract<Visual, { kind: "table" }> }) {
  return (
    <table className="border-collapse text-center text-lg">
      <thead>
        <tr>
          {visual.header.map((h) => (
            <th key={h} className="border border-[var(--ink)] bg-[var(--note)] px-3 py-1.5 font-semibold">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {visual.rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j} className="border border-[var(--ink)] px-3 py-1.5 tracking-wider">
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
