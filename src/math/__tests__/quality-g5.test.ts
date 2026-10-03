import { describe, expect, it } from "vitest";
import { units } from "../content";
import { congruentPolys, movableToCongruent } from "../content/lessons/g5-congruence";
import { marksNearOwnDot } from "../content/figure-check";
import type { Generator, Problem, ShapeScene } from "../content/types";
import { createRandom } from "../lib/random";
import { fractionValue } from "../content/generators/grade4";
import { answerSet, choicesUnique, commonIssues, figureOk, figureShare, gradeEntries, hasPicture, hasPlaceholder, oddAngles, sample, saysPicture, shadedValue, visibleText, wrongJosa } from "./quality-checks";

/** 5학년 문항 품질 기준(docs/plan-quality.md 1절, audit/g5.md 중요·보통) */

const entries = gradeEntries(5);
const unique = [...new Map(entries.map((e) => [e.gen.id, e])).values()];

/**
 * 도형·측정·그래프 차시: 그림 문제 생성기가 절반 이상이고, 기본(하)은 모두 그림을 보고 푼다.
 * 다각형의 둘레와 넓이·합동과 대칭·직육면체는 모든 차시, 평균과 가능성은 막대·꺾은선그래프로 평균을 구하는 '평균 알아보기' 차시.
 */
const FIGURE_STANDARDS: Record<string, string[]> = {
  "g5-s1-perimeter-area": ["perimeter", "rect-area", "area-unit", "parallelogram", "triangle", "rhombus-trapezoid"],
  "g5-s2-congruence": ["congruent-shape", "congruent", "congruent-draw", "line-symmetry", "symmetry"],
  "g5-s2-cuboid": ["cuboid-cube", "property", "sketch", "cube-net", "cuboid-net"],
  "g5-s2-average": ["mean"],
};

/** 5의 배수가 아니어도 되는 각: 없음(5학년 도형 문제의 각은 모두 5° 단위로 만든다) */
const ODD_ANGLE_OK = new Set<string>();

describe("5학년 품질 기준", () => {
  it.each(unique.map((e) => [e.gen.id, e.gen] as const))("%s: 조사 자리표시·틀린 조사·5°단위 아닌 각·그림 결함·그림 없는 '그림' 문장이 없다", (id, gen) => {
    for (const [seed, p] of sample(gen, 200).entries()) {
      const where = `${id} seed ${seed}`;
      expect(hasPlaceholder(p), `${where} 조사 자리표시: ${p.prompt}`).toBe(false);
      expect(wrongJosa(p), `${where} 틀린 조사`).toEqual([]);
      expect(visibleText(p), `${where} (으)로 자리표시`).not.toMatch(/\((으|이)\)/);
      if (!ODD_ANGLE_OK.has(id)) expect(oddAngles(p), `${where} 각도`).toEqual([]);
      expect(figureOk(p), `${where} 그림`).toBe(true);
      if (saysPicture(p)) expect(hasPicture(p), `${where} 그림 없음`).toBe(true);
    }
  });

  const scoped = units.filter((u) => u.grade === 5 && FIGURE_STANDARDS[u.id]).flatMap((u) => u.standards.filter((s) => FIGURE_STANDARDS[u.id].includes(s.id)).map((s) => [`${u.id}/${s.id}`, s] as const));

  it("그림 차시 목록의 차시가 모두 있다", () => {
    expect(scoped.length).toBe(Object.values(FIGURE_STANDARDS).flat().length);
  });

  it.each(scoped)("%s: 그림 문제 생성기가 절반 이상이고, 기본(하)은 모두 그림을 보고 푼다", (_, s) => {
    expect(figureShare(s)).toBeGreaterThanOrEqual(0.5);
    for (const g of s.generators.filter((x) => x.level === 1)) {
      expect(sample(g, 20).every(hasPicture), `${g.id} 하 그림`).toBe(true);
    }
  });
});

describe("l5-cgd-wrong: 잘못 찍은 꼭짓점은 하나뿐", () => {
  it("이름표가 붙은 다른 꼭짓점은 어디로 옮겨도 도형 가와 합동이 되지 않는다", () => {
    const gen = entries.find((e) => e.gen.id === "l5-cgd-wrong")!.gen;
    const G = 20;
    for (let seed = 0; seed < 150; seed++) {
      const p = gen.make(createRandom(seed));
      const v = p.visual as ShapeScene;
      const toCell = (q: [number, number]): [number, number] => [q[0] / G - 1, q[1] / G - 1];
      const [A, B] = v.polygons!.map((pg) => pg.points.map(toCell));
      // ①~④ 글자에서 가장 가까운 꼭짓점
      const labeled = v.texts!.filter((t) => /[①-④]/.test(t.text)).map((t) => {
        const d = B.map((q) => Math.hypot(q[0] * G + G - t.at[0], q[1] * G + G - t.at[1]));
        return { mark: t.text, j: d.indexOf(Math.min(...d)) };
      });
      const movable = labeled.filter((l) => movableToCongruent(A, B, l.j)).map((l) => l.mark);
      expect(movable, `seed ${seed}`).toEqual([p.answer]);
    }
  });
});

describe("5학년 그림 검사 뒤에도 정답이 고르게 나온다", () => {
  it("l5-sym-line-angle: 각 ㄱㄴㄷ이 65°~130°까지 나온다(좁은 각도 글자 자리를 찾아 살린다)", () => {
    const got = [...answerSet(unique.find((e) => e.gen.id === "l5-sym-line-angle")!.gen, 1000)].map(Number);
    expect(Math.min(...got)).toBeLessThanOrEqual(65);
    expect(Math.max(...got)).toBeGreaterThanOrEqual(130);
  });
});

describe("5학년 분수·소수 곱셈 그림 유형(R2b)", () => {
  it.each(["l5-ff-area", "l5-dd-grid"])("%s: 그림이 있고 정답이 하나뿐이며, 색칠한 넓이가 정답과 같다", (id) => {
    const gen = unique.find((e) => e.gen.id === id)!.gen;
    for (const [seed, p] of sample(gen).entries()) {
      expect(hasPicture(p), `seed ${seed}`).toBe(true);
      expect(choicesUnique(p), `seed ${seed}: ${p.choices}`).toBe(true);
      expect((p.visual as ShapeScene).width, `seed ${seed}`).toBeLessThanOrEqual(300);
      expect(shadedValue(p), `seed ${seed}: ${p.answer}`).toBeCloseTo(fractionValue(p.answer), 6);
    }
  });
});

describe("5학년 공통 검사(docs/audit-v2 F0)", () => {
  const gens = [...new Map(gradeEntries(5).map((e) => [e.gen.id, e.gen])).values()];
  it.each(gens.map((g) => [g.id, g] as const))("%s: 힌트·풀이·오답 설명·보기·그림 글자까지 조사가 맞고, 숫자 서수(5째)와 값이 같은 보기가 없다", (_id, gen) => {
    expect(commonIssues(gen)).toEqual([]);
  });
});

describe("값이 같은 보기와 보기 범위(F0 리뷰)", () => {
  const find = (id: string) => gradeEntries(5).find((e) => e.gen.id === id)!.gen;
  const irreducible = (c: string) => {
    const m = /^(\d+)\/(\d+)$/.exec(c);
    if (!m) return false;
    const g = (a: number, b: number): number => (b ? g(b, a % b) : a);
    return g(Number(m[1]), Number(m[2])) === 1;
  };

  it("w5-glasses-frac: 정답과 값이 같은 보기 중 기약분수는 정답 하나뿐", () => {
    for (const p of sample(find("w5-glasses-frac"), 400)) {
      const same = p.choices!.filter((c) => Math.abs(fractionValue(c) - fractionValue(p.answer)) < 1e-9);
      expect(same.filter(irreducible), p.choices!.join()).toEqual([p.answer]);
    }
  });

  it("l5-fm-three: 진분수 셋의 곱이므로 보기는 모두 1보다 작고 값이 같은 보기가 없다", () => {
    for (const p of sample(find("l5-fm-three"), 400)) {
      expect(p.choices!.every((c) => fractionValue(c) < 1), p.choices!.join()).toBe(true);
      expect(choicesUnique(p), p.choices!.join()).toBe(true);
    }
  });
});

/* ── docs/audit-v2/g5s1.md·g5s2.md 재검수 결함(F5) ── */

const g5 = [...new Map(gradeEntries(5).map((e) => [e.gen.id, e.gen])).values()];
const gen5 = (id: string) => {
  const g = g5.find((x) => x.id === id);
  if (!g) throw new Error(`${id} 없음`);
  return g;
};
type Pt = [number, number];
const gcdOf = (a: number, b: number): number => (b ? gcdOf(b, a % b) : a);
/** 문제 글·식에 나오는 분수(대분수의 분수 부분 포함) 중 기약분수가 아닌 것 */
const reducibleInPrompt = (p: Problem) =>
  [...`${p.prompt} ${p.expression ?? ""}`.matchAll(/(?<![\d.])(\d+)\/(\d+)(?!\.\d|\d)/g)].filter((m) => gcdOf(Number(m[1]), Number(m[2])) !== 1).map((m) => m[0]);
/** 대분수 "w a/b"를 [자연수, 분자, 분모]로 */
const mixedParts = (t: string) => {
  const m = /^(\d+) (\d+)\/(\d+)$/.exec(t.trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
};
const distinctProblems = (gen: Generator, seeds = 400) => new Set(sample(gen, seeds).map((p) => `${p.prompt}|${p.expression ?? ""}|${JSON.stringify(p.visual ?? "")}`)).size;

/** 약분·크기가 같은 분수를 묻는 차시에서 일부러 기약분수가 아닌 분수를 주는 생성기 */
const REDUCIBLE_PROMPT_OK = new Set(["l5-eq-make", "reduce-fraction", "m5-reduce-by"]);
/** 학생의 틀린 풀이를 보여 주는 문제: 틀린 답("= 6/4") 앞의 식만 검사한다 */
const WRONG_WORK_SHOWN = new Set(["l5-fs-error"]);

describe("5학년 분수 표기(audit-v2 g5s1·g5s2 반복 결함)", () => {
  it.each(g5.map((g) => [g.id, g] as const))("%s: 대분수 보기의 분수 부분은 진분수, 문제 글의 분수는 기약분수, 분자가 소수인 분수와 순서쌍 표기가 없다", (id, gen) => {
    for (const [seed, p] of sample(gen, 300).entries()) {
      const where = `${id} seed ${seed}`;
      expect((p.choices ?? []).filter((c) => mixedParts(c) && mixedParts(c)![1] >= mixedParts(c)![2]), `${where} 가분수 꼴 대분수 보기`).toEqual([]);
      const shown = WRONG_WORK_SHOWN.has(id) ? { ...p, prompt: p.prompt.split(" = ")[0] } : p;
      if (!REDUCIBLE_PROMPT_OK.has(id)) expect(reducibleInPrompt(shown), `${where} ${p.prompt} ${p.expression ?? ""}`).toEqual([]);
      expect(visibleText(p), `${where} 분자가 소수인 분수`).not.toMatch(/\d+\.\d+\/\d+/);
      expect(p.prompt, `${where} 순서쌍`).not.toMatch(/\(\d+, \d+\)/);
    }
  });
});

describe("5-1 재검수 결함(audit-v2 g5s1)", () => {
  it("unlike-add-mixed: 받아올림하지 않은 표기(3 51/40)·약분하지 않은 표기 등 정답과 값이 같은 보기가 없다", () => {
    for (const p of sample(gen5("unlike-add-mixed"), 1000)) expect(choicesUnique(p), `${p.expression}: ${p.choices}`).toBe(true);
  });

  it("unlike-sub-mixed: 두 대분수의 자연수 부분이 다르고, 받아내림하는 문제가 절반 이상이다", () => {
    const ps = sample(gen5("unlike-sub-mixed"), 600);
    let borrow = 0;
    for (const p of ps) {
      const [a, b] = p.expression!.split(" − ").map((t) => mixedParts(t)!);
      expect(a[0], p.expression).not.toBe(b[0]);
      if (a[1] / a[2] < b[1] / b[2]) borrow++;
    }
    expect(borrow / ps.length).toBeGreaterThanOrEqual(0.5);
  });

  it("w5-juice-mix: 마신 양은 분모가 12 이하인 분수다(1/42 L 같은 양이 나오지 않는다)", () => {
    for (const p of sample(gen5("w5-juice-mix"), 400)) {
      const drink = /섞은 뒤 (\d+(?: \d+)?\/(\d+)) L/.exec(p.prompt)!;
      expect(Number(drink[2]), p.prompt).toBeLessThanOrEqual(12);
    }
  });

  it("w5-tape-mixed: 1학기 풀이에 (대분수)×(자연수)를 쓰지 않는다", () => {
    for (const p of sample(gen5("w5-tape-mixed"), 300)) expect(p.explanation, p.explanation).not.toMatch(/×/);
  });

  it("l5-fd-box: 답이 한쪽으로 쏠리지 않는다(답 하나가 35% 이하, 답 5종류 이상)", () => {
    const ans = sample(gen5("l5-fd-box"), 600).map((p) => p.answer);
    const most = Math.max(...[...new Set(ans)].map((a) => ans.filter((x) => x === a).length));
    expect(most / ans.length).toBeLessThanOrEqual(0.35);
    expect(new Set(ans).size).toBeGreaterThanOrEqual(5);
  });

  it("reduce-fraction: 분자와 분모가 같은 보기(6/6)가 없고, 정답과 값이 같은 보기 중 기약분수는 정답 하나뿐", () => {
    for (const p of sample(gen5("reduce-fraction"), 600)) {
      const fr = p.choices!.map((c) => c.split("/").map(Number));
      expect(fr.some(([n, d]) => n === d), p.choices!.join()).toBe(false);
      const same = fr.filter(([n, d]) => Math.abs(n / d - fractionValue(p.answer)) < 1e-9);
      expect(same.filter(([n, d]) => gcdOf(n, d) === 1).map(([n, d]) => `${n}/${d}`), p.choices!.join()).toEqual([p.answer]);
      // 정답과 같은 값(덜 약분한 분수)은 허용하지만, 정답이 아닌 보기끼리는 값이 모두 달라야 한다
      const others = fr.filter(([n, d]) => Math.abs(n / d - fractionValue(p.answer)) > 1e-9).map(([n, d]) => (n / d).toFixed(9));
      expect(new Set(others).size, p.choices!.join()).toBe(others.length);
    }
  });

  it("w5-rule-const: 대응 관계를 표로 보여 준다", () => {
    for (const p of sample(gen5("w5-rule-const"), 100)) expect(p.visual?.kind).toBe("table");
  });
});

describe("5-2 재검수 결함(audit-v2 g5s2)", () => {
  it.each(["l5-cgd-vertex", "l5-cgd-turn"])("%s: 번호 글자마다 가장 가까운 후보 점이 하나로 정해지고, 정답 ①~④가 모두 나온다", (id) => {
    for (const [seed, p] of sample(gen5(id), 400).entries()) expect(marksNearOwnDot(p.visual as ShapeScene), `seed ${seed}`).toBe(true);
    expect(answerSet(gen5(id), 400)).toEqual(new Set(["①", "②", "③", "④"]));
  });

  it.each(["l5-cgd-vertex", "l5-cgd-turn"])("%s: 점·꼭짓점이 모두 그림 안쪽(테두리에서 점 반지름 이상)에 있고, 후보 점이 그려 둔 변 위에 놓이지 않는다", (id) => {
    const R = 4;
    const onSeg = ([x, y]: Pt, [a, b]: [Pt, Pt]) =>
      Math.abs((b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0])) < 1e-6 && x >= Math.min(a[0], b[0]) && x <= Math.max(a[0], b[0]) && y >= Math.min(a[1], b[1]) && y <= Math.max(a[1], b[1]);
    for (const [seed, p] of sample(gen5(id), 1000).entries()) {
      const v = p.visual as ShapeScene;
      for (const [x, y] of [...v.dots!, ...v.polygons!.flatMap((g) => g.points), ...v.lines!.flatMap((l) => [l.from, l.to])]) {
        expect(x > R && x < v.width - R && y > R && y < v.height - R, `seed ${seed} (${x}, ${y}) in ${v.width}x${v.height}`).toBe(true);
      }
      for (const d of v.dots!) expect(v.lines!.some((l) => onSeg(d, [l.from, l.to])), `seed ${seed} 변 위 후보 (${d})`).toBe(false);
    }
  });

  /** 길이 글자("9 cm")마다 가장 가까운 변의 그린 길이 */
  const labeledLengths = (v: ShapeScene) => {
    const poly = v.polygons![0].points;
    const segDist = (q: Pt, a: Pt, b: Pt) => {
      const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
      const t = Math.max(0, Math.min(1, ((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / (dx * dx + dy * dy)));
      return Math.hypot(q[0] - a[0] - t * dx, q[1] - a[1] - t * dy);
    };
    const edges = poly.map((a, i): [Pt, Pt] => [a, poly[(i + 1) % poly.length]]);
    return v.texts!.filter((t) => /^\d+ cm$/.test(t.text)).map((t) => {
      const [a, b] = edges.reduce((best, e) => (segDist(t.at, ...e) < segDist(t.at, ...best) ? e : best));
      return { cm: parseInt(t.text), px: Math.hypot(a[0] - b[0], a[1] - b[1]) };
    });
  };

  it.each(["l5-sym-line-side", "l5-sym-point-angle"])("%s: 두 길이 글자의 크기 순서가 그린 길이 순서와 같고 비율 차가 1.3배 이내다", (id) => {
    let pairs = 0;
    for (const [seed, p] of sample(gen5(id), 400).entries()) {
      const ls = labeledLengths(p.visual as ShapeScene);
      if (ls.length < 2) continue;
      pairs++;
      const [a, b] = ls;
      expect(Math.sign(a.cm - b.cm), `seed ${seed}`).toBe(Math.sign(a.px - b.px));
      const r = a.cm / b.cm / (a.px / b.px);
      expect(r, `seed ${seed}`).toBeLessThanOrEqual(1.3);
      expect(r, `seed ${seed}`).toBeGreaterThanOrEqual(1 / 1.3);
    }
    expect(pairs).toBeGreaterThan(50);
  });

  it("l5-cgd-count: 그림 테두리 위 격자점은 후보가 되지 않고, 꼭짓점 순서로 읽히는 '삼각형 ㄱㄴㄹ'을 쓰지 않는다", () => {
    const G = 20;
    for (const [seed, p] of sample(gen5("l5-cgd-count"), 300).entries()) {
      const v = p.visual as ShapeScene;
      expect(p.prompt).not.toMatch(/ㄱㄴㄹ/);
      const [A, B, C] = v.polygons![0].points.map(([x, y]): Pt => [x / G - 1, y / G - 1]);
      const [cols, rows] = [v.width / G - 2, v.height / G - 2];
      for (let x = -1; x <= cols + 1; x++) {
        for (let y = -1; y <= rows + 1; y++) {
          const frame = x === -1 || y === -1 || x === cols + 1 || y === rows + 1;
          if (frame && !(x === C[0] && y === C[1])) expect(congruentPolys([A, B, C], [A, B, [x, y]]), `seed ${seed} (${x}, ${y})`).toBe(false);
        }
      }
    }
    expect(answerSet(gen5("l5-cgd-count"), 400)).toEqual(new Set(["1", "3"]));
  });

  it("frac-times-frac: 답의 분모가 36 이하다", () => {
    for (const p of sample(gen5("frac-times-frac"), 400)) expect(Number(p.answer.split("/")[1] ?? 1), p.expression).toBeLessThanOrEqual(36);
  });

  it("l5-fm-area: 넓이의 분모가 25 이하다(2 17/32 m² 같은 값이 나오지 않는다)", () => {
    for (const p of sample(gen5("l5-fm-area"), 400)) expect(Number(p.answer.split("/")[1] ?? 1), p.prompt).toBeLessThanOrEqual(25);
  });

  it("w5-steel-weight: 길이가 소수 한 자리 수라 (소수) × (소수)가 된다", () => {
    for (const p of sample(gen5("w5-steel-weight"), 400)) {
      const [, len, cut] = /철근 (\S+) m 중에서 (\S+) m/.exec(p.prompt)!;
      expect(len, p.prompt).toMatch(/\.\d$/);
      expect(cut, p.prompt).toMatch(/\.\d$/);
      expect(/= (\S+)\(m\)/.exec(p.explanation)![1], p.explanation).toMatch(/\.\d$/);
    }
  });
});

describe("'상' 문장제는 두 단계 이상(audit-v2 g5s1·g5s2, 체크리스트 5장)", () => {
  /** 생성기마다 풀이의 두 단계(첫 단계 → 둘째 단계) */
  const TWO_STEPS: [string, RegExp][] = [
    ["w5-glasses-frac", /^\d+ [+−] \d+ = \d+\(명\)(, \d+ \+ \d+ = \d+\(명\))? → \d+\/\d+ = /],
    ["w5-sugar-people", /^남은 물병 \d+ − \d+ = \d+\(개\), \d+\/\d+ × \d+ = /],
    ["w5-range-list", /^탈 수 있는 학생: .+ → \d+명, 탈 수 없는 학생: 8 − \d+ = \d+\(명\)$/],
    ["w5-buses-needed", /(\d+ ÷ \d+ = \d+ … \d+ → 상자|버림하여 \d+, \d+상자) .*\d+ × \d+ = \d+\(원\)$/],
    ["w5-steel-weight", /^\S+ − \S+ = \S+\(m\), \S+ × \S+ = \S+\(kg\)$/],
  ];
  it.each(TWO_STEPS)("%s: '상'이고 풀이가 두 단계다", (id, re) => {
    expect(gen5(id).level).toBe(3);
    for (const p of sample(gen5(id), 300)) expect(p.explanation).toMatch(re);
  });

  it("w5-shopping-change: 덧셈·뺄셈·곱셈·나눗셈이 모두 들어간 하나의 식이다", () => {
    expect(gen5("w5-shopping-change").level).toBe(3);
    for (const p of sample(gen5("w5-shopping-change"), 300)) {
      const expr = p.explanation.split(" = ")[0];
      for (const op of ["+", "−", "×", "÷"]) expect(expr, p.explanation).toContain(op);
    }
  });
});

describe("재검수 수정 뒤에도 문제 수·정답 종류가 줄지 않는다(다시 뽑기 가드)", () => {
  // [생성기, 서로 다른 문제 수 하한, 정답 종류 하한] — 시드 400개 기준. 수정 직후 값의 약 80%
  const FLOOR: [string, number, number][] = [
    ["unlike-add-mixed", 300, 260],
    ["unlike-sub-mixed", 290, 190],
    ["m5-three-terms", 170, 50],
    ["w5-juice-mix", 250, 95],
    ["w5-tape-mixed", 130, 110],
    ["l5-fd-box", 58, 6],
    ["reduce-fraction", 130, 35],
    ["w5-glasses-frac", 150, 60],
    ["w5-shopping-change", 260, 20],
    ["l5-cgd-count", 280, 2],
    ["l5-sym-line-side", 300, 12],
    ["l5-sym-point-angle", 275, 18],
    ["frac-times-frac", 220, 115],
    ["l5-fm-area", 55, 48],
    ["m5-whole-times-frac", 94, 19],
    ["w5-sugar-people", 200, 36],
    ["w5-range-list", 320, 6],
    ["w5-buses-needed", 300, 105],
    ["w5-steel-weight", 310, 210],
    ["l5-ff-area", 60, 26],
    ["frac-times-whole", 170, 95],
    ["l5-cmp-unit", 165, 2],
    ["l5-fs-error", 210, 100],
  ];
  it.each(FLOOR)("%s: 서로 다른 문제 %i개 이상, 정답 %i종류 이상", (id, problems, answers) => {
    expect(distinctProblems(gen5(id))).toBeGreaterThanOrEqual(problems);
    expect(answerSet(gen5(id), 400).size).toBeGreaterThanOrEqual(answers);
  });
});
