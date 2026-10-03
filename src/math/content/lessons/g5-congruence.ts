import { pick, randInt, shuffle } from "../../lib/random";
import type { ShapeScene } from "../types";
import { marksNearOwnDot } from "../figure-check";
import { mid, word, type WordSpec } from "../words/word";
import { easy } from "./g5";
import { isConvex } from "./g4-quad";
import { KO, MARKS, add, angleMark, dist, fit, guard, lengthText, rp, segText, sideBySide, sub, vertexTexts, type Pt, type Texts } from "./g5-figure";
import { jq } from "./g5-text";

/**
 * 5-2 합동: 교과서처럼 그림을 보고 합동인 도형을 찾고, 두 합동 도형(한쪽은 돌리거나 뒤집은 모양)에서
 * 대응점을 스스로 찾아 대응변의 길이·대응각의 크기를 구한다. 대응 관계는 문장에 쓰지 않고,
 * 꼭짓점 이름도 순서대로 붙이지 않아 이름 순서만 보고는 맞힐 수 없다. 그림은 길이(cm)와 각도에 맞게 그린다.
 * 두 도형은 좁은 화면에서도 글자가 작아지지 않도록 폭 300px 안팎으로 나란히 놓는다.
 */

/** 한 도형이 들어갈 크기(px) */
const BOX = 96;
const rad = (d: number) => (d * Math.PI) / 180;

/** 세 변(0-1, 1-2, 2-0 순서)의 길이로 삼각형 좌표(위쪽이 −y) */
export function triangleBySides([s0, s1, s2]: number[]): Pt[] {
  const x = (s0 * s0 + s2 * s2 - s1 * s1) / (2 * s0);
  return [[0, 0], [s0, 0], [x, -Math.sqrt(s2 * s2 - x * x)]];
}

/** 세 각(꼭짓점 0, 1, 2)으로 삼각형 좌표(변 0-1의 길이 base, 위쪽이 −y) */
export function triangleByAngles([a0, a1]: number[], base = 10): Pt[] {
  const a2 = 180 - a0 - a1;
  const s2 = (base * Math.sin(rad(a1))) / Math.sin(rad(a2)); // 변 2-0
  return [[0, 0], [base, 0], [s2 * Math.cos(rad(a0)), -s2 * Math.sin(rad(a0))]];
}

/** 네 변의 길이와 꼭짓점 1의 각으로 볼록 사각형 좌표(만들 수 없으면 null) */
export function quadBySides(s: number[], angle1: number): Pt[] | null {
  const a: Pt = [0, 0];
  const b: Pt = [s[0], 0];
  const t = rad(180 - angle1);
  const c: Pt = [b[0] + s[1] * Math.cos(t), -s[1] * Math.sin(t)];
  const d = dist(a, c);
  if (d > s[2] + s[3] || d < Math.abs(s[2] - s[3])) return null;
  const along = (s[3] * s[3] - s[2] * s[2] + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, s[3] * s[3] - along * along));
  const u: Pt = [c[0] / d, c[1] / d];
  const base: Pt = [u[0] * along, u[1] * along];
  for (const sign of [1, -1]) {
    const p: Pt = [base[0] - sign * u[1] * h, base[1] + sign * u[0] * h];
    if (isConvex([a, b, c, p])) return [a, b, c, p];
  }
  return null;
}

/** 네 각(합 360°)과 변 0-1, 1-2의 길이로 사각형 좌표(위쪽이 −y). 넷째 꼭짓점은 두 반직선이 만나는 점 */
export function quadByAngles(ang: number[], s0: number, s1: number): Pt[] | null {
  const A: Pt = [0, 0];
  const B: Pt = [s0, 0];
  const dirB = 180 - ang[1];
  const C: Pt = [B[0] + s1 * Math.cos(rad(dirB)), -s1 * Math.sin(rad(dirB))];
  const dirC = dirB + 180 - ang[2];
  // A에서 각 ang[0] 방향 반직선과 C에서 dirC 방향 반직선의 교점
  const u: Pt = [Math.cos(rad(ang[0])), -Math.sin(rad(ang[0]))];
  const v: Pt = [Math.cos(rad(dirC)), -Math.sin(rad(dirC))];
  const det = u[0] * -v[1] - u[1] * -v[0];
  if (Math.abs(det) < 1e-9) return null;
  const w = sub(C, A);
  const t = (w[0] * -v[1] - w[1] * -v[0]) / det;
  const r = (u[0] * w[1] - u[1] * w[0]) / det;
  if (t <= 0 || r <= 0) return null;
  const D: Pt = [u[0] * t, u[1] * t];
  const pts = [A, B, C, D];
  return isConvex(pts) ? pts : null;
}

/** 꼭짓점마다 안쪽 각의 크기(°) */
export function interiorAngles(pts: Pt[]): number[] {
  return pts.map((v, i) => {
    const p = pts[(i + pts.length - 1) % pts.length];
    const q = pts[(i + 1) % pts.length];
    const a1 = Math.atan2(p[1] - v[1], p[0] - v[0]);
    const a2 = Math.atan2(q[1] - v[1], q[0] - v[0]);
    let x = Math.abs(a1 - a2);
    if (x > Math.PI) x = 2 * Math.PI - x;
    return (x * 180) / Math.PI;
  });
}

/** 값들이 서로 gap 이상 차이 나는지(눈으로 구별할 수 있게) */
const spread = (xs: number[], gap: number) => xs.every((x, i) => xs.every((y, j) => i === j || Math.abs(x - y) >= gap));

const transform = (pts: Pt[], flip: boolean, deg: number): Pt[] => {
  const [c, s] = [Math.cos(rad(deg)), Math.sin(rad(deg))];
  return pts.map(([x, y]) => {
    const fx = flip ? -x : x;
    return [fx * c - y * s, fx * s + y * c];
  });
};

const extent = (pts: Pt[]) => {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
};

/** 변 이름은 자음 순서대로(변 ㅂㅁ → 변 ㅁㅂ) */
const sideName = (a: string, b: string) => `변 ${KO.indexOf(a) < KO.indexOf(b) ? a + b : b + a}`;

/** 한 도형에 붙일 표시: 변 길이(변 번호 i = 꼭짓점 i → i+1), 각(꼭짓점 번호) */
type Marks = { sides?: { i: number; text: string }[]; angles?: { i: number; text: string }[] };

type Pair = {
  scene: ShapeScene;
  /** 그림 가(ㄱ부터)·나의 꼭짓점 이름. 같은 번호끼리 대응점 */
  names: [string[], string[]];
};

/**
 * 합동인 두 도형 그림: 왼쪽은 조금 기울이고, 오른쪽은 크게 돌리거나 뒤집는다.
 * 오른쪽 이름은 둘레를 따라 붙이되 시작점과 방향을 무작위로 해서 대응이 이름 순서로 드러나지 않게 한다.
 */
function congruentPair(rand: () => number, shape: Pt[], marks: [Marks, Marks], label: string): Pair {
  const n = shape.length;
  const flip = rand() < 0.5;
  const figs = [transform(shape, false, randInt(rand, -15, 15)), transform(shape, flip, randInt(rand, 6, 30) * 10)];
  const k = Math.min(14, ...figs.flatMap((f) => {
    const e = extent(f);
    return [BOX / (e.maxX - e.minX), BOX / (e.maxY - e.minY)];
  }));
  const screens = figs.map((f) => f.map(([x, y]): Pt => rp([x * k, y * k])));
  const start = randInt(rand, 0, n - 1);
  const dir = rand() < 0.5 ? 1 : -1;
  const namesA = KO.slice(0, n);
  const namesB = Array.from({ length: n }, (_, i) => KO[n + ((start + dir * i + n * 2) % n)]);
  const parts = screens.map((poly, f) => {
    const texts: Texts = [...vertexTexts(poly, f === 0 ? namesA : namesB, 12)];
    const arcs: NonNullable<ShapeScene["arcs"]> = [];
    for (const s of marks[f].sides ?? []) texts.push(lengthText(poly[s.i], poly[(s.i + 1) % n], poly, s.text));
    for (const a of marks[f].angles ?? []) {
      const m = angleMark(poly[a.i], poly[(a.i + n - 1) % n], poly[(a.i + 1) % n], 13, a.text, 10);
      arcs.push(...m.arcs);
      texts.push(...m.texts);
    }
    return fit({ label, polygons: [{ points: poly }], texts, arcs }, 4);
  });
  return { names: [namesA, namesB], scene: sideBySide(parts[0], parts[1], 22, label) };
}

/** 이름 순서대로 대응한다고 잘못 생각했을 때 고르는 꼭짓점 번호(같은 도형 기준) */
const naiveIndex = (names: string[], nm: string, n: number) => names.findIndex((x) => KO.indexOf(x) % n === KO.indexOf(nm) % n);

/** 대응변 길이 문제: 길이가 적힌 도형의 변 j에 대응하는 다른 도형의 변을 묻는다 */
function correspondingSide(rand: () => number, shape: Pt[], lengths: number[], kind: string): WordSpec | null {
  const n = shape.length;
  const labeled = rand() < 0.5 ? 0 : 1;
  const other = labeled === 0 ? 1 : 0;
  const marks: [Marks, Marks] = [{}, {}];
  marks[labeled] = { sides: lengths.map((len, i) => ({ i, text: `${len} cm` })) };
  const { scene, names } = congruentPair(rand, shape, marks, `서로 합동인 ${kind} 두 개(오른쪽은 돌리거나 뒤집은 모양), 한쪽에만 변의 길이가 적혀 있음`);
  const j = randInt(rand, 0, n - 1);
  const [p, q] = [names[other][j], names[other][(j + 1) % n]];
  const [p2, q2] = [names[labeled][j], names[labeled][(j + 1) % n]];
  const ask = sideName(p, q);
  const [u, v] = [naiveIndex(names[labeled], p, n), naiveIndex(names[labeled], q, n)].sort((x, y) => x - y);
  const naiveSide = v - u === 1 ? u : u === 0 && v === n - 1 ? v : -1;
  const mistakes = naiveSide >= 0 && lengths[naiveSide] !== lengths[j] ? { [lengths[naiveSide]]: "꼭짓점 이름의 순서가 아니라, 포개었을 때 겹치는 꼭짓점을 찾아야 해요." } : undefined;
  return {
    key: `${lengths.join()}:${labeled}:${names[1].join("")}:${j}:${scene.polygons![1].points.flat().join()}`,
    prompt: `두 ${jq(kind, "은/는")} 서로 합동입니다. ${jq(ask, "은/는")} 몇 cm인가요?`,
    visual: scene,
    answer: lengths[j],
    unit: "cm",
    hint: "한 도형을 돌리거나 뒤집어 다른 도형에 포개어 보고, 겹치는 꼭짓점(대응점)부터 찾아요. 대응변의 길이는 같아요.",
    explanation: `꼭짓점 ${p}, ${q}의 대응점은 꼭짓점 ${p2}, ${q2}이므로 ${ask}의 대응변은 ${sideName(p2, q2)}입니다. → ${lengths[j]} cm`,
    mistakes,
  };
}

/** 세 변이 서로 다르고 각도 눈으로 구별되는 삼각형 */
function scaleneTriangle(rand: () => number): { tri: Pt[]; s: number[] } | null {
  const s = [randInt(rand, 4, 12), randInt(rand, 4, 12), randInt(rand, 4, 12)];
  const longest = Math.max(...s);
  if (longest * 2 >= s[0] + s[1] + s[2] - 1 || !spread(s, 2)) return null;
  const tri = triangleBySides(s);
  const ang = interiorAngles(tri);
  if (Math.min(...ang) < 30 || !spread(ang, 12)) return null;
  return { tri, s };
}

export const congruentSide = easy("congruent-side", guard((rand) => {
  const t = tries(100, () => scaleneTriangle(rand));
  return t && correspondingSide(rand, t.tri, t.s, "삼각형");
}));

/** 조건이 까다로운 모양은 맞을 때까지 여러 번 뽑는다 */
function tries<T>(n: number, make: () => T | null): T | null {
  for (let i = 0; i < n; i++) {
    const x = make();
    if (x) return x;
  }
  return null;
}

/** 네 변이 서로 다르고 각이 55°~135°로 눈에 구별되는 볼록 사각형 */
function distinctQuad(rand: () => number): { quad: Pt[]; s: number[] } | null {
  const s = Array.from({ length: 4 }, () => randInt(rand, 4, 13));
  if (!spread(s, 2)) return null;
  const quad = quadBySides(s, randInt(rand, 60, 120));
  if (!quad) return null;
  const ang = interiorAngles(quad);
  if (Math.min(...ang) < 55 || Math.max(...ang) > 135 || !spread(ang, 10)) return null;
  return { quad, s };
}

export const cgQuadSide = mid("l5-cg-quad-side", guard((rand) => {
  const q = tries(200, () => distinctQuad(rand));
  return q && correspondingSide(rand, q.quad, q.s, "사각형");
}));

/** 세 각이 5° 단위이고 서로 15° 이상 다른 삼각형 */
function angleTriangle(rand: () => number): number[] | null {
  const a = randInt(rand, 8, 22) * 5;
  const b = randInt(rand, 8, 22) * 5;
  const c = 180 - a - b;
  if (c < 40 || c > 110 || !spread([a, b, c], 15)) return null;
  return [a, b, c];
}

/** 합동인 삼각형에서 대응각: 한쪽에 두 각(또는 양쪽에 하나씩)이 적혀 있고, 나머지 한 각의 대응각을 묻는다 */
export const congruentAngle = mid("m5-congruent-angle", guard((rand) => {
  const ang = tries(100, () => angleTriangle(rand));
  if (!ang) return null;
  const tri = triangleByAngles(ang);
  const split = rand() < 0.4;
  const known = shuffle(rand, [0, 1, 2]);
  const [i1, i2, x] = known;
  const marks: [Marks, Marks] = [{ angles: [{ i: i1, text: `${ang[i1]}°` }] }, { angles: [] }];
  marks[split ? 1 : 0].angles!.push({ i: i2, text: `${ang[i2]}°` });
  const { scene, names } = congruentPair(rand, tri, marks, "서로 합동인 삼각형 두 개(오른쪽은 돌리거나 뒤집은 모양)와 각의 크기");
  const askFig = split ? pick(rand, [0, 1]) : 1;
  const nm = names[askFig][x];
  const answer = ang[x];
  const other = askFig === 0 ? 1 : 0;
  const naive = naiveIndex(names[other], nm, 3);
  const mistakes: Record<string, string> = {};
  if (naive !== x && naive >= 0) mistakes[ang[naive]] = "꼭짓점 이름의 순서가 아니라, 포개었을 때 겹치는 꼭짓점의 각을 찾아야 해요.";
  mistakes[180 - answer] = "180°에서 한 각만 뺐어요.";
  return {
    key: `${ang.join()}:${known.join()}:${split}:${askFig}:${names[1].join("")}:${scene.polygons![1].points.flat().join()}`,
    prompt: `두 삼각형은 서로 합동입니다. 각 ${jq(nm, "은/는")} 몇 도인가요?`,
    visual: scene,
    answer,
    unit: "°",
    hint: "대응각의 크기는 같아요. 먼저 대응점을 찾고, 삼각형의 세 각의 크기의 합이 180°임을 이용해요.",
    explanation: `각 ${nm}의 대응각은 각 ${names[other][x]}이에요. 삼각형의 세 각의 합은 180°이므로 180° − ${ang[i1]}° − ${ang[i2]}° = ${answer}°`,
    mistakes,
  };
}));

/** 네 각이 5° 단위(합 360°)이고 서로 10° 이상 다른 사각형 */
function angleQuad(rand: () => number): { ang: number[]; quad: Pt[] } | null {
  const a = [randInt(rand, 13, 26) * 5, randInt(rand, 13, 26) * 5, randInt(rand, 13, 26) * 5];
  const d = 360 - a[0] - a[1] - a[2];
  const ang = [...a, d];
  if (d < 65 || d > 130 || !spread(ang, 10)) return null;
  const quad = quadByAngles(ang, randInt(rand, 8, 12), randInt(rand, 5, 10));
  if (!quad) return null;
  const L = quad.map((p, i) => dist(p, quad[(i + 1) % 4]));
  if (Math.max(...L) / Math.min(...L) > 2.6) return null;
  return { ang, quad };
}

/** 합동인 사각형: 두 도형에 흩어진 세 각을 대응각으로 모아 나머지 한 각을 구한다 */
export const cgQuadAngle = word("l5-cg-quad-angle", guard((rand) => {
  const q = tries(300, () => angleQuad(rand));
  if (!q) return null;
  const { ang, quad } = q;
  const order = shuffle(rand, [0, 1, 2, 3]);
  const [x, ...known] = order;
  const marks: [Marks, Marks] = [{ angles: [] }, { angles: [] }];
  // 적힌 각 셋을 두 도형에 나누어 적는다(한 도형에만 몰리지 않게)
  known.forEach((i, j) => marks[j === 0 ? 0 : j === 1 ? 1 : pick(rand, [0, 1])].angles!.push({ i, text: `${ang[i]}°` }));
  const { scene, names } = congruentPair(rand, quad, marks, "서로 합동인 사각형 두 개(오른쪽은 돌리거나 뒤집은 모양)와 각의 크기");
  const askFig = pick(rand, [0, 1]);
  const nm = names[askFig][x];
  const answer = ang[x];
  return {
    key: `${ang.join()}:${order.join()}:${askFig}:${names[1].join("")}:${scene.polygons![1].points.flat().join()}`,
    prompt: `두 사각형은 서로 합동입니다. 각 ${jq(nm, "은/는")} 몇 도인가요?`,
    visual: scene,
    answer,
    unit: "°",
    hint: "대응각의 크기는 같아요. 적혀 있는 각을 한 사각형으로 모은 뒤, 사각형의 네 각의 크기의 합이 360°임을 이용해요.",
    explanation: `적힌 세 각은 사각형의 서로 다른 세 꼭짓점의 각이에요. 각 ${nm}의 크기는 360° − ${known.map((i) => `${ang[i]}°`).join(" − ")} = ${answer}°`,
    mistakes: { [360 - ang[known[0]] - ang[known[1]]]: "적힌 각 중에서 대응각끼리 같은 각을 두 번 쓰지 않았는지 확인해요." },
  };
}));

/** 합동인 삼각형의 둘레: 두 도형에 한 변씩 적힌 길이와 둘레로 나머지 변을 구한다 */
export const congruentPerimeter = word("w5-congruent-perimeter", guard((rand) => {
  const t = tries(100, () => scaleneTriangle(rand));
  if (!t) return null;
  const { tri, s } = t;
  const [i, j, x] = shuffle(rand, [0, 1, 2]);
  const marks: [Marks, Marks] = [{ sides: [{ i, text: `${s[i]} cm` }] }, { sides: [{ i: j, text: `${s[j]} cm` }] }];
  const { scene, names } = congruentPair(rand, tri, marks, "서로 합동인 삼각형 두 개(오른쪽은 돌리거나 뒤집은 모양), 두 도형에 변의 길이가 하나씩 적혀 있음");
  const askFig = pick(rand, [0, 1]);
  const ask = sideName(names[askFig][x], names[askFig][(x + 1) % 3]);
  const P = s[0] + s[1] + s[2];
  return {
    key: `${s.join()}:${i}${j}:${askFig}:${names[1].join("")}:${scene.polygons![1].points.flat().join()}`,
    prompt: `두 삼각형은 서로 합동이고, 삼각형 ㄱㄴㄷ의 둘레는 ${P} cm입니다. ${jq(ask, "은/는")} 몇 cm인가요?`,
    visual: scene,
    answer: s[x],
    unit: "cm",
    hint: "대응변의 길이는 같아요. 두 도형에 적힌 길이가 삼각형 ㄱㄴㄷ의 어느 변과 같은지 먼저 찾아요.",
    explanation: `적힌 두 길이는 삼각형의 서로 다른 두 변의 길이예요. ${P} − ${s[i]} − ${s[j]} = ${s[x]}(cm)`,
    mistakes: { [P - s[i]]: "변 하나만 뺐어요." },
  };
}));

/* ── 도형의 합동: 그림에서 합동인 도형 찾기 ── */

/** 모눈 위 다각형(칸 좌표) */
type Cells = Pt[];
const d2 = (a: Pt, b: Pt) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
/** 두 다각형이 합동인지: 꼭짓점을 어떤 순서(돌리기·뒤집기)로 맞추면 모든 꼭짓점 사이 거리가 같다 */
export function congruentPolys(P: Pt[], Q: Pt[]): boolean {
  const n = P.length;
  if (Q.length !== n) return false;
  for (let s = 0; s < n; s++) {
    for (const dir of [1, -1]) {
      const map = (i: number) => Q[(((s + dir * i) % n) + n) % n];
      let ok = true;
      for (let i = 0; ok && i < n; i++) for (let j = i + 1; ok && j < n; j++) ok = d2(P[i], P[j]) === d2(map(i), map(j));
      if (ok) return true;
    }
  }
  return false;
}
/** 90°씩 돌리거나 뒤집은 뒤 왼쪽 위(0, 0)에 붙인다 */
function orient(pts: Cells, rot: number, flip: boolean): Cells {
  let q = pts.map(([x, y]): Pt => [flip ? -x : x, y]);
  for (let k = 0; k < rot; k++) q = q.map(([x, y]): Pt => [-y, x]);
  const mx = Math.min(...q.map((p) => p[0]));
  const my = Math.min(...q.map((p) => p[1]));
  return q.map(([x, y]): Pt => [x - mx, y - my]);
}
const sizeOf = (pts: Cells): Pt => [Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
const sameCells = (a: Cells, b: Cells) => a.length === b.length && a.every((p) => b.some((q) => q[0] === p[0] && q[1] === p[1]));

/** 모양이 뚜렷이 다른 모눈 도형(돌리거나 뒤집으면 모양이 달라지는 것) */
const GRID_SHAPES: Cells[] = [
  [[0, 0], [3, 0], [2, 2], [0, 1]],
  [[0, 0], [3, 0], [3, 1], [1, 3]],
  [[0, 0], [2, 0], [3, 2], [0, 2]],
  [[0, 0], [3, 0], [1, 2]],
  [[0, 0], [3, 0], [3, 2]],
  [[0, 0], [2, 0], [3, 1], [2, 3], [0, 2]],
  [[0, 0], [3, 0], [3, 1], [1, 1], [1, 3], [0, 3]],
  [[0, 0], [4, 0], [3, 2], [1, 2]],
];

/** 한 꼭짓점을 한 칸 옮긴 비슷한 도형(합동이 아닌 것만) */
function nearMiss(rand: () => number, base: Cells): Cells | null {
  const i = randInt(rand, 0, base.length - 1);
  const [dx, dy] = pick(rand, [[1, 0], [-1, 0], [0, 1], [0, -1]] as Pt[]);
  const q = base.map((p, j): Pt => (j === i ? [p[0] + dx, p[1] + dy] : p));
  if (q.some((p) => p[0] < 0 || p[1] < 0 || p[0] > 4 || p[1] > 4)) return null;
  if (isConvex(base) && !isConvex(q)) return null;
  if (congruentPolys(base, q)) return null;
  // 세 점이 한 직선 위에 있으면 꼭짓점이 사라지므로 뺀다
  for (let k = 0; k < q.length; k++) {
    const [a, b, c] = [q[(k + q.length - 1) % q.length], q[k], q[(k + 1) % q.length]];
    if ((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]) === 0) return null;
  }
  return q;
}

const C = 16;
/** 모눈 칸 도형 여러 개를 두 줄로 늘어놓은 그림(도형마다 5×5칸 자리, 왼쪽 위에 이름) */
function gridRow(shapes: Cells[], names: string[], label: string): ShapeScene {
  const slot = 6;
  const polygons: NonNullable<ShapeScene["polygons"]> = [];
  const texts: Texts = [];
  shapes.forEach((s, i) => {
    const [col, row] = [i % 3, Math.floor(i / 3)];
    const [w, h] = sizeOf(s);
    const ox = col * slot + 1 + Math.floor((4 - w) / 2);
    const oy = row * slot + 1.5 + Math.floor((4 - h) / 2) + 0.5;
    polygons.push({ points: s.map(([x, y]): Pt => [(ox + x) * C, (oy + y) * C]) });
    texts.push({ at: [(col * slot + 0.7) * C, (row * slot + 0.8) * C], text: names[i] });
  });
  const rows = Math.ceil(shapes.length / 3);
  return { kind: "shape", width: 3 * slot * C, height: rows * slot * C, label, grid: C, polygons, texts };
}

export const cgFind = easy("l5-cg-find", (rand) => {
  const base = pick(rand, GRID_SHAPES);
  const ref = orient(base, randInt(rand, 0, 3), rand() < 0.5);
  const answerShape = orient(base, randInt(rand, 0, 3), rand() < 0.5);
  const others: Cells[] = [];
  for (let i = 0; others.length < 3 && i < 60; i++) {
    const m = nearMiss(rand, base);
    if (!m) continue;
    const o = orient(m, randInt(rand, 0, 3), rand() < 0.5);
    if (sizeOf(o).some((v) => v > 4) || [...others, answerShape].some((x) => sameCells(x, o) || congruentPolys(x, o))) continue;
    others.push(o);
  }
  if (others.length < 3) return null;
  const at = randInt(rand, 0, 3);
  const cands = [...others];
  cands.splice(at, 0, answerShape);
  return {
    key: `${GRID_SHAPES.indexOf(base)}:${JSON.stringify([ref, cands])}`,
    prompt: "도형 가와 서로 합동인 도형을 고르세요.",
    visual: gridRow([ref, ...cands], ["가", ...MARKS], "모눈 위의 도형 가와 도형 ①~④"),
    answer: MARKS[at],
    choices: [...MARKS],
    hint: "모양과 크기가 같아서 돌리거나 뒤집어 포개었을 때 완전히 겹치는 도형을 찾아요. 변의 길이를 모눈 칸으로 세어 비교해요.",
    explanation: `${jq(MARKS[at], "은/는")} 도형 가를 돌리거나 뒤집은 모양이라 포개면 완전히 겹쳐요. 나머지는 변의 길이나 모양이 조금 달라요.`,
  };
});

/** 대각선으로 나눈 사각형: 서로 합동인 삼각형 쌍 */
const CUTS = [
  { shape: "직사각형", two: true, pairs: 2 },
  { shape: "평행사변형", two: true, pairs: 2 },
  { shape: "정사각형", two: true, pairs: 6 },
  { shape: "마름모", two: true, pairs: 6 },
  { shape: "직사각형", two: false, pairs: 1 },
  { shape: "평행사변형", two: false, pairs: 1 },
];

function quadOf(shape: string, rand: () => number): Pt[] {
  const w = randInt(rand, 110, 150);
  const h = randInt(rand, 60, 85);
  if (shape === "직사각형") return [[0, 0], [w, 0], [w, h], [0, h]];
  if (shape === "정사각형") return [[0, 0], [90, 0], [90, 90], [0, 90]];
  if (shape === "평행사변형") {
    const o = randInt(rand, 30, 45);
    return [[o, 0], [w + o, 0], [w, h], [0, h]];
  }
  const [p, q] = [randInt(rand, 120, 150), randInt(rand, 70, 90)];
  return [[p / 2, 0], [p, q / 2], [p / 2, q], [0, q / 2]];
}

export const cgCut = mid("l5-cg-cut", guard((rand) => {
  const c = pick(rand, CUTS);
  const pts = quadOf(c.shape, rand);
  const n = c.two ? 4 : 2;
  const diag = [{ from: pts[0], to: pts[2] }, ...(c.two ? [{ from: pts[1], to: pts[3] }] : [])];
  return {
    key: `${c.shape}:${c.two}:${pts.flat().join()}`,
    prompt: `그림과 같이 ${c.shape}에 ${c.two ? "두 대각선을" : "대각선 한 개를"} 그어 삼각형 ${n}개로 나누었습니다. 서로 합동인 삼각형은 모두 몇 쌍인가요?`,
    visual: fit({ label: `${jq(c.shape, "과/와")} 대각선${c.two ? " 두 개" : " 한 개"}`, polygons: [{ points: pts }], lines: diag }),
    answer: c.pairs,
    unit: "쌍",
    hint: "포개었을 때 완전히 겹치는 삼각형끼리 짝지어 보세요. 대각선이 서로를 똑같이 둘로 나누는지 생각해요.",
    explanation: c.pairs === 6 ? "삼각형 4개가 모두 합동이므로 두 개씩 짝지으면 6쌍" : c.pairs === 2 ? "마주 보는 삼각형끼리 합동 → 2쌍" : "나누어진 두 삼각형이 합동 → 1쌍",
    mistakes: (c.pairs === 6 ? { 2: "이웃한 삼각형끼리도 합동이에요." } : c.pairs === 2 ? { 6: "이웃한 삼각형은 변의 길이가 달라 합동이 아니에요." } : {}) as Record<string, string>,
  };
}));

export const cgGlue = word("l5-cg-glue", guard((rand) => {
  const a = randInt(rand, 3, 12);
  const b = randInt(rand, 3, 12);
  const c = randInt(rand, Math.abs(a - b) + 2, a + b - 2);
  if (c === a || c === b || a === b) return null;
  // 삼각형 ㄱㄴㄷ(ㄱㄴ = c 밑변, ㄴㄷ = a, ㄷㄱ = b)을 변 ㄱㄴ의 가운데를 중심으로 돌려 붙이면 평행사변형
  const tri = triangleBySides([c, a, b]);
  const k = Math.min(12, 150 / c, 90 / Math.abs(tri[2][1]));
  const [A, B, Ct] = tri.map(([x, y]): Pt => rp([x * k, y * k]));
  const D: Pt = rp(sub(add(A, B), Ct));
  const quad = [A, D, B, Ct];
  const texts: Texts = [lengthText(B, Ct, quad, `${a} cm`), lengthText(Ct, A, quad, `${b} cm`), segText(A, B, `${c} cm`, 1)];
  const scene = fit({ label: "합동인 삼각형 두 개를 한 변끼리 붙여 만든 사각형, 붙인 변은 점선", polygons: [{ points: quad }], lines: [{ from: A, to: B, dashed: true, width: 1.5 }], texts });
  return {
    key: `${a}:${b}:${c}`,
    prompt: `세 변의 길이가 ${a} cm, ${b} cm, ${c} cm인 삼각형과 이 삼각형과 합동인 삼각형을 그림과 같이 ${c} cm인 변끼리 꼭 맞게 붙여 사각형을 만들었습니다. 만든 사각형의 둘레는 몇 cm인가요?`,
    visual: scene,
    answer: 2 * (a + b),
    unit: "cm",
    hint: "붙인 변(점선)은 사각형의 둘레가 아니에요. 대응변의 길이는 같아요.",
    explanation: `사각형의 네 변은 ${a} cm, ${b} cm, ${a} cm, ${b} cm → (${a} + ${b}) × 2 = ${2 * (a + b)}(cm)`,
    mistakes: { [2 * (a + b + c)]: "붙인 변까지 더했어요.", [a + b + c]: "삼각형 한 개의 둘레를 구했어요." },
  };
}));

export const cgTriInRect = word("l5-cg-tri-rect", guard((rand) => {
  const a = randInt(rand, 3, 10) * 2;
  const b = randInt(rand, 2, 7) * 2;
  if (a <= b + 2) return null;
  const k = Math.min(9, 160 / a);
  const pts: Pt[] = [[0, 0], [a * k, 0], [a * k, b * k], [0, b * k]].map((p) => rp(p as Pt));
  return {
    key: `${a}:${b}`,
    prompt: `그림과 같이 가로 ${a} cm, 세로 ${b} cm인 직사각형에 두 대각선을 그었습니다. 만들어진 삼각형 4개 중에서 서로 합동인 두 삼각형을 찾아 넓이를 더하면 몇 cm²인가요?`,
    visual: fit({
      label: "두 대각선을 그은 직사각형",
      polygons: [{ points: pts }],
      lines: [{ from: pts[0], to: pts[2] }, { from: pts[1], to: pts[3] }],
      texts: [lengthText(pts[0], pts[1], pts, `${a} cm`), lengthText(pts[1], pts[2], pts, `${b} cm`)],
    }),
    answer: (a * b) / 2,
    unit: "cm²",
    hint: "마주 보는 두 삼각형이 합동이에요. 두 대각선은 서로를 똑같이 둘로 나눠요. 삼각형 4개의 넓이를 비교해 보세요.",
    explanation: `위아래 삼각형 한 개의 넓이는 ${a} × ${b / 2} ÷ 2 = ${(a * b) / 4}(cm²), 양옆 삼각형 한 개의 넓이는 ${b} × ${a / 2} ÷ 2 = ${(a * b) / 4}(cm²)예요. 어느 쌍이든 두 개의 합은 ${(a * b) / 2} cm²`,
  };
}));

/* ══════════ 모눈종이에 합동인 도형 그리기 ══════════ */

const G = 20;
/** 모눈 그림: 칸 좌표를 그림 좌표로(바깥 한 칸 여백) */
const gpt = ([x, y]: Pt): Pt => [(x + 1) * G, (y + 1) * G];

/** 도형 가(왼쪽)와 그리다 만 합동인 도형(오른쪽): 빠진 꼭짓점 하나와 후보 점 ①~④ */
function drawVertex(rand: () => number, turn: boolean): WordSpec | null {
  const base = pick(rand, GRID_SHAPES.filter((s) => s.length >= 4));
  const A = orient(base, randInt(rand, 0, 3), rand() < 0.5);
  const B = turn ? orient(A, randInt(rand, 1, 3), rand() < 0.4) : A;
  if (turn && sameCells(A, B)) return null;
  const n = A.length;
  const [wa, ha] = sizeOf(A);
  const [wb, hb] = sizeOf(B);
  const ox = wa + 3;
  const oy = randInt(rand, 0, 1);
  const Bp = B.map(([x, y]): Pt => [x + ox, y + oy]);
  const miss = randInt(rand, 0, n - 1);
  const target = Bp[miss];
  const cands: Pt[] = [target];
  // 그려 둔 변(빠진 꼭짓점에 이어진 두 변 제외)
  const drawn = Bp.flatMap((p, j) => (j === miss || (j + 1) % n === miss ? [] : [[p, Bp[(j + 1) % n]] as [Pt, Pt]]));
  const onDrawn = ([x, y]: Pt) =>
    drawn.some(([a, b]) => (b[0] - a[0]) * (y - a[1]) === (b[1] - a[1]) * (x - a[0]) && x >= Math.min(a[0], b[0]) && x <= Math.max(a[0], b[0]) && y >= Math.min(a[1], b[1]) && y <= Math.max(a[1], b[1]));
  // 후보 점끼리는 두 칸 이상 떨어지게 한다. 한 칸 간격으로 붙어 있으면 번호 글자가 이웃 점과도 같은 거리에 놓여
  // 정답 점을 다른 번호로 읽을 수 있다
  const ring: Pt[] = [];
  for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy <= 3; dy++) if (Math.hypot(dx, dy) >= 2 && Math.hypot(dx, dy) <= 3) ring.push([dx, dy]);
  for (const [dx, dy] of shuffle(rand, ring)) {
    if (cands.length === 4) break;
    const p: Pt = [target[0] + dx, target[1] + dy];
    if (p[0] < ox - 1 || p[1] < 0 || p[0] > ox + 5 || p[1] > 6) continue;
    if (cands.some((c) => Math.hypot(c[0] - p[0], c[1] - p[1]) < 2)) continue;
    const poly = Bp.map((q, j) => (j === miss ? p : q));
    if (congruentPolys(A, poly)) continue;
    if (Bp.some((q) => q[0] === p[0] && q[1] === p[1])) continue;
    // 오답 후보가 그려 둔 변 위에 놓이면 변의 일부로 보여 헷갈린다
    if (onDrawn(p)) continue;
    cands.push(p);
  }
  if (cands.length < 4) return null;
  const order = shuffle(rand, [0, 1, 2, 3]);
  const ansIdx = order.indexOf(0);
  // 후보 점이 그림 테두리에 걸쳐 잘리지 않게 그림 크기에 후보 점까지 넣는다
  const cols = Math.max(ox + wb, ox + 5, ...cands.map((c) => c[0])) + 1;
  const rows = Math.max(ha, hb + oy, 5, ...cands.map((c) => c[1])) + 1;
  // 빠진 꼭짓점에 이어진 두 변은 그리지 않는다
  const lines = Bp.flatMap((p, j) => {
    const q = Bp[(j + 1) % n];
    return j === miss || (j + 1) % n === miss ? [] : [{ from: gpt(p), to: gpt(q) }];
  });
  const texts: Texts = [{ at: add(gpt([0, 0]), [-10, -10]), text: "가" }];
  const dots = order.map((o) => gpt(cands[o]));
  order.forEach((o, i) => texts.push({ at: add(gpt(cands[o]), [10, -10]), text: MARKS[i] }));
  const scene: ShapeScene = {
    kind: "shape",
    width: (cols + 1) * G,
    height: (rows + 1) * G,
    label: "모눈 위의 도형 가와, 가와 합동이 되도록 그리다 만 도형, 후보 점 ①~④",
    grid: G,
    polygons: [{ points: A.map(gpt) }],
    lines,
    dots,
    texts,
  };
  if (!marksNearOwnDot(scene)) return null;
  return {
    key: `${turn}:${JSON.stringify([A, Bp, miss, order])}`,
    prompt: turn
      ? "도형 가를 돌리거나 뒤집은 모양으로, 가와 합동인 도형을 오른쪽에 그리고 있습니다. 나머지 한 꼭짓점을 어느 점에 찍어야 하나요?"
      : "도형 가와 합동인 도형을 오른쪽에 그리고 있습니다. 나머지 한 꼭짓점을 어느 점에 찍어야 하나요?",
    visual: scene,
    answer: MARKS[ansIdx],
    choices: [...MARKS],
    hint: "대응변의 길이가 같도록 모눈 칸을 세어 보세요. 변이 몇 칸 옆으로, 몇 칸 위아래로 가는지 비교해요.",
    explanation: `${MARKS[ansIdx]}에 찍으면 모든 대응변의 길이와 대응각의 크기가 도형 가와 같아져요.`,
  };
}

export const cgdVertex = easy("l5-cgd-vertex", guard((rand) => drawVertex(rand, false)));
export const cgdTurn = mid("l5-cgd-turn", guard((rand) => drawVertex(rand, true)));

/** 꼭짓점 j 하나만 모눈의 다른 점으로 옮겨서 도형 A와 합동이 될 수 있는지 */
export function movableToCongruent(A: Pt[], P: Pt[], j: number): boolean {
  const [x0, y0] = P[j];
  for (let x = x0 - 8; x <= x0 + 8; x++) {
    for (let y = y0 - 8; y <= y0 + 8; y++) {
      if (x === x0 && y === y0) continue;
      if (congruentPolys(A, P.map((p, k): Pt => (k === j ? [x, y] : p)))) return true;
    }
  }
  return false;
}

/** 합동이 되게 그린 도형에서 잘못 찍은 꼭짓점 찾기 */
export const cgdWrong = mid("l5-cgd-wrong", guard((rand) => {
  const base = pick(rand, GRID_SHAPES.filter((s) => s.length >= 4));
  const A = orient(base, randInt(rand, 0, 3), rand() < 0.5);
  const B = orient(A, randInt(rand, 0, 3), false);
  const n = A.length;
  const [wa] = sizeOf(A);
  const ox = wa + 3;
  const bad = randInt(rand, 0, n - 1);
  const [dx, dy] = pick(rand, [[1, 0], [-1, 0], [0, 1], [0, -1]] as Pt[]);
  const Bp = B.map(([x, y], j): Pt => (j === bad ? [x + ox + dx, y + 1 + dy] : [x + ox, y + 1]));
  if (Bp.some((p) => p[0] < ox - 1 || p[1] < 0) || congruentPolys(A, Bp) || (isConvex(A) && !isConvex(Bp))) return null;
  if (new Set(Bp.map((p) => p.join())).size < n || Bp.some((b, k) => {
    const [a, c] = [Bp[(k + n - 1) % n], Bp[(k + 1) % n]];
    return (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]) === 0;
  })) return null;
  // ①~④는 오른쪽 도형의 꼭짓점 넷(잘못 찍은 점 포함)
  const others = shuffle(rand, Array.from({ length: n }, (_, j) => j).filter((j) => j !== bad)).slice(0, 3);
  const labeled = shuffle(rand, [bad, ...others]);
  // 다른 이름표 꼭짓점을 옮겨도 합동이 되면(대칭인 도형) 정답이 둘이 되므로 다시 뽑는다
  if (others.some((j) => movableToCongruent(A, Bp, j))) return null;
  const cols = Math.max(...Bp.map((p) => p[0])) + 2;
  const rows = Math.max(...[...A, ...Bp].map((p) => p[1])) + 2;
  const Bs = Bp.map(gpt);
  const spotAt = vertexTexts(Bs, Bs.map(() => ""), 13);
  const texts: Texts = [{ at: add(gpt([0, 0]), [-10, -10]), text: "가" }, ...labeled.map((j, i) => ({ at: spotAt[j].at, text: MARKS[i] }))];
  return {
    key: JSON.stringify([A, Bp, labeled]),
    prompt: "도형 가와 합동인 도형을 오른쪽에 그리려다 꼭짓점 하나를 잘못 찍었습니다. 잘못 찍은 꼭짓점을 고르세요.",
    visual: { kind: "shape", width: (cols + 1) * G, height: (rows + 1) * G, label: "모눈 위의 도형 가와 잘못 그린 도형, 꼭짓점 ①~④", grid: G, polygons: [{ points: A.map(gpt) }, { points: Bs }], texts },
    answer: MARKS[labeled.indexOf(bad)],
    choices: [...MARKS],
    hint: "두 도형의 대응변을 찾아 모눈 칸 수를 비교해요. 길이가 다른 변 두 개가 만나는 꼭짓점이 잘못 찍은 점이에요.",
    explanation: `${jq(MARKS[labeled.indexOf(bad)], "을/를")} 한 칸 옮기면 대응변의 길이가 모두 같아져 도형 가와 합동이 돼요.`,
  };
}));

/** 선분 ㄱㄴ을 한 변으로 하여 삼각형 ㄱㄴㄷ과 합동인 삼각형 ㄱㄴㄹ을 그릴 수 있는 점 ㄹ의 수 */
export const cgdCount = word("l5-cgd-count", guard((rand) => {
  const cols = 8;
  const rows = 6;
  // 선분 ㄱㄴ은 가로로 놓아 뒤집은 점이 모눈의 점이 되게 한다
  // 뒤집은 점이 그림 밖으로 나가는 경우도 있게(답 1~3개) 선분 ㄱㄴ과 점 ㄷ의 자리를 넓게 고른다
  const A: Pt = [randInt(rand, 0, 4), randInt(rand, 0, rows)];
  const B: Pt = [A[0] + randInt(rand, 2, 4), A[1]];
  const Cp: Pt = [randInt(rand, Math.max(0, A[0] - 3), Math.min(cols, B[0] + 3)), A[1] + pick(rand, [-4, -3, -2, -1, 1, 2, 3, 4])];
  if (B[0] > cols || Cp[1] < 0 || Cp[1] > rows) return null;
  const cross = (B[0] - A[0]) * (Cp[1] - A[1]) - (B[1] - A[1]) * (Cp[0] - A[0]);
  if (cross === 0) return null;
  const [ca, cb] = [d2(A, Cp), d2(B, Cp)];
  if (ca === cb || ca === d2(A, B) || cb === d2(A, B)) return null;
  const spots: Pt[] = [];
  // 모눈은 그림 테두리(칸 좌표 −1, cols + 1)까지 그려지므로 테두리 위 격자점까지 보고, 그 위에 후보가 놓이면
  // '그림 안'에 셀지 애매하므로 다시 뽑는다. 세는 범위는 테두리 안쪽의 격자점이다
  const onFrame = (x: number, y: number) => x === -1 || y === -1 || x === cols + 1 || y === rows + 1;
  for (let x = -1; x <= cols + 1; x++) {
    for (let y = -1; y <= rows + 1; y++) {
      const P: Pt = [x, y];
      if ((x === Cp[0] && y === Cp[1]) || (B[0] - A[0]) * (y - A[1]) - (B[1] - A[1]) * (x - A[0]) === 0) continue;
      if (!congruentPolys([A, B, Cp], [A, B, P])) continue;
      if (onFrame(x, y)) return null;
      spots.push(P);
    }
  }
  if (spots.length < 1) return null;
  const [pa, pb, pc] = [A, B, Cp].map(gpt);
  const tri = [pa, pb, pc];
  return {
    key: JSON.stringify([A, B, Cp]),
    // '삼각형 ㄱㄴㄹ'이라고 하면 꼭짓점 순서대로 대응한다고 읽어 답이 1개가 될 수 있으므로 이름을 붙이지 않는다
    prompt: "모눈종이 위에 삼각형 ㄱㄴㄷ이 있습니다. 선분 ㄱㄴ을 한 변으로 하고 삼각형 ㄱㄴㄷ과 합동인 삼각형을 그리려고 합니다. 나머지 한 꼭짓점이 될 수 있는 모눈의 점은 그림 안에 모두 몇 개인가요? (점 ㄷ은 빼고 셉니다.)",
    visual: { kind: "shape", width: (cols + 2) * G, height: (rows + 2) * G, label: "모눈종이 위의 삼각형 ㄱㄴㄷ", grid: G, polygons: [{ points: tri }], texts: vertexTexts(tri, ["ㄱ", "ㄴ", "ㄷ"], 12), dots: tri },
    answer: spots.length,
    unit: "개",
    hint: "나머지 한 꼭짓점과 점 ㄱ, 점 ㄴ을 이은 두 변의 길이가 변 ㄱㄷ, 변 ㄴㄷ의 길이와 같아지는 점을 찾아요. 선분 ㄱㄴ을 기준으로 뒤집거나, 선분 ㄱㄴ의 양 끝을 바꾸어 생각해요.",
    explanation: `점 ㄷ을 선분 ㄱㄴ을 기준으로 뒤집은 점, 선분 ㄱㄴ의 가운데를 지나는 세로선을 기준으로 뒤집은 점, 두 번 뒤집은 점 가운데 그림 안에 있는 점은 ${spots.length}개예요.`,
  };
}));

/** 한 변을 따라 붙인 합동인 도형 두 개의 둘레: 모눈 도형 가를 한 번 더 그려 붙인다 */
export const cgdJoin = word("l5-cgd-join", guard((rand) => {
  const w = randInt(rand, 2, 4);
  const h = randInt(rand, 2, 3);
  // 직사각형 가(w×h)와 합동인 직사각형을 긴 변끼리 또는 짧은 변끼리 붙인다
  const along = pick(rand, ["긴", "짧은"] as const);
  const long = Math.max(w, h);
  const short = Math.min(w, h);
  if (long === short) return null;
  const P = along === "긴" ? 2 * (2 * short + long) : 2 * (2 * long + short);
  const cm = randInt(rand, 1, 2);
  const pts: Pt[] = [[0, 0], [long, 0], [long, short], [0, short]];
  const scene: ShapeScene = {
    kind: "shape",
    width: (long + 2) * G,
    height: (short + 2) * G,
    label: "모눈 위의 직사각형 가",
    grid: G,
    polygons: [{ points: pts.map(gpt) }],
    texts: [{ at: gpt([long / 2, short / 2]), text: "가" }],
  };
  return {
    key: `${long}:${short}:${along}:${cm}`,
    prompt: `모눈 한 칸의 길이는 ${cm} cm입니다. 직사각형 가와 합동인 직사각형을 하나 더 그려서 두 직사각형의 ${along} 변끼리 꼭 맞게 붙였습니다. 만든 도형의 둘레는 몇 cm인가요?`,
    visual: scene,
    answer: P * cm,
    unit: "cm",
    hint: "합동인 직사각형은 가로와 세로가 같아요. 붙인 변은 둘레가 아니에요.",
    explanation: `가로 ${long * cm} cm, 세로 ${short * cm} cm → ${along === "긴" ? `긴 변끼리 붙이면 ${long * cm} cm × ${2 * short * cm} cm` : `짧은 변끼리 붙이면 ${2 * long * cm} cm × ${short * cm} cm`}인 직사각형 → 둘레 ${P * cm} cm`,
    mistakes: { [2 * 2 * (long + short) * cm]: "붙인 변까지 둘레에 넣었어요." },
  };
}));

