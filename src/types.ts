// 모든 앱이 함께 쓰는 문제 모양. math-king 생성기의 Problem을 기준으로 학년·과목·학기·단원을 붙였다.

export const GRADES = [3, 4, 5, 6] as const;
export const SUBJECTS = ["korean", "math", "social", "science", "english"] as const;
export type Grade = (typeof GRADES)[number];
export type Subject = (typeof SUBJECTS)[number];
/** 1: 쉬움, 2: 보통, 3: 어려움 */
export type Level = 1 | 2 | 3;

export type Problem = {
  grade: Grade;
  subject: Subject;
  /** 그 학년에서 처음 배우는 학기 */
  semester: 1 | 2;
  /** 단원 이름 */
  unit: string;
  /** 성취기준 코드 (예: "[4과05-03]") */
  standard?: string;
  level: Level;
  prompt: string;
  /** choice: 보기 4개, ox: 보기 ["O", "X"] (순서를 섞지 않는다) */
  input: "choice" | "ox";
  choices: string[];
  /** 정답 보기의 글 (choices 가운데 하나) */
  answer: string;
  explanation: string;
};

export type ProblemQuery = {
  grade: Grade;
  subject: Subject;
  semester?: 1 | 2;
  unit?: string;
  level?: Level;
};
