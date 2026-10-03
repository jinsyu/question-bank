import type { ShapeScene } from "../types";
import { pick, randInt, shuffle } from "../../lib/random";
import { MARKS, easy as easyBase, markChoice, mid as midBase, names, opts, word as wordBase } from "./g4";
import { guard, textsClash, type Make } from "./g4-quad";
import { bisectorSpots, findTextSpot } from "../figure-check";
import { josa } from "../josa";
import { ord } from "../ordinal";

/**
 * 4학년 차시용 생성기(4): 평면도형의 이동, 삼각형, 사각형, 다각형
 */

type Pt = [number, number];

/** 그림 글자가 겹치거나 그림 밖으로 나가면 다시 뽑는다 */
const easy = (id: string, make: Make) => easyBase(id, guard(make));
const mid = (id: string, make: Make) => midBase(id, guard(make));
const word = (id: string, make: Make) => wordBase(id, guard(make));

/* ── 평면도형의 이동 ── */

const CELL = 24;
const COLS = 10;
const ROWS = 7;

/** 모눈(가로 COLS칸, 세로 ROWS−1칸)과 바깥 한 칸 여백 */
function gridScene(label: string, extra: Partial<ShapeScene>): ShapeScene {
  return { kind: "shape", width: (COLS + 2) * CELL, height: (ROWS + 1) * CELL, label, grid: CELL, ...extra };
}
const gp = (x: number, y: number): Pt => [CELL + x * CELL, CELL + y * CELL];
/** 점 이름은 점의 오른쪽 위에 */
const nameAt = (p: Pt, text: string) => ({ at: [gp(...p)[0] + 10, gp(...p)[1] - 10] as Pt, text });

/** 모눈 위 점 ㄱ과 후보 점 ①~④ */
function pointsScene(start: Pt, cands: Pt[], startLabel = "ㄱ"): ShapeScene {
  return gridScene(`모눈 위의 점 ${startLabel}과 점 ①~④`, {
    dots: [gp(...start), ...cands.map((c) => gp(...c))],
    texts: [nameAt(start, startLabel), ...cands.map((c, i) => nameAt(c, MARKS[i]))],
  });
}

const DIR = {
  right: { text: "오른쪽", v: [1, 0] as Pt },
  left: { text: "왼쪽", v: [-1, 0] as Pt },
  up: { text: "위쪽", v: [0, -1] as Pt },
  down: { text: "아래쪽", v: [0, 1] as Pt },
};

const inGrid = (p: Pt) => p[0] >= 0 && p[0] <= COLS && p[1] >= 0 && p[1] <= ROWS - 1;

/** 가로·세로 이동량 하나씩 정하기 */
function moveOf(rand: () => number, start: Pt) {
  const h = pick(rand, ["right", "left"] as const);
  const v = pick(rand, ["up", "down"] as const);
  const dh = randInt(rand, 1, 4);
  const dv = randInt(rand, 1, 3);
  const end: Pt = [start[0] + DIR[h].v[0] * dh, start[1] + DIR[v].v[1] * dv];
  if (!inGrid(end)) return null;
  return { h, v, dh, dv, end };
}

/** 정답 점 + 헷갈리는 점 3개(모눈 안, 처음 점과 다름) */
function choosePoints(rand: () => number, start: Pt, end: Pt, alt: Pt[]) {
  const ok = (p: Pt) => inGrid(p) && !(p[0] === start[0] && p[1] === start[1]);
  const seen = new Set([end.join()]);
  const pts: Pt[] = [end];
  for (const p of alt) {
    if (pts.length < 4 && ok(p) && !seen.has(p.join())) {
      seen.add(p.join());
      pts.push(p);
    }
  }
  if (pts.length < 4) return null;
  const order = shuffle(rand, pts);
  return { order, answer: MARKS[order.findIndex((p) => p.join() === end.join())] };
}

/** 정답 점과 헷갈리는 점(가로·세로를 바꾸거나 방향을 반대로) */
function pointChoices(rand: () => number, start: Pt, m: NonNullable<ReturnType<typeof moveOf>>) {
  const alt: Pt[] = [
    [start[0] + DIR[m.h].v[0] * m.dv, start[1] + DIR[m.v].v[1] * m.dh],
    [start[0] - DIR[m.h].v[0] * m.dh, start[1] + DIR[m.v].v[1] * m.dv],
    [start[0] + DIR[m.h].v[0] * m.dh, start[1] - DIR[m.v].v[1] * m.dv],
    [start[0] + DIR[m.h].v[0] * (m.dh + 1), start[1] + DIR[m.v].v[1] * m.dv],
  ];
  return choosePoints(rand, start, m.end, alt);
}

export const l4PointMove = easy("l4-point-move", (rand) => {
  const start: Pt = [randInt(rand, 2, 8), randInt(rand, 1, 5)];
  const m = moveOf(rand, start);
  if (!m) return null;
  const c = pointChoices(rand, start, m);
  if (!c) return null;
  return {
    key: `${start}:${m.h}${m.dh}:${m.v}${m.dv}:${c.answer}`,
    prompt: `점 ㄱ을 ${DIR[m.h].text}으로 ${m.dh} cm, ${DIR[m.v].text}으로 ${m.dv} cm 이동한 위치를 고르세요. (모눈 한 칸은 1 cm입니다.)`,
    visual: pointsScene(start, c.order),
    answer: c.answer,
    choices: MARKS,
    hint: "한 방향씩 차례로 칸을 세어 옮겨요.",
    explanation: `${DIR[m.h].text}으로 ${m.dh}칸, ${DIR[m.v].text}으로 ${m.dv}칸 옮긴 점은 ${c.answer}입니다.`,
  };
});

export const l4PointMoveDesc = mid("l4-point-move-desc", (rand) => {
  const start: Pt = [randInt(rand, 1, 9), randInt(rand, 1, 5)];
  const m = moveOf(rand, start);
  if (!m) return null;
  return {
    key: `${start}:${m.end}`,
    prompt: `점 ㄱ을 점 ㄴ의 위치로 옮기려면 ${DIR[m.h].text}으로 몇 cm, ${DIR[m.v].text}으로 몇 cm 이동해야 하나요? (모눈 한 칸은 1 cm입니다.)`,
    visual: gridScene("모눈 위의 점 ㄱ과 점 ㄴ", { dots: [gp(...start), gp(...m.end)], texts: [nameAt(start, "ㄱ"), nameAt(m.end, "ㄴ")] }),
    answer: `${m.dh},${m.dv}`,
    unit: [`cm(${DIR[m.h].text})`, `cm(${DIR[m.v].text})`],
    hint: "가로로 몇 칸, 세로로 몇 칸 떨어져 있는지 세어요.",
    explanation: `${DIR[m.h].text}으로 ${m.dh} cm, ${DIR[m.v].text}으로 ${m.dv} cm`,
  };
});

export const l4PointBack = mid("l4-point-back", (rand) => {
  const end: Pt = [randInt(rand, 2, 8), randInt(rand, 1, 5)];
  // 처음 점 → end 로 이동. 거꾸로: end에서 반대로 옮긴 점이 답
  const m = moveOf(rand, end);
  if (!m) return null;
  const rev = { h: m.h === "right" ? "left" : "right", v: m.v === "up" ? "down" : "up" } as const;
  const c = pointChoices(rand, end, m);
  if (!c) return null;
  return {
    key: `${end}:${m.h}${m.dh}:${m.v}${m.dv}:${c.answer}`,
    prompt: `어떤 점을 ${DIR[rev.h].text}으로 ${m.dh} cm, ${DIR[rev.v].text}으로 ${m.dv} cm 이동했더니 점 ㄱ의 위치가 되었습니다. 처음 점의 위치를 고르세요. (모눈 한 칸은 1 cm입니다.)`,
    visual: pointsScene(end, c.order),
    answer: c.answer,
    choices: MARKS,
    hint: "점 ㄱ에서 거꾸로, 반대 방향으로 옮겨 보세요.",
    explanation: `점 ㄱ에서 ${DIR[m.h].text}으로 ${m.dh} cm, ${DIR[m.v].text}으로 ${m.dv} cm 옮긴 ${josa(c.answer, "이/가")} 처음 점입니다.`,
  };
});

export const l4PointTwoStep = word("l4-point-two-step", (rand) => {
  const start: Pt = [randInt(rand, 1, 9), randInt(rand, 1, 5)];
  const m1 = moveOf(rand, start);
  if (!m1) return null;
  const m2 = moveOf(rand, m1.end);
  if (!m2 || m2.h === m1.h || m2.v === m1.v) return null;
  const end = m2.end;
  if (end[0] === start[0] && end[1] === start[1]) return null;
  // 헷갈리는 점: 첫 번째만 옮긴 점, 두 번째 이동의 가로·세로를 바꾼 점, 두 번째 이동을 거꾸로 한 점
  const back: Pt = [m1.end[0] - DIR[m2.h].v[0] * m2.dh, m1.end[1] - DIR[m2.v].v[1] * m2.dv];
  const swap: Pt = [m1.end[0] + DIR[m2.h].v[0] * m2.dv, m1.end[1] + DIR[m2.v].v[1] * m2.dh];
  const c = choosePoints(rand, start, end, shuffle(rand, [m1.end, swap, back, [end[0] + 1, end[1]], [end[0], end[1] + 1]]));
  if (!c) return null;
  const say = (m: typeof m1) => `${DIR[m.h].text}으로 ${m.dh} cm, ${DIR[m.v].text}으로 ${m.dv} cm`;
  return {
    key: `${start}:${m1.end}:${end}:${c.answer}`,
    prompt: `점 ㄱ을 ${say(m1)} 이동한 다음, 다시 ${say(m2)} 이동했습니다. 점 ㄱ이 도착한 위치를 고르세요. (모눈 한 칸은 1 cm입니다.)`,
    visual: pointsScene(start, c.order),
    answer: c.answer,
    choices: MARKS,
    hint: "첫 번째 이동을 마친 곳에서 두 번째 이동을 시작해요. 가로 이동과 세로 이동을 따로 모아 생각해도 돼요.",
    explanation: `첫 번째 이동을 마친 곳에서 ${say(m2)} 더 옮기면 ${c.answer}에 도착해요.`,
  };
});

export const l4PointMulti = word("l4-point-multi", (rand) => {
  const l1 = randInt(rand, 3, 8);
  const r1 = randInt(rand, 1, l1 - 1);
  const u1 = randInt(rand, 2, 7);
  const d1 = randInt(rand, 1, u1 - 1);
  const [a] = names(rand, 1);
  return {
    key: `${l1}:${r1}:${u1}:${d1}`,
    prompt: `${a}는 말을 왼쪽으로 ${l1} cm, 위쪽으로 ${u1} cm, 오른쪽으로 ${r1} cm, 아래쪽으로 ${d1} cm 차례로 옮겼습니다. 말을 처음 위치로 한 번에 돌려놓으려면 오른쪽으로 몇 cm, 아래쪽으로 몇 cm 옮겨야 하나요?`,
    answer: `${l1 - r1},${u1 - d1}`,
    unit: ["cm(오른쪽)", "cm(아래쪽)"],
    hint: "왼쪽·오른쪽 이동과 위쪽·아래쪽 이동을 따로 모아 생각해요.",
    explanation: `결국 왼쪽으로 ${l1} − ${r1} = ${l1 - r1} cm, 위쪽으로 ${u1} − ${d1} = ${u1 - d1} cm 옮겼으므로 반대로 옮겨요.`,
  };
});

export const l4SlideOverlap = word("l4-slide-overlap", (rand) => {
  const side = randInt(rand, 4, 8);
  const overlap = rand() < 0.5;
  const move = overlap ? randInt(rand, 1, side - 1) : randInt(rand, 1, 4);
  const answer = overlap ? side - move : side + move;
  // 1 cm = 16px: 처음 정사각형(색칠)과 민 정사각형(점선), 민 방향 화살표
  const k = 16;
  const x0 = 24;
  const y0 = 40;
  const S = side * k;
  const M = move * k;
  const sq = (x: number): Pt[] => [[x, y0], [x + S, y0], [x + S, y0 + S], [x, y0 + S]];
  const moved = sq(x0 + M);
  return {
    key: `${side}:${move}:${overlap}`,
    prompt: overlap
      ? `한 변이 ${side} cm인 정사각형을 오른쪽으로 ${move} cm 밀었습니다. 처음 정사각형과 민 정사각형(점선)이 겹치는 부분의 가로 길이는 몇 cm인가요?`
      : `한 변이 ${side} cm인 정사각형을 오른쪽으로 ${move} cm 밀었습니다. 처음 정사각형의 왼쪽 변에서 민 정사각형(점선)의 오른쪽 변까지의 거리는 몇 cm인가요?`,
    visual: {
      kind: "shape",
      width: x0 * 2 + S + M,
      height: y0 + S + 24,
      label: "정사각형을 오른쪽으로 민 그림",
      polygons: [{ points: sq(x0), fill: true }],
      lines: [
        ...moved.map((p, i) => ({ from: p, to: moved[(i + 1) % 4], dashed: true })),
        { from: [x0, y0 - 16] as Pt, to: [x0 + M, y0 - 16] as Pt, arrows: "end" as const, width: 1.5 },
      ],
      texts: [{ at: [x0 + S / 2, y0 + S / 2] as Pt, text: "처음" }],
    },
    answer,
    unit: "cm",
    hint: "민 거리만큼 도형 전체가 옮겨져요. 그림에서 처음 정사각형과 민 정사각형(점선)을 비교해 보세요.",
    explanation: overlap ? `${side} − ${move} = ${answer}(cm)` : `${move} + ${side} = ${answer}(cm)`,
    mistakes: overlap ? { [side + move]: "겹치는 부분이 아니라 전체 길이를 구했어요." } : { [side - move]: "겹치는 부분의 길이를 구했어요." },
  };
});

/** 무늬를 찍는 작은 조각(칸 좌표) */
const STAMPS: Pt[][] = [
  [[0, 0], [1, 0], [0, 1]],
  [[0, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [1, 1]],
  [[0, 0], [1, 0]],
];

export const l4SlidePattern = word("l4-slide-pattern", (rand) => {
  const step = randInt(rand, 3, 4);
  const cells = pick(rand, STAMPS);
  const n = randInt(rand, 5, 12);
  const c = 20;
  const cols = 2 + step * 2 + 2;
  const polygons = [0, 1, 2].flatMap((k) =>
    cells.map(([x, y]) => {
      const X = (1 + k * step + x) * c;
      const Y = (2 + y) * c;
      return { fill: k === 0, points: [[X, Y], [X + c, Y], [X + c, Y + c], [X, Y + c]] as Pt[] };
    }),
  );
  return {
    key: `${step}:${n}:${STAMPS.indexOf(cells)}`,
    prompt: `모양 조각을 오른쪽으로 똑같은 거리만큼씩 밀면서 찍어 무늬를 만들고 있습니다. 그림은 셋째까지 찍은 모양입니다. 이 규칙으로 계속 찍을 때 ${ord(n)}로 찍은 모양은 첫째로 찍은 모양에서 오른쪽으로 몇 cm 떨어져 있나요? (모눈 한 칸은 1 cm입니다.)`,
    visual: {
      kind: "shape",
      width: (cols + 1) * c,
      height: 5 * c,
      grid: c,
      label: "모양 조각을 밀면서 찍은 무늬",
      polygons,
      texts: [{ at: [2 * c, 1.2 * c] as Pt, text: "첫째" }],
    },
    answer: step * (n - 1),
    unit: "cm",
    hint: "먼저 한 번에 몇 cm씩 밀었는지 모눈 칸을 세어요. 첫째에서 몇째까지 몇 번 밀었는지도 세어요.",
    explanation: `한 번에 ${step} cm씩, ${n - 1}번 밀었으므로 ${step} × ${n - 1} = ${step * (n - 1)}(cm)`,
    mistakes: { [step * n]: "민 횟수를 한 번 더 셌어요." },
  };
});

/** 모눈 위 사각형·삼각형 도형 한 개를 오른쪽으로 민 위치 고르기 */
export const l4SlideWhere = easy("l4-slide-where", (rand) => {
  const w = randInt(rand, 1, 2);
  const h = randInt(rand, 1, 2);
  const tri = rand() < 0.5;
  const sx = randInt(rand, 0, 2);
  const sy = randInt(rand, 0, ROWS - 1 - h);
  const dx = randInt(rand, w + 2, COLS - sx - 3);
  const shapeAt = (x: number, y: number): Pt[] =>
    tri ? [gp(x, y + h), gp(x + w, y + h), gp(x, y)] : [gp(x, y), gp(x + w, y), gp(x + w, y + h), gp(x, y + h)];
  const cands = [dx - 1, dx, dx + 1, dx + 2].filter((d) => sx + d <= COLS);
  if (cands.length < 4) return null;
  const order = shuffle(rand, cands);
  return {
    key: `${w}:${h}:${tri}:${sx}:${sy}:${dx}:${order.join()}`,
    prompt: `처음 도형을 오른쪽으로 ${dx} cm 밀었을 때, 도형의 왼쪽 아래 꼭짓점은 어느 점에 오나요? (모눈 한 칸은 1 cm입니다.)`,
    visual: gridScene("모눈 위의 처음 도형과 점 ①~④", {
      polygons: [{ points: shapeAt(sx, sy), fill: true }],
      dots: order.map((d) => gp(sx + d, sy + h)),
      texts: [
        { at: [gp(sx, sy)[0] + (w * CELL) / 2 + 6, gp(sx, sy)[1] - 12], text: "처음" },
        ...order.map((d, i) => nameAt([sx + d, sy + h], MARKS[i])),
      ],
    }),
    answer: MARKS[order.indexOf(dx)],
    choices: MARKS,
    hint: "도형을 밀면 꼭짓점도 모두 같은 방향으로 같은 거리만큼 움직여요.",
    explanation: `왼쪽 아래 꼭짓점을 오른쪽으로 ${dx}칸 옮기면 ${MARKS[order.indexOf(dx)]}입니다.`,
  };
});

export const l4SlideDist = mid("l4-slide-dist", (rand) => {
  const w = randInt(rand, 1, 3);
  const h = randInt(rand, 1, 2);
  const sx = randInt(rand, 0, 2);
  const sy = randInt(rand, 0, 2);
  const dx = randInt(rand, w + 1, COLS - sx - w);
  const dy = rand() < 0.5 ? 0 : randInt(rand, h + 1, ROWS - 1 - sy - h);
  if (dy < 0 || sy + dy + h > ROWS - 1 || sx + dx + w > COLS) return null;
  const rect = (x: number, y: number): Pt[] => [gp(x, y), gp(x + w, y), gp(x + w, y + h), gp(x, y + h)];
  const center = (x: number, y: number): Pt => [gp(x, y)[0] + (w * CELL) / 2, gp(x, y)[1] + (h * CELL) / 2];
  return {
    key: `${w}:${h}:${sx}:${sy}:${dx}:${dy}`,
    prompt: dy
      ? "가 도형을 밀어서 나 도형의 위치로 옮겼습니다. 오른쪽으로 몇 cm, 아래쪽으로 몇 cm 밀었나요? (모눈 한 칸은 1 cm입니다.)"
      : "가 도형을 오른쪽으로 밀어서 나 도형의 위치로 옮겼습니다. 몇 cm 밀었나요? (모눈 한 칸은 1 cm입니다.)",
    visual: gridScene("모눈 위의 도형 가와 나", {
      polygons: [{ points: rect(sx, sy), fill: true }, { points: rect(sx + dx, sy + dy) }],
      texts: [
        { at: center(sx, sy), text: "가" },
        { at: center(sx + dx, sy + dy), text: "나" },
      ],
    }),
    answer: dy ? `${dx},${dy}` : dx,
    unit: dy ? ["cm(오른쪽)", "cm(아래쪽)"] : "cm",
    hint: "두 도형에서 같은 꼭짓점끼리 몇 칸 떨어져 있는지 세어요.",
    explanation: dy ? `오른쪽으로 ${dx} cm, 아래쪽으로 ${dy} cm` : `${dx} cm`,
    mistakes: dy ? {} : { [dx - w]: "두 도형 사이의 빈칸만 셌어요. 같은 꼭짓점끼리 세어야 해요." },
  };
});

/* 화살표로 알아보는 뒤집기·돌리기 */

const ARROWS = ["↑", "→", "↓", "←"];
const cw = (a: number, times = 1) => (a + times + 400) % 4;
const flipLR = (a: number) => (a === 1 ? 3 : a === 3 ? 1 : a);
const flipUD = (a: number) => (a === 0 ? 2 : a === 2 ? 0 : a);

const MOVES: { text: string; f: (a: number) => number }[] = [
  { text: "오른쪽으로 뒤집기", f: flipLR },
  { text: "왼쪽으로 뒤집기", f: flipLR },
  { text: "위쪽으로 뒤집기", f: flipUD },
  { text: "아래쪽으로 뒤집기", f: flipUD },
  { text: "시계 방향으로 90°만큼 돌리기", f: (a) => cw(a, 1) },
  { text: "시계 방향으로 180°만큼 돌리기", f: (a) => cw(a, 2) },
  { text: "시계 반대 방향으로 90°만큼 돌리기", f: (a) => cw(a, -1) },
  { text: "시계 방향으로 270°만큼 돌리기", f: (a) => cw(a, 3) },
];

/** "오른쪽으로 뒤집기" → "오른쪽으로 뒤집었을"/"오른쪽으로 뒤집은" */
const past = (t: string, form: "었을" | "은") => {
  const stem = t.slice(0, -1);
  if (stem.endsWith("돌리")) return stem.slice(0, -2) + (form === "은" ? "돌린" : "돌렸을");
  return stem + form;
};

/** 화살표 카드 그림(가리키는 쪽 a: 0 위, 1 오른쪽, 2 아래, 3 왼쪽) */
function arrowCard(a: number): ShapeScene {
  const c: Pt = [60, 60];
  const d: Pt[] = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const [dx, dy] = d[a];
  return {
    kind: "shape",
    width: 120,
    height: 120,
    label: `${["위쪽", "오른쪽", "아래쪽", "왼쪽"][a]}을 가리키는 화살표 카드`,
    polygons: [{ points: [[14, 14], [106, 14], [106, 106], [14, 106]] }],
    lines: [{ from: [c[0] - dx * 32, c[1] - dy * 32], to: [c[0] + dx * 32, c[1] + dy * 32], arrows: "end", width: 4 }],
  };
}

const arrowSpec = (id: string, level: 1 | 2, moves: typeof MOVES, count: 1 | 2) =>
  (level === 1 ? easy : mid)(id, (rand) => {
    const a = randInt(rand, 0, 3);
    const ms = Array.from({ length: count }, () => pick(rand, moves));
    const r = ms.reduce((x, m) => m.f(x), a);
    const doing = count === 1 ? past(ms[0].text, "었을") : `${past(ms[0].text, "은")} 다음 ${past(ms[1].text, "었을")}`;
    return {
      key: `${a}:${ms.map((m) => m.text).join("/")}`,
      prompt: `그림의 화살표 카드를 ${doing} 때 화살표는 어느 쪽을 가리키나요?`,
      visual: arrowCard(a),
      answer: ARROWS[r],
      choices: ARROWS,
      hint: count === 2 ? "한 번 움직인 모양을 먼저 생각한 뒤 다시 움직여요." : "뒤집으면 방향이 반대로 바뀌거나 그대로예요. 돌리면 시계 방향 90°마다 ↑→↓← 순서로 바뀌어요.",
      explanation: `${ARROWS[a]} → ${ms.map((_, i) => ARROWS[ms.slice(0, i + 1).reduce((x, mm) => mm.f(x), a)]).join(" → ")}`,
    };
  });

export const l4ArrowFlip = arrowSpec("l4-arrow-flip", 1, MOVES.slice(0, 4), 1);
export const l4ArrowRotate = arrowSpec("l4-arrow-rotate", 1, MOVES.slice(4), 1);
export const l4ArrowCombo = arrowSpec("l4-arrow-combo", 2, MOVES, 2);
export const l4ArrowFlip2 = arrowSpec("l4-arrow-flip2", 2, MOVES.slice(0, 4), 2);

export const l4FlipTimes = word("l4-flip-times", (rand) => {
  const dir = pick(rand, ["오른쪽", "왼쪽", "위쪽", "아래쪽"]);
  const n = randInt(rand, 2, 15);
  const same = n % 2 === 0;
  const answer = same ? "처음 도형과 같습니다." : `${dir}으로 한 번 뒤집은 도형과 같습니다.`;
  const other = dir === "오른쪽" || dir === "왼쪽" ? "위쪽" : "오른쪽";
  const choices = shuffle(rand, [
    "처음 도형과 같습니다.",
    `${dir}으로 한 번 뒤집은 도형과 같습니다.`,
    `${other}으로 한 번 뒤집은 도형과 같습니다.`,
    "시계 방향으로 90°만큼 돌린 도형과 같습니다.",
  ]);
  return {
    key: `${dir}:${n}`,
    prompt: `도형을 ${dir}으로 ${n}번 뒤집었습니다. 뒤집은 도형에 대해 바르게 말한 것을 고르세요.`,
    answer,
    choices,
    hint: "같은 방향으로 두 번 뒤집으면 처음 도형이 돼요. 짝수 번인지 홀수 번인지 생각해요.",
    explanation: `${n}번은 ${same ? "짝수" : "홀수"} 번이므로 ${answer}`,
  };
});

export const l4ClockFlip = word("l4-clock-flip", (rand) => {
  const lr = rand() < 0.5;
  const k = randInt(rand, 1, 12);
  const mapped = lr ? (12 - k) % 12 || 12 : ((18 - k) % 12) || 12;
  if (mapped === k) return null;
  return {
    key: `${lr}:${k}`,
    prompt: `시계의 숫자판을 ${lr ? "오른쪽" : "아래쪽"}으로 뒤집었습니다. 뒤집은 숫자판에서 처음에 숫자 ${josa(k, "이/가")} 있던 자리에는 어떤 숫자가 오나요? (숫자의 모양은 생각하지 않습니다.)`,
    answer: mapped,
    hint: lr ? "오른쪽으로 뒤집으면 12와 6을 잇는 선을 기준으로 왼쪽과 오른쪽이 바뀌어요." : "아래쪽으로 뒤집으면 3과 9를 잇는 선을 기준으로 위와 아래가 바뀌어요.",
    explanation: `${lr ? "12와 6을 잇는 선" : "3과 9를 잇는 선"}을 기준으로 ${k}의 반대쪽 자리에 있던 숫자 ${josa(mapped, "이/가")} 옵니다.`,
  };
});

export const l4RotateEquiv = mid("l4-rotate-equiv", (rand) => {
  const deg = pick(rand, [90, 180, 270, 360]);
  const ccw = rand() < 0.5;
  const eqDeg = (360 - deg) % 360;
  const answer = deg === 360 ? "처음 도형과 같습니다" : deg === 180 ? `시계 ${ccw ? "" : "반대 "}방향으로 180°만큼 돌린 것` : `시계 ${ccw ? "" : "반대 "}방향으로 ${eqDeg}°만큼 돌린 것`;
  // 360°는 어느 방향으로 돌려도 처음 도형과 같으므로, 반대 방향 360°를 오답으로 쓰지 않는다
  const wrong = [
    `시계 ${ccw ? "" : "반대 "}방향으로 ${deg === 180 || deg === 360 ? 90 : deg}°만큼 돌린 것`,
    deg === 360 ? "시계 방향으로 180°만큼 돌린 것" : "처음 도형과 같습니다",
    `시계 ${ccw ? "반대 " : ""}방향으로 ${deg === 90 ? 270 : 90}°만큼 돌린 것`,
    "오른쪽으로 뒤집은 것",
  ];
  return {
    key: `${deg}:${ccw}`,
    prompt: `도형을 시계 ${ccw ? "반대 " : ""}방향으로 ${deg}°만큼 돌린 모양과 같은 것을 고르세요.`,
    answer,
    choices: opts(rand, answer, wrong.filter((w) => w !== answer), () => "위쪽으로 뒤집은 것"),
    hint: "한 바퀴는 360°예요. 반대 방향으로 돌린 각도와 합이 360°이면 같은 모양이 돼요.",
    explanation: deg === 360 ? "360°는 한 바퀴이므로 처음 도형과 같습니다." : `${deg}° + ${deg === 180 ? 180 : eqDeg}° = 360°이므로 ${answer}과 같습니다.`,
  };
});

const ROT180: Record<number, number> = { 1: 1, 6: 9, 8: 8, 9: 6 };

export const l4RotateDigits = word("l4-rotate-digits", (rand) => {
  const len = randInt(rand, 2, 3);
  const ds = Array.from({ length: len }, () => pick(rand, [1, 6, 8, 9]));
  const n = Number(ds.join(""));
  const rotated = Number([...ds].reverse().map((d) => ROT180[d]).join(""));
  if (rotated === n) return null;
  const ask = pick(rand, ["합", "차"]);
  const answer = ask === "합" ? n + rotated : Math.abs(n - rotated);
  return {
    key: `${n}:${ask}`,
    prompt: `수 카드 ${ds.length}장 ${josa(ds.join(", "), "을/를")} 늘어놓아 ${josa(n, "을/를")} 만들었습니다. 카드 전체를 시계 방향으로 180°만큼 돌렸을 때 만들어지는 수와 처음 수의 ${josa(ask, "을/를")} 구하세요. (1, 8은 돌려도 1, 8이고, 6은 9, 9는 6이 됩니다.)`,
    answer,
    hint: "180°만큼 돌리면 카드의 순서가 거꾸로 되고, 각 숫자도 거꾸로 보여요.",
    explanation: `돌린 수: ${rotated} → ${ask === "합" ? `${n} + ${rotated}` : `${Math.max(n, rotated)} − ${Math.min(n, rotated)}`} = ${answer}`,
    mistakes: { [ask === "합" ? n + Number([...ds].map((d) => ROT180[d]).join("")) : Math.abs(n - Number([...ds].map((d) => ROT180[d]).join("")))]: "카드의 순서가 거꾸로 바뀌는 것을 빠뜨렸어요." },
  };
});

export const l4RotateMore = word("l4-rotate-more", (rand) => {
  const n = randInt(rand, 5, 30);
  if (n % 4 === 0) return null;
  const more = 4 - (n % 4);
  const deg = pick(rand, [90, 180]);
  const k = deg === 90 ? n : n;
  const need = deg === 90 ? more : (n % 2 === 0 ? 0 : 1);
  if (need === 0) return null;
  return {
    key: `${deg}:${k}`,
    prompt: `도형을 시계 방향으로 ${deg}°만큼 ${k}번 돌렸습니다. 처음 도형과 같은 모양이 되려면 시계 방향으로 ${deg}°만큼 적어도 몇 번 더 돌려야 하나요?`,
    answer: need,
    unit: "번",
    hint: `${deg}°씩 ${360 / deg}번 돌리면 한 바퀴(360°)가 되어 처음 모양이 돼요.`,
    explanation: `${360 / deg}번 돌릴 때마다 처음 모양 → ${k}번 돌린 뒤 ${need}번 더 돌리면 ${k + need}번이므로 ${(k + need) / (360 / deg)}바퀴를 돌아 처음 모양이 돼요.`,
  };
});

export const l4ComboEquiv = mid("l4-combo-equiv", (rand) => {
  const pairs = [
    { q: "오른쪽으로 뒤집은 다음 아래쪽으로 뒤집은", a: "시계 방향으로 180°만큼 돌린 것" },
    { q: "위쪽으로 뒤집은 다음 왼쪽으로 뒤집은", a: "시계 방향으로 180°만큼 돌린 것" },
    { q: "오른쪽으로 두 번 뒤집은", a: "처음 도형과 같은 것" },
    { q: "시계 방향으로 90°만큼 두 번 돌린", a: "시계 방향으로 180°만큼 돌린 것" },
    { q: "시계 반대 방향으로 90°만큼 세 번 돌린", a: "시계 방향으로 90°만큼 돌린 것" },
    { q: "시계 방향으로 180°만큼 두 번 돌린", a: "처음 도형과 같은 것" },
  ];
  const p = pick(rand, pairs);
  const all = ["시계 방향으로 180°만큼 돌린 것", "처음 도형과 같은 것", "시계 방향으로 90°만큼 돌린 것", "오른쪽으로 뒤집은 것", "아래쪽으로 뒤집은 것"];
  return {
    key: p.q,
    prompt: `도형을 ${p.q} 모양은 어떻게 움직인 모양과 같은가요?`,
    answer: p.a,
    choices: opts(rand, p.a, shuffle(rand, all.filter((x) => x !== p.a)), () => "시계 반대 방향으로 90°만큼 돌린 것"),
    hint: "화살표(↑)를 그려 차례로 움직여 보세요.",
    explanation: `${p.q} 모양은 ${p.a}입니다.`,
  };
});

export const l4ComboReverse = word("l4-combo-reverse", (rand) => {
  const rot = pick(rand, [
    { text: "시계 방향으로 90°만큼 돌린", undo: "시계 반대 방향으로 90°만큼 돌리기" },
    { text: "시계 반대 방향으로 90°만큼 돌린", undo: "시계 방향으로 90°만큼 돌리기" },
  ]);
  const flip = pick(rand, ["오른쪽", "위쪽"]);
  const right = `${flip}으로 뒤집은 다음 ${rot.undo}`;
  const wrongs = [
    `${rot.undo.replace("돌리기", "돌린")} 다음 ${flip}으로 뒤집기`,
    `${flip}으로 뒤집은 다음 ${rot.text.replace("돌린", "돌리기")}`,
    `${flip === "오른쪽" ? "위쪽" : "오른쪽"}으로 뒤집은 다음 ${rot.undo}`,
  ];
  const r = markChoice(rand, right, wrongs);
  return {
    key: `${rot.text}:${flip}:${r.answer}`,
    prompt: `어떤 도형을 ${rot.text} 다음 ${flip}으로 뒤집었습니다. 움직인 도형을 처음 도형으로 되돌리는 방법을 고르세요.`,
    visual: r.visual,
    answer: r.answer,
    choices: r.choices,
    hint: "거꾸로 되돌릴 때는 나중에 한 움직임부터 반대로 해요.",
    explanation: `나중에 한 '${flip}으로 뒤집기'를 먼저 되돌리고(같은 방향으로 한 번 더 뒤집기), 그다음 ${rot.undo}를 해요.`,
  };
});

/* ── 4-2 삼각형 ── */

const TRI_TRUE = [
  "정삼각형은 이등변삼각형이라고 할 수 있습니다.",
  "이등변삼각형은 두 각의 크기가 같습니다.",
  "정삼각형의 세 각은 모두 60°입니다.",
  "직각삼각형도 이등변삼각형이 될 수 있습니다.",
  "둔각삼각형도 이등변삼각형이 될 수 있습니다.",
];
const TRI_FALSE = [
  "이등변삼각형은 모두 정삼각형입니다.",
  "정삼각형은 둔각삼각형이 될 수 있습니다.",
  "이등변삼각형의 세 각은 모두 같습니다.",
  "둔각삼각형은 둔각이 두 개입니다.",
  "직각삼각형은 예각이 하나뿐입니다.",
  "예각삼각형은 예각이 두 개뿐입니다.",
];

export const l4TriStatement = mid("l4-tri-statement", (rand) => {
  const right = rand() < 0.5;
  const ans = pick(rand, right ? TRI_TRUE : TRI_FALSE);
  const others = shuffle(rand, right ? TRI_FALSE : TRI_TRUE).slice(0, 3);
  return {
    key: `${right}:${ans}:${others.join()}`,
    prompt: `삼각형에 대한 설명으로 ${right ? "옳은" : "옳지 않은"} 것을 고르세요.`,
    answer: ans,
    choices: shuffle(rand, [ans, ...others]),
    hint: "정삼각형은 세 변이, 이등변삼각형은 두 변이 같아요. 삼각형의 세 각의 합은 180°예요.",
    explanation: `${right ? "옳은" : "옳지 않은"} 설명: ${ans}`,
  };
});

/** 변의 길이에 따라 분류하기(삼각형 첫 차시): 각의 성질·각에 따른 분류는 뒤 차시라 변의 길이만 다룬다 */
const SIDE_TRUE = [
  "정삼각형은 이등변삼각형이라고 할 수 있습니다.",
  "세 변의 길이가 모두 같은 삼각형은 정삼각형입니다.",
  "두 변의 길이가 같은 삼각형은 이등변삼각형입니다.",
  "세 변의 길이가 모두 다른 삼각형은 이등변삼각형이 아닙니다.",
  "정삼각형은 세 변의 길이가 모두 같습니다.",
];
const SIDE_FALSE = [
  "이등변삼각형은 모두 정삼각형입니다.",
  "정삼각형은 이등변삼각형이라고 할 수 없습니다.",
  "이등변삼각형은 세 변의 길이가 모두 같아야 합니다.",
  "두 변의 길이가 같은 삼각형은 모두 정삼각형입니다.",
  "세 변의 길이가 모두 다른 삼각형도 이등변삼각형입니다.",
];

export const l4TriSideStatement = mid("l4-tri-side-statement", (rand) => {
  const right = rand() < 0.5;
  const ans = pick(rand, right ? SIDE_TRUE : SIDE_FALSE);
  const others = shuffle(rand, right ? SIDE_FALSE : SIDE_TRUE).slice(0, 3);
  return {
    key: `${right}:${ans}:${others.join()}`,
    prompt: `삼각형에 대한 설명으로 ${right ? "옳은" : "옳지 않은"} 것을 고르세요.`,
    answer: ans,
    choices: shuffle(rand, [ans, ...others]),
    hint: "이등변삼각형은 두 변의 길이가 같고, 정삼각형은 세 변의 길이가 같아요.",
    explanation: `${right ? "옳은" : "옳지 않은"} 설명: ${ans}`,
  };
});

export const l4WireTriangle = word("l4-wire-triangle", (rand) => {
  const a = randInt(rand, 5, 15);
  const b = randInt(rand, 6, 15);
  const c = randInt(rand, 3, 2 * b - 1);
  const total = 3 * a + 2 * b + c + randInt(rand, 0, 0);
  return {
    key: `${a}:${b}:${c}`,
    prompt: `철사 ${total} cm를 모두 사용하여 한 변이 ${a} cm인 정삼각형 한 개와, 길이가 같은 두 변이 각각 ${b} cm인 이등변삼각형 한 개를 만들었습니다. 이등변삼각형의 나머지 한 변은 몇 cm인가요?`,
    answer: c,
    unit: "cm",
    hint: "먼저 정삼각형을 만드는 데 쓴 철사의 길이를 구해요.",
    explanation: `정삼각형: ${a} × 3 = ${3 * a}(cm), 이등변삼각형의 같은 두 변: ${b} × 2 = ${2 * b}(cm) → ${total} − ${3 * a} − ${2 * b} = ${c}(cm)`,
  };
});

export const l4IsoCases = word("l4-iso-cases", (rand) => {
  // 꼭지각일 때 밑각 (180° − a) ÷ 2도 5의 배수가 되도록 10° 단위
  const a = randInt(rand, 2, 8) * 10;
  const asBase = 180 - 2 * a; // a가 밑각일 때 꼭지각
  const asTop = (180 - a) / 2; // a가 꼭지각일 때 밑각
  // a가 밑각이면 나머지 두 각은 a(다른 밑각)와 asBase이므로 a도 후보다
  const answer = Math.max(a, asBase, asTop);
  const mistakes: Record<string, string> = {};
  if (asTop !== answer) mistakes[asTop] = `${a}°가 밑각인 경우를 빠뜨렸어요.`;
  if (Math.max(asBase, asTop) !== answer) mistakes[Math.max(asBase, asTop)] = `${a}°가 밑각이면 다른 밑각도 ${a}°예요.`;
  return {
    key: `${a}`,
    prompt: `이등변삼각형의 한 각이 ${a}°입니다. 이 삼각형의 나머지 두 각 중 한 각이 될 수 있는 크기를 모두 생각할 때, 가장 큰 각도는 몇 도인가요?`,
    answer,
    unit: "°",
    hint: `${a}°가 밑각인 경우와 두 변 사이의 각(꼭지각)인 경우를 모두 생각해요.`,
    explanation: `밑각이면 나머지 ${a}°, ${asBase}° / 꼭지각이면 나머지 ${asTop}°, ${asTop}° → 가장 큰 것 ${answer}°`,
    mistakes,
  };
});

export const l4IsoAngleDiff = word("l4-iso-angle-diff", (rand) => {
  // 같은 두 각 b, 나머지 한 각 t = b ± d. 3b ± d = 180이 되도록 d는 15의 배수
  const more = rand() < 0.6;
  const d = more ? randInt(rand, 1, 6) * 15 : randInt(rand, 1, 3) * 15;
  const b = more ? (180 - d) / 3 : (180 + d) / 3;
  const t = more ? b + d : b - d;
  const askTop = rand() < 0.5;
  const answer = askTop ? t : b;
  const step1 = more ? `180° − ${d}° = ${180 - d}°` : `180° + ${d}° = ${180 + d}°`;
  return {
    key: `${more}:${d}:${askTop}`,
    prompt: `이등변삼각형의 세 각 중 두 각은 크기가 같고, 나머지 한 각은 크기가 같은 두 각 중 한 각보다 ${d}° 더 ${more ? "큽니다" : "작습니다"}. ${askTop ? "나머지 한 각" : "크기가 같은 두 각 중 한 각"}은 몇 도인가요?`,
    answer,
    unit: "°",
    hint: `나머지 한 각에서 ${d}°를 ${more ? "빼면" : "더하면"} 세 각의 크기가 모두 같아져요. 세 각의 합은 180°예요.`,
    explanation: `${step1}, ${more ? 180 - d : 180 + d}° ÷ 3 = ${b}° → 같은 두 각은 ${b}°, 나머지 한 각은 ${b}° ${more ? "+" : "−"} ${d}° = ${t}°`,
    mistakes: { [askTop ? b : t]: askTop ? "크기가 같은 두 각 중 한 각을 답했어요." : "나머지 한 각을 답했어요." },
  };
});

export const l4EquiWire = mid("l4-equi-wire", (rand) => {
  const a = randInt(rand, 3, 12);
  const n = randInt(rand, 2, 6);
  const r = randInt(rand, 1, 3 * a - 1);
  const total = 3 * a * n + r;
  return {
    key: `${a}:${total}`,
    prompt: `철사 ${total} cm로 한 변이 ${a} cm인 정삼각형을 만들려고 합니다. 정삼각형을 몇 개까지 만들 수 있고, 철사는 몇 cm 남나요?`,
    answer: `${n},${r}`,
    unit: ["개", "cm"],
    hint: `정삼각형 한 개에 철사 ${a} × 3 = ${3 * a} cm가 필요해요.`,
    explanation: `${total} ÷ ${3 * a} = ${n} … ${r}`,
  };
});

export const l4EquiVsSquare = mid("l4-equi-vs-square", (rand) => {
  const k = randInt(rand, 2, 9);
  const reverse = rand() < 0.5;
  return {
    key: `${k}:${reverse}`,
    prompt: reverse
      ? `정삼각형의 세 변의 길이의 합이 한 변이 ${3 * k} cm인 정사각형의 네 변의 길이의 합과 같습니다. 정삼각형의 한 변은 몇 cm인가요?`
      : `정사각형의 네 변의 길이의 합이 한 변이 ${4 * k} cm인 정삼각형의 세 변의 길이의 합과 같습니다. 정사각형의 한 변은 몇 cm인가요?`,
    answer: reverse ? 4 * k : 3 * k,
    unit: "cm",
    hint: "먼저 주어진 도형의 둘레를 구해요.",
    explanation: reverse ? `${3 * k} × 4 = ${12 * k}, ${12 * k} ÷ 3 = ${4 * k}(cm)` : `${4 * k} × 3 = ${12 * k}, ${12 * k} ÷ 4 = ${3 * k}(cm)`,
  };
});

export const l4EquiWho = word("l4-equi-who", (rand) => {
  const [p, q] = names(rand);
  const a = randInt(rand, 5, 15);
  const b = randInt(rand, 5, 15);
  const c = randInt(rand, 3, 2 * b - 1);
  const pa = 3 * a;
  const pb = 2 * b + c;
  // 나머지 한 변도 같으면 정삼각형이므로 뺀다
  if (pa === pb || c === b) return null;
  const winner = pa > pb ? p : q;
  const diff = Math.abs(pa - pb);
  const r = markChoice(rand, `${winner}, ${diff} cm`, [`${winner === p ? q : p}, ${diff} cm`, `${winner}, ${diff + a} cm`, `${winner}, ${Math.abs(a - b) === diff ? diff + 1 : Math.abs(a - b)} cm`]);
  return {
    key: `${a}:${b}:${c}:${r.answer}`,
    prompt: `${p}는 한 변이 ${a} cm인 정삼각형을, ${q}는 길이가 같은 두 변이 ${b} cm, 나머지 한 변이 ${c} cm인 이등변삼각형을 그렸습니다. 누가 그린 삼각형의 세 변의 길이의 합이 몇 cm 더 긴가요?`,
    visual: r.visual,
    answer: r.answer,
    choices: r.choices,
    hint: "두 삼각형의 세 변의 길이의 합을 각각 구해 비교해요.",
    explanation: `${p}: ${pa} cm, ${q}: ${pb} cm → ${winner}의 삼각형이 ${diff} cm 더 길어요.`,
  };
});

export const l4TriAcuteBox = word("l4-tri-acute-box", (rand) => {
  const a = randInt(rand, 2, 8) * 10;
  // 두 각 a, □ (자연수) → 예각삼각형: □ < 90, 180 − a − □ < 90 → 90 − a < □ < 90
  return {
    key: `${a}`,
    prompt: `삼각형의 두 각이 ${a}°, □°입니다. 이 삼각형이 예각삼각형이 되도록 □ 안에 들어갈 수 있는 자연수는 모두 몇 개인가요?`,
    answer: a - 1,
    unit: "개",
    hint: `□°도 90°보다 작아야 하고, 나머지 한 각(180° − ${a}° − □°)도 90°보다 작아야 해요.`,
    explanation: `${90 - a} < □ < 90 → □는 ${91 - a}부터 89까지 ${a - 1}개`,
    mistakes: { [a + 1]: "90°나 직각이 되는 경우까지 넣었어요." },
  };
});

export const l4TriKindError = word("l4-tri-kind-error", (rand) => {
  const [p] = names(rand, 1);
  const a = randInt(rand, 4, 9) * 5;
  const b = randInt(rand, 4, 17 - a / 5) * 5;
  const c = 180 - a - b; // 95 이상 → 둔각
  const r = markChoice(rand, `나머지 한 각이 ${c}°인 둔각이므로 둔각삼각형입니다.`, [
    "두 각이 예각이므로 예각삼각형이 맞습니다.",
    `나머지 한 각이 ${c - 90}°이므로 예각삼각형입니다.`,
    "세 각 중 두 각이 예각이므로 직각삼각형입니다.",
  ]);
  return {
    key: `${a}:${b}:${r.answer}`,
    prompt: `${p}는 두 각이 ${a}°, ${b}°인 삼각형을 보고 '두 각이 모두 예각이니까 예각삼각형이야.'라고 말했습니다. ${p}의 말을 바르게 고친 것을 고르세요.`,
    visual: r.visual,
    answer: r.answer,
    choices: r.choices,
    hint: "나머지 한 각을 구해 보세요. 예각삼각형은 세 각이 모두 예각이에요.",
    explanation: `180° − ${a}° − ${b}° = ${c}° → 둔각삼각형`,
  };
});

const SIDE_K = ["이등변삼각형", "세 변의 길이가 모두 다른 삼각형"];
const ANGLE_K = ["예각삼각형", "직각삼각형", "둔각삼각형"];

/** 세 변 길이로 각 A(변 a의 맞은편)를 구한다(코사인 법칙) */
const angleFrom = (a: number, b: number, c: number) => (Math.acos((b * b + c * c - a * a) / (2 * b * c)) * 180) / Math.PI;

/** 적힌 세 변(자연수 cm)이 삼각형을 이루고, 그 길이로 만든 삼각형의 각이 적힌 각과 1.5° 안에서 맞는지 */
export function lengthsFitAngles([a, b, c]: number[], [A, B, C]: number[]): boolean {
  const [x, y, z] = [a, b, c].sort((p, q) => p - q);
  if (x + y <= z) return false;
  return [angleFrom(a, b, c) - A, angleFrom(b, c, a) - B, angleFrom(c, a, b) - C].every((d) => Math.abs(d) <= 1.5);
}

/**
 * 세 각 [A, B, C](A는 위, B는 왼쪽 아래, C는 오른쪽 아래)인 삼각형 그림과 세 변의 길이(cm, 자연수).
 * 길이는 반올림해도 삼각형이 되고 적힌 각과 맞는 크기만 쓰며, 글자가 겹치면 null
 */
export function triangleScene(rand: () => number, [A, B, C]: [number, number, number], label: string) {
  const rad = (d: number) => (d * Math.PI) / 180;
  // 밑변 BC = 1로 두고 사인 법칙으로 나머지 두 변
  const b = Math.sin(rad(B)) / Math.sin(rad(A));
  const c = Math.sin(rad(C)) / Math.sin(rad(A));
  const fits = shuffle(rand, Array.from({ length: 15 }, (_, i) => i + 6))
    .map((longest) => {
      const unit = Math.max(1, b, c) / longest;
      return { a: Math.round(1 / unit), b: Math.round(b / unit), c: Math.round(c / unit) };
    })
    .filter((l) => Math.min(l.a, l.b, l.c) >= 2 && lengthsFitAngles([l.a, l.b, l.c], [A, B, C]));
  if (fits.length === 0) return null;
  const len = fits[0];
  const raw: Pt[] = [[c * Math.cos(rad(B)), c * Math.sin(rad(B))], [0, 0], [1, 0]];
  const xs = raw.map((q) => q[0]);
  const ys = raw.map((q) => q[1]);
  const W = 280;
  const H = 190;
  const M = 40;
  const k = Math.min((W - 2 * M) / (Math.max(...xs) - Math.min(...xs)), (H - 2 * M) / (Math.max(...ys) - Math.min(...ys)));
  const ox = (W - k * (Math.max(...xs) - Math.min(...xs))) / 2 - k * Math.min(...xs);
  const pts = raw.map(([x, y]): Pt => [Math.round(ox + k * x), Math.round(H - M - k * y)]);
  const g: Pt = [(pts[0][0] + pts[1][0] + pts[2][0]) / 3, (pts[0][1] + pts[1][1] + pts[2][1]) / 3];
  const away = (q: Pt, from: Pt, dist: number): Pt => {
    const dx = q[0] - from[0];
    const dy = q[1] - from[1];
    const d = Math.hypot(dx, dy) || 1;
    return [Math.round(q[0] + (dx / d) * dist), Math.round(q[1] + (dy / d) * dist)];
  };
  const mid = (p: Pt, q: Pt): Pt => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const angles = [A, B, C];
  const scene: ShapeScene = {
    kind: "shape",
    width: W,
    height: H,
    label,
    polygons: [{ points: pts }],
    texts: [
      { at: away(mid(pts[1], pts[2]), g, 16), text: `${len.a} cm` },
      { at: away(mid(pts[0], pts[2]), g, 22), text: `${len.b} cm` },
      { at: away(mid(pts[0], pts[1]), g, 22), text: `${len.c} cm` },
    ],
  };
  // 각도 글자는 꼭짓점 안쪽 이등분선을 따라 변에 닿지 않는 가장 가까운 자리에(어느 각인지 헷갈리지 않게 가까운 변 길이의 45% 안)
  for (const [i, q] of pts.entries()) {
    const [p1, p2] = [pts[(i + 2) % 3], pts[(i + 1) % 3]];
    const reach = 0.45 * Math.min(Math.hypot(p1[0] - q[0], p1[1] - q[1]), Math.hypot(p2[0] - q[0], p2[1] - q[1]));
    const at = findTextSpot(scene, `${angles[i]}°`, bisectorSpots(q, p1, p2, 12, reach));
    if (!at) return null;
    scene.texts!.push({ at, text: `${angles[i]}°` });
  }
  if (textsClash(scene)) return null;
  return { scene, len };
}

/** 변의 길이 기준(이등변·세 변이 다름) × 각의 크기 기준(예각·직각·둔각)에 맞는 세 각 [위, 왼쪽 아래, 오른쪽 아래] */
function triangleAngles(rand: () => number, isosceles: boolean, g: string): [number, number, number] | null {
  if (isosceles) {
    const base = g === "예각삼각형" ? pick(rand, [50, 55, 65, 70, 75]) : g === "직각삼각형" ? 45 : pick(rand, [20, 25, 30, 35, 40]);
    return [180 - 2 * base, base, base];
  }
  const big = g === "예각삼각형" ? randInt(rand, 13, 17) * 5 : g === "직각삼각형" ? 90 : randInt(rand, 19, 25) * 5;
  const other = randInt(rand, 5, Math.floor((180 - big) / 5) - 5) * 5;
  const third = 180 - big - other;
  const three = [big, other, third];
  if (new Set(three).size < 3 || Math.min(...three) < 25 || Math.max(other, third) >= big) return null;
  // 가장 큰 각을 위에 두어 위 꼭짓점이 뾰족해 글자가 몰리지 않게
  const [l, r] = shuffle(rand, [other, third]);
  return [big, l, r];
}

export const l4TriBothName = easy("l4-tri-both-name", (rand) => {
  const s = pick(rand, SIDE_K);
  const g = pick(rand, ANGLE_K);
  // 분류(정답)는 먼저 정하고, 그림이 조건에 맞을 때까지 각만 다시 뽑는다(정답이 한쪽으로 쏠리지 않게)
  let found: { angles: [number, number, number]; scene: ShapeScene; lens: number[] } | null = null;
  for (let i = 0; !found && i < 40; i++) {
    const angles = triangleAngles(rand, s === SIDE_K[0], g);
    const fig = angles && triangleScene(rand, angles, "세 각의 크기와 세 변의 길이가 적힌 삼각형");
    if (!angles || !fig) continue;
    const lens = [fig.len.a, fig.len.b, fig.len.c];
    // 그림의 길이가 분류와 맞아야 한다: 이등변이면 두 변만 같고, 아니면 세 변이 모두 다르다
    if (new Set(lens).size === (s === SIDE_K[0] ? 2 : 3)) found = { angles, scene: fig.scene, lens };
  }
  if (!found) return null;
  const { angles, scene, lens } = found;
  const answer = `${s}이면서 ${g}`;
  const all = SIDE_K.flatMap((x) => ANGLE_K.map((y) => `${x}이면서 ${y}`));
  return {
    key: `${angles.join()}:${lens.join()}`,
    prompt: "삼각형을 변의 길이와 각의 크기에 따라 분류하려고 합니다. 그림의 삼각형의 이름으로 알맞은 것을 고르세요.",
    visual: scene,
    answer,
    choices: opts(rand, answer, shuffle(rand, all.filter((x) => x !== answer)), () => "정삼각형이면서 예각삼각형"),
    hint: "변의 길이와 각의 크기, 두 가지 기준으로 나누어 생각해요.",
    explanation: `세 변 ${lens.join(" cm, ")} cm → ${s}, 세 각 ${angles.join("°, ")}° → ${g}`,
  };
});

export const l4TriImpossible = mid("l4-tri-impossible", (rand) => {
  const impossible = ["정삼각형이면서 둔각삼각형", "정삼각형이면서 직각삼각형", "직각이 두 개인 삼각형", "둔각이 두 개인 삼각형"];
  const possible = ["이등변삼각형이면서 직각삼각형", "이등변삼각형이면서 둔각삼각형", "이등변삼각형이면서 예각삼각형", "세 변의 길이가 모두 다른 삼각형이면서 둔각삼각형", "세 변의 길이가 모두 다른 삼각형이면서 직각삼각형", "정삼각형이면서 예각삼각형"];
  const ans = pick(rand, impossible);
  const choices = shuffle(rand, [ans, ...shuffle(rand, possible).slice(0, 3)]);
  return {
    key: choices.join("|"),
    prompt: "그릴 수 없는 삼각형을 고르세요.",
    answer: ans,
    choices,
    hint: "정삼각형의 세 각은 모두 60°예요. 삼각형의 세 각의 합은 180°예요.",
    explanation: `${josa(ans, "은/는")} 그릴 수 없습니다.`,
  };
});

export const l4TriCountBig = word("l4-tri-count-big", (rand) => {
  const n = randInt(rand, 2, 4);
  // 한 변을 n등분한 큰 정삼각형 안의 크고 작은 정삼각형 수
  const counts: Record<number, number> = { 2: 5, 3: 13, 4: 27 };
  const small = n * n;
  const ask = rand() < 0.4 ? "small" : "all";
  const ans = ask === "small" ? small : counts[n];
  const s = 150 / n;
  const lines: NonNullable<ShapeScene["lines"]> = [];
  const P = (i: number, j: number): Pt => [Math.round(20 + j * s + (i * s) / 2), Math.round(160 - i * s * 0.866)];
  for (let i = 0; i < n; i++) {
    lines.push({ from: P(i, 0), to: P(i, n - i) });
    lines.push({ from: P(0, i), to: P(n - i, i) });
    lines.push({ from: P(0, i + 1), to: P(i + 1, 0) });
  }
  return {
    key: `${n}:${ask}`,
    prompt: ask === "small"
      ? `큰 정삼각형의 각 변을 ${n}등분하여 그림과 같이 선을 그었습니다. 가장 작은 정삼각형은 모두 몇 개인가요?`
      : `큰 정삼각형의 각 변을 ${n}등분하여 그림과 같이 선을 그었습니다. 그림에서 찾을 수 있는 크고 작은 정삼각형은 모두 몇 개인가요?`,
    visual: { kind: "shape", width: 190, height: 175, label: `변을 ${n}등분한 정삼각형`, lines },
    answer: ans,
    unit: "개",
    hint: "작은 삼각형 1개짜리, 4개짜리, 9개짜리… 크기별로 나누어 세어요. 거꾸로 선 삼각형도 잊지 마세요.",
    explanation: ask === "small" ? `${n} × ${n} = ${small}(개)` : `크기별로 세면 모두 ${ans}개`,
  };
});

/* ── 4-2 사각형(그림 문제는 g4-quad.ts) ── */

export const l4ParDistBack = word("l4-par-dist-back", (rand) => {
  const x = randInt(rand, 2, 9);
  const k = randInt(rand, 2, 4);
  return {
    key: `${x}:${k}`,
    prompt: `서로 평행한 직선 가, 나, 다가 차례로 있습니다. 가와 다 사이의 거리는 ${x * (k + 1)} cm이고, 가와 나 사이의 거리는 나와 다 사이의 거리의 ${k}배입니다. 나와 다 사이의 거리는 몇 cm인가요?`,
    answer: x,
    unit: "cm",
    hint: `나와 다 사이의 거리를 1로 보면 가와 다 사이는 ${josa(k + 1, "이에요/예요")}.`,
    explanation: `${x * (k + 1)} ÷ ${k + 1} = ${x}(cm)`,
    mistakes: { [x * k]: "가와 나 사이의 거리를 답했어요." },
  };
});

export const l4TrapWire = word("l4-trap-wire", (rand) => {
  const top = randInt(rand, 4, 12);
  const bottom = top * 2;
  const leg = randInt(rand, 5, 15);
  const wire = randInt(rand, Math.ceil((top + bottom + leg * 2) / 10) + 1, 12) * 10;
  const used = top + bottom + leg * 2;
  return {
    key: `${top}:${leg}:${wire}`,
    prompt: `철사 ${wire} cm로 사다리꼴 모양을 만들었습니다. 평행한 두 변 중 짧은 변은 ${top} cm, 긴 변은 짧은 변의 2배이고, 나머지 두 변은 각각 ${leg} cm입니다. 사다리꼴을 만들고 남은 철사는 몇 cm인가요?`,
    answer: wire - used,
    unit: "cm",
    hint: "먼저 긴 변의 길이를 구하고, 네 변의 길이를 모두 더해요.",
    explanation: `긴 변 ${bottom} cm, 네 변의 합 ${top} + ${bottom} + ${leg} + ${leg} = ${used}, ${wire} − ${used} = ${wire - used}(cm)`,
  };
});

const QUAD_TRUE: Record<string, string[]> = {
  여러: ["정사각형은 직사각형입니다.", "직사각형은 평행사변형입니다.", "정사각형은 마름모입니다.", "마름모는 사다리꼴입니다."],
};
const QUAD_FALSE: Record<string, string[]> = {
  여러: ["직사각형은 마름모입니다.", "사다리꼴은 평행사변형입니다.", "마름모는 직사각형입니다.", "평행사변형은 정사각형입니다."],
};

const quadStatement = (id: string, topic: keyof typeof QUAD_TRUE) =>
  word(id, (rand) => {
    const ns = names(rand, 4);
    const wrong = pick(rand, QUAD_FALSE[topic]);
    const rights = shuffle(rand, [...new Set([...QUAD_TRUE[topic], ...QUAD_TRUE.여러])]).slice(0, 3);
    const says = shuffle(rand, [wrong, ...rights]);
    const who = ns[says.indexOf(wrong)];
    return {
      key: `${topic}:${says.join("|")}:${ns.join()}`,
      prompt: `사각형에 대해 친구들이 말했습니다. 잘못 말한 친구를 고르세요.`,
      visual: { kind: "table", header: ["이름", "한 말"], rows: says.map((s, i) => [ns[i], s]) },
      answer: who,
      choices: ns,
      hint: "사각형의 이름은 조건을 만족하면 여러 개가 될 수 있어요. 반대로는 성립하지 않을 수 있어요.",
      explanation: `${who}: '${wrong}'는 항상 옳지는 않아요.`,
    };
  });

export const l4QuadStatement = quadStatement("l4-quad-statement", "여러");

export const l4ParaJoin = word("l4-para-join", (rand) => {
  // 문장이 '긴 변', '짧은 변'이라고 하므로 a > b
  const a = randInt(rand, 5, 12);
  const b = randInt(rand, 3, a - 1);
  const n = randInt(rand, 2, 6);
  return {
    key: `${a}:${b}:${n}`,
    prompt: `긴 변이 ${a} cm, 짧은 변이 ${b} cm인 똑같은 평행사변형 ${n}개를 짧은 변끼리 꼭 맞게 한 줄로 이어 붙여 큰 평행사변형을 만들었습니다. 큰 평행사변형의 네 변의 길이의 합은 몇 cm인가요?`,
    answer: 2 * (n * a + b),
    unit: "cm",
    hint: `이어 붙인 쪽의 변은 ${a} cm가 ${n}개 이어져요. 붙은 짧은 변은 둘레가 아니에요.`,
    explanation: `긴 변 쪽 ${a} × ${n} = ${a * n}(cm), 짧은 변 쪽 ${b} cm → ${a * n} + ${b} + ${a * n} + ${b} = ${2 * (n * a + b)}(cm)`,
    mistakes: { [n * 2 * (a + b)]: "붙은 변까지 모두 더했어요." },
  };
});

export const l4RhombusSide = easy("l4-rhombus-side", (rand) => {
  const a = randInt(rand, 3, 25);
  return {
    key: `${a}`,
    prompt: `네 변의 길이의 합이 ${4 * a} cm인 마름모가 있습니다. 마름모의 한 변은 몇 cm인가요?`,
    answer: a,
    unit: "cm",
    hint: "마름모는 네 변의 길이가 모두 같아요.",
    explanation: `${4 * a} ÷ 4 = ${a}(cm)`,
    mistakes: { [2 * a]: "2로 나누었어요. 변이 4개예요." },
  };
});

export const l4RhombusVsTri = word("l4-rhombus-vs-tri", (rand) => {
  const k = randInt(rand, 2, 8);
  const a = 3 * k;
  return {
    key: `${k}`,
    prompt: `한 변이 ${a} cm인 마름모 모양 틀을 만든 철사를 펴서, 남김없이 모두 사용하여 정삼각형 모양 틀을 만들었습니다. 정삼각형의 한 변은 몇 cm인가요?`,
    answer: 4 * k,
    unit: "cm",
    hint: "먼저 마름모를 만든 철사의 길이(네 변의 합)를 구해요.",
    explanation: `${a} × 4 = ${4 * a}, ${4 * a} ÷ 3 = ${4 * k}(cm)`,
  };
});

export const l4RhombusAngleDiff = word("l4-rhombus-angle-diff", (rand) => {
  // 10° 단위라야 반으로 나눈 각도 5의 배수
  const d = randInt(rand, 1, 14) * 10;
  const big = (180 + d) / 2;
  return {
    key: `${d}`,
    prompt: `마름모에서 이웃한 두 각 중 한 각이 다른 한 각보다 ${d}° 더 큽니다. 큰 각은 몇 도인가요?`,
    answer: big,
    unit: "°",
    hint: `이웃한 두 각의 합은 180°예요. 큰 각에서 ${d}°를 빼면 두 각이 같아져요.`,
    explanation: `180° − ${d}° = ${180 - d}°, 작은 각 ${180 - d}° ÷ 2 = ${180 - big}°, 큰 각 ${180 - big}° + ${d}° = ${big}°`,
    mistakes: { [180 - big]: "작은 각을 답했어요." },
  };
});

/* ── 4-2 다각형 ── */

const POLY = ["", "", "", "삼각형", "사각형", "오각형", "육각형", "칠각형", "팔각형", "구각형", "십각형"];

/** 한 칸(가로 90) 가운데 (cx, cy)에 그리는 도형 조각 */
type Piece = Pick<ShapeScene, "polygons" | "lines" | "circles" | "arcs">;
const regular = (cx: number, cy: number, n: number, r: number): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const t = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return [Math.round(cx + r * Math.cos(t)), Math.round(cy + r * Math.sin(t))];
  });

const POLYGON_PIECES: ((cx: number, cy: number) => Piece)[] = [
  (cx, cy) => ({ polygons: [{ points: [[cx - 4, cy - 30], [cx + 32, cy + 26], [cx - 30, cy + 22]] }] }),
  (cx, cy) => ({ polygons: [{ points: [[cx - 30, cy - 20], [cx + 24, cy - 28], [cx + 32, cy + 24], [cx - 24, cy + 26]] }] }),
  (cx, cy) => ({ polygons: [{ points: regular(cx, cy, 5, 31) }] }),
  (cx, cy) => ({ polygons: [{ points: regular(cx, cy, 6, 31) }] }),
];

const NOT_POLYGON_PIECES: { why: string; draw: (cx: number, cy: number) => Piece }[] = [
  { why: "곡선으로 둘러싸여 있어요", draw: (cx, cy) => ({ circles: [{ c: [cx, cy], r: 30 }] }) },
  {
    why: "곡선이 있어요",
    draw: (cx, cy) => ({ arcs: [{ c: [cx, cy + 14], r: 32, from: 0, to: 180, width: 2 }], lines: [{ from: [cx - 32, cy + 14], to: [cx + 32, cy + 14] }] }),
  },
  {
    why: "한쪽이 열려 있어 선분으로 완전히 둘러싸여 있지 않아요",
    draw: (cx, cy) => ({
      lines: [
        { from: [cx - 28, cy - 26], to: [cx + 28, cy - 26] },
        { from: [cx + 28, cy - 26], to: [cx + 28, cy + 26] },
        { from: [cx + 28, cy + 26], to: [cx - 28, cy + 26] },
        { from: [cx - 28, cy + 26], to: [cx - 28, cy + 2] },
      ],
    }),
  },
  {
    why: "곡선이 있어요",
    draw: (cx, cy) => ({
      arcs: [{ c: [cx, cy - 8], r: 28, from: 0, to: 180, width: 2 }],
      lines: [
        { from: [cx - 28, cy - 8], to: [cx - 28, cy + 28] },
        { from: [cx - 28, cy + 28], to: [cx + 28, cy + 28] },
        { from: [cx + 28, cy + 28], to: [cx + 28, cy - 8] },
      ],
    }),
  },
];

export const l4PolyNot = mid("l4-poly-not", (rand) => {
  const not = pick(rand, NOT_POLYGON_PIECES);
  const yes = shuffle(rand, POLYGON_PIECES).slice(0, 3);
  const slot = randInt(rand, 0, 3);
  const pieces = [...yes.slice(0, slot).map((f) => ({ draw: f, bad: false })), { draw: not.draw, bad: true }, ...yes.slice(slot).map((f) => ({ draw: f, bad: false }))];
  const scene: ShapeScene = { kind: "shape", width: 360, height: 120, label: "도형 ①~④", polygons: [], lines: [], circles: [], arcs: [], texts: [] };
  pieces.forEach((p, i) => {
    const cx = 45 + 90 * i;
    const d = p.draw(cx, 52);
    scene.polygons!.push(...(d.polygons ?? []));
    scene.lines!.push(...(d.lines ?? []));
    scene.circles!.push(...(d.circles ?? []));
    scene.arcs!.push(...(d.arcs ?? []));
    scene.texts!.push({ at: [cx, 106], text: MARKS[i] });
  });
  return {
    key: `${NOT_POLYGON_PIECES.indexOf(not)}:${slot}:${yes.map((f) => POLYGON_PIECES.indexOf(f)).join()}`,
    prompt: "다각형이 아닌 것을 고르세요.",
    visual: scene,
    answer: MARKS[slot],
    choices: MARKS,
    hint: "다각형은 선분으로만 둘러싸인 도형이에요.",
    explanation: `${MARKS[slot]} 도형은 ${not.why}. 그래서 다각형이 아닙니다.`,
  };
});

export const l4PolySticks = word("l4-poly-sticks", (rand) => {
  const n1 = pick(rand, [3, 4, 5]);
  const k1 = randInt(rand, 2, 6);
  const n2 = pick(rand, [6, 7, 8].filter((x) => x !== n1));
  const k2 = randInt(rand, 1, 4);
  const r = randInt(rand, 0, n2 - 1);
  const total = n1 * k1 + n2 * k2 + r;
  return {
    key: `${n1}:${k1}:${n2}:${total}`,
    prompt: `길이가 같은 막대 ${total}개가 있습니다. 이 막대로 ${POLY[n1]}을 ${k1}개 만들고, 남은 막대로 ${POLY[n2]}을 만들려고 합니다. ${POLY[n2]}은 몇 개까지 만들 수 있나요? (막대 하나가 변 하나입니다.)`,
    answer: k2,
    unit: "개",
    hint: `먼저 ${POLY[n1]} ${k1}개에 쓴 막대 수를 구해요.`,
    explanation: `${n1} × ${k1} = ${n1 * k1}, ${total} − ${n1 * k1} = ${total - n1 * k1}, ${total - n1 * k1} ÷ ${n2} = ${k2} … ${r}`,
  };
});

export const l4PolyCond = word("l4-poly-cond", (rand) => {
  const n = randInt(rand, 5, 10);
  // 대각선은 다음 차시에 배우므로 변과 꼭짓점만
  const kind = "변과 꼭짓점";
  const s = 2 * n;
  const answer = POLY[n];
  return {
    key: `${n}:${kind}`,
    prompt: `어떤 다각형의 ${kind}의 수를 모두 더했더니 ${s}개였습니다. 이 다각형의 이름을 고르세요.`,
    answer,
    choices: opts(rand, answer, [POLY[n - 1], POLY[n + 1] ?? POLY[n - 2], POLY[n - 2]], () => POLY[randInt(rand, 3, 10)]),
    hint: "□각형은 변과 꼭짓점이 각각 □개예요.",
    explanation: `${n} + ${n} = ${s} → ${answer}`,
  };
});

export const l4RegularWire = word("l4-regular-wire", (rand) => {
  const n1 = pick(rand, [4, 5, 6, 8]);
  const a = randInt(rand, 3, 10);
  const n2 = pick(rand, [3, 4, 5, 6].filter((x) => x !== n1));
  const b = randInt(rand, 2, 10);
  const total = n1 * a + n2 * b;
  return {
    key: `${n1}:${a}:${n2}:${b}`,
    prompt: `철사 ${total} cm를 모두 사용하여 한 변이 ${a} cm인 정${POLY[n1]} 한 개와 정${POLY[n2]} 한 개를 만들었습니다. 정${POLY[n2]}의 한 변은 몇 cm인가요?`,
    answer: b,
    unit: "cm",
    hint: `먼저 정${POLY[n1]}에 쓴 철사의 길이를 구해요.`,
    explanation: `${a} × ${n1} = ${a * n1}, ${total} − ${a * n1} = ${n2 * b}, ${n2 * b} ÷ ${n2} = ${b}(cm)`,
  };
});

export const l4DiagProps = mid("l4-diag-props", (rand) => {
  const q = pick(rand, [
    { q: "두 대각선의 길이가 항상 같은", yes: ["직사각형", "정사각형"], no: ["마름모", "평행사변형", "사다리꼴"] },
    { q: "두 대각선이 항상 서로 수직으로 만나는", yes: ["마름모", "정사각형"], no: ["직사각형", "평행사변형", "사다리꼴"] },
    { q: "한 대각선이 다른 대각선을 항상 똑같이 둘로 나누는", yes: ["평행사변형", "마름모", "직사각형", "정사각형"], no: ["사다리꼴"] },
  ]);
  const wantYes = q.no.length >= 3 ? rand() < 0.5 : false;
  const ans = pick(rand, wantYes ? q.yes : q.no);
  const others = shuffle(rand, wantYes ? q.no : q.yes).slice(0, 3);
  if (others.length < 3) return null;
  return {
    key: `${q.q}:${wantYes}:${ans}:${others.join()}`,
    prompt: `${q.q} 사각형${wantYes ? "을" : "이 아닌 것을"} 고르세요.`,
    answer: ans,
    choices: shuffle(rand, [ans, ...others]),
    hint: "사각형에 대각선을 그어 길이를 재 보거나 만나는 각을 살펴보세요.",
    explanation: `${q.q} 사각형: ${q.yes.join(", ")}`,
  };
});

const TILE_ANGLE: Record<string, number> = { 정삼각형: 60, 정사각형: 90, 정육각형: 120 };

export const l4TileAngle = mid("l4-tile-angle", (rand) => {
  // 한 가지 조각만 모으거나, 두 가지 조각을 섞어 한 꼭짓점을 채운다
  const t = pick(rand, [
    { given: [] as [string, number][], ask: "정삼각형" },
    { given: [] as [string, number][], ask: "정사각형" },
    { given: [] as [string, number][], ask: "정육각형" },
    { given: [["정육각형", 1]] as [string, number][], ask: "정삼각형" },
    { given: [["정육각형", 2]] as [string, number][], ask: "정삼각형" },
    { given: [["정사각형", 2]] as [string, number][], ask: "정삼각형" },
    { given: [["정삼각형", 2]] as [string, number][], ask: "정육각형" },
  ]);
  const used = t.given.reduce((sum, [nm, k]) => sum + TILE_ANGLE[nm] * k, 0);
  const answer = (360 - used) / TILE_ANGLE[t.ask];
  const givenText = t.given.map(([nm, k]) => `${nm} 조각 ${k}개`).join(", ");
  return {
    key: `${givenText}:${t.ask}`,
    prompt: givenText
      ? `한 꼭짓점에 ${givenText}를 모은 다음, 남은 부분을 ${t.ask} 조각으로 빈틈없이 겹치지 않게 채우려고 합니다. ${t.ask} 조각은 몇 개 필요한가요?`
      : `${t.ask} 모양 조각만 사용하여 한 꼭짓점에 빈틈없이 겹치지 않게 모으려고 합니다. 한 꼭짓점에 조각을 몇 개 모아야 하나요?`,
    answer,
    unit: "개",
    hint: "한 점을 빙 둘러싼 각은 360°예요. 정삼각형의 한 각은 60°, 정사각형은 90°, 정육각형은 120°예요.",
    explanation: givenText
      ? `모은 각 ${t.given.map(([nm, k]) => `${TILE_ANGLE[nm]}° × ${k}`).join(" + ")} = ${used}°, 360° − ${used}° = ${360 - used}°, ${360 - used}° ÷ ${TILE_ANGLE[t.ask]}° = ${answer}(개)`
      : `360° ÷ ${TILE_ANGLE[t.ask]}° = ${answer}(개)`,
  };
});
