import type { Generator, Unit } from "../types";
import * as G6 from "../generators/grade6";
import * as L from "../lessons/g6";
import * as M from "../lessons/g6-2";
import { extras } from "../extras";

/** 6학년. 단원 순서는 2022 개정 검정 교과서(천재교육 계열) 흐름, 성취기준 코드는 docs/audit-v2 보고서의 코드 표(원문 대조는 docs/USER-TODO.md 3번) */

const unit = (
  id: string,
  semester: 1 | 2,
  number: number,
  slug: string,
  title: string,
  standards: Unit["standards"],
): Unit => ({ id, grade: 6, semester, number, slug, title, standards });

/** 예전 단계에 붙어 있던 생성기를 id로 골라 온다 */
const old = (unitId: string, stdId: string, genId: string): Generator => {
  const g = extras(unitId, stdId).find((x) => x.id === genId);
  if (!g) throw new Error(`${unitId}/${stdId}: ${genId} 없음`);
  return g;
};

/* ── 6-1 ── */

const FD1 = "g6-s1-frac-div";
export const g6s1FracDiv = unit(FD1, 1, 1, "frac-div", "분수의 나눗셈", [
  {
    id: "whole-whole",
    topic: "(자연수)÷(자연수)의 몫을 분수로 나타내기",
    code: "[6수01-10]",
    title: "몫이 1보다 작은 (자연수)÷(자연수)",
    conceptCards: [{ title: "몫을 분수로", body: "▲ ÷ ■의 몫은 ▲/■입니다.", example: "3 ÷ 4 = 3/4" }],
    generators: [G6.wholeDivWhole, L.divExprChoose, L.divCardMin],
  },
  {
    id: "whole-whole-big",
    topic: "(자연수)÷(자연수)의 몫을 분수로 나타내기",
    code: "[6수01-10]",
    title: "몫이 1보다 큰 (자연수)÷(자연수)",
    conceptCards: [{ title: "가분수·대분수로", body: "몫이 1보다 크면 가분수로 쓰고 대분수로 바꿀 수 있습니다.", example: "7 ÷ 3 = 7/3 = 2 1/3" }],
    generators: [L.divBigFrac, L.divFracCompare, L.divMixedBlank, L.divShareCompare, L.divWrongMul],
  },
  {
    id: "frac-whole-multiple",
    topic: "(분수)÷(자연수)",
    code: "[6수01-11]",
    title: "분자가 자연수의 배수인 (분수)÷(자연수)",
    conceptCards: [{ title: "분자를 나누기", body: "분자가 나누는 수의 배수이면 분자를 자연수로 나눕니다.", example: "6/7 ÷ 3 = (6 ÷ 3)/7 = 2/7" }],
    generators: [L.fdwMultiple, L.fdwBlank, L.fdwUnitCount, L.fdwWrong, L.fdwTwoStep],
  },
  {
    id: "frac-whole",
    topic: "(분수)÷(자연수)",
    code: "[6수01-11]",
    title: "(분수)÷(자연수)를 분수의 곱셈으로 나타내기",
    conceptCards: [{ title: "곱셈으로 바꾸기", body: "÷ (자연수)는 × 1/(자연수)로 바꾸어 계산합니다.", example: "4/5 ÷ 3 = 4/5 × 1/3 = 4/15" }],
    generators: [G6.fracDivWhole, L.fdwExpr, L.fdwError],
  },
  {
    id: "mixed-whole",
    topic: "(분수)÷(자연수)",
    code: "[6수01-11]",
    title: "(대분수)÷(자연수)",
    conceptCards: [{ title: "가분수로 바꾸기", body: "대분수를 가분수로 바꾼 뒤 × 1/(자연수)로 계산합니다.", example: "2 1/3 ÷ 2 = 7/3 × 1/2 = 7/6 = 1 1/6" }],
    generators: [L.mixedDiv, L.mixedDivCmp, L.mixedSquare, L.mixedCard, L.mixedRange],
  },
]);

const PR = "g6-s1-prisms";
export const g6s1Prisms = unit(PR, 1, 2, "prisms", "각기둥과 각뿔", [
  {
    id: "prism",
    topic: "각기둥",
    code: "[6수03-05]",
    title: "각기둥 알기",
    conceptCards: [{ title: "각기둥", body: "두 밑면이 서로 평행하고 합동인 다각형이며, 옆면이 모두 직사각형인 입체도형입니다. 두 밑면 사이의 거리를 높이라고 합니다." }],
    generators: [L.prismFaceShape, old(PR, "names", "e6-prism-base"), L.prismLateral, L.prismPick, L.prismSidePerimeter, L.prismBasePerimeter],
  },
  {
    id: "prism-parts",
    topic: "각기둥",
    code: "[6수03-05]",
    title: "각기둥의 이름과 구성 요소",
    conceptCards: [{ title: "구성 요소의 수", body: "□각기둥: 면 □+2, 모서리 □×3, 꼭짓점 □×2 (□: 한 밑면의 변의 수)" }],
    generators: [L.prismPartsCount, L.prismPartsReverse, L.prismPartsDiff, old(PR, "parts", "w6-prism-vertices"), L.prismEdgeLength, L.prismConditions],
  },
  {
    id: "prism-net",
    topic: "각기둥",
    code: "[6수03-06]",
    title: "각기둥의 전개도",
    conceptCards: [{ title: "전개도", body: "각기둥의 모서리를 잘라 펼친 그림입니다. 옆면을 이어 붙인 직사각형의 가로는 밑면의 둘레, 세로는 높이와 같습니다." }],
    generators: [L.prismNetName, L.netLateralWidth, L.netFaces, L.netPerimeterGen, L.netHeightReverse],
  },
  {
    id: "pyramid",
    topic: "각뿔",
    code: "[6수03-05]",
    title: "각뿔 알기",
    conceptCards: [{ title: "각뿔", body: "밑면이 다각형이고 옆면이 모두 삼각형인 입체도형입니다. 옆면이 모두 만나는 점을 각뿔의 꼭짓점이라고 합니다." }],
    generators: [L.pyramidFaceShape, L.pyramidLateral, L.pyramidPick, L.pyramidSidePerimeter, L.pyramidLateralCount],
  },
  {
    id: "pyramid-parts",
    topic: "각뿔",
    code: "[6수03-05]",
    title: "각뿔의 이름과 구성 요소",
    conceptCards: [{ title: "구성 요소의 수", body: "□각뿔: 면 □+1, 모서리 □×2, 꼭짓점 □+1 (□: 밑면의 변의 수)" }],
    generators: [L.pyramidPartsCount, G6.prismName, G6.prismParts, old(PR, "parts", "m6-pyramid-edges"), L.pyramidFromEdges, L.pyramidSumReverse, L.solidCompare, L.pyramidConditions, L.pyramidEdgeLength],
  },
]);

const DD1 = "g6-s1-dec-div";
export const g6s1DecDiv = unit(DD1, 1, 3, "dec-div", "소수의 나눗셈", [
  {
    id: "dec-natural",
    topic: "(소수)÷(자연수)",
    code: "[6수01-15]",
    title: "자연수의 나눗셈을 이용한 (소수)÷(자연수)",
    conceptCards: [{ title: "1/10배, 1/100배", body: "나누어지는 수가 1/10배, 1/100배가 되면 몫도 1/10배, 1/100배가 됩니다.", example: "369 ÷ 3 = 123 → 36.9 ÷ 3 = 12.3" }],
    generators: [L.ddScale, L.ddScaleTimes, L.ddCm, L.ddWrong, L.ddCard],
  },
  {
    id: "dec-whole",
    topic: "(소수)÷(자연수)",
    code: "[6수01-15]",
    title: "각 자리에서 나누어떨어지지 않는 (소수)÷(자연수)",
    conceptCards: [{ title: "소수점 맞추기", body: "자연수의 나눗셈처럼 계산하고, 몫의 소수점은 나누어지는 수의 소수점 위치에 맞추어 찍습니다.", example: "7.5 ÷ 3 = 2.5" }],
    generators: [G6.decDivWhole, L.ddCompare, L.ddRange],
  },
  {
    id: "dec-small",
    topic: "(소수)÷(자연수)",
    code: "[6수01-15]",
    title: "몫이 1보다 작은 (소수)÷(자연수)",
    conceptCards: [{ title: "일의 자리에 0", body: "나누어지는 수가 나누는 수보다 작으면 몫의 일의 자리에 0을 씁니다.", example: "2.16 ÷ 4 = 0.54" }],
    generators: [L.ddSmall, L.ddSmallBlank, L.ddSmallWord, L.ddSmallCompare, L.ddSmallReverse],
  },
  {
    id: "dec-zero",
    topic: "(소수)÷(자연수)",
    code: "[6수01-15]",
    title: "소수점 아래 0을 내리거나 몫에 0이 있는 나눗셈",
    conceptCards: [
      { title: "0을 내려 계산", body: "나누어떨어지지 않으면 소수점 아래 0을 내려 계속 계산합니다.", example: "6.3 ÷ 5 = 1.26" },
      { title: "몫에 0 쓰기", body: "나누어야 할 수가 나누는 수보다 작으면 몫에 0을 쓰고 다음 자리의 수를 내려 계산합니다.", example: "8.24 ÷ 4 = 2.06" },
    ],
    generators: [L.ddZeroDown, L.ddZeroMid, L.ddZeroFix, L.ddZeroBlank, L.ddZeroError, L.ddZeroTwoStep],
  },
  {
    id: "whole-dec",
    topic: "(자연수)÷(자연수)",
    code: "[6수01-14]",
    title: "(자연수)÷(자연수)의 몫을 소수로 나타내기",
    conceptCards: [{ title: "0을 내려 계산", body: "나누어떨어질 때까지 소수점 아래 0을 내려 계산합니다.", example: "7 ÷ 4 = 1.75" }],
    generators: [L.wwdDec, L.wwdDecCmp, L.wwdDecWord, L.wwdDecCompare, L.wwdDecWrong],
  },
  {
    id: "estimate",
    topic: "어림하기",
    code: "[6수01-15]",
    title: "몫을 어림하여 소수점의 위치 찾기",
    conceptCards: [{ title: "어림하기", body: "나누어지는 수를 반올림하여 자연수로 만든 뒤 나누어 몫을 어림하면 소수점의 위치를 알 수 있습니다.", example: "19.5 ÷ 5 → 20 ÷ 5 = 4 → 3.9" }],
    generators: [L.ddEstimate, L.ddEstRange, L.ddEstGreater, L.ddEstError, L.ddEstBox],
  },
]);

const RT = "g6-s1-ratio";
export const g6s1Ratio = unit(RT, 1, 4, "ratio", "비와 비율", [
  {
    id: "compare",
    topic: "비",
    code: "[6수02-02]",
    title: "두 수를 비교하기",
    conceptCards: [{ title: "뺄셈과 나눗셈", body: "두 양을 뺄셈으로 비교하면 차를, 나눗셈으로 비교하면 몇 배인지 알 수 있습니다. 나눗셈으로 비교한 관계는 양이 늘어나도 변하지 않습니다." }],
    generators: [L.cmpTable, L.cmpMethod, L.cmpMissing, L.cmpPattern, L.cmpTwoWays],
  },
  {
    id: "ratio-intro",
    topic: "비",
    code: "[6수02-02]",
    title: "비 알기",
    conceptCards: [{ title: "비", body: "두 수를 나눗셈으로 비교하기 위해 기호 :을 사용하여 나타낸 것입니다. 3 : 5는 '3 대 5', '5에 대한 3의 비', '3의 5에 대한 비'라고 읽습니다." }],
    generators: [L.ratioRead, L.ratioWrite, L.ratioBase, L.ratioCond, L.ratioError],
  },
  {
    id: "ratio",
    topic: "비율",
    code: "[6수02-03]",
    title: "비율 알기",
    conceptCards: [{ title: "비율", body: "비 3 : 5에서 3은 비교하는 양, 5는 기준량입니다. 비율은 (비교하는 양) ÷ (기준량) = 3/5 = 0.6입니다." }],
    generators: [G6.ratioValue, L.ratioFrac, L.ratioCompareRate],
  },
  {
    id: "ratio-life",
    topic: "비율",
    code: "[6수02-03]",
    title: "비율이 사용되는 경우",
    conceptCards: [{ title: "생활 속 비율", body: "걸린 시간에 대한 간 거리의 비율(빠르기), 넓이에 대한 인구의 비율(인구 밀도), 용액에 대한 용질의 비율(진하기) 등이 있습니다." }],
    generators: [L.speedRate, L.densityRate, L.concentration, L.speedCompare, L.densityCompare],
  },
  {
    id: "percent",
    topic: "백분율",
    code: "[6수02-03]",
    title: "백분율 알기",
    conceptCards: [{ title: "백분율", body: "기준량을 100으로 할 때의 비율을 백분율이라 하고 %로 씁니다. 비율에 100을 곱하면 백분율입니다.", example: "0.35 = 35%" }],
    generators: [G6.percent, L.pctFrac, L.pctCompare, L.pctCard],
  },
  {
    id: "percent-life",
    topic: "백분율",
    code: "[6수02-03]",
    title: "백분율이 사용되는 경우",
    conceptCards: [{ title: "할인율", body: "할인율(%) = (할인 금액) ÷ (원래 가격) × 100" }],
    generators: [L.pctOf, G6.percentOf, L.discountRate, L.pctStore, L.pctReverse],
  },
]);

const GR = "g6-s1-graphs";
export const g6s1Graphs = unit(GR, 1, 5, "graphs", "여러 가지 그래프", [
  {
    id: "picture-graph",
    topic: "그림그래프",
    code: "[6수04-03]",
    title: "그림그래프로 나타내기",
    conceptCards: [{ title: "그림그래프", body: "조사한 수를 그림의 크기와 수로 나타낸 그래프입니다. 큰 그림과 작은 그림이 나타내는 수를 먼저 확인합니다." }],
    generators: [L.picRead, L.picTotal, L.picRound, L.picCompare, L.picReverse],
  },
  {
    id: "band",
    topic: "띠그래프",
    code: "[6수04-02]",
    title: "띠그래프 알기",
    conceptCards: [{ title: "띠그래프", body: "전체에 대한 각 부분의 비율을 띠 모양에 나타낸 그래프입니다. 각 항목의 백분율의 합은 100%입니다." }],
    generators: [L.bandRead, L.bandTimes, old(GR, "band-circle", "m6-to-percent"), L.bandCount, L.bandCond],
  },
  {
    id: "band-draw",
    topic: "띠그래프",
    code: "[6수04-02]",
    title: "띠그래프로 나타내기",
    conceptCards: [{ title: "나타내는 순서", body: "① 각 항목의 백분율 구하기 ② 합계가 100%인지 확인 ③ 백분율의 크기만큼 띠를 나누기 ④ 내용과 백분율 쓰기 ⑤ 제목 쓰기" }],
    generators: [L.bandPercent, L.bandLength, L.bandMissing, L.bandReverse, L.bandTwoStep],
  },
  {
    id: "circle",
    topic: "원그래프",
    code: "[6수04-02]",
    title: "원그래프 알기와 나타내기",
    conceptCards: [{ title: "원그래프", body: "전체에 대한 각 부분의 비율을 원 모양에 나타낸 그래프입니다. 원의 중심을 따라 백분율의 크기만큼 선을 그어 나눕니다." }],
    generators: [G6.circleGraphPercent, L.circleTimes, L.circleSum, old(GR, "band-circle", "w6-circle-graph-rest"), L.circleReverse],
  },
  {
    id: "graph-compare",
    topic: "그래프 해석",
    code: "[6수04-03]",
    title: "그래프 해석하기와 여러 가지 그래프 비교하기",
    conceptCards: [{ title: "알맞은 그래프", body: "비율은 띠·원그래프, 변화는 꺾은선그래프, 수량 비교는 막대그래프, 지역별 수량은 그림그래프가 알맞습니다. 전체 수가 다르면 백분율만으로 양을 비교할 수 없습니다." }],
    generators: [L.graphKind, L.graphChange, L.graphRank, L.graphTwoYear, L.graphJudge],
  },
]);

const VS = "g6-s1-volume-surface";
export const g6s1VolumeSurface = unit(VS, 1, 6, "volume-surface", "직육면체의 부피와 겉넓이", [
  {
    id: "volume-compare",
    topic: "직육면체의 부피",
    code: "[6수03-18]",
    title: "직육면체의 부피 비교하기와 부피의 단위",
    conceptCards: [{ title: "1 cm³", body: "한 모서리가 1 cm인 정육면체의 부피를 1 cm³라 쓰고 1 세제곱센티미터라고 읽습니다. 쌓기나무의 수로 부피를 비교할 수 있습니다." }],
    generators: [L.volCountCubes, L.volBlockCompare, L.volBoxFit, L.volBlockDiff, L.volMaxCube],
  },
  {
    id: "volume",
    topic: "직육면체의 부피",
    code: "[6수03-19]",
    title: "직육면체의 부피 구하기",
    conceptCards: [{ title: "부피", body: "직육면체의 부피 = (가로) × (세로) × (높이), 정육면체의 부피 = (한 모서리) × (한 모서리) × (한 모서리)" }],
    generators: [G6.cuboidVolume, L.volHeight, L.volCubeEdge, L.volLShape, L.volCompareSign, L.volDiff],
  },
  {
    id: "m3",
    topic: "직육면체의 부피",
    code: "[6수03-18]",
    title: "m³ 알기",
    conceptCards: [{ title: "1 m³", body: "한 모서리가 1 m인 정육면체의 부피를 1 m³라고 합니다. 1 m³ = 1000000 cm³" }],
    generators: [L.m3Volume, G6.volumeUnits, L.m3Mixed, L.m3Compare, L.m3Boxes],
  },
  {
    id: "surface",
    topic: "직육면체의 겉넓이",
    code: "[6수03-17]",
    title: "직육면체의 겉넓이 구하기",
    conceptCards: [{ title: "겉넓이", body: "여섯 면의 넓이의 합입니다. 합동인 면이 2개씩 있으므로 (세 면의 넓이의 합) × 2, 또는 (한 밑면의 넓이) × 2 + (옆면의 넓이)로 구합니다." }],
    generators: [G6.cuboidSurface, L.surfHeight, L.surfOpenBox],
  },
]);

/* ── 6-2 ── */

export const g6s2FracDiv = unit("g6-s2-frac-div", 2, 1, "frac-div", "분수의 나눗셈", [
  {
    id: "same-den",
    topic: "분모가 같은 (분수)÷(분수)",
    code: "[6수01-11]",
    title: "분자끼리 나누어떨어지는 (분수)÷(분수)",
    conceptCards: [{ title: "분자끼리 나누기", body: "분모가 같으면 분자끼리 나눕니다.", example: "6/7 ÷ 2/7 = 6 ÷ 2 = 3" }],
    generators: [M.sdDiv, M.sdCount, M.sdBlank, M.sdCard, M.sdReverse],
  },
  {
    id: "same-den-frac",
    topic: "분모가 같은 (분수)÷(분수)",
    code: "[6수01-11]",
    title: "분자끼리 나누어떨어지지 않는 (분수)÷(분수)",
    conceptCards: [{ title: "몫을 분수로", body: "분자끼리 나누어떨어지지 않으면 몫을 분수로 나타냅니다.", example: "5/8 ÷ 3/8 = 5 ÷ 3 = 5/3 = 1 2/3" }],
    generators: [M.sdFrac, M.sdBiggest, M.sdWord, M.sdWrong, M.sdRange],
  },
  {
    id: "diff-den",
    topic: "분모가 다른 (분수)÷(분수)",
    code: "[6수01-11]",
    title: "분모가 다른 (분수)÷(분수)",
    conceptCards: [{ title: "통분하여 나누기", body: "분모가 다르면 통분한 뒤 분자끼리 나눕니다.", example: "3/4 ÷ 2/5 = 15/20 ÷ 8/20 = 15 ÷ 8 = 15/8" }],
    generators: [M.diffDenDiv, M.diffDenCommon, M.diffDenBlank, M.diffDenCompare, M.diffDenReverse],
  },
  {
    id: "whole-frac",
    topic: "분모가 다른 (분수)÷(분수)",
    code: "[6수01-11]",
    title: "(자연수)÷(분수)",
    conceptCards: [{ title: "(자연수)÷(분수)", body: "(자연수) ÷ (분자)를 먼저 계산한 뒤 분모를 곱합니다.", example: "6 ÷ 2/3 = (6 ÷ 2) × 3 = 9" }],
    generators: [M.wfUnit, G6.wholeDivFrac, M.wfWord, M.wfPriceCompare, M.wfError],
  },
  {
    id: "frac-frac",
    topic: "(분수)÷(분수)를 (분수)×(분수)로",
    code: "[6수01-11]",
    title: "(분수)÷(분수)를 (분수)×(분수)로 나타내기",
    conceptCards: [{ title: "뒤집어 곱하기", body: "나누는 분수의 분모와 분자를 바꾸어 곱합니다.", example: "3/4 ÷ 2/5 = 3/4 × 5/2 = 15/8" }],
    generators: [G6.fracDivFrac, M.ffMulForm, M.ffBlank, M.ffError],
  },
  {
    id: "mixed-frac",
    topic: "(분수)÷(분수)를 (분수)×(분수)로",
    code: "[6수01-11]",
    title: "(대분수)÷(분수)",
    conceptCards: [{ title: "가분수로 바꾸기", body: "대분수를 가분수로 바꾼 뒤 나누는 분수의 분모와 분자를 바꾸어 곱합니다.", example: "1 1/2 ÷ 3/4 = 3/2 × 4/3 = 2" }],
    generators: [M.mfDiv, M.mfCmp, M.mfRect, M.mfCard, M.mfTwoStep],
  },
]);

const DD2 = "g6-s2-dec-div";
export const g6s2DecDiv = unit(DD2, 2, 2, "dec-div", "소수의 나눗셈", [
  {
    id: "dec-natural",
    topic: "(소수)÷(소수)",
    code: "[6수01-15]",
    title: "자연수의 나눗셈을 이용한 (소수)÷(소수)",
    conceptCards: [{ title: "같은 배수로", body: "나누어지는 수와 나누는 수를 똑같이 10배(100배) 해도 몫은 같습니다.", example: "8.4 ÷ 0.4 = 84 ÷ 4 = 21" }],
    generators: [M.ddsScale, M.ddsCm, M.ddsSameQuot, M.ddsReverse, M.ddsTwoStep],
  },
  {
    id: "same-places",
    topic: "(소수)÷(소수)",
    code: "[6수01-15]",
    title: "자릿수가 같은 (소수)÷(소수)",
    conceptCards: [{ title: "소수점 옮기기", body: "나누는 수와 나누어지는 수의 소수점을 똑같이 옮겨 자연수의 나눗셈으로 계산합니다.", example: "2.4 ÷ 0.3 = 24 ÷ 3 = 8" }],
    generators: [G6.decDivDec, old(DD2, "dec-dec", "m6-dec-dec-reverse"), M.ddsCompare, M.ddsWrong, M.ddsRect],
  },
  {
    id: "diff-places",
    topic: "(소수)÷(소수)",
    code: "[6수01-15]",
    title: "자릿수가 다른 (소수)÷(소수)",
    conceptCards: [{ title: "나누는 수를 자연수로", body: "나누는 수가 자연수가 되도록 두 수의 소수점을 똑같이 옮기고, 몫의 소수점은 옮긴 위치에 맞추어 찍습니다.", example: "4.35 ÷ 1.5 = 43.5 ÷ 15 = 2.9" }],
    generators: [M.ddpDiv, M.ddpShift, M.ddpBlank, M.ddpError, M.ddpPattern],
  },
  {
    id: "whole-dec",
    topic: "(자연수)÷(소수)",
    code: "[6수01-15]",
    title: "(자연수)÷(소수)",
    conceptCards: [{ title: "0 붙이기", body: "나누는 수의 소수점을 옮긴 만큼 나누어지는 수의 끝에 0을 붙여 계산합니다.", example: "12 ÷ 0.4 = 120 ÷ 4 = 30" }],
    generators: [M.wdDiv, M.wdCmp, M.wdWord, M.wdRange, M.wdPriceCompare],
  },
  {
    id: "round",
    topic: "몫을 반올림하기",
    code: "[6수01-15]",
    title: "몫을 반올림하여 나타내기",
    conceptCards: [{ title: "반올림", body: "나누어떨어지지 않을 때는 구하려는 자리 바로 아래 자리까지 구해 반올림합니다." }],
    generators: [G6.decDivRound, M.roundWhole, M.roundPattern],
  },
  {
    id: "remainder",
    topic: "나누어 주고 남는 양",
    code: "[6수01-15]",
    title: "나누어 주고 남는 양 알아보기",
    conceptCards: [{ title: "남는 양", body: "몫을 자연수까지 구하고, 남는 양의 소수점은 나누어지는 수의 소수점 위치에 맞추어 찍습니다. (나누는 수) × (몫) + (남는 양) = (나누어지는 수)", example: "25.3 ÷ 3 = 8 … 1.3" }],
    generators: [M.remCalc, M.remCheck, M.remNeed, old(DD2, "dec-dec", "w6-bottles-fill"), M.remError],
  },
]);

export const g6s2Space = unit("g6-s2-space", 2, 3, "space", "공간과 입체", [
  {
    id: "stack",
    topic: "쌓기나무의 개수",
    code: "[6수03-09]",
    title: "위에서 본 모양에 수를 써서 개수 구하기",
    conceptCards: [{ title: "위에서 본 모양", body: "위에서 본 모양의 각 칸에 쌓은 개수를 적으면 전체 개수를 정확히 셀 수 있습니다." }],
    generators: [M.cubeStack, M.stackLayer, M.stackFirst, M.stackCompare, M.completeCube],
  },
  {
    id: "views",
    topic: "쌓기나무의 개수",
    code: "[6수03-10]",
    title: "위, 앞, 옆에서 본 모양 알기",
    conceptCards: [{ title: "앞·옆에서 본 모양", body: "앞에서 보면 각 세로줄에서, 옆에서 보면 각 가로줄에서 가장 높은 층만 보입니다." }],
    generators: [M.frontView, M.sideView, M.viewArea, M.viewMax, M.stackCuboidFill],
  },
  {
    id: "layers",
    topic: "층별로 나타내기",
    code: "[6수03-10]",
    title: "층별로 나타낸 모양 알기",
    conceptCards: [{ title: "층별 모양", body: "1층, 2층, 3층에 놓인 쌓기나무의 위치를 층별로 그려 나타내면 모양을 정확히 알 수 있습니다." }],
    generators: [M.layerCount, M.layerPick, M.layerTopNumber, M.layerCond, M.layerPattern],
  },
  {
    id: "reasoning",
    topic: "층별로 나타내기",
    code: "[6수03-09] [6수03-10]",
    title: "본 모양으로 쌓기나무의 개수 추론하기",
    conceptCards: [{ title: "가려진 쌓기나무", body: "앞에서 본 모양만으로는 뒤에 가려진 쌓기나무를 알 수 없으므로, 가장 많은 경우와 가장 적은 경우를 따져 봅니다." }],
    generators: [M.rowFront, M.rowBlank, M.stackCount, M.viewMinMax, M.viewJudge],
  },
]);

export const g6s2Proportion = unit("g6-s2-proportion", 2, 4, "proportion", "비례식과 비례배분", [
  {
    id: "ratio-property",
    topic: "비의 성질",
    code: "[6수02-04]",
    title: "비의 성질 알기",
    conceptCards: [{ title: "비의 성질", body: "비의 전항과 후항에 0이 아닌 같은 수를 곱하거나 나누어도 비율은 같습니다.", example: "2 : 3 = 4 : 6 = 6 : 9" }],
    generators: [M.ratioEq, M.ratioPropBlank, M.ratioSameRate, M.ratioPropCond, M.ratioPropError],
  },
  {
    id: "simplest",
    topic: "비의 성질",
    code: "[6수02-04]",
    title: "간단한 자연수의 비로 나타내기",
    conceptCards: [{ title: "간단한 자연수의 비", body: "자연수의 비는 최대공약수로 나누고, 소수의 비는 10, 100을 곱하고, 분수의 비는 분모의 공배수를 곱합니다.", example: "0.6 : 1.5 = 6 : 15 = 2 : 5" }],
    generators: [M.simplifyNat, old("g6-s2-proportion", "proportion", "m6-simple-ratio"), M.simplifyDec, M.simplifyFrac, M.simplifyWork, M.simplifyMix],
  },
  {
    id: "prop-property",
    topic: "비례식",
    code: "[6수02-04]",
    title: "비례식 알기와 비례식의 성질",
    conceptCards: [{ title: "비례식의 성질", body: "비율이 같은 두 비를 기호 =로 나타낸 식이 비례식입니다. 외항의 곱과 내항의 곱은 같습니다.", example: "2 : 3 = 4 : 6 → 2 × 6 = 3 × 4" }],
    generators: [G6.proportion, M.propCheck, M.propDecimal, M.propCond, M.propError],
  },
  {
    id: "prop-use",
    topic: "비례식",
    code: "[6수02-04]",
    title: "비례식 활용하기",
    conceptCards: [{ title: "비례식 세우기", body: "알고 있는 두 양의 관계를 비로 쓰고, 구하려는 양을 □로 하여 비례식을 세웁니다." }],
    generators: [M.propRecipe, M.propMap, M.propGear, old("g6-s2-proportion", "proportion", "w6-print-time"), M.propShadow],
  },
  {
    id: "share",
    topic: "비례배분",
    code: "[6수02-05]",
    title: "비례배분하기",
    conceptCards: [{ title: "비례배분", body: "전체를 주어진 비로 나누는 것입니다. 전체 × (나의 비)/(비의 합)", example: "20을 2 : 3으로 → 20 × 2/5 = 8, 20 × 3/5 = 12" }],
    generators: [G6.proportionalShare, M.shareExpr, M.shareReverse],
  },
]);

export const g6s2CircleArea = unit("g6-s2-circle-area", 2, 5, "circle-area", "원의 넓이", [
  {
    id: "circum-ratio",
    topic: "원주와 원주율",
    code: "[6수03-15]",
    title: "원주와 지름의 관계, 원주율 알기",
    conceptCards: [{ title: "원주율", body: "원의 지름에 대한 원주의 비율을 원주율이라고 합니다. 원의 크기와 관계없이 약 3.14로 일정합니다. 원주는 지름의 3배보다 길고 4배보다 짧습니다." }],
    generators: [M.piFact, M.piCompute, M.circEst, M.piCompare, M.piError],
  },
  {
    id: "circumference",
    topic: "원주와 원주율",
    code: "[6수03-16]",
    title: "원주와 지름 구하기",
    conceptCards: [{ title: "원주·지름", body: "원주 = 지름 × 원주율, 지름 = 원주 ÷ 원주율" }],
    generators: [M.circumference, M.circCmp, M.circumToDiameter, M.circWheelReverse],
  },
  {
    id: "area-estimate",
    topic: "원의 넓이",
    code: "[6수03-16]",
    title: "원의 넓이 어림하기",
    conceptCards: [{ title: "어림하기", body: "(원 안 정사각형의 넓이) < (원의 넓이) < (원 밖 정사각형의 넓이)", example: "반지름 5 cm → 50 cm² < 원 < 100 cm²" }],
    generators: [M.areaEstOut, M.areaEstRange, M.areaEstMid, M.areaEstHex, M.areaEstBounds],
  },
  {
    id: "area",
    topic: "원의 넓이",
    code: "[6수03-16]",
    title: "원의 넓이 구하기",
    conceptCards: [{ title: "원의 넓이", body: "원을 잘게 잘라 이어 붙이면 가로가 (원주) × 1/2, 세로가 반지름인 직사각형에 가까워집니다. 원의 넓이 = 반지름 × 반지름 × 원주율" }],
    generators: [M.circleAreaCut, M.circleArea, M.areaFromCirc, M.areaReverse, M.ringArea],
  },
  {
    id: "area-shapes",
    topic: "원의 넓이",
    code: "[6수03-16]",
    title: "여러 가지 원의 넓이 구하기",
    conceptCards: [{ title: "나누어 생각하기", body: "반원, 원의 일부, 정사각형과 원이 겹친 모양은 원의 넓이를 이용해 더하거나 빼서 구합니다." }],
    generators: [M.semicircle, M.quarterCircle, M.areaRatio, M.squareMinusCircle, M.pizzaCompare],
  },
]);

const RS = "g6-s2-round-solids";
export const g6s2RoundSolids = unit(RS, 2, 6, "round-solids", "원기둥, 원뿔, 구", [
  {
    id: "cylinder",
    topic: "원기둥",
    code: "[6수03-07]",
    title: "원기둥 알기",
    conceptCards: [{ title: "원기둥", body: "두 밑면이 서로 평행하고 합동인 원이며 옆면이 굽은 면인 입체도형입니다. 두 밑면에 수직인 선분의 길이를 높이라고 합니다." }],
    generators: [M.cylFact, M.cylinderFront, M.cylVsPrism, M.cylRotate, M.cylCond],
  },
  {
    id: "net",
    topic: "원기둥",
    code: "[6수03-08]",
    title: "원기둥의 전개도",
    conceptCards: [{ title: "옆면", body: "원기둥의 전개도에서 옆면은 직사각형이고, 가로는 밑면의 둘레(원주), 세로는 높이와 같습니다." }],
    generators: [M.netParts, M.cylinderNetGen, M.netRadius, M.cylNetHeight],
  },
  {
    id: "cone",
    topic: "원뿔",
    code: "[6수03-07]",
    title: "원뿔 알기",
    conceptCards: [{ title: "원뿔", body: "밑면이 원이고 옆면이 굽은 면인 뿔 모양의 입체도형입니다. 꼭짓점과 밑면의 둘레의 한 점을 이은 선분을 모선이라고 합니다." }],
    generators: [M.coneFact, M.coneRotate, M.coneFront, M.coneFrontArea, M.coneCylCompare],
  },
  {
    id: "sphere",
    topic: "구",
    code: "[6수03-07]",
    title: "구 알기",
    conceptCards: [{ title: "구", body: "공 모양의 입체도형입니다. 가장 안쪽의 점을 구의 중심, 중심에서 겉면의 한 점을 이은 선분을 구의 반지름이라고 합니다." }],
    generators: [M.sphereFact, M.roundSolids, M.sphereRotate, M.sphereBox, M.sphereBoxVolume, M.solidGuess],
  },
]);
