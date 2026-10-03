import { pick, randInt, shuffle } from "../../lib/random";
import type { ShapeScene } from "../types";
import { mid, word } from "../words/word";
import { easy } from "./g5";
import { MARKS, add, fit, guard, lengthText, regularPolygon, rightMark, rp, segText, toScreen, vertexTexts, type Lines, type Pt, type Texts } from "./g5-figure";
import { jq } from "./g5-text";

/**
 * 5-1 다각형의 둘레와 넓이: 교과서처럼 길이가 적힌 도형 그림(밑변·높이는 점선과 직각 표시)을 보고 푼다.
 * 그림은 cm 길이에 비례해 그리고, 높이와 옆변을 모두 보여 주어 밑변에 대한 높이를 스스로 고르게 한다.
 */

const POLY_NAME = ["", "", "", "정삼각형", "정사각형", "정오각형", "정육각형", "", "정팔각형"];

/** 수학 좌표(cm)를 가로 maxW·세로 maxH(px) 안에 들어가게 화면으로 */
function scaled(pts: Pt[], maxW = 190, maxH = 120, maxK = 14): Pt[] {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const k = Math.min(maxK, maxW / (Math.max(...xs) - Math.min(...xs) || 1), maxH / (Math.max(...ys) - Math.min(...ys) || 1));
  return toScreen(pts, k);
}

/** 정다각형 그림(한 변에 글자) */
function regularScene(n: number, text: string, label: string): ShapeScene {
  const pts = regularPolygon(n, n === 3 ? 62 : 56, [0, 0], n === 4 ? 45 : n % 2 ? 90 : 90 + 180 / n);
  const bottom = pts.reduce((best, p, i) => (p[1] + pts[(i + 1) % n][1] > best.y ? { i, y: p[1] + pts[(i + 1) % n][1] } : best), { i: 0, y: -Infinity }).i;
  return fit({ label, polygons: [{ points: pts }], texts: [lengthText(pts[bottom], pts[(bottom + 1) % n], pts, text)] });
}

/** 사각형 그림: 직사각형(가로 a, 세로 b), 평행사변형(밑변 a, 옆변 b, 기울기), 마름모 */
function quadScene(kind: "직사각형" | "평행사변형" | "마름모", a: number, b: number, labels: [string, string] | [string], label: string): ShapeScene {
  const math: Pt[] =
    kind === "직사각형"
      ? [[0, b], [0, 0], [a, 0], [a, b]]
      : (() => {
          const t = (65 * Math.PI) / 180;
          const s = kind === "마름모" ? a : b;
          return [[s * Math.cos(t), s * Math.sin(t)], [0, 0], [a, 0], [a + s * Math.cos(t), s * Math.sin(t)]] as Pt[];
        })();
  const pts = scaled(math);
  const texts: Texts = [lengthText(pts[1], pts[2], pts, labels[0])];
  if (labels[1]) texts.push(lengthText(pts[0], pts[1], pts, labels[1]));
  return fit({ label, polygons: [{ points: pts }], texts });
}

/* ════════ 둘레 ════════ */

export const perimeterCalc = easy("perimeter-calc", guard((rand) => {
  const shape = pick(rand, ["정다각형", "직사각형", "평행사변형", "마름모"] as const);
  const a = randInt(rand, 3, 15);
  const b = randInt(rand, 3, 15);
  if (shape === "정다각형") {
    const n = pick(rand, [3, 5, 6, 8]);
    return {
      key: `reg:${n}:${a}`,
      prompt: `${POLY_NAME[n]}의 둘레는 몇 cm인가요?`,
      visual: regularScene(n, `${a} cm`, `한 변이 ${a} cm인 ${POLY_NAME[n]}`),
      answer: n * a,
      unit: "cm",
      hint: `${jq(POLY_NAME[n], "은/는")} ${n}개의 변의 길이가 모두 같아요. (정다각형의 둘레) = (한 변) × (변의 수)`,
      explanation: `${a} × ${n} = ${n * a}(cm)`,
      mistakes: { [a * 4]: "변의 수를 다시 세어 보세요." },
    };
  }
  if (a === b) return null;
  const labels: [string, string] | [string] = shape === "마름모" ? [`${a} cm`] : [`${a} cm`, `${b} cm`];
  const v = shape === "마름모" ? 4 * a : 2 * (a + b);
  return {
    key: `${shape}:${a}:${b}`,
    prompt: `${shape}의 둘레는 몇 cm인가요?`,
    visual: quadScene(shape, a, b, labels, `${jq(shape, "과/와")} 변의 길이`),
    answer: v,
    unit: "cm",
    hint: shape === "마름모" ? "마름모는 네 변의 길이가 모두 같아요." : `${jq(shape, "은/는")} 마주 보는 두 변의 길이가 같아요.`,
    explanation: shape === "마름모" ? `${a} × 4 = ${v}(cm)` : `(${a} + ${b}) × 2 = ${v}(cm)`,
    mistakes: shape === "마름모" ? { [a * 2]: "네 변을 모두 더해야 해요." } : { [a + b]: "두 변만 더했어요.", [a * b]: "넓이를 구했어요." },
  };
}));

export const perMissing = mid("l5-per-missing", guard((rand) => {
  const a = randInt(rand, 3, 15);
  const b = randInt(rand, 3, 15);
  if (a === b) return null;
  const shape = pick(rand, ["직사각형", "평행사변형"] as const);
  return {
    key: `${shape}:${a}:${b}`,
    prompt: `둘레가 ${2 * (a + b)} cm인 ${shape}입니다. □ 안에 알맞은 수를 구하세요.`,
    visual: quadScene(shape, a, b, [`${a} cm`, "□ cm"], `${shape}, 한 변의 길이와 □`),
    answer: b,
    unit: "cm",
    hint: "둘레를 2로 나누면 이웃한 두 변의 길이의 합이에요.",
    explanation: `${2 * (a + b)} ÷ 2 − ${a} = ${b}(cm)`,
    mistakes: { [2 * (a + b) - a]: "둘레를 2로 나누지 않았어요.", [2 * (a + b) - 2 * a]: "남은 두 변의 합이에요. 2로 나누어야 해요." },
  };
}));

export const squareSide = mid("m5-square-side", guard((rand) => {
  const s = randInt(rand, 3, 20);
  const n = pick(rand, [4, 5, 6, 8]);
  return {
    key: `${n}:${s}`,
    prompt: `둘레가 ${s * n} cm인 ${POLY_NAME[n]}입니다. □ 안에 알맞은 수를 구하세요.`,
    visual: regularScene(n, "□ cm", `${POLY_NAME[n]}, 한 변에 □`),
    answer: s,
    unit: "cm",
    hint: `${jq(POLY_NAME[n], "은/는")} 변이 ${n}개이고 길이가 모두 같아요.`,
    explanation: `${s * n} ÷ ${n} = ${s}(cm)`,
  };
}));

export const perJoined = word("l5-per-joined", guard((rand) => {
  const a = randInt(rand, 2, 12);
  const n = randInt(rand, 3, 7);
  const s = 26;
  const sq = (i: number): Pt[] => [[i * s, 0], [(i + 1) * s, 0], [(i + 1) * s, s], [i * s, s]];
  return {
    key: `${a}:${n}`,
    prompt: `한 변이 ${a} cm인 정사각형 ${n}개를 겹치지 않게 한 줄로 이어 붙였습니다. 만든 도형의 둘레는 몇 cm인가요?`,
    visual: fit({
      label: `정사각형 ${n}개를 한 줄로 이어 붙인 도형`,
      polygons: Array.from({ length: n }, (_, i) => ({ points: sq(i) })),
      texts: [{ at: [s / 2, -12], text: `${a} cm` }],
    }),
    answer: 2 * a * (n + 1),
    unit: "cm",
    hint: "붙은 변은 둘레가 아니에요. 가로와 세로의 길이를 먼저 구해 보세요.",
    explanation: `가로 ${a * n} cm, 세로 ${a} cm인 직사각형과 같으므로 (${a * n} + ${a}) × 2 = ${2 * a * (n + 1)}(cm)`,
    mistakes: { [4 * a * n]: "붙은 변까지 모두 더했어요." },
  };
}));

/** 계단 모양 도형의 둘레: 가로선끼리, 세로선끼리 옮기면 큰 직사각형의 둘레와 같다 */
export const perStep = word("l5-per-step", guard((rand) => {
  const W = randInt(rand, 8, 16);
  const H = randInt(rand, 6, 12);
  const steps = randInt(rand, 2, 3);
  // 오른쪽 아래에서 왼쪽 위로 올라가는 계단: 꺾이는 높이 y1 < y2 < …, 가로 위치 W > x1 > x2 > … > 0
  const ys = shuffle(rand, Array.from({ length: H - 1 }, (_, i) => i + 1)).slice(0, steps - 1).sort((p, q) => p - q);
  const xs = shuffle(rand, Array.from({ length: W - 1 }, (_, i) => i + 1)).slice(0, steps - 1).sort((p, q) => q - p);
  const math: Pt[] = [[0, 0], [W, 0]];
  let x = W;
  ys.forEach((y, i) => {
    math.push([x, y], [xs[i], y]);
    x = xs[i];
  });
  math.push([x, H], [0, H]);
  const k = Math.min(13, 190 / W, 130 / H);
  const scr = toScreen(math, k);
  const texts: Texts = [lengthText(scr[0], scr[1], scr, `${W} cm`), lengthText(scr[scr.length - 1], scr[0], scr, `${H} cm`)];
  return {
    key: `${W}:${H}:${xs.join()}:${ys.join()}`,
    prompt: "계단 모양 도형입니다. 이 도형의 둘레는 몇 cm인가요?",
    visual: fit({ label: "직각으로 꺾인 계단 모양 도형과 가로·세로 길이", polygons: [{ points: scr }], texts }),
    answer: 2 * (W + H),
    unit: "cm",
    hint: "계단의 가로 선분들을 아래로, 세로 선분들을 왼쪽으로 옮기면 어떤 도형이 되는지 생각해요.",
    explanation: `가로 선분의 합은 ${W} cm씩 두 번, 세로 선분의 합은 ${H} cm씩 두 번이므로 (${W} + ${H}) × 2 = ${2 * (W + H)}(cm)`,
    mistakes: { [W + H]: "둘레의 절반만 구했어요.", [W * H]: "넓이를 구했어요." },
  };
}));

/* ════════ 직사각형·정사각형의 넓이 ════════ */

const G = 18;
export const arRect = easy("l5-ar-rect", guard((rand) => {
  if (rand() < 0.35) {
    // 모눈 한 칸이 1 cm²인 직사각형: 1 cm²가 몇 개인지
    const a = randInt(rand, 3, 8);
    const b = randInt(rand, 2, 5);
    const pts: Pt[] = [[G, G], [(a + 1) * G, G], [(a + 1) * G, (b + 1) * G], [G, (b + 1) * G]];
    return {
      key: `grid:${a}:${b}`,
      prompt: "모눈 한 칸의 넓이는 1 cm²입니다. 색칠한 직사각형의 넓이는 몇 cm²인가요?",
      visual: { kind: "shape", width: (a + 2) * G, height: (b + 2) * G, label: "모눈 위의 색칠한 직사각형", grid: G, polygons: [{ points: pts, fill: true }] },
      answer: a * b,
      unit: "cm²",
      hint: "1 cm²가 가로로 몇 개, 세로로 몇 줄 있는지 세어 곱해요.",
      explanation: `1 cm²가 가로 ${a}개씩 ${b}줄 → ${a} × ${b} = ${a * b}(cm²)`,
      mistakes: { [2 * (a + b)]: "둘레를 구했어요." },
    };
  }
  const sq = rand() < 0.3;
  const a = randInt(rand, 3, 16);
  const b = sq ? a : randInt(rand, 3, 16);
  if (!sq && a === b) return null;
  const pts = scaled([[0, b], [0, 0], [a, 0], [a, b]]);
  const texts: Texts = [lengthText(pts[1], pts[2], pts, `${a} cm`)];
  if (!sq) texts.push(lengthText(pts[0], pts[1], pts, `${b} cm`));
  return {
    key: `${a}:${b}`,
    prompt: sq ? "정사각형의 넓이는 몇 cm²인가요?" : "직사각형의 넓이는 몇 cm²인가요?",
    visual: fit({ label: sq ? "한 변의 길이가 적힌 정사각형" : "가로·세로가 적힌 직사각형", polygons: [{ points: pts }], texts }),
    answer: a * b,
    unit: "cm²",
    hint: sq ? "(정사각형의 넓이) = (한 변) × (한 변)" : "(직사각형의 넓이) = (가로) × (세로)",
    explanation: `${a} × ${b} = ${a * b}(cm²)`,
    mistakes: { [sq ? 4 * a : 2 * (a + b)]: "둘레를 구했어요." },
  };
}));

export const rectReverse = mid("m5-rect-reverse", guard((rand) => {
  const a = randInt(rand, 3, 15);
  const b = randInt(rand, 3, 15);
  if (a === b) return null;
  const pts = scaled([[0, b], [0, 0], [a, 0], [a, b]]);
  const c: Pt = rp([(pts[0][0] + pts[2][0]) / 2, (pts[0][1] + pts[2][1]) / 2]);
  return {
    key: `${a}:${b}`,
    prompt: "직사각형의 넓이가 그림과 같을 때, □ 안에 알맞은 수를 구하세요.",
    visual: fit({ label: "넓이가 적힌 직사각형, 가로와 □", polygons: [{ points: pts }], texts: [lengthText(pts[1], pts[2], pts, `${a} cm`), lengthText(pts[0], pts[1], pts, "□ cm"), { at: c, text: `${a * b} cm²` }] }),
    answer: b,
    unit: "cm",
    hint: "(넓이) = (가로) × (세로)이므로 넓이를 가로로 나누어요.",
    explanation: `${a * b} ÷ ${a} = ${b}(cm)`,
  };
}));

/** 둘레와 가로·세로의 차로 넓이 구하기(넓이 차시의 심화) */
export const rectFromPerimeter = word("w5-rect-perimeter", (rand) => {
  const h = randInt(rand, 3, 15);
  const diff = randInt(rand, 1, 8);
  const w = h + diff;
  return {
    key: `${h}:${diff}`,
    prompt: `둘레가 ${2 * (w + h)} cm인 직사각형이 있습니다. 가로가 세로보다 ${diff} cm 더 길 때, 이 직사각형의 넓이는 몇 cm²인가요?`,
    answer: w * h,
    unit: "cm²",
    hint: `가로와 세로의 합은 둘레의 반인 ${w + h} cm예요.`,
    explanation: `가로 + 세로 = ${w + h}, 가로 − 세로 = ${diff} → 가로 ${w} cm, 세로 ${h} cm, 넓이 ${w} × ${h} = ${w * h}(cm²)`,
  };
});

/* ════════ 1 cm²보다 더 큰 넓이의 단위 ════════ */

/** 직사각형 그림(가로 a, 세로 b, 글자) */
function rectScene(a: number, b: number, ta: string, tb: string, label: string, inner?: string): ShapeScene {
  const pts = scaled([[0, b], [0, 0], [a, 0], [a, b]], 180, 110, 30);
  const texts: Texts = [lengthText(pts[1], pts[2], pts, ta), lengthText(pts[0], pts[1], pts, tb)];
  if (inner) texts.push({ at: rp([(pts[0][0] + pts[2][0]) / 2, (pts[0][1] + pts[2][1]) / 2]), text: inner });
  return fit({ label, polygons: [{ points: pts }], texts });
}

export const auRect = easy("l5-au-rect", guard((rand) => {
  const km = rand() < 0.4;
  const a = randInt(rand, 2, 12);
  const b = randInt(rand, 2, 9);
  if (a === b) return null;
  const u = km ? "km" : "m";
  return {
    key: `${km}:${a}:${b}`,
    prompt: `${km ? "직사각형 모양 땅" : "직사각형 모양 꽃밭"}의 넓이는 몇 ${u}²인가요?`,
    visual: rectScene(a, b, `${a} ${u}`, `${b} ${u}`, `가로 ${a} ${u}, 세로 ${b} ${u}인 직사각형`),
    answer: a * b,
    unit: `${u}²`,
    hint: `한 변이 1 ${u}인 정사각형의 넓이가 1 ${u}²예요. (가로) × (세로)로 구해요.`,
    explanation: `${a} × ${b} = ${a * b}(${u}²)`,
    mistakes: { [2 * (a + b)]: "둘레를 구했어요." },
  };
}));

export const auMixed = mid("l5-au-mixed", guard((rand) => {
  const a = randInt(rand, 2, 12);
  const b = randInt(rand, 2, 9);
  if (a === b) return null;
  return {
    key: `${a}:${b}`,
    prompt: "직사각형의 넓이는 몇 m²인가요?",
    visual: rectScene(a, b, `${a} m`, `${b * 100} cm`, "가로는 m, 세로는 cm로 적힌 직사각형"),
    answer: a * b,
    unit: "m²",
    hint: "단위를 m로 같게 맞춘 뒤 계산해요. 100 cm = 1 m",
    explanation: `${b * 100} cm = ${b} m, ${a} × ${b} = ${a * b}(m²)`,
    mistakes: { [a * b * 100]: "세로의 단위를 m로 바꾸지 않았어요." },
  };
}));

export const auTiles = word("l5-au-tiles", guard((rand) => {
  const c = pick(rand, [20, 25, 50]);
  const a = randInt(rand, 1, 6);
  const b = randInt(rand, 1, 4);
  if (a === b) return null;
  const n = ((a * 100) / c) * ((b * 100) / c);
  const pts = scaled([[0, b], [0, 0], [a, 0], [a, b]], 180, 100, 40);
  const t = Math.min(16, (pts[2][0] - pts[1][0]) / ((a * 100) / c));
  const tile: Pt[] = [pts[0], add(pts[0], [t, 0]), add(pts[0], [t, t]), add(pts[0], [0, t])];
  return {
    key: `${c}:${a}:${b}`,
    prompt: `직사각형 모양 벽에 한 변이 ${c} cm인 정사각형 타일을 빈틈없이 겹치지 않게 붙이려고 합니다. 타일은 모두 몇 장 필요한가요?`,
    visual: fit({ label: "직사각형 모양 벽과 왼쪽 위에 붙인 타일 한 장", polygons: [{ points: pts }, { points: tile, fill: true }], texts: [lengthText(pts[1], pts[2], pts, `${a} m`), lengthText(pts[0], pts[1], pts, `${b} m`)] }),
    answer: n,
    unit: "장",
    hint: "1 m = 100 cm예요. 가로와 세로에 타일이 각각 몇 장씩 놓이는지 먼저 구해요.",
    explanation: `가로 ${a * 100} ÷ ${c} = ${(a * 100) / c}(장), 세로 ${b * 100} ÷ ${c} = ${(b * 100) / c}(장) → ${(a * 100) / c} × ${(b * 100) / c} = ${n}(장)`,
  };
}));

export const auFarm = word("l5-au-farm", guard((rand) => {
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, 2, 9);
  const c = randInt(rand, 2, 9);
  const d = randInt(rand, 2, 9);
  if (a * b === c * d || a === b || c === d) return null;
  const k = 14;
  const A = toScreen([[0, b], [0, 0], [a, 0], [a, b]], k);
  const B = toScreen([[0, d], [0, 0], [c, 0], [c, d]], k).map((p) => add(p, [a * k + 70, 0]));
  return {
    key: `${a}:${b}:${c}:${d}`,
    prompt: "직사각형 모양의 가 농장과 나 농장이 있습니다. 어느 농장이 몇 km² 더 넓은지 구하려고 합니다. 두 농장의 넓이의 차는 몇 km²인가요?",
    visual: fit({
      label: "가 농장(km로 적힘)과 나 농장(m로 적힘)",
      polygons: [{ points: A }, { points: B }],
      texts: [
        lengthText(A[1], A[2], A, `${a} km`),
        lengthText(A[0], A[1], A, `${b} km`),
        lengthText(B[1], B[2], B, `${c * 1000} m`),
        lengthText(B[0], B[1], B, `${d * 1000} m`),
        { at: rp([(A[0][0] + A[2][0]) / 2, (A[0][1] + A[2][1]) / 2]), text: "가" },
        { at: rp([(B[0][0] + B[2][0]) / 2, (B[0][1] + B[2][1]) / 2]), text: "나" },
      ],
    }),
    answer: Math.abs(a * b - c * d),
    unit: "km²",
    hint: "1000 m = 1 km예요. 단위를 같게 맞춘 뒤 넓이를 비교해요.",
    explanation: `가 ${a} × ${b} = ${a * b}(km²), 나 ${c} × ${d} = ${c * d}(km²) → ${a * b > c * d ? "가" : "나"} 농장이 ${Math.abs(a * b - c * d)} km² 더 넓어요.`,
  };
}));

/* ════════ 평행사변형·삼각형·마름모·사다리꼴의 넓이 ════════ */

/** 빗변이 자연수가 되는 (높이, 옆으로 비킨 길이, 옆변) */
const TRIPLES: [number, number, number][] = [[4, 3, 5], [3, 4, 5], [8, 6, 10], [6, 8, 10], [12, 5, 13], [5, 12, 13], [12, 9, 15], [9, 12, 15], [8, 15, 17]];

/** 높이 점선과 직각 표시, 높이 글자(점선의 도형 안쪽 편 — 중심 toward에 가까운 쪽) */
function heightMark(top: Pt, foot: Pt, baseDir: Pt, text: string | null, toward: Pt): { lines: Lines; texts: Texts } {
  const lines: Lines = [{ from: top, to: foot, dashed: true, width: 1.5 }, ...rightMark(foot, top, add(foot, baseDir), 7)];
  if (!text) return { lines, texts: [] };
  const [l, r] = [segText(top, foot, text, 1), segText(top, foot, text, -1)];
  const d = (t: Texts[number]) => Math.hypot(t.at[0] - toward[0], t.at[1] - toward[1]);
  return { lines, texts: [d(l) <= d(r) ? l : r] };
}
const center = (pts: Pt[]): Pt => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];

/** 평행사변형 ㄱㄴㄷㄹ(밑변 b, 높이 h, 옆으로 비킨 길이 o): 수학 좌표 */
const paraMath = (b: number, h: number, o: number): Pt[] => [[o, h], [0, 0], [b, 0], [b + o, h]];

export const arPara = easy("l5-ar-para", guard((rand) => {
  const [h, o, s] = pick(rand, TRIPLES.filter((t) => t[0] <= 12));
  const b = randInt(rand, Math.max(o + 2, 5), 18);
  const pts = scaled(paraMath(b, h, o));
  const foot: Pt = [pts[0][0], pts[1][1]];
  const hm = heightMark(pts[0], foot, [1, 0], `${h} cm`, center(pts));
  return {
    key: `${b}:${h}:${o}`,
    prompt: "평행사변형의 넓이는 몇 cm²인가요?",
    visual: fit({ label: "밑변, 옆변, 높이(점선)가 적힌 평행사변형", polygons: [{ points: pts }], lines: hm.lines, texts: [lengthText(pts[1], pts[2], pts, `${b} cm`), lengthText(pts[0], pts[1], pts, `${s} cm`), ...hm.texts] }),
    answer: b * h,
    unit: "cm²",
    hint: "(평행사변형의 넓이) = (밑변) × (높이). 높이는 밑변과 수직인 점선의 길이예요.",
    explanation: `${b} × ${h} = ${b * h}(cm²)`,
    mistakes: { [b * s]: "높이가 아닌 옆변의 길이를 곱했어요.", [2 * (b + s)]: "둘레를 구했어요." },
  };
}));

export const arParaHeight = mid("l5-ar-para-height", guard((rand) => {
  const b = randInt(rand, 4, 16);
  const h = randInt(rand, 3, 10);
  const o = randInt(rand, 2, 4);
  const askBase = rand() < 0.5;
  const pts = scaled(paraMath(b, h, o));
  const foot: Pt = [pts[0][0], pts[1][1]];
  const hm = heightMark(pts[0], foot, [1, 0], askBase ? `${h} cm` : "□ cm", center(pts));
  return {
    key: `${b}:${h}:${askBase}`,
    prompt: `넓이가 ${b * h} cm²인 평행사변형입니다. □ 안에 알맞은 수를 구하세요.`,
    visual: fit({ label: "넓이를 아는 평행사변형, 밑변 또는 높이가 □", polygons: [{ points: pts }], lines: hm.lines, texts: [lengthText(pts[1], pts[2], pts, askBase ? "□ cm" : `${b} cm`), ...hm.texts] }),
    answer: askBase ? b : h,
    unit: "cm",
    hint: "(평행사변형의 넓이) = (밑변) × (높이)를 거꾸로 생각해요.",
    explanation: askBase ? `${b * h} ÷ ${h} = ${b}(cm)` : `${b * h} ÷ ${b} = ${h}(cm)`,
  };
}));

/** 모눈 위 평행사변형(또는 삼각형) 4개 중 넓이가 다른 것: 셋은 밑변·높이가 같고 하나만 다르다 */
function sameAreaGrid(id: string, shape: "평행사변형" | "삼각형") {
  return mid(id, guard((rand) => {
    const b = randInt(rand, 2, 4);
    const h = randInt(rand, 2, 4);
    const at = randInt(rand, 0, 3);
    const odd = pick(rand, ["base", "height"] as const);
    const C = 18;
    const slot = b + 6;
    const rowH = h + 3;
    const polygons: NonNullable<ShapeScene["polygons"]> = [];
    const texts: Texts = [];
    // 평행사변형은 직사각형이 되지 않게(옆으로 비킨 칸이 0이 아니게)
    const offs = shuffle(rand, shape === "평행사변형" ? [-2, -1, 1, 2, 3] : [-2, -1, 0, 1, 2, 3]).slice(0, 4);
    for (let i = 0; i < 4; i++) {
      const bb = i === at && odd === "base" ? b + 1 : b;
      const hh = i === at && odd === "height" ? h - 1 : h;
      const x0 = (i % 2) * slot + 3;
      const y0 = Math.floor(i / 2) * rowH + 1 + (h - hh);
      const o = offs[i];
      const pts: Pt[] =
        shape === "평행사변형"
          ? [[x0 + Math.max(0, o), y0], [x0 + Math.max(0, o) + bb, y0], [x0 + Math.max(0, -o) + bb, y0 + hh], [x0 + Math.max(0, -o), y0 + hh]]
          : [[x0 + Math.max(0, -o) + Math.max(0, Math.min(bb, o + 1)), y0], [x0 + bb + 1, y0 + hh], [x0 + 1, y0 + hh]];
      polygons.push({ points: pts.map(([x, y]): Pt => [x * C, (y + 1) * C]) });
      texts.push({ at: [((i % 2) * slot + 1) * C, (Math.floor(i / 2) * rowH + 1) * C], text: MARKS[i] });
    }
    const width = (2 * slot + 2) * C;
    return {
      key: `${shape}:${b}:${h}:${at}:${odd}:${offs.join()}`,
      prompt: `모눈 위에 ${shape} 4개를 그렸습니다. 넓이가 다른 하나를 고르세요.`,
      visual: { kind: "shape", width, height: 2 * rowH * C + C, label: `모눈 위의 ${shape} ①~④`, grid: C, polygons, texts },
      answer: MARKS[at],
      choices: [...MARKS],
      hint: `모양이 달라도 밑변의 길이와 높이가 같으면 넓이가 같아요. 각 ${shape}의 밑변과 높이를 모눈 칸으로 세어 보세요.`,
      explanation: `${MARKS[at]}만 ${odd === "base" ? "밑변이" : "높이가"} 달라 넓이가 달라요. 나머지는 밑변 ${b}칸, 높이 ${h}칸으로 같아 넓이가 같아요.`,
    };
  }));
}

export const arParaSame = sameAreaGrid("l5-ar-para-same", "평행사변형");
export const arTriPick = sameAreaGrid("l5-ar-tri-pick", "삼각형");

export const arRoad = word("l5-ar-road", guard((rand) => {
  const W = randInt(rand, 10, 24);
  const H = randInt(rand, 6, 14);
  const r = randInt(rand, 1, 3);
  const o = randInt(rand, 2, 4);
  const x = randInt(rand, 2, W - r - o - 2);
  if (x < 1) return null;
  const k = Math.min(10, 200 / W, 120 / H);
  const field = toScreen([[0, H], [0, 0], [W, 0], [W, H]], k);
  const road = toScreen([[x + o, H], [x, 0], [x + r, 0], [x + r + o, H]], k);
  return {
    key: `${W}:${H}:${r}:${x}:${o}`,
    prompt: "직사각형 모양의 밭에 평행사변형 모양의 길(색칠한 부분)을 냈습니다. 길을 뺀 밭의 넓이는 몇 m²인가요?",
    visual: fit({
      label: "직사각형 밭과 위에서 아래로 비스듬히 난 평행사변형 모양의 길",
      polygons: [{ points: field }, { points: road, fill: true }],
      texts: [lengthText(field[1], field[2], field, `${W} m`), lengthText(field[0], field[1], field, `${H} m`), { at: rp([(road[1][0] + road[2][0]) / 2, road[1][1] + 14]), text: `${r} m` }],
    }),
    answer: (W - r) * H,
    unit: "m²",
    hint: "길은 밑변이 길의 폭이고, 높이가 밭의 세로와 같은 평행사변형이에요.",
    explanation: `밭 ${W} × ${H} = ${W * H}(m²), 길 ${r} × ${H} = ${r * H}(m²) → ${W * H} − ${r * H} = ${(W - r) * H}(m²)`,
    mistakes: { [W * H]: "길의 넓이를 빼지 않았어요." },
  };
}));

export const areaToHeight = word("w5-area-height", guard((rand) => {
  const base = randInt(rand, 4, 16);
  const h = randInt(rand, 3, 10);
  const o = randInt(rand, 2, 4);
  const other = randInt(rand, 3, 12);
  if (other === base) return null;
  // 두 평행사변형의 넓이가 같다: 가(밑변 base, 높이 h)와 나(밑변 other·높이 □) — 나의 넓이가 자연수가 되게
  if ((base * h) % other !== 0) return null;
  const h2 = (base * h) / other;
  if (h2 > 16 || h2 === h) return null;
  return {
    key: `${base}:${h}:${other}:${o}`,
    prompt: `밑변이 ${base} cm, 높이가 ${h} cm인 평행사변형과 넓이가 같은 평행사변형을 그리려고 합니다. 밑변을 ${other} cm로 하면 높이는 몇 cm로 해야 하나요?`,
    answer: h2,
    unit: "cm",
    hint: "먼저 처음 평행사변형의 넓이를 구해요. (넓이) ÷ (밑변) = (높이)",
    explanation: `넓이 ${base} × ${h} = ${base * h}(cm²), 높이 ${base * h} ÷ ${other} = ${h2}(cm)`,
  };
}));

/** 삼각형 ㄱㄴㄷ(밑변 ㄴㄷ = b, 꼭짓점 ㄱ의 가로 위치 x, 높이 h) */
export const arTri = easy("l5-ar-tri", guard((rand) => {
  const b = randInt(rand, 2, 9) * 2;
  const h = randInt(rand, 3, 12);
  const obtuse = rand() < 0.3;
  const x = obtuse ? b + randInt(rand, 2, 4) : randInt(rand, 1, b - 1);
  const pts = scaled([[x, h], [0, 0], [b, 0]], 180, 120);
  const foot: Pt = [pts[0][0], pts[1][1]];
  const hm = heightMark(pts[0], foot, [-1, 0], `${h} cm`, center(pts));
  const lines: Lines = [...hm.lines];
  if (obtuse) lines.push({ from: pts[2], to: foot, dashed: true, width: 1.5 });
  return {
    key: `${b}:${h}:${x}`,
    prompt: "삼각형의 넓이는 몇 cm²인가요?",
    visual: fit({ label: obtuse ? "밑변과 삼각형 밖으로 그은 높이(점선)가 적힌 둔각삼각형" : "밑변과 높이(점선)가 적힌 삼각형", polygons: [{ points: pts }], lines, texts: [lengthText(pts[1], pts[2], pts, `${b} cm`), ...hm.texts] }),
    answer: (b * h) / 2,
    unit: "cm²",
    hint: "(삼각형의 넓이) = (밑변) × (높이) ÷ 2. 높이는 밑변과 수직인 점선의 길이예요.",
    explanation: `${b} × ${h} ÷ 2 = ${(b * h) / 2}(cm²)`,
    mistakes: { [b * h]: "2로 나누지 않았어요." },
  };
}));

export const arTriBase = mid("l5-ar-tri-base", guard((rand) => {
  const b = randInt(rand, 3, 16);
  const h = randInt(rand, 3, 12);
  if ((b * h) % 2) return null;
  const askBase = rand() < 0.5;
  const x = randInt(rand, 1, b - 1);
  const pts = scaled([[x, h], [0, 0], [b, 0]], 180, 120);
  const foot: Pt = [pts[0][0], pts[1][1]];
  const hm = heightMark(pts[0], foot, [-1, 0], askBase ? `${h} cm` : "□ cm", center(pts));
  return {
    key: `${b}:${h}:${askBase}`,
    prompt: `넓이가 ${(b * h) / 2} cm²인 삼각형입니다. □ 안에 알맞은 수를 구하세요.`,
    visual: fit({ label: "넓이를 아는 삼각형, 밑변 또는 높이가 □", polygons: [{ points: pts }], lines: hm.lines, texts: [lengthText(pts[1], pts[2], pts, askBase ? "□ cm" : `${b} cm`), ...hm.texts] }),
    answer: askBase ? b : h,
    unit: "cm",
    hint: "(밑변) × (높이) = (넓이) × 2",
    explanation: askBase ? `${(b * h) / 2} × 2 ÷ ${h} = ${b}(cm)` : `${(b * h) / 2} × 2 ÷ ${b} = ${h}(cm)`,
    mistakes: { [askBase ? b / 2 : h / 2]: "넓이에 2를 곱하지 않았어요." },
  };
}));

/** 선분 ab 옆, 점 p 쪽에 글자. a에서 t만큼 간 자리(도형 안쪽이 넓은 곳) */
function besideAt(a: Pt, b: Pt, p: Pt, t: number, text: string): Texts[number] {
  const m: Pt = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const r = segText(a, b, text, 1);
  const shift: Pt = [r.at[0] - (a[0] + b[0]) / 2, r.at[1] - (a[1] + b[1]) / 2];
  const cand: Pt[] = [[m[0] + shift[0], m[1] + shift[1]], [m[0] - shift[0], m[1] - shift[1]]];
  const d = (q: Pt) => Math.hypot(q[0] - p[0], q[1] - p[1]);
  return { at: rp(d(cand[0]) <= d(cand[1]) ? cand[0] : cand[1]), text };
}

/** 둔각삼각형에서 두 밑변과 두 높이: 변 ㄴㄷ과 높이 ha, 변 ㄱㄷ과 높이 □ */
export const arTriOther = word("l5-ar-tri-other", guard((rand) => {
  const a = randInt(rand, 4, 30);
  const [ha, o, bLen] = pick(rand, [...TRIPLES, [16, 12, 20], [12, 16, 20], [15, 8, 17], [20, 15, 25], [15, 20, 25], [24, 7, 25], [10, 24, 26]] as [number, number, number][]);
  // 꼭짓점 ㄱ = (a + o, ha): 변 ㄱㄷ = bLen, 높이는 변 ㄴㄷ의 연장선 위로 떨어진다.
  // 밑변 ㄴㄷ과 변 ㄱㄷ의 길이가 같으면 □(다른 높이)가 이미 적힌 높이와 같아져 답이 드러난다
  if ((a * ha) % bLen !== 0 || o > a || a === bLen) return null;
  const hb = (a * ha) / bLen;
  const math: Pt[] = [[a + o, ha], [0, 0], [a, 0]];
  const pts = scaled(math, 220, 140, 40);
  const [G, N, D] = pts;
  const footA: Pt = [G[0], N[1]];
  // 점 ㄴ에서 변 ㄱㄷ(직선)에 내린 수선의 발
  const dir: Pt = [G[0] - D[0], G[1] - D[1]];
  const t = ((N[0] - D[0]) * dir[0] + (N[1] - D[1]) * dir[1]) / (dir[0] ** 2 + dir[1] ** 2);
  const footB: Pt = rp([D[0] + dir[0] * t, D[1] + dir[1] * t]);
  const lines: Lines = [
    { from: D, to: footA, dashed: true, width: 1.5 },
    { from: G, to: footA, dashed: true, width: 1.5 },
    ...rightMark(footA, G, D, 7),
    { from: N, to: footB, dashed: true, width: 1.5 },
    ...rightMark(footB, N, D, 7),
  ];
  if (t < 0) lines.push({ from: D, to: footB, dashed: true, width: 1.5 });
  const texts: Texts = [...vertexTexts(pts, ["ㄱ", "ㄴ", "ㄷ"], 12), lengthText(N, D, pts, `${a} cm`), besideAt(G, D, N, 0.7, `${bLen} cm`), segText(G, footA, `${ha} cm`, -1), segText(N, footB, "□ cm", 1)];
  return {
    key: `${a}:${ha}:${o}`,
    prompt: "삼각형 ㄱㄴㄷ에서 □ 안에 알맞은 수를 구하세요.",
    visual: fit({ label: "둔각삼각형 ㄱㄴㄷ과 두 밑변에 대한 높이(점선)", polygons: [{ points: pts }], lines, texts }),
    answer: hb,
    unit: "cm",
    hint: "밑변을 바꾸어도 삼각형의 넓이는 같아요. 먼저 변 ㄴㄷ을 밑변으로 하여 넓이를 구해요.",
    explanation: `넓이 ${a} × ${ha} ÷ 2 = ${(a * ha) / 2}(cm²), 변 ㄱㄷ을 밑변으로 하면 높이는 ${(a * ha) / 2} × 2 ÷ ${bLen} = ${hb}(cm)`,
    mistakes: { [(a * ha) / 2 / bLen]: "넓이에 2를 곱해야 해요." },
  };
}));

/** 마름모(두 대각선 p, q): 대각선 점선과 길이 */
function rhombusScene(p: number, q: number, tp: string, tq: string, label: string): ShapeScene {
  const pts = scaled([[0, q / 2], [p / 2, 0], [p, q / 2], [p / 2, q]], 200, 150, 16);
  const [L, B, R, T] = pts;
  const c: Pt = [(L[0] + R[0]) / 2, L[1]];
  return fit({
    label,
    polygons: [{ points: pts }],
    lines: [{ from: L, to: R, dashed: true, width: 1.5 }, { from: T, to: B, dashed: true, width: 1.5 }, ...rightMark(c, R, T, 6)],
    // 대각선 글자는 도형 가운데 쪽(변에서 먼 곳)에
    texts: [{ at: rp([c[0] - 6 - (tp.length * 8) / 2, c[1] - 12]), text: tp }, { at: rp([c[0] + 6 + (tq.length * 8) / 2 + 3, c[1] + 15]), text: tq }],
  });
}

/** 사다리꼴(윗변 a, 아랫변 c, 높이 h, 윗변 왼쪽 끝이 아랫변에서 o만큼 안쪽) */
function trapScene(a: number, c: number, h: number, o: number, ta: string, tc: string, th: string, label: string): ShapeScene {
  const pts = scaled([[o, h], [0, 0], [c, 0], [o + a, h]], 190, 120);
  const foot: Pt = [pts[0][0], pts[1][1]];
  const hm = heightMark(pts[0], foot, [1, 0], th, center(pts));
  return fit({ label, polygons: [{ points: pts }], lines: hm.lines, texts: [lengthText(pts[0], pts[3], pts, ta), lengthText(pts[1], pts[2], pts, tc), ...hm.texts] });
}

export const arRT = easy("l5-ar-rt", guard((rand) => {
  if (rand() < 0.5) {
    const p = randInt(rand, 4, 16);
    const q = randInt(rand, 4, 14);
    if ((p * q) % 2 || p === q) return null;
    return {
      key: `r:${p}:${q}`,
      prompt: "마름모의 넓이는 몇 cm²인가요?",
      visual: rhombusScene(p, q, `${p} cm`, `${q} cm`, "두 대각선의 길이가 적힌 마름모"),
      answer: (p * q) / 2,
      unit: "cm²",
      hint: "(마름모의 넓이) = (한 대각선) × (다른 대각선) ÷ 2",
      explanation: `${p} × ${q} ÷ 2 = ${(p * q) / 2}(cm²)`,
      mistakes: { [p * q]: "2로 나누지 않았어요." },
    };
  }
  const a = randInt(rand, 3, 10);
  const c = a + randInt(rand, 2, 8);
  const h = randInt(rand, 3, 10);
  if (((a + c) * h) % 2) return null;
  const o = randInt(rand, 0, c - a);
  return {
    key: `t:${a}:${c}:${h}:${o}`,
    prompt: "사다리꼴의 넓이는 몇 cm²인가요?",
    visual: trapScene(a, c, h, o, `${a} cm`, `${c} cm`, `${h} cm`, "윗변, 아랫변, 높이(점선)가 적힌 사다리꼴"),
    answer: ((a + c) * h) / 2,
    unit: "cm²",
    hint: "(사다리꼴의 넓이) = ((윗변) + (아랫변)) × (높이) ÷ 2",
    explanation: `(${a} + ${c}) × ${h} ÷ 2 = ${((a + c) * h) / 2}(cm²)`,
    mistakes: { [(a + c) * h]: "2로 나누지 않았어요." },
  };
}));

export const arRhomDiag = mid("l5-ar-rhom-diag", guard((rand) => {
  const p = randInt(rand, 4, 16);
  const q = randInt(rand, 4, 14);
  if ((p * q) % 2 || p === q) return null;
  return {
    key: `${p}:${q}`,
    prompt: `넓이가 ${(p * q) / 2} cm²인 마름모입니다. □ 안에 알맞은 수를 구하세요.`,
    visual: rhombusScene(p, q, `${p} cm`, "□ cm", "넓이를 아는 마름모, 한 대각선이 □"),
    answer: q,
    unit: "cm",
    hint: "(한 대각선) × (다른 대각선) = (넓이) × 2",
    explanation: `${(p * q) / 2} × 2 ÷ ${p} = ${q}(cm)`,
    mistakes: { [q / 2]: "넓이에 2를 곱하지 않았어요." },
  };
}));

export const arTrapHeight = mid("l5-ar-trap-height", guard((rand) => {
  const a = randInt(rand, 2, 10);
  const c = a + randInt(rand, 2, 8);
  const h = randInt(rand, 3, 12);
  if (((a + c) * h) % 2) return null;
  const o = randInt(rand, 0, c - a);
  return {
    key: `${a}:${c}:${h}:${o}`,
    prompt: `넓이가 ${((a + c) * h) / 2} cm²인 사다리꼴입니다. □ 안에 알맞은 수를 구하세요.`,
    visual: trapScene(a, c, h, o, `${a} cm`, `${c} cm`, "□ cm", "넓이를 아는 사다리꼴, 높이가 □"),
    answer: h,
    unit: "cm",
    hint: "((윗변) + (아랫변)) × (높이) = (넓이) × 2",
    explanation: `${((a + c) * h) / 2} × 2 ÷ (${a} + ${c}) = ${h}(cm)`,
  };
}));

/** 윗변 구하기: 넓이·아랫변·높이로 (trap-height와 다른 수 범위) */
export const arTrapTop = word("l5-ar-trap-top", guard((rand) => {
  const a = randInt(rand, 3, 14);
  const c = a + randInt(rand, 3, 9);
  const h = randInt(rand, 4, 14) ;
  if (((a + c) * h) % 2 || h % 2) return null;
  const o = randInt(rand, 0, c - a);
  return {
    key: `${a}:${c}:${h}:${o}`,
    prompt: `넓이가 ${((a + c) * h) / 2} cm²인 사다리꼴입니다. 윗변은 몇 cm인가요?`,
    visual: trapScene(a, c, h, o, "□ cm", `${c} cm`, `${h} cm`, "넓이를 아는 사다리꼴, 윗변이 □"),
    answer: a,
    unit: "cm",
    hint: "먼저 (윗변) + (아랫변)을 구해요. ((윗변) + (아랫변)) = (넓이) × 2 ÷ (높이)",
    explanation: `(윗변) + (아랫변) = ${((a + c) * h) / 2} × 2 ÷ ${h} = ${a + c}, 윗변 = ${a + c} − ${c} = ${a}(cm)`,
    mistakes: { [a + c]: "아랫변의 길이를 빼지 않았어요." },
  };
}));

export const arRhomRect = word("l5-ar-rhom-rect", guard((rand) => {
  const a = randInt(rand, 3, 10) * 2;
  const b = randInt(rand, 2, 8) * 2;
  if (a === b) return null;
  const R = scaled([[0, b], [0, 0], [a, 0], [a, b]], 180, 110);
  const m = R.map((p, i): Pt => rp([(p[0] + R[(i + 1) % 4][0]) / 2, (p[1] + R[(i + 1) % 4][1]) / 2]));
  return {
    key: `${a}:${b}`,
    prompt: `그림과 같이 둘레가 ${2 * (a + b)} cm인 직사각형의 네 변의 가운데 점을 차례로 이어 마름모를 그렸습니다. 마름모의 넓이는 몇 cm²인가요?`,
    visual: fit({ label: "직사각형과 네 변의 가운데 점을 이은 마름모", polygons: [{ points: R }, { points: m, fill: true }], texts: [lengthText(R[1], R[2], R, `${a} cm`)] }),
    answer: (a * b) / 2,
    unit: "cm²",
    hint: "마름모의 두 대각선의 길이는 직사각형의 가로, 세로와 같아요. 먼저 세로를 구해요.",
    explanation: `세로 ${a + b} − ${a} = ${b}(cm), 마름모 넓이 ${a} × ${b} ÷ 2 = ${(a * b) / 2}(cm²)`,
    mistakes: { [a * b]: "직사각형의 넓이를 구했어요." },
  };
}));

