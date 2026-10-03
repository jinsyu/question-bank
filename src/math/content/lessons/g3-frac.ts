import { makeChoices, pick, randInt, shuffle } from "../../lib/random";
import { mixedText } from "../generators/grade4";
import { groupsScene } from "../generators/pictures";
import type { ShapeScene } from "../types";
import { rect, scene, type Parts, type Pt } from "./g3-figures";
import { cardList, cardsOf, choices4, easy, eul, hard, mid, nameOf, pp, truth, twoNames } from "./g3-kit";
import { josa } from "../josa";

/**
 * 3학년 분수·소수 단원: 3-1 '분수와 소수', 3-2 '분수' 차시별 생성기.
 */

const f = (n: number, d: number) => `${n}/${d}`;
/** □에 들어갈 수의 범위(하나뿐이면 '3 하나') */
const span = (lo: number, hi: number) => (lo === hi ? `${lo} 하나` : `${lo}부터 ${hi}까지`);
/** 진분수인 후보만 분수 글자로(가분수를 배우기 전 차시의 보기) */
const properOnly = (list: [number, number][]) => list.filter(([n, d]) => n >= 1 && n < d).map(([n, d]) => f(n, d));
const dec = (tenths: number) => String(tenths / 10);

/* ── 3-1 똑같이 나누기 ── */

export const equalParts = easy("l3-eq-parts", (rand) => {
  const n = randInt(rand, 2, 12);
  const k = randInt(rand, 1, n - 1);
  const circle = rand() < 0.5;
  return {
    key: `${n}:${k}:${circle}`,
    prompt: "전체를 똑같이 몇 조각으로 나누었고, 그중 몇 조각을 색칠했나요?",
    visual: { kind: circle ? "circle" : "bar", parts: n, shaded: k },
    answer: `${n},${k}`,
    unit: ["조각 중", "조각"],
    hint: "나누어진 조각 전체의 수와 색칠한 조각의 수를 각각 세어 보세요.",
    explanation: `똑같이 ${n}조각으로 나눈 것 중 ${k}조각을 색칠했습니다.`,
    mistakes: { [`${n - k},${k}`]: "전체 조각 수를 세어야 해요." },
  };
});

/** 직사각형을 k조각으로 나눈 그림(equal이면 똑같이, 아니면 폭이 다르게). 세로로 자르거나 가로로 자른다 */
function splitRect(x: number, y: number, w: number, h: number, k: number, equal: boolean, vertical: boolean, rand: () => number): Parts {
  const cuts = Array.from({ length: k - 1 }, (_, i) => (i + 1) / k);
  if (!equal) {
    // 한 선을 한쪽으로 크게 비껴 그어 조각 크기가 눈에 띄게 다르게
    const j = randInt(rand, 0, k - 2);
    cuts[j] += (pick(rand, [-1, 1]) * 0.45) / k;
  }
  return {
    polygons: [rect(x, y, x + w, y + h)],
    lines: cuts.map((t) =>
      vertical ? { from: [Math.round(x + w * t), y] as Pt, to: [Math.round(x + w * t), y + h] as Pt } : { from: [x, Math.round(y + h * t)] as Pt, to: [x + w, Math.round(y + h * t)] as Pt },
    ),
  };
}

const NAMES4 = ["가", "나", "다", "라", "마", "바"];

export const equalPick = mid("l3-eq-pick", (rand) => {
  const k = randInt(rand, 3, 4);
  // 정답 1개: 똑같이 k조각 / 틀린 것: k조각이지만 크기가 다름, 또는 똑같지만 조각 수가 다름
  const kinds = shuffle(rand, ["right", "unequal", "unequal", pick(rand, ["unequal", "other"])] as const);
  const cell = (i: number): Pt => [20 + (i % 2) * 150, 16 + Math.floor(i / 2) * 110];
  const parts = kinds.map((kind, i) =>
    splitRect(cell(i)[0], cell(i)[1], 120, 70, kind === "other" ? k + 1 : k, kind !== "unequal", rand() < 0.5, rand),
  );
  const answer = NAMES4[kinds.indexOf("right")];
  const word = k === 3 ? "셋" : "넷";
  return {
    key: `${k}:${kinds.join()}:${parts.map((p) => p.lines!.map((l) => l.from.join()).join()).join("|")}`,
    prompt: `똑같이 ${word}으로 나누어진 도형을 고르세요.`,
    visual: scene(310, 236, "선을 그어 여러 조각으로 나눈 직사각형 4개", ...parts, {
      texts: kinds.map((_, i) => ({ at: [cell(i)[0] + 60, cell(i)[1] + 86] as Pt, text: NAMES4[i] })),
    }),
    answer,
    choices: NAMES4.slice(0, 4),
    hint: `조각이 ${k}개인지, 조각의 모양과 크기가 모두 같은지 함께 확인해요.`,
    explanation: `조각이 ${k}개이고 모양과 크기가 모두 같은 것은 ${answer}입니다.`,
  };
});

export const equalTruth = truth("l3-eq-truth", 2, "똑같이 나누기", {
  t: [
    "똑같이 나누면 나누어진 조각의 모양과 크기가 모두 같습니다.",
    "똑같이 나눈 조각은 서로 겹쳐 보면 꼭 맞습니다.",
    "색종이를 반으로 접어 자르면 똑같이 둘로 나눌 수 있습니다.",
    "케이크를 똑같이 여섯으로 나누면 여섯 조각의 크기가 모두 같습니다.",
  ],
  f: [
    "똑같이 나누면 조각의 크기가 모두 달라도 됩니다.",
    "조각의 수만 같으면 똑같이 나눈 것입니다.",
    "모양과 크기가 서로 다른 조각 4개로 나누어도 똑같이 넷으로 나눈 것입니다.",
    "똑같이 나눈 조각은 겹쳐 보면 서로 맞지 않습니다.",
  ],
});

export const equalCount = hard("l3-eq-count", (rand) => {
  const n = randInt(rand, 2, 4);
  const kinds = shuffle(rand, [...Array<boolean>(n).fill(true), ...Array<boolean>(6 - n).fill(false)]);
  const cell = (i: number): Pt => [16 + (i % 3) * 104, 14 + Math.floor(i / 3) * 96];
  const parts = kinds.map((eq, i) => splitRect(cell(i)[0], cell(i)[1], 84, 54, randInt(rand, 2, 4), eq, rand() < 0.5, rand));
  return {
    key: `${kinds.join()}:${parts.map((p) => p.lines!.map((l) => l.from.join()).join()).join("|")}`,
    prompt: "그림에서 똑같이 나누어진 도형은 모두 몇 개인가요?",
    visual: scene(328, 206, "선을 그어 나눈 직사각형 6개", ...parts, {
      texts: kinds.map((_, i) => ({ at: [cell(i)[0] + 42, cell(i)[1] + 70] as Pt, text: NAMES4[i] })),
    }),
    answer: n,
    unit: "개",
    hint: "도형마다 나누어진 조각의 모양과 크기가 모두 같은지 확인해요. 조각 수는 달라도 돼요.",
    explanation: `똑같이 나누어진 도형: ${kinds.map((e, i) => (e ? NAMES4[i] : "")).filter(Boolean).join(", ")} → ${n}개`,
    mistakes: { 6: "조각의 크기가 다른 도형은 똑같이 나눈 것이 아니에요." },
  };
});

export const equalGrid = hard("l3-eq-grid", (rand) => {
  const a = randInt(rand, 1, 3);
  const b = randInt(rand, 2, 5);
  const [w, h] = [240, 140];
  const x0 = 20;
  const y0 = 16;
  return {
    key: `${a}:${b}`,
    prompt: "직사각형 모양 종이를 점선을 따라 모두 잘라 크기와 모양이 같은 조각으로 나누었습니다. 똑같은 조각은 모두 몇 개인가요?",
    visual: scene(w + 40, h + 32, `가로 점선 ${a}개와 세로 점선 ${b}개를 그은 직사각형 종이`, {
      polygons: [rect(x0, y0, x0 + w, y0 + h)],
      lines: [
        ...Array.from({ length: a }, (_, i) => ({ from: [x0, y0 + ((i + 1) * h) / (a + 1)] as Pt, to: [x0 + w, y0 + ((i + 1) * h) / (a + 1)] as Pt, dashed: true })),
        ...Array.from({ length: b }, (_, i) => ({ from: [x0 + ((i + 1) * w) / (b + 1), y0] as Pt, to: [x0 + ((i + 1) * w) / (b + 1), y0 + h] as Pt, dashed: true })),
      ],
    }),
    answer: (a + 1) * (b + 1),
    unit: "개",
    hint: "가로 점선으로 몇 줄이 되고, 세로 점선으로 한 줄이 몇 칸이 되는지 세어 곱해요.",
    explanation: `${a + 1}줄, 한 줄에 ${b + 1}칸 → ${a + 1} × ${b + 1} = ${(a + 1) * (b + 1)}(개)`,
    mistakes: { [a * b]: "점선 수보다 줄과 칸의 수가 1씩 많아요.", [a + b + 1]: "줄 수와 칸 수를 곱해야 해요." },
  };
});

/* ── 3-1 분수 ── */

/** 모눈 칸을 색칠한 그림 */
function shadedCells(cells: number, cols: number): ShapeScene {
  const g = 26;
  const rows = Math.ceil(cells / cols);
  return scene(cols * g + 40, rows * g + 40, `모눈 ${cells}칸을 색칠한 부분`, {
    polygons: Array.from({ length: cells }, (_, i) => rect(20 + (i % cols) * g, 20 + Math.floor(i / cols) * g, 20 + ((i % cols) + 1) * g, 20 + (Math.floor(i / cols) + 1) * g, true)),
  });
}

export const fracWhole = hard("l3-frac-whole", (rand) => {
  const n = randInt(rand, 2, 6);
  const k = randInt(rand, 2, 6);
  const cols = k <= 3 ? k : pick(rand, [k, Math.ceil(k / 2)]);
  return {
    key: `${n}:${k}:${cols}`,
    prompt: `색칠한 부분은 어떤 도형 전체의 ${f(1, n)}입니다. 전체 도형은 모눈 몇 칸인가요?`,
    visual: shadedCells(k, cols),
    answer: n * k,
    unit: "칸",
    hint: `${f(1, n)}은 전체를 똑같이 ${josa(n, "으로/로")} 나눈 것 중 하나예요. 색칠한 부분이 ${n}개 있으면 전체가 돼요.`,
    explanation: `색칠한 부분 ${k}칸이 ${n}개 → ${k} × ${n} = ${n * k}(칸)`,
    mistakes: { [k]: "색칠한 부분은 전체가 아니라 전체의 일부예요." },
  };
});

export const fracCount = mid("l3-frac-count", (rand) => {
  const n = randInt(rand, 3, 12);
  const a = randInt(rand, 2, n - 1);
  const forward = rand() < 0.5;
  return {
    key: `${n}:${a}:${forward}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: forward ? `${f(1, n)}이 ${a}개인 수는 □/${n}` : `${f(a, n)}${pp(a, "은", "는")} ${f(1, n)}이 □개인 수`,
    answer: a,
    hint: `${f(a, n)}${pp(a, "은", "는")} ${f(1, n)}을 ${a}번 모은 수예요.`,
    explanation: `${f(1, n)}이 ${a}개 → ${f(a, n)}`,
  };
});

export const fracBetween = hard("l3-frac-between", (rand) => {
  const n = randInt(rand, 6, 12);
  const a = randInt(rand, 1, n - 4);
  const b = randInt(rand, a + 2, n - 1);
  return {
    key: `${n}:${a}:${b}`,
    prompt: "□ 안에 들어갈 수 있는 수는 모두 몇 개인가요?",
    expression: `${f(a, n)} < □/${n} < ${f(b, n)}`,
    answer: b - a - 1,
    unit: "개",
    hint: "분모가 같은 분수는 분자가 클수록 커요.",
    explanation: `${a} < □ < ${b}이므로 □는 ${span(a + 1, b - 1)} → ${b - a - 1}개`,
    mistakes: { [b - a + 1]: `□가 ${a}${pp(a, "이나", "나")} ${b}이면 크기가 같아져요.`, [b - a]: "양쪽 끝의 수는 들어갈 수 없어요." },
  };
});

export const fracEatWho = hard("l3-frac-eat-who", (rand) => {
  const n = randInt(rand, 8, 12);
  const [a, b] = [randInt(rand, 1, n - 3), randInt(rand, 1, n - 3)];
  const c = n - a - b;
  if (c < 1 || new Set([a, b, c]).size < 3) return null;
  const [A, B, C] = shuffle(rand, ["지우", "서아", "도하", "유나"]).slice(0, 3);
  const counts = [a, b, c];
  const names = [A, B, C];
  const answer = names[counts.indexOf(Math.max(...counts))];
  return {
    key: `${n}:${a}:${b}`,
    prompt: `피자 한 판을 똑같이 ${n}조각으로 나누어 ${A}는 전체의 ${f(a, n)}, ${B}는 전체의 ${f(b, n)}만큼 먹고, 남은 피자는 ${C}가 모두 먹었습니다. 피자를 가장 많이 먹은 사람은 누구인가요?`,
    answer,
    choices: [A, B, C, "모두 같습니다"],
    hint: `${C}가 먹은 조각 수를 먼저 구한 뒤, 분모가 같은 분수의 크기를 비교해요.`,
    explanation: `${C}: ${n} − ${a} − ${b} = ${c}조각 → ${A} ${f(a, n)}, ${B} ${f(b, n)}, ${C} ${f(c, n)} → ${answer}`,
  };
});

export const unitMax = mid("l3-unit-max", (rand) => {
  const n = randInt(rand, 3, 12);
  const big = rand() < 0.5;
  // 1/□ > 1/n → □ < n: 가장 큰 수 n − 1 / 1/□ < 1/n → □ > n: 가장 작은 수 n + 1
  return {
    key: `${n}:${big}`,
    prompt: `□ 안에 들어갈 수 있는 수 중에서 가장 ${big ? "큰" : "작은"} 수를 구하세요.`,
    expression: `1/□ ${big ? ">" : "<"} ${f(1, n)}`,
    answer: big ? n - 1 : n + 1,
    hint: "단위분수는 분모가 작을수록 커요.",
    explanation: big ? `분모가 ${n}보다 작아야 하므로 가장 큰 수는 ${n - 1}` : `분모가 ${n}보다 커야 하므로 가장 작은 수는 ${n + 1}`,
    mistakes: { [big ? n + 1 : n - 1]: "단위분수는 분모가 클수록 작아요." },
  };
});

export const unitBetween = hard("l3-unit-between", (rand) => {
  const b = randInt(rand, 2, 6);
  const a = randInt(rand, b + 2, 12);
  return {
    key: `${a}:${b}`,
    prompt: "□ 안에 들어갈 수 있는 수는 모두 몇 개인가요?",
    expression: `${f(1, a)} < 1/□ < ${f(1, b)}`,
    answer: a - b - 1,
    unit: "개",
    hint: "단위분수는 분모가 작을수록 커요. □는 어떤 수 사이에 있어야 할까요?",
    explanation: `${b} < □ < ${a}이므로 □는 ${span(b + 1, a - 1)} → ${a - b - 1}개`,
    mistakes: { [a - b + 1]: "양쪽 끝의 수를 넣으면 크기가 같아져요." },
  };
});

/* ── 3-1 소수 ── */

const READ = ["영", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];

export const decimalRead = mid("l3-dec-read", (rand) => {
  const t = randInt(rand, 1, 9);
  const toWord = rand() < 0.5;
  const answer = toWord ? `영 점 ${READ[t]}` : dec(t);
  const choices = toWord
    ? [answer, `${READ[t]} 점 영`, `점 ${READ[t]}`, `영 ${READ[t]}`]
    : [answer, String(t), `${t}.${t}`, String(t / 100)];
  return {
    key: `${t}:${toWord}`,
    prompt: toWord ? `${dec(t)}${pp(t, "을", "를")} 바르게 읽은 것을 고르세요.` : `'영 점 ${READ[t]}'${pp(t, "을", "를")} 소수로 바르게 쓴 것을 고르세요.`,
    answer,
    choices: shuffle(rand, choices),
    hint: "0.1, 0.2, 0.3과 같은 수를 소수라 하고 '.'은 '점'이라고 읽어요.",
    explanation: `${dec(t)} → 영 점 ${READ[t]}`,
  };
});

export const decimalMm = mid("l3-dec-mm", (rand) => {
  const t = randInt(rand, 1, 9);
  const toCm = rand() < 0.5;
  return {
    key: `${t}:${toCm}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: toCm ? `${t} mm = □ cm` : `${dec(t)} cm = □ mm`,
    answer: toCm ? dec(t) : t,
    hint: "1 mm는 1 cm를 똑같이 10으로 나눈 것 중 하나이므로 0.1 cm예요.",
    explanation: `${t} mm = ${dec(t)} cm`,
  };
});

export const decimalLeft = hard("l3-dec-left", (rand) => {
  const [a, b] = [randInt(rand, 1, 6), randInt(rand, 1, 6)];
  if (a + b >= 10) return null;
  const [A, B] = twoNames(rand);
  return {
    key: `${a}:${b}`,
    prompt: `케이크 한 개를 똑같이 10조각으로 나누어 ${A}가 ${a}조각, ${B}가 ${b}조각을 먹었습니다. 남은 케이크는 전체의 얼마인지 소수로 나타내세요.`,
    answer: dec(10 - a - b),
    hint: "남은 조각 수를 구한 뒤, 한 조각이 전체의 0.1임을 이용해요.",
    explanation: `남은 조각: 10 − ${a} − ${b} = ${10 - a - b}(조각) → 0.1이 ${10 - a - b}개 = ${dec(10 - a - b)}`,
    mistakes: { [dec(a + b)]: "먹은 양이 아니라 남은 양을 구해야 해요." },
  };
});

export const decimalBetween = hard("l3-dec-between", (rand) => {
  const a = randInt(rand, 1, 6);
  const b = randInt(rand, a + 2, 9);
  return {
    key: `${a}:${b}`,
    prompt: `0.1이 □개인 수는 ${dec(a)}보다 크고 ${dec(b)}보다 작습니다. □ 안에 들어갈 수 있는 수는 모두 몇 개인가요?`,
    answer: b - a - 1,
    unit: "개",
    hint: `${dec(a)}${pp(a, "은", "는")} 0.1이 ${a}개, ${dec(b)}${pp(b, "은", "는")} 0.1이 ${b}개인 수예요.`,
    explanation: `${a} < □ < ${b} → □는 ${span(a + 1, b - 1)} → ${b - a - 1}개`,
    mistakes: { [b - a + 1]: "양쪽 끝의 수는 들어갈 수 없어요." },
  };
});

export const decimalWrite = easy("l3-dec-write", (rand) => {
  const w = randInt(rand, 1, 9);
  const t = randInt(rand, 1, 9);
  const byTenths = rand() < 0.5;
  return {
    key: `${w}:${t}:${byTenths}`,
    prompt: byTenths ? `${w}${pp(w, "과", "와")} 0.${t}만큼을 소수로 나타내세요.` : `'${READ[w]} 점 ${READ[t]}'${pp(t, "을", "를")} 소수로 쓰세요.`,
    answer: `${w}.${t}`,
    hint: "소수점 왼쪽에 수를 쓰고 점을 찍은 뒤, 0.1이 몇 개인지를 소수점 오른쪽에 써요.",
    explanation: `${w}${pp(w, "과", "와")} 0.${t} → ${w}.${t}`,
  };
});

export const decimalCards = hard("l3-dec-cards", (rand) => {
  const cards = cardsOf(rand, 3, 1);
  const big = rand() < 0.5;
  const s = [...cards].sort((x, y) => (big ? y - x : x - y));
  return {
    key: `${[...cards].sort().join("")}:${big}`,
    prompt: `수 카드 ${cards.join(", ")} 중에서 2장을 골라 □.□ 모양의 소수를 만들려고 합니다. 만들 수 있는 가장 ${big ? "큰" : "작은"} 소수를 구하세요.`,
    answer: `${s[0]}.${s[1]}`,
    hint: `소수점 왼쪽에 가장 ${big ? "큰" : "작은"} 수를 놓아요.`,
    explanation: `${s[0]}.${s[1]}`,
    mistakes: { [`${s[1]}.${s[0]}`]: "소수점 왼쪽의 수가 크기를 먼저 정해요." },
  };
});

export const decimalBox = mid("l3-dec-box", (rand) => {
  const w = randInt(rand, 1, 9);
  const t = randInt(rand, 1, 8);
  const small = rand() < 0.5;
  // w.□ > w.t → 가장 작은 수 t + 1 / w.□ < w.(t+1) → 가장 큰 수 t
  return {
    key: `${w}:${t}:${small}`,
    prompt: `□ 안에 들어갈 수 있는 수 중에서 가장 ${small ? "작은" : "큰"} 수를 구하세요.`,
    expression: small ? `${w}.□ > ${w}.${t}` : `${w}.□ < ${w}.${t + 1}`,
    answer: small ? t + 1 : t,
    hint: "소수점 왼쪽의 수가 같으면 소수점 오른쪽 숫자를 비교해요.",
    explanation: small ? `□는 ${t}보다 커야 하므로 ${t + 1}` : `□는 ${t + 1}보다 작아야 하므로 ${t}`,
    mistakes: { [small ? t : t + 1]: "같으면 크기가 같아져요." },
  };
});

export const decimalCond = hard("l3-dec-cond", (rand) => {
  const w = randInt(rand, 1, 8);
  const d = randInt(rand, 2, 7);
  return {
    key: `${w}:${d}`,
    prompt: `다음 조건을 모두 만족하는 소수는 모두 몇 개인가요?\n· 0.1이 몇 개인 수입니다.\n· ${w}보다 크고 ${w + 1}보다 작습니다.\n· 소수점 오른쪽 숫자는 ${d}보다 큽니다.`,
    answer: 9 - d,
    unit: "개",
    hint: `${w}보다 크고 ${w + 1}보다 작은 수 중에서 0.1이 몇 개인 수는 ${w}.1부터 ${w}.9까지예요.`,
    explanation: `${Array.from({ length: 9 - d }, (_, i) => `${w}.${d + 1 + i}`).join(", ")} → ${9 - d}개`,
    mistakes: { [10 - d]: `소수점 오른쪽 숫자가 ${d}인 수는 빼야 해요.` },
  };
});

/* ── 3-2 분수로 나타내기 ── */

/** 전체 a를 b씩 묶기: n묶음 */
const grouping = (rand: () => number) => {
  const b = randInt(rand, 2, 6);
  const n = randInt(rand, 3, 6);
  return { a: b * n, b, n };
};

/** b개씩 한 줄에 놓은 구슬 n줄(묶음 구조와 같은 배열) */
function rowsOfDots(b: number, n: number): ShapeScene {
  const g = 26;
  return scene(b * g + 30, n * g + 30, `구슬을 한 줄에 ${b}개씩 놓은 그림`, {
    circles: Array.from({ length: b * n }, (_, i) => ({ c: [15 + g / 2 + (i % b) * g, 15 + g / 2 + Math.floor(i / b) * g] as Pt, r: 9 })),
  });
}

export const groupCount = easy("l3-fg-count", (rand) => {
  const { a, b, n } = grouping(rand);
  return {
    key: `${a}:${b}`,
    prompt: `구슬 ${a}개를 ${b}개씩 묶으면 몇 묶음이 되나요?`,
    visual: rowsOfDots(b, n),
    answer: n,
    unit: "묶음",
    hint: `그림에서 ${b}개씩 묶어 보세요.`,
    explanation: `${b}개씩 ${n}묶음 → ${a} ÷ ${b} = ${n}(묶음)`,
  };
});

export const groupFrac = mid("l3-fg-frac", (rand) => {
  const { a, b, n } = grouping(rand);
  const k = randInt(rand, 1, n - 1);
  const answer = f(k, n);
  const v = groupsScene(b, n, `구슬 ${a}개를 ${b}개씩 묶고 그중 ${k}묶음을 색칠한 그림`);
  v.polygons = v.polygons!.map((p, i) => (i < k ? { ...p, fill: true } : p));
  return {
    key: `${a}:${b}:${k}`,
    prompt: `구슬 ${a}개를 ${b}개씩 묶었습니다. 색칠한 묶음의 구슬은 전체의 몇 분의 몇인가요?`,
    visual: v,
    answer,
    // 가분수는 뒤 차시(frac-kinds)에서 배우므로 오답도 진분수만(색칠하지 않은 묶음, 구슬 수를 분모로, 한 묶음의 구슬 수를 분모로)
    choices: choices4(rand, answer, properOnly([[n - k, n], [k, a], [k, b], [k * b, n]]), () => f(randInt(rand, 1, n - 1), n + randInt(rand, 1, 3))),
    hint: "전체 묶음 수가 분모, 색칠한 묶음 수가 분자예요.",
    explanation: `${n}묶음 중 ${k}묶음 → ${answer} (구슬 ${k * b}개는 ${a}개의 ${answer})`,
  };
});

export const groupBoxFrac = mid("l3-fg-box", (rand) => {
  const { a, b, n } = grouping(rand);
  const k = randInt(rand, 1, n - 1);
  return {
    key: `${a}:${b}:${k}`,
    prompt: `${eul(a)} □씩 묶으면 ${k * b}${pp(k * b, "은", "는")} ${a}의 ${f(k, n)}입니다. □ 안에 알맞은 수를 구하세요.`,
    answer: b,
    hint: `분모 ${n}${pp(n, "은", "는")} 전체 묶음 수예요. ${eul(a)} ${n}묶음으로 나누면 한 묶음은 얼마일까요?`,
    explanation: `${a} ÷ ${n} = ${b}`,
    mistakes: { [n]: "분모는 묶음 수예요. 한 묶음에 몇 개인지 구해야 해요." },
  };
});

export const groupLeft = hard("l3-fg-left", (rand) => {
  const { a, b, n } = grouping(rand);
  const k = randInt(rand, 1, n - 1);
  const answer = f(n - k, n);
  return {
    key: `${a}:${b}:${k}`,
    prompt: `사과 ${a}개를 한 봉지에 ${b}개씩 담았습니다. 그중 ${k}봉지를 이웃에게 주었다면 남은 사과는 전체의 몇 분의 몇인가요?`,
    answer,
    choices: choices4(rand, answer, properOnly([[k, n], [n - k, a], [a - k * b, n], [n - k, b]]), () => f(randInt(rand, 1, n - 1), n + 1)),
    hint: "전체 봉지 수를 구하고, 남은 봉지 수를 세어 보세요.",
    explanation: `전체 ${n}봉지 중 남은 것은 ${n - k}봉지 → ${answer}`,
  };
});

export const groupRev = hard("l3-fg-rev", (rand) => {
  const { a, b, n } = grouping(rand);
  const k = randInt(rand, 1, n - 1);
  return {
    key: `${a}:${b}:${k}`,
    prompt: `어떤 수를 ${b}씩 묶었더니 ${k * b}${pp(k * b, "은", "는")} 어떤 수의 ${f(k, n)}입니다. 어떤 수는 얼마인가요?`,
    answer: a,
    hint: `${f(k, n)}${pp(k, "은", "는")} ${n}묶음 중 ${k}묶음이라는 뜻이에요.`,
    explanation: `한 묶음이 ${b}이고 모두 ${n}묶음 → ${b} × ${n} = ${a}`,
    mistakes: { [k * b * n]: `${k * b}${pp(k * b, "은", "는")} ${k}묶음이에요. 한 묶음의 수로 계산해요.` },
  };
});

/* ── 3-2 분수만큼은 얼마인가요 ── */

export const fracOfBox = mid("l3-fo-box", (rand) => {
  const n = randInt(rand, 2, 9);
  const m = randInt(rand, 1, n - 1);
  const u = randInt(rand, 2, 9);
  return {
    key: `${n}:${m}:${u}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: `□의 ${f(m, n)}${pp(m, "은", "는")} ${m * u}`,
    answer: n * u,
    hint: `먼저 □의 ${f(1, n)}을 구해요.`,
    explanation: `□의 ${f(1, n)}은 ${m * u} ÷ ${m} = ${u}, □ = ${u} × ${n} = ${n * u}`,
    mistakes: { [m * u * n]: `${f(m, n)}만큼은 ${m}묶음이에요. 한 묶음을 먼저 구해요.` },
  };
});

export const fracOfWho = hard("l3-fo-who", (rand) => {
  const [A, B] = twoNames(rand);
  const [n1, n2] = [randInt(rand, 2, 6), randInt(rand, 2, 6)];
  const [m1, m2] = [randInt(rand, 1, n1 - 1), randInt(rand, 1, n2 - 1)];
  const [u1, u2] = [randInt(rand, 2, 8), randInt(rand, 2, 8)];
  const [a, b] = [n1 * u1, n2 * u2];
  const x = m1 * u1;
  const y = m2 * u2;
  if (x === y) return null;
  const d = Math.abs(x - y);
  const W = x > y ? A : B;
  const L = x > y ? B : A;
  const answer = `${W}, ${d}개`;
  return {
    key: `${a}:${m1}/${n1}:${b}:${m2}/${n2}`,
    prompt: `${A}는 구슬 ${a}개의 ${f(m1, n1)}${pp(m1, "을", "를")}, ${B}는 구슬 ${b}개의 ${f(m2, n2)}${pp(m2, "을", "를")} 동생에게 주었습니다. 누가 몇 개 더 많이 주었나요?`,
    answer,
    choices: shuffle(rand, [answer, `${L}, ${d}개`, `${W}, ${d + 1}개`, `${L}, ${d + 1}개`]),
    hint: "각자 준 구슬의 수를 분수만큼 구해 비교해요.",
    explanation: `${A}: ${a}의 ${f(m1, n1)} = ${x}, ${B}: ${b}의 ${f(m2, n2)} = ${y} → ${W}가 ${d}개 더`,
  };
});

export const fracOfMeter = easy("l3-fl-m", (rand) => {
  const n = pick(rand, [2, 4, 5, 10]);
  const m = randInt(rand, 1, n - 1);
  return {
    key: `${n}:${m}`,
    prompt: `1 m의 ${f(m, n)}${pp(m, "은", "는")} 몇 cm인가요?`,
    answer: (100 / n) * m,
    unit: "cm",
    hint: `1 m = 100 cm예요. 100의 ${f(1, n)}부터 구해요.`,
    explanation: `100 ÷ ${n} = ${100 / n}, ${100 / n} × ${m} = ${(100 / n) * m}(cm)`,
  };
});

export const fracOfDay = mid("l3-fl-day", (rand) => {
  const n = pick(rand, [3, 4, 6, 8, 12]);
  const m = randInt(rand, 1, n - 1);
  // 잠자는 시간이 현실적이게(하루의 3/8 = 9시간 이하, 1/4 = 6시간 이상)
  if (m / n > 3 / 8 || m / n < 1 / 4) return null;
  return {
    key: `${n}:${m}`,
    prompt: `하루 24시간 중 ${f(m, n)}만큼 잠을 잤습니다. 잠을 잔 시간은 몇 시간인가요?`,
    answer: (24 / n) * m,
    unit: "시간",
    hint: `24시간의 ${f(1, n)}을 먼저 구해요.`,
    explanation: `24 ÷ ${n} = ${24 / n}, ${24 / n} × ${m} = ${(24 / n) * m}(시간)`,
  };
});

export const fracOfHour = mid("l3-fl-hour", (rand) => {
  const n = pick(rand, [2, 3, 4, 5, 6, 10, 12]);
  const m = randInt(rand, 1, n - 1);
  return {
    key: `${n}:${m}`,
    prompt: `1시간의 ${f(m, n)}${pp(m, "은", "는")} 몇 분인가요?`,
    answer: (60 / n) * m,
    unit: "분",
    hint: `1시간 = 60분이에요. 60의 ${f(1, n)}부터 구해요.`,
    explanation: `60 ÷ ${n} = ${60 / n}, ${60 / n} × ${m} = ${(60 / n) * m}(분)`,
  };
});

export const fracTape = hard("l3-fl-tape", (rand) => {
  const n = pick(rand, [3, 4, 5, 6]);
  const m = randInt(rand, 1, n - 1);
  const u = randInt(rand, 2, 12) * 2;
  const a = n * u;
  const left = a - m * u;
  return {
    key: `${a}:${n}:${m}`,
    prompt: `${nameOf(rand)}는 길이가 ${a} cm인 색 테이프의 ${f(m, n)}${pp(m, "을", "를")} 사용하고, 남은 색 테이프의 반을 동생에게 주었습니다. 지금 가지고 있는 색 테이프는 몇 cm인가요?`,
    answer: left / 2,
    unit: "cm",
    hint: "사용한 길이 → 남은 길이 → 그 반, 순서로 구해요.",
    explanation: `사용: ${a}의 ${f(m, n)} = ${m * u}(cm), 남은 것: ${a} − ${m * u} = ${left}(cm), 반: ${left} ÷ 2 = ${left / 2}(cm)`,
    mistakes: { [left]: "남은 색 테이프의 반을 주었어요." },
  };
});

export const fracTapeRev = hard("l3-fl-rev", (rand) => {
  const n = pick(rand, [2, 3, 4, 5]);
  const u = randInt(rand, 3, 20);
  const left = u * (n - 1);
  return {
    key: `${n}:${u}`,
    prompt: `끈의 ${f(1, n)}을 잘라 쓰고 나니 ${left} cm가 남았습니다. 처음 끈의 길이는 몇 cm인가요?`,
    answer: u * n,
    unit: "cm",
    hint: `남은 끈은 전체의 ${josa(f(n - 1, n), "이에요/예요")}.`,
    explanation: `${f(n - 1, n)}${pp(n - 1, "이", "가")} ${left} cm → ${f(1, n)}은 ${u} cm → 전체 ${u} × ${n} = ${u * n}(cm)`,
    mistakes: { [left * n]: `남은 끈은 전체의 ${josa(f(n - 1, n), "이에요/예요")}.` },
  };
});

/* ── 3-2 진분수·가분수·대분수 ── */

export const properPick = easy("l3-fp-kind", (rand) => {
  const proper = rand() < 0.5;
  const d = randInt(rand, 3, 9);
  const mk = (p: boolean) => f(p ? randInt(rand, 1, d - 1) : randInt(rand, d, 2 * d), d);
  const answer = mk(proper);
  const set = new Set([answer]);
  for (let i = 0; set.size < 4 && i < 50; i++) set.add(mk(!proper));
  if (set.size < 4) return null;
  const kind = proper ? "진분수" : "가분수";
  return {
    key: `${[...set].join()}`,
    prompt: `${kind}를 고르세요.`,
    answer,
    choices: shuffle(rand, [...set]),
    hint: "분자가 분모보다 작으면 진분수, 분자가 분모와 같거나 크면 가분수예요.",
    explanation: `${answer} → ${kind}`,
  };
});

export const improperCount = mid("l3-fp-count", (rand) => {
  const n = randInt(rand, 2, 9);
  const m = randInt(rand, n + 2, n + 9);
  return {
    key: `${n}:${m}`,
    prompt: `분모가 ${n}인 가분수 중에서 분자가 ${m}보다 작은 분수는 모두 몇 개인가요?`,
    answer: m - n,
    unit: "개",
    hint: `가분수는 분자가 분모와 같거나 커요. ${f(n, n)}부터 세어 보세요.`,
    explanation: `${f(n, n)}부터 ${f(m - 1, n)}까지 ${m - n}개`,
    mistakes: { [m - n - 1]: `${f(n, n)}도 가분수예요.` },
  };
});

export const properBox = mid("l3-fp-box", (rand) => {
  const n = randInt(rand, 3, 12);
  const proper = rand() < 0.5;
  return {
    key: `${n}:${proper}`,
    prompt: proper
      ? `진분수 □/${n}에서 □ 안에 들어갈 수 있는 자연수 중에서 가장 큰 수를 구하세요.`
      : `가분수 ${n}/□에서 □ 안에 들어갈 수 있는 자연수 중에서 가장 큰 수를 구하세요.`,
    answer: proper ? n - 1 : n,
    hint: proper ? "진분수는 분자가 분모보다 작아요." : "가분수는 분자가 분모와 같거나 커요.",
    explanation: proper ? `분자는 ${n}보다 작아야 하므로 ${n - 1}` : `분모는 ${josa(n, "과/와")} 같거나 작아야 하므로 ${n}`,
    mistakes: proper ? { [n]: `${f(n, n)}${pp(n, "은", "는")} 가분수예요.` } : { [n - 1]: "분자와 분모가 같아도 가분수예요." },
  };
});

export const fracCond = hard("l3-fp-cond", (rand) => {
  const d = randInt(rand, 2, 9);
  const n = randInt(rand, d + 1, d + 9);
  const answer = f(n, d);
  return {
    key: `${n}:${d}`,
    prompt: `다음 조건을 모두 만족하는 분수를 고르세요.\n· 가분수입니다.\n· 분모와 분자의 합은 ${n + d}입니다.\n· 분자와 분모의 차는 ${n - d}입니다.`,
    answer,
    choices: choices4(rand, answer, [f(d, n), f(n + 1, d), f(n, d + 1)], () => f(randInt(rand, 2, 18), randInt(rand, 2, 9))),
    hint: "합과 차를 모두 만족하는 두 수를 찾고, 가분수이므로 큰 수가 분자예요.",
    explanation: `${n} + ${d} = ${n + d}, ${n} − ${d} = ${n - d}이고 가분수 → ${answer}`,
  };
});

export const naturalToFrac = easy("l3-fm-nat", (rand) => {
  const a = randInt(rand, 1, 5);
  const n = randInt(rand, 2, 9);
  return {
    key: `${a}:${n}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: `${a} = □/${n}`,
    answer: a * n,
    hint: `1 = ${josa(f(n, n), "이에요/예요")}.`,
    explanation: `1 = ${f(n, n)}이므로 ${a} = ${f(a * n, n)}`,
  };
});

export const mixedCards = hard("l3-fm-cards", (rand) => {
  const cards = cardsOf(rand, 3, 1);
  const big = rand() < 0.5;
  const [x, y, z] = [...cards].sort((p, q) => q - p);
  const answer = big ? `${x} ${z}/${y}` : `${z} ${y}/${x}`;
  const others = big ? [`${y} ${z}/${x}`, `${z} ${y}/${x}`, `${x} ${y}/${z}`] : [`${y} ${z}/${x}`, `${x} ${z}/${y}`, `${z} ${x}/${y}`];
  return {
    key: `${[...cards].sort().join("")}:${big}`,
    prompt: `수 카드 ${cardList(cards)} 한 번씩 모두 사용하여 대분수를 만들려고 합니다. 만들 수 있는 가장 ${big ? "큰" : "작은"} 대분수를 고르세요.`,
    answer,
    // 값이 같은 보기(3 6/4와 4 3/6)는 다른 배치로 바꾼다
    choices: makeChoices(rand, answer, others, () => {
      const [p, q, r] = shuffle(rand, cards);
      return `${p} ${q}/${r}`;
    }),
    hint: `자연수 부분에 가장 ${big ? "큰" : "작은"} 수를 놓고, 남은 두 수로 진분수를 만들어요.`,
    explanation: `자연수 부분 ${big ? x : z}, 진분수 ${big ? f(z, y) : f(y, x)} → ${answer}`,
  };
});

export const mixedCount = hard("l3-fm-count", (rand) => {
  const n = randInt(rand, 3, 9);
  const a = randInt(rand, 1, 4);
  const b = a + randInt(rand, 1, 2);
  return {
    key: `${n}:${a}:${b}`,
    prompt: `분모가 ${n}인 대분수 중에서 ${a}보다 크고 ${b}보다 작은 수는 모두 몇 개인가요?`,
    answer: (b - a) * (n - 1),
    unit: "개",
    hint: `자연수 부분이 될 수 있는 수와, 분모가 ${n}인 진분수의 개수를 생각해요.`,
    explanation: `자연수 부분 ${b - a}가지(${Array.from({ length: b - a }, (_, i) => a + i).join(", ")}) × 진분수 ${n - 1}가지 = ${(b - a) * (n - 1)}(개)`,
    mistakes: { [n - 1]: "자연수 부분이 될 수 있는 수가 여러 개인지 확인해요." },
  };
});

export const mixedLargest = mid("l3-fc2-largest", (rand) => {
  const d = randInt(rand, 3, 9);
  const set = new Set<number>();
  while (set.size < 4) set.add(randInt(rand, d + 1, 4 * d));
  const nums = [...set].filter((x) => x % d !== 0);
  if (nums.length < 4) return null;
  const most = rand() < 0.5;
  const target = most ? Math.max(...nums) : Math.min(...nums);
  const show = (x: number, i: number) => (i % 2 === 0 ? mixedText(x, d) : f(x, d));
  const choices = nums.map(show);
  const answer = choices[nums.indexOf(target)];
  return {
    key: `${d}:${nums.join()}:${most}`,
    prompt: `가장 ${most ? "큰" : "작은"} 분수를 고르세요.`,
    answer,
    choices,
    hint: "대분수를 가분수로 바꾸어 분자끼리 비교해요.",
    explanation: nums.map((x) => `${mixedText(x, d)} = ${f(x, d)}`).join(", "),
  };
});

export const mixedWho = hard("l3-fc2-who", (rand) => {
  const [A, B] = twoNames(rand);
  const d = randInt(rand, 3, 9);
  const x = randInt(rand, d + 1, 4 * d);
  const y = randInt(rand, d + 1, 4 * d);
  if (x % d === 0) return null;
  const answer = x > y ? A : x < y ? B : "길이가 같습니다";
  return {
    key: `${d}:${x}:${y}`,
    prompt: `${A}가 가진 끈은 ${mixedText(x, d)} m이고, ${B}가 가진 끈은 ${f(y, d)} m입니다. 누구의 끈이 더 긴가요?`,
    answer,
    choices: [A, B, "길이가 같습니다", "알 수 없습니다"],
    hint: "대분수를 가분수로 바꾸어 비교해요.",
    explanation: `${mixedText(x, d)} = ${f(x, d)}, ${f(y, d)} → ${answer}`,
  };
});
