/** 6-1 차시별 생성기 */
import { shuffle } from "../../lib/random";
import type { ShapeScene, Visual } from "../types";
import { COMPARE_CHOICES } from "../generators/common";
import { BAND_BELOW, LETTERS, SOLO, bandNeedsBelow, leader, lineup, type SolidKind, bandGraph, boxLabels, compose, cubeBlock, cuboid, cuboidNet, fitLen, labelOut, pictureGraph, pieGraph, polyHeight, prism, prismNet, pyramid, row, text, type Block, type Item, type Parts, type Place, type Pt, type Solid } from "./g6-figs";
import {
  cmpText,
  digitsDistinct,
  easy,
  fracOpts,
  gcd,
  j,
  jf,
  jp,
  mid,
  names,
  opts,
  pick,
  poly,
  randInt,
  reduced,
  table,
  trim,
  won,
  word,
} from "./g6-util";

/* ── 6-1-1 분수의 나눗셈 ── */

export const divExprChoose = mid("l6-div-expr-choose", (rand) => {
  const b = randInt(rand, 3, 9);
  const a = randInt(rand, 1, b - 1);
  const [item, u] = pick(rand, [["케이크", "개"], ["색 테이프", " m"], ["주스", " L"]]);
  const answer = `${a} ÷ ${b}`;
  return {
    key: `${a}:${b}:${item}`,
    prompt: `${item} ${a}${j(u, "를")} ${b}명이 똑같이 나누어 가지려고 합니다. 한 명이 가지는 양을 구하는 식을 고르세요.`,
    answer,
    choices: opts(rand, answer, [`${b} ÷ ${a}`, `${a} × ${b}`, `${b} − ${a}`], () => `${a} + ${b}`),
    hint: "(전체 양) ÷ (사람 수)로 구해요.",
    explanation: `${a} ÷ ${b} = ${reduced(a, b)}`,
  };
});

export const divCardMin = word("l6-div-card-min", (rand) => {
  const cards = digitsDistinct(rand, 3).sort((x, y) => x - y);
  const [lo, md, hi] = cards;
  const answer = reduced(lo, hi);
  return {
    key: cards.join(""),
    prompt: `수 카드 ${cards.join(", ")} 중에서 2장을 골라 한 번씩 사용하여 (자연수) ÷ (자연수)를 만들려고 합니다. 몫이 가장 작을 때의 몫을 분수로 나타낸 것을 고르세요.`,
    answer,
    choices: fracOpts(rand, answer, [reduced(hi, lo), reduced(md, hi), reduced(lo, md)]),
    hint: "나누어지는 수는 작을수록, 나누는 수는 클수록 몫이 작아요.",
    explanation: `가장 작은 수 ${j(lo, "를")} 가장 큰 수 ${j(hi, "로")} 나눕니다. ${lo} ÷ ${hi} = ${answer}`,
  };
});

export const divBigFrac = easy("l6-div-big-frac", (rand) => {
  const b = randInt(rand, 2, 9);
  const a = randInt(rand, b + 1, b * 3);
  if (a % b === 0) return null;
  const answer = reduced(a, b);
  return {
    key: `${a}:${b}`,
    prompt: "나눗셈의 몫을 대분수로 나타낸 것을 고르세요.",
    expression: `${a} ÷ ${b}`,
    answer,
    choices: fracOpts(rand, answer, [reduced(b, a), reduced(a, b + 1), reduced(a + b, b)]),
    hint: "몫을 분수로 쓰고, 가분수는 대분수로 바꾸어요.",
    explanation: `${a} ÷ ${b} = ${a}/${b} = ${answer}`,
    mistakes: { [reduced(b, a)]: "나누는 수와 나누어지는 수를 바꿨어요." },
  };
});

export const divFracCompare = mid("l6-div-frac-compare", (rand) => {
  const pairs = Array.from({ length: 4 }, () => {
    const b = randInt(rand, 2, 9);
    return [randInt(rand, 1, b * 2), b] as const;
  });
  const vals = pairs.map(([a, b]) => a / b);
  // 몫을 분수로 비교하는 차시이므로 나누어떨어지는 식은 넣지 않는다
  if (new Set(vals).size < 4 || pairs.some(([a, b]) => a % b === 0)) return null;
  const best = vals.indexOf(Math.max(...vals));
  const exprs = pairs.map(([a, b]) => `${a} ÷ ${b}`);
  return {
    key: exprs.join("|"),
    prompt: "몫이 가장 큰 나눗셈을 고르세요.",
    answer: exprs[best],
    choices: exprs,
    hint: "몫을 분수로 나타낸 뒤 크기를 비교해요.",
    explanation: pairs.map(([a, b]) => `${a} ÷ ${b} = ${reduced(a, b)}`).join(", "),
  };
});

export const divMixedBlank = mid("l6-div-mixed-blank", (rand) => {
  const b = randInt(rand, 3, 9);
  const w = randInt(rand, 1, 5);
  const r = randInt(rand, 1, b - 1);
  if (gcd(r, b) !== 1) return null;
  const a = w * b + r;
  return {
    key: `${a}:${b}`,
    prompt: "□ 안에 알맞은 자연수를 써넣으세요.",
    expression: `□ ÷ ${b} = ${w} ${r}/${b}`,
    answer: a,
    hint: "대분수를 가분수로 바꾸면 분자가 나누어지는 수예요.",
    explanation: `${w} ${r}/${b} = ${a}/${b}이므로 □ = ${a}`,
  };
});

export const divShareCompare = word("l6-div-share-compare", (rand) => {
  const [b, d] = [randInt(rand, 3, 8), randInt(rand, 3, 8)];
  const [a, c] = [randInt(rand, 2, 9), randInt(rand, 2, 9)];
  if (a * d === c * b || a % b === 0 || c % d === 0) return null;
  const big = a / b > c / d ? reduced(a, b) : reduced(c, d);
  const small = a / b > c / d ? reduced(c, d) : reduced(a, b);
  return {
    key: `${a}:${b}:${c}:${d}`,
    prompt: `가 모둠은 주스 ${a} L를 ${b}명이, 나 모둠은 주스 ${c} L를 ${d}명이 똑같이 나누어 마셨습니다. 한 사람이 마신 주스가 더 많은 모둠에서 한 사람이 마신 주스는 몇 L인가요?`,
    answer: big,
    choices: fracOpts(rand, big, [small, reduced(b, a), reduced(d, c)]),
    hint: "두 모둠에서 한 사람이 마신 양을 각각 분수로 나타내어 비교해요.",
    explanation: `가: ${a} ÷ ${b} = ${reduced(a, b)}, 나: ${c} ÷ ${d} = ${reduced(c, d)} → 더 많은 쪽은 ${big} L`,
  };
});

export const divWrongMul = word("l6-div-wrong-mul", (rand) => {
  const b = randInt(rand, 3, 9);
  const x = randInt(rand, 2, 20);
  if (x % b === 0) return null;
  const answer = reduced(x, b);
  return {
    key: `${x}:${b}`,
    prompt: `어떤 자연수를 ${j(b, "로")} 나누어야 할 것을 잘못하여 ${j(b, "를")} 곱했더니 ${j(x * b, "가")} 되었습니다. 바르게 계산한 몫을 분수로 나타낸 것을 고르세요.`,
    answer,
    choices: fracOpts(rand, answer, [String(x), reduced(b, x), String(x * b * b)]),
    hint: `먼저 어떤 수를 구해요. (어떤 수) × ${b} = ${x * b}`,
    explanation: `어떤 수 = ${x * b} ÷ ${b} = ${x}, 바르게 계산하면 ${x} ÷ ${b} = ${answer}`,
    mistakes: { [String(x)]: "어떤 수까지만 구했어요.", [String(x * b * b)]: "나누지 않고 한 번 더 곱했어요." },
  };
});

/** 분자가 나누는 수의 배수인 진분수 ÷ 자연수(분수는 그대로 n/d로 쓴다) */
export const fdwMultiple = easy("l6-fdw-multiple", (rand) => {
  const d = randInt(rand, 5, 13);
  const k = randInt(rand, 2, 4);
  const m = randInt(rand, 1, Math.floor((d - 1) / k));
  const n = k * m;
  if (gcd(n, d) !== 1) return null;
  const answer = reduced(m, d);
  return {
    key: `${n}/${d}:${k}`,
    prompt: "계산한 값을 고르세요.",
    expression: `${n}/${d} ÷ ${k}`,
    answer,
    choices: fracOpts(rand, answer, [reduced(n * k, d), reduced(m, d * k), reduced(m + 1, d)]),
    hint: "분자가 나누는 수의 배수이면 분자를 자연수로 나누어요.",
    explanation: `${n}/${d} ÷ ${k} = (${n} ÷ ${k})/${d} = ${answer}`,
    mistakes: { [reduced(n * k, d)]: "나누지 않고 곱했어요." },
  };
});

export const fdwBlank = mid("l6-fdw-blank", (rand) => {
  const d = randInt(rand, 5, 13);
  const m = randInt(rand, 1, d - 1);
  const k = randInt(rand, 2, 4);
  if (gcd(m, d) !== 1) return null;
  const answer = reduced(m * k, d);
  return {
    key: `${m}/${d}:${k}`,
    prompt: "□ 안에 알맞은 분수를 고르세요.",
    expression: `□ ÷ ${k} = ${m}/${d}`,
    answer,
    choices: fracOpts(rand, answer, [reduced(m, d * k), reduced(m + k, d), reduced(m * k + 1, d)]),
    hint: `□ = ${m}/${d} × ${k}`,
    explanation: `${m}/${d} × ${k} = ${m * k}/${d}${answer !== `${m * k}/${d}` ? ` = ${answer}` : ""}`,
  };
});

export const fdwUnitCount = mid("l6-fdw-unit-count", (rand) => {
  const d = randInt(rand, 7, 19);
  const k = randInt(rand, 2, 3);
  // 몫이 1/d 하나(1개)로 몰리지 않게 2개 이상, 분수는 기약분수로
  const m = randInt(rand, 2, Math.floor((d - 1) / k));
  const n = k * m;
  if (gcd(n, d) !== 1) return null;
  return {
    key: `${n}/${d}:${k}`,
    prompt: `${n}/${d} ÷ ${k}의 몫은 1/${d}이 몇 개인 수인가요?`,
    answer: m,
    unit: "개",
    hint: `${n}/${d}${jp(n, "는")} 1/${d}이 ${n}개예요. 이것을 ${k}묶음으로 똑같이 나눠요.`,
    explanation: `${n} ÷ ${k} = ${m} → 1/${d}이 ${m}개`,
    mistakes: { [n]: "나누기 전의 개수예요." },
  };
});

export const fdwWrong = word("l6-fdw-wrong", (rand) => {
  const d = randInt(rand, 3, 11);
  const m = randInt(rand, 1, d - 1);
  const k = randInt(rand, 2, 4);
  const answer = reduced(m * k * k, d);
  return {
    key: `${m}/${d}:${k}`,
    prompt: `어떤 분수에 ${j(k, "를")} 곱해야 할 것을 잘못하여 ${j(k, "로")} 나누었더니 ${jf(reduced(m, d), "가")} 되었습니다. 바르게 계산한 값을 고르세요.`,
    answer,
    choices: fracOpts(rand, answer, [reduced(m * k, d), reduced(m, d * k * k), reduced(m * k, d * k)]),
    hint: `먼저 어떤 분수를 구해요. (어떤 분수) = ${reduced(m, d)} × ${k}`,
    explanation: `어떤 분수 = ${reduced(m, d)} × ${k} = ${reduced(m * k, d)}, 바르게 계산하면 ${reduced(m * k, d)} × ${k} = ${answer}`,
    mistakes: { [reduced(m * k, d)]: "어떤 분수까지만 구했어요." },
  };
});

/** 두 번 나누어도 분자가 나누는 수들의 곱의 배수라 분자끼리 나눌 수 있다 */
export const fdwTwoStep = word("l6-fdw-two-step", (rand) => {
  const k = randInt(rand, 2, 3);
  const pieces = randInt(rand, 2, 3);
  const t = randInt(rand, 1, 2);
  const n = k * pieces * t;
  const d = randInt(rand, n + 1, n + 9);
  if (gcd(n, d) !== 1) return null;
  const [p] = names(rand, 1);
  const answer = reduced(t, d);
  return {
    key: `${n}/${d}:${k}:${pieces}`,
    prompt: `끈 ${n}/${d} m를 ${k}명이 똑같이 나누어 가졌습니다. ${p}는 자기가 받은 끈을 다시 ${pieces}도막으로 똑같이 잘랐습니다. 한 도막은 몇 m인가요?`,
    answer,
    choices: fracOpts(rand, answer, [reduced(n / k, d), reduced(n * k * pieces, d), reduced(n, d * (k + pieces))]),
    hint: `한 사람이 받은 끈은 ${n}/${d} ÷ ${k}이고, 이것을 다시 ${j(pieces, "로")} 나눠요. 분자를 자연수로 나누어요.`,
    explanation: `${n}/${d} ÷ ${k} = ${n / k}/${d}, ${n / k}/${d} ÷ ${pieces} = ${answer}(m)`,
    mistakes: { [reduced(n / k, d)]: "한 사람이 받은 끈의 길이까지만 구했어요." },
  };
});

export const fdwExpr = mid("l6-fdw-expr", (rand) => {
  const d = randInt(rand, 3, 9);
  const n = randInt(rand, 1, d - 1);
  const k = randInt(rand, 2, 7);
  if (n % k === 0 || n === 1 || gcd(n, d) !== 1) return null;
  const answer = `${n}/${d} × 1/${k}`;
  return {
    key: `${n}/${d}:${k}`,
    prompt: `${n}/${d} ÷ ${j(k, "를")} 분수의 곱셈으로 바르게 나타낸 것을 고르세요.`,
    answer,
    choices: opts(rand, answer, [`${n}/${d} × ${k}`, `${d}/${n} × 1/${k}`, `${d}/${n} × ${k}`], () => `${n}/${k} × 1/${d}`),
    hint: "÷ (자연수)는 × 1/(자연수)로 바꿀 수 있어요.",
    explanation: `${n}/${d} ÷ ${k} = ${answer} = ${reduced(n, d * k)}`,
  };
});

export const fdwError = word("l6-fdw-error", (rand) => {
  const d = randInt(rand, 3, 9);
  const n = randInt(rand, 1, d - 1);
  const k = randInt(rand, 2, 5);
  if (gcd(n, d) !== 1) return null;
  const [p] = names(rand, 1);
  const answer = reduced(n, d * k);
  return {
    key: `${n}/${d}:${k}`,
    prompt: `${p}는 ${n}/${d} ÷ ${j(k, "를")} 다음과 같이 계산했습니다. 잘못된 곳을 찾아 바르게 계산한 값을 고르세요.`,
    expression: `${n}/${d} ÷ ${k} = ${n}/${d} × ${k} = ${reduced(n * k, d)}`,
    answer,
    choices: fracOpts(rand, answer, [reduced(n * k, d), reduced(n, d + k), reduced(d, n * k)]),
    hint: "÷ (자연수)는 × 1/(자연수)로 바꾸어야 해요.",
    explanation: `÷ ${j(k, "를")} × ${j(k, "로")} 잘못 바꿨어요. ${n}/${d} × 1/${k} = ${answer}`,
    mistakes: { [reduced(n * k, d)]: "친구와 같은 실수예요. ÷ (자연수)를 × (자연수)로 바꾸면 안 돼요." },
  };
});

const mixedParts = (rand: () => number) => {
  const d = randInt(rand, 2, 7);
  const w = randInt(rand, 1, 4);
  let r = randInt(rand, 1, d - 1);
  while (gcd(r, d) !== 1) r -= 1;
  return { d, w, r, N: w * d + r, text: `${w} ${r}/${d}` };
};

export const mixedDiv = easy("l6-mixed-div", (rand) => {
  const { d, w, r, N, text } = mixedParts(rand);
  const k = randInt(rand, 2, 6);
  const answer = reduced(N, d * k);
  return {
    key: `${text}:${k}`,
    prompt: "계산한 값을 고르세요.",
    expression: `${text} ÷ ${k}`,
    answer,
    choices: fracOpts(rand, answer, [reduced(w * d + r * k, d * k), reduced(N * k, d), reduced(N, d + k)]),
    hint: "대분수를 가분수로 바꾼 뒤 × 1/(자연수)로 계산해요.",
    explanation: `${text} ÷ ${k} = ${N}/${d} × 1/${k} = ${N}/${d * k}${answer !== `${N}/${d * k}` ? ` = ${answer}` : ""}`,
    mistakes: { [reduced(w * d + r * k, d * k)]: "자연수 부분만 나눴어요. 대분수를 가분수로 바꾸어 계산해요." },
  };
});

export const mixedDivCmp = mid("l6-mixed-div-cmp", (rand) => {
  const x = mixedParts(rand);
  const y = mixedParts(rand);
  const k1 = randInt(rand, 2, 5);
  const k2 = randInt(rand, 2, 5);
  const l = x.N * y.d * k2;
  const r = y.N * x.d * k1;
  return {
    key: `${x.text}:${k1}:${y.text}:${k2}`,
    prompt: "크기를 비교하여 ○ 안에 >, =, < 중 알맞은 것을 고르세요.",
    expression: `${x.text} ÷ ${k1} ○ ${y.text} ÷ ${k2}`,
    answer: cmpText(l, r),
    choices: [...COMPARE_CHOICES],
    hint: "두 몫을 각각 계산한 뒤 통분하여 비교해요.",
    explanation: `${reduced(x.N, x.d * k1)} ${cmpText(l, r)} ${reduced(y.N, y.d * k2)}`,
  };
});

export const mixedSquare = mid("l6-mixed-square", (rand) => {
  const { d, N, text } = mixedParts(rand);
  const [shape, k] = pick(rand, [["정사각형", 4], ["정삼각형", 3]] as const);
  const answer = reduced(N, d * k);
  return {
    key: `${text}:${shape}`,
    prompt: `둘레가 ${text} cm인 ${shape}의 한 변의 길이는 몇 cm인가요?`,
    answer,
    choices: fracOpts(rand, answer, [reduced(N * k, d), reduced(N, d + k), reduced(N, d * (7 - k))]),
    hint: `${shape}은 ${k}변의 길이가 모두 같아요.`,
    explanation: `${text} ÷ ${k} = ${answer}(cm)`,
  };
});

export const mixedCard = word("l6-mixed-card", (rand) => {
  const cards = digitsDistinct(rand, 3, 1, 9).sort((a, b) => a - b);
  const [lo, md, hi] = cards;
  const k = randInt(rand, 2, 5);
  const N = hi * md + lo;
  const answer = reduced(N, md * k);
  return {
    key: `${cards.join("")}:${k}`,
    prompt: `수 카드 ${j(cards.join(", "), "를")} 한 번씩 모두 사용하여 가장 큰 대분수를 만들었습니다. 이 대분수를 ${j(k, "로")} 나눈 몫을 고르세요.`,
    answer,
    choices: fracOpts(rand, answer, [reduced(lo * md + hi, md * k), reduced(N * k, md), reduced(hi * lo + md, lo * k)]),
    hint: "자연수 부분에 가장 큰 수를 놓고, 남은 두 수로 진분수를 만들어요.",
    explanation: `가장 큰 대분수는 ${hi} ${lo}/${md} = ${N}/${md}, ${N}/${md} ÷ ${k} = ${answer}`,
  };
});

export const mixedRange = word("l6-mixed-range", (rand) => {
  const { d, N, text } = mixedParts(rand);
  const k = randInt(rand, 2, 3);
  const v = N / (d * k);
  if (v <= 1) return null;
  const answer = Math.ceil(v) - 1;
  return {
    key: `${text}:${k}`,
    prompt: "□ 안에 들어갈 수 있는 자연수 중에서 가장 큰 수를 구하세요.",
    expression: `□ < ${text} ÷ ${k}`,
    answer,
    hint: "먼저 나눗셈의 몫을 대분수로 구해요.",
    explanation: `${text} ÷ ${k} = ${reduced(N, d * k)}이므로 □는 ${answer} 이하의 자연수예요.`,
    mistakes: { [answer + 1]: "□는 몫보다 작아야 해요." },
  };
});

/* ── 6-1-2 각기둥과 각뿔 ── */

const SOLO_C: Pt = [110, 92];
const solidOf = (n: number, pyr: boolean, p: Place = SOLO) => (pyr ? pyramid(n, p) : prism(n, p));
/** 가장 앞(아래)에 있는 보이는 옆면 */
const frontSide = (s: Solid) => {
  const n = s.bot.length;
  const y = (i: number) => s.bot[i][1] + s.bot[(i + 1) % n][1];
  return s.bot.map((_, i) => i).filter((i) => s.sideVisible[i]).reduce((b, i) => (y(i) > y(b) ? i : b));
};
const rightmost = (ps: Pt[]) => ps.reduce((b, p, i) => (p[0] > ps[b][0] ? i : b), 0);
const leftmost = (ps: Pt[]) => ps.reduce((b, p, i) => (p[0] < ps[b][0] ? i : b), 0);
const sideFace = (s: Solid, i: number): Pt[] => {
  const k = (i + 1) % s.bot.length;
  return s.apex ? [s.bot[i], s.bot[k], s.apex] : [s.bot[i], s.bot[k], s.top[k], s.top[i]];
};
const soloScene = (label: string, ...parts: Parts[]) => compose(220, 180, label, ...parts);
const dist = (p: Pt, q: Pt) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const centerOf = (s: Solid): Pt => {
  const ps = [...s.top, ...s.bot];
  return [ps.reduce((t, p) => t + p[0], 0) / ps.length, ps.reduce((t, p) => t + p[1], 0) / ps.length];
};

/**
 * 각기둥 겨냥도를 적힌 길이의 비(r = 높이 ÷ 밑면의 한 변)대로 그린다: 가장 앞 옆면의 가로와 세로가 r배.
 * 높이가 길면 밑면을 줄여 220 × 180 안에 넣고, 밑면이 너무 작아지면(rx < 34) null.
 */
/** 가장 앞 옆면의 가로(그린 길이) ÷ rx */
const frontEdgeScale = (n: number) => {
  const probe = prism(n, { cx: 110, top: -100, bottom: 0, rx: 100, ry: 31.25 });
  const i = frontSide(probe);
  return dist(probe.bot[i], probe.bot[(i + 1) % n]) / 100;
};
/** prismRatio로 그릴 수 있는 가장 큰 비(높이 ÷ 밑면의 한 변): rx ≥ 34, 2.5 이하 */
const maxPrismRatio = (n: number) => Math.min(2.5, (124 / 34 - 0.625) / frontEdgeScale(n));
/**
 * 밑면이 정n각형인 각기둥의 밑면의 한 변 a와 높이 h를 그릴 수 있는 비(0.5 ~ maxPrismRatio) 안에서 뽑는다.
 * n을 먼저 정하고 그 범위 안에서만 뽑으므로 삼각기둥이 덜 나오지 않는다
 */
const prismSides = (rand: () => number, n: number, aMax: number, hMax: number): [number, number] | null => {
  const a = randInt(rand, 2, aMax);
  const lo = Math.max(3, Math.ceil(a * 0.5));
  const hi = Math.min(hMax, Math.floor(a * maxPrismRatio(n)));
  if (lo > hi) return null;
  const h = randInt(rand, lo, hi);
  return a === h ? null : [a, h];
};

export function prismRatio(n: number, r: number): Solid | null {
  const c = frontEdgeScale(n);
  const rx = Math.min(64, 124 / (c * r + 0.625));
  if (rx < 34) return null;
  const ry = rx * 0.3125;
  const bottom = 152 - ry;
  return prism(n, { cx: 110, top: bottom - c * rx * r, bottom, rx, ry });
}

type PartMark = { q: string; a: string; c: string[]; draw: (s: Solid) => Parts };

const PRISM_MARKS: PartMark[] = [
  { q: "그림에서 색칠한 면을 무엇이라고 하나요?", a: "밑면", c: ["밑면", "옆면", "모서리", "꼭짓점"], draw: (s) => ({ polygons: [{ points: s.top, fill: true }] }) },
  { q: "그림에서 색칠한 면을 무엇이라고 하나요?", a: "옆면", c: ["옆면", "밑면", "모서리", "꼭짓점"], draw: (s) => ({ polygons: [{ points: sideFace(s, frontSide(s)), fill: true }] }) },
  {
    q: "그림에서 ㉠을 무엇이라고 하나요?",
    a: "모서리",
    c: ["모서리", "꼭짓점", "밑면", "옆면"],
    draw: (s) => {
      const n = s.top.length;
      const y = (k: number) => s.top[k][1] + s.top[(k + 1) % n][1];
      const i = s.top.map((_, k) => k).reduce((b, k) => (y(k) < y(b) ? k : b));
      const t = labelOut(s.top[i], s.top[(i + 1) % n], SOLO_C, "㉠", 12);
      return { texts: [t], lines: [leader(s.top[i], s.top[(i + 1) % n], t)] };
    },
  },
  {
    q: "그림에서 점 ㉠을 무엇이라고 하나요?",
    a: "꼭짓점",
    c: ["꼭짓점", "모서리", "밑면", "높이"],
    draw: (s) => {
      const v = s.top[leftmost(s.top)];
      return { dots: [v], texts: [text([v[0] - 14, v[1] - 10], "㉠")] };
    },
  },
  {
    q: "그림에서 두 밑면 사이의 거리 ㉠을 무엇이라고 하나요?",
    a: "높이",
    c: ["높이", "모서리", "밑면", "옆면"],
    draw: (s) => {
      const k = rightmost(s.bot);
      const x = s.bot[k][0] + 16;
      return { lines: [{ from: [x, s.top[k][1]], to: [x, s.bot[k][1]], arrows: "both", width: 1.5 }], texts: [text([x + 13, (s.top[k][1] + s.bot[k][1]) / 2], "㉠")] };
    },
  },
];

const PYRAMID_MARKS: PartMark[] = [
  { q: "그림에서 색칠한 면을 무엇이라고 하나요?", a: "밑면", c: ["밑면", "옆면", "모서리", "꼭짓점"], draw: (s) => ({ polygons: [{ points: s.bot, fill: true }] }) },
  { q: "그림에서 색칠한 면을 무엇이라고 하나요?", a: "옆면", c: ["옆면", "밑면", "모서리", "꼭짓점"], draw: (s) => ({ polygons: [{ points: sideFace(s, frontSide(s)), fill: true }] }) },
  {
    q: "그림에서 점 ㉠을 무엇이라고 하나요?",
    a: "각뿔의 꼭짓점",
    c: ["각뿔의 꼭짓점", "모서리", "밑면", "높이"],
    draw: (s) => ({ dots: [s.apex!], texts: [text([s.apex![0] + 16, s.apex![1] - 8], "㉠")] }),
  },
  {
    q: "그림에서 각뿔의 꼭짓점에서 밑면에 수직인 선분 ㉠의 길이를 무엇이라고 하나요?",
    a: "높이",
    c: ["높이", "모서리", "밑면", "옆면"],
    draw: (s) => {
      const foot: Pt = [s.apex![0], SOLO.bottom];
      return {
        lines: [
          { from: s.apex!, to: foot, dashed: true, width: 1.5 },
          { from: [foot[0] + 7, foot[1]], to: [foot[0] + 7, foot[1] - 7], width: 1 },
          { from: [foot[0] + 7, foot[1] - 7], to: [foot[0], foot[1] - 7], width: 1 },
        ],
        texts: [text([foot[0] + 11, (s.apex![1] + foot[1]) / 2 - 6], "㉠")],
      };
    },
  },
  {
    q: "그림에서 ㉠을 무엇이라고 하나요?",
    a: "모서리",
    c: ["모서리", "높이", "밑면", "꼭짓점"],
    draw: (s) => {
      const t = labelOut(s.apex!, s.bot[rightmost(s.bot)], SOLO_C, "㉠", 12);
      return { texts: [t], lines: [leader(s.apex!, s.bot[rightmost(s.bot)], t)] };
    },
  },
];

/** 겨냥도에 표시한 부분의 이름 */
const markGen = (id: string, marks: PartMark[], pyr: boolean) =>
  easy(id, (rand) => {
    const f = pick(rand, marks);
    // 사각기둥(직육면체)·삼각뿔은 어느 면이든 밑면이 될 수 있어 밑면·옆면 표시(0·1번)에는 쓰지 않는다
    const ambiguous = pyr ? 3 : 4;
    const n = marks.indexOf(f) < 2 ? pick(rand, [3, 4, 5, 6].filter((x) => x !== ambiguous)) : randInt(rand, 3, 6);
    const s = solidOf(n, pyr);
    return {
      key: `${marks.indexOf(f)}:${n}`,
      prompt: f.q,
      visual: soloScene(`밑면이 ${poly(n)}형인 ${pyr ? "각뿔" : "각기둥"}의 겨냥도`, f.draw(s), s),
      answer: f.a,
      choices: shuffle(rand, f.c),
      hint: pyr ? "각뿔은 밑면이 1개, 옆면은 삼각형이고, 옆면이 모두 만나는 점이 각뿔의 꼭짓점이에요." : "각기둥에서 위와 아래에 있는 서로 평행하고 합동인 두 면이 밑면이에요.",
      explanation: `${f.a}입니다.`,
    };
  });

export const prismFaceShape = markGen("l6-prism-face-shape", PRISM_MARKS, false);
export const pyramidFaceShape = markGen("l6-pyramid-face-shape", PYRAMID_MARKS, true);

/** 조사: 모서리(받침 없음)만 가/는 */
const iga = (w: string) => (w === "모서리" ? "가" : "이");
const eunNeun = (w: string) => (w === "모서리" ? "는" : "은");

const prismCounts = (n: number) => ({ 면: n + 2, 모서리: 3 * n, 꼭짓점: 2 * n });
const pyramidCounts = (n: number) => ({ 면: n + 1, 모서리: 2 * n, 꼭짓점: n + 1 });

/** 각기둥 차시이므로 각기둥만 */
export const prismLateral = mid("l6-prism-lateral", (rand) => {
  const n = randInt(rand, 3, 10);
  return rand() < 0.5
    ? {
        key: `to:${n}`,
        prompt: `밑면이 ${poly(n)}형인 각기둥의 옆면은 몇 개인가요?`,
        answer: n,
        unit: "개",
        hint: "각기둥의 옆면의 수는 한 밑면의 변의 수와 같아요.",
        explanation: `${poly(n)}형의 변은 ${n}개 → 옆면 ${n}개`,
      }
    : {
        key: `from:${n}`,
        prompt: `옆면이 ${n}개인 각기둥의 밑면은 몇 각형인가요?`,
        answer: n,
        unit: "각형",
        hint: "각기둥의 옆면의 수는 한 밑면의 변의 수와 같아요.",
        explanation: `옆면 ${n}개 → 밑면 ${poly(n)}형`,
      };
});
export const pyramidLateral = mid("l6-pyramid-lateral", (rand) => {
  const n = randInt(rand, 3, 10);
  return {
    key: `${n}`,
    prompt: `옆면이 모두 삼각형이고 옆면이 ${n}개인 입체도형이 있습니다. 이 입체도형의 밑면은 몇 각형인가요?`,
    answer: n,
    unit: "각형",
    hint: "옆면이 삼각형이면 각뿔이고, 옆면의 수는 밑면의 변의 수와 같아요.",
    explanation: `옆면이 삼각형이므로 각뿔이고, 옆면이 ${n}개이므로 밑면의 변도 ${n}개 → 밑면은 ${poly(n)}형`,
  };
});

/** 그림에서 각기둥(각뿔)을 찾는다 */
const pickGen = (id: string, target: "prism" | "pyramid") =>
  mid(id, (rand) => {
    const others: SolidKind[] = target === "prism" ? ["pyramid", "frustum", "cylinder"] : ["prism", "frustum", "cone"];
    const kinds = shuffle(rand, [target, ...others]);
    const ns = kinds.map(() => randInt(rand, 3, 6));
    const i = kinds.indexOf(target);
    const name = target === "prism" ? "각기둥" : "각뿔";
    return {
      key: `${kinds.join()}:${ns.join()}`,
      prompt: `그림에서 ${j(name, "를")} 찾아 기호를 고르세요.`,
      visual: lineup(kinds, ns),
      answer: LETTERS[i],
      choices: LETTERS.slice(0, 4),
      hint: target === "prism" ? "두 밑면이 서로 평행하고 합동인 다각형이고, 옆면이 모두 직사각형인지 살펴보세요." : "밑면이 다각형 1개이고, 옆면이 모두 삼각형인지 살펴보세요.",
      explanation:
        target === "prism"
          ? `${LETTERS[i]}는 두 밑면이 평행하고 합동인 ${poly(ns[i])}형이고 옆면이 직사각형이므로 각기둥입니다. 위와 아래 면의 크기가 다르거나 밑면이 원이면 각기둥이 아닙니다.`
          : `${LETTERS[i]}는 밑면이 ${poly(ns[i])}형이고 옆면이 모두 삼각형이므로 각뿔입니다. 밑면이 원이거나 옆면이 사각형이면 각뿔이 아닙니다.`,
    };
  });

export const prismPick = pickGen("l6-prism-pick", "prism");
export const pyramidPick = pickGen("l6-pyramid-pick", "pyramid");

/** 색칠한 옆면의 둘레로 높이 구하기 */
export const prismSidePerimeter = word("l6-prism-side-perimeter", (rand) => {
  const n = randInt(rand, 3, 6);
  const sides = prismSides(rand, n, 12, 18);
  if (!sides) return null;
  const [a, h] = sides;
  const s = prismRatio(n, h / a);
  if (!s) return null;
  const i = frontSide(s);
  const P = 2 * (a + h);
  return {
    key: `${n}:${a}:${h}`,
    prompt: `밑면이 정${poly(n)}형인 각기둥입니다. 색칠한 옆면의 둘레가 ${P} cm일 때, 이 각기둥의 높이는 몇 cm인가요?`,
    visual: soloScene(`밑면의 한 변이 ${a} cm인 각기둥의 겨냥도, 옆면 하나를 색칠함`, { polygons: [{ points: sideFace(s, i), fill: true }], texts: [labelOut(s.bot[i], s.bot[(i + 1) % n], centerOf(s), `${a} cm`)] }, s),
    answer: h,
    unit: "cm",
    hint: "옆면은 가로가 밑면의 한 변, 세로가 각기둥의 높이인 직사각형이에요.",
    explanation: `${a} × 2 = ${2 * a}(cm), (${P} − ${2 * a}) ÷ 2 = ${h}(cm)`,
    mistakes: { [P - 2 * a]: "세로 두 변의 합까지만 구했어요. 2로 나누어야 해요." },
  };
});

/** 높이와 색칠한 옆면의 둘레로 밑면의 한 변을 구하고, 겨냥도에서 밑면의 변의 수를 세어 밑면의 둘레를 구한다 */
export const prismBasePerimeter = word("l6-prism-base-perimeter", (rand) => {
  const n = pick(rand, [3, 5, 6]);
  const sides = prismSides(rand, n, 9, 15);
  if (!sides) return null;
  const [a, h] = sides;
  const s = prismRatio(n, h / a);
  if (!s) return null;
  const i = frontSide(s);
  const k = rightmost(s.bot);
  const P = 2 * (a + h);
  return {
    key: `${n}:${a}:${h}`,
    prompt: `밑면이 정다각형인 각기둥입니다. 색칠한 옆면의 둘레가 ${P} cm일 때, 이 각기둥의 한 밑면의 둘레는 몇 cm인가요?`,
    visual: soloScene(`높이가 ${h} cm인 각기둥의 겨냥도, 옆면 하나를 색칠함`, { polygons: [{ points: sideFace(s, i), fill: true }], texts: [labelOut(s.top[k], s.bot[k], centerOf(s), `${h} cm`)] }, s),
    answer: n * a,
    unit: "cm",
    hint: "옆면의 세로는 높이, 가로는 밑면의 한 변이에요. 밑면의 한 변을 구한 뒤 밑면의 변의 수를 세어요.",
    explanation: `밑면의 한 변: (${P} − ${h} × 2) ÷ 2 = ${a}(cm), 밑면은 정${poly(n)}형이므로 둘레는 ${a} × ${n} = ${n * a}(cm)`,
    mistakes: { [a]: "밑면의 한 변만 구했어요. 밑면의 변의 수만큼 곱해야 해요.", [P - 2 * h]: "가로 두 변의 합까지만 구했어요." },
  };
});

/**
 * 색칠한 옆면(이등변삼각형)의 둘레와 밑면의 한 변으로, 각뿔의 꼭짓점과 밑면을 잇는 모서리 ㉠을 구한다.
 * 각뿔의 높이(그림의 세로)를 정해 ㉠과 밑면의 한 변을 적힌 길이의 비대로 그린다.
 */
export const pyramidSidePerimeter = word("l6-pyramid-side-perimeter", (rand) => {
  // 삼각뿔·사각뿔은 가장 앞 옆면의 바깥쪽 모서리가 겨냥도의 테두리라 ㉠ 글자가 다른 모서리와 헷갈리지 않는다.
  // (밑면은 정삼각형, 옆면은 밑면과 다른 이등변삼각형이라 삼각뿔도 밑면이 하나로 정해진다)
  const n = pick(rand, [3, 4]);
  const a = randInt(rand, 3, 9);
  const base = pyramid(n, SOLO);
  const i = frontSide(base);
  const e = dist(base.bot[i], base.bot[(i + 1) % n]);
  const v = Math.abs(base.bot[i][0] - SOLO.cx) > Math.abs(base.bot[(i + 1) % n][0] - SOLO.cx) ? i : (i + 1) % n;
  const dx = Math.abs(base.bot[v][0] - SOLO.cx);
  const dyBot = base.bot[v][1];
  // 그린 ㉠의 길이 L = e × b ÷ a, 각뿔의 높이(픽셀) sqrt(L² − dx²)가 40~118 px 안
  const lo = Math.ceil((a * Math.hypot(40, dx)) / e);
  const hi = Math.floor((a * Math.hypot(dyBot - 24, dx)) / e);
  if (Math.max(a + 1, lo) > Math.min(15, hi)) return null;
  const b = randInt(rand, Math.max(a + 1, lo), Math.min(15, hi));
  const L = (e * b) / a;
  const s = pyramid(n, { ...SOLO, top: dyBot - Math.sqrt(L * L - dx * dx) });
  const c = centerOf(s);
  const P = a + 2 * b;
  const mark = labelOut(s.apex!, s.bot[v], c, "㉠", 8);
  return {
    key: `${n}:${a}:${b}`,
    prompt: `밑면이 정다각형이고 옆면이 모두 합동인 이등변삼각형인 각뿔입니다. 색칠한 옆면의 둘레가 ${P} cm일 때, 각뿔의 꼭짓점과 밑면을 잇는 모서리 ㉠의 길이는 몇 cm인가요?`,
    visual: soloScene(`밑면의 한 변이 ${a} cm이고 밑면이 정${poly(n)}형인 각뿔의 겨냥도, 옆면 하나를 색칠하고 각뿔의 꼭짓점과 밑면을 잇는 모서리 하나를 ㉠으로 표시함`, { polygons: [{ points: sideFace(s, i), fill: true }], texts: [labelOut(s.bot[i], s.bot[(i + 1) % n], c, `${a} cm`), mark] }, s),
    answer: b,
    unit: "cm",
    hint: "옆면은 밑변이 밑면의 한 변이고, 나머지 두 변(㉠)의 길이가 같은 이등변삼각형이에요.",
    explanation: `${P} − ${a} = ${P - a}(cm), ${P - a} ÷ 2 = ${b}(cm)`,
    mistakes: { [P - a]: "길이가 같은 두 변의 합까지만 구했어요. 2로 나누어야 해요." },
  };
});

/** 옆면 하나의 둘레로 밑면의 한 변을 구하고, 밑면의 둘레로 밑면의 변의 수(= 옆면의 수)를 구한다 */
export const pyramidLateralCount = word("l6-pyramid-lateral-count", (rand) => {
  const n = randInt(rand, 3, 9);
  const a = randInt(rand, 2, 8);
  const b = randInt(rand, a + 1, 15);
  const P = a + 2 * b;
  return {
    key: `${n}:${a}:${b}`,
    prompt: `밑면이 정다각형이고 옆면이 모두 합동인 이등변삼각형인 각뿔이 있습니다. 옆면 하나의 둘레는 ${P} cm이고, 각뿔의 꼭짓점과 밑면을 잇는 모서리는 ${b} cm입니다. 밑면의 둘레가 ${n * a} cm일 때, 이 각뿔의 옆면은 몇 개인가요?`,
    answer: n,
    unit: "개",
    hint: "옆면의 둘레에서 길이가 같은 두 변을 빼면 밑면의 한 변이에요. 옆면의 수는 밑면의 변의 수와 같아요.",
    explanation: `${b} × 2 = ${2 * b}(cm), 밑면의 한 변: ${P} − ${2 * b} = ${a}(cm), 밑면의 변의 수: ${n * a} ÷ ${a} = ${n}(개) → 옆면 ${n}개`,
    mistakes: { [n * a]: "밑면의 둘레를 그대로 썼어요." },
  };
});

/** 각기둥 차시(각뿔을 배우기 전)는 다른 ○각기둥만, 각뿔 차시는 각기둥과 섞어 보기를 만든다 */
const solidChoices = (rand: () => number, n: number, pyramid: boolean) => {
  if (!pyramid) {
    const answer = `${poly(n)}기둥`;
    const others = [3, 4, 5, 6, 7, 8, 9, 10].filter((m) => m !== n && Math.abs(m - n) <= 3).map((m) => `${poly(m)}기둥`);
    return { answer, choices: opts(rand, answer, shuffle(rand, others).slice(0, 3), () => `${poly(n === 10 ? 3 : 10)}기둥`) };
  }
  const answer = `${poly(n)}뿔`;
  return {
    answer,
    choices: opts(rand, answer, [`${poly(n)}기둥`, `${poly(n + 1)}뿔`, `${poly(n + 2)}기둥`], () => `${poly(n + 2)}뿔`),
  };
};

export const prismConditions = word("l6-prism-conditions", (rand) => {
  const n = randInt(rand, 3, 8);
  const cond = pick(rand, ["모서리", "꼭짓점", "면"] as const);
  const c = prismCounts(n)[cond];
  const { answer, choices } = solidChoices(rand, n, false);
  return {
    key: `${n}:${cond}`,
    prompt: `다음 조건을 모두 만족하는 입체도형의 이름을 고르세요.\n· 두 밑면은 서로 평행하고 합동입니다.\n· 옆면은 모두 직사각형입니다.\n· ${cond}${iga(cond)} ${c}개입니다.`,
    answer,
    choices,
    hint: `각기둥에서 한 밑면의 변의 수를 □라 하면 ${cond}의 수는 ${cond === "모서리" ? "□ × 3이에요" : cond === "꼭짓점" ? "□ × 2예요" : "□ + 2예요"}.`,
    explanation: `밑면의 변의 수 = ${n} → ${answer}`,
  };
});

export const pyramidConditions = word("l6-pyramid-conditions", (rand) => {
  const n = randInt(rand, 3, 8);
  const cond = pick(rand, ["모서리", "꼭짓점", "면"] as const);
  const c = pyramidCounts(n)[cond];
  const { answer, choices } = solidChoices(rand, n, true);
  return {
    key: `${n}:${cond}`,
    prompt: `다음 조건을 모두 만족하는 입체도형의 이름을 고르세요.\n· 밑면이 1개이고 다각형입니다.\n· 옆면은 모두 삼각형입니다.\n· ${cond}${iga(cond)} ${c}개입니다.`,
    answer,
    choices,
    hint: `각뿔에서 밑면의 변의 수를 □라 하면 ${cond}의 수는 ${cond === "모서리" ? "□ × 2예요" : "□ + 1이에요"}.`,
    explanation: `밑면의 변의 수 = ${n} → ${answer}`,
  };
});

/** 겨냥도를 보고 면·모서리·꼭짓점의 수 세기 */
const partGen = (id: string, pyr: boolean) =>
  easy(id, (rand) => {
    const n = randInt(rand, 3, 6);
    const part = pick(rand, ["면", "모서리", "꼭짓점"] as const);
    const v = (pyr ? pyramidCounts : prismCounts)(n)[part];
    const name = `${poly(n)}${pyr ? "뿔" : "기둥"}`;
    return {
      key: `${n}:${part}`,
      prompt: `그림과 같은 ${pyr ? "각뿔" : "각기둥"}의 ${part}${eunNeun(part)} 몇 개인가요?`,
      visual: soloScene(`${name}의 겨냥도`, solidOf(n, pyr)),
      answer: v,
      unit: "개",
      hint: pyr
        ? "보이지 않는 모서리(점선)도 세어요. 각뿔: 면 □+1, 모서리 □×2, 꼭짓점 □+1 (□: 밑면의 변의 수)"
        : "보이지 않는 모서리(점선)도 세어요. 각기둥: 면 □+2, 모서리 □×3, 꼭짓점 □×2 (□: 한 밑면의 변의 수)",
      explanation: `밑면이 ${poly(n)}형인 ${name} → ${part} ${v}개`,
    };
  });

export const prismPartsCount = partGen("l6-prism-parts", false);
export const pyramidPartsCount = partGen("l6-pyramid-parts", true);

export const prismPartsReverse = mid("l6-prism-parts-reverse", (rand) => {
  const n = randInt(rand, 3, 10);
  const [given, ask] = pick(rand, [["꼭짓점", "모서리"], ["모서리", "면"], ["면", "꼭짓점"]] as const);
  const c = prismCounts(n);
  return {
    key: `${n}:${given}`,
    prompt: `${given}${iga(given)} ${c[given]}개인 각기둥의 ${ask}${eunNeun(ask)} 몇 개인가요?`,
    answer: c[ask],
    unit: "개",
    hint: `먼저 ${given}의 수로 한 밑면의 변의 수를 구해요.`,
    explanation: `한 밑면의 변의 수 ${n} → ${ask} ${c[ask]}개`,
  };
});

export const prismPartsDiff = mid("l6-prism-parts-diff", (rand) => {
  const n = randInt(rand, 3, 6);
  const c = prismCounts(n);
  return {
    key: `${n}`,
    prompt: "그림과 같은 각기둥의 모서리의 수와 꼭짓점의 수의 차는 몇 개인가요?",
    visual: soloScene(`${poly(n)}기둥의 겨냥도`, prism(n, SOLO)),
    answer: c.모서리 - c.꼭짓점,
    unit: "개",
    hint: "밑면의 모양을 보고 모서리와 꼭짓점의 수를 각각 구해요.",
    explanation: `${poly(n)}기둥: 모서리 ${c.모서리}개, 꼭짓점 ${c.꼭짓점}개 → ${c.모서리} − ${c.꼭짓점} = ${n}(개)`,
  };
});

/** 겨냥도에 밑면의 한 변과 높이를 적고 모든 모서리의 길이의 합을 묻는다 */
export const prismEdgeLength = word("l6-prism-edge-length", (rand) => {
  const n = randInt(rand, 3, 6);
  const sides = prismSides(rand, n, 15, 25);
  if (!sides) return null;
  const [a, h] = sides;
  const s = prismRatio(n, h / a);
  if (!s) return null;
  const i = frontSide(s);
  const k = rightmost(s.bot);
  const c = centerOf(s);
  return {
    key: `${n}:${a}:${h}`,
    prompt: "밑면이 정다각형인 각기둥입니다. 이 각기둥의 모든 모서리의 길이의 합은 몇 cm인가요?",
    visual: soloScene(`밑면의 한 변이 ${a} cm, 높이가 ${h} cm인 ${poly(n)}기둥`, s, {
      texts: [labelOut(s.bot[i], s.bot[(i + 1) % n], c, `${a} cm`), labelOut(s.top[k], s.bot[k], c, `${h} cm`)],
    }),
    answer: 2 * n * a + n * h,
    unit: "cm",
    hint: "밑면의 모양을 보고, 밑면의 변과 같은 모서리와 높이와 같은 모서리가 각각 몇 개인지 세어요.",
    explanation: `${poly(n)}기둥: ${a} cm인 모서리 ${2 * n}개, ${h} cm인 모서리 ${n}개 → ${a} × ${2 * n} + ${h} × ${n} = ${2 * n * a + n * h}(cm)`,
    mistakes: { [n * a + n * h]: "밑면을 하나만 계산했어요." },
  };
});

/** 각기둥 전개도 그림 */
function netScene(n: number, marks: { a?: string; h?: string; corners?: boolean }, ratio?: number) {
  // ratio(높이 ÷ 밑면의 한 변)를 주면 옆면 직사각형을 그 비로 그린다(세로는 110 px까지)
  const A0 = n <= 4 ? 46 : 38;
  const A = ratio ? Math.min(A0, 110 / ratio) : A0;
  const H = ratio ? Math.round(A * ratio) : 72;
  const ph = polyHeight(n, A);
  const o: Pt = [48, Math.round(14 + ph)];
  const net = prismNet(n, o, A, H);
  const texts: NonNullable<ShapeScene["texts"]> = [];
  const c: Pt = [o[0] + (n * A) / 2, o[1] + H / 2];
  if (marks.a) texts.push(labelOut([o[0] + (n - 1) * A, o[1] + H], [o[0] + n * A, o[1] + H], c, marks.a));
  if (marks.h) texts.push(labelOut([o[0], o[1]], [o[0], o[1] + H], c, marks.h));
  if (marks.corners) texts.push(text([o[0] - 8, o[1] - 10], "ㄱ"), text([o[0] + n * A + 8, o[1] - 10], "ㄴ"));
  return compose(o[0] + n * A + 24, Math.round(o[1] + H + ph + 12), `밑면이 ${poly(n)}형인 각기둥의 전개도`, net, { texts });
}

export const prismNetName = easy("l6-prism-net-name", (rand) => {
  const n = randInt(rand, 3, 6);
  const { answer, choices } = solidChoices(rand, n, false);
  return {
    key: `${n}`,
    prompt: "그림과 같은 전개도를 접으면 어떤 입체도형이 되나요?",
    visual: netScene(n, {}),
    answer,
    choices,
    hint: "합동인 두 밑면의 모양을 보고, 옆면이 직사각형이면 각기둥이에요.",
    explanation: `밑면이 ${poly(n)}형 2개, 옆면이 직사각형 ${n}개 → ${answer}`,
  };
});

export const netLateralWidth = mid("l6-net-lateral-width", (rand) => {
  const n = randInt(rand, 3, 6);
  const a = randInt(rand, 2, 12);
  return {
    key: `${n}:${a}`,
    prompt: `그림은 밑면이 정${poly(n)}형인 각기둥의 전개도입니다. 선분 ㄱㄴ의 길이는 몇 cm인가요?`,
    visual: netScene(n, { a: `${a} cm`, corners: true }),
    answer: n * a,
    unit: "cm",
    hint: "선분 ㄱㄴ은 옆면을 모두 이어 붙인 길이로, 밑면의 둘레와 같아요.",
    explanation: `${a} × ${n} = ${n * a}(cm)`,
  };
});

/** 겨냥도를 보고 전개도의 면 수(각기둥의 전개도만 다룬다. 각뿔의 전개도는 교육과정 밖) */
export const netFaces = mid("l6-net-faces", (rand) => {
  const n = randInt(rand, 3, 6);
  const ask = pick(rand, ["면", "옆면"] as const);
  const v = ask === "면" ? n + 2 : n;
  return {
    key: `${n}:${ask}`,
    prompt: `그림과 같은 각기둥의 전개도를 그리면 ${ask === "면" ? "면은 모두" : "옆면(직사각형)은"} 몇 개인가요?`,
    visual: soloScene(`${poly(n)}기둥의 겨냥도`, prism(n, SOLO)),
    answer: v,
    unit: "개",
    hint: "전개도의 면의 수는 각기둥의 면의 수와 같아요. 밑면 2개와 옆면(밑면의 변의 수만큼)을 세어요.",
    explanation: `밑면이 ${poly(n)}형 → 밑면 2개, 옆면 ${n}개 → ${ask === "면" ? `${n + 2}개` : `옆면 ${n}개`}`,
    mistakes: ask === "면" ? { [n]: "옆면만 셌어요.", [n + 1]: "밑면을 하나만 셌어요." } : { [n + 2]: "밑면까지 셌어요." },
  };
});

/** 전개도의 둘레: 밑면의 변과 같은 선분 4(n−1)개, 높이와 같은 선분 2개 */
const netPerimeter = (n: number, a: number, h: number) => 4 * (n - 1) * a + 2 * h;

export const netPerimeterGen = word("l6-net-perimeter", (rand) => {
  const n = randInt(rand, 3, 6);
  const a = randInt(rand, 2, 9);
  const h = randInt(rand, 3, 15);
  if (a === h || h / a < 0.5 || h / a > 2.5) return null;
  const P = netPerimeter(n, a, h);
  return {
    key: `${n}:${a}:${h}`,
    prompt: `그림은 밑면이 정${poly(n)}형인 각기둥의 전개도입니다. 전개도의 둘레는 몇 cm인가요?`,
    visual: netScene(n, { a: `${a} cm`, h: `${h} cm` }, h / a),
    answer: P,
    unit: "cm",
    hint: "전개도의 바깥쪽 선분 중 밑면의 한 변과 길이가 같은 것과 높이와 길이가 같은 것을 각각 세어요.",
    explanation: `${a} cm인 선분 ${4 * (n - 1)}개, ${h} cm인 선분 2개 → ${a} × ${4 * (n - 1)} + ${h} × 2 = ${P}(cm)`,
  };
});

export const netHeightReverse = word("l6-net-height-reverse", (rand) => {
  const n = randInt(rand, 3, 6);
  const a = randInt(rand, 2, 9);
  const h = randInt(rand, 3, 15);
  if (a === h || h / a < 0.5 || h / a > 2.5) return null;
  const P = netPerimeter(n, a, h);
  return {
    key: `${n}:${a}:${h}`,
    prompt: `그림은 밑면이 정${poly(n)}형인 각기둥의 전개도이고, 전개도의 둘레는 ${P} cm입니다. ㉠의 길이는 몇 cm인가요?`,
    visual: netScene(n, { a: `${a} cm`, h: "㉠" }, h / a),
    answer: h,
    unit: "cm",
    hint: "둘레에서 밑면의 한 변과 길이가 같은 선분들을 빼면 ㉠과 길이가 같은 선분 2개가 남아요.",
    explanation: `${a} cm인 선분 ${4 * (n - 1)}개의 합 ${4 * (n - 1) * a} cm, (${P} − ${4 * (n - 1) * a}) ÷ 2 = ${h}(cm)`,
  };
});

/** 겨냥도에 밑면의 한 변과, 각뿔의 꼭짓점과 밑면을 잇는 모서리를 적는다 */
export const pyramidEdgeLength = word("l6-pyramid-edge-length", (rand) => {
  const n = randInt(rand, 3, 6);
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, a + 2, 15);
  const s = pyramid(n, SOLO);
  const i = frontSide(s);
  const k = rightmost(s.bot);
  return {
    key: `${n}:${a}:${b}`,
    prompt: "밑면이 정다각형이고 옆면이 모두 합동인 이등변삼각형인 각뿔입니다. 이 각뿔의 모든 모서리의 길이의 합은 몇 cm인가요?",
    visual: soloScene(`밑면의 한 변이 ${a} cm, 각뿔의 꼭짓점과 밑면을 잇는 모서리가 ${b} cm인 ${poly(n)}뿔`, s, {
      texts: [labelOut(s.bot[i], s.bot[(i + 1) % n], SOLO_C, `${a} cm`), labelOut(s.apex!, s.bot[k], SOLO_C, `${b} cm`)],
    }),
    answer: n * (a + b),
    unit: "cm",
    hint: "밑면의 모양을 보고, 밑면의 모서리와 각뿔의 꼭짓점과 밑면을 잇는 모서리가 각각 몇 개인지 세어요.",
    explanation: `${poly(n)}뿔: ${a} cm인 모서리 ${n}개, ${b} cm인 모서리 ${n}개 → ${a} × ${n} + ${b} × ${n} = ${n * (a + b)}(cm)`,
  };
});

export const pyramidFromEdges = mid("l6-pyramid-from-edges", (rand) => {
  const n = randInt(rand, 3, 10);
  const ask = pick(rand, ["면", "꼭짓점"] as const);
  return {
    key: `${n}:${ask}`,
    prompt: `모서리가 ${2 * n}개인 각뿔의 ${ask}${eunNeun(ask)} 몇 개인가요?`,
    answer: n + 1,
    unit: "개",
    hint: "각뿔의 모서리 수 ÷ 2 = 밑면의 변의 수",
    explanation: `밑면의 변 ${n}개 → ${ask} ${n + 1}개`,
  };
});

/** 각기둥·각뿔을 밝히지 않고 합만 준다. 보기 중 합이 맞는 것은 하나뿐 */
export const pyramidSumReverse = word("l6-pyramid-sum-reverse", (rand) => {
  const n = randInt(rand, 3, 8);
  const pyr = rand() < 0.5;
  const sum = (m: number, p: boolean) => (p ? 4 * m + 2 : 6 * m + 2);
  const S = sum(n, pyr);
  const name = (m: number, p: boolean) => `${poly(m)}${p ? "뿔" : "기둥"}`;
  const pool = [3, 4, 5, 6, 7, 8, 9]
    .flatMap((m) => [true, false].map((p) => ({ m, p })))
    .filter((c) => sum(c.m, c.p) !== S && Math.abs(c.m - n) <= 2);
  const others = shuffle(rand, pool)
    .slice(0, 3)
    .map((c) => name(c.m, c.p));
  const answer = name(n, pyr);
  return {
    key: `${n}:${pyr}`,
    prompt: `어떤 입체도형의 면, 모서리, 꼭짓점의 수를 모두 더했더니 ${S}개였습니다. 이 입체도형이 될 수 있는 것을 고르세요.`,
    answer,
    choices: shuffle(rand, [answer, ...others]),
    hint: "각기둥: (□+2) + (□×3) + (□×2) = □×6 + 2, 각뿔: (□+1) + (□×2) + (□+1) = □×4 + 2 (□: 밑면의 변의 수)",
    explanation: `${pyr ? `(${S} − 2) ÷ 4 = ${n}` : `(${S} − 2) ÷ 6 = ${n}`} → ${answer}. 다른 보기는 합이 ${S}개가 아닙니다.`,
  };
});

/** 밑면의 모양이 같은 각기둥(가)과 각뿔(나)을 나란히 보여 준다 */
export const solidCompare = word("l6-solid-compare", (rand) => {
  const n = randInt(rand, 3, 6);
  const part = pick(rand, ["면", "모서리", "꼭짓점"] as const);
  const a = prismCounts(n)[part];
  const b = pyramidCounts(n)[part];
  return {
    key: `${n}:${part}`,
    prompt: `밑면의 모양이 같은 각기둥 가와 각뿔 나가 있습니다. 두 입체도형의 ${part}의 수의 차는 몇 개인가요?`,
    visual: compose(400, 180, `${poly(n)}기둥 가와 ${poly(n)}뿔 나`, prism(n, { ...SOLO, cx: 100 }), pyramid(n, { ...SOLO, cx: 300 }), { texts: [text([100, 170], "가"), text([300, 170], "나")] }),
    answer: a - b,
    unit: "개",
    hint: "밑면의 모양을 보고 각기둥과 각뿔의 구성 요소의 수를 각각 구해 비교해요.",
    explanation: `${poly(n)}기둥 ${a}개, ${poly(n)}뿔 ${b}개 → ${a - b}개`,
  };
});

/* ── 6-1-3 소수의 나눗셈 ── */

/** 소수 자릿수 */
const places = (x: number) => (trim(x).split(".")[1] ?? "").length;
/**
 * 0을 내리지 않고 끝나는 (소수)÷(자연수): 나누어지는 수가 자연수가 아니고, 몫의 소수 자릿수가 나누어지는 수보다 많지 않다.
 * '0을 내리는 나눗셈'(dec-zero)과 '(자연수)÷(자연수)의 몫을 소수로'(whole-dec) 차시 앞의 소수 나눗셈 차시가 쓴다.
 */
export const noZeroDown = (a: number, q: number) => !Number.isInteger(Number(trim(a))) && places(a) >= places(q);

export const ddScale = easy("l6-dd-scale", (rand) => {
  const k = randInt(rand, 2, 9);
  const q = randInt(rand, 11, 199);
  const N = q * k;
  const p = pick(rand, [10, 100]);
  if (!noZeroDown(N / p, q / p)) return null;
  return {
    key: `${N}:${k}:${p}`,
    prompt: `${N} ÷ ${k} = ${j(q, "를")} 이용하여 □ 안에 알맞은 수를 써넣으세요.`,
    expression: `${trim(N / p)} ÷ ${k} = □`,
    answer: trim(q / p),
    hint: `나누어지는 수가 1/${p}배가 되면 몫도 1/${p}배가 돼요.`,
    explanation: `${j(trim(N / p), "는")} ${N}의 1/${p}배이므로 몫은 ${trim(q / p)}`,
    mistakes: { [q]: "몫의 소수점을 찍지 않았어요." },
  };
});

export const ddScaleTimes = mid("l6-dd-scale-times", (rand) => {
  const k = randInt(rand, 2, 9);
  const q = randInt(rand, 11, 199);
  const N = q * k;
  const p = pick(rand, [10, 100]);
  if (!noZeroDown(N / p, q / p)) return null;
  const answer = p === 10 ? "0.1배" : "0.01배";
  return {
    key: `${N}:${k}:${p}`,
    prompt: `${trim(N / p)} ÷ ${k}의 몫은 ${N} ÷ ${k}의 몫의 몇 배인가요?`,
    answer,
    choices: ["0.1배", "0.01배", "10배", "100배"],
    hint: "나누는 수가 같을 때 나누어지는 수가 몇 배가 되었는지 살펴봐요.",
    explanation: `${j(trim(N / p), "는")} ${N}의 ${answer}이므로 몫도 ${answer}예요.`,
  };
});

export const ddCm = mid("l6-dd-cm", (rand) => {
  const k = randInt(rand, 2, 9);
  const q = randInt(rand, 11, 199);
  const N = q * k;
  if (!noZeroDown(N / 100, q / 100)) return null;
  return {
    key: `${N}:${k}`,
    prompt: `색 테이프 ${N} cm를 ${k}명이 똑같이 나누면 한 명이 ${q} cm씩 가집니다. 색 테이프 ${trim(N / 100)} m를 ${k}명이 똑같이 나누면 한 명이 몇 m씩 가지나요?`,
    answer: trim(q / 100),
    unit: "m",
    hint: "1 cm = 0.01 m예요.",
    explanation: `${q} cm = ${trim(q / 100)} m`,
  };
});

export const ddWrong = word("l6-dd-wrong", (rand) => {
  const k = randInt(rand, 2, 9);
  const r = randInt(rand, 11, 99) / 10;
  const x = r * k;
  return {
    key: `${r}:${k}`,
    prompt: `어떤 수에 ${j(k, "를")} 곱해야 할 것을 잘못하여 ${j(k, "로")} 나누었더니 ${j(trim(r), "가")} 되었습니다. 바르게 계산한 값은 얼마인가요?`,
    answer: trim(x * k),
    hint: `먼저 어떤 수를 구해요. (어떤 수) = ${trim(r)} × ${k}`,
    explanation: `어떤 수 = ${trim(r)} × ${k} = ${trim(x)}, 바르게 계산하면 ${trim(x)} × ${k} = ${trim(x * k)}`,
    mistakes: { [trim(x)]: "어떤 수까지만 구했어요." },
  };
});

export const ddCard = word("l6-dd-card", (rand) => {
  const cards = digitsDistinct(rand, 3).sort((a, b) => b - a);
  const x = Number(`${cards[0]}.${cards[1]}${cards[2]}`);
  // 몫이 소수 두 자리 안에서 끝나고(0을 내리지 않음) 1보다 크며 몫에 0이 없는(dec-zero 차시 내용) 나누는 수만
  const ds = [2, 3, 4, 5, 6, 7, 8, 9].filter((d) => noZeroDown(x, x / d) && x / d > 1 && !String(Math.round((x / d) * 100)).includes("0"));
  if (ds.length === 0) return null;
  const d = pick(rand, ds);
  const small = Number(`${cards[2]}.${cards[1]}${cards[0]}`);
  return {
    key: `${cards.join("")}:${d}`,
    prompt: `수 카드 ${j([...cards].reverse().join(", "), "를")} 한 번씩 모두 사용하여 소수 두 자리 수 □.□□를 만들려고 합니다. 만들 수 있는 가장 큰 수를 ${j(d, "로")} 나눈 몫은 얼마인가요?`,
    answer: trim(x / d),
    hint: "높은 자리에 큰 수부터 놓아 가장 큰 수를 만들어요.",
    explanation: `가장 큰 수 ${x}, ${x} ÷ ${d} = ${trim(x / d)}`,
    mistakes: { [trim(small / d)]: "가장 작은 수를 나눴어요." },
  };
});

const decPair = (rand: () => number) => {
  const k = randInt(rand, 2, 9);
  const q = randInt(rand, 11, 999) / 100;
  return { k, q, a: Number((q * k).toFixed(2)) };
};

export const ddCompare = mid("l6-dd-compare", (rand) => {
  const ps = Array.from({ length: 4 }, () => decPair(rand));
  if (new Set(ps.map((p) => p.q)).size < 4) return null;
  // 이 차시(dec-whole) 범위: 몫이 1보다 크고, 몫에 0이 없고, 0을 내리지 않는다
  if (ps.some((p) => p.q < 1 || String(Math.round(p.q * 100)).includes("0") || !noZeroDown(p.a, p.q))) return null;
  const exprs = ps.map((p) => `${trim(p.a)} ÷ ${p.k}`);
  const best = ps.reduce((b, p, i) => (p.q > ps[b].q ? i : b), 0);
  return {
    key: exprs.join("|"),
    prompt: "몫이 가장 큰 나눗셈을 고르세요.",
    answer: exprs[best],
    choices: exprs,
    hint: "각 나눗셈의 몫을 구하거나 어림하여 비교해요.",
    explanation: ps.map((p) => `${trim(p.a)} ÷ ${p.k} = ${trim(p.q)}`).join(", "),
  };
});

export const ddRange = word("l6-dd-range", (rand) => {
  const k = randInt(rand, 2, 9);
  const q = randInt(rand, 11, 99) / 10;
  if (Number.isInteger(q) || !noZeroDown(q * k, q)) return null;
  const a = trim(q * k);
  return {
    key: `${a}:${k}`,
    prompt: "□ 안에 들어갈 수 있는 자연수 중에서 가장 큰 수를 구하세요.",
    expression: `□ < ${a} ÷ ${k}`,
    answer: Math.floor(q),
    hint: "먼저 나눗셈의 몫을 구해요.",
    explanation: `${a} ÷ ${k} = ${trim(q)}이므로 □는 ${Math.floor(q)} 이하의 자연수예요.`,
    mistakes: { [Math.ceil(q)]: "□는 몫보다 작아야 해요." },
  };
});

export const ddSmall = easy("l6-dd-small", (rand) => {
  const k = randInt(rand, 2, 9);
  const q = randInt(rand, 11, 99) / 100;
  if (!noZeroDown(q * k, q)) return null;
  const a = trim(q * k);
  return {
    key: `${a}:${k}`,
    prompt: "계산해 보세요.",
    expression: `${a} ÷ ${k} = □`,
    answer: trim(q),
    hint: "몫이 1보다 작으면 일의 자리에 0을 쓰고 소수점을 찍어요.",
    explanation: `${a} ÷ ${k} = ${trim(q)}`,
    mistakes: { [trim(q * 10)]: "소수점 위치가 틀렸어요." },
  };
});

export const ddSmallBlank = mid("l6-dd-small-blank", (rand) => {
  const k = randInt(rand, 2, 9);
  const q = randInt(rand, 11, 99) / 100;
  if (!noZeroDown(q * k, q)) return null;
  const a = trim(q * k);
  return {
    key: `${a}:${k}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: `□ × ${k} = ${a}`,
    answer: trim(q),
    hint: `□ = ${a} ÷ ${k}`,
    explanation: `${a} ÷ ${k} = ${trim(q)}`,
  };
});

export const ddSmallWord = mid("l6-dd-small-word", (rand) => {
  const k = randInt(rand, 2, 9);
  const q = randInt(rand, 11, 99) / 100;
  if (!noZeroDown(q * k, q)) return null;
  const a = trim(q * k);
  const [item, u] = pick(rand, [["우유", "L"], ["밀가루", "kg"], ["철사", "m"]]);
  return {
    key: `${a}:${k}:${item}`,
    prompt: `${item} ${a} ${j(u, "를")} ${k}명이 똑같이 나누어 가지려고 합니다. 한 명이 가지는 ${item}는 몇 ${u}인가요?`,
    answer: trim(q),
    unit: u,
    hint: `${a} ÷ ${j(k, "를")} 계산해요.`,
    explanation: `${a} ÷ ${k} = ${trim(q)}(${u})`,
  };
});

export const ddSmallCompare = word("l6-dd-small-compare", (rand) => {
  const k1 = randInt(rand, 3, 9);
  const k2 = randInt(rand, 3, 9);
  // 사과 한 개는 0.15~0.45 kg
  const q1 = randInt(rand, 15, 45) / 100;
  const q2 = randInt(rand, 15, 45) / 100;
  if (q1 === q2 || k1 === k2 || !noZeroDown(q1 * k1, q1) || !noZeroDown(q2 * k2, q2)) return null;
  return {
    key: `${k1}:${q1}:${k2}:${q2}`,
    prompt: `가 상자에는 무게가 같은 사과 ${k1}개가 ${trim(q1 * k1)} kg, 나 상자에는 무게가 같은 사과 ${k2}개가 ${trim(q2 * k2)} kg 들어 있습니다. 두 상자에 든 사과 한 개의 무게의 차는 몇 kg인가요?`,
    answer: trim(Math.abs(q1 - q2)),
    unit: "kg",
    hint: "각 상자에서 사과 한 개의 무게를 먼저 구해요.",
    explanation: `가: ${trim(q1 * k1)} ÷ ${k1} = ${trim(q1)}, 나: ${trim(q2 * k2)} ÷ ${k2} = ${trim(q2)} → 차 ${trim(Math.abs(q1 - q2))} kg`,
  };
});

/** 나누어 가진 뒤 사용하고 남은 양: (소수)÷(자연수)의 몫이 1보다 작다 */
export const ddSmallReverse = word("l6-dd-small-reverse", (rand) => {
  const k = randInt(rand, 3, 8);
  const q = randInt(rand, 21, 95) / 100;
  const u = randInt(rand, 1, Math.floor(q * 10) - 1) / 10;
  if (u <= 0 || q * 100 % 10 === 0 || !noZeroDown(q * k, q)) return null;
  const a = trim(q * k);
  const [p] = names(rand, 1);
  return {
    key: `${k}:${q}:${u}`,
    prompt: `주스 ${a} L를 ${k}명이 똑같이 나누어 가졌습니다. ${p}는 받은 주스 중 ${u} L를 마셨습니다. ${p}에게 남은 주스는 몇 L인가요?`,
    answer: trim(q - u),
    unit: "L",
    hint: "먼저 한 명이 받은 주스를 (소수) ÷ (자연수)로 구해요. 몫의 자연수 부분에 0을 써요.",
    explanation: `${a} ÷ ${k} = ${trim(q)}(L), ${trim(q)} − ${u} = ${trim(q - u)}(L)`,
    mistakes: { [trim(q)]: "한 명이 받은 양까지만 구했어요." },
  };
});

const zeroQuot = (rand: () => number) => {
  const w = randInt(rand, 1, 9);
  const y = randInt(rand, 1, 9);
  const k = randInt(rand, 2, 9);
  const q = w + y / 100;
  return { w, y, k, q, a: trim(q * k) };
};

export const ddZeroDown = easy("l6-dd-zero-down", (rand) => {
  const k = pick(rand, [2, 4, 5, 6, 8]);
  // 몫이 소수 둘째 자리까지, 나누어지는 수는 소수 첫째 자리까지
  const m = k === 5 ? randInt(rand, 51, 499) * 2 : randInt(rand, 10, 99) * 10 + 5;
  if (m % 10 === 0) return null;
  const a = trim((m * k) / 100);
  return {
    key: `${a}:${k}`,
    prompt: "계산해 보세요.",
    expression: `${a} ÷ ${k} = □`,
    answer: trim(m / 100),
    hint: "나누어떨어지지 않으면 소수점 아래 0을 내려 계산해요.",
    explanation: `${a} ÷ ${k} = ${trim(m / 100)}`,
  };
});

export const ddZeroMid = easy("l6-dd-zero-mid", (rand) => {
  const { k, q, a } = zeroQuot(rand);
  return {
    key: `${a}:${k}`,
    prompt: "계산해 보세요.",
    expression: `${a} ÷ ${k} = □`,
    answer: trim(q),
    hint: "나누어지는 수가 나누는 수보다 작은 자리에는 몫에 0을 써요.",
    explanation: `${a} ÷ ${k} = ${trim(q)}`,
    mistakes: { [trim(Math.floor(q) + (Math.round((q % 1) * 100) % 10) / 10)]: "몫의 소수 첫째 자리에 0을 쓰지 않았어요." },
  };
});

export const ddZeroFix = mid("l6-dd-zero-fix", (rand) => {
  const { w, y, k, q, a } = zeroQuot(rand);
  const [p] = names(rand, 1);
  return {
    key: `${a}:${k}`,
    prompt: `${p}는 ${a} ÷ ${k}의 몫을 ${w}.${j(y, "라고")} 잘못 계산했습니다. 바르게 계산한 몫은 얼마인가요?`,
    answer: trim(q),
    hint: "소수 첫째 자리에서 나눌 수 없으면 몫에 0을 써야 해요.",
    explanation: `${a} ÷ ${k} = ${trim(q)}`,
    mistakes: { [`${w}.${y}`]: "몫의 소수 첫째 자리에 0을 써야 해요." },
  };
});

export const ddZeroBlank = mid("l6-dd-zero-blank", (rand) => {
  const { k, q, a } = zeroQuot(rand);
  return {
    key: `${a}:${k}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: `□ ÷ ${k} = ${trim(q)}`,
    answer: a,
    hint: "□ = 몫 × 나누는 수",
    explanation: `${trim(q)} × ${k} = ${a}`,
  };
});

/** 잘못 쓴 몫을 보고 까닭 고르기: 0을 빠뜨린 경우와 소수점을 빠뜨린 경우 */
export const ddZeroError = word("l6-dd-zero-error", (rand) => {
  const { w, y, k, q, a } = zeroQuot(rand);
  const [p] = names(rand, 1);
  const missZero = rand() < 0.5;
  const wrong = missZero ? `${w}.${y}` : `${w}0${y}`;
  const answer = missZero ? "몫의 소수 첫째 자리에 0을 쓰지 않았습니다." : "몫에 소수점을 찍지 않았습니다.";
  return {
    key: `${a}:${k}:${missZero}`,
    prompt: `${p}는 ${a} ÷ ${j(k, "를")} 계산하여 몫을 ${j(wrong, "라고")} 했습니다. 잘못 계산한 까닭을 고르세요.`,
    answer,
    choices: shuffle(rand, ["몫의 소수 첫째 자리에 0을 쓰지 않았습니다.", "몫에 소수점을 찍지 않았습니다.", "나누는 수와 나누어지는 수를 바꾸어 나누었습니다.", "나머지를 몫에 더했습니다."]),
    hint: "어림한 몫과 비교하고, 각 자리에서 나눌 수 없을 때 몫에 무엇을 써야 하는지 생각해 보세요.",
    explanation: `바른 몫은 ${trim(q)}입니다. ${missZero ? `소수 첫째 자리 숫자가 ${k}보다 작아 나눌 수 없으므로 몫에 0을 써야 합니다.` : `${a} ÷ ${j(k, "는")} 약 ${w}이므로 몫에 소수점을 찍어야 합니다.`}`,
  };
});

export const ddZeroTwoStep = word("l6-dd-zero-two-step", (rand) => {
  const { k, q, a } = zeroQuot(rand);
  const b = randInt(rand, 1, Math.max(1, Math.floor(q * 10) - 1)) / 10;
  if (b >= q) return null;
  return {
    key: `${a}:${k}:${b}`,
    prompt: `밀가루 ${a} kg을 통 ${k}개에 똑같이 나누어 담았습니다. 그중 한 통에서 ${b} kg을 사용했다면 그 통에 남은 밀가루는 몇 kg인가요?`,
    answer: trim(q - b),
    unit: "kg",
    hint: `먼저 한 통에 담은 양 ${a} ÷ ${j(k, "를")} 구해요.`,
    explanation: `${a} ÷ ${k} = ${trim(q)}, ${trim(q)} − ${b} = ${trim(q - b)}(kg)`,
  };
});

const TERMINATING = [2, 4, 5, 8, 20, 25];

export const wwdDec = easy("l6-wwd-dec", (rand) => {
  const b = pick(rand, TERMINATING);
  const a = randInt(rand, 1, b * 5);
  if (a % b === 0) return null;
  return {
    key: `${a}:${b}`,
    prompt: "나눗셈의 몫을 소수로 나타내세요.",
    expression: `${a} ÷ ${b} = □`,
    answer: trim(a / b),
    hint: "나누어떨어질 때까지 소수점 아래 0을 내려 계산해요.",
    explanation: `${a} ÷ ${b} = ${trim(a / b)}`,
  };
});

export const wwdDecCmp = mid("l6-wwd-dec-cmp", (rand) => {
  const b = pick(rand, [2, 4, 5, 8]);
  const a = randInt(rand, 1, b * 3);
  if (a % b === 0) return null;
  const v = a / b;
  const x = pick(rand, [v, v + 0.1, v - 0.1, v + 0.05, v - 0.05]);
  if (x <= 0) return null;
  return {
    key: `${a}:${b}:${trim(x)}`,
    prompt: "크기를 비교하여 ○ 안에 >, =, < 중 알맞은 것을 고르세요.",
    expression: `${a} ÷ ${b} ○ ${trim(x)}`,
    answer: cmpText(Number(trim(v)), Number(trim(x))),
    choices: [...COMPARE_CHOICES],
    hint: "나눗셈의 몫을 소수로 구해 비교해요.",
    explanation: `${a} ÷ ${b} = ${trim(v)}`,
  };
});

export const wwdDecWord = mid("l6-wwd-dec-word", (rand) => {
  const b = pick(rand, TERMINATING);
  const a = randInt(rand, 2, b * 4);
  if (a % b === 0) return null;
  return {
    key: `${a}:${b}`,
    prompt: `물 ${a} L를 병 ${b}개에 똑같이 나누어 담으려고 합니다. 한 병에 몇 L씩 담아야 하나요? 소수로 나타내세요.`,
    answer: trim(a / b),
    unit: "L",
    hint: `${a} ÷ ${j(b, "를")} 소수로 계산해요.`,
    explanation: `${a} ÷ ${b} = ${trim(a / b)}(L)`,
  };
});

export const wwdDecCompare = word("l6-wwd-dec-compare", (rand) => {
  const k1 = pick(rand, [2, 4, 5, 8]);
  const k2 = pick(rand, [2, 4, 5, 8]);
  const a1 = randInt(rand, k1 + 1, k1 * 6);
  const a2 = randInt(rand, k2 + 1, k2 * 6);
  const q1 = a1 / k1;
  const q2 = a2 / k2;
  if (q1 === q2) return null;
  return {
    key: `${a1}:${k1}:${a2}:${k2}`,
    prompt: `가 수도꼭지는 ${k1}분 동안 물 ${a1} L를, 나 수도꼭지는 ${k2}분 동안 물 ${a2} L를 받습니다. 두 수도꼭지가 1분 동안 받는 물의 양의 차는 몇 L인가요?`,
    answer: trim(Math.abs(q1 - q2)),
    unit: "L",
    hint: "각 수도꼭지가 1분 동안 받는 물의 양을 소수로 구해요.",
    explanation: `가: ${a1} ÷ ${k1} = ${trim(q1)}, 나: ${a2} ÷ ${k2} = ${trim(q2)} → 차 ${trim(Math.abs(q1 - q2))} L`,
  };
});

export const wwdDecWrong = word("l6-wwd-dec-wrong", (rand) => {
  const b = pick(rand, [4, 5, 8]);
  const c = pick(rand, [2, 4, 5].filter((x) => x !== b));
  const x = randInt(rand, 3, 60);
  if (x % b === 0) return null;
  return {
    key: `${x}:${b}:${c}`,
    prompt: `어떤 자연수를 ${j(b, "로")} 나누어야 할 것을 잘못하여 ${j(c, "로")} 나누었더니 몫이 ${j(trim(x / c), "가")} 되었습니다. 바르게 계산한 몫을 소수로 나타내세요.`,
    answer: trim(x / b),
    hint: `먼저 어떤 수를 구해요. (어떤 수) = ${trim(x / c)} × ${c}`,
    explanation: `어떤 수 = ${trim(x / c)} × ${c} = ${x}, ${x} ÷ ${b} = ${trim(x / b)}`,
    mistakes: { [x]: "어떤 수까지만 구했어요." },
  };
});

export const ddEstimate = easy("l6-dd-estimate", (rand) => {
  const { k, q, a } = decPair(rand);
  const answer = trim(q);
  return {
    key: `${a}:${k}`,
    prompt: `어림하여 ${trim(a)} ÷ ${k}의 몫의 소수점 위치가 알맞은 것을 고르세요.`,
    answer,
    choices: opts(rand, answer, [trim(q * 10), trim(q / 10), trim(q * 100)], () => trim(q / 100)),
    hint: `${j(trim(a), "를")} 반올림하여 자연수로 만든 뒤 ${j(k, "로")} 나누어 어림해요.`,
    explanation: `${Math.round(a)} ÷ ${k} → 약 ${trim(Math.round(a) / k, 1)}이므로 몫은 ${answer}`,
  };
});

export const ddEstRange = mid("l6-dd-est-range", (rand) => {
  const { k, q, a } = decPair(rand);
  const w = Math.floor(q);
  if (Number.isInteger(q)) return null;
  const between = (i: number) => `${j(i, "와")} ${i + 1} 사이`;
  const answer = between(w);
  return {
    key: `${a}:${k}`,
    prompt: `${trim(a)} ÷ ${k}의 몫은 어느 범위에 있나요?`,
    answer,
    choices: opts(rand, answer, [between(w + 1), between(w + 2), between(w === 0 ? w + 3 : w - 1)], () => between(w + 3)),
    hint: `${k} × □가 ${trim(a)}에 가까운 자연수 □를 찾아요.`,
    explanation: `${k} × ${w} = ${k * w}, ${k} × ${w + 1} = ${k * (w + 1)}이므로 몫은 ${j(w, "와")} ${w + 1} 사이`,
  };
});

export const ddEstGreater = mid("l6-dd-est-greater", (rand) => {
  const ks = Array.from({ length: 4 }, () => randInt(rand, 2, 9));
  const big = randInt(rand, 0, 3);
  const exprs = ks.map((k, i) => {
    const a = i === big ? randInt(rand, k * 10 + 1, k * 30) / 10 : randInt(rand, 11, k * 10 - 1) / 10;
    return `${trim(a)} ÷ ${k}`;
  });
  if (new Set(exprs).size < 4) return null;
  return {
    key: exprs.join("|"),
    prompt: "몫이 1보다 큰 나눗셈을 고르세요.",
    answer: exprs[big],
    choices: exprs,
    hint: "나누어지는 수가 나누는 수보다 크면 몫이 1보다 커요.",
    explanation: `${j(exprs[big], "는")} 나누어지는 수가 나누는 수보다 큽니다.`,
  };
});

export const ddEstError = word("l6-dd-est-error", (rand) => {
  const { k, q, a } = decPair(rand);
  const wrong = rand() < 0.5 ? q * 10 : q / 10;
  const [p] = names(rand, 1);
  const answer = trim(q);
  return {
    key: `${a}:${k}:${trim(wrong)}`,
    prompt: `${p}는 ${trim(a)} ÷ ${k}의 몫을 ${j(trim(wrong), "라고")} 했습니다. 어림하여 잘못된 곳을 찾고 바른 몫을 고르세요.`,
    answer,
    choices: opts(rand, answer, [trim(wrong), trim(q * 100), trim(q / 100)], () => trim(q * 1000)),
    hint: `${j(trim(a), "를")} 반올림하여 어림하면 몫이 대략 얼마인지 알 수 있어요.`,
    explanation: `${Math.round(a)} ÷ ${k} → 약 ${trim(Math.round(a) / k, 1)}이므로 바른 몫은 ${answer}`,
  };
});

/** 공만의 무게를 구한 뒤 몫을 어림하여 소수점 위치 찾기 */
export const ddEstBox = word("l6-dd-est-box", (rand) => {
  const k = randInt(rand, 3, 9);
  const q = randInt(rand, 110, 990) / 100;
  const b = randInt(rand, 2, 9) / 10;
  if ((q * 100) % 10 === 0) return null;
  const W = trim(q * k + b);
  const answer = trim(q);
  return {
    key: `${k}:${q}:${b}`,
    prompt: `무게가 같은 공 ${k}개를 상자에 담아 무게를 재었더니 ${W} kg이었습니다. 빈 상자의 무게는 ${b} kg입니다. 공 한 개의 무게를 어림하여 알맞은 것을 고르세요.`,
    answer,
    choices: shuffle(rand, [answer, trim(q * 10), trim(q / 10), trim(q * 100)]),
    hint: "공만의 무게를 구한 뒤, 공의 수로 나눈 몫을 어림하여 소수점의 위치를 찾아요.",
    explanation: `공만의 무게 ${W} − ${b} = ${trim(q * k)}(kg), 약 ${Math.round(q * k)} ÷ ${k} → 약 ${Math.round((q * k) / k)} kg이므로 ${answer} kg`,
  };
});

/* ── 6-1-4 비와 비율 ── */

export const cmpTable = easy("l6-cmp-table", (rand) => {
  const g = randInt(rand, 1, 3);
  const t = randInt(rand, 2, 4);
  const s = g * t;
  const m = randInt(rand, 2, 4);
  const div = rand() < 0.5;
  return {
    key: `${g}:${t}:${m}:${div}`,
    prompt: div
      ? `모둠 수에 따라 필요한 가위 수와 풀 수를 나타낸 표입니다. 가위 수는 풀 수의 몇 배인가요?`
      : `모둠 수에 따라 필요한 가위 수와 풀 수를 나타낸 표입니다. 모둠이 ${m}개일 때 가위는 풀보다 몇 개 더 많은가요?`,
    visual: table(["모둠 수", "1", "2", "3", "4"], [["가위 수", ...[1, 2, 3, 4].map((i) => String(s * i))], ["풀 수", ...[1, 2, 3, 4].map((i) => String(g * i))]]),
    answer: div ? t : (s - g) * m,
    unit: div ? "배" : "개",
    hint: div ? "가위 수를 풀 수로 나누어 비교해요." : "가위 수에서 풀 수를 빼서 비교해요.",
    explanation: div ? `${s} ÷ ${g} = ${t}(배)` : `${s * m} − ${g * m} = ${(s - g) * m}(개)`,
  };
});

/** 두 양의 관계가 변하지 않는 비교 방법: 모둠(나눗셈) 또는 나이(뺄셈) */
export const cmpMethod = mid("l6-cmp-method", (rand) => {
  const byDiv = rand() < 0.5;
  const g = randInt(rand, 1, 3);
  const t = randInt(rand, 2, 4);
  const [older, younger] = [randInt(rand, 10, 14), randInt(rand, 5, 9)];
  const answer = byDiv ? "나눗셈으로 비교하기" : "뺄셈으로 비교하기";
  return {
    key: byDiv ? `div:${g}:${t}` : `sub:${older}:${younger}`,
    prompt: byDiv
      ? `한 모둠에 가위가 ${g * t}개, 풀이 ${g}개 필요합니다. 모둠 수가 늘어나도 변하지 않는 두 양의 관계를 알아보려면 어떤 방법으로 비교해야 하나요?`
      : `올해 언니는 ${older}살, 동생은 ${younger}살입니다. 해가 지나도 변하지 않는 두 사람의 나이의 관계를 알아보려면 어떤 방법으로 비교해야 하나요?`,
    answer,
    choices: shuffle(rand, ["뺄셈으로 비교하기", "나눗셈으로 비교하기", "덧셈으로 비교하기", "곱셈으로 비교하기"]),
    hint: "양이 늘어날 때 차와 몇 배인지가 각각 어떻게 변하는지 살펴봐요.",
    explanation: byDiv
      ? `뺄셈으로 비교하면 차가 ${g * t - g}, ${2 * (g * t - g)}, …로 변하지만 나눗셈으로 비교하면 가위는 항상 풀의 ${t}배입니다.`
      : `나이는 두 사람 모두 1살씩 늘어나므로 차 ${older - younger}살은 변하지 않지만, 몇 배인지는 해마다 변합니다.`,
  };
});

/** 한 번의 관계로 몇 배인지 구한 뒤 다른 경우에 적용 */
export const cmpMissing = mid("l6-cmp-missing", (rand) => {
  const t = randInt(rand, 2, 6);
  const a = randInt(rand, 2, 5);
  const x = randInt(rand, 6, 15);
  return {
    key: `${t}:${a}:${x}`,
    prompt: `학생 수는 항상 모둠 수의 몇 배로 일정합니다. 모둠이 ${a}개일 때 학생이 ${a * t}명이면, 모둠이 ${x}개일 때 학생은 몇 명인가요?`,
    answer: t * x,
    unit: "명",
    hint: "먼저 학생 수가 모둠 수의 몇 배인지 구해요.",
    explanation: `${a * t} ÷ ${a} = ${t}(배), ${x} × ${t} = ${t * x}(명)`,
    mistakes: { [t]: "몇 배인지까지만 구했어요." },
  };
});

export const cmpPattern = word("l6-cmp-pattern", (rand) => {
  const t = randInt(rand, 3, 6);
  const n = randInt(rand, 6, 20);
  return {
    key: `${t}:${n}`,
    prompt: `책상 1개에 의자를 ${t}개씩 놓으려고 합니다. 책상이 ${n}개일 때 의자 수와 책상 수의 차는 몇 개인가요?`,
    answer: n * (t - 1),
    unit: "개",
    hint: "책상 수에 따라 의자 수가 어떻게 변하는지 규칙을 찾아요.",
    explanation: `의자 ${n} × ${t} = ${n * t}개, ${n * t} − ${n} = ${n * (t - 1)}(개)`,
  };
});

export const cmpTwoWays = word("l6-cmp-two-ways", (rand) => {
  const b = randInt(rand, 2, 9) * 100;
  const t = randInt(rand, 2, 5);
  return {
    key: `${b}:${t}`,
    prompt: `가 마을의 인구는 ${b * t}명, 나 마을의 인구는 ${b}명입니다. 가 마을의 인구는 나 마을보다 몇 명 많고, 나 마을의 몇 배인가요?`,
    answer: `${b * t - b},${t}`,
    unit: ["명", "배"],
    hint: "뺄셈으로 차를, 나눗셈으로 몇 배인지를 구해요.",
    explanation: `${b * t} − ${b} = ${b * t - b}(명), ${b * t} ÷ ${b} = ${t}(배)`,
  };
});

export const ratioRead = easy("l6-ratio-read", (rand) => {
  const a = randInt(rand, 1, 9);
  const b = randInt(rand, 1, 9);
  if (a === b) return null;
  const answer = `${b}에 대한 ${a}의 비`;
  return {
    key: `${a}:${b}`,
    prompt: `${a} : ${j(b, "를")} 바르게 읽은 것을 고르세요.`,
    answer,
    choices: opts(rand, answer, [`${a}에 대한 ${b}의 비`, `${b} 대 ${a}`, `${b}의 ${a}에 대한 비`], () => answer),
    hint: "▲ : ■는 '▲ 대 ■', '■에 대한 ▲의 비', '▲의 ■에 대한 비'로 읽어요.",
    explanation: `${a} : ${j(b, "는")} ${a} 대 ${b}, ${b}에 대한 ${a}의 비, ${a}의 ${b}에 대한 비로 읽어요.`,
  };
});

export const ratioWrite = mid("l6-ratio-write", (rand) => {
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, 2, 9);
  if (a === b) return null;
  const answer = `${b} : ${a + b}`;
  return {
    key: `${a}:${b}`,
    prompt: `바구니에 사과가 ${a}개, 귤이 ${b}개 있습니다. 전체 과일 수에 대한 귤의 수의 비를 고르세요.`,
    answer,
    choices: opts(rand, answer, [`${a + b} : ${b}`, `${b} : ${a}`, `${a} : ${b}`], () => `${a} : ${a + b}`),
    hint: "'~에 대한'의 앞이 기준량이고 비의 뒤에 써요.",
    explanation: `기준량은 전체 ${a + b}개, 비교하는 양은 귤 ${b}개 → ${answer}`,
  };
});

export const ratioBase = mid("l6-ratio-base", (rand) => {
  const a = randInt(rand, 1, 20);
  const b = randInt(rand, 1, 20);
  if (a === b) return null;
  const askBase = rand() < 0.5;
  return {
    key: `${a}:${b}:${askBase}`,
    prompt: `비 ${a} : ${b}에서 ${askBase ? "기준량" : "비교하는 양"}은 얼마인가요?`,
    answer: askBase ? b : a,
    hint: "비 ▲ : ■에서 ■가 기준량, ▲가 비교하는 양이에요.",
    explanation: `${a} : ${b}에서 비교하는 양 ${a}, 기준량 ${b}`,
    mistakes: { [askBase ? a : b]: "기준량과 비교하는 양을 바꿨어요." },
  };
});

export const ratioCond = word("l6-ratio-cond", (rand) => {
  const x = randInt(rand, 2, 20);
  const d = randInt(rand, 1, 10);
  const y = x + d;
  const answer = `${x} : ${y}`;
  return {
    key: `${x}:${d}`,
    prompt: `다음 조건을 모두 만족하는 비를 고르세요.\n· 비교하는 양은 기준량보다 ${d} 작습니다.\n· 비교하는 양과 기준량의 합은 ${x + y}입니다.`,
    answer,
    choices: opts(rand, answer, [`${y} : ${x}`, `${x + 1} : ${y - 1}`, `${d} : ${x + y}`], () => `${x - 1} : ${y + 1}`),
    hint: "합에서 차를 빼고 2로 나누면 작은 수(비교하는 양)예요.",
    explanation: `비교하는 양 (${x + y} − ${d}) ÷ 2 = ${x}, 기준량 ${y} → ${answer}`,
  };
});

export const ratioError = word("l6-ratio-error", (rand) => {
  const a = randInt(rand, 1, 9);
  const b = randInt(rand, 1, 9);
  if (a === b) return null;
  const [p] = names(rand, 1);
  const answer = `기준량이 ${b}이므로 ${a} : ${b}`;
  return {
    key: `${a}:${b}`,
    prompt: `${p}는 '${b}에 대한 ${a}의 비'를 ${b} : ${j(a, "라고")} 썼습니다. 잘못된 까닭과 바르게 쓴 비를 고르세요.`,
    answer,
    choices: opts(rand, answer, [`기준량이 ${a}이므로 ${b} : ${a}`, `기준량이 ${b}이므로 ${b} : ${a}`, `기준량이 ${a}이므로 ${a} : ${b}`], () => answer),
    hint: "'~에 대한' 앞의 수가 기준량이고, 기준량은 비의 뒤에 써요.",
    explanation: `${j(b, "가")} 기준량이므로 ${a} : ${j(b, "로")} 써야 합니다.`,
  };
});

/** 비율은 대분수로 쓰지 않고 가분수(또는 진분수) 기약분수로 */
const ratioText = (a: number, b: number) => {
  const g = gcd(a, b);
  return b / g === 1 ? String(a / g) : `${a / g}/${b / g}`;
};
export const ratioFrac = mid("l6-ratio-frac", (rand) => {
  const b = randInt(rand, 2, 12);
  const a = randInt(rand, 1, b * 2);
  if (a === b || a % b === 0) return null;
  const answer = ratioText(a, b);
  const others = [ratioText(b, a), ratioText(a, a + b), ratioText(a + 1, b), ratioText(a, b + 1), ratioText(a + b, b)];
  const value = (t: string) => (t.includes("/") ? Number(t.split("/")[0]) / Number(t.split("/")[1]) : Number(t));
  const picked: string[] = [];
  for (const o of others) if (picked.length < 3 && value(o) !== a / b && !picked.some((p) => value(p) === value(o))) picked.push(o);
  return {
    key: `${a}:${b}`,
    prompt: `비 ${a} : ${b}의 비율을 기약분수로 나타낸 것을 고르세요.`,
    answer,
    choices: shuffle(rand, [answer, ...picked]),
    hint: "비율 = (비교하는 양) / (기준량). 기준량은 : 뒤의 수예요.",
    explanation: `${a}/${b}${answer !== `${a}/${b}` ? ` = ${answer}` : ""}`,
    mistakes: { [ratioText(b, a)]: "기준량과 비교하는 양을 바꿨어요." },
  };
});

export const ratioCompareRate = word("l6-ratio-compare-rate", (rand) => {
  const ps = names(rand, 4);
  const shots = ps.map(() => pick(rand, [10, 20, 25, 50]));
  const made = shots.map((s) => randInt(rand, 1, s - 1));
  const rates = made.map((m, i) => m / shots[i]);
  if (new Set(rates).size < 4) return null;
  const best = rates.indexOf(Math.max(...rates));
  return {
    key: `${shots.join()}:${made.join()}`,
    prompt: "공을 던진 횟수에 대한 골을 넣은 횟수의 비율이 가장 높은 사람을 고르세요.",
    visual: table(["이름", ...ps], [["던진 횟수", ...shots.map(String)], ["넣은 횟수", ...made.map(String)]]),
    answer: ps[best],
    choices: ps,
    hint: "(넣은 횟수) ÷ (던진 횟수)를 각각 소수로 구해 비교해요.",
    explanation: ps.map((p, i) => `${p} ${trim(rates[i])}`).join(", "),
  };
});

export const speedRate = easy("l6-speed", (rand) => {
  const t = randInt(rand, 2, 5);
  const v = randInt(rand, 30, 90);
  return {
    key: `${t}:${v}`,
    prompt: `자동차가 ${v * t} km를 ${t}시간 동안 달렸습니다. 걸린 시간에 대한 간 거리의 비율을 구하세요.`,
    answer: v,
    hint: "(간 거리) ÷ (걸린 시간)",
    explanation: `${v * t} ÷ ${t} = ${v}`,
    mistakes: { [trim(t / (v * t))]: "기준량과 비교하는 양을 바꿨어요." },
  };
});

export const densityRate = mid("l6-density", (rand) => {
  const A = randInt(rand, 2, 30);
  const d = randInt(rand, 5, 90) * 10;
  return {
    key: `${A}:${d}`,
    prompt: `넓이가 ${A} km²인 마을에 ${won(A * d)}명이 삽니다. 넓이에 대한 인구의 비율(인구 밀도)을 구하세요.`,
    answer: d,
    hint: "(인구) ÷ (넓이)",
    explanation: `${A * d} ÷ ${A} = ${d}`,
  };
});

export const concentration = mid("l6-concentration", (rand) => {
  const w = pick(rand, [100, 200, 250, 400, 500]);
  const s = randInt(rand, 5, w / 4);
  const v = s / w;
  if (String(v).length > 5) return null;
  return {
    key: `${w}:${s}`,
    prompt: `소금 ${s} g을 물에 녹여 소금물 ${w} g을 만들었습니다. 소금물 양에 대한 소금 양의 비율을 소수로 나타내세요.`,
    answer: trim(v),
    hint: "(소금 양) ÷ (소금물 양)",
    explanation: `${s} ÷ ${w} = ${trim(v)}`,
    mistakes: { [trim(s / (w - s))]: "기준량을 물의 양으로 했어요. 소금물 전체가 기준량이에요." },
  };
});

export const speedCompare = word("l6-speed-compare", (rand) => {
  const ps = names(rand, 4);
  const ts = ps.map(() => randInt(rand, 2, 6));
  const vs = ps.map(() => randInt(rand, 3, 15) * 10);
  if (new Set(vs).size < 4) return null;
  const best = vs.indexOf(Math.max(...vs));
  return {
    key: `${ts.join()}:${vs.join()}`,
    prompt: "자전거를 탄 거리와 걸린 시간을 나타낸 표입니다. 걸린 시간에 대한 간 거리의 비율이 가장 큰 사람을 고르세요.",
    visual: table(["이름", ...ps], [["간 거리(km)", ...vs.map((v, i) => String((v * ts[i]) / 10))], ["걸린 시간(시간)", ...ts.map(String)]]),
    answer: ps[best],
    choices: ps,
    hint: "각 사람의 (간 거리) ÷ (걸린 시간)을 구해 비교해요.",
    explanation: ps.map((p, i) => `${p} ${vs[i] / 10}`).join(", "),
  };
});

export const densityCompare = word("l6-density-compare", (rand) => {
  const [A1, A2] = [randInt(rand, 2, 12), randInt(rand, 2, 12)];
  const [d1, d2] = [randInt(rand, 10, 90) * 10, randInt(rand, 10, 90) * 10];
  if (d1 === d2) return null;
  return {
    key: `${A1}:${d1}:${A2}:${d2}`,
    prompt: `가 마을은 넓이 ${A1} km²에 ${won(A1 * d1)}명, 나 마을은 넓이 ${A2} km²에 ${won(A2 * d2)}명이 삽니다. 두 마을의 인구 밀도의 차를 구하세요.`,
    answer: Math.abs(d1 - d2),
    hint: "각 마을의 (인구) ÷ (넓이)를 구한 뒤 비교해요.",
    explanation: `가 ${d1}, 나 ${d2} → 차 ${Math.abs(d1 - d2)}`,
    mistakes: { [Math.abs(A1 * d1 - A2 * d2)]: "인구의 차를 구했어요." },
  };
});

export const pctFrac = mid("l6-pct-frac", (rand) => {
  const d = pick(rand, [2, 4, 5, 10, 20, 25, 50]);
  const n = randInt(rand, 1, d - 1);
  if (gcd(n, d) !== 1) return null;
  return {
    key: `${n}/${d}`,
    prompt: `비율 ${n}/${d}${jp(n, "를")} 백분율로 나타내세요.`,
    answer: (n / d) * 100,
    unit: "%",
    hint: "비율에 100을 곱해요.",
    explanation: `${n}/${d} × 100 = ${(n / d) * 100}(%)`,
  };
});

export const pctCompare = mid("l6-pct-compare", (rand) => {
  const vals = digitsDistinct(rand, 4, 1, 19).map((v) => v * 5);
  const forms = vals.map((p, i) => (i === 0 ? trim(p / 100) : i === 1 ? reduced(p, 100) : `${p}%`));
  forms[3] = trim(vals[3] / 100);
  const best = vals.indexOf(Math.max(...vals));
  return {
    key: vals.join(),
    prompt: "비율이 가장 큰 것을 고르세요.",
    answer: forms[best],
    choices: forms,
    hint: "모두 백분율로 바꾸어 비교해요.",
    explanation: forms.map((f, i) => `${f} = ${vals[i]}%`).join(", "),
  };
});

export const pctCard = word("l6-pct-card", (rand) => {
  const pool = [1, 2, 4, 5, 8];
  const cards = digitsDistinct(rand, 3, 0, 4).map((i) => pool[i]).sort((a, b) => a - b);
  let best = 0;
  let bn = 0;
  let bd = 1;
  for (const n of cards) for (const d of cards) if (n < d && n / d > best) [best, bn, bd] = [n / d, n, d];
  return {
    key: cards.join(),
    prompt: `수 카드 ${cards.join(", ")} 중에서 2장을 골라 진분수를 만들려고 합니다. 만들 수 있는 가장 큰 진분수를 백분율로 나타내세요.`,
    answer: trim(best * 100),
    unit: "%",
    hint: "분모와 분자의 차가 작을수록, 분모가 클수록 진분수가 커지는지 따져 보세요.",
    explanation: `가장 큰 진분수 ${bn}/${bd} → ${bn}/${bd} × 100 = ${trim(best * 100)}(%)`,
  };
});

export const pctOf = easy("l6-pct-of", (rand) => {
  const total = pick(rand, [100, 200, 300, 400, 500]);
  const p = randInt(rand, 1, 19) * 5;
  return {
    key: `${total}:${p}`,
    prompt: `${total}의 ${p}%는 얼마인가요?`,
    answer: (total * p) / 100,
    hint: `${total} × ${p}/100`,
    explanation: `${total} × ${p}/100 = ${(total * p) / 100}`,
  };
});

export const discountRate = mid("l6-discount-rate", (rand) => {
  const price = randInt(rand, 2, 40) * 1000;
  const p = pick(rand, [10, 20, 25, 30, 40, 50]);
  const sale = price - (price * p) / 100;
  if (!Number.isInteger(sale)) return null;
  return {
    key: `${price}:${p}`,
    prompt: `${won(price)}원짜리 물건을 ${won(sale)}원에 샀습니다. 할인율은 몇 %인가요?`,
    answer: p,
    unit: "%",
    hint: "(할인 금액) ÷ (원래 가격) × 100",
    explanation: `할인 금액 ${won(price - sale)}원, ${price - sale} ÷ ${price} × 100 = ${p}(%)`,
    mistakes: { [100 - p]: "판매 가격의 비율을 구했어요." },
  };
});

/** 원래 가격이 싼 쪽이 할인한 뒤에는 더 비싸지도록 해 계산해야 비교할 수 있게 한다 */
export const pctStore = word("l6-pct-store", (rand) => {
  const p1 = randInt(rand, 20, 60) * 500;
  const p2 = randInt(rand, 20, 60) * 500;
  const r1 = pick(rand, [10, 20, 30, 40]);
  const r2 = pick(rand, [10, 20, 30, 40]);
  const s1 = (p1 * (100 - r1)) / 100;
  const s2 = (p2 * (100 - r2)) / 100;
  if (r1 === r2 || (p1 - p2) * (s1 - s2) >= 0) return null;
  return {
    key: `${p1}:${r1}:${p2}:${r2}`,
    prompt: `가 가게에서는 ${won(p1)}원인 가방을 ${r1}% 할인하고, 나 가게에서는 ${won(p2)}원인 가방을 ${r2}% 할인하여 팝니다. 할인한 가격이 더 싼 가방은 얼마인가요?`,
    answer: Math.min(s1, s2),
    unit: "원",
    hint: "각 가게의 판매 가격 = 원래 가격 − 할인 금액. 원래 가격만 보고 판단하면 안 돼요.",
    explanation: `가: ${won(p1)} − ${won((p1 * r1) / 100)} = ${won(s1)}원, 나: ${won(p2)} − ${won((p2 * r2) / 100)} = ${won(s2)}원 → ${won(Math.min(s1, s2))}원`,
    mistakes: { [Math.max(s1, s2)]: "더 비싼 가방의 가격이에요." },
  };
});

export const pctReverse = word("l6-pct-reverse", (rand) => {
  const p = pick(rand, [10, 20, 25, 40, 50]);
  const price = randInt(rand, 4, 40) * 1000;
  const sale = (price * (100 - p)) / 100;
  if (!Number.isInteger(sale)) return null;
  return {
    key: `${p}:${price}`,
    prompt: `어떤 물건을 원래 가격에서 ${p}% 할인하여 ${won(sale)}원에 샀습니다. 이 물건의 원래 가격은 얼마인가요?`,
    answer: price,
    unit: "원",
    hint: `판매 가격은 원래 가격의 ${100 - p}%예요.`,
    explanation: `원래 가격의 ${100 - p}%가 ${won(sale)}원 → 1%는 ${won(sale)} ÷ ${100 - p} = ${won(price / 100)}(원) → 100%는 ${won(price / 100)} × 100 = ${won(price)}(원)`,
    mistakes: { [sale + (sale * p) / 100]: "판매 가격에 할인율만큼 더했어요. 기준량은 원래 가격이에요." },
  };
});

/* ── 6-1-5 여러 가지 그래프 ── */

const REGIONS = ["가", "나", "다", "라"];
const picValues = (rand: () => number) => REGIONS.map(() => randInt(rand, 11, 49) * 100);
/** 마을별 사과 생산량 그림그래프(큰 원 1000상자, 작은 원 100상자) */
const picVisual = (vals: (number | null)[]) => pictureGraph(REGIONS, vals, ["마을", "사과 생산량"], ["1000상자", "100상자"]);
const PIC_HINT = "큰 원은 1000상자, 작은 원은 100상자예요.";
const picRead1 = (v: number) => `큰 원 ${Math.floor(v / 1000)}개, 작은 원 ${(v % 1000) / 100}개 → ${v}상자`;

export const picRead = easy("l6-pic-read", (rand) => {
  const vals = picValues(rand);
  const i = randInt(rand, 0, 3);
  return {
    key: `${vals.join()}:${i}`,
    prompt: `마을별 사과 생산량을 나타낸 그림그래프입니다. ${REGIONS[i]} 마을의 사과 생산량은 몇 상자인가요?`,
    visual: picVisual(vals),
    answer: vals[i],
    unit: "상자",
    hint: PIC_HINT,
    explanation: picRead1(vals[i]),
  };
});

export const picTotal = mid("l6-pic-total", (rand) => {
  const vals = picValues(rand);
  const sum = vals.reduce((a, b) => a + b, 0);
  return {
    key: vals.join(),
    prompt: "마을별 사과 생산량을 나타낸 그림그래프입니다. 네 마을의 사과 생산량은 모두 몇 상자인가요?",
    visual: picVisual(vals),
    answer: sum,
    unit: "상자",
    hint: `${PIC_HINT} 각 마을의 생산량을 읽은 뒤 모두 더해요.`,
    explanation: `${vals.join(" + ")} = ${sum}(상자)`,
  };
});

export const picRound = mid("l6-pic-round", (rand) => {
  const v = randInt(rand, 1101, 4999);
  if (v % 100 === 0) return null;
  const r = Math.round(v / 100) * 100;
  return {
    key: `${v}`,
    prompt: `어느 마을의 사과 생산량은 ${v}상자입니다. 백의 자리까지 반올림하여 그림그래프로 나타낼 때 큰 원(1000상자)과 작은 원(100상자)은 각각 몇 개 그려야 하나요?`,
    answer: `${Math.floor(r / 1000)},${(r % 1000) / 100}`,
    unit: ["개(큰 원)", "개(작은 원)"],
    hint: "먼저 백의 자리까지 반올림해요.",
    explanation: `${v} → ${r}상자 → 큰 원 ${Math.floor(r / 1000)}개, 작은 원 ${(r % 1000) / 100}개`,
  };
});

export const picCompare = word("l6-pic-compare", (rand) => {
  const vals = picValues(rand);
  if (new Set(vals).size < 4) return null;
  const mx = Math.max(...vals);
  const mn = Math.min(...vals);
  return {
    key: vals.join(),
    prompt: "마을별 사과 생산량을 나타낸 그림그래프입니다. 생산량이 가장 많은 마을은 가장 적은 마을보다 몇 상자 더 많이 생산했나요?",
    visual: picVisual(vals),
    answer: mx - mn,
    unit: "상자",
    hint: `${PIC_HINT} 생산량을 모두 읽고 가장 많은 곳과 가장 적은 곳을 찾아요.`,
    explanation: `${REGIONS[vals.indexOf(mx)]} ${mx}상자 − ${REGIONS[vals.indexOf(mn)]} ${mn}상자 = ${mx - mn}(상자)`,
  };
});

export const picReverse = word("l6-pic-reverse", (rand) => {
  const vals = picValues(rand);
  const i = randInt(rand, 0, 3);
  const sum = vals.reduce((a, b) => a + b, 0);
  return {
    key: `${vals.join()}:${i}`,
    prompt: `네 마을의 사과 생산량은 모두 ${sum}상자입니다. 그림그래프에서 지워진 ${REGIONS[i]} 마을의 생산량은 몇 상자인가요?`,
    visual: picVisual(vals.map((v, k) => (k === i ? null : v))),
    answer: vals[i],
    unit: "상자",
    hint: `${PIC_HINT} 전체 생산량에서 나머지 세 마을의 생산량을 빼요.`,
    explanation: `${sum} − ${vals.filter((_, k) => k !== i).join(" − ")} = ${vals[i]}(상자)`,
  };
});

const HOBBIES = ["운동", "독서", "게임", "음악"];

/** 합이 100인 서로 다른 5의 배수 백분율 4개(모두 min% 이상이라 그래프 칸에 이름을 쓸 수 있다. 원그래프는 15%) */
function pcts4(rand: () => number, min = 10): number[] | null {
  const a = randInt(rand, 5, 9) * 5;
  const b = randInt(rand, 3, 7) * 5;
  const c = randInt(rand, min / 5, 5) * 5;
  const d = 100 - a - b - c;
  const all = shuffle(rand, [a, b, c, d]);
  if (d < min || new Set(all).size < 4) return null;
  return all;
}

const items = (names: string[], ps: number[], show?: (i: number) => string | null | undefined): Item[] => names.map((name, i) => ({ name, pct: ps[i], show: show?.(i) }));

/**
 * 띠그래프 그림(288 × 66, 눈금이 있으면 288 × 92). 폭 288: 휴대폰에서 글자 12px 이상.
 * 띠 폭 264에서 10% 칸(26.4px)은 이름을 세로로 쓰고 백분율은 띠 아래에 써서 그림이 BAND_BELOW만큼 길어진다(bandGraph)
 */
const BAND_W = 264;
const BAND_H = 46;
const below = (its: Item[]) => (bandNeedsBelow(its, BAND_W) ? BAND_BELOW : 0);
const bandScene = (its: Item[], scale = false, label = "좋아하는 취미별 학생 수의 띠그래프") =>
  compose(BAND_W + 24, BAND_H + 20 + below(its) + (scale ? 26 : 0), label, bandGraph(its, [10, 10], BAND_W, BAND_H, scale));
/** 원그래프 그림(240 × 230) */
const pieScene = (its: Item[], label = "좋아하는 취미별 학생 수의 원그래프") => compose(240, 230, label, pieGraph(its, [120, 115], 95));

/** 띠그래프의 눈금을 읽어 백분율 구하기(칸에는 이름만) */
export const bandRead = easy("l6-band-read", (rand) => {
  const ps = pcts4(rand);
  if (!ps) return null;
  const i = randInt(rand, 0, 3);
  const before = ps.slice(0, i).reduce((a, b) => a + b, 0);
  return {
    key: `${ps.join()}:${i}`,
    prompt: `좋아하는 취미를 조사하여 나타낸 띠그래프입니다. ${j(HOBBIES[i], "를")} 좋아하는 학생은 전체의 몇 %인가요?`,
    visual: bandScene(items(HOBBIES, ps, () => null), true),
    answer: ps[i],
    unit: "%",
    hint: "띠그래프 아래 눈금은 한 칸이 5%예요. 그 항목이 차지하는 부분의 처음과 끝 눈금을 읽어요.",
    explanation: `${j(HOBBIES[i], "는")} ${before}%부터 ${before + ps[i]}%까지 → ${before + ps[i]} − ${before} = ${ps[i]}(%)`,
  };
});

/** 한 항목(i)이 다른 항목(t)의 2배나 3배인 백분율 */
const timesPair = (rand: () => number, min: number) => {
  const small = pick(rand, min > 10 ? [15, 20] : [10, 15, 20]);
  const big = small * randInt(rand, 2, 4);
  const rest = 100 - small - big;
  if (rest < 2 * min + 5) return null;
  const x = randInt(rand, min / 5, rest / 5 - min / 5) * 5;
  const vals = [small, big, x, rest - x];
  // 나머지 두 항목끼리는 같아도 되지만, 비교하는 두 항목(small·big)과는 달라야 헷갈리지 않는다
  if (rest - x < min || [x, rest - x].some((v) => v === small || v === big)) return null;
  const order = shuffle(rand, [0, 1, 2, 3]);
  return { ps: order.map((o) => vals[o]), i: order.indexOf(1), t: order.indexOf(0) };
};

const timesGen = (id: string, pie: boolean) =>
  mid(id, (rand) => {
    // 원그래프는 칸이 좁으면 글자가 선에 걸려 15% 이상만(나머지 두 항목이 같은 값도 허용해 3배가 나옴)
    const pair = timesPair(rand, pie ? 15 : 10);
    if (!pair) return null;
    const { ps, i, t } = pair;
    const its = items(HOBBIES, ps);
    return {
      key: `${ps.join()}`,
      prompt: `좋아하는 취미를 조사하여 나타낸 ${pie ? "원그래프" : "띠그래프"}입니다. ${j(HOBBIES[i], "를")} 좋아하는 학생 수는 ${j(HOBBIES[t], "를")} 좋아하는 학생 수의 몇 배인가요?`,
      visual: pie ? pieScene(its) : bandScene(its),
      answer: ps[i] / ps[t],
      unit: "배",
      hint: "백분율끼리 나누면 학생 수가 몇 배인지 알 수 있어요.",
      explanation: `${ps[i]} ÷ ${ps[t]} = ${ps[i] / ps[t]}(배)`,
    };
  });

export const bandTimes = timesGen("l6-band-times", false);
export const circleTimes = timesGen("l6-circle-times", true);

export const bandCount = word("l6-band-count", (rand) => {
  const ps = pcts4(rand);
  if (!ps) return null;
  const N = pick(rand, [200, 300, 400, 500, 600]);
  const [i, t] = [0, 1].map(() => randInt(rand, 0, 3));
  if (i === t) return null;
  const [a, b] = ps[i] > ps[t] ? [i, t] : [t, i];
  return {
    key: `${ps.join()}:${N}:${a}:${b}`,
    prompt: `학생 ${N}명이 좋아하는 취미를 조사하여 나타낸 띠그래프입니다. ${j(HOBBIES[a], "를")} 좋아하는 학생은 ${j(HOBBIES[b], "를")} 좋아하는 학생보다 몇 명 더 많나요?`,
    visual: bandScene(items(HOBBIES, ps)),
    answer: (N * (ps[a] - ps[b])) / 100,
    unit: "명",
    hint: "백분율의 차를 구한 뒤 전체 학생 수에 곱하거나, 각 학생 수를 구해 빼요.",
    explanation: `${N} × ${ps[a]}/100 = ${(N * ps[a]) / 100}, ${N} × ${ps[b]}/100 = ${(N * ps[b]) / 100} → ${(N * (ps[a] - ps[b])) / 100}(명)`,
    mistakes: { [ps[a] - ps[b]]: "백분율의 차만 구했어요." },
  };
});

/** 과일 '배'는 '2배'와 헷갈리므로 쓰지 않고, 백분율끼리의 차는 "~만큼 큽니다"로 쓴다 */
export const bandCond = word("l6-band-cond", (rand) => {
  const B = randInt(rand, 2, 5) * 5;
  const m = pick(rand, [2, 3]);
  const x = randInt(rand, 1, 3) * 5;
  const d = 100 - (m + 2) * B - x;
  if (d < 5) return null;
  const ask = pick(rand, ["사과", "딸기"] as const);
  const answer = ask === "사과" ? m * B : B + x;
  return {
    key: `${B}:${m}:${x}:${ask}`,
    prompt: `좋아하는 과일을 조사하여 띠그래프로 나타냈습니다. 다음을 모두 만족할 때 ${j(ask, "는")} 몇 %인가요?\n· 사과의 백분율은 포도의 백분율의 ${m}배입니다.\n· 딸기의 백분율은 포도의 백분율보다 ${x}만큼 큽니다.\n· 나머지 귤은 ${d}%입니다.`,
    answer,
    unit: "%",
    hint: `포도를 □%라 하면 사과는 □ × ${m}, 딸기는 □ + ${x}이고 전체는 100%예요.`,
    explanation: `□ + □ × ${m} + □ + ${x} + ${d} = 100 → □ × ${m + 2} = ${100 - x - d} → □ = ${B}(포도 ${B}%), ${ask === "사과" ? `사과: ${B} × ${m} = ${answer}(%)` : `딸기: ${B} + ${x} = ${answer}(%)`}`,
    mistakes: { [B]: "포도의 백분율을 구했어요." },
  };
});

const SEASONS = ["봄", "여름", "가을", "겨울"];

/** 띠그래프 그리기: 한 칸이 5%인 띠에 항목이 차지할 칸 수 */
export const bandPercent = easy("l6-band-percent", (rand) => {
  const total = pick(rand, [20, 40]);
  const unit = total / 20;
  const cells = [randInt(rand, 5, 8), randInt(rand, 3, 6), randInt(rand, 2, 5)];
  cells.push(20 - cells[0] - cells[1] - cells[2]);
  if (cells[3] < 2) return null;
  const counts = cells.map((c) => c * unit);
  const i = randInt(rand, 1, 3);
  const lines: NonNullable<ShapeScene["lines"]> = [];
  const cw = BAND_W / 20;
  const cx = (k: number) => Math.round((10 + k * cw) * 10) / 10;
  // 칸(13.2px)이 글자보다 좁아 봄 부분 안의 칸 선은 긋지 않는다(봄 글자와 겹치지 않게)
  for (let k = cells[0] + 1; k < 20; k++) lines.push({ from: [cx(k), 10], to: [cx(k), 50], width: 1 });
  return {
    key: `${counts.join()}:${i}`,
    prompt: `좋아하는 계절을 조사하였더니 ${SEASONS.map((s, k) => `${s} ${counts[k]}명`).join(", ")}이었습니다. 한 칸이 5%인 띠그래프에 봄을 먼저 나타냈습니다. ${j(SEASONS[i], "는")} 몇 칸을 차지하도록 그려야 하나요?`,
    visual: compose(BAND_W + 24, 60, "20칸으로 나눈 띠그래프 틀, 봄이 차지하는 부분을 먼저 그림", {
      polygons: [{ points: [[10, 10], [cx(20), 10], [cx(20), 50], [10, 50]] }, { points: [[10, 10], [cx(cells[0]), 10], [cx(cells[0]), 50], [10, 50]], fill: true }],
      lines,
      texts: [text([(10 + cx(cells[0])) / 2, 30], "봄")],
    }),
    answer: cells[i],
    unit: "칸",
    hint: `먼저 (항목의 수) ÷ (합계) × 100으로 백분율을 구하고, 5%가 한 칸이에요.`,
    explanation: `${counts[i]} ÷ ${total} × 100 = ${cells[i] * 5}(%) → ${cells[i] * 5} ÷ 5 = ${cells[i]}(칸)`,
    mistakes: { [cells[i] * 5]: "백분율까지만 구했어요. 한 칸은 5%예요." },
  };
});

export const bandLength = mid("l6-band-length", (rand) => {
  const ps = pcts4(rand);
  if (!ps) return null;
  const L = pick(rand, [10, 20]);
  const i = randInt(rand, 0, 3);
  return {
    key: `${ps.join()}:${L}:${i}`,
    prompt: `좋아하는 취미를 조사하여 나타낸 띠그래프입니다. 띠그래프의 전체 길이가 ${L} cm일 때, ${j(HOBBIES[i], "가")} 차지하는 부분의 길이는 몇 cm인가요?`,
    visual: bandScene(items(HOBBIES, ps)),
    answer: trim((L * ps[i]) / 100),
    unit: "cm",
    hint: `전체 길이 × ${ps[i]}/100`,
    explanation: `${L} × ${ps[i]}/100 = ${trim((L * ps[i]) / 100)}(cm)`,
  };
});

export const bandMissing = mid("l6-band-missing", (rand) => {
  const ps = pcts4(rand);
  if (!ps) return null;
  const i = randInt(rand, 0, 3);
  return {
    key: `${ps.join()}:${i}`,
    prompt: `좋아하는 취미를 조사하여 나타낸 띠그래프입니다. ${j(HOBBIES[i], "는")} 전체의 몇 %인가요?`,
    visual: bandScene(items(HOBBIES, ps, (k) => (k === i ? "□%" : undefined))),
    answer: ps[i],
    unit: "%",
    hint: "백분율의 합계는 100%예요.",
    explanation: `100 − ${ps.filter((_, k) => k !== i).join(" − ")} = ${ps[i]}(%)`,
  };
});

const SPORTS = ["축구", "야구", "피구", "농구"];

export const bandReverse = word("l6-band-reverse", (rand) => {
  const ps = pcts4(rand);
  if (!ps) return null;
  const total = pick(rand, [20, 40, 60, 80, 100, 200]);
  const i = randInt(rand, 0, 3);
  const a = (total * ps[i]) / 100;
  if (!Number.isInteger(a)) return null;
  return {
    key: `${ps.join()}:${total}:${i}`,
    prompt: `학생들이 좋아하는 운동을 조사하여 나타낸 띠그래프입니다. ${j(SPORTS[i], "를")} 좋아하는 학생이 ${a}명이면 조사한 학생은 모두 몇 명인가요?`,
    visual: bandScene(items(SPORTS, ps), false, "좋아하는 운동별 학생 수의 띠그래프"),
    answer: total,
    unit: "명",
    hint: `전체 × ${ps[i]}/100 = ${a}이므로 전체 = ${a} ÷ ${ps[i]} × 100`,
    explanation: `${a} ÷ ${ps[i]} × 100 = ${total}(명)`,
  };
});

export const bandTwoStep = word("l6-band-two-step", (rand) => {
  const ps = pcts4(rand);
  if (!ps) return null;
  const N = pick(rand, [200, 400, 500, 1000]);
  const q = pick(rand, [20, 25, 40, 50, 60, 75]);
  const i = randInt(rand, 0, 3);
  const c = (N * ps[i]) / 100;
  const v = (c * q) / 100;
  if (!Number.isInteger(v)) return null;
  return {
    key: `${ps.join()}:${N}:${q}:${i}`,
    prompt: `학생 ${N}명이 좋아하는 취미를 조사하여 나타낸 띠그래프입니다. ${j(HOBBIES[i], "를")} 좋아하는 학생 중 ${q}%가 여학생이라면, ${j(HOBBIES[i], "를")} 좋아하는 여학생은 몇 명인가요?`,
    visual: bandScene(items(HOBBIES, ps)),
    answer: v,
    unit: "명",
    hint: `먼저 띠그래프에서 ${HOBBIES[i]}의 백분율을 읽어 학생 수를 구해요.`,
    explanation: `${N} × ${ps[i]}/100 = ${c}, ${c} × ${q}/100 = ${v}(명)`,
    mistakes: { [c]: `${j(HOBBIES[i], "를")} 좋아하는 학생 수까지만 구했어요.` },
  };
});

export const circleSum = mid("l6-circle-sum", (rand) => {
  const ps = pcts4(rand, 15);
  if (!ps) return null;
  const [i, t] = digitsDistinct(rand, 2, 0, 3);
  return {
    key: `${ps.join()}:${i}:${t}`,
    prompt: `좋아하는 취미를 조사하여 나타낸 원그래프입니다. ${j(HOBBIES[i], "와")} ${j(HOBBIES[t], "를")} 좋아하는 학생은 전체의 몇 %인가요?`,
    visual: pieScene(items(HOBBIES, ps)),
    answer: ps[i] + ps[t],
    unit: "%",
    hint: "두 항목의 백분율을 더해요.",
    explanation: `${ps[i]} + ${ps[t]} = ${ps[i] + ps[t]}(%)`,
  };
});

export const circleReverse = word("l6-circle-reverse", (rand) => {
  const ps = pcts4(rand, 15);
  if (!ps) return null;
  const N = pick(rand, [200, 400, 500, 1000]);
  const [i, t] = digitsDistinct(rand, 2, 0, 3);
  return {
    key: `${ps.join()}:${N}:${i}:${t}`,
    prompt: `좋아하는 취미를 조사하여 나타낸 원그래프입니다. ${j(HOBBIES[i], "를")} 좋아하는 학생이 ${(N * ps[i]) / 100}명일 때, ${j(HOBBIES[t], "를")} 좋아하는 학생은 몇 명인가요?`,
    visual: pieScene(items(HOBBIES, ps)),
    answer: (N * ps[t]) / 100,
    unit: "명",
    hint: `먼저 전체 학생 수를 구해요. ${(N * ps[i]) / 100} ÷ ${ps[i]} × 100`,
    explanation: `전체 ${N}명, ${N} × ${ps[t]}/100 = ${(N * ps[t]) / 100}(명)`,
    mistakes: { [N]: "전체 학생 수까지만 구했어요." },
  };
});

const GRAPH_NAMES = ["원그래프", "띠그래프", "막대그래프", "꺾은선그래프"];

/** 그래프 그림을 보고 이름 고르기 */
export const graphKind = easy("l6-graph-kind", (rand) => {
  const k = randInt(rand, 0, 3);
  const ps = pcts4(rand, 15);
  if (!ps) return null;
  // 그림 설명(화면 읽기)에 그래프 이름이 들어가면 정답이 드러나므로 이름 없이
  const plain = "좋아하는 취미별 학생 수 그래프";
  const visual: Visual =
    k === 0
      ? pieScene(items(HOBBIES, ps), plain)
      : k === 1
        ? bandScene(items(HOBBIES, ps), false, plain)
        : k === 2
          ? { kind: "bars", title: "반별 학생 수", labels: ["1반", "2반", "3반", "4반"], values: ps.map((p) => Math.round(p / 2)), unit: "명", step: 5 }
          : { kind: "line", title: "운동장의 기온", labels: ["9시", "10시", "11시", "12시", "1시"], values: [8, 11, 15, 18, 20].map((v) => v + randInt(rand, 0, 3)), unit: "°C", step: 5 };
  const why = [
    "전체에 대한 각 부분의 비율을 원 모양에 나타낸 그래프",
    "전체에 대한 각 부분의 비율을 띠 모양에 나타낸 그래프",
    "조사한 수량을 막대의 길이로 나타낸 그래프",
    "시간에 따라 변하는 양을 점으로 찍고 선분으로 이은 그래프",
  ][k];
  return {
    key: `${k}:${ps.join()}`,
    prompt: "그림과 같은 그래프를 무엇이라고 하나요?",
    visual,
    answer: GRAPH_NAMES[k],
    choices: shuffle(rand, GRAPH_NAMES),
    hint: "그래프가 원 모양인지, 띠 모양인지, 막대인지, 선으로 이은 것인지 살펴보세요.",
    explanation: `${why}이므로 ${GRAPH_NAMES[k]}입니다.`,
  };
});

/** 작년·올해 띠그래프 두 개를 비교해 백분율의 차 구하기 */
export const graphChange = mid("l6-graph-change", (rand) => {
  const p1 = pcts4(rand);
  const p2 = pcts4(rand);
  if (!p1 || !p2) return null;
  const i = randInt(rand, 0, 3);
  if (p1[i] === p2[i]) return null;
  // 작년·올해 이름은 띠 위에 써서 띠 폭을 넓게 둔다
  const band = (ps: number[], y: number) => bandGraph(items(HOBBIES, ps), [10, y], BAND_W, BAND_H, false);
  // 작년 띠 아래(좁은 칸의 백분율 줄)를 지나 올해 이름과 띠를 놓는다
  const y2 = 26 + BAND_H + below(items(HOBBIES, p1)) + 40;
  return {
    key: `${p1.join()}:${p2.join()}:${i}`,
    prompt: `작년과 올해 좋아하는 취미를 조사하여 나타낸 띠그래프입니다. ${j(HOBBIES[i], "를")} 좋아하는 학생의 백분율은 작년보다 몇 % ${p2[i] > p1[i] ? "늘었나요" : "줄었나요"}?`,
    visual: compose(BAND_W + 24, y2 + BAND_H + below(items(HOBBIES, p2)) + 8, "작년과 올해의 좋아하는 취미 띠그래프", band(p1, 26), band(p2, y2), { texts: [text([26, 13], "작년"), text([26, y2 - 13], "올해")] }),
    answer: Math.abs(p2[i] - p1[i]),
    unit: "%",
    hint: "두 띠그래프에서 같은 항목의 백분율을 읽어 차를 구해요.",
    explanation: `작년 ${p1[i]}%, 올해 ${p2[i]}% → ${Math.max(p1[i], p2[i])} − ${Math.min(p1[i], p2[i])} = ${Math.abs(p2[i] - p1[i])}(%)`,
  };
});

export const graphRank = mid("l6-graph-rank", (rand) => {
  const ps = pcts4(rand, 15);
  if (!ps) return null;
  const sorted = [...ps].sort((a, b) => b - a);
  const answer = HOBBIES[ps.indexOf(sorted[1])];
  return {
    key: ps.join(),
    prompt: "좋아하는 취미를 조사하여 나타낸 원그래프입니다. 두 번째로 많은 학생이 좋아하는 취미를 고르세요.",
    visual: pieScene(items(HOBBIES, ps)),
    answer,
    choices: [...HOBBIES],
    hint: "백분율이 큰 순서대로 늘어놓아요.",
    explanation: `${sorted.join("% > ")}% → ${answer}`,
  };
});

export const graphTwoYear = word("l6-graph-two-year", (rand) => {
  const N1 = pick(rand, [200, 300, 400, 500]);
  const N2 = pick(rand, [200, 300, 400, 500]);
  const p1 = randInt(rand, 2, 8) * 5;
  const p2 = randInt(rand, 2, 8) * 5;
  const c1 = (N1 * p1) / 100;
  const c2 = (N2 * p2) / 100;
  if (N1 === N2 || c1 === c2) return null;
  return {
    key: `${N1}:${p1}:${N2}:${p2}`,
    prompt: `작년에는 학생 ${N1}명 중 ${p1}%가, 올해는 학생 ${N2}명 중 ${p2}%가 수영을 좋아했습니다. 수영을 좋아하는 학생 수의 차는 몇 명인가요?`,
    answer: Math.abs(c1 - c2),
    unit: "명",
    hint: "전체 학생 수가 다르므로 백분율이 아니라 학생 수로 비교해야 해요.",
    explanation: `작년 ${c1}명, 올해 ${c2}명 → 차 ${Math.abs(c1 - c2)}명`,
    mistakes: { [Math.abs(p1 - p2)]: "백분율의 차를 구했어요. 전체 학생 수가 달라요." },
  };
});

/** 비율이 늘거나 줄어도 전체 수가 다르면 학생 수는 반대로 변할 수 있다(정답 방향은 경우마다 다르다) */
export const graphJudge = word("l6-graph-judge", (rand) => {
  const N1 = pick(rand, [200, 300, 400, 500, 600]);
  const N2 = pick(rand, [200, 300, 400, 500, 600]);
  const p1 = randInt(rand, 2, 8) * 5;
  const p2 = randInt(rand, 2, 8) * 5;
  const c1 = (N1 * p1) / 100;
  const c2 = (N2 * p2) / 100;
  if (N1 === N2 || p1 === p2 || c1 === c2 || Math.abs(c2 - c1) === Math.abs(p2 - p1)) return null;
  const [p] = names(rand, 1);
  const d = Math.abs(c2 - c1);
  const up = c2 > c1;
  const answer = `학생 수는 ${d}명 ${up ? "늘었습니다" : "줄었습니다"}.`;
  const rateUp = p2 > p1;
  return {
    key: `${N1}:${p1}:${N2}:${p2}`,
    prompt: `작년에는 학생 ${N1}명 중 ${p1}%가, 올해는 학생 ${N2}명 중 ${p2}%가 줄넘기를 좋아했습니다. ${p}는 "비율이 ${rateUp ? "늘었으니" : "줄었으니"} 줄넘기를 좋아하는 학생 수도 ${rateUp ? "늘었어" : "줄었어"}."라고 말했습니다. 줄넘기를 좋아하는 학생 수의 변화를 바르게 말한 것을 고르세요.`,
    answer,
    choices: shuffle(rand, [answer, `학생 수는 ${d}명 ${up ? "줄었습니다" : "늘었습니다"}.`, "학생 수는 변하지 않았습니다.", `학생 수는 ${Math.abs(p2 - p1)}명 ${rateUp ? "늘었습니다" : "줄었습니다"}.`]),
    hint: "각 해의 학생 수를 직접 구해 비교해요. 전체 학생 수가 다르면 비율만으로 판단할 수 없어요.",
    explanation: `작년 ${N1} × ${p1}/100 = ${c1}명, 올해 ${N2} × ${p2}/100 = ${c2}명 → ${answer}`,
  };
});

/* ── 6-1-6 직육면체의 부피와 겉넓이 ── */

/** 쌓기나무로 쌓은 직육면체(가로 a, 세로 b, 높이 c개) */
const blockScene = (a: number, b: number, c: number) => {
  const u = 24;
  const [w, h] = [a * u + b * u * 0.42, c * u + b * u * 0.32];
  return compose(Math.round(w + 24), Math.round(h + 24), `쌓기나무를 가로 ${a}개, 세로 ${b}개, 높이 ${c}층으로 쌓은 직육면체`, cubeBlock([12, Math.round(h + 12)], a, b, c, u));
};

export const volCountCubes = easy("l6-vol-count-cubes", (rand) => {
  const [a, b, c] = [randInt(rand, 2, 5), randInt(rand, 2, 4), randInt(rand, 2, 4)];
  return {
    key: `${a}:${b}:${c}`,
    prompt: "부피가 1 cm³인 쌓기나무로 그림과 같은 직육면체를 쌓았습니다. 이 직육면체의 부피는 몇 cm³인가요?",
    visual: blockScene(a, b, c),
    answer: a * b * c,
    unit: "cm³",
    hint: "쌓기나무의 수가 부피예요. (가로 개수) × (세로 개수) × (층수)",
    explanation: `가로 ${a}개, 세로 ${b}개, ${c}층 → ${a} × ${b} × ${c} = ${a * b * c}(cm³)`,
    mistakes: { [a + b + c]: "곱하지 않고 더했어요.", [a * c]: "앞에서 보이는 쌓기나무만 셌어요." },
  };
});

/** 쌓기나무로 쌓은 직육면체 가와 나를 나란히(가로·세로·층 수) */
const twoBlocks = (x: number[], y: number[]) => {
  const u = 20;
  const block = (d: number[], cap: string): Block => {
    const [w, h] = [d[0] * u + d[1] * u * 0.42, d[2] * u + d[1] * u * 0.32];
    return { w, h, cap, draw: (o) => cubeBlock([o[0], o[1] + h], d[0], d[1], d[2], u) };
  };
  return row([block(x, "가"), block(y, "나")], `쌓기나무로 쌓은 직육면체 가(가로 ${x[0]}개, 세로 ${x[1]}개, ${x[2]}층)와 나(가로 ${y[0]}개, 세로 ${y[1]}개, ${y[2]}층)`, 36);
};
const blockDims = (rand: () => number) => [randInt(rand, 2, 4), randInt(rand, 2, 3), randInt(rand, 2, 4)];

/** 부피 비교하기 차시: 공식 없이 쌓기나무의 수로 비교(가로·세로·높이 공식은 다음 차시) */
export const volBlockCompare = mid("l6-vol-block-compare", (rand) => {
  const x = blockDims(rand);
  // 4번 중 1번쯤은 부피가 같은 다른 모양
  const y = rand() < 0.25 ? [x[2], x[1], x[0]] : blockDims(rand);
  if (y.join() === x.join()) return null;
  const vx = x[0] * x[1] * x[2];
  const vy = y[0] * y[1] * y[2];
  return {
    key: `${x.join()}:${y.join()}`,
    prompt: "부피가 1 cm³인 쌓기나무로 쌓은 두 직육면체입니다. 부피를 비교하여 ○ 안에 >, =, < 중 알맞은 것을 고르세요.",
    expression: "가 ○ 나",
    visual: twoBlocks(x, y),
    answer: cmpText(vx, vy),
    choices: [...COMPARE_CHOICES],
    hint: "한 층에 놓인 쌓기나무의 수를 먼저 세고, 층 수만큼 더해 전체 쌓기나무의 수를 비교해요.",
    explanation: `가: 한 층에 ${x[0] * x[1]}개씩 ${x[2]}층 → ${vx}개(${vx} cm³), 나: 한 층에 ${y[0] * y[1]}개씩 ${y[2]}층 → ${vy}개(${vy} cm³)`,
  };
});

export const volBlockDiff = word("l6-vol-block-diff", (rand) => {
  const x = blockDims(rand);
  const y = blockDims(rand);
  const vx = x[0] * x[1] * x[2];
  const vy = y[0] * y[1] * y[2];
  if (vx === vy) return null;
  return {
    key: `${x.join()}:${y.join()}`,
    prompt: "부피가 1 cm³인 쌓기나무로 쌓은 두 직육면체 가와 나가 있습니다. 두 직육면체의 부피의 차는 몇 cm³인가요?",
    visual: twoBlocks(x, y),
    answer: Math.abs(vx - vy),
    unit: "cm³",
    hint: "두 직육면체의 쌓기나무의 수를 각각 세어 부피를 구한 뒤 큰 쪽에서 작은 쪽을 빼요.",
    explanation: `가: 한 층에 ${x[0] * x[1]}개씩 ${x[2]}층 → ${vx} cm³, 나: 한 층에 ${y[0] * y[1]}개씩 ${y[2]}층 → ${vy} cm³, ${Math.max(vx, vy)} − ${Math.min(vx, vy)} = ${Math.abs(vx - vy)}(cm³)`,
    mistakes: { [vx + vy]: "부피를 더했어요. 차를 구해야 해요." },
  };
});

/** 직육면체 가와 나의 겨냥도를 나란히(길이 x, y의 비율로 그리고 글자 tx, ty를 적는다) */
function twoBoxes(x: number[], y: number[], tx = x.map((v) => `${v} cm`), ty = y.map((v) => `${v} cm`), label = "직육면체 가와 나"): ShapeScene {
  const px = fitLen([...x, ...y], 96, 24);
  const one = (d: number[], ox: number, t: string[], name: string): Parts => {
    const bx = cuboid([ox, 150], d[0], d[2], d[1] * 0.55);
    return { ...bx, texts: [...boxLabels(bx, t[0], t[1], t[2]), text([ox + d[0] / 2, 16], name)] };
  };
  return compose(460, 184, label, one(px.slice(0, 3), 24, tx, "가"), one(px.slice(3), 250, ty, "나"));
}

export const volCompareSign = mid("l6-vol-compare", (rand) => {
  const x = [randInt(rand, 2, 10), randInt(rand, 2, 10), randInt(rand, 2, 10)];
  const y = [randInt(rand, 2, 10), randInt(rand, 2, 10), randInt(rand, 2, 10)];
  const vx = x[0] * x[1] * x[2];
  const vy = y[0] * y[1] * y[2];
  return {
    key: `${x.join()}:${y.join()}`,
    prompt: "두 직육면체의 부피를 비교하여 ○ 안에 >, =, < 중 알맞은 것을 고르세요.",
    expression: "가 ○ 나",
    visual: twoBoxes(x, y),
    answer: cmpText(vx, vy),
    choices: [...COMPARE_CHOICES],
    hint: "각각의 부피를 (가로) × (세로) × (높이)로 구해 비교해요.",
    explanation: `가 ${x.join(" × ")} = ${vx} cm³, 나 ${y.join(" × ")} = ${vy} cm³`,
  };
});

export const volBoxFit = mid("l6-vol-box-fit", (rand) => {
  const k = randInt(rand, 2, 5);
  const [a, b, c] = [randInt(rand, 2, 5), randInt(rand, 2, 5), randInt(rand, 2, 5)];
  return {
    key: `${k}:${a}:${b}:${c}`,
    prompt: `가로 ${a * k} cm, 세로 ${b * k} cm, 높이 ${c * k} cm인 상자에 한 모서리가 ${k} cm인 정육면체 모양 블록을 빈틈없이 담으려고 합니다. 블록은 모두 몇 개 들어가나요?`,
    answer: a * b * c,
    unit: "개",
    hint: `가로, 세로, 높이에 블록이 각각 몇 개씩 들어가는지 먼저 구해요.`,
    explanation: `${a * k} ÷ ${k} = ${a}, ${b * k} ÷ ${k} = ${b}, ${c * k} ÷ ${k} = ${c} → ${a} × ${b} × ${c} = ${a * b * c}(개)`,
  };
});

export const volDiff = word("l6-vol-diff", (rand) => {
  const s = randInt(rand, 3, 10);
  const [a, b, c] = [randInt(rand, 2, 12), randInt(rand, 2, 12), randInt(rand, 2, 12)];
  const v1 = s ** 3;
  const v2 = a * b * c;
  if (v1 === v2) return null;
  return {
    key: `${s}:${a}:${b}:${c}`,
    prompt: "정육면체 가와 직육면체 나가 있습니다. 두 입체도형의 부피의 차는 몇 cm³인가요?",
    visual: twoBoxes([s, s, s], [a, b, c]),
    answer: Math.abs(v1 - v2),
    unit: "cm³",
    hint: "두 입체도형의 부피를 각각 구해 큰 쪽에서 작은 쪽을 빼요.",
    explanation: `가 ${s} × ${s} × ${s} = ${v1} cm³, 나 ${a} × ${b} × ${c} = ${v2} cm³ → 차 ${Math.abs(v1 - v2)} cm³`,
  };
});

export const volMaxCube = word("l6-vol-max-cube", (rand) => {
  const n = randInt(rand, 10, 200);
  const m = Math.floor(Math.cbrt(n + 0.5));
  if (m ** 3 === n) return null;
  return {
    key: `${n}`,
    prompt: `부피가 1 cm³인 쌓기나무 ${n}개로 가장 큰 정육면체를 만들려고 합니다. 정육면체의 한 모서리에 쌓기나무를 몇 개 놓게 되고, 쌓기나무는 몇 개 남나요?`,
    answer: `${m},${n - m ** 3}`,
    unit: ["개", "개"],
    hint: "□ × □ × □가 쌓기나무 수를 넘지 않는 가장 큰 □를 찾아요.",
    explanation: `${m} × ${m} × ${m} = ${m ** 3} ≤ ${n} < ${(m + 1) ** 3} → 한 모서리 ${m}개, 남는 쌓기나무 ${n - m ** 3}개`,
  };
});

/** 직육면체 겨냥도 한 개(270 × 200): 가로·세로·높이 글자(null이면 쓰지 않음) */
export function boxScene(d: number[], labels: (string | null)[], label: string, open = false): ShapeScene {
  // 뚜껑 없는 상자는 열린 곳 안쪽이 보이도록 깊이를 더 길게 그린다
  const [w, dep, h] = open ? fitLen(d, 100, 40) : fitLen(d, 116, 44);
  const b = cuboid([40, 172], w, h, dep * (open ? 0.8 : 0.55), true, open);
  return compose(270, 200, label, b, { texts: boxLabels(b, labels[0], labels[1], labels[2]) });
}

export const volHeight = mid("l6-vol-height", (rand) => {
  const [a, b, c] = [randInt(rand, 2, 12), randInt(rand, 2, 12), randInt(rand, 2, 12)];
  return {
    key: `${a}:${b}:${c}`,
    prompt: `그림과 같은 직육면체의 부피는 ${a * b * c} cm³입니다. □ 안에 알맞은 수를 구하세요.`,
    visual: boxScene([a, b, c], [`${a} cm`, `${b} cm`, "□ cm"], `가로 ${a} cm, 세로 ${b} cm, 높이 □ cm인 직육면체`),
    answer: c,
    unit: "cm",
    hint: "높이 = 부피 ÷ (가로 × 세로)",
    explanation: `${a * b * c} ÷ (${a} × ${b}) = ${c}(cm)`,
  };
});

export const volCubeEdge = mid("l6-vol-cube-edge", (rand) => {
  const s = randInt(rand, 2, 12);
  return {
    key: `${s}`,
    prompt: `부피가 ${s ** 3} cm³인 정육면체의 한 모서리의 길이는 몇 cm인가요?`,
    answer: s,
    unit: "cm",
    hint: "같은 수를 세 번 곱해 부피가 되는 수를 찾아요.",
    explanation: `${s} × ${s} × ${s} = ${s ** 3}이므로 ${s} cm`,
  };
});

/** 직육면체의 앞 오른쪽 모퉁이를 위에서 아래까지 잘라 낸 입체(보이는 면만 종이색으로 칠해 겹치게 그린다) */
function lShapeScene(A: number, B: number, H: number, a: number, b: number): ShapeScene {
  const s = Math.min(16, 196 / (A + 0.48 * B), 140 / (H + 0.36 * B));
  const o: Pt = [44, 186];
  const P = (x: number, y: number, z: number): Pt => [o[0] + x * s + y * s * 0.48, o[1] - z * s - y * s * 0.36];
  const face = (pts: [number, number, number][]) => ({ points: pts.map(([x, y, z]) => P(x, y, z)).map(([x, y]): Pt => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]), fill: "paper" as const });
  const cut = A - a;
  const polygons = [
    face([[A, b, 0], [A, B, 0], [A, B, H], [A, b, H]]),
    face([[cut, b, 0], [A, b, 0], [A, b, H], [cut, b, H]]),
    face([[cut, 0, 0], [cut, b, 0], [cut, b, H], [cut, 0, H]]),
    face([[0, 0, 0], [cut, 0, 0], [cut, 0, H], [0, 0, H]]),
    face([[0, 0, H], [cut, 0, H], [cut, b, H], [A, b, H], [A, B, H], [0, B, H]]),
  ];
  const c = P(A / 2, B / 2, H / 2);
  const texts = [
    labelOut(P(0, 0, 0), P(0, 0, H), c, `${H} cm`),
    labelOut(P(0, B, H), P(A, B, H), c, `${A} cm`),
    labelOut(P(A, b, 0), P(A, B, 0), c, `${B - b} cm`),
    labelOut(P(0, 0, 0), P(cut, 0, 0), c, `${cut} cm`),
    labelOut(P(0, 0, H), P(0, B, H), c, `${B} cm`),
  ];
  return compose(300, 206, `한 모퉁이를 잘라 낸 직육면체: 전체 가로 ${A} cm, 세로 ${B} cm, 높이 ${H} cm`, { polygons, texts });
}

export const volLShape = word("l6-vol-lshape", (rand) => {
  const A = randInt(rand, 6, 12);
  const B = randInt(rand, 5, 10);
  const H = randInt(rand, 3, 8);
  const a = randInt(rand, 2, A - 3);
  const b = randInt(rand, 2, B - 3);
  if (new Set([A, B, H, A - a, B - b]).size < 5) return null;
  const v = A * B * H - a * b * H;
  return {
    key: `${A}:${B}:${H}:${a}:${b}`,
    prompt: "직육면체의 한 모퉁이를 위에서 아래까지 잘라 내어 그림과 같은 입체도형을 만들었습니다. 이 입체도형의 부피는 몇 cm³인가요?",
    visual: lShapeScene(A, B, H, a, b),
    answer: v,
    unit: "cm³",
    hint: "잘라 내기 전 큰 직육면체의 부피에서 잘라 낸 직육면체의 부피를 빼요. 잘라 낸 부분의 가로와 세로는 전체 길이에서 빼서 구해요.",
    explanation: `잘라 낸 부분: 가로 ${A} − ${A - a} = ${a}(cm), 세로 ${B} − ${B - b} = ${b}(cm) → ${A} × ${B} × ${H} − ${a} × ${b} × ${H} = ${A * B * H} − ${a * b * H} = ${v}(cm³)`,
  };
});

export const m3Volume = easy("l6-m3-volume", (rand) => {
  const [a, b, c] = [randInt(rand, 1, 9), randInt(rand, 1, 9), randInt(rand, 1, 9)];
  return {
    key: `${a}:${b}:${c}`,
    prompt: "그림과 같은 직육면체의 부피는 몇 m³인가요?",
    visual: boxScene([a, b, c], [`${a} m`, `${b} m`, `${c} m`], `가로 ${a} m, 세로 ${b} m, 높이 ${c} m인 직육면체`),
    answer: a * b * c,
    unit: "m³",
    hint: "부피 = (가로) × (세로) × (높이)",
    explanation: `${a} × ${b} × ${c} = ${a * b * c}(m³)`,
  };
});

export const m3Mixed = mid("l6-m3-mixed", (rand) => {
  const dims = [pick(rand, [50, 100, 150, 200, 250, 300]), randInt(rand, 1, 5), pick(rand, [100, 200, 300, 400])];
  const v = (dims[0] / 100) * dims[1] * (dims[2] / 100);
  return {
    key: dims.join(),
    prompt: "그림과 같은 직육면체의 부피는 몇 m³인가요?",
    visual: boxScene([dims[0] / 100, dims[1], dims[2] / 100], [`${dims[0]} cm`, `${dims[1]} m`, `${dims[2]} cm`], `가로 ${dims[0]} cm, 세로 ${dims[1]} m, 높이 ${dims[2]} cm인 직육면체`),
    answer: trim(v),
    unit: "m³",
    hint: "길이의 단위를 모두 m로 바꾸어 계산해요. 100 cm = 1 m",
    explanation: `${trim(dims[0] / 100)} × ${dims[1]} × ${trim(dims[2] / 100)} = ${trim(v)}(m³)`,
  };
});

/** 나 상자는 cm로: 한 길이만 50 cm 단위라 부피가 소수 한 자리를 넘지 않는다 */
export const m3Compare = word("l6-m3-compare", (rand) => {
  const [a, b, c] = [randInt(rand, 1, 4), randInt(rand, 1, 4), randInt(rand, 1, 3)];
  const [x, y] = [pick(rand, [100, 200, 300]), pick(rand, [100, 200, 300])];
  const z = pick(rand, [50, 150, 250]);
  const v1 = a * b * c;
  const v2 = (x * y * z) / 1000000;
  if (v1 === v2) return null;
  return {
    key: `${a}:${b}:${c}:${x}:${y}:${z}`,
    prompt: "두 상자 가와 나의 부피의 차는 몇 m³인가요?",
    visual: twoBoxes([a, b, c], [x / 100, y / 100, z / 100], [`${a} m`, `${b} m`, `${c} m`], [`${x} cm`, `${y} cm`, `${z} cm`], "상자 가(m 단위)와 나(cm 단위)"),
    answer: trim(Math.abs(v1 - v2)),
    unit: "m³",
    hint: "나 상자의 길이를 m로 바꾸어 부피를 구해요. 100 cm = 1 m",
    explanation: `가 ${a} × ${b} × ${c} = ${v1} m³, 나 ${trim(x / 100)} × ${trim(y / 100)} × ${trim(z / 100)} = ${trim(v2)} m³ → 차 ${trim(Math.abs(v1 - v2))} m³`,
  };
});

export const m3Boxes = word("l6-m3-boxes", (rand) => {
  const [a, b, c] = [randInt(rand, 1, 6), randInt(rand, 1, 6), randInt(rand, 1, 4)];
  return {
    key: `${a}:${b}:${c}`,
    prompt: `가로 ${a} m, 세로 ${b} m, 높이 ${c} m인 창고에 한 모서리가 50 cm인 정육면체 모양 상자를 빈틈없이 쌓으려고 합니다. 상자는 모두 몇 개 쌓을 수 있나요?`,
    answer: 8 * a * b * c,
    unit: "개",
    hint: "1 m에 50 cm짜리 상자가 2개씩 들어가요.",
    explanation: `${2 * a} × ${2 * b} × ${2 * c} = ${8 * a * b * c}(개)`,
    mistakes: { [a * b * c]: "1 m에 상자가 2개씩 들어가는 것을 빠뜨렸어요." },
  };
});

/** 직육면체의 전개도(가로 a, 세로 b, 높이 c cm): 윗면 위쪽에 가로, 윗면 왼쪽에 세로, 옆면 왼쪽에 높이 */
export function cuboidNetScene(a: number, b: number, c: number, labels: [string | null, string | null, string | null]): ShapeScene {
  const s = Math.min(14, 300 / (2 * a + 2 * b), 190 / (c + 2 * b));
  const [A, B, C] = [a * s, b * s, c * s];
  const o: Pt = [44, 28];
  const net = cuboidNet(o, A, B, C);
  const center: Pt = [o[0] + B + A / 2, o[1] + B + C / 2];
  const texts: NonNullable<ShapeScene["texts"]> = [];
  if (labels[0]) texts.push(labelOut(net.top[0], net.top[1], center, labels[0]));
  if (labels[1]) texts.push(labelOut(net.top[3], net.top[0], [center[0] + 40, center[1]], labels[1]));
  if (labels[2]) texts.push(labelOut(net.left[0], net.left[3], center, labels[2]));
  return compose(Math.round(o[0] + 2 * A + 2 * B + 16), Math.round(o[1] + 2 * B + C + 14), `가로 ${a} cm, 세로 ${b} cm, 높이 ${c} cm인 직육면체의 전개도`, net, { texts });
}

export const surfHeight = mid("l6-surf-height", (rand) => {
  const [a, b, c] = [randInt(rand, 2, 10), randInt(rand, 2, 10), randInt(rand, 2, 10)];
  const S = 2 * (a * b + b * c + c * a);
  return {
    key: `${a}:${b}:${c}`,
    prompt: `겉넓이가 ${S} cm²인 직육면체의 전개도입니다. □ 안에 알맞은 수를 구하세요.`,
    visual: cuboidNetScene(a, b, c, [`${a} cm`, `${b} cm`, "□ cm"]),
    answer: c,
    unit: "cm",
    hint: "(겉넓이) = (한 밑면의 넓이) × 2 + (옆면의 넓이의 합)이고, 옆면을 이으면 가로가 밑면의 둘레, 세로가 높이인 직사각형이에요.",
    explanation: `${S} − ${a * b} × 2 = ${S - 2 * a * b}, 밑면의 둘레 ${2 * (a + b)} cm → ${S - 2 * a * b} ÷ ${2 * (a + b)} = ${c}(cm)`,
  };
});

export const surfOpenBox = word("l6-surf-open-box", (rand) => {
  const [a, b, c] = [randInt(rand, 3, 15), randInt(rand, 3, 15), randInt(rand, 3, 12)];
  // 높이가 세로에 비해 너무 낮으면 열린 곳으로 바닥 모서리까지 보여 그림이 복잡해진다
  if (c < b * 0.6) return null;
  const S = 2 * (a * b + b * c + c * a) - a * b;
  return {
    key: `${a}:${b}:${c}`,
    prompt: "그림과 같은 뚜껑 없는 직육면체 모양 상자의 바깥쪽에 색종이를 겹치지 않게 붙이려고 합니다. 필요한 색종이의 넓이는 몇 cm²인가요?",
    visual: boxScene([a, b, c], [`${a} cm`, `${b} cm`, `${c} cm`], `가로 ${a} cm, 세로 ${b} cm, 높이 ${c} cm인 뚜껑 없는 상자(윗면이 열려 있어 속이 보임)`, true),
    answer: S,
    unit: "cm²",
    hint: "겉넓이에서 뚜껑(윗면)의 넓이를 빼요.",
    explanation: `${2 * (a * b + b * c + c * a)} − ${a * b} = ${S}(cm²)`,
    mistakes: { [S + a * b]: "뚜껑까지 넣어 계산했어요." },
  };
});
