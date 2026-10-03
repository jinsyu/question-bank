# question-bank

초등 1~6학년 문제를 만드는 유일한 곳. 앱(math-king, arena, rpg)은 이 저장소를 패키지로 받아 쓴다. 구조와 배경은 `README.md`, `docs/handoff-unify-question-bank.md`.

## "문항 만들어 줘" 요청을 받으면

1. `elementary-problem-generator` 스킬로 문항을 만들고 검수한다 (성취기준, 학년 범위, 정답 하나).
   - 글 문항(5과목 4지선다·OX): `questions/g{학년}-{과목}.json`에 추가. 형식은 `questions/README.md`
   - 수학 생성기(풀 때마다 새 숫자, 그림): `src/math/content/`를 고치고 검사는 `src/math/__tests__/`
   - 생성기 문제를 rpg에도 넣으려면 `npm run mathking`으로 `*.mathking.json`을 다시 뽑는다
2. `npm run check`, `npm run typecheck`, `npm test`로 검사한다.
3. 검사를 통과하면 **사용자 확인 없이** 커밋한다 (사용자가 정한 예외, 2026-10-04). 검사가 실패하면 커밋하지 않고 고친다.
4. `npm run deploy`를 실행한다. 푸시, 앱 반영, 배포까지 이 명령이 한다.
   - 바뀐 폴더에 따라 앱을 고른다: `questions/` → rpg, `src/math/` → math-king·arena
   - 앱에 생기는 "question-bank 갱신" lock 커밋도 확인 없이 커밋·푸시한다
   - arena(mathking.site)는 이 맥에서 돌아 **무조건 재시작**한다 (사용자 결정). 진행 중인 방은 끊긴다
   - rpg 운영 DB 적재는 Vercel 운영 배포가 한다
5. 실패하면 스크립트가 멈추고 그 앱은 원래대로 돌려놓는다. 원인을 고친 뒤 다시 실행한다.
6. 끝나면 무엇을 추가했는지(학년·과목·단원·문항 수)와 어느 앱에 반영됐는지 보고한다.

확인 없이 진행하는 것은 이 문항 작업 흐름뿐이다. 스크립트·구조·다른 저장소의 코드를 바꾸는 작업은 전역 규칙대로 커밋 전에 확인받는다.

## 규칙

- 문항과 생성기는 여기에서만 고친다. 앱 저장소의 lock 파일은 손으로 고치지 않는다.
- 공개 저장소다. 비밀 값은 절대 넣지 않는다.
- `*.mathking.json`은 손으로 고치지 않는다 (`npm run mathking`으로 다시 만든다).
