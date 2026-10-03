import { describe, expect, it } from "vitest";
import { units } from "../content";
import { addedG6 } from "../content/added/g6";
import type { Generator, Problem } from "../content/types";
import { createRandom } from "../lib/random";
import { choicesUnique, commonIssues, hasPicture } from "./quality-checks";

/** 6학년 단원마다 더한 하·중·상 생성기: 답을 문제 글에서 다시 계산해 맞추어 본다 */

const all: [string, string, Generator][] = Object.entries(addedG6).flatMap(([u, m]) => Object.entries(m).flatMap(([s, gs]) => gs.map((g) => [u, s, g] as [string, string, Generator])));
const byId = new Map(all.map(([, , g]) => [g.id, g]));
const run = (id: string, n = 300): Problem[] => Array.from({ length: n }, (_, i) => byId.get(id)!.make(createRandom(i + 1)));
const nums = (t: string) => (t.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
const near = (a: string, b: number) => expect(Number(a)).toBeCloseTo(b, 6);
const FIG = ["g6-s1-prisms", "g6-s1-graphs", "g6-s1-volume-surface", "g6-s2-space", "g6-s2-circle-area", "g6-s2-round-solids"];

describe("6학년 추가 생성기", () => {
  it("6학년 12개 단원마다 하·중·상 하나씩, id는 a6- 로 시작하고 겹치지 않는다", () => {
    const g6 = units.filter((u) => u.grade === 6).map((u) => u.id).sort();
    expect(Object.keys(addedG6).sort()).toEqual(g6);
    for (const [u, m] of Object.entries(addedG6)) {
      const gs = Object.values(m).flat();
      expect(gs.map((g) => g.level).sort(), u).toEqual([1, 2, 3]);
      for (const g of gs) expect(g.id).toMatch(/^a6-/);
      const unit = units.find((x) => x.id === u)!;
      for (const s of Object.keys(m)) expect(unit.standards.map((x) => x.id), `${u}/${s}`).toContain(s);
    }
    const ids = units.flatMap((u) => u.standards.flatMap((s) => s.generators.map((g) => g.id)));
    for (const [, , g] of all) expect(ids.filter((x) => x === g.id), g.id).toHaveLength(1);
  });

  it("문제가 만들어지고, 보기에 정답이 정확히 하나 있고 보기가 겹치지 않으며, 조사·같은 값 보기 문제가 없다", () => {
    for (const [, , g] of all) {
      const ps = run(g.id);
      for (const p of ps) {
        expect(p.answer, g.id).not.toBe("");
        if (p.choices) {
          expect(p.choices.filter((c) => c === p.answer), g.id).toHaveLength(1);
          expect(choicesUnique(p), g.id).toBe(true);
        } else expect(Number(p.answer), `${g.id} ${p.prompt}`).toBeGreaterThan(0);
      }
      expect(commonIssues(g), g.id).toEqual([]);
      expect(new Set(ps.map((p) => p.key)).size, g.id).toBeGreaterThanOrEqual(4);
    }
  });

  it("도형·측정·그래프 단원의 새 생성기는 모두 그림을 보고 푼다", () => {
    for (const [u, , g] of all) if (FIG.includes(u)) for (const p of run(g.id, 50)) expect(hasPicture(p), g.id).toBe(true);
  });

  it("분수의 나눗셈(6-1)", () => {
    for (const p of run("a6-fd1-den")) {
      const [a, b, c] = nums(p.prompt.split("\n")[1]);
      expect(Number(p.answer)).toBe(b * c);
      expect(a).toBeLessThan(b);
    }
    for (const p of run("a6-fd1-smallest")) {
      const val = (t: string) => { const [a, b, c] = nums(t); return a / b / c; };
      const min = Math.min(...p.choices!.map(val));
      expect(val(p.answer)).toBe(min);
      expect(p.choices!.filter((c) => val(c) === min)).toHaveLength(1);
    }
    for (const p of run("a6-fd1-wire")) {
      const [w, k, d] = nums(p.prompt);
      const n = [3, 4, 5, 6].find((x) => p.prompt.includes(`정${["", "", "", "삼", "사", "오", "육"][x]}각형`))!;
      near(p.answer, ((w + k / d) * 100) / n);
      expect(Number.isInteger(Number(p.answer))).toBe(true);
    }
  });

  it("각기둥과 각뿔", () => {
    const n = (p: Problem) => (p.visual?.kind === "shape" ? p.visual.lines!.length / 3 : 0);
    for (const p of run("a6-pr-vf-sum")) expect(Number(p.answer)).toBe(2 * n(p) + n(p) + 2);
    for (const p of run("a6-pr-same-vertex")) expect(Number(p.answer)).toBe(2 * (2 * n(p) - 1));
    for (const p of run("a6-pr-edge-gap")) {
      const m = p.visual?.kind === "shape" ? p.visual.lines!.length / 2 : 0;
      expect(Number(p.answer)).toBe(m);
    }
  });

  it("소수의 나눗셈(6-1·6-2)", () => {
    for (const p of run("a6-dd1-ribbon")) { const [t, n] = nums(p.prompt); near(p.answer, t / n); }
    for (const p of run("a6-dd1-wrong-mul")) { const [c, , w] = nums(p.prompt); near(p.answer, w / c / c); }
    for (const p of run("a6-dd1-fuel")) {
      const [la, ka, lb, kb] = nums(p.prompt);
      near(p.answer, Math.abs(ka / la - kb / lb));
      for (const v of [ka / la, kb / lb]) expect(Math.round(v * 1e6) % 1000).toBeCloseTo(0, 6);
    }
    for (const p of run("a6-dd2-cut")) { const [t, e] = nums(p.prompt); near(p.answer, t / e); }
    for (const p of run("a6-dd2-wrong-mul")) { const [c, , w] = nums(p.prompt); near(p.answer, w / c / c); }
    for (const p of run("a6-dd2-need-more")) {
      const [t, e] = nums(p.prompt);
      const rest = t - Math.floor(t / e + 1e-9) * e;
      near(p.answer, e - rest);
      expect(rest).toBeGreaterThan(0.05);
    }
  });

  it("비와 비율", () => {
    for (const p of run("a6-rt-grid-pct")) { const v = p.visual!; if (v.kind === "bar") expect(Number(p.answer)).toBe((v.shaded * 100) / v.parts); }
    for (const p of run("a6-rt-sale-coupon")) { const [pr, r, c] = nums(p.prompt); expect(Number(p.answer)).toBe((pr * (100 - r)) / 100 - c); }
    for (const p of run("a6-rt-success")) { const [na, sa, nb, sb] = nums(p.prompt); near(p.answer, Math.max((sa / na) * 100, (sb / nb) * 100)); }
  });

  it("여러 가지 그래프: 그림의 백분율로 다시 계산", () => {
    const pct = (p: Problem, name: string) => {
      const v = p.visual!;
      if (v.kind !== "shape") throw new Error();
      const t = v.texts!;
      const i = t.findIndex((x) => x.text === name);
      return Number(t[i + 1].text.replace("%", ""));
    };
    for (const p of run("a6-gr-pie-most")) {
      const ps = p.choices!.map((c) => pct(p, c));
      expect(pct(p, p.answer)).toBe(Math.max(...ps));
    }
    for (const p of run("a6-gr-band-gap")) {
      const [N] = nums(p.prompt);
      const [a, b] = [...p.prompt.matchAll(/(사과|포도|딸기|수박)/g)].map((m) => m[1]);
      expect(Number(p.answer)).toBe((N * (pct(p, a) - pct(p, b))) / 100);
    }
    for (const p of run("a6-gr-pie-move")) {
      const [N, k] = nums(p.prompt);
      const t = [...p.prompt.matchAll(/(사과|포도|딸기|수박)/g)].map((m) => m[1])[1];
      expect(Number(p.answer)).toBe(((N * pct(p, t)) / 100 + k) / N * 100);
    }
  });

  it("직육면체의 부피와 겉넓이", () => {
    for (const p of run("a6-vs-cube-surface")) { const v = p.visual!; if (v.kind === "shape") { const a = Number(v.texts![0].text.split(" ")[0]); expect(Number(p.answer)).toBe(a * a * 6); } }
    for (const p of run("a6-vs-surface-to-volume")) { const [s] = nums(p.prompt); const a = Math.round(Math.sqrt(s / 6)); expect(a * a * 6).toBe(s); expect(Number(p.answer)).toBe(a ** 3); }
    for (const p of run("a6-vs-stone")) { const [w, d, h, h1, h2] = nums(p.prompt); expect(h2).toBeLessThanOrEqual(h); expect(Number(p.answer)).toBe(w * d * (h2 - h1)); }
  });

  it("분수의 나눗셈(6-2)", () => {
    for (const p of run("a6-fd2-improper")) { const [w, n, d] = nums(p.prompt.split("\n")[1]); expect(Number(p.answer)).toBe(w * d + n); }
    for (const p of run("a6-fd2-times")) {
      const fr = [...p.prompt.matchAll(/(?:(\d+) )?(\d+)\/(\d+)/g)].map((m) => Number(m[1] ?? 0) + Number(m[2]) / Number(m[3]));
      near(p.answer, fr[0] / fr[1]);
    }
    for (const p of run("a6-fd2-walk")) {
      const m = p.prompt.match(/(\d+)\/(\d+)시간 동안 (?:(\d+) )?(\d+)\/(\d+) km.* (\d+)시간/)!;
      const t = Number(m[1]) / Number(m[2]);
      const dist = Number(m[3] ?? 0) + Number(m[4]) / Number(m[5]);
      near(p.answer, (dist / t) * Number(m[6]));
      expect(Number(m[4])).toBeLessThan(Number(m[5]));
    }
  });

  it("공간과 입체: 위에서 본 모양의 수로 다시 계산", () => {
    const vals = (p: Problem) => (p.visual?.kind === "shape" ? p.visual.texts!.filter((t) => /^\d$/.test(t.text)).map((t) => Number(t.text)) : []);
    for (const p of run("a6-sp-top-gap")) { const v = vals(p); expect(Number(p.answer)).toBe(Math.max(...v) - Math.min(...v)); }
    for (const p of run("a6-sp-fill-level")) { const v = vals(p); const mx = Math.max(...v); expect(Number(p.answer)).toBe(v.reduce((s, x) => s + mx - x, 0)); }
    for (const p of run("a6-sp-copies-cube")) {
      const v = vals(p);
      const [m, r, k] = nums(p.prompt.split("입니다.")[1]);
      expect(Number(p.answer)).toBe(v.reduce((s, x) => s + x, 0) * m + r - k ** 3);
    }
  });

  it("비례식과 비례배분", () => {
    for (const p of run("a6-pp-outer")) { const [a, , , d] = nums(p.prompt); expect(p.answer).toBe(`${a}, ${d}`); const [x, y, z, w] = nums(p.prompt); expect(x * w).toBe(y * z); }
    for (const p of run("a6-pp-rect-share")) { const [P, a, b] = nums(p.prompt); expect(Number(p.answer)).toBe(((P / 2) * a) / (a + b)); }
    for (const p of run("a6-pp-change-share")) {
      const [ga, gb, price] = nums(p.prompt);
      const share = ((ga + gb - price) * ga) / (ga + gb);
      expect(Number(p.answer)).toBe(share);
      expect(share % 10).toBe(0);
    }
  });

  it("원의 넓이와 원기둥·원뿔·구: 원주율 3.14를 문제에 쓴다", () => {
    for (const id of ["a6-ca-diameter-area", "a6-ca-track", "a6-ca-two-circles", "a6-rs-cyl-top-area", "a6-rs-net-perimeter", "a6-rs-semicircle-sphere"]) for (const p of run(id, 30)) expect(p.prompt, id).toContain("원주율 3.14");
    for (const p of run("a6-ca-diameter-area")) { const [d] = nums(p.prompt); near(p.answer, (d / 2) ** 2 * 3.14); }
    for (const p of run("a6-ca-track")) { const [L, D] = nums(p.prompt); near(p.answer, 2 * L + D * 3.14); }
    for (const p of run("a6-ca-two-circles")) { const [R] = nums(p.prompt); near(p.answer, R * R * 3.14 / 2); }
    for (const p of run("a6-rs-cyl-top-area")) { const [r] = nums(p.prompt); near(p.answer, r * r * 3.14); }
    for (const p of run("a6-rs-net-perimeter")) { const [r, h] = nums(p.prompt); near(p.answer, 2 * (2 * r * 3.14 + h)); }
    for (const p of run("a6-rs-semicircle-sphere")) { const [d] = nums(p.prompt); near(p.answer, d * 3.14); }
  });

  it("학년 범위: 수는 너무 크지 않고 소수는 셋째 자리를 넘지 않는다", () => {
    for (const [, , g] of all) for (const p of run(g.id, 100)) {
      for (const x of nums(`${p.prompt} ${p.answer}`)) expect(x, `${g.id} ${p.prompt}`).toBeLessThanOrEqual(100000);
      for (const d of `${p.prompt} ${p.answer}`.match(/\d+\.\d+/g) ?? []) expect(d.split(".")[1].length, g.id).toBeLessThanOrEqual(3);
    }
  });
});
