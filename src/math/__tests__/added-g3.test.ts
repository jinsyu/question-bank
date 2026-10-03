import { describe, expect, it } from "vitest";
import { units } from "../content";
import { ADDED_G3_LIST, addedG3 } from "../content/added/g3";
import { createRandom } from "../lib/random";
import type { Problem } from "../content/types";

/** key("id:a:b:…")에서 숫자를 꺼내 정답을 따로 계산한다 */
const nums = (p: Problem) => p.key.split(":").slice(1).flatMap((s) => s.split("/")).map(Number);
const SOLVE: Record<string, (n: number[], p: Problem) => string> = {
  "a3-as-place-add": ([h, t, o, d]) => String(h * 100 + t * 10 + o + d),
  "a3-as-unknown-add": ([b, c]) => String(c - b),
  "a3-as-wrong-sub": ([b, c]) => String(c - 2 * b),
  "a3-pf-line-name": ([i]) => ["선분", "반직선", "직선"][i],
  "a3-pf-angle-count": ([a, b]) => String(3 * a + 4 * b),
  "a3-pf-rect-join": ([a, b]) => String(2 * (a + 2 * b)),
  "a3-div-cut-string": ([, q]) => String(q),
  "a3-div-two-quotients": ([, q1, , q2]) => String(q1 + q2),
  "a3-div-two-kinds": ([a, b, n]) => String((a + b) / n),
  "a3-mul-tens-repeat": ([a, b]) => String(a * 10 * b),
  "a3-mul-largest-digit": ([a, c]) => String(Math.max(...[1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => a * d < c))),
  "a3-mul-two-groups": ([a, b, c, d]) => String(a * b + c * d),
  "a3-time-clock-after": ([h, m, x]) => { const t = h * 60 + m + x; return `${Math.floor(t / 60)},${t % 60}`; },
  "a3-time-clock-start": ([h, m, k]) => { const t = h * 60 + m - 60 - k; return `${Math.floor(t / 60)},${t % 60}`; },
  "a3-len-route-diff": ([ab, bc, d]) => String(ab + bc - d),
  "a3-dec-ones-tenths": ([a, b]) => String(a + b / 10),
  "a3-frac-unit-between": ([s, b]) => String([...Array(20).keys()].filter((d) => d > s && d < b).length),
  "a3-dec-cm-mm-diff": ([a, b, c]) => String(Math.abs(Math.round((a + b / 10) * 10) - c)),
  "a3-mul-3x1-repeat": ([a, n]) => String(a * n),
  "a3-mul-tens-box": ([a]) => String(a * 10),
  "a3-mul-wrong-add": ([b, x]) => String(x * b),
  "a3-div-box-dividend": ([b, q]) => String(b * q),
  "a3-div-min-groups": ([n, b]) => String(Math.ceil(n / b)),
  "a3-div-check-redivide": ([b, q, r, c]) => { const x = b * q + r; return `${Math.floor(x / c)},${x % c}`; },
  "a3-cir-compass-diameter": ([r]) => String(2 * r),
  "a3-cir-row-length": ([r, n]) => String(2 * r * n),
  "a3-cir-box-perimeter": ([r, n]) => String(2 * (2 * r * n + 2 * r)),
  "a3-frac-of-hour": ([n, d]) => String((60 * n) / d),
  "a3-frac-proper-count": ([n, d]) => String(d - 1 - n),
  "a3-frac-improper-between": ([a, b, d, n]) => String(n - (a * d + b) - 1),
  "a3-vol-cup-diff": ([a, b]) => String(Math.abs(a - b)),
  "a3-vol-left-ml": ([a, b, c]) => String(a * 1000 + b - c),
  "a3-wt-bag-swap": ([bag, , note]) => String(bag + note),
  "a3-data-table-total": (n) => String(n.reduce((s, v) => s + v, 0)),
  "a3-data-collect-rest": ([n, a, b, c]) => String(n - a - b - c),
  "a3-data-picto-diff": ([a, b, c, d]) => String(Math.abs(a * 10 + b - c * 10 - d)),
};

describe("3학년 추가 생성기(a3-)", () => {
  it("3학년 모든 단원에 하·중·상이 하나씩 있고 실제 차시에 연결된다", () => {
    const g3 = units.filter((u) => u.grade === 3);
    expect(Object.keys(addedG3).sort()).toEqual(g3.map((u) => u.id).sort());
    for (const u of g3) {
      const gens = Object.values(addedG3[u.id]).flat();
      expect(gens.map((g) => g.level).sort()).toEqual([1, 2, 3]);
      for (const [std, list] of Object.entries(addedG3[u.id])) {
        const s = u.standards.find((x) => x.id === std);
        expect(s, `${u.id}/${std}`).toBeDefined();
        for (const g of list) expect(s!.generators).toContain(g);
      }
    }
  });

  it("생성기 id가 a3-로 시작하고 전역에서 유일하다", () => {
    const all = units.flatMap((u) => u.standards.flatMap((s) => s.generators.map((g) => g.id)));
    for (const g of ADDED_G3_LIST) {
      expect(g.id.startsWith("a3-")).toBe(true);
      expect(all.filter((id) => id === g.id)).toHaveLength(1);
    }
  });

  it.each(ADDED_G3_LIST.map((g) => [g.id, g] as const))("%s: 정답을 따로 계산해도 같고, 보기·수 범위가 맞다", (id, gen) => {
    const keys = new Set<string>();
    for (let seed = 0; seed < 300; seed++) {
      const p = gen.make(createRandom(seed));
      keys.add(p.key);
      expect(p.answer, `seed ${seed}: ${p.prompt}`).toBe(SOLVE[id](nums(p), p));
      if (p.choices) {
        expect(p.choices.filter((c) => c === p.answer)).toHaveLength(1);
        expect(new Set(p.choices).size).toBe(p.choices.length);
      }
      // 3학년: 정답 수는 0보다 크고 10000 미만, 문제 속 수도 10000 미만
      for (const a of p.answer.split(",")) if (/^\d/.test(a)) expect(Number(a)).toBeLessThan(10000);
      if (p.input === "number") expect(Number(p.answer)).toBeGreaterThan(0);
      for (const m of p.prompt.match(/\d+/g) ?? []) expect(Number(m)).toBeLessThan(10000);
      expect(p.prompt).not.toMatch(/undefined|NaN/);
    }
    expect(keys.size).toBeGreaterThanOrEqual(3);
  });
});
