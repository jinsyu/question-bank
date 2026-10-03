// math-king의 수학 문제를 문제 은행 형식으로 뽑아 questions/g{학년}-math.mathking.json 에 쓴다.
// 실행: npm run mathking  (math-king 저장소가 ../math-king 에 있어야 해요. 다른 곳이면 MATH_KING_DIR=경로)
// math-king은 읽기만 한다. 뽑은 뒤에는 npm run check → 커밋·푸시 → 각 앱에서 sync
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { convertProblem, type MkProblem } from "./mathking";

type Generator = { id: string; level: 1 | 2 | 3; make(rand: () => number): MkProblem };
type Unit = { grade: number; semester: 1 | 2; title: string; standards: { code: string; generators: Generator[] }[] };

const MK = resolve(process.env.MATH_KING_DIR ?? "../math-king");
if (!existsSync(`${MK}/src/content/index.ts`)) throw new Error(`math-king을 찾을 수 없어요: ${MK}`);
const { units } = (await import(`${MK}/src/content/index.ts`)) as { units: Unit[] };
const { createRandom } = (await import(`${MK}/src/lib/random.ts`)) as { createRandom: (seed: number) => () => number };

const GRADES = [3, 4, 5, 6];
/** 생성기 하나에서 뽑는 서로 다른 문제 수, 그만큼 뽑으려고 시도하는 횟수 */
const PER_GENERATOR = 8;
const TRIES = 80;
const DIR = "questions";

/**
 * 생성기별 처리 (2026-10-01 학년별 독립 검수 결과).
 * exclude: 범위 밖 계산·모순이라 가져오지 않는다 — math-king 원본을 고치면 여기서 뺀다
 * retag: 아직 안 배운 용어·계산을 써서 배우는 학기로 옮긴다
 */
const EXCLUDE: Record<string, string> = {
  "l3-add2-box": "□를 구하려면 (네 자리 수)−(세 자리 수)가 필요 [4수01-03]",
  "l3-add2-ineq": "□를 구하려면 (네 자리 수)−(세 자리 수)가 필요 [4수01-03]",
  "l3-sub1-wrong-op": "어떤 수를 구하려면 (네 자리 수)−(세 자리 수)가 필요 [4수01-03]",
  "dec-add": "소수 세 자리 덧셈 (4학년은 소수 두 자리까지 [4수01-16])",
  "dec-sub": "소수 세 자리 뺄셈 (4학년은 소수 두 자리까지 [4수01-16])",
  "l4-para-join": "긴 변이 짧은 변보다 짧게 나오는 모순",
  "l4-div-tens-check": "확인 식의 답이 문제 글에 그대로 나옴",
  "l4-cards-big": "카드 조건을 어긴 오답이라 답이 드러남 (오답은 생성기에서 만들어야 함)",
  "l4-dec3-cards": "카드 조건을 어긴 오답이라 답이 드러남 (오답은 생성기에서 만들어야 함)",
  "l4-jo-years": "네 자리 수로 나누는 계산이 필요 (4학년은 두 자리 수로 나누기까지 [4수01-07])",
  "l4-jo-times-back": "'□억에서 □'를 묻는데 보기에 억이 붙어 문장과 보기가 어긋남",
  "l6-dd-card": "몫이 소수 넷째 자리까지 나옴, 오답이 0.0001 차이",
};
const RETAG: Record<string, { semester: 1 | 2; unit?: string }> = {
  "l3-div-t-cards": { semester: 2, unit: "나눗셈" }, // '나누어떨어지다'와 곱셈구구 밖의 몫은 3-2 나눗셈
  "l3-table-cond": { semester: 2, unit: "나눗셈" }, // '나누어떨어집니다'는 3-2 나눗셈 용어
  "w5-tape-mixed": { semester: 2 }, // 풀이가 (대분수)×(자연수)를 써서 5-2 분수의 곱셈 뒤에
};
/** 3학년 1학기에는 '자연수'를 아직 배우지 않는다(3-2 분수 단원에서 처음) */
const plainNumbers = (text: string) => text.replace(/들어갈 수 있는 자연수/g, "들어갈 수 있는 수");

/** 문자열 → 32비트 시드 (FNV-1a) */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

for (const grade of GRADES) {
  // 손으로 만든 기존 수학 문제와 문장이 같으면 넣지 않는다 (같은 학년·과목에서 문제 문장은 하나뿐이어야 한다)
  const taken = new Set<string>((JSON.parse(readFileSync(`${DIR}/g${grade}-math.json`, "utf8")) as { question: string }[]).map((q) => q.question));
  const out: object[] = [];
  const skipped: Record<string, number> = {};
  const byLevel = [0, 0, 0];
  let usable = 0;
  let total = 0;
  for (const unit of units.filter((u) => u.grade === grade)) {
    for (const standard of unit.standards) {
      for (const gen of standard.generators) {
        total++;
        if (EXCLUDE[gen.id]) {
          skipped.excluded = (skipped.excluded ?? 0) + 1;
          continue;
        }
        const retag = RETAG[gen.id];
        const semester = retag?.semester ?? unit.semester;
        let made = 0;
        const why: Record<string, number> = {};
        for (let i = 0; i < TRIES && made < PER_GENERATOR; i++) {
          const problem = gen.make(createRandom(i * 7919 + 13));
          // 오답 고르기와 보기 섞기는 문제마다 다른 난수로 (생성기와 같은 난수를 이어 쓰면 정답 위치가 한쪽으로 쏠린다)
          const r = convertProblem(problem, createRandom(hash(`${gen.id}#${i}`)));
          if ("skip" in r) {
            why[r.skip] = (why[r.skip] ?? 0) + 1;
            continue;
          }
          if (grade === 3 && semester === 1) {
            r.question = plainNumbers(r.question);
            r.explanation = plainNumbers(r.explanation);
          }
          if (taken.has(r.question)) continue;
          taken.add(r.question);
          made++;
          byLevel[gen.level - 1]++;
          out.push({
            difficulty: gen.level, type: "choice4", ...r,
            ...(standard.code ? { standard: standard.code } : {}),
            semester, unit: retag?.unit ?? unit.title, source: `math-king:${gen.id}`,
          });
        }
        if (made) usable++;
        else {
          const top = Object.entries(why).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "duplicate";
          skipped[top] = (skipped[top] ?? 0) + 1;
        }
      }
    }
  }
  writeFileSync(`${DIR}/g${grade}-math.mathking.json`, `${JSON.stringify(out, null, 1)}\n`);
  console.log(`g${grade}: ${out.length}문항 (쉬움 ${byLevel[0]} / 보통 ${byLevel[1]} / 어려움 ${byLevel[2]}) · 생성기 ${usable}/${total} · 제외 ${JSON.stringify(skipped)}`);
}
