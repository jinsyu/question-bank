import type { Generator } from "../types";
import { makeChoices, pick, randInt, shuffle } from "../../lib/random";
import { COMPARE_CHOICES, numberProblem, sign } from "./common";
import { clockScene, dotsScene, tensOnesScene } from "./pictures";
import { tokensScene } from "../lessons/g1-pics";
import { josa } from "../josa";

/* ── 1-1 9까지의 수 ── */

export const countDots: Generator = {
  id: "count-dots",
  level: 1,
  make(rand) {
    const n = randInt(rand, 1, 9);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${n}`,
      prompt: "점은 몇 개인가요?",
      visual: dotsScene(n),
      answer: n,
      fields: ["개"],
      hint: "하나씩 짚으며 세어 보세요.",
      explanation: `점은 ${n}개입니다.`,
    });
  },
};

export const numBeforeAfter: Generator = {
  id: "num-before-after",
  level: 1,
  make(rand) {
    const max = 9;
    const after = rand() < 0.5;
    const n = after ? randInt(rand, 0, max - 1) : randInt(rand, 1, max);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${after}:${n}`,
      prompt: `${n}보다 1만큼 더 ${after ? "큰" : "작은"} 수는 무엇인가요?`,
      answer: after ? n + 1 : n - 1,
      hint: `수를 차례로 세어 보세요. ${after ? "바로 다음" : "바로 앞"} 수예요.`,
      explanation: `${n}보다 1만큼 더 ${after ? "큰" : "작은"} 수는 ${after ? n + 1 : n - 1}입니다.`,
      mistakes: { [after ? n - 1 : n + 1]: after ? "1만큼 더 작은 수를 썼어요." : "1만큼 더 큰 수를 썼어요." },
    });
  },
};

export const numBigger9: Generator = {
  id: "num-bigger9",
  level: 1,
  make(rand) {
    const nums = shuffle(rand, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4);
    const big = rand() < 0.6;
    const answer = String(big ? Math.max(...nums) : Math.min(...nums));
    return {
      key: `${this.id}:${nums.join()}:${big}`,
      typeId: this.id,
      prompt: `가장 ${big ? "큰" : "작은"} 수를 고르세요.`,
      input: "choice",
      choices: nums.map(String),
      answer,
      hint: "수를 차례로 셀 때 뒤에 나오는 수가 더 커요.",
      explanation: `${josa(answer, "이/가")} 가장 ${big ? "큽" : "작습"}니다.`,
    };
  },
};

/* ── 1-1 덧셈과 뺄셈(9까지) ── */

export const add9: Generator = {
  id: "add9",
  level: 1,
  make(rand) {
    const a = randInt(rand, 1, 8);
    const b = randInt(rand, 1, 9 - a);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: "덧셈을 하세요.",
      expression: `${a} + ${b} = □`,
      answer: a + b,
      hint: `${a}에서 ${b}만큼 이어 세어 보세요.`,
      explanation: `${a} + ${b} = ${a + b}`,
    });
  },
};

export const sub9: Generator = {
  id: "sub9",
  level: 1,
  make(rand) {
    const a = randInt(rand, 2, 9);
    const b = randInt(rand, 1, a - 1);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: "뺄셈을 하세요.",
      expression: `${a} − ${b} = □`,
      answer: a - b,
      hint: `${a}에서 ${b}만큼 거꾸로 세어 보세요.`,
      explanation: `${a} − ${b} = ${a - b}`,
      mistakes: { [a + b]: "빼야 하는데 더했어요." },
    });
  },
};

export const split9: Generator = {
  id: "split9",
  level: 2,
  make(rand) {
    const total = randInt(rand, 2, 9);
    const a = randInt(rand, 1, total - 1);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${total}:${a}`,
      prompt: `${josa(a, "과/와")} □를 모으면 ${josa(total, "이/가")} 됩니다. □는 얼마인가요?`,
      answer: total - a,
      hint: `${a}에서 ${josa(total, "이/가")} 될 때까지 몇을 더 세어야 하는지 생각해요.`,
      explanation: `${josa(a, "과/와")} ${josa(total - a, "을/를")} 모으면 ${total}`,
    });
  },
};

/* ── 1-1 비교하기 ── */

const MARKS = ["①", "②", "③", "④"];

export const compareLength: Generator = {
  id: "compare-length",
  level: 1,
  make(rand) {
    const lens = shuffle(rand, [50, 70, 90, 110, 130, 150, 170, 190]).slice(0, 4);
    const long = rand() < 0.5;
    const target = long ? Math.max(...lens) : Math.min(...lens);
    const answer = MARKS[lens.indexOf(target)];
    return {
      key: `${this.id}:${lens.join()}:${long}`,
      typeId: this.id,
      prompt: `가장 ${long ? "긴" : "짧은"} 막대를 고르세요.`,
      visual: {
        kind: "shape",
        width: 240,
        height: 150,
        label: "왼쪽 끝을 맞춘 막대 네 개",
        polygons: lens.map((l, i) => ({ fill: true, points: [[34, 12 + i * 34], [34 + l, 12 + i * 34], [34 + l, 32 + i * 34], [34, 32 + i * 34]] as [number, number][] })),
        texts: lens.map((_, i) => ({ at: [16, 22 + i * 34] as [number, number], text: MARKS[i] })),
      },
      input: "choice",
      choices: MARKS,
      answer,
      hint: "왼쪽 끝이 맞추어져 있어요. 오른쪽 끝을 비교해요.",
      explanation: `${answer} 막대가 가장 ${long ? "깁" : "짧습"}니다.`,
    };
  },
};

export const compareArea: Generator = {
  id: "compare-area",
  level: 2,
  make(rand) {
    const counts = shuffle(rand, [2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4);
    const wide = rand() < 0.5;
    const target = wide ? Math.max(...counts) : Math.min(...counts);
    const answer = MARKS[counts.indexOf(target)];
    // 1학년이 칸을 셀 수 있게 칸을 크게(24) 그리고, 모양마다 한 줄의 칸 수(2~3)를 달리한다
    const cell = 24;
    const pitch = 3 * cell + 16;
    const cols = counts.map(() => randInt(rand, 2, 3));
    const polygons = counts.flatMap((n, k) =>
      Array.from({ length: n }, (_, i) => {
        const x = 12 + k * pitch + (i % cols[k]) * cell;
        const y = 26 + Math.floor(i / cols[k]) * cell;
        return { fill: true, points: [[x, y], [x + cell, y], [x + cell, y + cell], [x, y + cell]] as [number, number][] };
      }),
    );
    return {
      key: `${this.id}:${counts.join()}:${cols.join()}:${wide}`,
      typeId: this.id,
      prompt: `같은 크기의 칸으로 만든 모양 중 가장 ${wide ? "넓은" : "좁은"} 것을 고르세요.`,
      visual: {
        kind: "shape",
        width: 12 + 4 * pitch,
        height: 34 + Math.max(...counts.map((n, k) => Math.ceil(n / cols[k]))) * cell,
        label: "칸으로 만든 모양 네 개",
        polygons,
        texts: counts.map((_, k) => ({ at: [12 + k * pitch + cell * 1.5, 13] as [number, number], text: MARKS[k] })),
      },
      input: "choice",
      choices: MARKS,
      answer,
      hint: "칸의 수를 세어 비교해요.",
      explanation: `칸 수: ${counts.join(", ")} → 가장 ${wide ? "넓은" : "좁은"} 것은 ${answer}`,
    };
  },
};

/* ── 1-1 50까지의 수, 1-2 100까지의 수 ── */

function tensOnes(id: string, min: number, max: number): Generator {
  return {
    id,
    level: 1,
    make(rand) {
      const n = randInt(rand, min, max);
      const tens = Math.floor(n / 10);
      const ones = n % 10;
      const byPicture = rand() < 0.5;
      return numberProblem({
        typeId: id,
        key: `${id}:${byPicture}:${n}`,
        prompt: byPicture ? "모두 몇 개인가요?" : `10개씩 묶음 ${tens}개와 낱개 ${ones}개는 몇인가요?`,
        visual: byPicture ? tensOnesScene(tens, ones) : undefined,
        answer: n,
        // 자리 이름(십의 자리·일의 자리)은 2-1에서 배운다
        hint: "10개씩 묶음의 수를 먼저 쓰고, 그 오른쪽에 낱개의 수를 써요.",
        explanation: `10개씩 묶음 ${tens}개, 낱개 ${ones}개 → ${n}`,
        mistakes: { [tens + ones]: "10개씩 묶음도 1개로 셌어요." },
      });
    },
  };
}

export const tensOnes50 = tensOnes("tens-ones50", 10, 50);
/** 99까지의 수 차시: 50까지는 앞 단원에서 배웠으므로 51~99 */
export const tensOnes100 = tensOnes("tens-ones100", 51, 99);

function compareNumbers(id: string, max: number): Generator {
  return {
    id,
    level: 1,
    make(rand) {
      const a = randInt(rand, 10, max);
      const b = rand() < 0.1 ? a : randInt(rand, 10, max);
      const answer = sign(a, b);
      return {
        key: `${id}:${a}:${b}`,
        typeId: id,
        prompt: "○ 안에 >, =, < 중 알맞은 것을 고르세요.",
        expression: `${a} ○ ${b}`,
        input: "choice",
        choices: COMPARE_CHOICES,
        answer,
        hint: "10개씩 묶음의 수를 먼저 비교하고, 같으면 낱개를 비교해요.",
        explanation: `${a} ${answer} ${b}`,
      };
    },
  };
}

export const compare50 = compareNumbers("compare50", 50);
export const compare100 = compareNumbers("compare100", 99);

export const numBetween: Generator = {
  id: "num-between",
  level: 2,
  make(rand) {
    const a = randInt(rand, 10, 48);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}`,
      prompt: `${josa(a, "과/와")} ${a + 2} 사이에 있는 수는 무엇인가요?`,
      answer: a + 1,
      hint: "수를 차례로 세어 보세요.",
      explanation: `${a}, ${a + 1}, ${a + 2}`,
    });
  },
};

export const evenOdd: Generator = {
  id: "even-odd",
  level: 2,
  make(rand) {
    const wantEven = rand() < 0.5;
    const pool = (even: boolean) => shuffle(rand, Array.from({ length: 25 }, (_, i) => i * 2 + (even ? 2 : 1)));
    const answer = String(pool(wantEven)[0]);
    const others = pool(!wantEven).slice(0, 3).map(String);
    const choices = shuffle(rand, [answer, ...others]);
    return {
      key: `${this.id}:${wantEven}:${choices.join()}`,
      typeId: this.id,
      prompt: `${wantEven ? "짝수" : "홀수"}를 고르세요.`,
      input: "choice",
      choices,
      answer,
      hint: "낱개의 수(뒤의 숫자)가 0, 2, 4, 6, 8이면 짝수, 1, 3, 5, 7, 9이면 홀수예요.",
      explanation: `${josa(answer, "은/는")} ${wantEven ? "짝수" : "홀수"}입니다.`,
    };
  },
};

export const skipCount100: Generator = {
  id: "skip-count100",
  level: 2,
  make(rand) {
    const step = pick(rand, [2, 5, 10]);
    const start = randInt(rand, 1, 60);
    const seq = Array.from({ length: 5 }, (_, i) => start + step * i);
    const missing = randInt(rand, 2, 4);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${step}:${start}:${missing}`,
      prompt: "규칙에 따라 □ 안에 알맞은 수를 써넣으세요.",
      expression: seq.map((n, i) => (i === missing ? "□" : String(n))).join(", "),
      answer: seq[missing],
      hint: "얼마씩 커지는지 살펴보세요.",
      explanation: `${step}씩 커지므로 ${seq[missing]}`,
    });
  },
};

/* ── 1-2 덧셈과 뺄셈 ── */

export const make10: Generator = {
  id: "make10",
  level: 1,
  make(rand) {
    const a = randInt(rand, 1, 9);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}`,
      prompt: "10이 되도록 □ 안에 알맞은 수를 써넣으세요.",
      expression: `${a} + □ = 10`,
      answer: 10 - a,
      visual: dotsScene(a, `10칸 중 ${a}칸에 점`),
      hint: "10칸 틀에서 빈칸의 수를 세어 보세요.",
      explanation: `${a} + ${10 - a} = 10`,
    });
  },
};

/** 세 수의 덧셈(단원 첫 차시): 받아올림·10 만들기는 뒤 차시라 합은 9 이하 */
export const add3Nums: Generator = {
  id: "add-3nums",
  level: 1,
  make(rand) {
    const a = randInt(rand, 1, 7);
    const b = randInt(rand, 1, 8 - a);
    const c = randInt(rand, 1, 9 - a - b);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}:${c}`,
      prompt: "계산해 보세요.",
      expression: `${a} + ${b} + ${c} = □`,
      answer: a + b + c,
      hint: "앞의 두 수를 먼저 더하고, 그 결과에 나머지 수를 더해요.",
      explanation: `${a} + ${b} = ${a + b}, ${a + b} + ${c} = ${a + b + c}`,
    });
  },
};

export const addCarry1: Generator = {
  id: "add-carry1",
  level: 1,
  make(rand) {
    const a = randInt(rand, 2, 9);
    const b = randInt(rand, 11 - a, 9);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: "덧셈을 하세요.",
      expression: `${a} + ${b} = □`,
      answer: a + b,
      hint: `${josa(b, "을/를")} ${josa(10 - a, "과/와")} ${josa(b - (10 - a), "으로/로")} 갈라 ${josa(a, "과/와")} 먼저 10을 만들어요.`,
      explanation: `${a} + ${10 - a} = 10, 10 + ${b - (10 - a)} = ${a + b}`,
      mistakes: { [a + b - 10]: "10을 빠뜨렸어요." },
    });
  },
};

export const subBorrow1: Generator = {
  id: "sub-borrow1",
  level: 2,
  make(rand) {
    const b = randInt(rand, 2, 9);
    const a = randInt(rand, 11, 9 + b);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: "뺄셈을 하세요.",
      expression: `${a} − ${b} = □`,
      answer: a - b,
      hint: `${josa(a, "을/를")} 10과 ${josa(a - 10, "으로/로")} 갈라 10에서 ${josa(b, "을/를")} 먼저 빼요.`,
      explanation: `10 − ${b} = ${10 - b}, ${10 - b} + ${a - 10} = ${a - b}`,
      mistakes: { [Math.abs(a - 10 - b)]: "낱개끼리 거꾸로 뺐어요." },
    });
  },
};

export const add2NoCarry: Generator = {
  id: "add2-no-carry",
  level: 1,
  make(rand) {
    const a = randInt(rand, 1, 8) * 10 + randInt(rand, 0, 8);
    const b = randInt(rand, 1, 9 - Math.floor(a / 10)) * 10 + randInt(rand, 0, 9 - (a % 10));
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: "계산해 보세요.",
      visual: { kind: "column", op: "+", a, b },
      answer: a + b,
      hint: "낱개끼리, 10개씩 묶음끼리 더해요.",
      explanation: `${a} + ${b} = ${a + b}`,
    });
  },
};

export const sub2NoBorrow: Generator = {
  id: "sub2-no-borrow",
  level: 1,
  make(rand) {
    const a = randInt(rand, 2, 9) * 10 + randInt(rand, 1, 9);
    const b = randInt(rand, 1, Math.floor(a / 10) - 1) * 10 + randInt(rand, 0, a % 10);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: "계산해 보세요.",
      visual: { kind: "column", op: "-", a, b },
      answer: a - b,
      hint: "낱개끼리, 10개씩 묶음끼리 빼요.",
      explanation: `${a} − ${b} = ${a - b}`,
    });
  },
};

/* ── 1-2 모양과 시각 ── */

export const clockRead: Generator = {
  id: "clock-read",
  level: 1,
  make(rand) {
    const h = randInt(rand, 1, 12);
    const m = pick(rand, [0, 30]);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${h}:${m}`,
      prompt: "시계가 나타내는 시각을 쓰세요.",
      visual: clockScene(h, m),
      answer: `${h},${m}`,
      fields: ["시", "분"],
      hint: "짧은바늘은 '시', 긴바늘은 '분'을 나타내요. 긴바늘이 12를 가리키면 0분, 6을 가리키면 30분이에요.",
      explanation: `${h}시 ${m === 0 ? "정각(0분)" : "30분"}`,
    });
  },
};

/* ── 1-2 규칙 찾기 ── */

const SYMBOLS = ["○", "△", "☆", "◇", "♡"]; // □는 빈칸 표시라 뺀다

export const patternRepeat: Generator = {
  id: "pattern-repeat",
  level: 1,
  make(rand) {
    const unitLen = randInt(rand, 2, 3);
    const unit = shuffle(rand, SYMBOLS).slice(0, unitLen);
    const shownLen = unitLen * 2 + randInt(rand, 0, unitLen - 1);
    const seq = Array.from({ length: shownLen + 1 }, (_, i) => unit[i % unitLen]);
    const answer = seq[shownLen];
    return {
      key: `${this.id}:${unit.join("")}:${shownLen}`,
      typeId: this.id,
      prompt: "규칙에 따라 ?에 알맞은 모양을 고르세요.",
      visual: tokensScene([...seq.slice(0, shownLen), "?"], "규칙에 따라 늘어놓은 모양", { perRow: 13 }),
      input: "choice",
      choices: makeChoices(rand, answer, SYMBOLS.filter((s) => s !== answer), () => pick(rand, SYMBOLS)),
      answer,
      hint: "되풀이되는 부분을 찾아보세요.",
      explanation: `${josa(unit.join(" "), "이/가")} 되풀이되므로 ${answer}`,
    };
  },
};
