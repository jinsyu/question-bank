import type { Generator } from "../types";
import { randInt } from "../../lib/random";
import { addWithoutCarry, hasBorrow, hasCarry, numberProblem, subtractWithoutBorrow } from "./common";

/** 조건을 만족할 때까지 두 수를 뽑는다 */
function pickPair(rand: () => number, make: () => [number, number], ok: (a: number, b: number) => boolean) {
  for (let i = 0; i < 100; i++) {
    const [a, b] = make();
    if (ok(a, b)) return [a, b] as const;
  }
  return make();
}

const three = (rand: () => number) => randInt(rand, 100, 999);

export const add3NoCarry: Generator = {
  id: "add3-no-carry",
  level: 1,
  make(rand) {
    const [a, b] = pickPair(rand, () => [three(rand), three(rand)], (a, b) => a + b < 1000 && !hasCarry(a, b));
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: "계산해 보세요.",
      visual: { kind: "column", op: "+", a, b },
      answer: a + b,
      hint: "일의 자리부터 같은 자리끼리 더해요.",
      explanation: `${a} + ${b} = ${a + b}`,
    });
  },
};

export const add3Carry: Generator = {
  id: "add3-carry",
  level: 2,
  make(rand) {
    const [a, b] = pickPair(rand, () => [three(rand), three(rand)], (a, b) => a + b < 1000 && hasCarry(a, b));
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: "계산해 보세요.",
      visual: { kind: "column", op: "+", a, b },
      answer: a + b,
      hint: "같은 자리의 합이 10이 넘으면 윗자리로 1을 받아올려요.",
      explanation: `${a} + ${b} = ${a + b}`,
      mistakes: { [addWithoutCarry(a, b)]: "받아올림을 빠뜨렸어요." },
    });
  },
};

export const addWord: Generator = {
  id: "add-word",
  level: 2,
  make(rand) {
    const a = randInt(rand, 120, 580);
    const b = randInt(rand, 110, 999 - a);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: `도서관에 동화책이 ${a}권, 위인전이 ${b}권 있습니다. 동화책과 위인전은 모두 몇 권인가요?`,
      answer: a + b,
      fields: ["권"],
      hint: "'모두'를 구할 때는 더해요.",
      explanation: `${a} + ${b} = ${a + b}(권)`,
      mistakes: { [addWithoutCarry(a, b)]: "받아올림을 빠뜨렸어요.", [Math.abs(a - b)]: "더해야 하는데 뺐어요." },
    });
  },
};

export const sub3NoBorrow: Generator = {
  id: "sub3-no-borrow",
  level: 1,
  make(rand) {
    // 자리마다 차가 1 이상(659 − 658처럼 차가 거의 없는 문제는 세 자리 뺄셈 연습이 되지 않는다)
    const digitsBigger = (a: number, b: number) => [100, 10, 1].every((p) => Math.floor(a / p) % 10 > Math.floor(b / p) % 10);
    const [a, b] = pickPair(rand, () => [three(rand), three(rand)], (a, b) => a > b && !hasBorrow(a, b) && digitsBigger(a, b));
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: "계산해 보세요.",
      visual: { kind: "column", op: "-", a, b },
      answer: a - b,
      hint: "일의 자리부터 같은 자리끼리 빼요.",
      explanation: `${a} − ${b} = ${a - b}`,
    });
  },
};

export const sub3Borrow: Generator = {
  id: "sub3-borrow",
  level: 2,
  make(rand) {
    const [a, b] = pickPair(rand, () => [three(rand), three(rand)], (a, b) => a > b && hasBorrow(a, b));
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: "계산해 보세요.",
      visual: { kind: "column", op: "-", a, b },
      answer: a - b,
      hint: "같은 자리끼리 뺄 수 없으면 윗자리에서 10을 받아내려요.",
      explanation: `${a} − ${b} = ${a - b}`,
      mistakes: { [subtractWithoutBorrow(a, b)]: "받아내림 없이 큰 수에서 작은 수를 뺐어요." },
    });
  },
};

export const subWord: Generator = {
  id: "sub-word",
  level: 2,
  make(rand) {
    const a = randInt(rand, 300, 999);
    const b = randInt(rand, 100, a - 50);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: `색종이가 ${a}장 있었습니다. 미술 시간에 ${b}장을 썼다면 남은 색종이는 몇 장인가요?`,
      answer: a - b,
      fields: ["장"],
      hint: "'남은' 것을 구할 때는 빼요.",
      explanation: `${a} − ${b} = ${a - b}(장)`,
      mistakes: { [subtractWithoutBorrow(a, b)]: "받아내림을 빠뜨렸어요.", [a + b]: "빼야 하는데 더했어요." },
    });
  },
};
