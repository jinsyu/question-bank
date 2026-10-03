# 초등 문제 은행 (공용)

여러 교육용 앱이 함께 쓰는 초등 3~6학년 문제 은행의 **원본**입니다.
문항은 여기에서만 고치고, 각 앱은 동기화 스크립트로 최신 파일을 받아 갑니다.

- 형식: [questions/README.md](questions/README.md)
- 파일: `questions/g{학년}-{과목}.json` (korean, math, social, science, english)
  - `g{학년}-math.mathking.json`: math-king 생성기에서 뽑은 수학 문제

## 쓰는 곳

| 앱 | 받아 가는 명령 | 받는 위치 |
|---|---|---|
| class-rpg-game | `npm run questions:sync` | `content/questions/` |
| bluemarble | `pnpm questions:sync` | `src/data/questions/` |

앱들은 이 저장소가 `~/dev/question-bank`에 있다고 가정합니다.
다른 위치라면 `QUESTION_BANK_DIR` 환경 변수로 경로를 알려 주세요.

## 문항을 고칠 때

1. 이 저장소의 `questions/`를 고치고 커밋·푸시
2. 각 앱에서 동기화 명령 실행 → 바뀐 파일 커밋·푸시 (배포는 앱 저장소의 복사본으로 빌드됩니다)
