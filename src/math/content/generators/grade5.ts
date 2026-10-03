import type { Generator } from "../types";
import { makeChoices, pick, randInt } from "../../lib/random";
import { COMPARE_CHOICES, numberProblem, sign } from "./common";
import { mixedText } from "./grade4";
import { jq } from "../lessons/g5-text";

export const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
export const lcm = (a: number, b: number) => (a / gcd(a, b)) * b;
/** 기약분수(대분수 표기) */
export const reduced = (n: number, d: number) => {
  const g = gcd(n, d);
  return mixedText(n / g, d / g);
};

/* ── 5-1 자연수의 혼합 계산 ── */

type Expr = { text: string; value: number; leftToRight: number };

/** 덧셈, 뺄셈, 곱셈, 나눗셈이 모두 섞인 식(이 차시의 목표). 값은 자연수 */
function mixedExpr(rand: () => number): Expr {
  for (;;) {
    const form = randInt(rand, 0, 2);
    const a = randInt(rand, 10, 60);
    const b = randInt(rand, 2, 9);
    const c = randInt(rand, 2, 9);
    const e = randInt(rand, 2, 6);
    const d = e * randInt(rand, 2, 9);
    const ltr = (x: number) => (Number.isInteger(x) ? x : NaN);
    const ex: Expr =
      form === 0
        ? { text: `${a} + ${b} × ${c} − ${d} ÷ ${e}`, value: a + b * c - d / e, leftToRight: ltr(((a + b) * c - d) / e) }
        : form === 1
          ? { text: `${a} − ${d} ÷ ${e} + ${b} × ${c}`, value: a - d / e + b * c, leftToRight: ltr(((a - d) / e + b) * c) }
          : { text: `(${a} + ${b}) × ${c} − ${d} ÷ ${e}`, value: (a + b) * c - d / e, leftToRight: ltr(a + b * c - d / e) };
    if (ex.value > 0) return ex;
  }
}

export const mixedCalc: Generator = {
  id: "mixed-calc",
  level: 1,
  make(rand) {
    const e = mixedExpr(rand);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${e.text}`,
      prompt: "계산 순서에 맞게 계산하세요.",
      expression: `${e.text} = □`,
      answer: e.value,
      hint: "( ) 안을 먼저, 그다음 ×와 ÷, 마지막으로 +와 −를 앞에서부터 계산해요.",
      explanation: `${e.text} = ${e.value}`,
      mistakes: Number.isInteger(e.leftToRight) && e.leftToRight > 0 && e.leftToRight !== e.value ? { [e.leftToRight]: "계산 순서를 지키지 않고 앞에서부터 계산했어요." } : {},
    });
  },
};

export const mixedCalcWord: Generator = {
  id: "mixed-calc-word",
  level: 2,
  make(rand) {
    // 공책 값과, 여러 자루를 묶어 파는 연필 한 자루 값(÷)을 함께 계산한다
    const price = randInt(rand, 3, 9) * 100;
    const n = randInt(rand, 2, 5);
    const k = pick(rand, [3, 4, 5]);
    const pack = k * randInt(rand, 2, 6) * 100;
    const cost = price * n + pack / k;
    const paid = Math.ceil((cost + 100) / 1000) * 1000;
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${price}:${n}:${pack}:${k}`,
      prompt: `한 권에 ${price}원인 공책 ${n}권과, ${k}자루에 ${pack}원인 연필 1자루를 사고 ${paid}원을 냈습니다. 거스름돈은 얼마인지 하나의 식으로 나타내어 구하세요.`,
      answer: paid - cost,
      fields: ["원"],
      hint: `${paid} − (${price} × ${n} + ${pack} ÷ ${k})처럼 ( ) 안의 곱셈과 나눗셈을 먼저 계산해요.`,
      explanation: `${paid} − (${price} × ${n} + ${pack} ÷ ${k}) = ${paid} − ${cost} = ${paid - cost}(원)`,
      mistakes: { [paid - price * n - pack]: "연필 1자루의 값은 묶음 값을 자루 수로 나누어야 해요." },
    });
  },
};

/* ── 5-1 약수와 배수 ── */

const divisors = (n: number) => Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0);

export const divisorCount: Generator = {
  id: "divisor-count",
  level: 1,
  make(rand) {
    const n = randInt(rand, 6, 60);
    const ds = divisors(n);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${n}`,
      prompt: `${n}의 약수는 모두 몇 개인가요?`,
      answer: ds.length,
      fields: ["개"],
      hint: "곱해서 그 수가 되는 두 수를 짝지어 찾아보세요. 1과 자기 자신도 약수예요.",
      explanation: `${n}의 약수: ${ds.join(", ")} → ${ds.length}개`,
      mistakes: { [ds.length - 2]: "1과 자기 자신을 빠뜨렸어요." },
    });
  },
};

export const gcdLcm: Generator = {
  id: "gcd-lcm",
  level: 2,
  make(rand) {
    const g = randInt(rand, 2, 8);
    let x = randInt(rand, 2, 7);
    let y = randInt(rand, 2, 7);
    while (gcd(x, y) !== 1 || x === y) {
      x = randInt(rand, 2, 7);
      y = randInt(rand, 2, 7);
    }
    const a = g * x;
    const b = g * y;
    const askGcd = rand() < 0.5;
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${askGcd}:${a}:${b}`,
      prompt: `${jq(a, "과/와")} ${b}의 ${jq(askGcd ? "최대공약수" : "최소공배수", "을/를")} 구하세요.`,
      answer: askGcd ? g : lcm(a, b),
      hint: askGcd ? "두 수의 공통인 약수 중 가장 큰 수예요." : "두 수의 공통인 배수 중 가장 작은 수예요.",
      explanation: askGcd ? `최대공약수는 ${g}` : `${a} × ${b} ÷ ${g} = ${lcm(a, b)}`,
      mistakes: askGcd ? {} : { [a * b]: "두 수를 곱하기만 했어요. 공통인 배수 중 가장 작은 수를 찾아요." },
    });
  },
};

export const multipleFind: Generator = {
  id: "multiple-find",
  level: 1,
  make(rand) {
    const n = randInt(rand, 3, 15);
    const k = randInt(rand, 2, 9);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${n}:${k}`,
      prompt: `${n}의 배수 중에서 ${k}번째로 작은 수를 구하세요.`,
      answer: n * k,
      hint: `${jq(n, "을/를")} 1배, 2배, 3배… 한 수를 차례로 써 보세요.`,
      explanation: `${n} × ${k} = ${n * k}`,
    });
  },
};

/* ── 5-1 규칙과 대응 ── */

export const correspondence: Generator = {
  id: "correspondence",
  level: 1,
  make(rand) {
    const mul = rand() < 0.5;
    const k = randInt(rand, 2, 9);
    const xs = [1, 2, 3, 4, 5];
    const f = (x: number) => (mul ? x * k : x + k);
    const askX = randInt(rand, 6, 15);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${mul}:${k}:${askX}`,
      prompt: `표를 보고 대응 관계를 찾아 ○가 ${askX}일 때 △를 구하세요.`,
      visual: { kind: "table", header: ["○", ...xs.map(String)], rows: [["△", ...xs.map((x) => String(f(x)))]] },
      answer: f(askX),
      hint: "○와 △ 사이에 늘 같은 관계(더하기 또는 곱하기)가 있는지 찾아요.",
      explanation: `△ = ○ ${mul ? "×" : "+"} ${k} → ${f(askX)}`,
    });
  },
};

export const correspondenceRule: Generator = {
  id: "correspondence-rule",
  level: 2,
  make(rand) {
    const mul = rand() < 0.5;
    const k = randInt(rand, 2, 9);
    const f = (x: number) => (mul ? x * k : x + k);
    const answer = mul ? `△ = ○ × ${k}` : `△ = ○ + ${k}`;
    return {
      key: `${this.id}:${mul}:${k}`,
      typeId: this.id,
      prompt: "○와 △의 대응 관계를 나타낸 식을 고르세요.",
      visual: { kind: "table", header: ["○", "1", "2", "3", "4"], rows: [["△", ...[1, 2, 3, 4].map((x) => String(f(x)))]] },
      input: "choice",
      choices: makeChoices(rand, answer, [mul ? `△ = ○ + ${k - 1}` : `△ = ○ × ${k + 1}`, `△ = ○ + ${k}`, `△ = ○ × ${k}`, `△ = ○ − ${k}`], () => `△ = ○ + ${randInt(rand, 1, 9)}`),
      answer,
      hint: "두 번째, 세 번째 칸에서도 같은 식이 맞는지 확인해요.",
      explanation: answer,
    };
  },
};

/* ── 5-1 약분과 통분 ── */

export const reduceFraction: Generator = {
  id: "reduce-fraction",
  level: 1,
  make(rand) {
    const d0 = randInt(rand, 3, 12);
    const n0 = randInt(rand, 1, d0 - 1);
    if (gcd(n0, d0) !== 1) return this.make(rand);
    const k = randInt(rand, 2, 6);
    const answer = `${n0}/${d0}`;
    // 오답: 분모만 나눔, 분자만 나눔, 최대공약수가 아닌 공약수로 한 번만 약분함(k = 4, 6일 때 2로 나눔 — 값은 같지만 기약분수가 아니다)
    const partial = k % 2 === 0 && k > 2 ? [`${(n0 * k) / 2}/${(d0 * k) / 2}`] : [];
    const wrong = [...partial, ...(n0 * k === d0 ? [] : [`${n0 * k}/${d0}`]), `${n0}/${d0 * k}`];
    // 보충 보기: 정답·다른 오답과 값이 다른 기약 진분수(값 비교를 끈 makeChoices에서 오답끼리 값이 같아지지 않게)
    const values = [answer, ...wrong].map((c) => c.split("/").map(Number)).map(([a, b]) => a / b);
    const filler = () => {
      const d = randInt(rand, 2, 12);
      const n = randInt(rand, 1, d - 1);
      return gcd(n, d) === 1 && values.every((v) => Math.abs(v - n / d) > 1e-9) ? `${n}/${d}` : answer;
    };
    return {
      key: `${this.id}:${n0}:${d0}:${k}`,
      typeId: this.id,
      prompt: "기약분수로 나타낸 것을 고르세요.",
      expression: `${n0 * k}/${d0 * k}`,
      input: "choice",
      choices: makeChoices(rand, answer, wrong, filler, true),
      answer,
      hint: "분모와 분자를 최대공약수로 나누어요.",
      explanation: `분모와 분자를 ${jq(k, "으로/로")} 나누면 ${answer}`,
    };
  },
};

export const commonDenominator: Generator = {
  id: "common-denominator",
  level: 1,
  make(rand) {
    const a = randInt(rand, 2, 12);
    let b = randInt(rand, 2, 12);
    if (a === b) b = a + 1;
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: `${jq(`1/${a}`, "과/와")} ${jq(`1/${b}`, "을/를")} 가장 작은 공통분모로 통분할 때 공통분모는 얼마인가요?`,
      answer: lcm(a, b),
      hint: "두 분모의 최소공배수를 구해요.",
      explanation: `${jq(a, "과/와")} ${b}의 최소공배수 ${lcm(a, b)}`,
      mistakes: lcm(a, b) !== a * b ? { [a * b]: "분모끼리 곱한 수도 공통분모이지만 가장 작은 공통분모는 아니에요." } : {},
    });
  },
};

export const compareUnlike: Generator = {
  id: "compare-unlike",
  level: 2,
  make(rand) {
    // 분자도 분모도 서로 다른 기약분수끼리(단위분수끼리처럼 통분하지 않고 풀리는 경우를 뺀다)
    let [n1, d1, n2, d2] = [1, 2, 1, 3];
    for (let i = 0; i < 100; i++) {
      d1 = randInt(rand, 3, 10);
      d2 = randInt(rand, 3, 10);
      n1 = randInt(rand, 1, d1 - 1);
      n2 = randInt(rand, 1, d2 - 1);
      if (d1 !== d2 && n1 !== n2 && gcd(n1, d1) === 1 && gcd(n2, d2) === 1) break;
    }
    const answer = sign(n1 * d2, n2 * d1);
    return {
      key: `${this.id}:${n1}/${d1}:${n2}/${d2}`,
      typeId: this.id,
      prompt: "○ 안에 >, =, < 중 알맞은 것을 고르세요.",
      expression: `${n1}/${d1} ○ ${n2}/${d2}`,
      input: "choice",
      choices: COMPARE_CHOICES,
      answer,
      hint: "통분하여 분자끼리 비교해요.",
      explanation: `${n1 * d2}/${d1 * d2} ${answer} ${n2 * d1}/${d1 * d2}`,
    };
  },
};

/* ── 5-1 분수의 덧셈과 뺄셈(분모가 다른) ── */

/** 대분수 뺄셈에서 받아내림하는 문제의 비율(받아내림 없는 기본형은 l5-fms-easy가 맡는다) */
const BORROW_SHARE = 0.6;

function unlikeAddSub(id: string, level: 1 | 2, add: boolean, mixed: boolean): Generator {
  return {
    id,
    level,
    make(rand) {
      const d1 = randInt(rand, 2, 9);
      let d2 = randInt(rand, 2, 9);
      if (d1 === d2) d2 = d1 === 9 ? 4 : d1 + 1;
      const subMixed = !add && mixed;
      // 대분수의 뺄셈은 자연수 부분을 다르게 한다(같으면 진분수의 뺄셈과 같아진다)
      const w1 = subMixed ? randInt(rand, 2, 4) : mixed ? randInt(rand, 1, 4) : 0;
      const w2 = subMixed ? randInt(rand, 1, w1 - 1) : mixed ? randInt(rand, 1, w1) : 0;
      const wantBorrow = subMixed && rand() < BORROW_SHARE;
      const L = lcm(d1, d2);
      for (let i = 0; i < 200; i++) {
        const f1 = randInt(rand, 1, d1 - 1);
        const f2 = randInt(rand, 1, d2 - 1);
        // 분수 부분은 기약분수로(3 4/8 같은 표기가 나오지 않게)
        if (gcd(f1, d1) !== 1 || gcd(f2, d2) !== 1) continue;
        if (subMixed && f1 * (L / d1) < f2 * (L / d2) !== wantBorrow) continue;
        if (!add && !mixed && f1 * (L / d1) === f2 * (L / d2)) continue;
        return build(rand, [w1 * d1 + f1, d1], [w2 * d2 + f2, d2], L);
      }
      return this.make(rand);
    },
  };

  function build(rand: () => number, p: number[], q: number[], L: number) {
    let [a, b] = [p, q];
    let x = a[0] * (L / a[1]);
    let y = b[0] * (L / b[1]);
    if (!add && x < y) {
      [x, y] = [y, x];
      [a, b] = [b, a];
    }
    const r = add ? x + y : x - y;
    const answer = reduced(r, L);
    const borrow = !add && x % L < y % L;
    const { distractors, mistakes } = wrongAnswers(a, b, x, y, L);
    return {
      key: `${id}:${a.join("/")}:${b.join("/")}`,
      typeId: id,
      prompt: "계산하여 기약분수로 나타낸 것을 고르세요.",
      expression: `${mixedText(a[0], a[1])} ${add ? "+" : "−"} ${mixedText(b[0], b[1])}`,
      input: "choice" as const,
      choices: makeChoices(rand, answer, distractors.filter((c) => c !== answer), () => reduced(randInt(rand, mixed ? L * 2 : 1, L * (mixed ? 10 : 3)), L)),
      answer,
      hint: borrow ? "통분한 뒤 분수 부분끼리 뺄 수 없으면 자연수에서 1을 받아내림해요." : "분모의 최소공배수로 통분한 뒤 분자끼리 계산하고, 약분해요.",
      explanation: borrow
        ? `통분하면 ${mixedText(x, L)} − ${mixedText(y, L)} = ${Math.floor(x / L) - 1} ${(x % L) + L}/${L} − ${mixedText(y, L)} = ${answer}`
        : `통분하면 ${mixedText(x, L)} ${add ? "+" : "−"} ${mixedText(y, L)} = ${answer}`,
      mistakes: Object.fromEntries(Object.entries(mistakes).filter(([k]) => k !== answer)),
    };
  }

  /** 학생이 실제로 하는 실수로 만든 오답. 값이 정답과 같은 '받아올림 안 한 표기(3 51/40)'·'약분 안 한 표기'는 쓰지 않는다 */
  function wrongAnswers(a: number[], b: number[], x: number, y: number, L: number): { distractors: string[]; mistakes: Record<string, string> } {
    const r = add ? x + y : x - y;
    const [Fa, Fb] = [x % L, y % L];
    const [Wa, Wb] = [Math.floor(x / L), Math.floor(y / L)];
    const [fa, fb] = [a[0] % a[1], b[0] % b[1]];
    const naiveText = "분모끼리, 분자끼리 더했어요. 먼저 통분해야 해요.";
    if (add && mixed) {
      const naive = reduced((Wa + Wb) * (a[1] + b[1]) + fa + fb, a[1] + b[1]);
      const noCarry = reduced(r - L, L);
      return {
        distractors: [naive, noCarry, reduced(r + L, L)],
        mistakes: { [naive]: naiveText, ...(Fa + Fb >= L ? { [noCarry]: "받아올림한 1을 자연수에 더하지 않았어요." } : {}) },
      };
    }
    if (add) {
      const naive = `${fa + fb}/${a[1] + b[1]}`;
      return { distractors: [naive, reduced(r + 1, L), reduced(Math.max(1, r - 1), L)], mistakes: { [naive]: naiveText } };
    }
    const added = reduced(x + y, L);
    if (Fa < Fb) {
      const flipped = reduced((Wa - Wb) * L + (Fb - Fa), L);
      const noDecrease = reduced(r + L, L);
      return {
        distractors: [flipped, noDecrease, added],
        mistakes: { [flipped]: "분수 부분을 거꾸로 뺐어요. 자연수에서 1을 받아내림해야 해요.", [noDecrease]: "받아내림한 1을 자연수 부분에서 빼지 않았어요.", [added]: "빼야 하는데 더했어요." },
      };
    }
    return { distractors: [added, reduced(r + 1, L), reduced(Math.max(1, r - 1), L)], mistakes: { [added]: "빼야 하는데 더했어요." } };
  }
}

export const unlikeAdd = unlikeAddSub("unlike-add", 1, true, false);
export const unlikeSub = unlikeAddSub("unlike-sub", 1, false, false);
export const unlikeAddMixed = unlikeAddSub("unlike-add-mixed", 1, true, true);
export const unlikeSubMixed = unlikeAddSub("unlike-sub-mixed", 2, false, true);

/* ── 5-1 다각형의 둘레와 넓이 ── */

const AREA_SHAPES = ["직사각형", "정사각형", "평행사변형", "삼각형", "사다리꼴", "마름모"] as const;

export const areaCalc: Generator = {
  id: "area-calc",
  level: 1,
  make(rand) {
    const shape = pick(rand, AREA_SHAPES);
    const a = randInt(rand, 2, 15);
    const b = randInt(rand, 2, 15);
    const c = randInt(rand, 2, 15);
    const even = (n: number) => (n % 2 ? n + 1 : n);
    const spec = {
      직사각형: { text: `가로 ${a} cm, 세로 ${b} cm인 직사각형`, v: a * b, f: "(가로) × (세로)" },
      정사각형: { text: `한 변이 ${a} cm인 정사각형`, v: a * a, f: "(한 변) × (한 변)" },
      평행사변형: { text: `밑변 ${a} cm, 높이 ${b} cm인 평행사변형`, v: a * b, f: "(밑변) × (높이)" },
      삼각형: { text: `밑변 ${even(a)} cm, 높이 ${b} cm인 삼각형`, v: (even(a) * b) / 2, f: "(밑변) × (높이) ÷ 2" },
      사다리꼴: { text: `윗변 ${a} cm, 아랫변 ${a + c} cm, 높이 ${even(b)} cm인 사다리꼴`, v: ((2 * a + c) * even(b)) / 2, f: "((윗변) + (아랫변)) × (높이) ÷ 2" },
      마름모: { text: `두 대각선이 ${even(a)} cm, ${b} cm인 마름모`, v: (even(a) * b) / 2, f: "(한 대각선) × (다른 대각선) ÷ 2" },
    }[shape];
    const halved = shape === "삼각형" || shape === "사다리꼴" || shape === "마름모";
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${shape}:${a}:${b}:${c}`,
      prompt: `${spec.text}의 넓이는 몇 cm²인가요?`,
      answer: spec.v,
      fields: ["cm²"],
      hint: `${shape}의 넓이 = ${spec.f}`,
      explanation: `${spec.f} = ${spec.v}(cm²)`,
      mistakes: halved ? { [spec.v * 2]: "2로 나누지 않았어요." } : {},
    });
  },
};

/* ── 5-2 수의 범위와 어림하기 ── */

export const rangeCount: Generator = {
  id: "range-count",
  level: 1,
  make(rand) {
    const lo = randInt(rand, 10, 60);
    const hi = lo + randInt(rand, 4, 15);
    const loWord = pick(rand, ["이상", "초과"]);
    const hiWord = pick(rand, ["이하", "미만"]);
    const count = hi - lo + 1 - (loWord === "초과" ? 1 : 0) - (hiWord === "미만" ? 1 : 0);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${lo}:${hi}:${loWord}:${hiWord}`,
      prompt: `${lo} ${loWord} ${hi} ${hiWord}인 자연수는 모두 몇 개인가요?`,
      answer: count,
      fields: ["개"],
      hint: "이상·이하는 그 수를 포함하고, 초과·미만은 포함하지 않아요.",
      explanation: `${loWord === "이상" ? lo : lo + 1}부터 ${hiWord === "이하" ? hi : hi - 1}까지 ${count}개`,
      mistakes: { [hi - lo + 1]: "경계의 수를 포함할지 다시 확인해요." },
    });
  },
};

export const rounding: Generator = {
  id: "rounding",
  level: 1,
  make(rand) {
    const n = randInt(rand, 1001, 99999);
    const place = pick(rand, [10, 100, 1000]);
    const how = pick(rand, ["올림", "버림", "반올림"]);
    const v = how === "올림" ? Math.ceil(n / place) * place : how === "버림" ? Math.floor(n / place) * place : Math.round(n / place) * place;
    const placeName = { 10: "십", 100: "백", 1000: "천" }[place];
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${n}:${place}:${how}`,
      prompt: `${jq(n, "을/를")} ${how}하여 ${placeName}의 자리까지 나타내세요.`,
      answer: v,
      hint: "올림은 아래 자리를 올리고, 버림은 버리고, 반올림은 바로 아래 자리가 5 이상이면 올려요.",
      explanation: `${n} → ${v}`,
      mistakes: { [how === "올림" ? Math.floor(n / place) * place : Math.ceil(n / place) * place]: how === "올림" ? "버림을 했어요." : "올림을 했어요." },
    });
  },
};

/* ── 5-2 분수의 곱셈 ── */

export const fracTimesWhole: Generator = {
  id: "frac-times-whole",
  level: 1,
  make(rand) {
    const d = randInt(rand, 2, 12);
    const n = randInt(rand, 1, d - 1);
    // 곱하는 분수는 기약분수로(4/12 × 3 같은 표기가 나오지 않게)
    if (gcd(n, d) !== 1) return this.make(rand);
    const k = randInt(rand, 2, 9);
    const answer = reduced(n * k, d);
    return {
      key: `${this.id}:${n}/${d}:${k}`,
      typeId: this.id,
      // 답이 자연수이면 '기약분수로'라고 묻지 않는다
      prompt: answer.includes("/") ? "계산하여 기약분수로 나타낸 것을 고르세요." : "계산한 값을 고르세요.",
      expression: `${n}/${d} × ${k}`,
      input: "choice",
      choices: makeChoices(rand, answer, [reduced(n, d * k), reduced(n * k, d * k), reduced(n + k, d)], () => reduced(randInt(rand, 1, d * 5), d)),
      answer,
      hint: "분자에 자연수를 곱하고 분모는 그대로 둔 뒤 약분해요.",
      explanation: `${n} × ${k} = ${n * k}이므로 ${n * k}/${d}${`${n * k}/${d}` === answer ? "" : ` = ${answer}`}`,
      mistakes: { [reduced(n * k, d * k)]: "분모에도 곱했어요." },
    };
  },
};

export const fracTimesFrac: Generator = {
  id: "frac-times-frac",
  level: 2,
  make(rand) {
    // 두 분모의 곱은 36 이하(답의 분모가 36 이하), 곱하는 두 분수는 기약분수로(1 4/6, 3/9 같은 표기가 나오지 않게)
    const d1 = randInt(rand, 2, 9);
    const d2 = randInt(rand, 2, 9);
    const n1 = randInt(rand, 1, d1 * 2);
    const n2 = randInt(rand, 1, d2 - 1);
    if (d1 * d2 > 36 || gcd(n1, d1) !== 1 || gcd(n2, d2) !== 1) return this.make(rand);
    const answer = reduced(n1 * n2, d1 * d2);
    // 대분수의 분수 부분에만 곱한 실수(1 2/3 × 5/6 → 1 + 2/3 × 5/6)
    const fracOnly = n1 > d1 ? [reduced(Math.floor(n1 / d1) * d1 * d2 + (n1 % d1) * n2, d1 * d2)] : [];
    return {
      key: `${this.id}:${n1}/${d1}:${n2}/${d2}`,
      typeId: this.id,
      prompt: "계산하여 기약분수로 나타낸 것을 고르세요.",
      expression: `${mixedText(n1, d1)} × ${n2}/${d2}`,
      input: "choice",
      // 오답: 분수 부분에만 곱함, 뒤집어 곱함(나눗셈과 헷갈림), 분모끼리 더함, 분자끼리 더함
      choices: makeChoices(rand, answer, [...fracOnly, reduced(n1 * d2, d1 * n2), reduced(n1 * n2, d1 + d2), reduced(n1 + n2, d1 * d2)], () => reduced(randInt(rand, 1, d1 * d2), d1 * d2)),
      answer,
      hint: "대분수는 가분수로 바꾼 뒤, 분자는 분자끼리 분모는 분모끼리 곱해요.",
      explanation: `${n1}/${d1} × ${n2}/${d2} = ${n1 * n2}/${d1 * d2}${`${n1 * n2}/${d1 * d2}` === answer ? "" : ` = ${answer}`}`,
      mistakes: fracOnly.length && fracOnly[0] !== answer ? { [fracOnly[0]]: "대분수를 가분수로 바꾸지 않고 분수 부분에만 곱했어요." } : {},
    };
  },
};

/* ── 5-2 합동과 대칭 ── */

/* ── 5-2 소수의 곱셈 ── */

const trim = (n: number, places: number) => String(Number(n.toFixed(places)));

export const decTimesWhole: Generator = {
  id: "dec-times-whole",
  level: 1,
  make(rand) {
    const places = randInt(rand, 1, 2);
    const x = randInt(rand, 2, 99);
    const k = randInt(rand, 2, 12);
    const a = x / 10 ** places;
    const r = (x * k) / 10 ** places;
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${x}:${places}:${k}`,
      prompt: "계산해 보세요.",
      expression: `${trim(a, places)} × ${k} = □`,
      answer: trim(r, places),
      hint: "자연수처럼 곱한 뒤, 곱하는 소수의 소수점 아래 자리 수만큼 소수점을 찍어요.",
      explanation: `${x} × ${k} = ${x * k} → ${trim(r, places)}`,
      mistakes: { [String(x * k)]: "소수점을 찍지 않았어요.", [trim((x * k) / 10 ** (places + 1), places + 1)]: "소수점을 한 자리 더 옮겼어요." },
    });
  },
};

export const decTimesDec: Generator = {
  id: "dec-times-dec",
  level: 2,
  make(rand) {
    const x = randInt(rand, 2, 99);
    const y = randInt(rand, 2, 99);
    const px = randInt(rand, 1, 2);
    const py = 1;
    const r = (x * y) / 10 ** (px + py);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${x}:${px}:${y}`,
      prompt: "계산해 보세요.",
      expression: `${trim(x / 10 ** px, px)} × ${trim(y / 10, 1)} = □`,
      answer: trim(r, px + py),
      hint: "두 소수의 소수점 아래 자리 수를 더한 만큼 곱의 소수점 아래 자리가 생겨요.",
      explanation: `${x} × ${y} = ${x * y} → 소수점 아래 ${px + py}자리 → ${trim(r, px + py)}`,
      mistakes: { [trim((x * y) / 10 ** Math.max(px, py), 3)]: "소수점 아래 자리 수를 더하지 않았어요." },
    });
  },
};

/* ── 5-2 직육면체 ── */

/* ── 5-2 평균과 가능성 ── */

/** 2022 개정: 가능성은 0(불가능), 1/2(반반), 1(확실)로만 수로 나타낸다 */
export const CHANCE_VALUES = ["0", "1/2", "1"];

const CHANCE = [
  { q: "주사위를 굴렸을 때 7의 눈이 나올 가능성", a: "0" },
  { q: "동전을 던졌을 때 그림 면이 나올 가능성", a: "1/2" },
  { q: "빨간 공만 들어 있는 주머니에서 빨간 공을 꺼낼 가능성", a: "1" },
  { q: "주사위를 굴렸을 때 짝수의 눈이 나올 가능성", a: "1/2" },
  { q: "흰 공 2개, 검은 공 2개가 든 주머니에서 흰 공을 꺼낼 가능성", a: "1/2" },
  { q: "파란 공만 들어 있는 주머니에서 노란 공을 꺼낼 가능성", a: "0" },
  { q: "주사위를 굴렸을 때 6 이하의 눈이 나올 가능성", a: "1" },
  { q: "흰 공 3개, 검은 공 3개가 든 주머니에서 검은 공을 꺼낼 가능성", a: "1/2" },
  { q: "1부터 6까지의 수 카드 6장 중 한 장을 뽑을 때 홀수가 나올 가능성", a: "1/2" },
  { q: "1부터 10까지의 수 카드 10장 중 한 장을 뽑을 때 11이 나올 가능성", a: "0" },
  { q: "1부터 4까지의 수 카드 4장 중 한 장을 뽑을 때 4 이하의 수가 나올 가능성", a: "1" },
];

export const chance: Generator = {
  id: "chance",
  level: 2,
  make(rand) {
    const c = pick(rand, CHANCE);
    return {
      key: `${this.id}:${c.q}`,
      typeId: this.id,
      prompt: `${jq(c.q, "을/를")} 수로 나타낸 것을 고르세요.`,
      input: "choice",
      choices: CHANCE_VALUES,
      answer: c.a,
      hint: "불가능하면 0, 반반이면 1/2, 확실하면 1이에요.",
      explanation: `${c.a}입니다.`,
    };
  },
};
