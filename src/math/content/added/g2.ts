import type { WordMap } from "../words/word";
import { pick, randInt, shuffle } from "../../lib/random";
import { josa, NAMES, opts } from "../lessons/g2";
import { barsScene, cardsScene, clock2, MARKS, easy, figuresScene, graphScene, mid, rulerScene, word, WEEK, MONTH_DAYS, type Card, type FigKind } from "../lessons/g2-pics";

/*
 * 2학년 단원마다 하·중·상 하나씩 더한 생성기(2026-10-04).
 * 도형·측정·그래프 단원은 차시의 그림 문제 비율(절반 이상)을 지키도록 그림을 붙이거나 여유 있는 차시에 넣는다.
 */

const fmtM = (cm: number) => (cm % 100 ? `${Math.floor(cm / 100)} m ${cm % 100} cm` : `${cm / 100} m`);

/* ═══ 2-1 1단원 세 자리 수 ═══ */

/** 하: 100씩 거꾸로 뛰어 세기 */
const skipBack100 = easy("a2-skip-back100", (rand) => {
  const n = randInt(rand, 2, 4);
  const x = randInt(rand, 100 * n + 100, 999);
  const ans = x - 100 * n;
  return {
    key: `${x}:${n}`,
    prompt: `${x}에서 100씩 거꾸로 ${n}번 뛰어 센 수는 얼마인가요?`,
    answer: ans,
    hint: "100씩 거꾸로 뛰어 세면 백의 자리 숫자가 1씩 작아져요.",
    explanation: `${[0, 1, 2, 3, 4].slice(0, n + 1).map((i) => x - 100 * i).join(" – ")} → ${ans}`,
    mistakes: { [x - 10 * n]: "10씩 뛰어 세었어요.", [x + 100 * n]: "거꾸로가 아니라 앞으로 뛰어 세었어요." },
  };
});

/** 중: 10원짜리가 10개보다 많을 때 모두 얼마인지(10이 10개면 100) */
const coinsRegroup3 = mid("a2-coins-regroup3", (rand) => {
  const a = randInt(rand, 1, 7);
  const b = randInt(rand, 11, 19);
  const total = 100 * a + 10 * b;
  if (total > 990) return null;
  const name = pick(rand, NAMES);
  return {
    key: `${a}:${b}`,
    prompt: `${josa(name, "은/는")} 100원짜리 동전 ${a}개와 10원짜리 동전 ${b}개를 가지고 있습니다. ${josa(name, "이/가")} 가진 돈은 모두 얼마인가요?`,
    answer: total,
    unit: "원",
    hint: "10원짜리 10개는 100원이에요. 10원짜리를 100원과 나머지로 나누어 보세요.",
    explanation: `10원짜리 ${b}개 = ${100 + 10 * (b - 10)}원, 100원짜리 ${a}개 = ${100 * a}원 → 100이 ${a + 1}개, 10이 ${b - 10}개 → ${total}원`,
    mistakes: { [100 * a + b]: "10원짜리 개수를 일의 자리에 썼어요." },
  };
});

/** 상: 백·일의 자리가 정해진 세 자리 수 중 기준보다 큰 수의 개수 */
const condCount3 = word("a2-cond-count3", (rand) => {
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, 0, 9);
  const t = randInt(rand, 1, 8);
  let u = randInt(rand, 0, 9);
  if (u === b) u = (u + 1) % 10;
  const x = 100 * a + 10 * t + u;
  const nums = Array.from({ length: 10 }, (_, d) => 100 * a + 10 * d + b).filter((n) => n > x);
  return {
    key: `${a}:${b}:${x}`,
    prompt: `백의 자리 숫자가 ${a}, 일의 자리 숫자가 ${b}인 세 자리 수가 있습니다. 이 중에서 ${x}보다 큰 수는 모두 몇 개인가요?`,
    answer: nums.length,
    unit: "개",
    hint: `백의 자리 숫자가 같으니 십의 자리 숫자를 비교해요. 십의 자리 숫자가 ${josa(t, "과/와")} 같을 때는 일의 자리까지 비교해요.`,
    explanation: `${nums.join(", ")} → ${nums.length}개`,
    mistakes: { [9 - t]: `십의 자리 숫자가 ${t}인 수를 빠뜨리거나 잘못 셌어요.` },
  };
});

/* ═══ 2-1 2단원 여러 가지 도형 ═══ */

const STRAIGHT: FigKind[] = ["삼각형", "사각형", "오각형", "육각형"];
const ROUND: FigKind[] = ["원", "타원"];

/** 하(원 차시): 곧은 선으로만 둘러싸인 도형의 수 */
const straightCount = easy("a2-straight-count", (rand) => {
  const nStraight = randInt(rand, 2, 5);
  const nRound = randInt(rand, 2, 8 - nStraight);
  const kinds = shuffle(rand, [...Array.from({ length: nStraight }, () => pick(rand, STRAIGHT)), ...Array.from({ length: nRound }, () => pick(rand, ROUND))]);
  return {
    key: kinds.join(","),
    prompt: "그림에서 곧은 선으로만 둘러싸인 도형은 모두 몇 개인가요?",
    visual: figuresScene(rand, kinds, `여러 가지 도형 ${kinds.length}개`, 4),
    answer: nStraight,
    unit: "개",
    hint: "원처럼 굽은 선이 있는 도형은 빼고, 곧은 선으로만 둘러싸인 도형을 세어요.",
    explanation: `${kinds.map((k, i) => (STRAIGHT.includes(k) ? MARKS[i] : "")).filter(Boolean).join(", ")} → ${nStraight}개`,
    mistakes: { [nRound]: "굽은 선이 있는 도형을 세었어요.", [kinds.length]: "모든 도형을 세었어요." },
  };
});

/** 중: 그림에서 육각형은 오각형보다 몇 개 더 많은지 */
const hexMorePent = mid("a2-hex-more-pent", (rand) => {
  const p = randInt(rand, 1, 3);
  const h = randInt(rand, p + 1, 5);
  if (p + h > 7) return null;
  const others = randInt(rand, 1, 8 - p - h);
  const kinds = shuffle(rand, [
    ...Array.from({ length: p }, (): FigKind => "오각형"),
    ...Array.from({ length: h }, (): FigKind => "육각형"),
    ...Array.from({ length: others }, () => pick(rand, ["삼각형", "사각형"] as FigKind[])),
  ]);
  return {
    key: kinds.join(","),
    prompt: "그림에서 육각형은 오각형보다 몇 개 더 많은가요?",
    visual: figuresScene(rand, kinds, `여러 가지 도형 ${kinds.length}개`, 4),
    answer: h - p,
    unit: "개",
    hint: "변이 5개인 도형과 6개인 도형을 따로 세어 보세요.",
    explanation: `육각형 ${h}개, 오각형 ${p}개 → ${h} − ${p} = ${h - p}(개)`,
    mistakes: { [h]: "육각형의 수만 세었어요.", [h + p]: "두 도형의 수를 더했어요." },
  };
});

/** 상: 꼭짓점 수 조건으로 도형 이름 맞히기 */
const polyByClue = word("a2-poly-by-clue", (rand) => {
  const NAMES_BY_N: Record<number, string> = { 3: "삼각형", 4: "사각형", 5: "오각형", 6: "육각형" };
  const base = randInt(rand, 3, 5);
  const more = randInt(rand, 1, 6 - base);
  const n = base + more;
  const answer = NAMES_BY_N[n];
  const choices = opts(rand, answer, Object.values(NAMES_BY_N).filter((x) => x !== answer));
  if (!choices) return null;
  return {
    key: `${base}:${more}`,
    prompt: `어떤 도형은 곧은 선으로만 둘러싸여 있고, 꼭짓점이 ${NAMES_BY_N[base]}보다 ${more}개 더 많습니다. 이 도형의 이름을 고르세요.`,
    choices,
    answer,
    hint: `${NAMES_BY_N[base]}의 꼭짓점은 ${base}개예요. 꼭짓점의 수와 변의 수는 같아요.`,
    explanation: `꼭짓점 ${base} + ${more} = ${n}(개) → 변도 ${n}개 → ${answer}`,
    mistakes: { [NAMES_BY_N[base]]: "기준 도형을 그대로 골랐어요." },
  };
});

/* ═══ 2-1 3단원 덧셈과 뺄셈 ═══ */

/** 하: 가장 큰 수와 가장 작은 수의 합(받아올림) */
const addMaxMin = easy("a2-add-max-min", (rand) => {
  const nums = shuffle(rand, [randInt(rand, 41, 69), randInt(rand, 21, 39), randInt(rand, 11, 19)]);
  const big = Math.max(...nums);
  const small = Math.min(...nums);
  if ((big % 10) + (small % 10) < 10 || big + small > 99) return null;
  return {
    key: nums.join(","),
    prompt: `세 수 ${nums.join(", ")} 중에서 가장 큰 수와 가장 작은 수의 합을 구하세요.`,
    answer: big + small,
    hint: "십의 자리 숫자를 비교해 가장 큰 수와 가장 작은 수를 찾은 뒤 더해요. 일의 자리에서 받아올림이 있어요.",
    explanation: `가장 큰 수 ${big}, 가장 작은 수 ${small} → ${big} + ${small} = ${big + small}`,
    mistakes: { [big + small - 10]: "받아올린 1을 더하지 않았어요." },
  };
});

/** 중: 받아내림이 있는 뺄셈식 중 계산 결과가 가장 큰 것 */
const subBiggest = mid("a2-sub-biggest", (rand) => {
  const exprs: { a: number; b: number }[] = [];
  for (let i = 0; exprs.length < 4 && i < 60; i++) {
    const a = randInt(rand, 41, 95);
    const b = randInt(rand, 12, a - 10);
    if (a % 10 >= b % 10) continue;
    if (exprs.some((e) => e.a - e.b === a - b)) continue;
    exprs.push({ a, b });
  }
  if (exprs.length < 4) return null;
  const best = exprs.reduce((m, e) => (e.a - e.b > m.a - m.b ? e : m));
  const text = (e: { a: number; b: number }) => `${e.a} − ${e.b}`;
  return {
    key: exprs.map(text).join(","),
    prompt: "계산 결과가 가장 큰 것을 고르세요.",
    choices: exprs.map(text),
    answer: text(best),
    hint: "하나씩 계산해 보세요. 일의 자리끼리 뺄 수 없으면 십의 자리에서 10을 받아내려요.",
    explanation: exprs.map((e) => `${text(e)} = ${e.a - e.b}`).join(", ") + ` → 가장 큰 것은 ${text(best)}`,
  };
});

/** 상: 두 수를 더하고 남은 수를 뺀 결과가 가장 크게 */
const threeBest = word("a2-three-best", (rand) => {
  const a = randInt(rand, 11, 29);
  const b = randInt(rand, 30, 49);
  const c = randInt(rand, 30, 49);
  if (b === c || b + c > 99) return null;
  const nums = shuffle(rand, [a, b, c]);
  const sorted = [...nums].sort((x, y) => y - x);
  const sum = sorted[0] + sorted[1];
  const ans = sum - sorted[2];
  return {
    key: nums.join(","),
    prompt: `세 수 ${nums.join(", ")} 중에서 두 수를 골라 더한 다음, 남은 한 수를 빼려고 합니다. 계산 결과가 가장 크게 되도록 할 때 그 결과는 얼마인가요?`,
    answer: ans,
    hint: "가장 크게 되려면 큰 두 수를 더하고 가장 작은 수를 빼야 해요.",
    explanation: `${sorted[0]} + ${sorted[1]} = ${sum}, ${sum} − ${sorted[2]} = ${ans}`,
    mistakes: { [sum]: "남은 수를 빼지 않았어요." },
  };
});

/* ═══ 2-1 4단원 길이 재기 ═══ */

/** 하: 자의 0에 맞춘 두 막대의 길이 차 */
const rulerDiff0 = easy("a2-ruler-diff0", (rand) => {
  const a = randInt(rand, 3, 11);
  let b = randInt(rand, 2, 10);
  if (b === a) b = a - 1;
  const [long, short] = a > b ? ["㉮", "㉯"] : ["㉯", "㉮"];
  return {
    key: `${a}:${b}`,
    prompt: `자의 눈금 0에 맞추어 놓은 두 막대 ㉮와 ㉯가 있습니다. ${long}는 ${short}보다 몇 cm 더 긴가요?`,
    visual: rulerScene([{ start: 0, end: a, name: "㉮" }, { start: 0, end: b, name: "㉯" }], "자 위의 막대 ㉮와 ㉯"),
    answer: Math.abs(a - b),
    unit: "cm",
    hint: "두 막대의 오른쪽 끝 눈금을 읽고 차를 구해요.",
    explanation: `㉮ ${a} cm, ㉯ ${b} cm → ${Math.max(a, b)} − ${Math.min(a, b)} = ${Math.abs(a - b)}(cm)`,
    mistakes: { [Math.max(a, b)]: "긴 막대의 길이를 썼어요." },
  };
});

/** 중: 자 위의 테이프와 같은 길이를 한 장 더 이은 길이 */
const rulerDouble = mid("a2-ruler-double", (rand) => {
  const s = randInt(rand, 1, 5);
  const e = randInt(rand, s + 2, Math.min(12, s + 6));
  const len = e - s;
  return {
    key: `${s}:${e}`,
    prompt: "자 위에 색 테이프가 놓여 있습니다. 이 색 테이프와 길이가 같은 색 테이프 2장을 겹치지 않게 길게 이으면 모두 몇 cm인가요?",
    visual: rulerScene([{ start: s, end: e }], "자 위의 색 테이프"),
    answer: len + len,
    unit: "cm",
    hint: "먼저 색 테이프 한 장의 길이를 구해요. 시작 눈금이 0이 아니에요.",
    explanation: `한 장: ${e} − ${s} = ${len}(cm), 두 장: ${len} + ${len} = ${len + len}(cm)`,
    mistakes: { [e + e]: "끝 눈금을 길이로 읽었어요.", [len]: "한 장의 길이만 구했어요." },
  };
});

/** 상: 부러진 자로 잰 길이와 비교 */
const brokenRuler = word("a2-broken-ruler", (rand) => {
  const s = randInt(rand, 2, 6);
  const e = randInt(rand, s + 5, 15);
  const more = randInt(rand, 2, 6);
  const name = pick(rand, NAMES);
  const len = e - s;
  return {
    key: `${s}:${e}:${more}`,
    prompt: `부러진 자로 연필의 길이를 재었더니 한쪽 끝은 눈금 ${s}에, 다른 쪽 끝은 눈금 ${e}에 있었습니다. ${name}의 크레파스는 이 연필보다 ${more} cm 더 깁니다. 크레파스의 길이는 몇 cm인가요?`,
    answer: len + more,
    unit: "cm",
    hint: "연필의 길이는 1 cm가 몇 번 들어가는지로 구해요. 끝 눈금을 그대로 읽으면 안 돼요.",
    explanation: `연필: ${e} − ${s} = ${len}(cm), 크레파스: ${len} + ${more} = ${len + more}(cm)`,
    mistakes: { [e + more]: "끝 눈금을 연필의 길이로 보았어요." },
  };
});

/* ═══ 2-1 5단원 분류하기 ═══ */

const COND = [
  { name: "색칠한 카드", ok: (c: Card) => c.fill },
  { name: "색칠하지 않은 카드", ok: (c: Card) => !c.fill },
  { name: "큰 카드", ok: (c: Card) => c.big },
  { name: "작은 카드", ok: (c: Card) => !c.big },
];

function randomCards(rand: () => number, n: number): Card[] {
  return Array.from({ length: n }, () => ({ shape: pick(rand, ["삼각형", "사각형", "원"] as const), fill: rand() < 0.5, big: rand() < 0.5 }));
}

/** 하: 한 가지 기준으로 센 카드 수 */
const cardsOne = easy("a2-cards-one", (rand) => {
  const cards = randomCards(rand, randInt(rand, 7, 10));
  const cond = pick(rand, COND);
  const n = cards.filter(cond.ok).length;
  if (n < 2 || n === cards.length) return null;
  return {
    key: `${cards.map((c) => `${c.shape}${+c.fill}${+c.big}`).join(",")}:${cond.name}`,
    prompt: `그림의 카드를 분류하려고 합니다. ${josa(cond.name, "은/는")} 모두 몇 장인가요?`,
    visual: cardsScene(cards, `분류할 카드 ${cards.length}장`, 5),
    answer: n,
    unit: "장",
    hint: "센 카드에 / 표시를 하며 빠뜨리거나 두 번 세지 않게 세어요.",
    explanation: `${cards.map((c, i) => (cond.ok(c) ? i + 1 : 0)).filter(Boolean).join(", ")}번 → ${n}장`,
    mistakes: { [cards.length - n]: "반대 기준의 카드를 세었어요." },
  };
});

/** 중: 두 기준을 함께 만족하는 카드 수 */
const cardsTwo = mid("a2-cards-two", (rand) => {
  const cards = randomCards(rand, randInt(rand, 8, 10));
  const fill = rand() < 0.5;
  const big = rand() < 0.5;
  const ok = (c: Card) => c.fill === fill && c.big === big;
  const n = cards.filter(ok).length;
  const onlyOne = cards.filter((c) => c.fill === fill).length;
  if (n < 1 || onlyOne === n) return null;
  const label = `${big ? "큰" : "작은"} 카드 중에서 ${fill ? "색칠한" : "색칠하지 않은"} 카드`;
  return {
    key: `${cards.map((c) => `${c.shape}${+c.fill}${+c.big}`).join(",")}:${fill}:${big}`,
    prompt: `그림에서 ${josa(label, "은/는")} 모두 몇 장인가요?`,
    visual: cardsScene(cards, `분류할 카드 ${cards.length}장`, 5),
    answer: n,
    unit: "장",
    hint: `먼저 ${big ? "큰" : "작은"} 카드만 고른 다음, 그중에서 ${fill ? "색칠한" : "색칠하지 않은"} 카드를 세어요.`,
    explanation: `${cards.map((c, i) => (ok(c) ? i + 1 : 0)).filter(Boolean).join(", ")}번 → ${n}장`,
    mistakes: { [onlyOne]: "크기를 보지 않고 색칠만 보고 세었어요." },
  };
});

/** 상: 분류 결과에서 남은 수를 구해 비교 */
const sortRest = word("a2-sort-rest", (rand) => {
  const red = randInt(rand, 3, 8);
  const blue = randInt(rand, 2, 6);
  const yellow = randInt(rand, blue + 1, blue + 6);
  const total = red + blue + yellow;
  const name = pick(rand, NAMES);
  return {
    key: `${red}:${blue}:${yellow}`,
    prompt: `${josa(name, "은/는")} 색연필 ${total}자루를 색깔에 따라 빨간색, 파란색, 노란색으로 분류했습니다. 빨간색이 ${red}자루, 파란색이 ${blue}자루이고 나머지는 노란색입니다. 노란색은 파란색보다 몇 자루 더 많은가요?`,
    answer: yellow - blue,
    unit: "자루",
    hint: "먼저 노란색 색연필의 수를 구해요.",
    explanation: `노란색: ${total} − ${red} − ${blue} = ${yellow}(자루), ${yellow} − ${blue} = ${yellow - blue}(자루)`,
    mistakes: { [yellow]: "노란색의 수만 구했어요." },
  };
});

/* ═══ 2-1 6단원 곱셈 ═══ */

/** 하(곱셈식 차시): 곱셈식을 덧셈식으로 계산 */
const mulByAdd = easy("a2-mul-by-add", (rand) => {
  const a = randInt(rand, 2, 5);
  const b = randInt(rand, 2, 5);
  return {
    key: `${a}:${b}`,
    prompt: `${a} × ${josa(b, "을/를")} 덧셈식으로 바꾸어 계산하면 얼마인가요?`,
    answer: a * b,
    hint: `${a} × ${josa(b, "은/는")} ${josa(a, "을/를")} ${b}번 더한 것과 같아요.`,
    explanation: `${Array.from({ length: b }, () => a).join(" + ")} = ${a * b}`,
    mistakes: { [a + b]: "두 수를 더했어요." },
  };
});

/** 중(몇의 몇 배 차시): 몇은 몇의 몇 배인가 */
const timesOfWhich = mid("a2-times-of-which", (rand) => {
  const b = randInt(rand, 2, 5);
  const k = randInt(rand, 2, 5);
  const a = b * k;
  return {
    key: `${a}:${b}`,
    prompt: `${josa(a, "은/는")} ${b}의 몇 배인가요?`,
    answer: k,
    unit: "배",
    hint: `${josa(b, "을/를")} 몇 번 더하면 ${josa(a, "이/가")} 되는지 세어 보세요.`,
    explanation: `${Array.from({ length: k }, () => b).join(" + ")} = ${a} → ${b}의 ${k}배`,
    mistakes: { [a - b]: "두 수의 차를 구했어요." },
  };
});

/** 상: 묶음과 낱개 — 곱셈식과 덧셈을 차례로 */
const bagsPlus = word("a2-bags-plus", (rand) => {
  const a = randInt(rand, 2, 5);
  const b = randInt(rand, 2, 5);
  const c = randInt(rand, 1, 9);
  const name = pick(rand, NAMES);
  const p = a * b;
  return {
    key: `${a}:${b}:${c}`,
    prompt: `${josa(name, "은/는")} 한 봉지에 ${a}개씩 들어 있는 사탕 ${b}봉지와 낱개 사탕 ${c}개를 가지고 있습니다. ${josa(name, "이/가")} 가진 사탕은 모두 몇 개인지 곱셈식을 이용하여 구하세요.`,
    answer: p + c,
    unit: "개",
    hint: "봉지에 든 사탕 수를 곱셈식으로 먼저 구한 뒤, 낱개를 더해요.",
    explanation: `봉지에 든 사탕: ${a} × ${b} = ${p}(개), 모두: ${p} + ${c} = ${p + c}(개)`,
    mistakes: { [p]: "낱개 사탕을 더하지 않았어요." },
  };
});

/* ═══ 2-2 1단원 네 자리 수 ═══ */

/** 하: 1000씩 거꾸로 뛰어 세기 */
const skipBack1000 = easy("a2-skip-back1000", (rand) => {
  const n = randInt(rand, 2, 4);
  const x = randInt(rand, 1000 * n + 1000, 9999);
  const ans = x - 1000 * n;
  return {
    key: `${x}:${n}`,
    prompt: `${x}에서 1000씩 거꾸로 ${n}번 뛰어 센 수는 얼마인가요?`,
    answer: ans,
    hint: "1000씩 거꾸로 뛰어 세면 천의 자리 숫자가 1씩 작아져요.",
    explanation: `${[0, 1, 2, 3, 4].slice(0, n + 1).map((i) => x - 1000 * i).join(" – ")} → ${ans}`,
    mistakes: { [x - 100 * n]: "100씩 뛰어 세었어요.", [x + 1000 * n]: "거꾸로가 아니라 앞으로 뛰어 세었어요." },
  };
});

/** 중: 100원짜리가 10개보다 많을 때 모두 얼마인지 */
const coinsRegroup4 = mid("a2-coins-regroup4", (rand) => {
  const a = randInt(rand, 1, 7);
  const b = randInt(rand, 11, 19);
  const c = randInt(rand, 1, 9);
  const total = 1000 * a + 100 * b + 10 * c;
  if (total > 9990) return null;
  const name = pick(rand, NAMES);
  return {
    key: `${a}:${b}:${c}`,
    prompt: `${josa(name, "은/는")} 1000원짜리 지폐 ${a}장, 100원짜리 동전 ${b}개, 10원짜리 동전 ${c}개를 가지고 있습니다. 모두 얼마인가요?`,
    answer: total,
    unit: "원",
    hint: "100원짜리 10개는 1000원이에요.",
    explanation: `100원짜리 ${b}개 = 1000원과 ${100 * (b - 10)}원 → 1000이 ${a + 1}개, 100이 ${b - 10}개, 10이 ${c}개 → ${total}원`,
    mistakes: { [1000 * a + 10 * b + c]: "100원짜리 개수를 십의 자리에 썼어요." },
  };
});

/** 상: 천·백·일의 자리가 정해진 네 자리 수 중 기준보다 작은 수의 개수 */
const condCount4 = word("a2-cond-count4", (rand) => {
  const a = randInt(rand, 1, 9);
  const b = randInt(rand, 0, 9);
  const c = randInt(rand, 0, 9);
  const t = randInt(rand, 1, 8);
  let u = randInt(rand, 0, 9);
  if (u === c) u = (u + 1) % 10;
  const x = 1000 * a + 100 * b + 10 * t + u;
  const nums = Array.from({ length: 10 }, (_, d) => 1000 * a + 100 * b + 10 * d + c).filter((n) => n < x);
  return {
    key: `${a}${b}${c}:${x}`,
    prompt: `천의 자리 숫자가 ${a}, 백의 자리 숫자가 ${b}, 일의 자리 숫자가 ${c}인 네 자리 수가 있습니다. 이 중에서 ${x}보다 작은 수는 모두 몇 개인가요?`,
    answer: nums.length,
    unit: "개",
    hint: "천의 자리와 백의 자리 숫자가 같으니 십의 자리 숫자부터 비교해요.",
    explanation: `${nums.join(", ")} → ${nums.length}개`,
    mistakes: { [t]: "십의 자리 숫자가 같은 수를 빠뜨리거나 잘못 셌어요." },
  };
});

/* ═══ 2-2 2단원 곱셈구구 ═══ */

/** 하(곱셈표 차시): 곱이 같은 곱셈식(곱하는 두 수의 순서 바꾸기) */
const sameProduct = easy("a2-same-product", (rand) => {
  const a = randInt(rand, 2, 9);
  let b = randInt(rand, 2, 9);
  if (b === a) b = a === 9 ? 8 : a + 1;
  const p = a * b;
  const cand = [`${a} × ${b + 1}`, `${a + 1} × ${b}`, `${a} × ${b - 1}`, `${a - 1} × ${b}`, `${b} × ${b}`, `${a} × ${a}`].filter((e) => {
    const [x, y] = e.split(" × ").map(Number);
    return x >= 1 && y >= 1 && x <= 9 && y <= 9 && x * y !== p;
  });
  const choices = opts(rand, `${b} × ${a}`, shuffle(rand, cand));
  if (!choices) return null;
  return {
    key: `${a}:${b}`,
    prompt: `${a} × ${josa(b, "과/와")} 곱이 같은 곱셈식을 고르세요.`,
    choices,
    answer: `${b} × ${a}`,
    hint: "곱셈표에서 곱하는 두 수의 순서를 바꾸어도 곱은 같아요.",
    explanation: `${a} × ${b} = ${p}, ${b} × ${a} = ${p}`,
  };
});

/** 중: 어떤 단에서 곱이 두 수 사이인 것의 개수 */
const ttBetween = mid("a2-tt-between", (rand) => {
  const k = randInt(rand, 3, 9);
  const lo = randInt(rand, 5, 4 * k);
  const hi = randInt(rand, lo + k + 1, Math.min(9 * k + 5, lo + 5 * k));
  const hits = Array.from({ length: 9 }, (_, i) => k * (i + 1)).filter((x) => x > lo && x < hi);
  if (hits.length < 2 || hits.includes(lo) || hits.includes(hi)) return null;
  if ([lo, hi].some((x) => x % k === 0)) return null;
  return {
    key: `${k}:${lo}:${hi}`,
    prompt: `${k}단 곱셈구구(${k} × 1부터 ${k} × 9까지)의 곱 중에서 ${lo}보다 크고 ${hi}보다 작은 수는 모두 몇 개인가요?`,
    answer: hits.length,
    unit: "개",
    hint: `${k}단의 곱을 차례로 써 보세요: ${k}, ${2 * k}, ${3 * k}, …`,
    explanation: `${hits.join(", ")} → ${hits.length}개`,
  };
});

/** 상: 곱셈구구 두 번과 덧셈 */
const flowersTwo = word("a2-flowers-two", (rand) => {
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, 2, 9);
  const c = randInt(rand, 2, 9);
  const d = randInt(rand, 2, 9);
  if (a === c && b === d) return null;
  const name = pick(rand, NAMES);
  return {
    key: `${a}:${b}:${c}:${d}`,
    prompt: `${josa(name, "은/는")} 꽃병 ${a}개에 장미를 ${b}송이씩 꽂고, 튤립을 ${c}송이씩 묶은 꽃다발 ${d}개를 만들었습니다. ${josa(name, "이/가")} 사용한 꽃은 모두 몇 송이인가요?`,
    answer: a * b + c * d,
    unit: "송이",
    hint: "장미의 수와 튤립의 수를 각각 곱셈구구로 구한 다음 더해요.",
    explanation: `장미: ${a} × ${b} = ${a * b}(송이), 튤립: ${c} × ${d} = ${c * d}(송이), 모두: ${a * b} + ${c * d} = ${a * b + c * d}(송이)`,
    mistakes: { [a * b]: "튤립을 빠뜨렸어요.", [a + b + c + d]: "곱하지 않고 모두 더했어요." },
  };
});

/* ═══ 2-2 3단원 길이 재기(m) ═══ */

/** 하(길이의 차 차시): 두 끈의 길이 차(그림) */
const mDiffBars = easy("a2-m-diff-bars", (rand) => {
  const am = randInt(rand, 2, 5);
  const acm = randInt(rand, 30, 90);
  const bm = randInt(rand, 1, am - 1);
  const bcm = randInt(rand, 10, acm - 1);
  const a = am * 100 + acm;
  const b = bm * 100 + bcm;
  const d = a - b;
  if (d % 100 === 0) return null;
  return {
    key: `${a}:${b}`,
    prompt: "그림을 보고 빨간 끈은 파란 끈보다 몇 m 몇 cm 더 긴지 구하세요.",
    visual: barsScene([[{ from: 0, to: a / 4, text: fmtM(a), name: "빨강" }], [{ from: 0, to: b / 4, text: fmtM(b), name: "파랑" }]], "빨간 끈과 파란 끈", { scale: 0.5 }),
    answer: `${Math.floor(d / 100)},${d % 100}`,
    unit: ["m", "cm"],
    hint: "m는 m끼리, cm는 cm끼리 빼요.",
    explanation: `${fmtM(a)} − ${fmtM(b)} = ${fmtM(d)}`,
  };
});

/** 중(줄자 차시): 눈금 0이 아닌 곳부터 잰 길이 */
const tapeFromNonzero = mid("a2-tape-nonzero", (rand) => {
  const s = randInt(rand, 1, 4) * 10;
  const e = randInt(rand, 13, 28) * 10 + randInt(rand, 1, 9);
  const len = e - s;
  if (len < 100 || len % 100 === 0) return null;
  return {
    key: `${s}:${e}`,
    prompt: `줄자로 칠판의 길이를 재었더니 칠판의 한쪽 끝이 줄자의 눈금 ${s}에, 다른 쪽 끝이 눈금 ${e}에 있었습니다. 칠판의 길이는 몇 m 몇 cm인가요?`,
    answer: `${Math.floor(len / 100)},${len % 100}`,
    unit: ["m", "cm"],
    hint: "눈금 0에서 시작하지 않았으니 끝 눈금에서 시작 눈금을 빼요. 100 cm는 1 m예요.",
    explanation: `${e} − ${s} = ${len}(cm) = ${fmtM(len)}`,
    mistakes: { [`${Math.floor(e / 100)},${e % 100}`]: "끝 눈금을 그대로 길이로 읽었어요." },
  };
});

/** 상(길이의 합 차시): 세 끈을 이은 길이(그림) */
const mThreeSum = word("a2-m-three-sum", (rand) => {
  const parts = [0, 1, 2].map(() => randInt(rand, 1, 2) * 100 + randInt(rand, 1, 3) * 10 + randInt(rand, 0, 9));
  const cmSum = parts.reduce((s, x) => s + (x % 100), 0);
  if (cmSum >= 100) return null;
  const total = parts.reduce((s, x) => s + x, 0);
  let x = 0;
  const bars = parts.map((p, i) => {
    const bar = { from: x * 0.6, to: (x + p) * 0.6, text: fmtM(p), fill: i % 2 === 0 };
    x += p;
    return bar;
  });
  return {
    key: parts.join(","),
    prompt: "그림과 같이 끈 세 개를 겹치지 않게 길게 이었습니다. 이은 끈의 전체 길이는 몇 m 몇 cm인가요?",
    visual: barsScene([bars], "끈 세 개를 이은 그림", { total: { from: 0, to: total * 0.6, text: "?" } }),
    answer: `${Math.floor(total / 100)},${total % 100}`,
    unit: ["m", "cm"],
    hint: "두 끈의 길이를 먼저 더하고, 그 결과에 나머지 끈의 길이를 더해요. m는 m끼리, cm는 cm끼리 더해요.",
    explanation: `${fmtM(parts[0])} + ${fmtM(parts[1])} = ${fmtM(parts[0] + parts[1])}, ${fmtM(parts[0] + parts[1])} + ${fmtM(parts[2])} = ${fmtM(total)}`,
  };
});

/* ═══ 2-2 4단원 시각과 시간 ═══ */

/** 하(5분 차시): 긴바늘이 가리키는 숫자 */
const clockHandNum = easy("a2-clock-hand-num", (rand) => {
  const h = randInt(rand, 1, 12);
  const k = randInt(rand, 1, 11);
  return {
    key: `${h}:${k}`,
    prompt: `그림의 시계에 짧은바늘만 그렸습니다. 이 시계가 ${h}시 ${k * 5}분을 나타내도록 긴바늘을 그리려면 긴바늘이 숫자 몇을 가리키게 해야 하나요?`,
    visual: clock2(h, k * 5, { minuteHand: false, label: "짧은바늘만 그린 시계" }),
    answer: k,
    hint: "긴바늘이 숫자 1을 가리키면 5분, 2를 가리키면 10분이에요.",
    explanation: `${k * 5}분 → 긴바늘은 숫자 ${k}`,
    mistakes: { [k * 5]: "분을 그대로 썼어요.", [h]: "짧은바늘이 가리키는 숫자를 읽었어요." },
  };
});

/** 중(걸린 시간 차시): 출발 시각과 걸린 시간으로 도착 시각 */
const arriveTime = mid("a2-arrive-time", (rand) => {
  const h = randInt(rand, 1, 9);
  const m = randInt(rand, 0, 6) * 5;
  const dh = randInt(rand, 1, 2);
  const dm = randInt(rand, 1, 5) * 5;
  const end = (h + dh) * 60 + m + dm;
  const eh = Math.floor(end / 60);
  const em = end % 60;
  if (eh > 11 || em === 0 || m + dm >= 60) return null;
  const name = pick(rand, NAMES);
  return {
    key: `${h}:${m}:${dh}:${dm}`,
    prompt: `${josa(name, "은/는")} 기차를 타고 ${h}시${m ? ` ${m}분` : ""}에 출발하여 ${dh}시간 ${dm}분 뒤에 도착했습니다. 도착한 시각은 몇 시 몇 분인가요?`,
    answer: `${eh},${em}`,
    unit: ["시", "분"],
    hint: `먼저 ${dh}시간 뒤의 시각을 구한 다음, ${dm}분을 더 지나요.`,
    explanation: `${h}시${m ? ` ${m}분` : ""}에서 ${dh}시간 뒤 ${h + dh}시${m ? ` ${m}분` : ""}, ${dm}분 뒤 ${eh}시 ${em}분`,
  };
});

/** 상(1분 차시): 긴바늘이 한 바퀴 돌고 작은 눈금 몇 칸 더 간 시각 */
const turnAndTicks = word("a2-turn-ticks", (rand) => {
  const h = randInt(rand, 1, 10);
  const m = randInt(rand, 1, 40);
  const k = randInt(rand, 2, 15);
  if (m % 5 === 0 || (m + k) % 5 === 0 || m + k >= 60) return null;
  return {
    key: `${h}:${m}:${k}`,
    prompt: `지금 시각은 ${h}시 ${m}분입니다. 시계의 긴바늘이 한 바퀴 돌고 나서 작은 눈금 ${k}칸을 더 가면 몇 시 몇 분이 되나요?`,
    answer: `${h + 1},${m + k}`,
    unit: ["시", "분"],
    hint: "긴바늘이 한 바퀴 돌면 60분, 곧 1시간이 지나요. 작은 눈금 한 칸은 1분이에요.",
    explanation: `한 바퀴: ${h}시 ${m}분 → ${h + 1}시 ${m}분, 작은 눈금 ${k}칸: ${k}분 뒤 → ${h + 1}시 ${m + k}분`,
    mistakes: { [`${h},${m + k}`]: "긴바늘이 한 바퀴 돈 1시간을 빠뜨렸어요." },
  };
});

/* ═══ 2-2 5단원 표와 그래프 ═══ */

const SPORTS = ["축구", "줄넘기", "피구", "달리기", "수영"];

/** 하(그래프 읽기 차시): 한 항목의 학생 수 읽기 */
const graphReadOne = easy("a2-graph-read-one", (rand) => {
  const kinds = shuffle(rand, SPORTS).slice(0, 4);
  const vals = kinds.map(() => randInt(rand, 1, 7));
  const i = randInt(rand, 0, 3);
  const dir = pick(rand, ["세로", "가로"] as const);
  return {
    key: `${kinds.join()}:${vals.join()}:${i}:${dir}`,
    prompt: `그래프를 보고 ${josa(kinds[i], "을/를")} 좋아하는 학생은 몇 명인지 쓰세요.`,
    visual: { ...graphScene(kinds, vals, { dir, max: 7 }), label: `좋아하는 운동별 학생 수를 ○로 나타낸 ${dir} 그래프` },
    answer: vals[i],
    unit: "명",
    hint: `${kinds[i]} 줄에 그린 ○의 수를 세어요.`,
    explanation: `${kinds[i]} 줄의 ○ ${vals[i]}개 → ${vals[i]}명`,
  };
});

/** 중(그래프 읽기 차시): 두 항목을 합친 학생 수 */
const graphTwoSum = mid("a2-graph-two-sum", (rand) => {
  const kinds = shuffle(rand, SPORTS).slice(0, 4);
  const vals = kinds.map(() => randInt(rand, 1, 7));
  const [i, j] = shuffle(rand, [0, 1, 2, 3]).slice(0, 2).sort();
  const dir = pick(rand, ["세로", "가로"] as const);
  return {
    key: `${kinds.join()}:${vals.join()}:${i}${j}:${dir}`,
    prompt: `그래프를 보고 ${josa(kinds[i], "과/와")} ${josa(kinds[j], "을/를")} 좋아하는 학생은 모두 몇 명인지 구하세요.`,
    visual: { ...graphScene(kinds, vals, { dir, max: 7 }), label: `좋아하는 운동별 학생 수를 ○로 나타낸 ${dir} 그래프` },
    answer: vals[i] + vals[j],
    unit: "명",
    hint: "두 줄의 ○를 각각 세어 더해요.",
    explanation: `${kinds[i]} ${vals[i]}명, ${kinds[j]} ${vals[j]}명 → ${vals[i]} + ${vals[j]} = ${vals[i] + vals[j]}(명)`,
  };
});

/** 상(그래프 그리기 차시): 표의 빈칸을 구해 그래프에 그릴 ○의 수 */
const graphMarks = word("a2-graph-marks", (rand) => {
  const kinds = shuffle(rand, SPORTS).slice(0, 4);
  const vals = kinds.map(() => randInt(rand, 1, 7));
  const total = vals.reduce((s, x) => s + x, 0);
  const q = randInt(rand, 0, 3);
  const known = vals.filter((_, i) => i !== q);
  return {
    key: `${kinds.join()}:${vals.join()}:${q}`,
    prompt: `반 학생 ${total}명이 좋아하는 운동을 조사하여 표로 나타냈습니다. 이 표를 보고 ○를 한 칸에 하나씩 그려 그래프로 나타낼 때, ${josa(kinds[q], "은/는")} ○를 몇 개 그려야 하나요?`,
    visual: { kind: "table", header: ["운동", ...kinds, "합계"], rows: [["학생 수(명)", ...vals.map((v, i) => (i === q ? "" : String(v))), String(total)]] },
    answer: vals[q],
    unit: "개",
    hint: "합계에서 나머지 운동의 학생 수를 빼서 빈칸을 먼저 구해요. 학생 한 명이 ○ 한 개예요.",
    explanation: `${total} − ${known.join(" − ")} = ${vals[q]}(명) → ○ ${vals[q]}개`,
  };
});

/* ═══ 2-2 6단원 규칙 찾기 ═══ */

/** 하(곱셈표 규칙 차시): 단의 수가 오른쪽으로 몇씩 커지는지 */
const mulRowStep = easy("a2-mul-row-step", (rand) => {
  const k = randInt(rand, 2, 9);
  const start = randInt(rand, 1, 5);
  const seq = [0, 1, 2, 3].map((i) => k * (start + i));
  return {
    key: `${k}:${start}`,
    prompt: `곱셈표의 ${k}단 가로줄에서 ${seq.join(", ")}처럼 수가 놓여 있습니다. 오른쪽으로 갈수록 몇씩 커지나요?`,
    answer: k,
    hint: "이웃한 두 수의 차를 구해 보세요.",
    explanation: `${seq[1]} − ${seq[0]} = ${k} → ${k}단은 ${k}씩 커져요.`,
  };
});

/** 중(덧셈표 규칙 차시): 오른쪽으로 몇 칸 간 칸의 수 */
const addTableMove = mid("a2-addtable-move", (rand) => {
  const r = randInt(rand, 1, 8);
  const c = randInt(rand, 1, 7);
  const k = randInt(rand, 2, 9 - c);
  if (k < 2) return null;
  return {
    key: `${r}:${c}:${k}`,
    prompt: `1부터 9까지의 수로 만든 덧셈표에서 세로줄의 ${josa(r, "과/와")} 가로줄의 ${josa(c, "이/가")} 만나는 칸의 수는 ${r + c}입니다. 이 칸에서 오른쪽으로 ${k}칸 간 곳의 수는 얼마인가요?`,
    answer: r + c + k,
    hint: "덧셈표에서 오른쪽으로 한 칸 갈 때마다 1씩 커져요.",
    explanation: `${r + c}에서 1씩 ${k}번 커짐 → ${r + c + k} (${r} + ${c + k} = ${r + c + k})`,
    mistakes: { [r + c + 2 * k]: "한 칸에 2씩 커진다고 보았어요." },
  };
});

/** 상(생활 속 규칙 차시): 같은 요일이 한 달에 몇 번 */
const weeklyCount = word("a2-weekly-count", (rand) => {
  const month = randInt(rand, 1, 12);
  const last = MONTH_DAYS[month - 1];
  const d = randInt(rand, 8, 21);
  const wd = randInt(rand, 1, 5);
  const days = Array.from({ length: last }, (_, i) => i + 1).filter((x) => (x - d) % 7 === 0);
  const name = pick(rand, NAMES);
  return {
    key: `${month}:${d}:${wd}`,
    prompt: `${josa(name, "은/는")} 매주 ${WEEK[wd]}마다 피아노 학원에 갑니다. ${month}월 ${d}일이 ${WEEK[wd]}일 때, ${josa(name, "이/가")} ${month}월에 피아노 학원에 가는 날은 모두 며칠인가요? (${month}월은 ${last}일까지 있습니다.)`,
    answer: days.length,
    unit: "일",
    hint: "같은 요일은 7일마다 돌아와요. 7씩 빼고 더해서 같은 요일인 날짜를 모두 찾아요.",
    explanation: `${days.join("일, ")}일 → ${days.length}일`,
  };
});

/** 2학년 단원마다 새로 더한 생성기(하·중·상 하나씩): 단원 id → 차시 id → 생성기 */
export const addedG2: WordMap = {
  "g2-s1-numbers3": { "skip-count3": [skipBack100], "place-value3": [coinsRegroup3], "compare-3": [condCount3] },
  "g2-s1-shapes": { circle2: [straightCount], "pentagon-hexagon": [hexMorePent, polyByClue] },
  "g2-s1-add-sub": { "add-2d-2d": [addMaxMin], "sub-2d-2d": [subBiggest], "three-numbers": [threeBest] },
  "g2-s1-length": { "ruler-measure": [rulerDiff0, rulerDouble, brokenRuler] },
  "g2-s1-classify": { "count-sorted": [cardsOne, cardsTwo], "sort-result": [sortRest] },
  "g2-s1-multiplication": { "mul-sentence": [mulByAdd], "times-of": [timesOfWhich], "mul-express": [bagsPlus] },
  "g2-s2-numbers4": { "skip-count4": [skipBack1000], "place-value4": [coinsRegroup4], "compare-4": [condCount4] },
  "g2-s2-times-tables": { "times-chart": [sameProduct], "tt-solve": [ttBetween, flowersTwo] },
  "g2-s2-length-m": { "length-sub": [mDiffBars], "tape-measure": [tapeFromNonzero], "length-add": [mThreeSum] },
  "g2-s2-time": { "clock-5min": [clockHandNum], "hour-elapsed": [arriveTime], "clock-1min": [turnAndTicks] },
  "g2-s2-table-graph": { "read-graph": [graphReadOne, graphTwoSum], "draw-graph": [graphMarks] },
  "g2-s2-patterns": { "mul-table-rule": [mulRowStep], "add-table-rule": [addTableMove], "pattern-life": [weeklyCount] },
};
