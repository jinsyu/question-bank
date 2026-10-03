import type { ShapeScene, Visual } from "../types";
import { pick, randInt, shuffle } from "../../lib/random";
import { MARKS, easy as easyBase, mid as midBase, names, opts, word as wordBase } from "./g4";
import { guard, rd, type Lines, type Make, type Texts } from "./g4-quad";
import { josa } from "../josa";
import { textBox } from "../figure-check";
import { realLineData, type LineTopic } from "../generators/graphs";

/**
 * 4학년 차시용 생성기(5): 4-1 막대그래프, 4-2 꺾은선그래프
 */

/** 그림 글자가 겹치거나 그림 밖으로 나가면 다시 뽑는다 */
const easy = (id: string, make: Make) => easyBase(id, guard(make));
const mid = (id: string, make: Make) => midBase(id, guard(make));
const word = (id: string, make: Make) => wordBase(id, guard(make));

/* ── 막대그래프 ── */

/** 도형으로 그린 그래프의 폭: 휴대폰에서 글자(14)가 12px 이상(14 × 248 ÷ 288 ≈ 12.1) */
export const GRAPH_W = 288;

const BAR_TOPICS = [
  { title: "좋아하는 과일별 학생 수", items: ["사과", "배", "포도", "귤", "딸기"], unit: "명" },
  { title: "좋아하는 운동별 학생 수", items: ["축구", "피구", "줄넘기", "수영", "야구"], unit: "명" },
  { title: "반별 모은 헌 종이 무게", items: ["1반", "2반", "3반", "4반", "5반"], unit: "kg" },
  { title: "마을별 심은 나무 수", items: ["가 마을", "나 마을", "다 마을", "라 마을"], unit: "그루" },
];

/** 수 뒤 단위: 영문 단위(kg)는 띄어 쓰고(20 kg), 한글 단위(명·그루)는 붙인다 */
const sp = (unit: string) => (/^[A-Za-z]/.test(unit) ? ` ${unit}` : unit);

/** 항목 4개, 값은 모두 다름 */
function bars(rand: () => number, stepPool = [1, 2, 5, 10]) {
  const t = pick(rand, BAR_TOPICS);
  const step = pick(rand, stepPool);
  const labels = shuffle(rand, t.items).slice(0, 4);
  const set = new Set<number>();
  while (set.size < 4) set.add(randInt(rand, 2, 10) * step);
  const values = shuffle(rand, [...set]);
  const visual: Visual = { kind: "bars", title: t.title, labels, values, unit: t.unit, step };
  return { ...t, step, labels, values, visual, key: `${t.title}:${labels.join()}:${values.join()}` };
}

type BarOpts = {
  /** 숫자를 적을 눈금(없으면 모두) */
  showTick?: (v: number) => boolean;
  /** 막대를 그리지 않을 항목 */
  hide?: number;
  /** 세로 눈금 칸 수(없으면 가장 큰 값보다 한 칸 더) */
  cells?: number;
  /** 문제가 그래프에서 읽어 내라고 묻는 항목(그림 설명에서 값을 뺀다) */
  asked?: number[];
};

/**
 * 도형 그래프의 그림 설명(화면 읽기): 제목·단위와 항목별 값. 묻는 항목은 값을 빼고, 그리지 않은 막대·점은 "없음".
 * 그래프 종류 이름은 쓰지 않는다(그래프 이름을 묻는 문제가 있다)
 */
function graphLabel(title: string, unit: string, labels: string[], values: (number | null)[], asked: number[] = [], note = ""): string {
  const shown = labels.map((l, i) => (asked.includes(i) ? null : values[i] === null ? `${l} 없음` : `${l} ${values[i]}`)).filter(Boolean);
  const parts = [`${title} 그래프${note}, 단위 ${unit}.`];
  if (shown.length) parts.push(`${shown.join(", ")}.`);
  if (asked.length) parts.push(`${asked.map((i) => labels[i]).join(", ")}의 값은 그래프에서 읽어 보세요.`);
  return parts.join(" ");
}

/**
 * 도형 그림으로 그린 막대그래프: 눈금 숫자를 지우거나 막대 하나를 빼고 보여 줄 때 쓴다.
 * 가로선·축은 가는 선(글자 겹침 검사에서 빠짐), 막대는 색칠한 사각형
 */
function barScene(title: string, labels: string[], values: number[], unit: string, step: number, o: BarOpts = {}): ShapeScene {
  // 360px 휴대폰(그림 폭 약 248px)에서 글자 14가 12px 이상이 되게 폭을 GRAPH_W로
  const W = GRAPH_W;
  const H = 236;
  const L = 46;
  const R = 10;
  const top = 44;
  const base = H - 34;
  const cells = o.cells ?? Math.max(...values.filter((_, i) => i !== o.hide)) / step + 1;
  const ch = (base - top) / cells;
  const band = (W - L - R) / labels.length;
  const y = (v: number) => rd(base - (v / step) * ch);
  const lines: Lines = [];
  const texts: Texts = [{ at: [W / 2, 14], text: title }, { at: [24, 24], text: `(${unit})` }];
  for (let k = 0; k <= cells; k++) {
    const v = k * step;
    lines.push({ from: [L, y(v)], to: [W - R, y(v)], width: k === 0 ? 1.5 : 0.6 });
    if (!o.showTick || o.showTick(v)) texts.push({ at: [L - 8 - String(v).length * 4, y(v)], text: String(v) });
  }
  lines.push({ from: [L, top - 6], to: [L, base], width: 1.5 });
  const polygons: NonNullable<ShapeScene["polygons"]> = [];
  labels.forEach((lab, i) => {
    const cx = L + band * (i + 0.5);
    texts.push({ at: [cx, base + 18], text: lab });
    if (i === o.hide) return;
    const x0 = rd(cx - band * 0.28);
    const x1 = rd(cx + band * 0.28);
    polygons.push({ fill: true, points: [[x0, base], [x1, base], [x1, y(values[i])], [x0, y(values[i])]] });
  });
  const label = graphLabel(title, unit, labels, values.map((v, i) => (i === o.hide ? null : v)), o.asked);
  return { kind: "shape", width: W, height: H, label, lines, polygons, texts };
}

export const l4BarScale = mid("l4-bar-scale", (rand) => {
  const d = bars(rand, [2, 5, 10]);
  const cells = randInt(rand, 2, 4);
  // 0과 한 눈금만 숫자를 남긴다
  return {
    key: `${d.key}:${cells}`,
    prompt: `막대그래프의 세로 눈금 숫자가 일부 지워졌습니다. 세로 눈금 한 칸은 몇 ${josa(d.unit, "을/를")} 나타내나요?`,
    visual: barScene(d.title, d.labels, d.values, d.unit, d.step, { showTick: (v) => v === 0 || v === cells * d.step }),
    answer: d.step,
    unit: d.unit,
    hint: "숫자가 적힌 눈금이 0에서 몇 칸 위에 있는지 세어, 그 수를 칸 수로 나누어요.",
    explanation: `${cells}칸이 ${cells * d.step}${sp(d.unit)} → ${cells * d.step} ÷ ${cells} = ${d.step}(${d.unit})`,
    mistakes: { [cells * d.step]: "칸 수로 나누지 않았어요." },
  };
});

export const w4BarTimes = word("w4-bar-times", (rand) => {
  const t = pick(rand, BAR_TOPICS.slice(0, 2));
  const small = randInt(rand, 2, 5);
  const k = randInt(rand, 2, 4);
  const labels = shuffle(rand, t.items).slice(0, 4);
  const others = shuffle(rand, [small + 1, small + 2, small * k - 1, small * k + 1, small + 3].filter((v) => v !== small * k && v > small)).slice(0, 2);
  const values = shuffle(rand, [small * k, small, ...others]);
  if (new Set(values).size < 4 || Math.min(...values) !== small) return null;
  const big = labels[values.indexOf(small * k)];
  const least = labels[values.indexOf(small)];
  const kind = t.title.startsWith("좋아하는 과일") ? "과일" : "운동";
  // 가장 적은 항목의 이름은 문제 글에 쓰지 않는다(그래프에서 찾는 단계)
  return {
    key: `${labels.join()}:${values.join()}`,
    prompt: `${josa(big, "을/를")} 좋아하는 학생 수는 좋아하는 학생 수가 가장 적은 ${josa(kind, "을/를")} 좋아하는 학생 수의 몇 배인가요?`,
    visual: { kind: "bars", title: t.title, labels, values, unit: t.unit, step: 1 },
    answer: k,
    unit: "배",
    hint: "두 막대가 나타내는 학생 수를 각각 읽고, 큰 수를 작은 수로 나누어요.",
    explanation: `${big} ${small * k}명, ${least} ${small}명 → ${small * k} ÷ ${small} = ${k}(배)`,
  };
});

export const l4BarScaleInfer = word("l4-bar-scale-infer", (rand) => {
  const d = bars(rand, [2, 5, 10]);
  const max = Math.max(...d.values);
  const target = d.labels[randInt(rand, 0, 3)];
  const v = d.values[d.labels.indexOf(target)];
  const maxLabel = d.labels[d.values.indexOf(max)];
  if (target === maxLabel) return null;
  return {
    key: `${d.key}:${target}`,
    prompt: `세로 눈금의 숫자가 모두 지워진 막대그래프입니다. ${josa(maxLabel, "이/가")} ${max}${sp(d.unit)}일 때, ${josa(target, "은/는")} 몇 ${d.unit}인가요?`,
    visual: barScene(d.title, d.labels, d.values, d.unit, d.step, { showTick: () => false, asked: [d.labels.indexOf(target)] }),
    answer: v,
    unit: d.unit,
    hint: `먼저 ${maxLabel}의 막대가 몇 칸인지 세어 눈금 한 칸의 크기를 구해요.`,
    explanation: `${maxLabel} ${max / d.step}칸이 ${max}${sp(d.unit)} → 한 칸 ${d.step}${sp(d.unit)}, ${target} ${v / d.step}칸 → ${d.step} × ${v / d.step} = ${v}(${d.unit})`,
    mistakes: { [v / d.step]: "칸 수만 답했어요." },
  };
});

export const l4BarMoreThan = mid("l4-bar-more-than", (rand) => {
  const d = bars(rand);
  const sorted = [...d.values].sort((a, b) => a - b);
  const k = randInt(rand, 0, 2);
  const cut = sorted[k];
  const more = rand() < 0.5;
  const count = d.values.filter((v) => (more ? v > cut : v < cut)).length;
  if (count === 0) return null;
  return {
    key: `${d.key}:${cut}:${more}`,
    prompt: `막대그래프에서 ${cut}${sp(d.unit)}보다 ${more ? "많은" : "적은"} 항목은 모두 몇 개인가요?`,
    visual: d.visual,
    answer: count,
    unit: "개",
    hint: `${josa(`${cut}${sp(d.unit)}`, "을/를")} 나타내는 눈금에 선을 긋고 막대 끝을 비교해요.`,
    explanation: `${d.labels.filter((_, i) => (more ? d.values[i] > cut : d.values[i] < cut)).join(", ")} → ${count}개`,
  };
});

export const w4BarMissing = word("w4-bar-missing", (rand) => {
  const labels = ["가", "나", "다", "라"];
  const vals = labels.map(() => randInt(rand, 2, 12));
  const total = vals.reduce((a, b) => a + b, 0);
  const miss = randInt(rand, 0, 3);
  if (vals[miss] === Math.max(...vals)) return null;
  return {
    key: `${vals.join()}:${miss}`,
    prompt: `모둠별로 모은 빈 병 수를 막대그래프로 나타냈는데 ${labels[miss]} 모둠의 막대가 지워졌습니다. 네 모둠이 모은 빈 병이 모두 ${total}개일 때 ${labels[miss]} 모둠은 몇 개를 모았나요?`,
    visual: barScene("모둠별 모은 빈 병 수", labels.map((l) => `${l} 모둠`), vals, "개", 1, { hide: miss, showTick: (v) => v % 2 === 0 }),
    answer: vals[miss],
    unit: "개",
    hint: "나머지 세 모둠의 막대를 읽어 더한 뒤, 전체에서 빼요.",
    explanation: `${total} − ${vals.filter((_, i) => i !== miss).join(" − ")} = ${vals[miss]}(개)`,
  };
});

export const l4BarCellsDiff = word("l4-bar-cells-diff", (rand) => {
  const b = bars(rand, [2, 5, 10]);
  const newStep = b.step * 2;
  // '새 눈금으로 다시 그린다'가 성립하도록 모든 값이 새 눈금 한 칸의 배수(처음 눈금으로는 2~10칸)
  const set = new Set<number>();
  while (set.size < 4) set.add(randInt(rand, 1, 5) * newStep);
  const values = shuffle(rand, [...set]);
  const d = { ...b, values, visual: { ...b.visual, values } as Visual, key: `${b.title}:${b.labels.join()}:${values.join()}` };
  // 비교할 두 막대(가장 긴·짧은 막대만이 아니라 아무 두 막대): 답이 1~4칸으로 고르게
  const [i, j] = shuffle(rand, [0, 1, 2, 3]).slice(0, 2);
  const [max, min] = [Math.max(values[i], values[j]), Math.min(values[i], values[j])];
  const ml = d.labels[d.values.indexOf(max)];
  const nl = d.labels[d.values.indexOf(min)];
  return {
    key: `${d.key}:${ml}:${nl}`,
    prompt: `이 막대그래프를 세로 눈금 한 칸이 ${newStep}${sp(d.unit)}인 막대그래프로 다시 그리려고 합니다. 다시 그린 그래프에서 ${ml}의 막대는 ${nl}의 막대보다 몇 칸 더 길까요?`,
    visual: d.visual,
    answer: (max - min) / newStep,
    unit: "칸",
    hint: "두 항목의 수를 읽어 차를 구한 뒤, 새 눈금 한 칸의 크기로 나누어요.",
    explanation: `${max} − ${min} = ${max - min}, ${max - min} ÷ ${newStep} = ${(max - min) / newStep}(칸)`,
    mistakes: { [(max - min) / d.step]: "처음 그래프의 칸 수를 셌어요. 한 칸의 크기가 바뀌었어요.", [max - min]: "칸 수가 아니라 차를 답했어요." },
  };
});

export const l4BarCells = easy("l4-bar-cells", (rand) => {
  const d = bars(rand, [1, 2, 5, 10]);
  const hide = randInt(rand, 0, 3);
  const v = d.values[hide];
  return {
    key: `${d.key}:${hide}`,
    prompt: `${josa(d.title, "을/를")} 막대그래프로 나타내고 있습니다. ${josa(d.labels[hide], "은/는")} ${v}${sp(d.unit)}입니다. ${d.labels[hide]}의 막대는 세로 눈금 몇 칸으로 그려야 하나요?`,
    visual: barScene(d.title, d.labels, d.values, d.unit, d.step, { hide, cells: Math.max(...d.values) / d.step + 1 }),
    answer: v / d.step,
    unit: "칸",
    hint: "세로 눈금 한 칸이 얼마를 나타내는지 먼저 읽고, 나타낼 수를 한 칸의 크기로 나누어요.",
    explanation: `한 칸이 ${d.step}${sp(d.unit)}이므로 ${v} ÷ ${d.step} = ${v / d.step}(칸)`,
    mistakes: d.step > 1 ? { [v]: "칸 수가 아니라 수를 답했어요." } : {},
  };
});

export const l4BarTableMissing = mid("l4-bar-table-missing", (rand) => {
  const t = pick(rand, BAR_TOPICS);
  const labels = shuffle(rand, t.items).slice(0, 4);
  const values = labels.map(() => randInt(rand, 2, 15));
  const total = values.reduce((a, b) => a + b, 0);
  const miss = randInt(rand, 0, 3);
  return {
    key: `${t.title}:${values.join()}:${miss}`,
    prompt: `표를 막대그래프로 나타내려고 합니다. 표의 빈칸에 알맞은 수를 구하세요.`,
    visual: { kind: "table", header: ["항목", ...labels, "합계"], rows: [[`수(${t.unit})`, ...values.map((v, i) => (i === miss ? "" : String(v))), String(total)]] },
    answer: values[miss],
    unit: t.unit,
    hint: "합계에서 나머지 항목의 수를 모두 빼요.",
    explanation: `${total} − ${values.filter((_, i) => i !== miss).join(" − ")} = ${values[miss]}`,
  };
});

export const l4BarScaleChoose = mid("l4-bar-scale-choose", (rand) => {
  // 교과서처럼 1, 2, 5, 10 중에서 알맞은 눈금 한 칸의 크기를 고른다
  const cells = pick(rand, [10, 12, 15]);
  const answer = pick(rand, [2, 5, 10]);
  const smaller = [1, 2, 5, 10].filter((x) => x < answer);
  const max = randInt(rand, Math.max(...smaller) * cells + 1, answer * cells);
  if (max % 10 === 0 && rand() < 0.5) return null;
  return {
    key: `${max}:${cells}`,
    prompt: `가장 큰 값이 ${max}명인 자료를 세로 눈금 ${cells}칸 안에 모두 나타내려고 합니다. 세로 눈금 한 칸의 크기를 1명, 2명, 5명, 10명 중에서 정할 때 가장 알맞은 것은 몇 명인가요?`,
    // 문제가 정한 후보(1·2·5·10명)만 보기로 — 숫자 답으로 두면 객관식 변형이 11명·12명 같은 후보 밖 보기를 만든다
    answer: `${answer}명`,
    choices: ["1명", "2명", "5명", "10명"],
    hint: `한 칸의 크기 × ${josa(cells, "이/가")} ${max} 이상이어야 해요. 그중에서 가장 작은 것이 막대 길이를 비교하기 좋아요.`,
    explanation: `${[1, 2, 5, 10].map((x) => `${x}명 × ${cells} = ${x * cells}`).join(", ")} → ${max}명을 나타낼 수 있는 가장 작은 크기는 ${answer}명`,
    mistakes: { [`${Math.max(...smaller)}명`]: `${Math.max(...smaller)}명씩이면 ${cells}칸으로는 ${Math.max(...smaller) * cells}명까지만 나타낼 수 있어요.` },
  };
});

export const l4BarDrawError = word("l4-bar-draw-error", (rand) => {
  const d = bars(rand, [1, 2, 5]);
  const wrong = randInt(rand, 0, 3);
  const drawn = [...d.values];
  drawn[wrong] = d.values[wrong] + pick(rand, [-1, 1]) * d.step;
  if (drawn[wrong] <= 0 || new Set(drawn).size < 4 || Math.max(...drawn) > Math.max(...d.values)) return null;
  return {
    key: `${d.key}:${wrong}:${drawn[wrong]}`,
    prompt: `표를 보고 막대그래프를 그렸는데 막대 하나를 잘못 그렸습니다. 잘못 그린 막대를 고르세요. (표: ${d.labels.map((l, i) => `${l} ${d.values[i]}${sp(d.unit)}`).join(", ")})`,
    visual: barScene(d.title, d.labels, drawn, d.unit, d.step),
    answer: d.labels[wrong],
    choices: d.labels,
    hint: "막대마다 막대 끝이 가리키는 눈금을 읽어 표의 수와 비교해요.",
    explanation: `${d.labels[wrong]}의 막대는 ${josa(`${drawn[wrong]}${sp(d.unit)}`, "을/를")} 나타내지만 표에서는 ${josa(`${d.values[wrong]}${sp(d.unit)}`, "이에요/예요")}.`,
  };
});

export const l4BarRestCells = word("l4-bar-rest-cells", (rand) => {
  const d = bars(rand, [2, 5]);
  const total = d.values.reduce((a, b) => a + b, 0);
  const hide = randInt(rand, 0, 3);
  return {
    key: `${d.key}:${hide}`,
    prompt: `${d.title}의 합계는 ${total}${sp(d.unit)}입니다. 막대그래프에 ${d.labels[hide]}의 막대를 그리려면 세로 눈금 몇 칸으로 그려야 하나요?`,
    visual: barScene(d.title, d.labels, d.values, d.unit, d.step, { hide, cells: Math.max(...d.values) / d.step + 1 }),
    answer: d.values[hide] / d.step,
    unit: "칸",
    hint: `먼저 그래프에서 나머지 항목의 수를 읽어 ${d.labels[hide]}의 수를 구한 다음, 한 칸의 크기로 나누어요.`,
    explanation: `${d.labels[hide]}: ${total} − ${d.values.filter((_, i) => i !== hide).join(" − ")} = ${d.values[hide]}, ${d.values[hide]} ÷ ${d.step} = ${d.values[hide] / d.step}(칸)`,
    mistakes: { [d.values[hide]]: "칸 수로 바꾸지 않았어요." },
  };
});

export const l4BarTotal = easy("l4-bar-total", (rand) => {
  const d = bars(rand, [1, 2, 5]);
  const total = d.values.reduce((a, b) => a + b, 0);
  return {
    key: d.key,
    prompt: `막대그래프에 나타낸 ${josa(d.title, "을/를")} 모두 더하면 몇 ${d.unit}인가요?`,
    visual: d.visual,
    answer: total,
    unit: d.unit,
    hint: `세로 눈금 한 칸은 ${josa(`${d.step}${sp(d.unit)}`, "이에요/예요")}. 막대가 나타내는 수를 모두 더해요.`,
    explanation: `${d.values.join(" + ")} = ${total}`,
  };
});

export const l4BarOrder = mid("l4-bar-order", (rand) => {
  const d = bars(rand);
  const desc = rand() < 0.5;
  const nth = randInt(rand, 2, 3);
  const sorted = [...d.values].sort((a, b) => (desc ? b - a : a - b));
  const answer = d.labels[d.values.indexOf(sorted[nth - 1])];
  return {
    key: `${d.key}:${desc}:${nth}`,
    prompt: `${desc ? "많은" : "적은"} 순서대로 쓸 때 ${nth === 2 ? "둘째" : "셋째"}인 항목을 고르세요.`,
    visual: d.visual,
    answer,
    choices: d.labels,
    hint: `막대가 ${desc ? "긴" : "짧은"} 것부터 차례로 늘어놓아요.`,
    explanation: sorted.map((v) => d.labels[d.values.indexOf(v)]).join(", "),
  };
});

export const l4BarPlan = mid("l4-bar-plan", (rand) => {
  const d = bars(rand, [1, 2]);
  if (d.unit !== "명") return null;
  const max = Math.max(...d.values);
  const each = randInt(rand, 2, 4);
  const item = d.labels[d.values.indexOf(max)];
  const thing = d.title.includes("과일") ? "과일" : "운동";
  return {
    key: `${d.key}:${each}`,
    prompt:
      thing === "과일"
        ? `막대그래프를 보고 가장 많은 학생이 좋아하는 과일을 사서, 그 과일을 좋아하는 학생 한 명에게 ${each}개씩 나누어 주려고 합니다. 과일은 모두 몇 개 필요한가요?`
        : `막대그래프를 보고 가장 많은 학생이 좋아하는 운동을 하는 날, 그 운동을 좋아하는 학생 한 명에게 물을 ${each}병씩 나누어 주려고 합니다. 물은 모두 몇 병 필요한가요?`,
    visual: d.visual,
    answer: max * each,
    unit: thing === "과일" ? "개" : "병",
    hint: "가장 긴 막대가 나타내는 학생 수를 먼저 읽어요.",
    explanation: `${item} ${max}명 × ${each} = ${max * each}(${thing === "과일" ? "개" : "병"})`,
  };
});

export const l4BarBudget = word("l4-bar-budget", (rand) => {
  const d = bars(rand, [1, 2]);
  if (d.unit !== "명") return null;
  const [a, b] = shuffle(rand, [0, 1, 2, 3]).slice(0, 2);
  const pa = randInt(rand, 3, 15) * 100;
  const pb = randInt(rand, 3, 15) * 100;
  if (pa === pb) return null;
  const cost = d.values[a] * pa + d.values[b] * pb;
  return {
    key: `${d.key}:${a}:${b}:${pa}:${pb}`,
    prompt: `막대그래프를 보고 ${josa(d.labels[a], "을/를")} 좋아하는 학생에게는 한 명에 ${pa}원짜리 선물을, ${josa(d.labels[b], "을/를")} 좋아하는 학생에게는 한 명에 ${pb}원짜리 선물을 주려고 합니다. 필요한 돈은 모두 얼마인가요?`,
    visual: d.visual,
    answer: cost,
    unit: "원",
    hint: "두 항목의 학생 수를 각각 읽고, 선물값을 곱해 더해요.",
    explanation: `${d.values[a]} × ${pa} = ${d.values[a] * pa}, ${d.values[b]} × ${pb} = ${d.values[b] * pb} → ${d.values[a] * pa} + ${d.values[b] * pb} = ${cost}(원)`,
  };
});

/** 두 반 막대그래프(1반 색칠·2반 빗금): 두 반을 합하여 가장 많은 항목 — 한 반에서만 보면 틀리게 */
export const l4BarTwoClass = word("l4-bar-two-class", (rand) => {
  const t = pick(rand, BAR_TOPICS.slice(0, 2));
  const labels = shuffle(rand, t.items).slice(0, 4);
  const c1 = labels.map(() => randInt(rand, 2, 12));
  const c2 = labels.map(() => randInt(rand, 2, 12));
  const sums = c1.map((v, i) => v + c2[i]);
  const max = Math.max(...sums);
  if (sums.filter((s) => s === max).length > 1) return null;
  const answer = labels[sums.indexOf(max)];
  if (c1.indexOf(Math.max(...c1)) === sums.indexOf(max) && c2.indexOf(Math.max(...c2)) === sums.indexOf(max)) return null;
  return {
    key: `${labels.join()}:${c1.join()}:${c2.join()}`,
    prompt: `1반과 2반의 ${josa(t.title, "을/를")} 한 막대그래프에 나타냈습니다. 두 반을 합하여 가장 많은 학생이 좋아하는 것을 고르세요.`,
    visual: { kind: "bars", title: t.title, labels, values: c1, unit: t.unit, step: 1, second: { names: ["1반", "2반"], values: c2 } },
    answer,
    choices: labels,
    hint: "색칠한 막대는 1반, 빗금 막대는 2반이에요. 한 반에서 가장 많은 것이 합해도 가장 많은 것은 아닐 수 있어요. 항목마다 두 막대를 읽어 더해요.",
    explanation: labels.map((l, i) => `${l} ${c1[i]} + ${c2[i]} = ${sums[i]}(명)`).join(", "),
  };
});

/* ── 꺾은선그래프 ── */

/** 주제별로 현실적인 꺾은선그래프 자료(키는 늘기만, 기온은 봄날 범위) */
function lineSeries(rand: () => number, ids?: readonly LineTopic["id"][]) {
  const d = realLineData(rand, ids);
  return { ...d, key: `${d.t.title}:${d.values.join()}` };
}

export const l4LineWhen = mid("l4-line-when", (rand) => {
  const d = lineSeries(rand);
  const i = randInt(rand, 0, 4);
  if (d.values.filter((v) => v === d.values[i]).length > 1) return null;
  return {
    key: `${d.key}:${i}`,
    prompt: `꺾은선그래프에서 ${josa(d.t.item, "이/가")} ${d.values[i]}${sp(d.t.unit)}인 때를 고르세요.`,
    // 값이 같은 때를 고르는 문제: 한 항목만 빼면 나머지 값으로 정답이 드러나므로 모든 값을 뺀다
    visual: { ...d.visual, asked: d.values.map((_, k) => k) },
    answer: d.t.labels[i],
    choices: opts(rand, d.t.labels[i], shuffle(rand, d.t.labels.filter((_, k) => k !== i)), () => d.t.labels[0]),
    hint: `세로 눈금 한 칸은 ${josa(`${d.step}${sp(d.t.unit)}`, "이에요/예요")}. ${d.values[i]}에 닿는 점을 찾아요.`,
    explanation: `${d.t.labels[i]}의 점이 ${d.values[i]}${sp(d.t.unit)}에 있어요.`,
  };
});

export const l4LineScale = mid("l4-line-scale", (rand) => {
  const d = lineSeries(rand);
  const i = randInt(rand, 0, 4);
  return {
    key: `${d.key}:${i}`,
    prompt: `꺾은선그래프에서 ${d.t.labels[i]}의 점은 세로 눈금 0에서 몇 칸 위에 있나요?`,
    visual: d.visual,
    answer: d.values[i] / d.step,
    unit: "칸",
    hint: `세로 눈금 한 칸은 ${josa(`${d.step}${sp(d.t.unit)}`, "이에요/예요")}.`,
    explanation: `${d.values[i]} ÷ ${d.step} = ${d.values[i] / d.step}(칸)`,
    mistakes: d.step > 1 ? { [d.values[i]]: "칸 수가 아니라 값을 답했어요." } : {},
  };
});

export const l4LinePredict = word("l4-line-predict", (rand) => {
  const k = randInt(rand, 1, 4);
  const start = randInt(rand, 2, 8);
  const values = [0, 1, 2, 3, 4].map((i) => start + k * i);
  const labels = ["1일", "3일", "5일", "7일", "9일"];
  return {
    key: `${start}:${k}`,
    prompt: `강낭콩 싹의 키를 이틀마다 재어 꺾은선그래프로 나타냈습니다. 키가 같은 빠르기로 자란다면 11일에는 몇 cm가 될지 예상해 보세요.`,
    visual: { kind: "line", title: "강낭콩 싹의 키", labels, values, unit: "cm", step: 1 },
    answer: start + k * 5,
    unit: "cm",
    hint: "이틀마다 몇 cm씩 자랐는지 찾아요.",
    explanation: `이틀마다 ${k} cm씩 → 9일 ${values[4]} cm + ${k} = ${start + k * 5} cm`,
  };
});

/**
 * 두 계열 꺾은선그래프(●실선·▲점선): 두 사람이 기른 강낭콩 싹의 키 — 키는 늘기만 하고(날마다 눈금 1~3칸),
 * 같은 날 두 점이 겹치지 않으며, 두 키의 차가 가장 큰 날이 하나뿐이다
 */
export const l4LineTwoSeries = word("l4-line-two-series", (rand) => {
  const labels = ["1일", "3일", "5일", "7일", "9일"];
  const step = pick(rand, [1, 2]);
  const grow = () => {
    const cells = [randInt(rand, 1, 3)];
    for (let i = 1; i < 5; i++) cells.push(cells[i - 1] + randInt(rand, 1, 3));
    return cells;
  };
  const [ca, cb] = [grow(), grow()];
  if (Math.max(...ca, ...cb) > 12) return null;
  const a = ca.map((c) => c * step);
  const b = cb.map((c) => c * step);
  if (a.some((v, i) => v === b[i])) return null;
  const diffs = a.map((v, i) => Math.abs(v - b[i]));
  const max = Math.max(...diffs);
  if (diffs.filter((x) => x === max).length > 1) return null;
  const [p, q] = names(rand);
  const day = labels[diffs.indexOf(max)];
  return {
    key: `${step}:${a.join()}:${b.join()}`,
    prompt: `${josa(p, "과/와")} ${josa(q, "이/가")} 기른 강낭콩 싹의 키를 이틀마다 재어 한 꺾은선그래프에 나타냈습니다. 두 싹의 키의 차가 가장 큰 날을 고르세요.`,
    visual: { kind: "line", title: "강낭콩 싹의 키", labels, values: a, unit: "cm", step, second: { names: [p, q], values: b } },
    answer: day,
    choices: opts(rand, day, shuffle(rand, labels), () => labels[0]),
    hint: `●실선은 ${p}, ▲점선은 ${q}의 강낭콩이에요. 세로 눈금 한 칸은 ${step} cm예요. 두 꺾은선 사이가 가장 많이 벌어진 날을 찾아요.`,
    explanation: `${labels.map((l, i) => `${l} ${diffs[i]} cm`).join(", ")} → 차가 가장 큰 날은 ${day}이에요.`,
  };
});

/**
 * 물결선을 넣은 꺾은선그래프(도형 그림): 세로 눈금은 start부터 step씩 cells칸, 0과 start 사이는 물결선으로 줄인다.
 * values에서 null인 때는 점을 찍지 않는다. extra는 점을 찍을 후보 자리(①~④)
 */
function waveLineScene(title: string, labels: string[], values: (number | null)[], unit: string, start: number, step: number, cells: number, extra: { v: number; text: string }[] = []): ShapeScene {
  const W = GRAPH_W;
  const L = 50;
  const R = 22;
  const band = (W - L - R) / labels.length;
  // 가로축 이름이 칸보다 넓으면(오전 11시 등) 띄어쓰기에서 두 줄로 쓴다
  const wide = labels.some((l) => textBox({ at: [0, 0], text: l })[2] * 2 + 6 > band);
  const rows = labels.map((l) => (wide ? l.split(" ") : [l]));
  const extraRow = wide ? 20 : 0;
  const H = 244 + extraRow;
  const top = 44;
  const zero = H - 34 - extraRow;
  const startY = zero - 26;
  const ch = (startY - top) / cells;
  const x = (i: number) => rd(L + band * (i + 0.5));
  const y = (v: number) => rd(startY - ((v - start) / step) * ch);
  // 눈금 숫자는 20px 이상 떨어지게 1·2·5·10칸마다
  const every = [1, 2, 5, 10].find((k) => k * ch >= 20) ?? 10;
  const lines: Lines = [];
  const texts: Texts = [{ at: [W / 2, 14], text: title }, { at: [26, 24], text: `(${unit})` }, { at: [L - 12, zero], text: "0" }];
  for (let k = 0; k <= cells; k++) {
    const v = start + k * step;
    lines.push({ from: [L, y(v)], to: [W - R, y(v)], width: 0.6 });
    if (k % every === 0) texts.push({ at: [L - 8 - String(v).length * 4, y(v)], text: String(v) });
  }
  // 세로축과 물결선(≈)
  lines.push(
    { from: [L, top - 6], to: [L, startY + 4], width: 1.5 },
    { from: [L, startY + 4], to: [L - 6, startY + 9], width: 1.5 },
    { from: [L - 6, startY + 9], to: [L + 6, startY + 15], width: 1.5 },
    { from: [L + 6, startY + 15], to: [L, startY + 20], width: 1.5 },
    { from: [L, startY + 20], to: [L, zero], width: 1.5 },
    { from: [L, zero], to: [W - R, zero], width: 1.5 },
  );
  rows.forEach((lines, i) => lines.forEach((line, k) => texts.push({ at: [x(i), zero + 18 + k * 20], text: line })));
  const pts = values.map((v, i) => (v === null ? null : ([x(i), y(v)] as [number, number])));
  pts.forEach((p, i) => {
    const q = pts[i + 1];
    if (p && q) lines.push({ from: p, to: q });
  });
  const last = labels.length - 1;
  extra.forEach((e) => texts.push({ at: [x(last) + 16, y(e.v)], text: e.text }));
  return {
    kind: "shape",
    width: W,
    height: H,
    label: graphLabel(title, unit, labels, values, [], `(물결선으로 ${start} 아래를 줄임)`) + (extra.length ? ` ${labels[last]} 자리에 ${extra.map((e) => e.text).join(", ")} 표시.` : ""),
    lines,
    dots: [...(pts.filter(Boolean) as [number, number][]), ...extra.map((e): [number, number] => [x(last), y(e.v)])],
    texts,
  };
}

/** 기온 자료(물결선 그래프용): 오전 9시~오후 5시, 12~30°C, 2°C 단위 */
function tempSeries(rand: () => number) {
  const d = realLineData(rand, ["temp"], (v) => Math.min(...v) >= 12 && Math.max(...v) <= 30 && Math.min(...v) % 10 !== 0);
  const start = Math.floor(Math.min(...d.values) / 10) * 10;
  const cells = (Math.max(...d.values) - start) / d.step + 1;
  return { ...d, start, cells };
}

export const l4LineCells = easy("l4-line-cells", (rand) => {
  const d = tempSeries(rand);
  const v = d.values[4];
  return {
    key: `${d.values.join()}`,
    prompt: `운동장의 기온을 조사하여 물결선을 넣은 꺾은선그래프로 나타내고 있습니다. 오후 5시의 기온은 ${v}°C입니다. 오후 5시의 점은 ${d.start}°C 눈금에서 몇 칸 위에 찍어야 하나요?`,
    visual: waveLineScene(d.t.title, d.t.labels, [...d.values.slice(0, 4), null], d.t.unit, d.start, d.step, d.cells),
    answer: (v - d.start) / d.step,
    unit: "칸",
    hint: "세로 눈금 한 칸이 몇 °C인지 먼저 읽어요. 물결선 아래는 줄여서 나타낸 부분이에요.",
    explanation: `한 칸은 ${d.step}°C, ${v} − ${d.start} = ${v - d.start}(°C), ${v - d.start} ÷ ${d.step} = ${(v - d.start) / d.step}(칸)`,
    mistakes: { [v / d.step]: "물결선 아래 줄인 부분까지 0부터 셌어요." },
  };
});

export const l4LinePlotWhere = mid("l4-line-plot-where", (rand) => {
  const d = tempSeries(rand);
  const v = d.values[4];
  const top = d.start + d.cells * d.step;
  const others = shuffle(rand, [v - 2 * d.step, v + 2 * d.step, v - 4 * d.step, v + 4 * d.step].filter((x) => x >= d.start && x <= top)).slice(0, 3);
  if (others.length < 3) return null;
  const cands = shuffle(rand, [v, ...others]);
  const idx = cands.indexOf(v);
  return {
    key: `${d.values.join()}:${cands.join()}`,
    prompt: `오후 5시의 기온은 ${v}°C입니다. 꺾은선그래프에 오후 5시의 기온을 나타내는 점을 찍을 자리를 고르세요.`,
    visual: waveLineScene(d.t.title, d.t.labels, [...d.values.slice(0, 4), null], d.t.unit, d.start, d.step, d.cells, cands.map((c, i) => ({ v: c, text: MARKS[i] }))),
    answer: MARKS[idx],
    choices: MARKS,
    hint: `세로 눈금 한 칸은 ${d.step}°C예요. ${v}°C를 나타내는 가로선을 찾아요.`,
    explanation: `${d.start}°C에서 ${(v - d.start) / d.step}칸 위가 ${v}°C이므로 ${josa(MARKS[idx], "이에요/예요")}.`,
  };
});

export const l4LineWaveStart = mid("l4-line-wave-start", (rand) => {
  const min = randInt(rand, 12, 22);
  if (min % 10 === 0) return null;
  const values = shuffle(rand, [min, min + randInt(rand, 1, 4), min + randInt(rand, 5, 8), min + randInt(rand, 2, 6)]);
  const answer = `${Math.floor(min / 10) * 10}°C`;
  const wrong = [`${Math.floor(min / 10) * 10 + 10}°C`, `${min + 1}°C`, "0°C"];
  return {
    key: values.join(),
    prompt: `하루 동안 기온(°C)을 조사한 값이 ${values.join(", ")}입니다. 물결선을 사용하여 필요 없는 부분을 줄여 꺾은선그래프를 그릴 때, 세로 눈금을 몇 °C부터 시작하는 것이 가장 알맞은가요?`,
    answer,
    choices: opts(rand, answer, wrong, () => `${randInt(rand, 1, 5) * 5}°C`),
    hint: "가장 낮은 기온보다 낮으면서 가장 가까운 몇십부터 시작해요. 가장 낮은 기온보다 높은 곳부터 시작하면 점을 찍을 수 없어요.",
    explanation: `가장 낮은 기온 ${min}°C → ${answer}부터`,
  };
});

export const l4LineCellsNeed = mid("l4-line-cells-need", (rand) => {
  const step = pick(rand, [2, 5, 10]);
  const max = randInt(rand, 5, 20) * step + randInt(rand, 1, step - 1);
  const need = Math.ceil(max / step);
  return {
    key: `${step}:${max}`,
    prompt: `가장 큰 값이 ${max}인 자료를 세로 눈금 한 칸이 ${step}인 꺾은선그래프로 나타내려고 합니다. 0부터 시작할 때 세로 눈금은 적어도 몇 칸이 있어야 하나요?`,
    answer: need,
    unit: "칸",
    hint: `${step} × 칸 수가 ${max} 이상이어야 해요.`,
    explanation: `${step} × ${need - 1} = ${step * (need - 1)} < ${max} ≤ ${step * need} → ${need}칸`,
    mistakes: { [need - 1]: "모자라요. 가장 큰 값까지 나타낼 수 있어야 해요." },
  };
});

export const l4LineWaveSave = word("l4-line-wave-save", (rand) => {
  const step = pick(rand, [1, 2]);
  const start = pick(rand, [10, 20]);
  const low = start + randInt(rand, 1, 3) * step;
  const max = start + randInt(rand, 4, step === 1 ? 9 : 5) * step;
  if (max > 30) return null;
  const full = max / step;
  const wave = (max - start) / step;
  return {
    key: `${step}:${start}:${max}:${low}`,
    prompt: `가장 높은 기온이 ${max}°C, 가장 낮은 기온이 ${low}°C인 자료를 세로 눈금 한 칸이 ${step}°C인 꺾은선그래프로 나타내려고 합니다. 0°C부터 모두 그릴 때보다 물결선을 넣어 ${start}°C부터 그릴 때 세로 눈금이 몇 칸 줄어드나요?`,
    answer: full - wave,
    unit: "칸",
    hint: `0°C부터 그릴 때와 ${start}°C부터 그릴 때 가장 높은 기온까지 필요한 칸 수를 각각 구해 빼요.`,
    explanation: `0°C부터: ${max} ÷ ${step} = ${full}칸, ${start}°C부터: ${max} − ${start} = ${max - start}, ${max - start} ÷ ${step} = ${wave}칸 → ${full} − ${wave} = ${full - wave}(칸)`,
    mistakes: { [wave]: `${start}°C부터 그릴 때 필요한 칸 수예요. 줄어든 칸 수를 구해요.` },
  };
});

export const l4LineGrowBack = word("l4-line-grow-back", (rand) => {
  // 4일째부터 8일째까지 잰 키로, 재지 않은 1일째 키를 거꾸로 구한다
  const k = randInt(rand, 1, 3);
  const first = randInt(rand, 1, 4);
  const labels = ["4일", "5일", "6일", "7일", "8일"];
  const values = [4, 5, 6, 7, 8].map((day) => first + k * (day - 1));
  const step = Math.max(...values) > 12 ? 2 : 1;
  if (values.some((v) => v % step) || Math.max(...values) / step > 12) return null;
  return {
    key: `${k}:${first}`,
    prompt: "강낭콩 싹의 키를 4일째부터 날마다 재어 꺾은선그래프로 나타냈습니다. 싹은 날마다 같은 길이만큼 자랐습니다. 1일째의 키는 몇 cm였을까요?",
    visual: { kind: "line", title: "강낭콩 싹의 키", labels, values, unit: "cm", step },
    answer: first,
    unit: "cm",
    hint: "그래프에서 하루에 몇 cm씩 자랐는지 읽어요. 4일째에서 1일째로 거꾸로 3일을 되돌아가요.",
    explanation: `하루에 ${k} cm씩 자랐고, 4일째 키가 ${values[0]} cm → ${k} × 3 = ${3 * k}, ${values[0]} − ${3 * k} = ${first}(cm)`,
    mistakes: { [values[0] - k * 4]: "되돌아간 날수를 한 번 더 셌어요.", [values[0]]: "4일째의 키를 답했어요." },
  };
});

export const l4LineIncreaseCount = easy("l4-line-increase-count", (rand) => {
  // 키는 줄어들지 않으므로 오르내리는 주제(기온, 방문자 수)만
  const d = lineSeries(rand, ["temp", "visit"]);
  const up = rand() < 0.5;
  const verb = up ? d.t.rise : d.t.fall;
  if (!verb) return null;
  const count = d.values.slice(1).filter((v, i) => (up ? v > d.values[i] : v < d.values[i])).length;
  return {
    key: `${d.key}:${up}`,
    prompt: `꺾은선그래프에서 바로 전보다 ${josa(d.t.item, "이/가")} ${verb} 때는 모두 몇 번인가요?`,
    visual: d.visual,
    answer: count,
    unit: "번",
    hint: `선이 오른쪽 ${up ? "위" : "아래"}로 기울어진 곳을 세어요.`,
    explanation: `${verb} 때: ${count}번`,
  };
});

const GRAPH_FIT = {
  line: ["하루 동안 교실 온도의 변화", "월별 키의 변화", "요일별 강낭콩 싹의 키 변화", "연도별 마을 인구의 변화"],
  bar: ["반별 좋아하는 과일별 학생 수", "모둠별 모은 빈 병 수", "나라별 금메달 수", "학년별 안경 쓴 학생 수"],
};

export const l4LineOrBar = mid("l4-line-or-bar", (rand) => {
  const wantLine = rand() < 0.5;
  const ans = pick(rand, wantLine ? GRAPH_FIT.line : GRAPH_FIT.bar);
  const choices = shuffle(rand, [ans, ...shuffle(rand, wantLine ? GRAPH_FIT.bar : GRAPH_FIT.line).slice(0, 3)]);
  return {
    key: `${wantLine}:${choices.join()}`,
    prompt: `${wantLine ? "꺾은선그래프" : "막대그래프"}로 나타내기에 가장 알맞은 자료를 고르세요.`,
    answer: ans,
    choices,
    hint: "시간에 따라 변하는 양은 꺾은선그래프, 항목끼리 크기를 비교할 때는 막대그래프가 알맞아요.",
    explanation: `${josa(ans, "은/는")} ${wantLine ? "시간에 따른 변화를 나타내므로 꺾은선그래프" : "항목끼리 비교하므로 막대그래프"}가 알맞아요.`,
  };
});

export const l4LineTotalChange = mid("l4-line-total-change", (rand) => {
  const d = lineSeries(rand, ["plant"]);
  return {
    key: d.key,
    prompt: `꺾은선그래프에서 ${d.t.labels[0]}부터 ${d.t.labels[4]}까지 ${josa(d.t.item, "은/는")} 모두 얼마나 늘어났나요?`,
    visual: d.visual,
    answer: d.values[4] - d.values[0],
    unit: d.t.unit,
    hint: "처음 값과 마지막 값을 읽어 빼요.",
    explanation: `${d.values[4]} − ${d.values[0]} = ${d.values[4] - d.values[0]}`,
  };
});

export const l4LineSales = word("l4-line-sales", (rand) => {
  const labels = ["월", "화", "수", "목", "금"];
  const values = labels.map(() => randInt(rand, 3, 12) * 5);
  const price = randInt(rand, 5, 15) * 100;
  const [i, j] = shuffle(rand, [0, 1, 2, 3, 4]).slice(0, 2).sort((a, b) => a - b);
  if (values[i] === values[j]) return null;
  const diff = Math.abs(values[i] - values[j]) * price;
  return {
    key: `${values.join()}:${price}:${i}:${j}`,
    prompt: `학교 매점에서 요일별로 판 우유 수를 꺾은선그래프로 나타냈습니다. 우유 한 개가 ${price}원일 때, ${labels[i]}요일과 ${labels[j]}요일에 우유를 판 금액의 차는 얼마인가요?`,
    visual: { kind: "line", title: "요일별 판 우유 수", labels: labels.map((l) => `${l}요일`), values, unit: "개", step: 5 },
    answer: diff,
    unit: "원",
    hint: "두 요일에 판 우유 수의 차를 구한 뒤 한 개의 값을 곱해요.",
    explanation: `${Math.max(values[i], values[j])} − ${Math.min(values[i], values[j])} = ${diff / price}(개), ${diff / price} × ${price} = ${diff}(원)`,
  };
});

export const l4LineCondition = word("l4-line-condition", (rand) => {
  // '바로 전보다 늘어난' 조건이 뜻이 있도록 오르내리는 주제만
  const d = lineSeries(rand, ["temp", "visit"]);
  const cut = d.values[randInt(rand, 0, 4)];
  const count = d.values.filter((v, i) => i > 0 && v >= cut && v > d.values[i - 1]).length;
  return {
    key: `${d.key}:${cut}`,
    prompt: `꺾은선그래프에서 ${josa(d.t.item, "이/가")} ${cut}${sp(d.t.unit)} 이상이면서 바로 전보다 ${d.t.rise} 때는 모두 몇 번인가요?`,
    visual: d.visual,
    answer: count,
    unit: "번",
    hint: "두 조건을 하나씩 확인해요. 처음 때는 바로 전이 없으니 세지 않아요.",
    explanation: d.t.labels.map((l, i) => `${l} ${d.values[i]}`).join(", ") + ` → ${count}번`,
  };
});

export const w4TempBetween = word("w4-temp-between", (rand) => {
  const start = randInt(rand, 14, 18);
  const step = randInt(rand, 1, 2);
  const labels = ["9시", "10시", "11시", "12시", "1시"];
  const end = start + step * 4;
  const base = Math.floor(start / 10) * 10;
  return {
    key: `${start}:${step}`,
    prompt: "교실 온도를 재어 꺾은선그래프로 나타내다가 오전 10시부터 낮 12시까지의 점을 찍지 못했습니다. 1시간마다 온도가 똑같이 올랐다면 오전 11시의 온도는 몇 °C인가요?",
    visual: waveLineScene("교실의 온도", labels, [start, null, null, null, end], "°C", base, 1, end - base + 1),
    answer: start + step * 2,
    unit: "°C",
    hint: "그래프에서 오전 9시와 오후 1시의 온도를 읽고, 4시간 동안 오른 온도를 1시간씩 똑같이 나누어요.",
    explanation: `${end} − ${start} = ${step * 4}(°C)를 4시간으로 나누면 1시간에 ${step}°C → 11시는 9시보다 2시간 뒤: ${step} × 2 = ${step * 2}, ${start} + ${step * 2} = ${start + step * 2}(°C)`,
  };
});

export const w4PlantGrow = word("w4-plant-grow", (rand) => {
  const start = randInt(rand, 1, 4);
  const per = randInt(rand, 1, 2);
  const day = randInt(rand, 7, 9);
  const labels = ["1일", "2일", "3일", "4일", "5일"];
  const values = [0, 1, 2, 3, 4].map((i) => start + per * i);
  return {
    key: `${start}:${per}:${day}`,
    prompt: `강낭콩 싹의 키를 날마다 재어 꺾은선그래프로 나타냈습니다. 같은 빠르기로 계속 자란다면 ${day}일에는 키가 몇 cm가 될까요?`,
    visual: { kind: "line", title: "강낭콩 싹의 키", labels, values, unit: "cm", step: 1 },
    answer: start + per * (day - 1),
    unit: "cm",
    hint: "그래프에서 하루에 몇 cm씩 자라는지 읽고, 5일부터 며칠 더 자라는지 세어요.",
    explanation: `하루에 ${per} cm씩 → 5일부터 ${day - 5}일 더: ${per} × ${day - 5} = ${per * (day - 5)}, ${values[4]} + ${per * (day - 5)} = ${start + per * (day - 1)}(cm)`,
    mistakes: { [values[4] + per * (day - 4)]: "자란 날수를 한 번 더 셌어요." },
  };
});
