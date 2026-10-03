import type { Generator, Unit } from "../types";
import * as G2 from "../generators/grade2";
import { extras } from "../extras";
import * as L from "../lessons/g2";
import * as M from "../lessons/g2-s1b";
import * as N from "../lessons/g2-s2";
import * as SH from "../lessons/g2-shapes";
import * as LG from "../lessons/g2-length";
import * as CL from "../lessons/g2-classify";
import * as T from "../lessons/g2-time";
import * as GR from "../lessons/g2-graph";
import * as PT from "../lessons/g2-pattern";
import * as MO from "../lessons/g2-models";

/** 2학년. 단원 순서·차시는 2022 개정 국정 교과서 흐름을 따른다. 성취기준 코드는 docs/audit-v2 보고서의 코드 표(원문 대조는 docs/USER-TODO.md 3번) */

/** 예전 단계에 붙어 있던 응용·서술형 생성기 하나를 id로 꺼낸다 */
function ex(unitId: string, stdId: string, id: string): Generator {
  const g = extras(unitId, stdId).find((x) => x.id === id);
  if (!g) throw new Error(`${unitId}/${stdId}: ${id} 없음`);
  return g;
}

/* ═══ 2-1 ═══ */

const U1 = "g2-s1-numbers3";
export const g2s1Numbers3: Unit = {
  id: U1,
  grade: 2,
  semester: 1,
  number: 1,
  slug: "numbers3",
  title: "세 자리 수",
  standards: [
    {
      id: "hundred",
      code: "[2수01-02]",
      topic: "백과 몇백",
      title: "백 알아보기",
      conceptCards: [{ title: "백", body: "10이 10개이면 100이고, 백이라고 읽어요. 100은 99보다 1만큼 더 큰 수예요.", example: "90보다 10만큼 더 큰 수 = 100" }],
      generators: [L.hundredFill, L.toHundred, L.hundredNot, L.hundredNeed, L.hundredCoins],
    },
    {
      id: "hundreds",
      code: "[2수01-02]",
      topic: "백과 몇백",
      title: "몇백 알아보기",
      conceptCards: [{ title: "몇백", body: "100이 3개이면 300이고, 삼백이라고 읽어요.", example: "100이 5개 → 500(오백)" }],
      generators: [L.hundredsRead, MO.hundredsLine, L.hundredsSum, L.hundredsOdd, L.hundredsReverse, L.hundredsIneq],
    },
    {
      id: "three-digit",
      code: "[2수01-02]",
      topic: "세 자리 수",
      title: "세 자리 수 알아보기",
      conceptCards: [
        { title: "세 자리 수", body: "100이 3개, 10이 5개, 1이 2개이면 352이고, 삼백오십이라고 읽어요." },
        { title: "0이 있는 수", body: "숫자가 0인 자리는 읽지 않아요.", example: "407 → 사백칠" },
      ],
      generators: [G2.compose3, MO.blocksRead3, L.read3, L.bundle3, L.write3, ex(U1, "read3", "w2-coins3"), L.cards3],
    },
    {
      id: "place-value3",
      code: "[2수01-02]",
      topic: "세 자리 수",
      title: "각 자리의 숫자가 나타내는 값",
      conceptCards: [{ title: "자릿값", body: "352에서 3은 백의 자리 숫자로 300, 5는 십의 자리 숫자로 50, 2는 일의 자리 숫자로 2를 나타내요.", example: "352 = 300 + 50 + 2" }],
      generators: [G2.place3, L.digit3, L.expand3, MO.blocksMore3, L.placeFind3, L.cond3, L.placeError3],
    },
    {
      id: "skip-count3",
      code: "[2수01-03]",
      topic: "뛰어 세기와 크기 비교",
      title: "뛰어 세기",
      conceptCards: [{ title: "뛰어 세기", body: "100씩 뛰어 세면 백의 자리, 10씩 뛰어 세면 십의 자리, 1씩 뛰어 세면 일의 자리 숫자가 1씩 커져요.", example: "345 – 355 – 365 (10씩)" }],
      generators: [L.skipRule3, MO.skipLine3, G2.skip3, ex(U1, "read3", "m2-more-less3"), ex(U1, "order3", "w2-skip-back"), L.skipSave3],
    },
    {
      id: "compare-3",
      code: "[2수01-03]",
      topic: "뛰어 세기와 크기 비교",
      title: "세 자리 수의 크기 비교",
      conceptCards: [{ title: "크기 비교", body: "백의 자리부터 차례로 비교해요. 백의 자리 숫자가 같으면 십의 자리, 그다음 일의 자리를 비교해요.", example: "452 < 471" }],
      generators: [G2.compare3, L.extreme3, L.between3, L.boxIneq3, L.money3],
    },
  ],
};

const U2 = "g2-s1-shapes";
export const g2s1Shapes: Unit = {
  id: U2,
  grade: 2,
  semester: 1,
  number: 2,
  slug: "shapes",
  title: "여러 가지 도형",
  standards: [
    {
      id: "triangle",
      code: "[2수03-04]",
      topic: "삼각형, 사각형, 원",
      title: "삼각형 알아보기",
      conceptCards: [{ title: "삼각형", body: "곧은 선 3개로 둘러싸인 도형이에요. 곧은 선을 변, 두 변이 만나는 점을 꼭짓점이라고 해요.", example: "삼각형: 변 3개, 꼭짓점 3개" }],
      generators: [SH.triFind, L.shapeParts, L.triFact, SH.triCount, SH.triDot, L.triSplit],
    },
    {
      id: "quadrilateral",
      code: "[2수03-04]",
      topic: "삼각형, 사각형, 원",
      title: "사각형 알아보기",
      conceptCards: [{ title: "사각형", body: "곧은 선 4개로 둘러싸인 도형이에요. 변과 꼭짓점이 각각 4개예요." }],
      generators: [SH.quadFind, L.shapeByParts, L.quadFact, SH.quadCount, SH.cutPaper, L.quadSplit],
    },
    {
      id: "pentagon-hexagon",
      code: "[2수03-05]",
      topic: "삼각형, 사각형, 원",
      title: "오각형과 육각형 알아보기",
      conceptCards: [{ title: "오각형·육각형", body: "변과 꼭짓점이 5개인 도형은 오각형, 6개인 도형은 육각형이에요. 변의 수를 세어 이름을 정해요." }],
      generators: [SH.polyName, SH.polyCount, SH.cornerCut, SH.polyDraw, SH.polyVertexSum],
    },
    {
      id: "circle2",
      code: "[2수03-04]",
      topic: "삼각형, 사각형, 원",
      title: "원 알아보기",
      conceptCards: [{ title: "원", body: "어느 쪽에서 보아도 똑같이 동그란 모양이에요. 곧은 선이 없어서 변과 꼭짓점이 없어요." }],
      generators: [SH.circleFind, L.circleFact, SH.circleCount, SH.circleMany, L.shapeError],
    },
    {
      id: "tangram",
      code: "[2수03-03]",
      topic: "칠교판과 쌓기나무",
      title: "칠교판으로 모양 만들기",
      conceptCards: [{ title: "칠교판", body: "칠교판은 7조각이에요. 삼각형 조각 5개와 사각형 조각 2개로 여러 가지 모양을 만들 수 있어요." }],
      generators: [SH.tangramCount, SH.tangramShape, SH.tangramSame, SH.tangramPieces, SH.tangramMissing],
    },
    {
      id: "blocks",
      code: "[2수03-02]",
      topic: "칠교판과 쌓기나무",
      title: "쌓기나무로 모양 만들기",
      conceptCards: [{ title: "쌓기나무", body: "1층, 2층, 3층으로 나누어 세면 사용한 쌓기나무의 수를 빠짐없이 셀 수 있어요. 위치는 오른쪽, 왼쪽, 앞, 뒤, 위로 말해요." }],
      generators: [SH.blocksCount, SH.blocksPosition, SH.blocksLayer, SH.blocksCompare, SH.blocksMore],
    },
  ],
};

const U3 = "g2-s1-add-sub";
export const g2s1AddSub: Unit = {
  id: U3,
  grade: 2,
  semester: 1,
  number: 3,
  slug: "add-sub",
  title: "덧셈과 뺄셈",
  standards: [
    {
      id: "add-2d-1d",
      code: "[2수01-06]",
      topic: "덧셈",
      title: "받아올림이 있는 (두 자리 수)+(한 자리 수)",
      conceptCards: [{ title: "받아올림", body: "일의 자리 수끼리의 합이 10이거나 10보다 크면 10을 십의 자리로 받아올려요.", example: "27 + 5 = 32" }],
      generators: [L.add21, L.add21Fix, L.add21Story, L.add21Cards, L.add21Ineq],
    },
    {
      id: "add-2d-2d",
      code: "[2수01-06]",
      topic: "덧셈",
      title: "받아올림이 있는 (두 자리 수)+(두 자리 수)",
      conceptCards: [
        { title: "일의 자리에서 받아올림", body: "일의 자리 합이 10을 넘으면 십의 자리로 1을 받아올려 십의 자리 계산에 더해요.", example: "38 + 45 = 83" },
        { title: "십의 자리에서 받아올림", body: "십의 자리 합이 10을 넘으면 백의 자리로 1을 받아올려요.", example: "76 + 58 = 134" },
      ],
      generators: [G2.add2Carry, L.add22Row, ex(U3, "carry2", "m2-carry-missing"), L.add22Max, L.add22Cards, L.add22Compare],
    },
    {
      id: "sub-2d-1d",
      code: "[2수01-06]",
      topic: "뺄셈",
      title: "받아내림이 있는 (두 자리 수)−(한 자리 수)",
      conceptCards: [{ title: "받아내림", body: "일의 자리 수끼리 뺄 수 없으면 십의 자리에서 10을 받아내려 계산해요.", example: "32 − 5 = 27" }],
      generators: [L.sub21, L.sub21Fix, L.sub21Story, L.sub21Wrong, L.sub21Ineq],
    },
    {
      id: "sub-tens",
      code: "[2수01-06]",
      topic: "뺄셈",
      title: "받아내림이 있는 (몇십)−(몇십몇)",
      conceptCards: [{ title: "(몇십)−(몇십몇)", body: "일의 자리 0에서 뺄 수 없으므로 십의 자리에서 10을 받아내려요.", example: "50 − 23 = 27" }],
      generators: [L.subTens, L.subTensMissing, L.subTensFix, L.subTensChange, L.subTensWrong],
    },
    {
      id: "sub-2d-2d",
      code: "[2수01-06]",
      topic: "뺄셈",
      title: "받아내림이 있는 (두 자리 수)−(두 자리 수)",
      conceptCards: [{ title: "받아내림", body: "일의 자리끼리 뺄 수 없으면 십의 자리에서 10을 받아내리고, 십의 자리 숫자는 1 작아져요.", example: "52 − 27 = 25" }],
      generators: [G2.sub2Borrow, L.sub22Min, L.sub22Missing, L.sub22Cards, L.sub22Error],
    },
    {
      id: "three-numbers",
      code: "[2수01-08]",
      topic: "여러 가지 계산",
      title: "세 수의 계산",
      conceptCards: [{ title: "세 수의 계산", body: "세 수의 덧셈과 뺄셈은 앞에서부터 두 수씩 차례로 계산해요.", example: "45 + 18 − 26 = 63 − 26 = 37" }],
      generators: [G2.threeNumbers, L.threeMissing, L.threeChoose, ex(U3, "carry2", "w2-bus2"), L.threeReverse],
    },
    {
      id: "add-sub-relation",
      code: "[2수01-07]",
      topic: "여러 가지 계산",
      title: "덧셈과 뺄셈의 관계",
      conceptCards: [{ title: "관계", body: "덧셈식 하나로 뺄셈식 두 개를, 뺄셈식 하나로 덧셈식 두 개를 만들 수 있어요.", example: "15 + 28 = 43 → 43 − 15 = 28, 43 − 28 = 15" }],
      generators: [L.relationFact, G2.missingAddend, L.relationChoose, ex(U3, "relation", "w2-wrong-calc"), L.relationError],
    },
    {
      id: "box-equation",
      code: "[2수01-09]",
      topic: "여러 가지 계산",
      title: "□를 사용하여 식 만들고 □ 구하기",
      conceptCards: [{ title: "□를 사용한 식", body: "모르는 수를 □로 놓고 식을 만든 뒤, 덧셈과 뺄셈의 관계를 이용해 □를 구해요.", example: "□ + 18 = 45 → □ = 45 − 18 = 27" }],
      generators: [L.boxSolve, L.boxWrite, L.boxStory, L.boxWrongAdd, L.boxWrongSub, L.boxIneq2],
    },
  ],
};

const U4 = "g2-s1-length";
export const g2s1Length: Unit = {
  id: U4,
  grade: 2,
  semester: 1,
  number: 4,
  slug: "length",
  title: "길이 재기",
  standards: [
    {
      id: "unit-measure",
      code: "[2수03-10]",
      topic: "여러 가지 단위",
      title: "여러 가지 단위로 길이 재기",
      conceptCards: [{ title: "단위로 재기", body: "클립, 뼘처럼 정한 단위로 몇 번인지 세어 길이를 나타내요. 단위가 길수록 잰 횟수는 적어요." }],
      generators: [M.unitTimes, M.unitWho, LG.unitDiff, LG.unitThree, M.unitJudge],
    },
    {
      id: "cm-unit",
      code: "[2수03-10]",
      topic: "cm와 자",
      title: "1 cm 알아보기",
      conceptCards: [{ title: "1 cm", body: "누구나 같은 길이로 재려면 같은 단위가 필요해요. 이 길이를 1 cm라 쓰고 1 센티미터라고 읽어요.", example: "1 cm가 5번 → 5 cm" }],
      generators: [LG.cmRead, M.cmPath, M.cmJoin, LG.tapeOverlap, M.cmRect],
    },
    {
      id: "ruler-measure",
      code: "[2수03-10]",
      topic: "cm와 자",
      title: "자로 길이 재기",
      conceptCards: [{ title: "자로 재기", body: "물건의 한쪽 끝을 눈금 0에 맞추고 다른 쪽 끝의 눈금을 읽어요. 0이 아닌 눈금에 맞추었으면 1 cm가 몇 번인지 세어요." }],
      generators: [G2.rulerRead, LG.rulerFromTo, LG.rulerLongest, LG.rulerError, LG.rulerJoin],
    },
    {
      id: "about-cm",
      code: "[2수03-10]",
      topic: "cm와 자",
      title: "길이를 약 몇 cm로 나타내기",
      conceptCards: [{ title: "약 몇 cm", body: "끝이 눈금 사이에 있으면 더 가까운 쪽의 눈금을 읽고, 숫자 앞에 '약'을 붙여요.", example: "6과 7 사이에서 7에 가까우면 약 7 cm" }],
      generators: [LG.aboutCm, LG.aboutNear, LG.aboutPick, LG.aboutError, LG.aboutLonger],
    },
    {
      id: "estimate-length",
      code: "[2수03-12]",
      topic: "길이 어림하기",
      title: "길이 어림하기",
      conceptCards: [{ title: "어림하기", body: "자를 쓰지 않고 1 cm나 내 뼘의 길이를 떠올려 길이가 얼마쯤인지 짐작하는 것을 어림이라고 해요. 어림한 길이는 '약'을 붙여 말해요." }],
      generators: [LG.estimatePic, M.estimateObject, LG.estimateClosest, LG.estimateHand, LG.estimateJudge, LG.estimateTwo],
    },
  ],
};

const U5 = "g2-s1-classify";
export const g2s1Classify: Unit = {
  id: U5,
  grade: 2,
  semester: 1,
  number: 5,
  slug: "classify",
  title: "분류하기",
  standards: [
    {
      id: "sort-criteria",
      code: "[2수04-01]",
      topic: "분류하기",
      title: "분류는 어떻게 할까요",
      conceptCards: [{ title: "분류 기준", body: "누가 분류해도 결과가 같은 분명한 기준(색깔, 모양, 다리의 수 등)으로 나누어요. '예쁜 것'처럼 사람마다 다른 기준은 알맞지 않아요." }],
      generators: [CL.criteriaWhich, M.criteriaChoice, M.criteriaOdd, CL.criteriaOddPic, M.criteriaError, CL.criteriaTwo],
    },
    {
      id: "sort-by",
      code: "[2수04-01]",
      topic: "분류하기",
      title: "기준에 따라 분류하기",
      conceptCards: [{ title: "분류하기", body: "기준을 정하고, 하나씩 확인하며 알맞은 쪽으로 나누어요. 빠뜨리거나 두 번 넣지 않도록 표시하며 나누어요." }],
      generators: [CL.classifyCount, CL.sortShape, M.sortLegs, ex(U5, "classify", "w2-classify-two"), CL.sortWrong],
    },
    {
      id: "count-sorted",
      code: "[2수04-01]",
      topic: "분류하여 세기",
      title: "분류하고 세어 보기",
      conceptCards: [{ title: "세기", body: "분류한 뒤 종류별로 세어 표에 쓰면 수를 한눈에 알 수 있어요. 센 것에 ✓ 표시를 해요." }],
      generators: [CL.countList, MO.tallyRead, CL.countTwo, CL.countDiff, M.countReverse, CL.criteriaTwo],
    },
    {
      id: "sort-result",
      code: "[2수04-01]",
      topic: "분류하여 세기",
      title: "분류한 결과 말하기",
      conceptCards: [{ title: "결과 말하기", body: "분류하여 센 결과를 보고 가장 많은 것, 가장 적은 것을 찾아 앞으로 무엇을 더 준비하면 좋을지 말해요." }],
      generators: [CL.resultMost, CL.resultMore, M.resultSum, CL.resultNeed, ex(U5, "classify", "w2-classify-two")],
    },
  ],
};

const U6 = "g2-s1-multiplication";
export const g2s1Multiplication: Unit = {
  id: U6,
  grade: 2,
  semester: 1,
  number: 6,
  slug: "multiplication",
  title: "곱셈",
  standards: [
    {
      id: "count-many-ways",
      code: "[2수01-10]",
      topic: "묶어 세기",
      title: "여러 가지 방법으로 세기",
      conceptCards: [{ title: "여러 가지 방법", body: "하나씩 세기, 뛰어 세기, 묶어 세기 등 여러 방법으로 셀 수 있어요. 뛰어 세거나 묶어 세면 빠르게 셀 수 있어요." }],
      generators: [M.countDots, M.skipTimes, M.countWays, M.countCompare, M.countBoxesEat],
    },
    {
      id: "group-count",
      code: "[2수01-10]",
      topic: "묶어 세기",
      title: "묶어 세기",
      conceptCards: [{ title: "묶어 세기", body: "2씩, 3씩, 4씩…처럼 똑같은 수만큼 묶어 세요. 남는 것이 없는지도 확인해요.", example: "12개를 3씩 묶으면 4묶음" }],
      generators: [M.bundleCount, M.bundleWays, M.bundleLeft, M.bundleDiff, M.bundleRegroup],
    },
    {
      id: "times-of",
      code: "[2수01-10]",
      topic: "몇의 몇 배",
      title: "몇의 몇 배 알아보기",
      conceptCards: [{ title: "몇의 몇 배", body: "3씩 4묶음은 3의 4배예요. 3의 4배는 3을 4번 더한 것과 같아요.", example: "3의 4배 = 3 + 3 + 3 + 3 = 12" }],
      generators: [G2.groupsOf, ex(U6, "groups", "m2-times-diff"), M.timesOfRev, M.timesOfCompare, M.timesOfTape],
    },
    {
      id: "mul-sentence",
      code: "[2수01-10]",
      topic: "곱셈식",
      title: "곱셈 알아보기",
      conceptCards: [{ title: "곱셈식", body: "3의 4배를 3 × 4라고 쓰고 '3 곱하기 4'라고 읽어요. 3 × 4 = 12는 '3 곱하기 4는 12와 같습니다'라고 읽어요.", example: "3 + 3 + 3 + 3 = 3 × 4 = 12" }],
      generators: [M.mulWrite, M.mulRepeat, M.mulMissing, M.mulCards, M.mulError],
    },
    {
      id: "mul-express",
      code: "[2수01-10]",
      topic: "곱셈식",
      title: "곱셈식으로 나타내기",
      conceptCards: [{ title: "곱셈식으로 나타내기", body: "한 묶음의 수와 묶음의 수를 찾아 (한 묶음의 수) × (묶음의 수)로 나타내요.", example: "한 접시에 5개씩 3접시 → 5 × 3 = 15" }],
      generators: [M.mulPicture, M.mulStoryChoice, M.mulStory, ex(U6, "groups", "w2-boxes-eat"), M.bundleRegroup],
    },
  ],
};

/* ═══ 2-2 ═══ */

const V1 = "g2-s2-numbers4";
export const g2s2Numbers4: Unit = {
  id: V1,
  grade: 2,
  semester: 2,
  number: 1,
  slug: "numbers4",
  title: "네 자리 수",
  standards: [
    {
      id: "thousand",
      code: "[2수01-02]",
      topic: "천과 몇천",
      title: "천 알아보기",
      conceptCards: [{ title: "천", body: "100이 10개이면 1000이고, 천이라고 읽어요. 1000은 999보다 1만큼 더 큰 수예요.", example: "900보다 100만큼 더 큰 수 = 1000" }],
      generators: [N.thousandFill, N.toThousand, N.thousandNot, N.thousandNeed, N.thousandCoins],
    },
    {
      id: "thousands",
      code: "[2수01-02]",
      topic: "천과 몇천",
      title: "몇천 알아보기",
      conceptCards: [{ title: "몇천", body: "1000이 4개이면 4000이고, 사천이라고 읽어요." }],
      generators: [N.thousandsRead, N.thousandsSum, N.thousandsOdd, N.thousandsReverse, N.thousandsIneq],
    },
    {
      id: "four-digit",
      code: "[2수01-02]",
      topic: "네 자리 수",
      title: "네 자리 수 알아보기",
      conceptCards: [{ title: "네 자리 수", body: "1000이 4개, 100이 7개, 10이 2개, 1이 5개이면 4725이고, 사천칠백이십오라고 읽어요.", example: "3052 → 삼천오십이" }],
      generators: [G2.compose4, N.read4, N.bundle4, N.write4, ex(V1, "read4", "w2-money4"), N.cards4],
    },
    {
      id: "place-value4",
      code: "[2수01-02]",
      topic: "네 자리 수",
      title: "각 자리의 숫자가 나타내는 값",
      conceptCards: [{ title: "자릿값", body: "4725에서 4는 4000, 7은 700, 2는 20, 5는 5를 나타내요.", example: "4725 = 4000 + 700 + 20 + 5" }],
      generators: [G2.place4, N.digit4, N.expand4, N.placeFind4, N.cond4, N.placeError4],
    },
    {
      id: "skip-count4",
      code: "[2수01-03]",
      topic: "뛰어 세기와 크기 비교",
      title: "뛰어 세기",
      conceptCards: [{ title: "뛰어 세기", body: "1000씩 뛰어 세면 천의 자리, 100씩 뛰어 세면 백의 자리 숫자가 1씩 커져요.", example: "2350 – 3350 – 4350 (1000씩)" }],
      generators: [N.skipRule4, G2.skip4, ex(V1, "read4", "m2-more-less4"), ex(V1, "order4", "w2-skip-back4"), N.skipSave4],
    },
    {
      id: "compare-4",
      code: "[2수01-03]",
      topic: "뛰어 세기와 크기 비교",
      title: "네 자리 수의 크기 비교",
      conceptCards: [{ title: "크기 비교", body: "천의 자리부터 차례로 비교해요. 같은 자리 숫자가 같으면 바로 아래 자리를 비교해요.", example: "4352 > 4325" }],
      generators: [G2.compare4, N.extreme4, N.between4, N.boxIneq4, N.money4j],
    },
  ],
};

const V2 = "g2-s2-times-tables";
export const g2s2TimesTables: Unit = {
  id: V2,
  grade: 2,
  semester: 2,
  number: 2,
  slug: "times-tables",
  title: "곱셈구구",
  standards: [
    {
      id: "tt-2-5",
      code: "[2수01-11]",
      topic: "2단부터 9단까지",
      title: "2단, 5단 곱셈구구",
      conceptCards: [{ title: "2단과 5단", body: "2단은 곱이 2씩, 5단은 곱이 5씩 커져요. 5단의 곱은 일의 자리 숫자가 0 또는 5예요.", example: "5 × 3 = 15, 5 × 4 = 20" }],
      generators: N.tt25,
    },
    {
      id: "tt-3-6",
      code: "[2수01-11]",
      topic: "2단부터 9단까지",
      title: "3단, 6단 곱셈구구",
      conceptCards: [{ title: "3단과 6단", body: "3단은 3씩, 6단은 6씩 커져요. 6단의 곱은 3단의 곱의 2배예요.", example: "3 × 4 = 12, 6 × 4 = 24" }],
      generators: N.tt36,
    },
    {
      id: "tt-4-8",
      code: "[2수01-11]",
      topic: "2단부터 9단까지",
      title: "4단, 8단 곱셈구구",
      conceptCards: [{ title: "4단과 8단", body: "4단은 4씩, 8단은 8씩 커져요. 8단의 곱은 4단의 곱의 2배예요.", example: "4 × 6 = 24, 8 × 6 = 48" }],
      generators: N.tt48,
    },
    {
      id: "tt-7",
      code: "[2수01-11]",
      topic: "2단부터 9단까지",
      title: "7단 곱셈구구",
      conceptCards: [{ title: "7단", body: "7단은 곱하는 수가 1씩 커질 때마다 곱이 7씩 커져요.", example: "7 × 5 = 35, 7 × 6 = 42" }],
      generators: N.tt7,
    },
    {
      id: "tt-9",
      code: "[2수01-11]",
      topic: "2단부터 9단까지",
      title: "9단 곱셈구구",
      conceptCards: [{ title: "9단", body: "9단은 9씩 커져요. 9단의 곱은 십의 자리 숫자와 일의 자리 숫자의 합이 9예요.", example: "9 × 3 = 27 (2 + 7 = 9)" }],
      generators: N.tt9,
    },
    {
      id: "tt-1-0",
      code: "[2수01-11]",
      topic: "1단과 0의 곱",
      title: "1단 곱셈구구와 0의 곱",
      conceptCards: [
        { title: "1단", body: "1과 어떤 수의 곱은 항상 어떤 수 자신이에요.", example: "1 × 7 = 7" },
        { title: "0의 곱", body: "0과 어떤 수의 곱, 어떤 수와 0의 곱은 항상 0이에요.", example: "0 × 5 = 0, 5 × 0 = 0" },
      ],
      generators: [G2.timesZeroOne, G2.timesTableMissing, N.zeroScore, ex(V2, "tables-01", "w2-two-unknowns"), N.zeroCompare],
    },
    {
      id: "times-chart",
      code: "[2수01-11]",
      topic: "곱셈표와 문제 해결",
      title: "곱셈표 만들기",
      conceptCards: [{ title: "곱셈표", body: "왼쪽 수와 위쪽 수를 곱해 칸을 채워요. 곱하는 두 수의 순서를 바꾸어도 곱은 같아요.", example: "3 × 4 = 4 × 3 = 12" }],
      generators: [N.chartCell, G2.mulTablePattern, N.chartSame, ex("g2-s2-patterns", "table-pattern", "w2-table-count"), N.chartCond],
    },
    {
      id: "tt-solve",
      code: "[2수01-11]",
      topic: "곱셈표와 문제 해결",
      title: "곱셈구구로 문제 해결하기",
      conceptCards: [{ title: "문제 해결", body: "같은 수가 여러 묶음 있으면 곱셈구구로 전체를 구해요. 더하거나 빼는 계산이 함께 있으면 곱을 먼저 구해요." }],
      generators: [...N.ttAll, ex(V2, "tables", "m2-next-times"), ex(V2, "tables", "w2-empty-chairs"), N.ttTwoStep],
    },
  ],
};

const V3 = "g2-s2-length-m";
export const g2s2LengthM: Unit = {
  id: V3,
  grade: 2,
  semester: 2,
  number: 3,
  slug: "length-m",
  title: "길이 재기",
  standards: [
    {
      id: "meter",
      code: "[2수03-11]",
      topic: "m 알아보기",
      title: "cm보다 더 큰 단위 알아보기",
      conceptCards: [{ title: "1 m", body: "100 cm는 1 m이고 1 미터라고 읽어요. 1 m보다 35 cm 더 긴 것은 1 m 35 cm예요.", example: "1 m 35 cm = 135 cm" }],
      generators: [G2.lenMCm, LG.mRead, LG.mStick, N.mCompare, N.mIneq, LG.mJudge],
    },
    {
      id: "tape-measure",
      code: "[2수03-10]",
      topic: "m 알아보기",
      title: "자로 길이 재기",
      conceptCards: [{ title: "줄자로 재기", body: "긴 길이는 줄자나 1 m 자로 재요. 물건의 한쪽 끝을 눈금 0에 맞추고 다른 쪽 끝의 눈금을 읽어 몇 m 몇 cm로 나타내요." }],
      generators: [N.tapeRead, LG.tapeFrom, LG.tapeMeterStick, N.tapeError, LG.tapeDiff],
    },
    {
      id: "length-add",
      code: "[2수03-13]",
      topic: "길이의 합과 차",
      title: "길이의 합 구하기",
      conceptCards: [{ title: "길이의 합", body: "m는 m끼리, cm는 cm끼리 더해요.", example: "1 m 20 cm + 2 m 45 cm = 3 m 65 cm" }],
      generators: [LG.mAddPic, N.mAddStory, LG.mAddMissing, LG.mRoute, N.mAddCards, N.bodyLength],
    },
    {
      id: "length-sub",
      code: "[2수03-13]",
      topic: "길이의 합과 차",
      title: "길이의 차 구하기",
      conceptCards: [{ title: "길이의 차", body: "m는 m끼리, cm는 cm끼리 빼요.", example: "5 m 70 cm − 2 m 30 cm = 3 m 40 cm" }],
      generators: [LG.mSubPic, N.mSub, LG.mSubStory, N.mSubMissing, LG.ropeCut, N.mSubWrong],
    },
    {
      id: "m-estimate",
      code: "[2수03-12]",
      topic: "길이 어림하기",
      title: "길이 어림하기",
      conceptCards: [{ title: "m 어림하기", body: "양팔을 벌린 길이, 걸음 등 몸의 부분으로 1 m를 떠올려 긴 길이를 어림해요.", example: "한 걸음이 약 50 cm이면 2걸음은 약 1 m" }],
      generators: [LG.mEstStick, N.mEstObject, LG.mEstStep, N.mEstClosest, N.mEstJudge, LG.mEstTwo],
    },
  ],
};

const V4 = "g2-s2-time";
export const g2s2Time: Unit = {
  id: V4,
  grade: 2,
  semester: 2,
  number: 4,
  slug: "time",
  title: "시각과 시간",
  standards: [
    {
      id: "clock-5min",
      code: "[2수03-07]",
      topic: "몇 시 몇 분",
      title: "몇 시 몇 분 읽기(5분 단위)",
      conceptCards: [{ title: "긴바늘 읽기", body: "짧은바늘은 '시', 긴바늘은 '분'을 나타내요. 긴바늘이 숫자 1을 가리키면 5분, 2는 10분, 3은 15분…이에요." }],
      generators: [T.clock5, T.clock5Hand, T.clock5After, T.clockError, N.clockOrder],
    },
    {
      id: "clock-1min",
      code: "[2수03-07]",
      topic: "몇 시 몇 분",
      title: "몇 시 몇 분 읽기(1분 단위)",
      conceptCards: [{ title: "1분", body: "시계의 작은 눈금 한 칸은 1분이에요. 긴바늘이 숫자 4에서 작은 눈금 3칸 더 가면 23분이에요.", example: "5 × 4 = 20, 20 + 3 = 23(분)" }],
      generators: [T.clockReadMinute, T.clock1Ticks, N.clock1Where, N.clockCond, T.clock1Error],
    },
    {
      id: "minutes-before",
      code: "[2수03-07]",
      topic: "몇 시 몇 분",
      title: "여러 가지 방법으로 시각 읽기",
      conceptCards: [{ title: "몇 시 몇 분 전", body: "2시 55분은 3시가 되기 5분 전이므로 3시 5분 전이라고도 해요." }],
      generators: [T.beforeRead, ex(V4, "clock-min", "m2-minutes-before"), T.beforeSame, T.beforeCompare, T.beforeReverse],
    },
    {
      id: "hour-elapsed",
      code: "[2수03-08]",
      topic: "시간",
      title: "1시간과 걸린 시간",
      conceptCards: [{ title: "1시간", body: "긴바늘이 한 바퀴 도는 데 걸린 시간은 60분이고, 60분은 1시간이에요.", example: "1시간 20분 = 80분" }],
      generators: [T.elapsedBand, T.timeUnits, T.elapsed, ex(V4, "clock-min", "w2-study-end"), T.elapsedCompare],
    },
    {
      id: "day-time",
      code: "[2수03-09]",
      topic: "시간",
      title: "하루의 시간",
      conceptCards: [{ title: "오전과 오후", body: "전날 밤 12시부터 낮 12시까지를 오전, 낮 12시부터 밤 12시까지를 오후라고 해요. 하루는 24시간이에요.", example: "1일 = 24시간" }],
      generators: [N.dayHours, N.dayBand, N.ampmElapsed, N.ampmChoice, N.ampmBand, N.dayReverse],
    },
    {
      id: "calendar",
      code: "[2수03-09]",
      topic: "달력",
      title: "달력 알아보기",
      conceptCards: [{ title: "달력", body: "1주일은 7일이고, 같은 요일은 7일마다 돌아와요. 1년은 12개월이고, 달마다 날수가 달라요.", example: "30일: 4, 6, 9, 11월 / 31일: 1, 3, 5, 7, 8, 10, 12월" }],
      generators: [N.weekDays, T.calendarRead, T.calendarDay, N.monthDays, T.calendarNth, N.calendarSpan],
    },
  ],
};

const V5 = "g2-s2-table-graph";
export const g2s2TableGraph: Unit = {
  id: V5,
  grade: 2,
  semester: 2,
  number: 5,
  slug: "table-graph",
  title: "표와 그래프",
  standards: [
    {
      id: "make-table",
      code: "[2수04-02]",
      topic: "표",
      title: "자료를 분류하여 표로 나타내기",
      conceptCards: [{ title: "표", body: "조사한 자료를 종류별로 세어 표로 나타내면 각각의 수와 전체 수(합계)를 쉽게 알 수 있어요." }],
      generators: [GR.tableFromList, N.tableTotal, MO.tallyTotal, GR.tablePic, N.tableTwoBlank, GR.tableCheck, N.graphTwoClass],
    },
    {
      id: "draw-graph",
      code: "[2수04-03]",
      topic: "그래프",
      title: "그래프로 나타내기",
      conceptCards: [{ title: "○ 그래프", body: "가로와 세로에 나타낼 것을 정하고, 한 칸에 ○를 하나씩 아래(왼쪽)부터 빈칸 없이 그려요." }],
      generators: [GR.circleGraph, GR.graphHow, N.graphRows, GR.graphFix, GR.graphSumMore],
    },
    {
      id: "read-graph",
      code: "[2수04-03]",
      topic: "그래프",
      title: "표와 그래프의 내용 알아보기",
      conceptCards: [{ title: "그래프 읽기", body: "그래프에서는 가장 많은 것과 가장 적은 것을 한눈에 알 수 있고, 표에서는 각각의 수와 합계를 쉽게 알 수 있어요." }],
      generators: [GR.graphMost, GR.graphMostLeast, GR.graphMoreThan, N.graphCond, GR.graphMissing],
    },
    {
      id: "table-graph",
      code: "[2수04-02] [2수04-03]",
      topic: "그래프",
      title: "표와 그래프로 나타내기",
      conceptCards: [{ title: "조사하고 나타내기", body: "조사할 것과 방법을 정해 자료를 모으고, 표와 그래프로 나타낸 뒤 알게 된 점을 말해요." }],
      generators: [GR.graphFromList, N.surveyMethod, GR.graphComplete, GR.tableOrGraph, GR.graphFix, N.graphCond],
    },
  ],
};

const V6 = "g2-s2-patterns";
export const g2s2Patterns: Unit = {
  id: V6,
  grade: 2,
  semester: 2,
  number: 6,
  slug: "patterns",
  title: "규칙 찾기",
  standards: [
    {
      id: "add-table-rule",
      code: "[2수02-01]",
      topic: "덧셈표와 곱셈표",
      title: "덧셈표에서 규칙 찾기",
      conceptCards: [{ title: "덧셈표의 규칙", body: "덧셈표는 오른쪽이나 아래쪽으로 갈수록 1씩, ↘ 방향으로는 2씩 커져요. ↙ 방향으로는 같은 수가 놓여요." }],
      generators: [N.addTableCell, N.addTableNext, G2.addTablePattern, N.addTableCount, N.addTableNth],
    },
    {
      id: "mul-table-rule",
      code: "[2수02-01]",
      topic: "덧셈표와 곱셈표",
      title: "곱셈표에서 규칙 찾기",
      conceptCards: [{ title: "곱셈표의 규칙", body: "곱셈표에서 □단의 수는 오른쪽으로 갈수록 □씩 커져요. 곱하는 두 수의 순서를 바꾸어도 곱은 같아요." }],
      generators: [ex(V6, "table-pattern", "e2-skip-k"), N.chartSame, G2.mulTablePattern, ex(V6, "table-pattern", "w2-table-count"), N.mulTableFirst],
    },
    {
      id: "pattern-shape",
      code: "[2수02-01]",
      topic: "무늬와 쌓은 모양",
      title: "무늬에서 규칙 찾기",
      conceptCards: [{ title: "되풀이", body: "모양이나 색깔이 되풀이되는 부분을 찾으면 다음에 올 것이나 몇째에 올 것을 알 수 있어요." }],
      generators: [PT.patternNext, PT.patternRotate, N.patternColor, PT.patternNth, PT.patternGrid, N.patternCount],
    },
    {
      id: "pattern-blocks",
      code: "[2수02-01]",
      topic: "무늬와 쌓은 모양",
      title: "쌓은 모양에서 규칙 찾기",
      conceptCards: [{ title: "쌓은 모양의 규칙", body: "쌓기나무가 몇 개씩 늘어나는지, 어느 방향으로 늘어나는지 살펴보면 다음 모양을 알 수 있어요." }],
      generators: [PT.blocksSeq, PT.blocksSeqFifth, PT.blocksSeqDiff, PT.blocksStair, PT.blocksTotal],
    },
    {
      id: "pattern-life",
      code: "[2수02-01]",
      topic: "생활에서 규칙 찾기",
      title: "생활에서 규칙 찾기",
      conceptCards: [{ title: "생활 속 규칙", body: "달력은 아래로 7씩 커지고, 공연장 좌석 번호나 버스 시간표에도 일정하게 커지는 규칙이 있어요." }],
      generators: [T.calendarColumn, N.seatNumber, N.busTimes, N.seatReverse, N.calendarSameDay],
    },
  ],
};
