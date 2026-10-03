import { describe, expect, it } from "vitest";
import { units } from "../content";
import type { Problem } from "../content/types";
import { reduced } from "../content/generators/grade5";
import { answerRange, answerSet, commonIssues, figureOk, figureShare, gradeEntries, hasPicture, hasPlaceholder, oddAngles, sample, saysPicture, screenText, visibleText, wrongJosa } from "./quality-checks";

/**
 * 6학년 문항 품질 기준(docs/plan-quality.md Q6, docs/audit/g6.md 중요·보통).
 * 허용 목록 없음: 6학년에는 5의 배수가 아닌 각도가 나오지 않는다.
 */

const entries = gradeEntries(6);
const g6 = units.filter((u) => u.grade === 6);
const samples = new Map(entries.map((e) => [e.gen.id, sample(e.gen, 200)]));
const problems = (id: string): Problem[] => {
  const ps = samples.get(id);
  if (!ps) throw new Error(`${id} 없음`);
  return ps;
};
const offenders = (bad: (p: Problem) => boolean) => entries.filter((e) => problems(e.gen.id).some(bad)).map((e) => e.gen.id);

/** 도형·측정·그래프 단원: 차시마다 그림 문제 생성기가 절반 이상, 기본(하)은 모두 그림을 보고 푼다 */
const FIGURE_UNITS = [
  "g6-s1-prisms", // 각기둥과 각뿔: 겨냥도·전개도
  "g6-s1-graphs", // 여러 가지 그래프: 그림그래프·띠그래프·원그래프
  "g6-s1-volume-surface", // 직육면체의 부피와 겉넓이: 쌓기나무·겨냥도·전개도
  "g6-s2-space", // 공간과 입체: 쌓기나무, 위·앞·옆에서 본 모양, 층별 모양
  "g6-s2-circle-area", // 원의 넓이: 원·정다각형·색칠한 부분
  "g6-s2-round-solids", // 원기둥, 원뿔, 구: 겨냥도·전개도·돌리기
];

describe("6학년 품질 기준", () => {
  it("조사 자리표시(을(를) 등)가 없다", () => {
    expect(offenders(hasPlaceholder)).toEqual([]);
  });

  it("수·단위·□ 뒤의 조사가 받침과 맞는다", () => {
    expect(offenders((p) => wrongJosa(p).length > 0)).toEqual([]);
  });

  it("각도는 5의 배수다", () => {
    expect(offenders((p) => oddAngles(p).length > 0)).toEqual([]);
  });

  it("도형 그림은 그림 안에 있고 글자가 선·원 테두리·호와 겹치지 않는다", () => {
    expect(offenders((p) => !figureOk(p))).toEqual([]);
  });

  it('"그림을 보고/그림에서/그림과 같이"라고 하면 그림이 있다', () => {
    expect(offenders((p) => saysPicture(p) && !hasPicture(p))).toEqual([]);
  });

  it("도형·측정·그래프 단원의 차시는 그림 문제 생성기가 절반 이상이다", () => {
    const low = g6
      .filter((u) => FIGURE_UNITS.includes(u.id))
      .flatMap((u) => u.standards.map((s) => ({ id: `${u.id}/${s.id}`, share: figureShare(s) })))
      .filter((x) => x.share < 0.5);
    expect(low).toEqual([]);
  });

  it("도형·측정·그래프 단원의 기본(하) 문제는 모두 그림을 보고 푼다", () => {
    const noFig = g6
      .filter((u) => FIGURE_UNITS.includes(u.id))
      .flatMap((u) => u.standards.flatMap((s) => s.generators.filter((g) => g.level === 1)))
      .filter((g) => !problems(g.id).every(hasPicture))
      .map((g) => g.id);
    expect(noFig).toEqual([]);
  });

  it("차시마다 유형 5개 이상, 하1·중2·상2 이상이고 단원마다 차시 4개 이상", () => {
    for (const u of g6) {
      expect(u.standards.length, u.id).toBeGreaterThanOrEqual(4);
      for (const s of u.standards) {
        const count = (lv: number) => s.generators.filter((g) => g.level === lv).length;
        expect(s.generators.length, `${u.id}/${s.id}`).toBeGreaterThanOrEqual(5);
        expect([count(1) >= 1, count(2) >= 2, count(3) >= 2], `${u.id}/${s.id}`).toEqual([true, true, true]);
      }
    }
  });
});

/**
 * 띠그래프를 휴대폰 폭(288)으로 줄이면서 백분율 조합이 줄지 않게(R3): 시드 600개에서 main(0fde39a)과 같은
 * 서로 다른 문제 수·정답 종류. main 기준 값
 * - l6-band-read·l6-band-missing: 문제 400개, 정답 10~50(5 간격)
 * - l6-band-times: 177개, 2·3·4배 / l6-band-cond: 9개, 20·30·40(audit-v2 F6에서 과일 '배'를 빼고 조건을 넓혀 늘림)
 * - l6-band-count 563 · l6-band-percent 300 · l6-band-length 485 · l6-band-reverse 545 · l6-band-two-step 587
 * - l6-graph-change: 598개, 차 5~40 / l6-graph-kind: 184개
 */
describe("6학년 띠그래프 다양성(main 기준)", () => {
  const MAIN: [string, number, string[]?][] = [
    ["l6-band-read", 400, ["10", "15", "20", "25", "30", "35", "40", "45", "50"]],
    ["l6-band-missing", 400, ["10", "15", "20", "25", "30", "35", "40", "45", "50"]],
    ["l6-band-times", 177, ["2", "3", "4"]],
    ["l6-band-cond", 9, ["20", "30", "40"]],
    ["l6-band-count", 563],
    ["l6-band-percent", 300],
    ["l6-band-length", 485],
    ["l6-band-reverse", 545],
    ["l6-band-two-step", 587],
    ["l6-graph-change", 598, ["5", "10", "15", "20", "25", "30", "35", "40"]],
    ["l6-graph-kind", 184],
  ];
  it.each(MAIN)("%s: 서로 다른 문제 %i개 이상, 정답 종류가 줄지 않는다", (id, keys, answers) => {
    const gen = entries.find((e) => e.gen.id === id)!.gen;
    const ps = sample(gen, 600);
    expect(new Set(ps.map((p) => p.key)).size).toBeGreaterThanOrEqual(keys);
    if (answers) for (const a of answers) expect(new Set(ps.map((p) => p.answer)), `정답 ${a}`).toContain(a);
  });
});

describe("6학년 검수 중요·보통 항목", () => {
  it("l6-circle-times·l6-band-times: 몇 배인지 답이 2배 한 가지로 굳지 않는다", () => {
    for (const id of ["l6-circle-times", "l6-band-times"]) {
      const gen = gradeEntries(6).find((e) => e.gen.id === id)!.gen;
      const answers = new Set(sample(gen, 300).map((p) => p.answer));
      expect(answers.size, id).toBeGreaterThanOrEqual(2);
    }
  });

  it("교육과정 밖 개념(원가·이익, 부채꼴, 각뿔·원뿔 전개도, 각기둥·원기둥의 옆면 넓이)을 묻지 않는다", () => {
    expect(offenders((p) => /원가|이익|부채꼴|각뿔의 전개도|원뿔의 전개도/.test(visibleText(p)))).toEqual([]);
    // 직육면체의 겉넓이(6-1-6)는 교과서도 옆면의 넓이로 구하므로 각기둥·원기둥 단원만 본다
    const lateral = g6
      .filter((u) => ["g6-s1-prisms", "g6-s2-round-solids"].includes(u.id))
      .flatMap((u) => u.standards.flatMap((s) => s.generators))
      .filter((g) => problems(g.id).some((p) => /옆면(의| 전체의) 넓이/.test(visibleText(p))))
      .map((g) => g.id);
    expect(lateral).toEqual([]);
  });

  it("각기둥 차시(각기둥 알기)에는 각뿔 문제가 없다", () => {
    const prism = g6.find((u) => u.id === "g6-s1-prisms")!.standards.find((s) => s.id === "prism")!;
    for (const g of prism.generators.filter((x) => x.id !== "l6-prism-pick")) for (const p of problems(g.id)) expect(p.prompt, g.id).not.toContain("뿔");
  });

  it("whole-div-whole·w6-juice-share: 몫이 1보다 작은 (자연수)÷(자연수)", () => {
    for (const p of problems("whole-div-whole")) {
      const [a, b] = p.expression!.split(" ÷ ").map(Number);
      expect(a).toBeLessThan(b);
    }
    for (const p of problems("w6-juice-share")) {
      const [a, b] = p.prompt.match(/\d+/g)!.map(Number);
      expect(a).toBeLessThan(b);
    }
  });

  it("l6-fdw-multiple: 분자가 나누는 수의 배수인 진분수를 n/d로 쓴다", () => {
    for (const p of problems("l6-fdw-multiple")) {
      const m = p.expression!.match(/^(\d+)\/(\d+) ÷ (\d+)$/)!;
      const [n, d, k] = [Number(m[1]), Number(m[2]), Number(m[3])];
      expect(n).toBeLessThan(d);
      expect(n % k).toBe(0);
    }
  });

  it("l6-graph-judge·l6-mf-cmp: 정답 방향이 한쪽으로 고정되지 않는다", () => {
    const dirs = new Set(problems("l6-graph-judge").map((p) => (p.answer.includes("늘었") ? "up" : "down")));
    expect(dirs.size).toBe(2);
    expect(new Set(problems("l6-mf-cmp").map((p) => p.answer))).toEqual(new Set([">", "<", "="]));
  });

  it("비율은 대분수·n/1로 쓰지 않는다", () => {
    for (const p of problems("l6-ratio-frac")) expect(p.answer).not.toMatch(/ /);
    for (const id of ["l6-ratio-same-rate", "l6-ratio-prop-cond"]) for (const p of problems(id)) expect(p.prompt, id).not.toMatch(/비율이 \d+\/1\b/);
  });

  it("원주율 계산은 반지름 10 cm(지름 20 cm) 이하의 원으로 한다", () => {
    const ids = ["circumference", "circle-area", "l6-area-from-circ", "l6-area-reverse", "l6-semicircle", "l6-pi-compare", "l6-pi-error"];
    for (const id of ids)
      for (const p of problems(id)) {
        const r = [...visibleText(p).matchAll(/반지름이 (\d+) cm/g)].map((m) => Number(m[1]));
        const d = [...visibleText(p).matchAll(/지름이 (\d+) cm/g)].map((m) => Number(m[1]));
        for (const x of r) expect(x, id).toBeLessThanOrEqual(10);
        for (const x of d) expect(x, id).toBeLessThanOrEqual(20);
      }
  });

  it("w6-complete-cube·l6-stack-first: 쌓기나무 칸이 모두 변으로 이어져 있다(대각선으로만 닿는 덩어리 없음)", () => {
    const connected = (cells: [number, number][]) => {
      const seen = new Set([0]);
      const todo = [0];
      while (todo.length) {
        const [i, j] = cells[todo.pop()!];
        cells.forEach(([a, b], k) => {
          if (!seen.has(k) && Math.abs(a - i) + Math.abs(b - j) === 1) {
            seen.add(k);
            todo.push(k);
          }
        });
      }
      return seen.size === cells.length;
    };
    for (const id of ["w6-complete-cube", "l6-stack-first"])
      for (const [seed, p] of problems(id).entries()) {
        // key는 "id:위에서 본 모양의 수(뒤쪽 줄부터, 한 줄에 3칸)"
        const digits = p.key.split(":")[1];
        const cells = [...digits].flatMap((d, k): [number, number][] => (d === "0" ? [] : [[Math.floor(k / 3), k % 3]]));
        expect(connected(cells), `${id} seed ${seed}: ${digits}`).toBe(true);
      }
  });
});

describe("6학년 그림 검사 뒤에도 정답이 고르게 나온다", () => {
  const gen = (id: string) => entries.find((e) => e.gen.id === id)!.gen;
  it.each([
    ["l6-cone-fact", 4],
    ["l6-sphere-fact", 2],
    ["l6-cyl-fact", 3],
  ] as const)("%s: 겨냥도의 표시(㉠)마다 묻는 문제가 모두 나온다", (id, n) => {
    expect(answerSet(gen(id), 200).size).toBe(n);
  });
  it("l6-area-est-out: 반지름 2~10 cm 모두(10 cm처럼 긴 글자도 자리를 찾는다)", () => {
    expect(answerSet(gen("l6-area-est-out"), 400).size).toBe(18);
  });
});

describe("6학년 공통 검사(docs/audit-v2 F0)", () => {
  const gens = [...new Map(gradeEntries(6).map((e) => [e.gen.id, e.gen])).values()];
  it.each(gens.map((g) => [g.id, g] as const))("%s: 힌트·풀이·오답 설명·보기·그림 글자까지 조사가 맞고, 숫자 서수(5째)와 값이 같은 보기가 없다", (_id, gen) => {
    expect(commonIssues(gen)).toEqual([]);
  });
});

/* ── docs/audit-v2 g6s1·g6s2 재검수(F6) ── */

type Seg = [[number, number], [number, number]];
const segLen = ([a, b]: Seg) => Math.hypot(a[0] - b[0], a[1] - b[1]);
/** 그림의 모든 선분(선 + 다각형의 변) */
const segmentsOf = (p: Problem): Seg[] => {
  const v = p.visual;
  if (v?.kind !== "shape") return [];
  return [...(v.lines ?? []).map((l): Seg => [l.from, l.to]), ...(v.polygons ?? []).flatMap((g) => g.points.map((q, i): Seg => [q, g.points[(i + 1) % g.points.length]]))];
};
/** 점에서 선분까지 거리 */
const distToSeg = (pt: [number, number], [a, b]: Seg) => {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const t = Math.max(0, Math.min(1, ((pt[0] - a[0]) * dx + (pt[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(pt[0] - a[0] - t * dx, pt[1] - a[1] - t * dy);
};
/** 글자(예: "4 cm", "㉠")가 가리키는 선분(가장 가까운 선분)의 그린 길이 */
const drawnLen = (p: Problem, label: string): number => {
  const v = p.visual;
  if (v?.kind !== "shape") return NaN;
  const t = (v.texts ?? []).find((x) => x.text === label);
  if (!t) return NaN;
  const segs = segmentsOf(p).filter((s) => segLen(s) > 1);
  return segLen(segs.reduce((b, s) => (distToSeg(t.at, s) < distToSeg(t.at, b) ? s : b)));
};
/** 색칠한 다각형(각기둥의 옆면)의 가로(첫 변)와 세로(둘째 변) */
const shadedSides = (p: Problem): [number, number] => {
  const v = p.visual;
  const g = v?.kind === "shape" ? (v.polygons ?? []).find((x) => x.fill === true) : undefined;
  if (!g) return [NaN, NaN];
  return [segLen([g.points[0], g.points[1]]), segLen([g.points[1], g.points[2]])];
};
const cmNums = (p: Problem) => {
  const v = p.visual;
  return v?.kind === "shape" ? (v.texts ?? []).map((t) => t.text).filter((t) => /^\d+ cm$/.test(t)) : [];
};
const lessonOf = (unitId: string, stdId: string) => g6.find((u) => u.id === unitId)!.standards.find((s) => s.id === stdId)!;
const genOf = (id: string) => entries.find((e) => e.gen.id === id)!.gen;
const places = (x: string) => (x.split(".")[1] ?? "").length;

describe("6-1 재검수: 차시 순서(다음 차시 내용을 앞 차시에 쓰지 않는다)", () => {
  it("frac-div-whole: (분수)÷(자연수)를 곱셈으로 나타내는 차시는 기약인 진분수만(대분수는 다음 차시)", () => {
    for (const p of problems("frac-div-whole")) {
      const m = p.expression!.match(/^(\d+)\/(\d+) ÷ (\d+)$/);
      expect(m, p.expression).not.toBeNull();
      const [n, d] = [Number(m![1]), Number(m![2])];
      expect(n).toBeLessThan(d);
      expect(reduced(n, d)).toBe(`${n}/${d}`);
    }
    // 대분수(조합의 절반)를 빼는 대신 분모·나누는 수 범위를 넓혀 서로 다른 문제 수를 보완(main 300시드 208개)
    expect(new Set(sample(genOf("frac-div-whole"), 600).map((p) => p.key)).size).toBeGreaterThanOrEqual(250);
  });

  it("각기둥 알기·각뿔 알기 차시는 ○각기둥·○각뿔의 이름과 면·모서리·꼭짓점의 수를 쓰지 않는다", () => {
    for (const id of ["prism", "pyramid"]) {
      const s = lessonOf("g6-s1-prisms", id);
      for (const g of s.generators)
        for (const p of problems(g.id)) {
          const text = screenText(p);
          expect(text, `${id}/${g.id}`).not.toMatch(/[삼사오육칠팔구십]각(기둥|뿔)/);
          expect(text, `${id}/${g.id}`).not.toMatch(/(꼭짓점|모서리)(이|가|은|는|의 수)? ?\d*개|모든 모서리/);
        }
    }
  });

  it("각기둥 차시들(알기·이름과 구성 요소·전개도)의 보기에는 각뿔이 없다(각뿔은 그다음 차시)", () => {
    for (const id of ["prism", "prism-parts", "prism-net"])
      for (const g of lessonOf("g6-s1-prisms", id).generators) for (const p of problems(g.id)) expect((p.choices ?? []).join(" "), `${id}/${g.id}`).not.toContain("뿔");
  });

  it("옮긴 생성기: 이름·구성 요소의 수를 쓰는 생성기는 '이름과 구성 요소' 차시에, prism-name은 하", () => {
    const ids = (id: string) => lessonOf("g6-s1-prisms", id).generators.map((g) => g.id);
    expect(ids("prism-parts")).toContain("l6-prism-conditions");
    expect(ids("pyramid-parts")).toEqual(expect.arrayContaining(["prism-name", "l6-pyramid-conditions", "l6-pyramid-edge-length"]));
    expect(genOf("prism-name").level).toBe(1);
  });

  it("밑면이 하나로 정해지지 않는 사각기둥(직육면체)·삼각뿔로 밑면·옆면을 묻지 않는다", () => {
    for (const [id, bad] of [
      ["l6-prism-face-shape", "밑면이 사각형인 각기둥"],
      ["l6-pyramid-face-shape", "밑면이 삼각형인 각뿔"],
    ] as const) {
      const ps = sample(genOf(id), 400);
      for (const p of ps) if (p.prompt.includes("색칠한 면")) expect(p.visual?.kind === "shape" && p.visual.label, id).not.toContain(bad);
      // 다시 뽑지 않고 n만 바꾸므로 표시 종류(정답)는 모두 나온다
      expect(new Set(ps.map((p) => p.answer)).size, id).toBe(5);
    }
  });

  it("e6-prism-base: 밑면의 모양만 묻는다(이름은 다음 차시)", () => {
    for (const p of problems("e6-prism-base")) expect(p.answer).toMatch(/각형$/);
  });

  it("소수의 나눗셈 앞 세 차시: 0을 내리는 나눗셈·(자연수)÷(자연수)가 없다", () => {
    // 화면 글의 '(소수) ÷ (자연수)' 식마다 나누어지는 수가 자연수가 아니고, 몫의 소수 자릿수 ≤ 나누어지는 수의 소수 자릿수
    const bad: string[] = [];
    for (const id of ["dec-natural", "dec-whole", "dec-small"])
      for (const g of lessonOf("g6-s1-dec-div", id).generators)
        for (const p of problems(g.id)) {
          const text = [p.prompt, p.expression ?? "", ...(p.choices ?? []), p.explanation].join(" ");
          for (const [, a, k] of text.matchAll(/(?<![\d.])(\d+(?:\.\d+)?) ÷ (\d+)(?![\d./])/g)) {
            // 자연수의 나눗셈을 이용하는 차시(dec-natural)는 이용할 자연수 식(369 ÷ 3)을 함께 보여 준다
            if (!a.includes(".")) {
              if (id !== "dec-natural") bad.push(`${g.id}: ${a} ÷ ${k}`);
              continue;
            }
            const q = String(Number((Number(a) / Number(k)).toFixed(6)));
            if (places(q) > places(a)) bad.push(`${g.id}: ${a} ÷ ${k} = ${q}`);
          }
        }
    expect([...new Set(bad)].slice(0, 10)).toEqual([]);
  });

  it("l6-dd-cm·l6-dd-card·w6-wire-cut·l6-dd-compare: 0을 내리지 않고, 카드·철사·비교 문제는 몫에 0이 없다", () => {
    for (const p of problems("l6-dd-cm")) {
      const [, a] = p.prompt.match(/색 테이프 ([\d.]+) m를 (\d+)명/)!;
      expect(a, p.prompt).toContain(".");
      expect(places(p.answer)).toBeLessThanOrEqual(places(a));
    }
    for (const p of problems("l6-dd-card")) {
      expect(places(p.answer)).toBeLessThanOrEqual(2);
      expect(Number(p.answer)).toBeGreaterThan(1);
      expect(p.answer.replace(".", "")).not.toContain("0");
    }
    for (const p of problems("w6-wire-cut")) {
      const piece = p.explanation.match(/÷ \d+ = ([\d.]+)/)![1];
      expect(piece, p.explanation).not.toContain("0");
    }
    for (const p of problems("l6-dd-compare"))
      for (const c of p.choices!) {
        const [a, k] = c.split(" ÷ ").map(Number);
        expect(a / k, c).toBeGreaterThan(1);
        expect(String(Number((a / k).toFixed(6))).replace(".", ""), c).not.toContain("0");
      }
  });

  it("l6-dd-small-compare: 사과 한 개는 0.15~0.45 kg", () => {
    for (const p of problems("l6-dd-small-compare"))
      for (const m of p.prompt.matchAll(/사과 (\d+)개가 ([\d.]+) kg/g)) {
        const one = Number(m[2]) / Number(m[1]);
        expect(one).toBeGreaterThanOrEqual(0.15);
        expect(one).toBeLessThanOrEqual(0.45);
      }
  });

  it("부피 비교하기 차시에는 (가로)×(세로)×(높이) 공식이 필요한 문제가 없고, 옮긴 두 생성기는 부피 구하기 차시에 있다", () => {
    const cmp = lessonOf("g6-s1-volume-surface", "volume-compare");
    const ids = cmp.generators.map((g) => g.id);
    expect(ids).not.toContain("l6-vol-compare");
    expect(ids).not.toContain("l6-vol-diff");
    expect(lessonOf("g6-s1-volume-surface", "volume").generators.map((g) => g.id)).toEqual(expect.arrayContaining(["l6-vol-compare", "l6-vol-diff"]));
    for (const g of cmp.generators) for (const p of problems(g.id)) expect(screenText(p), g.id).not.toMatch(/\(가로\) × \(세로\) × \(높이\)/);
    expect(answerSet(genOf("l6-vol-block-compare"), 300)).toEqual(new Set([">", "<", "="]));
  });
});

describe("6-1 재검수: 그림 비례와 그림·문장 일치", () => {
  /** 그린 비(세로 ÷ 가로)가 적힌 비와 15% 안팎에서 같다 */
  const near = (drawn: number, stated: number, msg: string) => {
    expect(drawn / stated, msg).toBeGreaterThan(0.85);
    expect(drawn / stated, msg).toBeLessThan(1.18);
  };

  it("l6-prism-side-perimeter·l6-prism-base-perimeter: 색칠한 옆면의 가로·세로를 밑면의 한 변·높이의 비대로 그린다", () => {
    for (const p of problems("l6-prism-side-perimeter")) {
      const a = Number(cmNums(p)[0].split(" ")[0]);
      const [w, h] = shadedSides(p);
      near(h / w, Number(p.answer) / a, p.prompt);
    }
    for (const p of problems("l6-prism-base-perimeter")) {
      const h = Number(cmNums(p)[0].split(" ")[0]);
      const P = Number(p.prompt.match(/둘레가 (\d+) cm/)![1]);
      const a = (P - 2 * h) / 2;
      const [w, hh] = shadedSides(p);
      near(hh / w, h / a, p.prompt);
    }
  });

  it("l6-prism-edge-length·l6-net-perimeter·l6-net-height-reverse·l6-pyramid-side-perimeter: 적힌 두 길이의 비대로 그린다", () => {
    for (const id of ["l6-prism-edge-length", "l6-net-perimeter"])
      for (const p of problems(id)) {
        const [a, h] = cmNums(p);
        near(drawnLen(p, h) / drawnLen(p, a), Number(h.split(" ")[0]) / Number(a.split(" ")[0]), `${id} ${p.key}`);
      }
    for (const id of ["l6-net-height-reverse", "l6-pyramid-side-perimeter"])
      for (const p of problems(id)) {
        const [a] = cmNums(p);
        near(drawnLen(p, "㉠") / drawnLen(p, a), Number(p.answer) / Number(a.split(" ")[0]), `${id} ${p.key}`);
      }
  });

  it("비례를 맞춰도 서로 다른 문제 수·정답 종류가 줄지 않는다(main 기준: 문제 181·209·171·171, 정답 10·66·67·10)", () => {
    const base: [string, number, number][] = [
      ["l6-prism-side-perimeter", 181, 10],
      ["l6-prism-edge-length", 209, 66],
      ["l6-net-perimeter", 171, 67],
      ["l6-net-height-reverse", 171, 10],
    ];
    for (const [id, keys, answers] of base) {
      const ps = sample(genOf(id), 300);
      expect(new Set(ps.map((p) => p.key)).size, id).toBeGreaterThanOrEqual(keys);
      expect(new Set(ps.map((p) => p.answer)).size, id).toBeGreaterThanOrEqual(answers);
    }
  });

  it("l6-prism-side-perimeter·l6-prism-base-perimeter·l6-prism-edge-length: 비례를 맞춰도 밑면의 모양(n)이 고르게 나온다", () => {
    for (const id of ["l6-prism-side-perimeter", "l6-prism-base-perimeter", "l6-prism-edge-length"]) {
      const ps = sample(genOf(id), 600);
      const label = (p: Problem) => (p.visual?.kind === "shape" ? p.visual.label : "");
      const kinds = id === "l6-prism-edge-length" ? ["삼각기둥", "사각기둥", "오각기둥", "육각기둥"] : null;
      if (kinds) for (const k of kinds) expect(ps.filter((p) => label(p).includes(k)).length / ps.length, `${id} ${k}`).toBeGreaterThan(0.18);
      else {
        // 삼각기둥: 밑면의 변 3개(겨냥도 선 9개)
        const tri = ps.filter((p) => p.visual?.kind === "shape" && p.visual.lines!.length === 9).length / ps.length;
        expect(tri, id).toBeGreaterThan(id === "l6-prism-base-perimeter" ? 0.28 : 0.2);
      }
    }
  });

  it("l6-surf-open-box: 뚜껑 없는 상자는 그림에서도 윗면이 열려 있다(안쪽 벽 무늬, '색칠한 부분'과 헷갈리지 않게 칠하지 않음)", () => {
    for (const p of problems("l6-surf-open-box")) {
      const v = p.visual;
      expect(v?.kind).toBe("shape");
      if (v?.kind !== "shape") continue;
      expect(v.polygons!.some((g) => g.fill === "paper" && g.points.length === 3), p.key).toBe(true);
      expect(v.polygons!.some((g) => g.fill === true), p.key).toBe(false);
      expect(v.label).toContain("윗면이 열려");
    }
  });
});

describe("6-1 재검수: 문장과 다양성", () => {
  it("l6-band-cond: 과일 '배'를 쓰지 않고, 백분율끼리의 차는 '~만큼 큽니다'로 쓴다", () => {
    for (const p of problems("l6-band-cond")) {
      expect(p.prompt).not.toMatch(/배는|배가|\d+% 많/);
      expect(p.prompt).toContain("만큼 큽니다");
    }
  });

  it("l6-ratio-write: 비를 배우는 단원이라 과일 '배'를 쓰지 않는다", () => {
    for (const p of problems("l6-ratio-write")) expect(p.prompt).not.toMatch(/배가|배의/);
  });

  it.each([
    ["l6-band-cond", 30, 7],
    ["w6-circle-graph-rest", 15, 6],
    ["l6-vol-block-compare", 60, 3],
    ["l6-vol-block-diff", 60, 15],
  ] as const)("%s: 서로 다른 문제 %i개 이상, 정답 %i종 이상", (id, keys, answers) => {
    const ps = sample(genOf(id), 600);
    expect(new Set(ps.map((p) => p.key)).size).toBeGreaterThanOrEqual(keys);
    expect(new Set(ps.map((p) => p.answer)).size).toBeGreaterThanOrEqual(answers);
  });

  it("circle-graph-percent: □는 마지막 항목에만 나오지 않는다", () => {
    const at = new Set(
      problems("circle-graph-percent")
        .map((p) => (p.visual?.kind === "shape" ? (p.visual.texts ?? []).findIndex((t) => t.text === "□%") : -1))
        .filter((i) => i >= 0),
    );
    expect(at.size).toBeGreaterThan(1);
  });

  it("l6-fdw-unit-count: 정답 1(1/d이 1개)이 없고, 분수는 기약분수", () => {
    for (const p of problems("l6-fdw-unit-count")) {
      expect(Number(p.answer)).toBeGreaterThanOrEqual(2);
      const [n, d] = p.prompt.match(/^(\d+)\/(\d+)/)!.slice(1).map(Number);
      expect(reduced(n, d)).toBe(`${n}/${d}`);
    }
  });

  it("percent-of: 금액에 쉼표를 쓴다", () => {
    for (const p of problems("percent-of")) expect(p.prompt).not.toMatch(/\d{4,}원/);
  });
});

describe("6-2 재검수", () => {
  it("쌓기나무: 위에서 본 모양을 key에 담는 공간과 입체 단원 생성기는 모두 변으로 이어진 한 덩어리다(makeGrid 공통)", () => {
    const connected = (digits: string) => {
      const cells = [...digits].flatMap((d, k): [number, number][] => (d === "0" ? [] : [[Math.floor(k / 3), k % 3]]));
      const seen = new Set([0]);
      const todo = [0];
      while (todo.length) {
        const [i, j] = cells[todo.pop()!];
        cells.forEach(([a, b], k) => {
          if (!seen.has(k) && Math.abs(a - i) + Math.abs(b - j) === 1) {
            seen.add(k);
            todo.push(k);
          }
        });
      }
      return seen.size === cells.length;
    };
    const checked = new Set<string>();
    for (const g of g6.find((u) => u.id === "g6-s2-space")!.standards.flatMap((s) => s.generators))
      for (const p of problems(g.id))
        for (const part of p.key.split(":").slice(1))
          if (/^\d+$/.test(part) && part.length % 3 === 0 && part.length >= 6) {
            checked.add(g.id);
            expect(connected(part), `${g.id} ${part}`).toBe(true);
          }
    expect(checked.size).toBeGreaterThanOrEqual(16);
  });

  it("쌓기나무: 연결 검사 뒤에도 정답 종류가 고르게 나온다(떨어진 모양에서만 나오던 4개 등은 빠짐)", () => {
    expect(answerSet(genOf("cube-stack"), 1000)).toEqual(new Set(answerRange(5, 16, 1)));
    expect(answerSet(genOf("l6-layer-count"), 1000)).toEqual(new Set(answerRange(5, 16, 1)));
    expect(answerSet(genOf("l6-row-front"), 1000)).toEqual(new Set(answerRange(5, 12, 1)));
    expect(answerSet(genOf("l6-stack-count"), 1000)).toEqual(new Set(answerRange(5, 14, 1)));
  });

  it("dec-div-round·w6-fuel: 나누어떨어지지 않고 반올림한 값이 자연수가 아니며, 연비는 8~20 km", () => {
    for (const p of problems("dec-div-round")) {
      const [a, b] = p.prompt.match(/(\d+) ÷ (\d+)/)!.slice(1).map(Number);
      expect(a % b).not.toBe(0);
      expect(p.answer).toContain(".");
    }
    for (const p of problems("w6-fuel")) {
      const [l, km] = p.prompt.match(/휘발유 ([\d.]+) L로 (\d+) km/)!.slice(1).map(Number);
      expect(Number.isInteger(Number(((km / l) * 1000).toFixed(6))), p.prompt).toBe(false);
      expect(Number(p.answer)).toBeGreaterThanOrEqual(8);
      expect(Number(p.answer)).toBeLessThanOrEqual(20);
      expect(p.answer).toContain(".");
    }
  });

  it("자릿수가 같은 (소수)÷(소수) 차시: 나누는 수·나누어지는 수가 모두 소수 한 자리(dec-div-dec·l6-dds-compare·l6-dds-rect)", () => {
    for (const p of problems("dec-div-dec")) for (const x of p.expression!.split(" = ")[0].split(" ÷ ")) expect(places(x), p.expression).toBe(1);
    for (const p of problems("l6-dds-compare")) for (const c of p.choices!) for (const x of c.split(" ÷ ")) expect(places(x), c).toBe(1);
    for (const p of problems("l6-dds-rect")) {
      const [A, w] = p.prompt.match(/넓이가 ([\d.]+) m²이고 가로가 ([\d.]+) m/)!.slice(1);
      expect([places(A), places(w)], p.prompt).toEqual([1, 1]);
    }
  });

  it("l6-wf-error: 나누는 분수는 기약분수이고, 이 차시 방법((자연수)÷(분자)×(분모))으로 설명한다", () => {
    for (const p of problems("l6-wf-error")) {
      const [n, d] = p.prompt.match(/÷ (\d+)\/(\d+)/)!.slice(1).map(Number);
      expect(reduced(n, d)).toBe(`${n}/${d}`);
      expect(p.hint).not.toContain("바꾸어 곱");
    }
  });

  it("l6-wf-price-compare: 고기 1 kg의 값은 1만~4만 원, 정답 종류가 줄지 않는다(main 38종)", () => {
    for (const p of problems("l6-wf-price-compare")) {
      expect(Number(p.answer)).toBeGreaterThanOrEqual(10000);
      expect(Number(p.answer)).toBeLessThanOrEqual(40000);
    }
    expect(answerSet(genOf("l6-wf-price-compare"), 600).size).toBeGreaterThanOrEqual(38);
  });

  it("l6-sd-reverse(상): 잘못 곱한 결과로 어떤 분수를 구한 뒤 나누는 두 단계이고, 정답이 맞다", () => {
    for (const p of problems("l6-sd-reverse")) {
      const m = p.prompt.match(/어떤 분수를 (\d+)\/(\d+)\S* 나누어야 할 것을 잘못하여 곱했더니 (\d+)\/(\d+)/)!;
      const [k, d, top, bottom] = m.slice(1).map(Number);
      expect(bottom).toBe(d * d);
      expect(top / k / k).toBe(Number(p.answer));
    }
    expect(new Set(sample(genOf("l6-sd-reverse"), 600).map((p) => p.key)).size).toBeGreaterThanOrEqual(60);
  });

  it("w6-print-time(상): 남은 장수를 먼저 구하는 두 단계이고, 남은 장수가 한 번에 복사하는 장수의 배수가 아닌 경우도 있다", () => {
    let notMultiple = 0;
    for (const p of problems("w6-print-time")) {
      const [m, sheets, total, done] = p.prompt.match(/(\d+)분 동안 (\d+)장.*모두 (\d+)장.*지금까지 (\d+)장/)!.slice(1).map(Number);
      const rest = total - done;
      expect((m * rest) / sheets).toBe(Number(p.answer));
      if (rest % sheets !== 0) notMultiple++;
    }
    expect(notMultiple).toBeGreaterThan(0);
  });

  it("l6-square-minus-circle: '크기가 같은 원'은 원이 4개일 때만, l6-pizza-compare: 무엇과 무엇의 차인지 괄호로 나눈다", () => {
    for (const p of problems("l6-square-minus-circle")) {
      const four = p.visual?.kind === "shape" && p.visual.label.includes("원 4개");
      expect(p.prompt.includes("크기가 같은 원 4개"), p.key).toBe(four);
    }
    for (const p of problems("l6-pizza-compare")) expect(p.prompt).toContain("(큰 피자 1판의 넓이)와 (작은 피자 2판의 넓이의 합)의 차");
  });

  it("l6-solid-guess(상): 조건 하나만으로는 입체도형이 정해지지 않고, 판별한 뒤 앞에서 본 모양의 넓이를 구한다", () => {
    const facts: Record<string, string[]> = {
      "굽은 면이 있습니다.": ["원기둥", "원뿔", "구"],
      "평평한 면이 있습니다.": ["원기둥", "원뿔", "각기둥", "각뿔"],
      "꼭짓점이 없습니다.": ["원기둥", "구"],
      "밑면이 2개입니다.": ["원기둥", "각기둥"],
      "밑면이 1개입니다.": ["원뿔", "각뿔"],
      "밑면이 원입니다.": ["원기둥", "원뿔"],
    };
    for (const p of problems("l6-solid-guess")) {
      const clues = p.prompt.split("\n· ").slice(1);
      expect(clues.length).toBeGreaterThanOrEqual(2);
      for (const c of clues) expect(facts[c]?.length, c).toBeGreaterThan(1);
      const left = ["원기둥", "원뿔", "구", "각기둥", "각뿔"].filter((x) => clues.every((c) => facts[c].includes(x)));
      expect(left.length, p.prompt).toBe(1);
      const [D, H] = p.prompt.match(/지름이 (\d+) cm, 높이가 (\d+) cm/)!.slice(1).map(Number);
      expect(Number(p.answer)).toBe(left[0] === "원기둥" ? D * H : (D * H) / 2);
    }
    expect(new Set(sample(genOf("l6-solid-guess"), 300).map((p) => p.key)).size).toBeGreaterThanOrEqual(100);
  });

  it("다듬기: whole-div-frac(중)는 단위분수로 나누지 않고, m6-simple-ratio 보기는 전항=후항이 없고, l6-simplify-mix는 1 : 1이 아니다", () => {
    for (const p of problems("whole-div-frac")) expect(p.expression).not.toMatch(/÷ 1\//);
    for (const p of problems("m6-simple-ratio")) for (const c of p.choices!) expect(c.split(" : ")[0], c).not.toBe(c.split(" : ")[1]);
    for (const p of problems("l6-simplify-mix")) expect(p.answer).not.toBe("1 : 1");
  });
});
