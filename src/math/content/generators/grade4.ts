import type { Generator } from "../types";
import { makeChoices, pick, randInt } from "../../lib/random";
import { COMPARE_CHOICES, multiplyWithoutCarry, numberProblem, sign } from "./common";
import { josa } from "../josa";

const fmt = (n: number) => n.toLocaleString("ko-KR");

/* ── 4-1 큰 수 ── */

export const bigCompose: Generator = {
  id: "big-compose",
  level: 1,
  make(rand) {
    const parts = [randInt(rand, 1, 9), randInt(rand, 0, 9), randInt(rand, 0, 9), randInt(rand, 0, 9), randInt(rand, 0, 9)];
    const [man, cheon, baek, sip, il] = parts;
    const n = man * 10000 + cheon * 1000 + baek * 100 + sip * 10 + il;
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${n}`,
      prompt: `10000이 ${man}개, 1000이 ${cheon}개, 100이 ${baek}개, 10이 ${sip}개, 1이 ${il}개인 수를 쓰세요.`,
      answer: n,
      hint: "만의 자리부터 차례로 숫자를 써요. 없는 자리는 0이에요.",
      explanation: `${fmt(n)}입니다.`,
    });
  },
};

const PLACES = ["일", "십", "백", "천", "만", "십만", "백만", "천만", "억"];

export const bigPlaceValue: Generator = {
  id: "big-place-value",
  level: 1,
  make(rand) {
    const len = randInt(rand, 5, 9);
    const n = randInt(rand, 10 ** (len - 1), 10 ** len - 1);
    const text = String(n);
    const idx = randInt(rand, 0, len - 2); // 맨 끝(일의 자리)은 제외
    const digit = Number(text[idx]);
    if (digit === 0) return bigPlaceValue.make(rand);
    const place = len - 1 - idx;
    const value = digit * 10 ** place;
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${n}:${idx}`,
      prompt: `${fmt(n)}에서 ${PLACES[place]}의 자리 숫자 ${josa(digit, "이/가")} 나타내는 값을 쓰세요.`,
      answer: value,
      hint: `${PLACES[place]}의 자리 숫자는 그 자리만큼의 크기를 나타내요.`,
      explanation: `${digit} × ${fmt(10 ** place)} = ${fmt(value)}`,
      mistakes: { [digit]: "숫자만 썼어요. 자리의 값을 곱해야 해요." },
    });
  },
};

export const bigEok: Generator = {
  id: "big-eok",
  level: 2,
  make(rand) {
    const eok = randInt(rand, 1, 99);
    const man = randInt(rand, 1, 9999);
    const n = eok * 100000000 + man * 10000;
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${eok}:${man}`,
      prompt: `1억이 ${eok}개, 1만이 ${man}개인 수를 숫자로 쓰세요.`,
      answer: n,
      hint: "억 단위 다음에 만 단위 네 자리, 그다음 일 단위 네 자리를 써요.",
      explanation: `${eok}억 ${man}만 = ${fmt(n)}`,
      mistakes: { [eok * 10000 + man]: "0을 빠뜨렸어요. 만 단위 뒤에 네 자리가 더 있어요." },
    });
  },
};

export const bigSkipCount: Generator = {
  id: "big-skip-count",
  level: 2,
  make(rand) {
    const step = pick(rand, [10000, 100000, 1000000]);
    const start = randInt(rand, 10, 900) * 1000 + randInt(rand, 0, 999);
    const times = randInt(rand, 2, 5);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${start}:${step}:${times}`,
      prompt: `${fmt(start)}부터 ${fmt(step)}씩 ${times}번 뛰어 센 수를 쓰세요.`,
      answer: start + step * times,
      hint: `${fmt(step)}씩 뛰어 세면 그 자리 숫자가 1씩 커져요.`,
      explanation: `${fmt(step)}씩 ${times}번이면 ${fmt(step * times)} → ${fmt(start)} + ${fmt(step * times)} = ${fmt(start + step * times)}`,
    });
  },
};

export const bigCompare: Generator = {
  id: "big-compare",
  level: 1,
  make(rand) {
    const a = randInt(rand, 100000, 99999999);
    const diffPlace = 10 ** randInt(rand, 0, String(a).length - 1);
    const b = rand() < 0.1 ? a : Math.max(1, a + (rand() < 0.5 ? 1 : -1) * diffPlace * randInt(rand, 1, 5));
    const answer = sign(a, b);
    return {
      key: `${this.id}:${a}:${b}`,
      typeId: this.id,
      prompt: "○ 안에 >, =, < 중 알맞은 것을 고르세요.",
      expression: `${fmt(a)} ○ ${fmt(b)}`,
      input: "choice",
      choices: COMPARE_CHOICES,
      answer,
      hint: "자리 수가 다르면 자리 수가 많은 쪽이 커요. 같으면 높은 자리부터 비교해요.",
      explanation: `${fmt(a)} ${answer} ${fmt(b)}`,
    };
  },
};

/* ── 4-1 곱셈과 나눗셈 ── */

export const mulHundredsTens: Generator = {
  id: "mul-hundreds-tens",
  level: 1,
  make(rand) {
    const a = randInt(rand, 1, 9) * 100;
    const b = randInt(rand, 2, 9) * 10;
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: "계산해 보세요.",
      expression: `${a} × ${b} = □`,
      answer: a * b,
      hint: `${a / 100} × ${josa(b / 10, "을/를")} 구한 뒤 0을 세 개 붙여요.`,
      explanation: `${a / 100} × ${b / 10} = ${(a * b) / 1000} → ${fmt(a * b)}`,
      mistakes: { [(a * b) / 10]: "0을 하나 빠뜨렸어요." },
    });
  },
};

/**
 * (세 자리 수)×(두 자리 수)의 힌트·풀이: 일의 자리 곱과 몇십의 곱을 더한다.
 * 곱하는 수가 몇십(20, 30 …)이면 0을 곱하는 단계를 쓰지 않고 몇을 곱한 뒤 0을 붙인다
 */
export function mul3x2Steps(a: number, b: number): { hint: string; explanation: string } {
  const [ones, tens] = [b % 10, b - (b % 10)];
  if (ones === 0) return { hint: `${a} × ${josa(tens / 10, "을/를")} 구한 뒤 0을 하나 붙여요.`, explanation: `${a} × ${tens / 10} = ${(a * tens) / 10} → ${a * b}` };
  return { hint: `${a} × ${josa(ones, "과/와")} ${a} × ${josa(tens, "을/를")} 더해요.`, explanation: `${a * ones} + ${a * tens} = ${a * b}` };
}

export const mul3x2: Generator = {
  id: "mul-3x2",
  level: 2,
  make(rand) {
    const a = randInt(rand, 102, 999);
    const b = randInt(rand, 12, 99);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: "계산해 보세요.",
      visual: { kind: "column", op: "×", a, b },
      answer: a * b,
      ...mul3x2Steps(a, b),
      mistakes: {
        [a * (b % 10) + a * Math.floor(b / 10)]: "십의 자리 곱의 자리를 맞추지 않았어요.",
        [multiplyWithoutCarry(a, b % 10)]: "올림을 빠뜨렸어요.",
      },
    });
  },
};

export const divByTens: Generator = {
  id: "div-by-tens",
  level: 1,
  make(rand) {
    const b = randInt(rand, 2, 9) * 10;
    const q = randInt(rand, 2, 9);
    const r = randInt(rand, 0, b / 10 - 1) * 10;
    const a = b * q + r;
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: "몫과 나머지를 구하세요. 나머지가 없으면 0을 쓰세요.",
      expression: `${a} ÷ ${b}`,
      answer: `${q},${r}`,
      fields: ["몫", "나머지"],
      hint: `${b} × □가 ${josa(a, "을/를")} 넘지 않는 가장 큰 수를 찾아요.`,
      explanation: `${b} × ${q} = ${b * q}, 나머지 ${r}`,
      mistakes: { [`${q},${r / 10}`]: "나머지도 10배 된 수예요." },
    });
  },
};

function divTwoDigit(id: string, minA: number, maxA: number, level: 1 | 2): Generator {
  return {
    id,
    level,
    make(rand) {
      const b = randInt(rand, 12, 49);
      const q = randInt(rand, Math.max(1, Math.ceil(minA / b)), Math.floor(maxA / b));
      const r = randInt(rand, 0, b - 1);
      const a = b * q + r;
      if (a > maxA) return this.make(rand);
      return numberProblem({
        typeId: id,
        key: `${id}:${a}:${b}`,
        prompt: "몫과 나머지를 구하세요. 나머지가 없으면 0을 쓰세요.",
        expression: `${a} ÷ ${b}`,
        answer: `${q},${r}`,
        fields: ["몫", "나머지"],
        hint: `${josa(b, "을/를")} 몇십으로 어림해 몫을 짐작한 뒤 곱해서 확인해요.`,
        explanation: `${b} × ${q} = ${b * q}, ${a} − ${b * q} = ${r}`,
        mistakes: { [`${q - 1},${r + b}`]: "나머지가 나누는 수보다 커요. 몫을 1 크게 해 보세요." },
      });
    },
  };
}

export const div2x2 = divTwoDigit("div-2x2", 24, 99, 2);
export const div3x2 = divTwoDigit("div-3x2", 120, 999, 2);

/* ── 4-1 규칙 찾기 ── */

export const patternArith: Generator = {
  id: "pattern-arith",
  level: 1,
  make(rand) {
    const start = randInt(rand, 1, 200);
    const step = pick(rand, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 20, 25, 50, 100]);
    const down = rand() < 0.3 && start > step * 5;
    const seq = Array.from({ length: 5 }, (_, i) => start + (down ? -1 : 1) * step * i);
    const missing = randInt(rand, 2, 4);
    const shown = seq.map((n, i) => (i === missing ? "□" : String(n))).join(", ");
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${start}:${step}:${down}:${missing}`,
      prompt: "규칙을 찾아 □ 안에 알맞은 수를 써넣으세요.",
      expression: shown,
      answer: seq[missing],
      hint: "이웃한 두 수의 차이를 구해 보세요.",
      explanation: `${step}씩 ${down ? "작아지는" : "커지는"} 규칙이므로 ${seq[missing]}`,
    });
  },
};

export const patternGeo: Generator = {
  id: "pattern-geo",
  level: 2,
  make(rand) {
    const ratio = pick(rand, [2, 3, 5, 10]);
    const start = randInt(rand, 1, ratio === 10 ? 9 : 12);
    const seq = Array.from({ length: 5 }, (_, i) => start * ratio ** i);
    const missing = randInt(rand, 2, 4);
    const shown = seq.map((n, i) => (i === missing ? "□" : String(n))).join(", ");
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${start}:${ratio}:${missing}`,
      prompt: "규칙을 찾아 □ 안에 알맞은 수를 써넣으세요.",
      expression: shown,
      answer: seq[missing],
      hint: "뒤의 수가 앞의 수의 몇 배인지 살펴보세요.",
      explanation: `${ratio}배씩 커지는 규칙이므로 ${seq[missing]}`,
      mistakes: { [seq[missing - 1] + (seq[1] - seq[0])]: "더하는 규칙이 아니라 곱하는 규칙이에요." },
    });
  },
};

export const patternCalc: Generator = {
  id: "pattern-calc",
  level: 2,
  make(rand) {
    const m = pick(rand, [9, 11, 99, 101]);
    const base = randInt(rand, 11, 12);
    const target = randInt(rand, 4, 8);
    const lines = [1, 2, 3].map((k) => `${base * k} × ${m} = ${base * k * m}`).join(",  ");
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${m}:${base}:${target}`,
      prompt: `계산식의 규칙을 찾아 ${base * target} × ${m}의 값을 구하세요.`,
      expression: lines,
      answer: base * target * m,
      hint: `곱해지는 수가 ${base}씩 커지면 곱은 ${base * m}씩 커져요.`,
      explanation: `${base * target} × ${m} = ${base * target * m}`,
    });
  },
};

/* ── 4-2 분수의 덧셈과 뺄셈 ── */

/** 분자 합계를 대분수 표기로: 7/3 → "2 1/3", 6/3 → "2" */
export function mixedText(num: number, d: number): string {
  const w = Math.floor(num / d);
  const r = num % d;
  if (r === 0) return String(w);
  return w === 0 ? `${r}/${d}` : `${w} ${r}/${d}`;
}

/** "2 3/8", "11/8", "3" 같은 분수 글을 값으로 바꾼다 */
export function fractionValue(text: string): number {
  const m = /^(?:(\d+) )?(\d+)\/(\d+)$/.exec(text.trim());
  if (!m) return Number(text);
  return Number(m[1] ?? 0) + Number(m[2]) / Number(m[3]);
}

/** 보기 4개: 값이 정답(또는 다른 보기)과 같은 것은 모양이 달라도 뺀다(예: 1 3/8과 11/8) */
function fractionChoices(rand: () => number, answer: string, distractors: string[], d: number) {
  const seen = [fractionValue(answer)];
  const fresh = (x: string) => {
    const v = fractionValue(x);
    if (!(v > 0) || seen.some((s) => Math.abs(s - v) < 1e-9)) return false;
    seen.push(v);
    return true;
  };
  const wrongs = distractors.filter(fresh);
  for (let i = 0; wrongs.length < 3 && i < 100; i++) {
    const f = mixedText(randInt(rand, 1, d * 4), d);
    if (fresh(f)) wrongs.push(f);
  }
  return makeChoices(rand, answer, wrongs.slice(0, 3), () => answer);
}

export const fracAddProper: Generator = {
  id: "frac-add-proper",
  level: 1,
  make(rand) {
    const d = randInt(rand, 3, 12);
    const a = randInt(rand, 1, d - 1);
    const b = randInt(rand, 1, d - 1);
    const answer = mixedText(a + b, d);
    const wrong = `${a + b}/${d * 2}`;
    return {
      key: `${this.id}:${a}:${b}:${d}`,
      typeId: this.id,
      prompt: "계산해 보세요.",
      expression: `${a}/${d} + ${b}/${d}`,
      input: "choice",
      choices: fractionChoices(rand, answer, [wrong, mixedText(a + b + 1, d), mixedText(a + b - 1, d)], d),
      answer,
      hint: "분모는 그대로 두고 분자끼리 더해요. 가분수가 되면 대분수로 바꿔요.",
      explanation: `${a}/${d} + ${b}/${d} = ${a + b}/${d}${a + b >= d ? ` = ${answer}` : ""}`,
      mistakes: { [wrong]: "분모끼리도 더했어요. 분모는 그대로예요." },
    };
  },
};

export const fracSubProper: Generator = {
  id: "frac-sub-proper",
  level: 1,
  make(rand) {
    const d = randInt(rand, 3, 12);
    const a = randInt(rand, 2, d - 1);
    const b = randInt(rand, 1, a - 1);
    const answer = mixedText(a - b, d);
    return {
      key: `${this.id}:${a}:${b}:${d}`,
      typeId: this.id,
      prompt: "계산해 보세요.",
      expression: `${a}/${d} − ${b}/${d}`,
      input: "choice",
      // 오답은 대표 실수(더함, 1 차이, 빼지 않은 수)로 채워 아무 대분수(3 4/8 등)가 끼지 않게
      choices: fractionChoices(rand, answer, [`${a + b}/${d}`, mixedText(a - b + 1, d), ...(a - b > 1 ? [mixedText(a - b - 1, d)] : []), `${a}/${d}`, `${b}/${d}`, mixedText(a - b + 2, d), mixedText(a - b + 3, d)], d),
      answer,
      hint: "분모는 그대로 두고 분자끼리 빼요.",
      explanation: `${a}/${d} − ${b}/${d} = ${answer}`,
      mistakes: { [`${a + b}/${d}`]: "빼야 하는데 더했어요." },
    };
  },
};

export const fracAddMixed: Generator = {
  id: "frac-add-mixed",
  level: 1,
  make(rand) {
    const d = randInt(rand, 3, 9);
    const x = randInt(rand, 1, 4) * d + randInt(rand, 1, d - 1);
    const y = randInt(rand, 1, 4) * d + randInt(rand, 1, d - 1);
    const answer = mixedText(x + y, d);
    // 분모끼리도 더한 실수(2 5/8 + 1 4/8 → 3 9/16)
    const addDen = `${Math.floor(x / d) + Math.floor(y / d)} ${(x % d) + (y % d)}/${d * 2}`;
    return {
      key: `${this.id}:${x}:${y}:${d}`,
      typeId: this.id,
      prompt: "계산해 보세요.",
      expression: `${mixedText(x, d)} + ${mixedText(y, d)}`,
      input: "choice",
      choices: fractionChoices(rand, answer, [addDen, mixedText(x + y - d, d), mixedText(x + y + 1, d)], d),
      answer,
      hint: "자연수끼리, 분수끼리 더하고 분수 부분이 가분수면 자연수로 받아올려요.",
      explanation: `${mixedText(x, d)} + ${mixedText(y, d)} = ${answer}`,
      mistakes: {
        [addDen]: "분모끼리도 더했어요. 분모는 그대로예요.",
        ...((x % d) + (y % d) >= d ? { [mixedText(x + y - d, d)]: "분수 부분에서 받아올린 1을 자연수 부분에 더하지 않았어요." } : {}),
      },
    };
  },
};

export const fracSubMixed: Generator = {
  id: "frac-sub-mixed",
  level: 2,
  make(rand) {
    // 받아내림 차시: 빼지는 수의 분자가 빼는 수의 분자보다 작다((자연수) − (분수)는 앞 차시)
    const d = randInt(rand, 4, 9);
    const fx = randInt(rand, 1, d - 2);
    const fy = randInt(rand, fx + 1, d - 1);
    const x = randInt(rand, 3, 6) * d + fx;
    const y = randInt(rand, 1, Math.floor(x / d) - 1) * d + fy;
    const answer = mixedText(x - y, d);
    return {
      key: `${this.id}:${x}:${y}:${d}`,
      typeId: this.id,
      prompt: "계산해 보세요.",
      expression: `${mixedText(x, d)} − ${mixedText(y, d)}`,
      input: "choice",
      choices: fractionChoices(rand, answer, [mixedText(x - y + d, d), mixedText(x - y - 1, d), mixedText(x - y + 1, d)], d),
      answer,
      hint: "분수 부분끼리 뺄 수 없으면 자연수 1을 분수로 바꾸어 받아내려요.",
      explanation: `${mixedText(x, d)} − ${mixedText(y, d)} = ${answer}`,
      mistakes: { [mixedText(x - y + d, d)]: "받아내린 1을 자연수 부분에서 빼지 않았어요." },
    };
  },
};

/* ── 4-2 소수의 덧셈과 뺄셈 ── */

/** 정수(1/1000 단위)를 소수 문자열로: 3470 → "3.47" */
const decText = (thousandths: number) => String(Number((thousandths / 1000).toFixed(3)));

export const dec2Compose: Generator = {
  id: "dec2-compose",
  level: 1,
  make(rand) {
    const places = pick(rand, [2, 3]);
    const unit = places === 2 ? "0.01" : "0.001";
    const k = randInt(rand, places === 2 ? 101 : 1001, places === 2 ? 999 : 9999);
    const value = decText(k * (places === 2 ? 10 : 1));
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${places}:${k}`,
      prompt: `${unit}이 ${k}개인 수를 소수로 쓰세요.`,
      answer: value,
      hint: places === 2 ? "0.01이 100개면 1이에요." : "0.001이 1000개면 1이에요.",
      explanation: `${unit} × ${k} = ${value}`,
      mistakes: { [String(k)]: "소수점을 빠뜨렸어요." },
    });
  },
};

export const decPlaceValue: Generator = {
  id: "dec-place-value",
  level: 1,
  make(rand) {
    const k = randInt(rand, 1001, 9999);
    const text = decText(k);
    const digits = String(k);
    const idx = randInt(rand, 1, 3);
    const digit = Number(digits[idx]);
    if (digit === 0 || text.length < 5) return this.make(rand);
    const value = decText(digit * 10 ** (3 - idx));
    const place = ["", "소수 첫째", "소수 둘째", "소수 셋째"][idx];
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${k}:${idx}`,
      prompt: `${text}에서 ${place} 자리 숫자 ${josa(digit, "이/가")} 나타내는 수를 쓰세요.`,
      answer: value,
      hint: "소수 첫째 자리는 0.1, 둘째 자리는 0.01, 셋째 자리는 0.001의 자리예요.",
      explanation: `${digit} × ${["", "0.1", "0.01", "0.001"][idx]} = ${value}`,
      mistakes: { [digit]: "숫자만 썼어요." },
    });
  },
};

export const decCompare2: Generator = {
  id: "dec-compare2",
  level: 1,
  make(rand) {
    // 소수 자리끼리 비교하는 연습: 대부분 자연수 부분(또는 소수 첫째 자리까지)이 같고, 자리 수가 다른 짝과 '='(2.4와 2.40)도 섞는다
    const kind = rand();
    const a = randInt(rand, 1000, 9999);
    let b: number;
    if (kind < 0.1) b = randInt(rand, 1000, 9999);
    else if (kind < 0.55) b = Math.floor(a / 1000) * 1000 + randInt(rand, 0, 999);
    else if (kind < 0.9) b = Math.floor(a / 100) * 100 + randInt(rand, 0, 99);
    else b = Math.floor(a / 100) * 100;
    // 자리 수가 다른 짝: 절반은 b를 소수 두 자리로(내림이라 5.999 → 6처럼 앞자리가 바뀌지 않는다)
    if (kind < 0.9 && rand() < 0.5) b = Math.floor(b / 10) * 10;
    // '='는 소수끼리만(2 ○ 2.0처럼 자연수와 비교하지 않는다)
    if (b === a || b < 1000 || b > 9999 || (kind >= 0.9 && b % 1000 === 0)) return this.make(rand);
    const equal = kind >= 0.9;
    const left = equal ? decText(b) : decText(a);
    // 끝에 0을 붙여 쓴 같은 수(2.4 = 2.40)
    const right = equal ? `${decText(b)}${decText(b).includes(".") ? "" : "."}0` : decText(b);
    const answer = equal ? "=" : sign(a, b);
    return {
      key: `${this.id}:${left}:${right}`,
      typeId: this.id,
      prompt: "○ 안에 >, =, < 중 알맞은 것을 고르세요.",
      expression: `${left} ○ ${right}`,
      input: "choice",
      choices: COMPARE_CHOICES,
      answer,
      hint: "자연수 부분, 소수 첫째, 둘째, 셋째 자리 순서로 비교해요. 자리 수가 많다고 큰 것은 아니에요.",
      explanation: `${left} ${answer} ${right}`,
    };
  },
};

/** 자릿수를 맞추지 않고 오른쪽 끝을 맞춰 계산한 실수 */
function misaligned(a: string, b: string, add: boolean): string {
  const ai = Number(a.replace(".", ""));
  const bi = Number(b.replace(".", ""));
  const places = Math.max((a.split(".")[1] ?? "").length, (b.split(".")[1] ?? "").length);
  return String(Number(((add ? ai + bi : Math.abs(ai - bi)) / 10 ** places).toFixed(places)));
}

function decAddSub(id: string, level: 1 | 2, add: boolean, maxPlaces: 1 | 2 | 3): Generator {
  return {
    id,
    level,
    make(rand) {
      const scale = 10 ** (3 - randInt(rand, 1, maxPlaces));
      const scale2 = 10 ** (3 - randInt(rand, 1, maxPlaces));
      let x = randInt(rand, 1, 99) * 1000 / 10 + randInt(rand, 1, 999);
      let y = randInt(rand, 1, 99) * 1000 / 10 + randInt(rand, 1, 999);
      x = Math.round(x / scale) * scale;
      y = Math.round(y / scale2) * scale2;
      if (!add && x < y) [x, y] = [y, x];
      if (x === y || x === 0 || y === 0) return this.make(rand);
      const a = decText(x);
      const b = decText(y);
      const r = decText(add ? x + y : x - y);
      const wrong = misaligned(a, b, add);
      return numberProblem({
        typeId: id,
        key: `${id}:${x}:${y}`,
        prompt: "계산해 보세요.",
        expression: `${a} ${add ? "+" : "−"} ${b} = □`,
        answer: r,
        hint: "소수점의 자리를 맞추어 세로로 쓰고 같은 자리끼리 계산해요.",
        explanation: `${a} ${add ? "+" : "−"} ${b} = ${r}`,
        mistakes: { [wrong]: "소수점의 자리를 맞추지 않고 끝자리를 맞춰 계산했어요." },
      });
    },
  };
}

export const decAdd1 = decAddSub("dec-add1", 1, true, 1);
export const decSub1 = decAddSub("dec-sub1", 1, false, 1);
// [4수01-16] 소수 두 자리 수의 범위에서 덧셈과 뺄셈
export const decAdd = decAddSub("dec-add", 2, true, 2);
export const decSub = decAddSub("dec-sub", 2, false, 2);
