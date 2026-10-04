# 핸드아웃: tower.gyosil.app에서 뺄셈 기호(−)가 네모로 보이는 문제

- 작성: 2026-10-04
- 상태: **원인 확인, 수정은 작성됐으나 미커밋·미배포.** 수정 대상은 이 저장소가 아니라 `~/dev/godot-infinite-math` (tower.gyosil.app, Godot 웹 내보내기)

## 1. 증상

tower.gyosil.app 22층 "덧셈과 뺄셈"(1학년 수학)에서 보기 버튼과 정답 안내의 뺄셈 기호가 네모(▯)로 보인다.
- 문항: "지우는 풍선 4개 중에서 2개를 친구에게 주었습니다. 남은 풍선의 수를 구하는 알맞은 식을 고르세요."
- 보기: `4 + 2 = 6` / `4 − 2 = 1` / `4 − 2 = 3` / `4 − 2 = 2` (정답 4번째)
- 화면: `+`는 정상, `−`만 네모. 아래 해설 줄(`4 − 2 = 2`)은 다른 글꼴이라 정상.

## 2. 문항 내용은 정상

- 생성기: `src/math/content/lessons/g1.ts`의 `subStoryPick` (`l1-sub-story`)
- 데이터: `questions/g1-math.mathking.json` (`"source": "math-king:l1-sub-story"`)
- 정답 하나, 계산 맞음. 문항 수정은 필요 없다.

## 3. 원인 (확인)

- 생성기는 뺄셈 기호로 U+2212 `−`를 쓴다.
- 앱(`~/dev/godot-infinite-math`)은 글꼴 `assets/fonts/Galmuri11.ttf`(보통)과 `Galmuri11-Bold.ttf`(굵게)를 쓰고, 보기 버튼은 굵은 글꼴이다 (`scripts/ui.gd`의 `Ui.button`).
- cmap을 직접 읽어 확인: **Galmuri11-Bold에는 U+2212가 없고, Galmuri11(보통)에는 있다.** `+`, `-`, `×`, `÷`는 둘 다 있다.
- 해설 줄이 정상인 것은 보통 글꼴로 그리기 때문이다.
- 같은 이유로 `≤`, `↔`, 한자도 굵은 글꼴에서 깨질 수 있다고 `ui.gd` 주석에 적혀 있다. 이번 확인은 U+2212만 했다.

## 4. 결정: 앱에서 고친다 (2026-10-04)

문항의 `−`를 `-`로 바꾸는 방법은 쓰지 않기로 했다. 이유: 바꿀 곳이 많고(`g1.ts` 20곳 등 생성기 다수, `*.mathking.json`은 재생성 필요), 다른 앱(math-king, arena, rpg)에서는 `−`가 더 보기 좋다.

## 5. 현재 상태와 다음 할 일

`godot-infinite-math`의 작업 트리에 수정이 있다 (커밋·푸시 안 됨, **운영에는 아직 반영되지 않음**):
- `scripts/ui.gd`: `_static_init()`에서 `FONT_BOLD.set_fallbacks([FONT])`로 굵은 글꼴에 없는 글자를 보통 글꼴로 그린다.
- 처음 작성된 `FONT_BOLD.fallbacks = [FONT]`는 `FONT_BOLD`가 const라 컴파일 오류(Cannot assign a new value to a constant)였다. 이대로 배포했다면 게임이 뜨지 않았다. 2026-10-04에 `set_fallbacks`로 고쳤다.
- 검증: `godot --headless --script res://tests/run_tests.gd` 424개 통과·0 실패, `godot --headless --path . --quit-after 120` 오류 없음, TextServer로 Bold 단독은 U+2212 글리프 0(없음)·보통 글꼴은 있음 확인.
- 아직 안 한 것: 실제 화면에서 22층 보기 확인(헤드리스라 그림은 못 봄). 임시 `tests/_fb_check.gd`는 삭제했다.

남은 일:
1. 커밋 전 사용자 확인 → 커밋·푸시 (`main` 푸시 시 Actions 후 Vercel `forget-tower`가 배포).
2. 배포 후 tower.gyosil.app에서 1학년 뺄셈 보기를 다시 확인한다 (≤, ↔ 등 다른 글자도 같이).

## 6. 이 저장소에서 할 일

없다. 앱이 고쳐진 뒤에도 `question-bank`는 바꾸지 않는다.
