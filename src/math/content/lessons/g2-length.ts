import type { ShapeScene } from "../types";
import { pick, randInt, shuffle } from "../../lib/random";
import { josa, NAMES, opts } from "./g2";
import { barsScene, cmBarScene, column, easy, GA, meterStick, mid, type Pt, rulerScene, spansScene, tapeWin, word } from "./g2-pics";

/**
 * 2-1 4단원·2-2 3단원 길이 재기: 자·줄자·1 m 자·색 테이프 그림을 보고 길이를 읽고 비교한다.
 * 수는 교과서 범위(2-1: 15 cm 안팎, 2-2: 몇 m 몇 cm의 받아올림·받아내림 없는 계산)에 맞춘다.
 */

const rep = (a: number, n: number) => Array(n).fill(a).join(" + ");
const mcm = (n: number) => `${Math.floor(n / 100)},${n % 100}`;
/** 1 m 5 cm, 2 m(0 cm는 쓰지 않는다) */
export const fmt = (n: number) => (n % 100 ? `${Math.floor(n / 100)} m ${n % 100} cm` : `${n / 100} m`);

/* ═══ 2-1 여러 가지 단위로 재기 ═══ */

/** 막대(줄마다) 아래에 단위 물건을 이어 놓은 그림 */
function unitScene(rowsOf: { name?: string; n: number }[], unit: string): ShapeScene {
  const u = 26;
  const left = rowsOf.some((r) => r.name) ? 36 : 10;
  const polygons: NonNullable<ShapeScene["polygons"]> = [];
  const texts: NonNullable<ShapeScene["texts"]> = [];
  rowsOf.forEach((r, k) => {
    const y = 10 + k * 56;
    polygons.push({ fill: true, points: [[left, y], [left + u * r.n, y], [left + u * r.n, y + 18], [left, y + 18]] });
    for (let i = 0; i < r.n; i++) polygons.push({ points: [[left + 2 + u * i, y + 26], [left - 2 + u * (i + 1), y + 26], [left - 2 + u * (i + 1), y + 42], [left + 2 + u * i, y + 42]] });
    if (r.name) texts.push({ at: [16, y + 9], text: r.name });
  });
  const maxN = Math.max(...rowsOf.map((r) => r.n));
  return { kind: "shape", width: left + u * maxN + 12, height: 10 + rowsOf.length * 56, label: `${josa(unit, "으로/로")} 잰 그림: ${rowsOf.map((r) => `${r.name ?? "막대"} ${r.n}개`).join(", ")}`, polygons, texts };
}

export const unitDiff = mid("l2-unit-diff", (rand) => {
  const unit = pick(rand, ["클립", "지우개"]);
  const a = randInt(rand, 5, 9);
  const b = randInt(rand, 2, a - 1);
  return {
    key: `${unit}:${a}:${b}`,
    prompt: `색 테이프 ㉮와 ㉯의 길이를 ${josa(unit, "으로/로")} 재었습니다. ㉮는 ㉯보다 ${unit} 몇 개만큼 더 긴가요?`,
    visual: unitScene([{ name: "㉮", n: a }, { name: "㉯", n: b }], unit),
    answer: a - b,
    unit: "개",
    hint: "같은 단위로 잰 횟수끼리 비교해요.",
    explanation: `㉮ ${unit} ${a}개, ㉯ ${unit} ${b}개 → ${a} − ${b} = ${a - b}(개)`,
  };
});

export const unitThree = word("l2-unit-three", (rand) => {
  const unit = pick(rand, ["클립", "지우개"]);
  const ns = shuffle(rand, [3, 4, 5, 6, 7, 8, 9]).slice(0, 3);
  const names = GA.slice(0, 3);
  const max = Math.max(...ns);
  const min = Math.min(...ns);
  return {
    key: `${unit}:${ns.join()}`,
    prompt: `색 테이프 ㉮, ㉯, ㉰의 길이를 ${josa(unit, "으로/로")} 재었습니다. 가장 긴 색 테이프는 가장 짧은 색 테이프보다 ${unit} 몇 개만큼 더 긴가요?`,
    visual: unitScene(ns.map((n, i) => ({ name: names[i], n })), unit),
    answer: max - min,
    unit: "개",
    hint: "먼저 세 색 테이프를 잰 횟수를 각각 세어 가장 긴 것과 가장 짧은 것을 찾아요.",
    explanation: `${names.map((m, i) => `${m} ${ns[i]}개`).join(", ")} → ${max} − ${min} = ${max - min}(개)`,
    mistakes: { [max]: "가장 긴 것만 세었어요. 차를 구해야 해요." },
  };
});

/* ═══ 1 cm ═══ */

export const cmRead = easy("l2-cm-read", (rand) => {
  const n = randInt(rand, 3, 12);
  return {
    key: `${n}`,
    prompt: "막대는 1 cm가 몇 번인 길이인지 세어 보세요. 막대의 길이는 몇 cm인가요?",
    visual: cmBarScene(n),
    answer: n,
    unit: "cm",
    hint: "1 cm 칸을 하나씩 세어요. 1 cm가 ■번이면 ■ cm예요.",
    explanation: `1 cm가 ${n}번 → ${n} cm`,
  };
});

export const tapeOverlap = word("l2-tape-overlap", (rand) => {
  const a = randInt(rand, 8, 15);
  const b = randInt(rand, 2, 4);
  const sc = 12;
  return {
    key: `${a}:${b}`,
    prompt: `길이가 ${a} cm인 색 테이프 2장을 그림과 같이 ${b} cm만큼 겹치게 이어 붙였습니다. 이어 붙인 색 테이프의 전체 길이는 몇 cm인가요?`,
    visual: barsScene(
      [[{ from: 0, to: a, text: `${a} cm` }], [{ from: a - b, to: 2 * a - b, text: `${a} cm` }]],
      `${a} cm 색 테이프 2장을 ${b} cm 겹쳐 이은 그림`,
      { scale: sc, total: { from: 0, to: 2 * a - b, text: "? cm" } },
    ),
    answer: 2 * a - b,
    unit: "cm",
    hint: "두 장의 길이를 더한 뒤, 겹친 부분만큼 빼요.",
    explanation: `${a} + ${a} − ${b} = ${2 * a - b}(cm)`,
    mistakes: { [2 * a]: "겹친 부분을 빼지 않았어요." },
  };
});

/* ═══ 자로 재기 ═══ */

export const rulerFromTo = mid("l2-ruler-from-to", (rand) => {
  const a = randInt(rand, 2, 5);
  const b = randInt(rand, a + 3, 12);
  return {
    key: `${a}:${b}`,
    prompt: "색 테이프의 길이는 몇 cm인가요?",
    visual: rulerScene([{ start: a, end: b }], `자 위의 색 테이프, 눈금 ${a}부터 ${b}까지`),
    answer: b - a,
    unit: "cm",
    hint: `눈금 ${a}부터 ${b}까지 1 cm가 몇 번 들어가는지 세어요.`,
    explanation: `${a}부터 ${b}까지 1 cm가 ${b - a}번 → ${b - a} cm`,
    mistakes: { [b]: "끝 눈금을 그대로 읽었어요." },
  };
});

export const rulerLongest = mid("l2-ruler-longest", (rand) => {
  const names = GA.slice(0, 4);
  const spans = names.map(() => {
    const s = randInt(rand, 0, 4);
    return [s, s + randInt(rand, 3, 8)] as [number, number];
  });
  const lens = spans.map(([s, e]) => e - s);
  if (new Set(lens).size < 4 || spans.some(([, e]) => e > 12)) return null;
  const long = rand() < 0.5;
  const t = long ? Math.max(...lens) : Math.min(...lens);
  return {
    key: `${spans.flat().join(":")}:${long}`,
    prompt: `자로 막대 ㉮, ㉯, ㉰, ㉱의 길이를 재었습니다. 길이가 가장 ${long ? "긴" : "짧은"} 막대를 고르세요.`,
    visual: rulerScene(spans.map(([start, end], i) => ({ start, end, name: names[i] })), `자 위의 막대 ${spans.map(([s, e], i) => `${names[i]} ${s}~${e}`).join(", ")}`),
    choices: names,
    answer: names[lens.indexOf(t)],
    hint: "막대마다 시작 눈금부터 끝 눈금까지 1 cm가 몇 번인지 세어요. 끝 눈금만 보면 안 돼요.",
    explanation: names.map((m, i) => `${m} ${lens[i]} cm`).join(", "),
  };
});

export const rulerError = word("l2-ruler-error", (rand) => {
  const s = randInt(rand, 1, 4);
  const e = s + randInt(rand, 3, 7);
  const name = pick(rand, NAMES);
  const answer = `끝 눈금만 읽었어요. ${s}부터 ${e}까지 1 cm가 ${e - s}번이므로 ${e - s} cm예요.`;
  const choices = opts(rand, answer, [`시작 눈금을 더해야 해요. 바른 길이는 ${e + s} cm예요.`, `끝 눈금을 읽었으니 맞아요. 길이는 ${e} cm예요.`, `눈금을 하나 덜 셌어요. 바른 길이는 ${e + 1} cm예요.`]);
  if (!choices) return null;
  return {
    key: `${s}:${e}`,
    prompt: `${josa(name, "은/는")} 막대의 길이를 ${e} cm라고 했습니다. 잘못된 까닭과 바른 길이를 고르세요.`,
    visual: rulerScene([{ start: s, end: e }], `자 위에 놓인 막대, ${s}부터 ${e}까지`),
    choices,
    answer,
    hint: `${s}부터 ${e}까지 1 cm가 몇 번 들어가는지 세어요. 자는 아무 눈금에서 시작해도 잴 수 있어요.`,
    explanation: `${e} − ${s} = ${e - s}(cm). 한쪽 끝을 0에 맞추지 않아도 1 cm가 몇 번인지 세면 길이를 알 수 있어요.`,
  };
});

export const rulerJoin = word("l2-ruler-join", (rand) => {
  const s1 = randInt(rand, 0, 3);
  const e1 = s1 + randInt(rand, 3, 7);
  const s2 = randInt(rand, 1, 4);
  const e2 = s2 + randInt(rand, 3, 7);
  if (e1 > 12 || e2 > 12) return null;
  return {
    key: `${s1}:${e1}:${s2}:${e2}`,
    prompt: "자로 막대 ㉮와 ㉯의 길이를 재었습니다. 두 막대를 겹치지 않게 길게 이어 놓으면 몇 cm인가요?",
    visual: rulerScene([{ start: s1, end: e1, name: "㉮" }, { start: s2, end: e2, name: "㉯" }], `자 위의 막대 ㉮ ${s1}~${e1}, ㉯ ${s2}~${e2}`),
    answer: e1 - s1 + e2 - s2,
    unit: "cm",
    hint: "두 막대의 길이를 각각 구한 뒤 더해요.",
    explanation: `㉮ ${e1 - s1} cm, ㉯ ${e2 - s2} cm → ${e1 - s1} + ${e2 - s2} = ${e1 - s1 + e2 - s2}(cm)`,
    mistakes: { [e1 + e2]: "끝 눈금을 그대로 더했어요." },
  };
});

/* ═══ 약 몇 cm ═══ */

const FRAC = [0.2, 0.3, 0.7, 0.8];

export const aboutCm = easy("l2-about-cm", (rand) => {
  const whole = randInt(rand, 3, 9);
  const frac = pick(rand, FRAC);
  const answer = Math.round(whole + frac);
  return {
    key: `${whole + frac}`,
    prompt: "막대의 길이는 약 몇 cm인가요?",
    visual: rulerScene([{ start: 0, end: whole + frac }], `자 위에 놓인 막대, 0부터 ${josa(whole, "과/와")} ${whole + 1} 사이까지`),
    answer,
    unit: "cm",
    hint: "막대의 끝이 가까운 쪽의 눈금을 읽고, 숫자 앞에 '약'을 붙여요.",
    explanation: `끝이 ${answer}에 더 가까우므로 약 ${answer} cm`,
    mistakes: { [frac < 0.5 ? answer + 1 : answer - 1]: "더 가까운 쪽 눈금을 골라야 해요." },
  };
});

export const aboutNear = mid("l2-about-near", (rand) => {
  const start = randInt(rand, 1, 3);
  const whole = randInt(rand, 3, 7);
  const frac = pick(rand, FRAC);
  const answer = Math.round(whole + frac);
  return {
    key: `${start}:${whole + frac}`,
    prompt: "막대의 길이는 약 몇 cm인가요?",
    visual: rulerScene([{ start, end: start + whole + frac }], `자 위에 놓인 막대, ${start}부터 ${josa(start + whole, "과/와")} ${start + whole + 1} 사이까지`),
    answer,
    unit: "cm",
    hint: "시작 눈금부터 1 cm가 몇 번쯤 들어가는지 세고, 끝이 더 가까운 눈금을 봐요.",
    explanation: `눈금 ${start}에서 시작하고 끝이 ${start + answer}에 더 가까우므로 1 cm가 약 ${answer}번 → 약 ${answer} cm`,
    mistakes: { [start + answer]: "끝 눈금을 그대로 읽었어요. 시작 눈금이 0이 아니에요." },
  };
});

export const aboutPick = mid("l2-about-pick", (rand) => {
  const names = GA.slice(0, 4);
  const bars = names.map((name) => {
    const w = randInt(rand, 3, 9);
    return { name, start: 0, end: w + pick(rand, FRAC) };
  });
  const approx = bars.map((b) => Math.round(b.end));
  if (new Set(approx).size < 4) return null;
  const k = randInt(rand, 0, 3);
  return {
    key: bars.map((b) => b.end).join(),
    prompt: `길이가 약 ${approx[k]} cm인 막대를 고르세요.`,
    visual: rulerScene(bars, `자 위의 막대 ${bars.map((b) => `${b.name} 0~${b.end}`).join(", ")}`),
    choices: names,
    answer: names[k],
    hint: "막대마다 끝이 어느 눈금에 더 가까운지 살펴보세요.",
    explanation: names.map((m, i) => `${m} 약 ${approx[i]} cm`).join(", "),
  };
});

export const aboutError = word("l2-about-error", (rand) => {
  const a = randInt(rand, 4, 10);
  const nearHigh = rand() < 0.5;
  const right = nearHigh ? a + 1 : a;
  const said = nearHigh ? a : a + 1;
  const name = pick(rand, NAMES);
  const answer = `끝이 ${right}에 더 가까우므로 약 ${right} cm예요.`;
  const choices = opts(rand, answer, [`끝이 ${said}에 더 가까우므로 약 ${said} cm예요.`, `${josa(a, "과/와")} ${a + 1} 사이이므로 약 ${a + a + 1} cm예요.`, `눈금 사이에 있으면 길이를 알 수 없어요.`]);
  if (!choices) return null;
  const end = a + (nearHigh ? 0.8 : 0.2);
  return {
    key: `${a}:${nearHigh}:${name}`,
    prompt: `${josa(name, "은/는")} 막대의 길이를 약 ${said} cm라고 했습니다. 바르게 고친 것을 고르세요.`,
    visual: rulerScene([{ start: 0, end }], `자 위에 놓인 막대, 0부터 ${josa(a, "과/와")} ${a + 1} 사이까지`),
    choices,
    answer,
    hint: "눈금 사이에 있을 때는 더 가까운 쪽의 눈금을 읽어요.",
    explanation: answer,
  };
});

export const aboutLonger = word("l2-about-longer", (rand) => {
  const s = randInt(rand, 1, 3);
  const a = randInt(rand, 4, 9) + pick(rand, FRAC);
  const b = randInt(rand, 4, 9) + pick(rand, FRAC);
  const [ra, rb] = [Math.round(a), Math.round(b)];
  if (ra === rb || s + b > 12) return null;
  const longer = ra > rb ? "㉮" : "㉯";
  return {
    key: `${s}:${a}:${b}`,
    prompt: "막대 ㉮와 ㉯ 중 더 긴 막대의 길이는 약 몇 cm인가요?",
    visual: rulerScene([{ start: 0, end: a, name: "㉮" }, { start: s, end: s + b, name: "㉯" }], `자 위의 막대 ㉮ 0~${a}, ㉯ ${s}~${s + b}`),
    answer: Math.max(ra, rb),
    unit: "cm",
    hint: "㉯는 눈금 0에서 시작하지 않아요. 두 막대가 각각 1 cm가 약 몇 번인지 세어 비교해요.",
    explanation: `㉮ 약 ${ra} cm, ㉯ 약 ${rb} cm → 더 긴 막대는 ${longer}, 약 ${Math.max(ra, rb)} cm`,
    mistakes: { [Math.round(s + b)]: "㉯의 끝 눈금을 그대로 읽었어요." },
  };
});

/* ═══ 길이 어림하기 ═══ */

export const estimatePic = easy("l2-estimate-pic", (rand) => {
  const k = randInt(rand, 4, 9);
  const u = 22;
  const answer = `약 ${k} cm`;
  const choices = opts(rand, answer, [`약 ${k + 6} cm`, `약 ${k * 10} cm`, `약 ${Math.max(1, k - 3)} cm`]);
  if (!choices) return null;
  return {
    key: `${k}:${choices.join()}`,
    prompt: "왼쪽 위의 길이가 1 cm입니다. 1 cm를 생각하며 색 테이프의 길이를 어림한 것으로 알맞은 것을 고르세요.",
    visual: {
      kind: "shape",
      width: 24 + k * u,
      height: 70,
      label: "1 cm 표시와 색 테이프",
      lines: [{ from: [12, 14], to: [12 + u, 14], arrows: "both" }],
      texts: [{ at: [12 + u + 26, 14], text: "1 cm" }],
      polygons: [{ fill: true, points: [[12, 34], [12 + k * u, 34], [12 + k * u, 54], [12, 54]] }],
    },
    choices,
    answer,
    hint: "1 cm가 몇 번쯤 들어갈지 눈으로 이어 보며 어림해요.",
    explanation: `1 cm가 약 ${k}번 들어가므로 ${answer}예요.`,
  };
});

export const estimateClosest = mid("l2-estimate-closest", (rand) => {
  const real = randInt(rand, 6, 11);
  const names = shuffle(rand, NAMES).slice(0, 4);
  const offs = shuffle(rand, [1, 2, 3, 4]);
  const guesses = offs.map((o) => real + (rand() < 0.5 || real - o < 2 ? o : -o));
  const best = names[offs.indexOf(Math.min(...offs))];
  return {
    key: `${real}:${guesses.join()}`,
    prompt: `끈의 길이를 어림한 뒤 자로 재어 보았습니다. ${names.map((n, i) => `${n}: 약 ${guesses[i]} cm`).join(", ")} — 실제 길이에 가장 가깝게 어림한 사람은 누구인가요?`,
    visual: rulerScene([{ start: 0, end: real }], `자로 잰 끈, 0부터 ${real}까지`),
    choices: names,
    answer: best,
    hint: "먼저 자로 잰 실제 길이를 읽고, 어림한 길이와의 차가 가장 작은 사람을 찾아요.",
    explanation: `실제 ${real} cm → ${names.map((n, i) => `${n} ${offs[i]} cm 차이`).join(", ")}`,
  };
});

export const estimateHand = mid("l2-estimate-hand", (rand) => {
  const n = randInt(rand, 4, 7);
  const name = pick(rand, NAMES);
  return {
    key: `${n}`,
    prompt: `${name}의 한 뼘은 약 10 cm입니다. ${josa(name, "이/가")} 책상의 긴 쪽을 그림과 같이 뼘으로 재었습니다. 책상의 긴 쪽은 약 몇 cm인가요?`,
    visual: spansScene(n, 44, `책상을 뼘으로 ${n}번 잰 그림`, { name: "책상의 긴 쪽", unitText: "한 뼘" }),
    answer: 10 * n,
    unit: "cm",
    hint: `한 뼘이 약 10 cm이므로 10 cm를 뼘의 수만큼 더해요.`,
    explanation: `${n}뼘 → ${rep(10, n)} = ${10 * n} → 약 ${10 * n} cm`,
    mistakes: { [n]: "뼘의 수만 세었어요." },
  };
});

export const estimateJudge = word("l2-estimate-judge", (rand) => {
  const [n1, n2] = shuffle(rand, NAMES);
  const s = randInt(rand, 1, 2);
  const real = randInt(rand, 6, 9);
  const g1 = real + pick(rand, [-3, -2, 2, 3]);
  const g2 = real + pick(rand, [-1, 1, -3, 3]);
  const d1 = Math.abs(g1 - real);
  const d2 = Math.abs(g2 - real);
  if (d1 === d2) return null;
  const who = d1 < d2 ? n1 : n2;
  return {
    key: `${s}:${real}:${g1}:${g2}`,
    prompt: `${josa(n1, "은/는")} 리본의 길이를 약 ${g1} cm, ${josa(n2, "은/는")} 약 ${g2} cm로 어림했습니다. 자로 재어 보니 그림과 같았습니다. 실제 길이에 더 가깝게 어림한 사람은 누구인가요?`,
    visual: rulerScene([{ start: s, end: s + real }], `자로 잰 리본, 눈금 ${s}부터 ${s + real}까지`),
    // 정답이 늘 ①·②에 오지 않게 섞는다
    choices: shuffle(rand, [n1, n2, "두 사람이 똑같이 가깝게 어림했어요.", "자로 재어도 알 수 없어요."]),
    answer: who,
    hint: "리본이 눈금 0에서 시작하지 않아요. 먼저 실제 길이를 구한 뒤 어림한 길이와의 차를 비교해요.",
    explanation: `실제 길이 ${s + real} − ${s} = ${real}(cm), ${n1} ${d1} cm 차이, ${n2} ${d2} cm 차이 → ${who}`,
  };
});

export const estimateTwo = word("l2-estimate-two", (rand) => {
  const k = randInt(rand, 2, 4);
  const pencil = pick(rand, [12, 13, 14, 15, 16]);
  const total = 10 * k + pencil;
  return {
    key: `${k}:${pencil}`,
    prompt: `내 한 뼘은 약 10 cm이고, 연필 한 자루는 약 ${pencil} cm입니다. 책상의 짧은 쪽을 재었더니 ${k}뼘과 연필 한 자루의 길이만큼이었습니다. 책상의 짧은 쪽은 약 몇 cm인가요?`,
    answer: total,
    unit: "cm",
    hint: `먼저 ${k}뼘이 약 몇 cm인지 구해요.`,
    explanation: `${rep(10, k)} = ${10 * k}, ${10 * k} + ${pencil} = ${total} → 약 ${total} cm`,
  };
});

/* ═══ 2-2 cm보다 더 큰 단위 ═══ */

/** 막대를 이어 1 m가 넘는 길이: 1 m 0 cm처럼 cm가 0인 답이 나오지 않게 100 cm는 빼고, 10 cm·20 cm 막대를 섞는다 */
export const mRead = easy("l2-m-read", (rand) => {
  const bar = pick(rand, [10, 10, 10, 20]);
  const k = bar === 10 ? randInt(rand, 11, 16) : randInt(rand, 6, 7);
  const sc = 2.2;
  return {
    key: `${bar}:${k}`,
    prompt: `길이가 ${bar} cm인 막대 ${k}개를 겹치지 않게 이어 놓았습니다. 이어 놓은 길이는 몇 m 몇 cm인가요?`,
    visual: barsScene([Array.from({ length: k }, (_, i) => ({ from: i * bar, to: (i + 1) * bar, text: i === 0 ? `${bar} cm` : undefined, fill: i % 2 === 0 }))], `${bar} cm 막대 ${k}개를 이은 그림`, { scale: sc }),
    answer: mcm(k * bar),
    unit: ["m", "cm"],
    hint: `${bar} cm 막대 ${100 / bar}개가 100 cm = 1 m예요.`,
    explanation: `${bar} cm가 ${k}개 → ${k * bar} cm = ${fmt(k * bar)}`,
    mistakes: { [`${k},0`]: "막대의 수를 그대로 썼어요." },
  };
});

export const mStick = mid("l2-m-stick", (rand) => {
  const len = randInt(rand, 3, 9) * 10 + pick(rand, [0, 0, 5]);
  return {
    key: `${len}`,
    prompt: "1 m 자 위에 끈을 놓았습니다. 끈의 길이는 1 m보다 몇 cm 더 짧은가요?",
    visual: meterStick(len, `1 m 자 위의 끈, 0부터 ${len} cm까지`),
    answer: 100 - len,
    unit: "cm",
    hint: "1 m는 100 cm예요. 먼저 끈의 길이를 읽어요.",
    explanation: `끈 ${len} cm, 100 − ${len} = ${100 - len}(cm)`,
    mistakes: { [len]: "끈의 길이를 썼어요. 1 m와의 차를 구해야 해요." },
  };
});

export const mJudge = word("l2-m-judge", (rand) => {
  const [n1, n2] = shuffle(rand, NAMES);
  const a = randInt(rand, 110, 190);
  const b = randInt(rand, 110, 190);
  if (a === b || a % 100 === 0 || Math.abs(a - b) < 5 || Math.max(a, b) % 100 < Math.min(a, b) % 100) return null;
  return {
    key: `${a}:${b}`,
    prompt: `${n1}의 끈은 ${fmt(a)}, ${n2}의 끈은 ${b} cm입니다. 더 긴 끈은 더 짧은 끈보다 몇 cm 더 긴가요?`,
    visual: barsScene([[{ from: 0, to: a, text: fmt(a), name: "㉮" }], [{ from: 0, to: b, text: `${b} cm`, name: "㉯" }]], `${n1}의 끈 ㉮ ${fmt(a)}, ${n2}의 끈 ㉯ ${b} cm`, { scale: 1.6 }),
    answer: Math.abs(a - b),
    unit: "cm",
    hint: `${fmt(a)}를 cm로 바꾸어 비교해요.`,
    explanation: `${fmt(a)} = ${a} cm, ${Math.max(a, b)} − ${Math.min(a, b)} = ${Math.abs(a - b)}(cm)`,
  };
});

/* ═══ 2-2 자로 길이 재기(줄자) ═══ */

export const tapeFrom = mid("l2-tape-from", (rand) => {
  const s = randInt(rand, 1, 3) * 10;
  const len = randInt(rand, 110, 180);
  const e = s + len;
  if (e % 100 < s % 100 || e % 10 === 0) return null;
  const w1 = s - 10;
  const w2 = Math.floor(e / 10) * 10 - 20;
  return {
    key: `${s}:${e}`,
    prompt: "줄자로 긴 막대의 길이를 재었습니다. 그림은 막대의 한쪽 끝과 다른 쪽 끝 부분을 크게 나타낸 것입니다. 막대의 길이는 몇 m 몇 cm인가요?",
    visual: column([tapeWin(w1, [s, w1 + 30], ""), tapeWin(w2, [w2, e], "")], `줄자 두 부분: 막대의 한쪽 끝 ${s} cm, 다른 쪽 끝 ${e} cm`, ["한쪽 끝", "다른 쪽 끝"]),
    answer: mcm(len),
    unit: ["m", "cm"],
    hint: "끝 눈금에서 시작 눈금을 빼서 길이를 구해요.",
    explanation: `${e} − ${s} = ${len}(cm) = ${fmt(len)}`,
    mistakes: { [mcm(e)]: "끝 눈금을 그대로 읽었어요." },
  };
});

export const tapeMeterStick = mid("l2-tape-meter-stick", (rand) => {
  const k = randInt(rand, 2, 3);
  const c = randInt(rand, 2, 8) * 10;
  const sc = 0.9;
  return {
    key: `${k}:${c}`,
    prompt: "1 m 자로 칠판 긴 쪽의 길이를 재었더니 그림과 같았습니다. 칠판 긴 쪽의 길이는 몇 cm인가요?",
    visual: barsScene(
      [[...Array.from({ length: k }, (_, i) => ({ from: i * 100, to: (i + 1) * 100, text: "1 m", fill: i % 2 === 0 })), { from: k * 100, to: k * 100 + c, text: `${c} cm`, fill: k % 2 === 0 }]],
      `1 m 자로 ${k}번 재고 ${c} cm 남은 그림`,
      { scale: sc },
    ),
    answer: k * 100 + c,
    unit: "cm",
    hint: `1 m 자로 ${k}번은 ${k} m예요. 1 m = 100 cm`,
    explanation: `${k} m ${c} cm = ${k * 100 + c} cm`,
    mistakes: { [Number(`${k}${c}`)]: "m를 cm로 바꾸지 않고 숫자를 붙여 썼어요." },
  };
});

export const tapeDiff = word("l2-tape-diff", (rand) => {
  const a = randInt(rand, 120, 190);
  const b = randInt(rand, 110, 180);
  if (a === b || Math.abs(a - b) < 5 || a % 10 === 0 || b % 10 === 0) return null;
  const wa = Math.floor(a / 10) * 10 - 10;
  const wb = Math.floor(b / 10) * 10 - 10;
  const [n1, n2] = shuffle(rand, ["책꽂이", "사물함", "문", "칠판"]);
  return {
    key: `${a}:${b}`,
    prompt: `줄자의 눈금 0을 바닥에 맞추고 ${josa(n1, "과/와")} ${n2}의 높이를 재었습니다. 그림은 줄자의 윗부분입니다. 더 높은 것은 더 낮은 것보다 몇 cm 더 높은가요?`,
    visual: column([tapeWin(wa, [wa, a], ""), tapeWin(wb, [wb, b], "")], `${n1}의 높이 ${a} cm, ${n2}의 높이 ${b} cm를 나타낸 줄자`, [n1, n2]),
    answer: Math.abs(a - b),
    unit: "cm",
    hint: "두 줄자의 끝 눈금을 읽고 큰 수에서 작은 수를 빼요.",
    explanation: `${n1} ${a} cm, ${n2} ${b} cm → ${Math.max(a, b)} − ${Math.min(a, b)} = ${Math.abs(a - b)}(cm)`,
  };
});

/* ═══ 2-2 길이의 합과 차 ═══ */

/** 두 길이(받아올림 없음) */
function twoLens(rand: () => number): [number, number] {
  const a = randInt(rand, 1, 4) * 100 + randInt(rand, 10, 60);
  const b = randInt(rand, 1, 4) * 100 + randInt(rand, 5, 99 - (a % 100));
  return [a, b];
}

export const mAddPic = easy("l2-m-add-pic", (rand) => {
  const [a, b] = twoLens(rand);
  const sc = Math.min(0.7, 340 / (a + b));
  return {
    key: `${a}:${b}`,
    prompt: "두 색 테이프를 겹치지 않게 이었습니다. 이은 색 테이프의 전체 길이는 몇 m 몇 cm인가요?",
    visual: barsScene([[{ from: 0, to: a, text: fmt(a) }, { from: a, to: a + b, text: fmt(b), fill: false }]], `${fmt(a)}와 ${fmt(b)}를 이은 색 테이프`, { scale: sc, total: { from: 0, to: a + b, text: "? m ? cm" } }),
    answer: mcm(a + b),
    unit: ["m", "cm"],
    hint: "m는 m끼리, cm는 cm끼리 더해요.",
    explanation: `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}`,
  };
});

export const mAddMissing = mid("l2-m-add-missing", (rand) => {
  const [a, b] = twoLens(rand);
  const sc = Math.min(0.7, 340 / (a + b));
  return {
    key: `${a}:${b}`,
    prompt: `전체 길이가 ${fmt(a + b)}인 끈을 두 도막으로 잘랐습니다. 한 도막이 ${fmt(a)}일 때, 다른 도막의 길이는 몇 m 몇 cm인가요?`,
    visual: barsScene([[{ from: 0, to: a, text: fmt(a) }, { from: a, to: a + b, text: "? m ? cm", fill: false }]], `전체 ${fmt(a + b)}, 한 도막 ${fmt(a)}`, { scale: sc, total: { from: 0, to: a + b, text: fmt(a + b) } }),
    answer: mcm(b),
    unit: ["m", "cm"],
    hint: "전체 길이에서 아는 도막의 길이를 빼요. m는 m끼리, cm는 cm끼리 빼요.",
    explanation: `${fmt(a + b)} − ${fmt(a)} = ${fmt(b)}`,
  };
});

/** 교실 안 세 곳을 잇는 길: 두 길이의 합과 바로 가는 길의 차(받아올림·받아내림 없음) */
export const mRoute = word("l2-m-route", (rand) => {
  const x = randInt(rand, 2, 4) * 100 + randInt(rand, 10, 40);
  const y = randInt(rand, 2, 3) * 100 + randInt(rand, 10, 99 - (x % 100));
  const s = x + y;
  const d = randInt(rand, 1, 2) * 100 + randInt(rand, 1, s % 100);
  const z = s - d;
  if (z < 300) return null;
  const [p, q, r] = shuffle(rand, ["교탁", "사물함", "창문", "출입문"]).slice(0, 3);
  const A: Pt = [40, 140];
  const B: Pt = [150, 30];
  const C: Pt = [280, 140];
  return {
    key: `${x}:${y}:${d}`,
    prompt: `교실의 ${p}에서 ${r}까지 가는 두 길입니다. ${josa(q, "을/를")} 거쳐 가는 길은 바로 가는 길보다 몇 m 몇 cm 더 먼가요?`,
    visual: {
      kind: "shape",
      width: 320,
      height: 170,
      label: `${p}→${q} ${fmt(x)}, ${q}→${r} ${fmt(y)}, ${p}→${r} 바로 ${fmt(z)}`,
      lines: [{ from: A, to: B }, { from: B, to: C }, { from: A, to: C, dashed: true }],
      dots: [A, B, C],
      texts: [
        { at: [A[0], A[1] + 18], text: p },
        { at: [B[0], B[1] - 16], text: q },
        { at: [C[0], C[1] + 18], text: r },
        { at: [52, 76], text: fmt(x) },
        { at: [262, 76], text: fmt(y) },
        { at: [160, 158], text: fmt(z) },
      ],
    },
    answer: mcm(d),
    unit: ["m", "cm"],
    hint: `먼저 ${josa(q, "을/를")} 거쳐 가는 길의 길이를 구한 뒤 두 길의 차를 구해요.`,
    explanation: `${fmt(x)} + ${fmt(y)} = ${fmt(s)}, ${fmt(s)} − ${fmt(z)} = ${fmt(d)}`,
    mistakes: { [mcm(s)]: "두 길의 차까지 구해야 해요." },
  };
});

export const mSubPic = easy("l2-m-sub-pic", (rand) => {
  const b = randInt(rand, 1, 2) * 100 + randInt(rand, 10, 40);
  const a = b + randInt(rand, 1, 2) * 100 + randInt(rand, 5, 50);
  if (a % 100 < b % 100) return null;
  const sc = 0.7;
  return {
    key: `${a}:${b}`,
    prompt: "색 테이프 ㉮는 ㉯보다 몇 m 몇 cm 더 긴가요?",
    visual: barsScene([[{ from: 0, to: a, text: fmt(a), name: "㉮" }], [{ from: 0, to: b, text: fmt(b), name: "㉯" }]], `색 테이프 ㉮ ${fmt(a)}, ㉯ ${fmt(b)}`, { scale: sc }),
    answer: mcm(a - b),
    unit: ["m", "cm"],
    hint: "m는 m끼리, cm는 cm끼리 빼요.",
    explanation: `${fmt(a)} − ${fmt(b)} = ${fmt(a - b)}`,
  };
});

export const mSubStory = mid("l2-m-sub-story", (rand) => {
  const [n1, n2] = shuffle(rand, NAMES);
  const x = randInt(rand, 1, 2) * 100 + randInt(rand, 20, 90);
  const y = x - (x % 100) + randInt(rand, 0, (x % 100) - 5);
  if (y >= x || y < 100) return null;
  return {
    key: `${x}:${y}`,
    prompt: `멀리뛰기를 하여 뛴 곳에 깃발을 꽂았습니다. ${josa(n1, "은/는")} ${fmt(x)}, ${josa(n2, "은/는")} ${fmt(y)}를 뛰었습니다. ${josa(n1, "은/는")} ${n2}보다 몇 cm 더 멀리 뛰었나요?`,
    visual: barsScene([[{ from: 0, to: x, text: fmt(x), name: n1 }], [{ from: 0, to: y, text: fmt(y), name: n2 }]], `멀리뛰기 ${n1} ${fmt(x)}, ${n2} ${fmt(y)}`, { scale: 1.1 }),
    answer: x - y,
    unit: "cm",
    hint: "같은 단위끼리 빼요. m가 같으면 cm끼리만 빼면 돼요.",
    explanation: `${fmt(x)} − ${fmt(y)} = ${x - y} cm`,
  };
});

export const ropeCut = word("l2-rope-cut", (rand) => {
  const m = randInt(rand, 5, 8);
  const cm = randInt(rand, 60, 95);
  const c1 = randInt(rand, 1, 2) * 100 + randInt(rand, 10, 30);
  const c2 = randInt(rand, 1, 2) * 100 + randInt(rand, 10, cm - 45);
  const total = m * 100 + cm;
  const left = total - c1 - c2;
  if (left < 100 || c2 % 100 < 10) return null;
  const sc = 340 / total;
  return {
    key: `${total}:${c1}:${c2}`,
    prompt: `길이가 ${fmt(total)}인 끈에서 ${josa(fmt(c1), "과/와")} ${josa(fmt(c2), "을/를")} 잘라 썼습니다. 남은 끈의 길이는 몇 m 몇 cm인가요?`,
    visual: barsScene(
      [[{ from: 0, to: c1, text: fmt(c1), fill: false }, { from: c1, to: c1 + c2, text: fmt(c2), fill: false }, { from: c1 + c2, to: total, text: "?" }]],
      `끈 ${fmt(total)}에서 ${fmt(c1)}, ${fmt(c2)}를 잘라 쓴 그림`,
      { scale: sc, total: { from: 0, to: total, text: fmt(total) } },
    ),
    answer: mcm(left),
    unit: ["m", "cm"],
    hint: "처음 길이에서 잘라 쓴 길이를 차례로 빼요. m는 m끼리, cm는 cm끼리 빼요.",
    explanation: `${fmt(total)} − ${fmt(c1)} = ${fmt(total - c1)}, ${fmt(total - c1)} − ${fmt(c2)} = ${fmt(left)}`,
    mistakes: { [mcm(total - c1)]: "잘라 쓴 두 도막을 모두 빼야 해요." },
  };
});

/* ═══ 2-2 길이 어림하기 ═══ */

const M_THINGS = ["칠판의 긴 쪽", "게시판의 긴 쪽", "교실 앞쪽 벽", "복도 창문"];

export const mEstStick = easy("l2-m-est-stick", (rand) => {
  const n = randInt(rand, 2, 5);
  const frac = pick(rand, [0.1, 0.2, 0.8, 0.9]);
  const thing = pick(rand, M_THINGS);
  const answer = Math.round(n + frac);
  return {
    key: `${thing}:${n}:${frac}`,
    prompt: `1 m 자로 ${josa(thing, "을/를")} 재었더니 그림과 같았습니다. ${josa(thing, "은/는")} 약 몇 m인가요?`,
    // 그림 설명은 남은 길이(frac)까지 반영한다. 정답 수(약 n+1 m)는 쓰지 않는다
    visual: spansScene(n, 60, `${josa(thing, "을/를")} 1 m 자로 ${n}번 재고 ${frac < 0.5 ? "조금 남은" : "1 m에 조금 못 미치게 남은"} 그림`, { name: thing, unitText: "1 m", frac }),
    answer,
    unit: "m",
    hint: "1 m 자로 몇 번쯤 재었는지 보고, 남은 부분이 1 m의 반보다 긴지 짧은지 살펴보세요.",
    explanation: frac < 0.5 ? `1 m 자로 ${n}번 재고 조금 남았으므로 약 ${answer} m` : `1 m 자로 ${n}번 재고 1 m에 가까운 길이가 남았으므로 약 ${answer} m`,
  };
});

export const mEstStep = mid("l2-m-est-step", (rand) => {
  const k = randInt(rand, 2, 5) * 2;
  return {
    key: `${k}`,
    prompt: "내 걸음으로 두 걸음이 약 1 m입니다. 교실 뒤쪽 벽의 길이를 걸음으로 재었더니 그림과 같았습니다. 벽의 길이는 약 몇 m인가요?",
    visual: spansScene(k, 34, `벽을 걸음으로 ${k}번 잰 그림`, { name: "교실 뒤쪽 벽", unitText: "한 걸음" }),
    answer: k / 2,
    unit: "m",
    hint: "두 걸음씩 묶어 세면 몇 m인지 알 수 있어요.",
    explanation: `${k}걸음 = 두 걸음씩 ${k / 2}묶음 → 약 ${k / 2} m`,
    mistakes: { [k]: "걸음 수를 그대로 썼어요. 두 걸음이 약 1 m예요." },
  };
});

export const mEstTwo = word("l2-m-est-two", (rand) => {
  const a = randInt(rand, 3, 6);
  const b = randInt(rand, 2, a - 1);
  const [t1, t2] = shuffle(rand, ["칠판", "게시판", "사물함", "창문"]).slice(0, 2);
  const s1 = spansScene(a, 40, "", { name: t1, unitText: "양팔" });
  const s2 = spansScene(b, 40, "", { name: t2 });
  return {
    key: `${a}:${b}:${t1}`,
    prompt: `양팔을 벌린 길이가 약 1 m입니다. ${josa(t1, "과/와")} ${t2}의 긴 쪽을 양팔로 재었더니 그림과 같았습니다. ${josa(t1, "은/는")} ${t2}보다 약 몇 m 더 긴가요?`,
    visual: column([s1, s2], `${t1} 양팔 ${a}번, ${t2} 양팔 ${b}번`, undefined, 12),
    answer: a - b,
    unit: "m",
    hint: "양팔로 잰 횟수가 곧 약 몇 m인지를 나타내요.",
    explanation: `${t1} 약 ${a} m, ${t2} 약 ${b} m → 약 ${a - b} m`,
  };
});
