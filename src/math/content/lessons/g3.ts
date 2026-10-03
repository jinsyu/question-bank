import { randInt, shuffle } from "../../lib/random";
import { arith, divKit, easy, eul, hard, iga, mid, nameOf, ro, twoNames } from "./g3-kit";

/**
 * 3학년 계산 단원(덧셈과 뺄셈, 나눗셈, 곱셈 — 1·2학기) 차시별 생성기.
 * 계산 범위가 차시마다 달라 arith/divKit 묶음으로 만들고, 차시 고유 유형은 아래에 따로 둔다.
 */

const three = (rand: () => number) => randInt(rand, 100, 999);
const digitsOf = (n: number) => String(n).split("").reverse().map(Number);

/** 받아올림 횟수 */
function carries(a: number, b: number) {
  const [x, y] = [digitsOf(a), digitsOf(b)];
  let c = 0;
  let n = 0;
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    c = (x[i] ?? 0) + (y[i] ?? 0) + c >= 10 ? 1 : 0;
    n += c;
  }
  return n;
}

/** 받아내림 횟수 */
function borrows(a: number, b: number) {
  const [x, y] = [digitsOf(a), digitsOf(b)];
  let c = 0;
  let n = 0;
  for (let i = 0; i < x.length; i++) {
    c = (x[i] ?? 0) - c < (y[i] ?? 0) ? 1 : 0;
    n += c;
  }
  return n;
}

/** (여러 자리 수) × (한 자리 수)에서 올림이 생기는 자리 */
const mulCarry = (a: number, b: number) => digitsOf(a).map((d) => d * b >= 10);

/* ── 3-1 덧셈과 뺄셈 ── */

const pair3 = (rand: () => number): [number, number] => [three(rand), three(rand)];
const ADD_HINT = "일의 자리부터 같은 자리끼리 더하고, 합이 10이거나 10보다 크면 윗자리로 받아올려요.";
const SUB_HINT = "일의 자리부터 같은 자리끼리 빼고, 뺄 수 없으면 윗자리에서 10을 받아내려요.";

export const add0 = arith({ key: "add0", op: "+", sample: pair3, ok: (a, b) => a + b < 1000 && carries(a, b) === 0, hint: ADD_HINT });
export const add1 = arith({ key: "add1", op: "+", sample: pair3, ok: (a, b) => a + b < 1000 && carries(a, b) === 1, hint: ADD_HINT });
export const add2 = arith({ key: "add2", op: "+", sample: pair3, ok: (a, b) => carries(a, b) >= 2, hint: ADD_HINT });
/** 뺄셈: (세 자리 수) − (세 자리 수) 연습이라 차가 한 자리 수(862 − 859 = 3)인 식은 쓰지 않는다 */
export const sub0 = arith({ key: "sub0", op: "-", sample: pair3, ok: (a, b) => a - b >= 10 && borrows(a, b) === 0, hint: SUB_HINT });
export const sub1 = arith({ key: "sub1", op: "-", sample: pair3, ok: (a, b) => a - b >= 10 && borrows(a, b) === 1, hint: SUB_HINT });
export const sub2 = arith({ key: "sub2", op: "-", sample: pair3, ok: (a, b) => a - b >= 10 && borrows(a, b) === 2, hint: SUB_HINT });

/* ── 3-1 곱셈 ── */

const MUL_HINT = "일의 자리부터 곱하고, 곱이 10이거나 10보다 크면 올림한 수를 윗자리 곱에 더해요.";
const twoByOne = (rand: () => number): [number, number] => [randInt(rand, 11, 99), randInt(rand, 2, 9)];

export const mulTens = arith({
  key: "mul10",
  op: "×",
  sample: (rand) => [randInt(rand, 1, 9) * 10, randInt(rand, 2, 9)],
  column: false,
  hint: "(몇) × (몇)을 계산한 뒤 0을 하나 붙여요.",
});
export const mulNoCarry = arith({
  key: "mul-nc",
  op: "×",
  sample: twoByOne,
  ok: (a, b) => mulCarry(a, b).every((c) => !c),
  hint: "일의 자리, 십의 자리 순서로 곱해요.",
});
export const mulCarryTens = arith({
  key: "mul-ct",
  op: "×",
  sample: twoByOne,
  // (몇십) × (몇)은 앞 차시 내용이라 일의 자리가 0이 아닌 수만
  ok: (a, b) => { const [o, t] = mulCarry(a, b); return a % 10 !== 0 && !o && t; },
  hint: MUL_HINT,
});
export const mulCarryOnes = arith({
  key: "mul-co",
  op: "×",
  sample: twoByOne,
  ok: (a, b) => (a % 10) * b >= 10 && Math.floor(a / 10) * b + Math.floor(((a % 10) * b) / 10) < 10,
  hint: MUL_HINT,
});
export const mulCarryBoth = arith({
  key: "mul-cb",
  op: "×",
  sample: twoByOne,
  ok: (a, b) => (a % 10) * b >= 10 && Math.floor(a / 10) * b + Math.floor(((a % 10) * b) / 10) >= 10,
  hint: MUL_HINT,
  cards: [2, 1],
});

/* ── 3-1 나눗셈(곱셈구구 범위) ── */

export const divTable = divKit({
  key: "div-t",
  sample: (rand) => {
    const b = randInt(rand, 2, 9);
    return [b * randInt(rand, 2, 9), b];
  },
  rem: false,
  q: [1, 9],
  digits: 2,
});

export const shareExpr = mid("l3-share-expr", (rand) => {
  const b = randInt(rand, 2, 9);
  const q = randInt(rand, 2, 9);
  const a = b * q;
  const item = shuffle(rand, ["사탕", "구슬", "딱지", "쿠키"])[0];
  const answer = `${a} ÷ ${b}`;
  return {
    key: `${item}:${a}:${b}`,
    prompt: `${item} ${a}개를 ${b}명에게 똑같이 나누어 주려고 합니다. 한 명에게 몇 개씩 줄 수 있는지 구하는 식을 고르세요.`,
    answer,
    choices: shuffle(rand, [answer, `${a} − ${b}`, `${a} × ${b}`, `${a} + ${b}`]),
    hint: "똑같이 나누어 주는 상황은 나눗셈식으로 나타내요.",
    explanation: `${a} ÷ ${b} = ${q}이므로 한 명에게 ${q}개씩 줄 수 있어요.`,
  };
});

export const shareNeed = mid("l3-share-need", (rand) => {
  const b = randInt(rand, 2, 9);
  const q = randInt(rand, 2, 9);
  return {
    key: `${b}:${q}`,
    prompt: `연필을 ${b}명에게 똑같이 나누어 주었더니 한 명이 ${q}자루씩 받고 남은 연필이 없었습니다. 처음에 있던 연필은 몇 자루인가요?`,
    answer: b * q,
    unit: "자루",
    hint: "거꾸로 생각하면 (사람 수) × (한 명이 받은 수)예요.",
    explanation: `${b} × ${q} = ${b * q}(자루)`,
    mistakes: { [b + q]: "사람 수만큼 여러 번 더해야 하므로 곱셈으로 구해요." },
  };
});

export const shareWho = hard("l3-share-who", (rand) => {
  const [b, d] = [randInt(rand, 2, 9), randInt(rand, 2, 9)];
  const [x, y] = [randInt(rand, 2, 9), randInt(rand, 2, 9)];
  if (x === y) return null;
  const [A, B] = twoNames(rand);
  const diff = Math.abs(x - y);
  const W = x > y ? A : B;
  const L = x > y ? B : A;
  const answer = `${W}네 모둠, ${diff}개`;
  return {
    key: `${b}:${x}:${d}:${y}`,
    prompt: `${A}네 모둠은 사탕 ${b * x}개를 ${b}명이, ${B}네 모둠은 사탕 ${d * y}개를 ${d}명이 똑같이 나누어 가졌습니다. 어느 모둠 학생이 한 명당 몇 개 더 많이 가졌나요?`,
    answer,
    choices: shuffle(rand, [answer, `${L}네 모둠, ${diff}개`, `${W}네 모둠, ${diff + 1}개`, `${L}네 모둠, ${diff + 1}개`]),
    hint: "각 모둠에서 한 명이 가진 사탕 수를 나눗셈으로 구해 비교해요.",
    explanation: `${A}네: ${b * x} ÷ ${b} = ${x}, ${B}네: ${d * y} ÷ ${d} = ${y} → ${W}네 모둠이 ${diff}개 더`,
  };
});

export const groupSub = easy("l3-group-sub", (rand) => {
  const b = randInt(rand, 2, 9);
  const q = randInt(rand, 2, 6);
  const a = b * q;
  return {
    key: `${a}:${b}`,
    prompt: "뺄셈식을 나눗셈식으로 나타내려고 합니다. □ 안에 알맞은 수를 써넣으세요.",
    expression: `${a} − ${Array(q).fill(b).join(" − ")} = 0 → ${a} ÷ ${b} = □`,
    answer: q,
    hint: `${eul(b)} 몇 번 빼면 0이 되는지 세어 보세요.`,
    explanation: `${eul(b)} ${q}번 빼면 0이 되므로 ${a} ÷ ${b} = ${q}`,
  };
});

export const groupBox = mid("l3-group-box", (rand) => {
  const b = randInt(rand, 2, 9);
  const q = randInt(rand, 2, 9);
  return {
    key: `${b}:${q}`,
    prompt: `구슬을 한 봉지에 ${b}개씩 담았더니 ${q}봉지가 되고 남은 구슬이 없었습니다. 구슬은 모두 몇 개인가요?`,
    answer: b * q,
    unit: "개",
    hint: "□ ÷ (한 봉지에 담은 수) = (봉지 수)를 거꾸로 생각해요.",
    explanation: `□ ÷ ${b} = ${q} → ${b} × ${q} = ${b * q}(개)`,
  };
});

export const groupTwo = hard("l3-group-two", (rand) => {
  const b = randInt(rand, 2, 5);
  const c = randInt(rand, 2, 4);
  const k = randInt(rand, 2, 5);
  const a = b * c * k;
  if (c * k > 9) return null;
  return {
    key: `${b}:${c}:${k}`,
    prompt: `과자 ${a}개를 한 봉지에 ${b}개씩 담고, 그 봉지를 한 상자에 ${c}봉지씩 넣으려고 합니다. 상자는 몇 개 필요한가요?`,
    answer: k,
    unit: "개",
    hint: "먼저 봉지 수를 구하고, 그 봉지를 상자에 나누어 담아요.",
    explanation: `봉지: ${a} ÷ ${b} = ${a / b}(봉지), 상자: ${a / b} ÷ ${c} = ${k}(개)`,
    mistakes: { [a / b]: "봉지 수를 구한 뒤 상자 수까지 구해야 해요." },
  };
});

export const mulFamily = mid("l3-mul-family", (rand) => {
  const [a, b] = [randInt(rand, 2, 9), randInt(rand, 2, 9)];
  if (a === b) return null;
  const c = a * b;
  const answer = rand() < 0.5 ? `${c} ÷ ${a} = ${b}` : `${c} ÷ ${b} = ${a}`;
  return {
    key: `${a}:${b}:${answer}`,
    prompt: `곱셈식 ${a} × ${b} = ${eul(c)} 나눗셈식으로 바르게 나타낸 것을 고르세요.`,
    answer,
    choices: shuffle(rand, [answer, `${a} ÷ ${b} = ${c}`, `${b} ÷ ${c} = ${a}`, `${c} ÷ ${a} = ${b + 1}`]),
    hint: "곱셈식의 곱이 나눗셈식의 나누어지는 수가 돼요.",
    explanation: `${a} × ${b} = ${c} → ${c} ÷ ${a} = ${b}, ${c} ÷ ${b} = ${a}`,
  };
});

/** 어떤 수 x를 두 가지 수(a, c)로 나누어도 몫이 한 자리 수인 경우들 */
const TWO_DIVISORS = Array.from({ length: 81 }, (_, i) => i + 1).flatMap((x) =>
  [2, 3, 4, 5, 6, 7, 8, 9].flatMap((a) =>
    [2, 3, 4, 5, 6, 7, 8, 9]
      .filter((c) => c !== a && x % a === 0 && x % c === 0 && x / a >= 2 && x / a <= 9 && x / c >= 2 && x / c <= 9)
      .map((c) => [x, a, c] as const),
  ),
);

export const mulDivCond = hard("l3-mul-div-cond", (rand) => {
  const [x, a, c] = TWO_DIVISORS[randInt(rand, 0, TWO_DIVISORS.length - 1)];
  const b = x / a;
  return {
    key: `${a}:${b}:${c}`,
    prompt: `어떤 수를 ${ro(a)} 나누면 몫이 ${b}입니다. 어떤 수를 ${ro(c)} 나누면 몫은 얼마인가요?`,
    answer: x / c,
    hint: "곱셈식으로 어떤 수를 먼저 구해요.",
    explanation: `어떤 수: ${a} × ${b} = ${x}, ${x} ÷ ${c} = ${x / c}`,
    mistakes: { [x]: "어떤 수를 구한 뒤 한 번 더 나누어야 해요." },
  };
});

export const quotientCount = hard("l3-quot-count", (rand) => {
  // 상: 너무 쉬운 몫(4 ÷ 2)은 빼고, 0을 넣는지 헷갈리지 않게 '1부터 9까지'로 범위를 밝힌다
  const b = randInt(rand, 3, 9);
  const q = randInt(rand, 3, 8);
  const right = rand() < 0.5;
  const answer = right ? 9 - q : q - 1;
  return {
    key: `${right}:${b}:${q}`,
    prompt: "1부터 9까지의 수 중에서 □ 안에 들어갈 수 있는 수는 모두 몇 개인가요?",
    expression: right ? `${b * q} ÷ ${b} < □` : `□ < ${b * q} ÷ ${b}`,
    answer,
    unit: "개",
    hint: "먼저 나눗셈의 몫을 구해 보세요.",
    explanation: `${b * q} ÷ ${b} = ${q} → □는 ${right ? (q === 8 ? "9 하나" : `${q + 1}부터 9까지`) : `1부터 ${q - 1}까지`} → ${answer}개`,
    mistakes: { [answer + 1]: `□가 ${q}이면 양쪽이 같아져요.` },
  };
});

export const tableRev = hard("l3-table-rev", (rand) => {
  const a = randInt(rand, 2, 9);
  const m = randInt(rand, 2, 9);
  const b = randInt(rand, 2, 9);
  if (a * m > 81) return null;
  return {
    key: `${a}:${m}:${b}`,
    prompt: `어떤 수를 ${ro(a)} 나눈 몫에 ${eul(b)} 곱했더니 ${iga(m * b)} 되었습니다. 어떤 수는 얼마인가요?`,
    answer: a * m,
    hint: "거꾸로 생각해요: 곱하기는 나누기로, 나누기는 곱하기로.",
    explanation: `몫: ${m * b} ÷ ${b} = ${m}, 어떤 수: ${a} × ${m} = ${a * m}`,
    mistakes: { [m]: "몫을 구한 뒤 어떤 수까지 구해야 해요." },
  };
});

export const tableCond = hard("l3-table-cond", (rand) => {
  const b = randInt(rand, 3, 9);
  const m = randInt(rand, 2, 9);
  const x = b * m;
  const lo = x - randInt(rand, 1, b - 1);
  const hi = x + randInt(rand, 1, b - 1);
  // 첫째 조건만으로는 후보가 3개 이상이어야 둘째 조건이 쓸모 있다
  if (hi - lo - 1 < 3) return null;
  return {
    key: `${b}:${lo}:${hi}`,
    // '나누어떨어진다'는 3-2 나머지 차시에서 정의하는 말이라 곱셈구구로 쓴다
    prompt: `다음 조건을 모두 만족하는 수를 구하세요.\n· ${lo}보다 크고 ${hi}보다 작은 수입니다.\n· ${b}단 곱셈구구의 곱입니다.`,
    answer: x,
    hint: `${b}단 곱셈구구의 곱을 차례로 써 보고, 그중 범위에 들어가는 수를 찾아요.`,
    explanation: `${b} × ${m} = ${x}이고 ${lo} < ${x} < ${hi}`,
    mistakes: { [m]: "조건에 맞는 수 자체를 구해야 해요." },
  };
});

/* ── 3-2 곱셈 ── */

export const mul3NoCarry = arith({
  key: "mul3-nc",
  op: "×",
  sample: (rand) => [three(rand), randInt(rand, 2, 4)],
  ok: (a, b) => mulCarry(a, b).every((c) => !c),
  hint: "일, 십, 백의 자리 순서로 곱해요.",
  cards: [3, 1],
});
export const mul3Carry = arith({
  key: "mul3-c",
  op: "×",
  sample: (rand) => [three(rand), randInt(rand, 2, 9)],
  ok: (a, b) => mulCarry(a, b).some((c) => c) && a * b < 10000,
  hint: MUL_HINT,
  cards: [3, 1],
});
export const mulTensTens = arith({
  key: "mul-tt",
  op: "×",
  sample: (rand) => [rand() < 0.5 ? randInt(rand, 1, 9) * 10 : randInt(rand, 11, 99), randInt(rand, 1, 9) * 10],
  column: false,
  hint: "(몇십몇) × (몇)을 계산한 뒤 0을 하나 붙여요.",
});
export const mulOneTwo = arith({
  key: "mul-12",
  op: "×",
  sample: (rand) => [randInt(rand, 2, 9), randInt(rand, 11, 99)],
  ok: (a, b) => b % 10 !== 0,
  column: false,
  hint: "(몇) × (몇십몇)은 (몇십몇) × (몇)과 곱이 같아요. 일의 자리와 십의 자리로 나누어 곱해요.",
});
export const mulTwoTwo = arith({
  key: "mul-22",
  op: "×",
  sample: (rand) => [randInt(rand, 11, 99), randInt(rand, 11, 99)],
  ok: (a, b) => b % 10 !== 0 && a % 10 !== 0,
  hint: "곱하는 수를 일의 자리와 십의 자리로 나누어 곱한 뒤 더해요.",
  cards: [2, 2],
});

/* ── 3-2 나눗셈 ── */

const oneDigit = (rand: () => number) => randInt(rand, 2, 9);

export const divTens = divKit({
  key: "div10",
  sample: (rand) => [randInt(rand, 2, 9) * 10, oneDigit(rand)],
  ok: (a, b) => a % b === 0 && a / b >= 10,
  rem: false,
  q: [10, 49],
  digits: 2,
});
export const divExact = divKit({
  key: "div-ex",
  sample: (rand) => [randInt(rand, 11, 99), oneDigit(rand)],
  ok: (a, b) => a % 10 !== 0 && a % b === 0 && a / b >= 10,
  rem: false,
  q: [10, 49],
  digits: 2,
});
export const divRem = divKit({
  key: "div-rem",
  sample: (rand) => [randInt(rand, 11, 99), oneDigit(rand)],
  ok: (a, b) => a % b !== 0 && a / b >= 10,
  rem: true,
  q: [10, 49],
  digits: 2,
});
export const div3 = divKit({
  key: "div3",
  sample: (rand) => [three(rand), oneDigit(rand)],
  ok: (a, b) => a % b !== 0,
  rem: true,
  q: [11, 499],
  digits: 3,
});

const remPair = (rand: () => number) => {
  const b = randInt(rand, 3, 9);
  const q = randInt(rand, 3, 30);
  const r = randInt(rand, 1, b - 1);
  return { a: b * q + r, b, q, r };
};

export const checkExpr = easy("l3-check-expr", (rand) => {
  const { a, b, q, r } = remPair(rand);
  if (q === r || q === b) return null;
  // 혼합 계산(5-1) 전이므로 곱하고 더하는 두 식으로
  const two = (x: number, y: number, op: "+" | "−", z: number) => `${x} × ${y} = ${x * y}, ${x * y} ${op} ${z} = ${op === "+" ? x * y + z : x * y - z}`;
  const answer = two(b, q, "+", r);
  return {
    key: `${a}:${b}`,
    prompt: `${a} ÷ ${b} = ${q} … ${eul(r)} 맞게 계산했는지 확인하는 식을 고르세요.`,
    answer,
    choices: shuffle(rand, [answer, two(b, r, "+", q), two(b, q, "−", r), two(q, r, "+", b)]),
    hint: "나누는 수와 몫의 곱에 나머지를 더한 수가 나누어지는 수가 되는지 확인해요.",
    explanation: `${b} × ${q} = ${b * q}, ${b * q} + ${r} = ${a}`,
  };
});

export const checkRight = mid("l3-check-right", (rand) => {
  const { a, b, q, r } = remPair(rand);
  if (r + 1 >= b) return null;
  const answer = `${a} ÷ ${b} = ${q} … ${r}`;
  return {
    key: `${a}:${b}`,
    prompt: "바르게 계산한 것을 고르세요.",
    answer,
    choices: shuffle(rand, [answer, `${a} ÷ ${b} = ${q - 1} … ${r + b}`, `${a} ÷ ${b} = ${q} … ${r + 1}`, `${a} ÷ ${b} = ${q + 1} … ${r}`]),
    hint: "나머지가 나누는 수보다 작은지, 나누는 수와 몫의 곱에 나머지를 더하면 나누어지는 수가 되는지 확인해요.",
    explanation: `${b} × ${q} = ${b * q}, ${b * q} + ${r} = ${a}이고 ${r} < ${b}`,
  };
});

export const checkError = hard("l3-check-error", (rand) => {
  const { a, b, q, r } = remPair(rand);
  if (r + 1 >= b) return null;
  const kinds: [string, string][] = [
    ["나머지가 나누는 수보다 커서 더 나눌 수 있습니다.", `${q - 1} … ${r + b}`],
    ["나머지를 구하는 뺄셈을 잘못했습니다.", `${q} … ${r + 1}`],
    ["몫이 너무 커서 (나누는 수) × (몫)이 나누어지는 수보다 큽니다.", `${q + 1} … ${r}`],
  ];
  const k = randInt(rand, 0, 2);
  const [answer, shown] = kinds[k];
  return {
    key: `${a}:${b}:${k}`,
    prompt: `${nameOf(rand)}가 계산한 것입니다. 잘못 계산한 까닭으로 알맞은 것을 고르세요.`,
    expression: `${a} ÷ ${b} = ${shown}`,
    answer,
    choices: shuffle(rand, [...kinds.map(([s]) => s), "나누는 수와 나누어지는 수를 바꾸어 계산했습니다."]),
    hint: "나누는 수와 몫의 곱에 나머지를 더해 확인하고, 나머지가 나누는 수보다 작은지도 살펴보세요.",
    explanation: `바른 계산: ${a} ÷ ${b} = ${q} … ${r}. ${answer}`,
  };
});
