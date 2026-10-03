import type { ShapeScene } from "../types";
import { pick, randInt, shuffle } from "../../lib/random";
import { groupsScene } from "../generators/pictures";
import { ord } from "./g2-pics";
import {
  baseFill, betweenChoice, boxIneq, cardsNumber, coinCompare, condNumber, digitAt, easy, expandMissing, extremeNumber, hard as word, josa,
  mid, modelBundle, moneyJudge, multIneq, multOdd, multRead, multReverse, multSum, NAMES, notBase, opts, placeError, placeFind, readChoice,
  skipRule, skipSave, toBase, writeChoice,
} from "./g2";

/* ═══ 2-2 1. 네 자리 수 ═══ */

export const thousandFill = baseFill("l2-thousand-fill", 1000);
export const toThousand = toBase("l2-to-thousand", 1000);
export const thousandNot = notBase("l2-thousand-not", 1000);
export const thousandCoins = coinCompare("l2-thousand-coins", 1000);

export const thousandNeed = word("l2-thousand-need", (rand) => {
  const a = randInt(rand, 5, 8);
  const b = randInt(rand, 1, 9);
  const c = randInt(rand, 1, 9) * 10;
  const have = a * 100 + b * 10 + c;
  if (have >= 1000) return null;
  return {
    key: `${a}:${b}:${c}`,
    prompt: `색종이가 100장씩 ${a}묶음과 10장씩 ${b}묶음 있습니다. 친구에게 색종이 ${c}장을 더 받았습니다. 색종이가 1000장이 되려면 몇 장이 더 있어야 하나요?`,
    answer: 1000 - have,
    unit: "장",
    hint: "먼저 지금 가진 색종이가 몇 장인지 구해요.",
    explanation: `${a * 100 + b * 10} + ${c} = ${have}, 1000 − ${have} = ${1000 - have}(장)`,
    mistakes: { [1000 - a * 100 - b * 10]: "친구에게 받은 색종이도 더해야 해요." },
  };
});

export const thousandsRead = multRead("l2-thousands-read", 1000);
export const thousandsSum = multSum("l2-thousands-sum", 1000);
export const thousandsOdd = multOdd("l2-thousands-odd", 1000);
export const thousandsReverse = multReverse("l2-thousands-reverse", 1000);
export const thousandsIneq = multIneq("l2-thousands-ineq", 1000);

export const read4 = readChoice("l2-read4", 4);
export const write4 = writeChoice("l2-write4", 4);
export const bundle4 = modelBundle("l2-bundle4", 4);
export const cards4 = cardsNumber("l2-cards4", 4);
export const digit4 = digitAt("l2-digit4", 4);
export const expand4 = expandMissing("l2-expand4", 4);
export const placeFind4 = placeFind("l2-place-find4", 4);
export const cond4 = condNumber("l2-cond4", 4);
export const placeError4 = placeError("l2-place-error4", 4);
export const skipRule4 = skipRule("l2-skip-rule4", 4);
export const skipSave4 = skipSave("l2-skip-save4", 4);
export const extreme4 = extremeNumber("l2-extreme4", 4);
export const between4 = betweenChoice("l2-between4", 4);
export const boxIneq4 = boxIneq("l2-box-ineq4", 4);
export const money4j = moneyJudge("l2-money4", 4);

/* ═══ 2-2 2. 곱셈구구 ═══ */

type Dans = number[];
const tag = (dans: Dans) => dans.join("");

/** 곱셈구구 계산(하) */
export function ttCalc(dans: Dans) {
  return easy(`l2-tt-calc${tag(dans)}`, (rand) => {
    const a = pick(rand, dans);
    const b = randInt(rand, 1, 9);
    const dots = rand() < 0.3 && a <= 5;
    return {
      key: `${a}:${b}:${dots}`,
      prompt: dots ? "그림을 보고 곱셈식의 □ 안에 알맞은 수를 쓰세요." : "곱셈구구를 하세요.",
      expression: `${a} × ${b} = □`,
      visual: dots ? groupsScene(a, b) : undefined,
      answer: a * b,
      hint: `${a}단은 곱하는 수가 1씩 커질 때마다 ${a}씩 커져요.`,
      explanation: `${a} × ${b} = ${a * b}`,
      mistakes: { [a * (b - 1)]: `${a}만큼 모자라요.`, [a * (b + 1)]: `${a}만큼 더 많아요.`, [a + b]: "곱해야 하는데 더했어요." },
    };
  });
}

/** □ 구하기(중) */
export function ttMissing(dans: Dans) {
  return mid(`l2-tt-missing${tag(dans)}`, (rand) => {
    const a = pick(rand, dans);
    const b = randInt(rand, 2, 9);
    const left = rand() < 0.5;
    return {
      key: `${a}:${b}:${left}`,
      prompt: "□ 안에 알맞은 수를 써넣으세요.",
      expression: left ? `${a} × □ = ${a * b}` : `□ × ${a} = ${a * b}`,
      answer: b,
      hint: `${a}단 곱셈구구에서 곱이 ${a * b}인 것을 찾아요.`,
      explanation: `${a} × ${b} = ${a * b}`,
    };
  });
}

const TT_STORIES: ((a: number, b: number) => string)[] = [
  (a, b) => `한 봉지에 사탕이 ${a}개씩 들어 있습니다. ${b}봉지에 들어 있는 사탕은 모두 몇 개인가요?|개`,
  (a, b) => `한 모둠에 ${a}명씩 ${b}모둠이 있습니다. 학생은 모두 몇 명인가요?|명`,
  (a, b) => `꽃병 한 개에 꽃이 ${a}송이씩 꽂혀 있습니다. 꽃병 ${b}개에 꽂힌 꽃은 모두 몇 송이인가요?|송이`,
  (a, b) => `하루에 동화책을 ${a}쪽씩 ${b}일 동안 읽었습니다. 모두 몇 쪽을 읽었나요?|쪽`,
];

/** 한 단계 문장제(중) */
export function ttStory(dans: Dans) {
  return mid(`l2-tt-story${tag(dans)}`, (rand) => {
    const a = pick(rand, dans);
    const b = randInt(rand, 2, 9);
    const k = randInt(rand, 0, TT_STORIES.length - 1);
    const [prompt, unit] = TT_STORIES[k](a, b).split("|");
    return {
      key: `${k}:${a}:${b}`,
      prompt,
      answer: a * b,
      unit,
      hint: `${a}의 ${b}배를 곱셈구구로 구해요.`,
      explanation: `${a} × ${b} = ${a * b}(${unit})`,
      mistakes: { [a + b]: "곱해야 하는데 더했어요." },
    };
  });
}

/** 곱이 가장 큰/작은 식 고르기(중) */
export function ttExtreme(dans: Dans) {
  return mid(`l2-tt-extreme${tag(dans)}`, (rand) => {
    // 곱이 비슷한 식끼리 비교하게 한다(한 단의 식만 보고 답이 보이지 않게): 곱이 가까운 식 4개
    const all = dans.flatMap((d) => [2, 3, 4, 5, 6, 7, 8, 9].map((b) => [d, b] as const));
    const p = pick(rand, all);
    const span = dans.length > 1 ? 15 : dans[0] * 4;
    const near = shuffle(rand, all.filter(([a, b]) => a * b >= p[0] * p[1] && a * b <= p[0] * p[1] + span));
    const ps: (readonly [number, number])[] = [];
    for (const q of near) if (ps.length < 4 && !ps.some(([a, b]) => a * b === q[0] * q[1])) ps.push(q);
    if (ps.length < 4) return null;
    if (dans.length > 1 && dans.some((d) => !ps.some(([a]) => a === d))) return null;
    const vals = ps.map(([a, b]) => a * b);
    const big = rand() < 0.5;
    const t = big ? Math.max(...vals) : Math.min(...vals);
    const exprs = ps.map(([a, b]) => `${a} × ${b}`);
    return {
      key: `${exprs.join()}:${big}`,
      prompt: `곱이 가장 ${big ? "큰" : "작은"} 것을 고르세요.`,
      choices: shuffle(rand, exprs),
      answer: exprs[vals.indexOf(t)],
      hint: "곱셈구구로 곱을 구한 뒤 비교해요.",
      explanation: exprs.map((e, i) => `${e} = ${vals[i]}`).join(", "),
    };
  });
}

/** 문장에 알맞은 곱셈식 고르기(중) */
export function ttStoryChoice(dans: Dans) {
  return mid(`l2-tt-story-choice${tag(dans)}`, (rand) => {
    const a = pick(rand, dans);
    const b = randInt(rand, 2, 9);
    if (a === b) return null;
    const answer = `${a} × ${b}`;
    const choices = opts(rand, answer, [`${a} + ${b}`, `${a} × ${b + 1}`, `${b} × ${b}`, `${a} × ${a}`]);
    if (!choices) return null;
    return {
      key: `${a}:${b}`,
      prompt: `의자가 한 줄에 ${a}개씩 ${b}줄 놓여 있습니다. 의자의 수를 구하는 식으로 알맞은 것을 고르세요.`,
      choices,
      answer,
      hint: `${a}개씩 ${b}줄은 ${a}의 ${b}배예요.`,
      explanation: `${a} × ${b} = ${a * b}(개)`,
    };
  });
}

/** 두 사람 비교(상) */
export function ttCompare(dans: Dans) {
  return word(`l2-tt-compare${tag(dans)}`, (rand) => {
    const [n1, n2] = shuffle(rand, NAMES);
    const a = pick(rand, dans);
    const c = pick(rand, dans);
    const b = randInt(rand, 2, 9);
    const d = randInt(rand, 2, 9);
    if (a * b === c * d) return null;
    return {
      key: `${a}:${b}:${c}:${d}`,
      prompt: `${josa(n1, "은/는")} 한 상자에 ${a}개씩 들어 있는 구슬을 ${b}상자, ${josa(n2, "은/는")} 한 상자에 ${c}개씩 들어 있는 구슬을 ${d}상자 샀습니다. 구슬을 더 많이 산 사람은 몇 개 더 많이 샀나요?`,
      answer: Math.abs(a * b - c * d),
      unit: "개",
      hint: "두 사람이 산 구슬 수를 곱셈구구로 각각 구해요.",
      explanation: `${n1}: ${a} × ${b} = ${a * b}, ${n2}: ${c} × ${d} = ${c * d} → ${Math.abs(a * b - c * d)}개`,
    };
  });
}

/** a × □ > N 조건(상) */
export function ttIneq(dans: Dans) {
  return word(`l2-tt-ineq${tag(dans)}`, (rand) => {
    const a = pick(rand, dans);
    const n = randInt(rand, a + 1, a * 8);
    const greater = rand() < 0.5;
    const fits = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((x) => (greater ? a * x > n : a * x < n));
    if (fits.length < 1 || fits.length > 8) return null;
    const ask = pick(rand, ["edge", "count"] as const);
    const answer = ask === "count" ? fits.length : greater ? Math.min(...fits) : Math.max(...fits);
    return {
      key: `${a}:${n}:${greater}:${ask}`,
      prompt: `1부터 9까지의 수 중에서 □ 안에 들어갈 수 있는 ${ask === "count" ? "수는 모두 몇 개인가요" : `가장 ${greater ? "작은" : "큰"} 수는 얼마인가요`}?`,
      expression: `${a} × □ ${greater ? ">" : "<"} ${n}`,
      answer,
      unit: ask === "count" ? "개" : undefined,
      hint: `${a}단 곱셈구구의 곱을 차례로 써 보고 ${josa(n, "과/와")} 비교해요.`,
      explanation: `□에 들어갈 수 있는 수: ${fits.join(", ")}`,
    };
  });
}

/** 곱해야 할 것을 더했다(상) */
export function ttWrong(dans: Dans) {
  return word(`l2-tt-wrong${tag(dans)}`, (rand) => {
    const a = pick(rand, dans);
    const x = randInt(rand, 2, 9);
    return {
      key: `${a}:${x}`,
      prompt: `어떤 수에 ${josa(a, "을/를")} 곱해야 할 것을 잘못하여 더했더니 ${josa(x + a, "이/가")} 되었습니다. 바르게 계산하면 얼마인가요?`,
      answer: a * x,
      hint: `먼저 어떤 수를 구해요: □ + ${a} = ${x + a}`,
      explanation: `어떤 수 = ${x + a} − ${a} = ${x}, 바른 계산: ${x} × ${a} = ${a * x}`,
      mistakes: { [x]: "어떤 수만 구했어요.", [(x + a) * a]: "어떤 수를 먼저 구해야 해요." },
    };
  });
}

/** 처음 양 구하기(상) */
export function ttReverse(dans: Dans) {
  return word(`l2-tt-reverse${tag(dans)}`, (rand) => {
    const a = pick(rand, dans);
    const b = randInt(rand, 2, 9);
    // 남은 사탕이 한 사람 몫보다 적어야 더 나누어 줄 수 없다
    const c = randInt(rand, 1, a - 1);
    return {
      key: `${a}:${b}:${c}`,
      prompt: `사탕을 친구 ${b}명에게 ${a}개씩 나누어 주었더니 ${c}개가 남았습니다. 처음에 있던 사탕은 몇 개인가요?`,
      answer: a * b + c,
      unit: "개",
      hint: "나누어 준 사탕 수를 곱셈구구로 구한 뒤 남은 것을 더해요.",
      explanation: `${a} × ${b} = ${a * b}, ${a * b} + ${c} = ${a * b + c}(개)`,
      mistakes: { [a * b]: "남은 사탕도 더해야 해요.", [a * b - c]: "남은 사탕은 더해야 해요." },
    };
  });
}

/** 수 카드 넣어 곱 만들기(상) */
export function ttCards(dans: Dans) {
  return word(`l2-tt-cards${tag(dans)}`, (rand) => {
    const a = pick(rand, dans);
    const cards = shuffle(rand, [2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4);
    const n = randInt(rand, a * 3, a * 8);
    const under = cards.map((c) => a * c).filter((v) => v < n);
    if (!under.length) return null;
    const best = Math.max(...under);
    return {
      key: `${a}:${cards.join()}:${n}`,
      prompt: `수 카드 ${josa(cards.join(", "), "이/가")} 있습니다. ${a} × □의 □ 안에 수 카드 한 장을 넣어 곱을 만들 때, ${n}보다 작은 곱 중에서 가장 큰 곱은 얼마인가요?`,
      answer: best,
      hint: `카드마다 ${a} × □를 계산해 보세요.`,
      explanation: `${cards.map((c) => `${a} × ${c} = ${a * c}`).join(", ")} → ${best}`,
    };
  });
}

/** 친구의 곱셈구구 풀이 고치기(오류 분석, 상) */
export function ttError(dans: Dans) {
  return word(`l2-tt-error${tag(dans)}`, (rand) => {
    const a = pick(rand, dans);
    const b = randInt(rand, 3, 9);
    if (a === b) return null;
    const name = pick(rand, NAMES);
    const prev = a * (b - 1);
    const v = (x: number) => josa(x, "이에요/예요");
    const answer = `${a} × ${b - 1}에 ${josa(a, "을/를")} 더해야 해요. 바른 값은 ${v(a * b)}.`;
    const choices = opts(rand, answer, [
      `${a} × ${b - 1}에 ${josa(b, "을/를")} 더한 것이 맞아요. 값은 ${v(prev + b)}.`,
      `${a} × ${b - 1}에 ${josa(a, "을/를")} 더해야 해요. 바른 값은 ${v(a * b + a)}.`,
      `${a} × ${b - 1}에서 ${josa(a, "을/를")} 빼야 해요. 바른 값은 ${v(prev - a)}.`,
    ]);
    if (!choices) return null;
    return {
      key: `${a}:${b}:${name}`,
      prompt: `${josa(name, "은/는")} ${a} × ${josa(b, "을/를")} "${a} × ${b - 1} = ${prev}이니까 ${josa(b, "을/를")} 더하면 ${prev + b}"${josa(prev + b, "이라고/라고").slice(String(prev + b).length)} 구했습니다. 바르게 고친 것을 고르세요.`,
      choices,
      answer,
      hint: `${a}단은 곱하는 수가 1 커지면 곱이 ${a}만큼 커져요.`,
      explanation: `${a} × ${b - 1} = ${prev}, ${a} × ${josa(b, "은/는")} ${prev}보다 ${a} 큰 수 → ${prev} + ${a} = ${a * b}`,
    };
  });
}

export const tt25 = [ttCalc([2, 5]), ttMissing([2, 5]), ttStory([2, 5]), ttCompare([2, 5]), ttIneq([2, 5])];
export const tt36 = [ttCalc([3, 6]), ttMissing([3, 6]), ttExtreme([3, 6]), ttWrong([3, 6]), ttCards([3, 6])];
export const tt48 = [ttCalc([4, 8]), ttMissing([4, 8]), ttStoryChoice([4, 8]), ttReverse([4, 8]), ttCompare([4, 8])];
export const tt7 = [ttCalc([7]), ttMissing([7]), ttStory([7]), ttIneq([7]), ttWrong([7])];
export const tt9 = [ttCalc([9]), ttMissing([9]), ttExtreme([9]), ttCards([9]), ttError([9])];
const ALL = [2, 3, 4, 5, 6, 7, 8, 9];
export const ttAll = [ttCalc(ALL), ttStory(ALL), ttStoryChoice(ALL), ttError(ALL), ttReverse(ALL)];

export const zeroScore = mid("l2-zero-score", (rand) => {
  const a = randInt(rand, 1, 9);
  const b = randInt(rand, 1, 9);
  const name = pick(rand, NAMES);
  return {
    key: `${a}:${b}`,
    prompt: `${josa(name, "은/는")} 과녁 맞히기 놀이에서 0점에 ${a}번, 1점에 ${b}번 맞혔습니다. ${josa(name, "이/가")} 얻은 점수는 모두 몇 점인가요?`,
    answer: b,
    unit: "점",
    hint: "0 × □ = 0, 1 × □ = □예요.",
    explanation: `0 × ${a} = 0, 1 × ${b} = ${b}, 0 + ${b} = ${b}(점)`,
    mistakes: { [a + b]: "0점에 맞힌 것은 0점이에요." },
  };
});

export const zeroCompare = word("l2-zero-compare", (rand) => {
  const [n1, n2] = shuffle(rand, NAMES);
  const p = [randInt(rand, 1, 5), randInt(rand, 1, 5), randInt(rand, 1, 4)];
  const q = [randInt(rand, 1, 5), randInt(rand, 1, 5), randInt(rand, 1, 4)];
  const s = (x: number[]) => x[1] + 2 * x[2];
  if (s(p) === s(q)) return null;
  const win = s(p) > s(q) ? n1 : n2;
  return {
    key: `${p.join()}:${q.join()}`,
    prompt: `과녁 맞히기 놀이를 했습니다. ${josa(n1, "은/는")} 0점에 ${p[0]}번, 1점에 ${p[1]}번, 2점에 ${p[2]}번 맞혔고, ${josa(n2, "은/는")} 0점에 ${q[0]}번, 1점에 ${q[1]}번, 2점에 ${q[2]}번 맞혔습니다. 이긴 사람은 몇 점 더 얻었나요?`,
    answer: Math.abs(s(p) - s(q)),
    unit: "점",
    hint: "점수 × 맞힌 횟수를 각각 구해 더해요. 0 × □ = 0이에요.",
    explanation: `${n1}: 0 × ${p[0]} = 0, 1 × ${p[1]} = ${p[1]}, 2 × ${p[2]} = ${2 * p[2]} → 0 + ${p[1]} + ${2 * p[2]} = ${s(p)}(점), ${n2}: 0 × ${q[0]} = 0, 1 × ${q[1]} = ${q[1]}, 2 × ${q[2]} = ${2 * q[2]} → 0 + ${q[1]} + ${2 * q[2]} = ${s(q)}(점) → ${josa(win, "이/가")} ${Math.abs(s(p) - s(q))}점 더`,
  };
});

/** 곱셈표 그림 */
function mulTable(rows: number[], cols: number[], blank?: [number, number]) {
  return {
    kind: "table" as const,
    header: ["×", ...cols.map(String)],
    rows: rows.map((r, i) => [String(r), ...cols.map((c, j) => (blank && blank[0] === i && blank[1] === j ? "□" : String(r * c)))]),
  };
}

export const chartCell = easy("l2-chart-cell", (rand) => {
  const r0 = randInt(rand, 2, 7);
  const c0 = randInt(rand, 2, 7);
  const rows = [r0, r0 + 1, r0 + 2];
  const cols = [c0, c0 + 1, c0 + 2];
  const i = randInt(rand, 0, 2);
  const j = randInt(rand, 0, 2);
  return {
    key: `${r0}:${c0}:${i}:${j}`,
    prompt: "곱셈표의 □ 안에 알맞은 수를 써넣으세요.",
    visual: mulTable(rows, cols, [i, j]),
    answer: rows[i] * cols[j],
    hint: "왼쪽 수와 위쪽 수를 곱해요.",
    explanation: `${rows[i]} × ${cols[j]} = ${rows[i] * cols[j]}`,
  };
});

export const chartSame = mid("l2-chart-same", (rand) => {
  const n = pick(rand, [4, 6, 8, 9, 12, 16, 18, 24, 36]);
  const count = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((a) => n % a === 0 && n / a <= 9).length;
  return {
    key: `${n}`,
    prompt: `1단부터 9단까지의 곱셈표에서 곱이 ${n}인 칸은 모두 몇 개인가요?`,
    answer: count,
    unit: "개",
    hint: `곱이 ${n}인 곱셈구구를 모두 찾아요. 3 × 4와 4 × 3은 다른 칸이에요.`,
    explanation: [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((a) => n % a === 0 && n / a <= 9).map((a) => `${a} × ${n / a}`).join(", ") + ` → ${count}개`,
  };
});

export const chartCond = word("l2-chart-cond", (rand) => {
  const [a, b] = shuffle(rand, [2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 2);
  const inA = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9].map((x) => a * x));
  const both = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((x) => b * x).filter((v) => inA.has(v));
  if (!both.length) return null;
  const big = rand() < 0.5;
  // 두 단에 모두 있는 수가 하나뿐이면 '가장 큰/작은'을 묻지 않는다(여러 개를 찾아야 하는 줄 알고 헤맨다)
  const one = both.length === 1;
  return {
    key: `${a}:${b}:${one || big}`,
    prompt: one
      ? `${a}단 곱셈구구의 곱이면서 ${b}단 곱셈구구의 곱인 수는 얼마인가요? (곱하는 수는 1부터 9까지)`
      : `${a}단 곱셈구구의 곱이면서 ${b}단 곱셈구구의 곱인 수 중에서 가장 ${big ? "큰" : "작은"} 수는 얼마인가요? (곱하는 수는 1부터 9까지)`,
    answer: one || big ? Math.max(...both) : Math.min(...both),
    hint: "두 단의 곱을 각각 써 보고 같은 수를 찾아요.",
    explanation: `두 단에 모두 있는 수: ${both.join(", ")}`,
  };
});

export const ttTwoStep = word("l2-tt-two-step", (rand) => {
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, 2, 9);
  const c = randInt(rand, 2, 9);
  const d = randInt(rand, 2, 9);
  return {
    key: `${a}:${b}:${c}:${d}`,
    prompt: `과일 가게에 사과가 한 상자에 ${a}개씩 ${b}상자, 배가 한 상자에 ${c}개씩 ${d}상자 있습니다. 사과와 배는 모두 몇 개인가요?`,
    answer: a * b + c * d,
    unit: "개",
    hint: "사과와 배의 수를 곱셈구구로 각각 구한 뒤 더해요.",
    explanation: `${a} × ${b} = ${a * b}, ${c} × ${d} = ${c * d}, ${a * b} + ${c * d} = ${a * b + c * d}(개)`,
  };
});

/* ═══ 2-2 3. 길이 재기(m) ═══ */

const mcm = (n: number) => `${Math.floor(n / 100)},${n % 100}`;
const fmt = (n: number) => (n % 100 ? `${Math.floor(n / 100)} m ${n % 100} cm` : `${n / 100} m`);

export const mCompare = mid("l2-m-compare", (rand) => {
  const base = randInt(rand, 1, 4);
  const vals = shuffle(rand, [base * 100 + randInt(rand, 1, 9) * 10, base * 100 + randInt(rand, 1, 9), base * 100 + randInt(rand, 10, 99), (base + 1) * 100 + randInt(rand, 0, 9)]);
  if (new Set(vals).size < 4) return null;
  const texts = vals.map((v, i) => (i % 2 ? `${v} cm` : v % 100 ? fmt(v) : `${v / 100} m`));
  const long = rand() < 0.5;
  const t = long ? Math.max(...vals) : Math.min(...vals);
  return {
    key: `${texts.join()}:${long}`,
    prompt: `가장 ${long ? "긴" : "짧은"} 길이를 고르세요.`,
    choices: shuffle(rand, texts),
    answer: texts[vals.indexOf(t)],
    hint: "모두 cm로 바꾸어 비교해요.",
    explanation: texts.map((x, i) => `${x} = ${vals[i]} cm`).join(", "),
  };
});

export const mIneq = word("l2-m-ineq", (rand) => {
  const m = randInt(rand, 1, 8);
  const ones = randInt(rand, 0, 9);
  const target = m * 100 + randInt(rand, 1, 8) * 10 + randInt(rand, 0, 9);
  const greater = rand() < 0.5;
  const fits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((x) => (greater ? m * 100 + x * 10 + ones > target : m * 100 + x * 10 + ones < target));
  if (fits.length < 1 || fits.length > 9) return null;
  return {
    key: `${m}:${ones}:${target}:${greater}`,
    prompt: `0부터 9까지의 수 중에서 □ 안에 들어갈 수 있는 수는 모두 몇 개인가요?`,
    expression: `${m}□${ones} cm ${greater ? ">" : "<"} ${fmt(target)}`,
    answer: fits.length,
    unit: "개",
    hint: `${fmt(target)}를 cm로 바꾸면 ${target} cm예요.`,
    explanation: `${fmt(target)} = ${target} cm, □: ${fits.join(", ")} → ${fits.length}개`,
  };
});

/** 줄자 그림: start부터 30 cm 구간, 끝점 end */
function tapeScene(start: number, end: number): ShapeScene {
  const u = 10;
  const x0 = 14;
  return {
    kind: "shape",
    width: x0 * 2 + u * 30,
    height: 92,
    label: `줄자, 물건의 끝이 ${end} cm 눈금`,
    polygons: [{ fill: true, points: [[x0, 12], [x0 + (end - start) * u, 12], [x0 + (end - start) * u, 30], [x0, 30]] }, { points: [[x0, 40], [x0 + u * 30, 40], [x0 + u * 30, 62], [x0, 62]] }],
    lines: Array.from({ length: 31 }, (_, i) => ({ from: [x0 + i * u, 40] as [number, number], to: [x0 + i * u, (start + i) % 10 === 0 ? 56 : (start + i) % 5 === 0 ? 51 : 47] as [number, number], width: 1 })),
    texts: Array.from({ length: 4 }, (_, i) => ({ at: [x0 + ((10 - (start % 10)) % 10 + i * 10) * u, 78] as [number, number], text: String(start + ((10 - (start % 10)) % 10) + i * 10) })).filter((t) => t.at[0] <= x0 + u * 30),
  };
}

export const tapeRead = easy("l2-tape-read", (rand) => {
  const start = randInt(rand, 10, 19) * 10;
  const end = start + randInt(rand, 3, 27);
  return {
    key: `${start}:${end}`,
    prompt: `줄자의 눈금 0을 책상의 한쪽 끝에 맞추고 재었습니다. 그림은 책상의 다른 쪽 끝 부분입니다. 책상의 길이는 몇 m 몇 cm인가요?`,
    visual: tapeScene(start, end),
    answer: mcm(end),
    unit: ["m", "cm"],
    hint: "끝이 가리키는 눈금을 읽고, 100 cm를 1 m로 바꿔요.",
    explanation: `${end} cm = ${fmt(end)}`,
  };
});

export const tapeError = word("l2-tape-error", (rand) => {
  const k = randInt(rand, 1, 3);
  const c = randInt(rand, 1, 9);
  const name = pick(rand, NAMES);
  const answer = `${k} m ${c} cm = ${k * 100 + c} cm예요. 1 m는 100 cm이기 때문이에요.`;
  const choices = opts(rand, answer, [`${k} m ${c} cm = ${k}${c} cm가 맞아요.`, `${k} m ${c} cm = ${k * 10 + c} cm예요. 1 m는 10 cm이기 때문이에요.`, `${k} m ${c} cm = ${k * 100 + c * 10} cm예요. 1 m는 100 cm이기 때문이에요.`]);
  if (!choices) return null;
  return {
    key: `${k}:${c}:${name}`,
    prompt: `${josa(name, "은/는")} ${k} m ${c} cm를 ${k}${c} cm라고 썼습니다. 바르게 고친 것을 고르세요.`,
    choices,
    answer,
    hint: "1 m = 100 cm예요. 몇 cm를 더하는지 살펴보세요.",
    explanation: `${k} m = ${k * 100} cm, ${k * 100} + ${c} = ${k * 100 + c}(cm)`,
  };
});

export const bodyLength = word("l2-body-length", (rand) => {
  const name = pick(rand, NAMES);
  const arm = randInt(rand, 110, 145);
  const d = randInt(rand, 2, 9);
  const h = arm + (rand() < 0.5 ? d : -d);
  const sum = arm + h;
  return {
    key: `${arm}:${h}`,
    prompt: `${josa(name, "이/가")} 양팔을 벌린 길이는 ${fmt(arm)}이고, 키는 양팔을 벌린 길이보다 ${d} cm ${h > arm ? "더 큽니다" : "더 작습니다"}. ${name}의 키와 양팔을 벌린 길이의 합은 몇 m 몇 cm인가요?`,
    answer: mcm(sum),
    unit: ["m", "cm"],
    hint: "먼저 키를 구한 뒤 두 길이를 더해요. m는 m끼리, cm는 cm끼리 더해요.",
    explanation: `키: ${fmt(h)}, 합: ${fmt(arm)} + ${fmt(h)} = ${fmt(sum)}`,
  };
});

export const mAddCards = word("l2-m-add-cards", (rand) => {
  const cards = shuffle(rand, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3);
  const d = [...cards].sort((x, y) => y - x);
  const long = d[0] * 100 + d[1] * 10 + d[2];
  const short = d[2] * 100 + d[1] * 10 + d[0];
  const sum = long + short;
  if ((long % 100) + (short % 100) >= 100) return null;
  return {
    key: cards.join(""),
    prompt: `수 카드 ${josa(cards.join(", "), "을/를")} 한 번씩만 사용하여 □ m □□ cm를 만들려고 합니다. 만들 수 있는 가장 긴 길이와 가장 짧은 길이의 합은 몇 m 몇 cm인가요?`,
    answer: mcm(sum),
    unit: ["m", "cm"],
    hint: "m 자리에 가장 큰(작은) 수를 놓아요.",
    explanation: `${fmt(long)} + ${fmt(short)} = ${fmt(sum)}`,
  };
});

export const mSub = easy("l2-m-sub", (rand) => {
  const a = randInt(rand, 3, 9);
  const c = randInt(rand, 1, a - 1);
  const b = randInt(rand, 20, 99);
  // cm끼리 뺀 값이 0이 되지 않게(답 '3 m 0 cm')
  const d = randInt(rand, 10, b - 1);
  return {
    key: `${a}:${b}:${c}:${d}`,
    prompt: "계산해 보세요.",
    expression: `${a} m ${b} cm − ${c} m ${d} cm = □ m □ cm`,
    answer: `${a - c},${b - d}`,
    unit: ["m", "cm"],
    hint: "m는 m끼리, cm는 cm끼리 빼요.",
    explanation: `${a - c} m ${b - d} cm`,
  };
});

export const mSubMissing = mid("l2-m-sub-missing", (rand) => {
  const a = randInt(rand, 3, 8) * 100 + randInt(rand, 40, 99);
  const b = randInt(rand, 1, 2) * 100 + randInt(rand, 10, (a % 100) - 1);
  return {
    key: `${a}:${b}`,
    prompt: "□ 안에 알맞은 길이를 구하세요.",
    expression: `${fmt(a)} − □ m □ cm = ${fmt(a - b)}`,
    answer: mcm(b),
    unit: ["m", "cm"],
    hint: "처음 길이에서 남은 길이를 빼면 뺀 길이가 나와요.",
    explanation: `${fmt(a)} − ${fmt(a - b)} = ${fmt(b)}`,
  };
});

export const mSubWrong = word("l2-m-sub-wrong", (rand) => {
  const x = randInt(rand, 3, 6) * 100 + randInt(rand, 40, 60);
  const y = randInt(rand, 1, 2) * 100 + randInt(rand, 10, 39);
  return {
    key: `${x}:${y}`,
    prompt: `어떤 길이에서 ${fmt(y)}를 빼야 할 것을 잘못하여 더했더니 ${fmt(x + y)}가 되었습니다. 바르게 계산하면 몇 m 몇 cm인가요?`,
    answer: mcm(x - y),
    unit: ["m", "cm"],
    hint: `먼저 어떤 길이를 구해요: □ + ${fmt(y)} = ${fmt(x + y)}`,
    explanation: `어떤 길이 = ${fmt(x)}, 바른 계산: ${fmt(x)} − ${fmt(y)} = ${fmt(x - y)}`,
    mistakes: { [mcm(x)]: "어떤 길이만 구했어요." },
  };
});

const M_OBJECTS: [string, number][] = [["교실 문의 높이", 2], ["칠판의 긴 쪽", 4], ["버스의 길이", 10], ["줄넘기 줄의 길이", 2], ["기린의 키", 5], ["농구 골대의 높이", 3], ["수영장의 긴 쪽", 25]];

export const mEstObject = easy("l2-m-est-object", (rand) => {
  const [thing, v] = pick(rand, M_OBJECTS);
  const answer = `약 ${v} m`;
  const choices = opts(rand, answer, [`약 ${v} cm`, `약 ${v * 10} m`, `약 ${v * 10} cm`]);
  if (!choices) return null;
  return {
    key: `${thing}:${choices.join()}`,
    prompt: `${josa(thing, "은/는")} 얼마쯤일까요? 알맞은 것을 고르세요.`,
    choices,
    answer,
    hint: "1 m는 어른 한 걸음이나 양팔을 벌린 길이쯤이에요.",
    explanation: `${josa(thing, "은/는")} ${answer}쯤이에요.`,
  };
});

export const mEstClosest = mid("l2-m-est-closest", (rand) => {
  const real = randInt(rand, 3, 9) * 100 + randInt(rand, 0, 9) * 10;
  const names = shuffle(rand, NAMES).slice(0, 4);
  const offs = shuffle(rand, [10, 20, 30, 40, 50, 60]).slice(0, 4);
  const g = offs.map((o) => real + (rand() < 0.5 ? o : -o));
  const best = names[offs.indexOf(Math.min(...offs))];
  return {
    key: `${real}:${g.join()}`,
    prompt: `실제 길이가 ${fmt(real)}인 밧줄을 보고 어림한 길이입니다. 실제 길이에 가장 가깝게 어림한 사람은 누구인가요? ${names.map((n, i) => `${n}: 약 ${fmt(g[i])}`).join(", ")}`,
    choices: shuffle(rand, names),
    answer: best,
    hint: "어림한 길이와 실제 길이의 차가 가장 작은 사람을 찾아요.",
    explanation: names.map((n, i) => `${n} ${offs[i]} cm 차이`).join(", "),
  };
});

export const mEstJudge = word("l2-m-est-judge", (rand) => {
  const [n1, n2] = shuffle(rand, NAMES);
  const real = randInt(rand, 2, 6) * 100 + randInt(rand, 10, 90);
  // 실제 길이와 150 cm 안쪽인 어림값 중 둘(드물게 조건이 바닥나 생성에 실패하지 않게 후보에서 고른다)
  const near = [200, 300, 400, 500, 600, 700].filter((g) => Math.abs(real - g) <= 150);
  if (near.length < 2) return null;
  const [g1, g2] = shuffle(rand, near);
  const d1 = Math.abs(real - g1);
  const d2 = Math.abs(real - g2);
  if (d1 === d2 || g1 === g2 || d1 > 150 || d2 > 150) return null;
  return {
    key: `${real}:${g1}:${g2}`,
    prompt: `${josa(n1, "은/는")} 게시판의 긴 쪽을 약 ${g1 / 100} m, ${josa(n2, "은/는")} 약 ${g2 / 100} m로 어림했습니다. 실제로 재어 보니 ${fmt(real)}였습니다. 더 가깝게 어림한 사람의 어림한 길이와 실제 길이의 차는 몇 cm인가요?`,
    answer: Math.min(d1, d2),
    unit: "cm",
    hint: "모두 cm로 바꾸어 차를 구해 비교해요.",
    explanation: `${n1}: ${d1} cm, ${n2}: ${d2} cm → ${Math.min(d1, d2)} cm`,
    mistakes: { [Math.max(d1, d2)]: "차가 더 큰 사람을 골랐어요." },
  };
});

/* ═══ 2-2 4. 시각과 시간 ═══ */

const hm = (t: number) => {
  const h = Math.floor(t / 60) % 12 || 12;
  return `${h},${t % 60}`;
};
const hmText = (t: number) => `${Math.floor(t / 60) % 12 || 12}시${t % 60 ? ` ${t % 60}분` : ""}`;

export const clockOrder = word("l2-clock-order", (rand) => {
  const names = shuffle(rand, NAMES).slice(0, 4);
  const times = shuffle(rand, Array.from({ length: 20 }, (_, i) => 6 * 60 + 20 + i * 5)).slice(0, 4);
  const first = rand() < 0.5;
  const t = first ? Math.min(...times) : Math.max(...times);
  return {
    key: `${names.join()}:${times.join()}:${first}`,
    prompt: `네 사람이 아침에 일어난 시각입니다. 가장 ${first ? "일찍" : "늦게"} 일어난 사람은 누구인가요? ${names.map((n, i) => `${n}: ${hmText(times[i])}`).join(", ")}`,
    choices: shuffle(rand, names),
    answer: names[times.indexOf(t)],
    hint: "먼저 '시'를 비교하고, 같으면 '분'을 비교해요.",
    explanation: names.map((n, i) => `${n} ${hmText(times[i])}`).join(", "),
  };
});

export const clock1Where = mid("l2-clock1-where", (rand) => {
  const h = randInt(rand, 1, 12);
  const k = randInt(rand, 1, 10);
  const j = randInt(rand, 1, 4);
  const m = 5 * k + j;
  const say = (a: number, b: number) => `숫자 ${a}에서 작은 눈금 ${b}칸 더 간 곳`;
  const choices = opts(rand, say(k, j), [say(k + 1, j), say(j, k > 4 ? 1 : k), say(k, 5 - j === j ? 4 : 5 - j), say(k - 1 || 11, j)]);
  if (!choices) return null;
  return {
    key: `${h}:${m}`,
    prompt: `${h}시 ${m}분을 나타낼 때 긴바늘이 가리키는 곳을 고르세요.`,
    choices,
    answer: say(k, j),
    hint: `${m}분은 5분이 몇 번이고 몇 분이 더 있는지 생각해요.`,
    explanation: `${m} = ${5 * k} + ${j} → 숫자 ${k}에서 ${j}칸 더`,
  };
});

export const clockCond = word("l2-clock-cond", (rand) => {
  const h = randInt(rand, 1, 10);
  const k = randInt(rand, 1, 9);
  const j = randInt(rand, 1, 4);
  const add = randInt(rand, 5, 20);
  const t = h * 60 + 5 * k + j + add;
  if (5 * k + j + add >= 60) return null;
  return {
    key: `${h}:${k}:${j}:${add}`,
    prompt: `짧은바늘은 숫자 ${josa(h, "과/와")} ${h + 1} 사이를 가리키고, 긴바늘은 숫자 ${k}에서 작은 눈금으로 ${j}칸 더 간 곳을 가리킵니다. 이 시각에서 ${add}분 후는 몇 시 몇 분인가요?`,
    answer: hm(t),
    unit: ["시", "분"],
    hint: "먼저 지금 시각을 읽은 뒤 분을 더해요.",
    explanation: `지금 ${h}시 ${5 * k + j}분 → ${add}분 후 ${hmText(t)}`,
  };
});

export const beforeMinutes = mid("l2-before-minutes", (rand) => {
  const h = randInt(rand, 1, 11);
  const m = randInt(rand, 9, 11) * 5 + pick(rand, [0, 2, 4]);
  if (m >= 60) return null;
  return {
    key: `${h}:${m}`,
    prompt: `${h}시 ${m}분은 ${h + 1}시 몇 분 전인가요?`,
    answer: 60 - m,
    unit: "분",
    hint: `${h + 1}시까지 몇 분이 남았는지 생각해요.`,
    explanation: `60 − ${m} = ${60 - m} → ${h + 1}시 ${60 - m}분 전`,
  };
});

export const dayHours = easy("l2-day-hours", (rand) => {
  const kind = randInt(rand, 0, 1);
  const c = randInt(rand, 1, 23);
  return kind
    ? { key: `a:${c}`, prompt: "□ 안에 알맞은 수를 써넣으세요.", expression: `1일 ${c}시간 = □시간`, answer: 24 + c, hint: "하루는 24시간이에요.", explanation: `24 + ${c} = ${24 + c}(시간)` }
    : { key: `b:${c}`, prompt: "□ 안에 알맞은 수를 써넣으세요.", expression: `${24 + c}시간 = □일 □시간`, answer: `1,${c}`, unit: ["일", "시간"], hint: "24시간이 1일이에요.", explanation: `${24 + c}시간 = 24시간 + ${c}시간 = 1일 ${c}시간` };
});

const AMPM_OK = ["오전 7시에 일어나요.", "오후 1시에 점심을 먹어요.", "오후 9시에 잠을 자요.", "오전 8시 30분에 학교에 가요.", "오후 6시에 저녁을 먹어요."];
const AMPM_BAD = ["오후 7시에 아침을 먹어요.", "오전 1시에 점심을 먹어요.", "오전 9시에 저녁을 먹어요.", "오후 8시에 학교에 가요.", "오전 6시에 저녁을 먹어요."];

export const ampmChoice = mid("l2-ampm-choice", (rand) => {
  const ok = rand() < 0.5;
  const answer = pick(rand, ok ? AMPM_OK : AMPM_BAD);
  const choices = opts(rand, answer, shuffle(rand, ok ? AMPM_BAD : AMPM_OK));
  if (!choices) return null;
  return {
    key: `${ok}:${choices.join()}`,
    prompt: `오전과 오후를 ${ok ? "알맞게" : "알맞지 않게"} 말한 것을 고르세요.`,
    choices,
    answer,
    hint: "전날 밤 12시부터 낮 12시까지가 오전, 낮 12시부터 밤 12시까지가 오후예요.",
    explanation: answer,
  };
});

/** 오전 7시~오후 7시 시간 띠: 한 칸이 1시간, 색칠한 두 부분이 한 일 */
function timeBandScene(blocks: { from: number; to: number; text: string }[]): ShapeScene {
  const [first, last, cell, x0, top, bottom] = [7, 19, 30, 20, 30, 62];
  const x = (h: number) => x0 + (h - first) * cell;
  const box = (h1: number, h2: number, fill?: boolean) => ({ fill, points: [[x(h1), top], [x(h2), top], [x(h2), bottom], [x(h1), bottom]] as [number, number][] });
  const hours = Array.from({ length: last - first + 1 }, (_, i) => first + i);
  return {
    kind: "shape",
    width: x(last) + x0,
    height: 90,
    label: `시간 띠(오전 7시~오후 7시): ${blocks.map((b) => `${b.text} ${b.from < 12 ? "오전" : "오후"} ${b.from % 12 || 12}시~${b.to <= 12 ? "오전" : "오후"} ${b.to % 12 || 12}시`).join(", ")}`,
    polygons: [box(first, last), ...blocks.map((b) => box(b.from, b.to, true))],
    // 칸 경계는 위·아래 짧은 눈금으로만 그려 가운데 글자(한 일)와 겹치지 않게 한다.
    // 낮 12시 눈금은 굵기로만 구별하고 길이는 같게(길면 12시에 걸친 한 일 글자에 닿는다)
    lines: hours.flatMap((h) => {
      const [len, width] = h === 12 ? [7, 3] : [7, 1.5];
      return [
        { from: [x(h), top] as [number, number], to: [x(h), top + len] as [number, number], width },
        { from: [x(h), bottom - len] as [number, number], to: [x(h), bottom] as [number, number], width },
      ];
    }),
    texts: [
      { at: [(x(first) + x(12)) / 2, 16], text: "오전" },
      { at: [(x(12) + x(last)) / 2, 16], text: "오후" },
      ...hours.map((h) => ({ at: [x(h), 78] as [number, number], text: String(h % 12 || 12) })),
      ...blocks.map((b) => ({ at: [x((b.from + b.to) / 2), (top + bottom) / 2] as [number, number], text: b.text })),
    ],
  };
}

const BAND_ACTS = ["수영", "독서", "공부", "산책", "청소"];

/** 시간 띠를 보고 오전·오후에 걸친 시간 구하기(상) */
export const ampmBand = word("l2-ampm-band", (rand) => {
  const [act1, act2] = shuffle(rand, BAND_ACTS);
  const s1 = randInt(rand, 7, 8);
  const e1 = s1 + randInt(rand, 2, 3);
  if (e1 > 10) return null;
  const s2 = randInt(rand, e1 + 1, 11);
  const e2 = randInt(rand, 13, 16);
  const len2 = e2 - s2;
  const total = e1 - s1 + len2;
  const name = pick(rand, NAMES);
  const noNoon = e1 - s1 + Math.abs(e2 - 12 - s2);
  return {
    key: `${act1}:${act2}:${s1}:${e1}:${s2}:${e2}`,
    prompt: `${josa(name, "이/가")} 토요일에 한 일을 시간 띠에 나타냈습니다. ${josa(act1, "과/와")} ${josa(act2, "을/를")} 한 시간은 모두 몇 시간인가요?`,
    visual: timeBandScene([
      { from: s1, to: e1, text: act1 },
      { from: s2, to: e2, text: act2 },
    ]),
    answer: total,
    unit: "시간",
    hint: "시간 띠 한 칸은 1시간이에요. 낮 12시를 지나는 부분은 12시 전과 후로 나누어 세어요.",
    explanation: `${act1}: 오전 ${s1}시~오전 ${e1}시 → ${e1 - s1}시간, ${act2}: 오전 ${s2}시~오후 ${e2 - 12}시 → ${12 - s2}시간 + ${e2 - 12}시간 = ${len2}시간, ${e1 - s1} + ${len2} = ${total}(시간)`,
    mistakes: noNoon === total ? undefined : { [noNoon]: "낮 12시를 지나는 것을 생각해야 해요." },
  };
});

export const ampmElapsed = mid("l2-ampm-elapsed", (rand) => {
  const a = randInt(rand, 7, 11);
  const b = randInt(rand, 1, 6);
  const act = pick(rand, BAND_ACTS);
  return {
    key: `${a}:${b}:${act}`,
    prompt: `${josa(act, "을/를")} 한 시간을 시간 띠에 나타냈습니다. 오전 ${a}시부터 오후 ${b}시까지는 몇 시간인가요?`,
    visual: timeBandScene([{ from: a, to: 12 + b, text: act }]),
    answer: 12 - a + b,
    unit: "시간",
    hint: "낮 12시를 기준으로 나누어 세어요.",
    explanation: `오전 ${a}시~낮 12시: ${12 - a}시간, 낮 12시~오후 ${b}시: ${b}시간 → ${12 - a + b}시간`,
    mistakes: { [Math.abs(b - a)]: "낮 12시를 지나는 것을 생각해야 해요." },
  };
});

/** 시간 띠를 보고 한 일을 한 시간 구하기(낮 12시를 지나지 않음) */
export const dayBand = easy("l2-day-band", (rand) => {
  const act = pick(rand, BAND_ACTS);
  const am = rand() < 0.5;
  const s = am ? randInt(rand, 7, 9) : randInt(rand, 12, 15);
  const e = s + randInt(rand, 2, am ? 12 - s : 19 - s);
  if (e > (am ? 12 : 19)) return null;
  const say = (h: number) => (h === 12 ? "낮 12시" : `${h < 12 ? "오전" : "오후"} ${h % 12}시`);
  return {
    key: `${act}:${s}:${e}`,
    prompt: `시간 띠에 ${josa(act, "을/를")} 한 시간을 색칠했습니다. 시간 띠 한 칸은 1시간입니다. ${josa(act, "을/를")} 몇 시간 동안 했나요?`,
    visual: timeBandScene([{ from: s, to: e, text: act }]),
    answer: e - s,
    unit: "시간",
    hint: "색칠한 칸의 수를 세어요. 한 칸이 1시간이에요.",
    explanation: `${say(s)}부터 ${say(e)}까지 ${e - s}칸 → ${e - s}시간`,
  };
});

export const dayReverse = word("l2-day-reverse", (rand) => {
  const s = randInt(rand, 8, 11);
  const m = randInt(rand, 0, 5) * 10;
  const d = randInt(rand, 2, 5);
  const e = s + d;
  if (e <= 12) return null;
  return {
    key: `${s}:${m}:${d}`,
    prompt: `체험 학습을 ${d}시간 동안 하고 오후 ${hmText((e - 12) * 60 + m)}에 마쳤습니다. 체험 학습을 시작한 시각은 오전 몇 시 몇 분인가요?`,
    answer: `${s},${m}`,
    unit: ["시", "분"],
    hint: `오후 ${hmText((e - 12) * 60 + m)}에서 ${d}시간 전으로 거꾸로 가요. 낮 12시를 지나요.`,
    explanation: `오후 ${hmText((e - 12) * 60 + m)}의 ${d}시간 전 → 오전 ${hmText(s * 60 + m)}`,
  };
});

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const weekDays = easy("l2-week-days", (rand) => {
  const kind = randInt(rand, 0, 1);
  const w = randInt(rand, 1, 4);
  const r = randInt(rand, 1, 6);
  return kind
    ? { key: `a:${w}:${r}`, prompt: "□ 안에 알맞은 수를 써넣으세요.", expression: `${w}주일 ${r}일 = □일`, answer: 7 * w + r, hint: "1주일은 7일이에요.", explanation: `${Array(w).fill(7).join(" + ")} + ${r} = ${7 * w + r}(일)` }
    : { key: `b:${w}:${r}`, prompt: "□ 안에 알맞은 수를 써넣으세요.", expression: `${7 * w + r}일 = □주일 □일`, answer: `${w},${r}`, unit: ["주일", "일"], hint: "7일씩 묶어 세어요.", explanation: `${7 * w + r}일 = ${w}주일 ${r}일` };
});

export const monthDays = mid("l2-month-days", (rand) => {
  const m = pick(rand, [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const next = rand() < 0.4;
  return next
    ? {
        key: `n:${m}`,
        prompt: `${m}월의 마지막 날의 다음 날은 몇 월 며칠인가요?`,
        answer: `${m === 12 ? 1 : m + 1},1`,
        unit: ["월", "일"],
        hint: "달마다 날수가 달라요. 마지막 날 다음 날은 다음 달 1일이에요.",
        explanation: `${m}월 ${MONTH_DAYS[m - 1]}일 다음 날 → ${m === 12 ? 1 : m + 1}월 1일`,
      }
    : {
        key: `d:${m}`,
        prompt: `${m}월은 며칠까지 있나요?`,
        answer: MONTH_DAYS[m - 1],
        unit: "일",
        hint: "주먹을 쥐고 손등의 튀어나온 곳은 31일, 들어간 곳은 30일(2월 제외)이에요.",
        explanation: `${m}월은 ${MONTH_DAYS[m - 1]}일까지 있어요.`,
      };
});

export const calendarSpan = word("l2-calendar-span", (rand) => {
  const m = pick(rand, [1, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const d = randInt(rand, MONTH_DAYS[m - 1] - 8, MONTH_DAYS[m - 1]);
  const e = randInt(rand, 1, 10);
  const total = MONTH_DAYS[m - 1] - d + 1 + e;
  return {
    key: `${m}:${d}:${e}`,
    prompt: `${m}월 ${d}일부터 ${m + 1}월 ${e}일까지 날마다 줄넘기를 했습니다. 줄넘기를 한 날은 모두 며칠인가요?`,
    answer: total,
    unit: "일",
    hint: `${m}월은 ${MONTH_DAYS[m - 1]}일까지 있어요. 시작한 날과 끝난 날도 세어요.`,
    explanation: `${m}월: ${MONTH_DAYS[m - 1] - d + 1}일, ${m + 1}월: ${e}일 → ${total}일`,
    mistakes: { [total - 1]: "시작한 날도 세어야 해요." },
  };
});

/* ═══ 2-2 5. 표와 그래프 ═══ */

const SPORTS = ["축구", "줄넘기", "피구", "달리기", "수영"];

function survey(rand: () => number, min = 1, max = 7) {
  const kinds = shuffle(rand, SPORTS).slice(0, 4);
  const vals = kinds.map(() => randInt(rand, min, max));
  return { kinds, vals, total: vals.reduce((a, b) => a + b, 0) };
}

const tableOf = (kinds: string[], cells: string[], total?: string) => ({
  kind: "table" as const,
  header: ["운동", ...kinds, ...(total ? ["합계"] : [])],
  rows: [["학생 수(명)", ...cells, ...(total ? [total] : [])]],
});

export const tableTotal = mid("l2-table-total", (rand) => {
  const { kinds, vals, total } = survey(rand);
  const hide = randInt(rand, 0, 3);
  return {
    key: `${kinds.join()}:${vals.join()}:${hide}`,
    prompt: `좋아하는 운동을 조사하여 나타낸 표입니다. ${josa(kinds[hide], "을/를")} 좋아하는 학생은 몇 명인가요?`,
    visual: tableOf(kinds, vals.map((v, i) => (i === hide ? "□" : String(v))), String(total)),
    answer: vals[hide],
    unit: "명",
    hint: "합계에서 나머지 학생 수를 빼요.",
    explanation: `${total} − ${vals.filter((_, i) => i !== hide).join(" − ")} = ${vals[hide]}(명)`,
  };
});

export const tableTwoBlank = word("l2-table-two-blank", (rand) => {
  const { kinds, vals, total } = survey(rand, 2, 8);
  const [i, j] = shuffle(rand, [0, 1, 2, 3]);
  const d = vals[i] - vals[j];
  if (d <= 0) return null;
  return {
    key: `${kinds.join()}:${vals.join()}:${i}:${j}`,
    prompt: `표에서 ${josa(kinds[i], "을/를")} 좋아하는 학생(㉠)은 ${josa(kinds[j], "을/를")} 좋아하는 학생(㉡)보다 ${d}명 더 많습니다. ㉠은 몇 명인가요?`,
    visual: tableOf(kinds, vals.map((v, k) => (k === i ? "㉠" : k === j ? "㉡" : String(v))), String(total)),
    answer: vals[i],
    unit: "명",
    hint: `먼저 ㉠과 ㉡을 합한 수를 구해요. 그 다음 ㉠이 ㉡보다 ${d} 많은 두 수를 찾아요.`,
    explanation: `㉠ + ㉡ = ${vals[i] + vals[j]}, ㉠ − ㉡ = ${d} → ㉠ = ${vals[i]}, ㉡ = ${vals[j]}`,
  };
});

export const graphRows = mid("l2-graph-rows", (rand) => {
  const { kinds, vals } = survey(rand, 2, 9);
  const max = Math.max(...vals);
  return {
    key: `${kinds.join()}:${vals.join()}`,
    prompt: `표를 보고 ○를 한 칸에 하나씩 그려 그래프로 나타내려고 합니다. 학생 수를 나타내는 칸은 적어도 몇 칸이 있어야 하나요?`,
    visual: tableOf(kinds, vals.map(String)),
    answer: max,
    unit: "칸",
    hint: "가장 많은 학생 수만큼 칸이 있어야 해요.",
    explanation: `가장 많은 수가 ${max}명이므로 ${max}칸`,
  };
});

export const graphCond = word("l2-graph-cond", (rand) => {
  const kinds = shuffle(rand, SPORTS).slice(0, 4);
  const a = randInt(rand, 2, 7);
  const b = randInt(rand, 2, 7);
  const y = randInt(rand, 1, 5);
  const d = randInt(rand, 1, 3);
  const x = y + d;
  const total = a + b + x + y;
  return {
    key: `${kinds.join()}:${a}:${b}:${x}:${y}`,
    prompt: `${total}명이 좋아하는 운동을 조사했습니다. ${josa(kinds[0], "은/는")} ${a}명, ${josa(kinds[1], "은/는")} ${b}명이고, ${josa(kinds[2], "을/를")} 좋아하는 학생은 ${josa(kinds[3], "을/를")} 좋아하는 학생보다 ${d}명 더 많습니다. ${josa(kinds[2], "을/를")} 좋아하는 학생은 몇 명인가요?`,
    answer: x,
    unit: "명",
    hint: `${josa(kinds[2], "과/와")} ${kinds[3]}의 학생 수의 합을 먼저 구해요.`,
    explanation: `${kinds[2]} + ${kinds[3]} = ${total} − ${a} − ${b} = ${x + y}, 차가 ${d}인 두 수 → ${x}, ${y}`,
  };
});

export const graphTwoClass = word("l2-graph-two-class", (rand) => {
  const kinds = shuffle(rand, SPORTS).slice(0, 3);
  const c1 = kinds.map(() => randInt(rand, 1, 8));
  const c2 = kinds.map(() => randInt(rand, 1, 8));
  const sum = c1.map((v, i) => v + c2[i]);
  if (new Set(sum).size < 3) return null;
  const max = Math.max(...sum);
  return {
    key: `${kinds.join()}:${c1.join()}:${c2.join()}`,
    prompt: "1반과 2반 학생들이 좋아하는 운동을 조사한 표입니다. 두 반을 합하여 가장 많은 학생이 좋아하는 운동은 모두 몇 명이 좋아하나요?",
    visual: { kind: "table", header: ["반", ...kinds], rows: [["1반", ...c1.map(String)], ["2반", ...c2.map(String)]] },
    answer: max,
    unit: "명",
    hint: "운동마다 두 반의 학생 수를 더해 비교해요.",
    explanation: kinds.map((k, i) => `${k} ${sum[i]}명`).join(", "),
  };
});

/* ═══ 2-2 6. 규칙 찾기 ═══ */

export const addTableCell = easy("l2-addtable-cell", (rand) => {
  const r0 = randInt(rand, 1, 6);
  const c0 = randInt(rand, 1, 6);
  const rows = [r0, r0 + 1, r0 + 2];
  const cols = [c0, c0 + 1, c0 + 2];
  const i = randInt(rand, 0, 2);
  const j = randInt(rand, 0, 2);
  return {
    key: `${r0}:${c0}:${i}:${j}`,
    prompt: "덧셈표의 규칙을 찾아 □ 안에 알맞은 수를 써넣으세요.",
    visual: { kind: "table", header: ["+", ...cols.map(String)], rows: rows.map((r, a) => [String(r), ...cols.map((c, b) => (a === i && b === j ? "□" : String(r + c)))]) },
    answer: rows[i] + cols[j],
    hint: "왼쪽 수와 위쪽 수를 더해요. 오른쪽으로 갈수록 1씩 커져요.",
    explanation: `${rows[i]} + ${cols[j]} = ${rows[i] + cols[j]}`,
  };
});

export const addTableNext = mid("l2-addtable-next", (rand) => {
  const dir = pick(rand, [["→", 1], ["↓", 1], ["↘", 2]] as const);
  const a = randInt(rand, 2, 10);
  const seq = [a, a + dir[1], a + 2 * dir[1]];
  return {
    key: `${dir[0]}:${a}`,
    prompt: `덧셈표에서 ${dir[0]} 방향으로 놓인 수입니다. 규칙에 따라 □ 안에 알맞은 수를 쓰세요.`,
    expression: `${seq.join(", ")}, □`,
    answer: a + 3 * dir[1],
    hint: `덧셈표에서 ${dir[0]} 방향으로는 ${dir[1]}씩 커져요.`,
    explanation: `${dir[1]}씩 커지므로 ${a + 2 * dir[1]} + ${dir[1]} = ${a + 3 * dir[1]}`,
  };
});

export const addTableCount = word("l2-addtable-count", (rand) => {
  const n = randInt(rand, 3, 17);
  const count = Math.min(n - 1, 19 - n);
  return {
    key: `${n}`,
    prompt: `1부터 9까지의 수로 만든 덧셈표(왼쪽 수 1~9, 위쪽 수 1~9)에서 합이 ${josa(n, "이/가")} 되는 칸은 모두 몇 개인가요?`,
    answer: count,
    unit: "개",
    hint: `더해서 ${josa(n, "이/가")} 되는 두 수를 차례로 찾아요. 순서가 다르면 다른 칸이에요.`,
    explanation: `${Array.from({ length: 9 }, (_, i) => i + 1).filter((a) => n - a >= 1 && n - a <= 9).map((a) => `${a} + ${n - a}`).join(", ")} → ${count}개`,
  };
});

export const addTableNth = word("l2-addtable-nth", (rand) => {
  const a = randInt(rand, 1, 5);
  // 1~9 덧셈표 안의 칸만: a + (n − 1) ≤ 9
  const n = randInt(rand, 4, 10 - a);
  return {
    key: `${a}:${n}`,
    prompt: `덧셈표에서 ${a} + ${a} = ${2 * a}부터 ↘ 방향으로 수를 차례로 늘어놓았습니다. ${ord(n)} 수는 얼마인가요?`,
    expression: `${2 * a}, ${2 * a + 2}, ${2 * a + 4}, …`,
    answer: 2 * a + 2 * (n - 1),
    hint: "↘ 방향으로 가면 왼쪽 수와 위쪽 수가 모두 1씩 커지므로 2씩 커져요.",
    explanation: `${2 * a}에서 2씩 ${n - 1}번 커짐 → ${2 * a + 2 * (n - 1)}`,
  };
});

export const mulTableFirst = word("l2-multable-first", (rand) => {
  const k = randInt(rand, 2, 9);
  const n = randInt(rand, k + 1, k * 8);
  const idx = Math.floor(n / k) + 1;
  if (idx > 9) return null;
  return {
    key: `${k}:${n}`,
    prompt: `곱셈표에서 ${k}단의 곱을 ${k}, ${2 * k}, ${3 * k}, …처럼 차례로 늘어놓았습니다. 처음으로 ${n}보다 커지는 수는 몇 번째 수인가요?`,
    answer: idx,
    unit: "번째",
    hint: `${k}씩 뛰어 세며 ${n}보다 커지는 곳을 찾아요.`,
    explanation: `${k} × ${idx} = ${k * idx} > ${n} → ${idx}번째`,
  };
});

const COLORS = ["빨강", "파랑", "노랑", "초록"];

export const patternColor = mid("l2-pattern-color", (rand) => {
  const len = randInt(rand, 2, 3);
  const unit = Array.from({ length: len + 1 }, () => pick(rand, COLORS.slice(0, 3)));
  if (new Set(unit).size < 2) return null;
  const n = randInt(rand, unit.length * 2 + 1, 15);
  const answer = unit[(n - 1) % unit.length];
  return {
    key: `${unit.join()}:${n}`,
    prompt: `구슬을 ${unit.join(", ")} 순서로 되풀이하여 꿰었습니다. ${ord(n)} 구슬은 무슨 색인가요?`,
    choices: COLORS,
    answer,
    hint: `${unit.length}개씩 되풀이돼요. 되풀이되는 묶음을 차례로 써 보세요.`,
    explanation: `${unit.length}개씩 되풀이되므로 ${ord(n)}는 묶음의 ${ord(((n - 1) % unit.length) + 1)}인 ${answer}입니다.`,
  };
});

export const patternCount = word("l2-pattern-count", (rand) => {
  const shapes = shuffle(rand, ["○", "△", "☆", "◇"]).slice(0, 2);
  const unit = [shapes[0], ...Array(randInt(rand, 1, 3)).fill(shapes[1])];
  const n = randInt(rand, 10, 24);
  const count = Array.from({ length: n }, (_, i) => unit[i % unit.length]).filter((x) => x === shapes[1]).length;
  return {
    key: `${unit.join("")}:${n}`,
    prompt: `${unit.join(" ")} 모양이 차례로 되풀이됩니다. 처음부터 ${ord(n)}까지 놓았을 때 ${shapes[1]} 모양은 모두 몇 개인가요?`,
    answer: count,
    unit: "개",
    hint: `되풀이되는 묶음 하나에 ${shapes[1]} 모양이 ${unit.length - 1}개 있어요.`,
    explanation: `${Math.floor(n / unit.length)}묶음에 ${Math.floor(n / unit.length) * (unit.length - 1)}개, 나머지 ${n % unit.length}개 중 ${count - Math.floor(n / unit.length) * (unit.length - 1)}개 → ${count}개`,
  };
});

export const seatNumber = mid("l2-seat-number", (rand) => {
  const k = randInt(rand, 5, 9);
  const r = randInt(rand, 2, 5);
  const c = randInt(rand, 1, k);
  return {
    key: `${k}:${r}:${c}`,
    prompt: `공연장 의자에 한 줄에 ${k}개씩 1번부터 차례로 번호를 붙였습니다. 첫째 줄은 1번부터 ${k}번까지입니다. ${ord(r)} 줄의 ${ord(c)} 자리의 번호는 몇 번인가요?`,
    answer: k * (r - 1) + c,
    unit: "번",
    hint: `아래 줄로 가면 번호가 ${k}씩 커져요.`,
    explanation: `${ord(r - 1)} 줄의 마지막 번호는 ${k} × ${r - 1} = ${k * (r - 1)}(번) → ${k * (r - 1)} + ${c} = ${k * (r - 1) + c}(번)`,
  };
});

export const busTimes = mid("l2-bus-times", (rand) => {
  const h = randInt(rand, 7, 10);
  const g = pick(rand, [10, 15, 20]);
  const n = randInt(rand, 3, 4);
  const t = h * 60 + g * (n - 1);
  return {
    key: `${h}:${g}:${n}`,
    prompt: `버스가 오전 ${h}시에 첫차가 출발하고, ${g}분마다 한 대씩 출발합니다. ${n === 3 ? "셋째" : "넷째"} 버스가 출발하는 시각은 오전 몇 시 몇 분인가요?`,
    answer: `${Math.floor(t / 60)},${t % 60}`,
    unit: ["시", "분"],
    hint: `첫차 시각에 ${g}분씩 더해 가요.`,
    explanation: Array.from({ length: n }, (_, i) => hmText(h * 60 + g * i)).join(" → "),
  };
});

export const seatReverse = word("l2-seat-reverse", (rand) => {
  const k = randInt(rand, 5, 9);
  const r = randInt(rand, 2, 6);
  const c = randInt(rand, 1, k);
  const n = k * (r - 1) + c;
  return {
    key: `${k}:${n}`,
    prompt: `공연장 의자에 한 줄에 ${k}개씩 1번부터 차례로 번호를 붙였습니다. ${n}번 의자는 몇 번째 줄의 몇 번째 자리인가요?`,
    answer: `${r},${c}`,
    unit: ["번째 줄", "번째 자리"],
    hint: `${k}씩 뛰어 세어 ${josa(n, "이/가")} 몇 번째 줄에 있는지 찾아요.`,
    explanation: `${ord(r - 1)} 줄 끝은 ${k * (r - 1)}번 → ${n}번은 ${ord(r)} 줄 ${ord(c)} 자리`,
  };
});

export const calendarSameDay = word("l2-calendar-same-day", (rand) => {
  const d = randInt(rand, 1, 30);
  const lastDay = pick(rand, [30, 31]);
  const days = Array.from({ length: 5 }, (_, i) => ((d - 1) % 7) + 1 + 7 * i).filter((x) => x <= lastDay);
  return {
    key: `${d}:${lastDay}`,
    prompt: `${lastDay}일까지 있는 어느 달의 달력에서 ${d}일과 같은 요일인 날은 ${d}일을 포함하여 모두 몇 번 있나요?`,
    answer: days.length,
    unit: "번",
    hint: "같은 요일은 7일마다 돌아와요. 7씩 빼고 더해 보세요.",
    explanation: `${days.join(", ")}일 → ${days.length}번`,
  };
});

const SURVEY_OK = ["한 사람씩 좋아하는 것을 말하게 해요.", "붙임딱지를 붙여서 조사해요.", "손을 들게 하여 조사해요.", "종이에 적어서 모아요."];
const SURVEY_BAD = ["한 사람이 여러 번 손을 들게 해요.", "조사하지 않고 짐작해서 적어요.", "친한 친구에게만 물어봐요.", "좋아하는 것을 두 번씩 적게 해요."];

export const surveyMethod = mid("l2-survey-method", (rand) => {
  const answer = pick(rand, SURVEY_BAD);
  const choices = opts(rand, answer, shuffle(rand, SURVEY_OK));
  if (!choices) return null;
  return {
    key: `${answer}:${choices.join()}`,
    prompt: "우리 반 친구들이 좋아하는 운동을 조사하려고 합니다. 조사하는 방법으로 알맞지 않은 것을 고르세요.",
    choices,
    answer,
    hint: "모든 친구가 한 번씩, 정확하게 답하는 방법이 알맞아요.",
    explanation: `${answer} → 조사 결과가 정확하지 않아요.`,
  };
});

/** m·cm 덧셈 이야기(받아올림 없음) */
export const mAddStory = mid("l2-m-add-story", (rand) => {
  const a = randInt(rand, 1, 4) * 100 + randInt(rand, 10, 60);
  const b = randInt(rand, 1, 4) * 100 + randInt(rand, 5, 99 - (a % 100));
  return {
    key: `${a}:${b}`,
    prompt: `빨간 끈은 ${fmt(a)}, 파란 끈은 ${fmt(b)}입니다. 두 끈을 겹치지 않게 이으면 몇 m 몇 cm인가요?`,
    answer: mcm(a + b),
    unit: ["m", "cm"],
    hint: "m는 m끼리, cm는 cm끼리 더해요.",
    explanation: `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}`,
  };
});

