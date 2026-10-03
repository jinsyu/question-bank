import { pick, randInt, shuffle } from "../../lib/random";
import { josa, NAMES, opts } from "./g2";
import { calendarScene, clock2, easy, MONTH_DAYS, mid, minuteBand, ord, twoClocks, WEEK, word } from "./g2-pics";

/**
 * 2-2 4단원 시각과 시간: 바늘 시계·시간 띠·달력 그림을 보고 시각을 읽고 걸린 시간을 구한다.
 * 시계는 숫자를 눈금 바깥에 둔 clock2(긴바늘이 숫자 위를 지나지 않음)를 쓴다.
 */

const hm = (t: number) => `${Math.floor(t / 60) % 12 || 12},${t % 60}`;
const hmText = (t: number) => `${Math.floor(t / 60) % 12 || 12}시${t % 60 ? ` ${t % 60}분` : ""}`;
const H = (t: number) => Math.floor(t / 60) % 12 || 12;

/* ── 5분 단위 ── */

export const clock5 = easy("l2-clock5", (rand) => {
  const h = randInt(rand, 1, 12);
  const m = randInt(rand, 1, 11) * 5;
  return {
    key: `${h}:${m}`,
    prompt: "시계가 나타내는 시각을 쓰세요.",
    visual: clock2(h, m),
    answer: `${h},${m}`,
    unit: ["시", "분"],
    hint: "긴바늘이 가리키는 숫자가 1이면 5분, 2이면 10분…이에요. 짧은바늘은 지나온 숫자를 읽어요.",
    explanation: `짧은바늘이 ${josa(h, "과/와")} ${(h % 12) + 1} 사이, 긴바늘이 ${m / 5} → ${h}시 ${m}분`,
    mistakes: { [`${h},${m / 5}`]: "긴바늘이 가리키는 숫자를 그대로 읽었어요." },
  };
});

export const clock5Hand = mid("l2-clock5-hand", (rand) => {
  const k = randInt(rand, 1, 11);
  return {
    key: `${k}`,
    prompt: "시계의 긴바늘만 그렸습니다. 긴바늘이 나타내는 것은 몇 분인가요?",
    visual: clock2(12, k * 5, { hourHand: false, label: `긴바늘만 있는 시계, 긴바늘이 숫자 ${k}` }),
    answer: k * 5,
    unit: "분",
    hint: "숫자 1은 5분, 2는 10분… 5씩 뛰어 세어요.",
    explanation: `긴바늘이 숫자 ${josa(k, "을/를")} 가리키므로 5씩 ${k}번 → ${k * 5}분`,
    mistakes: { [k]: "숫자 1이 5분이에요." },
  };
});

export const clock5After = mid("l2-clock5-after", (rand) => {
  const h = randInt(rand, 1, 11);
  const a = randInt(rand, 1, 8);
  const b = a + randInt(rand, 1, 3);
  const t = h * 60 + b * 5;
  return {
    key: `${h}:${a}:${b}`,
    prompt: `시계의 긴바늘이 숫자 ${a}에서 숫자 ${b}까지 움직였습니다. 긴바늘이 숫자 ${josa(b, "을/를")} 가리킬 때의 시각은 몇 시 몇 분인가요?`,
    visual: clock2(h, a * 5, { label: `${h}시 ${a * 5}분을 나타내는 시계` }),
    answer: hm(t),
    unit: ["시", "분"],
    hint: "긴바늘이 숫자 한 칸을 움직이면 5분이 지나요.",
    explanation: `처음 ${h}시 ${a * 5}분, 숫자 ${b - a}칸 → ${(b - a) * 5}분 후 → ${hmText(t)}`,
  };
});

export const clockError = word("l2-clock-error", (rand) => {
  const h = randInt(rand, 1, 11);
  // 짧은바늘이 숫자 h 가까이에 있도록 25분까지만 쓴다(바꾸어 읽은 시각이 자연스럽다)
  const k = randInt(rand, 1, 5);
  if (k === h || k === h + 1) return null;
  const m = k * 5;
  const name = pick(rand, NAMES);
  const answer = `짧은바늘과 긴바늘을 바꾸어 읽었어요. 바른 시각은 ${h}시 ${m}분이에요.`;
  const choices = opts(rand, answer, [`짧은바늘과 긴바늘을 바꾸어 읽었어요. 바른 시각은 ${h + 1}시 ${m}분이에요.`, `긴바늘의 숫자를 그대로 읽었어요. 바른 시각은 ${h}시 ${k}분이에요.`, `바르게 읽었어요. ${k}시 ${h * 5}분이 맞아요.`]);
  if (!choices) return null;
  return {
    key: `${h}:${m}:${name}`,
    prompt: `${josa(name, "은/는")} 시계를 보고 ${k}시 ${h * 5}분이라고 읽었습니다. 잘못된 까닭과 바른 시각을 고르세요.`,
    visual: clock2(h, m),
    choices,
    answer,
    hint: "짧은바늘은 '시', 긴바늘은 '분'을 나타내요.",
    explanation: `짧은바늘이 ${josa(h, "과/와")} ${h + 1} 사이, 긴바늘이 ${k} → ${h}시 ${m}분`,
  };
});

/* ── 1분 단위 ── */

export const clockReadMinute = easy("clock-read-minute", (rand) => {
  const h = randInt(rand, 1, 12);
  const m = randInt(rand, 1, 59);
  if (m % 5 === 0) return null;
  return {
    key: `${h}:${m}`,
    prompt: "시계가 나타내는 시각을 쓰세요.",
    visual: clock2(h, m),
    answer: `${h},${m}`,
    unit: ["시", "분"],
    hint: "긴바늘이 지나온 숫자로 5분씩 세고, 작은 눈금 한 칸은 1분씩 더 세어요.",
    explanation: `긴바늘이 숫자 ${Math.floor(m / 5) || 12}에서 작은 눈금 ${m % 5}칸 더 → ${m}분, ${h}시 ${m}분`,
    mistakes: { [`${h},${Math.floor(m / 5) + (m % 5)}`]: "숫자 1은 5분이에요. 작은 눈금 한 칸이 1분이에요." },
  };
});

export const clock1Ticks = mid("l2-clock1-ticks", (rand) => {
  const h = randInt(rand, 1, 12);
  const k = randInt(rand, 1, 10);
  const j = randInt(rand, 1, 4);
  const m = 5 * k + j;
  return {
    key: `${h}:${m}`,
    prompt: "시계의 긴바늘이 나타내는 것은 몇 분인가요?",
    visual: clock2(h, m),
    answer: m,
    unit: "분",
    hint: `긴바늘이 숫자 ${josa(k, "을/를")} 지나 작은 눈금 몇 칸을 더 갔는지 세어요. 숫자 ${josa(k, "은/는")} ${5 * k}분이에요.`,
    explanation: `숫자 ${k} → ${5 * k}분, 작은 눈금 ${j}칸 더 → ${5 * k} + ${j} = ${m}(분)`,
    mistakes: { [k + j]: "숫자 1은 5분이에요." },
  };
});

/** 1분 단위 차시용 잘못 읽은 까닭: 작은 눈금을 세지 않았거나, 숫자를 1분으로 읽었다(5분 단위 시각만 나오는 l2-clock-error 대신) */
export const clock1Error = word("l2-clock1-error", (rand) => {
  const h = randInt(rand, 1, 11);
  // 짧은바늘이 숫자 h 가까이에 있도록 29분까지
  const k = randInt(rand, 1, 5);
  const r = randInt(rand, 1, 4);
  const m = 5 * k + r;
  const skipTicks = rand() < 0.5;
  const said = skipTicks ? 5 * k : k + r;
  if (said === 5 * k && !skipTicks) return null;
  const right = `바른 시각은 ${h}시 ${m}분이에요.`;
  const TICKS = `작은 눈금 ${r}칸을 세지 않았어요.`;
  const NUMBER = `긴바늘이 지나온 숫자 ${josa(k, "은/는")} ${5 * k}분인데 ${k}분으로 읽었어요.`;
  const answer = `${skipTicks ? TICKS : NUMBER} ${right}`;
  const choices = opts(rand, answer, [`${skipTicks ? NUMBER : TICKS} ${right}`, // h === k이면 두 바늘이 거의 겹쳐 '바꾸어 읽었다'도 말이 되므로 그 보기를 쓰지 않는다
    ...(h === k ? [] : [`짧은바늘과 긴바늘을 바꾸어 읽었어요. ${right}`]),
    `${skipTicks ? TICKS : NUMBER} 바른 시각은 ${h}시 ${5 * k + 5 - r}분이에요.`, `바르게 읽었어요. ${h}시 ${said}분이 맞아요.`]);
  if (!choices) return null;
  const name = pick(rand, NAMES);
  return {
    key: `${h}:${m}:${skipTicks}`,
    prompt: `${josa(name, "은/는")} 시계를 보고 ${h}시 ${said}분이라고 읽었습니다. 잘못된 까닭과 바른 시각을 고르세요.`,
    visual: clock2(h, m),
    choices,
    answer,
    hint: "긴바늘이 지나온 숫자로 5분씩 세고, 작은 눈금 한 칸은 1분씩 더 세어요.",
    explanation: `긴바늘이 숫자 ${k}(${5 * k}분)에서 작은 눈금 ${r}칸 더 → ${h}시 ${m}분`,
  };
});

/* ── 몇 시 몇 분 전 ── */

export const beforeRead = easy("l2-before-read", (rand) => {
  const h = randInt(rand, 2, 12);
  const d = pick(rand, [5, 10, 15]);
  return {
    key: `${h}:${d}`,
    prompt: "시계가 나타내는 시각은 몇 시 몇 분 전인가요?",
    visual: clock2(h - 1, 60 - d),
    answer: `${h},${d}`,
    unit: ["시", "분 전"],
    hint: `긴바늘이 12까지 가려면 몇 분이 더 있어야 하는지 세어요.`,
    explanation: `${h - 1}시 ${60 - d}분 → ${h}시가 되려면 ${d}분이 더 있어야 하므로 ${h}시 ${d}분 전`,
    mistakes: { [`${h - 1},${d}`]: "몇 시 몇 분 전은 다가올 시각을 기준으로 말해요." },
  };
});

export const beforeSame = mid("l2-before-same", (rand) => {
  const h = randInt(rand, 1, 11);
  const m = pick(rand, [40, 45, 50, 55]);
  const d = 60 - m;
  const answer = `${h + 1}시 ${d}분 전`;
  const choices = opts(rand, answer, [`${h}시 ${d}분 전`, `${h + 1}시 ${m}분 전`, `${h + 1}시 ${d + 5}분 전`, `${h}시 ${m}분 전`]);
  if (!choices) return null;
  return {
    key: `${h}:${m}`,
    prompt: "시계가 나타내는 시각을 '몇 시 몇 분 전'으로 바르게 읽은 것을 고르세요.",
    visual: clock2(h, m),
    choices,
    answer,
    hint: "먼저 몇 시 몇 분인지 읽고, 다음 정각까지 몇 분 남았는지 세어요.",
    explanation: `${h}시 ${m}분 = ${answer}`,
  };
});

export const beforeCompare = word("l2-before-compare", (rand) => {
  const [n1, n2] = shuffle(rand, NAMES);
  const h = randInt(rand, 2, 11);
  const d = pick(rand, [5, 10, 15]);
  const e = randInt(rand, 1, 4) * 5;
  return {
    key: `${h}:${d}:${e}`,
    prompt: `${josa(n1, "은/는")} ${h}시 ${d}분 전에, ${josa(n2, "은/는")} ${h}시 ${e}분에 도서관에 도착했습니다. 먼저 도착한 사람은 몇 분 먼저 도착했나요?`,
    answer: d + e,
    unit: "분",
    hint: `${h}시를 기준으로 두 사람이 도착한 시각이 몇 분 차이인지 생각해요.`,
    explanation: `${n1}: ${hmText(h * 60 - d)}, ${n2}: ${h}시 ${e}분 → ${josa(n1, "이/가")} ${d} + ${e} = ${d + e}분 먼저`,
    mistakes: { [Math.abs(e - d)]: "몇 분 전은 그 시각보다 앞선 시각이에요." },
  };
});

export const beforeReverse = word("l2-before-reverse", (rand) => {
  const h = randInt(rand, 2, 11);
  const d = pick(rand, [5, 10, 15]);
  const a = randInt(rand, 2, 5) * 10;
  const end = h * 60 - d;
  const start = end - a;
  // 정답이 '6시 0분'처럼 0분이 되지 않게
  if (start % 60 === 0) return null;
  return {
    key: `${h}:${d}:${a}`,
    prompt: `${a}분 동안 청소를 하고 시계를 보았더니 그림과 같았습니다. 청소를 시작한 시각은 몇 시 몇 분인가요?`,
    visual: clock2(H(end), end % 60, { label: `청소를 마친 시각 ${hmText(end)}` }),
    answer: hm(start),
    unit: ["시", "분"],
    hint: "먼저 시계가 나타내는 시각을 읽은 뒤, 거꾸로 청소한 시간만큼 앞으로 가요.",
    explanation: `마친 시각 ${hmText(end)}(${h}시 ${d}분 전), ${a}분 전 → ${hmText(start)}`,
  };
});

/* ── 1시간과 걸린 시간 ── */

export const elapsedBand = easy("l2-elapsed-band", (rand) => {
  const h = randInt(rand, 1, 9);
  const s = h * 60 + randInt(rand, 0, 3) * 10;
  const len = randInt(rand, 3, 10) * 10;
  const act = pick(rand, ["책 읽기", "숙제", "피아노", "줄넘기"]);
  return {
    key: `${s}:${len}`,
    prompt: `${josa(act, "을/를")} 한 시간을 시간 띠에 색칠했습니다. 시간 띠 한 칸은 10분입니다. ${josa(act, "을/를")} 한 시간은 몇 분인가요?`,
    visual: minuteBand(h * 60, h * 60 + 120, [{ from: s, to: s + len }], `${hmText(h * 60)}부터 2시간 시간 띠, ${hmText(s)}~${hmText(s + len)} 색칠`),
    answer: len,
    unit: "분",
    hint: "색칠한 칸을 세어 10분씩 뛰어 세어요. 6칸이 60분 = 1시간이에요.",
    explanation: `${len / 10}칸 → ${len}분${len >= 60 ? ` = 1시간${len > 60 ? ` ${len - 60}분` : ""}` : ""}`,
  };
});

export const elapsed = mid("l2-elapsed", (rand) => {
  const s = randInt(rand, 1, 9) * 60 + randInt(rand, 0, 11) * 5;
  const len = randInt(rand, 4, 22) * 5;
  const e = s + len;
  return {
    key: `${s}:${len}`,
    prompt: "시작한 시각과 끝난 시각을 나타낸 시계입니다. 걸린 시간은 몇 분인가요?",
    visual: twoClocks([H(s), s % 60], [H(e), e % 60], ["시작한 시각", "끝난 시각"]),
    answer: len,
    unit: "분",
    hint: "1시간은 60분이에요. 정각을 기준으로 나누어 세어 보세요.",
    explanation: `${hmText(s)} → ${hmText(e)}: ${len >= 60 ? `1시간 ${len - 60}분 = ` : ""}${len}분`,
  };
});

export const timeUnits = mid("time-units", (rand) => {
  if (rand() < 0.5) {
    const m = randInt(rand, 1, 11) * 5;
    return {
      key: `a:${m}`,
      prompt: "□ 안에 알맞은 수를 써넣으세요.",
      expression: `1시간 ${m}분 = □분`,
      answer: 60 + m,
      hint: "1시간 = 60분이에요.",
      explanation: `60 + ${m} = ${60 + m}(분)`,
      mistakes: { [100 + m]: "1시간을 100분으로 계산했어요." },
    };
  }
  const n = randInt(rand, 13, 23) * 5;
  return {
    key: `b:${n}`,
    prompt: "□ 안에 알맞은 수를 써넣으세요.",
    expression: `${n}분 = □시간 □분`,
    answer: `1,${n - 60}`,
    unit: ["시간", "분"],
    hint: "60분이 1시간이에요. 60분을 먼저 떼어 내요.",
    explanation: `${n}분 = 60분 + ${n - 60}분 = 1시간 ${n - 60}분`,
    mistakes: { [`1,${n - 100}`]: "1시간은 60분이에요." },
  };
});

export const elapsedCompare = word("l2-elapsed-compare", (rand) => {
  const [a1, a2] = shuffle(rand, ["독서", "숙제", "그림", "운동"]);
  const h = randInt(rand, 1, 3);
  const s1 = h * 60 + randInt(rand, 0, 2) * 10;
  const l1 = randInt(rand, 3, 8) * 10;
  const s2 = s1 + l1 + randInt(rand, 1, 3) * 10;
  const l2 = randInt(rand, 3, 8) * 10;
  if (l1 === l2 || s2 + l2 > h * 60 + 240) return null;
  const more = l1 > l2 ? a1 : a2;
  return {
    key: `${s1}:${l1}:${s2}:${l2}`,
    prompt: `오후에 ${josa(a1, "과/와")} ${josa(a2, "을/를")} 한 시간을 시간 띠에 나타냈습니다. 시간 띠 한 칸은 10분입니다. 더 오래 한 것은 몇 분 더 오래 했나요?`,
    visual: minuteBand(h * 60, h * 60 + 240, [{ from: s1, to: s1 + l1, text: a1 }, { from: s2, to: s2 + l2, text: a2 }], `오후 ${h}시부터 4시간 시간 띠: ${a1} ${hmText(s1)}~${hmText(s1 + l1)}, ${a2} ${hmText(s2)}~${hmText(s2 + l2)}`),
    answer: Math.abs(l1 - l2),
    unit: "분",
    hint: "두 가지 일을 한 시간을 각각 구해 비교해요.",
    explanation: `${a1} ${l1}분, ${a2} ${l2}분 → ${josa(more, "을/를")} ${Math.abs(l1 - l2)}분 더`,
  };
});

/* ── 달력 ── */

export const calendarRead = easy("l2-calendar-read", (rand) => {
  const month = randInt(rand, 1, 12);
  const first = randInt(rand, 0, 6);
  const last = MONTH_DAYS[month - 1];
  const d = randInt(rand, 2, last);
  const answer = WEEK[(first + d - 1) % 7];
  const choices = opts(rand, answer, shuffle(rand, WEEK.filter((w) => w !== answer)));
  if (!choices) return null;
  return {
    key: `${month}:${first}:${d}`,
    prompt: `달력을 보고 ${month}월 ${d}일은 무슨 요일인지 고르세요.`,
    visual: calendarScene(month, first, last, { circle: [d] }),
    choices,
    answer,
    hint: "날짜가 있는 줄에서 위로 올라가 요일을 읽어요.",
    explanation: `${month}월 ${d}일은 ${answer}입니다.`,
  };
});

export const calendarDay = mid("l2-calendar-day", (rand) => {
  const month = randInt(rand, 1, 12);
  const first = randInt(rand, 0, 6);
  const last = MONTH_DAYS[month - 1];
  const target = randInt(rand, 18, last);
  const answer = WEEK[(first + target - 1) % 7];
  const choices = opts(rand, answer, [WEEK[(first + target) % 7], WEEK[(first + target + 5) % 7], WEEK[first], WEEK[(first + target + 2) % 7]]);
  if (!choices) return null;
  return {
    key: `${month}:${first}:${target}`,
    prompt: `${month}월 달력의 일부가 찢어졌습니다. 같은 달 ${target}일은 무슨 요일인가요?`,
    visual: calendarScene(month, first, last, { weeks: 2 }),
    choices,
    answer,
    hint: "같은 요일은 7일마다 돌아와요. 보이는 날짜에 7씩 더해 보세요.",
    explanation: `${((target - 1) % 7) + 1}일이 ${answer}이고 7일마다 같은 요일 → ${target}일도 ${answer}`,
  };
});

export const calendarNth = word("l2-calendar-nth", (rand) => {
  const month = randInt(rand, 1, 12);
  const first = randInt(rand, 0, 6);
  const y = randInt(rand, 0, 6);
  const n = randInt(rand, 3, 4);
  const firstDate = 1 + ((y - first + 7) % 7);
  const date = firstDate + 7 * (n - 1);
  return {
    key: `${month}:${first}:${y}:${n}`,
    prompt: `${month}월 달력의 첫째 주만 보입니다. 이 달의 ${ord(n)} ${josa(WEEK[y], "은/는")} 며칠인가요?`,
    visual: calendarScene(month, first, MONTH_DAYS[month - 1], { weeks: 1 }),
    answer: date,
    unit: "일",
    hint: `먼저 첫째 ${WEEK[y]}을 찾고, 7일씩 더해요.`,
    explanation: `첫째 ${WEEK[y]} ${firstDate}일 → ${Array.from({ length: n }, (_, i) => firstDate + 7 * i).join(", ")} → ${josa(ord(n), "은/는")} ${date}일`,
    mistakes: { [firstDate + 7 * n]: "첫째 주의 날짜부터 세어야 해요." },
  };
});

/** 생활 속 규칙: 달력에서 방향에 따라 날짜가 몇씩 커지는지 */
export const calendarColumn = easy("l2-calendar-column", (rand) => {
  const first = randInt(rand, 0, 6);
  const month = randInt(rand, 1, 12);
  const dir = pick(rand, [[7, "↓"], [8, "↘"], [6, "↙"], [1, "→"]] as const);
  const d = randInt(rand, 1, 8);
  const days = [d, d + dir[0], d + 2 * dir[0]];
  const cols = days.map((x) => (first + x - 1) % 7);
  // 같은 방향으로 한 칸씩 이어지는지(줄이 바뀌며 끊기지 않는지)
  const step = dir[0] === 7 ? 0 : dir[0] === 8 || dir[0] === 1 ? 1 : -1;
  if (cols[1] - cols[0] !== step || cols[2] - cols[1] !== step || days[2] > MONTH_DAYS[month - 1]) return null;
  return {
    key: `${month}:${first}:${dir[0]}:${d}`,
    prompt: `달력에서 ${dir[1]} 방향으로 놓인 날짜에 ○표를 했습니다. ○표 한 날짜는 몇씩 커지나요?`,
    visual: calendarScene(month, first, MONTH_DAYS[month - 1], { circle: days }),
    answer: dir[0],
    hint: "○표 한 날짜의 차를 구해 보세요.",
    explanation: `${days.join(", ")} → ${dir[0]}씩 커져요.`,
  };
});
