import { describe, expect, it } from "vitest";
import { units } from "../content";
import { addedG1 } from "../content/added/g1";
import type { Generator, Problem } from "../content/types";
import { createRandom } from "../lib/random";

const SEEDS = 300;
const all: [string, string, Generator][] = Object.entries(addedG1).flatMap(([u, m]) => Object.entries(m).flatMap(([s, gs]) => gs.map((g) => [u, s, g] as [string, string, Generator])));
const run = (g: Generator) => Array.from({ length: SEEDS }, (_, s) => g.make(createRandom(s)));
const byId = (id: string) => all.find(([, , g]) => g.id === id)![2];
const nums = (s: string) => [...s.matchAll(/\d+/g)].map((m) => Number(m[0]));
const calc = (e: string) => {
  const [x, op, y] = e.split(" ");
  return op === "+" ? Number(x) + Number(y) : Number(x) - Number(y);
};

describe("1학년 추가 생성기(a1-)", () => {
  it("1학년 단원마다 하·중·상이 하나씩 있고, 단원·차시가 실제로 있으며 차시에 합쳐졌다", () => {
    const g1 = units.filter((u) => u.grade === 1);
    expect(Object.keys(addedG1).sort()).toEqual(g1.map((u) => u.id).sort());
    for (const u of g1) {
      const gens = Object.values(addedG1[u.id]).flat();
      expect(gens.map((g) => g.level).sort()).toEqual([1, 2, 3]);
      for (const [sid, gs] of Object.entries(addedG1[u.id])) {
        const std = u.standards.find((s) => s.id === sid);
        expect(std, `${u.id}/${sid}`).toBeDefined();
        for (const g of gs) expect(std!.generators.map((x) => x.id)).toContain(g.id);
      }
    }
  });

  it("id가 a1-로 시작하고 전체에서 하나뿐이다", () => {
    const ids = units.flatMap((u) => u.standards.flatMap((s) => s.generators.map((g) => g.id)));
    for (const [, , g] of all) {
      expect(g.id.startsWith("a1-")).toBe(true);
      expect(new Set(units.flatMap((u) => u.standards.filter((s) => s.generators.includes(g)).map(() => 1))).size).toBe(1);
      expect(ids.filter((x) => x === g.id).length).toBe(1);
    }
  });

  it.each(all.map(([, , g]) => [g.id, g] as const))("%s: 보기에 정답이 정확히 하나, 보기 중복 없음, 수는 0~100", (_id, g) => {
    for (const p of run(g)) {
      if (p.input === "choice") {
        expect(p.choices!.length).toBe(4);
        expect(new Set(p.choices).size).toBe(4);
        expect(p.choices!.filter((c) => c === p.answer).length).toBe(1);
      }
      for (const n of nums(`${p.prompt} ${p.expression ?? ""} ${p.answer} ${(p.choices ?? []).join(" ")}`)) expect(n).toBeLessThanOrEqual(100);
      expect(p.prompt).not.toMatch(/undefined|NaN/);
      expect(p.explanation).not.toMatch(/undefined|NaN/);
    }
  });

  it("1-1 단원(9까지·50까지)의 정답은 범위를 넘지 않는다", () => {
    for (const [u, , g] of all) {
      if (!u.startsWith("g1-s1")) continue;
      const max = u === "g1-s1-numbers50" ? 50 : 9;
      for (const p of run(g)) for (const n of nums(`${p.prompt} ${p.answer} ${(p.choices ?? []).join(" ")}`)) expect(n, `${g.id} ${p.prompt}`).toBeLessThanOrEqual(max);
    }
  });

  /* ── 정답을 독립적으로 다시 계산 ── */
  const check = (id: string, f: (p: Problem) => string | number) =>
    it(`${id}: 정답이 맞다`, () => {
      for (const p of run(byId(id))) expect(String(p.answer), p.prompt + (p.expression ?? "")).toBe(String(f(p)));
    });

  check("a1-n9-fewer-plate", (p) => {
    const [a, b] = nums(p.visual!.kind === "shape" ? p.visual!.label : "");
    return Math.min(a, b);
  });
  check("a1-n9-wrong-seq", (p) => p.choices!.find((c) => { const v = nums(c); return v.some((x, i) => i > 0 && x !== v[i - 1] + 1); })!);
  check("a1-n9-stairs", (p) => { const a = nums(p.prompt)[2]; return p.prompt.includes("위로 두 칸") ? a + 1 : a - 1; });
  check("a1-as-sum-pick", (p) => { const t = nums(p.prompt)[0]; const ok = p.choices!.filter((c) => calc(c) === t); expect(ok).toHaveLength(1); return ok[0]; });
  check("a1-as-diff-pick", (p) => { const t = nums(p.prompt)[0]; const ok = p.choices!.filter((c) => calc(c) === t); expect(ok).toHaveLength(1); return ok[0]; });
  check("a1-as-equal-share", (p) => { const [a, b] = nums(p.prompt); return (a - b) / 2; });
  check("a1-cmp-cups-more", (p) => { const c = nums(p.prompt).slice(0, 3); return Math.max(...c) - Math.min(...c); });
  check("a1-cmp-area-join-diff", (p) => { const [a, b, c] = nums(p.prompt); return a + b - c; });
  check("a1-n50-word-to-num", (p) => { expect(Number(p.answer)).toBeGreaterThan(10); return p.answer; });
  check("a1-n50-next-after", (p) => { const [, a, b] = nums(p.prompt); return a * 10 + b + 1; });
  check("a1-n50-box-need", (p) => Math.ceil(nums(p.prompt)[0] / 10));
  check("a1-n100-tickets", (p) => { const [a, b] = nums(p.prompt); return b - a + 1; });
  check("a1-n100-catch-up", (p) => { const [big, small] = nums(p.prompt); return big - small + 1; });
  check("a1-as2-ten-first-same", (p) => { const [a, b] = nums(p.prompt); const ok = p.choices!.filter((c) => calc(c) === a + b); expect(ok).toHaveLength(1); return ok[0]; });
  check("a1-as2-same-diff", (p) => { const [a, b] = nums(p.prompt); const ok = p.choices!.filter((c) => calc(c) === a - b); expect(ok).toHaveLength(1); for (const c of p.choices!) { const [x, y] = nums(c); expect(y > x % 10, c).toBe(true); } return ok[0]; });
  check("a1-as2-goal", (p) => { const [a, b, goal] = nums(p.prompt); expect((a % 10) + (b % 10)).toBeLessThan(10); return goal - a - b; });
  check("a1-sol-kinds-left", (p) => { const [k, items] = p.key.split(":").slice(1); return (items.match(/[a-z]+/g) ?? []).filter((x) => x !== k).length; });
  check("a1-sol-roll-more", (p) => { const kinds = p.key.split(":")[1].match(/[a-z]+/g)!; const box = kinds.filter((x) => x === "box").length; return kinds.length - 2 * box; });
  check("a1-cmp-longer-than", (p) => { const [ref, lens] = p.key.split(":").slice(1); const l = lens.split(",").map(Number); return l.filter((x) => x > l[Number(ref)]).length; });
  check("a1-flat-tri-to-sq", (p) => 2 * nums(p.prompt)[2]);
  check("a1-pat-skip-back", (p) => { const parts = p.expression!.split(", "); const i = parts.indexOf("□"); const v = parts.map(Number); const step = i >= 2 ? v[0] - v[1] : v[3] - v[4]; return v[i - 1] - step; });
  check("a1-pat-chart-move", (p) => {
    const a = nums(p.prompt)[3];
    const dv = p.prompt.includes("위로") ? -10 : 10;
    const dh = (p.prompt.includes("두 칸") ? 2 : 1) * (p.prompt.includes("왼쪽") ? -1 : 1);
    return a + dv + dh;
  });

  it("a1-clk-half-later: 시각은 1~12시 30분이다", () => {
    for (const p of run(byId("a1-clk-half-later"))) expect(p.answer).toMatch(/^([1-9]|1[0-2]),30$/);
  });
  it("그림 문제(접시·모양·막대·시계·모양 줄)에는 그림이 있다", () => {
    for (const id of ["a1-n9-fewer-plate", "a1-sol-build-total", "a1-sol-kinds-left", "a1-sol-roll-more", "a1-cmp-longer-than", "a1-flat-no-corner", "a1-clk-half-later", "a1-flat-tri-to-sq", "a1-pat-unit-length"])
      for (const p of run(byId(id))) expect(p.visual?.kind, id).toBe("shape");
  });
});
