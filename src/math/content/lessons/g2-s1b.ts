import type { ShapeScene } from "../types";
import { pick, randInt, shuffle } from "../../lib/random";
import { easy, hard as word, josa, mid, NAMES, opts } from "./g2";

/* ═══ 2-1 4. 길이 재기 · 5. 분류하기 · 6. 곱셈 ═══ */

const rep = (a: number, n: number) => Array(n).fill(a).join(" + ");

/* ── 여러 가지 단위로 길이 재기 ── */

export const unitTimes = easy("l2-unit-times", (rand) => {
  const n = randInt(rand, 3, 8);
  const unit = pick(rand, ["클립", "지우개"]);
  const u = 26;
  return {
    key: `${unit}:${n}`,
    prompt: `막대의 길이는 ${josa(unit, "으로/로")} 몇 번인가요?`,
    visual: {
      kind: "shape",
      width: 20 + u * 9,
      height: 70,
      label: `막대 아래에 ${josa(unit, "을/를")} 이어 놓은 그림`,
      polygons: [
        { fill: true, points: [[10, 10], [10 + u * n, 10], [10 + u * n, 28], [10, 28]] },
        ...Array.from({ length: n }, (_, i) => ({ points: [[12 + u * i, 38], [8 + u * (i + 1), 38], [8 + u * (i + 1), 56], [12 + u * i, 56]] as [number, number][] })),
      ],
    },
    answer: n,
    unit: "번",
    hint: `막대 아래에 놓인 ${unit}의 수를 세어요.`,
    explanation: `${unit} ${n}개만큼이므로 ${n}번`,
  };
});

export const unitWho = mid("l2-unit-who", (rand) => {
  const [n1, n2] = shuffle(rand, NAMES);
  const a = randInt(rand, 4, 9);
  const b = randInt(rand, 4, 9);
  if (a === b) return null;
  const longer = a < b ? n1 : n2;
  const choices = opts(rand, longer, [a < b ? n2 : n1, "두 사람의 뼘의 길이가 같아요.", "알 수 없어요."]);
  if (!choices) return null;
  return {
    key: `${n1}:${a}:${b}`,
    prompt: `같은 책상의 긴 쪽을 ${josa(n1, "은/는")} 자기 뼘으로 ${a}번, ${josa(n2, "은/는")} 자기 뼘으로 ${b}번 재었습니다. 한 뼘의 길이가 더 긴 사람은 누구인가요?`,
    choices,
    answer: longer,
    hint: "같은 길이를 잴 때 단위가 길수록 잰 횟수는 적어요.",
    explanation: `잰 횟수가 더 적은 ${longer}의 뼘이 더 길어요.`,
  };
});

const HAND_REASONS: [string, string[]] = ["두 사람의 한 뼘의 길이가 서로 달라서 잰 횟수가 달라요.", ["책상의 길이가 재는 동안 변해서 그래요.", "뼘으로 재면 항상 같은 횟수가 나와요.", "한 사람이 책상을 잘못 골라서 그래요."]];

export const unitJudge = word("l2-unit-judge", (rand) => {
  const [n1, n2] = shuffle(rand, NAMES);
  const a = randInt(rand, 5, 9);
  const b = a + randInt(rand, 1, 3);
  const choices = opts(rand, HAND_REASONS[0], shuffle(rand, HAND_REASONS[1]));
  if (!choices) return null;
  return {
    key: `${n1}:${n2}:${a}:${b}:${choices.join()}`,
    prompt: `${josa(n1, "과/와")} ${josa(n2, "이/가")} 같은 책상의 긴 쪽을 뼘으로 재었더니 ${josa(n1, "은/는")} ${a}뼘, ${josa(n2, "은/는")} ${b}뼘이었습니다. 잰 횟수가 다른 까닭으로 알맞은 것을 고르세요.`,
    choices,
    answer: HAND_REASONS[0],
    hint: "재는 단위의 길이가 사람마다 같은지 생각해 보세요.",
    explanation: "사람마다 뼘의 길이가 달라 잰 횟수가 달라져요. 그래서 누구나 같은 단위인 cm를 써요.",
  };
});

/* ── 1 cm ── */

type Pt = [number, number];

/** 모눈(1 cm) 위의 꺾은선 길이 */
export const cmPath = mid("l2-cm-path", (rand) => {
  const segs = Array.from({ length: randInt(rand, 3, 4) }, (_, i) => (i % 2 === 0 ? randInt(rand, 2, 5) : randInt(rand, 1, 3)));
  const g = 24;
  const pts: Pt[] = [[g, g]];
  segs.forEach((s, i) => {
    const [x, y] = pts[pts.length - 1];
    pts.push(i % 2 === 0 ? [x + s * g, y] : [x, y + s * g]);
  });
  const total = segs.reduce((a, b) => a + b, 0);
  const w = Math.max(...pts.map((p) => p[0])) + g;
  const h = Math.max(...pts.map((p) => p[1])) + g;
  return {
    key: segs.join(":"),
    prompt: "모눈 한 칸의 길이는 1 cm입니다. 굵은 선의 길이는 몇 cm인가요?",
    visual: {
      kind: "shape",
      width: w,
      height: h,
      label: `모눈 위의 꺾은선, 각 부분 ${segs.join(", ")}칸`,
      grid: g,
      lines: pts.slice(1).map((p, i) => ({ from: pts[i], to: p, width: 4 })),
    },
    answer: total,
    unit: "cm",
    hint: "선이 지나는 모눈 칸의 변을 하나씩 세어요.",
    explanation: `${segs.join(" + ")} = ${total}(cm)`,
  };
});

export const cmJoin = mid("l2-cm-join", (rand) => {
  const a = randInt(rand, 3, 15);
  const b = randInt(rand, 3, 15);
  return {
    key: `${a}:${b}`,
    prompt: `${a} cm인 막대와 ${b} cm인 막대를 겹치지 않게 길게 이어 놓았습니다. 이어 놓은 막대의 길이는 1 cm가 몇 번인가요?`,
    answer: a + b,
    unit: "번",
    hint: "두 막대에 1 cm가 각각 몇 번 들어가는지 더해요.",
    explanation: `${a} + ${b} = ${a + b} → 1 cm가 ${a + b}번`,
  };
});

export const cmRect = word("l2-cm-rect", (rand) => {
  const a = randInt(rand, 2, 6);
  const b = randInt(rand, 1, 4);
  const g = 24;
  const x0 = g;
  return {
    key: `${a}:${b}`,
    prompt: "모눈 한 칸의 길이는 1 cm입니다. 개미가 굵은 선을 따라 사각형을 한 바퀴 돌았습니다. 개미가 움직인 거리는 몇 cm인가요?",
    visual: {
      kind: "shape",
      width: g * (a + 2),
      height: g * (b + 2),
      label: `가로 ${a}칸, 세로 ${b}칸인 사각형`,
      grid: g,
      polygons: [{ points: [[x0, x0], [x0 + a * g, x0], [x0 + a * g, x0 + b * g], [x0, x0 + b * g]] }],
    },
    answer: 2 * (a + b),
    unit: "cm",
    hint: "네 변의 길이를 모두 더해요. 마주 보는 변의 길이는 같아요.",
    explanation: `${a} + ${b} + ${a} + ${b} = ${2 * (a + b)}(cm)`,
    mistakes: { [a + b]: "두 변만 더했어요." },
  };
});

/* ── 자로 길이 재기 ── */

/* ── 약 몇 cm ── */

export const estimateObject = easy("l2-estimate-object", (rand) => {
  const [thing, v] = pick(rand, [["연필", 15], ["지우개", 5], ["크레파스", 8], ["필통", 20], ["클립", 3], ["칫솔", 18], ["공책의 긴 쪽", 25], ["풀", 9]] as const);
  // v × 100(1500 등 네 자리 수)은 2-1에 낯선 수라 쓰지 않는다
  const choices = opts(rand, v, [v * 10, v + 30, Math.max(1, Math.round(v / 10)) === v ? v + 40 : Math.max(1, Math.round(v / 10))]);
  if (!choices) return null;
  return {
    key: `${thing}:${choices.join()}`,
    prompt: `${thing}의 길이는 약 몇 cm일까요? 알맞은 것을 고르세요.`,
    choices,
    answer: String(v),
    hint: "1 cm가 몇 번쯤 들어갈지 손가락 폭 등을 떠올려 어림해요.",
    explanation: `${thing}의 길이는 약 ${v} cm예요.`,
  };
});

/* ═══ 2-1 5. 분류하기 ═══ */

const GOOD_CRITERIA = ["색깔", "모양", "다리의 수", "바퀴의 수", "구멍의 수", "재료"];
const BAD_CRITERIA = ["예쁜 것과 예쁘지 않은 것", "좋아하는 것과 싫어하는 것", "멋진 것과 멋지지 않은 것", "귀여운 것과 귀엽지 않은 것", "비싸 보이는 것과 싸 보이는 것"];

export const criteriaChoice = easy("l2-criteria-choice", (rand) => {
  const good = rand() < 0.5;
  const answer = good ? pick(rand, GOOD_CRITERIA) : pick(rand, BAD_CRITERIA);
  const choices = opts(rand, answer, shuffle(rand, good ? BAD_CRITERIA : GOOD_CRITERIA));
  if (!choices) return null;
  return {
    key: `${good}:${choices.join()}`,
    prompt: `분류하는 기준으로 ${good ? "알맞은" : "알맞지 않은"} 것을 고르세요.`,
    choices,
    answer,
    hint: "누가 분류해도 결과가 같은 기준이 알맞은 기준이에요.",
    explanation: good ? `${josa(answer, "은/는")} 누가 분류해도 결과가 같아요.` : `'${answer}'은 사람마다 결과가 달라질 수 있어요.`,
  };
});

/** '배'(과일·탈것)처럼 뜻이 둘인 낱말은 어느 종류인지 정해지지 않으므로 쓰지 않는다 */
const KINDS: Record<string, string[]> = {
  과일: ["사과", "바나나", "귤", "포도", "딸기", "복숭아"],
  채소: ["당근", "오이", "배추", "무", "가지", "양파"],
  동물: ["강아지", "고양이", "토끼", "사자", "기린", "코끼리"],
  탈것: ["버스", "자전거", "기차", "비행기", "트럭", "택시"],
};

export const criteriaOdd = mid("l2-criteria-odd", (rand) => {
  const [k1, k2] = shuffle(rand, Object.keys(KINDS));
  const three = shuffle(rand, KINDS[k1]).slice(0, 3);
  const odd = pick(rand, KINDS[k2]);
  return {
    key: `${three.join()}:${odd}`,
    prompt: "종류에 따라 분류할 때 나머지와 다른 하나를 고르세요.",
    choices: shuffle(rand, [...three, odd]),
    answer: odd,
    hint: "같은 종류끼리 묶어 보세요.",
    explanation: `${josa(three.join(", "), "은/는")} ${k1}, ${josa(odd, "은/는")} ${k2}입니다.`,
  };
});

const CRITERIA_REASON = "사람마다 생각이 달라 분류한 결과가 달라질 수 있어요.";

export const criteriaError = word("l2-criteria-error", (rand) => {
  const name = pick(rand, NAMES);
  const bad = pick(rand, BAD_CRITERIA);
  const choices = opts(rand, CRITERIA_REASON, shuffle(rand, ["물건의 수가 너무 많아요.", "물건의 색깔이 모두 달라요.", "두 가지로만 나누었어요.", "물건을 한 줄로 늘어놓지 않았어요."]));
  if (!choices) return null;
  return {
    key: `${name}:${bad}:${choices.join()}`,
    prompt: `${josa(name, "은/는")} 친구들의 물건을 '${bad}'으로 분류했습니다. 이 분류 기준이 알맞지 않은 까닭을 고르세요.`,
    choices,
    answer: CRITERIA_REASON,
    hint: "다른 친구가 분류해도 결과가 똑같을지 생각해 보세요.",
    explanation: `분류 기준은 누가 분류해도 결과가 같도록 분명해야 해요. ${CRITERIA_REASON}`,
  };
});

const LEGS: [string, number][] = [["닭", 2], ["오리", 2], ["참새", 2], ["타조", 2], ["강아지", 4], ["고양이", 4], ["소", 4], ["말", 4], ["토끼", 4], ["뱀", 0], ["금붕어", 0], ["지렁이", 0]];

export const sortLegs = mid("l2-sort-legs", (rand) => {
  const animals = shuffle(rand, LEGS).slice(0, 7);
  const legs = pick(rand, [0, 2, 4]);
  const count = animals.filter(([, l]) => l === legs).length;
  // 답이 0가지인 문제는 만들지 않는다
  if (count === 0) return null;
  return {
    key: `${animals.map((a) => a[0]).join()}:${legs}`,
    prompt: `${josa(animals.map((a) => a[0]).join(", "), "을/를")} 다리의 수에 따라 분류했습니다. 다리가 ${legs === 0 ? "없는" : `${legs}개인`} 동물은 몇 가지인가요?`,
    answer: count,
    unit: "가지",
    hint: "동물을 하나씩 떠올리며 다리의 수를 확인해요.",
    explanation: `${animals.filter(([, l]) => l === legs).map((a) => a[0]).join(", ")} → ${count}가지`,
  };
});

export const countReverse = word("l2-count-reverse", (rand) => {
  const r = randInt(rand, 3, 9);
  const more = randInt(rand, 1, 5);
  const y = randInt(rand, 2, 9);
  const total = r + r + more + y;
  return {
    key: `${r}:${more}:${y}`,
    prompt: `구슬을 색깔별로 분류했더니 빨간 구슬은 ${r}개이고, 파란 구슬은 빨간 구슬보다 ${more}개 더 많았습니다. 나머지는 모두 노란 구슬입니다. 구슬이 모두 ${total}개라면 노란 구슬은 몇 개인가요?`,
    answer: y,
    unit: "개",
    hint: "먼저 파란 구슬의 수를 구해요.",
    explanation: `파란 구슬 ${r} + ${more} = ${r + more}(개), 노란 구슬 ${total} − ${r} − ${r + more} = ${y}(개)`,
    mistakes: { [total - r - more]: "파란 구슬의 수를 먼저 구해야 해요." },
  };
});

const MILK = ["흰 우유", "딸기 우유", "초코 우유", "바나나 우유"];

function milkTable(rand: () => number) {
  const vals = shuffle(rand, [2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4);
  return { vals, visual: { kind: "table" as const, header: ["우유", ...MILK], rows: [["팔린 수(개)", ...vals.map(String)]] } };
}

export const resultSum = mid("l2-result-sum", (rand) => {
  const { vals, visual } = milkTable(rand);
  const [i, j] = shuffle(rand, [0, 1, 2, 3]);
  return {
    key: `${vals.join()}:${i}:${j}`,
    prompt: `오늘 가게에서 팔린 우유의 수입니다. ${josa(MILK[i], "과/와")} ${josa(MILK[j], "은/는")} 모두 몇 개 팔렸나요?`,
    visual,
    answer: vals[i] + vals[j],
    unit: "개",
    hint: "표에서 두 수를 찾아 더해요.",
    explanation: `${vals[i]} + ${vals[j]} = ${vals[i] + vals[j]}(개)`,
  };
});

/* ═══ 2-1 6. 곱셈 ═══ */

function dotGrid(rows: number, cols: number, label: string): ShapeScene {
  const g = 26;
  return {
    kind: "shape",
    width: 20 + cols * g,
    height: 20 + rows * g,
    label,
    circles: Array.from({ length: rows * cols }, (_, i) => ({ c: [10 + g / 2 + (i % cols) * g, 10 + g / 2 + Math.floor(i / cols) * g] as Pt, r: 8 })),
  };
}

function groupScene(groups: number, each: number): ShapeScene {
  const g = 18;
  const bw = 3 * g + 10;
  const rowsIn = Math.ceil(each / 3);
  const circles: ShapeScene["circles"] = [];
  const polygons: ShapeScene["polygons"] = [];
  for (let k = 0; k < groups; k++) {
    const x0 = 8 + k * (bw + 8);
    polygons.push({ points: [[x0, 8], [x0 + bw, 8], [x0 + bw, 14 + rowsIn * g], [x0, 14 + rowsIn * g]] });
    for (let i = 0; i < each; i++) circles.push({ c: [x0 + 5 + g / 2 + (i % 3) * g, 11 + g / 2 + Math.floor(i / 3) * g], r: 6 });
  }
  return { kind: "shape", width: 16 + groups * (bw + 8), height: 24 + rowsIn * g, label: `${each}개씩 ${groups}묶음`, polygons, circles };
}

export const countDots = easy("l2-count-dots", (rand) => {
  const r = randInt(rand, 2, 5);
  const c = randInt(rand, 2, 6);
  return {
    key: `${r}:${c}`,
    prompt: "구슬은 모두 몇 개인가요? 묶어 세거나 뛰어 세어 보세요.",
    visual: dotGrid(r, c, `구슬 ${r}줄, 한 줄에 ${c}개`),
    answer: r * c,
    unit: "개",
    hint: `한 줄에 ${c}개씩 있어요. ${c}씩 뛰어 세어 보세요.`,
    explanation: `${Array.from({ length: r }, (_, i) => c * (i + 1)).join(", ")} → ${r * c}개`,
  };
});

export const skipTimes = mid("l2-skip-times", (rand) => {
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, 3, 6);
  return {
    key: `${a}:${b}`,
    prompt: `0에서부터 ${a}씩 ${b}번 뛰어 세면 얼마가 되나요?`,
    answer: a * b,
    hint: `${a}, ${2 * a}, …처럼 ${a}씩 커지게 세어요.`,
    explanation: `${Array.from({ length: b }, (_, i) => a * (i + 1)).join(", ")} → ${a * b}`,
  };
});

const FACTOR_SETS: Record<number, [number, number][]> = {
  12: [[2, 6], [3, 4], [4, 3], [6, 2]],
  16: [[2, 8], [4, 4], [8, 2]],
  18: [[2, 9], [3, 6], [6, 3], [9, 2]],
  20: [[4, 5], [5, 4], [2, 10]],
  24: [[3, 8], [4, 6], [6, 4], [8, 3]],
};

export const countWays = mid("l2-count-ways", (rand) => {
  const n = pick(rand, [12, 16, 18, 20, 24]);
  const rights = shuffle(rand, FACTOR_SETS[n]).slice(0, 3);
  const [p, q] = pick(rand, FACTOR_SETS[n]);
  const wrongQ = q + pick(rand, [-1, 1]);
  if (wrongQ < 2) return null;
  const say = ([a, b]: [number, number], k: number) => (k % 2 ? `${a}씩 ${b}묶음` : `${a}씩 ${b}번 뛰어 세기`);
  const answer = say([p, wrongQ], randInt(rand, 0, 1));
  const choices = opts(rand, answer, rights.map((r, i) => say(r, i)));
  if (!choices) return null;
  return {
    key: `${n}:${choices.join()}`,
    prompt: `사탕 ${n}개를 세는 방법으로 알맞지 않은 것을 고르세요.`,
    choices,
    answer,
    hint: "각 방법으로 세어 모두 몇 개가 되는지 확인해요.",
    explanation: `${answer} → ${p * wrongQ}개이므로 ${n}개가 아니에요.`,
  };
});

export const countCompare = word("l2-count-compare", (rand) => {
  const [n1, n2] = shuffle(rand, NAMES);
  const a = randInt(rand, 2, 6);
  const b = randInt(rand, 2, 5);
  const c = randInt(rand, 2, 6);
  const d = randInt(rand, 2, 5);
  if (a * b === c * d || a === c) return null;
  return {
    key: `${a}:${b}:${c}:${d}`,
    prompt: `${josa(n1, "은/는")} 사탕을 ${a}개씩 ${b}봉지, ${josa(n2, "은/는")} ${c}개씩 ${d}봉지 가지고 있습니다. 사탕을 더 많이 가진 사람은 몇 개 더 많이 가지고 있나요?`,
    answer: Math.abs(a * b - c * d),
    unit: "개",
    hint: "두 사람이 가진 사탕 수를 각각 뛰어 세어 구해요.",
    explanation: `${n1}: ${rep(a, b)} = ${a * b}(개), ${n2}: ${rep(c, d)} = ${c * d}(개) → ${Math.abs(a * b - c * d)}개`,
  };
});

/** 여러 가지 방법으로 세기 차시용 두 단계 문장제: 몇의 몇 배·곱셈식(뒤 차시) 대신 뛰어 세기와 같은 수 더하기로 푼다 */
export const countBoxesEat = word("l2-count-boxes-eat", (rand) => {
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, 2, 5);
  const c = randInt(rand, 1, a * b - 1);
  return {
    key: `${a}:${b}:${c}`,
    prompt: `한 상자에 과자가 ${a}개씩 들어 있습니다. ${b}상자를 사서 ${c}개를 먹었다면 남은 과자는 몇 개인가요?`,
    answer: a * b - c,
    unit: "개",
    hint: `먼저 ${a}씩 ${b}번 뛰어 세어 과자가 모두 몇 개인지 구해요.`,
    explanation: `${rep(a, b)} = ${a * b}(개), ${a * b} − ${c} = ${a * b - c}(개)`,
    mistakes: { [a * b]: "먹은 과자를 빼야 해요." },
  };
});

export const bundleCount = easy("l2-bundle-count", (rand) => {
  const a = randInt(rand, 2, 6);
  const b = randInt(rand, 2, 6);
  return {
    key: `${a}:${b}`,
    prompt: `구슬 ${a * b}개를 ${a}개씩 묶으면 몇 묶음이 되나요?`,
    visual: dotGrid(b, a, `구슬 ${a * b}개`),
    answer: b,
    unit: "묶음",
    hint: `${a}개씩 묶어 가며 묶음의 수를 세어요.`,
    explanation: `${Array.from({ length: b }, (_, i) => a * (i + 1)).join(", ")} → ${b}묶음`,
  };
});

export const bundleWays = mid("l2-bundle-ways", (rand) => {
  const n = pick(rand, [12, 18, 20, 24, 16, 30]);
  const divs = [2, 3, 4, 5, 6, 7, 8, 9].filter((d) => n % d === 0 && n / d > 1);
  const nots = [2, 3, 4, 5, 6, 7, 8, 9].filter((d) => n % d !== 0);
  const answer = `${pick(rand, nots)}개씩`;
  const choices = opts(rand, answer, shuffle(rand, divs).map((d) => `${d}개씩`));
  if (!choices) return null;
  return {
    key: `${n}:${choices.join()}`,
    prompt: `딸기 ${n}개를 남김없이 똑같이 묶으려고 합니다. 묶을 수 없는 방법을 고르세요.`,
    choices,
    answer,
    hint: "그 수만큼씩 뛰어 세어 정확히 도착하는지 확인해요.",
    explanation: `${answer} 뛰어 세면 ${n}에 정확히 도착하지 않아요.`,
  };
});

export const bundleLeft = mid("l2-bundle-left", (rand) => {
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, 2, 5);
  const c = randInt(rand, 1, a - 1);
  if (c < 1) return null;
  return {
    key: `${a}:${b}:${c}`,
    prompt: `구슬을 ${a}개씩 ${b}묶음 묶고 ${c}개가 남았습니다. 구슬은 모두 몇 개인가요?`,
    answer: a * b + c,
    unit: "개",
    hint: `${a}씩 ${b}번 뛰어 센 뒤 남은 ${c}개를 더해요.`,
    explanation: `${rep(a, b)} + ${c} = ${a * b + c}(개)`,
  };
});

/** 같은 수를 두 가지 방법으로 묶어 세고 묶음 수 비교(공배수는 5학년이라 쓰지 않는다) */
export const bundleDiff = word("l2-bundle-diff", (rand) => {
  const n = pick(rand, [12, 16, 18, 20, 24]);
  const [a, c] = shuffle(rand, [2, 3, 4, 5, 6].filter((d) => n % d === 0 && n / d >= 2))
    .slice(0, 2)
    .sort((x, y) => x - y);
  if (!c) return null;
  const cols = n % 6 === 0 ? 6 : 4;
  const skip = (d: number) => Array.from({ length: n / d }, (_, i) => d * (i + 1)).join(", ");
  return {
    key: `${n}:${a}:${c}`,
    prompt: `사탕 ${n}개가 있습니다. ${a}개씩 묶을 때와 ${c}개씩 묶을 때 묶음의 수는 몇 묶음 차이가 나나요?`,
    visual: dotGrid(n / cols, cols, `사탕 ${n}개`),
    answer: n / a - n / c,
    unit: "묶음",
    hint: `그림의 사탕을 ${a}개씩, ${c}개씩 묶어 각각 몇 묶음인지 세어요.`,
    explanation: `${a}개씩: ${skip(a)} → ${n / a}묶음, ${c}개씩: ${skip(c)} → ${n / c}묶음, ${n / a} − ${n / c} = ${n / a - n / c}(묶음)`,
    mistakes: { [n / a + n / c]: "두 묶음 수의 차를 구해야 해요." },
  };
});

/** 그림을 보고 다시 묶어 세기(나눗셈 식은 쓰지 않는다) */
export const bundleRegroup = word("l2-bundle-regroup", (rand) => {
  const a = randInt(rand, 2, 4);
  const b = randInt(rand, 2, 4);
  const c = pick(rand, [2, 3, 4, 6].filter((x) => x !== a && (a * b) % x === 0 && (a * b) / x >= 2));
  if (!c) return null;
  return {
    key: `${a}:${b}:${c}`,
    prompt: `쿠키가 그림과 같이 한 봉지에 ${a}개씩 ${b}봉지 있습니다. 이 쿠키를 모두 꺼내 ${c}개씩 다시 묶으면 몇 묶음이 되나요?`,
    visual: groupScene(b, a),
    answer: (a * b) / c,
    unit: "묶음",
    hint: `그림의 쿠키를 ${c}개씩 묶어 보거나, ${c}씩 뛰어 세어 ${josa(a * b, "이/가")} 될 때까지 몇 번인지 세어요.`,
    explanation: `쿠키는 ${rep(a, b)} = ${a * b}(개), ${c}씩 ${Array.from({ length: (a * b) / c }, (_, i) => c * (i + 1)).join(", ")} → ${(a * b) / c}묶음`,
  };
});

export const timesOfRev = mid("l2-times-of-rev", (rand) => {
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, 2, 6);
  return {
    key: `${a}:${b}`,
    prompt: `${josa(a * b, "은/는")} ${a}의 몇 배인가요?`,
    answer: b,
    unit: "배",
    hint: `${a}씩 몇 번 뛰어 세면 ${josa(a * b, "이/가")} 되는지 세어요.`,
    explanation: `${Array.from({ length: b }, (_, i) => a * (i + 1)).join(", ")} → ${b}배`,
  };
});

export const timesOfCompare = word("l2-times-of-compare", (rand) => {
  const [n1, n2] = shuffle(rand, NAMES);
  const a = randInt(rand, 2, 8);
  const b = randInt(rand, 2, 5);
  return {
    key: `${a}:${b}`,
    prompt: `${josa(n1, "은/는")} 연필을 ${a}자루 가지고 있고, ${josa(n2, "은/는")} ${n1}의 ${b}배만큼 가지고 있습니다. ${josa(n2, "은/는")} ${n1}보다 연필을 몇 자루 더 많이 가지고 있나요?`,
    answer: a * b - a,
    unit: "자루",
    hint: `먼저 ${a}의 ${b}배를 구해요.`,
    explanation: `${a}의 ${b}배: ${rep(a, b)} = ${a * b}(자루), ${a * b} − ${a} = ${a * b - a}(자루)`,
    mistakes: { [a * b]: `${n2}가 가진 연필 수만 구했어요.` },
  };
});

export const timesOfTape = word("l2-times-of-tape", (rand) => {
  const a = randInt(rand, 3, 9);
  const b = randInt(rand, 2, 4);
  const c = randInt(rand, 1, a * b - 1);
  return {
    key: `${a}:${b}:${c}`,
    prompt: `색 테이프 ㉮의 길이는 ${a} cm입니다. ㉯의 길이는 ㉮의 ${b}배이고, ㉰의 길이는 ㉯보다 ${c} cm 짧습니다. ㉰의 길이는 몇 cm인가요?`,
    answer: a * b - c,
    unit: "cm",
    hint: "㉯의 길이를 먼저 구해요.",
    explanation: `㉯: ${rep(a, b)} = ${a * b}(cm), ㉰: ${a * b} − ${c} = ${a * b - c}(cm)`,
  };
});

export const mulWrite = easy("l2-mul-write", (rand) => {
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, 3, 5);
  const answer = `${a} × ${b}`;
  const choices = opts(rand, answer, [`${a} × ${b + 1}`, `${a} + ${b}`, `${b} × ${b}`, `${a} × ${b - 1}`]);
  if (!choices) return null;
  return {
    key: `${a}:${b}`,
    prompt: "덧셈식을 곱셈식으로 바르게 나타낸 것을 고르세요.",
    expression: rep(a, b),
    choices,
    answer,
    hint: `${josa(a, "을/를")} 몇 번 더했는지 세어요.`,
    explanation: `${josa(a, "을/를")} ${b}번 더했으므로 ${a} × ${b}`,
  };
});

export const mulRepeat = mid("l2-mul-repeat", (rand) => {
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, 2, 5);
  return {
    key: `${a}:${b}`,
    prompt: "곱셈식을 덧셈식으로 바꾸어 계산하세요.",
    expression: `${a} × ${b} = ${rep(a, b)} = □`,
    answer: a * b,
    hint: `${josa(a, "을/를")} ${b}번 더해요.`,
    explanation: `${rep(a, b)} = ${a * b}`,
    mistakes: { [a + b]: "곱해야 하는데 두 수를 더했어요." },
  };
});

export const mulMissing = mid("l2-mul-missing", (rand) => {
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, 2, 6);
  return {
    key: `${a}:${b}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: `${rep(a, b)} = ${a} × □`,
    answer: b,
    hint: `${josa(a, "을/를")} 몇 번 더했는지 세어요.`,
    explanation: `${josa(a, "을/를")} ${b}번 더했으므로 ${a} × ${b}`,
    mistakes: { [a * b]: "계산 결과가 아니라 더한 횟수를 써야 해요." },
  };
});

export const mulCards = word("l2-mul-cards", (rand) => {
  const cards = shuffle(rand, [2, 3, 4, 5, 6]).slice(0, 4);
  const big = rand() < 0.5;
  const s = [...cards].sort((a, b) => (big ? b - a : a - b));
  return {
    key: `${cards.join()}:${big}`,
    prompt: `수 카드 ${cards.join(", ")} 중 2장을 골라 □ × □를 만들려고 합니다. 곱이 가장 ${big ? "큰" : "작은"} 곱셈식의 곱은 얼마인가요?`,
    answer: s[0] * s[1],
    hint: `곱이 가장 ${big ? "크려면 가장 큰" : "작으려면 가장 작은"} 두 수를 골라요.`,
    explanation: `${s[0]} × ${s[1]} = ${rep(s[0], s[1])} = ${s[0] * s[1]}`,
  };
});

export const mulError = word("l2-mul-error", (rand) => {
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, 3, 5);
  const name = pick(rand, NAMES);
  const say = (n: number, e: string, v: number) => `${josa(a, "을/를")} ${n}번 더했으므로 ${e} = ${josa(v, "이에요/예요")}.`;
  const answer = say(b, `${a} × ${b}`, a * b);
  const choices = opts(rand, answer, [say(b, `${a} × ${b}`, a * (b + 1)), say(b, `${a} + ${b}`, a + b), say(b + 1, `${a} × ${b + 1}`, a * (b + 1))]);
  if (!choices) return null;
  return {
    key: `${a}:${b}:${name}`,
    prompt: `${josa(name, "은/는")} ${josa(rep(a, b), "을/를")} ${josa(`${a} × ${b + 1}`, "으로/로")} 나타냈습니다. 바르게 고친 것을 고르세요.`,
    choices,
    answer,
    hint: `${josa(a, "이/가")} 몇 번 나오는지 세어 보세요.`,
    explanation: answer,
  };
});

export const mulPicture = easy("l2-mul-picture", (rand) => {
  const each = randInt(rand, 2, 6);
  const groups = randInt(rand, 2, 5);
  return {
    key: `${each}:${groups}`,
    prompt: "그림을 보고 곱셈식으로 나타낼 때 □ 안에 알맞은 수를 쓰세요.",
    visual: groupScene(groups, each),
    expression: `${each} × ${groups} = □`,
    answer: each * groups,
    hint: `${each}씩 ${groups}묶음이에요.`,
    explanation: `${rep(each, groups)} = ${each * groups}`,
  };
});

export const mulStoryChoice = mid("l2-mul-story-choice", (rand) => {
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, 2, 6);
  if (a === b) return null;
  const answer = `한 접시에 사과가 ${a}개씩 ${b}접시`;
  const choices = opts(rand, answer, [`한 접시에 사과가 ${b}개씩 ${b}접시`, `사과 ${a}개와 ${b}개`, `한 접시에 사과가 ${a}개씩 ${a}접시`, `한 접시에 사과가 ${a}개씩 ${b + 1}접시`]);
  if (!choices) return null;
  return {
    key: `${a}:${b}`,
    prompt: `곱셈식 ${a} × ${b}에 알맞은 상황을 고르세요.`,
    choices,
    answer,
    hint: `${a} × ${josa(b, "은/는")} ${a}씩 ${b}묶음이에요.`,
    explanation: `${a} × ${b} → ${a}개씩 ${b}묶음`,
  };
});

export const mulStory = mid("l2-mul-story", (rand) => {
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, 2, 5);
  const [thing, unit, pack] = pick(rand, [["자동차의 바퀴", "개", "대"], ["문어의 다리", "개", "마리"], ["꽃잎", "장", "송이"], ["의자", "개", "줄"]] as const);
  const fixed = thing === "자동차의 바퀴" ? 4 : thing === "문어의 다리" ? 8 : a;
  return {
    key: `${thing}:${fixed}:${b}`,
    prompt:
      thing === "자동차의 바퀴" ? `자동차 한 대에 바퀴가 4개씩 있습니다. 자동차 ${b}대의 바퀴는 모두 몇 개인가요?`
      : thing === "문어의 다리" ? `문어 한 마리의 다리는 8개입니다. 문어 ${b}마리의 다리는 모두 몇 개인가요?`
      : thing === "꽃잎" ? `꽃 한 송이에 꽃잎이 ${a}장씩 있습니다. 꽃 ${b}송이의 꽃잎은 모두 몇 장인가요?`
      : `의자가 한 줄에 ${a}개씩 ${b}줄 있습니다. 의자는 모두 몇 개인가요?`,
    answer: fixed * b,
    unit,
    hint: `${fixed}의 ${b}배를 구해요. (${pack} 수만큼 더해요)`,
    explanation: `${fixed} × ${b} = ${rep(fixed, b)} = ${fixed * b}(${unit})`,
    mistakes: { [fixed + b]: "곱해야 하는데 더했어요." },
  };
});

