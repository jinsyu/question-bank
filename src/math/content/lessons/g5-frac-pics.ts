import { randInt } from "../../lib/random";
import { gcd, reduced } from "../generators/grade5";
import { scene, type Pt } from "./g3-figures";
import { BASIC_FIG_WEIGHT, figGen, fracLabel, grid10, hundredths, tenths, valueChoices } from "./frac-dec-figs";

/**
 * 5학년 분수·소수 곱셈 그림 유형(R2b): 넓이 모델(정사각형을 가로·세로로 나누어 겹친 부분 색칠), 모눈으로 소수×소수.
 * 5학년 분수 답은 기약분수(reduced).
 */

const f = (n: number, d: number) => `${n}/${d}`;

export const fracAreaModel = figGen("l5-ff-area", 1, (rand) => {
  const b = randInt(rand, 2, 5);
  const d = randInt(rand, 2, 5);
  const a = randInt(rand, 1, b - 1);
  const c = randInt(rand, 1, d - 1);
  // 곱하는 두 분수는 기약분수로(2/4 × 1/2 같은 표기가 나오지 않게)
  if (gcd(a, b) !== 1 || gcd(c, d) !== 1) return null;
  const [x0, y0, size] = [64, 50, 200];
  const [cw, rh] = [size / b, size / d];
  const answer = reduced(a * c, b * d);
  return {
    key: `${a}/${b}:${c}/${d}`,
    prompt: "정사각형 전체의 크기가 1입니다. 가로의 위쪽 분수만큼과 세로의 왼쪽 분수만큼이 겹친 부분을 색칠했습니다. 그림을 보고 □ 안에 알맞은 기약분수를 고르세요.",
    expression: `${f(a, b)} × ${f(c, d)} = □`,
    visual: scene(
      284,
      262,
      `가로 ${b}칸, 세로 ${d}칸으로 나눈 정사각형에 가로 ${a}칸, 세로 ${c}칸이 겹친 부분 색칠`,
      {
        polygons: [
          { points: [[x0, y0], [x0 + a * cw, y0], [x0 + a * cw, y0 + c * rh], [x0, y0 + c * rh]] as Pt[], fill: true },
          { points: [[x0, y0], [x0 + size, y0], [x0 + size, y0 + size], [x0, y0 + size]] as Pt[] },
        ],
        lines: [
          ...Array.from({ length: b - 1 }, (_, i) => ({ from: [x0 + (i + 1) * cw, y0] as Pt, to: [x0 + (i + 1) * cw, y0 + size] as Pt, width: 1.5 })),
          ...Array.from({ length: d - 1 }, (_, i) => ({ from: [x0, y0 + (i + 1) * rh] as Pt, to: [x0 + size, y0 + (i + 1) * rh] as Pt, width: 1.5 })),
        ],
      },
      fracLabel(x0 + (a * cw) / 2, y0 - 24, a, b),
      fracLabel(x0 - 26, y0 + (c * rh) / 2, c, d),
    ),
    answer,
    choices: valueChoices(rand, answer, [reduced(a * c, b + d), reduced(a + c, b * d), reduced(a * d, b * c), reduced(a * c + 1, b * d)], () => reduced(randInt(rand, 1, b * d - 1), b * d)),
    hint: `전체는 ${b} × ${d} = ${b * d}칸, 색칠한 부분은 ${a} × ${c} = ${a * c}칸이에요.`,
    explanation: `색칠한 부분은 ${b * d}칸 중 ${a * c}칸 → ${f(a * c, b * d)}${f(a * c, b * d) === answer ? "" : ` = ${answer}`}`,
    mistakes: { [reduced(a * c, b + d)]: "분모끼리도 곱해야 해요." },
  };
}, BASIC_FIG_WEIGHT);

export const decGridMul = figGen("l5-dd-grid", 1, (rand) => {
  const a = randInt(rand, 1, 9);
  const b = randInt(rand, 1, 9);
  const [x0, y0, cell] = [64, 36, 16];
  const answer = hundredths(a * b);
  return {
    key: `${a}:${b}`,
    prompt: `모눈종이 전체의 크기가 1입니다. 가로 ${tenths(a)}, 세로 ${tenths(b)}만큼 색칠한 그림을 보고 ${tenths(a)} × ${tenths(b)}의 값을 구하세요.`,
    visual: scene(244, 212, `100칸 모눈종이에 가로 ${a}칸, 세로 ${b}칸인 부분 색칠`, grid10(x0, y0, cell, [[0, 0, a, b]]), {
      texts: [
        { at: [x0 + (a * cell) / 2, y0 - 14] as Pt, text: tenths(a) },
        { at: [x0 - 24, y0 + (b * cell) / 2] as Pt, text: tenths(b) },
      ],
    }),
    answer,
    hint: "모눈 한 칸은 0.01이에요. 색칠한 칸이 몇 칸인지 세어 보세요.",
    explanation: `색칠한 칸 ${a} × ${b} = ${a * b}(칸) → 0.01이 ${a * b}개 → ${answer}`,
    mistakes: { [tenths(a * b)]: "0.1 × 0.1 = 0.01이므로 모눈 한 칸은 0.01이에요." },
  };
}, BASIC_FIG_WEIGHT);
