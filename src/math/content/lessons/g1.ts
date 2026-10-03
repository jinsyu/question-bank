import type { Generator, Level, ShapeScene } from "../types";
import { pick, randInt, shuffle } from "../../lib/random";
import { word, type WordSpec } from "../words/word";
import { extras } from "../extras";
import { dotsScene, tensOnesScene } from "../generators/pictures";
import { josa } from "../josa";
import { ord } from "../ordinal";
import {
  buildCounts, buildScene, countdownScene, framesChoiceScene, peekScene, randomBuild, randomSolid, shadedRowsScene, SOLID_KINDS, SOLID_NAME,
  solidsScene, tokensScene, twoBuildsScene, MARKS as PIC_MARKS, seesawsScene, balanceMarblesScene, cupsPouredScene, offsetBarsScene, lineFrontBackScene,
  type Build, type Solid, type SolidKind,
} from "./g1-pics";

/* ════════ 공용 도구(1학년) ════════ */

type Make = (rand: () => number) => WordSpec | null;
type Pt = [number, number];

/** 하(1)·중(2)·상(3) 생성기 */
export const gen = (id: string, level: Level, make: Make): Generator => word(id, make, level);

/** 예전 단계에 붙어 있던 생성기를 id로 꺼낸다 */
export function ex(unitId: string, stdId: string, id: string): Generator {
  const g = extras(unitId, stdId).find((x) => x.id === id);
  if (!g) throw new Error(`${unitId}/${stdId}에 ${id}가 없어요`);
  return g;
}

export const NAMES = ["지우", "서아", "수아", "도하", "유나", "이수"];
export const MARKS = ["①", "②", "③", "④"];

/** 수를 한자어로 읽을 때 받침이 있는지(일·삼·육·칠·팔·십·영) */
const batchim = (n: number) => [0, 1, 3, 6, 7, 8].includes(n % 10);
export const eun = (n: number) => `${n}${batchim(n) ? "은" : "는"}`;
export const wa = (n: number) => `${n}${batchim(n) ? "과" : "와"}`;
export const eul = (n: number) => `${n}${batchim(n) ? "을" : "를"}`;

const ONES_N = ["", "하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟", "아홉"];
const TENS_N = ["", "열", "스물", "서른", "마흔", "쉰", "예순", "일흔", "여든", "아흔"];
const SINO = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
export const native = (n: number) => (n === 100 ? "백" : TENS_N[Math.floor(n / 10)] + ONES_N[n % 10]);
export const sino = (n: number) => {
  if (n === 100) return "백";
  const t = Math.floor(n / 10);
  return (t ? `${t > 1 ? SINO[t] : ""}십` : "") + SINO[n % 10];
};

/** 정답 + 오답 3개(앞에서부터, 중복·정답 제외)를 섞는다. 모자라면 null */
export function four(rand: () => number, answer: string, distractors: string[]): string[] | null {
  const ds = [...new Set(distractors.filter((d) => d !== answer))].slice(0, 3);
  return ds.length < 3 ? null : shuffle(rand, [answer, ...ds]);
}

/** 서로 다른 수 k개 */
export const distinct = (rand: () => number, lo: number, hi: number, k: number) =>
  shuffle(rand, Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)).slice(0, k);

const range = (a: number, b: number) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);

/** 10칸 틀(5칸씩 두 줄)에 표시(●, ○, × 등)를 차례로 넣는다 */
export function frameScene(marks: string[], label: string): ShapeScene {
  const cell = 30;
  const frames = Math.max(1, Math.ceil(marks.length / 10));
  const polygons: ShapeScene["polygons"] = [];
  for (let f = 0; f < frames; f++)
    for (let i = 0; i < 10; i++) {
      const x = 8 + (i % 5) * cell;
      const y = 8 + (f * 2 + Math.floor(i / 5)) * cell + f * 10;
      polygons.push({ points: [[x, y], [x + cell, y], [x + cell, y + cell], [x, y + cell]] });
    }
  const texts = marks.map((m, i) => {
    const f = Math.floor(i / 10);
    const j = i % 10;
    return { at: [8 + (j % 5) * cell + cell / 2, 8 + (f * 2 + Math.floor(j / 5)) * cell + f * 10 + cell / 2] as Pt, text: m };
  }).filter((t) => t.text);
  return { kind: "shape", width: 16 + cell * 5, height: 16 + frames * (2 * cell + 10), label, polygons, texts };
}

/** 모양을 한 줄로 늘어놓은 그림(○△☆◇♡□ 등을 그림으로, "?"는 빈칸) */
export function rowScene(items: string[], label: string): ShapeScene {
  return tokensScene(items, label, { perRow: 13 });
}

/** 두 줄로 늘어놓은 모양(하나씩 짝 지어 비교) */
export function twoRowsScene(a: number, b: number, top = "●", bottom = "▲"): ShapeScene {
  const row = (n: number, y: number, s: string) => Array.from({ length: n }, (_, i) => ({ at: [24 + i * 26, y] as Pt, text: s }));
  return {
    kind: "shape",
    width: 30 + Math.max(a, b) * 26,
    height: 70,
    label: `${top} ${a}개, ${bottom} ${b}개`,
    texts: [...row(a, 20, top), ...row(b, 50, bottom)],
  };
}

/** 같은 크기의 칸으로 만든 모양 두 개(가, 나) */
export function cellShapesScene(counts: number[], names = ["가", "나", "다", "라"]): ShapeScene {
  // 1학년이 칸을 셀 수 있게 칸을 크게(22) 그린다
  const cell = 22;
  const pitch = 4 * cell + 16;
  const polygons = counts.flatMap((n, k) =>
    Array.from({ length: n }, (_, i) => {
      const x = 12 + k * pitch + (i % 4) * cell;
      const y = 26 + Math.floor(i / 4) * cell;
      return { fill: true, points: [[x, y], [x + cell, y], [x + cell, y + cell], [x, y + cell]] as Pt[] };
    }),
  );
  return {
    kind: "shape",
    width: 12 + counts.length * pitch,
    height: 30 + Math.ceil(Math.max(...counts) / 4) * cell + 8,
    label: "같은 크기의 칸으로 만든 모양",
    polygons,
    texts: counts.map((_, k) => ({ at: [12 + k * pitch + 2 * cell, 14] as Pt, text: names[k] })),
  };
}

/** 칸으로 된 막대(왼쪽 끝 맞춤) */
export function cellBarsScene(lens: number[], names = ["가", "나", "다", "라"]): ShapeScene {
  const cell = 16;
  return {
    kind: "shape",
    width: 50 + Math.max(...lens) * cell,
    height: 12 + lens.length * 30,
    label: "칸으로 된 막대",
    polygons: lens.flatMap((n, k) =>
      Array.from({ length: n }, (_, i) => {
        const x = 34 + i * cell;
        const y = 10 + k * 30;
        return { fill: k % 2 === 0, points: [[x, y], [x + cell, y], [x + cell, y + cell], [x, y + cell]] as Pt[] };
      }),
    ),
    texts: lens.map((_, k) => ({ at: [16, 18 + k * 30] as Pt, text: names[k] })),
  };
}

/** 모양과 크기가 같은 그릇 4개에 담긴 물 */
export function cupsScene(levels: number[]): ShapeScene {
  const polygons: ShapeScene["polygons"] = [];
  levels.forEach((l, k) => {
    const x = 16 + k * 56;
    polygons.push({ points: [[x, 14], [x + 40, 14], [x + 40, 94], [x, 94]] });
    const top = 94 - l * 8;
    polygons.push({ fill: true, points: [[x, top], [x + 40, top], [x + 40, 94], [x, 94]] });
  });
  return { kind: "shape", width: 240, height: 118, label: "모양과 크기가 같은 그릇 네 개", polygons, texts: levels.map((_, k) => ({ at: [36 + k * 56, 108] as Pt, text: MARKS[k] })) };
}

/** 크기가 다른 빈 그릇 4개 */
export function containersScene(sizes: [number, number][]): ShapeScene {
  const polygons = sizes.map(([w, h], k) => {
    const x = 16 + k * 60 + (52 - w) / 2;
    return { points: [[x, 94 - h], [x + w, 94 - h], [x + w, 94], [x, 94]] as Pt[] };
  });
  return { kind: "shape", width: 260, height: 118, label: "크기가 다른 그릇 네 개", polygons, texts: sizes.map((_, k) => ({ at: [42 + k * 60, 108] as Pt, text: MARKS[k] })) };
}


/* ════════ 공용 틀(여러 단원에서 범위만 바꿔 쓴다) ════════ */

/** 하: 10칸 틀의 점 세기 */
export const countDotsIn = (id: string, lo: number, hi: number) =>
  gen(id, 1, (rand) => {
    const n = randInt(rand, lo, hi);
    return { key: `${n}`, prompt: "점은 몇 개인가요?", visual: dotsScene(n), answer: n, unit: "개", hint: "5칸씩 한 줄이에요. 줄 단위로 세면 쉬워요.", explanation: `점은 ${n}개입니다.` };
  });

/** 하: 수를 두 가지로 바르게 읽은 것 고르기 */
export const readNum = (id: string, pool: number[]) =>
  gen(id, 1, (rand) => {
    const n = pick(rand, pool);
    const k = pool.includes(n + 1) || n < 99 ? n + 1 : n - 1;
    const k2 = n > 1 ? n - 1 : n + 2;
    const answer = `${native(n)}, ${sino(n)}`;
    const choices = four(rand, answer, [`${native(k)}, ${sino(n)}`, `${native(n)}, ${sino(k)}`, `${native(k2)}, ${sino(k2)}`]);
    if (!choices) return null;
    return { key: `${n}:${choices.join()}`, prompt: `${eul(n)} 바르게 읽은 것을 고르세요.`, expression: `${n}`, answer, choices, hint: "'하나, 둘, 셋'으로도, '일, 이, 삼'으로도 읽을 수 있어요.", explanation: `${eun(n)} ${native(n)} 또는 ${josa(sino(n), "이라고/라고")} 읽어요.` };
  });

/** 중: 10칸 틀 네 개 중 점의 수가 n인 것 고르기(보기 수는 차시 범위 lo~hi 안) */
export const pickDots = (id: string, lo: number, hi: number) =>
  gen(id, 2, (rand) => {
    const n = randInt(rand, lo, hi);
    const counts = shuffle(rand, [n, ...shuffle(rand, range(lo, hi).filter((x) => x !== n)).slice(0, 3)]);
    if (counts.length < 4) return null;
    const answer = PIC_MARKS[counts.indexOf(n)];
    return { key: `${counts.join()}`, prompt: `점이 ${n}개인 것을 고르세요.`, visual: framesChoiceScene(counts), answer, choices: PIC_MARKS.slice(0, 4), hint: "10칸 틀은 한 줄에 5칸이에요. 줄 단위로 세어 보세요.", explanation: `${answer}의 점은 ${n}개입니다.` };
  });

/** 중: 점이 goal개가 되려면 몇 개 더 */
export const dotsToGoal = (id: string, goals: number[]) =>
  gen(id, 2, (rand) => {
    const goal = pick(rand, goals);
    const n = randInt(rand, 1, goal - 1);
    return { key: `${goal}:${n}`, prompt: `점이 ${goal}개가 되려면 몇 개를 더 그려야 하나요?`, visual: dotsScene(n), answer: goal - n, unit: "개", hint: `지금 있는 점을 세고, ${goal}까지 이어 세어 보세요.`, explanation: `${n}에서 ${goal}까지 ${goal - n}개 더`, mistakes: { [n]: "지금 있는 점의 수를 썼어요." } };
  });

/** 상(비교): 하나씩 짝 지어 남는 것의 수 */
export const moreByPairing = (id: string, lo: number, hi: number) =>
  gen(id, 3, (rand) => {
    const a = randInt(rand, lo, hi);
    const b = randInt(rand, 1, a - 1);
    const name = pick(rand, NAMES);
    return {
      key: `${a}:${b}:${name}`,
      prompt: `${name}가 ●와 ▲를 그렸습니다. ●와 ▲를 하나씩 짝 지으면 ●가 남습니다. 남는 ●는 몇 개인가요?`,
      visual: twoRowsScene(a, b),
      answer: a - b,
      unit: "개",
      hint: "위아래로 하나씩 짝을 지어 보세요. 짝이 없는 것이 남는 것이에요.",
      explanation: `● ${a}개, ▲ ${b}개 → 짝 짓고 남는 ●는 ${a - b}개`,
      mistakes: { [a]: "●의 수를 그대로 썼어요." },
    };
  });

/** 하: 차례로 쓴 수에서 빈칸 */
export const seqBlank = (id: string, lo: number, hi: number, level: Level = 1, down = false) =>
  gen(id, level, (rand) => {
    const start = randInt(rand, lo, hi - 4);
    const seq = range(start, start + 4);
    if (down) seq.reverse();
    const miss = randInt(rand, 1, 4);
    return {
      key: `${start}:${miss}:${down}`,
      prompt: down ? "수를 거꾸로 세었습니다. □ 안에 알맞은 수를 써넣으세요." : "수를 순서대로 썼습니다. □ 안에 알맞은 수를 써넣으세요.",
      expression: seq.map((n, i) => (i === miss ? "□" : String(n))).join(", "),
      answer: seq[miss],
      hint: down ? "거꾸로 세면 1씩 작아져요." : "순서대로 세면 1씩 커져요.",
      explanation: seq.join(", "),
    };
  });

/** 중: a와 a+2 사이의 수 */
export const betweenOne = (id: string, lo: number, hi: number) =>
  gen(id, 2, (rand) => {
    const a = randInt(rand, lo, hi - 2);
    return { key: `${a}`, prompt: `${wa(a)} ${a + 2} 사이에 있는 수는 무엇인가요?`, answer: a + 1, hint: "수를 순서대로 세어 보세요.", explanation: `${a}, ${a + 1}, ${a + 2}` };
  });

/** 하: 두 수 중 더 큰(작은) 수 */
export const biggerOfTwo = (id: string, lo: number, hi: number) =>
  gen(id, 1, (rand) => {
    const [a, b] = distinct(rand, lo, hi, 2);
    const big = rand() < 0.5;
    const ans = big ? Math.max(a, b) : Math.min(a, b);
    return {
      key: `${a}:${b}:${big}`,
      prompt: `두 수 중에서 더 ${big ? "큰" : "작은"} 수를 쓰세요.`,
      expression: `${a}      ${b}`,
      answer: ans,
      hint: hi > 9 ? "10개씩 묶음의 수를 먼저 비교하고, 같으면 낱개의 수를 비교해요." : "수를 순서대로 셀 때 뒤에 나오는 수가 더 커요.",
      explanation: `${eun(ans)} ${ans === a ? b : a}보다 ${big ? "큽" : "작습"}니다.`,
    };
  });

/** 중: 순서대로 늘어놓을 때 k째 수 */
export const orderNth = (id: string, lo: number, hi: number) =>
  gen(id, 2, (rand) => {
    const nums = distinct(rand, lo, hi, 4);
    const small = rand() < 0.5;
    const k = randInt(rand, 2, 3);
    const sorted = [...nums].sort((x, y) => (small ? x - y : y - x));
    return {
      key: `${nums.join()}:${small}:${k}`,
      prompt: `${small ? "작은" : "큰"} 수부터 순서대로 쓸 때 ${ord(k)}에 오는 수는 무엇인가요?`,
      expression: nums.join(",  "),
      answer: sorted[k - 1],
      hint: `가장 ${small ? "작은" : "큰"} 수부터 하나씩 골라 써 보세요.`,
      explanation: sorted.join(", "),
    };
  });

/** 중: k보다 큰(작은) 수 세기 */
export const countBigger = (id: string, lo: number, hi: number) =>
  gen(id, 2, (rand) => {
    const all = distinct(rand, lo, hi, 6);
    const [k, ...nums] = all;
    const big = rand() < 0.5;
    const hits = nums.filter((n) => (big ? n > k : n < k));
    // 답이 0개인 문제는 1학년에게 낯설어 다시 뽑는다
    if (hits.length === 0) return null;
    return {
      key: `${all.join()}:${big}`,
      prompt: `${k}보다 ${big ? "큰" : "작은"} 수는 모두 몇 개인가요?`,
      expression: nums.join(",  "),
      answer: hits.length,
      unit: "개",
      hint: `수를 하나씩 ${wa(k)} 비교해 보세요.`,
      explanation: hits.length ? `${hits.join(", ")} → ${hits.length}개` : "없으므로 0개",
    };
  });

/** 상(F4): a보다 크고 b보다 작은 수의 개수 */
export const betweenCount = (id: string, lo: number, hi: number) =>
  gen(id, 3, (rand) => {
    const a = randInt(rand, lo, hi - 4);
    const b = randInt(rand, a + 3, Math.min(hi, a + 9));
    return {
      key: `${a}:${b}`,
      prompt: `${a}보다 크고 ${b}보다 작은 수는 모두 몇 개인가요?`,
      answer: b - a - 1,
      unit: "개",
      hint: `${wa(a)} ${eun(b)} 빼고, 그 사이의 수를 차례로 써 보세요.`,
      explanation: `${range(a + 1, b - 1).join(", ")} → ${b - a - 1}개`,
      mistakes: { [b - a + 1]: `${wa(a)} ${b}도 셌어요.`, [b - a]: "한쪽 끝의 수를 셌어요." },
    };
  });

/** 상(F7): 가장 많이(적게) 가진 사람 */
export const mostName = (id: string, lo: number, hi: number, thing: string, unit: string) =>
  gen(id, 3, (rand) => {
    const names = shuffle(rand, NAMES).slice(0, 4);
    const nums = distinct(rand, lo, hi, 4);
    const most = rand() < 0.5;
    const target = most ? Math.max(...nums) : Math.min(...nums);
    return {
      key: `${names.join()}:${nums.join()}:${most}`,
      prompt: `${thing}${unit === "개" ? "을" : "를"} ${names.map((n, i) => `${n}는 ${nums[i]}${unit}`).join(", ")} 가지고 있습니다. ${thing}${unit === "개" ? "을" : "를"} 가장 ${most ? "많이" : "적게"} 가진 사람은 누구인가요?`,
      answer: names[nums.indexOf(target)],
      choices: names,
      hint: hi > 9 ? "10개씩 묶음의 수부터 비교해요." : "수를 순서대로 셀 때 뒤에 나올수록 커요.",
      explanation: `${names[nums.indexOf(target)]}(${target}${unit})`,
    };
  });

/** 상(F4): t□가 tk보다 크다(작다) → □에 들어갈 수의 개수 */
export const blankDigit = (id: string, tLo: number, tHi: number) =>
  gen(id, 3, (rand) => {
    const t = randInt(rand, tLo, tHi);
    const k = randInt(rand, 1, 8);
    const big = rand() < 0.5;
    const ok = range(0, 9).filter((d) => (big ? d > k : d < k));
    return {
      key: `${t}:${k}:${big}`,
      prompt: `${t}□는 ${t * 10 + k}보다 ${big ? "큽" : "작습"}니다. □ 안에 들어갈 수 있는 수는 모두 몇 개인가요?`,
      answer: ok.length,
      unit: "개",
      hint: "10개씩 묶음의 수가 같으니 낱개의 수를 비교해요. 0부터 9까지 넣어 보세요.",
      explanation: `${ok.join(", ")} → ${ok.length}개`,
      mistakes: { [ok.length + 1]: `${k}도 넣었어요. 같으면 크거나 작지 않아요.` },
    };
  });

/** 상(F2): 수 카드 두 장으로 가장 큰(작은) 몇십몇 만들기 */
export const cardsTwoDigit = (id: string, pool: number[]) =>
  gen(id, 3, (rand) => {
    const cards = shuffle(rand, pool).slice(0, 3);
    const big = rand() < 0.5;
    const s = [...cards].sort((a, b) => a - b);
    const nz = s.filter((d) => d > 0);
    const answer = big ? s[2] * 10 + s[1] : nz[0] * 10 + s.filter((d) => d !== nz[0])[0];
    return {
      key: `${cards.join()}:${big}`,
      prompt: `수 카드 ${cards.join(", ")} 중에서 두 장을 골라 몇십몇을 만들려고 합니다. 만들 수 있는 가장 ${big ? "큰" : "작은"} 수는 무엇인가요?`,
      answer,
      hint: big ? "10개씩 묶음 자리에 가장 큰 수를 놓아요." : "10개씩 묶음 자리에 0이 아닌 가장 작은 수를 놓아요.",
      explanation: `가장 ${big ? "큰" : "작은"} 수: ${answer}`,
    };
  });

/** 하: 10개씩 묶음 모형(몇십) */
export const tensModel = (id: string, tens: number[]) =>
  gen(id, 1, (rand) => {
    const t = pick(rand, tens);
    return { key: `${t}`, prompt: "모두 몇 개인가요?", visual: tensOnesScene(t, 0), answer: t * 10, unit: "개", hint: "10개씩 묶음을 10, 20, 30, …으로 세어요.", explanation: `10개씩 묶음 ${t}개 → ${t * 10}`, mistakes: { [t]: "묶음의 수만 썼어요." } };
  });

/** 중: 몇십은 10개씩 묶음 몇 개 */
export const tensRev = (id: string, tens: number[]) =>
  gen(id, 2, (rand) => {
    const t = pick(rand, tens);
    const things = pick(rand, ["구슬", "사탕", "단추", "밤"]);
    return { key: `${t}:${things}`, prompt: `${things} ${t * 10}개를 10개씩 묶으면 몇 묶음이 되나요?`, answer: t, unit: "묶음", hint: "10개씩 묶음 1개는 10, 2개는 20이에요.", explanation: `${t * 10} = 10개씩 ${t}묶음` };
  });

/** 중: 10개씩 묶음 a개와 낱개 b개(b는 10 이상) */
export const tensOnesOver = (id: string, max: number) =>
  gen(id, 2, (rand) => {
    const a = randInt(rand, 1, Math.floor(max / 10) - 2);
    const b = randInt(rand, 11, 19);
    const n = a * 10 + b;
    if (n > max) return null;
    return {
      key: `${a}:${b}`,
      prompt: `10개씩 묶음 ${a}개와 낱개 ${b}개는 모두 몇인가요?`,
      answer: n,
      hint: `낱개 ${b}개는 10개씩 묶음 1개와 낱개 ${b - 10}개예요.`,
      explanation: `10개씩 묶음 ${a + 1}개와 낱개 ${b - 10}개 → ${n}`,
      mistakes: { [a * 10 + b - 10]: "낱개 속 10개를 빠뜨렸어요." },
    };
  });

/** 상(F1): 10개씩 상자를 사고 더 사기 */
export const tensBoxes = (id: string, maxTens: number, minTens = 2) =>
  gen(id, 3, (rand) => {
    const a = randInt(rand, 1, maxTens - 1);
    const c = randInt(rand, Math.max(1, minTens - a), maxTens - a);
    const thing = pick(rand, ["귤", "달걀", "공깃돌", "빵"]);
    return {
      key: `${a}:${c}:${thing}`,
      prompt: `${josa(thing, "이/가")} 10개씩 ${a}상자 있습니다. 10개씩 ${c}상자를 더 가져왔다면 ${josa(thing, "은/는")} 모두 몇 개인가요?`,
      answer: (a + c) * 10,
      unit: "개",
      hint: "상자의 수를 먼저 모으고, 10개씩 묶음으로 수를 만들어요.",
      explanation: `10개씩 ${a + c}상자 → ${(a + c) * 10}개`,
      mistakes: { [a + c]: "상자의 수만 썼어요." },
    };
  });

/* ════════ 1-1 1단원 9까지의 수 ════════ */

const U1 = "g1-s1-numbers9";

export const dots5 = countDotsIn("l1-dots5", 1, 5);
export const read5 = readNum("l1-read5", [1, 2, 3, 4, 5]);
export const pickDots5 = pickDots("l1-pick-dots5", 1, 5);
export const toFive = dotsToGoal("l1-to-five", [5]);
/** 상: 손가락을 모두 편 손으로 수를 나타내려면 몇 개를 접어야 하는지(그림이 답을 보여 주지 않게 글로만) */
export const fingers5 = gen("l1-w-fingers5", 3, (rand) => {
  const k = randInt(rand, 1, 4);
  const name = pick(rand, NAMES);
  return {
    key: `${k}:${name}`,
    prompt: `${name}는 한 손의 손가락 5개를 모두 폈습니다. 손가락을 몇 개 접으면 펴 있는 손가락으로 ${eul(k)} 나타낼 수 있나요?`,
    answer: 5 - k,
    unit: "개",
    hint: `손가락 5개 중에서 ${k}개만 펴 있으면 돼요. 나머지를 접어요.`,
    explanation: `5는 ${wa(k)} ${josa(5 - k, "으로/로")} 가를 수 있으니 ${5 - k}개를 접어요.`.replace(`${josa(5 - k, "으로/로")}`, josa(5 - k, "으로/로")),
    mistakes: { [k]: "펴 있어야 하는 손가락의 수를 썼어요." },
  };
});
export const pair5 = moreByPairing("l1-w-pair5", 2, 5);

export const dots9 = countDotsIn("l1-dots9", 6, 9);
export const read9 = readNum("l1-read9", [6, 7, 8, 9]);
export const pickDots9 = pickDots("l1-pick-dots9", 6, 9);
export const fingers10 = gen("l1-w-fingers10", 3, (rand) => {
  const k = randInt(rand, 6, 9);
  const name = pick(rand, NAMES);
  return {
    key: `${k}:${name}`,
    // 10은 5단원에서 배우므로 '손가락 10개'라고 쓰지 않는다
    prompt: `${name}는 두 손의 손가락을 모두 폈습니다. 손가락을 몇 개 접으면 펴 있는 손가락으로 ${eul(k)} 나타낼 수 있나요?`,
    answer: 10 - k,
    unit: "개",
    hint: `한 손 5개와 다른 손 몇 개로 ${eul(k)} 나타내 보세요. 펴지 않은 손가락이 접은 손가락이에요.`,
    explanation: `한 손은 5개를 모두 펴고, 다른 손은 5개 중 ${k - 5}개만 펴면 ${josa(k, "이에요/예요")}. 다른 손에서 ${10 - k}개를 접어요.`,
    mistakes: { [k]: "펴 있어야 하는 손가락의 수를 썼어요." },
  };
});
export const pair9 = moreByPairing("l1-w-pair9", 6, 9);

/** 서로 확연히 다른 모양만(●/○처럼 비슷한 짝은 순서보다 모양 구별이 어려워진다) */
const SYM_ORD = ["○", "△", "☆", "◇", "♡", "□"];
export const ordinalPick = gen("l1-ordinal-pick", 1, (rand) => {
  const row = shuffle(rand, SYM_ORD).slice(0, randInt(rand, 5, 6));
  const k = randInt(rand, 2, row.length - 1);
  const left = rand() < 0.6;
  const idx = left ? k - 1 : row.length - k;
  const answer = row[idx];
  const choices = four(rand, answer, [row[row.length - 1 - idx], row[idx - 1], row[idx + 1], row[0]].filter(Boolean));
  if (!choices) return null;
  return {
    key: `${row.join("")}:${k}:${left}`,
    prompt: `${left ? "왼쪽" : "오른쪽"}에서 ${ord(k)}에 있는 모양을 고르세요.`,
    visual: rowScene(row, "모양을 한 줄로 늘어놓은 그림"),
    answer,
    choices,
    hint: `${left ? "왼쪽" : "오른쪽"} 끝에서부터 첫째, 둘째, …로 세어요.`,
    explanation: `${left ? "왼쪽" : "오른쪽"}에서 ${ord(k)}는 ${answer}`,
  };
});
export const ordinalWhich = gen("l1-ordinal-which", 2, (rand) => {
  const n = randInt(rand, 5, 9);
  const k = randInt(rand, 1, n);
  const row = Array.from({ length: n }, (_, i) => (i === k - 1 ? "●" : "○"));
  const left = rand() < 0.5;
  const ans = left ? k : n - k + 1;
  return {
    key: `${n}:${k}:${left}`,
    prompt: `색칠한 ●는 ${left ? "왼쪽" : "오른쪽"}에서 몇째인가요?`,
    visual: rowScene(row, `○ 사이에 ● 하나`),
    answer: ans,
    unit: "째",
    hint: `${left ? "왼쪽" : "오른쪽"} 끝부터 하나씩 세어 보세요.`,
    explanation: `${left ? "왼쪽" : "오른쪽"}에서 ${ord(ans)}`,
    mistakes: { [left ? n - k + 1 : k]: "반대쪽에서 셌어요." },
  };
});
/** 중: '셋'과 '셋째' 구별 — 개수만큼 색칠한 줄과 그 순서에만 색칠한 줄(하나 많거나 적은 줄도 보기로) */
export const ordinalWord = gen("l1-ordinal-word", 2, (rand) => {
  const n = randInt(rand, 3, 6);
  const len = 8;
  const count = (k: number) => Array.from({ length: len }, (_, i) => i < k);
  const only = (k: number) => Array.from({ length: len }, (_, i) => i === k - 1);
  const askNth = rand() < 0.5;
  const other = pick(rand, [n - 1, n + 1]);
  const kinds = shuffle(rand, ["count", "only", "countOther", "onlyOther"]);
  const rows = kinds.map((k) => (k === "count" ? count(n) : k === "only" ? only(n) : k === "countOther" ? count(other) : only(other)));
  const answer = PIC_MARKS[kinds.indexOf(askNth ? "only" : "count")];
  return {
    key: `${n}:${other}:${kinds.join()}:${askNth}`,
    prompt: askNth ? `왼쪽에서 ${ord(n)}에만 색칠한 것을 고르세요.` : `왼쪽에서부터 ${ONES_N[n]}만큼 색칠한 것을 고르세요.`,
    visual: shadedRowsScene(rows),
    answer,
    choices: PIC_MARKS.slice(0, 4),
    hint: `'${ONES_N[n]}'은 개수, '${ord(n)}'는 순서예요.`,
    explanation: askNth ? `${ord(n)}는 순서이므로 ${ord(n)} 한 개에만 색칠한 ${answer}` : `${ONES_N[n]}은 개수이므로 ${n}개를 색칠한 ${answer}`,
  };
});
/** 상: 그림에는 ○만 그리고 친구를 칠하지 않는다 — 앞에서 찾기(1단계) → 뒤에서 다시 세기(2단계) */
export const frontBack = gen("l1-w-front-back", 3, (rand) => {
  const n = randInt(rand, 5, 9);
  const a = randInt(rand, 2, n - 1);
  const name = pick(rand, NAMES);
  return {
    key: `${n}:${a}:${name}`,
    prompt: `친구 ${n}명이 한 줄로 서 있습니다. ${name}는 앞에서 ${ord(a)}입니다. ${name}는 뒤에서 몇째인가요?`,
    visual: lineFrontBackScene(n),
    answer: n - a + 1,
    unit: "째",
    hint: `그림에서 앞에서 ${ord(a)} ○에 표시하고, 뒤 끝부터 표시한 ○까지 세어 보세요.`,
    explanation: `뒤에서부터 세면 ${ord(n - a + 1)}`,
    mistakes: { [n - a]: `${name}를 빼고 셌어요.` },
  };
});

export const seq9 = seqBlank("l1-seq9", 1, 9);
export const seqRight9 = gen("l1-seq-right9", 2, (rand) => {
  const s = randInt(rand, 1, 6);
  const ok = [s, s + 1, s + 2, s + 3];
  const bad = (i: number) => {
    const c = [...ok];
    [c[i], c[i + 1]] = [c[i + 1], c[i]];
    return c.join(", ");
  };
  const down = rand() < 0.4;
  const fix = (x: string) => (down ? x.split(", ").reverse().join(", ") : x);
  const answer = fix(ok.join(", "));
  const choices = four(rand, answer, [bad(0), bad(1), bad(2)].map(fix));
  if (!choices) return null;
  return {
    key: `${s}:${down}:${choices.join("|")}`,
    prompt: down ? "수를 거꾸로 바르게 센 것을 고르세요." : "수를 순서대로 바르게 쓴 것을 고르세요.",
    answer,
    choices,
    hint: down ? "1씩 작아지는지 살펴보세요." : "1씩 커지는지 살펴보세요.",
    explanation: answer,
  };
});
export const condOrder9 = gen("l1-w-cond-order9", 3, (rand) => {
  const a = randInt(rand, 1, 5);
  const drop = randInt(rand, a + 1, a + 2);
  const ans = drop === a + 1 ? a + 2 : a + 1;
  return {
    key: `${a}:${drop}`,
    prompt: `다음을 모두 만족하는 수를 구하세요.\n· ${a}보다 뒤에 있는 수입니다.\n· ${a + 3}보다 앞에 있는 수입니다.\n· ${drop}${batchim(drop) ? "이" : "가"} 아닙니다.`,
    answer: ans,
    hint: `${wa(a)} ${a + 3} 사이의 수를 먼저 써 보세요.`,
    explanation: `${a + 1}, ${a + 2} 중 ${drop}${batchim(drop) ? "이" : "가"} 아닌 수 → ${ans}`,
  };
});

export const oneMoreDots = gen("l1-one-more-dots", 1, (rand) => {
  const n = randInt(rand, 1, 8);
  const more = rand() < 0.5;
  const ans = more ? n + 1 : n - 1;
  return {
    key: `${n}:${more}`,
    prompt: `점의 수보다 1만큼 더 ${more ? "큰" : "작은"} 수를 쓰세요.`,
    visual: dotsScene(n),
    answer: ans,
    hint: more ? "점을 하나 더 그린다고 생각해요." : "점을 하나 지운다고 생각해요.",
    explanation: `${n}보다 1만큼 더 ${more ? "큰" : "작은"} 수는 ${ans}`,
    mistakes: { [more ? n - 1 : n + 1]: "반대로 생각했어요." },
  };
});
export const oneMoreRev = gen("l1-one-more-rev", 2, (rand) => {
  const k = randInt(rand, 1, 8);
  const more = rand() < 0.5;
  const ans = more ? k - 1 : k + 1;
  return {
    key: `${k}:${more}`,
    prompt: `□보다 1만큼 더 ${more ? "큰" : "작은"} 수는 ${k}입니다. □ 안에 알맞은 수를 써넣으세요.`,
    answer: ans,
    hint: `□는 ${k}보다 1만큼 더 ${more ? "작은" : "큰"} 수예요.`,
    explanation: `${ans}보다 1만큼 더 ${more ? "큰" : "작은"} 수가 ${k}`,
    mistakes: { [more ? k + 1 : k - 1]: "거꾸로 생각했어요." },
  };
});
export const between9b = betweenOne("l1-between9", 0, 9);
/** 하: 0 알아보기 — 1개씩 줄어들다 아무것도 없는 칸 */
export const zeroCount = gen("l1-zero-count", 1, (rand) => {
  // 5부터면 10칸 틀이 6개라 휴대폰에서 너무 작아져 4까지
  const from = randInt(rand, 2, 4);
  return {
    key: `${from}`,
    prompt: "점의 수가 1개씩 줄어듭니다. ?에 알맞은 수를 쓰세요.",
    visual: countdownScene(from),
    answer: 0,
    hint: "아무것도 없는 것을 0이라고 해요.",
    explanation: `${range(0, from).reverse().join(", ")} → 점이 하나도 없으므로 0(영)`,
    mistakes: { 1: "마지막 칸에는 점이 없어요." },
  };
});
export const candyChain = gen("l1-w-candy-chain", 3, (rand) => {
  const [a, b, c] = shuffle(rand, NAMES).slice(0, 3);
  const n = randInt(rand, 2, 7);
  const s1 = rand() < 0.5 ? 1 : -1;
  const s2 = rand() < 0.5 ? 1 : -1;
  const ans = n + s1 + s2;
  const w = (s: number) => (s > 0 ? "1개 더 많이" : "1개 더 적게");
  return {
    key: `${n}:${s1}:${s2}:${a}`,
    prompt: `${a}는 사탕을 ${n}개 가지고 있습니다. ${b}는 ${a}보다 ${w(s1)}, ${c}는 ${b}보다 ${w(s2)} 가지고 있습니다. ${c}가 가진 사탕은 몇 개인가요?`,
    answer: ans,
    unit: "개",
    hint: `${b}가 가진 사탕 수를 먼저 구해요.`,
    explanation: `${b}: ${n + s1}개, ${c}: ${ans}개`,
    mistakes: { [n + s2]: `${b}의 사탕 수를 먼저 구하지 않았어요.` },
  };
});
export const reverseOne = gen("l1-w-reverse-one", 3, (rand) => {
  const k = randInt(rand, 1, 7);
  const lessFirst = rand() < 0.5;
  const x = lessFirst ? k + 1 : k - 1;
  const ans = lessFirst ? x + 1 : x - 1;
  if (x < 0 || ans < 0) return null;
  return {
    key: `${k}:${lessFirst}`,
    prompt: `어떤 수보다 1만큼 더 ${lessFirst ? "작은" : "큰"} 수는 ${k}입니다. 어떤 수보다 1만큼 더 ${lessFirst ? "큰" : "작은"} 수는 무엇인가요?`,
    answer: ans,
    hint: "먼저 어떤 수를 구해요.",
    explanation: `어떤 수는 ${x}, ${x}보다 1만큼 더 ${lessFirst ? "큰" : "작은"} 수는 ${ans}`,
    mistakes: { [x]: "어떤 수까지만 구했어요." },
  };
});

export const bigger9 = biggerOfTwo("l1-bigger9", 0, 9);
export const orderNth9 = orderNth("l1-order-nth9", 0, 9);
/** 중: 물건의 수는 '많다·적다', 수는 '크다·작다'로 말하기 */
export const moreFewerWords = gen("l1-more-fewer-words", 2, (rand) => {
  const [a, b] = distinct(rand, 2, 8, 2);
  const [big, small] = a > b ? [a, b] : [b, a];
  const topMore = a > b;
  const top = "●";
  const bottom = "▲";
  const [M, F] = topMore ? [top, bottom] : [bottom, top];
  const answer = rand() < 0.5 ? `${M}는 ${F}보다 많습니다.` : `${eun(big)} ${small}보다 큽니다.`;
  const wrongs = [`${M}는 ${F}보다 적습니다.`, `${eun(big)} ${small}보다 작습니다.`, `${M}는 ${F}보다 큽니다.`, `${eun(small)} ${big}보다 많습니다.`];
  const choices = four(rand, answer, shuffle(rand, wrongs));
  if (!choices) return null;
  return {
    key: `${a}:${b}:${choices.join()}`,
    prompt: `● ${a}개와 ▲ ${b}개를 하나씩 짝 지어 비교했습니다. 바르게 말한 것을 고르세요.`,
    visual: twoRowsScene(a, b),
    answer,
    choices,
    hint: "물건의 수는 '많다, 적다'로, 수는 '크다, 작다'로 말해요.",
    explanation: `${M}는 ${F}보다 많고, ${eun(big)} ${small}보다 큽니다.`,
  };
});
export const countBigger9 = countBigger("l1-count-bigger9", 0, 9);
export const most9 = mostName("l1-w-most9", 1, 9, "구슬", "개");
export const canBe9 = gen("l1-w-can-be9", 3, (rand) => {
  const a = randInt(rand, 2, 7);
  const big = rand() < 0.5;
  const ok = big ? range(a + 1, 9) : range(1, a - 1);
  return {
    key: `${a}:${big}`,
    prompt: `1부터 9까지의 수 중에서 ${a}보다 ${big ? "큰" : "작은"} 수는 모두 몇 개인가요?`,
    answer: ok.length,
    unit: "개",
    hint: `${eun(a)} 빼고 세어요.`,
    explanation: `${ok.join(", ")} → ${ok.length}개`,
    mistakes: { [ok.length + 1]: `${a}도 셌어요.` },
  };
});

export const n9 = {
  toNine: ex(U1, "count9", "m1-to-nine"),
  lineOrder: ex(U1, "count9", "w1-line-order"),
  countDown: ex(U1, "order9", "m1-count-down"),
  between9: ex(U1, "order9", "w1-between9"),
};

/* ════════ 1-1 2단원 여러 가지 모양 ════════ */

/* 1-1 2단원은 교과서처럼 모두 그림(입체 모양)을 보고 푼다. 물건 이름은 모양이 하나로 정해지는 것만 쓴다 */
const SOLIDS: Record<SolidKind, string[]> = {
  box: ["주사위", "휴지 상자", "벽돌", "우유갑", "과자 상자"],
  cyl: ["음료수 캔", "풀", "두루마리 휴지", "북", "통조림"],
  ball: ["축구공", "구슬", "수박", "야구공", "지구본"],
};
const SHAPES = SOLID_KINDS.map((k) => SOLID_NAME[k]);
const FEATURE: Record<SolidKind, string> = {
  box: "평평한 부분만 있어서 잘 쌓을 수 있고, 굴러가지 않아요",
  cyl: "평평한 부분과 둥근 부분이 있어서 세우면 쌓을 수 있고, 눕히면 굴러가요",
  ball: "둥근 부분만 있어서 어느 쪽으로도 잘 굴러가고, 쌓을 수 없어요",
};
const M4 = PIC_MARKS.slice(0, 4);
const others = (k: SolidKind) => SOLID_KINDS.filter((x) => x !== k);
/** 정답 모양 1개 + 다른 두 모양이 고루 섞인 3개 */
const oneOf = (rand: () => number, k: SolidKind): SolidKind[] => {
  const [p, q] = shuffle(rand, others(k));
  return shuffle(rand, [k, p, q, pick(rand, [p, q])]);
};
/** 모양 a·b·c개를 섞어 늘어놓는다 */
const mixed = (rand: () => number, counts: number[]): Solid[] => shuffle(rand, SOLID_KINDS.flatMap((k, i) => Array.from({ length: counts[i] }, () => randomSolid(rand, k))));

export const solidShape = gen("solid-shape", 1, (rand) => {
  const k = pick(rand, SOLID_KINDS);
  const kinds = oneOf(rand, k);
  const answer = M4[kinds.indexOf(k)];
  return {
    key: kinds.join(),
    prompt: `그림에서 ${josa(SOLID_NAME[k], "을/를")} 찾아 고르세요.`,
    visual: solidsScene(kinds.map((x) => randomSolid(rand, x)), "여러 가지 모양의 물건 네 개", M4),
    answer,
    choices: M4,
    hint: "평평한 부분과 둥근 부분이 있는지 살펴보세요.",
    explanation: `${josa(answer, "이/가")} ${SOLID_NAME[k]}입니다.`,
  };
});
export const sameShape = gen("l1-same-shape", 1, (rand) => {
  const k = pick(rand, SOLID_KINDS);
  const kinds = oneOf(rand, k);
  const ref = randomSolid(rand, k);
  const items = kinds.map((x) => (x === k ? { kind: k, v: (ref.v + 1) % (k === "box" ? 4 : 3) } : randomSolid(rand, x)));
  const answer = M4[kinds.indexOf(k)];
  return {
    key: `${ref.v}:${kinds.join()}`,
    prompt: "보기와 같은 모양을 고르세요.",
    visual: solidsScene([ref, ...items], "보기와 물건 네 개", ["보기", ...M4]),
    answer,
    choices: M4,
    hint: "크기나 놓인 방향이 달라도 평평한 부분과 둥근 부분이 같으면 같은 모양이에요.",
    explanation: `보기와 ${josa(answer, "은/는")} 모두 ${SOLID_NAME[k]}입니다.`,
  };
});
export const ballCount = gen("m1-ball-count", 2, (rand) => {
  const counts = [randInt(rand, 1, 3), randInt(rand, 1, 3), randInt(rand, 1, 4)];
  const items = mixed(rand, counts);
  return {
    key: items.map((s) => `${s.kind}${s.v}`).join(),
    prompt: "그림에서 공 모양은 몇 개인가요?",
    visual: solidsScene(items, "여러 가지 모양의 물건", undefined, 4),
    answer: counts[2],
    unit: "개",
    hint: "둥근 부분만 있고 평평한 부분이 없는 것을 찾아 표시하며 세어요.",
    explanation: `공 모양은 ${counts[2]}개입니다.`,
    mistakes: { [counts[1] + counts[2]]: "둥근기둥 모양도 셌어요." },
  };
});
export const oddShape = gen("l1-odd-shape", 2, (rand) => {
  const [s, t] = shuffle(rand, SOLID_KINDS);
  const kinds = shuffle(rand, [s, s, s, t]);
  const answer = M4[kinds.indexOf(t)];
  return {
    key: `${kinds.join()}`,
    prompt: "모양이 다른 하나를 고르세요.",
    visual: solidsScene(kinds.map((x) => randomSolid(rand, x)), "물건 네 개", M4),
    answer,
    choices: M4,
    hint: "평평한 부분과 둥근 부분이 있는지 하나씩 살펴보세요.",
    explanation: `나머지는 ${SOLID_NAME[s]}이고, ${josa(answer, "은/는")} ${SOLID_NAME[t]}입니다.`,
  };
});
export const shapeMore = gen("l1-w-shape-more", 3, (rand) => {
  const [si, ti] = shuffle(rand, [0, 1, 2]);
  const counts = [0, 0, 0];
  counts[si] = randInt(rand, 3, 5);
  counts[ti] = randInt(rand, 1, counts[si] - 1);
  counts[3 - si - ti] = randInt(rand, 1, 2);
  const [S, T] = [SHAPES[si], SHAPES[ti]];
  return {
    key: `${counts.join()}:${si}${ti}:${randInt(rand, 0, 99)}`,
    prompt: `그림에서 ${josa(S, "은/는")} ${T}보다 몇 개 더 많은가요?`,
    visual: solidsScene(mixed(rand, counts), "여러 가지 모양의 물건", undefined, 5),
    answer: counts[si] - counts[ti],
    unit: "개",
    hint: "두 모양의 물건을 각각 세어 하나씩 짝 지어 보세요.",
    explanation: `${S} ${counts[si]}개, ${T} ${counts[ti]}개 → ${counts[si] - counts[ti]}개 더 많아요.`,
    mistakes: { [counts[si]]: `${S}의 수만 셌어요.` },
  };
});
export const twoKindsCount = gen("l1-w-two-kinds", 3, (rand) => {
  const counts = [randInt(rand, 1, 3), randInt(rand, 1, 3), randInt(rand, 1, 3)];
  const skip = randInt(rand, 0, 2);
  const [a, b] = [0, 1, 2].filter((i) => i !== skip);
  return {
    key: `${counts.join()}:${skip}:${randInt(rand, 0, 99)}`,
    prompt: `그림에서 ${josa(SHAPES[a], "과/와")} ${josa(SHAPES[b], "은/는")} 모두 몇 개인가요?`,
    visual: solidsScene(mixed(rand, counts), "여러 가지 모양의 물건", undefined, 5),
    answer: counts[a] + counts[b],
    unit: "개",
    hint: "두 모양을 각각 세어 모아요. 센 물건에 표시하면 두 번 세지 않아요.",
    explanation: `${SHAPES[a]} ${counts[a]}개, ${SHAPES[b]} ${counts[b]}개 → ${counts[a] + counts[b]}개`,
    mistakes: { [counts[a]]: `${SHAPES[b]}을 빠뜨렸어요.`, [counts[0] + counts[1] + counts[2]]: `${SHAPES[skip]}까지 셌어요.` },
  };
});

export const sortCount = gen("l1-sort-count", 1, (rand) => {
  const counts = SOLID_KINDS.map(() => randInt(rand, 1, 3));
  const k = randInt(rand, 0, 2);
  const items = mixed(rand, counts);
  return {
    key: `${items.map((s) => `${s.kind}${s.v}`).join()}:${k}`,
    prompt: `같은 모양끼리 모으면 ${josa(SHAPES[k], "은/는")} 몇 개인가요?`,
    visual: solidsScene(items, "여러 가지 모양의 물건", undefined, 5),
    answer: counts[k],
    unit: "개",
    hint: `${SHAPES[k]}인 물건에 표시하며 세어 보세요.`,
    explanation: `${SHAPES[k]}은 ${counts[k]}개입니다.`,
  };
});
export const groupName = gen("l1-group-name", 2, (rand) => {
  const isMixed = rand() < 0.25;
  const k = pick(rand, SOLID_KINDS);
  const kinds: SolidKind[] = isMixed ? shuffle(rand, [...SOLID_KINDS]) : [k, k, k];
  const answer = isMixed ? "같은 모양끼리 모은 것이 아니에요" : SOLID_NAME[k];
  return {
    key: `${kinds.join()}:${randInt(rand, 0, 99)}`,
    prompt: "그림과 같이 물건을 모았습니다. 어떤 모양끼리 모은 것인가요?",
    visual: solidsScene(kinds.map((x) => randomSolid(rand, x)), "모은 물건 세 개"),
    answer,
    choices: [...SHAPES, "같은 모양끼리 모은 것이 아니에요"],
    hint: "크기나 놓인 방향이 달라도 모양이 같을 수 있어요. 평평한 부분과 둥근 부분을 살펴보세요.",
    explanation: isMixed ? "상자 모양, 둥근기둥 모양, 공 모양이 섞여 있어요." : `모두 ${SOLID_NAME[k]}입니다.`,
  };
});
export const wrongGroup = gen("l1-wrong-group", 2, (rand) => {
  const [s, t] = shuffle(rand, SOLID_KINDS);
  const kinds = shuffle(rand, [s, s, s, t]);
  const answer = M4[kinds.indexOf(t)];
  return {
    key: kinds.join(),
    prompt: `${SOLID_NAME[s]}끼리 모았습니다. 잘못 모은 것을 고르세요.`,
    visual: solidsScene(kinds.map((x) => randomSolid(rand, x)), "모은 물건 네 개", M4),
    answer,
    choices: M4,
    hint: `${SOLID_NAME[s]}의 평평한 부분과 둥근 부분을 떠올려 보세요.`,
    explanation: `${josa(answer, "은/는")} ${SOLID_NAME[t]}입니다.`,
  };
});
export const sortError = gen("l1-w-sort-error", 3, (rand) => {
  const [s, t, u] = shuffle(rand, SOLID_KINDS);
  const kinds = shuffle(rand, [s, s, s, t]);
  const wi = kinds.indexOf(t);
  const oi = pick(rand, [0, 1, 2, 3].filter((i) => i !== wi));
  const name = pick(rand, NAMES);
  const say = (i: number, k: SolidKind) => `${josa(M4[i], "은/는")} ${SOLID_NAME[k]}이라서 잘못 모았어요.`;
  const answer = say(wi, t);
  // 번호 2개 × 까닭 2개로 보기를 만들어, 보기에 자주 나오는 번호로 답을 짐작할 수 없게 한다
  return {
    key: `${kinds.join()}:${oi}:${u}`,
    prompt: `${name}가 그림의 물건을 ${SOLID_NAME[s]}이라고 모았습니다. 잘못 모은 것과 그 까닭을 바르게 말한 것을 고르세요.`,
    visual: solidsScene(kinds.map((x) => randomSolid(rand, x)), "모은 물건 네 개", M4),
    answer,
    choices: shuffle(rand, [answer, say(wi, u), say(oi, t), say(oi, u)]),
    hint: "물건 하나하나의 모양을 살펴보세요. 평평한 부분만 있는지, 둥근 부분도 있는지 보세요.",
    explanation: `${josa(M4[wi], "은/는")} ${SOLID_NAME[t]}이고, 나머지는 ${SOLID_NAME[s]}이에요.`,
  };
});

export const featureThing = gen("l1-feature-thing", 1, (rand) => {
  const k = pick(rand, SOLID_KINDS);
  const kinds = oneOf(rand, k);
  const answer = M4[kinds.indexOf(k)];
  return {
    key: kinds.join(),
    prompt: `${FEATURE[k]}. 이런 모양을 그림에서 고르세요.`,
    visual: solidsScene(kinds.map((x) => randomSolid(rand, x)), "여러 가지 모양의 물건 네 개", M4),
    answer,
    choices: M4,
    hint: "평평한 부분이 있으면 쌓을 수 있고, 둥근 부분이 있으면 굴러가요.",
    explanation: `${josa(answer, "은/는")} ${SOLID_NAME[k]}이에요. ${FEATURE[k]}.`,
  };
});

const ACTIONS: { q: string; k: SolidKind }[] = [
  { q: "쌓을 수도 있고 굴릴 수도 있는", k: "cyl" },
  { q: "쌓을 수는 있지만 굴러가지 않는", k: "box" },
  { q: "잘 굴러가지만 쌓을 수 없는", k: "ball" },
];
export const rollStack = gen("l1-roll-stack", 2, (rand) => {
  const a = pick(rand, ACTIONS);
  const kinds = oneOf(rand, a.k);
  const answer = M4[kinds.indexOf(a.k)];
  return {
    key: `${a.k}:${kinds.join()}`,
    prompt: `${a.q} 것을 그림에서 고르세요.`,
    visual: solidsScene(kinds.map((x) => randomSolid(rand, x)), "여러 가지 모양의 물건 네 개", M4),
    answer,
    choices: M4,
    hint: "평평한 부분은 쌓기, 둥근 부분은 굴리기와 관련 있어요.",
    explanation: `${josa(answer, "은/는")} ${SOLID_NAME[a.k]}이라서 ${a.q} 모양이에요.`,
  };
});
const PEEK_CLUE: Record<SolidKind, string> = {
  box: "평평한 부분과 뾰족한 부분이 보여요",
  cyl: "평평한 부분이 보이고, 테두리가 둥글어요",
  ball: "둥근 부분만 보여요",
};
export const peekShape = gen("l1-w-peek-shape", 3, (rand) => {
  const k = pick(rand, SOLID_KINDS);
  const answer = pick(rand, SOLIDS[k]);
  const [p, q] = others(k);
  const wrong = [pick(rand, SOLIDS[p]), pick(rand, SOLIDS[q]), pick(rand, SOLIDS[pick(rand, [p, q])])];
  const choices = four(rand, answer, wrong);
  if (!choices) return null;
  const name = pick(rand, NAMES);
  return {
    key: `${k}:${choices.join()}`,
    prompt: `${name}가 가리개 뒤에 물건을 하나 숨겼더니 그림처럼 윗부분만 보입니다. 숨긴 물건으로 알맞은 것을 고르세요.`,
    visual: peekScene(k),
    answer,
    choices,
    hint: "보이는 부분이 평평한지, 둥근지, 뾰족한 곳이 있는지 보고 어떤 모양인지 먼저 알아내요.",
    explanation: `${PEEK_CLUE[k]} → ${SOLID_NAME[k]} → ${answer}`,
  };
});
/** 한 모양에 대한 옳은 말·틀린 말. 틀린 말 중 says에 있는 것을 친구가 말하고, fix가 바르게 고친 말이다 */
export type ShapeClaims = { subject: string; truths: string[]; falses: string[]; says: { say: string; fix: string }[] };

/** 모양 이름 → 그 모양 그림(도형 단원은 말로만 풀지 않게 설명 문제에도 그림을 곁들인다) */
export type ClaimPicture = (subject: string, rand: () => number) => ShapeScene;

/** 친구가 틀리게 말한 것을 바르게 고친 말 고르기. 보기 4개가 모두 같은 모양에 대한 말이라 주어로 답을 알 수 없다 */
export function fixSaying(id: string, claims: ShapeClaims[], ask: string, hint: string, picture?: ClaimPicture): Generator {
  return gen(id, 3, (rand) => {
    const c = pick(rand, claims);
    const { say, fix } = pick(rand, c.says);
    const name = pick(rand, NAMES);
    const others = c.falses.filter((f) => f !== say);
    if (others.length < 3) return null;
    return {
      key: `${say}:${name}`,
      prompt: `${name}가 ${picture ? "그림의 모양을 보고 " : ""}"${say}"라고 말했습니다. ${ask}`,
      visual: picture?.(c.subject, rand),
      answer: fix,
      choices: shuffle(rand, [fix, ...shuffle(rand, others).slice(0, 3)]),
      hint,
      explanation: `바르게 고치면 "${fix}"입니다.`,
    };
  });
}

/** 중: 그림의 모양을 옳게(틀리게) 설명한 것 고르기 — 보기가 모두 그림의 모양에 대한 말이다 */
export function pickClaim(id: string, claims: ShapeClaims[], picture: ClaimPicture, hint: string): Generator {
  return gen(id, 2, (rand) => {
    const c = pick(rand, claims);
    const truth = rand() < 0.5;
    const [pool, rest] = truth ? [c.truths, c.falses] : [c.falses, c.truths];
    if (rest.length < 3) return null;
    const answer = pick(rand, pool);
    const choices = shuffle(rand, [answer, ...shuffle(rand, rest).slice(0, 3)]);
    return {
      key: `${c.subject}:${truth}:${choices.join("|")}`,
      prompt: `그림과 같은 모양을 ${truth ? "바르게" : "잘못"} 설명한 것을 고르세요.`,
      visual: picture(c.subject, rand),
      answer,
      choices,
      hint,
      explanation: `${truth ? "바른" : "잘못된"} 설명: ${answer}`,
    };
  });
}

export const SOLID_CLAIMS: ShapeClaims[] = [
  {
    subject: "상자 모양",
    truths: ["상자 모양은 둥근 부분이 없어서 굴러가지 않아요.", "상자 모양은 평평한 부분이 있어서 잘 쌓을 수 있어요.", "상자 모양은 뾰족한 부분이 있어요."],
    falses: ["상자 모양은 둥근 부분이 있어서 잘 굴러가요.", "상자 모양은 평평한 부분이 없어서 쌓을 수 없어요.", "상자 모양은 뾰족한 부분이 없어서 잘 굴러가요.", "상자 모양은 둥근 부분만 있어서 어느 쪽으로도 잘 굴러가요."],
    says: [
      { say: "상자 모양은 둥근 부분이 있어서 잘 굴러가요.", fix: "상자 모양은 둥근 부분이 없어서 굴러가지 않아요." },
      { say: "상자 모양은 평평한 부분이 없어서 쌓을 수 없어요.", fix: "상자 모양은 평평한 부분이 있어서 잘 쌓을 수 있어요." },
    ],
  },
  {
    subject: "공 모양",
    truths: ["공 모양은 평평한 부분이 없어서 쌓을 수 없어요.", "공 모양은 둥근 부분만 있어서 어느 쪽으로도 잘 굴러가요.", "공 모양은 어느 쪽에서 보아도 둥글어요."],
    falses: ["공 모양은 평평한 부분이 있어서 쌓을 수 있어요.", "공 모양은 둥근 부분이 없어서 굴러가지 않아요.", "공 모양은 뾰족한 부분이 있어서 쌓을 수 있어요.", "공 모양은 평평한 부분만 있어서 굴러가지 않아요."],
    says: [
      { say: "공 모양은 평평한 부분이 있어서 쌓을 수 있어요.", fix: "공 모양은 평평한 부분이 없어서 쌓을 수 없어요." },
      { say: "공 모양은 둥근 부분이 없어서 굴러가지 않아요.", fix: "공 모양은 둥근 부분만 있어서 어느 쪽으로도 잘 굴러가요." },
    ],
  },
  {
    subject: "둥근기둥 모양",
    truths: ["둥근기둥 모양은 평평한 부분이 있어서 세우면 쌓을 수 있어요.", "둥근기둥 모양은 둥근 부분이 있어서 눕히면 굴러가요.", "둥근기둥 모양은 위와 아래가 평평해요."],
    falses: ["둥근기둥 모양은 평평한 부분이 없어서 쌓을 수 없어요.", "둥근기둥 모양은 둥근 부분이 없어서 굴러가지 않아요.", "둥근기둥 모양은 뾰족한 부분이 있어서 굴러가지 않아요.", "둥근기둥 모양은 둥근 부분만 있어서 어느 쪽으로도 잘 굴러가요."],
    says: [
      { say: "둥근기둥 모양은 평평한 부분이 없어서 쌓을 수 없어요.", fix: "둥근기둥 모양은 평평한 부분이 있어서 세우면 쌓을 수 있어요." },
      { say: "둥근기둥 모양은 둥근 부분이 없어서 굴러가지 않아요.", fix: "둥근기둥 모양은 둥근 부분이 있어서 눕히면 굴러가요." },
    ],
  },
];
/** 입체 모양 이름 → 같은 모양 두 가지 모습 */
const solidPicture: ClaimPicture = (subject, rand) => {
  const k = SOLID_KINDS.find((x) => SOLID_NAME[x] === subject)!;
  const v = randInt(rand, 0, k === "box" ? 3 : 2);
  return solidsScene([{ kind: k, v }, { kind: k, v: (v + 1) % (k === "box" ? 4 : 3) }], `${subject} 물건 두 개`);
};
export const featureTrue = pickClaim("l1-feature-true", SOLID_CLAIMS, solidPicture, "평평한 부분이 있으면 쌓을 수 있고, 둥근 부분이 있으면 굴러가요.");
export const featureError = fixSaying("l1-w-feature-error", SOLID_CLAIMS, "바르게 고쳐 말한 것을 고르세요.", "그림의 모양에 평평한 부분, 둥근 부분, 뾰족한 부분이 있는지 살펴보세요.", solidPicture);

/** 조건에 맞는 쌓은 모양이 나올 때까지 뽑는다 */
function buildWhere(rand: () => number, ok: (c: number[], b: Build) => boolean): Build | null {
  for (let i = 0; i < 200; i++) {
    const b = randomBuild(rand);
    if (ok(buildCounts(b), b)) return b;
  }
  return null;
}
const buildKey = (b: Build) => b.map((col) => col.map((s) => s.kind[0]).join("")).join("|");

export const buildCount = gen("l1-build-count", 1, (rand) => {
  const b = randomBuild(rand);
  const c = buildCounts(b);
  const k = pick(rand, [0, 1, 2].filter((i) => c[i] > 0));
  return {
    key: `${buildKey(b)}:${k}`,
    prompt: `그림과 같은 모양을 만드는 데 ${josa(SHAPES[k], "을/를")} 몇 개 사용했나요?`,
    visual: buildScene(b),
    answer: c[k],
    unit: "개",
    hint: `${SHAPES[k]}에 하나씩 표시하며 세어 보세요.`,
    explanation: `${SHAPES[k]} ${c[k]}개`,
  };
});
export const buildMost = gen("l1-build-most", 2, (rand) => {
  const b = buildWhere(rand, (c) => c.every((n) => n > 0) && new Set(c).size === 3);
  if (!b) return null;
  const c = buildCounts(b);
  const most = rand() < 0.5;
  const t = most ? Math.max(...c) : Math.min(...c);
  const answer = SHAPES[c.indexOf(t)];
  return {
    key: `${buildKey(b)}:${most}`,
    prompt: `그림과 같은 모양을 만드는 데 가장 ${most ? "많이" : "적게"} 사용한 모양을 고르세요.`,
    visual: buildScene(b),
    answer,
    choices: SHAPES,
    hint: "모양별로 표시하며 세어 수를 비교해요.",
    explanation: SHAPES.map((s, i) => `${s} ${c[i]}개`).join(", ") + ` → ${answer}`,
  };
});
export const buildNeed = gen("l1-build-need", 2, (rand) => {
  const b = buildWhere(rand, (c) => c.some((n) => n >= 2));
  if (!b) return null;
  const c = buildCounts(b);
  const k = pick(rand, [0, 1, 2].filter((i) => c[i] >= 2));
  const have = randInt(rand, 1, c[k] - 1);
  return {
    key: `${buildKey(b)}:${k}:${have}`,
    prompt: `그림과 똑같은 모양을 만들려고 합니다. ${josa(SHAPES[k], "이/가")} ${have}개 있다면 몇 개가 더 있어야 하나요?`,
    visual: buildScene(b),
    answer: c[k] - have,
    unit: "개",
    hint: `그림에서 ${josa(SHAPES[k], "을/를")} 먼저 세어 보세요.`,
    explanation: `${SHAPES[k]}이 ${c[k]}개 필요하므로 ${have}에서 ${c[k]}까지 ${c[k] - have}개 더`,
    mistakes: { [c[k]]: "필요한 개수를 그대로 썼어요." },
  };
});
export const buildWho = gen("l1-w-build-who", 3, (rand) => {
  const a = randomBuild(rand);
  const b = randomBuild(rand);
  const ca = buildCounts(a);
  const cb = buildCounts(b);
  const ks = [0, 1, 2].filter((i) => ca[i] !== cb[i]);
  if (!ks.length) return null;
  const k = pick(rand, ks);
  const [M, L] = ca[k] > cb[k] ? ["①", "②"] : ["②", "①"];
  const diff = Math.abs(ca[k] - cb[k]);
  return {
    key: `${buildKey(a)}:${buildKey(b)}:${k}`,
    prompt: `①과 ②를 만드는 데 사용한 ${josa(SHAPES[k], "을/를")} 비교하려고 합니다. ${josa(M, "은/는")} ${L}보다 ${josa(SHAPES[k], "을/를")} 몇 개 더 많이 사용했나요?`,
    visual: twoBuildsScene(a, b),
    answer: diff,
    unit: "개",
    hint: `①과 ②에서 ${josa(SHAPES[k], "을/를")} 각각 세어 비교해요.`,
    explanation: `① ${ca[k]}개, ② ${cb[k]}개 → ${diff}개 더 많이`,
    mistakes: { [Math.max(ca[k], cb[k])]: `${M}에서 센 수만 썼어요.` },
  };
});
/** 상: 굴러가는 부분(둥근 부분)이 있는 모양 — 둥근기둥은 눕히면, 공은 어느 쪽으로도 굴러간다 */
export const solidsCount = gen("w1-solids-count", 3, (rand) => {
  const b = buildWhere(rand, (c) => c[1] > 0 && c[2] > 0 && c[0] > 0);
  if (!b) return null;
  const c = buildCounts(b);
  return {
    key: buildKey(b),
    prompt: "그림과 같은 모양을 만드는 데 사용한 모양 중에서 둥근 부분이 있어 굴러갈 수 있는 모양은 모두 몇 개인가요?",
    visual: buildScene(b),
    answer: c[1] + c[2],
    unit: "개",
    hint: "둥근기둥 모양은 눕히면 굴러가고, 공 모양은 어느 쪽으로도 굴러가요. 상자 모양은 굴러가지 않아요.",
    explanation: `둥근기둥 모양 ${c[1]}개 + 공 모양 ${c[2]}개 = ${c[1] + c[2]}(개)`,
    mistakes: { [c[2]]: "둥근기둥 모양도 둥근 부분이 있어요.", [c[0] + c[1] + c[2]]: "상자 모양은 굴러가지 않아요." },
  };
});

/* ════════ 1-1 3단원 덧셈과 뺄셈 ════════ */

const U3 = "g1-s1-add-sub";

export const gatherPairs = gen("l1-gather-pairs", 2, (rand) => {
  const n = randInt(rand, 5, 9);
  const good = range(1, n - 1).map((a) => `${wa(a)} ${n - a}`);
  const wrong = randInt(rand, 1, n - 2);
  // 3단원은 10을 배우기 전이라 n = 9이면 하나 작게(합 8) 만든다
  const other = n < 9 ? n - wrong + 1 : n - wrong - 1;
  const answer = `${wa(wrong)} ${other}`;
  const choices = four(rand, answer, shuffle(rand, good));
  if (!choices) return null;
  return { key: `${n}:${choices.join()}`, prompt: `모으기를 하여 ${eul(n)} 만들 수 없는 것을 고르세요.`, answer, choices, hint: "두 수를 모아 보세요.", explanation: `${josa(wrong, "과/와")} ${josa(other, "을/를")} 모으면 ${wrong + other}입니다.` };
});
export const gatherTwoStep = gen("l1-w-gather-two", 3, (rand) => {
  const [p, q] = shuffle(rand, NAMES).slice(0, 2);
  const a = randInt(rand, 1, 4);
  const b = randInt(rand, 1, 4);
  const c = randInt(rand, 1, 9 - a - b);
  if (c < 1) return null;
  return {
    key: `${a}:${b}:${c}:${p}`,
    prompt: `${p}는 빨간 구슬 ${a}개와 파란 구슬 ${b}개를 모았습니다. ${q}는 ${p}가 모은 구슬보다 ${c}개 더 많이 모았습니다. ${q}가 모은 구슬은 몇 개인가요?`,
    answer: a + b + c,
    unit: "개",
    hint: `${p}가 모은 구슬 수를 먼저 구해요.`,
    explanation: `${p}: ${wa(a)} ${eul(b)} 모으면 ${a + b}개, ${q}: ${wa(a + b)} ${eul(c)} 모으면 ${a + b + c}개`,
    mistakes: { [a + b]: `${p}의 구슬 수만 구했어요.` },
  };
});
export const gatherCards = gen("l1-w-gather-cards", 3, (rand) => {
  const cards = distinct(rand, 1, 6, 4);
  const big = rand() < 0.5;
  const s = [...cards].sort((a, b) => a - b);
  const ans = big ? s[3] + s[2] : s[0] + s[1];
  if (ans > 9) return null;
  return {
    key: `${cards.join()}:${big}`,
    prompt: `수 카드 ${cards.join(", ")} 중에서 두 장을 골라 모으기를 하려고 합니다. 모은 수가 가장 ${big ? "크게" : "작게"} 되도록 할 때 모은 수는 얼마인가요?`,
    answer: ans,
    hint: `가장 ${big ? "큰" : "작은"} 수 두 개를 골라요.`,
    explanation: `${wa(big ? s[3] : s[0])} ${josa(big ? s[2] : s[1], "을/를")} 모으면 ${ans}`,
  };
});

export const splitDots = gen("l1-split-dots", 1, (rand) => {
  const n = randInt(rand, 3, 9);
  const a = randInt(rand, 1, n - 1);
  return {
    key: `${n}:${a}`,
    prompt: `점 ${n}개를 ${wa(a)} □로 가르려고 합니다. □ 안에 알맞은 수를 써넣으세요.`,
    visual: frameScene([...Array(a).fill("●"), ...Array(n - a).fill("○")], `● ${a}개와 ○ ${n - a}개`),
    answer: n - a,
    hint: "○의 수를 세어 보세요.",
    explanation: `${eun(n)} ${wa(a)} ${josa(n - a, "으로/로")} 가를 수 있어요.`,
  };
});
/** 중: 가르기 표(한 수를 여러 가지로 가른 것)의 빈칸 */
export const splitWays = gen("l1-split-ways", 2, (rand) => {
  const n = randInt(rand, 5, 9);
  const ways = range(1, n - 1);
  const miss = randInt(rand, 1, ways.length - 2);
  const topBlank = rand() < 0.5;
  return {
    key: `${n}:${miss}:${topBlank}`,
    prompt: `${eul(n)} 여러 가지 방법으로 가른 표입니다. □ 안에 알맞은 수를 써넣으세요.`,
    visual: { kind: "table", header: [`${n}`, ...ways.map((a, i) => (i === miss && topBlank ? "□" : String(a)))], rows: [["", ...ways.map((a, i) => (i === miss && !topBlank ? "□" : String(n - a)))]] },
    answer: topBlank ? ways[miss] : n - ways[miss],
    hint: `위아래 두 수를 모으면 ${josa(n, "이/가")} 돼요. 한쪽이 1씩 커지면 다른 쪽은 1씩 작아져요.`,
    explanation: `${josa(ways[miss], "과/와")} ${josa(n - ways[miss], "을/를")} 모으면 ${n}`,
  };
});
export const splitWrong = gen("l1-split-wrong", 2, (rand) => {
  const n = randInt(rand, 5, 9);
  const good = shuffle(rand, range(1, n - 1)).slice(0, 3).map((a) => `${wa(a)} ${n - a}`);
  const w = randInt(rand, 1, n - 2);
  const answer = `${wa(w)} ${n - w - 1}`;
  return { key: `${n}:${w}:${good.join()}`, prompt: `${eul(n)} 바르게 가르지 않은 것을 고르세요.`, answer, choices: shuffle(rand, [answer, ...good]), hint: "두 수를 다시 모아 보세요.", explanation: `${wa(w)} ${eul(n - w - 1)} 모으면 ${n - 1}입니다.` };
});
export const splitShare = gen("l1-w-split-share", 3, (rand) => {
  const [p, q] = shuffle(rand, NAMES).slice(0, 2);
  const small = randInt(rand, 1, 3);
  const k = randInt(rand, 1, 3);
  const n = small * 2 + k;
  if (n > 9) return null;
  return {
    key: `${n}:${k}:${p}`,
    prompt: `사탕 ${n}개를 ${p}와 ${q}가 나누어 가졌습니다. ${p}가 ${q}보다 ${k}개 더 많이 가졌습니다. ${p}가 가진 사탕은 몇 개인가요?`,
    answer: small + k,
    unit: "개",
    hint: `${josa(n, "을/를")} 두 수로 가르는 방법을 모두 써 보고, 차이가 ${k}인 것을 찾아요.`,
    explanation: `${eun(n)} ${wa(small + k)} ${josa(small, "으로/로")} 가를 수 있고, ${josa(small + k, "은/는")} ${small}보다 ${k} 커요.`,
    mistakes: { [small]: `${q}가 가진 수를 썼어요.` },
  };
});

export const addPic = gen("l1-add-pic", 1, (rand) => {
  const a = randInt(rand, 1, 7);
  const b = randInt(rand, 1, 9 - a);
  return {
    key: `${a}:${b}`,
    prompt: "그림을 보고 덧셈을 하세요.",
    visual: frameScene([...Array(a).fill("●"), ...Array(b).fill("○")], `● ${a}개와 ○ ${b}개`),
    expression: `${a} + ${b} = □`,
    answer: a + b,
    hint: "●와 ○를 모두 세어 보세요.",
    explanation: `${a} + ${b} = ${a + b}`,
  };
});
/**
 * 중: 상황에 맞는 덧셈식 고르기. 오답은 계산이 틀린 식만 쓴다(계산이 맞는 뺄셈식 9 − 6 = 3은 상황과도 맞게 읽힌다).
 * 3단원이라 보기의 수도 모두 9 이하(합이 9이면 '= 10' 대신 '= 합 − 2')
 */
export const addStoryPick = gen("l1-add-story", 2, (rand) => {
  const a = randInt(rand, 2, 6);
  const b = randInt(rand, 1, 9 - a);
  const s = a + b;
  const name = pick(rand, NAMES);
  const answer = `${a} + ${b} = ${s}`;
  const choices = four(rand, answer, shuffle(rand, [`${a} + ${b} = ${s < 9 ? s + 1 : s - 2}`, `${a} + ${b} = ${s - 1}`, `${s} − ${b} = ${a + 1}`]));
  if (!choices) return null;
  return {
    key: `${a}:${b}:${name}:${choices.join()}`,
    prompt: `${name}는 딸기 ${a}개를 먹고, ${b}개를 더 먹었습니다. 먹은 딸기는 모두 몇 개인지 구하는 알맞은 식을 고르세요.`,
    answer,
    choices,
    hint: "더 먹었으니 모두 몇 개 먹었는지 덧셈으로 나타내요.",
    explanation: `${a} + ${b} = ${a + b}`,
  };
});
export const cardAdd = gen("l1-w-card-add", 3, (rand) => {
  const cards = distinct(rand, 0, 6, 4);
  const big = rand() < 0.5;
  const s = [...cards].sort((a, b) => a - b);
  const [x, y] = big ? [s[3], s[2]] : [s[0], s[1]];
  if (x + y > 9) return null;
  return {
    key: `${cards.join()}:${big}`,
    prompt: `수 카드 ${cards.join(", ")} 중에서 두 장을 골라 덧셈식을 만들려고 합니다. 합이 가장 ${big ? "클" : "작을"} 때의 합은 얼마인가요?`,
    answer: x + y,
    hint: `가장 ${big ? "큰" : "작은"} 수 두 개를 골라 더해요.`,
    explanation: `${x} + ${y} = ${x + y}`,
  };
});
/**
 * 상(1-1 덧셈 차시): 두 사람이 가진 구슬 수가 같을 때 모르는 한 묶음 구하기 — 두 수를 모으기(1단계) → □ 구하기(2단계).
 * 모든 수와 합은 9 이하
 */
export const sameTotal9 = gen("l1-w-same-total9", 3, (rand) => {
  const s = randInt(rand, 4, 9);
  const a = randInt(rand, 1, s - 1);
  const c = randInt(rand, 1, s - 1);
  if (c === a || c === s - a) return null;
  const [p, q] = shuffle(rand, NAMES).slice(0, 2);
  return {
    key: `${s}:${a}:${c}:${p}`,
    prompt: `${p}는 빨간 구슬 ${a}개와 파란 구슬 ${s - a}개를 가지고 있습니다. ${q}는 빨간 구슬 ${c}개와 파란 구슬 몇 개를 가지고 있습니다. 두 사람이 가진 구슬의 수가 같다면 ${q}가 가진 파란 구슬은 몇 개인가요?`,
    answer: s - c,
    unit: "개",
    hint: `먼저 ${p}가 가진 구슬이 모두 몇 개인지 구해요.`,
    explanation: `${p}: ${a} + ${s - a} = ${s}(개), ${q}: ${c} + ${s - c} = ${s}(개) → ${s - c}개`,
    mistakes: { [s]: `${p}의 구슬 수만 구했어요.`, [s - a]: `${p}의 파란 구슬 수를 썼어요.` },
  };
});

export const subPic = gen("l1-sub-pic", 1, (rand) => {
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, 1, a - 1);
  return {
    key: `${a}:${b}`,
    prompt: `${a}개 중에서 × 표시한 ${b}개를 빼면 몇 개가 남나요?`,
    visual: frameScene([...Array(a - b).fill("●"), ...Array(b).fill("×")], `${a}개 중 ${b}개에 ×`),
    expression: `${a} − ${b} = □`,
    answer: a - b,
    hint: "× 표시가 없는 것만 세어요.",
    explanation: `${a} − ${b} = ${a - b}`,
  };
});
export const subCompare = gen("l1-sub-compare", 2, (rand) => {
  const a = randInt(rand, 3, 9);
  const b = randInt(rand, 1, a - 1);
  return {
    key: `${a}:${b}`,
    prompt: "●는 ▲보다 몇 개 더 많은가요? 뺄셈식으로 구하세요.",
    visual: twoRowsScene(a, b),
    expression: `${a} − ${b} = □`,
    answer: a - b,
    hint: "하나씩 짝을 짓고 남는 것을 세어요.",
    explanation: `${a} − ${b} = ${a - b}`,
    mistakes: { [a + b]: "빼야 하는데 더했어요." },
  };
});
/**
 * 중: 상황에 맞는 뺄셈식 고르기. 오답은 계산이 틀렸거나(7 − 4 = 4) 연산이 반대인 식(합이 9 이하일 때만 7 + 2 = 9)만 쓴다.
 * 합이 9를 넘으면 연산이 반대인 식 대신 계산이 2만큼 틀린 뺄셈식을 쓴다.
 * 계산이 맞는 덧셈식(4 + 3 = 7)은 '준 것과 남은 것을 모으면 처음'이라 상황과도 맞으므로 넣지 않는다. 보기의 수는 모두 0~9
 */
export const subStoryPick = gen("l1-sub-story", 2, (rand) => {
  const a = randInt(rand, 4, 9);
  const b = randInt(rand, 1, a - 1);
  const name = pick(rand, NAMES);
  const answer = `${a} − ${b} = ${a - b}`;
  const third = a + b <= 9 ? `${a} + ${b} = ${a + b}` : a - b + 2 <= 9 ? `${a} − ${b} = ${a - b + 2}` : `${a} − ${b} = ${a - b - 2}`;
  const choices = four(rand, answer, shuffle(rand, [`${a} − ${b} = ${a - b + 1}`, `${a} − ${b} = ${a - b - 1}`, third]));
  if (!choices) return null;
  return {
    key: `${a}:${b}:${name}:${choices.join()}`,
    prompt: `${name}는 풍선 ${a}개 중에서 ${b}개를 친구에게 주었습니다. 남은 풍선의 수를 구하는 알맞은 식을 고르세요.`,
    answer,
    choices,
    hint: "주고 남은 것은 뺄셈으로 구해요.",
    explanation: answer,
  };
});
export const reverseSub9 = gen("l1-w-reverse-sub9", 3, (rand) => {
  const a = randInt(rand, 1, 5);
  const b = randInt(rand, 1, 9 - a);
  const name = pick(rand, NAMES);
  return {
    key: `${a}:${b}:${name}`,
    prompt: `${name}는 쿠키를 몇 개 가지고 있었습니다. 그중에서 ${a}개를 먹었더니 ${b}개가 남았습니다. 처음에 가지고 있던 쿠키는 몇 개인가요?`,
    answer: a + b,
    unit: "개",
    hint: "먹은 것과 남은 것을 모으면 처음 수가 돼요.",
    explanation: `${a} + ${b} = ${a + b}(개)`,
    mistakes: { [Math.abs(b - a)]: "처음 수를 구할 때는 더해야 해요." },
  };
});

export const zeroCalc = gen("l1-zero-calc", 1, (rand) => {
  const a = randInt(rand, 1, 9);
  const kind = randInt(rand, 0, 3);
  const [expr, ans] = [
    [`${a} + 0`, a],
    [`0 + ${a}`, a],
    [`${a} − 0`, a],
    [`${a} − ${a}`, 0],
  ][kind] as [string, number];
  return { key: `${a}:${kind}`, prompt: "계산해 보세요.", expression: `${expr} = □`, answer: ans, hint: "0을 더하거나 빼면 그대로예요. 같은 수를 빼면 0이에요.", explanation: `${expr} = ${ans}` };
});
export const calcBiggest9 = gen("l1-calc-biggest9", 2, (rand) => {
  const exprs = new Map<number, string>();
  for (let i = 0; exprs.size < 4 && i < 40; i++) {
    const add = rand() < 0.5;
    const a = randInt(rand, 1, 8);
    const b = add ? randInt(rand, 0, 9 - a) : randInt(rand, 0, a);
    const v = add ? a + b : a - b;
    if (!exprs.has(v)) exprs.set(v, `${a} ${add ? "+" : "−"} ${b}`);
  }
  if (exprs.size < 4) return null;
  const big = rand() < 0.5;
  const vals = [...exprs.keys()];
  const t = big ? Math.max(...vals) : Math.min(...vals);
  const answer = exprs.get(t)!;
  return { key: `${[...exprs.values()].join()}:${big}`, prompt: `계산 결과가 가장 ${big ? "큰" : "작은"} 것을 고르세요.`, answer, choices: shuffle(rand, [...exprs.values()]), hint: "하나씩 계산해 보세요.", explanation: [...exprs.entries()].map(([v, e]) => `${e} = ${v}`).join(", ") };
});
export const factFamily9 = gen("l1-fact-family9", 2, (rand) => {
  const a = randInt(rand, 1, 8);
  const b = randInt(rand, 1, 9 - a);
  const first = rand() < 0.5;
  return {
    key: `${a}:${b}:${first}`,
    prompt: `덧셈식 ${a} + ${b} = ${josa(a + b, "을/를")} 보고 뺄셈식을 만들었습니다. □ 안에 알맞은 수를 써넣으세요.`,
    expression: first ? `${a + b} − □ = ${b}` : `${a + b} − □ = ${a}`,
    answer: first ? a : b,
    hint: "전체에서 한 부분을 빼면 다른 부분이 남아요.",
    explanation: first ? `${a + b} − ${a} = ${b}` : `${a + b} − ${b} = ${a}`,
  };
});
export const canBeAdd9 = gen("l1-w-can-be-add9", 3, (rand) => {
  const a = randInt(rand, 1, 5);
  const b = randInt(rand, a + 2, 9);
  return {
    key: `${a}:${b}`,
    prompt: `${a} + □의 값은 ${b}보다 작습니다. □ 안에 들어갈 수 있는 수는 모두 몇 개인가요? (0도 들어갈 수 있습니다.)`,
    answer: b - a,
    unit: "개",
    hint: `□에 0, 1, 2, …를 차례로 넣어 ${a} + □가 ${b}보다 작은지 확인해요.`,
    explanation: `${range(0, b - a - 1).join(", ")} → ${b - a}개`,
    mistakes: { [b - a - 1]: "0을 빠뜨렸어요.", [b - a + 1]: `${a} + □ = ${b}인 경우도 셌어요.` },
  };
});
export const cardsDiff9 = gen("l1-w-cards-diff9", 3, (rand) => {
  const cards = distinct(rand, 0, 9, 4);
  const s = [...cards].sort((a, b) => a - b);
  return {
    key: cards.join(),
    prompt: `수 카드 ${cards.join(", ")} 중에서 두 장을 골라 뺄셈식을 만들려고 합니다. 차가 가장 크게 되도록 할 때 차는 얼마인가요?`,
    answer: s[3] - s[0],
    hint: "가장 큰 수에서 가장 작은 수를 빼요.",
    explanation: `${s[3]} − ${s[0]} = ${s[3] - s[0]}`,
  };
});

export const as9 = {
  gather9: ex(U3, "split", "e1-gather9"),
  splitBag: ex(U3, "split", "w1-split-bag"),
  missing9: ex(U3, "addsub9", "m1-missing9"),
  eatBuy9: ex(U3, "addsub9", "w1-eat-buy9"),
};

/* ════════ 1-1 4단원 비교하기 ════════ */

const U4 = "g1-s1-compare";

export const lengthCells = gen("l1-length-cells", 2, (rand) => {
  // 4단원은 10 이상의 수를 배우기 전이라 칸 수도 9 이하
  const [a, b] = distinct(rand, 2, 9, 2);
  const [L, S] = a > b ? ["가", "나"] : ["나", "가"];
  // "나는 가보다"의 '나'를 대명사로 읽지 않게 '막대 나'라고 쓴다
  return { key: `${a}:${b}`, prompt: `막대 ${L}는 막대 ${S}보다 몇 칸 더 긴가요?`, visual: cellBarsScene([a, b]), answer: Math.abs(a - b), unit: "칸", hint: "두 막대의 칸 수를 각각 세어 보세요.", explanation: `가 ${a}칸, 나 ${b}칸 → ${Math.abs(a - b)}칸 더 길어요.` };
});
/** 하: 한쪽 끝을 맞추지 않은 막대 — 칸을 세어 비교 */
export const lengthEnds = gen("l1-length-ends", 1, (rand) => {
  const lens = distinct(rand, 3, 9, 4);
  const starts = lens.map((l) => randInt(rand, 0, 10 - l));
  const long = rand() < 0.5;
  const t = long ? Math.max(...lens) : Math.min(...lens);
  const answer = ["가", "나", "다", "라"][lens.indexOf(t)];
  return {
    key: `${lens.join()}:${starts.join()}:${long}`,
    prompt: `막대의 왼쪽 끝이 맞추어져 있지 않습니다. 가장 ${long ? "긴" : "짧은"} 막대를 고르세요.`,
    visual: offsetBarsScene(lens.map((l, i) => [starts[i], l] as [number, number])),
    answer,
    choices: ["가", "나", "다", "라"],
    hint: "끝이 맞추어져 있지 않으면 오른쪽 끝만 보고 비교할 수 없어요. 막대의 칸 수를 세어 보세요.",
    explanation: lens.map((l, i) => `${["가", "나", "다", "라"][i]} ${l}칸`).join(", ") + ` → ${answer}`,
  };
});
export const tallOrder = gen("l1-w-tall-order", 3, (rand) => {
  const n = shuffle(rand, NAMES).slice(0, 4); // n[0] < n[1] < n[2] < n[3]
  const tall = rand() < 0.5;
  const facts = shuffle(rand, [`${n[1]}는 ${n[0]}보다 키가 큽니다`, `${n[2]}는 ${n[1]}보다 키가 큽니다`, `${n[3]}는 ${n[2]}보다 키가 큽니다`]);
  return {
    key: `${n.join()}:${tall}:${facts.join()}`,
    prompt: `${facts.join(". ")}. 키가 가장 ${tall ? "큰" : "작은"} 사람은 누구인가요?`,
    answer: tall ? n[3] : n[0],
    choices: shuffle(rand, n),
    hint: "두 사람씩 비교한 것을 이어서 키 순서대로 늘어놓아 보세요.",
    explanation: `키가 작은 순서: ${n.join(", ")}`,
  };
});

/** 시소에 올릴 수 있는 동물(가벼운 → 무거운): 그림의 시소가 상식과 맞게 기운다 */
const ANIMALS = ["생쥐", "다람쥐", "토끼", "강아지", "돼지", "곰"];
export const heaviest = gen("l1-heaviest", 1, (rand) => {
  const [i, j] = distinct(rand, 0, ANIMALS.length - 1, 2);
  const heavy = rand() < 0.5;
  const [L, R] = [ANIMALS[i], ANIMALS[j]];
  const answer = heavy === i > j ? L : R;
  return {
    key: `${i}:${j}:${heavy}`,
    prompt: `${josa(L, "과/와")} ${josa(R, "이/가")} 시소를 탔습니다. 더 ${heavy ? "무거운" : "가벼운"} 동물을 고르세요.`,
    visual: seesawsScene([{ left: L, right: R, tilt: i > j ? "left" : "right" }], `시소 왼쪽 ${L}, 오른쪽 ${R}`),
    answer,
    choices: [L, R, "무게가 같아요", "알 수 없어요"],
    hint: "시소는 무거운 쪽이 아래로 내려가요.",
    explanation: `${josa(i > j ? L : R, "이/가")} 앉은 쪽이 내려갔으므로 ${josa(i > j ? L : R, "이/가")} 더 무거워요.`,
  };
});
export const seesawChain = gen("l1-seesaw-chain", 2, (rand) => {
  const [a, b, c] = shuffle(rand, ["가", "나", "다"]); // 무게: a < b < c
  const heavy = rand() < 0.5;
  const flip1 = rand() < 0.5;
  const flip2 = rand() < 0.5;
  return {
    key: `${a}${b}${c}:${heavy}:${flip1}:${flip2}`,
    prompt: `물건 가, 나, 다를 두 개씩 시소에 올려 무게를 비교했습니다. 가장 ${heavy ? "무거운" : "가벼운"} 것을 고르세요.`,
    visual: seesawsScene(
      [
        flip1 ? { left: b, right: a, tilt: "left" } : { left: a, right: b, tilt: "right" },
        flip2 ? { left: c, right: b, tilt: "left" } : { left: b, right: c, tilt: "right" },
      ],
      "시소 두 개",
    ),
    answer: heavy ? c : a,
    choices: ["가", "나", "다", "알 수 없어요"],
    hint: "시소는 무거운 쪽이 아래로 내려가요. 두 시소에 모두 나온 물건을 기준으로 비교해요.",
    explanation: `${a}보다 ${josa(b, "이/가")} 무겁고, ${b}보다 ${josa(c, "이/가")} 무거워요. 가장 ${heavy ? "무거운" : "가벼운"} 것은 ${heavy ? c : a}`,
  };
});
export const weightMarbles = gen("l1-weight-marbles", 2, (rand) => {
  const [a, b] = distinct(rand, 2, 9, 2);
  const [p, q] = shuffle(rand, ["필통", "공책", "컵", "인형"]).slice(0, 2);
  const [H, L] = a > b ? [p, q] : [q, p];
  return {
    key: `${a}:${b}:${p}:${q}`,
    prompt: `${josa(p, "과/와")} ${josa(q, "을/를")} 각각 같은 구슬과 함께 시소에 올렸더니 그림과 같이 수평이 되었습니다. ${josa(H, "은/는")} ${L}보다 구슬 몇 개만큼 더 무겁나요?`,
    visual: balanceMarblesScene([{ name: p, n: a }, { name: q, n: b }]),
    answer: Math.abs(a - b),
    unit: "개",
    hint: "같은 구슬로 쟀으니 구슬 수가 많을수록 무거워요. 구슬을 세어 비교해요.",
    explanation: `${p}: 구슬 ${a}개, ${q}: 구슬 ${b}개 → ${Math.max(a, b)} − ${Math.min(a, b)} = ${Math.abs(a - b)}(개)`,
  };
});
/** 상: 구슬로 잰 무게로 두 물건을 시소에 올렸을 때를 짐작하기 */
export const weightTrade = gen("l1-w-weight-guess", 3, (rand) => {
  const [a, b] = distinct(rand, 2, 8, 2);
  const flip = rand() < 0.5;
  const [L, R] = flip ? ["나", "가"] : ["가", "나"];
  const heavier = a > b ? "가" : "나";
  const answer = `${heavier} 쪽`;
  return {
    key: `${a}:${b}:${flip}`,
    prompt: `물건 가와 나를 각각 구슬과 함께 시소에 올렸더니 그림과 같이 수평이 되었습니다. 이번에는 시소 왼쪽에 ${L}, 오른쪽에 ${josa(R, "을/를")} 올리면 어느 쪽이 아래로 내려가나요?`,
    visual: balanceMarblesScene([{ name: "가", n: a }, { name: "나", n: b }]),
    answer,
    choices: ["가 쪽", "나 쪽", "수평이 돼요", "알 수 없어요"],
    hint: "구슬을 더 많이 올려야 수평이 된 물건이 더 무거워요. 시소는 무거운 쪽이 내려가요.",
    explanation: `가는 구슬 ${a}개, 나는 구슬 ${b}개와 무게가 같으므로 ${josa(heavier, "이/가")} 더 무거워요. → ${answer}이 내려가요.`,
    mistakes: { [`${heavier === "가" ? "나" : "가"} 쪽`]: "구슬이 적은 쪽이 더 가벼워요." },
  };
});
export const weightChain4 = gen("l1-w-weight-chain4", 3, (rand) => {
  const n = shuffle(rand, ["가방", "상자", "바구니", "주머니"]); // 가벼운 → 무거운
  const heavy = rand() < 0.5;
  const facts = shuffle(rand, [`${josa(n[1], "은/는")} ${n[0]}보다 무겁습니다`, `${josa(n[2], "은/는")} ${n[1]}보다 무겁습니다`, `${josa(n[3], "은/는")} ${n[2]}보다 무겁습니다`]);
  return {
    key: `${n.join()}:${heavy}:${facts.join()}`,
    prompt: `${facts.join(". ")}. 가장 ${heavy ? "무거운" : "가벼운"} 것은 무엇인가요?`,
    answer: heavy ? n[3] : n[0],
    choices: shuffle(rand, n),
    hint: "두 개씩 비교한 것을 이어서 순서대로 늘어놓아 보세요.",
    explanation: `가벼운 순서: ${n.join(", ")}`,
  };
});

export const areaDiff = gen("l1-area-diff", 2, (rand) => {
  // 4단원은 10 이상의 수를 배우기 전이라 칸 수도 9 이하
  const [a, b] = distinct(rand, 2, 9, 2);
  const [W, N] = a > b ? ["가", "나"] : ["나", "가"];
  return { key: `${a}:${b}`, prompt: `모양 ${W}는 모양 ${N}보다 몇 칸 더 넓은가요?`, visual: cellShapesScene([a, b]), answer: Math.abs(a - b), unit: "칸", hint: "칸의 수를 세어 비교해요.", explanation: `가 ${a}칸, 나 ${b}칸 → ${Math.abs(a - b)}칸` };
});
export const areaJoin = gen("l1-w-area-join", 3, (rand) => {
  const a = randInt(rand, 2, 5);
  const b = randInt(rand, 2, 9 - a);
  const c = randInt(rand, 2, 8);
  if (c === a + b) return null;
  const big = a + b > c;
  return {
    key: `${a}:${b}:${c}`,
    prompt: big ? "모양 가와 나를 겹치지 않게 이어 붙였습니다. 이어 붙인 모양은 모양 다보다 몇 칸 더 넓은가요?" : "모양 가와 나를 겹치지 않게 이어 붙였습니다. 모양 다는 이어 붙인 모양보다 몇 칸 더 넓은가요?",
    visual: cellShapesScene([a, b, c], ["가", "나", "다"]),
    answer: Math.abs(a + b - c),
    unit: "칸",
    hint: "이어 붙인 모양의 칸 수는 가와 나의 칸 수를 모은 것이에요.",
    explanation: `가 + 나 = ${a + b}칸, 다 = ${c}칸 → ${josa(big ? "이어 붙인 모양" : "다", "이/가")} ${Math.abs(a + b - c)}칸 더 넓어요.`,
  };
});

export const cupLevel = gen("l1-cup-level", 1, (rand) => {
  const lv = distinct(rand, 2, 9, 4);
  const most = rand() < 0.5;
  const t = most ? Math.max(...lv) : Math.min(...lv);
  return { key: `${lv.join()}:${most}`, prompt: `물이 가장 ${most ? "많이" : "적게"} 담긴 그릇을 고르세요.`, visual: cupsScene(lv), answer: MARKS[lv.indexOf(t)], choices: MARKS, hint: "그릇의 모양과 크기가 같으면 물의 높이를 비교해요.", explanation: `물의 높이가 가장 ${most ? "높은" : "낮은"} ${MARKS[lv.indexOf(t)]}` };
});
const SIZES: [number, number][] = [[18, 26], [26, 38], [34, 50], [42, 62], [50, 74]];
export const containerSize = gen("l1-container-size", 2, (rand) => {
  const idx = distinct(rand, 0, 4, 4);
  const most = rand() < 0.5;
  const t = most ? Math.max(...idx) : Math.min(...idx);
  return { key: `${idx.join()}:${most}`, prompt: `담을 수 있는 양이 가장 ${most ? "많은" : "적은"} 그릇을 고르세요.`, visual: containersScene(idx.map((i) => SIZES[i])), answer: MARKS[idx.indexOf(t)], choices: MARKS, hint: "그릇의 크기를 비교해요. 클수록 많이 담을 수 있어요.", explanation: `가장 ${most ? "큰" : "작은"} 그릇 ${MARKS[idx.indexOf(t)]}` };
});
export const cupCount = gen("l1-cup-count", 2, (rand) => {
  const [a, b] = distinct(rand, 2, 9, 2);
  const [M, L] = a > b ? ["가", "나"] : ["나", "가"];
  return { key: `${a}:${b}`, prompt: `가 그릇과 나 그릇에 같은 컵으로 물을 부어 가득 채웠습니다. 그림은 부은 컵의 수입니다. ${M} 그릇은 ${L} 그릇보다 컵으로 몇 번만큼 더 많이 담을 수 있나요?`, visual: cupsPouredScene(a, b), answer: Math.abs(a - b), unit: "번", hint: "같은 컵이면 부은 횟수가 많을수록 많이 담을 수 있어요.", explanation: `${Math.max(a, b)} − ${Math.min(a, b)} = ${Math.abs(a - b)}(번)` };
});
export const cupCompare = gen("l1-w-cup-compare", 3, (rand) => {
  const names = shuffle(rand, NAMES).slice(0, 3);
  const nums = distinct(rand, 2, 9, 3);
  const mx = Math.max(...nums);
  const mn = Math.min(...nums);
  return {
    key: `${names.join()}:${nums.join()}`,
    prompt: `${names.map((n, i) => `${n}의 물병은 컵으로 ${nums[i]}번`).join(", ")}을 부어야 가득 찹니다. 가장 많이 담을 수 있는 물병은 가장 적게 담을 수 있는 물병보다 컵으로 몇 번만큼 더 담을 수 있나요?`,
    answer: mx - mn,
    unit: "번",
    hint: "가장 큰 수와 가장 작은 수를 찾아 빼요.",
    explanation: `${mx} − ${mn} = ${mx - mn}(번)`,
  };
});
export const pourReverse = gen("l1-w-pour-reverse", 3, (rand) => {
  const a = randInt(rand, 1, 5);
  const b = randInt(rand, 1, 9 - a);
  const name = pick(rand, NAMES);
  return {
    key: `${a}:${b}:${name}`,
    prompt: `${name}가 물통에서 컵으로 물을 ${a}번 떠냈더니 물통에 컵으로 ${b}번만큼의 물이 남았습니다. 처음 물통에 있던 물은 컵으로 몇 번만큼인가요?`,
    answer: a + b,
    unit: "번",
    hint: "떠낸 물과 남은 물을 모으면 처음 물이에요.",
    explanation: `${a} + ${b} = ${a + b}(번)`,
    mistakes: { [Math.abs(b - a)]: "처음 양은 더해서 구해요." },
  };
});

export const cmp = {
  secondLongest: ex(U4, "length", "m1-second-longest"),
  longest: ex(U4, "length", "w1-longest"),
  countCells: ex(U4, "area", "e1-count-cells"),
  widest: ex(U4, "area", "w1-widest"),
};

/* ════════ 1-1 5단원 50까지의 수 ════════ */

const U5 = "g1-s1-numbers50";

export const tenFrame = gen("l1-ten-frame", 1, (rand) => {
  const n = randInt(rand, 5, 9);
  return { key: `${n}`, prompt: "10이 되려면 점을 몇 개 더 그려야 하나요?", visual: dotsScene(n), answer: 10 - n, unit: "개", hint: "10칸 틀의 빈칸을 세어 보세요.", explanation: `${wa(n)} ${josa(10 - n, "을/를")} 모으면 10` };
});
export const readTen = readNum("l1-read-ten", [10]);
export const tenSplit = gen("l1-ten-split", 2, (rand) => {
  const a = randInt(rand, 1, 9);
  const gather = rand() < 0.5;
  return {
    key: `${a}:${gather}`,
    prompt: gather ? `${wa(a)} □를 모으면 10이 됩니다. □ 안에 알맞은 수를 써넣으세요.` : `10은 ${wa(a)} □로 가를 수 있습니다. □ 안에 알맞은 수를 써넣으세요.`,
    answer: 10 - a,
    hint: "10칸 틀에서 빈칸의 수를 떠올려요.",
    explanation: `${wa(a)} ${eul(10 - a)} 모으면 10`,
  };
});
export const tenPairWrong = gen("l1-ten-pair-wrong", 2, (rand) => {
  const good = shuffle(rand, range(1, 9)).slice(0, 3).map((a) => `${wa(a)} ${10 - a}`);
  const w = randInt(rand, 1, 8);
  const d = pick(rand, [-1, 1]);
  const answer = `${wa(w)} ${Math.max(1, 10 - w + d)}`;
  if (w + Math.max(1, 10 - w + d) === 10) return null;
  const choices = four(rand, answer, good);
  if (!choices) return null;
  return { key: `${choices.join()}`, prompt: "모으기를 하여 10이 되지 않는 것을 고르세요.", answer, choices, hint: "10이 되는 짝: 1과 9, 2와 8, 3과 7, 4와 6, 5와 5", explanation: w + Math.max(1, 10 - w + d) < 10 ? `${answer} → ${w + Math.max(1, 10 - w + d)}` : `${answer} → 10보다 1만큼 더 큰 수` };
});
export const tenNeed = gen("l1-w-ten-need", 3, (rand) => {
  const a = randInt(rand, 1, 5);
  const b = randInt(rand, 1, 8 - a);
  const name = pick(rand, NAMES);
  return {
    key: `${a}:${b}:${name}`,
    prompt: `${name}는 구슬 10개로 팔찌를 만들려고 합니다. 빨간 구슬 ${a}개와 파란 구슬 ${b}개를 꿰었습니다. 구슬을 몇 개 더 꿰어야 하나요?`,
    answer: 10 - a - b,
    unit: "개",
    hint: "지금까지 꿴 구슬의 수를 먼저 구해요.",
    explanation: `${wa(a)} ${eul(b)} 모으면 ${a + b}, ${wa(a + b)} ${eul(10 - a - b)} 모으면 10`,
    mistakes: { [10 - a]: "파란 구슬을 빠뜨렸어요.", [10 - b]: "빨간 구슬을 빠뜨렸어요." },
  };
});
export const tenCards = gen("l1-w-ten-cards", 3, (rand) => {
  const cards = distinct(rand, 1, 9, 6);
  const pairs = [];
  for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) if (cards[i] + cards[j] === 10) pairs.push(`${wa(cards[i])} ${cards[j]}`);
  return {
    key: cards.join(),
    prompt: `수 카드 ${cards.join(", ")} 중에서 두 장을 골라 모으기를 하여 10을 만들려고 합니다. 10을 만들 수 있는 두 장의 짝은 모두 몇 가지인가요?`,
    answer: pairs.length,
    unit: "가지",
    hint: "1과 9, 2와 8, 3과 7, 4와 6이 모두 있는지 찾아요.",
    explanation: pairs.length ? `${pairs.join(", ")} → ${pairs.length}가지` : "없으므로 0가지",
  };
});

export const teenFrame = countDotsIn("l1-teen-frame", 11, 19);
export const readTeen = readNum("l1-read-teen", range(11, 19));
export const teenSplit = gen("l1-teen-split", 2, (rand) => {
  const n = randInt(rand, 11, 19);
  const rev = rand() < 0.5;
  return rev
    ? { key: `${n}:r`, prompt: `10개씩 묶음 1개와 낱개 ${n - 10}개는 얼마인가요?`, answer: n, hint: "10과 낱개를 모아요.", explanation: `10과 ${n - 10} → ${n}` }
    : { key: `${n}`, prompt: `${eun(n)} 10개씩 묶음 1개와 낱개 몇 개인가요?`, answer: n - 10, unit: "개", hint: "앞의 숫자 1은 10개씩 묶음의 수, 뒤의 숫자가 낱개의 수예요.", explanation: `${n} = 10 + ${n - 10}` };
});
export const teenMoreLess = gen("l1-teen-more-less", 2, (rand) => {
  const n = randInt(rand, 11, 18);
  const more = rand() < 0.5;
  return { key: `${n}:${more}`, prompt: `${n}보다 1만큼 더 ${more ? "큰" : "작은"} 수는 무엇인가요?`, answer: more ? n + 1 : n - 1, hint: "수를 순서대로 세어 보세요.", explanation: `${n - 1}, ${n}, ${n + 1}` };
});
export const teenPack = gen("l1-w-teen-pack", 3, (rand) => {
  const a = randInt(rand, 1, 5);
  const b = randInt(rand, 1, 9 - a);
  return {
    key: `${a}:${b}`,
    prompt: `달걀이 10개씩 1판과 낱개 ${a}개 있습니다. 낱개로 ${b}개를 더 샀다면 달걀은 모두 몇 개인가요?`,
    answer: 10 + a + b,
    unit: "개",
    hint: "낱개끼리 먼저 모아요.",
    explanation: `낱개 ${a + b}개, 10개씩 1판 → ${10 + a + b}(개)`,
    mistakes: { [a + b]: "10개씩 1판을 빠뜨렸어요." },
  };
});
export const teenCond = gen("l1-w-teen-cond", 3, (rand) => {
  const lo = randInt(rand, 3, 6);
  const drop = pick(rand, [lo + 1, lo + 2]);
  const ans = 10 + (drop === lo + 1 ? lo + 2 : lo + 1);
  return {
    key: `${lo}:${drop}`,
    prompt: `다음을 모두 만족하는 수를 구하세요.\n· 10개씩 묶음 1개와 낱개 몇 개인 수입니다.\n· 낱개의 수는 ${lo}보다 크고 ${lo + 3}보다 작습니다.\n· ${10 + drop}${batchim(drop) ? "이" : "가"} 아닙니다.`,
    answer: ans,
    hint: "낱개의 수가 될 수 있는 것을 먼저 찾아요.",
    explanation: `${10 + lo + 1}, ${10 + lo + 2} 중 ${10 + drop}${batchim(drop) ? "이" : "가"} 아닌 수 → ${ans}`,
  };
});

export const gather19 = gen("l1-gather19", 1, (rand) => {
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, 11 - a, 9);
  return { key: `${a}:${b}`, prompt: `${wa(a)} ${eul(b)} 모으면 얼마인가요?`, visual: frameScene([...Array(a).fill("●"), ...Array(b).fill("○")], `● ${a}개와 ○ ${b}개`), answer: a + b, hint: "먼저 10칸 틀을 채우고 남은 것을 세어요.", explanation: `${wa(a)} ${eul(b)} 모으면 ${a + b}` };
});
export const split19 = gen("l1-split19", 2, (rand) => {
  const n = randInt(rand, 11, 18);
  const a = randInt(rand, n - 9, 9);
  return { key: `${n}:${a}`, prompt: `${eun(n)} ${wa(a)} □로 가를 수 있습니다. □ 안에 알맞은 수를 써넣으세요.`, answer: n - a, hint: `${a}에서 ${n}까지 이어 세어 보세요.`, explanation: `${wa(a)} ${josa(n - a, "을/를")} 모으면 ${n}` };
});
export const split19Wrong = gen("l1-split19-wrong", 2, (rand) => {
  const n = randInt(rand, 12, 17);
  const ok = range(n - 9, 9);
  const good = shuffle(rand, ok).slice(0, 3).map((a) => `${wa(a)} ${n - a}`);
  // 정답 짝도 두 수 모두 9 이하(혼자 10이 들어가면 그것만 보고 고를 수 있다)
  const w = pick(rand, ok);
  const other = n - w + pick(rand, [1, -1]);
  if (other < 1 || other > 9) return null;
  const answer = `${wa(w)} ${other}`;
  const choices = four(rand, answer, good);
  if (!choices) return null;
  return { key: `${n}:${choices.join()}`, prompt: `모으기를 하여 ${eul(n)} 만들 수 없는 것을 고르세요.`, answer, choices, hint: "두 수를 모아 보세요.", explanation: `${answer} → ${w + other}` };
});
export const share19 = gen("l1-w-share19", 3, (rand) => {
  const [p, q] = shuffle(rand, NAMES).slice(0, 2);
  const small = randInt(rand, 3, 7);
  const k = pick(rand, [1, 2, 3, 4]);
  const n = small * 2 + k;
  if (n < 11 || n > 19) return null;
  return {
    key: `${n}:${k}:${p}`,
    prompt: `색종이 ${n}장을 ${p}와 ${q}가 나누어 가졌습니다. ${p}가 ${q}보다 ${k}장 더 많이 가졌다면 ${q}가 가진 색종이는 몇 장인가요?`,
    answer: small,
    unit: "장",
    hint: `${josa(n, "을/를")} 두 수로 가르고, 두 수의 차이가 ${k}인 것을 찾아요.`,
    explanation: `${eun(n)} ${wa(small + k)} ${josa(small, "으로/로")} 가를 수 있어요. ${q}는 ${small}장`,
    mistakes: { [small + k]: `${p}가 가진 수를 썼어요.` },
  };
});
export const gather19Cards = gen("l1-w-gather19-cards", 3, (rand) => {
  const cards = distinct(rand, 2, 9, 4);
  const s = [...cards].sort((a, b) => a - b);
  const big = rand() < 0.5;
  const ans = big ? s[3] + s[2] : s[0] + s[1];
  return {
    key: `${cards.join()}:${big}`,
    prompt: `수 카드 ${cards.join(", ")} 중에서 두 장을 골라 모으기를 할 때, 모은 수가 가장 ${big ? "큰" : "작은"} 경우의 수는 얼마인가요?`,
    answer: ans,
    hint: `가장 ${big ? "큰" : "작은"} 두 수를 골라요.`,
    explanation: `${wa(big ? s[3] : s[0])} ${big ? s[2] : s[1]} → ${ans}`,
  };
});

export const tensModel50 = tensModel("l1-tens-model50", [2, 3, 4, 5]);
export const readTens50 = readNum("l1-read-tens50", [20, 30, 40, 50]);
export const tensRev50 = tensRev("l1-tens-rev50", [2, 3, 4, 5]);
export const tensSeq50 = gen("l1-tens-seq50", 2, (rand) => {
  const miss = randInt(rand, 1, 4);
  const down = rand() < 0.3;
  const seq = down ? [50, 40, 30, 20, 10] : [10, 20, 30, 40, 50];
  return { key: `${miss}:${down}`, prompt: "□ 안에 알맞은 수를 써넣으세요.", expression: seq.map((n, i) => (i === miss ? "□" : String(n))).join(", "), answer: seq[miss], hint: "10개씩 묶음이 하나씩 달라져요.", explanation: seq.join(", ") };
});
export const tensBoxes50 = tensBoxes("l1-w-tens-boxes50", 5);
export const tensError = gen("l1-w-tens-error", 3, (rand) => {
  const t = randInt(rand, 2, 5);
  const name = pick(rand, NAMES);
  const answer = `${t * 10}, ${native(t * 10)}`;
  return {
    key: `${t}:${name}`,
    prompt: `${name}는 10개씩 묶음 ${t}개를 "${t}, ${ONES_N[t]}"${josa(ONES_N[t], "이라고/라고").slice(ONES_N[t].length)} 읽었습니다. 바르게 쓰고 읽은 것을 고르세요.`,
    answer,
    // 1-1은 50까지: t = 5이면 이웃한 몇십을 40으로
    choices: shuffle(rand, [answer, `${t}, ${ONES_N[t]}`, `${t * 10}, ${ONES_N[t]}`, `${(t < 5 ? t + 1 : t - 1) * 10}, ${native((t < 5 ? t + 1 : t - 1) * 10)}`]),
    hint: "10개씩 묶음 1개는 10(열), 2개는 20(스물)이에요.",
    explanation: `10개씩 묶음 ${t}개는 ${t * 10}(${native(t * 10)}, ${sino(t * 10)})`,
  };
});

export const read50 = readNum("l1-read50", range(21, 49).filter((n) => n % 10));
export const tensOnesOver50 = tensOnesOver("l1-tens-ones-over50", 50);
export const cards50 = cardsTwoDigit("l1-w-cards50", [0, 1, 2, 3, 4]);

export const seq50 = seqBlank("l1-seq50", 10, 50);
export const seqBack50 = seqBlank("l1-seq-back50", 10, 50, 2, true);
export const between50 = betweenCount("l1-w-between50", 10, 50);
export const cond50 = gen("l1-w-cond50", 3, (rand) => {
  const t = randInt(rand, 1, 4);
  const d = pick(rand, [1, 2]);
  const plus = rand() < 0.5;
  const o = plus ? t + d : t - d;
  if (o < 1 || o > 9) return null;
  const ans = t * 10 + o;
  return {
    key: `${t}:${d}:${plus}`,
    prompt: `다음을 모두 만족하는 수를 구하세요.\n· ${t * 10}보다 크고 ${(t + 1) * 10}보다 작은 수입니다.\n· 낱개의 수는 10개씩 묶음의 수보다 ${d} ${plus ? "큽" : "작습"}니다.`,
    answer: ans,
    hint: "10개씩 묶음의 수를 먼저 정해요.",
    explanation: `10개씩 묶음 ${t}개, 낱개 ${o}개 → ${ans}`,
  };
});

export const bigger50 = biggerOfTwo("l1-bigger50", 10, 50);
export const orderNth50 = orderNth("l1-order-nth50", 10, 50);
export const countBigger50 = countBigger("l1-count-bigger50", 10, 50);
export const blank50 = blankDigit("l1-w-blank50", 1, 4);

export const n50 = {
  tensSplit50: ex(U5, "tens50", "m1-tens-split50"),
  tensGive: ex(U5, "tens50", "w1-tens-give"),
  mostCards: ex(U5, "compare50", "w1-most-cards"),
};
