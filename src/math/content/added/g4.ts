import type { ShapeScene, Visual } from "../types";
import { word, type WordMap, type WordSpec } from "../words/word";
import { makeChoices, pick, randInt, shuffle } from "../../lib/random";
import { josa } from "../josa";
import { figureOk } from "../figure-check";
import { mixedText } from "../generators/grade4";

/*
 * 4학년 단원마다 새로 더한 생성기(하·중·상 하나씩, 2026-10-04).
 * 도형·측정·그래프 단원(각도·평면도형의 이동·막대그래프·삼각형·사각형·꺾은선그래프·다각형)은 모두 그림 문제로 만든다.
 */

type Pt = [number, number];
const RAD = Math.PI / 180;
const r1 = (n: number) => Math.round(n * 10) / 10;
const pt = (x: number, y: number): Pt => [r1(x), r1(y)];
const fmt = (n: number) => n.toLocaleString("ko-KR");
const LABELS = ["①", "②", "③", "④"];
const ORD = ["", "첫째", "둘째", "셋째", "넷째", "다섯째", "여섯째", "일곱째", "여덟째", "아홉째", "열째"];
const POLY = ["", "", "", "삼", "사", "오", "육", "칠", "팔"];

/** 그림이 틀 안에 있고 글자가 겹치지 않을 때만 쓴다(아니면 다시 뽑는다) */
const okScene = (s: ShapeScene): ShapeScene | null => (figureOk(s) ? s : null);

/** 선분 ab 가운데에서 도형 중심 반대쪽으로 dist만큼 떨어진 곳(변 길이 글자 자리) */
function outside(a: Pt, b: Pt, center: Pt, dist: number): Pt {
  const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let nx = -(b[1] - a[1]);
  let ny = b[0] - a[0];
  const len = Math.hypot(nx, ny);
  nx /= len;
  ny /= len;
  if ((m[0] - center[0]) * nx + (m[1] - center[1]) * ny < 0) {
    nx = -nx;
    ny = -ny;
  }
  return pt(m[0] + nx * dist, m[1] + ny * dist);
}

/** 꼭짓점 이름 자리: 도형 중심에서 꼭짓점 쪽으로 dist만큼 더 나간 곳 */
function beyond(v: Pt, center: Pt, dist: number): Pt {
  const dx = v[0] - center[0];
  const dy = v[1] - center[1];
  const len = Math.hypot(dx, dy) || 1;
  return pt(v[0] + (dx / len) * dist, v[1] + (dy / len) * dist);
}

const centroid = (ps: Pt[]): Pt => [ps.reduce((s, p) => s + p[0], 0) / ps.length, ps.reduce((s, p) => s + p[1], 0) / ps.length];

/** 수학 좌표(y 위쪽)의 점들을 box 안에 비율을 지켜 넣는다(화면 좌표, y 아래쪽) */
function fit(points: Pt[], x0: number, y0: number, w: number, h: number): Pt[] {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxY = Math.max(...ys);
  const bw = Math.max(...xs) - minX || 1;
  const bh = maxY - Math.min(...ys) || 1;
  const s = Math.min(w / bw, h / bh);
  const ox = x0 + (w - bw * s) / 2;
  const oy = y0 + (h - bh * s) / 2;
  return points.map(([x, y]) => pt(ox + (x - minX) * s, oy + (maxY - y) * s));
}

/** 밑변 (0,0)–(1,0), 두 밑각 b·c(°)인 삼각형의 세 꼭짓점 [왼쪽 아래, 오른쪽 아래, 위] (수학 좌표) */
function triangleByAngles(b: number, c: number): Pt[] {
  const a = 180 - b - c;
  const side = Math.sin(c * RAD) / Math.sin(a * RAD);
  return [[0, 0], [1, 0], [side * Math.cos(b * RAD), side * Math.sin(b * RAD)]];
}

/* ───────────── 4-1 큰 수 ───────────── */

const bigJoCompose = word(
  "a4-big-jo-compose",
  (rand): WordSpec => {
    const a = randInt(rand, 1, 9);
    const b = pick(rand, [randInt(rand, 1, 9) * 1000 + randInt(rand, 1, 9) * 100, randInt(rand, 10, 99) * 10, randInt(rand, 1, 999)]);
    const n = a * 1e12 + b * 1e8;
    const s = String(n);
    return {
      key: `${a}:${b}`,
      prompt: `1조가 ${a}개, 1억이 ${b}개인 수를 숫자로 쓰세요.`,
      answer: s,
      hint: "1조는 1 뒤에 0이 12개, 1억은 1 뒤에 0이 8개인 수예요. 조, 억, 만, 일 네 자리씩 끊어 생각해요.",
      explanation: `1조가 ${a}개, 1억이 ${b}개인 수는 ${a}조 ${b}억이고, 숫자로 쓰면 ${s}입니다.`,
      mistakes: { [String(a * 1e12 + b * 1e4)]: "억의 자리가 아니라 만의 자리에 썼어요." },
    };
  },
  1,
);

const PLACE = ["일", "십", "백", "천", "만", "십만", "백만", "천만"];

const bigDigitBiggest = word(
  "a4-big-digit-biggest",
  (rand): WordSpec => {
    const d = randInt(rand, 2, 9);
    const places = shuffle(rand, [1, 2, 3, 4, 5, 6, 7]).slice(0, 4);
    const nums = places.map((p) => {
      const digits = Array.from({ length: 8 }, (_, i) => {
        if (i === p) return d;
        let x = randInt(rand, i === 7 ? 1 : 0, 9);
        while (x === d) x = randInt(rand, i === 7 ? 1 : 0, 9);
        return x;
      });
      return digits.reduce((s, x, i) => s + x * 10 ** i, 0);
    });
    const best = Math.max(...places);
    const answer = fmt(nums[places.indexOf(best)]);
    return {
      key: `${d}:${nums.join(",")}`,
      prompt: `숫자 ${josa(d, "이/가")} 나타내는 값이 가장 큰 수를 고르세요.`,
      answer,
      choices: nums.map(fmt),
      hint: `각 수에서 숫자 ${josa(d, "이/가")} 어느 자리에 있는지 찾아요. 높은 자리에 있을수록 나타내는 값이 커요.`,
      explanation: `${answer}에서 ${josa(d, "은/는")} ${PLACE[best]}의 자리 숫자이므로 ${fmt(d * 10 ** best)}을 나타내고, 네 수 중 가장 큰 값입니다.`,
    };
  },
  2,
);

const bigCheck = word("a4-big-check-100man", (rand): WordSpec => {
  const a = randInt(rand, 1, 9);
  const b = randInt(rand, 1, 9);
  const ans = a * 100 + b * 10;
  return {
    key: `${a}:${b}`,
    prompt: `어느 회사가 번 돈 ${a}억 ${b}000만 원을 100만 원짜리 수표로 모두 바꾸려고 합니다. 수표는 몇 장이 필요한가요?`,
    answer: ans,
    unit: "장",
    hint: "1억은 100만이 100개, 1000만은 100만이 10개인 수예요.",
    explanation: `${a}억은 100만이 ${a * 100}개, ${b}000만은 100만이 ${b * 10}개입니다. 따라서 수표는 ${a * 100} + ${b * 10} = ${ans}(장) 필요합니다.`,
    mistakes: { [String(a * 10 + b)]: "1억을 100만이 10개인 수로 생각했어요.", [String(a * 1000 + b * 100)]: "1억을 100만이 1000개인 수로 생각했어요." },
  };
});

/* ───────────── 4-1 각도 ───────────── */

/** 꼭짓점 v에서 각도 deg(화면 시계 반대 방향, 오른쪽 0°) 쪽으로 len만큼 간 점 */
const ray = (v: Pt, deg: number, len: number): Pt => pt(v[0] + len * Math.cos(deg * RAD), v[1] - len * Math.sin(deg * RAD));

const angRightSplit = word(
  "a4-ang-right-split",
  (rand): WordSpec | null => {
    const a = randInt(rand, 4, 14) * 5;
    if (a === 45) return null;
    const flip = rand() < 0.5;
    const v: Pt = [30, 170];
    // 직각의 두 변: 0°와 90°, 사이의 선: a°(아래쪽 각이 a°)
    const known = flip ? [a, 90] : [0, a];
    const unknown = flip ? [0, a] : [a, 90];
    const mid = (r: number[]) => (r[0] + r[1]) / 2;
    const s = okScene({
      kind: "shape",
      width: 200,
      height: 190,
      label: `직각을 선 하나로 나눈 그림. 한 각은 ${a}°이고 다른 각은 ㉠입니다.`,
      lines: [
        { from: v, to: ray(v, 0, 160) },
        { from: v, to: ray(v, 90, 155) },
        { from: v, to: ray(v, a, 160) },
      ],
      arcs: [
        { c: v, r: 24, from: known[0], to: known[1] },
        { c: v, r: 32, from: unknown[0], to: unknown[1] },
      ],
      texts: [
        { at: ray(v, mid(known), 82), text: `${flip ? 90 - a : a}°` },
        { at: ray(v, mid(unknown), 82), text: "㉠" },
      ],
    });
    if (!s) return null;
    const k = flip ? 90 - a : a;
    const ans = 90 - k;
    return {
      key: `${k}`,
      prompt: "그림에서 큰 각은 직각입니다. ㉠의 각도를 구하세요.",
      visual: s,
      answer: ans,
      unit: "°",
      hint: "직각은 90°예요. 직각에서 아는 각을 빼요.",
      explanation: `90° − ${k}° = ${ans}°`,
      mistakes: { [String(180 - k)]: "직각을 180°로 생각했어요." },
    };
  },
  1,
);

const angAround = word(
  "a4-ang-around-point",
  (rand): WordSpec | null => {
    const a = randInt(rand, 11, 26) * 5;
    const b = randInt(rand, 11, 26) * 5;
    const c = randInt(rand, 11, 26) * 5;
    const x = 360 - a - b - c;
    if (x < 55 || x > 130) return null;
    const o: Pt = [110, 110];
    const start = randInt(rand, 0, 17) * 5;
    const sizes = [a, b, c, x];
    const bounds = [start];
    for (const z of sizes) bounds.push(bounds[bounds.length - 1] + z);
    const s = okScene({
      kind: "shape",
      width: 220,
      height: 220,
      label: `한 점에서 그은 네 선이 만드는 네 각. 세 각은 ${a}°, ${b}°, ${c}°이고 나머지 각은 ㉠입니다.`,
      lines: bounds.slice(0, 4).map((d) => ({ from: o, to: ray(o, d, 95) })),
      arcs: sizes.map((_, i) => ({ c: o, r: 20, from: bounds[i], to: bounds[i + 1] })),
      texts: sizes.map((z, i) => ({ at: ray(o, (bounds[i] + bounds[i + 1]) / 2, 55), text: i === 3 ? "㉠" : `${z}°` })),
    });
    if (!s) return null;
    return {
      key: `${a}:${b}:${c}`,
      prompt: "그림과 같이 한 점에서 네 개의 선을 그었습니다. ㉠의 각도를 구하세요.",
      visual: s,
      answer: x,
      unit: "°",
      hint: "한 점을 중심으로 한 바퀴 돈 각도는 360°예요.",
      explanation: `${a}° + ${b}° + ${c}° = ${a + b + c}°이므로 ㉠ = 360° − ${a + b + c}° = ${x}°`,
      mistakes: { [String(180 - a - b - c)]: "한 바퀴를 180°로 생각했어요." },
    };
  },
  2,
);

const angTriDiff = word("a4-ang-tri-diff", (rand): WordSpec | null => {
  const b = randInt(rand, 6, 15) * 5;
  const d = randInt(rand, 2, 8) * 5;
  const a = b + d;
  const c = 180 - a - b;
  if (c < 30 || c > 85 || a > 140) return null;
  const [B, C, A] = fit(triangleByAngles(b, c), 40, 35, 200, 125);
  const cen = centroid([A, B, C]);
  const bis = 180 - c / 2; // ㄷ에서 안쪽으로 향하는 방향(화면)
  const s = okScene({
    kind: "shape",
    width: 280,
    height: 190,
    label: `삼각형 ㄱㄴㄷ. 각 ㄷ은 ${c}°입니다.`,
    polygons: [{ points: [A, B, C] }],
    arcs: [{ c: C, r: 22, from: 180 - c, to: 180 }],
    texts: [
      { at: beyond(A, cen, 16), text: "ㄱ" },
      { at: beyond(B, cen, 16), text: "ㄴ" },
      { at: beyond(C, cen, 16), text: "ㄷ" },
      { at: ray(C, bis, 48), text: `${c}°` },
    ],
  });
  if (!s) return null;
  return {
    key: `${b}:${d}`,
    prompt: `삼각형 ㄱㄴㄷ에서 각 ㄱ은 각 ㄴ보다 ${d}° 더 큽니다. 각 ㄱ의 크기는 몇 도인가요?`,
    visual: s,
    answer: a,
    unit: "°",
    hint: "먼저 삼각형의 세 각의 합 180°에서 각 ㄷ을 빼 각 ㄱ과 각 ㄴ의 합을 구해요.",
    explanation: `각 ㄱ과 각 ㄴ의 합은 180° − ${c}° = ${a + b}°입니다. 이 합에서 차 ${josa(`${d}°`, "을/를")} 빼면 ${a + b - d}°이고, 이것은 각 ㄴ의 2배이므로 각 ㄴ은 ${b}°입니다. 각 ㄱ은 ${b}° + ${d}° = ${a}°입니다.`,
    mistakes: { [String(b)]: "각 ㄴ의 크기를 답했어요.", [String(a + b)]: "두 각의 합을 답했어요." },
  };
});

/* ───────────── 4-1 곱셈과 나눗셈 ───────────── */

const mdRemCannot = word(
  "a4-md-rem-cannot",
  (rand): WordSpec => {
    const t = randInt(rand, 2, 9) * 10;
    const ans = t + pick(rand, [0, randInt(rand, 1, 9), randInt(rand, 1, 4) * 10]);
    const small = new Set<number>();
    while (small.size < 3) small.add(randInt(rand, Math.max(1, t - 25), t - 1));
    const choices = shuffle(rand, [String(ans), ...[...small].map(String)]);
    return {
      key: `${t}:${ans}:${[...small].join(",")}`,
      prompt: `어떤 수를 ${josa(t, "으로/로")} 나누었을 때 나머지가 될 수 없는 수를 고르세요.`,
      answer: String(ans),
      choices,
      hint: "나머지는 나누는 수보다 작아야 해요.",
      explanation: `나머지는 나누는 수 ${t}보다 작아야 합니다. ${josa(ans, "은/는")} ${t}보다 작지 않으므로 나머지가 될 수 없습니다.`,
    };
  },
  1,
);

const mdZeroCount = word(
  "a4-md-zero-count",
  (rand): WordSpec => {
    const tens = rand() < 0.5;
    let x = randInt(rand, 2, 9);
    let y = randInt(rand, 2, 9);
    if (tens) [x, y] = pick(rand, [[5, 2], [5, 4], [5, 6], [5, 8], [2, 5], [4, 5], [6, 5], [8, 5]]);
    const a = x * 100;
    const b = y * 10;
    const p = a * b;
    const zeros = [...String(p)].filter((ch) => ch === "0").length;
    return {
      key: `${a}:${b}`,
      prompt: `${a} × ${b}의 곱에서 숫자 0은 모두 몇 개인가요?`,
      answer: zeros,
      unit: "개",
      hint: `${x} × ${josa(y, "을/를")} 먼저 계산하고, 곱하는 두 수의 0의 개수만큼 0을 붙여요.`,
      explanation: `${x} × ${y} = ${x * y}이고, 두 수의 0이 모두 3개이므로 ${a} × ${b} = ${p}입니다. ${p}에서 0은 ${zeros}개입니다.`,
      mistakes: zeros !== 3 ? { "3": `${x} × ${y} = ${x * y}의 0을 세지 않았어요.` } : undefined,
    };
  },
  2,
);

const mdBoxes = word("a4-md-boxes-total", (rand): WordSpec => {
  const p = randInt(rand, 24, 36) * 5;
  const m = randInt(rand, 21, 39);
  const q = randInt(rand, 20, 30) * 5;
  const n = randInt(rand, 12, 29);
  const ans = p * m + q * n;
  return {
    key: `${p}:${m}:${q}:${n}`,
    prompt: `과수원에서 사과를 한 상자에 ${p}개씩 ${m}상자에 담고, 한 상자에 ${q}개씩 ${n}상자에 담았습니다. 상자에 담은 사과는 모두 몇 개인가요?`,
    answer: ans,
    unit: "개",
    hint: "두 가지 상자에 담은 사과의 수를 각각 곱셈으로 구한 다음 더해요.",
    explanation: `${p} × ${m} = ${p * m}, ${q} × ${n} = ${q * n}이므로 모두 ${p * m} + ${q * n} = ${ans}(개)입니다.`,
    mistakes: { [String(p * m)]: "첫째 상자들의 사과만 구했어요.", [String(q * n)]: "둘째 상자들의 사과만 구했어요." },
  };
});

/* ───────────── 4-1 규칙 찾기 ───────────── */

const patMiddle = word(
  "a4-pat-middle",
  (rand): WordSpec => {
    const s = randInt(rand, 10, 99) * 100;
    const k = pick(rand, [100, 200, 500, 1000, 1100, 2000]);
    const m = randInt(rand, 1, 3);
    const terms = Array.from({ length: 5 }, (_, i) => s + k * i);
    return {
      key: `${s}:${k}:${m}`,
      prompt: "규칙에 따라 수를 늘어놓았습니다. □에 알맞은 수를 구하세요.",
      expression: terms.map((t, i) => (i === m ? "□" : String(t))).join(", "),
      answer: terms[m],
      hint: "이웃한 두 수의 차를 구해 규칙을 찾아요.",
      explanation: `${k}씩 커지는 규칙이므로 □는 ${terms[m - 1]} + ${k} = ${terms[m]}입니다.`,
    };
  },
  1,
);

const patSumNth = word(
  "a4-pat-sum-nth",
  (rand): WordSpec => {
    const a = randInt(rand, 1, 5) * 100;
    const b = a + randInt(rand, 1, 4) * 100;
    const n = randInt(rand, 6, 9);
    const line = (i: number) => `${a + 10 * i} + ${b + 10 * i} = ${a + b + 20 * i}`;
    const t = a + b + 20 * (n - 1);
    return {
      key: `${a}:${b}:${n}`,
      prompt: `계산식의 규칙을 찾아 계산 결과가 ${josa(t, "이/가")} 되는 계산식은 몇째인지 고르세요.\n${[0, 1, 2, 3].map(line).join("\n")}`,
      answer: ORD[n],
      choices: [ORD[6], ORD[7], ORD[8], ORD[9]],
      hint: "더하는 두 수가 각각 10씩 커지면 계산 결과는 몇씩 커지는지 살펴봐요.",
      explanation: `더하는 두 수가 각각 10씩 커지므로 계산 결과는 20씩 커집니다. ${a + b}에서 20씩 ${n - 1}번 커지면 ${t}이므로 ${ORD[n]} 계산식입니다(${line(n - 1)}).`,
    };
  },
  2,
);

const patGrowDiff = word("a4-pat-grow-diff", (rand): WordSpec => {
  const f = randInt(rand, 1, 9);
  const g = randInt(rand, 1, 5);
  const n = randInt(rand, 8, 10);
  const terms = [f];
  for (let i = 1; i < n; i++) terms.push(terms[i - 1] + g + i - 1);
  const diffs = terms.slice(1).map((t, i) => t - terms[i]);
  return {
    key: `${f}:${g}:${n}`,
    prompt: `규칙에 따라 수를 늘어놓았습니다. ${ORD[n]}에 올 수를 구하세요.\n${terms.slice(0, 5).join(", ")}, …`,
    answer: terms[n - 1],
    hint: "이웃한 두 수의 차를 차례로 써 보고, 차가 어떻게 변하는지 찾아요.",
    explanation: `이웃한 두 수의 차가 ${josa(diffs.slice(0, 4).join(", "), "으로/로")} 1씩 커집니다. 이어서 ${terms.slice(5).join(", ")}이므로 ${ORD[n]} 수는 ${terms[n - 1]}입니다.`,
    mistakes: { [String(terms[4] + g * (n - 5))]: "차가 늘 같다고 생각했어요." },
  };
});

/* ───────────── 4-2 분수의 덧셈과 뺄셈 ───────────── */

const frUnitCount = word(
  "a4-fr-unit-count",
  (rand): WordSpec => {
    const d = randInt(rand, 5, 12);
    const a = randInt(rand, 1, d - 2);
    const b = randInt(rand, 1, d - 1 - a);
    const u = `1/${d}`;
    return {
      key: `${d}:${a}:${b}`,
      prompt: `${josa(u, "이/가")} ${a}개인 수와 ${josa(u, "이/가")} ${b}개인 수를 더하면 ${josa(u, "이/가")} 몇 개인 수가 되나요?`,
      answer: a + b,
      unit: "개",
      hint: "분모가 같은 분수의 덧셈은 단위분수가 몇 개인지 더해요.",
      explanation: `${a}/${d} + ${b}/${d} = ${a + b}/${d}이므로 ${josa(u, "이/가")} ${a + b}개인 수입니다.`,
    };
  },
  1,
);

const frTape = word(
  "a4-fr-tape-overlap",
  (rand): WordSpec | null => {
    const d = randInt(rand, 4, 9);
    const x = randInt(rand, d + 1, 3 * d - 1);
    if (x % d === 0) return null;
    const o = randInt(rand, 1, d - 1);
    // 겹친 만큼 뺄 때 받아내림이 생기는 경우를 주로
    if ((2 * x) % d >= o && rand() < 0.6) return null;
    const total = 2 * x - o;
    const answer = mixedText(total, d);
    const L = mixedText(x, d);
    return {
      key: `${d}:${x}:${o}`,
      prompt: `길이가 ${L} m인 색 테이프 2장을 ${o}/${d} m만큼 겹치게 이어 붙였습니다. 이어 붙인 색 테이프의 전체 길이는 몇 m인가요?`,
      answer,
      choices: makeChoices(rand, answer, [mixedText(2 * x, d), mixedText(2 * x + o, d), mixedText(total - d, d)], () => mixedText(randInt(rand, d + 1, 7 * d), d)),
      hint: "두 장의 길이를 더한 다음, 겹친 부분의 길이를 빼요.",
      explanation: `${L} + ${L} = ${mixedText(2 * x, d)}, ${mixedText(2 * x, d)} − ${o}/${d} = ${answer}이므로 ${answer} m입니다.`,
    };
  },
  2,
);

const frTwoDays = word("a4-fr-two-days", (rand): WordSpec | null => {
  const W = randInt(rand, 3, 6);
  const d = randInt(rand, 4, 9);
  const a = randInt(rand, d + 1, 2 * d - 1);
  const b = randInt(rand, 1, d - 1);
  const r = W * d - a - b;
  if (r <= 0 || r % d === 0) return null;
  const A = mixedText(a, d);
  const B = mixedText(b, d);
  const answer = mixedText(r, d);
  return {
    key: `${W}:${d}:${a}:${b}`,
    prompt: `물이 ${W} L 있습니다. 어제 ${josa(`${A} L`, "을/를")} 마시고, 오늘 ${josa(`${B} L`, "을/를")} 마셨습니다. 남은 물은 몇 L인가요?`,
    answer,
    choices: makeChoices(rand, answer, [mixedText(W * d - a, d), mixedText(r + 2 * b, d), mixedText(r + d, d)], () => mixedText(randInt(rand, 1, W * d - 1), d)),
    hint: `${W}에서 1만큼을 분모가 ${d}인 분수로 바꾸어 차례로 빼요.`,
    explanation: `${W} − ${A} = ${mixedText(W * d - a, d)}, ${mixedText(W * d - a, d)} − ${B} = ${answer}이므로 남은 물은 ${answer} L입니다.`,
  };
});

/* ───────────── 4-2 소수의 덧셈과 뺄셈 ───────────── */

const dec = (hundredths: number) => String(hundredths / 100);

const decTenthsSum = word(
  "a4-dec-tenths-sum",
  (rand): WordSpec | null => {
    const a = randInt(rand, 3, 29);
    const b = randInt(rand, 3, 29);
    if ((a + b) % 10 === 0 || a === b) return null;
    const ans = String((a + b) / 10);
    return {
      key: `${a}:${b}`,
      prompt: `0.1이 ${a}개인 수와 0.1이 ${b}개인 수의 합을 소수로 쓰세요.`,
      answer: ans,
      hint: "0.1이 몇 개인지 먼저 더해요.",
      explanation: `0.1이 ${a} + ${b} = ${a + b}(개)이므로 ${ans}입니다.`,
      mistakes: { [String(a + b)]: "0.1이 몇 개인지만 썼어요." },
    };
  },
  1,
);

const decWholeMinus = word(
  "a4-dec-whole-minus",
  (rand): WordSpec | null => {
    const W = randInt(rand, 3, 9);
    const X = randInt(rand, 101, W * 100 - 50);
    if (X % 10 === 0) return null;
    const ans = W * 100 - X;
    return {
      key: `${W}:${X}`,
      prompt: "□에 알맞은 수를 구하세요.",
      expression: `□ + ${dec(X)} = ${W}`,
      answer: dec(ans),
      hint: `□는 ${W}에서 ${josa(dec(X), "을/를")} 뺀 수예요. ${josa(W, "을/를")} ${W}.00으로 생각하고 자리를 맞추어 빼요.`,
      explanation: `□ = ${W} − ${dec(X)} = ${dec(ans)}`,
    };
  },
  2,
);

const decDetour = word("a4-dec-detour", (rand): WordSpec | null => {
  const p = randInt(rand, 45, 150);
  const q = randInt(rand, 45, 150);
  const r = randInt(rand, Math.max(Math.abs(p - q) + 20, 60), p + q - 20);
  if (p % 10 === 0 || q % 10 === 0 || r % 10 === 0 || r > p + q - 20 || r < Math.abs(p - q) + 20) return null;
  const ans = p + q - r;
  return {
    key: `${p}:${q}:${r}`,
    prompt: `집에서 문구점까지는 ${dec(p)} km, 문구점에서 학교까지는 ${dec(q)} km입니다. 집에서 학교로 바로 가는 길은 ${dec(r)} km입니다. 문구점에 들렀다가 학교에 가는 길은 바로 가는 길보다 몇 km 더 먼가요?`,
    answer: dec(ans),
    unit: "km",
    hint: "문구점에 들렀다 가는 길의 길이를 먼저 구한 다음, 바로 가는 길의 길이를 빼요.",
    explanation: `${dec(p)} + ${dec(q)} = ${dec(p + q)}(km), ${dec(p + q)} − ${dec(r)} = ${dec(ans)}(km)`,
    mistakes: { [dec(p + q)]: "들렀다 가는 길의 길이만 구했어요." },
  };
});

/* ───────────── 4-1 평면도형의 이동 ───────────── */

const gridPoint = (c: number, r: number): Pt => [20 + 20 * c, 20 + 20 * r];

const mvPointSteps = word(
  "a4-mv-point-steps",
  (rand): WordSpec | null => {
    const c1 = randInt(rand, 0, 8);
    const r1_ = randInt(rand, 0, 5);
    const c2 = randInt(rand, 0, 8);
    const r2 = randInt(rand, 0, 5);
    if (c1 === c2 || r1_ === r2) return null;
    const A = gridPoint(c1, r1_);
    const B = gridPoint(c2, r2);
    const s = okScene({
      kind: "shape",
      width: 200,
      height: 140,
      grid: 20,
      label: "모눈 위의 두 점 ㄱ과 ㄴ",
      dots: [A, B],
      texts: [
        { at: [A[0] - 11, A[1] - 11], text: "ㄱ" },
        { at: [B[0] - 11, B[1] - 11], text: "ㄴ" },
      ],
    });
    if (!s) return null;
    const v = r2 < r1_ ? "위" : "아래";
    const h = c2 > c1 ? "오른" : "왼";
    const ans = Math.abs(c2 - c1);
    return {
      key: `${c1}:${r1_}:${c2}:${r2}`,
      prompt: `그림에서 점 ${josa("ㄱ", "을/를")} ${v}쪽으로 ${Math.abs(r2 - r1_)}칸 옮긴 뒤, ${h}쪽으로 몇 칸 옮기면 점 ㄴ의 위치에 오나요?`,
      visual: s,
      answer: ans,
      unit: "칸",
      hint: "점 ㄱ을 먼저 옮긴 자리에서 점 ㄴ까지 가로로 몇 칸인지 세어요.",
      explanation: `${v}쪽으로 ${Math.abs(r2 - r1_)}칸 옮기면 점 ㄴ과 같은 줄에 오고, 점 ㄴ까지 ${h}쪽으로 ${ans}칸입니다.`,
      mistakes: ans !== Math.abs(r2 - r1_) ? { [String(Math.abs(r2 - r1_))]: "세로로 옮긴 칸 수를 답했어요." } : undefined,
    };
  },
  1,
);

type Cell = [number, number];
const T = {
  H: ([c, r]: Cell): Cell => [3 - c, r],
  V: ([c, r]: Cell): Cell => [c, 3 - r],
  CW: ([c, r]: Cell): Cell => [3 - r, c],
  CCW: ([c, r]: Cell): Cell => [r, 3 - c],
  R180: ([c, r]: Cell): Cell => [3 - c, 3 - r],
  ID: (x: Cell): Cell => x,
};

/** 4×4 판 하나: 테두리, 안쪽 선, 색칠한 칸 */
function board(x0: number, y0: number, cell: number, at: Cell) {
  const size = cell * 4;
  return {
    polygons: [
      { points: [pt(x0, y0), pt(x0 + size, y0), pt(x0 + size, y0 + size), pt(x0, y0 + size)] as Pt[] },
      { points: [pt(x0 + at[0] * cell, y0 + at[1] * cell), pt(x0 + (at[0] + 1) * cell, y0 + at[1] * cell), pt(x0 + (at[0] + 1) * cell, y0 + (at[1] + 1) * cell), pt(x0 + at[0] * cell, y0 + (at[1] + 1) * cell)] as Pt[], fill: true },
    ],
    lines: [1, 2, 3].flatMap((i) => [
      { from: pt(x0 + i * cell, y0), to: pt(x0 + i * cell, y0 + size), width: 1 },
      { from: pt(x0, y0 + i * cell), to: pt(x0 + size, y0 + i * cell), width: 1 },
    ]),
  };
}

/** 위에 처음 판, 아래에 보기 판 4개(①~④) */
function boardScene(start: Cell, options: Cell[], label: string): ShapeScene {
  const parts = [board(110, 10, 20, start), ...options.map((o, i) => board(12 + 72 * i, 115, 14, o))];
  return {
    kind: "shape",
    width: 300,
    height: 200,
    label,
    polygons: parts.flatMap((p) => p.polygons),
    lines: parts.flatMap((p) => p.lines),
    texts: options.map((_, i) => ({ at: [40 + 72 * i, 188] as Pt, text: LABELS[i] })),
  };
}

const cellKey = (c: Cell) => `${c[0]},${c[1]}`;

/** 정답과 오답 후보에서 서로 다른 칸 4개를 골라 섞는다(정답이 첫째) */
function boardOptions(rand: () => number, answer: Cell, wrongs: Cell[]): { options: Cell[]; answerLabel: string } | null {
  const seen = new Map<string, Cell>([[cellKey(answer), answer]]);
  for (const w of wrongs) if (seen.size < 4 && !seen.has(cellKey(w))) seen.set(cellKey(w), w);
  if (seen.size < 4) return null;
  const options = shuffle(rand, [...seen.values()]);
  return { options, answerLabel: LABELS[options.findIndex((o) => cellKey(o) === cellKey(answer))] };
}

const mvBoardFlip = word(
  "a4-mv-board-flip",
  (rand): WordSpec | null => {
    const start: Cell = [randInt(rand, 0, 3), randInt(rand, 0, 3)];
    const dir = pick(rand, ["오른", "왼", "위", "아래"]);
    const side = dir === "오른" || dir === "왼";
    const ans = side ? T.H(start) : T.V(start);
    const picked = boardOptions(rand, ans, [side ? T.V(start) : T.H(start), T.R180(start), T.CW(start), T.CCW(start), start]);
    if (!picked) return null;
    return {
      key: `${cellKey(start)}:${dir}:${picked.options.map(cellKey).join("/")}`,
      prompt: `위쪽 판을 ${dir}쪽으로 뒤집었을 때의 모양을 아래에서 고르세요.`,
      visual: boardScene(start, picked.options, "위에 한 칸을 색칠한 4×4 판이 있고, 아래에 보기 판 ①~④가 있습니다."),
      answer: picked.answerLabel,
      choices: LABELS,
      hint: side ? "오른쪽이나 왼쪽으로 뒤집으면 왼쪽과 오른쪽이 서로 바뀌고, 위아래는 그대로예요." : "위쪽이나 아래쪽으로 뒤집으면 위쪽과 아래쪽이 서로 바뀌고, 왼쪽과 오른쪽은 그대로예요.",
      explanation: `색칠한 칸이 ${side ? "왼쪽과 오른쪽" : "위쪽과 아래쪽"}이 바뀐 자리로 옮겨진 것은 ${picked.answerLabel}입니다.`,
    };
  },
  2,
);

const mvBoardCombo = word("a4-mv-board-combo", (rand): WordSpec | null => {
  const start: Cell = [randInt(rand, 0, 3), randInt(rand, 0, 3)];
  const dir = pick(rand, ["오른", "왼", "위", "아래"]);
  const side = dir === "오른" || dir === "왼";
  const turn = pick(rand, [
    { text: "시계 방향으로 90°만큼", f: T.CW, other: T.CCW },
    { text: "시계 반대 방향으로 90°만큼", f: T.CCW, other: T.CW },
  ]);
  const flip = side ? T.H : T.V;
  const flipped = flip(start);
  const ans = turn.f(flipped);
  const picked = boardOptions(rand, ans, [flipped, turn.f(start), turn.other(flipped), T.R180(flipped), (side ? T.V : T.H)(flipped), start]);
  if (!picked) return null;
  return {
    key: `${cellKey(start)}:${dir}:${turn.text}:${picked.options.map(cellKey).join("/")}`,
    prompt: `위쪽 판을 ${dir}쪽으로 뒤집은 다음 ${turn.text} 돌렸습니다. 움직인 모양을 아래에서 고르세요.`,
    visual: boardScene(start, picked.options, "위에 한 칸을 색칠한 4×4 판이 있고, 아래에 보기 판 ①~④가 있습니다."),
    answer: picked.answerLabel,
    choices: LABELS,
    hint: "한 번에 하나씩 움직여요. 먼저 뒤집은 모양을 그린 다음, 그 모양을 돌려요.",
    explanation: `${dir}쪽으로 뒤집으면 ${side ? "왼쪽과 오른쪽" : "위쪽과 아래쪽"}이 바뀌고, 그 모양을 ${turn.text} 돌리면 위쪽에 있던 부분이 ${turn.f === T.CW ? "오른쪽" : "왼쪽"}으로 갑니다. 알맞은 모양은 ${picked.answerLabel}입니다.`,
  };
});

/* ───────────── 4-1 막대그래프 ───────────── */

const SPORTS = ["축구", "피구", "줄넘기", "수영", "야구", "배구"];

function bars(rand: () => number, step: number, min: number, maxCells: number, n = 4) {
  const labels = shuffle(rand, SPORTS).slice(0, n);
  const set = new Set<number>();
  while (set.size < n) set.add(randInt(rand, Math.ceil(min / step), maxCells) * step);
  return { labels, values: shuffle(rand, [...set]) };
}

const barTwoSum = word(
  "a4-bar-two-sum",
  (rand): WordSpec => {
    const step = pick(rand, [1, 2]);
    const { labels, values } = bars(rand, step, 2, step === 1 ? 10 : 8);
    const [i, j] = shuffle(rand, [0, 1, 2, 3]).slice(0, 2).sort();
    const ans = values[i] + values[j];
    const visual: Visual = { kind: "bars", title: "좋아하는 운동별 학생 수", labels, values, unit: "명", step, asked: [i, j] };
    return {
      key: `${labels.join(",")}:${values.join(",")}:${i}${j}`,
      prompt: `막대그래프를 보고 ${josa(labels[i], "과/와")} ${josa(labels[j], "을/를")} 좋아하는 학생은 모두 몇 명인지 구하세요.`,
      visual,
      answer: ans,
      unit: "명",
      hint: "세로 눈금 한 칸이 몇 명인지 먼저 확인하고, 두 막대가 나타내는 수를 읽어 더해요.",
      explanation: `${labels[i]} ${values[i]}명, ${labels[j]} ${values[j]}명이므로 ${values[i]} + ${values[j]} = ${ans}(명)입니다.`,
    };
  },
  1,
);

const barRescale = word(
  "a4-bar-rescale",
  (rand): WordSpec => {
    const { labels, values } = bars(rand, 10, 10, 6);
    const i = randInt(rand, 0, 3);
    const visual: Visual = { kind: "bars", title: "좋아하는 운동별 학생 수", labels, values, unit: "명", step: 5, asked: [i] };
    const ans = values[i] / 2;
    return {
      key: `${labels.join(",")}:${values.join(",")}:${i}`,
      prompt: `세로 눈금 한 칸을 2명으로 바꾸어 막대그래프를 다시 그리려고 합니다. ${labels[i]}의 막대는 세로 눈금 몇 칸으로 그려야 하나요?`,
      visual,
      answer: ans,
      unit: "칸",
      hint: "지금 그래프에서 세로 눈금 한 칸은 5명이에요. 먼저 학생 수를 읽어요.",
      explanation: `${josa(labels[i], "을/를")} 좋아하는 학생은 ${values[i]}명이고, 한 칸이 2명이면 ${values[i]} ÷ 2 = ${ans}(칸)입니다.`,
      mistakes: { [String(values[i] / 5)]: "지금 그래프의 칸 수를 답했어요." },
    };
  },
  2,
);

const barCatchUp = word("a4-bar-catch-up", (rand): WordSpec | null => {
  const step = pick(rand, [1, 2]);
  const { labels, values } = bars(rand, step, 2, step === 1 ? 12 : 9);
  const max = Math.max(...values);
  const i = randInt(rand, 0, 3);
  if (values[i] === max) return null;
  const ans = max - values[i] + 1;
  const visual: Visual = { kind: "bars", title: "좋아하는 운동별 학생 수", labels, values, unit: "명", step };
  const top = labels[values.indexOf(max)];
  return {
    key: `${labels.join(",")}:${values.join(",")}:${i}`,
    prompt: `${josa(labels[i], "을/를")} 좋아하는 학생이 더 늘어나서 ${josa(labels[i], "이/가")} 가장 많은 학생이 좋아하는 운동이 되려면, 적어도 몇 명이 더 늘어나야 하나요? (다른 운동의 학생 수는 그대로입니다.)`,
    visual,
    answer: ans,
    unit: "명",
    hint: "가장 많은 학생이 좋아하는 운동의 학생 수보다 1명이라도 많아야 해요.",
    explanation: `가장 많은 학생이 좋아하는 운동은 ${top} ${max}명이고 ${josa(labels[i], "은/는")} ${values[i]}명입니다. ${max} − ${values[i]} = ${max - values[i]}(명)이 늘면 같아지므로 적어도 ${ans}명이 더 늘어나야 합니다.`,
    mistakes: { [String(max - values[i])]: "같아지는 것과 더 많아지는 것을 헷갈렸어요." },
  };
});

/* ───────────── 4-2 삼각형 ───────────── */

/** 직각 표시(꼭짓점 v, 두 변 방향의 점 a·b) */
function rightMark(v: Pt, a: Pt, b: Pt, size = 9) {
  const u = (p: Pt): Pt => {
    const l = Math.hypot(p[0] - v[0], p[1] - v[1]);
    return [((p[0] - v[0]) / l) * size, ((p[1] - v[1]) / l) * size];
  };
  const [ux, uy] = u(a);
  const [wx, wy] = u(b);
  const p1 = pt(v[0] + ux, v[1] + uy);
  const p2 = pt(v[0] + ux + wx, v[1] + uy + wy);
  const p3 = pt(v[0] + wx, v[1] + wy);
  return [
    { from: p1, to: p2, width: 1 },
    { from: p2, to: p3, width: 1 },
  ];
}

const triPick = word(
  "a4-tri-pick-kind",
  (rand): WordSpec | null => {
    const target = pick(rand, ["예각삼각형", "둔각삼각형"] as const);
    const acute = (): [number, number] => {
      const b = randInt(rand, 10, 15) * 5;
      const c = randInt(rand, 10, 15) * 5;
      return 180 - b - c > 75 || 180 - b - c < 40 ? acute() : [b, c];
    };
    const obtuse = (): [number, number] => {
      const big = randInt(rand, 22, 26) * 5;
      const small = randInt(rand, 5, Math.min(10, (180 - big) / 5 - 5)) * 5;
      const where = randInt(rand, 0, 2);
      return where === 0 ? [big, small] : where === 1 ? [small, big] : [small, 180 - big - small];
    };
    const right = (): [number, number] => {
      const s = randInt(rand, 7, 11) * 5;
      return pick(rand, [[90, s], [s, 90], [s, 90 - s]] as [number, number][]);
    };
    const kinds = target === "둔각삼각형" ? [obtuse(), acute(), acute(), right()] : [acute(), obtuse(), obtuse(), right()];
    const order = shuffle(rand, [0, 1, 2, 3]);
    const tris = order.map((k) => kinds[k]);
    const answerLabel = LABELS[order.indexOf(0)];
    const polygons: { points: Pt[] }[] = [];
    const lines: { from: Pt; to: Pt; width: number }[] = [];
    tris.forEach(([b, c], i) => {
      const ps = fit(triangleByAngles(b, c), 8 + 75 * i, 12, 60, 80);
      polygons.push({ points: ps });
      const angles = [b, c, 180 - b - c];
      const r = angles.indexOf(90);
      if (r >= 0) lines.push(...rightMark(ps[r], ps[(r + 1) % 3], ps[(r + 2) % 3]));
    });
    const s = okScene({
      kind: "shape",
      width: 300,
      height: 130,
      label: "삼각형 ①~④",
      polygons,
      lines,
      texts: LABELS.map((t, i) => ({ at: [38 + 75 * i, 115] as Pt, text: t })),
    });
    if (!s) return null;
    return {
      key: `${target}:${tris.map((t) => t.join("-")).join("/")}`,
      prompt: `그림에서 ${josa(target, "을/를")} 찾아 고르세요.`,
      visual: s,
      answer: answerLabel,
      choices: LABELS,
      hint: target === "둔각삼각형" ? "한 각이 둔각(직각보다 큰 각)인 삼각형을 찾아요." : "세 각이 모두 예각(직각보다 작은 각)인 삼각형을 찾아요.",
      explanation: target === "둔각삼각형" ? `${josa(answerLabel, "은/는")} 한 각이 둔각이므로 둔각삼각형입니다.` : `${josa(answerLabel, "은/는")} 세 각이 모두 예각이므로 예각삼각형입니다.`,
    };
  },
  1,
);

/** 변 ab의 가운데에 길이가 같다는 표시(짧은 선) */
function tick(a: Pt, b: Pt, len = 6) {
  const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const nx = (-(b[1] - a[1]) / l) * len;
  const ny = ((b[0] - a[0]) / l) * len;
  return { from: pt(m[0] - nx, m[1] - ny), to: pt(m[0] + nx, m[1] + ny), width: 1.5 };
}

const triIsoBase = word(
  "a4-tri-iso-base",
  (rand): WordSpec | null => {
    const a = randInt(rand, 5, 15);
    const b = randInt(rand, 3, 2 * a - 2);
    if (b === a) return null;
    const P = 2 * a + b;
    const h = Math.sqrt(a * a - (b / 2) ** 2);
    const [B, C, A] = fit([[0, 0], [b, 0], [b / 2, h]], 50, 25, 180, 120);
    const cen = centroid([A, B, C]);
    const s = okScene({
      kind: "shape",
      width: 280,
      height: 190,
      label: `이등변삼각형. 길이가 같은 두 변에 표시가 있고, 한 변은 ${a} cm, 나머지 한 변은 ㉠입니다.`,
      polygons: [{ points: [A, B, C] }],
      lines: [tick(A, B), tick(A, C)],
      texts: [
        { at: outside(A, B, cen, 26), text: `${a} cm` },
        { at: outside(B, C, cen, 16), text: "㉠" },
      ],
    });
    if (!s) return null;
    return {
      key: `${a}:${b}`,
      prompt: `그림은 세 변의 길이의 합이 ${P} cm인 이등변삼각형입니다. ㉠은 몇 cm인가요?`,
      visual: s,
      answer: b,
      unit: "cm",
      hint: "이등변삼각형은 두 변의 길이가 같아요. 표시한 두 변의 길이를 먼저 생각해요.",
      explanation: `길이가 같은 두 변은 ${a} cm씩이므로 ${a} + ${a} = ${2 * a}(cm)이고, ㉠ = ${P} − ${2 * a} = ${b}(cm)입니다.`,
      mistakes: { [String(P - a)]: "길이가 같은 변을 하나만 뺐어요." },
    };
  },
  2,
);

const triEquiIso = word("a4-tri-equi-iso", (rand): WordSpec | null => {
  const a = randInt(rand, 6, 12);
  const b = randInt(rand, Math.floor(a / 2) + 2, a + 3);
  if (b === a) return null;
  const P = 2 * a + 2 * b;
  // 수학 좌표: ㄴ(0,0), ㄷ(a,0), ㄱ(a/2, a√3/2), ㄹ은 ㄱㄷ 바깥쪽
  const A: Pt = [a / 2, (a * Math.sqrt(3)) / 2];
  const C: Pt = [a, 0];
  const M: Pt = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2];
  const h2 = Math.sqrt(b * b - (a / 2) ** 2);
  const D: Pt = [M[0] + h2 * Math.cos(30 * RAD), M[1] + h2 * Math.sin(30 * RAD)];
  const [sB, sC, sA, sD] = fit([[0, 0], C, A, D], 35, 30, 230, 140);
  const cen = centroid([sA, sB, sC, sD]);
  const s = okScene({
    kind: "shape",
    width: 300,
    height: 200,
    label: `정삼각형 ㄱㄴㄷ과 이등변삼각형 ㄱㄷㄹ을 붙인 사각형 ㄱㄴㄷㄹ. 변 ㄴㄷ은 ${a} cm입니다.`,
    polygons: [{ points: [sA, sB, sC, sD] }],
    lines: [{ from: sA, to: sC }],
    texts: [
      { at: beyond(sA, cen, 16), text: "ㄱ" },
      { at: beyond(sB, cen, 16), text: "ㄴ" },
      { at: beyond(sC, cen, 16), text: "ㄷ" },
      { at: beyond(sD, cen, 16), text: "ㄹ" },
      { at: outside(sB, sC, cen, 16), text: `${a} cm` },
    ],
  });
  if (!s) return null;
  return {
    key: `${a}:${b}`,
    prompt: `삼각형 ㄱㄴㄷ은 정삼각형이고, 삼각형 ㄱㄷㄹ은 변 ㄱㄹ과 변 ㄷㄹ의 길이가 같은 이등변삼각형입니다. 사각형 ㄱㄴㄷㄹ의 네 변의 길이의 합이 ${P} cm일 때, 변 ㄷㄹ의 길이는 몇 cm인가요?`,
    visual: s,
    answer: b,
    unit: "cm",
    hint: "정삼각형은 세 변의 길이가 같아요. 사각형의 네 변 가운데 정삼각형의 변이 어느 것인지 찾아요.",
    explanation: `변 ㄱㄴ과 변 ㄴㄷ은 정삼각형의 변이므로 ${a} cm씩, 합은 ${2 * a} cm입니다. 변 ㄷㄹ과 변 ㄹㄱ의 합은 ${P} − ${2 * a} = ${2 * b}(cm)이고, 두 변의 길이가 같으므로 변 ㄷㄹ은 ${2 * b} ÷ 2 = ${b}(cm)입니다.`,
    mistakes: { [String(2 * b)]: "두 변의 길이의 합을 답했어요.", [String((P - a) / 2)]: "정삼각형의 변을 하나만 뺐어요." },
  };
});

/* ───────────── 4-2 사각형 ───────────── */

/** 평행사변형: 아래 변 a, 옆 변 b, 왼쪽 아래 각 ang(°). [ㄱ 왼쪽 위, ㄴ 왼쪽 아래, ㄷ 오른쪽 아래, ㄹ 오른쪽 위] */
function parallelogram(a: number, b: number, ang: number, x0: number, y0: number, w: number, h: number): Pt[] {
  const dx = b * Math.cos(ang * RAD);
  const dy = b * Math.sin(ang * RAD);
  const [B, C, D, A] = fit([[0, 0], [a, 0], [a + dx, dy], [dx, dy]], x0, y0, w, h);
  return [A, B, C, D];
}

const quadRhombusPerim = word(
  "a4-quad-rhombus-perim",
  (rand): WordSpec | null => {
    const a = randInt(rand, 4, 15);
    const ang = randInt(rand, 10, 15) * 5;
    const ps = parallelogram(a, a, ang, 40, 25, 200, 120);
    const cen = centroid(ps);
    const s = okScene({
      kind: "shape",
      width: 280,
      height: 180,
      label: `마름모. 한 변의 길이는 ${a} cm입니다.`,
      polygons: [{ points: ps }],
      texts: [{ at: outside(ps[1], ps[2], cen, 16), text: `${a} cm` }],
    });
    if (!s) return null;
    return {
      key: `${a}:${ang}`,
      prompt: "그림은 마름모입니다. 네 변의 길이의 합은 몇 cm인가요?",
      visual: s,
      answer: 4 * a,
      unit: "cm",
      hint: "마름모는 네 변의 길이가 모두 같아요.",
      explanation: `마름모의 네 변은 모두 ${a} cm이므로 ${a} × 4 = ${4 * a}(cm)입니다.`,
      mistakes: { [String(2 * a)]: "두 변만 더했어요.", [String(a)]: "한 변의 길이를 답했어요." },
    };
  },
  1,
);

const quadParaSide = word(
  "a4-quad-para-side-back",
  (rand): WordSpec | null => {
    const a = randInt(rand, 8, 16);
    const b = randInt(rand, 4, a - 2);
    const ang = randInt(rand, 11, 15) * 5;
    const P = 2 * (a + b);
    const ps = parallelogram(a, b, ang, 40, 25, 200, 120);
    const cen = centroid(ps);
    const s = okScene({
      kind: "shape",
      width: 280,
      height: 180,
      label: `평행사변형. 아래 변은 ${a} cm이고 왼쪽 변은 ㉠입니다.`,
      polygons: [{ points: ps }],
      texts: [
        { at: outside(ps[1], ps[2], cen, 16), text: `${a} cm` },
        { at: outside(ps[0], ps[1], cen, 16), text: "㉠" },
      ],
    });
    if (!s) return null;
    return {
      key: `${a}:${b}:${ang}`,
      prompt: `그림은 네 변의 길이의 합이 ${P} cm인 평행사변형입니다. ㉠은 몇 cm인가요?`,
      visual: s,
      answer: b,
      unit: "cm",
      hint: "평행사변형은 마주 보는 두 변의 길이가 같아요. 네 변의 합을 반으로 나누면 이웃한 두 변의 합이에요.",
      explanation: `이웃한 두 변의 길이의 합은 ${P} ÷ 2 = ${a + b}(cm)이므로 ㉠ = ${a + b} − ${a} = ${b}(cm)입니다.`,
      mistakes: { [String(P - a)]: "마주 보는 변의 길이가 같은 것을 생각하지 않았어요.", [String(a + b)]: "이웃한 두 변의 합을 답했어요." },
    };
  },
  2,
);

const quadParaAngle = word("a4-quad-para-angle-diff", (rand): WordSpec => {
  const B = randInt(rand, 10, 16) * 5;
  const d = 180 - 2 * B;
  const A = B + d;
  const a = randInt(rand, 8, 14);
  const b = randInt(rand, 5, 8);
  const ps = parallelogram(a, b, B, 40, 30, 200, 110);
  const cen = centroid(ps);
  const s: ShapeScene = {
    kind: "shape",
    width: 280,
    height: 175,
    label: "평행사변형 ㄱㄴㄷㄹ",
    polygons: [{ points: ps }],
    texts: ["ㄱ", "ㄴ", "ㄷ", "ㄹ"].map((t, i) => ({ at: beyond(ps[i], cen, 15), text: t })),
  };
  return {
    key: `${B}:${a}:${b}`,
    prompt: `평행사변형 ㄱㄴㄷㄹ에서 각 ㄱ의 크기는 각 ㄴ의 크기보다 ${d}° 더 큽니다. 각 ㄱ의 크기는 몇 도인가요?`,
    visual: s,
    answer: A,
    unit: "°",
    hint: "평행사변형에서 이웃한 두 각의 크기의 합은 180°예요.",
    explanation: `각 ㄱ과 각 ㄴ은 이웃한 두 각이므로 합이 180°입니다. 180°에서 차 ${josa(`${d}°`, "을/를")} 빼면 ${2 * B}°이고, 이것은 각 ㄴ의 2배이므로 각 ㄴ은 ${B}°입니다. 따라서 각 ㄱ은 ${B}° + ${d}° = ${A}°입니다.`,
    mistakes: { [String(B)]: "각 ㄴ의 크기를 답했어요.", [String(180 - d)]: "차를 빼기만 했어요." },
  };
});

/* ───────────── 4-2 꺾은선그래프 ───────────── */

const HOURS = ["오전 9시", "오전 10시", "오전 11시", "낮 12시", "오후 1시"];

const lineFirstOver = word(
  "a4-line-first-over",
  (rand): WordSpec | null => {
    const values = [randInt(rand, 4, 6) * 2];
    for (let k = 1; k < 5; k++) values.push(values[k - 1] + randInt(rand, 1, 2) * 2);
    if (values[4] > 24) return null;
    const i = randInt(rand, 1, 4);
    const t = values[i] - 1;
    const visual: Visual = { kind: "line", title: "시각별 운동장의 기온", labels: HOURS, values, unit: "°C", step: 2 };
    const answer = HOURS[i];
    return {
      key: `${values.join(",")}:${i}`,
      prompt: `꺾은선그래프를 보고 운동장의 기온이 처음으로 ${t}°C보다 높아진 때를 고르세요.`,
      visual,
      answer,
      choices: makeChoices(rand, answer, HOURS.filter((h) => h !== answer), () => pick(rand, HOURS)),
      hint: "왼쪽부터 차례로 점이 나타내는 기온을 읽어요.",
      explanation: `기온은 ${values.map((v, k) => `${HOURS[k]} ${v}°C`).join(", ")}이므로 처음으로 ${t}°C보다 높아진 때는 ${answer}입니다.`,
    };
  },
  1,
);

const DAYS = ["월요일", "화요일", "수요일", "목요일", "금요일"];

const lineLeastChange = word(
  "a4-line-least-change",
  (rand): WordSpec | null => {
    // 이웃한 두 요일 사이의 변화(칸)는 서로 다르게 1~5칸, 늘거나 줄어든다
    const steps = shuffle(rand, [1, 2, 3, 4, 5]).slice(0, 4).map((x) => (rand() < 0.5 ? -x : x));
    const cells = [0];
    for (const x of steps) cells.push(cells[cells.length - 1] + x);
    const low = Math.min(...cells);
    const high = Math.max(...cells);
    if (high - low > 10) return null;
    const base = randInt(rand, 1 - low, 12 - high);
    const values = cells.map((c) => (c + base) * 2);
    const diffs = values.slice(1).map((v, k) => Math.abs(v - values[k]));
    if (new Set(diffs).size !== 4) return null;
    const m = diffs.indexOf(Math.min(...diffs));
    const opts = DAYS.slice(0, 4).map((d, k) => `${josa(d, "과/와")} ${DAYS[k + 1]} 사이`);
    const visual: Visual = { kind: "line", title: "요일별 도서실 방문자 수", labels: DAYS, values, unit: "명", step: 2 };
    return {
      key: values.join(","),
      prompt: "꺾은선그래프를 보고 도서실 방문자 수의 변화가 가장 작은 때를 고르세요.",
      visual,
      answer: opts[m],
      choices: opts,
      hint: "선분의 기울어진 정도가 가장 작은 곳을 찾아요. 늘어난 것과 줄어든 것을 모두 살펴봐요.",
      explanation: `이웃한 두 요일 사이의 변화는 ${diffs.map((x) => `${x}명`).join(", ")}이므로 가장 작은 때는 ${opts[m]}입니다.`,
    };
  },
  2,
);

const lineRescale = word("a4-line-rescale", (rand): WordSpec | null => {
  const values = [randInt(rand, 3, 6) * 10];
  for (let k = 1; k < 5; k++) values.push(values[k - 1] + pick(rand, [-2, -1, 1, 2, 3]) * 10);
  if (values.some((v) => v < 10 || v > 120)) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  if (max - min < 30) return null;
  const ans = (max - min) / 5;
  const labels = ["1주", "2주", "3주", "4주", "5주"];
  const visual: Visual = { kind: "line", title: "주별 줄넘기 기록", labels, values, unit: "번", step: 10 };
  return {
    key: values.join(","),
    prompt: "세로 눈금 한 칸을 5번으로 바꾸어 꺾은선그래프를 다시 그리려고 합니다. 가장 높은 점과 가장 낮은 점은 세로 눈금 몇 칸만큼 차이가 나나요?",
    visual,
    answer: ans,
    unit: "칸",
    hint: "지금 그래프에서 가장 큰 값과 가장 작은 값을 읽고, 그 차를 새 눈금 한 칸의 크기로 나누어요.",
    explanation: `가장 큰 값은 ${max}번, 가장 작은 값은 ${min}번이므로 차는 ${max} − ${min} = ${max - min}(번)입니다. 한 칸이 5번이면 ${max - min} ÷ 5 = ${ans}(칸)입니다.`,
    mistakes: { [String((max - min) / 10)]: "지금 그래프의 칸 수를 답했어요.", [String(max - min)]: "기록의 차를 답했어요." },
  };
});

/* ───────────── 4-2 다각형 ───────────── */

function regularPolygon(n: number, c: Pt, r: number): Pt[] {
  return Array.from({ length: n }, (_, i) => pt(c[0] + r * Math.cos((-90 + (360 / n) * i) * RAD), c[1] + r * Math.sin((-90 + (360 / n) * i) * RAD)));
}

const polyRegSide = word(
  "a4-poly-reg-side",
  (rand): WordSpec | null => {
    const n = randInt(rand, 5, 8);
    const side = randInt(rand, 3, 12);
    const P = n * side;
    const c: Pt = [110, 95];
    const ps = regularPolygon(n, c, 70);
    const s = okScene({
      kind: "shape",
      width: 220,
      height: 190,
      label: `정${POLY[n]}각형. 한 변에 ㉠이 적혀 있습니다.`,
      polygons: [{ points: ps }],
      texts: [{ at: outside(ps[0], ps[1], c, 16), text: "㉠" }],
    });
    if (!s) return null;
    return {
      key: `${n}:${side}`,
      prompt: `그림은 모든 변의 길이의 합이 ${P} cm인 정${POLY[n]}각형입니다. ㉠은 몇 cm인가요?`,
      visual: s,
      answer: side,
      unit: "cm",
      hint: "정다각형은 변의 길이가 모두 같아요. 변이 몇 개인지 세어 보세요.",
      explanation: `정${POLY[n]}각형은 변이 ${n}개이고 길이가 모두 같으므로 ㉠ = ${P} ÷ ${n} = ${side}(cm)입니다.`,
    };
  },
  1,
);

const polyDiagSum = word(
  "a4-poly-diag-sum",
  (rand): WordSpec | null => {
    const n1 = randInt(rand, 4, 8);
    const n2 = randInt(rand, 4, 8);
    if (n1 === n2) return null;
    const d1 = (n1 * (n1 - 3)) / 2;
    const d2 = (n2 * (n2 - 3)) / 2;
    const s = okScene({
      kind: "shape",
      width: 300,
      height: 175,
      label: `두 도형 가와 나. 가는 ${POLY[n1]}각형, 나는 ${POLY[n2]}각형입니다.`,
      polygons: [{ points: regularPolygon(n1, [75, 80], 58) }, { points: regularPolygon(n2, [225, 80], 58) }],
      texts: [
        { at: [75, 160], text: "가" },
        { at: [225, 160], text: "나" },
      ],
    });
    if (!s) return null;
    return {
      key: `${n1}:${n2}`,
      prompt: "두 도형 가와 나에 그을 수 있는 대각선은 모두 몇 개인가요?",
      visual: s,
      answer: d1 + d2,
      unit: "개",
      hint: "꼭짓점 하나에서 그을 수 있는 대각선 수를 세고, 같은 대각선을 두 번 세지 않도록 해요.",
      explanation: `가는 ${POLY[n1]}각형이므로 대각선이 ${d1}개, 나는 ${POLY[n2]}각형이므로 대각선이 ${d2}개입니다. 모두 ${d1} + ${d2} = ${d1 + d2}(개)입니다.`,
      mistakes: { [String(n1 - 3 + n2 - 3)]: "한 꼭짓점에서 그은 대각선만 셌어요.", [String(d1 * 2 + d2 * 2)]: "같은 대각선을 두 번 셌어요." },
    };
  },
  2,
);

const polyHouse = word("a4-poly-house", (rand): WordSpec => {
  const side = randInt(rand, 4, 15);
  const P = 5 * side;
  const L = 90;
  const x0 = 70;
  const y0 = 180;
  const sq: Pt[] = [pt(x0, y0), pt(x0 + L, y0), pt(x0 + L, y0 - L), pt(x0, y0 - L)];
  const apex = pt(x0 + L / 2, y0 - L - (L * Math.sqrt(3)) / 2);
  const s: ShapeScene = {
    kind: "shape",
    width: 230,
    height: 195,
    label: "정사각형 위에 정삼각형을 한 변끼리 맞붙여 만든 오각형",
    polygons: [{ points: [sq[0], sq[1], sq[2], apex, sq[3]] }],
    lines: [{ from: sq[3], to: sq[2], dashed: true, width: 1 }],
  };
  return {
    key: `${side}`,
    prompt: `그림은 한 변의 길이가 같은 정사각형과 정삼각형을 한 변끼리 맞붙여 만든 오각형입니다. 이 오각형의 모든 변의 길이의 합이 ${P} cm일 때, 정사각형의 네 변의 길이의 합은 몇 cm인가요?`,
    visual: s,
    answer: 4 * side,
    unit: "cm",
    hint: "정사각형과 정삼각형의 한 변의 길이가 같아요. 오각형의 둘레는 이 길이의 몇 배인지 생각해요.",
    explanation: `오각형의 변 5개는 모두 길이가 같으므로 한 변은 ${P} ÷ 5 = ${side}(cm)입니다. 정사각형의 네 변의 길이의 합은 ${side} × 4 = ${4 * side}(cm)입니다.`,
    mistakes: { [String(side)]: "한 변의 길이를 답했어요.", [String(P)]: "오각형의 둘레를 답했어요." },
  };
});

/** 4학년 단원마다 새로 더한 생성기(하·중·상 하나씩): 단원 id → 차시 id → 생성기 */
/** 분수·소수 그림 유형(l4-fbar-add·l4-dec-line-add)이 하 칸의 1/4~2/5를 지키도록(math-king 출제기 검사) 비중을 0.5로 둔다 */
export const addedG4: WordMap = {
  "g4-s1-big-numbers": { jo: [bigJoCompose], sipman: [bigDigitBiggest], eok: [bigCheck] },
  "g4-s1-angles": { "add-sub": [angRightSplit], quad: [angAround], triangle: [angTriDiff] },
  "g4-s1-mul-div": { "div-tens": [mdRemCannot], "mul-tens": [mdZeroCount], "mul-3x2d": [mdBoxes] },
  "g4-s1-patterns": { "number-seq": [patMiddle, patGrowDiff], "calc-seq": [patSumNth] },
  "g4-s2-fraction-add-sub": { "proper-add": [{ ...frUnitCount, weight: 0.5 }], "borrow-sub": [frTape], "whole-sub": [frTwoDays] },
  "g4-s2-decimal-add-sub": { "dec-add": [{ ...decTenthsSum, weight: 0.5 }], "dec-sub": [decWholeMinus, decDetour] },
  "g4-s1-moving": { "point-move": [mvPointSteps], flip: [mvBoardFlip], combo: [mvBoardCombo] },
  "g4-s1-bar-graph": { "bar-interpret": [barTwoSum], "bar-draw": [barRescale], "bar-apply": [barCatchUp] },
  "g4-s2-triangles": { "by-angles": [triPick], "by-sides": [triIsoBase], equilateral: [triEquiIso] },
  "g4-s2-quadrilaterals": { rhombus: [quadRhombusPerim], parallelogram: [quadParaSide, quadParaAngle] },
  "g4-s2-line-graph": { "line-know": [lineFirstOver], "line-interpret": [lineLeastChange], "line-draw": [lineRescale] },
  "g4-s2-polygons": { regular: [polyRegSide], diagonal: [polyDiagSum], polygon: [polyHouse] },
};
