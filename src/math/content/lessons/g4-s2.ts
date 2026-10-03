import { pick, randInt, shuffle } from "../../lib/random";
import { COMPARE_CHOICES, sign } from "../generators/common";
import { mixedText } from "../generators/grade4";
import { easy, markChoice, mid, names, opts, word } from "./g4";
import { josa } from "../josa";

/** 분수는 분자를 읽는 소리로 조사를 고른다(3/5 → 오분의 삼 → 3/5을) */
const fj = (t: string | number, pair: Parameters<typeof josa>[1]) => {
  const m = /(\d+)\/\d+$/.exec(String(t));
  return m ? `${t}${josa(m[1], pair).slice(m[1].length)}` : josa(t, pair);
};

/**
 * 4학년 차시용 생성기(3): 4-2 분수의 덧셈과 뺄셈, 소수의 덧셈과 뺄셈
 */

/* ── 분수 ── */

/** 분모 d인 분수(분자 합계 n) 4지선다 */
const fracOpts = (rand: () => number, n: number, d: number, wrong: number[]) =>
  opts(
    rand,
    mixedText(n, d),
    wrong.filter((w) => w > 0 && w !== n).map((w) => mixedText(w, d)),
    () => mixedText(Math.max(1, n + randInt(rand, -d, d)), d),
  );

/** 대분수(분자 합계) 하나: 자연수 부분 lo~hi, 분수 부분은 0이 아님 */
const mixed = (rand: () => number, d: number, lo: number, hi: number) => randInt(rand, lo, hi) * d + randInt(rand, 1, d - 1);

export const l4FracAddCount = mid("l4-frac-add-count", (rand) => {
  const d = randInt(rand, 4, 12);
  const a = randInt(rand, 1, d - 1);
  const b = randInt(rand, 1, d - 1);
  return {
    key: `${d}:${a}:${b}`,
    prompt: `${fj(`${a}/${d} + ${b}/${d}`, "은/는")} 1/${d}이 몇 개인 수인가요?`,
    answer: a + b,
    unit: "개",
    hint: `${fj(`${a}/${d}`, "은/는")} 1/${d}이 ${a}개, ${fj(`${b}/${d}`, "은/는")} 1/${d}이 ${b}개예요.`,
    explanation: `1/${d}이 ${a} + ${b} = ${a + b}(개)`,
  };
});

export const l4FracCardsAdd = word("l4-frac-cards-add", (rand) => {
  const d = randInt(rand, 7, 12);
  // 수 카드는 한 자리 수(1~9)만
  const cards = shuffle(rand, Array.from({ length: Math.min(9, d - 1) }, (_, i) => i + 1)).slice(0, 4);
  const most = rand() < 0.5;
  const sorted = [...cards].sort((x, y) => (most ? y - x : x - y));
  const sum = sorted[0] + sorted[1];
  return {
    key: `${d}:${[...cards].sort((x, y) => x - y).join()}:${most}`,
    prompt: `수 카드 ${cards.join(", ")} 중 2장을 골라, 고른 카드의 수를 각각 분자로 하는 분모가 ${d}인 진분수 2개를 만들었습니다. 두 진분수의 합이 가장 ${most ? "클" : "작을"} 때의 합을 고르세요.`,
    answer: mixedText(sum, d),
    choices: fracOpts(rand, sum, d, [sorted[0] + sorted[2], sorted[1] + sorted[2], sum + 1]),
    hint: `분모가 같으므로 분자가 가장 ${most ? "큰" : "작은"} 두 수를 골라요.`,
    explanation: `${sorted[0]}/${d} + ${sorted[1]}/${d} = ${sum}/${d}${sum >= d ? ` = ${mixedText(sum, d)}` : ""}`,
  };
});

export const l4OneMinus = mid("l4-one-minus", (rand) => {
  const d = randInt(rand, 3, 12);
  const a = randInt(rand, 1, d - 1);
  return {
    key: `${d}:${a}`,
    prompt: "계산해 보세요.",
    expression: `1 − ${a}/${d}`,
    answer: mixedText(d - a, d),
    choices: fracOpts(rand, d - a, d, [a, d - a + 1, d + a]),
    hint: `1을 ${josa(`${d}/${d}`, "으로/로")} 바꾸어 계산해요.`,
    explanation: `${d}/${d} − ${a}/${d} = ${d - a}/${d}`,
    mistakes: { [mixedText(a, d)]: "빼는 수를 그대로 썼어요." },
  };
});

export const l4FracSubBox = mid("l4-frac-sub-box", (rand) => {
  const d = randInt(rand, 5, 13);
  const a = randInt(rand, 3, d - 1);
  const c = randInt(rand, 1, a - 1);
  return {
    key: `${d}:${a}:${c}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: `${a}/${d} − □/${d} = ${c}/${d}`,
    answer: a - c,
    hint: "분모가 같으니 분자끼리의 뺄셈식으로 생각해요.",
    explanation: `${a} − □ = ${c} → □ = ${a - c}`,
    mistakes: { [a + c]: "더했어요. 분자끼리 빼야 해요." },
  };
});

export const l4FracWrongOp = word("l4-frac-wrong-op", (rand) => {
  const d = randInt(rand, 6, 13);
  const b = randInt(rand, 1, Math.floor(d / 3));
  const x = randInt(rand, b + 1, d - 1);
  const addRight = rand() < 0.5;
  const wrong = addRight ? x - b : x + b;
  const right = addRight ? x + b : x - b;
  if (right <= 0) return null;
  return {
    key: `${d}:${b}:${x}:${addRight}`,
    prompt: `${addRight ? "어떤 분수에" : "어떤 분수에서"} ${fj(`${b}/${d}`, "을/를")} ${addRight ? "더해야" : "빼야"} 할 것을 잘못하여 ${addRight ? "뺐더니" : "더했더니"} ${fj(mixedText(wrong, d), "이/가")} 되었습니다. 바르게 계산한 값을 고르세요.`,
    answer: mixedText(right, d),
    choices: fracOpts(rand, right, d, [x, wrong, right + 1]),
    hint: "먼저 잘못 계산한 식을 거꾸로 풀어 어떤 분수를 구해요.",
    explanation: `어떤 분수: ${mixedText(x, d)} → 바르게: ${mixedText(x, d)} ${addRight ? "+" : "−"} ${b}/${d} = ${mixedText(right, d)}`,
  };
});

export const l4FracBoxCount = word("l4-frac-box-count", (rand) => {
  const d = randInt(rand, 6, 15);
  const a = randInt(rand, 1, d - 3);
  const lessOne = rand() < 0.5;
  const limit = lessOne ? d : randInt(rand, a + 2, d);
  // a/d + □/d < limit/d → □ < limit − a
  const count = limit - a - 1;
  return {
    key: `${d}:${a}:${limit}`,
    prompt: `□ 안에 들어갈 수 있는 자연수는 모두 몇 개인가요?`,
    expression: `${a}/${d} + □/${d} < ${limit === d ? "1" : `${limit}/${d}`}`,
    answer: count,
    unit: "개",
    hint: lessOne ? `1은 ${josa(`${d}/${d}`, "이에요/예요")}. 분자끼리 비교해요.` : "분모가 같으니 분자끼리 비교해요.",
    explanation: `${a} + □ < ${limit} → □는 1부터 ${limit - a - 1}까지 ${count}개`,
    mistakes: { [count + 1]: "같은 경우까지 셌어요. 더 작아야 해요." },
  };
});

export const l4MixedImproper = mid("l4-mixed-improper", (rand) => {
  const d = randInt(rand, 3, 9);
  const x = mixed(rand, d, 1, 3);
  const y = mixed(rand, d, 1, 3);
  return {
    key: `${d}:${x}:${y}`,
    prompt: `${fj(`${mixedText(x, d)} + ${mixedText(y, d)}`, "을/를")} 가분수로 바꾸어 계산하려고 합니다. 계산 결과를 가분수로 나타내면 □/${d}입니다. □ 안에 알맞은 수를 쓰세요.`,
    answer: x + y,
    hint: `대분수를 가분수로: ${mixedText(x, d)} = ${x}/${d}`,
    explanation: `${x}/${d} + ${y}/${d} = ${x + y}/${d}`,
  };
});

export const l4FracCompareSum = mid("l4-frac-compare-sum", (rand) => {
  const d = randInt(rand, 4, 9);
  const x = mixed(rand, d, 1, 3);
  const y = mixed(rand, d, 1, 3);
  const s = x + y;
  const c = rand() < 0.25 ? s : s + randInt(rand, -3, 3) || s + 1;
  if (c <= 0) return null;
  const ans = sign(s, c);
  return {
    key: `${d}:${x}:${y}:${c}`,
    prompt: "계산 결과를 비교하여 ○ 안에 >, =, < 중 알맞은 것을 고르세요.",
    expression: `${mixedText(x, d)} + ${mixedText(y, d)} ○ ${mixedText(c, d)}`,
    answer: ans,
    choices: COMPARE_CHOICES,
    hint: "왼쪽을 먼저 계산한 뒤 자연수 부분, 분수 부분 순서로 비교해요.",
    explanation: `${mixedText(x, d)} + ${mixedText(y, d)} = ${mixedText(s, d)} ${ans} ${mixedText(c, d)}`,
  };
});

export const l4MixedPerimeter = word("l4-mixed-perimeter", (rand) => {
  // 분수 단원(1단원)은 삼각형 단원(2단원)보다 앞이라 정삼각형은 쓰지 않는다. 3학년에 배운 정사각형·직사각형만
  const d = randInt(rand, 3, 9);
  const square = rand() < 0.5;
  const a = mixed(rand, d, 1, 4);
  const b = square ? a : mixed(rand, d, 1, 4);
  if (!square && a === b) return null;
  const sides = square ? [a, a, a, a] : [a, b, a, b];
  const total = 2 * (a + b);
  const prompt = square
    ? `한 변의 길이가 ${mixedText(a, d)} m인 정사각형 모양의 꽃밭 둘레에 울타리를 치려고 합니다. 울타리는 모두 몇 m 필요한가요?`
    : `가로가 ${mixedText(a, d)} m, 세로가 ${mixedText(b, d)} m인 직사각형 모양의 꽃밭 둘레에 울타리를 치려고 합니다. 울타리는 모두 몇 m 필요한가요?`;
  return {
    key: `${d}:${a}:${b}`,
    prompt,
    answer: mixedText(total, d),
    choices: fracOpts(rand, total, d, square ? [a * 3, total - d, total + 1] : [a + b, total - d, total + 1]),
    hint: square ? `정사각형은 네 변의 길이가 모두 같아요. ${fj(mixedText(a, d), "을/를")} 4번 더해요.` : "직사각형은 마주 보는 두 변의 길이가 같아요. 네 변의 길이를 모두 더해요.",
    explanation: `${sides.map((x) => mixedText(x, d)).join(" + ")} = ${mixedText(total, d)} (m)`,
  };
});

export const l4MixedCards = word("l4-mixed-cards", (rand) => {
  const [w1, n1, d1] = shuffle(rand, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3);
  const d = Math.max(w1, n1, d1);
  const rest = [w1, n1, d1].filter((v) => v !== d).sort((x, y) => x - y);
  if (rest[0] === rest[1]) return null;
  // 분모 d로 고정: 가장 큰 대분수 rest[1] rest[0]/d, 가장 작은 대분수 rest[0] rest[1]/d
  const big = rest[1] * d + rest[0];
  const small = rest[0] * d + rest[1];
  const sum = big + small;
  return {
    key: `${[w1, n1, d1].sort().join()}`,
    prompt: `수 카드 3장 ${josa([w1, n1, d1].join(", "), "을/를")} 한 번씩 모두 사용하여 분모가 ${d}인 대분수를 만들려고 합니다. 만들 수 있는 대분수 중 가장 큰 수와 가장 작은 수의 합을 고르세요.`,
    answer: mixedText(sum, d),
    choices: fracOpts(rand, sum, d, [big - small, big * 2, sum + d]),
    hint: `분모가 ${d}이면 남은 두 카드로 자연수 부분과 분자를 정해요. 분자는 ${d}보다 작아야 해요.`,
    explanation: `가장 큰 수 ${mixedText(big, d)}, 가장 작은 수 ${mixedText(small, d)} → 합 ${mixedText(sum, d)}`,
  };
});

export const l4MixedSubEasy = easy("l4-mixed-sub-easy", (rand) => {
  const d = randInt(rand, 3, 9);
  const fx = randInt(rand, 2, d - 1);
  const fy = randInt(rand, 1, fx - 1);
  const wx = randInt(rand, 2, 7);
  const wy = randInt(rand, 1, wx - 1);
  const x = wx * d + fx;
  const y = wy * d + fy;
  return {
    key: `${d}:${x}:${y}`,
    prompt: "계산해 보세요.",
    expression: `${mixedText(x, d)} − ${mixedText(y, d)}`,
    answer: mixedText(x - y, d),
    choices: fracOpts(rand, x - y, d, [x + y, x - y + d, x - y + 1]),
    hint: "자연수는 자연수끼리, 분수는 분수끼리 빼요.",
    explanation: `자연수끼리 ${wx} − ${wy} = ${wx - wy}, 분수끼리 ${fx}/${d} − ${fy}/${d} = ${fx - fy}/${d} → ${mixedText(x - y, d)}`,
  };
});

export const l4MixedSubBox = mid("l4-mixed-sub-box", (rand) => {
  const d = randInt(rand, 3, 9);
  const y = mixed(rand, d, 1, 3);
  const r = mixed(rand, d, 1, 3);
  const x = y + r;
  return {
    key: `${d}:${y}:${r}`,
    prompt: "□ 안에 알맞은 수를 고르세요.",
    expression: `□ − ${mixedText(y, d)} = ${mixedText(r, d)}`,
    answer: mixedText(x, d),
    choices: fracOpts(rand, x, d, [Math.abs(r - y) || r + 1, x + 1, x - d]),
    hint: "뺄셈식을 덧셈식으로 바꾸어 생각해요.",
    explanation: `□ = ${mixedText(r, d)} + ${mixedText(y, d)} = ${mixedText(x, d)}`,
  };
});

export const l4MixedSubLife = mid("l4-mixed-sub-life", (rand) => {
  const d = randInt(rand, 4, 9);
  const fx = randInt(rand, 2, d - 1);
  const fy = randInt(rand, 1, fx - 1);
  const x = randInt(rand, 3, 6) * d + fx;
  const y = randInt(rand, 1, 2) * d + fy;
  const item = pick(rand, [
    { what: "물", unit: "L", verb: "마셨습니다" },
    { what: "밀가루", unit: "kg", verb: "사용했습니다" },
    { what: "리본", unit: "m", verb: "잘라 썼습니다" },
  ]);
  return {
    key: `${d}:${x}:${y}:${item.what}`,
    prompt: `${item.what} ${mixedText(x, d)} ${item.unit} 중에서 ${fj(`${mixedText(y, d)} ${item.unit}`, "을/를")} ${item.verb}. 남은 ${josa(item.what, "은/는")} 몇 ${item.unit}인가요?`,
    answer: mixedText(x - y, d),
    choices: fracOpts(rand, x - y, d, [x + y, x - y + 1, x - y - 1]),
    hint: "처음 양에서 쓴 양을 빼요.",
    explanation: `${mixedText(x, d)} − ${mixedText(y, d)} = ${mixedText(x - y, d)} (${item.unit})`,
  };
});

export const l4MixedWhoMore = word("l4-mixed-who-more", (rand) => {
  const [a, b] = names(rand);
  const d = randInt(rand, 4, 9);
  const xa = mixed(rand, d, 4, 7);
  const ua = mixed(rand, d, 1, 3);
  const xb = mixed(rand, d, 4, 7);
  const ub = mixed(rand, d, 1, 3);
  const ra = xa - ua;
  const rb = xb - ub;
  // 받아내림은 다음 차시에 배우므로 분수 부분끼리 뺄 수 있는 수만
  const noBorrow = (p: number, q: number) => p % d >= q % d;
  if (ra === rb || !noBorrow(xa, ua) || !noBorrow(xb, ub) || !noBorrow(Math.max(ra, rb), Math.min(ra, rb))) return null;
  const winner = ra > rb ? a : b;
  const diff = mixedText(Math.abs(ra - rb), d);
  const r = markChoice(rand, `${winner}, ${diff} m`, [
    `${winner === a ? b : a}, ${diff} m`,
    `${winner}, ${mixedText(Math.abs(ra - rb) + 1, d)} m`,
    `${winner}, ${mixedText(Math.abs(xa - xb) || Math.abs(ra - rb) + 2, d)} m`,
  ]);
  return {
    key: `${d}:${xa}:${ua}:${xb}:${ub}:${r.answer}`,
    prompt: `${a}는 철사 ${mixedText(xa, d)} m 중에서 ${mixedText(ua, d)} m를 쓰고, ${b}는 철사 ${mixedText(xb, d)} m 중에서 ${mixedText(ub, d)} m를 썼습니다. 누구의 철사가 몇 m 더 많이 남았는지 고르세요.`,
    visual: r.visual,
    answer: r.answer,
    choices: r.choices,
    hint: "두 사람의 남은 철사 길이를 각각 구한 뒤 비교해요.",
    explanation: `${a}: ${mixedText(ra, d)} m, ${b}: ${mixedText(rb, d)} m → ${winner}가 ${diff} m 더 많이 남았어요.`,
  };
});

export const l4WholeMinus = easy("l4-whole-minus", (rand) => {
  const d = randInt(rand, 3, 9);
  const w = randInt(rand, 2, 6);
  const y = rand() < 0.4 ? randInt(rand, 1, d - 1) : mixed(rand, d, 1, w - 1);
  if (y >= w * d) return null;
  return {
    key: `${d}:${w}:${y}`,
    prompt: "계산해 보세요.",
    expression: `${w} − ${mixedText(y, d)}`,
    answer: mixedText(w * d - y, d),
    choices: fracOpts(rand, w * d - y, d, [w * d - y + d, (w - Math.floor(y / d)) * d + (y % d), w * d - y - 1]),
    hint: `자연수 ${w}에서 1만큼을 ${josa(`${d}/${d}`, "으로/로")} 바꾸어 계산해요.`,
    explanation: `${w} = ${w - 1} ${d}/${d} → ${w} − ${mixedText(y, d)} = ${mixedText(w * d - y, d)}`,
    mistakes: { [mixedText((w - Math.floor(y / d)) * d + (y % d), d)]: "자연수에서 자연수만 빼고 분수는 그대로 두었어요." },
  };
});

export const l4WholeToFrac = mid("l4-whole-to-frac", (rand) => {
  const d = randInt(rand, 3, 12);
  const w = randInt(rand, 2, 9);
  const improper = rand() < 0.5;
  return {
    key: `${d}:${w}:${improper}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: improper ? `${w} = □/${d}` : `${w} = ${w - 1} □/${d}`,
    answer: improper ? w * d : d,
    hint: `1 = ${josa(`${d}/${d}`, "이에요/예요")}.`,
    explanation: improper ? `${w} = ${w} × ${d}/${d} = ${w * d}/${d}` : `${w} = ${w - 1} + 1 = ${w - 1} ${d}/${d}`,
  };
});

export const l4WholeMinusBox = mid("l4-whole-minus-box", (rand) => {
  const d = randInt(rand, 3, 9);
  const w = randInt(rand, 3, 8);
  const r = mixed(rand, d, 0, w - 2);
  const y = w * d - r;
  return {
    key: `${d}:${w}:${r}`,
    prompt: "□ 안에 알맞은 수를 고르세요.",
    expression: `${w} − □ = ${mixedText(r, d)}`,
    answer: mixedText(y, d),
    choices: fracOpts(rand, y, d, [y + d, r, y - d]),
    hint: `□ = ${w} − ${josa(mixedText(r, d), "으로/로")} 구해요.`,
    explanation: `${w} − ${mixedText(r, d)} = ${mixedText(y, d)}`,
  };
});

export const l4WholeWrongOp = word("l4-whole-wrong-op", (rand) => {
  const d = randInt(rand, 3, 9);
  const b = mixed(rand, d, 1, 2);
  const w = randInt(rand, 5, 10);
  const x = w * d - b; // 어떤 수 + b = w
  const right = x - b;
  if (right <= 0) return null;
  return {
    key: `${d}:${b}:${w}`,
    prompt: `어떤 수에서 ${fj(mixedText(b, d), "을/를")} 빼야 할 것을 잘못하여 더했더니 ${fj(w, "이/가")} 되었습니다. 바르게 계산한 값을 고르세요.`,
    answer: mixedText(right, d),
    choices: fracOpts(rand, right, d, [x, w * d - b + d, right + d]),
    hint: `먼저 ${w} − ${josa(mixedText(b, d), "으로/로")} 어떤 수를 구해요.`,
    explanation: `어떤 수: ${w} − ${mixedText(b, d)} = ${mixedText(x, d)} → ${mixedText(x, d)} − ${mixedText(b, d)} = ${mixedText(right, d)}`,
  };
});

export const l4WholePizza = word("l4-whole-pizza", (rand) => {
  const [a, b] = names(rand);
  const d = pick(rand, [6, 8, 10, 12]);
  const w = randInt(rand, 2, 4);
  const ea = randInt(rand, 1, d - 1);
  const eb = mixed(rand, d, 0, 1);
  const left = w * d - ea - eb;
  if (left <= 0) return null;
  return {
    key: `${d}:${w}:${ea}:${eb}`,
    prompt: `똑같이 ${d}조각으로 나눈 피자가 ${w}판 있습니다. ${a}는 ${ea}/${d}판을 먹고, ${b}는 ${mixedText(eb, d)}판을 먹었습니다. 남은 피자는 몇 판인가요?`,
    answer: mixedText(left, d),
    choices: fracOpts(rand, left, d, [w * d - ea, w * d - eb, left + d]),
    hint: `${w}판에서 두 사람이 먹은 양을 차례로 빼요.`,
    explanation: `${w} − ${ea}/${d} − ${mixedText(eb, d)} = ${mixedText(left, d)}(판)`,
  };
});

export const l4BorrowStep = easy("l4-borrow-step", (rand) => {
  const d = randInt(rand, 4, 9);
  const w = randInt(rand, 2, 7);
  const a = randInt(rand, 1, d - 2);
  return {
    key: `${d}:${w}:${a}`,
    prompt: `받아내림이 있는 뺄셈을 하려고 대분수 ${w} ${a}/${d}의 자연수에서 1을 분수로 바꾸었습니다. □ 안에 알맞은 수를 쓰세요.`,
    expression: `${w} ${a}/${d} = ${w - 1} □/${d}`,
    answer: d + a,
    hint: `1 = ${josa(`${d}/${d}`, "이에요/예요")}. 원래 분자에 ${josa(d, "을/를")} 더해요.`,
    explanation: `${w} ${a}/${d} = ${w - 1} + ${d}/${d} + ${a}/${d} = ${w - 1} ${d + a}/${d}`,
    mistakes: { [a]: "받아내린 1을 분자에 더하지 않았어요." },
  };
});

export const l4BorrowFix = mid("l4-borrow-fix", (rand) => {
  const [a] = names(rand, 1);
  const d = randInt(rand, 5, 9);
  const fx = randInt(rand, 1, d - 3);
  const fy = randInt(rand, fx + 1, d - 1);
  const wx = randInt(rand, 3, 7);
  const wy = randInt(rand, 1, wx - 1);
  const x = wx * d + fx;
  const y = wy * d + fy;
  const wrong = `${wx - wy} ${fy - fx}/${d}`;
  return {
    key: `${d}:${x}:${y}`,
    prompt: `${a}는 ${fj(`${mixedText(x, d)} − ${mixedText(y, d)}`, "을/를")} 계산할 때 분자끼리 뺄 수 없어 큰 분자에서 작은 분자를 빼서 ${fj(wrong, "이라고/라고")} 했습니다. 바르게 계산한 값을 고르세요.`,
    answer: mixedText(x - y, d),
    choices: fracOpts(rand, x - y, d, [(wx - wy) * d + (fy - fx), x - y + d, x - y + 1]),
    hint: "분수끼리 뺄 수 없으면 자연수에서 1을 받아내려 분수로 바꿔요.",
    explanation: `${mixedText(x, d)} = ${wx - 1} ${d + fx}/${d} → ${mixedText(x, d)} − ${mixedText(y, d)} = ${mixedText(x - y, d)}`,
    mistakes: { [wrong]: "분자를 거꾸로 뺐어요." },
  };
});

export const l4BorrowBoxRange = word("l4-borrow-box-range", (rand) => {
  const d = randInt(rand, 6, 12);
  const w = randInt(rand, 3, 8);
  const a = randInt(rand, 1, d - 2);
  const x = w * d + a;
  const target = (w - 1) * d + randInt(rand, a + 1, d - 1);
  // x − □ > target → □ < x − target, □는 1 ~ d−1 (진분수의 분자)
  const limit = x - target;
  const count = Math.min(d - 1, limit - 1);
  if (count < 1) return null;
  const most = rand() < 0.5;
  return {
    key: `${d}:${x}:${target}:${most}`,
    prompt: most
      ? `다음 식에서 □ 안에 들어갈 수 있는 자연수 중 가장 큰 수를 구하세요.`
      : `다음 식에서 □ 안에 들어갈 수 있는 자연수는 모두 몇 개인가요?`,
    expression: `${mixedText(x, d)} − □/${d} > ${mixedText(target, d)}`,
    answer: count,
    unit: most ? undefined : "개",
    hint: `두 대분수를 가분수로 바꾸면 분자끼리 비교할 수 있어요: ${x}/${d}, ${target}/${d}`,
    explanation: `${x} − □ > ${target} → □ < ${limit} → □는 1부터 ${count}까지`,
    mistakes: { [limit]: "같은 경우까지 넣었어요. 더 커야 해요." },
  };
});

export const l4MixedBack = word("l4-mixed-back", (rand) => {
  // 두 번 잘라 쓰고 남은 길이: 적어도 한 번은 받아내림이 필요하다
  const d = randInt(rand, 4, 9);
  const start = randInt(rand, 6, 9) * d + randInt(rand, 1, d - 2);
  const u1 = randInt(rand, 1, 3) * d + randInt(rand, (start % d) + 1, d - 1);
  const u2 = mixed(rand, d, 1, 2);
  const left = start - u1 - u2;
  if (left <= d || left % d === 0) return null;
  const mid1 = start - u1;
  return {
    key: `${d}:${start}:${u1}:${u2}`,
    prompt: `끈 ${mixedText(start, d)} m 중에서 ${mixedText(u1, d)} m를 잘라 쓰고, 다시 ${mixedText(u2, d)} m를 잘라 썼습니다. 남은 끈은 몇 m인가요?`,
    answer: mixedText(left, d),
    choices: fracOpts(rand, left, d, [left + d, start - u1 + u2, left - 1]),
    hint: "앞에서부터 차례로 빼요. 분수 부분끼리 뺄 수 없으면 자연수 1을 분수로 바꾸어 받아내려요.",
    explanation: `${mixedText(start, d)} − ${mixedText(u1, d)} = ${mixedText(mid1, d)}, ${mixedText(mid1, d)} − ${mixedText(u2, d)} = ${mixedText(left, d)} (m)`,
    mistakes: { [mixedText(left + d, d)]: "받아내린 1을 자연수 부분에서 빼지 않았어요." },
  };
});

/* ── 소수 ── */

/** 천분의 일 단위 정수 → 소수 문자열 */
const dt = (th: number) => String(Number((th / 1000).toFixed(3)));
const DIGIT_KO = ["영", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
const readDec = (s: string) => {
  const [w, f = ""] = s.split(".");
  const whole = w === "0" ? "영" : w.split("").map((c, i, arr) => {
    const v = Number(c);
    const place = ["", "십", "백"][arr.length - 1 - i];
    if (v === 0) return "";
    return (v === 1 && place ? "" : DIGIT_KO[v]) + place;
  }).join("");
  return f ? `${whole} 점 ${f.split("").map((c) => DIGIT_KO[Number(c)]).join("")}` : whole;
};

export const l4Dec2Read = easy("l4-dec2-read", (rand) => {
  const w = randInt(rand, 0, 9);
  const a = randInt(rand, 0, 9);
  const b = randInt(rand, 1, 9);
  const v = dt(w * 1000 + a * 100 + b * 10);
  return {
    key: `${w}:${a}:${b}`,
    prompt: `1이 ${w}개, 0.1이 ${a}개, 0.01이 ${b}개인 수를 소수로 쓰세요.`,
    answer: v,
    hint: "일의 자리, 소수 첫째 자리, 소수 둘째 자리 순서로 숫자를 써요.",
    explanation: `${w} + ${dt(a * 100)} + ${dt(b * 10)} = ${v}`,
  };
});

export const l4DecReadChoice = mid("l4-dec-read-choice", (rand) => {
  const w = randInt(rand, 1, 19);
  const a = rand() < 0.4 ? 0 : randInt(rand, 1, 9);
  const b = randInt(rand, 1, 9);
  const s = `${w}.${a}${b}`;
  const answer = readDec(s);
  const wrongs = [`${w}.${b}`, `${w}.${b}${a}`, `${w}${a}.${b}`].filter((x) => x !== s).map(readDec);
  return {
    key: s,
    prompt: `${josa(s, "을/를")} 바르게 읽은 것을 고르세요.`,
    answer,
    choices: opts(rand, answer, [...wrongs, `${readDec(String(w))} 점 ${a ? DIGIT_KO[a] + "십" : ""}${DIGIT_KO[b]}`], () => readDec(`${w}.${randInt(rand, 1, 9)}${randInt(rand, 1, 9)}`)),
    hint: "소수점 아래 숫자는 자릿값 없이 숫자만 차례로 읽어요. 0도 '영'으로 읽어요.",
    explanation: `${s} → ${answer}`,
  };
});

export const l4Dec2Unit = mid("l4-dec2-unit", (rand) => {
  const n = randInt(rand, 101, 999);
  const toM = rand() < 0.6;
  return {
    key: `${toM}:${n}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: toM ? `${n} cm = □ m` : `${dt(n * 10)} m = □ cm`,
    answer: toM ? dt(n * 10) : n,
    hint: "1 cm = 0.01 m, 1 m = 100 cm예요.",
    explanation: toM ? `${n} cm는 0.01 m가 ${n}개 → ${dt(n * 10)} m` : `${dt(n * 10)} m는 0.01 m가 ${n}개 → ${n} cm`,
    mistakes: toM ? { [dt(n * 100)]: "1 cm는 0.1 m가 아니라 0.01 m예요." } : { [n / 10]: "1 m는 100 cm예요." },
  };
});

export const l4DecCond = word("l4-dec-cond", (rand) => {
  const w = randInt(rand, 2, 8);
  const a = randInt(rand, 1, 8);
  // 소수 두 자리 수이므로 둘째 자리 숫자는 0이 아니다
  const b = randInt(rand, 1, 9);
  if (a === b) return null;
  const v = dt(w * 1000 + a * 100 + b * 10);
  const clueB = b > a ? `소수 둘째 자리 숫자는 소수 첫째 자리 숫자보다 ${b - a} 큽니다.` : `소수 둘째 자리 숫자는 소수 첫째 자리 숫자보다 ${a - b} 작습니다.`;
  return {
    key: v,
    prompt: `다음 조건을 모두 만족하는 소수를 구하세요. 소수 두 자리 수입니다. ${w}보다 크고 ${w + 1}보다 작습니다. 소수 첫째 자리 숫자는 ${a}입니다. ${clueB}`,
    answer: v,
    hint: `${w}보다 크고 ${w + 1}보다 작으면 일의 자리 숫자는 ${josa(w, "이에요/예요")}.`,
    explanation: `일의 자리 ${w}, 소수 첫째 자리 ${a}, 소수 둘째 자리 ${b} → ${v}`,
  };
});

export const l4Dec3Unit = mid("l4-dec3-unit", (rand) => {
  const kind = pick(rand, ["km", "kg"] as const);
  const big = randInt(rand, 1, 9);
  const small = randInt(rand, 1, 999);
  const unit = kind === "km" ? "m" : "g";
  return {
    key: `${kind}:${big}:${small}`,
    prompt: "□ 안에 알맞은 소수를 써넣으세요.",
    expression: `${big} ${kind} ${small} ${unit} = □ ${kind}`,
    answer: dt(big * 1000 + small),
    hint: `1 ${unit} = ${josa(`0.001 ${kind}`, "이에요/예요")}. ${josa(`${small} ${unit}`, "을/를")} 소수로 바꿔 더해요.`,
    explanation: `${small} ${unit} = ${dt(small)} ${kind} → ${dt(big * 1000 + small)} ${kind}`,
    mistakes: { [`${big}.${small}`]: `${josa(`${small} ${unit}`, "을/를")} ${josa(kind, "으로/로")} 바꿀 때 자리를 맞추지 않았어요.` },
  };
});

export const l4Dec3Cards = word("l4-dec3-cards", (rand) => {
  // 0 카드가 있으면 끝자리 0(8.640 → 8.64) 때문에 모양과 답이 어긋나므로 1~9만
  const cards = shuffle(rand, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4);
  const most = rand() < 0.5;
  const sorted = [...cards].sort((a, b) => (most ? b - a : a - b));
  const v = `${sorted[0]}.${sorted.slice(1).join("")}`;
  return {
    key: `${[...cards].sort().join()}:${most}`,
    prompt: `수 카드 ${cards.length}장 ${josa(cards.join(", "), "을/를")} 한 번씩 모두 사용하여 □.□□□ 모양의 소수 세 자리 수를 만들려고 합니다. 만들 수 있는 가장 ${most ? "큰" : "작은"} 수를 쓰세요.`,
    answer: String(Number(v)),
    hint: `가장 높은 자리(일의 자리)부터 ${most ? "큰" : "작은"} 숫자를 차례로 놓아요.`,
    explanation: `${v}`,
  };
});

export const l4DecWalk = word("l4-dec-walk", (rand) => {
  // 소수 세 자리 차시: 크기 비교는 다음 차시라, 서로 다른 단위로 적은 거리가 같은지만 판단한다.
  // 세 사람은 같은 거리, 한 사람은 자릿값을 잘못 옮긴 거리(1.25 km ↔ 1 km 25 m)
  const ns = names(rand, 4);
  const k = randInt(rand, 1, 3);
  // m는 두 자리 이하: 0을 빠뜨린 실수(1 km 25 m를 1.25 km로, 1 km 30 m를 1.3 km로)가 다른 사람의 거리
  const m = randInt(rand, 1, 99);
  const v = k * 1000 + m;
  const odd = k * 1000 + Number(String(m).replace(/0+$/, "").padEnd(3, "0"));
  const forms = shuffle(rand, [0, 1, 2]);
  const say = (x: number, f: number) => (f === 0 ? `${Math.floor(x / 1000)} km ${x % 1000} m` : f === 1 ? `${dt(x)} km` : `${x} m`);
  const oddAt = randInt(rand, 0, 3);
  const oddForm = pick(rand, [0, 1, 2]);
  let j = 0;
  const shown = ns.map((n, i) => (i === oddAt ? `${n}: ${say(odd, oddForm)}` : `${n}: ${say(v, forms[j++])}`));
  const who = ns[oddAt];
  return {
    key: `${v}:${oddAt}:${forms.join()}:${oddForm}`,
    prompt: `네 사람이 걸은 거리입니다. ${shown.join(", ")}. 이 중 세 사람은 같은 거리를 걸었습니다. 다른 거리를 걸은 사람은 누구인가요?`,
    answer: who,
    choices: ns,
    hint: "1 m = 0.001 km예요. 모두 km 단위의 소수로 바꾸어 보아요.",
    explanation: `${ns.map((n, i) => `${n} ${dt(i === oddAt ? odd : v)} km`).join(", ")} → ${who}`,
  };
});

export const l4DecOrder = mid("l4-dec-order", (rand) => {
  const base = randInt(rand, 1, 9) * 1000;
  const set = new Set<number>();
  while (set.size < 4) set.add(base + randInt(rand, 1, 99) * pick(rand, [1, 10, 100]) % 1000);
  const vals = [...set];
  const most = rand() < 0.5;
  const target = most ? Math.max(...vals) : Math.min(...vals);
  return {
    key: `${vals.join()}:${most}`,
    prompt: `가장 ${most ? "큰" : "작은"} 수를 고르세요.`,
    answer: dt(target),
    choices: vals.map(dt),
    hint: "자연수 부분이 같으면 소수 첫째 자리, 둘째 자리, 셋째 자리 순서로 비교해요.",
    explanation: `${[...vals].sort((a, b) => b - a).map(dt).join(" > ")}`,
  };
});

export const l4DecEqualPick = mid("l4-dec-equal-pick", (rand) => {
  const w = randInt(rand, 1, 9);
  const a = randInt(rand, 1, 9);
  const s = `${w}.${a}`;
  const answer = `${s}0`;
  const wrongs = [`${w}.0${a}`, `${w}${a}`, `0.${w}${a}`, `${w}.00${a}`].filter((x) => Number(x) !== Number(s));
  return {
    key: s,
    prompt: `${josa(s, "과/와")} 크기가 같은 수를 고르세요.`,
    answer,
    choices: opts(rand, answer, shuffle(rand, wrongs), () => `${w}.${a}${randInt(rand, 1, 9)}`),
    hint: "소수의 오른쪽 끝에 있는 0은 생략할 수 있어요.",
    explanation: `${answer}에서 끝의 0을 생략하면 ${s}입니다.`,
  };
});

export const l4DecBoxCount = word("l4-dec-box-count", (rand) => {
  const w = randInt(rand, 1, 9);
  const a = randInt(rand, 0, 9);
  const b = randInt(rand, 1, 8);
  const c = randInt(rand, 1, 9);
  const bigger = rand() < 0.5;
  // w.□c ○ w.ab
  const target = a * 10 + b;
  const count = Array.from({ length: 10 }, (_, d) => d * 10 + c).filter((v) => (bigger ? v > target : v < target)).length;
  if (count === 0 || count === 10) return null;
  return {
    key: `${w}:${a}:${b}:${c}:${bigger}`,
    prompt: "0부터 9까지의 수 중에서 □ 안에 들어갈 수 있는 수는 모두 몇 개인가요?",
    expression: `${w}.□${c} ${bigger ? ">" : "<"} ${w}.${a}${b}`,
    answer: count,
    unit: "개",
    hint: "소수 첫째 자리가 같을 때는 소수 둘째 자리까지 비교해야 해요.",
    explanation: `□에 0부터 9까지 넣어 비교하면 ${count}개입니다.`,
  };
});

export const l4DecWhoFar = word("l4-dec-who-far", (rand) => {
  // 상: 단위가 섞인 기록(1.09 m, 1 m 9 cm, 109 cm)을 m 단위 소수로 바꾼 뒤 순서를 정한다
  const ns = names(rand, 4);
  const set = new Set<number>();
  while (set.size < 4) set.add(randInt(rand, 95, 210));
  const vals = [...set]; // cm
  const forms = shuffle(rand, [0, 1, 2, pick(rand, [0, 1, 2])]);
  // 1 m가 안 되는 기록은 m·cm 꼴("0 m 97 cm")로 쓰지 않고 cm로
  const say = (cm: number, f: number) => (f === 0 ? `${dt(cm * 10)} m` : f === 1 || cm < 100 ? `${cm} cm` : `${Math.floor(cm / 100)} m${cm % 100 ? ` ${cm % 100} cm` : ""}`);
  const ask = pick(rand, ["멀리", "짧게", "두 번째로 멀리"] as const);
  const sorted = [...vals].sort((a, b) => b - a);
  const target = ask === "멀리" ? sorted[0] : ask === "짧게" ? sorted[3] : sorted[1];
  const who = ns[vals.indexOf(target)];
  return {
    key: `${vals.join()}:${forms.join()}:${ask}`,
    prompt: `제자리멀리뛰기 기록입니다. ${ns.map((n, i) => `${n}: ${say(vals[i], forms[i])}`).join(", ")}. ${ask === "두 번째로 멀리" ? ask : `가장 ${ask}`} 뛴 사람은 누구인가요?`,
    answer: who,
    choices: ns,
    hint: "1 cm = 0.01 m예요. 기록을 모두 m 단위의 소수로 바꾼 뒤 일의 자리부터 차례로 비교해요.",
    explanation: `${sorted.map((v) => `${ns[vals.indexOf(v)]} ${dt(v * 10)} m`).join(" > ")} → ${who}`,
  };
});

export const l4DecTimes10 = easy("l4-dec-times10", (rand) => {
  const k = randInt(rand, 11, 999);
  const up = rand() < 0.5;
  const f = pick(rand, [10, 100]);
  const base = k * 10; // 천분의 일 단위: 소수 두 자리 수
  const res = up ? base * f : base / f;
  if (!Number.isInteger(res)) return null;
  return {
    key: `${k}:${up}:${f}`,
    prompt: up ? `${dt(base)}의 ${f}배는 얼마인가요?` : `${dt(base)}의 ${fj(`1/${f}`, "은/는")} 얼마인가요?`,
    answer: dt(res),
    hint: up ? `${f}배 하면 소수점이 오른쪽으로 ${f === 10 ? "한" : "두"} 자리 옮겨져요.` : `${fj(`1/${f}`, "을/를")} 하면 소수점이 왼쪽으로 ${f === 10 ? "한" : "두"} 자리 옮겨져요.`,
    explanation: `${dt(base)} ${up ? `× ${f}` : `÷ ${f}`} = ${dt(res)}`,
  };
});

export const l4DecTimesBox = mid("l4-dec-times-box", (rand) => {
  const k = randInt(rand, 101, 999);
  const f = pick(rand, [10, 100, 1000]);
  const result = k * 100; // 천분의 일 단위: 소수 한 자리 수(예: 25.6)
  const x = result / f;
  if (!Number.isInteger(x)) return null;
  return {
    key: `${k}:${f}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: `□의 ${f}배는 ${dt(result)}입니다.`,
    answer: dt(x),
    hint: `${f}배 하기 전의 수이므로 ${dt(result)}의 ${fj(`1/${f}`, "을/를")} 구해요.`,
    explanation: `${dt(result)}의 1/${f} = ${dt(x)}`,
    mistakes: { [dt(result * f)]: `거꾸로 ${f}배 했어요.` },
  };
});

export const l4DecRelOdd = mid("l4-dec-rel-odd", (rand) => {
  const k = randInt(rand, 11, 99);
  const v = k * 100; // k/10 (예: 5.2)
  const same = [`${dt(v / 10)}의 10배`, `${dt(v * 10)}의 1/10`, `${dt(v / 100)}의 100배`, `${dt(v * 100)}의 1/100`];
  const oddOpts = [`${dt(v / 10)}의 100배`, `${dt(v * 10)}의 1/100`, `${dt(v / 100)}의 10배`];
  const odd = pick(rand, oddOpts);
  const choices = shuffle(rand, [odd, ...shuffle(rand, same).slice(0, 3)]);
  return {
    key: `${k}:${choices.join()}`,
    prompt: "나타내는 수가 다른 하나를 고르세요.",
    answer: odd,
    choices,
    hint: "각각 계산하여 어떤 수가 되는지 확인해요.",
    explanation: `${odd}만 ${josa(dt(v), "이/가")} 아니에요. 나머지는 모두 ${dt(v)}입니다.`,
  };
});

export const l4DecRelWrong = word("l4-dec-rel-wrong", (rand) => {
  const f = pick(rand, [10, 100]);
  // 어떤 수(천분의 일 단위): 1/100을 구할 때는 소수 한 자리 수라야 답이 소수 셋째 자리에서 끝난다
  const x = f === 100 ? randInt(rand, 11, 999) * 100 : randInt(rand, 11, 999) * 10;
  const wrongRes = x * f;
  const right = x / f;
  if (!Number.isInteger(right)) return null;
  return {
    key: `${x}:${f}`,
    prompt: `어떤 수의 ${fj(`1/${f}`, "을/를")} 구해야 할 것을 잘못하여 ${f}배 했더니 ${josa(dt(wrongRes), "이/가")} 되었습니다. 바르게 구한 값은 얼마인가요?`,
    answer: dt(right),
    hint: `먼저 ${dt(wrongRes)}의 1/${f}로 어떤 수를 구해요.`,
    explanation: `어떤 수: ${dt(x)} → ${dt(x)}의 1/${f} = ${dt(right)}`,
    mistakes: { [dt(x)]: "어떤 수까지만 구했어요." },
  };
});

export const l4DecRelCoins = word("l4-dec-rel-coins", (rand) => {
  // 구슬 한 개는 소수 한 자리 g(예: 6.5 g): 1개 ↔ 10개 ↔ 100개 사이의 관계
  const each = randInt(rand, 11, 99) * 100;
  if (each % 1000 === 0) return null;
  const [n, ask] = pick(rand, [[100, 1], [100, 10], [10, 1], [1, 100], [1, 10]] as const);
  return {
    key: `${each}:${n}:${ask}`,
    prompt: `똑같은 구슬 ${n}개의 무게가 ${dt(each * n)} g입니다. 이 구슬 ${ask}개의 무게는 몇 g인가요?`,
    answer: dt(each * ask),
    unit: "g",
    hint: n > ask ? `${ask}개는 ${n}개의 ${fj(`1/${n / ask}`, "이에요/예요")}. 소수점을 왼쪽으로 옮겨요.` : `${ask}개는 1개의 ${ask}배예요. 소수점을 오른쪽으로 옮겨요.`,
    explanation: n > ask ? `${dt(each * n)}의 1/${n / ask} = ${dt(each * ask)} (g)` : `${dt(each)}의 ${ask}배 = ${dt(each * ask)} (g)`,
    mistakes: { [dt(each * n)]: "주어진 무게를 그대로 답했어요." },
  };
});

export const l4DecAddBox = mid("l4-dec-add-box", (rand) => {
  const a = randInt(rand, 101, 899) * 10;
  const b = randInt(rand, 11, 99) * 100;
  const sum = a + b;
  return {
    key: `${a}:${b}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: `${dt(a)} + □ = ${dt(sum)}`,
    answer: dt(b),
    hint: "덧셈식을 뺄셈식으로 바꾸어 구해요.",
    explanation: `${dt(sum)} − ${dt(a)} = ${dt(b)}`,
  };
});

export const l4DecAddCards = word("l4-dec-add-cards", (rand) => {
  const cards = shuffle(rand, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3);
  const desc = [...cards].sort((a, b) => b - a);
  const asc = [...cards].sort((a, b) => a - b);
  const big = desc[0] * 1000 + desc[1] * 100 + desc[2] * 10;
  const small = asc[0] * 1000 + asc[1] * 100 + asc[2] * 10;
  const sub = rand() < 0.5;
  const res = sub ? big - small : big + small;
  return {
    key: `${asc.join()}:${sub}`,
    prompt: `수 카드 ${cards.length}장 ${josa(cards.join(", "), "을/를")} 한 번씩 모두 사용하여 □.□□ 모양의 소수 두 자리 수를 만들려고 합니다. 만들 수 있는 가장 큰 수와 가장 작은 수의 ${sub ? "차를" : "합을"} 구하세요.`,
    answer: dt(res),
    hint: "가장 큰 수는 큰 숫자부터, 가장 작은 수는 작은 숫자부터 높은 자리에 놓아요.",
    explanation: `${dt(big)} ${sub ? "−" : "+"} ${dt(small)} = ${dt(res)}`,
  };
});

export const l4DecSubFix = mid("l4-dec-sub-fix", (rand) => {
  const [a] = names(rand, 1);
  const x = randInt(rand, 21, 99) * 100; // 소수 한 자리
  const y = randInt(rand, 101, 999) * 10; // 소수 두 자리
  if (y >= x || x % 1000 === 0) return null;
  const xi = x / 100;
  const yi = y / 10;
  const wrong = Math.abs(xi - yi) / 100;
  return {
    key: `${x}:${y}`,
    prompt: `${a}는 ${josa(`${dt(x)} − ${dt(y)}`, "을/를")} 소수점의 자리를 맞추지 않고 끝자리를 맞추어 계산했습니다. 바르게 계산한 값을 구하세요.`,
    answer: dt(x - y),
    hint: `${josa(dt(x), "을/를")} ${josa((x / 1000).toFixed(2), "으로/로")} 생각하여 소수점의 자리를 맞추어요.`,
    explanation: `${(x / 1000).toFixed(2)} − ${dt(y)} = ${dt(x - y)}`,
    mistakes: { [String(Number(wrong.toFixed(2)))]: "끝자리를 맞추어 계산한 값이에요." },
  };
});

export const l4DecWrongOp = word("l4-dec-wrong-op", (rand) => {
  const x = randInt(rand, 200, 999) * 10;
  const b = randInt(rand, 11, 199) * 10;
  if (b >= x) return null;
  const addRight = rand() < 0.5;
  const wrongRes = addRight ? x - b : x + b;
  const right = addRight ? x + b : x - b;
  return {
    key: `${x}:${b}:${addRight}`,
    prompt: `${addRight ? "어떤 수에" : "어떤 수에서"} ${josa(dt(b), "을/를")} ${addRight ? "더해야" : "빼야"} 할 것을 잘못하여 ${addRight ? "뺐더니" : "더했더니"} ${josa(dt(wrongRes), "이/가")} 되었습니다. 바르게 계산하면 얼마인가요?`,
    answer: dt(right),
    hint: "잘못 계산한 식을 거꾸로 풀어 어떤 수부터 구해요.",
    explanation: `어떤 수: ${dt(x)} → ${dt(x)} ${addRight ? "+" : "−"} ${dt(b)} = ${dt(right)}`,
    mistakes: { [dt(x)]: "어떤 수까지만 구했어요." },
  };
});

export const l4DecSubLife = word("l4-dec-sub-life", (rand) => {
  const [a] = names(rand, 1);
  const total = randInt(rand, 15, 30) * 100;
  const u1 = randInt(rand, 11, 60) * 10;
  const u2 = randInt(rand, 1, 9) * 100;
  const left = total - u1 - u2;
  if (left <= 0) return null;
  return {
    key: `${total}:${u1}:${u2}`,
    prompt: `${a}네 집에 우유가 ${dt(total)} L 있었습니다. 아침에 ${dt(u1)} L를 마시고, 빵을 만드는 데 ${dt(u2)} L를 썼습니다. 남은 우유는 몇 L인가요?`,
    answer: dt(left),
    unit: "L",
    hint: "처음 양에서 쓴 양을 차례로 빼거나, 쓴 양을 먼저 더해서 빼요.",
    explanation: `${dt(total)} − ${dt(u1)} − ${dt(u2)} = ${dt(left)} (L)`,
  };
});
