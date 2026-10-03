import { describe, expect, it } from "vitest";
import { units } from "../content";
import type { Generator, Problem } from "../content/types";
import { CHART_FONT, CHART_TITLE_FONT, CHART_W, PAD, PHONE_CHART_PX, chartLabel, chartLayout, isGraphScene, phoneShapeFontPx, textWidth, type ChartVisual } from "../components/chart-layout";
import { figureOk, textBox } from "../content/figure-check";
import { sample } from "./quality-checks";

/** 전 학년 막대그래프·꺾은선그래프: 휴대폰 폭에서 글자 크기, 글자 겹침·잘림, 그림 설명(화면 읽기) */

const chartGens: Generator[] = [...new Map(units.flatMap((u) => u.standards.flatMap((s) => s.generators)).map((g) => [g.id, g])).values()].filter((g) =>
  sample(g, 5).some((p) => p.visual?.kind === "bars" || p.visual?.kind === "line"),
);
const charts = (g: Generator): [Problem, ChartVisual][] =>
  sample(g, 100).flatMap((p) => (p.visual?.kind === "bars" || p.visual?.kind === "line" ? [[p, p.visual] as [Problem, ChartVisual]] : []));

describe("그래프 그림", () => {
  it("그래프 생성기를 모두 찾았다", () => {
    expect(chartGens.length).toBeGreaterThanOrEqual(25);
  });

  it("360px 휴대폰에서 글자가 12px 이상", () => {
    expect((CHART_FONT * PHONE_CHART_PX) / CHART_W).toBeGreaterThanOrEqual(12);
  });

  it.each(chartGens.map((g) => [g.id, g] as const))("%s: 글자가 칸·그림 안에 들어가고 눈금 글자끼리 겹치지 않는다", (_, g) => {
    for (const [p, v] of charts(g)) {
      const L = chartLayout(v);
      const why = `${p.key}`;
      expect(textWidth(v.title, CHART_TITLE_FONT), why).toBeLessThanOrEqual(CHART_W - 8);
      for (const lines of L.labelLines) for (const line of lines) expect(textWidth(line), `${why} ${line}`).toBeLessThanOrEqual(L.band - 2);
      const labeled = L.ticks.filter((t) => t.labeled);
      expect(labeled[0].value, why).toBe(0);
      expect(L.ticks[L.ticks.length - 1].labeled, `${why} 맨 위 눈금에도 숫자`).toBe(true);
      for (const t of labeled) expect(textWidth(String(t.value)), why).toBeLessThanOrEqual(PAD.left - 8);
      for (let k = 1; k < labeled.length; k++) expect(L.y(labeled[k - 1].value) - L.y(labeled[k].value), why).toBeGreaterThanOrEqual(CHART_FONT + 2);
      if (v.second) expect(64 + 18 + v.second.names.reduce((s, n) => s + textWidth(n), 0), why).toBeLessThanOrEqual(CHART_W);
    }
  });

  it.each(chartGens.map((g) => [g.id, g] as const))("%s: 그림 설명에 항목별 값이 있고, 묻는 항목의 값은 없다", (_, g) => {
    for (const [p, v] of charts(g)) {
      const label = chartLabel(v);
      const asked = v.asked ?? [];
      v.labels.forEach((l, i) => {
        if (asked.includes(i)) expect(label, p.prompt).not.toContain(`${l} ${v.values[i]}`);
        else expect(label, p.prompt).toContain(v.second ? `${l}(${v.second.names[0]} ${v.values[i]}, ${v.second.names[1]} ${v.second.values[i]})` : `${l} ${v.values[i]}`);
      });
      expect(label, "그래프 종류를 묻는 문제가 있어 종류 이름은 쓰지 않는다").not.toMatch(/막대그래프|꺾은선그래프/);
    }
  });

  it("값을 읽어 답하는 문제는 그 값을 그림 설명에서 뺀다", () => {
    const byId = (id: string) => chartGens.find((g) => g.id === id)!;
    for (const id of ["bar-read", "line-read"])
      for (const [p, v] of charts(byId(id))) {
        expect(v.asked, p.prompt).toHaveLength(1);
        expect(String(v.values[v.asked![0]]), p.prompt).toBe(p.answer);
      }
    // 값이 주어지고 그 때를 고르는 문제: 한 항목만 빼면 나머지 값으로 정답이 드러나므로 모든 값을 뺀다
    for (const [p, v] of charts(byId("l4-line-when"))) {
      expect(v.asked, p.prompt).toEqual(v.labels.map((_, i) => i));
      expect(chartLabel(v), p.prompt).not.toMatch(/\d+,|\d+\./);
    }
  });
});

/** 도형(ShapeScene)으로 그린 그래프: 막대·물결선 꺾은선(4학년), 그림그래프(3·6학년), 띠·원그래프(6학년), ○ 그래프(2학년) */
describe("도형으로 그린 그래프", () => {
  const all = [...new Map(units.flatMap((u) => u.standards.flatMap((s) => s.generators)).map((g) => [g.id, g])).values()];
  const graphGens = all.filter((g) => sample(g, 10).some((p) => p.visual?.kind === "shape" && isGraphScene(p.visual.label)));

  it("리뷰에서 짚은 그래프 생성기를 모두 찾았다", () => {
    const ids = graphGens.map((g) => g.id);
    const want = ["l4-bar-scale", "l4-bar-scale-infer", "w4-bar-missing", "l4-bar-cells", "l4-bar-draw-error", "l4-bar-rest-cells", "w4-temp-between", "l4-line-cells", "l4-line-plot-where", "data-picto", "e3-picto-tens", "w3-picto-sum", "l6-band-read", "l6-band-percent", "l6-graph-change", "l6-graph-kind", "l6-pic-read"];
    for (const id of want) expect(ids, id).toContain(id);
    expect(ids.filter((id) => /^l3-(pic|use|draw)-/.test(id)).length).toBeGreaterThanOrEqual(7);
    expect(ids.filter((id) => /^l6-band-/.test(id)).length).toBeGreaterThanOrEqual(7);
  });

  it.each(graphGens.map((g) => [g.id, g] as const))("%s: 360px 휴대폰에서 글자 12px 이상, 그림 검사 통과", (_, g) => {
    for (const p of sample(g, 60)) {
      const v = p.visual;
      if (v?.kind !== "shape" || !isGraphScene(v.label)) continue;
      expect(phoneShapeFontPx(v.width), `${p.key} 폭 ${v.width}`).toBeGreaterThanOrEqual(12);
      expect(figureOk(v), p.key).toBe(true);
      // figureOk는 글자가 2px까지 그림 밖으로 나가도 봐주므로, 그래프는 여유 없이 그림 안에 있는지 따로 본다
      for (const t of v.texts ?? []) {
        const [x0, y0, x1, y1] = textBox(t);
        expect(x0 >= 0 && y0 >= 0 && x1 <= v.width && y1 <= v.height, `${p.key} 글자 "${t.text}" 잘림`).toBe(true);
      }
    }
  });

  it("4학년 도형 막대그래프: 그림 설명에 항목 값이 있고, 묻는 값·그래프 종류 이름은 없다", () => {
    for (const p of sample(graphGens.find((g) => g.id === "l4-bar-scale-infer")!, 60)) {
      const v = p.visual as { label: string };
      const target = p.prompt.match(/일 때, (.+?)(?:은|는) 몇/)![1];
      expect(v.label, p.prompt).not.toContain(`${target} ${p.answer}`);
      expect(v.label, p.prompt).toContain(`${target}의 값은 그래프에서 읽어 보세요`);
    }
    for (const g of graphGens.filter((x) => /^(l4|w4)-/.test(x.id)))
      for (const p of sample(g, 20)) expect((p.visual as { label: string }).label, g.id).not.toMatch(/막대그래프|꺾은선그래프/);
  });

  it("l6-graph-kind: 그림 설명에 그래프 이름(정답)이 없다", () => {
    for (const p of sample(graphGens.find((g) => g.id === "l6-graph-kind")!, 60)) {
      const label = p.visual?.kind === "shape" ? p.visual.label : chartLabel(p.visual as ChartVisual);
      expect(label, p.answer).not.toContain(p.answer);
    }
  });
});
