# 초등 문제 은행 (공용)

여러 교육용 앱이 함께 쓰는 초등 3~6학년 문제 은행의 **원본**입니다.
문항은 여기에서만 고치고, 각 앱은 동기화 스크립트로 최신 파일을 받아 갑니다.

- 형식: [questions/README.md](questions/README.md)
- 파일: `questions/g{학년}-{과목}.json` (korean, math, social, science, english)
  - `g{학년}-math.mathking.json`: math-king 생성기에서 뽑은 수학 문제

## 쓰는 곳

| 앱 | 받는 파일 | 받아 가는 명령 | 받는 위치 |
|---|---|---|---|
| bluemarble | 기본 20개 | `pnpm questions:sync` (`dev`·`build` 때 자동) | `src/data/questions/` |
| class-rpg-game | 기본 20개 + mathking 4개 | 아직 연결 안 함 (지금은 자체 복사본 사용) | `content/questions/` |

앱은 기본으로 GitHub(`jinsyu/question-bank`의 `main`)에서 받아 갑니다.
아직 푸시하지 않은 문항을 미리 보려면 앱에서 `QUESTION_BANK_DIR=~/dev/question-bank`(이 저장소 폴더)를 지정하세요.

## 처음 한 번

```bash
npm install
```

## 문항을 추가하거나 고칠 때

1. 문항 만들기
   - 직접 쓰기: `questions/g{학년}-{과목}.json` 배열에 추가하거나 고친다 (형식은 [questions/README.md](questions/README.md))
   - 수학 생성기에서 뽑기: math-king을 고친 뒤 `npm run mathking` (`*.mathking.json`은 손으로 고치지 않는다)
2. `npm run check` — 형식 검사
3. 커밋·푸시
4. 각 앱에서 동기화 (GitHub 캐시 때문에 푸시 후 최대 약 5분 늦게 반영될 수 있음)

## 명령

| 명령 | 하는 일 |
|---|---|
| `npm run check` | 형식 검사 (`questions/` 전체, 또는 `npm run check -- 파일...`) |
| `npm run mathking` | `../math-king`의 생성기에서 `g3~g6-math.mathking.json`을 다시 뽑는다 (다른 위치면 `MATH_KING_DIR=경로`) |
| `npm test` | math-king 문제 변환기(`scripts/mathking.ts`) 테스트 |

> `npm run mathking`은 그 시점의 math-king으로 파일 전체를 다시 만든다. math-king이 바뀌었으면 결과도 달라지니, 실행 후 `git diff`로 바뀐 내용을 확인하고 커밋한다.

## 주의

- 공개 저장소다. 비밀 값은 절대 넣지 않는다.
- bluemarble은 `difficulty`, `type`, `question`, `choices`, `answer`, `explanation`, `semester`, `unit`을 쓴다. 필드 이름이나 파일 이름을 바꾸면 각 앱의 sync 스크립트와 로더도 함께 바꿔야 한다.
