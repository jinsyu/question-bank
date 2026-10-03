import { describe, expect, it } from "vitest";
import { units } from "../content";
import { addedG5, evalExpr, firstPart, fracText, CR_FORMS } from "../content/added/g5";
import type { Generator, Problem } from "../content/types";
import { createRandom } from "../lib/random";
import { choiceValue } from "./quality-checks";

/** 5학년 단원마다 더한 생성기(하·중·상 하나씩): 정답을 문제 글에서 다시 계산해 맞는지 본다 */

const gens = new Map<string, Generator>();
for (const std of Object.values(addedG5)) for (const list of Object.values(std)) for (const g of list) gens.set(g.id, g);
const g = (id: string) => gens.get(id)!;
const sample = (id: string, n = 300): Problem[] => Array.from({ length: n }, (_, s) => g(id).make(createRandom(s)));
const nums = (s: string) => [...s.matchAll(/\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
/** "w a/b", "a/b", "n" (뒤 단위 무시) → 값 */
const val = (t: string) => {
  const m = /^(?:(\d+) )?(\d+)\/(\d+)/.exec(t);
  return m ? Number(m[1] ?? 0) + Number(m[2]) / Number(m[3]) : Number.parseFloat(t);
};
const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;

describe("5학년 추가 생성기 구성", () => {
  const grade5 = units.filter((u) => u.grade === 5);
  it("5학년 12개 단원마다 하·중·상이 하나씩 있다", () => {
    expect(grade5.length).toBe(12);
    for (const u of grade5) {
      const added = Object.values(addedG5[u.id] ?? {}).flat();
      expect(added.map((x) => x.level).sort(), u.id).toEqual([1, 2, 3]);
    }
  });
  it("넣은 차시가 실제로 있고, 차시 생성기에 합쳐졌으며, id는 a5-로 시작하고 전역에서 유일하다", () => {
    const all = units.flatMap((u) => u.standards.flatMap((s) => s.generators.map((x) => x.id)));
    for (const [uid, std] of Object.entries(addedG5)) {
      const u = grade5.find((x) => x.id === uid)!;
      for (const [sid, list] of Object.entries(std)) {
        const s = u.standards.find((x) => x.id === sid);
        expect(s, `${uid}/${sid}`).toBeTruthy();
        for (const x of list) {
          expect(x.id).toMatch(/^a5-/);
          expect(s!.generators).toContain(x);
          expect(all.filter((id) => id === x.id).length, x.id).toBe(1);
        }
      }
    }
  });
});

describe("모든 추가 생성기 공통", () => {
  it.each([...gens.keys()])("%s: 보기에 정답이 정확히 하나, 보기 중복 없음, 문제가 여러 가지", (id) => {
    const ps = sample(id);
    for (const p of ps) {
      expect(p.answer).not.toBe("");
      if (p.choices) {
        expect(p.choices.length).toBe(4);
        expect(p.choices.filter((c) => c === p.answer).length).toBe(1);
        expect(new Set(p.choices).size).toBe(4);
        const vals = p.choices.map(choiceValue).filter((v) => v !== null);
        expect(new Set(vals).size).toBe(vals.length);
      }
    }
    expect(new Set(ps.map((p) => p.key)).size).toBeGreaterThan(15);
  });
});

describe("정답 재계산", () => {
  it("a5-mc-first: 가장 먼저 계산할 부분이 맞다", () => {
    for (const p of sample("a5-mc-first")) {
      const e = p.expression!;
      const paren = e.indexOf("(");
      const flat = e.replace(/[()]/g, "");
      const ns = nums(flat);
      const ops = [...flat.matchAll(/[+−×÷]/g)].map((m) => m[0]) as ("+" | "−" | "×" | "÷")[];
      const pi = paren < 0 ? -1 : nums(e.slice(0, paren)).length;
      expect(evalExpr(ns, ops, pi)).not.toBeNull();
      const f = firstPart(ops, pi);
      expect(p.answer).toBe(`${ns[f]} ${ops[f]} ${ns[f + 1]}`);
    }
  });
  it("a5-mc-sign: 정답 기호만 식을 만족한다", () => {
    for (const p of sample("a5-mc-sign")) {
      const [lhs, rhs] = p.expression!.split(" = ");
      const ns = nums(lhs);
      const ops = [...lhs.matchAll(/[+−×÷]/g)].map((m) => m[0]) as ("+" | "−" | "×" | "÷")[];
      const ok = (["+", "−", "×", "÷"] as const).filter((o) => evalExpr(ns, [o, ...ops], -1) === Number(rhs));
      expect(ok).toEqual([p.answer]);
    }
  });
  it("a5-mc-reverse", () => {
    for (const p of sample("a5-mc-reverse")) {
      const [a, b, c, d] = nums(p.prompt);
      expect(((Number(p.answer) * a + b) / c)).toBe(d);
    }
  });
  it("a5-fc-hidden", () => {
    for (const p of sample("a5-fc-hidden")) {
      const n = nums(p.prompt)[0];
      const shown = p.expression!.split(", ");
      const ds = Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0);
      expect(shown.length).toBe(ds.length);
      expect(ds[shown.indexOf("□")]).toBe(Number(p.answer));
    }
  });
  it("a5-fc-lcm-over", () => {
    for (const p of sample("a5-fc-lcm-over")) {
      const [a, b, t] = nums(p.prompt);
      let x = t + 1;
      while (x % a || x % b) x++;
      expect(Number(p.answer)).toBe(x);
    }
  });
  it("a5-fc-squares", () => {
    for (const p of sample("a5-fc-squares")) {
      const [a, b] = nums(p.prompt);
      const s = gcd(a, b);
      expect(Number(p.answer)).toBe((a / s) * (b / s));
      expect(Math.max(a, b)).toBeLessThanOrEqual(96);
    }
  });
  it("a5-cr-legs", () => {
    for (const p of sample("a5-cr-legs")) {
      const [per, n] = nums(p.prompt);
      expect(Number(p.answer)).toBe(per * n);
    }
  });
  it("a5-cr-wrong-expr: 정답 식만 표와 맞지 않는다", () => {
    const holds = (expr: string, o: number, t: number) => {
      const s = expr.replace(/○/g, String(o)).replace(/△/g, String(t)).replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
      const [l, r] = s.split(" = ");
      return Math.abs(Function(`return ${l}`)() - Function(`return ${r}`)()) < 1e-9;
    };
    for (const p of sample("a5-cr-wrong-expr")) {
      const v = p.visual as { kind: "table"; header: string[]; rows: string[][] };
      const os = v.header.slice(1).map(Number);
      const ts = v.rows[0].slice(1).map(Number);
      for (const c of p.choices!) {
        const fits = os.every((o, i) => holds(c, o, ts[i]));
        expect(fits, c).toBe(c !== p.answer);
      }
    }
    expect(CR_FORMS.mul.wrong.length).toBe(3);
  });
  it("a5-cr-pins", () => {
    for (const p of sample("a5-cr-pins")) {
      const m = nums(p.prompt).at(-1)!;
      expect(2 * Number(p.answer) + 2).toBe(m);
    }
  });
  it("a5-rc-common-prod", () => {
    for (const p of sample("a5-rc-common-prod")) {
      const [x, y, den] = nums(p.expression!);
      expect(Number(p.answer) / den).toBeCloseTo(x / y, 9);
      const [a, b, c, d] = nums(p.prompt);
      expect(den).toBe(b * d);
      expect(a < b && c < d).toBe(true);
    }
  });
  it("a5-rc-reduce-ways", () => {
    for (const p of sample("a5-rc-reduce-ways")) {
      const [d, k] = nums(p.prompt);
      const cnt = Array.from({ length: d - 1 }, (_, i) => i + 1).filter((n) => gcd(n, d) % k === 0).length;
      expect(Number(p.answer)).toBe(cnt);
      expect(d % k).toBe(0);
    }
  });
  it("a5-rc-dec-sum", () => {
    for (const p of sample("a5-rc-dec-sum")) {
      const x = nums(p.prompt)[0];
      const digits = String(x).split(".")[1].length;
      const base = 10 ** digits;
      const n = Math.round(x * base);
      const g0 = gcd(n, base);
      expect(Number(p.answer)).toBe(n / g0 + base / g0);
    }
  });
  it("a5-fa-common-num", () => {
    for (const p of sample("a5-fa-common-num")) {
      const [a, b, c, d] = nums(p.prompt);
      let l = Math.max(b, d);
      while (l % b || l % d) l++;
      expect(Number(p.answer)).toBe((a * l) / b + (c * l) / d);
    }
  });
  it("a5-fa-max-min", () => {
    for (const p of sample("a5-fa-max-min")) {
      const fr = p.prompt.split(" 중에서")[0].split(", ").map(val);
      expect(val(p.answer)).toBeCloseTo(Math.max(...fr) + Math.min(...fr), 9);
      expect(p.answer).toBe(fracText(Math.round(val(p.answer) * 2520), 2520));
    }
  });
  it("a5-fs-overflow", () => {
    for (const p of sample("a5-fs-overflow")) {
      const cap = nums(p.prompt)[0];
      const [have, pour] = [...p.prompt.matchAll(/(\d+ \d+\/\d+) L/g)].map((m) => val(m[1]));
      expect(val(p.answer)).toBeCloseTo(have + pour - cap, 9);
      expect(val(p.answer)).toBeGreaterThan(0);
    }
  });
  it("a5-pa-reg-side", () => {
    const sides: Record<string, number> = { 정삼각형: 3, 정오각형: 5, 정육각형: 6, 정팔각형: 8 };
    for (const p of sample("a5-pa-reg-side")) {
      const n = sides[/정.각형/.exec(p.prompt)![0]];
      expect(Number(p.answer) * n).toBe(nums(p.prompt)[0]);
    }
  });
  it("a5-pa-frame", () => {
    for (const p of sample("a5-pa-frame")) {
      const v = p.visual as { kind: "shape"; texts: { text: string }[] };
      const [W, H, w, h] = v.texts.map((t) => nums(t.text)[0]);
      expect(Number(p.answer)).toBe(W * H - w * h);
      expect(w < W && h < H).toBe(true);
    }
  });
  it("a5-pa-trap-tri", () => {
    for (const p of sample("a5-pa-trap-tri")) {
      const [a, b, h, c] = nums(p.prompt);
      expect((c * Number(p.answer)) / 2).toBe(((a + b) * h) / 2);
    }
  });
  it("a5-rr-pick", () => {
    for (const p of sample("a5-rr-pick")) {
      const [a, b] = nums(p.prompt);
      const ok = p.choices!.filter((c) => Number(c) >= a && Number(c) < b);
      expect(ok).toEqual([p.answer]);
    }
  });
  it("a5-rr-ceil-min", () => {
    for (const p of sample("a5-rr-ceil-min")) {
      const shown = nums(p.prompt)[0];
      const u = p.prompt.includes("백의") ? 100 : 10;
      const up = (x: number) => Math.ceil(x / u) * u;
      const ans = Number(p.answer);
      expect(up(ans)).toBe(shown);
      expect(up(ans - 1)).not.toBe(shown);
    }
  });
  it("a5-rr-elevator", () => {
    for (const p of sample("a5-rr-elevator")) {
      const [W, b, a] = nums(p.prompt);
      const n = Number(p.answer);
      expect(b + n * a).toBeLessThanOrEqual(W);
      expect(b + (n + 1) * a).toBeGreaterThan(W);
    }
  });
  it("a5-fm-num", () => {
    for (const p of sample("a5-fm-num")) {
      const [a, b, n, d] = nums(p.expression!);
      expect(d).toBe(b);
      expect(Number(p.answer)).toBe(a * n);
      expect(a * n).toBeLessThan(b);
      expect(gcd(a * n, b)).toBe(1);
    }
  });
  it("a5-fm-units", () => {
    const R: Record<string, number> = { cm: 100, g: 1000, mL: 1000, 분: 60 };
    for (const p of sample("a5-fm-units")) {
      const [w, a, b] = nums(p.prompt);
      const small = /몇 (\S+)인가요/.exec(p.prompt)![1];
      expect(Number(p.answer)).toBeCloseTo((w * R[small] * a) / b, 9);
      expect(Number.isInteger(Number(p.answer))).toBe(true);
    }
  });
  it("a5-fm-bounce", () => {
    for (const p of sample("a5-fm-bounce")) {
      const [a, b, H] = nums(p.prompt);
      expect(Number(p.answer)).toBeCloseTo(H * (a / b) ** 2, 9);
      expect(Number.isInteger(Number(p.answer))).toBe(true);
      expect(H).toBeLessThanOrEqual(500);
    }
  });
  it("a5-cg-kite-half·area: 그림의 길이 글자로 다시 계산", () => {
    for (const p of sample("a5-cg-kite-half")) {
      const v = p.visual as { kind: "shape"; texts: { text: string }[] };
      const a = nums(v.texts.find((t) => t.text.endsWith("cm"))!.text)[0];
      expect(Number(p.answer)).toBe(2 * a);
    }
    for (const p of sample("a5-cg-kite-area")) {
      const v = p.visual as { kind: "shape"; texts: { text: string }[] };
      const [a, pp, q] = v.texts.filter((t) => t.text.endsWith("cm")).map((t) => nums(t.text)[0]);
      expect(Number(p.answer)).toBe((2 * a * pp) / 2 + (2 * a * q) / 2);
    }
  });
  it("a5-cg-kite-angle: 삼각형 세 각의 합과 대응각으로 구한 각이 그림의 실제 각과 맞다", () => {
    for (const p of sample("a5-cg-kite-angle")) {
      const v = p.visual as { kind: "shape"; polygons: { points: [number, number][] }[]; texts: { text: string }[] };
      const [th, l] = v.texts.filter((x) => x.text.endsWith("°")).map((x) => nums(x.text)[0]);
      expect(Number(p.answer)).toBe(2 * (180 - th - l));
      const [T, L, B, R] = v.polygons[0].points;
      const ang = (o: [number, number], x: [number, number], y: [number, number]) => {
        const u = [x[0] - o[0], x[1] - o[1]];
        const w = [y[0] - o[0], y[1] - o[1]];
        return (Math.acos((u[0] * w[0] + u[1] * w[1]) / Math.hypot(u[0], u[1]) / Math.hypot(w[0], w[1])) * 180) / Math.PI;
      };
      expect(Math.abs(ang(T, L, B) - th)).toBeLessThan(1.5);
      expect(Math.abs(ang(L, T, B) - l)).toBeLessThan(1.5);
      expect(Math.abs(ang(B, L, R) - Number(p.answer))).toBeLessThan(1.5);
    }
  });
  it("a5-dm-oil·floor·walk", () => {
    for (const p of sample("a5-dm-oil")) {
      const [, w, n] = nums(p.prompt);
      expect(Number(p.answer)).toBeCloseTo(w * n, 9);
    }
    for (const p of sample("a5-dm-floor")) {
      const [x, y] = nums(p.expression!);
      expect(Number(p.answer)).toBe(Math.floor(Math.round(x * y * 100) / 100));
      expect(Number.isInteger(Math.round(x * y * 100) / 100)).toBe(false);
    }
    for (const p of sample("a5-dm-walk")) {
      const [s, h, m] = nums(p.prompt);
      expect(Number(p.answer)).toBeCloseTo(s * (h + m / 60), 9);
    }
  });
  it("a5-cb-face-area: 색칠한 면의 두 모서리", () => {
    for (const p of sample("a5-cb-face-area")) {
      const v = p.visual as { kind: "shape"; texts: { text: string }[] };
      const [a, b, c] = v.texts.map((t) => nums(t.text)[0]);
      expect([a * b, a * c, b * c]).toContain(Number(p.answer));
    }
  });
  it("a5-cb-par-max·net-edges", () => {
    for (const p of sample("a5-cb-par-max")) {
      const [a, b, c] = nums(p.prompt);
      expect(Number(p.answer)).toBe(2 * Math.max(a * b, b * c, a * c));
    }
    for (const p of sample("a5-cb-net-edges")) expect(Number(p.answer)).toBe((nums(p.prompt)[0] / 14) * 12);
  });
  it("a5-av-other·leave·rest", () => {
    for (const p of sample("a5-av-other")) {
      const [a, m] = nums(p.prompt);
      expect((a + Number(p.answer)) / 2).toBe(m);
    }
    for (const p of sample("a5-av-leave")) {
      const [n, m, , m2] = nums(p.prompt);
      const x = Number(p.answer);
      expect((n * m - x) / (n - 1)).toBe(m2);
      expect(x).toBeGreaterThanOrEqual(50);
      expect(x).toBeLessThanOrEqual(100);
    }
    for (const p of sample("a5-av-rest")) {
      const [D, m, k, pp] = nums(p.prompt);
      expect(k * pp + (D - k) * Number(p.answer)).toBe(D * m);
    }
  });
});
