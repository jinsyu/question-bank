import { pick, randInt, shuffle } from "../../lib/random";
import type { ShapeScene } from "../types";
import { mid, word } from "../words/word";
import { gcd, reduced } from "../generators/grade5";
import { sideText, textsClash } from "./g4-quad";
import { jq } from "./g5-text";
import { cubeNet, cuboidSketch } from "./g5-cuboid";
import { choices4, easy, extremeOf, fracChoices, mixedQ, NAMES, properQ, qMul, qShow, qText, qVal, trim, two, type Ex, type Q } from "./g5";

const digitsCards = (rand: () => number, n: number, min = 1, max = 9) => shuffle(rand, Array.from({ length: max - min + 1 }, (_, i) => i + min)).slice(0, n);
const PLACE: Record<number, string> = { 10: "십", 100: "백", 1000: "천", 10000: "만" };

/* ══════════ 5-2-1 수의 범위와 어림하기 ══════════ */

function listCount(id: string, words: [string, string]) {
  return easy(id, (rand) => {
    const vals = shuffle(rand, Array.from({ length: 50 }, (_, i) => i + 10)).slice(0, 7);
    // 기준 수는 목록의 가운데쯤(답이 '전부'나 '하나'로 쏠리지 않게)
    const k = [...vals].sort((p, q) => p - q)[randInt(rand, 2, 4)];
    const w = pick(rand, words);
    const hit = vals.filter((v) => (w === "이상" ? v >= k : w === "이하" ? v <= k : w === "초과" ? v > k : v < k));
    return {
      key: `${vals.join()}:${k}:${w}`,
      prompt: `${vals.join(", ")} 중에서 ${k} ${w}인 수는 모두 몇 개인가요?`,
      answer: hit.length,
      unit: "개",
      hint: w === "이상" || w === "이하" ? `${jq(w, "은/는")} ${jq(k, "을/를")} 포함해요.` : `${jq(w, "은/는")} ${jq(k, "을/를")} 포함하지 않아요.`,
      explanation: `${hit.join(", ") || "없음"} → ${hit.length}개`,
    };
  });
}

export const abList = listCount("l5-rg-ab-list", ["이상", "이하"]);
export const ouList = listCount("l5-rg-ou-list", ["초과", "미만"]);

export const abCount = mid("l5-rg-ab-count", (rand) => {
  const a = randInt(rand, 10, 60);
  const b = a + randInt(rand, 15, 60);
  const k = randInt(rand, 3, 9);
  const cnt = Math.floor(b / k) - Math.floor((a - 1) / k);
  return {
    key: `${a}:${b}:${k}`,
    prompt: `${a} 이상 ${b} 이하인 자연수 중에서 ${k}의 배수는 모두 몇 개인가요?`,
    answer: cnt,
    unit: "개",
    hint: `${jq(a, "과/와")} ${b}도 포함해요.`,
    explanation: `${b}까지 ${Math.floor(b / k)}개, ${a - 1}까지 ${Math.floor((a - 1) / k)}개 → ${cnt}개`,
  };
});

export const abNotIn = mid("l5-rg-ab-not-in", (rand) => {
  const k = randInt(rand, 20, 80);
  const below = rand() < 0.5;
  const ins = shuffle(rand, [k, ...Array.from({ length: 8 }, (_, i) => (below ? k - i - 1 : k + i + 1))]).slice(0, 3);
  if (!ins.includes(k)) ins[0] = k;
  const answer = below ? k + randInt(rand, 1, 5) : k - randInt(rand, 1, 5);
  return {
    key: `${k}:${below}:${ins.join()}:${answer}`,
    prompt: `${k} ${below ? "이하" : "이상"}인 수가 아닌 것을 고르세요.`,
    answer: String(answer),
    choices: shuffle(rand, [String(answer), ...ins.map(String)]),
    hint: `${k} ${below ? "이하" : "이상"}인 수에는 ${k}도 들어가요.`,
    explanation: `${jq(answer, "은/는")} ${k}보다 ${below ? "커서" : "작아서"} ${k} ${below ? "이하" : "이상"}인 수가 아니에요.`,
  };
});

export const abCond = word("l5-rg-ab-cond", (rand) => {
  const a = randInt(rand, 20, 60);
  const b = a + randInt(rand, 15, 35);
  const s = randInt(rand, 8, 13);
  const hits = Array.from({ length: b - a + 1 }, (_, i) => a + i).filter((n) => n < 100 && Math.floor(n / 10) + (n % 10) >= s);
  if (!hits.length) return null;
  return {
    key: `${a}:${b}:${s}`,
    prompt: `다음 조건을 모두 만족하는 자연수는 모두 몇 개인가요? ① ${a} 이상 ${b} 이하인 수입니다. ② 두 자리 수입니다. ③ 십의 자리 숫자와 일의 자리 숫자의 합이 ${s} 이상입니다.`,
    answer: hits.length,
    unit: "개",
    hint: "범위 안의 수를 십의 자리별로 나누어 조건을 확인해요.",
    explanation: `${hits.join(", ")} → ${hits.length}개`,
  };
});

export const abCards = word("l5-rg-ab-cards", (rand) => {
  const cards = digitsCards(rand, 4, 1, 9);
  const nums = cards.flatMap((x) => cards.filter((y) => y !== x).map((y) => x * 10 + y));
  const a = randInt(rand, 20, 60);
  const b = a + randInt(rand, 10, 35);
  const hits = nums.filter((n) => n >= a && n <= b).sort((x, y) => x - y);
  if (!hits.length) return null;
  return {
    key: `${cards.join()}:${a}:${b}`,
    prompt: `수 카드 ${cards.join(", ")} 중에서 2장을 골라 한 번씩 사용하여 두 자리 수를 만들려고 합니다. 만들 수 있는 수 중에서 ${a} 이상 ${b} 이하인 수는 모두 몇 개인가요?`,
    answer: hits.length,
    unit: "개",
    hint: "십의 자리 숫자를 정해 놓고 만들 수 있는 수를 빠짐없이 써 보세요.",
    explanation: `${hits.join(", ")} → ${hits.length}개`,
  };
});

export const ouCount = mid("l5-rg-ou-count", (rand) => {
  const a = randInt(rand, 10, 80);
  const b = a + randInt(rand, 5, 30);
  return {
    key: `${a}:${b}`,
    prompt: `${a} 초과 ${b} 미만인 자연수는 모두 몇 개인가요?`,
    answer: b - a - 1,
    unit: "개",
    hint: "초과와 미만은 경계의 수를 포함하지 않아요.",
    explanation: `${a + 1}부터 ${b - 1}까지 → ${b - a - 1}개`,
    mistakes: { [b - a + 1]: "경계의 두 수를 포함했어요.", [b - a]: "경계의 수 하나를 포함했어요." },
  };
});

const lineScene = (lo: number, hi: number, loIn: boolean, hiIn: boolean): ShapeScene => {
  const start = lo - 2;
  const x = (v: number) => 20 + (v - start) * 28;
  const ticks = Array.from({ length: hi - lo + 5 }, (_, i) => start + i);
  return {
    kind: "shape",
    width: x(ticks[ticks.length - 1]) + 20,
    height: 70,
    label: `수직선에 ${lo}부터 ${hi}까지의 범위를 나타낸 그림`,
    lines: [
      { from: [10, 40], to: [x(ticks[ticks.length - 1]) + 12, 40] },
      ...ticks.map((v) => ({ from: [x(v), 35] as [number, number], to: [x(v), 45] as [number, number] })),
      { from: [x(lo), 22], to: [x(hi), 22], width: 3 },
      { from: [x(lo), 22], to: [x(lo), 40], dashed: true },
      { from: [x(hi), 22], to: [x(hi), 40], dashed: true },
    ],
    dots: [...(loIn ? [[x(lo), 22] as [number, number]] : []), ...(hiIn ? [[x(hi), 22] as [number, number]] : [])],
    circles: [...(loIn ? [] : [{ c: [x(lo), 22] as [number, number], r: 5 }]), ...(hiIn ? [] : [{ c: [x(hi), 22] as [number, number], r: 5 }])],
    texts: ticks.filter((v) => v === lo || v === hi).map((v) => ({ at: [x(v), 60] as [number, number], text: String(v) })),
  };
};

export const ouLine = mid("l5-rg-ou-line", (rand) => {
  const lo = randInt(rand, 10, 60);
  const hi = lo + randInt(rand, 2, 5);
  const loIn = rand() < 0.5;
  const hiIn = rand() < 0.5;
  const t = (a: boolean, b: boolean) => `${lo} ${a ? "이상" : "초과"} ${hi} ${b ? "이하" : "미만"}`;
  const answer = t(loIn, hiIn);
  return {
    key: `${lo}:${hi}:${loIn}:${hiIn}`,
    prompt: "수직선에 나타낸 수의 범위를 고르세요. (●는 포함, ○는 포함하지 않음)",
    visual: lineScene(lo, hi, loIn, hiIn),
    answer,
    choices: shuffle(rand, [t(true, true), t(true, false), t(false, true), t(false, false)]),
    hint: "●로 나타내면 그 수를 포함하고, ○로 나타내면 포함하지 않아요.",
    explanation: `${jq(lo, "은/는")} ${loIn ? "●" : "○"}, ${jq(hi, "은/는")} ${hiIn ? "●" : "○"} → ${answer}`,
  };
});

export const ouOverlap = word("l5-rg-ou-overlap", (rand) => {
  const a = randInt(rand, 10, 40);
  const b = a + randInt(rand, 10, 25);
  const c = randInt(rand, a + 2, b - 3);
  const d = b + randInt(rand, 3, 15);
  const hits = Array.from({ length: d - a + 1 }, (_, i) => a + i).filter((n) => n > a && n <= b && n >= c && n < d);
  return {
    key: `${a}:${b}:${c}:${d}`,
    prompt: `${a} 초과 ${b} 이하인 자연수이면서 ${c} 이상 ${d} 미만인 자연수는 모두 몇 개인가요?`,
    answer: hits.length,
    unit: "개",
    hint: "두 범위를 수직선에 나타내어 겹치는 부분을 찾아요.",
    explanation: `두 범위에 모두 들어가는 수: ${hits[0]}부터 ${hits[hits.length - 1]}까지 → ${hits.length}개`,
  };
});

const FEES = [
  { label: "8세 미만", min: 0, max: 7, fee: 0 },
  { label: "8세 이상 13세 미만", min: 8, max: 12, fee: 1000 },
  { label: "13세 이상 19세 미만", min: 13, max: 18, fee: 2000 },
  { label: "19세 이상", min: 19, max: 99, fee: 3000 },
];

export const ouFee = word("l5-rg-ou-fee", (rand) => {
  const k = randInt(rand, 1, 3);
  const fees = FEES.map((f) => ({ ...f, fee: f.fee * k }));
  const ages = [randInt(rand, 35, 50), randInt(rand, 35, 50), randInt(rand, 3, 18), randInt(rand, 3, 18)];
  const feeOf = (a: number) => fees.find((f) => a >= f.min && a <= f.max)!.fee;
  const total = ages.reduce((s, a) => s + feeOf(a), 0);
  return {
    key: `${k}:${ages.join()}`,
    prompt: `박물관 입장료가 표와 같습니다. ${ages[0]}세 아버지, ${ages[1]}세 어머니, ${ages[2]}세, ${ages[3]}세 두 자녀가 함께 입장하려면 입장료는 모두 얼마인가요?`,
    visual: { kind: "table", header: ["나이", "입장료(원)"], rows: fees.map((f) => [f.label, String(f.fee)]) },
    answer: total,
    unit: "원",
    hint: "각자의 나이가 어느 범위에 들어가는지 확인해요. 13세는 13세 이상에 들어가요.",
    explanation: ages.map((a) => `${a}세 ${feeOf(a)}원`).join(", ") + ` → ${total}원`,
  };
});

const POST = [
  { lo: 0, hi: 5, fee: 430 },
  { lo: 5, hi: 25, fee: 520 },
  { lo: 25, hi: 50, fee: 600 },
  { lo: 50, hi: 100, fee: 750 },
];
const postTable = { kind: "table" as const, header: ["무게(g)", "요금(원)"], rows: POST.map((p) => [`${p.lo} 초과 ${p.hi} 이하`, String(p.fee)]) };
const postFee = (w: number) => POST.find((p) => w > p.lo && w <= p.hi)!.fee;

export const rgTable = mid("l5-rg-table", (rand) => {
  const w = pick(rand, [...POST.map((p) => p.hi), randInt(rand, 1, 99), randInt(rand, 1, 99)]);
  return {
    key: `${w}`,
    prompt: `우편 요금표입니다. 무게가 ${w} g인 편지를 보내려면 요금은 얼마인가요?`,
    visual: postTable,
    answer: postFee(w),
    unit: "원",
    hint: "초과는 경계의 수를 포함하지 않고, 이하는 포함해요.",
    explanation: `${jq(`${w} g`, "은/는")} ${POST.find((p) => w > p.lo && w <= p.hi)!.lo} g 초과 ${POST.find((p) => w > p.lo && w <= p.hi)!.hi} g 이하 → ${postFee(w)}원`,
  };
});

export const rgParcel = word("l5-rg-parcel", (rand) => {
  const a = randInt(rand, 3, 45);
  const b = randInt(rand, 3, 50);
  if (a + b > 100) return null;
  const sep = postFee(a) + postFee(b);
  const one = postFee(a + b);
  if (sep === one) return null;
  return {
    key: `${a}:${b}`,
    prompt: `무게가 ${a} g, ${b} g인 편지 두 통을 따로 보낼 때와 한 봉투에 넣어 ${a + b} g으로 보낼 때의 요금은 몇 원 차이가 나나요?`,
    visual: postTable,
    answer: Math.abs(sep - one),
    unit: "원",
    hint: "각 경우의 무게가 어느 범위에 들어가는지 확인해 요금을 구해요.",
    explanation: `따로: ${postFee(a)} + ${postFee(b)} = ${sep}(원), 한 번에: ${one}원 → 차 ${Math.abs(sep - one)}원`,
  };
});

const roundTo = (n: number, place: number, how: "올림" | "버림" | "반올림") =>
  how === "올림" ? Math.ceil(n / place) * place : how === "버림" ? Math.floor(n / place) * place : Math.round(n / place) * place;

function roundEasy(id: string, hows: ("올림" | "버림" | "반올림")[]) {
  return easy(id, (rand) => {
    const how = pick(rand, hows);
    if (rand() < 0.3) {
      const x = randInt(rand, 1001, 9999);
      const p = pick(rand, [1, 2]);
      const v = x / 1000;
      const r = roundTo(x, 10 ** (3 - p), how) / 1000;
      return {
        key: `d:${how}:${x}:${p}`,
        prompt: `${jq(trim(v, 3), "을/를")} ${how}하여 소수 ${p === 1 ? "첫째" : "둘째"} 자리까지 나타내세요.`,
        answer: trim(r, p),
        hint: how === "반올림" ? "바로 아래 자리 숫자가 5 이상이면 올리고, 4 이하면 버려요." : `구하려는 자리 아래 수를 ${how === "올림" ? "올려요" : "버려요"}.`,
        explanation: `${trim(v, 3)} → ${trim(r, p)}`,
      };
    }
    const n = randInt(rand, 1001, 99999);
    const place = pick(rand, [10, 100, 1000]);
    const v = roundTo(n, place, how);
    return {
      key: `n:${how}:${n}:${place}`,
      prompt: `${jq(n, "을/를")} ${how}하여 ${PLACE[place]}의 자리까지 나타내세요.`,
      answer: v,
      hint: how === "반올림" ? "바로 아래 자리 숫자가 5 이상이면 올리고, 4 이하면 버려요." : `구하려는 자리 아래 수를 ${how === "올림" ? "올려요" : "버려요"}.`,
      explanation: `${n} → ${v}`,
      mistakes: how === "반올림" ? {} : { [roundTo(n, place, how === "올림" ? "버림" : "올림")]: how === "올림" ? "버림을 했어요." : "올림을 했어요." },
    };
  });
}

export const rdUD = roundEasy("l5-rd-ud", ["올림", "버림"]);
export const rdHalf = roundEasy("l5-rd-half", ["반올림"]);

export const rdCoins = mid("l5-rd-coins", (rand) => {
  const up = rand() < 0.5;
  // 1원·5원짜리는 쓰지 않으므로 10원 단위 금액
  const n = randInt(rand, 120, 2990) * 10;
  if (n % 100 === 0) return null;
  return up
    ? {
        key: `u:${n}`,
        prompt: `${n}원짜리 물건을 1000원짜리 지폐로만 사려고 합니다. 지폐는 적어도 몇 장 내야 하나요?`,
        answer: Math.ceil(n / 1000),
        unit: "장",
        hint: "모자라지 않게 내야 하므로 올림을 해요.",
        explanation: `${jq(n, "을/를")} 올림하여 천의 자리까지 → ${Math.ceil(n / 1000) * 1000}원, ${Math.ceil(n / 1000)}장`,
        mistakes: { [Math.floor(n / 1000)]: "돈이 모자라요. 올림을 해야 해요." },
      }
    : {
        key: `d:${n}`,
        prompt: `저금통에 모은 동전 ${n}원을 100원짜리 동전으로만 바꾸려고 합니다. 100원짜리 동전으로 최대 몇 개까지 바꿀 수 있나요?`,
        answer: Math.floor(n / 100),
        unit: "개",
        hint: "100원이 안 되는 돈은 바꿀 수 없으므로 버림을 해요.",
        explanation: `${jq(n, "을/를")} 버림하여 백의 자리까지 → ${Math.floor(n / 100) * 100}원, ${Math.floor(n / 100)}개`,
        mistakes: { [Math.ceil(n / 100)]: "100원이 안 되는 돈은 바꿀 수 없어요." },
      };
});

export const rdSame = mid("l5-rd-same", (rand) => {
  const place = pick(rand, [10, 100]);
  const answer = randInt(rand, 12, 98) * place;
  const others = new Set<string>();
  for (let i = 0; others.size < 3 && i < 40; i++) {
    const x = answer + randInt(rand, -place + 1, place - 1);
    if (x % place !== 0) others.add(String(x));
  }
  return {
    key: `${place}:${answer}:${[...others].join()}`,
    prompt: `올림하여 ${PLACE[place]}의 자리까지 나타낸 수와 버림하여 ${PLACE[place]}의 자리까지 나타낸 수가 같은 것을 고르세요.`,
    answer: String(answer),
    choices: shuffle(rand, [String(answer), ...others]),
    hint: `${PLACE[place]}의 자리 아래 수가 모두 0이면 올림과 버림의 결과가 같아요.`,
    explanation: `${jq(answer, "은/는")} ${PLACE[place]}의 자리 아래가 모두 0이라 올림, 버림 모두 ${jq(answer, "이에요/예요")}.`,
  };
});

export const rdUDRange = word("l5-rd-ud-range", (rand) => {
  const up = rand() < 0.5;
  const place = pick(rand, [10, 100]);
  const X = randInt(rand, 3, 90) * place;
  const [lo, hi] = up ? [X - place + 1, X] : [X, X + place - 1];
  return {
    key: `${up}:${place}:${X}`,
    prompt: `어떤 자연수를 ${up ? "올림" : "버림"}하여 ${PLACE[place]}의 자리까지 나타내었더니 ${jq(X, "이/가")} 되었습니다. 어떤 수가 될 수 있는 수 중에서 가장 큰 수와 가장 작은 수의 합은 얼마인가요?`,
    answer: lo + hi,
    hint: up ? `${X}보다 조금 작은 수도 올림하면 ${jq(X, "이/가")} 돼요.` : `${X}보다 조금 큰 수도 버림하면 ${jq(X, "이/가")} 돼요.`,
    explanation: `${lo}부터 ${hi}까지 → ${lo} + ${hi} = ${lo + hi}`,
  };
});

export const rdHalfOdd = mid("l5-rd-half-odd", (rand) => {
  const R = randInt(rand, 12, 98) * 100;
  const set = new Set<number>();
  for (let i = 0; set.size < 3 && i < 40; i++) set.add(R + randInt(rand, -50, 49));
  const answer = pick(rand, [R + randInt(rand, 50, 99), R - randInt(rand, 51, 99)]);
  return {
    key: `${R}:${[...set].join()}:${answer}`,
    prompt: "반올림하여 백의 자리까지 나타낸 수가 다른 하나를 고르세요.",
    answer: String(answer),
    choices: shuffle(rand, [String(answer), ...[...set].map(String)]),
    hint: "십의 자리 숫자를 보고 올릴지 버릴지 정해요.",
    explanation: `나머지는 모두 ${jq(R, "이/가")} 되고, ${jq(answer, "은/는")} ${jq(Math.round(answer / 100) * 100, "이/가")} 돼요.`,
  };
});

export const rdHalfMul = word("l5-rd-half-mul", (rand) => {
  const R = randInt(rand, 5, 60) * 100;
  const k = randInt(rand, 3, 12);
  const hits = Array.from({ length: 100 }, (_, i) => R - 50 + i).filter((n) => n % k === 0);
  return {
    key: `${R}:${k}`,
    prompt: `반올림하여 백의 자리까지 나타내면 ${jq(R, "이/가")} 되는 자연수 중에서 ${k}의 배수는 모두 몇 개인가요?`,
    answer: hits.length,
    unit: "개",
    hint: `반올림하여 ${jq(R, "이/가")} 되는 수의 범위를 먼저 구해요.`,
    explanation: `${R - 50} 이상 ${R + 49} 이하인 수 중 ${k}의 배수: ${hits[0]}부터 ${hits[hits.length - 1]}까지 ${hits.length}개`,
  };
});

export const rdHalfCards = word("l5-rd-half-cards", (rand) => {
  const cards = digitsCards(rand, 4, 0, 9);
  const sorted = [...cards].sort((x, y) => y - x);
  const big = rand() < 0.5;
  const digits = big ? sorted : (() => {
    const asc = [...cards].sort((x, y) => x - y);
    const first = asc.find((d) => d > 0)!;
    return [first, ...asc.filter((d, i) => i !== asc.indexOf(first))];
  })();
  const n = Number(digits.join(""));
  const place = pick(rand, [10, 100, 1000]);
  const v = Math.round(n / place) * place;
  return {
    key: `${cards.join()}:${big}:${place}`,
    prompt: `수 카드 ${jq(cards.join(", "), "을/를")} 한 번씩 모두 사용하여 가장 ${big ? "큰" : "작은"} 네 자리 수를 만들었습니다. 이 수를 반올림하여 ${PLACE[place]}의 자리까지 나타내세요.`,
    answer: v,
    hint: big ? "큰 숫자부터 차례로 놓아요." : "0은 맨 앞에 올 수 없어요. 작은 숫자부터 차례로 놓아요.",
    explanation: `만든 수 ${n} → 반올림하여 ${v}`,
    mistakes: { [n]: "반올림을 하지 않았어요." },
  };
});

export const rdDiff = mid("l5-rd-diff", (rand) => {
  const n = randInt(rand, 1001, 9999);
  const a = Math.round(n / 100) * 100;
  const b = Math.floor(n / 10) * 10;
  if (a === b) return null;
  return {
    key: `${n}`,
    prompt: `${jq(n, "을/를")} 반올림하여 백의 자리까지 나타낸 수와 버림하여 십의 자리까지 나타낸 수의 차는 얼마인가요?`,
    answer: Math.abs(a - b),
    hint: "두 수를 각각 구한 뒤 큰 수에서 작은 수를 빼요.",
    explanation: `반올림 ${a}, 버림 ${b} → ${Math.abs(a - b)}`,
  };
});

export const rdEst = mid("l5-rd-est", (rand) => {
  const a = randInt(rand, 1001, 8999);
  const b = randInt(rand, 1001, 8999);
  const plus = rand() < 0.5 || a === b;
  const [x, y] = plus ? [a, b] : [Math.max(a, b), Math.min(a, b)];
  const rx = Math.round(x / 100) * 100;
  const ry = Math.round(y / 100) * 100;
  const v = plus ? rx + ry : rx - ry;
  if (v === 0 || v === (plus ? x + y : x - y)) return null;
  return {
    key: `${plus}:${x}:${y}`,
    prompt: `${x} ${plus ? "+" : "−"} ${jq(y, "을/를")} 어림하여 계산하려고 합니다. 두 수를 각각 반올림하여 백의 자리까지 나타낸 뒤 계산한 값은 얼마인가요?`,
    answer: v,
    hint: "먼저 두 수를 반올림하여 백의 자리까지 나타내요.",
    explanation: `${x} → ${rx}, ${y} → ${ry} → ${rx} ${plus ? "+" : "−"} ${ry} = ${v}`,
    mistakes: { [plus ? x + y : x - y]: "어림하지 않고 그대로 계산했어요." },
  };
});

export const rdBoxes = word("l5-rd-boxes", (rand) => {
  const per = pick(rand, [10, 100]);
  const n = randInt(rand, per === 10 ? 123 : 1230, per === 10 ? 989 : 9890);
  if (n % per === 0) return null;
  const price = randInt(rand, 3, 9) * (per === 10 ? 1000 : 10000);
  const boxes = Math.floor(n / per);
  return {
    key: `${per}:${n}:${price}`,
    prompt: `귤 ${n}개를 한 상자에 ${per}개씩 담아 한 상자에 ${price}원을 받고 팔려고 합니다. 귤을 팔아서 받을 수 있는 돈은 최대 얼마인가요?`,
    answer: boxes * price,
    unit: "원",
    hint: `${per}개가 안 되는 귤은 상자에 담아 팔 수 없으므로 버림을 해요.`,
    explanation: `${n} → 버림하여 ${boxes * per}, ${boxes}상자 × ${price}원 = ${boxes * price}원`,
    mistakes: { [(boxes + 1) * price]: "상자를 채우지 못한 귤은 팔 수 없어요." },
  };
});

export const rdWho = word("l5-rd-who", (rand) => {
  const [p, q] = two(rand);
  const n = randInt(rand, 10001, 99999);
  const a = Math.round(n / 1000) * 1000;
  const b = Math.ceil(n / 100) * 100;
  if (a === b) return null;
  return {
    key: `${n}`,
    prompt: `${jq(n, "을/를")} ${jq(p, "은/는")} 반올림하여 천의 자리까지, ${jq(q, "은/는")} 올림하여 백의 자리까지 나타내었습니다. 두 사람이 나타낸 수의 차는 얼마인가요?`,
    answer: Math.abs(a - b),
    hint: "각자 어림한 수를 구한 뒤 비교해요.",
    explanation: `${p}: ${a}, ${q}: ${b} → 차 ${Math.abs(a - b)}`,
  };
});

/* ══════════ 5-2-2 분수의 곱셈 ══════════ */

const coprime = (rand: () => number, dMin = 2, dMax = 9): Q | null => {
  const q = properQ(rand, dMin, dMax);
  return gcd(q[0], q[1]) === 1 ? q : null;
};
const cmpSign = (x: number, y: number) => (x > y + 1e-9 ? ">" : x < y - 1e-9 ? "<" : "=");

export const fwMissing = mid("l5-fm-fw-missing", (rand) => {
  const q = coprime(rand, 2, 9);
  if (!q) return null;
  const t = randInt(rand, 1, 6);
  return {
    key: `${q}:${t}`,
    prompt: "□ 안에 알맞은 자연수를 구하세요.",
    expression: `${q[0]}/${q[1]} × □ = ${q[0] * t}`,
    answer: q[1] * t,
    hint: `${q[0]}/${q[1]}에 ${jq(q[1], "을/를")} 곱하면 ${jq(q[0], "이/가")} 돼요.`,
    explanation: `${q[0]}/${q[1]} × ${q[1] * t} = ${q[0] * q[1] * t}/${q[1]} = ${q[0] * t}`,
  };
});

export const fwCmp = mid("l5-fm-fw-cmp", (rand) => {
  const q = coprime(rand, 2, 9);
  if (!q) return null;
  const k = randInt(rand, 2, 9);
  const v = (q[0] * k) / q[1];
  const W = Math.max(1, Math.round(v) + randInt(rand, -1, 1));
  const answer = cmpSign(v, W);
  return {
    key: `${q}:${k}:${W}`,
    prompt: "○ 안에 >, =, < 중 알맞은 것을 고르세요.",
    expression: `${q[0]}/${q[1]} × ${k} ○ ${W}`,
    answer,
    choices: [">", "<", "="],
    hint: "분수의 곱을 먼저 계산해 대분수로 나타내 비교해요.",
    explanation: `${q[0]}/${q[1]} × ${k} = ${reduced(q[0] * k, q[1])} → ${answer}`,
  };
});

export const fwTime = word("l5-fm-fw-time", (rand) => {
  const d = pick(rand, [2, 3, 4, 5, 6, 10, 12]);
  const n = randInt(rand, 1, d - 1);
  if (gcd(n, d) !== 1) return null;
  const k = randInt(rand, 2, 9);
  const min = (60 * n * k) / d;
  // "0시간 ○분"이나 "○시간 0분"이 답이 되지 않게
  if (min < 60 || min % 60 === 0) return null;
  const name = pick(rand, NAMES);
  return {
    key: `${n}/${d}:${k}`,
    prompt: `${jq(name, "은/는")} 하루에 ${n}/${d}시간씩 ${k}일 동안 줄넘기를 했습니다. ${jq(name, "이/가")} 줄넘기를 한 시간은 모두 몇 시간 몇 분인가요?`,
    answer: `${Math.floor(min / 60)},${min % 60}`,
    unit: ["시간", "분"],
    hint: `먼저 ${n}/${d} × ${jq(k, "을/를")} 계산하고, 1시간 = 60분을 이용해요.`,
    explanation: `${n}/${d} × ${k} = ${reduced(n * k, d)}(시간) = ${min}분 = ${Math.floor(min / 60)}시간 ${min % 60}분`,
  };
});

export const mwCalc = easy("l5-fm-mw", (rand) => {
  const a = mixedQ(rand, 3, 2, 9);
  const k = randInt(rand, 2, 6);
  const r: Q = [a[0] * k, a[1]];
  const answer = qText(r);
  const w = Math.floor(a[0] / a[1]);
  const naive = reduced(w * k * a[1] + (a[0] % a[1]), a[1]);
  return {
    key: `${a}:${k}`,
    prompt: "계산하여 기약분수로 나타낸 것을 고르세요.",
    expression: `${qShow(a)} × ${k}`,
    answer,
    choices: fracChoices(rand, answer, [naive, reduced(a[0] * k, a[1] * k), qText([r[0] + a[1], r[1]])], a[1]),
    hint: "대분수를 가분수로 바꾸어 곱하거나, 자연수 부분과 분수 부분에 각각 곱해 더해요.",
    explanation: `${qShow(a)} × ${k} = ${a[0]}/${a[1]} × ${k} = ${a[0] * k}/${a[1]} = ${answer}`,
    mistakes: { [naive]: "분수 부분에도 곱해야 해요." },
  };
});

const mwEx = (rand: () => number): Ex => {
  const a = mixedQ(rand, 3, 2, 6);
  const k = randInt(rand, 2, 5);
  const r: Q = [a[0] * k, a[1]];
  return { text: `${qShow(a)} × ${k}`, value: qVal(r), show: qText(r) };
};
export const mwExtreme = extremeOf("l5-fm-mw-extreme", 2, mwEx, "대분수를 가분수로 바꾸어 곱한 뒤 비교해요.");

export const mwCmp = mid("l5-fm-mw-cmp", (rand) => {
  const a = mixedQ(rand, 2, 2, 7);
  const k = randInt(rand, 2, 6);
  const v = (a[0] * k) / a[1];
  const b = mixedQ(rand, 3, 2, 7);
  const k2 = randInt(rand, 2, 6);
  const v2 = (b[0] * k2) / b[1];
  if (Math.abs(v - v2) > 4) return null;
  const answer = cmpSign(v, v2);
  return {
    key: `${a}:${k}:${b}:${k2}`,
    prompt: "○ 안에 >, =, < 중 알맞은 것을 고르세요.",
    expression: `${qShow(a)} × ${k} ○ ${qShow(b)} × ${k2}`,
    answer,
    choices: [">", "<", "="],
    hint: "양쪽을 각각 계산한 뒤 비교해요.",
    explanation: `${reduced(a[0] * k, a[1])} ${answer} ${reduced(b[0] * k2, b[1])}`,
  };
});

export const mwPerim = word("l5-fm-mw-perim", (rand) => {
  const a = mixedQ(rand, 3, 2, 6);
  const b = mixedQ(rand, 3, 2, 6);
  const s: Q = [a[0] * 3 * b[1] + b[0] * 4 * a[1], a[1] * b[1]];
  const answer = qText(s);
  return {
    key: `${a}:${b}`,
    prompt: `한 변이 ${qShow(a)} cm인 정삼각형과 한 변이 ${qShow(b)} cm인 정사각형이 있습니다. 두 도형의 둘레의 합은 몇 cm인지 고르세요.`,
    answer,
    choices: fracChoices(rand, answer, [qText([a[0] * 4 * b[1] + b[0] * 3 * a[1], a[1] * b[1]]), qText([a[0] * b[1] + b[0] * a[1], a[1] * b[1]]), qText([s[0] + s[1], s[1]])], a[1] * b[1]),
    hint: "정삼각형의 둘레는 (한 변) × 3, 정사각형의 둘레는 (한 변) × 4예요.",
    explanation: `${qShow(a)} × 3 = ${reduced(a[0] * 3, a[1])}, ${qShow(b)} × 4 = ${reduced(b[0] * 4, b[1])} → ${answer} cm`,
  };
});

export const mwError = word("l5-fm-mw-error", (rand) => {
  const name = pick(rand, NAMES);
  const a = mixedQ(rand, 4, 2, 9);
  const k = randInt(rand, 2, 6);
  const w = Math.floor(a[0] / a[1]);
  const f = a[0] % a[1];
  const naive = `${w * k} ${reduced(f, a[1])}`;
  const answer = qText([a[0] * k, a[1]]);
  return {
    key: `${a}:${k}`,
    prompt: `${name}의 풀이: ${qShow(a)} × ${k} = ${naive}. ${jq(name, "이/가")} 잘못 계산한 부분을 바르게 고쳐 계산한 값을 고르세요.`,
    answer,
    choices: fracChoices(rand, answer, [naive, reduced(w * k * a[1] + f * k, a[1] * k), qText([a[0] * k + 1, a[1]])], a[1]),
    hint: "자연수 부분뿐만 아니라 분수 부분에도 자연수를 곱해야 해요.",
    explanation: `${jq(name, "은/는")} 자연수 부분에만 ${jq(k, "을/를")} 곱했어요. ${qShow(a)} × ${k} = ${w * k} + ${reduced(f * k, a[1])} = ${answer}`,
  };
});

export const wfPart = easy("l5-fm-wf-part", (rand) => {
  const q = coprime(rand, 2, 9);
  if (!q) return null;
  const t = randInt(rand, 2, 9);
  const k = q[1] * t;
  return {
    key: `${q}:${k}`,
    prompt: `${k}의 ${jq(`${q[0]}/${q[1]}`, "은/는")} 얼마인가요?`,
    answer: q[0] * t,
    hint: `${jq(k, "을/를")} ${q[1]}묶음으로 나눈 것 중 ${q[0]}묶음이에요.`,
    explanation: `${k} × ${q[0]}/${q[1]} = ${k} ÷ ${q[1]} × ${q[0]} = ${q[0] * t}`,
    mistakes: { [t]: `${jq(q[0], "을/를")} 곱하지 않았어요.` },
  };
});

export const wfCmp = mid("l5-fm-wf-cmp", (rand) => {
  const k = randInt(rand, 3, 30);
  const kind = randInt(rand, 0, 2);
  const q: Q = kind === 0 ? properQ(rand, 2, 9) : kind === 1 ? mixedQ(rand, 2, 2, 9) : [1, 1];
  const text = kind === 2 ? "1" : qShow(q);
  const answer = cmpSign(k * qVal(q), k);
  return {
    key: `${k}:${text}`,
    prompt: "계산하지 않고 ○ 안에 >, =, < 중 알맞은 것을 고르세요.",
    expression: `${k} × ${text} ○ ${k}`,
    answer,
    choices: [">", "<", "="],
    hint: "1보다 작은 수를 곱하면 처음 수보다 작아지고, 1보다 큰 수를 곱하면 커져요.",
    explanation: `${jq(text, "은/는")} 1${kind === 0 ? "보다 작으므로" : kind === 1 ? "보다 크므로" : "이므로"} ${k} × ${text} ${answer} ${k}`,
  };
});

export const wfRemain = word("l5-fm-wf-remain", (rand) => {
  const a = coprime(rand, 2, 6);
  const c = coprime(rand, 2, 5);
  if (!a || !c) return null;
  const N = a[1] * c[1] * randInt(rand, 1, 5) * 100;
  const rest1 = N - (N * a[0]) / a[1];
  const saved = (rest1 * c[0]) / c[1];
  if (!Number.isInteger(saved)) return null;
  const name = pick(rand, NAMES);
  return {
    key: `${N}:${a}:${c}`,
    prompt: `${jq(name, "은/는")} 용돈 ${N}원 중에서 ${jq(`${a[0]}/${a[1]}`, "을/를")} 책을 사는 데 쓰고, 남은 돈의 ${jq(`${c[0]}/${c[1]}`, "을/를")} 저금했습니다. 쓰거나 저금하고 남은 돈은 얼마인가요?`,
    answer: rest1 - saved,
    unit: "원",
    hint: "먼저 책을 사고 남은 돈을 구한 뒤, 그 돈의 몇 분의 몇을 저금했는지 생각해요.",
    explanation: `책값 ${(N * a[0]) / a[1]}원, 남은 돈 ${rest1}원, 저금 ${rest1} × ${c[0]}/${c[1]} = ${saved}원 → ${rest1 - saved}원`,
    mistakes: { [rest1]: "저금한 돈을 빼지 않았어요.", [N - (N * a[0]) / a[1] - (N * c[0]) / c[1]]: "저금한 돈은 처음 용돈이 아니라 남은 돈의 일부예요." },
  };
});

export const wfWho = word("l5-fm-wf-who", (rand) => {
  const [p, r] = two(rand);
  const D = [2, 3, 4, 5, 6, 10, 12, 15, 20];
  const fr = (): Q | null => {
    const d = pick(rand, D);
    const n = randInt(rand, 1, d - 1);
    return gcd(n, d) === 1 ? [n, d] : null;
  };
  const a = fr();
  const b = fr();
  if (!a || !b) return null;
  const x = (60 * a[0]) / a[1];
  const y = (60 * b[0]) / b[1];
  if (x === y) return null;
  return {
    key: `${a}:${b}`,
    prompt: `${jq(p, "은/는")} 1시간의 ${a[0]}/${a[1]} 동안, ${jq(r, "은/는")} 1시간의 ${b[0]}/${b[1]} 동안 책을 읽었습니다. 누가 몇 분 더 오래 읽었는지 구하려고 합니다. 두 사람이 책을 읽은 시간의 차는 몇 분인가요?`,
    answer: Math.abs(x - y),
    unit: "분",
    hint: "1시간은 60분이에요. 60 × (분수)로 각각 몇 분인지 구해요.",
    explanation: `${p}: 60 × ${a[0]}/${a[1]} = ${x}분, ${r}: 60 × ${b[0]}/${b[1]} = ${y}분 → ${jq(x > y ? p : r, "이/가")} ${Math.abs(x - y)}분 더`,
  };
});

export const ffCalc = mid("l5-fm-ff", (rand) => {
  const a = properQ(rand, 2, 9);
  const b = properQ(rand, 2, 9);
  const r = qMul(a, b);
  const answer = qText(r);
  return {
    key: `${a}:${b}`,
    prompt: "계산하여 기약분수로 나타낸 것을 고르세요.",
    expression: `${a[0]}/${a[1]} × ${b[0]}/${b[1]}`,
    answer,
    choices: fracChoices(rand, answer, [reduced(a[0] * b[0], a[1] + b[1]), reduced(a[0] + b[0], a[1] * b[1]), reduced(a[0] * b[1], a[1] * b[0])], a[1] * b[1]),
    hint: "분자는 분자끼리, 분모는 분모끼리 곱하고 약분해요.",
    explanation: `${a[0]} × ${b[0]} / ${a[1]} × ${b[1]} = ${a[0] * b[0]}/${a[1] * b[1]} = ${answer}`,
  };
});

export const ffBox = mid("l5-fm-ff-box", (rand) => {
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, 2, 9);
  return {
    key: `${a}:${b}`,
    prompt: "□ 안에 알맞은 수를 구하세요.",
    expression: `1/${a} × 1/□ = 1/${a * b}`,
    answer: b,
    hint: "단위분수끼리의 곱은 분모끼리 곱해요.",
    explanation: `${a} × □ = ${a * b} → □ = ${b}`,
  };
});

export const ffCards = word("l5-fm-ff-cards", (rand) => {
  const cs = digitsCards(rand, 4, 2, 9).sort((x, y) => x - y);
  const small = rand() < 0.5;
  const P = small ? cs[3] * cs[2] : cs[0] * cs[1];
  const answer = `1/${P}`;
  return {
    key: `${cs.join()}:${small}`,
    prompt: `수 카드 ${cs.join(", ")} 중에서 2장을 골라 1/□ × 1/□의 □ 안에 한 장씩 넣으려고 합니다. 계산 결과가 가장 ${small ? "작은" : "큰"} 곱을 고르세요.`,
    answer,
    choices: choices4(rand, answer, [`1/${small ? cs[0] * cs[1] : cs[3] * cs[2]}`, `1/${small ? cs[3] + cs[2] : cs[0] + cs[1]}`, `1/${cs[1] * cs[2]}`], () => `1/${randInt(rand, 6, 80)}`),
    hint: "단위분수는 분모가 클수록 작아요.",
    explanation: `가장 ${small ? "작은" : "큰"} 곱: 1/${small ? cs[3] : cs[0]} × 1/${small ? cs[2] : cs[1]} = ${answer}`,
  };
});

export const mmCalc = easy("l5-fm-mm", (rand) => {
  const a = mixedQ(rand, 2, 2, 6);
  const b = mixedQ(rand, 2, 2, 6);
  const r = qMul(a, b);
  const answer = qText(r);
  const wa = Math.floor(a[0] / a[1]);
  const wb = Math.floor(b[0] / b[1]);
  const naive = qText([wa * wb * a[1] * b[1] + (a[0] % a[1]) * (b[0] % b[1]), a[1] * b[1]]);
  return {
    key: `${a}:${b}`,
    prompt: "계산하여 기약분수로 나타낸 것을 고르세요.",
    expression: `${qShow(a)} × ${qShow(b)}`,
    answer,
    choices: fracChoices(rand, answer, [naive, qText([r[0] + r[1], r[1]]), qText([a[0] * b[0], a[1] + b[1]])], a[1] * b[1]),
    hint: "대분수를 가분수로 바꾼 뒤 분자끼리, 분모끼리 곱해요.",
    explanation: `${a[0]}/${a[1]} × ${b[0]}/${b[1]} = ${a[0] * b[0]}/${a[1] * b[1]} = ${answer}`,
    mistakes: { [naive]: "자연수끼리, 분수끼리만 곱하면 안 돼요. 가분수로 바꾸어 곱해요." },
  };
});

export const threeMul = mid("l5-fm-three", (rand) => {
  const qs = [properQ(rand, 2, 7), properQ(rand, 2, 7), properQ(rand, 2, 7)];
  const r = qMul(qMul(qs[0], qs[1]), qs[2]);
  const answer = qText(r);
  const num = qs[0][0] * qs[1][0] * qs[2][0];
  const den = qs[0][1] * qs[1][1] * qs[2][1];
  return {
    key: qs.join("|"),
    prompt: "계산하여 기약분수로 나타낸 것을 고르세요.",
    expression: qs.map((q) => `${q[0]}/${q[1]}`).join(" × "),
    answer,
    // 오답: 분수 하나를 빠뜨리고 곱함(약분하지 않은 값은 정답과 값이 같아 걸러진다). 모자라면 1보다 작은 분수로 채운다(진분수 셋의 곱은 1보다 작다)
    choices: choices4(rand, answer, [qText(qMul(qs[0], qs[1])), `${r[0]}/${r[1]}`, qText(qMul(qs[1], qs[2])), qText(qMul(qs[0], qs[2]))].filter((c) => c !== answer), () => {
      const den = randInt(rand, 2, Math.max(r[1], 6));
      return reduced(randInt(rand, 1, den - 1), den);
    }),
    hint: "세 분수의 분자끼리, 분모끼리 곱해요. 약분할 수 있으면 먼저 약분해요.",
    explanation: `${qs.map((q) => q[0]).join(" × ")} = ${num}, ${qs.map((q) => q[1]).join(" × ")} = ${den} → ${num}/${den}${`${num}/${den}` === answer ? "" : ` = ${answer}`}`,
  };
});

export const fmArea = word("l5-fm-area", (rand) => {
  const w = mixedQ(rand, 4, 2, 5);
  const q = coprime(rand, 2, 6);
  // 가로의 (가분수) 분자가 비율의 분모로 나누어떨어질 때만: 세로가 깔끔해지고 넓이의 분모가 25 이하가 된다(2 17/32 m² 같은 값이 나오지 않게)
  if (!q || w[0] % q[1] !== 0) return null;
  const h = qMul(w, q);
  const A = qMul(w, h);
  const answer = qText(A);
  return {
    key: `${w}:${q}`,
    prompt: `가로가 ${qShow(w)} m이고 세로는 가로의 ${q[0]}/${q[1]}인 직사각형 모양의 꽃밭이 있습니다. 꽃밭의 넓이는 몇 m²인지 고르세요.`,
    answer,
    choices: fracChoices(rand, answer, [qText(h), qText(qMul(w, w)), qText([A[0] + A[1], A[1]])], A[1]),
    hint: "먼저 세로의 길이를 구한 뒤 (가로) × (세로)를 계산해요.",
    explanation: `세로 ${qShow(w)} × ${q[0]}/${q[1]} = ${qText(h)} m, 넓이 ${qShow(w)} × ${qText(h)} = ${answer} m²`,
  };
});

export const fmRange = word("l5-fm-range", (rand) => {
  const a = mixedQ(rand, 3, 2, 7);
  const b = mixedQ(rand, 2, 2, 7);
  const v = qVal(qMul(a, b));
  const ans = Number.isInteger(v) ? v - 1 : Math.floor(v);
  return {
    key: `${a}:${b}`,
    prompt: "□ 안에 들어갈 수 있는 자연수 중에서 가장 큰 수를 구하세요.",
    expression: `□ < ${qShow(a)} × ${qShow(b)}`,
    answer: ans,
    hint: "오른쪽 곱을 대분수로 나타내 보세요.",
    explanation: `${qShow(a)} × ${qShow(b)} = ${qText(qMul(a, b))} → 가장 큰 자연수 ${ans}`,
  };
});

/* ══════════ 5-2-3 합동과 대칭 ══════════ */

const POLY = ["", "", "", "삼각형", "사각형", "오각형", "육각형", "칠각형", "팔각형"];

export const cgPairs = mid("l5-cg-pairs", (rand) => {
  const n = randInt(rand, 3, 8);
  const all = rand() < 0.4;
  const part = pick(rand, ["대응점", "대응변", "대응각"]);
  return {
    key: `${n}:${all}:${part}`,
    prompt: all ? `서로 합동인 두 ${POLY[n]}에서 대응점, 대응변, 대응각은 모두 몇 쌍인가요?` : `서로 합동인 두 ${POLY[n]}에서 ${jq(part, "은/는")} 몇 쌍인가요?`,
    answer: all ? 3 * n : n,
    unit: "쌍",
    hint: `${jq(POLY[n], "은/는")} 꼭짓점, 변, 각이 각각 ${n}개씩이에요.`,
    explanation: all ? `${n} + ${n} + ${n} = ${3 * n}(쌍)` : `${n}쌍`,
  };
});

export const cgIso = word("l5-cg-iso", (rand) => {
  const s = randInt(rand, 4, 15);
  const b = randInt(rand, 2, 2 * s - 1);
  if (b === s) return null;
  const P = 2 * s + b;
  return {
    key: `${s}:${b}`,
    prompt: `둘레가 ${P} cm이고 밑변이 ${b} cm인 이등변삼각형 2개는 서로 합동입니다. 두 삼각형의 밑변끼리 꼭 맞게 붙여 마름모를 만들었을 때, 마름모의 둘레는 몇 cm인가요?`,
    answer: 4 * s,
    unit: "cm",
    hint: "먼저 이등변삼각형의 길이가 같은 두 변 중 한 변의 길이를 구해요.",
    explanation: `한 변 (${P} − ${b}) ÷ 2 = ${s}(cm), 마름모 둘레 ${s} × 4 = ${4 * s}(cm)`,
    mistakes: { [2 * P]: "붙인 밑변은 둘레가 아니에요." },
  };
});

/** 대칭축이 세로인 집 모양 오각형: 지붕 r, 벽 h, 밑변의 절반 w(cm). 좌표는 길이에 비례해 계산한다 */
export const symLinePerim = word("l5-sym-line-perim", (rand) => {
  const w = randInt(rand, 3, 10);
  // 지붕이 밑변의 절반보다 길어야 오각형이 된다(r = w면 지붕이 평평해진다)
  const r = randInt(rand, w + 2, w + 8);
  const h = randInt(rand, 3, 14);
  const rise = Math.sqrt(r * r - w * w);
  const tall = rise + h;
  if (tall / (2 * w) < 0.5 || tall / (2 * w) > 2.2) return null;
  const k = Math.min(150 / (2 * w), 140 / tall);
  const [cx, top] = [120, 24];
  const p = (x: number, y: number): [number, number] => [Math.round((cx + x * k) * 10) / 10, Math.round((top + y * k) * 10) / 10];
  const pts = [p(0, 0), p(-w, rise), p(-w, tall), p(w, tall), p(w, rise)];
  const bottom = pts[2][1];
  const visual: ShapeScene = {
    kind: "shape",
    width: 240,
    height: Math.ceil(bottom + 36),
    label: "대칭축이 세로로 그어진 집 모양의 오각형, 왼쪽 절반에 지붕·벽·밑변 절반의 길이",
    polygons: [{ points: pts }],
    lines: [{ from: [cx, top - 14], to: [cx, bottom + 10], dashed: true }],
    texts: [
      sideText(pts[0], pts[1], pts, `${r} cm`),
      sideText(pts[1], pts[2], pts, `${h} cm`),
      { at: [Math.round(((pts[2][0] + cx) / 2) * 10) / 10, bottom + 24], text: `${w} cm` },
    ],
  };
  if (textsClash(visual)) return null;
  return {
    key: `${r}:${h}:${w}`,
    prompt: "점선을 대칭축으로 하는 선대칭도형입니다. 이 도형의 둘레는 몇 cm인가요?",
    visual,
    answer: 2 * (r + h + w),
    unit: "cm",
    hint: "대응변의 길이는 같아요. 대칭축 오른쪽 부분의 변의 길이도 왼쪽과 같아요.",
    explanation: `(${r} + ${h} + ${w}) × 2 = ${2 * (r + h + w)}(cm)`,
    mistakes: { [r + h + w]: "한쪽만 더했어요.", [2 * (r + h) + w]: "밑변은 대칭축 양쪽으로 나뉘어 있어요." },
  };
});

const SYM_ALL = [
  { name: "정삼각형", line: true, point: false },
  { name: "정사각형", line: true, point: true },
  { name: "직사각형", line: true, point: true },
  { name: "마름모", line: true, point: true },
  { name: "평행사변형", line: false, point: true },
  { name: "이등변삼각형", line: true, point: false },
  { name: "원", line: true, point: true },
  { name: "정육각형", line: true, point: true },
  { name: "정오각형", line: true, point: false },
];

export const symBoth = word("l5-sym-both", (rand) => {
  const five = shuffle(rand, SYM_ALL).slice(0, 5);
  const hit = five.filter((x) => x.line && x.point);
  const neither = rand() < 0.3;
  const hit2 = five.filter((x) => x.line !== x.point);
  const list = neither ? hit2 : hit;
  return {
    key: `${neither}:${five.map((x) => x.name).join()}`,
    prompt: neither
      ? `${five.map((x) => x.name).join(", ")} 중에서 선대칭도형과 점대칭도형 중 한 가지만 되는 도형은 모두 몇 개인가요?`
      : `${five.map((x) => x.name).join(", ")} 중에서 선대칭도형이면서 점대칭도형인 것은 모두 몇 개인가요?`,
    answer: list.length,
    unit: "개",
    hint: "각 도형이 접어서 겹치는지(선대칭), 180° 돌려서 겹치는지(점대칭) 하나씩 확인해요.",
    explanation: `${list.map((x) => x.name).join(", ") || "없음"} → ${list.length}개`,
  };
});

/* ══════════ 5-2-4 소수의 곱셈 ══════════ */

const dec = (x: number, p: number) => trim(x / 10 ** p, p);

export const dwAdd = mid("l5-dm-dw-add", (rand) => {
  const x = randInt(rand, 1, 9);
  const p = randInt(rand, 1, 2);
  const k = randInt(rand, 3, 9);
  const d = p === 1 ? `0.${x}` : `0.0${x}`;
  return {
    key: `${x}:${p}:${k}`,
    prompt: `${jq(d, "을/를")} ${k}번 더한 수는 얼마인가요?`,
    answer: dec(x * k, p),
    hint: `${jq(d, "을/를")} ${k}번 더한 것은 ${d} × ${jq(k, "과/와")} 같아요.`,
    explanation: `${d} × ${k} = ${dec(x * k, p)}`,
    mistakes: { [String(x * k)]: "소수점을 찍지 않았어요." },
  };
});

export const dwCmp = mid("l5-dm-dw-cmp", (rand) => {
  const x = randInt(rand, 11, 99);
  const k = randInt(rand, 2, 9);
  // 8.0처럼 자연수가 되는 소수는 빼서 늘 (소수) × (자연수)가 되게
  if (x % 10 === 0) return null;
  const v = (x * k) / 10;
  const y = Number((v + pick(rand, [-0.1, 0, 0.1, -1, 1])).toFixed(1));
  const answer = cmpSign(v, y);
  return {
    key: `${x}:${k}:${y}`,
    prompt: "○ 안에 >, =, < 중 알맞은 것을 고르세요.",
    expression: `${dec(x, 1)} × ${k} ○ ${trim(y, 1)}`,
    answer,
    choices: [">", "<", "="],
    hint: "곱을 먼저 계산한 뒤 비교해요.",
    explanation: `${dec(x, 1)} × ${k} = ${trim(v, 1)} → ${answer}`,
  };
});

export const dwWho = word("l5-dm-dw-who", (rand) => {
  const [p, q] = two(rand);
  const a = randInt(rand, 5, 25);
  const b = randInt(rand, 5, 25);
  const m = randInt(rand, 3, 7);
  const n = randInt(rand, 3, 7);
  if (a * m === b * n) return null;
  const x = (a * m) / 10;
  const y = (b * n) / 10;
  return {
    key: `${a}:${m}:${b}:${n}`,
    prompt: `${jq(p, "은/는")} 매일 ${dec(a, 1)} km씩 ${m}일 동안 걸었고, ${jq(q, "은/는")} 매일 ${dec(b, 1)} km씩 ${n}일 동안 걸었습니다. 누가 몇 km 더 걸었는지 구하려고 합니다. 두 사람이 걸은 거리의 차는 몇 km인가요?`,
    answer: trim(Math.abs(x - y), 1),
    unit: "km",
    hint: "각자 걸은 거리를 (소수) × (자연수)로 구한 뒤 비교해요.",
    explanation: `${p}: ${trim(x, 1)} km, ${q}: ${trim(y, 1)} km → ${jq(x > y ? p : q, "이/가")} ${trim(Math.abs(x - y), 1)} km 더`,
  };
});

export const wdCalc = easy("l5-dm-wd", (rand) => {
  const k = randInt(rand, 2, 30);
  const x = randInt(rand, 2, 99);
  const p = randInt(rand, 1, 2);
  return {
    key: `${k}:${x}:${p}`,
    prompt: "계산해 보세요.",
    expression: `${k} × ${dec(x, p)} = □`,
    answer: dec(k * x, p),
    hint: "자연수처럼 곱한 뒤, 곱하는 소수의 소수점 아래 자리 수만큼 소수점을 찍어요.",
    explanation: `${k} × ${x} = ${k * x} → ${dec(k * x, p)}`,
    mistakes: { [String(k * x)]: "소수점을 찍지 않았어요." },
  };
});

export const wdMissing = mid("l5-dm-wd-missing", (rand) => {
  const k = randInt(rand, 2, 9);
  const x = randInt(rand, 1, 9);
  return {
    key: `${k}:${x}`,
    prompt: "□ 안에 알맞은 소수를 구하세요.",
    expression: `${k} × □ = ${dec(k * x, 1)}`,
    answer: `0.${x}`,
    hint: `${k} × ${x} = ${jq(k * x, "이에요/예요")}. 곱이 소수 한 자리 수이면 곱한 소수도 소수 한 자리 수예요.`,
    explanation: `${k} × 0.${x} = ${dec(k * x, 1)}`,
  };
});

export const wdPrice = word("l5-dm-wd-price", (rand) => {
  const p = randInt(rand, 5, 30) * 100;
  const x = randInt(rand, 11, 49);
  const cost = (p * x) / 10;
  const pay = Math.ceil((cost + 1) / 10000) * 10000;
  return {
    key: `${p}:${x}`,
    prompt: `1 m에 ${p}원인 리본을 ${dec(x, 1)} m 사고 ${pay}원을 냈습니다. 거스름돈은 얼마인가요?`,
    answer: pay - cost,
    unit: "원",
    hint: `먼저 리본값 ${p} × ${jq(dec(x, 1), "을/를")} 계산해요.`,
    explanation: `${p} × ${dec(x, 1)} = ${cost}(원), ${pay} − ${cost} = ${pay - cost}(원)`,
    mistakes: { [cost]: "리본값까지만 구했어요." },
  };
});

export const wdWrong = word("l5-dm-wd-wrong", (rand) => {
  const n = randInt(rand, 3, 40);
  const x = randInt(rand, 1, 9);
  const r = n + x / 10;
  return {
    key: `${n}:${x}`,
    prompt: `어떤 자연수에 0.${jq(x, "을/를")} 곱해야 할 것을 잘못하여 더했더니 ${jq(trim(r, 1), "이/가")} 되었습니다. 바르게 계산한 값을 구하세요.`,
    answer: dec(n * x, 1),
    hint: "잘못 계산한 식으로 어떤 수를 먼저 구해요.",
    explanation: `어떤 수 = ${trim(r, 1)} − 0.${x} = ${n}, 바르게: ${n} × 0.${x} = ${dec(n * x, 1)}`,
    mistakes: { [n]: "어떤 수까지만 구했어요." },
  };
});

const ddEx = (rand: () => number): Ex | null => {
  const x = randInt(rand, 2, 49);
  const y = randInt(rand, 2, 49);
  // 두 수 모두 소수(2.0 같은 자연수는 빼고)
  if (x % 10 === 0 || y % 10 === 0) return null;
  return { text: `${dec(x, 1)} × ${dec(y, 1)}`, value: (x * y) / 100, show: dec(x * y, 2) };
};
export const ddExtreme = extremeOf("l5-dm-dd-extreme", 2, ddEx, "자연수처럼 곱한 뒤 소수점 아래 두 자리가 되게 소수점을 찍어 비교해요.");

export const ddArea = word("l5-dm-dd-area", (rand) => {
  const a = randInt(rand, 12, 49);
  const b = randInt(rand, 12, 49);
  const c = randInt(rand, 12, 49);
  const d = randInt(rand, 12, 49);
  if (a * b === c * d) return null;
  return {
    key: `${a}:${b}:${c}:${d}`,
    prompt: `가 텃밭은 가로 ${dec(a, 1)} m, 세로 ${dec(b, 1)} m이고, 나 텃밭은 가로 ${dec(c, 1)} m, 세로 ${dec(d, 1)} m인 직사각형 모양입니다. 두 텃밭의 넓이의 차는 몇 m²인가요?`,
    answer: dec(Math.abs(a * b - c * d), 2),
    unit: "m²",
    hint: "두 넓이를 각각 (소수) × (소수)로 구한 뒤 큰 쪽에서 작은 쪽을 빼요.",
    explanation: `가 ${dec(a * b, 2)} m², 나 ${dec(c * d, 2)} m² → ${jq(a * b > c * d ? "가" : "나", "이/가")} ${dec(Math.abs(a * b - c * d), 2)} m² 더 넓어요.`,
  };
});

export const posEasy = easy("l5-dm-pos", (rand) => {
  const x = randInt(rand, 11, 999);
  const p = randInt(rand, 1, 2);
  const e = pick(rand, [1, 2, 3]);
  const up = rand() < 0.5;
  const f = up ? String(10 ** e) : dec(1, e);
  const v = up ? (x * 10 ** e) / 10 ** p : x / 10 ** (p + e);
  return {
    key: `${x}:${p}:${e}:${up}`,
    prompt: "계산해 보세요.",
    expression: `${dec(x, p)} × ${f} = □`,
    answer: trim(v, p + e),
    hint: up ? `${jq(f, "을/를")} 곱하면 소수점이 오른쪽으로 ${e}칸 옮겨져요.` : `${jq(f, "을/를")} 곱하면 소수점이 왼쪽으로 ${e}칸 옮겨져요.`,
    explanation: `${dec(x, p)} × ${f} = ${trim(v, p + e)}`,
  };
});

export const posGiven = mid("l5-dm-pos-given", (rand) => {
  const a = randInt(rand, 11, 99);
  const b = randInt(rand, 11, 99);
  const pa = randInt(rand, 0, 2);
  const pb = randInt(rand, 1, 2);
  return {
    key: `${a}:${b}:${pa}:${pb}`,
    prompt: `${a} × ${b} = ${jq(a * b, "을/를")} 이용하여 계산해 보세요.`,
    expression: `${dec(a, pa)} × ${dec(b, pb)} = □`,
    answer: dec(a * b, pa + pb),
    hint: "곱하는 두 수의 소수점 아래 자리 수를 더한 만큼 곱의 소수점 아래 자리 수가 생겨요.",
    explanation: `소수점 아래 ${pa} + ${pb} = ${pa + pb}자리 → ${dec(a * b, pa + pb)}`,
  };
});

const FACTORS = ["10", "100", "1000", "0.1", "0.01", "0.001"];
export const posBox = mid("l5-dm-pos-box", (rand) => {
  const x = randInt(rand, 11, 999);
  const p = randInt(rand, 1, 2);
  const f = pick(rand, FACTORS);
  const v = (x / 10 ** p) * Number(f);
  const others = shuffle(rand, FACTORS.filter((y) => y !== f)).slice(0, 3);
  return {
    key: `${x}:${p}:${f}`,
    prompt: "□ 안에 알맞은 수를 고르세요.",
    expression: `${dec(x, p)} × □ = ${trim(v, 6)}`,
    answer: f,
    choices: shuffle(rand, [f, ...others]),
    hint: "소수점이 오른쪽으로 옮겨졌으면 10, 100, 1000을, 왼쪽으로 옮겨졌으면 0.1, 0.01, 0.001을 곱한 거예요.",
    explanation: `${dec(x, p)} × ${f} = ${trim(v, 6)}`,
  };
});

export const posCards = word("l5-dm-pos-cards", (rand) => {
  const cs = digitsCards(rand, 3, 1, 9);
  const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].map(([i, j, k]) => ({ t: `${cs[i]}.${cs[j]} × ${cs[k]}`, v: (cs[i] * 10 + cs[j]) * cs[k] }));
  const big = rand() < 0.5;
  const best = perms.reduce((m, x) => ((big ? x.v > m.v : x.v < m.v) ? x : m));
  return {
    key: `${cs.join()}:${big}`,
    prompt: `수 카드 ${jq(cs.join(", "), "을/를")} 한 번씩 모두 사용하여 (소수 한 자리 수) × (한 자리 수)의 곱셈식 □.□ × □를 만들려고 합니다. 곱이 가장 ${big ? "큰" : "작은"} 값은 얼마인가요?`,
    answer: dec(best.v, 1),
    hint: "여러 가지로 식을 만들어 곱을 비교해요. 곱하는 한 자리 수와 소수의 일의 자리 수가 곱에 크게 영향을 줘요.",
    explanation: `${best.t} = ${dec(best.v, 1)}`,
  };
});

export const posError = word("l5-dm-pos-error", (rand) => {
  const name = pick(rand, NAMES);
  const a = randInt(rand, 11, 99);
  const b = randInt(rand, 11, 99);
  const pa = randInt(rand, 1, 2);
  const pb = 1;
  const right = dec(a * b, pa + pb);
  const wrong = dec(a * b, Math.max(pa, pb));
  if (right === wrong) return null;
  return {
    key: `${a}:${b}:${pa}`,
    prompt: `${jq(name, "은/는")} ${dec(a, pa)} × ${dec(b, pb)}의 곱을 ${jq(wrong, "이라고/라고")} 답했습니다. ${jq(name, "이/가")} 잘못 계산한 까닭을 생각하며 바르게 계산한 값을 구하세요.`,
    answer: right,
    hint: "곱의 소수점 아래 자리 수는 두 수의 소수점 아래 자리 수의 합이에요.",
    explanation: `${jq(name, "은/는")} 소수점 아래 자리 수를 더하지 않았어요. ${a} × ${b} = ${a * b}, 소수점 아래 ${pa + pb}자리 → ${right}`,
    mistakes: { [wrong]: `${jq(name, "과/와")} 같은 잘못을 했어요.` },
  };
});

/* ══════════ 5-2-5 직육면체 ══════════ */

const CUBE_TRUE = ["정육면체는 직육면체라고 할 수 있습니다.", "직육면체의 면은 모두 직사각형입니다.", "정육면체의 모서리의 길이는 모두 같습니다.", "직육면체와 정육면체의 꼭짓점의 수는 같습니다.", "정육면체의 면은 모두 합동입니다."];
const CUBE_FALSE = ["직육면체는 정육면체라고 할 수 있습니다.", "직육면체의 모서리의 길이는 모두 같습니다.", "직육면체의 면은 모두 합동입니다.", "직육면체의 꼭짓점은 12개입니다.", "정육면체의 면은 6개이고 모서리는 8개입니다."];

export const cbTrue = mid("l5-cb-true", (rand) => {
  const wrong = rand() < 0.5;
  const answer = pick(rand, wrong ? CUBE_FALSE : CUBE_TRUE);
  const others = shuffle(rand, wrong ? CUBE_TRUE : CUBE_FALSE).slice(0, 3);
  return {
    key: `${wrong}:${answer}:${others.join()}`,
    prompt: wrong ? "직육면체와 정육면체에 대한 설명으로 틀린 것을 고르세요." : "직육면체와 정육면체에 대한 설명으로 옳은 것을 고르세요.",
    answer,
    choices: shuffle(rand, [answer, ...others]),
    hint: "정육면체는 정사각형 6개로 둘러싸인 도형이고, 직육면체는 직사각형 6개로 둘러싸인 도형이에요.",
    explanation: `${wrong ? "틀린" : "옳은"} 설명: ${answer}`,
  };
});

const PARTS = [
  { k: "면", n: 6 },
  { k: "모서리", n: 12 },
  { k: "꼭짓점", n: 8 },
];

export const cbCountSum = mid("l5-cb-count-sum", (rand) => {
  const [x, y] = shuffle(rand, PARTS).slice(0, 2);
  const diff = rand() < 0.4;
  const solid = pick(rand, ["직육면체", "정육면체"]);
  const v = diff ? Math.abs(x.n - y.n) : x.n + y.n;
  return {
    key: `${x.k}:${y.k}:${diff}:${solid}`,
    prompt: `${solid}의 ${x.k}의 수와 ${y.k}의 수의 ${diff ? "차는" : "합은"} 얼마인가요?`,
    answer: v,
    hint: "면 6개, 모서리 12개, 꼭짓점 8개예요.",
    explanation: `${x.k} ${x.n}개, ${y.k} ${y.n}개 → ${v}`,
  };
});

export const cbParArea = mid("l5-cb-par-area", (rand) => {
  const a = randInt(rand, 3, 15);
  const b = randInt(rand, 3, 15);
  const c = randInt(rand, 3, 15);
  const face = pick(rand, [
    { name: "앞면", v: a * c },
    { name: "옆면", v: b * c },
    { name: "윗면", v: a * b },
  ]);
  return {
    key: `${a}:${b}:${c}:${face.name}`,
    prompt: `직육면체의 겨냥도입니다. ${jq(face.name, "과/와")} 평행한 면의 넓이는 몇 cm²인가요?`,
    visual: cuboidSketch(a, b, c, { labels: [`${a} cm`, `${b} cm`, `${c} cm`] }),
    answer: face.v,
    unit: "cm²",
    hint: `서로 평행한 두 면은 모양과 크기가 같아요. ${face.name}의 넓이를 구하면 돼요.`,
    explanation: `${jq(face.name, "과/와")} 평행한 면은 ${jq(face.name, "과/와")} 합동 → ${face.v} cm²`,
  };
});

export const cbPerpEdges = mid("l5-cb-perp-edges", (rand) => {
  const a = randInt(rand, 3, 15);
  const b = randInt(rand, 3, 15);
  const c = randInt(rand, 3, 15);
  return {
    key: `${a}:${b}:${c}`,
    prompt: `직육면체의 겨냥도입니다. 밑면(바닥에 닿은 면)과 수직인 모서리의 길이를 모두 더하면 몇 cm인가요?`,
    visual: cuboidSketch(a, b, c, { labels: [`${a} cm`, `${b} cm`, `${c} cm`] }),
    answer: 4 * c,
    unit: "cm",
    hint: "밑면과 수직인 모서리는 높이를 나타내는 모서리 4개예요.",
    explanation: `${c} × 4 = ${4 * c}(cm)`,
  };
});

export const cbDice = word("l5-cb-dice", (rand) => {
  const pairs = shuffle(rand, [[1, 6], [2, 5], [3, 4]]);
  const seen = pairs.map((p) => pick(rand, p));
  const sum = seen.reduce((s, x) => s + x, 0);
  return {
    key: seen.join(),
    prompt: `마주 보는 두 면의 눈의 수의 합이 7인 주사위가 있습니다. 주사위를 놓았을 때 위, 앞, 오른쪽 면의 눈이 각각 ${seen.join(", ")}입니다. 보이지 않는 세 면의 눈의 수의 합은 얼마인가요?`,
    answer: 21 - sum,
    hint: "보이지 않는 세 면은 보이는 세 면과 각각 마주 보는 면이에요.",
    explanation: seen.map((x) => `${7 - x}`).join(" + ") + ` = ${21 - sum}`,
  };
});

const SKETCH_TRUE = ["보이는 모서리는 실선으로 그립니다.", "보이지 않는 모서리는 점선으로 그립니다.", "보이는 면은 3개입니다.", "보이지 않는 꼭짓점은 1개입니다."];
const SKETCH_FALSE = ["보이지 않는 모서리는 실선으로 그립니다.", "보이는 모서리는 점선으로 그립니다.", "보이는 면은 4개입니다.", "보이지 않는 모서리는 4개입니다."];

export const cbSketch = easy("l5-cb-sketch", (rand) => {
  const right = rand() < 0.5;
  const answer = pick(rand, right ? SKETCH_TRUE : SKETCH_FALSE);
  const others = shuffle(rand, right ? SKETCH_FALSE : SKETCH_TRUE).slice(0, 3);
  return {
    key: `${right}:${answer}:${others.join()}`,
    prompt: right ? "직육면체의 겨냥도에 대한 설명으로 옳은 것을 고르세요." : "직육면체의 겨냥도에 대한 설명으로 옳지 않은 것을 고르세요.",
    visual: cuboidSketch(randInt(rand, 6, 9), randInt(rand, 4, 7), randInt(rand, 3, 6)),
    answer,
    choices: shuffle(rand, [answer, ...others]),
    hint: "겨냥도에서 보이는 모서리는 실선, 보이지 않는 모서리는 점선으로 그려요.",
    explanation: `${right ? "옳은" : "옳지 않은"} 것: ${answer}`,
  };
});

export const cbHiddenLen = mid("l5-cb-hidden-len", (rand) => {
  const a = randInt(rand, 3, 15);
  const b = randInt(rand, 3, 15);
  const c = randInt(rand, 3, 15);
  return {
    key: `${a}:${b}:${c}`,
    prompt: "직육면체의 겨냥도에서 보이지 않는 모서리의 길이를 모두 더하면 몇 cm인가요?",
    visual: cuboidSketch(a, b, c, { labels: [`${a} cm`, `${b} cm`, `${c} cm`] }),
    answer: a + b + c,
    unit: "cm",
    hint: "점선으로 그린 모서리 3개의 길이를 더해요. 가로, 세로, 높이가 한 개씩이에요.",
    explanation: `${a} + ${b} + ${c} = ${a + b + c}(cm)`,
  };
});

export const cbVisibleLen = word("l5-cb-visible-len", (rand) => {
  const a = randInt(rand, 3, 15);
  const b = randInt(rand, 3, 15);
  const c = randInt(rand, 3, 15);
  return {
    key: `${a}:${b}:${c}`,
    prompt: "직육면체의 겨냥도에서 보이는 모서리의 길이를 모두 더하면 몇 cm인가요?",
    visual: cuboidSketch(a, b, c, { labels: [`${a} cm`, `${b} cm`, `${c} cm`] }),
    answer: 3 * (a + b + c),
    unit: "cm",
    hint: "보이는 모서리는 9개이고, 가로·세로·높이를 나타내는 모서리가 3개씩 있어요.",
    explanation: `(${a} + ${b} + ${c}) × 3 = ${3 * (a + b + c)}(cm)`,
    mistakes: { [4 * (a + b + c)]: "보이지 않는 모서리까지 더했어요." },
  };
});

export const cbHiddenRev = word("l5-cb-hidden-rev", (rand) => {
  const a = randInt(rand, 3, 15);
  const b = randInt(rand, 3, 15);
  const c = randInt(rand, 3, 15);
  return {
    key: `${a}:${b}:${c}`,
    prompt: `직육면체의 겨냥도에서 보이는 모서리의 길이의 합이 ${3 * (a + b + c)} cm입니다. 가로가 ${a} cm, 세로가 ${b} cm일 때 높이는 몇 cm인가요?`,
    answer: c,
    unit: "cm",
    hint: "보이는 모서리의 합은 (가로 + 세로 + 높이) × 3이에요.",
    explanation: `${3 * (a + b + c)} ÷ 3 = ${a + b + c}, ${a + b + c} − ${a} − ${b} = ${c}(cm)`,
  };
});

export const netOpp = easy("l5-cb-net-opp", (rand) => {
  const n = cubeNet(rand);
  const i = randInt(rand, 0, 5);
  const answer = n.names[n.opp[i]];
  const others = shuffle(rand, n.names.filter((_, j) => j !== i && j !== n.opp[i])).slice(0, 3);
  return {
    key: `${n.cells.flat().join()}:${n.names.join()}:${i}`,
    prompt: `정육면체의 전개도를 접었을 때 면 ${jq(n.names[i], "과/와")} 평행한 면을 고르세요.`,
    visual: n.scene,
    answer,
    choices: shuffle(rand, [answer, ...others]),
    hint: "한 줄로 이어진 네 면에서는 한 칸 건너뛴 면끼리 마주 봐요.",
    explanation: `면 ${jq(n.names[i], "과/와")} 마주 보는 면은 면 ${answer}입니다.`,
  };
});

export const netDice = mid("l5-cb-net-dice", (rand) => {
  const n = cubeNet(rand, ["", "", "", "", "", ""]);
  const pairs = shuffle(rand, [[1, 6], [2, 5], [3, 4]]).map((p) => shuffle(rand, p));
  const nums = ["", "", "", "", "", ""];
  let k = 0;
  for (let i = 0; i < 6; i++) {
    if (nums[i]) continue;
    nums[i] = String(pairs[k][0]);
    nums[n.opp[i]] = String(pairs[k][1]);
    k++;
  }
  const blank = randInt(rand, 0, 5);
  const answer = Number(nums[blank]);
  nums[blank] = "□";
  return {
    key: `${n.cells.flat().join()}:${nums.join()}`,
    prompt: "마주 보는 두 면의 눈의 수의 합이 7이 되도록 주사위의 전개도를 만들었습니다. □ 안에 알맞은 수를 구하세요.",
    visual: { ...n.scene, texts: n.scene.texts!.map((t, i) => ({ ...t, text: nums[i] })) },
    answer,
    hint: "□와 마주 보는 면을 먼저 찾아요.",
    explanation: `□와 마주 보는 면의 수는 ${7 - answer}이므로 □ = 7 − ${7 - answer} = ${answer}`,
  };
});

export const netPerim = mid("l5-cb-net-perim", (rand) => {
  const a = randInt(rand, 2, 15);
  const n = cubeNet(rand, ["", "", "", "", "", ""]);
  return {
    key: `${a}:${n.cells.flat().join()}`,
    prompt: `한 모서리가 ${a} cm인 정육면체의 전개도입니다. 전개도의 둘레는 몇 cm인가요?`,
    visual: n.scene,
    answer: 14 * a,
    unit: "cm",
    hint: "전개도의 둘레에 있는 선분의 수를 세어 보세요.",
    explanation: `둘레의 선분 14개 → ${a} × 14 = ${14 * a}(cm)`,
    mistakes: { [24 * a]: "안쪽 선분까지 세었어요." },
  };
});

export const netPerpSum = word("l5-cb-net-perp-sum", (rand) => {
  const nums = shuffle(rand, Array.from({ length: 20 }, (_, i) => i + 1)).slice(0, 6);
  const n = cubeNet(rand, nums.map(String));
  const i = randInt(rand, 0, 5);
  const sum = nums.reduce((s, x, j) => (j === i || j === n.opp[i] ? s : s + x), 0);
  return {
    key: `${n.cells.flat().join()}:${nums.join()}:${i}`,
    prompt: `정육면체의 전개도의 각 면에 수가 적혀 있습니다. 전개도를 접었을 때 ${jq(nums[i], "이/가")} 적힌 면과 수직인 면에 적힌 수의 합은 얼마인가요?`,
    visual: n.scene,
    answer: sum,
    hint: "한 면과 수직인 면은 4개예요. 그 면 자신과 마주 보는 면을 뺀 나머지 면이에요.",
    explanation: `마주 보는 면은 ${nums[n.opp[i]]} → 나머지 네 면의 합 ${sum}`,
  };
});

export const netArea = word("l5-cb-net-area", (rand) => {
  const a = randInt(rand, 2, 12);
  return {
    key: `${a}`,
    prompt: `넓이가 ${6 * a * a} cm²인 정육면체의 전개도가 있습니다. 이 전개도를 접어 만든 정육면체의 모든 모서리의 길이의 합은 몇 cm인가요?`,
    answer: 12 * a,
    unit: "cm",
    hint: "전개도는 합동인 정사각형 6개로 이루어져 있어요. 먼저 한 면의 넓이를 구해요.",
    explanation: `한 면 ${6 * a * a} ÷ 6 = ${a * a}(cm²), 한 모서리 ${a} cm, ${a} × 12 = ${12 * a}(cm)`,
  };
});

export const cbCubeEqual = mid("l5-cb-cube-equal", (rand) => {
  const a = randInt(rand, 3, 15);
  const b = randInt(rand, 3, 15);
  const c = randInt(rand, 3, 15);
  // 세 길이가 모두 같으면 이미 정육면체라 답이 드러난다
  if ((a + b + c) % 3 || (a === b && b === c)) return null;
  return {
    key: `${a}:${b}:${c}`,
    prompt: `가로 ${a} cm, 세로 ${b} cm, 높이 ${c} cm인 직육면체와 모든 모서리의 길이의 합이 같은 정육면체가 있습니다. 정육면체의 한 모서리는 몇 cm인가요?`,
    answer: (a + b + c) / 3,
    unit: "cm",
    hint: "직육면체의 모든 모서리의 합은 (가로 + 세로 + 높이) × 4, 정육면체는 (한 모서리) × 12예요.",
    explanation: `(${a} + ${b} + ${c}) × 4 = ${4 * (a + b + c)}, ${4 * (a + b + c)} ÷ 12 = ${(a + b + c) / 3}(cm)`,
  };
});

/* ══════════ 5-2-6 평균과 가능성 ══════════ */

function meanData(rand: () => number, n: number, lo: number, hi: number) {
  const mean = randInt(rand, lo, hi);
  const vals = Array.from({ length: n - 1 }, () => mean + randInt(rand, -8, 8));
  const last = mean * n - vals.reduce((a, b) => a + b, 0);
  // 마지막 값도 다른 값들처럼 평균 가까이(극단값이 나오지 않게)
  if (last <= 0 || Math.abs(last - mean) > 10) return null;
  return { mean, vals: shuffle(rand, [...vals, last]) };
}

/** 평균이 자연수이고 값이 lo~hi인 자료 n개(값은 step의 배수라 그래프에서 정확히 읽힌다) */
function evenData(rand: () => number, n: number, lo: number, hi: number, step: number): { mean: number; vals: number[] } | null {
  const vals = Array.from({ length: n }, () => randInt(rand, lo / step, hi / step) * step);
  const sum = vals.reduce((a, b) => a + b, 0);
  if (sum % n !== 0 || new Set(vals).size < 3) return null;
  return { mean: sum / n, vals };
}

const BAR_TOPICS = [
  { title: "모둠별 모은 칭찬 붙임딱지 수", unit: "장", who: ["가", "나", "다", "라", "마"], suf: "모둠" },
  { title: "요일별 운동한 시간", unit: "분", who: ["월", "화", "수", "목", "금"], suf: "" },
  { title: "학생별 한 달 동안 읽은 책 수", unit: "권", who: NAMES, suf: "" },
];

/** 막대그래프를 보고 평균 구하기(막대를 고르게 하는 생각) */
export const avBars = easy("average", (rand) => {
  const t = pick(rand, BAR_TOPICS);
  const n = randInt(rand, 4, 5);
  const big = t.unit === "분";
  const step = big ? 10 : t.unit === "장" ? 2 : 1;
  const d = evenData(rand, n, big ? 20 : step * 2, big ? 60 : step * 10, step);
  if (!d) return null;
  const labels = t.who.slice(0, n).map((w) => `${w}${t.suf}`);
  return {
    key: `${t.title}:${d.vals.join()}`,
    prompt: `${jq(t.title, "을/를")} 나타낸 막대그래프입니다. 평균은 몇 ${t.unit}인가요?`,
    visual: { kind: "bars", title: t.title, labels, values: d.vals, unit: t.unit, step },
    answer: d.mean,
    unit: t.unit,
    hint: "막대의 높이를 고르게 하면 평균이에요. 자료의 값을 모두 더한 뒤 자료의 수로 나누어요.",
    explanation: `(${d.vals.join(" + ")}) ÷ ${n} = ${d.mean * n} ÷ ${n} = ${d.mean}(${t.unit})`,
    mistakes: { [d.mean * n]: "합계만 구했어요. 자료의 수로 나누어야 해요." },
  };
});

export const avTable = mid("l5-av-table", (rand) => {
  const n = randInt(rand, 4, 5);
  const d = evenData(rand, n, 2, 12, 1);
  if (!d) return null;
  const names = shuffle(rand, NAMES).slice(0, n);
  return {
    key: d.vals.join(),
    prompt: "학생들이 한 달 동안 읽은 책의 수를 나타낸 표입니다. 한 사람이 읽은 책 수의 평균은 몇 권인가요?",
    visual: { kind: "table", header: ["이름", ...names], rows: [["책 수(권)", ...d.vals.map(String)]] },
    answer: d.mean,
    unit: "권",
    hint: "모두 더한 뒤 사람 수로 나누어요.",
    explanation: `(${d.vals.join(" + ")}) ÷ ${n} = ${d.mean * n} ÷ ${n} = ${d.mean}(권)`,
    mistakes: { [d.mean * n]: "사람 수로 나누지 않았어요." },
  };
});

/** 지금까지의 시험 점수(꺾은선그래프)로 다음 시험에서 받아야 할 점수 */
export const needScore = word("w5-need-score", (rand) => {
  const n = randInt(rand, 3, 4);
  const d = evenData(rand, n, 60, 90, 10);
  if (!d) return null;
  const target = d.mean + randInt(rand, 1, 3);
  const need = target * (n + 1) - d.mean * n;
  if (need > 100) return null;
  const name = pick(rand, NAMES);
  return {
    key: `${d.vals.join()}:${target}`,
    prompt: `${jq(name, "이/가")} 본 수학 시험 점수를 나타낸 꺾은선그래프입니다. ${n + 1}회 시험을 보고 평균을 ${target}점으로 올리려면 ${n + 1}회에 몇 점을 받아야 하나요?`,
    visual: { kind: "line", title: `${name}의 수학 시험 점수`, labels: d.vals.map((_, i) => `${i + 1}회`), values: d.vals, unit: "점", step: 10 },
    answer: need,
    unit: "점",
    hint: "평균 × 횟수 = 점수의 합이에요. 목표 평균으로 필요한 합에서 지금까지의 합을 빼요.",
    explanation: `지금까지 합 ${d.mean * n}점, 목표 합 ${target} × ${n + 1} = ${target * (n + 1)}(점) → ${target * (n + 1)} − ${d.mean * n} = ${need}(점)`,
    mistakes: { [target]: "목표 평균만큼만 받으면 평균이 오르지 않아요." },
  };
});

/** 사람 수가 다른 두 모둠의 평균 비교: 가 모둠은 막대그래프, 나 모둠은 문장 */
export const avGroups = word("l5-av-groups", (rand) => {
  const g1 = evenData(rand, 4, 60, 100, 10);
  const g2 = meanData(rand, 5, 60, 90);
  if (!g1 || !g2 || g1.mean === g2.mean || g2.vals.some((v) => v > 100)) return null;
  const names = shuffle(rand, NAMES).slice(0, 4);
  return {
    key: `${g1.vals.join()}|${g2.vals.join()}`,
    prompt: `가 모둠 4명의 수학 점수는 막대그래프와 같고, 나 모둠 5명의 점수는 ${g2.vals.join("점, ")}점입니다. 어느 모둠의 평균이 몇 점 더 높은지 구하려고 합니다. 두 모둠의 평균의 차는 몇 점인가요?`,
    visual: { kind: "bars", title: "가 모둠의 수학 점수", labels: names, values: g1.vals, unit: "점", step: 10 },
    answer: Math.abs(g1.mean - g2.mean),
    unit: "점",
    hint: "사람 수가 다르므로 합계가 아니라 평균으로 비교해요.",
    explanation: `가 모둠 평균 ${g1.vals.reduce((a, b) => a + b, 0)} ÷ 4 = ${g1.mean}(점), 나 모둠 평균 ${g2.mean * 5} ÷ 5 = ${g2.mean}(점) → ${g1.mean > g2.mean ? "가" : "나"} 모둠이 ${Math.abs(g1.mean - g2.mean)}점 더 높아요.`,
    mistakes: Math.abs(g1.mean * 4 - g2.mean * 5) !== Math.abs(g1.mean - g2.mean) ? { [Math.abs(g1.mean * 4 - g2.mean * 5)]: "합계로 비교했어요. 사람 수가 다르면 평균으로 비교해요." } : undefined,
  };
});

export const avPerDay = easy("l5-av-per-day", (rand) => {
  const n = randInt(rand, 3, 7);
  const m = randInt(rand, 8, 40);
  const name = pick(rand, NAMES);
  return {
    key: `${n}:${m}`,
    prompt: `${jq(name, "은/는")} ${n}일 동안 책을 모두 ${n * m}쪽 읽었습니다. 하루에 평균 몇 쪽을 읽은 셈인가요?`,
    answer: m,
    unit: "쪽",
    hint: "(평균) = (자료의 값의 합) ÷ (자료의 수)",
    explanation: `${n * m} ÷ ${n} = ${m}(쪽)`,
  };
});

export const avMissing = mid("l5-av-missing", (rand) => {
  const n = randInt(rand, 4, 5);
  const d = meanData(rand, n, 20, 60);
  if (!d) return null;
  const names = shuffle(rand, NAMES).slice(0, n);
  const i = randInt(rand, 0, n - 1);
  return {
    key: `${d.vals.join()}:${i}`,
    prompt: `모둠 학생들의 줄넘기 기록을 나타낸 표입니다. 평균이 ${d.mean}회일 때 ${names[i]}의 기록은 몇 회인가요?`,
    visual: { kind: "table", header: ["이름", ...names], rows: [["기록(회)", ...d.vals.map((v, j) => (j === i ? "□" : String(v)))]] },
    answer: d.vals[i],
    unit: "회",
    hint: "(평균) × (사람 수)로 전체 합을 먼저 구해요.",
    explanation: `${d.mean} × ${n} = ${d.mean * n}, ${d.mean * n} − ${d.vals.filter((_, j) => j !== i).reduce((s, v) => s + v, 0)} = ${d.vals[i]}(회)`,
  };
});

export const avJoin = mid("l5-av-join", (rand) => {
  const n = randInt(rand, 3, 6);
  const m = randInt(rand, 30, 50);
  const nm = m + randInt(rand, -3, 3);
  const w = nm * (n + 1) - m * n;
  if (w <= 20 || w > 80 || nm === m) return null;
  return {
    key: `${n}:${m}:${w}`,
    prompt: `몸무게의 평균이 ${m} kg인 ${n}명의 모둠에 몸무게가 ${w} kg인 학생 한 명이 새로 들어왔습니다. 모둠 전체의 몸무게의 평균은 몇 kg이 되나요?`,
    answer: nm,
    unit: "kg",
    hint: "먼저 처음 모둠의 몸무게의 합을 구하고, 새로 들어온 학생의 몸무게를 더해요.",
    explanation: `(${m} × ${n} + ${w}) ÷ ${n + 1} = ${m * n + w} ÷ ${n + 1} = ${nm}(kg)`,
  };
});

export const avAbove = word("l5-av-above", (rand) => {
  const n = randInt(rand, 5, 6);
  const d = meanData(rand, n, 20, 50);
  if (!d) return null;
  const above = d.vals.filter((v) => v > d.mean).length;
  if (!above) return null;
  return {
    key: d.vals.join(),
    prompt: `학생 ${n}명이 모은 칭찬 붙임딱지는 ${d.vals.join("장, ")}장입니다. 평균보다 많이 모은 학생은 몇 명인가요?`,
    answer: above,
    unit: "명",
    hint: "먼저 평균을 구한 뒤, 평균보다 많은 수를 세어요.",
    explanation: `평균 ${d.vals.reduce((s, v) => s + v, 0)} ÷ ${n} = ${d.mean}(장), ${d.mean}장보다 많은 학생 ${above}명`,
  };
});

export const avMerge = word("l5-av-merge", (rand) => {
  const n1 = randInt(rand, 3, 8);
  const n2 = randInt(rand, 3, 8);
  const m1 = randInt(rand, 60, 95);
  const m2 = randInt(rand, 60, 95);
  const t = m1 * n1 + m2 * n2;
  if (t % (n1 + n2) || m1 === m2) return null;
  return {
    key: `${n1}:${m1}:${n2}:${m2}`,
    prompt: `가 모둠 ${n1}명의 수학 점수 평균은 ${m1}점이고, 나 모둠 ${n2}명의 평균은 ${m2}점입니다. 두 모둠 전체의 평균은 몇 점인가요?`,
    answer: t / (n1 + n2),
    unit: "점",
    hint: "각 모둠의 점수 합을 구해 더한 뒤 전체 사람 수로 나누어요.",
    explanation: `(${m1} × ${n1} + ${m2} × ${n2}) ÷ ${n1 + n2} = ${t} ÷ ${n1 + n2} = ${t / (n1 + n2)}(점)`,
    mistakes: Number.isInteger((m1 + m2) / 2) ? { [(m1 + m2) / 2]: "사람 수가 다르면 두 평균의 평균이 전체 평균이 아니에요." } : {},
  };
});

const WORDS5 = ["불가능하다", "~아닐 것 같다", "반반이다", "~일 것 같다", "확실하다"];
const EVENTS = [
  { q: "주사위를 굴렸을 때 7의 눈이 나올 가능성", w: 0 },
  { q: "12월 다음에 1월이 올 가능성", w: 4 },
  { q: "동전을 던졌을 때 숫자 면이 나올 가능성", w: 2 },
  { q: "주사위를 굴렸을 때 1의 눈이 나올 가능성", w: 1 },
  { q: "주사위를 굴렸을 때 2 이상의 눈이 나올 가능성", w: 3 },
  { q: "흰 공 1개와 검은 공 9개가 든 상자에서 흰 공을 꺼낼 가능성", w: 1 },
  { q: "흰 공 9개와 검은 공 1개가 든 상자에서 흰 공을 꺼낼 가능성", w: 3 },
  { q: "빨간 구슬만 든 주머니에서 파란 구슬을 꺼낼 가능성", w: 0 },
  { q: "주사위를 굴렸을 때 짝수의 눈이 나올 가능성", w: 2 },
  { q: "내일 아침 해가 동쪽에서 뜰 가능성", w: 4 },
];

export const chWord = easy("l5-ch-word", (rand) => {
  const e = pick(rand, EVENTS);
  const answer = WORDS5[e.w];
  const others = shuffle(rand, WORDS5.filter((w) => w !== answer)).slice(0, 3);
  return {
    key: `${e.q}:${others.join()}`,
    prompt: `${jq(e.q, "을/를")} 말로 나타낸 것을 고르세요.`,
    answer,
    choices: shuffle(rand, [answer, ...others]),
    hint: "일이 일어날 가능성을 불가능하다, ~아닐 것 같다, 반반이다, ~일 것 같다, 확실하다로 나타내요.",
    explanation: `${jq(e.q, "은/는")} '${answer}'입니다.`,
  };
});

/** 회전판 4개(4칸씩, 빨간 칸 수가 서로 다름): 가능성의 정도가 뚜렷이 다른 것끼리 비교한다 */
export const chMost = mid("l5-ch-most", (rand) => {
  const reds = shuffle(rand, [0, 1, 2, 3, 4]).slice(0, 4);
  const big = rand() < 0.5;
  const at = reds.indexOf(big ? Math.max(...reds) : Math.min(...reds));
  const names = ["가", "나", "다", "라"];
  const r = 30;
  const circles: NonNullable<ShapeScene["circles"]> = [];
  const lines: NonNullable<ShapeScene["lines"]> = [];
  const texts: NonNullable<ShapeScene["texts"]> = [];
  reds.forEach((n, i) => {
    const c: [number, number] = [44 + i * 82, 62];
    circles.push({ c, r });
    lines.push({ from: [c[0] - r, c[1]], to: [c[0] + r, c[1]], width: 1.5 }, { from: [c[0], c[1] - r], to: [c[0], c[1] + r], width: 1.5 });
    // 칸 순서: 오른쪽 위, 왼쪽 위, 왼쪽 아래, 오른쪽 아래. 글자 모서리가 원 테두리에 닿지 않게 가운데 쪽으로(±13)
    const spots: [number, number][] = [[13, -13], [-13, -13], [-13, 13], [13, 13]];
    const colored = shuffle(rand, [0, 1, 2, 3]).slice(0, n);
    spots.forEach(([dx, dy], k) => texts.push({ at: [c[0] + dx, c[1] + dy], text: colored.includes(k) ? "빨" : "파" }));
    texts.push({ at: [c[0], 16], text: names[i] });
  });
  return {
    key: `${big}:${reds.join()}:${texts.map((t) => t.text).join("")}`,
    prompt: `회전판 가~라를 돌릴 때, 화살이 빨간색(빨)에 멈출 가능성이 가장 ${big ? "높은" : "낮은"} 회전판을 고르세요.`,
    visual: { kind: "shape", width: 44 + 3 * 82 + 44, height: 104, label: "빨간색(빨)과 파란색(파) 칸으로 나눈 회전판 가~라", circles, lines, texts },
    answer: names[at],
    choices: names,
    hint: "빨간색 칸이 많을수록 빨간색에 멈출 가능성이 높아요. 불가능하다, ~아닐 것 같다, 반반이다, ~일 것 같다, 확실하다 중에서 골라 보세요.",
    explanation: reds.map((n, i) => `${names[i]} ${["불가능하다", "~아닐 것 같다", "반반이다", "~일 것 같다", "확실하다"][n]}`).join(", ") + ` → ${names[at]}`,
  };
});

const DICE_EV = [
  { t: "주사위를 굴려 7 이상의 눈이 나올 가능성", p: 0 },
  { t: "주사위를 굴려 1의 눈이 나올 가능성", p: 1 / 6 },
  { t: "주사위를 굴려 3 이하의 눈이 나올 가능성", p: 1 / 2 },
  { t: "주사위를 굴려 2 이상의 눈이 나올 가능성", p: 5 / 6 },
  { t: "주사위를 굴려 6 이하의 눈이 나올 가능성", p: 1 },
  { t: "주사위를 굴려 5 이상의 눈이 나올 가능성", p: 1 / 3 },
];

export const chLeast = mid("l5-ch-least", (rand) => {
  const four = shuffle(rand, DICE_EV).slice(0, 4);
  const big = rand() < 0.5;
  const ans = four.reduce((m, x) => ((big ? x.p > m.p : x.p < m.p) ? x : m));
  return {
    key: `${big}:${four.map((x) => x.t).join("|")}`,
    prompt: `일이 일어날 가능성이 가장 ${big ? "큰" : "작은"} 것을 고르세요.`,
    answer: ans.t,
    choices: four.map((x) => x.t),
    hint: "주사위의 눈 6개 중 조건에 맞는 눈이 몇 개인지 세어 비교해요.",
    explanation: `가능성이 가장 ${big ? "큰" : "작은"} 것: ${ans.t}`,
  };
});

export const chCards = word("l5-ch-cards", (rand) => {
  const N = pick(rand, [6, 8, 10, 12]);
  const evs = [
    { t: "짝수", n: N / 2 },
    { t: "홀수", n: N / 2 },
    { t: `${N / 2} 이하인 수`, n: N / 2 },
    { t: `${N / 2} 초과인 수`, n: N / 2 },
    { t: "3의 배수", n: Math.floor(N / 3) },
    { t: `${N} 초과인 수`, n: 0 },
    { t: `${N} 이하인 수`, n: N },
    { t: "4의 배수", n: Math.floor(N / 4) },
    { t: "가장 큰 수", n: 1 },
  ];
  const half = pick(rand, evs.filter((e) => e.n * 2 === N));
  const others = shuffle(rand, evs.filter((e) => e.n * 2 !== N)).slice(0, 3);
  return {
    key: `${N}:${half.t}:${others.map((x) => x.t).join()}`,
    prompt: `1부터 ${N}까지의 수가 하나씩 적힌 카드 ${N}장 중에서 한 장을 뽑을 때, 일이 일어날 가능성이 '반반이다'인 것을 고르세요.`,
    answer: `${jq(half.t, "이/가")} 적힌 카드를 뽑을 가능성`,
    choices: shuffle(rand, [half, ...others].map((e) => `${jq(e.t, "이/가")} 적힌 카드를 뽑을 가능성`)),
    hint: `${N}장 중 조건에 맞는 카드가 ${N / 2}장이면 '반반이다'예요.`,
    explanation: `${half.t}: ${N}장 중 ${half.n}장 → 반반이다`,
  };
});

export const chMakeHalf = word("l5-ch-make-half", (rand) => {
  const a = randInt(rand, 3, 15);
  const b = randInt(rand, 1, a - 1);
  const name = pick(rand, NAMES);
  return {
    key: `${a}:${b}`,
    prompt: `${name}의 주머니에 빨간 공 ${a}개와 파란 공 ${b}개가 들어 있습니다. 공 한 개를 꺼낼 때 파란 공이 나올 가능성이 '반반이다'가 되게 하려면 파란 공을 몇 개 더 넣어야 하나요?`,
    answer: a - b,
    unit: "개",
    hint: "빨간 공과 파란 공의 수가 같으면 가능성이 반반이에요.",
    explanation: `${a} − ${b} = ${a - b}(개)`,
  };
});

const DICE_NUM = [
  { t: "짝수의 눈이 나올 가능성", a: "1/2" },
  { t: "홀수의 눈이 나올 가능성", a: "1/2" },
  { t: "3 이하의 눈이 나올 가능성", a: "1/2" },
  { t: "4 이상의 눈이 나올 가능성", a: "1/2" },
  { t: "7의 눈이 나올 가능성", a: "0" },
  { t: "0의 눈이 나올 가능성", a: "0" },
  { t: "6 이하의 눈이 나올 가능성", a: "1" },
  { t: "1 이상의 눈이 나올 가능성", a: "1" },
];

export const chDice = mid("l5-ch-dice", (rand) => {
  const e = pick(rand, DICE_NUM);
  return {
    key: e.t,
    prompt: `주사위 한 개를 굴렸을 때 ${jq(e.t, "을/를")} 수로 나타낸 것을 고르세요.`,
    answer: e.a,
    choices: ["0", "1/2", "1"],
    hint: "불가능하면 0, 반반이면 1/2, 확실하면 1이에요.",
    explanation: `${jq(e.t, "은/는")} ${e.a}입니다.`,
  };
});

/** 가능성의 정도(0 불가능 ~ 4 확실)별 일. 단계마다 차이가 뚜렷한 상황만 쓴다 */
const CHANCE_LEVELS: string[][] = [
  ["주사위를 굴려 7의 눈이 나올 가능성", "흰 공만 들어 있는 주머니에서 검은 공을 꺼낼 가능성", "1부터 6까지의 수 카드 중 한 장을 뽑을 때 0이 나올 가능성"],
  ["주사위를 굴려 1의 눈이 나올 가능성", "빨간 공 1개, 파란 공 9개가 든 주머니에서 빨간 공을 꺼낼 가능성", "1부터 10까지의 수 카드 중 한 장을 뽑을 때 10이 나올 가능성"],
  ["동전을 던져 숫자 면이 나올 가능성", "주사위를 굴려 홀수의 눈이 나올 가능성", "흰 공 4개, 검은 공 4개가 든 주머니에서 흰 공을 꺼낼 가능성"],
  ["주사위를 굴려 2 이상의 눈이 나올 가능성", "빨간 공 9개, 파란 공 1개가 든 주머니에서 빨간 공을 꺼낼 가능성", "1부터 10까지의 수 카드 중 한 장을 뽑을 때 2 이상의 수가 나올 가능성"],
  ["주사위를 굴려 6 이하의 눈이 나올 가능성", "빨간 공만 들어 있는 주머니에서 빨간 공을 꺼낼 가능성", "1부터 4까지의 수 카드 중 한 장을 뽑을 때 4 이하의 수가 나올 가능성"],
];
const LEVEL_WORD = ["불가능하다", "~아닐 것 같다", "반반이다", "~일 것 같다", "확실하다"];
const CIRCLED = ["㉠", "㉡", "㉢", "㉣"];

/** 가능성이 큰 순서대로 기호 늘어놓기(서로 다른 단계의 일 4가지) */
export const chOrder = word("l5-ch-order", (rand) => {
  const levels = shuffle(rand, [0, 1, 2, 3, 4]).slice(0, 4);
  const events = levels.map((l) => pick(rand, CHANCE_LEVELS[l]));
  const order = [0, 1, 2, 3].sort((x, y) => levels[y] - levels[x]);
  const text = (o: number[]) => o.map((i) => CIRCLED[i]).join(", ");
  const answer = text(order);
  const swap = (i: number) => order.map((x, k) => (k === i ? order[i + 1] : k === i + 1 ? order[i] : x));
  return {
    key: events.join("|"),
    prompt: `일이 일어날 가능성이 큰 것부터 차례로 기호를 늘어놓은 것을 고르세요. ${events.map((e, i) => `${CIRCLED[i]} ${e}`).join(" ")}`,
    answer,
    choices: choices4(rand, answer, [text([...order].reverse()), text(swap(0)), text(swap(2)), text(swap(1))], () => text(shuffle(rand, [0, 1, 2, 3]))),
    hint: "각 일의 가능성을 불가능하다, ~아닐 것 같다, 반반이다, ~일 것 같다, 확실하다 중에서 골라 보세요.",
    explanation: order.map((i) => `${CIRCLED[i]} ${LEVEL_WORD[levels[i]]}`).join(", ") + ` → ${answer}`,
  };
});

