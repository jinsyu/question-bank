// 문제 패키지 입구: 앱은 getProblems 하나로 문제를 받아 간다.
import { GRADES, SUBJECTS, type Grade, type Problem, type ProblemQuery, type Subject } from "./types";

export { GRADES, SUBJECTS } from "./types";
export type { Grade, Level, Problem, ProblemQuery, Subject } from "./types";

/** questions/*.json 한 문항 (형식: questions/README.md) */
type BankQuestion = {
  difficulty: 1 | 2 | 3;
  type: "choice4" | "ox";
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
  semester: 1 | 2;
  unit: string;
  standard?: string;
};

// 파일을 필요한 것만 불러온다 (번들러가 정적으로 나눌 수 있게 경로를 모두 적는다)
const LOADERS: Record<`${Grade}-${Subject}`, () => Promise<{ default: unknown }>> = {
  "3-korean": () => import("../questions/g3-korean.json", { with: { type: "json" } }),
  "3-math": () => import("../questions/g3-math.json", { with: { type: "json" } }),
  "3-social": () => import("../questions/g3-social.json", { with: { type: "json" } }),
  "3-science": () => import("../questions/g3-science.json", { with: { type: "json" } }),
  "3-english": () => import("../questions/g3-english.json", { with: { type: "json" } }),
  "4-korean": () => import("../questions/g4-korean.json", { with: { type: "json" } }),
  "4-math": () => import("../questions/g4-math.json", { with: { type: "json" } }),
  "4-social": () => import("../questions/g4-social.json", { with: { type: "json" } }),
  "4-science": () => import("../questions/g4-science.json", { with: { type: "json" } }),
  "4-english": () => import("../questions/g4-english.json", { with: { type: "json" } }),
  "5-korean": () => import("../questions/g5-korean.json", { with: { type: "json" } }),
  "5-math": () => import("../questions/g5-math.json", { with: { type: "json" } }),
  "5-social": () => import("../questions/g5-social.json", { with: { type: "json" } }),
  "5-science": () => import("../questions/g5-science.json", { with: { type: "json" } }),
  "5-english": () => import("../questions/g5-english.json", { with: { type: "json" } }),
  "6-korean": () => import("../questions/g6-korean.json", { with: { type: "json" } }),
  "6-math": () => import("../questions/g6-math.json", { with: { type: "json" } }),
  "6-social": () => import("../questions/g6-social.json", { with: { type: "json" } }),
  "6-science": () => import("../questions/g6-science.json", { with: { type: "json" } }),
  "6-english": () => import("../questions/g6-english.json", { with: { type: "json" } }),
};

function toProblem(q: BankQuestion, grade: Grade, subject: Subject): Problem {
  const problem: Problem = {
    grade,
    subject,
    semester: q.semester,
    unit: q.unit,
    level: q.difficulty,
    prompt: q.question,
    input: q.type === "ox" ? "ox" : "choice",
    choices: q.choices,
    answer: q.choices[q.answer],
    explanation: q.explanation,
  };
  if (q.standard) problem.standard = q.standard;
  return problem;
}

/** 학년·과목의 문제를 파일에 적힌 순서대로 돌려준다. semester·unit·level을 주면 그 조건에 맞는 것만 */
export async function getProblems(query: ProblemQuery): Promise<Problem[]> {
  const { grade, subject, semester, unit, level } = query;
  if (!GRADES.includes(grade) || !SUBJECTS.includes(subject)) throw new Error(`없는 학년·과목이에요: ${grade}-${subject}`);
  const list = (await LOADERS[`${grade}-${subject}`]()).default as BankQuestion[];
  return list
    .filter((q) => (semester === undefined || q.semester === semester) && (unit === undefined || q.unit === unit) && (level === undefined || q.difficulty === level))
    .map((q) => toProblem(q, grade, subject));
}
