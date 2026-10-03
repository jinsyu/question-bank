import { describe, expect, it } from "vitest";
import { units } from "../content";
import type { Generator, Problem, ShapeScene } from "../content/types";
import { createRandom } from "../lib/random";

/** 2학년 치명 결함(docs/audit/g2.md) 재발 방지 */
const g2Units = units.filter((u) => u.grade === 2);
const g2Gens: Generator[] = [...new Map(g2Units.flatMap((u) => u.standards.flatMap((s) => s.generators)).map((g) => [g.id, g])).values()];
const gen = (id: string) => {
  const g = g2Gens.find((x) => x.id === id);
  if (!g) throw new Error(`${id} 없음`);
  return g;
};
const SEEDS = Array.from({ length: 300 }, (_, i) => i);
const sample = (g: Generator): Problem[] => SEEDS.map((s) => g.make(createRandom(s)));

function inside(v: ShapeScene) {
  const pts: [number, number][] = [
    ...(v.polygons ?? []).flatMap((p) => p.points),
    ...(v.lines ?? []).flatMap((l) => [l.from, l.to]),
    ...(v.dots ?? []),
    ...(v.texts ?? []).map((t) => t.at),
    ...(v.circles ?? []).flatMap((c) => [[c.c[0] - c.r, c.c[1] - c.r], [c.c[0] + c.r, c.c[1] + c.r]] as [number, number][]),
  ];
  return pts.every(([x, y]) => x >= 0 && y >= 0 && x <= v.width && y <= v.height);
}

describe("l2-place-error3·4: 대상 숫자가 한 번만 나온다", () => {
  it.each(["l2-place-error3", "l2-place-error4"])("%s", (id) => {
    for (const p of sample(gen(id))) {
      const m = p.prompt.match(/"(\d+)에서 숫자 (\d)/);
      expect(m, p.prompt).not.toBeNull();
      const [, n, k] = m!;
      expect(n.split("").filter((c) => c === k), p.prompt).toHaveLength(1);
    }
  });
});

/** "84 − □ = 18" 꼴의 식을 참으로 만드는 □ 값들(0~300) */
function boxSolutions(eq: string): number[] {
  const [left, right] = eq.split("=").map((s) => s.trim());
  const evalSide = (side: string, box: number) => {
    const tokens = side.replace(/□/g, String(box)).split(/\s+/);
    let v = Number(tokens[0]);
    for (let i = 1; i < tokens.length; i += 2) v = tokens[i] === "+" ? v + Number(tokens[i + 1]) : v - Number(tokens[i + 1]);
    return v;
  };
  return Array.from({ length: 301 }, (_, b) => b).filter((b) => evalSide(left, b) === evalSide(right, b));
}

describe("l2-box-write: 이야기에 맞는 식은 보기 중 하나뿐이다", () => {
  it("오답 보기는 정답의 □ 값으로 참이 되지 않는다", () => {
    for (const p of sample(gen("l2-box-write"))) {
      const truth = boxSolutions(p.answer);
      expect(truth, p.answer).toHaveLength(1);
      for (const c of p.choices!.filter((c) => c !== p.answer)) {
        expect(boxSolutions(c), `${p.prompt} / ${c}`).not.toContain(truth[0]);
      }
    }
  });
});

describe("l2-criteria-odd: 뜻이 둘인 낱말을 보기에 쓰지 않는다", () => {
  it("'배'가 보기에 없다", () => {
    for (const p of sample(gen("l2-criteria-odd"))) {
      for (const c of p.choices!) expect(c, p.choices!.join(" / ")).not.toMatch(/^배(\(|$)/);
    }
  });
});

describe("l2-bundle-cond: 공배수(5학년) 문항을 뺀다", () => {
  it("2학년에 l2-bundle-cond가 없고, '묶어도 … 묶어도' 문항이 없다", () => {
    expect(g2Gens.map((g) => g.id)).not.toContain("l2-bundle-cond");
    for (const g of g2Gens) for (const p of SEEDS.slice(0, 30).map((s) => g.make(createRandom(s)))) expect(p.prompt, g.id).not.toMatch(/묶어도.*묶어도/);
  });

  it("대체 유형 l2-bundle-diff(상): 그림의 사탕 수와 두 묶음 수의 차가 맞다", () => {
    const g = gen("l2-bundle-diff");
    expect(g.level).toBe(3);
    for (const p of sample(g)) {
      const [, n, a, c] = p.prompt.match(/사탕 (\d+)개.*?(\d+)개씩 묶을 때와 (\d+)개씩 묶을 때/)!.map(Number);
      expect(n % a, p.prompt).toBe(0);
      expect(n % c, p.prompt).toBe(0);
      expect(Number(p.answer)).toBe(Math.abs(n / a - n / c));
      expect(Number(p.answer)).toBeGreaterThan(0);
      const v = p.visual as ShapeScene;
      expect(v.kind).toBe("shape");
      expect(v.circles).toHaveLength(n);
      expect(inside(v), p.prompt).toBe(true);
    }
  });
});

describe("ttCalc 계열: '그림을 보고'에는 그림이 있다", () => {
  it("2학년 모든 문항에서 '그림을 보고'라고 하면 그림이 붙어 있다", () => {
    for (const g of g2Gens) {
      for (const p of SEEDS.slice(0, 60).map((s) => g.make(createRandom(s)))) {
        if (p.prompt.includes("그림을 보고")) expect(p.visual, `${g.id}: ${p.prompt}`).toBeDefined();
      }
    }
  });

  it.each(g2Gens.filter((g) => g.id.startsWith("l2-tt-calc")).map((g) => g.id))("%s: 묶음 그림이 곱셈식과 같다", (id) => {
    let pictured = 0;
    for (const p of sample(gen(id))) {
      if (!p.visual) continue;
      pictured++;
      const [a, b] = p.expression!.match(/(\d+) × (\d+)/)!.slice(1).map(Number);
      const v = p.visual as ShapeScene;
      expect(v.circles).toHaveLength(a * b);
      expect(v.polygons).toHaveLength(b);
      expect(inside(v), p.expression).toBe(true);
    }
    if (id !== "l2-tt-calc7" && id !== "l2-tt-calc9") expect(pictured).toBeGreaterThan(0);
  });
});

describe("w2-exercise-total: (두 자리 수)×(한 자리 수)(3학년)를 뺀다", () => {
  it("2학년에 w2-exercise-total이 없다", () => {
    expect(g2Gens.map((g) => g.id)).not.toContain("w2-exercise-total");
  });

  it("대체 유형 l2-ampm-band(상): 시간 띠의 색칠한 칸 수의 합이 답이다", () => {
    const g = gen("l2-ampm-band");
    expect(g.level).toBe(3);
    for (const p of sample(g)) {
      const v = p.visual as ShapeScene;
      expect(v.kind).toBe("shape");
      expect(inside(v), p.prompt).toBe(true);
      const hours = (v.texts ?? []).filter((t) => /^\d+$/.test(t.text)).sort((x, y) => x.at[0] - y.at[0]);
      const cell = hours[1].at[0] - hours[0].at[0];
      const shaded = (v.polygons ?? []).filter((q) => q.fill).map((q) => (Math.max(...q.points.map((pt) => pt[0])) - Math.min(...q.points.map((pt) => pt[0]))) / cell);
      expect(shaded).toHaveLength(2);
      expect(Number(p.answer)).toBe(shaded[0] + shaded[1]);
      expect(p.explanation).not.toContain("×");
    }
  });
});
