import { describe, expect, it } from "vitest";
import { longDivide, longDivVisual } from "../content/generators/long-division";
import { stepText } from "../content/lessons/longdiv";

/** 교과서 나눗셈 세로셈의 줄(몫, 그 아래 줄들: [값, 마지막 숫자 자리]) */
const rows = (a: number, b: number) => longDivide(a, b).entries.map((e) => [e.role, e.value, e.end]);

describe("나눗셈 세로셈 계산 과정", () => {
  it("72 ÷ 3: 몫 24, 6 / 12 / 12 / 0", () => {
    expect(rows(72, 3)).toEqual([
      ["quotient", 24, 1],
      ["product", 6, 0],
      ["carry", 12, 1],
      ["product", 12, 1],
      ["remainder", 0, 1],
    ]);
  });

  it("84 ÷ 4: 뺀 결과가 0이면 내려 쓴 숫자만 쓴다(8 / 4 / 4 / 0)", () => {
    expect(rows(84, 4).map((r) => r[1])).toEqual([21, 8, 4, 4, 0]);
  });

  it("156 ÷ 4: 백의 자리가 나누는 수보다 작으면 앞 두 자리부터 나눈다(몫 39)", () => {
    expect(rows(156, 4)).toEqual([
      ["quotient", 39, 2],
      ["product", 12, 1],
      ["carry", 36, 2],
      ["product", 36, 2],
      ["remainder", 0, 2],
    ]);
  });

  it("612 ÷ 3: 몫의 가운데가 0이면 그 자리 곱은 쓰지 않고 두 자리를 함께 내려 쓴다", () => {
    expect(rows(612, 3).map((r) => r[1])).toEqual([204, 6, 12, 12, 0]);
  });

  it("92 ÷ 3: 몫의 일의 자리가 0이면 내려 쓴 수가 나머지(9 / 2)", () => {
    expect(rows(92, 3)).toEqual([
      ["quotient", 30, 1],
      ["product", 9, 0],
      ["remainder", 2, 1],
    ]);
  });

  it("245 ÷ 32 = 7 … 21, 745 ÷ 23 = 32 … 9", () => {
    expect(rows(245, 32).map((r) => r[1])).toEqual([7, 224, 21]);
    expect(rows(745, 23).map((r) => r[1])).toEqual([32, 69, 55, 46, 9]);
  });

  it("그림: 빈칸은 자리 수만큼 넓고, 곱한 수 줄 아래에만 뺄셈 선", () => {
    const v = longDivVisual(longDivide(72, 3), { 2: "㉠" });
    expect(v.quotient).toBe("24");
    expect(v.rows).toEqual([
      { num: "6", end: 0, rule: true },
      { num: { blank: "㉠", width: 2 }, end: 1 },
      { num: "12", end: 1, rule: true },
      { num: "0", end: 1 },
    ]);
  });

  it("풀이 문구: 몫의 끝 두 자리가 0인 나머지(502 ÷ 5)는 몫 가운데 0(612 ÷ 3)과 같은 말로 두 자리를 함께 내려 쓴다", () => {
    const carry = stepText(longDivide(612, 3), 2);
    const rest = stepText(longDivide(502, 5), 2);
    expect(carry).toBe("6 − 6 = 0, 다음 자리 숫자를 내려 쓴 수가 3보다 작아 몫의 십의 자리에 0을 쓰고 두 자리 숫자를 함께 내려 쓰면 12");
    expect(rest).toBe("5 − 5 = 0, 다음 자리 숫자를 내려 쓴 수가 5보다 작아 몫의 십의 자리와 일의 자리에 0을 쓰고 두 자리 숫자를 함께 내려 쓰면 2, 나머지는 2");
    expect(stepText(longDivide(92, 3), 2)).toBe("9 − 9 = 0, 다음 자리 숫자를 내려 쓴 2는 3보다 작아 몫의 일의 자리에 0을 쓰고 나머지는 2");
  });
});
