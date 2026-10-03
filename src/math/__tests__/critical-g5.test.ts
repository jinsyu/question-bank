import { describe, expect, it } from "vitest";
import { findUnit, units } from "../content";
import type { Generator, ShapeScene } from "../content/types";
import { textsClash, type Pt } from "../content/lessons/g4-quad";
import { createRandom } from "../lib/random";

/** 5학년 치명 결함(docs/audit/g5.md) 재발 방지 */

const g5Gens = units.filter((u) => u.grade === 5).flatMap((u) => u.standards.flatMap((s) => s.generators));
const gen = (id: string): Generator => {
  const g = g5Gens.find((x) => x.id === id);
  if (!g) throw new Error(`${id} 없음`);
  return g;
};
const seeds = (n: number) => Array.from({ length: n }, (_, i) => i);
const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const JAMO = /^[ㄱ-ㅎ]$/;

describe("l5-cor-saving: 저금 시작일이 모호하지 않다", () => {
  it("'내일부터' 저금하고, 며칠 뒤 = (목표 − 처음 돈) ÷ 하루 저금액", () => {
    const g = gen("l5-cor-saving");
    for (const seed of seeds(200)) {
      const p = g.make(createRandom(seed));
      expect(p.prompt).not.toContain("오늘부터");
      expect(p.prompt).toContain("내일부터");
      const [A, d, T] = [...p.prompt.matchAll(/(\d+)원/g)].map((m) => Number(m[1]));
      expect((T - A) / d, `seed ${seed}`).toBe(Number(p.answer));
    }
  });
});

describe("합동인 도형의 성질: 대응 관계를 알려 주지 않고 그림으로 찾는다", () => {
  /** 꼭짓점 이름 → 좌표, 길이 글자 → 변(두 끝점) */
  function read(v: ShapeScene) {
    const verts = v.polygons!.flatMap((pg) => pg.points);
    const at = new Map<string, Pt>();
    for (const t of v.texts!.filter((x) => JAMO.test(x.text))) {
      at.set(t.text, verts.reduce((m, q) => (dist(q, t.at) < dist(m, t.at) ? q : m)));
    }
    const sidesOf = (pg: Pt[]) => pg.map((p, i): [Pt, Pt] => [p, pg[(i + 1) % pg.length]]);
    const allSides = v.polygons!.flatMap((pg) => sidesOf(pg.points));
    const labels = v.texts!.flatMap((t) => {
      const m = /^(\d+) cm$/.exec(t.text);
      if (!m) return [];
      const mid = (s: [Pt, Pt]): Pt => [(s[0][0] + s[1][0]) / 2, (s[0][1] + s[1][1]) / 2];
      const side = allSides.reduce((best, s) => (dist(mid(s), t.at) < dist(mid(best), t.at) ? s : best));
      return [{ cm: Number(m[1]), px: dist(side[0], side[1]) }];
    });
    return { at, labels };
  }

  it.each(["congruent-side", "l5-cg-quad-side"])("%s: 문장에 대응 괄호가 없고, 그림의 대응변 길이가 답과 같다", (id) => {
    const g = gen(id);
    let inOrder = 0;
    for (const seed of seeds(300)) {
      const p = g.make(createRandom(seed));
      const where = `${id} seed ${seed}`;
      expect(p.prompt, where).not.toMatch(/↔|\(ㄱ/);
      const v = p.visual as ShapeScene;
      expect(v?.kind, where).toBe("shape");
      expect(v.polygons, where).toHaveLength(2);
      const [a, b] = v.polygons!.map((pg) => pg.points);
      const lens = (pg: Pt[]) => pg.map((q, i) => dist(q, pg[(i + 1) % pg.length])).sort((x, y) => x - y);
      // 두 도형은 합동(변의 길이가 같다)
      lens(a).forEach((l, i) => expect(Math.abs(l - lens(b)[i]), where).toBeLessThan(0.5));
      const { at, labels } = read(v);
      expect(labels.length, where).toBe(a.length);
      // 길이 글자는 그림에 비례하고, 삼각형이면 삼각형의 세 변 조건을 만족한다
      const k = labels[0].px / labels[0].cm;
      for (const l of labels) expect(Math.abs(l.px / l.cm - k), where).toBeLessThan(0.05);
      const cms = labels.map((l) => l.cm).sort((x, y) => x - y);
      if (cms.length === 3) expect(cms[2], where).toBeLessThan(cms[0] + cms[1]);
      // 묻는 변의 실제 길이가 답
      const [, x, y] = /변 ([ㄱ-ㅎ])([ㄱ-ㅎ])/.exec(p.prompt)!;
      expect(dist(at.get(x)!, at.get(y)!) / k, where).toBeCloseTo(Number(p.answer), 1);
      // 이름 순서대로 대응하는지(ㄱ ↔ 둘째 도형의 첫 이름)
      const n = a.length;
      const second = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ"][n];
      if (b.indexOf(at.get(second)!) === a.indexOf(at.get("ㄱ")!)) inOrder++;
      expect(textsClash(v), where).toBe(false);
    }
    // 대응이 이름 순서로 굳어 있지 않다
    expect(inOrder).toBeLessThan(150);
  });
});

describe("합동과 대칭: 교육과정 밖(중1) 삼각형 결정조건·세 변의 조건이 없다", () => {
  const unit = findUnit("g5", "s2", "congruence")!;
  it("'합동인 삼각형 그리기' 차시와 그 생성기가 없고, 차시는 4개 이상", () => {
    expect(unit.standards.map((s) => s.id)).not.toContain("draw-triangle");
    expect(unit.standards.length).toBeGreaterThanOrEqual(4);
    const ids = unit.standards.flatMap((s) => s.generators.map((g) => g.id));
    for (const gone of ["l5-cg-draw-cond", "l5-cg-draw-ok", "l5-cg-third", "l5-cg-sticks"]) expect(ids).not.toContain(gone);
  });
  it("어떤 문제도 삼각형을 그릴 수 있는 조건을 묻지 않는다", () => {
    for (const g of unit.standards.flatMap((s) => s.generators)) {
      for (const seed of seeds(50)) {
        const p = g.make(createRandom(seed));
        expect(p.prompt, g.id).not.toMatch(/삼각형을 (하나로 )?그릴 수|삼각형을 만들려고|나머지 한 변의 길이가 될 수/);
      }
    }
  });
});

describe("l5-sym-line-perim: 만들 수 있는 오각형만, 그림은 수치에 비례", () => {
  it("지붕 > 밑변의 절반이고, 지붕·벽·밑변 절반이 같은 비율로 그려진다", () => {
    const g = gen("l5-sym-line-perim");
    for (const seed of seeds(300)) {
      const p = g.make(createRandom(seed));
      const where = `seed ${seed}`;
      const v = p.visual as ShapeScene;
      const [apex, shoulder, foot] = v.polygons![0].points;
      const [r, h, w] = v.texts!.map((t) => Number(/^(\d+) cm$/.exec(t.text)![1]));
      expect(r, where).toBeGreaterThan(w);
      expect(shoulder[1] - apex[1], where).toBeGreaterThan(10);
      const axisX = v.lines![0].from[0];
      const k = dist(apex, shoulder) / r;
      expect(dist(shoulder, foot) / h, where).toBeCloseTo(k, 1);
      expect((axisX - foot[0]) / w, where).toBeCloseTo(k, 1);
      // 밑변 절반 글자는 대칭축 왼쪽 구간 아래에 있다
      expect(v.texts![2].at[0], where).toBeLessThan(axisX);
      expect(v.texts![2].at[0], where).toBeGreaterThan(foot[0]);
      expect(Number(p.answer), where).toBe(2 * (r + h + w));
      expect(textsClash(v), where).toBe(false);
    }
  });
});

describe("가능성: 2022 개정 범위(0, 1/2, 1)", () => {
  const std = findUnit("g5", "s2", "average")!.standards.find((s) => s.id === "chance")!;
  it("가능성 더하기 문제가 없고, 차시 규칙(유형 5개·하1·중2·상2)을 지킨다", () => {
    const ids = std.generators.map((g) => g.id);
    expect(ids).not.toContain("l5-ch-sum");
    expect(ids.length).toBeGreaterThanOrEqual(5);
    const count = (l: number) => std.generators.filter((g) => g.level === l).length;
    expect(count(1)).toBeGreaterThanOrEqual(1);
    expect(count(2)).toBeGreaterThanOrEqual(2);
    expect(count(3)).toBeGreaterThanOrEqual(2);
  });
  it("수로 나타내는 문제의 답과 보기는 0, 1/2, 1뿐이다", () => {
    for (const g of std.generators) {
      for (const seed of seeds(200)) {
        const p = g.make(createRandom(seed));
        expect(p.prompt + p.explanation + p.hint, g.id).not.toMatch(/\d\/[3-9]|더하면/);
        if (g.id === "l5-ch-order") continue;
        expect(["0", "1/2", "1"], `${g.id} seed ${seed}`).toContain(p.answer);
        for (const c of p.choices ?? []) expect(["0", "1/2", "1"], `${g.id} seed ${seed}`).toContain(c);
      }
    }
  });
  it("w5-chance-compare: 여러 상황에서 0, 1/2, 1이 모두 나온다", () => {
    const g = gen("w5-chance-compare");
    const answers = new Set(seeds(200).map((s) => g.make(createRandom(s)).answer));
    expect([...answers].sort()).toEqual(["0", "1", "1/2"]);
  });
  it("l5-ch-order: 가능성이 서로 다른 일 4가지를 큰 순서대로 늘어놓는다", () => {
    const g = gen("l5-ch-order");
    for (const seed of seeds(200)) {
      const p = g.make(createRandom(seed));
      expect([...p.answer.replace(/, /g, "")].sort().join("")).toBe("㉠㉡㉢㉣");
      expect(p.choices).toHaveLength(4);
    }
  });
});
