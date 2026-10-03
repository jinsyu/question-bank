import type { Generator } from "../types";
import { pick, randInt } from "../../lib/random";
import { addWithoutCarry, COMPARE_CHOICES, hasBorrow, hasCarry, numberProblem, sign, subtractWithoutBorrow } from "./common";
import { unitAddSub, unitConvert } from "./measure";
import { josa } from "../josa";

/* ── 세 자리 수·네 자리 수 ── */

function composeNumber(id: string, digits: 3 | 4): Generator {
  const units = digits === 3 ? [100, 10, 1] : [1000, 100, 10, 1];
  return {
    id,
    level: 1,
    make(rand) {
      const counts = units.map((_, i) => randInt(rand, i === 0 ? 1 : 0, 9));
      const n = counts.reduce((sum, c, i) => sum + c * units[i], 0);
      return numberProblem({
        typeId: id,
        key: `${id}:${n}`,
        prompt: `${units.map((u, i) => `${u}이 ${counts[i]}개`).join(", ")}인 수를 쓰세요.`,
        answer: n,
        hint: "높은 자리부터 차례로 숫자를 써요. 없는 자리는 0이에요.",
        explanation: `${n}입니다.`,
      });
    },
  };
}

export const compose3 = composeNumber("compose3", 3);
export const compose4 = composeNumber("compose4", 4);

function placeValue(id: string, digits: 3 | 4): Generator {
  const names = ["일", "십", "백", "천"];
  return {
    id,
    level: 1,
    make(rand) {
      const n = randInt(rand, 10 ** (digits - 1), 10 ** digits - 1);
      const idx = randInt(rand, 0, digits - 2);
      const d = Number(String(n)[idx]);
      if (d === 0) return this.make(rand);
      const place = digits - 1 - idx;
      return numberProblem({
        typeId: id,
        key: `${id}:${n}:${idx}`,
        prompt: `${n}에서 ${names[place]}의 자리 숫자 ${josa(d, "이/가")} 나타내는 값은 얼마인가요?`,
        answer: d * 10 ** place,
        hint: `${names[place]}의 자리 숫자는 ${10 ** place}이 몇 개인지 나타내요.`,
        // 곱셈(2-1 6단원)을 배우기 전이라 ×를 쓰지 않고 말로 쓴다
        explanation: `${names[place]}의 자리 숫자 ${josa(d, "은/는")} ${josa(10 ** place, "이/가")} ${d}개이므로 ${josa(d * 10 ** place, "을/를")} 나타내요.`,
        mistakes: { [d]: "숫자만 썼어요." },
      });
    },
  };
}

export const place3 = placeValue("place3", 3);
export const place4 = placeValue("place4", 4);

function compareDigits(id: string, digits: 3 | 4): Generator {
  return {
    id,
    level: 1,
    make(rand) {
      const a = randInt(rand, 10 ** (digits - 1), 10 ** digits - 1);
      const change = 10 ** randInt(rand, 0, digits - 1);
      const b = rand() < 0.1 ? a : Math.min(10 ** digits - 1, Math.max(10 ** (digits - 1), a + (rand() < 0.5 ? -1 : 1) * change * randInt(rand, 1, 3)));
      const answer = sign(a, b);
      return {
        key: `${id}:${a}:${b}`,
        typeId: id,
        prompt: "○ 안에 >, =, < 중 알맞은 것을 고르세요.",
        expression: `${a} ○ ${b}`,
        input: "choice",
        choices: COMPARE_CHOICES,
        answer,
        hint: "가장 높은 자리부터 차례로 비교해요.",
        explanation: `${a} ${answer} ${b}`,
      };
    },
  };
}

export const compare3 = compareDigits("compare3", 3);
export const compare4 = compareDigits("compare4", 4);

function skipCount(id: string, steps: number[], max: number): Generator {
  return {
    id,
    level: 2,
    make(rand) {
      const step = pick(rand, steps);
      const start = randInt(rand, 100, max - step * 5);
      const seq = Array.from({ length: 5 }, (_, i) => start + step * i);
      const missing = randInt(rand, 2, 4);
      return numberProblem({
        typeId: id,
        key: `${id}:${step}:${start}:${missing}`,
        prompt: "뛰어 센 규칙에 따라 □ 안에 알맞은 수를 써넣으세요.",
        expression: seq.map((n, i) => (i === missing ? "□" : String(n))).join(", "),
        answer: seq[missing],
        hint: "어느 자리 숫자가 1씩 커지는지 살펴보세요.",
        explanation: `${step}씩 뛰어 세었으므로 ${seq[missing]}`,
      });
    },
  };
}

export const skip3 = skipCount("skip3", [1, 10, 100], 999);
export const skip4 = skipCount("skip4", [10, 100, 1000], 9999);

/* ── 2-1 덧셈과 뺄셈 ── */

export const add2Carry: Generator = {
  id: "add2-carry",
  level: 1,
  make(rand) {
    let a = 0;
    let b = 0;
    while (!hasCarry(a, b) || a + b > 199) {
      a = randInt(rand, 15, 89);
      b = randInt(rand, 15, 89);
    }
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: "계산해 보세요.",
      visual: { kind: "column", op: "+", a, b },
      answer: a + b,
      hint: "일의 자리 합이 10이 넘으면 십의 자리로 1을 받아올려요.",
      explanation: `${a} + ${b} = ${a + b}`,
      mistakes: { [addWithoutCarry(a, b)]: "받아올림을 빠뜨렸어요." },
    });
  },
};

export const sub2Borrow: Generator = {
  id: "sub2-borrow",
  level: 1,
  make(rand) {
    let a = 0;
    let b = 0;
    while (!hasBorrow(a, b) || a <= b) {
      a = randInt(rand, 30, 99);
      b = randInt(rand, 11, 89);
    }
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: "계산해 보세요.",
      visual: { kind: "column", op: "-", a, b },
      answer: a - b,
      hint: "일의 자리끼리 뺄 수 없으면 십의 자리에서 10을 받아내려요.",
      explanation: `${a} − ${b} = ${a - b}`,
      mistakes: { [subtractWithoutBorrow(a, b)]: "받아내림 없이 큰 수에서 작은 수를 뺐어요." },
    });
  },
};

export const missingAddend: Generator = {
  id: "missing-addend",
  level: 2,
  make(rand) {
    const a = randInt(rand, 12, 60);
    const b = randInt(rand, 8, 39);
    const kind = pick(rand, ["add", "sub"]);
    return kind === "add"
      ? numberProblem({
          typeId: this.id,
          key: `${this.id}:a:${a}:${b}`,
          prompt: "□ 안에 알맞은 수를 구하세요.",
          expression: `${a} + □ = ${a + b}`,
          answer: b,
          hint: "덧셈식을 뺄셈식으로 바꿔 보세요.",
          explanation: `□ = ${a + b} − ${a} = ${b}`,
          mistakes: { [2 * a + b]: "빼야 하는데 더했어요." },
        })
      : numberProblem({
          typeId: this.id,
          key: `${this.id}:s:${a}:${b}`,
          prompt: "□ 안에 알맞은 수를 구하세요.",
          expression: `□ − ${b} = ${a}`,
          answer: a + b,
          hint: "뺄셈식을 덧셈식으로 바꿔 보세요.",
          explanation: `□ = ${a} + ${b} = ${a + b}`,
          mistakes: { [Math.abs(a - b)]: "더해야 하는데 뺐어요." },
        });
  },
};

export const threeNumbers: Generator = {
  id: "three-numbers",
  level: 1,
  make(rand) {
    const a = randInt(rand, 20, 60);
    const b = randInt(rand, 10, 39);
    const c = randInt(rand, 5, Math.min(29, a + b - 1));
    const addFirst = rand() < 0.5;
    const r = addFirst ? a + b - c : a - Math.min(b, a - 1) + c;
    const bb = addFirst ? b : Math.min(b, a - 1);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${addFirst}:${a}:${bb}:${c}`,
      prompt: "앞에서부터 차례로 계산하세요.",
      expression: addFirst ? `${a} + ${bb} − ${c} = □` : `${a} − ${bb} + ${c} = □`,
      answer: r,
      hint: "세 수의 계산은 앞에서부터 두 수씩 차례로 해요.",
      explanation: addFirst ? `${a} + ${bb} = ${a + bb}, ${a + bb} − ${c} = ${r}` : `${a} − ${bb} = ${a - bb}, ${a - bb} + ${c} = ${r}`,
    });
  },
};

/* ── 2-1 길이 재기 ── */

export const rulerRead: Generator = {
  id: "ruler-read",
  level: 1,
  make(rand) {
    const start = randInt(rand, 0, 3);
    const len = randInt(rand, 2, 9);
    const u = 26;
    const x0 = 12;
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${start}:${len}`,
      prompt: "막대의 길이는 몇 cm인가요?",
      visual: {
        kind: "shape",
        width: x0 * 2 + u * 12,
        height: 90,
        label: `자 위에 놓인 막대, ${start}부터 ${start + len}까지`,
        polygons: [
          { fill: true, points: [[x0 + start * u, 12], [x0 + (start + len) * u, 12], [x0 + (start + len) * u, 32], [x0 + start * u, 32]] },
          { points: [[x0, 42], [x0 + u * 12, 42], [x0 + u * 12, 62], [x0, 62]] },
        ],
        lines: Array.from({ length: 13 }, (_, i) => ({ from: [x0 + i * u, 42] as [number, number], to: [x0 + i * u, 54] as [number, number], width: 1 })),
        texts: Array.from({ length: 13 }, (_, i) => ({ at: [x0 + i * u, 76] as [number, number], text: String(i) })),
      },
      answer: len,
      fields: ["cm"],
      hint: "막대의 한쪽 끝이 0에 있지 않으면, 1 cm가 몇 번 들어가는지 세어요.",
      explanation: `${start}부터 ${start + len}까지 1 cm가 ${len}번 → ${len} cm`,
      mistakes: start > 0 ? { [start + len]: "끝의 눈금을 그대로 읽었어요. 시작 눈금이 0이 아니에요." } : {},
    });
  },
};

/* ── 2-1 곱셈, 2-2 곱셈구구 ── */

export const groupsOf: Generator = {
  id: "groups-of",
  level: 1,
  make(rand) {
    const a = randInt(rand, 2, 9);
    const b = randInt(rand, 2, 6);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: `${a}씩 ${b}묶음은 모두 몇인가요?`,
      expression: `${a}의 ${b}배`,
      answer: a * b,
      hint: `${josa(a, "을/를")} ${b}번 더해 보세요.`,
      explanation: `${Array(b).fill(a).join(" + ")} = ${a * b}`,
      mistakes: { [a + b]: `${a}씩 ${b}묶음은 ${josa(a, "을/를")} ${b}번 더해요.` },
    });
  },
};

export const timesTable: Generator = {
  id: "times-table",
  level: 1,
  make(rand) {
    const a = randInt(rand, 2, 9);
    const b = randInt(rand, 1, 9);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: "곱셈구구를 하세요.",
      expression: `${a} × ${b} = □`,
      answer: a * b,
      hint: `${a}단은 ${a}씩 커져요.`,
      explanation: `${a} × ${b} = ${a * b}`,
      mistakes: { [a * (b - 1)]: `${a}만큼 모자라요.`, [a * (b + 1)]: `${a}만큼 더 많아요.` },
    });
  },
};

/** 1단 곱셈구구와 0의 곱에서 □ 구하기(답이 하나뿐인 식만) */
export const timesTableMissing: Generator = {
  id: "times-one-zero-missing",
  level: 2,
  make(rand) {
    const n = randInt(rand, 2, 9);
    const kind = randInt(rand, 0, 3);
    const [expression, answer, hint] = [
      [`1 × □ = ${n}`, n, "1과 어떤 수의 곱은 항상 어떤 수예요."],
      [`□ × 1 = ${n}`, n, "어떤 수와 1의 곱은 항상 어떤 수예요."],
      [`${n} × □ = 0`, 0, "어떤 수와 0의 곱은 항상 0이에요."],
      [`□ × ${n} = 0`, 0, "0과 어떤 수의 곱은 항상 0이에요."],
    ][kind] as [string, number, string];
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${kind}:${n}`,
      prompt: "□ 안에 알맞은 수를 써넣으세요.",
      expression,
      answer,
      hint,
      explanation: expression.replace("□", String(answer)),
      mistakes: kind >= 2 ? { 1: "0과의 곱은 0이에요." } : { 1: "1과의 곱은 곱하는 수 그대로예요." },
    });
  },
};

export const timesZeroOne: Generator = {
  id: "times-zero-one",
  level: 1,
  make(rand) {
    const zero = rand() < 0.5;
    const n = randInt(rand, 1, 9);
    const left = rand() < 0.5;
    const k = zero ? 0 : 1;
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${k}:${n}:${left}`,
      prompt: "계산해 보세요.",
      expression: left ? `${k} × ${n} = □` : `${n} × ${k} = □`,
      answer: k * n,
      hint: zero ? "0과 어떤 수의 곱은 항상 0이에요." : "1과 어떤 수의 곱은 그 수 자신이에요.",
      explanation: `${left ? `${k} × ${n}` : `${n} × ${k}`} = ${k * n}`,
      mistakes: zero ? { [n]: "0을 곱하면 0이에요." } : { [n + 1]: "1을 더한 것이 아니라 곱했어요." },
    });
  },
};

/* ── 2-2 길이 재기(m) ── */

export const lenMCm = unitConvert({ id: "len-m-cm", level: 1, big: "m", small: "cm", rate: 100, maxBig: 9 });
export const lenMCmAddSub = unitAddSub({ id: "len-m-cm-add-sub", big: "m", small: "cm", rate: 100, maxBig: 8 });

/* ── 2-2 규칙 찾기 ── */

/** 덧셈표(+)·곱셈표(×)의 빈칸: 차시마다 표 종류를 고정한다 */
function tablePattern(id: string, op: "+" | "×"): Generator {
  return {
    id,
    level: 2,
    make(rand) {
      const rows = [randInt(rand, 1, 5), 0, 0].map((v, i, arr) => (i === 0 ? v : arr[0] + i));
      const cols = [randInt(rand, 1, 5)];
      cols.push(cols[0] + 1, cols[0] + 2);
      const f = (r: number, c: number) => (op === "+" ? r + c : r * c);
      const mr = randInt(rand, 0, 2);
      const mc = randInt(rand, 0, 2);
      return numberProblem({
        typeId: id,
        key: `${id}:${rows[0]}:${cols[0]}:${mr}:${mc}`,
        prompt: `${op === "+" ? "덧셈표" : "곱셈표"}의 규칙을 찾아 □ 안에 알맞은 수를 쓰세요.`,
        visual: {
          kind: "table",
          header: [op, ...cols.map(String)],
          rows: rows.map((r, i) => [String(r), ...cols.map((c, j) => (i === mr && j === mc ? "□" : String(f(r, c))))]),
        },
        answer: f(rows[mr], cols[mc]),
        hint: op === "+" ? "왼쪽 수와 위쪽 수를 더한 값이에요." : "왼쪽 수와 위쪽 수를 곱한 값이에요.",
        explanation: `${rows[mr]} ${op} ${cols[mc]} = ${f(rows[mr], cols[mc])}`,
      });
    },
  };
}

export const addTablePattern = tablePattern("table-pattern-add", "+");
export const mulTablePattern = tablePattern("table-pattern-mul", "×");
