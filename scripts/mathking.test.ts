import { describe, expect, it } from "vitest";
import { convertProblem, type MkProblem } from "./mathking";

/** 시드 고정 난수 (테스트가 매번 같은 결과를 내게) */
function seeded(seed = 1) {
  let s = seed;
  const next = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 5; i++) next(); // 작은 시드의 첫 값들은 0에 몰려 있어 버린다
  return next;
}
const base: MkProblem = { prompt: "계산해 보세요.", input: "number", answer: "12", explanation: "3 × 4 = 12" };
const ok = (p: MkProblem) => {
  const r = convertProblem(p, seeded());
  if ("skip" in r) throw new Error(`건너뜀: ${r.skip}`);
  return r;
};
const skipOf = (p: MkProblem) => {
  const r = convertProblem(p, seeded());
  return "skip" in r ? r.skip : null;
};

describe("math-king 문제 변환", () => {
  it("4지선다는 보기를 그대로 쓰고 정답 위치를 찾는다", () => {
    const r = ok({ ...base, input: "choice", choices: ["평행사변형", "사다리꼴", "직사각형", "마름모"], answer: "마름모" });
    expect(r.choices).toEqual(["평행사변형", "사다리꼴", "직사각형", "마름모"]);
    expect(r.answer).toBe(3);
  });
  it("식은 문제 뒤에 붙이고 줄바꿈은 빈칸으로 바꾼다", () => {
    const r = ok({ ...base, prompt: "계산해\n보세요.", expression: "3 × 4 = □" });
    expect(r.question).toBe("계산해 보세요. 3 × 4 = □");
  });
  it("숫자 답은 흔한 실수 오답을 먼저 넣어 서로 다른 보기 4개를 만든다", () => {
    const r = ok({ ...base, answer: "555", mistakes: { "829": "더했어요", "545": "받아내림 실수" } });
    expect(r.choices).toHaveLength(4);
    expect(new Set(r.choices).size).toBe(4);
    expect(r.choices).toContain("829");
    expect(r.choices).toContain("545");
    expect(r.choices[r.answer]).toBe("555");
  });
  it("단위가 한 칸이면 보기에 단위를 붙인다", () => {
    const r = ok({ ...base, input: "fields", fields: ["원"], answer: "555" });
    expect(r.choices[r.answer]).toBe("555원");
    expect(r.choices.every((c) => c.endsWith("원"))).toBe(true);
  });
  it("소수 답은 소수 자리에 맞춰 오답을 만든다", () => {
    const r = ok({ ...base, answer: "1.1" });
    expect(r.choices[r.answer]).toBe("1.1");
    // 소수점을 잘못 옮긴 오답(11, 0.11) 하나를 빼면 모두 소수 한 자리
    expect(r.choices.filter((c) => !/^\d+(\.\d)?$/.test(c)).length).toBeLessThanOrEqual(1);
    expect(r.choices.filter((c) => ["11", "0.11"].includes(c)).length).toBeLessThanOrEqual(1);
  });
  it("답이 0이어도 음수 없이 보기 4개를 만든다", () => {
    const r = ok({ ...base, answer: "0" });
    expect(new Set(r.choices).size).toBe(4);
    expect(r.choices.every((c) => Number(c) >= 0)).toBe(true);
  });
  it("정답과 값이 같은 오답 후보는 버린다", () => {
    const r = ok({ ...base, answer: "5", mistakes: { "5.0": "같은 값", "6": "하나 더 셌어요" } });
    expect(r.choices).not.toContain("5.0");
    expect(r.choices.filter((c) => Number(c) === 5)).toHaveLength(1);
  });
  it("숫자 답: 정답이 크기순으로 늘 같은 자리에 오지 않는다 (가운데 수 찍기 방지)", () => {
    const ranks = new Set<number>();
    const spots = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) {
      const r = convertProblem({ ...base, answer: "50" }, seeded(seed));
      if ("skip" in r) throw new Error(r.skip);
      const sorted = r.choices.map(Number).sort((a, b) => a - b);
      ranks.add(sorted.indexOf(50));
      spots.add(r.answer);
    }
    expect([...ranks].sort()).toEqual([0, 1, 2, 3]);
    expect([...spots].sort()).toEqual([0, 1, 2, 3]);
  });
  it("흔한 실수 오답이 있어도 나머지 오답이 정답 양옆에만 붙지 않는다", () => {
    const ranks = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) {
      const r = convertProblem({ ...base, answer: "677", mistakes: { "1277": "더했어요" } }, seeded(seed));
      if ("skip" in r) throw new Error(r.skip);
      const near = r.choices.map(Number).filter((v) => v !== 1277).sort((a, b) => a - b);
      ranks.add(near.indexOf(677));
    }
    expect([...ranks].sort()).toEqual([0, 1, 2]);
  });
  it("써넣는 문제는 고르는 문제로 말을 바꾼다 (객관식이므로)", () => {
    expect(ok({ ...base, prompt: "□ 안에 알맞은 수를 써넣으세요.", expression: "□ + 1 = 13" }).question).toBe("□ 안에 알맞은 수를 고르세요. □ + 1 = 13");
    expect(ok({ ...base, prompt: "두 수의 합을 쓰세요." }).question).toBe("두 수의 합을 고르세요.");
    // 원래 객관식인 문제는 그대로 둔다
    expect(ok({ ...base, prompt: "알맞은 것을 고르세요.", input: "choice", choices: ["가", "나", "다", "라"], answer: "나" }).question).toBe("알맞은 것을 고르세요.");
  });
  it("영문 단위는 수와 띄어 쓰고, 우리말 단위는 붙여 쓴다", () => {
    expect(ok({ ...base, input: "fields", fields: ["cm²"], answer: "54" }).choices).toContain("54 cm²");
    expect(ok({ ...base, input: "fields", fields: ["명"], answer: "39" }).choices).toContain("39명");
    expect(ok({ ...base, input: "fields", fields: ["°"], answer: "90" }).choices).toContain("90°");
  });
  it("소수 오답에 쓸모없는 0을 붙이지 않는다 (6.0이 아니라 6)", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const r = convertProblem({ ...base, answer: "6.1" }, seeded(seed));
      if ("skip" in r) throw new Error(r.skip);
      expect(r.choices.some((c) => /\.\d*0$/.test(c))).toBe(false);
    }
  });
  it("값이 같은 보기가 둘 생기지 않는다 (6과 6.0)", () => {
    const r = ok({ ...base, answer: "7", mistakes: { "6.0": "실수", "6": "실수", "9": "실수" } });
    expect(new Set(r.choices.map(Number)).size).toBe(4);
  });
  it("문제가 후보를 정해 놓으면(1명, 2명, 5명, 10명 중에서) 오답도 그 후보에서 고른다", () => {
    const p: MkProblem = { ...base, prompt: "세로 눈금 한 칸의 크기를 1명, 2명, 5명, 10명 중에서 정할 때 가장 알맞은 것은 몇 명인가요?", input: "fields", fields: ["명"], answer: "10" };
    const r = ok(p);
    expect([...r.choices].sort()).toEqual(["10명", "1명", "2명", "5명"]);
    expect(skipOf({ ...p, answer: "7" })).toBe("answer-not-in-candidates");
  });
  it("개수를 묻는 문제에서 답이 2 이상이면 0을 오답으로 쓰지 않는다", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const r = convertProblem({ ...base, prompt: "37의 약수는 모두 몇 개인가요?", input: "fields", fields: ["개"], answer: "2" }, seeded(seed));
      if ("skip" in r) throw new Error(r.skip);
      expect(r.choices).not.toContain("0개");
    }
    // 답이 1이면 0도 그럴듯한 오답이다
    const one = ok({ ...base, prompt: "□ 안에 들어갈 수 있는 수는 모두 몇 개인가요?", input: "fields", fields: ["개"], answer: "1", mistakes: { "0": "하나 빠뜨림" } });
    expect(one.choices).toContain("0개");
  });
  it("소수가 길게 늘어진 오답과, 셈 단위에 붙은 소수 오답은 쓰지 않는다", () => {
    const r = ok({ ...base, prompt: "며칠 뒤인가요?", input: "fields", fields: ["일"], answer: "6", mistakes: { "19.333333333333332": "나눗셈 실수", "5": "하루 빠뜨림" } });
    expect(r.choices).toContain("5일");
    expect(r.choices.some((c) => c.includes("19.33"))).toBe(false);
    const won = ok({ ...base, prompt: "원래 가격은 얼마인가요?", input: "fields", fields: ["원"], answer: "17000", mistakes: { "15937.5": "거꾸로 계산" } });
    expect(won.choices).not.toContain("15937.5원");
    // 길이·무게 단위는 소수 오답이 자연스럽다
    const m = ok({ ...base, prompt: "몇 m인가요?", input: "fields", fields: ["m"], answer: "6", mistakes: { "5.5": "실수" } });
    expect(m.choices).toContain("5.5 m");
  });
  it("끝자리가 0인 답은 오답도 같은 자리까지 0으로 맞춘다 (끝자리로 답이 드러나지 않게)", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const r = convertProblem({ ...base, prompt: "반올림하여 천의 자리까지 나타내세요.", answer: "26000" }, seeded(seed));
      if ("skip" in r) throw new Error(r.skip);
      expect(r.choices.every((c) => Number(c) % 1000 === 0)).toBe(true);
    }
    const won = ok({ ...base, prompt: "모두 얼마인가요?", input: "fields", fields: ["원"], answer: "410000" });
    expect(won.choices.every((c) => parseInt(c) % 10000 === 0)).toBe(true);
  });
  it("소수가 나오는 계산은 소수점을 잘못 옮긴 오답을 섞는다", () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const r = convertProblem({ ...base, prompt: "계산해 보세요.", expression: "57.1 × 10 = □", answer: "571" }, seeded(seed));
      if ("skip" in r) throw new Error(r.skip);
      r.choices.forEach((c) => seen.add(c));
    }
    expect(seen.has("57.1") || seen.has("5710")).toBe(true);
  });
  it("음수 오답은 쓰지 않는다", () => {
    const r = ok({ ...base, answer: "123", mistakes: { "-123": "거꾸로 뺌", "124": "실수" } });
    expect(r.choices.some((c) => c.startsWith("-"))).toBe(false);
  });
  it("값이 같은 분수 보기(2 15/14 = 3 1/14)가 있으면 건너뛴다", () => {
    expect(skipOf({ ...base, input: "choice", choices: ["3 1/14", "2 15/14", "2 1/14", "3 3/14"], answer: "3 1/14" })).toBe("improper-mixed");
    // 대분수로 나타내는 문제는 잘못 만든 대분수(1 7/6)가 일부러 들어 있다
    expect(skipOf({ ...base, prompt: "가분수를 대분수로 나타낸 것을 고르세요.", input: "choice", choices: ["1 7/6", "1 2/6", "2 1/13", "2 1/6"], answer: "2 1/6" })).toBeNull();
    expect(skipOf({ ...base, input: "choice", choices: ["1/2", "2/4", "1/3", "1/4"], answer: "2/4" })).toBe("duplicate-choices");
    // 분수의 모양(기약분수, 분모와 분자의 합)을 묻는 문제는 값이 같은 오답이 일부러 들어 있다
    expect(skipOf({ ...base, prompt: "기약분수로 나타낸 것을 고르세요.", input: "choice", choices: ["2/20", "9/10", "1/20", "1/10"], answer: "1/10" })).toBeNull();
    // 대분수의 분수 부분이 가분수인 표기(2 15/14)는 교과서에 없다
    expect(skipOf({ ...base, prompt: "계산하여 기약분수로 나타낸 것을 고르세요.", input: "choice", choices: ["3 1/14", "2 15/14", "2 1/14", "3 3/14"], answer: "3 1/14" })).toBe("improper-mixed");
    // "크기가 다른 분수를 고르세요"처럼 오답끼리 값이 같은 것은 괜찮다
    expect(skipOf({ ...base, input: "choice", choices: ["2/5", "4/10", "6/15", "5/10"], answer: "5/10" })).toBeNull();
  });
  it("자연수 답도 0을 하나 더하거나 덜 붙인 오답(자릿값 실수)을 섞는다", () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const r = convertProblem({ ...base, prompt: "1억이 6개인 수를 숫자로 고르세요.", answer: "600000000" }, seeded(seed));
      if ("skip" in r) throw new Error(r.skip);
      r.choices.forEach((c) => seen.add(c));
    }
    expect(seen.has("60000000") || seen.has("6000000000")).toBe(true);
  });
  it("답이 2 이상이면 0을 오답으로 쓰지 않는다 (0각형, 0 cm, 0시)", () => {
    for (let seed = 1; seed <= 40; seed++) {
      for (const [answer, fields] of [["3", ["각형"]], ["2", ["cm"]], ["1", ["시"]]] as const) {
        const r = convertProblem({ ...base, input: "fields", fields: [...fields], answer }, seeded(seed));
        if ("skip" in r) throw new Error(r.skip);
        if (answer !== "1") expect(r.choices.some((c) => /^0\D*$/.test(c.replace(" ", "")))).toBe(false);
        else expect(r.choices.some((c) => c === "0시")).toBe(false);
      }
    }
  });
  it("시각(몇 시) 오답은 1~12 안에서만", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const r = convertProblem({ ...base, prompt: "오후 몇 시인가요?", input: "fields", fields: ["시"], answer: "12" }, seeded(seed));
      if ("skip" in r) throw new Error(r.skip);
      expect(r.choices.every((c) => { const h = parseInt(c); return h >= 1 && h <= 12; })).toBe(true);
    }
  });
  it("흔한 실수 오답도 정답보다 소수 자리가 2자리 이상 길면 버린다 (0.104 ↔ 0.1161)", () => {
    const r = ok({ ...base, answer: "0.104", mistakes: { "0.1161": "물로 나눔", "1.04": "소수점" } });
    expect(r.choices).not.toContain("0.1161");
    expect(r.choices).toContain("1.04");
  });
  it("'17째'·'몇째' 같은 서수는 '17번째'·'몇 번째'로 쓴다", () => {
    const r = ok({ ...base, prompt: "처음으로 220보다 큰 수가 나오는 것은 몇째인가요?", input: "fields", fields: ["째"], answer: "17" });
    expect(r.question).toBe("처음으로 220보다 큰 수가 나오는 것은 몇 번째인가요?");
    expect(r.choices[r.answer]).toBe("17번째");
    expect(ok({ ...base, prompt: "소수 21째 자리 숫자는 무엇인가요?" }).question).toBe("소수 21번째 자리 숫자는 무엇인가요?");
  });
  it("사람 이름 '하루'는 '하루(1일)'로 읽히지 않게 다른 이름으로 바꾸고, 날을 뜻하는 '하루'는 그대로 둔다", () => {
    const r = ok({ ...base, prompt: "유나 1.1 m, 하루 1.59 m 뛰었습니다. 하루는 하루 동안 하루에 2번 뛰었고, 하루의 기록이 가장 깁니다. 하루 24시간 중 몇 시간인가요?" });
    expect(r.question).toBe("유나 1.1 m, 주아 1.59 m 뛰었습니다. 주아는 하루 동안 하루에 2번 뛰었고, 주아의 기록이 가장 깁니다. 하루 24시간 중 몇 시간인가요?");
    expect(ok({ ...base, explanation: "하루: 5800 − 2300, 하루가 1900원 더 많아요." }).explanation).toBe("주아: 5800 − 2300, 주아가 1900원 더 많아요.");
  });
  it("오답은 소수 셋째 자리까지만 (초등은 소수 세 자리까지 다룬다)", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const r = convertProblem({ ...base, prompt: "3.88의 1/10은 얼마인가요?", answer: "0.388", mistakes: { "0.0388": "두 번 나눔" } }, seeded(seed));
      if ("skip" in r) throw new Error(r.skip);
      expect(r.choices.every((c) => (c.split(".")[1]?.length ?? 0) <= 3)).toBe(true);
    }
  });
  it("뛰어 세기 문제는 '○씩'만큼 차이 나는 오답을 쓴다 (아랫자리는 그대로)", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const r = convertProblem({ ...base, prompt: "370,628부터 1,000,000씩 2번 뛰어 센 수를 고르세요.", answer: "2370628" }, seeded(seed));
      if ("skip" in r) throw new Error(r.skip);
      expect(r.choices.every((c) => c.endsWith("70628"))).toBe(true);
    }
    const man = ok({ ...base, prompt: "1억이 8개, 1만이 3699개인 수에서 1만씩 2번 뛰어 센 수를 숫자로 고르세요.", answer: "837010000" });
    expect(man.choices.every((c) => Number(c) % 10000 === 0)).toBe(true);
  });
  it("자연수 답에는 소수 오답을 만들지 않는다 (2370628 → 237062.8 금지)", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const r = convertProblem({ ...base, prompt: "계산해 보세요.", answer: "2370628" }, seeded(seed));
      if ("skip" in r) throw new Error(r.skip);
      expect(r.choices.some((c) => c.includes("."))).toBe(false);
    }
  });
  it("지원하지 않는 문제는 이유와 함께 건너뛴다", () => {
    expect(skipOf({ ...base, visual: { kind: "bar" } })).toBe("visual");
    expect(skipOf({ ...base, input: "choice", choices: [">", "<", "="], answer: "<" })).toBe("choices-3");
    expect(skipOf({ ...base, input: "fields", fields: ["분", "초"], answer: "5,12" })).toBe("multi-fields");
    expect(skipOf({ ...base, input: "number", answer: "ㄱ" })).toBe("few-distractors");
    expect(skipOf({ ...base, prompt: "가".repeat(121) })).toBe("long-question");
    expect(skipOf({ ...base, prompt: "문제" })).toBe("short-question");
    expect(skipOf({ ...base, input: "choice", choices: ["가".repeat(31), "나", "다", "라"], answer: "나" })).toBe("long-choice");
    expect(skipOf({ ...base, explanation: "가".repeat(101) })).toBe("long-explanation");
    expect(skipOf({ ...base, explanation: "답" })).toBe("short-explanation");
    expect(skipOf({ ...base, input: "choice", choices: ["가", "나", "다", "라"], answer: "마" })).toBe("answer-missing");
    expect(skipOf({ ...base, input: "choice", choices: ["가", "가", "다", "라"], answer: "다" })).toBe("duplicate-choices");
    expect(skipOf({ ...base, prompt: "옳은 것을 모두 고르세요." })).toBe("unsupported-format");
  });
});
