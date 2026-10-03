import type { ShapeScene } from "../types";
import { pick, randInt, shuffle } from "../../lib/random";
import { addWithoutCarry, hasBorrow, hasCarry, subtractWithoutBorrow } from "../generators/common";
import { tensOnesScene } from "../generators/pictures";
import { mid, word, type WordSpec } from "../words/word";

/* ═══ 2학년 차시별 생성기 — 공용 도구 ═══ */

/** 조사(는·가)가 자연스럽도록 받침 없는 이름만 쓴다 */
export const NAMES = ["지우", "서아", "수아", "도하", "유나", "이수"];

type Make = (rand: () => number) => WordSpec | null;
export const easy = (id: string, make: Make) => word(id, make, 1);
export { mid, word as hard };

import { josa } from "../josa";
export { josa };

/** 정답 + 오답 3개(앞에서부터, 중복·정답 제외)로 4지선다. 모자라면 null → 다시 만든다 */
export function opts(rand: () => number, answer: string | number, wrongs: (string | number)[]): string[] | null {
  const a = String(answer);
  const w = [...new Set(wrongs.map(String))].filter((x) => x !== a).slice(0, 3);
  return w.length < 3 ? null : shuffle(rand, [a, ...w]);
}

const DIGIT_KO = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
/** 9999까지의 수를 읽는다. 407 → 사백칠 */
export function readKo(n: number): string {
  const units = ["천", "백", "십", ""];
  return String(n)
    .padStart(4, "0")
    .split("")
    .map((c, i) => {
      const d = Number(c);
      if (!d) return "";
      return (d === 1 && i < 3 ? "" : DIGIT_KO[d]) + units[i];
    })
    .join("");
}

const PLACE = ["일", "십", "백", "천"];
const digitsOf = (n: number) => String(n).split("").map(Number);
/** 서로 다른 한 자리 수 k개 */
const distinctDigits = (rand: () => number, k: number, min = 0) => shuffle(rand, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => d >= min)).slice(0, k);

/* ═══ 세 자리 수·네 자리 수 공용(자리 수 d) ═══ */

/** 100(1000)을 알아보는 기본 문제 */
export function baseFill(id: string, base: 100 | 1000) {
  const small = base / 10;
  const starts = base === 100 ? [90, 80, 70, 99, 98, 95] : [900, 800, 700, 990, 980, 999];
  return easy(id, (rand) => {
    const x = pick(rand, [...starts, 0]);
    if (x === 0) {
      return {
        key: "count",
        prompt: `${josa(small, "이/가")} □개이면 ${base}입니다. □ 안에 알맞은 수를 쓰세요.`,
        answer: 10,
        unit: "개",
        hint: `${small}씩 세어 ${base}까지 가 보세요.`,
        explanation: `${small}이 10개이면 ${base}입니다.`,
      };
    }
    return {
      key: `${x}`,
      prompt: `${x}보다 ${base - x}만큼 더 큰 수는 얼마인가요?`,
      answer: base,
      hint: `${x}에서 ${base - x}만큼 이어 세어 보세요.`,
      explanation: `${x}보다 ${base - x}만큼 더 큰 수는 ${base}입니다.`,
      mistakes: { [x + 1]: "1만큼 더 큰 수를 구했어요." },
    };
  });
}

/** base가 되려면 얼마가 더 있어야 하는지 */
export function toBase(id: string, base: 100 | 1000) {
  return mid(id, (rand) => {
    const x = base === 100 ? randInt(rand, 51, 98) : randInt(rand, 51, 99) * 10;
    const money = rand() < 0.5;
    return {
      key: `${x}:${money}`,
      prompt: money
        ? `${x}원이 있습니다. ${base}원이 되려면 얼마가 더 있어야 하나요?`
        : `${x}에서 □만큼 더 가면 ${base}이 됩니다. □ 안에 알맞은 수를 쓰세요.`,
      visual: base === 100 && !money ? tensOnesScene(Math.floor(x / 10), x % 10) : undefined,
      answer: base - x,
      unit: money ? "원" : undefined,
      hint: `${x}에서 ${base}까지 몇만큼 더 세어야 하는지 생각해요.`,
      explanation: `${x} + ${base - x} = ${base}`,
    };
  });
}

const BASE_TRUE: Record<number, string[]> = {
  100: ["99보다 1만큼 더 큰 수", "90보다 10만큼 더 큰 수", "10이 10개인 수", "80보다 20만큼 더 큰 수", "95보다 5만큼 더 큰 수"],
  1000: ["999보다 1만큼 더 큰 수", "990보다 10만큼 더 큰 수", "900보다 100만큼 더 큰 수", "100이 10개인 수", "800보다 200만큼 더 큰 수"],
};
const BASE_FALSE: Record<number, string[]> = {
  100: ["10이 9개인 수", "90보다 1만큼 더 큰 수", "99보다 10만큼 더 큰 수", "1이 10개인 수", "80보다 2만큼 더 큰 수"],
  1000: ["100이 9개인 수", "900보다 10만큼 더 큰 수", "990보다 1만큼 더 큰 수", "10이 10개인 수", "999보다 10만큼 더 큰 수"],
};

/** base를 나타내는 것이 아닌 것 고르기 */
export function notBase(id: string, base: 100 | 1000) {
  return mid(id, (rand) => {
    const answer = pick(rand, BASE_FALSE[base]);
    const choices = opts(rand, answer, shuffle(rand, BASE_TRUE[base]));
    if (!choices) return null;
    return {
      key: `${answer}:${choices.join()}`,
      prompt: `${josa(base, "을/를")} 나타내는 것이 아닌 것을 고르세요.`,
      choices,
      answer,
      hint: "하나씩 계산해 보고 결과가 다른 것을 찾아요.",
      explanation: `${josa(answer, "은/는")} ${base}이 아닙니다.`,
    };
  });
}

/** 몇의 base배 알아보기: base가 k개이면? k·base는 base가 몇 개? */
export function multRead(id: string, base: 100 | 1000) {
  return easy(id, (rand) => {
    const k = randInt(rand, 2, 9);
    const toNum = rand() < 0.5;
    return toNum
      ? {
          key: `n:${k}`,
          prompt: `${josa(base, "이/가")} ${k}개이면 얼마인가요? 수로 쓰세요.`,
          answer: k * base,
          hint: `${base}이 ${k}개이면 ${readKo(k * base)}이에요.`,
          explanation: `${base}이 ${k}개이면 ${k * base}입니다.`,
          mistakes: { [k]: "개수만 썼어요." },
        }
      : {
          key: `c:${k}`,
          prompt: `${josa(k * base, "은/는")} ${josa(base, "이/가")} 몇 개인 수인가요?`,
          answer: k,
          unit: "개",
          hint: `${readKo(k * base)}은 ${readKo(base)}이 몇 개인지 생각해요.`,
          explanation: `${k * base}은 ${base}이 ${k}개인 수입니다.`,
        };
  });
}

/** 몇백(몇천)끼리 더하고 빼기 */
export function multSum(id: string, base: 100 | 1000) {
  return mid(id, (rand) => {
    const a = randInt(rand, 1, 8);
    const more = rand() < 0.5;
    const b = more ? randInt(rand, 1, 9 - a) : randInt(rand, 1, a);
    if (!more && a === b) return null;
    const r = more ? a + b : a - b;
    return {
      key: `${a}:${b}:${more}`,
      prompt: `${a * base}보다 ${b * base}만큼 더 ${more ? "큰" : "작은"} 수는 얼마인가요?`,
      answer: r * base,
      hint: `${base}이 몇 개인지로 생각해요. ${base}이 ${a}개에서 ${b}개 ${more ? "늘어나요" : "줄어들어요"}.`,
      explanation: `${base}이 ${a} ${more ? "+" : "−"} ${b} = ${r}개 → ${r * base}`,
    };
  });
}

/** 나타내는 수가 다른 하나 고르기 */
export function multOdd(id: string, base: 100 | 1000) {
  return mid(id, (rand) => {
    const k = randInt(rand, 2, 8);
    const same = [`${k * base}`, `${base}이 ${k}개인 수`, readKo(k * base)];
    const odd = pick(rand, [`${base / 10}이 ${k}개인 수`, `${base}이 ${k + 1}개인 수`, readKo((k + 1) * base), `${(k - 1) * base}`]);
    const choices = opts(rand, odd, same);
    if (!choices) return null;
    return {
      key: `${k}:${odd}`,
      prompt: "나타내는 수가 다른 하나를 고르세요.",
      choices,
      answer: odd,
      hint: "모두 수로 바꾸어 비교해 보세요.",
      explanation: `나머지는 모두 ${k * base}을 나타냅니다.`,
    };
  });
}

/** 처음 가진 돈 구하기(거꾸로) */
export function multReverse(id: string, base: 100 | 1000) {
  const coin = base === 100 ? "100원짜리 동전" : "1000원짜리 지폐";
  const cnt = base === 100 ? "개" : "장";
  return word(id, (rand) => {
    const k = randInt(rand, 4, 9);
    const a = randInt(rand, 1, k - 1);
    const name = pick(rand, NAMES);
    return {
      key: `${name}:${k}:${a}`,
      prompt: `${josa(name, "은/는")} ${coin}만 몇 ${cnt} 가지고 있었습니다. 할머니께 ${coin} ${josa(`${a}${cnt}`, "을/를")} 더 받았더니 모두 ${k * base}원이 되었습니다. ${josa(name, "이/가")} 처음에 가지고 있던 돈은 얼마인가요?`,
      answer: (k - a) * base,
      unit: "원",
      hint: `${k * base}원은 ${coin} ${josa(`${k}${cnt}`, "이에요/예요")}. 받은 ${josa(`${a}${cnt}`, "을/를")} 빼 보세요.`,
      explanation: `${coin} ${k} − ${a} = ${k - a}(${cnt}) → ${(k - a) * base}원`,
      mistakes: { [(k + a) * base]: "받은 돈은 빼야 처음 돈이에요." },
    };
  });
}

/** □00(□000)이 두 수 사이에 있을 때 □의 개수 */
export function multIneq(id: string, base: 100 | 1000) {
  const zeros = base === 100 ? "00" : "000";
  return word(id, (rand) => {
    const a = randInt(rand, 1, 6);
    const b = randInt(rand, a + 2, 9);
    return {
      key: `${a}:${b}`,
      prompt: `□${zeros}은 ${a * base}보다 크고 ${b * base}보다 작습니다. □ 안에 들어갈 수 있는 수는 모두 몇 개인가요?`,
      answer: b - a - 1,
      unit: "개",
      hint: `□${zeros}은 ${base}이 □개인 수예요. ${a}보다 크고 ${b}보다 작은 수를 찾아요.`,
      explanation: `${Array.from({ length: b - a - 1 }, (_, i) => a + 1 + i).join(", ")} → ${b - a - 1}개`,
      mistakes: { [b - a + 1]: `${josa(a, "과/와")} ${josa(b, "은/는")} 들어갈 수 없어요.`, [b - a]: "크고 작은 수 자신은 빼야 해요." },
    };
  });
}

/** 동전으로 가진 돈이 base가 되려면 누가 몇 개 더 필요한지 */
export function coinCompare(id: string, base: 100 | 1000) {
  const unit = base / 10;
  return word(id, (rand) => {
    const name = pick(rand, NAMES);
    const a = randInt(rand, 2, 6);
    const b = randInt(rand, 1, 8 - a);
    const need = 10 - a - b;
    return {
      key: `${a}:${b}`,
      prompt: `${josa(name, "은/는")} ${unit}원짜리 동전 ${a}개를 가지고 있었는데, 오늘 ${unit}원짜리 동전 ${b}개를 더 모았습니다. ${base}원이 되려면 ${unit}원짜리 동전이 몇 개 더 있어야 하나요?`,
      answer: need,
      unit: "개",
      hint: `${base}원은 ${unit}원짜리 동전 10개예요. 먼저 지금 가진 동전이 몇 개인지 구해요.`,
      explanation: `${a} + ${b} = ${a + b}(개), 10 − ${a + b} = ${need}(개)`,
      mistakes: { [10 - a]: "오늘 모은 동전도 더해야 해요." },
    };
  });
}

/** 수 읽기 고르기 */
export function readChoice(id: string, d: 3 | 4) {
  return easy(id, (rand) => {
    const ds = Array.from({ length: d }, (_, i) => (i === 0 ? randInt(rand, 1, 9) : rand() < 0.25 ? 0 : randInt(rand, 1, 9)));
    const n = Number(ds.join(""));
    const swapped = Number([ds[0], ...ds.slice(1).reverse()].join(""));
    const withYeong = ds.map((x, i) => (x === 0 ? "영" : readKo(x * 10 ** (d - 1 - i)))).join("");
    const choices = opts(rand, readKo(n), [withYeong, readKo(swapped), readKo(n + 10 ** (d - 1) <= 10 ** d - 1 ? n + 10 ** (d - 1) : n - 10 ** (d - 1)), readKo(n + 1)]);
    if (!choices) return null;
    return {
      key: `${n}`,
      prompt: `${josa(n, "을/를")} 바르게 읽은 것을 고르세요.`,
      choices,
      answer: readKo(n),
      hint: "높은 자리부터 읽고, 숫자가 0인 자리는 읽지 않아요.",
      explanation: `${josa(n, "은/는")} ${josa(readKo(n), "이라고/라고")} 읽어요.`,
    };
  });
}

/** 수로 바르게 쓴 것 고르기(자리 0 빠뜨리기 실수) */
export function writeChoice(id: string, d: 3 | 4) {
  return mid(id, (rand) => {
    const ds = Array.from({ length: d }, (_, i) => (i === 0 ? randInt(rand, 1, 9) : rand() < 0.4 ? 0 : randInt(rand, 1, 9)));
    const n = Number(ds.join(""));
    if (!ds.includes(0)) return null;
    // 읽은 대로 이어 쓴 실수(사백삼 → 4003). 자릿수가 둘 이상 늘면(40030, 6000903) 그 학년에 낯선 수라 다른 오답으로 바꾼다
    const said = ds.map((x, i) => (x ? String(x * 10 ** (d - 1 - i)) : "")).join("");
    const joined = said.length <= d + 1 ? said : `${n + 1}`;
    const noZero = ds.filter((x) => x).join("");
    const choices = opts(rand, n, [joined, noZero, Number([...ds].reverse().join("")) >= 10 ** (d - 1) ? [...ds].reverse().join("") : `${n + 10}`, `${n + 10 ** (d - 2)}`]);
    if (!choices) return null;
    return {
      key: `${n}`,
      prompt: `${josa(readKo(n), "을/를")} 수로 바르게 쓴 것을 고르세요.`,
      choices,
      answer: String(n),
      hint: "읽지 않은 자리에는 0을 써요.",
      explanation: `${readKo(n)} → ${n}`,
    };
  });
}

/** 낱개 묶음이 10개를 넘는 수 만들기 */
export function modelBundle(id: string, d: 3 | 4) {
  return mid(id, (rand) => {
    const units = d === 3 ? [100, 10, 1] : [1000, 100, 10, 1];
    const big = randInt(rand, 1, d === 3 ? 7 : 7);
    const over = randInt(rand, 1, d - 1);
    const counts = units.map((_, i) => (i === 0 ? big : i === over ? randInt(rand, 10, 15) : randInt(rand, 0, 9)));
    const n = counts.reduce((s, c, i) => s + c * units[i], 0);
    if (n >= 10 ** d) return null;
    return {
      key: counts.join(":"),
      prompt: `${units.map((u, i) => `${u}이 ${counts[i]}개`).join(", ")}인 수는 얼마인가요?`,
      answer: n,
      hint: `${units[over]}이 10개이면 ${units[over] * 10}이에요. 먼저 묶어서 바꿔 보세요.`,
      explanation: `${units.map((u, i) => counts[i] * u).join(" + ")} = ${n}`,
      mistakes: { [counts.join("")]: "개수를 그대로 이어 썼어요." },
    };
  });
}

/** 수 카드로 가장 큰/작은/둘째로 큰 수 만들기 */
export function cardsNumber(id: string, d: 3 | 4) {
  return word(id, (rand) => {
    const cards = distinctDigits(rand, d);
    const desc = [...cards].sort((a, b) => b - a);
    const asc = [...cards].sort((a, b) => a - b);
    if (asc[0] === 0) [asc[0], asc[1]] = [asc[1], asc[0]];
    const kind = pick(rand, ["큰", "작은", "둘째로 큰"] as const);
    const second = [...desc.slice(0, d - 2), desc[d - 1], desc[d - 2]];
    const ans = Number((kind === "큰" ? desc : kind === "작은" ? asc : second).join(""));
    if (ans < 10 ** (d - 1)) return null;
    return {
      key: `${cards.join("")}:${kind}`,
      prompt: `수 카드 ${josa(cards.join(", "), "을/를")} 한 번씩만 사용하여 ${d === 3 ? "세" : "네"} 자리 수를 만들려고 합니다. 만들 수 있는 수 중 ${kind === "둘째로 큰" ? "둘째로 큰" : `가장 ${kind}`} 수는 얼마인가요?`,
      answer: ans,
      hint: kind === "작은" ? "높은 자리에 작은 숫자부터 놓아요. 0은 맨 앞에 올 수 없어요." : "높은 자리에 큰 숫자부터 놓아요.",
      explanation: kind === "둘째로 큰" ? `가장 큰 수 ${desc.join("")}에서 일의 자리와 십의 자리를 바꾼 ${ans}` : `${ans}`,
      mistakes: kind === "작은" && cards.includes(0) ? { [Number([...cards].sort((a, b) => a - b).join(""))]: "0은 맨 앞에 올 수 없어요." } : {},
    };
  });
}

/** 어느 자리 숫자인지 */
export function digitAt(id: string, d: 3 | 4) {
  return easy(id, (rand) => {
    const n = randInt(rand, 10 ** (d - 1), 10 ** d - 1);
    const p = randInt(rand, 0, d - 1);
    const digit = digitsOf(n)[d - 1 - p];
    return {
      key: `${n}:${p}`,
      prompt: `${n}에서 ${PLACE[p]}의 자리 숫자는 무엇인가요?`,
      answer: digit,
      hint: `오른쪽부터 일, 십, 백${d === 4 ? ", 천" : ""}의 자리예요.`,
      explanation: `${n}의 ${PLACE[p]}의 자리 숫자는 ${digit}입니다.`,
      mistakes: p > 0 && digit ? { [digit * 10 ** p]: "숫자가 나타내는 값을 썼어요. 숫자만 쓰세요." } : {},
    };
  });
}

/** 자릿값으로 가르기: 638 = 600 + □ + 8 */
export function expandMissing(id: string, d: 3 | 4) {
  return mid(id, (rand) => {
    const ds = Array.from({ length: d }, () => randInt(rand, 1, 9));
    const n = Number(ds.join(""));
    const hide = randInt(rand, 0, d - 1);
    const parts = ds.map((x, i) => x * 10 ** (d - 1 - i));
    return {
      key: `${n}:${hide}`,
      prompt: "□ 안에 알맞은 수를 써넣으세요.",
      expression: `${n} = ${parts.map((v, i) => (i === hide ? "□" : v)).join(" + ")}`,
      answer: parts[hide],
      hint: "각 자리 숫자가 나타내는 값으로 가르기 해요.",
      explanation: `${n} = ${parts.join(" + ")}`,
      mistakes: { [ds[hide]]: "숫자만 썼어요. 숫자가 나타내는 값을 써야 해요." },
    };
  });
}

/** 숫자 k가 k·10^p를 나타내는 수 고르기 */
export function placeFind(id: string, d: 3 | 4) {
  return mid(id, (rand) => {
    const k = randInt(rand, 1, 9);
    const p = randInt(rand, 0, d - 1);
    const places = shuffle(rand, Array.from({ length: d }, (_, i) => i).filter((i) => i !== p));
    const make = (q: number) => {
      const ds = Array.from({ length: d }, (_, i) => {
        if (d - 1 - i === q) return k;
        let x = randInt(rand, i === 0 ? 1 : 0, 9);
        while (x === k) x = (x % 9) + 1;
        return x;
      });
      return Number(ds.join(""));
    };
    const answer = make(p);
    const choices = opts(rand, answer, [...places, places[0]].slice(0, 3).map(make));
    if (!choices) return null;
    return {
      key: choices.join(),
      prompt: `숫자 ${josa(k, "이/가")} ${josa(k * 10 ** p, "을/를")} 나타내는 수를 고르세요.`,
      choices,
      answer: String(answer),
      hint: `${josa(k * 10 ** p, "은/는")} ${PLACE[p]}의 자리 숫자가 ${k}일 때예요.`,
      explanation: `${answer}에서 ${josa(k, "은/는")} ${PLACE[p]}의 자리 숫자이므로 ${josa(k * 10 ** p, "을/를")} 나타내요.`,
    };
  });
}

/** 조건을 모두 만족하는 수 */
export function condNumber(id: string, d: 3 | 4) {
  return word(id, (rand) => {
    const ds = Array.from({ length: d }, (_, i) => randInt(rand, i === 0 ? 1 : 0, 9));
    const diff = ds[d - 1] - ds[0];
    if (diff === 0) return null;
    const lines = ds.slice(0, d - 1).map((x, i) => {
      const p = d - 1 - i;
      return i % 2 === 0 || x === 0 ? `${PLACE[p]}의 자리 숫자는 ${x}입니다.` : `${PLACE[p]}의 자리 숫자는 ${josa(x * 10 ** p, "을/를")} 나타냅니다.`;
    });
    lines.push(`일의 자리 숫자는 ${PLACE[d - 1]}의 자리 숫자보다 ${Math.abs(diff)}만큼 더 ${diff > 0 ? "큽" : "작습"}니다.`);
    const n = Number(ds.join(""));
    return {
      key: `${n}`,
      prompt: `다음 조건을 모두 만족하는 ${d === 3 ? "세" : "네"} 자리 수를 구하세요. ${lines.map((l, i) => `(${i + 1}) ${l}`).join(" ")}`,
      answer: n,
      hint: "높은 자리부터 숫자를 하나씩 정해 보세요.",
      explanation: `${ds.map((x, i) => `${PLACE[d - 1 - i]}의 자리 ${x}`).join(", ")} → ${n}`,
    };
  });
}

/** 친구의 잘못된 자릿값 설명 고치기(오류 분석) */
export function placeError(id: string, d: 3 | 4) {
  return word(id, (rand) => {
    const n = randInt(rand, 10 ** (d - 1), 10 ** d - 1);
    const p = randInt(rand, 1, d - 1);
    const k = digitsOf(n)[d - 1 - p];
    // 같은 숫자가 두 자리에 있으면(443의 4) 어느 4인지 모호해 정답이 둘이 된다
    if (k === 0 || digitsOf(n).filter((x) => x === k).length > 1) return null;
    const name = pick(rand, NAMES);
    const right = k * 10 ** p;
    const wrongPlace = PLACE[p - 1];
    const say = (place: string, v: number) => `${josa(k, "은/는")} ${place}의 자리 숫자이므로 ${josa(v, "을/를")} 나타내요.`;
    const answer = say(PLACE[p], right);
    // 가장 높은 자리일 때 right × 10은 자릿수가 하나 많은 수(6000, 90000)라 그 학년에서 말이 되는 오답이 아니다
    const tooBig = p === d - 1 ? say(wrongPlace, right) : say(PLACE[p], right * 10);
    const choices = opts(rand, answer, [say(wrongPlace, k * 10 ** (p - 1)), say(PLACE[p], k * 10 ** (p - 1)), tooBig, `${josa(k, "은/는")} 숫자이므로 ${josa(k, "을/를")} 나타내요.`]);
    if (!choices) return null;
    return {
      key: `${n}:${p}`,
      prompt: `${josa(name, "은/는")} "${n}에서 숫자 ${josa(k, "은/는")} ${josa(k, "을/를")} 나타내요."라고 말했습니다. 바르게 고친 것을 고르세요.`,
      choices,
      answer,
      hint: "숫자가 어느 자리에 있는지 먼저 찾아요.",
      explanation: `${n}에서 ${answer}`,
    };
  });
}

/** 몇씩 뛰어 세었는지 */
export function skipRule(id: string, d: 3 | 4) {
  return easy(id, (rand) => {
    const steps = d === 3 ? [1, 10, 100] : [10, 100, 1000];
    const step = pick(rand, steps);
    const start = randInt(rand, 10 ** (d - 1), 10 ** d - 1 - step * 4);
    const seq = Array.from({ length: 4 }, (_, i) => start + step * i);
    return {
      key: `${start}:${step}`,
      prompt: "몇씩 뛰어 센 것인가요?",
      expression: seq.join(" – "),
      answer: step,
      unit: "씩",
      hint: "어느 자리 숫자가 1씩 커지는지 살펴보세요.",
      explanation: `${PLACE[String(step).length - 1]}의 자리 숫자가 1씩 커지므로 ${step}씩 뛰어 세었어요.`,
    };
  });
}

/** 매일 저금하면 며칠 뒤에 목표보다 많아지는지(규칙) */
export function skipSave(id: string, d: 3 | 4) {
  return word(id, (rand) => {
    const step = d === 3 ? 100 : pick(rand, [100, 1000]);
    const start = d === 3 ? randInt(rand, 10, 45) * 10 : step === 100 ? randInt(rand, 10, 40) * 100 + randInt(rand, 1, 9) * 10 : randInt(rand, 1, 4) * 1000 + randInt(rand, 1, 9) * 100;
    const days = randInt(rand, 2, 5);
    const target = start + step * days - randInt(rand, 1, step / 10 - 1) * 10;
    if (target >= 10 ** d || target <= start) return null;
    const name = pick(rand, NAMES);
    return {
      key: `${start}:${step}:${target}`,
      prompt: `${josa(name, "은/는")} 저금통에 ${start}원이 있습니다. 내일부터 하루에 ${step}원씩 저금하면 며칠 뒤에 처음으로 ${target}원보다 많아지나요?`,
      answer: days,
      unit: "일",
      hint: `${start}부터 ${step}씩 뛰어 세어 보세요.`,
      explanation: `${Array.from({ length: days }, (_, i) => start + step * (i + 1)).join(", ")} → ${days}일 뒤`,
    };
  });
}

/** 가장 큰/작은 수 고르기 */
export function extremeNumber(id: string, d: 3 | 4) {
  return mid(id, (rand) => {
    const lead = randInt(rand, 1, 9);
    const nums = [...new Set(Array.from({ length: 6 }, () => lead * 10 ** (d - 1) + randInt(rand, 0, 10 ** (d - 1) - 1)))].slice(0, 4);
    if (nums.length < 4) return null;
    const big = rand() < 0.5;
    const answer = big ? Math.max(...nums) : Math.min(...nums);
    return {
      key: `${nums.join()}:${big}`,
      prompt: `가장 ${big ? "큰" : "작은"} 수를 고르세요.`,
      choices: shuffle(rand, nums.map(String)),
      answer: String(answer),
      hint: "높은 자리부터 차례로 비교해요.",
      explanation: `${[...nums].sort((a, b) => (big ? b - a : a - b)).join(big ? " > " : " < ")}`,
    };
  });
}

/** 두 수 사이의 수 고르기(조건에 맞는 수) */
export function betweenChoice(id: string, d: 3 | 4) {
  return mid(id, (rand) => {
    const unit = 10 ** (d - 2);
    const a = randInt(rand, 10, 10 ** 2 - 12) * unit;
    const b = a + randInt(rand, 3, 9) * unit;
    const inside = randInt(rand, a + 1, b - 1);
    const choices = opts(rand, inside, [a, b, a - randInt(rand, 1, unit), b + randInt(rand, 1, unit)]);
    if (!choices || a < 10 ** (d - 1) || b >= 10 ** d) return null;
    return {
      key: `${a}:${b}:${inside}`,
      prompt: `${a}보다 크고 ${b}보다 작은 수를 고르세요.`,
      choices,
      answer: String(inside),
      hint: `${josa(a, "과/와")} ${b} 자신은 들어가지 않아요.`,
      explanation: `${a} < ${inside} < ${b}`,
    };
  });
}

/** 4□7 > 458 에서 □ 안에 들어갈 수 있는 수 */
export function boxIneq(id: string, d: 3 | 4) {
  return word(id, (rand) => {
    const ds = Array.from({ length: d }, (_, i) => randInt(rand, i === 0 ? 1 : 0, 9));
    const pos = randInt(rand, 1, d - 2);
    const other = Number(ds.join("")) + randInt(rand, -3, 3) * 10 ** (d - 1 - pos) + randInt(rand, -9, 9);
    if (other < 10 ** (d - 1) || other >= 10 ** d) return null;
    const greater = rand() < 0.5;
    const fits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((x) => {
      const v = Number(ds.map((y, i) => (i === pos ? x : y)).join(""));
      return greater ? v > other : v < other;
    });
    if (fits.length < 2 || fits.length > 8) return null;
    const shown = ds.map((y, i) => (i === pos ? "□" : y)).join("");
    // '>'에서 가장 큰 수는 늘 9, '<'에서 가장 작은 수는 늘 0이므로 묻지 않는다
    const ask = pick(rand, greater ? (["count", "min"] as const) : (["count", "max"] as const));
    const answer = ask === "count" ? fits.length : ask === "max" ? Math.max(...fits) : Math.min(...fits);
    return {
      key: `${shown}:${other}:${greater}:${ask}`,
      prompt: `0부터 9까지의 수 중에서 □ 안에 들어갈 수 있는 ${ask === "count" ? "수는 모두 몇 개인가요" : `수 중 가장 ${ask === "max" ? "큰" : "작은"} 수는 얼마인가요`}?`,
      expression: `${shown} ${greater ? ">" : "<"} ${other}`,
      answer,
      unit: ask === "count" ? "개" : undefined,
      hint: "높은 자리부터 비교하고, □의 자리 숫자가 같을 때는 그 다음 자리까지 비교해요.",
      explanation: `□ 안에 들어갈 수 있는 수: ${fits.join(", ")}`,
    };
  });
}

/** 네 명이 가진 돈 비교하기 */
export function moneyJudge(id: string, d: 3 | 4) {
  return word(id, (rand) => {
    const coins = d === 3 ? [100, 10] : [1000, 100, 10];
    const names = shuffle(rand, NAMES).slice(0, 4);
    const lead = randInt(rand, 2, 7);
    const sets = names.map((_, i) => coins.map((_, j) => (j === 0 ? lead + (i === 0 ? 0 : randInt(rand, -1, 0)) : randInt(rand, 0, 15))));
    const totals = sets.map((s) => s.reduce((t, c, j) => t + c * coins[j], 0));
    if (new Set(totals).size < 4) return null;
    const max = Math.max(...totals);
    const answer = names[totals.indexOf(max)];
    const label = (c: number) => (c === 1000 ? "1000원짜리 지폐" : `${c}원짜리 동전`);
    return {
      key: sets.flat().join(":"),
      prompt: `네 사람이 가진 돈입니다. 가장 많은 돈을 가진 사람은 누구인가요? ${names.map((n, i) => `${n}: ${sets[i].map((c, j) => `${label(coins[j])} ${c}${coins[j] === 1000 ? "장" : "개"}`).join(", ")}`).join(" / ")}`,
      choices: shuffle(rand, names),
      answer,
      hint: "각자 가진 돈을 수로 나타낸 뒤 높은 자리부터 비교해요. 동전 10개는 윗자리 1로 바꿔요.",
      explanation: names.map((n, i) => `${n} ${totals[i]}원`).join(", ") + ` → ${answer}`,
    };
  });
}

/* ═══ 2-1 1. 세 자리 수 ═══ */

export const hundredFill = baseFill("l2-hundred-fill", 100);
export const toHundred = toBase("l2-to-hundred", 100);
export const hundredNot = notBase("l2-hundred-not", 100);
export const hundredCoins = coinCompare("l2-hundred-coins", 100);

export const hundredNeed = word("l2-hundred-need", (rand) => {
  const a = randInt(rand, 4, 8);
  const b = randInt(rand, 1, 9);
  const c = randInt(rand, 3, 15);
  const have = a * 10 + b + c;
  if (have >= 100) return null;
  return {
    key: `${a}:${b}:${c}`,
    prompt: `구슬이 10개씩 ${a}봉지와 낱개 ${b}개 있습니다. 친구에게 구슬 ${c}개를 더 받았습니다. 구슬이 100개가 되려면 몇 개가 더 있어야 하나요?`,
    answer: 100 - have,
    unit: "개",
    hint: "먼저 지금 가진 구슬이 몇 개인지 구해요.",
    explanation: `${a * 10 + b} + ${c} = ${have}, 100 − ${have} = ${100 - have}(개)`,
    mistakes: { [100 - a * 10 - b]: "친구에게 받은 구슬도 더해야 해요." },
  };
});

export const hundredsRead = multRead("l2-hundreds-read", 100);
export const hundredsSum = multSum("l2-hundreds-sum", 100);
export const hundredsOdd = multOdd("l2-hundreds-odd", 100);
export const hundredsReverse = multReverse("l2-hundreds-reverse", 100);
export const hundredsIneq = multIneq("l2-hundreds-ineq", 100);

export const read3 = readChoice("l2-read3", 3);
export const write3 = writeChoice("l2-write3", 3);
export const bundle3 = modelBundle("l2-bundle3", 3);
export const cards3 = cardsNumber("l2-cards3", 3);
export const digit3 = digitAt("l2-digit3", 3);
export const expand3 = expandMissing("l2-expand3", 3);
export const placeFind3 = placeFind("l2-place-find3", 3);
export const cond3 = condNumber("l2-cond3", 3);
export const placeError3 = placeError("l2-place-error3", 3);
export const skipRule3 = skipRule("l2-skip-rule3", 3);
export const skipSave3 = skipSave("l2-skip-save3", 3);
export const extreme3 = extremeNumber("l2-extreme3", 3);
export const between3 = betweenChoice("l2-between3", 3);
export const boxIneq3 = boxIneq("l2-box-ineq3", 3);
export const money3 = moneyJudge("l2-money3", 3);

/* ═══ 2-1 2. 여러 가지 도형 ═══ */

const POLY = ["삼각형", "사각형", "오각형", "육각형"];

export const shapeParts = easy("l2-shape-parts", (rand) => {
  const i = randInt(rand, 0, 3);
  const part = pick(rand, ["변", "꼭짓점"]);
  return {
    key: `${i}:${part}`,
    prompt: `${POLY[i]}의 ${josa(part, "은/는")} 몇 개인가요?`,
    answer: i + 3,
    unit: "개",
    hint: part === "변" ? "도형을 둘러싼 곧은 선을 세어요." : "곧은 선 두 개가 만나는 점을 세어요.",
    explanation: `${POLY[i]}은 변과 꼭짓점이 각각 ${i + 3}개입니다.`,
  };
});

export const shapeByParts = easy("l2-shape-by-parts", (rand) => {
  const i = randInt(rand, 0, 3);
  const part = pick(rand, ["변", "꼭짓점"]);
  const answer = POLY[i];
  return {
    key: `${i}:${part}`,
    prompt: `${josa(part, "이/가")} ${i + 3}개인 도형의 이름을 고르세요.`,
    choices: shuffle(rand, POLY),
    answer,
    hint: `${part}의 수로 도형의 이름을 정해요.`,
    explanation: `${part}이 ${i + 3}개이면 ${answer}입니다.`,
  };
});

const TRI_TRUE = ["곧은 선 3개로 둘러싸여 있어요.", "꼭짓점이 3개예요.", "변이 3개예요."];
const QUAD_TRUE = ["곧은 선 4개로 둘러싸여 있어요.", "꼭짓점이 4개예요.", "변이 4개예요."];
const CIRCLE_TRUE = ["어느 쪽에서 보아도 똑같이 동그래요.", "곧은 선이 없어요.", "꼭짓점이 없어요.", "굽은 선으로 둘러싸여 있어요."];
const SHAPE_FALSE: Record<string, string[]> = {
  삼각형: ["꼭짓점이 4개예요.", "굽은 선이 있어요.", "변이 2개예요.", "곧은 선 4개로 둘러싸여 있어요."],
  사각형: ["꼭짓점이 3개예요.", "변이 5개예요.", "굽은 선으로 둘러싸여 있어요.", "곧은 선 3개로 둘러싸여 있어요."],
  원: ["꼭짓점이 1개예요.", "변이 1개예요.", "곧은 선으로 둘러싸여 있어요.", "뾰족한 부분이 있어요."],
};

/** 도형 설명 중 옳지 않은 것 고르기 */
export function shapeFact(id: string, name: "삼각형" | "사각형" | "원") {
  const trues = name === "삼각형" ? TRI_TRUE : name === "사각형" ? QUAD_TRUE : CIRCLE_TRUE;
  return mid(id, (rand) => {
    const answer = pick(rand, SHAPE_FALSE[name]);
    const choices = opts(rand, answer, shuffle(rand, trues));
    if (!choices) return null;
    return {
      key: `${answer}:${choices.join()}`,
      prompt: `${name}에 대한 설명으로 옳지 않은 것을 고르세요.`,
      choices,
      answer,
      hint: `${name}을 떠올리며 변과 꼭짓점을 세어 보세요.`,
      explanation: `'${answer}'는 옳지 않아요. ${name}은 ${trues[0]}`,
    };
  });
}

export const triFact = shapeFact("l2-tri-fact", "삼각형");
export const quadFact = shapeFact("l2-quad-fact", "사각형");
export const circleFact = shapeFact("l2-circle-fact", "원");

/** 선을 그어 나눈 도형에서 크고 작은 삼각형(사각형) 세기 */
function splitFigure(id: string, kind: "삼각형" | "사각형") {
  return word(id, (rand) => {
    const n = randInt(rand, 2, 5);
    const w = 240;
    const polygons: ShapeScene["polygons"] = [];
    const lines: NonNullable<ShapeScene["lines"]> = [];
    if (kind === "삼각형") {
      polygons.push({ points: [[120, 10], [10, 150], [230, 150]] });
      for (let i = 1; i < n; i++) lines.push({ from: [120, 10], to: [10 + (220 * i) / n, 150] });
    } else {
      polygons.push({ points: [[10, 20], [230, 20], [230, 120], [10, 120]] });
      for (let i = 1; i < n; i++) lines.push({ from: [10 + (220 * i) / n, 20], to: [10 + (220 * i) / n, 120] });
    }
    const total = (n * (n + 1)) / 2;
    return {
      key: `${n}`,
      prompt: `그림에서 찾을 수 있는 크고 작은 ${kind}은 모두 몇 개인가요?`,
      visual: { kind: "shape", width: w, height: kind === "삼각형" ? 160 : 140, label: `${kind}을 ${n}조각으로 나눈 그림`, polygons, lines },
      answer: total,
      unit: "개",
      hint: `${kind} 1개짜리, 2개를 합친 것, 3개를 합친 것…으로 나누어 세어요.`,
      explanation: Array.from({ length: n }, (_, i) => `${i + 1}개짜리 ${n - i}개`).join(", ") + ` → ${total}개`,
      mistakes: { [n]: "작은 도형만 세었어요. 합쳐서 만든 큰 도형도 세어야 해요." },
    };
  });
}

export const triSplit = splitFigure("l2-tri-split", "삼각형");
export const quadSplit = splitFigure("l2-quad-split", "사각형");

const SHAPE_MISTAKES: [string, string, string[]][] = [
  ["원은 꼭짓점이 1개예요.", "원은 굽은 선으로만 둘러싸여 꼭짓점이 없어요.", ["원은 꼭짓점이 2개예요.", "원은 변이 1개예요.", "원은 곧은 선으로 둘러싸여 있어요."]],
  ["삼각형은 꼭짓점이 4개예요.", "삼각형은 꼭짓점이 3개예요.", ["삼각형은 꼭짓점이 없어요.", "삼각형은 변이 4개예요.", "삼각형은 굽은 선이 있어요."]],
  ["사각형은 변이 3개예요.", "사각형은 변이 4개예요.", ["사각형은 변이 5개예요.", "사각형은 꼭짓점이 3개예요.", "사각형은 변이 없어요."]],
  ["끝이 벌어진 세 선으로 된 도형도 삼각형이에요.", "삼각형은 곧은 선 3개로 완전히 둘러싸여 있어야 해요.", ["삼각형은 굽은 선이 있어야 해요.", "삼각형은 꼭짓점이 4개여야 해요.", "선이 벌어져 있어도 삼각형이에요."]],
  ["육각형은 꼭짓점이 5개예요.", "육각형은 꼭짓점이 6개예요.", ["육각형은 꼭짓점이 7개예요.", "육각형은 변이 5개예요.", "육각형은 굽은 선으로 둘러싸여 있어요."]],
];

export const shapeError = word("l2-shape-error", (rand) => {
  const [said, right, wrongs] = pick(rand, SHAPE_MISTAKES);
  const name = pick(rand, NAMES);
  const choices = opts(rand, right, shuffle(rand, wrongs));
  if (!choices) return null;
  return {
    key: `${name}:${said}:${choices.join()}`,
    prompt: `${josa(name, "은/는")} "${said}"라고 말했습니다. 바르게 고친 것을 고르세요.`,
    choices,
    answer: right,
    hint: "도형을 그려 보고 변과 꼭짓점을 세어 보세요.",
    explanation: right,
  };
});

/* ═══ 2-1 3. 덧셈과 뺄셈 ═══ */

type Pair = (rand: () => number) => [number, number];

export const pairAdd21: Pair = (rand) => {
  const b = randInt(rand, 3, 9);
  return [randInt(rand, 1, 8) * 10 + randInt(rand, 10 - b, 9), b];
};
export const pairAdd22: Pair = (rand) => {
  for (;;) {
    const a = randInt(rand, 15, 89);
    const b = randInt(rand, 12, 89);
    if (hasCarry(a % 10, b % 10) && a + b <= 180) return [a, b];
  }
};
/**
 * 합이 99 이하인 받아올림 있는 쌍. 합을 다시 빼거나(□ 구하기·덧셈과 뺄셈의 관계) 다음 단계에서 더할 때 쓴다.
 * 2-1 뺄셈은 (두 자리)−(두 자리)까지라 합이 세 자리이면 3-1 계산이 된다
 */
const SMALL_PAIRS = new Map<number, number[]>();
for (let a = 15; a <= 84; a++) for (let b = 12; a + b <= 99; b++) if (hasCarry(a % 10, b % 10)) SMALL_PAIRS.set(b, [...(SMALL_PAIRS.get(b) ?? []), a]);
const SMALL_BS = [...SMALL_PAIRS.keys()];
/** b(□ 구하기의 정답)를 먼저 고르게 뽑고 a를 고른다(a를 먼저 뽑으면 b가 10대, 일의 자리 9로 쏠린다) */
export const pairAdd22Small: Pair = (rand) => {
  const b = pick(rand, SMALL_BS);
  return [pick(rand, SMALL_PAIRS.get(b)!), b];
};
export const pairSub21: Pair = (rand) => {
  const o = randInt(rand, 0, 7);
  return [randInt(rand, 2, 9) * 10 + o, randInt(rand, o + 1, 9)];
};
export const pairSubTens: Pair = (rand) => {
  const a = randInt(rand, 3, 9) * 10;
  let b = randInt(rand, 11, a - 1);
  if (b % 10 === 0) b += randInt(rand, 1, 9);
  return [a, Math.min(b, a - 1)];
};
export const pairSub22: Pair = (rand) => {
  for (;;) {
    const a = randInt(rand, 31, 98);
    const b = randInt(rand, 12, a - 10);
    if (hasBorrow(a, b)) return [a, b];
  }
};

const calc = (op: "+" | "-", a: number, b: number) => (op === "+" ? a + b : a - b);
const OP = (op: "+" | "-") => (op === "+" ? "+" : "−");
const naive = (op: "+" | "-", a: number, b: number) => (op === "+" ? addWithoutCarry(a, b) : subtractWithoutBorrow(a, b));

/** 세로셈 계산(하) */
export function columnCalc(id: string, pair: Pair, op: "+" | "-") {
  return easy(id, (rand) => {
    const [a, b] = pair(rand);
    return {
      key: `${a}:${b}`,
      prompt: "계산해 보세요.",
      visual: { kind: "column", op, a, b },
      answer: calc(op, a, b),
      hint: op === "+" ? "일의 자리 합이 10이거나 10보다 크면 십의 자리로 1을 받아올려요." : "일의 자리끼리 뺄 수 없으면 십의 자리에서 10을 받아내려요.",
      explanation: `${a} ${OP(op)} ${b} = ${calc(op, a, b)}`,
      mistakes: { [naive(op, a, b)]: op === "+" ? "받아올림을 빠뜨렸어요." : "받아내림 없이 큰 수에서 작은 수를 뺐어요." },
    };
  });
}

/** 잘못 계산한 식을 보고 바르게 계산하기(중) */
export function fixCalc(id: string, pair: Pair, op: "+" | "-") {
  return mid(id, (rand) => {
    const [a, b] = pair(rand);
    // 뺄셈은 받아내림을 하고 십의 자리 숫자를 1 줄이지 않은 흔한 실수(64 − 8 = 66)
    const wrong = op === "+" ? addWithoutCarry(a, b) : calc(op, a, b) + 10;
    if (wrong === calc(op, a, b)) return null;
    return {
      key: `${a}:${b}`,
      prompt: "잘못 계산한 식입니다. 바르게 계산한 값을 쓰세요.",
      expression: `${a} ${OP(op)} ${b} = ${wrong}`,
      answer: calc(op, a, b),
      hint: op === "+" ? "받아올린 1을 십의 자리에 더했는지 확인해요." : "받아내린 뒤 십의 자리 숫자가 1 작아졌는지 확인해요.",
      explanation: `${op === "+" ? "받아올림" : "받아내림"}을 하면 ${a} ${OP(op)} ${b} = ${calc(op, a, b)}`,
      mistakes: { [wrong]: "잘못 계산한 값을 그대로 썼어요." },
    };
  });
}

/** 계산 결과가 가장 큰/작은 식 고르기(중) */
export function extremeCalc(id: string, pair: Pair, op: "+" | "-") {
  return mid(id, (rand) => {
    const ps = Array.from({ length: 4 }, () => pair(rand));
    const vals = ps.map(([a, b]) => calc(op, a, b));
    if (new Set(vals).size < 4) return null;
    const big = rand() < 0.5;
    const target = big ? Math.max(...vals) : Math.min(...vals);
    const exprs = ps.map(([a, b]) => `${a} ${OP(op)} ${b}`);
    const answer = exprs[vals.indexOf(target)];
    return {
      key: `${exprs.join()}:${big}`,
      prompt: `계산 결과가 가장 ${big ? "큰" : "작은"} 것을 고르세요.`,
      choices: shuffle(rand, exprs),
      answer,
      hint: "하나씩 계산한 뒤 비교해요.",
      explanation: exprs.map((e, i) => `${e} = ${vals[i]}`).join(", "),
    };
  });
}

/** □ 안에 알맞은 수(거꾸로 생각, 중) */
export function missingCalc(id: string, pair: Pair, op: "+" | "-") {
  return mid(id, (rand) => {
    const [a, b] = pair(rand);
    const c = calc(op, a, b);
    const hideA = rand() < 0.5;
    return {
      key: `${a}:${b}:${hideA}`,
      prompt: "□ 안에 알맞은 수를 써넣으세요.",
      expression: `${hideA ? "□" : a} ${OP(op)} ${hideA ? b : "□"} = ${c}`,
      answer: hideA ? a : b,
      hint: op === "+" ? "덧셈식은 뺄셈식으로 바꾸어 □를 구해요." : hideA ? "□ − ▲ = ●는 ● + ▲ = □로 바꿔요." : "▲ − □ = ●는 ▲ − ● = □로 바꿔요.",
      explanation: op === "+" ? `□ = ${c} − ${hideA ? b : a} = ${hideA ? a : b}` : hideA ? `□ = ${c} + ${b} = ${a}` : `□ = ${a} − ${c} = ${b}`,
    };
  });
}

const ADD_STORIES = [
  (a: number, b: number) => `색종이가 ${a}장 있습니다. ${b}장을 더 샀습니다. 색종이는 모두 몇 장인가요?|장`,
  (a: number, b: number) => `운동장에 학생이 ${a}명 있습니다. ${b}명이 더 왔습니다. 운동장에 있는 학생은 모두 몇 명인가요?|명`,
  (a: number, b: number) => `줄넘기를 어제는 ${a}번, 오늘은 ${b}번 넘었습니다. 이틀 동안 모두 몇 번 넘었나요?|번`,
];
const SUB_STORIES = [
  (a: number, b: number) => `귤이 ${a}개 있습니다. 그중 ${b}개를 먹었습니다. 남은 귤은 몇 개인가요?|개`,
  (a: number, b: number) => `버스에 ${a}명이 타고 있었습니다. 이번 정류장에서 ${b}명이 내렸습니다. 버스에 남은 사람은 몇 명인가요?|명`,
  (a: number, b: number) => `동화책이 ${a}쪽입니다. ${b}쪽을 읽었습니다. 더 읽어야 할 쪽수는 몇 쪽인가요?|쪽`,
  (a: number, b: number) => `빨간 풍선이 ${a}개, 파란 풍선이 ${b}개 있습니다. 빨간 풍선은 파란 풍선보다 몇 개 더 많나요?|개`,
];

/** 한 단계 문장제(중) */
export function storyCalc(id: string, pair: Pair, op: "+" | "-") {
  return mid(id, (rand) => {
    const [a, b] = pair(rand);
    const k = randInt(rand, 0, (op === "+" ? ADD_STORIES : SUB_STORIES).length - 1);
    const [prompt, unit] = (op === "+" ? ADD_STORIES : SUB_STORIES)[k](a, b).split("|");
    return {
      key: `${k}:${a}:${b}`,
      prompt,
      answer: calc(op, a, b),
      unit,
      hint: op === "+" ? "모두 몇인지 구할 때는 더해요." : "남은 수나 더 많은 수를 구할 때는 빼요.",
      explanation: `${a} ${OP(op)} ${b} = ${calc(op, a, b)}(${unit})`,
      mistakes: { [calc(op === "+" ? "-" : "+", a, b)]: op === "+" ? "더해야 해요." : "빼야 해요." },
    };
  });
}

export const add21 = columnCalc("l2-add21", pairAdd21, "+");
export const add21Fix = fixCalc("l2-add21-fix", pairAdd21, "+");
export const add21Story = storyCalc("l2-add21-story", pairAdd21, "+");

export const add21Cards = word("l2-add21-cards", (rand) => {
  const cards = distinctDigits(rand, 3, 1);
  const big = rand() < 0.5;
  const s = [...cards].sort((a, b) => (big ? b - a : a - b));
  const two = s[0] * 10 + s[1];
  // 받아올림 차시라 받아올림이 있는 덧셈만
  if (!hasCarry(two % 10, s[2])) return null;
  return {
    key: `${cards.join("")}:${big}`,
    prompt: `수 카드 ${cards.join(", ")} 중 2장으로 가장 ${big ? "큰" : "작은"} 두 자리 수를 만들고, 남은 카드의 수를 더하면 얼마인가요?`,
    answer: two + s[2],
    hint: `가장 ${big ? "큰" : "작은"} 두 자리 수는 십의 자리에 가장 ${big ? "큰" : "작은"} 수를 놓아요.`,
    explanation: `${two} + ${s[2]} = ${two + s[2]}`,
  };
});

export const add21Ineq = word("l2-add21-ineq", (rand) => {
  const a = randInt(rand, 1, 8) * 10 + randInt(rand, 5, 9);
  const k = randInt(rand, 1, 7);
  if (!hasCarry(a % 10, k)) return null;
  const t = a + k;
  const ask = pick(rand, ["min", "count"] as const);
  return {
    key: `${a}:${t}:${ask}`,
    prompt: `1부터 9까지의 수 중에서 □ 안에 들어갈 수 있는 ${ask === "min" ? "가장 작은 수는 얼마인가요" : "수는 모두 몇 개인가요"}?`,
    expression: `${a} + □ > ${t}`,
    answer: ask === "min" ? k + 1 : 9 - k,
    unit: ask === "count" ? "개" : undefined,
    hint: `먼저 ${a} + □ = ${josa(t, "이/가")} 되는 □를 구해 보세요.`,
    explanation: `${a} + ${k} = ${t}이므로 □는 ${k}보다 커야 해요 → ${Array.from({ length: 9 - k }, (_, i) => k + 1 + i).join(", ")}`,
    mistakes: { [k]: `□가 ${k}이면 ${josa(t, "과/와")} 같아요. 더 커야 해요.` },
  };
});

export const add22Row = easy("l2-add22-row", (rand) => {
  const [a, b] = pairAdd22(rand);
  return {
    key: `${a}:${b}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: `${a} + ${b} = □`,
    answer: a + b,
    hint: "일의 자리부터 더하고, 10이 넘으면 십의 자리로 받아올려요.",
    explanation: `${a} + ${b} = ${a + b}`,
    mistakes: { [addWithoutCarry(a, b)]: "받아올림을 빠뜨렸어요." },
  };
});
export const add22Max = extremeCalc("l2-add22-max", pairAdd22, "+");

export const add22Cards = word("l2-add22-cards", (rand) => {
  const cards = distinctDigits(rand, 4, 1);
  const s = [...cards].sort((a, b) => b - a);
  const big = s[0] * 10 + s[1];
  const small = s[3] * 10 + s[2];
  return {
    key: cards.join(""),
    prompt: `수 카드 ${josa(cards.join(", "), "을/를")} 한 번씩만 사용하여 두 자리 수 2개를 만들려고 합니다. 만들 수 있는 가장 큰 수와 남은 카드로 만들 수 있는 가장 작은 수의 합은 얼마인가요?`,
    answer: big + small,
    hint: "가장 큰 수를 먼저 만들고, 남은 두 장으로 가장 작은 수를 만들어요.",
    explanation: `${big} + ${small} = ${big + small}`,
  };
});

export const add22Compare = word("l2-add22-compare", (rand) => {
  const [n1, n2] = shuffle(rand, NAMES);
  const [a, b] = pairAdd22(rand);
  // 둘째 사람의 수(a + b)를 다시 더하므로 두 자리여야 한다((두 자리)+(세 자리)는 3-1)
  if (b > 40 || a + b > 99) return null;
  return {
    key: `${a}:${b}`,
    prompt: `${josa(n1, "은/는")} 딱지를 ${a}장 가지고 있고, ${josa(n2, "은/는")} ${n1}보다 ${b}장 더 많이 가지고 있습니다. 두 사람이 가진 딱지는 모두 몇 장인가요?`,
    answer: a + a + b,
    unit: "장",
    hint: `먼저 ${josa(n2, "이/가")} 가진 딱지 수를 구해요.`,
    explanation: `${n2}: ${a} + ${b} = ${a + b}(장), 모두: ${a} + ${a + b} = ${2 * a + b}(장)`,
    mistakes: { [a + b]: `${n2}의 딱지 수만 구했어요.` },
  };
});

export const sub21 = columnCalc("l2-sub21", pairSub21, "-");
export const sub21Fix = fixCalc("l2-sub21-fix", pairSub21, "-");
export const sub21Story = storyCalc("l2-sub21-story", pairSub21, "-");

export const sub21Wrong = word("l2-sub21-wrong", (rand) => {
  const [x, b] = pairSub21(rand);
  if (x + b > 99) return null;
  return {
    key: `${x}:${b}`,
    prompt: `어떤 수에서 ${josa(b, "을/를")} 빼야 할 것을 잘못하여 더했더니 ${josa(x + b, "이/가")} 되었습니다. 바르게 계산하면 얼마인가요?`,
    answer: x - b,
    hint: `먼저 어떤 수를 구해요: □ + ${b} = ${x + b}`,
    explanation: `어떤 수 = ${x + b} − ${b} = ${x}, 바른 계산: ${x} − ${b} = ${x - b}`,
    mistakes: { [x]: "어떤 수만 구했어요. 바르게 계산까지 해야 해요." },
  };
});

export const sub21Ineq = word("l2-sub21-ineq", (rand) => {
  const a = randInt(rand, 2, 9) * 10 + randInt(rand, 0, 4);
  const k = randInt(rand, 1, 7);
  const t = a - k;
  return {
    key: `${a}:${t}`,
    prompt: "1부터 9까지의 수 중에서 □ 안에 들어갈 수 있는 수는 모두 몇 개인가요?",
    expression: `${a} − □ < ${t}`,
    answer: 9 - k,
    unit: "개",
    hint: `먼저 ${a} − □ = ${josa(t, "이/가")} 되는 □를 구해요. 빼는 수가 커질수록 계산 결과는 작아져요.`,
    explanation: `${a} − ${k} = ${t}이므로 □는 ${k}보다 커야 해요 → ${Array.from({ length: 9 - k }, (_, i) => k + 1 + i).join(", ")}`,
    mistakes: { [k - 1]: "빼는 수가 커지면 결과가 작아져요." },
  };
});

export const subTens = columnCalc("l2-sub-tens", pairSubTens, "-");
export const subTensMissing = missingCalc("l2-sub-tens-missing", pairSubTens, "-");
export const subTensFix = fixCalc("l2-sub-tens-fix", pairSubTens, "-");

export const subTensChange = word("l2-sub-tens-change", (rand) => {
  const [n1, n2] = shuffle(rand, NAMES);
  const [a, x] = pairSubTens(rand);
  const [b, y] = pairSubTens(rand);
  const ca = a - x;
  const cb = b - y;
  if (ca === cb) return null;
  return {
    key: `${a}:${x}:${b}:${y}`,
    prompt: `${josa(n1, "은/는")} 붙임딱지 ${a}장 중에서 ${x}장을 썼고, ${josa(n2, "은/는")} 색종이 ${b}장 중에서 ${y}장을 썼습니다. 남은 것이 더 많은 사람은 몇 장 더 많이 남았나요?`,
    answer: Math.abs(ca - cb),
    unit: "장",
    hint: "두 사람에게 남은 수를 각각 구해 비교해요.",
    explanation: `${n1}: ${a} − ${x} = ${ca}(장), ${n2}: ${b} − ${y} = ${cb}(장) → ${Math.abs(ca - cb)}장`,
  };
});

export const subTensWrong = word("l2-sub-tens-wrong", (rand) => {
  const [a, b] = pairSubTens(rand);
  const x = a;
  const wrongAdd = rand() < 0.5;
  // 어떤 수(몇십)에서 b를 빼야 할 것을 b의 십과 일을 바꾼 수를 뺐다
  const swapped = (b % 10) * 10 + Math.floor(b / 10);
  if (wrongAdd || swapped >= x || swapped === b) {
    // 잘못 더한 수(x + b)에서 다시 빼므로 두 자리여야 한다
    if (x + b > 99) return null;
    return {
      key: `add:${x}:${b}`,
      prompt: `어떤 수에서 ${josa(b, "을/를")} 빼야 할 것을 잘못하여 더했더니 ${josa(x + b, "이/가")} 되었습니다. 바르게 계산하면 얼마인가요?`,
      answer: x - b,
      hint: `먼저 어떤 수를 구해요: □ + ${b} = ${x + b}`,
      explanation: `어떤 수 = ${x + b} − ${b} = ${x}, 바른 계산: ${x} − ${b} = ${x - b}`,
      mistakes: { [x]: "어떤 수만 구했어요." },
    };
  }
  return {
    key: `swap:${x}:${b}`,
    prompt: `어떤 수에서 ${josa(b, "을/를")} 빼야 할 것을 잘못하여 ${josa(swapped, "을/를")} 뺐더니 ${josa(x - swapped, "이/가")} 되었습니다. 바르게 계산하면 얼마인가요?`,
    answer: x - b,
    hint: `먼저 어떤 수를 구해요: □ − ${swapped} = ${x - swapped}`,
    explanation: `어떤 수 = ${x - swapped} + ${swapped} = ${x}, 바른 계산: ${x} − ${b} = ${x - b}`,
    mistakes: { [x]: "어떤 수만 구했어요." },
  };
});

export const sub22Min = extremeCalc("l2-sub22-min", pairSub22, "-");
export const sub22Missing = missingCalc("l2-sub22-missing", pairSub22, "-");

/** 수 카드로 만든 가장 큰 두 자리 수에서 두 자리 수 빼기(받아내림이 있는 계산만) */
export const sub22Cards = word("l2-sub22-cards", (rand) => {
  const cards = distinctDigits(rand, 3, 1);
  const desc = [...cards].sort((a, b) => b - a);
  const big = desc[0] * 10 + desc[1];
  const n = randInt(rand, 1, desc[0] - 1) * 10 + randInt(rand, desc[1] + 1, 9);
  if (desc[1] >= 9 || n >= big || n < 10) return null;
  return {
    key: `${cards.join("")}:${n}`,
    prompt: `수 카드 ${cards.join(", ")} 중 2장을 골라 가장 큰 두 자리 수를 만들었습니다. 만든 수에서 ${josa(n, "을/를")} 빼면 얼마인가요?`,
    answer: big - n,
    hint: "가장 큰 수는 큰 수부터 십의 자리, 일의 자리에 놓아요. 일의 자리끼리 뺄 수 없으면 십의 자리에서 받아내려요.",
    explanation: `가장 큰 수 ${big}, ${big} − ${n} = ${big - n}`,
    mistakes: { [subtractWithoutBorrow(big, n)]: "받아내림을 하지 않았어요." },
  };
});

export const sub22Error = word("l2-sub22-error", (rand) => {
  const [a, b] = pairSub22(rand);
  const wrong = subtractWithoutBorrow(a, b);
  const name = pick(rand, NAMES);
  const r = a - b;
  const v = (x: number) => josa(x, "이에요/예요");
  const answer = `받아내림을 하지 않았어요. 바른 값은 ${v(r)}.`;
  const choices = opts(rand, answer, [
    `받아내림을 하지 않았어요. 바른 값은 ${v(r + 10)}.`,
    `두 수를 더했어요. 바른 값은 ${v(r)}.`,
    `십의 자리를 잘못 뺐어요. 바른 값은 ${v(wrong - 10)}.`,
  ]);
  if (!choices) return null;
  return {
    key: `${a}:${b}`,
    prompt: `${josa(name, "은/는")} ${a} − ${josa(b, "을/를")} ${josa(wrong, "으로/로")} 계산했습니다. 잘못된 까닭과 바른 값을 고르세요.`,
    choices,
    answer,
    hint: "일의 자리끼리 뺄 수 있는지 먼저 살펴보세요.",
    explanation: `일의 자리에서 ${a % 10} − ${josa(b % 10, "을/를")} 할 수 없으므로 십의 자리에서 10을 받아내려야 해요. ${a} − ${b} = ${r}`,
  };
});

export const threeMissing = mid("l2-three-missing", (rand) => {
  const a = randInt(rand, 20, 60);
  const b = randInt(rand, 12, 35);
  const c = randInt(rand, 8, a + b - 10);
  const r = a + b - c;
  return {
    key: `${a}:${b}:${c}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: `${a} + ${b} − □ = ${r}`,
    answer: c,
    hint: `먼저 ${a} + ${josa(b, "을/를")} 계산해요.`,
    explanation: `${a} + ${b} = ${a + b}, ${a + b} − □ = ${r} → □ = ${a + b} − ${r} = ${c}`,
  };
});

export const threeChoose = mid("l2-three-choose", (rand) => {
  const a = randInt(rand, 20, 50);
  const b = randInt(rand, 10, 30);
  const c = randInt(rand, 5, 20);
  const kind = randInt(rand, 0, 1);
  const prompt =
    kind === 0
      ? `놀이터에 어린이가 ${a}명 있었습니다. ${b}명이 더 오고 ${c}명이 집으로 갔습니다. 놀이터에 있는 어린이 수를 구하는 식을 고르세요.`
      : `구슬이 ${a}개 있었습니다. 동생에게 ${b}개를 주고 형에게 ${c}개를 받았습니다. 지금 가진 구슬 수를 구하는 식을 고르세요.`;
  const answer = kind === 0 ? `${a} + ${b} − ${c}` : `${a} − ${b} + ${c}`;
  const choices = opts(rand, answer, [`${a} + ${b} + ${c}`, `${a} − ${b} − ${c}`, kind === 0 ? `${a} − ${b} + ${c}` : `${a} + ${b} − ${c}`]);
  if (!choices) return null;
  return {
    key: `${kind}:${a}:${b}:${c}`,
    prompt,
    choices,
    answer,
    hint: "늘어나면 더하고, 줄어들면 빼요.",
    explanation: answer,
  };
});

export const threeReverse = word("l2-three-reverse", (rand) => {
  const start = randInt(rand, 20, 60);
  const off = randInt(rand, 8, Math.min(30, start - 5));
  const on = randInt(rand, 8, 30);
  const now = start - off + on;
  return {
    key: `${start}:${off}:${on}`,
    prompt: `버스에 몇 명이 타고 있었습니다. 이번 정류장에서 ${off}명이 내리고 ${on}명이 탔더니 ${now}명이 되었습니다. 처음 버스에 타고 있던 사람은 몇 명인가요?`,
    answer: start,
    unit: "명",
    hint: "거꾸로 생각해요. 탄 사람은 빼고, 내린 사람은 더해요.",
    explanation: `${now} − ${on} + ${off} = ${start}(명)`,
    mistakes: { [now + on - off]: "거꾸로 생각할 때는 탄 사람을 빼고 내린 사람을 더해요." },
  };
});

export const relationFact = easy("l2-relation-fact", (rand) => {
  const [a, b] = pairAdd22Small(rand);
  const c = a + b;
  const kind = randInt(rand, 0, 1);
  // 정답은 늘 b(고르게 뽑힌 수), 덧셈식에서 앞의 수를 빼는지 뒤의 수를 빼는지는 kind로 바꾼다
  const [p, q] = kind ? [a, b] : [b, a];
  return {
    key: `${a}:${b}:${kind}`,
    prompt: "덧셈식을 보고 뺄셈식을 완성하세요.",
    expression: `${p} + ${q} = ${c}  →  ${c} − ${a} = □`,
    answer: b,
    hint: "전체에서 한 부분을 빼면 다른 부분이 남아요.",
    explanation: `${c} − ${a} = ${b}`,
  };
});

export const relationChoose = mid("l2-relation-choose", (rand) => {
  const [a, b] = pairAdd22Small(rand);
  const c = a + b;
  const answer = rand() < 0.5 ? `${a} + ${b} = ${c}` : `${b} + ${a} = ${c}`;
  const choices = opts(rand, answer, [`${c} + ${a} = ${b}`, `${c} + ${b} = ${a}`, `${a} + ${c} = ${b}`]);
  if (!choices) return null;
  return {
    key: `${a}:${b}:${answer}`,
    prompt: `뺄셈식 ${c} − ${a} = ${josa(b, "을/를")} 덧셈식으로 바르게 나타낸 것을 고르세요.`,
    choices,
    answer,
    hint: "뺄셈식의 두 부분을 더하면 전체가 돼요.",
    explanation: `${c} − ${a} = ${b} → ${a} + ${b} = ${c}`,
  };
});

export const relationError = word("l2-relation-error", (rand) => {
  const [x, b] = pairSub22(rand);
  const r = x - b;
  const name = pick(rand, NAMES);
  const answer = `□ = ${r} + ${b} = ${x}`;
  const choices = opts(rand, answer, [`□ = ${Math.max(r, b)} − ${Math.min(r, b)} = ${Math.abs(r - b)}`, `□ = ${x} − ${r} = ${b}`, `□ = ${r} + ${b} = ${addWithoutCarry(r, b)}`]);
  if (!choices) return null;
  return {
    key: `${x}:${b}`,
    prompt: `${josa(name, "은/는")} □ − ${b} = ${r}에서 □를 ${Math.max(r, b)} − ${Math.min(r, b)} = ${josa(Math.abs(r - b), "으로/로")} 구했습니다. □를 바르게 구한 것을 고르세요.`,
    choices,
    answer,
    hint: "□ − ▲ = ●는 ● + ▲ = □로 바꾸어 구해요.",
    explanation: `□ − ${b} = ${r} → □ = ${r} + ${b} = ${x}`,
  };
});

export const boxSolve = easy("l2-box-solve", (rand) => {
  const [a, b] = pairAdd21(rand);
  const kind = randInt(rand, 0, 1);
  return kind
    ? {
        key: `a:${a}:${b}`,
        prompt: "□ 안에 알맞은 수를 구하세요.",
        expression: `□ + ${b} = ${a + b}`,
        answer: a,
        hint: "덧셈식을 뺄셈식으로 바꿔요.",
        explanation: `□ = ${a + b} − ${b} = ${a}`,
      }
    : {
        key: `s:${a}:${b}`,
        prompt: "□ 안에 알맞은 수를 구하세요.",
        expression: `□ − ${b} = ${a}`,
        answer: a + b,
        hint: "뺄셈식을 덧셈식으로 바꿔요.",
        explanation: `□ = ${a} + ${b} = ${a + b}`,
        mistakes: { [a - b]: "더해야 해요." },
      };
});

/** "84 − □ = 18" 꼴(+, − 만)의 식이 □ = box일 때 참인지 */
function boxHolds(eq: string, box: number): boolean {
  const value = (side: string) => {
    const t = side.trim().replace(/□/g, String(box)).split(/\s+/);
    let v = Number(t[0]);
    for (let i = 1; i < t.length; i += 2) v += (t[i] === "+" ? 1 : -1) * Number(t[i + 1]);
    return v;
  };
  const [left, right] = eq.split("=");
  return value(left) === value(right);
}

export const boxWrite = mid("l2-box-write", (rand) => {
  const [a, b] = pairSub22(rand);
  const kind = randInt(rand, 0, 2);
  const stories = [
    [`사탕이 ${a}개 있었습니다. 몇 개를 먹었더니 ${a - b}개가 남았습니다. 먹은 사탕의 수를 □로 하여 식으로 나타낸 것을 고르세요.`, `${a} − □ = ${a - b}`],
    [`색종이가 몇 장 있었습니다. ${b}장을 사용했더니 ${a - b}장이 남았습니다. 처음 색종이의 수를 □로 하여 식으로 나타낸 것을 고르세요.`, `□ − ${b} = ${a - b}`],
    [`구슬이 ${a - b}개 있었습니다. 몇 개를 더 받았더니 ${a}개가 되었습니다. 받은 구슬의 수를 □로 하여 식으로 나타낸 것을 고르세요.`, `${a - b} + □ = ${a}`],
  ];
  const [prompt, answer] = stories[kind];
  // □의 참값(먹은 수·받은 수는 b, 처음 수는 a)으로도 성립하는 식은 또 하나의 정답이므로 오답 보기에서 뺀다
  const box = kind === 1 ? a : b;
  // 오답 식도 문제에 나온 두 수로만 만든다(□의 값이 보기에 나오면 답이 드러난다)
  const [x, y] = [[a, a - b], [b, a - b], [a - b, a]][kind];
  const wrongs = shuffle(rand, [`${x} + □ = ${y}`, `${y} − □ = ${x}`, `□ − ${y} = ${x}`, `□ + ${x} = ${y}`, `${x} − □ = ${y}`, `□ − ${x} = ${y}`, `${y} + □ = ${x}`]).filter((eq) => eq !== answer && !boxHolds(eq, box));
  const choices = opts(rand, answer, wrongs);
  if (!choices) return null;
  return {
    key: `${kind}:${a}:${b}`,
    prompt,
    choices,
    answer,
    hint: "모르는 수를 □로 놓고 이야기 순서대로 식을 써요.",
    explanation: answer,
  };
});

export const boxStory = mid("l2-box-story", (rand) => {
  const [a, b] = pairAdd22Small(rand);
  const name = pick(rand, NAMES);
  return {
    key: `${a}:${b}`,
    prompt: `${josa(name, "은/는")} 칭찬 붙임딱지를 ${a}장 모았습니다. 이번 주에 몇 장을 더 모았더니 ${a + b}장이 되었습니다. 이번 주에 모은 붙임딱지는 몇 장인가요?`,
    answer: b,
    unit: "장",
    hint: `${a} + □ = ${josa(a + b, "으로/로")} 나타내 보세요.`,
    explanation: `${a} + □ = ${a + b} → □ = ${a + b} − ${a} = ${b}(장)`,
    mistakes: { [2 * a + b]: "빼야 하는데 더했어요." },
  };
});

export const boxWrongAdd = word("l2-box-wrong-add", (rand) => {
  const x = randInt(rand, 20, 60);
  const a = randInt(rand, 12, 35);
  const b = randInt(rand, 12, 35);
  if (a === b) return null;
  return {
    key: `${x}:${a}:${b}`,
    prompt: `어떤 수에 ${josa(a, "을/를")} 더해야 할 것을 잘못하여 ${josa(b, "을/를")} 더했더니 ${josa(x + b, "이/가")} 되었습니다. 바르게 계산하면 얼마인가요?`,
    answer: x + a,
    hint: `먼저 어떤 수를 구해요: □ + ${b} = ${x + b}`,
    explanation: `어떤 수 = ${x + b} − ${b} = ${x}, 바른 계산: ${x} + ${a} = ${x + a}`,
    mistakes: { [x]: "어떤 수만 구했어요." },
  };
});

/**
 * 더해야 할 것을 잘못하여 뺀 '어떤 수' 역산(□ − a = r → □ → □ + a). 1-1 덧셈 차시에 있던 것을 □ 구하기([2수01-09]) 차시로 옮기며
 * 2-1 범위(두 자리 수, 받아올림·받아내림 포함)로 넓혔다. 학습 기록이 이어지도록 id는 그대로 둔다(docs/audit-v2/g1s1.md 9번)
 */
export const boxWrongSub = word("l1-w-wrong-add9", (rand) => {
  const a = randInt(rand, 11, 39);
  const x = randInt(rand, a + 10, 99 - a);
  const r = x - a;
  return {
    key: `${a}:${x}`,
    prompt: `어떤 수에 ${josa(a, "을/를")} 더해야 할 것을 잘못하여 뺐더니 ${josa(r, "이/가")} 되었습니다. 바르게 계산하면 얼마인가요?`,
    answer: x + a,
    hint: `먼저 어떤 수를 구해요: □ − ${a} = ${r}`,
    explanation: `어떤 수 = ${r} + ${a} = ${x}, 바른 계산: ${x} + ${a} = ${x + a}`,
    mistakes: { [x]: "어떤 수만 구했어요." },
  };
});

export const boxIneq2 = word("l2-box-ineq2", (rand) => {
  const a = randInt(rand, 15, 45);
  const t = a + randInt(rand, 20, 50);
  const less = rand() < 0.5;
  return {
    key: `${a}:${t}:${less}`,
    prompt: `□ 안에 들어갈 수 있는 두 자리 수 중에서 가장 ${less ? "큰" : "작은"} 수는 얼마인가요?`,
    expression: `${a} + □ ${less ? "<" : ">"} ${t}`,
    answer: less ? t - a - 1 : t - a + 1,
    hint: `먼저 ${a} + □ = ${t}인 □를 구해요.`,
    explanation: `${a} + ${t - a} = ${t}이므로 □는 ${t - a}보다 ${less ? "작아야" : "커야"} 해요 → ${less ? t - a - 1 : t - a + 1}`,
    mistakes: { [t - a]: `□가 ${t - a}이면 ${josa(t, "과/와")} 같아요.` },
  };
});
