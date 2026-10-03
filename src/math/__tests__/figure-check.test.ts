import { describe, expect, it } from "vitest";
import { figureOk, nudgeTexts, strokeHitTexts } from "../content/figure-check";
import type { ShapeScene } from "../content/types";

/** 글자 "12"(상자 x 92~108, y 43~57)와 선·원·호 하나만 있는 그림 */
const scene = (extra: Partial<ShapeScene>): ShapeScene => ({ kind: "shape", width: 200, height: 100, label: "", texts: [{ at: [100, 50], text: "12" }], ...extra });

describe("공용 그림 검사(figure-check)", () => {
  it("좁은 칸: 선이 글자 상자 가장자리를 1px 파고들면 잡는다(예전 2px 줄여 보던 검사는 놓쳤다)", () => {
    expect(strokeHitTexts(scene({ lines: [{ from: [0, 44], to: [200, 44] }] }))).toEqual([0]);
  });

  it("선이 글자 상자 밖을 지나면(굵기 2, 중심이 상자에서 1px 바깥) 걸지 않는다", () => {
    expect(strokeHitTexts(scene({ lines: [{ from: [0, 42], to: [200, 42] }] }))).toEqual([]);
  });

  it("원 테두리가 글자를 지나면 잡는다", () => {
    expect(figureOk(scene({ circles: [{ c: [100, 90], r: 40 }] }))).toBe(false);
    expect(figureOk(scene({ circles: [{ c: [100, 50], r: 30 }] }))).toBe(true);
  });

  it("각 표시 호는 그려진 구간만 본다", () => {
    // 중심 (100, 80), 반지름 30: 위쪽(90°)은 글자 "12"를 지나고, 아래쪽 반원은 글자와 멀다
    expect(figureOk(scene({ arcs: [{ c: [100, 80], r: 30, from: 60, to: 120 }] }))).toBe(false);
    expect(figureOk(scene({ arcs: [{ c: [100, 80], r: 30, from: 200, to: 340 }] }))).toBe(true);
  });

  it("가는 선(굵기 1: 지시선·눈금)은 글자 가까이 그려도 보지 않는다", () => {
    expect(strokeHitTexts(scene({ lines: [{ from: [0, 50], to: [200, 50], width: 1 }] }))).toEqual([]);
  });

  it("한글 글자는 더 엄하게 본다: 숫자라면 봐줄 거리(상자 안쪽 1px)도 한글이면 잡는다", () => {
    const line = { from: [0, 44] as [number, number], to: [200, 44] as [number, number] };
    expect(strokeHitTexts({ ...scene({ lines: [line] }), texts: [{ at: [100, 51], text: "12" }] })).toEqual([]);
    expect(strokeHitTexts({ ...scene({ lines: [line] }), texts: [{ at: [100, 51], text: "가" }] })).toEqual([0]);
  });

  it("걸린 글자는 몇 px 옮겨 살리고(nudgeTexts), 옮길 자리가 없으면 null", () => {
    const touching = scene({ lines: [{ from: [0, 44], to: [200, 44] }] });
    const fixed = nudgeTexts(touching);
    expect(fixed && figureOk(fixed)).toBe(true);
    expect(Math.hypot(fixed!.texts![0].at[0] - 100, fixed!.texts![0].at[1] - 50)).toBeLessThanOrEqual(6);
    expect(nudgeTexts(scene({ lines: [{ from: [0, 50], to: [200, 50] }] }))).toBeNull();
  });
});
