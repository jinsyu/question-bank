import { choiceKey, pick, randInt, shuffle } from "../../lib/random";
import { mixedText } from "../generators/grade4";
import { gcd, lcm, reduced } from "../generators/grade5";
import { word, type WordMap } from "./word";
import { jq } from "../lessons/g5-text";
import { tablesScene } from "../lessons/g5-pattern";
import { josa } from "../josa";
import { POLY_NAMES } from "../generators/geometry";

/** 조사(는·가)가 자연스럽도록 받침 없는 이름만 쓴다 */
const NAMES = ["지우", "서아", "수아", "도하", "유나", "이수"];
const trim = (n: number, p = 3) => String(Number(n.toFixed(p)));
/** 정답 + 오답 후보로 4지선다. 값이 같은 보기(2/24와 1/12)는 거른다 — '기약분수로 나타낸 것'처럼 꼴을 묻는 문제만 sameValueOk */
const choices4 = (rand: () => number, answer: string, others: string[], filler: () => string, sameValueOk = false) => {
  const key = sameValueOk ? (c: string) => c : choiceKey;
  const picked = new Map<string, string>([[key(answer), answer]]);
  const add = (c: string) => {
    if (picked.size < 4 && !picked.has(key(c))) picked.set(key(c), c);
  };
  for (const o of others) add(o);
  for (let i = 0; picked.size < 4 && i < 60; i++) add(filler());
  return shuffle(rand, [...picked.values()]);
};

/** 오답 설명에서 정답과 같은 값의 항목을 뺀다(우연히 같아지면 정답에 오답 설명이 붙지 않게) */
const withoutAnswer = (answer: number | string, mistakes: Record<string, string>) => Object.fromEntries(Object.entries(mistakes).filter(([k]) => k !== String(answer)));

/* ── 5학년 ── */

const mixedWord = word("w5-mixed", (rand) => {
  const a = randInt(rand, 3, 9);
  const b = randInt(rand, 2, 6);
  const c = randInt(rand, 2, 5);
  // 가진 장수보다 많이 쓸 수는 없다(답이 0 이하가 되지 않게)
  const d = randInt(rand, 5, Math.min(20, (a + b) * c - 1));
  return {
    key: `${a}:${b}:${c}:${d}`,
    prompt: `빨간 색종이 ${a}장과 파란 색종이 ${b}장을 한 묶음으로 하여 ${c}묶음을 만들었습니다. 그중 ${d}장을 사용했다면 남은 색종이는 몇 장인지 하나의 식으로 나타내어 구하세요.`,
    answer: (a + b) * c - d,
    unit: "장",
    hint: `(${a} + ${b}) × ${c} − ${d}처럼 ( )를 먼저 계산해요.`,
    explanation: `(${a} + ${b}) × ${c} − ${d} = ${(a + b) * c - d}(장)`,
    mistakes: { [a + b * c - d]: "( )를 쓰지 않아 계산 순서가 바뀌었어요." },
  };
});

/** 네 연산이 모두 들어간 두 단계 문장제: 물건값(곱셈·나눗셈) − 할인 → 두 사람이 나누어 냄. 같은 차시 mixed-calc-word(중)보다 한 단계 많다 */
const shoppingChange = word("w5-shopping-change", (rand) => {
  const p = randInt(rand, 3, 9) * 100;
  const n = randInt(rand, 2, 5);
  const k = randInt(rand, 2, 5);
  const P = k * randInt(rand, 2, 6) * 100;
  const m = randInt(rand, 2, 4);
  const c = pick(rand, [500, 1000]);
  const items = p * n + (P / k) * m;
  const rest = items - c;
  if (rest <= 0 || rest % 200 !== 0 || m === k) return null;
  const answer = rest / 2;
  return {
    key: `${p}:${n}:${k}:${P}:${m}:${c}`,
    prompt: `한 자루에 ${p}원인 연필 ${n}자루와 ${k}개에 ${P}원인 지우개 ${m}개를 사고 ${c}원 할인 쿠폰을 썼습니다. 할인받고 내야 할 금액을 두 사람이 똑같이 나누어 낸다면 한 사람이 내야 할 돈은 얼마인지 하나의 식으로 나타내어 구하세요.`,
    answer,
    unit: "원",
    hint: "연필값과 지우개값을 더하고 쿠폰 금액을 뺀 뒤 2로 나누어요. ( ) 안의 곱셈과 나눗셈을 먼저 계산해요.",
    explanation: `(${p} × ${n} + ${P} ÷ ${k} × ${m} − ${c}) ÷ 2 = (${p * n} + ${(P / k) * m} − ${c}) ÷ 2 = ${rest} ÷ 2 = ${answer}(원)`,
    mistakes: { [rest]: "두 사람이 나누어 내므로 2로 나누어야 해요.", [(p * n + P * m - c) / 2]: `지우개 ${k}개의 값이 ${P}원이므로 한 개의 값을 먼저 구해야 해요.` },
  };
});

const shareWays = word("w5-share-ways", (rand) => {
  const n = pick(rand, [12, 18, 20, 24, 30, 36, 40, 48]);
  const ds = Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0);
  return {
    key: `${n}`,
    prompt: `구슬 ${n}개를 남김없이 똑같이 나누어 주려고 합니다. 1명과 ${n}명에게 주는 경우를 빼면, 나누어 줄 수 있는 사람 수는 모두 몇 가지인가요?`,
    answer: ds.length - 2,
    unit: "가지",
    hint: `${n}의 약수를 모두 찾아보세요.`,
    explanation: `${n}의 약수 ${ds.join(", ")} 중 1과 ${jq(n, "을/를")} 빼면 ${ds.length - 2}가지`,
  };
});

const busTimes = word("w5-bus-times", (rand) => {
  const a = pick(rand, [6, 8, 9, 10, 12, 15]);
  let b = pick(rand, [4, 6, 8, 10, 12, 15, 20]);
  if (a === b) b += 2;
  const square = rand() < 0.5;
  if (square) {
    const g = randInt(rand, 2, 9);
    const x = randInt(rand, 2, 6);
    let y = randInt(rand, 2, 6);
    if (gcd(x, y) !== 1) return null;
    if (x === y) y += 1;
    return {
      key: `sq:${g}:${x}:${y}`,
      prompt: `가로 ${g * x} cm, 세로 ${g * y} cm인 종이를 남는 부분 없이 가장 큰 정사각형 여러 개로 자르려고 합니다. 정사각형의 한 변은 몇 cm로 해야 하나요?`,
      answer: g,
      unit: "cm",
      hint: "가로와 세로를 모두 나누어떨어지게 하는 가장 큰 수예요.",
      explanation: `${jq(g * x, "과/와")} ${g * y}의 최대공약수 = ${g}(cm)`,
    };
  }
  return {
    key: `bus:${a}:${b}`,
    prompt: `두 버스가 오전 8시에 동시에 출발했습니다. 한 버스는 ${a}분마다, 다른 버스는 ${b}분마다 출발합니다. 다음에 두 버스가 처음으로 동시에 출발하는 것은 몇 분 뒤인가요?`,
    answer: lcm(a, b),
    unit: "분",
    hint: "두 수의 공배수 중 가장 작은 수예요.",
    explanation: `${jq(a, "과/와")} ${b}의 최소공배수 = ${lcm(a, b)}(분)`,
    mistakes: { [a * b]: "두 수를 곱하기만 했어요." },
  };
});

const tablesChairs = word("w5-tables-chairs", (rand) => {
  const n = randInt(rand, 5, 20);
  return {
    key: `${n}`,
    prompt: `그림과 같이 정사각형 탁자를 한 줄로 이어 붙이고 둘레에 의자를 놓습니다. 탁자 ${n}개를 이어 붙이면 의자는 몇 개 놓이나요?`,
    visual: tablesScene(),
    answer: 2 * n + 2,
    unit: "개",
    hint: "탁자가 1개 늘 때마다 의자가 몇 개씩 늘어나는지, 대응 관계를 식으로 써 보세요.",
    explanation: `(의자 수) = (탁자 수) × 2 + 2 → ${n} × 2 + 2 = ${2 * n + 2}(개)`,
    mistakes: { [4 * n]: "붙은 곳에도 의자를 놓았어요." },
  };
});

const ruleWithConst = word("w5-rule-const", (rand) => {
  const k = randInt(rand, 2, 5);
  const c = randInt(rand, 1, 6);
  const f = (x: number) => x * k + c;
  const answer = `△ = ○ × ${k} + ${c}`;
  return {
    key: `${k}:${c}`,
    // 순서쌍 (1, 7) 표기는 중학교에서 배우므로 대응 관계는 표로 보여 준다
    prompt: "표를 보고 ○와 △ 사이의 대응 관계를 나타낸 식을 고르세요.",
    visual: { kind: "table", header: ["○", "1", "2", "3", "4"], rows: [["△", ...[1, 2, 3, 4].map((x) => String(f(x)))]] },
    answer,
    choices: shuffle(rand, [answer, `△ = ○ × ${k + 1}`, `△ = ○ + ${c + k}`, `△ = ○ × ${k} − ${c}`]),
    hint: "○가 1씩 커질 때 △가 얼마씩 커지는지 먼저 보세요.",
    explanation: `○가 1 커질 때 △는 ${k}씩 커지고, ○ × ${k}에 ${jq(c, "을/를")} 더하면 △ → ${answer}`,
  };
});

/** 최대공약수가 아닌 공약수로 한 번만 약분한 분수 */
const partial = (n: number, d: number) => {
  const g = gcd(n, d);
  const f = [2, 3, 5].find((p) => g % p === 0 && p < g);
  return f ? [`${n / f}/${d / f}`] : [];
};

/** 두 단계: 전체에서 부분을 빼거나 두 반을 합친 뒤 약분한다(한 번 약분하면 끝나는 문제는 같은 차시의 reduce-fraction이 맡는다) */
const glassesFrac = word("w5-glasses-frac", (rand) => {
  const twoClasses = rand() < 0.5;
  const c1 = pick(rand, [20, 22, 24, 25, 26, 28, 30]);
  const c2 = pick(rand, [20, 22, 24, 25, 26, 28, 30]);
  const g1 = randInt(rand, 2, 9);
  const g2 = randInt(rand, 2, 9);
  // 두 반: 안경을 쓴 학생 (g1 + g2) / (c1 + c2), 한 반: 안경을 쓰지 않은 학생 (c1 − g1) / c1
  const [part, total] = twoClasses ? [g1 + g2, c1 + c2] : [c1 - g1, c1];
  if (gcd(part, total) === 1 || (twoClasses && c1 === c2)) return null;
  const answer = reduced(part, total);
  // 오답: 약분하지 않음, 덜 약분함, 한 단계를 빠뜨림(안경을 쓴 학생의 비율 / 한 반만 계산)
  const skipped = reduced(g1, c1);
  if (skipped === answer) return null;
  return {
    key: `${twoClasses}:${c1}:${g1}:${twoClasses ? `${c2}:${g2}` : ""}`,
    prompt: twoClasses
      ? `1반 학생 ${c1}명 중 ${g1}명, 2반 학생 ${c2}명 중 ${g2}명이 안경을 썼습니다. 안경을 쓴 학생은 두 반 전체 학생의 몇 분의 몇인지 기약분수로 나타낸 것을 고르세요.`
      : `우리 반 학생 ${c1}명 중 ${g1}명이 안경을 썼습니다. 안경을 쓰지 않은 학생은 우리 반 전체의 몇 분의 몇인지 기약분수로 나타낸 것을 고르세요.`,
    answer,
    choices: choices4(rand, answer, [`${part}/${total}`, ...partial(part, total), skipped].filter((c) => c !== answer), () => reduced(randInt(rand, 1, total - 1), total), true),
    hint: twoClasses ? "두 반의 학생 수와 안경을 쓴 학생 수를 각각 더한 뒤 약분해요." : "안경을 쓰지 않은 학생 수를 먼저 구한 뒤 약분해요.",
    explanation: twoClasses
      ? `${c1} + ${c2} = ${total}(명), ${g1} + ${g2} = ${part}(명) → ${part}/${total} = ${answer}`
      : `${c1} − ${g1} = ${part}(명) → ${part}/${total} = ${answer}`,
    mistakes: { [skipped]: twoClasses ? "1반만 계산했어요. 두 반을 합쳐야 해요." : "안경을 쓴 학생의 비율이에요. 쓰지 않은 학생을 구해야 해요." },
  };
});

const commonUnder = word("w5-common-under", (rand) => {
  const a = randInt(rand, 2, 12);
  let b = randInt(rand, 2, 12);
  if (a === b) b += 1;
  const limit = pick(rand, [50, 100]);
  const L = lcm(a, b);
  if (L >= limit) return null;
  return {
    key: `${a}:${b}:${limit}`,
    prompt: `분모가 ${a}인 분수와 분모가 ${b}인 분수를 통분하려고 합니다. 공통분모가 될 수 있는 수 중에서 ${limit}보다 작은 수는 모두 몇 개인가요?`,
    answer: Math.floor((limit - 1) / L),
    unit: "개",
    hint: "공통분모는 두 분모의 공배수예요. 최소공배수의 배수를 세어요.",
    explanation: `최소공배수 ${L}의 배수 중 ${limit}보다 작은 수: ${Array.from({ length: Math.floor((limit - 1) / L) }, (_, i) => L * (i + 1)).join(", ")}`,
  };
});

const juiceMix = word("w5-juice-mix", (rand) => {
  const d1 = randInt(rand, 2, 6);
  let d2 = randInt(rand, 3, 8);
  if (d1 === d2) d2 += 1;
  const n1 = randInt(rand, 1, d1 - 1);
  const n2 = randInt(rand, 1, d2 - 1);
  // 주어지는 양은 기약분수로(3/6 L 같은 표기가 나오지 않게)
  if (gcd(n1, d1) !== 1 || gcd(n2, d2) !== 1) return null;
  const L = lcm(d1, d2);
  const sum = n1 * (L / d1) + n2 * (L / d2);
  // 마신 양: 분모가 12 이하인 진분수 중 섞은 양보다 적은 것(1/42 L 같은 양이 나오지 않게)
  const drinks = Array.from({ length: L - 1 }, (_, i) => i + 1).filter((m) => m < sum && L / gcd(m, L) <= 12);
  if (drinks.length === 0) return null;
  const drink = pick(rand, drinks);
  const r = sum - drink;
  const answer = reduced(r, L);
  return {
    key: `${n1}/${d1}:${n2}/${d2}:${drink}`,
    prompt: `포도주스 ${n1}/${d1} L와 사과주스 ${n2}/${d2} L를 섞은 뒤 ${reduced(drink, L)} L를 마셨습니다. 남은 주스는 몇 L인가요?`,
    answer,
    // 오답: 마신 양을 빼지 않음, 마신 양을 더함, 분모끼리·분자끼리 더함
    choices: choices4(rand, answer, [reduced(sum, L), reduced(sum + drink, L), reduced(n1 + n2, d1 + d2)], () => reduced(randInt(rand, 1, L * 2), L)),
    hint: "통분하여 더한 뒤, 마신 양을 빼요.",
    explanation: `${n1}/${d1} + ${n2}/${d2} = ${reduced(sum, L)}, ${reduced(sum, L)} − ${reduced(drink, L)} = ${answer} L`,
    mistakes: { [reduced(sum, L)]: "마신 양을 빼지 않았어요.", [reduced(sum + drink, L)]: "마신 양은 빼야 해요." },
  };
});

const tapeMixed = word("w5-tape-mixed", (rand) => {
  const d1 = randInt(rand, 2, 5);
  let d2 = randInt(rand, 3, 6);
  if (d1 === d2) d2 += 1;
  const L = lcm(d1, d2);
  const x = randInt(rand, 2, 4) * d1 + randInt(rand, 1, d1 - 1);
  const o = randInt(rand, 1, d2 - 1);
  // 테이프 길이와 겹친 길이의 분수 부분도 기약분수로(3 2/4 m, 2/4 m 같은 표기가 나오지 않게)
  if (gcd(x % d1, d1) !== 1 || gcd(o, d2) !== 1) return null;
  const two = 2 * x * (L / d1);
  const oL = o * (L / d2);
  const total = two - oL;
  const answer = reduced(total, L);
  return {
    key: `${x}/${d1}:${o}/${d2}`,
    prompt: `길이가 ${mixedText(x, d1)} m인 색 테이프 2장을 ${o}/${d2} m만큼 겹치게 이어 붙였습니다. 이어 붙인 전체 길이는 몇 m인가요?`,
    answer,
    // 오답: 겹친 부분을 빼지 않음, 겹친 부분을 두 번 뺌, 한 장의 길이에서만 뺌
    choices: choices4(rand, answer, [reduced(two, L), reduced(total - oL, L), reduced(two / 2 - oL, L)], () => reduced(randInt(rand, L, L * 12), L)),
    hint: "두 장의 길이를 더한 뒤 겹친 길이를 빼요. 분모를 통분해요.",
    // (대분수)×(자연수)는 5-2에서 배우므로 두 장의 길이는 덧셈으로 구한다
    explanation: `${mixedText(x, d1)} + ${mixedText(x, d1)} = ${reduced(two, L)}, ${reduced(two, L)} − ${o}/${d2} = ${answer} m`,
    mistakes: { [reduced(two, L)]: "겹친 부분을 빼지 않았어요.", [reduced(total - oL, L)]: "겹친 부분은 한 번만 빼요." },
  };
});

/** 대분수 세 개의 덧셈: 이틀 동안 걸은 거리와 사흘째 거리 */
const walkMixed = word("w5-walk-mixed", (rand) => {
  const ds = [randInt(rand, 2, 6), randInt(rand, 2, 6), randInt(rand, 2, 6)];
  if (new Set(ds).size < 2) return null;
  const qs = ds.map((d) => {
    let n = randInt(rand, 1, d - 1);
    for (let i = 0; gcd(n, d) !== 1 && i < 10; i++) n = randInt(rand, 1, d - 1);
    return [randInt(rand, 1, 3) * d + n, d] as [number, number];
  });
  if (qs.some(([n, d]) => gcd(n, d) !== 1)) return null;
  const L = lcm(lcm(ds[0], ds[1]), ds[2]);
  const sum = qs.reduce((t, [n, d]) => t + n * (L / d), 0);
  const answer = reduced(sum, L);
  const name = pick(rand, NAMES);
  return {
    key: qs.join("|"),
    prompt: `${jq(name, "은/는")} 월요일에 ${mixedText(qs[0][0], qs[0][1])} km, 화요일에 ${mixedText(qs[1][0], qs[1][1])} km, 수요일에 ${mixedText(qs[2][0], qs[2][1])} km를 걸었습니다. 사흘 동안 걸은 거리는 모두 몇 km인가요?`,
    answer,
    choices: choices4(rand, answer, [reduced(sum - L, L), reduced(sum + L, L), reduced(sum - 1, L), reduced(sum + 1, L)].filter((c) => c !== answer), () => reduced(randInt(rand, L * 3, L * 12), L)),
    hint: "자연수끼리, 분수끼리 더해요. 분수는 세 분모의 공통분모로 통분해요.",
    explanation: `${qs.map(([n, d]) => mixedText(n, d)).join(" + ")} = ${answer} km`,
  };
});

/** 두 단계: 범위에 드는 사람을 센 뒤 전체에서 뺀다. 경계의 수를 목록에 넣어 이상·초과·이하·미만을 가려야 풀리게 한다 */
const rangeList = word("w5-range-list", (rand) => {
  const lo = randInt(rand, 130, 140);
  const hi = lo + randInt(rand, 8, 15);
  const loWord = pick(rand, ["이상", "초과"] as const);
  const hiWord = pick(rand, ["이하", "미만"] as const);
  const vals = shuffle(rand, [lo, hi, ...Array.from({ length: 6 }, () => randInt(rand, lo - 8, hi + 8))]);
  const fits = (v: number) => (loWord === "이상" ? v >= lo : v > lo) && (hiWord === "이하" ? v <= hi : v < hi);
  const inside = vals.filter(fits);
  const answer = vals.length - inside.length;
  if (answer === 0 || answer === vals.length) return null;
  // 경계의 수를 거꾸로 판단한 실수(이상↔초과, 이하↔미만)
  const swapped = vals.filter((v) => (loWord === "이상" ? v > lo : v >= lo) && (hiWord === "이하" ? v < hi : v <= hi)).length;
  return {
    key: `${vals.join()}:${lo}${loWord}:${hi}${hiWord}`,
    prompt: `키가 ${lo} cm ${loWord} ${hi} cm ${hiWord}인 사람만 탈 수 있는 놀이 기구가 있습니다. 학생 8명의 키가 ${vals.join(" cm, ")} cm일 때, 이 놀이 기구를 탈 수 없는 학생은 몇 명인가요?`,
    answer,
    unit: "명",
    hint: `먼저 탈 수 있는 학생을 세어요. ${jq(lo, "은/는")} ${loWord === "이상" ? "포함하고" : "포함하지 않고"}, ${jq(hi, "은/는")} ${hiWord === "이하" ? "포함해요" : "포함하지 않아요"}.`,
    explanation: `탈 수 있는 학생: ${inside.join(" cm, ") || "없음"}${inside.length ? " cm" : ""} → ${inside.length}명, 탈 수 없는 학생: 8 − ${inside.length} = ${answer}(명)`,
    mistakes: withoutAnswer(answer, { [8 - swapped]: "경계의 수를 넣을지 다시 확인해요.", [inside.length]: "탈 수 있는 학생 수예요. 탈 수 없는 학생을 구해야 해요." }),
  };
});

/** 두 단계: 올림·버림으로 상자 수를 구한 뒤 값을 계산한다 */
const busesNeeded = word("w5-buses-needed", (rand) => {
  const up = rand() < 0.5;
  if (up) {
    const per = pick(rand, [25, 30, 40, 45]);
    const n = randInt(rand, 100, 400);
    const price = randInt(rand, 3, 9) * 100;
    if (n % per === 0) return null;
    const boxes = Math.ceil(n / per);
    return {
      key: `up:${per}:${n}:${price}`,
      prompt: `공책 ${n}권을 한 상자에 ${per}권까지 담을 수 있는 상자에 모두 담으려고 합니다. 상자 한 개의 값이 ${price}원일 때, 상자를 사는 데 드는 돈은 적어도 얼마인가요?`,
      answer: boxes * price,
      unit: "원",
      hint: "남는 공책도 모두 담아야 하므로 상자 수는 올림으로 구해요. 그다음 상자 한 개의 값을 곱해요.",
      explanation: `${n} ÷ ${per} = ${Math.floor(n / per)} … ${n % per} → 상자 ${boxes}개, ${boxes} × ${price} = ${boxes * price}(원)`,
      mistakes: { [(boxes - 1) * price]: "남은 공책을 담을 상자를 빠뜨렸어요.", [boxes]: "상자 수예요. 상자를 사는 데 드는 돈을 구해야 해요." },
    };
  }
  const n = randInt(rand, 120, 490);
  const price = randInt(rand, 2, 6) * 1000;
  if (n % 10 === 0) return null;
  const boxes = Math.floor(n / 10);
  return {
    key: `down:${n}:${price}`,
    prompt: `사과 ${n}개를 한 상자에 10개씩 담아 한 상자에 ${price}원씩 팔려고 합니다. 사과를 팔아 받을 수 있는 돈은 최대 얼마인가요?`,
    answer: boxes * price,
    unit: "원",
    hint: "10개가 안 되는 사과는 상자에 담아 팔 수 없으므로 상자 수는 버림으로 구해요. 그다음 한 상자의 값을 곱해요.",
    explanation: `${n} → 버림하여 ${boxes * 10}, ${boxes}상자 → ${boxes} × ${price} = ${boxes * price}(원)`,
    mistakes: { [(boxes + 1) * price]: "10개가 안 되는 상자는 팔 수 없어요.", [boxes]: "상자 수예요. 받을 수 있는 돈을 구해야 해요." },
  };
});

const sugarPeople = word("w5-sugar-people", (rand) => {
  const d = pick(rand, [2, 3, 4, 5, 10]);
  const n = randInt(rand, 1, d - 1);
  if (gcd(n, d) !== 1) return null;
  const k = randInt(rand, 5, 12);
  const m = randInt(rand, 2, k - 2);
  const left = k - m;
  const answer = reduced(n * left, d);
  return {
    key: `${n}/${d}:${k}:${m}`,
    prompt: `물병 한 개에 물이 ${n}/${d} L씩 들어 있습니다. 물병 ${k}개 중 ${m}개의 물을 모두 마셨다면 남은 물은 모두 몇 L인가요?`,
    answer,
    // 오답: 마신 물병을 빼지 않음, 마신 물의 양, 분모에 곱함
    choices: choices4(rand, answer, [reduced(n * k, d), reduced(n * m, d), reduced(n, d * left)].filter((c) => c !== answer), () => reduced(randInt(rand, d, d * 8), d)),
    hint: "남은 물병이 몇 개인지 먼저 구한 뒤, (분수) × (자연수)로 계산해요. 분자에 자연수를 곱하고 분모는 그대로 둬요.",
    explanation: `남은 물병 ${k} − ${m} = ${left}(개), ${n}/${d} × ${left} = ${n * left}/${d}${`${n * left}/${d}` === answer ? "" : ` = ${answer}`} L`,
    mistakes: withoutAnswer(answer, { [reduced(n * k, d)]: "마신 물병을 빼지 않았어요.", [reduced(n * m, d)]: "마신 물의 양이에요." }),
  };
});

const fracOfFrac = word("w5-frac-of-frac", (rand) => {
  const total = pick(rand, [12, 18, 24, 30, 36]);
  const d1 = pick(rand, [2, 3]);
  const d2 = pick(rand, [2, 3]);
  const n1 = randInt(rand, 1, d1 - 1);
  const n2 = randInt(rand, 1, d2 - 1);
  const v = (total * n1 * n2) / (d1 * d2);
  if (!Number.isInteger(v)) return null;
  return {
    key: `${total}:${n1}/${d1}:${n2}/${d2}`,
    prompt: `끈 ${total} m 중 ${jq(`${n1}/${d1}`, "을/를")} 동생에게 주고, 동생은 받은 끈의 ${jq(`${n2}/${d2}`, "을/를")} 사용했습니다. 동생이 사용한 끈은 몇 m인가요?`,
    answer: v,
    unit: "m",
    hint: `${total} × ${n1}/${d1} × ${jq(`${n2}/${d2}`, "을/를")} 계산해요.`,
    explanation: `${total} × ${n1}/${d1} = ${(total * n1) / d1}, ${(total * n1) / d1} × ${n2}/${d2} = ${v}(m)`,
  };
});

const juiceBottles = word("w5-juice-bottles", (rand) => {
  const per = randInt(rand, 12, 25) / 10;
  const n = randInt(rand, 3, 8);
  const drink = randInt(rand, 5, 20) / 10;
  const r = Number((per * n - drink).toFixed(1));
  if (r <= 0) return null;
  return {
    key: `${per}:${n}:${drink}`,
    prompt: `한 병에 ${per} L씩 들어 있는 주스가 ${n}병 있습니다. 그중 ${drink} L를 마셨다면 남은 주스는 몇 L인가요?`,
    answer: trim(r, 1),
    unit: "L",
    hint: "먼저 (소수) × (자연수)로 전체 양을 구해요.",
    explanation: `${per} × ${n} = ${trim(per * n, 1)}, ${trim(per * n, 1)} − ${drink} = ${trim(r, 1)}(L)`,
  };
});

/** 두 단계: 잘라 내고 남은 길이(소수의 뺄셈)를 구한 뒤 (소수) × (소수) */
const steelWeight = word("w5-steel-weight", (rand) => {
  const w10 = randInt(rand, 12, 48);
  const len10 = randInt(rand, 25, 50);
  const cut10 = randInt(rand, 5, 15);
  const rest10 = len10 - cut10;
  // 무게와 남은 길이가 모두 소수 한 자리 수여야 (소수) × (소수)가 된다(2 m처럼 자연수가 되면 다시 뽑는다)
  if (w10 % 10 === 0 || len10 % 10 === 0 || cut10 % 10 === 0 || rest10 % 10 === 0) return null;
  const [w, len, cut, rest] = [w10, len10, cut10, rest10].map((x) => trim(x / 10, 1));
  const answer = trim((w10 * rest10) / 100, 2);
  return {
    key: `${w}:${len}:${cut}`,
    prompt: `1 m의 무게가 ${w} kg인 철근 ${len} m 중에서 ${cut} m를 잘라 내었습니다. 남은 철근의 무게는 몇 kg인가요?`,
    answer,
    unit: "kg",
    hint: "남은 철근의 길이를 먼저 구한 뒤 (1 m의 무게) × (길이)를 계산해요. 곱의 소수점 아래 자리 수는 두 수의 자리 수의 합이에요.",
    explanation: `${len} − ${cut} = ${rest}(m), ${w} × ${rest} = ${answer}(kg)`,
    mistakes: { [trim((w10 * len10) / 100, 2)]: "잘라 낸 철근을 빼지 않았어요.", [trim((w10 * cut10) / 100, 2)]: "잘라 낸 철근의 무게예요." },
  };
});

const cuboidHeight = word("w5-cuboid-height", (rand) => {
  const a = randInt(rand, 3, 12);
  const b = randInt(rand, 3, 12);
  const c = randInt(rand, 3, 12);
  return {
    key: `${a}:${b}:${c}`,
    prompt: `직육면체의 모든 모서리의 길이의 합이 ${4 * (a + b + c)} cm입니다. 가로가 ${a} cm, 세로가 ${b} cm일 때 높이는 몇 cm인가요?`,
    answer: c,
    unit: "cm",
    hint: "모서리의 합을 4로 나누면 가로 + 세로 + 높이예요.",
    explanation: `${4 * (a + b + c)} ÷ 4 − ${a} − ${b} = ${c}(cm)`,
  };
});

/** 공을 더 넣거나 꺼낸 뒤의 가능성. 답은 0, 1/2, 1 가운데 하나(2022 개정 범위) */
const chanceCompare = word("w5-chance-compare", (rand) => {
  const r = randInt(rand, 1, 6);
  let b = randInt(rand, 1, 6);
  if (b === r) b = r === 6 ? 5 : r + 1;
  const act = pick(rand, ["add-less", "take-more", "take-all-red", "take-all-blue"]);
  const less = r < b ? "빨간" : "파란";
  const more = r < b ? "파란" : "빨간";
  const gap = Math.abs(r - b);
  const [r2, b2, action] =
    act === "add-less" ? [Math.max(r, b), Math.max(r, b), `이 주머니에 ${less} 공 ${gap}개를 더 넣었습니다`]
    : act === "take-more" ? [Math.min(r, b), Math.min(r, b), `이 주머니에서 ${more} 공 ${gap}개를 꺼냈습니다`]
    : act === "take-all-red" ? [0, b, "이 주머니에서 빨간 공을 모두 꺼냈습니다"]
    : [r, 0, "이 주머니에서 파란 공을 모두 꺼냈습니다"];
  const color = pick(rand, ["빨간", "파란", "빨간", "파란", "노란"]);
  const hit = color === "빨간" ? r2 : color === "파란" ? b2 : 0;
  const answer = hit === 0 ? "0" : hit === r2 + b2 ? "1" : "1/2";
  return {
    key: `${r}:${b}:${act}:${color}`,
    prompt: `주머니에 빨간 공 ${r}개와 파란 공 ${b}개가 들어 있습니다. ${action}. 이제 공 한 개를 꺼낼 때 ${color} 공일 가능성을 수로 나타낸 것을 고르세요.`,
    answer,
    choices: ["0", "1/2", "1"],
    hint: "먼저 공을 넣거나 꺼낸 뒤 주머니에 들어 있는 빨간 공과 파란 공의 수를 구해요. 불가능하면 0, 반반이면 1/2, 확실하면 1이에요.",
    explanation: `빨간 공 ${r2}개, 파란 공 ${b2}개 → ${color} 공일 가능성은 ${answer === "0" ? "불가능하므로 0" : answer === "1" ? "확실하므로 1" : "반반이므로 1/2"}`,
  };
});

/* ── 6학년 ── */

/** 몫이 1보다 작은 나눗셈으로 한 명의 양을 구한 뒤 여러 명의 양 */
const juiceShare = word("w6-juice-share", (rand) => {
  const b = randInt(rand, 4, 12);
  const a = randInt(rand, 1, b - 1);
  const m = randInt(rand, 2, b - 1);
  if (gcd(a, b) !== 1) return null;
  const answer = reduced(a * m, b);
  return {
    key: `${a}:${b}:${m}`,
    prompt: `주스 ${a} L를 ${b}명이 똑같이 나누어 마셨습니다. ${m}명이 마신 주스는 모두 몇 L인가요?`,
    answer,
    choices: choices4(rand, answer, [reduced(a, b), reduced(b * m, a), reduced(a * m, b * m)], () => reduced(randInt(rand, 1, b * 2), b)),
    hint: `먼저 한 명이 마신 주스를 ${a} ÷ ${b}의 몫으로 구해요.`,
    explanation: `한 명: ${a} ÷ ${b} = ${a}/${b}(L), ${m}명: ${a}/${b} × ${m} = ${answer}(L)`,
    mistakes: { [reduced(a, b)]: "한 명이 마신 양까지만 구했어요." },
  };
});

/** (분수)÷(자연수)로 한 도막을 구한 뒤 사용한 도막들의 길이 */
const ribbonPieces = word("w6-ribbon-pieces", (rand) => {
  const d = randInt(rand, 3, 9);
  const n = randInt(rand, 1, d - 1);
  const k = randInt(rand, 3, 6);
  const use = randInt(rand, 2, k - 1);
  if (gcd(n, d) !== 1 || n % k === 0) return null;
  const answer = reduced(n * use, d * k);
  return {
    key: `${n}/${d}:${k}:${use}`,
    prompt: `리본 ${n}/${d} m를 똑같이 ${k}도막으로 자른 뒤 그중 ${use}도막을 사용했습니다. 사용한 리본은 몇 m인가요?`,
    answer,
    choices: choices4(rand, answer, [reduced(n, d * k), reduced(n * k, d), reduced(n * use, d)], () => reduced(randInt(rand, 1, d * k), d * k)),
    hint: "먼저 한 도막의 길이를 구해요. ÷ (자연수)는 × 1/(자연수)로 바꾸어 계산해요.",
    explanation: `한 도막: ${n}/${d} ÷ ${k} = ${reduced(n, d * k)}(m), ${use}도막: ${reduced(n, d * k)} × ${use} = ${answer}(m)`,
    mistakes: { [reduced(n, d * k)]: "한 도막의 길이까지만 구했어요." },
  };
});

const prismFromFaces = word("w6-prism-faces", (rand) => {
  const n = randInt(rand, 3, 8);
  const POLY = ["", "", "", "삼", "사", "오", "육", "칠", "팔"];
  const prism = rand() < 0.5;
  const answer = `${POLY[n]}각${prism ? "기둥" : "뿔"}`;
  return {
    key: `${n}:${prism}`,
    prompt: prism ? `옆면이 ${n}개인 각기둥의 이름을 고르세요.` : `모서리가 ${2 * n}개인 각뿔의 이름을 고르세요.`,
    answer,
    choices: choices4(
      rand,
      answer,
      [`${POLY[n]}각${prism ? "뿔" : "기둥"}`, `${POLY[n === 8 ? 7 : n + 1]}각${prism ? "기둥" : "뿔"}`, `${POLY[n === 3 ? 5 : n - 1]}각${prism ? "기둥" : "뿔"}`],
      () => `${POLY[randInt(rand, 3, 8)]}각${rand() < 0.5 ? "기둥" : "뿔"}`,
    ),
    hint: prism ? "각기둥의 옆면 수는 밑면의 변의 수와 같아요." : "각뿔의 모서리 수는 밑면의 변의 수의 2배예요.",
    explanation: `${answer}입니다.`,
  };
});

const prismVertices = word("w6-prism-vertices", (rand) => {
  const n = randInt(rand, 3, 9);
  return {
    key: `${n}`,
    prompt: `모서리가 ${3 * n}개인 각기둥이 있습니다. 이 각기둥의 꼭짓점과 면의 수의 합은 몇 개인가요?`,
    answer: 2 * n + n + 2,
    unit: "개",
    hint: "모서리 수 ÷ 3 = 한 밑면의 변의 수예요.",
    explanation: `밑면 ${POLY_NAMES[n]} → 꼭짓점 ${2 * n}, 면 ${n + 2} → ${3 * n + 2}개`,
  };
});

const wireCut = word("w6-wire-cut", (rand) => {
  // 각 자리에서 나누어떨어지지 않는 (소수)÷(자연수) 차시: 한 도막은 1 m보다 길고, 0을 내리지 않고 끝난다
  const k = randInt(rand, 3, 8);
  const q = randInt(rand, 101, 299) / 100;
  const a = Number((q * k).toFixed(2));
  const places = (x: number) => (trim(x).split(".")[1] ?? "").length;
  // 몫(한 도막)에 0이 있으면(1.05) 다음 차시(몫에 0이 있는 나눗셈) 내용이므로 다시 뽑기(2.1처럼 끝의 0이 없는 것은 그대로)
  if (Number.isInteger(a) || places(a) < places(q) || trim(q).includes("0")) return null;
  const use = randInt(rand, 1, k - 1);
  return {
    key: `${a}:${k}:${use}`,
    prompt: `철사 ${a} m를 똑같이 ${k}도막으로 자른 뒤 그중 ${use}도막을 사용했습니다. 사용한 철사는 몇 m인가요?`,
    answer: trim(q * use, 2),
    unit: "m",
    hint: "먼저 한 도막의 길이를 (소수) ÷ (자연수)로 구해요.",
    explanation: `${a} ÷ ${k} = ${trim(q, 2)}, ${trim(q, 2)} × ${use} = ${trim(q * use, 2)}(m)`,
  };
});

/** 전체와 남학생 수로 여학생 수를 구한 뒤 비율 */
const girlRatio = word("w6-girl-ratio", (rand) => {
  const boys = pick(rand, [10, 12, 15, 16, 20, 25]);
  const girls = randInt(rand, 5, boys + 5);
  const v = girls / boys;
  if (String(v).length > 5 || girls === boys) return null;
  return {
    key: `${boys}:${girls}`,
    prompt: `우리 반 학생은 모두 ${boys + girls}명이고, 그중 남학생은 ${boys}명입니다. 남학생 수에 대한 여학생 수의 비율을 소수로 나타내세요.`,
    answer: trim(v, 3),
    hint: "먼저 여학생 수를 구해요. '~에 대한'의 앞이 기준량이에요. (여학생 수) ÷ (남학생 수)",
    explanation: `여학생 ${boys + girls} − ${boys} = ${girls}(명), ${girls} ÷ ${boys} = ${trim(v, 3)}`,
    mistakes: { [trim(boys / girls, 3)]: "기준량과 비교하는 양을 바꿨어요.", [trim(girls / (boys + girls), 3)]: "전체 학생 수를 기준량으로 했어요." },
  };
});

/** 원금과 1년 뒤 찾은 돈으로 이자율(원가·이익은 초등 교과서에 없어 이자율 상황으로) */
const interestRate = word("w6-interest-rate", (rand) => {
  const a = randInt(rand, 2, 20) * 10000;
  const p = pick(rand, [2, 3, 4, 5, 10]);
  const got = a + (a * p) / 100;
  return {
    key: `${a}:${p}`,
    prompt: `은행에 ${a.toLocaleString("ko-KR")}원을 저금했더니 1년 뒤에 이자가 붙어 ${got.toLocaleString("ko-KR")}원을 찾았습니다. 저금한 돈에 대한 이자의 비율(이자율)은 몇 %인가요?`,
    answer: p,
    unit: "%",
    hint: "먼저 이자를 구해요. 이자율 = (이자) ÷ (저금한 돈) × 100",
    explanation: `이자 ${got} − ${a} = ${(a * p) / 100}(원), ${(a * p) / 100} ÷ ${a} × 100 = ${p}(%)`,
    mistakes: { [(a * p) / 100]: "이자까지만 구했어요." },
  };
});

/** 봄은 10~50%(5의 배수), 여름은 봄의 절반·봄보다 5·10만큼 작게·봄과 같게 중 하나, 가을과 겨울은 같다(5의 배수) */
const circleGraphRest = word("w6-circle-graph-rest", (rand) => {
  const a = randInt(rand, 2, 10) * 5;
  const rules: [string, number][] = [
    ["봄의 백분율보다 5만큼 작습니다", a - 5],
    ["봄의 백분율보다 10만큼 작습니다", a - 10],
    ["봄의 백분율과 같습니다", a],
  ];
  if (a % 10 === 0) rules.push(["봄의 백분율의 절반입니다", a / 2]);
  const [rule, b] = pick(rand, rules);
  if (b <= 0) return null;
  const rest = 100 - a - b;
  if (rest <= 0 || rest % 10 !== 0) return null;
  return {
    key: `${a}:${rule}`,
    prompt: `좋아하는 계절을 조사하여 원그래프로 나타냈습니다. 봄은 ${a}%이고, 여름의 백분율은 ${rule}. 가을과 겨울의 백분율이 같다면 가을은 몇 %인가요?`,
    answer: rest / 2,
    unit: "%",
    hint: "전체는 100%예요. 여름의 백분율을 먼저 구하고, 봄과 여름을 뺀 나머지를 둘로 나눠요.",
    explanation: `여름: ${b}%, 100 − ${a} − ${b} = ${rest}(%), ${rest} ÷ 2 = ${rest / 2}(%)`,
    mistakes: { [rest]: "가을과 겨울을 합한 백분율까지만 구했어요." },
  };
});

const stoneVolume = word("w6-stone-volume", (rand) => {
  const a = randInt(rand, 10, 30);
  const b = randInt(rand, 10, 30);
  const rise = randInt(rand, 1, 6);
  return {
    key: `${a}:${b}:${rise}`,
    prompt: `가로 ${a} cm, 세로 ${b} cm인 직육면체 모양 수조에 물이 들어 있습니다. 돌을 완전히 잠기게 넣었더니 물의 높이가 ${rise} cm 높아졌습니다. 돌의 부피는 몇 cm³인가요?`,
    answer: a * b * rise,
    unit: "cm³",
    hint: "늘어난 물의 부피가 돌의 부피와 같아요.",
    explanation: `${a} × ${b} × ${rise} = ${a * b * rise}(cm³)`,
  };
});

const cubeSurfaceSide = word("w6-cube-surface", (rand) => {
  const s = randInt(rand, 2, 12);
  return {
    key: `${s}`,
    prompt: `겉넓이가 ${6 * s * s} cm²인 정육면체의 부피는 몇 cm³인가요?`,
    answer: s ** 3,
    unit: "cm³",
    hint: "겉넓이를 6으로 나누면 한 면의 넓이예요. 한 모서리의 길이를 구해요.",
    explanation: `한 면 ${s * s} cm² → 한 모서리 ${s} cm → 부피 ${s ** 3} cm³`,
  };
});

/** 밀가루의 일부를 쓰고 남은 것으로 빵 만들기: 분모가 다른 (분수)÷(분수), 모두 기약분수 */
// 남은 밀가루 = k × c/e, 처음 밀가루 = 남은 밀가루 × 3/2(1/3을 쿠키에 씀).
// 분수 ÷ 분수 차시이고 생활 속 양은 가분수로 쓰지 않으므로 처음 밀가루가 진분수인 조합만 미리 고른다
const FLOUR = Array.from({ length: 10 }, (_, i) => i + 3).flatMap((e) =>
  Array.from({ length: e - 1 }, (_, i) => i + 1).flatMap((c) =>
    [2, 3, 4, 5, 6].flatMap((k) => {
      const g = gcd(k * c * 3, e * 2);
      const [tn, td] = [(k * c * 3) / g, (e * 2) / g];
      return gcd(c, e) === 1 && td > 1 && tn < td ? [{ e, c, k, tn, td }] : [];
    }),
  ),
);
const flourBread = word("w6-flour-bread", (rand) => {
  const { e, c, k, tn, td } = pick(rand, FLOUR);
  const rest = reduced(k * c, e);
  return {
    key: `${e}:${c}:${k}`,
    prompt: `밀가루 ${tn}/${td} kg 중에서 1/3은 쿠키를 만드는 데 쓰고, 나머지로 빵을 만들려고 합니다. 빵 한 개를 만드는 데 밀가루가 ${c}/${e} kg 필요하다면 빵을 몇 개 만들 수 있나요?`,
    answer: k,
    unit: "개",
    hint: "먼저 빵을 만드는 데 쓸 밀가루(전체의 2/3)를 구한 뒤, 나누는 분수의 분모와 분자를 바꾸어 곱해요.",
    explanation: `남은 밀가루 ${tn}/${td} × 2/3 = ${rest}(kg), ${rest} ÷ ${c}/${e} = ${k}(개)`,
  };
});

const bottlesFill = word("w6-bottles-fill", (rand) => {
  // 1 L 병은 나머지가 뻔하므로 빼고
  const size = pick(rand, [3, 4, 5, 6, 7, 8, 9, 12, 15]) / 10;
  const n = randInt(rand, 3, 12);
  const extra = randInt(rand, 1, Math.round(size * 10) - 1) / 10;
  const total = Number((size * n + extra).toFixed(1));
  return {
    key: `${size}:${n}:${extra}`,
    prompt: `물 ${total} L를 ${size} L들이 병에 가득 채워 담으려고 합니다. 가득 찬 병은 몇 개가 되고, 남는 물은 몇 L인가요?`,
    answer: `${n},${extra}`,
    unit: ["개", "L"],
    hint: "소수점을 옮겨 자연수의 나눗셈으로 몫을 구하고, 나머지의 소수점은 처음 자리에 맞춰요.",
    explanation: `${total} ÷ ${size} = ${n} … ${extra}`,
  };
});

const fuelEfficiency = word("w6-fuel", (rand) => {
  const km = randInt(rand, 50, 300);
  const l = randInt(rand, 30, 150) / 10;
  const v = Math.round((km / l) * 10) / 10;
  // 소수 셋째 자리 안에서 나누어떨어지면 반올림할 것이 없거나 풀이의 '…'가 틀리고, 연비는 자동차다운 값(8~20 km)만.
  // 반올림한 값이 자연수(12.0)인 것도 뺀다
  if ((km * 10000) % Math.round(l * 10) === 0 || v < 8 || v > 20 || Number.isInteger(v)) return null;
  return {
    key: `${km}:${l}`,
    prompt: `자동차가 휘발유 ${l} L로 ${km} km를 달렸습니다. 휘발유 1 L로 달린 거리는 몇 km인지 반올림하여 소수 첫째 자리까지 나타내세요.`,
    answer: trim(v, 1),
    unit: "km",
    hint: `${josa(`${km} ÷ ${l}`, "을/를")} 소수 둘째 자리까지 구한 뒤 반올림해요.`,
    explanation: `${km} ÷ ${l} = ${trim(km / l, 3)}… → ${trim(v, 1)} km`,
  };
});

/** 이미 복사한 장수를 빼고 남은 장수를 비례식으로(두 단계). 남은 장수가 1분 장수의 배수가 아닐 때도 있다 */
const printTime = word("w6-print-time", (rand) => {
  const m = randInt(rand, 2, 6);
  const p = randInt(rand, 5, 30);
  const g = gcd(m, p);
  const t = randInt(rand, 2, 10);
  const rest = (p / g) * t;
  const done = randInt(rand, 2, 10) * 5;
  const total = rest + done;
  const answer = (m / g) * t;
  if (rest < p || answer > 60) return null;
  return {
    key: `${m}:${p}:${t}:${done}`,
    prompt: `복사기가 ${m}분 동안 ${p}장을 복사합니다. 같은 빠르기로 모두 ${total}장을 복사하려고 하는데, 지금까지 ${done}장을 복사했습니다. 남은 것을 모두 복사하려면 몇 분이 더 걸리나요?`,
    answer,
    unit: "분",
    hint: `먼저 남은 장수를 구한 뒤 비례식 ${m} : ${p} = □ : (남은 장수)를 세워요.`,
    explanation: `남은 장수: ${total} − ${done} = ${rest}(장), ${m} : ${p} = □ : ${rest} → ${p} × □ = ${m} × ${rest} = ${m * rest}, □ = ${m * rest} ÷ ${p} = ${answer}(분)`,
    mistakes: (m * total) % p === 0 ? { [(m * total) / p]: "이미 복사한 장수까지 넣어 계산했어요." } : undefined,
  };
});

const shareSave = word("w6-share-save", (rand) => {
  const a = randInt(rand, 1, 5);
  let b = randInt(rand, 1, 5);
  if (a === b) b += 1;
  const unit = randInt(rand, 2, 9) * 1000;
  const total = (a + b) * unit;
  if (a * unit < 2000) return null;
  const save = randInt(rand, 1, (a * unit) / 1000 - 1) * 1000;
  return {
    key: `${a}:${b}:${unit}:${save}`,
    prompt: `용돈 ${total.toLocaleString("ko-KR")}원을 형과 동생이 ${josa(`${a} : ${b}`, "으로/로")} 나누어 가졌습니다. 형이 받은 돈 중 ${save.toLocaleString("ko-KR")}원을 저금했다면 형에게 남은 돈은 얼마인가요?`,
    answer: a * unit - save,
    unit: "원",
    hint: `형의 몫 = 전체 × ${a}/${a + b}`,
    explanation: `${total} × ${a}/${a + b} = ${a * unit}, ${a * unit} − ${save} = ${a * unit - save}(원)`,
  };
});

const hoopDistance = word("w6-hoop", (rand) => {
  const d = randInt(rand, 30, 80);
  const n = randInt(rand, 2, 10);
  return {
    key: `${d}:${n}`,
    prompt: `지름이 ${d} cm인 굴렁쇠를 ${n}바퀴 굴렸습니다. 굴렁쇠가 굴러간 거리는 몇 cm인가요? (원주율 3.14)`,
    answer: trim(d * 3.14 * n, 2),
    unit: "cm",
    hint: "한 바퀴 굴러간 거리는 원주와 같아요.",
    explanation: `${d} × 3.14 × ${n} = ${trim(d * 3.14 * n, 2)}(cm)`,
  };
});

const cylinderNetPerimeter = word("w6-cylinder-net", (rand) => {
  const r = randInt(rand, 2, 8);
  const h = randInt(rand, 3, 15);
  const c = Number((2 * r * 3.14).toFixed(2));
  return {
    key: `${r}:${h}`,
    prompt: `밑면의 반지름이 ${r} cm, 높이가 ${h} cm인 원기둥의 전개도에서 옆면(직사각형)의 둘레는 몇 cm인가요? (원주율 3.14)`,
    answer: trim(2 * (c + h), 2),
    unit: "cm",
    hint: "옆면의 가로는 밑면의 둘레, 세로는 높이예요.",
    explanation: `(${trim(c, 2)} + ${h}) × 2 = ${trim(2 * (c + h), 2)}(cm)`,
  };
});

export const words56: WordMap = {
  "g5-s1-mixed-calc": { order: [mixedWord], "one-expression": [shoppingChange] },
  "g5-s1-factors": { divisors: [shareWays], "gcd-lcm": [busTimes] },
  "g5-s1-correspondence": { table: [tablesChairs], rule: [ruleWithConst] },
  "g5-s1-reduce-common": { reduce: [glassesFrac], common: [commonUnder] },
  "g5-s1-frac-add-sub": { proper: [juiceMix], mixed: [walkMixed], "mixed-sub": [tapeMixed] },
  "g5-s2-range-rounding": { range: [rangeList], round: [busesNeeded] },
  "g5-s2-frac-mul": { "times-whole": [sugarPeople], "times-frac": [fracOfFrac] },
  "g5-s2-dec-mul": { "dec-whole": [juiceBottles], "dec-dec": [steelWeight] },
  "g5-s2-cuboid": { edges: [cuboidHeight] },
  "g5-s2-average": { chance: [chanceCompare] },
  "g6-s1-frac-div": { "whole-whole": [juiceShare], "frac-whole": [ribbonPieces] },
  "g6-s1-prisms": { names: [prismFromFaces], parts: [prismVertices] },
  "g6-s1-dec-div": { "dec-whole": [wireCut] },
  "g6-s1-ratio": { ratio: [girlRatio], percent: [interestRate] },
  "g6-s1-graphs": { "band-circle": [circleGraphRest] },
  "g6-s1-volume-surface": { volume: [stoneVolume], surface: [cubeSurfaceSide] },
  "g6-s2-frac-div": { "frac-frac": [flourBread] },
  "g6-s2-dec-div": { "dec-dec": [bottlesFill], round: [fuelEfficiency] },
  "g6-s2-proportion": { proportion: [printTime], share: [shareSave] },
  "g6-s2-circle-area": { circumference: [hoopDistance] },
  "g6-s2-round-solids": { net: [cylinderNetPerimeter] },
};
