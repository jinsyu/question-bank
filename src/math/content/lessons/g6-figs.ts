import type { ShapeScene } from "../types";
import { textBox } from "../figure-check";

/**
 * 6학년 도형·그래프 그림 조각(ShapeScene): 각기둥·각뿔·원기둥·원뿔·구 겨냥도, 각기둥·직육면체·원기둥 전개도,
 * 직육면체·쌓기나무(빗각 투영), 위·앞·옆에서 본 모양, 띠그래프·원그래프·그림그래프, 원의 넓이 그림.
 * 조각(Parts)을 만들고 compose로 한 그림에 모은다. 글자가 겹치는지는 생성기(g6-util의 guard)가 검사한다.
 */

export type Pt = [number, number];
export type Parts = Pick<ShapeScene, "polygons" | "lines" | "circles" | "arcs" | "dots" | "texts">;
type Line = NonNullable<ShapeScene["lines"]>[number];
type Text = NonNullable<ShapeScene["texts"]>[number];

const r1 = (n: number) => Math.round(n * 10) / 10;
export const rp = (p: Pt): Pt => [r1(p[0]), r1(p[1])];
const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const rad = (deg: number) => (deg * Math.PI) / 180;

export const MARK = ["㉠", "㉡", "㉢", "㉣", "㉤"];
export const LETTERS = ["가", "나", "다", "라", "마"];
export const CIRCLED = ["①", "②", "③", "④"];

const cat = <T>(a: T[] | undefined, b: T[] | undefined): T[] | undefined => (a || b ? [...(a ?? []), ...(b ?? [])] : undefined);

/** 조각을 모아 한 그림으로 */
export function compose(width: number, height: number, label: string, ...parts: Parts[]): ShapeScene {
  const out: ShapeScene = { kind: "shape", width, height, label };
  for (const p of parts) {
    out.polygons = cat(out.polygons, p.polygons);
    out.lines = cat(out.lines, p.lines);
    out.circles = cat(out.circles, p.circles);
    out.arcs = cat(out.arcs, p.arcs);
    out.dots = cat(out.dots, p.dots);
    out.texts = cat(out.texts, p.texts);
  }
  return out;
}

export const text = (at: Pt, t: string): Text => ({ at: rp(at), text: t });
const seg = (a: Pt, b: Pt, extra: Partial<Line> = {}): Line => ({ from: rp(a), to: rp(b), ...extra });

/** 글자 반쪽 크기(가로, 세로) */
const half = (t: string): Pt => {
  const b = textBox({ at: [0, 0], text: t });
  return [(b[2] - b[0]) / 2, (b[3] - b[1]) / 2];
};

/** 선분 ab의 가운데에서, 기준점 away의 반대쪽으로 글자를 띄워 놓는다 */
export function labelOut(a: Pt, b: Pt, away: Pt, t: string, gap = 5): Text {
  const m = mid(a, b);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  let n: Pt = [-dy / len, dx / len];
  if ((m[0] - away[0]) * n[0] + (m[1] - away[1]) * n[1] < 0) n = [-n[0], -n[1]];
  const [hw, hh] = half(t);
  const d = gap + Math.abs(n[0]) * hw + Math.abs(n[1]) * hh;
  return text(add(m, [n[0] * d, n[1] * d]), t);
}

/** 여러 점으로 이은 곡선(선분 여러 개) */
const polyline = (pts: Pt[], extra: Partial<Line> = {}): Line[] => pts.slice(1).map((p, i) => seg(pts[i], p, extra));

/* ── 입체도형 겨냥도: 밑면을 비스듬히 본 정다각형(타원 위의 점)으로 그리고 보이지 않는 모서리는 점선 ── */

export type Place = { cx: number; top: number; bottom: number; rx: number; ry: number };

/** 정n각형 밑면의 꼭짓점(사각형·육각형은 앞뒤 모서리가 겹치지 않게 조금 돌린다) */
function ring(n: number, p: Place, y: number): Pt[] {
  const phi = Math.PI / 2 - Math.PI / n + (n === 4 ? 0.4 : n === 6 ? 0.25 : n >= 7 ? 0.15 : 0);
  return Array.from({ length: n }, (_, i) => {
    const a = phi + (2 * Math.PI * i) / n;
    return rp([p.cx + p.rx * Math.cos(a), y + p.ry * Math.sin(a)]);
  });
}
const signedArea = (ps: Pt[]) => ps.reduce((s, p, i) => s + p[0] * ps[(i + 1) % ps.length][1] - ps[(i + 1) % ps.length][0] * p[1], 0) / 2;

/** 옆면 i가 보이는지: 투영한 면의 방향(넓이 부호)이 가장 앞(아래)에 있는 옆면과 같으면 보인다 */
function frontFacing(areas: number[], bot: Pt[]): boolean[] {
  const n = bot.length;
  const ys = bot.map((b, i) => (b[1] + bot[(i + 1) % n][1]) / 2);
  const front = ys.indexOf(Math.max(...ys));
  return areas.map((a) => Math.sign(a) === Math.sign(areas[front]) && Math.abs(a) > 1e-6);
}

export type Solid = Parts & { top: Pt[]; bot: Pt[]; apex?: Pt; sideVisible: boolean[] };

/** 각기둥 겨냥도(topScale < 1이면 위 밑면이 작은 각뿔대 — 각기둥이 아닌 입체) */
export function prism(n: number, p: Place, topScale = 1): Solid {
  const top = ring(n, { ...p, rx: p.rx * topScale, ry: p.ry * topScale }, p.top);
  const bot = ring(n, p, p.bottom);
  // 옆면 i(꼭짓점 i → i+1)는 투영한 네 점의 방향이 앞면과 같을 때 보인다
  const areas = top.map((_, i) => signedArea([bot[i], bot[(i + 1) % n], top[(i + 1) % n], top[i]]));
  const vis = frontFacing(areas, bot);
  const lines: Line[] = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    lines.push(seg(top[i], top[j]));
    lines.push(seg(bot[i], bot[j], vis[i] ? {} : { dashed: true }));
    lines.push(seg(top[i], bot[i], vis[i] || vis[(i - 1 + n) % n] ? {} : { dashed: true }));
  }
  return { lines, top, bot, sideVisible: vis };
}

/** 각뿔 겨냥도 */
export function pyramid(n: number, p: Place): Solid {
  const apex: Pt = rp([p.cx, p.top]);
  const bot = ring(n, p, p.bottom);
  const vis = frontFacing(bot.map((_, i) => signedArea([bot[i], bot[(i + 1) % n], apex])), bot);
  const lines: Line[] = [];
  for (let i = 0; i < n; i++) {
    lines.push(seg(bot[i], bot[(i + 1) % n], vis[i] ? {} : { dashed: true }));
    lines.push(seg(apex, bot[i], vis[i] || vis[(i - 1 + n) % n] ? {} : { dashed: true }));
  }
  return { lines, top: [apex], bot, apex, sideVisible: vis };
}

/** 겨냥도 한 개를 놓는 자리(그림 220 × 180) */
export const SOLO: Place = { cx: 110, top: 42, bottom: 142, rx: 64, ry: 20 };
/** 밑면이 정n각형인 각기둥(각뿔) 겨냥도 한 개 */
export const solidScene = (n: number, pyr: boolean): ShapeScene =>
  compose(220, 180, `${["", "", "", "삼", "사", "오", "육"][n]}각${pyr ? "뿔" : "기둥"}의 겨냥도`, pyr ? pyramid(n, SOLO) : prism(n, SOLO));

const ellipsePts = (cx: number, cy: number, rx: number, ry: number, from: number, to: number, k: number): Pt[] =>
  Array.from({ length: k + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / k;
    return rp([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  });

/** 원기둥 겨냥도: 위 밑면은 타원, 아래 밑면의 뒤쪽 반은 점선 */
export function cylinder(p: Place): Parts {
  const topE = ellipsePts(p.cx, p.top, p.rx, p.ry, 0, 2 * Math.PI, 36).slice(0, 36);
  return {
    polygons: [{ points: topE }],
    lines: [
      seg([p.cx - p.rx, p.top], [p.cx - p.rx, p.bottom]),
      seg([p.cx + p.rx, p.top], [p.cx + p.rx, p.bottom]),
      ...polyline(ellipsePts(p.cx, p.bottom, p.rx, p.ry, 0, Math.PI, 18)),
      ...polyline(ellipsePts(p.cx, p.bottom, p.rx, p.ry, Math.PI, 2 * Math.PI, 8), { dashed: true }),
    ],
  };
}

/** 원뿔 겨냥도: 꼭짓점에서 밑면에 그은 두 접선, 밑면의 뒤쪽은 점선 */
export function cone(p: Place): Parts & { apex: Pt } {
  const apex: Pt = [p.cx, p.top];
  const s = Math.asin(Math.min(0.9, p.ry / (p.bottom - p.top)));
  const tR = -s;
  const tL = Math.PI + s;
  const at = (t: number): Pt => [p.cx + p.rx * Math.cos(t), p.bottom + p.ry * Math.sin(t)];
  return {
    apex,
    lines: [
      seg(apex, at(tR)),
      seg(apex, at(tL)),
      ...polyline(ellipsePts(p.cx, p.bottom, p.rx, p.ry, tR, tL, 20)),
      ...polyline(ellipsePts(p.cx, p.bottom, p.rx, p.ry, tL, tR + 2 * Math.PI, 8), { dashed: true }),
    ],
  };
}

/** 구 겨냥도: 원과 적도(앞쪽 실선, 뒤쪽 점선) */
export function sphere(c: Pt, r: number, withCenter = false): Parts {
  const ry = r * 0.3;
  return {
    circles: [{ c: rp(c), r }],
    lines: [...polyline(ellipsePts(c[0], c[1], r, ry, 0, Math.PI, 16)), ...polyline(ellipsePts(c[0], c[1], r, ry, Math.PI, 2 * Math.PI, 8), { dashed: true })],
    dots: withCenter ? [rp(c)] : undefined,
  };
}

/** 원 둘레의 점들(다각형으로 색칠할 때) */
export const circlePts = (c: Pt, r: number, from = 0, to = 360, k = 48): Pt[] =>
  Array.from({ length: k + 1 }, (_, i) => {
    const a = rad(from + ((to - from) * i) / k);
    return rp([c[0] + r * Math.cos(a), c[1] - r * Math.sin(a)]);
  });

/* ── 직육면체(빗각 투영): 앞면은 그대로, 깊이는 오른쪽 위로 ── */

export type Box = Parts & { F: Pt[]; d: Pt };

/** 뚜껑 없는 상자의 안쪽 왼쪽 벽(삼각형 앞 위 꼭짓점 a, 뒤 위 꼭짓점 b, 안쪽 모서리 아래 c)에 가는 세로선 3개 */
function innerWall(a: Pt, b: Pt, c: Pt): Line[] {
  return [0.25, 0.5, 0.75].map((t) => {
    const x = a[0] + (c[0] - a[0]) * t;
    const yTop = a[1] + (b[1] - a[1]) * t;
    return seg([x, yTop + 2], [x, c[1] - 1], { width: 1 });
  });
}

/**
 * 앞면 왼쪽 아래 o, 가로 w, 높이 h, 깊이(비스듬한 길이) dep. 보이지 않는 모서리는 점선.
 * open이면 윗면이 없는 상자: 열린 곳으로 보이는 안쪽 왼쪽 벽에 세로 결 무늬를 넣고, 안쪽 뒤 세로 모서리 중 앞면의 위 모서리보다 위에 있는 부분을 실선으로 그린다
 */
export function cuboid(o: Pt, w: number, h: number, dep: number, hidden = true, open = false): Box {
  const d: Pt = [dep * 0.8, -dep * 0.6];
  const F = ([o, [o[0] + w, o[1]], [o[0] + w, o[1] - h], [o[0], o[1] - h]] as Pt[]).map(rp);
  const B = add(o, d);
  const backTop = add(F[3], d);
  // 안쪽 뒤 세로 모서리가 앞면의 위 모서리(y = F[3][1])와 만나는 점
  const inner: Pt = [backTop[0], Math.min(F[3][1], B[1])];
  const backEdge = open
    ? [seg(backTop, inner), ...(hidden && inner[1] < B[1] ? [seg(inner, B, { dashed: true })] : [])]
    : hidden
      ? [seg(B, add(F[3], d), { dashed: true })]
      : [];
  return {
    F,
    d,
    polygons: [
      { points: F },
      { points: [F[3], F[2], add(F[2], d), backTop].map(rp) },
      { points: [F[1], add(F[1], d), add(F[2], d), F[2]].map(rp) },
      // 윗면이 없으면 열린 곳으로 보이는 안쪽 왼쪽 벽을 나타낸다(색칠은 '색칠한 부분'과 헷갈리므로 칠하지 않고 세로 결 무늬)
      ...(open ? [{ points: [F[3], backTop, inner].map(rp), fill: "paper" as const }] : []),
    ],
    lines: [...(hidden ? [seg(B, o, { dashed: true }), seg(B, add(F[1], d), { dashed: true })] : []), ...backEdge, ...(open ? innerWall(F[3], backTop, inner) : [])],
  };
}

/** 직육면체 겨냥도에 가로·세로·높이 글자 */
export function boxLabels(b: Box, wText: string | null, dText: string | null, hText: string | null): Text[] {
  const center = add(mid(b.F[0], b.F[2]), [b.d[0] / 2, b.d[1] / 2]);
  const out: Text[] = [];
  if (wText) out.push(labelOut(b.F[0], b.F[1], center, wText));
  if (dText) out.push(labelOut(b.F[1], add(b.F[1], b.d), center, dText));
  if (hText) out.push(labelOut(add(b.F[1], b.d), add(b.F[2], b.d), center, hText));
  return out;
}

/** 길이(cm)를 그림 길이(px)로: 비율은 대강 지키되 너무 작거나 크지 않게 */
export const fitLen = (vals: number[], maxPx: number, minPx = 26): number[] => {
  const s = maxPx / Math.max(...vals);
  return vals.map((v) => Math.max(minPx, v * s));
};

/** 쌓기나무로 만든 직육면체(가로 a, 세로 b, 높이 c개): 보이는 세 면에 칸 선 */
export function cubeBlock(o: Pt, a: number, b: number, c: number, u: number): Parts {
  const dx = u * 0.42;
  const dy = u * 0.32;
  const lines: Line[] = [];
  const thin = { width: 1.2 };
  for (let i = 1; i < a; i++) lines.push(seg([o[0] + i * u, o[1]], [o[0] + i * u, o[1] - c * u], thin), seg([o[0] + i * u, o[1] - c * u], [o[0] + i * u + b * dx, o[1] - c * u - b * dy], thin));
  for (let k = 1; k < c; k++) lines.push(seg([o[0], o[1] - k * u], [o[0] + a * u, o[1] - k * u], thin), seg([o[0] + a * u, o[1] - k * u], [o[0] + a * u + b * dx, o[1] - k * u - b * dy], thin));
  for (let j = 1; j < b; j++) {
    lines.push(seg([o[0] + j * dx, o[1] - c * u - j * dy], [o[0] + a * u + j * dx, o[1] - c * u - j * dy], thin));
    lines.push(seg([o[0] + a * u + j * dx, o[1] - j * dy], [o[0] + a * u + j * dx, o[1] - c * u - j * dy], thin));
  }
  const F: Pt[] = [o, [o[0] + a * u, o[1]], [o[0] + a * u, o[1] - c * u], [o[0], o[1] - c * u]];
  const D: Pt = [b * dx, -b * dy];
  return {
    polygons: [{ points: F.map(rp) }, { points: [F[3], F[2], add(F[2], D), add(F[3], D)].map(rp), fill: true }, { points: [F[1], add(F[1], D), add(F[2], D), F[2]].map(rp) }],
    lines,
  };
}

/* ── 쌓기나무 ── */

/** g[행][열]: 0행이 뒤쪽 줄. 뒤에서 앞으로, 왼쪽에서 오른쪽으로, 아래에서 위로 그려 앞의 것이 뒤의 것을 가린다 */
export function cubeStack(g: number[][], o: Pt, u: number): Parts {
  const dx = u * 0.42;
  const dy = u * 0.32;
  const polygons: NonNullable<ShapeScene["polygons"]> = [];
  const rows = g.length;
  for (let r = 0; r < rows; r++) {
    const k = rows - 1 - r;
    g[r].forEach((h, x) => {
      for (let z = 0; z < h; z++) {
        const p0: Pt = [o[0] + x * u + k * dx, o[1] - z * u - k * dy];
        const F: Pt[] = [p0, [p0[0] + u, p0[1]], [p0[0] + u, p0[1] - u], [p0[0], p0[1] - u]];
        const D: Pt = [dx, -dy];
        polygons.push({ points: F.map(rp), fill: "paper" });
        polygons.push({ points: [F[3], F[2], add(F[2], D), add(F[3], D)].map(rp), fill: true });
        polygons.push({ points: [F[1], add(F[1], D), add(F[2], D), F[2]].map(rp), fill: "paper" });
      }
    });
  }
  return { polygons };
}

/** 쌓기나무 그림의 크기(가로, 세로) */
export const stackSize = (rows: number, cols: number, maxH: number, u: number): Pt => [cols * u + rows * u * 0.42, maxH * u + rows * u * 0.32];

/** 위에서 본 모양: 쌓기나무가 있는 칸만 그리고, nums이면 칸에 수를 쓴다. 아래쪽이 앞 */
export function topView(g: number[][], o: Pt, s: number, nums: boolean | ((r: number, c: number) => string | null)): Parts {
  const polygons: NonNullable<ShapeScene["polygons"]> = [];
  const texts: Text[] = [];
  g.forEach((row, r) =>
    row.forEach((h, c) => {
      if (!h) return;
      const x = o[0] + c * s;
      const y = o[1] + r * s;
      polygons.push({ points: [rp([x, y]), rp([x + s, y]), rp([x + s, y + s]), rp([x, y + s])] });
      const t = typeof nums === "function" ? nums(r, c) : nums ? String(h) : null;
      if (t) texts.push(text([x + s / 2, y + s / 2], t));
    }),
  );
  return { polygons, texts };
}

/** 앞(옆)에서 본 모양: 왼쪽부터 각 줄의 높이만큼 정사각형 */
export function viewShape(heights: number[], o: Pt, s: number, fill = false): Parts {
  const polygons: NonNullable<ShapeScene["polygons"]> = [];
  heights.forEach((h, i) => {
    for (let z = 0; z < h; z++) {
      const x = o[0] + i * s;
      const y = o[1] - (z + 1) * s;
      polygons.push({ points: [rp([x, y]), rp([x + s, y]), rp([x + s, y + s]), rp([x, y + s])], fill });
    }
  });
  return { polygons };
}

/* ── 띠그래프·원그래프·그림그래프 ── */

export type Item = { name: string; pct: number; show?: string | null };

/** 띠그래프 칸 글자 줄 간격(글자 14 + 겹침 검사 여유 6) */
const BAND_ROW = 20;
/** 띠 아래에 백분율을 따로 쓰는 줄의 높이 */
export const BAND_BELOW = 22;

const secondText = (it: Item) => (it.show === undefined ? `${it.pct}%` : it.show);
/** 칸이 이름보다 좁은지(폭 264의 10%: 26.4px < 두 글자 이름 28px + 여유) */
const isNarrow = (it: Item, w: number) => (w * it.pct) / 100 < textBox({ at: [0, 0], text: it.name })[2] * 2 + 8;
/** 좁은 칸의 백분율을 띠 아래에 쓰는지(그만큼 그림 높이가 BAND_BELOW 늘어난다) */
export const bandNeedsBelow = (items: Item[], w: number) => items.some((it) => isNarrow(it, w) && !!secondText(it));

/**
 * 띠그래프: 칸마다 항목 이름(과 백분율). scale이면 아래에 10% 눈금.
 * 칸이 이름보다 좁으면 이름을 한 글자씩 세로로 쓰고, 백분율은 그 칸 바로 아래(띠 밖)에 쓴다
 */
export function bandGraph(items: Item[], o: Pt, w: number, h: number, scale: boolean, shade?: number): Parts {
  const polygons: NonNullable<ShapeScene["polygons"]> = [];
  const texts: Text[] = [];
  const lines: Line[] = [];
  let x = o[0];
  items.forEach((it, i) => {
    const iw = (w * it.pct) / 100;
    polygons.push({ points: [rp([x, o[1]]), rp([x + iw, o[1]]), rp([x + iw, o[1] + h]), rp([x, o[1] + h])], fill: i === shade });
    const cx = x + iw / 2;
    const second = secondText(it);
    if (isNarrow(it, w)) {
      const chars = [...it.name];
      chars.forEach((ch, k) => texts.push(text([cx, o[1] + h / 2 + (k - (chars.length - 1) / 2) * BAND_ROW], ch)));
      if (second) texts.push(text([cx, o[1] + h + 14], second));
    } else if (second) {
      texts.push(text([cx, o[1] + h * 0.3], it.name), text([cx, o[1] + h * 0.75], second));
    } else texts.push(text([cx, o[1] + h / 2], it.name));
    x += iw;
  });
  if (scale) {
    const y = o[1] + h + 6;
    lines.push(seg([o[0], y], [o[0] + w, y], { width: 1.2 }));
    for (let p = 0; p <= 100; p += 5) lines.push(seg([o[0] + (w * p) / 100, y], [o[0] + (w * p) / 100, y + (p % 10 === 0 ? 6 : 3)], { width: 1.2 }));
    for (let p = 0; p <= 100; p += 10) texts.push(text([o[0] + (w * p) / 100, y + 16], String(p)));
  }
  return { polygons, texts, lines };
}

/** 원그래프: 위(0%)에서 시계 방향으로 나누고, 둘레에 5% 눈금 */
export function pieGraph(items: Item[], c: Pt, r: number): Parts {
  const lines: Line[] = [];
  const texts: Text[] = [];
  const at = (p: number, rr: number): Pt => [c[0] + rr * Math.cos(rad(-90 + 3.6 * p)), c[1] + rr * Math.sin(rad(-90 + 3.6 * p))];
  for (let p = 0; p < 100; p += 5) lines.push(seg(at(p, r), at(p, r + (p % 10 === 0 ? 7 : 4)), { width: 1.2 }));
  let acc = 0;
  for (const it of items) {
    lines.push(seg(c, at(acc, r)));
    const m = acc + it.pct / 2;
    // 좁은 칸은 글자를 원 둘레 쪽으로 옮겨 두 반지름 사이에 들어가게 한다
    const pos = at(m, r * (it.pct <= 20 ? 0.68 : 0.58));
    const second = it.show === undefined ? `${it.pct}%` : it.show;
    if (second) texts.push(text([pos[0], pos[1] - 11], it.name), text([pos[0], pos[1] + 11], second));
    else texts.push(text(pos, it.name));
    acc += it.pct;
  }
  return { circles: [{ c: rp(c), r }], lines, texts };
}

/** 그림그래프(큰 원 1000, 작은 원 100): 행마다 이름과 그림 */
export function pictureGraph(names: string[], values: (number | null)[], title: [string, string], units: [string, string]): ShapeScene {
  // 폭 288 안쪽(휴대폰에서 글자 12px 이상)
  const nameW = 50;
  const cellW = 230;
  const rowH = 30;
  const W = nameW + cellW + 4;
  const top = 2;
  const H = top + rowH * (names.length + 1) + 34;
  const x0 = 2;
  const lines: Line[] = [];
  const texts: Text[] = [];
  const circles: NonNullable<ShapeScene["circles"]> = [];
  const bottom = top + rowH * (names.length + 1);
  lines.push(seg([x0 + nameW, top], [x0 + nameW, bottom], { width: 1.5 }));
  for (let i = 1; i <= names.length; i++) lines.push(seg([x0, top + rowH * i], [x0 + nameW + cellW, top + rowH * i], { width: 1.5 }));
  texts.push(text([x0 + nameW / 2, top + rowH / 2], title[0]), text([x0 + nameW + cellW / 2, top + rowH / 2], title[1]));
  names.forEach((n, i) => {
    const cy = top + rowH * (i + 1.5);
    texts.push(text([x0 + nameW / 2, cy], n));
    const v = values[i];
    if (v === null) {
      texts.push(text([x0 + nameW + cellW / 2, cy], "?"));
      return;
    }
    let x = x0 + nameW + 14;
    for (let k = 0; k < Math.floor(v / 1000); k++, x += 22) circles.push({ c: rp([x, cy]), r: 9 });
    x -= 3;
    for (let k = 0; k < (v % 1000) / 100; k++, x += 14) circles.push({ c: rp([x + 3, cy]), r: 5 });
  });
  const ly = bottom + 18;
  circles.push({ c: [x0 + 100, ly], r: 9 }, { c: [x0 + 196, ly], r: 5 });
  texts.push(text([x0 + 100 + 14 + half(units[0])[0], ly], units[0]), text([x0 + 196 + 10 + half(units[1])[0], ly], units[1]));
  return { kind: "shape", width: W, height: H, label: `${title[1]} 그림그래프`, polygons: [{ points: [[x0, top], [x0 + nameW + cellW, top], [x0 + nameW + cellW, bottom], [x0, bottom]] }], lines, texts, circles };
}

/* ── 전개도 ── */

const rectPts = (x: number, y: number, w: number, h: number): Pt[] => [rp([x, y]), rp([x + w, y]), rp([x + w, y + h]), rp([x, y + h])];

/** 정n각형 한 변(p0 → p1)에 붙인 다각형: sign 1이면 화면 위쪽, -1이면 아래쪽으로 */
function polyOnEdge(n: number, p0: Pt, p1: Pt, sign: 1 | -1): Pt[] {
  const a = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
  const pts: Pt[] = [p0, p1];
  for (let k = 1; k < n - 1; k++) {
    const t = (-sign * 2 * Math.PI * k) / n;
    const last = pts[pts.length - 1];
    pts.push([last[0] + a * Math.cos(t), last[1] + a * Math.sin(t)]);
  }
  return pts.map(rp);
}

/** 정n각형의 높이(한 변을 바닥에 놓았을 때) */
export const polyHeight = (n: number, a: number) => {
  const pts = polyOnEdge(n, [0, 0], [a, 0], 1);
  return -Math.min(...pts.map((p) => p[1]));
};

export type Net = Parts & { strip: Pt[]; faces: Pt[][] };

/** 각기둥의 전개도: 옆면 n개를 가로로 잇고, 두 번째 옆면의 위·아래에 밑면 */
export function prismNet(n: number, o: Pt, a: number, h: number): Net {
  const faces: Pt[][] = [];
  for (let i = 0; i < n; i++) faces.push(rectPts(o[0] + i * a, o[1], a, h));
  const k = Math.min(1, n - 1);
  const topBase = polyOnEdge(n, [o[0] + k * a, o[1]], [o[0] + (k + 1) * a, o[1]], 1);
  const botBase = polyOnEdge(n, [o[0] + k * a, o[1] + h], [o[0] + (k + 1) * a, o[1] + h], -1);
  return { polygons: [...faces.map((f) => ({ points: f })), { points: topBase }, { points: botBase }], strip: rectPts(o[0], o[1], n * a, h), faces: [...faces, topBase, botBase] };
}

/** 직육면체의 전개도: 옆 − 앞 − 옆 − 뒤를 가로로 잇고, 앞면의 위·아래에 윗면·아랫면 */
export function cuboidNet(o: Pt, a: number, b: number, c: number): Parts & { top: Pt[]; left: Pt[]; front: Pt[] } {
  const y = o[1] + b;
  const left = rectPts(o[0], y, b, c);
  const front = rectPts(o[0] + b, y, a, c);
  const right = rectPts(o[0] + b + a, y, b, c);
  const back = rectPts(o[0] + 2 * b + a, y, a, c);
  const top = rectPts(o[0] + b, o[1], a, b);
  const bottom = rectPts(o[0] + b, y + c, a, b);
  return { polygons: [left, front, right, back, top, bottom].map((points) => ({ points })), top, left, front };
}

/** 원기둥의 전개도: 옆면(직사각형)의 위·아래에 밑면(원) */
export function cylinderNet(o: Pt, w: number, h: number, r: number, at = 0.3): Parts & { rect: Pt[]; topC: Pt; botC: Pt } {
  const x = o[0] + w * at;
  const topC: Pt = rp([x, o[1] - r]);
  const botC: Pt = rp([x, o[1] + h + r]);
  const rect = rectPts(o[0], o[1], w, h);
  return { polygons: [{ points: rect }], circles: [{ c: topC, r }, { c: botC, r }], rect, topC, botC };
}

/* ── 여러 조각을 가로로 늘어놓기(쌓기나무 그림, 위·앞·옆 모양, 보기 ①~④) ── */

export type Block = { w: number; h: number; draw: (o: Pt) => Parts; cap?: string };

/** 조각을 왼쪽부터 늘어놓고 아래를 맞춘다. cap은 조각 위의 글자 */
export function row(blocks: Block[], label: string, gap = 28): ShapeScene {
  const capH = blocks.some((b) => b.cap) ? 26 : 0;
  const widths = blocks.map((b) => Math.max(b.w, b.cap ? half(b.cap)[0] * 2 : 0));
  const H = Math.max(...blocks.map((b) => b.h));
  const parts: Parts[] = [];
  let x = 10;
  blocks.forEach((b, i) => {
    parts.push(b.draw([x + (widths[i] - b.w) / 2, 8 + capH + (H - b.h)]));
    if (b.cap) parts.push({ texts: [text([x + widths[i] / 2, 16], b.cap)] });
    x += widths[i] + gap;
  });
  return compose(Math.round(x - gap + 10), Math.round(8 + capH + H + 8), label, ...parts);
}

/** 쌓기나무 그림 조각 */
export const stackBlock = (g: number[][], u = 26, cap?: string): Block => {
  const [w, h] = stackSize(g.length, g[0].length, Math.max(...g.flat()), u);
  return { w, h, cap, draw: (o) => cubeStack(g, [o[0], o[1] + h], u) };
};

/** 위에서 본 모양 조각(아래에 "앞") */
export const topBlock = (g: number[][], nums: boolean, cap = "위에서 본 모양", s = 26): Block => ({
  w: g[0].length * s,
  h: g.length * s + 22,
  cap,
  draw: (o) => {
    const t = topView(g, o, s, nums);
    return { ...t, texts: [...(t.texts ?? []), text([o[0] + (g[0].length * s) / 2, o[1] + g.length * s + 13], "앞")] };
  },
});

/** 앞(옆)에서 본 모양 조각 */
export const viewBlock = (heights: number[], cap?: string, maxH = 3, s = 18): Block => ({
  w: heights.length * s,
  h: maxH * s,
  cap,
  draw: (o) => viewShape(heights, [o[0], o[1] + maxH * s], s),
});

/** 층별로 나타낸 모양 조각: 칸을 모두 그리고 그 층에 쌓기나무가 있는 칸을 색칠 */
export const layerBlock = (g: number[][], layer: number, cap?: string, s = 22): Block => ({
  w: g[0].length * s,
  h: g.length * s,
  cap,
  draw: (o) => ({
    polygons: g.flatMap((r, i) =>
      r.map((h, c) => {
        const [x, y] = [o[0] + c * s, o[1] + i * s];
        return { points: [rp([x, y]), rp([x + s, y]), rp([x + s, y + s]), rp([x, y + s])], fill: h > layer };
      }),
    ),
  }),
});

export type SolidKind = "prism" | "pyramid" | "frustum" | "cylinder" | "cone" | "sphere";
/** 입체도형 네(다섯) 개를 가, 나, 다, 라(, 마) 순서로 늘어놓은 그림 */
export function lineup(kinds: SolidKind[], ns: number[]): ShapeScene {
  const parts: Parts[] = kinds.map((k, i) => {
    const p: Place = { cx: 55 + i * 104, top: 26, bottom: 104, rx: 38, ry: 12 };
    const body =
      k === "prism" ? prism(ns[i], p) : k === "pyramid" ? pyramid(ns[i], p) : k === "frustum" ? prism(ns[i], p, 0.55) : k === "cylinder" ? cylinder(p) : k === "cone" ? cone(p) : sphere([p.cx, 68], 40);
    return { ...body, texts: [text([p.cx, 136], LETTERS[i])] };
  });
  return compose(kinds.length * 104 + 6, 150, `입체도형 ${kinds.length}개를 ${LETTERS.slice(0, kinds.length).join(", ")}로 늘어놓은 그림`, ...parts);
}

/** 그림 b를 그림 a 아래에 놓는다(가운데 맞춤) */
export function below(a: ShapeScene, b: ShapeScene, gap: number, label: string): ShapeScene {
  const width = Math.max(a.width, b.width);
  const move = (sc: ShapeScene, dx: number, dy: number): Parts => {
    const mv = (p: Pt): Pt => rp([p[0] + dx, p[1] + dy]);
    return {
      polygons: sc.polygons?.map((p) => ({ ...p, points: p.points.map(mv) })),
      lines: sc.lines?.map((l) => ({ ...l, from: mv(l.from), to: mv(l.to) })),
      circles: sc.circles?.map((c) => ({ ...c, c: mv(c.c) })),
      arcs: sc.arcs?.map((x) => ({ ...x, c: mv(x.c) })),
      dots: sc.dots?.map(mv),
      texts: sc.texts?.map((t) => ({ ...t, at: mv(t.at) })),
    };
  };
  return compose(width, a.height + gap + b.height, label, move(a, (width - a.width) / 2, 0), move(b, (width - b.width) / 2, a.height + gap));
}

/** 선분 ab의 가운데에서 글자로 가는 가는 지시선 */
export function leader(a: Pt, b: Pt, t: Text): Line {
  const m = mid(a, b);
  const dx = t.at[0] - m[0];
  const dy = t.at[1] - m[1];
  const len = Math.hypot(dx, dy) || 1;
  const stop = Math.max(0, len - 9);
  return { from: rp(m), to: rp([m[0] + (dx / len) * stop, m[1] + (dy / len) * stop]), width: 1 };
}
