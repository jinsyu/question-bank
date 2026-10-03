import type { ShapeScene } from "../types";
import { pick, randInt, shuffle } from "../../lib/random";
import { MARKS, easy as easyBase, mid as midBase, word as wordBase } from "./g4";
import { add, angleAt, guard, mul, rightMark, rp, sideText, sub, unit, type Lines, type Make, type Pt } from "./g4-quad";
import { josa } from "../josa";

/**
 * 4-2 다각형: 다각형·정다각형·대각선·모양 조각 그림을 보고 푼다.
 */

const easy = (id: string, make: Make) => easyBase(id, guard(make));
const mid = (id: string, make: Make) => midBase(id, guard(make));
const word = (id: string, make: Make) => wordBase(id, guard(make));

const POLY = ["", "", "", "삼각형", "사각형", "오각형", "육각형", "칠각형", "팔각형", "구각형", "십각형"];
const rad = (d: number) => (d * Math.PI) / 180;

/** 정n각형(가운데 c, 반지름 r, 위쪽 꼭짓점부터) */
function regular(c: Pt, n: number, r: number, turn = 0): Pt[] {
  return Array.from({ length: n }, (_, i) => rp(add(c, mul([Math.cos(rad(-90 + turn + (360 * i) / n)), Math.sin(rad(-90 + turn + (360 * i) / n))], r))));
}

/** 변의 가운데에 같은 길이 표시 금 */
function tick(a: Pt, b: Pt): Lines[number] {
  const m = mul(add(a, b), 0.5);
  const d = unit(sub(b, a));
  const nrm: Pt = [-d[1], d[0]];
  return { from: rp(add(m, mul(nrm, 6))), to: rp(add(m, mul(nrm, -6))), width: 1.5 };
}
const ticksAll = (pts: Pt[]): Lines => pts.map((p, i) => tick(p, pts[(i + 1) % pts.length]));

/** 원 위의 점으로 만든 볼록 다각형: 고르게 나눈 자리에서 조금씩 흔들어 정다각형처럼 보이지 않게 */
function randomPolygon(rand: () => number, n: number, c: Pt, r: number, wobble = 0.6): Pt[] {
  const step = 360 / n;
  const start = rand() * 360;
  const ts = Array.from({ length: n }, (_, i) => start + i * step + (rand() - 0.5) * step * wobble);
  return ts.map((t) => rp(add(c, mul([Math.cos(rad(t)), Math.sin(rad(t))], r * (1 - wobble / 3 + rand() * (wobble / 3))))));
}

/* ════════ 다각형 ════════ */

const centerOf = (ps: Pt[]): Pt => rp(mul(ps.reduce(add, [0, 0] as Pt), 1 / ps.length));

export const l4PolySidesSum = mid("l4-poly-sides-sum", (rand) => {
  const [p, q] = shuffle(rand, [3, 4, 5, 6, 7, 8]).slice(0, 2);
  const what = pick(rand, ["변", "꼭짓점"]);
  const A = randomPolygon(rand, p, [90, 100], 70);
  const B = randomPolygon(rand, q, [270, 100], 70);
  return {
    key: `${p}:${q}:${what}:${A.join()}`,
    prompt: `다각형 가와 나의 ${what}의 수를 모두 더하면 몇 개인가요?`,
    visual: {
      kind: "shape",
      width: 360,
      height: 200,
      label: "다각형 가와 나",
      polygons: [{ points: A }, { points: B }],
      dots: [...A, ...B],
      texts: [{ at: centerOf(A), text: "가" }, { at: centerOf(B), text: "나" }],
    },
    answer: p + q,
    unit: "개",
    hint: `다각형은 ${what === "변" ? "변" : "꼭짓점"}의 수를 하나씩 표시하며 세어요. □각형은 변과 꼭짓점이 각각 □개예요.`,
    explanation: `가는 ${POLY[p]}, 나는 ${POLY[q]} → ${p} + ${q} = ${p + q}(개)`,
  };
});

/* ════════ 정다각형 ════════ */

const REG_N = [3, 4, 5, 6, 8];

export const polyRegularPerimeter = easy("poly-regular-perimeter", (rand) => {
  const n = pick(rand, [3, 4, 5, 6, 8]);
  const a = randInt(rand, 2, 15);
  const reverse = rand() < 0.4;
  const pts = regular([110, n === 3 ? 112 : 100], n, 72, n === 4 || n === 8 ? 180 / n : 0);
  const name = `정${POLY[n]}`;
  const last = n - 1;
  return {
    key: `${reverse}:${n}:${a}`,
    prompt: reverse ? `${name}의 모든 변의 길이의 합이 ${a * n} cm입니다. 한 변(□)은 몇 cm인가요?` : `${name}입니다. 모든 변의 길이의 합은 몇 cm인가요?`,
    visual: {
      kind: "shape",
      width: 220,
      height: 200,
      label: name,
      polygons: [{ points: pts }],
      lines: ticksAll(pts),
      texts: [(() => {
        const st = sideText(pts[last], pts[0], pts, reverse ? "□ cm" : `${a} cm`);
        const m0 = mul(add(pts[last], pts[0]), 0.5);
        return { ...st, at: rp(add(st.at, mul(unit(sub(st.at, m0)), 6))) };
      })()],
    },
    answer: reverse ? a : a * n,
    unit: "cm",
    hint: `정다각형은 변의 길이가 모두 같아요. 그림의 변이 몇 개인지 세어요.`,
    explanation: reverse ? `${name}의 변은 ${n}개 → ${a * n} ÷ ${n} = ${a}(cm)` : `${name}의 변은 ${n}개 → ${a} × ${n} = ${a * n}(cm)`,
    mistakes: reverse ? {} : { [a * (n - 1)]: "변 하나를 빠뜨렸어요." },
  };
});

export const l4RegularPick = mid("l4-regular-pick", (rand) => {
  // 정다각형 하나와 함정 셋: 변만 같은 마름모, 각만 같은 직사각형, 모양이 고르지 않은 다각형
  const n = pick(rand, [5, 6, 8]);
  const cells = shuffle(rand, [0, 1, 2, 3]);
  const W = 100;
  const cy = 70;
  const cx = (k: number) => 50 + k * W;
  const polys: Pt[][] = [];
  const lines: Lines = [];
  const reg = regular([cx(cells[0]), cy], n, 40, n === 8 ? 22.5 : 0);
  polys.push(reg);
  lines.push(...ticksAll(reg));
  const c1 = cx(cells[1]);
  const rh: Pt[] = [[c1, cy - 42], [c1 + 26, cy], [c1, cy + 42], [c1 - 26, cy]];
  polys.push(rh);
  lines.push(...ticksAll(rh));
  const c2 = cx(cells[2]);
  const rect: Pt[] = [[c2 - 40, cy - 24], [c2 + 40, cy - 24], [c2 + 40, cy + 24], [c2 - 40, cy + 24]];
  polys.push(rect);
  rect.forEach((p, i) => lines.push(...rightMark(p, rect[(i + 3) % 4], rect[(i + 1) % 4], 8)));
  // 정다각형과 한눈에 구별되도록 크게 찌그러뜨린다
  const odd = randomPolygon(rand, n, [cx(cells[3]), cy], 44, 0.9);
  polys.push(odd);
  const answer = MARKS[cells[0]];
  return {
    key: `${n}:${cells.join()}:${odd.join()}`,
    prompt: "정다각형을 고르세요. (짧은 금은 길이가 같은 변, ㄴ 모양은 직각 표시입니다.)",
    visual: {
      kind: "shape",
      width: 4 * W,
      height: 150,
      label: "도형 ①~④",
      polygons: polys.map((points) => ({ points })),
      lines,
      texts: [0, 1, 2, 3].map((k) => ({ at: [cx(k), 136] as Pt, text: MARKS[k] })),
    },
    answer,
    choices: MARKS,
    hint: "정다각형은 변의 길이가 모두 같고, 각의 크기도 모두 같아야 해요. 둘 중 하나만 같으면 정다각형이 아니에요.",
    explanation: `${josa(answer, "은/는")} 변의 길이와 각의 크기가 모두 같은 정${POLY[n]}이에요. 마름모는 각의 크기가, 직사각형은 변의 길이가 모두 같지는 않아요.`,
  };
});

const REG_ANGLE: Record<number, number> = { 3: 60, 4: 90, 5: 108, 6: 120, 8: 135 };

export const l4RegularAngle = mid("l4-regular-angle", (rand) => {
  const n = pick(rand, REG_N);
  const sum = 180 * (n - 2);
  const ask = rand() < 0.5 ? "one" : "sum";
  const pts = regular([120, n === 3 ? 118 : 104], n, 78, n === 4 || n === 8 ? 180 / n : 0);
  const k = randInt(rand, 0, n - 1);
  const m = angleAt(pts[k], pts[(k + n - 1) % n], pts[(k + 1) % n], 20, ask === "one" ? "㉠" : `${REG_ANGLE[n]}°`, 12);
  return {
    key: `${n}:${ask}:${k}`,
    prompt:
      ask === "one"
        ? `정${POLY[n]}의 모든 각의 크기의 합은 ${sum}°입니다. 각 ㉠의 크기는 몇 도인가요?`
        : `정${POLY[n]}의 한 각의 크기를 나타낸 것입니다. 모든 각의 크기의 합은 몇 도인가요?`,
    visual: { kind: "shape", width: 240, height: 210, label: `정${POLY[n]}`, polygons: [{ points: pts }], lines: ticksAll(pts), arcs: m.arcs, texts: m.texts },
    answer: ask === "one" ? sum / n : sum,
    unit: "°",
    hint: "정다각형은 각의 크기가 모두 같아요. 그림에서 각이 몇 개인지 세어요.",
    explanation: ask === "one" ? `각이 ${n}개로 모두 같으므로 ${sum}° ÷ ${n} = ${sum / n}°` : `각이 ${n}개로 모두 같으므로 ${sum / n}° × ${n} = ${sum}°`,
  };
});

export const w4HexTriangle = word("w4-hex-triangle", (rand) => {
  const a = randInt(rand, 2, 12) * 2;
  const tri = regular([80, 116], 3, 62);
  const hex = regular([250, 104], 6, 58, 30);
  const tx = (() => {
    const st = sideText(tri[1], tri[2], tri, `${a} cm`);
    return { ...st, at: [st.at[0], st.at[1] + 6] as Pt };
  })();
  return {
    key: `${a}`,
    prompt: "정삼각형과 정육각형의 둘레가 같습니다. 정육각형의 한 변(□)은 몇 cm인가요?",
    visual: {
      kind: "shape",
      width: 330,
      height: 200,
      label: "정삼각형과 정육각형",
      polygons: [{ points: tri }, { points: hex }],
      lines: [...ticksAll(tri), ...ticksAll(hex)],
      texts: [tx, (() => {
        const st = sideText(hex[3], hex[4], hex, "□ cm");
        return { ...st, at: [st.at[0], st.at[1] + 6] as Pt };
      })()],
    },
    answer: a / 2,
    unit: "cm",
    hint: "먼저 정삼각형의 둘레를 구하고, 정육각형의 변의 수로 나누어요.",
    explanation: `${a} × 3 = ${a * 3}, ${a * 3} ÷ 6 = ${a / 2}(cm)`,
    mistakes: { [a * 3]: "정삼각형의 둘레만 구했어요." },
  };
});

/* ════════ 대각선 ════════ */

export const e4DiagVertex = easy("e4-diag-vertex", (rand) => {
  const n = randInt(rand, 5, 8);
  const pts = randomPolygon(rand, n, [120, 110], 88);
  const k = randInt(rand, 0, n - 1);
  const c: Pt = [120, 110];
  const off = mul(unit(sub(pts[k], c)), 14);
  return {
    key: `${n}:${pts.join()}:${k}`,
    prompt: `${POLY[n]}의 꼭짓점 ㄱ에서 그을 수 있는 대각선은 모두 몇 개인가요?`,
    visual: { kind: "shape", width: 240, height: 220, label: `꼭짓점 ㄱ을 표시한 ${POLY[n]}`, polygons: [{ points: pts }], dots: [pts[k]], texts: [{ at: rp(add(pts[k], off)), text: "ㄱ" }] },
    answer: n - 3,
    unit: "개",
    hint: "꼭짓점 ㄱ 자신과 이웃한 두 꼭짓점에는 대각선을 그을 수 없어요.",
    explanation: `꼭짓점 ${n}개 중 ㄱ과 이웃한 두 꼭짓점을 빼면 ${n} − 3 = ${n - 3}(개)`,
    mistakes: { [n - 1]: "이웃한 꼭짓점과 이은 선분은 대각선이 아니라 변이에요.", [n - 2]: "이웃한 꼭짓점 하나를 빼지 않았어요." },
  };
});

export const l4DiagRect = word("l4-diag-rect", (rand) => {
  const a = randInt(rand, 3, 15);
  const shape = pick(rand, ["직사각형", "정사각형"]);
  const ask = pick(rand, ["one", "sum"] as const);
  const [w, h] = shape === "정사각형" ? [150, 150] : [210, 130];
  const x0 = 40;
  const y0 = 36;
  const v: Pt[] = [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]];
  const o: Pt = [x0 + w / 2, y0 + h / 2];
  const nm = ["ㄱ", "ㄴ", "ㄷ", "ㄹ"];
  const off: Pt[] = [[-12, -12], [12, -12], [12, 12], [-12, 12]];
  const mark = randInt(rand, 0, 3);
  const mm = mul(add(o, v[mark]), 0.5);
  const d = unit(sub(v[mark], o));
  const lab = rp(add(mm, mul([-d[1], d[0]], 16)));
  return {
    key: `${a}:${shape}:${ask}:${mark}`,
    prompt: `${shape} ㄱㄴㄷㄹ의 두 대각선이 만나는 점을 ㅇ이라고 할 때, ${ask === "one" ? "대각선 ㄱㄷ의 길이는" : "두 대각선의 길이의 합은"} 몇 cm인가요?`,
    visual: {
      kind: "shape",
      width: w + 2 * x0,
      height: h + 2 * y0,
      label: `두 대각선을 그은 ${shape} ㄱㄴㄷㄹ`,
      polygons: [{ points: v }],
      lines: [{ from: v[0], to: v[2] }, { from: v[1], to: v[3] }, ...v.flatMap((p, i) => rightMark(p, v[(i + 3) % 4], v[(i + 1) % 4], 9))],
      texts: [...v.map((p, i) => ({ at: rp(add(p, off[i])), text: nm[i] })), { at: [o[0], o[1] + 16] as Pt, text: "ㅇ" }, { at: lab, text: `${a} cm` }],
    },
    answer: ask === "one" ? 2 * a : 4 * a,
    unit: "cm",
    hint: `${shape}의 두 대각선은 길이가 같고, 서로를 똑같이 둘로 나누어요.`,
    explanation: ask === "one" ? `선분 ㅇ${nm[mark]}의 2배 → ${a} × 2 = ${2 * a}(cm)` : `한 대각선 ${a} × 2 = ${2 * a}(cm), 두 대각선 ${2 * a} × 2 = ${4 * a}(cm)`,
    mistakes: { [ask === "one" ? a : 2 * a]: "대각선의 반만 생각했어요." },
  };
});

/* ════════ 모양 조각으로 채우기 ════════ */

const S = 44;
const H3 = (S * Math.sqrt(3)) / 2;
/** 정삼각형 모눈 좌표(i: 오른쪽, j: 오른쪽 위) → 화면 */
const T = (o: Pt, i: number, j: number): Pt => rp([o[0] + i * S + j * (S / 2), o[1] - j * H3]);

type Piece = { name: string; pts: (o: Pt) => Pt[]; size: number };
const PIECES: Record<string, Piece> = {
  tri: { name: "정삼각형", pts: (o) => [T(o, 0, 0), T(o, 1, 0), T(o, 0, 1)], size: 1 },
  rhom: { name: "마름모", pts: (o) => [T(o, 0, 0), T(o, 1, 0), T(o, 1, 1), T(o, 0, 1)], size: 2 },
  trap: { name: "사다리꼴", pts: (o) => [T(o, 0, 0), T(o, 2, 0), T(o, 1, 1), T(o, 0, 1)], size: 3 },
};
type Big = { name: string; pts: (o: Pt) => Pt[]; size: number; w: number; h: number };
const BIGS: Big[] = [
  { name: "정육각형", pts: (o) => [T(o, 1, 0), T(o, 2, 0), T(o, 2, 1), T(o, 1, 2), T(o, 0, 2), T(o, 0, 1)], size: 6, w: 2 * S, h: 2 * H3 },
  { name: "큰 정삼각형", pts: (o) => [T(o, 0, 0), T(o, 2, 0), T(o, 0, 2)], size: 4, w: 2 * S, h: 2 * H3 },
  { name: "큰 정삼각형", pts: (o) => [T(o, 0, 0), T(o, 3, 0), T(o, 0, 3)], size: 9, w: 3 * S, h: 3 * H3 },
  { name: "사다리꼴", pts: (o) => [T(o, 0, 0), T(o, 3, 0), T(o, 2, 1), T(o, 0, 1)], size: 5, w: 3 * S, h: H3 },
];

/** 큰 도형(왼쪽)과 조각(오른쪽) 그림 */
function tileScene(big: Big, piece: Piece, label: string): ShapeScene {
  const bo: Pt = [30, 30 + big.h];
  const px = 30 + big.w + 60;
  const po: Pt = [px, 30 + big.h];
  const width = Math.ceil(px + 2 * S + 30);
  const height = Math.ceil(big.h + 70);
  return {
    kind: "shape",
    width,
    height,
    label,
    polygons: [{ points: big.pts(bo) }, { points: piece.pts(po), fill: true }],
    texts: [{ at: [30 + big.w / 2, height - 14], text: big.name.replace("큰 ", "") }, { at: [px + S / 2 + (piece.size === 3 ? S / 2 : piece.size === 2 ? S / 4 : 0), height - 14], text: "조각" }],
  };
}

const TILE_SETS: { big: Big; piece: Piece }[] = [
  { big: BIGS[0], piece: PIECES.tri },
  { big: BIGS[0], piece: PIECES.rhom },
  { big: BIGS[0], piece: PIECES.trap },
  { big: BIGS[1], piece: PIECES.tri },
  { big: BIGS[2], piece: PIECES.tri },
  { big: BIGS[3], piece: PIECES.tri },
];

export const l4TileCount = easy("l4-tile-count", (rand) => {
  const t = pick(rand, TILE_SETS);
  const n = t.big.size / t.piece.size;
  return {
    key: `${TILE_SETS.indexOf(t)}`,
    prompt: `왼쪽 도형을 오른쪽 ${t.piece.name} 조각으로 빈틈없이 겹치지 않게 채우려고 합니다. 조각은 몇 개 필요한가요?`,
    visual: tileScene(t.big, t.piece, `채울 도형과 ${t.piece.name} 조각`),
    answer: n,
    unit: "개",
    hint: "도형 안에 조각을 하나씩 그려 넣어 보세요. 정삼각형 조각 몇 개 크기인지 비교해도 돼요.",
    explanation: `${t.big.name}은 정삼각형 조각 ${t.big.size}개 크기, ${t.piece.name} 조각은 정삼각형 ${t.piece.size}개 크기 → ${n}개`,
  };
});

export const l4TileHex = mid("l4-tile-hex", (rand) => {
  const piece = pick(rand, [PIECES.tri, PIECES.rhom, PIECES.trap]);
  const n = randInt(rand, 2, 6);
  const per = 6 / piece.size;
  return {
    key: `${piece.name}:${n}`,
    prompt: `오른쪽 ${piece.name} 조각으로 왼쪽 정육각형을 빈틈없이 채우려고 합니다. 같은 크기의 정육각형 ${n}개를 모두 채우려면 조각은 몇 개 필요한가요?`,
    visual: tileScene(BIGS[0], piece, `정육각형과 ${piece.name} 조각`),
    answer: per * n,
    unit: "개",
    hint: "먼저 정육각형 한 개를 채우는 데 조각이 몇 개 필요한지 그려 보세요.",
    explanation: `정육각형 한 개에 ${piece.name} ${per}개 → ${per} × ${n} = ${per * n}(개)`,
    mistakes: { [per]: "정육각형 한 개를 채우는 조각 수만 구했어요." },
  };
});

export const l4TileCannot = word("l4-tile-cannot", (rand) => {
  // 한 가지 조각만으로 평면을 빈틈없이 채울 수 없는 것: 정오각형·정팔각형
  const bad = pick(rand, [5, 8]);
  const goods = shuffle(rand, ["tri", "sq", "hex", "para", "rect"]).slice(0, 3);
  const cells = shuffle(rand, [0, 1, 2, 3]);
  const W = 100;
  const cy = 62;
  const cx = (k: number) => 50 + k * W;
  const draw = (kind: string, c: Pt): Pt[] => {
    if (kind === "tri") return regular([c[0], c[1] + 8], 3, 42);
    if (kind === "sq") return regular(c, 4, 40, 45);
    if (kind === "hex") return regular(c, 6, 40, 30);
    if (kind === "para") return [[c[0] - 40, c[1] + 26], [c[0] + 18, c[1] + 26], [c[0] + 40, c[1] - 26], [c[0] - 18, c[1] - 26]];
    if (kind === "rect") return [[c[0] - 42, c[1] - 24], [c[0] + 42, c[1] - 24], [c[0] + 42, c[1] + 24], [c[0] - 42, c[1] + 24]];
    return regular(c, Number(kind), 42, Number(kind) === 8 ? 22.5 : 0);
  };
  const kinds = [String(bad), ...goods];
  const polys = kinds.map((k, i) => draw(k, [cx(cells[i]), cy]));
  const answer = MARKS[cells[0]];
  return {
    key: `${kinds.join()}:${cells.join()}`,
    prompt: "한 가지 모양 조각만 여러 개 사용하여 평면을 빈틈없이 겹치지 않게 채우려고 합니다. 채울 수 없는 조각을 고르세요.",
    visual: {
      kind: "shape",
      width: 4 * W,
      height: 140,
      label: "모양 조각 ①~④",
      polygons: polys.map((points) => ({ points })),
      texts: [0, 1, 2, 3].map((k) => ({ at: [cx(k), 126] as Pt, text: MARKS[k] })),
    },
    answer,
    choices: MARKS,
    hint: "조각을 한 꼭짓점에 모았을 때 모인 각의 합이 꼭 360°가 되어야 빈틈이 없어요. 정삼각형은 6개, 정사각형은 4개, 정육각형은 3개가 모여요.",
    explanation: `${answer}의 ${josa(`정${POLY[bad]}`, "은/는")} 한 꼭짓점에 모으면 빈틈이 생기거나 겹쳐서 채울 수 없어요. 나머지 조각은 한 꼭짓점에 모인 각의 합이 360°가 되도록 이어 붙일 수 있어요.`,
  };
});

export const l4TileMix = word("l4-tile-mix", (rand) => {
  const hex = randInt(rand, 1, 3);
  const k = randInt(rand, 1, hex * 3 - 1);
  const tri = hex * 6 - 2 * k;
  // 정육각형 한 개를 마름모 조각 1개와 정삼각형 조각 4개로 채운 예시 그림
  const o: Pt = [30, 30 + 2 * H3];
  const hexPts = BIGS[0].pts(o);
  const inner: Lines = [
    [T(o, 1, 1), T(o, 2, 1)],
    [T(o, 1, 1), T(o, 0, 1)],
    [T(o, 1, 1), T(o, 1, 2)],
    [T(o, 1, 1), T(o, 0, 2)],
    [T(o, 1, 1), T(o, 1, 0)],
  ].map(([from, to]) => ({ from, to }));
  const rh = PIECES.rhom.pts(T(o, 1, 0));
  return {
    key: `${hex}:${k}`,
    prompt: `정육각형 ${hex}개를 그림처럼 마름모 조각과 정삼각형 조각으로 빈틈없이 채우려고 합니다. 마름모 조각을 ${k}개 사용한다면 정삼각형 조각은 몇 개 사용해야 하나요?`,
    visual: {
      kind: "shape",
      width: Math.ceil(60 + 2 * S),
      height: Math.ceil(60 + 2 * H3),
      label: "마름모 조각 1개와 정삼각형 조각 4개로 채운 정육각형",
      polygons: [{ points: hexPts }, { points: rh, fill: true }],
      lines: inner,
    },
    answer: tri,
    unit: "개",
    hint: "그림에서 마름모 조각 1개는 정삼각형 조각 몇 개와 크기가 같은지, 정육각형 1개는 정삼각형 조각 몇 개로 채울 수 있는지 먼저 알아봐요.",
    explanation: `마름모 1개 = 정삼각형 2개, 정육각형 1개 = 정삼각형 6개 → 정육각형 ${hex}개는 정삼각형 ${hex} × 6 = ${hex * 6}(개), 마름모 ${k}개는 정삼각형 ${k} × 2 = ${2 * k}(개) → ${hex * 6} − ${2 * k} = ${tri}(개)`,
    mistakes: { [hex * 6 - k]: "마름모 1개는 정삼각형 2개 크기예요." },
  };
});

