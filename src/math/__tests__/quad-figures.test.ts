import { describe, expect, it } from "vitest";
import { findUnit } from "../content";
import type { ShapeScene } from "../content/types";
import { createRandom } from "../lib/random";
import { PAR_SHAPES, PERP_SHAPES, QUAD_BASE, isConvex, parPairs, perpPairs, quadKind, sides, textsClash, type Pt, type QuadKind } from "../content/lessons/g4-quad";

/** 두 변(직선)이 이루는 작은 각 0~90° */
const angle = (a: Pt, b: Pt) => (Math.acos(Math.min(1, Math.abs(a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b)))) * 180) / Math.PI;

/** 4-2 사각형: 그림이 화면 안에 있고, 모눈 판별 도형이 뜻대로인지 */
const unit = findUnit("g4", "s2", "quadrilaterals")!;
const gens = unit.standards.flatMap((s) => s.generators);

function points(v: ShapeScene): Pt[] {
  return [
    ...(v.polygons ?? []).flatMap((p) => p.points),
    ...(v.lines ?? []).flatMap((l) => [l.from, l.to]),
    ...(v.dots ?? []),
    ...(v.texts ?? []).map((t) => t.at),
    ...(v.arcs ?? []).map((a) => a.c),
  ];
}

describe("4-2 사각형 그림", () => {
  it.each(gens.map((g) => [g.id, g] as const))("%s: 그림 좌표가 모두 그림 안에 있다", (_, g) => {
    for (let seed = 0; seed < 200; seed++) {
      const v = g.make(createRandom(seed)).visual;
      if (v?.kind !== "shape") continue;
      for (const [x, y] of points(v)) {
        expect(x, `${g.id} seed ${seed}`).toBeGreaterThanOrEqual(0);
        expect(y, `${g.id} seed ${seed}`).toBeGreaterThanOrEqual(0);
        expect(x, `${g.id} seed ${seed}`).toBeLessThanOrEqual(v.width);
        expect(y, `${g.id} seed ${seed}`).toBeLessThanOrEqual(v.height);
      }
    }
  });

  it.each(gens.map((g) => [g.id, g] as const))("%s: 시드 3000개에서 문제를 만들지 못하는 경우가 없다", (_, g) => {
    for (let seed = 0; seed < 3000; seed++) expect(() => g.make(createRandom(seed)), `${g.id} seed ${seed}`).not.toThrow();
  });

  it.each(gens.map((g) => [g.id, g] as const))("%s: 그림 글자끼리·글자와 점·선이 겹치지 않는다", (_, g) => {
    for (let seed = 0; seed < 300; seed++) {
      const v = g.make(createRandom(seed)).visual;
      if (v?.kind === "shape") expect(textsClash(v), `${g.id} seed ${seed}`).toBe(false);
    }
  });

  it("수직·평행이 아닌 변은 눈으로도 12° 이상 달라 보인다", () => {
    for (const s of PERP_SHAPES) {
      const v = sides(s);
      for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) {
        const a = angle(v[i], v[j]);
        if (Math.abs(90 - a) > 1e-3) expect(Math.abs(90 - a), JSON.stringify(s)).toBeGreaterThanOrEqual(12);
      }
    }
    for (const s of PAR_SHAPES) {
      const v = sides(s);
      for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) {
        const a = angle(v[i], v[j]);
        if (a > 1e-3) expect(a, JSON.stringify(s)).toBeGreaterThanOrEqual(12);
      }
    }
    for (const [kind, list] of Object.entries(QUAD_BASE) as [QuadKind, Pt[][]][]) {
      for (const pts of list) {
        const v = sides(pts);
        // 평행하지 않은 마주 보는 변은 15° 이상, 직각이 아닌 이웃한 변은 90°에서 12° 이상
        for (const [i, j] of [[0, 2], [1, 3]]) if (angle(v[i], v[j]) > 1e-3) expect(angle(v[i], v[j]), `${kind} ${JSON.stringify(pts)}`).toBeGreaterThanOrEqual(15);
        for (let i = 0; i < 4; i++) {
          const a = angle(v[i], v[(i + 1) % 4]);
          if (Math.abs(90 - a) > 1e-3) expect(Math.abs(90 - a), `${kind} ${JSON.stringify(pts)}`).toBeGreaterThanOrEqual(12);
        }
      }
    }
  });

  it("꼭짓점 옮기기: 오답 점으로 옮기면 마주 보는 변이 눈으로도 평행해 보이지 않는다", () => {
    const g = gens.find((x) => x.id === "l4-trap-move")!;
    for (let seed = 0; seed < 300; seed++) {
      const p = g.make(createRandom(seed));
      const v = p.visual as ShapeScene;
      const [, n, d, r] = v.polygons![0].points;
      const marks = ["①", "②", "③", "④"];
      v.dots!.forEach((dot, i) => {
        const s = sides([dot, n, d, r]);
        const opp = Math.min(angle(s[0], s[2]), angle(s[1], s[3]));
        if (marks[i] === p.answer) expect(opp, `seed ${seed}`).toBeLessThan(1e-3);
        else expect(opp, `seed ${seed}`).toBeGreaterThanOrEqual(12);
      });
    }
  });

  it("차시마다 그림 문제가 절반 이상이다(친구 말·표 제외 기본 유형)", () => {
    for (const s of unit.standards.filter((x) => x.id !== "quad-relations")) {
      const withFigure = s.generators.filter((g) => g.make(createRandom(1)).visual?.kind === "shape").length;
      expect(withFigure * 2, s.id).toBeGreaterThanOrEqual(s.generators.length);
    }
  });

  it("수직 판별 도형은 수직인 변이 모두 서로 이웃한다(떨어진 변끼리 수직인 모호한 도형 없음)", () => {
    for (const s of PERP_SHAPES) {
      const pairs = perpPairs(s);
      expect(pairs.length).toBeGreaterThan(0);
      for (const [i, j] of pairs) expect(j - i === 1 || (i === 0 && j === s.length - 1), JSON.stringify(s)).toBe(true);
    }
    for (const s of PAR_SHAPES) expect(parPairs(s).length).toBeGreaterThan(0);
  });

  it("모눈 사각형은 이름표대로이고 볼록하다", () => {
    for (const [kind, list] of Object.entries(QUAD_BASE) as [QuadKind, Pt[][]][]) {
      expect(list.length).toBeGreaterThanOrEqual(2);
      for (const pts of list) {
        expect(quadKind(pts), JSON.stringify(pts)).toBe(kind);
        expect(isConvex(pts), JSON.stringify(pts)).toBe(true);
      }
    }
  });

  it("수직과 수선 차시에 그림 없이 억지로 만든 각 계산 문제가 없다", () => {
    const perp = unit.standards.find((s) => s.id === "perpendicular")!;
    for (const g of perp.generators) {
      const p = g.make(createRandom(3));
      if (/°/.test(p.prompt + (p.answer ?? ""))) expect(p.visual?.kind, g.id).toBe("shape");
    }
  });
});
