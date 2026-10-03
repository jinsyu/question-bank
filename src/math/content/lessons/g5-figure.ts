import type { ShapeScene } from "../types";
import type { WordSpec } from "../words/word";
import { figureOk, settleVisual, textBox } from "../figure-check";

/**
 * 5학년 도형 그림 도구: 길이(cm)에 비례한 좌표, 직각·각 표시, 글자까지 들어가게 그림 크기 맞추기,
 * 글자가 겹치거나 그림 밖으로 나가면 다시 뽑기. 좋은 예(g4-quad.ts)의 방식을 따른다.
 * (words56 → g5-pattern → 이 파일로 이어지므로 g4-quad를 가져오면 모듈이 순환한다. 꼭짓점·변 글자 함수는 여기에 둔다.)
 */

export type Pt = [number, number];
export type Lines = NonNullable<ShapeScene["lines"]>;
export type Texts = NonNullable<ShapeScene["texts"]>;
export type Arcs = NonNullable<ShapeScene["arcs"]>;

export const KO = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ"];
export const MARKS = ["①", "②", "③", "④"];

export const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
export const mul = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k];
export const len = (a: Pt) => Math.hypot(a[0], a[1]);
export const dist = (a: Pt, b: Pt) => len(sub(a, b));
export const unit = (a: Pt): Pt => mul(a, 1 / len(a));
export const mid2 = (a: Pt, b: Pt): Pt => mul(add(a, b), 0.5);
export const rd = (n: number) => Math.round(n * 10) / 10;
export const rp = (p: Pt): Pt => [rd(p[0]), rd(p[1])];
const rad = (d: number) => (d * Math.PI) / 180;
/** 화면 벡터의 방향각(오른쪽 0°, 시계 반대 방향 +) */
const deg = (v: Pt) => (Math.atan2(-v[1], v[0]) * 180) / Math.PI;
const dirAt = (a: number): Pt => [Math.cos(rad(a)), -Math.sin(rad(a))];

/** 수학 좌표(위쪽 +y, cm)를 화면 좌표로: k배 하고 y를 뒤집는다 */
export const toScreen = (ps: Pt[], k: number): Pt[] => ps.map(([x, y]) => rp([x * k, -y * k]));

/** 직각 표시(꼭짓점 v에서 a·b 쪽으로) */
export function rightMark(v: Pt, a: Pt, b: Pt, s = 8): Lines {
  const u = mul(unit(sub(a, v)), s);
  const w = mul(unit(sub(b, v)), s);
  const p = add(add(v, u), w);
  return [
    { from: rp(add(v, u)), to: rp(p), width: 1.5 },
    { from: rp(p), to: rp(add(v, w)), width: 1.5 },
  ];
}

/** 꼭짓점 v에서 a, b 쪽 두 변이 이루는 각(180° 이하)에 호와 글자 */
export function angleMark(v: Pt, a: Pt, b: Pt, r: number, label?: string, gap = 12): { arcs: Arcs; texts: Texts } {
  let f = deg(sub(a, v));
  let sweep = (((deg(sub(b, v)) - f) % 360) + 360) % 360;
  if (sweep > 180) {
    f = deg(sub(b, v));
    sweep = 360 - sweep;
  }
  // 글자 상자가 호에 닿지 않게(호 반지름 + 글자 상자를 그 방향으로 비춘 반폭 + 여백),
  // 좁은 각은 글자가 두 변 사이에 들어가도록 꼭짓점에서 더 멀리
  const half = rad(sweep / 2);
  const u = dirAt(f + sweep / 2);
  const w = label ? [...label].reduce((s, ch) => s + (/[ -~°]/.test(ch) ? 8 : 14), 0) : 0;
  const reach = Math.abs(u[0]) * (w / 2) + Math.abs(u[1]) * 7;
  const d = Math.max(r + reach + 3, r + gap, Math.min(60, 15 / Math.sin(half)));
  return {
    arcs: [{ c: rp(v), r, from: rd(f), to: rd(f + sweep) }],
    texts: label ? [{ at: rp(add(v, mul(u, d))), text: label }] : [],
  };
}

/** 정다각형 꼭짓점(중심 c, 반지름 r, 첫 꼭짓점 방향 start°) */
export const regularPolygon = (n: number, r: number, c: Pt = [0, 0], start = 90): Pt[] =>
  Array.from({ length: n }, (_, i) => rp(add(c, mul(dirAt(start + (360 / n) * i), r))));

type Draft = Omit<ShapeScene, "width" | "height" | "kind">;

/** 좌표·글자 상자를 모두 담도록 옮기고 그림 크기를 정한다(모눈이 있으면 칸 단위로 옮긴다) */
export function fit(draft: Draft, pad = 8): ShapeScene {
  const xs: number[] = [];
  const ys: number[] = [];
  const put = ([x, y]: Pt) => {
    xs.push(x);
    ys.push(y);
  };
  draft.polygons?.forEach((p) => p.points.forEach(put));
  draft.lines?.forEach((l) => [l.from, l.to].forEach(put));
  draft.dots?.forEach((d) => {
    put([d[0] - 4, d[1] - 4]);
    put([d[0] + 4, d[1] + 4]);
  });
  draft.circles?.forEach((c) => {
    put([c.c[0] - c.r, c.c[1] - c.r]);
    put([c.c[0] + c.r, c.c[1] + c.r]);
  });
  draft.texts?.forEach((t) => {
    const [x0, y0, x1, y1] = textBox(t);
    put([x0, y0]);
    put([x1, y1]);
  });
  const g = draft.grid;
  const snap = (v: number) => (g ? Math.ceil(v / g) * g : v);
  const dx = snap(pad - Math.min(...xs));
  const dy = snap(pad - Math.min(...ys));
  const mv = (p: Pt): Pt => rp([p[0] + dx, p[1] + dy]);
  const width = Math.ceil(Math.max(...xs) + dx + pad);
  const height = Math.ceil(Math.max(...ys) + dy + pad);
  return {
    kind: "shape",
    ...draft,
    width: g ? Math.ceil(width / g) * g : width,
    height: g ? Math.ceil(height / g) * g : height,
    polygons: draft.polygons?.map((p) => ({ ...p, points: p.points.map(mv) })),
    lines: draft.lines?.map((l) => ({ ...l, from: mv(l.from), to: mv(l.to) })),
    dots: draft.dots?.map(mv),
    circles: draft.circles?.map((c) => ({ ...c, c: mv(c.c) })),
    arcs: draft.arcs?.map((a) => ({ ...a, c: mv(a.c) })),
    texts: draft.texts?.map((t) => ({ ...t, at: mv(t.at) })),
  };
}

/** 그림이 그림 틀 안에 있고 글자끼리·글자와 선·원·호가 겹치지 않는다(공용 검사) */
export { figureOk };

type Make = (rand: () => number) => WordSpec | null;
/** 그림 글자가 겹치면 글자를 몇 px 옮겨 살리고(settleVisual), 그래도 어긋나면 다시 뽑는다(한 번에 40번까지) */
export const guard = (make: Make): Make => (rand) => {
  for (let i = 0; i < 40; i++) {
    const w = make(rand);
    const ok = settleVisual(w);
    if (ok) return ok;
  }
  return null;
};

/** 두 그림을 옆으로 나란히(가운데 맞춤) 놓는다 */
export function sideBySide(a: ShapeScene, b: ShapeScene, gap: number, label: string): ShapeScene {
  const height = Math.max(a.height, b.height);
  const shift = (s: ShapeScene, dx: number, dy: number): Draft => {
    const mv = (p: Pt): Pt => rp([p[0] + dx, p[1] + dy]);
    return {
      label,
      polygons: s.polygons?.map((p) => ({ ...p, points: p.points.map(mv) })),
      lines: s.lines?.map((l) => ({ ...l, from: mv(l.from), to: mv(l.to) })),
      dots: s.dots?.map(mv),
      circles: s.circles?.map((c) => ({ ...c, c: mv(c.c) })),
      arcs: s.arcs?.map((x) => ({ ...x, c: mv(x.c) })),
      texts: s.texts?.map((t) => ({ ...t, at: mv(t.at) })),
    };
  };
  const A = shift(a, 0, (height - a.height) / 2);
  const B = shift(b, a.width + gap, (height - b.height) / 2);
  const cat = <T,>(x?: T[], y?: T[]) => (x || y ? [...(x ?? []), ...(y ?? [])] : undefined);
  return {
    kind: "shape",
    label,
    width: a.width + gap + b.width,
    height,
    polygons: cat(A.polygons, B.polygons),
    lines: cat(A.lines, B.lines),
    dots: cat(A.dots, B.dots),
    circles: cat(A.circles, B.circles),
    arcs: cat(A.arcs, B.arcs),
    texts: cat(A.texts, B.texts),
  };
}

/** 점이 다각형 안에 있는지 */
export function inside(p: Pt, poly: Pt[]) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [a, b] = [poly[i], poly[j]];
    if (a[1] > p[1] !== b[1] > p[1] && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) hit = !hit;
  }
  return hit;
}

/** 도형 바깥쪽(두 변이 이루는 각의 반대쪽)에 꼭짓점 이름(g4-quad와 같은 방식) */
export function vertexTexts(pts: Pt[], nm: string[], off = 13): Texts {
  return pts.map((v, i) => {
    const u1 = unit(sub(pts[(i + pts.length - 1) % pts.length], v));
    const u2 = unit(sub(pts[(i + 1) % pts.length], v));
    let dir = mul(add(u1, u2), -1);
    dir = len(dir) < 1e-6 ? [u1[1], -u1[0]] : unit(dir);
    if (inside(add(v, mul(dir, 2)), pts)) dir = mul(dir, -1);
    return { at: rp(add(v, mul(dir, off))), text: nm[i] };
  });
}

/** 도형 poly의 변 ab 바깥쪽 가운데에 길이 글자(g4-quad의 sideText와 같은 방식) */
export function lengthText(a: Pt, b: Pt, poly: Pt[], text: string): Texts[number] {
  const m = mul(add(a, b), 0.5);
  let n = unit([a[1] - b[1], b[0] - a[0]]);
  if (inside(add(m, mul(n, 2)), poly)) n = mul(n, -1);
  return { at: rp(add(m, mul(n, 11 + Math.abs(n[0]) * 16))), text };
}

/** 두 점 사이 선분(도형 안쪽 높이·대각선 등) 옆에 글자: 선분에 수직으로 off만큼 */
export function segText(a: Pt, b: Pt, text: string, side: 1 | -1 = 1, off?: number): Texts[number] {
  const m = mid2(a, b);
  const n = unit([a[1] - b[1], b[0] - a[0]]);
  const w = [...text].reduce((s, ch) => s + (/[ -~°]/.test(ch) ? 8 : 14), 0);
  // 글자 상자의 반폭·반높이를 선분에 수직인 방향으로 비춘 만큼 + 여백
  const d = off ?? Math.abs(n[0]) * (w / 2) + Math.abs(n[1]) * 7 + 8;
  return { at: rp(add(m, mul(n, d * side))), text };
}
