import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GRADES, SUBJECTS, getProblems, type Grade, type Subject } from "./index";

const raw = (grade: number, subject: string) => JSON.parse(readFileSync(`questions/g${grade}-${subject}.json`, "utf8")) as Record<string, unknown>[];

describe("getProblems", () => {
  it("20개 파일의 모든 문항을 순서대로, 내용을 바꾸지 않고 돌려준다", async () => {
    for (const grade of GRADES) {
      for (const subject of SUBJECTS) {
        const list = raw(grade, subject);
        const problems = await getProblems({ grade, subject });
        expect(problems.length, `${grade}-${subject}`).toBe(list.length);
        problems.forEach((p, i) => {
          const q = list[i] as { difficulty: number; type: string; question: string; choices: string[]; answer: number; explanation: string; semester: number; unit: string; standard?: string };
          expect(p).toEqual({
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
            ...(q.standard ? { standard: q.standard } : {}),
          });
          // 정답 글로 정답 보기를 하나로 되찾을 수 있어야 한다
          expect(p.choices.filter((c) => c === p.answer).length, p.prompt).toBe(1);
        });
      }
    }
  });

  it("학기·단원·난이도로 거른다", async () => {
    const all = await getProblems({ grade: 4, subject: "science" });
    const unit = all[0].unit;
    const picked = await getProblems({ grade: 4, subject: "science", semester: all[0].semester, unit, level: all[0].level });
    expect(picked.length).toBeGreaterThan(0);
    expect(picked).toEqual(all.filter((p) => p.semester === all[0].semester && p.unit === unit && p.level === all[0].level));
    expect(await getProblems({ grade: 4, subject: "science", unit: "없는 단원" })).toEqual([]);
  });

  it("없는 학년·과목은 오류", async () => {
    await expect(getProblems({ grade: 2 as Grade, subject: "math" })).rejects.toThrow("없는 학년·과목");
    await expect(getProblems({ grade: 3, subject: "art" as Subject })).rejects.toThrow("없는 학년·과목");
  });
});
