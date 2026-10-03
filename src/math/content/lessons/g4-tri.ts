import type { ShapeScene } from "../types";
import { pick, randInt, shuffle } from "../../lib/random";
import { MARKS, easy as easyBase, mid as midBase, opts, word as wordBase } from "./g4";
import { add, dot, guard, mul, rp, sideText, sub, unit, type Lines, type Make, type Pt, type Texts } from "./g4-quad";
import { cornerMarks, fit, niceAngle, type Mark } from "./g4-angles";
import { josa } from "../josa";

/**
 * 4-2 삼각형: 삼각형 그림(길이·각 표시, 같은 길이 표시, 모눈)을 보고 분류하고 각을 구한다.
 * 각도는 5의 배수(이등변삼각형의 밑각을 구할 때도 5의 배수가 되도록 꼭지각은 10° 단위).
 */

const easy = (id: string, make: Make) => easyBase(id, guard(make));
const mid = (id: string, make: Make) => midBase(id, guard(make));
const word = (id: string, make: Make) => wordBase(id, guard(make));

const rad = (d: number) => (d * Math.PI) / 180;
const KINDS = ["예각삼각형", "직각삼각형", "둔각삼각형"] as const;
type Kind = (typeof KINDS)[number];
const kindOf = (angles: number[]): Kind => {
  const m = Math.max(...angles);
  return m > 90 ? "둔각삼각형" : m === 90 ? "직각삼각형" : "예각삼각형";
};

/* ── 삼각형 그림 ── */

/** 세 각 [A, B, C]인 삼각형(수학 좌표, 밑변 BC = 10)을 turn°만큼 돌린 것 */
function triModel([A, B]: number[], turn = 0): Pt[] {
  const c = (10 * Math.sin(rad(180 - A - B))) / Math.sin(rad(A));
  const raw: Pt[] = [[c * Math.cos(rad(B)), c * Math.sin(rad(B))], [0, 0], [10, 0]];
  const t = rad(turn);
  return raw.map(([x, y]) => [x * Math.cos(t) - y * Math.sin(t), x * Math.sin(t) + y * Math.cos(t)]);
}

/** 변의 가운데에 같은 길이 표시(짧은 금 n개) */
function ticks(a: Pt, b: Pt, n: number): Lines {
  const m = mul(add(a, b), 0.5);
  const d = unit(sub(b, a));
  const nrm: Pt = [-d[1], d[0]];
  return Array.from({ length: n }, (_, i) => {
    const o = add(m, mul(d, (i - (n - 1) / 2) * 5));
    return { from: rp(add(o, mul(nrm, 6))), to: rp(add(o, mul(nrm, -6))), width: 1.5 };
  });
}

type TriOpts = {
  /** 꼭짓점 [A, B, C]의 각 표시 */
  marks?: Mark[];
  /** 변 [BC, CA, AB]의 길이 글자 */
  sides?: (string | null)[];
  /** 변 [BC, CA, AB]의 같은 길이 표시 금 수 */
  tick?: number[];
  turn?: number;
  W?: number;
  H?: number;
  /** 그림 가장자리 여백(기본 40) */
  pad?: number;
};

/** 세 각이 angles인 삼각형 그림(각 표시·길이 글자·같은 길이 표시) */
export function triScene(angles: number[], label: string, o: TriOpts = {}): ShapeScene {
  const W = o.W ?? 300;
  const H = o.H ?? 210;
  const pts = fit(triModel(angles, o.turn ?? 0), W, H, o.pad ?? 40);
  const m = cornerMarks(pts, o.marks ?? [null, null, null]);
  const [A, B, C] = pts;
  const sidePairs: [Pt, Pt][] = [[B, C], [C, A], [A, B]];
  const texts: Texts = [...m.texts];
  const lines: Lines = [...m.lines];
  sidePairs.forEach(([p, q], i) => {
    const t = o.sides?.[i];
    if (t) {
      // 같은 길이 표시 금과 겹치지 않도록 글자를 조금 더 바깥으로
      const st = sideText(p, q, pts, t);
      const m0 = mul(add(p, q), 0.5);
      texts.push(o.tick?.[i] ? { ...st, at: rp(add(st.at, mul(unit(sub(st.at, m0)), 6))) } : st);
    }
    if (o.tick?.[i]) lines.push(...ticks(p, q, o.tick[i]));
  });
  return { kind: "shape", width: W, height: H, label, polygons: [{ points: pts }], lines, arcs: m.arcs, texts };
}

/** 세 변의 길이 [BC, CA, AB]로 세 각 [A, B, C] */
function anglesFromSides([a, b, c]: number[]): number[] {
  const ang = (x: number, y: number, z: number) => (Math.acos((y * y + z * z - x * x) / (2 * y * z)) * 180) / Math.PI;
  return [ang(a, b, c), ang(b, c, a), ang(c, a, b)];
}

/** 이등변삼각형(꼭지각 A)의 세 각. 꼭지각이 10° 단위라 밑각도 5의 배수 */
const isoAngles = (apex: number) => [apex, (180 - apex) / 2, (180 - apex) / 2];
/** 꼭지각이 위·아래·옆 어디로든 오도록 돌리는 각 */
const anyTurn = (rand: () => number) => pick(rand, [0, 0, 90, 180, 270, 30, -30]);

/* ════════ 변의 길이에 따라 분류하기 ════════ */

const SIDE_KINDS = ["정삼각형", "이등변삼각형", "세 변의 길이가 모두 다른 삼각형"];

export const triSideKind = easy("tri-side-kind", (rand) => {
  const kind = pick(rand, SIDE_KINDS);
  const a = randInt(rand, 5, 10);
  const other = a + pick(rand, [-3, -2, 2, 3, 4]);
  const sides = kind === "정삼각형" ? [a, a, a] : kind === "이등변삼각형" ? shuffle(rand, [a, a, other]) : shuffle(rand, [a, a + 2, a + randInt(rand, 4, 5)]);
  const [x, y, z] = [...sides].sort((p, q) => p - q);
  if (x + y <= z + 1) return null;
  const angles = anglesFromSides(sides);
  if (Math.min(...angles) < 25) return null;
  return {
    key: `${sides.join()}`,
    prompt: "삼각형의 이름으로 가장 알맞은 것을 고르세요.",
    visual: triScene(angles, "세 변의 길이가 적힌 삼각형", { sides: sides.map((s) => `${s} cm`), turn: pick(rand, [0, 0, 20, -20]) }),
    answer: kind,
    choices: SIDE_KINDS,
    hint: "길이가 같은 변이 몇 개인지 세어 보세요.",
    explanation: `세 변이 ${sides.join(" cm, ")} cm이므로 ${kind}입니다.`,
    mistakes: (kind === "정삼각형" ? { 이등변삼각형: "정삼각형도 이등변삼각형이지만, 세 변이 모두 같으니 가장 알맞은 이름은 정삼각형이에요." } : {}) as Record<string, string>,
  };
});

export const l4IsoPerimeter = mid("l4-iso-perimeter", (rand) => {
  const apex = randInt(rand, 3, 12) * 10;
  const [A, B] = isoAngles(apex);
  // 같은 두 변 s, 밑변 = 2s·sin(A/2)을 가까운 자연수로(그림과 크게 어긋나지 않게)
  const s = randInt(rand, 4, 12);
  const b = Math.round(2 * s * Math.sin(rad(apex / 2)));
  if (b < 2 || b === s || Math.abs(b - 2 * s * Math.sin(rad(apex / 2))) > 0.35) return null;
  return {
    key: `${apex}:${s}`,
    prompt: "이등변삼각형입니다. 세 변의 길이의 합은 몇 cm인가요?",
    visual: triScene([A, B, B], "길이가 같은 두 변을 표시한 이등변삼각형", { sides: [`${b} cm`, null, `${s} cm`], tick: [0, 1, 1], turn: anyTurn(rand) }),
    answer: 2 * s + b,
    unit: "cm",
    hint: "짧은 금이 그어진 두 변은 길이가 같아요.",
    explanation: `${s} + ${s} + ${b} = ${2 * s + b}(cm)`,
    mistakes: { [s + b]: "길이가 같은 변을 한 번만 더했어요." },
  };
});

export const l4IsoCondition = word("l4-iso-condition", (rand) => {
  const x = randInt(rand, 4, 12);
  const k = randInt(rand, 1, 5);
  const s = x + k;
  const p = 2 * s + x;
  const half = Math.asin(x / (2 * s));
  const apex = (2 * half * 180) / Math.PI;
  return {
    key: `${x}:${k}`,
    prompt: `이등변삼각형의 세 변의 길이의 합이 ${p} cm입니다. 길이가 같은 두 변은 각각 나머지 한 변보다 ${k} cm 더 깁니다. 나머지 한 변(□)은 몇 cm인가요?`,
    visual: triScene(isoAngles(apex), "나머지 한 변이 □ cm인 이등변삼각형", { sides: ["□ cm", null, null], tick: [0, 1, 1] }),
    answer: x,
    unit: "cm",
    hint: `세 변의 합에서 ${k} × 2를 빼면 세 변의 길이가 모두 같아진 것처럼 생각할 수 있어요.`,
    explanation: `${k} × 2 = ${2 * k}, ${p} − ${2 * k} = ${3 * x}, ${3 * x} ÷ 3 = ${x}(cm)`,
    mistakes: { [x + k]: "길이가 같은 변의 길이를 답했어요." },
  };
});

/* ════════ 이등변삼각형의 성질 ════════ */

export const l4IsoAnglesEasy = easy("l4-iso-angles-easy", (rand) => {
  const apex = randInt(rand, 3, 12) * 10;
  const base = (180 - apex) / 2;
  const askApex = rand() < 0.4;
  const left = rand() < 0.5;
  const marks: Mark[] = askApex ? ["㉠", `${base}°`, null] : [null, left ? `${base}°` : "㉠", left ? "㉠" : `${base}°`];
  return {
    key: `${apex}:${askApex}:${left}`,
    prompt: "이등변삼각형입니다. 각 ㉠의 크기는 몇 도인가요?",
    visual: triScene(isoAngles(apex), "길이가 같은 두 변을 표시한 이등변삼각형", { marks, tick: [0, 1, 1], turn: anyTurn(rand) }),
    answer: askApex ? apex : base,
    unit: "°",
    hint: askApex ? "이등변삼각형은 길이가 같은 두 변과 함께하는 두 각의 크기가 같아요. 세 각의 합은 180°예요." : "길이가 같은 두 변과 함께하는 두 각(밑각)의 크기는 같아요.",
    explanation: askApex ? `두 밑각이 ${base}°로 같으므로 ㉠ = 180° − ${base}° − ${base}° = ${apex}°` : `㉠은 ${base}°인 각과 크기가 같은 밑각이에요.`,
    mistakes: askApex ? { [180 - base]: "밑각 하나만 뺐어요. 두 밑각의 크기가 같아요." } : { [apex]: "길이가 같은 두 변 사이의 각을 구했어요." },
  };
});

export const triIsosceles = mid("tri-isosceles", (rand) => {
  const apex = randInt(rand, 3, 12) * 10;
  const base = (180 - apex) / 2;
  const askBase = rand() < 0.5;
  const marks: Mark[] = askBase ? [`${apex}°`, "㉠", null] : ["㉠", null, `${base}°`];
  return {
    key: `${apex}:${askBase}`,
    prompt: "이등변삼각형입니다. 각 ㉠의 크기는 몇 도인가요?",
    visual: triScene(isoAngles(apex), "길이가 같은 두 변을 표시한 이등변삼각형", { marks, tick: [0, 1, 1], turn: anyTurn(rand) }),
    answer: askBase ? base : apex,
    unit: "°",
    hint: "이등변삼각형은 두 밑각의 크기가 같고, 세 각의 합은 180°예요.",
    explanation: askBase ? `180° − ${apex}° = ${180 - apex}°, ${180 - apex}° ÷ 2 = ${base}°` : `180° − ${base}° − ${base}° = ${apex}°`,
    mistakes: askBase ? { [180 - apex]: "2로 나누지 않았어요." } : { [180 - base]: "밑각 하나만 뺐어요." },
  };
});

export const l4IsoExterior = mid("l4-iso-exterior", (rand) => {
  const apex = randInt(rand, 3, 12) * 10;
  const base = (180 - apex) / 2;
  const model = triModel(isoAngles(apex));
  const ext: Pt = [15, 0];
  const pts = fit([...model, ext], 320, 200, 36);
  const tri = pts.slice(0, 3);
  const m = cornerMarks(tri, [`${apex}°`, null, null]);
  const [A, B, C] = tri;
  // 늘인 변과 변 ㄷㄱ 사이의 바깥쪽 각
  const ex = cornerMarks([pts[3], C, A], [null, "㉠", null]);
  return {
    key: `${apex}`,
    prompt: "이등변삼각형의 한 변을 늘였습니다. 각 ㉠의 크기는 몇 도인가요?",
    visual: {
      kind: "shape",
      width: 320,
      height: 200,
      label: "밑변을 늘인 이등변삼각형",
      polygons: [{ points: tri }],
      lines: [{ from: C, to: pts[3] }, ...ticks(A, B, 1), ...ticks(C, A, 1)],
      arcs: [...m.arcs, ...ex.arcs],
      texts: [...m.texts, ...ex.texts],
    },
    answer: 180 - base,
    unit: "°",
    hint: "먼저 밑각을 구한 뒤, 직선이 이루는 각 180°에서 빼요.",
    explanation: `밑각: 180° − ${apex}° = ${180 - apex}°, ${180 - apex}° ÷ 2 = ${base}°, ㉠ = 180° − ${base}° = ${180 - base}°`,
    mistakes: { [base]: "밑각을 답했어요." },
  };
});

/* ════════ 정삼각형의 성질 ════════ */

export const triEquilateral = easy("tri-equilateral", (rand) => {
  const a = randInt(rand, 3, 15);
  const reverse = rand() < 0.5;
  return {
    key: `${reverse}:${a}`,
    prompt: reverse ? `정삼각형의 세 변의 길이의 합이 ${a * 3} cm입니다. 한 변(□)은 몇 cm인가요?` : "정삼각형입니다. 세 변의 길이의 합은 몇 cm인가요?",
    visual: triScene([60, 60, 60], "정삼각형", { sides: [reverse ? "□ cm" : `${a} cm`, null, null], tick: [1, 1, 1], turn: pick(rand, [0, 0, 180]) }),
    answer: reverse ? a : a * 3,
    unit: "cm",
    hint: "정삼각형은 세 변의 길이가 모두 같아요.",
    explanation: reverse ? `${a * 3} ÷ 3 = ${a}(cm)` : `${a} × 3 = ${a * 3}(cm)`,
  };
});

export const l4EquiChain = word("l4-equi-chain", (rand) => {
  const a = randInt(rand, 2, 9);
  const n = randInt(rand, 5, 15);
  const s = 60;
  const h = s * Math.sin(rad(60));
  const P = (i: number, top: boolean): Pt => rp([20 + (i * s) / 2 + (top ? s / 2 : 0), top ? 20 : 20 + h]);
  // 정삼각형 3개: 위로 선 것, 거꾸로 선 것, 위로 선 것
  const bottom = [P(0, false), P(2, false), P(4, false)];
  const top = [P(0, true), P(2, true)];
  const lines: Lines = [
    { from: bottom[0], to: bottom[2] },
    { from: top[0], to: top[1] },
    { from: bottom[0], to: top[0] },
    { from: top[0], to: bottom[1] },
    { from: bottom[1], to: top[1] },
    { from: top[1], to: bottom[2] },
  ];
  return {
    key: `${a}:${n}`,
    prompt: `한 변이 ${a} cm인 정삼각형을 그림과 같이 번갈아 뒤집어 가며 변끼리 맞닿게 한 줄로 이어 붙이고 있습니다. 정삼각형 ${n}개를 이어 붙인 도형의 둘레는 몇 cm인가요?`,
    visual: { kind: "shape", width: 2 * s + 40, height: Math.ceil(h + 40), label: "정삼각형 3개를 이어 붙인 도형", lines },
    answer: a * (n + 2),
    unit: "cm",
    hint: "정삼각형 1개, 2개, 3개일 때 둘레가 되는 변이 몇 개인지 세어 규칙을 찾아요.",
    explanation: `정삼각형이 1개 늘 때마다 둘레의 변이 1개씩 늘어요. ${n}개이면 둘레의 변 ${n} + 2 = ${n + 2}개 → ${a} × ${n + 2} = ${a * (n + 2)}(cm)`,
    mistakes: { [a * 3 * n]: "맞닿은 변까지 모두 셌어요." },
  };
});

/* ════════ 각의 크기에 따라 분류하기 ════════ */

/** 모눈 삼각형: 직각은 가로·세로 변으로만, 나머지는 직각과 12° 이상 차이 나게(눈으로 가를 수 있게) */
function latticeTri(rand: () => number, cols: number, rows: number, want?: Kind, minArea2 = 4): { pts: Pt[]; kind: Kind; angles: number[] } | null {
  const P = (): Pt => [randInt(rand, 0, cols), randInt(rand, 0, rows)];
  const pts = [P(), P(), P()];
  const angles = pts.map((v, i) => {
    const a = sub(pts[(i + 1) % 3], v);
    const b = sub(pts[(i + 2) % 3], v);
    const la = Math.hypot(...a);
    const lb = Math.hypot(...b);
    if (!la || !lb) return 0;
    return (Math.acos(Math.max(-1, Math.min(1, dot(a, b) / (la * lb)))) * 180) / Math.PI;
  });
  const [u, v] = [sub(pts[1], pts[0]), sub(pts[2], pts[0])];
  if (Math.min(...angles) < 22 || Math.abs(u[0] * v[1] - u[1] * v[0]) < minArea2) return null;
  const right = pts.findIndex((v, i) => dot(sub(pts[(i + 1) % 3], v), sub(pts[(i + 2) % 3], v)) === 0);
  let kind: Kind;
  if (right >= 0) {
    const a = sub(pts[(right + 1) % 3], pts[right]);
    if (a[0] !== 0 && a[1] !== 0) return null;
    kind = "직각삼각형";
  } else {
    if (angles.some((x) => Math.abs(x - 90) < 12)) return null;
    kind = Math.max(...angles) > 90 ? "둔각삼각형" : "예각삼각형";
  }
  if (want && kind !== want) return null;
  return { pts, kind, angles };
}

export const triAngleKind = easy("tri-angle-kind", (rand) => {
  const want = pick(rand, KINDS);
  let t = null;
  for (let i = 0; !t && i < 200; i++) t = latticeTri(rand, 6, 4, want, 8);
  if (!t) return null;
  const c = 28;
  const pts = t.pts.map(([x, y]): Pt => [(x + 1) * c, (y + 1) * c]);
  return {
    key: t.pts.join("|"),
    prompt: "모눈 위에 그린 삼각형을 각의 크기에 따라 분류하면 어떤 삼각형인가요?",
    visual: { kind: "shape", width: 8 * c, height: 6 * c, grid: c, label: "모눈 위의 삼각형", polygons: [{ points: pts }] },
    answer: want,
    choices: [...KINDS],
    hint: "세 각 중 가장 큰 각을 찾아 직각(모눈의 가로·세로 선이 만나는 각)과 비교해요.",
    explanation: `가장 큰 각이 ${want === "직각삼각형" ? "직각" : want === "둔각삼각형" ? "직각보다 커서 둔각" : "직각보다 작아서 예각"}이므로 ${want}입니다.`,
  };
});

export const m4TriTwoAngles = mid("m4-tri-two-angles", (rand) => {
  const want = pick(rand, KINDS);
  const big = want === "직각삼각형" ? 90 : want === "둔각삼각형" ? niceAngle(rand, 100, 130) : niceAngle(rand, 65, 85);
  const x = niceAngle(rand, 25, 180 - big - 25);
  const y = 180 - big - x;
  if (y < 25 || (want === "예각삼각형" && (x >= 90 || y >= 90 || Math.max(x, y) > big))) return null;
  const angles = shuffle(rand, [big, x, y]);
  const hide = angles.indexOf(big);
  return {
    key: `${angles.join()}`,
    prompt: "삼각형의 두 각의 크기를 나타낸 것입니다. 이 삼각형은 각의 크기에 따라 어떤 삼각형인가요?",
    visual: triScene(angles, "두 각의 크기가 적힌 삼각형", { marks: angles.map((v, i) => (i === hide ? null : `${v}°`)) }),
    answer: want,
    choices: [...KINDS],
    hint: "먼저 나머지 한 각을 구하고, 가장 큰 각을 보세요.",
    explanation: `나머지 한 각: 180° − ${angles.filter((_, i) => i !== hide).join("° − ")}° = ${big}° → ${want}`,
  };
});

export const l4TriKindCount = mid("l4-tri-kind-count", (rand) => {
  const kind = pick(rand, ["예각삼각형", "둔각삼각형"] as const);
  const c = 20;
  const tris: { pts: Pt[]; kind: Kind }[] = [];
  const wants = shuffle(rand, [kind, pick(rand, KINDS), pick(rand, KINDS), "직각삼각형", kind === "예각삼각형" ? "둔각삼각형" : "예각삼각형"] as Kind[]);
  for (const w of wants) {
    let t = null;
    for (let i = 0; !t && i < 300; i++) t = latticeTri(rand, 3, 3, w);
    if (!t) return null;
    tris.push(t);
  }
  // 휴대폰(360px 화면, 그림 칸 약 260px)에서도 글자가 줄지 않게 두 줄(위 3개, 아래 2개)로 놓는다.
  // 아래 줄 번호가 윗줄 삼각형의 것으로 읽히지 않게 줄 사이를 한 칸 더 띄운다
  const cell = (k: number): Pt => [1 + (k % 3) * 4, 2 + Math.floor(k / 3) * 6];
  const polygons = tris.map((t, k) => ({ points: t.pts.map(([x, y]): Pt => [(cell(k)[0] + x) * c, (cell(k)[1] + y) * c]) }));
  const count = tris.filter((t) => t.kind === kind).length;
  return {
    key: `${kind}:${tris.map((t) => t.pts.join("|")).join("/")}`,
    prompt: `모눈 위에 그린 삼각형 중에서 ${kind}은 모두 몇 개인가요?`,
    visual: {
      kind: "shape",
      width: 13 * c,
      height: 12 * c,
      grid: c,
      label: "모눈 위의 삼각형 ①~⑤",
      polygons,
      texts: tris.map((_, k) => ({ at: [(cell(k)[0] + 1.5) * c, (cell(k)[1] - 1) * c] as Pt, text: "①②③④⑤"[k] })),
    },
    answer: count,
    unit: "개",
    hint: "삼각형마다 가장 큰 각이 예각인지, 직각인지, 둔각인지 확인해요.",
    explanation: tris.map((t, k) => `${"①②③④⑤"[k]} ${t.kind}`).join(", ") + ` → ${kind} ${count}개`,
  };
});

/* ════════ 두 가지 기준으로 분류하기 ════════ */

export const l4TriBothAngles = mid("l4-tri-both-angles", (rand) => {
  const base = randInt(rand, 4, 16) * 5;
  const top = 180 - 2 * base;
  const g = top > 90 ? "둔각삼각형" : top === 90 ? "직각삼각형" : "예각삼각형";
  const s = top === 60 ? "정삼각형" : "이등변삼각형";
  const answer = `${s}이면서 ${g}`;
  const pool = ["이등변삼각형이면서 예각삼각형", "이등변삼각형이면서 직각삼각형", "이등변삼각형이면서 둔각삼각형", "정삼각형이면서 예각삼각형", "세 변의 길이가 모두 다른 삼각형이면서 둔각삼각형"];
  return {
    key: `${base}`,
    prompt: "삼각형의 두 각의 크기를 나타낸 것입니다. 이 삼각형을 변의 길이와 각의 크기, 두 가지 기준으로 분류한 이름을 고르세요.",
    visual: triScene(isoAngles(top), "두 각의 크기가 적힌 삼각형", { marks: [null, `${base}°`, `${base}°`], turn: anyTurn(rand) }),
    answer,
    // 정삼각형은 이등변삼각형이기도 하므로, 정답이 정삼각형이면 '이등변삼각형이면서 예각삼각형'도 맞는 보기가 된다 → 뺀다
    choices: opts(rand, answer, shuffle(rand, pool.filter((x) => x !== answer && !(s === "정삼각형" && x === "이등변삼각형이면서 예각삼각형"))), () => "세 변의 길이가 모두 다른 삼각형이면서 예각삼각형"),
    hint: "두 각의 크기가 같은 삼각형은 이등변삼각형이에요. 나머지 한 각을 구해 각의 크기로도 분류해요.",
    explanation: `두 각이 ${base}°로 같으므로 ${s === "정삼각형" ? "세 각이 모두 60°인 정삼각형" : "이등변삼각형"}, 나머지 각 ${top}° → ${answer}`,
  };
});

export const l4TriBothTable = word("l4-tri-both-table", (rand) => {
  const g = pick(rand, ["예각삼각형", "둔각삼각형", "직각삼각형"] as const);
  const target = `이등변삼각형이면서 ${g}`;
  // 삼각형 4개: 각 두 개씩 적혀 있고, 나머지 한 각은 계산으로
  const make = (): { angles: number[]; iso: boolean; kind: Kind } | null => {
    const iso = rand() < 0.55;
    if (iso) {
      const apex = pick(rand, [30, 40, 50, 70, 80, 90, 90, 100, 110, 120]);
      return { angles: isoAngles(apex), iso: true, kind: kindOf(isoAngles(apex)) };
    }
    const a = niceAngle(rand, 25, 110);
    const b = niceAngle(rand, 25, 150 - a);
    const c2 = 180 - a - b;
    if (c2 < 25 || new Set([a, b, c2]).size < 3) return null;
    return { angles: [a, b, c2], iso: false, kind: kindOf([a, b, c2]) };
  };
  const items: { angles: number[]; iso: boolean; kind: Kind }[] = [];
  for (let i = 0; items.length < 4 && i < 60; i++) {
    const t = make();
    if (t) items.push(t);
  }
  if (items.length < 4) return null;
  const count = items.filter((t) => t.iso && t.kind === g).length;
  if (count === 0 && rand() < 0.8) return null;
  // 두 칸 × 두 줄: 휴대폰(360px 화면, 그림 칸 약 260px)에서 글자가 12px 이상이 되게 전체 폭 300 이하
  const W = 150;
  const H = 140;
  const scenes = items.map((t) => {
    // 두 각만 적는다(이등변이면 한 밑각과 꼭지각 또는 두 밑각)
    const hide = randInt(rand, 0, 2);
    return triScene(t.angles, "", { marks: t.angles.map((v, i) => (i === hide ? null : `${v}°`)), W, H, pad: 18, turn: pick(rand, [0, 0, 180]) });
  });
  const shift = (p: Pt, k: number): Pt => [p[0] + (k % 2) * W, p[1] + Math.floor(k / 2) * H + 16];
  return {
    key: `${g}:${items.map((t) => t.angles.join()).join("/")}`,
    prompt: `삼각형 ①~④에 두 각의 크기가 적혀 있습니다. ${target}은 모두 몇 개인가요?`,
    visual: {
      kind: "shape",
      width: 2 * W,
      height: 2 * H + 16,
      label: "두 각의 크기가 적힌 삼각형 ①~④",
      polygons: scenes.map((s, k) => ({ points: s.polygons![0].points.map((p) => shift(p, k)) })),
      arcs: scenes.flatMap((s, k) => (s.arcs ?? []).map((a) => ({ ...a, c: shift(a.c, k) }))),
      texts: [
        ...scenes.flatMap((s, k) => (s.texts ?? []).map((t) => ({ ...t, at: shift(t.at, k) }))),
        ...items.map((_, k) => ({ at: shift([16, 4], k), text: MARKS[k] })),
      ],
    },
    answer: count,
    unit: "개",
    hint: "삼각형마다 나머지 한 각을 구해요. 크기가 같은 두 각이 있으면 이등변삼각형이고, 가장 큰 각으로 예각·직각·둔각삼각형을 가려요.",
    explanation: items.map((t, k) => `${MARKS[k]} ${t.angles.join("°, ")}° → ${t.iso ? "이등변삼각형" : "세 변의 길이가 모두 다른 삼각형"}, ${t.kind}`).join(" / ") + ` → ${count}개`,
  };
});

export const l4TriBothDraw = word("l4-tri-both-draw", (rand) => {
  // 밑변 ㄴㄷ(가로)의 수직이등분선 위의 점은 이등변삼각형의 꼭짓점이 된다
  const w = randInt(rand, 2, 3);
  const g = pick(rand, ["예각삼각형", "직각삼각형", "둔각삼각형"] as const);
  const cols = 2 * w + 4;
  const rows = 6;
  const by = rows - 1;
  const bx = 2;
  const mx = bx + w;
  const heights: Record<Kind, number> = { 직각삼각형: w, 둔각삼각형: w - 1, 예각삼각형: w + randInt(rand, 1, 2) };
  const onAxis = (k: Kind): Pt => [mx, by - heights[k]];
  const right = onAxis(g);
  // 헷갈리는 점: 같은 선 위의 다른 두 종류, 그리고 선 밖에서 같은 종류가 되는 점
  const others = KINDS.filter((k) => k !== g).map(onAxis);
  const off: Pt = [mx + pick(rand, [-1, 1]) * (g === "둔각삼각형" ? 1 : 2), right[1]];
  const cands = shuffle(rand, [right, ...others, off]);
  if (new Set(cands.map((p) => p.join())).size < 4 || cands.some((p) => p[1] < 0)) return null;
  const c = 26;
  const s = (p: Pt): Pt => [(p[0] + 1) * c, (p[1] + 1) * c];
  const B: Pt = [bx, by];
  const C: Pt = [bx + 2 * w, by];
  return {
    key: `${w}:${g}:${cands.join("|")}`,
    prompt: `선분 ㄴㄷ의 양 끝과 점 ①~④ 중 하나를 이어 삼각형을 만들려고 합니다. 이등변삼각형이면서 ${g}이 되는 점을 고르세요.`,
    visual: {
      kind: "shape",
      width: (cols + 1) * c,
      height: (rows + 1) * c,
      grid: c,
      label: "모눈 위의 선분 ㄴㄷ과 점 ①~④",
      lines: [{ from: s(B), to: s(C) }],
      dots: [s(B), s(C), ...cands.map(s)],
      texts: [
        { at: [s(B)[0] - 12, s(B)[1] + 12], text: "ㄴ" },
        { at: [s(C)[0] + 12, s(C)[1] + 12], text: "ㄷ" },
        ...cands.map((p, i) => ({ at: [s(p)[0] + 11, s(p)[1] - 11] as Pt, text: MARKS[i] })),
      ],
    },
    answer: MARKS[cands.indexOf(right)],
    choices: MARKS,
    hint: "선분 ㄴㄷ의 한가운데를 지나는 세로선 위의 점을 이으면 두 변의 길이가 같아요. 그다음 가장 큰 각이 예각·직각·둔각 중 어느 것인지 보세요.",
    explanation: `${josa(MARKS[cands.indexOf(right)], "은/는")} 선분 ㄴㄷ의 한가운데 위에 있어 두 변의 길이가 같고, 가장 큰 각이 ${g === "직각삼각형" ? "직각" : g === "둔각삼각형" ? "둔각" : "예각"}이에요.`,
  };
});
