import type { ShapeScene } from "../types";
import { pick, randInt, shuffle } from "../../lib/random";
import { josa, NAMES } from "./g2";
import { type Card, cardsScene, easy, mid, randomCard, row, word } from "./g2-pics";

/**
 * 2-1 5단원 분류하기: 모양·색깔(색칠)·크기·구멍의 수가 다른 카드와 단추 그림을 보고
 * 기준을 정하고, 분류하고, 세고, 결과를 말한다(단어 목록 대신 그림).
 */

const SHAPES = ["삼각형", "사각형", "원"] as const;
type Shape = (typeof SHAPES)[number];

/** n장의 카드(모양이 세 가지 모두 나오게) */
function cards(rand: () => number, n: number): Card[] {
  for (let t = 0; t < 30; t++) {
    const cs = Array.from({ length: n }, () => randomCard(rand));
    if (SHAPES.every((s) => cs.some((c) => c.shape === s)) && cs.some((c) => c.fill) && cs.some((c) => !c.fill)) return cs;
  }
  return Array.from({ length: n }, (_, i) => ({ shape: SHAPES[i % 3], fill: i % 2 === 0, big: i % 4 < 2 }));
}
const countOf = (cs: Card[], f: (c: Card) => boolean) => cs.filter(f).length;
const nums = (cs: Card[], f: (c: Card) => boolean) => cs.flatMap((c, i) => (f(c) ? [i + 1] : [])).join(", ");
const cardsPic = (cs: Card[]) => cardsScene(cs, `모양 카드 ${cs.length}장: ${cs.map((c, i) => `${i + 1} ${c.big ? "큰" : "작은"} ${c.fill ? "색칠한" : "흰"} ${c.shape}`).join(", ")}`);

/* ── 분류는 어떻게 할까요 ── */

const CRITERIA = ["모양", "색깔", "크기"] as const;
type Criterion = (typeof CRITERIA)[number];
const valueOf = (c: Card, k: Criterion) => (k === "모양" ? c.shape : k === "색깔" ? String(c.fill) : String(c.big));

/** 두 묶음이 어떤 기준으로 나뉘었는지(그 기준만 두 묶음을 가른다) */
export const criteriaWhich = easy("l2-criteria-which", (rand) => {
  const k = pick(rand, CRITERIA);
  const [a, b] = shuffle(rand, [...SHAPES]).slice(0, 2) as Shape[];
  const make = (side: 0 | 1): Card => {
    const c = randomCard(rand);
    if (k === "모양") c.shape = side ? b : a;
    if (k === "색깔") c.fill = side === 0;
    if (k === "크기") c.big = side === 0;
    return c;
  };
  const g1 = Array.from({ length: 3 }, () => make(0));
  const g2 = Array.from({ length: 3 }, () => make(1));
  // 다른 기준으로도 두 묶음이 똑같이 나뉘면 답이 둘이 된다
  const splits = (x: Criterion) => new Set(g1.map((c) => valueOf(c, x))).size === 1 && new Set(g2.map((c) => valueOf(c, x))).size === 1 && valueOf(g1[0], x) !== valueOf(g2[0], x);
  if (CRITERIA.filter(splits).length !== 1) return null;
  const choices = [...CRITERIA, "개수"];
  return {
    key: `${k}:${[...g1, ...g2].map((c) => valueOf(c, "모양") + c.fill + c.big).join()}`,
    prompt: "카드를 두 묶음으로 분류했습니다. 어떤 기준으로 분류했는지 고르세요.",
    visual: row([cardsScene(g1, "", 3), cardsScene(g2, "", 3, 4)], `분류한 두 묶음: 가 ${g1.map((c) => c.shape).join(", ")} / 나 ${g2.map((c) => c.shape).join(", ")}`, ["가", "나"], 30),
    choices,
    answer: k,
    hint: "한 묶음 안의 카드끼리 똑같은 점을 찾아보세요.",
    explanation: k === "모양" ? `가는 모두 ${a}, 나는 모두 ${b}이므로 모양에 따라 분류했어요.` : k === "색깔" ? "가는 모두 색칠한 카드, 나는 모두 색칠하지 않은 카드이므로 색깔에 따라 분류했어요." : "가는 모두 큰 카드, 나는 모두 작은 카드이므로 크기에 따라 분류했어요.",
  };
});

/** 정한 기준으로 볼 때 나머지와 다른 카드 하나 */
export const criteriaOddPic = mid("l2-criteria-odd-pic", (rand) => {
  const k = pick(rand, CRITERIA);
  const cs = Array.from({ length: 4 }, () => randomCard(rand));
  const odd = randInt(rand, 0, 3);
  const base = randomCard(rand);
  cs.forEach((c, i) => {
    if (k === "모양") c.shape = i === odd ? pick(rand, SHAPES.filter((s) => s !== base.shape)) : base.shape;
    if (k === "색깔") c.fill = i === odd ? !base.fill : base.fill;
    if (k === "크기") c.big = i === odd ? !base.big : base.big;
  });
  const choices = ["1번", "2번", "3번", "4번"];
  return {
    key: `${k}:${cs.map((c) => c.shape + c.fill + c.big).join()}`,
    prompt: `${josa(k, "을/를")} 기준으로 분류할 때 나머지와 다른 카드를 고르세요.`,
    visual: cardsPic(cs),
    choices,
    answer: choices[odd],
    hint: `다른 점은 생각하지 말고 ${k}만 살펴보세요.`,
    explanation: `${odd + 1}번만 ${josa(k === "모양" ? cs[odd].shape : k === "색깔" ? (cs[odd].fill ? "색칠한 카드" : "색칠하지 않은 카드") : cs[odd].big ? "큰 카드" : "작은 카드", "이에요/예요")}.`,
  };
});

/** 단추: 색칠 여부와 구멍 수 두 기준을 모두 만족하는 것 */
export const criteriaTwo = word("l2-criteria-two", (rand) => {
  const n = randInt(rand, 8, 10);
  const bs: Card[] = Array.from({ length: n }, () => ({ shape: pick(rand, ["원", "사각형"] as const), fill: rand() < 0.5, big: true, holes: pick(rand, [2, 4]) }));
  const f = rand() < 0.5;
  const h = pick(rand, [2, 4]);
  const ok = (c: Card) => c.fill === f && c.holes === h;
  const count = countOf(bs, ok);
  if (count === 0) return null;
  return {
    key: bs.map((c) => `${c.shape}${c.fill}${c.holes}`).join(),
    prompt: `단추를 색깔과 구멍의 수에 따라 분류하려고 합니다. ${f ? "색칠한" : "색칠하지 않은"} 단추 중에서 구멍이 ${h}개인 단추는 몇 개인가요?`,
    visual: cardsScene(bs, `단추 ${n}개: ${bs.map((c, i) => `${i + 1} ${c.fill ? "색칠한" : "흰"} ${c.shape} 구멍 ${c.holes}개`).join(", ")}`, 5),
    answer: count,
    unit: "개",
    hint: "먼저 색깔로 나누고, 그 안에서 다시 구멍의 수로 나누어요.",
    explanation: `${nums(bs, ok)}번 → ${count}개`,
    mistakes: { [countOf(bs, (c) => c.fill === f)]: `구멍의 수도 살펴봐야 해요.` },
  };
});

/* ── 기준에 따라 분류하기 ── */

export const classifyCount = easy("classify-count", (rand) => {
  const cs = cards(rand, randInt(rand, 8, 12));
  const t = pick(rand, SHAPES);
  const count = countOf(cs, (c) => c.shape === t);
  return {
    key: `${cs.map((c) => c.shape + c.fill + c.big).join()}:${t}`,
    prompt: `카드를 모양에 따라 분류했을 때 ${josa(t, "은/는")} 몇 장인가요?`,
    visual: cardsPic(cs),
    answer: count,
    unit: "장",
    hint: "색깔과 크기는 생각하지 말고 모양만 보고 세어요. 센 카드에 표시하면 빠뜨리지 않아요.",
    explanation: `${t}: ${nums(cs, (c) => c.shape === t)}번 → ${count}장`,
  };
});

export const sortShape = mid("l2-sort-shape", (rand) => {
  const cs = cards(rand, randInt(rand, 9, 12));
  const f = rand() < 0.5;
  const t = pick(rand, SHAPES);
  const ok = (c: Card) => c.fill === f && c.shape === t;
  const count = countOf(cs, ok);
  if (!count) return null;
  return {
    key: `${cs.map((c) => c.shape + c.fill + c.big).join()}:${f}:${t}`,
    prompt: `카드를 먼저 색깔에 따라 분류한 다음, ${f ? "색칠한" : "색칠하지 않은"} 카드를 다시 모양에 따라 분류하려고 합니다. ${f ? "색칠한" : "색칠하지 않은"} ${josa(t, "은/는")} 몇 장인가요?`,
    visual: cardsPic(cs),
    answer: count,
    unit: "장",
    hint: `먼저 ${f ? "색칠한" : "색칠하지 않은"} 카드만 찾은 뒤, 그중에서 ${josa(t, "을/를")} 세어요.`,
    explanation: `${nums(cs, ok)}번 → ${count}장`,
    mistakes: { [countOf(cs, (c) => c.shape === t)]: "색깔도 살펴봐야 해요." },
  };
});

/** 모양에 따라 나눈 세 묶음 중 잘못 들어간 카드 찾기 */
export const sortWrong = word("l2-sort-wrong", (rand) => {
  const sizes = [randInt(rand, 2, 3), randInt(rand, 2, 3), randInt(rand, 2, 3)];
  const groups: Card[][] = SHAPES.map((s, g) => Array.from({ length: sizes[g] }, () => ({ ...randomCard(rand), shape: s })));
  const g = randInt(rand, 0, 2);
  const k = randInt(rand, 0, sizes[g] - 1);
  groups[g][k] = { ...groups[g][k], shape: pick(rand, SHAPES.filter((s) => s !== SHAPES[g])) };
  const starts = [1, 1 + sizes[0], 1 + sizes[0] + sizes[1]];
  const wrong = starts[g] + k;
  const scenes: ShapeScene[] = groups.map((cs, i) => cardsScene(cs, "", 2, starts[i]));
  return {
    key: groups.map((cs) => cs.map((c) => c.shape + c.fill + c.big).join()).join("|"),
    prompt: "카드를 모양에 따라 삼각형, 사각형, 원으로 분류했습니다. 잘못 분류한 카드는 몇 번인가요?",
    visual: row(scenes, `모양에 따라 나눈 세 묶음: ${groups.map((cs, i) => `${SHAPES[i]} 묶음 ${cs.map((c, j) => `${starts[i] + j}번 ${c.shape}`).join(", ")}`).join(" / ")}`, ["삼각형", "사각형", "원"], 26),
    answer: wrong,
    unit: "번",
    hint: "묶음마다 이름과 다른 모양이 섞여 있는지 확인해요. 색깔과 크기는 상관없어요.",
    explanation: `${wrong}번은 ${groups[g][k].shape}인데 ${SHAPES[g]} 묶음에 들어가 있어요.`,
  };
});

/* ── 분류하고 세어 보기 ── */

export const countList = easy("l2-count-list", (rand) => {
  const cs = cards(rand, randInt(rand, 8, 12));
  const k = pick(rand, ["색칠한", "색칠하지 않은", "큰", "작은"] as const);
  const ok = (c: Card) => (k === "색칠한" ? c.fill : k === "색칠하지 않은" ? !c.fill : k === "큰" ? c.big : !c.big);
  const count = countOf(cs, ok);
  if (!count) return null;
  return {
    key: `${cs.map((c) => c.shape + c.fill + c.big).join()}:${k}`,
    prompt: `카드를 ${k === "색칠한" || k === "색칠하지 않은" ? "색깔" : "크기"}에 따라 분류하여 세어 보려고 합니다. ${k} 카드는 몇 장인가요?`,
    visual: cardsPic(cs),
    answer: count,
    unit: "장",
    hint: "센 카드에 /로 표시하며 하나씩 세면 빠뜨리거나 두 번 세지 않아요.",
    explanation: `${nums(cs, ok)}번 → ${count}장`,
  };
});

export const countTwo = mid("l2-count-two", (rand) => {
  const cs = cards(rand, randInt(rand, 9, 12));
  const [a, b] = shuffle(rand, [...SHAPES]);
  const ca = countOf(cs, (c) => c.shape === a);
  const cb = countOf(cs, (c) => c.shape === b);
  return {
    key: `${cs.map((c) => c.shape + c.fill + c.big).join()}:${a}:${b}`,
    prompt: `카드를 모양에 따라 분류하여 세었습니다. ${josa(a, "과/와")} ${josa(b, "은/는")} 모두 몇 장인가요?`,
    visual: cardsPic(cs),
    answer: ca + cb,
    unit: "장",
    hint: "두 모양을 각각 센 뒤 더해요.",
    explanation: `${a} ${ca}장 + ${b} ${cb}장 = ${ca + cb}장`,
  };
});

export const countDiff = mid("l2-count-diff", (rand) => {
  const cs = cards(rand, randInt(rand, 10, 12));
  const [a, b] = shuffle(rand, [...SHAPES]);
  const ca = countOf(cs, (c) => c.shape === a);
  const cb = countOf(cs, (c) => c.shape === b);
  if (ca <= cb) return null;
  return {
    key: `${cs.map((c) => c.shape + c.fill + c.big).join()}:${a}:${b}`,
    prompt: `카드를 모양에 따라 분류하여 세었습니다. ${josa(a, "은/는")} ${b}보다 몇 장 더 많나요?`,
    visual: cardsPic(cs),
    answer: ca - cb,
    unit: "장",
    hint: "두 모양을 각각 센 뒤 차를 구해요.",
    explanation: `${a} ${ca}장, ${b} ${cb}장 → ${ca} − ${cb} = ${ca - cb}(장)`,
  };
});

/* ── 분류한 결과 말하기 ── */

export const resultMost = easy("l2-result-most", (rand) => {
  const cs = cards(rand, randInt(rand, 9, 12));
  const counts = SHAPES.map((s) => countOf(cs, (c) => c.shape === s));
  const big = rand() < 0.5;
  const t = big ? Math.max(...counts) : Math.min(...counts);
  if (counts.filter((c) => c === t).length > 1) return null;
  return {
    key: `${cs.map((c) => c.shape + c.fill + c.big).join()}:${big}`,
    prompt: `카드를 모양에 따라 분류하여 세었습니다. 가장 ${big ? "많은" : "적은"} 모양을 고르세요.`,
    visual: cardsPic(cs),
    choices: [...SHAPES, "세 모양의 수가 모두 같아요."],
    answer: SHAPES[counts.indexOf(t)],
    hint: "모양마다 세어 수를 비교해요.",
    explanation: SHAPES.map((s, i) => `${s} ${counts[i]}장`).join(", "),
  };
});

export const resultMore = mid("l2-result-more", (rand) => {
  const n = randInt(rand, 8, 10);
  const bs: Card[] = Array.from({ length: n }, () => ({ shape: pick(rand, ["원", "사각형"] as const), fill: rand() < 0.5, big: true, holes: pick(rand, [2, 4]) }));
  const c2 = countOf(bs, (c) => c.holes === 2);
  const c4 = n - c2;
  if (c2 === c4) return null;
  const more = c2 > c4 ? 2 : 4;
  return {
    key: bs.map((c) => `${c.shape}${c.fill}${c.holes}`).join(),
    prompt: "단추를 구멍의 수에 따라 분류했습니다. 구멍이 2개인 단추와 4개인 단추 중 더 많은 쪽은 몇 개 더 많나요?",
    visual: cardsScene(bs, `단추 ${n}개: ${bs.map((c, i) => `${i + 1} 구멍 ${c.holes}개`).join(", ")}`, 5),
    answer: Math.abs(c2 - c4),
    unit: "개",
    hint: "구멍이 2개인 단추와 4개인 단추를 각각 세어 비교해요.",
    explanation: `구멍 2개 ${c2}개, 구멍 4개 ${c4}개 → 구멍이 ${more}개인 단추가 ${Math.abs(c2 - c4)}개 더 많아요.`,
  };
});

export const resultNeed = word("l2-result-need", (rand) => {
  const cs = cards(rand, randInt(rand, 9, 12));
  const counts = SHAPES.map((s) => countOf(cs, (c) => c.shape === s));
  const goal = Math.max(...counts) + randInt(rand, 0, 1);
  const need = counts.reduce((s, v) => s + goal - v, 0);
  const name = pick(rand, NAMES);
  if (!need) return null;
  return {
    key: `${cs.map((c) => c.shape + c.fill + c.big).join()}:${goal}`,
    prompt: `${josa(name, "은/는")} 카드를 모양에 따라 분류했습니다. 모양마다 카드가 ${goal}장씩 되게 하려면 카드를 모두 몇 장 더 만들어야 하나요?`,
    visual: cardsPic(cs),
    answer: need,
    unit: "장",
    hint: `먼저 모양마다 카드를 세고, ${goal}장이 되려면 몇 장씩 더 있어야 하는지 구해요.`,
    explanation: `${SHAPES.map((s, i) => `${s} ${counts[i]}장 → ${goal - counts[i]}장 더`).join(", ")} → ${need}장`,
  };
});
