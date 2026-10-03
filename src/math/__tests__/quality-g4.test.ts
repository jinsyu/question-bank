import { describe, expect, it } from "vitest";
import { units } from "../content";
import type { LongDivision, Problem, ShapeScene, Visual } from "../content/types";
import { fractionValue } from "../content/generators/grade4";
import { createRandom } from "../lib/random";
import { ESTIMATE_OK, EXACT_ONLY } from "../content/lessons/g4-calc";
import { answerRange, answerSet, barValues, choicesUnique, commonIssues, figureOk, figureShare, gradeEntries, hasPicture, hasPlaceholder, longDivProblemError, numberLineValue, oddAngles, sample, saysPicture, screenText, shadedValue, wrongJosa } from "./quality-checks";

/** 4학년 문항 품질 기준(docs/plan-quality.md Q4) */
const ENTRIES = gradeEntries(4);

/**
 * 5의 배수가 아니어도 되는 각도: 정다각형의 한 각은 도형이 정하므로 바꿀 수 없다.
 * 정오각형의 한 각 108°(4-2 다각형 l4-regular-angle)
 */
const ALLOWED_ODD: Record<string, number[]> = { "l4-regular-angle": [108] };

/** 도형·측정·그래프 단원: 차시마다 그림 문제 생성기가 절반 이상 */
const FIGURE_UNITS = ["g4-s1-angles", "g4-s1-moving", "g4-s1-bar-graph", "g4-s2-triangles", "g4-s2-quadrilaterals", "g4-s2-line-graph", "g4-s2-polygons"];

const cases = ENTRIES.map((e) => [`${e.unit.id}/${e.standard.id}/${e.gen.id}`, e] as const);

describe("4학년 전 생성기 품질", () => {
  it("생성기가 있다", () => {
    expect(ENTRIES.length).toBeGreaterThan(200);
  });

  it.each(cases)("%s", (_, { gen }) => {
    for (const [seed, p] of sample(gen, 200).entries()) {
      const msg = `${gen.id} seed ${seed}: ${p.prompt}`;
      expect(hasPlaceholder(p), `조사 자리표시 — ${msg}`).toBe(false);
      const odd = oddAngles(p).filter((d) => !(ALLOWED_ODD[gen.id] ?? []).includes(d));
      expect(odd, `5의 배수가 아닌 각도 — ${msg}`).toEqual([]);
      expect(figureOk(p), `그림 밖·글자 겹침 — ${msg}`).toBe(true);
      if (saysPicture(p)) expect(hasPicture(p), `그림이 없음 — ${msg}`).toBe(true);
    }
  });
});

describe("4학년 도형·측정·그래프 단원: 그림 문제가 차시의 절반 이상", () => {
  const standards = units.filter((u) => FIGURE_UNITS.includes(u.id)).flatMap((u) => u.standards.map((s) => [`${u.id}/${s.id}`, s] as const));

  it("대상 단원이 모두 있다", () => {
    expect(new Set(units.filter((u) => FIGURE_UNITS.includes(u.id)).map((u) => u.id)).size).toBe(FIGURE_UNITS.length);
  });

  it.each(standards)("%s", (_, s) => {
    expect(figureShare(s)).toBeGreaterThanOrEqual(0.5);
    // 기본(하) 문제 중 적어도 하나는 그림을 보고 푼다
    expect(s.generators.filter((g) => g.level === 1).some((g) => sample(g, 20).some(hasPicture)), `${s.id} 기본 그림 문제`).toBe(true);
  });
});

describe("삼각형 두 기준 분류: 맞는 보기는 정답 하나뿐", () => {
  /** 세 각으로 두 기준 이름이 맞는지(정삼각형은 이등변삼각형이기도 하다) */
  const fits = (name: string, angles: number[]) => {
    const [side, kind] = name.split("이면서 ");
    const big = Math.max(...angles);
    const kindOk = kind === (big > 90 ? "둔각삼각형" : big === 90 ? "직각삼각형" : "예각삼각형");
    const same = new Set(angles).size;
    const sideOk = side === "정삼각형" ? same === 1 : side === "이등변삼각형" ? same <= 2 : same === 3;
    return kindOk && sideOk;
  };

  it("l4-tri-both-angles", () => {
    const gen = ENTRIES.find((e) => e.gen.id === "l4-tri-both-angles")!.gen;
    for (const [seed, p] of sample(gen, 400).entries()) {
      const shown = (p.visual as ShapeScene).texts!.find((t) => t.text.endsWith("°"))!.text;
      const base = Number(shown.slice(0, -1));
      const angles = [180 - 2 * base, base, base];
      expect(p.choices!.filter((c) => fits(c, angles)), `seed ${seed}: ${angles}`).toEqual([p.answer]);
    }
  });
});

/**
 * 휴대폰 폭: 360px 화면에서 문제 그림 칸은 약 257px(실측). 글자 14(그림 좌표)가 12px 이상으로 보이려면
 * 그림 폭이 257 × 14 / 12 ≈ 300 이하여야 한다.
 */
describe("4학년 그림 휴대폰 폭", () => {
  it.each(["l4-tri-both-table", "l4-tri-kind-count"])("%s: 그림 폭 300 이하(360px 화면에서 글자 12px 이상)", (id) => {
    const gen = ENTRIES.find((e) => e.gen.id === id)!.gen;
    for (const [seed, p] of sample(gen, 100).entries()) expect((p.visual as ShapeScene).width, `seed ${seed}`).toBeLessThanOrEqual(300);
  });
});

/** 그림 검사에 걸린 그림을 버리지 않고 글자를 옮겨 살렸는지: 정답 분류·값이 빠짐없이 나온다 */
describe("4학년 그림 검사 뒤에도 정답이 고르게 나온다", () => {
  const gen = (id: string) => ENTRIES.find((e) => e.gen.id === id)!.gen;
  it("l4-tri-both-name: 변의 길이 2가지 × 각의 크기 3가지, 6가지 분류가 모두 나온다", () => {
    expect(answerSet(gen("l4-tri-both-name")).size).toBe(6);
  });
  it("l4-perp-angle: ㉠은 25°~65°(나머지)와 115°~155°(둔각) 모두", () => {
    expect([...answerSet(gen("l4-perp-angle"))].sort()).toEqual([...answerRange(25, 65), ...answerRange(115, 155)].sort());
  });
  it("l4-perp-two-rays: ㉠은 50°~130° 모두", () => {
    expect([...answerSet(gen("l4-perp-two-rays"))].sort()).toEqual(answerRange(50, 130).sort());
  });
  it("l4-angle-read: 10°~170°(20° 간격) 모두", () => {
    expect([...answerSet(gen("l4-angle-read"))].sort()).toEqual(answerRange(10, 170, 20).sort());
  });
  it("l4-para-exterior: ㉠은 둔각·예각 모두(120°~130° 포함)", () => {
    const got = answerSet(gen("l4-para-exterior"));
    for (const v of ["120", "125", "130", "60", "70"]) expect(got.has(v), v).toBe(true);
  });
  it("l4-rhombus-iso: 밑각 30°(각 ㄴ 120°)까지 모든 정답", () => {
    expect([...answerSet(gen("l4-rhombus-iso"))].sort()).toEqual(["30", "35", "40", "50", "55", "60", "65", "70", "80", "100", "110", "120"].sort());
  });
});

/** 두 계열 그래프(docs/plan-followup.md R2a): 표 대신 한 그래프에 두 계열을 그려 비교한다 */
describe("4학년 두 계열 그래프", () => {
  const gen = (id: string) => ENTRIES.find((e) => e.gen.id === id)!.gen;

  it("l4-bar-two-class: 두 반 막대그래프, 합이 가장 큰 항목이 정답", () => {
    for (const [seed, p] of sample(gen("l4-bar-two-class"), 200).entries()) {
      const v = p.visual as Extract<Visual, { kind: "bars" }>;
      expect(v.kind, `seed ${seed}`).toBe("bars");
      expect(v.second?.names).toEqual(["1반", "2반"]);
      expect(v.second!.values).toHaveLength(v.labels.length);
      const sums = v.values.map((x, i) => x + v.second!.values[i]);
      expect(v.labels[sums.indexOf(Math.max(...sums))], `seed ${seed}`).toBe(p.answer);
    }
  });

  it("l4-line-two-series: 두 싹의 키는 늘기만 하고, 같은 날 두 점이 겹치지 않으며, 차가 가장 큰 날이 정답", () => {
    for (const [seed, p] of sample(gen("l4-line-two-series"), 200).entries()) {
      const v = p.visual as Extract<Visual, { kind: "line" }>;
      expect(v.kind, `seed ${seed}`).toBe("line");
      const [a, b] = [v.values, v.second!.values];
      for (const s of [a, b]) for (let i = 1; i < s.length; i++) expect(s[i], `seed ${seed}`).toBeGreaterThan(s[i - 1]);
      expect(a.every((x, i) => x !== b[i]), `seed ${seed}`).toBe(true);
      expect(Math.max(...a, ...b) / v.step, `seed ${seed} 눈금 칸 수`).toBeLessThanOrEqual(12);
      const diffs = a.map((x, i) => Math.abs(x - b[i]));
      expect(v.labels[diffs.indexOf(Math.max(...diffs))], `seed ${seed}`).toBe(p.answer);
    }
  });
});

describe("4학년 분수·소수 그림 유형(R2b)", () => {
  const ids = ["l4-fbar-add", "l4-fline-add", "l4-fbar-sub", "l4-fbar-whole-sub", "l4-grid-dec", "l4-dec-line-hund", "l4-dec-line-thou", "l4-grid-cmp", "l4-dec-line-add", "l4-dec-line-sub"];
  const find = (id: string) => ENTRIES.find((e) => e.gen.id === id)!.gen;

  it.each(ids)("%s: 그림이 있고 정답이 하나뿐이며 조사가 맞고 폭 300 이하", (id) => {
    for (const [seed, p] of sample(find(id)).entries()) {
      expect(hasPicture(p), `seed ${seed}`).toBe(true);
      expect(choicesUnique(p), `seed ${seed}: ${p.choices}`).toBe(true);
      expect(wrongJosa(p), `seed ${seed}`).toEqual([]);
      expect((p.visual as ShapeScene).width, `seed ${seed}`).toBeLessThanOrEqual(300);
    }
  });

  it.each(["l4-dec-line-hund", "l4-dec-line-thou", "l4-dec-line-add", "l4-dec-line-sub"])("%s: 화살표가 가리키는 눈금이 정답과 같다", (id) => {
    for (const [seed, p] of sample(find(id)).entries()) expect(numberLineValue(p), `seed ${seed}: ${p.answer}`).toBeCloseTo(Number(p.answer), 4);
  });

  it("l4-fline-add: 화살표 끝이 정답 덧셈식의 합과 같다", () => {
    for (const [seed, p] of sample(find("l4-fline-add")).entries()) {
      const sum = p.answer.split(" + ").reduce((s, t) => s + fractionValue(t), 0);
      expect(numberLineValue(p), `seed ${seed}: ${p.answer}`).toBeCloseTo(sum, 3);
    }
  });

  it("l4-grid-dec: 색칠한 모눈 넓이가 정답과 같다", () => {
    for (const [seed, p] of sample(find("l4-grid-dec")).entries()) expect(shadedValue(p), `seed ${seed}: ${p.answer}`).toBeCloseTo(Number(p.answer), 6);
  });

  it("l4-fline-add: 진분수 덧셈 차시이므로 분모가 4 이상이면 보기의 분수가 모두 진분수", () => {
    for (const [seed, p] of sample(find("l4-fline-add")).entries()) {
      const fracs = p.choices!.flatMap((c) => c.split(" + ")).map((t) => t.split("/").map(Number));
      if (fracs[0][1] >= 4) expect(fracs.every(([n, d]) => n < d), `seed ${seed}: ${p.choices}`).toBe(true);
    }
  });

  it("l4-grid-cmp: 모눈마다 색칠한 양이 식의 수와 같고, 비교 기호가 정답", () => {
    for (const [seed, p] of sample(find("l4-grid-cmp")).entries()) {
      const vals = barValues(p).map((b) => b.shaded);
      const nums = p.expression!.split(" ○ ").map(fractionValue);
      expect(vals, `seed ${seed}`).toHaveLength(2);
      vals.forEach((v, i) => expect(v, `seed ${seed}: ${p.expression}`).toBeCloseTo(nums[i], 6));
      const cmp = Math.abs(vals[0] - vals[1]) < 1e-6 ? "=" : vals[0] > vals[1] ? ">" : "<";
      expect(cmp, `seed ${seed}: ${p.expression}`).toBe(p.answer);
    }
  });

  it("l4-fbar-add: 막대마다 색칠한 양이 식의 두 수와 같고, 합이 정답", () => {
    for (const [seed, p] of sample(find("l4-fbar-add")).entries()) {
      const bars = barValues(p);
      const nums = p.expression!.split(" + ").map(fractionValue);
      expect(bars.map((b) => b.crossed), `seed ${seed}`).toEqual([0, 0]);
      bars.forEach((b, i) => expect(b.shaded, `seed ${seed}: ${p.expression}`).toBeCloseTo(nums[i], 3));
      expect(bars[0].shaded + bars[1].shaded, `seed ${seed}: ${p.answer}`).toBeCloseTo(fractionValue(p.answer), 3);
    }
  });

  it.each(["l4-fbar-sub", "l4-fbar-whole-sub"])("%s: 색칠한 양과 ×표 한 양이 식의 두 수와 같고, 남는 양이 정답", (id) => {
    for (const [seed, p] of sample(find(id)).entries()) {
      const bars = barValues(p);
      const [from, take] = p.expression!.split(" − ").map(fractionValue);
      const shaded = bars.reduce((s, b) => s + b.shaded, 0);
      const crossed = bars.reduce((s, b) => s + b.crossed, 0);
      expect(shaded, `seed ${seed}: ${p.expression}`).toBeCloseTo(from, 3);
      expect(crossed, `seed ${seed}: ${p.expression}`).toBeCloseTo(take, 3);
      expect(shaded - crossed, `seed ${seed}: ${p.answer}`).toBeCloseTo(fractionValue(p.answer), 3);
    }
  });
});

/** 4-1 (세 자리 수)÷(두 자리 수) 세로셈 빈칸 채우기(R2c) */
describe("4학년 나눗셈 세로셈 빈칸", () => {
  const CASES = [
    // [생성기, 차시, 몫의 자리 수, 빈칸 수]
    ["l4-longdiv-one", "div-3d-one", 1, 1],
    ["l4-longdiv-two", "div-3d-two", 2, 2],
  ] as const;
  it.each(CASES)("%s: %s 차시, 보이는 수가 계산 과정과 같고 빈칸 값이 정답", (id, std, qDigits, blanks) => {
    const e = ENTRIES.find((x) => x.gen.id === id);
    expect(e?.standard.id).toBe(std);
    const keys = new Set<string>(); // 서로 다른 문제
    for (const [seed, p] of sample(e!.gen).entries()) {
      expect(longDivProblemError(p), `seed ${seed}: ${JSON.stringify(p.visual)}`).toBeNull();
      const v = p.visual as LongDivision;
      const [a, b] = [Number(v.dividend), Number(v.divisor)];
      expect(a).toBeGreaterThanOrEqual(100);
      expect(a).toBeLessThanOrEqual(999);
      expect(String(b).length).toBe(2);
      expect(String(Math.floor(a / b)).length).toBe(qDigits);
      expect(p.answer.split(",").length).toBe(blanks);
      keys.add(p.key);
    }
    expect(keys.size).toBeGreaterThan(30);
  });

  it("차시 규칙(유형 5개 이상, 하1·중2·상2 이상)을 지킨다", () => {
    for (const std of ["div-3d-one", "div-3d-two"]) {
      const gens = ENTRIES.filter((x) => x.standard.id === std).map((x) => x.gen);
      expect(gens.length).toBeGreaterThanOrEqual(5);
      expect(gens.filter((g) => g.level === 1).length).toBeGreaterThanOrEqual(1);
      expect(gens.filter((g) => g.level === 2).length).toBeGreaterThanOrEqual(2);
      expect(gens.filter((g) => g.level === 3).length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("문제가 후보를 정해 준 객관식", () => {
  it("l4-bar-scale-choose: 보기가 문제의 후보(1·2·5·10명)뿐이다(객관식 변형이 후보 밖 수를 만들지 않음)", () => {
    const gen = ENTRIES.find((e) => e.gen.id === "l4-bar-scale-choose")!.gen;
    for (const [seed, p] of sample(gen, 300).entries()) {
      expect(p.input, `seed ${seed}`).toBe("choice");
      expect([...(p.choices ?? [])].sort(), `seed ${seed}`).toEqual(["10명", "1명", "2명", "5명"]);
    }
  });
});

describe("4학년 공통 검사(docs/audit-v2 F0)", () => {
  const gens = [...new Map(gradeEntries(4).map((e) => [e.gen.id, e.gen])).values()];
  it.each(gens.map((g) => [g.id, g] as const))("%s: 힌트·풀이·오답 설명·보기·그림 글자까지 조사가 맞고, 숫자 서수(5째)와 값이 같은 보기가 없다", (_id, gen) => {
    expect(commonIssues(gen)).toEqual([]);
  });
});

/* ── docs/audit-v2 F4: 4학년 재검수(g4s1.md, g4s2.md) 치명·수정 필요 회귀 테스트 ── */

const genOf = (id: string) => ENTRIES.find((e) => e.gen.id === id)!.gen;
const stdOf = (id: string) => ENTRIES.find((e) => e.gen.id === id)!.standard.id;
const distinct = (id: string, seeds = 600) => new Set(sample(genOf(id), seeds).map((p) => p.key)).size;
const nums = (s: string) => [...s.matchAll(/\d+/g)].map((m) => Number(m[0]));

describe("F4 4-1 치명·수정 필요", () => {
  /** 말로 된 회전 보기의 실제 회전량(시계 방향 기준, 0~359). 뒤집기는 회전이 아니다(null) */
  const turn = (t: string): number | null => {
    if (t.includes("처음 도형과 같")) return 0;
    const m = t.match(/시계 (반대 )?방향으로 (\d+)°/);
    if (!m) return null;
    return ((m[1] ? -1 : 1) * Number(m[2]) + 720) % 360;
  };

  it("l4-rotate-equiv: 돌린 양이 문제와 같은 보기는 정답 하나뿐(360°는 어느 방향이든 처음 도형)", () => {
    for (const [seed, p] of sample(genOf("l4-rotate-equiv"), 400).entries()) {
      const want = turn(p.prompt);
      expect(want, `seed ${seed}`).not.toBeNull();
      expect(p.choices!.filter((c) => turn(c) === want), `seed ${seed}: ${p.prompt} ${p.choices}`).toEqual([p.answer]);
    }
    expect(answerSet(genOf("l4-rotate-equiv")).size).toBe(7);
  });

  it("l4-jo-years: 큰 수 나눗셈 없이 뛰어 세기(답 12 이하), 정답이 맞다", () => {
    for (const [seed, p] of sample(genOf("l4-jo-years"), 300).entries()) {
      const [per, jo] = nums(p.prompt);
      expect(Number(p.answer), `seed ${seed}`).toBe((jo * 10000) / per);
      expect(Number(p.answer)).toBeLessThanOrEqual(12);
      expect(`${p.hint} ${p.explanation}`, `seed ${seed}`).not.toMatch(/÷|10000억을 몇 번/);
    }
    expect(answerSet(genOf("l4-jo-years")).size).toBeGreaterThanOrEqual(7);
  });

  it("w4-quad-right(상): 두 단계(빼고 둘로 나누기), 직각이 아닌 각과 답은 90°에서 15° 이상", () => {
    for (const [seed, p] of sample(genOf("w4-quad-right"), 400).entries()) {
      const given = [...p.prompt.matchAll(/(\d+)°/g)].map((m) => Number(m[1]));
      const known = p.prompt.includes("직각") ? [90, ...given] : given;
      expect(known, `seed ${seed}`).toHaveLength(2);
      expect(Number(p.answer) * 2 + known[0] + known[1], `seed ${seed}`).toBe(360);
      for (const x of [...given, Number(p.answer)]) expect(Math.abs(x - 90), `seed ${seed}: ${p.prompt}`).toBeGreaterThanOrEqual(15);
      expect(p.explanation, `seed ${seed}`).toMatch(/÷ 2 =/);
    }
    expect(distinct("w4-quad-right")).toBeGreaterThanOrEqual(50);
    expect(answerSet(genOf("w4-quad-right")).size).toBeGreaterThanOrEqual(15);
  });

  it.each(["l4-mul3x2-easy", "mul-3x2"])("%s: 곱하는 수가 몇십이어도 힌트·풀이에 '× 0' 단계가 없다", (id) => {
    let tens = 0;
    for (const [seed, p] of sample(genOf(id), 400).entries()) {
      expect(`${p.hint} ${p.explanation}`, `seed ${seed}`).not.toMatch(/× 0(?!\d)|^0 \+/);
      if (p.hint.includes("0을 하나 붙여요")) tens++;
    }
    expect(tens, "몇십을 곱하는 문제도 나온다").toBeGreaterThan(0);
    expect(distinct(id)).toBeGreaterThanOrEqual(500);
  });

  it("move-slide: 그림 위치(보기는 처음 도형 아래 줄)와 어긋나는 방향을 문제에 쓰지 않는다", () => {
    for (const [seed, p] of sample(genOf("move-slide"), 100).entries()) expect(p.prompt, `seed ${seed}`).not.toMatch(/(오른|왼|위|아래)쪽으로 밀/);
    expect(answerSet(genOf("move-slide")).size).toBe(4);
  });

  it.each(["bar-read", "bar-second", "bar-max", "bar-diff"])("%s: 반별 안경 쓴 학생 수는 한 반 인원에 맞는 값(14명 이하)", (id) => {
    let glasses = 0;
    for (const [seed, p] of sample(genOf(id), 400).entries()) {
      const v = p.visual as Extract<Visual, { kind: "bars" }>;
      if (!v.title.startsWith("반별")) continue;
      glasses++;
      expect(Math.max(...v.values), `seed ${seed}: ${v.values}`).toBeLessThanOrEqual(14);
    }
    expect(glasses).toBeGreaterThan(0);
    expect(answerSet(genOf(id)).size).toBeGreaterThanOrEqual(20);
  });

  it("w4-bar-times: 가장 적은 항목의 이름을 문제 글이 알려 주지 않고, 정답이 그래프와 맞다", () => {
    for (const [seed, p] of sample(genOf("w4-bar-times"), 300).entries()) {
      const v = p.visual as Extract<Visual, { kind: "bars" }>;
      const least = v.labels[v.values.indexOf(Math.min(...v.values))];
      // 과일 '배'와 '몇 배'가 겹치지 않게 '몇 배'는 빼고 본다
      expect(p.prompt.replace("몇 배", ""), `seed ${seed}`).not.toContain(least);
      const big = v.labels.find((l) => p.prompt.startsWith(l))!;
      expect(Number(p.answer), `seed ${seed}`).toBe(v.values[v.labels.indexOf(big)] / Math.min(...v.values));
    }
    expect(answerSet(genOf("w4-bar-times")).size).toBe(3);
  });

  it("l4-bar-cells-diff: 그래프의 모든 값이 새 눈금 한 칸의 배수(다시 그릴 수 있음), 답 1~4칸", () => {
    for (const [seed, p] of sample(genOf("l4-bar-cells-diff"), 400).entries()) {
      const v = p.visual as Extract<Visual, { kind: "bars" }>;
      const newStep = Number(p.prompt.match(/한 칸이 (\d+)/)![1]);
      expect(newStep, `seed ${seed}`).toBe(v.step * 2);
      expect(v.values.filter((x) => x % newStep), `seed ${seed}: ${v.values}`).toEqual([]);
    }
    expect([...answerSet(genOf("l4-bar-cells-diff"))].sort()).toEqual(["1", "2", "3", "4"]);
  });
});

describe("F4 4-2 치명·수정 필요", () => {
  it("l4-iso-cases: 될 수 있는 나머지 두 각을 모두 열거한 최댓값과 정답이 같다", () => {
    const got = Object.fromEntries(sample(genOf("l4-iso-cases"), 300).map((p) => [nums(p.prompt)[0], Number(p.answer)]));
    // a가 밑각: 나머지 a, 180 − 2a / a가 꼭지각: 나머지 (180 − a) ÷ 2 두 개
    const brute = Object.fromEntries([20, 30, 40, 50, 60, 70, 80].map((a) => [a, Math.max(a, 180 - 2 * a, (180 - a) / 2)]));
    expect(got).toEqual(brute);
    expect(brute).toEqual({ 20: 140, 30: 120, 40: 100, 50: 80, 60: 60, 70: 70, 80: 80 });
  });

  it("l4-para-join: 문장 속 긴 변이 짧은 변보다 길다", () => {
    for (const [seed, p] of sample(genOf("l4-para-join"), 400).entries()) {
      const long = Number(p.prompt.match(/긴 변이 (\d+)/)![1]);
      const short = Number(p.prompt.match(/짧은 변이 (\d+)/)![1]);
      expect(long, `seed ${seed}: ${p.prompt}`).toBeGreaterThan(short);
    }
    expect(distinct("l4-para-join")).toBeGreaterThanOrEqual(150);
  });

  it.each(["dec-add", "dec-sub"])("%s 차시: 계산식·보기·힌트·풀이에 소수 세 자리 수가 없다([4수01-16] 소수 두 자리까지)", (std) => {
    for (const { gen } of ENTRIES.filter((e) => e.unit.id === "g4-s2-decimal-add-sub" && e.standard.id === std)) {
      for (const [seed, p] of sample(gen, 200).entries()) expect(screenText(p).match(/\d\.\d{3}/g), `${gen.id} seed ${seed}`).toBeNull();
    }
    expect(distinct(std)).toBeGreaterThanOrEqual(500);
  });

  it("4-2 분수 단원(1단원): 뒤 단원에서 배우는 도형 이름이 없다", () => {
    for (const { gen } of ENTRIES.filter((e) => e.unit.id === "g4-s2-fraction-add-sub")) {
      for (const [seed, p] of sample(gen, 200).entries()) expect(screenText(p), `${gen.id} seed ${seed}`).not.toMatch(/정삼각형|이등변삼각형|예각삼각형|둔각삼각형|평행사변형|사다리꼴|마름모|다각형/);
    }
    expect(answerSet(genOf("l4-mixed-perimeter")).size).toBeGreaterThanOrEqual(150);
  });

  it("4-2 삼각형 앞 세 차시(변의 길이에 따라 분류): 각의 크기에 따른 분류(예각·둔각삼각형)가 없다", () => {
    for (const { gen, standard } of ENTRIES.filter((e) => e.unit.id === "g4-s2-triangles" && ["by-sides", "isosceles", "equilateral"].includes(e.standard.id))) {
      for (const [seed, p] of sample(gen, 200).entries()) expect(screenText(p), `${standard.id}/${gen.id} seed ${seed}`).not.toMatch(/예각삼각형|둔각삼각형/);
    }
    expect(stdOf("l4-tri-statement")).toBe("both");
    expect(stdOf("w4-isosceles-kind")).toBe("both");
    expect(stdOf("l4-tri-side-statement")).toBe("by-sides");
    expect(stdOf("l4-iso-angle-diff")).toBe("isosceles");
  });

  it("w4-isosceles-kind: 교과서에 없는 말 '밑각'을 문제 글에 쓰지 않는다", () => {
    for (const [seed, p] of sample(genOf("w4-isosceles-kind"), 100).entries()) expect(p.prompt, `seed ${seed}`).not.toContain("밑각");
    expect(answerSet(genOf("w4-isosceles-kind")).size).toBe(3);
  });

  it("l4-tri-side-statement: 옳은 문장·옳지 않은 문장이 섞여 정답이 하나", () => {
    const TRUE = /정삼각형은 이등변삼각형이라고 할 수 있습니다|세 변의 길이가 모두 같은 삼각형은 정삼각형입니다|두 변의 길이가 같은 삼각형은 이등변삼각형입니다|이등변삼각형이 아닙니다|정삼각형은 세 변의 길이가 모두 같습니다/;
    for (const [seed, p] of sample(genOf("l4-tri-side-statement"), 300).entries()) {
      const right = !p.prompt.includes("옳지 않은");
      expect(p.choices!.filter((c) => TRUE.test(c) === right), `seed ${seed}`).toEqual([p.answer]);
    }
    expect(answerSet(genOf("l4-tri-side-statement")).size).toBe(10);
  });

  it("l4-iso-angle-diff: 같은 두 각과 나머지 한 각의 합이 180°이고 차가 문제와 같다", () => {
    for (const [seed, p] of sample(genOf("l4-iso-angle-diff"), 400).entries()) {
      const d = Number(p.prompt.match(/(\d+)° 더/)![1]);
      const more = p.prompt.includes("큽니다");
      const askTop = p.prompt.includes("나머지 한 각은 몇");
      const x = Number(p.answer);
      const [b, t] = askTop ? [more ? x - d : x + d, x] : [x, more ? x + d : x - d];
      expect(2 * b + t, `seed ${seed}: ${p.prompt}`).toBe(180);
      expect(t, `seed ${seed}`).toBeGreaterThan(0);
    }
    expect(answerSet(genOf("l4-iso-angle-diff")).size).toBeGreaterThanOrEqual(12);
  });

  it("4학년 학생 화면에 '0 m 97 cm', '0 kg 300 g'처럼 큰 단위가 0인 복명수가 없다", () => {
    const ZERO_BIG = /(^|[^\d.])0 (km|m|kg|L|t|cm) \d/;
    for (const { gen } of ENTRIES) {
      for (const [seed, p] of sample(gen, 200).entries()) expect(screenText(p).match(ZERO_BIG), `${gen.id} seed ${seed}`).toBeNull();
    }
  }, 30_000);

  it("4학년 문제 속 이름에 '하루'(1일로 읽힘)가 없다", () => {
    for (const { gen } of ENTRIES) {
      for (const [seed, p] of sample(gen, 60).entries()) expect(screenText(p).match(/하루(?! ?(동안|에))/g), `${gen.id} seed ${seed}`).toBeNull();
    }
  });

  it("dec-compare2: 대부분 자연수 부분이 같아 소수 자리를 비교하고, '='(2.4와 2.40)도 나온다", () => {
    const ps = sample(genOf("dec-compare2"), 600);
    const pairs = ps.map((p) => p.expression!.split(" ○ ").map(Number));
    expect(pairs.filter(([a, b]) => Math.floor(a) === Math.floor(b)).length / ps.length).toBeGreaterThanOrEqual(0.8);
    for (const [seed, [a, b]] of pairs.entries()) expect(ps[seed].answer, `seed ${seed}: ${ps[seed].expression}`).toBe(a > b ? ">" : a < b ? "<" : "=");
    for (const [seed, p] of ps.entries()) {
      if (p.answer !== "=") continue;
      // '='는 소수끼리(2.4와 2.40). 2 ○ 2.0처럼 자연수와 비교하지 않는다
      expect(p.expression!.split(" ○ ").every((t) => t.includes(".")), `seed ${seed}: ${p.expression}`).toBe(true);
    }
    expect([...answerSet(genOf("dec-compare2"))].sort()).toEqual(["<", "=", ">"]);
    expect(distinct("dec-compare2")).toBeGreaterThanOrEqual(500);
  });

  /** 기록 글(1.09 m, 109 cm, 1 m 9 cm / 2.061 km, 2061 m, 2 km 61 m)을 작은 단위(cm·m) 수로 */
  const toSmall = (t: string, big: "m" | "km") => {
    const [mul, small] = big === "m" ? [100, "cm"] : [1000, "m"];
    const both = t.match(new RegExp(`^(\\d+) ${big} (\\d+) ${small}$`));
    if (both) return Number(both[1]) * mul + Number(both[2]);
    const inBig = t.match(new RegExp(`^([\\d.]+) ${big}$`));
    if (inBig) return Math.round(Number(inBig[1]) * mul);
    return Number(t.match(new RegExp(`^(\\d+) ${small}$`))![1]);
  };
  /** '이름: 기록' 목록. 기록 글과 그 꼴(m 소수 / cm / m·cm 섞음) */
  const records = (p: Problem, big: "m" | "km") =>
    [...p.prompt.matchAll(/([가-힣]{2}): (\d+(?:\.\d+)? k?m(?: \d+ c?m)?|\d+ c?m)/g)].map((m) => ({ name: m[1], text: m[2], v: toSmall(m[2], big) }));

  it("l4-dec-who-far(상): 단위가 섞인 기록을 바꾸어 순서를 정하고, 정답이 맞다", () => {
    for (const [seed, p] of sample(genOf("l4-dec-who-far"), 400).entries()) {
      const r = records(p, "m");
      expect(r, `seed ${seed}: ${p.prompt}`).toHaveLength(4);
      const order = [...r].sort((a, b) => b.v - a.v).map((x) => x.name);
      const want = p.prompt.includes("두 번째로 멀리") ? order[1] : p.prompt.includes("가장 멀리") ? order[0] : order[3];
      expect(p.answer, `seed ${seed}: ${p.prompt}`).toBe(want);
      const forms = new Set(r.map((x) => (/ m \d/.test(x.text) ? "mcm" : x.text.endsWith("cm") ? "cm" : "m")));
      expect(forms.size, `seed ${seed} 단위가 섞임: ${p.prompt}`).toBeGreaterThanOrEqual(2);
    }
    expect(distinct("l4-dec-who-far")).toBeGreaterThanOrEqual(500);
  });

  it("l4-dec-walk(소수 세 자리 차시): 크기 비교 없이 같은 거리 찾기 — 세 사람이 같고 한 사람만 다르다", () => {
    for (const [seed, p] of sample(genOf("l4-dec-walk"), 400).entries()) {
      expect(p.prompt, `seed ${seed}`).not.toMatch(/가장|먼 |짧은/);
      const r = records(p, "km");
      expect(r, `seed ${seed}: ${p.prompt}`).toHaveLength(4);
      const odd = r.filter((x) => r.filter((y) => y.v === x.v).length === 1).map((x) => x.name);
      expect(odd, `seed ${seed}: ${p.prompt}`).toEqual([p.answer]);
    }
    expect(distinct("l4-dec-walk")).toBeGreaterThanOrEqual(500);
  });

  it("w4-diagonals-sides(상): 정답 다각형이 표(사각형~육각형)에 없어 규칙을 이어 가야 한다", () => {
    for (const [seed, p] of sample(genOf("w4-diagonals-sides"), 200).entries()) {
      const n = Number(p.answer);
      expect(n, `seed ${seed}`).toBeGreaterThan(6);
      expect((n * (n - 3)) / 2, `seed ${seed}`).toBe(nums(p.prompt)[0]);
    }
    expect([...answerSet(genOf("w4-diagonals-sides"))].sort()).toEqual(["10", "7", "8", "9"]);
  });
});

/* ── R4: 4-1 3단원 어림셈 차시([4수01-08]) ── */

describe("4-1 곱셈과 나눗셈: 어림셈 차시([4수01-08])", () => {
  const md = units.find((u) => u.id === "g4-s1-mul-div")!;
  const est = md.standards[md.standards.length - 1];
  const nearHundred = (n: number) => Math.round(n / 100) * 100;
  const nearTen = (n: number) => Math.round(n / 10) * 10;

  it("단원 끝 차시이고 코드가 [4수01-08], 하1·중2·상2 이상", () => {
    expect(est.id).toBe("estimate");
    expect(est.code).toBe("[4수01-08]");
    const count = (l: number) => est.generators.filter((g) => g.level === l).length;
    expect(est.generators.length).toBeGreaterThanOrEqual(5);
    expect(count(1)).toBeGreaterThanOrEqual(1);
    expect(count(2)).toBeGreaterThanOrEqual(2);
    expect(count(3)).toBeGreaterThanOrEqual(2);
  });

  it("반올림(5-2)이라는 말을 쓰지 않고, 어림하는 수는 가장 가까운 몇백·몇십이 하나로 정해진다(몇백에서 20 이내, 몇십에서 3 이내)", () => {
    for (const g of est.generators) {
      for (const p of sample(g, 200)) {
        const t = screenText(p);
        expect(t, g.id).not.toMatch(/반올림|올림|버림/);
        // 어림할 수는 문제 글·보기에 나온 수(풀이에는 어림한 몇백 × 몇십도 나온다)
        for (const [, a, b] of [p.prompt, ...(p.choices ?? [])].join(" ").matchAll(/(?<![\d,])(\d{3}) [×÷] (\d{2})(?!\d)/g)) {
          expect(Math.abs(Number(a) - nearHundred(Number(a))), `${g.id}: ${a}`).toBeLessThanOrEqual(20);
          expect(Math.abs(Number(b) - nearTen(Number(b))), `${g.id}: ${b}`).toBeLessThanOrEqual(3);
          expect(Number(a) % 100 === 0 || Number(b) % 10 === 0, `${g.id}: ${a} × ${b}`).toBe(false);
        }
      }
    }
  });

  it("l4-est-mul: 정답 = (가장 가까운 몇백) × (가장 가까운 몇십), 정답 종류 20가지 이상", () => {
    for (const p of sample(genOf("l4-est-mul"), 300)) {
      const [a, b] = nums(p.prompt);
      expect(Number(p.answer)).toBe(nearHundred(a) * nearTen(b));
    }
    expect(answerSet(genOf("l4-est-mul")).size).toBeGreaterThanOrEqual(20);
  });

  it("l4-est-div: 정답 = (가장 가까운 몇백) ÷ (가장 가까운 몇십)이고 나누어떨어진다, 정답 종류 8가지 이상", () => {
    for (const p of sample(genOf("l4-est-div"), 300)) {
      const [a, b] = nums(p.prompt);
      expect(nearHundred(a) % nearTen(b)).toBe(0);
      expect(Number(p.answer)).toBe(nearHundred(a) / nearTen(b));
    }
    expect(answerSet(genOf("l4-est-div")).size).toBeGreaterThanOrEqual(8);
  });

  it("l4-est-check: 식 하나에 후보 넷, 바른 곱은 정답 하나뿐이고 오답은 모두 어림한 곱·바른 곱과 1.5배 넘게 차이 나며 곱해지는 수와 같은 보기가 없다", () => {
    const far = (x: number, y: number) => Math.max(x, y) > 1.5 * Math.min(x, y);
    for (const [seed, p] of sample(genOf("l4-est-check"), 300).entries()) {
      const [a, b] = nums(p.prompt);
      const guess = nearHundred(a) * nearTen(b);
      const vals = p.choices!.map(Number);
      expect(new Set(vals).size, `seed ${seed}`).toBe(4);
      expect(vals.filter((v) => v === a * b), `seed ${seed}`).toEqual([Number(p.answer)]);
      expect(vals, `seed ${seed}`).not.toContain(a);
      for (const v of vals.filter((x) => x !== a * b)) {
        expect(far(v, guess), `seed ${seed}: ${v} / 어림 ${guess}`).toBe(true);
        expect(far(v, a * b), `seed ${seed}: ${v}`).toBe(true);
      }
    }
  });

  it("l4-est-check: 자릿수만으로도, 끝자리만으로도 정답이 하나로 정해지지 않는다(바른 곱과 자릿수·끝자리가 모두 같은 오답이 있다)", () => {
    for (const [seed, p] of sample(genOf("l4-est-check"), 300).entries()) {
      const same = p.choices!.filter((c) => c !== p.answer && c.length === p.answer.length && c.at(-1) === p.answer.at(-1));
      expect(same.length, `seed ${seed}: ${p.choices}`).toBeGreaterThanOrEqual(1);
    }
  });

  it("l4-est-check: 정답 위치가 고르다(네 자리 모두 15% 이상)", () => {
    const at = [0, 0, 0, 0];
    for (const p of sample(genOf("l4-est-check"), 400)) at[p.choices!.indexOf(p.answer)]++;
    for (const n of at) expect(n).toBeGreaterThanOrEqual(60);
  });

  describe.each([0, 50000])("l4-est-check: 어림 없이 보기 구성만 보는 단순 규칙(시드 %i부터 2000개)", (from) => {
    const ps = Array.from({ length: 2000 }, (_, i) => genOf("l4-est-check").make(createRandom(from + i)));
    const shared = (x: string, y: string) => {
      const left = [...x];
      return [...y].filter((d) => {
        const i = left.indexOf(d);
        if (i < 0) return false;
        left.splice(i, 1);
        return true;
      }).length;
    };
    const top = (cs: string[], f: (c: string) => number) => cs.filter((c) => f(c) === Math.max(...cs.map(f)));
    const sorted = (cs: string[]) => [...cs].sort((x, y) => Number(x) - Number(y));
    const rules: Record<string, (cs: string[]) => string[]> = {
      "×10 짝이 있는 수": (cs) => cs.filter((c) => cs.includes(`${c}0`)),
      "다른 보기와 숫자를 가장 많이 공유하는 수": (cs) => top(cs, (c) => cs.filter((o) => o !== c).reduce((s, o) => s + shared(c, o), 0)),
      "가장 작은 수": (cs) => [sorted(cs)[0]],
      "두 번째로 작은 수": (cs) => [sorted(cs)[1]],
      "세 번째로 작은 수": (cs) => [sorted(cs)[2]],
      "가장 큰 수": (cs) => [sorted(cs)[3]],
      "자릿수가 다른 보기와 다른 유일한 수": (cs) => cs.filter((c) => cs.filter((o) => o.length === c.length).length === 1),
      "끝자리가 다른 보기와 다른 유일한 수": (cs) => cs.filter((c) => cs.filter((o) => o.at(-1) === c.at(-1)).length === 1),
      "다섯 자리 수": (cs) => cs.filter((c) => c.length === 5),
      "다른 보기와 앞·뒤 세 자리 이상 같은 수": (cs) => cs.filter((c) => cs.some((o) => o !== c && (o.slice(0, 3) === c.slice(0, 3) || o.slice(-3) === c.slice(-3)))),
    };

    it.each(Object.keys(rules))("%s: 적중률 50% 이하", (name) => {
      // 규칙이 여럿을 가리키면 그중 하나를 고르고, 아무것도 못 가리키면 넷 중 하나를 찍는다고 본다
      const hit = ps.reduce((s, p) => {
        const picked = rules[name](p.choices!);
        return s + (picked.length === 0 ? 1 / 4 : picked.includes(p.answer) ? 1 / picked.length : 0);
      }, 0);
      expect(hit / ps.length).toBeLessThanOrEqual(0.5);
    });

    it("정답의 크기 순위(1~4등)가 고르다(각 15% 이상 35% 이하)", () => {
      const rank = [0, 0, 0, 0];
      for (const p of ps) rank[sorted(p.choices!).indexOf(p.answer)]++;
      for (const n of rank) {
        expect(n / ps.length).toBeGreaterThanOrEqual(0.15);
        expect(n / ps.length).toBeLessThanOrEqual(0.35);
      }
    });
  });

  it("l4-est-situation: 정답은 묻는 쪽 목록에서, 오답 셋은 반대쪽 목록에서 나온다", () => {
    for (const p of sample(genOf("l4-est-situation"), 300)) {
      const [yes, no] = p.prompt.startsWith("어림셈으로") ? [ESTIMATE_OK, EXACT_ONLY] : [EXACT_ONLY, ESTIMATE_OK];
      expect(yes).toContain(p.answer);
      for (const c of p.choices!.filter((x) => x !== p.answer)) expect(no).toContain(c);
    }
    expect(answerSet(genOf("l4-est-situation")).size).toBe(ESTIMATE_OK.length + EXACT_ONLY.length);
  });

  it("l4-est-diff(상): 정답 = 어림한 곱과 실제 곱의 차(0이 아님), 정답 종류 100가지 이상", () => {
    for (const p of sample(genOf("l4-est-diff"), 300)) {
      const [a, b] = nums(p.prompt);
      const d = Math.abs(a * b - nearHundred(a) * nearTen(b));
      expect(d).toBeGreaterThan(0);
      expect(Number(p.answer)).toBe(d);
    }
    expect(answerSet(genOf("l4-est-diff")).size).toBeGreaterThanOrEqual(100);
  });

  it("l4-est-budget(상): 정답 = 가진 돈 − 어림한 물건값이고, 실제 물건값도 가진 돈보다 적다", () => {
    for (const p of sample(genOf("l4-est-budget"), 300)) {
      const [money, price, n] = nums(p.prompt.replace(/(\d),(\d{3})/g, "$1$2"));
      expect(price * n).toBeLessThan(money);
      const est = nearHundred(price) * nearTen(n);
      expect(Number(p.answer)).toBe(money - est);
      // '물건값만 어림한' 오답·'정확하게 계산한' 오답과 정답이 겹치지 않는다
      expect(Number(p.answer)).not.toBe(est);
      expect(Number(p.answer)).not.toBe(money - price * n);
      expect(p.prompt).toMatch(/한 (권|자루|개|묶음)의 값은 가장 가까운 몇백으로/);
    }
    expect(answerSet(genOf("l4-est-budget")).size).toBeGreaterThanOrEqual(8);
  });
});
