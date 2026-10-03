import { describe, expect, it } from "vitest";
import { units } from "../content";
import type { Generator, Problem } from "../content/types";
import { createRandom } from "../lib/random";

/** 6학년 치명 결함(docs/audit/g6.md) 재발 방지 */
const g6 = units.filter((u) => u.grade === 6);
const all = g6.flatMap((u) => u.standards.flatMap((s) => s.generators));
const gen = (id: string): Generator => {
  const g = all.find((x) => x.id === id);
  if (!g) throw new Error(`${id} 없음`);
  return g;
};
const problems = (id: string, n = 300): Problem[] => Array.from({ length: n }, (_, seed) => gen(id).make(createRandom(seed)));
const standard = (unitId: string, stdId: string) => g6.find((u) => u.id === unitId)!.standards.find((s) => s.id === stdId)!;

/** "2 3/5", "3/5", "4" → 값 */
const value = (t: string) => {
  const m = t.trim().match(/^(?:(\d+) )?(\d+)\/(\d+)$/);
  if (m) return Number(m[1] ?? 0) + Number(m[2]) / Number(m[3]);
  return Number(t);
};

describe("6학년 치명 결함", () => {
  it("e6-frac-div-easy: 보기의 값이 모두 달라 정답이 하나뿐이고, 분자가 나누는 수의 배수가 아니다", () => {
    for (const p of problems("e6-frac-div-easy")) {
      const vals = p.choices!.map(value);
      expect(vals.every(Number.isFinite), p.expression).toBe(true);
      expect(new Set(vals.map((v) => v.toFixed(9))).size, `${p.expression} ${p.choices}`).toBe(4);
      const [n, , k] = p.expression!.match(/\d+/g)!.map(Number);
      expect(n % k, p.expression).not.toBe(0);
      const [, d] = p.expression!.match(/\d+/g)!.map(Number);
      expect(value(p.answer)).toBeCloseTo(n / d / k, 9);
    }
  });

  it("e6-prism-base: 문장에 도형 이름이 없고 겨냥도를 보여 주며, 각기둥만 낸다", () => {
    for (const p of problems("e6-prism-base")) {
      expect(p.prompt).not.toMatch(/[삼사오육칠팔구]각/);
      expect(p.prompt).not.toContain("뿔");
      expect(p.visual?.kind).toBe("shape");
      if (p.visual?.kind === "shape") expect(p.visual.label).not.toMatch(/[삼사오육칠팔구]각/);
      expect(p.answer).not.toContain("뿔");
      expect(p.prompt).not.toContain(p.answer);
    }
  });

  it("e6-prism-base: 겨냥도의 모서리 수가 각기둥(한 밑면의 변 n개 → 모서리 3n개)과 맞다", () => {
    for (const p of problems("e6-prism-base", 100)) {
      if (p.visual?.kind !== "shape") continue;
      const n = p.visual.lines!.length / 3;
      const name = ["", "", "", "삼", "사", "오", "육"][n];
      expect(p.answer.startsWith(name)).toBe(true);
    }
  });

  it("l6-net-faces: 각뿔의 전개도(교육과정 밖)를 묻지 않는다", () => {
    for (const p of problems("l6-net-faces")) expect(p.prompt).not.toContain("뿔");
  });

  it("e6-net-base(원뿔 전개도)는 없고, 원기둥 전개도 차시에서 원뿔을 묻지 않는다", () => {
    expect(all.some((g) => g.id === "e6-net-base")).toBe(false);
    for (const g of standard("g6-s2-round-solids", "net").generators)
      for (let seed = 0; seed < 100; seed++) expect(g.make(createRandom(seed)).prompt, g.id).not.toContain("원뿔");
  });

  it("l6-ddp-pattern: 묻는 식이 위에 보여 준 줄과 같지 않고 답이 문장에 없다", () => {
    for (const p of problems("l6-ddp-pattern")) {
      const asked = p.expression!.replace(" = □", "");
      const shown = p.prompt.split("\n").slice(1).map((l) => l.split(" = ")[0]);
      expect(shown, asked).not.toContain(asked);
      const shownAnswers = p.prompt.split("\n").slice(1).map((l) => l.split(" = ")[1]);
      expect(shownAnswers).not.toContain(p.answer);
    }
  });

  it("l6-ddp-pattern: 나누는 수는 초등 범위인 소수 셋째 자리까지다", () => {
    const places = (x: string) => (x.split(".")[1] ?? "").length;
    for (const p of problems("l6-ddp-pattern")) {
      const lines = [p.expression!, ...p.prompt.split("\n").slice(1)];
      for (const l of lines) {
        const [a, b] = l.split(" = ")[0].split(" ÷ ");
        expect(places(a), l).toBeLessThanOrEqual(3);
        expect(places(b), l).toBeLessThanOrEqual(3);
      }
    }
  });

  it("e6-prism-base: 겨냥도의 세로 모서리끼리 겹치지 않는다", () => {
    for (const p of problems("e6-prism-base", 100)) {
      if (p.visual?.kind !== "shape") continue;
      const xs = p.visual.lines!.filter((l) => l.from[0] === l.to[0]).map((l) => l.from[0]);
      xs.sort((a, b) => a - b);
      for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeGreaterThanOrEqual(8);
    }
  });

  it("l6-area-est-count(정해진 넓이에 □ 개수를 묻는 문제)는 없고, 어림 차시 규칙(유형 5개·하1·중2·상2)을 지킨다", () => {
    expect(all.some((g) => g.id === "l6-area-est-count")).toBe(false);
    const gens = standard("g6-s2-circle-area", "area-estimate").generators;
    expect(gens.length).toBeGreaterThanOrEqual(5);
    expect(gens.filter((g) => g.level === 1).length).toBeGreaterThanOrEqual(1);
    expect(gens.filter((g) => g.level === 2).length).toBeGreaterThanOrEqual(2);
    expect(gens.filter((g) => g.level === 3).length).toBeGreaterThanOrEqual(2);
  });

  it("l6-area-est-bounds: 원 안·원 밖 정사각형의 넓이가 원의 넓이를 사이에 둔다", () => {
    for (const p of problems("l6-area-est-bounds")) {
      const c = Number(p.prompt.match(/원주가 ([\d.]+) cm/)![1]);
      const r = c / 3.14 / 2;
      const [lo, hi] = p.answer.split(",").map(Number);
      expect(lo).toBeLessThan(r * r * 3.14);
      expect(hi).toBeGreaterThan(r * r * 3.14);
    }
  });

  it("l6-cyl-vs-prism: 보기가 모두 같은 틀의 문장이라 형식으로 답을 고를 수 없다", () => {
    for (const p of problems("l6-cyl-vs-prism")) {
      const frame = p.prompt.includes("차이점") ? /^원기둥은 .+, 각기둥은 .+니다$/ : /^원기둥과 각기둥은 모두 .+니다$/;
      for (const c of p.choices!) expect(c, p.prompt).toMatch(frame);
    }
  });

  it("l6-cone-rotate: 문제에 주어진 높이를 묻지 않고, 답이 문제 속 수와 같지 않다", () => {
    for (const p of problems("l6-cone-rotate")) {
      expect(p.prompt).not.toMatch(/원뿔의 높이/);
      expect(p.prompt).not.toContain("높이은");
      const given = p.prompt.match(/\d+(\.\d+)?/g)!.filter((x) => x !== "3.14");
      expect(given, p.prompt).not.toContain(p.answer);
    }
  });

  it("바꾼 차시마다 유형 5개 이상, 하1·중2·상2 이상", () => {
    const touched: [string, string][] = [
      ["g6-s1-frac-div", "frac-whole"],
      ["g6-s1-prisms", "prism"],
      ["g6-s1-prisms", "prism-net"],
      ["g6-s2-dec-div", "diff-places"],
      ["g6-s2-circle-area", "area-estimate"],
      ["g6-s2-round-solids", "cylinder"],
      ["g6-s2-round-solids", "net"],
      ["g6-s2-round-solids", "cone"],
    ];
    for (const [u, s] of touched) {
      const gens = standard(u, s).generators;
      const count = (lv: number) => gens.filter((g) => g.level === lv).length;
      expect(gens.length, `${u}/${s}`).toBeGreaterThanOrEqual(5);
      expect([count(1) >= 1, count(2) >= 2, count(3) >= 2], `${u}/${s}`).toEqual([true, true, true]);
    }
  });
});
