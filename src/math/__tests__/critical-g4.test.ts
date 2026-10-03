import { describe, expect, it } from "vitest";
import type { Generator, Problem, ShapeScene, Visual } from "../content/types";
import { createRandom } from "../lib/random";
import { fracAddMixed, fracAddProper, fracSubMixed, fracSubProper, fractionValue } from "../content/generators/grade4";
import { lineBiggestChange, lineDiff, lineMax, lineRead } from "../content/generators/graphs";
import { l4LineCondition, l4LineIncreaseCount, l4LineScale, l4LineTotalChange, l4LineWhen } from "../content/lessons/g4-graphs";
import { l4QuadErrorWhy } from "../content/lessons/g4";
import { l4EqError } from "../content/lessons/g4-calc";
import { l4DecCond, l4DecRelWrong } from "../content/lessons/g4-s2";
import { l4PolyNot, l4TriBothName, lengthsFitAngles } from "../content/lessons/g4-shapes";
import { textsClash } from "../content/lessons/g4-quad";

/** 4학년 치명 결함(docs/plan-critical.md T4)이 다시 생기지 않도록 */
const SEEDS = 1500;
const each = (g: Generator, check: (p: Problem, seed: number) => void) => {
  for (let seed = 0; seed < SEEDS; seed++) check(g.make(createRandom(seed)), seed);
};
/** ①~④ 보기 표에서 정답 줄의 글 */
const markedRow = (p: Problem) => (p.visual as Extract<Visual, { kind: "table" }>).rows.find((r) => r[0] === p.answer)![1];
const rowTexts = (p: Problem) => (p.visual as Extract<Visual, { kind: "table" }>).rows.map((r) => r[1]);

describe("분수 덧셈·뺄셈: 값이 같은 보기가 없다(정답은 하나)", () => {
  it.each([fracAddProper, fracAddMixed, fracSubProper, fracSubMixed].map((g) => [g.id, g] as const))("%s", (_, g) => {
    each(g, (p, seed) => {
      const values = p.choices!.map(fractionValue);
      const answer = fractionValue(String(p.answer));
      expect(p.choices, `${g.id} seed ${seed}`).toHaveLength(4);
      expect(new Set(values.map((v) => v.toFixed(9))).size, `${g.id} seed ${seed}: ${p.choices}`).toBe(4);
      expect(values.filter((v) => Math.abs(v - answer) < 1e-9), `${g.id} seed ${seed}`).toHaveLength(1);
    });
  });

  it("fractionValue는 대분수·가분수·자연수를 값으로 읽는다", () => {
    expect(fractionValue("1 3/8")).toBe(fractionValue("11/8"));
    expect(fractionValue("3 9/8")).toBe(fractionValue("4 1/8"));
    expect(fractionValue("10/10")).toBe(1);
    expect(fractionValue("2")).toBe(2);
  });
});

describe("l4-quad-error-why: 잘못된 풀이도 계산이 되고, 바른 답이 맞다", () => {
  it("180°에서 뺀 값이 양수이고 정답은 (360° − 두 각) ÷ 2", () => {
    each(l4QuadErrorWhy, (p, seed) => {
      const [, x, y] = /두 각이 (\d+)°, (\d+)°/.exec(p.prompt)!.map(Number);
      const wrong = (180 - x - y) / 2;
      const right = (360 - x - y) / 2;
      expect(Number.isInteger(wrong) && wrong > 0, `seed ${seed}`).toBe(true);
      expect(p.prompt).toContain(`= ${wrong}°`);
      // 사각형이 되려면 각이 모두 180°보다 작아야 한다
      expect(Math.max(x, y, right), `seed ${seed}`).toBeLessThan(180);
      expect(markedRow(p)).toBe(`사각형의 네 각의 합은 360°인데 180°로 생각했어요. 바른 답은 ${right}°예요.`);
      expect(new Set(rowTexts(p)).size).toBe(4);
    });
  });
});

describe("l4-eq-error: 문제에 풀이 규칙을 적지 않고, 옳은 식은 하나", () => {
  const holds = (eq: string) => {
    const calc = (side: string) => {
      const [a, op, b] = side.trim().split(" ");
      return op === "+" ? Number(a) + Number(b) : Number(a) - Number(b);
    };
    const [l, r] = eq.split("=");
    return calc(l) === calc(r);
  };
  it("등호 양쪽이 같은 보기는 정답 하나뿐이고, 학생의 식은 틀렸다", () => {
    each(l4EqError, (p, seed) => {
      expect(p.prompt).not.toMatch(/작게|크게|같으므로/);
      expect(holds(p.expression!), `seed ${seed}`).toBe(false);
      expect(rowTexts(p).filter(holds), `seed ${seed}`).toEqual([markedRow(p)]);
    });
  });
});

describe("l4-tri-both-name: 그림을 보고 분류하며, 문제 문장에 분류 기준이 드러나지 않는다", () => {
  it("그림의 각·변 길이와 정답 이름이 맞다", () => {
    each(l4TriBothName, (p, seed) => {
      expect(p.prompt).not.toMatch(/두 변의 길이가 같|모두 다르|직각인|둔각인|예각인/);
      const v = p.visual as ShapeScene;
      expect(v.kind).toBe("shape");
      const texts = (v.texts ?? []).map((t) => t.text);
      const angles = texts.filter((t) => t.endsWith("°")).map((t) => Number(t.slice(0, -1)));
      const lens = texts.filter((t) => t.endsWith("cm")).map((t) => Number(t.split(" ")[0]));
      expect(angles.reduce((a, b) => a + b, 0), `seed ${seed}`).toBe(180);
      const big = Math.max(...angles);
      const angleName = big > 90 ? "둔각삼각형" : big === 90 ? "직각삼각형" : "예각삼각형";
      const sideName = new Set(lens).size === 2 ? "이등변삼각형" : "세 변의 길이가 모두 다른 삼각형";
      expect(new Set(lens).size, `seed ${seed}`).toBeGreaterThanOrEqual(2);
      // 두 각이 같으면 이등변삼각형(그림의 각과 변이 서로 맞는다)
      expect(new Set(angles).size === 2, `seed ${seed}`).toBe(sideName === "이등변삼각형");
      expect(p.answer).toBe(`${sideName}이면서 ${angleName}`);
      // 적힌 세 변으로 삼각형을 만들 수 있고(짧은 두 변의 합 > 가장 긴 변), 그 삼각형의 각이 적힌 각과 맞는다
      const [x, y, z] = [...lens].sort((m, n) => m - n);
      expect(x + y, `seed ${seed}: ${texts}`).toBeGreaterThan(z);
      expect(lengthsFitAngles(lens, angles), `seed ${seed}: ${texts}`).toBe(true);
      // 각도·길이 글자가 서로 겹치거나 변 위에 놓이지 않는다
      expect(textsClash(v), `seed ${seed}: ${texts}`).toBe(false);
      for (const t of v.texts ?? []) {
        expect(t.at[0]).toBeGreaterThanOrEqual(0);
        expect(t.at[0]).toBeLessThanOrEqual(v.width);
        expect(t.at[1]).toBeGreaterThanOrEqual(0);
        expect(t.at[1]).toBeLessThanOrEqual(v.height);
      }
    });
  });
});

describe("l4-poly-not: 보기가 도형 그림이고 다각형이 아닌 것은 하나", () => {
  it("정답 칸에만 다각형이 없다", () => {
    each(l4PolyNot, (p, seed) => {
      const v = p.visual as ShapeScene;
      expect(v.kind).toBe("shape");
      expect(p.choices).toEqual(["①", "②", "③", "④"]);
      const cellOf = (x: number) => Math.floor(x / 90);
      const polyCells = (v.polygons ?? []).map((poly) => cellOf(poly.points.reduce((s, q) => s + q[0], 0) / poly.points.length));
      const answerCell = ["①", "②", "③", "④"].indexOf(String(p.answer));
      expect(polyCells.sort(), `seed ${seed}`).toEqual([0, 1, 2, 3].filter((i) => i !== answerCell));
      const pts = [...(v.polygons ?? []).flatMap((q) => q.points), ...(v.lines ?? []).flatMap((l) => [l.from, l.to]), ...(v.texts ?? []).map((t) => t.at)];
      for (const [x, y] of pts) {
        expect(x >= 0 && x <= v.width && y >= 0 && y <= v.height, `seed ${seed}`).toBe(true);
      }
    });
  });
});

describe("소수의 덧셈과 뺄셈", () => {
  it("l4-dec-cond: 답이 소수 두 자리 수(둘째 자리가 0이 아님)", () => {
    each(l4DecCond, (p, seed) => {
      expect(String(p.answer), `seed ${seed}`).toMatch(/^\d\.\d[1-9]$/);
    });
  });

  it("l4-dec-rel-wrong: 답을 검산하면 잘못 구한 값이 되고, 소수 셋째 자리까지만", () => {
    each(l4DecRelWrong, (p, seed) => {
      const [, f, res] = /1\/(\d+)을 구해야 할 것을 잘못하여 \d+배 했더니 ([\d.]+)/.exec(p.prompt)!;
      const answer = String(p.answer);
      expect(answer, `seed ${seed}`).toMatch(/^\d+(\.\d{1,3})?$/);
      const thousandths = Math.round(Number(answer) * 1000);
      expect(thousandths * Number(f) * Number(f), `seed ${seed}`).toBe(Math.round(Number(res) * 1000));
    });
  });
});

describe("꺾은선그래프: 주제에 맞는 현실적인 자료와 문구", () => {
  const LINE_GENS = [lineRead, l4LineWhen, l4LineScale, lineDiff, lineBiggestChange, lineMax, l4LineIncreaseCount, l4LineCondition, l4LineTotalChange];
  it.each(LINE_GENS.map((g) => [g.id, g] as const))("%s", (_, g) => {
    each(g, (p, seed) => {
      const v = p.visual as Extract<Visual, { kind: "line" }>;
      expect(v.kind).toBe("line");
      const msg = `${g.id} seed ${seed}: ${v.title} ${v.values}`;
      expect(Math.min(...v.values), msg).toBeGreaterThan(0);
      expect(v.values.every((x) => x % v.step === 0), msg).toBe(true);
      expect(Math.max(...v.values) / v.step, msg).toBeLessThanOrEqual(12);
      if (v.title.includes("키")) {
        // 식물의 키는 줄어들지 않는다
        v.values.slice(1).forEach((x, i) => expect(x, msg).toBeGreaterThan(v.values[i]));
        expect(p.prompt).not.toMatch(/줄어든|내려간/);
      }
      if (v.unit === "°C") {
        expect(Math.min(...v.values), msg).toBeGreaterThanOrEqual(5);
        expect(Math.max(...v.values), msg).toBeLessThanOrEqual(30);
        expect(v.labels[0]).toMatch(/^오전/);
      }
      expect(p.prompt, msg).not.toMatch(/\((을|를|와|과|이|가)\)/);
    });
  });

  it("l4-line-increase-count·l4-line-condition은 오르내리는 주제만, 답을 다시 세면 같다", () => {
    each(l4LineIncreaseCount, (p) => {
      const v = p.visual as Extract<Visual, { kind: "line" }>;
      expect(v.title).not.toContain("키");
      const up = /늘어난|올라간/.test(p.prompt);
      const count = v.values.slice(1).filter((x, i) => (up ? x > v.values[i] : x < v.values[i])).length;
      expect(p.answer).toBe(String(count));
    });
    each(l4LineCondition, (p) => {
      expect((p.visual as Extract<Visual, { kind: "line" }>).title).not.toContain("키");
    });
  });

  it("line-read의 답은 그래프 값과 같다", () => {
    each(lineRead, (p) => {
      const v = p.visual as Extract<Visual, { kind: "line" }>;
      const label = v.labels.find((l) => p.prompt.includes(`보고 ${l}의`))!;
      expect(p.answer).toBe(String(v.values[v.labels.indexOf(label)]));
    });
  });
});
