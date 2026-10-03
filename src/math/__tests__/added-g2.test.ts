import { describe, expect, it } from "vitest";
import { addedG2 } from "../content/added/g2";
import { units } from "../content";
import type { Generator, Problem } from "../content/types";
import { createRandom } from "../lib/random";

/** 2026-10-04 2학년 단원마다 더한 생성기(하·중·상 하나씩): 정답을 문제 글에서 다시 계산해 맞춘다 */

const all: { unit: string; std: string; g: Generator }[] = Object.entries(addedG2).flatMap(([unit, stds]) => Object.entries(stds).flatMap(([std, gs]) => gs.map((g) => ({ unit, std, g }))));
const gen = (id: string) => all.find((x) => x.g.id === id)!.g;
const sample = (id: string, n = 300): Problem[] => Array.from({ length: n }, (_, s) => gen(id).make(createRandom(s)));
const nums = (t: string) => (t.match(/\d+/g) ?? []).map(Number);

describe("배치", () => {
  it("2학년 모든 단원에 하·중·상이 하나씩 있고, id는 a2- 접두어로 전역 유일하다", () => {
    const g2 = units.filter((u) => u.grade === 2);
    for (const u of g2) {
      const mine = all.filter((x) => x.unit === u.id);
      expect(mine.map((x) => x.g.level).sort(), u.id).toEqual([1, 2, 3]);
      for (const x of mine) {
        const s = u.standards.find((st) => st.id === x.std);
        expect(s, `${u.id}/${x.std}`).toBeDefined();
        expect(s!.generators.map((g) => g.id)).toContain(x.g.id);
      }
    }
    const ids = units.flatMap((u) => u.standards.flatMap((s) => s.generators.map((g) => g.id)));
    for (const x of all) {
      expect(x.g.id).toMatch(/^a2-/);
      expect(new Set(units.flatMap((u) => u.standards.filter((s) => s.generators.some((g) => g.id === x.g.id)).map((s) => s.id))).size, x.g.id).toBe(1);
    }
    expect(all.length).toBe(36);
    expect(ids.length).toBeGreaterThan(0);
  });

  it("보기가 있으면 정답이 정확히 한 번, 보기끼리 겹치지 않는다. 학기 범위의 수", () => {
    for (const x of all) {
      const max = x.unit.startsWith("g2-s1") ? 999 : 9999;
      for (let s = 0; s < 200; s++) {
        const p = x.g.make(createRandom(s));
        if (p.choices) {
          expect(p.choices.filter((c) => c === p.answer).length, x.g.id).toBe(1);
          expect(new Set(p.choices).size, x.g.id).toBe(p.choices.length);
        }
        expect(nums(`${p.prompt} ${p.answer} ${p.explanation}`).every((n) => n <= max), `${x.g.id}: ${p.prompt}`).toBe(true);
        expect(p.answer).not.toMatch(/^0$|,0$/);
      }
    }
  });
});

describe("정답 재계산", () => {
  it("뛰어 세기", () => {
    for (const [id, step] of [["a2-skip-back100", 100], ["a2-skip-back1000", 1000]] as const)
      for (const p of sample(id)) {
        const [x, , n] = nums(p.prompt);
        expect(Number(p.answer)).toBe(x - step * n);
      }
  });
  it("동전 묶기", () => {
    for (const p of sample("a2-coins-regroup3")) {
      const [, a, , b] = nums(p.prompt);
      expect(Number(p.answer)).toBe(100 * a + 10 * b);
    }
    for (const p of sample("a2-coins-regroup4")) {
      const [, a, , b, , c] = nums(p.prompt);
      expect(Number(p.answer)).toBe(1000 * a + 100 * b + 10 * c);
    }
  });
  it("조건에 맞는 수 세기", () => {
    for (const p of sample("a2-cond-count3")) {
      const [a, b, x] = nums(p.prompt);
      expect(Number(p.answer)).toBe(Array.from({ length: 10 }, (_, d) => 100 * a + 10 * d + b).filter((n) => n > x).length);
    }
    for (const p of sample("a2-cond-count4")) {
      const [a, b, c, x] = nums(p.prompt);
      expect(Number(p.answer)).toBe(Array.from({ length: 10 }, (_, d) => 1000 * a + 100 * b + 10 * d + c).filter((n) => n < x).length);
    }
  });
  it("도형: 그림의 도형 수와 이름", () => {
    for (const p of sample("a2-straight-count")) {
      const v = p.visual!;
      if (v.kind !== "shape") throw new Error();
      expect(Number(p.answer)).toBe((v.polygons ?? []).filter((pg) => pg.points.length <= 6).length);
    }
    for (const p of sample("a2-hex-more-pent")) {
      const v = p.visual!;
      if (v.kind !== "shape") throw new Error();
      const sides = (v.polygons ?? []).map((pg) => pg.points.length);
      expect(Number(p.answer)).toBe(sides.filter((n) => n === 6).length - sides.filter((n) => n === 5).length);
      expect(Number(p.answer)).toBeGreaterThan(0);
    }
    const N: Record<string, number> = { 삼각형: 3, 사각형: 4, 오각형: 5, 육각형: 6 };
    for (const p of sample("a2-poly-by-clue")) {
      const m = p.prompt.match(/꼭짓점이 (\S+)보다 (\d)개/)!;
      expect(N[p.answer]).toBe(N[m[1]] + Number(m[2]));
    }
  });
  it("덧셈과 뺄셈", () => {
    for (const p of sample("a2-add-max-min")) {
      const n = nums(p.prompt.split("중에서")[0]);
      expect(Number(p.answer)).toBe(Math.max(...n) + Math.min(...n));
      expect((Math.max(...n) % 10) + (Math.min(...n) % 10)).toBeGreaterThanOrEqual(10);
    }
    for (const p of sample("a2-sub-biggest")) {
      const val = (e: string) => { const [a, b] = nums(e); return a - b; };
      const best = Math.max(...p.choices!.map(val));
      expect(val(p.answer)).toBe(best);
      expect(p.choices!.filter((c) => val(c) === best).length).toBe(1);
      for (const c of p.choices!) { const [a, b] = nums(c); expect(a % 10).toBeLessThan(b % 10); }
    }
    for (const p of sample("a2-three-best")) {
      const n = nums(p.prompt.split("중에서")[0]);
      const best = Math.max(n[0] + n[1] - n[2], n[0] + n[2] - n[1], n[1] + n[2] - n[0]);
      expect(Number(p.answer)).toBe(best);
    }
  });
  it("길이(cm)", () => {
    for (const p of sample("a2-ruler-diff0")) {
      const [a, b] = nums(p.explanation);
      expect(Number(p.answer)).toBe(Math.abs(a - b));
    }
    for (const p of sample("a2-ruler-double")) {
      const v = p.visual!;
      if (v.kind !== "shape") throw new Error();
      const bar = v.polygons![0].points;
      const len = Math.round((bar[1][0] - bar[0][0]) / 26);
      expect(Number(p.answer)).toBe(2 * len);
    }
    for (const p of sample("a2-broken-ruler")) {
      const [s, e, more] = nums(p.prompt);
      expect(Number(p.answer)).toBe(e - s + more);
    }
  });
  it("분류", () => {
    for (const p of sample("a2-sort-rest")) {
      const [total, red, blue] = nums(p.prompt);
      expect(Number(p.answer)).toBe(total - red - blue - blue);
      expect(Number(p.answer)).toBeGreaterThan(0);
    }
    for (const id of ["a2-cards-one", "a2-cards-two"]) for (const p of sample(id)) expect(Number(p.answer)).toBe(p.explanation.split("번")[0].split(", ").length);
  });
  it("곱셈·곱셈구구", () => {
    for (const p of sample("a2-mul-by-add")) { const [a, b] = nums(p.prompt); expect(Number(p.answer)).toBe(a * b); }
    for (const p of sample("a2-times-of-which")) { const [a, b] = nums(p.prompt); expect(Number(p.answer) * b).toBe(a); }
    for (const p of sample("a2-bags-plus")) { const [a, b, c] = nums(p.prompt); expect(Number(p.answer)).toBe(a * b + c); }
    for (const p of sample("a2-same-product")) {
      const prod = (e: string) => { const [a, b] = nums(e); return a * b; };
      const target = prod(p.prompt);
      expect(p.choices!.filter((c) => prod(c) === target)).toEqual([p.answer]);
    }
    for (const p of sample("a2-tt-between")) {
      const [k, , , , , lo, hi] = nums(p.prompt);
      expect(Number(p.answer)).toBe(Array.from({ length: 9 }, (_, i) => k * (i + 1)).filter((x) => x > lo && x < hi).length);
    }
    for (const p of sample("a2-flowers-two")) { const [a, b, c, d] = nums(p.prompt); expect(Number(p.answer)).toBe(a * b + c * d); }
  });
  it("길이(m)", () => {
    const cm = (ans: string) => { const [m, c] = ans.split(",").map(Number); return 100 * m + c; };
    for (const p of sample("a2-tape-nonzero")) { const [s, e] = nums(p.prompt); expect(cm(p.answer)).toBe(e - s); }
    for (const p of sample("a2-m-diff-bars")) {
      const v = p.visual!;
      if (v.kind !== "shape") throw new Error();
      const ls = v.texts!.filter((t) => /m/.test(t.text)).map((t) => { const n = nums(t.text); return n.length === 2 ? 100 * n[0] + n[1] : 100 * n[0]; });
      expect(cm(p.answer)).toBe(ls[0] - ls[1]);
    }
    for (const p of sample("a2-m-three-sum")) {
      const v = p.visual!;
      if (v.kind !== "shape") throw new Error();
      const ls = v.texts!.filter((t) => /m/.test(t.text)).map((t) => { const n = nums(t.text); return n.length === 2 ? 100 * n[0] + n[1] : 100 * n[0]; });
      expect(ls.length).toBe(3);
      expect(cm(p.answer)).toBe(ls.reduce((a, b) => a + b, 0));
    }
  });
  it("시각과 시간", () => {
    for (const p of sample("a2-clock-hand-num")) { const [, m] = nums(p.prompt); expect(Number(p.answer) * 5).toBe(m); }
    for (const p of sample("a2-arrive-time")) {
      const n = nums(p.prompt);
      const [h, m, dh, dm] = n.length === 4 ? n : [n[0], 0, n[1], n[2]];
      const t = (h + dh) * 60 + m + dm;
      expect(p.answer).toBe(`${Math.floor(t / 60)},${t % 60}`);
    }
    for (const p of sample("a2-turn-ticks")) {
      const [h, m, k] = nums(p.prompt);
      const t = h * 60 + m + 60 + k;
      expect(p.answer).toBe(`${Math.floor(t / 60)},${t % 60}`);
    }
  });
  it("표와 그래프", () => {
    for (const id of ["a2-graph-read-one", "a2-graph-two-sum"])
      for (const p of sample(id)) {
        const v = p.visual!;
        if (v.kind !== "shape") throw new Error();
        expect(v.label).not.toMatch(/\d/);
        expect(p.answer).toBe(String(nums(p.explanation).at(-1)));
      }
    for (const p of sample("a2-graph-marks")) {
      const v = p.visual!;
      if (v.kind !== "table") throw new Error();
      const row = v.rows[0].slice(1);
      const total = Number(row.at(-1));
      const known = row.slice(0, -1).filter((x) => x !== "").map(Number);
      expect(Number(p.answer)).toBe(total - known.reduce((a, b) => a + b, 0));
    }
  });
  it("규칙 찾기", () => {
    for (const p of sample("a2-mul-row-step")) { const [k] = nums(p.prompt); expect(Number(p.answer)).toBe(k); }
    for (const p of sample("a2-addtable-move")) { const [, , r, c, , k] = nums(p.prompt); expect(Number(p.answer)).toBe(r + c + k); expect(c + k).toBeLessThanOrEqual(9); }
    const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    for (const p of sample("a2-weekly-count")) {
      const [month, d] = nums(p.prompt);
      const last = DAYS[month - 1];
      expect(Number(p.answer)).toBe(Array.from({ length: last }, (_, i) => i + 1).filter((x) => Math.abs(x - d) % 7 === 0).length);
    }
  });
});
