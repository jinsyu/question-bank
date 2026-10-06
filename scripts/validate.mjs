// 문제 은행 형식 검사: npm run check [파일...]
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

const DIR = "questions";
const SUBJECTS = ["korean", "math", "social", "science", "english"];
const ADULT_SUBJECTS = ["korean", "english", "general"]; // 성인(교사) 문항: adult-{과목}.json
const files = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(DIR).filter((f) => f.endsWith(".json")).map((f) => join(DIR, f));

let errors = 0;
const report = [];
const allQuestions = new Map(); // 문제+보기 → 파일 (다른 파일끼리 중복/덮어쓰기 감지)
const seenByGroup = new Map(); // 학년-과목 → 문제 문장 (같은 학년·과목은 파일이 여러 개여도 문장이 하나뿐이어야 한다)
for (const file of files) {
  // g4-math.json 또는 g4-math.mathking.json (같은 학년·과목의 추가 파일), 성인은 adult-general.json
  const m = basename(file).match(/^(g[1-6]|adult)-([a-z]+)(\.[\w-]+)?\.json$/);
  if (!m || !(m[1] === "adult" ? ADULT_SUBJECTS : SUBJECTS).includes(m[2])) {
    console.error(`${file}: 파일 이름 형식이 틀렸어요`);
    errors++;
    continue;
  }
  let list;
  try {
    list = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    console.error(`${file}: JSON 파싱 실패 ${e.message}`);
    errors++;
    continue;
  }
  const group = `${m[1]}-${m[2]}`;
  if (!seenByGroup.has(group)) seenByGroup.set(group, new Set());
  const seen = seenByGroup.get(group);
  const byDiff = { 1: 0, 2: 0, 3: 0 };
  const answerPos = [0, 0, 0, 0];
  list.forEach((q, i) => {
    const fail = (msg) => {
      console.error(`${file}#${i}: ${msg} — ${q.question?.slice(0, 30)}`);
      errors++;
    };
    if (![1, 2, 3].includes(q.difficulty)) fail("difficulty는 1~3");
    if (!["choice4", "ox"].includes(q.type)) fail("type은 choice4 또는 ox");
    if (![1, 2].includes(q.semester)) fail("semester는 1 또는 2");
    if (typeof q.unit !== "string" || !q.unit.trim() || q.unit.length > 20) fail("unit은 1~20자");
    if (typeof q.question !== "string" || q.question.length < 5 || q.question.length > 120) fail("question 길이 5~120");
    if (!Array.isArray(q.choices)) return fail("choices 배열 필요");
    if (q.type === "choice4" && q.choices.length !== 4) fail("choice4는 보기 4개");
    if (q.type === "ox" && JSON.stringify(q.choices) !== '["O","X"]') fail('ox 보기는 ["O","X"]');
    if (new Set(q.choices.map((c) => String(c).trim())).size !== q.choices.length) fail("보기 중복");
    if (q.choices.some((c) => typeof c !== "string" || !c.trim() || c.length > 30)) fail("보기는 1~30자 문자열");
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.choices.length) fail("answer 범위");
    if (typeof q.explanation !== "string" || q.explanation.length < 5 || q.explanation.length > 100) fail("explanation 길이 5~100");
    if (/모두 고르|알맞지 않은 것을 모두|그림을 보고|다음 글을 읽고/.test(q.question)) fail("지원하지 않는 문제 형식");
    // 보기가 말이 되는지: 문제가 정한 후보 밖의 보기, 길게 늘어진 소수, 셈 단위에 붙은 소수 (2026-10-01 던전에서 발견된 오류 유형)
    const listed = q.question.match(/((?:\d+(?:\.\d+)?[^\s,]{0,3},\s*)+\d+(?:\.\d+)?[^\s,]{0,3})\s*중에서\s*(?:정할|고를|택할|골라)/);
    if (listed) {
      const allowed = listed[1].split(",").map((x) => x.trim().match(/^\d+(?:\.\d+)?/)?.[0]);
      if (q.choices.some((c) => !allowed.includes(String(c).match(/^\d+(?:\.\d+)?/)?.[0]))) fail("문제가 정한 후보 밖의 보기");
    }
    if (q.choices.some((c) => /\.\d{5,}/.test(c) && !/\.\d{5,}/.test(q.choices[q.answer]))) fail("소수가 길게 늘어진 보기");
    if (q.choices.some((c) => /^\d+\.\d+ ?(원|개|명|가지|번|장|칸|마리|자루|권|대|쌍|송이|조각|상자|살|일|년|째|점|쪽|봉지|도막|자리)$/.test(c))) fail("셈 단위에 소수가 붙은 보기");
    if (seen.has(q.question)) fail("같은 학년·과목에 중복 문제");
    seen.add(q.question);
    const key = `${q.question}|${q.choices.join("|")}`;
    const other = allQuestions.get(key);
    if (other && other !== file) fail(`다른 파일(${basename(other)})과 같은 문제 — 파일이 덮어써졌는지 확인하세요`);
    allQuestions.set(key, file);
    byDiff[q.difficulty] = (byDiff[q.difficulty] ?? 0) + 1;
    if (q.type === "choice4") answerPos[q.answer]++;
  });
  report.push(`${basename(file)}: ${list.length}문항 (쉬움 ${byDiff[1]} / 보통 ${byDiff[2]} / 어려움 ${byDiff[3]}) 정답 위치 ${answerPos.join("/")}`);
}
console.log(report.join("\n"));
console.log(errors ? `❌ 오류 ${errors}개` : "✅ 형식 검사 통과");
process.exit(errors ? 1 : 0);
