import type { Generator } from "../types";
import { choiceKey, makeChoices, pick, randInt, shuffle } from "../../lib/random";
import { COMPARE_CHOICES, numberProblem, sign } from "./common";
import { josa } from "../josa";

const frac = (n: number, d: number) => `${n}/${d}`;
const mixed = (w: number, n: number, d: number) => `${w} ${n}/${d}`;
/** 분수·대분수 뒤 조사: 분자를 마지막에 읽는다(3/6 → 육분의 삼 → 은) */
const fj = (text: string, pair: "은/는" | "을/를" | "과/와" | "이에요/예요") => {
  const numer = Number(text.match(/(\d+)\/\d+$/)?.[1] ?? text);
  return `${text}${josa(numer, pair).slice(String(numer).length)}`;
};

/** 12의 1/3은 □ */
export const fracOfUnit: Generator = {
  id: "frac-of-unit",
  level: 1,
  make(rand) {
    const d = randInt(rand, 2, 8);
    const each = randInt(rand, 2, 8);
    const total = d * each;
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${total}:${d}`,
      prompt: "□ 안에 알맞은 수를 써넣으세요.",
      expression: `${total}의 ${frac(1, d)}은 □`,
      answer: each,
      hint: `${josa(total, "을/를")} 똑같이 ${d}묶음으로 나눈 것 중 1묶음이에요.`,
      explanation: `${total} ÷ ${d} = ${each}`,
      mistakes: { [total * d]: "나누어야 하는데 곱했어요." },
    });
  },
};

/** 12의 2/3은 □ */
export const fracOfMany: Generator = {
  id: "frac-of-many",
  level: 2,
  make(rand) {
    const d = randInt(rand, 3, 8);
    const n = randInt(rand, 2, d - 1);
    const each = randInt(rand, 2, 8);
    const total = d * each;
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${total}:${n}/${d}`,
      prompt: "□ 안에 알맞은 수를 써넣으세요.",
      expression: `${total}의 ${fj(frac(n, d), "은/는")} □`,
      answer: each * n,
      hint: `먼저 ${total}의 ${frac(1, d)}을 구하고 ${n}배 해요.`,
      explanation: `${total}의 ${frac(1, d)}은 ${each}, ${fj(frac(n, d), "은/는")} ${each} × ${n} = ${each * n}`,
      mistakes: { [each]: `${frac(1, d)}만큼만 구했어요. ${n}배 해야 해요.` },
    });
  },
};

const KINDS = ["진분수", "가분수", "대분수"] as const;

function fractionOfKind(rand: () => number, kind: (typeof KINDS)[number], d: number): string {
  if (kind === "진분수") return frac(randInt(rand, 1, d - 1), d);
  if (kind === "가분수") return frac(randInt(rand, d, d * 3), d);
  return mixed(randInt(rand, 1, 5), randInt(rand, 1, d - 1), d);
}

/** 진분수·가분수·대분수 중 하나를 고르기 */
export const fracKind: Generator = {
  id: "frac-kind",
  level: 1,
  make(rand) {
    const kind = pick(rand, KINDS);
    const others = KINDS.filter((k) => k !== kind);
    const answer = fractionOfKind(rand, kind, randInt(rand, 2, 9));
    // 값이 같은 보기(1/2와 2/4, 7/4와 1 3/4)는 넣지 않는다
    const picked = new Map<string, string>([[choiceKey(answer), answer]]);
    while (picked.size < 4) {
      const c = fractionOfKind(rand, pick(rand, others), randInt(rand, 2, 9));
      if (!picked.has(choiceKey(c))) picked.set(choiceKey(c), c);
    }
    const choices = shuffle(rand, [...picked.values()]);
    return {
      key: `${this.id}:${kind}:${choices.join()}`,
      typeId: this.id,
      prompt: `${kind}를 고르세요.`,
      input: "choice",
      choices,
      answer,
      hint: "분자<분모는 진분수, 분자≥분모는 가분수, 자연수와 진분수로 된 것은 대분수예요.",
      explanation: `${fj(answer, "은/는")} ${kind}입니다.`,
    };
  },
};

/** 가분수 → 대분수 */
export const fracToMixed: Generator = {
  id: "frac-to-mixed",
  level: 2,
  make(rand) {
    const d = randInt(rand, 2, 9);
    const w = randInt(rand, 1, 4);
    const r = randInt(rand, 1, d - 1);
    const n = w * d + r;
    const answer = mixed(w, r, d);
    // 값은 같고 분수 부분이 가분수인 오답(2 2/7 → 1 9/7)은 30%만 남긴다. 그 오답은 대분수가 아니라 정답은 하나다
    const keepSameValue = rand() < 0.3;
    return {
      key: `${this.id}:${n}/${d}`,
      typeId: this.id,
      prompt: "가분수를 대분수로 나타낸 것을 고르세요.",
      expression: frac(n, d),
      input: "choice",
      choices: makeChoices(rand, answer, [mixed(w - 1 || w + 1, r + d, d), mixed(r, w, d), mixed(w, r, n)], () =>
        mixed(randInt(rand, 1, 5), randInt(rand, 1, d - 1), d),
        keepSameValue,
      ),
      answer,
      hint: `분자 ${n}에 ${josa(d, "이/가")} 몇 번 들어가는지 세어 보세요.`,
      explanation: `${n} ÷ ${d} = ${w} … ${r}이므로 ${answer}`,
      mistakes: { [mixed(r, w, d)]: "자연수 부분과 분자를 바꿔 썼어요." },
    };
  },
};

/** 대분수 → 가분수 */
export const mixedToFrac: Generator = {
  id: "mixed-to-frac",
  level: 2,
  make(rand) {
    const d = randInt(rand, 2, 9);
    const w = randInt(rand, 1, 4);
    const r = randInt(rand, 1, d - 1);
    const answer = frac(w * d + r, d);
    return {
      key: `${this.id}:${w}:${r}/${d}`,
      typeId: this.id,
      prompt: "대분수를 가분수로 나타낸 것을 고르세요.",
      expression: mixed(w, r, d),
      input: "choice",
      choices: makeChoices(rand, answer, [frac(w + r, d), frac(w * r + d, d), frac(w * d + r, w)], () =>
        frac(randInt(rand, d, d * 5), d),
      ),
      answer,
      hint: `자연수 ${josa(w, "은/는")} ${fj(frac(w * d, d), "이에요/예요")}.`,
      explanation: `${w} = ${frac(w * d, d)}이므로 ${fj(frac(w * d, d), "과/와")} ${fj(frac(r, d), "을/를")} 합쳐 ${answer}`,
      mistakes: { [frac(w + r, d)]: "자연수를 분자에 그냥 더했어요." },
    };
  },
};

/** 분모가 같은 가분수·대분수 크기 비교 */
export const fracCompareMixed: Generator = {
  id: "frac-compare-mixed",
  level: 2,
  make(rand) {
    const d = randInt(rand, 2, 9);
    const w = randInt(rand, 1, 3);
    const r = randInt(rand, 1, d - 1);
    const left = w * d + r;
    const right = rand() < 0.15 ? left : randInt(rand, d + 1, d * 4);
    const answer = sign(right, left);
    return {
      key: `${this.id}:${right}/${d}:${w}:${r}`,
      typeId: this.id,
      prompt: "○ 안에 >, =, < 중 알맞은 것을 고르세요.",
      expression: `${frac(right, d)} ○ ${mixed(w, r, d)}`,
      input: "choice",
      choices: COMPARE_CHOICES,
      answer,
      hint: "대분수를 가분수로 바꾸어 분자끼리 비교해요.",
      explanation: `${mixed(w, r, d)} = ${frac(left, d)}이므로 ${frac(right, d)} ${answer} ${mixed(w, r, d)}`,
    };
  },
};
