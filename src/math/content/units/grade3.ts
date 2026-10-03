import type { Generator, Unit } from "../types";
import { extras } from "../extras";
import * as AS from "../generators/add-sub";
import * as MD from "../generators/mul-div";
import * as ME from "../generators/measure";
import * as F2 from "../generators/fraction2";
import * as L from "../lessons/g3";
import * as LM from "../lessons/g3-measure";
import * as LF from "../lessons/g3-frac";
import * as FP from "../lessons/g3-frac-pics";
import * as LD from "../lessons/longdiv";

/**
 * 3학년 계산·측정·분수 단원. 차시는 천재교육 계열 교과서 흐름을 따른다.
 * 성취기준 코드는 docs/audit-v2 보고서의 코드 표(원문 대조는 docs/USER-TODO.md 3번).
 */

/** 예전 단계에 붙어 있던 생성기 중 하나를 id로 꺼낸다 */
const old = (unitId: string, stdId: string, id: string): Generator => {
  const g = extras(unitId, stdId).find((x) => x.id === id);
  if (!g) throw new Error(`${unitId}/${stdId}에 ${id}가 없어요`);
  return g;
};

export const g3s1AddSub: Unit = {
  id: "g3-s1-add-sub",
  grade: 3,
  semester: 1,
  number: 1,
  slug: "add-sub",
  title: "덧셈과 뺄셈",
  standards: [
    {
      id: "add-no-carry",
      code: "[4수01-03]",
      topic: "세 자리 수의 덧셈",
      title: "받아올림이 없는 (세 자리 수)+(세 자리 수)",
      conceptCards: [{ title: "같은 자리끼리", body: "일의 자리, 십의 자리, 백의 자리끼리 더합니다. 일의 자리부터 계산해요.", example: "324 + 153 = 477" }],
      generators: [AS.add3NoCarry, L.add0.box, L.add0.big, L.add0.cards, L.add0.rev],
    },
    {
      id: "add-carry-once",
      code: "[4수01-03]",
      topic: "세 자리 수의 덧셈",
      title: "받아올림이 한 번 있는 (세 자리 수)+(세 자리 수)",
      conceptCards: [{ title: "받아올림", body: "같은 자리 수의 합이 10이거나 10보다 크면 바로 윗자리로 1을 받아올립니다.", example: "248 + 135 = 383" }],
      generators: [L.add1.calc, L.add1.fix, L.add1.story, L.add1.wrongOp, L.add1.error],
    },
    {
      id: "add-carry-twice",
      code: "[4수01-03]",
      topic: "세 자리 수의 덧셈",
      title: "받아올림이 여러 번 있는 (세 자리 수)+(세 자리 수)",
      conceptCards: [
        { title: "여러 번 받아올림", body: "일의 자리에서 받아올린 1을 십의 자리에, 십의 자리에서 받아올린 1을 백의 자리에 더합니다.", example: "258 + 367 = 625" },
        { title: "천의 자리", body: "백의 자리의 합이 10이거나 10보다 크면 천의 자리에 1을 씁니다.", example: "758 + 486 = 1244" },
      ],
      generators: [L.add2.calc, L.add2.box, L.add2.big, L.add2.cards, L.add2.ineq, old("g3-s1-add-sub", "add3", "w3-visitors")],
    },
    {
      id: "sub-no-borrow",
      code: "[4수01-03]",
      topic: "세 자리 수의 뺄셈",
      title: "받아내림이 없는 (세 자리 수)−(세 자리 수)",
      conceptCards: [{ title: "같은 자리끼리", body: "일의 자리부터 같은 자리끼리 뺍니다.", example: "586 − 243 = 343" }],
      generators: [AS.sub3NoBorrow, L.sub0.box, L.sub0.cmp, L.sub0.rev, L.sub0.who],
    },
    {
      id: "sub-borrow-once",
      code: "[4수01-03]",
      topic: "세 자리 수의 뺄셈",
      title: "받아내림이 한 번 있는 (세 자리 수)−(세 자리 수)",
      conceptCards: [{ title: "받아내림", body: "같은 자리끼리 뺄 수 없으면 바로 윗자리에서 10을 받아내리고, 윗자리 수는 1 작아집니다.", example: "452 − 128 = 324" }],
      generators: [L.sub1.calc, L.sub1.fix, L.sub1.story, L.sub1.wrongOp, L.sub1.error],
    },
    {
      id: "sub-borrow-twice",
      code: "[4수01-03]",
      topic: "세 자리 수의 뺄셈",
      title: "받아내림이 두 번 있는 (세 자리 수)−(세 자리 수)",
      conceptCards: [{ title: "두 번 받아내림", body: "일의 자리 계산을 위해 십의 자리에서, 십의 자리 계산을 위해 백의 자리에서 받아내립니다.", example: "523 − 178 = 345" }],
      generators: [L.sub2.calc, L.sub2.box, L.sub2.big, L.sub2.cards, L.sub2.ineq, old("g3-s1-add-sub", "sub3", "w3-pocket-money")],
    },
  ],
};

export const g3s1Division: Unit = {
  id: "g3-s1-division",
  grade: 3,
  semester: 1,
  number: 3,
  slug: "division",
  title: "나눗셈",
  standards: [
    {
      id: "div-share",
      code: "[4수01-05]",
      topic: "똑같이 나누기",
      title: "똑같이 나누기(1) — 나누어 주기",
      conceptCards: [{ title: "나눗셈식", body: "12를 3으로 나누면 4가 됩니다. 이것을 12 ÷ 3 = 4라 쓰고, 4를 몫이라고 합니다.", example: "12 ÷ 3 = 4" }],
      generators: [MD.divShare, L.shareExpr, L.shareNeed, old("g3-s1-division", "div-meaning", "w3-notebooks-more"), L.shareWho],
    },
    {
      id: "div-group",
      code: "[4수01-05]",
      topic: "똑같이 나누기",
      title: "똑같이 나누기(2) — 묶어 덜어 내기",
      conceptCards: [{ title: "뺄셈과 나눗셈", body: "12에서 4씩 3번 빼면 0이 됩니다. 이것을 나눗셈식 12 ÷ 4 = 3으로 나타냅니다.", example: "12 − 4 − 4 − 4 = 0 → 12 ÷ 4 = 3" }],
      generators: [L.groupSub, MD.divGroup, L.groupBox, L.groupTwo, L.divTable.who],
    },
    {
      id: "div-mul",
      code: "[4수01-05]",
      topic: "곱셈과 나눗셈",
      title: "곱셈과 나눗셈의 관계",
      conceptCards: [{ title: "곱셈식과 나눗셈식", body: "3 × 4 = 12를 나눗셈식으로 나타내면 12 ÷ 3 = 4, 12 ÷ 4 = 3입니다.", example: "3 × 4 = 12 → 12 ÷ 3 = 4" }],
      generators: [MD.divFact, L.mulFamily, L.mulDivCond],
    },
    {
      id: "div-by-mul",
      code: "[4수01-05]",
      topic: "곱셈과 나눗셈",
      title: "나눗셈의 몫을 곱셈식으로 구하기",
      conceptCards: [{ title: "곱셈식으로 몫 구하기", body: "15 ÷ 3의 몫은 3 × □ = 15에서 □를 찾으면 됩니다.", example: "3 × 5 = 15 → 15 ÷ 3 = 5" }],
      generators: [MD.divBasic, L.divTable.box, L.divTable.big, L.quotientCount, L.divTable.cards],
    },
    {
      id: "div-times-table",
      code: "[4수01-05]",
      topic: "곱셈과 나눗셈",
      title: "나눗셈의 몫을 곱셈구구로 구하기",
      conceptCards: [{ title: "곱셈구구 이용하기", body: "42 ÷ 7의 몫은 7단 곱셈구구에서 곱이 42인 7 × 6 = 42를 찾아 6입니다.", example: "42 ÷ 7 = 6" }],
      generators: [L.divTable.calc, L.divTable.cmp, L.divTable.story, L.tableRev, L.tableCond],
    },
  ],
};

export const g3s1Multiplication: Unit = {
  id: "g3-s1-multiplication",
  grade: 3,
  semester: 1,
  number: 4,
  slug: "multiplication",
  title: "곱셈",
  standards: [
    {
      id: "mul-tens",
      code: "[4수01-04]",
      topic: "(몇십)×(몇)",
      title: "(몇십)×(몇)",
      conceptCards: [{ title: "0 붙이기", body: "30 × 4는 3 × 4 = 12에 0을 하나 붙인 120입니다.", example: "30 × 4 = 120" }],
      generators: [MD.mulTens, L.mulTens.cmp, L.mulTens.ineq],
    },
    {
      id: "mul-no-carry",
      code: "[4수01-04]",
      topic: "(몇십몇)×(몇)",
      title: "올림이 없는 (몇십몇)×(몇)",
      conceptCards: [{ title: "자리별로 곱하기", body: "23 × 3은 일의 자리 3 × 3 = 9, 십의 자리 20 × 3 = 60이므로 69입니다.", example: "23 × 3 = 69" }],
      generators: [MD.mul2x1NoCarry, L.mulNoCarry.box, L.mulNoCarry.story, L.mulNoCarry.wrongOp, L.mulNoCarry.who],
    },
    {
      id: "mul-carry-tens",
      code: "[4수01-04]",
      topic: "(몇십몇)×(몇)",
      title: "십의 자리에서 올림이 있는 (몇십몇)×(몇)",
      conceptCards: [{ title: "백의 자리로 올림", body: "십의 자리의 곱이 10이거나 10보다 크면 백의 자리에 씁니다.", example: "52 × 4 = 208" }],
      generators: [L.mulCarryTens.calc, L.mulCarryTens.cmp, L.mulCarryTens.big, L.mulCarryTens.ineq, L.mulCarryTens.who],
    },
    {
      id: "mul-carry-ones",
      code: "[4수01-04]",
      topic: "(몇십몇)×(몇)",
      title: "일의 자리에서 올림이 있는 (몇십몇)×(몇)",
      conceptCards: [{ title: "십의 자리로 올림", body: "일의 자리의 곱이 10이거나 10보다 크면 십의 자리로 올림하여 십의 자리 곱에 더합니다.", example: "26 × 3 = 78" }],
      generators: [L.mulCarryOnes.calc, L.mulCarryOnes.fix, L.mulCarryOnes.story, L.mulCarryOnes.error, L.mulCarryOnes.wrongOp],
    },
    {
      id: "mul-carry-both",
      code: "[4수01-04]",
      topic: "(몇십몇)×(몇)",
      title: "십의 자리와 일의 자리에서 올림이 있는 (몇십몇)×(몇)",
      conceptCards: [{ title: "두 번 올림", body: "일의 자리에서 올림한 수를 십의 자리 곱에 더하고, 그 합이 10이 넘으면 백의 자리에 씁니다.", example: "47 × 6 = 282" }],
      generators: [L.mulCarryBoth.calc, L.mulCarryBoth.box, MD.mulWord, L.mulCarryBoth.cards, old("g3-s1-multiplication", "mul-2x1", "w3-sold-boxes")],
    },
  ],
};

export const g3s1LengthTime: Unit = {
  id: "g3-s1-length-time",
  grade: 3,
  semester: 1,
  number: 5,
  slug: "length-time",
  title: "길이와 시간",
  standards: [
    {
      id: "mm",
      code: "[4수03-15] [4수03-16]",
      topic: "길이",
      title: "1 cm보다 작은 단위",
      conceptCards: [{ title: "mm", body: "1 cm를 똑같이 10칸으로 나눈 한 칸의 길이를 1 mm라고 합니다. 1 cm = 10 mm", example: "3 cm 4 mm = 34 mm" }],
      generators: [ME.lenCmMm, LM.mmRuler, LM.mmShift, LM.mm.cmp, LM.mm.order, LM.mmCut],
    },
    {
      id: "km",
      code: "[4수03-15] [4수03-16]",
      topic: "길이",
      title: "1 m보다 큰 단위",
      conceptCards: [{ title: "km", body: "1000 m를 1 km라 쓰고 1 킬로미터라고 읽습니다.", example: "2 km 300 m = 2300 m" }],
      generators: [ME.lenKmM, LM.kmLine, LM.km.cmp, LM.kmTrip, LM.km.order, LM.kmRoute3],
    },
    {
      id: "len-estimate",
      code: "[4수03-15]",
      topic: "길이",
      title: "길이와 거리를 어림하기",
      conceptCards: [{ title: "알맞은 단위", body: "짧은 길이는 mm나 cm, 교실이나 운동장처럼 긴 길이는 m, 먼 거리는 km로 나타내면 편리합니다." }],
      generators: [LM.unitPick, LM.estMap, LM.estPace, LM.estKmTime, LM.estSpan, LM.estWho],
    },
    {
      id: "len-add-sub",
      code: "[4수03-16]",
      topic: "길이",
      title: "길이의 덧셈과 뺄셈",
      conceptCards: [{ title: "같은 단위끼리", body: "같은 단위끼리 계산하고, 1000 m가 되면 1 km로, 10 mm가 되면 1 cm로 받아올립니다.", example: "1 km 600 m + 2 km 700 m = 4 km 300 m" }],
      generators: [LM.kmAdd, ME.lenAddSub, LM.km.box, LM.ribbonJoin, LM.routeWho],
    },
    {
      id: "sec",
      code: "[4수03-13]",
      topic: "시간",
      title: "1분보다 작은 단위",
      conceptCards: [{ title: "초", body: "초바늘이 작은 눈금 한 칸을 가는 동안 걸리는 시간이 1초입니다. 1분 = 60초", example: "2분 15초 = 135초" }],
      generators: [ME.timeMinSec, LM.secClock, LM.sec.cmp, LM.secHand, LM.sec.order, LM.secDur],
    },
    {
      id: "time-add",
      code: "[4수03-14]",
      topic: "시간",
      title: "시간의 덧셈",
      conceptCards: [{ title: "받아올림", body: "초끼리, 분끼리 더하고 60초는 1분으로, 60분은 1시간으로 받아올립니다.", example: "1분 40초 + 2분 30초 = 4분 10초" }],
      generators: [LM.secAdd, LM.timeAfter, LM.timeClock, LM.secCarry, LM.tripArrive, LM.timeRule],
    },
    {
      id: "time-sub",
      code: "[4수03-14]",
      topic: "시간",
      title: "시간의 뺄셈",
      conceptCards: [{ title: "받아내림", body: "분끼리 뺄 수 없으면 1시간을 60분으로 받아내려 계산합니다.", example: "5시 20분 − 2시 45분 = 2시간 35분" }],
      generators: [LM.timeSubEasy, LM.timeBefore, LM.timeSubBorrow, LM.timeDuration, LM.timeStart, LM.timeWho],
    },
  ],
};

export const g3s2Multiplication: Unit = {
  id: "g3-s2-multiplication",
  grade: 3,
  semester: 2,
  number: 1,
  slug: "multiplication",
  title: "곱셈",
  standards: [
    {
      id: "mul3-no-carry",
      code: "[4수01-04]",
      topic: "(세 자리 수)×(한 자리 수)",
      title: "올림이 없는 (세 자리 수)×(한 자리 수)",
      conceptCards: [{ title: "자리마다 곱하기", body: "일, 십, 백의 자리 순서로 곱합니다.", example: "213 × 3 = 639" }],
      generators: [L.mul3NoCarry.calc, L.mul3NoCarry.box, L.mul3NoCarry.cmp, L.mul3NoCarry.ineq, L.mul3NoCarry.wrongOp],
    },
    {
      id: "mul-3x1",
      code: "[4수01-04]",
      topic: "(세 자리 수)×(한 자리 수)",
      title: "올림이 있는 (세 자리 수)×(한 자리 수)",
      conceptCards: [{ title: "올림", body: "각 자리의 곱이 10이거나 10보다 크면 올림한 수를 바로 윗자리 곱에 더합니다.", example: "236 × 4 = 944" }],
      generators: [MD.mul3x1, L.mul3Carry.fix, L.mul3Carry.error, L.mul3Carry.ineq, L.mul3Carry.cards],
    },
    {
      id: "mul-tens-tens",
      code: "[4수01-04]",
      topic: "(두 자리 수)×(두 자리 수)",
      title: "(몇십)×(몇십), (몇십몇)×(몇십)",
      conceptCards: [{ title: "0 붙이기", body: "30 × 40은 3 × 4 = 12에 0을 두 개, 23 × 30은 23 × 3 = 69에 0을 한 개 붙입니다.", example: "23 × 30 = 690" }],
      generators: [MD.mulTensTens, L.mulTensTens.box, L.mulTensTens.big, L.mulTensTens.who, L.mulTensTens.wrongOp],
    },
    {
      id: "mul-1x2",
      code: "[4수01-04]",
      topic: "(두 자리 수)×(두 자리 수)",
      title: "(몇)×(몇십몇)",
      conceptCards: [{ title: "나누어 곱하기", body: "7 × 26은 7 × 6 = 42와 7 × 20 = 140을 더한 182입니다.", example: "7 × 26 = 182" }],
      generators: [L.mulOneTwo.calc, L.mulOneTwo.cmp, L.mulOneTwo.story, L.mulOneTwo.ineq, L.mulOneTwo.wrongOp],
    },
    {
      id: "mul-2x2",
      code: "[4수01-04]",
      topic: "(두 자리 수)×(두 자리 수)",
      title: "(몇십몇)×(몇십몇)",
      conceptCards: [{ title: "나누어 곱하기", body: "27 × 34는 27 × 4 = 108과 27 × 30 = 810을 더한 918입니다.", example: "27 × 34 = 918" }],
      generators: [L.mulTwoTwo.calc, MD.mul2x2, L.mulTwoTwo.fix, L.mulTwoTwo.cards, L.mulTwoTwo.error],
    },
  ],
};

export const g3s2Division: Unit = {
  id: "g3-s2-division",
  grade: 3,
  semester: 2,
  number: 2,
  slug: "division",
  title: "나눗셈",
  standards: [
    {
      id: "div-tens",
      code: "[4수01-06]",
      topic: "(두 자리 수)÷(한 자리 수)",
      title: "(몇십)÷(몇)",
      conceptCards: [{ title: "(몇십)÷(몇)", body: "60 ÷ 3은 6 ÷ 3 = 2에 0을 붙인 20입니다. 70 ÷ 5처럼 십의 자리에서 남으면 일의 자리와 함께 나눕니다.", example: "70 ÷ 5 = 14" }],
      generators: [MD.divTens, L.divTens.box, L.divTens.story, L.divTens.wrongOp, L.divTens.who],
    },
    {
      id: "div-no-rem",
      code: "[4수01-06]",
      topic: "(두 자리 수)÷(한 자리 수)",
      title: "나머지가 없는 (몇십몇)÷(몇)",
      conceptCards: [{ title: "십의 자리부터", body: "84 ÷ 4는 십의 자리 8 ÷ 4 = 2, 일의 자리 4 ÷ 4 = 1이므로 21입니다.", example: "72 ÷ 3 = 24" }],
      generators: [MD.div2x1NoRemainder, LD.l3LongDivExact, L.divExact.big, L.divExact.cards],
    },
    {
      id: "div-rem",
      code: "[4수01-06]",
      topic: "(두 자리 수)÷(한 자리 수)",
      title: "나머지가 있는 (몇십몇)÷(몇)",
      conceptCards: [{ title: "나머지", body: "17 ÷ 5 = 3 … 2에서 2를 나머지라고 합니다. 나머지는 나누는 수보다 작아야 합니다.", example: "47 ÷ 3 = 15 … 2" }],
      generators: [MD.div2x1Remainder, LD.l3LongDivRem, L.divRem.story, L.divRem.remMax, L.divRem.ineq],
    },
    {
      id: "div-3x1",
      code: "[4수01-06]",
      topic: "(세 자리 수)÷(한 자리 수)",
      title: "(세 자리 수)÷(한 자리 수)",
      conceptCards: [{ title: "높은 자리부터", body: "백의 자리부터 차례로 나누고, 나누어지지 않으면 다음 자리와 함께 나눕니다.", example: "536 ÷ 4 = 134" }],
      generators: [L.div3.calc, MD.div3x1, LD.l3LongDiv3x1, L.div3.box, L.div3.cards, L.div3.wrongOp],
    },
    {
      id: "div-check",
      code: "[4수01-06]",
      topic: "(세 자리 수)÷(한 자리 수)",
      title: "계산이 맞는지 확인하기",
      conceptCards: [{ title: "확인하기", body: "나누는 수와 몫의 곱에 나머지를 더하면 나누어지는 수가 되어야 합니다.", example: "17 ÷ 5 = 3 … 2 → 5 × 3 = 15, 15 + 2 = 17" }],
      generators: [L.checkExpr, MD.divCheck, L.checkRight, L.div3.rev, L.checkError],
    },
  ],
};

export const g3s2Fraction: Unit = {
  id: "g3-s2-fraction",
  grade: 3,
  semester: 2,
  number: 4,
  slug: "fraction",
  title: "분수",
  standards: [
    {
      id: "frac-group",
      code: "[4수01-09]",
      topic: "분수로 나타내기",
      title: "분수로 나타내기",
      conceptCards: [{ title: "묶음으로 나타내기", body: "12를 3씩 묶으면 4묶음이 됩니다. 6은 4묶음 중 2묶음이므로 12의 2/4입니다.", example: "12를 3씩 묶으면 6은 12의 2/4" }],
      generators: [LF.groupCount, LF.groupFrac, LF.groupBoxFrac, LF.groupLeft, LF.groupRev],
    },
    {
      id: "frac-of",
      code: "[4수01-09]",
      topic: "분수만큼은 얼마인가요",
      title: "분수만큼은 얼마인지 알아보기(1)",
      conceptCards: [{ title: "전체의 몇 분의 몇", body: "12의 1/3은 12를 똑같이 3묶음으로 나눈 것 중 1묶음이므로 4입니다.", example: "12의 2/3 = 8" }],
      generators: [F2.fracOfUnit, F2.fracOfMany, LF.fracOfBox, LF.fracOfWho],
    },
    {
      id: "frac-of-length",
      code: "[4수01-09]",
      topic: "분수만큼은 얼마인가요",
      title: "분수만큼은 얼마인지 알아보기(2)",
      conceptCards: [{ title: "길이와 시간의 분수만큼", body: "1 m = 100 cm의 1/4은 25 cm, 1시간 = 60분의 1/3은 20분입니다.", example: "1 m의 3/4 = 75 cm" }],
      generators: [LF.fracOfMeter, LF.fracOfDay, LF.fracOfHour, LF.fracTape, LF.fracTapeRev],
    },
    {
      id: "frac-kinds",
      code: "[4수01-10]",
      topic: "여러 가지 분수",
      title: "진분수, 가분수",
      conceptCards: [{ title: "진분수와 가분수", body: "분자가 분모보다 작은 분수는 진분수, 분자가 분모와 같거나 분모보다 큰 분수는 가분수입니다.", example: "2/5는 진분수, 7/5는 가분수" }],
      generators: [LF.properPick, LF.improperCount, LF.properBox, LF.fracCond, FP.improperLine],
    },
    {
      id: "frac-mixed",
      code: "[4수01-10]",
      topic: "여러 가지 분수",
      title: "대분수",
      conceptCards: [
        { title: "대분수", body: "자연수와 진분수로 이루어진 분수를 대분수라고 합니다.", example: "2 1/3" },
        { title: "바꾸기", body: "대분수는 가분수로, 가분수는 대분수로 나타낼 수 있습니다.", example: "7/3 = 2 1/3" },
      ],
      generators: [LF.naturalToFrac, F2.fracKind, F2.fracToMixed, F2.mixedToFrac, LF.mixedCards, LF.mixedCount, FP.mixedBars, FP.mixedLine],
    },
    {
      id: "frac-compare2",
      code: "[4수01-11]",
      topic: "여러 가지 분수",
      title: "분모가 같은 분수의 크기 비교",
      conceptCards: [{ title: "가분수로 바꾸어 비교", body: "대분수를 가분수로 바꾸면 분자끼리 비교할 수 있습니다.", example: "1 2/5 = 7/5 < 8/5" }],
      generators: [F2.fracCompareMixed, LF.mixedLargest, LF.mixedWho],
    },
  ],
};

export const g3s2VolumeWeight: Unit = {
  id: "g3-s2-volume-weight",
  grade: 3,
  semester: 2,
  number: 5,
  slug: "volume-weight",
  title: "들이와 무게",
  standards: [
    {
      id: "vol-compare",
      code: "[4수03-17]",
      topic: "들이",
      title: "들이 비교하기",
      conceptCards: [{ title: "같은 컵으로 비교", body: "같은 컵으로 물을 부어 컵 수를 세면 그릇의 들이를 비교할 수 있습니다. 컵 수가 많을수록 들이가 많습니다." }],
      generators: [LM.volCups, LM.volCupsDiff, LM.volCupSize, LM.volFill, LM.volOrder],
    },
    {
      id: "vol-unit",
      code: "[4수03-17] [4수03-18]",
      topic: "들이",
      title: "들이의 단위",
      conceptCards: [{ title: "L와 mL", body: "1 L = 1000 mL입니다.", example: "2 L 300 mL = 2300 mL" }],
      generators: [ME.volLMl, LM.volBeaker, LM.volCupLml, LM.volEstimate, LM.vol.order, LM.volBeakerCmp],
    },
    {
      id: "vol-add-sub",
      code: "[4수03-19]",
      topic: "들이",
      title: "들이의 덧셈과 뺄셈",
      conceptCards: [{ title: "들이의 계산", body: "L는 L끼리, mL는 mL끼리 계산하고 1000 mL는 1 L로 바꿉니다.", example: "1 L 600 mL + 2 L 700 mL = 4 L 300 mL" }],
      generators: [LM.volAdd, ME.volAddSub, LM.volSub, LM.waterBottle, LM.volRev],
    },
    {
      id: "wt-compare",
      code: "[4수03-20]",
      topic: "무게",
      title: "무게 비교하기",
      conceptCards: [{ title: "단위로 비교", body: "바둑돌이나 동전처럼 같은 물건 몇 개와 무게가 같은지 세면 무게를 비교할 수 있습니다." }],
      generators: [LM.wtCoins, LM.wtCoinsDiff, LM.wtBalance, LM.wtTilt, LM.wtChain, LM.wtOrder],
    },
    {
      id: "wt-unit",
      code: "[4수03-20] [4수03-21] [4수03-22]",
      topic: "무게",
      title: "무게의 단위",
      conceptCards: [{ title: "kg, g, t", body: "1 kg = 1000 g, 1 t = 1000 kg입니다.", example: "3 kg 50 g = 3050 g" }],
      generators: [ME.wtKgG, LM.wtScale, ME.wtTon, LM.wtScaleG, LM.wt.order, LM.wtScaleCmp],
    },
    {
      id: "wt-add-sub",
      code: "[4수03-23]",
      topic: "무게",
      title: "무게의 덧셈과 뺄셈",
      conceptCards: [{ title: "무게의 계산", body: "kg은 kg끼리, g은 g끼리 계산하고 1000 g은 1 kg으로 바꿉니다.", example: "2 kg 700 g + 1 kg 500 g = 4 kg 200 g" }],
      generators: [LM.wtAdd, ME.wtAddSub, LM.wtSub, LM.bagWeight, LM.wtWho],
    },
  ],
};
