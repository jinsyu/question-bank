import { pick, randInt, shuffle } from "../../lib/random";
import { word, type WordMap } from "./word";
import { josa } from "../josa";
import { ord } from "../ordinal";

/** 조사(는·가)가 자연스럽도록 받침 없는 이름만 쓴다 */
const NAMES = ["지우", "서아", "수아", "도하", "유나", "이수"];

/* ── 1학년 ── */

const lineOrder = word("w1-line-order", (rand) => {
  const a = randInt(rand, 2, 6);
  const b = randInt(rand, 2, 10 - a);
  const name = pick(rand, NAMES);
  return {
    key: `${a}:${b}`,
    prompt: `친구들이 한 줄로 서 있습니다. ${name}는 앞에서 ${ord(a)}, 뒤에서 ${ord(b)}에 서 있습니다. 줄을 선 친구는 모두 몇 명인가요?`,
    answer: a + b - 1,
    unit: "명",
    hint: `${name}를 앞에서도 한 번, 뒤에서도 한 번 세었어요.`,
    explanation: `${a} + ${b} − 1 = ${a + b - 1}(명)`,
    mistakes: { [a + b]: `${name}를 두 번 셌어요.` },
  };
});

const between9 = word("w1-between9", (rand) => {
  const a = randInt(rand, 0, 5);
  const b = randInt(rand, a + 2, 9);
  return {
    key: `${a}:${b}`,
    prompt: `${a}보다 크고 ${b}보다 작은 수는 모두 몇 개인가요?`,
    answer: b - a - 1,
    unit: "개",
    hint: `${josa(a, "과/와")} ${josa(b, "은/는")} 빼고, 그 사이의 수를 차례로 써 보세요.`,
    explanation: `${Array.from({ length: b - a - 1 }, (_, i) => a + 1 + i).join(", ")} → ${b - a - 1}개`,
    mistakes: { [b - a + 1]: `${josa(a, "과/와")} ${b}도 셌어요.` },
  };
});

const splitBag = word("w1-split-bag", (rand) => {
  const n = randInt(rand, 4, 9);
  const a = randInt(rand, 1, n - 2);
  const b = randInt(rand, 1, n - a - 1);
  return {
    key: `${n}:${a}:${b}`,
    prompt: `구슬 ${n}개를 주머니 세 개에 나누어 담았습니다. 첫째 주머니에 ${a}개, 둘째 주머니에 ${b}개를 담았다면 셋째 주머니에는 몇 개를 담았나요?`,
    answer: n - a - b,
    unit: "개",
    hint: `${josa(n, "을/를")} ${josa(a, "과/와")} 나머지로 가른 뒤, 나머지를 다시 ${josa(b, "과/와")} □로 갈라요.`,
    explanation: `${n} − ${a} − ${b} = ${n - a - b}(개)`,
  };
});

/**
 * 상(1-1 뺄셈 차시): 먹고 남은 수(1단계 뺄셈)를 다른 과일 수와 비교(2단계 뺄셈).
 * 뺄셈 뒤 덧셈(6 − 3 + 5)은 세 수의 덧셈과 뺄셈([2수01-08], 1-2) 내용이라 쓰지 않는다. id는 오답 기록을 지키려고 그대로 둔다
 */
const eatBuy9 = word("w1-eat-buy9", (rand) => {
  const a = randInt(rand, 4, 9);
  const b = randInt(rand, 1, a - 2);
  const c = randInt(rand, 1, a - b - 1);
  return {
    key: `${a}:${b}:${c}`,
    prompt: `사과가 ${a}개 있었습니다. 그중에서 ${b}개를 먹었습니다. 배는 ${c}개 있습니다. 남은 사과는 배보다 몇 개 더 많은가요?`,
    answer: a - b - c,
    unit: "개",
    hint: "먼저 남은 사과가 몇 개인지 구해요.",
    explanation: `남은 사과: ${a} − ${b} = ${a - b}(개), ${a - b} − ${c} = ${a - b - c}(개)`,
    mistakes: { [a - c]: "먹은 사과를 빼지 않았어요.", [a - b]: "남은 사과의 수를 썼어요." },
  };
});

/** 실제 물건에 무작위 크기 관계를 붙이면 상식과 어긋나므로 기호(가·나·다·라)를 쓴다. 모두 받침이 없어 조사는 '는'.
 * "나는 가보다"의 '나'를 대명사로 읽지 않게 "막대 나는 막대 가보다"처럼 쓴다 */
const MARKS4 = ["가", "나", "다", "라"];

const longestThing = word("w1-longest", (rand) => {
  const [s, m, l, xl] = shuffle(rand, MARKS4);
  const longest = rand() < 0.5;
  return {
    key: `${s}${m}${l}${xl}:${longest}`,
    prompt: `막대 가, 나, 다, 라가 있습니다. 막대 ${m}는 막대 ${s}보다 길고, 막대 ${l}는 막대 ${m}보다 깁니다. 막대 ${xl}는 막대 ${l}보다 깁니다. 가장 ${longest ? "긴" : "짧은"} 막대는 무엇인가요?`,
    answer: longest ? xl : s,
    choices: MARKS4,
    hint: "짧은 것부터 차례로 늘어놓아 보세요.",
    explanation: `짧은 순서: ${s} < ${m} < ${l} < ${xl}`,
  };
});

const widestThing = word("w1-widest", (rand) => {
  const [s, m, l, xl] = shuffle(rand, MARKS4);
  return {
    key: `${s}${m}${l}${xl}`,
    prompt: `종이 가, 나, 다, 라가 있습니다. 종이 ${m}는 종이 ${s}보다 넓고, 종이 ${xl}는 종이 ${l}보다 넓습니다. 종이 ${l}는 종이 ${m}보다 넓습니다. 가장 넓은 종이는 무엇인가요?`,
    answer: xl,
    choices: MARKS4,
    hint: "두 개씩 비교한 것을 이어서 순서를 정해 보세요.",
    explanation: `좁은 순서: ${s} < ${m} < ${l} < ${xl}`,
  };
});

const tensGive = word("w1-tens-give", (rand) => {
  const a = randInt(rand, 2, 4);
  // 낱개 0개('낱개 0개 있습니다')는 어색하므로 1~9
  const b = randInt(rand, 1, 9);
  const give = randInt(rand, 1, a - 1);
  return {
    key: `${a}:${b}:${give}`,
    prompt: `구슬이 10개씩 ${a}봉지와 낱개 ${b}개 있습니다. 동생에게 10개씩 든 봉지 ${give}개를 주었습니다. 남은 구슬은 몇 개인가요?`,
    answer: (a - give) * 10 + b,
    unit: "개",
    hint: "남은 봉지 수와 낱개 수로 수를 만들어요.",
    explanation: `10개씩 ${a - give}봉지와 낱개 ${b}개 → ${(a - give) * 10 + b}(개)`,
  };
});

const mostCards = word("w1-most-cards", (rand) => {
  const names = shuffle(rand, NAMES).slice(0, 4);
  const nums = shuffle(rand, Array.from({ length: 41 }, (_, i) => i + 10)).slice(0, 4);
  const most = rand() < 0.5;
  const target = most ? Math.max(...nums) : Math.min(...nums);
  return {
    key: `${names.join()}:${nums.join()}:${most}`,
    prompt: `딱지를 ${names.map((n, i) => `${n}는 ${nums[i]}장`).join(", ")} 가지고 있습니다. 딱지를 가장 ${most ? "많이" : "적게"} 가진 사람은 누구인가요?`,
    answer: names[nums.indexOf(target)],
    choices: names,
    hint: "10개씩 묶음의 수부터 비교해요.",
    explanation: `${names[nums.indexOf(target)]}(${target}장)`,
  };
});

const boxesBuy = word("w1-boxes-buy", (rand) => {
  const a = randInt(rand, 2, 5);
  const b = randInt(rand, 0, 9);
  const c = randInt(rand, 1, 9 - a);
  return {
    key: `${a}:${b}:${c}`,
    prompt: `귤을 10개씩 ${a}상자와 낱개 ${b}개 샀습니다. 10개씩 ${c}상자를 더 샀다면 귤은 모두 몇 개인가요?`,
    answer: (a + c) * 10 + b,
    unit: "개",
    hint: "10개씩 묶음의 수끼리 더해요.",
    explanation: `10개씩 ${a + c}상자와 낱개 ${b}개 → ${(a + c) * 10 + b}(개)`,
  };
});

const evenBetween = word("w1-even-between", (rand) => {
  const a = randInt(rand, 10, 80);
  const b = a + randInt(rand, 5, 15);
  const even = rand() < 0.5;
  const count = Array.from({ length: b - a - 1 }, (_, i) => a + 1 + i).filter((n) => (n % 2 === 0) === even).length;
  return {
    key: `${a}:${b}:${even}`,
    prompt: `${a}보다 크고 ${b}보다 작은 수 중에서 ${even ? "짝수" : "홀수"}는 모두 몇 개인가요?`,
    answer: count,
    unit: "개",
    hint: "사이의 수를 차례로 쓰고, 낱개의 수(뒤의 숫자)를 보고 골라요.",
    explanation: `${Array.from({ length: b - a - 1 }, (_, i) => a + 1 + i).filter((n) => (n % 2 === 0) === even).join(", ")} → ${count}개`,
  };
});

/** 세 수의 덧셈 차시: 받아올림·10 만들기는 뒤 차시라 합은 9 이하 */
const fruitThree = word("w1-fruit-three", (rand) => {
  const a = randInt(rand, 1, 7);
  const b = randInt(rand, 1, 8 - a);
  const c = randInt(rand, 1, 9 - a - b);
  return {
    key: `${a}:${b}:${c}`,
    prompt: `바구니에 사과 ${a}개, 배 ${b}개, 귤 ${c}개가 있습니다. 과일은 모두 몇 개인가요?`,
    answer: a + b + c,
    unit: "개",
    hint: "두 수를 먼저 더하고, 그 결과에 나머지 수를 더해요.",
    explanation: `${a} + ${b} = ${a + b}, ${a + b} + ${c} = ${a + b + c}(개)`,
  };
});

/** 받아올림 차시: 받아내림 뺄셈(다음 차시)이 필요 없도록 탄 사람만 더한다 */
const busCarry = word("w1-bus-carry", (rand) => {
  const a = randInt(rand, 1, 5);
  const b = randInt(rand, 1, 8 - a);
  const c = randInt(rand, 10 - a - b, 9);
  if (a + b + c > 18 || a + b >= 10) return null;
  return {
    key: `${a}:${b}:${c}`,
    prompt: `버스에 ${a}명이 타고 있었습니다. 첫째 정류장에서 ${b}명이 타고, 둘째 정류장에서 ${c}명이 더 탔습니다. 지금 버스에 탄 사람은 모두 몇 명인가요?`,
    answer: a + b + c,
    unit: "명",
    hint: "앞의 두 수를 먼저 더하고, 그 수에 10을 만들어 더해요.",
    explanation: `${a} + ${b} = ${a + b}, ${a + b} + ${c} = ${a + b + c}(명)`,
    mistakes: { [a + c]: "첫째 정류장에서 탄 사람을 빠뜨렸어요." },
  };
});

const stickers2 = word("w1-stickers2", (rand) => {
  const a = randInt(rand, 30, 89);
  const b = randInt(rand, 10, Math.min(a - 10, 50));
  const c = randInt(rand, 1, 9);
  if (a % 10 < b % 10 || (a - b) % 10 + c >= 10) return null;
  return {
    key: `${a}:${b}:${c}`,
    prompt: `칭찬 스티커가 ${a}장 있었습니다. ${b}장을 공책에 붙이고, 선생님께 ${c}장을 더 받았습니다. 스티커는 몇 장인가요?`,
    answer: a - b + c,
    unit: "장",
    hint: "앞에서부터 차례로: 먼저 빼고, 그다음 더해요.",
    explanation: `${a} − ${b} = ${a - b}, ${a - b} + ${c} = ${a - b + c}(장)`,
  };
});

const movieEnd = word("w1-movie-end", (rand) => {
  const h = randInt(rand, 1, 9);
  const half = rand() < 0.5;
  const endH = half ? h + 1 : h + 2;
  return {
    key: `${h}:${half}`,
    prompt: half
      ? `영화가 ${h}시 30분에 시작해서 1시간 30분 동안 했습니다. 영화가 끝난 시각은 몇 시 몇 분인가요?`
      : `영화가 ${h}시에 시작해서 2시간 동안 했습니다. 영화가 끝난 시각은 몇 시 몇 분인가요?`,
    answer: half ? `${endH + 1},0` : `${endH},0`,
    unit: ["시", "분"],
    hint: half ? "30분과 30분이 모이면 1시간이에요." : "1시간이 지나면 짧은바늘이 숫자 한 칸 움직여요.",
    explanation: half ? `${h}시 30분 + 1시간 30분 = ${endH + 1}시` : `${h}시 + 2시간 = ${endH}시`,
  };
});

const fifthNumber = word("w1-fifth-number", (rand) => {
  const start = randInt(rand, 1, 30);
  const step = pick(rand, [2, 5, 10]);
  const nth = randInt(rand, 5, 7);
  return {
    key: `${start}:${step}:${nth}`,
    prompt: `${start}부터 시작하여 ${step}씩 커지는 수를 차례로 씁니다. ${ord(nth)} 수는 무엇인가요?`,
    answer: start + step * (nth - 1),
    hint: `첫째 수는 ${josa(start, "이에요/예요")}. 하나씩 써 보세요.`,
    explanation: `${Array.from({ length: nth }, (_, i) => start + step * i).join(", ")}`,
    mistakes: { [start + step * nth]: "첫째 수를 빼고 셌어요." },
  };
});

/* ── 2학년 ── */

const coins3 = word("w2-coins3", (rand) => {
  const a = randInt(rand, 1, 9);
  const b = randInt(rand, 0, 9);
  const c = randInt(rand, 0, 9);
  const spend = randInt(rand, 1, a) * 100;
  return {
    key: `${a}:${b}:${c}:${spend}`,
    prompt: `${[`100원짜리 동전 ${a}개`, b ? `10원짜리 동전 ${b}개` : "", c ? `1원짜리 동전 ${c}개` : ""].filter(Boolean).join(", ")}가 있었습니다. 그중 ${spend}원을 썼다면 남은 돈은 얼마인가요?`,
    answer: a * 100 + b * 10 + c - spend,
    unit: "원",
    hint: "먼저 가진 돈을 세 자리 수로 나타낸 뒤 빼요.",
    explanation: `${a * 100 + b * 10 + c} − ${spend} = ${a * 100 + b * 10 + c - spend}(원)`,
  };
});

const skipBack = word("w2-skip-back", (rand) => {
  const step = pick(rand, [10, 100]);
  const times = randInt(rand, 2, 4);
  const end = randInt(rand, 400, 900);
  return {
    key: `${step}:${times}:${end}`,
    prompt: `어떤 수에서 ${step}씩 ${times}번 뛰어 세었더니 ${josa(end, "이/가")} 되었습니다. 어떤 수는 얼마인가요?`,
    answer: end - step * times,
    hint: `거꾸로 ${step}씩 ${times}번 뛰어 세어 보세요.`,
    explanation: `거꾸로 ${step}씩 뛰어 세면 ${Array.from({ length: times + 1 }, (_, i) => end - step * i).join(" → ")}`,
    mistakes: { [end + step * times]: "거꾸로 세어야 해요." },
  };
});

const polyVertices = word("w2-poly-vertices", (rand) => {
  const a = randInt(rand, 1, 5);
  const b = randInt(rand, 1, 5);
  return {
    key: `${a}:${b}`,
    prompt: `삼각형 ${a}개와 사각형 ${b}개를 그렸습니다. 그린 도형의 꼭짓점은 모두 몇 개인가요?`,
    answer: 3 * a + 4 * b,
    unit: "개",
    hint: "삼각형의 꼭짓점은 3개, 사각형의 꼭짓점은 4개예요.",
    explanation: `3 × ${a} + 4 × ${b} = ${3 * a + 4 * b}(개)`,
  };
});

const bus2 = word("w2-bus2", (rand) => {
  const a = randInt(rand, 15, 45);
  const b = randInt(rand, 12, 38);
  const c = randInt(rand, 10, a + b - 5);
  return {
    key: `${a}:${b}:${c}`,
    prompt: `버스에 ${a}명이 타고 있었습니다. 이번 정류장에서 ${b}명이 타고 ${c}명이 내렸습니다. 지금 버스에 탄 사람은 몇 명인가요?`,
    answer: a + b - c,
    unit: "명",
    hint: "탄 사람은 더하고, 내린 사람은 빼요.",
    explanation: `${a} + ${b} − ${c} = ${a + b - c}(명)`,
    mistakes: { [a + b + c]: "내린 사람은 빼야 해요." },
  };
});

const wrongCalc = word("w2-wrong-calc", (rand) => {
  const a = randInt(rand, 12, 38);
  const b = randInt(rand, 10, 40);
  return {
    key: `${a}:${b}`,
    prompt: `어떤 수에 ${josa(a, "을/를")} 더해야 할 것을 잘못하여 뺐더니 ${josa(b, "이/가")} 되었습니다. 바르게 계산한 값은 얼마인가요?`,
    answer: b + 2 * a,
    hint: `먼저 어떤 수를 구해요: □ − ${a} = ${b}`,
    explanation: `어떤 수 = ${b} + ${a} = ${a + b}, 바른 계산: ${a + b} + ${a} = ${b + 2 * a}`,
    mistakes: { [a + b]: "어떤 수만 구했어요. 바르게 계산까지 해야 해요." },
  };
});

const tapeOverlap = word("w2-tape-overlap", (rand) => {
  const a = randInt(rand, 8, 30);
  const b = randInt(rand, 2, 6);
  return {
    key: `${a}:${b}`,
    prompt: `길이가 ${a} cm인 색 테이프 2장을 ${b} cm만큼 겹치게 이어 붙였습니다. 이어 붙인 색 테이프의 전체 길이는 몇 cm인가요?`,
    answer: 2 * a - b,
    unit: "cm",
    hint: "두 장의 길이를 더한 뒤, 겹친 부분만큼 빼요.",
    explanation: `${a} + ${a} − ${b} = ${2 * a - b}(cm)`,
    mistakes: { [2 * a]: "겹친 부분을 빼지 않았어요." },
  };
});

const classifyTwo = word("w2-classify-two", (rand) => {
  const r = randInt(rand, 3, 9);
  const b = randInt(rand, 3, 9);
  const y = randInt(rand, 3, 9);
  return {
    key: `${r}:${b}:${y}`,
    prompt: `단추를 색깔별로 분류했더니 빨간 단추 ${r}개, 파란 단추 ${b}개, 노란 단추 ${y}개였습니다. 가장 많은 색 단추와 가장 적은 색 단추의 수의 차는 몇 개인가요?`,
    answer: Math.max(r, b, y) - Math.min(r, b, y),
    unit: "개",
    hint: "가장 많은 것과 가장 적은 것을 먼저 찾아요.",
    explanation: `${Math.max(r, b, y)} − ${Math.min(r, b, y)} = ${Math.max(r, b, y) - Math.min(r, b, y)}(개)`,
  };
});

const boxesEat = word("w2-boxes-eat", (rand) => {
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, 2, 5);
  const c = randInt(rand, 1, a * b - 1);
  return {
    key: `${a}:${b}:${c}`,
    prompt: `한 상자에 과자가 ${a}개씩 들어 있습니다. ${b}상자를 사서 ${c}개를 먹었다면 남은 과자는 몇 개인가요?`,
    answer: a * b - c,
    unit: "개",
    hint: `먼저 ${a}의 ${b}배를 구해요.`,
    explanation: `${a} × ${b} = ${a * b}, ${a * b} − ${c} = ${a * b - c}(개)`,
  };
});

const money4 = word("w2-money4", (rand) => {
  const a = randInt(rand, 1, 8);
  const b = randInt(rand, 0, 9);
  const c = randInt(rand, 0, 9);
  const add = randInt(rand, 1, 9 - a) * 1000;
  return {
    key: `${a}:${b}:${c}:${add}`,
    // 개수가 0인 동전은 문장에서 뺀다("동전 0개가 있습니다"는 어색하다)
    prompt: `저금통에 ${[`1000원짜리 지폐 ${a}장`, b ? `100원짜리 동전 ${b}개` : "", c ? `10원짜리 동전 ${c}개` : ""].filter(Boolean).join(", ")}${b || c ? "가" : "이"} 있습니다. 1000원짜리 지폐 ${add / 1000}장을 더 넣으면 모두 얼마인가요?`,
    answer: (a * 1000 + b * 100 + c * 10) + add,
    unit: "원",
    hint: "네 자리 수로 나타낸 뒤 천의 자리 숫자를 늘려요.",
    explanation: `${a * 1000 + b * 100 + c * 10} + ${add} = ${a * 1000 + b * 100 + c * 10 + add}(원)`,
  };
});

const skipBack4 = word("w2-skip-back4", (rand) => {
  const step = pick(rand, [100, 1000]);
  const times = randInt(rand, 2, 4);
  const end = randInt(rand, 1000, 5000);
  return {
    key: `${step}:${times}:${end}`,
    prompt: `어떤 수에서 ${step}씩 거꾸로 ${times}번 뛰어 세었더니 ${josa(end, "이/가")} 되었습니다. 어떤 수는 얼마인가요?`,
    answer: end + step * times,
    hint: `반대로 ${step}씩 ${times}번 커지게 뛰어 세어 보세요.`,
    explanation: `반대로 ${step}씩 커지게 뛰어 세면 ${Array.from({ length: times + 1 }, (_, i) => end + step * i).join(" → ")}`,
    mistakes: { [end - step * times]: "반대 방향으로 세었어요." },
  };
});

const emptyChairs = word("w2-empty-chairs", (rand) => {
  const a = randInt(rand, 3, 9);
  const b = randInt(rand, 3, 9);
  const c = randInt(rand, 5, a * b - 1);
  return {
    key: `${a}:${b}:${c}`,
    prompt: `강당에 의자가 한 줄에 ${a}개씩 ${b}줄 놓여 있습니다. ${c}명이 한 명씩 앉았다면 빈 의자는 몇 개인가요?`,
    answer: a * b - c,
    unit: "개",
    hint: "먼저 곱셈구구로 의자 수를 구해요.",
    explanation: `${a} × ${b} = ${a * b}, ${a * b} − ${c} = ${a * b - c}(개)`,
  };
});

const twoUnknowns = word("w2-two-unknowns", (rand) => {
  const k = randInt(rand, 2, 9);
  const x = randInt(rand, 0, 9);
  const y = randInt(rand, 1, 9);
  return {
    key: `${k}:${x}:${y}`,
    prompt: `□ × ${k} = ${x * k}, △ × ${k} = ${y * k}일 때 □와 △의 합은 얼마인가요?`,
    answer: x + y,
    hint: `${k}단 곱셈구구에서 □와 △를 각각 찾아요.`,
    explanation: `□ = ${x}, △ = ${y} → ${x + y}`,
  };
});

const ropeCut = word("w2-rope-cut", (rand) => {
  const m = randInt(rand, 2, 6);
  const cm = randInt(rand, 20, 90);
  const cut = randInt(rand, 10, cm - 5);
  const cut2 = randInt(rand, 1, m - 1);
  return {
    key: `${m}:${cm}:${cut}:${cut2}`,
    prompt: `길이가 ${m} m ${cm} cm인 끈에서 ${cut2} m ${cut} cm를 잘라 썼습니다. 남은 끈의 길이는 몇 m 몇 cm인가요?`,
    answer: `${m - cut2},${cm - cut}`,
    unit: ["m", "cm"],
    hint: "m는 m끼리, cm는 cm끼리 빼요.",
    explanation: `${m} m ${cm} cm − ${cut2} m ${cut} cm = ${m - cut2} m ${cm - cut} cm`,
  };
});

const routeLength = word("w2-route-length", (rand) => {
  const a = randInt(rand, 1, 5);
  const b = randInt(rand, 10, 90);
  const c = randInt(rand, 1, 5);
  const d = randInt(rand, 10, 90);
  const t = a * 100 + b + c * 100 + d;
  return {
    key: `${a}:${b}:${c}:${d}`,
    prompt: `집에서 공원까지는 ${a} m ${b} cm, 공원에서 학교까지는 ${c} m ${d} cm입니다. 집에서 공원을 거쳐 학교까지 가는 거리는 몇 m 몇 cm인가요?`,
    answer: `${Math.floor(t / 100)},${t % 100}`,
    unit: ["m", "cm"],
    hint: "cm끼리 더한 값이 100 이상이면 1 m로 받아올려요.",
    explanation: `${Math.floor(t / 100)} m ${t % 100} cm`,
    mistakes: { [`${a + c},${b + d}`]: "받아올림을 하지 않았어요." },
  };
});

const studyEnd = word("w2-study-end", (rand) => {
  const h = randInt(rand, 1, 10);
  const m = randInt(rand, 0, 11) * 5;
  const dur = randInt(rand, 20, 70);
  const end = h * 60 + m + dur;
  return {
    key: `${h}:${m}:${dur}`,
    prompt: `${h}시 ${m}분에 공부를 시작하여 ${dur}분 동안 했습니다. 공부를 마친 시각은 몇 시 몇 분인가요?`,
    answer: `${Math.floor(end / 60) > 12 ? Math.floor(end / 60) - 12 : Math.floor(end / 60)},${end % 60}`,
    unit: ["시", "분"],
    hint: "분끼리 더해 60분이 넘으면 1시간으로 바꿔요.",
    explanation: `${h}시 ${m}분 + ${dur}분 = ${Math.floor(end / 60)}시 ${end % 60}분`,
  };
});

const graphDiff = word("w2-graph-diff", (rand) => {
  const fruits = shuffle(rand, ["사과", "포도", "귤", "배"]);
  const vals = fruits.map(() => randInt(rand, 1, 9));
  if (new Set(vals).size < 4) return null;
  return {
    key: `${fruits.join()}:${vals.join()}`,
    prompt: `좋아하는 과일을 조사했더니 ${fruits.map((f, i) => `${f} ${vals[i]}명`).join(", ")}이었습니다. 가장 많은 학생이 좋아하는 과일과 가장 적은 학생이 좋아하는 과일의 학생 수의 차는 몇 명인가요?`,
    answer: Math.max(...vals) - Math.min(...vals),
    unit: "명",
    hint: "그래프로 나타내면 가장 긴 줄과 가장 짧은 줄의 차예요.",
    explanation: `${Math.max(...vals)} − ${Math.min(...vals)} = ${Math.max(...vals) - Math.min(...vals)}(명)`,
  };
});

const nthShape = word("w2-nth-shape", (rand) => {
  const unit = shuffle(rand, ["○", "△", "☆", "◇"]).slice(0, randInt(rand, 2, 3));
  const n = randInt(rand, 10, 25);
  const answer = unit[(n - 1) % unit.length];
  const choices = [...unit, ...["○", "△", "☆", "◇"].filter((x) => !unit.includes(x))].slice(0, 4);
  return {
    key: `${unit.join("")}:${n}`,
    prompt: `${unit.join(" ")} 이(가) 차례로 되풀이됩니다. ${ord(n)}에 오는 모양은 무엇인가요?`,
    answer,
    choices: shuffle(rand, choices),
    hint: `${unit.length}개씩 되풀이되니, ${josa(n, "을/를")} ${unit.length}씩 묶어 보세요.`,
    explanation: `${ord(n)}는 ${answer}입니다.`,
  };
});

const tableCount = word("w2-table-count", (rand) => {
  const k = randInt(rand, 2, 9);
  // 답이 0개(모든 곱보다 큰 수)나 9개(모든 곱보다 작은 수)가 되지 않게 k보다 크고 9k보다 작은 수
  const lo = randInt(rand, k + 1, 9 * k - 1);
  const count = Array.from({ length: 9 }, (_, i) => k * (i + 1)).filter((v) => v > lo).length;
  return {
    key: `${k}:${lo}`,
    prompt: `${k}단 곱셈구구의 곱(${k} × 1부터 ${k} × 9까지) 중에서 ${lo}보다 큰 수는 모두 몇 개인가요?`,
    answer: count,
    unit: "개",
    hint: `${k}단의 곱을 차례로 써 보세요.`,
    explanation: `${Array.from({ length: 9 }, (_, i) => k * (i + 1)).filter((v) => v > lo).join(", ")} → ${count}개`,
  };
});

export const words12: WordMap = {
  "g1-s1-numbers9": { count9: [lineOrder], order9: [between9] },
  "g1-s1-add-sub": { split: [splitBag], addsub9: [eatBuy9] },
  "g1-s1-compare": { length: [longestThing], area: [widestThing] },
  "g1-s1-numbers50": { tens50: [tensGive], compare50: [mostCards] },
  "g1-s2-numbers100": { tens100: [boxesBuy], order100: [evenBetween] },
  "g1-s2-add-sub": { ten: [fruitThree], carry1: [busCarry], "two-digit": [stickers2] },
  "g1-s2-shapes-clock": { clock: [movieEnd] },
  "g1-s2-patterns": { "number-pattern": [fifthNumber] },
  "g2-s1-numbers3": { read3: [coins3], order3: [skipBack] },
  "g2-s1-shapes": { polygons2: [polyVertices] },
  "g2-s1-add-sub": { carry2: [bus2], relation: [wrongCalc] },
  "g2-s1-length": { ruler: [tapeOverlap] },
  "g2-s1-classify": { classify: [classifyTwo] },
  "g2-s1-multiplication": { groups: [boxesEat] },
  "g2-s2-numbers4": { read4: [money4], order4: [skipBack4] },
  "g2-s2-times-tables": { tables: [emptyChairs], "tables-01": [twoUnknowns] },
  "g2-s2-length-m": { "m-cm": [ropeCut], "m-cm-calc": [routeLength] },
  "g2-s2-time": { "clock-min": [studyEnd] },
  "g2-s2-table-graph": { "graph-o": [graphDiff] },
  "g2-s2-patterns": { "shape-pattern": [nthShape], "table-pattern": [tableCount] },
};

