/**
 * math-king(학년별 수학 문제 생성기)의 문제를 이 게임의 문제 은행 형식(글 4지선다)으로 바꾼다.
 * 가져올 수 없는 문제(그림, 보기 3개, 답이 여러 칸 등)는 이유와 함께 건너뛴다.
 * 문장은 원문 그대로 쓴다. 다만 써넣는 문제는 객관식에 맞게 "고르세요"로 바꾼다.
 */

/** math-king의 Problem 중 변환에 쓰는 부분 (math-king/src/content/types.ts) */
export type MkProblem = {
  prompt: string;
  expression?: string;
  visual?: unknown;
  input: "choice" | "number" | "fields";
  fields?: string[];
  choices?: string[];
  answer: string;
  explanation: string;
  /** 흔한 실수로 나오는 오답 → 설명 */
  mistakes?: Record<string, string>;
};

export type Converted = { question: string; choices: string[]; answer: number; explanation: string };

/** scripts/validate.mjs의 길이 제한과 같다 */
const LIMIT = { question: [5, 120], choice: 30, explanation: [5, 100] } as const;
const UNSUPPORTED = /모두 고르|알맞지 않은 것을 모두|그림을 보고|다음 글을 읽고/;

const isNumber = (s: string) => /^\d+(\.\d+)?$/.test(s);
const oneLine = (s: string) => s.replace(/\s*\n\s*/g, " ").trim();

function shuffle<T>(rand: () => number, items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** 객관식으로 바꾸므로 "써넣으세요"는 "고르세요"로 (math-king의 객관식 변형과 같은 규칙) */
const asChoicePrompt = (prompt: string) => prompt.replace(/(써넣으세요|쓰세요)\.$/, "고르세요.");

/**
 * 그럴듯한 오답 3개: 흔한 실수 오답을 먼저 쓰고, 모자라면 정답과 가까운 수로 채운다.
 * 가까운 수는 정답보다 작은 쪽·큰 쪽에 몇 개씩 둘지를 무작위로 정한다.
 * (늘 정답 ±1로 채우면 "연속한 세 수의 가운데"가 정답이라는 것이 드러난다)
 */
/** "1명, 2명, 5명, 10명 중에서 정할 때"처럼 문제가 답의 후보를 정해 놓은 경우 그 수들 */
const CANDIDATES = /((?:\d+(?:\.\d+)?[^\s,]{0,3},\s*)+\d+(?:\.\d+)?[^\s,]{0,3})\s*중에서\s*(?:정할|고를|택할|골라)/;
function candidatesOf(prompt: string): string[] | null {
  const m = prompt.match(CANDIDATES);
  return m ? m[1].split(",").map((x) => x.trim().match(/^\d+(?:\.\d+)?/)![0]) : null;
}

/** 소수가 붙으면 어색한 셈 단위 (원, 개, 명 …). 길이·무게·들이 단위는 소수가 자연스럽다 */
const COUNT_UNIT = /^(원|개|명|가지|번|장|칸|마리|자루|권|대|쌍|송이|조각|상자|살|일|년|째|번째|점|쪽|봉지|도막|자리|각형)$/;

/** 오답으로 쓰기에 모양이 이상한 수: 소수 넷째 자리 이상(19.333333…, 0.0388), 셈 단위에 붙은 소수(15937.5원) */
function uglyNumber(x: string, unit: string): boolean {
  if (!isNumber(x)) return false;
  const decimals = x.split(".")[1]?.length ?? 0;
  // 초등은 소수 세 자리까지 다룬다 (정답이 그보다 길면 오답 후보가 모자라 문제를 건너뛴다)
  return decimals > 3 || (decimals > 0 && COUNT_UNIT.test(unit));
}

/** "1,000,000씩", "1만씩", "1000억씩" 뛰어 세기의 한 번 크기 */
function stepOf(text: string): number | null {
  const m = text.match(/(\d[\d,]*)(조|억|만)?씩 (?:\d+번 )?뛰어/);
  if (!m) return null;
  const unit = { 조: 1e12, 억: 1e8, 만: 1e4 }[m[2] as "조" | "억" | "만"] ?? 1;
  return Number(m[1].replace(/,/g, "")) * unit;
}

function distractors(p: MkProblem, rand: () => number): string[] {
  const numeric = isNumber(p.answer);
  const unit = p.input === "fields" ? (p.fields?.[0] ?? "") : "";
  // 오답이 될 수 있는 값의 범위: 음수는 없고, 답이 2 이상이면 0도 말이 안 된다(0개, 0각형, 0 cm, 0시). 시각은 1~12시
  const lowest = Number(p.answer) >= 2 || unit === "시" ? 1 : 0;
  const inRange = (v: number) => v >= lowest && (unit !== "시" || v <= 12);
  const same = (x: string) => x === p.answer || (numeric && isNumber(x) && Number(x) === Number(p.answer));
  const candidates = candidatesOf(p.prompt);
  if (candidates) return shuffle(rand, candidates.filter((x) => !same(x))).slice(0, 3);
  const answerDecimals = p.answer.split(".")[1]?.length ?? 0;
  // 정답보다 소수 자리가 2자리 이상 긴 오답은 학생 실수가 아니다 (0.104 ↔ 0.1161, 분수 문제의 1.3333)
  // (단, 정답의 10배·100배·1/10·1/100처럼 소수점만 옮긴 값은 실제 실수라 쓴다)
  const shiftOfAnswer = (v: number) => [-2, -1, 1, 2].some((k) => Math.abs(v - Number(p.answer) * 10 ** k) < 1e-9);
  const tooLong = (k: string) => {
    const d = isNumber(k) ? (k.split(".")[1]?.length ?? 0) : 0;
    return d > answerDecimals && d >= 3 && !shiftOfAnswer(Number(k));
  };
  const mistakes = [...new Set(Object.keys(p.mistakes ?? {}))]
    .filter((k) => !k.includes(",") && !k.trim().startsWith("-") && !same(k) && !uglyNumber(k, unit) && !tooLong(k))
    .filter((k) => !isNumber(k) || inRange(Number(k)))
    // 값이 같은 오답(6과 6.0)은 하나만
    .filter((k, i, all) => !isNumber(k) || all.findIndex((o) => isNumber(o) && Number(o) === Number(k)) === i)
    .slice(0, 3);
  let need = 3 - mistakes.length;
  if (!numeric || need <= 0) return mistakes;

  const a = Number(p.answer);
  const digits = answerDecimals;
  const taken = new Set(mistakes.filter(isNumber).map(Number));
  // 소수가 나오는 계산이거나 큰 자연수(10 이상)면 자릿값을 한 자리 잘못 쓴 오답을 하나 섞는다
  // (57.1 × 10 → 5710·57.1, 600000000 → 60000000·6000000000: 0을 하나 덜·더 붙인 실수)
  const text = `${p.prompt} ${p.expression ?? ""}`;
  // (늘 넣으면 정답이 크기순 맨 끝에 오지 않으므로 큰 자연수는 가끔만)
  const decimalTask = /\d\.\d/.test(text) || digits > 0;
  // (뛰어 세기 문제는 아랫자리가 그대로여야 하므로 자릿값 오답을 쓰지 않는다)
  if (!stepOf(text) && (decimalTask || (a >= 10 && !COUNT_UNIT.test(unit) && unit !== "°" && unit !== "시" && rand() < 0.6))) {
    // 끝자리가 0인 답에 0을 덜 붙이면 다시 모양으로 답이 드러나므로(26000 → 2600) 그때는 0을 더 붙인 쪽만
    const trailingZero = digits === 0 && a % 10 === 0;
    // 자연수 답은 0을 덜 붙여도 자연수일 때만 (2370628 → 237062.8 같은 소수 오답 금지)
    const integerAnswer = digits === 0 && !decimalTask;
    const shifted = shuffle(rand, trailingZero || integerAnswer ? [a * 10] : [a * 10, a / 10]).map((v) => Number(v.toPrecision(12)));
    const pick = shifted.find((v) => v > 0 && v !== a && !taken.has(v) && !uglyNumber(String(v), unit) && inRange(v));
    if (pick !== undefined) {
      mistakes.push(String(pick));
      taken.add(pick);
      need--;
    }
  }
  if (need <= 0) return mistakes;
  // 끝자리가 0인 답(26000, 410000원)은 오답도 같은 자리까지 0으로: 정답 ±1이면 끝자리만 보고 답을 고른다
  let zeros = 0;
  if (digits === 0 && a > 0) while (a % 10 ** (zeros + 1) === 0) zeros++;
  // 뛰어 세기 문제("1,000,000씩", "1만씩")는 한 번 더·덜 뛴 수가 실제 실수다 (아랫자리는 그대로라 ±1이면 답이 드러난다)
  const step = stepOf(text);
  // 큰 자연수는 가끔 10씩 차이 나는 오답을 쓴다 (자릿값 실수)
  const gap =
    step && digits === 0 ? step : zeros > 0 ? 10 ** zeros : 10 ** -digits * (digits === 0 && a >= 20 && rand() < 0.3 ? 10 : 1);
  const near = (sign: 1 | -1) => {
    const out: string[] = [];
    for (let k = 1; out.length < need && k <= 8; k++) {
      const v = Number((a + sign * k * gap).toFixed(digits));
      if (inRange(v) && !taken.has(v)) out.push(String(v)); // 6.0이 아니라 6
    }
    return out;
  };
  const below = near(-1);
  const above = near(1);
  // 작은 쪽·큰 쪽 개수는 무작위로, 한쪽이 모자라면(12시, 1개) 다른 쪽에서 채운다
  let fromBelow = Math.min(below.length, Math.floor(rand() * (need + 1)));
  if (above.length < need - fromBelow) fromBelow = Math.min(below.length, need - above.length);
  return [...mistakes, ...below.slice(0, fromBelow), ...above.slice(0, need - fromBelow)];
}

/** "3 1/14", "15/14", "0.5" 같은 보기의 값 (분수 꼴이 아니면 null) */
function fractionValue(text: string): number | null {
  const m = text.trim().match(/^(?:(\d+) )?(\d+)\/(\d+)$/);
  if (!m) return null;
  return Number(m[1] ?? 0) + Number(m[2]) / Number(m[3]);
}

/** 서수는 '17번째', '몇 번째'로 쓴다 (교과서 표기. '17째'는 쓰지 않는다) */
const ordinalText = (text: string) => text.replace(/몇째/g, "몇 번째").replace(/(\d+)째/g, "$1번째");
/**
 * math-king의 친구 이름 '하루'는 "하루는 5/8판을 먹고"처럼 '하루(1일)'로 읽힌다.
 * 이름으로 쓰인 경우(하루는·하루가·하루의·하루에게·하루: 와 "하루 1.59 m")만 받침 없는 다른 이름으로 바꾼다
 */
const renameHaru = (text: string) => text.replace(/하루(?=는|가|의|에게|:)/g, "주아").replace(/하루(?= \d)(?! 24시간)/g, "주아");
const ordinal = (text: string) => renameHaru(ordinalText(text));

export function convertProblem(source: MkProblem, rand: () => number): Converted | { skip: string } {
  const p: MkProblem = {
    ...source,
    prompt: ordinal(source.prompt),
    explanation: ordinal(source.explanation),
    ...(source.fields?.length === 1 && source.fields[0] === "째" ? { fields: ["번째"] } : {}),
    ...(source.choices ? { choices: source.choices.map(ordinal), answer: ordinal(source.answer) } : {}),
  };
  if (p.visual) return { skip: "visual" };
  const prompt = p.input === "choice" ? oneLine(p.prompt) : asChoicePrompt(oneLine(p.prompt));
  const question = [prompt, p.expression ? oneLine(p.expression) : ""].filter(Boolean).join(" ");
  if (question.length > LIMIT.question[1]) return { skip: "long-question" };
  if (question.length < LIMIT.question[0]) return { skip: "short-question" };
  if (UNSUPPORTED.test(question)) return { skip: "unsupported-format" };

  let choices: string[];
  let answerText: string;
  if (p.input === "choice") {
    if (p.choices?.length !== 4) return { skip: `choices-${p.choices?.length ?? 0}` };
    choices = p.choices.map((c) => c.trim());
    answerText = p.answer.trim();
  } else if (p.input === "number" || p.fields?.length === 1) {
    const unit = p.input === "fields" ? p.fields![0] : "";
    const candidates = candidatesOf(p.prompt);
    if (candidates && !candidates.some((c) => Number(c) === Number(p.answer))) return { skip: "answer-not-in-candidates" };
    const wrong = distractors(p, rand);
    if (wrong.length < 3) return { skip: "few-distractors" };
    const raw = [p.answer, ...wrong];
    const values = raw.filter(isNumber).map(Number);
    if (new Set(values).size !== values.length) return { skip: "duplicate-choices" }; // 6과 6.0처럼 값이 같은 보기
    // 영문 단위(cm, kg, L …)는 수와 띄어 쓰고, 우리말 단위(개, 명, 원)와 °는 붙여 쓴다
    const label = (x: string) => `${x}${/^[A-Za-z]/.test(unit) ? " " : ""}${unit}`;
    answerText = label(p.answer);
    choices = shuffle(rand, raw.map(label));
  } else {
    return { skip: "multi-fields" };
  }
  if (new Set(choices).size !== 4) return { skip: "duplicate-choices" };
  // 대분수의 분수 부분이 가분수인 표기(2 15/14)는 교과서에 없고, 값으로는 정답(3 1/14)과 같아 정답이 둘로 읽힌다.
  // 단, 대분수를 만들거나 나타내는 문제는 이런 잘못된 대분수를 가려내는 것이 배울 내용이라 그대로 둔다
  const makesMixed = /대분수로 나타낸|대분수를 만들/.test(question);
  if (!makesMixed && choices.some((c) => /^\d+ (\d+)\/(\d+)$/.test(c) && Number(c.split(" ")[1].split("/")[0]) >= Number(c.split("/")[1]))) {
    return { skip: "improper-mixed" };
  }
  // 분수는 값으로 비교한다: 정답과 값이 같은 오답이 있으면 정답이 둘이다.
  // 단, 분수의 모양을 묻는 문제(기약분수, 약분, 크기가 같은 분수, 분모와 분자)는 값이 같은 오답이 일부러 들어 있다
  const asksForm = makesMixed || /기약분수|약분|크기가 같은|크기가 다른|분모와 분자/.test(question);
  const answerValue = fractionValue(answerText);
  if (!asksForm && answerValue !== null && choices.some((c) => c !== answerText && Math.abs((fractionValue(c) ?? NaN) - answerValue) < 1e-9)) {
    return { skip: "duplicate-choices" };
  }
  if (!choices.includes(answerText)) return { skip: "answer-missing" };
  if (choices.some((c) => !c || c.length > LIMIT.choice)) return { skip: "long-choice" };

  const explanation = oneLine(p.explanation);
  if (explanation.length > LIMIT.explanation[1]) return { skip: "long-explanation" };
  if (explanation.length < LIMIT.explanation[0]) return { skip: "short-explanation" };
  return { question, choices, answer: choices.indexOf(answerText), explanation };
}
