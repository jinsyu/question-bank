import type { Unit } from "../types";
import * as G5 from "../generators/grade5";
import * as L from "../lessons/g5";
import * as M from "../lessons/g5-2";
import * as CG from "../lessons/g5-congruence";
import * as SY from "../lessons/g5-symmetry";
import * as AR from "../lessons/g5-area";
import * as CB from "../lessons/g5-cuboid";
import * as FP from "../lessons/g5-frac-pics";

/** 5학년. 단원·차시 순서는 검정 교과서(천재교육 계열) 흐름, 성취기준 코드는 docs/audit-v2 보고서의 코드 표(원문 대조는 docs/USER-TODO.md 3번).
 * 예전 단계 id를 그대로 쓰는 차시에는 그 단계의 응용·서술형 생성기가 자동으로 붙는다(src/content/index.ts). */

const unit = (
  id: string,
  semester: 1 | 2,
  number: number,
  slug: string,
  title: string,
  standards: Unit["standards"],
): Unit => ({ id, grade: 5, semester, number, slug, title, standards });

/* ── 5-1 ── */

const MC = "g5-s1-mixed-calc";
export const g5s1MixedCalc = unit(MC, 1, 1, "mixed-calc", "자연수의 혼합 계산", [
  {
    id: "add-sub",
    code: "[6수01-01]",
    topic: "두 가지 계산이 섞여 있는 식",
    title: "덧셈과 뺄셈이 섞여 있는 식",
    conceptCards: [{ title: "앞에서부터", body: "덧셈과 뺄셈이 섞여 있는 식은 앞에서부터 차례로 계산합니다. ( )가 있으면 ( ) 안을 먼저 계산합니다.", example: "40 − (12 + 8) = 20" }],
    generators: [L.asCalc, L.asMissing, L.asExpr, L.asWrong, L.asCompare],
  },
  {
    id: "mul-div",
    code: "[6수01-01]",
    topic: "두 가지 계산이 섞여 있는 식",
    title: "곱셈과 나눗셈이 섞여 있는 식",
    conceptCards: [{ title: "앞에서부터", body: "곱셈과 나눗셈이 섞여 있는 식은 앞에서부터 차례로 계산합니다. ( )가 있으면 ( ) 안을 먼저 계산합니다.", example: "48 ÷ (4 × 2) = 6" }],
    generators: [L.mdCalc, L.mdMissing, L.mdExtreme, L.mdLife, L.mdError],
  },
  {
    id: "order",
    code: "[6수01-01]",
    topic: "세 가지 이상의 계산이 섞여 있는 식",
    title: "덧셈, 뺄셈, 곱셈이 섞여 있는 식",
    conceptCards: [{ title: "곱셈 먼저", body: "덧셈, 뺄셈, 곱셈이 섞여 있는 식은 곱셈을 먼저 계산합니다. ( )가 있으면 ( ) 안을 가장 먼저 계산합니다.", example: "20 + 4 × 3 = 32" }],
    generators: [L.asmCalc, L.asmMissing, L.asmCards],
  },
  {
    id: "add-sub-div",
    code: "[6수01-01]",
    topic: "세 가지 이상의 계산이 섞여 있는 식",
    title: "덧셈, 뺄셈, 나눗셈이 섞여 있는 식",
    conceptCards: [{ title: "나눗셈 먼저", body: "덧셈, 뺄셈, 나눗셈이 섞여 있는 식은 나눗셈을 먼저 계산합니다. ( )가 있으면 ( ) 안을 가장 먼저 계산합니다.", example: "30 − 12 ÷ 3 + 5 = 31" }],
    generators: [L.asdCalc, L.asdMissing, L.asdExtreme, L.asdRange, L.asdLife],
  },
  {
    id: "one-expression",
    code: "[6수01-01]",
    topic: "세 가지 이상의 계산이 섞여 있는 식",
    title: "덧셈, 뺄셈, 곱셈, 나눗셈이 섞여 있는 식",
    conceptCards: [
      { title: "계산 순서", body: "( ) 안 → ×, ÷ → +, − 순서로 계산하고, 같은 단계에서는 앞에서부터 계산합니다.", example: "20 + 4 × 3 − 8 ÷ 2 = 28" },
      { title: "문장을 식으로", body: "문제 상황을 하나의 식으로 쓰고 계산 순서에 맞게 계산합니다." },
    ],
    generators: [L.allCalc, G5.mixedCalc, G5.mixedCalcWord, L.allParen, L.allError],
  },
]);

export const g5s1Factors = unit("g5-s1-factors", 1, 2, "factors", "약수와 배수", [
  {
    id: "divisors",
    code: "[6수01-04]",
    topic: "약수와 배수",
    title: "약수",
    conceptCards: [{ title: "약수", body: "어떤 수를 나누어떨어지게 하는 수를 그 수의 약수라고 합니다. 1과 자기 자신은 항상 약수입니다.", example: "12의 약수: 1, 2, 3, 4, 6, 12" }],
    generators: [G5.divisorCount, L.dvNot, L.dvCond],
  },
  {
    id: "multiples",
    code: "[6수01-05]",
    topic: "약수와 배수",
    title: "배수",
    conceptCards: [{ title: "배수", body: "어떤 수를 1배, 2배, 3배… 한 수를 그 수의 배수라고 합니다.", example: "4의 배수: 4, 8, 12, 16, …" }],
    generators: [G5.multipleFind, L.mlCount, L.mlNot, L.mlRange, L.mlCards],
  },
  {
    id: "relation",
    code: "[6수01-04] [6수01-05]",
    topic: "약수와 배수",
    title: "약수와 배수의 관계",
    conceptCards: [{ title: "곱셈식으로 알아보기", body: "□ × △ = ○일 때 ○는 □와 △의 배수이고, □와 △는 ○의 약수입니다.", example: "3 × 4 = 12 → 12는 3과 4의 배수, 3과 4는 12의 약수" }],
    generators: [L.relPair, L.relBoth, L.relStatement, L.relSigma, L.relCond],
  },
  {
    id: "gcd",
    code: "[6수01-04]",
    topic: "공약수와 최대공약수",
    title: "공약수와 최대공약수",
    conceptCards: [
      { title: "최대공약수", body: "두 수의 공통인 약수를 공약수, 공약수 중에서 가장 큰 수를 최대공약수라고 합니다.", example: "12와 18의 최대공약수: 6" },
      { title: "공약수 = 최대공약수의 약수", body: "두 수의 공약수는 두 수의 최대공약수의 약수와 같습니다." },
    ],
    generators: [L.gcdCalc, L.gcdCount, L.gcdSum, L.gcdShare, L.gcdRemain],
  },
  {
    id: "lcm",
    code: "[6수01-05]",
    topic: "공배수와 최소공배수",
    title: "공배수와 최소공배수",
    conceptCards: [
      { title: "최소공배수", body: "두 수의 공통인 배수를 공배수, 공배수 중에서 가장 작은 수를 최소공배수라고 합니다.", example: "4와 6의 최소공배수: 12" },
      { title: "공배수 = 최소공배수의 배수", body: "두 수의 공배수는 두 수의 최소공배수의 배수와 같습니다." },
    ],
    generators: [L.lcmCalc, L.lcmCount, L.lcmNth, L.lcmLights, L.lcmRemain],
  },
  {
    id: "gcd-lcm",
    code: "[6수01-04] [6수01-05]",
    topic: "공배수와 최소공배수",
    title: "최대공약수와 최소공배수 구하기",
    conceptCards: [{ title: "나눗셈으로 구하기", body: "두 수를 공약수로 계속 나누어 왼쪽의 수를 모두 곱하면 최대공약수, 왼쪽과 아래의 수를 모두 곱하면 최소공배수입니다.", example: "12와 18 → 최대공약수 6, 최소공배수 36" }],
    generators: [G5.gcdLcm, L.glDivision, L.glOther],
  },
]);

export const g5s1Correspondence = unit("g5-s1-correspondence", 1, 3, "correspondence", "규칙과 대응", [
  {
    id: "table",
    code: "[6수02-01]",
    topic: "대응 관계",
    title: "두 양 사이의 관계 알아보기",
    conceptCards: [{ title: "대응", body: "한 양이 변할 때 다른 양이 일정한 규칙에 따라 변하는 관계를 대응 관계라고 합니다. 표로 나타내면 규칙을 찾기 쉽습니다." }],
    generators: [L.corBlank, L.corNext, L.corPattern],
  },
  {
    id: "rule",
    code: "[6수02-01]",
    topic: "대응 관계",
    title: "대응 관계를 식으로 나타내기",
    conceptCards: [{ title: "기호로 식 쓰기", body: "○, △ 같은 기호를 써서 두 양 사이의 대응 관계를 식으로 나타냅니다.", example: "△ = ○ × 3 또는 ○ = △ ÷ 3" }],
    generators: [G5.correspondenceRule, L.corSolveFor, L.corError],
  },
  {
    id: "solve",
    code: "[6수02-01]",
    topic: "대응 관계",
    title: "대응 관계를 나타낸 식 활용하기",
    conceptCards: [{ title: "식에 넣어 구하기", body: "대응 관계를 나타낸 식에 한 양을 넣으면 다른 양을 구할 수 있고, 거꾸로 생각하여 처음 양을 구할 수도 있습니다.", example: "△ = ○ × 2 + 1, △ = 15 → ○ = 7" }],
    generators: [L.corEval, L.corReverse2, L.corSticks, L.corTablesRev, L.corSaving],
  },
  {
    id: "life",
    code: "[6수02-01]",
    topic: "생활 속 대응 관계",
    title: "생활 속에서 대응 관계를 찾아 식으로 나타내기",
    conceptCards: [{ title: "생활 속 대응", body: "나이 차, 시각 차, 자른 횟수와 도막 수처럼 생활 속 두 양 사이의 대응 관계를 찾아 식으로 나타냅니다.", example: "(도막 수) = (자른 횟수) + 1" }],
    generators: [L.corAge, L.corLifeExpr, L.corClock, L.corCut, L.corFee],
  },
]);

export const g5s1ReduceCommon = unit("g5-s1-reduce-common", 1, 4, "reduce-common", "약분과 통분", [
  {
    id: "equivalent",
    code: "[6수01-06]",
    topic: "크기가 같은 분수",
    title: "크기가 같은 분수 만들기",
    conceptCards: [{ title: "같은 수를 곱하거나 나누기", body: "분모와 분자에 0이 아닌 같은 수를 곱하거나, 분모와 분자를 0이 아닌 같은 수로 나누면 크기가 같은 분수가 됩니다.", example: "2/3 = 4/6 = 6/9" }],
    generators: [L.eqMake, L.eqDiff, L.eqCount, L.eqSum, L.eqAdd],
  },
  {
    id: "reduce",
    code: "[6수01-06]",
    topic: "약분과 통분",
    title: "약분",
    conceptCards: [{ title: "기약분수", body: "분모와 분자를 공약수로 나누는 것을 약분이라 하고, 분모와 분자의 공약수가 1뿐인 분수를 기약분수라고 합니다.", example: "12/18 = 2/3" }],
    generators: [G5.reduceFraction, L.redIrrCount, L.redBefore],
  },
  {
    id: "common",
    code: "[6수01-06]",
    topic: "약분과 통분",
    title: "통분",
    conceptCards: [{ title: "통분", body: "분모를 같게 하는 것을 통분이라 하고, 통분한 분모를 공통분모라고 합니다. 두 분모의 최소공배수를 공통분모로 하면 간단합니다.", example: "(1/4, 1/6) → (3/12, 2/12)" }],
    generators: [G5.commonDenominator, L.comPair, L.comNotCommon, L.comBetween],
  },
  {
    id: "compare",
    code: "[6수01-07]",
    topic: "분수의 크기 비교",
    title: "분수의 크기 비교",
    conceptCards: [{ title: "통분하여 비교", body: "분모가 다른 분수는 통분하여 분자의 크기를 비교합니다. 분자가 같으면 분모가 작을수록 큽니다.", example: "3/4 > 2/3 (9/12 > 8/12)" }],
    generators: [L.cmpUnit, G5.compareUnlike, L.cmpLargest, L.cmpBox, L.cmpMost],
  },
  {
    id: "frac-dec",
    code: "[6수01-12]",
    topic: "분수의 크기 비교",
    title: "분수와 소수의 크기 비교",
    conceptCards: [{ title: "같은 형태로 바꾸기", body: "분모를 10, 100으로 고쳐 분수를 소수로 바꾸거나, 소수를 분수로 바꾸어 크기를 비교합니다.", example: "3/5 = 6/10 = 0.6" }],
    generators: [L.fdConvert, L.fdCompare, L.fdLargest, L.fdBox, L.fdCards],
  },
]);

export const g5s1FracAddSub = unit("g5-s1-frac-add-sub", 1, 5, "frac-add-sub", "분수의 덧셈과 뺄셈", [
  {
    id: "proper-add",
    code: "[6수01-08]",
    topic: "분수의 덧셈",
    title: "진분수의 덧셈",
    conceptCards: [{ title: "통분 후 계산", body: "분모가 다른 진분수의 덧셈은 통분한 뒤 분자끼리 더하고, 결과를 약분합니다. 가분수가 되면 대분수로 나타냅니다.", example: "1/2 + 2/3 = 3/6 + 4/6 = 1 1/6" }],
    generators: [G5.unlikeAdd, L.faMissing, L.faExtreme, L.faWrong, L.faThree],
  },
  {
    id: "mixed",
    code: "[6수01-08]",
    topic: "분수의 덧셈",
    title: "대분수의 덧셈",
    conceptCards: [{ title: "대분수의 덧셈", body: "자연수끼리, 분수끼리 더하거나 대분수를 가분수로 바꾸어 더합니다.", example: "1 1/2 + 2 1/3 = 3 5/6" }],
    generators: [G5.unlikeAddMixed, L.fmaMissing, L.fmaExtreme, L.fmaCards],
  },
  {
    id: "proper-sub",
    code: "[6수01-08]",
    topic: "분수의 뺄셈",
    title: "진분수의 뺄셈",
    conceptCards: [{ title: "통분 후 계산", body: "분모가 다른 진분수의 뺄셈은 통분한 뒤 분자끼리 빼고, 결과를 약분합니다.", example: "3/4 − 1/6 = 9/12 − 2/12 = 7/12" }],
    generators: [G5.unlikeSub, L.fsMissing, L.fsRange, L.fsRemain, L.fsError, L.ex("g5-s1-frac-add-sub", "proper", "m5-three-terms"), L.ex("g5-s1-frac-add-sub", "proper", "w5-juice-mix"), L.cmpWho],
  },
  {
    id: "mixed-sub",
    code: "[6수01-08]",
    topic: "분수의 뺄셈",
    title: "대분수의 뺄셈",
    conceptCards: [{ title: "받아내림", body: "분수끼리 뺄 수 없으면 자연수에서 1을 받아내려 가분수로 만들어 계산하거나, 대분수를 가분수로 바꾸어 계산합니다.", example: "3 1/4 − 1 1/2 = 2 5/4 − 1 2/4 = 1 3/4" }],
    generators: [L.fmsEasy, G5.unlikeSubMixed, L.fmsMissing, L.fmsWrong, L.fmsCompare],
  },
]);

const PA = "g5-s1-perimeter-area";
export const g5s1PerimeterArea = unit(PA, 1, 6, "perimeter-area", "다각형의 둘레와 넓이", [
  {
    id: "perimeter",
    code: "[6수03-11]",
    topic: "둘레",
    title: "정다각형과 사각형의 둘레",
    conceptCards: [
      { title: "둘레", body: "도형을 한 바퀴 둘러싼 모든 변의 길이의 합입니다." },
      { title: "둘레 공식", body: "정다각형 (한 변) × (변의 수), 직사각형·평행사변형 ((가로) + (세로)) × 2, 마름모 (한 변) × 4" },
    ],
    generators: [AR.perimeterCalc, AR.perMissing, AR.squareSide, AR.perJoined, AR.perStep],
  },
  {
    id: "rect-area",
    code: "[6수03-13]",
    topic: "넓이",
    title: "직사각형과 정사각형의 넓이",
    conceptCards: [
      { title: "1 cm²", body: "한 변이 1 cm인 정사각형의 넓이를 1 cm²라고 씁니다." },
      { title: "넓이 공식", body: "(직사각형의 넓이) = (가로) × (세로), (정사각형의 넓이) = (한 변) × (한 변)" },
    ],
    generators: [AR.arRect, L.arSqFromPerim, AR.rectReverse, L.arLShape, L.arMax, AR.rectFromPerimeter],
  },
  {
    id: "area-unit",
    code: "[6수03-12]",
    topic: "넓이",
    title: "1 cm²보다 더 큰 넓이의 단위",
    conceptCards: [{ title: "m²와 km²", body: "한 변이 1 m인 정사각형의 넓이는 1 m², 한 변이 1 km인 정사각형의 넓이는 1 km²입니다.", example: "1 m² = 10000 cm², 1 km² = 1000000 m²" }],
    generators: [AR.auRect, L.auConvert, L.auCompare, AR.auMixed, AR.auTiles, AR.auFarm],
  },
  {
    id: "parallelogram",
    code: "[6수03-14]",
    topic: "넓이",
    title: "평행사변형의 넓이",
    conceptCards: [{ title: "밑변과 높이", body: "(평행사변형의 넓이) = (밑변) × (높이). 밑변과 높이가 같으면 모양이 달라도 넓이가 같습니다." }],
    generators: [AR.arPara, AR.arParaHeight, AR.arParaSame, AR.arRoad, AR.areaToHeight],
  },
  {
    id: "triangle",
    code: "[6수03-14]",
    topic: "넓이",
    title: "삼각형의 넓이",
    conceptCards: [{ title: "평행사변형의 반", body: "(삼각형의 넓이) = (밑변) × (높이) ÷ 2. 어느 변을 밑변으로 해도 넓이는 같습니다." }],
    generators: [AR.arTri, AR.arTriBase, AR.arTriPick, AR.arTriOther, L.arTriPara],
  },
  {
    id: "rhombus-trapezoid",
    code: "[6수03-14]",
    topic: "넓이",
    title: "마름모와 사다리꼴의 넓이",
    conceptCards: [
      { title: "마름모", body: "(마름모의 넓이) = (한 대각선) × (다른 대각선) ÷ 2" },
      { title: "사다리꼴", body: "(사다리꼴의 넓이) = ((윗변) + (아랫변)) × (높이) ÷ 2" },
    ],
    generators: [AR.arRT, AR.arRhomDiag, AR.arTrapHeight, AR.arTrapTop, AR.arRhomRect],
  },
]);

/* ── 5-2 ── */

const RR = "g5-s2-range-rounding";
export const g5s2RangeRounding = unit(RR, 2, 1, "range-rounding", "수의 범위와 어림하기", [
  {
    id: "above-below",
    code: "[6수01-02]",
    topic: "수의 범위",
    title: "이상과 이하",
    conceptCards: [{ title: "이상·이하", body: "10, 11, 12처럼 10과 같거나 큰 수를 10 이상인 수, 10과 같거나 작은 수를 10 이하인 수라고 합니다. 이상·이하는 그 수를 포함합니다." }],
    generators: [M.abList, M.abCount, M.abNotIn, M.abCond, M.abCards],
  },
  {
    id: "over-under",
    code: "[6수01-02]",
    topic: "수의 범위",
    title: "초과와 미만",
    conceptCards: [{ title: "초과·미만", body: "10보다 큰 수를 10 초과인 수, 10보다 작은 수를 10 미만인 수라고 합니다. 초과·미만은 그 수를 포함하지 않습니다. 수직선에서 포함하면 ●, 포함하지 않으면 ○로 나타냅니다." }],
    generators: [M.ouList, M.ouCount, M.ouLine, M.ouOverlap, M.ouFee],
  },
  {
    id: "range",
    code: "[6수01-02]",
    topic: "수의 범위",
    title: "수의 범위를 활용하여 문제 해결하기",
    conceptCards: [{ title: "범위 활용", body: "요금표, 등급표처럼 수의 범위로 나눈 표에서 경계의 수가 어느 범위에 들어가는지 주의하여 찾습니다." }],
    generators: [G5.rangeCount, M.rgTable, M.rgParcel],
  },
  {
    id: "up-down",
    code: "[6수01-03]",
    topic: "어림하기",
    title: "올림과 버림",
    conceptCards: [{ title: "올림·버림", body: "구하려는 자리 아래 수를 올려서 나타내는 방법을 올림, 버려서 나타내는 방법을 버림이라고 합니다.", example: "3462 → 올림하여 백의 자리까지 3500, 버림하여 3400" }],
    generators: [M.rdUD, M.rdCoins, M.rdSame, L.ex(RR, "round", "w5-buses-needed"), M.rdUDRange],
  },
  {
    id: "half",
    code: "[6수01-03]",
    topic: "어림하기",
    title: "반올림",
    conceptCards: [{ title: "반올림", body: "구하려는 자리 바로 아래 자리의 숫자가 0, 1, 2, 3, 4이면 버리고, 5, 6, 7, 8, 9이면 올립니다.", example: "3462 → 반올림하여 백의 자리까지 3500" }],
    generators: [M.rdHalf, L.ex(RR, "round", "m5-round-smallest"), M.rdHalfOdd, M.rdHalfMul, M.rdHalfCards],
  },
  {
    id: "rounding-use",
    code: "[6수01-03]",
    topic: "어림하기",
    title: "올림, 버림, 반올림을 활용하여 문제 해결하기",
    conceptCards: [{ title: "알맞은 어림 방법", body: "모자라면 안 될 때는 올림, 채우지 못한 것을 셀 수 없을 때는 버림, 가까운 값으로 나타낼 때는 반올림을 사용합니다." }],
    generators: [G5.rounding, M.rdDiff, M.rdEst, M.rdBoxes, M.rdWho],
  },
]);

const FM = "g5-s2-frac-mul";
export const g5s2FracMul = unit(FM, 2, 2, "frac-mul", "분수의 곱셈", [
  {
    id: "frac-whole",
    code: "[6수01-09]",
    topic: "(분수)×(자연수)",
    title: "(진분수)×(자연수)",
    conceptCards: [{ title: "분자에 곱하기", body: "분자와 자연수를 곱하고 분모는 그대로 둡니다. 약분할 수 있으면 약분합니다.", example: "2/9 × 3 = 6/9 = 2/3" }],
    generators: [G5.fracTimesWhole, M.fwMissing, M.fwCmp, L.ex(FM, "times-whole", "w5-sugar-people"), M.fwTime],
  },
  {
    id: "mixed-whole",
    code: "[6수01-09]",
    topic: "(분수)×(자연수)",
    title: "(대분수)×(자연수)",
    conceptCards: [{ title: "대분수의 곱셈", body: "대분수를 가분수로 바꾸어 곱하거나, 자연수 부분과 분수 부분에 각각 곱하여 더합니다.", example: "1 1/3 × 2 = 4/3 × 2 = 2 2/3" }],
    generators: [M.mwCalc, M.mwExtreme, M.mwCmp, M.mwPerim, M.mwError],
  },
  {
    id: "whole-frac",
    code: "[6수01-09]",
    topic: "(자연수)×(분수)",
    title: "(자연수)×(분수)",
    conceptCards: [
      { title: "자연수의 몇 분의 몇", body: "자연수를 분모로 나눈 뒤 분자를 곱합니다.", example: "12 × 3/4 = 9" },
      { title: "곱의 크기", body: "1보다 작은 분수를 곱하면 처음 수보다 작아지고, 1보다 큰 분수를 곱하면 커집니다." },
    ],
    generators: [M.wfPart, L.ex(FM, "times-whole", "m5-whole-times-frac"), M.wfCmp, M.wfRemain, M.wfWho],
  },
  {
    id: "times-frac",
    code: "[6수01-09]",
    topic: "(분수)×(분수)",
    title: "(진분수)×(진분수)",
    conceptCards: [{ title: "분자끼리, 분모끼리", body: "분자는 분자끼리, 분모는 분모끼리 곱합니다. 단위분수끼리의 곱은 분모끼리 곱합니다.", example: "2/3 × 3/4 = 6/12 = 1/2" }],
    generators: [M.ffCalc, M.ffBox, M.ffCards, FP.fracAreaModel],
  },
  {
    id: "various",
    code: "[6수01-09]",
    topic: "(분수)×(분수)",
    title: "여러 가지 분수의 곱셈",
    conceptCards: [{ title: "가분수로 바꾸기", body: "대분수가 있으면 가분수로 바꾼 뒤 분자끼리, 분모끼리 곱합니다. 세 분수의 곱도 같은 방법으로 계산합니다.", example: "1 1/2 × 1 1/3 = 3/2 × 4/3 = 2" }],
    generators: [M.mmCalc, G5.fracTimesFrac, M.threeMul, M.fmArea, M.fmRange],
  },
]);

export const g5s2Congruence = unit("g5-s2-congruence", 2, 3, "congruence", "합동과 대칭", [
  {
    id: "congruent-shape",
    code: "[6수03-01]",
    topic: "합동",
    title: "도형의 합동",
    conceptCards: [{ title: "합동", body: "모양과 크기가 같아 포개었을 때 완전히 겹치는 두 도형을 서로 합동이라고 합니다." }],
    generators: [CG.cgFind, M.cgPairs, CG.cgCut, CG.cgGlue, CG.cgTriInRect, M.cgIso],
  },
  {
    id: "congruent",
    code: "[6수03-01]",
    topic: "합동",
    title: "합동인 도형의 성질",
    conceptCards: [{ title: "대응", body: "합동인 두 도형에서 겹치는 점, 변, 각을 대응점, 대응변, 대응각이라고 합니다. 대응변의 길이와 대응각의 크기는 각각 같습니다." }],
    generators: [CG.congruentSide, CG.cgQuadSide, CG.congruentAngle, CG.cgQuadAngle, CG.congruentPerimeter],
  },
  {
    id: "congruent-draw",
    code: "[6수03-01]",
    topic: "합동",
    title: "모눈종이에 합동인 도형 그리기",
    conceptCards: [{ title: "대응변을 같게", body: "합동인 도형을 그릴 때는 대응변의 길이와 대응각의 크기가 같도록 모눈의 칸 수를 세어 꼭짓점을 찍습니다. 돌리거나 뒤집어 그려도 합동입니다." }],
    generators: [CG.cgdVertex, CG.cgdTurn, CG.cgdWrong, CG.cgdCount, CG.cgdJoin],
  },
  {
    id: "line-symmetry",
    code: "[6수03-02]",
    topic: "대칭",
    title: "선대칭도형과 그 성질",
    conceptCards: [{ title: "선대칭도형", body: "한 직선을 따라 접었을 때 완전히 겹치는 도형입니다. 그 직선을 대칭축이라 하고, 대칭축은 대응점을 이은 선분을 수직으로 똑같이 둘로 나눕니다." }],
    generators: [SY.symLinePick, SY.symAxis, SY.symLineSide, M.symLinePerim, SY.symLineAngle],
  },
  {
    id: "symmetry",
    code: "[6수03-02]",
    topic: "대칭",
    title: "점대칭도형과 그 성질",
    conceptCards: [{ title: "점대칭도형", body: "한 점을 중심으로 180° 돌렸을 때 처음 도형과 완전히 겹치는 도형입니다. 대칭의 중심은 대응점을 이은 선분을 똑같이 둘로 나눕니다." }],
    generators: [SY.pointSymPick, SY.symCenter, SY.symPointAngle, M.symBoth, SY.pointSymDiag],
  },
]);

const DM = "g5-s2-dec-mul";
export const g5s2DecMul = unit(DM, 2, 4, "dec-mul", "소수의 곱셈", [
  {
    id: "dec-times-whole",
    code: "[6수01-13]",
    topic: "(소수)×(자연수), (자연수)×(소수)",
    title: "(소수)×(자연수)",
    conceptCards: [{ title: "소수점 찍기", body: "자연수처럼 곱한 뒤 곱하는 소수의 소수점 아래 자리 수만큼 소수점을 찍습니다.", example: "0.35 × 4 = 1.4" }],
    generators: [G5.decTimesWhole, M.dwAdd, M.dwCmp, L.ex(DM, "dec-whole", "w5-juice-bottles"), M.dwWho],
  },
  {
    id: "whole-times-dec",
    code: "[6수01-13]",
    topic: "(소수)×(자연수), (자연수)×(소수)",
    title: "(자연수)×(소수)",
    conceptCards: [{ title: "곱의 크기", body: "자연수처럼 곱한 뒤 소수점을 찍습니다. 1보다 작은 소수를 곱하면 처음 수보다 작아집니다.", example: "6 × 0.7 = 4.2" }],
    generators: [M.wdCalc, L.ex(DM, "dec-whole", "m5-whole-times-dec"), M.wdMissing, M.wdPrice, M.wdWrong],
  },
  {
    id: "dec-dec",
    code: "[6수01-13]",
    topic: "(소수)×(소수)",
    title: "(소수)×(소수)",
    conceptCards: [{ title: "자리 수 더하기", body: "곱의 소수점 아래 자리 수는 곱하는 두 소수의 소수점 아래 자리 수의 합입니다.", example: "1.2 × 0.3 = 0.36" }],
    generators: [G5.decTimesDec, M.ddExtreme, M.ddArea, FP.decGridMul],
  },
  {
    id: "point-position",
    code: "[6수01-13]",
    topic: "(소수)×(소수)",
    title: "곱의 소수점 위치",
    conceptCards: [{ title: "10, 100, 1000과 0.1, 0.01, 0.001", body: "10, 100, 1000을 곱하면 소수점이 오른쪽으로 한 칸, 두 칸, 세 칸 옮겨지고, 0.1, 0.01, 0.001을 곱하면 왼쪽으로 옮겨집니다.", example: "2.35 × 100 = 235, 235 × 0.01 = 2.35" }],
    generators: [M.posEasy, M.posGiven, M.posBox, M.posCards, M.posError],
  },
]);

const CBU = "g5-s2-cuboid";
export const g5s2Cuboid = unit(CBU, 2, 5, "cuboid", "직육면체", [
  {
    id: "cuboid-cube",
    code: "[6수03-03]",
    topic: "직육면체와 정육면체",
    title: "직육면체와 정육면체",
    conceptCards: [{ title: "면, 모서리, 꼭짓점", body: "직사각형 6개로 둘러싸인 도형을 직육면체, 정사각형 6개로 둘러싸인 도형을 정육면체라고 합니다. 면 6개, 모서리 12개, 꼭짓점 8개입니다." }],
    generators: [CB.cuboidFacts, M.cbTrue, M.cbCountSum, CB.cubeFaceEdges, CB.cbWire],
  },
  {
    id: "property",
    code: "[6수03-03]",
    topic: "직육면체와 정육면체",
    title: "직육면체의 성질",
    conceptCards: [{ title: "평행과 수직", body: "마주 보는 두 면은 서로 평행하고(3쌍), 한 면과 만나는 면은 그 면과 수직입니다(4개)." }],
    generators: [CB.cbProp, M.cbParArea, M.cbPerpEdges, CB.cbPerpFaces, M.cbDice],
  },
  {
    id: "sketch",
    code: "[6수03-04]",
    topic: "겨냥도와 전개도",
    title: "직육면체의 겨냥도",
    conceptCards: [{ title: "겨냥도", body: "직육면체 모양을 잘 알 수 있도록 보이는 모서리는 실선으로, 보이지 않는 모서리는 점선으로 그린 그림입니다. 보이는 모서리 9개, 보이지 않는 모서리 3개입니다." }],
    generators: [M.cbSketch, CB.visibleParts, M.cbHiddenLen, M.cbVisibleLen, M.cbHiddenRev],
  },
  {
    id: "cube-net",
    code: "[6수03-04]",
    topic: "겨냥도와 전개도",
    title: "정육면체의 전개도",
    conceptCards: [{ title: "전개도", body: "정육면체의 모서리를 잘라서 펼친 그림입니다. 접었을 때 마주 보는 면은 평행하고, 한 줄로 이어진 네 면에서는 한 칸 건너뛴 면끼리 마주 봅니다." }],
    generators: [M.netOpp, M.netDice, CB.netNot, M.netPerim, M.netPerpSum, M.netArea],
  },
  {
    id: "cuboid-net",
    code: "[6수03-04]",
    topic: "겨냥도와 전개도",
    title: "직육면체의 전개도",
    conceptCards: [{ title: "같은 길이 4개씩", body: "직육면체의 전개도에는 합동인 면이 3쌍 있고, 접었을 때 만나는 선분의 길이가 같습니다. 모서리는 길이가 같은 것이 4개씩 3종류입니다." }],
    generators: [CB.cnetBlank, CB.cuboidEdges, M.cbCubeEqual, L.ex(CBU, "edges", "w5-cuboid-height"), CB.cbRibbon],
  },
]);

export const g5s2Average = unit("g5-s2-average", 2, 6, "average", "평균과 가능성", [
  {
    id: "mean",
    code: "[6수04-01]",
    topic: "평균",
    title: "평균 알아보기와 구하기",
    conceptCards: [{ title: "평균", body: "자료의 값을 모두 더하여 자료의 수로 나눈 값을 그 자료의 평균이라고 합니다.", example: "(3 + 5 + 7) ÷ 3 = 5" }],
    generators: [M.avBars, M.avTable, M.avGroups, M.needScore],
  },
  {
    id: "mean-use",
    code: "[6수04-01]",
    topic: "평균",
    title: "평균을 이용하여 문제 해결하기",
    conceptCards: [{ title: "평균 × 자료의 수", body: "(자료의 값의 합) = (평균) × (자료의 수)를 이용하면 모르는 값을 구할 수 있습니다." }],
    generators: [M.avPerDay, M.avMissing, M.avJoin, M.avAbove, M.avMerge],
  },
  {
    id: "chance-words",
    code: "[6수04-04]",
    topic: "가능성",
    title: "일이 일어날 가능성을 말로 표현하기",
    conceptCards: [{ title: "가능성의 정도", body: "일이 일어날 가능성을 불가능하다, ~아닐 것 같다, 반반이다, ~일 것 같다, 확실하다로 표현할 수 있습니다." }],
    generators: [M.chWord, M.chMost, M.chLeast, M.chCards, M.chMakeHalf],
  },
  {
    id: "chance",
    code: "[6수04-05]",
    topic: "가능성",
    title: "일이 일어날 가능성을 수로 표현하기",
    conceptCards: [{ title: "수로 나타내기", body: "불가능하다는 0, 반반이다는 1/2, 확실하다는 1로 나타냅니다." }],
    generators: [G5.chance, M.chDice, M.chOrder],
  },
]);
