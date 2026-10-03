import { pick, randInt, shuffle } from "../../lib/random";
import { opts } from "./g2";
import { blocksScene, type Cube, easy, gridPattern, lineCubes, MARKS, mid, ord, patternScene, row, type Tile, word } from "./g2-pics";

/**
 * 2-2 6단원 규칙 찾기: 모양·색칠·방향이 되풀이되는 무늬, 바둑판 무늬, 쌓기나무로 쌓은 모양 그림에서 규칙을 찾는다.
 */

/* ── 무늬 ── */

const tileName = (t: Tile) => `${t.fill ? "색칠한" : "색칠하지 않은"} ${t.shape}`;
const SHAPE3 = ["삼각형", "사각형", "원"] as const;

/** 되풀이되는 묶음(2~3칸, 서로 다른 무늬) */
function unitTiles(rand: () => number, len: number): Tile[] {
  for (let t = 0; t < 30; t++) {
    const u = Array.from({ length: len }, (): Tile => ({ shape: pick(rand, SHAPE3), fill: rand() < 0.5 }));
    if (new Set(u.map(tileName)).size === len) return u;
  }
  return [{ shape: "원", fill: true }, { shape: "삼각형", fill: false }, { shape: "사각형", fill: true }].slice(0, len) as Tile[];
}
/** 보기: 정답 무늬와 헷갈리는 무늬 3개 */
function tileChoices(rand: () => number, answer: Tile, unit: Tile[]): string[] | null {
  const all = SHAPE3.flatMap((shape) => [true, false].map((fill) => tileName({ shape, fill })));
  return opts(rand, tileName(answer), shuffle(rand, [...unit.map(tileName), ...all]));
}

export const patternNext = easy("l2-pattern-next", (rand) => {
  const u = unitTiles(rand, randInt(rand, 2, 3));
  const shown = u.length * 2 + randInt(rand, 1, u.length);
  const seq = Array.from({ length: shown + 1 }, (_, i) => u[i % u.length]);
  const answer = seq[shown];
  const choices = tileChoices(rand, answer, u);
  if (!choices) return null;
  return {
    key: `${u.map(tileName).join()}:${shown}`,
    prompt: "규칙에 따라 ?에 알맞은 무늬를 고르세요.",
    visual: patternScene([...seq.slice(0, shown), null], `되풀이되는 무늬: ${u.map(tileName).join(", ")} …, 마지막 칸은 ?`, 8),
    choices,
    answer: tileName(answer),
    hint: "모양과 색칠이 똑같이 다시 나오는 곳을 찾아 되풀이되는 부분을 묶어 보세요.",
    explanation: `${u.map(tileName).join(", ")}이 되풀이되므로 ?에는 ${tileName(answer)}이 와요.`,
  };
});

const ARROW = ["→", "↓", "←", "↑"];

export const patternRotate = mid("l2-pattern-rotate", (rand) => {
  const step = pick(rand, [1, 1, 3, 2]);
  const start = randInt(rand, 0, 3);
  const n = 8;
  const blank = randInt(rand, 4, n - 1);
  const dirs = Array.from({ length: n }, (_, i) => (start + step * i) % 4);
  const answer = ARROW[dirs[blank]];
  return {
    key: `${step}:${start}:${blank}`,
    prompt: "화살표를 규칙에 따라 돌려 가며 늘어놓았습니다. ?에 알맞은 화살표를 고르세요.",
    visual: patternScene(dirs.map((d, i) => (i === blank ? null : { shape: "화살표", fill: true, rot: d * 90 })), `화살표 무늬: ${dirs.map((d, i) => (i === blank ? "?" : ARROW[d])).join(" ")}`, 8),
    choices: ARROW,
    answer,
    hint: "화살표가 한 칸마다 어느 쪽으로 얼마만큼 돌아가는지 살펴보세요.",
    // '직각'은 3-1 용어라 쓰지 않고, 화살표가 나오는 차례로 설명한다
    explanation:
      step === 2
        ? `화살표가 ${ARROW[start]}, ${ARROW[(start + 2) % 4]} 차례로 번갈아 나오므로 ?는 ${answer}예요.`
        : `화살표가 ${step === 1 ? "시계 방향" : "시계 반대 방향"}으로 돌아가며 ${[0, 1, 2, 3].map((i) => ARROW[(start + step * i) % 4]).join(", ")} 차례로 되풀이되므로 ?는 ${answer}예요.`,
  };
});

export const patternNth = word("l2-pattern-nth", (rand) => {
  const u = unitTiles(rand, randInt(rand, 2, 3));
  const n = randInt(rand, 11, 20);
  const answer = u[(n - 1) % u.length];
  const choices = tileChoices(rand, answer, u);
  if (!choices) return null;
  const shown = u.length * 3;
  return {
    key: `${u.map(tileName).join()}:${n}`,
    prompt: `규칙에 따라 무늬를 계속 늘어놓을 때 ${ord(n)}에 올 무늬를 고르세요.`,
    visual: patternScene(Array.from({ length: shown }, (_, i) => u[i % u.length]), `되풀이되는 무늬 ${shown}칸: ${u.map(tileName).join(", ")} …`, 8),
    choices,
    answer: tileName(answer),
    hint: `${u.length}칸씩 되풀이돼요. ${u.length}씩 뛰어 세어 ${ord(n)}가 묶음의 몇째인지 찾아요.`,
    explanation: `${u.length}칸씩 되풀이되고 ${ord(n)}는 묶음의 ${ord(((n - 1) % u.length) + 1)} → ${tileName(answer)}`,
  };
});

/** 바둑판 무늬: 줄마다 한 칸씩 밀리며 되풀이, 넷째 줄 빈칸 중 색칠할 칸 */
export const patternGrid = word("l2-pattern-grid", (rand) => {
  const len = randInt(rand, 2, 3);
  const base = Array.from({ length: len }, (_, i) => i === 0 || (len === 3 && rand() < 0.3));
  if (base.every(Boolean)) return null;
  const shift = pick(rand, [1, -1]);
  const cols = 6;
  const cell = (r: number, c: number) => base[(((c - r * shift) % len) + len) % len];
  const rows = [0, 1, 2].map((r) => Array.from({ length: cols }, (_, c) => cell(r, c)));
  const last = Array.from({ length: cols }, (_, c) => cell(3, c));
  const on = MARKS.slice(0, cols).filter((_, c) => last[c]);
  const answer = on.join(", ");
  const other = (f: (c: number) => boolean) => MARKS.slice(0, cols).filter((_, c) => f(c)).join(", ");
  const choices = opts(rand, answer, [other((c) => !last[c]), other((c) => rows[2][c]), other((c) => cell(4, c)), other((c) => rows[0][c])].filter(Boolean));
  if (!choices) return null;
  return {
    key: `${base.join()}:${shift}`,
    prompt: "규칙에 따라 칸을 색칠하고 있습니다. 넷째 줄에서 색칠해야 하는 칸을 모두 고르세요.",
    visual: gridPattern([...rows, MARKS.slice(0, cols)], `바둑판 무늬 3줄과 빈 넷째 줄(㉠~㉥)`),
    choices,
    answer,
    hint: "윗줄에서 아랫줄로 갈 때 색칠한 칸이 어느 쪽으로 몇 칸씩 옮겨 가는지 살펴보세요.",
    explanation: `한 줄 내려갈 때마다 색칠한 칸이 ${shift > 0 ? "오른쪽" : "왼쪽"}으로 한 칸씩 옮겨 가므로 넷째 줄은 ${answer}`,
  };
});

/* ── 쌓은 모양 ── */

type Family = { rule: string; make: (i: number) => number[]; count: (i: number) => number };
const FAMILIES: Family[] = [
  { rule: "오른쪽으로 1개씩 늘어나요.", make: (i) => Array(i).fill(1), count: (i) => i },
  { rule: "위쪽으로 1개씩 늘어나요.", make: (i) => [i], count: (i) => i },
  { rule: "위쪽과 오른쪽으로 1개씩 늘어나요.", make: (i) => [i, ...Array(i - 1).fill(1)], count: (i) => 2 * i - 1 },
  { rule: "2층으로 쌓은 줄이 오른쪽으로 2개씩 늘어나요.", make: (i) => Array(i).fill(2), count: (i) => 2 * i },
  { rule: "왼쪽 쌓기나무 위로 1개씩 늘어나요.", make: (i) => [i, 1], count: (i) => i + 1 },
];

/** 첫째~셋째 모양 그림 */
const steps = (f: Family, label: string) => row([1, 2, 3].map((i) => blocksScene(lineCubes(f.make(i)) as Cube[], "")), label, ["첫째", "둘째", "셋째"], 20);

export const blocksSeq = easy("l2-blocks-seq", (rand) => {
  const f = pick(rand, FAMILIES);
  return {
    key: f.rule,
    prompt: "규칙에 따라 쌓기나무를 쌓았습니다. 넷째 모양에 쌓을 쌓기나무는 몇 개인가요?",
    visual: steps(f, `쌓기나무 ${[1, 2, 3].map(f.count).join("개, ")}개로 쌓은 첫째~셋째 모양`),
    answer: f.count(4),
    unit: "개",
    hint: "모양마다 쌓기나무를 세고, 몇 개씩 늘어나는지 살펴봐요.",
    explanation: `${[1, 2, 3].map(f.count).join("개 → ")}개로 ${f.count(2) - f.count(1)}개씩 늘어나므로 넷째는 ${f.count(4)}개`,
  };
});

export const blocksSeqFifth = mid("l2-blocks-seq-fifth", (rand) => {
  const f = pick(rand, FAMILIES);
  const n = pick(rand, [5, 6]);
  return {
    key: `${f.rule}:${n}`,
    prompt: `규칙에 따라 쌓기나무를 쌓았습니다. 같은 규칙으로 쌓을 때 ${ord(n)} 모양에 쌓을 쌓기나무는 몇 개인가요?`,
    visual: steps(f, `쌓기나무 ${[1, 2, 3].map(f.count).join("개, ")}개로 쌓은 첫째~셋째 모양`),
    answer: f.count(n),
    unit: "개",
    hint: "몇 개씩 늘어나는지 찾은 뒤 넷째부터 차례로 구해 보세요.",
    explanation: `${Array.from({ length: n }, (_, i) => f.count(i + 1)).join(", ")} → ${f.count(n)}개`,
  };
});

export const blocksSeqDiff = mid("l2-blocks-seq-diff", (rand) => {
  const f = pick(rand, FAMILIES);
  const choices = opts(rand, f.rule, shuffle(rand, FAMILIES.filter((g) => g !== f).map((g) => g.rule)));
  if (!choices) return null;
  return {
    key: `${f.rule}:${choices.join()}`,
    prompt: "쌓기나무를 쌓은 규칙을 바르게 말한 것을 고르세요.",
    visual: steps(f, `쌓기나무 ${[1, 2, 3].map(f.count).join("개, ")}개로 쌓은 첫째~셋째 모양`),
    choices,
    answer: f.rule,
    hint: "앞 모양과 비교하여 어느 쪽에 쌓기나무가 새로 놓였는지 찾아요.",
    explanation: `첫째에서 셋째로 갈수록 ${f.rule}`,
  };
});

export const blocksStair = word("l2-blocks-stair", (rand) => {
  const n = randInt(rand, 4, 5);
  const tri = (x: number) => (x * (x + 1)) / 2;
  const stair = (i: number) => lineCubes(Array.from({ length: i }, (_, k) => i - k));
  return {
    key: `${n}`,
    prompt: `쌓기나무로 계단 모양을 쌓고 있습니다. 같은 규칙으로 ${n}층 계단을 만들려면 쌓기나무가 몇 개 필요한가요?`,
    visual: row([1, 2, 3].map((i) => blocksScene(stair(i), "")), "1층, 2층, 3층 계단 모양(1개, 3개, 6개)", ["1층", "2층", "3층"], 20),
    answer: tri(n),
    unit: "개",
    hint: "한 층이 늘어날 때마다 새로 놓는 쌓기나무가 2개, 3개, 4개, …로 1개씩 많아져요.",
    explanation: `${Array.from({ length: n }, (_, i) => tri(i + 1)).join(", ")} → ${tri(n)}개`,
    mistakes: { [n * 2]: "늘어나는 개수가 점점 커져요." },
  };
});

export const blocksTotal = word("l2-blocks-total", (rand) => {
  const f = pick(rand, FAMILIES);
  const n = 4;
  const list = Array.from({ length: n }, (_, i) => f.count(i + 1));
  const total = list.reduce((a, b) => a + b, 0);
  return {
    key: f.rule,
    prompt: "규칙에 따라 쌓기나무를 쌓았습니다. 첫째부터 넷째까지의 모양을 모두 만드는 데 필요한 쌓기나무는 몇 개인가요?",
    visual: steps(f, `쌓기나무 ${[1, 2, 3].map(f.count).join("개, ")}개로 쌓은 첫째~셋째 모양`),
    answer: total,
    unit: "개",
    hint: "먼저 넷째 모양의 쌓기나무 수를 구하고, 네 모양의 쌓기나무 수를 모두 더해요.",
    explanation: `${list.join(" + ")} = ${total}(개)`,
    mistakes: { [f.count(4)]: "넷째 모양만 세었어요." },
  };
});
