import type { ShapeScene } from "../types";
import { pick } from "../../lib/random";
import type { WordSpec } from "../words/word";
import { settleVisual } from "../figure-check";
import { clockScene } from "../generators/pictures";
import { easy as easyBase, hard as wordBase, mid as midBase } from "./g2";

/**
 * 2학년 그림 도구: 도형·측정·그래프 단원에서 교과서처럼 그림을 보고 푸는 문제를 만든다.
 * 시계·쌓기나무·칠교판·여러 도형·분류 카드·○ 그래프·달력·색 테이프·자·무늬·시간 띠.
 */

export type Pt = [number, number];
type Polys = NonNullable<ShapeScene["polygons"]>;
type Lines = NonNullable<ShapeScene["lines"]>;
type Texts = NonNullable<ShapeScene["texts"]>;
type Circles = NonNullable<ShapeScene["circles"]>;
type Arcs = NonNullable<ShapeScene["arcs"]>;

export const MARKS = ["㉠", "㉡", "㉢", "㉣", "㉤", "㉥", "㉦", "㉧"];
export const GA = ["㉮", "㉯", "㉰", "㉱"];
export const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];
export { ord } from "../ordinal";

const rd = (n: number) => Math.round(n * 10) / 10;
const rect = (x: number, y: number, w: number, h: number, fill?: boolean) => ({ fill, points: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]] as Pt[] });

/* ── 겹침 검사: 그림 글자가 겹치거나 그림 밖이면 다시 뽑는다 ── */

type Make = (rand: () => number) => WordSpec | null;
const guard = (make: Make): Make => (rand) => {
  for (let i = 0; i < 20; i++) {
    const w = make(rand);
    const ok = settleVisual(w);
    if (ok) return ok;
  }
  return null;
};
export const easy = (id: string, make: Make) => easyBase(id, guard(make));
export const mid = (id: string, make: Make) => midBase(id, guard(make));
export const word = (id: string, make: Make) => wordBase(id, guard(make));

/** 그림 여러 개를 가로로 이어 붙인다(각 그림 아래에 이름) */
export function row(scenes: ShapeScene[], label: string, captions?: string[], gap = 16): ShapeScene {
  const capH = captions ? 24 : 0;
  const height = Math.max(...scenes.map((s) => s.height)) + capH;
  const out: Required<Pick<ShapeScene, "polygons" | "lines" | "circles" | "arcs" | "dots" | "texts">> = { polygons: [], lines: [], circles: [], arcs: [], dots: [], texts: [] };
  let x = 0;
  scenes.forEach((s, i) => {
    const sh = (p: Pt): Pt => [rd(p[0] + x), rd(p[1])];
    out.polygons.push(...(s.polygons ?? []).map((p) => ({ ...p, points: p.points.map(sh) })));
    out.lines.push(...(s.lines ?? []).map((l) => ({ ...l, from: sh(l.from), to: sh(l.to) })));
    out.circles.push(...(s.circles ?? []).map((c) => ({ ...c, c: sh(c.c) })));
    out.arcs.push(...(s.arcs ?? []).map((a) => ({ ...a, c: sh(a.c) })));
    out.dots.push(...(s.dots ?? []).map(sh));
    out.texts.push(...(s.texts ?? []).map((t) => ({ ...t, at: sh(t.at) })));
    if (captions) out.texts.push({ at: [rd(x + s.width / 2), height - 12], text: captions[i] });
    x += s.width + (i < scenes.length - 1 ? gap : 0);
  });
  return { kind: "shape", width: rd(x), height, label, ...out };
}

/** 그림 여러 개를 세로로 쌓는다(휴대 전화에서도 글자가 작아지지 않게). 각 그림 위에 이름 */
export function column(scenes: ShapeScene[], label: string, captions?: string[], gap = 10): ShapeScene {
  const capH = captions ? 22 : 0;
  const width = Math.max(...scenes.map((s) => s.width));
  const out: Required<Pick<ShapeScene, "polygons" | "lines" | "circles" | "arcs" | "dots" | "texts">> = { polygons: [], lines: [], circles: [], arcs: [], dots: [], texts: [] };
  let y = 0;
  scenes.forEach((s, i) => {
    if (captions) out.texts.push({ at: [rd(width / 2), y + 12], text: captions[i] });
    const dy = y + capH;
    const dx = (width - s.width) / 2;
    const sh = (p: Pt): Pt => [rd(p[0] + dx), rd(p[1] + dy)];
    out.polygons.push(...(s.polygons ?? []).map((p) => ({ ...p, points: p.points.map(sh) })));
    out.lines.push(...(s.lines ?? []).map((l) => ({ ...l, from: sh(l.from), to: sh(l.to) })));
    out.circles.push(...(s.circles ?? []).map((c) => ({ ...c, c: sh(c.c) })));
    out.arcs.push(...(s.arcs ?? []).map((a) => ({ ...a, c: sh(a.c) })));
    out.dots.push(...(s.dots ?? []).map(sh));
    out.texts.push(...(s.texts ?? []).map((t) => ({ ...t, at: sh(t.at) })));
    y = dy + s.height + (i < scenes.length - 1 ? gap : 0);
  });
  return { kind: "shape", width, height: rd(y), label, ...out };
}

/* ═══ 시계 ═══ */

/**
 * 바늘 시계: 전 학년 공용 clockScene(숫자는 테두리 밖, 긴바늘은 분 눈금까지)을 쓰고,
 * 긴바늘만 보여 주는 문제를 위해 바늘을 숨기는 옵션만 더한다.
 */
export function clock2(hour: number, minute: number, opt: { hourHand?: boolean; minuteHand?: boolean; label?: string } = {}): ShapeScene {
  const s = clockScene(hour, minute);
  // clockParts의 lines는 [짧은바늘, 긴바늘, 눈금 60개] 순서
  const [hourLine, minuteLine, ...ticks] = s.lines ?? [];
  return {
    ...s,
    label: opt.label ?? "바늘 시계",
    lines: [...(opt.hourHand === false ? [] : [hourLine]), ...(opt.minuteHand === false ? [] : [minuteLine]), ...ticks],
  };
}

/* ═══ 쌓기나무(앞에서 비스듬히 본 모양) ═══ */

/** [x(오른쪽), y(뒤쪽), z(위쪽)] */
export type Cube = [number, number, number];
const S = 26;
const K = 12;

function cubeFaces(q: Cube, ox: number, oy: number): { front: Pt[]; top: Pt[]; right: Pt[] } {
  const [x, y, z] = q;
  const p: Pt = [ox + x * S + y * K, oy - z * S - y * K];
  const P = (dx: number, dy: number): Pt => [rd(p[0] + dx), rd(p[1] + dy)];
  return {
    front: [P(0, 0), P(S, 0), P(S, -S), P(0, -S)],
    top: [P(0, -S), P(S, -S), P(S + K, -S - K), P(K, -S - K)],
    right: [P(S, 0), P(S + K, -K), P(S + K, -S - K), P(S, -S)],
  };
}

const drawOrder = (cubes: Cube[]) => cubes.map((q, i) => ({ q, i })).sort((a, b) => b.q[1] - a.q[1] || a.q[2] - b.q[2] || a.q[0] - b.q[0]);

function inPoly(pt: Pt, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** 면(평행사변형 네 점)이 뒤에 그린 면들에 가려지지 않은 비율(면 안의 7×7 점으로 어림) */
function visibleShare(face: Pt[], covers: Pt[][]): number {
  const [a, b, , d] = face;
  let seen = 0;
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 7; j++) {
      const [u, v] = [(i + 0.5) / 7, (j + 0.5) / 7];
      const p: Pt = [a[0] + (b[0] - a[0]) * u + (d[0] - a[0]) * v, a[1] + (b[1] - a[1]) * u + (d[1] - a[1]) * v];
      if (!covers.some((pg) => inPoly(p, pg))) seen++;
    }
  }
  return seen / 49;
}

/** 쌓기나무마다 앞면·윗면 중 보이는 비율이 큰 쪽(그림 순서로 뒤에 그린 쌓기나무에 가려진 만큼 뺀다) */
export function cubeVisibility(cubes: Cube[]): number[] {
  const order = drawOrder(cubes);
  const out = Array<number>(cubes.length).fill(0);
  order.forEach(({ q, i }, k) => {
    const f = cubeFaces(q, 0, 0);
    const covers = order.slice(k + 1).flatMap((o) => {
      const g = cubeFaces(o.q, 0, 0);
      return [g.front, g.top, g.right];
    });
    const above = cubes.some((c) => c[0] === q[0] && c[1] === q[1] && c[2] === q[2] + 1);
    out[i] = Math.max(visibleShare(f.front, covers), above ? 0 : visibleShare(f.top, covers));
  });
  return out;
}

/**
 * 2학년이 셀 수 있는 모양인지: 떠 있는 쌓기나무가 없고, 모든 쌓기나무의 앞면이나 윗면이 60% 이상 보인다
 * (옆면 띠나 윗면 조각만 보이는 쌓기나무, 완전히 숨은 쌓기나무가 없다)
 */
export function blocksOk(cubes: Cube[]): boolean {
  const has = (x: number, y: number, z: number) => cubes.some((q) => q[0] === x && q[1] === y && q[2] === z);
  if (cubes.some(([x, y, z]) => z > 0 && !has(x, y, z - 1))) return false;
  if (new Set(cubes.map((q) => q.join())).size !== cubes.length) return false;
  return cubeVisibility(cubes).every((v) => v >= 0.6);
}

/** 쌓기나무 그림. labels: 쌓기나무 번호 → 앞면에 쓸 글자 */
export function blocksScene(cubes: Cube[], label: string, labels: Record<number, string> = {}): ShapeScene {
  const maxX = Math.max(...cubes.map((q) => q[0]));
  const maxY = Math.max(...cubes.map((q) => q[1]));
  const maxZ = Math.max(...cubes.map((q) => q[2]));
  const ox = 8;
  const oy = 8 + (maxZ + 1) * S + maxY * K + K;
  const polygons: Polys = [];
  const texts: Texts = [];
  const has = (x: number, y: number, z: number) => cubes.some((c) => c[0] === x && c[1] === y && c[2] === z);
  for (const { q, i } of drawOrder(cubes)) {
    const f = cubeFaces(q, ox, oy);
    const [x, y, z] = q;
    // 옆 쌓기나무에 완전히 가려지는 면은 그리지 않는다(가려진 선이 글자와 겹쳐 보이지 않게)
    if (!has(x, y - 1, z)) polygons.push({ fill: true, points: f.front });
    if (!has(x, y, z + 1)) polygons.push({ fill: true, points: f.top });
    if (!has(x + 1, y, z)) polygons.push({ fill: true, points: f.right });
    if (labels[i]) texts.push({ at: [rd(f.front[0][0] + S / 2), rd(f.front[0][1] - S / 2)], text: labels[i] });
  }
  return { kind: "shape", width: 16 + (maxX + 1) * S + (maxY + 1) * K, height: oy + 8, label, polygons, texts };
}

/** 층별 개수 */
export const layers = (cubes: Cube[]) => Array.from({ length: Math.max(...cubes.map((q) => q[2])) + 1 }, (_, z) => cubes.filter((q) => q[2] === z).length);

/** 한 줄(앞뒤 1칸)로 쌓은 모양: 칸마다 높이 */
export const lineCubes = (heights: number[]): Cube[] => heights.flatMap((h, x) => Array.from({ length: h }, (_, z) => [x, 0, z] as Cube));

/** 위에서 본 칸마다 높이(앞줄 y=0, 뒷줄 y=1) */
export const gridCubes = (front: number[], back: number[] = []): Cube[] => [
  ...back.flatMap((h, x) => Array.from({ length: h }, (_, z) => [x, 1, z] as Cube)),
  ...front.flatMap((h, x) => Array.from({ length: h }, (_, z) => [x, 0, z] as Cube)),
];

/* ═══ 칠교판(한 변 4칸짜리 정사각형) ═══ */

export type Piece = { no: number; name: string; kind: "삼각형" | "사각형"; pts: Pt[] };
/** ①② 큰 삼각형, ③ 중간 삼각형, ④⑥ 작은 삼각형, ⑤ 정사각형 모양 사각형, ⑦ 기울어진 사각형 */
export const TANGRAM: Piece[] = [
  { no: 1, name: "큰 삼각형", kind: "삼각형", pts: [[0, 0], [4, 0], [2, 2]] },
  { no: 2, name: "큰 삼각형", kind: "삼각형", pts: [[0, 0], [2, 2], [0, 4]] },
  { no: 3, name: "중간 삼각형", kind: "삼각형", pts: [[4, 2], [4, 4], [2, 4]] },
  { no: 4, name: "작은 삼각형", kind: "삼각형", pts: [[4, 0], [4, 2], [3, 1]] },
  { no: 5, name: "사각형", kind: "사각형", pts: [[2, 2], [3, 1], [4, 2], [3, 3]] },
  { no: 6, name: "작은 삼각형", kind: "삼각형", pts: [[2, 2], [3, 3], [1, 3]] },
  { no: 7, name: "사각형", kind: "사각형", pts: [[0, 4], [1, 3], [3, 3], [2, 4]] },
];
/** 모양과 크기가 똑같은 조각(짝) */
export const TWIN: Record<number, number> = { 1: 2, 2: 1, 4: 6, 6: 4 };

/** 칠교 조각 그림: 조각 번호(numbered), 빈 조각은 점선(dashedNos) */
/** 칠교 조각 좌표를 돌리거나 뒤집는다(tf 0~7: 90°씩 돌리기, 4 이상은 뒤집기) */
export function turnPiece(p: Piece, tf: number): Piece {
  const f = ([x, y]: Pt): Pt => {
    const [a, b] = tf >= 4 ? [-x, y] : [x, y];
    const k = tf % 4;
    return k === 0 ? [a, b] : k === 1 ? [-b, a] : k === 2 ? [-a, -b] : [b, -a];
  };
  return { ...p, pts: p.pts.map(f) };
}

export function tangramScene(nos: number[], opt: { unit?: number; numbered?: boolean; dashedNos?: number[]; label?: string; tf?: number } = {}): ShapeScene {
  const u = opt.unit ?? 40;
  const pieces = TANGRAM.filter((p) => nos.includes(p.no) || opt.dashedNos?.includes(p.no)).map((p) => turnPiece(p, opt.tf ?? 0));
  const xs = pieces.flatMap((p) => p.pts.map((q) => q[0]));
  const ys = pieces.flatMap((p) => p.pts.map((q) => q[1]));
  const [x0, y0] = [Math.min(...xs), Math.min(...ys)];
  const P = (q: Pt): Pt => [rd(8 + (q[0] - x0) * u), rd(8 + (q[1] - y0) * u)];
  const polygons: Polys = [];
  const lines: Lines = [];
  const texts: Texts = [];
  for (const p of pieces) {
    const pts = p.pts.map(P);
    const cen: Pt = [rd(pts.reduce((s, q) => s + q[0], 0) / pts.length), rd(pts.reduce((s, q) => s + q[1], 0) / pts.length)];
    if (opt.dashedNos?.includes(p.no)) {
      pts.forEach((q, k) => lines.push({ from: q, to: pts[(k + 1) % pts.length], dashed: true }));
      texts.push({ at: cen, text: "?" });
    } else {
      polygons.push({ points: pts });
      if (opt.numbered) texts.push({ at: cen, text: CIRCLED[p.no - 1] });
    }
  }
  return {
    kind: "shape",
    width: rd(16 + (Math.max(...xs) - x0) * u),
    height: rd(16 + (Math.max(...ys) - y0) * u),
    label: opt.label ?? `칠교 조각 ${nos.map((n) => CIRCLED[n - 1]).join("")}`,
    polygons,
    lines,
    texts,
  };
}

/**
 * 조각을 이어 붙인 모양의 변의 수(한 덩어리이고 구멍이 없을 때). 조각의 변을 한 칸짜리 선분으로 쪼개
 * 한 번만 나오는 선분(바깥 테두리)을 이어 한 바퀴 돌며 꺾이는 곳을 센다. 한 바퀴가 아니면 null
 */
export function unionSides(nos: number[]): { sides: number; convex: boolean } | null {
  const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
  const count = new Map<string, number>();
  for (const p of TANGRAM.filter((q) => nos.includes(q.no))) {
    p.pts.forEach((a, k) => {
      const b = p.pts[(k + 1) % p.pts.length];
      const g = gcd(b[0] - a[0], b[1] - a[1]);
      for (let i = 0; i < g; i++) {
        const s: Pt = [a[0] + ((b[0] - a[0]) * i) / g, a[1] + ((b[1] - a[1]) * i) / g];
        const e: Pt = [a[0] + ((b[0] - a[0]) * (i + 1)) / g, a[1] + ((b[1] - a[1]) * (i + 1)) / g];
        const key = [s.join(), e.join()].sort().join("|");
        count.set(key, (count.get(key) ?? 0) + 1);
      }
    });
  }
  const segs = [...count].filter(([, n]) => n === 1).map(([k]) => k.split("|"));
  const next = new Map<string, string[]>();
  for (const [a, b] of segs) {
    next.set(a, [...(next.get(a) ?? []), b]);
    next.set(b, [...(next.get(b) ?? []), a]);
  }
  if ([...next.values()].some((v) => v.length !== 2)) return null;
  const loop = [segs[0][0]];
  let prev = "";
  for (let cur = segs[0][0]; ; ) {
    const nb = next.get(cur)!.find((v) => v !== prev)!;
    if (nb === loop[0]) break;
    prev = cur;
    cur = nb;
    loop.push(cur);
    if (loop.length > segs.length) return null;
  }
  if (loop.length !== segs.length) return null;
  const P = loop.map((k) => k.split(",").map(Number));
  const turns = P.map((p, i) => {
    const a = P[(i + P.length - 1) % P.length];
    const b = P[(i + 1) % P.length];
    return Math.sign((p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0]));
  }).filter((t) => t !== 0);
  return { sides: turns.length, convex: turns.every((t) => t === turns[0]) };
}

/* ═══ 여러 가지 도형(한 칸에 도형 하나, 아래에 기호) ═══ */

export type FigKind = "삼각형" | "사각형" | "오각형" | "육각형" | "원" | "열린 도형" | "굽은 선 도형" | "타원" | "둥근 사각형" | "열린 원";
export const POLY_SIDES: Record<string, number> = { 삼각형: 3, 사각형: 4, 오각형: 5, 육각형: 6 };

/** 그림 다각형의 가장 큰 내각(°) 상한 */
export const MAX_ANGLE = 140;

/** 다각형의 내각들(°, 볼록 다각형 기준) */
export function interiorAngles(pts: Pt[]): number[] {
  return pts.map((p, i) => {
    const a = pts[(i + pts.length - 1) % pts.length];
    const b = pts[(i + 1) % pts.length];
    const v1: Pt = [a[0] - p[0], a[1] - p[1]];
    const v2: Pt = [b[0] - p[0], b[1] - p[1]];
    return (Math.acos((v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2))) * 180) / Math.PI;
  });
}

/** 꼭짓점 n개인 다각형(한 칸 크기 w, 가운데 c). 이웃한 세 꼭짓점이 거의 일직선이면 다시 뽑는다 */
export function randomPolygon(rand: () => number, n: number, c: Pt, r: number): Pt[] {
  for (let t = 0; t < 50; t++) {
    const base = rand() * Math.PI * 2;
    const pts = Array.from({ length: n }, (_, i): Pt => {
      // 정다각형 가까이에서 조금만 흔들어 꼭짓점이 또렷하게 한다
      const a = base + ((i + (rand() - 0.5) * 0.3) * 2 * Math.PI) / n;
      const rr = r * (0.82 + rand() * 0.18);
      return [Math.round(c[0] + rr * Math.cos(a)), Math.round(c[1] + rr * Math.sin(a))];
    });
    const ok = pts.every((p, i) => {
      const a = pts[(i + n - 1) % n];
      const b = pts[(i + 1) % n];
      const v1: Pt = [a[0] - p[0], a[1] - p[1]];
      const v2: Pt = [b[0] - p[0], b[1] - p[1]];
      const cos = (v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2));
      // 내각이 25°보다 크고 MAX_ANGLE°보다 작아야 꼭짓점이 또렷하다(오각형·육각형이 구별된다)
      return cos < Math.cos((25 * Math.PI) / 180) && cos > Math.cos((MAX_ANGLE * Math.PI) / 180) && Math.hypot(...v2) > r * 0.45;
    });
    if (ok) return pts;
  }
  return Array.from({ length: n }, (_, i): Pt => [Math.round(c[0] + r * Math.cos((i * 2 * Math.PI) / n - Math.PI / 2)), Math.round(c[1] + r * Math.sin((i * 2 * Math.PI) / n - Math.PI / 2))]);
}

/** 도형 하나의 그림 조각(칸 가운데 c, 반지름 r) */
function figure(rand: () => number, kind: FigKind, c: Pt, r: number): Pick<ShapeScene, "polygons" | "lines" | "circles" | "arcs"> {
  if (kind in POLY_SIDES) return { polygons: [{ points: randomPolygon(rand, POLY_SIDES[kind], c, r) }] };
  if (kind === "원") return { circles: [{ c, r: Math.round(r * (0.75 + rand() * 0.2)) }] };
  if (kind === "열린 원") {
    const from = Math.round(rand() * 360);
    return { arcs: [{ c, r: Math.round(r * 0.85), from: from + 40, to: from + 360, width: 2 }] };
  }
  if (kind === "타원") {
    const [a, b] = rand() < 0.5 ? [r, r * 0.55] : [r * 0.55, r];
    return { polygons: [{ points: Array.from({ length: 36 }, (_, i): Pt => [rd(c[0] + a * Math.cos((i * Math.PI) / 18)), rd(c[1] + b * Math.sin((i * Math.PI) / 18))]) }] };
  }
  if (kind === "열린 도형") {
    // 삼각형이나 사각형의 한 꼭짓점이 벌어진 모양
    const pts = randomPolygon(rand, rand() < 0.6 ? 3 : 4, c, r);
    const lines: Lines = pts.map((p, i) => ({ from: p, to: pts[(i + 1) % pts.length] }));
    const last = lines[lines.length - 1];
    last.to = [rd(last.from[0] + (last.to[0] - last.from[0]) * 0.7), rd(last.from[1] + (last.to[1] - last.from[1]) * 0.7)];
    return { lines };
  }
  if (kind === "굽은 선 도형") {
    // 두 변은 곧은 선, 한 변은 굽은 선(반원)
    const h = Math.round(r * 0.75);
    const a: Pt = [c[0] - h, rd(c[1] + h * 0.25)];
    const b: Pt = [c[0] + h, rd(c[1] + h * 0.25)];
    return { lines: [{ from: a, to: [c[0], c[1] - h] }, { from: [c[0], c[1] - h], to: b }], arcs: [{ c: [c[0], rd(c[1] + h * 0.25)], r: h, from: 180, to: 360, width: 2 }] };
  }
  // 둥근 사각형: 모서리가 둥근 사각형
  const h = Math.round(r * 0.8);
  const q = Math.round(r * 0.3);
  const [x0, y0, x1, y1] = [c[0] - h, c[1] - h, c[0] + h, c[1] + h];
  return {
    lines: [
      { from: [x0 + q, y0], to: [x1 - q, y0] },
      { from: [x1, y0 + q], to: [x1, y1 - q] },
      { from: [x1 - q, y1], to: [x0 + q, y1] },
      { from: [x0, y1 - q], to: [x0, y0 + q] },
    ],
    arcs: [
      { c: [x1 - q, y0 + q], r: q, from: 0, to: 90, width: 2 },
      { c: [x0 + q, y0 + q], r: q, from: 90, to: 180, width: 2 },
      { c: [x0 + q, y1 - q], r: q, from: 180, to: 270, width: 2 },
      { c: [x1 - q, y1 - q], r: q, from: 270, to: 360, width: 2 },
    ],
  };
}

/** 도형 여러 개를 칸에 하나씩 그리고 아래에 ㉠㉡… 기호를 쓴다(한 줄에 perRow개) */
export function figuresScene(rand: () => number, kinds: FigKind[], label: string, perRow = 5, cell = 84): ShapeScene {
  const polygons: Polys = [];
  const lines: Lines = [];
  const circles: Circles = [];
  const arcs: Arcs = [];
  const texts: Texts = [];
  const rows = Math.ceil(kinds.length / perRow);
  const cols = Math.min(kinds.length, perRow);
  const ch = cell + 20;
  kinds.forEach((k, i) => {
    const cx = 4 + (i % perRow) * cell + cell / 2;
    const cy = 4 + Math.floor(i / perRow) * ch + cell / 2;
    const f = figure(rand, k, [cx, cy], cell * 0.4);
    polygons.push(...(f.polygons ?? []));
    lines.push(...(f.lines ?? []));
    circles.push(...(f.circles ?? []));
    arcs.push(...(f.arcs ?? []));
    texts.push({ at: [cx, cy + cell / 2 + 10], text: MARKS[i] });
  });
  return { kind: "shape", width: 8 + cols * cell, height: 4 + rows * ch, label, polygons, lines, circles, arcs, texts };
}

/* ═══ 분류 카드(모양·색칠·크기·단추 구멍) ═══ */

export type Card = { shape: "삼각형" | "사각형" | "원"; fill: boolean; big: boolean; holes?: number };

export function randomCard(rand: () => number): Card {
  return { shape: pick(rand, ["삼각형", "사각형", "원"] as const), fill: rand() < 0.5, big: rand() < 0.5 };
}

/** 카드를 한 줄에 perRow개씩, 아래에 번호 */
export function cardsScene(cards: Card[], label: string, perRow = 6, startNo = 1): ShapeScene {
  const cw = 54;
  const chh = 70;
  const polygons: Polys = [];
  const circles: Circles = [];
  const dots: Pt[] = [];
  const texts: Texts = [];
  const lines: Lines = [];
  cards.forEach((c, i) => {
    const cx = 4 + (i % perRow) * cw + cw / 2;
    const cy = 4 + Math.floor(i / perRow) * chh + 24;
    const r = c.big ? 20 : 12;
    if (c.shape === "원") {
      if (c.fill) polygons.push({ fill: true, points: Array.from({ length: 24 }, (_, k): Pt => [rd(cx + r * Math.cos((k * Math.PI) / 12)), rd(cy + r * Math.sin((k * Math.PI) / 12))]) });
      else circles.push({ c: [cx, cy], r });
    } else if (c.shape === "삼각형") {
      polygons.push({ fill: c.fill, points: [[cx, cy - r], [rd(cx + r * 1.05), rd(cy + r * 0.8)], [rd(cx - r * 1.05), rd(cy + r * 0.8)]] });
    } else {
      polygons.push({ fill: c.fill, points: [[cx - r * 0.85, cy - r * 0.85], [cx + r * 0.85, cy - r * 0.85], [cx + r * 0.85, cy + r * 0.85], [cx - r * 0.85, cy + r * 0.85]].map(([x, y]): Pt => [rd(x), rd(y)]) });
    }
    if (c.holes) {
      const d = c.big ? 5 : 3.5;
      const hs: Pt[] = c.holes === 2 ? [[cx - d, cy], [cx + d, cy]] : [[cx - d, cy - d], [cx + d, cy - d], [cx - d, cy + d], [cx + d, cy + d]];
      dots.push(...hs.map(([x, y]): Pt => [rd(x), rd(y)]));
    }
    texts.push({ at: [cx, cy + 34], text: String(startNo + i) });
  });
  const rows = Math.ceil(cards.length / perRow);
  return { kind: "shape", width: 8 + Math.min(cards.length, perRow) * cw, height: 8 + rows * chh, label, polygons, circles, dots, texts, lines };
}

export const cardName = (c: Card) => `${c.big ? "큰" : "작은"} ${c.fill ? "색칠한" : "색칠하지 않은"} ${c.shape}`;

/* ═══ ○ 그래프(가로·세로 칸이 있는 그래프) ═══ */

export type GraphOpt = { mark?: "○" | "×" | "/"; dir?: "세로" | "가로"; max?: number; axis?: string; hide?: number; skipBottom?: number; doubleBottom?: number };

/**
 * 세로: 아래에서 위로 ○를 한 칸에 하나씩, 왼쪽에 학생 수. 가로: 왼쪽에서 오른쪽으로.
 * hide: 그 항목의 ○를 그리지 않는다(물음표). skipBottom: 그 항목은 맨 아래 칸을 비우고 그린다(잘못 그린 그래프).
 * doubleBottom: 세로 그래프에서 그 항목은 맨 아래 칸에 ○를 두 개 그린다(잘못 그린 그래프, ○ 수는 vals 그대로).
 */
export function graphScene(kinds: string[], vals: number[], opt: GraphOpt = {}): ShapeScene {
  const mark = opt.mark ?? "○";
  const max = opt.max ?? Math.max(...vals, 5);
  const polygons: Polys = [];
  const lines: Lines = [];
  const circles: Circles = [];
  const texts: Texts = [];
  const put = (cx: number, cy: number, s: number) => {
    const h = s * 0.32;
    if (mark === "○") circles.push({ c: [cx, cy], r: rd(h) });
    else if (mark === "×") lines.push({ from: [rd(cx - h), rd(cy - h)], to: [rd(cx + h), rd(cy + h)] }, { from: [rd(cx - h), rd(cy + h)], to: [rd(cx + h), rd(cy - h)] });
    else lines.push({ from: [rd(cx - h), rd(cy + h)], to: [rd(cx + h), rd(cy - h)] });
  };
  if ((opt.dir ?? "세로") === "세로") {
    const [cw, ch, left, top] = [52, 26, 60, 28];
    const bottom = top + max * ch;
    polygons.push(rect(left, top, kinds.length * cw, max * ch));
    for (let r = 1; r < max; r++) lines.push({ from: [left, top + r * ch], to: [left + kinds.length * cw, top + r * ch], width: 1 });
    for (let k = 1; k < kinds.length; k++) lines.push({ from: [left + k * cw, top], to: [left + k * cw, bottom], width: 1 });
    for (let r = 0; r < max; r++) texts.push({ at: [left - 14, bottom - r * ch - ch / 2], text: String(r + 1) });
    texts.push({ at: [left - 22, top - 14], text: opt.axis ?? "(명)" });
    kinds.forEach((k, i) => {
      texts.push({ at: [left + i * cw + cw / 2, bottom + 16], text: k });
      if (opt.hide === i) {
        texts.push({ at: [left + i * cw + cw / 2, bottom - ch / 2], text: "?" });
        return;
      }
      const cx = left + i * cw + cw / 2;
      if (opt.doubleBottom === i) {
        for (const dx of [-cw / 4, cw / 4]) put(cx + dx, bottom - ch / 2, ch * 0.8);
        for (let r = 1; r < vals[i] - 1; r++) put(cx, bottom - r * ch - ch / 2, ch);
        return;
      }
      const from = opt.skipBottom === i ? 1 : 0;
      for (let r = from; r < vals[i] + from; r++) put(cx, bottom - r * ch - ch / 2, ch);
    });
    return { kind: "shape", width: left + kinds.length * cw + 10, height: bottom + 32, label: `${mark}를 그린 세로 그래프: ${kinds.map((k, i) => `${k} ${opt.hide === i ? "?" : vals[i]}`).join(", ")}`, polygons, lines, circles, texts };
  }
  const [cw, ch, left, top] = [26, 30, 60, 30];
  const right = left + max * cw;
  polygons.push(rect(left, top, max * cw, kinds.length * ch));
  for (let c = 1; c < max; c++) lines.push({ from: [left + c * cw, top], to: [left + c * cw, top + kinds.length * ch], width: 1 });
  for (let k = 1; k < kinds.length; k++) lines.push({ from: [left, top + k * ch], to: [right, top + k * ch], width: 1 });
  for (let c = 0; c < max; c++) texts.push({ at: [left + c * cw + cw / 2, top - 14], text: String(c + 1) });
  texts.push({ at: [right + 22, top - 14], text: opt.axis ?? "(명)" });
  kinds.forEach((k, i) => {
    texts.push({ at: [left / 2, top + i * ch + ch / 2], text: k });
    if (opt.hide === i) {
      texts.push({ at: [left + cw / 2, top + i * ch + ch / 2], text: "?" });
      return;
    }
    const from = opt.skipBottom === i ? 1 : 0;
    for (let c = from; c < vals[i] + from; c++) put(left + c * cw + cw / 2, top + i * ch + ch / 2, cw);
  });
  return { kind: "shape", width: right + 46, height: top + kinds.length * ch + 8, label: `${mark}를 그린 가로 그래프: ${kinds.map((k, i) => `${k} ${opt.hide === i ? "?" : vals[i]}`).join(", ")}`, polygons, lines, circles, texts };
}

/* ═══ 달력 ═══ */

export const WEEK = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
export const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** 한 달 달력(first: 1일의 요일 0=일). weeks를 주면 앞의 몇 주만 보인다(찢어진 달력). circle: 동그라미 친 날짜 */
export function calendarScene(month: number, first: number, last: number, opt: { weeks?: number; circle?: number[] } = {}): ShapeScene {
  const [cw, ch, top] = [40, 30, 50];
  const texts: Texts = [{ at: [8 + (7 * cw) / 2, 16], text: `${month}월` }];
  const lines: Lines = [];
  const circles: Circles = [];
  "일월화수목금토".split("").forEach((d, i) => texts.push({ at: [8 + i * cw + cw / 2, top - 12], text: d }));
  const totalWeeks = Math.ceil((first + last) / 7);
  const weeks = Math.min(opt.weeks ?? totalWeeks, totalWeeks);
  for (let d = 1; d <= last; d++) {
    const k = first + d - 1;
    const w = Math.floor(k / 7);
    if (w >= weeks) break;
    const at: Pt = [8 + (k % 7) * cw + cw / 2, top + w * ch + ch / 2];
    texts.push({ at, text: String(d) });
    if (opt.circle?.includes(d)) circles.push({ c: at, r: 13 });
  }
  const bottom = top + weeks * ch;
  for (let w = 0; w <= weeks; w++) lines.push({ from: [8, top + w * ch], to: [8 + 7 * cw, top + w * ch], width: 1 });
  lines.push({ from: [8, top - 24], to: [8 + 7 * cw, top - 24], width: 1 });
  for (let i = 0; i <= 7; i++) lines.push({ from: [8 + i * cw, top - 24], to: [8 + i * cw, bottom], width: 1 });
  return { kind: "shape", width: 16 + 7 * cw, height: bottom + 8, label: `${month}월 달력${opt.weeks ? `(앞의 ${weeks}주)` : ""}, 1일은 ${WEEK[first]}`, lines, circles, texts };
}

/* ═══ 색 테이프·끈(길이 막대) ═══ */

export type Bar = { from: number; to: number; text?: string; fill?: boolean; name?: string };

/**
 * 막대를 줄마다 그린다. 길이는 px 비율 scale로 그리고 글자는 막대 위에 쓴다.
 * total: 맨 아래에 전체 길이 화살표와 글자(예: "?")
 */
export function barsScene(rowsOf: Bar[][], label: string, opt: { scale?: number; total?: { from: number; to: number; text: string } } = {}): ShapeScene {
  const sc = opt.scale ?? 1;
  const left = rowsOf.some((r) => r.some((b) => b.name)) ? 36 : 10;
  const polygons: Polys = [];
  const texts: Texts = [];
  const lines: Lines = [];
  let y = 24;
  let maxX = 0;
  for (const r of rowsOf) {
    for (const b of r) {
      const x0 = left + b.from * sc;
      const x1 = left + b.to * sc;
      polygons.push(rect(rd(x0), y, rd(x1 - x0), 18, b.fill ?? true));
      if (b.text) texts.push({ at: [rd((x0 + x1) / 2), y - 11], text: b.text });
      if (b.name) texts.push({ at: [16, y + 9], text: b.name });
      maxX = Math.max(maxX, x1);
    }
    y += 50;
  }
  let height = y - 24;
  if (opt.total) {
    const x0 = left + opt.total.from * sc;
    const x1 = left + opt.total.to * sc;
    lines.push({ from: [rd(x0), y - 16], to: [rd(x1), y - 16], arrows: "both" });
    texts.push({ at: [rd((x0 + x1) / 2), y + 4], text: opt.total.text });
    height = y + 16;
    maxX = Math.max(maxX, x1);
  }
  return { kind: "shape", width: rd(maxX + 14), height, label, polygons, texts, lines };
}

/** 모눈 칸(1 cm)으로 나눈 막대 */
export function cmBarScene(n: number): ShapeScene {
  const u = 22;
  return {
    kind: "shape",
    width: 20 + n * u,
    height: 60,
    label: "1 cm 칸으로 나눈 막대",
    polygons: Array.from({ length: n }, (_, i) => rect(10 + i * u, 26, u, 20, true)),
    lines: [{ from: [10, 14], to: [10 + u, 14], arrows: "both" }],
    texts: [{ at: [10 + u + 24, 14], text: "1 cm" }],
  };
}

/* ═══ 자 ═══ */

/**
 * 자 위에 막대를 줄마다 놓은 그림. 막대 이름(㉮)은 왼쪽에 쓴다. 자는 0~max cm.
 */
export function rulerScene(bars: { start: number; end: number; name?: string }[], label: string, max = 12): ShapeScene {
  const u = 26;
  const x0 = bars.some((b) => b.name) ? 34 : 12;
  const polygons: Polys = [];
  const texts: Texts = [];
  bars.forEach((b, i) => {
    const y = 10 + i * 30;
    polygons.push({ fill: true, points: [[rd(x0 + b.start * u), y], [rd(x0 + b.end * u), y], [rd(x0 + b.end * u), y + 20], [rd(x0 + b.start * u), y + 20]] });
    if (b.name) texts.push({ at: [16, y + 10], text: b.name });
  });
  const ry = 10 + bars.length * 30;
  polygons.push(rect(x0, ry, u * max, 20));
  const lines: Lines = Array.from({ length: max * 2 + 1 }, (_, i) => ({ from: [x0 + (i * u) / 2, ry] as Pt, to: [x0 + (i * u) / 2, ry + (i % 2 ? 7 : 12)] as Pt, width: 1 }));
  texts.push(...Array.from({ length: max + 1 }, (_, i) => ({ at: [x0 + i * u, ry + 34] as Pt, text: String(i) })));
  return { kind: "shape", width: x0 + u * max + 14, height: ry + 46, label, polygons, lines, texts };
}

/* ═══ 뼘·걸음·1 m 자로 잰 그림(막대 위에 호) ═══ */

/** 막대(물건) 아래에 단위 길이 w짜리 호를 n번(마지막은 frac만큼) 이어 그린다 */
export function spansScene(n: number, w: number, label: string, opt: { name?: string; unitText?: string; frac?: number } = {}): ShapeScene {
  const x0 = 12;
  const total = (n + (opt.frac ?? 0)) * w;
  const arcs: Arcs = Array.from({ length: n }, (_, i) => ({ c: [x0 + i * w + w / 2, 40] as Pt, r: w / 2, from: 180, to: 360, width: 2 }));
  const texts: Texts = [];
  if (opt.name) texts.push({ at: [rd(x0 + total / 2), 12], text: opt.name });
  if (opt.unitText) texts.push({ at: [x0 + w / 2, 40 + w / 2 + 14], text: opt.unitText });
  return {
    kind: "shape",
    width: rd(x0 * 2 + Math.max(total, n * w)),
    height: 40 + w / 2 + (opt.unitText ? 26 : 8),
    label,
    polygons: [rect(x0, 24, rd(total), 16, true)],
    arcs,
    texts,
  };
}

/* ═══ 무늬(한 줄) ═══ */

export type Tile = { shape: "삼각형" | "사각형" | "원" | "화살표"; fill: boolean; rot?: number };

function tile(t: Tile, cx: number, cy: number, r: number): Pick<ShapeScene, "polygons" | "circles"> {
  const rot = ((t.rot ?? 0) * Math.PI) / 180;
  const turn = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [rd(cx + x * Math.cos(rot) - y * Math.sin(rot)), rd(cy + x * Math.sin(rot) + y * Math.cos(rot))]);
  if (t.shape === "원") {
    if (t.fill) return { polygons: [{ fill: true, points: Array.from({ length: 24 }, (_, k): Pt => [rd(cx + r * Math.cos((k * Math.PI) / 12)), rd(cy + r * Math.sin((k * Math.PI) / 12))]) }] };
    return { circles: [{ c: [cx, cy], r }] };
  }
  if (t.shape === "삼각형") return { polygons: [{ fill: t.fill, points: turn([[0, -r], [r, r * 0.8], [-r, r * 0.8]]) }] };
  if (t.shape === "사각형") return { polygons: [{ fill: t.fill, points: turn([[-r * 0.85, -r * 0.85], [r * 0.85, -r * 0.85], [r * 0.85, r * 0.85], [-r * 0.85, r * 0.85]]) }] };
  // 오른쪽을 가리키는 화살표(rot으로 방향을 돌린다)
  return { polygons: [{ fill: t.fill, points: turn([[-r, -r * 0.35], [r * 0.2, -r * 0.35], [r * 0.2, -r * 0.8], [r, 0], [r * 0.2, r * 0.8], [r * 0.2, r * 0.35], [-r, r * 0.35]]) }] };
}

/** 무늬를 한 줄에 perRow칸씩. blank 칸은 점선 네모와 "?" */
export function patternScene(tiles: (Tile | null)[], label: string, perRow = 8): ShapeScene {
  const cell = 44;
  const polygons: Polys = [];
  const circles: Circles = [];
  const lines: Lines = [];
  const texts: Texts = [];
  tiles.forEach((t, i) => {
    const cx = 6 + (i % perRow) * cell + cell / 2;
    const cy = 6 + Math.floor(i / perRow) * cell + cell / 2;
    if (!t) {
      const h = 17;
      const c: Pt[] = [[cx - h, cy - h], [cx + h, cy - h], [cx + h, cy + h], [cx - h, cy + h]];
      c.forEach((p, k) => lines.push({ from: p, to: c[(k + 1) % 4], dashed: true, width: 1.5 }));
      texts.push({ at: [cx, cy], text: "?" });
      return;
    }
    const f = tile(t, cx, cy, 15);
    polygons.push(...(f.polygons ?? []));
    circles.push(...(f.circles ?? []));
  });
  const rows = Math.ceil(tiles.length / perRow);
  return { kind: "shape", width: 12 + Math.min(perRow, tiles.length) * cell, height: 12 + rows * cell, label, polygons, circles, lines, texts };
}

/** 모눈 무늬: 칸마다 색칠 여부(null이면 기호를 쓴 빈칸) */
export function gridPattern(cells: (boolean | string)[][], label: string): ShapeScene {
  const u = 34;
  const polygons: Polys = [];
  const texts: Texts = [];
  cells.forEach((r, i) =>
    r.forEach((v, j) => {
      polygons.push(rect(6 + j * u, 6 + i * u, u, u, v === true));
      if (typeof v === "string") texts.push({ at: [6 + j * u + u / 2, 6 + i * u + u / 2], text: v });
    }),
  );
  return { kind: "shape", width: 12 + cells[0].length * u, height: 12 + cells.length * u, label, polygons, texts };
}

/* ═══ 시간 띠(10분 칸) ═══ */

/** from~to(분, 0시 기준) 시간 띠. 한 칸 10분, 정각에 시각을 쓰고 blocks를 색칠한다 */
export function minuteBand(from: number, to: number, blocks: { from: number; to: number; text?: string }[], label: string): ShapeScene {
  const cell = 16;
  const x = (t: number) => rd(16 + ((t - from) / 10) * cell);
  const [top, bottom] = [30, 58];
  const polygons: Polys = [{ points: [[x(from), top], [x(to), top], [x(to), bottom], [x(from), bottom]] }, ...blocks.map((b) => ({ fill: true, points: [[x(b.from), top], [x(b.to), top], [x(b.to), bottom], [x(b.from), bottom]] as Pt[] }))];
  const lines: Lines = [];
  const texts: Texts = [];
  for (let t = from; t <= to; t += 10) {
    const hourMark = t % 60 === 0;
    lines.push({ from: [x(t), top], to: [x(t), top + (hourMark ? 10 : 6)], width: hourMark ? 1.5 : 1 }, { from: [x(t), bottom - (hourMark ? 10 : 6)], to: [x(t), bottom], width: hourMark ? 1.5 : 1 });
    if (hourMark) texts.push({ at: [x(t), bottom + 16], text: `${Math.floor(t / 60) % 12 || 12}시` });
  }
  for (const b of blocks) if (b.text) texts.push({ at: [rd((x(b.from) + x(b.to)) / 2), top - 14], text: b.text });
  return { kind: "shape", width: x(to) + 22, height: bottom + 28, label, polygons, lines, texts };
}

/** 시작 시각·끝 시각 두 시계 */
export function twoClocks(a: [number, number], b: [number, number], captions: [string, string]): ShapeScene {
  return row([clock2(a[0], a[1]), clock2(b[0], b[1])], `${captions[0]} ${a[0]}시 ${a[1]}분, ${captions[1]} ${b[0]}시 ${b[1]}분 시계`, captions, 24);
}

/* ═══ 줄자(30 cm 구간) ═══ */

/** from부터 30 cm 구간의 줄자. bar: 물건이 놓인 구간(구간 밖은 잘라 그린다) */
export function tapeWin(from: number, bar: [number, number], label: string): ShapeScene {
  const u = 10;
  const x0 = 14;
  const X = (v: number) => rd(x0 + (Math.min(Math.max(v, from), from + 30) - from) * u);
  const lines: Lines = Array.from({ length: 31 }, (_, i) => ({ from: [x0 + i * u, 40] as Pt, to: [x0 + i * u, (from + i) % 10 === 0 ? 56 : (from + i) % 5 === 0 ? 51 : 47] as Pt, width: 1 }));
  const texts: Texts = [];
  for (let v = Math.ceil(from / 10) * 10; v <= from + 30; v += 10) texts.push({ at: [x0 + (v - from) * u, 72], text: String(v) });
  return {
    kind: "shape",
    width: x0 * 2 + u * 30,
    height: 84,
    label,
    polygons: [{ fill: true, points: [[X(bar[0]), 12], [X(bar[1]), 12], [X(bar[1]), 30], [X(bar[0]), 30]] }, rect(x0, 40, u * 30, 22)],
    lines,
    texts,
  };
}

/** 1 m 자(10 cm마다 수)와 그 위의 막대(0부터 len cm) */
export function meterStick(len: number, label: string): ShapeScene {
  const u = 3.3;
  const x0 = 16;
  const lines: Lines = Array.from({ length: 21 }, (_, i) => ({ from: [rd(x0 + i * 5 * u), 40] as Pt, to: [rd(x0 + i * 5 * u), i % 2 ? 48 : 54] as Pt, width: 1 }));
  return {
    kind: "shape",
    width: rd(x0 * 2 + 100 * u),
    height: 84,
    label,
    polygons: [{ fill: true, points: [[x0, 12], [rd(x0 + len * u), 12], [rd(x0 + len * u), 30], [x0, 30]] }, rect(x0, 40, rd(100 * u), 22)],
    lines,
    texts: Array.from({ length: 11 }, (_, i) => ({ at: [rd(x0 + i * 10 * u), 72] as Pt, text: String(i * 10) })),
  };
}

