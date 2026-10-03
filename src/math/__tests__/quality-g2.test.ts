import { describe, expect, it } from "vitest";
import type { Generator, ShapeScene } from "../content/types";
import { createRandom } from "../lib/random";
import { cubeVisibility, interiorAngles } from "../content/lessons/g2-pics";
import { randomBlocks } from "../content/lessons/g2-shapes";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { units } from "../content";
import { hasCarry } from "../content/generators/common";
import { answerSet, commonIssues, figureOk, figureShare, gradeEntries, hasPicture, hasPlaceholder, oddAngles, sample, saysPicture, screenText, visibleText } from "./quality-checks";

/**
 * 2학년 문항 품질 기준(docs/plan-quality.md 1~5)과 docs/audit/g2.md 중요 항목 재발 방지.
 * 허용 목록: 없음(조사 자리표시·5의 배수 아닌 각도·그림 결함·그림 없는 "그림을 보고" 모두 0건).
 */

const entries = gradeEntries(2);
const gens: Generator[] = [...new Map(entries.map((e) => [e.gen.id, e.gen])).values()];
const gen = (id: string) => {
  const g = gens.find((x) => x.id === id);
  if (!g) throw new Error(`${id} 없음`);
  return g;
};

/** 도형·측정·그래프 단원 차시: 그림 문제 생성기가 절반 이상, 기본(하)에 그림 문제가 있다 */
const FIGURE_STANDARDS: Record<string, string[]> = {
  // 2-1 2단원 여러 가지 도형(칠교판·쌓기나무 포함)
  "g2-s1-shapes": ["triangle", "quadrilateral", "pentagon-hexagon", "circle2", "tangram", "blocks"],
  // 2-1 4단원 길이 재기
  "g2-s1-length": ["unit-measure", "cm-unit", "ruler-measure", "about-cm", "estimate-length"],
  // 2-1 5단원 분류하기
  "g2-s1-classify": ["sort-criteria", "sort-by", "count-sorted", "sort-result"],
  // 2-2 3단원 길이 재기
  "g2-s2-length-m": ["meter", "tape-measure", "length-add", "length-sub", "m-estimate"],
  // 2-2 4단원 시각과 시간
  "g2-s2-time": ["clock-5min", "clock-1min", "minutes-before", "hour-elapsed", "day-time", "calendar"],
  // 2-2 5단원 표와 그래프
  "g2-s2-table-graph": ["make-table", "draw-graph", "read-graph", "table-graph"],
  // 2-2 6단원 규칙 찾기: 무늬·쌓은 모양
  "g2-s2-patterns": ["pattern-shape", "pattern-blocks"],
};

describe("2학년 품질 기준(전 생성기)", () => {
  const SEEDS = 120;
  it.each(gens.map((g) => [g.id, g] as const))("%s", (_, g) => {
    for (const p of sample(g, SEEDS)) {
      expect(hasPlaceholder(p), `조사 자리표시: ${p.prompt}`).toBe(false);
      expect(oddAngles(p), `각도: ${p.prompt}`).toEqual([]);
      expect(figureOk(p), `그림 결함(겹침·그림 밖): ${p.prompt}`).toBe(true);
      if (saysPicture(p)) expect(hasPicture(p), `그림 없음: ${p.prompt}`).toBe(true);
    }
  });
});

describe("2학년 도형·측정·그래프 차시는 그림 문제가 절반 이상", () => {
  const cases = Object.entries(FIGURE_STANDARDS).flatMap(([unitId, ids]) => ids.map((id) => [unitId, id] as const));
  it.each(cases)("%s / %s", (unitId, stdId) => {
    const e = entries.find((x) => x.unit.id === unitId && x.standard.id === stdId);
    expect(e, `${unitId}/${stdId} 없음`).toBeDefined();
    const s = e!.standard;
    expect(figureShare(s)).toBeGreaterThanOrEqual(0.5);
    const easyWithPicture = s.generators.filter((g) => g.level === 1 && sample(g, 20).some(hasPicture));
    expect(easyWithPicture.length, "기본(하) 그림 문제").toBeGreaterThan(0);
  });

  it("목록의 단원에는 목록 밖 차시가 없다(새 차시를 빠뜨리지 않게)", () => {
    for (const [unitId, ids] of Object.entries(FIGURE_STANDARDS)) {
      if (unitId === "g2-s2-patterns") continue;
      const std = [...new Set(entries.filter((x) => x.unit.id === unitId).map((x) => x.standard.id))];
      expect(std.sort()).toEqual([...ids].sort());
    }
  });
});

describe("차시 규칙: 유형 5개 이상, 하1·중2·상2 이상, 단원 차시 4개 이상", () => {
  const units = [...new Set(entries.map((e) => e.unit))];
  it.each(units.map((u) => [u.id, u] as const))("%s", (_, u) => {
    expect(u.standards.length).toBeGreaterThanOrEqual(4);
    for (const s of u.standards) {
      const lv = [1, 2, 3].map((l) => s.generators.filter((g) => g.level === l).length);
      expect(s.generators.length, s.id).toBeGreaterThanOrEqual(5);
      expect(lv[0], `${s.id} 하`).toBeGreaterThanOrEqual(1);
      expect(lv[1], `${s.id} 중`).toBeGreaterThanOrEqual(2);
      expect(lv[2], `${s.id} 상`).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("audit/g2.md 중요·보통 항목", () => {
  it("l2-box-ineq3·4: '>'에서 가장 큰 수, '<'에서 가장 작은 수를 묻지 않는다(답이 늘 9·0)", () => {
    for (const id of ["l2-box-ineq3", "l2-box-ineq4"]) {
      for (const p of sample(gen(id))) {
        if (p.expression!.includes(">")) expect(p.prompt, p.prompt).not.toMatch(/가장 큰/);
        else expect(p.prompt, p.prompt).not.toMatch(/가장 작은/);
      }
    }
  });

  it("clock-read-minute: 1분 단위 차시는 5분 단위가 아닌 시각", () => {
    for (const p of sample(gen("clock-read-minute"))) expect(Number(p.answer.split(",")[1]) % 5).not.toBe(0);
  });

  it("time-units: 1시간과 걸린 시간 차시에 일·주 단위(24 × n)가 없다", () => {
    for (const p of sample(gen("time-units"))) expect(p.expression).not.toMatch(/일|주/);
  });

  it("곱셈구구 거꾸로 문제: 남은 수가 한 사람 몫보다 적다", () => {
    for (const id of ["l2-tt-reverse48", "l2-tt-reverse23456789"]) {
      for (const p of sample(gen(id))) {
        const m = p.prompt.match(/(\d+)개씩 나누어 주었더니 (\d+)개가 남았/)!;
        expect(Number(m[2]), p.prompt).toBeLessThan(Number(m[1]));
      }
    }
  });

  it("l2-addtable-nth: 1~9 덧셈표 안의 칸만 묻는다", () => {
    for (const p of sample(gen("l2-addtable-nth"))) expect(Number(p.answer), p.prompt).toBeLessThanOrEqual(18);
  });

  it("덧셈표 차시·곱셈표 차시는 표 종류가 섞이지 않는다", () => {
    const add = entries.find((e) => e.standard.id === "add-table-rule")!.standard;
    const mul = entries.filter((e) => e.standard.id === "mul-table-rule" || e.standard.id === "times-chart").map((e) => e.standard);
    for (const g of add.generators) for (const p of sample(g, 30)) expect(p.prompt).not.toMatch(/곱셈표/);
    for (const s of mul) for (const g of s.generators) for (const p of sample(g, 30)) expect(p.prompt).not.toMatch(/덧셈표/);
  });

  it("1단·0의 곱 차시에 □가 여러 개 될 수 있는 식이나 다른 단 문제가 없다", () => {
    for (const p of sample(gen("times-one-zero-missing"))) expect(p.expression).toMatch(/^(1 × □|□ × 1|\d × □ = 0|□ × \d = 0)/);
  });

  it("l2-sub22-cards: 받아내림이 있는 뺄셈만", () => {
    for (const p of sample(gen("l2-sub22-cards"))) {
      const [, big, n] = p.explanation.match(/가장 큰 수 (\d+), \d+ − (\d+)/)!.map(Number);
      expect(big % 10, p.explanation).toBeLessThan(n % 10);
    }
  });

  it("몇의 몇 배 차시(× 배우기 전)에 곱셈 기호가 없다", () => {
    const s = entries.find((e) => e.standard.id === "times-of")!.standard;
    for (const g of s.generators) for (const p of sample(g, 30)) expect(`${p.prompt} ${p.expression ?? ""}`, g.id).not.toMatch(/×/);
  });

  it("l2-clock-error: 짧은바늘이 숫자 가까이에 있는 시각(25분까지)만 쓴다", () => {
    for (const p of sample(gen("l2-clock-error"))) expect(Number(p.answer.match(/(\d+)분이에요/)![1])).toBeLessThanOrEqual(25);
  });

  it("글로만 된 억지 계산 생성기(꼭짓점 합·층별 합·수열만)가 2학년에서 빠졌다", () => {
    const gone = ["w2-poly-vertices", "l2-shape-guess", "l2-lines-total", "l2-tangram-corners", "l2-tangram-left", "m2-sides-sum", "l2-shape-sides-total", "l2-unit-convert", "m2-wings-count", "m2-repeat-length", "w2-nth-shape", "pattern-repeat", "w2-graph-diff", "e2-hours-min", "w2-rope-cut", "shape-kind2"];
    const ids = gens.map((g) => g.id);
    for (const id of gone) expect(ids, id).not.toContain(id);
  });

  it("쌓기나무 개수 문제: 모든 쌓기나무의 앞면이나 윗면이 60% 이상 보이고, 숨은 쌓기나무가 없다고 알려 준다", () => {
    for (let s = 0; s < 300; s++) {
      const cubes = randomBlocks(createRandom(s), 4, 10);
      if (!cubes) continue;
      for (const v of cubeVisibility(cubes)) expect(v, JSON.stringify(cubes)).toBeGreaterThanOrEqual(0.6);
    }
    for (const id of ["l2-blocks-count", "l2-blocks-layer", "l2-blocks-more"]) for (const p of sample(gen(id))) expect(p.prompt).toMatch(/보이지 않는 쌓기나무는 없습니다/);
  });

  it("오각형·육각형 등 그림 다각형은 꼭짓점이 또렷하다(가장 큰 내각 142° 이하)", () => {
    const ids = ["l2-tri-find", "l2-tri-count", "l2-quad-find", "l2-quad-count", "l2-poly-name", "l2-poly-count", "l2-poly-vertex-sum", "l2-circle-find", "l2-circle-count"];
    for (const id of ids) {
      for (const p of sample(gen(id))) {
        const v = p.visual!;
        if (v.kind !== "shape") continue;
        // 36각형은 타원(원이 아닌 예)을 그린 것이라 뺀다
        for (const pg of (v.polygons ?? []).filter((x) => x.points.length <= 6)) expect(Math.max(...interiorAngles(pg.points)), `${id}: ${JSON.stringify(pg.points)}`).toBeLessThanOrEqual(142);
      }
    }
  });

  it("l2-graph-more-than: 기준보다 많은 항목이 적어도 하나 있다", () => {
    for (const p of sample(gen("l2-graph-more-than"))) expect(Number(p.answer)).toBeGreaterThan(0);
  });

  it("쌓기나무·쌓은 모양 차시는 모든 문항에 그림이 있다", () => {
    for (const stdId of ["blocks", "pattern-blocks", "tangram"]) {
      const s = entries.find((e) => e.standard.id === stdId)!.standard;
      for (const g of s.generators) for (const p of sample(g, 30)) expect(hasPicture(p), `${g.id}: ${p.prompt}`).toBe(true);
    }
  });
});

/** R2c: 수 모형·수직선·세면서 표시하기 그림 문제 — 그림에서 다시 센 값이 정답과 같다(정답 유일성) */
describe("2학년 수 모형·수직선·세면서 표시하기", () => {
  const scene = (p: { visual?: unknown }) => p.visual as ShapeScene;
  /** 수 모형 그림의 수: 백 모형(60×60), 십 모형(폭 8·높이 60), 일 모형(8×8) */
  const modelValue = (v: ShapeScene) => {
    const sizes = (v.polygons ?? []).map((pg) => {
      const xs = pg.points.map((q) => q[0]);
      const ys = pg.points.map((q) => q[1]);
      return [Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
    });
    const n = (w: number, h: number) => sizes.filter(([a, b]) => a === w && b === h).length;
    expect(sizes.length).toBe(n(60, 60) + n(8, 60) + n(8, 8));
    return n(60, 60) * 100 + n(8, 60) * 10 + n(8, 8);
  };
  /** 수직선: 수가 쓰인 눈금 두 개로 □ 자리의 수를 구한다 */
  const lineValue = (v: ShapeScene) => {
    const nums = (v.texts ?? []).filter((t) => /^\d+$/.test(t.text));
    const box = (v.texts ?? []).find((t) => t.text === "□")!;
    const [a, b] = [nums[0], nums[1]];
    const per = (Number(b.text) - Number(a.text)) / (b.at[0] - a.at[0]);
    return Math.round((Number(a.text) + (box.at[0] - a.at[0]) * per) * 1000) / 1000;
  };
  /** 세면서 표시한 표: 종류 이름 줄마다 표시 칸(x > 80)에서 아래에서 위로 올라가는 획(/ 한 획, ✓의 긴 획) 수 */
  const tallyCounts = (v: ShapeScene) => {
    const kinds = (v.texts ?? []).slice(2);
    const rising = (v.lines ?? []).filter((l) => l.from[0] > 80 && l.to[1] < l.from[1]);
    return new Map(kinds.map((k) => [k.text, rising.filter((l) => Math.abs((l.from[1] + l.to[1]) / 2 - k.at[1]) < 12).length]));
  };

  it("차시 배치와 난이도", () => {
    const place: Record<string, [string, number]> = {
      "l2-blocks-read3": ["three-digit", 1],
      "l2-blocks-more3": ["place-value3", 2],
      "l2-hundreds-line": ["hundreds", 1],
      "l2-skip-line3": ["skip-count3", 1],
      "l2-tally-read": ["count-sorted", 1],
      "l2-tally-total": ["make-table", 2],
    };
    for (const [id, [std, level]] of Object.entries(place)) {
      const e = entries.find((x) => x.gen.id === id);
      expect(e?.standard.id, id).toBe(std);
      expect(e?.gen.level, id).toBe(level);
      const gs = e!.standard.generators;
      expect(gs.length).toBeGreaterThanOrEqual(5);
      for (const lv of [1, 2, 3] as const) expect(gs.filter((g) => g.level === lv).length, `${std} 난이도 ${lv}`).toBeGreaterThanOrEqual(lv === 1 ? 1 : 2);
    }
  });

  it("l2-blocks-read3: 그림의 수 모형을 센 수가 정답, 0인 자리도 나온다", () => {
    const ps = sample(gen("l2-blocks-read3"));
    for (const p of ps) {
      expect(String(modelValue(scene(p))), p.prompt).toBe(p.answer);
      expect(scene(p).width, "휴대폰에서 일 모형이 너무 작아지지 않게").toBeLessThanOrEqual(400);
    }
    expect(ps.some((p) => /^\d0\d$/.test(p.answer))).toBe(true);
    expect(ps.some((p) => /^\d\d0$/.test(p.answer))).toBe(true);
  });

  it("l2-blocks-more3: 그림의 수 + 더 놓는 모형 = 목표 수", () => {
    const unit = { 백: 100, 십: 10, 일: 1 } as const;
    for (const p of sample(gen("l2-blocks-more3"))) {
      const m = p.prompt.match(/(백|십|일) 모형을 몇 개 더 놓으면 (\d+)/)!;
      expect(modelValue(scene(p)) + Number(p.answer) * unit[m[1] as keyof typeof unit], p.prompt).toBe(Number(m[2]));
    }
  });

  it.each(["l2-hundreds-line", "l2-skip-line3"])("%s: 눈금에서 구한 □의 수가 정답, 그림 폭 360 이하", (id) => {
    for (const p of sample(gen(id))) {
      expect(String(lineValue(scene(p))), p.prompt).toBe(p.answer);
      expect(scene(p).width).toBeLessThanOrEqual(360);
    }
  });

  it("세면서 표시하기는 교과서식 / ·✓ 표시를 쓰고, 묻는 종류의 수는 그림 설명에 없다", () => {
    const styles = new Set<string>();
    for (const p of [...sample(gen("l2-tally-read")), ...sample(gen("l2-tally-total"))]) {
      const v = scene(p);
      const style = v.label.match(/세면서 (\S+) 표시/)?.[1];
      expect(["/", "✓"], v.label).toContain(style);
      styles.add(style!);
      expect(figureOk(p), v.label).toBe(true);
    }
    expect([...styles].sort()).toEqual(["/", "✓"]);
    for (const p of sample(gen("l2-tally-read"))) {
      const kind = (scene(p).texts ?? []).slice(2).find((k) => new RegExp(` ${k.text}(은|는|을|를) `).test(p.prompt))!.text;
      expect(scene(p).label, p.prompt).not.toContain(`${kind} ${p.answer}개`);
    }
  });

  it("src 아래 모든 파일에 '바를 정' 한자가 없다(이 검사는 문자를 \\u6B63으로 쓴다)", () => {
    const BANNED = "\u6B63";
    const files = readdirSync(join(process.cwd(), "src"), { recursive: true, withFileTypes: true }).filter((f) => f.isFile());
    expect(files.length).toBeGreaterThan(50);
    const hits = files.map((f) => join(f.parentPath, f.name)).filter((path) => readFileSync(path, "utf8").includes(BANNED));
    expect(hits).toEqual([]);
  });

  it("'바를 정' 한자가 전 학년 문제·그림·개념 카드에 없다(2학년 교과서는 / ·✓ 표시)", () => {
    for (const u of units) {
      for (const s of u.standards) {
        for (const c of s.conceptCards) expect(`${c.title} ${c.body} ${c.example ?? ""}`, `${u.id}/${s.id}`).not.toContain("\u6B63");
        for (const g of s.generators)
          for (const p of sample(g, 20)) {
            const label = p.visual && "label" in p.visual ? p.visual.label : "";
            expect(`${visibleText(p)} ${label}`, g.id).not.toContain("\u6B63");
          }
      }
    }
  });

  it("l2-tally-read·l2-tally-total: 표시를 센 수로 구한 값이 정답", () => {
    for (const p of sample(gen("l2-tally-read"))) {
      const counts = tallyCounts(scene(p));
      const kind = [...counts.keys()].find((k) => p.prompt.includes(` ${k}`) && new RegExp(`${k}(은|는|을|를) `).test(p.prompt))!;
      expect(String(counts.get(kind)), p.prompt).toBe(p.answer);
    }
    for (const p of sample(gen("l2-tally-total"))) {
      const vals = [...tallyCounts(scene(p)).values()];
      const want = p.prompt.includes("합계") ? vals.reduce((s, c) => s + c, 0) : Math.max(...vals) - Math.min(...vals);
      expect(String(want), p.prompt).toBe(p.answer);
    }
  });
});

describe("2학년 공통 검사(docs/audit-v2 F0)", () => {
  const gens = [...new Map(gradeEntries(2).map((e) => [e.gen.id, e.gen])).values()];
  it.each(gens.map((g) => [g.id, g] as const))("%s: 힌트·풀이·오답 설명·보기·그림 글자까지 조사가 맞고, 숫자 서수(5째)와 값이 같은 보기가 없다", (_id, gen) => {
    expect(commonIssues(gen)).toEqual([]);
  });
});

describe("docs/audit-v2 g2s1·g2s2 치명·수정 필요 항목(F2)", () => {
  const SEEDS = 300;
  const labelOf = (p: { visual?: unknown }) => (p.visual as ShapeScene).label;
  /** 화면 글(문제·식·보기·힌트·풀이·오답 설명·그림 글자·그림 설명)의 수. 쉼표 수(1,000)는 붙여 읽는다 */
  const numbersIn = (text: string) => (text.replace(/(\d),(\d{3})/g, "$1$2").match(/\d+/g) ?? []).map(Number);

  it("2-1 덧셈과 뺄셈 단원: 화면 글의 뺄셈은 빼어지는 수가 99 이하, 덧셈은 두 수가 모두 99 이하(세 자리 수 계산은 3-1)", () => {
    for (const { gen: g } of entries.filter((e) => e.unit.id === "g2-s1-add-sub")) {
      for (const p of sample(g, SEEDS)) {
        for (const [whole, a, op, b] of screenText(p).matchAll(/(\d+) ([+−]) (\d+)/g)) {
          const ok = op === "−" ? Number(a) <= 99 : Number(a) <= 99 && Number(b) <= 99;
          expect(ok, `${g.id}: ${whole} / ${p.prompt}`).toBe(true);
        }
      }
    }
  });

  it("학기 범위의 수: 2-1은 999까지, 2-2는 9999까지(보기·그림·힌트·풀이 포함). 읽은 대로 이어 쓴 오답(l2-write3·4)만 한 자리 더", () => {
    for (const [semester, max] of [[1, 999], [2, 9999]] as const) {
      for (const e of entries.filter((x) => x.unit.semester === semester)) {
        const limit = e.gen.id === "l2-write3" || e.gen.id === "l2-write4" ? max * 10 + 9 : max;
        for (const p of sample(e.gen, 150)) {
          const big = numbersIn(screenText(p)).filter((n) => n > limit);
          expect(big, `${e.gen.id}: ${p.prompt}`).toEqual([]);
        }
      }
    }
  }, 30_000);

  it("2-1 곱셈 알아보기 차시 전에는 화면 글 어디에도 ×가 없고, 몇의 몇 배 차시 전에는 '몇의 몇 배'가 없다", () => {
    const order = entries.filter((e) => e.unit.semester === 1);
    const mulAt = order.findIndex((e) => e.standard.id === "mul-sentence");
    const timesAt = order.findIndex((e) => e.standard.id === "times-of");
    expect(timesAt).toBeGreaterThan(0);
    expect(mulAt).toBeGreaterThan(timesAt);
    order.forEach((e, i) => {
      if (i >= mulAt) return;
      for (const p of sample(e.gen, 100)) {
        const t = screenText(p);
        expect(t, `${e.standard.id}/${e.gen.id}`).not.toMatch(/×/);
        if (i < timesAt) expect(t, `${e.standard.id}/${e.gen.id}`).not.toMatch(/\d+의 \d+배/);
      }
    });
  });

  it("l2-box-story·l2-relation-fact·l2-relation-choose·l2-add22-compare·l2-sub-tens-wrong: 범위를 줄여도 정답 종류가 충분하다", () => {
    // □(정답)가 10대·일의 자리 9로 쏠리지 않는다: 1000시드에서 가장 많이 나온 정답이 4% 이하
    for (const id of ["l2-box-story", "l2-relation-fact"]) {
      const counts = new Map<string, number>();
      for (const p of sample(gen(id), 1000)) counts.set(p.answer, (counts.get(p.answer) ?? 0) + 1);
      expect(counts.size, id).toBeGreaterThanOrEqual(55);
      expect(Math.max(...counts.values()), id).toBeLessThanOrEqual(40);
    }
    expect(answerSet(gen("l2-relation-choose")).size).toBeGreaterThanOrEqual(300);
    expect(answerSet(gen("l2-add22-compare")).size).toBeGreaterThanOrEqual(100);
    expect(answerSet(gen("l2-sub-tens-wrong")).size).toBeGreaterThanOrEqual(50);
  });

  it("m2-carry-missing: 받아올림 자리 빈칸(4□ + 27 = 72)이라 덧셈 차시에서 뺄셈 없이 풀린다", () => {
    for (const p of sample(gen("m2-carry-missing"), SEEDS)) {
      const m = p.expression!.match(/^(\S+) \+ (\S+) = (\d+)$/);
      expect(m, p.expression).not.toBeNull();
      const fill = (x: string) => Number(x.replace("□", p.answer));
      const [a, b] = [fill(m![1]), fill(m![2])];
      expect(a + b, p.expression).toBe(Number(m![3]));
      expect(hasCarry(a % 10, b % 10), p.expression).toBe(true);
      expect(Math.min(a, b), p.expression).toBeGreaterThanOrEqual(10);
      expect(`${p.hint} ${p.explanation}`, p.expression).not.toMatch(/−/);
    }
    expect([...answerSet(gen("m2-carry-missing"))].sort()).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9"]);
  });

  it("place3·place4: 풀이에 곱셈 기호를 쓰지 않는다(네 자리 수 단원도 곱셈구구 전)", () => {
    for (const id of ["place3", "place4"]) for (const p of sample(gen(id))) expect(p.explanation, id).not.toMatch(/×/);
  });

  it("여러 가지 방법으로 세기 차시는 고유 유형(l2-count-boxes-eat)을 쓰고, 정답 종류가 줄지 않았다", () => {
    const s = entries.find((e) => e.standard.id === "count-many-ways")!.standard;
    expect(s.generators.map((g) => g.id)).not.toContain("w2-boxes-eat");
    expect(answerSet(gen("l2-count-boxes-eat")).size).toBeGreaterThanOrEqual(35);
  });

  it("그림 설명(aria-label)에 정답이 없다: 찾는 도형 이름·센 개수·잰 길이·읽을 시각", () => {
    const numberAnswer = ["l2-tri-count", "l2-quad-count", "l2-poly-count", "l2-circle-count", "l2-poly-vertex-sum", "l2-circle-many", "l2-blocks-count", "l2-blocks-more", "l2-blocks-layer", "l2-unit-times", "l2-cm-read"];
    for (const id of numberAnswer) {
      for (const p of sample(gen(id), 100)) expect(numbersIn(labelOf(p)), `${id}: ${labelOf(p)}`).not.toContain(Number(p.answer));
    }
    for (const id of ["l2-tri-find", "l2-quad-find", "l2-circle-find", "l2-tri-count", "l2-quad-count", "l2-poly-count", "l2-circle-count", "l2-poly-vertex-sum", "l2-poly-name", "l2-tangram-shape"]) {
      for (const p of sample(gen(id), 100)) expect(labelOf(p), id).not.toMatch(/삼각형|사각형|오각형|육각형|원/);
    }
    for (const p of sample(gen("l2-tangram-shape"), 100)) expect(labelOf(p)).not.toMatch(/변/);
    for (const p of sample(gen("l2-estimate-pic"), 100)) expect(labelOf(p)).not.toMatch(/약|\d+ cm인/);
    for (const p of sample(gen("l2-sort-wrong"), 100)) expect(labelOf(p)).not.toMatch(/다른/);
    // 시계를 읽는 문제: 그림 설명은 '바늘 시계'(시각을 적지 않는다)
    for (const id of ["l2-clock5", "l2-clock-error", "clock-read-minute", "l2-clock1-ticks", "l2-clock1-error", "l2-before-read", "l2-before-same"]) {
      for (const p of sample(gen(id), 100)) expect(labelOf(p), id).not.toMatch(/\d/);
    }
  });

  it("l2-m-est-stick: 그림 설명이 남은 길이까지 반영해 정답(약 n m 또는 약 n+1 m)과 맞는다", () => {
    for (const p of sample(gen("l2-m-est-stick"), SEEDS)) {
      const label = labelOf(p);
      const n = Number(label.match(/(\d+)번/)![1]);
      expect(label).not.toMatch(/조금 넘게/);
      if (Number(p.answer) === n) expect(label, label).toMatch(/조금 남은/);
      else {
        expect(Number(p.answer), label).toBe(n + 1);
        expect(label, label).toMatch(/못 미치게/);
      }
    }
  });

  it("l2-graph-how: 잘못 그린 까닭(정답 문장)이 3가지이고, 그림이 그 까닭과 맞는다", () => {
    expect(answerSet(gen("l2-graph-how")).size).toBe(3);
    let topFilled = 0;
    for (const p of sample(gen("l2-graph-how"), 600)) {
      const v = p.visual as ShapeScene;
      const asked = p.prompt.match(/ (\S+)의 그래프가 잘못된/)![1];
      const surveyed = Number(p.prompt.match(new RegExp(`${asked} (\\d+)명`))![1]);
      const col = v.texts!.find((t) => t.text === asked)!.at[0];
      const marks = v.circles!.filter((c) => Math.abs(c.c[0] - col) < 26);
      const rows = new Set(marks.map((c) => c.c[1]));
      expect(marks.length, p.answer).toBe(p.answer.includes("더 많이") ? surveyed + 1 : surveyed);
      expect(rows.size, p.answer).toBe(p.answer.includes("한 칸에 하나씩") ? surveyed - 1 : marks.length);
      // 맨 아래를 비우고 맨 위 칸(6)까지 채운 그림은 '위에서부터 그린' 모양과 같으므로 그 오답을 보기에 두지 않는다
      if (p.answer.includes("빈칸 없이") && surveyed + 1 === 6) {
        topFilled++;
        expect(p.choices).not.toContain("○를 위에서부터 그렸어요.");
      }
    }
    expect(topFilled).toBeGreaterThan(0);
  });

  it("l2-pattern-rotate: 풀이에 3학년 용어 '직각'이 없고 화살표가 나오는 차례로 설명한다", () => {
    for (const p of sample(gen("l2-pattern-rotate"), 100)) {
      expect(p.explanation).not.toMatch(/직각/);
      expect(p.explanation).toMatch(/ 차례로 /);
    }
  });

  it("0이 답이나 조건이 되지 않는다: w2-money4 동전 0개, w2-table-count 0개, l2-m-read·l2-m-sub 0 cm, l2-before-reverse 0분, l2-sort-legs 0가지", () => {
    for (const p of sample(gen("w2-money4"), SEEDS)) expect(p.prompt).not.toMatch(/ 0(개|장)/);
    for (const p of sample(gen("w2-table-count"), SEEDS)) expect(Number(p.answer)).toBeGreaterThanOrEqual(1);
    expect([...answerSet(gen("w2-table-count"))].map(Number).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    for (const id of ["l2-m-read", "l2-m-sub", "l2-before-reverse"]) for (const p of sample(gen(id), SEEDS)) expect(p.answer.split(",")[1], id).not.toBe("0");
    expect(answerSet(gen("l2-m-read")).size).toBeGreaterThanOrEqual(6);
    for (const p of sample(gen("l2-sort-legs"), SEEDS)) expect(Number(p.answer)).toBeGreaterThanOrEqual(1);
  });

  it("l2-clock1-error: 1분 단위 차시의 잘못 읽은 시각 문제는 1분 단위 시각(짧은바늘이 숫자 가까이에 있는 29분까지)", () => {
    const s = entries.find((e) => e.standard.id === "clock-1min")!.standard;
    expect(s.generators.map((g) => g.id)).not.toContain("l2-clock-error");
    for (const p of sample(gen("l2-clock1-error"), SEEDS)) {
      const m = Number(p.answer.match(/(\d+)분이에요/)![1]);
      expect(m % 5, p.answer).not.toBe(0);
      expect(m).toBeLessThanOrEqual(29);
      // 보기의 '숫자 k는 5k분' 문장은 그 시계의 숫자(풀이의 k)와 같다
      const k = Number(p.explanation.match(/긴바늘이 숫자 (\d+)\(/)![1]);
      for (const c of p.choices!) {
        const n = c.match(/지나온 숫자 (\d+)[은는] (\d+)분인데 (\d+)분으로/);
        if (n) expect([Number(n[1]), Number(n[2]), Number(n[3])], c).toEqual([k, 5 * k, k]);
      }
      // 시와 긴바늘 숫자가 같으면 두 바늘이 거의 겹쳐 '바꾸어 읽었다'도 말이 되므로 그 보기가 없다
      const h = Number(p.prompt.match(/시계를 보고 (\d+)시/)![1]);
      if (h === k) expect(p.choices!.join(" / "), p.prompt).not.toMatch(/바꾸어/);
    }
  });

  it("l2-chart-cond: 공통인 수가 하나뿐이면 '가장 큰/작은'을 묻지 않는다", () => {
    for (const p of sample(gen("l2-chart-cond"), SEEDS)) {
      const common = p.explanation.split(":")[1].split(",").length;
      if (/가장/.test(p.prompt)) expect(common, p.prompt).toBeGreaterThanOrEqual(2);
    }
  });

  it("l2-box-write: 오답 식도 문제에 나온 수만 쓴다(□의 값이 보기에 드러나지 않는다)", () => {
    for (const p of sample(gen("l2-box-write"), SEEDS)) {
      const shown = new Set(numbersIn(p.prompt));
      for (const c of p.choices!) for (const n of numbersIn(c)) expect(shown.has(n), `${p.prompt} / ${c}`).toBe(true);
    }
  });

  it("받아올림 차시의 l2-add21-cards·l2-add21-ineq는 받아올림이 있는 덧셈만", () => {
    for (const id of ["l2-add21-cards", "l2-add21-ineq"]) {
      for (const p of sample(gen(id), SEEDS)) {
        const [, a, b] = p.explanation.match(/(\d+) \+ (\d+)/)!.map(Number);
        expect(hasCarry(a % 10, b), `${id}: ${p.explanation}`).toBe(true);
      }
    }
  });

  it("다듬기: l2-estimate-judge 정답 위치가 고정되지 않고, l2-tally-read 풀이에 '0묶음'·'0개'가 없고, m2-times-diff는 6배까지", () => {
    const pos = new Set(sample(gen("l2-estimate-judge"), SEEDS).map((p) => p.choices!.indexOf(p.answer)));
    expect(pos.size).toBeGreaterThanOrEqual(3);
    for (const p of sample(gen("l2-tally-read"), SEEDS)) expect(p.explanation).not.toMatch(/ 0(묶음|개)/);
    for (const p of sample(gen("m2-times-diff"), SEEDS)) for (const [, b] of p.prompt.matchAll(/(\d+)배/g)) expect(Number(b)).toBeLessThanOrEqual(6);
  });
});

describe("R4: 1-1에서 뺀 l1-w-wrong-add9를 2-1 □ 구하기 차시로", () => {
  it("2-1 덧셈과 뺄셈 단원 □ 구하기(box-equation, [2수01-09]) 차시의 상 문제다", () => {
    const at = entries.filter((e) => e.gen.id === "l1-w-wrong-add9");
    expect(at.map((e) => `${e.unit.id}/${e.standard.id}`)).toEqual(["g2-s1-add-sub/box-equation"]);
    expect(at[0].standard.code).toBe("[2수01-09]");
    expect(at[0].gen.level).toBe(3);
  });

  it("정답 = (잘못 뺀 결과 + 더할 수) + 더할 수, 모든 수는 두 자리 수이고 99 이하, 받아올림·받아내림이 섞여 정답 종류가 충분하다", () => {
    let carry = 0;
    for (const p of sample(gen("l1-w-wrong-add9"), 300)) {
      const [a, r] = p.prompt.match(/\d+/g)!.map(Number);
      const x = r + a;
      expect(Number(p.answer)).toBe(x + a);
      for (const n of [a, r, x, x + a]) {
        expect(n).toBeGreaterThanOrEqual(10);
        expect(n).toBeLessThanOrEqual(99);
      }
      if (hasCarry(x, a)) carry++;
    }
    expect(carry).toBeGreaterThan(50);
    expect(answerSet(gen("l1-w-wrong-add9")).size).toBeGreaterThanOrEqual(40);
  });
});
