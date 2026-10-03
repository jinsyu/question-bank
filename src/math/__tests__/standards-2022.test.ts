import { describe, expect, it } from "vitest";
import { units } from "../content";
import { STANDARD_CODES, STANDARDS_2022 } from "../content/standards-2022";

/** 성취기준 코드: 모든 차시에 2022 개정 수학 성취기준 코드가 있고, 학년군과 맞는다(docs/audit-v2 코드 표) */
const BAND: Record<number, string> = { 1: "2수", 2: "2수", 3: "4수", 4: "4수", 5: "6수", 6: "6수" };

describe("성취기준 코드", () => {
  it("2022 개정 수학 성취기준 목록은 121개이고 코드가 겹치지 않는다", () => {
    expect(STANDARDS_2022).toHaveLength(121);
    expect(STANDARD_CODES.size).toBe(121);
  });

  const all = units.flatMap((u) => u.standards.map((s) => [`${u.id}/${s.id}`, u.grade, s.code] as const));

  it("차시는 369개다", () => {
    expect(all).toHaveLength(369);
  });

  it.each(all)("%s: 코드가 비어 있지 않고 목록에 있으며 학년군과 맞다", (_id, grade, code) => {
    const codes = code.split(" ");
    expect(code).not.toBe("");
    for (const c of codes) {
      expect(STANDARD_CODES.has(c), c).toBe(true);
      expect(c.slice(1, 3), c).toBe(BAND[grade]);
    }
  });

  it("4-2 소수의 크기 비교는 [4수01-14]", () => {
    const s = units.find((u) => u.id === "g4-s2-decimal-add-sub")!.standards.find((x) => x.id === "dec-compare")!;
    expect(s.code).toBe("[4수01-14]");
  });
});
