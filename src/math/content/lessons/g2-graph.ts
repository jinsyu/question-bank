import { pick, randInt, shuffle } from "../../lib/random";
import { josa, NAMES, opts } from "./g2";
import { type Card, cardsScene, easy, graphScene, type GraphOpt, mid, randomCard, word } from "./g2-pics";

/**
 * 2-2 5단원 표와 그래프: 가로·세로 칸이 있는 ○(×, /) 그래프 그림과 자료 그림으로 푼다.
 * (예전처럼 표 칸 안에 "○○○" 글자를 늘어놓지 않는다)
 */

const SPORTS = ["축구", "줄넘기", "피구", "달리기", "수영"];
const FRUITS = ["사과", "귤", "포도", "딸기", "수박"];

function survey(rand: () => number, min = 1, max = 7, pool = SPORTS) {
  const kinds = shuffle(rand, pool).slice(0, 4);
  const vals = kinds.map(() => randInt(rand, min, max));
  return { kinds, vals, total: vals.reduce((a, b) => a + b, 0) };
}
/** 그래프 모양(세로·가로, ○·×·/)을 골고루 */
const look = (rand: () => number): GraphOpt => ({ dir: pick(rand, ["세로", "가로"] as const), mark: pick(rand, ["○", "○", "×"] as const) });
const what = (pool: string[]) => (pool === SPORTS ? "운동" : "과일");

/* ── 자료를 분류하여 표로 나타내기(모양 카드 자료) ── */

const SHAPES = ["삼각형", "사각형", "원"] as const;
function shapeCards(rand: () => number, n: number): Card[] {
  for (let t = 0; t < 30; t++) {
    const cs = Array.from({ length: n }, () => randomCard(rand));
    const cnt = SHAPES.map((s) => cs.filter((c) => c.shape === s).length);
    if (cnt.every((c) => c > 0) && new Set(cnt).size === 3) return cs;
  }
  return Array.from({ length: n }, (_, i) => ({ shape: SHAPES[i % 3], fill: i % 2 === 0, big: i < 3 }));
}
const countShapes = (cs: Card[]) => SHAPES.map((s) => cs.filter((c) => c.shape === s).length);
const cardsPic = (cs: Card[]) => cardsScene(cs, `친구들이 고른 모양 카드 ${cs.length}장: ${cs.map((c, i) => `${i + 1} ${c.shape}`).join(", ")}`);

export const tableFromList = easy("l2-table-from-list", (rand) => {
  const cs = shapeCards(rand, randInt(rand, 8, 12));
  const k = randInt(rand, 0, 2);
  const cnt = countShapes(cs);
  return {
    key: `${cs.map((c) => c.shape + c.fill + c.big).join()}:${k}`,
    prompt: `친구들이 좋아하는 모양 카드를 한 장씩 골랐습니다. 모양에 따라 분류하여 표로 나타낼 때 ${SHAPES[k]}에 알맞은 수를 쓰세요.`,
    visual: cardsPic(cs),
    answer: cnt[k],
    unit: "명",
    hint: "카드 한 장이 친구 한 명이에요. 센 카드에 표시하며 빠짐없이 세어요.",
    explanation: SHAPES.map((s, i) => `${s} ${cnt[i]}명`).join(", "),
  };
});

export const tablePic = mid("l2-table-pic", (rand) => {
  const cs = shapeCards(rand, randInt(rand, 9, 12));
  const cnt = countShapes(cs);
  const max = Math.max(...cnt);
  const min = Math.min(...cnt);
  return {
    key: cs.map((c) => c.shape + c.fill + c.big).join(),
    prompt: "친구들이 좋아하는 모양 카드를 한 장씩 골랐습니다. 표로 나타내었을 때 가장 많은 친구가 고른 모양은 가장 적은 친구가 고른 모양보다 몇 명 더 많나요?",
    visual: cardsPic(cs),
    answer: max - min,
    unit: "명",
    hint: "먼저 모양별로 세어 표를 만든 뒤, 가장 큰 수와 가장 작은 수의 차를 구해요.",
    explanation: `${SHAPES.map((s, i) => `${s} ${cnt[i]}명`).join(", ")} → ${max} − ${min} = ${max - min}(명)`,
  };
});

export const tableCheck = word("l2-table-check", (rand) => {
  const cs = shapeCards(rand, randInt(rand, 9, 12));
  const cnt = countShapes(cs);
  const bad = randInt(rand, 0, 2);
  const shown = cnt.map((c, i) => (i === bad ? c + pick(rand, [-1, 1]) : c));
  if (shown[bad] <= 0) return null;
  const name = pick(rand, NAMES);
  return {
    key: `${cs.map((c) => c.shape + c.fill + c.big).join()}:${bad}:${shown[bad]}`,
    prompt: `${josa(name, "이/가")} 그림의 자료를 모양에 따라 표로 나타냈습니다. (삼각형 ${shown[0]}명, 사각형 ${shown[1]}명, 원 ${shown[2]}명, 합계 ${shown.reduce((a, b) => a + b, 0)}명) 잘못 센 모양을 고르세요.`,
    visual: cardsPic(cs),
    choices: [...SHAPES, "잘못 센 것이 없어요"],
    answer: SHAPES[bad],
    hint: "모양마다 다시 세어 표의 수와 비교해요. 합계가 카드 수와 같은지도 살펴보세요.",
    explanation: `바르게 세면 ${SHAPES.map((s, i) => `${s} ${cnt[i]}명`).join(", ")}이므로 ${SHAPES[bad]}을 잘못 셌어요.`,
  };
});

/* ── 그래프로 나타내기 ── */

export const circleGraph = easy("circle-graph", (rand) => {
  const pool = pick(rand, [SPORTS, FRUITS]);
  const { kinds, vals } = survey(rand, 1, 6, pool);
  const ask = randInt(rand, 0, 3);
  const g = look(rand);
  return {
    key: `${kinds.join()}:${vals.join()}:${ask}:${g.dir}${g.mark}`,
    prompt: `좋아하는 ${josa(what(pool), "을/를")} 조사하여 ${g.mark}로 나타낸 그래프입니다. ${josa(kinds[ask], "을/를")} 좋아하는 학생은 몇 명인가요?`,
    visual: graphScene(kinds, vals, g),
    answer: vals[ask],
    unit: "명",
    hint: `${g.mark} 하나가 1명이에요. ${kinds[ask]}의 ${g.mark}를 세어요.`,
    explanation: `${g.mark}가 ${vals[ask]}개이므로 ${vals[ask]}명`,
  };
});

/** 잘못 그린 그래프의 종류: 정답 문장이 한 가지면 그림을 보지 않고 외워서 고르게 된다 */
const GRAPH_ERRORS = {
  skip: { why: "○를 아래에서부터 빈칸 없이 채워 그리지 않았어요.", tell: "맨 아래 칸을 비우고 그렸어요. ○는 아래에서부터 빈칸 없이 채워야 높이로 비교할 수 있어요." },
  double: { why: "○를 한 칸에 하나씩 그리지 않았어요.", tell: "맨 아래 칸에 ○를 두 개 그렸어요. ○는 한 칸에 하나씩 그려야 높이로 비교할 수 있어요." },
  extra: { why: "조사한 수보다 ○를 더 많이 그렸어요.", tell: "조사한 수보다 ○를 하나 더 그렸어요. ○의 수는 조사한 학생 수와 같아야 해요." },
} as const;
const FROM_TOP = "○를 위에서부터 그렸어요.";
const GRAPH_NOT = ["운동의 이름을 쓰지 않았어요.", "○ 대신 ×를 그려야 해요.", FROM_TOP];
const GRAPH_MAX = 6;

export const graphHow = mid("l2-graph-how", (rand) => {
  const { kinds, vals } = survey(rand, 2, 5);
  const k = randInt(rand, 0, 3);
  const kind = pick(rand, ["skip", "double", "extra"] as const);
  const answer = GRAPH_ERRORS[kind].why;
  const others = Object.values(GRAPH_ERRORS).map((e) => e.why).filter((w) => w !== answer);
  // 맨 아래 칸을 비우고 맨 위 칸까지 채우면 '위에서부터 그린' 모양과 같아 그 오답도 맞는 말이 된다
  const topFilled = kind === "skip" && vals[k] + 1 === GRAPH_MAX;
  const nots = GRAPH_NOT.filter((w) => !(topFilled && w === FROM_TOP));
  const choices = opts(rand, answer, shuffle(rand, [...others, ...nots]));
  if (!choices) return null;
  const drawn = vals.map((v, i) => (kind === "extra" && i === k ? v + 1 : v));
  return {
    key: `${kinds.join()}:${vals.join()}:${k}:${kind}:${choices.join()}`,
    prompt: `좋아하는 운동을 조사한 결과는 ${kinds.map((x, i) => `${x} ${vals[i]}명`).join(", ")}입니다. 이 결과를 ○로 그래프를 그렸는데 잘못 그린 곳이 있습니다. ${kinds[k]}의 그래프가 잘못된 까닭을 고르세요.`,
    visual: graphScene(kinds, drawn, { dir: "세로", mark: "○", max: GRAPH_MAX, skipBottom: kind === "skip" ? k : undefined, doubleBottom: kind === "double" ? k : undefined }),
    choices,
    answer,
    hint: "○는 아래 칸부터 한 칸에 하나씩, 조사한 수만큼 그려요. 조사 결과와 그래프를 비교해 보세요.",
    explanation: `${josa(kinds[k], "은/는")} ${GRAPH_ERRORS[kind].tell}`,
  };
});

export const graphFix = word("l2-graph-fix", (rand) => {
  const { kinds, vals, total } = survey(rand, 2, 6);
  const k = randInt(rand, 0, 3);
  const other = (k + randInt(rand, 1, 3)) % 4;
  if (vals[k] === vals[other]) return null;
  const g = look(rand);
  return {
    key: `${kinds.join()}:${vals.join()}:${k}:${other}:${g.dir}${g.mark}`,
    prompt: `${total}명의 학생이 좋아하는 운동을 조사하여 그래프로 나타내다가 ${kinds[k]}의 ${g.mark}를 그리지 못했습니다. ${josa(kinds[k], "을/를")} 좋아하는 학생과 ${josa(kinds[other], "을/를")} 좋아하는 학생의 수의 차는 몇 명인가요?`,
    visual: graphScene(kinds, vals, { ...g, hide: k, max: 7 }),
    answer: Math.abs(vals[k] - vals[other]),
    unit: "명",
    hint: `먼저 전체 ${total}명에서 그래프에 있는 학생 수를 빼서 ${kinds[k]}의 학생 수를 구해요.`,
    explanation: `${kinds[k]}: ${total} − ${vals.filter((_, i) => i !== k).join(" − ")} = ${vals[k]}(명), 차: ${Math.abs(vals[k] - vals[other])}명`,
  };
});

export const graphSumMore = word("l2-graph-sum-more", (rand) => {
  const { kinds, vals } = survey(rand, 1, 7, FRUITS);
  const k = randInt(rand, 2, 5);
  const pickd = vals.map((v, i) => (v > k ? i : -1)).filter((i) => i >= 0);
  if (pickd.length < 2) return null;
  const sum = pickd.reduce((s, i) => s + vals[i], 0);
  const g = look(rand);
  return {
    key: `${kinds.join()}:${vals.join()}:${k}:${g.dir}${g.mark}`,
    prompt: `좋아하는 과일을 조사하여 나타낸 그래프입니다. 좋아하는 학생이 ${k}명보다 많은 과일을 모두 찾아, 그 과일을 좋아하는 학생 수를 모두 더하면 몇 명인가요?`,
    visual: graphScene(kinds, vals, g),
    answer: sum,
    unit: "명",
    hint: `${g.mark}가 ${k}개보다 많은 줄만 골라요. ${k}개인 줄은 들어가지 않아요.`,
    explanation: `${pickd.map((i) => `${kinds[i]} ${vals[i]}명`).join(", ")} → ${pickd.map((i) => vals[i]).join(" + ")} = ${sum}(명)`,
  };
});

/* ── 표와 그래프의 내용 알아보기 ── */

export const graphMost = easy("l2-graph-most", (rand) => {
  const kinds = shuffle(rand, SPORTS).slice(0, 4);
  const vals = shuffle(rand, [1, 2, 3, 4, 5, 6, 7]).slice(0, 4);
  const big = rand() < 0.5;
  const t = big ? Math.max(...vals) : Math.min(...vals);
  const g = look(rand);
  return {
    key: `${kinds.join()}:${vals.join()}:${big}:${g.dir}${g.mark}`,
    prompt: `그래프를 보고 가장 ${big ? "많은" : "적은"} 학생이 좋아하는 운동을 고르세요.`,
    visual: graphScene(kinds, vals, g),
    choices: shuffle(rand, kinds),
    answer: kinds[vals.indexOf(t)],
    hint: `${g.mark}가 가장 ${big ? "많은" : "적은"} 줄을 찾아요. 그래프는 한눈에 비교하기 편해요.`,
    explanation: `${kinds[vals.indexOf(t)]} ${t}명`,
  };
});

export const graphMostLeast = mid("l2-graph-most-least", (rand) => {
  const kinds = shuffle(rand, FRUITS).slice(0, 4);
  const vals = shuffle(rand, [1, 2, 3, 4, 5, 6, 7]).slice(0, 4);
  const g = look(rand);
  return {
    key: `${kinds.join()}:${vals.join()}:${g.dir}${g.mark}`,
    prompt: "좋아하는 과일을 조사하여 나타낸 그래프입니다. 가장 많은 학생이 좋아하는 과일과 가장 적은 학생이 좋아하는 과일의 학생 수의 차는 몇 명인가요?",
    visual: graphScene(kinds, vals, g),
    answer: Math.max(...vals) - Math.min(...vals),
    unit: "명",
    hint: `${g.mark}가 가장 많은 줄과 가장 적은 줄을 찾아 개수의 차를 구해요.`,
    explanation: `${Math.max(...vals)} − ${Math.min(...vals)} = ${Math.max(...vals) - Math.min(...vals)}(명)`,
  };
});

export const graphMoreThan = mid("l2-graph-more-than", (rand) => {
  const { kinds, vals } = survey(rand, 1, 7);
  // 기준값을 항목 값 사이에서 골라 답이 0이 되지 않게 한다
  const k = randInt(rand, Math.min(...vals), Math.max(...vals) - 1);
  const count = vals.filter((v) => v > k).length;
  if (!count || k < 1) return null;
  const g = look(rand);
  return {
    key: `${kinds.join()}:${vals.join()}:${k}:${g.dir}${g.mark}`,
    prompt: `그래프를 보고 좋아하는 학생이 ${k}명보다 많은 운동은 몇 가지인지 구하세요.`,
    visual: graphScene(kinds, vals, g),
    answer: count,
    unit: "가지",
    hint: `${g.mark}가 ${k}개보다 많은 줄을 세어요. ${k}개인 줄은 들어가지 않아요.`,
    explanation: `${kinds.filter((_, i) => vals[i] > k).join(", ") || "없음"} → ${count}가지`,
  };
});

export const graphMissing = word("l2-graph-missing", (rand) => {
  const { kinds, vals, total } = survey(rand, 1, 6);
  const k = randInt(rand, 0, 3);
  const minOther = Math.min(...vals.filter((_, i) => i !== k));
  if (vals[k] <= minOther) return null;
  const g = look(rand);
  return {
    key: `${kinds.join()}:${vals.join()}:${k}:${g.dir}${g.mark}`,
    prompt: `${total}명이 좋아하는 운동을 조사하여 그래프로 나타냈는데 ${kinds[k]} 부분이 지워졌습니다. ${josa(kinds[k], "을/를")} 좋아하는 학생은 가장 적은 학생이 좋아하는 운동보다 몇 명 더 많나요?`,
    visual: graphScene(kinds, vals, { ...g, hide: k, max: 7 }),
    answer: vals[k] - minOther,
    unit: "명",
    hint: "먼저 전체 학생 수에서 그래프에 있는 학생 수를 빼서 지워진 학생 수를 구해요.",
    explanation: `${kinds[k]}: ${total} − ${vals.filter((_, i) => i !== k).join(" − ")} = ${vals[k]}(명), 가장 적은 운동: ${minOther}명 → ${vals[k] - minOther}명`,
  };
});

/* ── 표와 그래프로 나타내기 ── */

export const graphFromList = easy("l2-graph-from-list", (rand) => {
  const cs = shapeCards(rand, randInt(rand, 8, 11));
  const k = randInt(rand, 0, 2);
  const cnt = countShapes(cs);
  return {
    key: `${cs.map((c) => c.shape + c.fill + c.big).join()}:${k}`,
    prompt: `친구들이 좋아하는 모양 카드를 한 장씩 골랐습니다. ○를 이용하여 그래프로 나타낼 때 ${SHAPES[k]}에는 ○를 몇 개 그려야 하나요?`,
    visual: cardsPic(cs),
    answer: cnt[k],
    unit: "개",
    hint: "친구 한 명을 ○ 하나로 나타내요.",
    explanation: `${SHAPES[k]} ${cnt[k]}명 → ○ ${cnt[k]}개`,
  };
});

export const graphComplete = mid("l2-graph-complete", (rand) => {
  const { kinds, vals } = survey(rand, 3, 7);
  const k = randInt(rand, 0, 3);
  const drawn = randInt(rand, 1, vals[k] - 1);
  const g = { ...look(rand), mark: "○" as const };
  return {
    key: `${kinds.join()}:${vals.join()}:${k}:${drawn}:${g.dir}`,
    prompt: `조사한 결과(${kinds.map((x, i) => `${x} ${vals[i]}명`).join(", ")})를 ○로 그래프에 나타내고 있습니다. ${kinds[k]}에는 ○를 몇 개 더 그려야 하나요?`,
    visual: graphScene(kinds, vals.map((v, i) => (i === k ? drawn : v)), { ...g, max: 7 }),
    answer: vals[k] - drawn,
    unit: "개",
    hint: `${kinds[k]}의 학생 수와 지금 그린 ○의 수를 비교해요.`,
    explanation: `${vals[k]} − ${drawn} = ${vals[k] - drawn}(개)`,
    mistakes: { [vals[k]]: "이미 그린 ○를 빼야 해요." },
  };
});

const TG_TRUE = ["가장 많은 것과 가장 적은 것을 한눈에 알아보기에는 그래프가 편리해요.", "조사한 전체 학생 수를 알아보기에는 합계가 있는 표가 편리해요."];
const TG_FALSE = ["가장 많은 것을 한눈에 알아보기에는 그래프보다 표가 더 편리해요.", "그래프를 보면 누가 무엇을 좋아하는지 알 수 있어요.", "표로 나타내면 조사한 자료보다 수가 늘어나요.", "그래프는 ○를 위에서부터 그려야 해요."];

export const tableOrGraph = mid("l2-table-or-graph", (rand) => {
  const answer = pick(rand, TG_TRUE);
  const choices = opts(rand, answer, shuffle(rand, TG_FALSE));
  if (!choices) return null;
  return {
    key: choices.join(),
    prompt: "표와 그래프에 대해 바르게 말한 것을 고르세요.",
    choices,
    answer,
    hint: "표는 수와 합계를, 그래프는 많고 적음을 한눈에 보여 줘요.",
    explanation: answer,
  };
});
