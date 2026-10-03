import type { Unit } from "../types";
import * as G4 from "../generators/grade4";
import * as L from "../lessons/g4";
import * as C from "../lessons/g4-calc";
import * as LD from "../lessons/longdiv";
import * as S2 from "../lessons/g4-s2";
import * as FP from "../lessons/g4-frac-pics";
import * as AN from "../lessons/g4-angles";

/**
 * 4학년 계산 단원. 단원 목록은 원문 확인 전, 성취기준 코드는 docs/audit-v2 보고서의 코드 표(docs/USER-TODO.md 3번).
 * 차시는 교과서(천재교육 계열) 흐름을 따른다.
 */

const { ex } = L;

const BIG = "g4-s1-big-numbers";
const ANG = "g4-s1-angles";
const MD = "g4-s1-mul-div";
const PAT = "g4-s1-patterns";
const FR = "g4-s2-fraction-add-sub";
const DEC = "g4-s2-decimal-add-sub";

export const g4s1BigNumbers: Unit = {
  id: BIG,
  grade: 4,
  semester: 1,
  number: 1,
  slug: "big-numbers",
  title: "큰 수",
  standards: [
    {
      id: "man",
      code: "[4수01-01]",
      topic: "만과 다섯 자리 수",
      title: "10000과 다섯 자리 수",
      conceptCards: [
        { title: "만", body: "1000이 10개이면 10000이고, 만 또는 일만이라고 읽습니다.", example: "9000보다 1000 큰 수 = 10000" },
        { title: "다섯 자리 수", body: "10000이 3개, 1000이 5개, 100이 2개, 10이 7개, 1이 4개이면 35274이고, 삼만 오천이백칠십사라고 읽습니다." },
      ],
      generators: [G4.bigCompose, L.l4ManMake, L.l4ManBills, L.l4Read5, L.l4ManNeed, L.l4ManCond],
    },
    {
      id: "sipman",
      code: "[4수01-01]",
      topic: "만과 다섯 자리 수",
      title: "십만, 백만, 천만",
      conceptCards: [
        { title: "십만·백만·천만", body: "10000이 10개이면 십만, 100개이면 백만, 1000개이면 천만입니다.", example: "10000이 3500개 = 35000000" },
        { title: "자릿값", body: "같은 숫자라도 어느 자리에 있느냐에 따라 나타내는 값이 달라집니다.", example: "5700000에서 5는 5000000" },
      ],
      generators: [G4.bigPlaceValue, L.l4ManUnits, L.l4PlaceDigit, L.l4ReadBig, L.l4CheckBills, L.l4PlaceTimes],
    },
    {
      id: "eok",
      code: "[4수01-01]",
      topic: "억과 조",
      title: "억 알아보기",
      conceptCards: [
        { title: "억", body: "1000만이 10개이면 1억이고, 1억은 100000000입니다. 일의 자리부터 네 자리씩 끊어 읽어요.", example: "3억 2500만 = 325000000" },
      ],
      generators: [L.l4EokUnits, G4.bigEok, L.l4EokZeros, ex(BIG, "big-read", "w4-eok-skip"), L.l4EokWrongWrite],
    },
    {
      id: "jo",
      code: "[4수01-01]",
      topic: "억과 조",
      title: "조 알아보기",
      conceptCards: [
        { title: "조", body: "1000억이 10개이면 1조이고, 1조는 1 뒤에 0이 12개입니다.", example: "4조 250억 = 4025000000000" },
      ],
      generators: [L.l4JoUnits, L.l4JoPlace, L.l4JoDigits, L.l4JoYears, L.l4JoTimesBack],
    },
    {
      id: "skip",
      code: "[4수01-02]",
      topic: "뛰어 세기와 크기 비교",
      title: "뛰어 세기",
      conceptCards: [{ title: "뛰어 세기", body: "10000씩 뛰어 세면 만의 자리 숫자가, 1억씩 뛰어 세면 억의 자리 숫자가 1씩 커집니다.", example: "35000, 45000, 55000" }],
      generators: [L.l4SkipRule, G4.bigSkipCount, L.l4SkipMissing, ex(BIG, "big-count", "w4-savings"), L.l4SkipBack],
    },
    {
      id: "compare",
      code: "[4수01-02]",
      topic: "뛰어 세기와 크기 비교",
      title: "수의 크기 비교",
      conceptCards: [{ title: "크기 비교", body: "자리 수가 많은 수가 더 큽니다. 자리 수가 같으면 가장 높은 자리부터 차례로 비교합니다.", example: "5863000 < 5870000" }],
      generators: [G4.bigCompare, L.l4CompareSort, L.l4CompareMixed, L.l4CompareBox, L.l4CardsBig],
    },
  ],
};

export const g4s1Angles: Unit = {
  id: ANG,
  grade: 4,
  semester: 1,
  number: 2,
  slug: "angles",
  title: "각도",
  standards: [
    {
      id: "measure",
      code: "[4수03-24]",
      topic: "각의 크기",
      title: "각의 크기 비교하고 재기",
      conceptCards: [
        { title: "각도", body: "각의 크기를 각도라고 합니다. 직각을 똑같이 90으로 나눈 하나를 1도(1°)라 하고, 직각은 90°입니다." },
        { title: "각도기로 재기", body: "각도기의 중심을 꼭짓점에, 밑금을 한 변에 맞추고 다른 변이 닿는 눈금을 읽습니다.", example: "시계의 숫자 한 칸 사이의 각 = 30°" },
      ],
      generators: [AN.l4AngleRead, AN.l4ClockAngle, L.l4AngleBiggest, AN.l4ClockTwoTimes, AN.l4AnglePieces],
    },
    {
      id: "acute-obtuse",
      code: "[4수03-02]",
      topic: "각의 크기",
      title: "예각과 둔각",
      conceptCards: [{ title: "예각과 둔각", body: "0°보다 크고 직각보다 작은 각은 예각, 직각보다 크고 180°보다 작은 각은 둔각입니다.", example: "45°는 예각, 120°는 둔각" }],
      generators: [AN.l4AcuteCount, L.l4ClockKind, AN.l4AnglePickKind, AN.l4AngleRayCount, L.l4AngleWho],
    },
    {
      id: "add-sub",
      code: "[4수03-24]",
      topic: "각도의 합과 차",
      title: "각도의 합과 차",
      conceptCards: [{ title: "각도 계산", body: "각도의 합과 차는 자연수의 덧셈·뺄셈과 같이 계산하고 단위 °를 붙입니다.", example: "65° + 40° = 105°" }],
      generators: [AN.angleSumDiff, AN.m4AngleMissing, L.l4AngleCompareCalc, AN.w4StraightAngle, L.l4AngleWrongOp],
    },
    {
      id: "triangle",
      code: "[4수03-25]",
      topic: "도형의 각",
      title: "삼각형의 세 각의 크기의 합",
      conceptCards: [{ title: "삼각형", body: "삼각형의 세 각을 잘라 한 점에 모으면 직선이 되므로 세 각의 크기의 합은 180°입니다.", example: "50° + 60° + 70° = 180°" }],
      generators: [AN.angleTriangle, AN.l4TriExterior, L.l4TriPossible, AN.l4SetSquares, L.l4TriCondition],
    },
    {
      id: "quad",
      code: "[4수03-25]",
      topic: "도형의 각",
      title: "사각형의 네 각의 크기의 합",
      conceptCards: [{ title: "사각형", body: "사각형은 삼각형 2개로 나눌 수 있으므로 네 각의 크기의 합은 180° × 2 = 360°입니다." }],
      generators: [AN.l4QuadEasy, AN.angleQuad, AN.l4PolyAngleSum, ex(ANG, "angle-shape", "w4-quad-right"), L.l4QuadErrorWhy],
    },
  ],
};

export const g4s1MulDiv: Unit = {
  id: MD,
  grade: 4,
  semester: 1,
  number: 3,
  slug: "mul-div",
  title: "곱셈과 나눗셈",
  standards: [
    {
      id: "mul-tens",
      code: "[4수01-04]",
      topic: "곱셈",
      title: "(세 자리 수)×(몇십)",
      conceptCards: [{ title: "(몇백)×(몇십), (세 자리 수)×(몇십)", body: "300 × 40은 3 × 4 = 12에 0을 세 개 붙입니다. 236 × 40은 236 × 4에 0을 하나 붙입니다.", example: "236 × 40 = 9440" }],
      generators: [G4.mulHundredsTens, C.l4Mul3Tens, C.l4MulTensBox, C.l4MulTensFix, C.l4MulTensLife, C.l4CardsMulTens],
    },
    {
      id: "mul-3x2d",
      code: "[4수01-04]",
      topic: "곱셈",
      title: "(세 자리 수)×(두 자리 수)",
      conceptCards: [{ title: "나누어 곱하기", body: "236 × 45는 236 × 5와 236 × 40을 따로 구해 더합니다. 십의 자리를 곱한 값은 한 자리 왼쪽에 씁니다.", example: "1180 + 9440 = 10620" }],
      generators: [C.l4Mul3x2Easy, G4.mul3x2, C.l4MulCompare, ex(MD, "mul-3x2", "w4-notebook-change"), C.l4MulWrongOp],
    },
    {
      id: "div-tens",
      code: "[4수01-07]",
      topic: "나눗셈",
      title: "(세 자리 수)÷(몇십)",
      conceptCards: [{ title: "몇십으로 나누기", body: "250 ÷ 30은 30 × 8 = 240이므로 몫은 8, 나머지는 10입니다. 나머지는 나누는 수보다 작아야 합니다.", example: "30 × 8 = 240, 240 + 10 = 250" }],
      generators: [G4.divByTens, C.l4DivTensCheck, C.l4DivTensLife, C.l4DivRemMax, C.l4DivBusCount],
    },
    {
      id: "div-2d",
      code: "[4수01-07]",
      topic: "나눗셈",
      title: "(두 자리 수)÷(두 자리 수)",
      conceptCards: [{ title: "몫 어림하기", body: "나누는 수를 몇십으로 어림해 몫을 짐작하고, 곱해서 확인합니다.", example: "85 ÷ 21 → 20 × 4 = 80 → 몫 4, 나머지 1" }],
      generators: [C.l4Div2x2Easy, G4.div2x2, C.l4DivBox, ex(MD, "div-2digit", "w4-candy-pack"), C.l4DivWrongOp],
    },
    {
      id: "div-3d-one",
      code: "[4수01-07]",
      topic: "나눗셈",
      title: "몫이 한 자리 수인 (세 자리 수)÷(두 자리 수)",
      conceptCards: [{ title: "몫이 한 자리 수", body: "나누어지는 수의 앞 두 자리가 나누는 수보다 작으면 몫은 한 자리 수입니다. 나머지가 나누는 수보다 크면 몫을 1 크게 합니다.", example: "245 ÷ 32 = 7 … 21" }],
      generators: [C.l4Div3x2One, LD.l4LongDivOne, C.l4DivFix, C.l4DivCompare, C.l4DivOneDigitMin, C.l4DivShortage],
    },
    {
      id: "div-3d-two",
      code: "[4수01-07]",
      topic: "나눗셈",
      title: "몫이 두 자리 수인 (세 자리 수)÷(두 자리 수)",
      conceptCards: [{ title: "몫이 두 자리 수", body: "앞 두 자리를 먼저 나누어 몫의 십의 자리를 구하고, 남은 수와 일의 자리를 합하여 다시 나눕니다.", example: "745 ÷ 23 = 32 … 9" }],
      generators: [C.l4Div3x2Two, G4.div3x2, LD.l4LongDivTwo, C.l4DivBoxDivisor, C.l4CardsDiv, C.l4DivError],
    },
    {
      id: "estimate",
      code: "[4수01-08]",
      topic: "어림셈",
      title: "곱셈과 나눗셈의 어림셈",
      conceptCards: [
        { title: "곱 어림하기", body: "곱해지는 수는 가장 가까운 몇백으로, 곱하는 수는 가장 가까운 몇십으로 어림하여 곱을 구합니다.", example: "498 × 31 → 약 500 × 30 = 15000" },
        { title: "몫 어림하기", body: "나누어지는 수는 가장 가까운 몇백으로, 나누는 수는 가장 가까운 몇십으로 어림하여 몫을 구합니다. 어림한 값으로 계산 결과가 알맞은지 확인할 수 있습니다.", example: "812 ÷ 39 → 약 800 ÷ 40 = 20" },
      ],
      generators: [C.l4EstMul, C.l4EstDiv, C.l4EstCheck, C.l4EstSituation, C.l4EstDiff, C.l4EstBudget],
    },
  ],
};

export const g4s1Patterns: Unit = {
  id: PAT,
  grade: 4,
  semester: 1,
  number: 6,
  slug: "patterns",
  title: "규칙 찾기",
  standards: [
    {
      id: "number-seq",
      code: "[4수02-01]",
      topic: "수의 규칙",
      title: "수의 배열에서 규칙 찾기",
      conceptCards: [
        { title: "더하는 규칙", body: "이웃한 수의 차가 같으면 일정하게 더하거나 빼는 규칙입니다.", example: "5, 9, 13, 17 → 4씩 커짐" },
        { title: "곱하는 규칙", body: "뒤의 수가 앞의 수의 몇 배로 일정하면 곱하는 규칙입니다.", example: "3, 6, 12, 24 → 2배씩" },
      ],
      generators: [G4.patternArith, G4.patternGeo, C.l4PatRuleChoice, C.l4PatNth, C.l4PatFirstOver],
    },
    {
      id: "number-table",
      code: "[4수02-01]",
      topic: "수의 규칙",
      title: "수 배열표에서 규칙 찾기",
      conceptCards: [{ title: "수 배열표", body: "가로(→), 세로(↓), 대각선(↘) 방향으로 수가 어떻게 변하는지 각각 찾습니다.", example: "→ 100씩, ↓ 1000씩 커짐" }],
      generators: [C.l4TableRule, C.l4TableCell, C.l4TableDiag, C.l4TableFar, C.l4TableSum],
    },
    {
      id: "shape-seq",
      code: "[4수02-01]",
      topic: "모양의 규칙",
      title: "모양의 배열에서 규칙 찾기",
      conceptCards: [{ title: "모양의 배열", body: "모양이 하나씩 늘어날 때 몇 개씩 늘어나는지 찾아 표로 정리하면 다음 모양의 개수를 알 수 있습니다.", example: "1, 4, 9, 16 → 1×1, 2×2, 3×3, 4×4" }],
      generators: [C.l4ShapeNext, C.l4ShapeTenth, C.l4ShapeTable, ex(PAT, "pattern-seq", "w4-match-squares"), C.l4ShapeReverse],
    },
    {
      id: "calc-seq",
      code: "[4수02-02]",
      topic: "계산식의 규칙",
      title: "계산식에서 규칙 찾기",
      conceptCards: [{ title: "계산식의 규칙", body: "더하거나 곱하는 수가 일정하게 변하면 계산 결과도 일정하게 변합니다.", example: "101 × 12 = 1212, 101 × 13 = 1313" }],
      generators: [C.l4CalcNext, G4.patternCalc, C.l4CalcMulPattern, ex(PAT, "pattern-calc", "w4-odd-sum"), C.l4CalcFindLine],
    },
    {
      id: "equal-sign",
      code: "[4수02-03]",
      topic: "계산식의 규칙",
      title: "등호(=)를 사용하여 나타내기",
      conceptCards: [{ title: "크기가 같은 두 양", body: "등호(=)는 양쪽의 크기가 같다는 뜻입니다. 한쪽 수가 커진 만큼 다른 수를 작게 하면 합이 같습니다.", example: "25 + 17 = 27 + 15" }],
      generators: [C.l4EqTrue, C.l4EqBox, C.l4EqMulBox, C.l4EqError, C.l4EqReason],
    },
  ],
};

export const g4s2FractionAddSub: Unit = {
  id: FR,
  grade: 4,
  semester: 2,
  number: 1,
  slug: "fraction-add-sub",
  title: "분수의 덧셈과 뺄셈",
  standards: [
    {
      id: "proper-add",
      code: "[4수01-15]",
      topic: "진분수의 덧셈과 뺄셈",
      title: "진분수의 덧셈",
      conceptCards: [{ title: "분자끼리 더하기", body: "분모가 같은 분수의 덧셈은 분모는 그대로 두고 분자끼리 더합니다. 결과가 가분수이면 대분수로 바꿉니다.", example: "5/7 + 4/7 = 9/7 = 1 2/7" }],
      generators: [G4.fracAddProper, ex(FR, "frac-proper", "m4-frac-num-missing"), S2.l4FracAddCount, ex(FR, "frac-proper", "w4-milk-frac"), S2.l4FracCardsAdd, FP.fracBarAdd, FP.fracLineAdd],
    },
    {
      id: "proper-sub",
      code: "[4수01-15]",
      topic: "진분수의 덧셈과 뺄셈",
      title: "진분수의 뺄셈",
      conceptCards: [{ title: "분자끼리 빼기", body: "분모가 같은 분수의 뺄셈은 분모는 그대로 두고 분자끼리 뺍니다. 1에서 빼려면 1을 분모와 분자가 같은 분수로 바꿉니다.", example: "1 − 3/8 = 8/8 − 3/8 = 5/8" }],
      generators: [G4.fracSubProper, S2.l4OneMinus, S2.l4FracSubBox, S2.l4FracWrongOp, S2.l4FracBoxCount, FP.fracBarSub],
    },
    {
      id: "mixed-add",
      code: "[4수01-15]",
      topic: "대분수의 덧셈과 뺄셈",
      title: "대분수의 덧셈",
      conceptCards: [{ title: "자연수끼리, 분수끼리", body: "대분수의 덧셈은 자연수끼리, 분수끼리 더합니다. 분수 부분이 가분수가 되면 자연수로 받아올립니다. 가분수로 바꾸어 더할 수도 있습니다.", example: "1 3/5 + 2 4/5 = 3 7/5 = 4 2/5" }],
      generators: [G4.fracAddMixed, S2.l4MixedImproper, S2.l4FracCompareSum, S2.l4MixedPerimeter, S2.l4MixedCards],
    },
    {
      id: "mixed-sub",
      code: "[4수01-15]",
      topic: "대분수의 덧셈과 뺄셈",
      title: "대분수의 뺄셈",
      conceptCards: [{ title: "자연수끼리, 분수끼리", body: "분수 부분끼리 뺄 수 있으면 자연수끼리, 분수끼리 뺍니다.", example: "3 5/8 − 1 2/8 = 2 3/8" }],
      generators: [S2.l4MixedSubEasy, S2.l4MixedSubBox, S2.l4MixedSubLife, ex(FR, "frac-mixed", "w4-rope-mixed"), S2.l4MixedWhoMore],
    },
    {
      id: "whole-sub",
      code: "[4수01-15]",
      topic: "대분수의 덧셈과 뺄셈",
      title: "(자연수)−(분수)",
      conceptCards: [{ title: "자연수에서 1 빌려 오기", body: "자연수에서 1만큼을 분모와 분자가 같은 분수로 바꾸어 뺍니다.", example: "3 − 1 2/5 = 2 5/5 − 1 2/5 = 1 3/5" }],
      generators: [S2.l4WholeMinus, S2.l4WholeToFrac, S2.l4WholeMinusBox, S2.l4WholeWrongOp, S2.l4WholePizza, FP.wholeBarSub],
    },
    {
      id: "borrow-sub",
      code: "[4수01-15]",
      topic: "대분수의 덧셈과 뺄셈",
      title: "받아내림이 있는 대분수의 뺄셈",
      conceptCards: [{ title: "받아내림", body: "분수 부분끼리 뺄 수 없으면 빼지는 수의 자연수에서 1을 받아내려 분수로 바꾼 뒤 계산합니다.", example: "4 2/7 − 1 5/7 = 3 9/7 − 1 5/7 = 2 4/7" }],
      generators: [S2.l4BorrowStep, G4.fracSubMixed, S2.l4BorrowFix, S2.l4BorrowBoxRange, S2.l4MixedBack],
    },
  ],
};

export const g4s2DecimalAddSub: Unit = {
  id: DEC,
  grade: 4,
  semester: 2,
  number: 3,
  slug: "decimal-add-sub",
  title: "소수의 덧셈과 뺄셈",
  standards: [
    {
      id: "dec-two",
      code: "[4수01-13]",
      topic: "소수 두 자리 수와 세 자리 수",
      title: "소수 두 자리 수",
      conceptCards: [{ title: "0.01", body: "1/100은 0.01이라 쓰고 영 점 영일이라고 읽습니다. 소수점 아래는 숫자만 차례로 읽습니다.", example: "5.08 → 오 점 영팔" }],
      generators: [S2.l4Dec2Read, S2.l4DecReadChoice, S2.l4Dec2Unit, S2.l4DecCond, ex(DEC, "dec-places", "w4-dec-compose"), FP.gridDecimal, FP.decLineHundredths],
    },
    {
      id: "dec-three",
      code: "[4수01-13]",
      topic: "소수 두 자리 수와 세 자리 수",
      title: "소수 세 자리 수",
      conceptCards: [{ title: "0.001", body: "1/1000은 0.001이라 쓰고 영 점 영영일이라고 읽습니다. 0.001이 1000개이면 1입니다.", example: "1 km 250 m = 1.25 km" }],
      generators: [G4.dec2Compose, G4.decPlaceValue, ex(DEC, "dec-places", "m4-dec-plus-step"), S2.l4Dec3Unit, S2.l4Dec3Cards, S2.l4DecWalk, FP.decLineThousandths],
    },
    {
      id: "dec-compare",
      code: "[4수01-14]",
      topic: "소수의 크기 비교와 관계",
      title: "소수의 크기 비교",
      conceptCards: [{ title: "크기 비교", body: "자연수 부분, 소수 첫째, 둘째, 셋째 자리 순서로 비교합니다. 소수의 오른쪽 끝의 0은 생략할 수 있습니다.", example: "2.4 = 2.40 > 2.38" }],
      generators: [G4.decCompare2, S2.l4DecOrder, S2.l4DecEqualPick, S2.l4DecBoxCount, S2.l4DecWhoFar, FP.gridCompare],
    },
    {
      id: "dec-relation",
      code: "[4수01-13]",
      topic: "소수의 크기 비교와 관계",
      title: "소수 사이의 관계",
      conceptCards: [{ title: "10배와 1/10", body: "소수를 10배 하면 소수점이 오른쪽으로 한 자리, 1/10을 하면 왼쪽으로 한 자리 옮겨집니다.", example: "0.35의 10배 = 3.5, 4.7의 1/10 = 0.47" }],
      generators: [S2.l4DecTimes10, S2.l4DecTimesBox, S2.l4DecRelOdd, S2.l4DecRelWrong, S2.l4DecRelCoins],
    },
    {
      id: "dec-add",
      code: "[4수01-16]",
      topic: "소수의 덧셈과 뺄셈",
      title: "소수의 덧셈",
      conceptCards: [{ title: "소수점 맞추기", body: "소수점의 자리를 맞추어 세로로 쓰고, 같은 자리끼리 더한 뒤 소수점을 그대로 내려 찍습니다.", example: "2.5 + 1.34 = 3.84" }],
      generators: [G4.decAdd1, G4.decAdd, S2.l4DecAddBox, ex(DEC, "dec-calc", "w4-fruit-weight"), S2.l4DecAddCards, FP.decLineAdd],
    },
    {
      id: "dec-sub",
      code: "[4수01-16]",
      topic: "소수의 덧셈과 뺄셈",
      title: "소수의 뺄셈",
      conceptCards: [{ title: "자리 수가 다른 뺄셈", body: "소수점의 자리를 맞추고, 자리 수가 모자라면 끝에 0을 붙여 생각한 뒤 같은 자리끼리 뺍니다.", example: "5.3 − 1.25 = 5.30 − 1.25 = 4.05" }],
      generators: [G4.decSub1, G4.decSub, S2.l4DecSubFix, S2.l4DecWrongOp, S2.l4DecSubLife, FP.decLineSub],
    },
  ],
};
