import type { ShapeScene, Visual } from "../types";
import { pick, randInt, shuffle } from "../../lib/random";
import { easy, fmt, markChoice, mid, names, opts, word } from "./g4";
import { josa } from "../josa";
import { ord } from "../ordinal";
import { mul3x2Steps } from "../generators/grade4";

/**
 * 4학년 차시용 생성기(2): 4-1 곱셈과 나눗셈, 규칙 찾기
 */

/* ── 곱셈 ── */

export const l4Mul3Tens = easy("l4-mul3-tens", (rand) => {
  const a = randInt(rand, 102, 999);
  const t = randInt(rand, 2, 9);
  return {
    key: `${a}:${t}`,
    prompt: "계산해 보세요.",
    expression: `${a} × ${t * 10} = □`,
    answer: a * t * 10,
    hint: `${josa(`${a} × ${t}`, "을/를")} 구한 뒤 0을 하나 붙여요.`,
    explanation: `${a} × ${t} = ${a * t} → ${a} × ${t * 10} = ${a * t * 10}`,
    mistakes: { [a * t]: "0을 붙이지 않았어요." },
  };
});

export const l4MulTensBox = mid("l4-mul-tens-box", (rand) => {
  // (세 자리 수) × (몇십) 차시: 곱해지는 수는 세 자리 수
  const a = randInt(rand, 101, 999);
  const t = randInt(rand, 2, 9) * 10;
  return {
    key: `${a}:${t}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: `${a} × □ = ${a * t}`,
    answer: t,
    hint: "곱셈과 나눗셈의 관계를 이용하거나, 몇십을 넣어 곱해 보세요.",
    explanation: `${a * t} ÷ ${a} = ${t}`,
    mistakes: { [t / 10]: "0의 개수를 확인해 보세요." },
  };
});

export const l4MulTensFix = mid("l4-mul-tens-fix", (rand) => {
  const [a] = names(rand, 1);
  const x = randInt(rand, 102, 999);
  const t = randInt(rand, 2, 9);
  return {
    key: `${x}:${t}`,
    prompt: `${a}는 ${x} × ${t * 10}을 계산하면서 0을 붙이는 것을 잊어 ${josa(x * t, "이라고/라고")} 썼습니다. 바르게 계산한 값을 구하세요.`,
    answer: x * t * 10,
    hint: "(세 자리 수) × (몇십)은 (세 자리 수) × (몇)의 10배예요.",
    explanation: `${x} × ${t * 10} = ${x * t} × 10 = ${x * t * 10}`,
    mistakes: { [x * t]: "잘못 계산한 값을 그대로 썼어요." },
  };
});

export const l4MulTensLife = word("l4-mul-tens-life", (rand) => {
  // 한 봉지·상자에 담는 양은 현실적으로(방울토마토 한 상자 100~250개, 귤 한 상자 100~150개)
  const per1 = randInt(rand, 100, 150);
  const n1 = randInt(rand, 2, 9) * 10;
  const per2 = randInt(rand, 100, 250);
  const n2 = randInt(rand, 2, 9) * 10;
  return {
    key: `${per1}:${n1}:${per2}:${n2}`,
    prompt: `농장에서 한 상자에 ${per1}개씩 담긴 귤 ${n1}상자와 한 상자에 ${per2}개씩 담긴 방울토마토 ${n2}상자를 팔았습니다. 판 귤과 방울토마토는 모두 몇 개인가요?`,
    answer: per1 * n1 + per2 * n2,
    unit: "개",
    hint: "귤과 방울토마토의 수를 각각 곱셈으로 구한 뒤 더해요.",
    explanation: `${per1} × ${n1} = ${per1 * n1}, ${per2} × ${n2} = ${per2 * n2}, 합 ${per1 * n1 + per2 * n2}(개)`,
  };
});

export const l4CardsMulTens = word("l4-cards-mul-tens", (rand) => {
  const cards = shuffle(rand, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3);
  const t = randInt(rand, 2, 9) * 10;
  const most = rand() < 0.5;
  const sorted = [...cards].sort((a, b) => (most ? b - a : a - b));
  const n = Number(sorted.join(""));
  return {
    key: `${[...cards].sort().join("")}:${t}:${most}`,
    prompt: `수 카드 ${cards.length}장 ${josa(cards.join(", "), "을/를")} 한 번씩 모두 사용하여 세 자리 수를 만들고, 그 수에 ${josa(t, "을/를")} 곱하려고 합니다. 곱이 가장 ${most ? "클" : "작을"} 때의 곱을 구하세요.`,
    answer: n * t,
    hint: `곱하는 수가 정해져 있으니 세 자리 수를 가장 ${most ? "크게" : "작게"} 만들어요.`,
    explanation: `가장 ${most ? "큰" : "작은"} 세 자리 수 ${n} → ${n} × ${t} = ${fmt(n * t)}`,
  };
});

export const l4Mul3x2Easy = easy("l4-mul3x2-easy", (rand) => {
  const a = randInt(rand, 101, 432);
  const b = randInt(rand, 11, 23);
  return {
    key: `${a}:${b}`,
    prompt: "계산해 보세요.",
    visual: { kind: "column", op: "×", a, b },
    answer: a * b,
    ...mul3x2Steps(a, b),
    mistakes: { [a * (b % 10) + a * Math.floor(b / 10)]: "십의 자리를 곱한 값의 자리를 맞추지 않았어요." },
  };
});

export const l4MulCompare = mid("l4-mul-compare", (rand) => {
  const items = Array.from({ length: 4 }, () => {
    const a = randInt(rand, 21, 98) * 10 + randInt(rand, 0, 9);
    const b = randInt(rand, 12, 98);
    return { text: `${a} × ${b}`, v: a * b };
  });
  if (new Set(items.map((i) => i.v)).size < 4) return null;
  const most = rand() < 0.5;
  const vals = items.map((i) => i.v);
  const target = most ? Math.max(...vals) : Math.min(...vals);
  return {
    key: `${items.map((i) => i.text).join()}:${most}`,
    prompt: `곱이 가장 ${most ? "큰" : "작은"} 것을 고르세요.`,
    answer: items[vals.indexOf(target)].text,
    choices: items.map((i) => i.text),
    hint: "어림해서 비교해 보고, 비슷하면 직접 계산해요.",
    explanation: items.map((i) => `${i.text} = ${fmt(i.v)}`).join(", "),
  };
});

export const l4MulWrongOp = word("l4-mul-wrong-op", (rand) => {
  const x = randInt(rand, 102, 899);
  const b = randInt(rand, 12, 49);
  return {
    key: `${x}:${b}`,
    prompt: `어떤 수에 ${josa(b, "을/를")} 곱해야 할 것을 잘못하여 더했더니 ${josa(x + b, "이/가")} 되었습니다. 바르게 계산하면 얼마인가요?`,
    answer: x * b,
    hint: "먼저 잘못 계산한 덧셈식을 거꾸로 풀어 어떤 수를 구해요.",
    explanation: `어떤 수: ${x + b} − ${b} = ${x} → ${x} × ${b} = ${fmt(x * b)}`,
    mistakes: { [x]: "어떤 수까지만 구했어요.", [(x + b) * b]: "잘못 계산한 결과에 곱했어요." },
  };
});

/* ── 나눗셈 ── */

export const l4DivTensCheck = mid("l4-div-tens-check", (rand) => {
  const b = randInt(rand, 2, 9) * 10;
  const q = randInt(rand, 2, 9);
  const r = randInt(rand, 1, b - 1);
  const a = b * q + r;
  return {
    key: `${a}:${b}`,
    prompt: `${a} ÷ ${b} = ${q} … ${r}입니다. 계산이 맞는지 확인하는 식의 ㉠과 ㉡에 알맞은 수를 쓰세요.`,
    expression: `${b} × ${q} = ㉠, ㉠ + ${r} = ㉡`,
    answer: `${b * q},${a}`,
    unit: ["(㉠)", "(㉡)"],
    hint: "나누는 수와 몫을 곱하고 나머지를 더하면 나누어지는 수가 돼요.",
    explanation: `${b} × ${q} = ${b * q}, ${b * q} + ${r} = ${a}`,
  };
});

export const l4DivTensLife = mid("l4-div-tens-life", (rand) => {
  const b = randInt(rand, 2, 6) * 10;
  const q = randInt(rand, 3, 9);
  const r = randInt(rand, 1, b - 1);
  const a = b * q + r;
  return {
    key: `${a}:${b}`,
    prompt: `구슬 ${a}개를 한 상자에 ${b}개씩 담았습니다. 몇 상자가 되고 몇 개가 남나요?`,
    answer: `${q},${r}`,
    unit: ["상자", "개"],
    hint: `${a} ÷ ${b}의 몫과 나머지를 구해요.`,
    explanation: `${a} ÷ ${b} = ${q} … ${r}`,
  };
});

export const l4DivRemMax = word("l4-div-rem-max", (rand) => {
  // (세 자리 수) ÷ (몇십) 차시: 나누는 수는 몇십
  const b = randInt(rand, 2, 6) * 10;
  const q = randInt(rand, 3, Math.floor(900 / b));
  const most = rand() < 0.5;
  const answer = most ? b * q + b - 1 : b * q + 1;
  if (answer < 100) return null;
  return {
    key: `${b}:${q}:${most}`,
    prompt: `어떤 자연수를 ${josa(b, "으로/로")} 나누었더니 몫이 ${q}이고 나머지가 있었습니다. 어떤 수가 될 수 있는 수 중에서 가장 ${most ? "큰" : "작은"} 수를 구하세요.`,
    answer,
    hint: `나머지는 ${most ? `${b}보다 작은 수 중 가장 큰 ${josa(b - 1, "이에요/예요")}` : "0이 아니므로 가장 작은 나머지는 1이에요"}.`,
    explanation: `${b} × ${q} = ${b * q}, ${b * q} + ${most ? b - 1 : 1} = ${answer}`,
    mistakes: most ? { [b * q + b]: "나머지는 나누는 수보다 작아야 해요." } : { [b * q]: "나머지가 있어야 해요." },
  };
});

export const l4DivBusCount = word("l4-div-bus-count", (rand) => {
  const b = randInt(rand, 3, 5) * 10;
  const q = randInt(rand, 3, 9);
  const r = randInt(rand, 1, b - 1);
  const people = b * q + r;
  const [a] = names(rand, 1);
  return {
    key: `${b}:${people}`,
    prompt: `${a}네 학교 4학년 학생 ${people}명이 체험 학습을 갑니다. 버스 한 대에 ${b}명씩 탈 수 있다면 버스는 적어도 몇 대 필요한가요?`,
    answer: q + 1,
    unit: "대",
    hint: "남는 학생도 버스를 타야 해요.",
    explanation: `${people} ÷ ${b} = ${q} … ${r} → 남는 ${r}명도 타야 하므로 ${q} + 1 = ${q + 1}(대)`,
    mistakes: { [q]: "남은 학생이 탈 버스를 빠뜨렸어요." },
  };
});

export const l4Div2x2Easy = easy("l4-div2x2-easy", (rand) => {
  const b = randInt(rand, 11, 32);
  const q = randInt(rand, 2, Math.floor(99 / b));
  if (q < 2) return null;
  return {
    key: `${b}:${q}`,
    prompt: "계산해 보세요.",
    expression: `${b * q} ÷ ${b} = □`,
    answer: q,
    hint: `${b} × □ = ${josa(b * q, "이/가")} 되는 □를 찾아요.`,
    explanation: `${b} × ${q} = ${b * q}이므로 ${q}`,
  };
});

export const l4DivBox = mid("l4-div-box", (rand) => {
  const b = randInt(rand, 12, 45);
  const q = randInt(rand, 2, Math.floor(99 / b));
  const r = randInt(rand, 1, b - 1);
  if (q < 2 || b * q + r > 99) return null;
  return {
    key: `${b}:${q}:${r}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: `□ ÷ ${b} = ${q} … ${r}`,
    answer: b * q + r,
    hint: "나누는 수와 몫을 곱한 뒤 나머지를 더해요.",
    explanation: `${b} × ${q} = ${b * q}, ${b * q} + ${r} = ${b * q + r}`,
    mistakes: { [b * q]: "나머지를 더하지 않았어요." },
  };
});

export const l4DivWrongOp = word("l4-div-wrong-op", (rand) => {
  const b = randInt(rand, 12, 39);
  const x = randInt(rand, b * 2 + 1, 99);
  const q = Math.floor(x / b);
  const r = x % b;
  return {
    key: `${x}:${b}`,
    prompt: `어떤 수를 ${josa(b, "으로/로")} 나누어야 할 것을 잘못하여 ${josa(b, "을/를")} 더했더니 ${josa(x + b, "이/가")} 되었습니다. 바르게 계산했을 때의 몫과 나머지를 구하세요.`,
    answer: `${q},${r}`,
    unit: ["몫", "나머지"],
    hint: "잘못 계산한 식에서 어떤 수를 먼저 구해요.",
    explanation: `어떤 수: ${x + b} − ${b} = ${x} → ${x} ÷ ${b} = ${q} … ${r}`,
  };
});

/** 몫이 한 자리/두 자리인 (세 자리 수)÷(두 자리 수) */
function div3x2(rand: () => number, twoDigitQuotient: boolean) {
  const b = randInt(rand, 12, 69);
  const q = twoDigitQuotient ? randInt(rand, 10, Math.floor(999 / b)) : randInt(rand, Math.ceil(100 / b), 9);
  const r = randInt(rand, 0, b - 1);
  const a = b * q + r;
  if (q < 1 || a < 100 || a > 999 || (twoDigitQuotient && q < 10) || (!twoDigitQuotient && q > 9)) return null;
  return { a, b, q, r };
}

const div3x2Easy = (id: string, two: boolean) =>
  easy(id, (rand) => {
    const d = div3x2(rand, two);
    if (!d) return null;
    const { a, b, q, r } = d;
    return {
      key: `${a}:${b}`,
      prompt: "몫과 나머지를 구하세요. 나머지가 없으면 0을 쓰세요.",
      expression: `${a} ÷ ${b}`,
      answer: `${q},${r}`,
      unit: ["몫", "나머지"],
      hint: two ? `${a}의 앞 두 자리를 먼저 ${josa(b, "으로/로")} 나누어 몫의 십의 자리를 구해요.` : `${josa(b, "을/를")} 몇십으로 어림하여 몫을 짐작해요.`,
      explanation: `${b} × ${q} = ${b * q}, ${a} − ${b * q} = ${r}`,
      mistakes: { [`${q - 1},${r + b}`]: "나머지가 나누는 수보다 커요. 몫을 1 크게 해 보세요." },
    };
  });

export const l4Div3x2One = div3x2Easy("l4-div3x2-one", false);
export const l4Div3x2Two = div3x2Easy("l4-div3x2-two", true);

export const l4DivFix = mid("l4-div-fix", (rand) => {
  const d = div3x2(rand, false);
  if (!d || d.q < 3) return null;
  const { a, b, q, r } = d;
  return {
    key: `${a}:${b}`,
    prompt: `${josa(`${a} ÷ ${b}`, "을/를")} ${q - 1} … ${josa(r + b, "으로/로")} 계산했습니다. 나머지가 나누는 수보다 크므로 잘못 계산했습니다. 바르게 계산한 몫과 나머지를 구하세요.`,
    answer: `${q},${r}`,
    unit: ["몫", "나머지"],
    hint: "나머지가 나누는 수보다 크면 몫을 1 크게 해요.",
    explanation: `${b} × ${q} = ${b * q}, ${a} − ${b * q} = ${r}`,
  };
});

export const l4DivCompare = mid("l4-div-compare", (rand) => {
  const items = Array.from({ length: 4 }, () => {
    const d = div3x2(rand, false) ?? { a: 300 + randInt(rand, 0, 99), b: 40, q: 0, r: 0 };
    return { text: `${d.a} ÷ ${d.b}`, v: Math.floor(d.a / d.b) };
  });
  const vals = items.map((i) => i.v);
  const most = rand() < 0.5;
  const target = most ? Math.max(...vals) : Math.min(...vals);
  if (vals.filter((v) => v === target).length > 1 || new Set(items.map((i) => i.text)).size < 4) return null;
  return {
    key: `${items.map((i) => i.text).join()}:${most}`,
    prompt: `몫이 가장 ${most ? "큰" : "작은"} 나눗셈을 고르세요.`,
    answer: items[vals.indexOf(target)].text,
    choices: items.map((i) => i.text),
    hint: "나누는 수를 몇십으로 어림하여 몫을 짐작해 보세요.",
    explanation: items.map((i) => `${i.text}의 몫 ${i.v}`).join(", "),
  };
});

export const l4DivOneDigitMin = word("l4-div-one-digit-min", (rand) => {
  const a = randInt(rand, 101, 989);
  const answer = Math.floor(a / 10) + 1;
  if (answer > 99) return null;
  return {
    key: `${a}`,
    prompt: `${a} ÷ □의 몫이 한 자리 수가 되도록 하려고 합니다. □ 안에 들어갈 수 있는 두 자리 수 중에서 가장 작은 수를 구하세요.`,
    answer,
    hint: `몫이 한 자리 수이려면 □ × 10이 ${a}보다 커야 해요.`,
    explanation: `□ × 10 > ${a} → □는 ${Math.floor(a / 10)}보다 커야 하므로 가장 작은 수는 ${answer}`,
    mistakes: { [Math.floor(a / 10)]: `${a} ÷ ${Math.floor(a / 10)}의 몫은 10이에요. 한 자리 수가 아니에요.` },
  };
});

export const l4DivShortage = word("l4-div-shortage", (rand) => {
  const [a] = names(rand, 1);
  const d = div3x2(rand, false);
  if (!d || d.r === 0) return null;
  const { a: total, b, q, r } = d;
  return {
    key: `${total}:${b}`,
    prompt: `${a}는 색종이 ${total}장을 한 모둠에 ${b}장씩 나누어 주려고 합니다. 나누어 주고 남은 색종이로 한 모둠에 ${b}장씩 더 나누어 주려면 색종이가 적어도 몇 장 더 있어야 하나요?`,
    answer: b - r,
    unit: "장",
    hint: `먼저 ${total} ÷ ${b}의 몫과 나머지를 구해요. 남은 색종이로 한 모둠을 채우려면 몇 장이 모자랄까요?`,
    explanation: `${total} ÷ ${b} = ${q} … ${r} → ${b} − ${r} = ${b - r}(장)`,
    mistakes: { [r]: "남는 색종이 수를 답했어요." },
  };
});

export const l4DivBoxDivisor = mid("l4-div-box-divisor", (rand) => {
  const b = randInt(rand, 12, 49);
  const q = randInt(rand, 10, Math.floor(999 / b));
  if (b * q < 100) return null;
  return {
    key: `${b}:${q}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: `${b * q} ÷ □ = ${q}`,
    answer: b,
    hint: "나눗셈과 곱셈의 관계를 이용해 보세요.",
    explanation: `${q} × ${b} = ${b * q}이므로 □ = ${b}`,
  };
});

export const l4CardsDiv = word("l4-cards-div", (rand) => {
  const cards = shuffle(rand, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 5);
  const desc = [...cards].sort((a, b) => b - a);
  const big = Number(desc.slice(0, 3).join(""));
  const rest = desc.slice(3).sort((a, b) => a - b);
  const small = Number(rest.join(""));
  const q = Math.floor(big / small);
  const r = big % small;
  return {
    key: `${[...cards].sort().join("")}`,
    prompt: `수 카드 ${cards.join(", ")} 중 3장으로 가장 큰 세 자리 수를 만들고, 남은 2장으로 가장 작은 두 자리 수를 만들었습니다. (세 자리 수) ÷ (두 자리 수)의 몫과 나머지를 구하세요.`,
    answer: `${q},${r}`,
    unit: ["몫", "나머지"],
    hint: "가장 큰 세 자리 수에는 큰 숫자 3개를 써요.",
    explanation: `${big} ÷ ${small} = ${q} … ${r}`,
  };
});

export const l4DivError = word("l4-div-error", (rand) => {
  const [a] = names(rand, 1);
  const d = div3x2(rand, true);
  if (!d) return null;
  const { a: n, b, q, r } = d;
  const r0 = markChoice(rand, `몫 ${q}, 나머지 ${r}`, [`몫 ${q - 1}, 나머지 ${r + b}`, `몫 ${q + 1}, 나머지 ${r}`, `몫 ${q}, 나머지 ${r + b}`]);
  return {
    key: `${n}:${b}:${r0.answer}`,
    prompt: `${a}는 ${josa(`${n} ÷ ${b}`, "을/를")} 계산하여 몫이 ${q - 1}, 나머지가 ${josa(r + b, "이라고/라고")} 했습니다. 잘못 계산한 까닭을 생각하여 바르게 계산한 것을 고르세요.`,
    visual: r0.visual,
    answer: r0.answer,
    choices: r0.choices,
    hint: "나머지가 나누는 수보다 작아질 때까지 몫을 크게 해요.",
    explanation: `${r ? `${b} × ${q} = ${b * q}, ${b * q} + ${r} = ${n}` : `${b} × ${q} = ${n}`} → 몫 ${q}, 나머지 ${r}`,
  };
});

/* ── 어림셈([4수01-08]) ──
 * 반올림은 5-2에서 배우므로 '가장 가까운 몇백·몇십'으로 어림한다. 어느 쪽이 가까운지 헷갈리지 않게
 * 세 자리 수는 몇백에서 20 이내, 두 자리 수는 몇십에서 3 이내만 쓴다(498 → 약 500, 31 → 약 30).
 */

/** 가장 가까운 몇백에서 1~20 떨어진 세 자리 수 */
function nearHundred(rand: () => number, from = 2, to = 9) {
  const round = randInt(rand, from, to) * 100;
  const off = randInt(rand, 1, 20) * (rand() < 0.5 ? -1 : 1);
  return { n: round + off, round };
}

/** 가장 가까운 몇십에서 1~3 떨어진 두 자리 수 */
function nearTen(rand: () => number, from = 2, to = 9) {
  const round = randInt(rand, from, to) * 10;
  const off = randInt(rand, 1, 3) * (rand() < 0.5 ? -1 : 1);
  return { n: round + off, round };
}

const ROUND_MUL = "곱해지는 수는 가장 가까운 몇백으로, 곱하는 수는 가장 가까운 몇십으로";

export const l4EstMul = easy("l4-est-mul", (rand) => {
  const a = nearHundred(rand);
  const b = nearTen(rand);
  const est = a.round * b.round;
  return {
    key: `${a.n}:${b.n}`,
    prompt: `${josa(`${a.n} × ${b.n}`, "을/를")} 어림하여 계산하려고 합니다. ${ROUND_MUL} 어림하면 곱은 약 얼마인가요?`,
    answer: est,
    hint: `${a.n}에 가장 가까운 몇백과 ${b.n}에 가장 가까운 몇십을 찾아 곱해요.`,
    explanation: `${a.n} → 약 ${a.round}, ${b.n} → 약 ${b.round} → ${a.round} × ${b.round} = ${est}`,
    mistakes: { [est / 10]: "0의 개수를 확인해 보세요.", [a.n * b.n]: "어림하지 않고 정확하게 계산했어요." },
  };
});

export const l4EstDiv = mid("l4-est-div", (rand) => {
  const a = nearHundred(rand);
  const b = nearTen(rand);
  // 어림한 두 수로 나누어떨어져야 몫을 '약 20', '약 15', '약 5'처럼 자연수 하나로 말할 수 있다
  if (a.round % b.round !== 0) return null;
  const est = a.round / b.round;
  return {
    key: `${a.n}:${b.n}`,
    prompt: `${a.n} ÷ ${b.n}의 몫을 어림하려고 합니다. 나누어지는 수는 가장 가까운 몇백으로, 나누는 수는 가장 가까운 몇십으로 어림하면 몫은 약 얼마인가요?`,
    answer: est,
    hint: `${a.n}에 가장 가까운 몇백을 ${b.n}에 가장 가까운 몇십으로 나누어요.`,
    explanation: `${a.n} → 약 ${a.round}, ${b.n} → 약 ${b.round} → ${a.round} ÷ ${b.round} = ${est}`,
    mistakes: { [est * 10]: "0의 개수를 확인해 보세요." },
  };
});

/** 두 값이 1.5배 넘게 차이 나는지 */
const farApart = (x: number, y: number) => Math.max(x, y) > 1.5 * Math.min(x, y);

/**
 * 끝자리는 바른 곱과 같고 나머지 자리에는 바른 곱에 없는 숫자만 쓴 len자리 수.
 * 바른 곱보다 작은 쪽(below) 또는 큰 쪽에서, 어림한 곱·바른 곱과 1.5배 넘게 차이 나는 것
 */
function unrelatedNumber(rand: () => number, exact: number, est: number, len: number, below: boolean): number | null {
  const s = String(exact);
  const free = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => !s.includes(String(d)));
  const heads = free.filter((d) => d > 0);
  if (!heads.length || len < 2) return null;
  for (let i = 0; i < 30; i++) {
    const mid = Array.from({ length: len - 2 }, () => pick(rand, free)).join("");
    const v = Number(`${pick(rand, heads)}${mid}${s.at(-1)}`);
    if ((below ? v < exact : v > exact) && farApart(v, est) && farApart(v, exact)) return v;
  }
  return null;
}

/** 0을 하나 더 붙인 오답은 다른 보기와 '×10 짝'을 이루어 단서가 되므로 큰 쪽 오답 자리에 이 비율로만 넣는다 */
const ZERO_RATE = 0.2;

type EstWrong = { v: number | null; why: string };

export const l4EstCheck = mid("l4-est-check", (rand) => {
  // 교과서 꼴: 식 하나에 결과 후보 넷. 오답 종류를 문항마다 섞고, 바른 곱보다 작은 오답 수(0~3개)를 고르게 뽑아
  // 정답의 크기 순위가 1~4등에 고르게 나오게 한다(보기 구성·크기 순서만으로는 고를 수 없고 어림해야 한다)
  const a = nearHundred(rand);
  const b = nearTen(rand);
  const exact = a.n * b.n;
  const est = a.round * b.round;
  const [tens, ones] = [Math.floor(b.n / 10), b.n % 10];
  const len = String(exact).length;
  const place = 10 ** (len - 1);
  const lead = Math.floor(exact / place);
  const leadSwap = (up: boolean) => {
    const vs = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => (up ? d > lead : d < lead)).map((d) => d * place + (exact % place));
    const ok = vs.filter((v) => farApart(v, est) && farApart(v, exact));
    return ok.length ? pick(rand, ok) : null;
  };
  const far = "어림한 곱과 차이가 너무 커요.";
  const unrelated = (below: boolean): EstWrong => ({ v: unrelatedNumber(rand, exact, est, len + (rand() < 0.5 ? 0 : below ? -1 : 1), below), why: far });
  // 작은 쪽: 일의 자리 곱만·십의 자리 안 옮김은 둘 중 하나만(둘 다 들어가면 정답이 늘 위에서 두 번째가 된다)
  const small: EstWrong[] = shuffle(rand, [
    pick(rand, [
      { v: a.n * ones, why: "일의 자리를 곱한 값만 구했어요." },
      { v: a.n * ones + a.n * tens, why: "십의 자리를 곱한 값을 한 자리 왼쪽으로 옮겨 쓰지 않았어요." },
    ]),
    { v: leadSwap(false), why: far },
    unrelated(true),
    unrelated(true),
  ]);
  const big: EstWrong[] = [
    ...(rand() < ZERO_RATE ? [{ v: exact * 10, why: "0을 하나 더 붙인 값이에요." }] : []),
    ...shuffle(rand, [{ v: leadSwap(true), why: far }, unrelated(false), unrelated(false)]),
  ];
  // 작은 쪽 0개·3개는 알맞은 오답을 못 채워 다시 뽑히는 일이 많아 더 자주 고른다(결과 순위가 고르게)
  const below = pick(rand, [0, 0, 1, 2, 3, 3]);
  const wrongs: { v: number; why: string }[] = [];
  const take = (from: EstWrong[], n: number) => {
    let got = 0;
    for (const k of from) {
      if (got === n || k.v === null || k.v === a.n) continue;
      const v = k.v;
      if (farApart(v, est) && [exact, ...wrongs.map((w) => w.v)].every((x) => farApart(v, x))) {
        wrongs.push({ v, why: k.why });
        got++;
      }
    }
  };
  take(small, below);
  take(big, 3 - below);
  // 자릿수·끝자리가 정답과 같은 오답이 있어야 자릿수·끝자리만으로 못 고른다
  const sameShape = (v: number) => String(v).length === len && v % 10 === exact % 10;
  if (wrongs.length < 3 || !wrongs.some((w) => sameShape(w.v))) return null;
  return {
    key: `${a.n}:${b.n}:${wrongs.map((w) => w.v).join()}`,
    prompt: `${a.n} × ${b.n}의 계산 결과로 가장 알맞은 것은 어느 것인가요?`,
    answer: exact,
    choices: shuffle(rand, [exact, ...wrongs.map((w) => w.v)].map(String)),
    hint: "곱해지는 수를 몇백, 곱하는 수를 몇십으로 어림한 곱과 가장 가까운 것을 찾아요.",
    explanation: `${a.n} × ${b.n} → 약 ${a.round} × ${b.round} = ${est}이므로 ${est}에 가장 가까운 ${josa(exact, "이/가")} 알맞아요.`,
    mistakes: Object.fromEntries(wrongs.map((w) => [w.v, w.why])),
  };
});

export const ESTIMATE_OK = [
  "운동장에 모인 사람이 몇백 명쯤인지 알아볼 때",
  "도서관에 있는 책이 몇천 권쯤인지 소개할 때",
  "집에서 할머니 댁까지 몇 km쯤인지 말할 때",
  "가진 돈으로 사려는 물건을 모두 살 수 있을지 미리 알아볼 때",
  "체험 학습에 버스가 몇 대쯤 필요할지 미리 알아볼 때",
  "올해 축제에 온 사람이 몇천 명쯤인지 알릴 때",
];
export const EXACT_ONLY = [
  "물건값을 내고 거스름돈을 받을 때",
  "통장에 저금한 돈을 적을 때",
  "모둠별로 나누어 줄 공책의 수를 셀 때",
  "택배 요금을 계산하여 낼 때",
  "반 친구들의 줄넘기 기록을 더하여 반 기록을 낼 때",
  "급식 우유를 반 학생 수만큼 주문할 때",
];

export const l4EstSituation = mid("l4-est-situation", (rand) => {
  const askEstimate = rand() < 0.5;
  const [right, wrongs] = askEstimate ? [pick(rand, ESTIMATE_OK), shuffle(rand, EXACT_ONLY).slice(0, 3)] : [pick(rand, EXACT_ONLY), shuffle(rand, ESTIMATE_OK).slice(0, 3)];
  return {
    key: `${askEstimate}:${right}:${wrongs.join()}`,
    prompt: askEstimate ? "어림셈으로 구해도 되는 경우를 고르세요." : "어림셈이 아니라 정확하게 계산해야 하는 경우를 고르세요.",
    answer: right,
    choices: shuffle(rand, [right, ...wrongs]),
    hint: "대강의 크기만 알면 되는지, 정확한 수가 꼭 필요한지 생각해요.",
    explanation: askEstimate ? `'${right}'는 대강의 크기만 알면 되므로 어림셈으로 구해도 돼요.` : `'${right}'는 정확한 수가 필요하므로 어림하면 안 돼요.`,
  };
});

export const l4EstDiff = word("l4-est-diff", (rand) => {
  const a = nearHundred(rand);
  const b = nearTen(rand);
  const exact = a.n * b.n;
  const est = a.round * b.round;
  if (exact === est) return null;
  const [big, small] = exact > est ? [exact, est] : [est, exact];
  return {
    key: `${a.n}:${b.n}`,
    prompt: `${josa(`${a.n} × ${b.n}`, "을/를")} ${ROUND_MUL} 어림하여 계산한 값과 실제로 계산한 값의 차는 얼마인가요?`,
    answer: big - small,
    hint: "어림한 곱과 실제 곱을 각각 구한 뒤 큰 수에서 작은 수를 빼요.",
    explanation: `어림한 곱: ${a.round} × ${b.round} = ${est}, 실제 곱: ${a.n} × ${b.n} = ${exact} → ${big} − ${small} = ${big - small}`,
    mistakes: { [exact]: "실제 곱만 구했어요.", [est]: "어림한 곱만 구했어요." },
  };
});

const EST_ITEMS = [
  ["공책", "권"],
  ["연필", "자루"],
  ["지우개", "개"],
  ["색종이", "묶음"],
] as const;

export const l4EstBudget = word("l4-est-budget", (rand) => {
  const [name] = names(rand, 1);
  const [item, unit] = pick(rand, EST_ITEMS);
  const p = nearHundred(rand, 2, 6);
  const n = nearTen(rand, 2, 4);
  const est = p.round * n.round;
  // 가진 돈은 5000원 단위(어림한 물건값보다 많게)
  const money = (Math.floor(est / 5000) + randInt(rand, 1, 2)) * 5000;
  // 가진 돈이 어림한 물건값의 2배이면 정답(남는 돈)이 '물건값만 어림한' 오답과 같아진다
  if (money === 2 * est) return null;
  if (p.n * n.n === est) return null;
  // 어림으로 남는다고 했는데 실제로는 모자라면 안 된다
  if (p.n * n.n >= money) return null;
  return {
    key: `${p.n}:${n.n}:${money}`,
    prompt: `${josa(name, "은/는")} ${fmt(money)}원으로 한 ${unit}에 ${p.n}원인 ${josa(item, "을/를")} ${n.n}${unit} 사려고 합니다. 한 ${unit}의 값은 가장 가까운 몇백으로, 사려는 수는 가장 가까운 몇십으로 어림하면 남는 돈은 약 몇 원인가요?`,
    answer: money - est,
    unit: "원",
    hint: "먼저 물건값을 어림하여 계산한 뒤 가진 돈에서 빼요.",
    explanation: `${p.n}원 → 약 ${p.round}원, ${n.n}${unit} → 약 ${n.round}${unit} → ${p.round} × ${n.round} = ${est}, ${money} − ${est} = ${money - est}(원)`,
    mistakes: { [est]: "물건값만 어림했어요.", [money - p.n * n.n]: "어림하지 않고 정확하게 계산했어요." },
  };
});

/* ── 4-1 규칙 찾기 ── */

export const l4PatRuleChoice = mid("l4-pat-rule-choice", (rand) => {
  const mul = rand() < 0.4;
  const k = mul ? pick(rand, [2, 3, 5]) : pick(rand, [3, 4, 5, 6, 7, 8, 9, 11, 15, 25]);
  const start = randInt(rand, 2, mul ? 9 : 60);
  const seq = Array.from({ length: 5 }, (_, i) => (mul ? start * k ** i : start + k * i));
  const answer = mul ? `${k}배씩 커집니다.` : `${k}씩 커집니다.`;
  const wrong = mul
    ? [`${seq[1] - seq[0]}씩 커집니다.`, `${k + 1}배씩 커집니다.`, `${k}씩 커집니다.`]
    : [`${k}배씩 커집니다.`, `${k + 1}씩 커집니다.`, `${k * 2}씩 커집니다.`];
  return {
    key: `${mul}:${k}:${start}`,
    prompt: "수의 배열에서 규칙을 바르게 말한 것을 고르세요.",
    expression: seq.join(", "),
    answer,
    choices: opts(rand, answer, wrong, () => `${randInt(rand, 2, 30)}씩 커집니다.`),
    hint: "이웃한 두 수의 차가 같은지, 몇 배인지 모두 확인해요.",
    explanation: `${seq[0]}, ${seq[1]}, ${seq[2]}, … → ${answer}`,
  };
});

export const l4PatNth = word("l4-pat-nth", (rand) => {
  const start = randInt(rand, 2, 50);
  const k = randInt(rand, 3, 15);
  const n = randInt(rand, 12, 30);
  const seq = [0, 1, 2, 3].map((i) => start + k * i);
  return {
    key: `${start}:${k}:${n}`,
    prompt: `규칙에 따라 수를 늘어놓았습니다. ${ord(n)}에 올 수를 구하세요.`,
    expression: `${seq.join(", ")}, …`,
    answer: start + k * (n - 1),
    hint: `첫째 수에 ${josa(k, "을/를")} 몇 번 더해야 ${ord(n)} 수가 되는지 생각해요.`,
    explanation: `${k} × ${n - 1} = ${k * (n - 1)}, ${start} + ${k * (n - 1)} = ${start + k * (n - 1)}`,
    mistakes: { [start + k * n]: `${josa(k, "을/를")} ${n}번 더했어요. ${n - 1}번 더해야 해요.` },
  };
});

export const l4PatFirstOver = word("l4-pat-first-over", (rand) => {
  const start = randInt(rand, 3, 40);
  const k = randInt(rand, 6, 25);
  const limit = randInt(rand, 20, 60) * 10;
  // start + k(n-1) > limit 인 첫 n
  const n = Math.floor((limit - start) / k) + 2;
  const seq = [0, 1, 2, 3].map((i) => start + k * i);
  if (start + k * (n - 2) > limit) return null;
  return {
    key: `${start}:${k}:${limit}`,
    prompt: `규칙에 따라 수를 늘어놓을 때, 처음으로 ${limit}보다 큰 수가 나오는 것은 몇 번째인가요?`,
    expression: `${seq.join(", ")}, …`,
    answer: n,
    unit: "번째",
    hint: `${k}씩 커지는 규칙이에요. ${limit}에 가까운 수부터 확인해 보세요.`,
    explanation: `${ord(n - 1)} 수는 ${start + k * (n - 2)}, ${ord(n)} 수는 ${start + k * (n - 1)}이므로 ${ord(n)}`,
  };
});

/** 수 배열표 */
function numberTable(rand: () => number) {
  const [right, down] = pick(rand, [[1, 10], [1, 100], [10, 100], [100, 1000], [5, 50], [10, 1000], [50, 500], [1000, 10000]]);
  const start = randInt(rand, 1, 9) * down * 10 + randInt(rand, 1, 9) * right;
  const cell = (r: number, c: number) => start + r * down + c * right;
  return { right, down, start, cell };
}

function tableVisual(cell: (r: number, c: number) => number, hide: [number, number][], mark: [number, number, string][] = []): Visual {
  const rows = [0, 1, 2, 3].map((r) =>
    [0, 1, 2, 3, 4].map((c) => {
      const m = mark.find(([mr, mc]) => mr === r && mc === c);
      if (m) return m[2];
      return hide.some(([hr, hc]) => hr === r && hc === c) ? "" : String(cell(r, c));
    }),
  );
  // 빈 머리 행이 생기지 않도록 첫 줄을 머리 행으로
  return { kind: "table", header: rows[0], rows: rows.slice(1) };
}

export const l4TableRule = easy("l4-table-rule", (rand) => {
  const t = numberTable(rand);
  const dir = pick(rand, ["→", "↓"] as const);
  return {
    key: `${t.start}:${t.right}:${t.down}:${dir}`,
    prompt: `수 배열표에서 ${dir === "→" ? "오른쪽(→)" : "아래쪽(↓)"}으로 갈수록 몇씩 커지나요?`,
    visual: tableVisual(t.cell, []),
    answer: dir === "→" ? t.right : t.down,
    unit: "씩",
    hint: "같은 줄에서 이웃한 두 수의 차를 구해요.",
    explanation: `${t.cell(0, 1)} − ${t.cell(0, 0)} = ${t.right}, ${t.cell(1, 0)} − ${t.cell(0, 0)} = ${t.down}`,
  };
});

export const l4TableCell = mid("l4-table-cell", (rand) => {
  const t = numberTable(rand);
  const r = randInt(rand, 1, 3);
  const c = randInt(rand, 1, 4);
  return {
    key: `${t.start}:${t.right}:${t.down}:${r}:${c}`,
    prompt: "수 배열표의 규칙을 찾아 ★에 알맞은 수를 쓰세요.",
    visual: tableVisual(t.cell, [[r, c === 4 ? 3 : c + 1], [r - 1, c]], [[r, c, "★"]]),
    answer: t.cell(r, c),
    hint: "가로와 세로의 규칙을 각각 찾아요.",
    explanation: `→ 방향 ${t.right}씩, ↓ 방향 ${t.down}씩 커지므로 ★ = ${t.cell(r, c)}`,
  };
});

export const l4TableDiag = mid("l4-table-diag", (rand) => {
  const t = numberTable(rand);
  const back = rand() < 0.5;
  const answer = back ? t.down - t.right : t.down + t.right;
  return {
    key: `${t.start}:${t.right}:${t.down}:${back}`,
    prompt: `수 배열표에서 ${back ? "↙ 방향" : "↘ 방향"}으로 놓인 수들은 몇씩 커지나요?`,
    visual: tableVisual(t.cell, []),
    answer,
    unit: "씩",
    hint: `${back ? "↙은 한 줄 아래, 한 칸 왼쪽" : "↘은 한 줄 아래, 한 칸 오른쪽"}으로 가는 것이에요.`,
    explanation: `${back ? `${t.cell(1, 0)} − ${t.cell(0, 1)}` : `${t.cell(1, 1)} − ${t.cell(0, 0)}`} = ${answer}`,
  };
});

export const l4TableFar = word("l4-table-far", (rand) => {
  const t = numberTable(rand);
  const r = randInt(rand, 6, 10);
  const c = randInt(rand, 1, 5);
  return {
    key: `${t.start}:${t.right}:${t.down}:${r}:${c}`,
    prompt: `수 배열표의 규칙대로 아래로 줄을 계속 이어 쓴다면, ${ord(r)} 줄 ${ord(c)} 칸에 올 수는 얼마인가요? (맨 위 줄이 첫째 줄입니다.)`,
    visual: tableVisual(t.cell, []),
    answer: t.cell(r - 1, c - 1),
    hint: `첫째 줄 ${ord(c)} 칸의 수에서 아래로 ${r - 1}줄 내려가요.`,
    explanation: `${t.down} × ${r - 1} = ${t.down * (r - 1)}, ${t.cell(0, c - 1)} + ${t.down * (r - 1)} = ${t.cell(r - 1, c - 1)}`,
    mistakes: { [t.cell(0, c - 1) + t.down * r]: "한 줄을 더 내려갔어요." },
  };
});

export const l4TableSum = word("l4-table-sum", (rand) => {
  const t = numberTable(rand);
  const r = randInt(rand, 0, 3);
  const c = randInt(rand, 1, 3);
  const mid3 = t.cell(r, c);
  const sum = 3 * mid3;
  const ask = pick(rand, ["큰", "작은"] as const);
  const answer = ask === "큰" ? mid3 + t.right : mid3 - t.right;
  return {
    key: `${t.start}:${t.right}:${t.down}:${r}:${c}:${ask}`,
    prompt: `수 배열표에서 가로로 이웃한 세 수를 골랐더니 세 수의 합이 ${josa(sum, "이었/였")}습니다. 고른 세 수 중 가장 ${ask} 수는 얼마인가요?`,
    visual: tableVisual(t.cell, []),
    answer,
    hint: `가로로 이웃한 세 수는 ${t.right}씩 차이가 나요. 가운데 수의 3배가 세 수의 합이에요.`,
    explanation: `가운데 수 ${sum} ÷ 3 = ${mid3}, 가장 ${ask} 수 ${answer}`,
    mistakes: { [mid3]: "가운데 수를 답했어요." },
  };
});

/* 모양의 배열 */

type ShapeRule = { name: string; count: (n: number) => number; cells: (n: number) => [number, number][] };

const SHAPE_RULES: ShapeRule[] = [
  { name: "l", count: (n) => 2 * n - 1, cells: (n) => [...Array.from({ length: n }, (_, i) => [0, i] as [number, number]), ...Array.from({ length: n - 1 }, (_, i) => [i + 1, n - 1] as [number, number])] },
  { name: "row3", count: (n) => 3 * n + 1, cells: (n) => [...Array.from({ length: n + 1 }, (_, i) => [i, 1] as [number, number]), ...Array.from({ length: n }, (_, i) => [i + 1, 0] as [number, number]), ...Array.from({ length: n }, (_, i) => [i, 2] as [number, number])].slice(0, 3 * n + 1) },
  { name: "square", count: (n) => n * n, cells: (n) => Array.from({ length: n * n }, (_, i) => [i % n, Math.floor(i / n)] as [number, number]) },
  { name: "stairs", count: (n) => (n * (n + 1)) / 2, cells: (n) => Array.from({ length: n }, (_, r) => Array.from({ length: r + 1 }, (_, c) => [c, r] as [number, number])).flat() },
];

function shapeScene(rule: ShapeRule, upto: number): ShapeScene {
  // 칸을 셀 수 있을 만큼 크게(한 칸 22px), 모양 사이는 한 칸 넘게 띄운다
  const cell = 22;
  const polygons: NonNullable<ShapeScene["polygons"]> = [];
  const texts: NonNullable<ShapeScene["texts"]> = [];
  let x0 = 8;
  for (let n = 1; n <= upto; n++) {
    const cells = rule.cells(n);
    const w = Math.max(...cells.map((c) => c[0])) + 1;
    for (const [cx, cy] of cells) {
      const x = x0 + cx * cell;
      const y = 26 + cy * cell;
      polygons.push({ fill: true, points: [[x, y], [x + cell, y], [x + cell, y + cell], [x, y + cell]] });
    }
    texts.push({ at: [x0 + (w * cell) / 2, 13], text: ["첫째", "둘째", "셋째", "넷째"][n - 1] });
    x0 += w * cell + 30;
  }
  const rows = Math.max(...Array.from({ length: upto }, (_, i) => Math.max(...rule.cells(i + 1).map((c) => c[1])) + 1));
  return { kind: "shape", width: x0 - 22, height: 26 + cell * rows + 10, label: `모양의 배열 첫째부터 ${ord(upto)}까지`, polygons, texts };
}

export const l4ShapeNext = easy("l4-shape-next", (rand) => {
  const rule = pick(rand, SHAPE_RULES);
  const upto = 3;
  return {
    key: `${rule.name}`,
    prompt: `규칙에 따라 사각형을 늘어놓았습니다. 넷째에 올 모양의 사각형은 몇 개인가요?`,
    visual: shapeScene(rule, upto),
    answer: rule.count(4),
    unit: "개",
    hint: "사각형이 몇 개씩 늘어나는지 세어 보세요.",
    explanation: `${[1, 2, 3].map(rule.count).join(", ")}, … → 넷째 ${rule.count(4)}개`,
  };
});

export const l4ShapeTenth = mid("l4-shape-tenth", (rand) => {
  const rule = pick(rand, SHAPE_RULES);
  const n = randInt(rand, 6, 10);
  return {
    key: `${rule.name}:${n}`,
    prompt: `규칙에 따라 사각형을 늘어놓았습니다. ${ord(n)}에 올 모양의 사각형은 몇 개인가요?`,
    visual: shapeScene(rule, 3),
    answer: rule.count(n),
    unit: "개",
    hint: "첫째, 둘째, 셋째 모양의 사각형 수를 표로 정리해 규칙을 찾아요.",
    explanation: `${ord(n)}: ${rule.count(n)}개`,
  };
});

export const l4ShapeTable = mid("l4-shape-table", (rand) => {
  const first = randInt(rand, 2, 9);
  const k = randInt(rand, 2, 6);
  const n = randInt(rand, 6, 12);
  const item = pick(rand, ["바둑돌", "성냥개비", "구슬", "블록"]);
  return {
    key: `${first}:${k}:${n}:${item}`,
    prompt: `규칙에 따라 ${josa(item, "을/를")} 늘어놓은 개수를 표로 나타냈습니다. ${ord(n)}에는 ${josa(item, "이/가")} 몇 개 필요한가요?`,
    visual: { kind: "table", header: ["순서", "첫째", "둘째", "셋째", "넷째"], rows: [[`${item} 수(개)`, ...[0, 1, 2, 3].map((i) => String(first + k * i))]] },
    answer: first + k * (n - 1),
    unit: "개",
    hint: `한 단계마다 ${k}개씩 늘어나요.`,
    explanation: `${k} × ${n - 1} = ${k * (n - 1)}, ${first} + ${k * (n - 1)} = ${first + k * (n - 1)}(개)`,
    mistakes: { [first + k * n]: "늘어나는 횟수를 한 번 더 셌어요." },
  };
});

export const l4ShapeReverse = word("l4-shape-reverse", (rand) => {
  const rule = pick(rand, SHAPE_RULES);
  const n = randInt(rand, 6, 15);
  return {
    key: `${rule.name}:${n}`,
    prompt: `규칙에 따라 사각형을 늘어놓았습니다. 사각형이 ${rule.count(n)}개인 모양은 몇 번째인가요?`,
    visual: shapeScene(rule, 3),
    answer: n,
    unit: "번째",
    hint: "순서와 사각형 수 사이의 관계를 찾아 거꾸로 생각해요.",
    explanation: `${ord(n)} 모양의 사각형이 ${rule.count(n)}개입니다.`,
  };
});

/* 계산식의 규칙 */

export const l4CalcNext = easy("l4-calc-next", (rand) => {
  const a = randInt(rand, 1, 5) * 100 + randInt(rand, 1, 9) * 10;
  const b = randInt(rand, 1, 5) * 100 + randInt(rand, 1, 9) * 10;
  const k = pick(rand, [10, 100]);
  const lines = [0, 1, 2].map((i) => `${a + k * i} + ${b + k * i} = ${a + b + 2 * k * i}`);
  return {
    key: `${a}:${b}:${k}`,
    prompt: "계산식의 규칙에 따라 □ 안에 알맞은 수를 쓰세요.",
    expression: `${lines.join(",  ")},  ${a + 3 * k} + ${b + 3 * k} = □`,
    answer: a + b + 6 * k,
    hint: `더하는 두 수가 각각 ${k}씩 커지면 합은 ${2 * k}씩 커져요.`,
    explanation: `${a + b + 4 * k} + ${2 * k} = ${a + b + 6 * k}`,
  };
});

export const l4CalcMulPattern = mid("l4-calc-mul-pattern", (rand) => {
  if (rand() < 0.5) {
    // 셋째 식 다음인 넷째 식(1111 × 1111)을 묻는다
    const n = 4;
    const ones = (m: number) => Number("1".repeat(m));
    return {
      key: `ones:${n}`,
      prompt: "계산식의 규칙을 찾아 □ 안에 알맞은 수를 쓰세요.",
      expression: `${[1, 2, 3].map((m) => `${ones(m)} × ${ones(m)} = ${ones(m) ** 2}`).join(",  ")},  ${ones(n)} × ${ones(n)} = □`,
      answer: ones(n) ** 2,
      hint: "곱의 가운데 숫자가 곱하는 수의 자리 수와 같아요.",
      explanation: `${ones(n)} × ${ones(n)} = ${ones(n) ** 2}`,
    };
  }
  const k = randInt(rand, 21, 98);
  return {
    key: `101:${k}`,
    prompt: "계산식의 규칙을 찾아 □ 안에 알맞은 수를 쓰세요.",
    expression: `101 × 12 = 1212,  101 × 13 = 1313,  101 × 14 = 1414,  101 × □ = ${k}${k}`,
    answer: k,
    hint: "101에 두 자리 수를 곱하면 그 수가 두 번 반복돼요.",
    explanation: `101 × ${k} = ${k}${k}`,
  };
});

export const l4CalcFindLine = word("l4-calc-find-line", (rand) => {
  const a = randInt(rand, 1, 4) * 100;
  const k = 100;
  const n = randInt(rand, 5, 9);
  const val = (i: number) => a + k * i + a + k * (i + 1);
  const lines = [0, 1, 2].map((i) => `${a + k * i} + ${a + k * (i + 1)} = ${val(i)}`);
  return {
    key: `${a}:${n}`,
    prompt: `계산식의 규칙에 따라 계산 결과가 ${josa(fmt(val(n - 1)), "이/가")} 되는 계산식은 몇째 계산식인가요?`,
    expression: lines.join(",  "),
    answer: n,
    unit: "째",
    hint: "계산 결과가 몇씩 커지는지 보고 거꾸로 생각해요.",
    explanation: `${ord(n)} 계산식: ${a + k * (n - 1)} + ${a + k * n} = ${val(n - 1)}`,
  };
});

/* 등호(=)가 있는 식 */

export const l4EqTrue = easy("l4-eq-true", (rand) => {
  const a = randInt(rand, 10, 60);
  const b = randInt(rand, 5, 40);
  const d = randInt(rand, 1, 5);
  const good = `${a} + ${b} = ${a + d} + ${b - d}`;
  const bads = [`${a} + ${b} = ${a + d} + ${b + d}`, `${a + b} − ${d} = ${a + b} + ${d}`, `${a} − ${d} = ${a} + ${d}`, `${a} + ${b} = ${a - d} + ${b - d}`];
  return {
    key: `${a}:${b}:${d}`,
    prompt: "옳은 식을 고르세요.",
    answer: good,
    choices: opts(rand, good, shuffle(rand, bads), () => `${a} + ${b} = ${a + b + randInt(rand, 1, 9)}`),
    hint: "등호(=) 양쪽의 값이 같은지 계산해 보세요.",
    explanation: `${a} + ${b} = ${a + b}, ${a + d} + ${b - d} = ${a + b}`,
  };
});

export const l4EqBox = mid("l4-eq-box", (rand) => {
  const a = randInt(rand, 12, 80);
  const b = randInt(rand, 12, 80);
  const d = randInt(rand, 1, 9) * (rand() < 0.5 ? 1 : -1);
  const sub = rand() < 0.4;
  if (sub && a <= b + 5) return null;
  if (b - d <= 0 || a + d <= 0) return null;
  // a + b = (a + d) + □  /  a − b = (a + d) − □
  const answer = sub ? b + d : b - d;
  return {
    key: `${a}:${b}:${d}:${sub}`,
    prompt: "□ 안에 알맞은 수를 써넣어 식을 완성하세요.",
    expression: sub ? `${a} − ${b} = ${a + d} − □` : `${a} + ${b} = ${a + d} + □`,
    answer,
    hint: sub ? "빼지는 수가 커진 만큼 빼는 수도 커져야 차가 같아요." : "더하는 한 수가 커진 만큼 다른 수는 작아져야 합이 같아요.",
    explanation: sub ? `${a} − ${b} = ${a - b}, ${a + d} − ${answer} = ${a - b}` : `${a} + ${b} = ${a + b}, ${a + d} + ${answer} = ${a + b}`,
  };
});

export const l4EqMulBox = mid("l4-eq-mul-box", (rand) => {
  const a = randInt(rand, 3, 25);
  const b = pick(rand, [2, 4, 6, 8, 10, 12]);
  const k = pick(rand, [2, 3]);
  if (b % k) return null;
  const div = rand() < 0.4;
  if (div) {
    const n = a * b;
    return {
      key: `d:${a}:${b}:${k}`,
      prompt: "□ 안에 알맞은 수를 써넣어 식을 완성하세요.",
      expression: `${n} ÷ ${b} = ${n / k} ÷ □`,
      answer: b / k,
      hint: `나누어지는 수를 ${josa(k, "으로/로")} 나누었으니 나누는 수도 ${josa(k, "으로/로")} 나누어요.`,
      explanation: `${n} ÷ ${b} = ${a}, ${n / k} ÷ ${b / k} = ${a}`,
    };
  }
  return {
    key: `m:${a}:${b}:${k}`,
    prompt: "□ 안에 알맞은 수를 써넣어 식을 완성하세요.",
    expression: `${a} × ${b} = ${a * k} × □`,
    answer: b / k,
    hint: `곱해지는 수가 ${k}배가 되면 곱하는 수는 ${josa(k, "으로/로")} 나누어야 곱이 같아요.`,
    explanation: `${a} × ${b} = ${a * b}, ${a * k} × ${b / k} = ${a * b}`,
  };
});

export const l4EqError = word("l4-eq-error", (rand) => {
  const [a] = names(rand, 1);
  const x = randInt(rand, 40, 95);
  const y = randInt(rand, 11, 35);
  const d = randInt(rand, 1, 5);
  const wrong = `${x} − ${y} = ${x - d} − ${y + d}`;
  const right = `${x} − ${y} = ${x - d} − ${y - d}`;
  const r = markChoice(rand, right, [`${x} − ${y} = ${x + d} − ${y - d}`, `${x} − ${y} = ${x - d} + ${y - d}`, `${x} − ${y} = ${x} − ${y + d}`]);
  return {
    key: `${x}:${y}:${d}:${r.answer}`,
    prompt: `${a}는 아래 식이 옳은 식이라고 했지만 틀렸습니다. 등호(=) 양쪽의 값이 같아지도록 바르게 고친 식을 고르세요.`,
    expression: wrong,
    visual: r.visual,
    answer: r.answer,
    choices: r.choices,
    hint: "양쪽을 각각 계산하여 값이 같은지 확인해 보세요.",
    explanation: `${x} − ${y} = ${x - y}, ${x - d} − ${y - d} = ${x - y}`,
  };
});

export const l4EqReason = word("l4-eq-reason", (rand) => {
  const a = randInt(rand, 11, 60);
  const b = randInt(rand, a + 2, 90);
  return {
    key: `${a}:${b}`,
    prompt: `□ + ${a} = △ + ${b}입니다. □와 △에 알맞은 수는 여러 가지이지만, □는 항상 △보다 몇 큰가요?`,
    answer: b - a,
    hint: "양쪽의 합이 같으려면 더하는 수가 작은 쪽의 다른 수가 그만큼 커야 해요.",
    explanation: `${b} − ${a} = ${b - a}만큼 □가 더 커야 합니다. 예: □ = ${b - a + 1}, △ = 1`,
  };
});
