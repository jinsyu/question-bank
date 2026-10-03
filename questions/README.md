# 문제 은행 원본

파일 이름: `g{학년}-{과목}.json` (예: `g4-science.json`)
과목: `korean`, `math`, `social`, `science`, `english`

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
- 검증: `node scripts/questions/validate.mjs` / DB 적재: `node scripts/questions/load.mjs`

## math-king에서 가져온 수학 문제

`g{학년}-math.mathking.json`은 math-king 저장소(`../math-king`)의 문제 생성기에서 뽑은 파일이에요. 손으로 고치지 말고 다시 만들어요.

```bash
npm run questions:mathking   # 다시 뽑기 (math-king은 읽기만 해요)
npm run questions:check      # 형식 검사
npm run questions:load       # DB 적재
```

- 그림이 있는 문제, 보기가 3개인 문제, 답이 두 칸인 문제는 빠져요.
- 숫자를 써넣는 문제는 흔한 실수 오답과 정답에 가까운 수로 4지선다를 만들어요 (`scripts/questions/mathking.ts`).
- 같은 학년·과목의 파일 여러 개는 한 묶음으로 검사·적재돼요.
