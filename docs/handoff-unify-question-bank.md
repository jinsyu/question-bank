# 핸드아웃: 문제 생성·사용처 단일화 (question-bank 패키지화)

- 작성일: 2026-10-03
- 작성한 곳: question-bank 세션
- 작업 위치: `~/dev/question-bank` (관련: `~/dev/math-king`, `~/dev/math-battle-arena`, `~/dev/bluemarble`, `~/dev/class-rpg-game`)
- 상태: **공개 여부 결정됨(공개 유지).** 남은 결정은 "이 방향으로 갈지" 1가지 (아래 4장)

---

## 1. 목표

사용자 요구: **"문제 생성과 사용처를 단일화하고 싶다."**
- 문제를 만드는 곳은 question-bank 하나로
- 모든 앱이 문제를 받아 가는 방식도 하나로
- rpg(class-rpg-game)는 문항 풀이 기록(DB) 때문에 **보류**. 설계는 나중에 붙일 수 있게만 해 둔다

## 2. 현재 구조 (조사로 확인한 사실)

### 도메인과 저장소 (이름이 헷갈리니 주의)
| 주소 | 저장소 | 공개 여부 | 문제 출처 |
|---|---|---|---|
| math.gyosil.app | `~/dev/math-king` (Next 16) | PRIVATE | 수학 생성기 코드 `src/content/**` (약 4.8만 줄) + `src/lib/random.ts`. 문제를 매번 새로 생성 |
| mathking.site | `~/dev/math-battle-arena` (Vite + Express + socket.io, 이 맥에서 cloudflared 터널로 운영) | PRIVATE | math-king 코드를 **손으로 복사**: `shared/math/content`, `shared/math/lib/random.ts`, `client/src/math/*` 그림 컴포넌트 6개. alias `@` → `shared/math` (`vite.config.ts`) |
| (bluemarble) | `~/dev/bluemarble` (Next 16, pnpm) | PRIVATE | question-bank JSON 기본 20개를 `scripts/sync-questions.mjs`로 받아 `src/data/questions/`에 씀. `dev`·`build` 때 자동 |
| rpg.gyosil.app | `~/dev/class-rpg-game` | PRIVATE | 자체 복사본 `content/questions/` → `load.mjs`로 Supabase `rpg.questions`. **보류** |
| — | `~/dev/question-bank` | **PUBLIC** | 문항 JSON 원본 |

- 출처: `math-king/src/lib/site.ts:6`, `math-battle-arena/scripts/cloudflared-mathking.yml`, `gyosil/src/lib/site.ts`

### question-bank 내용
- `questions/g{3~6}-{korean,math,social,science,english}.json`: 손으로 만든 문항 20개 파일, 약 5,500문항
- `questions/g{3~6}-math.mathking.json`: math-king 생성기 결과를 글 4지선다로 변환해 굳힌 것, 약 5,500문항. 지금 쓰는 곳은 rpg뿐
- 형식: `questions/README.md` (difficulty, type, question, choices, answer, explanation, standard?, semester, unit)

### 이미 확인된 문제점
1. **arena 복사본이 원본과 어긋나 있음**: `content/words/words56.ts` 한 파일. arena 쪽에 "가진 장수보다 많이 쓸 수 없게" 버그 수정(`randInt(rand, 5, Math.min(20, (a + b) * c - 1))`)이 있고 math-king에는 없음. 통합 전에 math-king으로 옮겨야 함
2. arena의 그림 컴포넌트 6개(`chart-layout.ts`, `charts.tsx`, `figure-note.ts`, `figure.tsx`, `long-division.tsx`, `math-text.tsx`)는 현재 math-king `src/components/`와 동일. `paper.css`는 arena에만 있음
3. `*.mathking.json`은 math-king `1eae578`(2026-10-01) 시점 결과. **지금 math-king으로 다시 뽑으면 내용이 달라짐** (예: g4 1,087 → 1,137문항, 4-1 어림셈 신설 등)

## 3. 이 세션에서 한 일 (question-bank, 커밋 `f8b2c63`로 main에 푸시됨)

rpg에 있던 문항 도구를 question-bank로 옮김 (rpg 원본은 그대로 둠):

| 파일 | 원본 | 변경 |
|---|---|---|
| `scripts/validate.mjs` | `class-rpg-game/scripts/questions/validate.mjs` | 경로 `content/questions` → `questions`, 주석 |
| `scripts/import-mathking.mts` | 같은 폴더 | 경로, 주석 (EXCLUDE·RETAG 그대로) |
| `scripts/mathking.ts`, `scripts/mathking.test.ts` | 같은 폴더 | 주석 한 줄 |
| `package.json` (`check`, `mathking`, `test`), `package-lock.json`, `.gitignore` | 신규 | vitest 5.0.1 (rpg와 같음) |
| `README.md`, `questions/README.md` | 수정 | 문항 추가 흐름·명령, 사실과 다르던 설명 정정 |
| `docs/handoff-unify-question-bank.md` | 신규 | 이 문서 |

검증 결과 (모두 통과):
- `npm run check` 통과. 출력이 rpg 원본 validate 출력과 바이트 동일
- `npm test` 30개 통과
- 같은 math-king으로 돌린 새 추출 스크립트 결과 = rpg 원본 스크립트 결과 (4개 파일 바이트 동일, `npm run mathking` 명령 그대로)
- math-king `1eae578`을 `git archive`로 꺼내 돌리면 커밋된 `*.mathking.json` 4개가 바이트 동일하게 재현됨
- `questions/*.json` 변경 없음. 다른 저장소는 하나도 수정하지 않음

커밋: `f8b2c63 문항 검사·math-king 추출 도구를 rpg에서 이동, 단일화 핸드아웃 추가`

## 4. 제안한 방향과 남은 결정

### 제안: question-bank를 "문제 패키지" 하나로
```
question-bank (문제를 만드는 유일한 곳)
├ 5과목 JSON 문항
├ 수학 생성기 (math-king src/content + random.ts에서 이동)
├ 그림 컴포넌트 (math-king src/components의 6개에서 이동)
└ 공통 함수 getProblems({ grade, subject, semester, unit, level, ... })
      → JSON 문항과 생성기 문항을 같은 모양의 문제 객체로 반환
          ↓ 모든 앱이 "question-bank": "github:jinsyu/question-bank" 로 import
math-king · arena · bluemarble · (rpg 보류)
```
- 사라지는 것: bluemarble sync 스크립트, arena 손 복사본, (앱 입장에서) mathking.json 변환 단계
- 최신화: 앱에서 `pnpm update question-bank` → 배포 (커밋 단위로 고정돼 안전)
- 모든 걸 JSON으로 굳히는 반대 방향은 기각함: "풀 때마다 새 숫자"와 그림 문제가 사라짐

### 결정 사항
- **공개 여부: 공개 유지** (2026-10-03 사용자 결정). math-king 생성기 코드가 question-bank로 옮겨지면 공개된다는 점을 사용자가 알고 선택함. 앱들은 토큰 없이 `github:jinsyu/question-bank`로 받으면 됨. 비밀 값은 절대 넣지 말 것

### 사용자 결정 필요 (아직 답 없음)
1. **이 방향(패키지화)으로 갈지**

### 제안한 진행 순서 (단계마다 검증하고, 커밋 전 사용자 확인)
1. 패키지 틀: 공통 문제 모양 + `getProblems` + 5과목 JSON. bluemarble을 sync → 패키지로 바꾸고 출제 결과가 같은지 확인
2. 생성기 이동: math-king `src/content`, `random.ts`, 그림 컴포넌트 → 패키지. math-king은 import로 전환. math-king 기존 vitest·e2e(playwright) 통과 확인. Next는 `transpilePackages` 필요할 수 있음
3. arena 전환: **먼저 words56 수정을 반영**한 뒤 복사본 삭제 → 패키지 import. `pnpm test`, `pnpm typecheck` 확인
4. rpg (보류): 나중에 패키지에서 뽑아 DB에 적재. 문항 기록(id 안정성 등)은 그때 따로 다룸

규모가 커서 planner 서브에이전트로 spec.md·plan.md부터 만드는 것도 제안했음.

## 5. 주의

- 사용자 전역 규칙: 한국어 답변, 요청 안 한 기능 추가 금지, 작은 단계로, **git commit 전 반드시 사용자 확인** (한국어로 간결하게)
- 여러 저장소에 걸친 작업이라 사용자가 "절대 실수 없게"를 강조함. 이번처럼 원본과 바이트 비교 등으로 증거를 남길 것
- 임시 실행은 scratchpad에서. 다른 저장소의 작업 트리를 바꾸지 말 것 (math-king 과거 시점은 `git archive`로 꺼냄)
- **bluemarble에 다른 세션의 변경이 진행 중**: 이 세션 도중 HEAD가 `41fa670` → `9b4b744`로 바뀌었고 `src/components/mockup/HostMockup.tsx`가 수정 상태. 건드리기 전에 상태 확인할 것
- 기존 미추적 파일(내 작업 아님): `class-rpg-game/docs/indischool/`, `math-king/.claude/`
- rpg에서 문항을 고치면 question-bank와 어긋나니, rpg 연결 전까지 문항 수정은 question-bank에서만
- bluemarble은 `src/lib/bank.ts` `LOADERS`와 `bank.test.ts`(보기 중복, 정답 범위, 난이도 1~3 검사)가 문항 형식에 의존
- 이전 핸드아웃: `~/dev/bluemarble/docs/handoff-question-bank-to-rpg.md` (rpg 연결 계획, 보류 중)
