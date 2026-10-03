import type { Problem, Visual } from "../types";

export const sign = (a: number, b: number) => (a > b ? ">" : a < b ? "<" : "=");
export const COMPARE_CHOICES = [">", "<", "="];

const digits = (n: number, len: number) => String(n).padStart(len, "0").split("").map(Number);

/** 받아올림을 잊은 덧셈(각 자리 합의 일의 자리만) */
export function addWithoutCarry(a: number, b: number): number {
  const len = Math.max(String(a).length, String(b).length);
  const da = digits(a, len);
  const db = digits(b, len);
  return Number(da.map((d, i) => (d + db[i]) % 10).join(""));
}

/** 받아내림 대신 큰 수에서 작은 수를 뺀 뺄셈(각 자리 차의 절댓값) */
export function subtractWithoutBorrow(a: number, b: number): number {
  const len = Math.max(String(a).length, String(b).length);
  const da = digits(a, len);
  const db = digits(b, len);
  return Number(da.map((d, i) => Math.abs(d - db[i])).join(""));
}

/** 올림을 잊은 (여러 자리)×(한 자리): 아랫자리는 곱의 일의 자리만 쓰고, 맨 윗자리는 곱을 그대로 쓴다(609×4 → 2406) */
export function multiplyWithoutCarry(a: number, b: number): number {
  const [top, ...rest] = String(a).split("").map(Number);
  return Number(`${top * b}${rest.map((d) => (d * b) % 10).join("")}`);
}

export const hasCarry = (a: number, b: number) => addWithoutCarry(a, b) !== a + b;
export const hasBorrow = (a: number, b: number) => subtractWithoutBorrow(a, b) !== a - b;

/** 숫자(또는 여러 칸) 답 문제를 짧게 만든다 */
export function numberProblem(p: {
  typeId: string;
  key: string;
  prompt: string;
  expression?: string;
  visual?: Visual;
  answer: number | string;
  fields?: string[];
  hint: string;
  explanation: string;
  mistakes?: Record<string, string>;
}): Problem {
  const { answer, fields, mistakes = {}, ...rest } = p;
  const answerText = String(answer);
  // 정답과 같은 '실수'는 뺀다
  const cleaned = Object.fromEntries(Object.entries(mistakes).filter(([k]) => k !== answerText));
  return {
    ...rest,
    input: fields ? "fields" : "number",
    fields,
    answer: answerText,
    mistakes: cleaned,
  };
}
