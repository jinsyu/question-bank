import type { ShapeScene } from "../types";
import { pick, randInt, shuffle } from "../../lib/random";
import { josa, NAMES, opts } from "./g2";
import {
  blocksOk, blocksScene, CIRCLED, column, type Cube, easy, figuresScene, type FigKind, gridCubes, layers, lineCubes, MARKS, mid, ord, POLY_SIDES, type Pt,
  interiorAngles, MAX_ANGLE, randomPolygon, row, tangramScene, TANGRAM, TWIN, unionSides, word,
} from "./g2-pics";

/**
 * 2-1 2단원 여러 가지 도형: 교과서처럼 그림을 보고 도형을 찾고, 세고, 만들고, 쌓는다.
 * (글로만 된 "삼각형 3개와 사각형 2개의 꼭짓점 합" 같은 계산은 쓰지 않는다)
 */

type Lines = NonNullable<ShapeScene["lines"]>;
const POLY_NAMES = ["삼각형", "사각형", "오각형", "육각형"] as const;
const nameOf = (n: number) => POLY_NAMES[n - 3];

/* ── 도형 찾기·세기 ── */

/** 목표 도형마다 헷갈리기 쉬운 예가 아닌 것 */
const NOT: Record<string, FigKind[]> = {
  삼각형: ["열린 도형", "굽은 선 도형", "사각형", "오각형", "원"],
  사각형: ["열린 도형", "둥근 사각형", "삼각형", "오각형", "원"],
  오각형: ["사각형", "육각형", "열린 도형", "삼각형"],
  육각형: ["오각형", "사각형", "열린 도형", "원"],
  원: ["타원", "열린 원", "둥근 사각형", "굽은 선 도형", "육각형"],
};

const WHY: Record<string, string> = {
  삼각형: "곧은 선 3개로 완전히 둘러싸인 도형",
  사각형: "곧은 선 4개로 완전히 둘러싸인 도형",
  오각형: "곧은 선 5개로 둘러싸인 도형",
  육각형: "곧은 선 6개로 둘러싸인 도형",
  원: "어느 쪽에서 보아도 똑같이 동그랗고, 끊어진 곳이 없는 도형",
};

type Target = "삼각형" | "사각형" | "원" | "오각형" | "육각형";

/** 도형을 찾거나 세는 문제의 그림 설명: 도형 이름을 적으면 정답이 드러나므로 개수와 기호만 쓴다 */
const figuresLabel = (n: number) => `도형 ${n}개(${MARKS[0]}~${MARKS[n - 1]})`;

/** 도형 4개 중 목표 도형 하나 찾기(하) */
export function shapeFind(id: string, target: Target) {
  return easy(id, (rand) => {
    const others = shuffle(rand, NOT[target]).slice(0, 3);
    const kinds = shuffle(rand, [target as FigKind, ...others]);
    const answer = MARKS[kinds.indexOf(target)];
    return {
      key: kinds.join(),
      prompt: `${josa(target, "을/를")} 찾아 기호를 고르세요.`,
      visual: figuresScene(rand, kinds, figuresLabel(kinds.length)),
      choices: MARKS.slice(0, 4),
      answer,
      hint: `${target}은 ${WHY[target]}이에요.`,
      explanation: `${answer}이 ${target}입니다. ${others.map((o) => `${MARKS[kinds.indexOf(o)]}은 ${o === "열린 도형" ? "선이 끊어져 있어요" : o === "굽은 선 도형" ? "굽은 선이 있어요" : o === "타원" ? "길쭉하게 둥글어요" : o === "둥근 사각형" ? "곧은 선과 굽은 선이 섞여 있어요" : o === "열린 원" ? "끊어진 곳이 있어요" : o}`).join(", ")}.`,
    };
  });
}

/** 여러 도형 중 목표 도형이 몇 개인지 세기 */
export function shapeCount(id: string, targets: Target | Target[], level: 2 | 3) {
  const make = level === 2 ? mid : word;
  return make(id, (rand) => {
    const target = Array.isArray(targets) ? pick(rand, targets) : targets;
    const n = level === 2 ? 6 : 8;
    const k = randInt(rand, 2, level === 2 ? 3 : 4);
    const kinds = shuffle(rand, [...Array<FigKind>(k).fill(target), ...Array.from({ length: n - k }, () => pick(rand, NOT[target]))]);
    const at = kinds.flatMap((x, i) => (x === target ? [MARKS[i]] : []));
    return {
      key: kinds.join(),
      prompt: `그림에서 ${josa(target, "은/는")} 모두 몇 개인가요?`,
      visual: figuresScene(rand, kinds, figuresLabel(n), 4),
      answer: k,
      unit: "개",
      hint: `${target}은 ${WHY[target]}이에요. 끊어지거나 굽은 곳이 있는지 살펴보세요.`,
      explanation: `${at.join(", ")} → ${k}개`,
      mistakes: kinds.includes("열린 도형") ? { [k + kinds.filter((x) => x === "열린 도형").length]: "끊어진 도형은 둘러싸여 있지 않아요." } : undefined,
    };
  });
}

/* ── 점 종이: 삼각형이 되지 않는 점 ── */

export const triDot = word("l2-tri-dot", (rand) => {
  const g = 40;
  const [cols, rows] = [6, 4];
  const P = (c: number, r: number): Pt => [20 + c * g, 20 + r * g];
  const dir = pick(rand, [[1, 0], [0, 1], [1, 1], [1, -1], [2, 1]] as const);
  const a: [number, number] = [randInt(rand, 0, 2), dir[1] < 0 ? randInt(rand, 2, 3) : randInt(rand, 0, 1)];
  const b: [number, number] = [a[0] + dir[0], a[1] + dir[1]];
  const onLine = ([c, r]: [number, number]) => (c - a[0]) * dir[1] - (r - a[1]) * dir[0] === 0;
  const all = Array.from({ length: cols * rows }, (_, i): [number, number] => [i % cols, Math.floor(i / cols)]);
  const inside = ([c, r]: [number, number]) => c >= 0 && c < cols && r >= 0 && r < rows;
  if (!inside(b)) return null;
  const same = (p: [number, number], q: [number, number]) => p[0] === q[0] && p[1] === q[1];
  const line = all.filter((p) => onLine(p) && !same(p, a) && !same(p, b));
  const off = all.filter((p) => !onLine(p));
  if (!line.length || off.length < 3) return null;
  const bad = pick(rand, line);
  const cand = shuffle(rand, [bad, ...shuffle(rand, off).slice(0, 3)]);
  const texts = [
    { at: [P(...a)[0] - 10, P(...a)[1] - 11] as Pt, text: "ㄱ" },
    { at: [P(...b)[0] - 10, P(...b)[1] - 11] as Pt, text: "ㄴ" },
    ...cand.map((p, i) => ({ at: [P(...p)[0] + 10, P(...p)[1] - 11] as Pt, text: MARKS[i] })),
  ];
  const answer = MARKS[cand.indexOf(bad)];
  return {
    key: `${a}:${b}:${cand.join("|")}`,
    prompt: "점 ㄱ과 점 ㄴ을 이은 곧은 선에 한 점을 더 이어 삼각형을 그리려고 합니다. 삼각형을 그릴 수 없는 점을 고르세요.",
    visual: {
      kind: "shape",
      width: 40 + (cols - 1) * g,
      height: 40 + (rows - 1) * g,
      label: "점 종이, 점 ㄱ과 ㄴ을 이은 선과 점 ㉠~㉣",
      dots: all.map((p) => P(...p)),
      lines: [{ from: P(...a), to: P(...b) }],
      texts,
    },
    choices: MARKS.slice(0, 4),
    answer,
    hint: "세 점이 한 곧은 선 위에 있으면 이어도 둘러싸인 도형이 되지 않아요.",
    explanation: `${answer}은 점 ㄱ, ㄴ과 한 곧은 선 위에 있어서 이으면 곧은 선이 될 뿐 삼각형이 되지 않아요.`,
  };
});

/* ── 종이를 점선을 따라 자르기 ── */

type Cut = { cuts: [Pt, Pt][]; pieces: Record<"삼각형" | "사각형" | "오각형", number> };
function paperCut(rand: () => number): Cut {
  const [L, T, R, B] = [10, 10, 210, 130];
  const x = () => randInt(rand, 8, 12) * 10;
  const t = pick(rand, [1, 2, 3, 4, 5, 6]);
  if (t === 1) return { cuts: [[[x(), T], [x(), B]]], pieces: { 삼각형: 0, 사각형: 2, 오각형: 0 } };
  if (t === 2) {
    const [a, b] = [randInt(rand, 6, 8) * 10, randInt(rand, 13, 15) * 10];
    return { cuts: [[[a, T], [a + randInt(rand, -1, 1) * 10, B]], [[b, T], [b + randInt(rand, -1, 1) * 10, B]]], pieces: { 삼각형: 0, 사각형: 3, 오각형: 0 } };
  }
  if (t === 3) return { cuts: [rand() < 0.5 ? [[L, T], [R, B]] : [[R, T], [L, B]]], pieces: { 삼각형: 2, 사각형: 0, 오각형: 0 } };
  if (t === 4) {
    const y = randInt(rand, 6, 8) * 10;
    return { cuts: [[[L, y], [R, y]], [[x(), T], [x(), y]]], pieces: { 삼각형: 0, 사각형: 3, 오각형: 0 } };
  }
  if (t === 5) return { cuts: [[[randInt(rand, 5, 8) * 10, T], [L, randInt(rand, 5, 8) * 10]]], pieces: { 삼각형: 1, 사각형: 0, 오각형: 1 } };
  const m = x();
  return { cuts: [[[m, T], [m, B]], [[L, T], [m, B]]], pieces: { 삼각형: 2, 사각형: 1, 오각형: 0 } };
}

export const cutPaper = word("l2-cut-paper", (rand) => {
  const c = paperCut(rand);
  const kinds = (["삼각형", "사각형"] as const).filter((k) => c.pieces[k] > 0);
  const ask = pick(rand, kinds);
  const n = c.pieces[ask];
  const total = c.pieces.삼각형 + c.pieces.사각형 + c.pieces.오각형;
  return {
    key: `${JSON.stringify(c.cuts)}:${ask}`,
    prompt: `사각형 모양의 종이를 점선을 따라 모두 잘랐습니다. 잘라 낸 조각 중 ${josa(ask, "은/는")} 몇 개인가요?`,
    visual: {
      kind: "shape",
      width: 220,
      height: 140,
      label: `사각형 종이와 자르는 점선 ${c.cuts.length}개`,
      polygons: [{ points: [[10, 10], [210, 10], [210, 130], [10, 130]] }],
      lines: c.cuts.map(([a, b]) => ({ from: a, to: b, dashed: true })),
    },
    answer: n,
    unit: "개",
    hint: "점선으로 나뉜 조각마다 곧은 선(변)이 몇 개인지 세어 보세요.",
    explanation: `조각 ${total}개 중 삼각형 ${c.pieces.삼각형}개, 사각형 ${c.pieces.사각형}개${c.pieces.오각형 ? `, 오각형 ${c.pieces.오각형}개` : ""} → ${ask} ${n}개`,
    mistakes: { [total]: "조각 전체의 수를 세었어요." },
  };
});

/* ── 오각형·육각형 ── */

export const polyName = easy("l2-poly-name", (rand) => {
  const n = pick(rand, [5, 6, 5, 6, 3, 4]);
  const pts = randomPolygon(rand, n, [90, 80], 62);
  return {
    key: `${n}:${pts.flat().join()}`,
    prompt: "도형의 이름을 고르세요.",
    visual: { kind: "shape", width: 180, height: 160, label: "꼭짓점에 점을 찍은 도형", polygons: [{ points: pts }], dots: pts },
    choices: [...POLY_NAMES],
    answer: nameOf(n),
    hint: "변(곧은 선)이나 꼭짓점의 수를 세어 이름을 정해요.",
    explanation: `변이 ${n}개, 꼭짓점이 ${n}개이므로 ${nameOf(n)}입니다.`,
  };
});

/** 도형의 귀퉁이를 곧은 선으로 잘라 내면 남는 도형 */
export const cornerCut = mid("l2-corner-cut", (rand) => {
  const base = pick(rand, [3, 4, 4]);
  const k = base === 3 ? pick(rand, [1, 2]) : pick(rand, [1, 2, 2]);
  const pts: Pt[] = base === 3 ? [[110, 12], [205, 150], [15, 150]] : [[15, 15], [205, 15], [205, 150], [15, 150]];
  const corners = shuffle(rand, pts.map((_, i) => i)).slice(0, k);
  const lines: Lines = corners.map((i) => {
    const p = pts[i];
    const a = pts[(i + pts.length - 1) % pts.length];
    const b = pts[(i + 1) % pts.length];
    const t = 0.28;
    return { from: [Math.round(p[0] + (a[0] - p[0]) * t), Math.round(p[1] + (a[1] - p[1]) * t)] as Pt, to: [Math.round(p[0] + (b[0] - p[0]) * t), Math.round(p[1] + (b[1] - p[1]) * t)] as Pt, dashed: true };
  });
  const n = base + k;
  const baseName = nameOf(base);
  return {
    key: `${base}:${corners.join()}`,
    prompt: `${baseName} 모양의 종이에서 귀퉁이를 점선을 따라 잘라 냈습니다. 남은 큰 조각은 어떤 도형인가요?`,
    visual: { kind: "shape", width: 220, height: 165, label: `${baseName}과 귀퉁이를 자르는 점선 ${k}개`, polygons: [{ points: pts }], lines },
    choices: [...POLY_NAMES],
    answer: nameOf(n),
    hint: "귀퉁이 하나를 잘라 내면 꼭짓점 1개가 없어지고 새 꼭짓점 2개가 생겨요. 남은 조각의 변을 세어 보세요.",
    explanation: `귀퉁이를 ${k}번 잘라 내면 꼭짓점이 ${base}개에서 ${n}개가 되므로 ${nameOf(n)}입니다.`,
  };
});

/** 점 종이에 그리다 만 도형: 선을 하나 더 그어 완성하면 무슨 도형? */
export const polyDraw = word("l2-poly-draw", (rand) => {
  const g = 34;
  const n = pick(rand, [4, 5, 6]);
  const c: Pt = [3, 2.5];
  const cand = Array.from({ length: 7 * 6 }, (_, i): Pt => [i % 7, Math.floor(i / 7)]);
  // 모눈 점 위의 볼록한 다각형: 가운데를 둘러 고르게 돌며 가까운 모눈 점을 고른다
  const base = rand() * Math.PI * 2;
  const pts = Array.from({ length: n }, (_, i): Pt => {
    const a = base + ((i + (rand() - 0.5) * 0.4) * 2 * Math.PI) / n;
    const r = 2.2 + rand() * 0.5;
    return [Math.min(6, Math.max(0, Math.round(c[0] + r * Math.cos(a)))), Math.min(5, Math.max(0, Math.round(c[1] + r * Math.sin(a))))];
  });
  if (new Set(pts.map((p) => p.join())).size < n) return null;
  const turn = (a: Pt, p: Pt, b: Pt) => (p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0]);
  const signs = pts.map((p, i) => Math.sign(turn(pts[(i + n - 1) % n], p, pts[(i + 1) % n])));
  if (signs.some((s) => s !== signs[0] || s === 0)) return null;
  if (Math.max(...interiorAngles(pts)) > MAX_ANGLE + 5) return null;
  const P = ([x, y]: Pt): Pt => [16 + x * g, 16 + y * g];
  const lines: Lines = pts.slice(0, n - 1).map((p, i) => ({ from: P(p), to: P(pts[i + 1]) }));
  // 변이 너무 짧으면 꼭짓점이 잘 안 보인다
  if (pts.some((p, i) => Math.hypot(p[0] - pts[(i + 1) % n][0], p[1] - pts[(i + 1) % n][1]) < 1.9)) return null;
  return {
    key: pts.flat().join(),
    prompt: "점 종이에 곧은 선을 이어 그리다가 멈추었습니다. 양 끝의 두 점을 곧은 선으로 이어 도형을 완성하면 어떤 도형이 되나요?",
    visual: { kind: "shape", width: 32 + 6 * g, height: 32 + 5 * g, label: `점 종이에 이어 그린 곧은 선 ${n - 1}개`, dots: cand.map(P), lines },
    choices: [...POLY_NAMES],
    answer: nameOf(n),
    hint: "지금 그린 곧은 선의 수에 1을 더하면 완성한 도형의 변의 수예요.",
    explanation: `곧은 선 ${n - 1}개에 1개를 더 그으면 변이 ${n}개인 ${nameOf(n)}이 됩니다.`,
    mistakes: { [nameOf(n - 1)]: "양 끝을 잇는 선 1개도 변이에요." },
  };
});

/** 그림 속 오각형과 육각형의 꼭짓점 수 모두 더하기 */
export const polyVertexSum = word("l2-poly-vertex-sum", (rand) => {
  const kinds = shuffle(rand, [pick(rand, ["오각형", "육각형"] as const), pick(rand, ["오각형", "육각형"] as const), pick(rand, ["삼각형", "사각형", "원", "열린 도형"] as const), pick(rand, ["삼각형", "사각형"] as const)]) as FigKind[];
  const target = kinds.filter((k) => k === "오각형" || k === "육각형");
  const sum = target.reduce((s, k) => s + POLY_SIDES[k], 0);
  return {
    key: kinds.join(),
    prompt: "그림에서 오각형과 육각형을 모두 찾아, 찾은 도형의 꼭짓점의 수를 모두 더하면 몇 개인가요?",
    visual: figuresScene(rand, kinds, figuresLabel(kinds.length)),
    answer: sum,
    unit: "개",
    hint: "오각형은 꼭짓점이 5개, 육각형은 6개예요. 먼저 오각형과 육각형을 찾아요.",
    explanation: `${target.map((k) => `${k} ${POLY_SIDES[k]}개`).join(" + ")} → ${sum}개`,
  };
});

/* ── 원: 크고 작은 원 세기 ── */

export const circleMany = word("l2-circle-many", (rand) => {
  const circles: NonNullable<ShapeScene["circles"]> = [];
  const arcs: NonNullable<ShapeScene["arcs"]> = [];
  const polygons: NonNullable<ShapeScene["polygons"]> = [];
  const k = randInt(rand, 3, 5);
  const spots: Pt[] = shuffle(rand, [[40, 40], [110, 38], [180, 42], [250, 40], [45, 115], [115, 112], [185, 118], [255, 115]]);
  spots.slice(0, k).forEach(([x, y]) => circles.push({ c: [x, y], r: randInt(rand, 14, 30) }));
  const fakes = spots.slice(k, k + randInt(rand, 2, 3));
  for (const [x, y] of fakes) {
    if (rand() < 0.5) {
      const from = randInt(rand, 0, 300);
      arcs.push({ c: [x, y], r: randInt(rand, 16, 28), from: from + 50, to: from + 360, width: 2 });
    } else {
      const [a, b] = rand() < 0.5 ? [30, 16] : [16, 30];
      polygons.push({ points: Array.from({ length: 36 }, (_, i): Pt => [Math.round((x + a * Math.cos((i * Math.PI) / 18)) * 10) / 10, Math.round((y + b * Math.sin((i * Math.PI) / 18)) * 10) / 10]) });
    }
  }
  // 원 안에 작은 원을 하나 더 그린 곳도 센다
  const inner = rand() < 0.6 ? circles[0] : null;
  if (inner && inner.r >= 22) circles.push({ c: inner.c, r: inner.r - 10 });
  const n = circles.length;
  return {
    key: JSON.stringify([circles, arcs.length, polygons.length]),
    prompt: "그림에서 크고 작은 원은 모두 몇 개인가요?",
    visual: { kind: "shape", width: 290, height: 155, label: "크고 작은 둥근 모양 여러 개", circles, arcs, polygons },
    answer: n,
    unit: "개",
    hint: "끊어진 곳이 있거나 길쭉한 모양은 원이 아니에요. 원 안의 작은 원도 세어요.",
    explanation: `끊어지지 않고 어느 쪽에서 보아도 똑같이 동그란 모양은 ${n}개예요.`,
    mistakes: { [n + fakes.length]: "끊어진 모양이나 길쭉한 모양은 원이 아니에요." },
  };
});

/* ── 칠교판 ── */

const TANGRAM_ASK = [
  ["삼각형 조각", 5, "개"],
  ["사각형 조각", 2, "개"],
  ["조각", 7, "개"],
  ["가장 큰 삼각형 조각", 2, "개"],
  ["가장 작은 삼각형 조각", 2, "개"],
] as const;

export const tangramCount = easy("l2-tangram-count", (rand) => {
  const [ask, ans, unit] = pick(rand, TANGRAM_ASK);
  return {
    key: ask,
    prompt: `칠교판입니다. ${josa(ask, "은/는")} 모두 몇 개인가요?`,
    visual: tangramScene([1, 2, 3, 4, 5, 6, 7], { numbered: true, label: "번호를 붙인 칠교판 7조각" }),
    answer: ans,
    unit,
    hint: "번호를 하나씩 짚으며 조각의 모양을 살펴보세요.",
    explanation: "칠교판: 삼각형 조각 ①②③④⑥ 5개(가장 큰 것 ①② 2개, 가장 작은 것 ④⑥ 2개), 사각형 조각 ⑤⑦ 2개 → 모두 7개",
  };
});

/** 조각 k개가 이어 붙은 모음(한 덩어리, 변의 수 3~6) */
function tangramGroup(rand: () => number, k: number): { nos: number[]; sides: number } | null {
  for (let t = 0; t < 60; t++) {
    const nos = shuffle(rand, [1, 2, 3, 4, 5, 6, 7]).slice(0, k).sort();
    const u = unionSides(nos);
    if (u && u.sides >= 3 && u.sides <= 6) return { nos, sides: u.sides };
  }
  return null;
}

export const tangramShape = mid("l2-tangram-shape", (rand) => {
  // 칠교판 안에서 이어 붙은 조각끼리 만든 볼록한 모양(삼각형 2가지, 사각형 9가지): 답이 한쪽으로 쏠리지 않게 도형을 먼저 고른다
  const sides = pick(rand, [3, 4]);
  const nos = pick(rand, sides === 3 ? ["12", "34567"] : ["45", "56", "67", "145", "267", "456", "567", "3567", "4567"]).split("").map(Number);
  const g = { nos, sides };
  const tf = randInt(rand, 0, 7);
  return {
    key: `${g.nos.join()}:${tf}`,
    prompt: `칠교 조각 ${g.nos.length}개를 겹치지 않게 이어 붙여 만든 모양입니다. 만든 모양의 이름을 고르세요.`,
    visual: tangramScene(g.nos, { tf, label: `칠교 조각 ${g.nos.length}개로 만든 모양` }),
    choices: [...POLY_NAMES],
    answer: nameOf(g.sides),
    hint: "조각 사이의 선은 빼고, 바깥쪽을 둘러싼 곧은 선(변)만 세어 보세요.",
    explanation: `바깥쪽 변이 ${g.sides}개이므로 ${nameOf(g.sides)}입니다.`,
  };
});

export const tangramSame = mid("l2-tangram-same", (rand) => {
  const n = pick(rand, [1, 2, 4, 6]);
  const answer = CIRCLED[TWIN[n] - 1];
  const wrong = [3, 5, 7, ...[1, 2, 4, 6].filter((x) => x !== n && x !== TWIN[n])].map((x) => CIRCLED[x - 1]);
  const choices = opts(rand, answer, shuffle(rand, wrong));
  if (!choices) return null;
  return {
    key: `${n}:${choices.join()}`,
    prompt: `칠교판에서 ${CIRCLED[n - 1]} 조각과 모양과 크기가 똑같은 조각을 고르세요.`,
    visual: tangramScene([1, 2, 3, 4, 5, 6, 7], { numbered: true, label: "번호를 붙인 칠교판 7조각" }),
    choices,
    answer,
    hint: "모양이 같아도 크기가 다를 수 있어요. 변의 길이를 비교해 보세요.",
    explanation: `${josa(CIRCLED[n - 1], "과/와")} ${josa(answer, "은/는")} ${TANGRAM[n - 1].name} 조각으로 모양과 크기가 똑같아요.`,
  };
});

export const tangramPieces = word("l2-tangram-pieces", (rand) => {
  const g = tangramGroup(rand, randInt(rand, 4, 5));
  if (!g) return null;
  const tri = g.nos.filter((n) => TANGRAM[n - 1].kind === "삼각형").length;
  const quad = g.nos.length - tri;
  if (!quad) return null;
  const tf = randInt(rand, 0, 7);
  const ask = pick(rand, ["삼각형", "사각형"] as const);
  return {
    key: `${g.nos.join()}:${tf}:${ask}`,
    prompt: `칠교 조각으로 모양을 채웠습니다. 모양을 채우는 데 사용한 조각 중 ${ask} 조각은 몇 개인가요?`,
    visual: tangramScene(g.nos, { tf, label: `칠교 조각 ${g.nos.length}개로 채운 모양` }),
    answer: ask === "삼각형" ? tri : quad,
    unit: "개",
    hint: "모양 안의 선을 따라 조각을 하나씩 나누어 보고, 변이 3개인지 4개인지 세어요.",
    explanation: `사용한 조각 ${g.nos.length}개: 삼각형 ${tri}개, 사각형 ${quad}개`,
    mistakes: { [g.nos.length]: "사용한 조각 전체의 수를 세었어요." },
  };
});

export const tangramMissing = word("l2-tangram-missing", (rand) => {
  const g = tangramGroup(rand, randInt(rand, 3, 4));
  if (!g) return null;
  const missing = pick(rand, g.nos);
  const rest = g.nos.filter((n) => n !== missing);
  if (unionSides(rest) === null) return null;
  const answer = CIRCLED[missing - 1];
  const pool = [1, 2, 3, 4, 5, 6, 7].filter((n) => n !== missing && n !== TWIN[missing] && TANGRAM[n - 1].name !== TANGRAM[missing - 1].name).map((n) => CIRCLED[n - 1]);
  const choices = opts(rand, answer, shuffle(rand, pool));
  if (!choices) return null;
  const tf = randInt(rand, 0, 3);
  return {
    key: `${g.nos.join()}:${missing}:${tf}`,
    prompt: "오른쪽은 왼쪽 칠교판의 조각으로 채운 모양인데, 한 조각(?)이 빠져 있습니다. 빈 곳에 알맞은 조각을 고르세요.",
    visual: row([tangramScene([1, 2, 3, 4, 5, 6, 7], { numbered: true, unit: 34 }), tangramScene(rest, { dashedNos: [missing], tf, unit: 34 })], "왼쪽: 번호를 붙인 칠교판, 오른쪽: 한 조각이 빠진 모양", undefined, 28),
    choices,
    answer,
    hint: "빈 곳의 모양(삼각형인지 사각형인지)과 크기를 칠교판의 조각과 비교해 보세요.",
    explanation: `빈 곳은 ${TANGRAM[missing - 1].name} 모양이므로 ${answer}${TWIN[missing] ? `(또는 모양과 크기가 같은 ${CIRCLED[TWIN[missing] - 1]})` : ""} 조각이 들어가요.`,
  };
});

/* ── 쌓기나무 ── */

/** 모든 쌓기나무가 보이는 모양(앞줄·뒷줄) */
export function randomBlocks(rand: () => number, min: number, max: number, twoRows = true): Cube[] | null {
  for (let t = 0; t < 80; t++) {
    const w = randInt(rand, 2, 4);
    const front = Array.from({ length: w }, () => randInt(rand, 0, 3));
    // 뒷줄은 앞줄이 빈 칸에만 놓는다(ㄱ자·ㄴ자 모양): 앞 기둥 뒤에 숨는 쌓기나무가 없다
    const back = twoRows && rand() < 0.6 ? front.map((h) => (h ? 0 : randInt(rand, 1, 3))) : [];
    if (!front[0] && !back[0]) continue;
    const cubes = gridCubes(front, back);
    // 한 덩어리: 1층끼리 앞뒤·옆으로 이어져 있어야 한다
    const base = cubes.filter((q) => q[2] === 0);
    const seen = new Set([base[0]?.join()]);
    for (let changed = true; changed; ) {
      changed = false;
      for (const q of base) {
        if (!seen.has(q.join()) && base.some((p) => seen.has(p.join()) && Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) === 1)) {
          seen.add(q.join());
          changed = true;
        }
      }
    }
    if (!base.length || seen.size !== base.length) continue;
    if (cubes.length >= min && cubes.length <= max && blocksOk(cubes) && Math.max(...cubes.map((q) => q[2])) >= 1) return cubes;
  }
  return null;
}

export const blocksCount = easy("l2-blocks-count", (rand) => {
  const cubes = randomBlocks(rand, 3, 7, false);
  if (!cubes) return null;
  return {
    key: cubes.map((q) => q.join("")).join(),
    prompt: "쌓기나무로 쌓은 모양입니다. 보이지 않는 쌓기나무는 없습니다. 사용한 쌓기나무는 모두 몇 개인가요?",
    visual: blocksScene(cubes, "쌓기나무로 쌓은 모양"),
    answer: cubes.length,
    unit: "개",
    hint: "1층부터 층마다 세어 더하면 빠뜨리지 않아요.",
    explanation: `${layers(cubes).map((n, i) => `${i + 1}층 ${n}개`).join(", ")} → ${cubes.length}개`,
  };
});

export const blocksLayer = mid("l2-blocks-layer", (rand) => {
  const cubes = randomBlocks(rand, 5, 9);
  if (!cubes) return null;
  const ls = layers(cubes);
  const z = randInt(rand, 0, ls.length - 1);
  return {
    key: `${cubes.map((q) => q.join("")).join()}:${z}`,
    prompt: `쌓기나무로 쌓은 모양입니다. 보이지 않는 쌓기나무는 없습니다. ${z + 1}층에 있는 쌓기나무는 몇 개인가요?`,
    visual: blocksScene(cubes, "쌓기나무로 쌓은 모양"),
    answer: ls[z],
    unit: "개",
    hint: "바닥에 놓인 것이 1층, 그 위에 올린 것이 2층이에요. 뒷줄도 빠뜨리지 말고 세어요.",
    explanation: ls.map((n, i) => `${i + 1}층 ${n}개`).join(", "),
    mistakes: { [cubes.length]: "모든 층의 쌓기나무를 세었어요." },
  };
});

/** 앞면이 가려지지 않은 쌓기나무(앞과 앞 오른쪽이 비어 있음) */
const frontClear = (cubes: Cube[], [x, y, z]: Cube) => !cubes.some((q) => q[1] === y - 1 && q[2] === z && (q[0] === x || q[0] === x + 1));

export const blocksPosition = mid("l2-blocks-position", (rand) => {
  const cubes = randomBlocks(rand, 4, 8);
  if (!cubes) return null;
  const idx = cubes.map((_, i) => i).filter((i) => frontClear(cubes, cubes[i]));
  const dirs = [
    ["위", [0, 0, 1]],
    ["오른쪽", [1, 0, 0]],
    ["왼쪽", [-1, 0, 0]],
  ] as const;
  const [dname, d] = pick(rand, dirs);
  const pairs = idx.flatMap((i) => {
    const t = cubes.findIndex((q) => q[0] === cubes[i][0] + d[0] && q[1] === cubes[i][1] && q[2] === cubes[i][2] + d[2]);
    return t >= 0 && idx.includes(t) ? [[i, t]] : [];
  });
  if (!pairs.length) return null;
  const [ref, ans] = pick(rand, pairs);
  const others = shuffle(rand, idx.filter((i) => i !== ref && i !== ans)).slice(0, 2);
  if (others.length < 2) return null;
  const labeled = shuffle(rand, [ref, ans, ...others]);
  const names = ["㉠", "㉡", "㉢", "㉣"];
  const labels: Record<number, string> = {};
  labeled.forEach((i, k) => (labels[i] = names[k]));
  return {
    key: `${cubes.map((q) => q.join("")).join()}:${ref}:${dname}`,
    prompt: `${labels[ref]} 쌓기나무의 바로 ${dname}에 있는 쌓기나무를 고르세요.`,
    visual: blocksScene(cubes, `쌓기나무로 쌓은 모양, 쌓기나무 4개에 ㉠㉡㉢㉣`, labels),
    choices: names,
    answer: labels[ans],
    hint: `${labels[ref]}에서 ${dname} 방향으로 한 칸 옮겨 가 보세요. 오른쪽·왼쪽은 그림을 보는 내 쪽을 기준으로 해요.`,
    explanation: `${labels[ref]}의 바로 ${dname}에는 ${labels[ans]}이 있어요.`,
  };
});

/** 한 줄로 놓은 1층 위에 쌓기나무를 올린 모양 설명 */
function describeLine(h: number[]): string {
  const base = `1층에 쌓기나무 ${h.length}개를 옆으로 나란히 놓고`;
  const ups = h.flatMap((v, i) => (v >= 2 ? [`왼쪽에서 ${ord(i + 1)} 쌓기나무 위에 ${v - 1}개`] : []));
  return `${base}, ${ups.join(", ")}를 쌓았습니다.`;
}

export const blocksCompare = word("l2-blocks-compare", (rand) => {
  const len = randInt(rand, 3, 4);
  const make = () => Array.from({ length: len }, () => 1).map((v) => v + (rand() < 0.35 ? randInt(rand, 1, 2) : 0));
  const target = make();
  if (target.every((v) => v === 1)) return null;
  const sig = (h: number[]) => h.join("");
  const opt: number[][] = [target];
  for (let t = 0; t < 40 && opt.length < 4; t++) {
    const h = rand() < 0.5 ? [...target].reverse() : rand() < 0.5 ? make() : target.map((v, i) => (i === randInt(rand, 0, len - 1) ? Math.max(1, v + pick(rand, [-1, 1])) : v));
    if (!opt.some((o) => sig(o) === sig(h)) && h.some((v) => v > 1)) opt.push(h);
  }
  if (opt.length < 4) return null;
  const order = shuffle(rand, opt);
  const marks = ["가", "나", "다", "라"];
  const answer = marks[order.findIndex((o) => sig(o) === sig(target))];
  return {
    key: order.map(sig).join(":"),
    prompt: `설명대로 쌓은 모양을 고르세요. "${describeLine(target)}"`,
    visual: column(
      [row(order.slice(0, 2).map((h) => blocksScene(lineCubes(h), "")), "", marks.slice(0, 2), 40), row(order.slice(2).map((h) => blocksScene(lineCubes(h), "")), "", marks.slice(2), 40)],
      `쌓기나무 모양 가~라: ${order.map((h, i) => `${marks[i]} ${h.join("-")}`).join(", ")}`,
    ),
    choices: marks,
    answer,
    hint: "1층의 개수를 먼저 확인하고, 2층 쌓기나무가 어느 쌓기나무 위에 있는지 왼쪽부터 세어 보세요.",
    explanation: `${answer}: 왼쪽부터 ${target.map((v) => `${v}층`).join(", ")} 높이로 쌓았어요.`,
  };
});

export const blocksMore = word("l2-blocks-more", (rand) => {
  const cubes = randomBlocks(rand, 6, 10);
  if (!cubes) return null;
  const have = randInt(rand, 3, cubes.length - 1);
  const name = pick(rand, NAMES);
  return {
    key: `${cubes.map((q) => q.join("")).join()}:${have}`,
    prompt: `${josa(name, "은/는")} 쌓기나무를 ${have}개 가지고 있습니다. 그림과 똑같은 모양으로 쌓으려면 쌓기나무가 몇 개 더 있어야 하나요? (보이지 않는 쌓기나무는 없습니다.)`,
    visual: blocksScene(cubes, "쌓기나무로 쌓은 모양"),
    answer: cubes.length - have,
    unit: "개",
    hint: "먼저 그림의 쌓기나무를 층마다 세어 모두 몇 개인지 구해요.",
    explanation: `그림의 쌓기나무 ${layers(cubes).join(" + ")} = ${cubes.length}(개), ${cubes.length} − ${have} = ${cubes.length - have}(개)`,
    mistakes: { [cubes.length]: "가지고 있는 쌓기나무를 빼야 해요." },
  };
});

/* ── 도형 차시 생성기 모음 ── */

export const triFind = shapeFind("l2-tri-find", "삼각형");
export const triCount = shapeCount("l2-tri-count", "삼각형", 2);
export const quadFind = shapeFind("l2-quad-find", "사각형");
export const quadCount = shapeCount("l2-quad-count", "사각형", 2);
export const polyCount = shapeCount("l2-poly-count", ["오각형", "육각형"], 2);
export const circleFind = shapeFind("l2-circle-find", "원");
export const circleCount = shapeCount("l2-circle-count", "원", 2);
