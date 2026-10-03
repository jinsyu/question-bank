import type { Generator } from "../types";
import { makeChoices, pick, randInt } from "../../lib/random";
import { josa } from "../josa";

const frac = (n: number, d: number) => `${n}/${d}`;
/** 3-1은 가분수(3-2)를 배우기 전이라 분수 보기는 진분수만 쓴다 */
const properFracs = (list: [number, number][]) => list.filter(([n, d]) => n >= 1 && n < d).map(([n, d]) => frac(n, d));
/** 분모 2~max인 진분수 하나 */
const anyProper = (rand: () => number, max: number) => {
  const d = randInt(rand, 2, max);
  return frac(randInt(rand, 1, d - 1), d);
};
const korDen = (d: number) => `${d}분의`;

/** 색칠한 부분을 분수로 */
export const fracReadShaded: Generator = {
  id: "frac-read-shaded",
  level: 1,
  make(rand) {
    const d = randInt(rand, 2, 10);
    const n = randInt(rand, 1, d - 1);
    const shape = pick(rand, ["bar", "circle"] as const);
    const answer = frac(n, d);
    const unshaded = frac(d - n, d);
    return {
      key: `frac-read-shaded:${n}/${d}:${shape}`,
      typeId: this.id,
      prompt: "전체를 똑같이 나누었습니다. 색칠한 부분을 분수로 나타낸 것을 고르세요.",
      visual: { kind: shape, parts: d, shaded: n },
      input: "choice",
      choices: makeChoices(rand, answer, properFracs([[d - n, d], [n, d + 1], [n + 1, d], [n - 1, d]]), () => anyProper(rand, 10)),
      answer,
      hint: "먼저 전체가 몇 칸인지 세고(분모), 색칠한 칸을 세어 보세요(분자).",
      explanation: `전체 ${d}칸 중 ${n}칸을 색칠했으므로 ${answer}입니다.`,
      mistakes: unshaded === answer ? {} : { [unshaded]: "색칠하지 않은 칸을 세었어요." },
    };
  },
};

/** 색칠하지 않은 부분을 분수로 */
export const fracReadUnshaded: Generator = {
  id: "frac-read-unshaded",
  level: 2,
  make(rand) {
    const d = randInt(rand, 3, 10);
    const n = randInt(rand, 1, d - 1);
    const answer = frac(d - n, d);
    const shaded = frac(n, d);
    return {
      key: `frac-read-unshaded:${n}/${d}`,
      typeId: this.id,
      prompt: "색칠하지 않은 부분은 전체의 얼마인지 분수로 나타낸 것을 고르세요.",
      visual: { kind: "bar", parts: d, shaded: n },
      input: "choice",
      choices: makeChoices(rand, answer, properFracs([[n, d], [d - n, d + 1], [d - n - 1, d]]), () => anyProper(rand, 10)),
      answer,
      hint: "색칠하지 않은 칸이 몇 칸인지 세어 보세요.",
      explanation: `전체 ${d}칸 중 색칠하지 않은 칸은 ${d - n}칸이므로 ${answer}입니다.`,
      mistakes: shaded === answer ? {} : { [shaded]: "색칠한 부분을 답했어요." },
    };
  },
};

/** 분수 읽기 */
export const fracReadWords: Generator = {
  id: "frac-read-words",
  level: 1,
  make(rand) {
    const d = randInt(rand, 2, 12);
    const n = randInt(rand, 1, d - 1);
    const answer = `${korDen(d)} ${n}`;
    const swapped = `${korDen(n)} ${d}`;
    return {
      key: `frac-read-words:${n}/${d}`,
      typeId: this.id,
      prompt: "다음 분수를 바르게 읽은 것을 고르세요.",
      expression: frac(n, d),
      input: "choice",
      choices: makeChoices(rand, answer, [swapped, `${n}분의 ${n}`, `${korDen(d)} ${d}`], () =>
        `${korDen(randInt(rand, 2, 12))} ${randInt(rand, 1, 11)}`,
      ),
      answer,
      hint: "분수는 아래 수(분모)부터 읽어요.",
      explanation: `${josa(frac(n, d), "은/는")} '${answer}'${josa(answer, "이라고/라고").slice(answer.length)} 읽습니다.`,
      mistakes: { [swapped]: "위의 수부터 읽었어요. 분모부터 읽어야 해요." },
    };
  },
};

/** 부분은 전체의 몇 분의 몇 */
export const fracPartOfWhole: Generator = {
  id: "frac-part-of-whole",
  level: 2,
  make(rand) {
    const d = randInt(rand, 3, 12);
    const n = randInt(rand, 1, d - 1);
    const answer = frac(n, d);
    const left = frac(d - n, d);
    return {
      key: `frac-part-of-whole:${n}/${d}`,
      typeId: this.id,
      prompt: `피자 한 판을 똑같이 ${d}조각으로 나누어 ${n}조각을 먹었습니다. 먹은 피자는 전체의 얼마인지 고르세요.`,
      input: "choice",
      choices: makeChoices(rand, answer, properFracs([[d - n, d], [n, d + n], [n + 1, d], [n - 1, d], [n, d + 1]]), () => anyProper(rand, 12)),
      answer,
      hint: "전체 조각 수가 분모, 먹은 조각 수가 분자예요.",
      explanation: `전체 ${d}조각 중 ${n}조각이므로 ${answer}입니다.`,
      mistakes: left === answer ? {} : { [left]: "남은 조각을 답했어요." },
    };
  },
};

const compareChoices = [">", "<", "="];
const sign = (a: number, b: number) => (a > b ? ">" : a < b ? "<" : "=");

/** 분모가 같은 분수의 크기 비교 */
export const fracCompareSameDen: Generator = {
  id: "frac-compare-same-den",
  level: 1,
  make(rand) {
    const d = randInt(rand, 3, 12);
    const a = randInt(rand, 1, d - 1);
    // 같은 분수끼리 비교('=')는 10% 정도만(우연히 같아지는 경우까지 더하면 15~30%가 되었다)
    let b = a;
    if (rand() >= 0.1) while (b === a) b = randInt(rand, 1, d - 1);
    const answer = sign(a, b);
    return {
      key: `frac-compare-same-den:${a}/${d}:${b}/${d}`,
      typeId: this.id,
      prompt: "○ 안에 >, =, < 중 알맞은 것을 고르세요.",
      expression: `${frac(a, d)} ○ ${frac(b, d)}`,
      input: "choice",
      choices: compareChoices,
      answer,
      hint: "분모가 같으면 분자가 클수록 큰 분수예요.",
      explanation: `분모가 ${josa(d, "으로/로")} 같으므로 분자 ${josa(a, "과/와")} ${josa(b, "을/를")} 비교합니다. ${frac(a, d)} ${answer} ${frac(b, d)}`,
    };
  },
};

/** 분모가 같은 분수 중 가장 큰 것 */
export const fracLargestSameDen: Generator = {
  id: "frac-largest-same-den",
  level: 2,
  make(rand) {
    const d = randInt(rand, 5, 12);
    const nums = new Set<number>();
    while (nums.size < 4) nums.add(randInt(rand, 1, d - 1));
    const list = [...nums];
    const max = Math.max(...list);
    const answer = frac(max, d);
    return {
      key: `frac-largest-same-den:${d}:${list.join(",")}`,
      typeId: this.id,
      prompt: "가장 큰 분수를 고르세요.",
      input: "choice",
      choices: list.map((n) => frac(n, d)),
      answer,
      hint: "분모가 모두 같아요. 분자를 비교해 보세요.",
      explanation: `분모가 같으므로 분자가 가장 큰 ${josa(answer, "이/가")} 가장 큽니다.`,
      mistakes: { [frac(Math.min(...list), d)]: "가장 작은 분수를 골랐어요." },
    };
  },
};

/** 단위분수의 크기 비교 */
export const fracCompareUnit: Generator = {
  id: "frac-compare-unit",
  level: 1,
  make(rand) {
    const a = randInt(rand, 2, 12);
    let b = randInt(rand, 2, 12);
    if (rand() > 0.1) while (b === a) b = randInt(rand, 2, 12);
    const answer = sign(b, a); // 1/a vs 1/b: 분모가 작을수록 크다
    return {
      key: `frac-compare-unit:${a}:${b}`,
      typeId: this.id,
      prompt: "○ 안에 >, =, < 중 알맞은 것을 고르세요.",
      expression: `${frac(1, a)} ○ ${frac(1, b)}`,
      input: "choice",
      choices: compareChoices,
      answer,
      hint: "분자가 1인 분수는 분모가 작을수록 한 조각이 커요.",
      explanation: `단위분수는 분모가 작을수록 큽니다. ${frac(1, a)} ${answer} ${frac(1, b)}`,
      mistakes: answer === "=" ? {} : { [sign(a, b)]: "분모가 크면 큰 분수라고 생각했어요." },
    };
  },
};

/** 단위분수 중 가장 큰(작은) 것 */
export const fracOrderUnit: Generator = {
  id: "frac-order-unit",
  level: 2,
  make(rand) {
    const dens = new Set<number>();
    while (dens.size < 4) dens.add(randInt(rand, 2, 12));
    const list = [...dens];
    const wantLargest = rand() < 0.5;
    const target = wantLargest ? Math.min(...list) : Math.max(...list);
    const opposite = wantLargest ? Math.max(...list) : Math.min(...list);
    const answer = frac(1, target);
    return {
      key: `frac-order-unit:${wantLargest}:${list.join(",")}`,
      typeId: this.id,
      prompt: `가장 ${wantLargest ? "큰" : "작은"} 분수를 고르세요.`,
      input: "choice",
      choices: list.map((d) => frac(1, d)),
      answer,
      hint: "단위분수는 분모가 작을수록 커요.",
      explanation: `분모가 가장 ${wantLargest ? "작은" : "큰"} ${josa(answer, "이/가")} 가장 ${wantLargest ? "큽" : "작습"}니다.`,
      mistakes: { [frac(1, opposite)]: "분모가 크면 큰 분수라고 생각했어요." },
    };
  },
};
