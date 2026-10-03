import type { Generator } from "../types";
import { randInt } from "../../lib/random";
import { numberProblem } from "./common";
import { josa } from "../josa";

/**
 * 큰 단위·작은 단위 바꾸기(예: 3 cm 4 mm ↔ 34 mm) 생성기를 만든다.
 * rate: 큰 단위 1 = 작은 단위 rate
 */
export function unitConvert(opts: {
  id: string;
  level: 1 | 2;
  big: string;
  small: string;
  rate: number;
  maxBig: number;
}): Generator {
  const { id, level, big, small, rate, maxBig } = opts;
  // 한글 단위(분·초)는 수에 붙여 쓴다(6분 22초)
  const sp = /[가-힣]/.test(big) ? "" : " ";
  return {
    id,
    level,
    make(rand) {
      const a = randInt(rand, 1, maxBig);
      const b = randInt(rand, 1, rate - 1);
      const total = a * rate + b;
      const toSmall = rand() < 0.5;
      return toSmall
        ? numberProblem({
            typeId: id,
            key: `${id}:s:${a}:${b}`,
            prompt: "□ 안에 알맞은 수를 써넣으세요.",
            expression: `${a}${sp}${big} ${b}${sp}${small} = □${sp}${small}`,
            answer: total,
            hint: `1${sp}${big} = ${josa(`${rate}${sp}${small}`, "이에요/예요")}.`,
            explanation: `${a}${sp}${big} = ${a * rate}${sp}${small}이므로 ${a * rate} + ${b} = ${total}${sp}${small}`,
            mistakes: { [`${a}${b}`]: `${josa(big, "을/를")} ${josa(small, "으로/로")} 바꾸지 않고 숫자를 붙여 썼어요.`, [a + b]: "단위를 바꾸지 않고 더했어요." },
          })
        : numberProblem({
            typeId: id,
            key: `${id}:b:${a}:${b}`,
            prompt: "□ 안에 알맞은 수를 써넣으세요.",
            expression: `${total}${sp}${small} = □${sp}${big} □${sp}${small}`,
            answer: `${a},${b}`,
            fields: [big, small],
            hint: `${josa(`${rate}${sp}${small}`, "이/가")} ${josa(`1${sp}${big}`, "이에요/예요")}. ${rate}씩 묶어 보세요.`,
            explanation: `${total}${sp}${small} = ${a * rate}${sp}${small} + ${b}${sp}${small} = ${a}${sp}${big} ${b}${sp}${small}`,
          });
    },
  };
}

/** 큰 단위·작은 단위가 섞인 덧셈·뺄셈 */
export function unitAddSub(opts: { id: string; big: string; small: string; rate: number; maxBig: number; step?: number; nonzero?: boolean }): Generator {
  const { id, big, small, rate, maxBig, step = 1, nonzero = false } = opts;
  const value = (rand: () => number) => {
    let v = randInt(rand, rate / step + 1, (maxBig * rate) / step) * step;
    while (nonzero && v % rate === 0) v = randInt(rand, rate / step + 1, (maxBig * rate) / step) * step;
    return v;
  };
  return {
    id,
    level: 2,
    make(rand) {
      const add = rand() < 0.5;
      let x = value(rand);
      let y = value(rand);
      if (!add && x < y) [x, y] = [y, x];
      if (!add && x === y) x += rate;
      const r = add ? x + y : x - y;
      // "0 kg 900 g"처럼 큰 단위가 0이거나 작은 단위가 0인 답은 내지 않는다
      if (nonzero && (r % rate === 0 || r < rate)) return this.make(rand);
      const fmt = (n: number) => `${Math.floor(n / rate)} ${big} ${n % rate} ${small}`;
      const op = add ? "+" : "−";
      // 받아올림·받아내림을 하지 않은 실수
      const naiveBig = add ? Math.floor(x / rate) + Math.floor(y / rate) : Math.floor(x / rate) - Math.floor(y / rate);
      const naiveSmall = add ? (x % rate) + (y % rate) : Math.abs((x % rate) - (y % rate));
      return numberProblem({
        typeId: id,
        key: `${id}:${add}:${x}:${y}`,
        prompt: "계산해 보세요.",
        expression: `${fmt(x)} ${op} ${fmt(y)} = □ ${big} □ ${small}`,
        answer: `${Math.floor(r / rate)},${r % rate}`,
        fields: [big, small],
        hint: add
          ? `${small}끼리 더한 값이 ${rate} 이상이면 ${josa(`1 ${big}`, "으로/로")} 받아올려요.`
          : `${small}끼리 뺄 수 없으면 ${josa(`1 ${big}`, "을/를")} ${josa(`${rate} ${small}`, "으로/로")} 받아내려요.`,
        explanation: `${fmt(x)} ${op} ${fmt(y)} = ${fmt(r)}`,
        mistakes: { [`${naiveBig},${naiveSmall}`]: add ? "받아올림을 하지 않았어요." : "받아내림을 하지 않았어요." },
      });
    },
  };
}

/* 3-1 길이와 시간 */
export const lenCmMm = unitConvert({ id: "len-cm-mm", level: 1, big: "cm", small: "mm", rate: 10, maxBig: 30 });
export const lenKmM = unitConvert({ id: "len-km-m", level: 1, big: "km", small: "m", rate: 1000, maxBig: 9 });
export const lenAddSub = unitAddSub({ id: "len-add-sub", big: "cm", small: "mm", rate: 10, maxBig: 20, nonzero: true });
export const timeMinSec = unitConvert({ id: "time-min-sec", level: 1, big: "분", small: "초", rate: 60, maxBig: 9 });

/* 3-2 들이와 무게 */
export const volLMl = unitConvert({ id: "vol-l-ml", level: 1, big: "L", small: "mL", rate: 1000, maxBig: 9 });
export const volAddSub = unitAddSub({ id: "vol-add-sub", big: "L", small: "mL", rate: 1000, maxBig: 6, step: 10, nonzero: true });
export const wtKgG = unitConvert({ id: "wt-kg-g", level: 1, big: "kg", small: "g", rate: 1000, maxBig: 9 });
export const wtAddSub = unitAddSub({ id: "wt-add-sub", big: "kg", small: "g", rate: 1000, maxBig: 6, step: 10, nonzero: true });

export const wtTon: Generator = {
  id: "wt-ton",
  level: 2,
  make(rand) {
    const t = randInt(rand, 1, 9);
    const toKg = rand() < 0.5;
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${toKg}:${t}`,
      prompt: "□ 안에 알맞은 수를 써넣으세요.",
      expression: toKg ? `${t} t = □ kg` : `${t * 1000} kg = □ t`,
      answer: toKg ? t * 1000 : t,
      hint: "1 t = 1000 kg이에요.",
      explanation: t === 1 ? "1 t = 1000 kg" : toKg ? `1 t = 1000 kg이므로 ${t} t = ${t * 1000} kg` : `1000 kg = 1 t이므로 ${t * 1000} kg = ${t} t`,
      mistakes: toKg ? { [t * 100]: "0을 하나 빠뜨렸어요." } : {},
    });
  },
};
