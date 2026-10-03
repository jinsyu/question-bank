import { describe, expect, it } from "vitest";
import { units } from "../content";
import type { Generator, Problem } from "../content/types";
import { SOLID_CLAIMS, type ShapeClaims } from "../content/lessons/g1";
import { FLAT_CLAIMS, FLATS } from "../content/lessons/g1-s2";
import { createRandom } from "../lib/random";

/** 1학년 치명 결함(docs/audit/g1.md) 재발 방지 */
const byId = new Map<string, Generator>();
for (const u of units.filter((x) => x.grade === 1))
  for (const s of u.standards) for (const g of s.generators) byId.set(g.id, g);

const SEEDS = 300;
function samples(id: string): Problem[] {
  const g = byId.get(id);
  if (!g) throw new Error(`${id} 생성기가 1학년 차시에 없어요`);
  return Array.from({ length: SEEDS }, (_, seed) => g.make(createRandom(seed)));
}

describe.each([
  ["l1-w-feature-error", SOLID_CLAIMS],
  ["l1-w-flat-error", FLAT_CLAIMS],
] as [string, ShapeClaims[]][])("%s: 주어로 답이 드러나지 않는다", (id, claims) => {
  it("옳은 말과 틀린 말이 겹치지 않고, 친구 말은 틀린 말·고친 말은 옳은 말이다", () => {
    for (const c of claims) {
      expect(c.truths.filter((t) => c.falses.includes(t))).toEqual([]);
      expect(c.falses.length).toBeGreaterThanOrEqual(4);
      for (const { say, fix } of c.says) {
        expect(c.falses).toContain(say);
        expect(c.truths).toContain(fix);
      }
      for (const line of [...c.truths, ...c.falses]) expect(line.startsWith(`${c.subject}은`)).toBe(true);
    }
  });

  it("보기 4개가 모두 인용한 모양에 대한 말이고, 옳은 말은 정답 하나뿐이다", () => {
    for (const p of samples(id)) {
      const c = claims.find((x) => p.prompt.includes(`"${x.subject}은`))!;
      expect(c, p.prompt).toBeDefined();
      expect(p.choices).toHaveLength(4);
      expect(new Set(p.choices).size).toBe(4);
      for (const ch of p.choices!) expect(ch.startsWith(`${c.subject}은`), ch).toBe(true);
      expect(p.choices!.filter((ch) => c.truths.includes(ch))).toEqual([p.answer]);
      expect(p.choices!.some((ch) => p.prompt.includes(`"${ch}"`))).toBe(false);
    }
  });
});

describe("l1-flat-odd: 보기 이름에 모양이 없고 정답이 하나다", () => {
  const shapeOf = (item: string) => Object.keys(FLATS).filter((k) => FLATS[k].includes(item));

  it("물건 이름에 모양 기호·괄호가 없고, 물건마다 모양이 하나로 정해진다", () => {
    const all = Object.values(FLATS).flat();
    for (const item of all) expect(item, item).not.toMatch(/[△□○()]/);
    expect(new Set(all).size).toBe(all.length);
    for (const ambiguous of ["시계", "교통 표지판"]) expect(all.some((x) => x.includes(ambiguous))).toBe(false);
  });

  it("그림의 물건 네 개 중 다른 모양은 정답 하나뿐이다", () => {
    // 보기는 그림 번호(①~④), 그림에 그린 물건은 key에 순서대로 들어 있다
    for (const p of samples("l1-flat-odd")) {
      const names = p.key.split(":")[1].split(",");
      expect(names).toHaveLength(4);
      const shapes = names.map((c) => shapeOf(c));
      for (const s of shapes) expect(s).toHaveLength(1);
      const answerShape = shapes[["①", "②", "③", "④"].indexOf(p.answer)][0];
      expect(shapes.filter(([s]) => s === answerShape)).toHaveLength(1);
      expect(new Set(shapes.map(([s]) => s)).size).toBe(2);
    }
  });

  it.each(["l1-flat-object", "l1-flat-feature", "l1-flat-odd"])("%s: 보기에 모양 표기가 없다", (id) => {
    for (const p of samples(id)) for (const c of p.choices!) expect(c).not.toMatch(/[△□○()]/);
  });
});

describe.each([
  ["w1-longest", /막대 ([가나다라])는 막대 ([가나다라])보다 (?:길고|깁니다)/g],
  ["w1-widest", /종이 ([가나다라])는 종이 ([가나다라])보다 (?:넓고|넓습니다)/g],
] as [string, RegExp][])("%s: 기호로 비교하고 조건으로 답이 하나로 정해진다", (id, relation) => {
  it("실제 물건 이름·'은(는)' 조사가 없다", () => {
    for (const p of samples(id)) {
      expect(p.prompt).not.toContain("(는)");
      expect(p.prompt).not.toMatch(/연필|크레파스|붓|공책|스케치북|달력|손수건|방석|엽서/);
    }
  });

  it("문장의 관계만으로 가장 큰(작은) 것이 정답이다", () => {
    for (const p of samples(id)) {
      const pairs = [...p.prompt.matchAll(relation)].map((m) => [m[1], m[2]] as const);
      expect(pairs, p.prompt).toHaveLength(3);
      const marks = ["가", "나", "다", "라"];
      const biggest = marks.filter((x) => !pairs.some(([, small]) => small === x));
      const smallest = marks.filter((x) => !pairs.some(([big]) => big === x));
      expect(biggest).toHaveLength(1);
      expect(smallest).toHaveLength(1);
      const expected = p.prompt.includes("가장 짧은") ? smallest[0] : biggest[0];
      expect(p.answer, p.prompt).toBe(expected);
      expect(p.choices).toContain(p.answer);
    }
  });
});

describe("l1-w-chart-nth: 수 배열표(한 줄 10칸)에서 줄을 넘기지 않는다", () => {
  const ORD = ["첫째", "둘째", "셋째", "넷째", "다섯째", "여섯째"];

  it("대각선 경로가 오른쪽 끝을 넘지 않고 답이 맞다", () => {
    let diagCount = 0;
    for (const p of samples("l1-w-chart-nth")) {
      const start = Number(p.prompt.match(/(\d+)부터/)![1]);
      const nth = ORD.findIndex((o) => p.prompt.includes(`${o}로 색칠`)) + 1;
      const diag = p.prompt.includes("↘");
      expect(nth).toBeGreaterThan(0);
      let [row, col] = [Math.floor((start - 1) / 10), (start - 1) % 10];
      for (let i = 1; i < nth; i++) {
        row += 1;
        if (diag) col += 1;
        expect(col, p.prompt).toBeLessThanOrEqual(9);
      }
      expect(Number(p.answer), p.prompt).toBe(row * 10 + col + 1);
      if (diag) diagCount++;
    }
    expect(diagCount).toBeGreaterThan(0);
  });
});
