import { describe, expect, it } from "vitest";
import { units } from "../content";
import type { LongDivision, Problem } from "../content/types";
import { fractionValue } from "../content/generators/grade4";
import { answerSet, barValues, choicesUnique, commonIssues, figureOk, figureShare, gradeEntries, hasPicture, hasPlaceholder, longDivProblemError, numberLineValue, oddAngles, sample, sameValueChoices, saysPicture, screenText, shadedValue, visibleText, wrongJosa } from "./quality-checks";

/** 3학년 문항 품질 기준(docs/plan-quality.md Q3) */
const entries = gradeEntries(3);

/** 도형·측정·그래프 단원: 차시마다 그림 문제 생성기가 절반 이상이고, 기본(하)에 그림을 보고 푸는 유형이 있다 */
const FIGURE_UNITS = ["g3-s1-plane-figures", "g3-s1-length-time", "g3-s2-circle", "g3-s2-volume-weight", "g3-s2-data"];

/**
 * 그림 비율 검사에서 빼는 차시와 이유(최소한만).
 * - data-table: '표에서 알 수 있는 내용' 차시. 표 자체가 교과서의 대표 자료라 문제는 표(kind: table)로 보여 준다.
 *   조사한 자료(붙임딱지 그림)는 다음 차시 data-collect, 그림그래프는 data-picto 이후 차시에서 그림으로 다룬다.
 */
const FIGURE_EXEMPT: Record<string, string> = {
  "data-table": "표 읽기 차시(문제마다 표를 보여 줌)",
};

/** 5의 배수가 아닌 각도 허용 목록: 3학년은 각도(°)를 쓰지 않으므로 비워 둔다 */
const ODD_ANGLE_OK: number[] = [];

/** 도형 그림의 모든 꼭짓점 각(°) */
function polygonAngles(p: Problem): number[] {
  const v = p.visual;
  if (v?.kind !== "shape") return [];
  return (v.polygons ?? []).flatMap(({ points: ps }) =>
    ps.map((q, i) => {
      const a = ps[(i + ps.length - 1) % ps.length];
      const b = ps[(i + 1) % ps.length];
      const u = [a[0] - q[0], a[1] - q[1]];
      const w = [b[0] - q[0], b[1] - q[1]];
      return (Math.acos((u[0] * w[0] + u[1] * w[1]) / (Math.hypot(u[0], u[1]) * Math.hypot(w[0], w[1]))) * 180) / Math.PI;
    }),
  );
}

/** 직각을 찾는 그림 문제: 직각이 아닌 각은 90°에서 15° 이상 떨어져야 눈과 삼각자로 헷갈리지 않는다 */
const RIGHT_ANGLE_PICTURES = ["geo-right-angles", "l3-right-most", "l3-rtri-grid", "geo-shape-name"];

describe("3학년 문항 품질", () => {
  it("단원·차시 id 목록이 실제와 맞다", () => {
    const g3 = units.filter((u) => u.grade === 3);
    for (const id of FIGURE_UNITS) expect(g3.map((u) => u.id)).toContain(id);
    const stds = g3.flatMap((u) => u.standards.map((s) => s.id));
    for (const id of Object.keys(FIGURE_EXEMPT)) expect(stds).toContain(id);
  });

  it.each(entries.map((e) => [e.gen.id, e] as const))("%s: 조사 자리표시·각도·그림", (_id, { gen }) => {
    for (const [seed, p] of sample(gen).entries()) {
      const where = `seed ${seed}: ${p.prompt}`;
      expect(hasPlaceholder(p), where).toBe(false);
      expect(oddAngles(p).filter((d) => !ODD_ANGLE_OK.includes(d)), where).toEqual([]);
      expect(figureOk(p), where).toBe(true);
      if (saysPicture(p)) expect(hasPicture(p), where).toBe(true);
    }
  });

  it("학년 밖 용어('대각선', '소수 첫째 자리')와 이름 '하루'(하루에 몇 쪽과 헷갈림)를 쓰지 않는다", () => {
    for (const { gen } of entries)
      for (const p of sample(gen, 100)) {
        const t = visibleText(p);
        expect(t, `${gen.id}: ${p.prompt}`).not.toMatch(/대각선|소수 첫째 자리|하루(는|가|네|의) /);
      }
  });

  it.each(RIGHT_ANGLE_PICTURES)("%s: 직각이 아닌 각은 90°에서 15° 이상 떨어진다", (id) => {
    const e = entries.find((x) => x.gen.id === id)!;
    for (const [seed, p] of sample(e.gen).entries())
      for (const deg of polygonAngles(p)) {
        const off = Math.abs(deg - 90);
        expect(off < 0.5 || off >= 15, `seed ${seed}: ${deg.toFixed(1)}°`).toBe(true);
      }
  });

  it("3-1 평면도형(3단원 나눗셈보다 앞)은 나눗셈 없이 풀린다", () => {
    const unit = units.find((u) => u.id === "g3-s1-plane-figures")!;
    for (const s of unit.standards)
      for (const g of s.generators)
        for (const p of sample(g, 100)) expect(`${p.prompt} ${p.hint} ${p.explanation}`, `${g.id}: ${p.prompt}`).not.toMatch(/÷/);
  });

  const figureStandards = units.filter((u) => FIGURE_UNITS.includes(u.id)).flatMap((u) => u.standards.filter((s) => !(s.id in FIGURE_EXEMPT)));
  it.each(figureStandards.map((s) => [s.id, s] as const))("%s: 그림 문제 생성기가 절반 이상이고 기본(하)에 그림 문제가 있다", (_id, s) => {
    expect(figureShare(s)).toBeGreaterThanOrEqual(0.5);
    const basics = s.generators.filter((g) => g.level === 1);
    expect(basics.some((g) => sample(g, 20).some(hasPicture))).toBe(true);
  });

  it.each(["l3-sec-clock", "l3-sec-dur"])("%s: 긴바늘과 초바늘이 작은 눈금 4칸(24°) 이상 떨어져 있다", (id) => {
    const e = entries.find((x) => x.gen.id === id)!;
    const angle = (c: [number, number], p: [number, number]) => (Math.atan2(p[1] - c[1], p[0] - c[0]) * 180) / Math.PI;
    for (const [seed, p] of sample(e.gen).entries()) {
      const v = p.visual;
      if (v?.kind !== "shape") throw new Error(`${id}: 그림 없음`);
      for (const c of v.dots ?? []) {
        // 시계 가운데에서 나가는 선: 긴바늘(굵기 3), 초바늘(굵기 1)
        const from = (w: number) => (v.lines ?? []).find((l) => l.width === w && l.from[0] === c[0] && l.from[1] === c[1])!;
        const d = Math.abs(angle(c, from(3).to) - angle(c, from(1).to)) % 360;
        expect(Math.min(d, 360 - d), `${id} seed ${seed}: ${p.answer}`).toBeGreaterThanOrEqual(22); // 바늘 끝 좌표를 반올림해 1~2° 어긋난다
      }
    }
  });
});

describe("3학년 분수·소수 그림 유형(R2b)", () => {
  const ids = ["l3-fbar-cmp", "l3-fbar-unit", "l3-dec-line1", "l3-dec-line3", "l3-dec-bar-cmp", "l3-fline-improper", "l3-fbar-mixed", "l3-fline-mixed"];
  const find = (id: string) => entries.find((e) => e.gen.id === id)!.gen;

  it.each(ids)("%s: 그림이 있고 정답이 하나뿐이며 조사가 맞고 폭 300 이하", (id) => {
    for (const [seed, p] of sample(find(id)).entries()) {
      expect(hasPicture(p), `seed ${seed}`).toBe(true);
      expect(choicesUnique(p), `seed ${seed}: ${p.choices}`).toBe(true);
      expect(wrongJosa(p), `seed ${seed}`).toEqual([]);
      if (p.visual?.kind === "shape") expect(p.visual.width, `seed ${seed}`).toBeLessThanOrEqual(300);
    }
  });

  it.each(["l3-dec-line1", "l3-dec-line3", "l3-fline-improper", "l3-fline-mixed"])("%s: ㉠이 가리키는 눈금이 정답과 같다", (id) => {
    for (const [seed, p] of sample(find(id)).entries()) expect(numberLineValue(p), `seed ${seed}: ${p.answer}`).toBeCloseTo(fractionValue(p.answer), 3);
  });

  it("l3-fbar-mixed: 색칠한 막대 넓이가 정답(대분수)과 같다", () => {
    for (const [seed, p] of sample(find("l3-fbar-mixed")).entries()) expect(shadedValue(p), `seed ${seed}: ${p.answer}`).toBeCloseTo(fractionValue(p.answer), 3); // 칸 경계 x를 0.1px로 반올림
  });

  it.each(["l3-fbar-cmp", "l3-fbar-unit", "l3-dec-bar-cmp"])("%s: 막대마다 색칠한 양이 식의 수와 같고, 두 막대를 비교한 기호가 정답", (id) => {
    for (const [seed, p] of sample(find(id)).entries()) {
      const vals = barValues(p).map((b) => b.shaded);
      const nums = p.expression!.split(" ○ ").map(fractionValue);
      expect(vals, `seed ${seed}`).toHaveLength(2);
      vals.forEach((v, i) => expect(v, `seed ${seed}: ${p.expression}`).toBeCloseTo(nums[i], 3));
      const cmp = Math.abs(vals[0] - vals[1]) < 1e-3 ? "=" : vals[0] > vals[1] ? ">" : "<";
      expect(cmp, `seed ${seed}: ${p.expression}`).toBe(p.answer);
    }
  });
});

/** 3-2 나눗셈 세로셈 빈칸 채우기(R2c): 차시·수 범위·정답 유일성 */
describe("3학년 나눗셈 세로셈 빈칸", () => {
  const CASES = [
    // [생성기, 차시, 나누어지는 수 자리 수, 나머지 있음(null: 둘 다), 빈칸 수]
    ["l3-longdiv-exact", "div-no-rem", 2, false, 1],
    ["l3-longdiv-rem", "div-rem", 2, true, 2],
    ["l3-longdiv-3x1", "div-3x1", 3, null, 2],
  ] as const;
  it.each(CASES)("%s: %s 차시, 보이는 수가 계산 과정과 같고 빈칸 값이 정답", (id, std, digits, rem, blanks) => {
    const e = entries.find((x) => x.gen.id === id);
    expect(e?.standard.id).toBe(std);
    const keys = new Set<string>(); // 서로 다른 문제
    for (const [seed, p] of sample(e!.gen).entries()) {
      expect(longDivProblemError(p), `seed ${seed}: ${JSON.stringify(p.visual)}`).toBeNull();
      const v = p.visual as LongDivision;
      const [a, b] = [Number(v.dividend), Number(v.divisor)];
      expect(String(a).length).toBe(digits);
      expect(b).toBeGreaterThanOrEqual(2);
      expect(b).toBeLessThanOrEqual(9);
      expect(Math.floor(a / b)).toBeGreaterThanOrEqual(10);
      if (rem !== null) expect(a % b !== 0).toBe(rem);
      expect(p.answer.split(",").length).toBe(blanks);
      keys.add(p.key);
    }
    expect(keys.size).toBeGreaterThan(30);
  });

  it("차시 규칙(유형 5개 이상, 하1·중2·상2 이상)을 지킨다", () => {
    for (const std of ["div-no-rem", "div-rem", "div-3x1"]) {
      const gens = entries.filter((x) => x.standard.id === std).map((x) => x.gen);
      expect(gens.length).toBeGreaterThanOrEqual(5);
      expect(gens.filter((g) => g.level === 1).length).toBeGreaterThanOrEqual(1);
      expect(gens.filter((g) => g.level === 2).length).toBeGreaterThanOrEqual(2);
      expect(gens.filter((g) => g.level === 3).length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("3학년 공통 검사(docs/audit-v2 F0)", () => {
  const gens = [...new Map(gradeEntries(3).map((e) => [e.gen.id, e.gen])).values()];
  it.each(gens.map((g) => [g.id, g] as const))("%s: 힌트·풀이·오답 설명·보기·그림 글자까지 조사가 맞고, 숫자 서수(5째)와 값이 같은 보기가 없다", (_id, gen) => {
    expect(commonIssues(gen)).toEqual([]);
  });
});

describe("frac-to-mixed: 값이 같은 오답(1 9/7 꼴)", () => {
  const gen = gradeEntries(3).find((e) => e.gen.id === "frac-to-mixed")!.gen;
  const ps = sample(gen, 600);
  /** 대분수: 자연수 + 진분수 */
  const isMixed = (c: string) => {
    const m = /^(\d+) (\d+)\/(\d+)$/.exec(c);
    return !!m && Number(m[2]) < Number(m[3]);
  };

  it("값이 같은 오답이 나오는 문제는 30% 이하", () => {
    expect(ps.filter((p) => sameValueChoices(p).length > 0).length / ps.length).toBeLessThanOrEqual(0.3);
  });

  it("정답과 값이 같은 보기 중 대분수는 정답 하나뿐", () => {
    for (const p of ps) {
      const same = p.choices!.filter((c) => Math.abs(fractionValue(c) - fractionValue(p.answer)) < 1e-9);
      expect(same.filter(isMixed), p.choices!.join()).toEqual([p.answer]);
    }
  });
});

/** 3학년 재검수(docs/audit-v2/g3s1.md·g3s2.md) 결함이 다시 생기지 않는지 */
describe("3학년 재검수(audit-v2 F3)", () => {
  const all = gradeEntries(3);
  const find = (id: string) => all.find((e) => e.gen.id === id)!.gen;
  const SEEDS = 400;

  /** 가분수(3-2 frac-kinds)를 배우기 전 차시: 3-1 분수와 소수 단원 전체, 3-2 분수 단원의 앞 세 차시 */
  const BEFORE_IMPROPER = all.filter((e) => e.unit.id === "g3-s1-fraction-decimal" || (e.unit.id === "g3-s2-fraction" && ["frac-group", "frac-of", "frac-of-length"].includes(e.standard.id)));
  /** 분수(대분수의 분수 부분은 빼고) 중 분자 ≥ 분모인 것 */
  const improper = (t: string) => [...t.matchAll(/(?<!\d)(?<!\d )(\d+)\/(\d+)/g)].filter((m) => Number(m[1]) >= Number(m[2])).map((m) => m[0]);

  it("가분수를 배우기 전 차시 목록이 실제와 맞다", () => {
    expect(new Set(BEFORE_IMPROPER.map((e) => e.standard.id)).size).toBe(10);
  });

  it.each(BEFORE_IMPROPER.map((e) => [e.gen.id, e.gen] as const))("%s: 가분수를 배우기 전 차시라 문제·보기·힌트·풀이·그림 설명에 가분수가 없다", (_id, gen) => {
    for (const [seed, p] of sample(gen, SEEDS).entries()) expect(improper(screenText(p)), `seed ${seed}: ${p.choices ?? p.prompt}`).toEqual([]);
  });

  it.each(["frac-read-shaded", "frac-part-of-whole", "frac-read-unshaded", "w3-pizza-left", "l3-fg-frac", "l3-fg-left"])("%s: 보기 4개가 모두 다르고 정답과 값이 같은 보기가 없다", (id) => {
    for (const [seed, p] of sample(find(id), SEEDS).entries()) {
      expect(p.choices, `seed ${seed}`).toHaveLength(4);
      expect(choicesUnique(p), `seed ${seed}: ${p.choices}`).toBe(true);
    }
  });

  it("3-1에는 3-2에서 처음 나오는 용어('자연수', '나누어떨어진다')를 쓰지 않는다", () => {
    for (const { gen } of all.filter((e) => e.unit.semester === 1))
      for (const [seed, p] of sample(gen, 200).entries()) expect(screenText(p), `${gen.id} seed ${seed}`).not.toMatch(/자연수|나누어떨어/);
  });

  /** '나누어떨어진다'는 3-2 나머지 차시(div-rem)에서 정의한다: 3-2 곱셈 단원과 나눗셈 단원의 div-tens·div-no-rem 차시도 쓰지 않는다 */
  const BEFORE_REM = all.filter((e) => e.unit.id === "g3-s2-multiplication" || (e.unit.id === "g3-s2-division" && ["div-tens", "div-no-rem"].includes(e.standard.id)));
  it("3-2 나머지 차시 이전 목록이 실제와 맞다", () => {
    expect(new Set(BEFORE_REM.map((e) => e.standard.id))).toEqual(new Set(["mul3-no-carry", "mul-3x1", "mul-tens-tens", "mul-1x2", "mul-2x2", "div-tens", "div-no-rem"]));
  });
  it.each(BEFORE_REM.map((e) => [e.gen.id, e.gen] as const))("%s: 나머지 차시 이전이라 '나누어떨어진다'를 쓰지 않는다", (_id, gen) => {
    for (const [seed, p] of sample(gen, 200).entries()) expect(screenText(p), `seed ${seed}`).not.toMatch(/나누어떨어/);
  });

  it("l3-div-ex-cards: '○로 똑같이 나눌 수 있는 가장 큰 수'의 몫이 정답", () => {
    for (const [seed, p] of sample(find("l3-div-ex-cards"), SEEDS).entries()) {
      const cards = p.prompt.match(/수 카드 ([\d, ]+) 중에서/)![1].split(", ").map(Number);
      const b = Number(p.prompt.match(/(\d)(?:으로|로) 똑같이 나눌 수 있는 가장 큰 수/)![1]);
      const nums = cards.flatMap((x) => cards.filter((y) => y !== x).map((y) => x * 10 + y)).filter((n) => n >= 10 && n % b === 0);
      expect(p.answer, `seed ${seed}: ${p.prompt}`).toBe(String(Math.max(...nums) / b));
    }
  });

  /** 곱셈 단원의 □ 곱셈식(□4 × 2 = 68, 23 × □ = 69): □는 숫자 하나 또는 몇십이고, 넣어 보면 정답 하나만 맞는다 */
  const MUL_BOX = all.filter((e) => /^g3-s\d-multiplication$/.test(e.unit.id) && /^l3-mul.*-box$/.test(e.gen.id));
  it("곱셈 □ 생성기 목록", () => expect(MUL_BOX.map((e) => e.gen.id).sort()).toEqual(["l3-mul-cb-box", "l3-mul-nc-box", "l3-mul-tt-box", "l3-mul3-nc-box"]));
  it.each(MUL_BOX.map((e) => [e.gen.id, e.gen] as const))("%s: 나눗셈(뒤 단원) 없이 곱셈을 거꾸로 짐작해 풀 수 있고 답이 하나", (_id, gen) => {
    for (const [seed, p] of sample(gen, SEEDS).entries()) {
      const where = `seed ${seed}: ${p.expression} → ${p.answer}`;
      const [, left, right, r] = /^(\S+) × (\S+) = (\d+)$/.exec(p.expression!)!;
      const ans = Number(p.answer);
      expect(ans < 10 || (ans % 10 === 0 && ans < 100), where).toBe(true);
      const tries = ans < 10 ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] : [10, 20, 30, 40, 50, 60, 70, 80, 90];
      const fits = tries.filter((x) => {
        const [a, b] = [left, right].map((t) => t.replace("□", String(x)));
        if (/^0\d/.test(a)) return false;
        return Number(a) * Number(b) === Number(r);
      });
      expect(fits, where).toEqual([ans]);
    }
    expect(answerSet(gen).size).toBeGreaterThanOrEqual(5);
  });

  it("l3-mul-cb-cards: 가장 큰 곱의 식도 '십의 자리와 일의 자리에서 올림' 차시 조건을 지키고, 정답 종류가 40개 이상", () => {
    const gen = find("l3-mul-cb-cards");
    for (const [seed, p] of sample(gen, SEEDS).entries()) {
      const [, a, b] = /(\d+) × (\d) = /.exec(p.explanation)!.map(Number);
      const ones = (a % 10) * b;
      expect(ones >= 10 && Math.floor(a / 10) * b + Math.floor(ones / 10) >= 10, `seed ${seed}: ${p.explanation}`).toBe(true);
    }
    expect(answerSet(gen).size).toBeGreaterThanOrEqual(40);
  });

  it("l3-shape-cond: '삼각형'과 '직각삼각형'을 한 문제의 보기에 함께 넣지 않고, 정답 도형이 다섯 가지", () => {
    const gen = find("l3-shape-cond");
    for (const [seed, p] of sample(gen).entries()) expect(p.choices!.includes("삼각형") && p.choices!.includes("직각삼각형"), `seed ${seed}: ${p.choices}`).toBe(false);
    expect([...answerSet(gen)].sort()).toEqual(["각", "사각형", "삼각형", "원", "직각삼각형"]);
  });

  it("l3-quot-count: '1부터 9까지'를 밝히고, 1~9를 넣어 센 개수가 정답이며, 나누는 수·몫이 3 이상(상)", () => {
    const gen = find("l3-quot-count");
    for (const [seed, p] of sample(gen, SEEDS).entries()) {
      expect(p.prompt).toContain("1부터 9까지");
      const m = /^(?:□ < (\d+) ÷ (\d+)|(\d+) ÷ (\d+) < □)$/.exec(p.expression!)!;
      const [a, b] = m[1] ? [Number(m[1]), Number(m[2])] : [Number(m[3]), Number(m[4])];
      const q = a / b;
      expect(Math.min(b, q), `seed ${seed}: ${p.expression}`).toBeGreaterThanOrEqual(3);
      const count = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((x) => (m[1] ? x < q : q < x)).length;
      expect(p.answer, `seed ${seed}: ${p.expression}`).toBe(String(count));
    }
    expect([...answerSet(gen)].sort()).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
  });

  it("l3-table-cond: 범위 안의 '○단 곱셈구구의 곱'이 하나뿐이고 그 수가 정답", () => {
    for (const [seed, p] of sample(find("l3-table-cond"), SEEDS).entries()) {
      const [, lo, hi, b] = /· (\d+)보다 크고 (\d+)보다 작은 수입니다\.\n· (\d)단 곱셈구구의 곱입니다\./.exec(p.prompt)!.map(Number);
      const fits = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => b * k).filter((x) => lo < x && x < hi);
      expect(fits.map(String), `seed ${seed}: ${p.prompt}`).toEqual([p.answer]);
    }
  });

  it("l3-dec-line1: 그림 설명에 ㉠의 눈금 위치(정답)를 넣지 않는다", () => {
    for (const [seed, p] of sample(find("l3-dec-line1")).entries()) {
      const label = p.visual?.kind === "shape" ? p.visual.label : "";
      expect(label, `seed ${seed}`).not.toMatch(/번째|째 눈금/);
      expect(label, `seed ${seed}`).not.toContain(p.answer);
    }
  });

  it("l3-time-borrow: 답이 1시간 이상('0시간 □분' 없음)이고 받아내림이 있다", () => {
    const gen = find("l3-time-borrow");
    for (const [seed, p] of sample(gen, SEEDS).entries()) {
      expect(Number(p.answer.split(",")[0]), `seed ${seed}: ${p.expression}`).toBeGreaterThanOrEqual(1);
      const [m1, m2] = [...p.expression!.matchAll(/\d+시(?: (\d+)분)?/g)].slice(0, 2).map((m) => Number(m[1] ?? 0));
      expect(m1 < m2, `seed ${seed}: ${p.expression}`).toBe(true);
    }
    expect(answerSet(gen).size).toBeGreaterThan(150);
  });

  it("w3-jump-far: '가장 가까이 뛴'처럼 어색한 말을 쓰지 않는다", () => {
    for (const p of sample(find("w3-jump-far"))) expect(p.prompt).not.toMatch(/가까이/);
  });

  it("l3-vol-cup-size: 두 줄의 컵을 같은 크기로 그린다(크기로 답이 드러나지 않게)", () => {
    for (const [seed, p] of sample(find("l3-vol-cup-size")).entries()) {
      const v = p.visual;
      if (v?.kind !== "shape") throw new Error("그림 없음");
      const sizes = (v.polygons ?? []).map((g) => {
        const xs = g.points.map((q) => q[0]);
        const ys = g.points.map((q) => q[1]);
        return `${Math.max(...xs) - Math.min(...xs)}x${Math.max(...ys) - Math.min(...ys)}`;
      });
      expect(new Set(sizes).size, `seed ${seed}`).toBe(1);
    }
  });

  it("결과 식만 보여 주는 계산 고치기 문제는 '잘못 계산한 곳을 찾아'라고 하지 않는다", () => {
    for (const { gen } of all.filter((e) => /-fix$/.test(e.gen.id)))
      for (const p of sample(gen, 50)) expect(p.prompt, gen.id).not.toMatch(/잘못 계산한 곳/);
  });

  it("e3-compare-improper: 양쪽이 글자까지 똑같은 식(10/6 ○ 10/6)을 내지 않는다", () => {
    for (const [seed, p] of sample(find("e3-compare-improper"), SEEDS).entries()) {
      const [x, y] = p.expression!.split(" ○ ");
      expect(x, `seed ${seed}`).not.toBe(y);
    }
  });

  it("frac-compare-same-den: '='(같은 분수끼리 비교)는 15% 이하", () => {
    const gen = find("frac-compare-same-den");
    const ps = sample(gen, 1000);
    expect(ps.filter((p) => p.answer === "=").length / ps.length).toBeLessThanOrEqual(0.15);
    expect([...answerSet(gen)].sort()).toEqual(["<", "=", ">"]);
  });

  it("w3-proper-count(상): 진분수의 뜻과 조건 하나를 함께 따진다 — 분자·분모를 차례로 넣어 센 개수가 정답", () => {
    const gen = find("w3-proper-count");
    const proper = Array.from({ length: 20 }, (_, i) => i + 1).flatMap((n) => Array.from({ length: 20 }, (_, j) => [n, j + 2])).filter(([n, d]) => n < d);
    for (const [seed, p] of sample(gen, SEEDS).entries()) {
      const sum = /합이 (\d+)인 진분수/.exec(p.prompt);
      const above = /분모가 (\d+)인 진분수 중에서 분자가 (\d+)보다 큰/.exec(p.prompt);
      const diff = /차가 (\d+)이고 분모가 (\d+)보다 작은 진분수/.exec(p.prompt);
      const count = sum
        ? proper.filter(([n, d]) => n + d === Number(sum[1])).length
        : above
          ? proper.filter(([n, d]) => d === Number(above[1]) && n > Number(above[2])).length
          : proper.filter(([n, d]) => d - n === Number(diff![1]) && d < Number(diff![2])).length;
      expect(p.answer, `seed ${seed}: ${p.prompt}`).toBe(String(count));
    }
    expect(answerSet(gen).size).toBeGreaterThanOrEqual(8);
  });

  it("l3-tbl-cond: 장소 항목은 '산에 가 보고 싶은'(을/를 + 가 보고 싶은 금지)", () => {
    const ps = sample(find("l3-tbl-cond"), SEEDS);
    for (const [seed, p] of ps.entries()) expect(p.prompt, `seed ${seed}`).not.toMatch(/[을를] 가 보고 싶은/);
    expect(ps.some((p) => /에 가 보고 싶은 학생은/.test(p.prompt))).toBe(true);
  });

  it("m3-table-diff: 무엇을 조사한 표인지 밝히고 '학생 수의 차'를 묻는다", () => {
    for (const p of sample(find("m3-table-diff"))) {
      expect(p.prompt).toMatch(/조사하여 표로 나타냈습니다/);
      expect(p.prompt).toMatch(/학생 수의 차/);
    }
  });

  it("3-1 뺄셈 차시: 차가 한 자리 수인 (세 자리 수) − (세 자리 수)는 내지 않는다", () => {
    for (const { gen } of all.filter((e) => /^l3-sub[012]-(calc|box|cmp|fix)$/.test(e.gen.id)))
      for (const [seed, p] of sample(gen).entries())
        for (const [, a, b] of `${p.expression ?? ""} ${p.explanation}`.matchAll(/(\d{3}) − (\d{3})/g)) expect(Number(a) - Number(b), `${gen.id} seed ${seed}`).toBeGreaterThanOrEqual(10);
  });
});
