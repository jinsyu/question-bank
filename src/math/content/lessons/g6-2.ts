/** 6-2 차시별 생성기 */
import { shuffle } from "../../lib/random";
import { COMPARE_CHOICES } from "../generators/common";
import { lcm } from "../generators/grade5";
import type { ShapeScene } from "../types";
import { findTextSpot } from "../figure-check";
import { josa } from "../josa";
import { CIRCLED, LETTERS, below, circlePts, compose, cone, cylinder, cylinderNet, labelOut, layerBlock, lineup, row, sphere, stackBlock, text, topBlock, viewBlock, type Block, type Parts, type Place, type Pt, type SolidKind } from "./g6-figs";
import { cmpText, digitsDistinct, easy, fracOpts, gcd, j, jf, jp, mid, names, opts, pick, randInt, reduced, trim, won, word } from "./g6-util";
import { ord } from "../ordinal";

/* ── 6-2-1 분수의 나눗셈 ── */

/** 분모가 소수이면 진분수가 모두 기약분수 */
const PRIME_DEN = [5, 7, 11, 13];

const sameDen = (rand: () => number) => {
  const d = pick(rand, PRIME_DEN);
  const m = randInt(rand, 1, 4);
  const q = randInt(rand, 2, Math.max(2, Math.floor((d - 1) / m)));
  return { d, m, q, n: m * q };
};

export const sdDiv = easy("l6-sd-div", (rand) => {
  const { d, m, q, n } = sameDen(rand);
  return {
    key: `${n}/${d}:${m}`,
    prompt: "계산해 보세요.",
    expression: `${n}/${d} ÷ ${m}/${d} = □`,
    answer: q,
    hint: "분모가 같으면 분자끼리 나누어요.",
    explanation: `${n} ÷ ${m} = ${q}`,
  };
});

export const sdCount = mid("l6-sd-count", (rand) => {
  const { d, m, q, n } = sameDen(rand);
  const [item, u] = pick(rand, [["주스", "L"], ["밀가루", "kg"], ["리본", "m"]]);
  return {
    key: `${n}/${d}:${m}:${item}`,
    prompt: `${item} ${n}/${d} ${j(u, "를")} 한 사람에게 ${m}/${d} ${u}씩 나누어 주면 몇 명에게 줄 수 있나요?`,
    answer: q,
    unit: "명",
    hint: `${n}/${d}에서 ${m}/${d}${jp(m, "를")} 몇 번 덜어 낼 수 있는지 생각해요.`,
    explanation: `${n}/${d} ÷ ${m}/${d} = ${n} ÷ ${m} = ${q}(명)`,
  };
});

export const sdBlank = mid("l6-sd-blank", (rand) => {
  const { d, m, q, n } = sameDen(rand);
  return {
    key: `${n}/${d}:${m}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: `□/${d} ÷ ${m}/${d} = ${q}`,
    answer: n,
    hint: "분모가 같으면 분자끼리 나누어요. □ ÷ " + m + " = " + q,
    explanation: `${m} × ${q} = ${n}`,
  };
});

/** 분자끼리 나누어떨어지는 차시: 가장 큰 수가 가장 작은 수의 배수인 카드만 */
export const sdCard = word("l6-sd-card", (rand) => {
  const cards = digitsDistinct(rand, 4).sort((a, b) => a - b);
  if (cards[0] === 1 || cards[3] % cards[0] !== 0) return null;
  const answer = String(cards[3] / cards[0]);
  return {
    key: cards.join(),
    prompt: `수 카드 ${cards.join(", ")} 중에서 2장을 골라 □/10 ÷ □/10의 □ 안에 한 번씩 넣으려고 합니다. 몫이 가장 클 때의 몫은 얼마인가요?`,
    answer,
    choices: fracOpts(rand, answer, [reduced(cards[0], cards[3]), reduced(cards[3], cards[1]), reduced(cards[2], cards[0])]),
    hint: "분모가 같으면 분자끼리 나누어요. 나누어지는 수는 크게, 나누는 수는 작게 해요.",
    explanation: `${cards[3]}/10 ÷ ${cards[0]}/10 = ${cards[3]} ÷ ${cards[0]} = ${answer}`,
  };
});

/** 잘못 곱한 결과로 어떤 분수를 찾은 뒤 바르게 나눈다: 분모가 같은 (분수)÷(분수), 몫은 자연수(두 단계) */
export const sdReverse = word("l6-sd-reverse", (rand) => {
  const d = pick(rand, [5, 7, 11, 13]);
  const m = randInt(rand, 2, Math.min(4, d - 1));
  const q = randInt(rand, 2, 7);
  const n = m * q;
  // 어떤 분수가 자연수(10/5)가 되면 다시 뽑기
  if (n % d === 0) return null;
  const [p] = names(rand, 1);
  return {
    key: `${m}/${d}:${q}`,
    prompt: `${p}는 어떤 분수를 ${m}/${d}${jp(m, "로")} 나누어야 할 것을 잘못하여 곱했더니 ${n * m}/${d * d}${jp(n * m, "가")} 되었습니다. 바르게 계산한 몫을 구하세요.`,
    answer: q,
    hint: `어떤 분수를 □/${d}라 하면 □/${d} × ${m}/${d}의 분자는 □ × ${m}, 분모는 ${josa(d * d, "이에요/예요")}. 어떤 분수를 먼저 구해요.`,
    explanation: `□ × ${m} = ${n * m} → □ = ${n}, 어떤 분수는 ${n}/${d}입니다. ${n}/${d} ÷ ${m}/${d} = ${n} ÷ ${m} = ${q}`,
    mistakes: { [n]: "어떤 분수의 분자까지만 구했어요. 바르게 나눈 몫을 구해야 해요." },
  };
});

export const sdFrac = easy("l6-sd-frac", (rand) => {
  const d = pick(rand, PRIME_DEN);
  const n = randInt(rand, 1, d - 1);
  const m = randInt(rand, 2, d - 1);
  if (n % m === 0 || n === m) return null;
  const answer = reduced(n, m);
  return {
    key: `${n}/${d}:${m}`,
    prompt: "계산하여 기약분수로 나타낸 것을 고르세요.",
    expression: `${n}/${d} ÷ ${m}/${d}`,
    answer,
    choices: fracOpts(rand, answer, [reduced(m, n), reduced(n, d), reduced(n * m, d * d)]),
    hint: "분모가 같으면 (분자) ÷ (분자)로 계산하고, 몫을 분수로 나타내요.",
    explanation: `${n}/${d} ÷ ${m}/${d} = ${n} ÷ ${m} = ${n}/${m}${answer !== `${n}/${m}` ? ` = ${answer}` : ""}`,
    mistakes: { [reduced(m, n)]: "나누는 수와 나누어지는 수를 바꿨어요." },
  };
});

export const sdBiggest = mid("l6-sd-biggest", (rand) => {
  const d = pick(rand, [11, 13]);
  const pairs = Array.from({ length: 4 }, () => [randInt(rand, 1, d - 1), randInt(rand, 1, d - 1)] as const);
  const vals = pairs.map(([a, b]) => a / b);
  if (new Set(vals).size < 4) return null;
  const exprs = pairs.map(([a, b]) => `${a}/${d} ÷ ${b}/${d}`);
  return {
    key: exprs.join("|"),
    prompt: "몫이 가장 큰 것을 고르세요.",
    answer: exprs[vals.indexOf(Math.max(...vals))],
    choices: exprs,
    hint: "분모가 같으므로 분자끼리의 나눗셈으로 비교해요.",
    explanation: pairs.map(([a, b]) => `${a} ÷ ${b} = ${reduced(a, b)}`).join(", "),
  };
});

export const sdWord = mid("l6-sd-word", (rand) => {
  const d = pick(rand, PRIME_DEN);
  const n = randInt(rand, 1, d - 1);
  const m = randInt(rand, 1, d - 1);
  if (n === m || n % m === 0) return null;
  const answer = reduced(n, m);
  return {
    key: `${n}:${m}:${d}`,
    prompt: `고구마 ${n}/${d} kg은 감자 ${m}/${d} kg의 몇 배인가요?`,
    answer,
    choices: fracOpts(rand, answer, [reduced(m, n), reduced(n * m, d), reduced(n, d)]),
    hint: `${n}/${d} ÷ ${m}/${d}${jp(m, "를")} 계산해요.`,
    explanation: `${n}/${d} ÷ ${m}/${d} = ${n} ÷ ${m} = ${answer}(배)`,
  };
});

export const sdWrong = word("l6-sd-wrong", (rand) => {
  const d = pick(rand, [3, 5, 7]);
  const m = randInt(rand, 2, d - 1);
  const a = randInt(rand, 1, d * 2);
  if (a % d === 0) return null;
  const wrong = reduced(a, m);
  const answer = reduced(a * m, d * d);
  return {
    key: `${a}:${m}:${d}`,
    prompt: `어떤 수에 ${m}/${d}${jp(m, "를")} 곱해야 할 것을 잘못하여 ${m}/${d}${jp(m, "로")} 나누었더니 ${jf(wrong, "가")} 되었습니다. 바르게 계산한 값을 고르세요.`,
    answer,
    choices: fracOpts(rand, answer, [reduced(a, d), reduced(a * d, m * m), reduced(a, m * d)]),
    hint: `먼저 어떤 수를 구해요. (어떤 수) = ${wrong} × ${m}/${d}`,
    explanation: `어떤 수 = ${wrong} × ${m}/${d} = ${reduced(a, d)}, 바르게 계산하면 ${reduced(a, d)} × ${m}/${d} = ${answer}`,
    mistakes: { [reduced(a, d)]: "어떤 수까지만 구했어요." },
  };
});

export const sdRange = word("l6-sd-range", (rand) => {
  const d = randInt(rand, 11, 19);
  const m = randInt(rand, 2, 5);
  const q = randInt(rand, 2, 4);
  if (m * q >= d) return null;
  return {
    key: `${d}:${m}:${q}`,
    prompt: `□ 안에 들어갈 수 있는 자연수는 모두 몇 개인가요?`,
    expression: `□/${d} ÷ ${m}/${d} < ${q}`,
    answer: m * q - 1,
    unit: "개",
    hint: `분모가 같으므로 □ ÷ ${m} < ${q}, 즉 □ < ${m * q}${josa(m * q, "이에요/예요").slice(String(m * q).length)}.`,
    explanation: `□ < ${m} × ${q} = ${m * q} → 1부터 ${m * q - 1}까지 ${m * q - 1}개`,
    mistakes: { [m * q]: `□는 ${m * q}보다 작아야 해요.` },
  };
});

const diffDen = (rand: () => number) => {
  const d1 = randInt(rand, 2, 9);
  const d2 = randInt(rand, 2, 9);
  const n1 = randInt(rand, 1, d1 - 1);
  const n2 = randInt(rand, 1, d2 - 1);
  if (d1 === d2 || gcd(n1, d1) !== 1 || gcd(n2, d2) !== 1) return null;
  return { d1, d2, n1, n2, ans: reduced(n1 * d2, d1 * n2) };
};

export const diffDenDiv = easy("l6-diff-den-div", (rand) => {
  const f = diffDen(rand);
  if (!f) return null;
  const { d1, d2, n1, n2, ans } = f;
  const L = lcm(d1, d2);
  return {
    key: `${n1}/${d1}:${n2}/${d2}`,
    prompt: "계산하여 기약분수로 나타낸 것을 고르세요.",
    expression: `${n1}/${d1} ÷ ${n2}/${d2}`,
    answer: ans,
    choices: fracOpts(rand, ans, [reduced(n2 * d1, d2 * n1), reduced(n1 * n2, d1 * d2), reduced(n1, n2)]),
    hint: "통분한 뒤 분자끼리 나누어요.",
    explanation: `${(n1 * L) / d1}/${L} ÷ ${(n2 * L) / d2}/${L} = ${(n1 * L) / d1} ÷ ${(n2 * L) / d2} = ${ans}`,
    mistakes: { [reduced(n1 * n2, d1 * d2)]: "나누지 않고 곱했어요." },
  };
});

export const diffDenCommon = mid("l6-diff-den-common", (rand) => {
  const f = diffDen(rand);
  if (!f) return null;
  const { d1, d2, n1, n2 } = f;
  const L = lcm(d1, d2);
  const [a, b] = [(n1 * L) / d1, (n2 * L) / d2];
  const answer = `${a} ÷ ${b}`;
  return {
    key: `${n1}/${d1}:${n2}/${d2}`,
    prompt: `${n1}/${d1} ÷ ${n2}/${d2}${jp(n2, "를")} 통분하여 계산하려고 합니다. 분자끼리의 나눗셈으로 바르게 나타낸 것을 고르세요.`,
    answer,
    choices: opts(rand, answer, [`${b} ÷ ${a}`, `${n1} ÷ ${n2}`, `${d1} ÷ ${d2}`], () => `${a + 1} ÷ ${b}`),
    hint: `분모를 ${j(L, "로")} 통분해요.`,
    explanation: `${n1}/${d1} ÷ ${n2}/${d2} = ${a}/${L} ÷ ${b}/${L} = ${answer}`,
  };
});

export const diffDenBlank = mid("l6-diff-den-blank", (rand) => {
  const d = randInt(rand, 3, 9);
  const n = randInt(rand, 1, d - 1);
  const q = randInt(rand, 2, 6);
  if (gcd(n, d) !== 1) return null;
  const answer = reduced(n * q, d);
  return {
    key: `${n}/${d}:${q}`,
    prompt: "□ 안에 알맞은 분수를 고르세요.",
    expression: `□ ÷ ${n}/${d} = ${q}`,
    answer,
    choices: fracOpts(rand, answer, [reduced(q * d, n), reduced(n, d * q), reduced(n + q, d)]),
    hint: `□ = ${q} × ${n}/${d}`,
    explanation: `${q} × ${n}/${d} = ${answer}`,
  };
});

export const diffDenCompare = word("l6-diff-den-compare", (rand) => {
  const [p1, p2] = names(rand, 2);
  const t1 = randInt(rand, 1, 3);
  const t2 = randInt(rand, 1, 3);
  const T1 = randInt(rand, t1 + 1, 5);
  const T2 = randInt(rand, t2 + 1, 5);
  const k1 = randInt(rand, 1, 5);
  const k2 = randInt(rand, 1, 5);
  const D1 = randInt(rand, 2, 6);
  const D2 = randInt(rand, 2, 6);
  const v1 = (k1 / D1) / (t1 / T1);
  const v2 = (k2 / D2) / (t2 / T2);
  if (v1 === v2 || k1 % D1 === 0 || k2 % D2 === 0) return null;
  const s1 = reduced(k1 * T1, D1 * t1);
  const s2 = reduced(k2 * T2, D2 * t2);
  const answer = v1 > v2 ? s1 : s2;
  return {
    key: `${k1}/${D1}:${t1}/${T1}:${k2}/${D2}:${t2}/${T2}`,
    prompt: `${p1}는 ${reduced(t1, T1)}시간 동안 ${reduced(k1, D1)} km를, ${p2}는 ${reduced(t2, T2)}시간 동안 ${reduced(k2, D2)} km를 걸었습니다. 같은 빠르기로 1시간 동안 걸을 때 더 멀리 가는 사람은 1시간 동안 몇 km를 걷나요?`,
    answer,
    choices: fracOpts(rand, answer, [v1 > v2 ? s2 : s1, reduced(k1 * t1, D1 * T1), reduced(k2 * t2, D2 * T2)]),
    hint: "(간 거리) ÷ (걸린 시간)으로 1시간 동안 걷는 거리를 각각 구해요.",
    explanation: `${p1}: ${s1} km, ${p2}: ${s2} km → 더 먼 쪽은 ${answer} km`,
  };
});

export const diffDenReverse = word("l6-diff-den-reverse", (rand) => {
  const f = diffDen(rand);
  if (!f) return null;
  const { d1, d2, n1, n2 } = f;
  const product = reduced(n1 * n2, d1 * d2);
  const answer = reduced(n1, d1);
  return {
    key: `${n1}/${d1}:${n2}/${d2}`,
    prompt: `어떤 분수에 ${n2}/${d2}${jp(n2, "를")} 곱했더니 ${jf(product, "가")} 되었습니다. 어떤 분수를 고르세요.`,
    answer,
    choices: fracOpts(rand, answer, [reduced(n1 * n2 * n2, d1 * d2 * d2), reduced(n2, d2), reduced(d1, n1)]),
    hint: `거꾸로 생각해요. (어떤 분수) = ${product} ÷ ${n2}/${d2}`,
    explanation: `${product} ÷ ${n2}/${d2} = ${product} × ${d2}/${n2} = ${answer}`,
    mistakes: { [reduced(n1 * n2 * n2, d1 * d2 * d2)]: "나누어야 하는데 곱했어요." },
  };
});

export const wfUnit = easy("l6-wf-unit", (rand) => {
  const k = randInt(rand, 2, 12);
  const d = randInt(rand, 2, 9);
  return {
    key: `${k}:${d}`,
    prompt: "계산해 보세요.",
    expression: `${k} ÷ 1/${d} = □`,
    answer: k * d,
    hint: `1/${d}로 나누는 것은 ${j(d, "를")} 곱하는 것과 같아요.`,
    explanation: `${k} × ${d} = ${k * d}`,
    mistakes: { [trim(k / d)]: "나누는 분수를 뒤집지 않았어요." },
  };
});

export const wfWord = mid("l6-wf-word", (rand) => {
  const d = randInt(rand, 3, 9);
  const n = randInt(rand, 1, d - 1);
  const u = randInt(rand, 2, 15) * 100;
  if (gcd(n, d) !== 1) return null;
  return {
    key: `${n}/${d}:${u}`,
    prompt: `토마토 ${n}/${d} kg의 값이 ${won(u * n)}원입니다. 토마토 1 kg의 값은 얼마인가요?`,
    answer: u * d,
    unit: "원",
    hint: `${u * n} ÷ ${n}/${d}${jp(n, "를")} 계산해요.`,
    explanation: `${u * n} ÷ ${n}/${d} = (${u * n} ÷ ${n}) × ${d} = ${won(u * d)}(원)`,
  };
});

export const wfPriceCompare = word("l6-wf-price-compare", (rand) => {
  const [d1, d2] = [randInt(rand, 3, 9), randInt(rand, 3, 9)];
  const [n1, n2] = [randInt(rand, 1, d1 - 1), randInt(rand, 1, d2 - 1)];
  // 고기 1 kg은 1만~4만 원 안팎: 분모 한 칸(1/d kg)의 값을 1,500~4,000원에서
  const [u1, u2] = [randInt(rand, 15, 40) * 100, randInt(rand, 15, 40) * 100];
  if (u1 * d1 === u2 * d2 || gcd(n1, d1) !== 1 || gcd(n2, d2) !== 1) return null;
  const [c1, c2] = [u1 * d1, u2 * d2];
  if (Math.min(c1, c2) < 10000 || Math.max(c1, c2) > 40000) return null;
  return {
    key: `${n1}/${d1}:${u1}:${n2}/${d2}:${u2}`,
    prompt: `가 가게에서는 고기 ${n1}/${d1} kg을 ${won(u1 * n1)}원에, 나 가게에서는 같은 고기 ${n2}/${d2} kg을 ${won(u2 * n2)}원에 팝니다. 1 kg의 값이 더 싼 가게에서 고기 1 kg은 얼마인가요?`,
    answer: Math.min(c1, c2),
    unit: "원",
    hint: "두 가게의 1 kg 값을 각각 (값) ÷ (무게)로 구해요.",
    explanation: `가: ${won(c1)}원, 나: ${won(c2)}원 → ${won(Math.min(c1, c2))}원`,
    mistakes: { [Math.max(c1, c2)]: "더 비싼 가게의 값이에요." },
  };
});

export const wfError = word("l6-wf-error", (rand) => {
  const d = randInt(rand, 3, 9);
  const n = randInt(rand, 2, d - 1);
  if (gcd(n, d) !== 1) return null;
  const k = n * randInt(rand, 1, 6);
  const [p] = names(rand, 1);
  const answer = String((k / n) * d);
  return {
    key: `${k}:${n}/${d}`,
    prompt: `${p}는 ${k} ÷ ${n}/${d}${jp(n, "를")} 다음과 같이 계산했습니다. 잘못된 곳을 찾아 바르게 계산한 값을 고르세요.`,
    expression: `${k} ÷ ${n}/${d} = ${k} × ${n}/${d} = ${reduced(k * n, d)}`,
    answer,
    choices: opts(rand, answer, [reduced(k * n, d), reduced(k, n * d), String(k * d)], () => String((k / n) * d + n)),
    hint: "(자연수) ÷ (분수)는 (자연수) ÷ (분자)를 먼저 계산한 뒤 분모를 곱해요.",
    explanation: `${k} ÷ ${n}/${d} = (${k} ÷ ${n}) × ${d} = ${k / n} × ${d} = ${answer}`,
    mistakes: { [reduced(k * n, d)]: "친구와 같은 실수예요. 나눗셈을 곱셈으로 바꾸기만 하면 안 돼요." },
  };
});

const pf = (rand: () => number) => {
  const d1 = randInt(rand, 2, 9);
  const d2 = randInt(rand, 2, 9);
  const n1 = randInt(rand, 1, d1 * 2);
  const n2 = randInt(rand, 1, d2 - 1);
  if (gcd(n1, d1) !== 1 || n1 === d1 || gcd(n2, d2) !== 1 || n2 === 1) return null;
  return { d1, d2, n1, n2 };
};

export const ffMulForm = mid("l6-ff-mul-form", (rand) => {
  const f = pf(rand);
  if (!f) return null;
  const { d1, d2, n1, n2 } = f;
  const answer = `${n1}/${d1} × ${d2}/${n2}`;
  return {
    key: `${n1}/${d1}:${n2}/${d2}`,
    prompt: `${n1}/${d1} ÷ ${n2}/${d2}${jp(n2, "를")} 분수의 곱셈으로 바르게 나타낸 것을 고르세요.`,
    answer,
    choices: opts(rand, answer, [`${d1}/${n1} × ${n2}/${d2}`, `${n1}/${d1} × ${n2}/${d2}`, `${d1}/${n1} × ${d2}/${n2}`], () => answer),
    hint: "나누는 분수의 분모와 분자를 바꾸어 곱해요.",
    explanation: `${n1}/${d1} ÷ ${n2}/${d2} = ${answer} = ${reduced(n1 * d2, d1 * n2)}`,
  };
});

export const ffBlank = mid("l6-ff-blank", (rand) => {
  const f = pf(rand);
  if (!f) return null;
  const { d1, d2, n1, n2 } = f;
  const product = reduced(n1 * n2, d1 * d2);
  const answer = reduced(n1, d1);
  return {
    key: `${n1}/${d1}:${n2}/${d2}`,
    prompt: "□ 안에 알맞은 분수를 고르세요.",
    expression: `□ × ${n2}/${d2} = ${product}`,
    answer,
    choices: fracOpts(rand, answer, [reduced(n1 * n2 * n2, d1 * d2 * d2), reduced(d1, n1), reduced(n2, d2)]),
    hint: `□ = ${product} ÷ ${n2}/${d2}`,
    explanation: `${product} ÷ ${n2}/${d2} = ${product} × ${d2}/${n2} = ${answer}`,
  };
});

export const ffError = word("l6-ff-error", (rand) => {
  const f = pf(rand);
  if (!f) return null;
  const { d1, d2, n1, n2 } = f;
  const [p] = names(rand, 1);
  const wrong = reduced(d1 * n2, n1 * d2);
  const answer = reduced(n1 * d2, d1 * n2);
  if (wrong === answer) return null;
  return {
    key: `${n1}/${d1}:${n2}/${d2}`,
    prompt: `${p}는 ${n1}/${d1} ÷ ${n2}/${d2}${jp(n2, "를")} 다음과 같이 계산했습니다. 잘못된 곳을 찾아 바르게 계산한 값을 고르세요.`,
    expression: `${n1}/${d1} ÷ ${n2}/${d2} = ${d1}/${n1} × ${n2}/${d2} = ${wrong}`,
    answer,
    choices: fracOpts(rand, answer, [wrong, reduced(n1 * n2, d1 * d2), reduced(d1 * d2, n1 * n2)]),
    hint: "분모와 분자를 바꾸는 것은 나누어지는 수가 아니라 나누는 수예요.",
    explanation: `${n1}/${d1} × ${d2}/${n2} = ${answer}`,
    mistakes: { [wrong]: "친구와 같은 실수예요. 나누는 분수를 뒤집어야 해요." },
  };
});

const mixedOf = (rand: () => number) => {
  const d = randInt(rand, 2, 7);
  const w = randInt(rand, 1, 4);
  let r = randInt(rand, 1, d - 1);
  while (gcd(r, d) !== 1) r -= 1;
  return { d, N: w * d + r, text: `${w} ${r}/${d}` };
};

export const mfDiv = easy("l6-mf-div", (rand) => {
  const { d, N, text } = mixedOf(rand);
  const e = randInt(rand, 2, 9);
  const n = randInt(rand, 1, e - 1);
  if (gcd(n, e) !== 1) return null;
  const answer = reduced(N * e, d * n);
  return {
    key: `${text}:${n}/${e}`,
    prompt: "계산하여 기약분수로 나타낸 것을 고르세요.",
    expression: `${text} ÷ ${n}/${e}`,
    answer,
    choices: fracOpts(rand, answer, [reduced(N * n, d * e), reduced(d * n, N * e), reduced((N - (N % d)) * e + (N % d) * 1, d * n)]),
    hint: "대분수를 가분수로 바꾼 뒤, 나누는 분수의 분모와 분자를 바꾸어 곱해요.",
    explanation: `${text} ÷ ${n}/${e} = ${N}/${d} × ${e}/${n} = ${answer}`,
  };
});

export const mfCmp = mid("l6-mf-cmp", (rand) => {
  const { d, N, text } = mixedOf(rand);
  // 1보다 작은 수, 1, 1보다 큰 수로 나누는 경우를 모두 낸다
  const e = randInt(rand, 2, 9);
  const n = randInt(rand, 1, 2 * e - 1);
  if (n !== e && gcd(n, e) !== 1) return null;
  const answer = cmpText(N * e, N * n);
  return {
    key: `${text}:${n}/${e}`,
    prompt: "계산하지 않고 크기를 비교하여 ○ 안에 >, =, < 중 알맞은 것을 고르세요.",
    expression: `${text} ÷ ${n === e ? "1" : `${n}/${e}`} ○ ${text}`,
    answer,
    choices: [...COMPARE_CHOICES],
    hint: "1보다 작은 수로 나누면 몫은 나누어지는 수보다 커지고, 1보다 큰 수로 나누면 작아져요.",
    explanation: n === e ? "1로 나누면 몫은 그대로예요." : `${n}/${e}${jp(n, "는")} 1보다 ${n < e ? "작으므로 몫은 " + text + "보다 커요" : "크므로 몫은 " + text + "보다 작아요"}. (${reduced(N * e, d * n)})`,
  };
});

/** 넓이 ÷ 가로 = 세로: 약분이 깔끔한 수로(세로를 먼저 정해 넓이를 만든다) */
export const mfRect = mid("l6-mf-rect", (rand) => {
  const { d, N, text } = mixedOf(rand);
  const [hn, hd] = pick(rand, [[1, 2], [3, 4], [2, 3], [3, 2], [5, 4], [4, 3], [2, 1], [3, 1]] as const);
  const area = reduced(N * hn, d * hd);
  if (!area.includes(" ") && !area.includes("/")) return null;
  const answer = reduced(hn, hd);
  const [an, ad] = [N * hn, d * hd].map((v) => v / gcd(N * hn, d * hd));
  return {
    key: `${text}:${hn}/${hd}`,
    prompt: `넓이가 ${area} m²인 직사각형의 가로가 ${text} m입니다. 세로는 몇 m인가요?`,
    answer,
    choices: fracOpts(rand, answer, [reduced(N * N * hn, d * d * hd), reduced(hd, hn), reduced(an * N, ad * d)]),
    hint: "(세로) = (넓이) ÷ (가로). 대분수를 가분수로 바꾸어 계산해요.",
    explanation: `${area} ÷ ${text} = ${an}/${ad} ÷ ${N}/${d} = ${an}/${ad} × ${d}/${N} = ${answer}(m)`,
  };
});

export const mfCard = word("l6-mf-card", (rand) => {
  const cards = digitsDistinct(rand, 3).sort((a, b) => a - b);
  const [lo, md, hi] = cards;
  const e = randInt(rand, 2, 9);
  const n = randInt(rand, 1, e - 1);
  if (gcd(n, e) !== 1) return null;
  const N = hi * md + lo;
  const answer = reduced(N * e, md * n);
  return {
    key: `${cards.join()}:${n}/${e}`,
    prompt: `수 카드 ${j(cards.join(", "), "를")} 한 번씩 모두 사용하여 가장 큰 대분수를 만들었습니다. 이 대분수를 ${n}/${e}${jp(n, "로")} 나눈 몫을 고르세요.`,
    answer,
    choices: fracOpts(rand, answer, [reduced(N * n, md * e), reduced((lo * md + hi) * e, md * n), reduced((hi * lo + md) * e, lo * n)]),
    hint: "자연수 부분에 가장 큰 수를 놓고 남은 두 수로 진분수를 만들어요.",
    explanation: `가장 큰 대분수 ${hi} ${lo}/${md} = ${N}/${md}, ${N}/${md} × ${e}/${n} = ${answer}`,
  };
});

export const mfTwoStep = word("l6-mf-two-step", (rand) => {
  const { d, N, text } = mixedOf(rand);
  const e = randInt(rand, 2, 9);
  const n = randInt(rand, 1, e - 1);
  const k = randInt(rand, 2, 5);
  if (gcd(n, e) !== 1) return null;
  const per = reduced(N * e, d * n);
  const answer = reduced(N * e * k, d * n);
  return {
    key: `${text}:${n}/${e}:${k}`,
    prompt: `페인트 ${n}/${e} L로 벽 ${text} m²를 칠했습니다. 페인트 1 L로 칠하는 넓이가 일정하다면 페인트 ${k} L로는 벽 몇 m²를 칠할 수 있나요?`,
    answer,
    choices: fracOpts(rand, answer, [per, reduced(N * n * k, d * e), reduced(N * e, d * n * k)]),
    hint: "먼저 페인트 1 L로 칠할 수 있는 넓이를 구해요.",
    explanation: `${text} ÷ ${n}/${e} = ${per}(m²), ${per} × ${k} = ${answer}(m²)`,
    mistakes: { [per]: "1 L로 칠할 수 있는 넓이까지만 구했어요." },
  };
});

/* ── 6-2-2 소수의 나눗셈 ── */

const t1 = (rand: () => number) => {
  const B = randInt(rand, 2, 9);
  const q = randInt(rand, 2, 30);
  return { B, q, A: B * q };
};

export const ddsScale = easy("l6-dds-scale", (rand) => {
  const { B, q, A } = t1(rand);
  const p = pick(rand, [10, 100]);
  return {
    key: `${A}:${B}:${p}`,
    prompt: `${A} ÷ ${B} = ${j(q, "를")} 이용하여 □ 안에 알맞은 수를 써넣으세요.`,
    expression: `${trim(A / p)} ÷ ${trim(B / p)} = □`,
    answer: q,
    hint: "나누어지는 수와 나누는 수를 똑같이 1/10배(1/100배) 하면 몫은 같아요.",
    explanation: `${trim(A / p)} ÷ ${trim(B / p)} = ${A} ÷ ${B} = ${q}`,
    mistakes: { [trim(q / p)]: "몫은 변하지 않아요." },
  };
});

export const ddsCm = mid("l6-dds-cm", (rand) => {
  const { B, q, A } = t1(rand);
  return {
    key: `${A}:${B}`,
    prompt: `색 테이프 ${trim(A / 10)} m를 ${trim(B / 10)} m씩 자르려고 합니다. cm 단위로 바꾸어 계산하면 몇 도막이 되나요?`,
    answer: q,
    unit: "도막",
    hint: `${trim(A / 10)} m = ${A * 10} cm, ${trim(B / 10)} m = ${B * 10} cm`,
    explanation: `${A * 10} ÷ ${B * 10} = ${q}(도막)`,
  };
});

export const ddsSameQuot = mid("l6-dds-same-quot", (rand) => {
  const { B, q, A } = t1(rand);
  const answer = `${trim(A / 10)} ÷ ${trim(B / 10)}`;
  return {
    key: `${A}:${B}`,
    prompt: `몫이 ${A} ÷ ${j(B, "와")} 같은 나눗셈을 고르세요.`,
    answer,
    choices: opts(rand, answer, [`${trim(A / 10)} ÷ ${B}`, `${A} ÷ ${trim(B / 10)}`, `${trim(A / 100)} ÷ ${trim(B / 10)}`], () => answer),
    hint: "나누어지는 수와 나누는 수를 똑같은 배수로 바꾸면 몫이 같아요.",
    explanation: `${answer} = ${A} ÷ ${B} = ${q}`,
  };
});

export const ddsReverse = word("l6-dds-reverse", (rand) => {
  const b = randInt(rand, 2, 6);
  const c = randInt(rand, 2, 6);
  if (b === c) return null;
  const x10 = lcm(b, c) * randInt(rand, 1, 4);
  return {
    key: `${b}:${c}:${x10}`,
    prompt: `어떤 수를 ${j(b / 10, "로")} 나누었더니 몫이 ${j(x10 / b, "가")} 되었습니다. 어떤 수를 ${j(c / 10, "로")} 나눈 몫은 얼마인가요?`,
    answer: x10 / c,
    hint: `먼저 어떤 수를 구해요. (어떤 수) = ${x10 / b} × ${b / 10}`,
    explanation: `어떤 수 = ${x10 / b} × ${b / 10} = ${trim(x10 / 10)}, ${trim(x10 / 10)} ÷ ${c / 10} = ${x10 / c}`,
    mistakes: { [trim(x10 / 10)]: "어떤 수까지만 구했어요." },
  };
});

export const ddsTwoStep = word("l6-dds-two-step", (rand) => {
  const b = randInt(rand, 2, 9) / 10;
  const q = randInt(rand, 6, 20);
  const k = randInt(rand, 2, q - 2);
  return {
    key: `${b}:${q}:${k}`,
    prompt: `리본 ${trim(b * q)} m를 ${b} m씩 잘라 선물 상자 하나에 한 도막씩 묶으려고 합니다. 상자 ${k}개를 묶고 나면 남는 도막은 몇 개인가요?`,
    answer: q - k,
    unit: "개",
    hint: `먼저 ${trim(b * q)} ÷ ${j(b, "로")} 도막 수를 구해요.`,
    explanation: `${trim(b * q)} ÷ ${b} = ${q}(도막), ${q} − ${k} = ${q - k}(개)`,
    mistakes: { [q]: "모두 몇 도막인지까지만 구했어요." },
  };
});

/** 자릿수가 같은 (소수)÷(소수): 나누는 수와 나누어지는 수가 모두 소수 한 자리(자연수가 되면 다시 뽑기) */
const samePlaces = (rand: () => number) => {
  for (;;) {
    const b = randInt(rand, 2, 99) / 10;
    const q = randInt(rand, 2, 30);
    if (!Number.isInteger(b) && !Number.isInteger(b * q) && !Number.isInteger(Number(trim(b * q)))) return { b, q, a: trim(b * q) };
  }
};

export const ddsCompare = mid("l6-dds-compare", (rand) => {
  const ps = Array.from({ length: 4 }, () => samePlaces(rand));
  if (new Set(ps.map((p) => p.q)).size < 4) return null;
  const exprs = ps.map((p) => `${p.a} ÷ ${p.b}`);
  const best = ps.reduce((m, p, i) => (p.q > ps[m].q ? i : m), 0);
  return {
    key: exprs.join("|"),
    prompt: "몫이 가장 큰 나눗셈을 고르세요.",
    answer: exprs[best],
    choices: exprs,
    hint: "소수점을 똑같이 옮겨 자연수의 나눗셈으로 계산해요.",
    explanation: ps.map((p) => `${p.a} ÷ ${p.b} = ${p.q}`).join(", "),
  };
});

export const ddsWrong = word("l6-dds-wrong", (rand) => {
  const b = randInt(rand, 2, 9) / 10;
  const q = randInt(rand, 2, 30);
  const x = b * q;
  return {
    key: `${b}:${q}`,
    prompt: `어떤 수에 ${j(b, "를")} 곱해야 할 것을 잘못하여 ${j(b, "로")} 나누었더니 ${j(q, "가")} 되었습니다. 바르게 계산한 값은 얼마인가요?`,
    answer: trim(x * b),
    hint: `먼저 어떤 수를 구해요. (어떤 수) = ${q} × ${b}`,
    explanation: `어떤 수 = ${q} × ${b} = ${trim(x)}, ${trim(x)} × ${b} = ${trim(x * b)}`,
    mistakes: { [trim(x)]: "어떤 수까지만 구했어요." },
  };
});

export const ddsRect = word("l6-dds-rect", (rand) => {
  const w = randInt(rand, 12, 60) / 10;
  const h = randInt(rand, 2, 15);
  const A = trim(w * h);
  // 자릿수가 같은 (소수)÷(소수) 차시: 가로와 넓이가 모두 소수 한 자리
  if (Number.isInteger(w) || Number.isInteger(Number(A))) return null;
  return {
    key: `${w}:${h}`,
    prompt: `넓이가 ${A} m²이고 가로가 ${w} m인 직사각형 모양 꽃밭이 있습니다. 이 꽃밭의 둘레는 몇 m인가요?`,
    answer: trim(2 * (w + h)),
    unit: "m",
    hint: "먼저 (세로) = (넓이) ÷ (가로)를 구해요.",
    explanation: `세로 ${A} ÷ ${w} = ${h}(m), 둘레 (${w} + ${h}) × 2 = ${trim(2 * (w + h))}(m)`,
    mistakes: { [h]: "세로까지만 구했어요." },
  };
});

const diffPlaces = (rand: () => number) => {
  const b = randInt(rand, 12, 99) / 10;
  const q = randInt(rand, 11, 99) / 10;
  return { b, q, a: trim(b * q) };
};

export const ddpDiv = easy("l6-ddp-div", (rand) => {
  const { b, q, a } = diffPlaces(rand);
  return {
    key: `${a}:${b}`,
    prompt: "계산해 보세요.",
    expression: `${a} ÷ ${b} = □`,
    answer: trim(q),
    hint: "나누는 수가 자연수가 되도록 두 수의 소수점을 똑같이 한 자리씩 옮겨요.",
    explanation: `${trim(Number(a) * 10)} ÷ ${trim(b * 10)} = ${trim(q)}`,
    mistakes: { [trim(q * 10)]: "몫의 소수점 위치가 틀렸어요." },
  };
});

export const ddpShift = mid("l6-ddp-shift", (rand) => {
  const { b, a } = diffPlaces(rand);
  const answer = `${trim(Number(a) * 10)} ÷ ${trim(b * 10)}`;
  return {
    key: `${a}:${b}`,
    prompt: `${a} ÷ ${j(b, "와")} 몫이 같은 나눗셈을 고르세요.`,
    answer,
    choices: opts(rand, answer, [`${trim(Number(a) * 100)} ÷ ${trim(b * 10)}`, `${a} ÷ ${trim(b * 10)}`, `${trim(Number(a) * 10)} ÷ ${b}`], () => answer),
    hint: "나누어지는 수와 나누는 수의 소수점을 똑같이 옮겨야 몫이 같아요.",
    explanation: `두 수의 소수점을 똑같이 한 자리씩 옮기면 ${answer}`,
  };
});

export const ddpBlank = mid("l6-ddp-blank", (rand) => {
  const { b, q, a } = diffPlaces(rand);
  return {
    key: `${a}:${b}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: `□ ÷ ${b} = ${trim(q)}`,
    answer: a,
    hint: "□ = 몫 × 나누는 수",
    explanation: `${trim(q)} × ${b} = ${a}`,
  };
});

export const ddpError = word("l6-ddp-error", (rand) => {
  const { b, q, a } = diffPlaces(rand);
  const [p] = names(rand, 1);
  const answer = trim(q);
  return {
    key: `${a}:${b}`,
    prompt: `${p}는 ${a} ÷ ${j(b, "를")} ${trim(Number(a) * 100)} ÷ ${j(trim(b * 10), "로")} 바꾸어 몫을 ${j(trim(q * 10), "라고")} 했습니다. 잘못된 곳을 찾아 바른 몫을 고르세요.`,
    answer,
    choices: opts(rand, answer, [trim(q * 10), trim(q / 10), trim(q * 100)], () => trim(q + 1)),
    hint: "나누어지는 수와 나누는 수의 소수점을 똑같은 자리만큼 옮겨야 해요.",
    explanation: `두 수의 소수점을 한 자리씩 옮기면 ${trim(Number(a) * 10)} ÷ ${trim(b * 10)} = ${answer}`,
    mistakes: { [trim(q * 10)]: "친구와 같은 실수예요." },
  };
});

/** 보여 준 세 줄(÷■, ÷0.■, ÷0.0■)의 다음 단계(÷0.00■)를 묻는다. 나누는 수는 소수 셋째 자리까지이고 답은 문제에 나오지 않는다 */
export const ddpPattern = word("l6-ddp-pattern", (rand) => {
  const B = randInt(rand, 2, 9);
  const q = randInt(rand, 2, 9);
  const a = trim((B * q) / 10);
  return {
    key: `${a}:${B}`,
    prompt: `규칙을 찾아 □ 안에 알맞은 수를 구하세요.\n${a} ÷ ${B} = ${trim(q / 10)}\n${a} ÷ ${trim(B / 10)} = ${q}\n${a} ÷ ${trim(B / 100)} = ${q * 10}`,
    expression: `${a} ÷ ${trim(B / 1000)} = □`,
    answer: q * 100,
    hint: "나누는 수가 1/10배가 될 때마다 몫은 10배가 돼요.",
    explanation: `나누는 수가 ${B}의 1/1000배이므로 몫은 ${trim(q / 10)} × 1000 = ${q * 100}`,
    mistakes: { [q * 10]: "보여 준 마지막 줄의 몫이에요. 나누는 수가 한 번 더 1/10배가 되었어요." },
  };
});

export const wdDiv = easy("l6-wd-div", (rand) => {
  const b = pick(rand, [0.2, 0.4, 0.5, 0.6, 0.8, 1.2, 1.5, 2.5, 0.25, 0.75]);
  const q = randInt(rand, 2, 40);
  const n = b * q;
  if (!Number.isInteger(Number(trim(n)))) return null;
  return {
    key: `${trim(n)}:${b}`,
    prompt: "계산해 보세요.",
    expression: `${trim(n)} ÷ ${b} = □`,
    answer: q,
    hint: "나누는 수가 자연수가 되도록 소수점을 옮기고, 나누어지는 수에는 그만큼 0을 붙여요.",
    explanation: `${trim(n)} ÷ ${b} = ${q}`,
  };
});

export const wdCmp = mid("l6-wd-cmp", (rand) => {
  const n = randInt(rand, 2, 30);
  const b1 = randInt(rand, 2, 19) / 10;
  const b2 = randInt(rand, 2, 19) / 10;
  return {
    key: `${n}:${b1}:${b2}`,
    prompt: "계산하지 않고 크기를 비교하여 ○ 안에 >, =, < 중 알맞은 것을 고르세요.",
    expression: `${n} ÷ ${b1} ○ ${n} ÷ ${b2}`,
    answer: cmpText(b2, b1),
    choices: [...COMPARE_CHOICES],
    hint: "나누어지는 수가 같으면 나누는 수가 작을수록 몫이 커요.",
    explanation: `${b1} ${cmpText(b1, b2)} ${b2}이므로 몫은 반대로 ${cmpText(b2, b1)}`,
  };
});

export const wdWord = mid("l6-wd-word", (rand) => {
  const b = pick(rand, [0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 0.8]);
  const q = randInt(rand, 4, 40);
  const n = Number(trim(b * q));
  if (!Number.isInteger(n)) return null;
  return {
    key: `${n}:${b}`,
    prompt: `주스 ${n} L를 컵에 ${b} L씩 나누어 담으려고 합니다. 컵은 몇 개 필요한가요?`,
    answer: q,
    unit: "개",
    hint: `${n} ÷ ${j(b, "를")} 계산해요.`,
    explanation: `${n} ÷ ${b} = ${q}(개)`,
  };
});

/** 나눗셈의 몫보다 작은 자연수 중 가장 큰 수 */
export const wdRange = word("l6-wd-range", (rand) => {
  const b = randInt(rand, 3, 9) / 10;
  const n = randInt(rand, 3, 30);
  const v = n / b;
  if (Number.isInteger(Number(trim(v)))) return null;
  const answer = Math.floor(v);
  return {
    key: `${n}:${b}`,
    prompt: `${n} ÷ ${b}의 몫보다 작은 자연수 중에서 가장 큰 수를 구하세요.`,
    answer,
    hint: `${n} ÷ ${b}의 몫을 소수로 구해 보세요. 나누는 수와 나누어지는 수의 소수점을 똑같이 옮겨요.`,
    explanation: `${n} ÷ ${b} = ${n * 10} ÷ ${b * 10} = ${trim(v, 2)}…이므로 가장 큰 자연수는 ${josa(answer, "이에요/예요")}.`,
    mistakes: { [answer + 1]: "몫보다 큰 수를 골랐어요." },
  };
});

export const wdPriceCompare = word("l6-wd-price-compare", (rand) => {
  const [b1, b2] = [pick(rand, [0.2, 0.4, 0.5, 0.8]), pick(rand, [0.2, 0.4, 0.5, 0.8])];
  const [u1, u2] = [randInt(rand, 5, 30) * 100, randInt(rand, 5, 30) * 100];
  if (u1 === u2 || b1 === b2) return null;
  return {
    key: `${b1}:${u1}:${b2}:${u2}`,
    prompt: `가 철사는 ${b1} m에 ${won(u1 * b1)}원, 나 철사는 ${b2} m에 ${won(u2 * b2)}원입니다. 1 m의 값이 더 싼 철사는 1 m에 얼마인가요?`,
    answer: Math.min(u1, u2),
    unit: "원",
    hint: "(값) ÷ (길이)로 각각 1 m의 값을 구해요.",
    explanation: `가: ${u1 * b1} ÷ ${b1} = ${won(u1)}원, 나: ${u2 * b2} ÷ ${b2} = ${won(u2)}원`,
    mistakes: { [Math.max(u1, u2)]: "더 비싼 철사의 값이에요." },
  };
});

export const roundWhole = mid("l6-round-whole", (rand) => {
  const a = randInt(rand, 10, 99) / 10;
  const b = pick(rand, [0.3, 0.6, 0.7, 0.9, 1.1, 1.3]);
  const v = a / b;
  if (Number.isInteger(Number(trim(v)))) return null;
  return {
    key: `${a}:${b}`,
    prompt: `${a} ÷ ${b}의 몫을 반올림하여 일의 자리까지 나타내세요.`,
    answer: Math.round(v),
    hint: "몫을 소수 첫째 자리까지 구한 뒤 반올림해요.",
    explanation: `${a} ÷ ${b} = ${trim(v, 2)}… → ${Math.round(v)}`,
    mistakes: { [Math.floor(v)]: "반올림하지 않고 버렸어요." },
  };
});

export const roundPattern = word("l6-round-pattern", (rand) => {
  const [a, b] = pick(rand, [[1, 7], [2, 7], [3, 7], [1, 3], [2, 3], [1, 11], [5, 11], [4, 33], [1, 27]] as const);
  const k = randInt(rand, 10, 40);
  const ds: number[] = [];
  let r = a % b;
  for (let i = 0; i < k; i++) {
    r *= 10;
    ds.push(Math.floor(r / b));
    r %= b;
  }
  return {
    key: `${a}:${b}:${k}`,
    prompt: `${a} ÷ ${b}의 몫을 소수로 나타낼 때, 소수 ${ord(k)} 자리 숫자는 무엇인가요?`,
    answer: ds[k - 1],
    hint: "몫을 몇 자리까지 구해 보고 숫자가 되풀이되는 규칙을 찾아요.",
    explanation: `${a} ÷ ${b} = 0.${ds.slice(0, 8).join("")}… → 소수 ${ord(k)} 자리 숫자는 ${ds[k - 1]}`,
  };
});

export const remCalc = easy("l6-rem-calc", (rand) => {
  const b = randInt(rand, 2, 9);
  const q = randInt(rand, 2, 15);
  const r = randInt(rand, 1, b * 10 - 1) / 10;
  if (Number.isInteger(r)) return null;
  const a = trim(b * q + r);
  return {
    key: `${a}:${b}`,
    prompt: `${a} ÷ ${b}의 몫을 자연수까지 구하고 남는 양을 구하세요.`,
    answer: `${q},${trim(r)}`,
    unit: ["몫", "남는 양"],
    hint: "몫을 자연수 부분까지만 구하고, 남는 양의 소수점은 나누어지는 수의 소수점 위치에 맞춰 찍어요.",
    explanation: `${a} ÷ ${b} = ${q} … ${trim(r)} (${b} × ${q} + ${trim(r)} = ${a})`,
  };
});

export const remCheck = mid("l6-rem-check", (rand) => {
  const b = randInt(rand, 2, 9);
  const q = randInt(rand, 2, 15);
  const r = randInt(rand, 1, b * 10 - 1) / 10;
  if (Number.isInteger(r)) return null;
  const a = trim(b * q + r);
  const answer = `${b} × ${q} + ${trim(r)} = ${a}`;
  return {
    key: `${a}:${b}`,
    prompt: `${a} ÷ ${b} = ${q} … ${j(trim(r), "를")} 바르게 확인하는 식을 고르세요.`,
    answer,
    choices: opts(rand, answer, [`${q} × ${trim(r)} + ${b} = ${a}`, `${b} × ${trim(r)} + ${q} = ${a}`, `${b} + ${q} × ${trim(r)} = ${a}`], () => `${b} × ${q} − ${trim(r)} = ${a}`),
    hint: "(나누는 수) × (몫) + (남는 양) = (나누어지는 수)",
    explanation: `${b} × ${q} = ${b * q}, ${b * q} + ${trim(r)} = ${a}`,
  };
});

export const remNeed = mid("l6-rem-need", (rand) => {
  const b = randInt(rand, 2, 9);
  const q = randInt(rand, 2, 15);
  const r = randInt(rand, 1, b * 10 - 1) / 10;
  if (Number.isInteger(r)) return null;
  const a = trim(b * q + r);
  return {
    key: `${a}:${b}`,
    prompt: `쌀 ${a} kg을 한 봉지에 ${b} kg씩 담으려고 합니다. 남는 쌀 없이 모두 담으려면 쌀은 적어도 몇 kg 더 있어야 하나요?`,
    answer: trim(b - r),
    unit: "kg",
    hint: "봉지에 담고 남는 양을 먼저 구해요.",
    explanation: `${a} ÷ ${b} = ${q} … ${trim(r)}, ${b} − ${trim(r)} = ${trim(b - r)}(kg)`,
    mistakes: { [trim(r)]: "남는 양을 구했어요. 한 봉지를 채우려면 얼마가 더 필요한지 생각해요." },
  };
});

export const remError = word("l6-rem-error", (rand) => {
  const b = randInt(rand, 2, 9);
  const q = randInt(rand, 2, 15);
  const r = randInt(rand, 1, b * 10 - 1) / 10;
  if (Number.isInteger(r)) return null;
  const a = trim(b * q + r);
  const [p] = names(rand, 1);
  const answer = trim(r);
  return {
    key: `${a}:${b}`,
    prompt: `${p}는 설탕 ${a} kg을 ${b} kg씩 나누어 담아 ${q}봉지를 만들고 남는 설탕이 ${trim(r * 10)} kg이라고 했습니다. 바르게 고친 남는 양은 몇 kg인가요?`,
    answer,
    choices: opts(rand, answer, [trim(r * 10), trim(r / 10), trim(b - r)], () => trim(r + 1)),
    hint: "남는 양의 소수점은 나누어지는 수의 소수점 위치에 맞추어 찍어요. 남는 양은 나누는 수보다 작아야 해요.",
    explanation: `${b} × ${q} + ${answer} = ${a}이므로 남는 양은 ${answer} kg`,
    mistakes: { [trim(r * 10)]: "친구와 같은 실수예요." },
  };
});

/* ── 6-2-3 공간과 입체 ── */

/** 위에서 본 모양의 각 칸에 쌓은 쌓기나무 수(0행이 뒤쪽 줄) */
type Grid = number[][];
/** 쌓은 칸이 모두 변으로 이어져 있는지(대각선으로만 닿는 떨어진 덩어리는 한 모양으로 쌓을 수 없다) */
export const gridConnected = (g: Grid): boolean => {
  const cells = g.flatMap((r, i) => r.map((c, j): [number, number, number] => [i, j, c])).filter(([, , c]) => c > 0);
  if (!cells.length) return false;
  const seen = new Set([`${cells[0][0]},${cells[0][1]}`]);
  const stack = [cells[0]];
  while (stack.length) {
    const [i, j] = stack.pop()!;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = cells.find(([a, b]) => a === i + di && b === j + dj);
      if (next && !seen.has(`${next[0]},${next[1]}`)) {
        seen.add(`${next[0]},${next[1]}`);
        stack.push(next);
      }
    }
  }
  return seen.size === cells.length;
};
const makeGrid = (rand: () => number, rows = 2, cols = 3, max = 3): Grid | null => {
  const g = Array.from({ length: rows }, () => Array.from({ length: cols }, () => randInt(rand, 0, max)));
  const flat = g.flat();
  if (flat.filter((c) => c > 0).length < 3 || Math.max(...flat) < 2) return null;
  if (g[rows - 1].every((c) => c === 0) || g[0].every((c) => c === 0)) return null;
  if (g[0].map((_, c) => g.every((r) => r[c] === 0)).some(Boolean)) return null;
  // 대각선으로만 닿는 떨어진 덩어리는 쓰지 않는다(이 함수를 쓰는 모든 쌓기나무 생성기에 적용)
  if (!gridConnected(g)) return null;
  return g;
};
const gridTotal = (g: Grid) => g.flat().reduce((a, b) => a + b, 0);
/** 앞에서 본 모양: 왼쪽부터 각 세로줄의 가장 높은 층 */
const colMax = (g: Grid) => g[0].map((_, c) => Math.max(...g.map((r) => r[c])));
/** 오른쪽 옆에서 본 모양: 왼쪽(앞쪽 줄)부터 각 가로줄의 가장 높은 층 */
const sideOf = (g: Grid) => g.map((r) => Math.max(...r)).reverse();
const TOP = "쌓기나무로 쌓은 모양과 위에서 본 모양입니다. 위에서 본 모양의 각 칸에는 그 자리에 쌓은 쌓기나무의 수를 적었습니다.";
const stackWithTop = (g: Grid, label = "쌓기나무로 쌓은 모양과 위에서 본 모양(수 적음)") => row([stackBlock(g, 26, "쌓은 모양"), topBlock(g, true)], label, 36);

/** 보기 ①~④: 모양 그림(앞·옆에서 본 모양, 층별 모양) 중 하나가 정답 */
function shapeChoices<T>(rand: () => number, answer: T, others: T[], filler: () => T, block: (x: T, cap: string) => Block) {
  const key = (x: T) => JSON.stringify(x);
  const list: T[] = [answer];
  for (const o of [...others, ...Array.from({ length: 30 }, filler)]) if (list.length < 4 && !list.some((l) => key(l) === key(o))) list.push(o);
  const order = shuffle(rand, list);
  const k = order.findIndex((x) => key(x) === key(answer));
  return { blocks: order.map((x, i) => block(x, CIRCLED[i])), answer: CIRCLED[k], choices: CIRCLED.slice(0, order.length) };
}

export const cubeStack = easy("cube-stack", (rand) => {
  const g = makeGrid(rand);
  if (!g) return null;
  const total = gridTotal(g);
  return {
    key: g.flat().join(""),
    prompt: `${TOP} 쌓기나무는 모두 몇 개인가요?`,
    visual: stackWithTop(g),
    answer: total,
    unit: "개",
    hint: "위에서 본 모양의 칸에 적힌 수를 모두 더해요. 뒤에 가려 보이지 않는 쌓기나무도 세어져요.",
    explanation: `${g.flat().filter((c) => c).join(" + ")} = ${total}(개)`,
    mistakes: { [g.flat().filter((c) => c > 0).length]: "칸의 수만 셌어요." },
  };
});

export const stackLayer = mid("l6-stack-layer", (rand) => {
  const g = makeGrid(rand);
  if (!g) return null;
  const k = randInt(rand, 2, 3);
  const v = g.flat().filter((c) => c >= k).length;
  if (!v) return null;
  return {
    key: `${g.flat().join("")}:${k}`,
    prompt: `${TOP} ${k}층에 있는 쌓기나무는 몇 개인가요?`,
    visual: stackWithTop(g),
    answer: v,
    unit: "개",
    hint: `${k} 이상인 수가 적힌 칸마다 ${k}층에 쌓기나무가 1개씩 있어요.`,
    explanation: `${k} 이상인 수가 적힌 칸 ${v}개 → ${v}개`,
  };
});

export const stackFirst = mid("l6-stack-first", (rand) => {
  const rows = randInt(rand, 2, 3);
  const g = makeGrid(rand, rows, 3);
  if (!g) return null;
  const v = g.flat().filter((c) => c > 0).length;
  return {
    key: g.flat().join(""),
    prompt: "쌓기나무로 쌓은 모양과 위에서 본 모양입니다. 1층에 있는 쌓기나무는 몇 개인가요?",
    visual: row([stackBlock(g, 24, "쌓은 모양"), topBlock(g, false)], "쌓기나무로 쌓은 모양과 위에서 본 모양", 36),
    answer: v,
    unit: "개",
    hint: "1층에는 위에서 본 모양의 칸마다 쌓기나무가 1개씩 있어요.",
    explanation: `위에서 본 모양의 칸 ${v}개 → 1층 ${v}개`,
    mistakes: { [gridTotal(g)]: "전체 쌓기나무 수를 구했어요." },
  };
});

export const stackCompare = word("l6-stack-compare", (rand) => {
  const g1 = makeGrid(rand);
  const g2 = makeGrid(rand);
  if (!g1 || !g2) return null;
  const [t1, t2] = [gridTotal(g1), gridTotal(g2)];
  if (t1 === t2) return null;
  return {
    key: `${g1.flat().join("")}:${g2.flat().join("")}`,
    prompt: "쌓기나무로 쌓은 두 모양 가와 나를 위에서 본 모양의 각 칸에 쌓은 쌓기나무의 수를 적었습니다. 두 모양에 사용한 쌓기나무 수의 차는 몇 개인가요?",
    visual: row([topBlock(g1, true, "가"), topBlock(g2, true, "나")], "위에서 본 모양 가와 나(수 적음)", 60),
    answer: Math.abs(t1 - t2),
    unit: "개",
    hint: "두 모양의 쌓기나무 수를 각각 더해 비교해요.",
    explanation: `가 ${t1}개, 나 ${t2}개 → 차 ${Math.abs(t1 - t2)}개`,
  };
});

const randHeights = (rand: () => number, n: number) => () => Array.from({ length: n }, () => randInt(rand, 1, 3));

export const frontView = easy("l6-front-view", (rand) => {
  const g = makeGrid(rand);
  if (!g) return null;
  const f = colMax(g);
  const c = shapeChoices(rand, f, [g[1].map((h) => Math.max(h, 1)), [...f].reverse(), sideOf(g), g[0].map((h) => Math.max(h, 1))], randHeights(rand, 3), (x, cap) => viewBlock(x, cap));
  return {
    key: g.flat().join(""),
    prompt: "위에서 본 모양의 각 칸에 쌓은 쌓기나무의 수를 적었습니다. 앞에서 본 모양을 고르세요.",
    visual: row([topBlock(g, true), ...c.blocks], "위에서 본 모양(수 적음)과 보기 ①~④", 24),
    answer: c.answer,
    choices: c.choices,
    hint: "앞에서 보면 왼쪽, 가운데, 오른쪽 줄마다 가장 높은 층만큼 보여요.",
    explanation: `왼쪽부터 각 줄의 가장 큰 수 ${f.join(", ")} → ${c.answer}`,
  };
});

export const sideView = mid("l6-side-view", (rand) => {
  const g = makeGrid(rand);
  if (!g) return null;
  const s = sideOf(g);
  if (s[0] === s[1]) return null;
  const c = shapeChoices(rand, s, [[...s].reverse(), [g[1][2], g[0][2]].map((h) => Math.max(h, 1)), [Math.min(...g[1].filter(Boolean)), Math.min(...g[0].filter(Boolean))]], randHeights(rand, 2), (x, cap) => viewBlock(x, cap));
  return {
    key: g.flat().join(""),
    prompt: "위에서 본 모양의 각 칸에 쌓은 쌓기나무의 수를 적었습니다. 오른쪽 옆에서 본 모양을 고르세요.",
    visual: row([topBlock(g, true), ...c.blocks], "위에서 본 모양(수 적음)과 보기 ①~④", 30),
    answer: c.answer,
    choices: c.choices,
    hint: "오른쪽 옆에서 보면 왼쪽에 앞쪽 줄, 오른쪽에 뒤쪽 줄이 보이고, 줄마다 가장 높은 층만큼 보여요.",
    explanation: `앞쪽 줄의 가장 큰 수 ${s[0]}, 뒤쪽 줄의 가장 큰 수 ${s[1]} → 왼쪽부터 ${s[0]}층, ${s[1]}층 → ${c.answer}`,
  };
});

export const viewArea = mid("l6-view-area", (rand) => {
  const g = makeGrid(rand);
  if (!g) return null;
  const f = colMax(g);
  const v = f.reduce((a, b) => a + b, 0);
  return {
    key: g.flat().join(""),
    prompt: "위에서 본 모양의 각 칸에 쌓은 쌓기나무의 수를 적었습니다. 앞에서 본 모양에서 보이는 정사각형은 몇 개인가요?",
    visual: row([topBlock(g, true)], "위에서 본 모양(수 적음)"),
    answer: v,
    unit: "개",
    hint: "앞에서 보면 각 세로줄에서 가장 높은 층수만큼 정사각형이 보여요.",
    explanation: `${f.join(" + ")} = ${v}(개)`,
    mistakes: { [gridTotal(g)]: "전체 쌓기나무 수를 구했어요. 뒤에 가려진 것은 보이지 않아요." },
  };
});

const FULL: Grid = [
  [1, 1, 1],
  [1, 1, 1],
];

export const viewMax = word("l6-view-max", (rand) => {
  const f = [randInt(rand, 1, 3), randInt(rand, 1, 3), randInt(rand, 1, 3)];
  const back = randInt(rand, 1, Math.max(...f));
  const s = rand() < 0.5 ? [Math.max(...f), back] : [back, Math.max(...f)];
  // s: 오른쪽 옆에서 본 모양(왼쪽이 앞쪽 줄)
  const v = s.reduce((acc, si) => acc + f.reduce((a, fj) => a + Math.min(si, fj), 0), 0);
  return {
    key: `${f.join()}:${s.join()}`,
    prompt: "쌓기나무로 쌓은 모양을 위, 앞, 오른쪽 옆에서 본 모양입니다. 쌓기나무를 가장 많이 사용한 경우 쌓기나무는 몇 개인가요?",
    visual: row([topBlock(FULL, false, "위"), viewBlock(f, "앞"), viewBlock(s, "옆")], "위, 앞, 오른쪽 옆에서 본 모양", 40),
    answer: v,
    unit: "개",
    hint: "각 칸에는 그 칸이 속한 세로줄(앞에서 본 높이)과 가로줄(옆에서 본 높이) 중 낮은 쪽만큼 쌓을 수 있어요.",
    explanation: `앞쪽 줄 ${f.map((fj) => Math.min(s[0], fj)).join(" + ")}, 뒤쪽 줄 ${f.map((fj) => Math.min(s[1], fj)).join(" + ")} → ${v}개`,
  };
});

export const stackCuboidFill = word("l6-stack-cuboid-fill", (rand) => {
  const g = makeGrid(rand);
  if (!g) return null;
  return {
    key: g.flat().join(""),
    prompt: `${TOP} 쌓기나무를 더 쌓아서 가로 3개, 세로 2개, 높이 3층인 직육면체 모양을 만들려면 쌓기나무는 적어도 몇 개 더 필요한가요?`,
    visual: stackWithTop(g),
    answer: 18 - gridTotal(g),
    unit: "개",
    hint: "완성된 직육면체의 쌓기나무 수에서 지금 쌓기나무 수를 빼요.",
    explanation: `3 × 2 × 3 = 18, 지금 ${gridTotal(g)}개 → 18 − ${gridTotal(g)} = ${18 - gridTotal(g)}(개)`,
  };
});

/** 층별로 나타낸 모양(1층, 2층, …) */
const layersScene = (g: Grid, layers: number, hide = -1) =>
  row(
    Array.from({ length: layers }, (_, i) => (i === hide ? { w: 66, h: 44, cap: `${i + 1}층`, draw: (o: Pt): Parts => ({ texts: [text([o[0] + 33, o[1] + 22], "?")] }) } : layerBlock(g, i, `${i + 1}층`))),
    "층별로 나타낸 모양(색칠한 칸에 쌓기나무가 있음, 아래쪽이 앞)",
    30,
  );

export const layerCount = easy("l6-layer-count", (rand) => {
  const g = makeGrid(rand);
  if (!g) return null;
  const L = Math.max(...g.flat());
  const per = Array.from({ length: L }, (_, i) => g.flat().filter((c) => c > i).length);
  return {
    key: g.flat().join(""),
    prompt: "쌓기나무로 쌓은 모양을 층별로 나타낸 그림입니다. 색칠한 칸에 쌓기나무가 있습니다. 쌓기나무는 모두 몇 개인가요?",
    visual: layersScene(g, L),
    answer: gridTotal(g),
    unit: "개",
    hint: "층마다 색칠한 칸의 수를 세어 모두 더해요.",
    explanation: `${per.join(" + ")} = ${gridTotal(g)}(개)`,
  };
});

/** 쌓은 모양을 보고 ○층의 모양 고르기 */
export const layerPick = mid("l6-layer-pick", (rand) => {
  const g = makeGrid(rand);
  if (!g) return null;
  const L = Math.max(...g.flat());
  const k = randInt(rand, 1, L);
  const pattern = (layer: number) => g.map((r) => r.map((h) => (h > layer ? 1 : 0)));
  const target = pattern(k - 1);
  const others = [0, 1, 2].filter((i) => i !== k - 1).map(pattern);
  const flip = target.map((r) => [...r].reverse());
  const c = shapeChoices(rand, target, [...others, flip, [...target].reverse()], () => [0, 1].map(() => [0, 1, 2].map(() => randInt(rand, 0, 1))), (x, cap) => layerBlock(x, 0, cap, 20));
  return {
    key: `${g.flat().join("")}:${k}`,
    prompt: `${TOP} ${k}층에 쌓은 모양을 고르세요. (색칠한 칸에 쌓기나무가 있고, 아래쪽이 앞입니다.)`,
    visual: below(row([stackBlock(g, 24, "쌓은 모양"), topBlock(g, true, "위에서 본 모양", 24)], "쌓은 모양과 위에서 본 모양", 30), row(c.blocks, "보기 ①~④", 22), 4, "쌓은 모양, 위에서 본 모양과 보기 ①~④"),
    answer: c.answer,
    choices: c.choices,
    hint: `위에서 본 모양에서 ${k} 이상인 수가 적힌 칸에 ${k}층 쌓기나무가 있어요.`,
    explanation: `${k} 이상인 칸만 색칠한 모양 → ${c.answer}`,
  };
});

export const layerTopNumber = mid("l6-layer-top-number", (rand) => {
  const g = makeGrid(rand);
  if (!g) return null;
  const L = Math.max(...g.flat());
  const r = randInt(rand, 0, 1);
  const c = randInt(rand, 0, 2);
  const pos = ["왼쪽", "가운데", "오른쪽"][c];
  if (!g[r][c]) return null;
  return {
    key: `${g.flat().join("")}:${r}:${c}`,
    prompt: `쌓기나무로 쌓은 모양을 층별로 나타낸 그림입니다(아래쪽이 앞). 위에서 본 모양의 ${r === 0 ? "뒤쪽" : "앞쪽"} 줄 ${pos} 칸에 쓸 수는 얼마인가요?`,
    visual: layersScene(g, L),
    answer: g[r][c],
    hint: "같은 자리의 칸이 몇 층까지 색칠되어 있는지 세어요.",
    explanation: `${r === 0 ? "뒤쪽" : "앞쪽"} 줄 ${pos} 칸은 ${g[r][c]}층까지 쌓여 있어요.`,
  };
});

/** 1층과 3층 그림, 전체 개수로 2층의 개수 구하기 */
export const layerCond = word("l6-layer-cond", (rand) => {
  const g = makeGrid(rand);
  if (!g || Math.max(...g.flat()) < 3) return null;
  const per = [0, 1, 2].map((i) => g.flat().filter((c) => c > i).length);
  const total = gridTotal(g);
  return {
    key: g.flat().join(""),
    prompt: `쌓기나무 ${total}개로 3층짜리 모양을 쌓고 층별로 나타낸 그림입니다. 2층 그림이 지워졌습니다. 2층에 있는 쌓기나무는 몇 개인가요?`,
    visual: layersScene(g, 3, 1),
    answer: per[1],
    unit: "개",
    hint: "1층과 3층의 색칠한 칸을 세어 전체 개수에서 빼요.",
    explanation: `1층 ${per[0]}개, 3층 ${per[2]}개 → ${total} − ${per[0]} − ${per[2]} = ${per[1]}(개)`,
  };
});

/** 규칙에 따라 쌓은 모양(3층·3칸까지 그림)으로 n층·n칸의 쌓기나무 수 */
export const layerPattern = word("l6-layer-pattern", (rand) => {
  const n = randInt(rand, 4, 6);
  const square = rand() < 0.5;
  const v = square ? (n * (n + 1) * (2 * n + 1)) / 6 : (n * (n + 1)) / 2;
  const g = square
    ? [
        [1, 1, 1],
        [1, 2, 2],
        [1, 2, 3],
      ]
    : [[1, 2, 3]];
  return {
    key: `${n}:${square}`,
    prompt: square
      ? `쌓기나무를 맨 위층에 1개, 그 아래층에 2 × 2개, 그 아래층에 3 × 3개를 놓아 그림과 같이 3층으로 쌓았습니다. 같은 규칙으로 ${n}층까지 쌓으려면 쌓기나무는 모두 몇 개 필요한가요?`
      : `쌓기나무를 그림과 같이 첫째 칸에 1개, 둘째 칸에 2개, 셋째 칸에 3개 쌓아 계단 모양을 만들었습니다. 같은 규칙으로 ${n}칸까지 쌓으려면 쌓기나무는 모두 몇 개 필요한가요?`,
    visual: row([stackBlock(g, 26)], square ? "층마다 1개, 2 × 2개, 3 × 3개로 쌓은 모양" : "1개, 2개, 3개로 쌓은 계단 모양"),
    answer: v,
    unit: "개",
    hint: "층(칸)마다 필요한 쌓기나무 수의 규칙을 찾아 모두 더해요.",
    explanation: square ? `${Array.from({ length: n }, (_, i) => (i + 1) ** 2).join(" + ")} = ${v}(개)` : `${Array.from({ length: n }, (_, i) => i + 1).join(" + ")} = ${v}(개)`,
  };
});

/** 위·앞·옆 모양에 맞는 쌓는 방법의 쌓기나무 수(모든 경우) */
function totalsFor(shape: Grid, f: number[], s: number[]): Set<number> {
  const cells = shape.flatMap((r, i) => r.map((h, c) => [i, c, h] as const)).filter(([, , h]) => h > 0);
  const out = new Set<number>();
  const cur: number[] = [];
  const go = (k: number) => {
    if (k === cells.length) {
      const g = shape.map((r) => r.map(() => 0));
      cells.forEach(([i, c], t) => (g[i][c] = cur[t]));
      if (colMax(g).join() === f.join() && sideOf(g).join() === s.join()) out.add(cur.reduce((a, b) => a + b, 0));
      return;
    }
    for (let h = 1; h <= 3; h++) {
      cur[k] = h;
      go(k + 1);
    }
  };
  go(0);
  return out;
}

/** 위·앞·옆에서 본 모양으로 쌓기나무 수가 하나로 정해지는 경우만 */
export const rowFront = easy("l6-row-front", (rand) => {
  const g = makeGrid(rand);
  if (!g) return null;
  const f = colMax(g);
  const s = sideOf(g);
  const totals = totalsFor(g, f, s);
  if (totals.size !== 1) return null;
  return {
    key: g.flat().join(""),
    prompt: "쌓기나무로 쌓은 모양을 위, 앞, 오른쪽 옆에서 본 모양입니다. 쌓기나무는 모두 몇 개인가요?",
    visual: row([topBlock(g, false, "위"), viewBlock(f, "앞"), viewBlock(s, "옆")], "위, 앞, 오른쪽 옆에서 본 모양", 40),
    answer: gridTotal(g),
    unit: "개",
    hint: "위에서 본 모양의 칸마다 앞과 옆에서 본 높이를 함께 생각해 몇 층인지 정해요.",
    explanation: `위에서 본 모양의 각 칸에 수를 쓰면 뒤쪽 줄 ${g[0].join(", ")}, 앞쪽 줄 ${g[1].join(", ")} (0은 빈칸) → ${gridTotal(g)}개`,
  };
});

/** 한 줄로 쌓은 모양: 앞에서 본 모양 그림에서 가린 줄의 높이 구하기 */
export const rowBlank = mid("l6-row-blank", (rand) => {
  const hs = Array.from({ length: randInt(rand, 3, 5) }, () => randInt(rand, 1, 4));
  const i = randInt(rand, 0, hs.length - 1);
  const v = hs.reduce((a, b) => a + b, 0);
  const s = 20;
  const shown = hs.map((h, k) => (k === i ? 0 : h));
  return {
    key: `${hs.join()}:${i}`,
    prompt: `쌓기나무 ${v}개를 한 줄로 늘어놓아 쌓았습니다. 앞에서 본 모양에서 물음표(?)로 가린 줄에는 쌓기나무가 몇 층 쌓여 있나요?`,
    visual: row(
      [
        {
          w: hs.length * s,
          h: 4 * s,
          cap: "앞에서 본 모양",
          draw: (o: Pt): Parts => {
            const shape = viewBlock(shown, undefined, 4, s).draw(o);
            return {
              ...shape,
              polygons: [...(shape.polygons ?? []), { points: [[o[0] + i * s, o[1]], [o[0] + (i + 1) * s, o[1]], [o[0] + (i + 1) * s, o[1] + 4 * s], [o[0] + i * s, o[1] + 4 * s]], fill: true }],
              texts: [text([o[0] + i * s + s / 2, o[1] + 2 * s], "?")],
            };
          },
        },
      ],
      "한 줄로 쌓은 쌓기나무를 앞에서 본 모양, 한 줄은 가려져 있음",
    ),
    answer: hs[i],
    unit: "층",
    hint: "한 줄로 쌓았으므로 앞에서 본 높이가 곧 그 줄의 쌓기나무 수예요. 전체 개수에서 보이는 줄의 개수를 빼요.",
    explanation: `${v} − ${hs.filter((_, k) => k !== i).join(" − ")} = ${hs[i]}(층)`,
  };
});

/** 쌓은 모양에 더 쌓아 정육면체 만들기(3 × 3 × 3) */
export const completeCube = word("w6-complete-cube", (rand) => {
  const g = makeGrid(rand, 3, 3);
  if (!g) return null;
  const total = gridTotal(g);
  return {
    key: g.flat().join(""),
    prompt: `${TOP} 쌓기나무를 더 쌓아서 가로, 세로, 높이가 각각 3개인 정육면체 모양을 만들려면 쌓기나무는 적어도 몇 개 더 필요한가요?`,
    visual: row([stackBlock(g, 22, "쌓은 모양"), topBlock(g, true, "위에서 본 모양", 24)], "쌓기나무로 쌓은 모양과 위에서 본 모양(수 적음)", 30),
    answer: 27 - total,
    unit: "개",
    hint: "정육면체 모양에 필요한 쌓기나무는 3 × 3 × 3개예요. 지금 쌓기나무 수를 위에서 본 모양의 수로 세어요.",
    explanation: `3 × 3 × 3 = 27, 지금 ${g.flat().filter((c) => c).join(" + ")} = ${total}(개) → 27 − ${total} = ${27 - total}(개)`,
  };
});

/** 쌓은 모양 그림만 보고 개수 세기(뒤쪽 줄의 맨 위가 보이는 모양만) */
export const stackCount = mid("l6-stack-count", (rand) => {
  const g = makeGrid(rand);
  if (!g) return null;
  if (g[0].some((b, c) => b > 0 && g[1][c] > 0 && b <= g[1][c])) return null;
  const total = gridTotal(g);
  return {
    key: g.flat().join(""),
    prompt: "쌓기나무로 쌓은 모양입니다. 쌓기나무는 모두 몇 개인가요? (보이지 않는 곳에는 위의 쌓기나무를 받치는 쌓기나무만 있습니다.)",
    visual: row([stackBlock(g, 28)], "쌓기나무로 쌓은 모양"),
    answer: total,
    unit: "개",
    hint: "층별로 세거나, 위에서 본 모양의 칸마다 몇 층인지 세어 더해요. 뒤쪽 줄의 아래층은 앞에 가려져 있어요.",
    explanation: `위에서 본 모양의 각 칸에 수를 쓰면 뒤쪽 줄 ${g[0].join(", ")}, 앞쪽 줄 ${g[1].join(", ")} (0은 빈칸) → ${total}개`,
    mistakes: { [g[1].reduce((a, b) => a + b, 0) + g[0].reduce((a, b, c) => a + Math.max(0, b - g[1][c]), 0)]: "가려진 쌓기나무를 빠뜨렸어요." },
  };
});

export const viewMinMax = word("l6-view-minmax", (rand) => {
  const f = [randInt(rand, 1, 3), randInt(rand, 1, 3), randInt(rand, 1, 3)];
  const most = rand() < 0.5;
  const v = most ? f.reduce((a, b) => a + 2 * b, 0) : f.reduce((a, b) => a + b + 1, 0);
  return {
    key: `${f.join()}:${most}`,
    prompt: `쌓기나무로 쌓은 모양을 위와 앞에서 본 모양입니다. 쌓기나무를 가장 ${most ? "많이" : "적게"} 사용한 경우 쌓기나무는 몇 개인가요?`,
    visual: row([topBlock(FULL, false, "위"), viewBlock(f, "앞")], "위, 앞에서 본 모양", 40),
    answer: v,
    unit: "개",
    hint: most ? "각 세로줄의 두 칸 모두 앞에서 본 높이만큼 쌓을 수 있어요." : "각 세로줄에서 한 칸만 앞에서 본 높이만큼 쌓고, 다른 칸은 1개만 놓아요.",
    explanation: most ? `(${f.join(" + ")}) × 2 = ${v}(개)` : `${f.map((h) => `${h} + 1`).join(" + ")} = ${v}(개)`,
  };
});

export const viewJudge = word("l6-view-judge", (rand) => {
  const g = makeGrid(rand);
  if (!g) return null;
  const f = colMax(g);
  const fs = f.reduce((a, b) => a + b, 0);
  const total = gridTotal(g);
  if (fs === total) return null;
  const [p] = names(rand, 1);
  return {
    key: g.flat().join(""),
    prompt: `위에서 본 모양의 각 칸에 쌓은 쌓기나무의 수를 적었습니다. ${p}는 "앞에서 본 모양이 왼쪽부터 ${f.map((h) => `${h}층`).join(", ")}이니까 쌓기나무는 ${fs}개야."라고 말했습니다. 실제 쌓기나무는 몇 개인가요?`,
    visual: row([topBlock(g, true)], "위에서 본 모양(수 적음)"),
    answer: String(total),
    choices: opts(rand, String(total), [String(fs), String(g.flat().filter((c) => c > 0).length), String(total + 1)], () => String(total + 2)),
    hint: "앞에서 볼 때 뒤쪽 줄에 가려진 쌓기나무도 세어야 해요.",
    explanation: `모든 칸의 수를 더하면 ${g.flat().filter((c) => c).join(" + ")} = ${total}(개)`,
  };
});

/* ── 6-2-4 비례식과 비례배분 ── */

/** 비율 표기: 후항이 1이면 자연수로(3/1 → 3) */
const rateText = (a: number, b: number) => (b === 1 ? String(a) : `${a}/${b}`);

const coprimePair = (rand: () => number) => {
  const a = randInt(rand, 1, 9);
  const b = randInt(rand, 1, 9);
  if (a === b || gcd(a, b) !== 1) return null;
  return [a, b] as const;
};

export const ratioEq = easy("l6-ratio-eq", (rand) => {
  const p = coprimePair(rand);
  if (!p) return null;
  const [a, b] = p;
  const k = randInt(rand, 2, 6);
  const answer = `${a * k} : ${b * k}`;
  return {
    key: `${a}:${b}:${k}`,
    prompt: `${a} : ${j(b, "와")} 비율이 같은 비를 고르세요.`,
    answer,
    choices: opts(rand, answer, [`${a + k} : ${b + k}`, `${a * k} : ${b}`, `${b * k} : ${a * k}`], () => `${a * k} : ${b * k + 1}`),
    hint: "비의 전항과 후항에 0이 아닌 같은 수를 곱해도 비율은 같아요.",
    explanation: `${a} × ${k} : ${b} × ${k} = ${answer}`,
  };
});

export const ratioPropBlank = mid("l6-ratio-prop-blank", (rand) => {
  const p = coprimePair(rand);
  if (!p) return null;
  const [a, b] = p;
  const k = randInt(rand, 2, 9);
  const divide = rand() < 0.5;
  return {
    key: `${a}:${b}:${k}:${divide}`,
    prompt: divide
      ? `${a * k} : ${b * k}의 전항과 후항을 ${j(k, "로")} 나누면 ${a} : □가 됩니다. □ 안에 알맞은 수를 구하세요.`
      : `${a} : ${b}의 전항과 후항에 ${j(k, "를")} 곱하면 ${a * k} : □가 됩니다. □ 안에 알맞은 수를 구하세요.`,
    answer: divide ? b : b * k,
    hint: "전항과 후항에 같은 수를 곱하거나 나누어요.",
    explanation: divide ? `${b * k} ÷ ${k} = ${b}` : `${b} × ${k} = ${b * k}`,
  };
});

export const ratioSameRate = mid("l6-ratio-same-rate", (rand) => {
  const p = coprimePair(rand);
  if (!p) return null;
  const [a, b] = p;
  const k = randInt(rand, 2, 9);
  return {
    key: `${a}:${b}:${k}`,
    prompt: `비율이 ${rateText(a, b)}이고 후항이 ${b * k}인 비의 전항은 얼마인가요?`,
    answer: a * k,
    hint: `후항이 ${b}의 몇 배인지 생각해요.`,
    explanation: `${b} × ${k} = ${b * k}이므로 전항은 ${a} × ${k} = ${a * k}`,
  };
});

export const ratioPropCond = word("l6-ratio-prop-cond", (rand) => {
  const p = coprimePair(rand);
  if (!p) return null;
  const [a, b] = p;
  const k = randInt(rand, 2, 8);
  const answer = `${a * k} : ${b * k}`;
  return {
    key: `${a}:${b}:${k}`,
    prompt: `다음 조건을 모두 만족하는 비를 고르세요.\n· 비율이 ${rateText(a, b)}입니다.\n· 전항과 후항의 합이 ${(a + b) * k}입니다.`,
    answer,
    choices: opts(rand, answer, [`${b * k} : ${a * k}`, `${a} : ${b}`, `${a * k + 1} : ${b * k - 1}`], () => `${a * (k + 1)} : ${b * (k + 1)}`),
    hint: `전항과 후항은 ${a} : ${b}에 같은 수를 곱한 것이에요.`,
    explanation: `(${a} + ${b}) × □ = ${(a + b) * k} → □ = ${k}, ${answer}`,
  };
});

export const ratioPropError = word("l6-ratio-prop-error", (rand) => {
  const p = coprimePair(rand);
  if (!p) return null;
  const [a, b] = p;
  const k = randInt(rand, 2, 6);
  const [nm] = names(rand, 1);
  const answer = `${a * k} : ${b * k}`;
  return {
    key: `${a}:${b}:${k}`,
    prompt: `${nm}는 ${a} : ${j(b, "와")} 비율이 같은 비를 만들려고 전항에만 ${j(k, "를")} 곱해 ${a * k} : ${j(b, "라고")} 썼습니다. 전항과 후항에 모두 ${j(k, "를")} 곱해 바르게 만든 비를 고르세요.`,
    answer,
    choices: opts(rand, answer, [`${a * k} : ${b}`, `${a} : ${b * k}`, `${a + k} : ${b + k}`], () => `${b * k} : ${a * k}`),
    hint: "비의 성질: 전항과 후항에 같은 수를 곱해야 비율이 같아요.",
    explanation: `${a} × ${k} : ${b} × ${k} = ${answer}`,
  };
});

export const simplifyNat = easy("l6-simplify-nat", (rand) => {
  const p = coprimePair(rand);
  if (!p) return null;
  const [a, b] = p;
  const g = randInt(rand, 2, 9);
  const answer = `${a} : ${b}`;
  return {
    key: `${a}:${b}:${g}`,
    prompt: `${a * g} : ${j(b * g, "를")} 가장 간단한 자연수의 비로 나타낸 것을 고르세요.`,
    answer,
    choices: opts(rand, answer, [`${b} : ${a}`, `${a * 2} : ${b * 2}`, `${a + 1} : ${b + 1}`], () => `${a} : ${b + 1}`),
    hint: "전항과 후항을 두 수의 최대공약수로 나누어요.",
    explanation: `${a * g} ÷ ${g} : ${b * g} ÷ ${g} = ${answer}`,
  };
});

export const simplifyDec = mid("l6-simplify-dec", (rand) => {
  const p = coprimePair(rand);
  if (!p) return null;
  const [a, b] = p;
  const g = randInt(rand, 1, 5);
  const answer = `${a} : ${b}`;
  return {
    key: `${a}:${b}:${g}`,
    prompt: `${trim((a * g) / 10)} : ${j(trim((b * g) / 10), "를")} 가장 간단한 자연수의 비로 나타낸 것을 고르세요.`,
    answer,
    choices: opts(rand, answer, [`${b} : ${a}`, `${a * g} : ${b * g + 1}`, `${a + 1} : ${b}`], () => `${a * 3} : ${b * 2}`),
    hint: "전항과 후항에 10을 곱해 자연수로 만든 뒤 최대공약수로 나누어요.",
    explanation: `× 10 → ${a * g} : ${b * g} → ${answer}`,
  };
});

export const simplifyFrac = mid("l6-simplify-frac", (rand) => {
  const x = randInt(rand, 2, 9);
  const y = randInt(rand, 2, 9);
  if (x === y) return null;
  const g = gcd(x, y);
  const answer = `${y / g} : ${x / g}`;
  return {
    key: `${x}:${y}`,
    prompt: `1/${x} : 1/${y}을 가장 간단한 자연수의 비로 나타낸 것을 고르세요.`,
    answer,
    choices: opts(rand, answer, [`${x / g} : ${y / g}`, `1 : ${y}`, `${x} : 1`], () => `${y} : ${x + 1}`),
    hint: "전항과 후항에 두 분모의 공배수를 곱해요.",
    explanation: `× ${(x * y) / g} → ${y / g} : ${x / g}`,
    mistakes: { [`${x / g} : ${y / g}`]: "분모끼리의 비로 썼어요. 분모가 클수록 분수는 작아요." },
  };
});

export const simplifyWork = word("l6-simplify-work", (rand) => {
  const x = randInt(rand, 2, 9);
  const y = randInt(rand, 2, 9);
  if (x === y) return null;
  const [p1, p2] = names(rand, 2);
  const g = gcd(x, y);
  const answer = `${y / g} : ${x / g}`;
  return {
    key: `${x}:${y}`,
    prompt: `어떤 일을 ${p1}는 혼자서 ${x}일 만에, ${p2}는 혼자서 ${y}일 만에 끝낼 수 있습니다. ${p1}와 ${p2}가 하루에 하는 일의 양을 가장 간단한 자연수의 비로 나타낸 것을 고르세요.`,
    answer,
    choices: opts(rand, answer, [`${x / g} : ${y / g}`, `${x} : ${y + 1}`, `1 : ${x + y}`], () => `${y + 1} : ${x}`),
    hint: `전체 일의 양을 1이라 하면 하루에 ${p1}는 1/${x}, ${p2}는 1/${y}만큼 해요.`,
    explanation: `1/${x} : 1/${y} → × ${(x * y) / g} → ${answer}`,
    mistakes: { [`${x / g} : ${y / g}`]: "걸린 날수의 비예요. 하루에 하는 일의 양과는 반대예요." },
  };
});

export const simplifyMix = word("l6-simplify-mix", (rand) => {
  const d = pick(rand, [2, 4, 5]);
  const n = randInt(rand, 1, d - 1);
  const t = randInt(rand, 1, 9);
  if (gcd(n, d) !== 1) return null;
  const A = t * d;
  const B = n * 10;
  const g = gcd(A, B);
  // 가로와 세로가 같으면(0.5 m와 1/2 m) 답이 1 : 1로 굳으므로 다시 뽑기
  if (A === B) return null;
  const answer = `${A / g} : ${B / g}`;
  return {
    key: `${t}:${n}/${d}`,
    prompt: `가로가 ${t / 10} m, 세로가 ${n}/${d} m인 액자가 있습니다. 가로와 세로의 비를 가장 간단한 자연수의 비로 나타낸 것을 고르세요.`,
    answer,
    choices: opts(rand, answer, [`${B / g} : ${A / g}`, `${t} : ${n}`, `${t} : ${d}`], () => `${randInt(rand, 1, 9)} : ${randInt(rand, 1, 9)}`),
    hint: `분수를 소수로 바꾸거나 소수를 분수로 바꾸어 같은 형태로 만들어요. ${n}/${d} = ${trim(n / d)}`,
    explanation: `${t / 10} : ${trim(n / d)} → × 10 → ${t} : ${trim((n / d) * 10)} → ${answer}`,
  };
});

export const propCheck = mid("l6-prop-check", (rand) => {
  const p = coprimePair(rand);
  if (!p) return null;
  const [a, b] = p;
  const k = randInt(rand, 2, 5);
  const answer = `${a} : ${b} = ${a * k} : ${b * k}`;
  return {
    key: `${a}:${b}:${k}`,
    prompt: "비례식을 고르세요.",
    answer,
    choices: opts(rand, answer, [`${a} : ${b} = ${b * k} : ${a * k}`, `${a} : ${b} = ${a + k} : ${b + k}`, `${a} : ${b} = ${a * k} : ${b * k + 1}`], () => `${a} : ${b} = ${a * k} : ${b}`),
    hint: "외항의 곱과 내항의 곱이 같은지 확인해요.",
    explanation: `${a} × ${b * k} = ${b} × ${a * k} = ${a * b * k}`,
  };
});

export const propDecimal = mid("l6-prop-decimal", (rand) => {
  const a = randInt(rand, 1, 9);
  const b = randInt(rand, 2, 9);
  const k = randInt(rand, 2, 9);
  return {
    key: `${a}:${b}:${k}`,
    prompt: "비례식에서 □ 안에 알맞은 수를 구하세요.",
    expression: `${a / 10} : ${b} = □ : ${b * k}`,
    answer: trim((a / 10) * k),
    hint: "외항의 곱과 내항의 곱이 같아요.",
    explanation: `${a / 10} × ${b * k} = ${b} × □ → □ = ${trim((a / 10) * k)}`,
  };
});

export const propCond = word("l6-prop-cond", (rand) => {
  const p = coprimePair(rand);
  if (!p) return null;
  const [a, b] = p;
  const k = randInt(rand, 2, 6);
  const m = randInt(rand, 1, 4);
  const [x, y, z, w] = [a * m, b * m, a * k, b * k];
  return {
    key: `${a}:${b}:${k}:${m}`,
    prompt: `비례식 ${x} : ${y} = □ : ◇에서 외항의 곱이 ${x * w}입니다. □ + ◇는 얼마인가요?`,
    answer: z + w,
    hint: `외항의 곱 ${x} × ◇ = ${x * w}에서 ◇를 먼저 구해요.`,
    explanation: `◇ = ${x * w} ÷ ${x} = ${w}, 내항의 곱 ${y} × □ = ${x * w} → □ = ${z}, ${z} + ${w} = ${z + w}`,
  };
});

export const propError = word("l6-prop-error", (rand) => {
  const p = coprimePair(rand);
  if (!p) return null;
  const [a, b] = p;
  const k = randInt(rand, 2, 6);
  const [nm] = names(rand, 1);
  const answer = String(b * k);
  const wrong = reduced(a * a * k, b);
  if (answer === wrong) return null;
  return {
    key: `${a}:${b}:${k}`,
    prompt: `${nm}는 비례식 ${a} : ${b} = ${a * k} : □에서 ${a} × ${a * k} = ${b} × □로 식을 세웠습니다. 바르게 식을 세워 □를 구한 값을 고르세요.`,
    answer,
    choices: opts(rand, answer, [wrong, String(b + k), String(a * k)], () => String(b * k + 1)),
    hint: "외항끼리, 내항끼리 곱해야 해요. 외항은 바깥쪽 두 수예요.",
    explanation: `${a} × □ = ${b} × ${a * k} → □ = ${b * k}`,
  };
});

/** 밀가루가 설탕보다 많은 현실적인 비(3 : 1, 5 : 2, …)와 양 */
export const propRecipe = easy("l6-prop-recipe", (rand) => {
  const [a, b] = pick(rand, [[2, 1], [3, 1], [3, 2], [4, 1], [4, 3], [5, 2], [5, 3]] as const);
  const k = randInt(rand, 2, 4);
  return {
    key: `${a}:${b}:${k}`,
    prompt: `쿠키를 만들 때 밀가루와 설탕을 ${a} : ${j(b, "로")} 섞습니다. 밀가루를 ${a * k}컵 넣으면 설탕은 몇 컵 넣어야 하나요?`,
    answer: b * k,
    unit: "컵",
    hint: `비례식 ${a} : ${b} = ${a * k} : □를 세워요.`,
    explanation: `${a} × □ = ${b} × ${a * k} → □ = ${b * k}(컵)`,
  };
});

export const propMap = mid("l6-prop-map", (rand) => {
  const s = pick(rand, [100, 200, 250, 500]);
  const x = randInt(rand, 2, 15);
  return {
    key: `${s}:${x}`,
    prompt: `지도에서 1 cm가 실제 거리 ${s} m를 나타냅니다. 지도에서 ${x} cm인 두 곳 사이의 실제 거리는 몇 m인가요?`,
    answer: s * x,
    unit: "m",
    hint: `비례식 1 : ${s} = ${x} : □를 세워요.`,
    explanation: `□ = ${s} × ${x} = ${s * x}(m)`,
  };
});

export const propGear = mid("l6-prop-gear", (rand) => {
  const a = randInt(rand, 10, 40);
  const b = randInt(rand, 10, 40);
  const turnsA = b / gcd(a, b) * randInt(rand, 1, 3);
  if (a === b) return null;
  const turnsB = (a * turnsA) / b;
  return {
    key: `${a}:${b}:${turnsA}`,
    prompt: `서로 맞물려 도는 두 톱니바퀴가 있습니다. 가의 톱니는 ${a}개, 나의 톱니는 ${b}개입니다. 가가 ${turnsA}바퀴 도는 동안 나는 몇 바퀴 도나요?`,
    answer: turnsB,
    unit: "바퀴",
    hint: "맞물린 톱니의 수는 같아요. (톱니 수) × (바퀴 수)가 같아요.",
    explanation: `${a} × ${turnsA} = ${b} × □ → □ = ${turnsB}(바퀴)`,
  };
});

export const propShadow = word("l6-prop-shadow", (rand) => {
  const a = randInt(rand, 1, 3);
  const b = randInt(rand, 1, 4);
  const k = randInt(rand, 3, 8);
  const m = randInt(rand, 2, 6);
  if (a === b || k === m) return null;
  return {
    key: `${a}:${b}:${k}:${m}`,
    prompt: `같은 시각에 길이가 ${a} m인 막대의 그림자는 ${b} m였습니다. 이때 나무의 그림자는 ${b * k} m, 건물의 그림자는 ${b * m} m였습니다. 나무와 건물의 높이의 차는 몇 m인가요?`,
    answer: a * Math.abs(k - m),
    unit: "m",
    hint: `(높이) : (그림자 길이) = ${a} : ${j(b, "로")} 비례식을 세워 각각의 높이를 구해요.`,
    explanation: `나무 ${a * k} m, 건물 ${a * m} m → 차 ${a * Math.abs(k - m)} m`,
  };
});

export const shareExpr = mid("l6-share-expr", (rand) => {
  const p = coprimePair(rand);
  if (!p) return null;
  const [a, b] = p;
  const total = (a + b) * randInt(rand, 2, 9);
  const answer = `${total} × ${a}/${a + b}`;
  return {
    key: `${a}:${b}:${total}`,
    prompt: `${j(total, "를")} ${a} : ${j(b, "로")} 비례배분할 때 앞의 수를 구하는 식을 고르세요.`,
    answer,
    choices: opts(rand, answer, [`${total} × ${a}/${b}`, `${total} × ${b}/${a + b}`, `${total} ÷ ${a}/${a + b}`], () => `${total} × ${b}/${a}`),
    hint: "전체 × (나의 비)/(비의 합)",
    explanation: `${answer} = ${(total * a) / (a + b)}`,
  };
});

export const shareReverse = word("l6-share-reverse", (rand) => {
  const p = coprimePair(rand);
  if (!p) return null;
  const [a, b] = p;
  const u = randInt(rand, 2, 12);
  return {
    key: `${a}:${b}:${u}`,
    prompt: `구슬을 형과 동생이 ${a} : ${j(b, "로")} 나누어 가졌더니 형이 ${a * u}개를 가졌습니다. 처음 구슬은 모두 몇 개였나요?`,
    answer: (a + b) * u,
    unit: "개",
    hint: `형의 몫은 전체의 ${a}/${a + b}${josa(a, "이에요/예요").slice(String(a).length)}.`,
    explanation: `전체 × ${a}/${a + b} = ${a * u} → 전체 = ${(a + b) * u}(개)`,
    mistakes: { [b * u]: "동생이 가진 구슬 수를 구했어요." },
  };
});

/* ── 6-2-5 원의 넓이 ── */

const PI = 3.14;
const C0: Pt = [100, 88];
const R0 = 70;

/** 원 그림(200 × 176): 중심, 반지름(오른쪽) 또는 지름(가로)에 글자 */
function circleScene(len: "r" | "d" | null, t: string | null, label: string, ...extra: Parts[]): ShapeScene {
  const lines: NonNullable<ShapeScene["lines"]> = [];
  const texts: NonNullable<ShapeScene["texts"]> = [];
  if (len === "r") {
    lines.push({ from: C0, to: [C0[0] + R0, C0[1]] });
    if (t) texts.push(labelOut(C0, [C0[0] + R0, C0[1]], [C0[0], C0[1] + 30], t));
  } else if (len === "d") {
    lines.push({ from: [C0[0] - R0, C0[1]], to: [C0[0] + R0, C0[1]] });
    if (t) texts.push(labelOut([C0[0] - R0, C0[1]], [C0[0] + R0, C0[1]], [C0[0], C0[1] + 30], t));
  }
  return compose(200, 176, label, { circles: [{ c: C0, r: R0 }], dots: [C0], lines, texts }, ...extra);
}
const rLabel = (giveD: boolean, r: number) => (giveD ? `지름이 ${2 * r} cm인 원` : `반지름이 ${r} cm인 원`);

type Mark = { q: string; a: string; c: string[] };
const PI_MARKS: Mark[] = [
  { q: "그림에서 원의 둘레 ㉠을 무엇이라고 하나요?", a: "원주", c: ["원주", "원주율", "지름", "중심"] },
  { q: "그림에서 (㉠의 길이) ÷ (㉡의 길이)를 무엇이라고 하나요?", a: "원주율", c: ["원주율", "원주", "반지름", "넓이"] },
  { q: "그림에서 원주 ㉠은 지름 ㉡의 약 몇 배인가요?", a: "약 3.14배", c: ["약 3.14배", "약 2배", "약 4배", "약 6.28배"] },
  { q: "원의 크기가 달라지면 그림에서 (㉠의 길이) ÷ (㉡의 길이)는 어떻게 되나요?", a: "항상 같습니다", c: ["항상 같습니다", "커집니다", "작아집니다", "원에 따라 다릅니다"] },
];

/** 원주(㉠)와 지름(㉡)을 표시한 그림으로 원주율의 뜻 */
export const piFact = easy("l6-pi-fact", (rand) => {
  const f = pick(rand, PI_MARKS);
  const at = (deg: number, r: number): Pt => [C0[0] + r * Math.cos((deg * Math.PI) / 180), C0[1] - r * Math.sin((deg * Math.PI) / 180)];
  return {
    key: f.q,
    prompt: f.q,
    visual: circleScene("d", "㉡", "원주 ㉠과 지름 ㉡을 표시한 원", { arcs: [{ c: C0, r: R0, from: 20, to: 70, width: 4 }], texts: [text(at(45, R0 + 14), "㉠")] }),
    answer: f.a,
    choices: shuffle(rand, f.c),
    hint: "원의 둘레를 원주라 하고, 원주율 = (원주) ÷ (지름)이에요.",
    explanation: `${f.a}입니다. 원주율은 원의 크기와 관계없이 약 3.14로 일정해요.`,
  };
});

/** 잰 원주를 지름으로 나누어 반올림하면 약 3.14 */
export const piCompute = mid("l6-pi-compute", (rand) => {
  const d = randInt(rand, 8, 30);
  const c = Math.round(d * Math.PI * 10) / 10;
  const q = Math.round((c / d) * 100) / 100;
  return {
    key: `${d}`,
    prompt: `그림과 같이 지름이 ${d} cm인 원의 원주를 재었더니 ${trim(c)} cm였습니다. (원주) ÷ (지름)을 반올림하여 소수 둘째 자리까지 나타내세요.`,
    visual: circleScene("d", `${d} cm`, `지름이 ${d} cm인 원`),
    answer: trim(q),
    hint: "원주를 지름으로 나누어 소수 셋째 자리에서 반올림해요.",
    explanation: `${trim(c)} ÷ ${d} = ${trim(c / d, 4)}… → ${trim(q)}. 원의 크기와 관계없이 약 3.14예요.`,
  };
});

const regular = (n: number, r: number, start: number): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const a = ((start + (360 * i) / n) * Math.PI) / 180;
    return [Math.round((C0[0] + r * Math.cos(a)) * 10) / 10, Math.round((C0[1] - r * Math.sin(a)) * 10) / 10];
  });

export const circEst = mid("l6-circ-est", (rand) => {
  const d = randInt(rand, 2, 20);
  const answer = `${3 * d} cm보다 길고 ${4 * d} cm보다 짧습니다.`;
  return {
    key: `${d}`,
    prompt: `그림과 같이 지름이 ${d} cm인 원 안에 정육각형을, 원 밖에 정사각형을 꼭 맞게 그렸습니다. 원주를 어림한 것으로 알맞은 것을 고르세요.`,
    visual: circleScene("d", `${d} cm`, `지름 ${d} cm인 원과 원 안의 정육각형, 원 밖의 정사각형`, { polygons: [{ points: regular(6, R0, 0) }, { points: regular(4, R0 * Math.SQRT2, 45) }] }),
    answer,
    choices: opts(rand, answer, [`${2 * d} cm보다 길고 ${3 * d} cm보다 짧습니다.`, `${4 * d} cm보다 길고 ${5 * d} cm보다 짧습니다.`, `${d} cm보다 길고 ${2 * d} cm보다 짧습니다.`], () => answer),
    hint: "정육각형의 둘레는 지름의 3배, 정사각형의 둘레는 지름의 4배예요. 원주는 그 사이에 있어요.",
    explanation: `정육각형의 둘레 ${3 * d} cm < 원주 < 정사각형의 둘레 ${4 * d} cm`,
  };
});

export const piCompare = word("l6-pi-compare", (rand) => {
  const r = randInt(rand, 2, 10);
  const d = randInt(rand, 2, 20);
  if (2 * r === d) return null;
  return {
    key: `${r}:${d}`,
    prompt: `반지름이 ${r} cm인 원 가와 지름이 ${d} cm인 원 나가 있습니다. 두 원의 원주의 차는 몇 cm인가요? (원주율 3.14)`,
    answer: trim(Math.abs(2 * r - d) * PI),
    unit: "cm",
    hint: "두 원의 지름을 먼저 비교해요.",
    explanation: `가 ${trim(2 * r * PI)} cm, 나 ${trim(d * PI)} cm → 차 ${trim(Math.abs(2 * r - d) * PI)} cm`,
    mistakes: { [trim(Math.abs(r - d) * PI)]: "반지름과 지름을 그대로 비교했어요." },
  };
});

export const piError = word("l6-pi-error", (rand) => {
  const r = randInt(rand, 2, 10);
  const [p] = names(rand, 1);
  const answer = trim(2 * r * PI);
  return {
    key: `${r}`,
    prompt: `${p}는 반지름이 ${r} cm인 원의 원주를 ${r} × 3.14 = ${trim(r * PI)}(cm)로 구했습니다. 잘못된 곳을 찾아 바르게 구한 원주를 고르세요. (원주율 3.14)`,
    answer,
    choices: opts(rand, answer, [trim(r * PI), trim(r * r * PI), trim(4 * r * PI)], () => trim((2 * r + 1) * PI)),
    hint: "원주 = 지름 × 원주율이에요. 지름은 반지름의 2배예요.",
    explanation: `${r * 2} × 3.14 = ${answer}(cm)`,
  };
});

/** 그림의 원의 원주 */
export const circumference = easy("circumference", (rand) => {
  const r = randInt(rand, 1, 10);
  const giveD = rand() < 0.5;
  return {
    key: `${giveD}:${r}`,
    prompt: "그림과 같은 원의 원주는 몇 cm인가요? (원주율 3.14)",
    visual: circleScene(giveD ? "d" : "r", `${giveD ? 2 * r : r} cm`, rLabel(giveD, r)),
    answer: trim(2 * r * PI),
    unit: "cm",
    hint: "원주 = 지름 × 원주율",
    explanation: `${giveD ? "" : `지름 ${r} × 2 = ${2 * r}(cm), `}${2 * r} × 3.14 = ${trim(2 * r * PI)}(cm)`,
    mistakes: giveD ? {} : { [trim(r * PI)]: "반지름에 원주율을 곱했어요. 지름을 써야 해요." },
  };
});

/** 두 원은 같은 크기로 그린다(그림 크기로 답을 짐작하지 않게). 글자는 원 밖이나 반지름 선분 위 */
export const circCmp = mid("l6-circ-cmp", (rand) => {
  const d1 = randInt(rand, 2, 20);
  const r2 = randInt(rand, 1, 10);
  const R = 56;
  const [c1, c2]: Pt[] = [
    [100, 90],
    [300, 90],
  ];
  return {
    key: `${d1}:${r2}`,
    prompt: "두 원 가와 나의 원주를 비교하여 ○ 안에 >, =, < 중 알맞은 것을 고르세요. (그림의 크기는 실제와 다릅니다.)",
    expression: "가 ○ 나",
    visual: compose(400, 190, `원주가 ${trim(d1 * PI)} cm인 원 가와 반지름이 ${r2} cm인 원 나`, {
      circles: [
        { c: c1, r: R },
        { c: c2, r: R },
      ],
      dots: [c1, c2],
      lines: [{ from: c2, to: [c2[0] + R, c2[1]] }],
      texts: [text([c1[0], c1[1] + R + 18], `원주 ${trim(d1 * PI)} cm`), text([c2[0] + R / 2, c2[1] - 13], `${r2} cm`), text([c1[0], 14], "가"), text([c2[0], 14], "나")],
    }),
    answer: cmpText(d1, 2 * r2),
    choices: [...COMPARE_CHOICES],
    hint: "원주 ÷ 3.14로 가의 지름을 구해 나의 지름과 비교하면 원주를 비교할 수 있어요.",
    explanation: `가의 지름 ${trim(d1 * PI)} ÷ 3.14 = ${d1} cm, 나의 지름 ${2 * r2} cm → ${cmpText(d1, 2 * r2)}`,
  };
});

export const circumToDiameter = mid("m6-circum-diameter", (rand) => {
  const d = randInt(rand, 2, 20);
  return {
    key: `${d}`,
    prompt: `원주가 ${trim(d * PI)} cm인 원입니다. □ 안에 알맞은 수를 구하세요. (원주율 3.14)`,
    visual: circleScene("d", "□ cm", `원주가 ${trim(d * PI)} cm이고 지름이 □ cm인 원`),
    answer: d,
    unit: "cm",
    hint: "지름 = 원주 ÷ 원주율",
    explanation: `${trim(d * PI)} ÷ 3.14 = ${d}(cm)`,
  };
});

export const circWheelReverse = word("l6-circ-wheel-reverse", (rand) => {
  const d = pick(rand, [30, 40, 50, 60]);
  const n = randInt(rand, 2, 5);
  return {
    key: `${d}:${n}`,
    prompt: `바퀴를 ${n}바퀴 굴렸더니 ${trim(d * PI * n)} cm를 굴러갔습니다. 바퀴의 지름은 몇 cm인가요? (원주율 3.14)`,
    answer: d,
    unit: "cm",
    hint: "먼저 한 바퀴 굴러간 거리(원주)를 구해요.",
    explanation: `원주 ${trim(d * PI * n)} ÷ ${n} = ${trim(d * PI)}, 지름 ${trim(d * PI)} ÷ 3.14 = ${d}(cm)`,
    mistakes: { [trim(d * PI)]: "원주까지만 구했어요." },
  };
});

/** 원 안과 원 밖에 꼭 맞게 그린 정사각형 */
const squaresScene = (t: string | null, label: string) => {
  const sc = circleScene("r", null, label, { polygons: [{ points: regular(4, R0, 90) }, { points: regular(4, R0 * Math.SQRT2, 45) }] });
  if (!t) return sc;
  // 반지름 위쪽은 원 안 정사각형 변에 막혀 좁으므로(10 cm처럼 긴 글자) 반지름 위아래에서 변에 닿지 않는 자리를 찾는다
  const m: Pt = [C0[0] + R0 / 2, C0[1]];
  const spots = [-11, -13, 11, 13, -15, 15].flatMap((dy) => [0, 4, -4, 8, -8].map((dx): Pt => [m[0] + dx, m[1] + dy]));
  const at = findTextSpot(sc, t, spots, 1);
  return { ...sc, texts: [...(sc.texts ?? []), at ? { at, text: t } : labelOut(C0, [C0[0] + R0, C0[1]], [C0[0], C0[1] + 30], t)] };
};

export const areaEstOut = easy("l6-area-est-out", (rand) => {
  const r = randInt(rand, 2, 10);
  const inside = rand() < 0.5;
  return {
    key: `${r}:${inside}`,
    prompt: `그림과 같이 반지름이 ${r} cm인 원 안과 원 밖에 정사각형을 꼭 맞게 그렸습니다. 원 ${inside ? "안" : "밖"}의 정사각형의 넓이는 몇 cm²인가요?`,
    visual: squaresScene(`${r} cm`, `반지름 ${r} cm인 원과 원 안, 원 밖의 정사각형`),
    answer: inside ? 2 * r * r : 4 * r * r,
    unit: "cm²",
    hint: inside ? "원 안 정사각형은 두 대각선이 지름인 마름모로 보고 (대각선) × (대각선) ÷ 2로 구해요." : "원 밖 정사각형의 한 변은 원의 지름과 같아요.",
    explanation: inside ? `${2 * r} × ${2 * r} ÷ 2 = ${2 * r * r}(cm²)` : `${2 * r} × ${2 * r} = ${4 * r * r}(cm²)`,
  };
});

export const areaEstRange = mid("l6-area-est-range", (rand) => {
  const r = randInt(rand, 2, 10);
  const answer = `${2 * r * r} cm²보다 넓고 ${4 * r * r} cm²보다 좁습니다.`;
  return {
    key: `${r}`,
    prompt: `그림과 같이 반지름이 ${r} cm인 원 안과 원 밖에 정사각형을 꼭 맞게 그렸습니다. 원의 넓이를 어림한 것으로 알맞은 것을 고르세요.`,
    visual: squaresScene(`${r} cm`, `반지름 ${r} cm인 원과 원 안, 원 밖의 정사각형`),
    answer,
    choices: opts(rand, answer, [`${r * r} cm²보다 넓고 ${2 * r * r} cm²보다 좁습니다.`, `${4 * r * r} cm²보다 넓고 ${6 * r * r} cm²보다 좁습니다.`, `${2 * r} cm²보다 넓고 ${4 * r} cm²보다 좁습니다.`], () => `${3 * r * r} cm²보다 넓고 ${5 * r * r} cm²보다 좁습니다.`),
    hint: "원 안 정사각형 < 원 < 원 밖 정사각형",
    explanation: `원 안 정사각형 ${2 * r * r} cm², 원 밖 정사각형 ${4 * r * r} cm²`,
  };
});

/** 두 정사각형 넓이의 중간으로 원의 넓이 어림 */
export const areaEstMid = mid("l6-area-est-mid", (rand) => {
  const r = randInt(rand, 2, 10);
  return {
    key: `${r}`,
    prompt: `그림과 같이 반지름이 ${r} cm인 원 안과 원 밖에 정사각형을 꼭 맞게 그렸습니다. 원의 넓이를 두 정사각형의 넓이의 중간 정도로 어림하면 약 몇 cm²인가요?`,
    visual: squaresScene(`${r} cm`, `반지름 ${r} cm인 원과 원 안, 원 밖의 정사각형`),
    answer: 3 * r * r,
    unit: "cm²",
    hint: "두 정사각형의 넓이를 구해 더한 뒤 2로 나누어요.",
    explanation: `원 안 ${2 * r * r} cm², 원 밖 ${4 * r * r} cm² → (${2 * r * r} + ${4 * r * r}) ÷ 2 = ${3 * r * r}(cm²)`,
  };
});

/** 원 안·원 밖 정육각형으로 원의 넓이 어림(삼각형 6개) */
export const areaEstHex = word("l6-area-est-hex", (rand) => {
  const r = pick(rand, [4, 6, 8, 10]);
  const tin = Math.round(((Math.sqrt(3) / 4) * r * r) * 10) / 10;
  const tout = Math.round(((r * r) / Math.sqrt(3)) * 10) / 10;
  const inner = regular(6, R0, 0);
  const outer = regular(6, R0 / Math.cos(Math.PI / 6), 0);
  return {
    key: `${r}`,
    prompt: `반지름이 ${r} cm인 원 안과 원 밖에 정육각형을 꼭 맞게 그렸습니다. 삼각형 가의 넓이는 ${trim(tin)} cm², 삼각형 나의 넓이는 ${trim(tout)} cm²입니다. 원의 넓이는 몇 cm²보다 넓고 몇 cm²보다 좁은가요?`,
    visual: compose(200, 190, "원 안과 원 밖의 정육각형, 원 안 정육각형의 삼각형 가와 원 밖 정육각형의 삼각형 나", {
      circles: [{ c: C0, r: R0 }],
      polygons: [{ points: [C0, inner[4], inner[5]], fill: true }, { points: [C0, outer[1], outer[2]], fill: true }, { points: inner }, { points: outer }],
      dots: [C0],
      texts: [text([C0[0], C0[1] + 42], "가"), text([C0[0], C0[1] - 50], "나")],
    }),
    answer: `${trim(tin * 6)},${trim(tout * 6)}`,
    unit: ["cm²보다 넓고", "cm²보다 좁습니다"],
    hint: "정육각형은 합동인 삼각형 6개로 나눌 수 있어요. 원 안 정육각형 < 원 < 원 밖 정육각형",
    explanation: `원 안 정육각형 ${trim(tin)} × 6 = ${trim(tin * 6)}(cm²), 원 밖 정육각형 ${trim(tout)} × 6 = ${trim(tout * 6)}(cm²)`,
  };
});

/** 원주에서 반지름을 구한 뒤, 원 안·원 밖 정사각형으로 원의 넓이의 범위를 어림한다 */
export const areaEstBounds = word("l6-area-est-bounds", (rand) => {
  const r = randInt(rand, 2, 10);
  const c = trim(2 * r * PI);
  return {
    key: `${r}`,
    prompt: `원주가 ${c} cm인 원 안과 원 밖에 그림과 같이 정사각형을 꼭 맞게 그렸습니다. 이 원의 넓이를 어림하면 몇 cm²보다 넓고 몇 cm²보다 좁은가요? (원주율 3.14)`,
    visual: squaresScene(null, `원주가 ${c} cm인 원과 원 안, 원 밖의 정사각형`),
    answer: `${2 * r * r},${4 * r * r}`,
    unit: ["cm²보다 넓고", "cm²보다 좁습니다"],
    hint: "원주 ÷ 3.14로 지름을 구해요. 원 밖 정사각형의 한 변과 원 안 정사각형의 대각선은 모두 지름과 같아요.",
    explanation: `지름 ${c} ÷ 3.14 = ${2 * r}(cm), 원 안 정사각형 ${2 * r} × ${2 * r} ÷ 2 = ${2 * r * r}(cm²), 원 밖 정사각형 ${2 * r} × ${2 * r} = ${4 * r * r}(cm²)`,
  };
});

/** 원을 잘게 잘라 이어 붙인 모양(직사각형에 가까움): 왼쪽에 원, 오른쪽에 붙인 모양 */
function cutCircleScene(r: number): ShapeScene {
  const c: Pt = [70, 80];
  const R = 48;
  const n = 8;
  const lines: NonNullable<ShapeScene["lines"]> = [];
  for (let i = 0; i < n / 2; i++) {
    const a = (i * 2 * Math.PI) / n;
    lines.push({ from: [c[0] - R * Math.cos(a), c[1] + R * Math.sin(a)].map((v) => Math.round(v * 10) / 10) as Pt, to: [c[0] + R * Math.cos(a), c[1] - R * Math.sin(a)].map((v) => Math.round(v * 10) / 10) as Pt, width: 1.2 });
  }
  // 붙인 모양: 위 꼭짓점 x0 + k·w, 아래 꼭짓점 x0 + w/2 + k·w, 위·아래 가장자리는 조금 볼록한 곡선
  const W = Math.PI * R;
  const w = W / (n / 2);
  const x0 = 160;
  const yT = 56;
  const yB = yT + R;
  const bulge = (a: Pt, b: Pt, up: boolean): Pt[] =>
    Array.from({ length: 7 }, (_, i) => {
      const t = i / 6;
      return [Math.round((a[0] + (b[0] - a[0]) * t) * 10) / 10, Math.round((a[1] + (up ? -1 : 1) * 4 * Math.sin(Math.PI * t)) * 10) / 10];
    });
  const top: Pt[] = Array.from({ length: n / 2 + 1 }, (_, k) => [x0 + k * w, yT]);
  const bot: Pt[] = Array.from({ length: n / 2 + 1 }, (_, k) => [x0 - w / 2 + k * w, yB]);
  const outline: Pt[] = [
    ...top.slice(0, -1).flatMap((p, k) => bulge(p, top[k + 1], true).slice(0, -1)),
    top[n / 2],
    ...bot
      .slice(1)
      .reverse()
      .flatMap((p, k, arr) => bulge(p, arr[k + 1] ?? bot[0], false).slice(0, -1)),
    bot[0],
  ];
  for (let k = 0; k <= n / 2; k++) {
    if (k < n / 2) lines.push({ from: top[k], to: bot[k + 1], width: 1.2 });
    if (k > 0) lines.push({ from: top[k], to: bot[k], width: 1.2 });
  }
  return compose(400, 150, `반지름이 ${r} cm인 원을 잘게 잘라 이어 붙여 직사각형에 가까운 모양을 만든 그림`, {
    circles: [{ c, r: R }],
    polygons: [{ points: outline.map((p) => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10] as Pt) }],
    lines,
    texts: [text([x0 + W / 2 - w / 4, yB + 22], "㉠"), text([x0 - w / 4 - 16, (yT + yB) / 2], "㉡")],
  });
}

export const circleAreaCut = easy("e6-circle-area3", (rand) => {
  const r = randInt(rand, 2, 10);
  const askLen = rand() < 0.5;
  return {
    key: `${r}:${askLen}`,
    prompt: askLen
      ? `반지름이 ${r} cm인 원을 잘게 잘라 이어 붙여 직사각형에 가까운 모양을 만들었습니다. ㉠의 길이는 몇 cm인가요? (원주율 3)`
      : `반지름이 ${r} cm인 원을 잘게 잘라 이어 붙여 직사각형에 가까운 모양을 만들었습니다. 원의 넓이는 몇 cm²인가요? (원주율 3)`,
    visual: cutCircleScene(r),
    answer: askLen ? 3 * r : 3 * r * r,
    unit: askLen ? "cm" : "cm²",
    hint: "㉠(가로)은 원주의 1/2, ㉡(세로)은 반지름과 같아요. 원의 넓이 = (원주의 1/2) × (반지름)",
    explanation: askLen ? `원주의 1/2 = ${2 * r} × 3 ÷ 2 = ${3 * r}(cm)` : `(원주의 1/2) × (반지름) = ${3 * r} × ${r} = ${3 * r * r}(cm²)`,
  };
});

export const circleArea = mid("circle-area", (rand) => {
  const r = randInt(rand, 1, 10);
  const giveD = rand() < 0.4;
  return {
    key: `${giveD}:${r}`,
    prompt: "그림과 같은 원의 넓이는 몇 cm²인가요? (원주율 3.14)",
    visual: circleScene(giveD ? "d" : "r", `${giveD ? 2 * r : r} cm`, rLabel(giveD, r)),
    answer: trim(r * r * PI),
    unit: "cm²",
    hint: "원의 넓이 = 반지름 × 반지름 × 원주율",
    explanation: `${giveD ? `반지름 ${2 * r} ÷ 2 = ${r}(cm), ` : ""}${r} × ${r} × 3.14 = ${trim(r * r * PI)}(cm²)`,
    mistakes: { [trim(r * 2 * PI)]: "원주를 구했어요.", [trim(4 * r * r * PI)]: "지름으로 넓이를 구했어요." },
  };
});

export const areaFromCirc = mid("l6-area-from-circ", (rand) => {
  const r = randInt(rand, 1, 10);
  return {
    key: `${r}`,
    prompt: `원주가 ${trim(2 * r * PI)} cm인 원의 넓이는 몇 cm²인가요? (원주율 3.14)`,
    answer: trim(r * r * PI),
    unit: "cm²",
    hint: "원주로 지름을 구한 뒤 반지름을 구해요.",
    explanation: `지름 ${trim(2 * r * PI)} ÷ 3.14 = ${2 * r}, 반지름 ${r} → ${r} × ${r} × 3.14 = ${trim(r * r * PI)}(cm²)`,
    mistakes: { [trim(4 * r * r * PI)]: "지름으로 넓이를 구했어요." },
  };
});

export const areaReverse = word("l6-area-reverse", (rand) => {
  const r = randInt(rand, 2, 10);
  return {
    key: `${r}`,
    prompt: `넓이가 ${trim(r * r * PI)} cm²인 원의 원주는 몇 cm인가요? (원주율 3.14)`,
    answer: trim(2 * r * PI),
    unit: "cm",
    hint: "넓이 ÷ 3.14 = 반지름 × 반지름이에요. 먼저 반지름을 구해요.",
    explanation: `${trim(r * r * PI)} ÷ 3.14 = ${r * r} = ${r} × ${r} → 반지름 ${r}, 원주 ${2 * r} × 3.14 = ${trim(2 * r * PI)}(cm)`,
    mistakes: { [r]: "반지름까지만 구했어요." },
  };
});

/** 색칠한 고리 모양: 큰 반지름은 아래로, 작은 반지름은 왼쪽으로 긋고 글자는 선분 가운데 옆(원 테두리와 떨어지게) */
export const ringArea = word("w6-ring-area", (rand) => {
  const [R, r] = pick(rand, [[6, 4], [9, 6], [4, 3], [8, 6], [5, 4], [10, 7], [10, 8], [7, 5], [8, 7]] as const);
  const Rp = 100;
  const rp = Math.round((Rp * r) / R);
  const c: Pt = [120, 110];
  return {
    key: `${R}:${r}`,
    prompt: "그림은 중심이 같은 두 원입니다. 색칠한 부분의 넓이는 몇 cm²인가요? (원주율 3.14)",
    visual: compose(240, 220, `반지름 ${R} cm와 ${r} cm인 중심이 같은 두 원, 두 원 사이를 색칠`, {
      polygons: [{ points: circlePts(c, Rp), fill: true }, { points: circlePts(c, rp), fill: "paper" }],
      dots: [c],
      lines: [
        { from: c, to: [c[0], c[1] + Rp] },
        { from: c, to: [c[0] - rp, c[1]] },
      ],
      texts: [text([c[0] + 24, c[1] + 44], `${R} cm`), text([c[0] - rp / 2, c[1] - 13], `${r} cm`)],
    }),
    answer: trim((R * R - r * r) * PI),
    unit: "cm²",
    hint: "큰 원의 넓이에서 작은 원의 넓이를 빼요.",
    explanation: `${R} × ${R} × 3.14 − ${r} × ${r} × 3.14 = ${trim(R * R * PI)} − ${trim(r * r * PI)} = ${trim((R * R - r * r) * PI)}(cm²)`,
    mistakes: { [trim((R - r) * (R - r) * PI)]: "반지름의 차로 원의 넓이를 구했어요." },
  };
});

export const semicircle = easy("l6-semicircle", (rand) => {
  const r = randInt(rand, 2, 10);
  const c: Pt = [110, 120];
  return {
    key: `${r}`,
    prompt: "그림과 같은 반원의 넓이는 몇 cm²인가요? (원주율 3.14)",
    visual: compose(220, 150, `지름이 ${2 * r} cm인 반원`, { polygons: [{ points: circlePts(c, 90, 0, 180, 36), fill: true }], texts: [text([110, 138], `${2 * r} cm`)] }),
    answer: trim((r * r * PI) / 2),
    unit: "cm²",
    hint: "반원의 넓이는 원의 넓이의 절반이에요. 먼저 지름으로 반지름을 구해요.",
    explanation: `반지름 ${2 * r} ÷ 2 = ${r}(cm), ${r} × ${r} × 3.14 ÷ 2 = ${trim((r * r * PI) / 2)}(cm²)`,
    mistakes: { [trim(2 * r * 2 * r * PI * 0.5)]: "지름으로 넓이를 구했어요." },
  };
});

/** 원의 1/4 모양(부채꼴은 중학교 용어라 쓰지 않는다) */
export const quarterCircle = mid("l6-quarter", (rand) => {
  const r = randInt(rand, 2, 10) * 2;
  const withPerim = rand() < 0.5;
  const c: Pt = [40, 150];
  const visual = compose(190, 176, `반지름이 ${r} cm인 원의 1/4 모양`, {
    polygons: [{ points: [c, ...circlePts(c, 130, 0, 90, 24)], fill: true }],
    texts: [text([c[0] + 65, c[1] + 14], `${r} cm`), text([c[0] - 22, c[1] - 65], `${r} cm`)],
  });
  return withPerim
    ? {
        key: `${r}:p`,
        prompt: "그림은 원의 1/4 모양입니다. 이 모양의 둘레는 몇 cm인가요? (원주율 3.14)",
        visual,
        answer: trim((2 * r * PI) / 4 + 2 * r),
        unit: "cm",
        hint: "곡선 부분(원주의 1/4)과 반지름 2개를 더해요.",
        explanation: `${2 * r} × 3.14 ÷ 4 = ${trim((2 * r * PI) / 4)}, ${trim((2 * r * PI) / 4)} + ${r} × 2 = ${trim((2 * r * PI) / 4 + 2 * r)}(cm)`,
        mistakes: { [trim((2 * r * PI) / 4)]: "반지름 2개를 더하지 않았어요." },
      }
    : {
        key: `${r}:a`,
        prompt: "그림은 원의 1/4 모양입니다. 이 모양의 넓이는 몇 cm²인가요? (원주율 3.14)",
        visual,
        answer: trim((r * r * PI) / 4),
        unit: "cm²",
        hint: "원의 넓이를 4로 나누어요.",
        explanation: `${r} × ${r} × 3.14 ÷ 4 = ${trim((r * r * PI) / 4)}(cm²)`,
      };
});

export const areaRatio = mid("l6-area-ratio", (rand) => {
  const k = randInt(rand, 2, 5);
  const r = randInt(rand, 1, 4);
  return {
    key: `${k}:${r}`,
    prompt: `반지름이 ${r * k} cm인 원의 넓이는 반지름이 ${r} cm인 원의 넓이의 몇 배인가요?`,
    answer: k * k,
    unit: "배",
    hint: "원의 넓이는 반지름 × 반지름 × 원주율이에요.",
    explanation: `(${r * k} × ${r * k}) ÷ (${r} × ${r}) = ${k * k}(배)`,
    mistakes: { [k]: "반지름이 몇 배인지만 구했어요. 넓이는 반지름을 두 번 곱해요." },
  };
});

/** 정사각형 안에 꼭 맞는 원(1개 또는 4개), 원을 뺀 부분을 색칠 */
export const squareMinusCircle = word("l6-square-minus-circle", (rand) => {
  const a = randInt(rand, 2, 10) * 2;
  const r = a / 2;
  const four = rand() < 0.5;
  const circles = four ? 4 : 1;
  const cr = four ? r / 2 : r;
  const v = a * a - circles * cr * cr * PI;
  const [x0, y0, S] = [40, 10, 140];
  const centers: Pt[] = four ? [[x0 + 35, y0 + 35], [x0 + 105, y0 + 35], [x0 + 35, y0 + 105], [x0 + 105, y0 + 105]] : [[x0 + 70, y0 + 70]];
  return {
    key: `${a}:${four}`,
    prompt: `그림과 같이 정사각형 안에 ${four ? "크기가 같은 원 4개를" : "원을"} 꼭 맞게 그렸습니다. 색칠한 부분의 넓이는 몇 cm²인가요? (원주율 3.14)`,
    visual: compose(220, 176, `한 변이 ${a} cm인 정사각형 안에 원 ${circles}개, 원을 뺀 부분을 색칠`, {
      polygons: [{ points: [[x0, y0], [x0 + S, y0], [x0 + S, y0 + S], [x0, y0 + S]], fill: true }, ...centers.map((c) => ({ points: circlePts(c, S / (four ? 4 : 2)), fill: "paper" as const }))],
      texts: [text([x0 + S / 2, y0 + S + 16], `${a} cm`)],
    }),
    answer: trim(v),
    unit: "cm²",
    hint: four ? "원 한 개의 지름은 정사각형 한 변의 절반이에요. 정사각형의 넓이에서 원 4개의 넓이를 빼요." : "원의 지름은 정사각형의 한 변과 같아요. 정사각형의 넓이에서 원의 넓이를 빼요.",
    explanation: `${a * a} − ${circles > 1 ? `${circles} × ` : ""}${cr} × ${cr} × 3.14 = ${trim(v)}(cm²)`,
  };
});

export const pizzaCompare = word("l6-pizza-compare", (rand) => {
  const r1 = randInt(rand, 8, 12);
  const r2 = randInt(rand, 5, r1 - 2);
  const a1 = r1 * r1 * PI;
  const a2 = 2 * r2 * r2 * PI;
  if (r1 * r1 === 2 * r2 * r2) return null;
  return {
    key: `${r1}:${r2}`,
    prompt: `반지름이 ${r1} cm인 큰 피자 1판과 반지름이 ${r2} cm인 작은 피자 2판이 있습니다. (큰 피자 1판의 넓이)와 (작은 피자 2판의 넓이의 합)의 차는 몇 cm²인가요? (원주율 3.14)`,
    answer: trim(Math.abs(a1 - a2)),
    unit: "cm²",
    hint: "큰 피자 1판의 넓이와 작은 피자 2판의 넓이의 합을 각각 구해 비교해요.",
    explanation: `큰 피자 ${trim(a1)} cm², 작은 피자 2판 ${trim(a2)} cm² → 차 ${trim(Math.abs(a1 - a2))} cm²`,
  };
});

/* ── 6-2-6 원기둥, 원뿔, 구 ── */

const SOLID_P: Place = { cx: 100, top: 36, bottom: 142, rx: 56, ry: 16 };
const solidC: Pt = [100, 90];

type SolidMark = { q: string; a: string; c: string[]; draw: () => Parts };

const CYL_MARKS: SolidMark[] = [
  {
    q: "그림에서 색칠한 면을 무엇이라고 하나요?",
    a: "밑면",
    c: ["밑면", "옆면", "높이", "모선"],
    draw: () => ({ polygons: [{ points: Array.from({ length: 36 }, (_, i) => [100 + 56 * Math.cos((i * Math.PI) / 18), 36 + 16 * Math.sin((i * Math.PI) / 18)].map((v) => Math.round(v * 10) / 10) as Pt), fill: true }] }),
  },
  {
    q: "그림에서 ㉠과 같이 두 밑면을 잇는 굽은 면을 무엇이라고 하나요?",
    a: "옆면",
    c: ["옆면", "밑면", "높이", "모선"],
    draw: () => ({ texts: [text([100, 96], "㉠")] }),
  },
  {
    q: "그림에서 두 밑면에 수직인 선분 ㉠의 길이를 무엇이라고 하나요?",
    a: "높이",
    c: ["높이", "모선", "지름", "반지름"],
    draw: () => ({ lines: [{ from: [174, 36], to: [174, 142], arrows: "both", width: 1.5 }], texts: [text([188, 89], "㉠")] }),
  },
];

const CONE_MARKS: SolidMark[] = [
  { q: "그림에서 점 ㉠을 무엇이라고 하나요?", a: "원뿔의 꼭짓점", c: ["원뿔의 꼭짓점", "원의 중심", "모선", "밑면"], draw: () => ({ dots: [[100, 36]], texts: [text([116, 30], "㉠")] }) },
  {
    q: "그림에서 원뿔의 꼭짓점과 밑면인 원의 둘레의 한 점을 이은 선분 ㉠을 무엇이라고 하나요?",
    a: "모선",
    c: ["모선", "높이", "지름", "반지름"],
    draw: () => ({ texts: [labelOut([100, 36], [156, 142], solidC, "㉠", 4)] }),
  },
  {
    q: "그림에서 원뿔의 꼭짓점에서 밑면에 수직인 선분 ㉠의 길이를 무엇이라고 하나요?",
    a: "높이",
    c: ["높이", "모선", "지름", "반지름"],
    draw: () => ({
      lines: [
        { from: [100, 36], to: [100, 142], dashed: true, width: 1.5 },
        { from: [107, 142], to: [107, 135], width: 1 },
        { from: [107, 135], to: [100, 135], width: 1 },
      ],
      texts: [text([110, 100], "㉠")],
    }),
  },
  {
    q: "그림에서 밑면의 중심과 둘레의 한 점을 이은 선분 ㉠을 무엇이라고 하나요?",
    a: "밑면의 반지름",
    c: ["밑면의 반지름", "모선", "높이", "원뿔의 꼭짓점"],
    // 글자는 밑면 앞쪽 둘레(가장 낮은 곳 y 158) 아래에 닿지 않게(그림 높이 176)
    draw: () => ({ lines: [{ from: [100, 142], to: [156, 142], width: 1.5 }], dots: [[100, 142]], texts: [text([128, 167], "㉠")] }),
  },
];

const markEasy = (id: string, marks: SolidMark[], body: () => Parts, name: string, hint: string, height = 170) =>
  easy(id, (rand) => {
    const f = pick(rand, marks);
    return {
      key: f.q + f.a,
      prompt: f.q,
      visual: compose(210, height, `${name}의 겨냥도`, f.draw(), body()),
      answer: f.a,
      choices: shuffle(rand, f.c),
      hint,
      explanation: `${f.a}입니다.`,
    };
  });

export const cylFact = markEasy("l6-cyl-fact", CYL_MARKS, () => cylinder(SOLID_P), "원기둥", "원기둥은 서로 평행하고 합동인 두 원(밑면)과 굽은 옆면으로 이루어져 있어요.");
export const coneFact = markEasy("l6-cone-fact", CONE_MARKS, () => cone(SOLID_P), "원뿔", "원뿔은 원 모양의 밑면 1개와 굽은 옆면, 뾰족한 꼭짓점으로 이루어져 있어요.", 176);

const SPHERE_MARKS: SolidMark[] = [
  { q: "그림에서 점 ㉠과 같이 구에서 가장 안쪽에 있는 점을 무엇이라고 하나요?", a: "구의 중심", c: ["구의 중심", "꼭짓점", "모선", "밑면"], draw: () => ({ texts: [text([116, 85], "㉠")] }) }, // 중심 점 오른쪽, 적도(타원) 위아래 곡선 사이
  {
    q: "그림에서 구의 중심과 구의 겉면의 한 점을 이은 선분 ㉠을 무엇이라고 하나요?",
    a: "구의 반지름",
    c: ["구의 반지름", "모선", "높이", "원주"],
    draw: () => ({ lines: [{ from: [100, 85], to: [150, 36] }], texts: [text([116, 50], "㉠")] }),
  },
];
export const sphereFact = markEasy("l6-sphere-fact", SPHERE_MARKS, () => sphere([100, 85], 70, true), "구", "구의 가장 안쪽의 점이 구의 중심, 중심과 겉면의 한 점을 이은 선분이 구의 반지름이에요.");

/** 보기는 모두 같은 틀의 문장이다: 차이점은 "원기둥은 …, 각기둥은 …", 공통점은 "원기둥과 각기둥은 모두 …" */
const CYL_PRISM_DIFF = [
  { t: "원기둥은 꼭짓점이 없고, 각기둥은 꼭짓점이 있습니다", f: "원기둥은 꼭짓점이 있고, 각기둥은 꼭짓점이 없습니다" },
  { t: "원기둥은 밑면이 원이고, 각기둥은 밑면이 다각형입니다", f: "원기둥은 밑면이 다각형이고, 각기둥은 밑면이 원입니다" },
  { t: "원기둥은 옆면이 굽은 면이고, 각기둥은 옆면이 직사각형입니다", f: "원기둥은 옆면이 직사각형이고, 각기둥은 옆면이 굽은 면입니다" },
  { t: "원기둥은 모서리가 없고, 각기둥은 모서리가 있습니다", f: "원기둥은 모서리가 있고, 각기둥은 모서리가 없습니다" },
];
const CYL_PRISM_DIFF_WRONG = ["원기둥은 밑면이 1개이고, 각기둥은 밑면이 2개입니다", "원기둥은 두 밑면이 합동이 아니고, 각기둥은 두 밑면이 합동입니다"];
const CYL_PRISM_SAME = ["원기둥과 각기둥은 모두 밑면이 2개이고 서로 평행합니다", "원기둥과 각기둥은 모두 두 밑면이 서로 합동입니다"];
const CYL_PRISM_SAME_WRONG = [
  "원기둥과 각기둥은 모두 밑면이 원입니다",
  "원기둥과 각기둥은 모두 옆면이 직사각형입니다",
  "원기둥과 각기둥은 모두 꼭짓점이 있습니다",
  "원기둥과 각기둥은 모두 모서리가 있습니다",
  "원기둥과 각기둥은 모두 옆면이 굽은 면입니다",
];

export const cylVsPrism = mid("l6-cyl-vs-prism", (rand) => {
  if (rand() < 0.5) {
    const i = randInt(rand, 0, CYL_PRISM_DIFF.length - 1);
    const answer = CYL_PRISM_DIFF[i].t;
    // 정답을 뒤집은 문장은 빼서 두 보기만 비교해 답을 고를 수 없게 한다
    const wrong = [...CYL_PRISM_DIFF.filter((_, k) => k !== i).map((d) => d.f), ...CYL_PRISM_DIFF_WRONG];
    return {
      key: `diff:${i}`,
      prompt: "원기둥과 각기둥의 차이점을 바르게 말한 것을 고르세요.",
      answer,
      choices: shuffle(rand, [answer, ...shuffle(rand, wrong).slice(0, 3)]),
      hint: "밑면의 모양, 옆면, 꼭짓점과 모서리를 비교해 보세요.",
      explanation: `${answer}.`,
    };
  }
  const i = randInt(rand, 0, CYL_PRISM_SAME.length - 1);
  const answer = CYL_PRISM_SAME[i];
  return {
    key: `same:${i}`,
    prompt: "원기둥과 각기둥의 공통점을 바르게 말한 것을 고르세요.",
    answer,
    choices: shuffle(rand, [answer, ...shuffle(rand, CYL_PRISM_SAME_WRONG).slice(0, 3)]),
    hint: "밑면의 수와 두 밑면의 관계를 떠올려 보세요.",
    explanation: `${answer}.`,
  };
});

/** 원기둥 겨냥도에 밑면의 반지름과 높이 */
const cylScene = (r: string, h: string, label: string) =>
  compose(230, 170, label, cylinder(SOLID_P), {
    dots: [[100, 36]],
    lines: [{ from: [100, 36], to: [156, 36], width: 1.5 }],
    texts: [text([128, 11], r), labelOut([156, 36], [156, 142], solidC, h)],
  });

export const cylinderFront = mid("m6-cylinder-front", (rand) => {
  const r = randInt(rand, 2, 10);
  const h = randInt(rand, 3, 20);
  return {
    key: `${r}:${h}`,
    prompt: "그림과 같은 원기둥을 앞에서 본 모양은 직사각형입니다. 이 직사각형의 둘레는 몇 cm인가요?",
    visual: cylScene(`${r} cm`, `${h} cm`, `밑면의 반지름이 ${r} cm, 높이가 ${h} cm인 원기둥`),
    answer: 2 * (2 * r + h),
    unit: "cm",
    hint: "앞에서 본 직사각형의 가로는 밑면의 지름, 세로는 높이예요.",
    explanation: `가로 ${r} × 2 = ${2 * r}(cm), 세로 ${h} cm → (${2 * r} + ${h}) × 2 = ${2 * (2 * r + h)}(cm)`,
    mistakes: { [2 * (r + h)]: "가로를 반지름으로 했어요. 지름을 써야 해요." },
  };
});

/** 직사각형(삼각형, 반원)을 한 변을 기준으로 돌리는 그림: 기준선은 점선으로 길게 */
function rotateScene(kind: "rect" | "tri" | "semi", w: string, h: string, label: string): ShapeScene {
  const [x0, y0, W, H] = [70, 26, 90, 120];
  const axis = { from: [x0, y0 - 20] as Pt, to: [x0, y0 + H + 22] as Pt, dashed: true, width: 1.5 };
  if (kind === "semi") {
    const c: Pt = [x0, y0 + H / 2];
    return compose(220, 176, label, { polygons: [{ points: circlePts(c, H / 2, -90, 90, 30) }], lines: [axis], texts: [text([x0 - 26, y0 + H / 2], h)] });
  }
  const pts: Pt[] = kind === "rect" ? [[x0, y0], [x0 + W, y0], [x0 + W, y0 + H], [x0, y0 + H]] : [[x0, y0], [x0 + W, y0 + H], [x0, y0 + H]];
  return compose(220, 176, label, { polygons: [{ points: pts }], lines: [axis], texts: [text([x0 + W / 2, y0 + H + 14], w), text([x0 - 26, y0 + H / 2], h)] });
}

export const cylRotate = word("l6-cyl-rotate", (rand) => {
  const a = randInt(rand, 2, 10);
  const b = randInt(rand, 3, 15);
  return {
    key: `${a}:${b}`,
    prompt: "그림과 같은 직사각형 모양 종이를 점선을 기준으로 한 바퀴 돌려 원기둥을 만들었습니다. 이 원기둥을 앞에서 본 모양의 넓이는 몇 cm²인가요?",
    visual: rotateScene("rect", `${a} cm`, `${b} cm`, `가로 ${a} cm, 세로 ${b} cm인 직사각형과 세로를 따라 그은 점선`),
    answer: 2 * a * b,
    unit: "cm²",
    hint: "돌려 만든 원기둥의 밑면의 반지름은 직사각형의 가로, 높이는 세로예요.",
    explanation: `밑면의 지름 ${2 * a} cm, 높이 ${b} cm → ${2 * a} × ${b} = ${2 * a * b}(cm²)`,
    mistakes: { [a * b]: "밑면의 지름이 아니라 반지름을 썼어요." },
  };
});

/** 밑면의 지름과 높이가 같은 원기둥(겨냥도에 지름과 높이를 □로) */
export const cylCond = word("l6-cyl-cond", (rand) => {
  const r = randInt(rand, 2, 12);
  return {
    key: `${r}`,
    prompt: `그림과 같이 밑면의 지름과 높이가 같은 원기둥이 있습니다. 이 원기둥을 앞에서 본 모양의 둘레가 ${8 * r} cm일 때, 밑면의 반지름은 몇 cm인가요?`,
    visual: compose(230, 176, "밑면의 지름과 높이가 모두 □ cm인 원기둥", cylinder(SOLID_P), {
      lines: [{ from: [44, 36], to: [156, 36], width: 1.5 }],
      texts: [text([100, 11], "□ cm"), labelOut([156, 36], [156, 142], solidC, "□ cm")],
    }),
    answer: r,
    unit: "cm",
    hint: "앞에서 본 모양은 가로(지름)와 세로(높이)가 같은 정사각형이에요.",
    explanation: `한 변 ${8 * r} ÷ 4 = ${2 * r}(cm) = 지름 → 반지름 ${2 * r} ÷ 2 = ${r}(cm)`,
    mistakes: { [2 * r]: "지름을 구했어요." },
  };
});

/** 원기둥의 전개도 그림(밑면의 반지름 r, 높이 h cm의 비율로) */
function cylNetScene(r: number, h: number, marks: { r?: string; w?: string; h?: string }, label: string): ShapeScene {
  const s = Math.min(9, 250 / (2 * Math.PI * r), 110 / h);
  const [W, H, R] = [2 * Math.PI * r * s, h * s, Math.max(12, r * s)];
  const o: Pt = [40, Math.round(8 + 2 * R)];
  const net = cylinderNet(o, W, H, R);
  const texts: NonNullable<ShapeScene["texts"]> = [];
  const lines: NonNullable<ShapeScene["lines"]> = [];
  if (marks.r) {
    lines.push({ from: net.topC, to: [net.topC[0] + R, net.topC[1]], width: 1.5 });
    texts.push(text([net.topC[0] + R + 8 + marks.r.length * 4, net.topC[1]], marks.r));
  }
  if (marks.w) texts.push(text([o[0] + W * 0.7, o[1] + H + 14], marks.w));
  if (marks.h) texts.push(labelOut([o[0], o[1]], [o[0], o[1] + H], [o[0] + 30, o[1] + H / 2], marks.h));
  return compose(Math.round(o[0] + W + 24), Math.round(o[1] + H + 2 * R + 10), label, net, { lines, dots: marks.r ? [net.topC] : undefined, texts });
}

const NET_PARTS = [
  { q: "원기둥의 전개도입니다. ㉠의 길이는 무엇과 같나요?", a: "밑면의 둘레", c: ["밑면의 둘레", "밑면의 지름", "밑면의 반지름", "원기둥의 높이"] },
  { q: "원기둥의 전개도입니다. ㉡의 길이는 무엇과 같나요?", a: "원기둥의 높이", c: ["원기둥의 높이", "밑면의 둘레", "밑면의 지름", "밑면의 반지름"] },
  { q: "원기둥의 전개도입니다. 옆면은 어떤 모양인가요?", a: "직사각형", c: ["직사각형", "원", "삼각형", "오각형"] },
  { q: "원기둥의 전개도입니다. 밑면은 몇 개인가요?", a: "2개", c: ["1개", "2개", "3개", "4개"] },
];

/** 원기둥 전개도 그림에서 옆면의 가로(㉠)·세로(㉡)와 밑면 */
export const netParts = easy("e6-net-parts", (rand) => {
  const f = pick(rand, NET_PARTS);
  return {
    key: f.q,
    prompt: f.q,
    visual: cylNetScene(3, 7, { w: "㉠", h: "㉡" }, "원기둥의 전개도: 옆면의 가로 ㉠, 세로 ㉡"),
    answer: f.a,
    choices: shuffle(rand, f.c),
    hint: "원기둥을 펼치면 합동인 원 2개와 직사각형 1개가 나와요. 직사각형의 가로는 밑면의 둘레와 맞닿아요.",
    explanation: `${f.a}입니다.`,
  };
});

export const cylinderNetGen = mid("cylinder-net", (rand) => {
  const r = randInt(rand, 2, 6);
  const h = randInt(rand, 4, 12);
  return {
    key: `${r}:${h}`,
    prompt: "그림은 원기둥의 전개도입니다. 옆면의 가로 ㉠은 몇 cm인가요? (원주율 3.14)",
    visual: cylNetScene(r, h, { r: `${r} cm`, w: "㉠", h: `${h} cm` }, `밑면의 반지름이 ${r} cm, 높이가 ${h} cm인 원기둥의 전개도`),
    answer: trim(2 * r * PI),
    unit: "cm",
    hint: "옆면의 가로는 밑면의 둘레(원주)와 같아요. 원주 = 지름 × 3.14",
    explanation: `${r * 2} × 3.14 = ${trim(2 * r * PI)}(cm)`,
    mistakes: { [trim(r * PI)]: "반지름으로 계산했어요. 지름을 써야 해요." },
  };
});

/** 전개도의 옆면 가로로 밑면의 반지름 구하기 */
export const netRadius = mid("l6-net-radius", (rand) => {
  const r = randInt(rand, 2, 6);
  const h = randInt(rand, 4, 12);
  return {
    key: `${r}:${h}`,
    prompt: `그림은 원기둥의 전개도이고, 옆면의 가로 ㉠은 ${trim(2 * r * PI)} cm입니다. 밑면의 반지름은 몇 cm인가요? (원주율 3.14)`,
    visual: cylNetScene(r, h, { r: "□ cm", w: "㉠", h: `${h} cm` }, `옆면의 가로가 ${trim(2 * r * PI)} cm인 원기둥의 전개도`),
    answer: r,
    unit: "cm",
    hint: "옆면의 가로는 밑면의 둘레(원주)와 같아요. 원주 ÷ 3.14 = 지름",
    explanation: `지름 ${trim(2 * r * PI)} ÷ 3.14 = ${2 * r}(cm), 반지름 ${2 * r} ÷ 2 = ${r}(cm)`,
    mistakes: { [2 * r]: "지름을 구했어요." },
  };
});

/** 옆면의 둘레와 밑면의 반지름으로 높이 구하기(옆면 넓이는 중학교 내용이라 다루지 않는다) */
export const cylNetHeight = word("l6-cyl-net-height", (rand) => {
  const r = randInt(rand, 2, 5);
  const h = randInt(rand, 4, 12);
  const P = trim(2 * (2 * r * PI + h));
  return {
    key: `${r}:${h}`,
    prompt: `그림은 원기둥의 전개도이고, 옆면의 둘레는 ${P} cm입니다. 원기둥의 높이 ㉡은 몇 cm인가요? (원주율 3.14)`,
    visual: cylNetScene(r, h, { r: `${r} cm`, h: "㉡" }, `밑면의 반지름이 ${r} cm인 원기둥의 전개도`),
    answer: h,
    unit: "cm",
    hint: "옆면의 가로는 밑면의 둘레예요. (옆면의 둘레) ÷ 2에서 가로를 빼면 세로(높이)예요.",
    explanation: `가로 ${2 * r} × 3.14 = ${trim(2 * r * PI)}(cm), ${P} ÷ 2 − ${trim(2 * r * PI)} = ${h}(cm)`,
  };
});

/** 높이는 문제에 주어지므로 묻지 않고, 밑면의 지름이나 둘레를 묻는다 */
export const coneRotate = mid("l6-cone-rotate", (rand) => {
  const a = randInt(rand, 2, 10);
  const b = randInt(rand, 3, 15);
  // 높이가 지름과 같으면 답이 문제에 보인다
  if (b === 2 * a) return null;
  const askDiameter = rand() < 0.5;
  const circ = trim(2 * a * PI);
  return {
    key: `${a}:${b}:${askDiameter}`,
    prompt: `밑변 ${a} cm, 높이 ${b} cm인 직각삼각형 모양 종이를 그림과 같이 높이를 기준으로 한 바퀴 돌려 원뿔을 만들었습니다. 원뿔의 ${askDiameter ? "밑면의 지름은 몇 cm인가요?" : "밑면의 둘레는 몇 cm인가요? (원주율 3.14)"}`,
    visual: rotateScene("tri", `${a} cm`, `${b} cm`, `밑변 ${a} cm, 높이 ${b} cm인 직각삼각형과 높이를 따라 그은 점선`),
    answer: askDiameter ? 2 * a : circ,
    unit: "cm",
    hint: "돌린 축이 원뿔의 높이, 밑변이 밑면의 반지름이 돼요.",
    explanation: askDiameter ? `반지름 ${a} cm → 지름 ${a} × 2 = ${2 * a}(cm)` : `반지름 ${a} cm → 지름 ${2 * a} cm, 둘레 ${2 * a} × 3.14 = ${circ}(cm)`,
    mistakes: askDiameter ? { [a]: "반지름을 구했어요." } : { [trim(a * PI)]: "반지름에 3.14를 곱했어요. 지름을 써야 해요." },
  };
});

export const coneFront = mid("l6-cone-front", (rand) => {
  const r = randInt(rand, 2, 10);
  const l = randInt(rand, r + 2, 20);
  return {
    key: `${r}:${l}`,
    prompt: "그림과 같은 원뿔을 앞에서 본 모양은 이등변삼각형입니다. 이 삼각형의 둘레는 몇 cm인가요?",
    visual: compose(230, 176, `밑면의 반지름이 ${r} cm, 모선의 길이가 ${l} cm인 원뿔`, cone(SOLID_P), {
      dots: [[100, 142]],
      lines: [{ from: [100, 142], to: [156, 142], width: 1.5 }],
      texts: [text([128, 167], `${r} cm`), labelOut([100, 36], [156, 142], solidC, `${l} cm`)],
    }),
    answer: 2 * l + 2 * r,
    unit: "cm",
    hint: "이등변삼각형의 같은 두 변은 모선, 나머지 한 변은 밑면의 지름이에요.",
    explanation: `${l} × 2 + ${2 * r} = ${2 * l + 2 * r}(cm)`,
    mistakes: { [2 * l + r]: "밑변을 반지름으로 했어요. 지름을 써야 해요." },
  };
});

export const coneFrontArea = word("l6-cone-front-area", (rand) => {
  const r = randInt(rand, 2, 10);
  const h = randInt(rand, 3, 15);
  return {
    key: `${r}:${h}`,
    prompt: `밑면의 반지름이 ${r} cm, 높이가 ${h} cm인 원뿔을 앞에서 본 모양의 넓이는 몇 cm²인가요?`,
    answer: r * h,
    unit: "cm²",
    hint: "앞에서 본 모양은 밑변이 밑면의 지름, 높이가 원뿔의 높이인 삼각형이에요.",
    explanation: `${2 * r} × ${h} ÷ 2 = ${r * h}(cm²)`,
    mistakes: { [2 * r * h]: "삼각형의 넓이는 2로 나누어야 해요." },
  };
});

/** 원기둥과 원뿔의 크기를 따로 주어 차가 원뿔 쪽 넓이와 같아지는 규칙이 생기지 않게 한다 */
export const coneCylCompare = word("l6-cone-cyl-compare", (rand) => {
  const [r1, h1, r2, h2] = [randInt(rand, 2, 8), randInt(rand, 3, 12), randInt(rand, 2, 8), randInt(rand, 3, 15)];
  if (r1 === r2 && h1 === h2) return null;
  const a = 2 * r1 * h1;
  const b = r2 * h2;
  if (a === b) return null;
  return {
    key: `${r1}:${h1}:${r2}:${h2}`,
    prompt: `밑면의 반지름이 ${r1} cm, 높이가 ${h1} cm인 원기둥과 밑면의 반지름이 ${r2} cm, 높이가 ${h2} cm인 원뿔이 있습니다. 두 입체도형을 앞에서 본 모양의 넓이의 차는 몇 cm²인가요?`,
    answer: Math.abs(a - b),
    unit: "cm²",
    hint: "원기둥은 직사각형, 원뿔은 삼각형으로 보여요. 가로(밑변)는 밑면의 지름이에요.",
    explanation: `직사각형 ${2 * r1} × ${h1} = ${a}(cm²), 삼각형 ${2 * r2} × ${h2} ÷ 2 = ${b}(cm²) → 차 ${Math.abs(a - b)} cm²`,
  };
});

/** 그림에서 원기둥·원뿔·구 찾기 */
export const roundSolids = easy("round-solids", (rand) => {
  const kinds = shuffle(rand, ["cylinder", "cone", "sphere", pick(rand, ["prism", "pyramid"] as const)] as SolidKind[]);
  const target = pick(rand, ["cylinder", "cone", "sphere"] as const);
  const name = { cylinder: "원기둥", cone: "원뿔", sphere: "구" }[target];
  const i = kinds.indexOf(target);
  return {
    key: `${kinds.join()}:${target}`,
    prompt: `그림에서 ${j(name, "를")} 찾아 기호를 고르세요.`,
    visual: lineup(kinds, kinds.map(() => randInt(rand, 3, 6))),
    answer: LETTERS[i],
    choices: LETTERS.slice(0, 4),
    hint: "원기둥은 두 밑면이 원, 원뿔은 밑면이 원 1개와 뾰족한 꼭짓점, 구는 공 모양이에요.",
    explanation: `${LETTERS[i]}가 ${name}입니다.`,
  };
});

export const sphereRotate = mid("l6-sphere-rotate", (rand) => {
  const d = randInt(rand, 2, 10) * 2;
  return {
    key: `${d}`,
    prompt: "그림과 같은 반원 모양 종이를 지름을 기준으로 한 바퀴 돌려 구를 만들었습니다. 이 구를 앞에서 본 모양은 원입니다. 이 원의 원주는 몇 cm인가요? (원주율 3.14)",
    visual: rotateScene("semi", "", `${d} cm`, `지름이 ${d} cm인 반원과 지름을 따라 그은 점선`),
    answer: trim(d * PI),
    unit: "cm",
    hint: "반원의 지름이 구의 지름이 되고, 구를 앞에서 보면 지름이 같은 원이에요.",
    explanation: `구의 지름 ${d} cm → 원주 ${d} × 3.14 = ${trim(d * PI)}(cm)`,
    mistakes: { [trim((d / 2) * PI)]: "반지름에 3.14를 곱했어요." },
  };
});

export const sphereBox = mid("l6-sphere-box", (rand) => {
  const r = randInt(rand, 2, 15);
  return {
    key: `${r}`,
    prompt: `반지름이 ${r} cm인 구가 꼭 맞게 들어가는 정육면체 모양 상자의 한 모서리의 길이는 몇 cm인가요?`,
    answer: 2 * r,
    unit: "cm",
    hint: "정육면체의 한 모서리는 구의 지름과 같아요.",
    explanation: `${r} × 2 = ${2 * r}(cm)`,
    mistakes: { [r]: "반지름을 썼어요." },
  };
});

export const sphereBoxVolume = word("l6-sphere-box-volume", (rand) => {
  const r = randInt(rand, 2, 8);
  const n = pick(rand, [2, 3]);
  return {
    key: `${r}:${n}`,
    prompt: `반지름이 ${r} cm인 공 ${n}개를 한 줄로 나란히 꼭 맞게 넣을 수 있는 직육면체 모양 상자가 있습니다. 이 상자의 부피는 몇 cm³인가요?`,
    answer: 2 * r * n * 2 * r * 2 * r,
    unit: "cm³",
    hint: `상자의 가로는 공의 지름 × ${n}, 세로와 높이는 공의 지름이에요.`,
    explanation: `${2 * r * n} × ${2 * r} × ${2 * r} = ${8 * r * r * r * n}(cm³)`,
  };
});

/** 원기둥·원뿔·구·각기둥·각뿔의 성질(조건 하나만으로는 정해지지 않는 것만) */
const SOLIDS = ["원기둥", "원뿔", "구", "각기둥", "각뿔"] as const;
const SOLID_FACTS: { text: string; of: (typeof SOLIDS)[number][] }[] = [
  { text: "굽은 면이 있습니다.", of: ["원기둥", "원뿔", "구"] },
  { text: "평평한 면이 있습니다.", of: ["원기둥", "원뿔", "각기둥", "각뿔"] },
  { text: "꼭짓점이 없습니다.", of: ["원기둥", "구"] },
  { text: "밑면이 2개입니다.", of: ["원기둥", "각기둥"] },
  { text: "밑면이 1개입니다.", of: ["원뿔", "각뿔"] },
  { text: "밑면이 원입니다.", of: ["원기둥", "원뿔"] },
];

/** 조건으로 입체도형을 판별한 뒤(원기둥·원뿔) 앞에서 본 모양의 넓이를 구한다(두 단계) */
export const solidGuess = word("l6-solid-guess", (rand) => {
  const solid = pick(rand, ["원기둥", "원뿔"] as const);
  const facts = shuffle(rand, SOLID_FACTS.filter((f) => f.of.includes(solid))).slice(0, randInt(rand, 2, 3));
  const left = SOLIDS.filter((x) => facts.every((f) => f.of.includes(x)));
  if (left.length !== 1) return null;
  const D = randInt(rand, 2, 8) * 2;
  const H = randInt(rand, 3, 12);
  const rect = D * H;
  const answer = solid === "원기둥" ? rect : rect / 2;
  return {
    key: `${facts.map((f) => SOLID_FACTS.indexOf(f)).join("")}:${D}:${H}`,
    prompt: `다음 조건을 모두 만족하는 입체도형이 있습니다. 이 입체도형의 밑면의 지름이 ${D} cm, 높이가 ${H} cm일 때, 앞에서 본 모양의 넓이는 몇 cm²인가요?\n· ${facts.map((f) => f.text).join("\n· ")}`,
    answer,
    unit: "cm²",
    hint: "먼저 조건을 모두 만족하는 입체도형을 찾고, 그 입체도형을 앞에서 본 모양을 떠올려요.",
    explanation:
      solid === "원기둥"
        ? `조건을 모두 만족하는 입체도형은 원기둥이고, 앞에서 본 모양은 가로 ${D} cm, 세로 ${H} cm인 직사각형입니다. ${D} × ${H} = ${rect}(cm²)`
        : `조건을 모두 만족하는 입체도형은 원뿔이고, 앞에서 본 모양은 밑변 ${D} cm, 높이 ${H} cm인 삼각형입니다. ${D} × ${H} = ${rect}, ${rect} ÷ 2 = ${answer}(cm²)`,
    mistakes: solid === "원기둥" ? { [rect / 2]: "원뿔로 생각했어요. 조건을 다시 확인해요." } : { [rect]: "원기둥으로 생각했어요. 삼각형의 넓이는 2로 나누어요." },
  };
});
