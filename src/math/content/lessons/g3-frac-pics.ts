import { randInt, shuffle } from "../../lib/random";
import { COMPARE_CHOICES, sign } from "../generators/common";
import { scene, type Pt } from "./g3-figures";
import { BASIC_FIG_WEIGHT, figGen, fj, fracBar, fracLabel, numberLine, tenths, valueChoices } from "./frac-dec-figs";

/**
 * 3학년 분수·소수 그림 유형(R2b): 분수 막대로 크기 비교, 수직선 위 분수·소수, 10칸 막대로 소수 비교.
 * 3학년은 약분하지 않고, 가분수·대분수는 3-2에서 배운다.
 */

const f = (n: number, d: number) => `${n}/${d}`;
const CMP_HINT = "색칠한 부분이 더 긴 쪽이 더 큰 수예요.";

/** 위아래 두 분수 막대와 왼쪽 세로 분수 글자 */
function twoBars(label: string, rows: { n: number; d: number; shaded: number }[]) {
  return scene(
    300,
    116,
    label,
    ...rows.flatMap((r, i) => [fracBar(70, 16 + i * 56, 210, 30, r.d, r.shaded), fracLabel(34, 31 + i * 56, r.n, r.d)]),
  );
}

/* ── 3-1 분모가 같은 분수의 크기 비교 ── */

export const fracBarCompare = figGen("l3-fbar-cmp", 1, (rand) => {
  const d = randInt(rand, 3, 10);
  const a = randInt(rand, 1, d - 1);
  let b = a;
  if (rand() >= 0.15) while (b === a) b = randInt(rand, 1, d - 1);
  const answer = sign(a, b);
  return {
    key: `${d}:${a}:${b}`,
    prompt: "그림을 보고 ○ 안에 >, =, < 중 알맞은 것을 고르세요.",
    expression: `${f(a, d)} ○ ${f(b, d)}`,
    visual: twoBars(`똑같이 ${d}칸으로 나눈 막대 2개에 ${a}칸, ${b}칸 색칠`, [
      { n: a, d, shaded: a },
      { n: b, d, shaded: b },
    ]),
    answer,
    choices: COMPARE_CHOICES,
    hint: CMP_HINT,
    explanation: `${fj(f(a, d), "은/는")} 1/${d}이 ${a}개, ${fj(f(b, d), "은/는")} 1/${d}이 ${b}개이므로 ${f(a, d)} ${answer} ${f(b, d)}`,
  };
}, BASIC_FIG_WEIGHT);

/* ── 3-1 단위분수의 크기 비교 ── */

export const unitBarCompare = figGen("l3-fbar-unit", 1, (rand) => {
  const [d1, d2] = shuffle(rand, [2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, 2);
  const answer = sign(1 / d1, 1 / d2);
  return {
    key: `${d1}:${d2}`,
    prompt: "길이가 같은 막대를 똑같이 나누어 한 칸씩 색칠했습니다. 그림을 보고 ○ 안에 >, =, < 중 알맞은 것을 고르세요.",
    expression: `${f(1, d1)} ○ ${f(1, d2)}`,
    visual: twoBars(`길이가 같은 막대를 ${d1}칸, ${d2}칸으로 나누어 한 칸씩 색칠`, [
      { n: 1, d: d1, shaded: 1 },
      { n: 1, d: d2, shaded: 1 },
    ]),
    answer,
    choices: COMPARE_CHOICES,
    hint: "똑같이 나눈 칸 수가 많을수록 한 칸의 크기는 작아요.",
    explanation: `${d1 < d2 ? d1 : d2}칸으로 나눈 한 칸이 더 크므로 ${f(1, d1)} ${answer} ${f(1, d2)}`,
    mistakes: { [sign(d1, d2)]: "분모가 클수록 단위분수는 작아요." },
  };
}, BASIC_FIG_WEIGHT);

/* ── 3-1 소수 ── */

export const decimalLine = figGen("l3-dec-line1", 1, (rand) => {
  const k = randInt(rand, 1, 9);
  const line = { x0: 30, y: 62, step: 24, ticks: 10, major: 10, mid: 5 };
  return {
    key: `${k}`,
    prompt: "0과 1 사이를 똑같이 10칸으로 나눈 수직선입니다. ㉠에 알맞은 소수를 쓰세요.",
    // 그림 설명에 눈금 위치(정답)를 넣지 않는다
    visual: scene(300, 96, "0부터 1까지 10칸으로 나눈 수직선과 ㉠", numberLine({ ...line, labels: [{ at: 0, text: "0" }, { at: 10, text: "1" }], marks: [{ at: k, text: "㉠" }] })),
    answer: tenths(k),
    hint: "작은 눈금 한 칸은 1을 똑같이 10으로 나눈 것 중 하나이므로 0.1이에요.",
    explanation: `㉠은 0에서 작은 눈금 ${k}칸 → 0.1이 ${k}개 → ${tenths(k)}`,
    mistakes: { [k]: "0.1이 몇 개인지 센 수를 소수로 나타내야 해요." },
  };
});

export const decimalLine3 = figGen("l3-dec-line3", 2, (rand) => {
  const w = randInt(rand, 0, 2);
  const t = randInt(rand, 1, 9);
  const v = w * 10 + t;
  const line = { x0: 26, y: 62, step: 8, ticks: 30, major: 10, mid: 5 };
  return {
    key: `${v}`,
    prompt: "수직선에서 ㉠이 나타내는 소수를 쓰세요.",
    visual: scene(292, 96, `0부터 3까지 0.1씩 눈금을 그린 수직선과 ㉠`, numberLine({ ...line, labels: [0, 1, 2, 3].map((n) => ({ at: n * 10, text: String(n) })), marks: [{ at: v, text: "㉠" }] })),
    answer: tenths(v),
    hint: "0과 1, 1과 2, 2와 3 사이가 각각 10칸이므로 작은 눈금 한 칸은 0.1이에요. ㉠ 바로 왼쪽에 쓰인 수에서부터 세어 보세요.",
    explanation: `㉠은 ${w}에서 0.1씩 ${t}칸 더 간 곳 → ${tenths(v)}`,
    mistakes: { [`${w + 1}.${t}`]: `${w}에서부터 세어야 해요.`, ...(w > 0 ? { [tenths(t)]: "소수점 왼쪽의 수도 써야 해요." } : {}) },
  };
});

export const decimalBarCompare = figGen("l3-dec-bar-cmp", 1, (rand) => {
  const [a, b] = shuffle(rand, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 2);
  const answer = sign(a, b);
  return {
    key: `${a}:${b}`,
    prompt: "막대 하나의 크기는 1이고 똑같이 10칸으로 나누었습니다. 그림을 보고 ○ 안에 >, =, < 중 알맞은 것을 고르세요.",
    expression: `${tenths(a)} ○ ${tenths(b)}`,
    visual: scene(300, 104, `10칸 막대 2개에 ${a}칸, ${b}칸 색칠`, ...[a, b].flatMap((n, i) => [fracBar(70, 14 + i * 50, 210, 30, 10, n), { texts: [{ at: [34, 29 + i * 50] as Pt, text: tenths(n) }] }])),
    answer,
    choices: COMPARE_CHOICES,
    hint: "0.1이 몇 개인지 색칠한 칸을 세어 비교해요.",
    explanation: `${fj(tenths(a), "은/는")} 0.1이 ${a}개, ${fj(tenths(b), "은/는")} 0.1이 ${b}개 → ${tenths(a)} ${answer} ${tenths(b)}`,
  };
}, BASIC_FIG_WEIGHT);

/* ── 3-2 여러 가지 분수 ── */

/** 0부터 W까지 한 칸이 1/d인 수직선(폭 240)과 ㉠ */
function fracLine(d: number, W: number, k: number) {
  const step = Math.round((240 / (d * W)) * 10) / 10;
  return scene(
    300,
    96,
    `0부터 ${W}까지 1을 ${d}칸으로 나눈 수직선과 ㉠`,
    numberLine({ x0: 30, y: 62, step, ticks: d * W, major: d, labels: Array.from({ length: W + 1 }, (_, n) => ({ at: n * d, text: String(n) })), marks: [{ at: k, text: "㉠" }] }),
  );
}

/** 1보다 크고 자연수가 아닌 눈금(분자) */
const overOne = (rand: () => number, d: number, W: number) => {
  let k = randInt(rand, d + 1, d * W - 1);
  while (k % d === 0) k = randInt(rand, d + 1, d * W - 1);
  return k;
};

export const improperLine = figGen("l3-fline-improper", 1, (rand) => {
  const d = randInt(rand, 2, 6);
  const W = d <= 4 ? 3 : 2;
  const k = overOne(rand, d, W);
  const answer = f(k, d);
  return {
    key: `${d}:${k}`,
    prompt: "수직선에서 ㉠이 나타내는 분수를 가분수로 나타낸 것을 고르세요.",
    visual: fracLine(d, W, k),
    answer,
    choices: valueChoices(rand, answer, [f(k, d * W), f(k + 1, d), f(k - 1, d), f(d, k)], () => f(randInt(rand, d + 1, d * W), d)),
    hint: `0과 1 사이가 ${d}칸이므로 작은 눈금 한 칸은 1/${d}이에요. 0에서 몇 칸인지 세어 보세요.`,
    explanation: `㉠은 0에서 1/${d}씩 ${k}칸 → ${answer}`,
    mistakes: { [f(k, d * W)]: `분모는 1을 똑같이 나눈 칸 수(${d})예요.` },
  };
}, BASIC_FIG_WEIGHT);

export const mixedBars = figGen("l3-fbar-mixed", 1, (rand) => {
  const d = randInt(rand, 3, 8);
  const w = randInt(rand, 1, 2);
  const r = randInt(rand, 1, d - 1);
  const answer = `${w} ${f(r, d)}`;
  return {
    key: `${d}:${w}:${r}`,
    prompt: "막대 하나의 크기가 1입니다. 색칠한 부분을 대분수로 나타낸 것을 고르세요.",
    visual: scene(300, (w + 1) * 40 + 12, `${d}칸으로 나눈 막대 ${w + 1}개, 막대 ${w}개는 모두, 마지막 막대는 ${r}칸 색칠`, ...Array.from({ length: w + 1 }, (_, i) => fracBar(20, 12 + i * 40, 260, 26, d, i < w ? d : r))),
    answer,
    choices: valueChoices(rand, answer, [`${w} ${f(d - r, d)}`, `${w + 1} ${f(r, d)}`, `${w} ${f(r, d * (w + 1))}`, f(r, d)], () => `${w} ${f(randInt(rand, 1, d - 1), d)}`),
    hint: "모두 색칠한 막대는 1씩, 남은 막대는 색칠한 칸 수를 분수로 나타내요.",
    explanation: `모두 색칠한 막대 ${w}개 → ${w}, 남은 막대 ${d}칸 중 ${r}칸 → ${f(r, d)} → ${answer}`,
    mistakes: { [`${w} ${f(d - r, d)}`]: "색칠하지 않은 칸을 세었어요." },
  };
});

export const mixedLine = figGen("l3-fline-mixed", 2, (rand) => {
  const d = randInt(rand, 2, 5);
  const k = overOne(rand, d, 3);
  const [w, r] = [Math.floor(k / d), k % d];
  const answer = `${w} ${f(r, d)}`;
  return {
    key: `${d}:${k}`,
    prompt: "수직선에서 ㉠이 나타내는 분수를 대분수로 나타낸 것을 고르세요.",
    visual: fracLine(d, 3, k),
    answer,
    choices: valueChoices(rand, answer, [`${w} ${f(r, d + 1)}`, `${w + 1} ${f(r, d)}`, `${w} ${f(d - r, d)}`, w > 1 ? `${w - 1} ${f(r, d)}` : f(r, d)], () => `${randInt(rand, 1, 2)} ${f(randInt(rand, 1, d - 1), d)}`),
    hint: `㉠ 바로 왼쪽의 자연수를 찾고, 거기서 1/${d}씩 몇 칸 더 갔는지 세어 보세요.`,
    explanation: `㉠은 ${w}에서 1/${d}씩 ${r}칸 더 간 곳 → ${answer}`,
    mistakes: { [`${w} ${f(d - r, d)}`]: `${w}에서부터 오른쪽으로 세어야 해요.` },
  };
});
