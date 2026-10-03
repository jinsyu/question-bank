import { makeChoices, pick, randInt, shuffle } from "../../lib/random";
import { mixedText } from "../generators/grade4";
import { word, type WordMap } from "./word";
import { josa } from "../josa";
import { POLY_NAMES } from "../generators/geometry";

/** 조사(는·가)가 자연스럽도록 받침 없는 이름만 쓴다. '하루'는 '하루에 몇 쪽'과 헷갈려 쓰지 않는다 */
const NAMES = ["지우", "서아", "수아", "도하", "유나", "이수"];
const frac = (n: number, d: number) => `${n}/${d}`;
/** 분수 뒤 조사: 분수는 분자를 마지막에 읽는다(2/6 → 육분의 이 → 를) */
const fracJosa = (n: number, d: number, pair: "을/를" | "이/가") => `${frac(n, d)}${josa(n, pair).slice(String(n).length)}`;
/** 분수 4지선다: 값이 같은 보기(3/6과 2/4)는 거른다 */
const fracChoices = (rand: () => number, answer: string, others: string[], filler: () => string) => makeChoices(rand, answer, others, filler);

/* ── 3-1 ── */

const visitors = word("w3-visitors", (rand) => {
  const a = randInt(rand, 120, 400);
  const b = randInt(rand, 100, 300);
  const c = randInt(rand, 100, 999 - a - b);
  if (c < 100) return null;
  return {
    key: `${a}:${b}:${c}`,
    prompt: `박물관에 오전에 ${a}명, 오후에 ${b}명이 왔고 저녁에 ${c}명이 더 왔습니다. 하루 동안 박물관에 온 사람은 모두 몇 명인가요?`,
    answer: a + b + c,
    unit: "명",
    hint: "두 수를 먼저 더하고, 그 합에 나머지 수를 더해요.",
    explanation: `${a} + ${b} = ${a + b}, ${a + b} + ${c} = ${a + b + c}(명)`,
  };
});

const pocketMoney = word("w3-pocket-money", (rand) => {
  const a = randInt(rand, 6, 9) * 100 + randInt(rand, 0, 9) * 10;
  // 물건값은 10원 단위(1원짜리 물건은 없음)
  const b = randInt(rand, 12, 38) * 10;
  const c = randInt(rand, 11, (a - b) / 10 - 1) * 10;
  if (c < 110) return null;
  return {
    key: `${a}:${b}:${c}`,
    prompt: `${pick(rand, NAMES)}는 ${a}원을 가지고 있었습니다. ${b}원짜리 과자와 ${c}원짜리 음료수를 샀다면 남은 돈은 얼마인가요?`,
    answer: a - b - c,
    unit: "원",
    hint: "산 물건의 값을 차례로 빼요.",
    explanation: `${a} − ${b} − ${c} = ${a - b - c}(원)`,
    mistakes: { [a - b + c]: "두 번째 물건값도 빼야 해요." },
  };
});

const notebooksMore = word("w3-notebooks-more", (rand) => {
  const b = randInt(rand, 3, 8);
  const q = randInt(rand, 3, 9);
  const c = randInt(rand, 1, q - 1);
  return {
    key: `${b}:${q}:${c}`,
    prompt: `공책 ${b * q}권을 ${b}명에게 똑같이 나누어 주려고 합니다. ${pick(rand, NAMES)}가 지금까지 ${c}권을 받았다면 몇 권을 더 받아야 하나요?`,
    answer: q - c,
    unit: "권",
    hint: `먼저 한 명이 받을 공책 수를 나눗셈으로 구해요.`,
    explanation: `${b * q} ÷ ${b} = ${q}, ${q} − ${c} = ${q - c}(권)`,
  };
});

/** 어떤 수(곱셈구구 범위)를 a로 나눈 몫 q: 어떤 수 = a × q ≤ 9라서 잘못 곱한 값(어떤 수 × a)도 곱셈구구로 되돌릴 수 있다 */
const WRONG_MUL_DIV: [number, number][] = [
  [2, 2],
  [2, 3],
  [2, 4],
  [3, 2],
  [3, 3],
  [4, 2],
];

const wrongMulDiv = word("w3-wrong-mul-div", (rand) => {
  const [a, q] = pick(rand, WRONG_MUL_DIV);
  const x = a * q;
  return {
    key: `${a}:${q}`,
    prompt: `어떤 수를 ${josa(a, "으로/로")} 나누어야 할 것을 잘못하여 ${josa(a, "을/를")} 곱했더니 ${josa(x * a, "이/가")} 되었습니다. 바르게 계산한 몫은 얼마인가요?`,
    answer: q,
    hint: `먼저 어떤 수를 구해요: □ × ${a} = ${x * a}`,
    explanation: `어떤 수: □ × ${a} = ${x * a}에서 □ = ${x}, 바른 계산: ${x} ÷ ${a} = ${q}`,
    mistakes: { [x]: "어떤 수만 구했어요." },
  };
});

const candyBags = word("w3-candy-bags", (rand) => {
  const per = randInt(rand, 2, 9) * 10;
  const bags = randInt(rand, 2, 9);
  const loose = randInt(rand, 1, 9);
  return {
    key: `${per}:${bags}:${loose}`,
    prompt: `사탕이 한 봉지에 ${per}개씩 ${bags}봉지 있고, 낱개로 ${loose}개가 더 있습니다. 사탕은 모두 몇 개인가요?`,
    answer: per * bags + loose,
    unit: "개",
    hint: `(몇십) × (몇)을 먼저 계산해요.`,
    explanation: `${per} × ${bags} = ${per * bags}, ${per * bags} + ${loose} = ${per * bags + loose}(개)`,
  };
});

const soldBoxes = word("w3-sold-boxes", (rand) => {
  const a = randInt(rand, 12, 48);
  const b = randInt(rand, 3, 9);
  const c = randInt(rand, 10, a * b - 5);
  return {
    key: `${a}:${b}:${c}`,
    prompt: `한 상자에 달걀이 ${a}개씩 들어 있습니다. ${b}상자 중에서 ${c}개를 팔았다면 남은 달걀은 몇 개인가요?`,
    answer: a * b - c,
    unit: "개",
    hint: `먼저 ${a} × ${josa(b, "으로/로")} 전체 달걀 수를 구해요.`,
    explanation: `${a} × ${b} = ${a * b}, ${a * b} − ${c} = ${a * b - c}(개)`,
  };
});

const pizzaLeft = word("w3-pizza-left", (rand) => {
  const n = randInt(rand, 5, 12);
  const a = randInt(rand, 1, n - 3);
  const b = randInt(rand, 1, n - a - 1);
  const answer = frac(n - a - b, n);
  return {
    key: `${n}:${a}:${b}`,
    prompt: `피자 한 판을 똑같이 ${n}조각으로 나누었습니다. 형이 ${a}조각, 동생이 ${b}조각을 먹었습니다. 남은 피자는 전체의 얼마인가요?`,
    answer,
    // 3-1(가분수를 배우기 전): 오답도 진분수만(먹은 부분, 형이 먹고 남은 부분, 동생 몫)
    choices: fracChoices(rand, answer, [frac(a + b, n), frac(n - a, n), frac(b, n)], () => frac(randInt(rand, 1, n - 1), n)),
    hint: "남은 조각 수를 먼저 구해요.",
    explanation: `${n} − ${a} − ${b} = ${n - a - b}조각 → ${answer}`,
    mistakes: { [frac(a + b, n)]: "먹은 부분을 답했어요." },
  };
});

const cakeEat = word("w3-cake-eat", (rand) => {
  const [a, b] = shuffle(rand, [2, 3, 4, 5, 6, 7, 8]).slice(0, 2);
  const [p, q] = shuffle(rand, NAMES).slice(0, 2);
  const more = a < b ? p : q;
  return {
    key: `${a}:${b}:${p}:${q}`,
    prompt: `같은 크기의 케이크를 ${p}는 ${a}조각으로 똑같이 나눈 것 중 1조각, ${q}는 ${b}조각으로 똑같이 나눈 것 중 1조각을 먹었습니다. 누가 더 많이 먹었나요?`,
    answer: more,
    choices: [p, q, "같습니다", "알 수 없습니다"],
    hint: "1/□에서 □가 작을수록 한 조각이 커요.",
    explanation: `1/${a}과 1/${b} 중 ${Math.min(a, b) === a ? `1/${a}` : `1/${b}`}이 더 크므로 ${more}`,
  };
});

const ribbonDecimal = word("w3-ribbon-decimal", (rand) => {
  const cm = randInt(rand, 5, 15);
  const mm = randInt(rand, 1, 9);
  const cut = randInt(rand, 5, 40);
  const left = cm * 10 + mm - cut;
  if (left <= 0) return null;
  return {
    key: `${cm}:${mm}:${cut}`,
    prompt: `리본 ${cm} cm ${mm} mm 중에서 ${cut} mm를 잘라 썼습니다. 남은 리본은 몇 cm인지 소수로 나타내세요.`,
    answer: String(left / 10),
    unit: "cm",
    hint: "모두 mm로 바꾸어 빼고, 1 mm = 0.1 cm로 나타내요.",
    explanation: `${cm * 10 + mm} − ${cut} = ${left} mm = ${left / 10} cm`,
  };
});

const jumpFar = word("w3-jump-far", (rand) => {
  const names = shuffle(rand, NAMES).slice(0, 4);
  const vals = shuffle(rand, Array.from({ length: 30 }, (_, i) => i + 10).filter((v) => v % 10 !== 0)).slice(0, 4);
  const far = rand() < 0.5;
  const target = far ? Math.max(...vals) : Math.min(...vals);
  return {
    key: `${names.join()}:${vals.join()}:${far}`,
    prompt: `멀리뛰기 기록이 ${names.map((n, i) => `${n} ${(vals[i] / 10).toFixed(1)} m`).join(", ")}입니다. 가장 ${far ? "멀리" : "짧게"} 뛴 사람은 누구인가요?`,
    answer: names[vals.indexOf(target)],
    choices: names,
    hint: "소수점 왼쪽의 수를 먼저, 같으면 소수점 오른쪽 숫자를 비교해요.",
    explanation: `${names[vals.indexOf(target)]}(${(target / 10).toFixed(1)} m)`,
  };
});

const bookPages = word("w3-book-pages", (rand) => {
  const per = randInt(rand, 21, 50) * 5;
  const packs = randInt(rand, 3, 9);
  const left = randInt(rand, 10, 90);
  return {
    key: `${per}:${packs}:${left}`,
    prompt: `색종이가 한 묶음에 ${per}장씩 ${packs}묶음 있고, 낱장으로 ${left}장이 더 있습니다. 색종이는 모두 몇 장인가요?`,
    answer: per * packs + left,
    unit: "장",
    hint: "묶음에 있는 색종이 수를 곱셈으로 구한 뒤 낱장의 수를 더해요.",
    explanation: `${per} × ${packs} = ${per * packs}, ${per * packs} + ${left} = ${per * packs + left}(장)`,
  };
});

const lineUp = word("w3-line-up", (rand) => {
  const a = randInt(rand, 12, 35);
  const b = randInt(rand, 12, 30);
  const c = randInt(rand, 5, 40);
  return {
    key: `${a}:${b}:${c}`,
    prompt: `운동장에 학생들이 한 줄에 ${a}명씩 ${b}줄로 서 있습니다. 늦게 온 학생 ${c}명이 더 섰다면 운동장에 선 학생은 모두 몇 명인가요?`,
    answer: a * b + c,
    unit: "명",
    hint: `(두 자리 수) × (두 자리 수)를 먼저 계산해요.`,
    explanation: `${a} × ${b} = ${a * b}, ${a * b} + ${c} = ${a * b + c}(명)`,
  };
});

const beadBags = word("w3-bead-bags", (rand) => {
  const b = randInt(rand, 2, 5);
  const c = randInt(rand, 2, 6);
  const q2 = randInt(rand, 2, 8);
  const total = b * c * q2;
  if (total > 99 || total < 20) return null;
  return {
    key: `${b}:${c}:${q2}`,
    prompt: `구슬 ${total}개를 ${b}명이 똑같이 나누어 가졌습니다. 한 명이 받은 구슬을 한 봉지에 ${c}개씩 담으면 몇 봉지가 되나요?`,
    answer: q2,
    unit: "봉지",
    hint: `먼저 한 명이 받은 구슬 수를 구해요: ${total} ÷ ${b}`,
    explanation: `${total} ÷ ${b} = ${c * q2}, ${c * q2} ÷ ${c} = ${q2}(봉지)`,
  };
});

const groupsNeeded = word("w3-groups-needed", (rand) => {
  const b = randInt(rand, 3, 8);
  const a = randInt(rand, 20, 95);
  if (a % b === 0) return null;
  return {
    key: `${a}:${b}`,
    prompt: `학생 ${a}명이 한 모둠에 ${b}명씩 앉으려고 합니다. 모든 학생이 앉으려면 모둠은 적어도 몇 개 있어야 하나요?`,
    answer: Math.ceil(a / b),
    unit: "개",
    hint: "나머지 학생들도 앉아야 하므로 모둠이 하나 더 필요해요.",
    explanation: `${a} ÷ ${b} = ${Math.floor(a / b)} … ${a % b} → ${Math.floor(a / b)} + 1 = ${Math.ceil(a / b)}(개)`,
    mistakes: { [Math.floor(a / b)]: "남은 학생들이 앉을 모둠을 빠뜨렸어요." },
  };
});

const paperUsed = word("w3-paper-used", (rand) => {
  const d = randInt(rand, 3, 8);
  const n = randInt(rand, 1, d - 1);
  const each = randInt(rand, 2, 8);
  return {
    key: `${d}:${n}:${each}`,
    prompt: `색종이 ${d * each}장 중에서 ${fracJosa(n, d, "을/를")} 사용했습니다. 남은 색종이는 몇 장인가요?`,
    answer: d * each - n * each,
    unit: "장",
    hint: `먼저 ${d * each}의 ${fracJosa(n, d, "을/를")} 구해요.`,
    explanation: `${d * each}의 ${frac(n, d)} = ${n * each}, ${d * each} − ${n * each} = ${d * each - n * each}(장)`,
    mistakes: { [n * each]: "사용한 장수를 답했어요." },
  };
});

/** 상: 진분수의 뜻과 조건 하나(분모·분자의 합, 분자의 범위, 분모·분자의 차와 분모의 범위)를 함께 따져 센다 */
const properCount = word("w3-proper-count", (rand) => {
  const kind = pick(rand, ["sum", "above", "diff"] as const);
  if (kind === "sum") {
    const s = randInt(rand, 6, 15);
    const nums = Array.from({ length: Math.floor((s - 1) / 2) }, (_, i) => i + 1);
    return {
      key: `sum:${s}`,
      prompt: `분모와 분자의 합이 ${s}인 진분수는 모두 몇 개인가요?`,
      answer: nums.length,
      unit: "개",
      hint: "합이 맞는 분수를 분자 1부터 차례로 쓰고, 그중 분자가 분모보다 작은 것만 세어요.",
      explanation: `${nums.map((n) => frac(n, s - n)).join(", ")} → ${nums.length}개`,
      mistakes: { [s - 1]: "분자가 분모보다 작은 진분수만 세어야 해요." },
    };
  }
  if (kind === "above") {
    const d = randInt(rand, 4, 12);
    const k = randInt(rand, 1, d - 3);
    return {
      key: `above:${d}:${k}`,
      prompt: `분모가 ${d}인 진분수 중에서 분자가 ${k}보다 큰 분수는 모두 몇 개인가요?`,
      answer: d - 1 - k,
      unit: "개",
      hint: "진분수는 분자가 분모보다 작아요. 분자가 될 수 있는 수를 차례로 써 보세요.",
      explanation: `분자는 ${k}보다 크고 ${d}보다 작아야 하므로 ${k + 1}부터 ${d - 1}까지 → ${d - 1 - k}개`,
      mistakes: { [d - 1]: `분자가 ${k}보다 커야 한다는 조건도 확인해요.`, [d - k]: `분자가 ${josa(d, "이/가")} 되면 진분수가 아니에요.` },
    };
  }
  // 차가 k인 진분수 중 분모가 m보다 작은 것: 분모 k+1, k+2, …, m−1
  const m = randInt(rand, 8, 12);
  const k = randInt(rand, 1, m - 4);
  const list = Array.from({ length: m - 1 - k }, (_, i) => frac(i + 1, i + 1 + k));
  return {
    key: `diff:${m}:${k}`,
    prompt: `분모와 분자의 차가 ${k}이고 분모가 ${m}보다 작은 진분수는 모두 몇 개인가요?`,
    answer: list.length,
    unit: "개",
    hint: `분자 1부터 차례로, 분모가 분자보다 ${k}만큼 큰 진분수를 써 보세요.`,
    explanation: `${list.join(", ")} → ${list.length}개`,
    mistakes: { [list.length + 1]: `분모가 ${m}인 분수는 들어가지 않아요.` },
  };
});

const smallerImproper = word("w3-smaller-improper", (rand) => {
  const d = randInt(rand, 3, 8);
  const w = randInt(rand, 1, 3);
  const r = randInt(rand, 1, d - 1);
  const count = w * d + r - d;
  return {
    key: `${d}:${w}:${r}`,
    prompt: `분모가 ${d}인 가분수 중에서 ${w} ${r}/${d}보다 작은 수는 모두 몇 개인가요?`,
    answer: count,
    unit: "개",
    hint: `${w} ${fracJosa(r, d, "을/를")} 가분수로 바꾸어 분자를 비교해요.`,
    explanation: `${w} ${r}/${d} = ${w * d + r}/${d} → 분자 ${d}부터 ${w * d + r - 1}까지 ${count}개`,
  };
});

const tableSame = word("w3-table-same", (rand) => {
  const a = randInt(rand, 3, 12);
  const b = randInt(rand, 3, 12);
  const c = randInt(rand, 2, 10);
  const total = a + b + c * 2;
  return {
    key: `${a}:${b}:${c}`,
    prompt: `좋아하는 운동을 조사했더니 모두 ${total}명이었습니다. 축구 ${a}명, 피구 ${b}명이고, 줄넘기와 수영을 좋아하는 학생 수는 같습니다. 줄넘기를 좋아하는 학생은 몇 명인가요?`,
    answer: c,
    unit: "명",
    hint: "합계에서 축구와 피구를 뺀 나머지를 둘로 똑같이 나눠요.",
    explanation: `${total} − ${a} − ${b} = ${total - a - b}, ${total - a - b} ÷ 2 = ${c}(명)`,
    mistakes: { [c * 2]: "줄넘기와 수영을 합한 수예요." },
  };
});

/* ── 4학년 ── */

const eokSkip = word("w4-eok-skip", (rand) => {
  const eok = randInt(rand, 1, 9);
  const man = randInt(rand, 100, 9000);
  const step = pick(rand, [1000, 10000]);
  const times = randInt(rand, 2, 5);
  const start = eok * 100000000 + man * 10000;
  return {
    key: `${eok}:${man}:${step}:${times}`,
    prompt: `1억이 ${eok}개, 1만이 ${man}개인 수에서 ${step === 10000 ? "1만" : "1000만"}씩 ${times}번 뛰어 센 수를 숫자로 쓰세요.`,
    answer: start + (step === 10000 ? 10000 : 10000000) * times,
    hint: "먼저 처음 수를 숫자로 쓰고, 뛰어 센 만큼 더해요.",
    explanation: `${start.toLocaleString("ko-KR")} + ${(step === 10000 ? 10000 : 10000000) * times} = ${(start + (step === 10000 ? 10000 : 10000000) * times).toLocaleString("ko-KR")}`,
  };
});

const savings = word("w4-savings", (rand) => {
  const per = randInt(rand, 2, 9);
  const months = randInt(rand, 6, 24);
  const start = randInt(rand, 1, 9) * 10000;
  return {
    key: `${per}:${months}:${start}`,
    prompt: `저금통에 ${start.toLocaleString("ko-KR")}원이 있었습니다. 한 달에 ${per}만 원씩 ${months}달 동안 더 저금하면 모두 얼마가 되나요?`,
    answer: start + per * 10000 * months,
    unit: "원",
    hint: `${per}만 원씩 ${months}번이면 ${per * months}만 원이에요.`,
    explanation: `${per * 10000} × ${months} = ${per * 10000 * months}, ${start} + ${per * 10000 * months} = ${start + per * 10000 * months}(원)`,
  };
});

const quadRight = word("w4-quad-right", (rand) => {
  // 두 단계: 아는 두 각(직각 포함)을 빼고, 남은 각도를 크기가 같은 두 각으로 나눈다.
  // 직각이 아닌 각은 90°와 헷갈리지 않게 15° 이상 떨어지게(10° 단위라 답은 5의 배수)
  const right = rand() < 0.5;
  const a = randInt(rand, 3, 17) * 10;
  const b = right ? 90 : randInt(rand, 3, 17) * 10;
  const answer = (360 - a - b) / 2;
  const far = (x: number) => Math.abs(x - 90) >= 15;
  if (!far(a) || (!right && !far(b)) || !far(answer) || answer < 30 || answer > 150) return null;
  const known = right ? `한 각은 직각이고, 다른 한 각은 ${a}°입니다` : `두 각이 ${a}°, ${b}°입니다`;
  return {
    key: `${right}:${a}:${b}`,
    prompt: `사각형의 ${known}. 나머지 두 각의 크기가 같을 때, 나머지 한 각은 몇 도인가요?`,
    answer,
    unit: "°",
    hint: `사각형의 네 각의 합은 360°${right ? ", 직각은 90°" : ""}예요. 나머지 두 각의 크기의 합을 먼저 구해요.`,
    explanation: `360° − ${b}° − ${a}° = ${360 - a - b}°, ${360 - a - b}° ÷ 2 = ${answer}°`,
    mistakes: { [360 - a - b]: "나머지 두 각의 크기의 합을 답했어요. 둘로 나누어요." },
  };
});

const notebookChange = word("w4-notebook-change", (rand) => {
  const price = randInt(rand, 3, 9) * 100 + randInt(rand, 0, 9) * 10;
  const n = randInt(rand, 12, 35);
  const cost = price * n;
  const pay = Math.ceil((cost + 1) / 10000) * 10000;
  return {
    key: `${price}:${n}`,
    prompt: `한 권에 ${price}원인 공책을 ${n}권 사고 ${pay.toLocaleString("ko-KR")}원을 냈습니다. 거스름돈은 얼마인가요?`,
    answer: pay - cost,
    unit: "원",
    hint: "먼저 공책값을 곱셈으로 구해요.",
    explanation: `${price} × ${n} = ${cost}, ${pay} − ${cost} = ${pay - cost}(원)`,
  };
});

const candyPack = word("w4-candy-pack", (rand) => {
  // (두 자리 수) ÷ (두 자리 수) 차시: 사탕은 99개 이하
  const b = randInt(rand, 12, 32);
  const q = randInt(rand, 2, Math.floor(98 / b));
  const r = randInt(rand, 1, b - 1);
  const a = b * q + r;
  if (a > 99) return null;
  return {
    key: `${a}:${b}`,
    prompt: `사탕 ${a}개를 한 봉지에 ${b}개씩 담고, 남는 사탕은 동생에게 주려고 합니다. 봉지는 몇 개가 되고 동생에게는 몇 개를 주나요?`,
    answer: `${q},${r}`,
    unit: ["봉지", "개"],
    hint: `${a} ÷ ${b}의 몫과 나머지를 구해요.`,
    explanation: `${a} ÷ ${b} = ${q} … ${r}`,
  };
});

const matchSquares = word("w4-match-squares", (rand) => {
  const n = randInt(rand, 4, 15);
  return {
    key: `${n}`,
    prompt: `성냥개비로 정사각형을 옆으로 이어 붙여 만듭니다. 정사각형 1개에 4개, 2개에 7개, 3개에 10개가 필요합니다. 정사각형 ${n}개를 만들려면 성냥개비가 몇 개 필요한가요?`,
    answer: 3 * n + 1,
    unit: "개",
    hint: "정사각형이 1개 늘 때마다 성냥개비가 몇 개씩 늘어나는지 보세요.",
    explanation: `정사각형이 1개 늘 때마다 3개씩 늘어나요. 3 × ${n - 1} = ${3 * (n - 1)}, 4 + ${3 * (n - 1)} = ${3 * n + 1}(개)`,
    mistakes: { [4 * n]: "붙은 변을 두 번 셌어요." },
  };
});

const oddSum = word("w4-odd-sum", (rand) => {
  const n = randInt(rand, 5, 12);
  return {
    key: `${n}`,
    prompt: `1 + 3 = 4, 1 + 3 + 5 = 9, 1 + 3 + 5 + 7 = 16입니다. 규칙을 이용하여 1부터 ${2 * n - 1}까지 홀수를 모두 더한 값을 구하세요.`,
    answer: n * n,
    hint: "더한 홀수의 개수와 결과 사이의 관계를 살펴보세요.",
    explanation: `홀수 ${n}개의 합 = ${n} × ${n} = ${n * n}`,
  };
});

const milkFrac = word("w4-milk-frac", (rand) => {
  // 진분수의 덧셈 차시: 뺄셈 없이 두 번 더한다
  const d = randInt(rand, 5, 12);
  const a = randInt(rand, 1, d - 1);
  const b = randInt(rand, 1, d - 1);
  const c = randInt(rand, 1, d - 1);
  const r = a + b + c;
  const answer = mixedText(r, d);
  return {
    key: `${d}:${a}:${b}:${c}`,
    prompt: `우유가 ${a}/${d} L 있었습니다. 어제 ${b}/${d} L를 더 사 오고, 오늘 ${c}/${d} L를 또 사 왔습니다. 우유는 모두 몇 L인가요?`,
    answer,
    choices: fracChoices(rand, answer, [mixedText(a + b, d), mixedText(r - 1, d), mixedText(r + 1, d)], () => mixedText(randInt(rand, 1, d * 2), d)),
    hint: "분모는 그대로 두고 분자끼리 더해요. 분자가 분모와 같거나 크면 대분수로 나타내요.",
    explanation: `${a}/${d} + ${b}/${d} + ${c}/${d} = ${r}/${d}${r >= d ? ` = ${answer}` : ""} L`,
  };
});

const ropeMixed = word("w4-rope-mixed", (rand) => {
  // 대분수의 뺄셈(받아내림 없음) 차시: 분수 부분끼리 차례로 뺄 수 있는 수만
  const d = randInt(rand, 4, 9);
  const fx = randInt(rand, 3, d - 1);
  const fy = randInt(rand, 1, fx - 2);
  const fz = randInt(rand, 1, fx - fy - 1);
  const x = randInt(rand, 4, 8) * d + fx;
  const y = randInt(rand, 1, 2) * d + fy;
  const z = randInt(rand, 1, 2) * d + fz;
  const r = x - y - z;
  if (r <= d || fz < 1) return null;
  const answer = mixedText(r, d);
  return {
    key: `${d}:${x}:${y}:${z}`,
    prompt: `끈이 ${mixedText(x, d)} m 있습니다. 상자를 묶는 데 ${mixedText(y, d)} m, 선물을 묶는 데 ${mixedText(z, d)} m를 썼습니다. 남은 끈은 몇 m인가요?`,
    answer,
    choices: fracChoices(rand, answer, [mixedText(r + d, d), mixedText(x - y, d), mixedText(r + 1, d)], () => mixedText(randInt(rand, 1, d * 5), d)),
    hint: "앞에서부터 차례로 빼요. 자연수는 자연수끼리, 분수는 분수끼리 빼요.",
    explanation: `${mixedText(x, d)} − ${mixedText(y, d)} − ${mixedText(z, d)} = ${answer} m`,
  };
});

const isoscelesSide = word("w4-isosceles-side", (rand) => {
  const a = randInt(rand, 5, 15);
  const base = randInt(rand, 3, 2 * a - 1);
  return {
    key: `${a}:${base}`,
    prompt: `길이가 같은 두 변이 각각 ${a} cm인 이등변삼각형의 세 변의 길이의 합이 ${2 * a + base} cm입니다. 나머지 한 변은 몇 cm인가요?`,
    answer: base,
    unit: "cm",
    hint: "세 변의 합에서 같은 두 변의 길이를 빼요.",
    explanation: `${a} + ${a} = ${2 * a}, ${2 * a + base} − ${2 * a} = ${base}(cm)`,
    mistakes: { [2 * a + base - a]: "같은 변을 하나만 뺐어요." },
  };
});

/** 4-2 두 가지 기준으로 분류하기 차시(각의 크기에 따른 분류를 배운 뒤). 교과서에 없는 말 '밑각' 대신 풀어 쓴다 */
const isoscelesKind = word("w4-isosceles-kind", (rand) => {
  // 같은 두 각은 5의 배수(나머지 각은 10° 단위)
  const base = randInt(rand, 4, 16) * 5;
  const top = 180 - 2 * base;
  const kind = top > 90 ? "둔각삼각형" : top === 90 ? "직각삼각형" : "예각삼각형";
  return {
    key: `${base}`,
    prompt: `이등변삼각형에서 길이가 같은 두 변 사이에 있지 않은 한 각이 ${base}°입니다. 이 삼각형은 각의 크기에 따라 어떤 삼각형인가요?`,
    answer: kind,
    choices: ["예각삼각형", "직각삼각형", "둔각삼각형"],
    hint: "이등변삼각형은 두 각의 크기가 같아요. 나머지 한 각을 먼저 구해요.",
    explanation: `크기가 같은 두 각이 ${base}°, ${base}°이므로 나머지 한 각은 180° − ${base}° − ${base}° = ${top}° → ${kind}`,
  };
});

const decComposeWord = word("w4-dec-compose", (rand) => {
  // 소수 두 자리 차시: 0.001은 쓰지 않고, 개수가 0인 것은 문장에서 뺀다
  const a = randInt(rand, 1, 9);
  const b = randInt(rand, 1, 9);
  const w = randInt(rand, 0, 5);
  const v = Number((w + a / 10 + b / 100).toFixed(2));
  const parts = [w ? `1이 ${w}개` : "", `0.1이 ${a}개`, `0.01이 ${b}개`].filter(Boolean).join(", ");
  return {
    key: `${w}:${a}:${b}`,
    prompt: `${parts}인 수에 0.01을 10번 더하면 얼마인가요?`,
    answer: String(Number((v + 0.1).toFixed(2))),
    hint: "먼저 수를 소수로 나타내요. 0.01을 10번 더하면 0.1이에요.",
    explanation: `${v} + 0.1 = ${Number((v + 0.1).toFixed(2))}`,
  };
});

const fruitWeight = word("w4-fruit-weight", (rand) => {
  const a = randInt(rand, 150, 450) / 100;
  const b = randInt(rand, 80, 250) / 100;
  const basket = randInt(rand, 2, 9) / 10;
  const t = Number((a + b + basket).toFixed(2));
  return {
    key: `${a}:${b}:${basket}`,
    prompt: `무게가 ${a} kg인 수박과 ${b} kg인 멜론을 ${basket} kg인 바구니에 담았습니다. 전체 무게는 몇 kg인가요?`,
    answer: String(t),
    unit: "kg",
    hint: "소수점의 자리를 맞추어 차례로 더해요.",
    explanation: `${a} + ${b} + ${basket} = ${t}(kg)`,
  };
});

const quadBoth = word("w4-quad-both", (rand) => {
  const q = pick(rand, [
    { text: "직사각형이면서 마름모인 사각형", a: "정사각형" },
    { text: "네 각이 모두 직각인 평행사변형", a: "직사각형" },
    { text: "네 변의 길이가 모두 같은 평행사변형", a: "마름모" },
    { text: "마주 보는 두 쌍의 변이 평행한 사다리꼴", a: "평행사변형" },
  ]);
  return {
    key: q.a,
    prompt: `'${q.text}'을 무엇이라고 하나요? 가장 알맞은 이름을 고르세요.`,
    answer: q.a,
    choices: shuffle(rand, ["정사각형", "직사각형", "마름모", "평행사변형"]),
    hint: "두 조건을 모두 만족하는 사각형을 생각해요.",
    explanation: `${q.text}은 ${q.a}입니다.`,
  };
});

const parallelogramSide = word("w4-parallelogram-side", (rand) => {
  const a = randInt(rand, 4, 20);
  const b = randInt(rand, 4, 20);
  return {
    key: `${a}:${b}`,
    prompt: `평행사변형의 네 변의 길이의 합이 ${2 * (a + b)} cm이고, 한 변의 길이가 ${a} cm입니다. 이 변과 이웃한 변의 길이는 몇 cm인가요?`,
    answer: b,
    unit: "cm",
    hint: "마주 보는 두 변의 길이가 같으니, 둘레의 반은 이웃한 두 변의 합이에요.",
    explanation: `${2 * (a + b)} ÷ 2 = ${a + b}, ${a + b} − ${a} = ${b}(cm)`,
    mistakes: { [2 * (a + b) - a]: "한 변만 뺐어요." },
  };
});

const diagonalsToSides = word("w4-diagonals-sides", (rand) => {
  // 표(사각형~육각형)에 없는 다각형만: 규칙을 찾아 이어 가야 답이 나온다
  const n = randInt(rand, 7, 10);
  const d = (n * (n - 3)) / 2;
  return {
    key: `${n}`,
    prompt: `다각형에 대각선을 모두 그었더니 ${d}개였습니다. 표를 보고 규칙을 찾아 이 다각형의 변은 몇 개인지 구하세요.`,
    visual: { kind: "table", header: ["다각형", "사각형", "오각형", "육각형"], rows: [["대각선의 수(개)", "2", "5", "9"]] },
    answer: n,
    unit: "개",
    hint: "사각형부터 차례로 대각선 수를 구해 보세요: 사각형 2개, 오각형 5개, …",
    explanation: `${POLY_NAMES[n]}의 대각선: ${n} × ${n - 3} ÷ 2 = ${d}개`,
  };
});

export const words34: WordMap = {
  "g3-s1-add-sub": { add3: [visitors], sub3: [pocketMoney] },
  "g3-s1-division": { "div-meaning": [notebooksMore], "div-mul": [wrongMulDiv] },
  "g3-s1-multiplication": { "mul-tens": [candyBags], "mul-2x1": [soldBoxes] },
  "g3-s1-fraction-decimal": {
    "fraction-meaning": [pizzaLeft],
    "fraction-compare": [cakeEat],
    "decimal-meaning": [ribbonDecimal],
    "decimal-compare": [jumpFar],
  },
  "g3-s2-multiplication": { "mul-3x1": [bookPages], "mul-2x2": [lineUp] },
  "g3-s2-division": { "div-no-rem": [beadBags], "div-rem": [groupsNeeded] },
  "g3-s2-fraction": { "frac-of": [paperUsed], "frac-kinds": [properCount], "frac-compare2": [smallerImproper] },
  "g3-s2-data": { "data-table": [tableSame] },
  "g4-s1-big-numbers": { "big-read": [eokSkip], "big-count": [savings] },
  "g4-s1-angles": { "angle-shape": [quadRight] },
  "g4-s1-mul-div": { "mul-3x2": [notebookChange], "div-2digit": [candyPack] },
  "g4-s1-patterns": { "pattern-seq": [matchSquares], "pattern-calc": [oddSum] },
  "g4-s2-fraction-add-sub": { "frac-proper": [milkFrac], "frac-mixed": [ropeMixed] },
  "g4-s2-triangles": { "tri-sides": [isoscelesSide], "tri-angles": [isoscelesKind] },
  "g4-s2-decimal-add-sub": { "dec-places": [decComposeWord], "dec-calc": [fruitWeight] },
  "g4-s2-quadrilaterals": { "quad-kinds": [quadBoth], "quad-props": [parallelogramSide] },
  "g4-s2-polygons": { "poly-diagonals": [diagonalsToSides] },
};
