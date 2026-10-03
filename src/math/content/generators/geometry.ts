import type { Generator, Level, ShapeScene } from "../types";
import { makeChoices, pick, randInt, shuffle } from "../../lib/random";
import { numberProblem } from "./common";
import { josa } from "../josa";

type Pt = [number, number];

/** 정n각형 꼭짓점 */
function regularPolygon(n: number, cx: number, cy: number, r: number): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * i) / n - Math.PI / 2;
    return [Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a))];
  });
}

/* ── 4-1 평면도형의 이동 ── */

type Cells = Pt[];

/** 좌우 대칭·상하 대칭·회전 대칭이 없는 조각들 */
const PIECES: Cells[] = [
  [[0, 0], [0, 1], [0, 2], [1, 2]],
  [[0, 0], [1, 0], [1, 1], [2, 1], [1, 2]],
  [[0, 0], [1, 0], [2, 0], [0, 1], [0, 2], [1, 2]],
  [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]],
];

const normalize = (cells: Cells): Cells => {
  const mx = Math.min(...cells.map((c) => c[0]));
  const my = Math.min(...cells.map((c) => c[1]));
  return cells.map(([x, y]) => [x - mx, y - my] as Pt).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
};
const sig = (cells: Cells) => JSON.stringify(normalize(cells));

/** 문제 문장에 쓰는 '~었을 때' 꼴 */
const DONE: Record<string, string> = {
  // 보기는 처음 도형 아래 줄에 있어 방향을 적으면 그림 위치와 어긋난다(① = 처음 바로 아래). 밀기는 방향과 상관없이 모양이 같다
  밀기: "밀었을",
  "오른쪽으로 뒤집기": "오른쪽으로 뒤집었을",
  "아래쪽으로 뒤집기": "아래쪽으로 뒤집었을",
  "시계 방향으로 90° 돌리기": "시계 방향으로 90°만큼 돌렸을",
  "시계 방향으로 180° 돌리기": "시계 방향으로 180°만큼 돌렸을",
  "시계 반대 방향으로 90° 돌리기": "시계 반대 방향으로 90°만큼 돌렸을",
  "왼쪽으로 뒤집기": "왼쪽으로 뒤집었을",
  "위쪽으로 뒤집기": "위쪽으로 뒤집었을",
  "오른쪽으로 두 번 뒤집기": "오른쪽으로 두 번 뒤집었을",
  "시계 방향으로 90°씩 두 번 돌리기": "시계 방향으로 90°만큼 두 번 돌렸을",
  "오른쪽으로 뒤집고 시계 방향으로 180° 돌리기": "오른쪽으로 뒤집은 다음 시계 방향으로 180°만큼 돌렸을",
  "아래쪽으로 뒤집고 시계 방향으로 90° 돌리기": "아래쪽으로 뒤집은 다음 시계 방향으로 90°만큼 돌렸을",
};

const TRANSFORMS: Record<string, (c: Cells) => Cells> = {
  밀기: (c) => c,
  "오른쪽으로 뒤집기": (c) => c.map(([x, y]) => [-x, y]),
  "아래쪽으로 뒤집기": (c) => c.map(([x, y]) => [x, -y]),
  "시계 방향으로 90° 돌리기": (c) => c.map(([x, y]) => [-y, x]),
  "시계 방향으로 180° 돌리기": (c) => c.map(([x, y]) => [-x, -y]),
  "시계 반대 방향으로 90° 돌리기": (c) => c.map(([x, y]) => [y, -x]),
};

/** 두 번 움직이기(서술형)와 방향만 다른 뒤집기: 기본 움직임을 차례로 적용 */
const COMPOSITES: Record<string, (c: Cells) => Cells> = {
  "왼쪽으로 뒤집기": (c) => TRANSFORMS["오른쪽으로 뒤집기"](c),
  "위쪽으로 뒤집기": (c) => TRANSFORMS["아래쪽으로 뒤집기"](c),
  "오른쪽으로 두 번 뒤집기": (c) => TRANSFORMS["오른쪽으로 뒤집기"](TRANSFORMS["오른쪽으로 뒤집기"](c)),
  "시계 방향으로 90°씩 두 번 돌리기": (c) => TRANSFORMS["시계 방향으로 90° 돌리기"](TRANSFORMS["시계 방향으로 90° 돌리기"](c)),
  "오른쪽으로 뒤집고 시계 방향으로 180° 돌리기": (c) => TRANSFORMS["시계 방향으로 180° 돌리기"](TRANSFORMS["오른쪽으로 뒤집기"](c)),
  "아래쪽으로 뒤집고 시계 방향으로 90° 돌리기": (c) => TRANSFORMS["시계 방향으로 90° 돌리기"](TRANSFORMS["아래쪽으로 뒤집기"](c)),
};

/** 모눈 위 조각 그림: 첫 조각(처음)은 윗줄, 나머지(보기)는 아랫줄에 3칸 간격으로 */
export function drawPieces(pieces: Cells[], labels: string[], rowOf: (k: number) => [number, number] = (k) => (k === 0 ? [1, 1] : [1 + 4 * (k - 1), 6])): ShapeScene {
  const c = 22;
  const spots = pieces.map((_, k) => rowOf(k));
  const cols = Math.max(...spots.map(([x]) => x)) + 4;
  const rows = Math.max(...spots.map(([, y]) => y)) + 4;
  return {
    kind: "shape",
    width: cols * c,
    height: rows * c,
    grid: c,
    label: `모눈 위의 도형 ${pieces.length}개: ${labels.join(", ")}`,
    polygons: pieces.flatMap((cells, k) =>
      normalize(cells).map(([x, y]) => {
        const [bx, by] = spots[k];
        return {
          fill: true,
          points: [
            [(bx + x) * c, (by + y) * c],
            [(bx + x + 1) * c, (by + y) * c],
            [(bx + x + 1) * c, (by + y + 1) * c],
            [(bx + x) * c, (by + y + 1) * c],
          ] as Pt[],
        };
      }),
    ),
    texts: labels.map((t, k) => ({ at: [(spots[k][0] + 1.5) * c, (spots[k][1] - 0.5) * c] as Pt, text: t })),
  };
}

const MARK4 = ["①", "②", "③", "④"];

function moveGenerator(id: string, level: Level, names: string[]): Generator {
  return {
    id,
    level,
    make(rand) {
      const pieceIndex = randInt(rand, 0, PIECES.length - 1);
      const piece = PIECES[pieceIndex];
      const name = pick(rand, names);
      const target = (TRANSFORMS[name] ?? COMPOSITES[name])(piece);
      const others = shuffle(
        rand,
        Object.entries(TRANSFORMS)
          .filter(([n]) => n !== name)
          .map(([, f]) => f(piece)),
      );
      const options: Cells[] = [target];
      for (const o of others) if (options.length < 4 && !options.some((x) => sig(x) === sig(o))) options.push(o);
      const ordered = shuffle(rand, options);
      const answerIndex = ordered.findIndex((o) => sig(o) === sig(target));
      return {
        key: `${id}:${pieceIndex}:${name}:${answerIndex}`,
        typeId: id,
        prompt: `'처음' 도형을 ${DONE[name]} 때의 도형을 고르세요.`,
        visual: drawPieces([piece, ...ordered], ["처음", ...MARK4.slice(0, ordered.length)]),
        input: "choice",
        choices: MARK4.slice(0, ordered.length),
        answer: MARK4[answerIndex],
        hint: COMPOSITES[name] && !name.endsWith("쪽으로 뒤집기")
          ? "한 번 움직인 모양을 먼저 그려 보고, 그 모양을 다시 움직여요."
          : name === "밀기"
            ? "밀면 모양과 방향이 그대로예요."
            : name.includes("뒤집기")
              ? "뒤집으면 왼쪽과 오른쪽(또는 위와 아래)이 바뀌어요."
              : "도형의 한 변이 어느 쪽을 향하게 되는지 따라가 보세요.",
        explanation: `${name}의 결과는 ${MARK4[answerIndex]}입니다.`,
      };
    },
  };
}

export const moveSlide = moveGenerator("move-slide", 2, ["밀기"]);
export const moveSlideFlip = moveGenerator("move-slide-flip", 1, ["오른쪽으로 뒤집기", "아래쪽으로 뒤집기"]);
export const moveTwice = moveGenerator(
  "move-twice",
  3,
  Object.keys(COMPOSITES).filter((n) => !n.endsWith("쪽으로 뒤집기")),
);
export const moveFlipOther = moveGenerator("move-flip-other", 2, ["왼쪽으로 뒤집기", "위쪽으로 뒤집기"]);
export const moveRotate = moveGenerator("move-rotate", 2, [
  "시계 방향으로 90° 돌리기",
  "시계 방향으로 180° 돌리기",
  "시계 반대 방향으로 90° 돌리기",
]);

/** 움직인 방법 보기(뒤집기·돌리기) — 조각이 대칭이 아니므로 결과가 모두 다르다 */
const HOW = ["오른쪽으로 뒤집기", "아래쪽으로 뒤집기", "시계 방향으로 90° 돌리기", "시계 방향으로 180° 돌리기", "시계 반대 방향으로 90° 돌리기"];
const HOW_TEXT: Record<string, string> = {
  "오른쪽으로 뒤집기": "오른쪽으로 뒤집기",
  "아래쪽으로 뒤집기": "아래쪽으로 뒤집기",
  "시계 방향으로 90° 돌리기": "시계 방향으로 90°만큼 돌리기",
  "시계 방향으로 180° 돌리기": "시계 방향으로 180°만큼 돌리기",
  "시계 반대 방향으로 90° 돌리기": "시계 반대 방향으로 90°만큼 돌리기",
};

/** 처음 도형과 돌린 도형을 보고 어떻게 돌렸는지 고르기 */
export const rotateTell: Generator = {
  id: "l4-rotate-tell",
  level: 1,
  make(rand) {
    const pieceIndex = randInt(rand, 0, PIECES.length - 1);
    const piece = PIECES[pieceIndex];
    const name = pick(rand, HOW.slice(2));
    const choices = shuffle(rand, [...HOW.slice(2), pick(rand, HOW.slice(0, 2))]).map((n) => HOW_TEXT[n]);
    return {
      key: `l4-rotate-tell:${pieceIndex}:${name}:${choices.join()}`,
      typeId: "l4-rotate-tell",
      prompt: "'처음' 도형을 돌렸더니 '돌린 후' 도형이 되었습니다. 어떻게 돌렸는지 고르세요.",
      visual: drawPieces([piece, TRANSFORMS[name](piece)], ["처음", "돌린 후"], (k) => [1 + 5 * k, 1]),
      input: "choice",
      choices,
      answer: HOW_TEXT[name],
      hint: "처음 도형의 위쪽에 있던 부분이 어느 쪽으로 갔는지 살펴보세요. 시계 방향으로 90°만큼 돌리면 위쪽이 오른쪽으로 가요.",
      explanation: `처음 도형을 ${HOW_TEXT[name]}를 하면 '돌린 후' 도형이 돼요.`,
    };
  },
};

/** 처음 → 한 번 움직인 도형 → 두 번 움직인 도형: 두 번째 움직임 고르기 */
export const comboTell: Generator = {
  id: "l4-combo-tell",
  level: 1,
  make(rand) {
    for (;;) {
      const pieceIndex = randInt(rand, 0, PIECES.length - 1);
      const piece = PIECES[pieceIndex];
      const first = pick(rand, HOW);
      const second = pick(rand, HOW.filter((n) => n !== first));
      const mid = TRANSFORMS[first](piece);
      const end = TRANSFORMS[second](mid);
      const wrongs = shuffle(rand, HOW.filter((n) => n !== second && sig(TRANSFORMS[n](mid)) !== sig(end))).slice(0, 3);
      if (wrongs.length < 3) continue;
      const choices = shuffle(rand, [second, ...wrongs]).map((n) => HOW_TEXT[n]);
      return {
        key: `l4-combo-tell:${pieceIndex}:${first}:${second}:${choices.join()}`,
        typeId: "l4-combo-tell",
        prompt: `'처음' 도형을 ${HOW_TEXT[first]}를 하여 가 도형을 만들고, 가 도형을 한 번 더 움직여 나 도형을 만들었습니다. 가 도형을 어떻게 움직였는지 고르세요.`,
        visual: drawPieces([piece, mid, end], ["처음", "가", "나"], (k) => [1 + 5 * k, 1]),
        input: "choice",
        choices,
        answer: HOW_TEXT[second],
        hint: "가 도형과 나 도형만 비교해요. 왼쪽과 오른쪽이 바뀌었는지, 위와 아래가 바뀌었는지, 돌아갔는지 살펴보세요.",
        explanation: `가 도형을 ${HOW_TEXT[second]}를 하면 나 도형이 돼요.`,
      };
    }
  },
};

/* ── 4-2 사각형 ── */

const QUAD_FACTS: { text: string; name: string }[] = [
  { text: "평행한 변이 한 쌍이라도 있는 사각형", name: "사다리꼴" },
  { text: "마주 보는 두 쌍의 변이 서로 평행한 사각형", name: "평행사변형" },
  { text: "네 변의 길이가 모두 같은 사각형", name: "마름모" },
  { text: "네 각이 모두 직각인 사각형", name: "직사각형" },
  { text: "네 변의 길이가 모두 같고 네 각이 모두 직각인 사각형", name: "정사각형" },
];

export const quadName: Generator = {
  id: "quad-name",
  level: 1,
  make(rand) {
    const f = pick(rand, QUAD_FACTS);
    return {
      key: `${this.id}:${f.name}`,
      typeId: this.id,
      prompt: `'${f.text}'을 무엇이라고 하나요?`,
      input: "choice",
      choices: makeChoices(rand, f.name, QUAD_FACTS.map((q) => q.name), () => "사각형"),
      answer: f.name,
      hint: "평행, 변의 길이, 직각 중 어떤 조건인지 살펴보세요.",
      explanation: `${josa(f.text, "을/를")} ${josa(f.name, "이라고/라고")} 합니다.`,
    };
  },
};

/* ── 4-2 다각형 ── */

export const POLY_NAMES = ["", "", "", "삼각형", "사각형", "오각형", "육각형", "칠각형", "팔각형", "구각형", "십각형"];

export const polyName: Generator = {
  id: "poly-name",
  level: 1,
  make(rand) {
    const n = randInt(rand, 5, 10);
    const answer = POLY_NAMES[n];
    return {
      key: `${this.id}:${n}`,
      typeId: this.id,
      prompt: "다각형의 이름을 고르세요.",
      visual: { kind: "shape", width: 200, height: 170, label: `변이 ${n}개인 다각형`, polygons: [{ points: regularPolygon(n, 100, 88, 72) }] },
      input: "choice",
      choices: makeChoices(rand, answer, [POLY_NAMES[n - 1], POLY_NAMES[n + 1] ?? POLY_NAMES[n - 2]], () => POLY_NAMES[randInt(rand, 3, 10)]),
      answer,
      hint: "변의 수를 세어 보세요.",
      explanation: `변이 ${n}개이므로 ${answer}입니다.`,
    };
  },
};

export const polyDiagonals: Generator = {
  id: "poly-diagonals",
  level: 2,
  make(rand) {
    const n = randInt(rand, 4, 8);
    const d = (n * (n - 3)) / 2;
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${n}`,
      prompt: `${POLY_NAMES[n]}에 그을 수 있는 대각선은 모두 몇 개인가요?`,
      visual: { kind: "shape", width: 200, height: 170, label: POLY_NAMES[n], polygons: [{ points: regularPolygon(n, 100, 88, 72) }] },
      answer: d,
      fields: ["개"],
      hint: `한 꼭짓점에서 그을 수 있는 대각선은 ${n - 3}개예요. 같은 대각선을 두 번 세지 않게 해요.`,
      explanation: `${n} × ${n - 3} ÷ 2 = ${d}(개)`,
      mistakes: { [n * (n - 3)]: "같은 대각선을 두 번 셌어요." },
    });
  },
};
