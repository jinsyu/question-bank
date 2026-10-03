import { pick, randInt, shuffle } from "../../lib/random";
import { clockScene } from "../generators/pictures";
import { josa } from "../josa";
import { ord } from "../ordinal";
import {
  chartScene, clocksScene, designCounts, designScene, FLAT_NAME, FLAT_THINGS, flatsScene, MARKS as PIC_MARKS, pairsScene, randomDesign, sticksScene, thingsScene,
  tokenRowsScene, tokensScene, traceSolidScene, twoDesignsScene, TRACE_FACE, type FlatKind, type FlatPart, type TraceView,
} from "./g1-pics";
import {
  betweenCount, betweenOne, biggerOfTwo, blankDigit, cardsTwoDigit, countBigger, distinct, eul, eun, ex, fixSaying, four, frameScene, gen,
  NAMES, orderNth, pickClaim, readNum, rowScene, seqBlank, tensBoxes, tensModel, tensOnesOver, tensRev, wa,
  type ShapeClaims,
} from "./g1";

const range = (a: number, b: number) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);

/* ════════ 1-2 1단원 100까지의 수 ════════ */

const V1 = "g1-s2-numbers100";

export const tensModel100 = tensModel("l1-tens-model100", [6, 7, 8, 9]);
export const readTens100 = readNum("l1-read-tens100", [60, 70, 80, 90]);
export const tensRev100 = tensRev("l1-tens-rev100", [6, 7, 8, 9]);
/** 중: 100은 3차시(수의 순서, 100 알아보기)에서 배우므로 줄은 90까지, □는 이 차시의 수(60~90) */
export const tensSeq100 = gen("l1-tens-seq100", 2, (rand) => {
  const seq = [30, 40, 50, 60, 70, 80, 90];
  const start = randInt(rand, 0, 2);
  const s = seq.slice(start, start + 5);
  const miss = pick(rand, range(1, 4).filter((i) => s[i] >= 60));
  return { key: `${start}:${miss}`, prompt: "10씩 커지는 규칙입니다. □ 안에 알맞은 수를 써넣으세요.", expression: s.map((n, i) => (i === miss ? "□" : String(n))).join(", "), answer: s[miss], hint: "10개씩 묶음이 하나씩 늘어나요.", explanation: s.join(", ") };
});
export const tensBoxes100 = tensBoxes("l1-w-tens-boxes100", 9, 6);
export const tensNeed100 = gen("l1-w-tens-need100", 3, (rand) => {
  const goal = pick(rand, [60, 70, 80, 90]);
  const a = randInt(rand, 1, goal / 10 - 2);
  const b = randInt(rand, 1, goal / 10 - a - 1);
  const name = pick(rand, NAMES);
  return {
    key: `${goal}:${a}:${b}:${name}`,
    prompt: `${name}는 밤 ${goal}개를 10개씩 봉지에 담으려고 합니다. 어제 ${a}봉지, 오늘 ${b}봉지를 담았습니다. 몇 봉지를 더 담아야 하나요?`,
    answer: goal / 10 - a - b,
    unit: "봉지",
    hint: `${eun(goal)} 10개씩 묶음 몇 개인지 먼저 생각해요.`,
    explanation: `${goal} = 10개씩 ${goal / 10}봉지, ${goal / 10} − ${a} − ${b} = ${goal / 10 - a - b}(봉지)`,
  };
});

export const read99 = readNum("l1-read99", range(51, 99).filter((n) => n % 10));
export const tensOnesOver100 = tensOnesOver("l1-tens-ones-over100", 99);
export const cards99 = cardsTwoDigit("l1-w-cards99", [0, 3, 4, 5, 6, 7, 8, 9]);

export const seq100 = seqBlank("l1-seq100", 50, 100);
export const between100 = betweenOne("l1-between100", 50, 100);
export const seqBack100 = seqBlank("l1-seq-back100", 50, 100, 2, true);
export const betweenCount100 = betweenCount("l1-w-between100", 50, 100);
export const cond100 = gen("l1-w-cond100", 3, (rand) => {
  const t = randInt(rand, 5, 9);
  const sum = randInt(rand, t + 1, t + 9);
  const o = sum - t;
  if (o > 9) return null;
  return {
    key: `${t}:${sum}`,
    prompt: `다음을 모두 만족하는 수를 구하세요.\n· ${t * 10}보다 크고 ${(t + 1) * 10}보다 작은 수입니다.\n· 10개씩 묶음의 수와 낱개의 수를 더하면 ${sum}입니다.`,
    answer: t * 10 + o,
    hint: "10개씩 묶음의 수부터 정해요.",
    explanation: `10개씩 묶음 ${t}개, 낱개 ${o}개(${t} + ${o} = ${sum}) → ${t * 10 + o}`,
  };
});

export const bigger100 = biggerOfTwo("l1-bigger100", 50, 99);
export const orderNth100 = orderNth("l1-order-nth100", 50, 99);
export const countBigger100 = countBigger("l1-count-bigger100", 50, 99);
export const blank100 = blankDigit("l1-w-blank100", 5, 9);
/**
 * 상(수의 크기 비교): 두 조건(○보다 많이, △보다 적게)을 모두 만족하는 사람 고르기.
 * 네 수 중 가장 큰(작은) 수 고르기(l1-w-most100)는 한 단계라 이 차시의 상에서 이것으로 바꿨다.
 * 경계와 같은 수(70장은 '70장보다 많이'가 아님)를 오답에 넣는다
 */
export const rangeWho100 = gen("l1-w-range-who100", 3, (rand) => {
  const lo = randInt(rand, 55, 80);
  const hi = lo + randInt(rand, 6, 15);
  if (hi > 95) return null;
  const x = randInt(rand, lo + 1, hi - 1);
  const below = pick(rand, [lo, randInt(rand, 50, lo - 1)]);
  const above = pick(rand, [hi, randInt(rand, hi + 1, 99)]);
  const other = rand() < 0.5 ? randInt(rand, 50, lo) : randInt(rand, hi, 99);
  const nums = [x, below, above, other];
  if (new Set(nums).size < 4) return null;
  const names = shuffle(rand, NAMES).slice(0, 4);
  const order = shuffle(rand, [0, 1, 2, 3]);
  const shown = order.map((i) => nums[i]);
  const answer = names[order.indexOf(0)];
  return {
    key: `${lo}:${hi}:${shown.join()}:${names.join()}`,
    prompt: `딱지를 ${names.map((n, i) => `${n}는 ${shown[i]}장`).join(", ")} 가지고 있습니다. 딱지를 ${lo}장보다 많이, ${hi}장보다 적게 가진 사람은 누구인가요?`,
    answer,
    choices: names,
    hint: `먼저 ${lo}장보다 많이 가진 사람을 모두 찾고, 그중에서 ${hi}장보다 적게 가진 사람을 골라요.`,
    explanation: `${lo}보다 큰 수: ${shown.filter((n) => n > lo).join(", ")} → 그중 ${hi}보다 작은 수는 ${x} → ${answer}`,
  };
});

export const pairDots = gen("l1-pair-dots", 1, (rand) => {
  const n = randInt(rand, 5, 20);
  return {
    key: `${n}`,
    prompt: "●를 둘씩 짝을 지으면 몇 쌍이 되고 몇 개가 남나요?",
    visual: pairsScene(n),
    answer: `${Math.floor(n / 2)},${n % 2}`,
    unit: ["쌍", "개 남음"],
    hint: "둘씩 묶으며 세어 보세요.",
    explanation: `${n}개 → ${Math.floor(n / 2)}쌍, ${n % 2}개 남음 → ${n % 2 ? "홀수" : "짝수"}`,
  };
});
/** 1학년은 자리 이름(일의 자리)을 배우기 전이라 '낱개의 수'로 말한다 */
export const evenCount = gen("l1-even-count", 2, (rand) => {
  const nums = distinct(rand, 1, 50, 6);
  const even = rand() < 0.5;
  const hits = nums.filter((n) => (n % 2 === 0) === even);
  return { key: `${nums.join()}:${even}`, prompt: `${even ? "짝수" : "홀수"}는 모두 몇 개인가요?`, expression: nums.join(",  "), answer: hits.length, unit: "개", hint: "낱개의 수(뒤의 숫자)를 보고 짝수·홀수를 가려요.", explanation: hits.length ? `${hits.join(", ")} → ${hits.length}개` : "없으므로 0개" };
});
export const parityCond = gen("l1-w-parity-cond", 3, (rand) => {
  const t = randInt(rand, 1, 9);
  const k = randInt(rand, 2, 7);
  const even = rand() < 0.5;
  const big = rand() < 0.5;
  const ok = range(k + 1, 9).filter((o) => (o % 2 === 0) === even);
  if (!ok.length) return null;
  const o = big ? Math.max(...ok) : Math.min(...ok);
  return {
    key: `${t}:${k}:${even}:${big}`,
    prompt: `다음을 모두 만족하는 수 중에서 가장 ${big ? "큰" : "작은"} 수를 구하세요.\n· 10개씩 묶음이 ${t}개입니다.\n· 낱개의 수는 ${k}보다 큽니다.\n· ${even ? "짝수" : "홀수"}입니다.`,
    answer: t * 10 + o,
    hint: "낱개가 될 수 있는 수를 모두 쓰고, 짝수·홀수를 골라요.",
    explanation: `${ok.map((x) => t * 10 + x).join(", ")} 중 가장 ${big ? "큰" : "작은"} 수 → ${t * 10 + o}`,
  };
});

export const nh = {
  tensSplit100: ex(V1, "tens100", "m1-tens-split100"),
  boxesBuy: ex(V1, "tens100", "w1-boxes-buy"),
  evenBetween: ex(V1, "order100", "w1-even-between"),
};

/* ════════ 1-2 2단원 덧셈과 뺄셈 ════════ */

const V2 = "g1-s2-add-sub";

/** 계산 결과가 가장 큰(작은) 식 고르기 */
function biggestExpr(id: string, make: (rand: () => number) => [string, number]) {
  return gen(id, 2, (rand) => {
    const m = new Map<number, string>();
    for (let i = 0; m.size < 4 && i < 60; i++) {
      const [e, v] = make(rand);
      if (!m.has(v) && ![...m.values()].includes(e)) m.set(v, e);
    }
    if (m.size < 4) return null;
    const big = rand() < 0.5;
    const t = big ? Math.max(...m.keys()) : Math.min(...m.keys());
    return { key: `${[...m.values()].join()}:${big}`, prompt: `계산 결과가 가장 ${big ? "큰" : "작은"} 것을 고르세요.`, answer: m.get(t)!, choices: shuffle(rand, [...m.values()]), hint: "하나씩 계산해서 비교해요.", explanation: [...m.entries()].map(([v, e]) => `${e} = ${v}`).join(", ") };
  });
}

/** 어떤 수를 잘못 계산한 문제: 더해야 할 것을 뺐다(또는 반대) */
function wrongCalc(id: string, pickNums: (rand: () => number) => [x: number, a: number] | null, addRight: boolean) {
  return gen(id, 3, (rand) => {
    const r = pickNums(rand);
    if (!r) return null;
    const [x, a] = r;
    const wrong = addRight ? x - a : x + a;
    const right = addRight ? x + a : x - a;
    return {
      key: `${x}:${a}`,
      prompt: `어떤 수${addRight ? "에" : "에서"} ${eul(a)} ${addRight ? "더해야" : "빼야"} 할 것을 잘못하여 ${addRight ? "뺐더니" : "더했더니"} ${josa(wrong, "이/가")} 되었습니다. 바르게 계산하면 얼마인가요?`,
      answer: right,
      hint: `먼저 어떤 수를 구해요. 어떤 수 ${addRight ? "−" : "+"} ${a} = ${wrong}`,
      explanation: `어떤 수: ${wrong} ${addRight ? "+" : "−"} ${a} = ${x}, 바르게 계산: ${x} ${addRight ? "+" : "−"} ${a} = ${right}`,
      mistakes: { [x]: "어떤 수까지만 구했어요." },
    };
  });
}

/** 세 수의 덧셈 차시(단원 첫 차시): 받아올림·받아내림은 뒤 차시라 세 수의 합은 9 이하 */
function add3Under10(rand: () => number): [number, number, number] {
  const a = randInt(rand, 1, 7);
  const b = randInt(rand, 1, 8 - a);
  const c = randInt(rand, 1, 9 - a - b);
  return shuffle(rand, [a, b, c]) as [number, number, number];
}

export const add3Missing = gen("l1-add3-missing", 2, (rand) => {
  const [a, b, c] = add3Under10(rand);
  const pos = randInt(rand, 0, 2);
  const parts = [a, b, c].map((n, i) => (i === pos ? "□" : String(n)));
  return { key: `${a}:${b}:${c}:${pos}`, prompt: "□ 안에 알맞은 수를 써넣으세요.", expression: `${parts.join(" + ")} = ${a + b + c}`, answer: [a, b, c][pos], hint: "아는 두 수를 먼저 더하고, 전체에서 몇이 더 필요한지 생각해요.", explanation: `${a} + ${b} + ${c} = ${a + b + c}` };
});
export const add3Biggest = biggestExpr("l1-add3-biggest", (rand) => {
  const [a, b, c] = add3Under10(rand);
  return [`${a} + ${b} + ${c}`, a + b + c];
});
export const add3Cards = gen("l1-w-add3-cards", 3, (rand) => {
  // 0~5에서 뽑아야 '합이 가장 클 때'도 합 9 이하가 자주 나온다
  const cards = distinct(rand, 0, 5, 4);
  const s = [...cards].sort((a, b) => a - b);
  const big = rand() < 0.5;
  const use = big ? s.slice(1) : s.slice(0, 3);
  const ans = use.reduce((x, y) => x + y, 0);
  // 합이 10을 넘으면 받아올림(뒤 차시)이 필요하다
  if (ans > 9) return null;
  return {
    key: `${cards.join()}:${big}`,
    prompt: `수 카드 ${cards.join(", ")} 중에서 세 장을 골라 세 수의 덧셈을 하려고 합니다. 합이 가장 ${big ? "클" : "작을"} 때의 합은 얼마인가요?`,
    answer: ans,
    hint: `가장 ${big ? "작은" : "큰"} 카드 한 장만 빼고 더해요.`,
    explanation: `${use.join(" + ")} = ${ans}`,
  };
});

export const sub3 = gen("l1-sub3", 1, (rand) => {
  const a = randInt(rand, 4, 9);
  const b = randInt(rand, 1, a - 2);
  const c = randInt(rand, 1, a - b - 1);
  return { key: `${a}:${b}:${c}`, prompt: "계산해 보세요.", expression: `${a} − ${b} − ${c} = □`, answer: a - b - c, hint: "앞에서부터 차례로 두 수씩 빼요.", explanation: `${a} − ${b} = ${a - b}, ${a - b} − ${c} = ${a - b - c}` };
});
export const sub3Missing = gen("l1-sub3-missing", 2, (rand) => {
  const a = randInt(rand, 4, 9);
  const b = randInt(rand, 1, a - 2);
  const c = randInt(rand, 1, a - b - 1);
  const mid = rand() < 0.5;
  return { key: `${a}:${b}:${c}:${mid}`, prompt: "□ 안에 알맞은 수를 써넣으세요.", expression: mid ? `${a} − □ − ${c} = ${a - b - c}` : `${a} − ${b} − □ = ${a - b - c}`, answer: mid ? b : c, hint: "아는 수부터 차례로 빼고, 얼마를 더 빼야 하는지 생각해요.", explanation: `${a} − ${b} − ${c} = ${a - b - c}` };
});
export const sub3Wrong = gen("l1-sub3-wrong", 2, (rand) => {
  const a = randInt(rand, 5, 9);
  const b = randInt(rand, 2, a - 2);
  const c = randInt(rand, 1, Math.min(b - 1, a - b));
  const name = pick(rand, NAMES);
  return {
    key: `${a}:${b}:${c}:${name}`,
    prompt: `${name}는 ${a} − ${b} − ${josa(c, "을/를")} 뒤의 두 수부터 계산하여 ${a} − ${b - c} = ${josa(a - b + c, "이라고/라고")} 했습니다. 바르게 계산한 값을 쓰세요.`,
    answer: a - b - c,
    hint: "세 수의 뺄셈은 앞에서부터 차례로 계산해요.",
    explanation: `${a} − ${b} = ${a - b}, ${a - b} − ${c} = ${a - b - c}`,
    mistakes: { [a - b + c]: "뒤의 두 수부터 계산했어요." },
  };
});
export const sub3Left = gen("l1-w-sub3-left", 3, (rand) => {
  const a = randInt(rand, 5, 9);
  const b = randInt(rand, 1, a - 2);
  const c = randInt(rand, 1, a - b - 1);
  const [p, q] = shuffle(rand, NAMES).slice(0, 2);
  return {
    key: `${a}:${b}:${c}:${p}`,
    prompt: `${p}는 연필 ${a}자루 중에서 ${q}에게 ${b}자루, 동생에게 ${c}자루를 주었습니다. ${p}에게 남은 연필은 몇 자루인가요?`,
    answer: a - b - c,
    unit: "자루",
    hint: "준 것을 차례로 빼요.",
    explanation: `${a} − ${b} − ${c} = ${a - b - c}(자루)`,
    mistakes: { [a - b]: "동생에게 준 연필을 빼지 않았어요." },
  };
});
export const sub3Reverse = gen("l1-w-sub3-reverse", 3, (rand) => {
  const b = randInt(rand, 1, 4);
  const c = randInt(rand, 1, 4);
  const d = randInt(rand, 1, 9 - b - c);
  if (d < 1) return null;
  const name = pick(rand, NAMES);
  return {
    key: `${b}:${c}:${d}:${name}`,
    prompt: `${name}는 사탕을 몇 개 가지고 있었습니다. 어제 ${b}개, 오늘 ${c}개를 먹었더니 ${d}개가 남았습니다. 처음에 가지고 있던 사탕은 몇 개인가요?`,
    answer: b + c + d,
    unit: "개",
    hint: "먹은 사탕과 남은 사탕을 모두 더하면 처음 수예요.",
    explanation: `${d} + ${c} + ${b} = ${b + c + d}(개)`,
  };
});

export const tenFrameAdd = gen("l1-ten-frame-add", 1, (rand) => {
  const a = randInt(rand, 1, 9);
  return { key: `${a}`, prompt: "그림을 보고 10이 되는 덧셈식을 완성하세요.", visual: frameScene([...Array(a).fill("●"), ...Array(10 - a).fill("○")], `● ${a}개, ○ ${10 - a}개`), expression: `${a} + □ = 10`, answer: 10 - a, hint: "○의 수를 세어요.", explanation: `${a} + ${10 - a} = 10` };
});
export const make10Pick = gen("l1-make10-pick", 2, (rand) => {
  const a = randInt(rand, 1, 9);
  const answer = `${a} + ${10 - a}`;
  const d = shuffle(rand, [-2, -1, 1, 2]);
  const choices = four(rand, answer, d.map((x) => `${a} + ${10 - a + x}`).filter((e) => !e.includes("+ 0") && !e.includes("-")));
  if (!choices) return null;
  return { key: `${a}:${choices.join()}`, prompt: "합이 10인 덧셈식을 고르세요.", answer, choices, hint: "10이 되는 짝을 떠올려요.", explanation: `${answer} = 10` };
});
/** 중: 10칸 틀 두 개를 모두 채우려면 — 10이 되는 짝을 두 번 찾는다(합은 10 이하) */
export const make10Chain = gen("l1-make10-chain", 2, (rand) => {
  const a = randInt(rand, 5, 9);
  const b = randInt(rand, 11 - a, 9);
  const need = 20 - a - b;
  if (need > 9 || need < 2) return null;
  return {
    key: `${a}:${b}`,
    prompt: "10칸 틀 두 개를 점으로 모두 채우려고 합니다. 점을 몇 개 더 그려야 하나요?",
    visual: frameScene([...Array(a).fill("●"), ...Array(10 - a).fill(""), ...Array(b).fill("●"), ...Array(10 - b).fill("")], `점 ${a}개와 ${b}개가 있는 10칸 틀 두 개`),
    answer: need,
    unit: "개",
    hint: "틀마다 10이 되려면 몇 개가 더 필요한지 먼저 구해요.",
    explanation: `${10 - a} + ${10 - b} = ${need}(개)`,
    mistakes: { [10 - a]: "한 틀만 채웠어요." },
  };
});
export const make10Story = gen("l1-w-make10-story", 3, (rand) => {
  const a = randInt(rand, 1, 5);
  const b = randInt(rand, 1, 8 - a);
  const name = pick(rand, NAMES);
  return {
    key: `${a}:${b}:${name}`,
    prompt: `${name}는 칭찬 붙임딱지를 어제 ${a}장, 오늘 ${b}장 모았습니다. 붙임딱지가 10장이 되려면 몇 장을 더 모아야 하나요?`,
    answer: 10 - a - b,
    unit: "장",
    hint: "지금까지 모은 붙임딱지 수를 먼저 구하고, 10이 되는 짝을 찾아요.",
    explanation: `${a} + ${b} = ${a + b}(장), ${a + b} + ${10 - a - b} = 10 → ${10 - a - b}장`,
    mistakes: { [10 - a]: "오늘 모은 붙임딱지를 빠뜨렸어요.", [a + b]: "지금까지 모은 수를 썼어요." },
  };
});

export const from10 = gen("l1-from10", 1, (rand) => {
  const a = randInt(rand, 1, 9);
  return { key: `${a}`, prompt: "그림을 보고 뺄셈을 하세요.", visual: frameScene([...Array(10 - a).fill("●"), ...Array(a).fill("×")], `10개 중 ${a}개에 ×`), expression: `10 − ${a} = □`, answer: 10 - a, hint: "× 표시가 없는 것을 세어요.", explanation: `10 − ${a} = ${10 - a}` };
});
export const from10Missing = gen("l1-from10-missing", 2, (rand) => {
  const a = randInt(rand, 1, 9);
  return { key: `${a}`, prompt: "□ 안에 알맞은 수를 써넣으세요.", expression: `10 − □ = ${10 - a}`, answer: a, hint: `10은 ${wa(10 - a)} 몇으로 가를 수 있나요?`, explanation: `10 − ${a} = ${10 - a}` };
});
export const from10Story = gen("l1-from10-story", 2, (rand) => {
  const a = randInt(rand, 1, 9);
  const name = pick(rand, NAMES);
  const answer = `10 − ${a} = ${10 - a}`;
  // a = 5이면 '10 − 5 = 5'가 정답과 같아지므로 계산이 틀린 식을 하나 더 둔다
  const choices = four(rand, answer, [`10 + ${a} = ${10 + a}`, `${a} + ${10 - a} = 10`, `10 − ${10 - a} = ${a}`, `10 − ${a} = ${11 - a}`]);
  if (!choices) return null;
  return { key: `${a}:${name}:${choices.join()}`, prompt: `${name}는 공 10개 중에서 ${a}개를 상자에 넣었습니다. 상자에 넣지 않은 공의 수를 구하는 식을 고르세요.`, answer, choices, hint: "전체에서 넣은 것을 빼요.", explanation: answer };
});
export const from10Compare = gen("l1-w-from10-compare", 3, (rand) => {
  const [a, b] = distinct(rand, 1, 9, 2);
  const [p, q] = shuffle(rand, NAMES).slice(0, 2);
  const ra = 10 - a;
  const rb = 10 - b;
  const [M, L] = ra > rb ? [p, q] : [q, p];
  return {
    key: `${a}:${b}:${p}`,
    prompt: `${p}와 ${q}는 각각 사탕 10개를 가지고 있었습니다. ${p}는 ${a}개, ${q}는 ${b}개를 먹었습니다. 남은 사탕은 ${M}가 ${L}보다 몇 개 더 많은가요?`,
    answer: Math.abs(ra - rb),
    unit: "개",
    hint: "두 사람의 남은 사탕 수를 먼저 구해요.",
    explanation: `${p}: 10 − ${a} = ${ra}, ${q}: 10 − ${b} = ${rb}, ${Math.max(ra, rb)} − ${Math.min(ra, rb)} = ${Math.abs(ra - rb)}(개)`,
  };
});
export const wrong10 = wrongCalc("l1-w-wrong10", (rand) => {
  const x = 10;
  const a = randInt(rand, 1, 9);
  return [x, a];
}, false);

export const tenFirst = gen("l1-ten-first", 1, (rand) => {
  const a = randInt(rand, 1, 9);
  const c = randInt(rand, 1, 9);
  const order = randInt(rand, 0, 2);
  const nums = [[a, 10 - a, c], [c, a, 10 - a], [a, c, 10 - a]][order];
  return { key: `${a}:${c}:${order}`, prompt: "10이 되는 두 수를 먼저 더하여 계산해 보세요.", expression: `${nums.join(" + ")} = □`, answer: 10 + c, hint: `${wa(a)} ${eul(10 - a)} 먼저 더하면 10이에요.`, explanation: `${a} + ${10 - a} = 10, 10 + ${c} = ${10 + c}` };
});
export const tenFirstMissing = gen("l1-ten-first-missing", 2, (rand) => {
  const a = randInt(rand, 1, 9);
  const c = randInt(rand, 1, 9);
  return { key: `${a}:${c}`, prompt: "□ 안에 알맞은 수를 써넣으세요.", expression: `${a} + □ + ${c} = ${10 + c}`, answer: 10 - a, hint: `${10 + c} = 10 + ${josa(c, "이에요/예요")}. ${wa(a)} □를 더하면 10이 돼요.`, explanation: `${a} + ${10 - a} + ${c} = ${10 + c}` };
});
export const tenFirstPick = gen("l1-ten-first-pick", 2, (rand) => {
  const a = randInt(rand, 1, 9);
  const c = randInt(rand, 1, 9);
  const nums = shuffle(rand, [a, 10 - a, c]);
  const answer = `${10 + c}`;
  const choices = four(rand, answer, [`${9 + c}`, `${11 + c}`, `${c + 10 - a}`, `${a + c}`]);
  if (!choices) return null;
  return { key: `${nums.join()}:${choices.join()}`, prompt: "계산 결과를 고르세요.", expression: nums.join(" + "), answer, choices, hint: "10이 되는 두 수를 찾아 먼저 더해요.", explanation: `${a} + ${10 - a} = 10, 10 + ${c} = ${10 + c}` };
});
export const tenFirstStory = gen("l1-w-ten-first-story", 3, (rand) => {
  const a = randInt(rand, 1, 9);
  const c = randInt(rand, 1, 9);
  const [x, y, z] = shuffle(rand, ["사과", "배", "귤", "감"]).slice(0, 3);
  return {
    key: `${a}:${c}:${x}${y}${z}`,
    prompt: `바구니에 ${x} ${a}개, ${y} ${c}개, ${z} ${10 - a}개가 있습니다. 과일은 모두 몇 개인가요?`,
    answer: 10 + c,
    unit: "개",
    hint: "10이 되는 두 수를 찾아 먼저 더해요.",
    explanation: `${a} + ${10 - a} = 10, 10 + ${c} = ${10 + c}(개)`,
  };
});
export const tenFirstCards = gen("l1-w-ten-first-cards", 3, (rand) => {
  const a = randInt(rand, 1, 4);
  const c = randInt(rand, 1, 9);
  const d = randInt(rand, 1, 9);
  const cards = [a, 10 - a, c, d];
  if (new Set(cards).size < 4 || c + d === 10 || a + c === 10 || a + d === 10 || 10 - a + c === 10 || 10 - a + d === 10) return null;
  const big = Math.max(c, d);
  return {
    key: `${cards.join()}`,
    prompt: `수 카드 ${shuffle(rand, cards).join(", ")} 중에서 세 장을 골라 더하려고 합니다. 먼저 더해서 10이 되는 카드 두 장을 고르고, 남은 카드 중 한 장을 더 골라 합이 가장 크게 되도록 할 때 세 수의 합은 얼마인가요?`,
    answer: 10 + big,
    hint: "합이 10이 되는 두 장을 먼저 찾고, 남은 카드 중 큰 수를 골라요.",
    explanation: `${a} + ${10 - a} = 10, 10 + ${big} = ${10 + big}`,
  };
});

export const carryFrame = gen("l1-carry-frame", 1, (rand) => {
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, 11 - a, 9);
  return { key: `${a}:${b}`, prompt: "그림을 보고 덧셈을 하세요.", visual: frameScene([...Array(a).fill("●"), ...Array(b).fill("○")], `● ${a}개와 ○ ${b}개`), expression: `${a} + ${b} = □`, answer: a + b, hint: "10칸 틀 하나를 먼저 채우면 10이에요.", explanation: `${a} + ${b} = ${a + b}`, mistakes: { [a + b - 10]: "10을 빠뜨렸어요." } };
});
export const carryBiggest = biggestExpr("l1-carry-biggest", (rand) => {
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, 11 - a, 9);
  return [`${a} + ${b}`, a + b];
});
export const wrongAdd18 = wrongCalc("l1-w-wrong-add18", (rand) => {
  const a = randInt(rand, 2, 8);
  const x = randInt(rand, a + 1, 9);
  return x + a >= 11 ? [x, a] : null;
}, true);

export const borrow = gen("l1-borrow", 1, (rand) => {
  const b = randInt(rand, 2, 9);
  const a = randInt(rand, 11, 9 + b);
  return { key: `${a}:${b}`, prompt: "그림을 보고 뺄셈을 하세요.", visual: frameScene([...Array(a - b).fill("●"), ...Array(b).fill("×")], `${a}개 중 ${b}개에 ×`), expression: `${a} − ${b} = □`, answer: a - b, hint: "× 표시가 없는 것을 세어요. 10에서 먼저 빼도 좋아요.", explanation: `${a} − ${b} = ${a - b}` };
});
export const borrowMissing = gen("l1-borrow-missing", 2, (rand) => {
  const b = randInt(rand, 2, 9);
  const a = randInt(rand, 11, 9 + b);
  return { key: `${a}:${b}`, prompt: "□ 안에 알맞은 수를 써넣으세요.", expression: `${a} − □ = ${a - b}`, answer: b, hint: `${a - b}에 얼마를 더하면 ${josa(a, "이/가")} 되는지 생각해요.`, explanation: `${a} − ${b} = ${a - b}` };
});
export const borrowReverse = gen("l1-w-borrow-reverse", 3, (rand) => {
  const b = randInt(rand, 2, 9);
  const d = randInt(rand, 11 - b, 9);
  const name = pick(rand, NAMES);
  return {
    key: `${b}:${d}:${name}`,
    prompt: `${name}는 색종이를 몇 장 가지고 있었습니다. 그중에서 ${b}장을 쓰고 나니 ${d}장이 남았습니다. 처음에 가지고 있던 색종이는 몇 장인가요?`,
    answer: b + d,
    unit: "장",
    hint: "쓴 것과 남은 것을 더하면 처음 수예요.",
    explanation: `${d} + ${b} = ${b + d}(장)`,
    mistakes: { [Math.abs(d - b)]: "처음 수는 더해서 구해요." },
  };
});
export const borrowError = gen("l1-w-borrow-error", 3, (rand) => {
  const b = randInt(rand, 3, 9);
  const o = randInt(rand, 1, b - 1);
  const a = 10 + o;
  const name = pick(rand, NAMES);
  const wrong = 10 + (b - o);
  const answer = `${a - b}, 10에서 ${eul(b)} 빼고 남은 ${josa(10 - b, "과/와")} ${eul(o)} 더해요.`;
  // 보기는 1학년이 실제로 자주 하는 실수(낱개끼리 거꾸로 빼기, 낱개 빠뜨리기, 10개씩 묶음 빠뜨리기)로 만든다
  return {
    key: `${a}:${b}:${name}`,
    prompt: `${name}는 ${a} − ${josa(b, "을/를")} 계산할 때 낱개끼리 ${b} − ${o} = ${josa(b - o, "을/를")} 구해 ${josa(wrong, "이라고/라고")} 했습니다. 바른 답과 계산 방법을 고르세요.`,
    answer,
    choices: shuffle(rand, [answer, `${wrong}, 낱개끼리는 큰 수에서 작은 수를 빼요.`, `${10 - b}, 10에서 ${eul(b)} 빼요.`, `${b - o}, 낱개끼리만 빼요.`]),
    hint: `${o}에서 ${eul(b)} 뺄 수 없으니 10에서 빼요.`,
    explanation: `10 − ${b} = ${10 - b}, ${10 - b} + ${o} = ${a - b}. ${name}는 ${b} − ${eul(o)} 계산했어요.`,
  };
});

export const addTens = gen("l1-add-tens", 1, (rand) => {
  const a = randInt(rand, 1, 8);
  const b = randInt(rand, 1, 9 - a);
  // 덧셈 차시라 뺄셈(70 − 20)은 두 자리 수의 뺄셈 차시에서 다룬다
  const [x, y] = [a * 10, b * 10];
  return { key: `${a}:${b}`, prompt: "계산해 보세요.", expression: `${x} + ${y} = □`, answer: x + y, hint: "10개씩 묶음끼리 더해요.", explanation: `10개씩 묶음 ${a}개와 ${b}개 → ${a + b}개, ${x} + ${y} = ${x + y}` };
});
export const add2Story = gen("l1-add2-story", 2, (rand) => {
  const a = randInt(rand, 1, 7) * 10 + randInt(rand, 0, 5);
  const b = randInt(rand, 1, 9 - Math.floor(a / 10)) * 10 + randInt(rand, 0, 9 - (a % 10));
  const name = pick(rand, NAMES);
  const answer = `${a} + ${b} = ${a + b}`;
  // 1학년은 100까지: 오답도 99를 넘지 않게
  const choices = four(rand, answer, [`${a + b} − ${b} = ${a}`, `${a} + ${b} = ${a + b + 10 <= 99 ? a + b + 10 : a + b - 10}`, `${a} + ${b} = ${a + b - 1}`]);
  if (!choices) return null;
  return { key: `${a}:${b}:${name}:${choices.join()}`, prompt: `${name}네 반은 줄넘기를 어제 ${a}번, 오늘 ${b}번 했습니다. 모두 몇 번 했는지 구하는 식과 답을 바르게 나타낸 것을 고르세요.`, answer, choices, hint: "낱개끼리, 10개씩 묶음끼리 더해요.", explanation: answer };
});
export const add2Biggest = biggestExpr("l1-add2-biggest", (rand) => {
  const a = randInt(rand, 1, 7) * 10 + randInt(rand, 0, 5);
  const b = randInt(rand, 1, 9 - Math.floor(a / 10)) * 10 + randInt(rand, 0, 9 - (a % 10));
  return [`${a} + ${b}`, a + b];
});
/**
 * 상(두 자리 수의 덧셈): 형보다 몇 개 더 많은 수를 구한 뒤(1단계) 두 사람의 수를 더하기(2단계). 받아올림 없음.
 * 이 차시의 상이던 w1-stickers2는 두 자리 수의 뺄셈이 먼저 필요해 다음 차시(sub2)로 옮겼다
 */
export const add2MoreTotal = gen("l1-w-add2-more-total", 3, (rand) => {
  const a = randInt(rand, 1, 3) * 10 + randInt(rand, 0, 4);
  const d = randInt(rand, 1, 2) * 10 + randInt(rand, 0, 4);
  const b = a + d;
  const s = a + b;
  // 두 번의 덧셈 모두 받아올림이 없게
  if ((a % 10) + (b % 10) > 9) return null;
  const [p, q] = shuffle(rand, NAMES).slice(0, 2);
  return {
    key: `${a}:${d}:${p}`,
    prompt: `${p}는 구슬을 ${a}개 모았고, ${q}는 ${p}보다 ${d}개 더 많이 모았습니다. 두 사람이 모은 구슬은 모두 몇 개인가요?`,
    answer: s,
    unit: "개",
    hint: `먼저 ${q}가 모은 구슬의 수를 구해요.`,
    explanation: `${q}: ${a} + ${d} = ${b}(개), 모두: ${a} + ${b} = ${s}(개)`,
    mistakes: { [b]: `${q}가 모은 구슬의 수만 구했어요.` },
  };
});
export const cardsAdd2 = gen("l1-w-cards-add2", 3, (rand) => {
  const cards = distinct(rand, 1, 4, 3);
  const s = [...cards].sort((a, b) => a - b);
  const big = s[2] * 10 + s[1];
  const small = s[0] * 10 + s[1];
  return {
    key: cards.join(),
    prompt: `수 카드 ${cards.join(", ")} 중에서 두 장을 골라 몇십몇을 만들려고 합니다. 만들 수 있는 가장 큰 수와 가장 작은 수의 합은 얼마인가요?`,
    answer: big + small,
    hint: "가장 큰 수와 가장 작은 수를 먼저 만들어요.",
    explanation: `${big} + ${small} = ${big + small}`,
  };
});

export const sub2Missing = gen("l1-sub2-missing", 2, (rand) => {
  const a = randInt(rand, 2, 9) * 10 + randInt(rand, 1, 9);
  const b = randInt(rand, 1, Math.floor(a / 10) - 1) * 10 + randInt(rand, 0, a % 10);
  return { key: `${a}:${b}`, prompt: "□ 안에 알맞은 수를 써넣으세요.", expression: `${a} − □ = ${a - b}`, answer: b, hint: "10개씩 묶음끼리, 낱개끼리 몇을 빼야 하는지 생각해요.", explanation: `${a} − ${b} = ${a - b}` };
});
export const sub2Error = gen("l1-sub2-error", 2, (rand) => {
  const t = randInt(rand, 3, 9);
  const o = randInt(rand, 2, 9);
  const b = randInt(rand, 1, o - 1);
  const a = t * 10 + o;
  const name = pick(rand, NAMES);
  return {
    key: `${a}:${b}:${name}`,
    prompt: `${name}는 ${a} − ${josa(b, "을/를")} 계산할 때 ${eul(b)} 10개씩 묶음의 수에서 빼서 ${josa(a - b * 10, "이라고/라고")} 했습니다. 바르게 계산한 값을 쓰세요.`,
    answer: a - b,
    hint: "낱개는 낱개끼리 빼요.",
    explanation: `${a} − ${b} = ${a - b}`,
    mistakes: { [a - b * 10]: "낱개를 10개씩 묶음에서 뺐어요." },
  };
});
export const sub2Compare = gen("l1-w-sub2-compare", 3, (rand) => {
  const [p, q] = shuffle(rand, NAMES).slice(0, 2);
  const d = randInt(rand, 1, 4) * 10 + randInt(rand, 0, 4);
  const b = randInt(rand, 1, 3) * 10 + randInt(rand, 0, 4);
  const c = randInt(rand, 1, 9 - ((d + b) % 10));
  const a = d + b + c;
  return {
    key: `${a}:${b}:${c}:${p}`,
    prompt: `${p}는 구슬을 ${a}개, ${q}는 ${b}개 가지고 있었습니다. ${p}가 동생에게 구슬 ${c}개를 주었습니다. 이제 ${p}는 ${q}보다 구슬을 몇 개 더 많이 가지고 있나요?`,
    answer: d,
    unit: "개",
    hint: `${p}에게 남은 구슬 수를 먼저 구하고, 두 사람의 구슬 수를 비교해요.`,
    explanation: `${a} − ${c} = ${a - c}, ${a - c} − ${b} = ${d}(개)`,
    mistakes: { [a - b]: "동생에게 준 구슬을 빼지 않았어요." },
  };
});
export const wrongSub2 = wrongCalc("l1-w-wrong-sub2", (rand) => {
  const b = randInt(rand, 1, 3) * 10 + randInt(rand, 0, 3);
  const x = randInt(rand, 4, 6) * 10 + randInt(rand, 3, 6);
  return [x, b];
}, false);

export const as2 = {
  carryMissing: ex(V2, "ten", "m1-carry-missing"),
  fruitThree: ex(V2, "ten", "w1-fruit-three"),
  busCarry: ex(V2, "carry1", "w1-bus-carry"),
  twoDigitMissing: ex(V2, "two-digit", "m1-two-digit-missing"),
  stickers2: ex(V2, "two-digit", "w1-stickers2"),
};

/* ════════ 1-2 3단원 모양과 시각 ════════ */

/* 1-2 3단원 △□○ 차시는 모두 그림을 보고 푼다. 도형은 크기·방향·길쭉함을 섞어 "달라 보여도 같은 모양"을 판별하게 한다 */

/** 그림으로 그리는 생활 물건(모양이 하나로 정해지는 것만) */
export const FLATS: Record<string, string[]> = {
  "□ 모양": FLAT_THINGS.filter((t) => t.kind === 4).map((t) => t.name),
  "△ 모양": FLAT_THINGS.filter((t) => t.kind === 3).map((t) => t.name),
  "○ 모양": FLAT_THINGS.filter((t) => t.kind === 0).map((t) => t.name),
};
const FKINDS: FlatKind[] = [3, 4, 0];
const FNAME = (k: FlatKind) => `${FLAT_NAME[k]} 모양`;
const FLAT_CHOICES = FKINDS.map(FNAME);
const M4 = PIC_MARKS.slice(0, 4);
const thingsOf = (k: FlatKind) => FLAT_THINGS.filter((t) => t.kind === k).map((t) => t.name);
/** △ c[0]개, □ c[1]개, ○ c[2]개를 섞은 목록 */
const flatList = (rand: () => number, c: number[]): FlatKind[] => shuffle(rand, FKINDS.flatMap((k, i) => Array<FlatKind>(c[i]).fill(k)));
const shapesScene = (list: FlatKind[], rand: () => number) => flatsScene(list, rand, "크기와 방향이 여러 가지인 △, □, ○ 모양");

export const flatShapeCount = gen("flat-shape-count", 1, (rand) => {
  const c = FKINDS.map(() => randInt(rand, 1, 4));
  const q = randInt(rand, 0, 2);
  const list = flatList(rand, c);
  return {
    key: `${list.join("")}:${q}`,
    prompt: `그림에서 ${FNAME(FKINDS[q])}은 몇 개인가요?`,
    visual: shapesScene(list, rand),
    answer: c[q],
    unit: "개",
    hint: "크기나 놓인 방향이 달라도 뾰족한 곳과 곧은 선의 수가 같으면 같은 모양이에요.",
    explanation: `${FNAME(FKINDS[q])}은 ${c[q]}개입니다.`,
  };
});
export const flatObject = gen("l1-flat-object", 1, (rand) => {
  const k = pick(rand, FKINDS);
  const answer = pick(rand, thingsOf(k));
  const rest = shuffle(rand, FLAT_THINGS.filter((t) => t.kind !== k).map((t) => t.name)).slice(0, 3);
  const names = shuffle(rand, [answer, ...rest]);
  const mark = M4[names.indexOf(answer)];
  return {
    key: names.join(),
    prompt: `테두리가 ${FNAME(k)}인 물건을 고르세요.`,
    visual: thingsScene(names),
    answer: mark,
    choices: M4,
    hint: "물건의 테두리를 따라 그려 보세요.",
    explanation: `${mark} ${josa(answer, "은/는")} ${FNAME(k)}입니다.`,
  };
});
export const flatOdd = gen("l1-flat-odd", 2, (rand) => {
  const [s, t] = shuffle(rand, FKINDS);
  const same = shuffle(rand, thingsOf(s)).slice(0, 3);
  const odd = pick(rand, thingsOf(t));
  const names = shuffle(rand, [...same, odd]);
  const mark = M4[names.indexOf(odd)];
  return {
    key: names.join(),
    prompt: "테두리의 모양이 다른 물건을 하나 고르세요.",
    visual: thingsScene(names),
    answer: mark,
    choices: M4,
    hint: "뾰족한 곳이 몇 군데인지, 둥근지 살펴보세요.",
    explanation: `나머지는 ${FNAME(s)}이고, ${mark} ${josa(odd, "은/는")} ${FNAME(t)}입니다.`,
  };
});
export const shapeMostLeast = gen("m1-shape-most-least", 2, (rand) => {
  const c = shuffle(rand, [1, 2, 3, 4, 5]).slice(0, 3);
  const list = flatList(rand, c);
  const mx = Math.max(...c);
  const mn = Math.min(...c);
  return {
    key: list.join(""),
    prompt: "그림에서 가장 많은 모양은 가장 적은 모양보다 몇 개 더 많은가요?",
    visual: shapesScene(list, rand),
    answer: mx - mn,
    unit: "개",
    hint: "△, □, ○ 모양을 각각 세어 보고, 가장 많은 것과 가장 적은 것을 비교해요.",
    explanation: `△ ${c[0]}개, □ ${c[1]}개, ○ ${c[2]}개 → ${mx} − ${mn} = ${mx - mn}(개)`,
    mistakes: { [mx]: "가장 많은 모양의 수만 썼어요." },
  };
});
export const flatMore = gen("l1-w-flat-more", 3, (rand) => {
  const c = distinct(rand, 1, 5, 3);
  const list = flatList(rand, c);
  const [i, j] = shuffle(rand, [0, 1, 2]).slice(0, 2);
  const [M, L] = c[i] > c[j] ? [i, j] : [j, i];
  return {
    key: `${list.join("")}:${i}${j}`,
    prompt: `그림에서 ${FNAME(FKINDS[M])}은 ${FNAME(FKINDS[L])}보다 몇 개 더 많은가요?`,
    visual: shapesScene(list, rand),
    answer: c[M] - c[L],
    unit: "개",
    hint: "크기와 방향이 달라도 같은 모양끼리 세어요.",
    explanation: `${FNAME(FKINDS[M])} ${c[M]}개, ${FNAME(FKINDS[L])} ${c[L]}개 → ${c[M] - c[L]}개`,
  };
});
/** 상: 그림의 △, □ 모양에서 뾰족한 곳 세기(○는 뾰족한 곳이 없다) */
export const corners = gen("w1-corners", 3, (rand) => {
  const c = [randInt(rand, 1, 2), randInt(rand, 1, 2), randInt(rand, 1, 2)];
  const list = flatList(rand, c);
  const total = 3 * c[0] + 4 * c[1];
  return {
    key: list.join(""),
    prompt: "그림에 있는 모양의 뾰족한 곳은 모두 몇 군데인가요?",
    visual: shapesScene(list, rand),
    answer: total,
    unit: "군데",
    hint: "△ 모양은 뾰족한 곳이 3군데, □ 모양은 4군데, ○ 모양은 없어요.",
    explanation: `${[...Array(c[0]).fill(3), ...Array(c[1]).fill(4)].join(" + ")} = ${total}(군데)`,
  };
});

const FLAT_FEATURE: Record<FlatKind, string> = {
  4: "뾰족한 곳이 4군데이고 곧은 선이 4개인",
  3: "뾰족한 곳이 3군데이고 곧은 선이 3개인",
  0: "뾰족한 곳이 없고 둥근",
};
export const flatFeature = gen("l1-flat-feature", 1, (rand) => {
  const k = pick(rand, FKINDS);
  const [p, q] = FKINDS.filter((x) => x !== k);
  const list = shuffle(rand, [k, p, q, pick(rand, [p, q])]);
  const answer = M4[list.indexOf(k)];
  return {
    key: `${k}:${list.join("")}`,
    prompt: `${FLAT_FEATURE[k]} 모양을 고르세요.`,
    visual: flatsScene(list, rand, "△, □, ○ 모양 네 개", M4),
    answer,
    choices: M4,
    hint: "뾰족한 곳의 수를 세어 보세요.",
    explanation: `${josa(answer, "은/는")} ${FNAME(k)}입니다.`,
  };
});

/**
 * 물건 이름이 모양을 말하지 않게 한다('세모 기둥 블록' → △, '둥근 통' → ○ 금지).
 * 세모 기둥은 옆면(□)을 칠한 그림도 있어 이름만으로는 답을 정할 수 없다
 */
const TRACE_THINGS: Record<"box" | "cyl" | "prism", string[]> = {
  box: ["과자 상자", "필통", "벽돌"],
  cyl: ["풀", "음료수 캔", "통조림"],
  prism: ["나무 블록", "치즈 조각", "장난감 블록"],
};
const TRACE_VIEWS: TraceView[] = ["box-front", "box-top", "box-side", "cyl-0", "cyl-1", "cyl-lying", "prism-front", "prism-tall", "prism-side"];
export const traceShape = gen("l1-trace-shape", 2, (rand) => {
  const k = pick(rand, FKINDS);
  const view = pick(rand, TRACE_VIEWS.filter((v) => TRACE_FACE[v] === k));
  const thing = pick(rand, TRACE_THINGS[view.split("-")[0] as keyof typeof TRACE_THINGS]);
  return {
    key: `${view}:${thing}`,
    prompt: `${thing}의 색칠한 평평한 부분을 종이에 대고 본뜨면 어떤 모양이 나오나요?`,
    visual: traceSolidScene(view),
    answer: FNAME(k),
    choices: FLAT_CHOICES,
    hint: "색칠한 부분의 테두리를 따라 그린다고 생각해 보세요.",
    explanation: `${thing}의 색칠한 부분을 본뜨면 ${FNAME(k)}이 나와요.`,
  };
});
export const flatGuess = gen("l1-w-flat-guess", 3, (rand) => {
  const c = [randInt(rand, 1, 4), randInt(rand, 1, 4), randInt(rand, 1, 4)];
  const list = flatList(rand, c);
  const q = randInt(rand, 0, 2);
  const clue = ["뾰족한 곳이 있고, 곧은 선이 3개인", "뾰족한 곳이 4군데이고, 곧은 선이 4개인", "뾰족한 곳도 곧은 선도 없는"][q];
  return {
    key: `${list.join("")}:${q}`,
    prompt: `그림에서 ${clue} 모양은 모두 몇 개인가요?`,
    visual: shapesScene(list, rand),
    answer: c[q],
    unit: "개",
    hint: "설명에 맞는 모양이 무엇인지 먼저 알아내고, 크기와 방향이 달라도 같은 모양끼리 세어요.",
    explanation: `${FNAME(FKINDS[q])} → ${c[q]}개`,
  };
});
export const FLAT_CLAIMS: ShapeClaims[] = [
  {
    subject: "△ 모양",
    truths: ["△ 모양은 뾰족한 곳이 3군데예요.", "△ 모양은 곧은 선으로 되어 있어요.", "△ 모양은 곧은 선이 3개예요."],
    falses: ["△ 모양은 뾰족한 곳이 4군데예요.", "△ 모양은 둥근 선으로 되어 있어요.", "△ 모양은 뾰족한 곳이 없어요.", "△ 모양은 곧은 선이 4개예요."],
    says: [
      { say: "△ 모양은 뾰족한 곳이 4군데예요.", fix: "△ 모양은 뾰족한 곳이 3군데예요." },
      { say: "△ 모양은 둥근 선으로 되어 있어요.", fix: "△ 모양은 곧은 선으로 되어 있어요." },
    ],
  },
  {
    subject: "□ 모양",
    truths: ["□ 모양은 뾰족한 곳이 4군데예요.", "□ 모양은 곧은 선으로 되어 있어요.", "□ 모양은 곧은 선이 4개예요."],
    falses: ["□ 모양은 뾰족한 곳이 없어요.", "□ 모양은 뾰족한 곳이 3군데예요.", "□ 모양은 둥근 선으로 되어 있어요.", "□ 모양은 곧은 선이 3개예요."],
    says: [
      { say: "□ 모양은 뾰족한 곳이 없어요.", fix: "□ 모양은 뾰족한 곳이 4군데예요." },
      { say: "□ 모양은 뾰족한 곳이 3군데예요.", fix: "□ 모양은 뾰족한 곳이 4군데예요." },
    ],
  },
  {
    subject: "○ 모양",
    truths: ["○ 모양은 둥근 선으로 되어 있어요.", "○ 모양은 뾰족한 곳이 없어요.", "○ 모양은 곧은 선이 없어요."],
    falses: ["○ 모양은 곧은 선으로 되어 있어요.", "○ 모양은 뾰족한 곳이 4군데예요.", "○ 모양은 뾰족한 곳이 3군데예요.", "○ 모양은 뾰족한 곳이 1군데예요."],
    says: [
      { say: "○ 모양은 곧은 선으로 되어 있어요.", fix: "○ 모양은 둥근 선으로 되어 있어요." },
      { say: "○ 모양은 뾰족한 곳이 4군데예요.", fix: "○ 모양은 뾰족한 곳이 없어요." },
    ],
  },
];
/** 평면 모양 이름 → 크기·방향이 다른 같은 모양 세 개 */
const flatPicture = (subject: string, rand: () => number) => {
  const k = FKINDS.find((x) => FNAME(x) === subject)!;
  return flatsScene([k, k, k], rand, `크기와 방향이 다른 ${subject} 세 개`);
};
export const flatTrue = pickClaim("l1-flat-true", FLAT_CLAIMS, flatPicture, "그림의 모양에서 뾰족한 곳과 곧은 선을 세어 보세요.");
export const flatError = fixSaying("l1-w-flat-error", FLAT_CLAIMS, "바르게 고쳐 말한 것을 고르세요.", "그림의 모양에서 뾰족한 곳과 선을 살펴보세요.", flatPicture);

/** 꾸민 그림에서 모양별 개수(△, □, ○ 순) */
const designC = (parts: FlatPart[]) => {
  const d = designCounts(parts);
  return FKINDS.map((k) => d[k]);
};
export const flatUsed = gen("l1-flat-used", 1, (rand) => {
  const d = randomDesign(rand);
  const c = designC(d.parts);
  const q = pick(rand, [0, 1, 2].filter((i) => c[i] > 0));
  return {
    key: `${d.name}:${c.join()}:${q}`,
    prompt: `${josa(d.name, "을/를")} 꾸미는 데 ${FNAME(FKINDS[q])}을 몇 개 사용했나요?`,
    visual: designScene(d.parts, d.name),
    answer: c[q],
    unit: "개",
    hint: "센 모양에 하나씩 표시하며 세어요. 작은 모양도 빠뜨리지 마세요.",
    explanation: `${FNAME(FKINDS[q])} ${c[q]}개`,
  };
});
export const flatNeed = gen("l1-flat-need", 2, (rand) => {
  const d = randomDesign(rand);
  const c = designC(d.parts);
  const ks = [0, 1, 2].filter((i) => c[i] >= 2);
  if (!ks.length) return null;
  const q = pick(rand, ks);
  const have = randInt(rand, 1, c[q] - 1);
  return {
    key: `${d.name}:${c.join()}:${q}:${have}`,
    prompt: `그림과 똑같이 꾸미려고 합니다. ${josa(FNAME(FKINDS[q]), "이/가")} ${have}개 있다면 몇 개가 더 있어야 하나요?`,
    visual: designScene(d.parts, d.name),
    answer: c[q] - have,
    unit: "개",
    hint: `그림에서 ${FNAME(FKINDS[q])}을 먼저 세어요.`,
    explanation: `${FNAME(FKINDS[q])}이 ${c[q]}개 필요하므로 ${c[q]} − ${have} = ${c[q] - have}(개)`,
    mistakes: { [c[q]]: "필요한 개수를 그대로 썼어요." },
  };
});
export const flatMakeMost = gen("l1-flat-make-most", 2, (rand) => {
  const d = randomDesign(rand);
  const c = designC(d.parts);
  const mx = Math.max(...c);
  if (c.filter((x) => x === mx).length > 1) return null;
  const answer = FNAME(FKINDS[c.indexOf(mx)]);
  return {
    key: `${d.name}:${c.join()}`,
    prompt: `${josa(d.name, "을/를")} 꾸미는 데 가장 많이 사용한 모양을 고르세요.`,
    visual: designScene(d.parts, d.name),
    answer,
    choices: FLAT_CHOICES,
    hint: "△, □, ○ 모양을 각각 세어 비교해요.",
    explanation: FKINDS.map((k, i) => `${FNAME(k)} ${c[i]}개`).join(", ") + ` → ${answer}`,
  };
});
export const sticks = gen("l1-w-sticks", 3, (rand) => {
  const tri = randInt(rand, 1, 2);
  const sq = randInt(rand, 1, 2);
  const used = tri * 3 + sq * 4;
  const left = randInt(rand, 1, 5);
  return {
    key: `${tri}:${sq}:${left}`,
    prompt: `길이가 같은 막대 ${used + left}개로 그림과 같이 △ 모양과 □ 모양을 만들었습니다. 남은 막대는 몇 개인가요?`,
    visual: sticksScene(tri, sq),
    answer: left,
    unit: "개",
    hint: "그림에서 사용한 막대를 먼저 세어요.",
    explanation: `사용한 막대 ${used}개, ${used + left} − ${used} = ${left}(개)`,
    mistakes: { [used]: "사용한 막대의 수를 썼어요." },
  };
});
export const flatMakeTwo = gen("l1-w-flat-make-two", 3, (rand) => {
  const a = randomDesign(rand);
  const b = randomDesign(rand);
  const ca = designC(a.parts);
  const cb = designC(b.parts);
  const ks = [0, 1, 2].filter((i) => ca[i] !== cb[i]);
  if (!ks.length) return null;
  const q = pick(rand, ks);
  const [M, L] = ca[q] > cb[q] ? ["①", "②"] : ["②", "①"];
  const diff = Math.abs(ca[q] - cb[q]);
  return {
    key: `${a.name}:${ca.join()}:${b.name}:${cb.join()}:${q}`,
    prompt: `①과 ②는 △, □, ○ 모양으로 꾸민 그림입니다. ${josa(M, "은/는")} ${L}보다 ${FNAME(FKINDS[q])}을 몇 개 더 많이 사용했나요?`,
    visual: twoDesignsScene(a.parts, b.parts),
    answer: diff,
    unit: "개",
    hint: `①과 ②에서 ${FNAME(FKINDS[q])}을 각각 세어 비교해요.`,
    explanation: `① ${ca[q]}개, ② ${cb[q]}개 → ${diff}개 더 많이`,
    mistakes: { [Math.max(ca[q], cb[q])]: `${M}의 개수만 썼어요.` },
  };
});

export const clockHour = gen("l1-clock-hour", 1, (rand) => {
  const h = randInt(rand, 1, 12);
  return { key: `${h}`, prompt: "시계가 나타내는 시각을 쓰세요.", visual: clockScene(h, 0), answer: h, unit: "시", hint: "긴바늘이 12를 가리키면 짧은바늘이 가리키는 수가 '몇 시'예요.", explanation: `${h}시`, mistakes: { 12: "긴바늘이 가리키는 수를 읽었어요." } };
});
export const clockHand = gen("l1-clock-hand", 2, (rand) => {
  const h = randInt(rand, 1, 11);
  const long = rand() < 0.5;
  return {
    key: `${h}:${long}`,
    prompt: `시계에 바늘을 그려 ${h}시를 나타내려고 합니다. ${long ? "긴바늘" : "짧은바늘"}은 어떤 숫자를 가리키게 그려야 하나요?`,
    visual: clockScene(h, 0, "none"),
    answer: long ? 12 : h,
    hint: "몇 시에는 긴바늘이 12를, 짧은바늘이 '몇'을 가리켜요.",
    explanation: `${h}시: 짧은바늘 ${h}, 긴바늘 12`,
    mistakes: { [long ? h : 12]: "긴바늘과 짧은바늘을 바꾸어 생각했어요." },
  };
});
/** 중: 시계 네 개 중 가장 빠른(늦은) 시각 — 오전·오후(2학년)를 쓰지 않고 '학교에서 돌아온 뒤'로 같은 때임을 알린다 */
export const clockEarliest = gen("l1-clock-earliest", 2, (rand) => {
  const hs = distinct(rand, 1, 8, 4);
  const early = rand() < 0.5;
  const t = early ? Math.min(...hs) : Math.max(...hs);
  const answer = M4[hs.indexOf(t)];
  return {
    key: `${hs.join()}:${early}`,
    prompt: `${pick(rand, NAMES)}가 학교에서 돌아온 뒤에 한 일의 시각을 시계로 나타냈습니다. 가장 ${early ? "빠른" : "늦은"} 시각을 나타내는 시계를 고르세요.`,
    visual: clocksScene(hs.map((h) => ({ h, m: 0 })), "시계 네 개"),
    answer,
    choices: M4,
    hint: "시계마다 몇 시인지 먼저 읽고 비교해요.",
    explanation: `${hs.map((h, i) => `${M4[i]} ${h}시`).join(", ")} → 가장 ${early ? "빠른" : "늦은"} 시각은 ${answer} ${t}시`,
  };
});
/** 중: 몇 시를 나타내는 시계 고르기(바늘을 바꾼 시계, 한 시간 다른 시계, 30분 시계가 보기) */
export const clockPick = gen("l1-clock-pick", 2, (rand) => {
  const h = randInt(rand, 1, 11);
  const opts = shuffle(rand, [
    { h, m: 0, ok: true },
    { h, m: 0, swap: true, ok: false },
    { h: h === 1 ? 2 : h - 1, m: 0, ok: false },
    { h, m: 30, ok: false },
  ]);
  const answer = M4[opts.findIndex((o) => o.ok)];
  return {
    key: `${h}:${opts.map((o) => `${o.h}${o.m}${o.swap ? "s" : ""}`).join()}`,
    prompt: `${h}시를 나타내는 시계를 고르세요.`,
    visual: clocksScene(opts, "시계 네 개"),
    answer,
    choices: M4,
    hint: `${h}시에는 긴바늘이 12를, 짧은바늘이 ${josa(h, "을/를")} 가리켜요.`,
    explanation: `긴바늘이 12, 짧은바늘이 ${josa(h, "을/를")} 가리키는 ${answer}`,
  };
});
/**
 * 상(몇 시 차시): 두 사람의 시각은 시계 그림으로, 두 사람은 글로 주고 가장 이른(늦은) 사람 찾기 — 시계 읽기(1단계) → 비교(2단계).
 * '몇 시 30분'은 다음 차시라 정각만 쓴다
 */
export const clockWho = gen("l1-w-clock-who", 3, (rand) => {
  const names = shuffle(rand, NAMES).slice(0, 4);
  const hs = distinct(rand, 6, 9, 4); // 아침에 일어나는 시각으로 알맞은 6~9시
  const early = rand() < 0.5;
  const t = early ? Math.min(...hs) : Math.max(...hs);
  const ans = hs.indexOf(t);
  return {
    key: `${names.join()}:${hs.join()}:${early}`,
    prompt: `오늘 아침에 ${names[0]}는 ① 시계의 시각에, ${names[1]}는 ② 시계의 시각에 일어났습니다. ${names[2]}는 ${hs[2]}시, ${names[3]}는 ${hs[3]}시에 일어났습니다. 가장 ${early ? "일찍" : "늦게"} 일어난 사람은 누구인가요?`,
    visual: clocksScene([{ h: hs[0], m: 0 }, { h: hs[1], m: 0 }], "시계 두 개"),
    answer: names[ans],
    choices: names,
    hint: "먼저 ①, ② 시계가 몇 시인지 읽고, 네 사람의 시각을 빠른 것부터 늘어놓아 보세요.",
    explanation: `${names.map((n, i) => `${n} ${hs[i]}시`).join(", ")} → 가장 ${early ? "일찍" : "늦게"} 일어난 사람은 ${names[ans]}`,
  };
});
export const clockError = gen("l1-w-clock-error", 3, (rand) => {
  const h = randInt(rand, 1, 11);
  const name = pick(rand, NAMES);
  return {
    key: `${h}:${name}`,
    prompt: `${name}는 시계를 보고 "12시"라고 읽었습니다. 잘못 읽은 까닭을 생각하여 바른 시각을 쓰세요.`,
    visual: clockScene(h, 0),
    answer: h,
    unit: "시",
    hint: "'몇 시'는 짧은바늘이 가리키는 수를 읽어요. 긴바늘은 12를 가리키고 있어요.",
    explanation: `${name}는 긴바늘을 읽었어요. 짧은바늘이 ${josa(h, "을/를")} 가리키므로 ${h}시`,
    mistakes: { 12: "긴바늘이 가리키는 수를 읽었어요." },
  };
});

export const clockHalf = gen("l1-clock-half", 1, (rand) => {
  const h = randInt(rand, 1, 12);
  return { key: `${h}`, prompt: "시계가 나타내는 시각을 쓰세요.", visual: clockScene(h, 30), answer: `${h},30`, unit: ["시", "분"], hint: "긴바늘이 6을 가리키면 30분이에요. 짧은바늘은 두 수 사이에 있어요.", explanation: `${h}시 30분`, mistakes: { [`${h === 12 ? 1 : h + 1},30`]: "짧은바늘이 지나온 수를 읽어야 해요." } };
});
export const halfHand = gen("l1-half-hand", 2, (rand) => {
  const h = randInt(rand, 1, 11);
  const between = (a: number) => `${josa(a, "과/와")} ${a === 12 ? 1 : a + 1} 사이`;
  const answer = between(h);
  const choices = four(rand, answer, [between(h === 1 ? 12 : h - 1), between(h + 1), `${h}에 딱 맞게`]);
  if (!choices) return null;
  return {
    key: `${h}:${choices.join()}`,
    prompt: `시계에 짧은바늘을 그려 ${h}시 30분을 나타내려고 합니다. 짧은바늘은 어디를 가리키게 그려야 하나요?`,
    visual: clockScene(h, 30, "minute"),
    answer,
    choices,
    hint: "30분이면 짧은바늘은 '몇'과 그다음 수의 가운데에 있어요.",
    explanation: `${h}시 30분 → 짧은바늘은 ${answer}`,
  };
});
/** 중: 몇 시 30분을 나타내는 시계 고르기(짧은바늘을 숫자에 딱 맞춘 시계, 한 시간 늦은 시계, 몇 시 정각이 보기) */
export const halfPick = gen("l1-half-pick", 2, (rand) => {
  // 6시 30분은 짧은바늘을 6에 맞춘 보기가 긴바늘과 겹쳐 보여서 뺀다
  const h = pick(rand, [1, 2, 3, 4, 5, 7, 8, 9, 10]);
  const opts = shuffle(rand, [
    { h, m: 30, ok: true },
    { h, m: 30, hourOn: true, ok: false },
    { h: h + 1, m: 30, ok: false },
    { h, m: 0, ok: false },
  ]);
  const answer = M4[opts.findIndex((o) => o.ok)];
  return {
    key: `${h}:${opts.map((o) => `${o.h}${o.m}${o.hourOn ? "o" : ""}`).join()}`,
    prompt: `${h}시 30분을 나타내는 시계를 고르세요.`,
    visual: clocksScene(opts, "시계 네 개"),
    answer,
    choices: M4,
    hint: `긴바늘이 6을 가리키고, 짧은바늘이 ${josa(h, "과/와")} ${h + 1}의 가운데를 가리키는 시계를 찾아요.`,
    explanation: `${answer}: 긴바늘 6, 짧은바늘 ${josa(h, "과/와")} ${h + 1} 사이`,
  };
});
export const halfOrder = gen("l1-w-half-order", 3, (rand) => {
  const names = shuffle(rand, NAMES).slice(0, 4);
  const hs = shuffle(rand, [3, 3, 4, 4, 5, 5]).slice(0, 4);
  const ms = hs.map((_, i) => (i % 2 ? 30 : 0));
  const val = hs.map((h, i) => h * 60 + ms[i]);
  if (new Set(val).size < 4) return null;
  const late = rand() < 0.5;
  const t = late ? Math.max(...val) : Math.min(...val);
  const fmt = (i: number) => `${hs[i]}시${ms[i] ? " 30분" : ""}`;
  return {
    key: `${names.join()}:${hs.join()}:${late}`,
    prompt: `친구들이 놀이터에 도착한 시각입니다. ${names.map((n, i) => `${n}: ${fmt(i)}`).join(", ")}. 가장 ${late ? "늦게" : "먼저"} 도착한 사람은 누구인가요?`,
    answer: names[val.indexOf(t)],
    choices: names,
    hint: "'몇 시'를 먼저 비교하고, 같으면 30분이 더 늦어요.",
    explanation: `${names[val.indexOf(t)]}(${fmt(val.indexOf(t))})`,
  };
});
export const halfError = gen("l1-w-half-error", 3, (rand) => {
  const h = randInt(rand, 1, 11);
  const name = pick(rand, NAMES);
  return {
    key: `${h}:${name}`,
    prompt: `${name}는 짧은바늘이 ${josa(h, "과/와")} ${h + 1} 사이에 있어서 "${h + 1}시 30분"이라고 읽었습니다. 바른 시각을 쓰세요.`,
    visual: clockScene(h, 30),
    answer: `${h},30`,
    unit: ["시", "분"],
    hint: "짧은바늘이 두 수 사이에 있으면 이미 지나온 수가 '몇 시'예요.",
    explanation: `짧은바늘이 ${wa(h)} ${h + 1} 사이 → ${h}시 30분`,
    mistakes: { [`${h + 1},30`]: "짧은바늘이 지나온 수를 읽어야 해요." },
  };
});

/* ════════ 1-2 5단원 규칙 찾기 ════════ */

const V4 = "g1-s2-patterns";
const SYM = ["○", "△", "☆", "◇", "♡"];

/** 되풀이 부분을 reps번 보여 주고 "…"를 붙인 모양 줄 */
const repeatScene = (unit: string[], reps: number) => tokensScene(Array.from({ length: unit.length * reps }, (_, i) => unit[i % unit.length]), "되풀이되는 모양", { perRow: 13, tail: true });

export const nthRepeat = gen("m1-nth-repeat", 2, (rand) => {
  const unit = shuffle(rand, SYM).slice(0, 2);
  const n = randInt(rand, 6, 10);
  const answer = unit[(n - 1) % 2];
  return {
    key: `${unit.join("")}:${n}`,
    prompt: `그림과 같은 규칙으로 모양을 늘어놓았습니다. 왼쪽에서 ${ord(n)}에 오는 모양은 무엇인가요?`,
    visual: repeatScene(unit, 2),
    answer,
    choices: shuffle(rand, [...unit, ...shuffle(rand, SYM.filter((s) => !unit.includes(s))).slice(0, 2)]),
    hint: "두 개씩 되풀이돼요. 이어서 늘어놓으며 세어 보세요.",
    explanation: `${Array.from({ length: n }, (_, i) => unit[i % 2]).join(" ")} → ${ord(n)}는 ${josa(answer, "이에요/예요")}`,
  };
});
export const patternCount = gen("w1-pattern-count", 3, (rand) => {
  const unit = pick(rand, [["○", "△", "△"], ["☆", "☆", "○"], ["◇", "○"], ["△", "○", "○"]]);
  const reps = randInt(rand, 3, 4);
  const target = pick(rand, [...new Set(unit)]);
  const per = unit.filter((u) => u === target).length;
  const total = unit.length * reps;
  return {
    key: `${unit.join("")}:${reps}:${target}`,
    prompt: `그림과 같은 규칙으로 모양 ${total}개를 늘어놓으려고 합니다. ${target} 모양은 모두 몇 개 놓게 되나요?`,
    visual: repeatScene(unit, 2),
    answer: per * reps,
    unit: "개",
    hint: `되풀이되는 부분이 몇 번 나오는지, 그 안에 ${target} 모양이 몇 개인지 생각해요.`,
    explanation: `${josa(unit.join(" "), "이/가")} ${reps}번, 한 번에 ${target} ${per}개 → ${Array(reps).fill(per).join(" + ")} = ${per * reps}(개)`,
  };
});
export const patternUnit = gen("l1-pattern-unit", 2, (rand) => {
  const unit = shuffle(rand, SYM).slice(0, randInt(rand, 2, 3));
  const seq = Array.from({ length: unit.length * 3 }, (_, i) => unit[i % unit.length]);
  const answer = unit.join(" ");
  const wrongs = [unit.slice(0, -1).join(" "), [...unit, unit[0]].join(" "), [...unit, unit[unit.length - 1]].join(" "), `${unit[0]} ${unit[0]}`];
  const choices = four(rand, answer, wrongs);
  if (!choices) return null;
  return { key: `${unit.join("")}:${choices.join("|")}`, prompt: "되풀이되는 부분을 고르세요.", visual: rowScene(seq, "되풀이되는 모양"), answer, choices, hint: "처음부터 몇 개씩 똑같이 되풀이되는지 살펴보세요.", explanation: `${josa(answer, "이/가")} 되풀이됩니다.` };
});
export const patternNth = gen("l1-w-pattern-nth", 3, (rand) => {
  const unit = shuffle(rand, SYM).slice(0, 3);
  const n = randInt(rand, 7, 10);
  const answer = unit[(n - 1) % 3];
  return {
    key: `${unit.join("")}:${n}`,
    prompt: `그림과 같은 규칙으로 모양을 늘어놓았습니다. 왼쪽에서 ${ord(n)}에 오는 모양은 무엇인가요?`,
    visual: repeatScene(unit, 2),
    answer,
    choices: shuffle(rand, [...unit, SYM.find((s) => !unit.includes(s))!]),
    hint: "3개씩 되풀이돼요. 셋째, 여섯째, 아홉째에는 같은 모양이 와요.",
    explanation: `${Array.from({ length: n }, (_, i) => unit[i % 3]).join(" ")} → ${ord(n)}는 ${josa(answer, "이에요/예요")}`,
  };
});
export const gridPattern = gen("l1-grid-pattern", 1, (rand) => {
  const [a, b] = shuffle(rand, SYM).slice(0, 2);
  const cols = 5;
  const rows = 3;
  const cell = (r: number, c: number) => ((r + c) % 2 === 0 ? a : b);
  const mr = randInt(rand, 1, rows - 1);
  const mc = randInt(rand, 0, cols - 1);
  const texts = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) texts.push({ at: [24 + c * 30, 20 + r * 30] as [number, number], text: r === mr && c === mc ? "?" : cell(r, c) });
  const answer = cell(mr, mc);
  return { key: `${a}${b}:${mr}:${mc}`, prompt: "규칙에 따라 ?에 알맞은 모양을 고르세요.", visual: { kind: "shape", width: 170, height: 100, label: "두 모양이 번갈아 놓인 무늬", texts }, answer, choices: shuffle(rand, [a, b, ...shuffle(rand, SYM.filter((s) => s !== a && s !== b)).slice(0, 2)]), hint: "가로줄과 세로줄에서 모양이 어떻게 바뀌는지 보세요.", explanation: `번갈아 놓이므로 ${answer}` };
});
/** 중: 서수는 말(셋째)로 — 숫자 입력('3째') 대신 이웃한 서수 보기에서 고른다 */
export const patternWrong = gen("l1-pattern-wrong", 2, (rand) => {
  const unit = shuffle(rand, SYM).slice(0, 2);
  const len = randInt(rand, 8, 10);
  const seq = Array.from({ length: len }, (_, i) => unit[i % 2]);
  const k = randInt(rand, 3, len);
  seq[k - 1] = unit[k % 2];
  const near = shuffle(rand, [k - 2, k - 1, k + 1, k + 2].filter((x) => x >= 1 && x <= len));
  const choices = four(rand, ord(k), near.map(ord));
  if (!choices) return null;
  return { key: `${unit.join("")}:${len}:${k}:${choices.join()}`, prompt: "규칙에 맞지 않게 놓인 모양은 왼쪽에서 몇째인가요?", visual: rowScene(seq, "모양을 늘어놓은 그림"), answer: ord(k), choices, hint: "되풀이되는 부분을 먼저 찾아요.", explanation: `${josa(unit.join(" "), "이/가")} 되풀이되는데 ${ord(k)} 모양이 틀렸어요.` };
});
export const patternFill = gen("l1-pattern-fill", 2, (rand) => {
  const unit = pick(rand, [["○", "△", "△"], ["☆", "☆", "○"], ["◇", "○", "○", "○"], ["△", "○"]]);
  const target = pick(rand, [...new Set(unit)]);
  const shown = unit.length * 2;
  const blanks = randInt(rand, 3, 5);
  const next = Array.from({ length: blanks }, (_, i) => unit[(shown + i) % unit.length]);
  const cnt = next.filter((s) => s === target).length;
  return {
    key: `${unit.join("")}:${blanks}:${target}`,
    prompt: `규칙에 따라 빈칸 ${blanks}개에 모양을 이어서 놓을 때, ${target} 모양은 몇 개 놓게 되나요?`,
    visual: rowScene([...Array.from({ length: shown }, (_, i) => unit[i % unit.length]), ...Array(blanks).fill("?")], "규칙에 따라 놓은 모양과 빈칸"),
    answer: cnt,
    unit: "개",
    hint: "빈칸에 들어갈 모양을 차례로 써 보세요.",
    explanation: `빈칸: ${next.join(" ")} → ${target} ${cnt}개`,
  };
});
/** 상([2수02-02] 규칙 만들기): 두 모양으로 만든 줄 네 개 중 규칙에 따라 늘어놓지 않은 것 */
export const notPattern = gen("l1-w-not-pattern", 3, (rand) => {
  const [a, b] = shuffle(rand, SYM).slice(0, 2);
  const units = shuffle(rand, [[a, b], [a, a, b], [a, b, b], [b, a], [a, b, a, a]]);
  const good = units.slice(0, 3).map((u) => Array.from({ length: 8 }, (_, i) => u[i % u.length]));
  // 규칙이 없는 줄: 되풀이 부분이 중간에 바뀐다
  const u = units[3];
  const bad = Array.from({ length: 8 }, (_, i) => u[i % u.length]);
  const k = randInt(rand, 4, 7);
  bad[k] = bad[k] === a ? b : a;
  if (units.slice(0, 3).some((g) => Array.from({ length: 8 }, (_, i) => g[i % g.length]).join() === bad.join())) return null;
  // 바꾼 줄이 우연히 다른 규칙(두 개 이상 되풀이)이 되면 다시 뽑는다
  const isRepeat = (row: string[]) => [1, 2, 3, 4].some((len) => row.every((x, i) => x === row[i % len]));
  if (isRepeat(bad)) return null;
  const rows = shuffle(rand, [...good, bad]);
  const answer = M4[rows.indexOf(bad)];
  return {
    key: rows.map((r) => r.join("")).join("|"),
    prompt: `친구들이 ${josa(a, "과/와")} ${b} 두 모양으로 각자 규칙을 만들어 늘어놓았습니다. 규칙에 따라 늘어놓지 않은 것을 고르세요.`,
    visual: tokenRowsScene(rows, "두 모양으로 늘어놓은 줄 네 개"),
    answer,
    choices: M4,
    hint: "줄마다 되풀이되는 부분을 찾아보세요. 끝까지 똑같이 되풀이되어야 규칙이에요.",
    explanation: `${josa(answer, "은/는")} ${josa(u.join(" "), "이/가")} 되풀이되다가 왼쪽에서 ${ord(k + 1)} 모양이 바뀌었어요.`,
  };
});
/** 상: 모양과 색이 함께 바뀌는 규칙(모양은 두 개씩, 색칠은 세 개씩 되풀이) */
export const shapeColor = gen("l1-w-shape-color", 3, (rand) => {
  const [a, b] = shuffle(rand, ["○", "△", "◇", "☆"]).slice(0, 2);
  const fill: Record<string, string> = { "○": "●", "△": "▲", "◇": "◆", "☆": "★" };
  const colorUnit = pick(rand, [[true, false], [true, true, false], [true, false, false]]);
  const shapeUnit = colorUnit.length === 2 ? [a, a, b] : [a, b];
  const at = (i: number) => (colorUnit[i % colorUnit.length] ? fill[shapeUnit[i % shapeUnit.length]] : shapeUnit[i % shapeUnit.length]);
  const q = randInt(rand, 7, 9);
  const seq = [...Array.from({ length: q }, (_, i) => at(i)), "?"];
  const answer = at(q);
  const choices = [fill[a], a, fill[b], b];
  return {
    key: `${a}${b}:${colorUnit.join()}:${q}`,
    prompt: "모양과 색칠이 함께 규칙에 따라 놓여 있습니다. ?에 알맞은 것을 고르세요.",
    visual: tokensScene(seq, "모양과 색칠의 규칙", { perRow: 13 }),
    answer,
    choices,
    hint: "모양이 되풀이되는 규칙과 색칠이 되풀이되는 규칙을 따로 찾아보세요.",
    explanation: `모양은 ${shapeUnit.join(" ")}, 색칠은 ${colorUnit.map((c) => (c ? "색칠" : "안 색칠")).join(", ")}이 되풀이돼요. → ${answer}`,
  };
});

const RULES = [2, 5, 10, 1];
export const rulePick = gen("l1-rule-pick", 2, (rand) => {
  const step = pick(rand, RULES);
  const down = rand() < 0.4;
  const start = down ? randInt(rand, 50, 99) : randInt(rand, 1, 50);
  const seq = Array.from({ length: 5 }, (_, i) => start + (down ? -step : step) * i);
  const answer = `${step}씩 ${down ? "작아져요" : "커져요"}`;
  const choices = four(rand, answer, [...RULES.filter((s) => s !== step).map((s) => `${s}씩 ${down ? "작아져요" : "커져요"}`), `${step}씩 ${down ? "커져요" : "작아져요"}`]);
  if (!choices) return null;
  return { key: `${start}:${step}:${down}:${choices.join()}`, prompt: "수 배열의 규칙을 바르게 말한 것을 고르세요.", expression: seq.join(", "), answer, choices, hint: "이웃한 두 수가 얼마씩 차이 나는지 보세요.", explanation: answer };
});
export const ruleReverse = gen("l1-w-rule-reverse", 3, (rand) => {
  const step = pick(rand, [2, 5, 10]);
  const first = randInt(rand, 1, 40);
  const nth = randInt(rand, 4, 6);
  const v = first + step * (nth - 1);
  return {
    key: `${step}:${first}:${nth}`,
    prompt: `어떤 수부터 시작하여 ${step}씩 커지는 수를 차례로 썼습니다. ${["", "", "", "", "넷째", "다섯째", "여섯째"][nth]} 수가 ${v}일 때 첫째 수는 무엇인가요?`,
    answer: first,
    hint: `${v}부터 ${step}씩 거꾸로 세어 보세요.`,
    explanation: Array.from({ length: nth }, (_, i) => first + step * i).join(", "),
    mistakes: { [v - step * nth]: "한 번 더 거꾸로 셌어요." },
  };
});

const chartRows = (start: number, rows: number, blank: number) =>
  Array.from({ length: rows }, (_, r) => Array.from({ length: 10 }, (_, c) => { const n = start + r * 10 + c; return n === blank ? "□" : String(n); }));
export const chartBlank = gen("l1-chart-blank", 1, (rand) => {
  const start = pick(rand, [1, 11, 21, 31, 41, 51, 61, 71]);
  const blank = randInt(rand, start + 10, start + 29);
  const rows = chartRows(start, 3, blank);
  return { key: `${start}:${blank}`, prompt: "수 배열표를 보고 □ 안에 알맞은 수를 써넣으세요.", visual: { kind: "table", header: rows[0], rows: rows.slice(1) }, answer: blank, hint: "오른쪽으로 1씩, 아래쪽으로 10씩 커져요.", explanation: `□ = ${blank}` };
});
export const chartBelow = gen("l1-chart-below", 2, (rand) => {
  const n = randInt(rand, 1, 79);
  const k = randInt(rand, 1, 2);
  const ans = n + 10 * k;
  const from = n - ((n - 1) % 10);
  return {
    key: `${n}:${k}`,
    prompt: `수 배열표의 일부입니다. 색칠한 ${n}에서 아래로 ${k}칸 내려간 ?에 알맞은 수를 쓰세요.`,
    // 첫 줄만 수를 보여 주고 아래 줄은 비워, 아래로 한 칸에 10씩 커지는 규칙을 쓰게 한다
    visual: chartScene(from, k + 1, [n], [ans], (x) => x >= from + 10 && x !== ans),
    answer: ans,
    hint: "수 배열표에서 아래로 한 칸 내려가면 10 커져요.",
    explanation: `${n} → ${Array.from({ length: k }, (_, i) => n + 10 * (i + 1)).join(" → ")}`,
    mistakes: { [n + k]: "오른쪽으로 움직였어요." },
  };
});
export const chartColor = gen("l1-chart-color", 2, (rand) => {
  const step = pick(rand, [2, 3, 5, 9, 11]);
  const start = randInt(rand, 1, 20);
  const col = (x: number) => (x - 1) % 10;
  // ↘(11씩)·↙(9씩)은 배열표 끝을 넘지 않게
  if (step === 11 && col(start) > 5) return null;
  if (step === 9 && col(start) < 4) return null;
  const seq = Array.from({ length: 4 }, (_, i) => start + step * i);
  const next = start + step * 4;
  const from = start - col(start);
  return {
    key: `${start}:${step}`,
    prompt: "수 배열표(한 줄에 10칸)에서 규칙에 따라 색칠한 수만 써 두었습니다. 다음에 색칠할 칸 ?에 알맞은 수를 쓰세요.",
    // 모든 칸에 수가 있으면 ? 옆 칸으로 답이 보이므로 색칠한 수만 쓴다
    visual: chartScene(from, Math.floor((next - from) / 10) + 1, seq, [next], (x) => !seq.includes(x) && x !== next),
    answer: next,
    hint: "색칠한 수가 얼마씩 커지는지 보세요. 오른쪽으로 한 칸은 1, 아래로 한 칸은 10 커져요.",
    explanation: `${seq.join(", ")} → ${step}씩 커지므로 ${next}`,
  };
});
/**
 * 상: 색칠한 수와 같은 세로줄에서 범위 안의 수 세기. 경계를 10의 배수가 아니게 뽑고,
 * 같은 경계라도 세로줄(낱개의 수)에 따라 답이 달라지는 경우만 써서 색칠한 칸을 보아야 풀리게 한다
 */
export const chartCond = gen("l1-w-chart-cond", 3, (rand) => {
  const o = randInt(rand, 1, 9);
  const lo = randInt(rand, 2, 5) * 10 + randInt(rand, 1, 8);
  const hi = lo + randInt(rand, 2, 4) * 10 + randInt(rand, -3, 3);
  if (hi > 99 || hi % 10 === 0) return null;
  const column = (d: number) => range(0, 9).map((t) => t * 10 + d).filter((n) => n > lo && n < hi);
  if (new Set(range(1, 9).map((d) => column(d).length)).size < 2) return null;
  const colN = column(o);
  const ref = randInt(rand, 1, 9) * 10 + o;
  return {
    key: `${o}:${lo}:${hi}:${ref}`,
    prompt: `수 배열표에서 색칠한 수와 같은 세로줄에 있는 수 중에서 ${lo}보다 크고 ${hi}보다 작은 수는 모두 몇 개인가요?`,
    visual: chartScene(1, 10, [ref]),
    answer: colN.length,
    unit: "개",
    hint: "같은 세로줄에 있는 수는 낱개의 수(뒤의 숫자)가 같고, 아래로 갈수록 10씩 커져요.",
    explanation: `${colN.join(", ")} → ${colN.length}개`,
  };
});
/** 상: 시작 칸만 색칠한 수 배열표(1~60)를 보며 ↘·↓로 따라가기. 경로 칸은 칠하지 않는다(답이 보이지 않게) */
export const chartNth = gen("l1-w-chart-nth", 3, (rand) => {
  const diag = rand() < 0.5;
  const nth = randInt(rand, 4, 6);
  // ↘로 nth칸을 가려면 시작 칸이 오른쪽 끝에서 nth − 1칸 이상 떨어져 있어야 한다(줄을 넘기지 않게)
  const s = randInt(rand, 1, diag ? 11 - nth : 9);
  const step = diag ? 11 : 10;
  return {
    key: `${s}:${diag}:${nth}`,
    prompt: `수 배열표에서 색칠한 ${s}부터 시작하여 ${diag ? "오른쪽 아래(↘)" : "바로 아래(↓)"}로 한 칸씩 가며 색칠합니다. ${ord(nth)}로 색칠하는 수는 무엇인가요?`,
    visual: chartScene(1, 6, [s]),
    answer: s + step * (nth - 1),
    hint: diag ? "색칠한 칸에서 오른쪽 아래 칸으로 한 칸씩 짚어 가며 첫째, 둘째, …로 세어 보세요." : "색칠한 칸에서 아래 칸으로 한 칸씩 짚어 가며 첫째, 둘째, …로 세어 보세요.",
    explanation: Array.from({ length: nth }, (_, i) => s + step * i).join(", "),
  };
});

export const shapeToNum = gen("l1-shape-to-num", 1, (rand) => {
  const [a, b] = shuffle(rand, SYM).slice(0, 2);
  const unit = pick(rand, [[a, b], [a, b, b], [a, a, b]]);
  // 줄 길이를 바꿔 □ 자리에 a·b가 모두 오게 한다(늘 2번 되풀이 + 1개면 답이 언제나 1)
  const seq = Array.from({ length: unit.length * 2 + randInt(rand, 1, unit.length) }, (_, i) => unit[i % unit.length]);
  const code = (s: string) => (s === a ? 1 : 2);
  const last = seq.length - 1;
  return { key: `${a}${b}:${unit.join("")}:${seq.length}`, prompt: `${josa(a, "은/는")} 1, ${josa(b, "은/는")} 2로 나타냈습니다. □ 안에 알맞은 수를 써넣으세요.`, visual: rowScene(seq, "모양을 늘어놓은 그림"), expression: seq.map((s, i) => (i === last ? "□" : String(code(s)))).join(", "), answer: code(seq[last]), hint: "마지막 모양이 무엇인지 보세요.", explanation: seq.map(code).join(", ") };
});
export const numToShape = gen("l1-num-to-shape", 2, (rand) => {
  const [a, b, c] = shuffle(rand, SYM).slice(0, 3);
  const unit = pick(rand, [[1, 2], [1, 2, 2], [1, 1, 2], [1, 2, 3]]);
  const map: Record<number, string> = { 1: a, 2: b, 3: c };
  const nums = Array.from({ length: unit.length * 2 }, (_, i) => unit[i % unit.length]);
  const answer = nums.map((n) => map[n]).join(" ");
  const alt = nums.map((n) => map[n === 1 ? 2 : 1] ?? c).join(" ");
  // 수 배열에 3이 없으면 문제에 나오지 않은 모양(c)이 섞인 보기를 쓰지 않는다
  const used = new Set(nums.map((n) => map[n]));
  const wrongs = [alt, nums.map((n) => map[((n % 3) + 1)]).join(" "), [...nums].reverse().map((n) => map[n]).join(" "), nums.map((n) => map[n === 3 ? 1 : n]).slice(1).concat(map[1]).join(" ")];
  const choices = four(rand, answer, wrongs.filter((w) => w.split(" ").every((x) => used.has(x))));
  if (!choices) return null;
  return { key: `${a}${b}${c}:${unit.join("")}:${choices.join("|")}`, prompt: `1은 ${a}, 2는 ${josa(unit.includes(3) ? `${b}, 3은 ${c}` : b, "으로/로")} 나타내려고 합니다. 수 배열을 모양으로 바르게 나타낸 것을 고르세요.`, expression: nums.join(", "), answer, choices, hint: "수를 하나씩 모양으로 바꿔 보세요.", explanation: answer };
});
const MOVES = ["손뼉", "발 구르기", "만세", "무릎 치기"];
export const bodyPattern = gen("l1-body-pattern", 2, (rand) => {
  const [a, b] = shuffle(rand, MOVES).slice(0, 2);
  const unit = pick(rand, [[a, b], [a, b, b], [a, a, b]]);
  const n = randInt(rand, 5, 10);
  const answer = unit[(n - 1) % unit.length];
  return { key: `${unit.join()}:${n}`, prompt: `${unit.join(", ")}의 순서로 동작을 되풀이합니다. ${ord(n)} 동작은 무엇인가요?`, answer, choices: shuffle(rand, MOVES), hint: "되풀이되는 동작이 몇 개인지 세어요.", explanation: `${Array.from({ length: n }, (_, i) => unit[i % unit.length]).join(", ")} → ${ord(n)}는 ${answer}` };
});
/**
 * 상: 그림의 모양 줄을 같은 규칙으로 이어 놓을 때 다음 세 모양을 수로 나타내기 — 규칙 잇기(1단계) → 수로 바꾸기(2단계).
 * 줄의 첫 모양은 무작위(되풀이의 가운데에서 시작하기도 한다). id는 오답 기록을 지키려고 그대로 둔다
 */
export const codeSum = gen("l1-w-code-sum", 3, (rand) => {
  const [a, b, c] = shuffle(rand, SYM).slice(0, 3);
  const unit = pick(rand, [[a, b, c], [a, b, b, c], [a, a, b, c], [a, b, c, c]]);
  const off = randInt(rand, 0, unit.length - 1);
  const at = (i: number) => unit[(off + i) % unit.length];
  const shown = unit.length * 2;
  const seq = Array.from({ length: shown }, (_, i) => at(i));
  const code = (x: string) => (x === a ? 1 : x === b ? 2 : 3);
  const nums = (from: number) => [0, 1, 2].map((i) => code(at(from + i))).join(", ");
  const answer = nums(shown);
  const swapAB = [0, 1, 2].map((i) => ({ 1: 2, 2: 1, 3: 3 })[code(at(shown + i))]).join(", ");
  const choices = four(rand, answer, shuffle(rand, [nums(shown + 1), swapAB, nums(shown - 1), [0, 1, 2].map((i) => code(at(shown + 2 - i))).join(", ")]));
  if (!choices) return null;
  return {
    key: `${unit.join("")}:${off}:${choices.join("|")}`,
    prompt: `${josa(a, "은/는")} 1, ${josa(b, "은/는")} 2, ${josa(c, "은/는")} 3으로 나타내려고 합니다. 그림과 같은 규칙으로 모양을 이어서 놓을 때, 그림 다음에 놓을 모양 3개를 수로 바르게 나타낸 것을 고르세요.`,
    visual: tokensScene(seq, "세 가지 모양의 줄", { perRow: 13, tail: true }),
    answer,
    choices,
    hint: "먼저 되풀이되는 부분을 찾아 다음에 놓을 모양 3개를 알아내고, 그 모양을 수로 바꿔요.",
    explanation: `다음 모양: ${[0, 1, 2].map((i) => at(shown + i)).join(" ")} → ${answer}`,
  };
});
export const codeNth = gen("l1-w-code-nth", 3, (rand) => {
  const [a, b, c] = shuffle(rand, SYM).slice(0, 3);
  const unit = [a, b, c];
  const n = randInt(rand, 7, 10);
  const code = { [a]: 1, [b]: 2, [c]: 3 } as Record<string, number>;
  return {
    key: `${a}${b}${c}:${n}`,
    prompt: `${a} ${b} ${c} 모양이 되풀이되는 규칙을 ${josa(a, "은/는")} 1, ${josa(b, "은/는")} 2, ${josa(c, "은/는")} 3으로 나타냈습니다. 왼쪽에서 ${ord(n)}에 오는 수는 무엇인가요?`,
    answer: code[unit[(n - 1) % 3]],
    hint: "1, 2, 3이 되풀이돼요. 3개씩 묶어 세어 보세요.",
    explanation: `${Array.from({ length: n }, (_, i) => i % 3 + 1).join(", ")} → ${ord(n)}는 ${code[unit[(n - 1) % 3]]}`,
  };
});

export const pt = {
  countOn: ex(V4, "number-pattern", "e1-count-on"),
  fifthNumber: ex(V4, "number-pattern", "w1-fifth-number"),
};

