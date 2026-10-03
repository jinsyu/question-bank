import { choiceKey, pick, randInt, shuffle } from "../../lib/random";
import type { Generator, Level, Visual } from "../types";
import { mid, word, type WordSpec } from "../words/word";
import { extras } from "../extras";
import { gcd, lcm, reduced } from "../generators/grade5";
import { mixedText } from "../generators/grade4";
import { jq } from "./g5-text";
import { sticksScene, tablesScene } from "./g5-pattern";

/* ── 공용 도구 ── */

/** 기본(하) 문제 */
export const easy = (id: string, make: (rand: () => number) => WordSpec | null) => word(id, make, 1);
/** 조사(는·가)가 자연스럽도록 받침 없는 이름만 쓴다 */
export const NAMES = ["지우", "서아", "수아", "도하", "유나", "이수"];
export const trim = (n: number, p = 3) => String(Number(n.toFixed(p)));
export const two = (rand: () => number) => shuffle(rand, NAMES).slice(0, 2);

/** 정답 + 오답 후보로 중복 없는 4지선다. 값이 같은 보기(2/4와 1/2)도 거른다 — 크기가 같은 분수 중에서 고르는 문제만 sameValueOk */
export function choices4(rand: () => number, answer: string, others: string[], filler: () => string, sameValueOk = false): string[] {
  const key = sameValueOk ? (c: string) => c : choiceKey;
  const picked = new Map<string, string>([[key(answer), answer]]);
  const add = (c: string) => {
    if (picked.size < 4 && !picked.has(key(c))) picked.set(key(c), c);
  };
  for (const o of others) add(o);
  for (let i = 0; picked.size < 4 && i < 80; i++) add(filler());
  return shuffle(rand, [...picked.values()]);
}

/** 분수 답(기약분수·대분수 표기)의 4지선다 */
export const fracChoices = (rand: () => number, answer: string, others: string[], L: number) =>
  choices4(rand, answer, others, () => reduced(randInt(rand, 1, L * 4), L));

/** 진분수 답의 4지선다: 자연수가 되는 오답(분모끼리·분자끼리 뺀 3/3 = 1 등)은 빼고, 모자라면 분모가 L·2L인 진분수로 채운다(L = 4이면 진분수가 셋뿐) */
export const properFracChoices = (rand: () => number, answer: string, others: string[], L: number) =>
  choices4(rand, answer, others.filter((o) => o.includes("/")), () => {
    const d = pick(rand, [L, 2 * L]);
    return reduced(randInt(rand, 1, d - 1), d);
  });

/** 예전 단계에 붙어 있던 생성기를 id로 꺼낸다 */
export function ex(unitId: string, stdId: string, id: string): Generator {
  const g = extras(unitId, stdId).find((x) => x.id === id);
  if (!g) throw new Error(`${unitId}/${stdId}: ${id} 없음`);
  return g;
}

export const divisorsOf = (n: number) => Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0);

/** 분수 [분자, 분모] */
export type Q = [number, number];
export const qAdd = ([a, b]: Q, [c, d]: Q): Q => [a * d + c * b, b * d];
export const qSub = ([a, b]: Q, [c, d]: Q): Q => [a * d - c * b, b * d];
export const qMul = ([a, b]: Q, [c, d]: Q): Q => [a * c, b * d];
export const qText = ([n, d]: Q) => reduced(n, d);
export const qVal = ([n, d]: Q) => n / d;
/** 가분수 표기(대분수 없이) */
export const qImproper = ([n, d]: Q) => {
  const g = gcd(n, d);
  return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`;
};
const coprimeTo = (d: number) => Array.from({ length: d - 1 }, (_, i) => i + 1).filter((n) => gcd(n, d) === 1);
/** 기약인 진분수 */
export const properQ = (rand: () => number, dMin = 2, dMax = 9): Q => {
  const d = randInt(rand, dMin, dMax);
  return [pick(rand, coprimeTo(d)), d];
};
/** 분수 부분이 기약분수인 대분수(가분수 [분자, 분모]로) */
export const mixedQ = (rand: () => number, wMax = 4, dMin = 2, dMax = 9): Q => {
  const d = randInt(rand, dMin, dMax);
  return [randInt(rand, 1, wMax) * d + pick(rand, coprimeTo(d)), d];
};
export const qShow = (q: Q) => mixedText(q[0], q[1]);

export type Ex = { text: string; value: number; show: string };

/** 식 4개 중 계산 결과가 가장 큰(작은) 것 고르기 */
export function extremeOf(id: string, level: Level, one: (rand: () => number) => Ex | null, hint: string): Generator {
  return word(
    id,
    (rand) => {
      const items: Ex[] = [];
      for (let i = 0; items.length < 4 && i < 60; i++) {
        const e = one(rand);
        if (e && !items.some((x) => x.text === e.text || Math.abs(x.value - e.value) < 1e-9)) items.push(e);
      }
      if (items.length < 4) return null;
      const big = rand() < 0.5;
      const ans = items.reduce((m, x) => ((big ? x.value > m.value : x.value < m.value) ? x : m));
      return {
        key: `${big}:${items.map((x) => x.text).join("|")}`,
        prompt: `계산 결과가 가장 ${big ? "큰" : "작은"} 것을 고르세요.`,
        answer: ans.text,
        choices: items.map((x) => x.text),
        hint,
        explanation: items.map((x) => `${x.text} = ${x.show}`).join(", "),
      };
    },
    level,
  );
}

const perms3 = <T,>([a, b, c]: T[]): T[][] => [[a, b, c], [a, c, b], [b, a, c], [b, c, a], [c, a, b], [c, b, a]];
const digitsCards = (rand: () => number, n: number, min = 1, max = 9) => shuffle(rand, Array.from({ length: max - min + 1 }, (_, i) => i + min)).slice(0, n);

/* ══════════ 5-1-1 자연수의 혼합 계산 ══════════ */

export const asCalc = easy("l5-as-calc", (rand) => {
  const a = randInt(rand, 40, 99);
  const b = randInt(rand, 5, 35);
  const c = randInt(rand, 5, 35);
  const f = randInt(rand, 0, 2);
  const [text, v, wrong]: [string, number, number] =
    f === 0 ? [`${a} − ${b} + ${c}`, a - b + c, a - (b + c)] : f === 1 ? [`${a} − (${b} + ${c})`, a - (b + c), a - b + c] : [`${a} − (${b} − ${c})`, a - (b - c), a - b - c];
  if (b === c || v <= 0 || wrong <= 0 || (f === 2 && b < c)) return null;
  return {
    key: `${f}:${a}:${b}:${c}`,
    prompt: "계산해 보세요.",
    expression: `${text} = □`,
    answer: v,
    hint: f === 0 ? "덧셈과 뺄셈이 섞여 있는 식은 앞에서부터 차례로 계산해요." : "( )가 있으면 ( ) 안을 먼저 계산해요.",
    explanation: `${text} = ${v}`,
    mistakes: { [wrong]: f === 0 ? "뒤의 덧셈을 먼저 계산했어요." : "( ) 안을 먼저 계산하지 않았어요." },
  };
});

export const asMissing = mid("l5-as-missing", (rand) => {
  const a = randInt(rand, 30, 90);
  const b = randInt(rand, 5, 29);
  const c = randInt(rand, 5, 40);
  const r = a - b + c;
  const first = rand() < 0.5;
  return first
    ? {
        key: `a:${a}:${b}:${c}`,
        prompt: "□ 안에 알맞은 수를 구하세요.",
        expression: `□ − ${b} + ${c} = ${r}`,
        answer: a,
        hint: "거꾸로 생각해요. □ − " + b + " = " + r + " − " + c,
        explanation: `□ − ${b} = ${r} − ${c} = ${r - c}, □ = ${r - c} + ${b} = ${a}`,
      }
    : {
        key: `b:${a}:${b}:${c}`,
        prompt: "□ 안에 알맞은 수를 구하세요.",
        expression: `${a} − □ + ${c} = ${r}`,
        answer: b,
        hint: `먼저 ${a} − □의 값을 거꾸로 구해요.`,
        explanation: `${a} − □ = ${r} − ${c} = ${r - c}, □ = ${a} − ${r - c} = ${b}`,
      };
});

export const asExpr = mid("l5-as-expr", (rand) => {
  const a = randInt(rand, 25, 60);
  const b = randInt(rand, 3, 15);
  const c = randInt(rand, 3, 15);
  if (b === c) return null;
  const bus = rand() < 0.5;
  const [p, q] = two(rand);
  const answer = bus ? `${a} − ${b} + ${c}` : `${a} − (${b} + ${c})`;
  const others = bus ? [`${a} − (${b} + ${c})`, `${a} + ${b} − ${c}`, `${a} − ${b} − ${c}`] : [`${a} − ${b} + ${c}`, `${a} + (${b} + ${c})`, `${a} + ${b} − ${c}`];
  return {
    key: `${bus}:${a}:${b}:${c}`,
    prompt: bus
      ? `버스에 ${a}명이 타고 있었습니다. 이번 정류장에서 ${b}명이 내리고 ${c}명이 탔습니다. 지금 버스에 타고 있는 사람 수를 구하는 식을 고르세요.`
      : `색종이 ${a}장 중에서 ${jq(p, "이/가")} ${b}장, ${jq(q, "이/가")} ${c}장을 사용했습니다. 남은 색종이 수를 하나의 식으로 바르게 나타낸 것을 고르세요.`,
    answer,
    choices: shuffle(rand, [answer, ...others]),
    hint: bus ? "내린 사람은 빼고, 탄 사람은 더해요." : "두 사람이 사용한 색종이를 모두 빼야 해요.",
    explanation: `${answer} = ${bus ? a - b + c : a - b - c}`,
  };
});

export const asWrong = word("l5-as-wrong", (rand) => {
  const x = randInt(rand, 30, 90);
  const b = randInt(rand, 5, 30);
  const c = randInt(rand, 5, 30);
  if (b === c) return null;
  const wrongR = x + b - c;
  const right = x - b + c;
  if (wrongR <= 0 || right <= 0) return null;
  return {
    key: `${x}:${b}:${c}`,
    prompt: `어떤 수에서 ${jq(b, "을/를")} 빼고 ${jq(c, "을/를")} 더해야 할 것을 잘못하여 ${jq(b, "을/를")} 더하고 ${jq(c, "을/를")} 뺐더니 ${jq(wrongR, "이/가")} 되었습니다. 바르게 계산하면 얼마인가요?`,
    answer: right,
    hint: "잘못 계산한 식을 거꾸로 풀어 어떤 수를 먼저 구해요.",
    explanation: `어떤 수: ${wrongR} + ${c} − ${b} = ${x}, 바르게 계산하면 ${x} − ${b} + ${c} = ${right}`,
    mistakes: { [x]: "어떤 수까지만 구했어요. 바르게 계산한 값을 구해야 해요." },
  };
});

export const asCompare = word("l5-as-compare", (rand) => {
  const [p, q] = two(rand);
  const make = () => [randInt(rand, 30, 80), randInt(rand, 5, 25), randInt(rand, 5, 30)].map((x) => x * 100);
  const [a1, b1, c1] = make();
  const [a2, b2, c2] = make();
  const x = a1 - b1 + c1;
  const y = a2 - b2 + c2;
  if (x === y) return null;
  return {
    key: `${a1}:${b1}:${c1}:${a2}:${b2}:${c2}`,
    prompt: `${jq(p, "은/는")} ${a1}원이 있었는데 ${b1}원짜리 공책을 사고 용돈 ${c1}원을 받았습니다. ${jq(q, "은/는")} ${a2}원이 있었는데 ${b2}원짜리 필통을 사고 용돈 ${c2}원을 받았습니다. 지금 두 사람이 가진 돈의 차는 몇 원인가요?`,
    answer: Math.abs(x - y),
    unit: "원",
    hint: "두 사람이 지금 가진 돈을 각각 하나의 식으로 계산한 뒤 비교해요.",
    explanation: `${p}: ${a1} − ${b1} + ${c1} = ${x}, ${q}: ${a2} − ${b2} + ${c2} = ${y} → ${jq(x > y ? p : q, "이/가")} ${Math.abs(x - y)}원 더 많아요.`,
  };
});

type MD = Ex & { wrong?: number };
function mdForm(rand: () => number): MD {
  const f = randInt(rand, 0, 2);
  if (f === 0) {
    const c = randInt(rand, 2, 9);
    const k = randInt(rand, 2, 11);
    const b = randInt(rand, 2, 9);
    return { text: `${c * k} × ${b} ÷ ${c}`, value: k * b, show: String(k * b) };
  }
  if (f === 1) {
    const b = randInt(rand, 2, 9);
    const q = randInt(rand, 2, 12);
    const c = randInt(rand, 2, 9);
    const w = (b * q) / (b * c);
    return { text: `${b * q} ÷ ${b} × ${c}`, value: q * c, show: String(q * c), wrong: Number.isInteger(w) ? w : undefined };
  }
  const b = randInt(rand, 2, 5);
  const c = randInt(rand, 2, 5);
  const q = randInt(rand, 2, 9);
  return { text: `${b * c * q} ÷ (${b} × ${c})`, value: q, show: String(q), wrong: c * c * q };
}

export const mdCalc = easy("l5-md-calc", (rand) => {
  const e = mdForm(rand);
  return {
    key: e.text,
    prompt: "계산해 보세요.",
    expression: `${e.text} = □`,
    answer: e.value,
    hint: "곱셈과 나눗셈이 섞여 있는 식은 앞에서부터 차례로 계산해요. ( )가 있으면 ( ) 안을 먼저 계산해요.",
    explanation: `${e.text} = ${e.value}`,
    mistakes: e.wrong !== undefined ? { [e.wrong]: "계산 순서를 지키지 않았어요." } : {},
  };
});

export const mdMissing = mid("l5-md-missing", (rand) => {
  const b = randInt(rand, 2, 9);
  const q = randInt(rand, 2, 9);
  const c = randInt(rand, 2, 9);
  const first = rand() < 0.5;
  return first
    ? {
        key: `a:${b}:${q}:${c}`,
        prompt: "□ 안에 알맞은 수를 구하세요.",
        expression: `□ ÷ ${b} × ${c} = ${q * c}`,
        answer: b * q,
        hint: "거꾸로 생각해요. 곱셈은 나눗셈으로, 나눗셈은 곱셈으로 바꾸어요.",
        explanation: `□ ÷ ${b} = ${q * c} ÷ ${c} = ${q}, □ = ${q} × ${b} = ${b * q}`,
      }
    : {
        key: `b:${b}:${q}:${c}`,
        prompt: "□ 안에 알맞은 수를 구하세요.",
        expression: `${b * c * q} ÷ (${b} × □) = ${q}`,
        answer: c,
        hint: `먼저 ${b} × □의 값을 구해요.`,
        explanation: `${b} × □ = ${b * c * q} ÷ ${q} = ${b * c}, □ = ${c}`,
      };
});

export const mdExtreme = extremeOf("l5-md-extreme", 2, mdForm, "각 식을 앞에서부터 차례로(( ) 안은 먼저) 계산해 비교해요.");

export const mdLife = word("l5-md-life", (rand) => {
  const a = randInt(rand, 6, 24);
  const b = randInt(rand, 2, 9);
  const cs = divisorsOf(a * b).filter((d) => d >= 3 && d <= 12 && d !== a && d !== b && (a * b) / d >= 2);
  if (!cs.length) return null;
  const c = pick(rand, cs);
  return {
    key: `${a}:${b}:${c}`,
    prompt: `사탕이 한 봉지에 ${a}개씩 ${b}봉지 있습니다. 이 사탕을 ${c}명에게 똑같이 나누어 주면 한 명이 몇 개씩 받게 되는지 하나의 식으로 나타내어 구하세요.`,
    answer: (a * b) / c,
    unit: "개",
    hint: `전체 사탕 수는 ${a} × ${b}, 이것을 ${c}명에게 나누어요.`,
    explanation: `${a} × ${b} ÷ ${c} = ${a * b} ÷ ${c} = ${(a * b) / c}(개)`,
    mistakes: { [a * b]: "나누어 주는 것을 빠뜨렸어요." },
  };
});

const REASONS = {
  mulFirst: "×와 ÷가 섞인 식을 앞에서부터 계산하지 않고 뒤의 곱셈을 먼저 계산했어요.",
  paren: "( ) 안을 가장 먼저 계산하지 않았어요.",
  // 이 차시(곱셈과 나눗셈만 섞인 식)의 오답 보기: 실제로 틀린 까닭이 되는 경우는 없다
  swapDiv: "나누는 수와 나누어지는 수를 바꾸어 계산했어요.",
  mulAsDiv: "나눗셈을 곱셈으로 잘못 보고 계산했어요.",
};

export const mdError = word("l5-md-error", (rand) => {
  const kind = pick(rand, ["mulFirst", "paren"] as const);
  const name = pick(rand, NAMES);
  const b = randInt(rand, 2, 5);
  const c = randInt(rand, 2, 5);
  const q = randInt(rand, 2, 9);
  const a = b * c * q;
  const line = kind === "mulFirst" ? `${a} ÷ ${b} × ${c} = ${a} ÷ ${b * c} = ${q}` : `${a} ÷ (${b} × ${c}) = ${a / b} × ${c} = ${(a / b) * c}`;
  const right = kind === "mulFirst" ? (a / b) * c : q;
  const answer = REASONS[kind];
  return {
    key: `${kind}:${line}`,
    prompt: `${name}의 풀이입니다. 잘못 계산한 까닭을 고르세요.`,
    expression: line,
    answer,
    choices: shuffle(rand, Object.values(REASONS)),
    hint: "( ) → ×, ÷ → +, − 순서이고, 같은 단계끼리는 앞에서부터 계산해요.",
    explanation: `${answer} 바르게 계산하면 ${right}입니다.`,
  };
});

type ASM = Ex & { wrong: number };
function asmForm(rand: () => number): ASM | null {
  const a = randInt(rand, 10, 60);
  const b = randInt(rand, 2, 9);
  const c = randInt(rand, 2, 9);
  const d = randInt(rand, 2, 20);
  const f = randInt(rand, 0, 3);
  const [text, v, wrong]: [string, number, number] =
    f === 0
      ? [`${a} + ${b} × ${c} − ${d}`, a + b * c - d, (a + b) * c - d]
      : f === 1
        ? [`${a} − ${b} × ${c} + ${d}`, a - b * c + d, (a - b) * c + d]
        : f === 2
          ? [`(${a} + ${b}) × ${c} − ${d}`, (a + b) * c - d, a + b * c - d]
          : [`${b} × (${c + d} − ${d}) + ${a}`, b * c + a, b * (c + d) - d + a];
  if (v <= 0 || (f === 1 && a <= b * c)) return null;
  return { text, value: v, show: String(v), wrong };
}

export const asmCalc = easy("l5-asm-calc", (rand) => {
  const e = asmForm(rand);
  if (!e) return null;
  return {
    key: e.text,
    prompt: "계산해 보세요.",
    expression: `${e.text} = □`,
    answer: e.value,
    hint: "( ) 안 → 곱셈 → 덧셈과 뺄셈(앞에서부터) 순서로 계산해요.",
    explanation: `${e.text} = ${e.value}`,
    mistakes: { [e.wrong]: "계산 순서를 지키지 않았어요." },
  };
});

export const asmMissing = mid("l5-asm-missing", (rand) => {
  const a = randInt(rand, 10, 50);
  const b = randInt(rand, 2, 9);
  const x = randInt(rand, 2, 9);
  const first = rand() < 0.5;
  if (first) {
    return {
      key: `a:${a}:${b}:${x}`,
      prompt: "□ 안에 알맞은 수를 구하세요.",
      expression: `${a} + ${b} × □ = ${a + b * x}`,
      answer: x,
      hint: `먼저 ${b} × □의 값을 구해요.`,
      explanation: `${b} × □ = ${a + b * x} − ${a} = ${b * x}, □ = ${x}`,
    };
  }
  const c = randInt(rand, 2, 9);
  return {
    key: `b:${a}:${c}:${x}`,
    prompt: "□ 안에 알맞은 수를 구하세요.",
    expression: `(□ − ${x}) × ${c} = ${a * c}`,
    answer: a + x,
    hint: "( ) 안의 값을 먼저 거꾸로 구해요.",
    explanation: `□ − ${x} = ${a * c} ÷ ${c} = ${a}, □ = ${a + x}`,
  };
});

const CARD_FORMS = [
  { text: "□ + □ × □", f: (a: number, b: number, c: number) => a + b * c, both: true },
  { text: "(□ + □) × □", f: (a: number, b: number, c: number) => (a + b) * c, both: true },
  { text: "□ × □ − □", f: (a: number, b: number, c: number) => a * b - c, both: false },
  { text: "□ × (□ − □)", f: (a: number, b: number, c: number) => a * (b - c), both: false },
];

export const asmCards = word("l5-asm-cards", (rand) => {
  const cards = digitsCards(rand, 3, 1, 9);
  const form = pick(rand, CARD_FORMS);
  const big = form.both ? rand() < 0.5 : true;
  const all = perms3(cards).map((p) => ({ p, v: form.f(p[0], p[1], p[2]) }));
  const best = all.reduce((m, x) => ((big ? x.v > m.v : x.v < m.v) ? x : m));
  let i = 0;
  const filled = form.text.replace(/□/g, () => String(best.p[i++]));
  return {
    key: `${cards.join()}:${form.text}:${big}`,
    prompt: `수 카드 ${jq(cards.join(", "), "을/를")} 한 번씩 모두 사용하여 식 ${jq(form.text, "을/를")} 만들려고 합니다. 계산 결과가 가장 ${big ? "큰" : "작은"} 값은 얼마인가요?`,
    answer: best.v,
    hint: `${big ? "곱하는 수를 크게" : "곱하는 수를 작게"} 만드는 방법을 생각해 보세요. 여러 가지로 넣어 계산해 비교해요.`,
    explanation: `${filled} = ${best.v}`,
  };
});

type ASD = Ex & { wrong?: number };
function asdForm(rand: () => number): ASD | null {
  const c = randInt(rand, 2, 9);
  const k = randInt(rand, 2, 12);
  const a = randInt(rand, 10, 60);
  const d = randInt(rand, 2, 20);
  const f = randInt(rand, 0, 3);
  const w = (n: number) => (Number.isInteger(n) && n > 0 ? n : undefined);
  if (f === 0) return a + k - d > 0 ? { text: `${a} + ${c * k} ÷ ${c} − ${d}`, value: a + k - d, show: String(a + k - d), wrong: w((a + c * k) / c - d) } : null;
  if (f === 1) return a > k ? { text: `${a} − ${c * k} ÷ ${c} + ${d}`, value: a - k + d, show: String(a - k + d), wrong: w((a - c * k) / c + d) } : null;
  if (f === 2) {
    const s = c * k;
    const x = randInt(rand, 1, s - 1);
    return k > d ? { text: `(${x} + ${s - x}) ÷ ${c} − ${d}`, value: k - d, show: String(k - d), wrong: w(x + (s - x) / c - d) } : null;
  }
  const s = c * k;
  const x = randInt(rand, 1, s - 1);
  return a > k ? { text: `${a} − (${x} + ${s - x}) ÷ ${c}`, value: a - k, show: String(a - k), wrong: w((a - x + s - x) / c) } : null;
}

export const asdCalc = easy("l5-asd-calc", (rand) => {
  const e = asdForm(rand);
  if (!e) return null;
  return {
    key: e.text,
    prompt: "계산해 보세요.",
    expression: `${e.text} = □`,
    answer: e.value,
    hint: "( ) 안 → 나눗셈 → 덧셈과 뺄셈(앞에서부터) 순서로 계산해요.",
    explanation: `${e.text} = ${e.value}`,
    mistakes: e.wrong !== undefined ? { [e.wrong]: "계산 순서를 지키지 않았어요." } : {},
  };
});

export const asdMissing = mid("l5-asd-missing", (rand) => {
  const a = randInt(rand, 10, 50);
  const c = randInt(rand, 2, 9);
  const k = randInt(rand, 2, 12);
  return {
    key: `${a}:${c}:${k}`,
    prompt: "□ 안에 알맞은 수를 구하세요.",
    expression: `${a} + □ ÷ ${c} = ${a + k}`,
    answer: c * k,
    hint: `먼저 □ ÷ ${c}의 값을 구해요.`,
    explanation: `□ ÷ ${c} = ${a + k} − ${a} = ${k}, □ = ${k} × ${c} = ${c * k}`,
  };
});

export const asdExtreme = extremeOf("l5-asd-extreme", 2, asdForm, "나눗셈을 먼저 계산한 뒤 덧셈과 뺄셈을 앞에서부터 계산해요.");

export const asdRange = word("l5-asd-range", (rand) => {
  const c = randInt(rand, 2, 9);
  const k = randInt(rand, 2, 12);
  const count = rand() < 0.5;
  if (count) {
    const K = k + randInt(rand, 3, 30);
    return {
      key: `c:${c}:${k}:${K}`,
      prompt: `□ 안에 들어갈 수 있는 자연수는 모두 몇 개인가요?`,
      expression: `□ + ${c * k} ÷ ${c} < ${K}`,
      answer: K - k - 1,
      unit: "개",
      hint: `${c * k} ÷ ${jq(c, "을/를")} 먼저 계산하고, □ + ${jq(k, "이/가")} ${K}보다 작아지는 자연수를 세어요.`,
      explanation: `□ + ${k} < ${K}이므로 □ < ${K - k}, □는 1부터 ${K - k - 1}까지 ${K - k - 1}개`,
      mistakes: { [K - k]: `${jq(K - k, "은/는")} 들어갈 수 없어요(같으면 안 돼요).` },
    };
  }
  const a = randInt(rand, 20, 60);
  const d = randInt(rand, 2, 15);
  const v = a + k - d;
  return {
    key: `m:${a}:${c}:${k}:${d}`,
    prompt: "□ 안에 들어갈 수 있는 자연수 중에서 가장 큰 수를 구하세요.",
    expression: `□ < ${a} + ${c * k} ÷ ${c} − ${d}`,
    answer: v - 1,
    hint: "오른쪽 식을 계산 순서에 맞게 먼저 계산해요.",
    explanation: `${a} + ${k} − ${d} = ${v}, □ < ${v}이므로 가장 큰 수는 ${v - 1}`,
    mistakes: { [v]: `□는 ${v}보다 작아야 해요.` },
  };
});

export const asdLife = word("l5-asd-life", (rand) => {
  const c = randInt(rand, 3, 8);
  const k = randInt(rand, 4, 12);
  const d = randInt(rand, 1, k - 1);
  const a = randInt(rand, 2, 15);
  const name = pick(rand, NAMES);
  const v = k - d + a;
  return {
    key: `${c}:${k}:${d}:${a}`,
    prompt: `쿠키 ${c * k}개를 ${c}명이 똑같이 나누어 가졌습니다. ${jq(name, "은/는")} 자기 몫에서 ${d}개를 먹고, 엄마에게 ${a}개를 더 받았습니다. ${jq(name, "이/가")} 지금 가진 쿠키는 몇 개인지 하나의 식으로 나타내어 구하세요.`,
    answer: v,
    unit: "개",
    hint: `${c * k} ÷ ${c} − ${d} + ${a}처럼 나눗셈을 먼저 계산해요.`,
    explanation: `${c * k} ÷ ${c} − ${d} + ${a} = ${k} − ${d} + ${a} = ${v}(개)`,
    mistakes: { [c * k - d + a]: "나누어 가진 것을 빠뜨렸어요." },
  };
});

export const allCalc = easy("l5-all-calc", (rand) => {
  const a = randInt(rand, 10, 50);
  const b = randInt(rand, 2, 9);
  const c = randInt(rand, 2, 9);
  const e = randInt(rand, 2, 9);
  const m = randInt(rand, 2, 9);
  const v = a + b * c - m;
  const wrong = ((a + b) * c - e * m) / e;
  return {
    key: `${a}:${b}:${c}:${e}:${m}`,
    prompt: "계산해 보세요.",
    expression: `${a} + ${b} × ${c} − ${e * m} ÷ ${e} = □`,
    answer: v,
    hint: "곱셈과 나눗셈을 먼저(앞에서부터), 그다음 덧셈과 뺄셈을 앞에서부터 계산해요.",
    explanation: `${a} + ${b * c} − ${m} = ${v}`,
    mistakes: Number.isInteger(wrong) ? { [wrong]: "앞에서부터 차례로 계산했어요." } : {},
  };
});

export const allParen = mid("l5-all-paren", (rand) => {
  const a = randInt(rand, 2, 12);
  const b = randInt(rand, 2, 9);
  const d = randInt(rand, 1, 6);
  const c = d + randInt(rand, 2, 6);
  const list = [
    { t: `(${a} + ${b}) × ${c} − ${d}`, v: (a + b) * c - d },
    { t: `${a} + ${b} × (${c} − ${d})`, v: a + b * (c - d) },
    { t: `${a} + ${b} × ${c} − ${d}`, v: a + b * c - d },
    { t: `(${a} + ${b}) × (${c} − ${d})`, v: (a + b) * (c - d) },
  ];
  if (new Set(list.map((x) => x.v)).size < 4) return null;
  const target = pick(rand, list);
  return {
    key: `${a}:${b}:${c}:${d}:${target.t}`,
    prompt: `계산 결과가 ${target.v}인 식을 고르세요.`,
    answer: target.t,
    choices: shuffle(rand, list.map((x) => x.t)),
    hint: "( )의 위치에 따라 계산 순서가 달라져요. 하나씩 계산해 보세요.",
    explanation: list.map((x) => `${x.t} = ${x.v}`).join(", "),
  };
});

export const allError = word("l5-all-error", (rand) => {
  const name = pick(rand, NAMES);
  const a = randInt(rand, 10, 40);
  const b = randInt(rand, 2, 9);
  const c = randInt(rand, 2, 6);
  const e = randInt(rand, 2, 5);
  const d = e * randInt(rand, 2, 9);
  // 네 가지 연산이 모두 들어간 식을 앞에서부터 차례로 계산한 잘못
  const text = `${a} + ${b} × ${c} − ${d} ÷ ${e}`;
  const ltrNum = (a + b) * c - d;
  if (ltrNum <= 0 || ltrNum % e !== 0) return null;
  const ltr = ltrNum / e;
  const right = a + b * c - d / e;
  if (ltr === right || right <= 0) return null;
  return {
    key: `${a}:${b}:${c}:${d}:${e}`,
    prompt: `${jq(name, "은/는")} ${jq(text, "을/를")} 앞에서부터 차례로 계산하여 ${jq(ltr, "이라고/라고")} 답했습니다. 바르게 계산한 값은 얼마인가요?`,
    answer: right,
    hint: "곱셈과 나눗셈을 덧셈, 뺄셈보다 먼저 계산해야 해요.",
    explanation: `${text} = ${a} + ${b * c} − ${d / e} = ${right} (${jq(name, "은/는")} 곱셈·나눗셈보다 덧셈·뺄셈을 먼저 계산하는 잘못을 했어요.)`,
    mistakes: { [ltr]: "앞에서부터 차례로 계산하면 안 돼요." },
  };
});

/* ══════════ 5-1-2 약수와 배수 ══════════ */

const MANY = [12, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48, 50, 54, 56, 60, 63, 64, 72];

export const dvNot = mid("l5-dv-not", (rand) => {
  const n = pick(rand, MANY);
  const ds = divisorsOf(n).filter((d) => d > 1 && d < n);
  const non = Array.from({ length: n - 2 }, (_, i) => i + 2).filter((x) => n % x !== 0);
  const answer = String(pick(rand, non));
  return {
    key: `${n}:${answer}`,
    prompt: `${n}의 약수가 아닌 것을 고르세요.`,
    answer,
    choices: shuffle(rand, [answer, ...shuffle(rand, ds).slice(0, 3).map(String)]),
    hint: `${jq(n, "을/를")} 나누어떨어지게 하는 수가 약수예요.`,
    explanation: `${n}의 약수: ${divisorsOf(n).join(", ")} → ${jq(answer, "은/는")} 약수가 아니에요.`,
  };
});

export const dvCond = word("l5-dv-cond", (rand) => {
  const n = pick(rand, MANY);
  const k = randInt(rand, 2, Math.floor(n / 4));
  const even = rand() < 0.5;
  const hits = divisorsOf(n).filter((d) => d > k && (d % 2 === 0) === even);
  if (!hits.length || hits.length === divisorsOf(n).length) return null;
  return {
    key: `${n}:${k}:${even}`,
    prompt: `다음 조건을 모두 만족하는 수는 모두 몇 개인가요? ① ${n}의 약수입니다. ② ${k}보다 큽니다. ③ ${even ? "짝수" : "홀수"}입니다.`,
    answer: hits.length,
    unit: "개",
    hint: `${n}의 약수를 모두 쓴 다음 조건에 맞는 수만 골라요.`,
    explanation: `${n}의 약수 ${divisorsOf(n).join(", ")} 중 조건에 맞는 수: ${hits.join(", ")} → ${hits.length}개`,
  };
});

export const mlCount = mid("l5-ml-count", (rand) => {
  const a = randInt(rand, 1, 50);
  const b = a + randInt(rand, 30, 100);
  const k = randInt(rand, 3, 12);
  const cnt = Math.floor(b / k) - Math.floor((a - 1) / k);
  return {
    key: `${a}:${b}:${k}`,
    prompt: `${a}부터 ${b}까지의 자연수 중에서 ${k}의 배수는 모두 몇 개인가요?`,
    answer: cnt,
    unit: "개",
    hint: `${b}까지의 ${k}의 배수 개수에서 ${a - 1}까지의 ${k}의 배수 개수를 빼요.`,
    explanation: `${Math.floor(b / k)} − ${Math.floor((a - 1) / k)} = ${cnt}(개)`,
    mistakes: a > k ? { [Math.floor(b / k)]: `${a}보다 작은 배수도 세었어요.` } : {},
  };
});

export const mlNot = mid("l5-ml-not", (rand) => {
  const k = randInt(rand, 3, 12);
  const ms = shuffle(rand, Array.from({ length: 11 }, (_, i) => k * (i + 2))).slice(0, 3);
  const answer = k * randInt(rand, 2, 12) + randInt(rand, 1, k - 1);
  return {
    key: `${k}:${ms.join()}:${answer}`,
    prompt: `${k}의 배수가 아닌 것을 고르세요.`,
    answer: String(answer),
    choices: shuffle(rand, [String(answer), ...ms.map(String)]),
    hint: `${jq(k, "으로/로")} 나누어떨어지는지 확인해요.`,
    explanation: `${answer} ÷ ${k} = ${Math.floor(answer / k)} … ${answer % k}이므로 ${k}의 배수가 아니에요.`,
  };
});

export const mlRange = word("l5-ml-range", (rand) => {
  const k = randInt(rand, 3, 15);
  const a = randInt(rand, 20, 150);
  const b = a + randInt(rand, 2 * k, 60);
  const lo = (Math.floor(a / k) + 1) * k;
  const hi = (Math.ceil(b / k) - 1) * k;
  if (lo > hi) return null;
  return {
    key: `${k}:${a}:${b}`,
    prompt: `${a}보다 크고 ${b}보다 작은 수 중에서 ${k}의 배수를 찾으려고 합니다. 그중 가장 큰 수와 가장 작은 수의 합은 얼마인가요?`,
    answer: lo + hi,
    hint: `${a}보다 큰 첫 ${k}의 배수와 ${b}보다 작은 마지막 ${k}의 배수를 찾아요.`,
    explanation: `가장 작은 수 ${lo}, 가장 큰 수 ${hi} → ${lo} + ${hi} = ${lo + hi}`,
  };
});

export const mlCards = word("l5-ml-cards", (rand) => {
  const cards = digitsCards(rand, 3, 0, 9);
  const k = pick(rand, [2, 3, 4, 5, 6]);
  const nums = [...new Set(cards.flatMap((x) => cards.filter((y) => y !== x).map((y) => x * 10 + y)).filter((n) => n >= 10))];
  const hits = nums.filter((n) => n % k === 0);
  if (!hits.length) return null;
  return {
    key: `${cards.join()}:${k}`,
    prompt: `수 카드 ${cards.join(", ")} 중에서 2장을 골라 한 번씩만 사용하여 두 자리 수를 만들려고 합니다. 만들 수 있는 두 자리 수 중 ${k}의 배수는 모두 몇 개인가요?`,
    answer: hits.length,
    unit: "개",
    hint: "만들 수 있는 두 자리 수를 빠짐없이 쓴 다음 배수인지 확인해요. 0은 십의 자리에 올 수 없어요.",
    explanation: `만들 수 있는 수: ${nums.sort((x, y) => x - y).join(", ")} → ${k}의 배수: ${hits.sort((x, y) => x - y).join(", ")}`,
  };
});

export const relPair = easy("l5-rel-pair", (rand) => {
  const a = randInt(rand, 2, 12);
  const k = randInt(rand, 2, 8);
  const answer = `${jq(a, "과/와")} ${a * k}`;
  const others = new Set<string>();
  for (let i = 0; others.size < 3 && i < 60; i++) {
    const x = randInt(rand, 2, 12);
    const y = randInt(rand, x + 1, x * 8);
    if (y % x !== 0) others.add(`${jq(x, "과/와")} ${y}`);
  }
  if (others.size < 3) return null;
  return {
    key: `${answer}:${[...others].join()}`,
    prompt: "두 수가 약수와 배수의 관계인 것을 고르세요.",
    answer,
    choices: shuffle(rand, [answer, ...others]),
    hint: "큰 수가 작은 수로 나누어떨어지면 약수와 배수의 관계예요.",
    explanation: `${a * k} = ${a} × ${k}이므로 ${jq(a * k, "은/는")} ${a}의 배수, ${jq(a, "은/는")} ${a * k}의 약수예요.`,
  };
});

export const relBoth = mid("l5-rel-both", (rand) => {
  const n = pick(rand, MANY);
  const k = pick(rand, divisorsOf(n).filter((d) => d > 1 && d < n));
  const hits = divisorsOf(n).filter((d) => d % k === 0);
  return {
    key: `${n}:${k}`,
    prompt: `${n}의 약수이면서 ${k}의 배수인 수는 모두 몇 개인가요?`,
    answer: hits.length,
    unit: "개",
    hint: `${n}의 약수를 모두 쓰고 그중 ${k}의 배수를 찾아요.`,
    explanation: `${hits.join(", ")} → ${hits.length}개`,
  };
});

export const relStatement = mid("l5-rel-statement", (rand) => {
  const a = randInt(rand, 2, 9);
  let b = randInt(rand, 2, 9);
  if (a === b) b = a === 9 ? 8 : a + 1;
  const n = a * b;
  const [x, y] = shuffle(rand, [a, b]);
  const truths = [`${jq(n, "은/는")} ${x}의 배수입니다.`, `${jq(x, "은/는")} ${n}의 약수입니다.`];
  // 틀린 말은 곱셈식의 수로 약수와 배수를 뒤바꾼 것만(언제나 틀림)
  const lies = [`${jq(x, "은/는")} ${n}의 배수입니다.`, `${jq(n, "은/는")} ${x}의 약수입니다.`, `${jq(y, "은/는")} ${n}의 배수입니다.`, `${jq(n, "은/는")} ${y}의 약수입니다.`];
  const answer = pick(rand, truths);
  return {
    key: `${a}:${b}:${x}:${answer}`,
    prompt: `곱셈식 ${a} × ${b} = ${jq(n, "을/를")} 보고 바르게 말한 것을 고르세요.`,
    answer,
    choices: shuffle(rand, [answer, ...shuffle(rand, lies).slice(0, 3)]),
    hint: "곱셈식에서 곱은 곱하는 두 수의 배수이고, 곱하는 두 수는 곱의 약수예요.",
    explanation: `${jq(n, "은/는")} ${jq(a, "과/와")} ${b}의 배수이고, ${jq(a, "과/와")} ${jq(b, "은/는")} ${n}의 약수입니다.`,
  };
});

const sigma = (n: number) => divisorsOf(n).reduce((s, d) => s + d, 0);

export const relSigma = word("l5-rel-sigma", (rand) => {
  const n = randInt(rand, 4, 40);
  const S = sigma(n);
  const same = Array.from({ length: S }, (_, i) => i + 1).filter((m) => sigma(m) === S);
  if (same.length !== 1) return null;
  return {
    key: `${n}`,
    prompt: `어떤 수의 약수를 모두 더하였더니 ${jq(S, "이/가")} 되었습니다. 어떤 수는 얼마인가요?`,
    answer: n,
    hint: `어떤 수는 ${S}보다 작아요. 약수에는 1과 자기 자신이 꼭 들어가요.`,
    explanation: `${n}의 약수 ${divisorsOf(n).join(" + ")} = ${S}`,
    mistakes: { [S - 1]: "1과 자기 자신만 약수라고 생각했어요." },
  };
});

export const relCond = word("l5-rel-cond", (rand) => {
  const n = pick(rand, MANY);
  const k = pick(rand, divisorsOf(n).filter((d) => d > 1 && d < n / 2));
  if (!k) return null;
  const hits = divisorsOf(n).filter((d) => d % k === 0 && d >= 10);
  if (!hits.length) return null;
  const sum = hits.reduce((s, x) => s + x, 0);
  return {
    key: `${n}:${k}`,
    prompt: `다음 조건을 모두 만족하는 수를 모두 더하면 얼마인가요? ① ${k}의 배수입니다. ② ${n}의 약수입니다. ③ 두 자리 수입니다.`,
    answer: sum,
    hint: `${n}의 약수 중에서 ${k}의 배수이면서 두 자리 수인 것을 찾아요.`,
    explanation: hits.length === 1 ? `${n}의 약수 중 ${k}의 배수인 두 자리 수는 ${sum}뿐이에요.` : `${hits.join(" + ")} = ${sum}`,
  };
});

const gxy = (rand: () => number, gMin: number, gMax: number) => {
  const g = randInt(rand, gMin, gMax);
  let x = randInt(rand, 1, 7);
  let y = randInt(rand, 2, 7);
  for (let i = 0; (gcd(x, y) !== 1 || x === y) && i < 30; i++) {
    x = randInt(rand, 1, 7);
    y = randInt(rand, 2, 7);
  }
  if (gcd(x, y) !== 1 || x === y) return null;
  return { g, x, y, a: g * Math.min(x, y), b: g * Math.max(x, y) };
};

export const gcdCalc = easy("l5-gcd-calc", (rand) => {
  const t = gxy(rand, 2, 12);
  if (!t || t.x === 1) return null;
  return {
    key: `${t.a}:${t.b}`,
    prompt: `${jq(t.a, "과/와")} ${t.b}의 최대공약수를 구하세요.`,
    answer: t.g,
    hint: "두 수를 공약수로 계속 나누어 보거나, 공약수 중 가장 큰 수를 찾아요.",
    explanation: `${t.a} = ${t.g} × ${t.a / t.g}, ${t.b} = ${t.g} × ${t.b / t.g} → 최대공약수 ${t.g}`,
  };
});

export const gcdCount = mid("l5-gcd-count", (rand) => {
  const g = pick(rand, [4, 6, 8, 9, 10, 12, 16, 18, 20, 24]);
  const t = gxy(rand, g, g);
  if (!t || t.x === 1) return null;
  const ds = divisorsOf(g);
  return {
    key: `${t.a}:${t.b}`,
    prompt: `${jq(t.a, "과/와")} ${t.b}의 공약수는 모두 몇 개인가요?`,
    answer: ds.length,
    unit: "개",
    hint: "두 수의 공약수는 최대공약수의 약수와 같아요.",
    explanation: `최대공약수 ${g}의 약수 ${ds.join(", ")} → ${ds.length}개`,
  };
});

export const gcdSum = mid("l5-gcd-sum", (rand) => {
  const g = randInt(rand, 4, 30);
  return {
    key: `${g}`,
    prompt: `어떤 두 수의 최대공약수는 ${g}입니다. 두 수의 공약수를 모두 더하면 얼마인가요?`,
    answer: sigma(g),
    hint: "두 수의 공약수는 최대공약수의 약수예요.",
    explanation: `${g}의 약수 ${divisorsOf(g).join(" + ")} = ${sigma(g)}`,
  };
});

export const gcdShare = word("l5-gcd-share", (rand) => {
  const t = gxy(rand, 3, 12);
  if (!t || t.x === 1) return null;
  const [f1, f2] = shuffle(rand, ["사과", "귤", "배", "감"]).slice(0, 2);
  return {
    key: `${t.a}:${t.b}:${f1}`,
    prompt: `${f1} ${t.a}개와 ${f2} ${t.b}개를 남김없이 최대한 많은 사람에게 똑같이 나누어 주려고 합니다. 몇 명에게 나누어 줄 수 있고, 한 명이 받는 과일은 모두 몇 개인가요?`,
    answer: `${t.g},${t.x + t.y}`,
    unit: ["명", "개"],
    hint: "나누어 줄 수 있는 가장 많은 사람 수는 두 수의 최대공약수예요.",
    explanation: `최대공약수 ${t.g}명, 한 명이 ${f1} ${t.a / t.g}개, ${f2} ${t.b / t.g}개 → ${t.x + t.y}개`,
  };
});

export const gcdRemain = word("l5-gcd-remain", (rand) => {
  const t = gxy(rand, 5, 15);
  if (!t) return null;
  const r1 = randInt(rand, 1, t.g - 1);
  const r2 = randInt(rand, 1, t.g - 1);
  const A = t.a + r1;
  const B = t.b + r2;
  return {
    key: `${A}:${r1}:${B}:${r2}`,
    prompt: `${jq(A, "을/를")} 어떤 수로 나누면 나머지가 ${r1}이고, ${jq(B, "을/를")} 어떤 수로 나누면 나머지가 ${r2}입니다. 어떤 수가 될 수 있는 수 중에서 가장 큰 수를 구하세요.`,
    answer: t.g,
    hint: `${A} − ${jq(r1, "과/와")} ${B} − ${jq(r2, "은/는")} 모두 어떤 수로 나누어떨어져요.`,
    explanation: `${jq(A - r1, "과/와")} ${B - r2}의 최대공약수 = ${t.g}`,
  };
});

export const lcmCalc = easy("l5-lcm-calc", (rand) => {
  const t = gxy(rand, 2, 8);
  if (!t || t.x === 1) return null;
  const L = lcm(t.a, t.b);
  return {
    key: `${t.a}:${t.b}`,
    prompt: `${jq(t.a, "과/와")} ${t.b}의 최소공배수를 구하세요.`,
    answer: L,
    hint: "두 수의 공통인 배수 중에서 가장 작은 수예요.",
    explanation: `${t.g} × ${t.a / t.g} × ${t.b / t.g} = ${L}`,
    mistakes: { [t.a * t.b]: "두 수를 곱하기만 했어요." },
  };
});

export const lcmCount = mid("l5-lcm-count", (rand) => {
  const a = randInt(rand, 2, 12);
  let b = randInt(rand, 2, 15);
  if (a === b) b += 1;
  const L = lcm(a, b);
  if (L > 60) return null;
  const N = randInt(rand, 100, 300);
  return {
    key: `${a}:${b}:${N}`,
    prompt: `1부터 ${N}까지의 자연수 중에서 ${jq(a, "과/와")} ${b}의 공배수는 모두 몇 개인가요?`,
    answer: Math.floor(N / L),
    unit: "개",
    hint: "두 수의 공배수는 최소공배수의 배수예요.",
    explanation: `최소공배수 ${L}, ${N} ÷ ${L} = ${Math.floor(N / L)} … ${N % L} → ${Math.floor(N / L)}개`,
  };
});

export const lcmNth = mid("l5-lcm-nth", (rand) => {
  const a = randInt(rand, 2, 12);
  let b = randInt(rand, 2, 12);
  if (a === b) b += 1;
  const k = randInt(rand, 2, 5);
  const L = lcm(a, b);
  return {
    key: `${a}:${b}:${k}`,
    prompt: `${jq(a, "과/와")} ${b}의 공배수 중에서 ${k}번째로 작은 수를 구하세요.`,
    answer: L * k,
    hint: "공배수는 최소공배수의 배수예요.",
    explanation: `최소공배수 ${L}, ${L} × ${k} = ${L * k}`,
  };
});

export const lcmLights = word("l5-lcm-lights", (rand) => {
  const a = randInt(rand, 2, 12);
  let b = randInt(rand, 3, 15);
  if (a === b) b += 1;
  const L = lcm(a, b);
  if (L > 60) return null;
  const m = randInt(rand, 2, 6);
  const T = L * m + randInt(rand, 0, L - 1);
  return {
    key: `${a}:${b}:${T}`,
    prompt: `빨간 전등은 ${a}초마다, 파란 전등은 ${b}초마다 켜집니다. 두 전등이 동시에 켜진 뒤 ${T}초 동안 두 전등이 다시 동시에 켜지는 것은 몇 번인가요?`,
    answer: m,
    unit: "번",
    hint: "두 전등이 동시에 켜지는 간격은 두 수의 최소공배수예요.",
    explanation: `${L}초마다 동시에 켜지므로 ${T} ÷ ${L} = ${m} … ${T % L} → ${m}번`,
  };
});

export const lcmRemain = word("l5-lcm-remain", (rand) => {
  const a = randInt(rand, 3, 9);
  let b = randInt(rand, 3, 10);
  if (a === b) b += 1;
  const r = randInt(rand, 1, Math.min(a, b) - 1);
  const L = lcm(a, b);
  const three = rand() < 0.5;
  const min = three ? 100 : 10;
  let v = r;
  while (v < min) v += L;
  if (v >= min * 10) return null;
  return {
    key: `${a}:${b}:${r}:${three}`,
    prompt: `${jq(a, "으로/로")} 나누어도, ${jq(b, "으로/로")} 나누어도 나머지가 ${r}인 수 중에서 가장 작은 ${three ? "세" : "두"} 자리 수를 구하세요.`,
    answer: v,
    hint: `구하는 수에서 ${jq(r, "을/를")} 빼면 ${jq(a, "과/와")} ${b}의 공배수가 돼요.`,
    explanation: `최소공배수 ${L}의 배수에 ${jq(r, "을/를")} 더한 수 중 가장 작은 ${three ? "세" : "두"} 자리 수: ${v}`,
  };
});

/** 공약수로 나누어 최대공약수·최소공배수를 구하는 과정의 빈칸 채우기(교과서의 나눗셈 방법) */
export const glDivision = mid("l5-gl-division", (rand) => {
  const x = randInt(rand, 2, 7);
  const y = randInt(rand, 2, 7);
  if (gcd(x, y) !== 1 || x === y) return null;
  const [p1, p2] = [pick(rand, [2, 3, 5]), pick(rand, [2, 3])];
  const g = p1 * p2;
  const [a, b] = [g * x, g * y];
  const cells = [[String(p1), String(a), String(b)], [String(p2), String(a / p1), String(b / p1)], ["", String(x), String(y)]];
  const blanks: [number, number][] = [[1, 1], [1, 2], [2, 1], [2, 2]];
  const [r, c] = pick(rand, blanks);
  const answer = Number(cells[r][c]);
  cells[r][c] = "□";
  return {
    key: `${a}:${b}:${p1}:${r}${c}`,
    prompt: `${jq(a, "과/와")} ${b}의 최대공약수와 최소공배수를 구하려고 공약수로 차례로 나누었습니다. □ 안에 알맞은 수를 구하세요.`,
    visual: { kind: "table", header: ["나눈 수", "첫째 수", "둘째 수"], rows: cells.map(([d, u, v]) => [d ? `${d} )` : "", u, v]) },
    answer,
    hint: "왼쪽의 수로 두 수를 각각 나눈 몫을 아래에 써요. 1 말고는 공약수가 없을 때까지 나누어요.",
    explanation: `${a} ÷ ${p1} = ${a / p1}, ${b} ÷ ${p1} = ${b / p1}, ${a / p1} ÷ ${p2} = ${x}, ${b / p1} ÷ ${p2} = ${y} → 최대공약수 ${p1} × ${p2} = ${g}, 최소공배수 ${g} × ${x} × ${y} = ${g * x * y}`,
  };
});

/** 최대공약수와 최소공배수를 보고 어떤 수를 보기에서 고르기(보기마다 확인) */
export const glOther = word("l5-gl-other", (rand) => {
  const t = gxy(rand, 2, 9);
  if (!t || t.x === 1) return null;
  const L = lcm(t.a, t.b);
  const [known, other] = shuffle(rand, [t.a, t.b]);
  const fits = (d: number) => gcd(known, d) === t.g && lcm(known, d) === L;
  const pool = [other + t.g, other - t.g, other * 2, L, t.g * (t.x + t.y), other + 1].filter((d) => d > 0 && d !== known && !fits(d));
  const others = [...new Set(pool)].slice(0, 3).map(String);
  if (others.length < 3) return null;
  return {
    key: `${known}:${other}`,
    prompt: `${jq(known, "과/와")} 어떤 수의 최대공약수는 ${t.g}, 최소공배수는 ${L}입니다. 어떤 수를 고르세요.`,
    answer: String(other),
    choices: shuffle(rand, [String(other), ...others]),
    hint: `보기의 수마다 ${jq(known, "과/와")}의 최대공약수와 최소공배수를 구해 확인해요. 어떤 수는 ${t.g}의 배수이고 ${L}의 약수예요.`,
    explanation: `${jq(known, "과/와")} ${other}의 최대공약수는 ${t.g}, 최소공배수는 ${L}입니다.`,
  };
});

/* ══════════ 5-1-3 규칙과 대응 ══════════ */

const corTable = (xs: number[], f: (x: number) => number, blank = -1): Visual => ({
  kind: "table",
  header: ["○", ...xs.map(String)],
  rows: [["△", ...xs.map((x, i) => (i === blank ? "□" : String(f(x))))]],
});

/** 하: 한 가지 연산의 대응 관계만(두 단계 규칙은 상에서) */
export const corBlank = easy("l5-cor-blank", (rand) => {
  const kind = randInt(rand, 0, 1);
  const k = randInt(rand, 2, 9);
  const s = randInt(rand, 1, 5);
  const xs = Array.from({ length: 5 }, (_, i) => s + i);
  const f = (x: number) => (kind === 0 ? x * k : kind === 1 ? x + k : x * k + 1);
  const blank = randInt(rand, 2, 4);
  const rule = kind === 0 ? `△ = ○ × ${k}` : kind === 1 ? `△ = ○ + ${k}` : `△ = ○ × ${k} + 1`;
  return {
    key: `${kind}:${k}:${s}:${blank}`,
    prompt: "표를 보고 대응 관계를 찾아 □ 안에 알맞은 수를 구하세요.",
    visual: corTable(xs, f, blank),
    answer: f(xs[blank]),
    hint: "○와 △ 사이에 늘 같은 규칙이 있는지 찾아요.",
    explanation: `${rule} → □ = ${f(xs[blank])}`,
  };
});

/** 중: 표에서 한 가지 연산의 규칙을 찾아 멀리 있는 값 구하기 */
export const corNext = mid("l5-cor-next", (rand) => {
  const mul = rand() < 0.6;
  const k = mul ? randInt(rand, 2, 9) : randInt(rand, 3, 15);
  const n = randInt(rand, 8, 20);
  const f = (x: number) => (mul ? x * k : x + k);
  return {
    key: `${mul}:${k}:${n}`,
    prompt: `표를 보고 ○가 ${n}일 때 △는 얼마인지 구하세요.`,
    visual: corTable([1, 2, 3, 4], f),
    answer: f(n),
    hint: "○와 △ 사이에 늘 같은 규칙(더하기 또는 곱하기)이 있는지 찾아요.",
    explanation: `${mul ? `△ = ○ × ${k}` : `△ = ○ + ${k}`} → ${mul ? `${n} × ${k}` : `${n} + ${k}`} = ${f(n)}`,
    mistakes: mul ? { [f(4) + (n - 4)]: `○가 1 커질 때 △는 1씩이 아니라 ${k}씩 커져요.`, [n + k]: "곱하는 규칙이에요." } : { [n * k]: "더하는 규칙이에요." },
  };
});

const STICKS = [
  { shape: "정사각형", per: 3, first: 4 },
  { shape: "정삼각형", per: 2, first: 3 },
  { shape: "오각형", per: 4, first: 5 },
  { shape: "정육각형", per: 5, first: 6 },
];

export const corPattern = word("l5-cor-pattern", (rand) => {
  const s = pick(rand, STICKS);
  const n = randInt(rand, 8, 30);
  const f = (x: number) => s.per * x + (s.first - s.per);
  return {
    key: `${s.shape}:${n}`,
    prompt: `성냥개비로 ${jq(s.shape, "을/를")} 그림과 같이 한 줄로 이어 붙여 만들고 있습니다. ${s.shape} ${n}개를 만들려면 성냥개비는 몇 개 필요한가요?`,
    visual: sticksScene(s.shape),
    answer: f(n),
    unit: "개",
    hint: `그림에서 성냥개비를 세어 표로 나타내 보세요. ${jq(s.shape, "이/가")} 1개 늘어날 때마다 성냥개비는 몇 개씩 늘어나나요?`,
    explanation: `(성냥개비 수) = (${s.shape} 수) × ${s.per} + ${s.first - s.per} → ${n} × ${s.per} + ${s.first - s.per} = ${f(n)}(개)`,
    mistakes: { [s.first * n]: "붙어 있는 변을 두 번 세었어요." },
  };
});

export const corSolveFor = mid("l5-cor-solve-for", (rand) => {
  const k = randInt(rand, 2, 9);
  const mul = rand() < 0.5;
  const rule = mul ? `△ = ○ × ${k}` : `△ = ○ + ${k}`;
  const answer = mul ? `○ = △ ÷ ${k}` : `○ = △ − ${k}`;
  const others = mul ? [`○ = △ × ${k}`, `○ = △ − ${k}`, `○ = ${k} ÷ △`] : [`○ = △ + ${k}`, `○ = ${k} − △`, `○ = △ × ${k}`];
  return {
    key: `${mul}:${k}`,
    prompt: `○와 △ 사이의 대응 관계가 ${rule}입니다. ○를 △를 사용한 식으로 나타낸 것을 고르세요.`,
    answer,
    choices: shuffle(rand, [answer, ...others]),
    hint: mul ? "곱셈식은 나눗셈식으로 바꿀 수 있어요." : "덧셈식은 뺄셈식으로 바꿀 수 있어요.",
    explanation: `${rule} → ${answer}`,
  };
});

export const corError = word("l5-cor-error", (rand) => {
  const k = randInt(rand, 3, 9);
  const n = randInt(rand, 6, 20);
  const name = pick(rand, NAMES);
  return {
    key: `${k}:${n}`,
    prompt: `${jq(name, "은/는")} 표의 첫째 칸만 보고 대응 관계를 △ = ○ + ${jq(k - 1, "이라고/라고")} 잘못 말했습니다. 바른 대응 관계를 찾아 ○가 ${n}일 때 △를 구하세요.`,
    visual: corTable([1, 2, 3, 4, 5], (x) => x * k),
    answer: n * k,
    hint: "둘째, 셋째 칸에서도 식이 맞는지 확인해 봐요.",
    explanation: `○ = 2일 때 △ = ${2 * k}이므로 △ = ○ + ${jq(k - 1, "은/는")} 틀려요. 바른 식 △ = ○ × ${k} → ${n} × ${k} = ${n * k}`,
    mistakes: { [n + k - 1]: `${name}의 잘못된 식으로 계산했어요.` },
  };
});

export const corAge = easy("l5-cor-age", (rand) => {
  const name = pick(rand, NAMES);
  const x = randInt(rand, 8, 12);
  const k = randInt(rand, 2, 6);
  const y = x + randInt(rand, 3, 20);
  return {
    key: `${x}:${k}:${y}`,
    prompt: `올해 ${jq(name, "은/는")} ${x}살이고 언니는 ${x + k}살입니다. ${jq(name, "이/가")} ${y}살이 될 때 언니는 몇 살인가요?`,
    answer: y + k,
    unit: "살",
    hint: "두 사람의 나이 차는 해가 지나도 변하지 않아요.",
    explanation: `(언니 나이) = (${name} 나이) + ${k} → ${y} + ${k} = ${y + k}(살)`,
  };
});

export const corLifeExpr = mid("l5-cor-life-expr", (rand) => {
  const k = randInt(rand, 2, 9);
  const kind = randInt(rand, 0, 4);
  const name = pick(rand, NAMES);
  const s = [
    { q: `한 상자에 사과가 ${k}개씩 들어 있습니다. 상자 수를 ○, 사과 수를 △`, a: `△ = ○ × ${k}` },
    { q: `${jq(name, "은/는")} 동생보다 ${k}살 많습니다. 동생의 나이를 ○, ${name}의 나이를 △`, a: `△ = ○ + ${k}` },
    { q: `하루에 책을 ${k}쪽씩 읽습니다. 읽은 날수를 ○, 읽은 쪽수를 △`, a: `△ = ○ × ${k}` },
    { q: `${jq(name, "은/는")} 누나보다 ${k}살 적습니다. 누나의 나이를 ○, ${name}의 나이를 △`, a: `△ = ○ − ${k}` },
    { q: `길이가 ○ cm인 색 테이프를 ${k}도막으로 똑같이 잘랐습니다. 한 도막의 길이를 △ cm`, a: `△ = ○ ÷ ${k}` },
  ][kind];
  return {
    key: `${kind}:${k}`,
    prompt: `${jq(s.q, "이라고/라고")} 할 때, 두 양 사이의 대응 관계를 식으로 바르게 나타낸 것을 고르세요.`,
    answer: s.a,
    choices: shuffle(rand, [`△ = ○ × ${k}`, `△ = ○ + ${k}`, `△ = ○ − ${k}`, `△ = ○ ÷ ${k}`]),
    hint: "○에 1, 2, 3을 넣어 △가 어떻게 되는지 생각해 보세요.",
    explanation: s.a,
  };
});

export const corClock = mid("l5-cor-clock", (rand) => {
  const k = randInt(rand, 1, 5);
  const late = rand() < 0.5;
  const x = late ? randInt(rand, k + 1, 11) : randInt(rand, 1, 11 - k);
  const city = pick(rand, ["가", "나", "다"]);
  return {
    key: `${k}:${late}:${x}`,
    prompt: `${city} 도시의 시각은 서울의 시각보다 항상 ${k}시간 ${late ? "느립니다" : "빠릅니다"}. 서울이 오후 ${x}시일 때 ${city} 도시는 오후 몇 시인가요?`,
    answer: late ? x - k : x + k,
    unit: "시",
    hint: `(${city} 도시의 시각) = (서울의 시각) ${late ? "−" : "+"} ${k}`,
    explanation: `${x} ${late ? "−" : "+"} ${k} = ${late ? x - k : x + k} → 오후 ${late ? x - k : x + k}시`,
  };
});

export const corCut = word("l5-cor-cut", (rand) => {
  const t = randInt(rand, 2, 9);
  const n = randInt(rand, 4, 15);
  const thing = pick(rand, ["통나무", "철근", "나무 막대"]);
  return {
    key: `${t}:${n}:${thing}`,
    prompt: `${jq(thing, "을/를")} 한 번 자르는 데 ${t}분이 걸립니다. 쉬지 않고 ${jq(thing, "을/를")} ${n}도막으로 자르려면 모두 몇 분이 걸리나요?`,
    answer: t * (n - 1),
    unit: "분",
    hint: "자른 횟수는 도막 수보다 1 작아요.",
    explanation: `자른 횟수 = ${n} − 1 = ${n - 1}(번), ${n - 1} × ${t} = ${t * (n - 1)}(분)`,
    mistakes: { [t * n]: "도막 수만큼 자른다고 생각했어요." },
  };
});

export const corFee = word("l5-cor-fee", (rand) => {
  const A = randInt(rand, 2, 8) * 1000;
  const p = randInt(rand, 3, 8) * 100;
  const q = p + randInt(rand, 2, 8) * 100;
  const n = randInt(rand, 3, 15);
  const x = A + p * n;
  const y = q * n;
  if (x === y) return null;
  return {
    key: `${A}:${p}:${q}:${n}`,
    prompt: `놀이공원 가 이용권은 입장료 ${A}원에 놀이 기구를 한 번 탈 때마다 ${p}원을 더 내고, 나 이용권은 입장료 없이 한 번 탈 때마다 ${q}원을 냅니다. 놀이 기구를 ${n}번 탈 때 두 이용권의 요금은 몇 원 차이가 나나요?`,
    answer: Math.abs(x - y),
    unit: "원",
    hint: "탄 횟수를 ○로 두고 두 이용권의 요금을 각각 식으로 나타내 보세요.",
    explanation: `가: ${A} + ${p} × ${n} = ${x}(원), 나: ${q} × ${n} = ${y}(원) → ${x < y ? "가" : "나"} 이용권이 ${Math.abs(x - y)}원 더 싸요.`,
  };
});

export const corEval = easy("l5-cor-eval", (rand) => {
  const k = randInt(rand, 2, 9);
  const c = randInt(rand, 1, 9);
  const n = randInt(rand, 3, 15);
  const minus = rand() < 0.5 && n * k > c;
  return {
    key: `${k}:${c}:${n}:${minus}`,
    prompt: `○와 △ 사이의 대응 관계가 △ = ○ × ${k} ${minus ? "−" : "+"} ${c}입니다. ○가 ${n}일 때 △는 얼마인가요?`,
    answer: minus ? n * k - c : n * k + c,
    hint: "식의 ○ 자리에 수를 넣어 계산해요.",
    explanation: `${n} × ${k} ${minus ? "−" : "+"} ${c} = ${minus ? n * k - c : n * k + c}`,
  };
});

export const corReverse2 = mid("l5-cor-reverse2", (rand) => {
  const k = randInt(rand, 2, 9);
  const c = randInt(rand, 1, 9);
  const n = randInt(rand, 3, 15);
  const minus = rand() < 0.5 && n * k > c;
  const y = minus ? n * k - c : n * k + c;
  return {
    key: `${k}:${c}:${n}:${minus}`,
    prompt: `○와 △ 사이의 대응 관계가 △ = ○ × ${k} ${minus ? "−" : "+"} ${c}입니다. △가 ${y}일 때 ○는 얼마인가요?`,
    answer: n,
    hint: "거꾸로 생각해요. 먼저 ○ × " + k + "의 값을 구해요.",
    explanation: `○ × ${k} = ${y} ${minus ? "+" : "−"} ${c} = ${n * k}, ○ = ${n}`,
  };
});

export const corSticks = mid("l5-cor-sticks", (rand) => {
  const s = pick(rand, STICKS);
  const n = randInt(rand, 5, 25);
  const total = s.per * n + (s.first - s.per);
  return {
    key: `${s.shape}:${n}`,
    prompt: `성냥개비로 ${jq(s.shape, "을/를")} 그림과 같이 한 줄로 이어 붙여 만듭니다. 성냥개비 ${total}개를 모두 사용하면 ${jq(s.shape, "을/를")} 몇 개 만들 수 있나요?`,
    visual: sticksScene(s.shape),
    answer: n,
    unit: "개",
    hint: `(성냥개비 수) = (${s.shape} 수) × ${s.per} + ${jq(s.first - s.per, "을/를")} 거꾸로 생각해요.`,
    explanation: `(${total} − ${s.first - s.per}) ÷ ${s.per} = ${n}(개)`,
  };
});

export const corTablesRev = word("l5-cor-tables-rev", (rand) => {
  const P = randInt(rand, 12, 60);
  const t = Math.ceil((P - 2) / 2);
  return {
    key: `${P}`,
    prompt: `그림과 같이 정사각형 모양 탁자를 한 줄로 이어 붙이고 둘레에 의자를 놓습니다. ${P}명이 모두 앉으려면 탁자는 적어도 몇 개 필요한가요?`,
    visual: tablesScene(),
    answer: t,
    unit: "개",
    hint: "(앉을 수 있는 사람 수) = (탁자 수) × 2 + 2예요.",
    explanation: `탁자 ${t}개에 ${t * 2 + 2}명${t > 1 ? `, ${t - 1}개에 ${t * 2}명` : ""}이 앉을 수 있으므로 적어도 ${t}개`,
    mistakes: { [Math.ceil(P / 4)]: "탁자를 이어 붙이면 붙은 쪽에는 앉을 수 없어요." },
  };
});

export const corSaving = word("l5-cor-saving", (rand) => {
  const name = pick(rand, NAMES);
  const A = randInt(rand, 1, 9) * 1000;
  const d = randInt(rand, 3, 9) * 100;
  const n = randInt(rand, 5, 30);
  const T = A + d * n;
  return {
    key: `${A}:${d}:${n}`,
    prompt: `${name}의 저금통에는 ${A}원이 들어 있습니다. 내일부터 하루에 ${d}원씩 저금한다면 저금통의 돈이 ${T}원이 되는 것은 며칠 뒤인가요?`,
    answer: n,
    unit: "일",
    hint: `날수를 ○, 저금통의 돈을 △라 하면 △ = ${A} + ○ × ${d}`,
    explanation: `(${T} − ${A}) ÷ ${d} = ${n}(일)`,
    mistakes: { [T / d]: `처음에 들어 있던 ${A}원을 빼지 않았어요.` },
  };
});

/* ══════════ 5-1-4 약분과 통분 ══════════ */

const coprimeQ = (rand: () => number, dMin = 2, dMax = 9): Q | null => {
  const q = properQ(rand, dMin, dMax);
  return gcd(q[0], q[1]) === 1 ? q : null;
};

export const eqMake = easy("l5-eq-make", (rand) => {
  const q = coprimeQ(rand, 2, 9);
  if (!q) return null;
  const k = randInt(rand, 2, 8);
  const up = rand() < 0.5;
  return up
    ? {
        key: `u:${q}:${k}`,
        prompt: "크기가 같은 분수가 되도록 □ 안에 알맞은 수를 구하세요.",
        expression: `${q[0]}/${q[1]} = □/${q[1] * k}`,
        answer: q[0] * k,
        hint: "분모와 분자에 0이 아닌 같은 수를 곱하면 크기가 같은 분수가 돼요.",
        explanation: `분모에 ${jq(k, "을/를")} 곱했으므로 분자에도 ${jq(k, "을/를")} 곱해요: ${q[0]} × ${k} = ${q[0] * k}`,
      }
    : {
        key: `d:${q}:${k}`,
        prompt: "크기가 같은 분수가 되도록 □ 안에 알맞은 수를 구하세요.",
        expression: `${q[0] * k}/${q[1] * k} = □/${q[1]}`,
        answer: q[0],
        hint: "분모와 분자를 0이 아닌 같은 수로 나누면 크기가 같은 분수가 돼요.",
        explanation: `분모를 ${jq(k, "으로/로")} 나누었으므로 분자도 ${jq(k, "으로/로")} 나누어요: ${q[0] * k} ÷ ${k} = ${q[0]}`,
      };
});

export const eqDiff = mid("l5-eq-diff", (rand) => {
  const q = coprimeQ(rand, 2, 7);
  if (!q) return null;
  const ks = shuffle(rand, [2, 3, 4, 5, 6]).slice(0, 3);
  const same = ks.map((k) => `${q[0] * k}/${q[1] * k}`);
  const k = randInt(rand, 2, 6);
  const answer = rand() < 0.5 ? `${q[0] * k + 1}/${q[1] * k}` : `${q[0] * k}/${q[1] * k + 1}`;
  if (same.includes(answer)) return null;
  return {
    key: `${q}:${ks}:${answer}`,
    prompt: `${jq(`${q[0]}/${q[1]}`, "과/와")} 크기가 다른 분수를 고르세요.`,
    answer,
    choices: shuffle(rand, [answer, ...same]),
    hint: "분모와 분자를 같은 수로 나누어 기약분수로 만들어 비교해요.",
    explanation: `${jq(same.join(", "), "은/는")} ${jq(`${q[0]}/${q[1]}`, "과/와")} 크기가 같고, ${jq(answer, "은/는")} 달라요.`,
  };
});

export const eqCount = mid("l5-eq-count", (rand) => {
  const q = coprimeQ(rand, 2, 9);
  if (!q) return null;
  const N = randInt(rand, 30, 80);
  const cnt = Math.floor((N - 1) / q[1]);
  return {
    key: `${q}:${N}`,
    prompt: `${jq(`${q[0]}/${q[1]}`, "과/와")} 크기가 같은 분수 중에서 분모가 ${N}보다 작은 분수는 모두 몇 개인가요? (${q[0]}/${q[1]}도 포함)`,
    answer: cnt,
    unit: "개",
    hint: `분모는 ${q[1]}의 배수가 돼요.`,
    explanation: `분모가 ${q[1]}, ${q[1] * 2}, … ${q[1] * cnt}인 분수 → ${cnt}개`,
  };
});

export const eqSum = word("l5-eq-sum", (rand) => {
  const q = coprimeQ(rand, 3, 9);
  if (!q) return null;
  const k = randInt(rand, 2, 9);
  const S = (q[0] + q[1]) * k;
  const answer = `${q[0] * k}/${q[1] * k}`;
  return {
    key: `${q}:${k}`,
    prompt: `${jq(`${q[0]}/${q[1]}`, "과/와")} 크기가 같은 분수 중에서 분모와 분자의 합이 ${S}인 분수를 고르세요.`,
    answer,
    choices: choices4(rand, answer, [`${q[0] * (k + 1)}/${q[1] * (k + 1)}`, `${q[0] * k + 1}/${q[1] * k - 1}`, `${q[0] * (k - 1)}/${q[1] * (k - 1)}`], () => `${randInt(rand, 1, S - 1)}/${S}`, true),
    hint: `분모와 분자의 합 ${jq(q[0] + q[1], "이/가")} 몇 배가 되어야 ${jq(S, "이/가")} 되는지 생각해요.`,
    explanation: `${S} ÷ ${q[0] + q[1]} = ${k}이므로 분모와 분자에 ${jq(k, "을/를")} 곱해요: ${answer}`,
  };
});

export const eqAdd = word("l5-eq-add", (rand) => {
  const q = coprimeQ(rand, 3, 9);
  if (!q) return null;
  const m = randInt(rand, 1, 5);
  return {
    key: `${q}:${m}`,
    prompt: `${q[0]}/${q[1]}의 분자에 ${jq(q[0] * m, "을/를")} 더했습니다. 분수의 크기가 변하지 않으려면 분모에 얼마를 더해야 하나요?`,
    answer: q[1] * m,
    hint: `분자가 ${q[0]}에서 ${jq(q[0] * (m + 1), "이/가")} 되었으니 ${m + 1}배가 된 거예요.`,
    explanation: `분자 ${q[0] * (m + 1)} = ${q[0]} × ${m + 1} → 분모도 ${q[1]} × ${m + 1} = ${q[1] * (m + 1)}, 더할 수 ${q[1] * (m + 1)} − ${q[1]} = ${q[1] * m}`,
    mistakes: { [q[0] * m]: "분자에 더한 수를 분모에도 더하면 크기가 달라져요." },
  };
});

export const redIrrCount = mid("l5-red-irr-count", (rand) => {
  const N = randInt(rand, 6, 30);
  const hits = Array.from({ length: N - 1 }, (_, i) => i + 1).filter((x) => gcd(x, N) === 1);
  return {
    key: `${N}`,
    prompt: `분모가 ${N}인 진분수 중에서 기약분수는 모두 몇 개인가요?`,
    answer: hits.length,
    unit: "개",
    hint: `분자와 ${N}의 공약수가 1뿐인 분수를 찾아요.`,
    explanation: `분자가 ${hits.join(", ")}일 때 → ${hits.length}개`,
    mistakes: { [N - 1]: "약분되는 분수도 세었어요." },
  };
});

export const redBefore = word("l5-red-before", (rand) => {
  const q = coprimeQ(rand, 3, 12);
  if (!q) return null;
  const k = randInt(rand, 2, 9);
  const D = (q[1] - q[0]) * k;
  const answer = `${q[0] * k}/${q[1] * k}`;
  return {
    key: `${q}:${k}`,
    prompt: `어떤 분수를 약분하였더니 ${jq(`${q[0]}/${q[1]}`, "이/가")} 되었습니다. 약분하기 전 분수의 분모와 분자의 차가 ${D}일 때, 약분하기 전의 분수를 고르세요.`,
    answer,
    choices: choices4(rand, answer, [`${q[0] * (k + 1)}/${q[1] * (k + 1)}`, `${q[0] * (k - 1) || 1}/${q[1] * (k - 1) || 2}`, `${q[0] * k + 1}/${q[1] * k + 1}`], () => `${randInt(rand, 1, 30)}/${randInt(rand, 31, 60)}`, true),
    hint: `분모와 분자의 차 ${jq(q[1] - q[0], "이/가")} 몇 배가 되었는지 생각해요.`,
    explanation: `${D} ÷ ${q[1] - q[0]} = ${k} → ${q[0]} × ${k} / ${q[1]} × ${k} = ${answer}`,
  };
});

const pairD = (rand: () => number) => {
  const b = randInt(rand, 2, 12);
  let d = randInt(rand, 2, 12);
  if (b === d) d = b === 12 ? 9 : b + 1;
  return [b, d];
};

export const comPair = mid("l5-com-pair", (rand) => {
  const [b, d] = pick(rand, [[4, 6], [6, 8], [6, 9], [4, 10], [8, 12], [9, 12], [10, 12], [6, 10], [4, 12], [6, 15], [10, 15], [8, 10]]);
  const L = lcm(b, d);
  const a = pick(rand, coprimeTo(b));
  const c = pick(rand, coprimeTo(d));
  const answer = `(${(a * L) / b}/${L}, ${(c * L) / d}/${L})`;
  return {
    key: `${a}/${b}:${c}/${d}`,
    prompt: `두 분수 ${a}/${b}, ${jq(`${c}/${d}`, "을/를")} 두 분모의 최소공배수를 공통분모로 하여 통분한 것을 고르세요.`,
    answer,
    choices: choices4(rand, answer, [`(${a * d}/${b * d}, ${c * b}/${b * d})`, `(${a}/${L}, ${c}/${L})`, `(${(a * L) / b}/${L}, ${c + 1}/${L})`], () => `(${randInt(rand, 1, L)}/${L}, ${randInt(rand, 1, L)}/${L})`),
    hint: `${jq(b, "과/와")} ${d}의 최소공배수를 구한 뒤 분모와 분자에 같은 수를 곱해요.`,
    explanation: `최소공배수 ${L} → ${answer}`,
  };
});

export const comNotCommon = mid("l5-com-not-common", (rand) => {
  const [b, d] = pairD(rand);
  const L = lcm(b, d);
  if (L > 40) return null;
  const good = [1, 2, 3, 4].map((k) => L * k);
  const answer = pick(rand, [L + b, L + d, L * 2 - b].filter((x) => x % L !== 0));
  if (answer === undefined) return null;
  return {
    key: `${b}:${d}:${answer}`,
    prompt: `분모가 ${b}인 분수와 분모가 ${d}인 분수를 통분할 때, 공통분모가 될 수 없는 수를 고르세요.`,
    answer: String(answer),
    choices: shuffle(rand, [String(answer), ...shuffle(rand, good).slice(0, 3).map(String)]),
    hint: "공통분모는 두 분모의 공배수, 곧 최소공배수의 배수예요.",
    explanation: `최소공배수 ${L}의 배수가 아닌 ${jq(answer, "은/는")} 공통분모가 될 수 없어요.`,
  };
});

export const comBetween = word("l5-com-between", (rand) => {
  const [b, d] = pairD(rand);
  let a = randInt(rand, 1, b - 1);
  let c = randInt(rand, 1, d - 1);
  // 기약분수로, 작은 분수부터 제시한다
  if (gcd(a, b) !== 1 || gcd(c, d) !== 1 || a * d === c * b) return null;
  let [bb, dd] = [b, d];
  if (a * d > c * b) [a, bb, c, dd] = [c, d, a, b];
  const m = randInt(rand, 1, 3);
  const L = lcm(bb, dd) * m;
  const x = (a * L) / bb;
  const y = (c * L) / dd;
  const [lo, hi] = [x, y];
  const cnt = hi - lo - 1;
  if (cnt < 1 || L > 72) return null;
  return {
    key: `${a}/${bb}:${c}/${dd}:${L}`,
    prompt: `${jq(`${a}/${bb}`, "과/와")} ${c}/${dd} 사이에 있는 분수 중에서 분모가 ${L}인 분수는 모두 몇 개인가요? (기약분수가 아니어도 됩니다.)`,
    answer: cnt,
    unit: "개",
    hint: `두 분수를 분모가 ${L}인 분수로 통분해 보세요.`,
    explanation: `${jq(`${x}/${L}`, "과/와")} ${y}/${L} 사이 → 분자가 ${lo + 1}부터 ${hi - 1}까지 ${cnt}개`,
    mistakes: { [hi - lo + 1]: "양 끝의 분수는 사이에 있는 분수가 아니에요." },
  };
});

export const cmpUnit = easy("l5-cmp-unit", (rand) => {
  const a = randInt(rand, 2, 15);
  let b = randInt(rand, 2, 15);
  if (a === b) b += 1;
  const n = rand() < 0.5 ? 1 : randInt(rand, 1, Math.min(a, b) - 1);
  // 두 분수 모두 기약분수로(2/6 ○ 2/5 같은 표기가 나오지 않게)
  if (gcd(n, a) !== 1 || gcd(n, b) !== 1) return null;
  const answer = n / a > n / b ? ">" : "<";
  return {
    key: `${n}:${a}:${b}`,
    prompt: "○ 안에 >, =, < 중 알맞은 것을 고르세요.",
    expression: `${n}/${a} ○ ${n}/${b}`,
    answer,
    choices: [">", "<", "="],
    hint: "분자가 같으면 분모가 작을수록 큰 분수예요.",
    explanation: `${n}/${a} ${answer} ${n}/${b}`,
  };
});

export const cmpLargest = mid("l5-cmp-largest", (rand) => {
  const qs: Q[] = [];
  for (let i = 0; qs.length < 4 && i < 60; i++) {
    const q = coprimeQ(rand, 3, 12);
    if (q && !qs.some((x) => qVal(x) === qVal(q))) qs.push(q);
  }
  if (qs.length < 4) return null;
  const big = rand() < 0.5;
  const ans = qs.reduce((m, x) => ((big ? qVal(x) > qVal(m) : qVal(x) < qVal(m)) ? x : m));
  const t = (q: Q) => `${q[0]}/${q[1]}`;
  return {
    key: `${big}:${qs.map(t).join()}`,
    prompt: `가장 ${big ? "큰" : "작은"} 분수를 고르세요.`,
    answer: t(ans),
    choices: qs.map(t),
    hint: "두 분수씩 통분하여 비교하거나, 1/2과 비교해 보세요.",
    explanation: `크기 순서: ${[...qs].sort((x, y) => qVal(y) - qVal(x)).map(t).join(" > ")}`,
  };
});

export const cmpBox = word("l5-cmp-box", (rand) => {
  const q = coprimeQ(rand, 3, 9);
  if (!q) return null;
  const a = randInt(rand, 4, 20);
  if ((q[0] * a) % q[1] === 0) return null;
  const cnt = Math.floor((q[0] * a) / q[1]);
  if (cnt < 1) return null;
  return {
    key: `${q}:${a}`,
    prompt: "□ 안에 들어갈 수 있는 자연수는 모두 몇 개인가요?",
    expression: `□/${a} < ${q[0]}/${q[1]}`,
    answer: cnt,
    unit: "개",
    hint: `두 분수를 분모 ${jq(lcm(a, q[1]), "으로/로")} 통분해 분자를 비교해요.`,
    explanation: `□ × ${lcm(a, q[1]) / a} < ${(q[0] * lcm(a, q[1])) / q[1]} → □는 1부터 ${cnt}까지 ${cnt}개`,
  };
});

/** 분모가 다른 분수 넷의 크기 비교: 가장 많이(적게) 마신 사람(차는 묻지 않는다 — 뺄셈은 다음 단원) */
export const cmpMost = word("l5-cmp-most", (rand) => {
  const names = shuffle(rand, NAMES).slice(0, 4);
  const qs: Q[] = [];
  for (let i = 0; qs.length < 4 && i < 60; i++) {
    const q = coprimeQ(rand, 3, 10);
    if (q && !qs.some((x) => x[1] === q[1] || Math.abs(qVal(x) - qVal(q)) < 1e-9)) qs.push(q);
  }
  if (qs.length < 4) return null;
  const big = rand() < 0.5;
  const at = qs.reduce((m, q, i) => ((big ? qVal(q) > qVal(qs[m]) : qVal(q) < qVal(qs[m])) ? i : m), 0);
  return {
    key: `${big}:${qs.join("|")}:${names.join()}`,
    prompt: `네 사람이 마신 우유의 양입니다. 우유를 가장 ${big ? "많이" : "적게"} 마신 사람은 누구인가요? ${names.map((n, i) => `${n} ${qs[i][0]}/${qs[i][1]} L`).join(", ")}`,
    answer: names[at],
    choices: names,
    hint: "두 분수씩 통분하여 크기를 비교해요. 분자가 같으면 분모가 작을수록 커요.",
    explanation: `통분하여 비교하면 ${jq(names[at], "이/가")} ${qs[at][0]}/${qs[at][1]} L로 가장 ${big ? "많이" : "적게"} 마셨어요.`,
  };
});

export const cmpWho = word("l5-cmp-who", (rand) => {
  const [p, r] = two(rand);
  const x = coprimeQ(rand, 2, 9);
  const y = coprimeQ(rand, 2, 9);
  if (!x || !y || x[1] === y[1] || qVal(x) === qVal(y)) return null;
  const diff = qText(qVal(x) > qVal(y) ? qSub(x, y) : qSub(y, x));
  const winner = qVal(x) > qVal(y) ? p : r;
  const loser = winner === p ? r : p;
  const answer = `${winner}, ${diff} L`;
  // 오답: 차 대신 합을 구함
  const alt = qText([x[0] * y[1] + y[0] * x[1], x[1] * y[1]]);
  return {
    key: `${x}:${y}`,
    prompt: `${jq(p, "은/는")} 우유를 ${x[0]}/${x[1]} L, ${jq(r, "은/는")} ${y[0]}/${y[1]} L 마셨습니다. 누가 몇 L 더 많이 마셨는지 고르세요.`,
    answer,
    choices: shuffle(rand, [answer, `${loser}, ${diff} L`, `${winner}, ${alt} L`, `${loser}, ${alt} L`]),
    hint: "두 분수를 통분하여 크기를 비교하고, 차를 구해요.",
    explanation: `통분하여 비교하면 ${jq(winner, "이/가")} 더 많이 마셨고, 차는 ${diff} L입니다.`,
  };
});

const DEC_D = [2, 4, 5, 10, 20, 25, 50];
const toDec = (q: Q) => trim(qVal(q), 3);

export const fdConvert = easy("l5-fd-convert", (rand) => {
  const d = pick(rand, DEC_D);
  const n = randInt(rand, 1, d - 1);
  if (gcd(n, d) !== 1) return null;
  return {
    key: `${n}/${d}`,
    prompt: `${jq(`${n}/${d}`, "을/를")} 소수로 나타내세요.`,
    answer: toDec([n, d]),
    hint: "분모가 10, 100이 되도록 분모와 분자에 같은 수를 곱해요.",
    explanation: `${n}/${d} = ${(n * 100) / d}/100 = ${toDec([n, d])}`,
  };
});

export const fdCompare = mid("l5-fd-compare", (rand) => {
  // 분모를 10, 100으로 고칠 수 있는 분수만(교과서 방법으로 비교)
  const d = pick(rand, [2, 4, 5, 20, 25, 50]);
  const n = randInt(rand, 1, d - 1);
  if (gcd(n, d) !== 1) return null;
  const q: Q = [n, d];
  const v = qVal(q);
  const dec = Number((v + pick(rand, [-0.1, 0, 0.1, 0.05, -0.05, 0.01])).toFixed(2));
  if (dec <= 0 || dec >= 1) return null;
  const answer = v > dec + 1e-9 ? ">" : v < dec - 1e-9 ? "<" : "=";
  return {
    key: `${q}:${dec}`,
    prompt: "○ 안에 >, =, < 중 알맞은 것을 고르세요.",
    expression: `${q[0]}/${q[1]} ○ ${dec}`,
    answer,
    choices: [">", "<", "="],
    hint: "분수를 소수로 바꾸거나, 소수를 분수로 바꾸어 비교해요.",
    explanation: `${q[0]}/${q[1]} = ${trim(v, 3)}${Number.isInteger(v * 1000) ? "" : "…"} → ${answer}`,
  };
});

export const fdLargest = mid("l5-fd-largest", (rand) => {
  const items: { t: string; v: number }[] = [];
  for (let i = 0; items.length < 4 && i < 60; i++) {
    const isFrac = items.length % 2 === 0;
    const it = isFrac
      ? (() => {
          const d = pick(rand, DEC_D);
          const n = randInt(rand, 1, d - 1);
          return gcd(n, d) === 1 ? { t: `${n}/${d}`, v: n / d } : null;
        })()
      : (() => {
          const x = randInt(rand, 1, 99);
          return { t: trim(x / 100, 2), v: x / 100 };
        })();
    if (it && !items.some((y) => Math.abs(y.v - it.v) < 1e-9)) items.push(it);
  }
  if (items.length < 4) return null;
  const big = rand() < 0.5;
  const ans = items.reduce((m, x) => ((big ? x.v > m.v : x.v < m.v) ? x : m));
  return {
    key: `${big}:${items.map((x) => x.t).join()}`,
    prompt: `가장 ${big ? "큰" : "작은"} 수를 고르세요.`,
    answer: ans.t,
    choices: shuffle(rand, items.map((x) => x.t)),
    hint: "분수를 소수로 바꾸어 비교해요.",
    explanation: items.map((x) => `${x.t} = ${trim(x.v, 3)}`).join(", "),
  };
});

export const fdBox = word("l5-fd-box", (rand) => {
  // 분모가 작으면 답이 1개로 쏠리므로 분모 8·20·25를 더 자주 낸다
  const d = pick(rand, [4, 5, 8, 8, 10, 20, 20, 25, 25]);
  const a = randInt(rand, 1, 7);
  const b = a + randInt(rand, 2, 3);
  if (b > 9) return null;
  const ns = Array.from({ length: d - 1 }, (_, i) => i + 1).filter((n) => n / d > a / 10 && n / d < b / 10);
  if (!ns.length) return null;
  // 0.a, 0.b를 분모가 d인 분수로 정확히 바꿀 수 있을 때만 그 방법을 쓴다(0.6 = 4.8/8 같은 표기가 나오지 않게).
  // 바꿀 수 없으면 □/d 후보를 소수로 바꾸어 비교한다
  const toFrac = (a * d) % 10 === 0 && (b * d) % 10 === 0;
  return {
    key: `${d}:${a}:${b}`,
    prompt: "□ 안에 들어갈 수 있는 자연수는 모두 몇 개인가요?",
    expression: `0.${a} < □/${d} < 0.${b}`,
    answer: ns.length,
    unit: "개",
    hint: toFrac ? `0.${jq(a, "과/와")} 0.${jq(b, "을/를")} 분모가 ${d}인 분수로 바꾸어 생각해요.` : `□/${jq(d, "을/를")} 소수로 바꾸어 0.${jq(a, "과/와")} 0.${b} 사이에 있는지 비교해요.`,
    explanation: toFrac
      ? `0.${a} = ${(a * d) / 10}/${d}, 0.${b} = ${(b * d) / 10}/${d} → □: ${ns.join(", ")} (${ns.length}개)`
      : `${ns.map((n) => `${n}/${d} = ${trim(n / d, 3)}`).join(", ")} → 0.${jq(a, "과/와")} 0.${b} 사이: ${ns.join(", ")} (${ns.length}개)`,
  };
});

export const fdCards = word("l5-fd-cards", (rand) => {
  const cards = digitsCards(rand, 4, 1, 9).sort((x, y) => x - y);
  const t = pick(rand, [0.4, 0.5, 0.6]);
  const hits: string[] = [];
  for (const n of cards) for (const m of cards) if (n < m && n / m > t) hits.push(`${n}/${m}`);
  if (!hits.length) return null;
  return {
    key: `${cards.join()}:${t}`,
    prompt: `수 카드 ${cards.join(", ")} 중에서 2장을 골라 한 번씩 사용하여 진분수를 만들려고 합니다. 만들 수 있는 진분수 중에서 ${t}보다 큰 분수는 모두 몇 개인가요?`,
    answer: hits.length,
    unit: "개",
    hint: `진분수를 빠짐없이 만든 뒤 ${jq(t, "을/를")} 분수로 바꾸어 비교해요.`,
    explanation: `${t}보다 큰 진분수: ${hits.join(", ")} → ${hits.length}개`,
  };
});

/* ══════════ 5-1-5 분수의 덧셈과 뺄셈 ══════════ */

const L2 = (a: Q, b: Q) => lcm(a[1], b[1]);

export const faMissing = mid("l5-fa-missing", (rand) => {
  const a = properQ(rand);
  const b = properQ(rand);
  if (a[1] === b[1]) return null;
  const s = qAdd(a, b);
  const answer = qText(s);
  const L = L2(a, b);
  const diff = qSub(a, b);
  return {
    key: `${a}:${b}`,
    prompt: "□ 안에 알맞은 수를 고르세요.",
    expression: `□ − ${qShow(a)} = ${qShow(b)}`,
    answer,
    choices: fracChoices(rand, answer, [diff[0] > 0 ? qText(diff) : qText(qSub(b, a)), reduced(a[0] + b[0], a[1] + b[1]), qText([s[0] * 2 + b[1] * a[1], s[1] * 2])], L),
    hint: `□ = ${qShow(b)} + ${jq(qShow(a), "으로/로")} 거꾸로 생각해요.`,
    explanation: `${qShow(b)} + ${qShow(a)} = ${answer}`,
  };
});

export const faWrong = word("l5-fa-wrong", (rand) => {
  const a = properQ(rand, 2, 8);
  const c = properQ(rand, 2, 8);
  if (a[1] === c[1]) return null;
  const x = qAdd(c, a);
  const right = qAdd(x, a);
  const L = L2(a, c);
  const answer = qText(right);
  return {
    key: `${a}:${c}`,
    prompt: `어떤 수에 ${jq(qShow(a), "을/를")} 더해야 할 것을 잘못하여 뺐더니 ${jq(qShow(c), "이/가")} 되었습니다. 바르게 계산한 값을 고르세요.`,
    answer,
    choices: fracChoices(rand, answer, [qText(x), qText(c), qText(qAdd(c, [a[0] * 3, a[1]]))], L),
    hint: "먼저 어떤 수를 구해요: (어떤 수) = (잘못 계산한 값) + (뺀 수)",
    explanation: `어떤 수 = ${qShow(c)} + ${qShow(a)} = ${qText(x)}, 바르게: ${qText(x)} + ${qShow(a)} = ${answer}`,
  };
});

const properAddEx = (rand: () => number): Ex | null => {
  const a = properQ(rand, 2, 8);
  const b = properQ(rand, 2, 8);
  if (a[1] === b[1]) return null;
  const s = qAdd(a, b);
  return { text: `${a[0]}/${a[1]} + ${b[0]}/${b[1]}`, value: qVal(s), show: qText(s) };
};

export const faExtreme = extremeOf("l5-fa-extreme", 2, properAddEx, "통분하여 더한 뒤 크기를 비교해요.");

export const faThree = word("l5-fa-three", (rand) => {
  const names = shuffle(rand, NAMES).slice(0, 3);
  const qs = [properQ(rand, 2, 6), properQ(rand, 2, 6), properQ(rand, 2, 6)];
  if (new Set(qs.map((q) => q[1])).size < 2) return null;
  const s = qAdd(qAdd(qs[0], qs[1]), qs[2]);
  const answer = qText(s);
  const L = lcm(lcm(qs[0][1], qs[1][1]), qs[2][1]);
  return {
    key: qs.join("|"),
    prompt: `${jq(names[0], "은/는")} 우유를 ${qs[0][0]}/${qs[0][1]} L, ${jq(names[1], "은/는")} ${qs[1][0]}/${qs[1][1]} L, ${jq(names[2], "은/는")} ${qs[2][0]}/${qs[2][1]} L 마셨습니다. 세 사람이 마신 우유는 모두 몇 L인지 고르세요.`,
    answer,
    choices: fracChoices(rand, answer, [qText(qAdd(qs[0], qs[1])), reduced(qs[0][0] + qs[1][0] + qs[2][0], qs[0][1] + qs[1][1] + qs[2][1]), qText(qAdd(s, [1, L]))], L),
    hint: "두 분수씩 차례로 통분하여 더하거나, 세 분모의 공통분모로 한꺼번에 통분해요.",
    explanation: `${qs.map((q) => `${q[0]}/${q[1]}`).join(" + ")} = ${answer} L`,
  };
});

const mixedAddEx = (rand: () => number): Ex | null => {
  const a = mixedQ(rand, 3, 2, 6);
  const b = mixedQ(rand, 3, 2, 6);
  if (a[1] === b[1]) return null;
  const s = qAdd(a, b);
  return { text: `${qShow(a)} + ${qShow(b)}`, value: qVal(s), show: qText(s) };
};

export const fmaMissing = mid("l5-fma-missing", (rand) => {
  const a = mixedQ(rand, 3, 2, 7);
  const b = mixedQ(rand, 3, 2, 7);
  if (a[1] === b[1]) return null;
  const s = qAdd(a, b);
  const answer = qText(s);
  return {
    key: `${a}:${b}`,
    prompt: "□ 안에 알맞은 수를 고르세요.",
    expression: `□ − ${qShow(a)} = ${qShow(b)}`,
    answer,
    choices: fracChoices(rand, answer, [qText(qAdd(s, [1, 1])), qText(qAdd(s, [-1, s[1]])), qVal(a) > qVal(b) ? qText(qSub(a, b)) : qText(qSub(b, a))], L2(a, b)),
    hint: "□ = (뺀 결과) + (뺀 수)",
    explanation: `${qShow(b)} + ${qShow(a)} = ${answer}`,
  };
});

export const fmaExtreme = extremeOf("l5-fma-extreme", 2, mixedAddEx, "자연수끼리, 분수끼리 더해 비교해요. 분수는 통분해서 더해요.");

export const fmaCards = word("l5-fma-cards", (rand) => {
  const cs = digitsCards(rand, 3, 1, 9).sort((x, y) => x - y);
  const big: Q = [cs[2] * cs[1] + cs[0], cs[1]];
  const small: Q = [cs[0] * cs[2] + cs[1], cs[2]];
  const s = qAdd(big, small);
  const answer = qText(s);
  return {
    key: cs.join(),
    prompt: `수 카드 ${jq(cs.join(", "), "을/를")} 한 번씩 모두 사용하여 대분수를 만들려고 합니다. 만들 수 있는 가장 큰 대분수와 가장 작은 대분수의 합을 고르세요.`,
    answer,
    choices: fracChoices(rand, answer, [qText(qSub(big, small)), qText(qAdd(s, [1, 1])), qText(qAdd(s, [-1, 1]))], lcm(cs[1], cs[2])),
    hint: "가장 큰 대분수는 자연수 부분이 가장 크고, 가장 작은 대분수는 자연수 부분이 가장 작아요. 분수 부분은 진분수여야 해요.",
    explanation: `가장 큰 대분수 ${qShow(big)}, 가장 작은 대분수 ${qShow(small)} → 합 ${answer}`,
  };
});

export const fsMissing = mid("l5-fs-missing", (rand) => {
  const a = properQ(rand);
  const c = properQ(rand);
  if (a[1] === c[1] || qVal(a) <= qVal(c)) return null;
  const x = qSub(a, c);
  const answer = qText(x);
  return {
    key: `${a}:${c}`,
    prompt: "□ 안에 알맞은 수를 고르세요.",
    expression: `${qShow(a)} − □ = ${qShow(c)}`,
    answer,
    // 진분수 답에 자연수 보기(분모끼리·분자끼리 뺀 값이 1이 되는 경우)는 넣지 않는다
    choices: properFracChoices(rand, answer, [qText(qAdd(a, c)), reduced(Math.abs(a[0] - c[0]) || 1, Math.abs(a[1] - c[1]) || 1), qText(qAdd(x, [1, L2(a, c)]))], L2(a, c)),
    hint: `□ = ${qShow(a)} − ${qShow(c)}`,
    explanation: `${qShow(a)} − ${qShow(c)} = ${answer}`,
  };
});

export const fsRange = mid("l5-fs-range", (rand) => {
  const qs: Q[] = [];
  for (let i = 0; qs.length < 3 && i < 40; i++) {
    const q = coprimeQ(rand, 2, 9);
    if (q && !qs.some((x) => qVal(x) === qVal(q) || x[1] === q[1])) qs.push(q);
  }
  if (qs.length < 3) return null;
  const sorted = [...qs].sort((x, y) => qVal(y) - qVal(x));
  const d = qSub(sorted[0], sorted[2]);
  const answer = qText(d);
  const L = lcm(lcm(qs[0][1], qs[1][1]), qs[2][1]);
  return {
    key: qs.map(String).join("|"),
    prompt: `${qs.map((q) => `${q[0]}/${q[1]}`).join(", ")} 중에서 가장 큰 수와 가장 작은 수의 차를 고르세요.`,
    answer,
    choices: fracChoices(rand, answer, [qText(qSub(sorted[0], sorted[1])), qText(qSub(sorted[1], sorted[2])), qText(qAdd(sorted[0], sorted[2]))], L),
    hint: "통분하여 크기를 비교한 뒤 가장 큰 수에서 가장 작은 수를 빼요.",
    explanation: `${sorted[0][0]}/${sorted[0][1]} − ${sorted[2][0]}/${sorted[2][1]} = ${answer}`,
  };
});

export const fsRemain = word("l5-fs-remain", (rand) => {
  const [p, r] = two(rand);
  const a = coprimeQ(rand, 2, 8);
  const b = coprimeQ(rand, 3, 9);
  if (!a || !b || a[1] === b[1]) return null;
  const used = qAdd(a, b);
  if (qVal(used) >= 1) return null;
  const rest = qSub([1, 1], used);
  const answer = qText(rest);
  return {
    key: `${a}:${b}`,
    prompt: `케이크 한 개를 ${jq(p, "이/가")} 전체의 ${a[0]}/${a[1]}, ${jq(r, "이/가")} 전체의 ${b[0]}/${b[1]}만큼 먹었습니다. 남은 케이크는 전체의 얼마인지 고르세요.`,
    answer,
    choices: fracChoices(rand, answer, [qText(used), qText(qSub([1, 1], a)), qText(qSub([1, 1], b))], lcm(a[1], b[1])),
    hint: "먹은 양을 모두 더한 뒤 전체 1에서 빼요.",
    explanation: `먹은 양 ${qText(used)}, 1 − ${qText(used)} = ${answer}`,
  };
});

export const fsError = word("l5-fs-error", (rand) => {
  const name = pick(rand, NAMES);
  const b = randInt(rand, 4, 12);
  const d = randInt(rand, 2, b - 2);
  const a = randInt(rand, 2, b - 1);
  const c = randInt(rand, 1, Math.min(a - 1, d - 1));
  if (c < 1 || a / b <= c / d || gcd(a, b) !== 1 || gcd(c, d) !== 1) return null;
  const right = qSub([a, b], [c, d]);
  const naive = reduced(a - c, b - d);
  const answer = qText(right);
  if (naive === answer) return null;
  return {
    key: `${a}/${b}:${c}/${d}`,
    prompt: `${name}의 풀이: ${a}/${b} − ${c}/${d} = ${a - c}/${b - d}. 잘못 계산한 부분을 바르게 고쳐 계산한 값을 고르세요.`,
    answer,
    // 진분수 답에 자연수 보기는 넣지 않는다(잘못 계산한 값이 3/3 = 1처럼 자연수가 되면 보기에서 뺀다)
    choices: properFracChoices(rand, answer, [naive, qText(qAdd([a, b], [c, d])), reduced(a - c, b * d)], lcm(b, d)),
    hint: "분모가 다른 분수의 뺄셈은 분모끼리, 분자끼리 빼면 안 돼요. 먼저 통분해요.",
    explanation: `${jq(name, "은/는")} 분모끼리, 분자끼리 뺐어요. 통분하면 ${a * (lcm(b, d) / b)}/${lcm(b, d)} − ${c * (lcm(b, d) / d)}/${lcm(b, d)} = ${answer}`,
  };
});

export const fmsEasy = easy("l5-fms-easy", (rand) => {
  const a = mixedQ(rand, 5, 2, 8);
  const b = mixedQ(rand, 3, 2, 8);
  if (a[1] === b[1]) return null;
  const wa = Math.floor(a[0] / a[1]);
  const wb = Math.floor(b[0] / b[1]);
  const fa = (a[0] % a[1]) / a[1];
  const fb = (b[0] % b[1]) / b[1];
  if (wa <= wb || fa <= fb) return null;
  const r = qSub(a, b);
  const answer = qText(r);
  return {
    key: `${a}:${b}`,
    prompt: "계산하여 기약분수로 나타낸 것을 고르세요.",
    expression: `${qShow(a)} − ${qShow(b)}`,
    answer,
    choices: fracChoices(rand, answer, [qText(qAdd(a, b)), qText(qAdd(r, [1, 1])), qText(qAdd(r, [1, L2(a, b)]))], L2(a, b)),
    hint: "자연수는 자연수끼리, 분수는 통분하여 분수끼리 빼요.",
    explanation: `${qShow(a)} − ${qShow(b)} = ${answer}`,
  };
});

export const fmsMissing = mid("l5-fms-missing", (rand) => {
  const x = mixedQ(rand, 3, 2, 7);
  const b = mixedQ(rand, 2, 2, 7);
  if (x[1] === b[1]) return null;
  const a = qAdd(x, b);
  const answer = qText(x);
  return {
    key: `${x}:${b}`,
    prompt: "□ 안에 알맞은 수를 고르세요.",
    expression: `${qText(a)} − □ = ${qShow(b)}`,
    answer,
    choices: fracChoices(rand, answer, [qText(qAdd(a, b)), qText(qAdd(x, [1, 1])), qText(qSub(x, [1, x[1]]))], L2(x, b)),
    hint: `□ = ${qText(a)} − ${qShow(b)}`,
    explanation: `${qText(a)} − ${qShow(b)} = ${answer}`,
  };
});

export const fmsWrong = word("l5-fms-wrong", (rand) => {
  const A = mixedQ(rand, 2, 2, 6);
  const right = mixedQ(rand, 2, 2, 6);
  if (A[1] === right[1]) return null;
  const x = qAdd(right, A);
  const C = qAdd(x, A);
  const answer = qText(right);
  return {
    key: `${A}:${right}`,
    prompt: `어떤 수에서 ${jq(qShow(A), "을/를")} 빼야 할 것을 잘못하여 더했더니 ${jq(qText(C), "이/가")} 되었습니다. 바르게 계산한 값을 고르세요.`,
    answer,
    choices: fracChoices(rand, answer, [qText(x), qText(qSub(C, [1, 1])), qText(qAdd(right, [1, A[1]]))], L2(A, right)),
    hint: "(어떤 수) = (잘못 계산한 값) − (더한 수)를 먼저 구해요.",
    explanation: `어떤 수 = ${qText(C)} − ${qShow(A)} = ${qText(x)}, 바르게: ${qText(x)} − ${qShow(A)} = ${answer}`,
  };
});

export const fmsCompare = word("l5-fms-compare", (rand) => {
  const a = mixedQ(rand, 2, 2, 6);
  const b = mixedQ(rand, 2, 2, 6);
  const c = mixedQ(rand, 2, 2, 6);
  const e = mixedQ(rand, 2, 2, 6);
  if (a[1] === b[1] || c[1] === e[1]) return null;
  // 두 길 모두 한 곳을 거쳐 가므로 두 길의 거리를 모두 계산해야 비교할 수 있다
  const ga = qAdd(a, b);
  const na = qAdd(c, e);
  if (Math.abs(qVal(ga) - qVal(na)) < 1e-9) return null;
  const diff = qVal(ga) > qVal(na) ? qSub(ga, na) : qSub(na, ga);
  const near = qVal(ga) < qVal(na) ? "가" : "나";
  const far = near === "가" ? "나" : "가";
  const d = qText(diff);
  const alt = qText(qAdd(diff, [1, 1]));
  const answer = `${near} 길, ${d} km`;
  return {
    key: `${a}:${b}:${c}:${e}`,
    prompt: `집에서 공원까지 가는 길은 두 가지입니다. 가 길은 도서관을 거쳐 가는 길로 집~도서관 ${qShow(a)} km, 도서관~공원 ${qShow(b)} km이고, 나 길은 시장을 거쳐 가는 길로 집~시장 ${qShow(c)} km, 시장~공원 ${qShow(e)} km입니다. 어느 길이 몇 km 더 가까운지 고르세요.`,
    answer,
    choices: shuffle(rand, [answer, `${far} 길, ${d} km`, `${near} 길, ${alt} km`, `${far} 길, ${alt} km`]),
    hint: "두 길의 전체 거리를 각각 구한 뒤 큰 쪽에서 작은 쪽을 빼요.",
    explanation: `가 길 ${qText(ga)} km, 나 길 ${qText(na)} km → ${near} 길이 ${d} km 더 가까워요.`,
  };
});

/* ══════════ 5-1-6 다각형의 둘레와 넓이 ══════════ */

export const arSqFromPerim = mid("l5-ar-sq-perim", (rand) => {
  const s = randInt(rand, 2, 20);
  return {
    key: `${s}`,
    prompt: `둘레가 ${4 * s} cm인 정사각형의 넓이는 몇 cm²인가요?`,
    answer: s * s,
    unit: "cm²",
    hint: "먼저 한 변의 길이를 구해요.",
    explanation: `한 변 ${4 * s} ÷ 4 = ${s}(cm), 넓이 ${s} × ${s} = ${s * s}(cm²)`,
  };
});

export const arLShape = word("l5-ar-lshape", (rand) => {
  const W = randInt(rand, 8, 16);
  const H = randInt(rand, 6, 14);
  const w = randInt(rand, 2, W - 3);
  const h = randInt(rand, 2, H - 3);
  const k = 12;
  const P = (x: number, y: number): [number, number] => [44 + x * k, 24 + y * k];
  return {
    key: `${W}:${H}:${w}:${h}`,
    prompt: "도형의 넓이는 몇 cm²인가요?",
    visual: {
      kind: "shape",
      width: W * k + 100,
      height: H * k + 56,
      label: "직사각형의 한 귀퉁이를 잘라 낸 모양의 도형",
      polygons: [{ points: [P(0, 0), P(W - w, 0), P(W - w, h), P(W, h), P(W, H), P(0, H)] }],
      texts: [
        { at: [44 + (W * k) / 2, H * k + 42], text: `${W} cm` },
        { at: [22, 24 + (H * k) / 2], text: `${H} cm` },
        { at: [44 + ((W - w) * k) / 2, 12], text: `${W - w} cm` },
        { at: [44 + (W - w) * k + 24, 24 + (h * k) / 2], text: `${h} cm` },
      ],
    },
    answer: W * H - w * h,
    unit: "cm²",
    hint: "큰 직사각형의 넓이에서 잘라 낸 작은 직사각형의 넓이를 빼거나, 두 직사각형으로 나누어 더해요.",
    explanation: `${W} × ${H} − ${w} × ${h} = ${W * H} − ${w * h} = ${W * H - w * h}(cm²)`,
    mistakes: { [W * H]: "잘라 낸 부분을 빼지 않았어요." },
  };
});

export const arMax = word("l5-ar-max", (rand) => {
  const half = randInt(rand, 7, 25);
  const a = Math.floor(half / 2);
  const b = half - a;
  return {
    key: `${half}`,
    prompt: `둘레가 ${half * 2} cm인 직사각형 중에서 넓이가 가장 넓은 것의 넓이는 몇 cm²인가요? (가로와 세로는 자연수이고, 정사각형도 직사각형입니다.)`,
    answer: a * b,
    unit: "cm²",
    hint: `가로와 세로의 합은 ${half} cm예요. 가로와 세로의 차가 작을수록 넓이가 넓어져요.`,
    explanation: `가로 + 세로 = ${half}, 가로 ${b} cm, 세로 ${a} cm일 때 ${a * b} cm²로 가장 넓어요.`,
    mistakes: { [half - 1]: "가로와 세로의 차가 가장 클 때를 구했어요." },
  };
});

export const auConvert = mid("l5-au-convert", (rand) => {
  const kind = randInt(rand, 0, 3);
  const n = randInt(rand, 2, 30);
  const s = [
    { e: `${n} m² = □ cm²`, a: n * 10000, h: "1 m² = 10000 cm²" },
    { e: `${n * 10000} cm² = □ m²`, a: n, h: "10000 cm² = 1 m²" },
    { e: `${n} km² = □ m²`, a: n * 1000000, h: "1 km² = 1000000 m²" },
    { e: `${n * 1000000} m² = □ km²`, a: n, h: "1000000 m² = 1 km²" },
  ][kind];
  return {
    key: `${kind}:${n}`,
    prompt: "□ 안에 알맞은 수를 구하세요.",
    expression: s.e,
    answer: s.a,
    hint: s.h,
    explanation: `${s.h} → ${s.e.replace("□", String(s.a))}`,
    mistakes: kind === 0 ? { [n * 100]: "1 m = 100 cm이지만 1 m² = 10000 cm²예요." } : kind === 2 ? { [n * 1000]: "1 km² = 1000000 m²예요." } : {},
  };
});

export const auCompare = mid("l5-au-compare", (rand) => {
  const km = rand() < 0.5;
  const a = randInt(rand, 1, 9);
  const base = km ? 1000000 : 10000;
  const b = a * base + pick(rand, [-1, 0, 1]) * randInt(rand, 1, 9) * (base / 10);
  const answer = a * base > b ? ">" : a * base < b ? "<" : "=";
  return {
    key: `${km}:${a}:${b}`,
    prompt: "○ 안에 >, =, < 중 알맞은 것을 고르세요.",
    expression: km ? `${a} km² ○ ${b} m²` : `${a} m² ○ ${b} cm²`,
    answer,
    choices: [">", "<", "="],
    hint: km ? "1 km² = 1000000 m²" : "1 m² = 10000 cm²",
    explanation: `${a} ${km ? "km²" : "m²"} = ${a * base} ${km ? "m²" : "cm²"} → ${answer}`,
  };
});



export const arTriPara = word("l5-ar-tri-para", (rand) => {
  const a = randInt(rand, 4, 20);
  const h = randInt(rand, 2, 16);
  const b = randInt(rand, 2, 12);
  const A = (a * h) / 2;
  if (!Number.isInteger(A) || A % b !== 0 || b === a) return null;
  return {
    key: `${a}:${h}:${b}`,
    prompt: `밑변이 ${a} cm, 높이가 ${h} cm인 삼각형과 넓이가 같은 평행사변형이 있습니다. 이 평행사변형의 밑변이 ${b} cm라면 높이는 몇 cm인가요?`,
    answer: A / b,
    unit: "cm",
    hint: "먼저 삼각형의 넓이를 구해요.",
    explanation: `삼각형 넓이 ${a} × ${h} ÷ 2 = ${A}(cm²), 평행사변형 높이 ${A} ÷ ${b} = ${A / b}(cm)`,
    mistakes: { [(a * h) / b]: "삼각형의 넓이를 구할 때 2로 나누지 않았어요." },
  };
});

