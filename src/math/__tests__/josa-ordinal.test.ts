import { describe, expect, it } from "vitest";
import { josa } from "../content/josa";
import { ord } from "../content/ordinal";
import type { Problem } from "../content/types";
import { choiceKey, createRandom, makeChoices } from "../lib/random";
import { choiceValue, digitOrdinals, sameValueChoices, wrongJosa } from "./quality-checks";

const problem = (over: Partial<Problem>): Problem => ({ key: "k", typeId: "t", prompt: "", input: "number", answer: "1", hint: "", explanation: "", ...over });

describe("josa(): 읽는 소리 기준", () => {
  it.each([
    [6, "을/를", "6을"],
    [17, "이에요/예요", "17이에요"],
    [39, "이에요/예요", "39예요"],
    [240, "을/를", "240을"],
    [9585, "이었/였", "9585였"],
    [18615, "이었/였", "18615였"],
    ["6 × 6", "을/를", "6 × 6을"],
    ["289 × 5", "과/와", "289 × 5와"],
    // 분수는 'b분의 a'로 읽으므로 분자 기준
    ["2/3", "이에요/예요", "2/3예요"],
    ["1/4", "은/는", "1/4은"],
    ["2 3/5", "을/를", "2 3/5을"],
    ["3/6", "으로/로", "3/6으로"],
    // 단위는 읽는 말
    ["1000 g", "이에요/예요", "1000 g이에요"],
    ["1 kg", "이/가", "1 kg이"],
    ["3 t", "은/는", "3 t은"],
    ["2 cm", "이에요/예요", "2 cm예요"],
    ["5 mL", "을/를", "5 mL를"],
    ["30°", "이/가", "30°가"],
    ["g", "으로/로", "g으로"],
    // 기호·자음
    ["㉠", "은/는", "㉠은"],
    ["②", "과/와", "②와"],
    ["ㄹ", "으로/로", "ㄹ로"],
    ["셋째", "은/는", "셋째는"],
    ["도서관", "이/가", "도서관이"],
  ] as const)("josa(%s, %s) = %s", (text, pair, want) => {
    expect(josa(text, pair)).toBe(want);
  });
});

describe("ord(): 서수", () => {
  it("1~10은 첫째~열째, 그보다 크면 '13번째'", () => {
    expect([1, 2, 5, 10].map(ord)).toEqual(["첫째", "둘째", "다섯째", "열째"]);
    expect(ord(13)).toBe("13번째");
    expect(ord(0)).toBe("0번째");
  });
});

describe("wrongJosa(): 화면 글 전체의 조사 검사", () => {
  it("보고서에서 찾은 틀린 조사를 힌트·풀이·오답 설명·보기·그림 글자·그림 설명에서 모두 찾는다", () => {
    const p = problem({
      prompt: "합이 9585이었습니다.",
      hint: "6 × 6를 계산해요. 3에 먼저 7를 더해요. 한 칸의 크기 × 10가 커야 해요.",
      explanation: "289 × 5과 더해요. 답은 39이에요. 첫째 수는 17예요. 1000 g예요. 전체의 2/3이에요. 셋째은 7일, 축구은 3명, 도서관가 멀어요.",
      mistakes: { "2": "3와 6는 빼요." },
      choices: ["숫자 2은 일의 자리"],
      visual: { kind: "shape", width: 100, height: 100, label: "숫자 6를 지나는 바늘", texts: [{ at: [0, 0], text: "14과 비교" }] },
    });
    // "6 × 6를"은 식의 끝 "6를", "289 × 5과"는 "5과"로 잡힌다
    expect(wrongJosa(p).sort()).toEqual(
      ["9585이었", "6를", "7를", "10가", "5과", "39이에요", "17예요", "1000 g예요", "2/3이에요", "셋째은", "축구은", "도서관가", "3와", "6는", "2은", "6를", "14과"].sort(),
    );
  });

  it("맞는 조사와 조사처럼 보이는 낱말(사과·초과·모은·마을·있는·아이)은 걸리지 않는다", () => {
    const p = problem({
      prompt: "사과 3개와 마을 사이에 있는 아이 2명이 모은 돈은 1/3과 같아요. 10 초과 수를 2/3로 나타내요.",
      hint: "6 × 6을 계산해요. 39예요. 17이에요. 1000 g이에요. 2 cm예요. ㉠은 각이에요. 둘째는 넷이라고 해요.",
      explanation: "9585였습니다. 도서관이 멀어요. 셋째는 7일이에요.",
    });
    expect(wrongJosa(p)).toEqual([]);
  });

  it("그림·표·그래프의 항목 이름 뒤 조사는 받침+는도 엄격하게 본다(운동는 → 운동은)", () => {
    const shape = { kind: "shape" as const, width: 100, height: 100, label: "띠그래프", texts: [{ at: [0, 0] as [number, number], text: "운동" }] };
    expect(wrongJosa(problem({ visual: shape, explanation: "운동는 10%부터 30%까지" }))).toEqual(["운동는"]);
    expect(wrongJosa(problem({ visual: shape, explanation: "운동은 10%부터, 운동장은 넓어요" }))).toEqual([]);
    const bars = { kind: "bars" as const, title: "운동", labels: ["독서", "게임"], values: [1, 2], unit: "명", step: 1 };
    expect(wrongJosa(problem({ visual: bars, hint: "독서는 1명, 게임은 2명" }))).toEqual([]);
    expect(wrongJosa(problem({ visual: bars, hint: "독서은 1명, 게임는 2명" })).sort()).toEqual(["게임는", "독서은"]);
  });
});

describe("digitOrdinals(): 숫자 서수", () => {
  it("'5째', '13째'를 찾고 '다섯째', '13번째'는 통과", () => {
    expect(digitOrdinals(problem({ prompt: "5째 줄 13째 칸", hint: "다섯째, 13번째" }))).toEqual(["5째", "13째"]);
  });
});

describe("값이 같은 보기", () => {
  it("choiceValue: 분수·대분수·소수·자연수와 단위, 숫자가 둘 이상인 보기는 값 없음", () => {
    expect(choiceValue("2/4")).toBe(choiceValue("1/2"));
    expect(choiceValue("1 3/8")).toBe(choiceValue("11/8"));
    expect(choiceValue("0.5")).toBe(choiceValue("1/2"));
    expect(choiceValue("3 cm")).toBe(choiceValue("3cm"));
    expect(choiceValue("3 cm")).not.toBe(choiceValue("3 mm"));
    expect(choiceValue("2 kg 300 g")).toBeNull();
    expect(choiceValue("3 × 4")).toBeNull();
    expect(choiceValue("가")).toBeNull();
  });

  it("sameValueChoices: 값이 같은 묶음을 돌려준다", () => {
    expect(sameValueChoices(problem({ choices: ["1/2", "2/4", "3/4", "1"] }))).toEqual([["1/2", "2/4"]]);
    expect(sameValueChoices(problem({ choices: ["1/2", "1/3", "3/4", "1"] }))).toEqual([]);
  });

  it("makeChoices는 값이 같은 오답을 넣지 않고 다른 후보로 채운다", () => {
    let n = 0;
    const c = makeChoices(createRandom(1), "1/2", ["2/4", "3/6", "1/3"], () => `${++n}/7`);
    expect(c).toHaveLength(4);
    expect(new Set(c.map(choiceKey)).size).toBe(4);
    expect(c).not.toContain("2/4");
  });
});
