import { describe, expect, it } from "vitest";
import { FIGURE_NOTE, needsSight } from "../components/figure-note";
import type { Visual } from "../content/types";

/** 화면 읽기 안내: 그림을 봐야 푸는 문제에만 붙는다 */

const shape: Visual = { kind: "shape", width: 100, height: 100, label: "도형 4개(㉠~㉣)" };
const chart = { title: "좋아하는 과일", labels: ["사과", "배"], values: [3, 5], unit: "명", step: 1 };

describe("그림 안내(needsSight)", () => {
  it("도형 그림은 그림 설명만으로 풀 수 없으니 안내한다", () => {
    expect(needsSight(shape)).toBe(true);
  });

  it("그래프는 묻는 항목의 값을 설명에서 뺄 때만 안내한다", () => {
    expect(needsSight({ kind: "bars", ...chart, asked: [1] })).toBe(true);
    expect(needsSight({ kind: "line", ...chart, asked: [0] })).toBe(true);
    expect(needsSight({ kind: "bars", ...chart })).toBe(false);
    expect(needsSight({ kind: "line", ...chart, asked: [] })).toBe(false);
  });

  it("값을 설명이나 표로 모두 들을 수 있는 그림에는 안내하지 않는다", () => {
    const visuals: Visual[] = [
      { kind: "bar", parts: 4, shaded: 1 },
      { kind: "circle", parts: 3, shaded: 2 },
      { kind: "column", op: "+", a: 12, b: 34 },
      { kind: "longdiv", divisor: "3", dividend: "96", quotient: { blank: "□", width: 2 }, rows: [] },
      { kind: "table", header: ["이름", "수"], rows: [["사과", "3"]] },
    ];
    for (const v of visuals) expect(needsSight(v)).toBe(false);
  });

  it("안내 문구에는 숫자가 없어 정답을 드러내지 않는다", () => {
    expect(FIGURE_NOTE).not.toMatch(/\d/);
  });
});
