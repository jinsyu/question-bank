import type { ShapeScene } from "../types";
import { pick, randInt, shuffle } from "../../lib/random";
import { josa } from "../josa";
import { easy, mid } from "./g2-pics";

/**
 * 2학년 그림 유형: 수 모형(백·십·일 모형)으로 세 자리 수 읽기·나타내기,
 * 수직선(몇백·뛰어 세기), 세면서 표시하기(/ 또는 ✓) 표.
 */

type Pt = [number, number];
type Polys = NonNullable<ShapeScene["polygons"]>;
type Lines = NonNullable<ShapeScene["lines"]>;
type Texts = NonNullable<ShapeScene["texts"]>;
const rect = (x: number, y: number, w: number, h: number, fill?: boolean) => ({ fill, points: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]] as Pt[] });

/* ── 수 모형 ── */

const CELL = 6;
const FLAT = CELL * 10;
const ROD_W = 8;
const UNIT = 8;

/**
 * 수 모형: 백 모형(10×10 칸 판), 십 모형(10칸 막대), 일 모형(작은 정육면체 한 칸).
 * 백 모형은 3개씩 줄을 지어, 십 모형은 한 줄로, 일 모형은 3개씩 줄을 지어 놓는다.
 */
export function baseTenScene(hundreds: number, tens: number, ones: number): ShapeScene {
  const polygons: Polys = [];
  const lines: Lines = [];
  const top = 8;
  let x = 8;
  // 3개씩 줄을 지어 그림 폭을 400 안쪽으로 둔다(휴대폰에서 일 모형이 너무 작아지지 않게)
  const perRow = Math.min(hundreds, 3);
  for (let i = 0; i < hundreds; i++) {
    const fx = x + (i % perRow) * (FLAT + 6);
    const fy = top + Math.floor(i / perRow) * (FLAT + 6);
    polygons.push(rect(fx, fy, FLAT, FLAT, true));
    for (let k = 1; k < 10; k++) {
      lines.push({ from: [fx + k * CELL, fy], to: [fx + k * CELL, fy + FLAT], width: 1 });
      lines.push({ from: [fx, fy + k * CELL], to: [fx + FLAT, fy + k * CELL], width: 1 });
    }
  }
  if (hundreds) x += perRow * (FLAT + 6) + 10;
  for (let i = 0; i < tens; i++) {
    const rx = x + i * (ROD_W + 5);
    polygons.push(rect(rx, top, ROD_W, FLAT, true));
    for (let k = 1; k < 10; k++) lines.push({ from: [rx, top + k * CELL], to: [rx + ROD_W, top + k * CELL], width: 1 });
  }
  if (tens) x += tens * (ROD_W + 5) + 10;
  for (let i = 0; i < ones; i++) polygons.push(rect(x + (i % 3) * (UNIT + 5), top + FLAT - UNIT - Math.floor(i / 3) * (UNIT + 5), UNIT, UNIT, true));
  if (ones) x += 3 * (UNIT + 5) + 5;
  const rows = Math.max(1, Math.ceil(hundreds / Math.max(perRow, 1)));
  return {
    kind: "shape",
    width: Math.max(x + 3, 120),
    height: top * 2 + rows * FLAT + (rows - 1) * 6,
    label: `수 모형: 백 모형 ${hundreds}개, 십 모형 ${tens}개, 일 모형 ${ones}개`,
    polygons,
    lines,
  };
}

const MODEL_HINT = "백 모형은 100, 십 모형은 10, 일 모형은 1을 나타내요.";

/** 수 모형이 나타내는 세 자리 수(0인 자리 포함) */
export const blocksRead3 = easy("l2-blocks-read3", (rand) => {
  const h = randInt(rand, 1, 7);
  const t = rand() < 0.2 ? 0 : randInt(rand, 1, 9);
  const o = rand() < 0.2 && t ? 0 : randInt(rand, 1, 9);
  const n = h * 100 + t * 10 + o;
  const mistakes: Record<string, string> = {};
  if (t === 0) mistakes[String(h * 10 + o)] = "십 모형이 없으면 십의 자리에 0을 써요.";
  if (o === 0) mistakes[String(h * 10 + t)] = "일 모형이 없으면 일의 자리에 0을 써요.";
  return {
    key: `${n}`,
    prompt: "수 모형이 나타내는 수를 쓰세요.",
    visual: baseTenScene(h, t, o),
    answer: n,
    hint: `${MODEL_HINT} 모형의 수를 각각 세어 보세요.`,
    explanation: `100이 ${h}개, 10이 ${t}개, 1이 ${o}개이면 ${josa(n, "이에요/예요")}.`,
    mistakes,
  };
});

const PLACE_MODEL = [
  { name: "백 모형", unit: 100 },
  { name: "십 모형", unit: 10 },
  { name: "일 모형", unit: 1 },
] as const;

/** 그림의 수 모형에 한 가지 모형을 몇 개 더 놓아야 목표 수가 되는지(받아올림 없음) */
export const blocksMore3 = mid("l2-blocks-more3", (rand) => {
  const counts = [randInt(rand, 1, 5), randInt(rand, 0, 6), randInt(rand, 0, 6)];
  const k = randInt(rand, 0, 2);
  const more = randInt(rand, 1, 3);
  const after = counts.map((c, i) => (i === k ? c + more : c));
  if (after.some((c) => c > 9)) return null;
  const n = counts[0] * 100 + counts[1] * 10 + counts[2];
  const target = after[0] * 100 + after[1] * 10 + after[2];
  const m = PLACE_MODEL[k];
  return {
    key: `${n}:${k}:${more}`,
    prompt: `그림의 수 모형에 ${josa(m.name, "을/를")} 몇 개 더 놓으면 ${josa(target, "이/가")} 되나요?`,
    visual: baseTenScene(counts[0], counts[1], counts[2]),
    answer: more,
    unit: "개",
    hint: `${MODEL_HINT} 먼저 그림의 수 모형이 나타내는 수를 알아보세요.`,
    explanation: `그림은 ${n}이고, ${target}에서 ${m.name.slice(0, 1)}의 자리 숫자가 ${after[k]}이므로 ${m.name} ${after[k]} − ${counts[k]} = ${more}(개)를 더 놓아요.`,
    mistakes: { [String(after[k])]: `${target}의 ${m.name.slice(0, 1)}의 자리 숫자를 그대로 썼어요. 이미 놓인 모형을 빼야 해요.` },
  };
});

/* ── 수직선 ── */

const LEFT = 26;

/**
 * 수직선: ticks개 눈금(첫 눈금 start, 간격 step). labels 번호의 눈금 아래에 수를, box 번호 눈금 아래에 □를 쓴다.
 * jumps면 눈금 사이를 뛰어 세는 호를 그린다. sp는 눈금 간격(px): 휴대폰 폭에서 글자가 12px 아래로 줄지 않게 그림 폭을 360 안쪽으로 둔다.
 */
export function numberLineScene(start: number, step: number, ticks: number, labels: number[], box: number, jumps = false, sp = 40): ShapeScene {
  const SP = sp;
  const y = jumps ? 46 : 26;
  const x = (i: number) => LEFT + i * SP;
  const last = x(ticks - 1);
  const lines: Lines = [{ from: [LEFT - 14, y], to: [last + 14, y] }];
  for (let i = 0; i < ticks; i++) lines.push({ from: [x(i), y - 7], to: [x(i), y + 7] });
  const texts: Texts = labels.map((i) => ({ at: [x(i), y + 22] as Pt, text: String(start + i * step) }));
  texts.push({ at: [x(box), y + 22], text: "□" });
  const arcs = jumps ? Array.from({ length: ticks - 1 }, (_, i) => ({ c: [x(i) + SP / 2, y - 8] as Pt, r: SP / 2 - 4, from: 10, to: 170 })) : [];
  return {
    kind: "shape",
    width: last + LEFT,
    height: y + 40,
    label: `수직선: 눈금 ${ticks}개, ${josa(labels.map((i) => start + i * step).join(", "), "이/가")} 쓰여 있고 □ 한 칸${jumps ? ", 눈금마다 뛰어 센 표시" : ""}`,
    lines,
    texts,
    arcs,
  };
}

/** 0부터 900까지 100씩 눈금을 그린 수직선에서 □가 나타내는 몇백(1000은 2-2에서 배운다) */
export const hundredsLine = easy("l2-hundreds-line", (rand) => {
  const box = pick(rand, [1, 2, 3, 4, 6, 7, 8, 9]);
  return {
    key: `${box}`,
    prompt: "수직선에서 □ 안에 알맞은 수를 쓰세요.",
    visual: numberLineScene(0, 100, 10, [0, 5], box, false, 34),
    answer: box * 100,
    hint: "눈금 한 칸은 100이에요. 0이나 500에서 몇 칸 떨어져 있는지 세어 보세요.",
    explanation: box < 5 ? `0에서 100씩 ${box}칸 → ${box * 100}` : `500에서 100씩 ${box - 5}칸 → ${box * 100}`,
    mistakes: { [String(box)]: "눈금 한 칸은 100이에요." },
  };
});

/** 뛰어 센 수직선에서 □가 나타내는 수(1·10·100씩) */
export const skipLine3 = easy("l2-skip-line3", (rand) => {
  const step = pick(rand, [1, 10, 100]);
  const ticks = 6;
  const start = step === 100 ? randInt(rand, 101, 499) : randInt(rand, 100, 999 - step * (ticks - 1));
  const box = randInt(rand, 2, ticks - 1);
  const labels = [0, 1];
  const answer = start + box * step;
  return {
    key: `${start}:${step}:${box}`,
    prompt: "수직선에서 규칙에 따라 뛰어 세었습니다. □ 안에 알맞은 수를 쓰세요.",
    visual: numberLineScene(start, step, ticks, labels, box, true),
    answer,
    hint: `${start}에서 ${start + step}까지 얼마만큼 뛰었는지 먼저 알아보세요.`,
    explanation: `${step}씩 뛰어 세었어요: ${Array.from({ length: box + 1 }, (_, i) => start + i * step).join(" – ")}`,
    mistakes: { [String(start + box)]: `${step}씩 뛰어 세었어요.` },
  };
});

/* ── 세면서 표시하기 ── */

/** 교과서식 표시: 빗금(/) 또는 체크(✓). 2학년 교과서에는 한자 표시를 쓰지 않는다 */
export type TallyStyle = "/" | "✓";

/** 표시 하나의 폭(px)과 5개 묶음 사이 여백 */
const MARK_STEP = { "/": 7, "✓": 11 } as const;
const GROUP_GAP = 8;
const markX = (style: TallyStyle, i: number) => i * MARK_STEP[style] + Math.floor(i / 5) * GROUP_GAP;

/**
 * 표시 count개를 5개씩 묶어 그리는 선. x0은 첫 표시의 왼쪽, cy는 칸 가운데.
 * 표시마다 아래에서 위로 올라가는 획이 하나씩 있다(/는 한 획, ✓는 짧은 내림 획 + 긴 올림 획)
 */
function tallyLines(count: number, style: TallyStyle, x0: number, cy: number): Lines {
  const out: Lines = [];
  for (let i = 0; i < count; i++) {
    const x = x0 + markX(style, i);
    if (style === "/") out.push({ from: [x, cy + 8], to: [x + 5, cy - 8] });
    else out.push({ from: [x, cy], to: [x + 3, cy + 6] }, { from: [x + 3, cy + 6], to: [x + 9, cy - 7] });
  }
  return out;
}

/**
 * 세면서 표시한 표: 왼쪽 칸은 종류, 오른쪽 칸은 표시.
 * hidden: 문제가 묻는 종류(그림 설명에 그 수를 쓰지 않아 화면 읽기에서 정답이 드러나지 않게)
 */
export function tallyScene(kinds: string[], counts: number[], style: TallyStyle, head = "종류", hidden?: number): ShapeScene {
  const most = Math.max(...counts);
  const [nameW, rowH, top, left] = [70, 34, 4, 4];
  const markW = Math.max(150, 24 + markX(style, most - 1) + 9);
  const polygons: Polys = [];
  const lines: Lines = [];
  const texts: Texts = [
    { at: [left + nameW / 2, top + rowH / 2], text: head },
    { at: [left + nameW + markW / 2, top + rowH / 2], text: "세면서 표시하기" },
  ];
  polygons.push(rect(left, top, nameW + markW, rowH * (kinds.length + 1)));
  lines.push({ from: [left + nameW, top], to: [left + nameW, top + rowH * (kinds.length + 1)] });
  for (let r = 1; r <= kinds.length; r++) lines.push({ from: [left, top + r * rowH], to: [left + nameW + markW, top + r * rowH] });
  kinds.forEach((k, i) => {
    const cy = top + (i + 1.5) * rowH;
    texts.push({ at: [left + nameW / 2, cy], text: k });
    lines.push(...tallyLines(counts[i], style, left + nameW + 12, cy));
  });
  return {
    kind: "shape",
    width: left * 2 + nameW + markW,
    height: top * 2 + rowH * (kinds.length + 1),
    label: `세면서 ${style} 표시를 한 표: ${kinds.map((k, i) => (i === hidden ? `${josa(k, "은/는")} 표시를 세어 보세요` : `${k} ${counts[i]}개 표시`)).join(", ")}`,
    polygons,
    lines,
    texts,
  };
}

type TallySet = { intro: string; head: string; unit: string; kinds: readonly string[]; ask: (kind: string) => string; diff: string };
const TALLY_SETS: TallySet[] = [
  { intro: "과일 가게에 있는 과일을 종류별로 세면서 표시했습니다.", head: "과일", unit: "개", kinds: ["사과", "배", "귤", "포도", "딸기"], ask: (k) => `${josa(k, "은/는")} 몇 개인가요?`, diff: "가장 많은 과일은 가장 적은 과일보다 몇 개 더 많은가요?" },
  { intro: "체육관에 있는 공을 종류별로 세면서 표시했습니다.", head: "공", unit: "개", kinds: ["축구공", "야구공", "농구공", "배구공"], ask: (k) => `${josa(k, "은/는")} 몇 개인가요?`, diff: "가장 많은 공은 가장 적은 공보다 몇 개 더 많은가요?" },
  { intro: "우리 반 학생들이 좋아하는 계절을 조사하여 세면서 표시했습니다.", head: "계절", unit: "명", kinds: ["봄", "여름", "가을", "겨울"], ask: (k) => `${josa(k, "을/를")} 좋아하는 학생은 몇 명인가요?`, diff: "가장 많은 학생이 좋아하는 계절은 가장 적은 학생이 좋아하는 계절보다 몇 명 더 많은가요?" },
];

const tallyHint = (style: TallyStyle) => `${style} 표시를 5개씩 묶어 세어 보세요.`;
/** 5개씩 묶음과 남은 표시. 0인 쪽은 쓰지 않는다(5개씩 0묶음과 3개 → 3개, 5개씩 2묶음과 0개 → 5개씩 2묶음) */
const tallyExplain = (c: number) => {
  const parts = [Math.floor(c / 5) ? `5개씩 ${Math.floor(c / 5)}묶음` : "", c % 5 ? `${c % 5}개` : ""].filter(Boolean);
  return `${parts.join("과 ")} → ${c}`;
};

function tallyData(rand: () => number, n: number, min: number, max: number) {
  const set = pick(rand, TALLY_SETS);
  const kinds = shuffle(rand, [...set.kinds]).slice(0, n);
  const counts = kinds.map(() => randInt(rand, min, max));
  const style: TallyStyle = rand() < 0.5 ? "✓" : "/";
  return { set, kinds, counts, style };
}

/** 세면서 표시한 표를 보고 한 종류의 수 읽기 */
export const tallyRead = easy("l2-tally-read", (rand) => {
  const { set, kinds, counts, style } = tallyData(rand, 3, 3, 13);
  const i = randInt(rand, 0, 2);
  return {
    key: `${kinds.join()}:${counts.join()}:${style}:${i}`,
    prompt: `${set.intro} ${set.ask(kinds[i])}`,
    visual: tallyScene(kinds, counts, style, set.head, i),
    answer: counts[i],
    unit: set.unit,
    hint: tallyHint(style),
    explanation: `${kinds[i]}: ${tallyExplain(counts[i])}`,
  };
});

/** 세면서 표시한 표를 보고 합계 또는 가장 많은 것과 가장 적은 것의 차 */
export const tallyTotal = mid("l2-tally-total", (rand) => {
  const { set, kinds, counts, style } = tallyData(rand, 4, 2, 12);
  const total = counts.reduce((s, c) => s + c, 0);
  const askDiff = rand() < 0.5;
  const max = Math.max(...counts);
  const min = Math.min(...counts);
  if (askDiff && (counts.filter((c) => c === max).length > 1 || counts.filter((c) => c === min).length > 1)) return null;
  return {
    key: `${kinds.join()}:${counts.join()}:${style}:${askDiff}`,
    prompt: `${set.intro} ${askDiff ? set.diff : `이것을 표로 나타낼 때 합계는 몇 ${set.unit}인가요?`}`,
    visual: tallyScene(kinds, counts, style, set.head),
    answer: askDiff ? max - min : total,
    unit: set.unit,
    hint: `${tallyHint(style)} 먼저 종류별 수를 세어 표에 써 보세요.`,
    explanation: `${kinds.map((k, i) => `${k} ${counts[i]}`).join(", ")} → ${askDiff ? `${kinds[counts.indexOf(max)]} ${max} − ${kinds[counts.indexOf(min)]} ${min} = ${max - min}` : `${counts.join(" + ")} = ${total}`}`,
  };
});
