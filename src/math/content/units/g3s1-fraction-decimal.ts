import type { Generator, Unit } from "../types";
import { extras } from "../extras";
import * as F from "../generators/fraction";
import * as D from "../generators/decimal";
import * as LF from "../lessons/g3-frac";
import * as FP from "../lessons/g3-frac-pics";

/**
 * 3학년 1학기 '분수와 소수'
 * 성취기준: 2022 개정 수학과 [4수01-09·11·12·14] (2차 자료로 확인, NCIC 원문 대조는 docs/USER-TODO.md)
 * 차시 id가 예전 단계 id(fraction-meaning, fraction-compare, decimal-compare)와 같은 차시에는
 * 예전 서술형이 자동으로 붙는다(src/content/index.ts).
 */

const ribbonDecimal: Generator = extras("g3-s1-fraction-decimal", "decimal-meaning").find((g) => g.id === "w3-ribbon-decimal")!;

export const fractionDecimal: Unit = {
  id: "g3-s1-fraction-decimal",
  grade: 3,
  semester: 1,
  number: 6,
  slug: "fraction-decimal",
  title: "분수와 소수",
  standards: [
    {
      id: "equal-parts",
      code: "[4수01-09]",
      topic: "분수",
      title: "똑같이 나누기",
      conceptCards: [
        {
          title: "똑같이 나누기",
          body: "전체를 크기와 모양이 같게 나누는 것을 '똑같이 나눈다'고 합니다.",
        },
      ],
      generators: [LF.equalParts, LF.equalPick, LF.equalTruth, LF.equalCount, LF.equalGrid],
    },
    {
      id: "fraction-meaning",
      code: "[4수01-09]",
      topic: "분수",
      title: "분수 알아보기",
      conceptCards: [
        {
          title: "분수",
          body: "전체를 똑같이 4로 나눈 것 중의 3을 3/4이라 쓰고 '4분의 3'이라고 읽습니다. 아래 수는 분모, 위의 수는 분자입니다.",
          example: "3/4",
        },
      ],
      generators: [F.fracReadShaded, F.fracReadWords, F.fracReadUnshaded, F.fracPartOfWhole, LF.fracWhole],
    },
    {
      id: "frac-compare-same",
      code: "[4수01-11]",
      topic: "분수",
      title: "분모가 같은 분수의 크기 비교",
      conceptCards: [
        {
          title: "분모가 같은 분수",
          body: "분모가 같은 분수는 분자가 클수록 큽니다. 3/5는 1/5이 3개, 2/5는 1/5이 2개입니다.",
          example: "3/5 > 2/5",
        },
      ],
      generators: [F.fracCompareSameDen, F.fracLargestSameDen, LF.fracCount, LF.fracBetween, LF.fracEatWho, FP.fracBarCompare],
    },
    {
      id: "fraction-compare",
      code: "[4수01-11]",
      topic: "분수",
      title: "단위분수의 크기 비교",
      conceptCards: [
        {
          title: "단위분수",
          body: "분자가 1인 분수를 단위분수라고 합니다. 단위분수는 분모가 작을수록 큽니다.",
          example: "1/3 > 1/5",
        },
      ],
      generators: [F.fracCompareUnit, F.fracOrderUnit, LF.unitMax, LF.unitBetween, FP.unitBarCompare],
    },
    {
      id: "decimal-tenth",
      code: "[4수01-12]",
      topic: "소수",
      title: "소수 알아보기(1)",
      conceptCards: [
        {
          title: "0.1",
          body: "분수 1/10을 0.1이라 쓰고 '영 점 일'이라고 읽습니다. 1 mm는 0.1 cm입니다.",
          example: "3/10 = 0.3",
        },
      ],
      generators: [D.decFromFrac10, D.decReadShaded, LF.decimalRead, LF.decimalMm, LF.decimalLeft, LF.decimalBetween, FP.decimalLine],
    },
    {
      id: "decimal-one-place",
      code: "[4수01-12]",
      topic: "소수",
      title: "소수 알아보기(2)",
      conceptCards: [
        {
          title: "소수 한 자리 수",
          body: "2와 0.3만큼을 2.3이라 쓰고 '이 점 삼'이라고 읽습니다. 2.3은 0.1이 23개인 수입니다.",
          example: "2 cm 3 mm = 2.3 cm",
        },
      ],
      generators: [LF.decimalWrite, D.decCountTenths, D.decLength, ribbonDecimal, LF.decimalCards, FP.decimalLine3],
    },
    {
      id: "decimal-compare",
      code: "[4수01-14]",
      topic: "소수",
      title: "소수의 크기 비교",
      conceptCards: [
        {
          title: "소수의 크기 비교",
          body: "자연수 부분을 먼저 비교하고, 같으면 소수 첫째 자리를 비교합니다. 0.1이 몇 개인지로 비교해도 됩니다.",
          example: "2.7 > 2.4",
        },
      ],
      generators: [D.decCompare, D.decLargest, LF.decimalBox, LF.decimalCond, FP.decimalBarCompare],
    },
  ],
};
