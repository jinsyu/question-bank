import { makeChoices, pick, randInt, shuffle } from "../../lib/random";
import type { ShapeScene } from "../types";
import { mid, word, type WordMap, type WordSpec } from "../words/word";
import { add, angleMark, fit, guard, lengthText, regularPolygon, rightMark, rp, segText, toScreen, vertexTexts, type Lines, type Pt, type Texts } from "../lessons/g5-figure";
import { jq } from "../lessons/g5-text";

/*
 * 5학년 단원마다 새로 더한 생성기(하·중·상 하나씩), 2026-10-04.
 * lessons/g5.ts는 extras를 가져오므로(순환) 여기서는 g5-figure·g5-text만 쓴다.
 */

/** 조건이 까다로운 생성기: 한 번에 n번까지 다시 뽑는다 */
const retry = (make: (rand: () => number) => WordSpec | null, n = 300) => (rand: () => number) => {
  for (let i = 0; i < n; i++) {
    const w = make(rand);
    if (w) return w;
  }
  return null;
};

const easy = (id: string, make: (rand: () => number) => WordSpec | null) => word(id, make, 1);

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const lcm = (a: number, b: number) => (a / gcd(a, b)) * b;
const divisors = (n: number) => Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0);
/** 소수 표기(부동소수 오차 없이) */
const dec = (n: number) => String(Number(n.toFixed(4)));

/** 분수 n/d를 기약분수(1보다 크면 대분수)로 */
export function fracText(n: number, d: number): string {
  const g = gcd(n, d);
  const [p, q] = [n / g, d / g];
  if (q === 1) return String(p);
  const w = Math.floor(p / q);
  return w ? `${w} ${p % q}/${q}` : `${p}/${q}`;
}

/* ════════ 5-1 자연수의 혼합 계산 ════════ */

type Op = "+" | "−" | "×" | "÷";
/** 계산 순서(괄호 → 곱셈·나눗셈 → 덧셈·뺄셈, 각각 앞에서부터)대로 계산. 중간에 음수·나누어떨어지지 않는 나눗셈이면 null */
export function evalExpr(nums: number[], ops: Op[], paren = -1): number | null {
  const ap = (a: number, op: Op, b: number): number | null => {
    if (op === "+") return a + b;
    if (op === "−") return a - b >= 0 ? a - b : null;
    if (op === "×") return a * b;
    return b !== 0 && a % b === 0 ? a / b : null;
  };
  let ns = [...nums];
  let os = [...ops];
  if (paren >= 0) {
    const v = ap(ns[paren], os[paren], ns[paren + 1]);
    if (v === null) return null;
    ns.splice(paren, 2, v);
    os.splice(paren, 1);
  }
  for (const group of [["×", "÷"], ["+", "−"]]) {
    for (let i = 0; i < os.length; ) {
      if (group.includes(os[i])) {
        const v = ap(ns[i], os[i], ns[i + 1]);
        if (v === null) return null;
        ns.splice(i, 2, v);
        os.splice(i, 1);
      } else i++;
    }
  }
  return ns[0];
}
const exprText = (nums: number[], ops: Op[], paren = -1) =>
  nums.map((n, i) => `${i === paren ? "(" : ""}${n}${i === paren + 1 && paren >= 0 ? ")" : ""}`).reduce((s, t, i) => (i ? `${s} ${ops[i - 1]} ${t}` : t), "");

/** 가장 먼저 계산할 부분의 번호(괄호 → 첫 곱셈·나눗셈 → 첫 연산) */
export const firstPart = (ops: Op[], paren: number) => (paren >= 0 ? paren : Math.max(0, ops.findIndex((o) => o === "×" || o === "÷")));

const mcFirst = easy("a5-mc-first", (rand) => {
  for (let t = 0; t < 400; t++) {
    const ops = Array.from({ length: 4 }, () => pick(rand, ["+", "−", "×", "÷"] as Op[]));
    const nums = Array.from({ length: 5 }, () => randInt(rand, 2, 30));
    ops.forEach((o, i) => {
      if (o === "÷") nums[i + 1] = randInt(rand, 2, 9);
      if (o === "×") nums[i + 1] = randInt(rand, 2, 9);
    });
    const usesParen = rand() < 0.4;
    const paren = usesParen ? randInt(rand, 0, 3) : -1;
    if (paren >= 0 && (ops[paren] === "×" || ops[paren] === "÷")) continue;
    if (paren < 0 && !ops.some((o) => o === "×" || o === "÷")) continue;
    if (!ops.some((o) => o === "+" || o === "−")) continue;
    const v = evalExpr(nums, ops, paren);
    if (v === null || v > 300) continue;
    const parts = ops.map((o, i) => `${nums[i]} ${o} ${nums[i + 1]}`);
    if (new Set(parts).size !== 4) continue;
    const f = firstPart(ops, paren);
    return {
      key: `${exprText(nums, ops, paren)}`,
      prompt: "다음 식에서 가장 먼저 계산해야 하는 부분을 고르세요.",
      expression: exprText(nums, ops, paren),
      choices: shuffle(rand, parts),
      answer: parts[f],
      hint: "( ) 안을 가장 먼저 계산하고, 곱셈과 나눗셈을 덧셈과 뺄셈보다 먼저 계산해요. 같은 순서끼리는 앞에서부터 계산해요.",
      explanation: `${paren >= 0 ? "( ) 안의" : "곱셈과 나눗셈 중 앞에 있는"} ${parts[f]} 부분을 가장 먼저 계산해요. (끝까지 계산한 값: ${v})`,
    };
  }
  return null;
});

const mcSign = mid("a5-mc-sign", (rand) => {
  const all: Op[] = ["+", "−", "×", "÷"];
  const op = pick(rand, all);
  const b = randInt(rand, 2, 9);
  const a = op === "÷" ? b * randInt(rand, 2, 9) : randInt(rand, 10, 40);
  const o2 = pick(rand, ["+", "−"] as Op[]);
  const o3 = pick(rand, ["×", "÷"] as Op[]);
  const d = randInt(rand, 2, 6);
  const c = o3 === "÷" ? d * randInt(rand, 2, 9) : randInt(rand, 2, 12);
  const vals = all.map((o) => evalExpr([a, b, c, d], [o, o2, o3]));
  const r = vals[all.indexOf(op)];
  if (r === null || r > 400) return null;
  if (vals.filter((v) => v === r).length !== 1) return null;
  return {
    key: `${a}${op}${b}${o2}${c}${o3}${d}`,
    prompt: "□ 안에 알맞은 기호를 고르세요.",
    expression: `${a} □ ${b} ${o2} ${c} ${o3} ${d} = ${r}`,
    choices: [...all],
    answer: op,
    hint: "기호를 하나씩 넣어 계산 순서에 맞게 계산해 보세요. 곱셈과 나눗셈을 먼저 계산해요.",
    explanation: `${exprText([a, b, c, d], [op, o2, o3])} = ${r} → □ 안에 알맞은 기호: ${op}`,
  };
});

const mcReverse = word("a5-mc-reverse", (rand) => {
  const x = randInt(rand, 2, 20);
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, 1, 30);
  const s = a * x + b;
  const cs = [2, 3, 4, 5, 6, 7, 8, 9].filter((c) => s % c === 0);
  if (!cs.length) return null;
  const c = pick(rand, cs);
  const d = s / c;
  const wrong = (d * c + b) % a === 0 ? (d * c + b) / a : null;
  return {
    key: `${x}:${a}:${b}:${c}`,
    prompt: `어떤 수에 ${jq(a, "을/를")} 곱하고 ${jq(b, "을/를")} 더한 뒤 ${jq(c, "으로/로")} 나누었더니 ${jq(d, "이/가")} 되었습니다. 어떤 수는 얼마인가요?`,
    answer: x,
    hint: "어떤 수를 □라 하고 식으로 나타낸 뒤, 거꾸로 생각해요. 나누기는 곱하기로, 더하기는 빼기로 되돌려요.",
    explanation: `(□ × ${a} + ${b}) ÷ ${c} = ${d} → □ × ${a} + ${b} = ${d} × ${c} = ${s}, □ × ${a} = ${s} − ${b} = ${s - b}, □ = ${s - b} ÷ ${a} = ${x}`,
    mistakes: wrong !== null && wrong !== x ? { [wrong]: "되돌릴 때 더한 수는 빼야 해요." } : {},
  };
});

/* ════════ 5-1 약수와 배수 ════════ */

const fcHidden = easy("a5-fc-hidden", (rand) => {
  const n = randInt(rand, 12, 60);
  const ds = divisors(n);
  if (ds.length < 5) return null;
  const i = randInt(rand, 1, ds.length - 2);
  const shown = ds.map((d, j) => (j === i ? "□" : String(d))).join(", ");
  return {
    key: `${n}:${i}`,
    prompt: `${n}의 약수를 작은 수부터 차례로 모두 쓴 것입니다. □ 안에 알맞은 수를 구하세요.`,
    expression: shown,
    answer: ds[i],
    hint: `${jq(n, "을/를")} 나누어떨어지게 하는 수를 1부터 차례로 찾아보세요.`,
    explanation: `${n}의 약수: ${ds.join(", ")}`,
  };
});

const fcLcmOver = mid("a5-fc-lcm-over", (rand) => {
  const a = randInt(rand, 2, 12);
  const b = randInt(rand, 2, 12);
  if (a >= b || b % a === 0) return null;
  const l = lcm(a, b);
  if (l > 60) return null;
  const t = randInt(rand, 50, 200);
  const ans = (Math.floor(t / l) + 1) * l;
  return {
    key: `${a}:${b}:${t}`,
    prompt: `${jq(a, "과/와")} ${b}의 공배수 중에서 ${t}보다 큰 수 중 가장 작은 수를 구하세요.`,
    answer: ans,
    hint: "두 수의 공배수는 최소공배수의 배수예요.",
    explanation: `${jq(a, "과/와")} ${b}의 최소공배수는 ${l} → 공배수는 ${l}의 배수: …, ${ans - l}, ${ans}, … → ${t}보다 큰 가장 작은 수는 ${ans}`,
    mistakes: { [ans - l]: `${t}보다 커야 해요.`, [a * b * (Math.floor(t / (a * b)) + 1)]: "최소공배수를 먼저 구하세요." },
  };
});

const fcSquares = word("a5-fc-squares", (rand) => {
  const g = randInt(rand, 3, 12);
  const p = randInt(rand, 2, 8);
  const q = randInt(rand, 2, 8);
  if (p === q || gcd(p, q) !== 1 || p * q > 40) return null;
  const [a, b] = [g * p, g * q];
  if (a > 96 || b > 96) return null;
  return {
    key: `${a}:${b}`,
    prompt: `가로 ${a} cm, 세로 ${b} cm인 직사각형 모양 종이를 남는 부분 없이 똑같은 크기의 정사각형 여러 장으로 자르려고 합니다. 정사각형을 가장 크게 자르면 정사각형은 모두 몇 장이 되나요?`,
    answer: p * q,
    unit: "장",
    hint: "가장 큰 정사각형의 한 변은 가로와 세로의 최대공약수예요.",
    explanation: `${jq(a, "과/와")} ${b}의 최대공약수: ${g} → 정사각형의 한 변은 ${g} cm, 가로로 ${a} ÷ ${g} = ${p}(장), 세로로 ${b} ÷ ${g} = ${q}(장) → ${p} × ${q} = ${p * q}(장)`,
    mistakes: { [p + q]: "가로와 세로로 자른 장수를 곱해야 해요." },
  };
});

/* ════════ 5-1 규칙과 대응 ════════ */

const THINGS = [
  { name: "세발자전거", unit: "대", what: "바퀴", per: 3 },
  { name: "오리", unit: "마리", what: "다리", per: 2 },
  { name: "문어", unit: "마리", what: "다리", per: 8 },
  { name: "의자", unit: "개", what: "다리", per: 4 },
  { name: "삼각형", unit: "개", what: "꼭짓점", per: 3 },
  { name: "오각형", unit: "개", what: "변", per: 5 },
];
const crLegs = easy("a5-cr-legs", (rand) => {
  const t = pick(rand, THINGS);
  const n = randInt(rand, 5, 30);
  return {
    key: `${t.name}:${n}`,
    prompt: `${t.name} 한 ${t.unit}에 ${jq(t.what, "이/가")} ${t.per}개 있습니다. ${t.name} 수를 ○, ${t.what} 수를 △라고 할 때, ○가 ${n}이면 △는 얼마인가요?`,
    answer: n * t.per,
    hint: `${t.what} 수는 ${t.name} 수의 ${t.per}배예요. △ = ○ × ${t.per}`,
    explanation: `△ = ○ × ${t.per}이므로 ${n} × ${t.per} = ${n * t.per}`,
    mistakes: { [n + t.per]: "곱해야 해요." },
  };
});

export const CR_FORMS = {
  mul: { rule: (o: number, k: number) => o * k, right: ["△ = ○ × k", "○ = △ ÷ k", "△ ÷ ○ = k"], wrong: ["○ = △ × k", "△ = ○ + k", "○ ÷ △ = k"] },
  add: { rule: (o: number, k: number) => o + k, right: ["△ = ○ + k", "○ = △ − k", "△ − ○ = k"], wrong: ["○ = △ + k", "△ = ○ × k", "○ − △ = k"] },
} as const;
const crWrongExpr = mid("a5-cr-wrong-expr", (rand) => {
  const form = pick(rand, ["mul", "add"] as const);
  const f = CR_FORMS[form];
  const k = randInt(rand, 2, 9);
  const start = randInt(rand, 1, 6);
  const os = [0, 1, 2, 3].map((i) => start + i);
  const w = pick(rand, [...f.wrong]);
  const fill = (s: string) => s.replace("k", String(k));
  return {
    key: `${form}:${k}:${start}:${w}`,
    prompt: "표를 보고 ○와 △ 사이의 대응 관계를 나타낸 식으로 옳지 않은 것을 고르세요.",
    visual: { kind: "table", header: ["○", ...os.map(String)], rows: [["△", ...os.map((o) => String(f.rule(o, k)))]] },
    choices: shuffle(rand, [...f.right.map(fill), fill(w)]),
    answer: fill(w),
    hint: "표의 수를 식에 넣어 맞는지 확인해 보세요.",
    explanation: `${form === "mul" ? `△는 항상 ○의 ${k}배예요.` : `△는 항상 ○보다 ${k} 큰 수예요.`} 맞는 식: ${fill(f.right[0])}, ${fill(f.right[1])}, ${fill(f.right[2])} / 맞지 않는 식: ${fill(w)}`,
  };
});

const crPins = word("a5-cr-pins", (rand) => {
  const n = randInt(rand, 5, 40);
  const m = 2 * n + 2;
  return {
    key: `${n}`,
    prompt: `게시판에 사진을 한 줄로 이어 붙이려고 합니다. 사진의 네 귀퉁이에 누름 못을 꽂는데, 옆 사진과 겹치는 귀퉁이 두 곳은 누름 못을 함께 씁니다. 사진이 1장이면 누름 못이 4개, 2장이면 6개 필요합니다. 누름 못 ${m}개를 모두 써서 사진을 붙이면 사진은 몇 장인가요?`,
    answer: n,
    unit: "장",
    hint: "사진 수를 ○, 누름 못 수를 △라 하고 대응 관계를 식으로 나타내 보세요.",
    explanation: `사진이 1장 늘 때마다 누름 못은 2개씩 늘어나므로 △ = ○ × 2 + 2, ${m} = ○ × 2 + 2 → ○ × 2 = ${m} − 2 = ${m - 2}, ○ = ${m - 2} ÷ 2 = ${n}(장)`,
    mistakes: { [m / 2]: "처음 사진의 못 2개를 먼저 빼야 해요.", [m / 4]: "겹치는 귀퉁이는 못을 함께 써요." },
  };
});

/* ════════ 5-1 약분과 통분 ════════ */

const properFrac = (rand: () => number, dMin = 2, dMax = 9): [number, number] => {
  for (;;) {
    const d = randInt(rand, dMin, dMax);
    const n = randInt(rand, 1, d - 1);
    if (gcd(n, d) === 1) return [n, d];
  }
};

const rcCommonProd = easy("a5-rc-common-prod", (rand) => {
  const [a, b] = properFrac(rand);
  const [c, d] = properFrac(rand);
  if (b === d) return null;
  const which = rand() < 0.5 ? 0 : 1;
  const [x, y] = which ? [c, d] : [a, b];
  const den = b * d;
  return {
    key: `${a}/${b}:${c}/${d}:${which}`,
    prompt: `${jq(`${a}/${b}`, "과/와")} ${jq(`${c}/${d}`, "을/를")} 두 분모의 곱을 공통분모로 하여 통분하려고 합니다. □ 안에 알맞은 수를 구하세요.`,
    expression: `${x}/${y} = □/${den}`,
    answer: (x * den) / y,
    hint: "분모에 곱한 수를 분자에도 똑같이 곱해요.",
    explanation: `공통분모는 ${b} × ${d} = ${den}, ${x}/${y} = ${x} × ${den / y}/${y} × ${den / y} = ${(x * den) / y}/${den}`.replace(/= (\d+) × (\d+)\/(\d+) × (\d+) =/, "= ($1 × $2)/($3 × $4) ="),
    mistakes: { [x]: "분자에도 같은 수를 곱해야 해요." },
  };
});

const rcReduceWays = mid("a5-rc-reduce-ways", (rand) => {
  const k = pick(rand, [2, 3, 5]);
  const d = k * randInt(rand, 3, 12);
  if (d > 60) return null;
  const ks = Array.from({ length: d - 1 }, (_, i) => i + 1).filter((n) => n % k === 0);
  return {
    key: `${d}:${k}`,
    prompt: `분모가 ${d}인 진분수 중에서 분모와 분자를 ${jq(k, "으로/로")} 나누어 약분할 수 있는 분수는 모두 몇 개인가요?`,
    answer: ks.length,
    unit: "개",
    hint: `분모 ${jq(d, "은/는")} ${k}의 배수예요. 분자도 ${k}의 배수이면 ${jq(k, "으로/로")} 약분할 수 있어요.`,
    explanation: `분자가 될 수 있는 수는 1부터 ${d - 1}까지이고, 그중 ${k}의 배수: ${ks.join(", ")} → ${ks.length}개`,
    mistakes: { [d / k]: `분자는 ${d}보다 작아야 해요.` },
  };
});

const rcDecSum = word("a5-rc-dec-sum", (rand) => {
  const two = rand() < 0.7;
  const n = two ? randInt(rand, 1, 99) : randInt(rand, 1, 9);
  const base = two ? 100 : 10;
  if (two && n % 10 === 0) return null;
  const g = gcd(n, base);
  if (g === 1) return null;
  const [p, q] = [n / g, base / g];
  const shown = two ? `0.${String(n).padStart(2, "0")}` : `0.${n}`;
  return {
    key: shown,
    prompt: `${jq(shown, "을/를")} 기약분수로 나타내었을 때, 분모와 분자의 합은 얼마인가요?`,
    answer: p + q,
    hint: `소수 ${two ? "두" : "한"} 자리 수는 분모가 ${base}인 분수로 나타낸 뒤 약분해요.`,
    explanation: `${shown} = ${n}/${base} = ${p}/${q} → ${q} + ${p} = ${p + q}`,
    mistakes: { [n + base]: "기약분수로 약분해야 해요." },
  };
});

/* ════════ 5-1 분수의 덧셈과 뺄셈 ════════ */

const faCommonNum = easy("a5-fa-common-num", (rand) => {
  const [a, b] = properFrac(rand);
  const [c, d] = properFrac(rand);
  if (b === d || b % d === 0 || d % b === 0) return null;
  const l = lcm(b, d);
  if (l > 36) return null;
  const [x, y] = [(a * l) / b, (c * l) / d];
  return {
    key: `${a}/${b}+${c}/${d}`,
    prompt: `${jq(`${a}/${b}`, "과/와")} ${jq(`${c}/${d}`, "을/를")} 두 분모의 최소공배수를 공통분모로 하여 통분했습니다. 통분한 두 분수의 분자의 합은 얼마인가요?`,
    answer: x + y,
    hint: "두 분모의 최소공배수를 구하고, 분모에 곱한 수를 분자에도 똑같이 곱해요.",
    explanation: `${jq(b, "과/와")} ${d}의 최소공배수: ${l} → 분자는 ${a} × ${l / b} = ${x}, ${c} × ${l / d} = ${y} → ${x} + ${y} = ${x + y}`,
    mistakes: { [a + c]: "통분하면 분자도 바뀌어요.", [a * d + c * b]: "최소공배수를 공통분모로 해야 해요." },
  };
});

const faMaxMin = mid("a5-fa-max-min", (rand) => {
  const fs = [properFrac(rand, 2, 9), properFrac(rand, 2, 9), properFrac(rand, 2, 9)];
  const vals = fs.map(([n, d]) => n / d);
  if (new Set(vals).size !== 3 || new Set(fs.map((f) => f[1])).size < 2) return null;
  const order = [0, 1, 2].sort((i, j) => vals[j] - vals[i]);
  const [mx, md, mn] = order.map((i) => fs[i]);
  const sum = (x: [number, number], y: [number, number]) => fracText(x[0] * y[1] + y[0] * x[1], x[1] * y[1]);
  if (lcm(mx[1], mn[1]) > 36) return null;
  const ans = sum(mx, mn);
  const diff = fracText(mx[0] * mn[1] - mn[0] * mx[1], mx[1] * mn[1]);
  const choices = makeChoices(rand, ans, [sum(mx, md), sum(md, mn), diff], () => fracText(randInt(rand, 2, 30), randInt(rand, 3, 18)));
  if (choices.length !== 4) return null;
  const shown = fs.map(([n, d]) => `${n}/${d}`);
  return {
    key: shown.join(","),
    prompt: `${shown.join(", ")} 중에서 가장 큰 수와 가장 작은 수의 합을 기약분수로 나타낸 것을 고르세요.`,
    choices,
    answer: ans,
    hint: "통분하여 크기를 비교한 뒤 가장 큰 수와 가장 작은 수를 더해요.",
    explanation: `가장 큰 수 ${mx[0]}/${mx[1]}, 가장 작은 수 ${mn[0]}/${mn[1]} → ${mx[0]}/${mx[1]} + ${mn[0]}/${mn[1]} = ${ans}`,
  };
});

const fsOverflow = word("a5-fs-overflow", (rand) => {
  const cap = randInt(rand, 2, 5);
  const [a, b] = properFrac(rand, 2, 8);
  const [c, d] = properFrac(rand, 2, 8);
  if (b === d || lcm(b, d) > 24) return null;
  const w1 = randInt(rand, 1, cap - 1);
  const w2 = randInt(rand, 1, cap);
  const l = lcm(b, d);
  const total = (w1 + w2) * l + (a * l) / b + (c * l) / d;
  const over = total - cap * l;
  if (over <= 0 || over >= l * 2) return null;
  const have = `${w1} ${a}/${b}`;
  const pour = `${w2} ${c}/${d}`;
  const ans = fracText(over, l);
  const choices = makeChoices(rand, ans, [fracText(total, l), fracText(cap * l - (w1 * l + (a * l) / b), l), fracText(over + 1, l)], () => fracText(randInt(rand, 1, 2 * l), l));
  if (choices.length !== 4) return null;
  return {
    key: `${cap}:${have}:${pour}`,
    prompt: `들이가 ${cap} L인 물통에 물이 ${have} L 들어 있습니다. 이 물통에 물을 ${pour} L 더 부으면 넘치는 물은 몇 L인가요?`,
    choices: choices.map((x) => `${x} L`),
    answer: `${ans} L`,
    hint: "먼저 물을 모두 합한 양을 구하고, 물통의 들이를 빼요.",
    explanation: `${have} + ${pour} = ${fracText(total, l)}(L), ${fracText(total, l)} − ${cap} = ${ans}(L)`,
  };
});

/* ════════ 5-1 다각형의 둘레와 넓이 ════════ */

const POLY_NAME: Record<number, string> = { 3: "정삼각형", 5: "정오각형", 6: "정육각형", 8: "정팔각형" };

function regularScene(n: number, text: string, label: string): ShapeScene {
  const pts = regularPolygon(n, n === 3 ? 62 : 56, [0, 0], n % 2 ? 90 : 90 + 180 / n);
  const bottom = pts.reduce((best, p, i) => (p[1] + pts[(i + 1) % n][1] > best.y ? { i, y: p[1] + pts[(i + 1) % n][1] } : best), { i: 0, y: -Infinity }).i;
  return fit({ label, polygons: [{ points: pts }], texts: [lengthText(pts[bottom], pts[(bottom + 1) % n], pts, text)] });
}

const paRegSide = easy("a5-pa-reg-side", guard((rand) => {
  const n = pick(rand, [3, 5, 6, 8]);
  const s = randInt(rand, 3, 15);
  return {
    key: `${n}:${s}`,
    prompt: `둘레가 ${n * s} cm인 ${POLY_NAME[n]}입니다. □ 안에 알맞은 수를 구하세요.`,
    visual: regularScene(n, "□ cm", `한 변의 길이를 □로 나타낸 ${POLY_NAME[n]}`),
    answer: s,
    unit: "cm",
    hint: `${POLY_NAME[n]}의 변은 ${n}개이고 길이가 모두 같아요. (한 변) = (둘레) ÷ (변의 수)`,
    explanation: `${n * s} ÷ ${n} = ${s}(cm)`,
    mistakes: { [(n * s) / 4]: "변의 수를 다시 세어 보세요." },
  };
}));

const paFrame = mid("a5-pa-frame", guard((rand) => {
  const W = randInt(rand, 10, 20);
  const H = randInt(rand, 8, 15);
  const w = randInt(rand, 4, W - 3);
  const h = randInt(rand, 3, H - 3);
  if (W === H || w === h) return null;
  const k = Math.min(12, 200 / W, 140 / H);
  const outer = toScreen([[0, H], [0, 0], [W, 0], [W, H]], k);
  const ox = (W - w) / 2;
  const oy = (H - h) / 2;
  const inner = toScreen([[ox, oy + h], [ox, oy], [ox + w, oy], [ox + w, oy + h]], k);
  if ((inner[2][0] - inner[1][0]) < 70 || (inner[1][1] - inner[0][1]) < 50) return null;
  const texts: Texts = [
    lengthText(outer[1], outer[2], outer, `${W} cm`),
    lengthText(outer[0], outer[1], outer, `${H} cm`),
    { at: rp([(inner[0][0] + inner[3][0]) / 2, inner[0][1] + 14]), text: `${w} cm` },
    { at: rp([inner[0][0] + 26, (inner[0][1] + inner[1][1]) / 2 + 6]), text: `${h} cm` },
  ];
  return {
    key: `${W}:${H}:${w}:${h}`,
    prompt: "직사각형 안에 작은 직사각형을 그리고, 작은 직사각형의 바깥쪽을 색칠했습니다. 색칠한 부분의 넓이는 몇 cm²인가요?",
    visual: fit({ label: "큰 직사각형 안에 작은 직사각형이 있고 그 바깥쪽이 색칠된 그림, 두 직사각형의 가로와 세로가 적혀 있음", polygons: [{ points: outer, fill: true }, { points: inner, fill: "paper" }], texts }),
    answer: W * H - w * h,
    unit: "cm²",
    hint: "(큰 직사각형의 넓이) − (작은 직사각형의 넓이)",
    explanation: `${W} × ${H} − ${w} × ${h} = ${W * H} − ${w * h} = ${W * H - w * h}(cm²)`,
    mistakes: { [W * H]: "작은 직사각형의 넓이를 빼야 해요.", [(W - w) * (H - h)]: "넓이끼리 빼야 해요." },
  };
}));

const paTrapTri = word("a5-pa-trap-tri", (rand) => {
  const a = randInt(rand, 3, 12);
  const b = randInt(rand, a + 2, 20);
  const h = randInt(rand, 3, 14);
  if (((a + b) * h) % 2) return null;
  const S = ((a + b) * h) / 2;
  const cs = Array.from({ length: 24 }, (_, i) => i + 4).filter((c) => (2 * S) % c === 0 && c !== a && c !== b && c !== h && (2 * S) / c <= 40 && (2 * S) / c !== h);
  if (!cs.length) return null;
  const c = pick(rand, cs);
  return {
    key: `${a}:${b}:${h}:${c}`,
    prompt: `윗변이 ${a} cm, 아랫변이 ${b} cm, 높이가 ${h} cm인 사다리꼴과 넓이가 같은 삼각형이 있습니다. 이 삼각형의 밑변이 ${c} cm일 때, 높이는 몇 cm인가요?`,
    answer: (2 * S) / c,
    unit: "cm",
    hint: "먼저 사다리꼴의 넓이를 구하고, (삼각형의 넓이) = (밑변) × (높이) ÷ 2를 거꾸로 써요.",
    explanation: `사다리꼴의 넓이: (${a} + ${b}) × ${h} ÷ 2 = ${S}(cm²), 삼각형의 높이: ${S} × 2 ÷ ${c} = ${(2 * S) / c}(cm)`,
    mistakes: S % c === 0 ? { [S / c]: "삼각형의 넓이는 (밑변) × (높이) ÷ 2예요." } : {},
  };
});

/* ════════ 5-2 수의 범위와 어림하기 ════════ */

const rrPick = easy("a5-rr-pick", (rand) => {
  const a = randInt(rand, 10, 80);
  const b = a + randInt(rand, 3, 8);
  const x = randInt(rand, a, b - 1);
  const out = [a - 1, b, rand() < 0.5 ? b + randInt(rand, 1, 5) : a - randInt(rand, 2, 6)];
  return {
    key: `${a}:${b}:${x}:${out[2]}`,
    prompt: `${a} 이상 ${b} 미만인 수를 고르세요.`,
    choices: shuffle(rand, [x, ...out].map(String)),
    answer: String(x),
    hint: `'이상'은 그 수를 포함하고, '미만'은 그 수를 포함하지 않아요.`,
    explanation: `${a} 이상 ${b} 미만인 수는 ${a}부터 ${b - 1}까지의 수예요. → ${x}`,
  };
});

const rrCeilMin = mid("a5-rr-ceil-min", (rand) => {
  const hundred = rand() < 0.5;
  const unit = hundred ? 100 : 10;
  const x = hundred ? randInt(rand, 2, 99) : randInt(rand, 2, 99);
  const shown = x * unit;
  const ans = (x - 1) * unit + 1;
  return {
    key: `${unit}:${x}`,
    prompt: `어떤 자연수를 올림하여 ${hundred ? "백" : "십"}의 자리까지 나타내었더니 ${jq(shown, "이/가")} 되었습니다. 어떤 자연수가 될 수 있는 수 중에서 가장 작은 수를 구하세요.`,
    answer: ans,
    hint: `올림하면 ${hundred ? "백" : "십"}의 자리 아래 수가 0이 아닐 때 ${hundred ? "백" : "십"}의 자리 수가 1 커져요.`,
    explanation: `올림하여 ${jq(shown, "이/가")} 되는 수는 ${ans - 1} 초과 ${shown} 이하인 수예요. 그중 가장 작은 자연수는 ${ans}`,
    mistakes: { [shown - unit]: "그 수를 올림하면 그대로예요.", [shown - unit / 2]: "반올림과 헷갈렸어요." },
  };
});

const rrElevator = word("a5-rr-elevator", (rand) => {
  const W = randInt(rand, 8, 20) * 50;
  const b = randInt(rand, 6, 30) * 5;
  const a = randInt(rand, 35, 60);
  const r = (W - b) % a;
  if (r === 0) return null;
  const n = Math.floor((W - b) / a);
  return {
    key: `${W}:${b}:${a}`,
    prompt: `최대 ${W} kg까지 실을 수 있는 엘리베이터에 무게가 ${b} kg인 짐을 먼저 실었습니다. 몸무게가 모두 ${a} kg인 사람들이 이 엘리베이터에 탄다면 최대 몇 명까지 탈 수 있나요?`,
    answer: n,
    unit: "명",
    hint: "짐을 싣고 남은 무게를 구한 뒤, 한 사람의 몸무게로 나누어 버림해요.",
    explanation: `${W} − ${b} = ${W - b}(kg), ${W - b} ÷ ${a} = ${n} … ${r} → 버림하여 ${n}명`,
    mistakes: { [n + 1]: "올림하면 최대 무게를 넘어요.", [Math.floor(W / a)]: "짐의 무게를 먼저 빼야 해요." },
  };
});

/* ════════ 5-2 분수의 곱셈 ════════ */

const fmNum = easy("a5-fm-num", retry((rand) => {
  const [a, b] = properFrac(rand, 5, 15);
  const n = randInt(rand, 2, 7);
  if (a * n >= b || gcd(a * n, b) !== 1) return null;
  return {
    key: `${a}/${b}x${n}`,
    prompt: "□ 안에 알맞은 수를 구하세요.",
    expression: `${a}/${b} × ${n} = □/${b}`,
    answer: a * n,
    hint: "분모는 그대로 두고 분자와 자연수를 곱해요.",
    explanation: `${a}/${b} × ${n} = (${a} × ${n})/${b} = ${a * n}/${b}`,
    mistakes: { [a + n]: "분자와 자연수를 곱해야 해요." },
  };
}));

const FM_UNITS = [
  { big: "m", small: "cm", r: 100 },
  { big: "kg", small: "g", r: 1000 },
  { big: "L", small: "mL", r: 1000 },
  { big: "시간", small: "분", r: 60 },
];
const fmUnits = mid("a5-fm-units", (rand) => {
  const u = pick(rand, FM_UNITS);
  const [a, b] = properFrac(rand, 2, 12);
  if (a === 1) return null;
  const w = randInt(rand, 1, 3);
  if ((w * u.r) % b) return null;
  const v = (w * u.r * a) / b;
  const big = u.big === "시간" ? `${w}시간` : `${w} ${u.big}`;
  return {
    key: `${u.big}:${w}:${a}/${b}`,
    prompt: `${big}의 ${jq(`${a}/${b}`, "은/는")} 몇 ${u.small}인가요?`,
    answer: v,
    unit: u.small,
    hint: `${jq(big, "을/를")} ${jq(u.small, "으로/로")} 바꾼 뒤 ${jq(`${a}/${b}`, "을/를")} 곱해요.`,
    explanation: `${big} = ${w * u.r}${u.small === "분" ? "분" : ` ${u.small}`}, ${w * u.r} × ${a}/${b} = ${v}(${u.small})`,
    mistakes: { [(w * u.r) / b]: `분자 ${a}도 곱해야 해요.` },
  };
});

const fmBounce = word("a5-fm-bounce", (rand) => {
  const [a, b] = pick(rand, [[1, 2], [2, 3], [3, 4], [2, 5], [3, 5], [4, 5]] as [number, number][]);
  const k = randInt(rand, 2, Math.floor(500 / (b * b)));
  const H = b * b * k;
  if (H < 50) return null;
  const h1 = (H * a) / b;
  const h2 = (h1 * a) / b;
  return {
    key: `${a}/${b}:${H}`,
    prompt: `떨어진 높이의 ${a}/${b}만큼 튀어 오르는 공이 있습니다. 이 공을 ${H} cm 높이에서 떨어뜨렸을 때, 두 번째로 튀어 오른 높이는 몇 cm인가요?`,
    answer: h2,
    unit: "cm",
    hint: "첫 번째로 튀어 오른 높이를 먼저 구하고, 그 높이에서 다시 떨어진다고 생각해요.",
    explanation: `첫 번째: ${H} × ${a}/${b} = ${h1}(cm), 두 번째: ${h1} × ${a}/${b} = ${h2}(cm)`,
    mistakes: { [h1]: "두 번째로 튀어 오른 높이를 구해야 해요." },
  };
});

/* ════════ 5-2 합동과 대칭: 직선 ㄱㄷ을 대칭축으로 하는 선대칭도형(연 모양 사각형) ════════ */

/** 위 T(ㄱ), 왼쪽 L(ㄴ), 아래 B(ㄷ), 오른쪽 R(ㄹ). 수학 좌표: T=(0,p), L=(−w,0), B=(0,−q), R=(w,0) */
function kite(w: number, p: number, q: number, maxW = 170, maxH = 170) {
  const k = Math.min(maxW / (2 * w), maxH / (p + q));
  const [T, L, B, R, M] = toScreen([[0, p], [-w, 0], [0, -q], [w, 0], [0, 0]], k);
  const poly = [T, L, B, R];
  return { T, L, B, R, M, poly, names: vertexTexts(poly, ["ㄱ", "ㄴ", "ㄷ", "ㄹ"]) };
}

const cgKiteHalf = easy("a5-cg-kite-half", guard((rand) => {
  const a = randInt(rand, 3, 12);
  const p = randInt(rand, 3, 10);
  const q = randInt(rand, p + 2, 18);
  const K = kite(a, p, q);
  const lines: Lines = [{ from: K.T, to: K.B, dashed: true, width: 1.5 }, { from: K.L, to: K.R }, ...rightMark(K.M, K.R, K.T)];
  return {
    key: `${a}:${p}:${q}`,
    prompt: "직선 ㄱㄷ을 대칭축으로 하는 선대칭도형입니다. 선분 ㄴㄹ은 몇 cm인가요?",
    visual: fit({ label: "점선 ㄱㄷ을 대칭축으로 하는 사각형 ㄱㄴㄷㄹ, 선분 ㄴㄹ이 대칭축과 점 ㅁ에서 수직으로 만나고 선분 ㄴㅁ의 길이가 적혀 있음", polygons: [{ points: K.poly }], lines, texts: [...K.names, { at: rp(add(K.M, [10, 13])), text: "ㅁ" }, segText(K.L, K.M, `${a} cm`, -1)] }),
    answer: 2 * a,
    unit: "cm",
    hint: "대칭축은 대응점끼리 이은 선분을 둘로 똑같이 나누어요.",
    explanation: `선분 ㄹㅁ = 선분 ㄴㅁ = ${a} cm이므로 선분 ㄴㄹ = ${a} × 2 = ${2 * a}(cm)`,
    mistakes: { [a]: "선분 ㄴㅁ은 선분 ㄴㄹ의 절반이에요." },
  };
}));

const rad = (d: number) => (d * Math.PI) / 180;
const cgKiteAngle = mid("a5-cg-kite-angle", retry(guard((rand) => {
  const th = randInt(rand, 4, 12) * 5;
  const l = randInt(rand, 14, 26) * 5;
  const bh = 180 - th - l;
  if (bh < 20 || bh > 70 || bh === th) return null;
  const w = 6;
  const K = kite(w, w / Math.tan(rad(th)), w / Math.tan(rad(bh)), 170, 200);
  const top = angleMark(K.T, K.L, K.B, 18, `${th}°`);
  const left = angleMark(K.L, K.T, K.B, 16, `${l}°`);
  return {
    key: `${th}:${l}`,
    prompt: "직선 ㄱㄷ을 대칭축으로 하는 선대칭도형입니다. 각 ㄴㄷㄹ은 몇 도인가요?",
    visual: fit({ label: `점선 ㄱㄷ을 대칭축으로 하는 사각형 ㄱㄴㄷㄹ, 각 ㄴㄱㄷ은 ${th}°, 각 ㄱㄴㄷ은 ${l}°`, polygons: [{ points: K.poly }], lines: [{ from: K.T, to: K.B, dashed: true, width: 1.5 }], arcs: [...top.arcs, ...left.arcs], texts: [...K.names, ...top.texts, ...left.texts] }),
    answer: 2 * bh,
    unit: "°",
    hint: "삼각형 ㄱㄴㄷ의 세 각의 합은 180°예요. 선대칭도형에서 대응각의 크기는 같아요.",
    explanation: `삼각형 ㄱㄴㄷ에서 각 ㄱㄷㄴ = 180° − ${th}° − ${l}° = ${bh}°, 대응각 ㄱㄷㄹ도 ${bh}°이므로 각 ㄴㄷㄹ = ${bh}° × 2 = ${2 * bh}°`,
    mistakes: { [bh]: "각 ㄴㄷㄹ은 각 ㄱㄷㄴ의 2배예요." },
  };
}), 20));

const cgKiteArea = word("a5-cg-kite-area", guard((rand) => {
  const a = randInt(rand, 3, 10);
  const p = randInt(rand, 3, 9);
  const q = randInt(rand, p + 2, 16);
  const K = kite(a, p, q);
  const lines: Lines = [{ from: K.T, to: K.B, dashed: true, width: 1.5 }, { from: K.L, to: K.R }, ...rightMark(K.M, K.R, K.T)];
  const area = a * (p + q);
  return {
    key: `${a}:${p}:${q}`,
    prompt: "직선 ㄱㄷ을 대칭축으로 하는 선대칭도형입니다. 사각형 ㄱㄴㄷㄹ의 넓이는 몇 cm²인가요?",
    visual: fit({
      label: "점선 ㄱㄷ을 대칭축으로 하는 사각형 ㄱㄴㄷㄹ, 선분 ㄴㄹ이 대칭축과 점 ㅁ에서 수직으로 만나고 선분 ㄴㅁ, ㄱㅁ, ㅁㄷ의 길이가 적혀 있음",
      polygons: [{ points: K.poly }],
      lines,
      texts: [...K.names, { at: rp(add(K.M, [-10, -12])), text: "ㅁ" }, segText(K.L, K.M, `${a} cm`, -1), segText(K.T, K.M, `${p} cm`, -1), segText(K.M, K.B, `${q} cm`, -1)],
    }),
    answer: area,
    unit: "cm²",
    hint: "선분 ㄴㄹ의 길이를 먼저 구하고, 선분 ㄴㄹ을 밑변으로 하는 삼각형 두 개로 나누어 넓이를 구해요.",
    explanation: `선분 ㄴㄹ = ${a} × 2 = ${2 * a}(cm), 삼각형 ㄱㄴㄹ: ${2 * a} × ${p} ÷ 2 = ${a * p}(cm²), 삼각형 ㄴㄷㄹ: ${2 * a} × ${q} ÷ 2 = ${a * q}(cm²) → ${a * p} + ${a * q} = ${area}(cm²)`,
    mistakes: { [(a * (p + q)) / 2]: "선분 ㄴㄹ은 선분 ㄴㅁ의 2배예요.", [2 * area]: "삼각형의 넓이는 ÷ 2를 해요." },
  };
}));

/* ════════ 5-2 소수의 곱셈 ════════ */

const dmOil = easy("a5-dm-oil", (rand) => {
  const item = pick(rand, ["식용유", "들기름", "참기름"]);
  const t = randInt(rand, 6, 9);
  const n = randInt(rand, 2, 9);
  return {
    key: `${item}:${t}:${n}`,
    prompt: `${item} 1 L의 무게는 0.${t} kg입니다. ${item} ${n} L의 무게는 몇 kg인가요?`,
    answer: dec((t * n) / 10),
    unit: "kg",
    hint: `0.${t} × ${jq(n, "을/를")} 계산해요.`,
    explanation: `0.${t} × ${n} = ${dec((t * n) / 10)}(kg)`,
    mistakes: { [t * n]: "소수점을 빠뜨렸어요." },
  };
});

const dmFloor = mid("a5-dm-floor", (rand) => {
  const x = randInt(rand, 11, 99);
  const y = randInt(rand, 11, 99);
  if (x % 10 === 0 || y % 10 === 0) return null;
  const P = x * y;
  if (P % 100 === 0) return null;
  const ans = Math.floor(P / 100);
  return {
    key: `${x}:${y}`,
    prompt: "□ 안에 들어갈 수 있는 자연수 중에서 가장 큰 수를 구하세요.",
    expression: `${dec(x / 10)} × ${dec(y / 10)} > □`,
    answer: ans,
    hint: "먼저 곱을 구한 뒤, 그보다 작은 자연수 중 가장 큰 수를 찾아요.",
    explanation: `${dec(x / 10)} × ${dec(y / 10)} = ${dec(P / 100)}이므로 ${dec(P / 100)} > □ → 가장 큰 자연수는 ${ans}`,
    mistakes: { [ans + 1]: "곱보다 작은 수여야 해요." },
  };
});

const dmWalk = word("a5-dm-walk", (rand) => {
  const s = randInt(rand, 21, 59);
  if (s % 10 === 0) return null;
  const h = randInt(rand, 1, 3);
  const m = pick(rand, [6, 12, 18, 24, 30, 36, 42, 48, 54]);
  const tenths = h * 10 + m / 6;
  const d = (s * tenths) / 100;
  return {
    key: `${s}:${h}:${m}`,
    prompt: `한 시간에 ${dec(s / 10)} km를 가는 빠르기로 ${h}시간 ${m}분 동안 쉬지 않고 걸었습니다. 걸은 거리는 몇 km인가요?`,
    answer: dec(d),
    unit: "km",
    hint: `${m}분이 몇 시간인지 소수로 나타내 보세요. 6분 = 0.1시간이에요.`,
    explanation: `${m}분 = ${dec(m / 60)}시간이므로 ${h}시간 ${m}분 = ${dec(tenths / 10)}시간, ${dec(s / 10)} × ${dec(tenths / 10)} = ${dec(d)}(km)`,
    mistakes: { [dec((s / 10) * (h + m / 100))]: `${m}분은 0.${m}시간이 아니에요.` },
  };
});

/* ════════ 5-2 직육면체 ════════ */

/** 직육면체 겨냥도(lessons/g5-cuboid의 cuboidSketch와 같은 꼴): 앞면 가로 a × 높이 c, 깊이 b는 45° 방향 절반 */
const FACE_V = { top: [0, 1, 2, 3], front: [1, 5, 6, 2], right: [3, 7, 6, 2] } as const;
function sketch(a: number, b: number, c: number, shade: keyof typeof FACE_V): ShapeScene {
  const d = b * 0.5 * Math.SQRT1_2;
  const k = Math.min(22, 180 / (a + d), 120 / (c + d));
  const dx = d * k;
  const fbl: Pt = [0, (c + d) * k];
  const P: Pt[] = ([[dx, 0], [0, dx], [a * k, dx], [a * k + dx, 0], [dx, c * k], fbl, [a * k, fbl[1]], [a * k + dx, c * k]] as Pt[]).map(rp);
  const edges: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 0], [1, 5], [2, 6], [3, 7], [5, 6], [6, 7]];
  const hidden: [number, number][] = [[0, 4], [4, 5], [4, 7]];
  const lines: Lines = [...edges.map(([i, j]) => ({ from: P[i], to: P[j] })), ...hidden.map(([i, j]) => ({ from: P[i], to: P[j], dashed: true, width: 1.5 }))];
  const la = `${a} cm`;
  const lb = `${b} cm`;
  const lc = `${c} cm`;
  const texts: Texts = [
    { at: rp(add([(P[5][0] + P[6][0]) / 2, P[5][1]], [0, 13])), text: la },
    { at: rp(add([(P[6][0] + P[7][0]) / 2, (P[6][1] + P[7][1]) / 2], [8 + lb.length * 4, 6])), text: lb },
    { at: rp(add([P[1][0], (P[1][1] + P[5][1]) / 2], [-6 - lc.length * 4, 0])), text: lc },
  ];
  return fit({ label: "보이지 않는 모서리를 점선으로 그린 직육면체의 겨냥도, 한 면이 색칠되어 있음", polygons: [{ points: FACE_V[shade].map((i) => P[i]), fill: true }], lines, texts }, 6);
}

const cbFaceArea = easy("a5-cb-face-area", guard((rand) => {
  const a = randInt(rand, 4, 12);
  const b = randInt(rand, 3, 12);
  const c = randInt(rand, 3, 12);
  if (new Set([a, b, c]).size !== 3) return null;
  const shade = pick(rand, ["top", "front", "right"] as const);
  const [x, y] = shade === "top" ? [a, b] : shade === "front" ? [a, c] : [b, c];
  return {
    key: `${a}:${b}:${c}:${shade}`,
    prompt: "직육면체의 겨냥도입니다. 색칠한 면의 넓이는 몇 cm²인가요?",
    visual: sketch(a, b, c, shade),
    answer: x * y,
    unit: "cm²",
    hint: "색칠한 면은 직사각형이에요. 색칠한 면의 네 모서리 중 길이가 적힌 모서리와 같은 길이를 찾아요.",
    explanation: `색칠한 면은 가로 ${x} cm, 세로 ${y} cm인 직사각형 → ${x} × ${y} = ${x * y}(cm²)`,
    mistakes: { [a * b * c]: "면의 넓이는 두 모서리의 길이를 곱해요." },
  };
}));

const cbParMax = mid("a5-cb-par-max", (rand) => {
  const a = randInt(rand, 3, 15);
  const b = randInt(rand, 3, 15);
  const c = randInt(rand, 3, 15);
  const areas = [a * b, b * c, a * c];
  if (new Set([a, b, c]).size !== 3 || new Set(areas).size !== 3) return null;
  const mx = Math.max(...areas);
  return {
    key: `${a}:${b}:${c}`,
    prompt: `가로 ${a} cm, 세로 ${b} cm, 높이 ${c} cm인 직육면체가 있습니다. 서로 평행한 두 면의 넓이의 합 중에서 가장 큰 것은 몇 cm²인가요?`,
    answer: 2 * mx,
    unit: "cm²",
    hint: "직육면체에서 서로 평행한 면은 3쌍이고, 평행한 두 면은 모양과 크기가 같아요.",
    explanation: `평행한 면의 넓이: ${a} × ${b} = ${a * b}, ${b} × ${c} = ${b * c}, ${a} × ${c} = ${a * c} → 가장 큰 ${mx} × 2 = ${2 * mx}(cm²)`,
    mistakes: { [mx]: "평행한 면 두 개의 넓이를 더해야 해요." },
  };
});

const cbNetEdges = word("a5-cb-net-edges", (rand) => {
  const s = randInt(rand, 2, 20);
  return {
    key: `${s}`,
    prompt: `정육면체의 전개도의 둘레가 ${s * 14} cm입니다. 이 정육면체의 모든 모서리의 길이의 합은 몇 cm인가요?`,
    answer: 12 * s,
    unit: "cm",
    hint: "정육면체의 전개도의 둘레는 한 모서리 길이의 몇 배인지 생각해요.",
    explanation: `전개도의 둘레는 한 모서리의 14배이므로 한 모서리는 ${s * 14} ÷ 14 = ${s}(cm), 모서리는 12개 → ${s} × 12 = ${12 * s}(cm)`,
    mistakes: { [s * 14]: "전개도의 둘레와 모서리의 합은 달라요." },
  };
});

/* ════════ 5-2 평균과 가능성 ════════ */

const avOther = easy("a5-av-other", (rand) => {
  const m = randInt(rand, 15, 40);
  const a = randInt(rand, m - 8, m + 8);
  if (a === m) return null;
  const name = pick(rand, ["지우", "서아", "도하", "유나"]);
  return {
    key: `${m}:${a}`,
    prompt: `${name}는 공 던지기를 두 번 했습니다. 첫 번째 기록은 ${a} m이고, 두 기록의 평균은 ${m} m입니다. 두 번째 기록은 몇 m인가요?`,
    answer: 2 * m - a,
    unit: "m",
    hint: "(기록의 합) = (평균) × (횟수)",
    explanation: `두 기록의 합: ${m} × 2 = ${2 * m}(m), 두 번째 기록: ${2 * m} − ${a} = ${2 * m - a}(m)`,
    mistakes: { [m]: "평균과 기록은 달라요." },
  };
});

const avLeave = mid("a5-av-leave", (rand) => {
  const n = randInt(rand, 4, 8);
  const m = randInt(rand, 70, 90);
  const m2 = randInt(rand, m - 6, m + 6);
  const x = n * m - (n - 1) * m2;
  if (m2 === m || x < 50 || x > 100) return null;
  return {
    key: `${n}:${m}:${m2}`,
    prompt: `학생 ${n}명의 수학 점수 평균은 ${m}점입니다. 이 중 한 명이 전학을 가서 나머지 ${n - 1}명의 평균이 ${m2}점이 되었습니다. 전학 간 학생의 점수는 몇 점인가요?`,
    answer: x,
    unit: "점",
    hint: "전학 가기 전과 후의 점수의 합을 각각 구해 보세요.",
    explanation: `${n}명의 합: ${m} × ${n} = ${n * m}(점), ${n - 1}명의 합: ${m2} × ${n - 1} = ${(n - 1) * m2}(점) → ${n * m} − ${(n - 1) * m2} = ${x}(점)`,
    mistakes: { [Math.abs(m - m2)]: "점수의 합끼리 빼야 해요." },
  };
});

const avRest = word("a5-av-rest", (rand) => {
  const D = randInt(rand, 5, 7);
  const k = randInt(rand, 2, D - 2);
  const m = randInt(rand, 15, 40);
  const p = randInt(rand, m - 10, m + 10);
  const rest = D * m - k * p;
  if (p === m || rest % (D - k) !== 0) return null;
  const r = rest / (D - k);
  if (r <= 0 || r === p || r === m) return null;
  const name = pick(rand, ["지우", "서아", "도하", "유나"]);
  return {
    key: `${D}:${k}:${m}:${p}`,
    prompt: `${name}는 ${D}일 동안 하루 평균 ${m}쪽씩 책을 읽었습니다. 처음 ${k}일 동안은 하루 평균 ${p}쪽씩 읽었다면, 나머지 ${D - k}일 동안은 하루 평균 몇 쪽씩 읽었나요?`,
    answer: r,
    unit: "쪽",
    hint: "전체 읽은 쪽수와 처음 며칠 동안 읽은 쪽수를 먼저 구해요.",
    explanation: `전체: ${m} × ${D} = ${D * m}(쪽), 처음 ${k}일: ${p} × ${k} = ${k * p}(쪽), 나머지: ${D * m} − ${k * p} = ${rest}(쪽) → ${rest} ÷ ${D - k} = ${r}(쪽)`,
    mistakes: { [rest]: `${D - k}일 동안의 평균을 구해야 해요.` },
  };
});

/** 5학년 단원마다 새로 더한 생성기(하·중·상 하나씩): 단원 id → 차시 id → 생성기 */
export const addedG5: WordMap = {
  "g5-s1-mixed-calc": { "one-expression": [mcFirst, mcSign, mcReverse] },
  "g5-s1-factors": { divisors: [fcHidden], lcm: [fcLcmOver], gcd: [fcSquares] },
  "g5-s1-correspondence": { life: [crLegs], rule: [crWrongExpr], solve: [crPins] },
  "g5-s1-reduce-common": { common: [rcCommonProd], reduce: [rcReduceWays], "frac-dec": [rcDecSum] },
  "g5-s1-frac-add-sub": { "proper-add": [faCommonNum, faMaxMin], "mixed-sub": [fsOverflow] },
  "g5-s1-perimeter-area": { perimeter: [paRegSide], "rect-area": [paFrame], "rhombus-trapezoid": [paTrapTri] },
  "g5-s2-range-rounding": { range: [rrPick], "up-down": [rrCeilMin], "rounding-use": [rrElevator] },
  "g5-s2-frac-mul": { "frac-whole": [fmNum], "whole-frac": [fmUnits], various: [fmBounce] },
  "g5-s2-congruence": { "line-symmetry": [cgKiteHalf, cgKiteAngle, cgKiteArea] },
  "g5-s2-dec-mul": { "dec-times-whole": [dmOil], "dec-dec": [dmFloor, dmWalk] },
  "g5-s2-cuboid": { sketch: [cbFaceArea], property: [cbParMax], "cube-net": [cbNetEdges] },
  "g5-s2-average": { "mean-use": [avOther, avLeave, avRest] },
};
