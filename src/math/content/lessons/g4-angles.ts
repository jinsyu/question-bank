import type { ShapeScene } from "../types";
import { pick, randInt, shuffle } from "../../lib/random";
import { easy as easyBase, mid as midBase, word as wordBase } from "./g4";
import { add, angleAt, arcMark, dirAt, guard, len, mul, rightMark, rp, sub, type Arcs, type Lines, type Make, type Pt, type Texts } from "./g4-quad";

/**
 * 4-1 각도: 교과서처럼 그림(각도기, 시계, 각 ㉠, 삼각형·사각형, 삼각자)을 보고 푸는 문제.
 * 각도는 5의 배수(주로 10° 단위)만 쓰고, 그림은 글자가 겹치거나 그림 밖으로 나가면 다시 뽑는다(guard).
 * 삼각형·사각형 그림 함수는 4-2 삼각형·다각형 단원에서도 쓴다.
 */

const easy = (id: string, make: Make) => easyBase(id, guard(make));
const mid = (id: string, make: Make) => midBase(id, guard(make));
const word = (id: string, make: Make) => wordBase(id, guard(make));

/** lo~hi 사이 각도: 주로 10° 단위, 가끔 5° 단위 */
export function niceAngle(rand: () => number, lo: number, hi: number): number {
  if (rand() < 0.7 && Math.floor(hi / 10) >= Math.ceil(lo / 10)) return randInt(rand, Math.ceil(lo / 10), Math.floor(hi / 10)) * 10;
  return randInt(rand, Math.ceil(lo / 5), Math.floor(hi / 5)) * 5;
}

/* ════════ 도형 그림 공용 ════════ */

const rad = (d: number) => (d * Math.PI) / 180;
/** 수학 좌표(위쪽 +)의 방향 */
const up = (h: number): Pt => [Math.cos(rad(h)), Math.sin(rad(h))];

/**
 * 내각 A[0..n-1](합 (n−2)×180°)인 볼록 다각형을 수학 좌표로 만든다.
 * 앞의 n−2개 변 길이를 주면 마지막 두 변은 닫히도록 정한다. 변 길이가 너무 들쭉날쭉하면 null
 */
export function polyFromAngles(A: number[], lens: number[]): Pt[] | null {
  const n = A.length;
  const pts: Pt[] = [[0, 0]];
  let h = 0;
  for (let i = 0; i < n - 2; i++) {
    pts.push(add(pts[i], mul(up(h), lens[i])));
    h += 180 - A[i + 1];
  }
  const h2 = h + 180 - A[n - 1];
  const P = pts[n - 2];
  const u = up(h);
  const v = up(h2);
  const det = u[0] * v[1] - u[1] * v[0];
  if (Math.abs(det) < 1e-9) return null;
  const s = (-P[0] * v[1] + P[1] * v[0]) / det;
  const t = (-u[0] * P[1] + u[1] * P[0]) / det;
  const all = [...lens.slice(0, n - 2), s, t];
  if (s <= 0 || t <= 0 || Math.min(...all) < 0.35 * Math.max(...all)) return null;
  pts.push(add(P, mul(u, s)));
  return pts;
}

/** 수학 좌표 점들을 W×H 그림 안(여백 pad)에 맞춰 화면 좌표로 */
export function fit(ps: Pt[], W: number, H: number, pad = 36): Pt[] {
  const xs = ps.map((p) => p[0]);
  const ys = ps.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const k = Math.min((W - 2 * pad) / (x1 - x0 || 1), (H - 2 * pad) / (y1 - y0 || 1));
  const ox = (W - k * (x1 - x0)) / 2;
  const oy = (H - k * (y1 - y0)) / 2;
  return ps.map(([x, y]) => rp([ox + (x - x0) * k, H - oy - (y - y0) * k]));
}

/** 꼭짓점 표시: 각 글자("70°", "㉠"), 직각 표시("R"), 없음(null) */
export type Mark = string | null;

/** 다각형(화면 좌표)의 꼭짓점마다 각 표시(호와 글자) 또는 직각 표시 */
export function cornerMarks(pts: Pt[], marks: Mark[], r = 20): { arcs: Arcs; lines: Lines; texts: Texts } {
  const out = { arcs: [] as Arcs, lines: [] as Lines, texts: [] as Texts };
  pts.forEach((v, i) => {
    const m = marks[i];
    if (!m) return;
    const a = pts[(i + pts.length - 1) % pts.length];
    const b = pts[(i + 1) % pts.length];
    if (m === "R") {
      out.lines.push(...rightMark(v, a, b, 11));
      return;
    }
    const am = angleAt(v, a, b, r, m, 12);
    out.arcs.push(...am.arcs);
    out.texts.push(...am.texts);
  });
  return out;
}

/** 내각이 A인 다각형 그림(각 표시 marks) — 모양이 안 나오면 null */
export function anglePolygon(rand: () => number, A: number[], marks: Mark[], label: string, W = 300, H = 210): { scene: ShapeScene; pts: Pt[] } | null {
  const lens = A.slice(0, A.length - 2).map(() => randInt(rand, 6, 11));
  const raw = polyFromAngles(A, lens);
  if (!raw) return null;
  // 무작위로 돌려 밑변이 늘 가로가 되지 않게(조금만)
  const turn = rad(pick(rand, [0, 0, 10, -10, 20, -20]));
  const rot = raw.map(([x, y]): Pt => [x * Math.cos(turn) - y * Math.sin(turn), x * Math.sin(turn) + y * Math.cos(turn)]);
  const pts = fit(rot, W, H, 40);
  const m = cornerMarks(pts, marks);
  return { pts, scene: { kind: "shape", width: W, height: H, label, polygons: [{ points: pts }], lines: m.lines, arcs: m.arcs, texts: m.texts } };
}

/** 한 점 O에서 방향 rays(°)로 그은 반직선과 각 표시 [시작°, 끝°, 반지름, 글자] */
export function fanScene(label: string, rays: number[], marks: [number, number, number, string][], R = 110, pad = 30): ShapeScene {
  const ends = rays.map((a) => rp(mul(dirAt(a), R)));
  const all: Pt[] = [[0, 0], ...ends];
  const minX = Math.min(...all.map((p) => p[0])) - pad;
  const maxX = Math.max(...all.map((p) => p[0])) + pad;
  const minY = Math.min(...all.map((p) => p[1])) - pad;
  const maxY = Math.max(...all.map((p) => p[1])) + pad;
  const shift = (p: Pt): Pt => rp([p[0] - minX, p[1] - minY]);
  const o = shift([0, 0]);
  const lines: Lines = ends.map((e) => ({ from: o, to: shift(e) }));
  // 호를 먼저 모두 정하고, 글자는 모든 반직선·다른 호·앞서 놓은 글자를 피해 자리를 잡는다
  const allArcs = marks.flatMap(([f, t, r]) => arcMark(o, f, t, r).arcs);
  const ms: { arcs: Arcs; texts: Texts }[] = [];
  for (const [i, [f, t, r, l]] of marks.entries()) ms.push(arcMark(o, f, t, r, l, 12, { lines, arcs: allArcs.filter((_, k) => k !== i), dots: [o], texts: ms.flatMap((m) => m.texts) }));
  return {
    kind: "shape",
    width: Math.ceil(maxX - minX),
    height: Math.ceil(maxY - minY),
    label,
    lines,
    dots: [o],
    arcs: ms.flatMap((m) => m.arcs),
    texts: ms.flatMap((m) => m.texts),
  };
}

/* ════════ 각의 크기 비교하고 재기 ════════ */

const polar = (c: Pt, r: number, d: number): Pt => rp(add(c, mul(dirAt(d), r)));

/**
 * 두 줄 눈금 각도기: 안쪽 눈금은 오른쪽이 0, 바깥쪽 눈금은 왼쪽이 0(20°마다 숫자, 10°·5°마다 눈금).
 * 기준 변은 오른쪽(0°) 또는 왼쪽(180°), 다른 변은 화면 방향 th°.
 */
function protractorScene(th: number, baseLeft: boolean): ShapeScene {
  const c: Pt = [180, 170];
  const R = 160;
  const ticks: Lines = [];
  for (let d = 0; d <= 180; d += 5) ticks.push({ from: polar(c, d % 10 ? R - 6 : d % 20 ? R - 10 : R - 14, d), to: polar(c, R, d), width: 1 });
  const texts: Texts = [];
  for (let d = 0; d <= 180; d += 20) {
    // 0°·180° 자리 숫자는 밑금(변) 위로 조금 올린다(10°·170° 변이 숫자에 닿지 않게 8px만)
    const lift = d === 0 || d === 180 ? -8 : 0;
    const o = polar(c, 136, d);
    const i = polar(c, 102, d);
    texts.push({ at: [o[0], o[1] + lift], text: String(180 - d) }, { at: [i[0], i[1] + lift], text: String(d) });
  }
  return {
    kind: "shape",
    width: 360,
    height: 184,
    label: "각도기 위에 놓인 각",
    arcs: [{ c, r: R, from: 0, to: 180, width: 1.5 }, { c, r: 88, from: 0, to: 180, width: 1 }],
    lines: [
      { from: [c[0] - R, c[1]], to: [c[0] + R, c[1]], width: 1 },
      ...ticks,
      { from: c, to: polar(c, 172, baseLeft ? 180 : 0), width: 3 },
      { from: c, to: polar(c, 168, th), width: 3 },
    ],
    dots: [c],
    texts,
  };
}

export const l4AngleRead = easy("l4-angle-read", (rand) => {
  // 변이 숫자 위를 지나지 않도록 숫자(20°마다) 사이인 10°, 30°, … 170°에 놓는다
  const th = randInt(rand, 0, 8) * 20 + 10;
  const baseLeft = rand() < 0.5;
  const answer = baseLeft ? 180 - th : th;
  return {
    key: `${th}:${baseLeft}`,
    prompt: "각도기로 잰 각의 크기는 몇 도인가요?",
    visual: protractorScene(th, baseLeft),
    answer,
    unit: "°",
    hint: `각의 한 변이 각도기의 ${baseLeft ? "왼쪽" : "오른쪽"} 0에 맞춰져 있어요. 그 0에서 시작하는 ${baseLeft ? "바깥쪽" : "안쪽"} 눈금을 읽어요.`,
    explanation: `${baseLeft ? "왼쪽" : "오른쪽"} 0에서 시작하는 ${baseLeft ? "바깥쪽" : "안쪽"} 눈금을 읽으면 ${answer}°예요.`,
    mistakes: { [180 - answer]: `반대쪽 눈금을 읽었어요. 한 변이 놓인 쪽의 0에서 시작하는 눈금을 읽어요.` },
  };
});

/** 바늘 시계(숫자는 바늘 끝보다 바깥에): 가운데 c */
function clockParts(c: Pt, h: number, m: number, R = 70) {
  const at = (d: number, r: number): Pt => rp(add(c, mul(dirAt(90 - d), r)));
  const hourDeg = ((h % 12) + m / 60) * 30;
  return {
    circles: [{ c, r: R }],
    dots: [c] as Pt[],
    lines: [
      { from: c, to: at(hourDeg, R * 0.4), width: 5 },
      { from: c, to: at(m * 6, R * 0.62), width: 3 },
      ...Array.from({ length: 60 }, (_, i) => ({ from: at(i * 6, i % 5 ? R - 4 : R - 8), to: at(i * 6, R), width: 1 })),
    ] as Lines,
    texts: Array.from({ length: 12 }, (_, i) => ({ at: at((i + 1) * 30, R - 15), text: String(i + 1) })) as Texts,
  };
}

function clockScene(h: number): ShapeScene {
  return { kind: "shape", width: 170, height: 170, label: "바늘 시계", ...clockParts([85, 85], h, 0, 76) };
}

const clockAngle = (h: number) => Math.min(30 * h, 360 - 30 * h);

export const l4ClockAngle = mid("l4-clock-angle", (rand) => {
  // 6시(180°)는 두 바늘이 일직선이라 "작은 쪽의 각"이 없으므로 뺀다
  const h = pick(rand, [1, 2, 3, 4, 5, 7, 8, 9, 10, 11]);
  return {
    key: `${h}`,
    prompt: "시계의 긴바늘과 짧은바늘이 이루는 작은 쪽의 각은 몇 도인가요?",
    visual: clockScene(h),
    answer: clockAngle(h),
    unit: "°",
    hint: "시계의 숫자 한 칸 사이의 각은 360° ÷ 12 = 30°예요. 두 바늘 사이가 몇 칸인지 세어요.",
    explanation: `${h}시: 두 바늘 사이는 ${Math.min(h, 12 - h)}칸 → 30° × ${Math.min(h, 12 - h)} = ${clockAngle(h)}°`,
    mistakes: { [360 - clockAngle(h)]: "큰 쪽의 각을 구했어요. 작은 쪽의 각을 구해요." },
  };
});

export const l4ClockTwoTimes = word("l4-clock-two-times", (rand) => {
  const h1 = randInt(rand, 1, 10);
  // 1~3시간 뒤: 차가 30°·60°만이 아니라 90°도 나오게
  const h2 = h1 + randInt(rand, 1, 3);
  if (h2 > 11 || h1 === 6 || h2 === 6) return null;
  const d1 = clockAngle(h1);
  const d2 = clockAngle(h2);
  if (d1 === d2) return null;
  const what = pick(rand, ["숙제를", "책 읽기를", "피아노 연습을"]);
  const L = clockParts([85, 110], h1, 0, 70);
  const Rr = clockParts([265, 110], h2, 0, 70);
  return {
    key: `${h1}:${h2}`,
    prompt: `시계는 ${what} 시작한 시각과 끝낸 시각을 나타냅니다. 두 시각에 긴바늘과 짧은바늘이 이루는 작은 쪽의 각의 크기의 차는 몇 도인가요?`,
    visual: {
      kind: "shape",
      width: 350,
      height: 190,
      label: "시작한 시각과 끝낸 시각의 시계",
      circles: [...L.circles, ...Rr.circles],
      dots: [...L.dots, ...Rr.dots],
      lines: [...L.lines, ...Rr.lines],
      texts: [...L.texts, ...Rr.texts, { at: [85, 18], text: "시작한 시각" }, { at: [265, 18], text: "끝낸 시각" }],
    },
    answer: Math.abs(d1 - d2),
    unit: "°",
    hint: "시계마다 두 바늘 사이의 숫자 칸 수를 세고, 한 칸을 30°로 계산해요.",
    explanation: `${h1}시: ${d1}°, ${h2}시: ${d2}° → ${Math.max(d1, d2)}° − ${Math.min(d1, d2)}° = ${Math.abs(d1 - d2)}°`,
  };
});

export const l4AnglePieces = word("l4-angle-pieces", (rand) => {
  const total = pick(rand, [180, 360]);
  const n = pick(rand, total === 180 ? [3, 4, 6, 9] : [6, 8, 9, 12]);
  const each = total / n;
  const k = randInt(rand, 2, total === 180 ? Math.min(3, n - 1) : 3);
  const start = randInt(rand, 0, n - k);
  const rays = Array.from({ length: total === 180 ? n + 1 : n }, (_, i) => i * each);
  const answer = each * k;
  return {
    key: `${total}:${n}:${k}:${start}`,
    prompt: `${total === 180 ? "직선을" : "한 바퀴를"} 크기가 같은 각 ${n}개로 나누었습니다. 각 ㉠의 크기는 몇 도인가요?`,
    visual: fanScene(total === 180 ? "직선을 크기가 같은 각으로 나눈 그림" : "한 바퀴를 크기가 같은 각으로 나눈 그림", rays, [[start * each, (start + k) * each, 34, "㉠"]], 100),
    answer,
    unit: "°",
    hint: `${total === 180 ? "직선이 이루는 각은 180°" : "한 바퀴는 360°"}예요. 작은 각 하나의 크기를 먼저 구하고, ㉠이 작은 각 몇 개인지 세어요.`,
    explanation: `작은 각 하나: ${total}° ÷ ${n} = ${each}°, ㉠은 작은 각 ${k}개 → ${each}° × ${k} = ${answer}°`,
    mistakes: { [each]: "작은 각 하나의 크기만 구했어요. ㉠은 작은 각 여러 개로 이루어져 있어요." },
  };
});

/* ════════ 예각과 둔각 ════════ */

export const l4AcuteCount = easy("l4-acute-count", (rand) => {
  const kind = pick(rand, ["예각", "둔각"] as const);
  const kinds = shuffle(rand, ["예각", "예각", "둔각", "둔각", pick(rand, ["예각", "둔각", "직각"]), pick(rand, ["예각", "둔각", "직각"])]);
  const degs = kinds.map((k) => (k === "직각" ? 90 : k === "예각" ? randInt(rand, 2, 7) * 10 : randInt(rand, 11, 16) * 10));
  const cw = 116;
  const ch = 92;
  const lines: Lines = [];
  const texts: Texts = [];
  degs.forEach((d, i) => {
    const cx = (i % 3) * cw;
    const cy = Math.floor(i / 3) * ch;
    const left = rand() < 0.5;
    const v: Pt = [cx + 58, cy + 74];
    const a = left ? 180 : 0;
    const b = left ? 180 - d : d;
    const A = rp(add(v, mul(dirAt(a), 52)));
    const B = rp(add(v, mul(dirAt(b), 52)));
    lines.push({ from: v, to: A }, { from: v, to: B });
    if (d === 90) lines.push(...rightMark(v, A, B, 10));
    texts.push({ at: [cx + (left ? 14 : 102), cy + 14], text: "①②③④⑤⑥"[i] });
  });
  const count = kinds.filter((k) => k === kind).length;
  return {
    key: `${kind}:${degs.join()}`,
    prompt: `그림에서 ${kind}은 모두 몇 개인가요?`,
    visual: { kind: "shape", width: 3 * cw, height: 2 * ch, label: "여러 가지 각 ①~⑥", lines, texts },
    answer: count,
    unit: "개",
    hint: "직각(90°)과 비교해요. 직각보다 작으면 예각, 직각보다 크면 둔각이에요. 직각은 예각도 둔각도 아니에요.",
    explanation: `${kind}: ${degs.map((d, i) => (kinds[i] === kind ? "①②③④⑤⑥"[i] : "")).filter(Boolean).join(", ")} → ${count}개`,
    mistakes: kinds.includes("직각") ? { [count + kinds.filter((k) => k === "직각").length]: "직각까지 셌어요. 직각은 예각도 둔각도 아니에요." } : {},
  };
});

/** 무작위 볼록 다각형(원 위의 점) — 모든 각이 직각과 15° 이상 차이 나야 눈으로 가를 수 있다 */
function clearPolygon(rand: () => number, n: number): { pts: Pt[]; angles: number[] } | null {
  const ts = Array.from({ length: n }, () => rand() * 360).sort((a, b) => a - b);
  for (let i = 0; i < n; i++) if ((ts[(i + 1) % n] - ts[i] + 360) % 360 < 360 / n / 2.2) return null;
  const raw = ts.map((t) => mul(up(t), randInt(rand, 8, 10)));
  const angles = raw.map((v, i) => {
    const a = sub(raw[(i + n - 1) % n], v);
    const b = sub(raw[(i + 1) % n], v);
    return (Math.acos((a[0] * b[0] + a[1] * b[1]) / (len(a) * len(b))) * 180) / Math.PI;
  });
  if (angles.some((a) => Math.abs(a - 90) < 15 || a < 30)) return null;
  return { pts: fit(raw, 260, 200, 34), angles };
}

export const l4AnglePickKind = mid("l4-angle-pick-kind", (rand) => {
  const n = pick(rand, [4, 5]);
  const poly = clearPolygon(rand, n);
  if (!poly) return null;
  const kind = pick(rand, ["예각", "둔각"] as const);
  const count = poly.angles.filter((a) => (kind === "예각" ? a < 90 : a > 90)).length;
  if (count === 0 && rand() < 0.7) return null;
  const nm = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ"].slice(0, n);
  const c = mul(poly.pts.reduce(add, [0, 0] as Pt), 1 / n);
  const texts: Texts = poly.pts.map((p, i) => ({ at: rp(add(p, mul(sub(p, c), 15 / len(sub(p, c))))), text: nm[i] }));
  const which = nm.filter((_, i) => (kind === "예각" ? poly.angles[i] < 90 : poly.angles[i] > 90));
  return {
    key: `${kind}:${poly.pts.join("|")}`,
    prompt: `${n === 4 ? "사각형" : "오각형"}의 안쪽 각 중에서 ${kind}은 모두 몇 개인가요?`,
    visual: { kind: "shape", width: 260, height: 200, label: `${n === 4 ? "사각형" : "오각형"} ${nm.join("")}`, polygons: [{ points: poly.pts }], texts },
    answer: count,
    unit: "개",
    hint: "꼭짓점마다 안쪽 각을 직각(삼각자의 직각 부분)과 비교해 보세요.",
    explanation: `${kind}인 각: ${which.length ? which.map((x) => `각 ${x}`).join(", ") : "없음"} → ${count}개`,
  };
});

export const l4AngleRayCount = word("l4-angle-ray-count", (rand) => {
  // 직선 위의 점 O에서 반직선 2~3개: 작은 각은 모두 20° 이상, 10° 단위
  const k = randInt(rand, 2, 3);
  const cuts = new Set<number>();
  while (cuts.size < k) cuts.add(randInt(rand, 2, 16) * 10);
  const dirs = [0, ...[...cuts].sort((a, b) => a - b), 180];
  const parts = dirs.slice(1).map((d, i) => d - dirs[i]);
  if (parts.some((p) => p < 20) || parts.some((p) => p === 90)) return null;
  const kind = pick(rand, ["예각", "둔각"] as const);
  let count = 0;
  const list: string[] = [];
  for (let i = 0; i < dirs.length; i++)
    for (let j = i + 1; j < dirs.length; j++) {
      const a = dirs[j] - dirs[i];
      if (kind === "예각" ? a < 90 : a > 90 && a < 180) {
        count++;
        list.push(`${a}°`);
      }
    }
  if (count < 2) return null;
  const marks = parts.map((p, i): [number, number, number, string] => [dirs[i], dirs[i + 1], 24, `${p}°`]);
  return {
    key: `${kind}:${dirs.join()}`,
    prompt: `직선 위의 한 점에서 반직선 ${k}개를 그었습니다. 그림에서 찾을 수 있는 크고 작은 ${kind}은 모두 몇 개인가요?`,
    visual: fanScene("직선 위의 한 점에서 그은 반직선과 작은 각의 크기", dirs, marks, 120),
    answer: count,
    unit: "개",
    hint: "작은 각 하나로 된 각, 두 개로 된 각, 세 개로 된 각을 차례로 세어요. 직선이 이루는 180°는 둔각이 아니에요.",
    explanation: `${kind}: ${list.join(", ")} → ${count}개`,
  };
});

/* ════════ 각도의 합과 차 ════════ */

export const angleSumDiff = easy("angle-sum-diff", (rand) => {
  const add2 = rand() < 0.5;
  const a = niceAngle(rand, 30, 110);
  const b = niceAngle(rand, 30, 150 - a);
  if (b < 30) return null;
  const base = pick(rand, [0, 0, 10, 20]);
  const marks: [number, number, number, string][] = add2
    ? [[base, base + a, 24, `${a}°`], [base + a, base + a + b, 24, `${b}°`], [base, base + a + b, 58, "㉠"]]
    : [[base, base + a + b, 58, `${a + b}°`], [base, base + a, 24, `${a}°`], [base + a, base + a + b, 24, "㉠"]];
  return {
    key: `${add2}:${a}:${b}:${base}`,
    prompt: "그림에서 각 ㉠의 크기는 몇 도인가요?",
    visual: fanScene("한 점에서 그은 반직선 세 개와 각 표시", [base, base + a, base + a + b], marks, 120),
    answer: add2 ? a + b : b,
    unit: "°",
    hint: add2 ? "㉠은 두 각을 합친 각이에요. 두 각도를 더해요." : "㉠은 큰 각에서 작은 각을 뺀 나머지예요.",
    explanation: add2 ? `${a}° + ${b}° = ${a + b}°` : `${a + b}° − ${a}° = ${b}°`,
    mistakes: add2 ? { [Math.abs(a - b)]: "두 각도를 뺐어요. ㉠은 두 각을 합친 각이에요." } : { [a + a + b]: "두 각도를 더했어요. ㉠은 큰 각에서 작은 각을 뺀 나머지예요." },
  };
});

export const m4AngleMissing = mid("m4-angle-missing", (rand) => {
  // 큰 각이 작은 각 세 개로 나뉘고, 큰 각과 두 작은 각을 알 때 가운데 ㉠
  const a = niceAngle(rand, 25, 60);
  const x = niceAngle(rand, 25, 60);
  const b = niceAngle(rand, 25, 60);
  const whole = a + x + b;
  if (whole > 170 || whole === 180) return null;
  return {
    key: `${a}:${x}:${b}`,
    prompt: "그림에서 각 ㉠의 크기는 몇 도인가요?",
    visual: fanScene("큰 각을 세 개로 나눈 그림", [0, a, a + x, whole], [[0, whole, 72, `${whole}°`], [0, a, 26, `${a}°`], [a, a + x, 26, "㉠"], [a + x, whole, 26, `${b}°`]], 125),
    answer: x,
    unit: "°",
    hint: "큰 각에서 나머지 두 각을 빼요.",
    explanation: `${whole}° − ${a}° − ${b}° = ${x}°`,
    mistakes: { [whole - a]: "한 각만 뺐어요." },
  };
});

export const w4StraightAngle = word("w4-straight-angle", (rand) => {
  // 직선 위 세 각: 한 각은 주어지고, ㉡은 ㉠보다 d° 크다
  const a = niceAngle(rand, 30, 80);
  const d = randInt(rand, 1, 4) * 10;
  const rest = 180 - a - d;
  if (rest % 2) return null;
  const x = rest / 2;
  const y = x + d;
  if (x < 25) return null;
  const order = shuffle(rand, ["a", "x", "y"] as const);
  const size = { a, x, y };
  const label = { a: `${a}°`, x: "㉠", y: "㉡" };
  const dirs = [0];
  for (const o of order) dirs.push(dirs[dirs.length - 1] + size[o]);
  return {
    key: `${a}:${d}:${order.join()}`,
    prompt: `직선 위의 한 점에서 반직선 2개를 그었습니다. 각 ㉡은 각 ㉠보다 ${d}° 더 큽니다. 각 ㉡의 크기는 몇 도인가요?`,
    visual: fanScene("직선 위의 한 점에서 그은 반직선 2개", dirs, order.map((o, i): [number, number, number, string] => [dirs[i], dirs[i + 1], 26, label[o]]), 120),
    answer: y,
    unit: "°",
    hint: `직선이 이루는 각은 180°예요. ㉠ + ㉡ = 180° − ${a}°이고, ㉡에서 ${d}°를 빼면 ㉠과 같아져요.`,
    explanation: `㉠ + ㉡ = 180° − ${a}° = ${180 - a}°, ${180 - a}° − ${d}° = ${2 * x}°, ㉠ = ${2 * x}° ÷ 2 = ${x}°, ㉡ = ${x}° + ${d}° = ${y}°`,
    mistakes: { [x]: "㉠의 크기를 답했어요.", [180 - a]: "㉠과 ㉡을 합친 각을 답했어요." },
  };
});

/* ════════ 삼각형의 세 각의 크기의 합 ════════ */

/** 세 각이 모두 25° 이상인 삼각형의 각 [위, 왼쪽 아래, 오른쪽 아래] */
export function triAngles(rand: () => number, maxBig = 130): [number, number, number] | null {
  const b = niceAngle(rand, 30, 80);
  const c = niceAngle(rand, 30, 80);
  const a = 180 - b - c;
  if (a < 25 || a > maxBig) return null;
  return [a, b, c];
}

/** 세 각이 A(위), B(왼쪽 아래), C(오른쪽 아래)인 삼각형(수학 좌표, 밑변 BC = 10) */
export function triPoints(A: number, B: number): Pt[] {
  const c = (10 * Math.sin(rad(180 - A - B))) / Math.sin(rad(A));
  return [mul(up(B), c), [0, 0], [10, 0]];
}

export const angleTriangle = easy("angle-triangle", (rand) => {
  const t = triAngles(rand);
  if (!t) return null;
  const ask = randInt(rand, 0, 2);
  const marks = t.map((v, i) => (i === ask ? "㉠" : `${v}°`));
  const pts = fit(triPoints(t[0], t[1]), 300, 200, 38);
  const m = cornerMarks(pts, marks);
  const [x, y] = t.filter((_, i) => i !== ask);
  return {
    key: `${t.join()}:${ask}`,
    prompt: "삼각형에서 각 ㉠의 크기는 몇 도인가요?",
    visual: { kind: "shape", width: 300, height: 200, label: "두 각의 크기가 적힌 삼각형", polygons: [{ points: pts }], arcs: m.arcs, texts: m.texts },
    answer: t[ask],
    unit: "°",
    hint: "삼각형의 세 각의 크기의 합은 180°예요.",
    explanation: `180° − ${x}° − ${y}° = ${t[ask]}°`,
    mistakes: { [360 - x - y]: "사각형처럼 360°에서 뺐어요." },
  };
});

export const l4TriExterior = mid("l4-tri-exterior", (rand) => {
  const t = triAngles(rand, 110);
  if (!t) return null;
  const [A, B, C] = t;
  if (180 - C < 40) return null;
  const raw = triPoints(A, B);
  const ext: Pt = [15, 0];
  const pts = fit([...raw, ext], 320, 190, 34);
  const tri = pts.slice(0, 3);
  const m = cornerMarks(tri, [`${A}°`, `${B}°`, null]);
  const E = angleAt(tri[2], tri[0], pts[3], 20, "㉠", 12);
  return {
    key: `${A}:${B}`,
    prompt: "삼각형의 한 변을 늘였습니다. 각 ㉠의 크기는 몇 도인가요?",
    visual: {
      kind: "shape",
      width: 320,
      height: 190,
      label: "한 변을 늘인 삼각형",
      polygons: [{ points: tri }],
      lines: [{ from: tri[2], to: pts[3] }],
      arcs: [...m.arcs, ...E.arcs],
      texts: [...m.texts, ...E.texts],
    },
    answer: A + B,
    unit: "°",
    hint: "먼저 삼각형의 나머지 한 각을 구하고, 직선이 이루는 각 180°에서 빼요.",
    explanation: `나머지 한 각: 180° − ${A}° − ${B}° = ${C}°, ㉠ = 180° − ${C}° = ${A + B}°`,
    mistakes: { [C]: "삼각형 안쪽의 각을 답했어요." },
  };
});

/** 꼭짓점 O에서 방향 dir(°) 쪽 변 길이 L, O의 각 a°(시계 반대 방향), 다른 끝의 각 b°인 삼각자(화면 좌표) */
function setSquare(O: Pt, dir: number, a: number, b: number, L: number): Pt[] {
  const P = add(O, mul(dirAt(dir), L));
  const q = (L * Math.sin(rad(b))) / Math.sin(rad(180 - a - b));
  return [O, rp(P), rp(add(O, mul(dirAt(dir + a), q)))];
}

export const l4SetSquares = word("l4-set-squares", (rand) => {
  // 30°·60°·90° 삼각자와 45°·45°·90° 삼각자를 한 꼭짓점 O에 맞대어 이어 붙이거나 겹친다
  const a = pick(rand, [30, 60, 90]);
  const b = pick(rand, [45, 90]);
  const join = rand() < 0.5;
  if (a === b || (join && a + b > 150)) return null;
  const answer = join ? a + b : Math.abs(a - b);
  // O가 아닌 밑변 쪽 꼭짓점의 각: 직각이 O에 없으면 그 꼭짓점이 직각
  const firstOther = a === 90 ? 30 : 90;
  const secondOther = b === 90 ? 45 : 90;
  const O: Pt = [0, 0];
  const s1 = setSquare(O, 0, a, firstOther, a === 60 ? 95 : 150);
  const s2 = join ? setSquare(O, a, b, secondOther, 120) : setSquare(O, 0, b, secondOther, b === 90 ? 110 : 120);
  const pts = [...s1, ...s2];
  const minX = Math.min(...pts.map((p) => p[0])) - 30;
  const minY = Math.min(...pts.map((p) => p[1])) - 30;
  const maxX = Math.max(...pts.map((p) => p[0])) + 30;
  const maxY = Math.max(...pts.map((p) => p[1])) + 30;
  const sh = (p: Pt): Pt => rp([p[0] - minX, p[1] - minY]);
  const t1 = s1.map(sh);
  const t2 = s2.map(sh);
  const o = t1[0];
  const right = (t: Pt[], ang: number[]) => {
    const i = ang.indexOf(90);
    return rightMark(t[i], t[(i + 2) % 3], t[(i + 1) % 3], 10);
  };
  const mark = join ? arcMark(o, 0, a + b, 30, "㉠") : arcMark(o, Math.min(a, b), Math.max(a, b), 30, "㉠");
  return {
    key: `${a}:${b}:${join}`,
    prompt: `두 삼각자를 그림과 같이 ${join ? "이어 붙였습니다" : "겹쳐 놓았습니다"}. 한 삼각자의 세 각은 30°, 60°, 90°이고, 다른 삼각자의 세 각은 45°, 45°, 90°입니다. 각 ㉠의 크기는 몇 도인가요?`,
    visual: {
      kind: "shape",
      width: Math.ceil(maxX - minX),
      height: Math.ceil(maxY - minY),
      label: `두 삼각자를 ${join ? "이어 붙인" : "겹친"} 그림`,
      polygons: [{ points: t1 }, { points: t2 }],
      lines: [...right(t1, [a, firstOther, 180 - a - firstOther]), ...right(t2, [b, secondOther, 180 - b - secondOther])],
      arcs: mark.arcs,
      texts: mark.texts,
    },
    answer,
    unit: "°",
    hint: join ? "두 삼각자의 각을 이어 붙였으므로 두 각의 크기를 더해요." : "큰 각에서 겹친 작은 각을 빼요.",
    explanation: `${join ? `${a}° + ${b}°` : `${Math.max(a, b)}° − ${Math.min(a, b)}°`} = ${answer}°`,
  };
});

/* ════════ 사각형의 네 각의 크기의 합 ════════ */

export const l4QuadEasy = easy("l4-quad-easy", (rand) => {
  // 직각이 두 개인 사각형(이웃한 두 직각) — 나머지 두 각의 합은 180°
  const a = niceAngle(rand, 50, 130);
  if (Math.abs(a - 90) < 15) return null;
  const askTop = rand() < 0.5;
  const marks: Mark[] = ["R", "R", askTop ? `${a}°` : "㉠", askTop ? "㉠" : `${180 - a}°`];
  const fig = anglePolygon(rand, [90, 90, a, 180 - a], marks, "직각이 두 개인 사각형");
  if (!fig) return null;
  const given = askTop ? a : 180 - a;
  return {
    key: `${a}:${askTop}`,
    prompt: "사각형에서 각 ㉠의 크기는 몇 도인가요?",
    visual: fig.scene,
    answer: 180 - given,
    unit: "°",
    hint: "사각형의 네 각의 크기의 합은 360°, 직각은 90°예요.",
    explanation: `360° − 90° − 90° − ${given}° = ${180 - given}°`,
    mistakes: { [270 - given]: "직각 하나만 뺐어요." },
  };
});

/** 네 각이 모두 55°~140°인 사각형의 각(합 360°) */
function quadAngles(rand: () => number): number[] | null {
  const A = [niceAngle(rand, 55, 135), niceAngle(rand, 55, 135), niceAngle(rand, 55, 135)];
  const d = 360 - A[0] - A[1] - A[2];
  if (d < 55 || d > 140) return null;
  return [...A, d];
}

export const angleQuad = mid("angle-quad", (rand) => {
  const A = quadAngles(rand);
  if (!A) return null;
  const ask = randInt(rand, 0, 3);
  const fig = anglePolygon(rand, A, A.map((v, i) => (i === ask ? "㉠" : `${v}°`)), "세 각의 크기가 적힌 사각형");
  if (!fig) return null;
  const known = A.filter((_, i) => i !== ask);
  return {
    key: `${A.join()}:${ask}`,
    prompt: "사각형에서 각 ㉠의 크기는 몇 도인가요?",
    visual: fig.scene,
    answer: A[ask],
    unit: "°",
    hint: "사각형의 네 각의 크기의 합은 360°예요.",
    explanation: `360° − ${known.join("° − ")}° = ${A[ask]}°`,
    mistakes: { [180 - known[0] - known[1] - known[2]]: "삼각형처럼 180°에서 뺐어요." },
  };
});

const POLY_KO: Record<number, string> = { 5: "오각형", 6: "육각형" };

export const l4PolyAngleSum = mid("l4-poly-angle-sum", (rand) => {
  const n = pick(rand, [5, 6]);
  const A = n === 5 ? [niceAngle(rand, 95, 125), niceAngle(rand, 95, 125), niceAngle(rand, 95, 125), niceAngle(rand, 95, 125)] : [0, 1, 2, 3, 4].map(() => niceAngle(rand, 105, 135));
  const last = 180 * (n - 2) - A.reduce((s, x) => s + x, 0);
  if (last < 90 || last > 150) return null;
  const fig = anglePolygon(rand, [...A, last], Array(n).fill(null), `선분을 그어 삼각형으로 나눈 ${POLY_KO[n]}`, 260, 210);
  if (!fig) return null;
  const v = randInt(rand, 0, n - 1);
  const lines: Lines = [];
  for (let k = 2; k < n - 1; k++) lines.push({ from: fig.pts[v], to: fig.pts[(v + k) % n], dashed: true });
  return {
    key: `${n}:${A.join()}:${v}`,
    prompt: `그림과 같이 ${POLY_KO[n]}의 한 꼭짓점에서 선분을 그어 삼각형 여러 개로 나누었습니다. ${POLY_KO[n]}의 모든 각의 크기의 합은 몇 도인가요?`,
    visual: { ...fig.scene, lines },
    answer: 180 * (n - 2),
    unit: "°",
    hint: "나누어진 삼각형이 몇 개인지 세어 보세요. 삼각형 한 개의 세 각의 합은 180°예요.",
    explanation: `삼각형 ${n - 2}개 → 180° × ${n - 2} = ${180 * (n - 2)}°`,
    mistakes: { [180 * n]: "삼각형 수를 잘못 셌어요.", [180 * (n - 1)]: "삼각형 수를 잘못 셌어요." },
  };
});
