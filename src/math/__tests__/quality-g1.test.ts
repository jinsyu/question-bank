import { describe, expect, it } from "vitest";
import { units } from "../content";
import type { Problem } from "../content/types";
import { answerRange, answerSet, commonIssues, figureOk, figureShare, gradeEntries, hasPicture, hasPlaceholder, oddAngles, sample, saysPicture, screenText } from "./quality-checks";

/** 1학년 품질 기준(docs/plan-quality.md 1~5) */
const entries = gradeEntries(1);

/**
 * 그림 문제 생성기가 절반 이상이어야 하는 차시(도형·측정·그래프 단원).
 * 1-1 여러 가지 모양, 1-1 비교하기, 1-2 모양과 시각, 1-2 규칙 찾기의 모양 규칙 차시.
 * (수 배열·수 배열표 차시는 수 규칙이라 제외한다.)
 */
const FIGURE_STANDARDS: Record<string, string[]> = {
  "g1-s1-solids": ["find-solids", "sort-solids", "solid-features", "build-solids"],
  "g1-s1-compare": ["length", "weight", "area", "capacity"],
  "g1-s2-shapes-clock": ["find-flat", "flat-features", "flat-make", "oclock", "half-hour"],
  "g1-s2-patterns": ["repeat", "make-pattern"],
};

describe("1학년 문항 품질", () => {
  it("1학년 생성기가 있다", () => {
    expect(entries.length).toBeGreaterThan(200);
  });

  it.each(entries.map((e) => [e.gen.id, e] as const))("%s: 조사 자리표시·어색한 각도·그림 결함이 없다", (_id, { gen }) => {
    for (const p of sample(gen)) {
      expect(hasPlaceholder(p), p.prompt).toBe(false);
      expect(oddAngles(p), p.prompt).toEqual([]);
      expect(figureOk(p), `${p.prompt} (그림: ${p.visual && "label" in p.visual ? p.visual.label : ""})`).toBe(true);
      if (saysPicture(p)) expect(hasPicture(p), p.prompt).toBe(true);
    }
  });

  const figureStandards = entries
    .filter((e, i, all) => all.findIndex((x) => x.standard === e.standard) === i)
    .filter((e) => FIGURE_STANDARDS[e.unit.id]?.includes(e.standard.id));

  it("도형·측정·규칙(모양) 차시 목록이 모두 실제 차시다", () => {
    const listed = Object.values(FIGURE_STANDARDS).flat().length;
    expect(figureStandards).toHaveLength(listed);
  });

  it.each(figureStandards.map((e) => [`${e.unit.id}/${e.standard.id}`, e] as const))("%s: 그림 문제 생성기가 절반 이상이고, 하 난이도에 그림 문제가 있다", (_id, { standard }) => {
    expect(figureShare(standard)).toBeGreaterThanOrEqual(0.5);
    const easy = standard.generators.filter((g) => g.level === 1);
    expect(easy.some((g) => sample(g, 20).some(hasPicture))).toBe(true);
  });
});

describe("1학년 공통 검사(docs/audit-v2 F0)", () => {
  const gens = [...new Map(gradeEntries(1).map((e) => [e.gen.id, e.gen])).values()];
  it.each(gens.map((g) => [g.id, g] as const))("%s: 힌트·풀이·오답 설명·보기·그림 글자까지 조사가 맞고, 숫자 서수(5째)와 값이 같은 보기가 없다", (_id, gen) => {
    expect(commonIssues(gen)).toEqual([]);
  });
});

/* ── 1학년 재검수(docs/audit-v2/g1s1.md, g1s2.md) 회귀 테스트(F1) ── */

const SEEDS = 400;
const g1ById = new Map(gradeEntries(1).map((e) => [e.gen.id, e.gen]));
function g1(id: string) {
  const g = g1ById.get(id);
  if (!g) throw new Error(`${id} 생성기가 1학년 차시에 없어요`);
  return g;
}
const many = (id: string, seeds = SEEDS) => sample(g1(id), seeds);
const shapeOf = (p: Problem) => (p.visual?.kind === "shape" ? p.visual : undefined);
const lesson = (unitId: string, stdId: string) => units.find((u) => u.id === unitId)!.standards.find((s) => s.id === stdId)!;

/**
 * 차시 순서 범위: 그 차시까지 배운 가장 큰 수. 문제 글뿐 아니라 식·보기·힌트·풀이·오답 설명·그림 글자·그림 설명과 정답까지 본다.
 * 1-1은 5단원(50까지의 수) 전까지 10 이상을 모르고, 1-2 세 수의 덧셈·뺄셈은 받아올림 전이라 9 이하, 60~90 차시는 100 전
 */
const LESSON_MAX: Record<string, number> = {
  "g1-s1-numbers9": 9,
  "g1-s1-solids": 9,
  "g1-s1-add-sub": 9,
  "g1-s1-compare": 9,
  "g1-s1-numbers50/ten": 10,
  "g1-s1-numbers50/teens": 19,
  "g1-s1-numbers50/split19": 19,
  "g1-s1-numbers50": 50,
  "g1-s2-numbers100/tens60-90": 90,
  "g1-s2-add-sub/add3": 9,
  "g1-s2-add-sub/sub3": 9,
};
const lessonMax = (unitId: string, stdId: string) => LESSON_MAX[`${unitId}/${stdId}`] ?? LESSON_MAX[unitId] ?? 100;
/** 화면 글 속 수('10칸 틀'은 도구 이름이라 뺀다)와 정답 */
function numbersOnScreen(p: Problem): number[] {
  const text = screenText(p).replace(/10칸/g, "");
  return [...(text.match(/\d+/g) ?? []), ...(String(p.answer).match(/\d+/g) ?? [])].map(Number);
}

describe("1학년 차시 순서 범위(문제·보기·힌트·풀이·그림 설명)", () => {
  const lessons = units.filter((u) => u.grade === 1).flatMap((u) => u.standards.map((s) => [`${u.id}/${s.id}`, u.id, s] as const));
  it.each(lessons)("%s: 그 차시까지 배운 수보다 큰 수가 없다", (_name, unitId, s) => {
    const max = lessonMax(unitId, s.id);
    for (const g of s.generators)
      for (const p of sample(g, 300)) {
        const over = numbersOnScreen(p).filter((n) => n > max);
        expect(over, `${g.id}: ${screenText(p).replace(/\n/g, " ")}`).toEqual([]);
      }
  });

  it("몇 시 차시에는 '몇 시 30분'이 없다", () => {
    for (const g of lesson("g1-s2-shapes-clock", "oclock").generators) for (const p of sample(g, 300)) expect(screenText(p), g.id).not.toMatch(/30분/);
  });

  it("1학년 화면 글에 자리 이름(일의 자리·십의 자리)이 없다(2-1에서 배움)", () => {
    for (const g of g1ById.values()) for (const p of sample(g, 100)) expect(screenText(p), g.id).not.toMatch(/(일|십|백)의 자리/);
  });
});

/** "7 − 4 = 3"처럼 쓴 식이 계산상 맞는지 */
function trueEquation(e: string): boolean {
  const m = e.match(/^(\d+) ([+−]) (\d+) = (\d+)$/);
  if (!m) throw new Error(`식이 아니에요: ${e}`);
  const [x, op, y, z] = [Number(m[1]), m[2], Number(m[3]), Number(m[4])];
  return (op === "+" ? x + y : x - y) === z;
}

describe("1-1 수정 필요 항목", () => {
  it.each(["l1-add-story", "l1-sub-story"])("%s: 계산이 맞는 오답은 연산만 반대인 식(7 + 2 = 9)뿐이고 상황과 맞는 역연산 식(4 + 3 = 7)은 없으며, 정답 종류가 줄지 않았다", (id) => {
    for (const p of many(id)) {
      const operands = p.answer.split(" = ")[0].split(/ [+−] /).join();
      const trueWrongs = p.choices!.filter((c) => c !== p.answer && trueEquation(c));
      for (const c of trueWrongs) expect(c.split(" = ")[0].split(/ [+−] /).join(), p.choices!.join(" / ")).toBe(operands);
    }
    expect(answerSet(g1(id), 600).size).toBeGreaterThanOrEqual(id === "l1-add-story" ? 20 : 30);
  });

  it("l1-add-story: 무엇을 구하는 식인지 문제에 적는다", () => {
    for (const p of many("l1-add-story", 50)) expect(p.prompt).toContain("모두 몇 개인지 구하는");
  });

  it.each(["l1-length-cells", "l1-area-diff"])("%s: 그림의 칸이 막대(모양)마다 9칸 이하이고, 차이 1~7이 모두 나온다", (id) => {
    for (const p of many(id)) {
      expect(shapeOf(p)!.polygons!.length, p.explanation).toBeLessThanOrEqual(17);
      for (const n of p.explanation.match(/\d+(?=칸)/g)!.map(Number)) expect(n).toBeLessThanOrEqual(9);
    }
    expect(answerSet(g1(id))).toEqual(new Set(answerRange(1, 7, 1)));
  });

  it("e1-gather9: 두 수가 접시 두 개에 따로 그려지고(접시마다 ●의 수 = 두 수), 그림 설명에 합이 없다", () => {
    for (const p of many("e1-gather9")) {
      const [a, b] = p.prompt.match(/\d+/g)!.map(Number);
      const v = shapeOf(p)!;
      const plates = v.polygons!.filter((q) => !q.fill);
      const dots = v.polygons!.filter((q) => q.fill);
      expect(plates).toHaveLength(2);
      const inPlate = (k: number) => dots.filter((d) => d.points[0][0] > plates[k].points[0][0] && d.points[0][0] < plates[k].points[1][0]).length;
      expect([inPlate(0), inPlate(1)]).toEqual([a, b]);
      expect(v.label).not.toMatch(new RegExp(`(^|\\D)${a + b}(\\D|$)`));
    }
  });

  it("l1-w-front-back: 그림에 칠한 친구(●)가 없어 앞에서 찾고 뒤에서 다시 세야 하며, '앞'·'뒤'가 적혀 있다", () => {
    for (const p of many("l1-w-front-back")) {
      const v = shapeOf(p)!;
      expect(v.polygons ?? []).toEqual([]);
      expect(v.circles).toHaveLength(Number(p.prompt.match(/친구 (\d)명/)![1]));
      expect(v.texts!.map((t) => t.text)).toEqual(["앞", "뒤"]);
    }
  });

  it("l1-w-fingers10: 1단원 문제 글·풀이에 10이 없다", () => {
    for (const p of many("l1-w-fingers10")) expect(screenText(p)).not.toMatch(/10/);
  });

  it("l1-w-wrong-add9: '어떤 수' 역산(2-1 □ 구하기)은 1-1에서 뺐다", () => {
    const g1s1 = units.filter((u) => u.grade === 1 && u.semester === 1).flatMap((u) => u.standards.flatMap((s) => s.generators.map((g) => g.id)));
    expect(g1s1).not.toContain("l1-w-wrong-add9");
  });

  it("l1-w-same-total9: 모으기 → □ 구하기 두 단계이고 합은 9 이하, 정답 1~8이 나온다", () => {
    for (const p of many("l1-w-same-total9")) {
      const [a, b, c] = p.prompt.match(/\d+/g)!.map(Number);
      expect(Number(p.answer)).toBe(a + b - c);
      expect(a + b).toBeLessThanOrEqual(9);
    }
    expect(answerSet(g1("l1-w-same-total9"))).toEqual(new Set(answerRange(1, 8, 1)));
  });

  it("w1-eat-buy9: 뺄셈 뒤 덧셈(세 수 혼합, 1-2)이 없고 두 번의 뺄셈으로 푼다", () => {
    for (const p of many("w1-eat-buy9")) {
      expect(screenText(p)).not.toMatch(/\+|더 샀/);
      const [a, b, c] = p.prompt.match(/\d+/g)!.map(Number);
      expect(Number(p.answer)).toBe(a - b - c);
      expect(Number(p.answer)).toBeGreaterThan(0);
    }
    expect(answerSet(g1("w1-eat-buy9")).size).toBeGreaterThanOrEqual(6);
  });

  it("l1-w-tens-error: 보기가 50 이하이고 '라고' 조사가 맞다", () => {
    for (const p of many("l1-w-tens-error")) {
      for (const c of p.choices!) expect(Number(c.split(",")[0])).toBeLessThanOrEqual(50);
      expect(p.prompt).not.toMatch(/(둘|다섯)라고/);
    }
  });

  it("l1-gather-pairs·l1-split19-wrong: 정답 짝의 수와 그 합이 차시 범위 안이다", () => {
    for (const p of many("l1-gather-pairs")) expect(p.explanation).not.toMatch(/10/);
    for (const p of many("l1-split19-wrong")) for (const n of p.answer.match(/\d+/g)!.map(Number)) expect(n).toBeLessThanOrEqual(9);
  });

  it.each(["l1-count-bigger9", "l1-count-bigger50", "l1-count-bigger100"])("%s: 답이 0개인 문제가 없고 1~5가 모두 나온다", (id) => {
    expect(answerSet(g1(id))).toEqual(new Set(answerRange(1, 5, 1)));
  });
});

describe("1-2 치명·수정 필요 항목", () => {
  it("l1-trace-shape: 물건 이름이 모양을 말하지 않고, 같은 물건도 칠한 면에 따라 답이 다르며 문제 종류가 늘었다", () => {
    const answersByThing = new Map<string, Set<string>>();
    for (const p of many("l1-trace-shape")) {
      const thing = p.prompt.split("의 색칠한")[0];
      expect(thing).not.toMatch(/세모|네모|동그라미|둥근|삼각|사각|원/);
      answersByThing.set(thing, (answersByThing.get(thing) ?? new Set()).add(p.answer));
    }
    expect([...answersByThing.values()].some((s) => s.size > 1)).toBe(true);
    expect(answerSet(g1("l1-trace-shape")).size).toBe(3);
    expect(new Set(many("l1-trace-shape").map((p) => p.key)).size).toBeGreaterThanOrEqual(20);
  });

  it.each(["add-3nums", "l1-add3-missing", "w1-fruit-three", "l1-w-add3-cards"])("%s: 세 수의 합이 9 이하이고 정답 종류가 충분하다", (id) => {
    for (const p of many(id)) {
      const nums = [...(p.expression ?? p.prompt).matchAll(/\d+/g)].map((m) => Number(m[0]));
      expect(Math.max(...nums, Number(p.answer)), p.expression ?? p.prompt).toBeLessThanOrEqual(9);
    }
    expect(answerSet(g1(id)).size).toBeGreaterThanOrEqual(6);
  });

  it("l1-add3-biggest: 보기의 합이 모두 9 이하이고 서로 다르다", () => {
    for (const p of many("l1-add3-biggest")) {
      const sums = p.choices!.map((c) => c.split(" + ").reduce((s, x) => s + Number(x), 0));
      expect(Math.max(...sums)).toBeLessThanOrEqual(9);
      expect(new Set(sums).size).toBe(4);
    }
  });

  it("l1-w-sub3-reverse: 시제가 한 가지(과거)다", () => {
    for (const p of many("l1-w-sub3-reverse", 50)) expect(p.prompt).not.toMatch(/내일|지금|먹으면/);
  });

  it("w1-stickers2: 두 자리 수의 뺄셈을 배운 뒤(sub2)에 있고, 덧셈 차시(add2)의 힌트·풀이에 뺄셈이 없다", () => {
    const add2 = lesson("g1-s2-add-sub", "add2");
    expect(add2.generators.map((g) => g.id)).not.toContain("w1-stickers2");
    expect(lesson("g1-s2-add-sub", "sub2").generators.map((g) => g.id)).toContain("w1-stickers2");
    for (const g of add2.generators) for (const p of sample(g, 100)) expect(`${p.hint} ${p.explanation}`, g.id).not.toMatch(/−/);
  });

  it("l1-w-add2-more-total: 두 번의 덧셈이 모두 받아올림 없이 99 이하", () => {
    for (const p of many("l1-w-add2-more-total")) {
      const [a, d] = p.prompt.match(/\d+/g)!.map(Number);
      const b = a + d;
      expect((a % 10) + (d % 10)).toBeLessThanOrEqual(9);
      expect((a % 10) + (b % 10)).toBeLessThanOrEqual(9);
      expect(Number(p.answer)).toBe(a + b);
    }
    expect(answerSet(g1("l1-w-add2-more-total")).size).toBeGreaterThanOrEqual(30);
  });

  it("l1-w-range-who100: 두 조건을 모두 만족하는 사람은 정답 한 명뿐이다(경계와 같은 수도 오답)", () => {
    expect(lesson("g1-s2-numbers100", "compare100").generators.map((g) => g.id)).not.toContain("l1-w-most100");
    let boundary = 0;
    for (const p of many("l1-w-range-who100")) {
      const owned = [...p.prompt.matchAll(/([가-힣]+)는 (\d+)장/g)].map((m) => [m[1], Number(m[2])] as const);
      const [lo, hi] = [...p.prompt.matchAll(/(\d+)장보다/g)].map((m) => Number(m[1]));
      expect(owned.filter(([, n]) => n > lo && n < hi).map(([name]) => name), p.prompt).toEqual([p.answer]);
      if (owned.some(([, n]) => n === lo || n === hi)) boundary++;
    }
    expect(boundary).toBeGreaterThan(SEEDS / 4);
    expect(answerSet(g1("l1-w-range-who100")).size).toBe(6);
  });

  it("l1-pair-dots: 문제 글의 ●처럼 채운 점으로 그리고, 점의 수가 맞다", () => {
    for (const p of many("l1-pair-dots")) {
      const v = shapeOf(p)!;
      expect(v.circles ?? []).toEqual([]);
      expect(v.polygons!.filter((q) => q.fill)).toHaveLength(Number(p.explanation.match(/^(\d+)개/)![1]));
    }
  });

  it("l1-w-clock-who: 시계를 읽어야 하는 사람과 글로 주어진 사람이 모두 정답이 된다", () => {
    const sides = new Set<string>();
    for (const p of many("l1-w-clock-who")) {
      expect(p.visual).toBeDefined();
      sides.add(p.choices!.indexOf(p.answer) < 2 ? "clock" : "text");
    }
    expect(sides).toEqual(new Set(["clock", "text"]));
  });

  it("l1-pattern-wrong: 답이 말로 쓴 서수(셋째)이고 보기 4개 중 하나다", () => {
    for (const p of many("l1-pattern-wrong")) {
      expect(p.answer).toMatch(/^[가-힣]+째$/);
      expect(p.choices).toHaveLength(4);
      expect(p.choices!.filter((c) => c === p.answer)).toHaveLength(1);
    }
    expect(answerSet(g1("l1-pattern-wrong")).size).toBeGreaterThanOrEqual(7);
  });

  it("l1-w-chart-cond: 경계가 10의 배수가 아니고, 색칠한 세로줄을 바꾸면 답이 달라지는 경우만 낸다", () => {
    for (const p of many("l1-w-chart-cond")) {
      const [lo, hi] = p.prompt.match(/(\d+)보다 크고 (\d+)보다/)!.slice(1).map(Number);
      expect(lo % 10).not.toBe(0);
      expect(hi % 10).not.toBe(0);
      const count = (d: number) => Array.from({ length: 10 }, (_, t) => t * 10 + d).filter((n) => n > lo && n < hi).length;
      const colored = shapeOf(p)!.polygons!.findIndex((q) => q.fill) + 1;
      expect(Number(p.answer)).toBe(count(colored % 10));
      expect(new Set(Array.from({ length: 9 }, (_, i) => count(i + 1))).size).toBeGreaterThan(1);
    }
    expect(answerSet(g1("l1-w-chart-cond")).size).toBeGreaterThanOrEqual(4);
  });

  it("l1-w-chart-nth: 수 배열표 그림이 있고 시작 칸만 칠해져 있으며, 답이 그림 안에 있다", () => {
    for (const p of many("l1-w-chart-nth")) {
      const v = shapeOf(p)!;
      const filled = v.polygons!.flatMap((q, i) => (q.fill ? [i + 1] : []));
      expect(filled).toEqual([Number(p.prompt.match(/색칠한 (\d+)부터/)![1])]);
      expect(Number(p.answer)).toBeLessThanOrEqual(v.polygons!.length);
    }
  });

  it("l1-shape-to-num: 정답이 1과 2 모두 나온다", () => {
    expect(answerSet(g1("l1-shape-to-num"))).toEqual(new Set(["1", "2"]));
  });

  it("l1-w-code-sum: 규칙 잇기 → 수로 바꾸기 두 단계이고, 정답이 여러 가지다", () => {
    for (const p of many("l1-w-code-sum", 100)) expect(p.explanation).toMatch(/^다음 모양: /);
    expect(answerSet(g1("l1-w-code-sum")).size).toBeGreaterThanOrEqual(8);
  });

  it("l1-tens-seq100: □는 이 차시의 수(60~90)이고 100이 나오지 않는다", () => {
    expect(answerSet(g1("l1-tens-seq100"))).toEqual(new Set(["60", "70", "80", "90"]));
  });
});
