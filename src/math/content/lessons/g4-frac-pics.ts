import { randInt, shuffle } from "../../lib/random";
import { josa } from "../josa";
import { COMPARE_CHOICES, sign } from "../generators/common";
import { mixedText } from "../generators/grade4";
import { scene, type Pt } from "./g3-figures";
import { BASIC_FIG_WEIGHT, figGen, fj, fracBar, grid10, gridCells, hundredths, jumpArrow, numberLine, tenths, valueChoices } from "./frac-dec-figs";

/**
 * 4학년 분수·소수 그림 유형(R2b): 4-2 분수의 덧셈과 뺄셈(분수 막대·수직선),
 * 소수의 덧셈과 뺄셈(모눈 100칸, 0.01·0.001 수직선, 뛰어 세기 수직선).
 * 계산 결과가 가분수이면 대분수로 쓴다(mixedText).
 */

const f = (n: number, d: number) => `${n}/${d}`;
const m = mixedText;

/* ── 분수의 덧셈과 뺄셈 ── */

export const fracBarAdd = figGen("l4-fbar-add", 1, (rand) => {
  const d = randInt(rand, 4, 10);
  const a = randInt(rand, 1, d - 1);
  const b = randInt(rand, 1, d - 1);
  const answer = m(a + b, d);
  return {
    key: `${d}:${a}:${b}`,
    prompt: "막대 하나의 크기가 1입니다. 두 막대에 색칠한 부분을 모두 더하면 얼마인지 고르세요.",
    expression: `${f(a, d)} + ${f(b, d)}`,
    visual: scene(300, 96, `${d}칸으로 나눈 막대 2개에 ${a}칸, ${b}칸 색칠`, fracBar(20, 14, 260, 28, d, a), fracBar(20, 56, 260, 28, d, b)),
    answer,
    choices: valueChoices(rand, answer, [f(a + b, d + d), m(a + b + 1, d), m(Math.abs(a - b), d), m(a + b - 1, d)], () => m(randInt(rand, 1, 2 * d - 1), d)),
    hint: `색칠한 칸은 모두 1/${d}이 몇 개인지 세어 보세요. 분모는 그대로예요.`,
    explanation: `1/${d}이 ${a} + ${b} = ${a + b}(개) → ${f(a + b, d)}${a + b >= d ? ` = ${answer}` : ""}`,
    mistakes: { [f(a + b, d + d)]: "분모끼리는 더하지 않아요." },
  };
}, BASIC_FIG_WEIGHT);

/** 0부터 2까지 한 칸이 1/d인 수직선(폭 240) */
const fracLine2 = (d: number) => ({ x0: 30, y: 78, step: Math.round((120 / d) * 10) / 10, ticks: 2 * d, major: d });

export const fracLineAdd = figGen("l4-fline-add", 2, (rand) => {
  const d = randInt(rand, 3, 8);
  const a = randInt(rand, 1, d - 1);
  const b = randInt(rand, 1, d - 1);
  const line = fracLine2(d);
  const answer = `${f(a, d)} + ${f(b, d)}`;
  // 틀린 식: 화살표를 한두 칸 더·덜 셈, 두 번째 화살표를 끝 눈금으로 읽음.
  // 진분수 덧셈 차시이므로 분자 < 분모인 식을 먼저 쓰고, 모자랄 때만 가분수가 든 식을 쓴다.
  // 순서만 바꾼 식(b/d + a/d)은 값이 같아 정답·다른 보기와 두 수가 같은 식은 넣지 않는다
  const cands: [number, number][] = [[a + 1, b], [a, b + 1], [a - 1, b], [a, b - 1], [a + 1, b + 1], [a - 1, b - 1], [a + 2, b], [a, b + 2], [a - 2, b], [a, b - 2], [a, a + b], [a + b, b]];
  const pairKey = ([x, y]: [number, number]) => [x, y].sort((p, q) => p - q).join();
  const used = new Set([pairKey([a, b])]);
  const proper = ([x, y]: [number, number]) => x < d && y < d;
  const wrongs: string[] = [];
  for (const c of [...cands.filter(proper), ...cands.filter((c) => !proper(c))]) {
    if (wrongs.length === 3 || c[0] < 1 || c[1] < 1 || used.has(pairKey(c))) continue;
    used.add(pairKey(c));
    wrongs.push(`${f(c[0], d)} + ${f(c[1], d)}`);
  }
  return {
    key: `${d}:${a}:${b}`,
    prompt: "수직선에 나타낸 덧셈식을 고르세요.",
    visual: scene(
      300,
      112,
      `0부터 2까지 1을 ${d}칸으로 나눈 수직선에 0에서 ${a}칸, 이어서 ${b}칸 간 화살표`,
      numberLine({ ...line, labels: [0, 1, 2].map((n) => ({ at: n * d, text: String(n) })) }),
      jumpArrow(line, 0, a, line.y - 20),
      jumpArrow(line, a, a + b, line.y - 42),
    ),
    answer,
    choices: shuffle(rand, [answer, ...wrongs]),
    hint: `작은 눈금 한 칸은 1/${d}이에요. 화살표마다 몇 칸인지 세어 보세요.`,
    explanation: `첫 번째 화살표 ${a}칸 → ${f(a, d)}, 두 번째 화살표 ${b}칸 → ${f(b, d)} → ${answer} = ${m(a + b, d)}`,
  };
});

export const fracBarSub = figGen("l4-fbar-sub", 1, (rand) => {
  const d = randInt(rand, 4, 10);
  const a = randInt(rand, 2, d - 1);
  const b = randInt(rand, 1, a - 1);
  const answer = f(a - b, d);
  return {
    key: `${d}:${a}:${b}`,
    prompt: "막대 하나의 크기가 1입니다. 색칠한 부분에서 ×표 한 만큼 덜어 내면 남는 부분은 얼마인지 고르세요.",
    expression: `${f(a, d)} − ${f(b, d)}`,
    visual: scene(300, 60, `${d}칸으로 나눈 막대에 ${a}칸 색칠, 그중 ${b}칸에 ×표`, fracBar(20, 14, 260, 32, d, a, [a - b, a])),
    answer,
    choices: valueChoices(rand, answer, [f(b, d), m(a + b, d), f(a - b + 1, d)], () => m(randInt(rand, 1, 2 * d), d)),
    hint: `색칠한 칸 중 ×표가 없는 칸은 1/${d}이 몇 개인지 세어 보세요.`,
    explanation: `1/${d}이 ${a} − ${b} = ${a - b}(개) → ${answer}`,
    mistakes: { [f(b, d)]: "덜어 낸 부분이 아니라 남는 부분을 구해요." },
  };
}, BASIC_FIG_WEIGHT);

export const wholeBarSub = figGen("l4-fbar-whole-sub", 1, (rand) => {
  const d = randInt(rand, 3, 8);
  const w = randInt(rand, 2, 3);
  const k = randInt(rand, 1, d - 1);
  const answer = m(w * d - k, d);
  return {
    key: `${d}:${w}:${k}`,
    prompt: "막대 하나의 크기가 1입니다. 색칠한 부분에서 ×표 한 만큼 덜어 내면 남는 부분은 얼마인지 고르세요.",
    expression: `${w} − ${f(k, d)}`,
    visual: scene(300, w * 38 + 14, `모두 색칠한 ${d}칸 막대 ${w}개, 마지막 막대의 끝 ${k}칸에 ×표`, ...Array.from({ length: w }, (_, i) => fracBar(20, 12 + i * 38, 260, 26, d, d, i === w - 1 ? [d - k, d] : undefined))),
    answer,
    choices: valueChoices(rand, answer, [`${w - 1} ${f(k, d)}`, `${w} ${f(d - k, d)}`, m(w * d - k - 1, d), m(w * d - k + 1, d)], () => m(randInt(rand, (w - 1) * d + 1, w * d - 1), d)),
    hint: `마지막 막대 1을 ${fj(f(d, d), "으로/로")} 보고, ×표 없는 칸을 세어 보세요.`,
    explanation: `${w} = ${w - 1} ${f(d, d)} → ${w - 1} ${f(d, d)} − ${f(k, d)} = ${answer}`,
    mistakes: { [`${w - 1} ${f(k, d)}`]: "덜어 낸 칸이 아니라 남는 칸을 세어요." },
  };
}, BASIC_FIG_WEIGHT);

/* ── 소수 두 자리 수·세 자리 수 ── */

export const gridDecimal = figGen("l4-grid-dec", 1, (rand) => {
  const n = rand() < 0.2 ? randInt(rand, 1, 9) : randInt(rand, 11, 99);
  const answer = hundredths(n);
  const mistakes: Record<string, string> = { [n]: "색칠한 칸 수를 소수로 나타내요. 한 칸은 0.01이에요." };
  if (n < 10) mistakes[tenths(n)] = `0.01이 ${n}개이면 ${josa(answer, "이에요/예요")}.`;
  return {
    key: `${n}`,
    prompt: "모눈종이 전체의 크기가 1입니다. 색칠한 부분을 소수로 나타내세요.",
    visual: scene(300, 180, `100칸 모눈종이에 ${n}칸 색칠`, grid10(70, 10, 16, gridCells(n))),
    answer,
    hint: "모눈 한 칸은 1을 똑같이 100으로 나눈 것 중 하나이므로 0.01이에요. 한 줄(10칸)은 0.1이에요.",
    explanation: `0.1이 ${Math.floor(n / 10)}개, 0.01이 ${n % 10}개 → 0.01이 ${n}개 → ${answer}`,
    mistakes,
  };
}, BASIC_FIG_WEIGHT);

/** 수직선 한 칸 = 1/10 × 단위(unit): 시작 눈금 값 start(정수, unit의 배수 단위) */
function fineLine(startUnits: number, scale: number, k: number, what: string) {
  const line = { x0: 30, y: 62, step: 24, ticks: 10, major: 10, mid: 5 };
  const label = (u: number) => String(u / scale);
  return scene(
    300,
    96,
    `${label(startUnits)}부터 ${label(startUnits + 1)}까지 ${what} 눈금 10칸 수직선과 ㉠`,
    numberLine({ ...line, labels: [{ at: 0, text: label(startUnits) }, { at: 10, text: label(startUnits + 1) }], marks: [{ at: k, text: "㉠" }] }),
  );
}

export const decLineHundredths = figGen("l4-dec-line-hund", 2, (rand) => {
  const s = randInt(rand, 0, 59); // 시작 = s/10
  const k = randInt(rand, 1, 9);
  const answer = hundredths(s * 10 + k);
  return {
    key: `${s}:${k}`,
    prompt: "수직선에서 ㉠이 나타내는 소수를 쓰세요.",
    visual: fineLine(s, 10, k, "0.01"),
    answer,
    hint: `${fj(tenths(s), "과/와")} ${tenths(s + 1)} 사이를 똑같이 10칸으로 나누었으므로 작은 눈금 한 칸은 0.01이에요.`,
    explanation: `${tenths(s)}에서 0.01씩 ${k}칸 → ${answer}`,
    mistakes: { [tenths(s + k)]: "작은 눈금 한 칸은 0.1이 아니라 0.01이에요." },
  };
});

export const decLineThousandths = figGen("l4-dec-line-thou", 2, (rand) => {
  const s = randInt(rand, 1, 399); // 시작 = s/100
  const k = randInt(rand, 1, 9);
  const answer = String((s * 10 + k) / 1000);
  return {
    key: `${s}:${k}`,
    prompt: "수직선에서 ㉠이 나타내는 소수를 쓰세요.",
    visual: fineLine(s, 100, k, "0.001"),
    answer,
    hint: `${fj(hundredths(s), "과/와")} ${hundredths(s + 1)} 사이를 똑같이 10칸으로 나누었으므로 작은 눈금 한 칸은 0.001이에요.`,
    explanation: `${hundredths(s)}에서 0.001씩 ${k}칸 → ${answer}`,
    mistakes: { [hundredths(s + k)]: "작은 눈금 한 칸은 0.01이 아니라 0.001이에요." },
  };
});

/* ── 소수의 크기 비교 ── */

export const gridCompare = figGen("l4-grid-cmp", 1, (rand) => {
  let a: number;
  let b: number;
  const same = rand() < 0.15;
  if (same) a = b = randInt(rand, 1, 9) * 10;
  else {
    a = rand() < 0.5 ? randInt(rand, 1, 9) * 10 : randInt(rand, 1, 99);
    b = randInt(rand, 1, 99);
    while (b === a) b = randInt(rand, 1, 99);
  }
  // 같은 크기는 한쪽을 끝에 0을 붙여 쓴다(0.4 = 0.40)
  const texts = [hundredths(a), same ? `${hundredths(b)}0` : hundredths(b)];
  const answer = sign(a, b);
  return {
    key: `${a}:${b}`,
    prompt: "모눈종이 전체의 크기가 1입니다. 그림을 보고 ○ 안에 >, =, < 중 알맞은 것을 고르세요.",
    expression: `${texts[0]} ○ ${texts[1]}`,
    visual: scene(300, 164, `100칸 모눈종이 2개에 ${a}칸, ${b}칸 색칠`, grid10(20, 10, 12, gridCells(a)), grid10(160, 10, 12, gridCells(b)), {
      texts: [
        { at: [80, 148] as Pt, text: texts[0] },
        { at: [220, 148] as Pt, text: texts[1] },
      ],
    }),
    answer,
    choices: COMPARE_CHOICES,
    hint: "색칠한 칸이 0.01이 몇 개인지 세어 비교해요. 소수 끝자리의 0은 생략할 수 있어요.",
    explanation: `${fj(texts[0], "은/는")} 0.01이 ${a}개, ${fj(texts[1], "은/는")} 0.01이 ${b}개 → ${texts[0]} ${answer} ${texts[1]}`,
  };
}, BASIC_FIG_WEIGHT);

/* ── 소수의 덧셈과 뺄셈(0.1 뛰어 세기) ── */

/** 0부터 2까지 0.1 눈금 수직선(폭 240) */
const tenthLine = { x0: 30, y: 78, step: 12, ticks: 20, major: 10, mid: 5 };
const tenthLabels = [0, 1, 2].map((n) => ({ at: n * 10, text: String(n) }));

export const decLineAdd = figGen("l4-dec-line-add", 1, (rand) => {
  const a = randInt(rand, 2, 15);
  const b = randInt(rand, 2, 20 - a);
  const answer = tenths(a + b);
  return {
    key: `${a}:${b}`,
    prompt: "수직선을 보고 계산해 보세요.",
    expression: `${tenths(a)} + ${tenths(b)}`,
    visual: scene(
      300,
      112,
      `0부터 2까지 0.1 눈금 수직선에 0에서 ${a}칸, 이어서 ${b}칸 간 화살표`,
      numberLine({ ...tenthLine, labels: tenthLabels }),
      jumpArrow(tenthLine, 0, a, tenthLine.y - 20),
      jumpArrow(tenthLine, a, a + b, tenthLine.y - 42),
    ),
    answer,
    hint: "작은 눈금 한 칸은 0.1이에요. 두 번째 화살표가 끝나는 곳을 읽어요.",
    explanation: `0.1이 ${a} + ${b} = ${a + b}(개) → ${answer}`,
  };
}, BASIC_FIG_WEIGHT);

export const decLineSub = figGen("l4-dec-line-sub", 1, (rand) => {
  const a = randInt(rand, 5, 20);
  const b = randInt(rand, 1, a - 1);
  const answer = tenths(a - b);
  return {
    key: `${a}:${b}`,
    prompt: "수직선을 보고 계산해 보세요.",
    expression: `${tenths(a)} − ${tenths(b)}`,
    visual: scene(
      300,
      112,
      `0부터 2까지 0.1 눈금 수직선에 0에서 ${a}칸 간 뒤 거꾸로 ${b}칸 돌아온 화살표`,
      numberLine({ ...tenthLine, labels: tenthLabels }),
      jumpArrow(tenthLine, 0, a, tenthLine.y - 20),
      jumpArrow(tenthLine, a, a - b, tenthLine.y - 42),
    ),
    answer,
    hint: "작은 눈금 한 칸은 0.1이에요. 왼쪽으로 돌아온 화살표가 끝나는 곳을 읽어요.",
    explanation: `0.1이 ${a} − ${b} = ${a - b}(개) → ${answer}`,
    mistakes: { [tenths(a + b)]: "빼는 수만큼 왼쪽으로 돌아와야 해요." },
  };
}, BASIC_FIG_WEIGHT);
