import type { ShapeScene } from "../types";
import { pick, randInt, shuffle } from "../../lib/random";
import { josa } from "../josa";
import { choices4, easy, hard, mid, nameOf, truth, twoNames } from "./g3-kit";
import { miniClock, rect, ruler, scene, type Parts, type Pt } from "./g3-figures";

/**
 * 3학년 도형 단원: 3-1 '평면도형', 3-2 '원' 차시별 생성기.
 * 도형 차시는 그림을 보고 푸는 교과서 대표 유형을 기본으로 한다(각 읽기, 직각 찾기, 도형 고르기, 컴퍼스 벌리기 등).
 * 3-1 2단원은 나눗셈(3단원)과 두 자리 곱셈(4단원)보다 앞이라 둘레는 덧셈으로 구하게 한다.
 */

const KO = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ"];
const NAMES4 = ["가", "나", "다", "라", "마", "바"];

/* ── 도형 좌표 도구 ── */

const r1 = (v: number) => Math.round(v * 10) / 10;
const rotate = (p: Pt, deg: number): Pt => {
  const a = (deg * Math.PI) / 180;
  return [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
};
/** 점들을 deg만큼 돌리고, (cx, cy)를 중심으로 가로 w·세로 h 안에 들어오게 크기를 맞춘다 */
function fit(points: Pt[], deg: number, cx: number, cy: number, w: number, h: number): Pt[] {
  const ps = points.map((p) => rotate(p, deg));
  const xs = ps.map((p) => p[0]);
  const ys = ps.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const k = Math.min(w / (x1 - x0 || 1), h / (y1 - y0 || 1));
  return ps.map(([x, y]) => [r1(cx + (x - (x0 + x1) / 2) * k), r1(cy + (y - (y0 + y1) / 2) * k)]);
}
/** 꼭짓점 p에서 두 이웃 점을 향한 두 변이 직각인지 */
const isRight = (a: Pt, p: Pt, b: Pt) => Math.abs((a[0] - p[0]) * (b[0] - p[0]) + (a[1] - p[1]) * (b[1] - p[1])) < 1e-6;
const rightCount = (pts: Pt[]) => pts.filter((p, i) => isRight(pts[(i + pts.length - 1) % pts.length], p, pts[(i + 1) % pts.length])).length;
/** 다각형의 꼭짓점 이름 자리: 무게중심에서 바깥쪽으로 d만큼 */
function outward(pts: Pt[], i: number, d = 14): Pt {
  const c: Pt = [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
  const [x, y] = pts[i];
  const len = Math.hypot(x - c[0], y - c[1]) || 1;
  return [r1(x + ((x - c[0]) / len) * d), r1(y + ((y - c[1]) / len) * d)];
}

/** 직각 수를 아는 도형 틀(수학 좌표, 크기는 fit으로 맞춘다). 직각이 아닌 각은 90°에서 15° 이상 떨어져 눈으로 헷갈리지 않는다 */
const SHAPES: { name: string; pts: Pt[] }[] = [
  { name: "삼각형", pts: [[0, 0], [120, 0], [40, 90]] },
  { name: "직각삼각형", pts: [[0, 0], [120, 0], [0, 80]] },
  { name: "사각형1", pts: [[0, 0], [110, 0], [150, 80], [0, 30]] },
  { name: "사다리꼴", pts: [[0, 0], [90, 0], [130, 80], [0, 80]] },
  { name: "오각형2", pts: [[0, 40], [50, 10], [100, 40], [100, 100], [0, 100]] },
  { name: "오각형3", pts: [[0, 0], [120, 0], [120, 100], [40, 100], [0, 50]] },
  { name: "직사각형", pts: [[0, 0], [130, 0], [130, 80], [0, 80]] },
];

/* ── 선분·반직선·직선 ── */

const LINE_KINDS = ["선분", "반직선", "직선"] as const;

/** 두 점과 곧은 선: 반직선·직선은 점 밖으로 그림 끝까지 곧게 늘인다(교과서 표기) */
function lineScene(kind: (typeof LINE_KINDS)[number], reversed: boolean, x1: number, x2: number, p: string, q: string): ShapeScene {
  const y = 34;
  const from = kind === "선분" ? x1 : kind === "직선" || reversed ? 8 : x1;
  const to = kind === "선분" ? x2 : kind === "직선" || !reversed ? 252 : x2;
  return scene(260, 70, "두 점과 곧은 선", {
    lines: [{ from: [from, y], to: [to, y] }],
    dots: [
      [x1, y],
      [x2, y],
    ],
    texts: [
      { at: [x1, y + 20], text: p },
      { at: [x2, y + 20], text: q },
    ],
  });
}

export const geoLineKind = easy("geo-line-kind", (rand) => {
  const kind = pick(rand, LINE_KINDS);
  const reversed = kind === "반직선" && rand() < 0.5;
  const [x1, x2] = [randInt(rand, 60, 90), randInt(rand, 170, 200)];
  return {
    key: `${kind}:${reversed}:${x1}:${x2}`,
    prompt: "그림과 같은 곧은 선의 이름을 고르세요.",
    visual: lineScene(kind, reversed, x1, x2, "ㄱ", "ㄴ"),
    answer: kind,
    choices: [...LINE_KINDS],
    hint: "양쪽 끝이 점에서 끝나면 선분, 한쪽으로만 끝없이 늘이면 반직선, 양쪽으로 끝없이 늘이면 직선이에요.",
    explanation: `그림은 ${kind}입니다.`,
  };
});

export const rayName = mid("l3-ray-name", (rand) => {
  const i = randInt(rand, 0, 3) * 2;
  const [p, q] = [KO[i], KO[i + 1]];
  const reversed = rand() < 0.5;
  const [x1, x2] = [randInt(rand, 60, 90), randInt(rand, 160, 190)];
  const start = reversed ? q : p;
  const through = reversed ? p : q;
  const answer = `반직선 ${start}${through}`;
  return {
    key: `${p}${q}:${reversed}:${x1}:${x2}`,
    prompt: "그림의 곧은 선의 이름을 바르게 쓴 것을 고르세요.",
    visual: lineScene("반직선", reversed, x1, x2, p, q),
    answer,
    choices: [`반직선 ${p}${q}`, `반직선 ${q}${p}`, `선분 ${p}${q}`, `직선 ${p}${q}`],
    hint: "반직선은 시작하는 점을 먼저 읽어요.",
    explanation: `점 ${start}에서 시작하여 점 ${through} 쪽으로 늘였으므로 ${answer}입니다.`,
    mistakes: { [`반직선 ${through}${start}`]: "반직선은 시작점을 먼저 써야 해요." },
  };
});

export const lineTruth = truth("l3-line-truth", 2, "선분, 반직선, 직선", {
  t: [
    "선분은 두 점을 곧게 이은 선입니다.",
    "반직선은 한 점에서 시작하여 한쪽으로 끝없이 늘인 곧은 선입니다.",
    "직선은 선분을 양쪽으로 끝없이 늘인 곧은 선입니다.",
    "반직선 ㄱㄴ과 반직선 ㄴㄱ은 서로 다릅니다.",
    "두 점을 지나는 직선은 1개뿐입니다.",
  ],
  f: [
    "선분은 한쪽으로 끝없이 늘인 선입니다.",
    "직선은 양 끝이 있습니다.",
    "반직선 ㄱㄴ과 반직선 ㄴㄱ은 같습니다.",
    "굽은 선도 선분이라고 합니다.",
    "두 점을 지나는 직선은 여러 개 그을 수 있습니다.",
  ],
});

export const segmentsOnLine = hard("w3-segments", (rand) => {
  const n = randInt(rand, 3, 5);
  const gap = n === 5 ? 56 : 70;
  const x0 = 130 - ((n - 1) * gap) / 2 + 10;
  const xs = Array.from({ length: n }, (_, i) => x0 + i * gap + (i > 0 && i < n - 1 ? randInt(rand, -8, 8) : 0));
  return {
    key: `${n}:${xs.join(":")}`,
    prompt: "그림과 같이 직선 위에 점이 있습니다. 이 중 두 점을 이어 그을 수 있는 선분은 모두 몇 개인가요?",
    visual: scene(280, 70, `직선 위의 점 ${n}개`, {
      lines: [{ from: [8, 30], to: [272, 30] }],
      dots: xs.map((x) => [x, 30] as Pt),
      texts: xs.map((x, i) => ({ at: [x, 50] as Pt, text: KO[i] })),
    }),
    answer: (n * (n - 1)) / 2,
    unit: "개",
    hint: "점 ㄱ에서 그을 수 있는 선분, 점 ㄴ에서 새로 그을 수 있는 선분… 차례로 세어요.",
    explanation: `${Array.from({ length: n - 1 }, (_, i) => n - 1 - i).join(" + ")} = ${(n * (n - 1)) / 2}(개)`,
    mistakes: { [n * (n - 1)]: "선분 ㄱㄴ과 선분 ㄴㄱ은 같은 선분이에요. 두 번 세지 않아요." },
  };
});

/** 어느 세 점도 한 직선 위에 있지 않은 점 3~4개 */
const SPOTS: Pt[][] = [
  [
    [60, 40],
    [200, 50],
    [120, 130],
  ],
  [
    [50, 110],
    [110, 30],
    [210, 110],
  ],
  [
    [50, 40],
    [190, 30],
    [220, 120],
    [70, 130],
  ],
  [
    [120, 25],
    [220, 80],
    [140, 140],
    [40, 90],
  ],
];

export const rayCount = hard("l3-ray-count", (rand) => {
  const spots = pick(rand, SPOTS);
  const n = spots.length;
  const ray = rand() < 0.5;
  const answer = ray ? n * (n - 1) : (n * (n - 1)) / 2;
  return {
    key: `${SPOTS.indexOf(spots)}:${ray}`,
    prompt: `그림의 점 중에서 두 점을 지나는 ${ray ? "반직선" : "직선"}을 그으려고 합니다. 그을 수 있는 ${ray ? "반직선" : "직선"}은 모두 몇 개인가요?`,
    visual: scene(260, 160, `점 ${n}개`, { dots: spots, texts: spots.map((_, i) => ({ at: outward(spots, i, 16), text: KO[i] })) }),
    answer,
    unit: "개",
    hint: ray ? "반직선은 시작점이 다르면 다른 반직선이에요. 점마다 나머지 점 쪽으로 그어 보세요." : "두 점마다 직선이 1개씩 생겨요. 같은 직선을 두 번 세지 않도록 해요.",
    explanation: ray ? `점마다 다른 점 ${n - 1}개 쪽으로 → ${Array(n).fill(n - 1).join(" + ")} = ${answer}(개)` : `${Array.from({ length: n - 1 }, (_, i) => n - 1 - i).join(" + ")} = ${answer}(개)`,
    mistakes: ray ? { [(n * (n - 1)) / 2]: "반직선 ㄱㄴ과 반직선 ㄴㄱ은 서로 달라요." } : { [n * (n - 1)]: "직선 ㄱㄴ과 직선 ㄴㄱ은 같은 직선이에요." },
  };
});

/* ── 각 ── */

function regularPolygon(n: number, cx: number, cy: number, r: number, turn = 0): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * i) / n - Math.PI / 2 + turn;
    return [r1(cx + r * Math.cos(a)), r1(cy + r * Math.sin(a))];
  });
}

export const geoCountAngles = easy("geo-count-angles", (rand) => {
  const n = randInt(rand, 3, 6);
  const ask = rand() < 0.6 ? "각" : pick(rand, ["꼭짓점", "변"]);
  const turn = (randInt(rand, 0, 5) * Math.PI) / 18;
  return {
    key: `${n}:${ask}:${turn}`,
    prompt: `도형의 ${josa(ask, "은/는")} 몇 개인가요?`,
    visual: scene(200, 160, `곧은 선으로 둘러싸인 도형`, { polygons: [{ points: regularPolygon(n, 100, 82, 66, turn) }] }),
    answer: n,
    unit: "개",
    hint: ask === "각" ? "두 변이 만나는 곳마다 각이 하나씩 있어요. 빠뜨리지 않도록 표시하며 세어 보세요." : "빠뜨리지 않도록 표시하며 세어 보세요.",
    explanation: `이 도형의 ${josa(ask, "은/는")} ${n}개입니다.`,
  };
});

/** 꼭짓점 v에서 두 방향(화면 각도, 오른쪽 0°·시계 반대 방향)으로 그은 각 */
function angleParts(v: Pt, d1: number, d2: number, len: number): { lines: Parts["lines"]; ends: [Pt, Pt] } {
  const at = (deg: number, r: number): Pt => [r1(v[0] + r * Math.cos((deg * Math.PI) / 180)), r1(v[1] - r * Math.sin((deg * Math.PI) / 180))];
  return {
    lines: [
      { from: v, to: at(d1, len) },
      { from: v, to: at(d2, len) },
    ],
    ends: [at(d1, len * 0.7), at(d2, len * 0.7)],
  };
}

export const angleName = mid("l3-angle-name", (rand) => {
  const [A, V, B] = shuffle(rand, KO).slice(0, 3);
  const d1 = randInt(rand, 0, 7) * 45 + randInt(rand, -10, 10);
  const d2 = d1 + randInt(rand, 5, 13) * 10;
  const v: Pt = [130, 90];
  const { lines, ends } = angleParts(v, d1, d2, 80);
  // 이름 글자는 각의 바깥쪽(두 변의 반대 방향)에 둔다
  const mid2 = ((d1 + d2) / 2) * (Math.PI / 180);
  const vLabel: Pt = [r1(v[0] - 18 * Math.cos(mid2)), r1(v[1] + 18 * Math.sin(mid2))];
  const side = (d: number, sgn: number): Pt => {
    const a = ((d + sgn * 90) * Math.PI) / 180;
    const e = d === d1 ? ends[0] : ends[1];
    return [r1(e[0] + 16 * Math.cos(a)), r1(e[1] - 16 * Math.sin(a))];
  };
  const visual = scene(260, 180, "꼭짓점과 두 변 위의 점에 이름을 붙인 각", {
    lines,
    dots: [v, ...ends],
    texts: [
      { at: vLabel, text: V },
      { at: side(d1, -1), text: A },
      { at: side(d2, 1), text: B },
    ],
  });
  const askName = rand() < 0.6;
  if (askName) {
    const answer = rand() < 0.5 ? `각 ${A}${V}${B}` : `각 ${B}${V}${A}`;
    return {
      key: `n:${A}${V}${B}:${d1}:${d2}`,
      prompt: "그림의 각을 바르게 읽은 것을 고르세요.",
      visual,
      answer,
      choices: shuffle(rand, [answer, `각 ${V}${A}${B}`, `각 ${A}${B}${V}`, `각 ${V}${B}${A}`]),
      hint: "각을 읽을 때는 꼭짓점을 가운데에 읽어요.",
      explanation: `꼭짓점이 점 ${V}이므로 각 ${A}${V}${B} 또는 각 ${josa(`${B}${V}${A}`, "이라고/라고")} 읽어요.`,
    };
  }
  return {
    key: `v:${A}${V}${B}:${d1}:${d2}`,
    prompt: "그림에서 각의 꼭짓점을 고르세요.",
    visual,
    answer: `점 ${V}`,
    choices: shuffle(rand, [`점 ${A}`, `점 ${V}`, `점 ${B}`, `선분 ${A}${B}`]),
    hint: "각의 두 변이 만나는 점이 꼭짓점이에요.",
    explanation: `두 변(반직선 ${V}${A}, 반직선 ${V}${B})이 만나는 점 ${V}이 꼭짓점입니다.`,
  };
});

export const angleFan = mid("l3-angle-fan", (rand) => {
  const k = randInt(rand, 3, 5);
  const o: Pt = [30, 140];
  const letters = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ"];
  const ends: Pt[] = Array.from({ length: k }, (_, i) => {
    const a = (Math.PI / 2) * (i / (k - 1));
    return [Math.round(o[0] + 150 * Math.cos(a)), Math.round(o[1] - 120 * Math.sin(a))];
  });
  return {
    key: `${k}`,
    prompt: "그림에서 찾을 수 있는 크고 작은 각은 모두 몇 개인가요?",
    visual: scene(210, 160, `한 점에서 그은 반직선 ${k}개`, {
      lines: ends.map((e) => ({ from: o, to: e, arrows: "end" as const })),
      dots: [o],
      texts: [{ at: [o[0] - 14, o[1] + 6], text: "ㅇ" }, ...ends.map((e, i) => ({ at: [e[0] + 12, e[1] - 10] as Pt, text: letters[i] }))],
    }),
    answer: (k * (k - 1)) / 2,
    unit: "개",
    hint: "작은 각 1개짜리, 2개가 합쳐진 각, … 순서로 빠짐없이 세어요.",
    explanation: `${Array.from({ length: k - 1 }, (_, i) => k - 1 - i).join(" + ")} = ${(k * (k - 1)) / 2}(개)`,
    mistakes: { [k - 1]: "작은 각만 셌어요. 여러 개가 합쳐진 큰 각도 세어야 해요." },
  };
});

export const angleTruth = truth("l3-angle-truth", 3, "각", {
  t: [
    "각은 한 점에서 그은 두 반직선으로 이루어진 도형입니다.",
    "각의 꼭짓점은 1개입니다.",
    "각을 이루는 두 반직선을 각의 변이라고 합니다.",
    "삼각형에는 각이 3개 있습니다.",
    "원에는 각이 없습니다.",
  ],
  f: [
    "각의 변은 3개입니다.",
    "굽은 선으로 이루어진 도형도 각이 될 수 있습니다.",
    "원에는 각이 1개 있습니다.",
    "각을 이루는 두 반직선은 서로 다른 점에서 시작합니다.",
    "사각형에는 각이 3개 있습니다.",
  ],
});

type FigKind = "angle" | "gap" | "curve";

/** 칸 안의 작은 그림: 각, 두 선이 만나지 않은 것, 한 변이 굽은 선인 것 */
function smallFigure(kind: FigKind, cx: number, cy: number, rand: () => number): Parts {
  const d1 = randInt(rand, 0, 3) * 90 + randInt(rand, 5, 30);
  const d2 = d1 + randInt(rand, 5, 11) * 10;
  const v: Pt = [r1(cx - 18 * Math.cos(((d1 + d2) / 2) * (Math.PI / 180))), r1(cy + 18 * Math.sin(((d1 + d2) / 2) * (Math.PI / 180)))];
  const at = (d: number, r: number, from: Pt = v): Pt => [r1(from[0] + r * Math.cos((d * Math.PI) / 180)), r1(from[1] - r * Math.sin((d * Math.PI) / 180))];
  if (kind === "angle") return { lines: [{ from: v, to: at(d1, 38) }, { from: v, to: at(d2, 38) }] };
  if (kind === "gap") return { lines: [{ from: at(d1, 9), to: at(d1, 38) }, { from: v, to: at(d2, 38) }] };
  // 굽은 선: 꼭짓점에서 d1 방향으로 출발해 휘어지는 호(중심은 꼭짓점에서 d1 + 90° 쪽)
  const rr = 30;
  const c = at(d1 + 90, rr);
  const start = d1 - 90;
  return { lines: [{ from: v, to: at(d2, 38) }], arcs: [{ c, r: rr, from: start, to: start + 70, width: 2 }] };
}

export const anglePick = hard("l3-angle-pick", (rand) => {
  const k = randInt(rand, 2, 4);
  const kinds = shuffle(rand, [...Array<FigKind>(k).fill("angle"), ...Array.from({ length: 6 - k }, () => pick(rand, ["gap", "curve"] as FigKind[]))]);
  const parts = kinds.map((kind, i) => smallFigure(kind, 60 + (i % 3) * 110, 50 + Math.floor(i / 3) * 110, rand));
  return {
    key: kinds.join(","),
    prompt: "그림에서 각은 모두 몇 개인가요?",
    visual: scene(340, 220, "여러 가지 곧은 선과 굽은 선 그림 6개", ...parts, {
      texts: kinds.map((_, i) => ({ at: [60 + (i % 3) * 110, 98 + Math.floor(i / 3) * 110] as Pt, text: NAMES4[i] })),
    }),
    answer: k,
    unit: "개",
    hint: "각은 한 점에서 그은 두 반직선(곧은 선)으로 이루어져요. 두 선이 만나지 않거나 굽은 선이 있으면 각이 아니에요.",
    explanation: `각인 것: ${kinds.map((x, i) => (x === "angle" ? NAMES4[i] : "")).filter(Boolean).join(", ")} → ${k}개`,
    mistakes: { 6: "두 선이 만나지 않거나 굽은 선이 있는 그림은 각이 아니에요." },
  };
});

/* ── 직각 ── */

export const rightClock = easy("l3-right-clock", (rand) => {
  const right = pick(rand, [3, 9]);
  const others = shuffle(rand, [1, 2, 4, 5, 6, 7, 8, 10, 11, 12]).slice(0, 3);
  const hours = shuffle(rand, [right, ...others]);
  const answer = NAMES4[hours.indexOf(right)];
  const at = (i: number): Pt => [60 + (i % 2) * 120, 50 + Math.floor(i / 2) * 104];
  return {
    key: hours.join(":"),
    prompt: "시계의 긴바늘과 짧은바늘이 이루는 각이 직각인 것을 고르세요.",
    visual: scene(240, 216, "정각을 가리키는 시계 4개", ...hours.map((h, i) => miniClock(at(i), h)), {
      texts: hours.map((_, i) => ({ at: [at(i)[0], at(i)[1] + 52] as Pt, text: NAMES4[i] })),
    }),
    answer,
    choices: NAMES4.slice(0, 4),
    hint: "긴바늘이 12를 가리킬 때 짧은바늘이 3이나 9를 가리키면 두 바늘이 직각을 이뤄요.",
    explanation: `${answer} 시계(${right}시)의 두 바늘이 직각을 이룹니다.`,
  };
});

export const geoRightAngles = mid("geo-right-angles", (rand) => {
  const t = pick(rand, SHAPES.slice(0, 6));
  const deg = randInt(rand, 0, 11) * 30 + pick(rand, [0, 15]);
  const pts = fit(t.pts, deg, 110, 85, 150, 120);
  return {
    key: `${t.name}:${deg}`,
    prompt: "도형에서 직각은 모두 몇 개인가요?",
    visual: scene(220, 170, "곧은 선으로 둘러싸인 도형", { polygons: [{ points: pts }] }),
    answer: rightCount(t.pts),
    unit: "개",
    hint: "삼각자의 직각 부분을 꼭짓점마다 대어 보며 세어요. 도형이 기울어져 있어도 직각은 직각이에요.",
    explanation: `꼭짓점마다 확인하면 직각은 ${rightCount(t.pts)}개입니다.`,
  };
});

/** 모눈에서 점 ㄴ을 꼭짓점으로 직각이 되는 점 고르기 */
const GRID_DIRS: Pt[] = [
  [4, 0],
  [0, -3],
  [-4, 0],
  [0, 3],
  [3, 1],
  [1, -3],
  [-3, -1],
  [2, 2],
];

export const rightGrid = mid("l3-right-grid", (rand) => {
  const g = 20;
  const v: Pt = [randInt(rand, 4, 6), randInt(rand, 4, 5)];
  const d = pick(rand, GRID_DIRS);
  const a: Pt = [v[0] + d[0], v[1] + d[1]];
  const k = pick(rand, [1, -1]);
  const perp: Pt = [-d[1] * k, d[0] * k];
  const inGrid = (p: Pt) => p[0] >= 1 && p[0] <= 10 && p[1] >= 1 && p[1] <= 8;
  const right: Pt = [v[0] + perp[0], v[1] + perp[1]];
  if (!inGrid(a) || !inGrid(right)) return null;
  // 틀린 점: 직각이 되는 점에서 한 칸 비껴간 점(선분 ㄱㄴ과 한 직선 위가 아닌 것)
  const OFFSETS: Pt[] = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
  ];
  const cands = OFFSETS.map(([dx, dy]): Pt => [right[0] + dx, right[1] + dy]).filter(
    (p) => inGrid(p) && !isRight(a, v, p) && (p[0] - v[0]) * d[1] !== (p[1] - v[1]) * d[0] && !(p[0] === a[0] && p[1] === a[1]),
  );
  if (cands.length < 3) return null;
  const pts = shuffle(rand, [right, ...shuffle(rand, cands).slice(0, 3)]);
  const nums = ["①", "②", "③", "④"];
  const px = (p: Pt): Pt => [p[0] * g, p[1] * g];
  const answer = nums[pts.indexOf(right)];
  return {
    key: `${v.join()}:${d.join()}:${k}:${pts.flat().join()}`,
    prompt: "모눈종이에 선분 ㄱㄴ을 그었습니다. 점 ㄴ과 이어서 직각을 만들 수 있는 점을 고르세요.",
    visual: scene(220, 180, "모눈종이 위의 선분 ㄱㄴ과 점 ①~④", {
      grid: g,
      lines: [{ from: px(v), to: px(a) }],
      dots: [px(v), px(a), ...pts.map(px)],
      texts: [
        { at: [px(a)[0] + 12, px(a)[1] - 12], text: "ㄱ" },
        { at: [px(v)[0] - 12, px(v)[1] + 12], text: "ㄴ" },
        ...pts.map((p, i) => ({ at: [px(p)[0] + 12, px(p)[1] - 12] as Pt, text: nums[i] })),
      ],
    }),
    answer,
    choices: nums,
    hint: "삼각자의 직각 부분을 점 ㄴ에 대고 한 변을 선분 ㄱㄴ에 맞추었을 때 다른 변 위에 있는 점을 찾아요.",
    explanation: `점 ${josa(answer, "과/와")} 점 ㄴ을 이으면 선분 ㄱㄴ과 직각을 이룹니다.`,
  };
});

export const rightCountGen = hard("l3-right-count", (rand) => {
  const v = randInt(rand, 1, 2);
  const h = randInt(rand, 0, 1);
  const [W, H] = [randInt(rand, 170, 210), randInt(rand, 90, 120)];
  const x0 = 20;
  const y0 = 20;
  const xs = v === 1 ? [x0 + Math.round(W * pick(rand, [0.35, 0.45, 0.6]))] : [x0 + Math.round(W * 0.3), x0 + Math.round(W * pick(rand, [0.6, 0.7]))];
  const ys = h ? [y0 + Math.round(H * pick(rand, [0.4, 0.55]))] : [];
  const answer = 4 * (1 + v) * (1 + h);
  return {
    key: `${v}:${h}:${W}:${H}:${xs.join()}:${ys.join()}`,
    prompt: "직사각형 모양 종이에 선을 그었습니다. 그림에서 찾을 수 있는 직각은 모두 몇 개인가요?",
    visual: scene(W + 40, H + 40, "선을 그어 여러 칸으로 나눈 직사각형", {
      polygons: [rect(x0, y0, x0 + W, y0 + H)],
      lines: [...xs.map((x) => ({ from: [x, y0] as Pt, to: [x, y0 + H] as Pt })), ...ys.map((y) => ({ from: [x0, y] as Pt, to: [x0 + W, y] as Pt }))],
    }),
    answer,
    unit: "개",
    hint: "바깥 네 꼭짓점뿐 아니라 선이 만나는 곳마다 생기는 직각도 빠짐없이 세어요.",
    explanation: `작은 직사각형 ${(1 + v) * (1 + h)}칸마다 네 귀퉁이에 직각이 있어요 → 4 × ${(1 + v) * (1 + h)} = ${answer}(개)`,
    mistakes: { 4: "선이 만나는 곳에 생기는 직각도 세어야 해요." },
  };
});

export const rightMost = hard("l3-right-most", (rand) => {
  const picked = shuffle(rand, SHAPES).slice(0, 4);
  const counts = picked.map((s) => rightCount(s.pts));
  const max = Math.max(...counts);
  if (counts.filter((c) => c === max).length > 1) return null;
  const cell = (i: number): Pt => [70 + (i % 2) * 140, 60 + Math.floor(i / 2) * 124];
  const polys = picked.map((s, i) => ({ points: fit(s.pts, randInt(rand, 0, 11) * 30, cell(i)[0], cell(i)[1], 100, 80) }));
  const answer = NAMES4[counts.indexOf(max)];
  return {
    key: `${picked.map((s) => s.name).join()}:${polys.map((p) => p.points[0].join()).join()}`,
    prompt: "직각이 가장 많은 도형을 고르세요.",
    visual: scene(280, 250, "여러 방향으로 놓인 도형 4개", {
      polygons: polys,
      texts: picked.map((_, i) => ({ at: [cell(i)[0], cell(i)[1] + 58] as Pt, text: NAMES4[i] })),
    }),
    answer,
    choices: NAMES4.slice(0, 4),
    hint: "도형마다 꼭짓점에 삼각자의 직각 부분을 대어 보며 직각의 수를 세어요.",
    explanation: picked.map((_, i) => `${NAMES4[i]} ${counts[i]}개`).join(", ") + ` → ${answer}`,
  };
});

/* ── 직각삼각형 ── */

/** 직각이 없는 삼각형(어느 각도 직각과 헷갈리지 않게 90°에서 15° 넘게 떨어지게) */
function oddTriangle(rand: () => number): Pt[] {
  for (let i = 0; i < 50; i++) {
    const t: Pt[] = [
      [0, 0],
      [randInt(rand, 80, 130), 0],
      [randInt(rand, -40, 140), randInt(rand, 50, 100)],
    ];
    const ang = t.map((p, j) => {
      const a = t[(j + 2) % 3];
      const b = t[(j + 1) % 3];
      const u = [a[0] - p[0], a[1] - p[1]];
      const w = [b[0] - p[0], b[1] - p[1]];
      return (Math.acos((u[0] * w[0] + u[1] * w[1]) / (Math.hypot(u[0], u[1]) * Math.hypot(w[0], w[1]))) * 180) / Math.PI;
    });
    if (ang.every((x) => (x < 73 || x > 107) && x > 20)) return t;
  }
  return [
    [0, 0],
    [120, 0],
    [40, 90],
  ];
}

export const geoShapeName = easy("geo-shape-name", (rand) => {
  const legs: Pt = [randInt(rand, 60, 130), randInt(rand, 50, 100)];
  const rtri: Pt[] = [
    [0, 0],
    [legs[0], 0],
    [0, legs[1]],
  ];
  const tris = shuffle(rand, [rtri, oddTriangle(rand), oddTriangle(rand), oddTriangle(rand)]);
  const cell = (i: number): Pt => [70 + (i % 2) * 140, 56 + Math.floor(i / 2) * 118];
  const answer = NAMES4[tris.indexOf(rtri)];
  return {
    key: `${legs.join()}:${tris.map((t) => t.flat().join()).join("|")}`,
    prompt: "직각삼각형을 찾아 고르세요.",
    visual: scene(280, 240, "여러 가지 삼각형 4개", {
      polygons: tris.map((t, i) => ({ points: fit(t, randInt(rand, 0, 11) * 30, cell(i)[0], cell(i)[1], 100, 80) })),
      texts: tris.map((_, i) => ({ at: [cell(i)[0], cell(i)[1] + 56] as Pt, text: NAMES4[i] })),
    }),
    answer,
    choices: NAMES4.slice(0, 4),
    hint: "직각삼각형은 한 각이 직각인 삼각형이에요. 기울어져 있어도 삼각자를 대어 직각이 있는지 확인해요.",
    explanation: `한 각이 직각인 삼각형은 ${answer}입니다.`,
  };
});

export const rtriTruth = truth("l3-rtri-truth", 2, "직각삼각형", {
  t: ["직각삼각형에는 직각이 1개 있습니다.", "직각삼각형의 변은 3개입니다.", "직각삼각형의 꼭짓점은 3개입니다.", "한 각이 직각인 삼각형을 직각삼각형이라고 합니다."],
  f: ["직각삼각형에는 직각이 3개 있습니다.", "직각삼각형의 변은 4개입니다.", "직각삼각형에는 직각이 없습니다.", "직각삼각형의 세 변의 길이는 항상 같습니다."],
});

/** 모눈 위 삼각형(격자점): 직각삼각형과 아닌 것 */
const GRID_RIGHT: Pt[][] = [
  [[0, 0], [3, 0], [0, 2]],
  [[0, 0], [0, 3], [2, 3]],
  [[0, 2], [2, 0], [4, 2]],
  [[0, 1], [1, 0], [4, 3]],
  [[0, 0], [4, 0], [4, 2]],
  [[1, 0], [3, 2], [0, 1]],
];
const GRID_OTHER: Pt[][] = [
  [[0, 0], [4, 0], [1, 3]],
  [[0, 3], [2, 0], [4, 3]],
  [[0, 0], [3, 1], [1, 3]],
  [[0, 3], [4, 0], [3, 3]],
  [[0, 0], [4, 1], [1, 3]],
];

export const rtriGrid = mid("l3-rtri-grid", (rand) => {
  const k = randInt(rand, 1, 3);
  const tris = shuffle(rand, [...shuffle(rand, GRID_RIGHT).slice(0, k), ...shuffle(rand, GRID_OTHER).slice(0, 4 - k)]);
  const g = 20;
  const origin = (i: number): Pt => [1 + (i % 2) * 6, 1 + Math.floor(i / 2) * 5];
  return {
    key: tris.map((t) => t.flat().join()).join("|"),
    prompt: "모눈종이에 그린 삼각형 중에서 직각삼각형은 모두 몇 개인가요?",
    visual: scene(240, 200, "모눈종이에 그린 삼각형 4개", {
      grid: g,
      polygons: tris.map((t, i) => ({ points: t.map(([x, y]) => [(x + origin(i)[0]) * g, (y + origin(i)[1]) * g] as Pt) })),
    }),
    answer: k,
    unit: "개",
    hint: "모눈의 가로선·세로선뿐 아니라 비스듬한 두 변이 직각을 이루는 경우도 있어요. 삼각자를 대어 확인해요.",
    explanation: `한 각이 직각인 삼각형은 ${k}개입니다.`,
  };
});

/** 가로 a·세로 b(cm)인 직사각형을 비율대로 그릴 크기(px) */
const rectPx = (a: number, b: number, maxW: number, maxH: number) => {
  const s = Math.min(maxW / a, maxH / b);
  return [Math.round(a * s), Math.round(b * s)];
};

export const rtriJoin = hard("l3-rtri-join", (rand) => {
  const [a, b] = [randInt(rand, 4, 15), randInt(rand, 3, 12)];
  if (a === b || a / b > 4 || b / a > 4) return null;
  const [w, h] = rectPx(a, b, 180, 100);
  const x0 = 60;
  const y0 = 20;
  return {
    key: `${a}:${b}`,
    prompt: `직각을 이루는 두 변의 길이가 ${a} cm, ${b} cm인 똑같은 직각삼각형 2개를 그림과 같이 이어 붙여 사각형을 만들었습니다. 만든 사각형의 네 변의 길이의 합은 몇 cm인가요?`,
    visual: scene(w + 110, h + 56, "똑같은 직각삼각형 2개를 이어 붙인 사각형", {
      polygons: [rect(x0, y0, x0 + w, y0 + h)],
      lines: [{ from: [x0, y0], to: [x0 + w, y0 + h], dashed: true }],
      texts: [
        { at: [x0 + w / 2, y0 + h + 16], text: `${a} cm` },
        { at: [x0 - 28, y0 + h / 2], text: `${b} cm` },
      ],
    }),
    answer: 2 * (a + b),
    unit: "cm",
    hint: "이어 붙인 긴 변(점선)은 사각형 안쪽으로 들어가요. 바깥쪽 네 변이 어떤 길이인지 찾아요.",
    explanation: `네 변은 ${a} cm, ${b} cm, ${a} cm, ${b} cm → ${a} + ${b} + ${a} + ${b} = ${2 * (a + b)}(cm)`,
    mistakes: { [a + b]: "네 변을 모두 더해야 해요." },
  };
});

/**
 * 직각삼각형 차시: 아직 배우지 않은 직사각형·정사각형 대신 각·삼각형·사각형·원 중에서 고른다.
 * 직각삼각형도 삼각형이므로 '삼각형'과 '직각삼각형'은 한 문제의 보기에 함께 넣지 않는다(정답이 둘로 읽힘)
 */
const WITH_RIGHT = ["직각삼각형", "사각형", "원", "각"];
const WITH_TRI = ["삼각형", "사각형", "원", "각"];
const SHAPE_CONDS: [string, string[], string[]][] = [
  ["직각삼각형", ["변이 3개입니다.", "직각이 1개 있습니다."], WITH_RIGHT],
  ["직각삼각형", ["꼭짓점이 3개입니다.", "한 각이 직각입니다."], WITH_RIGHT],
  ["삼각형", ["변이 3개입니다.", "꼭짓점이 3개입니다."], WITH_TRI],
  ["삼각형", ["곧은 선 3개로 둘러싸여 있습니다.", "각이 3개입니다."], WITH_TRI],
  ["사각형", ["변이 4개입니다.", "꼭짓점이 4개입니다."], WITH_RIGHT],
  ["사각형", ["곧은 선 4개로 둘러싸여 있습니다.", "각이 4개입니다."], WITH_TRI],
  ["원", ["곧은 선이 없습니다.", "꼭짓점이 없습니다.", "어느 쪽에서 보아도 똑같이 둥근 모양입니다."], WITH_TRI],
  ["각", ["한 점에서 그은 두 반직선으로 이루어져 있습니다.", "꼭짓점이 1개입니다."], WITH_RIGHT],
];

export const shapeCond = hard("l3-shape-cond", (rand) => {
  const i = randInt(rand, 0, SHAPE_CONDS.length - 1);
  const [answer, conds, choices] = SHAPE_CONDS[i];
  return {
    key: `${i}`,
    prompt: `다음 조건을 모두 만족하는 도형을 고르세요.\n${conds.map((c) => `· ${c}`).join("\n")}`,
    answer,
    choices: shuffle(rand, choices),
    hint: "조건을 하나씩 확인하며 맞지 않는 도형을 지워 나가요.",
    explanation: `조건을 모두 만족하는 도형은 ${answer}입니다.`,
  };
});

/* ── 직사각형 ── */

/** 비율대로 그린 직사각형과 변 글자(위·아래·왼쪽·오른쪽, 빈 글자는 쓰지 않음) */
function rectScene(a: number, b: number, labels: { top?: string; bottom?: string; left?: string; right?: string }, label: string, maxW = 180, maxH = 100): ShapeScene {
  const [w, h] = rectPx(a, b, maxW, maxH);
  const x0 = 56;
  const y0 = 28;
  const texts: Parts["texts"] = [];
  if (labels.top) texts.push({ at: [x0 + w / 2, y0 - 14], text: labels.top });
  if (labels.bottom) texts.push({ at: [x0 + w / 2, y0 + h + 14], text: labels.bottom });
  if (labels.left) texts.push({ at: [x0 - 28, y0 + h / 2], text: labels.left });
  if (labels.right) texts.push({ at: [x0 + w + 28, y0 + h / 2], text: labels.right });
  return scene(w + 112, h + 56, label, { polygons: [rect(x0, y0, x0 + w, y0 + h)], texts });
}

export const rectSide = easy("l3-rect-side", (rand) => {
  const [a, b] = [randInt(rand, 4, 20), randInt(rand, 2, 12)];
  if (a === b || a / b > 4 || b / a > 4) return null;
  const askLong = rand() < 0.5;
  const labels = askLong ? { top: "□ cm", bottom: `${a} cm`, left: `${b} cm` } : { top: `${a} cm`, left: "□ cm", right: `${b} cm` };
  return {
    key: `${a}:${b}:${askLong}`,
    prompt: "직사각형입니다. □ 안에 알맞은 수를 써넣으세요.",
    visual: rectScene(a, b, labels, "변의 길이를 적은 직사각형"),
    answer: askLong ? a : b,
    unit: "cm",
    hint: "직사각형은 마주 보는 두 변의 길이가 같아요.",
    explanation: `마주 보는 변의 길이가 같으므로 ${askLong ? a : b} cm`,
  };
});

export const geoRectPerimeter = mid("geo-rect-perimeter", (rand) => {
  const [a, b] = [randInt(rand, 4, 20), randInt(rand, 3, 15)];
  if (a === b || a / b > 4 || b / a > 4) return null;
  return {
    key: `${a}:${b}`,
    prompt: "직사각형의 네 변의 길이의 합은 몇 cm인가요?",
    visual: rectScene(a, b, { bottom: `${a} cm`, left: `${b} cm` }, "가로와 세로를 적은 직사각형"),
    answer: 2 * (a + b),
    unit: "cm",
    hint: "직사각형은 마주 보는 두 변의 길이가 같아요. 네 변을 모두 더해요.",
    explanation: `${a} + ${b} + ${a} + ${b} = ${2 * (a + b)}(cm)`,
    mistakes: { [a + b]: "두 변만 더했어요. 네 변을 모두 더해야 해요." },
  };
});

export const rectCompare = mid("l3-rect-cmp", (rand) => {
  const s = 9;
  const [a1, b1, a2, b2] = [randInt(rand, 5, 12), randInt(rand, 3, 9), randInt(rand, 5, 12), randInt(rand, 3, 9)];
  if (a1 === b1 || a2 === b2 || (a1 === a2 && b1 === b2)) return null;
  const [p1, p2] = [2 * (a1 + b1), 2 * (a2 + b2)];
  const answer = p1 > p2 ? "가" : p1 < p2 ? "나" : "같습니다";
  const one = (x: number, a: number, b: number, name: string): Parts => ({
    polygons: [rect(x, 40, x + a * s, 40 + b * s)],
    texts: [
      { at: [x + (a * s) / 2, 40 + b * s + 14], text: `${a} cm` },
      { at: [x - 26, 40 + (b * s) / 2], text: `${b} cm` },
      { at: [x + (a * s) / 2, 18], text: name },
    ],
  });
  return {
    key: `${a1}:${b1}:${a2}:${b2}`,
    prompt: "두 직사각형 가, 나 중에서 네 변의 길이의 합이 더 긴 것을 고르세요.",
    visual: scene(56 + 12 * s + 56 + 12 * s + 10, 40 + 9 * s + 30, "가로와 세로를 적은 직사각형 가, 나", one(56, a1, b1, "가"), one(56 + 12 * s + 56, a2, b2, "나")),
    answer,
    choices: ["가", "나", "같습니다", "알 수 없습니다"],
    hint: "직사각형마다 네 변의 길이의 합을 덧셈으로 구해 비교해요.",
    explanation: `가: ${a1} + ${b1} + ${a1} + ${b1} = ${p1}(cm), 나: ${a2} + ${b2} + ${a2} + ${b2} = ${p2}(cm) → ${answer === "같습니다" ? "같습니다" : `${answer}가 더 길어요`}`,
  };
});

export const twoRects = hard("w3-two-rects", (rand) => {
  const a = randInt(rand, 3, 12);
  const b = randInt(rand, 3, 12);
  if (a === b || (2 * a) / b > 5 || b / a > 3) return null;
  const [w, h] = rectPx(2 * a, b, 200, 100);
  const x0 = 56;
  const y0 = 28;
  return {
    key: `${a}:${b}`,
    prompt: `가로 ${a} cm, 세로 ${b} cm인 똑같은 직사각형 2개를 그림과 같이 겹치지 않게 이어 붙여 큰 직사각형을 만들었습니다. 큰 직사각형의 네 변의 길이의 합은 몇 cm인가요?`,
    visual: scene(w + 112, h + 56, "똑같은 직사각형 2개를 가로로 이어 붙인 직사각형", {
      polygons: [rect(x0, y0, x0 + w / 2, y0 + h), rect(x0 + w / 2, y0, x0 + w, y0 + h)],
      texts: [
        { at: [x0 + w / 4, y0 + h + 14], text: `${a} cm` },
        { at: [x0 - 28, y0 + h / 2], text: `${b} cm` },
      ],
    }),
    answer: 2 * (2 * a + b),
    unit: "cm",
    hint: "큰 직사각형의 가로는 작은 직사각형 가로 2개의 길이예요. 붙인 변은 둘레에 들어가지 않아요.",
    explanation: `가로 ${a} + ${a} = ${2 * a}(cm), 세로 ${b} cm → ${2 * a} + ${b} + ${2 * a} + ${b} = ${2 * (2 * a + b)}(cm)`,
    mistakes: { [4 * (a + b)]: "붙은 변까지 더했어요." },
  };
});

export const rectWire = hard("l3-rect-wire", (rand) => {
  const [a, b] = [randInt(rand, 5, 20), randInt(rand, 3, 15)];
  if (a === b) return null;
  const left = randInt(rand, 2, 20);
  const wire = 2 * (a + b) + left;
  return {
    key: `${a}:${b}:${left}`,
    prompt: `길이가 ${wire} cm인 철사를 겹치지 않게 구부려 가로 ${a} cm, 세로 ${b} cm인 직사각형을 한 개 만들었습니다. 남은 철사는 몇 cm인가요?`,
    answer: left,
    unit: "cm",
    hint: "직사각형 한 개를 만드는 데 쓴 철사는 네 변의 길이의 합이에요.",
    explanation: `${a} + ${b} + ${a} + ${b} = ${2 * (a + b)}, ${wire} − ${2 * (a + b)} = ${left}(cm)`,
    mistakes: { [wire - a - b]: "네 변을 모두 더해야 해요." },
  };
});

/* ── 정사각형 ── */

const squareScene = (label: string, side: string) =>
  scene(210, 150, label, {
    polygons: [rect(60, 20, 170, 130)],
    texts: [{ at: [115, 142], text: side }],
  });

export const squarePerim = easy("l3-sq-perim", (rand) => {
  const a = randInt(rand, 3, 15);
  return {
    key: `${a}`,
    prompt: "정사각형의 네 변의 길이의 합은 몇 cm인가요?",
    visual: squareScene("한 변의 길이를 적은 정사각형", `${a} cm`),
    answer: 4 * a,
    unit: "cm",
    hint: "정사각형은 네 변의 길이가 모두 같아요.",
    explanation: `${a} + ${a} + ${a} + ${a} = ${4 * a}(cm)`,
    mistakes: { [2 * a]: "변 4개를 모두 더해야 해요." },
  };
});

export const squareSide = mid("l3-sq-side", (rand) => {
  const a = randInt(rand, 2, 9);
  return {
    key: `${a}`,
    prompt: `네 변의 길이의 합이 ${4 * a} cm인 정사각형입니다. □ 안에 알맞은 수를 써넣으세요.`,
    visual: squareScene("한 변의 길이를 □로 나타낸 정사각형", "□ cm"),
    answer: a,
    unit: "cm",
    hint: "정사각형은 네 변의 길이가 같아요. □를 4번 더하면(□ × 4) 네 변의 길이의 합이 돼요.",
    explanation: `□ × 4 = ${4 * a}이고 ${a} × 4 = ${4 * a}이므로 □ = ${a}`,
    mistakes: { [2 * a]: "변이 4개예요." },
  };
});

export const squareTruth = truth("l3-sq-truth", 2, "직사각형과 정사각형", {
  t: [
    "정사각형은 직사각형이라고 할 수 있습니다.",
    "정사각형은 네 변의 길이가 모두 같습니다.",
    "직사각형은 네 각이 모두 직각입니다.",
    "직사각형은 마주 보는 두 변의 길이가 같습니다.",
  ],
  f: [
    "직사각형은 정사각형이라고 할 수 있습니다.",
    "직사각형은 네 변의 길이가 항상 모두 같습니다.",
    "정사각형에는 직각이 2개 있습니다.",
    "정사각형의 이웃한 두 변은 길이가 다릅니다.",
  ],
});

export const squareCut = hard("l3-sq-cut", (rand) => {
  const b = randInt(rand, 3, 12);
  const a = b + randInt(rand, 2, 10);
  if (a / b > 4) return null;
  const [w, h] = rectPx(a, b, 200, 100);
  const x0 = 56;
  const y0 = 28;
  const cut = x0 + Math.round((w * b) / a);
  return {
    key: `${a}:${b}`,
    prompt: `가로 ${a} cm, 세로 ${b} cm인 직사각형 모양 종이에서 그림과 같이 가장 큰 정사각형을 한 개 잘라 냈습니다. 남은 직사각형의 네 변의 길이의 합은 몇 cm인가요?`,
    visual: scene(w + 112, h + 56, "직사각형에서 정사각형을 잘라 내는 점선", {
      polygons: [rect(x0, y0, x0 + w, y0 + h)],
      lines: [{ from: [cut, y0], to: [cut, y0 + h], dashed: true }],
      texts: [
        { at: [x0 + w / 2, y0 - 14], text: `${a} cm` },
        { at: [x0 - 28, y0 + h / 2], text: `${b} cm` },
      ],
    }),
    answer: 2 * a,
    unit: "cm",
    hint: `가장 큰 정사각형의 한 변은 ${b} cm예요. 남은 직사각형의 가로와 세로를 구해 보세요.`,
    explanation: `남은 직사각형: 가로 ${a} − ${b} = ${a - b}(cm), 세로 ${b} cm → ${a - b} + ${b} + ${a - b} + ${b} = ${2 * a}(cm)`,
    mistakes: { [4 * b]: "잘라 낸 정사각형이 아니라 남은 직사각형의 둘레를 구해야 해요." },
  };
});

export const squareJoin = hard("l3-sq-join", (rand) => {
  const a = randInt(rand, 2, 9);
  const n = randInt(rand, 2, 4);
  const s = Math.min(56, Math.floor(220 / n));
  const x0 = 30;
  const y0 = 20;
  const sides = 2 * n + 2;
  return {
    key: `${a}:${n}`,
    prompt: `한 변이 ${a} cm인 정사각형 ${n}개를 그림과 같이 겹치지 않게 한 줄로 이어 붙여 직사각형을 만들었습니다. 만든 직사각형의 네 변의 길이의 합은 몇 cm인가요?`,
    visual: scene(x0 * 2 + n * s, y0 + s + 34, `정사각형 ${n}개를 한 줄로 이어 붙인 직사각형`, {
      polygons: Array.from({ length: n }, (_, i) => rect(x0 + i * s, y0, x0 + (i + 1) * s, y0 + s)),
      texts: [{ at: [x0 + s / 2, y0 + s + 14], text: `${a} cm` }],
    }),
    answer: 2 * (a * n + a),
    unit: "cm",
    hint: "둘레에 정사각형의 한 변이 몇 개 놓이는지 세어 보세요. 붙인 변은 둘레에 들어가지 않아요.",
    // 2단원은 곱셈 단원보다 앞이고 ${a} × 10은 곱셈구구 밖이라 덧셈(같은 수를 여러 번 더하기)으로 쓴다
    explanation: `둘레에 한 변 ${a} cm가 ${sides}개 → ${josa(`${a} cm`, "을/를")} ${sides}번 더하면 ${a * sides} cm`,
    mistakes: { [4 * a * n]: "붙인 변은 둘레에 들어가지 않아요." },
  };
});

/* ── 원 ── */

const circleScene = (label: string, extra: Partial<ShapeScene>): ShapeScene => ({
  kind: "shape",
  width: 200,
  height: 170,
  label,
  circles: [{ c: [100, 85], r: 70 }],
  dots: [[100, 85]],
  ...extra,
});

export const radiusSame = easy("l3-radius-same", (rand) => {
  const r = randInt(rand, 2, 30);
  return {
    key: `${r}`,
    prompt: `점 ㅇ은 원의 중심입니다. 선분 ㅇㄱ의 길이가 ${r} cm일 때 선분 ㅇㄴ의 길이는 몇 cm인가요?`,
    visual: circleScene("중심이 ㅇ인 원과 원 위의 두 점 ㄱ, ㄴ", {
      lines: [
        { from: [100, 85], to: [170, 85] },
        { from: [100, 85], to: [65, 25] },
      ],
      dots: [
        [100, 85],
        [170, 85],
        [65, 25],
      ],
      texts: [
        { at: [96, 102], text: "ㅇ" },
        { at: [184, 90], text: "ㄱ" },
        { at: [54, 18], text: "ㄴ" },
        { at: [135, 72], text: `${r} cm` },
      ],
    }),
    answer: r,
    unit: "cm",
    hint: "한 원에서 반지름은 모두 같아요.",
    explanation: `선분 ㅇㄱ과 선분 ㅇㄴ은 모두 반지름이므로 ${r} cm`,
    mistakes: { [2 * r]: "선분 ㅇㄴ은 지름이 아니라 반지름이에요." },
  };
});

export const twoCenters = mid("m3-two-centers", (rand) => {
  const [a, b] = [randInt(rand, 2, 9), randInt(rand, 2, 9)];
  // 크기가 다르되 반지름 글자가 작은 원 안에 들어가게 두 반지름의 비는 2배까지
  if (a === b || Math.max(a, b) > 2 * Math.min(a, b)) return null;
  // 반지름 수치에 비례해 그린다
  const k = 164 / (a + b);
  const [R1, R2] = [Math.round(a * k), Math.round(b * k)];
  const y = Math.max(R1, R2) + 10;
  const c1 = 16 + R1;
  const c2 = c1 + R1 + R2;
  return {
    key: `${a}:${b}`,
    prompt: "크기가 다른 두 원이 그림과 같이 한 점에서 맞닿아 있습니다. 두 원의 중심 ㄱ, ㄴ 사이의 거리는 몇 cm인가요?",
    visual: scene(c2 + R2 + 16, 2 * y, "바깥쪽에서 한 점에 맞닿은 두 원과 두 중심을 이은 선분", {
      circles: [
        { c: [c1, y], r: R1 },
        { c: [c2, y], r: R2 },
      ],
      lines: [{ from: [c1, y], to: [c2, y] }],
      dots: [
        [c1, y],
        [c2, y],
        [c1 + R1, y],
      ],
      texts: [
        { at: [c1 - 4, y + 18], text: "ㄱ" },
        { at: [c2 + 4, y + 18], text: "ㄴ" },
        { at: [c1 + R1 / 2, y - 14], text: `${a} cm` },
        { at: [c2 - R2 / 2, y - 14], text: `${b} cm` },
      ],
    }),
    answer: a + b,
    unit: "cm",
    hint: "두 중심을 이은 선분은 두 원의 반지름을 이어 놓은 것과 같아요.",
    explanation: `${a} + ${b} = ${a + b}(cm)`,
  };
});

export const radiusTruth = truth("l3-radius-truth", 2, "원의 중심과 반지름", {
  t: [
    "한 원에서 원의 중심은 1개입니다.",
    "한 원에서 반지름의 길이는 모두 같습니다.",
    "한 원에서 반지름은 셀 수 없이 많이 그을 수 있습니다.",
    "원의 중심과 원 위의 한 점을 이은 선분을 반지름이라고 합니다.",
  ],
  f: [
    "한 원에는 원의 중심이 2개 있습니다.",
    "한 원에서 반지름의 길이는 모두 다릅니다.",
    "한 원에서 반지름은 2개만 그을 수 있습니다.",
    "원 위의 두 점을 이은 선분은 모두 반지름입니다.",
  ],
});

export const radiusTriangle = hard("l3-radius-tri", (rand) => {
  const r = randInt(rand, 3, 15);
  const c = randInt(rand, 2, 2 * r - 1);
  const s = 2 * r + c;
  return {
    key: `${r}:${c}`,
    prompt: `점 ㅇ은 원의 중심이고 점 ㄱ, ㄴ은 원 위의 점입니다. 삼각형 ㅇㄱㄴ의 세 변의 길이의 합이 ${s} cm이고 선분 ㄱㄴ이 ${c} cm일 때 원의 반지름은 몇 cm인가요?`,
    visual: circleScene("중심 ㅇ과 원 위의 두 점 ㄱ, ㄴ을 이은 삼각형", {
      polygons: [{ points: [[100, 85], [160, 49], [160, 121]] }],
      texts: [
        { at: [86, 90], text: "ㅇ" },
        { at: [172, 42], text: "ㄱ" },
        { at: [172, 130], text: "ㄴ" },
      ],
    }),
    answer: r,
    unit: "cm",
    hint: "선분 ㅇㄱ과 선분 ㅇㄴ은 둘 다 반지름이라 길이가 같아요.",
    explanation: `${s} − ${c} = ${2 * r}, ${2 * r} ÷ 2 = ${r}(cm)`,
    mistakes: { [s - c]: "반지름 2개의 합이에요. 2로 나누어야 해요." },
  };
});

export const radiusTwo = hard("l3-radius-two", (rand) => {
  const r = randInt(rand, 2, 20);
  const quad = rand() < 0.5;
  const [o1, o2, top, bottom]: Pt[] = [
    [95, 85],
    [145, 85],
    [120, 41.7],
    [120, 128.3],
  ];
  return {
    key: `${r}:${quad}`,
    prompt: quad
      ? `반지름이 ${r} cm인 두 원이 서로의 중심을 지나도록 겹쳐 그렸습니다. 두 원의 중심 ㄱ, ㄴ과 두 원이 만나는 점 ㄷ, ㄹ을 이어 사각형 ㄱㄷㄴㄹ을 만들었을 때, 사각형의 네 변의 길이의 합은 몇 cm인가요?`
      : `반지름이 ${r} cm인 두 원이 서로의 중심을 지나도록 겹쳐 그렸습니다. 두 원의 중심 ㄱ, ㄴ과 두 원이 만나는 점 ㄷ을 이어 삼각형 ㄱㄴㄷ을 만들었을 때, 삼각형의 세 변의 길이의 합은 몇 cm인가요?`,
    visual: scene(240, 170, quad ? "서로의 중심을 지나는 두 원과 사각형 ㄱㄷㄴㄹ" : "서로의 중심을 지나는 두 원과 삼각형 ㄱㄴㄷ", {
      circles: [
        { c: o1, r: 50 },
        { c: o2, r: 50 },
      ],
      polygons: [{ points: quad ? [o1, top, o2, bottom] : [o1, o2, top] }],
      dots: quad ? [o1, o2, top, bottom] : [o1, o2, top],
      texts: [
        { at: [80, 90], text: "ㄱ" },
        { at: [160, 90], text: "ㄴ" },
        { at: [120, 26], text: "ㄷ" },
        ...(quad ? [{ at: [120, 145] as Pt, text: "ㄹ" }] : []),
      ],
    }),
    answer: (quad ? 4 : 3) * r,
    unit: "cm",
    hint: "도형의 변이 모두 두 원의 반지름인지 확인해 보세요.",
    explanation: `변이 모두 반지름이므로 ${r} × ${quad ? 4 : 3} = ${(quad ? 4 : 3) * r}(cm)`,
  };
});

export const circleDiameter = easy("circle-diameter", (rand) => {
  const r = randInt(rand, 2, 30);
  const giveRadius = rand() < 0.5;
  return {
    key: `${giveRadius}:${r}`,
    prompt: giveRadius ? "원의 지름은 몇 cm인가요?" : "원의 반지름은 몇 cm인가요?",
    visual: scene(200, 160, giveRadius ? "원의 중심과 원 위의 점을 이은 선분이 있는 원" : "원의 중심을 지나는 선분이 있는 원", {
      circles: [{ c: [100, 80], r: 64 }],
      dots: [[100, 80]],
      lines: [giveRadius ? { from: [100, 80], to: [164, 80] } : { from: [36, 80], to: [164, 80] }],
      texts: [{ at: [giveRadius ? 132 : 100, 66], text: `${giveRadius ? r : r * 2} cm` }],
    }),
    answer: giveRadius ? r * 2 : r,
    unit: "cm",
    hint: "지름은 반지름의 2배예요.",
    explanation: giveRadius ? `${r} × 2 = ${r * 2}(cm)` : `${r * 2} ÷ 2 = ${r}(cm)`,
  };
});

export const diameterCompare = mid("l3-diam-cmp", (rand) => {
  const r = randInt(rand, 3, 20);
  const d = randInt(rand, 5, 40);
  const answer = 2 * r > d ? "가 원" : 2 * r < d ? "나 원" : "크기가 같습니다";
  return {
    key: `${r}:${d}`,
    prompt: `가 원은 반지름이 ${r} cm이고, 나 원은 지름이 ${d} cm입니다. 더 큰 원을 고르세요.`,
    answer,
    choices: ["가 원", "나 원", "크기가 같습니다", "알 수 없습니다"],
    hint: "반지름을 지름으로 바꾸어(2배) 비교해요.",
    explanation: `가 원의 지름은 ${2 * r} cm, 나 원의 지름은 ${d} cm → ${answer}`,
  };
});

export const diameterTruth = truth("l3-diam-truth", 2, "원의 지름", {
  t: [
    "지름은 원의 중심을 지납니다.",
    "한 원에서 지름은 반지름의 2배입니다.",
    "지름은 원 안에 그을 수 있는 가장 긴 선분입니다.",
    "지름은 원을 똑같이 둘로 나눕니다.",
  ],
  f: [
    "한 원에서 지름은 반지름의 반입니다.",
    "지름은 원의 중심을 지나지 않아도 됩니다.",
    "한 원에서 지름의 길이는 모두 다릅니다.",
    "원 안에 지름보다 긴 선분을 그을 수 있습니다.",
  ],
});

export const circlesInCircle = hard("w3-circles-in-circle", (rand) => {
  const r = randInt(rand, 2, 12);
  return {
    key: `${r}`,
    prompt: `큰 원 안에 크기가 같은 작은 원 2개를 그림과 같이 꼭 맞게 그렸습니다. 큰 원의 반지름이 ${r * 2} cm일 때 작은 원의 반지름은 몇 cm인가요?`,
    visual: scene(200, 170, "큰 원의 지름 위에 꼭 맞게 그린 작은 원 2개", {
      circles: [
        { c: [100, 85], r: 72 },
        { c: [64, 85], r: 36 },
        { c: [136, 85], r: 36 },
      ],
      lines: [{ from: [28, 85], to: [172, 85], dashed: true, width: 1 }],
      dots: [
        [100, 85],
        [64, 85],
        [136, 85],
      ],
    }),
    answer: r,
    unit: "cm",
    hint: "작은 원 2개의 지름을 합하면 큰 원의 지름과 같아요.",
    explanation: `큰 원의 지름 ${r * 4} cm = 작은 원의 지름 2개 → 작은 원의 지름 ${r * 2} cm, 반지름 ${r} cm`,
    mistakes: { [r * 2]: "작은 원의 지름을 답했어요." },
  };
});

export const diameterRect = hard("l3-diam-rect", (rand) => {
  const r = randInt(rand, 2, 9);
  const n = randInt(rand, 2, 4);
  return {
    key: `${r}:${n}`,
    prompt: `반지름이 ${r} cm인 원 ${n}개를 직사각형 안에 한 줄로 꼭 맞게 그렸습니다. 직사각형의 네 변의 길이의 합은 몇 cm인가요?`,
    visual: {
      kind: "shape",
      width: 20 + n * 52,
      height: 72,
      label: `직사각형 안에 한 줄로 꼭 맞게 들어간 같은 크기의 원 ${n}개`,
      polygons: [{ points: [[10, 10], [10 + n * 52, 10], [10 + n * 52, 62], [10, 62]] }],
      circles: Array.from({ length: n }, (_, i) => ({ c: [36 + i * 52, 36] as Pt, r: 26 })),
    },
    answer: 2 * (2 * r * n + 2 * r),
    unit: "cm",
    hint: `직사각형의 가로는 지름 ${n}개, 세로는 지름 1개의 길이예요.`,
    explanation: `가로 ${2 * r} × ${n} = ${2 * r * n}(cm), 세로 ${2 * r} cm → ${2 * r * n} + ${2 * r} + ${2 * r * n} + ${2 * r} = ${2 * (2 * r * n + 2 * r)}(cm)`,
    mistakes: { [2 * (r * n + r)]: "반지름이 아니라 지름으로 가로와 세로를 구해요." },
  };
});

/** 자 위에 벌린 컴퍼스: 침은 from cm, 연필은 from + r cm */
function compassScene(from: number, r: number): ShapeScene {
  const x0 = 24;
  const u = 30;
  const top = 116;
  const [xa, xb] = [x0 + from * u, x0 + (from + r) * u];
  const hinge: Pt = [(xa + xb) / 2, 30];
  return scene(348, 166, "자 위에 벌려 놓은 컴퍼스", ruler(x0, top, 10, u), {
    lines: [
      { from: hinge, to: [xa, top], width: 3 },
      { from: hinge, to: [xb, top], width: 3 },
      { from: hinge, to: [hinge[0], 10], width: 3 },
    ],
    circles: [{ c: hinge, r: 6 }],
  });
}

export const compassOpen = easy("l3-compass-open", (rand) => {
  const r = randInt(rand, 2, 8);
  return {
    key: `${r}`,
    prompt: "컴퍼스를 그림과 같이 벌려서 원을 그렸습니다. 그린 원의 반지름은 몇 cm인가요?",
    visual: compassScene(0, r),
    answer: r,
    unit: "cm",
    hint: "컴퍼스의 침과 연필 끝 사이의 거리가 원의 반지름이에요.",
    explanation: `침은 0, 연필 끝은 ${r} cm 눈금 → 반지름 ${r} cm`,
    mistakes: { [2 * r]: "컴퍼스를 벌린 길이는 지름이 아니라 반지름이에요." },
  };
});

export const compassFit = mid("l3-compass-fit", (rand) => {
  const r = randInt(rand, 2, 15);
  return {
    key: `${r}`,
    prompt: `지름이 ${2 * r} cm인 원을 그리려고 합니다. 컴퍼스를 몇 cm만큼 벌려야 하나요?`,
    answer: r,
    unit: "cm",
    hint: "컴퍼스는 반지름만큼 벌려요. 반지름은 지름의 반이에요.",
    explanation: `${2 * r} ÷ 2 = ${r}(cm)`,
    mistakes: { [2 * r]: "지름만큼 벌리면 2배 큰 원이 그려져요." },
  };
});

export const compassDraw = mid("l3-compass-draw", (rand) => {
  const from = randInt(rand, 1, 2);
  const r = randInt(rand, 2, 7);
  return {
    key: `${from}:${r}`,
    prompt: `${nameOf(rand)}가 컴퍼스를 그림과 같이 벌려서 원을 그렸습니다. 그린 원의 지름은 몇 cm인가요?`,
    visual: compassScene(from, r),
    answer: 2 * r,
    unit: "cm",
    hint: "침이 0이 아닌 눈금에 있어요. 침과 연필 끝 사이가 몇 cm인지 세어 반지름을 구해요.",
    explanation: `침 ${from} cm, 연필 끝 ${from + r} cm → 반지름 ${r} cm, 지름 ${r} × 2 = ${2 * r}(cm)`,
    mistakes: { [r]: "반지름을 답했어요. 지름은 반지름의 2배예요.", [2 * (from + r)]: "침이 있는 눈금부터 세어야 해요." },
  };
});

export const compassRule = hard("l3-compass-rule", (rand) => {
  const a = randInt(rand, 1, 4);
  const k = randInt(rand, 1, 3);
  const n = randInt(rand, 4, 7);
  const r = a + (n - 1) * k;
  return {
    key: `${a}:${k}:${n}`,
    prompt: `같은 점을 중심으로 컴퍼스를 첫 번째에는 ${a} cm, 두 번째에는 ${a + k} cm, 세 번째에는 ${a + 2 * k} cm, …만큼 벌려 원을 차례로 그렸습니다. ${n}번째로 그린 원의 지름은 몇 cm인가요?`,
    answer: 2 * r,
    unit: "cm",
    hint: `컴퍼스를 벌린 길이가 ${k} cm씩 늘어나요. ${n}번째 반지름을 먼저 구해요.`,
    explanation: `${n}번째 반지름: ${k} × ${n - 1} = ${k * (n - 1)}, ${a} + ${k * (n - 1)} = ${r}(cm), 지름: ${2 * r} cm`,
    mistakes: { [r]: "반지름이 아니라 지름을 구해야 해요." },
  };
});

export const compassWho = hard("l3-compass-who", (rand) => {
  const [A, B] = twoNames(rand);
  const r = randInt(rand, 3, 8);
  const d = randInt(rand, 5, 20);
  if (2 * r === d) return null;
  const diff = Math.abs(2 * r - d);
  const W = 2 * r > d ? A : B;
  const L = 2 * r > d ? B : A;
  const answer = `${W}, ${diff} cm`;
  return {
    key: `${r}:${d}`,
    prompt: `${A}는 컴퍼스를 그림과 같이 벌려 원을 그렸고, ${B}는 지름이 ${d} cm인 원을 그렸습니다. 누가 그린 원의 지름이 몇 cm 더 긴가요?`,
    visual: compassScene(0, r),
    answer,
    choices: choices4(rand, answer, [`${L}, ${diff} cm`, `${W}, ${Math.abs(r - d) || diff + 4} cm`, `${L}, ${diff + 2} cm`], () => `${pick(rand, [W, L])}, ${diff + randInt(rand, 1, 9)} cm`),
    hint: "컴퍼스를 벌린 길이는 반지름이에요. 둘 다 지름으로 바꾸어 비교해요.",
    explanation: `${A}의 원: 반지름 ${r} cm, 지름 ${2 * r} cm / ${B}의 원: 지름 ${d} cm → ${W}가 ${diff} cm 더`,
  };
});

export const circleInSquare = easy("circle-in-square", (rand) => {
  const side = randInt(rand, 2, 20) * 2;
  return {
    key: `${side}`,
    prompt: `한 변이 ${side} cm인 정사각형 안에 꼭 맞게 원을 그렸습니다. 원의 반지름은 몇 cm인가요?`,
    visual: scene(160, 160, "정사각형 안에 꼭 맞는 원", {
      polygons: [rect(16, 16, 144, 144)],
      circles: [{ c: [80, 80], r: 64 }],
      dots: [[80, 80]],
    }),
    answer: side / 2,
    unit: "cm",
    hint: "원의 지름이 정사각형의 한 변과 같아요.",
    explanation: `지름 ${side} cm의 반이므로 ${side / 2} cm`,
    mistakes: { [side]: "지름을 답했어요." },
  };
});

export const circleChain = mid("circle-chain", (rand) => {
  const n = randInt(rand, 2, 4);
  const r = randInt(rand, 2, 9);
  const R = 26;
  return {
    key: `${n}:${r}`,
    prompt: `반지름이 ${r} cm인 원 ${n}개를 맞닿게 이어 그렸습니다. 선분 ㄱㄴ의 길이는 몇 cm인가요?`,
    visual: scene(20 + n * 2 * R, 90, `같은 크기의 원 ${n}개가 한 줄로 맞닿아 있고, 양 끝을 잇는 선분 ㄱㄴ`, {
      circles: Array.from({ length: n }, (_, i) => ({ c: [10 + R + i * 2 * R, 42] as Pt, r: R })),
      lines: [{ from: [10, 42], to: [10 + n * 2 * R, 42] }],
      dots: [
        [10, 42],
        [10 + n * 2 * R, 42],
      ],
      texts: [
        { at: [12, 80], text: "ㄱ" },
        { at: [8 + n * 2 * R, 80], text: "ㄴ" },
      ],
    }),
    answer: 2 * r * n,
    unit: "cm",
    hint: "선분 ㄱㄴ은 지름 몇 개의 길이와 같나요?",
    explanation: `지름 ${r * 2} cm가 ${n}개이므로 ${r * 2} × ${n} = ${2 * r * n}(cm)`,
    mistakes: { [r * n]: "반지름으로 계산했어요. 지름을 써야 해요." },
  };
});

export const circleStep = mid("l3-circle-step", (rand) => {
  const a = randInt(rand, 2, 6);
  const n = randInt(rand, 4, 8);
  const d = 24 + a * 6;
  const R = 34;
  const cx = (i: number) => 20 + R + i * d;
  return {
    key: `${a}:${n}`,
    prompt: `원의 중심을 오른쪽으로 ${a} cm씩 옮겨 가며 같은 크기의 원을 그리는 규칙입니다. 같은 규칙으로 원을 ${n}개 그렸을 때, 첫 번째 원의 중심과 ${n}번째 원의 중심 사이의 거리는 몇 cm인가요?`,
    visual: scene(cx(2) + R + 20, 130, "중심을 같은 거리만큼 옮겨 그린 같은 크기의 원 3개와 두 중심 사이의 거리", {
      circles: [0, 1, 2].map((i) => ({ c: [cx(i), 50] as Pt, r: R })),
      dots: [0, 1, 2].map((i) => [cx(i), 50] as Pt),
      // 첫째·둘째 원의 중심 사이 거리를 원 아래에 치수선으로 적는다
      lines: [
        { from: [cx(0), 50], to: [cx(0), 104], dashed: true, width: 1 },
        { from: [cx(1), 50], to: [cx(1), 104], dashed: true, width: 1 },
        { from: [cx(0), 100], to: [cx(1), 100], arrows: "both", width: 1 },
      ],
      texts: [{ at: [(cx(0) + cx(1)) / 2, 116], text: `${a} cm` }],
    }),
    answer: a * (n - 1),
    unit: "cm",
    hint: "중심을 옮긴 횟수는 원의 개수보다 1 작아요.",
    explanation: `중심을 ${n - 1}번 옮기므로 ${a} × ${n - 1} = ${a * (n - 1)}(cm)`,
    mistakes: { [a * n]: "옮긴 횟수는 원의 개수보다 1 작아요." },
  };
});

export const boxOfCircles = hard("w3-box-circles", (rand) => {
  const r = randInt(rand, 2, 10);
  const n = randInt(rand, 2, 4);
  const R = n === 4 ? 18 : n === 3 ? 22 : 30;
  const x0 = 20;
  return {
    key: `${r}:${n}`,
    prompt: `반지름이 ${r} cm인 원 모양 컵받침을 정사각형 모양 상자 안에 그림과 같이 꼭 맞게 넣었습니다. 상자 한 변의 길이는 몇 cm인가요?`,
    visual: scene(40 + 2 * R * n, 40 + 2 * R * n, `정사각형 상자에 가로 ${n}개, 세로 ${n}개씩 꼭 맞게 넣은 원`, {
      polygons: [rect(x0, x0, x0 + 2 * R * n, x0 + 2 * R * n)],
      circles: Array.from({ length: n * n }, (_, i) => ({ c: [x0 + R + (i % n) * 2 * R, x0 + R + Math.floor(i / n) * 2 * R] as Pt, r: R })),
    }),
    answer: 2 * r * n,
    unit: "cm",
    hint: "상자의 한 변에는 원의 지름이 몇 개 놓이나요?",
    explanation: `지름 ${2 * r} cm가 ${n}개 → ${2 * r} × ${n} = ${2 * r * n}(cm)`,
    mistakes: { [r * n]: "반지름으로 계산했어요." },
  };
});

export const circleOverlap = hard("l3-circle-overlap", (rand) => {
  const r = randInt(rand, 2, 9);
  const n = randInt(rand, 3, 5);
  return {
    key: `${r}:${n}`,
    prompt: `반지름이 ${r} cm인 원 ${n}개를 한 줄로 그렸는데, 두 번째 원부터는 원의 중심이 바로 앞 원의 오른쪽 끝(원 위)에 오도록 겹쳐 그렸습니다. 왼쪽 끝 원의 왼쪽 끝에서 오른쪽 끝 원의 오른쪽 끝까지의 길이는 몇 cm인가요?`,
    visual: {
      kind: "shape",
      width: 40 + (n + 1) * 26,
      height: 80,
      label: `중심이 앞 원 위에 오도록 겹쳐 그린 원 ${n}개`,
      circles: Array.from({ length: n }, (_, i) => ({ c: [46 + i * 26, 40] as Pt, r: 26 })),
      lines: [{ from: [20, 40], to: [46 + (n - 1) * 26 + 26, 40] }],
    },
    answer: r * (n + 1),
    unit: "cm",
    hint: "선분이 반지름 몇 개의 길이로 이루어지는지 세어 보세요.",
    explanation: `반지름이 ${n + 1}개 → ${r} × ${n + 1} = ${r * (n + 1)}(cm)`,
    mistakes: { [2 * r * n]: "원이 겹쳐 있어서 지름을 모두 더하면 안 돼요." },
  };
});
