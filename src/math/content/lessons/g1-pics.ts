import type { ShapeScene } from "../types";
import { clockNumR, clockParts } from "../generators/pictures";
import { figureOk } from "../figure-check";
import { randInt } from "../../lib/random";
import { josa } from "../josa";

/**
 * 1학년 그림 도구: 입체 모양(상자·둥근기둥·공), 크기·방향이 다른 △□○, 꾸민 모양, 모양 줄, 시계 여러 개, 수 배열표.
 * 교과서처럼 "그림을 보고" 푸는 문제를 만들기 위해 쓴다. 글자는 모두 그림 밖 가장자리(번호)나 칸 안에만 둔다.
 */

export type Pt = [number, number];
type Line = NonNullable<ShapeScene["lines"]>[number];

/** 그림 조각을 모아 ShapeScene을 만든다 */
export class Canvas {
  polygons: NonNullable<ShapeScene["polygons"]> = [];
  lines: Line[] = [];
  circles: NonNullable<ShapeScene["circles"]> = [];
  arcs: NonNullable<ShapeScene["arcs"]> = [];
  dots: Pt[] = [];
  texts: NonNullable<ShapeScene["texts"]> = [];

  poly(points: Pt[], fill = false) {
    this.polygons.push({ points: points.map(([x, y]) => [round(x), round(y)] as Pt), ...(fill ? { fill: true } : {}) });
  }
  line(from: Pt, to: Pt, opts: Omit<Line, "from" | "to"> = {}) {
    this.lines.push({ from: [round(from[0]), round(from[1])], to: [round(to[0]), round(to[1])], ...opts });
  }
  /** 이어진 선(열린 곡선) */
  path(points: Pt[], width = 2) {
    for (let i = 1; i < points.length; i++) this.line(points[i - 1], points[i], { width });
  }
  circle(c: Pt, r: number) {
    this.circles.push({ c: [round(c[0]), round(c[1])], r: round(r) });
  }
  text(at: Pt, text: string) {
    this.texts.push({ at: [round(at[0]), round(at[1])], text });
  }
  scene(width: number, height: number, label: string): ShapeScene {
    const s: ShapeScene = { kind: "shape", width: Math.round(width), height: Math.round(height), label };
    if (this.polygons.length) s.polygons = this.polygons;
    if (this.lines.length) s.lines = this.lines;
    if (this.circles.length) s.circles = this.circles;
    if (this.arcs.length) s.arcs = this.arcs;
    if (this.dots.length) s.dots = this.dots;
    if (this.texts.length) s.texts = this.texts;
    return s;
  }
}

const round = (v: number) => Math.round(v * 10) / 10;

/** 타원 위의 점(각도는 화면 기준: 0°가 오른쪽, 90°가 아래) */
export function ellipse(cx: number, cy: number, rx: number, ry: number, from = 0, to = 360, n = 24): Pt[] {
  const k = Math.max(2, Math.round((n * Math.abs(to - from)) / 360));
  return Array.from({ length: k + 1 }, (_, i) => {
    const t = ((from + ((to - from) * i) / k) * Math.PI) / 180;
    return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)] as Pt;
  }).slice(0, to - from === 360 ? k : k + 1);
}

/** 그림이 칸 안에 있고 글자가 겹치지 않는지(생성기에서 다시 뽑을 때 쓴다) */
export const sceneOk = figureOk;

export const MARKS = ["①", "②", "③", "④", "⑤", "⑥"];

/* ════════ 입체 모양 ════════ */

export type SolidKind = "box" | "cyl" | "ball";
export const SOLID_NAME: Record<SolidKind, string> = { box: "상자 모양", cyl: "둥근기둥 모양", ball: "공 모양" };
export const SOLID_KINDS: SolidKind[] = ["box", "cyl", "ball"];

/** 입체 모양 하나: 종류와 모습(주사위, 납작한 상자, 세운 통, 눕힌 통, 큰 공, 구슬 …) */
export type Solid = { kind: SolidKind; v: number };
const SOLID_VARIANTS: Record<SolidKind, number> = { box: 4, cyl: 3, ball: 3 };

/** 크기(너비, 높이) */
export function solidSize({ kind, v }: Solid): [number, number] {
  if (kind === "box") return [[42, 42], [60, 34], [40, 56], [52, 42]][v] as [number, number];
  if (kind === "cyl") return [[28, 42], [46, 30], [54, 26]][v] as [number, number];
  return [[36, 36], [24, 24], [44, 44]][v] as [number, number];
}

/** (x, y)를 왼쪽 위로 하여 입체 모양을 그린다 */
export function drawSolid(cv: Canvas, s: Solid, x: number, y: number) {
  const [w, h] = solidSize(s);
  if (s.kind === "box") {
    const d = 12;
    const fw = w - d;
    const fh = h - d;
    cv.poly([[x, y + d], [x + fw, y + d], [x + fw, y + h], [x, y + h]]);
    cv.poly([[x, y + d], [x + d, y], [x + w, y], [x + fw, y + d]]);
    cv.poly([[x + fw, y + d], [x + w, y], [x + w, y + fh], [x + fw, y + h]], true);
    if (s.v === 0) {
      // 주사위 눈 다섯
      const [cx, cy] = [x + fw / 2, y + d + fh / 2];
      for (const [dx, dy] of [[-8, -8], [8, -8], [0, 0], [-8, 8], [8, 8]]) cv.dots.push([round(cx + dx), round(cy + dy)]);
    }
    return;
  }
  if (s.kind === "cyl") {
    if (s.v === 2) {
      // 눕힌 둥근기둥: 오른쪽 끝이 보인다
      const rx = 7;
      const cy = y + h / 2;
      cv.poly(ellipse(x + w - rx, cy, rx, h / 2), true);
      cv.line([x + rx, y], [x + w - rx, y]);
      cv.line([x + rx, y + h], [x + w - rx, y + h]);
      cv.path(ellipse(x + rx, cy, rx, h / 2, 90, 270, 16));
      return;
    }
    const ry = s.v === 1 ? 8 : 6;
    const cx = x + w / 2;
    cv.poly(ellipse(cx, y + ry, w / 2, ry), true);
    cv.line([x, y + ry], [x, y + h - ry]);
    cv.line([x + w, y + ry], [x + w, y + h - ry]);
    cv.path(ellipse(cx, y + h - ry, w / 2, ry, 0, 180, 16));
    return;
  }
  const r = w / 2;
  const c: Pt = [x + r, y + r];
  cv.circle(c, r);
  if (s.v === 1) cv.path(ellipse(c[0] - r * 0.3, c[1] - r * 0.3, r * 0.35, r * 0.35, 190, 260, 6), 1.5);
  else cv.path(ellipse(c[0], c[1], r, r * 0.3, 0, 180, 16), 1.2);
  if (s.v === 2) cv.path(ellipse(c[0], c[1], r * 0.3, r, 270, 450, 16), 1.2);
}

/** 여러 모습 중 하나 */
export function randomSolid(rand: () => number, kind: SolidKind): Solid {
  return { kind, v: randInt(rand, 0, SOLID_VARIANTS[kind] - 1) };
}

/** 입체 모양을 한 줄(또는 여러 줄)로 늘어놓은 그림. marks를 주면 아래에 번호를 붙인다 */
export function solidsScene(items: Solid[], label: string, marks?: string[], perRow = 5): ShapeScene {
  const cv = new Canvas();
  const cellW = 72;
  const cellH = marks ? 86 : 70;
  const cols = Math.min(perRow, items.length);
  items.forEach((s, i) => {
    const [w, h] = solidSize(s);
    const cx = 8 + (i % cols) * cellW + cellW / 2;
    const base = 8 + Math.floor(i / cols) * cellH + 60;
    drawSolid(cv, s, cx - w / 2, base - h);
    if (marks) cv.text([cx, base + 16], marks[i]);
  });
  return cv.scene(16 + cols * cellW, 12 + Math.ceil(items.length / cols) * cellH, label);
}

/** 여러 가지 모양을 쌓아 만든 모양: 기둥 2~3개, 기둥마다 1~3층, 공 모양은 맨 위에만 */
export type Build = Solid[][];

export function randomBuild(rand: () => number): Build {
  const cols = randInt(rand, 2, 3);
  return Array.from({ length: cols }, () => {
    const n = randInt(rand, 1, 3);
    return Array.from({ length: n }, (_, i) => {
      const top = i === n - 1;
      const kind: SolidKind = top && rand() < 0.45 ? "ball" : rand() < 0.5 ? "box" : "cyl";
      return { kind, v: 0 };
    });
  });
}

export const buildCounts = (b: Build) => SOLID_KINDS.map((k) => b.flat().filter((s) => s.kind === k).length);

const BUILD_PART: Record<SolidKind, [number, number]> = { box: [46, 30], cyl: [40, 32], ball: [34, 34] };

/** 쌓은 모양을 (x0, 바닥 y)부터 그린다. 너비를 돌려준다 */
function drawBuild(cv: Canvas, b: Build, x0: number, floor: number): number {
  const colW = 56;
  b.forEach((col, ci) => {
    let y = floor;
    for (const s of col) {
      const [w, h] = BUILD_PART[s.kind];
      const x = x0 + ci * colW + (colW - w) / 2;
      y -= h;
      if (s.kind === "box") {
        const d = 10;
        cv.poly([[x, y + d], [x + w - d, y + d], [x + w - d, y + h], [x, y + h]]);
        cv.poly([[x, y + d], [x + d, y], [x + w, y], [x + w - d, y + d]]);
        cv.poly([[x + w - d, y + d], [x + w, y], [x + w, y + h - d], [x + w - d, y + h]], true);
      } else if (s.kind === "cyl") {
        const ry = 6;
        cv.poly(ellipse(x + w / 2, y + ry, w / 2, ry), true);
        cv.line([x, y + ry], [x, y + h - ry]);
        cv.line([x + w, y + ry], [x + w, y + h - ry]);
        cv.path(ellipse(x + w / 2, y + h - ry, w / 2, ry, 0, 180, 16));
      } else {
        cv.circle([x + w / 2, y + h / 2], w / 2);
        cv.path(ellipse(x + w / 2, y + h / 2, w / 2, w * 0.15, 0, 180, 16), 1.2);
      }
      y -= 2;
    }
  });
  return b.length * colW;
}

const buildHeight = (b: Build) => Math.max(...b.map((col) => col.reduce((s, p) => s + BUILD_PART[p.kind][1] + 2, 0)));

export function buildScene(b: Build, label = "여러 가지 모양으로 쌓아 만든 모양"): ShapeScene {
  const cv = new Canvas();
  const h = buildHeight(b);
  const floor = 10 + h;
  const w = drawBuild(cv, b, 10, floor);
  cv.line([4, floor + 1], [w + 16, floor + 1], { width: 1 });
  return cv.scene(w + 20, floor + 10, label);
}

/** 쌓아 만든 모양 두 개(①, ②) — "나는 가보다"처럼 읽히지 않게 번호를 쓴다 */
export function twoBuildsScene(a: Build, b: Build): ShapeScene {
  const cv = new Canvas();
  const h = Math.max(buildHeight(a), buildHeight(b));
  const floor = 12 + h;
  const wa = drawBuild(cv, a, 10, floor);
  const xb = 10 + wa + 30;
  const wb = drawBuild(cv, b, xb, floor);
  cv.line([4, floor + 1], [10 + wa + 8, floor + 1], { width: 1 });
  cv.line([xb - 8, floor + 1], [xb + wb + 6, floor + 1], { width: 1 });
  cv.text([10 + wa / 2, floor + 18], "①");
  cv.text([xb + wb / 2, floor + 18], "②");
  return cv.scene(xb + wb + 10, floor + 30, "여러 가지 모양으로 쌓아 만든 모양 ①, ②");
}

/** 가리개 뒤로 입체 모양의 윗부분만 보이는 그림 */
export function peekScene(kind: SolidKind): ShapeScene {
  const cv = new Canvas();
  const wallTop = 70;
  if (kind === "box") {
    // 상자 윗면과 모서리가 조금 보인다
    const [x, y, w, d] = [58, 28, 66, 14];
    cv.poly([[x, y + d], [x + d, y], [x + w, y], [x + w - d, y + d]]);
    cv.line([x, y + d], [x, wallTop]);
    cv.line([x + w - d, y + d], [x + w - d, wallTop]);
    cv.poly([[x + w - d, y + d], [x + w, y], [x + w, wallTop], [x + w - d, wallTop]], true);
  } else if (kind === "cyl") {
    const [cx, y, rx, ry] = [92, 32, 30, 8];
    cv.poly(ellipse(cx, y + ry, rx, ry));
    cv.line([cx - rx, y + ry], [cx - rx, wallTop]);
    cv.line([cx + rx, y + ry], [cx + rx, wallTop]);
  } else {
    cv.path(ellipse(92, wallTop, 38, 38, 180, 360, 24));
  }
  cv.poly([[20, wallTop], [164, wallTop], [164, 118], [20, 118]], true);
  return cv.scene(184, 126, "가리개 뒤에 있는 물건의 윗부분");
}

/**
 * 본뜨기용 입체와 색칠한(본뜰) 평평한 부분.
 * - box-front·box-top·box-side: 상자의 앞면·윗면·옆면(□)
 * - cyl-0·cyl-1: 세운 둥근기둥의 윗면(○), cyl-lying: 눕힌 둥근기둥의 오른쪽 끝(○)
 * - prism-front·prism-tall: 세모 기둥의 앞면(△, 모양이 다른 두 가지), prism-side: 세모 기둥의 옆면(□)
 */
export type TraceView = "box-front" | "box-top" | "box-side" | "cyl-0" | "cyl-1" | "cyl-lying" | "prism-front" | "prism-tall" | "prism-side";
export const TRACE_FACE: Record<TraceView, 3 | 4 | 0> = {
  "box-front": 4, "box-top": 4, "box-side": 4, "cyl-0": 0, "cyl-1": 0, "cyl-lying": 0, "prism-front": 3, "prism-tall": 3, "prism-side": 4,
};
export function traceSolidScene(view: TraceView): ShapeScene {
  const cv = new Canvas();
  if (view.startsWith("box")) {
    const [x, y, w, h, d] = view === "box-top" ? [50, 24, 60, 26, 16] : view === "box-side" ? [56, 16, 36, 40, 20] : [60, 20, 40, 30, 12];
    const top: Pt[] = [[x, y + d], [x + d, y], [x + w + d, y], [x + w, y + d]];
    const side: Pt[] = [[x + w, y + d], [x + w + d, y], [x + w + d, y + h], [x + w, y + d + h]];
    const front: Pt[] = [[x, y + d], [x + w, y + d], [x + w, y + d + h], [x, y + d + h]];
    cv.poly(top, view === "box-top");
    cv.poly(side, view === "box-side");
    cv.poly(front, view === "box-front");
  } else if (view === "cyl-0") drawSolid(cv, { kind: "cyl", v: 1 }, 62, 26);
  else if (view === "cyl-1") drawSolid(cv, { kind: "cyl", v: 0 }, 62, 22);
  else if (view === "cyl-lying") drawSolid(cv, { kind: "cyl", v: 2 }, 40, 30);
  else {
    const [x, y, s, hgt, d] = view === "prism-tall" ? [56, 14, 40, 58, 26] : [50, 18, 50, 42, 30];
    const front: Pt[] = [[x, y + 8 + hgt], [x + s, y + 8 + hgt], [x + s / 2, y + 8]];
    const side: Pt[] = [front[1], [front[1][0] + d, front[1][1] - 12], [front[2][0] + d, front[2][1] - 12], front[2]];
    cv.poly(side, view === "prism-side");
    cv.poly(front, view !== "prism-side");
  }
  return cv.scene(170, 90, "물건 그림(색칠한 부분이 본뜰 평평한 부분)");
}

/* ════════ △, □, ○ 모양 ════════ */

export type FlatKind = 3 | 4 | 0;
export const FLAT_NAME: Record<FlatKind, string> = { 3: "△", 4: "□", 0: "○" };

/** 크기·방향·길쭉함이 다른 △□○를 (cx, cy) 가운데, 반지름 r 안에 그린다 */
export function drawFlat(cv: Canvas, kind: FlatKind, cx: number, cy: number, r: number, rand: () => number) {
  if (kind === 0) {
    cv.circle([cx, cy], r * (0.55 + rand() * 0.4));
    return;
  }
  const rot = rand() * Math.PI * 2;
  let pts: Pt[];
  if (kind === 4) {
    const aspect = 1 + rand() * 1.1;
    const hw = 1;
    const hh = 1 / aspect;
    pts = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]];
  } else {
    // 여러 가지 세모: 바른 세모, 직각 세모, 길쭉한 세모
    const t = randInt(rand, 0, 2);
    pts = t === 0 ? [[0, -1], [0.87, 0.5], [-0.87, 0.5]] : t === 1 ? [[-0.8, -0.8], [0.8, 0.8], [-0.8, 0.8]] : [[0, -1], [0.45, 0.9], [-0.45, 0.9]];
  }
  const scale = r * (0.6 + rand() * 0.4);
  const rotated = pts.map(([x, y]) => [x * Math.cos(rot) - y * Math.sin(rot), x * Math.sin(rot) + y * Math.cos(rot)] as Pt);
  const ext = Math.max(...rotated.map(([x, y]) => Math.hypot(x, y)));
  cv.poly(rotated.map(([x, y]) => [cx + (x / ext) * scale, cy + (y / ext) * scale] as Pt));
}

/** △□○를 크기·방향을 섞어 칸에 늘어놓은 그림. marks를 주면 아래에 번호를 붙인다 */
export function flatsScene(list: FlatKind[], rand: () => number, label: string, marks?: string[], perRow = 6): ShapeScene {
  const cv = new Canvas();
  const cell = 58;
  const cellH = marks ? cell + 20 : cell;
  const cols = Math.min(perRow, list.length);
  list.forEach((k, i) => {
    const cx = 8 + (i % cols) * cell + cell / 2;
    const cy = 8 + Math.floor(i / cols) * cellH + cell / 2;
    drawFlat(cv, k, cx, cy, cell / 2 - 3, rand);
    if (marks) cv.text([cx, cy + cell / 2 + 10], marks[i]);
  });
  return cv.scene(16 + cols * cell, 16 + Math.ceil(list.length / cols) * cellH, label);
}

/** 생활 물건(평면 모양이 드러나는 쪽): 그림으로 그릴 수 있는 것만. 안쪽 무늬에 다른 모양(△ 속 □ 등)이 들어가지 않게 그린다 */
export const FLAT_THINGS: { name: string; kind: FlatKind }[] = [
  { name: "액자", kind: 4 },
  { name: "공책", kind: 4 },
  { name: "스케치북", kind: 4 },
  { name: "삼각자", kind: 3 },
  { name: "옷걸이", kind: 3 },
  { name: "샌드위치", kind: 3 },
  { name: "동전", kind: 0 },
  { name: "단추", kind: 0 },
  { name: "접시", kind: 0 },
];

/** 물건 하나를 (cx, cy) 가운데에 그린다(크기 약 48) */
export function drawThing(cv: Canvas, name: string, cx: number, cy: number) {
  const box = (hw: number, hh: number): Pt[] => [[cx - hw, cy - hh], [cx + hw, cy - hh], [cx + hw, cy + hh], [cx - hw, cy + hh]];
  const tri = (s: number, dy = 0): Pt[] => [[cx, cy - s + dy], [cx + s * 1.05, cy + s * 0.75 + dy], [cx - s * 1.05, cy + s * 0.75 + dy]];
  switch (name) {
    case "액자":
      cv.poly(box(20, 24));
      cv.poly(box(13, 17), true);
      return;
    case "공책":
      cv.poly(box(18, 24));
      cv.line([cx - 12, cy - 24], [cx - 12, cy + 24]);
      for (const dy of [-10, 0, 10]) cv.line([cx - 7, cy + dy], [cx + 13, cy + dy], { width: 1 });
      return;
    case "스케치북":
      // 위쪽 스프링은 점으로
      cv.poly(box(24, 18));
      for (let i = 0; i < 6; i++) cv.dots.push([cx - 17 + i * 7, cy - 12]);
      return;
    case "삼각자":
      cv.poly([[cx - 20, cy - 22], [cx + 22, cy + 20], [cx - 20, cy + 20]]);
      cv.poly([[cx - 12, cy - 4], [cx + 4, cy + 12], [cx - 12, cy + 12]], true);
      return;
    case "옷걸이":
      cv.poly(tri(20, 6));
      cv.line([cx, cy - 14], [cx, cy - 20], { width: 1.5 });
      cv.path(ellipse(cx + 4, cy - 20, 4, 4, 180, 360, 8), 1.5);
      return;
    case "샌드위치":
      // 빵 테두리 안쪽에 속(작은 △)
      cv.poly(tri(22, 2));
      cv.poly(tri(13, 4), true);
      return;
    case "동전":
      cv.circle([cx, cy], 20);
      cv.circle([cx, cy], 15);
      return;
    case "단추":
      cv.circle([cx, cy], 18);
      for (const [dx, dy] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) cv.dots.push([cx + dx, cy + dy]);
      return;
    default:
      // 접시
      cv.circle([cx, cy], 24);
      cv.circle([cx, cy], 14);
  }
}

/** 물건 그림 여러 개에 번호 */
export function thingsScene(names: string[], label = "생활 물건 그림"): ShapeScene {
  const cv = new Canvas();
  const cell = 66;
  names.forEach((n, i) => {
    const cx = 8 + i * cell + cell / 2;
    drawThing(cv, n, cx, 36);
    cv.text([cx, 80], MARKS[i]);
  });
  return cv.scene(16 + names.length * cell, 94, label);
}

/** △□○로 꾸민 그림: 집·로켓·자동차·로봇 중 하나, 창문·해 같은 부분은 있을 수도 없을 수도 있다 */
export type FlatPart = { kind: FlatKind; pts?: Pt[]; c?: Pt; r?: number };

export function randomDesign(rand: () => number): { name: string; parts: FlatPart[] } {
  const rect = (x: number, y: number, w: number, h: number): FlatPart => ({ kind: 4, pts: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]] });
  const tri = (a: Pt, b: Pt, c: Pt): FlatPart => ({ kind: 3, pts: [a, b, c] });
  const circ = (x: number, y: number, r: number): FlatPart => ({ kind: 0, c: [x, y], r });
  const maybe = (p: number, part: FlatPart) => (rand() < p ? [part] : []);
  const which = randInt(rand, 0, 3);
  if (which === 0) {
    const winKind = rand() < 0.5 ? 4 : 0;
    const win = (x: number) => (winKind === 4 ? rect(x - 10, 92, 20, 20) : circ(x, 102, 10));
    return {
      name: "집",
      parts: [
        rect(40, 80, 100, 80),
        tri([30, 80], [90, 30], [150, 80]),
        rect(78, 118, 24, 42),
        win(58),
        ...maybe(0.6, win(122)),
        ...maybe(0.6, circ(176, 34, 16)),
        // 나무: 잎(△)과 줄기(□)를 함께 그린다
        ...(rand() < 0.5 ? [tri([166, 128], [182, 96], [198, 128]), rect(176, 128, 12, 32)] : []),
      ],
    };
  }
  if (which === 1) {
    const wins = randInt(rand, 1, 3);
    return {
      name: "로켓",
      parts: [
        rect(80, 50, 40, 90),
        tri([80, 50], [100, 12], [120, 50]),
        tri([80, 110], [80, 140], [58, 140]),
        tri([120, 110], [120, 140], [142, 140]),
        ...Array.from({ length: wins }, (_, i) => circ(100, 66 + i * 22, 8)),
        ...maybe(0.5, tri([88, 140], [112, 140], [100, 162])),
        ...maybe(0.5, circ(34, 34, 12)),
      ],
    };
  }
  if (which === 2) {
    return {
      name: "자동차",
      parts: [
        rect(20, 80, 160, 44),
        rect(56, 46, 80, 34),
        rect(66, 54, 26, 20),
        ...maybe(0.6, rect(100, 54, 26, 20)),
        circ(58, 132, 16),
        circ(142, 132, 16),
        ...maybe(0.5, circ(168, 94, 6)),
        ...maybe(0.5, tri([20, 80], [56, 80], [56, 46])),
      ],
    };
  }
  return {
    name: "로봇",
    parts: [
      rect(74, 20, 52, 40),
      circ(88, 38, 6),
      circ(112, 38, 6),
      ...maybe(0.5, tri([94, 54], [106, 54], [100, 46])),
      rect(64, 62, 72, 64),
      rect(40, 66, 22, 50),
      rect(138, 66, 22, 50),
      rect(72, 128, 22, 40),
      rect(106, 128, 22, 40),
      ...maybe(0.6, circ(100, 10, 6)),
      ...maybe(0.5, tri([88, 80], [112, 80], [100, 100])),
      ...maybe(0.5, circ(100, 112, 7)),
    ],
  };
}

export const designCounts = (parts: FlatPart[]): Record<FlatKind, number> => ({
  3: parts.filter((p) => p.kind === 3).length,
  4: parts.filter((p) => p.kind === 4).length,
  0: parts.filter((p) => p.kind === 0).length,
});

function drawDesign(cv: Canvas, parts: FlatPart[], dx: number, dy: number) {
  for (const p of parts) {
    if (p.kind === 0) cv.circle([p.c![0] + dx, p.c![1] + dy], p.r!);
    else cv.poly(p.pts!.map(([x, y]) => [x + dx, y + dy] as Pt));
  }
}

export function designScene(parts: FlatPart[], name: string): ShapeScene {
  const cv = new Canvas();
  drawDesign(cv, parts, 4, 4);
  return cv.scene(210, 178, `△, □, ○ 모양으로 꾸민 ${name}`);
}

export function twoDesignsScene(a: FlatPart[], b: FlatPart[]): ShapeScene {
  const cv = new Canvas();
  drawDesign(cv, a, 4, 4);
  drawDesign(cv, b, 214, 4);
  cv.text([104, 186], "①");
  cv.text([314, 186], "②");
  return cv.scene(420, 196, "△, □, ○ 모양으로 꾸민 그림 ①, ②");
}

/** 길이가 같은 막대로 만든 △, □ (막대 사이를 조금 띄워 하나씩 셀 수 있게) */
export function sticksScene(tri: number, sq: number): ShapeScene {
  const cv = new Canvas();
  const L = 40;
  const gap = 4;
  const seg = (a: Pt, b: Pt) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const ux = (b[0] - a[0]) / len;
    const uy = (b[1] - a[1]) / len;
    cv.line([a[0] + ux * gap, a[1] + uy * gap], [b[0] - ux * gap, b[1] - uy * gap], { width: 4 });
  };
  let x = 12;
  for (let i = 0; i < tri; i++) {
    const a: Pt = [x, 60];
    const b: Pt = [x + L, 60];
    const c: Pt = [x + L / 2, 60 - L * 0.87];
    seg(a, b);
    seg(b, c);
    seg(c, a);
    x += L + 16;
  }
  for (let i = 0; i < sq; i++) {
    const p: Pt[] = [[x, 20], [x + L, 20], [x + L, 60], [x, 60]];
    for (let k = 0; k < 4; k++) seg(p[k], p[(k + 1) % 4]);
    x += L + 16;
  }
  return cv.scene(x, 72, `막대로 만든 △ 모양 ${tri}개와 □ 모양 ${sq}개`);
}

/* ════════ 모양 줄(규칙 찾기) ════════ */

/** 모양 기호를 그림으로: ○● △▲ ☆★ ◇◆ ♡♥ □■, "?"는 빈칸(점선 네모) */
export function drawToken(cv: Canvas, t: string, cx: number, cy: number, r = 12) {
  const filled = "●▲★◆♥■".includes(t);
  const base = { "●": "○", "▲": "△", "★": "☆", "◆": "◇", "♥": "♡", "■": "□" }[t] ?? t;
  if (base === "?") {
    const s = r + 2;
    const c: Pt[] = [[cx - s, cy - s], [cx + s, cy - s], [cx + s, cy + s], [cx - s, cy + s]];
    for (let k = 0; k < 4; k++) cv.line(c[k], c[(k + 1) % 4], { dashed: true, width: 1.5 });
    cv.text([cx, cy], "?");
    return;
  }
  if (base === "○") {
    if (filled) cv.poly(ellipse(cx, cy, r, r, 0, 360, 20), true);
    else cv.circle([cx, cy], r);
    return;
  }
  let pts: Pt[];
  if (base === "△") pts = [[0, -1.05], [1.05, 0.8], [-1.05, 0.8]];
  else if (base === "◇") pts = [[0, -1.1], [0.8, 0], [0, 1.1], [-0.8, 0]];
  else if (base === "□") pts = [[-0.85, -0.85], [0.85, -0.85], [0.85, 0.85], [-0.85, 0.85]];
  else if (base === "☆") pts = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5; const q = i % 2 ? 0.45 : 1.1; return [q * Math.cos(a), q * Math.sin(a) + 0.08] as Pt; });
  else {
    // ♡: 하트 곡선
    pts = Array.from({ length: 28 }, (_, i) => {
      const t2 = (i / 28) * Math.PI * 2;
      return [(16 * Math.sin(t2) ** 3) / 15, -(13 * Math.cos(t2) - 5 * Math.cos(2 * t2) - 2 * Math.cos(3 * t2) - Math.cos(4 * t2)) / 15 - 0.1] as Pt;
    });
  }
  cv.poly(pts.map(([x, y]) => [cx + x * r, cy + y * r] as Pt), filled);
}

/** 모양 줄: 한 줄에 perRow개씩. numbers를 주면 칸 위에 번호(1, 2, 3, …)를 붙인다 */
export function tokensScene(tokens: string[], label: string, opts: { perRow?: number; numbers?: boolean; tail?: boolean } = {}): ShapeScene {
  const cv = new Canvas();
  const pitch = 38;
  const perRow = Math.min(opts.perRow ?? 10, tokens.length + (opts.tail ? 1 : 0));
  const top = opts.numbers ? 22 : 6;
  const rowH = opts.numbers ? 58 : 40;
  tokens.forEach((t, i) => {
    const cx = 10 + (i % perRow) * pitch + pitch / 2;
    const cy = top + Math.floor(i / perRow) * rowH + 18;
    drawToken(cv, t, cx, cy);
    if (opts.numbers) cv.text([cx, cy - 26], String(i + 1));
  });
  const n = tokens.length + (opts.tail ? 1 : 0);
  if (opts.tail) {
    const i = tokens.length;
    cv.text([10 + (i % perRow) * pitch + pitch / 2, top + Math.floor(i / perRow) * rowH + 18], "…");
  }
  return cv.scene(20 + perRow * pitch, top + Math.ceil(n / perRow) * rowH - (opts.numbers ? 12 : 0) + 4, label);
}

/** 한 줄로 선 사람 n명(모두 ○, 아무도 칠하지 않음). 왼쪽 끝에 '앞', 오른쪽 끝에 '뒤' 글자 */
export function lineFrontBackScene(n: number): ShapeScene {
  const cv = new Canvas();
  const pitch = 34;
  const x0 = 44;
  cv.text([18, 24], "앞");
  for (let i = 0; i < n; i++) drawToken(cv, "○", x0 + i * pitch, 24);
  cv.text([x0 + (n - 1) * pitch + 32, 24], "뒤");
  return cv.scene(x0 + (n - 1) * pitch + 52, 48, `친구 ${n}명이 한 줄로 선 그림(왼쪽이 앞, 오른쪽이 뒤)`);
}

/** 모으기: 접시 두 개에 ●를 따로 담은 그림(왼쪽 a개, 오른쪽 b개) */
export function twoPlatesScene(a: number, b: number): ShapeScene {
  const cv = new Canvas();
  const cell = 24;
  const plateW = 3 * cell + 16;
  const rows = Math.ceil(Math.max(a, b) / 3);
  const plateH = rows * cell + 16;
  const plate = (x: number, n: number) => {
    cv.poly([[x, 8], [x + plateW, 8], [x + plateW, 8 + plateH], [x, 8 + plateH]]);
    for (let i = 0; i < n; i++) drawToken(cv, "●", x + 8 + (i % 3) * cell + cell / 2, 16 + Math.floor(i / 3) * cell + cell / 2, 8);
  };
  plate(8, a);
  plate(8 + plateW + 30, b);
  return cv.scene(16 + 2 * plateW + 30, 16 + plateH, `접시 두 개에 담은 ●: 왼쪽 접시 ${a}개, 오른쪽 접시 ${b}개`);
}

/** 여러 줄의 모양 줄에 번호(①~④)를 붙인 그림 */
export function tokenRowsScene(rows: string[][], label: string): ShapeScene {
  const cv = new Canvas();
  const pitch = 34;
  rows.forEach((row, r) => {
    const cy = 22 + r * 40;
    cv.text([16, cy], MARKS[r]);
    row.forEach((t, i) => drawToken(cv, t, 50 + i * pitch, cy, 11));
  });
  return cv.scene(40 + Math.max(...rows.map((r) => r.length)) * pitch + 8, 12 + rows.length * 40, label);
}

/* ════════ 시계 여러 개 ════════ */

const CLOCK_R = 72;
const CLOCK_HALF = clockNumR(CLOCK_R) + 12;

/**
 * 시계 2~4개(2개씩 두 줄)에 번호를 붙인 그림.
 * swap: 긴바늘과 짧은바늘을 바꾼 시계(짧은바늘이 12, 긴바늘이 h), hourOn: 짧은바늘을 h에 딱 맞춘 시계(몇 시 30분을 잘못 나타낸 것)
 */
export function clocksScene(times: { h: number; m: number; swap?: boolean; hourOn?: boolean }[], label = "시계 여러 개"): ShapeScene {
  const cv = new Canvas();
  times.forEach(({ h, m, swap, hourOn }, i) => {
    const c: Pt = [CLOCK_HALF + (i % 2) * 2 * CLOCK_HALF, CLOCK_HALF + Math.floor(i / 2) * (2 * CLOCK_HALF + 26)];
    const parts = clockParts(c, CLOCK_R, h, m);
    const at = (deg: number, len: number): Pt => [Math.round(c[0] + len * Math.cos(((deg - 90) * Math.PI) / 180)), Math.round(c[1] + len * Math.sin(((deg - 90) * Math.PI) / 180))];
    const [hourHand, minuteHand] = parts.lines!;
    const hourLen = Math.hypot(hourHand.to[0] - c[0], hourHand.to[1] - c[1]);
    const minLen = Math.hypot(minuteHand.to[0] - c[0], minuteHand.to[1] - c[1]);
    if (swap) {
      parts.lines![0] = { from: c, to: at(0, hourLen), width: 5 };
      parts.lines![1] = { from: c, to: at(h * 30, minLen), width: 3 };
    }
    if (hourOn) parts.lines![0] = { from: c, to: at((h % 12) * 30, hourLen), width: 5 };
    cv.circles.push(...parts.circles!);
    cv.dots.push(...parts.dots!);
    cv.lines.push(...parts.lines!);
    cv.texts.push(...parts.texts!);
    cv.text([c[0], c[1] + CLOCK_HALF + 10], MARKS[i]);
  });
  const rows = Math.ceil(times.length / 2);
  return cv.scene(Math.min(2, times.length) * 2 * CLOCK_HALF, rows * (2 * CLOCK_HALF + 26), label);
}

/* ════════ 수 배열표 ════════ */

/** 수 배열표 일부(한 줄 10칸): from부터 rows줄, colored 칸은 색칠, blanks는 "?", hidden 칸은 수를 쓰지 않는다 */
export function chartScene(from: number, rows: number, colored: number[] = [], blanks: number[] = [], hidden: (n: number) => boolean = () => false): ShapeScene {
  const cv = new Canvas();
  const cell = 30;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < 10; c++) {
      const n = from + r * 10 + c;
      const [x, y] = [8 + c * cell, 8 + r * cell];
      cv.poly([[x, y], [x + cell, y], [x + cell, y + cell], [x, y + cell]], colored.includes(n));
      if (!hidden(n)) cv.text([x + cell / 2, y + cell / 2], blanks.includes(n) ? "?" : String(n));
    }
  return cv.scene(16 + 10 * cell, 16 + rows * cell, `수 배열표(${from}부터 ${from + rows * 10 - 1}까지)`);
}

/* ════════ 비교하기 ════════ */

/** 시소 하나(무거운 쪽이 내려간다, level이면 수평) 조각을 (x0, y0)부터 그린다 */
function drawSeesaw(cv: Canvas, x0: number, y0: number, left: string, right: string, tilt: "left" | "right" | "level", marbles?: [number, number]) {
  const yl = tilt === "left" ? 70 : tilt === "right" ? 40 : 55;
  const yr = tilt === "left" ? 40 : tilt === "right" ? 70 : 55;
  cv.poly([[x0 + 110, y0 + 56], [x0 + 96, y0 + 98], [x0 + 124, y0 + 98]]);
  cv.line([x0 + 10, y0 + yl], [x0 + 210, y0 + yr], { width: 4 });
  const put = (cx: number, y: number, name: string, n?: number) => {
    if (n === undefined) {
      // 이름은 그 자리의 판 높이에서 18px 위(판 끝 높이로 재면 기운 판이 긴 이름의 모서리에 닿는다)
      const plankY = yl + ((yr - yl) * (cx - x0 - 10)) / 200;
      if (name) cv.text([cx, Math.round(y0 + plankY - 18)], name);
      return;
    }
    // 구슬 n개(작은 원)를 두 줄로
    for (let i = 0; i < n; i++) cv.circle([cx - 24 + (i % 5) * 12, y0 + y - 9 - Math.floor(i / 5) * 12], 5);
  };
  put(x0 + 44, yl, left, marbles?.[0]);
  put(x0 + 176, yr, right, marbles?.[1]);
}

export function seesawsScene(pairs: { left: string; right: string; tilt: "left" | "right" | "level"; marbles?: [number, number] }[], label: string): ShapeScene {
  const cv = new Canvas();
  pairs.forEach((p, i) => drawSeesaw(cv, 10 + i * 240, 6, p.left, p.right, p.tilt, p.marbles));
  return cv.scene(20 + pairs.length * 240 - 10, 110, label);
}

/** 물건 하나와 구슬 n개가 수평을 이룬 저울(시소) 여러 개 */
export function balanceMarblesScene(items: { name: string; n: number }[]): ShapeScene {
  const cv = new Canvas();
  items.forEach((it, i) => {
    const x0 = 10 + i * 240;
    drawSeesaw(cv, x0, 6, it.name, "", "level");
    for (let k = 0; k < it.n; k++) cv.circle([x0 + 152 + (k % 5) * 12, 6 + 55 - 9 - Math.floor(k / 5) * 12], 5);
  });
  return cv.scene(20 + items.length * 240 - 10, 110, items.map((it) => `${josa(it.name, "과/와")} 구슬 ${it.n}개가 수평`).join(", "));
}

/** 그릇 두 개(가, 나)와 가득 채우는 데 부은 컵 수 */
export function cupsPouredScene(a: number, b: number): ShapeScene {
  const cv = new Canvas();
  const cup = (x: number, y: number) => cv.poly([[x, y], [x + 16, y], [x + 13, y + 20], [x + 3, y + 20]]);
  [a, b].forEach((n, r) => {
    const y = 12 + r * 44;
    cv.text([18, y + 10], r === 0 ? "가" : "나");
    for (let i = 0; i < n; i++) cup(40 + i * 24, y);
  });
  return cv.scene(48 + Math.max(a, b) * 24, 100, `가 그릇은 컵 ${a}개, 나 그릇은 컵 ${b}개만큼`);
}

/** 한쪽 끝을 맞추지 않은 막대(가~라): [시작 칸, 길이], 칸마다 금을 그어 셀 수 있게 한다 */
export function offsetBarsScene(bars: [number, number][]): ShapeScene {
  const cv = new Canvas();
  const unit = 22;
  bars.forEach(([start, len], k) => {
    const y = 10 + k * 34;
    cv.text([16, y + 11], ["가", "나", "다", "라"][k]);
    for (let i = 0; i < len; i++) {
      const x = 34 + (start + i) * unit;
      cv.poly([[x, y], [x + unit, y], [x + unit, y + 22], [x, y + 22]], true);
    }
  });
  const right = Math.max(...bars.map(([s, l]) => s + l));
  return cv.scene(44 + right * unit, 12 + bars.length * 34, "왼쪽 끝을 맞추지 않은 칸 막대");
}

/* ════════ 수 ════════ */

/** 10칸 틀 여러 개에 번호(보기용) */
export function framesChoiceScene(counts: number[]): ShapeScene {
  const cv = new Canvas();
  const cell = 16;
  counts.forEach((n, k) => {
    const x0 = 10 + k * 96;
    for (let i = 0; i < 10; i++) {
      const [x, y] = [x0 + (i % 5) * cell, 8 + Math.floor(i / 5) * cell];
      cv.poly([[x, y], [x + cell, y], [x + cell, y + cell], [x, y + cell]]);
      if (i < n) cv.circle([x + cell / 2, y + cell / 2], 5);
    }
    cv.text([x0 + 40, 58], MARKS[k]);
  });
  return cv.scene(10 + counts.length * 96 - 6, 70, "10칸 틀 네 개");
}

/** 1씩 줄어드는 점(마지막 칸은 비어 있음) */
export function countdownScene(from: number): ShapeScene {
  const cv = new Canvas();
  const cell = 16;
  for (let k = 0; k <= from; k++) {
    const x0 = 10 + k * 96;
    const n = from - k;
    for (let i = 0; i < 10; i++) {
      const [x, y] = [x0 + (i % 5) * cell, 8 + Math.floor(i / 5) * cell];
      cv.poly([[x, y], [x + cell, y], [x + cell, y + cell], [x, y + cell]]);
      if (i < n) cv.circle([x + cell / 2, y + cell / 2], 5);
    }
    cv.text([x0 + 40, 58], k === from ? "?" : String(n));
  }
  return cv.scene(10 + (from + 1) * 96 - 6, 70, `점이 ${from}개부터 1개씩 줄어드는 10칸 틀`);
}

/** 한 손(손가락 5개): 편 손가락은 길게, 접은 손가락은 짧게 */
export function handScene(open: number): ShapeScene {
  const cv = new Canvas();
  cv.poly([[30, 70], [110, 70], [110, 120], [30, 120]]);
  for (let i = 0; i < 5; i++) {
    const x = 32 + i * 16;
    const top = i < open ? 16 : 56;
    cv.poly([[x, top], [x + 12, top], [x + 12, 70], [x, 70]], i >= open);
  }
  return cv.scene(140, 130, `손가락 ${open}개를 편 손`);
}

/** 둘씩 짝 지은 점(위아래 두 줄) */
export function pairsScene(n: number): ShapeScene {
  const cv = new Canvas();
  const pairs = Math.ceil(n / 2);
  for (let i = 0; i < n; i++) {
    const col = Math.floor(i / 2);
    // 문제 글의 ●와 같게 채운 점으로 그린다(circle은 빈 동그라미 ○)
    drawToken(cv, "●", 20 + col * 26, i % 2 ? 50 : 22, 9);
  }
  return cv.scene(24 + pairs * 26, 70, `● ${n}개를 둘씩 짝 지은 그림`);
}

/** 동그라미 줄 여러 개(①~④): true인 칸은 색칠 */
export function shadedRowsScene(rows: boolean[][]): ShapeScene {
  const cv = new Canvas();
  rows.forEach((row, r) => {
    const cy = 20 + r * 34;
    cv.text([16, cy], MARKS[r]);
    row.forEach((f, i) => drawToken(cv, f ? "●" : "○", 46 + i * 30, cy, 11));
  });
  return cv.scene(40 + Math.max(...rows.map((r) => r.length)) * 30 + 8, 8 + rows.length * 34, "왼쪽부터 늘어놓은 동그라미 줄");
}
