import { pick, randInt, shuffle } from "../../lib/random";
import { josa } from "../josa";
import { clockScene } from "../generators/pictures";
import { mid, word, type WordMap } from "../words/word";

/** 받침 없는 이름만 쓴다(조사 는·가) */
const NAMES = ["지우", "서아", "수아", "도하", "유나", "이수"];
const easy = (id: string, make: Parameters<typeof word>[1]) => word(id, make, 1);

/* ── 3-1 덧셈과 뺄셈 ── */

const asPlace = easy("a3-as-place-add", (rand) => {
  const [h, t, o] = [randInt(rand, 1, 6), randInt(rand, 0, 9), randInt(rand, 0, 9)];
  const n = h * 100 + t * 10 + o;
  const d = randInt(rand, 101, 999 - n);
  if (d < 101 || n + d > 999) return null;
  return {
    key: `${h}:${t}:${o}:${d}`,
    prompt: `100이 ${h}개, 10이 ${t}개, 1이 ${o}개인 수보다 ${d} 큰 수는 얼마인가요?`,
    answer: n + d,
    hint: "먼저 100, 10, 1의 개수로 세 자리 수를 만들어요.",
    explanation: `100이 ${h}개, 10이 ${t}개, 1이 ${o}개인 수는 ${josa(n, "이에요/예요")}. ${n} + ${d} = ${n + d}`,
  };
});

const asUnknown = mid("a3-as-unknown-add", (rand) => {
  const b = randInt(rand, 120, 480);
  const c = randInt(rand, b + 100, 999);
  return {
    key: `${b}:${c}`,
    prompt: `어떤 수에 ${josa(b, "을/를")} 더했더니 ${josa(c, "이/가")} 되었습니다. 어떤 수는 얼마인가요?`,
    answer: c - b,
    hint: "더하기 전의 수는 뺄셈으로 구해요.",
    explanation: `어떤 수 + ${b} = ${c}이므로 어떤 수는 ${c} − ${b} = ${c - b}`,
    mistakes: { [c + b]: "더한 결과에서 거꾸로 빼야 해요." },
  };
});

const asWrong = word("a3-as-wrong-sub", (rand) => {
  const x = randInt(rand, 400, 699);
  const b = randInt(rand, 120, x - 100);
  if (x + b > 999 || x - b < 100) return null;
  // 일의 자리와 십의 자리에서 받아내림이 있는 뺄셈
  if (!(x % 10 < b % 10 && Math.floor(x / 10) % 10 - 1 < Math.floor(b / 10) % 10)) return null;
  const c = x + b;
  return {
    key: `${b}:${c}`,
    prompt: `어떤 수에서 ${josa(b, "을/를")} 빼야 할 것을 잘못하여 더했더니 ${josa(c, "이/가")} 되었습니다. 바르게 계산하면 얼마인가요?`,
    answer: x - b,
    hint: "먼저 잘못 계산한 식으로 어떤 수를 구해요.",
    explanation: `어떤 수 + ${b} = ${c}이므로 어떤 수는 ${c} − ${b} = ${josa(x, "이에요/예요")}. 바르게 계산하면 ${x} − ${b} = ${x - b}`,
    mistakes: { [x]: "어떤 수를 구한 다음 바르게 한 번 더 계산해야 해요." },
  };
});

/* ── 3-1 평면도형 (나눗셈보다 앞 단원) ── */

const DEFS = [
  { name: "선분", text: "두 점을 곧게 이은 선" },
  { name: "반직선", text: "한 점에서 시작하여 한쪽으로 끝없이 늘인 곧은 선" },
  { name: "직선", text: "선분을 양쪽으로 끝없이 늘인 곧은 선" },
];
const pfDef = word(
  "a3-pf-line-name",
  (rand) => {
    const i = randInt(rand, 0, DEFS.length - 1);
    const d = DEFS[i];
    return {
      key: `${i}`,
      prompt: `${d.text}을 무엇이라고 하나요?`,
      answer: d.name,
      choices: shuffle(rand, ["선분", "반직선", "직선", "곡선"]),
      hint: "끝이 있는지, 몇 쪽으로 끝없이 늘어나는지 살펴봐요.",
      explanation: `${d.text}은 ${d.name}이에요.`,
    };
  },
  1,
);

const pfAngles = mid("a3-pf-angle-count", (rand) => {
  const a = randInt(rand, 2, 6);
  const b = randInt(rand, 2, 6);
  return {
    key: `${a}:${b}`,
    prompt: `삼각형 ${a}개와 사각형 ${b}개가 있습니다. 이 도형들의 각은 모두 몇 개인가요?`,
    answer: 3 * a + 4 * b,
    unit: "개",
    hint: "삼각형은 각이 3개, 사각형은 각이 4개예요.",
    explanation: `3 × ${a} = ${3 * a}, 4 × ${b} = ${4 * b}, ${3 * a} + ${4 * b} = ${3 * a + 4 * b}(개)`,
  };
});

const pfJoin = word("a3-pf-rect-join", (rand) => {
  const a = randInt(rand, 6, 15);
  const b = randInt(rand, 2, a - 2);
  return {
    key: `${a}:${b}`,
    prompt: `가로가 ${a} cm, 세로가 ${b} cm인 직사각형 2개를 겹치지 않게 가로끼리 맞닿도록 위아래로 붙여 큰 직사각형을 만들었습니다. 큰 직사각형의 네 변의 길이의 합은 몇 cm인가요?`,
    answer: 2 * a + 4 * b,
    unit: "cm",
    hint: "위아래로 붙이면 가로는 그대로이고 세로는 2배가 돼요.",
    explanation: `큰 직사각형의 가로는 ${a} cm, 세로는 ${b} + ${b} = ${2 * b}(cm)예요. 네 변의 길이의 합은 ${a} + ${2 * b} + ${a} + ${2 * b} = ${2 * a + 4 * b}(cm)`,
  };
});

/* ── 3-1 나눗셈 ── */

const divCut = easy("a3-div-cut-string", (rand) => {
  const b = randInt(rand, 2, 9);
  const q = randInt(rand, 2, 9);
  return {
    key: `${b}:${q}`,
    prompt: `길이가 ${b * q} cm인 끈을 ${b} cm씩 자르면 몇 도막이 되나요?`,
    answer: q,
    unit: "도막",
    hint: `${b * q}에서 ${josa(b, "을/를")} 몇 번 덜어 낼 수 있는지 생각해요.`,
    explanation: `${b * q} ÷ ${b} = ${q}(도막)`,
  };
});

const divSum = mid("a3-div-two-quotients", (rand) => {
  const [b1, q1, b2, q2] = [randInt(rand, 2, 9), randInt(rand, 2, 9), randInt(rand, 2, 9), randInt(rand, 2, 9)];
  if (b1 * q1 === b2 * q2) return null;
  return {
    key: `${b1}:${q1}:${b2}:${q2}`,
    prompt: `${b1 * q1} ÷ ${b1}의 몫과 ${b2 * q2} ÷ ${b2}의 몫을 더하면 얼마인가요?`,
    answer: q1 + q2,
    hint: "곱셈구구를 이용해 두 몫을 먼저 구해요.",
    explanation: `${b1} × ${q1} = ${b1 * q1}이므로 ${b1 * q1} ÷ ${b1} = ${q1}, ${b2} × ${q2} = ${b2 * q2}이므로 ${b2 * q2} ÷ ${b2} = ${q2}. ${q1} + ${q2} = ${q1 + q2}`,
  };
});

const divMix = word("a3-div-two-kinds", (rand) => {
  const n = randInt(rand, 3, 9);
  const q = randInt(rand, 3, 9);
  const a = randInt(rand, 5, n * q - 5);
  const b = n * q - a;
  if (b < 5) return null;
  const who = pick(rand, NAMES);
  return {
    key: `${a}:${b}:${n}`,
    prompt: `${who}는 딸기 맛 사탕 ${a}개와 포도 맛 사탕 ${b}개를 친구 ${n}명에게 똑같이 나누어 주었습니다. 친구 한 명이 받은 사탕은 몇 개인가요?`,
    answer: q,
    unit: "개",
    hint: "먼저 사탕이 모두 몇 개인지 구해요.",
    explanation: `${a} + ${b} = ${n * q}(개), ${n * q} ÷ ${n} = ${q}(개)`,
  };
});

/* ── 3-1 곱셈 ── */

const mulTens = easy("a3-mul-tens-repeat", (rand) => {
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, 2, 9);
  return {
    key: `${a}:${b}`,
    prompt: `${a * 10}을 ${b}번 더한 수는 얼마인가요?`,
    answer: a * 10 * b,
    hint: "같은 수를 여러 번 더하는 것은 곱셈으로 나타낼 수 있어요.",
    explanation: `${a * 10} × ${b} = ${a * b * 10}`,
  };
});

const mulMax = mid("a3-mul-largest-digit", (rand) => {
  const a = randInt(rand, 12, 39);
  const d = randInt(rand, 2, 8);
  const c = randInt(rand, a * d + 1, a * (d + 1));
  return {
    key: `${a}:${c}`,
    prompt: `${a} × □ < ${c}에서 □ 안에 들어갈 수 있는 한 자리 수 중 가장 큰 수는 얼마인가요?`,
    answer: d,
    hint: `□에 수를 차례로 넣어 ${a} × □를 계산해 봐요.`,
    explanation: `${a} × ${d} = ${josa(a * d, "은/는")} ${c}보다 작고, ${a} × ${d + 1} = ${josa(a * (d + 1), "은/는")} ${c}보다 작지 않아요. 가장 큰 수는 ${d}`,
  };
});

const mulRows = word("a3-mul-two-groups", (rand) => {
  const a = randInt(rand, 23, 49);
  const b = randInt(rand, 3, 9);
  const c = randInt(rand, 23, 49);
  const d = randInt(rand, 3, 9);
  if (a === c) return null;
  return {
    key: `${a}:${b}:${c}:${d}`,
    prompt: `운동장에 학생들이 한 줄에 ${a}명씩 ${b}줄로 서 있고, 그 뒤에 한 줄에 ${c}명씩 ${d}줄로 서 있습니다. 운동장에 서 있는 학생은 모두 몇 명인가요?`,
    answer: a * b + c * d,
    unit: "명",
    hint: "두 무리의 학생 수를 곱셈으로 각각 구한 다음 더해요.",
    explanation: `${a} × ${b} = ${a * b}, ${c} × ${d} = ${c * d}, ${a * b} + ${c * d} = ${a * b + c * d}(명)`,
  };
});

/* ── 3-1 길이와 시간 ── */

const timeAfter = easy("a3-time-clock-after", (rand) => {
  const h = randInt(rand, 1, 10);
  const m = randInt(rand, 1, 11) * 5;
  const x = randInt(rand, 3, 10) * 5;
  const total = m + x;
  const [eh, em] = [h + Math.floor(total / 60), total % 60];
  return {
    key: `${h}:${m}:${x}`,
    prompt: `시계가 나타내는 시각에서 ${x}분 후는 몇 시 몇 분인가요?`,
    visual: clockScene(h, m),
    answer: `${eh},${em}`,
    unit: ["시", "분"],
    hint: "먼저 시계의 시각을 읽고, 분끼리 더해요. 60분은 1시간이에요.",
    explanation: `시계는 ${h}시 ${m}분을 나타내요. ${h}시 ${m}분 + ${x}분 = ${eh}시 ${em}분`,
  };
});

const timeStart = mid("a3-time-clock-start", (rand) => {
  const h = randInt(rand, 3, 11);
  const m = randInt(rand, 1, 11) * 5;
  const k = randInt(rand, 1, 11) * 5;
  let sm = m - k;
  let sh = h - 1;
  if (sm < 0) {
    sm += 60;
    sh -= 1;
  }
  return {
    key: `${h}:${m}:${k}`,
    prompt: `영화가 끝난 시각은 시계와 같습니다. 영화를 1시간 ${k}분 동안 상영했다면 영화가 시작한 시각은 몇 시 몇 분인가요?`,
    visual: clockScene(h, m),
    answer: `${sh},${sm}`,
    unit: ["시", "분"],
    hint: "끝난 시각에서 상영 시간을 빼요. 분끼리 뺄 수 없으면 1시간을 60분으로 바꿔요.",
    explanation: `끝난 시각은 ${h}시 ${m}분이에요. ${h}시 ${m}분 − 1시간 ${k}분 = ${sh}시 ${sm}분`,
  };
});

const kmGap = (m: number) => (m >= 1000 ? `${Math.floor(m / 1000)} km ${m % 1000} m` : `${m} m`);
const lenRoute = word("a3-len-route-diff", (rand) => {
  const ab = randInt(rand, 110, 190) * 10;
  const bc = randInt(rand, 30, 90) * 10;
  const direct = randInt(rand, 110, 190) * 10;
  if (direct >= ab + bc - 100 || ab % 1000 === 0 || direct % 1000 === 0) return null;
  const via = ab + bc;
  return {
    key: `${ab}:${bc}:${direct}`,
    prompt: `집에서 도서관까지는 ${kmGap(ab)}, 도서관에서 공원까지는 ${bc} m입니다. 집에서 공원까지 바로 가는 길은 ${kmGap(direct)}입니다. 도서관을 거쳐 가는 길은 바로 가는 길보다 몇 m 더 먼가요?`,
    answer: via - direct,
    unit: "m",
    hint: "1 km = 1000 m예요. 모두 m로 바꾸어 계산해요.",
    explanation: `도서관을 거쳐 가는 길은 ${ab} + ${bc} = ${via}(m), 바로 가는 길은 ${direct} m예요. ${via} − ${direct} = ${via - direct}(m)`,
  };
});

/* ── 3-1 분수와 소수 (가분수 전) ── */

const decBuild = easy("a3-dec-ones-tenths", (rand) => {
  const a = randInt(rand, 1, 9);
  const b = randInt(rand, 1, 9);
  return {
    key: `${a}:${b}`,
    prompt: `1이 ${a}개, 0.1이 ${b}개인 수는 얼마인가요?`,
    answer: `${a}.${b}`,
    hint: "1이 몇 개인지는 소수점 왼쪽, 0.1이 몇 개인지는 소수점 오른쪽에 써요.",
    explanation: `1이 ${a}개이면 ${a}, 0.1이 ${b}개이면 0.${b}이므로 ${a}.${b}`,
  };
});

const unitBetween = mid("a3-frac-unit-between", (rand) => {
  const s = randInt(rand, 2, 8);
  const b = randInt(rand, s + 2, 12);
  return {
    key: `${s}:${b}`,
    prompt: `1/${b}보다 크고 1/${s}보다 작은 단위분수는 모두 몇 개인가요?`,
    answer: b - s - 1,
    unit: "개",
    hint: "단위분수는 분모가 작을수록 커요.",
    explanation: `분모가 ${s + 1}부터 ${b - 1}까지인 단위분수예요. 모두 ${b - s - 1}개`,
  };
});

const ribbonMm = word("a3-dec-cm-mm-diff", (rand) => {
  const a = randInt(rand, 3, 9);
  const b = randInt(rand, 1, 9);
  const c = randInt(rand, 20, 99);
  const am = a * 10 + b;
  if (c === am || c % 10 === 0) return null;
  const who = pick(rand, NAMES);
  return {
    key: `${a}:${b}:${c}`,
    prompt: `${who}의 리본은 ${a}.${b} cm이고, 동생의 리본은 ${c} mm입니다. 두 리본의 길이의 차는 몇 mm인가요?`,
    answer: Math.abs(am - c),
    unit: "mm",
    hint: "1 mm = 0.1 cm예요. 소수로 나타낸 길이를 mm로 바꾸어 봐요.",
    explanation: `${a}.${b} cm는 0.1 cm가 ${am}개이므로 ${am} mm예요. ${Math.max(am, c)} − ${Math.min(am, c)} = ${Math.abs(am - c)}(mm)`,
  };
});

/* ── 3-2 곱셈 ── */

const mulRepeat3 = easy("a3-mul-3x1-repeat", (rand) => {
  const a = randInt(rand, 112, 329);
  const n = randInt(rand, 3, 6);
  if (a % 10 === 0) return null;
  return {
    key: `${a}:${n}`,
    prompt: `${josa(a, "을/를")} ${n}번 더한 수는 얼마인가요?`,
    answer: a * n,
    hint: "같은 수를 여러 번 더하는 것은 곱셈으로 나타낼 수 있어요.",
    explanation: `${a} × ${n} = ${a * n}`,
  };
});

const mulBoxTens = mid("a3-mul-tens-box", (rand) => {
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, 2, 9);
  const p = a * b * 100;
  return {
    key: `${a}:${b}`,
    prompt: `□ × ${b * 10} = ${p}에서 □ 안에 알맞은 몇십은 얼마인가요?`,
    answer: a * 10,
    hint: `(몇십) × (몇십)은 몇 × 몇에 100을 곱한 것과 같아요.`,
    explanation: `${josa(p, "은/는")} ${a * b} × 100이에요. ${a} × ${b} = ${a * b}이므로 ${a * 10} × ${b * 10} = ${p}. □ = ${a * 10}`,
  };
});

const mulWrong = word("a3-mul-wrong-add", (rand) => {
  const b = randInt(rand, 12, 39);
  const x = randInt(rand, 12, 69);
  return {
    key: `${b}:${x}`,
    prompt: `어떤 수에 ${josa(b, "을/를")} 곱해야 할 것을 잘못하여 더했더니 ${josa(x + b, "이/가")} 되었습니다. 바르게 계산하면 얼마인가요?`,
    answer: x * b,
    hint: "먼저 잘못 계산한 식으로 어떤 수를 구해요.",
    explanation: `어떤 수 + ${b} = ${x + b}이므로 어떤 수는 ${x + b} − ${b} = ${josa(x, "이에요/예요")}. 바르게 계산하면 ${x} × ${b} = ${x * b}`,
    mistakes: { [x]: "어떤 수를 구한 다음 바르게 곱해야 해요." },
  };
});

/* ── 3-2 나눗셈 ── */

const divBox = easy("a3-div-box-dividend", (rand) => {
  const b = randInt(rand, 2, 9);
  const q = randInt(rand, 11, Math.floor(99 / b));
  if (q < 11) return null;
  return {
    key: `${b}:${q}`,
    prompt: `□ ÷ ${b} = ${q}에서 □ 안에 알맞은 수는 얼마인가요?`,
    answer: b * q,
    hint: "나눗셈식을 곱셈식으로 바꾸어 생각해요.",
    explanation: `${b} × ${q} = ${b * q}이므로 □ = ${b * q}`,
  };
});

const divTeams = mid("a3-div-min-groups", (rand) => {
  const b = randInt(rand, 3, 9);
  const n = randInt(rand, 20, 99);
  if (n % b === 0 || Math.floor(n / b) < 3) return null;
  const q = Math.floor(n / b);
  return {
    key: `${n}:${b}`,
    prompt: `학생 ${n}명이 한 모둠에 ${b}명까지 들어갈 수 있는 모둠을 만들려고 합니다. 학생이 모두 모둠에 들어가려면 모둠은 적어도 몇 개 있어야 하나요?`,
    answer: q + 1,
    unit: "개",
    hint: "나머지 학생들도 모둠이 하나 더 있어야 들어갈 수 있어요.",
    explanation: `${n} ÷ ${b} = ${q} … ${n % b}이므로 ${b}명씩 ${q}모둠을 만들고 남은 ${n % b}명이 들어갈 모둠이 하나 더 필요해요. ${q} + 1 = ${q + 1}(개)`,
    mistakes: { [q]: "남은 학생이 들어갈 모둠도 세어야 해요." },
  };
});

const divRe = word("a3-div-check-redivide", (rand) => {
  const b = randInt(rand, 3, 9);
  const q = randInt(rand, 11, Math.floor(199 / b));
  const r = randInt(rand, 1, b - 1);
  const x = b * q + r;
  const c = randInt(rand, 2, 9);
  if (x > 199 || c === b) return null;
  return {
    key: `${b}:${q}:${r}:${c}`,
    prompt: `어떤 수를 ${josa(b, "으로/로")} 나누었더니 몫은 ${q}, 나머지는 ${r}입니다. 어떤 수를 ${josa(c, "으로/로")} 나누면 몫과 나머지는 얼마인가요?`,
    answer: `${Math.floor(x / c)},${x % c}`,
    unit: ["몫", "나머지"],
    hint: "나누는 수와 몫을 곱한 다음 나머지를 더하면 어떤 수가 돼요.",
    explanation: `${b} × ${q} = ${b * q}, ${b * q} + ${r} = ${x}이므로 어떤 수는 ${josa(x, "이에요/예요")}. ${x} ÷ ${c} = ${Math.floor(x / c)} … ${x % c}`,
  };
});

/* ── 3-2 원 ── */

const cirCompass = easy("a3-cir-compass-diameter", (rand) => {
  const r = randInt(rand, 2, 9);
  return {
    key: `${r}`,
    prompt: `컴퍼스의 침과 연필심 사이를 ${r} cm만큼 벌려서 원을 그렸습니다. 그린 원의 지름은 몇 cm인가요?`,
    answer: 2 * r,
    unit: "cm",
    hint: "컴퍼스를 벌린 길이가 원의 반지름이에요.",
    explanation: `반지름이 ${r} cm이므로 지름은 ${r} × 2 = ${2 * r}(cm)`,
  };
});

const cirRow = mid("a3-cir-row-length", (rand) => {
  const r = randInt(rand, 2, 9);
  const n = randInt(rand, 3, 6);
  return {
    key: `${r}:${n}`,
    prompt: `반지름이 ${r} cm인 원 ${n}개를 겹치지 않게 한 줄로 맞닿게 늘어놓았습니다. 왼쪽 끝 원의 왼쪽 끝에서 오른쪽 끝 원의 오른쪽 끝까지의 길이는 몇 cm인가요?`,
    answer: 2 * r * n,
    unit: "cm",
    hint: "원 하나가 차지하는 길이는 지름이에요.",
    explanation: `지름은 ${r} × 2 = ${2 * r}(cm)이고, 원이 ${n}개이므로 ${2 * r} × ${n} = ${2 * r * n}(cm)`,
    mistakes: { [r * n]: "원 하나가 차지하는 길이는 반지름이 아니라 지름이에요." },
  };
});

const cirBox = word("a3-cir-box-perimeter", (rand) => {
  const r = randInt(rand, 2, 6);
  const n = randInt(rand, 2, 5);
  const w = 2 * r * n;
  const h = 2 * r;
  return {
    key: `${r}:${n}`,
    prompt: `반지름이 ${r} cm인 원 ${n}개가 직사각형 안에 한 줄로 꼭 맞게 들어 있습니다. 원끼리는 맞닿아 있고, 원은 직사각형의 변에도 닿아 있습니다. 직사각형의 네 변의 길이의 합은 몇 cm인가요?`,
    answer: 2 * (w + h),
    unit: "cm",
    hint: "직사각형의 가로는 지름 몇 개, 세로는 지름 하나와 같아요.",
    explanation: `지름은 ${2 * r} cm예요. 가로는 ${2 * r} × ${n} = ${w}(cm), 세로는 ${h} cm이므로 네 변의 길이의 합은 ${w} + ${h} + ${w} + ${h} = ${2 * (w + h)}(cm)`,
  };
});

/* ── 3-2 분수 ── */

const fracHour = easy("a3-frac-of-hour", (rand) => {
  const d = pick(rand, [2, 3, 4, 5, 6, 10, 12]);
  const n = randInt(rand, 1, d - 1);
  const v = (60 / d) * n;
  return {
    key: `${n}/${d}`,
    prompt: `1시간의 ${josa(`${n}/${d}`, "은/는")} 몇 분인가요?`,
    answer: v,
    unit: "분",
    hint: `1시간 = 60분이에요. 먼저 60분의 ${josa(`1/${d}`, "이/가")} 몇 분인지 구해요.`,
    explanation: `60분의 ${josa(`1/${d}`, "은/는")} 60 ÷ ${d} = ${60 / d}(분)이므로 ${josa(`${n}/${d}`, "은/는")} ${60 / d} × ${n} = ${v}(분)`,
  };
});

const fracProper = mid("a3-frac-proper-count", (rand) => {
  const d = randInt(rand, 5, 12);
  const n = randInt(rand, 1, d - 3);
  return {
    key: `${n}/${d}`,
    prompt: `분모가 ${d}인 진분수 중에서 ${n}/${d}보다 큰 분수는 모두 몇 개인가요?`,
    answer: d - 1 - n,
    unit: "개",
    hint: "진분수는 분자가 분모보다 작은 분수예요.",
    explanation: `분모가 ${d}인 진분수 중 ${n}/${d}보다 큰 분수는 ${n + 1}/${d}부터 ${d - 1}/${d}까지 ${d - 1 - n}개예요.`,
  };
});

const fracBetween = word("a3-frac-improper-between", (rand) => {
  const d = randInt(rand, 3, 9);
  const a = randInt(rand, 1, 3);
  const b = randInt(rand, 1, d - 1);
  const k = randInt(rand, 1, 6);
  const lo = a * d + b;
  const n = lo + k + 1;
  return {
    key: `${a}:${b}:${d}:${n}`,
    prompt: `분모가 ${d}인 가분수 중에서 ${a} ${b}/${d}보다 크고 ${n}/${d}보다 작은 분수는 모두 몇 개인가요?`,
    answer: k,
    unit: "개",
    hint: "대분수를 가분수로 바꾸어 분자끼리 비교해요.",
    explanation: `${a} ${b}/${d} = ${josa(`${lo}/${d}`, "이에요/예요")}. 분자가 ${lo + 1}부터 ${n - 1}까지인 분수이므로 모두 ${k}개예요.`,
  };
});

/* ── 3-2 들이와 무게 ── */

const volCups = easy("a3-vol-cup-diff", (rand) => {
  const a = randInt(rand, 3, 12);
  const b = randInt(rand, 3, 12);
  if (a === b) return null;
  return {
    key: `${a}:${b}`,
    prompt: `가 그릇과 나 그릇에 물을 가득 채우려면 같은 컵으로 가 그릇은 ${a}번, 나 그릇은 ${b}번 부어야 합니다. 물이 더 많이 들어가는 그릇은 다른 그릇보다 컵으로 몇 번 더 들어가나요?`,
    answer: Math.abs(a - b),
    unit: "번",
    hint: "같은 컵으로 부은 횟수가 많을수록 들이가 많아요.",
    explanation: `${Math.max(a, b)} − ${Math.min(a, b)} = ${Math.abs(a - b)}(번)`,
  };
});

const lml = (x: number) => `${Math.floor(x / 1000)} L${x % 1000 ? ` ${x % 1000} mL` : ""}`;
const volLeft = mid("a3-vol-left-ml", (rand) => {
  const a = randInt(rand, 1, 3);
  const b = randInt(rand, 1, 8) * 100;
  const c = randInt(rand, b / 100 + 1, 9) * 100;
  const total = a * 1000 + b;
  return {
    key: `${a}:${b}:${c}`,
    prompt: `물통에 물이 ${lml(total)} 들어 있습니다. 이 중에서 ${c} mL를 마셨다면 남은 물은 몇 mL인가요?`,
    answer: total - c,
    unit: "mL",
    hint: "1 L = 1000 mL예요. 처음 물의 양을 mL로 바꾸어 빼요.",
    explanation: `${lml(total)} = ${total} mL, ${total} − ${c} = ${total - c}(mL)`,
  };
});

const kgg = (x: number) => (x >= 1000 ? `${Math.floor(x / 1000)} kg${x % 1000 ? ` ${x % 1000} g` : ""}` : `${x} g`);
const wtBag = word("a3-wt-bag-swap", (rand) => {
  const bag = randInt(rand, 30, 80) * 10;
  const book = randInt(rand, 50, 150) * 10;
  const note = randInt(rand, 10, 40) * 10;
  const both = bag + book;
  if (both < 1000 || both % 1000 === 0 || book % 1000 === 0) return null;
  return {
    key: `${bag}:${book}:${note}`,
    prompt: `책을 넣은 가방의 무게는 ${kgg(both)}이고, 책만의 무게는 ${kgg(book)}입니다. 책을 빼고 이 가방에 ${note} g짜리 필통을 넣으면 무게는 몇 g인가요?`,
    answer: bag + note,
    unit: "g",
    hint: "먼저 빈 가방의 무게를 구해요. 1 kg = 1000 g이에요.",
    explanation: `빈 가방은 ${both} − ${book} = ${bag}(g)이에요. ${bag} + ${note} = ${bag + note}(g)`,
  };
});

/* ── 3-2 자료의 정리 ── */

const FRUITS = ["사과", "배", "귤", "포도"];
const dataTotal = easy("a3-data-table-total", (rand) => {
  const vals = FRUITS.map(() => randInt(rand, 3, 12));
  return {
    key: vals.join(":"),
    prompt: "표는 우리 반 학생들이 좋아하는 과일을 조사한 것입니다. 조사한 학생은 모두 몇 명인가요?",
    visual: { kind: "table", header: ["과일", ...FRUITS], rows: [["학생 수(명)", ...vals.map(String)]] },
    answer: vals.reduce((s, v) => s + v, 0),
    unit: "명",
    hint: "과일별 학생 수를 모두 더해요.",
    explanation: `${vals.join(" + ")} = ${vals.reduce((s, v) => s + v, 0)}(명)`,
  };
});

const dataRest = mid("a3-data-collect-rest", (rand) => {
  const [a, b, c, w] = [randInt(rand, 3, 9), randInt(rand, 3, 9), randInt(rand, 3, 9), randInt(rand, 1, 9)];
  const n = a + b + c + w;
  return {
    key: `${n}:${a}:${b}:${c}`,
    prompt: `우리 반 학생 ${n}명이 좋아하는 계절을 한 가지씩 골랐습니다. 봄은 ${a}명, 여름은 ${b}명, 가을은 ${c}명이 골랐고 나머지는 겨울을 골랐습니다. 겨울을 고른 학생은 몇 명인가요?`,
    answer: w,
    unit: "명",
    hint: "전체 학생 수에서 다른 계절을 고른 학생 수를 빼요.",
    explanation: `${a} + ${b} + ${c} = ${a + b + c}(명), ${n} − ${a + b + c} = ${w}(명)`,
  };
});

const dataPicto = word("a3-data-picto-diff", (rand) => {
  const [a, b, c, d] = [randInt(rand, 1, 5), randInt(rand, 0, 9), randInt(rand, 1, 5), randInt(rand, 0, 9)];
  const x = a * 10 + b;
  const y = c * 10 + d;
  if (x === y || a === c) return null;
  return {
    key: `${a}:${b}:${c}:${d}`,
    prompt: `마을별 나무 수를 그림그래프로 나타냈습니다. 큰 나무 모양은 10그루, 작은 나무 모양은 1그루를 나타냅니다. 가 마을은 큰 나무 모양 ${a}개와 작은 나무 모양 ${b}개, 나 마을은 큰 나무 모양 ${c}개와 작은 나무 모양 ${d}개입니다. 나무가 더 많은 마을은 다른 마을보다 몇 그루 더 많은가요?`,
    answer: Math.abs(x - y),
    unit: "그루",
    hint: "모양의 개수가 아니라 각 모양이 나타내는 수로 나무 수를 구해요.",
    explanation: `가 마을은 ${x}그루, 나 마을은 ${y}그루예요. ${Math.max(x, y)} − ${Math.min(x, y)} = ${Math.abs(x - y)}(그루)`,
  };
});

export const addedG3: WordMap = {
  "g3-s1-add-sub": { "add-carry-once": [asPlace], "sub-borrow-once": [asUnknown], "sub-borrow-twice": [asWrong] },
  "g3-s1-plane-figures": { lines: [pfDef], angle: [pfAngles], rectangle: [pfJoin] },
  "g3-s1-division": { "div-group": [divCut], "div-by-mul": [divSum], "div-times-table": [divMix] },
  "g3-s1-multiplication": { "mul-tens": [mulTens], "mul-carry-ones": [mulMax], "mul-carry-both": [mulRows] },
  "g3-s1-length-time": { "time-add": [timeAfter], "time-sub": [timeStart], "len-add-sub": [lenRoute] },
  "g3-s1-fraction-decimal": { "decimal-one-place": [decBuild], "fraction-compare": [unitBetween], "decimal-compare": [ribbonMm] },
  "g3-s2-multiplication": { "mul-3x1": [mulRepeat3], "mul-tens-tens": [mulBoxTens], "mul-2x2": [mulWrong] },
  "g3-s2-division": { "div-no-rem": [divBox], "div-rem": [divTeams], "div-check": [divRe] },
  "g3-s2-circle": { "circle-radius": [cirCompass], "circle-patterns": [cirRow], "circle-diameter": [cirBox] },
  "g3-s2-fraction": { "frac-of-length": [fracHour], "frac-kinds": [fracProper], "frac-compare2": [fracBetween] },
  "g3-s2-volume-weight": { "vol-compare": [volCups], "vol-add-sub": [volLeft], "wt-add-sub": [wtBag] },
  "g3-s2-data": { "data-table": [dataTotal], "data-collect": [dataRest], "data-use": [dataPicto] },
};

/** 테스트용: 새 생성기 목록 */
export const ADDED_G3_LIST = Object.values(addedG3).flatMap((m) => Object.values(m).flat());
