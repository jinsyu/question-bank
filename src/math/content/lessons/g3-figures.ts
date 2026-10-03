import type { ShapeScene } from "../types";
import { figureOk } from "../figure-check";

/**
 * 3학년 그림 도구: 자·수직선·비커·저울·양팔 저울·시계·길 그림·그림그래프·붙임딱지.
 * 부분 그림(Parts)을 만든 뒤 scene()으로 합친다. 글자가 겹치면 생성기에서 다시 뽑는다(sceneOk).
 */

export type Pt = [number, number];
export type Parts = Omit<ShapeScene, "kind" | "width" | "height" | "label">;

/** 여러 부분 그림을 합쳐 한 장면으로 */
export function scene(width: number, height: number, label: string, ...parts: Parts[]): ShapeScene {
  const out: ShapeScene = { kind: "shape", width, height, label };
  for (const p of parts) {
    if (p.polygons) out.polygons = [...(out.polygons ?? []), ...p.polygons];
    if (p.lines) out.lines = [...(out.lines ?? []), ...p.lines];
    if (p.circles) out.circles = [...(out.circles ?? []), ...p.circles];
    if (p.arcs) out.arcs = [...(out.arcs ?? []), ...p.arcs];
    if (p.dots) out.dots = [...(out.dots ?? []), ...p.dots];
    if (p.texts) out.texts = [...(out.texts ?? []), ...p.texts];
    if (p.grid) out.grid = p.grid;
  }
  return out;
}

/** 그림 밖으로 나가거나 글자가 겹치지 않는지 */
export const sceneOk = figureOk;

export const rect = (x0: number, y0: number, x1: number, y1: number, fill = false) => ({
  points: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]] as Pt[],
  fill,
});

const rad = (deg: number) => (deg * Math.PI) / 180;
/** 시계·저울 눈금: 위쪽(12시)에서 시계 방향으로 deg만큼 돈 점 */
export const polar = (c: Pt, r: number, deg: number): Pt => [
  Math.round((c[0] + r * Math.sin(rad(deg))) * 10) / 10,
  Math.round((c[1] - r * Math.cos(rad(deg))) * 10) / 10,
];

/* ── 자 ── */

/** 자: 왼쪽 0 눈금이 x0, 1 cm = unit px. 1 mm·5 mm·1 cm 눈금과 cm 숫자 */
export function ruler(x0: number, y0: number, cm: number, unit = 30): Parts {
  const lines: Parts["lines"] = [];
  for (let i = 0; i <= cm * 10; i++) {
    const len = i % 10 === 0 ? 16 : i % 5 === 0 ? 11 : 7;
    const x = x0 + (i * unit) / 10;
    lines.push({ from: [x, y0], to: [x, y0 + len], width: 1 });
  }
  return {
    polygons: [rect(x0 - 12, y0, x0 + cm * unit + 12, y0 + 44)],
    lines,
    texts: Array.from({ length: cm + 1 }, (_, k) => ({ at: [x0 + k * unit, y0 + 29] as Pt, text: String(k) })),
  };
}

/** 자 위에 놓인 색 테이프(mm 단위 시작·끝)와 끝에서 자까지 내린 점선 */
export function tapeOnRuler(x0: number, unit: number, from: number, to: number, y: number, rulerTop: number): Parts {
  const xa = x0 + (from * unit) / 10;
  const xb = x0 + (to * unit) / 10;
  return {
    polygons: [rect(xa, y, xb, y + 14, true)],
    lines: [
      { from: [xa, y + 14], to: [xa, rulerTop], dashed: true, width: 1 },
      { from: [xb, y + 14], to: [xb, rulerTop], dashed: true, width: 1 },
    ],
  };
}

/* ── 들이: 비커(눈금 실린더) ── */

export type BeakerOpt = {
  /** 왼쪽 벽 x, 바닥 y */
  x: number;
  bottom: number;
  /** 들이(mL)와 작은 눈금 간격(mL), 눈금 한 칸의 높이(px) */
  max: number;
  step: number;
  px: number;
  /** 숫자를 적을 눈금 간격(mL)과 표기 */
  labelEvery: number;
  fmt: (ml: number) => string;
  /** 담긴 물(mL) */
  water: number;
  width?: number;
};

export function beaker(o: BeakerOpt): Parts {
  const w = o.width ?? 56;
  const top = o.bottom - (o.max / o.step) * o.px - 14;
  const yOf = (ml: number) => o.bottom - (ml / o.step) * o.px;
  const lines: Parts["lines"] = [
    { from: [o.x, top], to: [o.x, o.bottom] },
    { from: [o.x, o.bottom], to: [o.x + w, o.bottom] },
    { from: [o.x + w, o.bottom], to: [o.x + w, top] },
  ];
  const texts: Parts["texts"] = [];
  for (let ml = o.step; ml <= o.max; ml += o.step) {
    const major = ml % o.labelEvery === 0;
    const half = !major && (2 * ml) % o.labelEvery === 0;
    lines.push({ from: [o.x + w - (major ? 18 : half ? 13 : 8), yOf(ml)], to: [o.x + w, yOf(ml)], width: 1 });
    if (major) {
      const t = o.fmt(ml);
      const tw = [...t].reduce((s, ch) => s + (/[ -~°]/.test(ch) ? 8 : 14), 0);
      texts.push({ at: [o.x + w + 8 + tw / 2, yOf(ml)], text: t });
    }
  }
  return {
    polygons: o.water > 0 ? [rect(o.x + 2, yOf(o.water), o.x + w - 2, o.bottom - 1, true)] : [],
    lines,
    texts,
  };
}

/* ── 무게: 바늘 저울 ── */

export type DialOpt = {
  c: Pt;
  r: number;
  /** 한 바퀴의 무게(g), 작은 눈금(g), 숫자 눈금(g) */
  max: number;
  step: number;
  labelEvery: number;
  fmt: (g: number) => string;
  value: number;
  /** 접시 위에 올린 물건 이름 */
  item?: string;
};

/** 바늘 저울(접시 + 둥근 눈금판). 위쪽 여백 56 px, 아래 여백 30 px 필요 */
export function dial(o: DialOpt): Parts {
  const { c, r } = o;
  const lines: Parts["lines"] = [];
  const texts: Parts["texts"] = [];
  const n = o.max / o.step;
  for (let i = 0; i < n; i++) {
    const g = i * o.step;
    const deg = (g / o.max) * 360;
    const major = g % o.labelEvery === 0;
    lines.push({ from: polar(c, r - (major ? 12 : 7), deg), to: polar(c, r, deg), width: 1 });
    if (major) {
      // 글자가 눈금판에 닿지 않게 글자 폭만큼 바깥으로 뺀다(옆쪽은 가로 폭, 위아래는 세로 폭)
      const t = o.fmt(g);
      const half = [...t].reduce((sum, ch) => sum + (/[ -~]/.test(ch) ? 8 : 14), 0) / 2;
      const a = (deg * Math.PI) / 180;
      texts.push({ at: polar(c, r + 7 + half * Math.abs(Math.sin(a)) + 8 * Math.abs(Math.cos(a)), deg), text: t });
    }
  }
  const trayY = c[1] - r - 36;
  lines.push({ from: [c[0] - 26, trayY + 6], to: [c[0] - 26, c[1] - r + 6] }, { from: [c[0] + 26, trayY + 6], to: [c[0] + 26, c[1] - r + 6] });
  lines.push({ from: c, to: polar(c, r - 10, (o.value / o.max) * 360), width: 2 });
  if (o.item) texts.push({ at: [c[0], trayY - 10], text: o.item });
  return {
    polygons: [rect(c[0] - 48, trayY, c[0] + 48, trayY + 6, true)],
    circles: [{ c, r }],
    dots: [c],
    lines,
    texts,
  };
}

/* ── 양팔 저울(윗접시) ── */

/** tilt: 1이면 왼쪽이 내려감(왼쪽이 무거움), −1이면 오른쪽, 0이면 수평. stones: 오른쪽 접시의 바둑돌 수 */
export function balance(cx: number, py: number, left: string, right: string | number, tilt: -1 | 0 | 1): Parts {
  const half = 76;
  const t = tilt * 12;
  const L: Pt = [cx - half, py + t];
  const R: Pt = [cx + half, py - t];
  const tray = (p: Pt) => rect(p[0] - 32, p[1] - 20, p[0] + 32, p[1] - 15, true);
  const circles: Parts["circles"] = [];
  const texts: Parts["texts"] = [{ at: [L[0], L[1] - 32], text: left }];
  if (typeof right === "number") {
    for (let i = 0; i < right; i++) circles.push({ c: [R[0] - 24 + (i % 6) * 9.6, R[1] - 25 - Math.floor(i / 6) * 9], r: 4 });
  } else texts.push({ at: [R[0], R[1] - 32], text: right });
  return {
    polygons: [tray(L), tray(R), { points: [[cx, py], [cx - 18, py + 46], [cx + 18, py + 46]] }],
    lines: [
      { from: L, to: R, width: 3 },
      { from: L, to: [L[0], L[1] - 15] },
      { from: R, to: [R[0], R[1] - 15] },
    ],
    circles,
    dots: [[cx, py]],
    texts,
  };
}

/* ── 시계 ── */

/** 숫자 12·3·6·9만 있는 작은 시계(반지름 38), 정각 */
export function miniClock(c: Pt, h: number): Parts {
  const r = 38;
  return {
    circles: [{ c, r }],
    dots: [c],
    lines: [
      ...Array.from({ length: 12 }, (_, i) => ({ from: polar(c, r - 5, i * 30), to: polar(c, r, i * 30), width: 1 })),
      { from: c, to: polar(c, 13, (h % 12) * 30), width: 4 },
      // 긴바늘 끝이 숫자 12 아래에 붙지 않게 18까지만
      { from: c, to: polar(c, 18, 0), width: 2 },
    ],
    texts: [
      { at: polar(c, r - 12, 0), text: "12" },
      { at: polar(c, r - 11, 90), text: "3" },
      { at: polar(c, r - 11, 180), text: "6" },
      { at: polar(c, r - 11, 270), text: "9" },
    ],
  };
}

/* ── 그림그래프 ── */

export type PictoSym = { value: number; shape: "big" | "mid" | "small" };
export type PictoRow = { label: string; value: number | null };

/** 값을 큰 그림부터 나타낸 기호 목록 */
export function symbolsOf(value: number, units: number[]): number[] {
  const out: number[] = [];
  let v = value;
  for (const u of units) {
    for (let k = 0; k < Math.floor(v / u); k++) out.push(u);
    v %= u;
  }
  return out;
}

/**
 * 표 모양 그림그래프: 왼쪽 칸에 항목, 오른쪽 칸에 그림(큰 원·세모·작은 원). 값이 null이면 빈칸.
 * units: 큰 그림부터 나타내는 수(예: [10, 1] 또는 [10, 5, 1]), unitName: 명·그루·상자 등
 */
export function pictograph(head: [string, string], rows: PictoRow[], units: number[], unitName: string): ShapeScene {
  // 폭 288 안쪽(휴대폰에서 글자 12px 이상): 이름 칸 64, 그림 사이는 2~3px만 띄운다
  const labelW = 64;
  const rowH = 32;
  const top = 30;
  const x1 = 286;
  const bottom = top + rowH * rows.length;
  const lines: Parts["lines"] = [
    { from: [labelW, 0], to: [labelW, bottom], width: 1 },
    { from: [0, top], to: [x1, top], width: 1 },
    ...rows.slice(1).map((_, i) => ({ from: [0, top + rowH * (i + 1)] as Pt, to: [x1, top + rowH * (i + 1)] as Pt, width: 1 })),
  ];
  const circles: Parts["circles"] = [];
  const polygons: Parts["polygons"] = [rect(1, 1, x1, bottom)];
  const draw = (u: number, x: number, y: number) => {
    const kind = units.indexOf(u) === 0 ? "big" : units.indexOf(u) === units.length - 1 ? "small" : "mid";
    // 큰 그림 ◉(겹원), 가운데 그림 △, 작은 그림 ○ — 문제 글의 기호와 같은 모양
    if (kind === "big") circles.push({ c: [x, y], r: 9.5 }, { c: [x, y], r: 4 });
    else if (kind === "small") circles.push({ c: [x, y], r: 4.5 });
    else polygons.push({ points: [[x, y - 9], [x - 9, y + 7], [x + 9, y + 7]] });
    return kind === "big" ? 22 : kind === "mid" ? 21 : 12;
  };
  const texts: Parts["texts"] = [
    { at: [labelW / 2, top / 2], text: head[0] },
    { at: [(labelW + x1) / 2, top / 2], text: head[1] },
  ];
  rows.forEach((row, i) => {
    const y = top + rowH * i + rowH / 2;
    texts.push({ at: [labelW / 2, y], text: row.label });
    if (row.value === null) return;
    let x = labelW + 14;
    for (const u of symbolsOf(row.value, units)) x += draw(u, x, y);
  });
  // 범례: 큰 그림부터 "◉ 10명", 오른쪽 끝에 맞춘다
  const legend = units.map((u) => {
    const t = `${u}${unitName}`;
    return { u, t, tw: [...t].reduce((s, ch) => s + (/[ -~]/.test(ch) ? 8 : 14), 0) };
  });
  let lx = x1 - legend.reduce((s, l) => s + 30 + l.tw, 0) + 10;
  const ly = bottom + 22;
  for (const { u, t, tw } of legend) {
    draw(u, lx, ly);
    texts.push({ at: [lx + 14 + tw / 2, ly], text: t });
    lx += 30 + tw;
  }
  return scene(x1 + 2, bottom + 40, `${head[1]} 그림그래프`, { polygons, lines, circles, texts });
}

/* ── 붙임딱지(조사한 자료) ── */

/** 학생들이 한 장씩 붙인 붙임딱지(한 줄에 cols장) */
export function stickers(words: string[], cols = 5): ShapeScene {
  const w = 64;
  const h = 30;
  const gap = 8;
  const polygons: Parts["polygons"] = [];
  const texts: Parts["texts"] = [];
  words.forEach((word, i) => {
    const x = 6 + (i % cols) * (w + gap);
    const y = 6 + Math.floor(i / cols) * (h + gap);
    polygons.push(rect(x, y, x + w, y + h));
    texts.push({ at: [x + w / 2, y + h / 2], text: word });
  });
  const rows = Math.ceil(words.length / cols);
  return scene(12 + cols * w + (cols - 1) * gap, 12 + rows * h + (rows - 1) * gap, "학생들이 붙인 붙임딱지", { polygons, texts });
}
