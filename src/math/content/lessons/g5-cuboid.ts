import { pick, randInt, shuffle } from "../../lib/random";
import type { ShapeScene } from "../types";
import { mid, word } from "../words/word";
import { easy } from "./g5";
import { MARKS, add, fit, guard, rp, type Lines, type Pt, type Texts } from "./g5-figure";
import { jq } from "./g5-text";

/**
 * 5-2 직육면체: 가로·세로·높이에 비례한 겨냥도(보이지 않는 모서리는 점선)와 전개도 그림.
 * 겨냥도 꼭짓점 이름은 교과서처럼 윗면 ㄱㄴㄷㄹ, 아랫면 ㅁㅂㅅㅇ(ㄱ 아래가 ㅁ)이고, 보이지 않는 꼭짓점은 ㅁ이다.
 */

const V = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ"];
/** 면(꼭짓점 번호)과 이름 */
export const FACES: { name: string; v: number[] }[] = [
  { name: "윗면", v: [0, 1, 2, 3] },
  { name: "아랫면", v: [4, 5, 6, 7] },
  { name: "앞면", v: [1, 5, 6, 2] },
  { name: "뒷면", v: [0, 4, 7, 3] },
  { name: "왼쪽 옆면", v: [0, 4, 5, 1] },
  { name: "오른쪽 옆면", v: [3, 7, 6, 2] },
];
/** 마주 보는(평행한) 면의 번호 */
const OPP = [1, 0, 3, 2, 5, 4];
export const faceName = (i: number) => `면 ${FACES[i].v.map((j) => V[j]).join("")}`;

type SketchOpts = { labels?: [string, string, string] | null; names?: boolean; shade?: number; label?: string };

/**
 * 직육면체 겨냥도: 앞면 가로 a × 높이 c, 깊이 b는 45° 방향으로 절반 길이. 크기는 치수에 비례한다.
 * labels: [가로, 세로(깊이), 높이] 글자
 */
export function cuboidSketch(a: number, b: number, c: number, opts: SketchOpts = {}): ShapeScene {
  const d = b * 0.5 * Math.SQRT1_2;
  const k = Math.min(22, 180 / (a + d), 120 / (c + d));
  const [dx, dy] = [d * k, d * k];
  const fbl: Pt = [0, (c + d) * k];
  // 윗면 ㄱ(뒤 왼쪽) ㄴ(앞 왼쪽) ㄷ(앞 오른쪽) ㄹ(뒤 오른쪽), 아랫면 ㅁ ㅂ ㅅ ㅇ
  const P: Pt[] = [
    [dx, dy - dy],
    [0, dy],
    [a * k, dy],
    [a * k + dx, 0],
    [dx, (c * k) + 0],
    fbl,
    [a * k, fbl[1]],
    [a * k + dx, c * k],
  ].map((p) => rp(p as Pt));
  const edges: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 0], [1, 5], [2, 6], [3, 7], [5, 6], [6, 7]];
  const hidden: [number, number][] = [[0, 4], [4, 5], [4, 7]];
  const lines: Lines = [...edges.map(([i, j]) => ({ from: P[i], to: P[j] })), ...hidden.map(([i, j]) => ({ from: P[i], to: P[j], dashed: true, width: 1.5 }))];
  const texts: Texts = [];
  if (opts.labels) {
    texts.push({ at: rp(add([(P[5][0] + P[6][0]) / 2, P[5][1]], [0, 13])), text: opts.labels[0] });
    texts.push({ at: rp(add([(P[6][0] + P[7][0]) / 2, (P[6][1] + P[7][1]) / 2], [8 + opts.labels[1].length * 4, 6])), text: opts.labels[1] });
    texts.push({ at: rp(add([P[1][0], (P[1][1] + P[5][1]) / 2], [-6 - opts.labels[2].length * 4, 0])), text: opts.labels[2] });
  }
  if (opts.names) {
    const off: Pt[] = [[-6, -10], [-11, -6], [-10, 10], [10, -8], [10, -9], [-10, 8], [8, 10], [11, 6]];
    P.forEach((p, i) => texts.push({ at: rp(add(p, off[i])), text: V[i] }));
  }
  const polygons = opts.shade !== undefined ? [{ points: FACES[opts.shade].v.map((i) => P[i]), fill: true }] : [];
  return fit({ label: opts.label ?? "보이지 않는 모서리를 점선으로 그린 직육면체의 겨냥도", polygons, lines, texts }, 6);
}

/* ── 직육면체와 정육면체 ── */

const CUBOID_FACTS = [
  { q: "직육면체의 면은 모두 몇 개인가요?", a: 6 },
  { q: "직육면체의 모서리는 모두 몇 개인가요?", a: 12 },
  { q: "직육면체의 꼭짓점은 모두 몇 개인가요?", a: 8 },
  { q: "직육면체의 한 꼭짓점에서 만나는 모서리는 몇 개인가요?", a: 3 },
  { q: "직육면체의 한 꼭짓점에서 만나는 면은 몇 개인가요?", a: 3 },
  { q: "직육면체에서 길이가 같은 모서리는 몇 개씩 있나요?", a: 4 },
];

export const cuboidFacts = easy("cuboid-facts", (rand) => {
  const f = pick(rand, CUBOID_FACTS);
  const [a, b, c] = [randInt(rand, 5, 9), randInt(rand, 3, 7), randInt(rand, 3, 6)];
  return {
    key: `${f.q}:${a}:${b}:${c}`,
    prompt: `그림과 같은 직육면체를 보고 답하세요. ${f.q}`,
    visual: cuboidSketch(a, b, c, { label: "직육면체의 겨냥도" }),
    answer: f.a,
    unit: "개",
    hint: "보이지 않는 부분(점선)까지 빠짐없이 세어 보세요.",
    explanation: `${f.q.replace(/ 몇 개(인가요|씩 있나요)\?$/, "")} → ${f.a}개`,
  };
});

export const cbWire = word("l5-cb-wire", guard((rand) => {
  const cube = rand() < 0.4;
  const a = randInt(rand, 3, 12);
  const b = cube ? a : randInt(rand, 3, 12);
  const c = cube ? a : randInt(rand, 3, 12);
  const need = 4 * (a + b + c);
  const N = Math.ceil((need + 1) / 50) * 50;
  return {
    key: `${cube}:${a}:${b}:${c}`,
    prompt: `철사 ${N} cm로 그림과 같은 ${cube ? "정육면체" : "직육면체"} 모양을 한 개 만들었습니다. 남은 철사는 몇 cm인가요?`,
    visual: cuboidSketch(a, b, c, { labels: cube ? [`${a} cm`, "", ""] : [`${a} cm`, `${b} cm`, `${c} cm`], label: `모서리의 길이가 적힌 ${cube ? "정육면체" : "직육면체"}` }),
    answer: N - need,
    unit: "cm",
    hint: "모든 모서리의 길이의 합만큼 철사가 필요해요. 길이가 같은 모서리가 4개씩 있어요.",
    explanation: cube ? `사용한 철사 ${a} × 12 = ${need}(cm), ${N} − ${need} = ${N - need}(cm)` : `사용한 철사 (${a} + ${b} + ${c}) × 4 = ${need}(cm), ${N} − ${need} = ${N - need}(cm)`,
    mistakes: { [N - (a + b + c)]: "같은 길이의 모서리가 4개씩 있어요." },
  };
}));

export const cubeFaceEdges = word("w5-cube-face", guard((rand) => {
  const s = randInt(rand, 2, 12);
  const k = 5;
  return {
    key: `${s}`,
    prompt: `정육면체에서 색칠한 면의 넓이가 ${s * s} cm²입니다. 이 정육면체의 모든 모서리의 길이의 합은 몇 cm인가요?`,
    visual: cuboidSketch(k, k, k, { shade: 2, label: "앞면을 색칠한 정육면체" }),
    answer: 12 * s,
    unit: "cm",
    hint: "정육면체의 면은 정사각형이에요. 먼저 한 모서리의 길이를 구해요.",
    explanation: `${s} × ${s} = ${s * s}이므로 한 모서리는 ${s} cm, 모서리 12개 → ${s} × 12 = ${12 * s}(cm)`,
    mistakes: { [4 * s]: "모서리는 12개예요." },
  };
}));

/* ── 직육면체의 성질 ── */

/** 이름 붙인 겨냥도에서 색칠한 면과 평행한 면 고르기 */
/** 색칠하는 면은 겨냥도에서 보이는 면(윗면·앞면·오른쪽 옆면) */
const SHOWN = [0, 2, 5];

export const cbProp = easy("l5-cb-prop", (rand) => {
  const f = pick(rand, SHOWN);
  const answer = faceName(OPP[f]);
  const others = shuffle(rand, [0, 1, 2, 3, 4, 5].filter((i) => i !== f && i !== OPP[f])).slice(0, 3).map(faceName);
  const [a, b, c] = [randInt(rand, 6, 9), randInt(rand, 4, 7), randInt(rand, 4, 6)];
  return {
    key: `${f}:${others.join()}:${a}${b}${c}`,
    prompt: "직육면체에서 색칠한 면과 평행한 면을 고르세요.",
    visual: cuboidSketch(a, b, c, { names: true, shade: f, label: `꼭짓점 이름이 있는 직육면체, ${faceName(f)} 색칠` }),
    answer,
    choices: shuffle(rand, [answer, ...others]),
    hint: "직육면체에서 서로 마주 보는 면은 평행해요. 색칠한 면과 만나지 않는 면을 찾아요.",
    explanation: `색칠한 ${jq(faceName(f), "과/와")} 마주 보는 면은 ${answer}이에요.`,
  };
});

/** 색칠한 면과 수직인 면: 수직이 아닌 면 하나 고르기, 또는 수직인 면 넷을 모두 바르게 고른 것 고르기 */
export const cbPerpFaces = word("l5-cb-perp-faces", (rand) => {
  const f = pick(rand, SHOWN);
  const perp = [0, 1, 2, 3, 4, 5].filter((i) => i !== f && i !== OPP[f]);
  const askNot = rand() < 0.5;
  const [a, b, c] = [randInt(rand, 6, 9), randInt(rand, 4, 7), randInt(rand, 4, 6)];
  const visual = cuboidSketch(a, b, c, { names: true, shade: f, label: `꼭짓점 이름이 있는 직육면체, ${faceName(f)} 색칠` });
  const why = `색칠한 면과 수직인 면: ${perp.map(faceName).join(", ")} / 평행한 면: ${faceName(OPP[f])}`;
  if (askNot) {
    // 보기: 평행한 면(정답) + 수직인 면 셋
    const answer = faceName(OPP[f]);
    return {
      key: `not:${f}:${a}${b}${c}`,
      prompt: "직육면체에서 색칠한 면과 수직이 아닌 면을 고르세요.",
      visual,
      answer,
      choices: shuffle(rand, [answer, ...shuffle(rand, perp).slice(0, 3).map(faceName)]),
      hint: "한 면과 수직인 면은 그 면과 만나는 면 4개예요. 만나지 않는 면을 찾아요.",
      explanation: why,
    };
  }
  // 수직인 면 넷을 모두 쓴 것 하나와, 그중 하나를 평행한 면으로 바꾼 것 셋
  const set = (xs: number[]) => xs.map(faceName).join(", ");
  const answer = set(perp);
  const wrongs = [0, 1, 2].map((k) => set(perp.map((x, i) => (i === k ? OPP[f] : x))));
  return {
    key: `all:${f}:${a}${b}${c}`,
    prompt: "직육면체에서 색칠한 면과 수직인 면을 모두 바르게 쓴 것을 고르세요.",
    visual,
    answer,
    choices: shuffle(rand, [answer, ...wrongs]),
    hint: "한 면과 수직인 면은 그 면과 만나는 면 4개예요. 색칠한 면과 마주 보는 면은 평행해요.",
    explanation: why,
  };
});

/* ── 직육면체의 겨냥도 ── */

export const visibleParts = mid("m5-visible-parts", (rand) => {
  const f = pick(rand, [
    { q: "보이는 면", a: 3 },
    { q: "보이는 모서리", a: 9 },
    { q: "보이지 않는 모서리", a: 3 },
    { q: "보이는 꼭짓점", a: 7 },
    { q: "보이지 않는 꼭짓점", a: 1 },
  ]);
  const [a, b, c] = [randInt(rand, 5, 9), randInt(rand, 3, 7), randInt(rand, 3, 6)];
  return {
    key: `${f.q}:${a}${b}${c}`,
    prompt: `직육면체의 겨냥도에서 ${jq(f.q, "은/는")} 몇 개인가요?`,
    visual: cuboidSketch(a, b, c, { label: "직육면체의 겨냥도" }),
    answer: f.a,
    unit: "개",
    hint: "겨냥도에서 보이는 모서리는 실선, 보이지 않는 모서리는 점선으로 그려요.",
    explanation: `${f.q}: ${f.a}개`,
  };
});

/* ── 정육면체의 전개도 ── */

type Cell = [number, number];
type V3 = [number, number, number];
const neg = (v: V3): V3 => [-v[0], -v[1], -v[2]];
const key3 = (v: V3) => v.join();

/** 전개도를 접었을 때 칸마다 닿는 정육면체의 면(방향 벡터). 면이 겹치면 null */
export function fold(cells: Cell[]): V3[] | null {
  const at = new Map(cells.map((c, i) => [c.join(), i]));
  const down: (V3 | null)[] = cells.map(() => null);
  const state: { d: V3; r: V3; f: V3 }[] = [];
  down[0] = [0, 0, -1];
  state[0] = { d: [0, 0, -1], r: [1, 0, 0], f: [0, 1, 0] };
  const queue = [0];
  while (queue.length) {
    const i = queue.shift()!;
    const { d, r, f } = state[i];
    const [x, y] = cells[i];
    const moves: [Cell, { d: V3; r: V3; f: V3 }][] = [
      [[x + 1, y], { d: r, r: neg(d), f }],
      [[x - 1, y], { d: neg(r), r: d, f }],
      [[x, y + 1], { d: f, r, f: neg(d) }],
      [[x, y - 1], { d: neg(f), r, f: d }],
    ];
    for (const [c, s] of moves) {
      const j = at.get(c.join());
      if (j === undefined || down[j]) continue;
      down[j] = s.d;
      state[j] = s;
      queue.push(j);
    }
  }
  if (down.some((v) => !v)) return null;
  return new Set(down.map((v) => key3(v!))).size === 6 ? (down as V3[]) : null;
}

/** 정육면체 전개도 11가지(칸 좌표) */
export const CUBE_NETS: Cell[][] = [
  ...[0, 1, 2, 3].flatMap((t) => [0, 1, 2, 3].filter((u) => u >= t).map((u): Cell[] => [[t, 0], [0, 1], [1, 1], [2, 1], [3, 1], [u, 2]])).filter((_, i) => i <= 5),
  [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [1, 2]],
  [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [2, 2]],
  [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [3, 2]],
  [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]],
  [[0, 0], [1, 0], [2, 0], [2, 1], [3, 1], [4, 1]],
];
/** 정육면체의 전개도가 될 수 없는 여섯 칸 모양 */
export const NOT_NETS: Cell[][] = [
  [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [2, 0]],
  [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]],
  [[0, 0], [1, 0], [0, 1], [1, 1], [2, 1], [3, 1]],
  [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [3, 1]],
  [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2], [2, 2]],
  [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [2, 0]],
];

/** 90°씩 돌리거나 뒤집어 왼쪽 위에 붙인다 */
function orientCells(cells: Cell[], rot: number, flip: boolean): Cell[] {
  let q = cells.map(([x, y]): Cell => [flip ? -x : x, y]);
  for (let i = 0; i < rot; i++) q = q.map(([x, y]): Cell => [-y, x]);
  const [mx, my] = [Math.min(...q.map((c) => c[0])), Math.min(...q.map((c) => c[1]))];
  return q.map(([x, y]): Cell => [x - mx, y - my]);
}

/** 전개도 그림과 마주 보는 면(칸 번호) */
export function cubeNet(rand: () => number, texts?: string[], s = 34) {
  const base = pick(rand, CUBE_NETS);
  let cells = orientCells(base, randInt(rand, 0, 3), rand() < 0.5);
  // 가로로 길게 놓는다(좁은 화면에서도 크게 보이게)
  if (Math.max(...cells.map((c) => c[1])) > Math.max(...cells.map((c) => c[0]))) cells = orientCells(cells, 1, false);
  const faces = fold(cells)!;
  const opp = faces.map((f) => faces.findIndex((g) => key3(g) === key3(neg(f))));
  const names = texts ?? shuffle(rand, ["가", "나", "다", "라", "마", "바"]);
  const w = Math.max(...cells.map((c) => c[0])) + 1;
  const h = Math.max(...cells.map((c) => c[1])) + 1;
  const scene: ShapeScene = {
    kind: "shape",
    width: w * s + 20,
    height: h * s + 20,
    label: "정육면체의 전개도",
    polygons: cells.map(([x, y]) => ({ points: [[10 + x * s, 10 + y * s], [10 + (x + 1) * s, 10 + y * s], [10 + (x + 1) * s, 10 + (y + 1) * s], [10 + x * s, 10 + (y + 1) * s]] as Pt[] })),
    texts: cells.map(([x, y], i) => ({ at: [10 + x * s + s / 2, 10 + y * s + s / 2] as Pt, text: names[i] })),
  };
  return { cells, names, opp, scene, id: CUBE_NETS.indexOf(base) };
}

/** 여섯 칸 모양 4개(①~④)를 2×2로 */
function netsScene(list: Cell[][]): ShapeScene {
  const s = 18;
  const slot = 6 * s;
  const polygons: NonNullable<ShapeScene["polygons"]> = [];
  const texts: Texts = [];
  list.forEach((cells, i) => {
    const [ox, oy] = [(i % 2) * (slot + 12) + 18, Math.floor(i / 2) * (4 * s + 24) + 22];
    cells.forEach(([x, y]) => polygons.push({ points: [[ox + x * s, oy + y * s], [ox + (x + 1) * s, oy + y * s], [ox + (x + 1) * s, oy + (y + 1) * s], [ox + x * s, oy + (y + 1) * s]] }));
    texts.push({ at: [ox - 8, oy - 10], text: MARKS[i] });
  });
  return { kind: "shape", width: 2 * (slot + 12) + 16, height: 2 * (4 * s + 24) + 10, label: "여섯 칸 모양 ①~④", polygons, texts };
}

export const netNot = mid("l5-cb-net-not", (rand) => {
  const bad = orientCells(pick(rand, NOT_NETS), randInt(rand, 0, 3), rand() < 0.5);
  const goods = shuffle(rand, CUBE_NETS).slice(0, 3).map((c) => orientCells(c, randInt(rand, 0, 3), rand() < 0.5));
  const all = [...goods, bad].map((c) => (Math.max(...c.map((p) => p[1])) > 3 ? orientCells(c, 1, false) : c));
  if (all.some((c) => Math.max(...c.map((p) => p[0])) > 5 || Math.max(...c.map((p) => p[1])) > 3)) return null;
  const order = shuffle(rand, [0, 1, 2, 3]);
  const at = order.indexOf(3);
  return {
    key: JSON.stringify(order.map((o) => all[o])),
    prompt: "정육면체의 전개도가 아닌 것을 고르세요.",
    visual: netsScene(order.map((o) => all[o])),
    answer: MARKS[at],
    choices: [...MARKS],
    hint: "접었을 때 겹치는 면이 생기거나 비는 면이 생기면 전개도가 아니에요. 한 줄에 5칸 이상 있거나, 네 면이 한 꼭짓점에 모이면 접을 수 없어요.",
    explanation: `${jq(MARKS[at], "은/는")} 접으면 두 면이 겹치고 한 면이 비어서 정육면체가 되지 않아요.`,
  };
});

/* ── 직육면체의 전개도 ── */

/** 직육면체 전개도: 가운데 줄(왼쪽 옆면 b, 앞면 a, 오른쪽 옆면 b, 뒷면 a, 높이 c), 윗면·아랫면(a × b) */
export const cnetBlank = easy("l5-cb-cnet", guard((rand) => {
  const a = randInt(rand, 4, 9);
  const b = randInt(rand, 2, 6);
  const c = randInt(rand, 3, 7);
  if (a === b || b === c || a === c) return null;
  const k = Math.min(9, 280 / (2 * a + 2 * b), 190 / (c + 2 * b));
  const xs = [0, b, b + a, 2 * b + a, 2 * b + 2 * a];
  const topAt = pick(rand, [1, 3]);
  const botAt = pick(rand, [1, 3]);
  const rect = (x0: number, y0: number, w: number, h: number): Pt[] => [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]].map(([x, y]) => rp([x * k, y * k]));
  const row = [0, 1, 2, 3].map((i) => rect(xs[i], b, xs[i + 1] - xs[i], c));
  const top = rect(xs[topAt], 0, a, b);
  const bot = rect(xs[botAt], b + c, a, b);
  const polygons = [...row, top, bot].map((points) => ({ points }));
  // 어느 모서리에 어떤 길이를 적을지: 가로 a, 세로 b, 높이 c를 하나씩, □는 다른 자리의 같은 길이
  const ask = pick(rand, ["a", "b", "c"] as const);
  const lbl = (p: Pt, q: Pt, text: string, out: Pt): Texts[number] => ({ at: rp(add([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], out)), text });
  const texts: Texts = [
    lbl(top[0], top[1], `${a} cm`, [0, -11]),
    lbl(row[0][0], row[0][3], `${c} cm`, [-24, 0]),
    lbl(row[0][0], row[0][1], `${b} cm`, [0, -11]),
  ];
  const target = ask === "a" ? lbl(bot[3], bot[2], "□ cm", [0, 12]) : ask === "b" ? lbl(row[2][3], row[2][2], "□ cm", [0, 12]) : lbl(row[3][1], row[3][2], "□ cm", [24, 0]);
  texts.push(target);
  return {
    key: `${a}:${b}:${c}:${topAt}:${botAt}:${ask}`,
    prompt: "직육면체의 전개도입니다. □ 안에 알맞은 수를 구하세요.",
    visual: fit({ label: "직육면체의 전개도와 모서리의 길이", polygons, texts }),
    answer: { a, b, c }[ask],
    unit: "cm",
    hint: "전개도를 접었을 때 만나는 선분의 길이는 같아요. □가 있는 선분이 직육면체의 가로, 세로, 높이 중 어느 것인지 찾아요.",
    explanation: `□가 있는 선분은 직육면체의 ${ask === "a" ? "가로" : ask === "b" ? "세로" : "높이"}와 같으므로 ${{ a, b, c }[ask]} cm예요.`,
  };
}));

export const cuboidEdges = mid("cuboid-edges", (rand) => {
  const cube = rand() < 0.3;
  const a = randInt(rand, 3, 12);
  const b = cube ? a : randInt(rand, 3, 12);
  const c = cube ? a : randInt(rand, 3, 12);
  return {
    key: `${cube}:${a}:${b}:${c}`,
    prompt: `${cube ? "정육면체" : "직육면체"}의 모든 모서리의 길이의 합은 몇 cm인가요?`,
    visual: cuboidSketch(a, b, c, { labels: cube ? [`${a} cm`, "", ""] : [`${a} cm`, `${b} cm`, `${c} cm`], label: `모서리의 길이가 적힌 ${cube ? "정육면체" : "직육면체"}` }),
    answer: cube ? 12 * a : 4 * (a + b + c),
    unit: "cm",
    hint: cube ? "정육면체는 모서리 12개의 길이가 모두 같아요." : "가로, 세로, 높이와 길이가 같은 모서리가 4개씩 있어요.",
    explanation: cube ? `${a} × 12 = ${12 * a}(cm)` : `(${a} + ${b} + ${c}) × 4 = ${4 * (a + b + c)}(cm)`,
    mistakes: cube ? { [4 * a]: "모서리는 12개예요." } : { [a + b + c]: "모서리를 한 번씩만 더했어요.", [3 * (a + b + c)]: "보이는 모서리만 더했어요." },
  };
});

export const cbRibbon = word("l5-cb-ribbon", guard((rand) => {
  const a = randInt(rand, 10, 40);
  const b = randInt(rand, 10, 30);
  const c = randInt(rand, 5, 20);
  const kn = randInt(rand, 10, 30);
  const v = 2 * a + 2 * b + 4 * c + kn;
  const sk = cuboidSketch(a, b, c, { labels: [`${a} cm`, `${b} cm`, `${c} cm`], label: "끈을 십자 모양으로 두른 직육면체 상자" });
  // 끈: 윗면·앞면·오른쪽 옆면의 가운데를 지나는 선(겨냥도 꼭짓점에서 계산)
  const L = sk.lines!;
  const [g, n, d, r] = [L[0].from, L[0].to, L[1].to, L[2].to]; // ㄱ ㄴ ㄷ ㄹ
  const [bq, sq] = [L[4].to, L[5].to]; // ㅂ ㅅ
  const o = L[6].to; // ㅇ
  const m = (p: Pt, q: Pt): Pt => rp([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]);
  const ribbon: Lines = [
    { from: m(g, n), to: m(r, d), width: 3 },
    { from: m(g, r), to: m(n, d), width: 3 },
    { from: m(n, d), to: m(bq, sq), width: 3 },
    { from: m(r, d), to: m(o, sq), width: 3 },
  ];
  return {
    key: `${a}:${b}:${c}:${kn}`,
    prompt: `그림과 같이 직육면체 모양 상자를 끈으로 가로 방향과 세로 방향으로 한 바퀴씩 둘러 묶었습니다. 매듭을 묶는 데 끈 ${kn} cm를 사용했다면 사용한 끈은 모두 몇 cm인가요?`,
    visual: { ...sk, lines: [...L, ...ribbon] },
    answer: v,
    unit: "cm",
    hint: "가로 방향 한 바퀴는 (가로 × 2 + 높이 × 2), 세로 방향 한 바퀴는 (세로 × 2 + 높이 × 2)예요.",
    explanation: `(${a} × 2 + ${c} × 2) + (${b} × 2 + ${c} × 2) + ${kn} = ${v}(cm)`,
    mistakes: { [v - kn]: "매듭에 사용한 끈을 더하지 않았어요.", [v - 2 * c]: "높이는 네 번 지나가요." },
  };
}));
