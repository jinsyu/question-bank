import type { Visual } from "../content/types";

/**
 * 막대그래프·꺾은선그래프의 배치(글자 크기·눈금 글자 간격·가로축 이름 줄바꿈)와 그림 설명.
 * 360px 휴대폰에서 그래프가 그려지는 폭(약 248px)에서도 글자가 12px 이상이 되도록
 * viewBox 폭을 좁히고(260) 글자를 13으로 둔다.
 */

export type ChartVisual = Extract<Visual, { kind: "bars" | "line" }>;

export const CHART_W = 260;
/** 눈금·가로축 이름·단위·범례 글자 */
export const CHART_FONT = 13;
export const CHART_TITLE_FONT = 14;
/** 360px 휴대폰에서 그래프가 차지하는 폭(화면 여백·문항 번호를 뺀 값) */
export const PHONE_CHART_PX = 248;

export const PAD = { left: 40, right: 8, top: 42 };

/** 도형 그림(ShapeScene) 중 그래프(막대·꺾은선·그림그래프·띠·원·○ 그래프): 그림 설명에 "그래프"가 들어간다 */
export const isGraphScene = (label: string) => /그래프/.test(label);
/** 도형 그림 글자 크기(charts.tsx ShapeFigure)와 작은 그림 확대 상한 */
export const SHAPE_FONT = 14;
export const SHAPE_MAX_ZOOM = 1.5;
/** 360px 휴대폰에서 도형 그림 글자의 실제 크기(px) */
export const phoneShapeFontPx = (width: number) => (SHAPE_FONT * Math.min(PHONE_CHART_PX, width * SHAPE_MAX_ZOOM)) / width;
const PLOT_H = 150;
const LABEL_LINE_H = 16;
/** 두 계열 그래프의 범례 줄 높이 */
export const LEGEND_H = 24;

/** 글자 폭 어림(Noto Sans KR: 한글 1em, 숫자·영문 약 0.6em, 띄어쓰기 0.3em) */
export function textWidth(text: string, size = CHART_FONT): number {
  return [...text].reduce((s, ch) => s + (ch === " " ? 0.3 : /[ -~°]/.test(ch) ? 0.6 : 1) * size, 0);
}

/** 가로축 이름이 칸 폭보다 넓으면 띄어쓰기에서 두 줄로 나눈다(오전 11시 → 오전 / 11시) */
function wrapLabel(label: string, room: number): string[] {
  if (textWidth(label) <= room || !label.includes(" ")) return [label];
  const words = label.split(" ");
  let best = [label];
  let bestW = Infinity;
  for (let k = 1; k < words.length; k++) {
    const lines = [words.slice(0, k).join(" "), words.slice(k).join(" ")];
    const w = Math.max(...lines.map((l) => textWidth(l)));
    if (w < bestW) [best, bestW] = [lines, w];
  }
  return best;
}

/** 눈금 글자를 몇 칸마다 쓸지: 글자가 겹치지 않는 가장 촘촘한 간격(1·2·5·10칸…) */
function labelEvery(cells: number): number {
  const gap = PLOT_H / cells;
  for (const k of [1, 2, 5, 10, 20, 50]) if (gap * k >= CHART_FONT + 3) return k;
  return 100;
}

export function chartLayout(visual: ChartVisual) {
  const { labels, values, step, second } = visual;
  // 가장 큰 값보다 한 칸 이상 위까지 그리고, 맨 위 눈금에도 숫자가 오도록 칸 수를 숫자 간격의 배수로 올린다
  let cells = Math.ceil(Math.max(...values, ...(second?.values ?? [])) / step) + 1;
  let every = labelEvery(cells);
  while (cells % every !== 0) {
    cells = Math.ceil(cells / every) * every;
    every = labelEvery(cells);
  }
  const top = cells * step;
  const plotW = CHART_W - PAD.left - PAD.right;
  const band = plotW / labels.length;
  const axisY = PAD.top + PLOT_H;
  const labelLines = labels.map((l) => wrapLabel(l, band - 4));
  const rows = Math.max(...labelLines.map((l) => l.length));
  const labelsBottom = axisY + 8 + rows * LABEL_LINE_H;
  return {
    top,
    band,
    axisY,
    labelLines,
    labelsBottom,
    /** 눈금 값(0부터 top까지 step 간격)과 글자를 쓰는지 */
    ticks: Array.from({ length: cells + 1 }, (_, i) => ({ value: i * step, labeled: i % every === 0 })),
    height: labelsBottom + 6 + (second ? LEGEND_H : 0),
    x: (i: number) => PAD.left + band * (i + 0.5),
    y: (v: number) => PAD.top + PLOT_H * (1 - v / top),
  };
}

/**
 * 그림 설명(화면 읽기): 제목·단위와 항목별 값. 문제가 읽어 내라고 묻는 항목(asked)은 값을 빼고
 * "그래프에서 읽어 보세요"라고만 알려 정답이 그대로 드러나지 않게 한다.
 * 그래프 종류(막대·꺾은선)는 쓰지 않는다(그래프 이름을 묻는 문제가 있다)
 */
export function chartLabel(visual: ChartVisual): string {
  const { title, labels, values, unit, second, asked = [] } = visual;
  const item = (i: number) => (second ? `${labels[i]}(${second.names[0]} ${values[i]}, ${second.names[1]} ${second.values[i]})` : `${labels[i]} ${values[i]}`);
  const shown = labels.map((_, i) => i).filter((i) => !asked.includes(i));
  const parts = [`${title} 그래프${second ? `(${second.names.join("·")})` : ""}, 단위 ${unit}.`];
  if (shown.length) parts.push(`${shown.map(item).join(", ")}.`);
  if (asked.length) parts.push(`${asked.map((i) => labels[i]).join(", ")}의 값은 그래프에서 읽어 보세요.`);
  return parts.join(" ");
}
