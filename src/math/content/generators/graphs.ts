import type { Generator } from "../types";
import { pick, randInt, shuffle } from "../../lib/random";
import { numberProblem } from "./common";
import { josa } from "../josa";

/* ── 4-1 막대그래프 ── */

const STEPS = [1, 2, 5, 10];

/** 주제마다 쓸 수 있는 눈금 한 칸의 크기와 가장 큰 값(한 반에서 안경 쓴 학생이 40~90명이 되지 않게) */
const TOPICS = [
  { title: "좋아하는 과일", items: ["사과", "배", "포도", "귤", "딸기", "복숭아"], unit: "명", steps: STEPS, max: 90 },
  { title: "좋아하는 운동", items: ["축구", "피구", "줄넘기", "수영", "야구", "배구"], unit: "명", steps: STEPS, max: 90 },
  { title: "반별 안경 쓴 학생 수", items: ["1반", "2반", "3반", "4반", "5반"], unit: "명", steps: [1, 2], max: 14 },
  { title: "모은 빈 병 수", items: ["가 모둠", "나 모둠", "다 모둠", "라 모둠"], unit: "개", steps: STEPS, max: 90 },
];

/** 항목 4~5개와 서로 다른 값(최대·최소가 하나씩 정해지게) */
function barData(rand: () => number) {
  const topic = pick(rand, TOPICS);
  const step = pick(rand, topic.steps);
  const n = Math.min(topic.items.length, randInt(rand, 4, 5));
  const labels = shuffle(rand, topic.items).slice(0, n);
  const set = new Set<number>();
  const top = Math.min(9, Math.floor(topic.max / step));
  while (set.size < n) set.add(randInt(rand, 1, top) * step);
  const d = { title: topic.title, unit: topic.unit, labels, values: shuffle(rand, [...set]) };
  return { d, step, visual: { kind: "bars" as const, title: d.title, labels: d.labels, values: d.values, unit: d.unit, step } };
}

export const barRead: Generator = {
  id: "bar-read",
  level: 1,
  make(rand) {
    const { d, step, visual } = barData(rand);
    const i = randInt(rand, 0, d.labels.length - 1);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${d.labels.join()}:${d.values.join()}:${i}`,
      prompt: `막대그래프를 보고 ${josa(d.labels[i], "은/는")} 몇 ${d.unit}인지 쓰세요.`,
      visual: { ...visual, asked: [i] },
      answer: d.values[i],
      fields: [d.unit],
      hint: `세로 눈금 한 칸은 ${josa(`${step}${d.unit}`, "이에요/예요")}.`,
      explanation: `${d.labels[i]}의 막대 끝은 ${d.values[i]}에 닿아요.`,
      mistakes: step > 1 ? { [d.values[i] / step]: `눈금 칸 수만 셌어요. 한 칸은 ${josa(`${step}${d.unit}`, "이에요/예요")}.` } : {},
    });
  },
};

export const barMax: Generator = {
  id: "bar-max",
  level: 1,
  make(rand) {
    const { d, visual } = barData(rand);
    const most = rand() < 0.5;
    const target = most ? Math.max(...d.values) : Math.min(...d.values);
    const answer = d.labels[d.values.indexOf(target)];
    return {
      key: `${this.id}:${d.labels.join()}:${d.values.join()}:${most}`,
      typeId: this.id,
      prompt: `막대그래프에서 가장 ${most ? "많은" : "적은"} 항목을 고르세요.`,
      visual,
      input: "choice",
      choices: d.labels.slice(0, 4).includes(answer) ? d.labels.slice(0, 4) : [...d.labels.slice(0, 3), answer],
      answer,
      hint: `막대의 길이가 가장 ${most ? "긴" : "짧은"} 것을 찾아요.`,
      explanation: `${answer}(${target}${d.unit})`,
    };
  },
};

export const barDiff: Generator = {
  id: "bar-diff",
  level: 2,
  make(rand) {
    const { d, visual } = barData(rand);
    const [i, j] = shuffle(rand, d.labels.map((_, k) => k)).slice(0, 2);
    const total = rand() < 0.4;
    const answer = total ? d.values.reduce((a, b) => a + b, 0) : Math.abs(d.values[i] - d.values[j]);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${d.labels.join()}:${d.values.join()}:${total ? "t" : `${i}:${j}`}`,
      prompt: total
        ? `막대그래프에 나타낸 ${josa(d.title, "은/는")} 모두 몇 ${d.unit}인가요?`
        : `${josa(d.labels[i], "과/와")} ${d.labels[j]}의 차는 몇 ${d.unit}인가요?`,
      visual,
      answer,
      fields: [d.unit],
      hint: total ? "모든 막대가 나타내는 수를 더해요." : "두 막대가 나타내는 수를 각각 읽고 큰 수에서 작은 수를 빼요.",
      explanation: total ? `${d.values.join(" + ")} = ${answer}` : `${Math.max(d.values[i], d.values[j])} − ${Math.min(d.values[i], d.values[j])} = ${answer}`,
    });
  },
};

/* ── 4-2 꺾은선그래프 ── */

export type LineTopic = {
  id: "temp" | "plant" | "visit";
  title: string;
  labels: string[];
  unit: string;
  /** 문장 속 이름: 기온, 키, 방문자 수 */
  item: string;
  /** 가장 ~ 때: 높을/낮을, 클/작을, 많을/적을 */
  high: string;
  low: string;
  /** 바로 전보다 ~ 때 */
  rise: string;
  /** 줄어들 수 없는 주제(키)는 없음 */
  fall?: string;
};

export const LINE_TOPICS: readonly LineTopic[] = [
  { id: "temp", title: "운동장의 기온", labels: ["오전 9시", "오전 11시", "오후 1시", "오후 3시", "오후 5시"], unit: "°C", item: "기온", high: "높을", low: "낮을", rise: "올라간", fall: "내려간" },
  { id: "plant", title: "강낭콩 싹의 키", labels: ["1일", "3일", "5일", "7일", "9일"], unit: "cm", item: "키", high: "클", low: "작을", rise: "자란" },
  { id: "visit", title: "월별 도서관 방문자 수", labels: ["3월", "4월", "5월", "6월", "7월"], unit: "명", item: "방문자 수", high: "많을", low: "적을", rise: "늘어난", fall: "줄어든" },
];

/** 세로 눈금이 너무 많아지지 않도록(0부터 그리므로) 가장 큰 값은 눈금 12칸 이하 */
const MAX_CELLS = 12;

/**
 * 주제에 맞는 값(눈금 칸 수): 기온은 봄날 10~24°C에서 오후 1~3시까지 오르다 내려가고,
 * 강낭콩 키는 늘기만 하며, 방문자 수는 오르내린다.
 */
function lineCells(rand: () => number, id: LineTopic["id"]): number[] {
  if (id === "temp") {
    const peak = randInt(rand, 2, 3);
    const cells = [randInt(rand, 5, 7)];
    for (let i = 1; i < 5; i++) cells.push(cells[i - 1] + (i <= peak ? 1 : -1) * randInt(rand, 1, 2));
    // 오후 5시가 오전 9시보다 춥지는 않게
    return cells[4] < cells[0] ? [] : cells;
  }
  if (id === "plant") {
    const cells = [randInt(rand, 1, 3)];
    for (let i = 1; i < 5; i++) cells.push(cells[i - 1] + randInt(rand, 1, 3));
    return cells;
  }
  const cells = [randInt(rand, 3, 7)];
  for (let i = 1; i < 5; i++) cells.push(cells[i - 1] + pick(rand, [-2, -1, 1, 2, 3]));
  return cells;
}

/** 꺾은선그래프 자료 하나. ids로 주제를 고를 수 있고, ok를 만족할 때까지 다시 만든다 */
export function realLineData(rand: () => number, ids: readonly LineTopic["id"][] = ["temp", "plant", "visit"], ok: (values: number[]) => boolean = () => true) {
  const t = pick(rand, LINE_TOPICS.filter((x) => ids.includes(x.id)));
  // 도서관 방문자 수는 한 달에 수백 명(눈금 한 칸 50·100명)
  const step = t.id === "temp" ? 2 : t.id === "visit" ? pick(rand, [50, 100]) : pick(rand, [1, 2]);
  for (let tries = 0; tries < 200; tries++) {
    const cells = lineCells(rand, t.id);
    if (cells.length === 0 || Math.min(...cells) < 1 || Math.max(...cells) > MAX_CELLS) continue;
    const values = cells.map((c) => c * step);
    if (!ok(values)) continue;
    return { t, step, values, visual: { kind: "line" as const, title: t.title, labels: t.labels, values, unit: t.unit, step } };
  }
  throw new Error(`${t.title}: 조건에 맞는 꺾은선그래프 자료를 만들지 못했어요`);
}

/** 변화가 가장 큰 구간이 하나만 있는 자료 */
function lineData(rand: () => number) {
  return realLineData(rand, undefined, (values) => {
    const diffs = values.slice(1).map((v, i) => Math.abs(v - values[i]));
    return diffs.filter((x) => x === Math.max(...diffs)).length === 1;
  });
}

export const lineRead: Generator = {
  id: "line-read",
  level: 1,
  make(rand) {
    const { t, step, values, visual } = lineData(rand);
    const i = randInt(rand, 0, values.length - 1);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${t.title}:${values.join()}:${i}`,
      prompt: `꺾은선그래프를 보고 ${t.labels[i]}의 ${josa(t.item, "을/를")} 쓰세요.`,
      visual: { ...visual, asked: [i] },
      answer: values[i],
      fields: [t.unit],
      hint: `세로 눈금 한 칸은 ${josa(`${step}${t.unit}`, "이에요/예요")}.`,
      explanation: `${t.labels[i]}의 점은 ${values[i]}${t.unit}에 있어요.`,
      mistakes: step > 1 ? { [values[i] / step]: "눈금 칸 수만 셌어요." } : {},
    });
  },
};

export const lineBiggestChange: Generator = {
  id: "line-biggest-change",
  level: 2,
  make(rand) {
    const { t, values, visual } = lineData(rand);
    const intervals = t.labels.slice(1).map((l, i) => `${t.labels[i]}~${l}`);
    const diffs = values.slice(1).map((v, i) => Math.abs(v - values[i]));
    const answer = intervals[diffs.indexOf(Math.max(...diffs))];
    return {
      key: `${this.id}:${t.title}:${values.join()}`,
      typeId: this.id,
      prompt: t.fall ? `${t.item}의 변화가 가장 큰 때는 언제와 언제 사이인가요?` : `${josa(t.item, "이/가")} 가장 많이 ${t.rise} 때는 언제와 언제 사이인가요?`,
      visual,
      input: "choice",
      choices: intervals,
      answer,
      hint: "선이 가장 많이 기울어진 곳을 찾아요.",
      explanation: `${answer} 사이에 ${Math.max(...diffs)}${t.unit} 변했어요.`,
    };
  },
};

export const lineDiff: Generator = {
  id: "line-diff",
  level: 1,
  make(rand) {
    const { t, values, visual } = lineData(rand);
    const i = randInt(rand, 0, values.length - 2);
    const j = randInt(rand, i + 1, values.length - 1);
    const answer = Math.abs(values[j] - values[i]);
    if (answer === 0) return this.make(rand);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${t.title}:${values.join()}:${i}:${j}`,
      prompt: `${josa(t.labels[i], "과/와")} ${t.labels[j]}의 ${t.item} 차이는 얼마인가요?`,
      visual,
      answer,
      fields: [t.unit],
      hint: "두 점이 나타내는 값을 각각 읽고 빼요.",
      explanation: `${Math.max(values[i], values[j])} − ${Math.min(values[i], values[j])} = ${answer}`,
    });
  },
};

export const barSecond: Generator = {
  id: "bar-second",
  level: 2,
  make(rand) {
    const { d, visual } = barData(rand);
    const sorted = [...d.values].sort((a, b) => b - a);
    const answer = d.labels[d.values.indexOf(sorted[1])];
    return {
      key: `${this.id}:${d.labels.join()}:${d.values.join()}`,
      typeId: this.id,
      prompt: "막대그래프에서 두 번째로 많은 항목을 고르세요.",
      visual,
      input: "choice",
      choices: d.labels.slice(0, 4).includes(answer) ? d.labels.slice(0, 4) : [...d.labels.slice(0, 3), answer],
      answer,
      hint: "막대의 길이를 긴 순서대로 늘어놓아 보세요.",
      explanation: `긴 순서: ${sorted.map((v) => d.labels[d.values.indexOf(v)]).join(", ")}`,
    };
  },
};

export const lineMax: Generator = {
  id: "line-max",
  level: 2,
  make(rand) {
    const { t, values, visual } = lineData(rand);
    const max = Math.max(...values);
    if (values.filter((v) => v === max).length > 1) return this.make(rand);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${t.title}:${values.join()}`,
      prompt: `꺾은선그래프에서 ${josa(t.item, "이/가")} 가장 ${t.high} 때와 가장 ${t.low} 때의 ${t.item} 차는 얼마인가요?`,
      visual,
      answer: max - Math.min(...values),
      fields: [t.unit],
      hint: "가장 위에 있는 점과 가장 아래에 있는 점을 찾아 값을 읽어요.",
      explanation: `${max} − ${Math.min(...values)} = ${max - Math.min(...values)}`,
    });
  },
};
