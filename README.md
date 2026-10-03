# 초등 문제 은행 (공용)

여러 교육용 앱이 함께 쓰는 초등 3~6학년 문제 은행의 **원본**입니다.
문항은 여기에서만 고치고, 각 앱은 이 저장소를 패키지로 설치해 `getProblems`로 문제를 받아 갑니다.

- 형식: [questions/README.md](questions/README.md)
- 수학 문제 생성기와 그림 컴포넌트: `src/math/` (math-king에서 옮겨 옴. 생성기는 여기에서만 고친다)
- 파일: `questions/g{학년}-{과목}.json` (korean, math, social, science, english)
  - `g{학년}-math.mathking.json`: math-king 생성기에서 뽑은 수학 문제

## 앱에서 쓰기

```bash
pnpm add github:jinsyu/question-bank   # 설치한 시점의 커밋으로 고정된다
pnpm update question-bank              # 최신 문항으로 올리기 → 앱 배포
```

```ts
import { getProblems } from "question-bank";

const problems = await getProblems({ grade: 4, subject: "science" }); // semester, unit, level로 거를 수 있다
```

- 문제 모양: [src/types.ts](src/types.ts)의 `Problem` (`prompt`, `choices`, `answer`(정답 보기의 글), `level`, `input`, `semester`, `unit` …)
- TS 원본을 그대로 내보낸다. Next는 `next.config`에 `transpilePackages: ["question-bank"]`가 필요하다.
- 지금 `getProblems`가 돌려주는 것은 기본 20개 파일이다 (`*.mathking.json`과 생성기 문제는 들어 있지 않다).

수학 생성기(풀 때마다 새 숫자, 그림 문제 포함)는 아래 경로로 가져온다.

```ts
import { units } from "question-bank/math/content";            // 단원 → 차시 → 생성기
import type { Problem } from "question-bank/math/content/types";
import { createRandom } from "question-bank/math/lib/random";
import { Figure } from "question-bank/math/components/figure";  // 그림 컴포넌트 (react 필요)
```

- 그림 컴포넌트는 Tailwind 클래스를 쓴다. 앱의 CSS에 `@source "../../node_modules/question-bank/src/math/components";`를 넣는다.
- Playwright처럼 `node_modules`의 TS를 변환하지 않는 도구는 `NODE_OPTIONS='--import tsx'`로 실행한다.

## 쓰는 곳

| 앱 | 받는 방법 |
|---|---|
| math-king (math.gyosil.app) | 패키지의 수학 생성기·그림 컴포넌트 |
| math-battle-arena (mathking.site) | 패키지의 수학 생성기·그림 컴포넌트 |
| bluemarble | 테스트 프로젝트. 자체 sync 스크립트(`pnpm questions:sync`)로 기본 20개 JSON을 직접 받아 간다 (패키지로 전환하지 않음) |
| class-rpg-game | 아직 연결 안 함 (지금은 자체 복사본 `content/questions/` 사용) |

## 처음 한 번

```bash
npm install
```

## 문항을 추가하거나 고칠 때

1. 문항 만들기
   - 직접 쓰기: `questions/g{학년}-{과목}.json` 배열에 추가하거나 고친다 (형식은 [questions/README.md](questions/README.md))
   - 수학 생성기 고치기: `src/math/content/`를 고친다 (검사는 `src/math/__tests__/`)
   - 수학 생성기에서 JSON으로 뽑기: `npm run mathking` (`*.mathking.json`은 손으로 고치지 않는다)
2. `npm run check` — 형식 검사
3. `npm test`
4. 커밋·푸시
5. 각 앱에서 `pnpm update question-bank` → 배포

## 명령

| 명령 | 하는 일 |
|---|---|
| `npm run check` | 형식 검사 (`questions/` 전체, 또는 `npm run check -- 파일...`) |
| `npm run mathking` | `src/math/content`의 생성기에서 `g3~g6-math.mathking.json`을 다시 뽑는다 |
| `npm test` | `getProblems`, 수학 생성기 검사(`src/math/__tests__/`), 문제 변환기(`scripts/mathking.ts`) 테스트 |
| `npm run typecheck` | 타입 검사 |

> `npm run mathking`은 그 시점의 생성기로 파일 전체를 다시 만든다. 생성기가 바뀌었으면 결과도 달라지니, 실행 후 `git diff`로 바뀐 내용을 확인하고 커밋한다.

## 주의

- 공개 저장소다. 비밀 값은 절대 넣지 않는다.
- 앱은 `Problem` 모양에 의존한다. `src/types.ts`의 필드를 바꾸면 각 앱도 함께 바꿔야 한다. JSON 파일의 필드나 파일 이름을 바꾸면 `src/index.ts`를 함께 바꾼다 (bluemarble의 sync 스크립트도 이 파일 이름·필드를 쓴다).
