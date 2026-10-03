import type { Generator } from "../types";
import { makeChoices, randInt } from "../../lib/random";
import { josa } from "../josa";

/** 0.1이 k개인 수 → "k/10" 을 소수 한 자리로 */
const dec = (tenths: number) => (tenths / 10).toFixed(1);
const sign = (a: number, b: number) => (a > b ? ">" : a < b ? "<" : "=");

/** 분모가 10인 분수를 소수로 */
export const decFromFrac10: Generator = {
  id: "dec-from-frac10",
  level: 1,
  make(rand) {
    const k = randInt(rand, 1, 9);
    const answer = dec(k);
    return {
      key: `dec-from-frac10:${k}`,
      typeId: this.id,
      prompt: "분수를 소수로 나타내어 보세요.",
      expression: `${k}/10 = □`,
      input: "number",
      answer,
      hint: "1/10은 0.1이에요. 그럼 0.1이 몇 개인가요?",
      explanation: `${josa(`${k}/10`, "은/는")} 0.1이 ${k}개이므로 ${answer}입니다.`,
      mistakes: { [String(k)]: "소수점을 빠뜨렸어요.", [`0.0${k}`]: "0.1이 아니라 0.01로 생각했어요." },
    };
  },
};

/** 10칸 중 색칠한 부분을 소수로 */
export const decReadShaded: Generator = {
  id: "dec-read-shaded",
  level: 1,
  make(rand) {
    const k = randInt(rand, 1, 9);
    const answer = dec(k);
    return {
      key: `dec-read-shaded:${k}`,
      typeId: this.id,
      prompt: "전체를 똑같이 10칸으로 나누었습니다. 색칠한 부분을 소수로 나타내어 보세요.",
      visual: { kind: "bar", parts: 10, shaded: k },
      input: "number",
      answer,
      hint: "한 칸은 전체의 1/10, 곧 0.1이에요.",
      explanation: `0.1이 ${k}칸이므로 ${answer}입니다.`,
      mistakes: { [String(k)]: "소수점을 빠뜨렸어요.", [dec(10 - k)]: "색칠하지 않은 칸을 세었어요." },
    };
  },
};

/** 0.1이 k개인 수 */
export const decCountTenths: Generator = {
  id: "dec-count-tenths",
  level: 2,
  make(rand) {
    let k = randInt(rand, 11, 99);
    if (k % 10 === 0) k += 1; // 9.0 같은 수는 3학년 범위에서 제외
    const reverse = rand() < 0.5;
    const value = dec(k);
    return reverse
      ? {
          key: `dec-count-tenths:r:${k}`,
          typeId: this.id,
          prompt: "□ 안에 알맞은 수를 써넣으세요.",
          // 소수는 끝자리를 읽는 소리로 조사를 정한다(6.1 → 육 점 일 → 은)
          expression: `${josa(value, "은/는")} 0.1이 □개인 수`,
          input: "number",
          answer: String(k),
          hint: "1은 0.1이 10개예요.",
          explanation: `${josa(value, "은/는")} 0.1이 ${k}개입니다.`,
          mistakes: { [value]: "소수를 그대로 썼어요. 0.1이 몇 개인지 세어 보세요." },
        }
      : {
          key: `dec-count-tenths:${k}`,
          typeId: this.id,
          prompt: "□ 안에 알맞은 소수를 써넣으세요.",
          expression: `0.1이 ${k}개인 수는 □`,
          input: "number",
          answer: value,
          hint: "0.1이 10개면 1이에요. 10개씩 묶어 보세요.",
          explanation: `0.1이 ${k}개이면 ${value}입니다.`,
          mistakes: { [String(k)]: "소수점을 빠뜨렸어요." },
        };
  },
};

/** 길이: ○cm ○mm = □cm */
export const decLength: Generator = {
  id: "dec-length",
  level: 2,
  make(rand) {
    const cm = randInt(rand, 1, 15);
    const mm = randInt(rand, 1, 9);
    const toCm = rand() < 0.6;
    const value = `${cm}.${mm}`;
    return toCm
      ? {
          key: `dec-length:cm:${cm}:${mm}`,
          typeId: this.id,
          prompt: "□ 안에 알맞은 소수를 써넣으세요.",
          expression: `${cm} cm ${mm} mm = □ cm`,
          input: "number",
          answer: value,
          hint: "1 mm는 0.1 cm예요.",
          explanation: `${mm} mm는 0.${mm} cm이므로 ${value} cm입니다.`,
          mistakes: { [`${cm}${mm}`]: "소수점을 빠뜨렸어요." },
        }
      : {
          key: `dec-length:mm:${cm}:${mm}`,
          typeId: this.id,
          prompt: "□ 안에 알맞은 수를 써넣으세요.",
          expression: `${value} cm = □ mm`,
          input: "number",
          answer: String(cm * 10 + mm),
          hint: "1 cm는 10 mm예요.",
          explanation: `${value} cm는 ${cm * 10 + mm} mm입니다.`,
          mistakes: { [value]: "단위를 mm로 바꾸지 않았어요." },
        };
  },
};

/** 소수 한 자리 수의 크기 비교 */
export const decCompare: Generator = {
  id: "dec-compare",
  level: 1,
  make(rand) {
    const a = randInt(rand, 1, 99);
    const b = rand() < 0.1 ? a : randInt(rand, 1, 99);
    const answer = sign(a, b);
    return {
      key: `dec-compare:${a}:${b}`,
      typeId: this.id,
      prompt: "○ 안에 >, =, < 중 알맞은 것을 고르세요.",
      expression: `${dec(a)} ○ ${dec(b)}`,
      input: "choice",
      choices: [">", "<", "="],
      answer,
      hint: "먼저 소수점 왼쪽의 수를 비교하고, 같으면 소수점 오른쪽 숫자를 비교해요.",
      explanation: `${josa(dec(a), "은/는")} 0.1이 ${a}개, ${josa(dec(b), "은/는")} 0.1이 ${b}개입니다. ${dec(a)} ${answer} ${dec(b)}`,
    };
  },
};

/** 소수 중 가장 큰 것 */
export const decLargest: Generator = {
  id: "dec-largest",
  level: 2,
  make(rand) {
    const set = new Set<number>();
    // 1.0처럼 끝자리가 0인 소수는 쓰지 않는다
    const tenths = () => {
      const v = randInt(rand, 1, 99);
      return v % 10 === 0 ? v + 1 : v;
    };
    while (set.size < 4) set.add(tenths());
    const list = [...set];
    const max = Math.max(...list);
    const answer = dec(max);
    return {
      key: `dec-largest:${list.join(",")}`,
      typeId: this.id,
      prompt: "가장 큰 소수를 고르세요.",
      input: "choice",
      choices: makeChoices(rand, answer, list.map(dec), () => dec(tenths())),
      answer,
      hint: "소수점 왼쪽의 수부터 비교해요.",
      explanation: `가장 큰 수는 ${answer}입니다.`,
    };
  },
};
