# 핸드아웃: 문제 생성·사용처 단일화 (question-bank 패키지화)

- 처음 작성: 2026-10-03 / 갱신: 2026-10-04
- 작업 위치: `~/dev/question-bank` (관련: `~/dev/math-king`, `~/dev/math-battle-arena`, `~/dev/bluemarble`, `~/dev/class-rpg-game`)
- 상태: **완료** (패키지 틀, 생성기 이동 + math-king 전환, arena 전환, rpg 연결). 남은 것은 5장 끝의 두 가지

---

## 1. 목표

사용자 요구: **"문제 생성과 사용처를 단일화하고 싶다."**
- 문제를 만드는 곳은 question-bank 하나로
- 모든 앱이 문제를 받아 가는 방식도 하나로 (패키지 `github:jinsyu/question-bank`)

## 2. 지금 구조

```
question-bank (PUBLIC, 문제를 만드는 유일한 곳)
├ questions/*.json            5과목 문항 (기본 20개 + *.mathking.json 4개)
├ src/index.ts, types.ts      getProblems({ grade, subject, semester?, unit?, level? }) → Problem[]
├ src/math/content/           수학 생성기 (math-king에서 이동, 84개 파일)
├ src/math/lib/random.ts
├ src/math/components/        그림 컴포넌트 6개 (react, Tailwind 클래스)
└ src/math/__tests__/         생성기 검사 테스트
```

| 주소 | 저장소 | 문제를 받는 방법 | 반영 방법 |
|---|---|---|---|
| math.gyosil.app | `~/dev/math-king` (Next 16, Vercel) | `question-bank/math/...` import | lock 파일의 question-bank 커밋을 올려 푸시 → Vercel 자동 배포 |
| mathking.site | `~/dev/math-battle-arena` (Vite + Express, 이 맥에서 launchd로 운영) | `question-bank/math/...` import | 아래 4장 |
| (bluemarble) | `~/dev/bluemarble` | 자체 sync 스크립트로 기본 20개 JSON을 직접 받음 | 테스트 프로젝트라 전환하지 않기로 함 (사용자 결정) |
| rpg.gyosil.app | `~/dev/class-rpg-game` | 패키지의 `questions/*.json` → Supabase `rpg.questions` | 5장 |

결정 사항
- 공개 여부: **공개 유지** (2026-10-03). 비밀 값은 절대 넣지 말 것
- 배포 형태: **TS 원본 그대로** 내보낸다 (빌드 없음). 앱 쪽에 필요한 것:
  - Next: `transpilePackages: ["question-bank"]`
  - Tailwind(그림 컴포넌트를 쓸 때): CSS에 `@source "../../node_modules/question-bank/src/math/components";`
  - Playwright: `NODE_OPTIONS='--import tsx'` (node_modules의 TS를 변환하지 못함)
  - Vite, vitest, tsx는 설정 없이 동작

## 3. 한 일 (커밋)

| 저장소 | 커밋 | 내용 |
|---|---|---|
| question-bank | `f30ba82` | 패키지 틀: 공통 문제 모양 `Problem` + `getProblems` |
| question-bank | `1487f26` | 수학 생성기·그림 컴포넌트·검사 테스트를 math-king에서 이동. `npm run mathking`이 옮겨 온 생성기를 씀 |
| question-bank | `bb3c357` | `words56.ts` 수정 (arena에만 있던 "가진 장수보다 많이 쓰지 않게") |
| math-king | `3eb3acf` + `bbd71dd` | 패키지로 전환. `3eb3acf`는 실수로 삭제만 들어간 커밋(배포 실패)이고 `bbd71dd`가 나머지 |
| math-king | `d3d8edd` | question-bank `bb3c357`로 갱신 |
| math-battle-arena | `c3ff8ee` | 복사본(`shared/math`, 그림 컴포넌트 6개) 삭제, 패키지로 전환. `paper.css`는 arena 고유라 남김 |

검증으로 남긴 증거
- 생성기 출력: math-king 원본 대 question-bank 복사본 바이트 동일 (생성기 1,985개 × 40문제)
- `words56` 수정 후 question-bank 출력 = arena 복사본 출력 (바이트 동일)
- math-king: 미리 만든 HTML 582쪽 전후 동일, vitest 4,135개, e2e 86개 통과
- arena: 서버 `makeProblem` 출력 8,210문제와 클라이언트 `dist` 전후 바이트 동일
- 테스트 수: math-king 원래 9,503 = question-bank로 옮긴 5,362 + math-king에 남은 4,141 (이름 검사를 나눠 지금은 4,135)

순수 복사가 아닌 부분
- `quality-g4`의 느린 테스트 1개에 시간 제한 30초 (원래 5초 제한을 넘겨 실패하던 것)
- `names.test.ts`를 둘로 나눔 (학년별 이름은 question-bank, 친구 풀이 이름은 math-king)
- math-king CSS에서 `.grow`, `.ring`, `.transform` 규칙이 사라짐 (생성기 변수 이름을 Tailwind가 오인해 만들던 것, 쓰는 곳 없음)

## 4. 생성기를 고쳤을 때 앱에 반영하는 법

1. question-bank에서 고치고 `npm test`, `npm run typecheck`, `npm run check` → 커밋·푸시
2. math-king: `pnpm-lock.yaml`에서 question-bank 커밋 해시를 새 것으로 바꾸고(4곳) `pnpm install --frozen-lockfile` → 검증 → 푸시
   - `pnpm update question-bank`는 다른 의존성(rolldown 등)까지 올리니 주의
3. arena: 같은 방법으로 lock 갱신·푸시 후, 운영 폴더(`~/dev/math-battle-arena`)에서
   `git pull` → `pnpm install --frozen-lockfile` → `pnpm build` → `launchctl kickstart -k gui/$(id -u)/site.mathking.server`
   - 재시작하면 진행 중인 방이 끊긴다. 접속자 확인: `lsof -a -p <서버 pid> -iTCP -sTCP:ESTABLISHED`

## 5. rpg 연결 (2026-10-04 완료)

rpg 구조
- 게임은 파일이 아니라 **Supabase `rpg.questions` 테이블**에서 문제를 하나씩 뽑는다 (`rpg.issue_question`, 로컬 측정 약 2ms). 형식은 4지선다·OX뿐
- rpg는 question-bank를 개발 의존성으로 받고, `npm run questions:load`가 `node_modules/question-bank/questions` → DB로 적재한다
- 같은 문항인지는 **(학년, 과목, 문제 문장)** 으로 판단. 문제 은행에서 빠진 문항은 `disabled` (행을 지우지 않는다)
- 풀이 기록 `answer_logs`는 업적·랭킹·선생님 통계가 쓰므로 지우지 않는다. 문제 문장을 따로 갖고 있어 문항이 바뀌어도 남는다

rpg 커밋 (`~/dev/class-rpg-game`)
| 커밋 | 내용 |
|---|---|
| `6a570f9` | 문제 신고 기능 제거 (화면·API·서버 함수, 마이그레이션 `20261004100000_remove_question_reports.sql`) |
| `1905f7a` | 문제 은행을 question-bank 패키지로 연결. 복사본 `content/questions/`와 옛 스크립트(validate, mathking, import-mathking) 삭제 |
| `9cb1b8c` | `vercel-build` 추가: 운영 배포일 때만 `load.mjs`를 돌려 운영 DB에 자동 적재 (첫 실행에서 10,934문항 적재, 비활성화 0) |

문항을 고쳤을 때 rpg에 반영하는 법
1. question-bank에서 고치고 검사 → 커밋·푸시
2. rpg에서 `npm install github:jinsyu/question-bank -D` → 커밋·푸시
3. 적재: 로컬은 `npm run questions:load`. 운영은 사용자가 `package.json`에 직접 넣은 `vercel-build`(운영 배포일 때만 `load.mjs` 실행)가 맡는다

남은 것
- 운영 DB 마이그레이션 `20261004100000`은 사용자가 `scripts/db/migrate.sh`로 실행 (접속 주소는 사용자만 갖고 있다)
- (완료 2026-10-04) `*.mathking.json`을 지금 생성기로 다시 뽑음: g3 1,395 / g4 1,137 / g5 1,472 / g6 1,493, 성취기준 코드 포함. rpg 운영 DB에서는 문장이 바뀐 옛 문항 약 440개가 `disabled`됨

## 문항·생성기를 고친 뒤 배포: `npm run deploy`

검사 → 푸시 → 바뀐 폴더에 맞는 앱(`questions/` → rpg, `src/math/` → math-king·arena)의 lock을 올려 검사·커밋·푸시 → arena 재시작까지 한다 (`scripts/deploy.mjs`). 이 저장소의 문항 작업은 커밋 확인 없이 끝까지 진행하기로 했다 (`CLAUDE.md`). 4장의 손으로 하는 방법은 스크립트가 실패했을 때만 쓴다.

## 6. 주의

- 사용자 전역 규칙: 한국어 답변, 요청 안 한 기능 추가 금지, 작은 단계로, **git commit 전 반드시 사용자 확인**
- **커밋 뒤 푸시 전에 커밋에 든 파일 목록을 확인할 것** (`git show --stat`). `&&`로 묶은 명령에서 앞이 실패하면 `git add`가 건너뛰어진다 (`3eb3acf` 사고)
- 다른 저장소는 별도 worktree에서 작업하고, 검증이 끝난 뒤에만 main에 반영할 것. math-king에는 다른 세션의 worktree가 있다 (예전 main 기준이라 거기서 생성기를 고치면 반영되지 않는다)
- 3100 포트는 다른 프로젝트가 쓰고 있을 수 있다. math-king e2e는 포트를 확인하고 돌릴 것
- 기존 미추적 파일(이 작업과 무관): `class-rpg-game/docs/indischool/`, `math-king/.claude/`
- 자동 적재처럼 운영 DB를 자동으로 바꾸는 변경, 문항 행을 지우는 변경은 Claude의 안전 검사에서 막힌다. 필요하면 사용자가 직접 넣는다
- 이전 핸드아웃: `~/dev/bluemarble/docs/handoff-question-bank-to-rpg.md` (rpg 연결 계획 초안. sync 스크립트 방식이라 지금 구조와는 다름)
