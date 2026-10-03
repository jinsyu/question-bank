import type { LongDivision, LongDivNum } from "../types";

/**
 * 나눗셈 세로셈(교과서식) 계산 과정과 그림 데이터.
 * 몫의 숫자가 0인 자리는 곱·뺄셈 줄을 쓰지 않고 다음 자리를 함께 내려 쓴다(612 ÷ 3: 6, 12, 12, 0).
 */

/** 세로셈의 수 한 칸: 몫, 곱한 수, 내려 쓴 수(뺀 결과와 다음 자리), 나머지 */
export type LongDivEntry = {
  role: "quotient" | "product" | "carry" | "remainder";
  value: number;
  /** 마지막 숫자가 놓이는 나누어지는 수의 자리(왼쪽부터 0) */
  end: number;
  /** product: 이 줄을 만든 몫의 숫자 */
  digit?: number;
  /** product: 빼기 전의 수(바로 위 줄 또는 나누어지는 수의 앞자리) */
  top?: number;
  /** carry: 뺀 결과(내려 쓴 숫자를 붙이기 전) */
  diff?: number;
};

export type LongDivLayout = { a: number; b: number; q: number; r: number; entries: LongDivEntry[] };

/** a ÷ b 세로셈의 몫과 줄들(entries[0]은 몫, 나머지는 위에서 아래 순서) */
export function longDivide(a: number, b: number): LongDivLayout {
  const digits = String(a).split("").map(Number);
  const last = digits.length - 1;
  const steps: { i: number; cur: number; digit: number; prevRest: number }[] = [];
  let cur = 0;
  let rest = 0;
  digits.forEach((d, i) => {
    cur = cur * 10 + d;
    const digit = Math.floor(cur / b);
    if (digit > 0) {
      steps.push({ i, cur, digit, prevRest: rest });
      cur -= digit * b;
      rest = cur;
    }
  });
  const q = Math.floor(a / b);
  const entries: LongDivEntry[] = [{ role: "quotient", value: q, end: last }];
  steps.forEach((s, k) => {
    if (k > 0) entries.push({ role: "carry", value: s.cur, end: s.i, diff: s.prevRest });
    entries.push({ role: "product", value: s.digit * b, end: s.i, digit: s.digit, top: s.cur });
  });
  entries.push({ role: "remainder", value: a % b, end: last });
  return { a, b, q, r: a % b, entries };
}

/** 세로셈 그림. blanks: entries 번호 → 빈칸 이름("□"·"㉠" 등) */
export function longDivVisual(layout: LongDivLayout, blanks: Record<number, string> = {}): LongDivision {
  const num = (i: number): LongDivNum => {
    const v = String(layout.entries[i].value);
    return blanks[i] ? { blank: blanks[i], width: v.length } : v;
  };
  return {
    kind: "longdiv",
    divisor: String(layout.b),
    dividend: String(layout.a),
    quotient: num(0),
    rows: layout.entries.slice(1).map((e, k) => ({ num: num(k + 1), end: e.end, ...(e.role === "product" ? { rule: true } : {}) })),
  };
}
