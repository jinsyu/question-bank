import { makeChoices, pick, randInt, shuffle } from "../../lib/random";
import * as GR from "../generators/graphs";
import * as G5 from "../generators/grade5";
import { dotsScene } from "../generators/pictures";
import { gcd, reduced } from "../generators/grade5";
import type { ShapeScene } from "../types";
import { cuboidNetScene } from "../lessons/g6";
import { twoPlatesScene } from "../lessons/g1-pics";
import { mid, type WordMap } from "./word";
import { josa } from "../josa";
import { jq } from "../lessons/g5-text";
import { POLY_NAMES } from "../generators/geometry";

const trim = (n: number, p = 3) => String(Number(n.toFixed(p)));

/* ── 1학년 ── */

const toNine = mid("m1-to-nine", (rand) => {
  const n = randInt(rand, 2, 8);
  return {
    key: `${n}`,
    prompt: "점이 9개가 되려면 몇 개가 더 있어야 하나요?",
    visual: dotsScene(n),
    answer: 9 - n,
    unit: "개",
    hint: "지금 있는 점을 세고, 9까지 이어 세어 보세요.",
    explanation: `${n}에서 9까지 ${9 - n}개 더`,
  };
});

const countDown = mid("m1-count-down", (rand) => {
  const start = randInt(rand, 5, 9);
  const missing = randInt(rand, 1, 3);
  const seq = Array.from({ length: 5 }, (_, i) => start - i);
  return {
    key: `${start}:${missing}`,
    prompt: "수를 거꾸로 세었습니다. □ 안에 알맞은 수를 써넣으세요.",
    expression: seq.map((n, i) => (i === missing ? "□" : String(n))).join(", "),
    answer: seq[missing],
    hint: "거꾸로 세면 1씩 작아져요.",
    explanation: seq.join(", "),
  };
});

const missing9 = mid("m1-missing9", (rand) => {
  const b = randInt(rand, 3, 9);
  const a = randInt(rand, 1, b - 1);
  const first = rand() < 0.5;
  return {
    key: `${first}:${a}:${b}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: first ? `□ + ${a} = ${b}` : `${a} + □ = ${b}`,
    answer: b - a,
    hint: `${a}에서 ${josa(b, "이/가")} 되려면 몇을 더 세어야 할까요?`,
    explanation: first ? `${b - a} + ${a} = ${b}` : `${a} + ${b - a} = ${b}`,
  };
});

const secondLongest = mid("m1-second-longest", (rand) => {
  const lens = shuffle(rand, [50, 70, 90, 110, 130, 150, 170, 190]).slice(0, 4);
  const marks = ["①", "②", "③", "④"];
  const sorted = [...lens].sort((a, b) => b - a);
  return {
    key: lens.join(),
    prompt: "두 번째로 긴 막대를 고르세요.",
    visual: {
      kind: "shape",
      width: 240,
      height: 150,
      label: "왼쪽 끝을 맞춘 막대 네 개",
      polygons: lens.map((l, i) => ({ fill: true, points: [[34, 12 + i * 34], [34 + l, 12 + i * 34], [34 + l, 32 + i * 34], [34, 32 + i * 34]] as [number, number][] })),
      texts: lens.map((_, i) => ({ at: [16, 22 + i * 34] as [number, number], text: marks[i] })),
    },
    answer: marks[lens.indexOf(sorted[1])],
    choices: marks,
    hint: "가장 긴 막대를 먼저 찾고, 그다음으로 긴 막대를 찾아요.",
    explanation: `긴 순서: ${sorted.map((l) => marks[lens.indexOf(l)]).join(", ")}`,
  };
});

/** 1학년: 자리 이름(십의 자리·일의 자리)은 2-1에서 배우므로 '앞의 숫자·뒤의 숫자'로 말한다 */
function tensSplit(id: string, min: number, max: number) {
  return mid(id, (rand) => {
    const n = randInt(rand, min, max);
    if (n % 10 === 0) return null;
    return {
      key: `${n}`,
      prompt: `${josa(n, "은/는")} 10개씩 묶음 몇 개와 낱개 몇 개인가요?`,
      answer: `${Math.floor(n / 10)},${n % 10}`,
      unit: ["묶음", "개"],
      hint: "앞의 숫자는 10개씩 묶음의 수, 뒤의 숫자는 낱개의 수예요.",
      explanation: `${n} = 10개씩 ${Math.floor(n / 10)}묶음과 낱개 ${n % 10}개`,
    };
  });
}

const tensSplit50 = tensSplit("m1-tens-split50", 11, 49);
/** 99까지의 수 차시: 50까지는 1-1에서 배웠으므로 51~99 */
const tensSplit100 = tensSplit("m1-tens-split100", 51, 99);

const carryMissing = mid("m1-carry-missing", (rand) => {
  const a = randInt(rand, 3, 9);
  const b = randInt(rand, 11, a + 9);
  return {
    key: `${a}:${b}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: `${a} + □ = ${b}`,
    answer: b - a,
    hint: `${a}에 먼저 ${josa(10 - a, "을/를")} 더해 10을 만들고, 나머지를 더 세어 보세요.`,
    explanation: `${a} + ${b - a} = ${b}`,
  };
});

const twoDigitMissing = mid("m1-two-digit-missing", (rand) => {
  const a = randInt(rand, 1, 7) * 10 + randInt(rand, 0, 5);
  const t = randInt(rand, 1, 9 - Math.floor(a / 10));
  const o = randInt(rand, 0, 9 - (a % 10));
  const b = a + t * 10 + o;
  return {
    key: `${a}:${b}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: `${a} + □ = ${b}`,
    answer: b - a,
    // 덧셈 차시: 두 자리 수의 뺄셈은 다음 차시라 '몇을 더해야 하는지'로 구한다
    hint: "낱개끼리, 10개씩 묶음끼리 몇을 더해야 하는지 생각해요.",
    explanation: `${a} + ${b - a} = ${b}`,
  };
});

/* ── 2학년 ── */

function moreLess(id: string, min: number, max: number, steps: number[]) {
  return mid(id, (rand) => {
    const n = randInt(rand, min, max);
    const step = pick(rand, steps);
    const more = rand() < 0.5;
    const r = more ? n + step : n - step;
    if (r < min / 10 || r > max) return null;
    return {
      key: `${n}:${step}:${more}`,
      prompt: `${n}보다 ${step} ${more ? "큰" : "작은"} 수는 얼마인가요?`,
      answer: r,
      hint: `${step}의 자리 숫자가 1 ${more ? "커져요" : "작아져요"}.`,
      explanation: `${n} ${more ? "+" : "−"} ${step} = ${r}`,
    };
  });
}

const moreLess3 = moreLess("m2-more-less3", 110, 890, [1, 10, 100]);
const moreLess4 = moreLess("m2-more-less4", 1100, 8900, [10, 100, 1000]);

const sidesSum = mid("m2-sides-sum", (rand) => {
  const names = ["삼각형", "사각형", "오각형", "육각형"];
  const [a, b] = shuffle(rand, [0, 1, 2, 3]).slice(0, 2);
  return {
    key: `${a}:${b}`,
    prompt: `${names[a]}과(와) ${names[b]}의 변의 수를 더하면 모두 몇 개인가요?`,
    answer: a + 3 + b + 3,
    unit: "개",
    hint: "삼각형은 변이 3개, 사각형은 4개, 오각형은 5개, 육각형은 6개예요.",
    explanation: `${a + 3} + ${b + 3} = ${a + b + 6}(개)`,
  };
});

/**
 * 받아올림 자리 빈칸(4□ + 27 = 72). 덧셈 차시라 □ = 72 − 45 같은 받아내림 뺄셈·덧셈과 뺄셈의 관계(뒤 차시)를 쓰지 않고,
 * 일의 자리 덧셈과 받아올림만으로 푼다
 */
const carryMissing2 = mid("m2-carry-missing", (rand) => {
  const a = randInt(rand, 15, 84);
  const b = randInt(rand, 12, 99 - a);
  if (a % 10 + (b % 10) < 10) return null;
  const s = a + b;
  const blankInA = rand() < 0.5;
  const tens = rand() < 0.5;
  const n = blankInA ? a : b;
  const other = blankInA ? b : a;
  const x = tens ? Math.floor(n / 10) : n % 10;
  const shown = tens ? `□${n % 10}` : `${Math.floor(n / 10)}□`;
  const check = `${a} + ${b} = ${s}`;
  return {
    key: `${a}:${b}:${blankInA}:${tens}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: blankInA ? `${shown} + ${b} = ${s}` : `${a} + ${shown} = ${s}`,
    answer: x,
    hint: "일의 자리부터 계산해요. 일의 자리에서 받아올린 1을 십의 자리 계산에 더해요.",
    explanation: tens
      ? `일의 자리에서 1을 받아올렸으므로 십의 자리는 1 + □ + ${Math.floor(other / 10)} = ${Math.floor(s / 10)}, □ = ${x} (${check})`
      : `일의 자리 □ + ${other % 10}의 일의 자리 숫자가 ${s % 10}이므로 □ + ${other % 10} = ${10 + (s % 10)}, □ = ${x} (${check})`,
    mistakes: tens && x < 9 ? { [x + 1]: "일의 자리에서 받아올린 1을 빠뜨렸어요." } : undefined,
  };
});

const rulerFromTo = mid("m2-ruler-from-to", (rand) => {
  const a = randInt(rand, 1, 8);
  const b = randInt(rand, a + 3, 20);
  return {
    key: `${a}:${b}`,
    prompt: `색 테이프의 한쪽 끝이 자의 눈금 ${a}에, 다른 쪽 끝이 눈금 ${b}에 있습니다. 색 테이프의 길이는 몇 cm인가요?`,
    answer: b - a,
    unit: "cm",
    hint: `${a}부터 ${b}까지 1 cm가 몇 번 들어가는지 세어요.`,
    explanation: `${b} − ${a} = ${b - a}(cm)`,
    mistakes: { [b]: "끝 눈금을 그대로 읽었어요." },
  };
});

const wingsCount = mid("m2-wings-count", (rand) => {
  const withWings = ["참새", "나비", "잠자리", "독수리", "벌"];
  const without = ["강아지", "고양이", "금붕어", "토끼", "거북"];
  const k = randInt(rand, 1, 4);
  const items = shuffle(rand, [...shuffle(rand, withWings).slice(0, k), ...shuffle(rand, without).slice(0, 6 - k)]);
  return {
    key: items.join(),
    prompt: `${items.join(", ")}을(를) 날개가 있는 것과 없는 것으로 분류했습니다. 날개가 있는 것은 몇 가지인가요?`,
    answer: k,
    unit: "가지",
    hint: "하나씩 날개가 있는지 확인하며 표시해요.",
    explanation: `날개가 있는 것: ${items.filter((i) => withWings.includes(i)).join(", ")}`,
  };
});

const timesDiff = mid("m2-times-diff", (rand) => {
  const a = randInt(rand, 2, 9);
  // 곱셈 기호를 배우기 전(몇의 몇 배 차시)이라 같은 수를 여러 번 더해 구한다. 6배까지만
  const b = randInt(rand, 3, 6);
  const c = randInt(rand, 2, b - 1);
  return {
    key: `${a}:${b}:${c}`,
    prompt: `${a}의 ${b}배는 ${a}의 ${c}배보다 얼마나 더 큰가요?`,
    answer: a * (b - c),
    hint: `${a}의 ${b}배와 ${a}의 ${c}배를 각각 구해 빼요.`,
    explanation: `${a * b} − ${a * c} = ${a * (b - c)}`,
  };
});

const nextTimes = mid("m2-next-times", (rand) => {
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, 1, 8);
  return {
    key: `${a}:${b}`,
    prompt: `${a} × ${b}보다 ${a}만큼 더 큰 수는 ${a} × □입니다. □ 안에 알맞은 수를 쓰세요.`,
    answer: b + 1,
    hint: `${a}단은 곱하는 수가 1 커질 때마다 ${a}씩 커져요.`,
    explanation: `${a} × ${b} = ${a * b}, ${a * b} + ${a} = ${a * (b + 1)}, ${a} × ${b + 1} = ${a * (b + 1)} → □ = ${b + 1}`,
  };
});

const longerCm = mid("m2-longer-cm", (rand) => {
  const m = randInt(rand, 1, 5);
  const cm = randInt(rand, 5, 60);
  const add = randInt(rand, 10, 39);
  return {
    key: `${m}:${cm}:${add}`,
    prompt: `${m} m ${cm} cm보다 ${add} cm 더 긴 길이는 몇 cm인가요?`,
    answer: m * 100 + cm + add,
    unit: "cm",
    hint: "먼저 m를 cm로 바꿔요. 1 m = 100 cm",
    explanation: `${m * 100 + cm} + ${add} = ${m * 100 + cm + add}(cm)`,
  };
});

const minutesBefore = mid("m2-minutes-before", (rand) => {
  const h = randInt(rand, 1, 11);
  const m = randInt(rand, 9, 11) * 5;
  return {
    key: `${h}:${m}`,
    prompt: `${h}시 ${m}분은 ${h + 1}시 몇 분 전인가요?`,
    answer: 60 - m,
    unit: "분",
    hint: `${h + 1}시까지 몇 분이 남았는지 생각해요.`,
    explanation: `60 − ${m} = ${60 - m} → ${h + 1}시 ${60 - m}분 전`,
  };
});

const graphMostLeast = mid("m2-graph-most-least", (rand) => {
  const kinds = shuffle(rand, ["사과", "귤", "포도", "배", "딸기"]).slice(0, 4);
  const values = shuffle(rand, [1, 2, 3, 4, 5, 6, 7]).slice(0, 4);
  return {
    key: `${kinds.join()}:${values.join()}`,
    prompt: "좋아하는 과일을 ○로 나타낸 그래프입니다. 가장 많은 과일과 가장 적은 과일의 학생 수의 차는 몇 명인가요?",
    visual: { kind: "table", header: ["과일", "학생 수"], rows: kinds.map((k, i) => [k, "○".repeat(values[i])]) },
    answer: Math.max(...values) - Math.min(...values),
    unit: "명",
    hint: "○가 가장 많은 줄과 가장 적은 줄을 찾아요.",
    explanation: `${Math.max(...values)} − ${Math.min(...values)} = ${Math.max(...values) - Math.min(...values)}(명)`,
  };
});

const repeatLength = mid("m2-repeat-length", (rand) => {
  const unit = shuffle(rand, ["○", "△", "☆", "◇"]).slice(0, randInt(rand, 2, 4));
  return {
    key: unit.join(""),
    prompt: "규칙에서 되풀이되는 부분은 모양 몇 개로 이루어져 있나요?",
    expression: [...unit, ...unit, ...unit].join(" "),
    answer: unit.length,
    unit: "개",
    hint: "처음 모양이 다시 나오는 곳을 찾아요.",
    explanation: `${unit.join(" ")}이(가) 되풀이 → ${unit.length}개`,
  };
});

/* ── 3학년 ── */

const mulMissing = mid("m3-mul-missing", (rand) => {
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, 2, 9);
  return {
    key: `${a}:${b}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: `${a} × □ = ${a * b}`,
    answer: b,
    hint: `${a * b} ÷ ${josa(a, "을/를")} 곱셈구구로 구해요.`,
    explanation: `${a * b} ÷ ${a} = ${b}`,
  };
});

const tensMissing = mid("m3-tens-missing", (rand) => {
  const a = randInt(rand, 2, 9) * 10;
  const b = randInt(rand, 2, 9);
  return {
    key: `${a}:${b}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: `${a} × □ = ${a * b}`,
    answer: b,
    hint: `${a / 10} × □ = ${josa((a * b) / 10, "을/를")} 생각해요.`,
    explanation: `${a} × ${b} = ${a * b}`,
  };
});

const threeByOneMissing = mid("m3-3x1-missing", (rand) => {
  const a = randInt(rand, 102, 499);
  const b = randInt(rand, 2, 9);
  return {
    key: `${a}:${b}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: `${a} × □ = ${a * b}`,
    answer: b,
    hint: "일의 자리끼리의 곱으로 □를 어림해 보세요.",
    explanation: `${a} × ${b} = ${a * b}`,
  };
});

const divReverse = mid("m3-div-reverse", (rand) => {
  const b = randInt(rand, 2, 6);
  const q = randInt(rand, 11, Math.floor(99 / b));
  return {
    key: `${b}:${q}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: `□ ÷ ${b} = ${q}`,
    answer: b * q,
    hint: "나눗셈식을 곱셈식으로 바꿔요: □ = 몫 × 나누는 수",
    explanation: `${q} × ${b} = ${b * q}`,
  };
});

const tableDiff = mid("m3-table-diff", (rand) => {
  const labels = shuffle(rand, ["사과", "배", "포도", "귤", "딸기"]).slice(0, 4);
  const vals = shuffle(rand, Array.from({ length: 15 }, (_, i) => i + 2)).slice(0, 4);
  return {
    key: `${labels.join()}:${vals.join()}`,
    prompt: "좋아하는 과일을 조사하여 표로 나타냈습니다. 가장 많은 학생이 좋아하는 과일과 가장 적은 학생이 좋아하는 과일의 학생 수의 차는 몇 명인가요?",
    visual: { kind: "table", header: labels, rows: [vals.map(String)] },
    answer: Math.max(...vals) - Math.min(...vals),
    unit: "명",
    hint: "표에서 가장 큰 수와 가장 작은 수를 찾아 빼요.",
    explanation: `${Math.max(...vals)} − ${Math.min(...vals)} = ${Math.max(...vals) - Math.min(...vals)}(명)`,
  };
});

/* ── 4학년 ── */

const fracNumMissing = mid("m4-frac-num-missing", (rand) => {
  const d = randInt(rand, 5, 12);
  const a = randInt(rand, 1, d - 2);
  const b = randInt(rand, a + 1, d - 1);
  return {
    key: `${d}:${a}:${b}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: `${a}/${d} + □/${d} = ${b}/${d}`,
    answer: b - a,
    hint: "분모가 같으니 분자끼리의 덧셈식으로 생각해요.",
    explanation: `${a} + ${b - a} = ${b}`,
  };
});

const decPlusStep = mid("m4-dec-plus-step", (rand) => {
  const k = randInt(rand, 1001, 9999);
  const step = pick(rand, [0.1, 0.01, 0.001]);
  const v = Number((k / 1000 + step).toFixed(3));
  return {
    key: `${k}:${step}`,
    prompt: `${k / 1000}보다 ${step} 큰 수는 얼마인가요?`,
    answer: String(v),
    hint: `${step}의 자리 숫자가 1 커져요. 받아올림에 주의해요.`,
    explanation: `${k / 1000} + ${step} = ${v}`,
  };
});

/* ── 5학년 ── */

const parenDiff = mid("m5-paren-diff", (rand) => {
  const a = randInt(rand, 2, 20);
  const b = randInt(rand, 2, 9);
  const c = randInt(rand, 2, 9);
  const with_ = (a + b) * c;
  const without = a + b * c;
  return {
    key: `${a}:${b}:${c}`,
    prompt: `(${a} + ${b}) × ${jq(c, "과/와")} ${a} + ${b} × ${c}의 계산 결과의 차는 얼마인가요?`,
    answer: with_ - without,
    hint: "( )가 있으면 ( ) 안을 먼저, 없으면 곱셈을 먼저 계산해요.",
    explanation: `${with_} − ${without} = ${with_ - without}`,
  };
});

const twoBiggestDivisors = mid("m5-two-divisors", (rand) => {
  const n = randInt(rand, 12, 60);
  const ds = Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0);
  if (ds.length < 3) return null;
  return {
    key: `${n}`,
    prompt: `${n}의 약수 중에서 가장 큰 수와 두 번째로 큰 수의 합은 얼마인가요?`,
    answer: ds[ds.length - 1] + ds[ds.length - 2],
    hint: "가장 큰 약수는 자기 자신이에요.",
    explanation: `${ds[ds.length - 1]} + ${ds[ds.length - 2]} = ${ds[ds.length - 1] + ds[ds.length - 2]}`,
  };
});

const correspondReverse = mid("m5-correspond-reverse", (rand) => {
  const k = randInt(rand, 2, 9);
  const x = randInt(rand, 6, 20);
  return {
    key: `${k}:${x}`,
    prompt: `○와 △ 사이의 대응 관계는 △ = ○ × ${k}입니다. △가 ${x * k}일 때 ○는 얼마인가요?`,
    answer: x,
    hint: "곱셈식을 나눗셈식으로 바꾸어 구해요.",
    explanation: `${x * k} ÷ ${k} = ${x}`,
  };
});

const reduceBy = mid("m5-reduce-by", (rand) => {
  const g = randInt(rand, 2, 9);
  const d = randInt(rand, 3, 9);
  const n = randInt(rand, 1, d - 1);
  if (gcd(n, d) !== 1) return null;
  return {
    key: `${g}:${n}:${d}`,
    prompt: `${jq(`${n * g}/${d * g}`, "을/를")} 한 번에 기약분수로 약분하려면 분모와 분자를 얼마로 나누어야 하나요?`,
    answer: g,
    hint: "분모와 분자의 최대공약수로 나누어요.",
    explanation: `${jq(n * g, "과/와")} ${d * g}의 최대공약수 ${g}`,
  };
});

const threeTerms = mid("m5-three-terms", (rand) => {
  const d = pick(rand, [6, 8, 10, 12, 15, 18, 20]);
  const parts = [2, 3, 4, 5, 6].filter((x) => d % x === 0);
  const [a, b] = shuffle(rand, parts).slice(0, 2);
  const na = randInt(rand, 1, a - 1);
  const nb = randInt(rand, 1, b - 1);
  const nc = randInt(rand, 1, d - 1);
  // 문제 식의 분수는 기약분수로(2/6, 3/6 같은 표기가 나오지 않게)
  if (gcd(na, a) !== 1 || gcd(nb, b) !== 1 || gcd(nc, d) !== 1) return null;
  const sum2 = na * (d / a) + nb * (d / b);
  const r = sum2 - nc;
  if (r <= 0) return null;
  const answer = reduced(r, d);
  // 오답: 빼지 않고 모두 더함, 마지막 수를 빼지 않음(앞의 두 수만 더함), 통분할 때 분자를 그대로 둠. 자연수가 되는 오답은 쓰지 않는다
  const wrong = [reduced(sum2 + nc, d), reduced(sum2, d), na + nb > nc ? reduced(na + nb - nc, d) : ""].filter((c) => c && c.includes("/"));
  const choices = makeChoices(rand, answer, wrong, () => reduced(randInt(rand, 1, d * 2 - 1), d));
  if (choices.some((c) => !c.includes("/"))) return null;
  return {
    key: `${na}/${a}:${nb}/${b}:${nc}/${d}`,
    prompt: "계산하여 기약분수로 나타낸 것을 고르세요.",
    expression: `${na}/${a} + ${nb}/${b} − ${nc}/${d}`,
    answer,
    choices,
    hint: `세 분모의 공통분모 ${jq(d, "으로/로")} 통분해 앞에서부터 계산해요.`,
    explanation: `${na * (d / a)}/${d} + ${nb * (d / b)}/${d} − ${nc}/${d} = ${r}/${d}${`${r}/${d}` === answer ? "" : ` = ${answer}`}`,
  };
});

const largestInRange = mid("m5-largest-in-range", (rand) => {
  const lo = randInt(rand, 10, 80);
  const hi = lo + randInt(rand, 3, 15);
  const word = pick(rand, ["미만", "이하"]);
  return {
    key: `${lo}:${hi}:${word}`,
    prompt: `${lo} 이상 ${hi} ${word}인 자연수 중에서 가장 큰 수는 얼마인가요?`,
    answer: word === "미만" ? hi - 1 : hi,
    hint: "미만은 그 수를 포함하지 않고, 이하는 포함해요.",
    explanation: `가장 큰 수: ${word === "미만" ? hi - 1 : hi}`,
  };
});

const roundSmallest = mid("m5-round-smallest", (rand) => {
  const n = randInt(rand, 12, 98) * 100;
  return {
    key: `${n}`,
    prompt: `어떤 자연수를 반올림하여 백의 자리까지 나타내었더니 ${jq(n, "이/가")} 되었습니다. 어떤 수가 될 수 있는 수 중 가장 작은 수는 얼마인가요?`,
    answer: n - 50,
    hint: "십의 자리가 5 이상이면 올림, 4 이하면 버림이에요.",
    explanation: `${n - 50}부터 ${n + 49}까지 → 가장 작은 수 ${n - 50}`,
  };
});

const wholeTimesFrac = mid("m5-whole-times-frac", (rand) => {
  const d = randInt(rand, 2, 9);
  const n = randInt(rand, 1, d - 1);
  // 곱하는 분수는 기약분수로(12 × 2/6 같은 표기가 나오지 않게)
  if (gcd(n, d) !== 1) return null;
  const k = d * randInt(rand, 2, 6);
  return {
    key: `${k}:${n}/${d}`,
    prompt: "계산해 보세요.",
    expression: `${k} × ${n}/${d} = □`,
    answer: (k / d) * n,
    hint: `${jq(k, "을/를")} ${jq(d, "으로/로")} 나눈 뒤 ${jq(n, "을/를")} 곱해요.`,
    explanation: `${k} ÷ ${d} × ${n} = ${(k / d) * n}`,
  };
});

/** 응용: 받아올림이 많은 (두 자리 수) × (소수 두 자리 수) — 기본(l5-dm-wd)보다 한 단계 어렵게 */
const wholeTimesDec = mid("m5-whole-times-dec", (rand) => {
  const k = randInt(rand, 12, 69);
  const x = randInt(rand, 11, 99);
  if (k % 10 === 0 || x % 10 === 0) return null;
  const d = x / 100;
  return {
    key: `${k}:${x}`,
    prompt: "계산해 보세요.",
    expression: `${k} × ${trim(d, 2)} = □`,
    answer: trim(k * d, 2),
    hint: "자연수처럼 곱하고, 소수의 소수점 아래 자리 수(두 자리)만큼 소수점을 찍어요.",
    explanation: `${k} × ${x} = ${k * x} → ${trim(k * d, 2)}`,
    mistakes: { [String(k * x)]: "소수점을 찍지 않았어요.", [trim((k * x) / 10, 1)]: "소수점을 한 자리만 옮겼어요." },
  };
});

const meanTotal = mid("m5-mean-total", (rand) => {
  const n = randInt(rand, 3, 6);
  const m = randInt(rand, 10, 90);
  return {
    key: `${n}:${m}`,
    prompt: `${n}명의 몸무게의 평균이 ${m} kg입니다. ${n}명의 몸무게의 합은 몇 kg인가요?`,
    answer: n * m,
    unit: "kg",
    hint: "평균 × 자료의 수 = 자료의 합",
    explanation: `${m} × ${n} = ${m * n}(kg)`,
  };
});

/* ── 6학년 ── */

/** 몫을 기약분수로 나타낸 식에서 나누어지는 수 찾기(크기가 같은 분수를 떠올려야 한다) */
const divToFracReverse = mid("m6-div-frac-reverse", (rand) => {
  const b = randInt(rand, 4, 12);
  const a = randInt(rand, 2, b - 1);
  const g = gcd(a, b);
  if (g === 1) return null;
  return {
    key: `${a}:${b}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: `□ ÷ ${b} = ${a / g}/${b / g}`,
    answer: a,
    hint: `□ ÷ ${b}의 몫은 분모가 ${b}인 분수로 나타낼 수 있어요. 분모가 ${b}이면서 크기가 ${a / g}/${b / g}인 분수를 찾아요.`,
    explanation: `${a / g}/${b / g} = ${a}/${b}이므로 □ = ${a}`,
    mistakes: { [a / g]: "기약분수의 분자를 그대로 썼어요." },
  };
});

const pyramidEdges = mid("m6-pyramid-edges", (rand) => {
  const n = randInt(rand, 3, 9);
  return {
    key: `${n}`,
    prompt: `꼭짓점이 ${n + 1}개인 각뿔의 모서리는 몇 개인가요?`,
    answer: 2 * n,
    unit: "개",
    hint: "각뿔의 꼭짓점 수 = 밑면의 변의 수 + 1",
    explanation: `밑면 ${POLY_NAMES[n]} → 모서리 ${n} × 2 = ${2 * n}(개)`,
  };
});

const decDivReverse = mid("m6-dec-div-reverse", (rand) => {
  const k = randInt(rand, 2, 9);
  const q = randInt(rand, 11, 99) / 10;
  return {
    key: `${k}:${q}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: `□ ÷ ${k} = ${q}`,
    answer: trim(q * k, 1),
    hint: "□ = 몫 × 나누는 수",
    explanation: `${q} × ${k} = ${trim(q * k, 1)}`,
  };
});

const compareAmount = mid("m6-compare-amount", (rand) => {
  const base = pick(rand, [20, 40, 50, 80, 200, 500]);
  const r = pick(rand, [0.1, 0.2, 0.25, 0.4, 0.5, 0.6, 0.75]);
  const v = base * r;
  if (!Number.isInteger(v)) return null;
  return {
    key: `${base}:${r}`,
    prompt: `기준량이 ${base}이고 비율이 ${r}일 때 비교하는 양은 얼마인가요?`,
    answer: v,
    hint: "비교하는 양 = 기준량 × 비율",
    explanation: `${base} × ${r} = ${v}`,
  };
});

const toPercent = mid("m6-to-percent", (rand) => {
  const total = pick(rand, [20, 25, 40, 50, 200]);
  const part = randInt(rand, 1, total - 1);
  const p = (part / total) * 100;
  if (!Number.isInteger(p)) return null;
  return {
    key: `${total}:${part}`,
    prompt: `전체 ${total}명 중 ${part}명이 찬성했습니다. 찬성한 사람은 전체의 몇 %인가요?`,
    answer: p,
    unit: "%",
    hint: "(찬성한 사람 수) ÷ (전체) × 100",
    explanation: `${part} ÷ ${total} × 100 = ${p}(%)`,
  };
});

const decDecReverse = mid("m6-dec-dec-reverse", (rand) => {
  const b = randInt(rand, 2, 9) / 10;
  const q = randInt(rand, 3, 25);
  return {
    key: `${b}:${q}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: `□ ÷ ${b} = ${q}`,
    answer: trim(b * q, 1),
    hint: "□ = 몫 × 나누는 수",
    explanation: `${q} × ${b} = ${trim(b * q, 1)}`,
  };
});

const simpleRatio = mid("m6-simple-ratio", (rand) => {
  const a = randInt(rand, 1, 9);
  let b = randInt(rand, 1, 9);
  if (a === b) b = (b % 9) + 1;
  const g = gcd(a, b);
  const x = a / g;
  const y = b / g;
  const k = pick(rand, [0.1, 10]);
  const left = trim(a * (k === 0.1 ? 0.1 : 10), 1);
  const right = trim(b * (k === 0.1 ? 0.1 : 10), 1);
  const answer = `${x} : ${y}`;
  return {
    key: `${a}:${b}:${k}`,
    prompt: `${josa(`${left} : ${right}`, "을/를")} 가장 간단한 자연수의 비로 나타낸 것을 고르세요.`,
    answer,
    // 전항과 후항이 같은 보기(7 : 7)는 쓰지 않는다
    choices: shuffle(rand, [...new Set([answer, `${y} : ${x}`, `${a} : ${b + 1}`, `${x + 1} : ${y}`, `${x} : ${y + 1}`, `${x + 2} : ${y}`])].filter((c) => { const [l, r] = c.split(" : "); return l !== r; }).slice(0, 4)),
    hint: "비의 전항과 후항에 같은 수를 곱하거나 나누어도 비율은 같아요.",
    explanation: `${left} : ${right} = ${a} : ${b} = ${answer}`,
  };
});

export const mids: WordMap = {
  "g1-s1-numbers9": { count9: [toNine], order9: [countDown] },
  "g1-s1-add-sub": { addsub9: [missing9] },
  "g1-s1-compare": { length: [secondLongest] },
  "g1-s1-numbers50": { tens50: [tensSplit50] },
  "g1-s2-numbers100": { tens100: [tensSplit100] },
  "g1-s2-add-sub": { ten: [carryMissing], "two-digit": [twoDigitMissing] },
  "g2-s1-numbers3": { read3: [moreLess3] },
  "g2-s1-shapes": { polygons2: [sidesSum] },
  "g2-s1-add-sub": { carry2: [carryMissing2] },
  "g2-s1-length": { ruler: [rulerFromTo] },
  "g2-s1-classify": { classify: [wingsCount] },
  "g2-s1-multiplication": { groups: [timesDiff] },
  "g2-s2-numbers4": { read4: [moreLess4] },
  "g2-s2-times-tables": { tables: [nextTimes] },
  "g2-s2-length-m": { "m-cm": [longerCm] },
  "g2-s2-time": { "clock-min": [minutesBefore] },
  "g2-s2-table-graph": { "graph-o": [graphMostLeast] },
  "g2-s2-patterns": { "shape-pattern": [repeatLength] },
  "g3-s1-division": { "div-mul": [mulMissing] },
  "g3-s1-multiplication": { "mul-tens": [tensMissing] },
  "g3-s2-multiplication": { "mul-3x1": [threeByOneMissing] },
  "g3-s2-division": { "div-no-rem": [divReverse] },
  "g3-s2-data": { "data-table": [tableDiff] },
  "g4-s1-bar-graph": { "bar-read": [GR.barSecond] },
  "g4-s2-fraction-add-sub": { "frac-proper": [fracNumMissing] },
  "g4-s2-decimal-add-sub": { "dec-places": [decPlusStep] },
  "g4-s2-line-graph": { "line-read": [GR.lineMax] },
  "g5-s1-mixed-calc": { order: [parenDiff] },
  "g5-s1-factors": { divisors: [twoBiggestDivisors] },
  "g5-s1-correspondence": { table: [correspondReverse] },
  "g5-s1-reduce-common": { reduce: [reduceBy] },
  "g5-s1-frac-add-sub": { proper: [threeTerms] },
  "g5-s2-range-rounding": { range: [largestInRange], round: [roundSmallest] },
  "g5-s2-frac-mul": { "times-whole": [wholeTimesFrac] },
  "g5-s2-dec-mul": { "dec-whole": [wholeTimesDec] },
  "g5-s2-average": { mean: [meanTotal] },
  "g6-s1-frac-div": { "whole-whole": [divToFracReverse] },
  "g6-s1-prisms": { parts: [pyramidEdges] },
  "g6-s1-dec-div": { "dec-whole": [decDivReverse] },
  "g6-s1-ratio": { ratio: [compareAmount] },
  "g6-s1-graphs": { "band-circle": [toPercent] },
  "g6-s2-dec-div": { "dec-dec": [decDecReverse] },
  "g6-s2-proportion": { proportion: [simpleRatio] },
};

/* ── 하(기본): 기본 유형이 없던 단계 ── */

const easy = (id: string, make: Parameters<typeof mid>[1]) => {
  const g = mid(id, make);
  return { ...g, level: 1 as const };
};

const gather9 = easy("e1-gather9", (rand) => {
  const a = randInt(rand, 1, 7);
  const b = randInt(rand, 1, 9 - a);
  return {
    key: `${a}:${b}`,
    prompt: `${josa(a, "과/와")} ${josa(b, "을/를")} 모으면 얼마가 되나요?`,
    // 두 수가 구분되게 접시 두 개에 따로 담는다(한 틀에 a + b개를 그리면 모으기가 아니라 세기가 된다)
    visual: twoPlatesScene(a, b),
    answer: a + b,
    hint: "왼쪽 접시의 ●를 센 다음, 오른쪽 접시의 ●를 이어 세어 보세요.",
    explanation: `${josa(a, "과/와")} ${josa(b, "을/를")} 모으면 ${a + b}`,
  };
});

const countCells = easy("e1-count-cells", (rand) => {
  const n = randInt(rand, 3, 9);
  const cell = 20;
  return {
    key: `${n}`,
    prompt: "같은 크기의 칸 몇 개로 만든 모양인가요?",
    visual: {
      kind: "shape",
      width: 100,
      height: 80,
      label: `칸 ${n}개로 만든 모양`,
      polygons: Array.from({ length: n }, (_, i) => {
        const x = 10 + (i % 4) * cell;
        const y = 10 + Math.floor(i / 4) * cell;
        return { fill: true, points: [[x, y], [x + cell, y], [x + cell, y + cell], [x, y + cell]] as [number, number][] };
      }),
    },
    answer: n,
    unit: "칸",
    hint: "칸을 하나씩 세어요.",
    explanation: `${n}칸`,
  };
});

const countOnByOne = easy("e1-count-on", (rand) => {
  const start = randInt(rand, 10, 95);
  return {
    key: `${start}`,
    prompt: "1씩 커지는 규칙입니다. □ 안에 알맞은 수를 써넣으세요.",
    expression: `${start}, ${start + 1}, ${start + 2}, □`,
    answer: start + 3,
    hint: "바로 다음 수를 써요.",
    explanation: `${start + 2} 다음은 ${start + 3}`,
  };
});

const mCmNoCarry = easy("e2-m-cm-add", (rand) => {
  const a = randInt(rand, 1, 5);
  const b = randInt(rand, 10, 60);
  const c = randInt(rand, 1, 4);
  const d = randInt(rand, 10, 99 - b);
  return {
    key: `${a}:${b}:${c}:${d}`,
    prompt: "계산해 보세요.",
    expression: `${a} m ${b} cm + ${c} m ${d} cm = □ m □ cm`,
    answer: `${a + c},${b + d}`,
    unit: ["m", "cm"],
    hint: "m는 m끼리, cm는 cm끼리 더해요.",
    explanation: `${a + c} m ${b + d} cm`,
  };
});

const hoursToMin = easy("e2-hours-min", (rand) => {
  const h = randInt(rand, 1, 5);
  return {
    key: `${h}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: `${h}시간 = □분`,
    answer: h * 60,
    hint: "1시간은 60분이에요.",
    explanation: `60 × ${h} = ${h * 60}`,
  };
});

const skipByK = easy("e2-skip-k", (rand) => {
  const k = randInt(rand, 2, 9);
  const start = k * randInt(rand, 1, 4);
  return {
    key: `${k}:${start}`,
    prompt: "곱셈표의 한 줄입니다. 규칙에 따라 □ 안에 알맞은 수를 써넣으세요.",
    expression: `${start}, ${start + k}, ${start + 2 * k}, □`,
    answer: start + 3 * k,
    hint: `${k}씩 커지고 있어요.`,
    explanation: `${start + 2 * k} + ${k} = ${start + 3 * k}`,
  };
});

const compareImproper = easy("e3-compare-improper", (rand) => {
  const d = randInt(rand, 2, 9);
  const a = randInt(rand, d, d * 3);
  // 글자까지 똑같은 두 분수(10/6 ○ 10/6)는 내지 않는다. '='는 frac-compare-mixed(가분수 ↔ 대분수)가 맡는다
  let b = randInt(rand, d, d * 3);
  while (b === a) b = randInt(rand, d, d * 3);
  return {
    key: `${a}:${b}:${d}`,
    prompt: "○ 안에 >, =, < 중 알맞은 것을 고르세요.",
    expression: `${a}/${d} ○ ${b}/${d}`,
    answer: a > b ? ">" : a < b ? "<" : "=",
    choices: [">", "<", "="],
    hint: "분모가 같으면 분자가 클수록 커요.",
    explanation: `${a}/${d} ${a > b ? ">" : a < b ? "<" : "="} ${b}/${d}`,
  };
});

const unitTimesUnit = easy("e5-unit-times", (rand) => {
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, 2, 9);
  const answer = `1/${a * b}`;
  const choices = makeChoices(rand, answer, [`1/${a + b}`, `2/${a * b}`, `1/${a * b + 1}`], () => `1/${randInt(rand, 4, 81)}`);
  return {
    key: `${a}:${b}`,
    prompt: "계산한 값을 고르세요.",
    expression: `1/${a} × 1/${b}`,
    answer,
    choices,
    hint: "분자끼리, 분모끼리 곱해요.",
    explanation: `1/${a} × 1/${b} = ${answer}`,
  };
});

const tenthsTimes = easy("e5-tenths-times", (rand) => {
  const a = randInt(rand, 1, 9);
  const b = randInt(rand, 1, 9);
  return {
    key: `${a}:${b}`,
    prompt: "계산해 보세요.",
    expression: `0.${a} × 0.${b} = □`,
    answer: trim((a * b) / 100, 2),
    hint: "자연수처럼 곱하고, 소수점 아래 두 자리가 되게 소수점을 찍어요.",
    explanation: `${a} × ${b} = ${a * b} → ${trim((a * b) / 100, 2)}`,
  };
});

const smallLcm = easy("e5-small-lcm", (rand) => {
  const a = randInt(rand, 2, 6);
  let b = randInt(rand, 2, 6);
  if (a === b) b = a === 6 ? 5 : a + 1;
  const l = (a * b) / gcd(a, b);
  return {
    key: `${a}:${b}`,
    prompt: `${a}의 배수이면서 ${b}의 배수인 수 중에서 가장 작은 수는 얼마인가요?`,
    answer: l,
    hint: `${a}의 배수를 차례로 쓰고, 그중 ${jq(b, "으로/로")} 나누어떨어지는 첫 수를 찾아요.`,
    explanation: `${jq(a, "과/와")} ${b}의 최소공배수 ${l}`,
  };
});

const certainImpossible = easy("e5-certain", (rand) => {
  const f = pick(rand, [
    { q: "내일 해가 서쪽에서 뜰 가능성", a: "0" },
    { q: "주사위를 굴려 0의 눈이 나올 가능성", a: "0" },
    { q: "1부터 6까지의 수가 적힌 주사위를 굴려 6 이하의 눈이 나올 가능성", a: "1" },
    { q: "흰 공만 들어 있는 주머니에서 흰 공을 꺼낼 가능성", a: "1" },
    { q: "동전을 던져 숫자 면이 나올 가능성", a: "1/2" },
  ]);
  return {
    key: f.q,
    prompt: `${jq(f.q, "을/를")} 수로 나타낸 것을 고르세요.`,
    answer: f.a,
    choices: ["0", "1/2", "1"],
    hint: "불가능하면 0, 반반이면 1/2, 확실하면 1이에요.",
    explanation: `${f.a}입니다.`,
  };
});

/** 분자가 나누는 수의 배수가 아닌 (진분수)÷(자연수): × 1/(자연수)로 바꾸어 계산한다. 보기는 모두 기약분수로 적어 값이 같은 보기가 생기지 않는다 */
const fracDivEasy = easy("e6-frac-div-easy", (rand) => {
  const k = randInt(rand, 2, 5);
  const d = randInt(rand, 3, 9);
  const n = randInt(rand, 1, d - 1);
  if (gcd(n, d) !== 1 || gcd(n, k) !== 1) return null;
  const answer = reduced(n, d * k);
  const set = new Set([answer, reduced(n * k, d), reduced(n, d + k), reduced(n, d)]);
  for (let i = 0; set.size < 4 && i < 40; i++) set.add(reduced(randInt(rand, 1, d * k), d * k));
  return {
    key: `${n}/${d}:${k}`,
    prompt: "계산한 값을 고르세요.",
    expression: `${n}/${d} ÷ ${k}`,
    answer,
    choices: shuffle(rand, [...set]),
    hint: "÷ (자연수)는 × 1/(자연수)로 바꾸어 계산해요.",
    explanation: `${n}/${d} ÷ ${k} = ${n}/${d} × 1/${k} = ${answer}`,
  };
});

const POLY_NAME = ["", "", "", "삼", "사", "오", "육"];

/** 각기둥 겨냥도: 밑면을 비스듬히 본 정다각형으로 그리고, 보이지 않는 모서리는 점선 */
export function prismSketch(n: number): ShapeScene {
  const [cx, rx, ry, bottom, top] = [120, 70, 22, 150, 50];
  // 사각기둥·육각기둥은 그대로 두면 앞뒤 모서리가 겹쳐 보이므로 조금 돌린다
  const phi = Math.PI / 2 - Math.PI / n + (n === 4 ? 0.4 : n === 6 ? 0.25 : 0);
  const angle = (i: number) => phi + (2 * Math.PI * i) / n;
  const at = (i: number, y: number): [number, number] => [Math.round(cx + rx * Math.cos(angle(i))), Math.round(y + ry * Math.sin(angle(i)))];
  // 밑면의 변 i(꼭짓점 i → i+1)는 바깥쪽이 보는 사람 쪽(아래)을 향할 때 보인다
  const edgeVisible = (i: number) => Math.sin(angle(i + 0.5)) > 0;
  const lines: NonNullable<ShapeScene["lines"]> = [];
  for (let i = 0; i < n; i++) {
    lines.push({ from: at(i, top), to: at(i + 1, top) });
    lines.push({ from: at(i, bottom), to: at(i + 1, bottom), dashed: !edgeVisible(i) });
    lines.push({ from: at(i, top), to: at(i, bottom), dashed: !edgeVisible(i) && !edgeVisible(i - 1 + n) });
  }
  return { kind: "shape", width: 240, height: 190, label: "각기둥의 겨냥도(보이지 않는 모서리는 점선)", lines };
}

/** 겨냥도를 보고 각기둥의 밑면의 모양을 고른다(이름은 다음 차시 '각기둥의 이름과 구성 요소'에서 배우므로 묻지 않는다) */
const prismBaseShape = easy("e6-prism-base", (rand) => {
  const n = randInt(rand, 3, 6);
  const base = `${POLY_NAME[n]}각형`;
  return {
    key: `${n}`,
    prompt: "그림과 같은 각기둥의 밑면은 어떤 모양인가요?",
    visual: prismSketch(n),
    answer: base,
    choices: shuffle(rand, POLY_NAME.slice(3).map((p) => `${p}각형`)),
    hint: "위와 아래에 있는 서로 평행하고 합동인 두 면이 밑면이에요. 밑면의 변의 수를 세어 보세요.",
    explanation: `위와 아래의 두 밑면은 변이 ${n}개인 ${base}입니다.`,
  };
});

/** 정육면체의 전개도를 보고 겉넓이 */
const cubeSurface = easy("e6-cube-surface", (rand) => {
  const a = randInt(rand, 2, 9);
  return {
    key: `${a}`,
    prompt: "그림은 정육면체의 전개도입니다. 이 정육면체의 겉넓이는 몇 cm²인가요?",
    visual: cuboidNetScene(a, a, a, [`${a} cm`, null, null]),
    answer: 6 * a * a,
    unit: "cm²",
    hint: "전개도에는 합동인 정사각형 면이 6개 있어요.",
    explanation: `${a} × ${a} × 6 = ${6 * a * a}(cm²)`,
    mistakes: { [a * a]: "한 면의 넓이만 구했어요." },
  };
});

/** 나눗셈의 몫을 소수 둘째 자리까지 구해 두고 반올림하여 소수 첫째 자리까지 */
const roundDecimal = easy("e6-round-decimal", (rand) => {
  const b = pick(rand, [3, 6, 7, 9]);
  const a = randInt(rand, 10, 60);
  if (a % b === 0) return null;
  const q2 = Math.floor((a / b) * 100) / 100;
  const v = Math.round((a / b) * 10) / 10;
  return {
    key: `${a}:${b}`,
    prompt: `${a} ÷ ${b} = ${q2.toFixed(2)}…입니다. 몫을 반올림하여 소수 첫째 자리까지 나타내세요.`,
    answer: v.toFixed(1).replace(/\.0$/, ""),
    hint: "소수 둘째 자리 숫자가 5 이상이면 올리고, 4 이하면 버려요.",
    explanation: `${q2.toFixed(2)}… → 소수 둘째 자리 숫자 ${q2.toFixed(2).slice(-1)} → ${v.toFixed(1).replace(/\.0$/, "")}`,
    mistakes: { [String(Math.floor((a / b) * 10) / 10)]: "반올림하지 않고 버렸어요." },
  };
});

const shareSmall = easy("e6-share-small", (rand) => {
  const a = randInt(rand, 1, 4);
  const b = randInt(rand, 1, 4);
  if (a === b || gcd(a, b) !== 1) return null;
  const unit = randInt(rand, 2, 5);
  const total = (a + b) * unit;
  return {
    key: `${a}:${b}:${unit}`,
    prompt: `${josa(total, "을/를")} ${josa(`${a} : ${b}`, "으로/로")} 비례배분하면 앞의 수는 얼마인가요?`,
    answer: a * unit,
    hint: `${total} × ${a}/${a + b}`,
    explanation: `${total} × ${a}/${a + b} = ${a * unit}`,
  };
});

export const easies: WordMap = {
  "g1-s1-add-sub": { split: [gather9] },
  "g1-s1-compare": { area: [countCells] },
  "g1-s2-patterns": { "number-pattern": [countOnByOne] },
  "g2-s2-length-m": { "m-cm-calc": [mCmNoCarry] },
  "g2-s2-time": { "time-units2": [hoursToMin] },
  "g2-s2-patterns": { "table-pattern": [skipByK] },
  "g3-s2-fraction": { "frac-compare2": [compareImproper] },
  "g4-s1-bar-graph": { "bar-use": [GR.barRead] },
  "g4-s1-patterns": { "pattern-calc": [countOnByOne] },
  "g5-s1-factors": { "gcd-lcm": [smallLcm] },
  "g5-s1-correspondence": { rule: [G5.correspondence] },
  "g5-s2-frac-mul": { "times-frac": [unitTimesUnit] },
  "g5-s2-dec-mul": { "dec-dec": [tenthsTimes] },
  "g5-s2-average": { chance: [certainImpossible] },
  "g6-s1-frac-div": { "frac-whole": [fracDivEasy] },
  "g6-s1-prisms": { names: [prismBaseShape] },
  "g6-s1-volume-surface": { surface: [cubeSurface] },
  "g6-s2-dec-div": { round: [roundDecimal] },
  "g6-s2-proportion": { share: [shareSmall] },
};
