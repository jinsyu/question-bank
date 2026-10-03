import { describe, expect, it } from "vitest";
import { units } from "../content";
import { multiplyWithoutCarry } from "../content/generators/common";
import type { Generator } from "../content/types";
import { createRandom } from "../lib/random";

/** 3학년 치명 결함(docs/plan-critical.md T3)이 다시 생기지 않는지 */
const SEEDS = 1000;

function gen(id: string): Generator {
  const g = units.flatMap((u) => u.standards.flatMap((s) => s.generators)).find((x) => x.id === id);
  if (!g) throw new Error(`생성기 없음: ${id}`);
  return g;
}

const problems = (id: string) => Array.from({ length: SEEDS }, (_, seed) => ({ seed, p: gen(id).make(createRandom(seed)) }));

/** 세로셈에서 올림만 빠뜨린 값: 아랫자리는 곱의 일의 자리만, 맨 윗자리는 곱을 그대로 쓴다 */
function forgotCarry(a: number, b: number) {
  const ds = String(a).split("").map(Number);
  const top = ds[0] * b;
  const rest = ds.slice(1).map((d) => (d * b) % 10);
  return Number(`${top}${rest.join("")}`);
}

describe("multiplyWithoutCarry", () => {
  it("맨 윗자리 곱을 자르지 않는다", () => {
    expect(multiplyWithoutCarry(609, 4)).toBe(2406);
    expect(multiplyWithoutCarry(805, 5)).toBe(4005);
    expect(multiplyWithoutCarry(443, 8)).toBe(3224);
    expect(multiplyWithoutCarry(27, 4)).toBe(88);
  });

  it("올림이 없으면 바른 곱과 같다", () => {
    expect(multiplyWithoutCarry(213, 3)).toBe(639);
    expect(multiplyWithoutCarry(32, 4)).toBe(128);
  });

  it("무작위 수에서도 세로셈 올림 누락 값과 같다", () => {
    const rand = createRandom(1);
    for (let i = 0; i < 500; i++) {
      const a = 10 + Math.floor(rand() * 990);
      const b = 2 + Math.floor(rand() * 8);
      expect(multiplyWithoutCarry(a, b), `${a}×${b}`).toBe(forgotCarry(a, b));
    }
  });
});

describe("l3-div-t-cards: 가장 큰 수의 몫이 정답", () => {
  it("만들 수 있는 두 자리 수 중 b단 곱셈구구의 곱인 가장 큰 수의 몫을 답으로 하고, 몫은 곱셈구구 범위다('나누어떨어진다'는 3-2 용어라 쓰지 않는다)", () => {
    for (const { seed, p } of problems("l3-div-t-cards")) {
      expect(`${p.prompt} ${p.hint} ${p.explanation}`).not.toMatch(/나누어떨어/);
      const cards = p.prompt.match(/수 카드 ([\d, ]+) 중에서/)![1].split(", ").map(Number);
      const b = Number(p.prompt.match(/(\d)단 곱셈구구의 곱이 되는/)![1]);
      const nums = cards.flatMap((x) => cards.filter((y) => y !== x).map((y) => x * 10 + y)).filter((n) => n >= 10 && n % b === 0 && n / b <= 9);
      const best = Math.max(...nums);
      expect(p.answer, `seed ${seed}: ${p.prompt}`).toBe(String(best / b));
      expect(best / b).toBeLessThanOrEqual(9);
    }
  });
});

describe("단위 order: 측정값이 모두 양수이고 표기가 자연스럽다", () => {
  const cases = [
    { id: "l3-km-order", big: "km", small: "m", max: 9990 },
    { id: "l3-vol-order", big: "L", small: "mL", max: 9990 },
    { id: "l3-wt-order", big: "kg", small: "g", max: 5990 },
  ];
  it.each(cases)("$id", ({ id, big, small, max }) => {
    for (const { seed, p } of problems(id)) {
      const where = `seed ${seed}: ${p.prompt}`;
      expect(p.prompt, where).not.toMatch(/-\d/);
      expect(p.prompt, where).not.toMatch(new RegExp(`(^|\\D)0 ${big}`));
      const vals = [...p.explanation.matchAll(new RegExp(`(\\S+) (-?\\d+) ${small}`, "g"))].map((m) => ({ name: m[1], v: Number(m[2]) }));
      expect(vals, where).toHaveLength(4);
      for (const { v } of vals) {
        expect(v, where).toBeGreaterThan(0);
        expect(v, where).toBeLessThanOrEqual(max);
      }
      const most = /가장 (먼|많이|무거운)/.test(p.prompt);
      const target = (most ? Math.max : Math.min)(...vals.map((x) => x.v));
      expect(p.answer, where).toBe(vals.find((x) => x.v === target)!.name);
    }
  });
});

describe("l3-mul3-c-fix·error: 친구의 값이 올림을 빠뜨린 세로셈 값", () => {
  const parse = (expr: string) => expr.match(/^(\d+) × (\d+) = (\d+)$/)!.slice(1).map(Number);

  it("fix: 제시한 값은 올림 누락 값이고 정답은 바른 곱", () => {
    for (const { seed, p } of problems("l3-mul3-c-fix")) {
      const [a, b, w] = parse(p.expression!);
      expect(w, `seed ${seed}: ${p.expression}`).toBe(forgotCarry(a, b));
      expect(p.answer).toBe(String(a * b));
    }
  });

  it("error: 까닭이 '올림한 수를 더하지 않았습니다'이면 제시한 값이 그 까닭대로 계산한 값", () => {
    let seen = 0;
    for (const { seed, p } of problems("l3-mul3-c-error")) {
      const [a, b, w] = parse(p.expression!);
      if (p.answer !== "올림한 수를 더하지 않았습니다.") continue;
      seen++;
      expect(w, `seed ${seed}: ${p.expression}`).toBe(forgotCarry(a, b));
    }
    expect(seen).toBeGreaterThan(0);
  });
});
