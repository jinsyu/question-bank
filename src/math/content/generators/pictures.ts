import type { ShapeScene } from "../types";

type Pt = [number, number];

/** 점 n개를 5칸씩 10칸 틀에 그린다(20개까지) */
export function dotsScene(n: number, label = `점 ${n}개`): ShapeScene {
  const cell = 30;
  const rows = Math.max(1, Math.ceil(n / 5));
  const frames = Math.ceil(rows / 2);
  const polygons: ShapeScene["polygons"] = [];
  for (let f = 0; f < frames; f++) {
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 5; c++) {
        const x = 8 + c * cell;
        const y = 8 + (f * 2 + r) * cell + f * 10;
        polygons.push({ points: [[x, y], [x + cell, y], [x + cell, y + cell], [x, y + cell]] });
      }
    }
  }
  const dots: Pt[] = Array.from({ length: n }, (_, i) => {
    const row = Math.floor(i / 5);
    const f = Math.floor(row / 2);
    return [8 + (i % 5) * cell + cell / 2, 8 + row * cell + cell / 2 + f * 10];
  });
  return { kind: "shape", width: 16 + cell * 5, height: 16 + frames * (2 * cell + 10), label, polygons, circles: dots.map((c) => ({ c, r: 9 })) };
}

/** 10개씩 묶음(10칸 막대)과 낱개(점) — 두 자리 수 모형. 막대를 10칸으로 나눠 10개가 모인 것이 보이게 한다 */
export function tensOnesScene(tens: number, ones: number): ShapeScene {
  const w = 16;
  const ch = 11;
  const polygons: ShapeScene["polygons"] = Array.from({ length: tens }, (_, i) => {
    const x = 10 + i * (w + 8);
    return Array.from({ length: 10 }, (_, k) => {
      const y = 10 + k * ch;
      return { fill: true, points: [[x, y], [x + w, y], [x + w, y + ch], [x, y + ch]] as Pt[] };
    });
  }).flat();
  const startX = 10 + tens * (w + 8) + 12;
  const circles = Array.from({ length: ones }, (_, i) => ({ c: [startX + (i % 3) * 22 + 8, 20 + Math.floor(i / 3) * 22] as Pt, r: 8 }));
  return {
    kind: "shape",
    width: Math.max(160, startX + 3 * 22 + 10),
    height: 130,
    label: `10개씩 묶음 ${tens}개와 낱개 ${ones}개`,
    polygons,
    circles,
  };
}

/** 시계 숫자를 놓는 반지름(테두리 바깥) — 그림 크기를 잡을 때 쓴다 */
export const clockNumR = (r: number) => r + 13;

/**
 * 바늘 시계의 선·글자(중심 c, 테두리 반지름 r).
 * 긴바늘은 분 눈금 바로 앞(r − 4)까지 닿아 1분 단위(15분·16분)를 구별할 수 있게 하고,
 * 숫자는 테두리 바깥에 두어 긴바늘이 숫자 위를 지나지 않게 한다.
 */
export function clockParts(c: Pt, r: number, hour: number, minute: number): Pick<ShapeScene, "circles" | "dots" | "lines" | "texts"> {
  const at = (deg: number, len: number): Pt => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [Math.round(c[0] + len * Math.cos(a)), Math.round(c[1] + len * Math.sin(a))];
  };
  const hourDeg = ((hour % 12) + minute / 60) * 30;
  return {
    circles: [{ c, r }],
    dots: [c],
    lines: [
      { from: c, to: at(hourDeg, Math.round(r * 0.5)), width: 5 },
      { from: c, to: at(minute * 6, r - 4), width: 3 },
      ...Array.from({ length: 60 }, (_, i) => ({ from: at(i * 6, i % 5 ? r - 3 : r - 7), to: at(i * 6, r), width: i % 5 ? 1 : 1.5 })),
    ],
    texts: Array.from({ length: 12 }, (_, i) => ({ at: at((i + 1) * 30, clockNumR(r)), text: String(i + 1) })),
  };
}

/**
 * 바늘 시계. hands로 바늘을 뺄 수 있다: "minute"는 긴바늘만(짧은바늘을 그려 넣는 문제),
 * "none"은 바늘 없는 시계(바늘을 그려 넣는 문제)
 */
export function clockScene(hour: number, minute: number, hands: "both" | "minute" | "none" = "both"): ShapeScene {
  const r = 72;
  const half = clockNumR(r) + 12;
  const parts = clockParts([half, half], r, hour, minute);
  // clockParts의 선: [짧은바늘, 긴바늘, 눈금 60개]
  const lines = hands === "both" ? parts.lines : hands === "minute" ? parts.lines?.slice(1) : parts.lines?.slice(2);
  const label = hands === "both" ? "바늘 시계" : hands === "minute" ? "긴바늘만 그려진 시계" : "바늘이 없는 시계";
  return { kind: "shape", width: 2 * half, height: 2 * half, label, ...parts, lines };
}

/** 한 묶음에 each개씩 groups묶음: 묶음마다 테두리, 한 줄에 5묶음까지 */
export function groupsScene(each: number, groups: number, label = `한 묶음에 ${each}개씩 ${groups}묶음`): ShapeScene {
  const g = 20;
  const cols = each <= 3 ? each : Math.ceil(each / 2);
  const rowsIn = Math.ceil(each / cols);
  const bw = cols * g + 8;
  const bh = rowsIn * g + 8;
  const polygons: ShapeScene["polygons"] = [];
  const circles: ShapeScene["circles"] = [];
  for (let k = 0; k < groups; k++) {
    const x0 = 8 + (k % 5) * (bw + 10);
    const y0 = 8 + Math.floor(k / 5) * (bh + 10);
    polygons.push({ points: [[x0, y0], [x0 + bw, y0], [x0 + bw, y0 + bh], [x0, y0 + bh]] });
    for (let i = 0; i < each; i++) circles.push({ c: [x0 + 4 + g / 2 + (i % cols) * g, y0 + 4 + g / 2 + Math.floor(i / cols) * g], r: 7 });
  }
  const perRow = Math.min(groups, 5);
  const rows = Math.ceil(groups / 5);
  return { kind: "shape", width: 6 + perRow * (bw + 10), height: 6 + rows * (bh + 10), label, polygons, circles };
}
