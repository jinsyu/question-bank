import { units } from "../content";
import type { Generator, Problem, Standard, Unit } from "../content/types";
import { figureOk as sceneOk } from "../content/figure-check";
import { choiceKey, createRandom } from "../lib/random";
import { hasFinal, josa } from "../content/josa";
import { fractionValue } from "../content/generators/grade4";
import { longDivide } from "../content/generators/long-division";

/**
 * 전 학년 문항 품질 기준(docs/plan-quality.md). 학년별 quality-g{n}.test.ts가 이 검사를 쓴다.
 * 1) 조사 자리표시("을(를)"·"이(가)" 등)가 화면 글에 없다
 * 2) 각도는 5의 배수(°C 온도 제외, 정다각형처럼 불가피한 값은 학년 파일의 허용 목록)
 * 3) 도형 그림은 그림 안에 있고, 글자끼리·글자와 점·선·원 테두리·호가 겹치지 않는다(figure-check.ts 공용 검사)
 * 4) "그림을 보고/그림에서/그림과 같이"라고 하면 그림이 있다
 * 5) 도형 단원의 차시는 그림 문제가 절반 이상이다
 */

export type Entry = { unit: Unit; standard: Standard; gen: Generator };

export function gradeEntries(grade: number): Entry[] {
  return units.filter((u) => u.grade === grade).flatMap((unit) => unit.standards.flatMap((standard) => standard.generators.map((gen) => ({ unit, standard, gen }))));
}

/** 화면에 보이는 글(문제·식·보기·힌트·풀이·표·그림 글자) */
export function visibleText(p: Problem): string {
  const v = p.visual;
  const vis = !v ? "" : v.kind === "shape" ? (v.texts ?? []).map((t) => t.text).join(" ") : v.kind === "table" ? [...v.header, ...v.rows.flat()].join(" ") : "title" in v ? `${v.title} ${v.labels.join(" ")}` : "";
  return [p.prompt, p.expression ?? "", vis, (p.choices ?? []).join(" "), p.hint, p.explanation, (p.fields ?? []).join(" ")].join(" \n ");
}

const PLACEHOLDER = /\((을|를|이|가|은|는|과|와|으로|로|이라고|라고|이에요|예요)\)/;
export const hasPlaceholder = (p: Problem) => PLACEHOLDER.test(visibleText(p));

/** 5의 배수가 아닌 각도(°, °C는 제외) */
export function oddAngles(p: Problem): number[] {
  const text = `${visibleText(p)} ${p.fields?.length === 1 && p.fields[0] === "°" ? `${p.answer}°` : ""}`;
  return [...text.matchAll(/(\d+(?:\.\d+)?)\s*°(?!C)/g)].map((m) => Number(m[1])).filter((d) => d % 5 !== 0);
}

export const figureOk = (p: Problem) => p.visual?.kind !== "shape" || sceneOk(p.visual);

export const saysPicture = (p: Problem) => /그림을 보고|그림에서|그림과 같이|그림의/.test(p.prompt);
export const hasPicture = (p: Problem) => !!p.visual && p.visual.kind !== "table";

export function sample(gen: Generator, seeds = 200): Problem[] {
  return Array.from({ length: seeds }, (_, s) => gen.make(createRandom(s)));
}

/** 차시의 생성기 중 그림(도형·그래프 등, 표 제외)을 내는 비율 */
export function figureShare(standard: Standard): number {
  const withFig = standard.generators.filter((g) => sample(g, 20).some(hasPicture)).length;
  return withFig / standard.generators.length;
}

const PAIRS = { 을: "을/를", 를: "을/를", 이: "이/가", 가: "이/가", 은: "은/는", 는: "은/는", 과: "과/와", 와: "과/와", 으로: "으로/로", 로: "으로/로", 이라고: "이라고/라고", 라고: "이라고/라고", 이에요: "이에요/예요", 예요: "이에요/예요", 이었: "이었/였", 였: "이었/였" } as const;

/** 화면에 보이거나 읽어 주는 글 전부: visibleText + 오답 설명(mistakes) + 도형 그림 설명(aria-label) */
export function screenText(p: Problem): string {
  const label = p.visual?.kind === "shape" ? p.visual.label : "";
  return [visibleText(p), ...Object.values(p.mistakes ?? {}), label].join(" \n ");
}

/** 조사: 이었·였은 뒤에 '습니다' 등이 붙고, 나머지는 낱말 끝(공백·문장 부호·줄 끝)이어야 조사로 본다 */
const PARTICLE = String.raw`(이었|였|(?:이라고|이에요|으로|을|를|이|가|은|는|과|와|로|라고|예요)(?=[\s,.?!)~'"’”:;·…]|$))`;
/** 수(분수·대분수·소수)·□·자음·원 번호·㉠ + 단위 */
const NUM_RE = new RegExp(String.raw`(\d+(?:\.\d+)?(?:\/\d+)?|□|[ㄱ-ㅎ]|[①-⑳]|[㉠-㉭])( ?(?:cm²|m²|km²|cm³|m³|mm|cm|km|kg|mL|m|g|L|t|°C|°|%))?${PARTICLE}`, "g");
/** 한글 낱말(따옴표로 묶여도 된다) + 조사 */
const WORD_RE = new RegExp(String.raw`([가-힣]+)['"’”]?${PARTICLE}`, "g");

/**
 * 끝이 조사처럼 보이지만 낱말의 일부인 것(사과·초과·증가·모은 …).
 * 받침 + 는(있는·먹는 등 동사 어미), 받침 없음 + 이(아이·사이 등 낱말)는 흔해서 검사하지 않는다.
 */
const WORD_OK = ["사과", "초과", "효과", "교과", "증가", "평가", "참가", "물가", "단가", "정가", "원가", "마을", "가을", "모은", "모을", "이은", "이을", "지은", "지을", "나은", "나을", "부은", "부을", "저은", "저을", "그은", "그을", "경로", "통로", "진로", "선로", "항로"];

/** 한글 낱말 뒤: 이었·였은 동사(붙였·움직였)와 헷갈려 보지 않는다 */
function wrongAfterWord(word: string, particle: string): boolean {
  if (particle === "이었" || particle === "였") return false;
  if (WORD_OK.some((w) => `${word}${particle}`.endsWith(w))) return false;
  const f = hasFinal(word);
  if ((f.yes && particle === "는") || (!f.yes && particle === "이")) return false;
  const pair = PAIRS[particle as keyof typeof PAIRS];
  return josa(word, pair).slice(word.length) !== particle;
}

/**
 * 조사가 앞말의 받침과 맞는지(6 × 6를, 17예요, 2/3이에요, 1000 g예요, 셋째은, 도서관가, 9585이었습니다 같은 고정 조사).
 * 문제·식·보기·힌트·풀이·답 칸·오답 설명·그림 글자·그림 설명(aria-label)을 모두 본다.
 * 분수는 'b분의 a'로 읽으므로 분자, 단위는 읽는 말(g 그램 → 받침 있음, cm 센티미터 → 없음) 기준
 */
export function wrongJosa(p: Problem): string[] {
  const text = screenText(p);
  const bad: string[] = [];
  for (const [whole, token, unitText = "", particle] of text.matchAll(NUM_RE)) {
    const base = `${token}${unitText}`;
    if (josa(base, PAIRS[particle as keyof typeof PAIRS]).slice(base.length) !== particle) bad.push(whole);
  }
  for (const [whole, word, particle] of text.matchAll(WORD_RE)) {
    if (wrongAfterWord(word, particle)) bad.push(whole);
  }
  for (const w of figureWords(p)) {
    const re = new RegExp(String.raw`(?<![가-힣])${w}['"’”]?${PARTICLE}`, "g");
    for (const [whole, particle] of text.matchAll(re)) {
      if (particle === "이었" || particle === "였") continue;
      if (josa(w, PAIRS[particle as keyof typeof PAIRS]).slice(w.length) !== particle && !bad.includes(whole)) bad.push(whole);
    }
  }
  return bad;
}

/**
 * 생성기가 그림·표·그래프에 넣은 항목 이름(운동·독서, 가·나 …). 이 낱말 바로 뒤의 조사는 낱말 목록 예외('있는' 같은 동사 어미 제외) 없이
 * 받침대로 엄격하게 검사한다(운동는 → 운동은)
 */
export function figureWords(p: Problem): string[] {
  const v = p.visual;
  const raw = !v ? [] : v.kind === "shape" ? (v.texts ?? []).map((t) => t.text) : v.kind === "table" ? [...v.header, ...v.rows.flat()] : "labels" in v ? [...v.labels, ...(v.second?.names ?? [])] : [];
  return [...new Set(raw.map((t) => t.trim()).filter((t) => /^[가-힣]+$/.test(t)))];
}

/**
 * 보기 하나의 값: 자연수·소수·분수(a/b)·대분수(w a/b) + 뒤에 붙은 단위·말(cm, L, 개, 배 …).
 * 단위 쪽에 숫자가 또 있으면(2 kg 300 g, 3 × 4) 값을 정하지 않는다(null)
 */
export function choiceValue(choice: string): string | null {
  const key = choiceKey(choice);
  return key === choice ? null : key;
}

/** 값이 같은 보기 묶음(2/4와 1/2, 1 3/8과 11/8, 0.5와 1/2, 3 cm와 3cm) — 정답이 둘이 될 수 있다 */
export function sameValueChoices(p: Problem): string[][] {
  const groups = new Map<string, string[]>();
  for (const c of p.choices ?? []) {
    const key = choiceValue(c);
    if (key) groups.set(key, [...(groups.get(key) ?? []), c]);
  }
  return [...groups.values()].filter((g) => g.length > 1);
}

/** 서수를 숫자로 쓴 곳("5째", "3째 줄") — ord()로 "다섯째"처럼 쓴다 */
export const digitOrdinals = (p: Problem): string[] => screenText(p).match(/\d+째/g) ?? [];

/**
 * 값이 같은 보기가 있어도 되는 생성기(조건을 만족하는 보기가 하나뿐인지는 학년 테스트에서 따로 확인).
 * - l5-eq-diff·l5-eq-sum·l5-red-before: 크기가 같은 분수 여럿 중에서 조건(분모·분자의 합·차, 크기가 다른 것)으로 고르는 문제
 * - w5-glasses-frac·reduce-fraction: '기약분수로 나타낸 것' — 약분 전(2/24)·덜 약분한(6/8) 오답은 값이 같지만 기약분수가 아니다
 * - frac-to-mixed: '대분수로 나타낸 것' — 1 9/7 오답(30%)은 값이 같지만 분수 부분이 가분수라 대분수가 아니다
 */
export const SAME_VALUE_OK = new Set(["l5-eq-diff", "l5-eq-sum", "l5-red-before", "w5-glasses-frac", "reduce-fraction", "frac-to-mixed"]);

/** 전 학년 공통 검사(docs/audit-v2 F0): 화면 글 전체의 조사, 숫자 서수, 값이 같은 보기. 문제가 있는 시드의 설명 목록(처음 5개) */
export function commonIssues(gen: Generator, seeds = 200): string[] {
  const issues: string[] = [];
  for (const [seed, p] of sample(gen, seeds).entries()) {
    const found = [
      ...wrongJosa(p).map((x) => `조사 ${x}`),
      ...digitOrdinals(p).map((x) => `서수 ${x}`),
      ...(SAME_VALUE_OK.has(gen.id) ? [] : sameValueChoices(p).map((g) => `같은 값 보기 ${g.join(" = ")}`)),
    ];
    if (found.length) issues.push(`seed ${seed}: ${found.join(", ")}`);
    if (issues.length >= 5) break;
  }
  return issues;
}

/**
 * 그림 검사에 걸린 그림을 guard가 다시 뽑다 보면 특정 정답(분류·값)만 계속 버려져 사라질 수 있다.
 * 생성기가 내는 정답을 모아 기대한 정답이 모두 나오는지 확인할 때 쓴다
 */
export function answerSet(gen: Generator, seeds = 600): Set<string> {
  return new Set(sample(gen, seeds).map((p) => p.answer));
}
const range = (from: number, to: number, step = 5) => Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => String(from + i * step));
export { range as answerRange };

/* ── 분수·소수 그림 유형(R2b) 검사 ── */

/** 보기가 있으면 정답이 보기에 한 번만 있고, 값(분수·소수)이 같은 보기가 둘 이상 없다(1 3/8과 11/8처럼 모양만 다른 것 포함) */
export function choicesUnique(p: Problem): boolean {
  if (!p.choices) return true;
  if (p.choices.filter((c) => c === p.answer).length !== 1) return false;
  const vals = p.choices.map((c) => fractionValue(c)).filter((v) => Number.isFinite(v));
  return new Set(p.choices).size === p.choices.length && new Set(vals.map((v) => v.toFixed(9))).size === vals.length;
}

/** 수직선 그림에서 화살표가 가리키는 값: ㉠ 표시(세로 화살표) 또는 마지막 뛰어 세기 화살표 끝. 가장 왼쪽·오른쪽 수 글자로 눈금을 읽는다 */
export function numberLineValue(p: Problem): number {
  const v = p.visual;
  if (v?.kind !== "shape") return NaN;
  const nums = (v.texts ?? []).filter((t) => /^\d+(\.\d+)?$/.test(t.text)).sort((a, b) => a.at[0] - b.at[0]);
  const [lo, hi] = [nums[0], nums[nums.length - 1]];
  const arrows = (v.lines ?? []).filter((l) => l.arrows);
  const x = arrows[arrows.length - 1].to[0];
  return Number(lo.text) + ((x - lo.at[0]) / (hi.at[0] - lo.at[0])) * (Number(hi.text) - Number(lo.text));
}

/** 색칠한 넓이 ÷ 색칠하지 않은 틀 하나의 넓이(막대 하나·모눈 하나·정사각형 하나 = 1) */
export function shadedValue(p: Problem): number {
  const v = p.visual;
  if (v?.kind !== "shape") return NaN;
  const area = (ps: [number, number][]) => Math.abs(ps.reduce((s, q, i) => s + q[0] * ps[(i + 1) % ps.length][1] - ps[(i + 1) % ps.length][0] * q[1], 0)) / 2;
  const polys = v.polygons ?? [];
  const shaded = polys.filter((g) => g.fill === true).reduce((s, g) => s + area(g.points), 0);
  const frame = area(polys.find((g) => !g.fill)!.points);
  return shaded / frame;
}

/**
 * 막대·모눈마다(색칠하지 않은 틀 하나 = 1) 색칠한 양과 ×표 한 양. 틀은 위에서 아래, 왼쪽에서 오른쪽 순서.
 * ×표 하나(대각선 두 개)는 틀 안 한 칸이고, 칸 폭은 틀을 나눈 세로선 수로 구한다(분수 막대)
 */
export function barValues(p: Problem): { shaded: number; crossed: number }[] {
  const v = p.visual;
  if (v?.kind !== "shape") return [];
  const bbox = (ps: [number, number][]) => {
    const xs = ps.map((q) => q[0]);
    const ys = ps.map((q) => q[1]);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  };
  const area = (ps: [number, number][]) => Math.abs(ps.reduce((s, q, i) => s + q[0] * ps[(i + 1) % ps.length][1] - ps[(i + 1) % ps.length][0] * q[1], 0)) / 2;
  const inside = (b: ReturnType<typeof bbox>, [x, y]: [number, number]) => x > b.x0 - 1e-6 && x < b.x1 + 1e-6 && y > b.y0 - 1e-6 && y < b.y1 + 1e-6;
  const mid = (ps: [number, number][]): [number, number] => [ps.reduce((s, q) => s + q[0], 0) / ps.length, ps.reduce((s, q) => s + q[1], 0) / ps.length];
  const polys = v.polygons ?? [];
  const lines = v.lines ?? [];
  const frames = polys.filter((g) => !g.fill).map((g) => ({ g, b: bbox(g.points) }));
  frames.sort((s, t) => s.b.y0 - t.b.y0 || s.b.x0 - t.b.x0);
  return frames.map(({ g, b }) => {
    const whole = area(g.points);
    const shaded = polys.filter((q) => q.fill === true && inside(b, mid(q.points))).reduce((s, q) => s + area(q.points), 0);
    const diagonals = lines.filter((l) => l.from[0] !== l.to[0] && l.from[1] !== l.to[1] && inside(b, mid([l.from, l.to])));
    const dividers = lines.filter((l) => l.from[0] === l.to[0] && l.from[0] > b.x0 + 1e-6 && l.from[0] < b.x1 - 1e-6 && inside(b, mid([l.from, l.to])));
    const cell = (b.x1 - b.x0) / (dividers.length + 1);
    return { shaded: shaded / whole, crossed: ((diagonals.length / 2) * cell * (b.y1 - b.y0)) / whole };
  });
}

/**
 * 나눗셈 세로셈 그림(kind: "longdiv") 검사: 보이는 수가 실제 계산 과정과 같고, 빈칸을 위에서부터 채운 값이 정답이다.
 * 나누는 수·나누어지는 수가 보이면 과정은 하나로 정해지므로 정답은 하나다. 잘못이면 사유, 맞으면 null
 */
export function longDivProblemError(p: Problem): string | null {
  const v = p.visual;
  if (v?.kind !== "longdiv") return "세로셈 그림 없음";
  if (typeof v.divisor !== "string" || typeof v.dividend !== "string") return "나누는 수·나누어지는 수가 가려짐";
  const d = longDivide(Number(v.dividend), Number(v.divisor));
  const shown = [v.quotient, ...v.rows.map((r) => r.num)];
  if (shown.length !== d.entries.length) return `줄 수가 다름: ${shown.length} ≠ ${d.entries.length}`;
  const hidden: string[] = [];
  for (const [i, e] of d.entries.entries()) {
    const n = shown[i];
    if (i > 0 && v.rows[i - 1].end !== e.end) return `${i}번째 줄 자리가 다름`;
    if (typeof n === "string") {
      if (n !== String(e.value)) return `${i}번째 수가 계산과 다름: ${n} ≠ ${e.value}`;
    } else {
      if (n.width !== String(e.value).length) return `${i}번째 빈칸 폭이 다름`;
      hidden.push(String(e.value));
    }
  }
  if (hidden.length === 0) return "빈칸 없음";
  if (hidden.join(",") !== p.answer) return `정답이 빈칸과 다름: ${p.answer} ≠ ${hidden.join(",")}`;
  if (hidden.length > 1 && p.fields?.length !== hidden.length) return "빈칸 수와 답 칸 수가 다름";
  return null;
}
