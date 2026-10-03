import type { Generator, Level } from "../types";
import { makeChoices, pick, randInt, shuffle } from "../../lib/random";
import { addWithoutCarry, COMPARE_CHOICES, multiplyWithoutCarry, sign, subtractWithoutBorrow } from "../generators/common";
import { word, type WordSpec } from "../words/word";
import { hasFinal, josa } from "../josa";
import { settleVisual } from "../figure-check";

/**
 * 3학년 차시용 공용 도구: 이름·조사·선택지 헬퍼와
 * 덧셈·뺄셈·곱셈 / 나눗셈 / 단위 문제를 한 번에 만드는 묶음(kit).
 */

type Rand = () => number;
type Make = (rand: Rand) => WordSpec | null;

/** 조사(는·가)가 자연스럽도록 받침 없는 이름만 쓴다. '하루'는 '하루에 몇 쪽'과 헷갈려 쓰지 않는다 */
export const NAMES = ["지우", "서아", "수아", "도하", "유나", "이수"];
export const nameOf = (rand: Rand) => pick(rand, NAMES);
export const twoNames = (rand: Rand) => shuffle(rand, NAMES).slice(0, 2) as [string, string];

/** 그림 글자가 겹치면 글자를 몇 px 옮겨 살리고(settleVisual), 그래도 안 되거나 그림 밖이면 다시 뽑는다(한 번에 20번까지) */
const guard = (make: Make): Make => (rand) => {
  for (let i = 0; i < 20; i++) {
    const w = make(rand);
    const ok = settleVisual(w);
    if (ok) return ok;
  }
  return null;
};

export const easy = (id: string, make: Make) => word(id, guard(make), 1);
export const mid = (id: string, make: Make) => word(id, guard(make), 2);
export const hard = (id: string, make: Make) => word(id, guard(make), 3);

/** 낱말 끝 글자에 받침이 있으면 withB, 없으면 without을 붙인다(예: jo("귤", "을", "를") → "귤을") */
export const jo = (word: string, withB: string, without: string) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return word + (code >= 0 && code < 11172 && code % 28 !== 0 ? withB : without);
};
/** 수 뒤 조사(읽는 소리 기준, 0은 '영'): 을/를, 이/가, 으로/로 */
export const pp = (n: number, withB: string, without: string) => (hasFinal(n).yes ? withB : without);
export const eul = (n: number) => josa(n, "을/를");
export const iga = (n: number) => josa(n, "이/가");
export const ro = (n: number) => josa(n, "으로/로");

/** 정답과 오답 후보로 중복 없는 4지선다 */
export const choices4 = (rand: Rand, answer: string | number, others: (string | number)[], filler: () => string | number) =>
  makeChoices(
    rand,
    String(answer),
    others.map(String).filter((o) => o !== String(answer)),
    () => String(filler()),
  );

/** 옳은(또는 잘못된) 설명 고르기: 한쪽 목록에서 정답 1개, 다른 쪽에서 3개 */
export function truth(id: string, level: Level, subject: string, facts: { t: string[]; f: string[] }): Generator {
  return word(
    id,
    (rand) => {
      const askTrue = rand() < 0.5;
      const [right, wrong] = askTrue ? [facts.t, facts.f] : [facts.f, facts.t];
      const answer = pick(rand, right);
      const others = shuffle(rand, wrong).slice(0, 3);
      return {
        key: `${askTrue}:${answer}:${others.join("|")}`,
        prompt: `${subject}에 대한 설명으로 ${askTrue ? "옳은" : "잘못된"} 것을 고르세요.`,
        answer,
        choices: shuffle(rand, [answer, ...others]),
        hint: "설명을 하나씩 읽고 배운 내용과 맞는지 확인해 보세요.",
        explanation: `${askTrue ? "옳은" : "잘못된"} 설명: ${answer}`,
      };
    },
    level,
  );
}

/** 조건을 만족할 때까지 두 수를 뽑는다(끝내 못 찾으면 마지막 값) */
export function draw(rand: Rand, sample: (rand: Rand) => [number, number], ok: (a: number, b: number) => boolean = () => true) {
  let p = sample(rand);
  for (let i = 0; i < 300 && !ok(...p); i++) p = sample(rand);
  return p;
}

/** 수 카드 순열로 만들 수 있는 수들(맨 앞 0 제외) */
function splits(cards: number[], lens: number[]): number[][] {
  const out: number[][] = [];
  const perm = (rest: number[], cur: number[]) => {
    if (cur.length === lens.reduce((a, b) => a + b, 0)) {
      const nums: number[] = [];
      let i = 0;
      for (const len of lens) {
        const ds = cur.slice(i, i + len);
        if (ds[0] === 0) return;
        nums.push(Number(ds.join("")));
        i += len;
      }
      out.push(nums);
      return;
    }
    rest.forEach((d, j) => perm([...rest.slice(0, j), ...rest.slice(j + 1)], [...cur, d]));
  };
  perm(cards, []);
  return out;
}

/** "3, 5, 7을"처럼 마지막 수에 을/를을 붙인다 */
export const cardList = (cards: number[]) => [...cards.slice(0, -1), eul(cards[cards.length - 1])].join(", ");

/** 서로 다른 숫자 카드 n장(min 이상) */
export const cardsOf = (rand: Rand, n: number, min = 0) => shuffle(rand, Array.from({ length: 10 - min }, (_, i) => i + min)).slice(0, n);

/* ── 덧셈·뺄셈·곱셈 묶음 ── */

export type Op = "+" | "-" | "×";
const OP_TEXT: Record<Op, string> = { "+": "+", "-": "−", "×": "×" };
const apply = (op: Op, a: number, b: number) => (op === "+" ? a + b : op === "-" ? a - b : a * b);

/** 받아내림을 하고도 윗자리를 1 작게 하지 않은 뺄셈 */
function subNoDecrease(a: number, b: number) {
  const len = String(a).length;
  const da = String(a).padStart(len, "0").split("").map(Number);
  const db = String(b).padStart(len, "0").split("").map(Number);
  return Number(da.map((d, i) => (d - db[i] + 10) % 10).join(""));
}

/** 흔한 실수 계산(받아올림·받아내림·올림을 잊음) */
function slip(op: Op, a: number, b: number) {
  if (op === "+") return addWithoutCarry(a, b);
  if (op === "-") return subtractWithoutBorrow(a, b);
  return b < 10 ? multiplyWithoutCarry(a, b) : a * (b % 10) + a * Math.floor(b / 10);
}

/** 오류 분석: 까닭과 그 까닭대로 계산한 값 */
function reasons(op: Op, a: number, b: number): [string, number][] {
  if (op === "+")
    return [
      ["받아올림한 수를 더하지 않았습니다.", addWithoutCarry(a, b)],
      ["받아올림한 수를 두 번 더했습니다.", 2 * (a + b) - addWithoutCarry(a, b)],
      ["덧셈을 해야 하는데 뺄셈을 했습니다.", a - b],
    ];
  if (op === "-")
    return [
      ["받아내림한 뒤 윗자리 수를 1 작게 하지 않았습니다.", subNoDecrease(a, b)],
      ["자리마다 큰 수에서 작은 수를 뺐습니다.", subtractWithoutBorrow(a, b)],
      ["뺄셈을 해야 하는데 덧셈을 했습니다.", a + b],
    ];
  if (b >= 10)
    return [
      ["십의 자리를 곱한 값을 한 자리 올려 쓰지 않았습니다.", a * (b % 10) + a * Math.floor(b / 10)],
      ["일의 자리 숫자만 곱했습니다.", a * (b % 10)],
      ["곱셈을 해야 하는데 덧셈을 했습니다.", a + b],
    ];
  return [
    ["올림한 수를 더하지 않았습니다.", multiplyWithoutCarry(a, b)],
    ["일의 자리 숫자만 곱했습니다.", (a % 10) * b],
    ["곱셈을 해야 하는데 덧셈을 했습니다.", a + b],
  ];
}

const STORIES: Record<Op, ((a: number, b: number, n: string) => [string, string])[]> = {
  "+": [
    (a, b) => [`과수원에서 사과를 어제 ${a}개, 오늘 ${b}개 땄습니다. 이틀 동안 딴 사과는 모두 몇 개인가요?`, "개"],
    (a, b, n) => [`${n}는 줄넘기를 ${a}번 하고, 쉬었다가 ${b}번을 더 했습니다. 줄넘기를 모두 몇 번 했나요?`, "번"],
    (a, b) => [`강당에 의자가 ${a}개 있었는데 ${b}개를 더 가져왔습니다. 강당에 있는 의자는 모두 몇 개인가요?`, "개"],
  ],
  "-": [
    (a, b) => [`공장에서 인형을 ${a}개 만들어 ${b}개를 팔았습니다. 남은 인형은 몇 개인가요?`, "개"],
    (a, b, n) => [`${n}는 ${a}쪽인 책을 ${b}쪽까지 읽었습니다. 몇 쪽을 더 읽어야 다 읽을 수 있나요?`, "쪽"],
    (a, b) => [`줄넘기 대회에서 수아는 ${a}번, 도하는 ${b}번을 넘었습니다. 수아는 도하보다 몇 번 더 넘었나요?`, "번"],
  ],
  "×": [
    (a, b) => [`한 상자에 귤이 ${a}개씩 들어 있습니다. ${b}상자에 들어 있는 귤은 모두 몇 개인가요?`, "개"],
    (a, b, n) => [`${n}는 하루에 ${a}쪽씩 책을 읽습니다. ${b}일 동안 읽은 책은 모두 몇 쪽인가요?`, "쪽"],
    (a, b) => [`의자를 한 줄에 ${a}개씩 ${b}줄로 놓았습니다. 놓은 의자는 모두 몇 개인가요?`, "개"],
  ],
};

export type ArithCfg = {
  key: string;
  op: Op;
  sample: (rand: Rand) => [number, number];
  ok?: (a: number, b: number) => boolean;
  /** 세로셈 그림으로 보여 줄지(기본 true) */
  column?: boolean;
  hint: string;
  /** 곱셈 수 카드: 만들 수의 자릿수(예: [2, 1]) */
  cards?: number[];
};

/** 곱셈 □ 문제의 왼쪽 수: 자리 숫자 하나를 □로 가린다(□4 × 2 = 68). 곱셈을 거꾸로 짐작해 풀 수 있다 */
function digitBox(rand: Rand, a: number, b: number, r: number): WordSpec {
  const digits = String(a).split("");
  const i = randInt(rand, 0, digits.length - 1);
  const answer = Number(digits[i]);
  const shown = digits.map((d, j) => (j === i ? "□" : d)).join("");
  const ones = i === digits.length - 1;
  const wrong = r % 10;
  return {
    key: `digit:${a}:${b}:${i}`,
    prompt: "□ 안에 알맞은 숫자를 써넣으세요.",
    expression: `${shown} × ${b} = ${r}`,
    answer,
    hint: ones ? "곱의 일의 자리 숫자를 보고 □에 들어갈 숫자를 짐작한 뒤, 넣어 곱해 보며 확인해요." : "□에 숫자를 넣어 곱해 보고, 곱이 같아지는 숫자를 찾아요.",
    explanation: `${a} × ${b} = ${r}이므로 □ = ${answer}`,
    mistakes: ones && wrong !== answer ? { [wrong]: "곱의 일의 자리 숫자를 그대로 쓰지 말고, □에 넣어 곱해 보세요." } : {},
  };
}

/** 한 차시의 계산 범위(sample·ok)로 여러 형식의 생성기를 만든다. id: l3-{key}-{형식} */
export function arith(cfg: ArithCfg) {
  const { key, op, hint } = cfg;
  const t = OP_TEXT[op];
  const id = (k: string) => `l3-${key}-${k}`;
  const get = (rand: Rand) => draw(rand, cfg.sample, cfg.ok);
  const ex = (a: number, b: number) => `${a} ${t} ${b}`;
  const opName = op === "+" ? "더해야" : op === "-" ? "빼야" : "곱해야";

  return {
    calc: easy(id("calc"), (rand) => {
      const [a, b] = get(rand);
      const r = apply(op, a, b);
      const column = cfg.column ?? true;
      return {
        key: `${a}:${b}`,
        prompt: "계산해 보세요.",
        visual: column ? { kind: "column", op, a, b } : undefined,
        expression: column ? undefined : `${ex(a, b)} = □`,
        answer: r,
        hint,
        explanation: `${ex(a, b)} = ${r}`,
        mistakes: { [slip(op, a, b)]: "자리마다 계산한 값을 다시 확인해 보세요. 받아올림(올림)이나 받아내림을 빠뜨렸어요." },
      };
    }),

    cmp: mid(id("cmp"), (rand) => {
      const [a, b] = get(rand);
      const [c, d] = get(rand);
      const x = apply(op, a, b);
      const y = apply(op, c, d);
      return {
        key: `${a}:${b}:${c}:${d}`,
        prompt: "계산 결과를 비교하여 ○ 안에 >, =, < 중 알맞은 것을 고르세요.",
        expression: `${ex(a, b)} ○ ${ex(c, d)}`,
        answer: sign(x, y),
        choices: COMPARE_CHOICES,
        hint: "양쪽을 각각 계산한 뒤 크기를 비교해요.",
        explanation: `${ex(a, b)} = ${x}, ${ex(c, d)} = ${y} → ${x} ${sign(x, y)} ${y}`,
      };
    }),

    box: mid(id("box"), (rand) => {
      const [a, b] = get(rand);
      const r = apply(op, a, b);
      const left = rand() < 0.5;
      // 곱셈: □가 여러 자리 수이면 (두·세 자리 수) ÷ (한 자리 수)가 필요하다(나눗셈은 뒤 단원). 왼쪽은 자리 숫자 하나만 □로
      if (op === "×" && left) return digitBox(rand, a, b, r);
      const expression = left ? `□ ${t} ${b} = ${r}` : `${a} ${t} □ = ${r}`;
      const answer = left ? a : b;
      const how =
        op === "+"
          ? `${r} − ${left ? b : a} = ${answer}`
          : op === "-"
            ? left
              ? `${r} + ${b} = ${a}`
              : `${a} − ${r} = ${b}`
            : `${a} × ${answer} = ${r}이므로 □ = ${answer}`;
      const wrong = op === "+" ? r + (left ? b : a) : op === "-" ? (left ? r - b : a + r) : r - a;
      return {
        key: `${left}:${a}:${b}`,
        prompt: "□ 안에 알맞은 수를 써넣으세요.",
        expression,
        answer,
        hint: op === "×" ? "곱셈구구나 곱셈을 거꾸로 생각해 □를 찾아요." : "덧셈과 뺄셈의 관계를 이용해 거꾸로 생각해요.",
        explanation: how,
        mistakes: { [wrong]: "거꾸로 계산할 때 알맞은 식을 세워야 해요." },
      };
    }),

    big: mid(id("big"), (rand) => {
      const pairs: [number, number][] = [];
      const seen = new Set<number>();
      for (let i = 0; pairs.length < 4 && i < 100; i++) {
        const p = get(rand);
        const r = apply(op, ...p);
        if (!seen.has(r)) {
          seen.add(r);
          pairs.push(p);
        }
      }
      if (pairs.length < 4) return null;
      const most = rand() < 0.5;
      const results = pairs.map((p) => apply(op, ...p));
      const target = most ? Math.max(...results) : Math.min(...results);
      const answer = ex(...pairs[results.indexOf(target)]);
      return {
        key: `${most}:${pairs.flat().join(":")}`,
        prompt: `계산 결과가 가장 ${most ? "큰" : "작은"} 것을 고르세요.`,
        answer,
        choices: pairs.map((p) => ex(...p)),
        hint: "하나씩 계산한 뒤 결과를 비교해요.",
        explanation: pairs.map((p, i) => `${ex(...p)} = ${results[i]}`).join(", "),
      };
    }),

    fix: mid(id("fix"), (rand) => {
      const [a, b] = get(rand);
      const r = apply(op, a, b);
      const w = slip(op, a, b);
      if (w === r) return null;
      return {
        key: `${a}:${b}`,
        // 화면에는 결과 식만 있고 계산 과정이 없으므로 '잘못 계산한 곳을 찾아'라고 하지 않는다
        prompt: `${nameOf(rand)}가 계산한 것입니다. 계산이 잘못되었습니다. 바르게 계산한 값을 구하세요.`,
        expression: `${ex(a, b)} = ${w}`,
        answer: r,
        hint,
        explanation: `바르게 계산하면 ${ex(a, b)} = ${r}`,
        mistakes: { [w]: "친구가 계산한 값을 그대로 썼어요." },
      };
    }),

    story: mid(id("story"), (rand) => {
      const [a, b] = get(rand);
      const i = randInt(rand, 0, STORIES[op].length - 1);
      const [prompt, unit] = STORIES[op][i](a, b, nameOf(rand));
      const r = apply(op, a, b);
      return {
        key: `${i}:${a}:${b}`,
        prompt,
        answer: r,
        unit,
        hint: op === "+" ? "모두 몇인지 구하려면 더해요." : op === "-" ? "남은 수나 더 많은 수는 빼서 구해요." : "같은 수를 여러 번 더하는 것은 곱셈으로 구해요.",
        explanation: `${ex(a, b)} = ${r}(${unit})`,
      };
    }),

    wrongOp: hard(id("wrong-op"), (rand) => {
      const [x, b] = get(rand);
      const wrongOp: Op = op === "+" ? "-" : "+";
      const shown = apply(wrongOp, x, b);
      if (shown <= 0) return null;
      const right = apply(op, x, b);
      const did = wrongOp === "-" ? "뺐더니" : "더했더니";
      const undo = wrongOp === "-" ? `${shown} + ${b} = ${x}` : `${shown} − ${b} = ${x}`;
      return {
        key: `${x}:${b}`,
        prompt: `어떤 수${op === "-" ? "에서" : "에"} ${eul(b)} ${opName} 할 것을 잘못하여 ${did} ${iga(shown)} 되었습니다. 바르게 계산하면 얼마인가요?`,
        answer: right,
        hint: "먼저 잘못 계산한 식을 거꾸로 풀어 어떤 수를 구해요.",
        explanation: `어떤 수: ${undo}, 바른 계산: ${ex(x, b)} = ${right}`,
        mistakes: { [x]: "어떤 수를 구한 뒤 바르게 계산까지 해야 해요." },
      };
    }),

    ineq: hard(id("ineq"), (rand) => {
      const [a, b] = get(rand);
      if (op === "×") {
        if (a < 2) return null;
        const c = a * b + randInt(rand, 1, a - 1);
        return {
          key: `x:${a}:${b}:${c}`,
          prompt: `□ 안에 들어갈 수 있는 수 중에서 가장 큰 수를 구하세요.`,
          expression: `${a} × □ < ${c}`,
          answer: b,
          hint: `□에 수를 넣어 ${a} × □를 계산해 보고 ${c}보다 작은지 확인해요.`,
          // □가 10이면 (두 자리) × (두 자리)라 3-1 범위 밖: 앞의 곱에 한 번 더 더해 보인다
          explanation: `${a} × ${b} = ${a * b} < ${c}, ${b + 1 < 10 ? `${a} × ${b + 1} = ${a * (b + 1)}` : `${a * b}에 ${josa(a, "을/를")} 한 번 더 더하면 ${a * (b + 1)}`} > ${c} → 가장 큰 수는 ${b}`,
          mistakes: { [b + 1]: b + 1 < 10 ? `${a} × ${b + 1} = ${josa(a * (b + 1), "은/는")} ${c}보다 커요.` : `${a}씩 ${b + 1}번이면 ${josa(a * (b + 1), "으로/로")} ${c}보다 커요.` },
        };
      }
      const r = apply(op, a, b);
      const small = rand() < 0.5;
      // 덧셈: a + □ < r (가장 큰 수 b − 1) 또는 a + □ > r (가장 작은 수 b + 1)
      // 뺄셈: a − □ > r (가장 큰 수 b − 1) 또는 a − □ < r (가장 작은 수 b + 1)
      const rel = op === "+" ? (small ? ">" : "<") : small ? "<" : ">";
      const answer = small ? b + 1 : b - 1;
      return {
        key: `${small}:${a}:${b}`,
        prompt: `□ 안에 들어갈 수 있는 수 중에서 가장 ${small ? "작은" : "큰"} 수를 구하세요.`,
        expression: `${a} ${t} □ ${rel} ${r}`,
        answer,
        hint: `먼저 ${a} ${t} □ = ${josa(r, "이/가")} 되는 □를 구한 뒤, 그보다 커야 하는지 작아야 하는지 생각해요.`,
        explanation: `${ex(a, b)} = ${r}이므로 □는 ${b}보다 ${small ? "커야" : "작아야"} 합니다. → ${answer}`,
        mistakes: { [b]: `□가 ${b}이면 양쪽이 같아져요.` },
      };
    }),

    cards: hard(id("cards"), (rand) => {
      if (op === "×") {
        const lens = cfg.cards ?? [2, 1];
        const n = lens.reduce((x, y) => x + y, 0);
        const cards = cardsOf(rand, n, 1);
        const all = splits(cards, lens);
        const best = all.reduce((p, q) => (p[0] * p[1] >= q[0] * q[1] ? p : q));
        // 가장 큰 곱의 식도 차시 조건(올림 횟수 등)을 지켜야 한다
        if (cfg.ok && !cfg.ok(best[0], best[1])) return null;
        const sorted = [...cards].sort((x, y) => y - x);
        const naive = Number(sorted.slice(0, lens[0]).join("")) * Number(sorted.slice(lens[0]).join(""));
        const what = lens[0] === 3 ? "(세 자리 수) × (한 자리 수)" : lens[1] === 2 ? "(두 자리 수) × (두 자리 수)" : "(두 자리 수) × (한 자리 수)";
        return {
          key: `x:${[...cards].sort().join("")}`,
          prompt: `수 카드 ${cardList(cards)} 한 번씩 모두 사용하여 ${what}의 곱셈식을 만들려고 합니다. 만들 수 있는 가장 큰 곱을 구하세요.`,
          answer: best[0] * best[1],
          hint: "큰 숫자를 높은 자리에 놓되, 곱하는 수에도 큰 숫자가 오도록 여러 경우를 비교해 보세요.",
          explanation: `${best[0]} × ${best[1]} = ${josa(best[0] * best[1], "이/가")} 가장 큽니다.`,
          mistakes: { [naive]: "가장 큰 수를 만든 것이 곱이 가장 크게 되는 방법은 아니에요. 여러 경우를 비교해 보세요." },
        };
      }
      const cards = cardsOf(rand, 3);
      const desc = [...cards].sort((x, y) => y - x);
      const asc = [...cards].sort((x, y) => x - y);
      if (asc[0] === 0) [asc[0], asc[1]] = [asc[1], asc[0]];
      const big = Number(desc.join(""));
      const small = Number(asc.join(""));
      if (cfg.ok && !cfg.ok(big, small)) return null;
      const r = apply(op, big, small);
      return {
        key: `${[...cards].sort().join("")}`,
        prompt: `수 카드 ${cardList(cards)} 한 번씩 모두 사용하여 가장 큰 세 자리 수와 가장 작은 세 자리 수를 만들었습니다. 두 수의 ${op === "+" ? "합을" : "차를"} 구하세요.`,
        answer: r,
        hint: "가장 큰 수는 큰 숫자부터, 가장 작은 수는 작은 숫자부터 놓아요. 0은 백의 자리에 올 수 없어요.",
        explanation: `가장 큰 수 ${big}, 가장 작은 수 ${small} → ${ex(big, small)} = ${r}`,
      };
    }),

    rev: hard(id("rev"), (rand) => {
      const ok = cfg.ok ?? (() => true);
      if (op === "+") {
        // 저금통: 10원 단위, 두 번 더하는 과정도 차시 조건(받아올림 횟수)을 지킨다
        const [x, b] = draw(rand, (r) => [randInt(r, 10, 40) * 10, randInt(r, 10, 30) * 10], ok);
        const c = randInt(rand, 10, 30) * 10;
        const d = x + b + c;
        if (!ok(x, b) || !ok(x + b, c) || d >= 1000) return null;
        return {
          key: `${x}:${b}:${c}`,
          prompt: `${nameOf(rand)}의 저금통에 돈이 들어 있었습니다. 어제 ${b}원, 오늘 ${c}원을 더 넣었더니 ${d}원이 되었습니다. 처음 저금통에 들어 있던 돈은 얼마인가요?`,
          answer: x,
          unit: "원",
          hint: "나중 금액에서 넣은 돈을 차례로 빼면 처음 금액이 나와요.",
          explanation: `${d} − ${c} − ${b} = ${x}(원)`,
          mistakes: { [d + b + c]: "넣은 돈은 빼서 거꾸로 생각해야 해요." },
        };
      }
      const [x, b] = get(rand);
      const c = randInt(rand, 1, 3) * 100 + randInt(rand, 1, 9) * 10 + randInt(rand, 0, 9);
      const d = x - b - c;
      if (d < 100 || !ok(x - b, c)) return null;
      return {
        key: `${x}:${b}:${c}`,
        prompt: `도서관에 책이 있었습니다. 오전에 ${b}권, 오후에 ${c}권을 빌려 가서 ${d}권이 남았습니다. 처음 도서관에 있던 책은 몇 권인가요?`,
        answer: x,
        unit: "권",
        hint: "남은 책에 빌려 간 책을 차례로 더하면 처음 책의 수가 나와요.",
        explanation: `${d} + ${c} + ${b} = ${x}(권)`,
        mistakes: { [d - b - c]: "빌려 간 책은 더해서 거꾸로 생각해야 해요." },
      };
    }),

    who: hard(id("who"), (rand) => {
      const ok = cfg.ok ?? (() => true);
      const small = (r: Rand): [number, number] => [randInt(r, 150, 500), randInt(r, 100, 400)];
      const [a, b] = op === "-" ? draw(rand, small, ok) : get(rand);
      const [c, d] = op === "-" ? draw(rand, small, ok) : get(rand);
      const x = apply(op, a, b);
      const y = apply(op, c, d);
      if (x === y) return null;
      // 남은 수를 비교하는 뺄셈도 차시 조건을 지킨다
      if (op === "-" && (!ok(a, b) || !ok(c, d) || !ok(Math.max(x, y), Math.min(x, y)))) return null;
      const [A, B] = twoNames(rand);
      const [prompt, unit] =
        op === "+"
          ? [`${A}는 동화책을 어제 ${a}쪽, 오늘 ${b}쪽 읽었고, ${B}는 어제 ${c}쪽, 오늘 ${d}쪽 읽었습니다. 이틀 동안 누가 몇 쪽 더 많이 읽었나요?`, "쪽"]
          : op === "-"
            ? [`${A}는 색종이 ${a}장 중에서 ${b}장을 썼고, ${B}는 ${c}장 중에서 ${d}장을 썼습니다. 남은 색종이는 누가 몇 장 더 많나요?`, "장"]
            : [`${A}네 공장에서는 한 상자에 ${a}개씩 든 과자를 ${b}상자, ${B}네 공장에서는 한 상자에 ${c}개씩 든 과자를 ${d}상자 만들었습니다. 누구네 공장에서 과자를 몇 개 더 많이 만들었나요?`, "개"];
      const diff = Math.abs(x - y);
      const off = diff > 10 ? diff - 10 : diff + 10;
      const W = x > y ? A : B;
      const L = x > y ? B : A;
      const who = (n: string) => (op === "×" ? `${n}네 공장이` : `${n}가`);
      const answer = `${who(W)} ${diff}${unit} 더`;
      return {
        key: `${a}:${b}:${c}:${d}`,
        prompt,
        answer,
        choices: shuffle(rand, [answer, `${who(L)} ${diff}${unit} 더`, `${who(W)} ${off}${unit} 더`, `${who(L)} ${off}${unit} 더`]),
        hint: "두 사람의 수를 각각 계산한 뒤 큰 수에서 작은 수를 빼요.",
        explanation: `${A}: ${ex(a, b)} = ${x}, ${B}: ${ex(c, d)} = ${y} → ${who(W)} ${Math.max(x, y)} − ${Math.min(x, y)} = ${diff}(${unit}) 더`,
      };
    }),

    error: hard(id("error"), (rand) => {
      const [a, b] = get(rand);
      const r = apply(op, a, b);
      const list = reasons(op, a, b);
      const values = list.map(([, v]) => v);
      const usable = list.filter(([, v]) => v > 0 && v !== r && values.filter((w) => w === v).length === 1);
      if (usable.length === 0) return null;
      const [answer, w] = pick(rand, usable);
      const extra = op === "×" && b >= 10 ? "올림한 수를 두 번 더했습니다." : "자리를 맞추어 쓰지 않고 계산했습니다.";
      return {
        key: `${a}:${b}:${answer}`,
        prompt: `${nameOf(rand)}가 계산한 것입니다. 잘못 계산한 까닭으로 알맞은 것을 고르세요.`,
        expression: `${ex(a, b)} = ${w}`,
        answer,
        choices: shuffle(rand, [...list.map(([s]) => s), extra]),
        hint: `먼저 바르게 계산해(${ex(a, b)}) 친구의 답과 어디가 다른지 비교해 보세요.`,
        explanation: `바른 계산은 ${ex(a, b)} = ${r}입니다. ${answer}`,
      };
    }),
  };
}

/* ── 나눗셈 묶음 ── */

export type DivCfg = {
  key: string;
  sample: (rand: Rand) => [number, number];
  ok?: (a: number, b: number) => boolean;
  /** 나머지가 있는 나눗셈인지 */
  rem: boolean;
  /** 몫의 범위(수 카드용) */
  q: [number, number];
  /** 수 카드로 만드는 나누어지는 수의 자릿수 */
  digits: 2 | 3;
};

export function divKit(cfg: DivCfg) {
  const { key, rem } = cfg;
  const id = (k: string) => `l3-${key}-${k}`;
  const get = (rand: Rand) => draw(rand, cfg.sample, cfg.ok);
  const qr = (a: number, b: number) => [Math.floor(a / b), a % b] as const;
  const show = (a: number, b: number) => {
    const [q, r] = qr(a, b);
    return r ? `${a} ÷ ${b} = ${q} … ${r}` : `${a} ÷ ${b} = ${q}`;
  };
  const QR = ["몫", "나머지"];

  return {
    calc: easy(id("calc"), (rand) => {
      const [a, b] = get(rand);
      const [q, r] = qr(a, b);
      return rem
        ? {
            key: `${a}:${b}`,
            prompt: "몫과 나머지를 구하세요.",
            expression: `${a} ÷ ${b}`,
            answer: `${q},${r}`,
            unit: QR,
            hint: "높은 자리부터 나누고, 남은 수는 다음 자리와 함께 나누어요. 나머지는 나누는 수보다 작아야 해요.",
            explanation: show(a, b),
          }
        : {
            key: `${a}:${b}`,
            prompt: "계산해 보세요.",
            expression: `${a} ÷ ${b} = □`,
            answer: q,
            hint: `${b} × □ = ${josa(a, "이/가")} 되는 □를 생각해요.`,
            explanation: `${b} × ${q} = ${a}이므로 ${a} ÷ ${b} = ${q}`,
          };
    }),

    box: mid(id("box"), (rand) => {
      const [a, b] = get(rand);
      const [q, r] = qr(a, b);
      if (rem) {
        return {
          key: `${a}:${b}`,
          prompt: "□ 안에 알맞은 수를 써넣으세요.",
          expression: `□ ÷ ${b} = ${q} … ${r}`,
          answer: a,
          hint: "나누는 수와 몫의 곱에 나머지를 더하면 나누어지는 수가 돼요.",
          explanation: `${b} × ${q} = ${b * q}, ${b * q} + ${r} = ${a}`,
          mistakes: { [b * q]: "나머지를 더하지 않았어요." },
        };
      }
      const left = rand() < 0.5;
      return {
        key: `${left}:${a}:${b}`,
        prompt: "□ 안에 알맞은 수를 써넣으세요.",
        expression: left ? `□ ÷ ${b} = ${q}` : `${a} ÷ □ = ${q}`,
        answer: left ? a : b,
        hint: "곱셈과 나눗셈의 관계를 이용해 거꾸로 생각해요.",
        explanation: left ? `${b} × ${q} = ${a}` : `${a} ÷ ${q} = ${b} (${b} × ${q} = ${a})`,
      };
    }),

    cmp: mid(id("cmp"), (rand) => {
      const [a, b] = get(rand);
      const [c, d] = get(rand);
      const x = Math.floor(a / b);
      const y = Math.floor(c / d);
      return {
        key: `${a}:${b}:${c}:${d}`,
        prompt: "몫을 비교하여 ○ 안에 >, =, < 중 알맞은 것을 고르세요.",
        expression: `${a} ÷ ${b} ○ ${c} ÷ ${d}`,
        answer: sign(x, y),
        choices: COMPARE_CHOICES,
        hint: "양쪽의 몫을 각각 구한 뒤 비교해요.",
        explanation: `${a} ÷ ${b} = ${x}, ${c} ÷ ${d} = ${y}`,
      };
    }),

    big: mid(id("big"), (rand) => {
      const pairs: [number, number][] = [];
      const seen = new Set<number>();
      for (let i = 0; pairs.length < 4 && i < 100; i++) {
        const p = get(rand);
        const q = Math.floor(p[0] / p[1]);
        if (!seen.has(q)) {
          seen.add(q);
          pairs.push(p);
        }
      }
      if (pairs.length < 4) return null;
      const most = rand() < 0.5;
      const qs = pairs.map(([a, b]) => Math.floor(a / b));
      const target = most ? Math.max(...qs) : Math.min(...qs);
      const [a, b] = pairs[qs.indexOf(target)];
      return {
        key: `${most}:${pairs.flat().join(":")}`,
        prompt: `몫이 가장 ${most ? "큰" : "작은"} 나눗셈을 고르세요.`,
        answer: `${a} ÷ ${b}`,
        choices: pairs.map(([x, y]) => `${x} ÷ ${y}`),
        hint: "각 나눗셈의 몫을 구해 비교해요.",
        explanation: pairs.map(([x, y]) => show(x, y)).join(", "),
      };
    }),

    story: mid(id("story"), (rand) => {
      const [a, b] = get(rand);
      const [q, r] = qr(a, b);
      const share = rand() < 0.5;
      if (rem) {
        return share
          ? {
              key: `s:${a}:${b}`,
              prompt: `사탕 ${a}개를 ${b}명에게 똑같이 나누어 주려고 합니다. 한 명에게 몇 개씩 줄 수 있고, 몇 개가 남나요?`,
              answer: `${q},${r}`,
              unit: ["개씩", "개 남음"],
              hint: "나눗셈의 몫은 한 명이 받는 수, 나머지는 남는 수예요.",
              explanation: show(a, b),
            }
          : {
              key: `g:${a}:${b}`,
              prompt: `공책 ${a}권을 한 묶음에 ${b}권씩 묶으려고 합니다. 몇 묶음이 되고, 몇 권이 남나요?`,
              answer: `${q},${r}`,
              unit: ["묶음", "권 남음"],
              hint: "나눗셈의 몫은 묶음의 수, 나머지는 남는 수예요.",
              explanation: show(a, b),
            };
      }
      return share
        ? {
            key: `s:${a}:${b}`,
            prompt: `구슬 ${a}개를 ${b}명에게 똑같이 나누어 주려고 합니다. 한 명에게 몇 개씩 줄 수 있나요?`,
            answer: q,
            unit: "개",
            hint: "똑같이 나누어 주는 것은 나눗셈으로 구해요.",
            explanation: `${a} ÷ ${b} = ${q}(개)`,
          }
        : {
            key: `g:${a}:${b}`,
            prompt: `색종이 ${a}장을 한 사람에게 ${b}장씩 나누어 주려고 합니다. 몇 명에게 나누어 줄 수 있나요?`,
            answer: q,
            unit: "명",
            hint: "몇 장씩 덜어 내는 것도 나눗셈으로 구해요.",
            explanation: `${a} ÷ ${b} = ${q}(명)`,
          };
    }),

    remMax: mid(id("rem-max"), (rand) => {
      const b = randInt(rand, 3, 9);
      const ask = rand() < 0.5;
      return {
        key: `${ask}:${b}`,
        prompt: ask
          ? `어떤 수를 ${ro(b)} 나누었을 때 나머지가 될 수 있는 수 중에서 가장 큰 수는 얼마인가요?`
          : `어떤 수를 ${ro(b)} 나누었더니 나머지가 있었습니다. 나머지가 될 수 있는 수는 모두 몇 개인가요?`,
        answer: b - 1,
        unit: ask ? undefined : "개",
        hint: "나머지는 나누는 수보다 작아야 해요.",
        explanation: `나머지는 ${b}보다 작은 1부터 ${b - 1}까지의 수 → ${ask ? `가장 큰 수 ${b - 1}` : `${b - 1}개`}`,
        mistakes: { [b]: `나머지가 ${b}이면 한 번 더 나눌 수 있어요.` },
      };
    }),

    wrongOp: hard(id("wrong-op"), (rand) => {
      const [x, b] = get(rand);
      const [q, r] = qr(x, b);
      return {
        key: `${x}:${b}`,
        prompt: `어떤 수를 ${ro(b)} 나누어야 할 것을 잘못하여 ${eul(b)} 더했더니 ${iga(x + b)} 되었습니다. 바르게 계산한 ${rem ? "몫과 나머지를" : "몫을"} 구하세요.`,
        answer: rem ? `${q},${r}` : q,
        unit: rem ? QR : undefined,
        hint: "먼저 잘못 계산한 식을 거꾸로 풀어 어떤 수를 구해요.",
        explanation: `어떤 수: ${x + b} − ${b} = ${x}, 바른 계산: ${show(x, b)}`,
        mistakes: rem ? {} : { [x]: "어떤 수를 구한 뒤 나눗셈까지 해야 해요." },
      };
    }),

    ineq: hard(id("ineq"), (rand) => {
      const [a, b] = get(rand);
      const q = Math.floor(a / b);
      const answer = b * q + b - 1;
      return {
        key: `${q}:${b}`,
        prompt: `□ ÷ ${b}의 몫이 ${q}이고 나머지가 있습니다. □ 안에 들어갈 수 있는 수 중에서 가장 큰 수를 구하세요.`,
        answer,
        hint: "나머지가 가장 클 때 나누어지는 수가 가장 커요. 나머지는 나누는 수보다 작아요.",
        explanation: `가장 큰 나머지는 ${b - 1} → ${b} × ${q} = ${b * q}, ${b * q} + ${b - 1} = ${answer}`,
        mistakes: { [b * q + b]: "나머지는 나누는 수보다 작아야 해요.", [b * q]: "나머지가 있어야 해요." },
      };
    }),

    cards: hard(id("cards"), (rand) => {
      const [lo, hi] = cfg.q;
      if (!rem) {
        const cards = cardsOf(rand, 3);
        const b = randInt(rand, 2, 9);
        const nums = splits(cards, [2]).map(([n]) => n).filter((n) => n % b === 0);
        if (nums.length === 0) return null;
        const best = Math.max(...nums);
        // 몫 범위는 가장 큰 수에만 적용한다(범위로 먼저 거르면 가장 큰 수가 빠져 답이 틀린다)
        if (best / b < lo || best / b > hi) return null;
        // '나누어떨어진다'는 3-2 나머지 차시(div-rem)에서 정의하므로 그 앞 차시에서는 곱셈구구의 곱(3-1)이나 '똑같이 나눌 수 있는'으로 쓴다
        const table = hi <= 9;
        const cond = table ? `${b}단 곱셈구구의 곱이 되는` : `${ro(b)} 똑같이 나눌 수 있는`;
        return {
          key: `${[...cards].sort().join("")}:${b}`,
          prompt: `수 카드 ${cards.join(", ")} 중에서 2장을 골라 두 자리 수를 만들려고 합니다. 만들 수 있는 두 자리 수 중에서 ${cond} 가장 큰 수를 ${ro(b)} 나눈 몫을 구하세요.`,
          answer: best / b,
          hint: table ? `만들 수 있는 두 자리 수를 큰 수부터 차례로 쓰고, ${b}단 곱셈구구에 있는지 확인해 보세요.` : `만들 수 있는 두 자리 수를 큰 수부터 차례로 ${ro(b)} 나누어 보고, 남는 것 없이 똑같이 나누어지는 수를 찾아요.`,
          explanation: `${cond} 가장 큰 수는 ${best} → ${best} ÷ ${b} = ${best / b}`,
          mistakes: { [best]: `${table ? "곱셈구구의 곱인" : "똑같이 나눌 수 있는"} 수를 찾은 뒤 몫까지 구해야 해요.` },
        };
      }
      const n = cfg.digits + 1;
      const cards = cardsOf(rand, n, 2);
      const all = splits(cards, [cfg.digits, 1]);
      const q = (x: number[]) => Math.floor(x[0] / x[1]);
      const best = all.reduce((p, c) => (q(c) > q(p) ? c : p));
      if (all.filter((x) => q(x) === q(best)).length > 1) return null;
      const [a, b] = best;
      const what = cfg.digits === 3 ? "(세 자리 수) ÷ (한 자리 수)" : "(두 자리 수) ÷ (한 자리 수)";
      return {
        key: `${[...cards].sort().join("")}`,
        prompt: `수 카드 ${cardList(cards)} 한 번씩 모두 사용하여 ${what}의 나눗셈식을 만들려고 합니다. 몫이 가장 크게 되도록 만들었을 때의 몫과 나머지를 구하세요.`,
        answer: `${q(best)},${a % b}`,
        unit: QR,
        hint: "나누어지는 수는 가장 크게, 나누는 수는 가장 작게 만들어요.",
        explanation: show(a, b),
      };
    }),

    who: hard(id("who"), (rand) => {
      const [a, b] = get(rand);
      const [c, d] = get(rand);
      const x = Math.floor(a / b);
      const y = Math.floor(c / d);
      if (x === y || a % b || c % d || x > 30 || y > 30) return null;
      const [A, B] = twoNames(rand);
      const diff = Math.abs(x - y);
      const W = x > y ? A : B;
      const L = x > y ? B : A;
      const off = diff + 1;
      const answer = `${W}가 ${diff}일 더`;
      return {
        key: `${a}:${b}:${c}:${d}`,
        prompt: `${A}는 종이학 ${a}개를 하루에 ${b}개씩, ${B}는 종이학 ${c}개를 하루에 ${d}개씩 접으려고 합니다. 종이학을 모두 접는 데 누가 며칠 더 걸리나요?`,
        answer,
        choices: shuffle(rand, [answer, `${L}가 ${diff}일 더`, `${W}가 ${off}일 더`, `${L}가 ${off}일 더`]),
        hint: "각자 종이학을 모두 접는 데 걸리는 날수를 나눗셈으로 구해 비교해요.",
        explanation: `${A}: ${a} ÷ ${b} = ${x}(일), ${B}: ${c} ÷ ${d} = ${y}(일) → ${W}가 ${diff}일 더`,
      };
    }),

    rev: hard(id("rev"), (rand) => {
      const [a, b] = get(rand);
      const [q, r] = qr(a, b);
      const c = randInt(rand, 2, 9);
      if (c === b) return null;
      const [q2, r2] = qr(a, c);
      return {
        key: `${a}:${b}:${c}`,
        prompt: `어떤 수를 ${ro(b)} 나누었더니 몫은 ${q}, 나머지는 ${r}입니다. 어떤 수를 ${ro(c)} 나눈 몫과 나머지를 구하세요.`,
        answer: `${q2},${r2}`,
        unit: QR,
        hint: "나누는 수와 몫을 곱하고 나머지를 더해 어떤 수를 먼저 구해요.",
        explanation: `어떤 수: ${b} × ${q} = ${b * q}, ${b * q} + ${r} = ${a}, ${show(a, c)}`,
      };
    }),
  };
}

/* ── 단위(길이·들이·무게·시간) 묶음 ── */

export type MeasureCfg = {
  key: string;
  big: string;
  small: string;
  base: number;
  /** 큰 단위 값의 범위 */
  range: [number, number];
  /** 작은 단위 값을 뽑는 단위(예: 1000이면 10 mL 단위가 아니라 1 mL 단위) */
  step?: number;
  /** 가장 큰 것 고르기 문장: 목록 → 문제 */
  order: (list: string, most: boolean) => string;
  /** 가장 큰 것 고르기에서 쓸 큰 단위 값의 범위(기본 range, 예: 가방 무게 1~5 kg) */
  orderRange?: [number, number];
};

export function measureKit(cfg: MeasureCfg) {
  const { key, big, small, base } = cfg;
  const id = (k: string) => `l3-${key}-${k}`;
  const sp = /[가-힣]/.test(big) ? "" : " ";
  const step = cfg.step ?? 1;
  const full = (v: number) => `${Math.floor(v / base)}${sp}${big} ${v % base}${sp}${small}`;
  const mixed = (v: number) => (v % base === 0 ? `${v / base}${sp}${big}` : Math.floor(v / base) === 0 ? `${v}${sp}${small}` : full(v));
  const valueIn = (rand: Rand, [lo, hi]: [number, number]) => randInt(rand, lo, hi) * base + randInt(rand, 1, Math.floor((base - 1) / step)) * step;
  const value = (rand: Rand) => valueIn(rand, cfg.range);

  return {
    full,
    mixed,
    value,
    cmp: mid(id("cmp"), (rand) => {
      const v = value(rand);
      const w = rand() < 0.2 ? v : v + pick(rand, [-1, 1]) * randInt(rand, 1, 3) * (base >= 1000 ? pick(rand, [1, 10, 100]) : 1) * step;
      return {
        key: `${v}:${w}`,
        prompt: "○ 안에 >, =, < 중 알맞은 것을 고르세요.",
        expression: `${full(v)} ○ ${w}${sp}${small}`,
        answer: sign(v, w),
        choices: COMPARE_CHOICES,
        hint: `1${sp}${big} = ${base}${sp}${small}임을 이용해 단위를 같게 바꾸어 비교해요.`,
        explanation: `${full(v)} = ${v}${sp}${small} → ${v} ${sign(v, w)} ${w}`,
      };
    }),

    split: mid(id("split"), (rand) => {
      const v = value(rand);
      return {
        key: `${v}`,
        prompt: "□ 안에 알맞은 수를 써넣으세요.",
        expression: `${v}${sp}${small} = □${sp}${big} □${sp}${small}`,
        answer: `${Math.floor(v / base)},${v % base}`,
        unit: [big, small],
        hint: `1${sp}${big} = ${base}${sp}${small}임을 이용해요.`,
        explanation: `${v}${sp}${small} = ${full(v)}`,
      };
    }),

    order: hard(id("order"), (rand) => {
      const names = shuffle(rand, NAMES).slice(0, 4);
      const [lo, hi] = cfg.orderRange ?? cfg.range;
      const center = valueIn(rand, [lo, hi]);
      const set = new Set<number>([center]);
      // 모든 값이 center와 같은 범위(몇 큰 단위 몇 작은 단위, 0이나 음수 없음) 안에 있게 한다
      const fits = (v: number) => v >= lo * base && v < (hi + 1) * base && v % base !== 0;
      for (let i = 0; set.size < 4 && i < 50; i++) {
        const v = center + pick(rand, [-1, 1]) * randInt(rand, 1, 9) * (base >= 1000 ? pick(rand, [1, 10, 100]) : 1) * step;
        if (fits(v)) set.add(v);
      }
      if (set.size < 4) return null;
      const vals = shuffle(rand, [...set]);
      const most = rand() < 0.5;
      const target = most ? Math.max(...vals) : Math.min(...vals);
      const shown = vals.map((v, i) => (i % 2 === 0 ? full(v) : `${v}${sp}${small}`));
      const answer = names[vals.indexOf(target)];
      return {
        key: `${most}:${vals.join(":")}`,
        prompt: cfg.order(names.map((n, i) => `${n} ${shown[i]}`).join(", "), most),
        answer,
        choices: names,
        hint: `모두 ${small} 단위로 바꾸어 비교해요.`,
        explanation: names.map((n, i) => `${n} ${vals[i]}${sp}${small}`).join(", ") + ` → ${answer}`,
      };
    }),

    ineq: hard(id("ineq"), (rand) => {
      const k = randInt(rand, cfg.range[0] + 1, cfg.range[1]);
      const x = randInt(rand, 1, Math.floor((base - 1) / step)) * step;
      const t = randInt(rand, 1, Math.floor((base - 1) / step)) * step;
      const n = k * base + x + t;
      const less = rand() < 0.5;
      const answer = less ? k : k + 1;
      return {
        key: `${less}:${k}:${x}:${t}`,
        prompt: `□ 안에 들어갈 수 있는 수 중에서 가장 ${less ? "큰" : "작은"} 수를 구하세요.`,
        expression: `□${sp}${big} ${x}${sp}${small} ${less ? "<" : ">"} ${n}${sp}${small}`,
        answer,
        hint: `${josa(`${n}${sp}${small}`, "을/를")} 몇 ${big} 몇 ${josa(small, "으로/로")} 나타내어 비교해요.`,
        explanation: `${n}${sp}${small} = ${full(n)} → □는 ${less ? `${answer}까지` : `${answer}부터`} 들어갈 수 있어요.`,
        mistakes: { [less ? k + 1 : k]: "□에 넣어 크기를 직접 비교해 보세요." },
      };
    }),

    box: mid(id("box"), (rand) => {
      const v = value(rand);
      const w = randInt(rand, 1, Math.floor((base - 1) / step)) * step;
      const s = v + w;
      return {
        key: `${v}:${w}`,
        prompt: "□ 안에 알맞은 수를 써넣으세요.",
        expression: `${full(v)} + □${sp}${small} = ${full(s)}`,
        answer: w,
        hint: `두 값을 모두 ${josa(small, "으로/로")} 바꾸어 뺄셈으로 구해요.`,
        explanation: `${s} − ${v} = ${w}(${small})`,
      };
    }),
  };
}
