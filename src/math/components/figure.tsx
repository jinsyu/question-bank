import type { Visual } from "../content/types";
import { BarChart, DataTable, LineChart, ShapeFigure } from "./charts";
import { FIGURE_NOTE, needsSight } from "./figure-note";
import { LongDivisionFigure } from "./long-division";

/** 세로셈: 자리를 맞춰 오른쪽 정렬 */
function ColumnFigure({ op, a, b }: { op: "+" | "-" | "×"; a: number; b: number }) {
  const width = Math.max(String(a).length, String(b).length) + 1;
  const pad = (n: number) => String(n).padStart(width, " ");
  return (
    <div
      role="img"
      aria-label={`${a} ${op === "×" ? "곱하기" : op === "+" ? "더하기" : "빼기"} ${b} 세로셈`}
      className="inline-block font-serif text-3xl leading-snug tracking-[0.35em] tabular-nums"
    >
      <div className="whitespace-pre text-right">{pad(a)}</div>
      <div className="flex whitespace-pre">
        <span>{op}</span>
        <span className="flex-1 text-right">{String(b)}</span>
      </div>
      <div className="mt-1 h-12 border-t-2 border-[var(--ink)]" />
    </div>
  );
}

const SHADE = "var(--shade)";
const LINE = "var(--ink)";

/** 문제 그림. 그림을 봐야 푸는 문제면 화면 읽기용 안내를 그림 앞에 둔다(화면에는 보이지 않는다) */
export function Figure({ visual }: { visual: Visual }) {
  if (!needsSight(visual)) return <VisualFigure visual={visual} />;
  return (
    <>
      <p className="sr-only" data-testid="figure-note">
        {FIGURE_NOTE}
      </p>
      <VisualFigure visual={visual} />
    </>
  );
}

/** 그림 종류별로 그린다. 분수 그림은 똑같이 나눈 막대 또는 원 */
function VisualFigure({ visual }: { visual: Visual }) {
  if (visual.kind === "column") return <ColumnFigure {...visual} />;
  if (visual.kind === "shape") return <ShapeFigure scene={visual} />;
  if (visual.kind === "longdiv") return <LongDivisionFigure visual={visual} />;
  if (visual.kind === "bars") return <BarChart visual={visual} />;
  if (visual.kind === "line") return <LineChart visual={visual} />;
  if (visual.kind === "table") return <DataTable visual={visual} />;
  const { parts, shaded } = visual;
  const label = `전체를 ${parts}칸으로 똑같이 나눈 그림, ${shaded}칸 색칠`;

  if (visual.kind === "bar") {
    const w = 300;
    const cell = w / parts;
    return (
      <svg viewBox={`0 0 ${w + 4} 48`} className="h-12 w-full max-w-xs" role="img" aria-label={label}>
        {Array.from({ length: parts }, (_, i) => (
          <rect
            key={i}
            x={2 + i * cell}
            y={2}
            width={cell}
            height={44}
            fill={i < shaded ? SHADE : "transparent"}
            stroke={LINE}
            strokeWidth={1.5}
          />
        ))}
      </svg>
    );
  }

  const r = 44;
  const c = 48;
  const point = (i: number) => {
    const a = (i / parts) * 2 * Math.PI - Math.PI / 2;
    return [c + r * Math.cos(a), c + r * Math.sin(a)];
  };
  return (
    <svg viewBox="0 0 96 96" className="h-24 w-24" role="img" aria-label={label}>
      {Array.from({ length: parts }, (_, i) => {
        const [x1, y1] = point(i);
        const [x2, y2] = point(i + 1);
        const large = parts === 1 ? 1 : 0;
        return (
          <path
            key={i}
            d={`M${c},${c} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`}
            fill={i < shaded ? SHADE : "transparent"}
            stroke={LINE}
            strokeWidth={1.5}
          />
        );
      })}
    </svg>
  );
}
