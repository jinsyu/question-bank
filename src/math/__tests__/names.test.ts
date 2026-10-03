import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { NAMES as G1 } from "../content/lessons/g1";
import { NAMES as G2 } from "../content/lessons/g2";
import { NAMES as G3 } from "../content/lessons/g3-kit";
import { NAMES as G4 } from "../content/lessons/g4";
import { NAMES as G5 } from "../content/lessons/g5";
import { NAMES as G6 } from "../content/lessons/g6-util";

/**
 * 등장인물 이름 '하루'는 "하루는 5/8판을 먹고"처럼 '1일'로 읽혀 전 학년 이름 목록에서 뺐다.
 * 시간 단위 '하루'(하루에 몇 쪽, 하루는 24시간)는 그대로 쓰므로 화면 글이 아니라 이름 목록을 검사한다.
 */

const SRC = join(__dirname, "..");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "__tests__" ? [] : sourceFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

describe("등장인물 이름", () => {
  it.each([
    ["1학년", G1],
    ["2학년", G2],
    ["3학년", G3],
    ["4학년", G4],
    ["5학년", G5],
    ["6학년", G6],
  ])("%s 이름 목록에 '하루'가 없고, 이름이 겹치지 않는다", (_, names) => {
    expect(names).not.toContain("하루");
    expect(new Set(names).size).toBe(names.length);
  });

  it("생성기 전체(words처럼 내보내지 않는 목록 포함)의 배열 안에 \"하루\" 낱말이 없다", () => {
    const found = sourceFiles(join(SRC, "content"))
      .concat(sourceFiles(join(SRC, "lib")))
      .filter((f) => /\[[^\]]*["'`]하루["'`][^\]]*\]/.test(readFileSync(f, "utf8")));
    expect(found).toEqual([]);
  });
});
