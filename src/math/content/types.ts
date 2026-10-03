/** 문제 옆에 그려 줄 그림 */
export type Visual =
  | { kind: "bar"; parts: number; shaded: number }
  | { kind: "circle"; parts: number; shaded: number }
  /** 세로셈: a op b, 답 칸은 비워 둔다 */
  | { kind: "column"; op: "+" | "-" | "×"; a: number; b: number }
  | ShapeScene
  | LongDivision
  | { kind: "bars"; title: string; labels: string[]; values: number[]; unit: string; step: number; second?: SecondSeries; asked?: number[] }
  | { kind: "line"; title: string; labels: string[]; values: number[]; unit: string; step: number; second?: SecondSeries; asked?: number[] }
  | { kind: "table"; header: string[]; rows: string[][] };

/**
 * 두 계열 그래프의 두 번째 계열(두 반·두 식물 비교). names는 [values의 이름, 두 번째 계열 이름]으로 범례에 쓴다.
 * 막대는 색칠/빗금, 꺾은선은 ●실선/▲점선으로 구별해 흑백 인쇄에서도 알아볼 수 있다
 */
export type SecondSeries = { names: [string, string]; values: number[] };

/*
 * 그래프의 asked: 문제가 그래프에서 읽어 내라고 묻는 항목 번호(labels 기준).
 * 그림 설명(화면 읽기용 aria-label)에는 항목별 값을 쓰되, 이 항목들의 값은 빼서 정답이 그대로 드러나지 않게 한다.
 */

/** 도형 그림: viewBox 좌표로 다각형·선·원·글자를 그린다 */
export type ShapeScene = {
  kind: "shape";
  width: number;
  height: number;
  label: string;
  /** fill: true는 색칠, "paper"는 종이색으로 덮기(뒤에 그린 선을 가린다: 쌓기나무, 색칠한 부분에서 뺀 원) */
  polygons?: { points: [number, number][]; fill?: boolean | "paper" }[];
  lines?: { from: [number, number]; to: [number, number]; dashed?: boolean; arrows?: "end" | "both"; width?: number }[];
  circles?: { c: [number, number]; r: number }[];
  /** 각 표시 호: 중심 c, 반지름 r, 화면에서 시계 반대 방향으로 잰 시작·끝 각도(°, 오른쪽이 0°) */
  arcs?: { c: [number, number]; r: number; from: number; to: number; width?: number }[];
  dots?: [number, number][];
  texts?: { at: [number, number]; text: string }[];
  /** 모눈(칸 크기) */
  grid?: number;
};

/** 나눗셈 세로셈의 수 하나: 숫자 글자, 또는 width자리를 차지하는 빈칸(name: "□"·"㉠"·"㉡" 등) */
export type LongDivNum = string | { blank: string; width: number };

/**
 * 교과서식 나눗셈 세로셈: 나누는 수 ) 나누어지는 수, 몫은 위에(나누어지는 수 오른쪽 끝에 맞춘다),
 * 아래로 곱한 수와 뺀 결과를 차례로 쓴다.
 */
export type LongDivision = {
  kind: "longdiv";
  divisor: LongDivNum;
  dividend: LongDivNum;
  quotient: LongDivNum;
  /** 나누어지는 수 아래 줄들. end는 마지막 숫자가 놓이는 나누어지는 수의 자리(왼쪽부터 0), rule이면 아래에 뺄셈 선 */
  rows: { num: LongDivNum; end: number; rule?: boolean }[];
};

/** 선택지·정답 표기: "3/5" 는 분수, 나머지는 그대로 */
export type AnswerText = string;

/** 1: 하(기본), 2: 중(응용), 3: 상(심화·서술형) */
export type Level = 1 | 2 | 3;

export type Problem = {
  /** 중복 출제 판단용: 유형 + 숫자 조합 */
  key: string;
  typeId: string;
  prompt: string;
  /** 문제 식(예: "3/5 ○ 2/5"), 분수는 세로 표기로 렌더링 */
  expression?: string;
  visual?: Visual;
  /** fields: 칸 여러 개(예: 몫·나머지), 답은 "a,b" */
  input: "choice" | "number" | "fields";
  /** fields 칸 뒤에 붙는 말(예: ["몫", "나머지"] 또는 ["시", "분"]) */
  fields?: string[];
  choices?: AnswerText[];
  answer: AnswerText;
  hint: string;
  explanation: string;
  /** 출제기가 생성기의 난이도를 붙인다 */
  level?: Level;
  /** 흔한 실수로 나오는 오답 → 짧은 설명 */
  mistakes?: Record<AnswerText, string>;
};

export type Generator = {
  id: string;
  /** 하·중·상 — 상은 서술형 */
  level: Level;
  /**
   * 같은 난이도 안에서 뽑힐 비중(기본 1). 계산 연습 칸을 지키려고 그림 유형의 비중을 낮출 때 쓴다
   * (예: 하 생성기 2개 중 하나가 0.5면 그 유형은 하 칸의 1/3)
   */
  weight?: number;
  make(rand: () => number): Problem;
};

export type ConceptCard = { title: string; body: string; example?: string };

export type Standard = {
  id: string;
  /** 2022 개정 성취기준 코드(standards-2022.ts 목록에 있는 코드, 여러 개면 공백으로 잇는다: "[2수01-05] [2수01-06]") */
  code: string;
  title: string;
  /** 차시를 묶는 소단원 이름(단원 차례에서 제목으로 보인다) */
  topic?: string;
  conceptCards: ConceptCard[];
  generators: Generator[];
};

export type Unit = {
  id: string;
  grade: number;
  semester: number;
  /** 교과서 단원 번호 */
  number: number;
  slug: string;
  title: string;
  standards: Standard[];
};
