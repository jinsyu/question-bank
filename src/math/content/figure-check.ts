import type { ShapeScene, Visual } from "./types";

/**
 * 도형 그림 검사(전 학년 공용): 글자끼리·글자와 점이 겹치는지, 선·원 테두리·호가 글자 위를 지나는지, 좌표가 그림 밖인지.
 * 생성기에서 그림을 만든 뒤 겹치면 다시 뽑고(null), 테스트에서 모든 그림에 돌린다.
 */

type Pt = [number, number];

/** 선분 ab를 [0,w]×[0,h] 안으로 자른다(없으면 null) */
function clip(a: Pt, b: Pt, w: number, h: number): [Pt, Pt] | null {
  let t0 = 0;
  let t1 = 1;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const p = [-dx, dx, -dy, dy];
  const q = [a[0], w - a[0], a[1], h - a[1]];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return null;
    } else {
      const r = q[i] / p[i];
      if (p[i] < 0) t0 = Math.max(t0, r);
      else t1 = Math.min(t1, r);
    }
  }
  if (t0 >= t1) return null;
  return [
    [a[0] + dx * t0, a[1] + dy * t0],
    [a[0] + dx * t1, a[1] + dy * t1],
  ];
}

/** 그림 글자 상자(글꼴 14 기준 어림: 한글·기호 14, 숫자·영문 8) */
export function textBox(t: { at: [number, number]; text: string }): [number, number, number, number] {
  const w = [...t.text].reduce((s, ch) => s + (/[ -~°]/.test(ch) ? 8 : 14), 0);
  return [t.at[0] - w / 2, t.at[1] - 7, t.at[0] + w / 2, t.at[1] + 7];
}
/**
 * 선·원·호가 글자를 지나는지 볼 때의 여유(px). 글자 상자(textBox)를 이만큼 줄인 "잉크 상자"에
 * 선의 굵기 절반만큼 닿으면 겹친 것으로 본다.
 * - 글꼴 14에서 숫자·영문 획은 상자 가장자리에서 1px쯤 안쪽, 한글은 상자에 거의 꽉 찬다.
 *   1px만 줄이면 굵기 2 선이 글자 획을 스치기만 해도 걸리고(멀쩡한 그림도 걸린다),
 *   예전처럼 2px 줄이고 굵기를 빼면 좁은 칸에서 선이 숫자 가장자리를 3px 파고들어도 놓친다.
 * - 그래서 1.5px: 굵기 2 선은 가장자리가 잉크 상자에 닿으면(= 선 중심이 글자 상자에서 0.5px 안쪽에 들어오면) 겹침.
 *   원 테두리(굵기 2)·각 표시 호(기본 1.5)·굵기 1.5 선(대각선·점선 대칭축·직각 표시)도 같은 기준으로 본다.
 * 굵기 1.5 미만 선(지시선·자·시계 눈금)은 글자 가까이 가도록 그리는 표시라 보지 않는다.
 * 기준을 1로 줄이면 상자 모서리만 선에 걸친 멀쩡한 그림(4학년 직사각형 대각선 길이 글자 등 생성기에 따라 절반 이상)이 걸리고, 2로 늘리면 호가 °·숫자 끝을 지나는 그림을 놓친다.
 */
export const STROKE_SLACK = 1.5;
/**
 * 한글·원 번호처럼 넓은 글자가 든 글자의 여유. 한글 글리프는 상자(14×14)를 거의 꽉 채워
 * 숫자처럼 1.5px 봐주면 원 테두리·시소 판이 글자 모서리를 갈라도 놓친다.
 * 0.5로 줄이면 점선 끝에 붙여 쓴 직선 이름(l5-sym-line-pick 등)이 모두 걸려, 렌더링으로 확인한 0.75로 정했다.
 */
export const HANGUL_SLACK = 0.75;
const isWide = (text: string) => [...text].some((ch) => !/[ -~°]/.test(ch));

type Box = [number, number, number, number];
const grow = ([x0, y0, x1, y1]: Box, d: number): Box => [x0 - d, y0 - d, x1 + d, y1 + d];
const inBox = ([x, y]: Pt, b: Box) => x > b[0] && x < b[2] && y > b[1] && y < b[3];

/** 선분이 상자 안을 지나는지 */
function segmentHits(b: Box, a: Pt, c: Pt): boolean {
  if (b[2] <= b[0] || b[3] <= b[1]) return false;
  const clipped = clip([a[0] - b[0], a[1] - b[1]], [c[0] - b[0], c[1] - b[1]], b[2] - b[0], b[3] - b[1]);
  return clipped !== null && Math.hypot(clipped[1][0] - clipped[0][0], clipped[1][1] - clipped[0][1]) > 0.01;
}

/** 원(호) 둘레가 상자 안을 지나는지: 둘레를 0.5px 간격으로 찍어 본다. from·to는 화면에서 시계 반대 방향 각도(°) */
function curveHits(b: Box, c: Pt, r: number, from = 0, to = 360): boolean {
  const sweep = to - from === 360 ? 360 : (((to - from) % 360) + 360) % 360;
  const n = Math.max(8, Math.ceil(((r * sweep * Math.PI) / 180) / 0.5));
  for (let i = 0; i <= n; i++) {
    const t = ((from + (sweep * i) / n) * Math.PI) / 180;
    if (inBox([c[0] + r * Math.cos(t), c[1] - r * Math.sin(t)], b)) return true;
  }
  return false;
}

/** 선(굵기 1.5 이상)·도형의 변·원 테두리·각 표시 호가 지나가는 글자 번호 목록. slack을 음수로 주면 글자 둘레 여백까지 본다(생성기에서 자리 찾기) */
export function strokeHitTexts(scene: ShapeScene, slack = STROKE_SLACK): number[] {
  const segs: { a: Pt; c: Pt; w: number }[] = [
    ...(scene.lines ?? []).filter((l) => (l.width ?? 2) >= 1.5).map((l) => ({ a: l.from, c: l.to, w: l.width ?? 2 })),
    ...(scene.polygons ?? []).flatMap((pg) => pg.points.map((p, k) => ({ a: p, c: pg.points[(k + 1) % pg.points.length], w: 2 }))),
  ];
  const curves = [
    ...(scene.circles ?? []).map((c) => ({ c: c.c, r: c.r, from: 0, to: 360, w: 2 })),
    ...(scene.arcs ?? []).map((a) => ({ c: a.c, r: a.r, from: a.from, to: a.to, w: a.width ?? 1.5 })),
  ];
  return (scene.texts ?? []).flatMap((t, i) => {
    // slack을 따로 주지 않으면(검사 기본값) 한글이 든 글자는 HANGUL_SLACK으로 본다
    const ink = grow(textBox(t), -(slack === STROKE_SLACK && isWide(t.text) ? HANGUL_SLACK : slack));
    const hit = segs.some((s) => segmentHits(grow(ink, s.w / 2), s.a, s.c)) || curves.some((k) => curveHits(grow(ink, k.w / 2), k.c, k.r, k.from, k.to));
    return hit ? [i] : [];
  });
}

/** 글자끼리(6px 여유 없이 붙어도), 글자와 점이 겹치는지, 선·변·원·호가 글자 위를 지나는지 — 붙은 번호는 어느 선의 것인지 헷갈린다 */
export function textsClash(scene: ShapeScene, gap = 6): boolean {
  const boxes = (scene.texts ?? []).map(textBox);
  const dots = (scene.dots ?? []).map(([x, y]): Box => [x - 3.5, y - 3.5, x + 3.5, y + 3.5]);
  const near = (a: number[], b: number[], g: number) => a[0] < b[2] + g && b[0] < a[2] + g && a[1] < b[3] + g && b[1] < a[3] + g;
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) if (near(boxes[i], boxes[j], gap)) return true;
    if (dots.some((d) => near(boxes[i], d, -1))) return true;
  }
  return strokeHitTexts(scene).length > 0;
}

/** 좌표(다각형·선·점·글자·원·호 중심)가 모두 그림 안에 있는지 */
export function sceneInBounds(scene: ShapeScene): boolean {
  const pts: Pt[] = [
    ...(scene.polygons ?? []).flatMap((p) => p.points),
    ...(scene.lines ?? []).flatMap((l) => [l.from, l.to]),
    ...(scene.dots ?? []),
    ...(scene.circles ?? []).map((c) => c.c),
    ...(scene.arcs ?? []).map((a) => a.c),
  ];
  const boxes = (scene.texts ?? []).map(textBox);
  return (
    pts.every(([x, y]) => x >= 0 && y >= 0 && x <= scene.width && y <= scene.height) &&
    boxes.every(([x0, y0, x1, y1]) => x0 >= -2 && y0 >= -2 && x1 <= scene.width + 2 && y1 <= scene.height + 2)
  );
}

/** 그림이 그림 틀 안에 있고 글자끼리·글자와 점·선·원·호가 겹치지 않는다(생성기 guard와 품질 테스트가 함께 쓴다) */
export const figureOk = (scene: ShapeScene) => sceneInBounds(scene) && !textsClash(scene);

/**
 * 후보 점 번호 글자(①~⑳)가 자기 점을 가리키는지: 글자마다 가장 가까운 점이 두 번째로 가까운 점보다 gap(px) 이상 가깝고,
 * 번호마다 가장 가까운 점이 서로 다르다. 촘촘한 후보 점에 글자를 같은 방향 대각선에 두면 글자가 두 점 사이에 놓여
 * 정답 점을 다른 번호로도 읽을 수 있다(5-2 합동 대응점 검수). 번호 글자나 점이 없는 그림은 통과
 */
export function marksNearOwnDot(scene: ShapeScene, gap = 6): boolean {
  const dots = scene.dots ?? [];
  const marks = (scene.texts ?? []).filter((t) => /^[①-⑳]$/.test(t.text));
  if (!marks.length || dots.length < 2) return true;
  const owners = new Set<number>();
  for (const t of marks) {
    const ds = dots.map((d, i) => ({ i, r: Math.hypot(d[0] - t.at[0], d[1] - t.at[1]) })).sort((a, b) => a.r - b.r);
    if (ds[1].r - ds[0].r < gap) return false;
    owners.add(ds[0].i);
  }
  return owners.size === marks.length;
}

/* ── 글자 자리 찾기(생성기용): 검사에 걸리는 그림을 버리지 않고 글자를 옮겨 살린다 ── */

/**
 * 후보 자리 중 글자가 선·변·원·호와 margin(px) 이상 떨어지고 이미 놓인 글자와 겹치지 않는 첫 자리.
 * scene에는 지금까지 놓은 글자까지 넣어 둔다. 없으면 null
 */
export function findTextSpot(scene: ShapeScene, text: string, spots: Pt[], margin = 1): Pt | null {
  const texts = scene.texts ?? [];
  for (const at of spots) {
    const probe: ShapeScene = { ...scene, dots: [], texts: [{ at, text }] };
    if (strokeHitTexts(probe, -margin).length) continue;
    if (textsClash({ kind: "shape", width: 0, height: 0, label: "", dots: scene.dots, texts: [...texts, { at, text }] })) continue;
    return at;
  }
  return null;
}

/** 꼭짓점 v에서 두 변(v→a, v→b) 사이 각의 이등분선을 따라 from~to px의 후보 자리(1px 간격, 가까운 곳부터) */
export function bisectorSpots(v: Pt, a: Pt, b: Pt, from: number, to: number): Pt[] {
  const unit = (p: Pt): Pt => {
    const d = Math.hypot(p[0] - v[0], p[1] - v[1]) || 1;
    return [(p[0] - v[0]) / d, (p[1] - v[1]) / d];
  };
  const [u, w] = [unit(a), unit(b)];
  let dir: Pt = [u[0] + w[0], u[1] + w[1]];
  const n = Math.hypot(dir[0], dir[1]);
  dir = n < 1e-6 ? [u[1], -u[0]] : [dir[0] / n, dir[1] / n];
  return Array.from({ length: Math.max(0, Math.floor(to - from) + 1) }, (_, i): Pt => [Math.round((v[0] + dir[0] * (from + i)) * 10) / 10, Math.round((v[1] + dir[1] * (from + i)) * 10) / 10]);
}

/**
 * 검사에 걸린 그림을 버리기 전에 걸린 글자만 조금(최대 maxShift px) 옮겨 본다.
 * 글자가 제자리에서 몇 px 움직이는 정도라 무엇을 가리키는 글자인지는 그대로다. 다 풀리면 고친 그림, 아니면 null
 */
export function nudgeTexts(scene: ShapeScene, maxShift = 6): ShapeScene | null {
  if (figureOk(scene)) return scene;
  const texts = [...(scene.texts ?? [])];
  const bad = new Set(strokeHitTexts({ ...scene, texts }));
  const boxes = () => texts.map(textBox);
  const near = (a: number[], b: number[], g: number) => a[0] < b[2] + g && b[0] < a[2] + g && a[1] < b[3] + g && b[1] < a[3] + g;
  for (let i = 0; i < texts.length; i++) {
    const others = boxes().filter((_, k) => k !== i);
    if (others.some((b) => near(textBox(texts[i]), b, 6))) bad.add(i);
  }
  for (const i of bad) {
    const t = texts[i];
    const ok = (at: Pt) => {
      const moved = { ...t, at };
      if (strokeHitTexts({ ...scene, texts: [moved] }).length) return false;
      const b = textBox(moved);
      if ((scene.dots ?? []).some(([x, y]) => near(b, [x - 3.5, y - 3.5, x + 3.5, y + 3.5], -1))) return false;
      return texts.every((o, k) => k === i || !near(b, textBox(o), 6));
    };
    let found: Pt | null = null;
    for (let r = 1; r <= maxShift && !found; r++)
      for (let k = 0; k < 16 && !found; k++) {
        const a = (k * Math.PI) / 8;
        const at: Pt = [Math.round((t.at[0] + r * Math.cos(a)) * 10) / 10, Math.round((t.at[1] + r * Math.sin(a)) * 10) / 10];
        if (ok(at)) found = at;
      }
    if (!found) return null;
    texts[i] = { ...t, at: found };
  }
  const fixed = { ...scene, texts };
  return figureOk(fixed) ? fixed : null;
}

/** 생성기 guard용: 도형 그림이 검사를 통과하면 그대로, 글자를 조금 옮겨 통과하면 고친 것, 아니면 null(다시 뽑는다) */
export function settleVisual<T extends { visual?: Visual }>(w: T | null): T | null {
  if (!w) return null;
  if (w.visual?.kind !== "shape") return w;
  const fixed = nudgeTexts(w.visual);
  return fixed ? { ...w, visual: fixed } : null;
}
