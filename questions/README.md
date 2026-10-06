# 문제 은행 원본

파일 이름: `g{학년}-{과목}.json` (예: `g4-science.json`)
과목: `korean`, `math`, `social`, `science`, `english`

1·2학년(`g1-`, `g2-`)은 `korean`, `math`만 있어요. 검사(`npm run check`)는 받지만 rpg는 3~6학년 파일만 읽어서 1·2학년 문항은 rpg에 들어가지 않아요.

각 파일은 문제 배열이에요.

```json
[
  {
    "difficulty": 1,
    "type": "choice4",
    "question": "식물이 햇빛을 받아 양분을 만드는 곳은 어디일까요?",
    "choices": ["뿌리", "줄기", "잎", "꽃"],
    "answer": 2,
    "explanation": "잎에서 햇빛, 물, 이산화탄소로 양분을 만들어요.",
    "standard": "[4과05-03]",
    "semester": 1,
    "unit": "식물의 생활"
  }
]
```

- `difficulty`: 1 쉬움, 2 보통, 3 어려움
- `type`: `choice4`(보기 4개) 또는 `ox`(보기 `["O", "X"]`)
- `answer`: 정답 보기의 번호(0부터)
- `semester`: 그 학년에서 처음 배우는 학기(1·2). 3~8월에는 1학기 문제만 나와요 (spec 8.2-1)
- `unit`: 단원 이름 (짧게)
- 검증: 저장소 루트에서 `npm run check`

## 성인(교사) 문항

`adult-{과목}.json` (과목: `korean` 우리말, `math` 두뇌 게임 수학, `english` 영어, `general` 일반상식). 망각의 탑의 '성인' 학년이 읽어요.
형식은 위와 같고 `semester`는 항상 1이에요. rpg는 `g3~g6-` 파일만 읽어서 성인 문항은 들어가지 않아요.

## math-king에서 가져온 수학 문제

`g{학년}-math.mathking.json`은 수학 문제 생성기(`src/math/content`, math-king에서 옮겨 옴)에서 뽑은 파일이에요. 손으로 고치지 말고 다시 만들어요.

```bash
npm run mathking   # 다시 뽑기
npm run check      # 형식 검사
```

- 그림이 있는 문제, 보기가 3개인 문제, 답이 두 칸인 문제는 빠져요.
- 숫자를 써넣는 문제는 흔한 실수 오답과 정답에 가까운 수로 4지선다를 만들어요 (`scripts/mathking.ts`).
- 같은 학년·과목의 파일 여러 개는 한 묶음으로 검사돼요 (같은 문제 문장이 두 번 나오면 안 돼요).
