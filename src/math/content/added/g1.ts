import type { WordMap, WordSpec } from "../words/word";
import { word } from "../words/word";
import type { Level } from "../types";
import { pick, randInt, shuffle } from "../../lib/random";
import { josa } from "../josa";
import { clockScene } from "../generators/pictures";
import {
  buildCounts, buildScene, Canvas, flatsScene, offsetBarsScene, randomBuild, randomSolid, SOLID_KINDS, solidsScene, tokensScene, twoPlatesScene,
  type FlatKind, type Pt, type Solid,
} from "../lessons/g1-pics";

/*
 * 1학년 단원마다 새로 더한 생성기(하·중·상 하나씩). 같은 차시의 기존 생성기와 겹치지 않는 유형만 넣었다.
 * id는 모두 a1- 로 시작한다.
 */

type Make = (rand: () => number) => WordSpec | null;
const gen = (id: string, level: Level, make: Make) => word(id, make, level);

const NAMES = ["지우", "서아", "수아", "도하", "유나", "이수"];
const ONES_N = ["", "하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟", "아홉"];
const TENS_N = ["", "열", "스물", "서른", "마흔", "쉰", "예순", "일흔", "여든", "아흔"];
const native = (n: number) => TENS_N[Math.floor(n / 10)] + ONES_N[n % 10];

/** 정답 + 서로 다른 오답 3개를 섞는다. 모자라면 null */
function four(rand: () => number, answer: string, distractors: string[]): string[] | null {
  const ds = [...new Set(distractors.filter((d) => d !== answer))].slice(0, 3);
  return ds.length < 3 ? null : shuffle(rand, [answer, ...ds]);
}

/* ════════ 1-1 9까지의 수 ════════ */

/** 하: 두 접시의 ● 중 더 적은 쪽은 몇 개 */
export const n9FewerPlate = gen("a1-n9-fewer-plate", 1, (rand) => {
  const a = randInt(rand, 1, 9);
  const b = randInt(rand, 1, 9);
  if (a === b) return null;
  const less = Math.min(a, b);
  return {
    key: `${a},${b}`,
    prompt: "그림에서 두 접시의 ●를 하나씩 짝 지어 비교하세요. ●가 더 적은 접시에는 ●가 몇 개 있나요?",
    visual: twoPlatesScene(a, b),
    answer: less,
    unit: "개",
    hint: "●를 하나씩 짝 지었을 때 짝이 모자라는 쪽이 더 적어요.",
    explanation: `왼쪽 접시는 ${a}개, 오른쪽 접시는 ${b}개입니다. ${josa(less, "이/가")} ${Math.max(a, b)}보다 작으므로 더 적은 접시의 ●는 ${less}개입니다.`,
    mistakes: { [Math.max(a, b)]: "더 많은 쪽의 수를 썼어요." },
  };
});

/** 중: 수를 순서대로 쓰지 않은 것 고르기 */
export const n9WrongSeq = gen("a1-n9-wrong-seq", 2, (rand) => {
  const starts = shuffle(rand, [1, 2, 3, 4, 5]).slice(0, 4);
  const seqs = starts.map((s) => [s, s + 1, s + 2, s + 3, s + 4].filter((x) => x <= 9).slice(0, 4));
  // 정답(틀린 줄): 하나를 건너뛰거나 두 수의 자리를 바꾼다
  const bad = [...seqs[0]];
  const skip = rand() < 0.5;
  if (skip) {
    const i = randInt(rand, 1, 3);
    for (let k = i; k < 4; k++) bad[k] += 1;
    if (bad[3] > 9) return null;
  } else {
    const i = randInt(rand, 0, 2);
    [bad[i], bad[i + 1]] = [bad[i + 1], bad[i]];
  }
  const answer = bad.join(", ");
  const choices = four(rand, answer, seqs.slice(1).map((s) => s.join(", ")));
  if (!choices) return null;
  return {
    key: `${answer}|${seqs.slice(1).map((s) => s[0]).join("")}`,
    prompt: "1부터 9까지의 수 중 이어지는 수를 순서대로 쓰려고 합니다. 순서대로 쓰지 않은 것을 고르세요.",
    answer,
    choices,
    hint: "순서대로 쓰면 수가 1씩 커져요. 1씩 커지지 않는 곳을 찾아보세요.",
    explanation: `${answer}에서는 ${skip ? "수 하나를 건너뛰었습니다" : "두 수의 순서가 바뀌었습니다"}. 나머지는 모두 1씩 커지도록 순서대로 썼습니다.`,
  };
});

/** 상: 계단 칸 수로 1 큰 수, 1 작은 수 */
export const n9Stairs = gen("a1-n9-stairs", 3, (rand) => {
  const a = randInt(rand, 2, 8);
  const up = rand() < 0.5;
  const ans = up ? a + 1 : a - 1;
  const name = pick(rand, NAMES);
  return {
    key: `${a}${up ? "u" : "d"}`,
    prompt: `계단 칸에 아래에서부터 1부터 9까지의 수가 차례로 쓰여 있습니다. ${josa(name, "은/는")} ${josa(a, "이/가")} 쓰인 칸에 서 있다가 ${up ? "아래로 한 칸 내려간 뒤 위로 두 칸 올라갔습니다" : "위로 한 칸 올라간 뒤 아래로 두 칸 내려갔습니다"}. 지금 서 있는 칸에 쓰인 수는 무엇인가요?`,
    answer: ans,
    hint: "위로 한 칸 가면 1만큼 더 큰 수, 아래로 한 칸 가면 1만큼 더 작은 수예요.",
    explanation: up
      ? `${a}보다 1만큼 더 작은 수는 ${a - 1}, ${a - 1}보다 1만큼 더 큰 수는 ${a}, 다시 1만큼 더 큰 수는 ${josa(a + 1, "이에요/예요")}.`
      : `${a}보다 1만큼 더 큰 수는 ${a + 1}, ${a + 1}보다 1만큼 더 작은 수는 ${a}, 다시 1만큼 더 작은 수는 ${josa(a - 1, "이에요/예요")}.`,
    mistakes: { [up ? a + 3 : a - 3]: "한 칸 움직인 것을 반대로 생각했어요." },
  };
});

/* ════════ 1-1 여러 가지 모양 ════════ */

const SNAME = { box: "상자 모양", cyl: "둥근기둥 모양", ball: "공 모양" } as const;

/** 하: 쌓아 만든 모양에 쓴 모양은 모두 몇 개 */
export const solBuildTotal = gen("a1-sol-build-total", 1, (rand) => {
  const b = randomBuild(rand);
  const total = buildCounts(b).reduce((s, x) => s + x, 0);
  if (total > 9) return null;
  return {
    key: b.map((col) => col.map((s) => `${s.kind}${s.v}`).join("")).join("|"),
    prompt: "그림과 같은 모양을 만드는 데 사용한 모양은 모두 몇 개인가요?",
    visual: buildScene(b),
    answer: total,
    unit: "개",
    hint: "아래에서부터 하나씩 짚으며 빠짐없이 세어 보세요.",
    explanation: `상자 모양, 둥근기둥 모양, 공 모양을 하나씩 세면 모두 ${total}개입니다.`,
  };
});

function randomSolids(rand: () => number, n: number): Solid[] {
  return Array.from({ length: n }, () => randomSolid(rand, pick(rand, SOLID_KINDS)));
}

/** 중: 한 가지 모양을 모두 빼면 남는 모양의 수 */
export const solKindsLeft = gen("a1-sol-kinds-left", 2, (rand) => {
  const items = randomSolids(rand, randInt(rand, 5, 8));
  const k = pick(rand, SOLID_KINDS);
  const removed = items.filter((s) => s.kind === k).length;
  if (removed === 0 || removed === items.length) return null;
  const left = items.length - removed;
  return {
    key: `${k}:${items.map((s) => `${s.kind}${s.v}`).join("")}`,
    prompt: `그림에서 ${josa(SNAME[k], "을/를")} 모두 빼면 남는 모양은 몇 개인가요?`,
    visual: solidsScene(items, "상자 모양, 둥근기둥 모양, 공 모양 여러 개"),
    answer: left,
    unit: "개",
    hint: `${josa(SNAME[k], "을/를")} 먼저 찾아 세고, 나머지 모양을 세어 보세요.`,
    explanation: `모양은 모두 ${items.length}개이고 그중 ${josa(SNAME[k], "은/는")} ${removed}개입니다. 남는 모양은 ${left}개입니다.`,
    mistakes: { [removed]: "빼는 모양의 수를 썼어요." },
  };
});

/** 상: 굴러가는 모양은 굴러가지 않는 모양보다 몇 개 더 많은가 */
export const solRollMore = gen("a1-sol-roll-more", 3, (rand) => {
  const items = randomSolids(rand, randInt(rand, 6, 8));
  const box = items.filter((s) => s.kind === "box").length;
  const roll = items.length - box;
  if (box === 0 || roll <= box) return null;
  return {
    key: items.map((s) => `${s.kind}${s.v}`).join(""),
    prompt: "그림의 모양을 '굴러가는 모양'과 '굴러가지 않는 모양'으로 나누었습니다. 굴러가는 모양은 굴러가지 않는 모양보다 몇 개 더 많은지 풀이 과정과 함께 구하세요.",
    visual: solidsScene(items, "상자 모양, 둥근기둥 모양, 공 모양 여러 개"),
    answer: roll - box,
    unit: "개",
    hint: "둥근 부분이 있는 둥근기둥 모양과 공 모양은 굴러가요. 상자 모양은 굴러가지 않아요.",
    explanation: `굴러가는 모양(둥근기둥 모양, 공 모양)은 ${roll}개, 굴러가지 않는 모양(상자 모양)은 ${box}개입니다. ${roll} − ${box} = ${roll - box}이므로 ${roll - box}개 더 많습니다.`,
    mistakes: { [roll]: "굴러가는 모양의 수만 셌어요." },
  };
});

/* ════════ 1-1 덧셈과 뺄셈 ════════ */

/** 하: 합이 t인 덧셈식 고르기 */
export const asSumPick = gen("a1-as-sum-pick", 1, (rand) => {
  const t = randInt(rand, 4, 9);
  const a = randInt(rand, 1, t - 1);
  const answer = `${a} + ${t - a}`;
  const ds: string[] = [];
  for (let i = 0; i < 30 && ds.length < 6; i++) {
    const s = pick(rand, [t - 1, t + 1, t - 2, t + 2].filter((x) => x >= 2 && x <= 9));
    const x = randInt(rand, 1, s - 1);
    ds.push(`${x} + ${s - x}`);
  }
  const choices = four(rand, answer, ds);
  if (!choices) return null;
  return {
    key: `${t}:${choices.join("|")}`,
    prompt: `합이 ${josa(t, "이/가")} 되는 덧셈식을 고르세요.`,
    answer,
    choices,
    hint: "보기의 덧셈식을 하나씩 계산해 보세요.",
    explanation: `${answer} = ${t}입니다. 다른 덧셈식은 합이 ${josa(t, "이/가")} 아닙니다.`,
  };
});

/** 중: 차가 t인 뺄셈식 고르기(합이 t인 덧셈식과 헷갈리는 보기 포함) */
export const asDiffPick = gen("a1-as-diff-pick", 2, (rand) => {
  const t = randInt(rand, 1, 6);
  const a = randInt(rand, t + 1, 9);
  const answer = `${a} − ${a - t}`;
  const ds: string[] = [];
  // 두 수를 더하면 t+…, 순서를 바꾸면 계산 불가 등 흔한 실수: 차가 t±1
  for (let i = 0; i < 40 && ds.length < 6; i++) {
    const d = pick(rand, [t - 1, t + 1, t + 2].filter((x) => x >= 0));
    const x = randInt(rand, d + 1, 9);
    if (x - d >= 1) ds.push(`${x} − ${x - d}`);
  }
  const choices = four(rand, answer, ds);
  if (!choices) return null;
  return {
    key: `${t}:${choices.join("|")}`,
    prompt: `차가 ${josa(t, "이/가")} 되는 뺄셈식을 고르세요.`,
    answer,
    choices,
    hint: "앞의 수에서 뒤의 수를 빼 보세요.",
    explanation: `${a} − ${a - t} = ${t}입니다. 다른 뺄셈식은 차가 ${josa(t, "이/가")} 아닙니다.`,
  };
});

/** 상: 몇 개를 주면 두 사람의 수가 같아지나 */
export const asEqualShare = gen("a1-as-equal-share", 3, (rand) => {
  const k = randInt(rand, 1, 3);
  const b = randInt(rand, 1, 9 - 2 * k);
  const a = b + 2 * k;
  const [p, q] = shuffle(rand, NAMES).slice(0, 2);
  return {
    key: `${a},${b}`,
    prompt: `${josa(p, "은/는")} 사탕을 ${a}개, ${josa(q, "은/는")} ${b}개 가지고 있습니다. ${josa(p, "이/가")} ${q}에게 사탕을 몇 개 주면 두 사람의 사탕 수가 같아지나요?`,
    answer: k,
    unit: "개",
    hint: "한 개씩 주어 보며 두 사람의 사탕 수를 차례로 세어 보세요.",
    explanation: `${josa(p, "이/가")} ${k}개를 주면 ${p}는 ${a} − ${k} = ${a - k}(개), ${q}는 ${b} + ${k} = ${b + k}(개)가 되어 같아집니다.`,
    mistakes: { [2 * k]: "두 사람의 사탕 수의 차를 썼어요. 준 만큼 받는 사람도 늘어나요." },
  };
});

/* ════════ 1-1 비교하기 ════════ */

const GANADA = ["가", "나", "다", "라"];

/** 하: 막대 가보다 긴 막대는 몇 개 */
export const cmpLongerThan = gen("a1-cmp-longer-than", 1, (rand) => {
  const lens = shuffle(rand, [2, 3, 4, 5, 6, 7, 8]).slice(0, 4);
  const ref = randInt(rand, 0, 3);
  const n = lens.filter((l) => l > lens[ref]).length;
  if (n === 0) return null;
  return {
    key: `${ref}:${lens.join(",")}`,
    prompt: `그림에서 막대 ${GANADA[ref]}보다 긴 막대는 모두 몇 개인가요?`,
    visual: offsetBarsScene(lens.map((l) => [0, l] as [number, number])),
    answer: n,
    unit: "개",
    hint: "왼쪽 끝이 맞추어져 있으니 오른쪽 끝을 비교해 보세요.",
    explanation: `막대 ${GANADA[ref]}보다 오른쪽 끝이 더 나와 있는 막대를 세면 ${n}개입니다.`,
  };
});

/** 중: 세 그릇에 들어가는 컵 수 비교 */
export const cmpCupsMore = gen("a1-cmp-cups-more", 2, (rand) => {
  const c = shuffle(rand, [2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3);
  const mx = Math.max(...c);
  const mn = Math.min(...c);
  return {
    key: c.join(","),
    prompt: `같은 컵으로 물을 부어 그릇을 가득 채웠습니다. 가 그릇은 컵 ${c[0]}개, 나 그릇은 컵 ${c[1]}개, 다 그릇은 컵 ${c[2]}개만큼 들어갔습니다. 가장 많이 담을 수 있는 그릇은 가장 적게 담을 수 있는 그릇보다 컵 몇 개만큼 더 담을 수 있나요?`,
    answer: mx - mn,
    unit: "개",
    hint: "컵의 수가 많을수록 더 많이 담을 수 있어요.",
    explanation: `가장 많이 담는 그릇은 컵 ${mx}개, 가장 적게 담는 그릇은 컵 ${mn}개입니다. ${mx} − ${mn} = ${mx - mn}이므로 컵 ${mx - mn}개만큼 더 담을 수 있습니다.`,
  };
});

/** 상: 두 모양을 이어 붙이면 다른 모양보다 몇 칸 더 넓은가 */
export const cmpAreaJoinDiff = gen("a1-cmp-area-join-diff", 3, (rand) => {
  const a = randInt(rand, 1, 5);
  const b = randInt(rand, 1, 9 - a);
  const c = randInt(rand, 1, a + b - 1);
  if (c === a || c === b) return null;
  return {
    key: `${a},${b},${c}`,
    prompt: `같은 크기의 칸으로 만든 종이가 있습니다. 가는 ${a}칸, 나는 ${b}칸, 다는 ${c}칸입니다. 가와 나를 겹치지 않게 이어 붙인 종이는 다보다 몇 칸 더 넓은지 풀이 과정과 함께 구하세요.`,
    answer: a + b - c,
    unit: "칸",
    hint: "먼저 가와 나를 이어 붙인 종이가 몇 칸인지 구해 보세요.",
    explanation: `이어 붙인 종이는 ${a} + ${b} = ${a + b}(칸)입니다. ${a + b} − ${c} = ${a + b - c}이므로 ${a + b - c}칸 더 넓습니다.`,
    mistakes: { [a + b]: "이어 붙인 종이의 칸 수만 구했어요." },
  };
});

/* ════════ 1-1 50까지의 수 ════════ */

/** 하: 읽은 말(열다섯)을 수로 */
export const n50WordToNum = gen("a1-n50-word-to-num", 1, (rand) => {
  const n = randInt(rand, 11, 19);
  const o = n % 10;
  const choices = four(rand, String(n), [String(o), String(n - 1), String(n + 1), String(10 + ((o + 3) % 10)), String(10 + ((o + 5) % 10))].filter((x) => Number(x) <= 19 && Number(x) > 0));
  if (!choices) return null;
  return {
    key: `${n}:${choices.join("|")}`,
    prompt: `'${native(n)}'${josa(native(n), "을/를").slice(native(n).length)} 수로 바르게 쓴 것을 고르세요.`,
    answer: String(n),
    choices,
    hint: "'열'은 10개씩 묶음 1개예요. 뒤에 붙은 말이 낱개의 수예요.",
    explanation: `${josa(native(n), "은/는")} 10개씩 묶음 1개와 낱개 ${o}개이므로 ${josa(n, "이에요/예요")}.`,
  };
});

/** 중: 10개씩 묶음 a개와 낱개 b개인 수보다 1만큼 더 큰 수(낱개 9 → 다음 몇십) */
export const n50NextAfter = gen("a1-n50-next-after", 2, (rand) => {
  const a = randInt(rand, 1, 4);
  const b = rand() < 0.5 ? 9 : randInt(rand, 3, 8);
  const n = a * 10 + b;
  return {
    key: `${a},${b}`,
    prompt: `10개씩 묶음 ${a}개와 낱개 ${b}개인 수보다 1만큼 더 큰 수는 무엇인가요?`,
    answer: n + 1,
    hint: "먼저 어떤 수인지 구한 다음, 그 수 바로 뒤의 수를 생각해 보세요.",
    explanation: `10개씩 묶음 ${a}개와 낱개 ${b}개인 수는 ${n}입니다. ${n}보다 1만큼 더 큰 수는 ${josa(n + 1, "이에요/예요")}.`,
    mistakes: b === 9 ? { [a * 10 + 10]: "낱개만 1 늘려 10개가 된 것을 다시 10개씩 묶음으로 바꾸지 않았는지 확인하세요." } : { [n + 10]: "10개씩 묶음 수를 1 늘렸어요." },
  };
});

/** 상: 10개씩 담을 때 상자가 적어도 몇 개 */
export const n50BoxNeed = gen("a1-n50-box-need", 3, (rand) => {
  const n = randInt(rand, 11, 49);
  if (n % 10 === 0) return null;
  const t = Math.floor(n / 10);
  const name = pick(rand, NAMES);
  return {
    key: `${n}`,
    prompt: `${josa(name, "은/는")} 사과 ${n}개를 한 상자에 10개씩 담으려고 합니다. 사과를 모두 담으려면 상자는 적어도 몇 개 있어야 하는지 풀이 과정과 함께 구하세요.`,
    answer: t + 1,
    unit: "개",
    hint: `${josa(n, "은/는")} 10개씩 묶음 몇 개와 낱개 몇 개인지 생각해 보세요. 남은 낱개도 담아야 해요.`,
    explanation: `${josa(n, "은/는")} 10개씩 묶음 ${t}개와 낱개 ${n % 10}개입니다. 10개씩 ${t}상자에 담고, 남은 ${n % 10}개를 담을 상자가 1개 더 있어야 하므로 적어도 ${t + 1}개입니다.`,
    mistakes: { [t]: "남은 낱개를 담을 상자를 빠뜨렸어요." },
  };
});

/* ════════ 1-2 100까지의 수 ════════ */

/** 하: 일흔셋을 수로 */
export const n100WordToNum = gen("a1-n100-word-to-num", 1, (rand) => {
  const t = randInt(rand, 6, 9);
  const o = randInt(rand, 1, 9);
  if (o === t) return null;
  const n = t * 10 + o;
  const choices = four(rand, String(n), [String(o * 10 + t), String(t * 10), String(n + 1), String(n - 1)]);
  if (!choices) return null;
  const w = native(n);
  return {
    key: `${n}:${choices.join("|")}`,
    prompt: `'${w}'${josa(w, "을/를").slice(w.length)} 수로 바르게 쓴 것을 고르세요.`,
    answer: String(n),
    choices,
    hint: `'${TENS_N[t]}'${josa(TENS_N[t], "은/는").slice(TENS_N[t].length)} 10개씩 묶음 몇 개인지 생각해 보세요.`,
    explanation: `'${TENS_N[t]}'${josa(TENS_N[t], "은/는").slice(TENS_N[t].length)} 10개씩 묶음 ${t}개, '${ONES_N[o]}'${josa(ONES_N[o], "은/는").slice(ONES_N[o].length)} 낱개 ${o}개를 나타내므로 ${josa(n, "이에요/예요")}.`,
    mistakes: { [o * 10 + t]: "10개씩 묶음의 수와 낱개의 수를 바꾸어 썼어요." },
  };
});

/** 중: a번부터 b번까지 번호표는 모두 몇 장(양 끝 포함) */
export const n100Tickets = gen("a1-n100-tickets", 2, (rand) => {
  const a = randInt(rand, 51, 90);
  const len = randInt(rand, 4, 9);
  const b = a + len - 1;
  if (b > 99) return null;
  return {
    key: `${a},${b}`,
    prompt: `번호표가 ${a}번부터 ${b}번까지 빠짐없이 한 장씩 있습니다. 번호표는 모두 몇 장인가요?`,
    answer: len,
    unit: "장",
    hint: `${a}부터 ${b}까지 수를 하나씩 세어 보세요. 처음 수와 마지막 수도 세어야 해요.`,
    explanation: `${a}부터 ${b}까지 순서대로 세어 보면 모두 ${len}장입니다. (${Array.from({ length: len }, (_, i) => a + i).join(", ")})`,
    mistakes: { [len - 1]: "처음이나 마지막 번호표를 빠뜨렸어요.", [len - 2]: "처음과 마지막 번호표를 모두 빠뜨렸어요." },
  };
});

/** 상: 더 많아지려면 적어도 몇 개 더 */
export const n100CatchUp = gen("a1-n100-catch-up", 3, (rand) => {
  const t = randInt(rand, 5, 9);
  const big = t * 10 + randInt(rand, 3, 8);
  const small = big - randInt(rand, 2, Math.min(5, big % 10));
  const [p, q] = shuffle(rand, NAMES).slice(0, 2);
  const ans = big - small + 1;
  return {
    key: `${big},${small}`,
    prompt: `${josa(p, "은/는")} 구슬을 ${big}개, ${josa(q, "은/는")} ${small}개 가지고 있습니다. ${josa(q, "이/가")} ${p}보다 구슬이 더 많아지려면 적어도 몇 개를 더 모아야 하는지 풀이 과정과 함께 구하세요.`,
    answer: ans,
    unit: "개",
    hint: `${small}부터 하나씩 늘려 가며 ${big}보다 커지는 때를 찾아보세요.`,
    explanation: `${small}에서 ${big - small}개를 더 모으면 ${josa(big, "으로/로")} 같아집니다. 더 많아지려면 1개를 더 모아야 하므로 적어도 ${ans}개입니다.`,
    mistakes: { [ans - 1]: "같아지는 데 필요한 수를 썼어요. 더 많아지려면 1개가 더 있어야 해요." },
  };
});

/* ════════ 1-2 덧셈과 뺄셈 ════════ */

/** 하: 10을 만들어 더한 식 고르기(7 + 5 = 10 + 2) */
export const as2TenFirstSame = gen("a1-as2-ten-first-same", 1, (rand) => {
  const a = randInt(rand, 6, 9);
  const b = randInt(rand, 11 - a, 9);
  const r = a + b - 10;
  const answer = `10 + ${r}`;
  const choices = four(rand, answer, [`10 + ${b}`, `10 + ${r + 1}`, `10 + ${r - 1}`, `10 + ${10 - a}`].filter((x) => !x.endsWith("+ 0") && !x.endsWith("+ -1")));
  if (!choices) return null;
  return {
    key: `${a},${b}:${choices.join("|")}`,
    prompt: `${a} + ${josa(b, "을/를")} 10을 만들어 계산하려고 합니다. ${a} + ${josa(b, "과/와")} 계산 결과가 같은 식을 고르세요.`,
    answer,
    choices,
    hint: `${josa(a, "은/는")} ${10 - a}만 더하면 10이 돼요. ${josa(b, "을/를")} 두 수로 갈라 보세요.`,
    explanation: `${josa(b, "을/를")} ${josa(10 - a, "과/와")} ${josa(r, "으로/로")} 가르면 ${a} + ${10 - a} = 10이고, 10 + ${r} = ${a + b}입니다.`,
  };
});

/** 중: a − b와 계산 결과가 같은 식 고르기(받아내림 뺄셈) */
export const as2SameDiff = gen("a1-as2-same-diff", 2, (rand) => {
  const pairs: [number, number][] = [];
  for (let x = 11; x <= 18; x++) for (let y = 2; y <= 9; y++) if (y > x % 10 && x - y >= 2) pairs.push([x, y]);
  const [a, b] = pick(rand, pairs);
  const d = a - b;
  const same = pairs.filter(([x, y]) => x - y === d && x !== a);
  if (!same.length) return null;
  const [ax, ay] = pick(rand, same);
  const answer = `${ax} − ${ay}`;
  const used = new Set([d]);
  const uniq: string[] = [];
  for (const [x, y] of shuffle(rand, pairs)) {
    if (used.has(x - y) || Math.abs(x - y - d) > 2) continue;
    used.add(x - y);
    uniq.push(`${x} − ${y}`);
  }
  const choices = four(rand, answer, uniq);
  if (!choices) return null;
  return {
    key: `${a},${b}:${choices.join("|")}`,
    prompt: `${a} − ${josa(b, "과/와")} 계산 결과가 같은 것을 고르세요.`,
    answer,
    choices,
    hint: `먼저 ${a} − ${josa(b, "을/를")} 계산하고, 보기의 식도 하나씩 계산해 보세요.`,
    explanation: `${a} − ${b} = ${d}이고, ${answer} = ${d}입니다.`,
  };
});

/** 상: 목표 횟수까지 더 해야 하는 수(두 자리 덧셈·뺄셈, 받아올림·받아내림 없음) */
export const as2Goal = gen("a1-as2-goal", 3, (rand) => {
  const a = randInt(rand, 1, 3) * 10 + randInt(rand, 0, 4);
  const b = randInt(rand, 1, 3) * 10 + randInt(rand, 0, 4);
  const s = a + b;
  const e = randInt(rand, 1, 2) * 10 + randInt(rand, 1, 9 - (s % 10));
  const goal = s + e;
  if (s % 10 + e % 10 > 9 || goal > 99 || (a % 10) + (b % 10) > 9) return null;
  const name = pick(rand, NAMES);
  return {
    key: `${a},${b},${goal}`,
    prompt: `${josa(name, "은/는")} 줄넘기를 어제 ${a}번, 오늘 ${b}번 했습니다. 내일까지 모두 ${goal}번을 하려면 내일은 몇 번을 해야 하는지 풀이 과정과 함께 구하세요.`,
    answer: e,
    unit: "번",
    hint: "먼저 어제와 오늘 한 줄넘기 횟수를 더해 보세요.",
    explanation: `어제와 오늘 ${a} + ${b} = ${s}(번) 했습니다. ${goal} − ${s} = ${e}이므로 내일은 ${e}번을 해야 합니다.`,
    mistakes: { [goal - a]: "오늘 한 횟수를 빼지 않았어요.", [goal - b]: "어제 한 횟수를 빼지 않았어요." },
  };
});

/* ════════ 1-2 모양과 시각 ════════ */

/** 하: 뾰족한 곳이 없는 모양은 몇 개 */
export const flatNoCorner = gen("a1-flat-no-corner", 1, (rand) => {
  const n = randInt(rand, 5, 8);
  const list: FlatKind[] = Array.from({ length: n }, () => pick(rand, [0, 3, 4] as FlatKind[]));
  const circles = list.filter((k) => k === 0).length;
  if (circles === 0 || circles === n) return null;
  return {
    key: list.join(""),
    prompt: "그림에서 뾰족한 곳이 없는 모양은 모두 몇 개인가요?",
    visual: flatsScene(list, rand, "크기와 방향이 여러 가지인 △, □, ○ 모양"),
    answer: circles,
    unit: "개",
    hint: "△ 모양과 □ 모양은 뾰족한 곳이 있어요. 둥근 모양을 찾아보세요.",
    explanation: `뾰족한 곳이 없는 모양은 ○ 모양이고, 그림에서 ${circles}개입니다.`,
    mistakes: { [n - circles]: "뾰족한 곳이 있는 모양을 셌어요." },
  };
});

/** 중: 긴바늘만 6까지 움직이면 몇 시 30분 */
export const clkHalfLater = gen("a1-clk-half-later", 2, (rand) => {
  const h = randInt(rand, 1, 12);
  return {
    key: `${h}`,
    prompt: "그림의 시계에서 긴바늘이 6을 가리킬 때까지 시곗바늘이 돌아갔습니다. 이때의 시각을 쓰세요.",
    visual: clockScene(h, 0),
    answer: `${h},30`,
    unit: ["시", "분"],
    hint: "지금 시각을 먼저 읽어 보세요. 긴바늘이 6을 가리키면 30분이에요.",
    explanation: `그림의 시각은 ${h}시입니다. 긴바늘이 6을 가리키면 짧은바늘은 ${josa(h, "과/와")} ${h === 12 ? 1 : h + 1} 사이에 있으므로 ${h}시 30분입니다.`,
    mistakes: { [`${h === 12 ? 1 : h + 1},30`]: "짧은바늘이 지나온 수를 읽어야 해요." },
  };
});

/** △ 두 개로 만든 □ 그림 */
function triSquareScene(): ReturnType<typeof flatsScene> {
  const cv = new Canvas();
  const sq: Pt[] = [[10, 10], [80, 10], [80, 80], [10, 80]];
  cv.poly([sq[0], sq[1], sq[2]]);
  cv.poly([sq[0], sq[2], sq[3]]);
  return cv.scene(90, 90, "△ 모양 2개를 붙여 만든 □ 모양");
}

/** 상: △ 2개로 □ 하나 — □ a개를 만들려면 △ 몇 개 */
export const flatTriToSquare = gen("a1-flat-tri-to-sq", 3, (rand) => {
  const a = randInt(rand, 2, 4);
  const name = pick(rand, NAMES);
  return {
    key: `${a}`,
    prompt: `${josa(name, "은/는")} 그림과 같이 똑같은 △ 모양 2개를 붙여 □ 모양 1개를 만들었습니다. 같은 방법으로 □ 모양 ${a}개를 만들려면 △ 모양은 모두 몇 개 있어야 하는지 풀이 과정과 함께 구하세요.`,
    visual: triSquareScene(),
    answer: 2 * a,
    unit: "개",
    hint: "□ 모양 하나에 △ 모양이 2개씩 들어가요. □ 모양을 하나씩 늘려 가며 세어 보세요.",
    explanation: `□ 모양 하나에 △ 모양 2개가 필요합니다. □ 모양 ${a}개에는 ${Array.from({ length: a }, () => 2).join(" + ")} = ${2 * a}(개)가 필요합니다.`,
    mistakes: { [a]: "□ 모양의 수만 썼어요.", [a + 2]: "△ 모양 2개를 한 번만 더했어요." },
  };
});

/* ════════ 1-2 규칙 찾기 ════════ */

/** 하: 거꾸로 뛰어 세는 수 배열의 빈칸 */
export const patSkipBack = gen("a1-pat-skip-back", 1, (rand) => {
  const step = pick(rand, [2, 5, 10]);
  const start = step === 10 ? randInt(rand, 5, 9) * 10 + randInt(rand, 0, 9) : step === 5 ? randInt(rand, 6, 19) * 5 : randInt(rand, 10, 49) * 2;
  const seq = Array.from({ length: 5 }, (_, i) => start - i * step);
  if (seq[4] < 1) return null;
  const hole = randInt(rand, 2, 4);
  return {
    key: `${start},${step},${hole}`,
    prompt: `규칙에 따라 수를 늘어놓았습니다. □ 안에 알맞은 수를 쓰세요.`,
    expression: seq.map((x, i) => (i === hole ? "□" : String(x))).join(", "),
    answer: seq[hole],
    hint: "앞의 수와 뒤의 수가 얼마씩 달라지는지 살펴보세요.",
    explanation: `${start}부터 ${step}씩 작아지는 규칙입니다. □ 안에 알맞은 수는 ${josa(seq[hole], "이에요/예요")}.`,
    mistakes: { [seq[hole - 1] + step]: "커지는 규칙으로 생각했어요." },
  };
});

const UNITS = [["○", "△"], ["○", "○", "△"], ["□", "△", "△"], ["☆", "○", "□"], ["△", "□", "□", "○"], ["♡", "♡", "☆"]];

/** 중: 되풀이되는 부분은 모양 몇 개 */
export const patUnitLength = gen("a1-pat-unit-length", 2, (rand) => {
  const unit = pick(rand, UNITS);
  const reps = unit.length === 2 ? 4 : 3;
  const tokens = Array.from({ length: unit.length * reps }, (_, i) => unit[i % unit.length]);
  return {
    key: unit.join(""),
    prompt: "그림과 같은 규칙으로 모양을 늘어놓았습니다. 되풀이되는 부분은 모양 몇 개로 이루어져 있나요?",
    visual: tokensScene(tokens, "규칙에 따라 늘어놓은 모양", { tail: true }),
    answer: unit.length,
    unit: "개",
    hint: "처음부터 모양을 하나씩 읽으며 똑같이 다시 시작하는 곳을 찾아보세요.",
    explanation: `${unit.join(" ")} 모양이 되풀이되므로 되풀이되는 부분은 모양 ${unit.length}개입니다.`,
  };
});

/** 상: 수 배열표에서 위·아래·왼쪽·오른쪽으로 옮겨 간 칸의 수 */
export const patChartMove = gen("a1-pat-chart-move", 3, (rand) => {
  const a = randInt(rand, 12, 89);
  const r = Math.floor((a - 1) / 10);
  const c = (a - 1) % 10;
  const dv = pick(rand, [-1, 1]);
  const dh = pick(rand, [-2, -1, 1, 2]);
  if (r + dv < 0 || r + dv > 9 || c + dh < 0 || c + dh > 9) return null;
  const ans = a + 10 * dv + dh;
  const vText = dv < 0 ? "위로 한 칸" : "아래로 한 칸";
  const hText = `${dh < 0 ? "왼쪽" : "오른쪽"}으로 ${Math.abs(dh) === 1 ? "한" : "두"} 칸`;
  const mid = a + 10 * dv;
  return {
    key: `${a},${dv},${dh}`,
    prompt: `1부터 100까지의 수 배열표(한 줄에 10칸)에서 ${josa(a, "이/가")} 쓰인 칸에 말을 놓았습니다. 말을 ${vText} 옮긴 다음 ${hText} 옮겼습니다. 말이 놓인 칸의 수는 무엇인지 풀이 과정과 함께 구하세요.`,
    answer: ans,
    hint: "수 배열표에서 아래로 한 칸 가면 10만큼, 오른쪽으로 한 칸 가면 1만큼 커져요.",
    explanation: `${vText} 옮기면 ${a}보다 10만큼 더 ${dv < 0 ? "작은" : "큰"} ${josa(mid, "이/가")} 됩니다. ${hText} 옮기면 ${mid}보다 ${Math.abs(dh)}만큼 더 ${dh < 0 ? "작은" : "큰"} ${josa(ans, "이/가")} 됩니다.`,
    mistakes: { [a + dv + 10 * dh]: "위아래와 왼쪽·오른쪽을 바꾸어 생각했어요." },
  };
});

/** 1학년 단원마다 새로 더한 생성기(하·중·상 하나씩): 단원 id → 차시 id → 생성기 */
export const addedG1: WordMap = {
  "g1-s1-numbers9": { "compare9": [n9FewerPlate], "order9": [n9WrongSeq], "one-more-less": [n9Stairs] },
  "g1-s1-solids": { "build-solids": [solBuildTotal], "sort-solids": [solKindsLeft], "solid-features": [solRollMore] },
  "g1-s1-add-sub": { "add9": [asSumPick, asEqualShare], "sub9": [asDiffPick] },
  "g1-s1-compare": { "length": [cmpLongerThan], "capacity": [cmpCupsMore], "area": [cmpAreaJoinDiff] },
  "g1-s1-numbers50": { "teens": [n50WordToNum], "count50": [n50NextAfter], "tens": [n50BoxNeed] },
  "g1-s2-numbers100": { "count99": [n100WordToNum], "order-100": [n100Tickets], "compare100": [n100CatchUp] },
  "g1-s2-add-sub": { "ten-first": [as2TenFirstSame], "borrow": [as2SameDiff], "sub2": [as2Goal] },
  "g1-s2-shapes-clock": { "find-flat": [flatNoCorner], "half-hour": [clkHalfLater], "flat-make": [flatTriToSquare] },
  "g1-s2-patterns": { "number-pattern": [patSkipBack], "repeat": [patUnitLength], "hundred-chart": [patChartMove] },
};
