import type { Generator } from "../types";
import { makeChoices, pick, randInt } from "../../lib/random";
import { numberProblem } from "./common";
import { mixedText } from "./grade4";
import { gcd, reduced } from "./grade5";
import { compose, pieGraph, solidScene } from "../lessons/g6-figs";
import { boxScene, cuboidNetScene } from "../lessons/g6";
import { josa } from "../josa";

const trim = (n: number, places = 3) => String(Number(n.toFixed(places)));

/* ── 6-1 분수의 나눗셈 ── */

export const wholeDivWhole: Generator = {
  id: "whole-div-whole",
  level: 1,
  make(rand) {
    // 몫이 1보다 작은 차시: 나누어지는 수가 나누는 수보다 작다
    const b = randInt(rand, 2, 12);
    const a = randInt(rand, 1, b - 1);
    const answer = reduced(a, b);
    return {
      key: `${this.id}:${a}:${b}`,
      typeId: this.id,
      prompt: "나눗셈의 몫을 분수로 나타낸 것을 고르세요.",
      expression: `${a} ÷ ${b}`,
      input: "choice",
      choices: makeChoices(rand, answer, [reduced(b, a), mixedText(a, b + 1), reduced(a + 1, b)], () => reduced(randInt(rand, 1, b * 2), b)),
      answer,
      hint: "(자연수) ÷ (자연수)의 몫은 나누어지는 수를 분자, 나누는 수를 분모로 해요.",
      explanation: `${a} ÷ ${b} = ${a}/${b}${answer !== `${a}/${b}` ? ` = ${answer}` : ""}`,
      mistakes: { [reduced(b, a)]: "분자와 분모를 바꿨어요." },
    };
  },
};

export const fracDivWhole: Generator = {
  id: "frac-div-whole",
  level: 2,
  make(rand) {
    // 대분수 ÷ 자연수는 다음 차시(mixed-whole)이므로 기약인 진분수만
    const d = randInt(rand, 2, 12);
    const n = randInt(rand, 1, d - 1);
    if (gcd(n, d) !== 1) return this.make(rand);
    const k = randInt(rand, 2, 9);
    const answer = reduced(n, d * k);
    return {
      key: `${this.id}:${n}/${d}:${k}`,
      typeId: this.id,
      prompt: "계산하여 기약분수로 나타낸 것을 고르세요.",
      expression: `${n}/${d} ÷ ${k}`,
      input: "choice",
      choices: makeChoices(rand, answer, [reduced(n * k, d), reduced(n, d + k), reduced(n + k, d * k)], () => reduced(randInt(rand, 1, d * k), d * k)),
      answer,
      hint: "÷ (자연수)는 × 1/(자연수)로 바꾸어 계산해요.",
      explanation: `${n}/${d} × 1/${k} = ${n}/${d * k}${answer !== `${n}/${d * k}` ? ` = ${answer}` : ""}`,
      mistakes: { [reduced(n * k, d)]: "나누어야 하는데 곱했어요." },
    };
  },
};

/* ── 6-2 분수의 나눗셈(분수÷분수) ── */

export const fracDivFrac: Generator = {
  id: "frac-div-frac",
  level: 1,
  make(rand) {
    // 대분수는 다음 차시에서 다루므로 진분수·가분수만, 모두 기약분수
    const same = rand() < 0.4;
    const d1 = randInt(rand, 2, 9);
    const d2 = same ? d1 : randInt(rand, 2, 9);
    const n1 = randInt(rand, 1, d1 * 2);
    const n2 = randInt(rand, 1, d2 - 1);
    if (n1 % d1 === 0 || reduced(n1, d1) !== mixedText(n1, d1) || reduced(n2, d2) !== `${n2}/${d2}`) return this.make(rand);
    const answer = reduced(n1 * d2, d1 * n2);
    return {
      key: `${this.id}:${n1}/${d1}:${n2}/${d2}`,
      typeId: this.id,
      prompt: "계산하여 기약분수로 나타낸 것을 고르세요.",
      expression: `${n1}/${d1} ÷ ${n2}/${d2}`,
      input: "choice",
      choices: makeChoices(rand, answer, [reduced(n1 * n2, d1 * d2), reduced(d1 * n2, n1 * d2), reduced(n1 * d2 + 1, d1 * n2)], () =>
        reduced(randInt(rand, 1, d1 * d2 * 2), d1 * n2),
      ),
      answer,
      hint: "나누는 분수의 분모와 분자를 바꾸어 곱해요.",
      explanation: `${n1}/${d1} × ${d2}/${n2} = ${n1 * d2}/${d1 * n2} = ${answer}`,
      mistakes: { [reduced(n1 * n2, d1 * d2)]: "나누는 분수를 뒤집지 않고 곱했어요." },
    };
  },
};

export const wholeDivFrac: Generator = {
  id: "whole-div-frac",
  level: 2,
  make(rand) {
    // (자연수)÷(단위분수)는 같은 차시의 하(l6-wf-unit)이므로 분자는 2 이상
    const d = randInt(rand, 3, 11);
    const n = randInt(rand, 2, d - 1);
    const k = n * randInt(rand, 1, 5);
    if (reduced(n, d) !== `${n}/${d}`) return this.make(rand);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${k}:${n}/${d}`,
      prompt: "계산해 보세요.",
      expression: `${k} ÷ ${n}/${d} = □`,
      answer: (k / n) * d,
      hint: `${k} × ${n === 1 ? josa(d, "으로/로") : `${d}/${n}${josa(d, "으로/로").slice(String(d).length)}`} 바꾸어 계산해요.`,
      explanation: `${k} × ${d} ÷ ${n} = ${(k / n) * d}`,
    });
  },
};

/* ── 6-1 각기둥과 각뿔, 6-2 원기둥·원뿔·구 ── */

const POLY = ["", "", "", "삼", "사", "오", "육", "칠", "팔"];

/** 겨냥도를 보고 각기둥·각뿔의 구성 요소 세기 */
export const prismParts: Generator = {
  id: "prism-parts",
  level: 1,
  make(rand) {
    const n = randInt(rand, 3, 6);
    const prism = rand() < 0.5;
    const part = pick(rand, ["면", "모서리", "꼭짓점"] as const);
    const v = prism ? { 면: n + 2, 모서리: 3 * n, 꼭짓점: 2 * n }[part] : { 면: n + 1, 모서리: 2 * n, 꼭짓점: n + 1 }[part];
    const name = `${POLY[n]}각${prism ? "기둥" : "뿔"}`;
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${n}:${prism}:${part}`,
      prompt: `그림과 같은 입체도형의 ${part}${part === "모서리" ? "는" : "은"} 모두 몇 개인가요?`,
      visual: solidScene(n, !prism),
      answer: v,
      fields: ["개"],
      hint: prism
        ? `보이지 않는 모서리(점선)도 세어요. 각기둥: 면 (한 밑면의 변의 수)+2, 모서리 (변의 수)×3, 꼭짓점 (변의 수)×2`
        : `보이지 않는 모서리(점선)도 세어요. 각뿔: 면 (밑면의 변의 수)+1, 모서리 (변의 수)×2, 꼭짓점 (변의 수)+1`,
      explanation: `${name}의 ${part}: ${v}개`,
    });
  },
};

/** 겨냥도를 보고 각기둥·각뿔의 이름 고르기(각뿔의 이름과 구성 요소 차시에서 각기둥과 비교) */
export const prismName: Generator = {
  id: "prism-name",
  level: 1,
  make(rand) {
    const n = randInt(rand, 3, 6);
    const prism = rand() < 0.5;
    const answer = `${POLY[n]}각${prism ? "기둥" : "뿔"}`;
    const other = `${POLY[n]}각${prism ? "뿔" : "기둥"}`;
    return {
      key: `${this.id}:${n}:${prism}`,
      typeId: this.id,
      prompt: "그림과 같은 입체도형의 이름을 고르세요.",
      visual: solidScene(n, !prism),
      input: "choice",
      choices: makeChoices(rand, answer, [other, `${POLY[n + 1]}각${prism ? "기둥" : "뿔"}`, `${POLY[n === 3 ? 4 : n - 1]}각${prism ? "뿔" : "기둥"}`], () => "원기둥"),
      answer,
      hint: "밑면의 모양으로 이름을 정하고, 옆면이 직사각형이면 각기둥, 삼각형이면 각뿔이에요.",
      explanation: `밑면이 ${POLY[n]}각형이고 옆면이 ${prism ? "직사각형" : "삼각형"}이므로 ${answer}입니다.`,
    };
  },
};

/* ── 6-1 소수의 나눗셈, 6-2 소수÷소수 ── */

export const decDivWhole: Generator = {
  id: "dec-div-whole",
  level: 1,
  make(rand) {
    // 각 자리에서 나누어떨어지지 않는 차시: 나누어지는 수는 소수 두 자리(0을 내리지 않음),
    // 어느 한 자리는 나누어떨어지지 않고, 몫은 1보다 크며 중간에 0이 없다
    const k = randInt(rand, 2, 9);
    const q = randInt(rand, 111, 999) / 100;
    const a = Number((q * k).toFixed(2));
    const digits = String(Math.round(a * 100)).split("").map(Number);
    const qDigits = String(Math.round(q * 100));
    if (Math.round(a * 100) % 10 === 0 || digits.every((x) => x % k === 0) || qDigits.includes("0")) return this.make(rand);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${k}`,
      prompt: "계산해 보세요.",
      expression: `${trim(a, 2)} ÷ ${k} = □`,
      answer: trim(q, 2),
      hint: "자연수의 나눗셈처럼 계산하고, 나누어지는 수의 소수점 위치에 맞추어 몫의 소수점을 찍어요.",
      explanation: `${trim(a, 2)} ÷ ${k} = ${trim(q, 2)}`,
      mistakes: { [trim(q * 10, 2)]: "소수점 위치가 한 자리 틀렸어요." },
    });
  },
};

export const decDivDec: Generator = {
  id: "dec-div-dec",
  level: 1,
  make(rand) {
    // 자릿수가 같은 (소수)÷(소수) 차시: 두 수 모두 소수 한 자리(자연수가 되면 다시 뽑기)
    const b = randInt(rand, 2, 99) / 10;
    const q = randInt(rand, 2, 30);
    const a = Number((b * q).toFixed(1));
    if (Number.isInteger(b) || Number.isInteger(a)) return decDivDec.make(rand);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: "계산해 보세요.",
      expression: `${trim(a, 1)} ÷ ${trim(b, 1)} = □`,
      answer: q,
      hint: "나누는 수와 나누어지는 수의 소수점을 똑같이 오른쪽으로 옮겨 자연수의 나눗셈으로 바꿔요.",
      explanation: `${trim(a * 10, 0)} ÷ ${trim(b * 10, 0)} = ${q}`,
      mistakes: { [q / 10]: "소수점을 한쪽만 옮겼어요.", [q * 10]: "소수점을 한쪽만 옮겼어요." },
    });
  },
};

export const decDivRound: Generator = {
  id: "dec-div-round",
  level: 2,
  make(rand) {
    const a = randInt(rand, 10, 99);
    const b = pick(rand, [3, 6, 7, 9, 11, 13]);
    if (a % b === 0) return decDivRound.make(rand); // 나누어떨어지면 반올림할 것이 없다
    const v = Math.round((a / b) * 10) / 10;
    // 반올림한 값이 자연수(예: 6.97 → 7.0)면 '소수 첫째 자리까지'의 답 꼴이 흐려지므로 다시 뽑는다
    if (Number.isInteger(v)) return decDivRound.make(rand);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: `${a} ÷ ${b}의 몫을 반올림하여 소수 첫째 자리까지 나타내세요.`,
      answer: trim(v, 1),
      hint: "소수 둘째 자리까지 구한 뒤 둘째 자리에서 반올림해요.",
      explanation: `${a} ÷ ${b} = ${trim(a / b, 3)}… → ${trim(v, 1)}`,
      mistakes: { [trim(Math.floor((a / b) * 10) / 10, 1)]: "반올림하지 않고 버렸어요." },
    });
  },
};

/* ── 6-1 비와 비율 ── */

export const ratioValue: Generator = {
  id: "ratio-value",
  level: 1,
  make(rand) {
    const b = pick(rand, [2, 4, 5, 8, 10, 20, 25]);
    const a = randInt(rand, 1, b - 1);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}`,
      prompt: `비 ${a} : ${b}의 비율을 소수로 나타내세요.`,
      answer: trim(a / b, 3),
      hint: "비율 = (비교하는 양) ÷ (기준량). 기준량은 : 뒤의 수예요.",
      explanation: `${a} ÷ ${b} = ${trim(a / b, 3)}`,
      mistakes: { [trim(b / a, 3)]: "기준량과 비교하는 양을 바꿨어요." },
    });
  },
};

export const percent: Generator = {
  id: "percent",
  level: 1,
  make(rand) {
    const p = randInt(rand, 1, 99);
    const toPercent = rand() < 0.5;
    return toPercent
      ? numberProblem({
          typeId: this.id,
          key: `${this.id}:to:${p}`,
          prompt: `비율 ${josa(trim(p / 100, 2), "을/를")} 백분율로 나타내세요.`,
          answer: p,
          fields: ["%"],
          hint: "비율에 100을 곱하면 백분율이에요.",
          explanation: `${trim(p / 100, 2)} × 100 = ${p}(%)`,
          mistakes: { [trim(p / 10, 1)]: "10만 곱했어요." },
        })
      : numberProblem({
          typeId: this.id,
          key: `${this.id}:from:${p}`,
          prompt: `${p}%를 소수로 나타내세요.`,
          answer: trim(p / 100, 2),
          hint: "백분율을 100으로 나누면 비율이에요.",
          explanation: `${p} ÷ 100 = ${trim(p / 100, 2)}`,
        });
  },
};

export const percentOf: Generator = {
  id: "percent-of",
  level: 2,
  make(rand) {
    const total = pick(rand, [20, 40, 50, 80, 200, 300, 500, 1000]);
    const p = pick(rand, [5, 10, 15, 20, 25, 30, 40, 50, 60, 75]);
    const v = (total * p) / 100;
    if (!Number.isInteger(v)) return this.make(rand);
    const item = pick(rand, ["할인받은 금액", "당첨된 사람 수", "소금의 양"]);
    const unit = item === "할인받은 금액" ? "원" : item === "당첨된 사람 수" ? "명" : "g";
    const prompt =
      item === "할인받은 금액"
        ? `${(total * 100).toLocaleString("ko-KR")}원짜리 물건을 ${p}% 할인받았습니다. 할인받은 금액은 얼마인가요?`
        : item === "당첨된 사람 수"
          ? `${total}명이 응모하여 ${p}%가 당첨되었습니다. 당첨된 사람은 몇 명인가요?`
          : `소금물 ${total} g의 ${p}%가 소금입니다. 소금은 몇 g인가요?`;
    const ans = item === "할인받은 금액" ? v * 100 : v;
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${item}:${total}:${p}`,
      prompt,
      answer: ans,
      fields: [unit],
      hint: `전체 × ${p}/100${josa(p, "을/를").slice(String(p).length)} 계산해요.`,
      explanation: `${item === "할인받은 금액" ? total * 100 : total} × ${p}/100 = ${ans}`,
    });
  },
};

/* ── 6-1 여러 가지 그래프 ── */

/** 원그래프를 보고 □ 안의 백분율이나 학생 수 구하기 */
export const circleGraphPercent: Generator = {
  id: "circle-graph-percent",
  level: 1,
  make(rand) {
    const items = ["운동", "독서", "게임", "음악"];
    const ps = [randInt(rand, 5, 8) * 5, randInt(rand, 3, 5) * 5, randInt(rand, 3, 4) * 5];
    const last = 100 - ps.reduce((a, b) => a + b, 0);
    // 원그래프 칸에 이름과 백분율을 쓸 수 있게 모두 15% 이상
    if (last < 15) return this.make(rand);
    const all = [...ps, last];
    const askPercent = rand() < 0.5;
    const total = pick(rand, [200, 300, 400, 500]);
    const i = randInt(rand, 0, 3);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${all.join()}:${askPercent}:${total}:${i}`,
      prompt: askPercent
        ? "좋아하는 취미를 조사하여 나타낸 원그래프입니다. □ 안에 알맞은 백분율은 얼마인가요?"
        : `학생 ${total}명이 좋아하는 취미를 조사하여 나타낸 원그래프입니다. ${josa(items[i], "을/를")} 좋아하는 학생은 몇 명인가요?`,
      visual: compose(240, 230, "좋아하는 취미별 학생 수의 원그래프", pieGraph(items.map((name, j) => ({ name, pct: all[j], show: askPercent && j === i ? "□%" : undefined })), [120, 115], 95)),
      answer: askPercent ? all[i] : (total * all[i]) / 100,
      fields: [askPercent ? "%" : "명"],
      hint: askPercent ? "모든 항목의 백분율 합은 100%예요." : `전체 학생 수 × ${all[i]}/100`,
      explanation: askPercent ? `100 − ${all.filter((_, j) => j !== i).join(" − ")} = ${all[i]}(%)` : `${total} × ${all[i]}/100 = ${(total * all[i]) / 100}(명)`,
    });
  },
};

/* ── 6-1 직육면체의 부피와 겉넓이 ── */

/** 겨냥도에 적힌 길이로 부피 구하기 */
export const cuboidVolume: Generator = {
  id: "cuboid-volume",
  level: 1,
  make(rand) {
    const a = randInt(rand, 2, 10);
    const b = randInt(rand, 2, 10);
    const c = randInt(rand, 2, 10);
    const cube = rand() < 0.3;
    const d = cube ? [a, a, a] : [a, b, c];
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${cube}:${d.join()}`,
      prompt: `그림과 같은 ${cube ? "정육면체" : "직육면체"}의 부피는 몇 cm³인가요?`,
      visual: boxScene(d, d.map((v) => `${v} cm`), cube ? `한 모서리가 ${a} cm인 정육면체` : `가로 ${a} cm, 세로 ${b} cm, 높이 ${c} cm인 직육면체`),
      answer: cube ? a ** 3 : a * b * c,
      fields: ["cm³"],
      hint: cube ? "정육면체의 부피 = (한 모서리) × (한 모서리) × (한 모서리)" : "부피 = (가로) × (세로) × (높이)",
      explanation: cube ? `${a} × ${a} × ${a} = ${a ** 3}(cm³)` : `${a} × ${b} × ${c} = ${a * b * c}(cm³)`,
      mistakes: cube ? { [a * a]: "두 번만 곱했어요.", [a * 3]: "3을 곱했어요." } : { [a + b + c]: "곱하지 않고 더했어요." },
    });
  },
};

/** 전개도에 적힌 길이로 겉넓이 구하기 */
export const cuboidSurface: Generator = {
  id: "cuboid-surface",
  level: 2,
  make(rand) {
    const a = randInt(rand, 2, 9);
    const b = randInt(rand, 2, 9);
    const c = randInt(rand, 2, 9);
    if (a === b && b === c) return this.make(rand);
    const s = 2 * (a * b + b * c + c * a);
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}:${c}`,
      prompt: "그림과 같은 전개도를 접어 만든 직육면체의 겉넓이는 몇 cm²인가요?",
      visual: cuboidNetScene(a, b, c, [`${a} cm`, `${b} cm`, `${c} cm`]),
      answer: s,
      fields: ["cm²"],
      hint: "합동인 면이 2개씩 3쌍이에요. (세 면의 넓이의 합) × 2",
      explanation: `(${a * b} + ${b * c} + ${c * a}) × 2 = ${s}(cm²)`,
      mistakes: { [s / 2]: "2를 곱하지 않았어요.", [a * b * c]: "부피를 구했어요." },
    });
  },
};

export const volumeUnits: Generator = {
  id: "volume-units",
  level: 2,
  make(rand) {
    const m = randInt(rand, 1, 9);
    const toCm = rand() < 0.5;
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${toCm}:${m}`,
      prompt: "□ 안에 알맞은 수를 써넣으세요.",
      expression: toCm ? `${m} m³ = □ cm³` : `${m * 1000000} cm³ = □ m³`,
      answer: toCm ? m * 1000000 : m,
      hint: "1 m³ = 100 cm × 100 cm × 100 cm = 1000000 cm³",
      explanation: `1 m³ = 1000000 cm³`,
      mistakes: toCm ? { [m * 100]: "100만 곱했어요.", [m * 1000]: "1000만 곱했어요." } : {},
    });
  },
};

/* ── 6-2 비례식과 비례배분 ── */

export const proportion: Generator = {
  id: "proportion",
  level: 1,
  make(rand) {
    const a = randInt(rand, 1, 9);
    const b = randInt(rand, 1, 9);
    if (a === b) return this.make(rand);
    const k = randInt(rand, 2, 9);
    const pos = randInt(rand, 0, 3);
    const nums = [a, b, a * k, b * k];
    const shown = nums.map((n, i) => (i === pos ? "□" : String(n)));
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}:${k}:${pos}`,
      prompt: "비례식에서 □ 안에 알맞은 수를 구하세요.",
      expression: `${shown[0]} : ${shown[1]} = ${shown[2]} : ${shown[3]}`,
      answer: nums[pos],
      hint: "외항의 곱과 내항의 곱은 같아요.",
      explanation: `${a} × ${b * k} = ${b} × ${a * k}`,
    });
  },
};

export const proportionalShare: Generator = {
  id: "proportional-share",
  level: 2,
  make(rand) {
    const a = randInt(rand, 1, 7);
    const b = randInt(rand, 1, 7);
    // 가장 간단한 자연수의 비로만 준다(3 : 6 같은 비는 내지 않는다)
    if (a === b || reduced(a, b) !== `${a}/${b}`) return this.make(rand);
    const unit = randInt(rand, 2, 12);
    const total = (a + b) * unit;
    const first = rand() < 0.5;
    return numberProblem({
      typeId: this.id,
      key: `${this.id}:${a}:${b}:${unit}:${first}`,
      prompt: `구슬 ${total}개를 형과 동생이 ${josa(`${a} : ${b}`, "으로/로")} 나누어 가지려고 합니다. ${first ? "형" : "동생"}은 몇 개를 가지나요?`,
      answer: (first ? a : b) * unit,
      fields: ["개"],
      hint: `전체를 ${a} + ${b} = ${josa(a + b, "으로/로")} 나누어 그중 ${first ? a : b}만큼이에요.`,
      explanation: `${total} × ${first ? a : b}/${a + b} = ${(first ? a : b) * unit}(개)`,
      mistakes: { [(first ? b : a) * unit]: "다른 사람의 몫을 구했어요." },
    });
  },
};
