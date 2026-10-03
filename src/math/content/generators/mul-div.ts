import type { Generator } from "../types";
import { randInt } from "../../lib/random";
import { multiplyWithoutCarry, numberProblem } from "./common";
import { hasFinal, josa } from "../josa";

/* ── 3-1 나눗셈 ── */

export const divShare: Generator = {
  id: "div-share",
  level: 1,
  make(rand) {
    const b = randInt(rand, 2, 9);
    const q = randInt(rand, 2, 9);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${b}:${q}`,
      prompt: `사탕 ${b * q}개를 ${b}명에게 똑같이 나누어 주려고 합니다. 한 명에게 몇 개씩 줄 수 있나요?`,
      answer: q,
      fields: ["개"],
      hint: `${b}명에게 똑같이 나누면 ${b * q} ÷ ${josa(b, "이에요/예요")}.`,
      explanation: `${b * q} ÷ ${b} = ${q}(개)`,
    });
  },
};

export const divGroup: Generator = {
  id: "div-group",
  level: 2,
  make(rand) {
    const b = randInt(rand, 2, 9);
    const q = randInt(rand, 2, 9);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${b}:${q}`,
      prompt: `구슬 ${b * q}개를 한 봉지에 ${b}개씩 담으면 몇 봉지가 되나요?`,
      answer: q,
      fields: ["봉지"],
      hint: `${b}개씩 몇 번 덜어 낼 수 있는지 생각해요. ${b * q} ÷ ${b}`,
      explanation: `${b * q} ÷ ${b} = ${q}(봉지)`,
    });
  },
};

export const divFact: Generator = {
  id: "div-fact",
  level: 1,
  make(rand) {
    const b = randInt(rand, 2, 9);
    const q = randInt(rand, 2, 9);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${b}:${q}`,
      prompt: "곱셈식을 보고 □ 안에 알맞은 수를 써넣으세요.",
      expression: `${b} × ${q} = ${b * q} → ${b * q} ÷ ${b} = □`,
      answer: q,
      hint: "곱셈식의 곱을 나누면 다른 한 수가 나와요.",
      explanation: `${b} × ${q} = ${b * q}이므로 ${b * q} ÷ ${b} = ${q}`,
      mistakes: { [b * q]: "곱을 그대로 썼어요." },
    });
  },
};

export const divBasic: Generator = {
  id: "div-basic",
  level: 1,
  make(rand) {
    const b = randInt(rand, 2, 9);
    const q = randInt(rand, 1, 9);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${b}:${q}`,
      prompt: "나눗셈의 몫을 구하세요.",
      expression: `${b * q} ÷ ${b} = □`,
      answer: q,
      hint: `${b}단 곱셈구구에서 곱이 ${b * q}인 것을 찾아요.`,
      explanation: `${b} × ${q} = ${b * q}이므로 몫은 ${q}입니다.`,
    });
  },
};

/* ── 3-1 곱셈 ── */

export const mulTens: Generator = {
  id: "mul-tens",
  level: 1,
  make(rand) {
    const a = randInt(rand, 1, 9) * 10;
    const b = randInt(rand, 2, 9);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: "계산해 보세요.",
      expression: `${a} × ${b} = □`,
      answer: a * b,
      hint: `${a / 10} × ${josa(b, "을/를")} 계산한 뒤 0을 하나 붙여요.`,
      explanation: `${a / 10} × ${b} = ${(a / 10) * b}이므로 ${a} × ${b} = ${a * b}`,
      mistakes: { [(a / 10) * b]: "0을 붙이지 않았어요." },
    });
  },
};

export const mul2x1NoCarry: Generator = {
  id: "mul-2x1-no-carry",
  level: 1,
  make(rand) {
    const b = randInt(rand, 2, 4);
    const tens = randInt(rand, 1, Math.floor(9 / b));
    const ones = randInt(rand, 1, Math.floor(9 / b));
    const a = tens * 10 + ones;
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: "계산해 보세요.",
      visual: { kind: "column", op: "×", a, b },
      answer: a * b,
      hint: "일의 자리, 십의 자리 순서로 곱해요.",
      explanation: `${a} × ${b} = ${a * b}`,
    });
  },
};

export const mul2x1Carry: Generator = {
  id: "mul-2x1-carry",
  level: 2,
  make(rand) {
    let a = 0;
    let b = 0;
    for (let i = 0; i < 50 && multiplyWithoutCarry(a, b) === a * b; i++) {
      a = randInt(rand, 12, 99);
      b = randInt(rand, 3, 9);
    }
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: "계산해 보세요.",
      visual: { kind: "column", op: "×", a, b },
      answer: a * b,
      hint: "일의 자리 곱이 10을 넘으면 십의 자리로 올림해요.",
      explanation: `${a} × ${b} = ${a * b}`,
      mistakes: { [multiplyWithoutCarry(a, b)]: "올림한 수를 더하지 않았어요." },
    });
  },
};

export const mulWord: Generator = {
  id: "mul-word",
  level: 2,
  make(rand) {
    // 이 차시(십의 자리와 일의 자리에서 올림)에 맞게 두 자리 모두 올림이 있는 곱만
    let [a, b] = [randInt(rand, 12, 45), randInt(rand, 3, 9)];
    for (let i = 0; i < 100 && !((a % 10) * b >= 10 && Math.floor(a / 10) * b + Math.floor(((a % 10) * b) / 10) >= 10); i++) [a, b] = [randInt(rand, 12, 45), randInt(rand, 3, 9)];
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: `한 상자에 연필이 ${a}자루씩 들어 있습니다. ${b}상자에는 연필이 모두 몇 자루인가요?`,
      answer: a * b,
      fields: ["자루"],
      hint: `${a}자루씩 ${b}묶음이므로 ${a} × ${josa(b, "이에요/예요")}.`,
      explanation: `${a} × ${b} = ${a * b}(자루)`,
      mistakes: { [a + b]: "곱해야 하는데 더했어요.", [multiplyWithoutCarry(a, b)]: "올림을 빠뜨렸어요." },
    });
  },
};

/* ── 3-2 곱셈 ── */

export const mul3x1: Generator = {
  id: "mul-3x1",
  level: 1,
  make(rand) {
    const a = randInt(rand, 102, 499);
    const b = randInt(rand, 2, 9);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: "계산해 보세요.",
      visual: { kind: "column", op: "×", a, b },
      answer: a * b,
      hint: "일, 십, 백의 자리 순서로 곱하고 올림한 수를 더해요.",
      explanation: `${a} × ${b} = ${a * b}`,
      mistakes: { [multiplyWithoutCarry(a, b)]: "올림한 수를 더하지 않았어요." },
    });
  },
};

export const mulTensTens: Generator = {
  id: "mul-tens-tens",
  level: 1,
  make(rand) {
    const a = randInt(rand, 2, 9) * 10;
    const b = randInt(rand, 2, 9) * 10;
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: "계산해 보세요.",
      expression: `${a} × ${b} = □`,
      answer: a * b,
      hint: `${a / 10} × ${josa(b / 10, "을/를")} 계산한 뒤 0을 두 개 붙여요.`,
      explanation: `${a / 10} × ${b / 10} = ${(a * b) / 100}이므로 ${a * b}`,
      mistakes: { [(a * b) / 10]: "0을 하나만 붙였어요.", [(a * b) / 100]: "0을 붙이지 않았어요." },
    });
  },
};

export const mul2x2: Generator = {
  id: "mul-2x2",
  level: 2,
  make(rand) {
    // 세로셈(l3-mul-22-calc)과 겹치지 않게 가로셈으로 낸다
    const a = randInt(rand, 12, 99);
    let b = randInt(rand, 12, 99);
    if (b % 10 === 0) b += 1;
    const partial = a * (b % 10) + a * Math.floor(b / 10);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: "가로셈으로 계산해 보세요.",
      expression: `${a} × ${b} = □`,
      answer: a * b,
      hint: `${a} × ${josa(b % 10, "과/와")} ${a} × ${josa(Math.floor(b / 10) * 10, "을/를")} 각각 구해 더해요.`,
      explanation: `${a} × ${b % 10} = ${a * (b % 10)}, ${a} × ${Math.floor(b / 10) * 10} = ${a * Math.floor(b / 10) * 10} → ${a * b}`,
      mistakes: { [partial]: "십의 자리를 곱한 값의 자리를 맞추지 않았어요(0을 빠뜨림)." },
    });
  },
};

/* ── 3-2 나눗셈 ── */

export const divTens: Generator = {
  id: "div-tens",
  level: 1,
  make(rand) {
    const b = randInt(rand, 2, 5);
    const q = randInt(rand, 1, Math.floor(9 / b)) * 10;
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${b}:${q}`,
      prompt: "계산해 보세요.",
      expression: `${b * q} ÷ ${b} = □`,
      answer: q,
      hint: `${(b * q) / 10} ÷ ${josa(b, "을/를")} 계산한 뒤 0을 붙여요.`,
      explanation: `${(b * q) / 10} ÷ ${b} = ${q / 10}이므로 ${q}`,
      mistakes: { [q / 10]: "0을 붙이지 않았어요." },
    });
  },
};

export const div2x1NoRemainder: Generator = {
  id: "div-2x1",
  level: 1,
  make(rand) {
    const b = randInt(rand, 2, 6);
    const q = randInt(rand, 11, Math.floor(99 / b));
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${b}:${q}`,
      prompt: "계산해 보세요.",
      expression: `${b * q} ÷ ${b} = □`,
      answer: q,
      hint: "십의 자리부터 나누고, 남은 수를 일의 자리와 함께 나눠요.",
      explanation: `${b} × ${q} = ${b * q}이므로 ${b * q} ÷ ${b} = ${q}`,
    });
  },
};

export const div2x1Remainder: Generator = {
  id: "div-2x1-rem",
  level: 1,
  make(rand) {
    const b = randInt(rand, 3, 9);
    const q = randInt(rand, 3, Math.floor(98 / b));
    const r = randInt(rand, 1, b - 1);
    const a = b * q + r;
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: "몫과 나머지를 구하세요.",
      expression: `${a} ÷ ${b}`,
      answer: `${q},${r}`,
      fields: ["몫", "나머지"],
      hint: "나머지는 나누는 수보다 작아야 해요.",
      explanation: `${b} × ${q} = ${b * q}, ${a} − ${b * q} = ${r} → 몫 ${q}, 나머지 ${r}`,
      mistakes: { [`${q - 1},${r + b}`]: "나머지가 나누는 수보다 커요. 한 번 더 나눌 수 있어요." },
    });
  },
};

export const div3x1: Generator = {
  id: "div-3x1",
  level: 2,
  make(rand) {
    const b = randInt(rand, 2, 9);
    const q = randInt(rand, Math.ceil(100 / b), Math.floor(998 / b));
    const r = randInt(rand, 0, b - 1);
    const a = b * q + r;
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: "몫과 나머지를 구하세요. 나머지가 없으면 0을 쓰세요.",
      expression: `${a} ÷ ${b}`,
      answer: `${q},${r}`,
      fields: ["몫", "나머지"],
      hint: "백의 자리부터 차례로 나눠요.",
      explanation: r ? `${b} × ${q} = ${b * q}, ${b * q} + ${r} = ${a} → 몫 ${q}, 나머지 ${r}` : `${b} × ${q} = ${a} → 몫 ${q}, 나머지 0`,
    });
  },
};

export const divCheck: Generator = {
  id: "div-check",
  level: 2,
  make(rand) {
    const b = randInt(rand, 3, 9);
    const q = randInt(rand, 4, 30);
    const r = randInt(rand, 1, b - 1);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${b}:${q}:${r}`,
      prompt: `어떤 수를 ${josa(b, "으로/로")} 나누었더니 몫이 ${q}, 나머지가 ${r}${hasFinal(r).yes ? "이었" : "였"}습니다. 어떤 수는 얼마인가요?`,
      answer: b * q + r,
      hint: "나누는 수와 몫의 곱에 나머지를 더하면 나누어지는 수가 돼요.",
      explanation: `${b} × ${q} = ${b * q}, ${b * q} + ${r} = ${b * q + r}`,
      mistakes: { [b * q]: "나머지를 더하지 않았어요." },
    });
  },
};
