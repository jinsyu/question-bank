import type { Generator, Level } from "../types";
import { randInt, shuffle } from "../../lib/random";
import { word } from "../words/word";
import { josa } from "../josa";
import { type LongDivLayout, longDivide, longDivVisual } from "../generators/long-division";

/**
 * 나눗셈 세로셈 빈칸 채우기(3-2 나눗셈, 4-1 곱셈과 나눗셈).
 * 교과서식 세로셈 그림에서 몫·곱한 수·내려 쓴 수·나머지 중 한두 칸을 비워 두고 구한다.
 * 나누는 수와 나누어지는 수는 늘 보이므로 빈칸의 수는 계산 과정으로 하나로 정해진다.
 */

type Pair = { a: number; b: number };

const PLACE = ["일", "십", "백"];

/** 빈칸 하나를 채우는 풀이 한 줄 */
export function stepText(d: LongDivLayout, i: number): string {
  const e = d.entries[i];
  const prev = d.entries[i - 1];
  if (e.role === "quotient") return `${d.a} ÷ ${d.b} = ${d.q}${d.r ? ` … ${d.r}` : ""}이므로 몫은 ${d.q}`;
  if (e.role === "product") return `몫의 ${PLACE[d.entries[0].end - e.end]}의 자리 숫자 ${josa(e.digit!, "과/와")} 나누는 수 ${josa(d.b, "을/를")} 곱하면 ${e.digit} × ${d.b} = ${e.value}`;
  const left = `${prev.top} − ${prev.value} = ${prev.top! - prev.value}`;
  const last = d.entries[0].end;
  /** 몫의 from~to 자리(나누어지는 수의 자리 번호)에 0을 쓴다는 말 */
  const zeros = (from: number, to: number) => {
    const places = Array.from({ length: to - from + 1 }, (_, k) => `${PLACE[last - (from + k)]}의 자리`);
    return `${d.b}보다 작아 몫의 ${places.join("와 ")}에 0을 쓰고`;
  };
  const COUNT = ["", "한", "두", "세"];
  if (e.role === "carry") {
    // 몫 가운데 0이 있으면 곱·뺄셈 줄 없이 두 자리 이상을 함께 내려 쓴다(612 ÷ 3의 12)
    const n = e.end - prev.end;
    return n === 1 ? `${left}, 다음 자리 숫자를 내려 쓰면 ${e.value}` : `${left}, 다음 자리 숫자를 내려 쓴 수가 ${zeros(prev.end + 1, e.end - 1)} ${COUNT[n]} 자리 숫자를 함께 내려 쓰면 ${e.value}`;
  }
  if (prev.top! - prev.value === e.value) return `${left}, 나머지는 ${e.value}`;
  // 몫의 끝자리들이 0이면 남은 자리 숫자를 내려 쓰고 나머지로 한다(502 ÷ 5: 몫 100, 02를 함께 내려 써 나머지 2)
  const n = e.end - prev.end;
  return n === 1
    ? `${left}, 다음 자리 숫자를 내려 쓴 ${josa(e.value, "은/는")} ${zeros(prev.end + 1, e.end)} 나머지는 ${e.value}`
    : `${left}, 다음 자리 숫자를 내려 쓴 수가 ${zeros(prev.end + 1, e.end)} ${COUNT[n]} 자리 숫자를 함께 내려 쓰면 ${e.value}, 나머지는 ${e.value}`;
}

const HINT = {
  quotient: "높은 자리부터 나누는 수를 몇 번 뺄 수 있는지 생각하여 몫을 써요.",
  product: "몫의 숫자와 나누는 수를 곱한 수를 그 아래에 써요.",
  carry: "위의 두 수를 뺀 다음, 나누어지는 수의 다음 자리 숫자를 내려 써요.",
  remainder: "마지막으로 빼고 남은 수가 나머지예요. 나머지는 나누는 수보다 작아요.",
} as const;

/**
 * 세로셈 빈칸 문제. blanks개(1이면 □, 2이면 ㉠·㉡)를 비운다.
 * 나머지가 0이면 나머지 칸(맨 아래 0)은 너무 쉬워 비우지 않고,
 * 빈칸이 하나일 때는 몫을 비우지 않는다(몫만 구하는 문제는 차시의 계산 유형과 같다).
 */
function longDivGen(id: string, level: Level, blanks: 1 | 2, draw: (rand: () => number) => Pair | null): Generator {
  return word(
    id,
    (rand) => {
      const p = draw(rand);
      if (!p) return null;
      const d = longDivide(p.a, p.b);
      const candidates = d.entries.flatMap((e, i) => ((e.role === "remainder" && e.value === 0) || (blanks === 1 && e.role === "quotient") ? [] : [i]));
      const chosen = shuffle(rand, candidates).slice(0, blanks).sort((x, y) => x - y);
      const names = blanks === 1 ? ["□"] : ["㉠", "㉡"];
      const visual = longDivVisual(d, Object.fromEntries(chosen.map((i, k) => [i, names[k]])));
      const values = chosen.map((i) => d.entries[i].value);
      const roles = [...new Set(chosen.map((i) => d.entries[i].role))];
      const check = d.r ? `${d.b} × ${d.q} = ${d.b * d.q}, ${d.b * d.q} + ${d.r} = ${d.a}` : `${d.b} × ${d.q} = ${d.a}`;
      const e = d.entries[chosen[0]];
      return {
        key: `${p.a}:${p.b}:${chosen.join("-")}`,
        prompt: blanks === 1 ? "나눗셈을 세로셈으로 계산했습니다. □ 안에 알맞은 수를 써넣으세요." : "나눗셈을 세로셈으로 계산했습니다. ㉠, ㉡에 알맞은 수를 차례로 쓰세요.",
        visual,
        answer: values.join(","),
        unit: blanks === 1 ? undefined : names,
        hint: roles.map((r) => HINT[r]).join(" "),
        explanation: blanks === 1 ? `${stepText(d, chosen[0])} (확인: ${check})` : `${chosen.map((i, k) => `${names[k]}: ${stepText(d, i)}`).join(" / ")} (확인: ${check})`,
        mistakes: blanks === 1 && e.role === "carry" && e.value >= 10 ? { [String(e.diff)]: "뺀 다음 나누어지는 수의 다음 자리 숫자를 내려 쓰지 않았어요." } : undefined,
      };
    },
    level,
  );
}

const oneDigit = (rand: () => number) => randInt(rand, 2, 9);

/** 3-2 나머지가 없는 (몇십몇)÷(몇): 몫이 두 자리 수, (몇십)÷(몇) 차시와 겹치지 않게 일의 자리가 0이 아닌 수 */
export const l3LongDivExact = longDivGen("l3-longdiv-exact", 1, 1, (rand) => {
  const b = oneDigit(rand);
  const q = randInt(rand, 10, Math.floor(99 / b));
  const a = b * q;
  return a % 10 === 0 ? null : { a, b };
});

/** 3-2 나머지가 있는 (몇십몇)÷(몇) */
export const l3LongDivRem = longDivGen("l3-longdiv-rem", 2, 2, (rand) => {
  const b = oneDigit(rand);
  const a = randInt(rand, 11, 99);
  return a % b === 0 || a / b < 10 ? null : { a, b };
});

/** 3-2 (세 자리 수)÷(한 자리 수): 몫이 두 자리·세 자리 수, 나머지가 있거나 없다 */
export const l3LongDiv3x1 = longDivGen("l3-longdiv-3x1", 2, 2, (rand) => {
  const b = oneDigit(rand);
  const a = randInt(rand, 100, 999);
  return a / b < 11 ? null : { a, b };
});

/** 4-1 (세 자리 수)÷(두 자리 수), 몫이 한 자리 수 */
function div3x2(rand: () => number, twoDigitQuotient: boolean): Pair | null {
  const b = randInt(rand, 12, 69);
  const q = twoDigitQuotient ? randInt(rand, 10, Math.floor(999 / b)) : randInt(rand, 2, 9);
  const a = b * q + randInt(rand, 0, b - 1);
  return a < 100 || a > 999 ? null : { a, b };
}
export const l4LongDivOne = longDivGen("l4-longdiv-one", 1, 1, (rand) => div3x2(rand, false));
/** 4-1 (세 자리 수)÷(두 자리 수), 몫이 두 자리 수 */
export const l4LongDivTwo = longDivGen("l4-longdiv-two", 2, 2, (rand) => div3x2(rand, true));
