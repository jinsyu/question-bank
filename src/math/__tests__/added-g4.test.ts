import { describe, expect, it } from "vitest";
import { units } from "../content";
import { addedG4 } from "../content/added/g4";
import type { Generator, Problem, ShapeScene, Visual } from "../content/types";
import { fractionValue } from "../content/generators/grade4";
import { createRandom } from "../lib/random";
import { choicesUnique, figureOk, hasPicture, hasPlaceholder, oddAngles, visibleText, wrongJosa } from "./quality-checks";

/** 4학년 단원마다 더한 생성기(a4-*): 정답을 따로 다시 계산해 맞는지, 보기·범위·그림을 검사한다 */
const SEEDS = 300;
const all = Object.entries(addedG4).flatMap(([unitId, stds]) => Object.entries(stds).flatMap(([stdId, gens]) => gens.map((g) => ({ unitId, stdId, g }))));
const gen = (id: string): Generator => all.find((e) => e.g.id === id)!.g;
const run = (id: string) => Array.from({ length: SEEDS }, (_, s) => gen(id).make(createRandom(s)));
const nums = (text: string) => [...text.matchAll(/\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
const FIGURE_UNITS = ["g4-s1-angles", "g4-s1-moving", "g4-s1-bar-graph", "g4-s2-triangles", "g4-s2-quadrilaterals", "g4-s2-line-graph", "g4-s2-polygons"];

describe("4학년 추가 생성기 구성", () => {
  const g4 = units.filter((u) => u.grade === 4);

  it("4학년 12개 단원마다 하·중·상이 하나씩 있다", () => {
    expect(g4).toHaveLength(12);
    for (const u of g4) {
      const levels = all.filter((e) => e.unitId === u.id).map((e) => e.g.level).sort();
      expect(levels, u.id).toEqual([1, 2, 3]);
    }
  });

  it("id는 a4-로 시작하고 전체에서 하나뿐이며, 해당 차시의 생성기에 들어 있다", () => {
    const ids = units.flatMap((u) => u.standards.flatMap((s) => s.generators.map((g) => g.id)));
    for (const { unitId, stdId, g } of all) {
      expect(g.id).toMatch(/^a4-/);
      expect(ids.filter((x) => x === g.id), g.id).toHaveLength(1);
      const std = g4.find((u) => u.id === unitId)?.standards.find((s) => s.id === stdId);
      expect(std?.generators.map((x) => x.id), `${unitId}/${stdId}`).toContain(g.id);
    }
  });

  it.each(all.map((e) => [e.g.id, e] as const))("%s: 공통 품질(조사·각도·그림·보기·학년 용어)", (_, { unitId, g }) => {
    const keys = new Set<string>();
    for (const [seed, p] of Array.from({ length: SEEDS }, (_, s) => g.make(createRandom(s))).entries()) {
      const msg = `${g.id} seed ${seed}: ${p.prompt}`;
      expect(p.level ?? g.level).toBe(g.level);
      expect(hasPlaceholder(p), msg).toBe(false);
      expect(wrongJosa(p), msg).toEqual([]);
      expect(oddAngles(p), msg).toEqual([]);
      expect(figureOk(p), msg).toBe(true);
      expect(visibleText(p), msg).not.toMatch(/배수|약수|undefined|NaN/);
      if (FIGURE_UNITS.includes(unitId)) expect(hasPicture(p), msg).toBe(true);
      if (p.input === "choice") {
        expect(p.choices, msg).toHaveLength(4);
        expect(choicesUnique(p), msg).toBe(true);
        expect(p.choices!.filter((c) => c === p.answer), msg).toHaveLength(1);
      } else {
        expect(Number(p.answer), msg).toBeGreaterThan(0);
      }
      keys.add(p.key);
    }
    expect(keys.size, `${g.id} 문제 가짓수`).toBeGreaterThanOrEqual(10);
  });
});

describe("정답을 따로 계산해 확인", () => {
  it("큰 수", () => {
    for (const p of run("a4-big-jo-compose")) {
      const [, a, , b] = nums(p.prompt);
      expect(p.answer).toBe(String(a * 1e12 + b * 1e8));
    }
    for (const p of run("a4-big-digit-biggest")) {
      const d = String(nums(p.prompt)[0]);
      const value = (c: string) => {
        const s = c.replace(/,/g, "");
        expect(s.split(d).length - 1, c).toBe(1);
        return 10 ** (s.length - 1 - s.indexOf(d));
      };
      const best = Math.max(...p.choices!.map(value));
      expect(value(p.answer)).toBe(best);
      expect(p.choices!.filter((c) => value(c) === best)).toHaveLength(1);
    }
    for (const p of run("a4-big-check-100man")) {
      const [a, b] = p.prompt.match(/(\d)억 (\d)000만/)!.slice(1).map(Number);
      expect(Number(p.answer) * 1e6).toBe(a * 1e8 + b * 1e7);
    }
  });

  it("각도: 그림의 각과 정답", () => {
    for (const p of run("a4-ang-right-split")) {
      const k = Number((p.visual as ShapeScene).texts!.find((t) => t.text.endsWith("°"))!.text.slice(0, -1));
      expect(Number(p.answer) + k).toBe(90);
    }
    for (const p of run("a4-ang-around-point")) {
      const shown = (p.visual as ShapeScene).texts!.filter((t) => t.text.endsWith("°")).map((t) => Number(t.text.slice(0, -1)));
      expect(shown).toHaveLength(3);
      expect(Number(p.answer) + shown.reduce((s, x) => s + x, 0)).toBe(360);
    }
    for (const p of run("a4-ang-tri-diff")) {
      const d = nums(p.prompt)[0];
      const c = Number((p.visual as ShapeScene).texts!.find((t) => t.text.endsWith("°"))!.text.slice(0, -1));
      const A = Number(p.answer);
      const B = A - d;
      expect(A + B + c).toBe(180);
      expect(Math.min(A, B, c)).toBeGreaterThan(0);
      // 그림의 각 ㄷ이 실제로 c°
      const [Ap, Bp, Cp] = (p.visual as ShapeScene).polygons![0].points;
      const ang = (v: number[], a: number[], b: number[]) => (Math.acos(((a[0] - v[0]) * (b[0] - v[0]) + (a[1] - v[1]) * (b[1] - v[1])) / (Math.hypot(a[0] - v[0], a[1] - v[1]) * Math.hypot(b[0] - v[0], b[1] - v[1]))) * 180) / Math.PI;
      expect(Math.abs(ang(Cp, Ap, Bp) - c)).toBeLessThan(1.5);
      expect(Math.abs(ang(Ap, Bp, Cp) - A)).toBeLessThan(1.5);
    }
  });

  it("곱셈과 나눗셈", () => {
    for (const p of run("a4-md-rem-cannot")) {
      const t = nums(p.prompt)[0];
      expect(p.choices!.filter((c) => Number(c) >= t)).toEqual([p.answer]);
    }
    for (const p of run("a4-md-zero-count")) {
      const [a, b] = nums(p.prompt);
      expect(Number(p.answer)).toBe([...String(a * b)].filter((c) => c === "0").length);
    }
    for (const p of run("a4-md-boxes-total")) {
      const [p1, m, q, n] = nums(p.prompt);
      expect(Number(p.answer)).toBe(p1 * m + q * n);
      expect(p1).toBeGreaterThanOrEqual(100);
      expect(m).toBeGreaterThanOrEqual(10);
    }
  });

  it("규칙 찾기", () => {
    for (const p of run("a4-pat-middle")) {
      const parts = p.expression!.split(", ");
      const known = parts.map((x, i) => [i, Number(x)] as const).filter(([, v]) => !Number.isNaN(v));
      const step = (known[known.length - 1][1] - known[0][1]) / (known[known.length - 1][0] - known[0][0]);
      expect(Number(p.answer)).toBe(known[0][1] + step * (parts.indexOf("□") - known[0][0]));
    }
    const ORD = ["첫째", "둘째", "셋째", "넷째", "다섯째", "여섯째", "일곱째", "여덟째", "아홉째"];
    for (const p of run("a4-pat-sum-nth")) {
      const lines = p.prompt.split("\n").slice(1).map(nums);
      const target = nums(p.prompt.split("\n")[0])[0];
      const n = ORD.indexOf(p.answer);
      const [a, b] = lines[0];
      expect(a + 10 * n + b + 10 * n).toBe(target);
    }
    for (const p of run("a4-pat-grow-diff")) {
      const ORD2 = ["", ...ORD, "열째"];
      const n = ORD2.findIndex((o) => o && p.prompt.includes(`${o}에`));
      const t = nums(p.prompt.split("\n")[1]);
      const seq = [...t];
      while (seq.length < n) seq.push(seq[seq.length - 1] + (seq[seq.length - 1] - seq[seq.length - 2]) + 1);
      expect(Number(p.answer)).toBe(seq[n - 1]);
    }
  });

  it("분수의 덧셈과 뺄셈", () => {
    for (const p of run("a4-fr-unit-count")) {
      const [, , a, , , b] = nums(p.prompt);
      expect(Number(p.answer)).toBe(a + b);
    }
    for (const p of run("a4-fr-tape-overlap")) {
      const m = p.prompt.match(/길이가 (.+?) m인 .+ (\d+\/\d+) m만큼/)!;
      expect(fractionValue(p.answer)).toBeCloseTo(2 * fractionValue(m[1]) - fractionValue(m[2]), 9);
      expect(p.choices!.map(fractionValue).filter((v) => Math.abs(v - fractionValue(p.answer)) < 1e-9)).toHaveLength(1);
    }
    for (const p of run("a4-fr-two-days")) {
      const m = p.prompt.match(/물이 (\d+) L .+ 어제 (.+?) L[을를] .+ 오늘 (.+?) L[을를]/)!;
      const r = Number(m[1]) - fractionValue(m[2]) - fractionValue(m[3]);
      expect(r).toBeGreaterThan(0);
      expect(fractionValue(p.answer)).toBeCloseTo(r, 9);
      expect(p.choices!.map(fractionValue).filter((v) => Math.abs(v - r) < 1e-9)).toHaveLength(1);
    }
  });

  it("소수의 덧셈과 뺄셈", () => {
    for (const p of run("a4-dec-tenths-sum")) {
      const [, a, , b] = nums(p.prompt);
      expect(Math.round(Number(p.answer) * 10)).toBe(a + b);
    }
    for (const p of run("a4-dec-whole-minus")) {
      const [x, w] = nums(p.expression!);
      expect(Math.round((Number(p.answer) + x) * 100)).toBe(w * 100);
      expect(p.answer).toMatch(/^\d\.\d[1-9]$/);
    }
    for (const p of run("a4-dec-detour")) {
      const [a, b, r] = nums(p.prompt);
      expect(Math.round(Number(p.answer) * 100)).toBe(Math.round((a + b - r) * 100));
      expect(Number(p.answer)).toBeGreaterThan(0);
    }
  });

  it("평면도형의 이동: 판의 색칠한 칸", () => {
    const cellOf = (s: ShapeScene, k: number) => {
      const filled = s.polygons!.filter((x) => x.fill)[k].points[0];
      const [x0, y0, cell] = k === 0 ? [110, 10, 20] : [12 + 72 * (k - 1), 115, 14];
      return [Math.round((filled[0] - x0) / cell), Math.round((filled[1] - y0) / cell)];
    };
    const check = (id: string, f: (c: number[], p: Problem) => number[]) => {
      for (const p of run(id)) {
        const s = p.visual as ShapeScene;
        const start = cellOf(s, 0);
        const want = f(start, p).join(",");
        const ok = [1, 2, 3, 4].filter((k) => cellOf(s, k).join(",") === want);
        expect(ok, p.prompt).toHaveLength(1);
        expect(p.answer).toBe(["①", "②", "③", "④"][ok[0] - 1]);
      }
    };
    const flip = ([c, r]: number[], p: Problem) => (/(오른|왼)쪽으로 뒤집/.test(p.prompt) ? [3 - c, r] : [c, 3 - r]);
    check("a4-mv-board-flip", flip);
    check("a4-mv-board-combo", (c, p) => {
      const [x, y] = flip(c, p);
      return p.prompt.includes("시계 반대") ? [y, 3 - x] : [3 - y, x];
    });
    for (const p of run("a4-mv-point-steps")) {
      const [A, B] = (p.visual as ShapeScene).dots!;
      const v = nums(p.prompt)[0];
      expect(Math.abs(B[1] - A[1]) / 20).toBe(v);
      expect(Number(p.answer)).toBe(Math.abs(B[0] - A[0]) / 20);
    }
  });

  it("막대그래프·꺾은선그래프: 그래프 값으로 다시 계산", () => {
    type G = Extract<Visual, { kind: "bars" | "line" }>;
    for (const p of run("a4-bar-two-sum")) {
      const v = p.visual as G;
      expect(Number(p.answer)).toBe(v.asked!.reduce((s, i) => s + v.values[i], 0));
      for (const i of v.asked!) expect(p.prompt).toContain(v.labels[i]);
    }
    for (const p of run("a4-bar-rescale")) {
      const v = p.visual as G;
      expect(Number(p.answer) * 2).toBe(v.values[v.asked![0]]);
      expect(Math.max(...v.values) / v.step).toBeLessThanOrEqual(12);
    }
    for (const p of run("a4-bar-catch-up")) {
      const v = p.visual as G;
      const i = v.labels.findIndex((l) => p.prompt.startsWith(l));
      const others = Math.max(...v.values.filter((_, k) => k !== i));
      expect(v.values[i] + Number(p.answer)).toBe(others + 1);
    }
    for (const p of run("a4-line-first-over")) {
      const v = p.visual as G;
      const t = nums(p.prompt)[0];
      expect(p.answer).toBe(v.labels[v.values.findIndex((x) => x > t)]);
      expect(Math.max(...v.values) / v.step).toBeLessThanOrEqual(12);
    }
    for (const p of run("a4-line-least-change")) {
      const v = p.visual as G;
      const diffs = v.values.slice(1).map((x, k) => Math.abs(x - v.values[k]));
      const m = Math.min(...diffs);
      expect(diffs.filter((d) => d === m)).toHaveLength(1);
      expect(p.answer.startsWith(v.labels[diffs.indexOf(m)])).toBe(true);
      expect(Math.min(...v.values)).toBeGreaterThan(0);
      expect(Math.max(...v.values) / v.step).toBeLessThanOrEqual(12);
    }
    for (const p of run("a4-line-rescale")) {
      const v = p.visual as G;
      expect(Number(p.answer) * 5).toBe(Math.max(...v.values) - Math.min(...v.values));
      expect(Math.max(...v.values) / v.step).toBeLessThanOrEqual(12);
    }
  });

  it("삼각형·사각형·다각형", () => {
    for (const p of run("a4-tri-pick-kind")) {
      const s = p.visual as ShapeScene;
      const kinds = s.polygons!.map(({ points }) => {
        const angs = points.map((v, i) => {
          const a = points[(i + 1) % 3];
          const b = points[(i + 2) % 3];
          const cos = ((a[0] - v[0]) * (b[0] - v[0]) + (a[1] - v[1]) * (b[1] - v[1])) / (Math.hypot(a[0] - v[0], a[1] - v[1]) * Math.hypot(b[0] - v[0], b[1] - v[1]));
          return (Math.acos(cos) * 180) / Math.PI;
        });
        const big = Math.max(...angs);
        return big > 95 ? "둔각삼각형" : big < 85 ? "예각삼각형" : "직각삼각형";
      });
      const target = p.prompt.includes("둔각") ? "둔각삼각형" : "예각삼각형";
      expect(kinds.filter((k) => k === target), p.prompt).toHaveLength(1);
      expect(p.answer).toBe(["①", "②", "③", "④"][kinds.indexOf(target)]);
    }
    for (const p of run("a4-tri-iso-base")) {
      const P = nums(p.prompt)[0];
      const a = Number((p.visual as ShapeScene).texts!.find((t) => t.text.endsWith("cm"))!.text.split(" ")[0]);
      const b = Number(p.answer);
      expect(2 * a + b).toBe(P);
      expect(b).toBeLessThan(2 * a);
      expect(b).not.toBe(a);
    }
    for (const p of run("a4-tri-equi-iso")) {
      const P = nums(p.prompt)[0];
      const a = Number((p.visual as ShapeScene).texts!.find((t) => t.text.endsWith("cm"))!.text.split(" ")[0]);
      const b = Number(p.answer);
      expect(2 * a + 2 * b).toBe(P);
      expect(2 * b).toBeGreaterThan(a);
    }
    for (const p of run("a4-quad-rhombus-perim")) {
      const a = Number((p.visual as ShapeScene).texts![0].text.split(" ")[0]);
      expect(Number(p.answer)).toBe(4 * a);
    }
    for (const p of run("a4-quad-para-side-back")) {
      const P = nums(p.prompt)[0];
      const a = Number((p.visual as ShapeScene).texts!.find((t) => t.text.endsWith("cm"))!.text.split(" ")[0]);
      expect(2 * (a + Number(p.answer))).toBe(P);
    }
    for (const p of run("a4-quad-para-angle-diff")) {
      const d = nums(p.prompt)[0];
      const A = Number(p.answer);
      expect(A + (A - d)).toBe(180);
      expect(A).toBeGreaterThan(90);
    }
    for (const p of run("a4-poly-reg-side")) {
      const P = nums(p.prompt)[0];
      const n = (p.visual as ShapeScene).polygons![0].points.length;
      expect(Number(p.answer) * n).toBe(P);
    }
    for (const p of run("a4-poly-diag-sum")) {
      const total = (p.visual as ShapeScene).polygons!.reduce((s, { points: { length: n } }) => s + (n * (n - 3)) / 2, 0);
      expect(Number(p.answer)).toBe(total);
    }
    for (const p of run("a4-poly-house")) {
      const P = nums(p.prompt)[0];
      expect(Number(p.answer)).toBe((P / 5) * 4);
    }
  });
});
