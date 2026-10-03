import type { Unit } from "../types";
import * as G3S from "../lessons/g3-shape";
import * as G3D from "../lessons/g3-data";
import * as GE from "../generators/geometry";
import * as GR from "../generators/graphs";
import { ex } from "../lessons/g4";
import * as SH from "../lessons/g4-shapes";
import * as Q from "../lessons/g4-quad";
import * as SG from "../lessons/g4-graphs";
import * as TR from "../lessons/g4-tri";
import * as PO from "../lessons/g4-poly";

/**
 * 3~4학년 도형·그래프 단원. 성취기준 코드는 docs/audit-v2 보고서의 코드 표(교사 정리 시트 기준, 원문 대조는 docs/USER-TODO.md 3번).
 */


export const g3s1PlaneFigures: Unit = {
  id: "g3-s1-plane-figures",
  grade: 3,
  semester: 1,
  number: 2,
  slug: "plane-figures",
  title: "평면도형",
  standards: [
    {
      id: "lines",
      code: "[4수03-01]",
      topic: "선과 각",
      title: "선분, 반직선, 직선",
      conceptCards: [
        { title: "선분·반직선·직선", body: "두 점을 곧게 이은 선은 선분, 한 점에서 시작하여 한쪽으로 끝없이 늘인 것은 반직선, 양쪽으로 끝없이 늘인 것은 직선입니다." },
        { title: "이름 읽기", body: "반직선은 시작하는 점을 먼저 읽습니다. 반직선 ㄱㄴ은 점 ㄱ에서 시작하여 점 ㄴ 쪽으로 늘인 것입니다." },
      ],
      generators: [G3S.geoLineKind, G3S.rayName, G3S.lineTruth, G3S.segmentsOnLine, G3S.rayCount],
    },
    {
      id: "angle",
      code: "[4수03-02]",
      topic: "선과 각",
      title: "각",
      conceptCards: [{ title: "각", body: "한 점에서 그은 두 반직선으로 이루어진 도형을 각이라 합니다. 그 점을 꼭짓점, 두 반직선을 변이라고 합니다." }],
      generators: [G3S.geoCountAngles, G3S.angleName, G3S.angleFan, G3S.angleTruth, G3S.anglePick],
    },
    {
      id: "right-angle",
      code: "[4수03-02]",
      topic: "선과 각",
      title: "직각",
      conceptCards: [{ title: "직각", body: "종이를 반듯하게 두 번 접었을 때 생기는 각을 직각이라 합니다. 삼각자의 직각 부분을 대어 확인할 수 있어요." }],
      generators: [G3S.rightClock, G3S.geoRightAngles, G3S.rightGrid, G3S.rightCountGen, G3S.rightMost],
    },
    {
      id: "right-triangle",
      code: "[4수03-09]",
      topic: "직각이 있는 도형",
      title: "직각삼각형",
      conceptCards: [{ title: "직각삼각형", body: "한 각이 직각인 삼각형을 직각삼각형이라고 합니다." }],
      generators: [G3S.geoShapeName, G3S.rtriTruth, G3S.rtriGrid, G3S.rtriJoin, G3S.shapeCond],
    },
    {
      id: "rectangle",
      code: "[4수03-10]",
      topic: "직각이 있는 도형",
      title: "직사각형",
      conceptCards: [{ title: "직사각형", body: "네 각이 모두 직각인 사각형을 직사각형이라고 합니다. 마주 보는 두 변의 길이가 같습니다." }],
      generators: [G3S.rectSide, G3S.geoRectPerimeter, G3S.rectCompare, G3S.twoRects, G3S.rectWire],
    },
    {
      id: "square",
      code: "[4수03-10]",
      topic: "직각이 있는 도형",
      title: "정사각형",
      conceptCards: [{ title: "정사각형", body: "네 각이 모두 직각이고 네 변의 길이가 모두 같은 사각형을 정사각형이라고 합니다. 정사각형은 직사각형이라고 할 수 있습니다." }],
      generators: [G3S.squarePerim, G3S.squareSide, G3S.squareTruth, G3S.squareCut, G3S.squareJoin],
    },
  ],
};

export const g3s2Circle: Unit = {
  id: "g3-s2-circle",
  grade: 3,
  semester: 2,
  number: 3,
  slug: "circle",
  title: "원",
  standards: [
    {
      id: "circle-radius",
      code: "[4수03-06]",
      topic: "원의 구성 요소",
      title: "원의 중심과 반지름",
      conceptCards: [{ title: "중심과 반지름", body: "원의 한가운데 점을 원의 중심, 원의 중심과 원 위의 한 점을 이은 선분을 반지름이라고 합니다. 한 원에서 반지름은 모두 같습니다." }],
      generators: [G3S.radiusSame, G3S.twoCenters, G3S.radiusTruth, G3S.radiusTriangle, G3S.radiusTwo],
    },
    {
      id: "circle-diameter",
      code: "[4수03-06]",
      topic: "원의 구성 요소",
      title: "원의 지름",
      conceptCards: [
        { title: "지름", body: "원 위의 두 점을 이은 선분이 원의 중심을 지날 때 이 선분을 지름이라고 합니다. 지름은 원 안에 그을 수 있는 가장 긴 선분입니다." },
        { title: "관계", body: "한 원에서 지름은 반지름의 2배입니다.", example: "반지름 5 cm → 지름 10 cm" },
      ],
      generators: [G3S.circleDiameter, G3S.diameterCompare, G3S.diameterTruth, G3S.circlesInCircle, G3S.diameterRect],
    },
    {
      id: "circle-compass",
      code: "[4수03-07]",
      topic: "원 그리기",
      title: "컴퍼스를 이용하여 원 그리기",
      conceptCards: [{ title: "컴퍼스", body: "컴퍼스의 침을 원의 중심에 꽂고, 반지름만큼 벌려 원을 그립니다." }],
      generators: [G3S.compassOpen, G3S.compassFit, G3S.compassDraw, G3S.compassRule, G3S.compassWho],
    },
    {
      id: "circle-patterns",
      code: "[4수03-07]",
      topic: "원 그리기",
      title: "원을 이용하여 여러 가지 모양 그리기",
      conceptCards: [{ title: "규칙 찾기", body: "원의 중심을 옮기는 규칙과 반지름이 바뀌는 규칙을 찾아 모양을 그립니다. 맞닿게 이어 그린 원은 지름으로 길이를 구해요." }],
      generators: [G3S.circleInSquare, G3S.circleChain, G3S.circleStep, G3S.boxOfCircles, G3S.circleOverlap],
    },
  ],
};

export const g3s2Data: Unit = {
  id: "g3-s2-data",
  grade: 3,
  semester: 2,
  number: 6,
  slug: "data",
  title: "자료의 정리",
  standards: [
    {
      id: "data-table",
      code: "[4수04-01]",
      topic: "표",
      title: "표에서 알 수 있는 내용",
      conceptCards: [{ title: "표", body: "조사한 자료를 항목별로 세어 표로 나타내면 합계와 많고 적음을 한눈에 알 수 있습니다." }],
      generators: [G3D.dataTableMissing, G3D.dataTableMost, G3D.tableTimes, G3D.tableCond],
    },
    {
      id: "data-collect",
      code: "[4수04-01]",
      topic: "표",
      title: "자료를 수집하여 표로 나타내기",
      conceptCards: [{ title: "자료 수집", body: "조사할 내용과 방법을 정해 자료를 모으고, 항목별로 빠짐없이 세어 표로 나타냅니다." }],
      generators: [G3D.collectCount, G3D.collectDiff, G3D.collectMost, G3D.collectRev, G3D.collectTwo],
    },
    {
      id: "data-picto",
      code: "[4수04-01]",
      topic: "그림그래프",
      title: "그림그래프 알아보기",
      conceptCards: [{ title: "그림그래프", body: "조사한 수를 그림으로 나타낸 그래프입니다. 큰 그림이 10, 작은 그림이 1이면 ◉◉○○○는 23입니다.", example: "◉◉○○○ = 23" }],
      generators: [G3D.pictoTens, G3D.dataPicto, G3D.pictoMost, G3D.pictoMoney, G3D.pictoSum],
    },
    {
      id: "data-picto-draw",
      code: "[4수04-01]",
      topic: "그림그래프",
      title: "그림그래프로 나타내기",
      conceptCards: [{ title: "그림 정하기", body: "나타낼 수의 크기에 맞게 그림의 단위를 정하고, 큰 그림부터 그립니다. 그림의 종류가 많으면 더 적게 그릴 수 있어요." }],
      generators: [G3D.drawIcons, G3D.drawIcons3, G3D.drawTotal, G3D.drawMissing, G3D.drawSave],
    },
    {
      id: "data-use",
      code: "[4수04-01]",
      topic: "그림그래프",
      title: "표와 그림그래프로 해석하기",
      conceptCards: [{ title: "해석하기", body: "표와 그림그래프에서 가장 많은 것과 적은 것, 합과 차를 읽고 다음 계획을 세울 수 있습니다." }],
      generators: [G3D.useRead, G3D.useSum, G3D.usePlan, G3D.useCompare, G3D.useCond],
    },
  ],
};

export const g4s1Moving: Unit = {
  id: "g4-s1-moving",
  grade: 4,
  semester: 1,
  number: 4,
  slug: "moving",
  title: "평면도형의 이동",
  standards: [
    {
      id: "point-move",
      code: "[4수03-05]",
      topic: "점과 도형 밀기",
      title: "점의 이동",
      conceptCards: [{ title: "점의 이동", body: "점을 이동할 때는 어느 방향으로 몇 cm(몇 칸) 옮기는지 한 방향씩 차례로 셉니다.", example: "오른쪽으로 3 cm, 위쪽으로 2 cm" }],
      generators: [SH.l4PointMove, SH.l4PointMoveDesc, SH.l4PointBack, SH.l4PointMulti, SH.l4PointTwoStep],
    },
    {
      id: "slide",
      code: "[4수03-04]",
      topic: "점과 도형 밀기",
      title: "평면도형 밀기",
      conceptCards: [{ title: "밀기", body: "도형을 밀면 모양과 방향은 변하지 않고 위치만 바뀝니다. 꼭짓점 하나를 기준으로 민 거리를 셉니다." }],
      generators: [SH.l4SlideWhere, SH.l4SlideDist, GE.moveSlide, SH.l4SlidePattern, SH.l4SlideOverlap],
    },
    {
      id: "flip",
      code: "[4수03-04]",
      topic: "뒤집기와 돌리기",
      title: "평면도형 뒤집기",
      conceptCards: [{ title: "뒤집기", body: "오른쪽(왼쪽)으로 뒤집으면 왼쪽과 오른쪽이, 위쪽(아래쪽)으로 뒤집으면 위쪽과 아래쪽이 서로 바뀝니다. 같은 방향으로 두 번 뒤집으면 처음 도형이 됩니다." }],
      generators: [SH.l4ArrowFlip, GE.moveSlideFlip, GE.moveFlipOther, SH.l4ArrowFlip2, SH.l4FlipTimes, SH.l4ClockFlip],
    },
    {
      id: "rotate-lesson",
      code: "[4수03-04]",
      topic: "뒤집기와 돌리기",
      title: "평면도형 돌리기",
      conceptCards: [{ title: "돌리기", body: "시계 방향으로 90°만큼 돌리면 위쪽이 오른쪽으로 갑니다. 시계 방향으로 90°는 시계 반대 방향으로 270°와 같고, 360°를 돌리면 처음 도형이 됩니다." }],
      generators: [SH.l4ArrowRotate, GE.rotateTell, GE.moveRotate, SH.l4RotateEquiv, SH.l4RotateDigits, SH.l4RotateMore],
    },
    {
      id: "combo",
      code: "[4수03-04]",
      topic: "뒤집기와 돌리기",
      title: "평면도형을 여러 번 움직이기",
      conceptCards: [{ title: "여러 번 움직이기", body: "움직인 순서대로 한 번씩 모양을 그려 가며 생각합니다. 처음 모양으로 되돌리려면 나중에 한 움직임부터 반대로 합니다.", example: "오른쪽으로 뒤집고 아래쪽으로 뒤집기 = 180° 돌리기" }],
      generators: [GE.comboTell, SH.l4ArrowCombo, SH.l4ComboEquiv, GE.moveTwice, SH.l4ComboReverse],
    },
  ],
};

export const g4s1BarGraph: Unit = {
  id: "g4-s1-bar-graph",
  grade: 4,
  semester: 1,
  number: 5,
  slug: "bar-graph",
  title: "막대그래프",
  standards: [
    {
      id: "bar-know",
      code: "[4수04-01]",
      topic: "막대그래프 알아보기",
      title: "막대그래프 알아보기",
      conceptCards: [{ title: "막대그래프", body: "조사한 수를 막대 모양으로 나타낸 그래프입니다. 세로 눈금 한 칸의 크기를 먼저 확인하고, 막대 끝이 닿는 눈금을 읽습니다." }],
      generators: [GR.barRead, GR.barSecond, SG.l4BarScale, SG.w4BarTimes, SG.l4BarScaleInfer],
    },
    {
      id: "bar-interpret",
      code: "[4수04-01]",
      topic: "막대그래프 알아보기",
      title: "막대그래프의 내용 알아보기",
      conceptCards: [{ title: "비교와 합계", body: "막대의 길이로 많고 적음을 한눈에 비교하고, 항목끼리의 차와 전체 합계를 구할 수 있습니다." }],
      generators: [GR.barMax, GR.barDiff, SG.l4BarMoreThan, SG.w4BarMissing, SG.l4BarCellsDiff],
    },
    {
      id: "bar-draw",
      code: "[4수04-01]",
      topic: "막대그래프 그리기와 활용",
      title: "막대그래프로 나타내기",
      conceptCards: [{ title: "그리는 순서", body: "가로와 세로에 무엇을 나타낼지 정하고, 가장 큰 수까지 나타낼 수 있게 눈금 한 칸의 크기를 정한 뒤 막대를 그리고 제목을 씁니다." }],
      generators: [SG.l4BarCells, SG.l4BarTableMissing, SG.l4BarScaleChoose, SG.l4BarDrawError, SG.l4BarRestCells],
    },
    {
      id: "bar-apply",
      code: "[4수04-03]",
      topic: "막대그래프 그리기와 활용",
      title: "자료를 조사하여 막대그래프로 나타내고 활용하기",
      conceptCards: [{ title: "활용하기", body: "막대그래프를 보고 가장 많은 것, 순서, 필요한 양 등을 알아내어 계획을 세울 수 있습니다." }],
      generators: [SG.l4BarTotal, SG.l4BarOrder, SG.l4BarPlan, SG.l4BarBudget, SG.l4BarTwoClass],
    },
  ],
};

export const g4s2Triangles: Unit = {
  id: "g4-s2-triangles",
  grade: 4,
  semester: 2,
  number: 2,
  slug: "triangles",
  title: "삼각형",
  standards: [
    {
      id: "by-sides",
      code: "[4수03-08]",
      topic: "변의 길이에 따라 분류하기",
      title: "변의 길이에 따라 삼각형 분류하기",
      conceptCards: [{ title: "이등변삼각형과 정삼각형", body: "두 변의 길이가 같은 삼각형은 이등변삼각형, 세 변의 길이가 같은 삼각형은 정삼각형입니다. 정삼각형은 이등변삼각형이라고 할 수 있습니다." }],
      generators: [TR.triSideKind, TR.l4IsoPerimeter, SH.l4TriSideStatement, ex("g4-s2-triangles", "tri-sides", "w4-isosceles-side"), SH.l4WireTriangle, TR.l4IsoCondition],
    },
    {
      id: "isosceles",
      code: "[4수03-08]",
      topic: "변의 길이에 따라 분류하기",
      title: "이등변삼각형의 성질",
      conceptCards: [{ title: "두 밑각", body: "이등변삼각형은 길이가 같은 두 변과 함께하는 두 각(밑각)의 크기가 같습니다.", example: "한 밑각 50° → 나머지 각 80°" }],
      generators: [TR.l4IsoAnglesEasy, TR.triIsosceles, TR.l4IsoExterior, SH.l4IsoAngleDiff, SH.l4IsoCases],
    },
    {
      id: "equilateral",
      code: "[4수03-08]",
      topic: "변의 길이에 따라 분류하기",
      title: "정삼각형의 성질",
      conceptCards: [{ title: "세 각이 60°", body: "정삼각형은 세 변의 길이가 같고, 세 각의 크기도 모두 60°로 같습니다." }],
      generators: [TR.triEquilateral, SH.l4EquiWire, SH.l4EquiVsSquare, TR.l4EquiChain, SH.l4EquiWho, SH.l4TriCountBig],
    },
    {
      id: "by-angles",
      code: "[4수03-09]",
      topic: "각의 크기에 따라 분류하기",
      title: "각의 크기에 따라 삼각형 분류하기",
      conceptCards: [{ title: "예각·직각·둔각삼각형", body: "세 각이 모두 예각이면 예각삼각형, 한 각이 직각이면 직각삼각형, 한 각이 둔각이면 둔각삼각형입니다." }],
      generators: [TR.triAngleKind, TR.m4TriTwoAngles, TR.l4TriKindCount, SH.l4TriAcuteBox, SH.l4TriKindError],
    },
    {
      id: "both",
      code: "[4수03-09]",
      topic: "각의 크기에 따라 분류하기",
      title: "두 가지 기준으로 삼각형 분류하기",
      conceptCards: [{ title: "두 가지 기준", body: "삼각형은 변의 길이와 각의 크기, 두 가지 기준으로 함께 분류할 수 있습니다.", example: "두 변이 같고 한 각이 직각 → 이등변삼각형이면서 직각삼각형" }],
      generators: [SH.l4TriBothName, TR.l4TriBothAngles, SH.l4TriImpossible, SH.l4TriStatement, TR.l4TriBothTable, TR.l4TriBothDraw, ex("g4-s2-triangles", "tri-angles", "w4-isosceles-kind")],
    },
  ],
};

export const g4s2Quadrilaterals: Unit = {
  id: "g4-s2-quadrilaterals",
  grade: 4,
  semester: 2,
  number: 4,
  slug: "quadrilaterals",
  title: "사각형",
  standards: [
    {
      id: "perpendicular",
      code: "[4수03-03]",
      topic: "수직과 평행",
      title: "수직과 수선",
      conceptCards: [
        { title: "수직", body: "두 직선이 만나서 이루는 각이 직각일 때 두 직선은 서로 수직이라고 합니다." },
        { title: "수선", body: "두 직선이 서로 수직일 때 한 직선을 다른 직선에 대한 수선이라고 합니다. 삼각자의 직각 부분이나 각도기의 90° 눈금으로 수선을 그을 수 있습니다." },
      ],
      generators: [Q.l4PerpTerm, Q.l4PerpPick, Q.l4PerpSide, Q.l4PerpAngle, Q.l4PerpThrough, Q.l4PerpPairCount, Q.l4PerpTwoRays, Q.l4PerpStatement],
    },
    {
      id: "parallel",
      code: "[4수03-03]",
      topic: "수직과 평행",
      title: "평행",
      conceptCards: [
        { title: "평행", body: "한 직선에 수직인 두 직선을 그으면 두 직선은 서로 만나지 않습니다. 서로 만나지 않는 두 직선을 평행하다고 합니다." },
        { title: "평행선", body: "평행한 두 직선을 평행선이라고 합니다. 한 점을 지나고 한 직선과 평행한 직선은 1개 그을 수 있습니다." },
      ],
      generators: [Q.l4ParTerm, Q.l4ParPick, Q.l4ParSide, Q.l4ParThrough, Q.l4ParPairCount, Q.l4ParPerpTwo, Q.l4ParLinesCount, Q.l4ParStatement],
    },
    {
      id: "parallel-distance",
      code: "[4수03-03]",
      topic: "수직과 평행",
      title: "평행선 사이의 거리",
      conceptCards: [
        { title: "평행선 사이의 거리", body: "평행선의 한 직선에서 다른 직선에 수선을 그었을 때, 이 수선의 길이를 평행선 사이의 거리라고 합니다. 평행선 사이에 그은 선분 중 가장 짧고, 어디에서 재어도 같습니다." },
      ],
      generators: [Q.l4DistMeasure, Q.l4DistThree, Q.l4DistInShape, Q.l4DistStep, SH.l4ParDistBack],
    },
    {
      id: "trapezoid",
      code: "[4수03-10]",
      topic: "여러 가지 사각형",
      title: "사다리꼴",
      conceptCards: [{ title: "사다리꼴", body: "평행한 변이 한 쌍이라도 있는 사각형을 사다리꼴이라고 합니다." }],
      generators: [Q.l4TrapPick, Q.l4TrapParSides, Q.l4TrapCut, Q.l4TrapMove, SH.l4TrapWire, Q.l4TrapFacts],
    },
    {
      id: "parallelogram",
      code: "[4수03-10]",
      topic: "여러 가지 사각형",
      title: "평행사변형",
      conceptCards: [{ title: "평행사변형", body: "마주 보는 두 쌍의 변이 서로 평행한 사각형입니다. 마주 보는 두 변의 길이와 두 각의 크기가 같고, 이웃한 두 각의 크기의 합은 180°입니다." }],
      generators: [Q.l4ParaBox, Q.l4ParaAdj, Q.l4ParaPick, Q.l4ParaFourth, Q.l4ParaExterior, ex("g4-s2-quadrilaterals", "quad-props", "w4-parallelogram-side"), SH.l4ParaJoin],
    },
    {
      id: "rhombus",
      code: "[4수03-10]",
      topic: "여러 가지 사각형",
      title: "마름모",
      conceptCards: [{ title: "마름모", body: "네 변의 길이가 모두 같은 사각형입니다. 마주 보는 두 쌍의 변이 평행하고 마주 보는 두 각의 크기가 같습니다. 두 대각선은 서로 수직으로 만나며 서로를 똑같이 둘로 나눕니다." }],
      generators: [Q.l4RhombusBox, SH.l4RhombusSide, Q.l4RhombusDiag, Q.l4RhombusAdj, Q.l4RhombusIso, SH.l4RhombusVsTri, SH.l4RhombusAngleDiff],
    },
    {
      id: "quad-relations",
      code: "[4수03-10]",
      topic: "여러 가지 사각형",
      title: "여러 가지 사각형의 관계",
      conceptCards: [
        { title: "직사각형과 정사각형", body: "직사각형은 네 각이 모두 직각이고, 정사각형은 네 각이 모두 직각이고 네 변의 길이가 모두 같습니다." },
        { title: "사각형 사이의 관계", body: "정사각형은 직사각형이면서 마름모이고, 직사각형과 마름모는 평행사변형이며, 평행사변형은 사다리꼴입니다." },
      ],
      generators: [GE.quadName, Q.l4RectPick, Q.l4QuadNames, Q.l4QuadRelPick, ex("g4-s2-quadrilaterals", "quad-kinds", "w4-quad-both"), SH.l4QuadStatement],
    },
  ],
};

export const g4s2LineGraph: Unit = {
  id: "g4-s2-line-graph",
  grade: 4,
  semester: 2,
  number: 5,
  slug: "line-graph",
  title: "꺾은선그래프",
  standards: [
    {
      id: "line-know",
      code: "[4수04-02]",
      topic: "꺾은선그래프 알아보기",
      title: "꺾은선그래프 알아보기",
      conceptCards: [{ title: "꺾은선그래프", body: "시간에 따라 변하는 양을 점으로 찍고 선분으로 이은 그래프입니다. 세로 눈금 한 칸의 크기를 먼저 확인합니다." }],
      generators: [GR.lineRead, SG.l4LineWhen, SG.l4LineScale, SG.w4TempBetween, SG.w4PlantGrow],
    },
    {
      id: "line-interpret",
      code: "[4수04-02]",
      topic: "꺾은선그래프 알아보기",
      title: "꺾은선그래프의 내용 알아보기",
      conceptCards: [{ title: "변화 읽기", body: "선이 많이 기울어질수록 변화가 큽니다. 선이 오른쪽 위로 가면 늘어난 것이고, 오른쪽 아래로 가면 줄어든 것입니다." }],
      generators: [GR.lineDiff, GR.lineBiggestChange, GR.lineMax, SG.l4LinePredict, SG.l4LineTwoSeries],
    },
    {
      id: "line-draw",
      code: "[4수04-02]",
      topic: "꺾은선그래프 그리기와 활용",
      title: "꺾은선그래프로 나타내기",
      conceptCards: [{ title: "물결선", body: "필요 없는 부분은 물결선(≈)으로 줄여 나타내면 변화하는 모양을 더 뚜렷하게 볼 수 있습니다." }],
      generators: [SG.l4LineCells, SG.l4LineWaveStart, SG.l4LinePlotWhere, SG.l4LineCellsNeed, SG.l4LineWaveSave, SG.l4LineGrowBack],
    },
    {
      id: "line-apply",
      code: "[4수04-03]",
      topic: "꺾은선그래프 그리기와 활용",
      title: "자료를 조사하여 꺾은선그래프로 나타내고 활용하기",
      conceptCards: [{ title: "알맞은 그래프", body: "시간에 따른 변화는 꺾은선그래프, 항목끼리의 비교는 막대그래프로 나타내는 것이 알맞습니다." }],
      generators: [SG.l4LineIncreaseCount, SG.l4LineOrBar, SG.l4LineTotalChange, SG.l4LineSales, SG.l4LineCondition],
    },
  ],
};

export const g4s2Polygons: Unit = {
  id: "g4-s2-polygons",
  grade: 4,
  semester: 2,
  number: 6,
  slug: "polygons",
  title: "다각형",
  standards: [
    {
      id: "polygon",
      code: "[4수03-11]",
      topic: "다각형과 정다각형",
      title: "다각형",
      conceptCards: [{ title: "다각형", body: "선분으로만 둘러싸인 도형을 다각형이라 하고, 변의 수에 따라 오각형, 육각형 등으로 부릅니다." }],
      generators: [GE.polyName, PO.l4PolySidesSum, SH.l4PolyNot, SH.l4PolySticks, SH.l4PolyCond],
    },
    {
      id: "regular",
      code: "[4수03-11]",
      topic: "다각형과 정다각형",
      title: "정다각형",
      conceptCards: [{ title: "정다각형", body: "변의 길이가 모두 같고 각의 크기가 모두 같은 다각형입니다.", example: "정육각형의 한 각 = 120°" }],
      generators: [PO.polyRegularPerimeter, PO.l4RegularPick, PO.l4RegularAngle, PO.w4HexTriangle, SH.l4RegularWire],
    },
    {
      id: "diagonal",
      code: "[4수03-11]",
      topic: "대각선",
      title: "대각선",
      conceptCards: [{ title: "대각선", body: "서로 이웃하지 않는 두 꼭짓점을 이은 선분입니다. □각형의 한 꼭짓점에서 그을 수 있는 대각선은 (□ − 3)개입니다.", example: "사각형의 대각선은 2개" }],
      generators: [PO.e4DiagVertex, GE.polyDiagonals, SH.l4DiagProps, ex("g4-s2-polygons", "poly-diagonals", "w4-diagonals-sides"), PO.l4DiagRect],
    },
    {
      id: "tiling",
      code: "[4수03-12]",
      topic: "모양 만들기와 채우기",
      title: "모양 조각으로 모양 만들고 채우기",
      conceptCards: [{ title: "빈틈없이 채우기", body: "모양 조각을 겹치지 않게 빈틈없이 이어 붙여 여러 가지 모양을 만들거나 채울 수 있습니다. 한 점에 모인 각의 합이 360°이면 빈틈이 없습니다." }],
      generators: [PO.l4TileCount, PO.l4TileHex, SH.l4TileAngle, PO.l4TileCannot, PO.l4TileMix],
    },
  ],
};
