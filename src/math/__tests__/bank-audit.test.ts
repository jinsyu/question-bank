import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { units } from "../content";
import type { Generator, Problem } from "../content/types";
import { createRandom } from "../lib/random";
import { MathText } from "../components/math-text";
import { josa } from "../content/josa";
import { sample, visibleText, wrongJosa } from "./quality-checks";

/** 문제 은행 성취수준 검수(2026-10-01)가 math-king 원본에 넘긴 결함 재발 방지 */
const entries = units.flatMap((u) => u.standards.flatMap((s) => s.generators.map((g) => ({ u, s, g }))));
const gen = (id: string): Generator => {
  const e = entries.find((x) => x.g.id === id);
  if (!e) throw new Error(`${id} 없음`);
  return e.g;
};
const problems = (id: string, n = 300): Problem[] => Array.from({ length: n }, (_, seed) => gen(id).make(createRandom(seed)));

describe("문제 은행 검수에서 넘어온 결함", () => {
  it("다각형 이름을 숫자로 쓰지 않는다(7각형 → 칠각형)", () => {
    const bad = new Set<string>();
    for (const { g } of entries) for (const p of Array.from({ length: 30 }, (_, s) => g.make(createRandom(s)))) if (/(?<![\d.])\d+각형/.test(visibleText(p))) bad.add(g.id);
    expect([...bad]).toEqual([]);
  }, 30_000); // 전 학년 생성기를 모두 돌려 기본 5초를 넘는다

  it("풀이에 같은 값을 '= '로 되풀이하지 않는다(5/12 = 5/12, 1 t = 1000 kg이므로 1 t = 1000 kg)", () => {
    for (const id of ["frac-times-whole", "m5-three-terms", "l5-fm-three", "l5-rel-cond", "wt-ton"])
      for (const p of problems(id)) {
        expect(p.explanation, id).not.toMatch(/(?:^|[,:→(]\s*|이므로 )(\d+(?:\/\d+)?) = \1(?![\d./])/);
        expect(p.explanation, id).not.toMatch(/(.+)이므로 \1$/);
      }
  });

  it("quad-name: 이름 뒤 조사를 받침에 맞춘다(마름모라고)", () => {
    for (const p of problems("quad-name")) expect(p.explanation).not.toContain("모이라고");
  });

  it("l4-rotate-more: 4학년 풀이에 5학년 용어 '배수'를 쓰지 않는다", () => {
    for (const p of problems("l4-rotate-more")) expect(visibleText(p)).not.toContain("배수");
  });

  it("w3-pocket-money: 물건값과 가진 돈이 10원 단위다", () => {
    for (const p of problems("w3-pocket-money")) for (const n of p.prompt.match(/\d+(?=원)/g)!) expect(Number(n) % 10, p.prompt).toBe(0);
  });

  it("dec-div-round·w6-fuel: 나누어떨어지는 나눗셈을 반올림하라고 하지 않는다", () => {
    for (const p of problems("dec-div-round")) {
      const [a, b] = p.prompt.match(/\d+/g)!.map(Number);
      expect(a % b, p.prompt).not.toBe(0);
    }
    for (const p of problems("w6-fuel")) {
      const [l, km] = p.prompt.match(/\d+(?:\.\d+)?/g)!.map(Number);
      expect((km * 100) % Math.round(l * 10), p.prompt).not.toBe(0);
      expect(km / l, p.prompt).toBeGreaterThanOrEqual(7.95);
      expect(km / l, p.prompt).toBeLessThan(20.05);
    }
  });

  it("w6-flour-bread: 생활 속 양을 가분수로 쓰지 않는다(분수 ÷ 분수 차시라 진분수만)", () => {
    const seen = new Set<string>();
    for (const p of problems("w6-flour-bread")) {
      const [n, d] = p.prompt.match(/밀가루 (\d+)\/(\d+) kg/)!.slice(1).map(Number);
      expect(n, p.prompt).toBeLessThan(d);
      seen.add(p.prompt);
    }
    expect(seen.size).toBeGreaterThanOrEqual(10);
  });

  it("josa: 분수·대분수는 분자를 읽는 소리로 조사를 고른다(3/8 → 팔분의 삼 → 3/8은)", () => {
    expect(josa("3/8", "은/는")).toBe("3/8은");
    expect(josa("1/4", "이/가")).toBe("1/4이");
    expect(josa("2/5", "을/를")).toBe("2/5를");
    expect(josa("1 2/7", "으로/로")).toBe("1 2/7로");
    expect(josa("1 6/7", "으로/로")).toBe("1 6/7으로");
    expect(josa("10/10", "으로/로")).toBe("10/10으로");
  });

  it("전 학년 모든 생성기: 수·분수·단위·기호 뒤 조사가 받침에 맞다(힌트·풀이 포함)", () => {
    const bad: string[] = [];
    for (const { u, g } of entries) {
      const found = sample(g, 100).flatMap(wrongJosa);
      if (found.length) bad.push(`${u.grade}-${u.semester} ${g.id}: ${[...new Set(found)].slice(0, 3).join(", ")}`);
    }
    expect(bad).toEqual([]);
  }, 120_000);

  it("1~4학년: 혼합 계산(5-1) 식을 쓰지 않고, 3-1에는 (두 자리) × (두 자리)가 없다", () => {
    const MIXED = /\d[\d,./]*°? [+−] \d[\d,./]*°? [×÷] \d|\d[\d,./]*°? [×÷] \d[\d,./]*°? [+−] \d|\([^)]*[+−×÷][^)]*\) [+−×÷]|[+−×÷] \([^)]*[+−×÷]|\(나누는 수\) × \(몫\) \+/;
    const bad = new Set<string>();
    for (const { u, g } of entries.filter((e) => e.u.grade <= 4))
      for (const p of sample(g, 100)) {
        const text = [visibleText(p), ...Object.values(p.mistakes ?? {})].join(" \n ");
        if (MIXED.test(text)) bad.add(`${g.id}: ${text.match(MIXED)![0]}`);
        if (u.grade === 3 && u.semester === 1 && /(?<![\d.])[1-9]\d × [1-9]\d(?![\d.])/.test(text)) bad.add(`${g.id}: 두 자리 × 두 자리`);
      }
    expect([...bad]).toEqual([]);
    for (const u of units.filter((x) => x.grade <= 4)) for (const s of u.standards) for (const c of s.conceptCards ?? []) expect(`${c.body} ${c.example ?? ""}`, s.id).not.toMatch(MIXED);
  }, 120_000);

  it("MathText: 글 속 줄바꿈을 줄바꿈으로 보여 준다(l6-ddp-pattern 등 여러 줄 문제)", () => {
    const html = renderToStaticMarkup(createElement(MathText, { text: "규칙을 찾으세요.\n0.8 ÷ 4 = 0.2\n1/2 ÷ 4" }));
    expect(html.match(/<br\/>/g)).toHaveLength(2);
    const p = problems("l6-ddp-pattern", 1)[0];
    expect(renderToStaticMarkup(createElement(MathText, { text: p.prompt })).match(/<br\/>/g)).toHaveLength(3);
  });
});
