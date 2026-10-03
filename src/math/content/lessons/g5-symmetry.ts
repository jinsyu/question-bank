import { pick, randInt, shuffle } from "../../lib/random";
import type { ShapeScene } from "../types";
import { strokeHitTexts, textBox, textsClash } from "../figure-check";
import { mid, word } from "../words/word";
import { easy } from "./g5";
import { interiorAngles } from "./g5-congruence";
import { KO, MARKS, add, angleMark, dist, figureOk, fit, guard, inside, lengthText, mid2, mul, regularPolygon, rightMark, rp, segText, sub, toScreen, unit, vertexTexts, type Lines, type Pt, type Texts } from "./g5-figure";
import { jq } from "./g5-text";

/**
 * 5-2 선대칭도형·점대칭도형: 교과서처럼 도형 그림에서 대칭축·대칭의 중심을 찾고,
 * 대응점·대응변·대응각을 그림으로 확인한다. 각은 5° 단위로 만들고 그림도 그 각대로 그린다.
 */

const rad = (d: number) => (d * Math.PI) / 180;

/** 점대칭·선대칭 판별용 도형(수학 좌표, 위쪽 +y). axes: 대칭축의 수, point: 점대칭도형인지 */
type Named = { name: string; pts: Pt[]; axes: number; point: boolean };
const LIBRARY: Named[] = [
  { name: "평행사변형", pts: [[0, 0], [5, 0], [7, 3], [2, 3]], axes: 0, point: true },
  { name: "직사각형", pts: [[0, 0], [6, 0], [6, 3.5], [0, 3.5]], axes: 2, point: true },
  { name: "마름모", pts: [[0, 2.2], [3.2, 0], [6.4, 2.2], [3.2, 4.4]], axes: 2, point: true },
  { name: "정사각형", pts: [[0, 0], [4, 0], [4, 4], [0, 4]], axes: 4, point: true },
  { name: "정육각형", pts: regularPolygon(6, 2.6, [0, 0], 0), axes: 6, point: true },
  { name: "번개 모양", pts: [[0, 0], [4, 0], [4, 2], [6, 2], [6, 4], [2, 4], [2, 2], [0, 2]], axes: 0, point: true },
  { name: "긴 육각형", pts: [[0, 1.5], [1.5, 0], [5, 0], [6.5, 1.5], [5, 3], [1.5, 3]], axes: 2, point: true },
  { name: "정삼각형", pts: regularPolygon(3, 3, [0, 0], 90), axes: 3, point: false },
  { name: "이등변삼각형", pts: [[0, 0], [4, 0], [2, 5]], axes: 1, point: false },
  { name: "정오각형", pts: regularPolygon(5, 2.8, [0, 0], 90), axes: 5, point: false },
  { name: "사다리꼴", pts: [[0, 0], [6, 0], [4.5, 3], [1.5, 3]], axes: 1, point: false },
  { name: "연 모양", pts: [[2.5, 0], [5, 4], [2.5, 5.5], [0, 4]], axes: 1, point: false },
  { name: "ㄱ자 모양", pts: [[0, 0], [2, 0], [2, 3], [5, 3], [5, 5], [0, 5]], axes: 1, point: false },
  { name: "화살표 모양", pts: [[1, 0], [3, 0], [3, 3], [4.5, 3], [2, 6], [-0.5, 3], [1, 3]], axes: 1, point: false },
];

/** 도형들을 2×2로 늘어놓은 그림(칸마다 번호) */
function fourShapes(shapes: Pt[][], label: string): ShapeScene {
  const cell = 104;
  const polygons: NonNullable<ShapeScene["polygons"]> = [];
  const texts: Texts = [];
  shapes.forEach((s, i) => {
    const xs = s.map((p) => p[0]);
    const ys = s.map((p) => p[1]);
    const k = Math.min(76 / (Math.max(...xs) - Math.min(...xs)), 64 / (Math.max(...ys) - Math.min(...ys)), 16);
    const [cx, cy] = [(Math.max(...xs) + Math.min(...xs)) / 2, (Math.max(...ys) + Math.min(...ys)) / 2];
    const [ox, oy] = [(i % 2) * cell + cell / 2 + 6, Math.floor(i / 2) * cell + cell / 2 + 10];
    polygons.push({ points: s.map(([x, y]): Pt => rp([ox + (x - cx) * k, oy - (y - cy) * k])) });
    texts.push({ at: [(i % 2) * cell + 12, Math.floor(i / 2) * cell + 14], text: MARKS[i] });
  });
  return { kind: "shape", width: 2 * cell + 12, height: 2 * cell + 12, label, polygons, texts };
}

/** 모양을 조금 돌려 놓는다(판별이 모양 이름에 기대지 않게) */
const turn = (pts: Pt[], deg: number): Pt[] => pts.map(([x, y]) => [x * Math.cos(rad(deg)) - y * Math.sin(rad(deg)), x * Math.sin(rad(deg)) + y * Math.cos(rad(deg))]);

export const pointSymPick = easy("e5-point-sym-pick", (rand) => {
  const yes = pick(rand, LIBRARY.filter((s) => s.point));
  const no = shuffle(rand, LIBRARY.filter((s) => !s.point)).slice(0, 3);
  const at = randInt(rand, 0, 3);
  const list = [...no];
  list.splice(at, 0, yes);
  return {
    key: `${list.map((s) => s.name).join()}`,
    prompt: "점대칭도형을 고르세요.",
    visual: fourShapes(list.map((s) => turn(s.pts, pick(rand, [0, 0, 90]))), "도형 ①~④"),
    answer: MARKS[at],
    choices: [...MARKS],
    hint: "어떤 점을 중심으로 180° 돌렸을 때 처음 도형과 완전히 겹치는 도형을 찾아요.",
    explanation: `${MARKS[at]}(${jq(yes.name, "은/는")}) 가운데 점을 중심으로 180° 돌리면 처음 도형과 완전히 겹쳐요. ${jq(no.map((s) => s.name).join(", "), "은/는")} 180° 돌리면 겹치지 않아요.`,
  };
});

/** 수학 좌표 도형을 가로 maxW, 세로 maxH 안에 들어가게 화면 좌표로 */
function screenOf(pts: Pt[], maxW: number, maxH: number): Pt[] {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const k = Math.min(maxW / (Math.max(...xs) - Math.min(...xs)), maxH / (Math.max(...ys) - Math.min(...ys)));
  return toScreen(pts.map(([x, y]): Pt => [x - Math.min(...xs), y - Math.min(...ys)]), k);
}

/** 대칭축이 하나뿐인 선대칭도형(세로축 x = 0에 대칭) */
const ONE_AXIS: Pt[][] = [
  [[-3, 0], [3, 0], [0, 5]],
  [[0, 6], [-3, 4], [0, 0], [3, 4]],
  [[-4, 0], [4, 0], [2, 3.5], [-2, 3.5]],
  [[-3, 0], [3, 0], [3, 3], [0, 5.5], [-3, 3]],
  [[-1, 0], [1, 0], [1, 3], [3, 3], [0, 6], [-3, 3], [-1, 3]],
  [[-3, 0], [3, 0], [3, 2], [1, 2], [1, 5], [-1, 5], [-1, 2], [-3, 2]],
];

/** 선 가~라 중 대칭축 고르기 */
export const symLinePick = easy("l5-sym-line-pick", guard((rand) => {
  const base = pick(rand, ONE_AXIS);
  const sideways = rand() < 0.4;
  const shape = sideways ? base.map(([x, y]): Pt => [y, -x]) : base;
  const pts = screenOf(shape, 130, 120).map((p) => add(p, [60, 40]));
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const c: Pt = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  const axisDir: Pt = sideways ? [1, 0] : [0, 1];
  const perp: Pt = sideways ? [0, 1] : [1, 0];
  const off = sideways ? (Math.max(...ys) - Math.min(...ys)) / 4 : (Math.max(...xs) - Math.min(...xs)) / 4;
  const reach = 88;
  const lineOf = (p: Pt, d: Pt): [Pt, Pt] => [rp(add(p, mul(d, -reach))), rp(add(p, mul(d, reach)))];
  const cands: [Pt, Pt][] = [
    lineOf(c, axisDir),
    lineOf(add(c, mul(perp, off)), axisDir),
    lineOf(c, perp),
    lineOf(c, unit([1, 1])),
  ];
  const names = ["가", "나", "다", "라"];
  const order = shuffle(rand, [0, 1, 2, 3]);
  const lines: Lines = order.map((o) => ({ from: cands[o][0], to: cands[o][1], width: 1.5, dashed: true }));
  // 이름은 선의 한쪽 끝 바깥에
  const texts: Texts = order.map((o, i) => {
    const [a, b] = cands[o];
    const end = a[1] < b[1] - 1 || (Math.abs(a[1] - b[1]) <= 1 && a[0] > b[0]) ? a : b;
    return { at: rp(add(end, mul(unit(sub(end, c)), 10))), text: names[i] };
  });
  const ans = names[order.indexOf(0)];
  return {
    key: `${ONE_AXIS.indexOf(base)}:${sideways}:${order.join()}`,
    prompt: "선대칭도형입니다. 대칭축인 직선을 고르세요.",
    visual: fit({ label: "선대칭도형과 점선 가~라", polygons: [{ points: pts }], lines, texts }),
    answer: ans,
    choices: names,
    hint: "그 직선을 따라 접었을 때 도형이 완전히 겹치는지 생각해요.",
    explanation: `직선 ${jq(ans, "을/를")} 따라 접으면 양쪽이 완전히 겹치므로 직선 ${jq(ans, "이/가")} 대칭축이에요.`,
  };
}));

/** 대칭축의 수 세기 */
const AXIS_SHAPES: { name: string; pts: Pt[]; n: number }[] = [
  ...[3, 4, 5, 6, 8].map((n) => ({ name: `정${["", "", "", "삼", "사", "오", "육", "칠", "팔"][n]}각형`, pts: regularPolygon(n, 3, [0, 0], n % 2 ? 90 : 90 + 180 / n), n })),
  { name: "직사각형", pts: [[0, 0], [6, 0], [6, 3.5], [0, 3.5]] as Pt[], n: 2 },
  { name: "마름모", pts: [[0, 2.2], [3.4, 0], [6.8, 2.2], [3.4, 4.4]] as Pt[], n: 2 },
  { name: "이등변삼각형", pts: [[0, 0], [4, 0], [2, 5]] as Pt[], n: 1 },
  { name: "사다리꼴", pts: [[0, 0], [6, 0], [4.5, 3], [1.5, 3]] as Pt[], n: 1 },
  { name: "긴 육각형", pts: [[0, 1.5], [1.5, 0], [5, 0], [6.5, 1.5], [5, 3], [1.5, 3]] as Pt[], n: 2 },
];

export const symAxis = mid("l5-sym-axis", (rand) => {
  const s = pick(rand, AXIS_SHAPES);
  const pts = screenOf(s.pts, 150, 120);
  return {
    key: s.name,
    prompt: "선대칭도형입니다. 대칭축은 모두 몇 개인가요?",
    visual: fit({ label: `선대칭도형(${s.name})`, polygons: [{ points: pts }] }, 10),
    answer: s.n,
    unit: "개",
    hint: "접었을 때 완전히 겹치는 직선을 모두 찾아요. 꼭짓점과 꼭짓점, 변의 가운데와 변의 가운데를 잇는 직선을 생각해 보세요.",
    explanation: `${s.name}의 대칭축은 ${s.n}개예요.${s.name.startsWith("정") ? " 정다각형의 대칭축의 수는 변의 수와 같아요." : ""}`,
    mistakes: (s.n === 2 ? { 4: "대각선을 따라 접으면 겹치지 않아요." } : {}) as Record<string, string>,
  };
});

/** 세로 대칭축이 있는 육각형(왼쪽 꼭짓점 ㄱ·ㄴ·ㄷ, 오른쪽 ㄹ·ㅁ·ㅂ) */
function symHexagon(rand: () => number) {
  const [x1, x3] = [randInt(rand, 2, 4), randInt(rand, 2, 4)];
  // 가운데 꼭짓점이 양옆보다 바깥에 있어야 육각형이 된다(세 점이 한 직선 위에 놓이지 않게)
  const x2 = randInt(rand, Math.max(x1, x3) + 1, 6);
  const y2 = randInt(rand, 5, 8) / 2;
  const left: Pt[] = [[-x1, 6], [-x2, y2], [-x3, 0]];
  const math: Pt[] = [...left, ...[...left].reverse().map(([x, y]): Pt => [-x, y])];
  const k = 17;
  const pts = toScreen(math, k);
  return { pts, k };
}

/** 변 ab 바깥쪽 길이 글자: 글자 상자를 변에 수직으로 비춘 반폭 + 여백 8px만큼 떨어뜨린다(모서리가 변에 붙지 않게) */
function outsideLength(a: Pt, b: Pt, poly: Pt[], text: string): Texts[number] {
  const n = unit([a[1] - b[1], b[0] - a[0]]);
  return segText(a, b, text, inside(add(mid2(a, b), mul(n, 2)), poly) ? -1 : 1);
}

export const symLineSide = mid("l5-sym-line-side", guard((rand) => {
  const { pts } = symHexagon(rand);
  const names = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ"];
  const top = Math.min(...pts.map((p) => p[1]));
  const bottom = Math.max(...pts.map((p) => p[1]));
  const axis: Pt[] = [[0, top - 16], [0, bottom + 16]];
  const kind = pick(rand, ["side", "half", "whole"] as const);
  const texts: Texts = vertexTexts(pts, names, 12);
  const lines: Lines = [{ from: axis[0], to: axis[1], dashed: true }];
  const dots: Pt[] = [];
  if (kind === "side") {
    const i = pick(rand, [0, 1]);
    const x = randInt(rand, 3, 12);
    // 왼쪽 두 변에 모두 길이를 적어 대응변을 찾아야 풀리게 한다. 다른 변의 길이는 그린 두 변의 길이 비로 정한다
    // (11 cm인 변이 9 cm인 변보다 짧게 그려지지 않게)
    const y = Math.round((x * dist(pts[1 - i], pts[2 - i])) / dist(pts[i], pts[i + 1]));
    if (y < 2 || y === x) return null;
    texts.push(outsideLength(pts[i], pts[i + 1], pts, `${x} cm`), outsideLength(pts[1 - i], pts[2 - i], pts, `${y} cm`));
    const ask = `변 ${names[4 - i]}${names[5 - i]}`;
    return {
      key: `side:${pts.flat().join()}:${i}:${x}:${y}`,
      prompt: `직선 ㅅㅇ을 대칭축으로 하는 선대칭도형입니다. ${jq(ask, "은/는")} 몇 cm인가요?`,
      visual: fit({ label: "세로 점선을 대칭축으로 하는 선대칭 육각형", polygons: [{ points: pts }], lines, texts: [...texts, { at: add(axis[0], [0, -9]), text: "ㅅ" }, { at: add(axis[1], [0, 9]), text: "ㅇ" }] }),
      answer: x,
      unit: "cm",
      hint: "대칭축을 따라 접었을 때 겹치는 변(대응변)의 길이는 같아요.",
      explanation: `변 ${names[i]}${names[i + 1]}의 대응변은 ${ask}이므로 ${x} cm예요.`,
      mistakes: { [y]: "대칭축을 따라 접었을 때 겹치는 변을 다시 찾아보세요." },
    };
  }
  // 대응점 ㄴ과 ㅁ을 잇는 선분이 대칭축과 만나는 점 ㅅ
  const [p, q] = [pts[1], pts[4]];
  const m: Pt = [0, p[1]];
  lines.push({ from: p, to: q, width: 1.5 }, ...rightMark(m, q, axis[0], 7));
  dots.push(m);
  const x = randInt(rand, 3, 12);
  texts.push({ at: add(m, [10, 12]), text: "ㅅ" });
  if (kind === "half") {
    const t = roomySegText(p, m, `${x} cm`, pts, lines, texts);
    if (!t) return null;
    texts.push(t);
  }
  const prompt =
    kind === "half"
      ? "세로 점선을 대칭축으로 하는 선대칭도형입니다. 대응점 ㄴ과 ㅁ을 이은 선분이 대칭축과 만나는 점을 ㅅ이라 할 때, 선분 ㄴㅁ은 몇 cm인가요?"
      : `세로 점선을 대칭축으로 하는 선대칭도형입니다. 대응점 ㄴ과 ㅁ을 이은 선분이 대칭축과 만나는 점을 ㅅ이라 합니다. 선분 ㄴㅁ이 ${2 * x} cm일 때, 선분 ㅁㅅ은 몇 cm인가요?`;
  return {
    key: `${kind}:${pts.flat().join()}:${x}`,
    prompt,
    visual: fit({ label: "세로 점선을 대칭축으로 하는 선대칭 육각형과 대응점을 이은 선분", polygons: [{ points: pts }], lines, texts, dots }),
    answer: kind === "half" ? 2 * x : x,
    unit: "cm",
    hint: "대칭축은 대응점을 이은 선분을 수직으로 똑같이 둘로 나눠요.",
    explanation: kind === "half" ? `선분 ㄴㅅ과 선분 ㅁㅅ의 길이가 같으므로 ${x} × 2 = ${2 * x}(cm)` : `선분 ㄴㅁ을 똑같이 둘로 나누므로 ${2 * x} ÷ 2 = ${x}(cm)`,
    mistakes: kind === "half" ? { [x]: "선분 ㄴㅅ의 길이예요. 선분 ㄴㅁ은 그 두 배예요." } : { [2 * x]: "선분 ㄴㅁ 전체의 길이예요." },
  };
}));

/** 대칭축 ㄱㄷ을 가진 연 모양: 각 ㄱ = a, 각 ㄷ = b(5° 단위), 그림도 그 각대로 */
export const symLineAngle = word("l5-sym-line-angle", guard((rand) => {
  const a = randInt(rand, 10, 24) * 5;
  const b = randInt(rand, 8, 22) * 5;
  const x = (360 - a - b) / 2;
  if (a === b || x % 5 !== 0 || x < 50 || x > 150) return null;
  const w = 4;
  const up = w / Math.tan(rad(a / 2));
  const down = w / Math.tan(rad(b / 2));
  if ((up + down) / (2 * w) > 2.2 || (up + down) / (2 * w) < 0.6) return null;
  const k = Math.min(150 / (2 * w), 230 / (up + down));
  const [G, N, D, R] = toScreen([[0, up], [-w, 0], [0, -down], [w, 0]], k);
  const pts = [G, N, D, R];
  const arcs = [...angleMark(G, N, R, 15).arcs, ...angleMark(D, R, N, 15).arcs];
  const texts: Texts = vertexTexts(pts, ["ㄱ", "ㄴ", "ㄷ", "ㄹ"], 12);
  // 대칭축 글자(ㄱ, ㄷ)와 겹치지 않게 점선은 꼭짓점까지만
  const axis = { from: G, to: D, dashed: true, width: 1.5 };
  // 각도 글자는 점선(대칭축) 오른쪽 옆에: 꼭짓점에서 축을 따라 내려가며(ㄷ은 올라가며) 호·변·점선에 닿지 않는 첫 자리.
  // 어느 꼭짓점의 각인지 헷갈리지 않게 축 길이의 40% 안에서만 찾고(좁은 각도 담기게 그림 높이는 230까지), 없으면(너무 좁은 각) 다시 뽑는다
  const reach = Math.floor(0.4 * (D[1] - G[1])) - 12;
  for (const [V, down, label] of [[G, 1, `${a}°`], [D, -1, `${b}°`]] as const) {
    const half = textBox({ at: [0, 0], text: label })[2];
    const spot = Array.from({ length: Math.max(0, reach) }, (_, t): Pt => rp([V[0] + half + 4, V[1] + down * (12 + t)])).find((at) => {
      const probe: ShapeScene = { kind: "shape", width: 0, height: 0, label: "", polygons: [{ points: pts }], arcs, lines: [{ ...axis, width: 2 }], texts: [...texts, { at, text: label }] };
      return !strokeHitTexts(probe, 0.5).includes(texts.length);
    });
    if (!spot) return null;
    texts.push({ at: spot, text: label });
  }
  return {
    key: `${a}:${b}`,
    prompt: "선분 ㄱㄷ을 대칭축으로 하는 선대칭도형입니다. 각 ㄱㄴㄷ은 몇 도인가요?",
    visual: fit({ label: "대칭축 ㄱㄷ을 가진 연 모양 사각형과 두 각의 크기", polygons: [{ points: pts }], lines: [axis], arcs, texts }),
    answer: x,
    unit: "°",
    hint: "각 ㄱㄴㄷ과 각 ㄱㄹㄷ은 대응각이라 크기가 같아요. 사각형의 네 각의 합은 360°예요.",
    explanation: `(360° − ${a}° − ${b}°) ÷ 2 = ${x}°`,
    mistakes: { [360 - a - b]: "2로 나누지 않았어요." },
  };
}));

/* ── 점대칭도형 ── */

/** 점대칭 육각형: 세 각(5° 단위, 합 360°)과 세 변으로 걷듯이 그린다 */
function pointHexagon(rand: () => number): { math: Pt[]; ang: number[] } | null {
  const b = randInt(rand, 20, 28) * 5;
  const c = randInt(rand, 20, 28) * 5;
  const a = 360 - b - c;
  if (a < 100 || a > 140) return null;
  const L = [randInt(rand, 4, 7), randInt(rand, 3, 5), randInt(rand, 3, 5)];
  const dirs = [0, 180 - b, 180 - b + 180 - c];
  const e = dirs.map((d, i): Pt => [L[i] * Math.cos(rad(d)), L[i] * Math.sin(rad(d))]);
  const pts: Pt[] = [[0, 0]];
  for (const v of [e[0], e[1], e[2], mul(e[0], -1), mul(e[1], -1)]) pts.push(add(pts[pts.length - 1], v));
  const ang = interiorAngles(pts).map((x) => Math.round(x));
  return { math: pts, ang };
}

function paraPoints(rand: () => number): { math: Pt[]; ang: number[] } {
  const x = pick(rand, [55, 60, 65, 70, 75, 105, 110, 115, 120, 125]);
  const s = randInt(rand, 3, 5);
  const bLen = randInt(rand, 6, 8);
  const g: Pt = [s * Math.cos(rad(x)), s * Math.sin(rad(x))];
  const math: Pt[] = [g, [0, 0], [bLen, 0], [g[0] + bLen, g[1]]];
  return { math, ang: [180 - x, x, 180 - x, x] };
}

export const symPointAngle = mid("l5-sym-point-angle", guard((rand) => {
  const hex = rand() < 0.5 ? pointHexagon(rand) : null;
  const { math, ang } = hex ?? paraPoints(rand);
  const n = math.length;
  const pts = screenOf(math, 150, 110);
  const names = KO.slice(0, n);
  const center = mid2(pts[0], pts[n / 2]);
  const i = randInt(rand, 0, n - 1);
  const opp = (i + n / 2) % n;
  const askSide = rand() < 0.35;
  const texts: Texts = [...vertexTexts(pts, names, 12), { at: add(center, [0, 13]), text: "ㅇ" }];
  const arcs: NonNullable<ShapeScene["arcs"]> = [];
  let answer: number;
  let ask: string;
  let why: string;
  const mistakes: Record<string, string> = {};
  if (askSide) {
    const L = randInt(rand, 3, 12);
    // 이웃한 변의 길이도 적어 두어, 대응변을 찾아야 풀리게 한다. 이웃한 변의 길이는 그린 두 변의 길이 비로 정한다
    // (3 cm인 변이 2 cm인 변보다 짧게 그려지지 않게)
    const L2 = Math.round((L * dist(pts[(i + 1) % n], pts[(i + 2) % n])) / dist(pts[i], pts[(i + 1) % n]));
    if (L2 < 2 || L2 === L) return null;
    texts.push(lengthText(pts[i], pts[(i + 1) % n], pts, `${L} cm`), lengthText(pts[(i + 1) % n], pts[(i + 2) % n], pts, `${L2} cm`));
    mistakes[L2] = "대응변은 대칭의 중심을 지나 마주 보는 변이에요.";
    ask = `변 ${[names[opp], names[(opp + 1) % n]].sort((p, q) => KO.indexOf(p) - KO.indexOf(q)).join("")}`;
    answer = L;
    why = `변 ${names[i]}${names[(i + 1) % n]}을 대칭의 중심 ㅇ을 중심으로 180° 돌리면 ${ask}과 겹쳐요. 대응변의 길이는 같으므로 ${L} cm`;
  } else {
    const m = angleMark(pts[i], pts[(i + n - 1) % n], pts[(i + 1) % n], 14, `${ang[i]}°`, 10);
    arcs.push(...m.arcs);
    texts.push(...m.texts);
    // 이웃한 각도 적어 두어, 대응각을 찾아야 풀리게 한다
    const j = (i + 1) % n;
    if (ang[j] !== ang[i]) {
      const m2 = angleMark(pts[j], pts[i], pts[(j + 1) % n], 14, `${ang[j]}°`, 10);
      arcs.push(...m2.arcs);
      texts.push(...m2.texts);
    }
    ask = `각 ${names[opp]}`;
    answer = ang[opp];
    why = `각 ${names[i]}을 대칭의 중심 ㅇ을 중심으로 180° 돌리면 ${ask}과 겹쳐요. 대응각의 크기는 같으므로 ${answer}°`;
    const adj = ang[(opp + 1) % n];
    if (adj !== answer) mistakes[adj] = "대응각은 대칭의 중심을 지나 마주 보는 꼭짓점의 각이에요.";
  }
  return {
    key: `${math.flat().map((v) => v.toFixed(1)).join()}:${i}:${askSide}`,
    prompt: `점 ㅇ을 대칭의 중심으로 하는 점대칭도형입니다. ${jq(ask, "은/는")} 몇 ${askSide ? "cm" : "도"}인가요?`,
    visual: fit({ label: "대칭의 중심 ㅇ이 표시된 점대칭도형", polygons: [{ points: pts }], dots: [rp(center)], arcs, texts }),
    answer,
    unit: askSide ? "cm" : "°",
    hint: "대칭의 중심을 중심으로 180° 돌렸을 때 겹치는 변과 각을 찾아요. 대응변의 길이와 대응각의 크기는 같아요.",
    explanation: why,
    mistakes,
  };
}));

/** 점이 다각형 안에 있는지 */
function insidePoly(p: Pt, poly: Pt[]) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [a, b] = [poly[i], poly[j]];
    if (a[1] > p[1] !== b[1] > p[1] && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) hit = !hit;
  }
  return hit;
}
/** 점과 다각형 변 사이의 가장 짧은 거리 */
function edgeGap(p: Pt, poly: Pt[]) {
  return Math.min(...poly.map((a, i) => {
    const b = poly[(i + 1) % poly.length];
    const ab = sub(b, a);
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / (ab[0] ** 2 + ab[1] ** 2)));
    return dist(p, add(a, mul(ab, t)));
  }));
}

/** 대칭의 중심 찾기: 점대칭도형 안의 점 ①~④ 가운데 */
export const symCenter = mid("symmetry-kind", guard((rand) => {
  const s = pick(rand, LIBRARY.filter((x) => x.point));
  const pts = screenOf(turn(s.pts, pick(rand, [0, 0, 90])), 190, 140);
  const n = pts.length;
  const center = mid2(pts[0], pts[n / 2]);
  // 가짜 점: 중심에서 조금 벗어난 도형 안쪽 점(변에서 9px 이상, 서로 30px 이상 떨어지게)
  const cands: Pt[] = [center];
  for (const v of shuffle(rand, [[38, 0], [-38, 0], [0, 32], [0, -32], [32, 28], [-32, -28], [32, -28], [-32, 28], [48, 14], [-48, -14]] as Pt[])) {
    const p = rp(add(center, v));
    if (cands.length < 4 && insidePoly(p, pts) && edgeGap(p, pts) >= 9 && cands.every((q) => dist(p, q) >= 30)) cands.push(p);
  }
  if (cands.length < 4) return null;
  const order = shuffle(rand, [0, 1, 2, 3]);
  const texts: Texts = order.map((o, i) => ({ at: add(cands[o], [0, -12]), text: MARKS[i] }));
  return {
    key: `${s.name}:${cands.flat().join()}:${order.join()}`,
    prompt: "점대칭도형입니다. 대칭의 중심을 고르세요.",
    visual: fit({ label: `점대칭도형(${s.name})과 점 ①~④`, polygons: [{ points: pts }], dots: order.map((o) => rp(cands[o])), texts }),
    answer: MARKS[order.indexOf(0)],
    choices: [...MARKS],
    hint: "대응점끼리 이은 선분들이 한 점에서 만나요. 그 점이 대칭의 중심이에요.",
    explanation: `대응점을 이은 선분(예: 마주 보는 꼭짓점을 이은 선분)이 모두 ${jq(MARKS[order.indexOf(0)], "을/를")} 지나고, 그 점에서 똑같이 둘로 나뉘어요.`,
  };
}));

/**
 * 도형 안쪽 선분 ab의 길이 글자: 도형 안에서 둘레의 변·선과 되도록 3px 이상(안 되면 2 → 1px) 떨어진 자리 중
 * 선분 가운데에 가장 가까운 곳(먼저 놓은 글자 placed와 겹치지 않게, 선분 옆 띠 안). 도형 밖에 두면 변의 길이로 읽히므로 자리가 없으면 null
 */
function roomySegText(a: Pt, b: Pt, text: string, poly: Pt[], lines: Lines, placed: Texts = []): Texts[number] | null {
  const probe: ShapeScene = { kind: "shape", width: 0, height: 0, label: "", polygons: [{ points: poly }], lines };
  const m = mid2(a, b);
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const spots: Pt[] = [];
  // 어느 선분의 길이인지 헷갈리지 않게 선분 옆 띠(선분 길이의 15~85% 구간, 선분에서 글자 반폭 + 12px 이내)에서만 찾는다
  const ab = sub(b, a);
  const L = dist(a, b);
  const reach = textBox({ at: [0, 0], text })[2] + 12;
  const nearSeg = (p: Pt) => {
    const t = ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / (L * L);
    const off = Math.abs((p[0] - a[0]) * ab[1] - (p[1] - a[1]) * ab[0]) / L;
    return t >= 0.15 && t <= 0.85 && off <= reach;
  };
  for (let x = Math.min(...xs); x <= Math.max(...xs); x += 2)
    for (let y = Math.min(...ys); y <= Math.max(...ys); y += 2) if (inside([x, y], poly) && nearSeg([x, y])) spots.push(rp([x, y]));
  spots.sort((p, q) => dist(p, m) - dist(q, m));
  for (const margin of [3, 2, 1]) {
    // 먼저 놓은 글자와도 떨어지게(글자끼리 6px 여유, textsClash 기준)
    const at = spots.find((p) => !strokeHitTexts({ ...probe, texts: [{ at: p, text }] }, -margin).length && !textsClash({ kind: "shape", width: 0, height: 0, label: "", texts: [...placed, { at: p, text }] }));
    if (at) return { at, text };
  }
  return null;
}

/** 점대칭도형인 평행사변형의 두 대각선: 대칭의 중심까지의 거리로 대각선 길이의 합 */
export const pointSymDiag = word("w5-point-sym", guard((rand) => {
  const half = rand() < 0.5;
  const a = randInt(rand, 3, 12);
  const b = randInt(rand, 3, 12);
  // 차를 묻을 때는 선분 ㄴㄹ이 더 길게
  if (a === b || (!half && a > b)) return null;
  const th = pick(rand, [50, 55, 60, 65, 70, 110, 115, 120]);
  // 길이 글자가 두 대각선·변 사이에 여백을 두고 들어가도록 넉넉하게(가로 최대 190px)
  const k = Math.min(11, 190 / (2 * Math.max(a, b)));
  const u: Pt = [Math.cos(rad(th)), Math.sin(rad(th))];
  const math: Pt[] = [mul(u, a), [-b, 0], mul(u, -a), [b, 0]];
  const [G, N, D, R] = toScreen(math, k);
  const O: Pt = [0, 0];
  const pts = [G, N, D, R];
  const lines: Lines = [{ from: G, to: D, width: 1.5 }, { from: N, to: R, width: 1.5 }];
  const gA = roomySegText(G, O, `${a} cm`, pts, lines);
  const gB = gA && roomySegText(O, R, `${b} cm`, pts, lines, [gA]);
  if (!gA || !gB) return null;
  const base: Texts = [...vertexTexts(pts, ["ㄱ", "ㄴ", "ㄷ", "ㄹ"], 12), gA, gB];
  // 점 ㅇ의 이름은 다른 글자와 겹치지 않는 자리에
  const spot = ([[0, 16], [0, -16], [-16, 0], [14, -12], [-14, 12], [-14, -12], [14, 12]] as Pt[]).find((at) => figureOk(fit({ label: "", polygons: [{ points: pts }], lines, dots: [O], texts: [...base, { at, text: "ㅇ" }] })));
  if (!spot) return null;
  const texts: Texts = [...base, { at: spot, text: "ㅇ" }];
  return {
    key: `${a}:${b}:${th}:${half}`,
    prompt: half
      ? "평행사변형 ㄱㄴㄷㄹ은 점 ㅇ을 대칭의 중심으로 하는 점대칭도형입니다. 두 대각선의 길이의 합은 몇 cm인가요?"
      : "평행사변형 ㄱㄴㄷㄹ은 점 ㅇ을 대칭의 중심으로 하는 점대칭도형입니다. 선분 ㄴㄹ은 선분 ㄱㄷ보다 몇 cm 더 긴가요?",
    visual: fit({ label: "두 대각선이 점 ㅇ에서 만나는 평행사변형", polygons: [{ points: pts }], lines, dots: [O], texts }),
    answer: half ? 2 * (a + b) : 2 * (b - a),
    unit: "cm",
    hint: "대칭의 중심은 대응점을 이은 선분을 똑같이 둘로 나눠요. 선분 ㄱㅇ과 선분 ㄷㅇ의 길이가 같아요.",
    explanation: half ? `선분 ㄱㄷ = ${a} × 2 = ${2 * a}(cm), 선분 ㄴㄹ = ${b} × 2 = ${2 * b}(cm) → ${2 * (a + b)} cm` : `선분 ㄱㄷ = ${2 * a} cm, 선분 ㄴㄹ = ${2 * b} cm → ${2 * b} − ${2 * a} = ${2 * (b - a)}(cm)`,
    mistakes: half ? { [a + b]: "대각선의 절반만 더했어요." } : { [b - a]: "대각선의 절반끼리 뺐어요." },
  };
}));

