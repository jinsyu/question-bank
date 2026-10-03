import type { Visual } from "../types";
import { pick, randInt, shuffle } from "../../lib/random";
import { josa } from "../josa";
import { easy, hard, mid } from "./g3-kit";
import { pictograph, stickers, symbolsOf, type PictoRow } from "./g3-figures";

/**
 * 3학년 2학기 '자료의 정리(그림그래프)' 차시별 생성기.
 * 자료 수집은 붙임딱지 그림, 그림그래프는 ◉·△·○를 그린 그림으로 보여 준다(표는 표로).
 */

type Rand = () => number;

/** who: 항목 이름으로 '○○을 좋아하는 학생', '○○에 가 보고 싶은 학생'을 만든다(장소에는 '에') */
const likes = (x: string) => `${josa(x, "을/를")} 좋아하는 학생`;
const TOPICS = [
  { title: "좋아하는 과일", who: likes, items: ["사과", "배", "포도", "귤", "딸기"], unit: "명" },
  { title: "좋아하는 운동", who: likes, items: ["축구", "피구", "줄넘기", "수영", "야구"], unit: "명" },
  { title: "가 보고 싶은 곳", who: (x: string) => `${x}에 가 보고 싶은 학생`, items: ["바다", "산", "놀이공원", "박물관", "동물원"], unit: "명" },
];

/** 서로 다른 값을 가진 항목 n개 */
function table(rand: Rand, n: number, lo: number, hi: number) {
  const t = pick(rand, TOPICS);
  const labels = shuffle(rand, t.items).slice(0, n);
  const set = new Set<number>();
  for (let i = 0; set.size < n && i < 100; i++) set.add(randInt(rand, lo, hi));
  return { ...t, labels, values: shuffle(rand, [...set]) };
}

const tableVisual = (labels: string[], values: (number | string)[], total?: number): Visual => ({
  kind: "table",
  header: total === undefined ? labels : [...labels, "합계"],
  rows: [total === undefined ? values.map(String) : [...values.map(String), String(total)]],
});

/* ── 표 ── */

/** 표로 나타낸 조사: 반·모둠은 차례대로 둔다 */
const TABLE_TOPICS = [
  { title: "좋아하는 과일", items: ["사과", "배", "포도", "귤", "딸기"], unit: "명", ordered: false },
  { title: "좋아하는 운동", items: ["축구", "피구", "줄넘기", "수영", "야구"], unit: "명", ordered: false },
  { title: "반별 안경 쓴 학생 수", items: ["1반", "2반", "3반", "4반", "5반"], unit: "명", ordered: true },
  { title: "모둠별 모은 빈 병 수", items: ["가 모둠", "나 모둠", "다 모둠", "라 모둠"], unit: "개", ordered: true },
];

function tableData(rand: Rand) {
  const t = pick(rand, TABLE_TOPICS);
  const n = Math.min(t.items.length, randInt(rand, 4, 5));
  const labels = t.ordered ? t.items.slice(0, n) : shuffle(rand, t.items).slice(0, n);
  const set = new Set<number>();
  while (set.size < n) set.add(randInt(rand, 2, 9));
  return { ...t, labels, values: [...set] };
}

export const dataTableMissing = easy("data-table-missing", (rand) => {
  const d = tableData(rand);
  const total = d.values.reduce((a, b) => a + b, 0);
  const miss = randInt(rand, 0, d.labels.length - 1);
  return {
    key: `${d.labels.join()}:${d.values.join()}:${miss}`,
    prompt: `${josa(d.title, "을/를")} 조사하여 표로 나타냈습니다. ${josa(d.labels[miss], "은/는")} 몇 ${d.unit}인가요?`,
    visual: tableVisual(d.labels, d.values.map((v, i) => (i === miss ? "□" : v)), total),
    answer: d.values[miss],
    unit: d.unit,
    hint: "합계에서 나머지 항목의 수를 모두 빼요.",
    explanation: `${total} − ${d.values.filter((_, i) => i !== miss).join(" − ")} = ${d.values[miss]}(${d.unit})`,
  };
});

export const dataTableMost = easy("data-table-most", (rand) => {
  const d = tableData(rand);
  const most = rand() < 0.5;
  const target = most ? Math.max(...d.values) : Math.min(...d.values);
  const answer = d.labels[d.values.indexOf(target)];
  return {
    key: `${d.labels.join()}:${d.values.join()}:${most}`,
    prompt: `${josa(d.title, "을/를")} 조사하여 표로 나타냈습니다. 수가 가장 ${most ? "많은" : "적은"} 항목을 고르세요.`,
    visual: tableVisual(d.labels, d.values),
    answer,
    choices: d.labels.slice(0, 4).includes(answer) ? d.labels.slice(0, 4) : [...d.labels.slice(0, 3), answer],
    hint: "수를 하나씩 비교해 보세요.",
    explanation: `가장 ${most ? "많은" : "적은"} 것은 ${answer}(${target}${d.unit})입니다.`,
  };
});

export const tableTimes = mid("l3-tbl-times", (rand) => {
  const t = pick(rand, TOPICS);
  const labels = shuffle(rand, t.items).slice(0, 4);
  const v = randInt(rand, 2, 4);
  const k = randInt(rand, 2, 4);
  const mids = [randInt(rand, v + 1, v * k - 1), randInt(rand, v + 1, v * k - 1)];
  const values = shuffle(rand, [v, v * k, ...mids]);
  return {
    key: `${labels.join()}:${values.join()}`,
    prompt: `${josa(t.title, "을/를")} 조사하여 표로 나타냈습니다. 가장 많은 항목의 학생 수는 가장 적은 항목의 학생 수의 몇 배인가요?`,
    visual: tableVisual(labels, values),
    answer: k,
    unit: "배",
    hint: "가장 많은 수와 가장 적은 수를 찾아 나눗셈으로 몇 배인지 구해요.",
    explanation: `${v * k} ÷ ${v} = ${k}(배)`,
    mistakes: { [v * k - v]: "차가 아니라 몇 배인지 구해요." },
  };
});

export const tableCond = hard("l3-tbl-cond", (rand) => {
  const d = table(rand, 4, 2, 9);
  const [a, b] = [d.values[0], d.values[1]];
  if (a <= b) return null;
  const total = d.values.reduce((x, y) => x + y, 0);
  return {
    key: `${d.labels.join()}:${d.values.join()}`,
    prompt: `${josa(d.title, "을/를")} 조사하여 표로 나타냈습니다. ${d.who(d.labels[0])}은 ${d.who(d.labels[1])}보다 ${a - b}명 많습니다. ${d.who(d.labels[0])}은 몇 명인가요?`,
    visual: tableVisual(d.labels, ["□", "□", d.values[2], d.values[3]], total),
    answer: a,
    unit: "명",
    hint: "합계에서 알고 있는 수를 빼면 빈칸 두 개의 합이 나와요. 두 수의 차도 알고 있어요.",
    explanation: `두 빈칸의 합: ${total} − ${d.values[2]} − ${d.values[3]} = ${a + b}, 차: ${a - b} → ${a + b} + ${a - b} = ${2 * a}, ${2 * a} ÷ 2 = ${a}(명)`,
    mistakes: { [b]: "더 많은 쪽을 구해야 해요.", [a + b]: "두 빈칸의 합이에요. 한 항목의 수를 구해요." },
  };
});

/* ── 자료 수집: 학생들이 붙인 붙임딱지 ── */

function raw(rand: Rand) {
  const t = pick(rand, TOPICS);
  const labels = shuffle(rand, t.items).slice(0, 3);
  const counts = labels.map(() => randInt(rand, 2, 7));
  if (new Set(counts).size < 3) return null;
  const list = shuffle(
    rand,
    labels.flatMap((l, i) => Array(counts[i]).fill(l) as string[]),
  );
  return { t, labels, counts, list, visual: stickers(list) };
}

export const collectCount = easy("l3-col-count", (rand) => {
  const r = raw(rand);
  if (!r) return null;
  const i = randInt(rand, 0, 2);
  return {
    key: `${r.list.join()}:${i}`,
    prompt: `학생들이 ${josa(r.t.title, "을/를")} 붙임딱지에 하나씩 적어 붙였습니다. ${josa(r.labels[i], "을/를")} 적은 학생은 몇 명인가요?`,
    visual: r.visual,
    answer: r.counts[i],
    unit: "명",
    hint: "센 붙임딱지에 표시를 하며 빠뜨리거나 두 번 세지 않도록 해요.",
    explanation: `${r.labels[i]}: ${r.counts[i]}명`,
  };
});

export const collectDiff = mid("l3-col-diff", (rand) => {
  const r = raw(rand);
  if (!r) return null;
  const max = Math.max(...r.counts);
  const min = Math.min(...r.counts);
  return {
    key: r.list.join(),
    prompt: `학생들이 ${josa(r.t.title, "을/를")} 붙임딱지에 하나씩 적어 붙였습니다. 가장 많은 학생이 적은 것과 가장 적은 학생이 적은 것의 학생 수의 차는 몇 명인가요?`,
    visual: r.visual,
    answer: max - min,
    unit: "명",
    hint: "붙임딱지를 항목별로 세어 표로 정리한 뒤 비교해요.",
    explanation: r.labels.map((l, i) => `${l} ${r.counts[i]}명`).join(", ") + ` → ${max} − ${min} = ${max - min}(명)`,
  };
});

export const collectMost = mid("l3-col-most", (rand) => {
  const r = raw(rand);
  if (!r) return null;
  const most = rand() < 0.5;
  const target = most ? Math.max(...r.counts) : Math.min(...r.counts);
  const answer = r.labels[r.counts.indexOf(target)];
  const extra = r.t.items.find((x) => !r.labels.includes(x))!;
  return {
    key: `${r.list.join()}:${most}`,
    prompt: `학생들이 ${josa(r.t.title, "을/를")} 붙임딱지에 하나씩 적어 붙였습니다. 가장 ${most ? "많은" : "적은"} 학생이 적은 것을 고르세요.`,
    visual: r.visual,
    answer,
    choices: shuffle(rand, [...r.labels, extra]),
    hint: "항목별로 세어 표로 나타내 보세요.",
    explanation: r.labels.map((l, i) => `${l} ${r.counts[i]}명`).join(", ") + ` → ${answer}`,
  };
});

export const collectRev = hard("l3-col-rev", (rand) => {
  const t = pick(rand, TOPICS);
  const [x, y, z] = shuffle(rand, t.items).slice(0, 3);
  const a = randInt(rand, 5, 12);
  const k = randInt(rand, 1, a - 2);
  const c = randInt(rand, 2, 10);
  const n = a + (a - k) + c;
  return {
    key: `${x}${y}${z}:${a}:${k}:${c}`,
    prompt: `우리 반 학생 ${n}명이 ${josa(t.title, "을/를")} 하나씩 골랐습니다. ${josa(x, "을/를")} 고른 학생은 ${a}명이고, ${josa(y, "을/를")} 고른 학생은 ${josa(x, "을/를")} 고른 학생보다 ${k}명 적습니다. 나머지 학생은 모두 ${josa(z, "을/를")} 골랐다면 ${josa(z, "을/를")} 고른 학생은 몇 명인가요?`,
    answer: c,
    unit: "명",
    hint: `먼저 ${josa(y, "을/를")} 고른 학생 수를 구해요.`,
    explanation: `${y}: ${a} − ${k} = ${a - k}(명), ${z}: ${n} − ${a} − ${a - k} = ${c}(명)`,
    mistakes: { [n - a - (a + k)]: `${josa(y, "을/를")} 고른 학생은 ${x}보다 적어요.` },
  };
});

export const collectTwo = hard("l3-col-two", (rand) => {
  const t = pick(rand, TOPICS);
  const labels = shuffle(rand, t.items).slice(0, 4);
  const boys = labels.map(() => randInt(rand, 1, 8));
  const girls = labels.map(() => randInt(rand, 1, 8));
  const sum = boys.map((b, i) => b + girls[i]);
  const max = Math.max(...sum);
  if (sum.filter((s) => s === max).length > 1) return null;
  // 한쪽 표만 보면 답이 달라지도록
  if (boys.indexOf(Math.max(...boys)) === sum.indexOf(max) && girls.indexOf(Math.max(...girls)) === sum.indexOf(max)) return null;
  const answer = labels[sum.indexOf(max)];
  return {
    key: `${labels.join()}:${boys.join()}:${girls.join()}`,
    prompt: `남학생과 여학생이 ${josa(t.title, "을/를")} 조사하여 표로 나타냈습니다. 남학생과 여학생을 합하여 가장 많은 학생이 고른 것을 고르세요.`,
    visual: { kind: "table", header: ["구분", ...labels], rows: [["남학생", ...boys.map(String)], ["여학생", ...girls.map(String)]] },
    answer,
    choices: labels,
    hint: "항목마다 남학생과 여학생의 수를 더해 비교해요.",
    explanation: labels.map((l, i) => `${l} ${sum[i]}명`).join(", ") + ` → ${answer}`,
  };
});

/* ── 그림그래프 ── */

/** 그림그래프 주제: 항목 이름표, 값 범위(현실적인 수), 단위 */
const PICTO = [
  { title: "마을별 학생 수", head: ["마을", "학생 수"], items: ["가 마을", "나 마을", "다 마을", "라 마을", "마 마을"], unit: "명", lo: 12, hi: 45 },
  { title: "마을별 나무 수", head: ["마을", "나무 수"], items: ["가 마을", "나 마을", "다 마을", "라 마을", "마 마을"], unit: "그루", lo: 11, hi: 49 },
  { title: "반별 모은 빈 병 수", head: ["반", "빈 병 수"], items: ["1반", "2반", "3반", "4반", "5반"], unit: "개", lo: 11, hi: 42 },
  { title: "가게별 팔린 귤 상자 수", head: ["가게", "상자 수"], items: ["가 가게", "나 가게", "다 가게", "라 가게"], unit: "상자", lo: 11, hi: 45 },
] as const;

/** 항목 n개(4~5개)와 서로 다른 값, 그림그래프 그림 */
function picto(rand: Rand, opts: { units?: number[]; blank?: number; topic?: (typeof PICTO)[number] } = {}) {
  const t = opts.topic ?? pick(rand, PICTO);
  const n = Math.min(t.items.length, randInt(rand, 4, 5));
  const labels: string[] = t.items.slice(0, n);
  const set = new Set<number>();
  for (let i = 0; set.size < n && i < 200; i++) set.add(randInt(rand, t.lo, t.hi));
  const values = [...set];
  const units = opts.units ?? [10, 1];
  const rows: PictoRow[] = labels.map((label, i) => ({ label, value: i === opts.blank ? null : values[i] }));
  return { t, labels, values, units, visual: pictograph([t.head[0], t.head[1]], rows, units, t.unit) };
}

const countSyms = (v: number, units: number[]) => units.map((u) => symbolsOf(v, units).filter((x) => x === u).length);

export const dataPicto = mid("data-picto", (rand) => {
  const p = picto(rand);
  const ask = randInt(rand, 0, p.labels.length - 1);
  const v = p.values[ask];
  const [big, small] = countSyms(v, p.units);
  return {
    key: `${p.t.title}:${p.values.join()}:${ask}`,
    prompt: `${josa(p.t.title, "을/를")} 조사하여 그림그래프로 나타냈습니다. ${p.labels[ask]}의 ${p.t.head[1]}는 몇 ${p.t.unit}인가요?`,
    visual: p.visual,
    answer: v,
    unit: p.t.unit,
    hint: "큰 그림 ◉는 10, 작은 그림 ○는 1을 나타내요. 큰 그림부터 세어요.",
    explanation: `◉ ${big}개, ○ ${small}개 → ${big * 10} + ${small} = ${v}(${p.t.unit})`,
    mistakes: { [big + small]: "큰 그림도 1로 셌어요." },
  };
});

export const pictoTens = easy("e3-picto-tens", (rand) => {
  const p = picto(rand);
  const ask = randInt(rand, 0, p.labels.length - 1);
  const v = p.values[ask];
  const [big, small] = countSyms(v, p.units);
  return {
    key: `${p.t.title}:${p.values.join()}:${ask}`,
    prompt: `${josa(p.t.title, "을/를")} 그림그래프로 나타냈습니다. ${p.labels[ask]}에 그린 큰 그림 ◉와 작은 그림 ○는 각각 몇 개인가요?`,
    visual: p.visual,
    answer: `${big},${small}`,
    unit: ["개(◉)", "개(○)"],
    hint: "그 항목의 줄에서 큰 그림과 작은 그림을 따로 세어요.",
    explanation: `${p.labels[ask]}: ◉ ${big}개, ○ ${small}개 → ${v}${p.t.unit}`,
  };
});

export const pictoMost = mid("l3-pic-most", (rand) => {
  const p = picto(rand);
  const most = rand() < 0.5;
  const target = most ? Math.max(...p.values) : Math.min(...p.values);
  const answer = p.labels[p.values.indexOf(target)];
  return {
    key: `${p.t.title}:${p.values.join()}:${most}`,
    prompt: `${josa(p.t.title, "을/를")} 조사하여 그림그래프로 나타냈습니다. 수가 가장 ${most ? "많은" : "적은"} 곳을 고르세요.`,
    visual: p.visual,
    answer,
    choices: p.labels.slice(0, 4).includes(answer) ? p.labels.slice(0, 4) : [...p.labels.slice(0, 3), answer],
    hint: "큰 그림의 수를 먼저 비교하고, 같으면 작은 그림의 수를 비교해요.",
    explanation: p.labels.map((l, i) => `${l} ${p.values[i]}${p.t.unit}`).join(", ") + ` → ${answer}`,
  };
});

export const pictoMoney = hard("l3-pic-money", (rand) => {
  const p = picto(rand, { topic: PICTO[3] });
  const per = pick(rand, [10, 20, 30]);
  const max = Math.max(...p.values);
  const top = p.labels[p.values.indexOf(max)];
  return {
    key: `${p.values.join()}:${per}`,
    prompt: `가게별로 팔린 귤 상자 수를 그림그래프로 나타냈습니다. 귤이 한 상자에 ${per}개씩 들어 있다면, 가장 많이 판 가게에서 판 귤은 모두 몇 개인가요?`,
    visual: p.visual,
    answer: max * per,
    unit: "개",
    hint: "그림그래프에서 가장 많이 판 가게의 상자 수를 먼저 읽어요.",
    explanation: `${top} ${max}상자 → ${max} × ${per} = ${max * per}(개)`,
    mistakes: { [max]: "상자 수에 한 상자에 든 귤의 수를 곱해야 해요." },
  };
});

export const pictoSum = hard("w3-picto-sum", (rand) => {
  const p = picto(rand, { topic: PICTO[1] });
  const [i, j] = shuffle(rand, p.labels.map((_, k) => k)).slice(0, 2);
  const s = p.values[i] + p.values[j];
  return {
    key: `${p.values.join()}:${i}:${j}`,
    prompt: `마을별 나무 수를 그림그래프로 나타냈습니다. ${josa(p.labels[i], "과/와")} ${p.labels[j]}의 나무는 모두 몇 그루인가요?`,
    visual: p.visual,
    answer: s,
    unit: "그루",
    hint: "두 마을의 나무 수를 각각 읽은 뒤 더해요.",
    explanation: `${p.values[i]} + ${p.values[j]} = ${s}(그루)`,
  };
});


/* ── 그림그래프로 나타내기 ── */

export const drawIcons = easy("l3-draw-icons", (rand) => {
  const blank = randInt(rand, 0, 3);
  const p = picto(rand, { topic: PICTO[0], blank });
  const v = p.values[blank];
  const [big, small] = countSyms(v, p.units);
  return {
    key: `${p.values.join()}:${blank}`,
    prompt: `마을별 학생 수를 그림그래프로 나타내고 있습니다. ${p.labels[blank]}의 학생은 ${v}명입니다. ${p.labels[blank]}에 큰 그림 ◉와 작은 그림 ○를 각각 몇 개 그려야 하나요?`,
    visual: p.visual,
    answer: `${big},${small}`,
    unit: ["개(◉)", "개(○)"],
    hint: "◉는 10명, ○는 1명을 나타내요. 십의 자리 숫자만큼 ◉, 일의 자리 숫자만큼 ○를 그려요.",
    explanation: `${v}명 = ${[10 * big, small].filter(Boolean).map((x) => `${x}명`).join(" + ")} → ◉ ${big}개, ○ ${small}개`,
    mistakes: { [`${small},${big}`]: "큰 그림은 10명을 나타내요." },
  };
});

export const drawIcons3 = mid("l3-draw-icons3", (rand) => {
  const blank = randInt(rand, 0, 3);
  const p = picto(rand, { topic: PICTO[0], blank, units: [10, 5, 1] });
  const v = p.values[blank];
  if (v % 10 < 5) return null;
  const [t, f, o] = countSyms(v, p.units);
  return {
    key: `${p.values.join()}:${blank}`,
    prompt: `◉는 10명, △는 5명, ○는 1명을 나타내는 그림그래프입니다. ${p.labels[blank]}의 학생은 ${v}명입니다. 그림의 수를 가장 적게 하여 나타낼 때 ◉, △, ○를 각각 몇 개 그려야 하나요?`,
    visual: p.visual,
    answer: `${t},${f},${o}`,
    unit: ["개(◉)", "개(△)", "개(○)"],
    hint: "큰 그림부터 최대한 많이 그려요. 일의 자리가 5 이상이면 △를 먼저 써요.",
    explanation: `${v}명 = ${[10 * t, 5 * f, o].filter(Boolean).map((x) => `${x}명`).join(" + ")} → ◉ ${t}개, △ ${f}개, ○ ${o}개`,
    mistakes: { [`${t},0,${v % 10}`]: "△(5명)를 쓰면 그림 수를 줄일 수 있어요." },
  };
});

export const drawTotal = mid("l3-draw-total", (rand) => {
  const d = table(rand, 4, 11, 49);
  const bigs = d.values.reduce((s, v) => s + Math.floor(v / 10), 0);
  const smalls = d.values.reduce((s, v) => s + (v % 10), 0);
  const askBig = rand() < 0.5;
  return {
    key: `${d.values.join()}:${askBig}`,
    prompt: `표를 ◉(10명)와 ○(1명)를 사용한 그림그래프로 나타내려고 합니다. ${askBig ? "◉" : "○"}는 모두 몇 개 그려야 하나요?`,
    visual: tableVisual(d.labels, d.values),
    answer: askBig ? bigs : smalls,
    unit: "개",
    hint: "항목마다 필요한 그림의 수를 구해 더해요.",
    explanation: d.labels.map((l, i) => `${l} ${askBig ? Math.floor(d.values[i] / 10) : d.values[i] % 10}개`).join(" + ") + ` = ${askBig ? bigs : smalls}(개)`,
  };
});

export const drawMissing = hard("l3-draw-missing", (rand) => {
  const blank = randInt(rand, 0, 3);
  const p = picto(rand, { topic: PICTO[0], blank });
  const total = p.values.reduce((x, y) => x + y, 0);
  const v = p.values[blank];
  return {
    key: `${p.values.join()}:${blank}`,
    prompt: `마을별 학생 수를 그림그래프로 나타내다가 ${p.labels[blank]}의 그림을 그리지 못했습니다. ${p.labels.length === 4 ? "네" : "다섯"} 마을의 학생은 모두 ${total}명입니다. ${p.labels[blank]}에 ◉와 ○를 각각 몇 개 그려야 하나요?`,
    visual: p.visual,
    answer: `${Math.floor(v / 10)},${v % 10}`,
    unit: ["개(◉)", "개(○)"],
    hint: "그림그래프에서 다른 마을의 학생 수를 읽고, 합계에서 빼서 빈 마을의 학생 수를 먼저 구해요.",
    explanation: `${total} − ${p.values.filter((_, j) => j !== blank).join(" − ")} = ${v}(명) → ◉ ${Math.floor(v / 10)}개, ○ ${v % 10}개`,
  };
});

export const drawSave = hard("l3-draw-save", (rand) => {
  const d = table(rand, 3, 11, 49);
  const two = d.values.reduce((s, v) => s + Math.floor(v / 10) + (v % 10), 0);
  const three = d.values.reduce((s, v) => s + Math.floor(v / 10) + (v % 10 >= 5 ? 1 + (v % 10) - 5 : v % 10), 0);
  if (two === three) return null;
  return {
    key: d.values.join(),
    prompt: `표를 그림그래프로 나타내려고 합니다. ◉(10명), ○(1명) 두 가지로 그릴 때보다 ◉(10명), △(5명), ○(1명) 세 가지로 그리면 그림을 모두 몇 개 덜 그려도 되나요?`,
    visual: tableVisual(d.labels, d.values),
    answer: two - three,
    unit: "개",
    hint: "일의 자리가 5 이상인 항목은 ○ 5개 대신 △ 1개를 그릴 수 있어요.",
    explanation: `두 가지: ${two}개, 세 가지: ${three}개 → ${two - three}개 덜`,
  };
});

/* ── 해석하기 ── */

const FARMS = ["가 농장", "나 농장", "다 농장", "라 농장"];

/** 농장별 사과 생산량(◉ 100상자, ○ 10상자). blank에 있는 농장은 빈칸 */
function hundredPicto(rand: Rand, blank: number[] = []) {
  const set = new Set<number>();
  while (set.size < 4) set.add(randInt(rand, 1, 4) * 100 + randInt(rand, 0, 9) * 10);
  const values = [...set];
  const rows = FARMS.map((label, i) => ({ label, value: blank.includes(i) ? null : values[i] }));
  return { values, visual: pictograph(["농장", "사과 생산량"], rows, [100, 10], "상자") };
}

export const useRead = easy("l3-use-read", (rand) => {
  const p = hundredPicto(rand);
  const i = randInt(rand, 0, 3);
  const v = p.values[i];
  return {
    key: `${p.values.join()}:${i}`,
    prompt: `농장별 사과 생산량을 그림그래프로 나타냈습니다. ${FARMS[i]}의 사과 생산량은 몇 상자인가요?`,
    visual: p.visual,
    answer: v,
    unit: "상자",
    hint: "◉는 100상자씩, ○는 10상자씩 세어 더해요.",
    explanation: `◉ ${Math.floor(v / 100)}개, ○ ${(v % 100) / 10}개 → ${v}상자`,
    mistakes: { [Math.floor(v / 100) * 10 + (v % 100) / 10]: "◉는 100상자, ○는 10상자를 나타내요." },
  };
});

export const useSum = mid("l3-use-sum", (rand) => {
  const p = hundredPicto(rand);
  const [i, j] = shuffle(rand, [0, 1, 2, 3]).slice(0, 2);
  return {
    key: `${p.values.join()}:${i}:${j}`,
    prompt: `농장별 사과 생산량을 그림그래프로 나타냈습니다. ${josa(FARMS[i], "과/와")} ${FARMS[j]}의 사과 생산량은 모두 몇 상자인가요?`,
    visual: p.visual,
    answer: p.values[i] + p.values[j],
    unit: "상자",
    hint: "두 농장의 생산량을 각각 읽고 더해요.",
    explanation: `${p.values[i]} + ${p.values[j]} = ${p.values[i] + p.values[j]}(상자)`,
  };
});

export const usePlan = mid("l3-use-plan", (rand) => {
  const d = table(rand, 4, 3, 15);
  const max = Math.max(...d.values);
  const answer = d.labels[d.values.indexOf(max)];
  return {
    key: `${d.labels.join()}:${d.values.join()}`,
    prompt: `${josa(d.title, "을/를")} 조사한 표입니다. 반 행사에서 가장 많은 학생이 좋아하도록 한 가지를 정하려면 무엇으로 정하는 것이 좋을까요?`,
    visual: tableVisual(d.labels, d.values),
    answer,
    choices: d.labels,
    hint: "가장 많은 학생이 고른 항목을 찾아요.",
    explanation: `${answer}(${max}명)이 가장 많아요.`,
  };
});

export const useCompare = hard("l3-use-compare", (rand) => {
  const labels = shuffle(rand, ["우유", "주스", "코코아", "식혜"]);
  const before = labels.map(() => randInt(rand, 10, 40));
  const inc = labels.map(() => randInt(rand, 1, 15));
  if (new Set(inc).size < 4) return null;
  const after = before.map((b, i) => b + inc[i]);
  const most = Math.max(...inc);
  const answer = labels[inc.indexOf(most)];
  // 이번 달에 가장 많이 팔린 것과 가장 많이 늘어난 것이 다르게
  if (after.indexOf(Math.max(...after)) === inc.indexOf(most)) return null;
  return {
    key: `${before.join()}:${after.join()}`,
    prompt: "매점에서 지난달과 이번 달에 팔린 음료의 수를 조사한 표입니다. 지난달보다 판매량이 가장 많이 늘어난 음료를 고르세요.",
    visual: { kind: "table", header: ["구분", ...labels], rows: [["지난달(잔)", ...before.map(String)], ["이번 달(잔)", ...after.map(String)]] },
    answer,
    choices: labels,
    mistakes: { [labels[after.indexOf(Math.max(...after))]]: "이번 달에 가장 많이 팔린 것이 아니라 가장 많이 늘어난 것을 찾아요." },
    hint: "음료마다 (이번 달) − (지난달)을 구해 비교해요.",
    explanation: labels.map((l, i) => `${l} ${inc[i]}잔`).join(", ") + ` → ${answer}`,
  };
});

export const useCond = hard("l3-use-cond", (rand) => {
  const p = hundredPicto(rand, [0, 1]);
  const [a, b] = [p.values[0], p.values[1]];
  const bigger = a > b ? 0 : 1;
  return {
    key: p.values.join(),
    prompt: `농장별 사과 생산량을 그림그래프로 나타내다가 가 농장과 나 농장의 그림을 그리지 못했습니다. 두 농장의 생산량의 합은 ${a + b}상자이고, ${josa(FARMS[bigger], "이/가")} ${FARMS[1 - bigger]}보다 ${Math.abs(a - b)}상자 더 많습니다. 가 농장의 생산량은 몇 상자인가요?`,
    visual: p.visual,
    answer: a,
    unit: "상자",
    hint: "합과 차를 이용해요: 합과 차를 더한 뒤 2로 나누면 큰 수예요.",
    explanation: `큰 수: ${a + b} + ${Math.abs(a - b)} = ${2 * Math.max(a, b)}, ${2 * Math.max(a, b)} ÷ 2 = ${Math.max(a, b)}, 작은 수: ${Math.min(a, b)} → 가 농장 ${a}상자`,
    mistakes: { [b]: "가 농장과 나 농장을 바꾸어 구했어요." },
  };
});
