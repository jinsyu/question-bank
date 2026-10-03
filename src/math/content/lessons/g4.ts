import type { Generator, Visual } from "../types";
import { makeChoices, pick, randInt, shuffle } from "../../lib/random";
import { word, mid, type WordSpec } from "../words/word";
import { COMPARE_CHOICES, sign } from "../generators/common";
import { extras } from "../extras";
import { josa } from "../josa";

/**
 * 4학년 차시용 생성기(1): 공용 헬퍼, 4-1 큰 수, 각도
 */

/* ── 공용 헬퍼 ── */

export const fmt = (n: number) => n.toLocaleString("ko-KR");
/** 기본(하) 문제 */
export const easy = (id: string, make: (rand: () => number) => WordSpec | null): Generator => word(id, make, 1);
export { word, mid };

/** 예전 단계에 붙어 있던 응용·서술형 생성기 하나를 꺼낸다 */
export function ex(unitId: string, stdId: string, genId: string): Generator {
  const g = extras(unitId, stdId).find((x) => x.id === genId);
  if (!g) throw new Error(`${unitId}/${stdId}/${genId} 생성기가 없어요`);
  return g;
}

/** 받침 없는 이름. '하루'는 "하루는 5/8판을 먹고"처럼 '1일'로 읽혀 쓰지 않는다(words34.ts와 같은 이유) */
export const NAMES = ["지우", "서아", "수아", "도하", "유나", "이수"];
export const names = (rand: () => number, n = 2) => shuffle(rand, NAMES).slice(0, n);

/** 정답 + 오답 후보로 4지선다 */
export function opts(rand: () => number, answer: string | number, wrong: (string | number)[], filler: () => string | number): string[] {
  return makeChoices(rand, String(answer), wrong.map(String), () => String(filler()));
}

export const MARKS = ["①", "②", "③", "④"];

/** 보기 4개(글) 중 정답 하나를 ①~④로 고르는 문제 재료 */
export function markChoice(rand: () => number, right: string, wrongs: string[]) {
  const items = shuffle(rand, [right, ...wrongs.slice(0, 3)]);
  const idx = items.indexOf(right);
  const visual: Visual = { kind: "table", header: ["보기", "내용"], rows: items.map((t, i) => [MARKS[i], t]) };
  return { visual, answer: MARKS[idx], choices: MARKS };
}

/* ── 4-1 큰 수 ── */

const DIGIT_KO = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];

/** 네 자리 묶음 읽기(1은 자리 이름만) */
function readGroup(n: number): string {
  const units = ["천", "백", "십", ""];
  return String(n)
    .padStart(4, "0")
    .split("")
    .map((d, i) => {
      const v = Number(d);
      if (v === 0) return "";
      if (v === 1 && i < 3) return units[i];
      return DIGIT_KO[v] + units[i];
    })
    .join("");
}

/** 수를 우리말로 읽기: 32050000 → "삼천이백오만" */
export function readKo(n: number): string {
  const big = ["", "만", "억", "조"];
  const parts: string[] = [];
  let k = 0;
  let x = n;
  while (x > 0) {
    const g = x % 10000;
    if (g > 0) parts.unshift(k === 1 && g === 1 ? "만" : readGroup(g) + big[k]);
    x = Math.floor(x / 10000);
    k++;
  }
  return parts.join(" ");
}

/** 수를 '만·억·조' 단위를 섞어 쓰기: 305020000 → "3억 502만" */
export function mixKo(n: number): string {
  const big = ["", "만", "억", "조"];
  const parts: string[] = [];
  let k = 0;
  let x = n;
  while (x > 0) {
    const g = x % 10000;
    if (g > 0) parts.unshift(`${g}${big[k]}`);
    x = Math.floor(x / 10000);
    k++;
  }
  return parts.join(" ");
}

const PLACE_NAMES = ["일", "십", "백", "천", "만", "십만", "백만", "천만", "억", "십억", "백억", "천억", "조"];

const bigCard = (rand: () => number, len: number) => {
  const first = randInt(rand, 1, 9);
  let s = String(first);
  for (let i = 1; i < len; i++) s += String(rand() < 0.25 ? 0 : randInt(rand, 0, 9));
  return Number(s);
};

export const l4ManMake = easy("l4-man-make", (rand) => {
  const kind = randInt(rand, 0, 3);
  const base = [9000, 9900, 9990, 9999][kind];
  const unit = [1000, 100, 10, 1][kind];
  const ask = pick(rand, ["diff", "count"]);
  if (ask === "count") {
    const u = pick(rand, [1000, 100, 10]);
    return {
      key: `c:${u}`,
      prompt: `10000은 ${fmt(u)}이 몇 개인 수인가요?`,
      answer: 10000 / u,
      unit: "개",
      hint: `${fmt(u)}이 10개이면 ${fmt(u * 10)}이에요.`,
      explanation: `10000 = ${fmt(u)} × ${10000 / u}`,
    };
  }
  return {
    key: `d:${base}`,
    prompt: `10000은 ${fmt(base)}보다 몇 큰 수인가요?`,
    answer: unit,
    hint: "10000에서 빼 보거나, 뛰어 세어 보세요.",
    explanation: `${fmt(base)} + ${unit} = 10000`,
  };
});

export const l4ManBills = mid("l4-man-bills", (rand) => {
  const man = randInt(rand, 1, 6);
  const cheon = randInt(rand, 11, 25);
  const baek = randInt(rand, 0, 9);
  const total = man * 10000 + cheon * 1000 + baek * 100;
  return {
    key: `${man}:${cheon}:${baek}`,
    prompt: `10000원짜리 지폐 ${man}장, 1000원짜리 지폐 ${cheon}장, 100원짜리 동전 ${baek}개는 모두 얼마인가요?`,
    answer: total,
    unit: "원",
    hint: `1000원짜리 ${cheon}장은 ${fmt(cheon * 1000)}원이에요. 10000원을 넘으니 만의 자리로 받아올려요.`,
    explanation: `${fmt(man * 10000)} + ${fmt(cheon * 1000)} + ${baek * 100} = ${fmt(total)}(원)`,
    mistakes: { [man * 10000 + (cheon % 10) * 1000 + baek * 100]: "1000원짜리가 10장 넘을 때 받아올림을 빠뜨렸어요." },
  };
});

/** 수를 바르게 읽은 것 고르기 — 자리를 잘못 읽은 오답 */
const readChoice = (id: string, lenMin: number, lenMax: number) =>
  mid(id, (rand) => {
    const n = bigCard(rand, randInt(rand, lenMin, lenMax));
    const s = String(n);
    const wrongs = [n * 10, Math.floor(n / 10), Number(s.slice(0, -1).split("").reverse().join("") + s.slice(-1))]
      .filter((w) => w !== n && w > 0)
      .map(readKo);
    const answer = readKo(n);
    const choices = opts(rand, answer, wrongs, () => readKo(n + randInt(rand, 1, 9) * 10 ** randInt(rand, 0, s.length - 2)));
    return {
      key: `${n}`,
      prompt: `${josa(fmt(n), "을/를")} 바르게 읽은 것을 고르세요.`,
      answer,
      choices,
      hint: "일의 자리부터 네 자리씩 끊어서 만, 억 단위를 붙여 읽어요.",
      explanation: `${fmt(n)} → ${answer}`,
    };
  });

export const l4Read5 = readChoice("l4-read5", 5, 5);
export const l4ReadBig = readChoice("l4-read-big", 6, 8);

export const l4ManNeed = word("l4-man-need", (rand) => {
  const [a] = names(rand, 1);
  const man = randInt(rand, 1, 3);
  const cheon = randInt(rand, 2, 9);
  const baek = randInt(rand, 1, 9);
  const have = man * 10000 + cheon * 1000 + baek * 100;
  const price = (man + randInt(rand, 1, 3)) * 10000 + randInt(rand, 0, 9) * 1000;
  if (price <= have) return null;
  return {
    key: `${have}:${price}`,
    prompt: `${a}는 10000원짜리 지폐 ${man}장, 1000원짜리 지폐 ${cheon}장, 100원짜리 동전 ${baek}개를 가지고 있습니다. ${fmt(price)}원짜리 자전거 헬멧을 사려면 얼마가 더 필요한가요?`,
    answer: price - have,
    unit: "원",
    hint: "먼저 가지고 있는 돈이 모두 얼마인지 구해요.",
    explanation: `가진 돈 ${fmt(have)}원 → ${fmt(price)} − ${fmt(have)} = ${fmt(price - have)}(원)`,
  };
});

/** 자리 수는 말로(다섯 자리 수) */
const DIGIT_COUNT = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열"];

/** 조건을 모두 만족하는 수 찾기(자리 숫자 추론) */
const condDigits = (id: string, len: number) =>
  word(id, (rand) => {
    const ds = Array.from({ length: len }, (_, i) => (i === 0 ? randInt(rand, 3, 9) : randInt(rand, 0, 9)));
    const n = Number(ds.join(""));
    const place = (i: number) => PLACE_NAMES[len - 1 - i];
    const clues = [`${DIGIT_COUNT[len]} 자리 수입니다.`, `${place(0)}의 자리 숫자는 ${ds[0]}입니다.`];
    for (let i = 1; i < len; i++) {
      const d = ds[i];
      const prev = ds[i - 1];
      if (d === 0) clues.push(`${place(i)}의 자리 숫자는 0입니다.`);
      else if (d === prev) clues.push(`${place(i)}의 자리 숫자는 ${place(i - 1)}의 자리 숫자와 같습니다.`);
      // '상' 문제이므로 숫자를 그대로 알려 주지 않고 앞자리와의 관계로 준다
      else if (d % 2 === 0 && d > 0 && ds[0] === d * 2 && rand() < 0.5) clues.push(`${place(i)}의 자리 숫자는 ${place(0)}의 자리 숫자의 반입니다.`);
      else if (d < prev) clues.push(`${place(i)}의 자리 숫자는 ${place(i - 1)}의 자리 숫자보다 ${prev - d} 작습니다.`);
      else clues.push(`${place(i)}의 자리 숫자는 ${place(i - 1)}의 자리 숫자보다 ${d - prev} 큽니다.`);
    }
    return {
      key: `${n}`,
      prompt: `다음 조건을 모두 만족하는 수를 구하세요. ${clues.join(" ")}`,
      answer: n,
      hint: "가장 높은 자리부터 차례로 숫자를 정해요.",
      explanation: `조건에 맞게 자리 숫자를 쓰면 ${fmt(n)}입니다.`,
    };
  });

export const l4ManCond = condDigits("l4-man-cond", 5);

export const l4ManUnits = easy("l4-man-units", (rand) => {
  const k = randInt(rand, 11, 999) * pick(rand, [1, 10]);
  const n = k * 10000;
  const reverse = rand() < 0.5;
  return {
    key: `${reverse}:${k}`,
    prompt: reverse ? `${josa(fmt(n), "은/는")} 10000이 몇 개인 수인가요?` : `10000이 ${k}개인 수를 쓰세요.`,
    answer: reverse ? k : n,
    unit: reverse ? "개" : undefined,
    hint: "10000이 □개이면 □ 뒤에 0을 4개 붙여요.",
    explanation: `10000 × ${k} = ${fmt(n)}`,
    mistakes: reverse ? { [k * 10]: "0을 하나 덜 지웠어요." } : { [k * 1000]: "0을 하나 빠뜨렸어요." },
  };
});

export const l4PlaceDigit = mid("l4-place-digit", (rand) => {
  const len = randInt(rand, 6, 8);
  const n = bigCard(rand, len);
  const idx = randInt(rand, 0, len - 5);
  const place = len - 1 - idx;
  const digit = Number(String(n)[idx]);
  return {
    key: `${n}:${idx}`,
    prompt: `${fmt(n)}에서 ${PLACE_NAMES[place]}의 자리 숫자를 쓰세요.`,
    answer: digit,
    hint: "일의 자리부터 네 자리씩 끊으면 만의 자리를 찾기 쉬워요.",
    explanation: `${fmt(n)}의 ${PLACE_NAMES[place]}의 자리 숫자는 ${digit}입니다.`,
  };
});

export const l4CheckBills = word("l4-check-bills", (rand) => {
  const [a, b] = names(rand);
  const x = randInt(rand, 10, 90) * 10000 + randInt(rand, 1, 9) * 1000;
  const y = randInt(rand, 10, 90) * 10000 + randInt(rand, 1, 9) * 1000;
  const unit = pick(rand, [100000, 10000]);
  const count = Math.floor((x + y) / unit);
  return {
    key: `${x}:${y}:${unit}`,
    prompt: `${a}의 저금은 ${fmt(x)}원, ${b}의 저금은 ${fmt(y)}원입니다. 두 사람의 돈을 합해 ${unit === 100000 ? "10만 원짜리 수표" : "만 원짜리 지폐"}로 바꾸면 최대 몇 장까지 바꿀 수 있나요?`,
    answer: count,
    unit: "장",
    hint: "먼저 두 사람의 돈을 더하고, 그 수가 " + (unit === 100000 ? "10만" : "1만") + "이 몇 개인지 생각해요.",
    explanation: `${fmt(x)} + ${fmt(y)} = ${fmt(x + y)} → ${fmt(unit)}이 ${count}개`,
  };
});

export const l4PlaceTimes = word("l4-place-times", (rand) => {
  const d = randInt(rand, 1, 9);
  const p1 = randInt(rand, 3, 7);
  const p2 = randInt(rand, 0, p1 - 1);
  const len = randInt(rand, p1 + 1, 8);
  const ds = Array.from({ length: len }, (_, i) => (i === 0 ? randInt(rand, 1, 9) : randInt(rand, 0, 9)));
  const i1 = len - 1 - p1;
  const i2 = len - 1 - p2;
  ds[i1] = d;
  ds[i2] = d;
  if (ds[0] === 0) return null;
  const n = Number(ds.join(""));
  const answer = 10 ** (p1 - p2);
  return {
    key: `${n}:${p1}:${p2}`,
    prompt: `${fmt(n)}에서 ${PLACE_NAMES[p1]}의 자리 숫자 ${josa(d, "이/가")} 나타내는 값은 ${PLACE_NAMES[p2]}의 자리 숫자 ${josa(d, "이/가")} 나타내는 값의 몇 배인가요?`,
    answer,
    unit: "배",
    hint: "두 숫자가 나타내는 값을 각각 쓰고, 한 자리 올라갈 때마다 10배가 돼요.",
    explanation: `${fmt(d * 10 ** p1)}은 ${fmt(d * 10 ** p2)}의 ${fmt(answer)}배입니다.`,
    mistakes: { [p1 - p2]: "자리 차이만 셌어요. 한 자리마다 10배예요." },
  };
});

/* 억과 조 */

export const l4EokUnits = easy("l4-eok-units", (rand) => {
  const k = randInt(rand, 1, 9);
  const kind = randInt(rand, 0, 2);
  if (kind === 0)
    return {
      key: `a:${k}`,
      prompt: `${k}억은 1000만이 몇 개인 수인가요?`,
      answer: 10 * k,
      unit: "개",
      hint: "1000만이 10개이면 1억이에요.",
      explanation: `1억 = 1000만 × 10 → ${k}억 = 1000만 × ${10 * k}`,
    };
  if (kind === 1)
    return {
      key: `b:${k}`,
      prompt: `1억이 ${k}개인 수를 숫자로 쓰세요.`,
      answer: k * 100000000,
      hint: "1억은 1 뒤에 0이 8개예요.",
      explanation: `${k}억 = ${fmt(k * 100000000)}`,
      mistakes: { [k * 10000000]: "0을 하나 빠뜨렸어요." },
    };
  const u = pick(rand, [9000, 9900, 9990]);
  return {
    key: `c:${u}`,
    prompt: `1억은 ${u}만보다 몇만 큰 수인가요? □만에서 □에 알맞은 수를 쓰세요.`,
    answer: 10000 - u,
    hint: "1억은 10000만이에요.",
    explanation: `10000만 − ${u}만 = ${10000 - u}만`,
  };
});

export const l4EokZeros = mid("l4-eok-zeros", (rand) => {
  const eok = randInt(rand, 1, 999);
  const man = randInt(rand, 1, 9999) * (rand() < 0.5 ? 1 : 0) || randInt(rand, 1, 99) * 10;
  const il = rand() < 0.5 ? 0 : randInt(rand, 1, 9999);
  const n = eok * 100000000 + man * 10000 + il;
  const zeros = String(n).split("").filter((d) => d === "0").length;
  return {
    key: `${n}`,
    prompt: `${josa(mixKo(n), "을/를")} 숫자로 쓸 때 0은 모두 몇 개인가요?`,
    answer: zeros,
    unit: "개",
    hint: "억, 만 단위마다 네 자리가 있어요. 빈 자리에는 0을 써요.",
    explanation: `${mixKo(n)} = ${fmt(n)} → 0이 ${zeros}개`,
  };
});

export const l4EokWrongWrite = word("l4-eok-wrong-write", (rand) => {
  const [a] = names(rand, 1);
  const eok = randInt(rand, 2, 99);
  const man = randInt(rand, 1, 99) * pick(rand, [1, 10]);
  const n = eok * 100000000 + man * 10000;
  const wrong = Number(`${eok}${man}0000`);
  const r = markChoice(rand, fmt(n), [fmt(wrong), fmt(n * 10), fmt(n / 10)]);
  return {
    key: `${n}`,
    prompt: `${a}는 '${mixKo(n)}'을 ${fmt(wrong)}이라고 썼습니다. 빈 자리에 0을 쓰지 않아 잘못 썼습니다. 바르게 쓴 수를 고르세요.`,
    visual: r.visual,
    answer: r.answer,
    choices: r.choices,
    hint: "억 단위 뒤에는 만 단위 네 자리, 그 뒤에 일 단위 네 자리가 와요.",
    explanation: `${mixKo(n)} = ${fmt(n)}`,
  };
});

export const l4JoUnits = easy("l4-jo-units", (rand) => {
  const k = randInt(rand, 1, 9);
  const reverse = rand() < 0.5;
  return {
    key: `${reverse}:${k}`,
    prompt: reverse ? `${k}조는 1000억이 몇 개인 수인가요?` : `1000억이 ${10 * k}개인 수는 몇 조인가요?`,
    answer: reverse ? 10 * k : k,
    unit: reverse ? "개" : "조",
    hint: "1000억이 10개이면 1조예요.",
    explanation: `1000억 × ${10 * k} = ${k}조`,
  };
});

export const l4JoPlace = mid("l4-jo-place", (rand) => {
  const jo = randInt(rand, 11, 999);
  const eok = randInt(rand, 1000, 9999);
  const text = `${jo}${String(eok).padStart(4, "0")}00000000`;
  const len = text.length;
  const place = randInt(rand, 8, len - 1);
  const digit = text[len - 1 - place];
  return {
    key: `${jo}:${eok}:${place}`,
    prompt: `${jo}조 ${eok}억에서 ${PLACE_NAMES[place] ?? (place === 13 ? "십조" : "백조")}의 자리 숫자를 쓰세요.`,
    answer: digit,
    hint: "조 단위 네 자리, 억 단위 네 자리로 나누어 생각해요.",
    explanation: `${jo}조 ${eok}억에서 그 자리 숫자는 ${digit}입니다.`,
  };
});

export const l4JoDigits = mid("l4-jo-digits", (rand) => {
  // 조 앞 자릿수(1~4자리)를 고루 섞어 답이 한 가지로 굳지 않게
  const k = randInt(rand, 1, 4);
  const jo = randInt(rand, 10 ** (k - 1), 10 ** k - 1);
  const eok = randInt(rand, 1, 9999);
  const man = rand() < 0.5 ? 0 : randInt(rand, 1, 9999);
  const len = String(jo).length + 12;
  return {
    key: `${jo}:${eok}:${man}`,
    prompt: `${jo}조 ${eok}억${man ? ` ${man}만` : ""}을 숫자로 쓰면 모두 몇 자리 수인가요?`,
    answer: len,
    unit: "자리",
    hint: "1조는 1 뒤에 0이 12개인 13자리 수예요.",
    explanation: `조 단위 ${String(jo).length}자리 + 12자리 = ${len}자리`,
  };
});

/** 억 단위 금액(□억)을 조·억으로: 10000억 → 1조, 12000억 → 1조 2000억 */
const eokText = (eok: number) => {
  const [j, e] = [Math.floor(eok / 10000), eok % 10000];
  return [j ? `${j}조` : "", e ? `${e}억` : ""].filter(Boolean).join(" ");
};

export const l4JoYears = word("l4-jo-years", (rand) => {
  // 4학년 1단원에는 큰 수로 나누는 나눗셈이 없으므로 뛰어 세기로 푼다(1조까지 10번 이하, 답 12 이하)
  const per = pick(rand, [1000, 2000, 2500, 5000]);
  const jo = randInt(rand, 1, 3);
  const perJo = 10000 / per;
  const years = perJo * jo;
  if (years > 12) return null;
  const steps = Array.from({ length: perJo }, (_, i) => eokText(per * (i + 1)));
  return {
    key: `${per}:${jo}`,
    prompt: `어느 회사가 해마다 ${per}억 원씩 모으기로 했습니다. 모은 돈이 처음으로 ${jo}조 원이 되는 것은 몇 년 뒤인가요?`,
    answer: years,
    unit: "년",
    hint: `1조는 10000억이에요. ${per}억씩 뛰어 세어 ${jo}조가 되는 때를 찾아요.`,
    explanation: `${per}억씩 뛰어 세면 ${steps.join(", ")} → 1조가 되는 데 ${perJo}년${jo > 1 ? `, ${jo}조는 1조의 ${jo}배이므로 ${perJo} × ${jo} = ${years}(년)` : ""}`,
  };
});

export const l4JoTimesBack = word("l4-jo-times-back", (rand) => {
  const times = pick(rand, [10, 100, 1000]);
  const jo = randInt(rand, 1, 9);
  const eok = randInt(rand, 1, 9) * 1000;
  const totalEok = jo * 10000 + eok;
  const answer = totalEok / times;
  if (!Number.isInteger(answer)) return null;
  return {
    key: `${times}:${jo}:${eok}`,
    prompt: `어떤 수를 ${times}배 했더니 ${jo}조 ${eok}억이 되었습니다. 어떤 수는 몇 억인가요? □억에서 □에 알맞은 수를 쓰세요.`,
    answer,
    unit: "억",
    hint: `${jo}조 ${eok}억을 '억'만으로 나타낸 뒤 ${times}으로 나누어요.`,
    explanation: `${jo}조 ${eok}억 = ${totalEok}억, ${totalEok} ÷ ${times} = ${answer}(억)`,
    mistakes: { [totalEok * times]: `${times}배 한 수를 구했어요. 거꾸로 나누어야 해요.` },
  };
});

/* 뛰어 세기 */

export const l4SkipRule = easy("l4-skip-rule", (rand) => {
  const step = pick(rand, [10000, 100000, 1000000, 10000000, 100000000]);
  const start = randInt(rand, 1, 90) * step / 10 + randInt(rand, 1, 9) * step;
  const seq = [0, 1, 2, 3].map((i) => fmt(start + step * i));
  return {
    key: `${step}:${start}`,
    prompt: "몇씩 뛰어 센 것인가요?",
    expression: seq.join(", "),
    answer: step,
    hint: "어느 자리 숫자가 1씩 커지는지 보세요.",
    explanation: `${PLACE_NAMES[String(step).length - 1]}의 자리 숫자가 1씩 커지므로 ${fmt(step)}씩 뛰어 세었어요.`,
  };
});

export const l4SkipMissing = mid("l4-skip-missing", (rand) => {
  const step = pick(rand, [10000, 100000, 1000000, 10000000]);
  const start = randInt(rand, 10, 99) * step / 10 * 10 + randInt(rand, 7, 9) * step;
  const down = rand() < 0.3;
  const seq = [0, 1, 2, 3, 4].map((i) => start + (down ? -1 : 1) * step * i);
  const miss = randInt(rand, 2, 4);
  return {
    key: `${step}:${start}:${down}:${miss}`,
    prompt: "뛰어 센 규칙을 찾아 □ 안에 알맞은 수를 써넣으세요.",
    expression: seq.map((n, i) => (i === miss ? "□" : fmt(n))).join(", "),
    answer: seq[miss],
    hint: "이웃한 두 수에서 바뀐 자리를 찾아요. 받아올림에 주의해요.",
    explanation: `${fmt(step)}씩 ${down ? "거꾸로 " : ""}뛰어 세므로 ${fmt(seq[miss])}`,
  };
});

export const l4SkipBack = word("l4-skip-back", (rand) => {
  const step = pick(rand, [10000, 100000, 1000000]);
  const times = randInt(rand, 3, 6);
  const start = randInt(rand, 100, 9999) * 1000;
  const end = start + step * times;
  return {
    key: `${step}:${times}:${start}`,
    prompt: `어떤 수에서 ${fmt(step)}씩 ${times}번 뛰어 세었더니 ${josa(fmt(end), "이/가")} 되었습니다. 어떤 수를 구하세요.`,
    answer: start,
    hint: `거꾸로 ${fmt(step)}씩 ${times}번 뛰어 세어요.`,
    explanation: `${fmt(step)}씩 ${times}번이면 ${fmt(step * times)} → ${fmt(end)} − ${fmt(step * times)} = ${fmt(start)}`,
    mistakes: { [end + step * times]: "거꾸로 세야 하는데 더 뛰어 셌어요." },
  };
});

/* 크기 비교 */

export const l4CompareSort = mid("l4-compare-sort", (rand) => {
  const base = bigCard(rand, randInt(rand, 7, 9));
  const len = String(base).length;
  const set = new Set<number>([base]);
  while (set.size < 4) set.add(base + (rand() < 0.5 ? 1 : -1) * randInt(rand, 1, 9) * 10 ** randInt(rand, len - 4, len - 2));
  const nums = shuffle(rand, [...set]);
  const most = rand() < 0.5;
  const target = most ? Math.max(...nums) : Math.min(...nums);
  const shown = nums.map((n, i) => (i % 2 === 0 ? fmt(n) : mixKo(n)));
  const answer = shown[nums.indexOf(target)];
  return {
    key: `${nums.join()}:${most}`,
    prompt: `가장 ${most ? "큰" : "작은"} 수를 고르세요.`,
    answer,
    choices: shown,
    hint: "모두 같은 방법(숫자)으로 바꾸어 높은 자리부터 비교해요.",
    explanation: `${answer} = ${josa(fmt(target), "이/가")} 가장 ${most ? "큽니다" : "작습니다"}.`,
  };
});

export const l4CompareMixed = mid("l4-compare-mixed", (rand) => {
  const a = bigCard(rand, randInt(rand, 8, 10));
  const len = String(a).length;
  const b = rand() < 0.15 ? a : Math.max(1, a + (rand() < 0.5 ? 1 : -1) * randInt(rand, 1, 9) * 10 ** randInt(rand, 4, len - 2));
  const ans = sign(a, b);
  const swap = rand() < 0.5;
  return {
    key: `${a}:${b}:${swap}`,
    prompt: "두 수의 크기를 비교하여 ○ 안에 >, =, < 중 알맞은 것을 고르세요.",
    expression: swap ? `${mixKo(a)} ○ ${fmt(b)}` : `${fmt(a)} ○ ${mixKo(b)}`,
    answer: ans,
    choices: COMPARE_CHOICES,
    hint: "한 가지 방법(숫자)으로 바꾸어 쓴 다음 자리 수와 높은 자리 숫자를 비교해요.",
    explanation: `${fmt(a)} ${ans} ${fmt(b)}`,
  };
});

export const l4CompareBox = word("l4-compare-box", (rand) => {
  const len = randInt(rand, 6, 8);
  const ds = Array.from({ length: len }, (_, i) => (i === 0 ? randInt(rand, 1, 9) : randInt(rand, 0, 9)));
  const pos = randInt(rand, 1, 3);
  const other = [...ds];
  other[pos] = randInt(rand, 1, 8);
  // 비교 대상은 □ 자리 뒤를 바꾼 수
  for (let i = pos + 1; i < len; i++) other[i] = randInt(rand, 0, 9);
  const bigger = rand() < 0.5;
  const shownL = ds.map((d, i) => (i === pos ? "□" : String(d))).join("");
  const R = Number(other.join(""));
  const count = Array.from({ length: 10 }, (_, d) => d).filter((d) => {
    const L = Number(ds.map((x, i) => (i === pos ? d : x)).join(""));
    return bigger ? L > R : L < R;
  }).length;
  if (count === 0 || count === 10) return null;
  return {
    key: `${ds.join("")}:${pos}:${R}:${bigger}`,
    prompt: `0부터 9까지의 수 중에서 □ 안에 들어갈 수 있는 수는 모두 몇 개인가요?`,
    expression: `${shownL} ${bigger ? ">" : "<"} ${R}`,
    answer: count,
    unit: "개",
    hint: "높은 자리부터 비교해요. □ 자리 숫자가 같을 때는 그 아래 자리까지 비교해 보아야 해요.",
    explanation: `□에 0부터 9까지 넣어 비교하면 알맞은 수는 ${count}개입니다.`,
  };
});

export const l4CardsBig = word("l4-cards-big", (rand) => {
  const n = randInt(rand, 5, 7);
  const digits = shuffle(rand, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, n);
  const desc = [...digits].sort((a, b) => b - a);
  const asc = [...digits].sort((a, b) => a - b);
  if (asc[0] === 0) [asc[0], asc[1]] = [asc[1], asc[0]];
  const big = Number(desc.join(""));
  const small = Number(asc.join(""));
  const kind = pick(rand, ["big", "small", "second"]);
  const second = Number([...desc.slice(0, n - 2), desc[n - 1], desc[n - 2]].join(""));
  const answer = kind === "big" ? big : kind === "small" ? small : second;
  return {
    key: `${[...digits].sort().join("")}:${kind}`,
    prompt: `수 카드 ${digits.length}장 ${josa(digits.join(", "), "을/를")} 한 번씩 모두 사용하여 ${DIGIT_COUNT[n]} 자리 수를 만들려고 합니다. ${kind === "big" ? "가장 큰 수" : kind === "small" ? "가장 작은 수" : "두 번째로 큰 수"}를 쓰세요.`,
    answer,
    hint: kind === "small" ? "작은 숫자부터 쓰되, 0은 맨 앞에 올 수 없어요." : "큰 숫자부터 차례로 높은 자리에 써요.",
    explanation: `${kind === "big" ? "가장 큰 수" : kind === "small" ? "가장 작은 수" : "두 번째로 큰 수"}는 ${fmt(answer)}입니다.`,
    mistakes: kind === "small" && digits.includes(0) ? { [Number([...digits].sort((a, b) => a - b).join(""))]: "0은 맨 앞에 올 수 없어요." } : {},
  };
});

/* ── 4-1 각도 ── */

const clockAngle = (h: number) => Math.min(30 * h, 360 - 30 * h);

export const l4AngleBiggest = mid("l4-angle-biggest", (rand) => {
  const set = new Set<number>();
  while (set.size < 4) set.add(randInt(rand, 2, 34) * 5);
  const vals = [...set];
  const texts = vals.map((v) =>
    v === 90 ? "직각" : v > 90 && rand() < 0.5 ? `직각보다 ${v - 90}° 큰 각` : v < 90 && rand() < 0.5 ? `직각보다 ${90 - v}° 작은 각` : `${v}°`,
  );
  const most = rand() < 0.5;
  const target = most ? Math.max(...vals) : Math.min(...vals);
  return {
    key: `${vals.join()}:${texts.join()}:${most}`,
    prompt: `크기가 가장 ${most ? "큰" : "작은"} 각을 고르세요.`,
    answer: texts[vals.indexOf(target)],
    choices: texts,
    hint: "직각은 90°예요. 모두 몇 도인지 바꾸어 비교해요.",
    explanation: vals.map((v, i) => `${texts[i]} = ${v}°`).join(", "),
  };
});

export const l4ClockKind = mid("l4-clock-kind", (rand) => {
  const kind = pick(rand, ["예각", "둔각"] as const);
  const isKind = (h: number) => (kind === "예각" ? clockAngle(h) < 90 : clockAngle(h) > 90 && clockAngle(h) < 180);
  const good = shuffle(rand, [1, 2, 3, 4, 5, 7, 8, 9, 10, 11].filter(isKind))[0];
  const bad = shuffle(rand, [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 6].filter((h) => !isKind(h))).slice(0, 3);
  const choices = shuffle(rand, [good, ...bad]).map((h) => `${h}시`);
  return {
    key: `${kind}:${choices.join()}`,
    prompt: `긴바늘과 짧은바늘이 이루는 작은 쪽의 각이 ${kind}인 시각을 고르세요.`,
    answer: `${good}시`,
    choices,
    hint: "3시와 9시는 직각이에요. 숫자 칸 수에 30°를 곱해 보세요.",
    explanation: `${good}시의 두 바늘이 이루는 각은 ${clockAngle(good)}°로 ${kind}입니다.`,
  };
});

export const l4AngleWho = word("l4-angle-who", (rand) => {
  const [a, b] = names(rand);
  const x = randInt(rand, 1, 17) * 5;
  const more = rand() < 0.5;
  const aDeg = more ? 90 + x : 90 - x;
  const y = randInt(rand, 1, 17) * 5;
  const bDeg = 180 - y;
  if (aDeg === bDeg) return null;
  const winner = aDeg > bDeg ? a : b;
  const r = markChoice(rand, `${winner}, ${Math.abs(aDeg - bDeg)}°`, [
    `${winner === a ? b : a}, ${Math.abs(aDeg - bDeg)}°`,
    `${winner}, ${Math.abs(aDeg - bDeg) + 10}°`,
    `${winner}, ${Math.abs(x - y) === Math.abs(aDeg - bDeg) ? Math.abs(aDeg - bDeg) + 5 : Math.abs(x - y)}°`,
  ]);
  return {
    key: `${aDeg}:${bDeg}:${r.answer}`,
    prompt: `${a}는 직각보다 ${x}° ${more ? "큰" : "작은"} 각을 그렸고, ${b}는 직선이 이루는 각보다 ${y}° 작은 각을 그렸습니다. 누가 그린 각이 몇 도 더 큰가요?`,
    visual: r.visual,
    answer: r.answer,
    choices: r.choices,
    hint: "직각은 90°, 직선이 이루는 각은 180°예요. 두 각을 먼저 구해요.",
    explanation: `${a}: ${aDeg}°, ${b}: ${bDeg}° → ${winner}의 각이 ${Math.abs(aDeg - bDeg)}° 더 큽니다.`,
  };
});

export const l4AngleCompareCalc = mid("l4-angle-compare-calc", (rand) => {
  const exprs = Array.from({ length: 4 }, () => {
    const add = rand() < 0.5;
    const a = randInt(rand, 8, 30) * 5;
    const b = randInt(rand, 2, add ? 36 - a / 5 : a / 5 - 1) * 5;
    return { text: `${a}° ${add ? "+" : "−"} ${b}°`, v: add ? a + b : a - b };
  });
  const vals = exprs.map((e) => e.v);
  if (new Set(vals).size < 4 || new Set(exprs.map((e) => e.text)).size < 4) return null;
  const most = rand() < 0.5;
  const target = most ? Math.max(...vals) : Math.min(...vals);
  return {
    key: `${exprs.map((e) => e.text).join()}:${most}`,
    prompt: `계산 결과가 가장 ${most ? "큰" : "작은"} 것을 고르세요.`,
    answer: exprs[vals.indexOf(target)].text,
    choices: exprs.map((e) => e.text),
    hint: "각각 계산하여 비교해요.",
    explanation: exprs.map((e) => `${e.text} = ${e.v}°`).join(", "),
  };
});

export const l4AngleWrongOp = word("l4-angle-wrong-op", (rand) => {
  const x = randInt(rand, 12, 30) * 5;
  const a = randInt(rand, 3, x / 5 - 2) * 5;
  const addRight = rand() < 0.5;
  const wrongResult = addRight ? x - a : x + a;
  const right = addRight ? x + a : x - a;
  return {
    key: `${x}:${a}:${addRight}`,
    prompt: addRight
      ? `어떤 각도에 ${a}°를 더해야 할 것을 잘못하여 뺐더니 ${wrongResult}°가 되었습니다. 바르게 계산하면 몇 도인가요?`
      : `어떤 각도에서 ${a}°를 빼야 할 것을 잘못하여 더했더니 ${wrongResult}°가 되었습니다. 바르게 계산하면 몇 도인가요?`,
    answer: right,
    unit: "°",
    hint: "먼저 잘못 계산한 식을 거꾸로 풀어 어떤 각도를 구해요.",
    explanation: `어떤 각도: ${wrongResult}° ${addRight ? "+" : "−"} ${a}° = ${x}° → 바르게: ${x}° ${addRight ? "+" : "−"} ${a}° = ${right}°`,
    mistakes: { [x]: "어떤 각도까지만 구했어요." },
  };
});

export const l4TriPossible = mid("l4-tri-possible", (rand) => {
  const a = randInt(rand, 4, 20) * 5;
  const b = randInt(rand, 4, 30 - a / 5) * 5;
  const good = [a, b, 180 - a - b];
  const bad = [0, 1, 2].map(() => {
    const x = randInt(rand, 2, 10) * 10;
    const y = randInt(rand, 2, 10) * 10;
    const z = 180 - x - y + pick(rand, [-20, -10, 10, 20]);
    return [x, y, Math.max(10, z)];
  });
  const text = (t: number[]) => t.map((v) => `${v}°`).join(", ");
  const choices = [text(good), ...bad.filter((t) => t[0] + t[1] + t[2] !== 180).map(text)];
  if (new Set(choices).size < 4) return null;
  return {
    key: choices.join("|"),
    prompt: "한 삼각형의 세 각의 크기가 될 수 있는 것을 고르세요.",
    answer: text(good),
    choices: shuffle(rand, choices),
    hint: "세 각의 크기의 합이 180°인지 확인해요.",
    explanation: `${text(good)}: 합이 180°입니다.`,
  };
});

export const l4TriCondition = word("l4-tri-condition", (rand) => {
  // 반으로 나눈 값도 5의 배수가 되도록 10° 단위
  const c = randInt(rand, 2, 10) * 10;
  const k = randInt(rand, 1, 4) * 10;
  const rest = 180 - c - k;
  if (rest <= 40) return null;
  const x = rest / 2;
  return {
    key: `${c}:${k}`,
    prompt: `삼각형의 한 각은 ${c}°입니다. 나머지 두 각 중 한 각은 다른 한 각보다 ${k}° 큽니다. 나머지 두 각 중 더 큰 각은 몇 도인가요?`,
    answer: x + k,
    unit: "°",
    hint: `나머지 두 각의 합은 180° − ${c}°예요. 큰 각에서 ${k}°를 빼면 두 각이 같아져요.`,
    explanation: `두 각의 합 180° − ${c}° = ${180 - c}°, ${180 - c}° − ${k}° = ${2 * x}°, 작은 각 ${2 * x}° ÷ 2 = ${x}°, 큰 각 ${x}° + ${k}° = ${x + k}°`,
    mistakes: { [x]: "작은 각을 답했어요." },
  };
});

export const l4QuadErrorWhy = word("l4-quad-error-why", (rand) => {
  const [a] = names(rand, 1);
  // 두 각의 합이 180°보다 작아야 잘못된 풀이(180°에서 빼기)도 계산이 된다
  // 10° 단위라야 반으로 나눈 답도 5의 배수
  const x = randInt(rand, 5, 11) * 10;
  const y = randInt(rand, 4, 12) * 10;
  if (x + y >= 170 || x === y) return null;
  const wrong = (180 - x - y) / 2;
  const right = (360 - x - y) / 2;
  const r = markChoice(rand, `사각형의 네 각의 합은 360°인데 180°로 생각했어요. 바른 답은 ${right}°예요.`, [
    `사각형의 네 각의 합은 360°인데 180°로 생각했어요. 바른 답은 ${360 - x - y}°예요.`,
    `나머지 두 각의 합을 2로 나누지 말아야 해요. 바른 답은 ${180 - x - y}°예요.`,
    `계산은 맞았어요. 답은 ${wrong}°예요.`,
  ]);
  return {
    key: `${x}:${y}:${r.answer}`,
    prompt: `사각형의 두 각이 ${x}°, ${y}°이고 나머지 두 각의 크기는 서로 같습니다. ${a}는 나머지 한 각의 크기를 180° − ${x}° − ${y}° = ${2 * wrong}°, ${2 * wrong}° ÷ 2 = ${wrong}°로 구했습니다. ${a}의 풀이에서 잘못된 까닭과 바른 답을 고르세요.`,
    visual: r.visual,
    answer: r.answer,
    choices: r.choices,
    hint: "사각형은 대각선으로 삼각형 2개로 나눌 수 있어요.",
    explanation: `사각형의 네 각의 합은 360°이므로 360° − ${x}° − ${y}° = ${2 * right}°, ${2 * right}° ÷ 2 = ${right}°`,
  };
});
