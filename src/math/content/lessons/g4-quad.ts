import type { ShapeScene } from "../types";
import { pick, randInt, shuffle } from "../../lib/random";
import type { WordSpec } from "../words/word";
import { findTextSpot, settleVisual, textBox, textsClash } from "../figure-check";
import { MARKS, easy as easyBase, mid as midBase, names, word as wordBase } from "./g4";

/**
 * 4-2 사각형: 수직과 수선, 평행, 평행선 사이의 거리, 사다리꼴, 평행사변형, 마름모, 여러 가지 사각형.
 * 교과서·익힘책처럼 그림(모눈·꼭짓점 이름·길이·각 표시)을 보고 푸는 문제를 기본으로 한다.
 * 모눈 문제는 좌표로 수직(내적 0)·평행(외적 0)을 계산해 정답이 하나뿐이게 만든다.
 */

export type Pt = [number, number];
export type Lines = NonNullable<ShapeScene["lines"]>;
export type Texts = NonNullable<ShapeScene["texts"]>;
export type Arcs = NonNullable<ShapeScene["arcs"]>;

export const KO = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ"];
const LINE_NAMES = ["가", "나", "다", "라", "마", "바"];

/* ── 글자 겹침 검사(공용 모듈 figure-check.ts) ── */

export { textBox, textsClash };
export type Make = (rand: () => number) => WordSpec | null;
/** 그림 글자가 겹치면 글자를 몇 px 옮겨 살리고(settleVisual), 그래도 안 되거나 그림 밖이면 다시 뽑는다(한 번에 20번까지) */
export const guard = (make: Make): Make => (rand) => {
  for (let i = 0; i < 20; i++) {
    const w = make(rand);
    const ok = settleVisual(w);
    if (ok) return ok;
  }
  return null;
};
const easy = (id: string, make: Make) => easyBase(id, guard(make));
const mid = (id: string, make: Make) => midBase(id, guard(make));
const word = (id: string, make: Make) => wordBase(id, guard(make));

/* ── 벡터 ── */

export const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
export const mul = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k];
export const dot = (a: Pt, b: Pt) => a[0] * b[0] + a[1] * b[1];
export const cross = (a: Pt, b: Pt) => a[0] * b[1] - a[1] * b[0];
export const len = (a: Pt) => Math.hypot(a[0], a[1]);
export const unit = (a: Pt): Pt => mul(a, 1 / len(a));
export const same = (a: Pt, b: Pt) => a[0] === b[0] && a[1] === b[1];
export const centroid = (ps: Pt[]): Pt => mul(ps.reduce(add, [0, 0] as Pt), 1 / ps.length);
export const rd = (n: number) => Math.round(n * 10) / 10;
export const rp = (p: Pt): Pt => [rd(p[0]), rd(p[1])];
export const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
/** 화면 벡터의 방향각(오른쪽 0°, 시계 반대 방향 +) */
export const deg = (v: Pt) => (Math.atan2(-v[1], v[0]) * 180) / Math.PI;
export const dirAt = (a: number): Pt => [Math.cos((a * Math.PI) / 180), -Math.sin((a * Math.PI) / 180)];
/** 두 직선이 이루는 작은 각(0~90°) */
export const lineAngle = (a: Pt, b: Pt) => (Math.acos(Math.min(1, Math.abs(dot(a, b)) / (len(a) * len(b)))) * 180) / Math.PI;

/** 선분 ab를 [0,w]×[0,h] 안으로 자른다 */
export function clip(a: Pt, b: Pt, w: number, h: number): [Pt, Pt] | null {
  let t0 = 0;
  let t1 = 1;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const p = [-dx, dx, -dy, dy];
  const q = [a[0], w - a[0], a[1], h - a[1]];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return null;
    } else {
      const r = q[i] / p[i];
      if (p[i] < 0) t0 = Math.max(t0, r);
      else t1 = Math.min(t1, r);
    }
  }
  if (t0 >= t1) return null;
  return [add(a, [dx * t0, dy * t0]), add(a, [dx * t1, dy * t1])];
}

/** 두 선분이 서로 엇갈려 만나는지 */
export function segCross(a: Pt, b: Pt, c: Pt, d: Pt) {
  const o = (p: Pt, q: Pt, r: Pt) => Math.sign(cross(sub(q, p), sub(r, p)));
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
}

/** 점 p와 선분 ab 사이의 거리 */
export function segDist(p: Pt, a: Pt, b: Pt) {
  const ab = sub(b, a);
  const t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / dot(ab, ab)));
  return len(sub(p, add(a, mul(ab, t))));
}

/* ── 한국어 ── */

const hasBatchim = (w: string) => {
  const c = w.charCodeAt(w.length - 1) - 0xac00;
  return c >= 0 && c <= 11171 && c % 28 !== 0;
};
const iGa = (w: string) => `${w}${hasBatchim(w) ? "이" : "가"}`;
const ieyo = (w: string) => `${w}${hasBatchim(w) ? "이에요" : "예요"}`;
const iRago = (w: string) => `${w}${hasBatchim(w) ? "이라고" : "라고"}`;
/** ①(일)은 ②(이)는 ③(삼)은 ④(사)는 */
const markEun = (i: number) => `${MARKS[i]}${i % 2 === 0 ? "은" : "는"}`;
const markIGa = (i: number) => `${MARKS[i]}${i % 2 === 0 ? "이" : "가"}`;
const markEul = (i: number) => `${MARKS[i]}${i % 2 === 0 ? "을" : "를"}`;
const markRo = (i: number) => `${MARKS[i]}${i === 2 ? "으로" : "로"}`;
/** 모눈에서 움직인 만큼을 말로: 오른쪽으로 4칸, 위로 1칸 */
export const moveText = ([a, b]: Pt) =>
  [a > 0 ? `오른쪽으로 ${a}칸` : a < 0 ? `왼쪽으로 ${-a}칸` : "", b > 0 ? `아래로 ${b}칸` : b < 0 ? `위로 ${-b}칸` : ""].filter(Boolean).join(", ");
/** 변 이름은 자음 순서대로(변 ㄹㄱ → 변 ㄱㄹ) */
export const sideName = (a: string, b: string) => `변 ${KO.indexOf(a) < KO.indexOf(b) ? a + b : b + a}`;

/** 모눈 방향을 말로: 오른쪽으로 2칸 갈 때 아래로 1칸 */
function describe(v: Pt): string {
  let [a, b] = v;
  const g = gcd(a, b) || 1;
  a /= g;
  b /= g;
  if (b === 0) return "가로 방향";
  if (a === 0) return "세로 방향";
  if (a < 0) [a, b] = [-a, -b];
  return `오른쪽으로 ${a}칸 갈 때 ${b > 0 ? "아래" : "위"}로 ${Math.abs(b)}칸 가는 방향`;
}

/* ── 그림 조각 ── */

/** 직각 표시(꼭짓점 v에서 a·b 쪽으로) */
export function rightMark(v: Pt, a: Pt, b: Pt, s = 9): Lines {
  const u = mul(unit(sub(a, v)), s);
  const w = mul(unit(sub(b, v)), s);
  const p = add(add(v, u), w);
  return [
    { from: rp(add(v, u)), to: rp(p), width: 1.5 },
    { from: rp(p), to: rp(add(v, w)), width: 1.5 },
  ];
}

/**
 * 각 표시 호(시계 반대 방향 from → to)와 글자.
 * 글자는 이등분선 위(안 되면 각 안쪽으로 조금 비낀 곳)에서 호·두 변과 avoid(같은 그림의 다른 선·호·글자)에
 * 닿지 않는 가장 가까운 자리에 둔다. 자리가 없으면 예전 자리(이등분선 base)에 두고 생성기 guard가 다시 뽑는다
 */
export function arcMark(v: Pt, from: number, to: number, r: number, label?: string, gap = 12, avoid: Partial<ShapeScene> = {}): { arcs: Arcs; texts: Texts } {
  const arcs: Arcs = [{ c: rp(v), r, from: rd(from), to: rd(to) }];
  if (!label) return { arcs, texts: [] };
  // 좁은 각은 글자가 두 변 사이에 들어가도록 꼭짓점에서 더 멀리(글자 반폭 13px 이상 떨어지게)
  const sweep = to - from;
  const base = Math.max(r + gap, Math.min(70, 13 / Math.sin(((sweep / 2) * Math.PI) / 180)));
  const probe: ShapeScene = {
    kind: "shape",
    width: 0,
    height: 0,
    label: "",
    arcs: [...arcs, ...(avoid.arcs ?? [])],
    lines: [...[from, to].map((d) => ({ from: v, to: add(v, mul(dirAt(d), 200)) })), ...(avoid.lines ?? [])],
    polygons: avoid.polygons,
    circles: avoid.circles,
    dots: avoid.dots,
    texts: avoid.texts,
  };
  const spots: Pt[] = [];
  for (let t = base; t <= Math.max(base, 70) + 20; t += 1)
    for (const k of [0, 0.25, -0.25, 0.5, -0.5]) spots.push(rp(add(v, mul(dirAt((from + to) / 2 + (k * sweep) / 2), t))));
  const at = findTextSpot(probe, label, spots, 0) ?? rp(add(v, mul(dirAt((from + to) / 2), base)));
  return { arcs, texts: [{ at, text: label }] };
}

/** 꼭짓점 v에서 a, b 쪽 두 변이 이루는 각(180° 이하)에 호 표시 */
export function angleAt(v: Pt, a: Pt, b: Pt, r: number, label?: string, gap?: number, avoid?: Partial<ShapeScene>) {
  let f = deg(sub(a, v));
  let sweep = (((deg(sub(b, v)) - f) % 360) + 360) % 360;
  if (sweep > 180) {
    f = deg(sub(b, v));
    sweep = 360 - sweep;
  }
  return arcMark(v, f, f + sweep, r, label, gap, avoid);
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

/** 도형 바깥쪽(두 변이 이루는 각의 반대쪽)에 꼭짓점 이름 — 오목한 꼭짓점도 바깥에 */
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

/** 도형 poly의 변 ab 바깥쪽 가운데에 길이 글자 */
export function sideText(a: Pt, b: Pt, poly: Pt[], text: string): Texts[number] {
  const m = mul(add(a, b), 0.5);
  let n = unit([a[1] - b[1], b[0] - a[0]]);
  if (inside(add(m, mul(n, 2)), poly)) n = mul(n, -1);
  return { at: rp(add(m, mul(n, 11 + Math.abs(n[0]) * 16))), text };
}

/* ── 모눈 ── */

export const C = 20;
/** 모눈 좌표 → 그림 좌표(바깥에 한 칸 여백) */
export const gp = (p: Pt, c = C): Pt => [(p[0] + 1) * c, (p[1] + 1) * c];
export function gridScene(cols: number, rows: number, label: string, extra: Partial<ShapeScene>, c = C): ShapeScene {
  return { kind: "shape", width: (cols + 2) * c, height: (rows + 2) * c, label, grid: c, ...extra };
}

/** 모눈 도형을 90°씩 돌리거나 뒤집어 왼쪽 위에 붙인다 */
export function pose(rand: () => number, pts: Pt[]): Pt[] {
  let q = pts.map((p) => [...p] as Pt);
  if (rand() < 0.5) q = q.map(([x, y]) => [-x, y] as Pt);
  for (let k = randInt(rand, 0, 3); k > 0; k--) q = q.map(([x, y]) => [-y, x] as Pt);
  const mx = Math.min(...q.map((p) => p[0]));
  const my = Math.min(...q.map((p) => p[1]));
  return q.map(([x, y]) => [x - mx, y - my] as Pt);
}

export const sides = (pts: Pt[]) => pts.map((p, i) => sub(pts[(i + 1) % pts.length], p));
/** 서로 수직인 변의 쌍(변 번호) */
export const perpPairs = (pts: Pt[]) => pairsOf(pts, (a, b) => dot(a, b) === 0);
/** 서로 평행한 변의 쌍 */
export const parPairs = (pts: Pt[]) => pairsOf(pts, (a, b) => cross(a, b) === 0);
function pairsOf(pts: Pt[], ok: (a: Pt, b: Pt) => boolean): [number, number][] {
  const s = sides(pts);
  const out: [number, number][] = [];
  for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) if (ok(s[i], s[j])) out.push([i, j]);
  return out;
}
export const isConvex = (pts: Pt[]) => {
  const s = sides(pts);
  const signs = s.map((v, i) => Math.sign(cross(v, s[(i + 1) % s.length])));
  return signs.every((x) => x === signs[0] && x !== 0);
};

/** 모눈 위 다각형 그림과 꼭짓점 이름(시작 꼭짓점은 무작위) */
export function latticePolygon(rand: () => number, base: Pt[], label: string, c = 24) {
  const pts = pose(rand, base);
  const n = pts.length;
  const start = randInt(rand, 0, n - 1);
  const nm = pts.map((_, i) => KO[(i - start + n) % n]);
  const w = Math.max(...pts.map((p) => p[0]));
  const h = Math.max(...pts.map((p) => p[1]));
  const screen = pts.map((p) => gp(add(p, [1, 1]), c));
  const scene = gridScene(w + 2, h + 2, label, { polygons: [{ points: screen }], texts: vertexTexts(screen, nm) }, c);
  const sideLabel = (i: number) => sideName(nm[i], nm[(i + 1) % n]);
  return { pts, nm, scene, sideLabel };
}

/* ── 친구 말 ── */

type Say = { text: string; fix: string };
const statement = (id: string, subject: string, trues: string[], falses: Say[], hint: string) =>
  word(id, (rand) => {
    const ns = names(rand, 4);
    const wrong = pick(rand, falses);
    const says = shuffle(rand, [wrong.text, ...shuffle(rand, trues).slice(0, 3)]);
    const who = ns[says.indexOf(wrong.text)];
    return {
      key: `${says.join("|")}:${ns.join()}`,
      prompt: `${subject}에 대해 친구들이 말했습니다. 잘못 말한 친구를 고르세요.`,
      visual: { kind: "table", header: ["이름", "한 말"], rows: says.map((s, i) => [ns[i], s]) },
      answer: who,
      choices: ns,
      hint,
      explanation: `${who}의 말이 틀렸어요. 바르게 고치면 '${wrong.fix}'`,
    };
  });

/* ════════ 수직과 수선 ════════ */

export const l4PerpTerm = easy("l4-perp-term", (rand) => {
  const th = pick(rand, [0, 15, 25, 35, -15, -25]);
  const c: Pt = [150, 92];
  const u = dirAt(th);
  const v = dirAt(th + 90);
  const ask = pick(rand, ["rel", "sun", "sun2"] as const);
  const [na, nb] = ask === "sun2" ? ["나", "가"] : ["가", "나"];
  return {
    key: `${ask}:${th}`,
    prompt:
      ask === "rel"
        ? "두 직선 가와 나가 만나서 이루는 각이 직각입니다. 두 직선은 서로 □입니다. □에 알맞은 말을 고르세요."
        : `두 직선 가와 나가 만나서 이루는 각이 직각입니다. 직선 ${na}는 직선 ${nb}에 대한 □입니다. □에 알맞은 말을 고르세요.`,
    visual: {
      kind: "shape",
      width: 300,
      height: 184,
      label: "직각으로 만나는 직선 가와 직선 나",
      lines: [
        { from: rp(sub(c, mul(u, 115))), to: rp(add(c, mul(u, 115))) },
        { from: rp(sub(c, mul(v, 72))), to: rp(add(c, mul(v, 72))) },
        ...rightMark(c, add(c, u), add(c, v), 11),
      ],
      texts: [
        { at: rp(add(add(c, mul(u, 115)), mul(v, 12))), text: "가" },
        { at: rp(add(add(c, mul(v, 72)), mul(u, 12))), text: "나" },
      ],
    },
    answer: ask === "rel" ? "수직" : "수선",
    choices: shuffle(rand, ["수직", "수선", "평행", "평행선"]),
    hint: "두 직선의 관계를 말할 때는 '수직', 한 직선을 다른 직선에 대하여 말할 때는 '수선'이라고 해요.",
    explanation:
      ask === "rel"
        ? "두 직선이 만나서 이루는 각이 직각이면 두 직선은 서로 수직입니다."
        : `두 직선이 서로 수직일 때, 직선 ${na}는 직선 ${nb}에 대한 수선입니다.`,
  };
});

/** 기울기를 모눈으로 확인할 수 있는 방향들(오른쪽 a칸, 아래 b칸) */
const STEEP: Pt[] = [];
for (let a = -3; a <= 3; a++) for (let b = 1; b <= 3; b++) if (gcd(a, b) === 1) STEEP.push([a, b]);
/** 한 줄로 늘어놓아도 옆 직선과 겹치지 않는 가파른 방향 */
const ROW_DIRS: Pt[] = STEEP.filter(([a, b]) => Math.abs(a) <= b);

export const l4PerpPick = easy("l4-perp-pick", (rand) => {
  const cols = 16;
  const rows = 12;
  const d = pick(rand, [[1, 0], [2, 1], [2, -1], [3, 1], [3, -1]] as Pt[]);
  const O: Pt = [8, 6];
  let n: Pt = [-d[1], d[0]];
  if (n[1] < 0) n = mul(n, -1);
  const pool = shuffle(rand, STEEP.filter((e) => cross(e, d) !== 0 && lineAngle(e, d) >= 40 && lineAngle(e, n) >= 18));
  const dirs = shuffle(rand, [n, ...pool.slice(0, 3)]);
  const ts = d[0] === 1 ? [-6, -2, 2, 6] : d[0] === 2 ? [-3, -1, 1, 3] : [-2, -1, 1, 2];
  const inBox = (p: Pt) => p[0] >= 0 && p[0] <= cols && p[1] >= 0 && p[1] <= rows;
  const segs: [Pt, Pt][] = [];
  for (let i = 0; i < 4; i++) {
    const P = add(O, mul(d, ts[i]));
    const e = dirs[i];
    // 모눈 점을 하나 더 지나야 기울기를 셀 수 있다
    if (!inBox(add(P, e)) || !inBox(sub(P, e))) return null;
    const hl = Math.max(3, len(e) + 0.5);
    const s = clip(sub(P, mul(unit(e), hl)), add(P, mul(unit(e), hl)), cols, rows);
    if (!s) return null;
    segs.push(s);
  }
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) if (segCross(...segs[i], ...segs[j])) return null;
  const L = clip(sub(O, mul(d, 20)), add(O, mul(d, 20)), cols, rows)!;
  const top = (s: [Pt, Pt]) => (s[0][1] < s[1][1] ? s[0] : s[1]);
  // 보기 번호끼리 1.5칸(30px) 이상 떨어지게
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) if (len(sub(top(segs[i]), top(segs[j]))) < 1.5) return null;
  const idx = dirs.indexOf(n);
  return {
    key: `${d.join()}:${dirs.map((x) => x.join()).join("|")}`,
    prompt: "직선 가에 대한 수선을 고르세요.",
    visual: gridScene(cols, rows, "모눈 위의 직선 가와 직선 ①~④", {
      lines: [{ from: rp(gp(L[0])), to: rp(gp(L[1])) }, ...segs.map((s) => ({ from: rp(gp(s[0])), to: rp(gp(s[1])) }))],
      texts: [{ at: rp(add(gp(L[1]), [-6, -11])), text: "가" }, ...segs.map((s, i) => ({ at: rp(add(gp(top(s)), [0, -10])), text: MARKS[i] }))],
    }),
    answer: MARKS[idx],
    choices: MARKS,
    hint: "직선 가와 만나서 이루는 각이 직각인 직선을 찾아요. 모눈의 칸 수로 기울어진 방향을 확인해요.",
    explanation: `직선 가는 ${describe(d)}이고, ${markEun(idx)} ${describe(n)}이라서 직선 가와 직각으로 만나요. 그래서 ${markIGa(idx)} 직선 가에 대한 수선이에요.`,
  };
});

/* 수직·평행 판별용 도형(모든 수직인 변의 쌍이 서로 이웃한다 — 떨어진 변끼리 수직인 모호한 도형은 쓰지 않음) */
export const PERP_SHAPES: Pt[][] = [
  [[2, 0], [4, 2], [4, 5], [0, 5], [0, 2]],
  [[2, 0], [4, 1], [4, 4], [0, 4], [0, 1]],
  [[0, 1], [3, 0], [5, 2], [3, 4], [0, 4]],
  [[0, 0], [3, 0], [5, 3], [0, 3]],
  [[0, 0], [5, 0], [5, 3], [0, 3]],
  [[0, 0], [0, 3], [4, 3]],
];
/** 평행한 변을 묻는 도형(오각형 이상은 평행한 변이 하나뿐인 변이 있다) */
export const PAR_SHAPES: Pt[][] = [
  [[1, 0], [3, 0], [4, 2], [3, 4], [1, 4], [0, 2]],
  [[1, 0], [3, 0], [4, 1], [4, 3], [3, 4], [1, 4], [0, 3], [0, 1]],
  [[2, 0], [4, 2], [4, 5], [0, 5], [0, 2]],
  [[0, 0], [4, 0], [5, 2], [3, 4], [0, 4]],
  [[1, 0], [4, 0], [3, 2], [0, 2]],
  [[1, 0], [3, 0], [4, 2], [0, 2]],
  [[0, 0], [5, 0], [5, 3], [0, 3]],
];

/** 도형에서 변 □에 수직인/평행한 변 고르기(오각형 이상) */
const sidePick = (id: string, rel: "perp" | "par") =>
  easy(id, (rand) => {
    const base = pick(rand, (rel === "perp" ? PERP_SHAPES : PAR_SHAPES).filter((s) => s.length >= 5));
    const { pts, scene, sideLabel } = latticePolygon(rand, base, "꼭짓점에 이름을 붙인 도형");
    const pairs = rel === "perp" ? perpPairs(pts) : parPairs(pts);
    const partners = (i: number) => pairs.filter((p) => p.includes(i)).map(([a, b]) => (a === i ? b : a));
    const cand = pts.map((_, i) => i).filter((i) => partners(i).length === 1);
    if (!cand.length) return null;
    const i = pick(rand, cand);
    const j = partners(i)[0];
    const others = shuffle(rand, pts.map((_, k) => k).filter((k) => k !== i && k !== j)).slice(0, 3);
    const choices = shuffle(rand, [j, ...others].map(sideLabel));
    const relWord = rel === "perp" ? "수직인" : "평행한";
    return {
      key: `${JSON.stringify(pts)}:${i}:${choices.join()}`,
      prompt: `도형에서 ${sideLabel(i)}과 ${relWord} 변을 고르세요.`,
      visual: scene,
      answer: sideLabel(j),
      choices,
      hint: rel === "perp" ? "두 변이 만나서 이루는 각이 직각인지 모눈으로 확인해요." : "두 변을 길게 늘여도 서로 만나지 않는지, 기울어진 방향이 같은지 모눈으로 확인해요.",
      explanation: `${sideLabel(i)}과 ${sideLabel(j)}은 ${rel === "perp" ? "만나서 직각을 이루므로 서로 수직" : "기울어진 방향이 같아 늘여도 만나지 않으므로 서로 평행"}이에요.`,
    };
  });

/** 도형에서 수직인/평행한 변은 모두 몇 쌍 */
const pairCount = (id: string, rel: "perp" | "par") =>
  mid(id, (rand) => {
    const { pts, scene } = latticePolygon(rand, pick(rand, rel === "perp" ? PERP_SHAPES : PAR_SHAPES), "꼭짓점에 이름을 붙인 도형");
    const n = (rel === "perp" ? perpPairs(pts) : parPairs(pts)).length;
    return {
      key: `${JSON.stringify(pts)}`,
      prompt: `도형에서 서로 ${rel === "perp" ? "수직인" : "평행한"} 변은 모두 몇 쌍인가요?`,
      visual: scene,
      answer: n,
      unit: "쌍",
      hint: rel === "perp" ? "직각을 이루는 곳을 찾아 한 곳에 한 쌍씩 세어요." : "마주 보는 변 중 기울어진 방향이 같은 두 변을 한 쌍으로 세어요.",
      explanation: `서로 ${rel === "perp" ? "수직인" : "평행한"} 변은 ${n}쌍이에요.`,
    };
  });

export const l4PerpSide = sidePick("l4-perp-side", "perp");
export const l4PerpPairCount = pairCount("l4-perp-pair-count", "perp");

/** 점 ㄱ을 지나고 직선 가에 수직인/평행한 직선이 지나는 점 */
const throughPoint = (id: string, rel: "perp" | "par") =>
  mid(id, (rand) => {
    const cols = 12;
    const rows = 9;
    const d = pick(rand, [[1, 0], [0, 1], [1, 1], [1, -1], [2, 1], [1, 2], [2, -1], [1, -2]] as Pt[]);
    const O: Pt = [randInt(rand, 4, 8), randInt(rand, 3, 6)];
    const n: Pt = [-d[1], d[0]];
    const t = rel === "perp" ? n : d;
    const other = rel === "perp" ? d : n;
    const all: Pt[] = [];
    for (let x = 0; x <= cols; x++) for (let y = 0; y <= rows; y++) all.push([x, y]);
    const onGa = (p: Pt) => cross(sub(p, O), d) === 0;
    const g = pick(rand, all.filter((p) => Math.abs(cross(sub(p, O), d)) / len(d) >= 2 && p[0] >= 1 && p[0] < cols && p[1] >= 1 && p[1] < rows));
    const onT = (p: Pt) => cross(sub(p, g), t) === 0;
    const okPt = (p: Pt) => !same(p, g) && !onGa(p) && len(sub(p, g)) >= 2;
    const ansPool = all.filter((p) => onT(p) && okPt(p));
    if (!ansPool.length) return null;
    const ans = pick(rand, ansPool);
    const wrongs: Pt[] = [];
    const apart = (p: Pt) => [ans, g, ...wrongs].every((q) => len(sub(p, q)) >= 1.9);
    // 수직·평행을 바꿔 생각한 점 하나, 정답 근처의 헷갈리는 점 둘
    for (const p of shuffle(rand, all.filter((p) => cross(sub(p, g), other) === 0 && okPt(p)))) if (apart(p)) { wrongs.push(p); break; }
    for (const p of shuffle(rand, all.filter((p) => !onT(p) && okPt(p) && len(sub(p, ans)) <= 2.3))) {
      if (wrongs.length >= 3) break;
      if (apart(p)) wrongs.push(p);
    }
    if (wrongs.length < 3) return null;
    const cands = shuffle(rand, [ans, ...wrongs]);
    const idx = cands.indexOf(ans);
    const L = clip(sub(O, mul(d, 30)), add(O, mul(d, 30)), cols, rows)!;
    const end = L[1][1] > L[0][1] || (L[1][1] === L[0][1] && L[1][0] > L[0][0]) ? L[1] : L[0];
    const relWord = rel === "perp" ? "수직인" : "평행한";
    return {
      key: `${d.join()}:${O.join()}:${g.join()}:${cands.map((p) => p.join()).join("|")}`,
      prompt: `점 ㄱ을 지나고 직선 가${rel === "perp" ? "에" : "와"} ${relWord} 직선을 그으려고 합니다. 이 직선이 지나는 점을 고르세요.`,
      visual: gridScene(cols, rows, "모눈 위의 직선 가, 점 ㄱ과 점 ①~④", {
        lines: [{ from: rp(gp(L[0])), to: rp(gp(L[1])) }],
        dots: [gp(g), ...cands.map((p) => gp(p))],
        texts: [
          { at: rp(add(add(gp(end), mul(unit(d), end === L[1] ? -12 : 12)), mul(unit([d[1], -d[0]]), d[0] >= 0 ? 13 : -13))), text: "가" },
          { at: rp(add(gp(g), [9, -10])), text: "ㄱ" },
          ...cands.map((p, i) => ({ at: rp(add(gp(p), [10, -10])), text: MARKS[i] })),
        ],
      }),
      answer: MARKS[idx],
      choices: MARKS,
      hint: `직선 가가 모눈에서 어느 방향으로 가는지 칸을 세어 보고, 점 ㄱ에서 ${rel === "perp" ? "그 방향과 직각이 되는" : "그 방향과 똑같은"} 방향으로 가 보세요.`,
      explanation: `직선 가는 ${describe(d)}이에요. 점 ㄱ에서 ${describe(t)}으로 그은 직선이 직선 가${rel === "perp" ? "에 수직" : "와 평행"}이고, 이 직선은 ${markEul(idx)} 지나요.`,
    };
  });

export const l4PerpThrough = throughPoint("l4-perp-through", "perp");

/** 수직인 두 직선 가(가로)·나(세로)와 점 O에서 그은 반직선 */
const AX = { O: [150, 118] as Pt, w: 300, h: 210 };
function axesScene(label: string, rays: number[], mirror: boolean, parts: { arcs: Arcs; texts: Texts }[]): ShapeScene {
  const { O } = AX;
  const flip = (a: number) => (mirror ? 180 - a : a);
  return {
    kind: "shape",
    width: AX.w,
    height: AX.h,
    label,
    lines: [
      { from: [18, O[1]], to: [282, O[1]] },
      { from: [O[0], 14], to: [O[0], 200] },
      ...rightMark(O, add(O, dirAt(flip(0))), add(O, dirAt(270)), 11),
      ...rays.map((a) => ({ from: O, to: rp(add(O, mul(dirAt(flip(a)), 100))) })),
    ],
    arcs: parts.flatMap((p) => p.arcs),
    texts: [{ at: [mirror ? 26 : 274, O[1] - 12], text: "가" }, { at: [O[0] + 12, 20], text: "나" }, ...parts.flatMap((p) => p.texts)],
  };
}
/** 좌우를 뒤집을 때 호의 시작·끝 각도 */
const arcOf = (mirror: boolean, from: number, to: number, r: number, label: string, avoid: Partial<ShapeScene> = {}) =>
  mirror ? arcMark(AX.O, 180 - to, 180 - from, r, label, 12, avoid) : arcMark(AX.O, from, to, r, label, 12, avoid);
/** 각 표시를 차례로 놓되, 앞서 놓은 선(두 직선·반직선)·호·글자를 피해 글자 자리를 잡는다 */
function axesMarks(rays: number[], mirror: boolean, marks: [number, number, number, string][]): { arcs: Arcs; texts: Texts }[] {
  const base = axesScene("", rays, mirror, []);
  // 호는 글자와 상관없이 정해지므로 다른 호를 모두 피해 글자를 놓는다(뒤에 그릴 큰 호가 앞 글자를 지나지 않게)
  const allArcs = marks.flatMap(([f, t, r]) => arcOf(mirror, f, t, r, "").arcs);
  const done: { arcs: Arcs; texts: Texts }[] = [];
  for (const [i, [f, t, r, label]] of marks.entries())
    done.push(arcOf(mirror, f, t, r, label, { lines: base.lines, arcs: allArcs.filter((_, k) => k !== i), texts: [...base.texts!, ...done.flatMap((d) => d.texts)] }));
  return done;
}

export const l4PerpAngle = mid("l4-perp-angle", (rand) => {
  const th = randInt(rand, 5, 13) * 5;
  const mirror = rand() < 0.5;
  const ask = pick(rand, ["rest", "over"] as const);
  const given = ask === "rest" ? th : 90 - th;
  const ans = ask === "rest" ? 90 - th : 180 - th;
  const parts = axesMarks(
    [th],
    mirror,
    ask === "rest"
      ? [
          [0, th, 26, `${th}°`],
          [th, 90, 40, "㉠"],
        ]
      : [
          [th, 90, 26, `${90 - th}°`],
          [th, 180, 44, "㉠"],
        ],
  );
  return {
    key: `${ask}:${th}:${mirror}`,
    prompt: "직선 가와 직선 나는 서로 수직입니다. 각 ㉠의 크기는 몇 도인가요?",
    visual: axesScene("서로 수직인 직선 가, 나와 한 점에서 그은 반직선", [th], mirror, parts),
    answer: ans,
    unit: "°",
    hint: "서로 수직인 두 직선이 만나서 이루는 각은 90°예요.",
    explanation: ask === "rest" ? `90° − ${given}° = ${ans}°` : `90° + ${given}° = ${ans}°`,
    mistakes: ask === "rest" ? { [180 - th]: "일직선(180°)에서 뺐어요. 수직인 두 직선이 이루는 각은 90°예요." } : { [th]: "90°에서 뺐어요. ㉠은 직각보다 큰 각이에요." },
  };
});

export const l4PerpTwoRays = word("l4-perp-two-rays", (rand) => {
  const a = randInt(rand, 5, 13) * 5;
  const b = randInt(rand, 5, 13) * 5;
  const ans = 90 - a + b;
  if (a === 45 || ans < 45 || ans > 150 || 180 - a < 105 || 90 - b < 15) return null;
  const mirror = rand() < 0.5;
  const parts = axesMarks([180 - a, 90 - b], mirror, [
    [180 - a, 180, 28, `${a}°`],
    [90 - b, 90, 28, `${b}°`],
    [90 - b, 180 - a, 52, "㉠"],
  ]);
  const mistakes: Record<string, string> = {};
  if (a + b !== ans) mistakes[a + b] = "주어진 두 각을 더하기만 했어요. 직선 나 왼쪽 부분은 90°에서 빼서 구해요.";
  return {
    key: `${a}:${b}:${mirror}`,
    prompt: "직선 가와 직선 나는 서로 수직입니다. 각 ㉠의 크기는 몇 도인가요?",
    visual: axesScene("서로 수직인 직선 가, 나와 한 점에서 그은 반직선 두 개", [180 - a, 90 - b], mirror, parts),
    answer: ans,
    unit: "°",
    hint: "각 ㉠을 직선 나를 기준으로 두 부분으로 나누어 생각해요. 직선 가와 나가 이루는 각은 90°예요.",
    explanation: `직선 나 한쪽: 90° − ${a}° = ${90 - a}°, 다른 쪽: ${b}° → ㉠ = ${90 - a}° + ${b}° = ${ans}°`,
    mistakes,
  };
});

export const l4PerpStatement = statement(
  "l4-perp-statement",
  "수직과 수선",
  [
    "서로 수직인 두 직선이 만나서 이루는 각은 직각입니다.",
    "직선 가가 직선 나에 대한 수선이면, 직선 나도 직선 가에 대한 수선입니다.",
    "한 직선에 수직인 직선은 셀 수 없이 많이 그을 수 있습니다.",
    "직선 위에 없는 한 점을 지나고 그 직선에 수직인 직선은 1개만 그을 수 있습니다.",
    "삼각자의 직각 부분이나 각도기의 90° 눈금을 이용해 수선을 그을 수 있습니다.",
  ],
  [
    { text: "서로 수직인 두 직선은 아무리 늘여도 만나지 않습니다.", fix: "서로 수직인 두 직선은 만나서 직각을 이룹니다." },
    { text: "직선 위에 없는 한 점을 지나고 그 직선에 수직인 직선은 2개 그을 수 있습니다.", fix: "1개만 그을 수 있습니다." },
    { text: "한 직선에 수직인 직선은 1개만 그을 수 있습니다.", fix: "한 직선에 수직인 직선은 셀 수 없이 많이 그을 수 있습니다." },
    { text: "두 직선이 만나서 이루는 각이 60°이면 두 직선은 서로 수직입니다.", fix: "두 직선이 만나서 이루는 각이 90°(직각)일 때 서로 수직입니다." },
    { text: "수선은 항상 세로 방향으로만 그을 수 있습니다.", fix: "수선은 어느 방향이든 한 직선과 직각으로 만나면 됩니다." },
  ],
  "수직은 두 직선이 만나서 직각을 이루는 관계예요. 한 가지씩 그림을 떠올리며 확인해요.",
);

/* ════════ 평행 ════════ */

export const l4ParTerm = easy("l4-par-term", (rand) => {
  const th = pick(rand, [0, 12, 22, -12, -22]);
  const u = dirAt(th);
  const v = dirAt(th + 90);
  const gap = randInt(rand, 50, 70);
  const c1: Pt = add([150, 92], mul(v, gap / 2));
  const c2: Pt = add([150, 92], mul(v, -gap / 2));
  const ask = rand() < 0.5 ? "rel" : "name";
  return {
    key: `${ask}:${th}:${gap}`,
    prompt:
      ask === "rel"
        ? "직선 가와 직선 나는 아무리 길게 늘여도 서로 만나지 않습니다. 두 직선은 서로 □합니다. □에 알맞은 말을 고르세요."
        : "직선 가와 직선 나는 아무리 길게 늘여도 서로 만나지 않습니다. 이와 같은 두 직선을 무엇이라고 하나요?",
    visual: {
      kind: "shape",
      width: 300,
      height: 184,
      label: "서로 만나지 않는 직선 가와 직선 나",
      lines: [c1, c2].map((c) => ({ from: rp(sub(c, mul(u, 120))), to: rp(add(c, mul(u, 120))) })),
      texts: [
        { at: rp(add(add(c1, mul(u, 132)), [0, 0])), text: "가" },
        { at: rp(add(add(c2, mul(u, 132)), [0, 0])), text: "나" },
      ],
    },
    answer: ask === "rel" ? "평행" : "평행선",
    choices: shuffle(rand, ["평행", "평행선", "수직", "수선"]),
    hint: "서로 만나지 않는 두 직선의 관계는 '평행', 평행한 두 직선 자체는 '평행선'이라고 불러요.",
    explanation: ask === "rel" ? "서로 만나지 않는 두 직선을 평행하다고 합니다." : "평행한 두 직선을 평행선이라고 합니다.",
  };
});

/** 가파른 직선을 한 줄로 늘어놓은 모눈 그림 — 윗끝을 모눈 점에 같은 간격(4칸)으로 두어 이름이 붙지 않게, 서로 엇갈리지 않게 */
function rowLines(dirs: Pt[], labels: string[], label: string): ShapeScene | null {
  const c = 16;
  const step = 4;
  const depth = 5;
  const raw = dirs.map((e, i): [Pt, Pt] => {
    const T: Pt = [step * i, 0];
    return [T, add(T, mul(e, depth / e[1]))];
  });
  for (let i = 0; i + 1 < raw.length; i++) if (segCross(...raw[i], ...raw[i + 1])) return null;
  const xs = raw.flatMap((s) => [s[0][0], s[1][0]]);
  const x0 = Math.floor(Math.min(...xs));
  const segs = raw.map((s) => s.map((p) => [p[0] - x0, p[1] + 1] as Pt) as [Pt, Pt]);
  const cols = Math.ceil(Math.max(...xs) - x0);
  return gridScene(cols, depth + 1, label, {
    lines: segs.map((s) => ({ from: rp(gp(s[0], c)), to: rp(gp(s[1], c)) })),
    texts: segs.map((s, i) => ({ at: rp(add(gp(s[0], c), [0, -10])), text: labels[i] })),
  }, c);
}

export const l4ParPick = easy("l4-par-pick", (rand) => {
  const d = pick(rand, ROW_DIRS);
  const wrong = shuffle(rand, ROW_DIRS.filter((e) => lineAngle(e, d) >= 15)).slice(0, 3);
  const cands = shuffle(rand, [d, ...wrong]);
  const scene = rowLines([d, ...cands], ["가", ...MARKS], "모눈 위의 직선 가와 직선 ①~④");
  if (!scene) return null;
  const idx = cands.indexOf(d);
  return {
    key: `${d.join()}:${cands.map((x) => x.join()).join("|")}`,
    prompt: "직선 가와 평행한 직선을 고르세요.",
    visual: scene,
    answer: MARKS[idx],
    choices: MARKS,
    hint: "모눈의 칸을 세어 직선 가와 기울어진 방향이 똑같은 직선을 찾아요. 그런 직선은 늘여도 직선 가와 만나지 않아요.",
    explanation: `직선 가와 ${markEun(idx)} 모두 ${describe(d)}이라서 아무리 늘여도 만나지 않아요.`,
  };
});

export const l4ParSide = sidePick("l4-par-side", "par");
export const l4ParPairCount = pairCount("l4-par-pair-count", "par");
export const l4ParThrough = throughPoint("l4-par-through", "par");

export const l4ParPerpTwo = mid("l4-par-perp-two", (rand) => {
  const th = pick(rand, [0, 8, 15, -8, -15]);
  const u = dirAt(th);
  const v = dirAt(th + 90);
  const c: Pt = [150, 112];
  const P1 = sub(c, mul(u, 60));
  const P2 = add(c, mul(u, 60));
  const kind = rand() < 0.6 ? "par" : "perp";
  const lines: Lines = [{ from: rp(sub(c, mul(u, 120))), to: rp(add(c, mul(u, 120))) }];
  const texts: Texts = [{ at: rp(add(add(c, mul(u, 120)), mul(v, 12))), text: "가" }];
  lines.push({ from: rp(sub(P1, mul(v, 60))), to: rp(add(P1, mul(v, 78))) }, ...rightMark(P1, add(P1, u), add(P1, v), 10));
  texts.push({ at: rp(add(P1, add(mul(v, 86), mul(u, 10)))), text: "나" });
  if (kind === "par") {
    lines.push({ from: rp(sub(P2, mul(v, 60))), to: rp(add(P2, mul(v, 78))) }, ...rightMark(P2, add(P2, u), add(P2, v), 10));
    texts.push({ at: rp(add(P2, add(mul(v, 86), mul(u, 10)))), text: "다" });
  } else {
    const c3 = add(c, mul(v, 52));
    lines.push({ from: rp(sub(c3, mul(u, 120))), to: rp(add(c3, mul(u, 120))) });
    texts.push({ at: rp(add(add(c3, mul(u, 120)), mul(v, 12))), text: "다" });
  }
  const choices = shuffle(rand, ["서로 평행합니다.", "서로 수직입니다.", "만나서 이루는 각이 45°입니다.", "어떤 관계인지 알 수 없습니다."]);
  return {
    key: `${kind}:${th}:${choices.join()}`,
    prompt:
      kind === "par"
        ? "직선 나와 직선 다는 모두 직선 가에 수직입니다. 직선 나와 직선 다는 서로 어떤 관계인가요?"
        : "직선 가와 직선 나는 서로 수직이고, 직선 가와 직선 다는 서로 평행합니다. 직선 나와 직선 다는 서로 어떤 관계인가요?",
    visual: { kind: "shape", width: 300, height: 214, label: "직선 가, 나, 다", lines, texts },
    answer: kind === "par" ? "서로 평행합니다." : "서로 수직입니다.",
    choices,
    hint: kind === "par" ? "한 직선에 수직인 두 직선은 늘여도 서로 만나지 않아요." : "직선 다는 직선 가와 방향이 같아요. 직선 나가 직선 가와 이루는 각을 떠올려요.",
    explanation: kind === "par" ? "한 직선에 수직인 두 직선은 서로 평행합니다." : "직선 다는 직선 가와 평행하므로, 직선 가에 수직인 직선 나는 직선 다와도 수직으로 만납니다.",
  };
});

export const l4ParLinesCount = word("l4-par-lines-count", (rand) => {
  // 휴대폰에서도 읽히도록 직선은 4~5개
  const n = rand() < 0.4 ? 4 : 5;
  const groups = pick(rand, n === 4 ? [[2, 2], [3, 1]] : [[3, 2], [2, 2, 1], [3, 1, 1]]);
  const dirs = shuffle(rand, ROW_DIRS).slice(0, groups.length);
  for (let i = 0; i < dirs.length; i++) for (let j = i + 1; j < dirs.length; j++) if (lineAngle(dirs[i], dirs[j]) < 15) return null;
  const list = shuffle(rand, groups.flatMap((g, i) => Array.from({ length: g }, () => i)));
  const scene = rowLines(list.map((i) => dirs[i]), LINE_NAMES, `모눈 위의 직선 가~${LINE_NAMES[n - 1]}`);
  if (!scene) return null;
  const ans = groups.reduce((s, g) => s + (g * (g - 1)) / 2, 0);
  const sets = groups.map((_, gi) => list.map((x, k) => (x === gi ? LINE_NAMES[k] : "")).filter(Boolean)).filter((s) => s.length >= 2);
  const mistakes: Record<string, string> = {};
  if (sets.length !== ans) mistakes[sets.length] = "평행한 직선끼리 모은 무리의 수를 셌어요. 무리 안에서 두 직선씩 짝을 지어 세요.";
  return {
    key: list.map((i) => dirs[i].join()).join("|"),
    prompt: "그림에서 서로 평행한 직선은 모두 몇 쌍인가요?",
    visual: scene,
    answer: ans,
    unit: "쌍",
    hint: "기울어진 방향이 같은 직선끼리 모은 다음, 모은 직선 중에서 두 개씩 짝을 지어 세어요.",
    explanation: `${sets.map((s) => `${s.join(", ")} → ${(s.length * (s.length - 1)) / 2}쌍`).join(" / ")} → 모두 ${ans}쌍`,
    mistakes,
  };
});

export const l4ParStatement = statement(
  "l4-par-statement",
  "평행",
  [
    "평행한 두 직선은 아무리 길게 늘여도 서로 만나지 않습니다.",
    "한 직선에 수직인 두 직선은 서로 평행합니다.",
    "직선 위에 없는 한 점을 지나고 그 직선과 평행한 직선은 1개만 그을 수 있습니다.",
    "평행한 두 직선을 평행선이라고 합니다.",
    "직사각형에서 마주 보는 두 변은 서로 평행합니다.",
  ],
  [
    { text: "평행한 두 직선을 길게 늘이면 언젠가는 만납니다.", fix: "평행한 두 직선은 아무리 늘여도 만나지 않습니다." },
    { text: "직선 위에 없는 한 점을 지나고 그 직선과 평행한 직선은 셀 수 없이 많이 그을 수 있습니다.", fix: "1개만 그을 수 있습니다." },
    { text: "한 직선에 수직인 두 직선은 서로 수직입니다.", fix: "한 직선에 수직인 두 직선은 서로 평행합니다." },
    { text: "가로로 놓인 두 직선만 평행선이 될 수 있습니다.", fix: "기울어진 두 직선도 서로 만나지 않으면 평행선입니다." },
  ],
  "평행은 두 직선이 서로 만나지 않는 관계예요. 한 가지씩 그림을 떠올리며 확인해요.",
);

/* ════════ 평행선 사이의 거리 ════════ */

export const l4DistMeasure = easy("l4-dist-measure", (rand) => {
  if (rand() < 0.4) {
    // 모눈 위 평행선
    const horiz = rand() < 0.5;
    const k = randInt(rand, 2, 5);
    const a = randInt(rand, 1, 2);
    const cols = horiz ? 12 : 9;
    const rows = horiz ? 8 : 7;
    const lines: Lines = horiz
      ? [{ from: gp([0, a]), to: gp([cols, a]) }, { from: gp([0, a + k]), to: gp([cols, a + k]) }]
      : [{ from: gp([a, 0]), to: gp([a, rows]) }, { from: gp([a + k, 0]), to: gp([a + k, rows]) }];
    const texts: Texts = horiz
      ? [{ at: add(gp([cols, a]), [-8, -9]), text: "가" }, { at: add(gp([cols, a + k]), [-8, -9]), text: "나" }]
      : [{ at: add(gp([a, 0]), [10, 4]), text: "가" }, { at: add(gp([a + k, 0]), [10, 4]), text: "나" }];
    return {
      key: `grid:${horiz}:${k}:${a}`,
      prompt: "직선 가와 직선 나는 서로 평행합니다. 모눈 한 칸의 길이가 1 cm일 때, 평행선 사이의 거리는 몇 cm인가요?",
      visual: gridScene(cols, rows, "모눈 위의 평행선 가와 나", { lines, texts }),
      answer: k,
      unit: "cm",
      hint: "한 직선에서 다른 직선에 수직으로 그은 선분의 길이를 모눈 칸으로 세어요.",
      explanation: `두 직선에 수직인 방향으로 ${k}칸 떨어져 있으므로 ${k} cm예요.`,
    };
  }
  const d = randInt(rand, 3, 6);
  const extra = shuffle(rand, [1, 2, 3]).slice(0, 2).map((e) => d + e);
  const S = 14;
  const y1 = 30;
  const y2 = y1 + d * S;
  const lens = shuffle(rand, [d, ...extra]);
  const lines: Lines = [];
  const texts: Texts = [];
  // 선분끼리 겹치지 않게 왼쪽부터 차례로 놓는다(길이 글자 자리 58)
  let x = 28;
  const mids: Pt[] = [];
  lens.forEach((L) => {
    const off = rd(Math.sqrt(L * L - d * d) * S);
    const top: Pt = [x, y1];
    const bottom: Pt = [x + off, y2];
    lines.push({ from: top, to: bottom });
    if (L === d) lines.push(...rightMark(bottom, top, [bottom[0] + 1, y2], 8));
    mids.push([(top[0] + bottom[0]) / 2, (y1 + y2) / 2]);
    x += off + 64;
  });
  const width = Math.max(300, Math.ceil(x + 10));
  lines.unshift({ from: [10, y1], to: [width - 22, y1] }, { from: [10, y2], to: [width - 22, y2] });
  texts.push({ at: [width - 8, y1], text: "가" }, { at: [width - 8, y2], text: "나" });
  // 길이 글자는 선분 오른쪽 옆에서 다른 선분·평행선에 닿지 않는 자리(좁은 평행선 사이에서도 버리지 않게)
  for (const [i, m] of mids.entries()) {
    const spots = [26, 30, 22, 34, 38].flatMap((dx) => [0, -5, 5].map((dy) => rp([m[0] + dx, m[1] + dy])));
    const at = findTextSpot({ kind: "shape", width, height: y2 + 26, label: "", lines, texts }, `${lens[i]} cm`, spots, 1);
    if (!at) return null;
    texts.push({ at, text: `${lens[i]} cm` });
  }
  return {
    key: `seg:${lens.join()}`,
    prompt: "직선 가와 직선 나는 서로 평행합니다. 평행선 사이의 거리는 몇 cm인가요?",
    visual: { kind: "shape", width, height: y2 + 26, label: "평행선 가, 나와 두 직선을 잇는 선분 세 개", lines, texts },
    answer: d,
    unit: "cm",
    hint: "평행선 사이의 거리는 두 직선에 수직인 선분의 길이예요. 직각 표시가 있는 선분을 찾아요.",
    explanation: `두 직선에 수직인 선분의 길이가 ${d} cm이므로 평행선 사이의 거리는 ${d} cm예요. 비스듬한 선분은 더 길어요.`,
    mistakes: Object.fromEntries(extra.map((e) => [e, "비스듬한 선분의 길이예요. 수직인 선분의 길이를 재야 해요."])),
  };
});

export const l4DistThree = mid("l4-dist-three", (rand) => {
  const a = randInt(rand, 2, 8);
  const b = randInt(rand, 2, 8);
  const S = 12;
  const ys = [22, 22 + a * S, 22 + (a + b) * S];
  const ask = rand() < 0.6 ? "sum" : "rest";
  const lines: Lines = ys.map((y) => ({ from: [14, y] as Pt, to: [278, y] as Pt }));
  const texts: Texts = ["가", "나", "다"].map((t, i) => ({ at: [293, ys[i]] as Pt, text: t }));
  const seg = (x: number, y1: number, y2: number, label: string) => {
    lines.push({ from: [x, y1], to: [x, y2] }, ...rightMark([x, y2], [x, y1], [x + 1, y2], 7));
    texts.push({ at: [x + 26, (y1 + y2) / 2], text: label });
  };
  seg(56, ys[0], ys[1], `${a} cm`);
  if (ask === "sum") {
    seg(140, ys[1], ys[2], `${b} cm`);
  } else {
    seg(140, ys[1], ys[2], "? cm");
    seg(224, ys[0], ys[2], `${a + b} cm`);
    // 가운데 직선 나에 걸리면(두 거리가 같거나 비슷할 때) 더 넓은 칸 가운데로 옮긴다
    if (Math.abs((ys[0] + ys[2]) / 2 - ys[1]) < 14) texts[texts.length - 1].at = [250, a >= b ? (ys[0] + ys[1]) / 2 : (ys[1] + ys[2]) / 2];
  }
  return {
    key: `${ask}:${a}:${b}`,
    prompt:
      ask === "sum"
        ? "직선 가, 나, 다는 서로 평행합니다. 직선 가와 직선 다 사이의 거리는 몇 cm인가요?"
        : "직선 가, 나, 다는 서로 평행합니다. 직선 나와 직선 다 사이의 거리는 몇 cm인가요?",
    visual: { kind: "shape", width: 310, height: ys[2] + 20, label: "서로 평행한 직선 가, 나, 다와 수직인 선분", lines, texts },
    answer: ask === "sum" ? a + b : b,
    unit: "cm",
    hint: "직선 가에서 직선 다까지 수직으로 가면 직선 나를 지나요.",
    explanation: ask === "sum" ? `${a} + ${b} = ${a + b}(cm)` : `${a + b} − ${a} = ${b}(cm)`,
  };
});

/** 평행사변형·사다리꼴 그림(ㄱ 왼쪽 위, ㄴ 왼쪽 아래, ㄷ 오른쪽 아래, ㄹ 오른쪽 위) — cm 단위를 화면으로 */
export function toScreen(ps: Pt[], maxW = 250, maxH = 140, pad = 34) {
  const xs = ps.map((p) => p[0]);
  const ys = ps.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const S = Math.min(24, maxW / (x1 - x0 || 1), maxH / (y1 - y0 || 1));
  return {
    pts: ps.map(([x, y]) => rp([pad + (x - x0) * S, pad + (y1 - y) * S])),
    width: Math.ceil((x1 - x0) * S + pad * 2),
    height: Math.ceil((y1 - y0) * S + pad * 2),
  };
}

export const l4DistInShape = mid("l4-dist-in-shape", (rand) => {
  const trap = rand() < 0.4;
  const h = randInt(rand, 3, 7);
  const s = h + randInt(rand, 1, 3);
  const off = Math.sqrt(s * s - h * h);
  const b = randInt(rand, Math.ceil(off) + 4, 13);
  const off2 = trap ? randInt(rand, 1, Math.max(1, Math.floor(b - off - 2))) : 0;
  const mathPts: Pt[] = [[off, h], [0, 0], [b, 0], trap ? [b - off2, h] : [b + off, h], [off, 0]];
  const { pts, width, height } = toScreen(mathPts);
  const [g, n, d, r, foot] = pts;
  const c = [g, n, d, r];
  const shape = trap ? "사다리꼴" : "평행사변형";
  return {
    key: `${trap}:${h}:${s}:${b}:${off2}`,
    prompt: `${shape} ㄱㄴㄷㄹ에서 변 ㄱㄹ과 변 ㄴㄷ은 서로 평행합니다. 이 평행선 사이의 거리는 몇 cm인가요?`,
    visual: {
      kind: "shape",
      width,
      height,
      label: `${shape} ㄱㄴㄷㄹ과 점 ㄱ에서 변 ㄴㄷ에 그은 수선`,
      polygons: [{ points: [g, n, d, r] }],
      lines: [{ from: g, to: foot, dashed: true }, ...rightMark(foot, g, d, 8)],
      texts: [
        ...vertexTexts([g, n, d, r], ["ㄱ", "ㄴ", "ㄷ", "ㄹ"]),
        sideText(g, n, c, `${s} cm`),
        sideText(n, d, c, `${b} cm`),
        { at: rp([foot[0] + 22, (g[1] + foot[1]) / 2]), text: `${h} cm` },
      ],
    },
    answer: h,
    unit: "cm",
    hint: "평행선 사이의 거리는 두 변에 수직인 선분의 길이예요.",
    explanation: `점 ㄱ에서 변 ㄴㄷ에 수직으로 그은 선분의 길이가 ${h} cm이므로 평행선 사이의 거리는 ${h} cm예요.`,
    mistakes: { [s]: "비스듬한 변 ㄱㄴ의 길이예요. 평행선 사이의 거리는 수직인 선분의 길이예요.", [b]: "변 ㄴㄷ의 길이예요." },
  };
});

export const l4DistStep = word("l4-dist-step", (rand) => {
  const w1 = randInt(rand, 3, 8);
  const w2 = randInt(rand, 3, 8);
  const h1 = randInt(rand, 3, 7);
  const h2 = randInt(rand, 3, 7);
  const mirror = rand() < 0.5;
  const W = w1 + w2;
  const H = h1 + h2;
  // 계단 모양 도형: 위쪽 변 ㄱㄴ, 아래쪽 변 ㅁㅂ
  let raw: Pt[] = [[0, H], [w1, H], [w1, H - h1], [W, H - h1], [W, 0], [0, 0]];
  if (mirror) raw = raw.map(([x, y]) => [W - x, y]);
  const { pts, width, height } = toScreen(raw, 230, 170, 50);
  const nm = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ"];
  const c = pts;
  const ask = rand() < 0.5 ? "v" : "h";
  const ans = ask === "v" ? H : W;
  const mistakes: Record<string, string> = {};
  for (const [v, why] of [[ask === "v" ? h1 : w1, "한 변의 길이만 답했어요."], [ask === "v" ? h2 : w2, "한 변의 길이만 답했어요."]] as const) if (v !== ans) mistakes[v] = why;
  return {
    key: `${ask}:${w1}:${w2}:${h1}:${h2}:${mirror}`,
    prompt:
      ask === "v"
        ? "도형에서 변 ㄱㄴ과 변 ㅁㅂ은 서로 평행합니다. 이 평행선 사이의 거리는 몇 cm인가요?"
        : "도형에서 변 ㄱㅂ과 변 ㄹㅁ은 서로 평행합니다. 이 평행선 사이의 거리는 몇 cm인가요?",
    visual: {
      kind: "shape",
      width,
      height,
      label: "직각으로 꺾인 계단 모양 육각형 ㄱㄴㄷㄹㅁㅂ",
      polygons: [{ points: pts }],
      texts: [
        ...vertexTexts(pts, nm, 12),
        sideText(pts[0], pts[1], c, `${w1} cm`),
        sideText(pts[1], pts[2], c, `${h1} cm`),
        sideText(pts[2], pts[3], c, `${w2} cm`),
        sideText(pts[3], pts[4], c, `${h2} cm`),
      ],
    },
    answer: ans,
    unit: "cm",
    hint: "평행선 사이의 거리는 두 변에 수직인 선분의 길이예요. 그 방향으로 놓인 변들의 길이를 이어서 생각해요.",
    explanation: ask === "v" ? `변 ㄴㄷ과 변 ㄹㅁ의 길이를 더해요: ${h1} + ${h2} = ${H}(cm)` : `변 ㄱㄴ과 변 ㄷㄹ의 길이를 더해요: ${w1} + ${w2} = ${W}(cm)`,
    mistakes,
  };
});

/* ════════ 사각형 분류(모눈) ════════ */

export type QuadKind = "일반" | "사다리꼴" | "평행사변형" | "마름모" | "직사각형" | "정사각형";

export function quadKind(pts: Pt[]): QuadKind {
  const s = sides(pts);
  const par = (cross(s[0], s[2]) === 0 ? 1 : 0) + (cross(s[1], s[3]) === 0 ? 1 : 0);
  if (par === 0) return "일반";
  if (par === 1) return "사다리꼴";
  const eq = dot(s[0], s[0]) === dot(s[1], s[1]);
  const right = dot(s[0], s[1]) === 0;
  return eq && right ? "정사각형" : right ? "직사각형" : eq ? "마름모" : "평행사변형";
}

/** 모눈 4×4 안에 들어가는 사각형들(종류는 quadKind로 검사) */
export const QUAD_BASE: Record<QuadKind, Pt[][]> = {
  일반: [
    [[0, 0], [1, 4], [3, 3], [4, 1]],
    [[0, 3], [3, 3], [4, 0], [2, 1]],
    [[0, 1], [3, 4], [4, 0], [2, 0]],
  ],
  사다리꼴: [
    [[1, 0], [3, 0], [4, 2], [0, 2]],
    [[0, 0], [2, 0], [4, 3], [0, 3]],
    [[0, 0], [4, 0], [3, 2], [2, 2]],
    [[0, 0], [2, 1], [2, 3], [0, 4]],
  ],
  평행사변형: [
    [[1, 0], [4, 0], [3, 2], [0, 2]],
    [[0, 1], [2, 0], [2, 2], [0, 3]],
    [[0, 0], [2, 0], [4, 3], [2, 3]],
  ],
  마름모: [
    [[1, 0], [2, 2], [1, 4], [0, 2]],
    [[0, 1], [2, 0], [4, 1], [2, 2]],
    [[0, 0], [2, 1], [3, 3], [1, 2]],
  ],
  직사각형: [
    [[0, 0], [4, 0], [4, 2], [0, 2]],
    [[0, 0], [3, 0], [3, 4], [0, 4]],
    [[0, 2], [2, 0], [3, 1], [1, 3]],
  ],
  정사각형: [
    [[0, 0], [3, 0], [3, 3], [0, 3]],
    [[0, 0], [2, 0], [2, 2], [0, 2]],
    [[1, 0], [3, 1], [2, 3], [0, 2]],
  ],
};

const IS: Record<string, (k: QuadKind) => boolean> = {
  사다리꼴: (k) => k !== "일반",
  평행사변형: (k) => ["평행사변형", "마름모", "직사각형", "정사각형"].includes(k),
  마름모: (k) => k === "마름모" || k === "정사각형",
  직사각형: (k) => k === "직사각형" || k === "정사각형",
  정사각형: (k) => k === "정사각형",
};

const REASON: Record<QuadKind, string> = {
  일반: "평행한 변이 한 쌍도 없는 사각형",
  사다리꼴: "평행한 변이 한 쌍만 있는 사각형",
  평행사변형: "마주 보는 두 쌍의 변이 평행하지만 네 변이 모두 같지도, 네 각이 직각이지도 않은 평행사변형",
  마름모: "네 변의 길이가 모두 같은 마름모",
  직사각형: "네 각이 모두 직각인 직사각형",
  정사각형: "네 변의 길이가 모두 같고 네 각이 모두 직각인 정사각형",
};

/** 모눈 2×2 칸에 사각형 ①~④ */
function quadsScene(shapes: Pt[][]): ShapeScene {
  const polygons: NonNullable<ShapeScene["polygons"]> = [];
  const texts: Texts = [];
  shapes.forEach((pts, i) => {
    const ox = 1 + (i % 2) * 6;
    const oy = 1 + Math.floor(i / 2) * 6;
    const w = Math.max(...pts.map((p) => p[0]));
    const h = Math.max(...pts.map((p) => p[1]));
    const sx = ox + Math.floor((4 - w) / 2);
    const sy = oy + Math.floor((4 - h) / 2);
    polygons.push({ points: pts.map((p) => gp([p[0] + sx, p[1] + sy])) });
    texts.push({ at: gp([ox - 0.55, oy - 0.55]), text: MARKS[i] });
  });
  return gridScene(11, 11, "모눈 위의 사각형 ①~④", { polygons, texts });
}

/** strict: 포함 관계를 배우기 전 차시 — 정답(또는 '아닌 것'의 나머지 보기)을 그 도형 자체로만 낸다 */
const quadPick = (id: string, level: 1 | 2, targets: string[], strict = false) =>
  (level === 1 ? easy : mid)(id, (rand) => {
    const target = pick(rand, targets);
    const not = rand() < 0.4;
    const kinds = Object.keys(QUAD_BASE) as QuadKind[];
    const yes = strict ? [target as QuadKind] : kinds.filter((k) => IS[target](k));
    const no = kinds.filter((k) => !IS[target](k));
    const ansKind = pick(rand, not ? no : yes);
    const items = [ansKind, ...Array.from({ length: 3 }, () => pick(rand, not ? yes : no))].map((k) => pose(rand, pick(rand, QUAD_BASE[k])));
    if (new Set(items.map((p) => JSON.stringify(p))).size < 4) return null;
    const order = shuffle(rand, [0, 1, 2, 3]);
    const idx = order.indexOf(0);
    return {
      key: `${target}:${not}:${JSON.stringify(order.map((i) => items[i]))}`,
      prompt: `${not ? `${iGa(target)} 아닌` : `${target}인`} 것을 고르세요.`,
      visual: quadsScene(order.map((i) => items[i])),
      answer: MARKS[idx],
      choices: MARKS,
      hint:
        target === "사다리꼴"
          ? "평행한 변이 한 쌍이라도 있는지 모눈을 따라 확인해요."
          : target === "평행사변형"
            ? "마주 보는 두 쌍의 변이 모두 평행한지 확인해요."
            : target === "마름모"
              ? "네 변의 길이가 모두 같은지 모눈으로 확인해요. 비스듬한 변은 가로·세로로 몇 칸 가는지 비교해요."
              : target === "정사각형"
                ? "네 각이 모두 직각이고 네 변의 길이가 모두 같은지 확인해요."
                : "네 각이 모두 직각인지 확인해요.",
      explanation: `${markEun(idx)} ${REASON[ansKind]}이므로 ${not ? `${iGa(target)} 아니에요` : ieyo(target)}.`,
    };
  });

export const l4TrapPick = quadPick("l4-trap-pick", 1, ["사다리꼴"], true);
export const l4ParaPick = quadPick("l4-para-pick", 2, ["평행사변형"], true);
export const l4RectPick = quadPick("l4-rect-pick", 1, ["직사각형", "정사각형", "마름모"]);
/** 여러 가지 사각형의 관계: 포함 관계로 고르기(○○인 것 / ○○이 아닌 것) */
export const l4QuadRelPick = quadPick("m4-not-quad", 2, ["평행사변형", "마름모", "직사각형", "사다리꼴"]);

/* ════════ 사다리꼴 ════════ */

export const l4TrapParSides = easy("l4-trap-par-sides", (rand) => {
  const { pts, scene, sideLabel } = latticePolygon(rand, pick(rand, QUAD_BASE.사다리꼴), "사다리꼴 ㄱㄴㄷㄹ");
  const pair = cross(sides(pts)[0], sides(pts)[2]) === 0 ? 0 : 1;
  const pairText = (i: number, j: number) => `${sideLabel(i)}과 ${sideLabel(j)}`;
  const ans = pairText(pair, pair + 2);
  const other = pairText(1 - pair, 3 - pair);
  const adj = shuffle(rand, [[0, 1], [1, 2], [2, 3], [3, 0]]).slice(0, 2).map(([i, j]) => pairText(i, j));
  return {
    key: `${JSON.stringify(pts)}:${sideLabel(0)}`,
    prompt: "사다리꼴 ㄱㄴㄷㄹ에서 서로 평행한 두 변을 고르세요.",
    visual: scene,
    answer: ans,
    choices: shuffle(rand, [ans, other, ...adj]),
    hint: "마주 보는 두 변 중에서 모눈을 따라 기울어진 방향이 같은 두 변을 찾아요.",
    explanation: `${ans}은 늘여도 만나지 않으므로 서로 평행해요. 사다리꼴은 평행한 변이 한 쌍이라도 있는 사각형이에요.`,
  };
});

export const l4TrapCut = mid("l4-trap-cut", (rand) => {
  const W = 12;
  const H = 4;
  const k = randInt(rand, 3, 4);
  const tops = Array.from({ length: k }, () => randInt(rand, 1, W - 1)).sort((a, b) => a - b);
  const bots = Array.from({ length: k }, () => randInt(rand, 1, W - 1)).sort((a, b) => a - b);
  const cuts: Pt[] = [[0, 0], ...tops.map((t, i): Pt => [t, bots[i]]), [W, W]];
  const pieces = cuts.slice(0, -1).map((cut, i) => {
    const next = cuts[i + 1];
    const tw = next[0] - cut[0];
    const bw = next[1] - cut[1];
    return { cut, next, tw, bw, tri: tw === 0 || bw === 0, par: tw === bw };
  });
  if (pieces.some((p) => p.tw + p.bw < 3)) return null;
  const triN = pieces.filter((p) => p.tri).length;
  const trapN = pieces.length - triN;
  if (triN < 1 || trapN < 2) return null;
  const SX = 24;
  const SY = 28;
  const P = (x: number, top: boolean): Pt => [18 + x * SX, top ? 16 : 16 + H * SY];
  const labels = LINE_NAMES.slice(0, pieces.length);
  const trapNames = labels.filter((_, i) => !pieces[i].tri);
  const mistakes: Record<string, string> = { [pieces.length]: "삼각형 조각까지 셌어요. 사다리꼴은 사각형이에요." };
  const strict = pieces.filter((p) => !p.tri && !p.par).length;
  if (strict !== trapN) mistakes[strict] = "평행사변형·직사각형 조각도 평행한 변이 있으므로 사다리꼴이에요.";
  return {
    key: `${tops.join()}:${bots.join()}`,
    prompt: "직사각형 모양의 종이를 그림과 같이 선을 따라 모두 잘랐습니다. 잘라 낸 도형 중에서 사다리꼴은 모두 몇 개인가요?",
    visual: {
      kind: "shape",
      width: 36 + W * SX,
      height: 32 + H * SY,
      label: `선을 따라 자른 직사각형 종이 조각 가~${labels[labels.length - 1]}`,
      polygons: [{ points: [P(0, true), P(W, true), P(W, false), P(0, false)] }],
      lines: tops.map((t, i) => ({ from: P(t, true), to: P(bots[i], false) })),
      texts: pieces.map((p, i) => ({ at: rp(mul(add(add(P(p.cut[0], true), P(p.next[0], true)), add(P(p.cut[1], false), P(p.next[1], false))), 0.25)), text: labels[i] })),
    },
    answer: trapN,
    unit: "개",
    hint: "종이의 위쪽 변과 아래쪽 변은 서로 평행해요. 조각마다 위와 아래에 변이 모두 있는지 확인해요.",
    explanation: `${trapNames.join(", ")}는 위와 아래의 변이 서로 평행한 사각형이라 사다리꼴이에요(평행사변형·직사각형도 사다리꼴). 나머지는 삼각형이에요. → ${trapN}개`,
    mistakes,
  };
});

export const l4TrapMove = mid("l4-trap-move", (rand) => {
  const cols = 8;
  const rows = 6;
  const n: Pt = [randInt(rand, 0, 2), randInt(rand, 4, 6)];
  const d: Pt = [randInt(rand, 5, 8), randInt(rand, 4, 6)];
  const r: Pt = [randInt(rand, 4, 7), randInt(rand, 0, 2)];
  const quad = (g: Pt): Pt[] => [g, n, d, r];
  const hasPar = (ps: Pt[]) => parPairs(ps).some(([i, j]) => j - i === 2);
  const all: Pt[] = [];
  for (let x = 0; x <= cols; x++) for (let y = 0; y <= rows; y++) all.push([x, y]);
  const free = all.filter((p) => ![n, d, r].some((q) => same(p, q)) && isConvex(quad(p)));
  // 오답(과 처음 ㄱ)은 마주 보는 두 쌍의 변이 모두 12° 이상 기울기가 달라 평행해 보이지 않게
  const clearlyNot = (ps: Pt[]) => {
    const s = sides(ps);
    return lineAngle(s[0], s[2]) >= 12 && lineAngle(s[1], s[3]) >= 12;
  };
  const bad = free.filter((p) => !hasPar(quad(p)) && clearlyNot(quad(p)));
  const good = free.filter((p) => hasPar(quad(p)));
  if (!bad.length) return null;
  // 처음 ㄱ 위치를 바꿔 가며, 변에서 떨어진 정답 1개와 오답 3개를 찾는다
  for (const g0 of shuffle(rand, bad)) {
    // 보기 점과 번호(오른쪽 위)가 처음 사각형의 변 위에 얹히지 않게
    const edges: [Pt, Pt][] = [[g0, n], [n, d], [d, r], [r, g0]];
    const clear = (p: Pt) => edges.every(([a, b]) => segDist(p, a, b) >= 0.7 && segDist(add(p, [0.5, -0.5]), a, b) >= 0.6);
    const around = (p: Pt) => !same(p, g0) && len(sub(p, g0)) <= 4 && clear(p);
    const answers = good.filter(around);
    if (!answers.length) continue;
    const ans = pick(rand, answers);
    const wrongs: Pt[] = [];
    for (const p of shuffle(rand, bad.filter(around))) {
      if (wrongs.length >= 3) break;
      if ([ans, g0, ...wrongs].every((q) => len(sub(p, q)) >= 1.4)) wrongs.push(p);
    }
    if (wrongs.length < 3) continue;
    return trapMoveSpec(rand, [g0, n, d, r], ans, wrongs);
  }
  return null;
});

function trapMoveSpec(rand: () => number, [g0, n, d, r]: Pt[], ans: Pt, wrongs: Pt[]): WordSpec {
  const cols = 8;
  const rows = 6;
  const cands = shuffle(rand, [ans, ...wrongs]);
  const idx = cands.indexOf(ans);
  const sc = [g0, n, d, r].map((p) => gp(p));
  const s = sides([ans, n, d, r]);
  const which = cross(s[0], s[2]) === 0 ? "변 ㄱㄴ과 변 ㄷㄹ" : "변 ㄱㄹ과 변 ㄴㄷ";
  return {
    key: `${[g0, n, d, r].map((p) => p.join()).join("|")}:${cands.map((p) => p.join()).join("|")}`,
    prompt: "사각형 ㄱㄴㄷㄹ에서 꼭짓점 ㄱ만 옮겨서 사다리꼴을 만들려고 합니다. 꼭짓점 ㄱ을 어느 점으로 옮겨야 하나요?",
    visual: gridScene(cols, rows, "모눈 위의 사각형 ㄱㄴㄷㄹ과 점 ①~④", {
      polygons: [{ points: sc }],
      dots: cands.map((p) => gp(p)),
      texts: [...vertexTexts(sc, ["ㄱ", "ㄴ", "ㄷ", "ㄹ"]), ...cands.map((p, i) => ({ at: rp(add(gp(p), [10, -10])), text: MARKS[i] }))],
    }),
    answer: MARKS[idx],
    choices: MARKS,
    hint: "꼭짓점 ㄱ을 옮긴 뒤 마주 보는 두 변 중에서 평행한 변이 생기는지 모눈으로 확인해요.",
    explanation: `꼭짓점 ㄱ을 ${markRo(idx)} 옮기면 ${which}이 서로 평행해져 사다리꼴이 돼요.`,
  };
}

export const l4TrapFacts = statement(
  "l4-trap-facts",
  "사다리꼴",
  [
    "사다리꼴은 평행한 변이 한 쌍이라도 있는 사각형입니다.",
    "사다리꼴에는 서로 평행한 두 변이 있습니다.",
    "사다리꼴의 네 변의 길이는 서로 달라도 됩니다.",
    "직사각형 모양 종이를 곧게 한 번 잘라서 사다리꼴을 만들 수 있습니다.",
  ],
  [
    { text: "사다리꼴은 네 변의 길이가 모두 같아야 합니다.", fix: "사다리꼴은 네 변의 길이가 같지 않아도 됩니다." },
    { text: "평행한 변이 한 쌍도 없는 사각형도 사다리꼴입니다.", fix: "평행한 변이 한 쌍이라도 있어야 사다리꼴입니다." },
    { text: "사다리꼴의 평행한 두 변은 길이가 같아야 합니다.", fix: "사다리꼴의 평행한 두 변은 길이가 달라도 됩니다." },
    { text: "삼각형도 평행한 변이 있으면 사다리꼴입니다.", fix: "사다리꼴은 사각형입니다. 삼각형은 사다리꼴이 아닙니다." },
  ],
  "사다리꼴은 '평행한 변이 한 쌍이라도 있는 사각형'이에요. 이 뜻과 맞지 않는 말을 찾아요.",
);

/* ════════ 평행사변형·마름모(각도·길이 그림) ════════ */

/** 각 ㄴ이 x°인 평행사변형(변 ㄱㄴ = s, 변 ㄴㄷ = b), 추가 점 extra(cm 좌표)도 함께 화면으로 */
function paraShape(x: number, s: number, b: number, extra: Pt[] = []) {
  const a = (x * Math.PI) / 180;
  const g: Pt = [s * Math.cos(a), s * Math.sin(a)];
  const { pts, width, height } = toScreen([g, [0, 0], [b, 0], [g[0] + b, g[1]], ...extra]);
  return { v: pts.slice(0, 4), extra: pts.slice(4), width, height, c: pts.slice(0, 4) };
}
const ANGLES = [50, 55, 60, 65, 70, 75, 80, 100, 105, 110, 115, 120, 125, 130];
const VN = ["ㄱ", "ㄴ", "ㄷ", "ㄹ"];

/** 평행사변형/마름모에서 □ 구하기: 마주 보는 변·각(하), 이웃한 각(중) */
const paraBox = (id: string, level: 1 | 2, shape: "평행사변형" | "마름모") =>
  (level === 1 ? easy : mid)(id, (rand) => {
    const x = pick(rand, ANGLES);
    const s = randInt(rand, 4, 12);
    const b = shape === "마름모" ? s : randInt(rand, 5, 14);
    if (shape === "평행사변형" && Math.abs(s - b) < 2) return null;
    const { v, width, height, c } = paraShape(x, s, b);
    const [g, n, d, r] = v;
    const asks = level === 2 ? ["ㄱ", "ㄷ"] : shape === "마름모" ? ["ㄹㄷ", "ㄱㄹ", "ㄴㄷ", "ㄹ"] : ["ㄹㄷ", "ㄱㄹ", "ㄹ"];
    const ask = pick(rand, asks);
    const arcs: Arcs = [];
    const texts: Texts = [...vertexTexts(v, VN), sideText(g, n, c, `${s} cm`)];
    if (shape === "평행사변형") texts.push(sideText(n, d, c, `${b} cm`));
    const ang = (p: Pt, q: Pt, w: Pt, label: string) => {
      const m = angleAt(p, q, w, 20, label, 14);
      arcs.push(...m.arcs);
      texts.push(...m.texts);
    };
    ang(n, g, d, `${x}°`);
    let answer: number;
    let unitText = "cm";
    let why: string;
    const mistakes: Record<string, string> = {};
    if (ask === "ㄹㄷ" || ask === "ㄱㄹ" || ask === "ㄴㄷ") {
      const [p, q] = ask === "ㄹㄷ" ? [r, d] : ask === "ㄱㄹ" ? [g, r] : [n, d];
      texts.push(sideText(p, q, c, "□ cm"));
      answer = ask === "ㄹㄷ" ? s : b;
      why = shape === "마름모" ? "마름모는 네 변의 길이가 모두 같아요." : "평행사변형은 마주 보는 두 변의 길이가 같아요.";
      if (shape === "평행사변형") mistakes[ask === "ㄹㄷ" ? b : s] = "이웃한 변의 길이를 답했어요. 마주 보는 변끼리 길이가 같아요.";
    } else if (ask === "ㄹ") {
      ang(r, d, g, "□°");
      answer = x;
      unitText = "°";
      why = `마주 보는 두 각의 크기가 같으므로 각 ㄹ은 각 ㄴ과 같은 ${x}°예요.`;
      mistakes[180 - x] = "이웃한 각을 구했어요. 각 ㄹ은 각 ㄴ과 마주 보는 각이에요.";
    } else {
      if (ask === "ㄱ") ang(g, n, r, "□°");
      else ang(d, r, n, "□°");
      answer = 180 - x;
      unitText = "°";
      why = `이웃한 두 각의 크기의 합은 180°이므로 180° − ${x}° = ${180 - x}°예요.`;
      mistakes[x] = "마주 보는 각을 답했어요. 이웃한 두 각의 합이 180°예요.";
      mistakes[360 - x] = "360°에서 뺐어요. 이웃한 두 각의 합은 180°예요.";
    }
    return {
      key: `${x}:${s}:${b}:${ask}`,
      prompt: `${shape} ㄱㄴㄷㄹ입니다. □ 안에 알맞은 수를 구하세요.`,
      visual: { kind: "shape", width, height, label: `${shape} ㄱㄴㄷㄹ`, polygons: [{ points: v }], arcs, texts },
      answer,
      unit: unitText,
      hint: level === 2 ? `${shape}에서 이웃한 두 각의 크기의 합은 180°예요.` : `${shape}의 성질을 떠올려요. 마주 보는 변과 각을 찾아요.`,
      explanation: why,
      mistakes,
    };
  });

export const l4ParaBox = paraBox("l4-para-box", 1, "평행사변형");
export const l4ParaAdj = paraBox("l4-para-adj", 2, "평행사변형");
export const l4RhombusBox = paraBox("l4-rhombus-box", 1, "마름모");
export const l4RhombusAdj = paraBox("l4-rhombus-adj", 2, "마름모");

export const l4ParaFourth = mid("l4-para-fourth", (rand) => {
  const cols = 9;
  const rows = 7;
  const v2: Pt = [randInt(rand, 3, 5), randInt(rand, -1, 1)];
  const v1: Pt = [randInt(rand, -2, 2), -randInt(rand, 2, 4)];
  if (cross(v1, v2) === 0) return null;
  const n: Pt = [randInt(rand, 0, 3), randInt(rand, 4, 6)];
  const g = add(n, v1);
  const d = add(n, v2);
  const ans = add(g, v2);
  const inBox = (p: Pt) => p[0] >= 0 && p[0] <= cols && p[1] >= 0 && p[1] <= rows;
  if (![g, d, ans].every(inBox)) return null;
  const wrongs: Pt[] = [];
  for (const o of shuffle(rand, [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1], [2, 0], [-2, 0], [0, 2]] as Pt[])) {
    const p = add(ans, o);
    if (wrongs.length < 3 && inBox(p) && ![g, n, d].some((q) => same(p, q)) && [ans, ...wrongs].every((q) => len(sub(p, q)) >= 1.4)) wrongs.push(p);
  }
  if (wrongs.length < 3) return null;
  const cands = shuffle(rand, [ans, ...wrongs]);
  const idx = cands.indexOf(ans);
  const sc = [g, n, d].map((p) => gp(p, 22));
  const c = centroid([...sc, gp(ans, 22)]);
  return {
    key: `${[g, n, d].map((p) => p.join()).join("|")}:${cands.map((p) => p.join()).join("|")}`,
    prompt: "평행사변형 ㄱㄴㄷㄹ을 그리려고 합니다. 꼭짓점 ㄹ이 될 수 있는 점을 고르세요.",
    visual: gridScene(cols, rows, "모눈 위의 선분 ㄱㄴ, 선분 ㄴㄷ과 점 ①~④", {
      lines: [{ from: sc[0], to: sc[1] }, { from: sc[1], to: sc[2] }],
      dots: [...sc, ...cands.map((p) => gp(p, 22))],
      texts: [
        ...sc.map((p, i) => ({ at: rp(add(p, mul(unit(sub(p, c)), 13))), text: VN[i] })),
        ...cands.map((p, i) => ({ at: rp(add(gp(p, 22), [10, -10])), text: MARKS[i] })),
      ],
    }, 22),
    answer: MARKS[idx],
    choices: MARKS,
    hint: "평행사변형은 마주 보는 두 변이 평행하고 길이가 같아요. 점 ㄴ에서 점 ㄷ까지 간 만큼 점 ㄱ에서 똑같이 가 보세요.",
    explanation: `점 ㄴ에서 점 ㄷ까지 ${moveText(v2)} 가요. 점 ㄱ에서 똑같이 가면 ${MARKS[idx]}에 닿고, 그러면 변 ㄱㄹ과 변 ㄴㄷ이 평행하고 길이가 같아요.`,
  };
});

export const l4ParaExterior = word("l4-para-exterior", (rand) => {
  const a = pick(rand, ANGLES);
  const x = 180 - a;
  const s = randInt(rand, 5, 9);
  const b = randInt(rand, 7, 11);
  const ext = Math.max(3, Math.round(b * 0.45));
  const { v, extra, width, height } = paraShape(x, s, b, [[b + ext, 0]]);
  const [g, n, d, r] = v;
  const m = extra[0];
  // 각 글자는 도형의 변·늘인 선·꼭짓점 이름·다른 호를 피해 자리를 잡는다
  const names: Texts = [...vertexTexts(v, VN), { at: rp(add(m, [8, 12])), text: "ㅁ" }];
  // ㄷ은 늘인 선 위에 있으므로 이름을 선 아래에(바깥 이등분선 쪽이면 늘인 선에 걸린다)
  names[2] = { at: rp(add(d, [0, 15])), text: VN[2] };
  const arcA = angleAt(g, n, r, 20).arcs;
  const arcE = angleAt(d, r, m, 20).arcs;
  const A = angleAt(g, n, r, 20, `${a}°`, 14, { polygons: [{ points: v }], lines: [{ from: d, to: m }], arcs: arcE, texts: names });
  const E = angleAt(d, r, m, 20, "㉠", 13, { polygons: [{ points: v }], lines: [{ from: d, to: m }], arcs: arcA, texts: [...names, ...A.texts] });
  return {
    key: `${a}:${s}:${b}`,
    prompt: "평행사변형 ㄱㄴㄷㄹ에서 변 ㄴㄷ을 늘였습니다. 각 ㉠의 크기는 몇 도인가요?",
    visual: {
      kind: "shape",
      width,
      height,
      label: "변 ㄴㄷ을 늘인 평행사변형 ㄱㄴㄷㄹ",
      polygons: [{ points: v }],
      lines: [{ from: d, to: m }],
      arcs: [...A.arcs, ...E.arcs],
      texts: [...names, ...A.texts, ...E.texts],
    },
    answer: 180 - a,
    unit: "°",
    hint: "먼저 평행사변형의 각 ㄴㄷㄹ을 구하고, 일직선이 이루는 180°를 이용해요.",
    explanation: `각 ㄴㄷㄹ은 각 ㄱ과 마주 보므로 ${a}°, ㉠ = 180° − ${a}° = ${180 - a}°`,
    mistakes: { [a]: "평행사변형 안쪽의 각 ㄴㄷㄹ을 답했어요. ㉠은 일직선(180°)에서 그 각을 뺀 각이에요." },
  };
});

/** 마름모 ㄱ(위)ㄴ(왼쪽)ㄷ(아래)ㄹ(오른쪽), 두 대각선의 반이 p(세로)·q(가로) */
function diamond(p: number, q: number, maxH = 170) {
  const { pts, width, height } = toScreen([[0, p], [-q, 0], [0, -p], [q, 0], [0, 0]], 220, maxH, 30);
  return { v: pts.slice(0, 4), o: pts[4], width, height };
}

export const l4RhombusDiag = mid("l4-rhombus-diag", (rand) => {
  const ask = pick(rand, ["whole", "half", "angle"] as const);
  const q = randInt(rand, 3, 9);
  // 각을 묻을 때는 각 ㅇㄱㄹ이 5의 배수가 되도록 세로 대각선의 반 p를 정한다
  const p = ask === "angle" ? q / Math.tan((pick(rand, [30, 35, 40, 50, 55, 60]) * Math.PI) / 180) : randInt(rand, 3, 9);
  if (Math.abs(p - q) < 0.5) return null;
  const { v, o, width, height } = diamond(p, q);
  const [g, n, d, r] = v;
  const lines: Lines = [{ from: g, to: d }, { from: n, to: r }];
  const arcs: Arcs = [];
  const texts: Texts = [...vertexTexts(v, VN, 12), { at: rp(add(o, [10, 12])), text: "ㅇ" }];
  let prompt: string;
  let answer: number;
  let unitText = "cm";
  let why: string;
  const mistakes: Record<string, string> = {};
  if (ask === "whole") {
    texts.push({ at: rp([o[0] + 24, (g[1] + o[1]) / 2]), text: `${p} cm` }, { at: rp([(n[0] + o[0]) / 2, o[1] - 11]), text: `${q} cm` });
    prompt = "마름모 ㄱㄴㄷㄹ에서 두 대각선이 만나는 점을 ㅇ이라고 할 때, 선분 ㄱㄷ의 길이는 몇 cm인가요?";
    answer = 2 * p;
    why = `마름모의 한 대각선은 다른 대각선을 똑같이 둘로 나눠요. 선분 ㄱㄷ = ${p} × 2 = ${2 * p}(cm)`;
    mistakes[p] = "선분 ㄱㅇ의 길이예요. 선분 ㄱㄷ은 그 2배예요.";
    mistakes[2 * q] = "다른 대각선 ㄴㄹ의 길이를 구했어요.";
  } else if (ask === "half") {
    texts.push({ at: rp([o[0] + 24, (g[1] + o[1]) / 2]), text: `${p} cm` });
    prompt = `마름모 ㄱㄴㄷㄹ에서 두 대각선이 만나는 점을 ㅇ이라고 합니다. 선분 ㄴㄹ의 길이가 ${2 * q} cm일 때, 선분 ㅇㄹ의 길이는 몇 cm인가요?`;
    answer = q;
    why = `마름모의 한 대각선은 다른 대각선을 똑같이 둘로 나눠요. ${2 * q} ÷ 2 = ${q}(cm)`;
    mistakes[p] = "선분 ㄱㅇ의 길이를 답했어요.";
    mistakes[2 * q] = "선분 ㄴㄹ 전체의 길이예요.";
  } else {
    // 각 ㅇㄱㄹ이 주어지면 대각선이 수직인 것을 이용해 각 ㅇㄹㄱ을 구한다
    const y = Math.round((Math.atan2(q, p) * 180) / Math.PI);
    if (y < 25 || y > 65) return null;
    const Y = angleAt(g, o, r, 22, `${y}°`, 12);
    const K = angleAt(r, g, o, 22, "㉠", 12);
    arcs.push(...Y.arcs, ...K.arcs);
    texts.push(...Y.texts, ...K.texts);
    prompt = "마름모 ㄱㄴㄷㄹ에서 두 대각선이 만나는 점을 ㅇ이라고 할 때, 각 ㉠의 크기는 몇 도인가요?";
    answer = 90 - y;
    unitText = "°";
    why = `마름모의 두 대각선은 서로 수직으로 만나므로 각 ㄱㅇㄹ은 90°예요. 삼각형 ㄱㅇㄹ에서 ㉠ = 180° − 90° − ${y}° = ${90 - y}°`;
    mistakes[180 - y] = "각 ㄱㅇㄹ이 90°인 것을 빠뜨렸어요. 두 대각선은 서로 수직으로 만나요.";
  }
  delete mistakes[answer];
  return {
    key: `${ask}:${p}:${q}`,
    prompt,
    visual: { kind: "shape", width, height, label: "두 대각선을 그은 마름모 ㄱㄴㄷㄹ", polygons: [{ points: v }], lines, arcs, texts },
    answer,
    unit: unitText,
    hint: "마름모의 두 대각선은 서로 수직으로 만나고, 서로를 똑같이 둘로 나눠요.",
    explanation: why,
    mistakes,
  };
});

export const l4RhombusIso = word("l4-rhombus-iso", (rand) => {
  const ask = rand() < 0.5 ? "base" : "apex";
  let a: number;
  if (ask === "base") {
    a = pick(rand, [40, 50, 60, 70, 80, 100, 110, 120]);
  } else {
    const y = pick(rand, [30, 35, 40, 50, 55, 60, 65]);
    a = 180 - 2 * y;
  }
  const y = (180 - a) / 2;
  const q = 6;
  const p = q * Math.tan(((a / 2) * Math.PI) / 180);
  // 각 ㄴ이 120°처럼 넓으면 마름모가 세로로 길어져 "120°"가 각 ㄴ과 대각선 사이에 들어가지 않으므로 세로를 더 허용한다
  const { v, width, height } = diamond(p, q, a >= 120 ? 230 : 170);
  const [g, n, d] = v;
  const N = angleAt(n, g, d, 20, ask === "base" ? `${a}°` : "㉠", 13);
  const G = angleAt(g, n, d, 22, ask === "base" ? "㉠" : `${y}°`, 12);
  return {
    key: `${ask}:${a}`,
    prompt: "마름모 ㄱㄴㄷㄹ에 대각선 ㄱㄷ을 그었습니다. 각 ㉠의 크기는 몇 도인가요?",
    visual: {
      kind: "shape",
      width,
      height,
      label: "대각선 ㄱㄷ을 그은 마름모 ㄱㄴㄷㄹ",
      polygons: [{ points: v }],
      lines: [{ from: g, to: d }],
      arcs: [...N.arcs, ...G.arcs],
      texts: [...vertexTexts(v, VN, 12), ...N.texts, ...G.texts],
    },
    answer: ask === "base" ? y : a,
    unit: "°",
    hint: "마름모는 네 변의 길이가 같으므로 삼각형 ㄱㄴㄷ은 변 ㄴㄱ과 변 ㄴㄷ의 길이가 같은 이등변삼각형이에요.",
    explanation:
      ask === "base"
        ? `삼각형 ㄱㄴㄷ은 이등변삼각형이므로 두 밑각이 같아요. 180° − ${a}° = ${180 - a}°, ㉠ = ${180 - a}° ÷ 2 = ${y}°`
        : `삼각형 ㄱㄴㄷ은 이등변삼각형이므로 각 ㄴㄷㄱ도 ${y}°예요. ㉠ = 180° − ${y}° − ${y}° = ${a}°`,
    mistakes: ask === "base" ? { [180 - a]: "2로 나누지 않았어요. 두 밑각의 크기가 같아요." } : { [180 - y]: "밑각 하나만 뺐어요. 두 밑각의 크기가 같아요." },
  };
});

/* ════════ 여러 가지 사각형 ════════ */

const ALL_NAMES = ["사다리꼴", "평행사변형", "마름모", "직사각형", "정사각형"];

export const l4QuadNames = mid("l4-quad-names", (rand) => {
  const kind = pick(rand, ["사다리꼴", "평행사변형", "마름모", "직사각형", "정사각형"] as QuadKind[]);
  const { pts, scene } = latticePolygon(rand, pick(rand, QUAD_BASE[kind]), "모눈 위의 사각형");
  const can = ALL_NAMES.filter((nm) => IS[nm](kind));
  const mistakes: Record<string, string> = {};
  if (can.length !== 1) mistakes[1] = "가장 알맞은 이름 하나만 셌어요. 조건을 만족하면 여러 이름으로 부를 수 있어요.";
  return {
    key: JSON.stringify(pts),
    prompt: "그림과 같은 사각형의 이름이 될 수 있는 것을 사다리꼴, 평행사변형, 마름모, 직사각형, 정사각형 중에서 모두 찾으면 몇 개인가요?",
    visual: scene,
    answer: can.length,
    unit: "개",
    hint: "평행한 변의 쌍, 네 변의 길이, 네 각이 직각인지를 차례로 확인해요.",
    explanation: `이 사각형은 ${iRago(can.join(", "))} 할 수 있어요. → ${can.length}개`,
    mistakes,
  };
});
