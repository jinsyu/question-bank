import type { ShapeScene } from "../types";
import { pick, randInt, shuffle } from "../../lib/random";
import { josa } from "../josa";
import { clockNumR, clockParts } from "../generators/pictures";
import { easy, hard, measureKit, mid, nameOf, twoNames } from "./g3-kit";
import { balance, beaker, dial, ruler, scene, sceneOk, tapeOnRuler, type Parts, type Pt } from "./g3-figures";

/**
 * 3학년 측정 단원: 3-1 '길이와 시간', 3-2 '들이와 무게' 차시별 생성기.
 * 교과서처럼 자·수직선·길 그림·시계·비커·저울 그림을 보고 푸는 유형을 차시마다 절반 이상 둔다.
 */

type Rand = () => number;

/** 큰 단위·작은 단위가 섞인 값 표기(0인 단위는 쓰지 않는다) */
const mixedOf = (big: string, small: string, base: number) => (v: number) =>
  v % base === 0 ? `${v / base} ${big}` : v < base ? `${v} ${small}` : `${Math.floor(v / base)} ${big} ${v % base} ${small}`;
const kmm = mixedOf("km", "m", 1000);
const lml = mixedOf("L", "mL", 1000);
const kgg = mixedOf("kg", "g", 1000);
const cmmm = mixedOf("cm", "mm", 10);
const split = (v: number, base: number) => `${Math.floor(v / base)},${v % base}`;

/** 누가 몇 더: 보기 4개 */
const whoMore = (rand: Rand, W: string, L: string, diff: string, off: string) => {
  const answer = `${W}, ${diff}`;
  return { answer, choices: shuffle(rand, [answer, `${L}, ${diff}`, `${W}, ${off}`, `${L}, ${off}`]) };
};

/* ── 길이: 자 ── */

const RX = 24;
const RU = 30;
const RULER_TOP = 46;
const tapeScene = (from: number, to: number, label: string) =>
  scene(RX * 2 + 10 * RU, RULER_TOP + 50, label, ruler(RX, RULER_TOP, 10, RU), tapeOnRuler(RX, RU, from, to, 18, RULER_TOP));

export const mmRuler = easy("l3-mm-ruler", (rand) => {
  const len = randInt(rand, 2, 8) * 10 + randInt(rand, 1, 9);
  return {
    key: `${len}`,
    prompt: "자로 색 테이프의 길이를 재었습니다. 색 테이프의 길이는 몇 cm 몇 mm인가요?",
    visual: tapeScene(0, len, "자의 0 눈금에 맞추어 놓은 색 테이프"),
    answer: split(len, 10),
    unit: ["cm", "mm"],
    hint: "큰 눈금 한 칸은 1 cm, 작은 눈금 한 칸은 1 mm예요. cm 눈금을 먼저 읽고 작은 눈금 수를 세어요.",
    explanation: `${Math.floor(len / 10)} cm보다 작은 눈금 ${len % 10}칸 더 → ${cmmm(len)}`,
    mistakes: { [`${Math.floor(len / 10) + 1},${len % 10}`]: "끝이 다음 cm 눈금에 닿지 않았어요. cm 눈금은 끝보다 작은 쪽을 읽어요." },
  };
});

export const mmShift = mid("l3-mm-shift", (rand) => {
  const from = randInt(rand, 1, 3) * 10;
  const len = randInt(rand, 2, 6) * 10 + randInt(rand, 1, 9);
  return {
    key: `${from}:${len}`,
    prompt: "자로 색 테이프의 길이를 재었습니다. 색 테이프의 길이는 몇 mm인가요?",
    visual: tapeScene(from, from + len, "자의 0이 아닌 눈금에서 시작하는 색 테이프"),
    answer: len,
    unit: "mm",
    hint: "색 테이프가 0 눈금에서 시작하지 않아요. 시작 눈금부터 1 cm가 몇 번, 작은 눈금이 몇 칸인지 세어요.",
    explanation: `${from / 10} cm 눈금부터 ${cmmm(from + len)} 눈금까지 → ${cmmm(len)} = ${len} mm`,
    mistakes: { [from + len]: "끝 눈금을 그대로 읽었어요. 시작 눈금이 0이 아니에요." },
  };
});

export const mmCut = hard("l3-mm-cut", (rand) => {
  const from = randInt(rand, 0, 1) * 10;
  const len = randInt(rand, 6, 8) * 10 + randInt(rand, 1, 9);
  const cut = randInt(rand, 12, len - 15);
  const left = len - cut;
  if (cut % 10 === 0 || left % 10 === 0) return null;
  return {
    key: `${from}:${len}:${cut}`,
    prompt: `자로 잰 색 테이프에서 ${cut} mm를 잘라 냈습니다. 남은 색 테이프의 길이는 몇 cm 몇 mm인가요?`,
    visual: tapeScene(from, from + len, "자 위에 놓인 색 테이프"),
    answer: split(left, 10),
    unit: ["cm", "mm"],
    hint: "먼저 자의 눈금을 읽어 색 테이프의 길이를 mm로 나타내요.",
    explanation: `색 테이프: ${cmmm(len)} = ${len} mm, ${len} − ${cut} = ${left}(mm) = ${cmmm(left)}`,
    mistakes: { [split(from + len - cut, 10)]: "색 테이프가 시작하는 눈금을 확인해요." },
  };
});

export const mm = measureKit({
  key: "mm",
  big: "cm",
  small: "mm",
  base: 10,
  range: [2, 30],
  orderRange: [10, 18],
  order: (list, most) => `친구들이 가진 연필의 길이입니다. ${list}. 연필이 가장 ${most ? "긴" : "짧은"} 사람은 누구인가요?`,
});

/* ── 길이: km ── */

export const km = measureKit({
  key: "km",
  big: "km",
  small: "m",
  base: 1000,
  step: 10,
  range: [1, 9],
  order: (list, most) => `친구들의 집에서 도서관까지의 거리입니다. ${list}. 도서관에서 가장 ${most ? "먼" : "가까운"} 곳에 사는 사람은 누구인가요?`,
});

export const kmLine = easy("l3-km-line", (rand) => {
  const v = randInt(rand, 1, 2) * 1000 + randInt(rand, 1, 9) * 100;
  const x0 = 30;
  const xOf = (m: number) => x0 + m / 10;
  const lines: Parts["lines"] = [{ from: [x0, 44], to: [xOf(3000), 44] }];
  for (let m = 0; m <= 3000; m += 100) lines.push({ from: [xOf(m), m % 1000 ? 39 : 34], to: [xOf(m), m % 1000 ? 49 : 54], width: 1 });
  lines.push({ from: [xOf(v), 26], to: [xOf(v), 38], arrows: "end", width: 1.5 });
  return {
    key: `${v}`,
    prompt: "수직선에서 ㉠이 나타내는 거리는 몇 km 몇 m인가요?",
    visual: scene(360, 80, "0 km부터 3 km까지 나타낸 수직선과 ㉠", {
      lines,
      texts: [{ at: [xOf(v), 16], text: "㉠" }, ...[0, 1, 2, 3].map((k) => ({ at: [xOf(k * 1000), 68] as Pt, text: k ? `${k} km` : "0" }))],
    }),
    answer: split(v, 1000),
    unit: ["km", "m"],
    hint: "1 km를 똑같이 10칸으로 나누었으므로 작은 눈금 한 칸은 100 m예요.",
    explanation: `${Math.floor(v / 1000)} km에서 작은 눈금 ${(v % 1000) / 100}칸 더 → ${kmm(v)}`,
    mistakes: { [`${Math.floor(v / 1000)},${(v % 1000) / 100}`]: "작은 눈금 한 칸은 1 m가 아니라 100 m예요." },
  };
});

/** 곧은 길 위의 장소(점)와 구간 거리 */
function routeScene(names: string[], dists: string[], label: string): ShapeScene {
  const gap = names.length === 3 ? 150 : 108;
  const x0 = 26;
  const y = 52;
  const xs = names.map((_, i) => x0 + i * gap);
  return scene(x0 * 2 + gap * (names.length - 1), 86, label, {
    lines: xs.slice(1).map((x, i) => ({ from: [xs[i], y] as Pt, to: [x, y] as Pt })),
    dots: xs.map((x) => [x, y] as Pt),
    texts: [
      ...names.map((n, i) => ({ at: [xs[i], y + 22] as Pt, text: n })),
      ...dists.map((d, i) => ({ at: [(xs[i] + xs[i + 1]) / 2, y - 18] as Pt, text: d })),
    ],
  });
}

export const kmTrip = mid("l3-km-trip", (rand) => {
  const a = randInt(rand, 30, 95) * 10;
  const b = randInt(rand, 30, 95) * 10;
  if (a + b < 1000 || (a + b) % 1000 === 0) return null;
  const s = a + b;
  return {
    key: `${a}:${b}`,
    prompt: `${nameOf(rand)}네 집에서 학교를 지나 공원까지 가는 길입니다. 집에서 공원까지의 거리는 몇 km 몇 m인가요?`,
    visual: routeScene(["집", "학교", "공원"], [`${a} m`, `${b} m`], "집, 학교, 공원을 잇는 길과 구간 거리"),
    answer: split(s, 1000),
    unit: ["km", "m"],
    hint: "두 거리를 더한 뒤 1000 m를 1 km로 바꾸어요.",
    explanation: `${a} + ${b} = ${s}(m) = ${kmm(s)}`,
    mistakes: { [`0,${s}`]: "1000 m는 1 km로 나타내요." },
  };
});

export const kmRoute3 = hard("l3-km-route3", (rand) => {
  const d = [randInt(rand, 30, 90) * 10, 1000 + randInt(rand, 10, 90) * 10, randInt(rand, 30, 90) * 10];
  const s = d[0] + d[1] + d[2];
  if (s % 1000 === 0) return null;
  const v = routeScene(["집", "우체국", "도서관", "학교"], d.map(kmm), "집, 우체국, 도서관, 학교를 잇는 길과 구간 거리");
  if (!sceneOk(v)) return null;
  return {
    key: d.join(":"),
    prompt: "집에서 우체국과 도서관을 지나 학교까지 가는 길입니다. 집에서 학교까지의 거리는 몇 km 몇 m인가요?",
    visual: v,
    answer: split(s, 1000),
    unit: ["km", "m"],
    hint: "모든 거리를 m로 바꾸어 더한 뒤, 다시 몇 km 몇 m로 나타내요.",
    explanation: `${d[0]} + ${d[1]} + ${d[2]} = ${s}(m) = ${kmm(s)}`,
  };
});

/* ── 길이 어림 ── */

/** 길이를 어림할 대상: [무엇, 약 얼마, 단위] */
const LENGTHS: [string, number, string][] = [
  ["연필의 길이", 15, "cm"],
  ["운동장 한 바퀴의 거리", 200, "m"],
  ["개미의 몸길이", 5, "mm"],
  ["서울에서 부산까지의 거리", 400, "km"],
  ["교실 문의 높이", 2, "m"],
  ["엄지손톱의 너비", 12, "mm"],
  ["수학책의 긴 쪽의 길이", 26, "cm"],
  ["동전의 두께", 2, "mm"],
  ["학교 건물의 높이", 15, "m"],
  ["한라산의 높이", 2, "km"],
  ["기차로 두 시간 동안 간 거리", 200, "km"],
  ["클립의 길이", 30, "mm"],
];

export const unitPick = easy("l3-len-unit", (rand) => {
  const [what, n, unit] = pick(rand, LENGTHS);
  return {
    key: what,
    prompt: `□ 안에 알맞은 단위를 고르세요.\n${josa(what, "은/는")} 약 ${n} □입니다.`,
    answer: unit,
    choices: ["mm", "cm", "m", "km"],
    hint: "1 cm는 손가락 너비쯤, 1 m는 양팔을 벌린 길이쯤, 1 km는 걸어서 15분쯤 걸리는 거리예요.",
    explanation: `${josa(what, "은/는")} 약 ${n} ${unit}입니다.`,
  };
});

const PLACES = ["도서관", "공원", "병원", "시장"];

export const estMap = easy("l3-est-map", (rand) => {
  const k = randInt(rand, 2, 4);
  const place = pick(rand, PLACES);
  const U = 70;
  const x0 = 24;
  const tx = x0 + k * U + randInt(rand, -8, 8);
  return {
    key: `${k}:${place}:${tx}`,
    prompt: `집에서 학교까지의 거리는 1 km입니다. 집에서 ${place}까지의 거리는 약 몇 km인가요?`,
    visual: scene(344, 86, `집, 학교, ${josa(place, "이/가")} 있는 곧은 길`, {
      lines: [{ from: [x0, 50], to: [tx, 50] }],
      dots: [
        [x0, 50],
        [x0 + U, 50],
        [tx, 50],
      ],
      texts: [
        { at: [x0 + U / 2, 32], text: "1 km" },
        { at: [x0, 72], text: "집" },
        { at: [x0 + U, 72], text: "학교" },
        { at: [tx, 72], text: place },
      ],
    }),
    answer: k,
    unit: "km",
    hint: "집에서 학교까지의 길이(1 km)가 몇 번쯤 들어가는지 어림해요.",
    explanation: `1 km가 약 ${k}번 들어가므로 약 ${k} km입니다.`,
  };
});

/** 걸음·뼘을 호(반원)로 나타낸 그림 */
function stepsScene(n: number, w: number, label: string, tail?: string): ShapeScene {
  const x0 = 20;
  const y = 60;
  const end = x0 + n * w + (tail ? 36 : 0);
  return scene(Math.max(330, end + 50), 90, label, {
    lines: [{ from: [x0, y], to: [end, y] }],
    arcs: Array.from({ length: n }, (_, i) => ({ c: [x0 + w / 2 + i * w, y] as Pt, r: w / 2, from: 0, to: 180, width: 2 })),
    dots: [
      [x0, y],
      [end, y],
    ],
    texts: tail ? [{ at: [x0 + n * w + 18, y + 18], text: tail }] : [],
  });
}

export const estPace = mid("l3-est-pace", (rand) => {
  const pace = pick(rand, [40, 50, 60]);
  const n = randInt(rand, 4, 9);
  const place = pick(rand, ["교실 앞문에서 뒷문까지", "칠판의 긴 쪽", "화단의 긴 쪽"]);
  const name = nameOf(rand);
  return {
    key: `${pace}:${n}:${place}`,
    prompt: `${name}의 한 걸음은 약 ${pace} cm입니다. ${place}의 길이를 ${name}의 걸음으로 재었더니 그림과 같았습니다. ${place}의 길이는 약 몇 cm인가요?`,
    visual: stepsScene(n, 34, `걸음 ${n}번으로 잰 길이`),
    answer: pace * n,
    unit: "cm",
    hint: "그림에서 걸음 수를 세어 (한 걸음의 길이) × (걸음 수)를 구해요.",
    explanation: `${n}걸음 → ${pace} × ${n} = ${pace * n}(cm)`,
    mistakes: { [pace * (n - 1)]: "걸음 수를 다시 세어 보세요." },
  };
});

export const estKmTime = mid("l3-est-km-time", (rand) => {
  const per = pick(rand, [10, 12, 15, 20, 25]);
  const n = randInt(rand, 2, 5);
  return {
    key: `${per}:${n}`,
    prompt: `${nameOf(rand)}가 1 km를 걷는 데 약 ${per}분이 걸립니다. 같은 빠르기로 ${n} km를 걸으면 약 몇 분이 걸릴까요?`,
    answer: per * n,
    unit: "분",
    hint: `1 km에 ${per}분씩 ${n}번이에요.`,
    explanation: `${per} × ${n} = ${per * n}(분)`,
  };
});

export const estSpan = hard("l3-est-span", (rand) => {
  const span = pick(rand, [12, 13, 15]);
  const n = randInt(rand, 4, 7);
  const extra = randInt(rand, 2, span - 3);
  const name = nameOf(rand);
  return {
    key: `${span}:${n}:${extra}`,
    prompt: `${name}의 한 뼘은 약 ${span} cm입니다. 책상의 긴 쪽을 ${name}의 뼘으로 재었더니 그림과 같이 몇 뼘과 ${extra} cm였습니다. 책상의 긴 쪽의 길이는 약 몇 cm인가요?`,
    visual: stepsScene(n, 36, `뼘 ${n}번과 남은 ${extra} cm로 잰 책상의 긴 쪽`, `${extra} cm`),
    answer: span * n + extra,
    unit: "cm",
    hint: "그림에서 뼘 수를 세어 뼘으로 잰 길이를 곱셈으로 구한 뒤 남은 길이를 더해요.",
    explanation: `${n}뼘 → ${span} × ${n} = ${span * n}, ${span * n} + ${extra} = ${span * n + extra}(cm)`,
    mistakes: { [span * n]: "남은 길이도 더해야 해요." },
  };
});

export const estWho = hard("l3-est-who", (rand) => {
  const [A, B] = twoNames(rand);
  const [p, q] = [pick(rand, [40, 50, 60]), pick(rand, [40, 50, 60])];
  const [m, n] = [randInt(rand, 3, 9), randInt(rand, 3, 9)];
  const x = p * m;
  const y = q * n;
  if (x === y) return null;
  const diff = Math.abs(x - y);
  const { answer, choices } = whoMore(rand, x > y ? A : B, x > y ? B : A, `${diff} cm`, `${diff + 10} cm`);
  return {
    key: `${p}:${m}:${q}:${n}`,
    prompt: `한 걸음이 약 ${p} cm인 ${A}는 복도에서 ${m}걸음을 걸었고, 한 걸음이 약 ${q} cm인 ${B}는 ${n}걸음을 걸었습니다. 누가 약 몇 cm 더 멀리 걸었나요?`,
    answer,
    choices,
    hint: "각자 걸은 거리를 (한 걸음) × (걸음 수)로 구해 비교해요.",
    explanation: `${A}: ${p} × ${m} = ${x}(cm), ${B}: ${q} × ${n} = ${y}(cm) → ${answer} 더`,
  };
});

/* ── 길이의 덧셈과 뺄셈 ── */

export const kmAdd = easy("l3-km-add", (rand) => {
  const a = randInt(rand, 1, 3) * 1000 + randInt(rand, 10, 80) * 10;
  const b = randInt(rand, 1, 3) * 1000 + randInt(rand, 1, 89 - ((a % 1000) / 10 - 1)) * 10;
  if ((a % 1000) + (b % 1000) >= 1000 || b % 1000 === 0) return null;
  const s = a + b;
  return {
    key: `${a}:${b}`,
    prompt: "집에서 학교를 지나 공원까지 가는 길입니다. 집에서 공원까지의 거리는 몇 km 몇 m인가요?",
    visual: routeScene(["집", "학교", "공원"], [kmm(a), kmm(b)], "집, 학교, 공원을 잇는 길과 구간 거리"),
    answer: split(s, 1000),
    unit: ["km", "m"],
    hint: "km는 km끼리, m는 m끼리 더해요.",
    explanation: `${kmm(a)} + ${kmm(b)} = ${kmm(s)}`,
  };
});

export const ribbonJoin = hard("w3-ribbon-join", (rand) => {
  const a = randInt(rand, 10, 20) * 10 + randInt(rand, 1, 9);
  const b = randInt(rand, 10, 20) * 10 + randInt(rand, 1, 9);
  const overlap = randInt(rand, 12, 25);
  const total = a + b - overlap;
  if (total % 10 === 0) return null;
  const v = scene(350, 100, "겹쳐 이은 색 테이프 두 개와 겹친 부분", {
    polygons: [
      { points: [[20, 30], [190, 30], [190, 44], [20, 44]], fill: true },
      { points: [[160, 44], [330, 44], [330, 58], [160, 58]], fill: true },
    ],
    lines: [
      { from: [160, 58], to: [160, 72], dashed: true, width: 1 },
      { from: [190, 44], to: [190, 72], dashed: true, width: 1 },
    ],
    texts: [
      { at: [105, 16], text: cmmm(a) },
      { at: [262, 74], text: cmmm(b) },
      { at: [175, 88], text: `${overlap} mm` },
    ],
  });
  if (!sceneOk(v)) return null;
  return {
    key: `${a}:${b}:${overlap}`,
    prompt: "길이가 다른 색 테이프 2장을 그림과 같이 겹치게 이었습니다. 이은 색 테이프의 전체 길이는 몇 cm 몇 mm인가요?",
    visual: v,
    answer: split(total, 10),
    unit: ["cm", "mm"],
    hint: "두 색 테이프의 길이를 더한 뒤 겹친 부분의 길이를 빼요.",
    explanation: `${cmmm(a)} + ${cmmm(b)} = ${cmmm(a + b)}, ${cmmm(a + b)} − ${overlap} mm = ${cmmm(total)}`,
    mistakes: { [split(a + b, 10)]: "겹친 부분만큼 빼야 해요." },
  };
});

export const routeWho = hard("l3-route", (rand) => {
  const a = [randInt(rand, 20, 70) * 10, randInt(rand, 20, 70) * 10];
  const x = a[0] + a[1];
  const y = 1000 + randInt(rand, 1, 40) * 10;
  if (x === y || Math.abs(x - y) > 900) return null;
  const diff = Math.abs(x - y);
  const answer = x < y ? `놀이터를 지나는 길, ${diff} m` : `큰길, ${diff} m`;
  const other = x < y ? `큰길, ${diff} m` : `놀이터를 지나는 길, ${diff} m`;
  const v = scene(350, 150, "집에서 학교까지 놀이터를 지나는 길과 큰길", {
    lines: [
      { from: [30, 120], to: [175, 36] },
      { from: [175, 36], to: [320, 120] },
      { from: [30, 120], to: [320, 120] },
    ],
    dots: [
      [30, 120],
      [175, 36],
      [320, 120],
    ],
    texts: [
      { at: [30, 140], text: "집" },
      { at: [175, 16], text: "놀이터" },
      { at: [320, 140], text: "학교" },
      { at: [88, 62], text: `${a[0]} m` },
      { at: [262, 62], text: `${a[1]} m` },
      { at: [175, 104], text: kmm(y) },
    ],
  });
  if (!sceneOk(v)) return null;
  return {
    key: `${a.join(":")}:${y}`,
    prompt: "집에서 학교까지 가는 길은 놀이터를 지나는 길과 큰길 두 가지입니다. 어느 길이 몇 m 더 가까운가요?",
    visual: v,
    answer,
    choices: shuffle(rand, [answer, other, answer.replace(`${diff} m`, `${diff + 100} m`), other.replace(`${diff} m`, `${diff + 100} m`)]),
    hint: "두 길의 거리를 모두 m로 나타내어 비교해요.",
    explanation: `놀이터를 지나는 길: ${a[0]} + ${a[1]} = ${x}(m), 큰길: ${kmm(y)} = ${y} m → 차: ${diff} m`,
  };
});

/* ── 시간: 초 ── */

export const sec = measureKit({
  key: "sec",
  big: "분",
  small: "초",
  base: 60,
  range: [1, 5],
  orderRange: [1, 1],
  order: (list, most) => `훌라후프를 떨어뜨리지 않고 돌린 기록입니다. ${list}. 가장 ${most ? "오래" : "짧게"} 돌린 사람은 누구인가요?`,
});

/** 공용 바늘 시계(pictures.ts clockParts)에 가늘고 긴 초바늘을 더한다 */
const CR = 62;
const HALF = clockNumR(CR) + 12;
const clockAt = (c: Pt, h: number, m: number, s?: number): Parts => {
  const p = clockParts(c, CR, h, m);
  if (s === undefined) return p;
  const a = ((s * 6 - 90) * Math.PI) / 180;
  return { ...p, lines: [...p.lines!, { from: c, to: [Math.round(c[0] + (CR - 2) * Math.cos(a)), Math.round(c[1] + (CR - 2) * Math.sin(a))], width: 1 }] };
};
const clockScene1 = (h: number, m: number, s?: number) => scene(2 * HALF, 2 * HALF, s === undefined ? "바늘 시계" : "초바늘이 있는 시계", clockAt([HALF, HALF], h, m, s));
/** 두 시계(왼쪽·오른쪽)와 아래 이름표 */
const twoClocks = (a: [number, number, number?], b: [number, number, number?], names: [string, string]) =>
  scene(4 * HALF + 20, 2 * HALF + 26, `${names[0]}과 ${names[1]}을 나타낸 두 시계`, clockAt([HALF, HALF], ...a), clockAt([3 * HALF + 20, HALF], ...b), {
    texts: [
      { at: [HALF, 2 * HALF + 12], text: names[0] },
      { at: [3 * HALF + 20, 2 * HALF + 12], text: names[1] },
    ],
  });
/** 긴바늘(분)과 초바늘이 작은 눈금 4칸 안으로 가까워 겹쳐 보이는지(59분과 1초처럼 12를 사이에 둔 경우도) */
const handsClose = (m: number, s: number) => {
  const d = Math.abs(m - s) % 60;
  return Math.min(d, 60 - d) < 4;
};
const hms = (t: number) => `${Math.floor(t / 3600) || 12}시 ${Math.floor((t % 3600) / 60)}분 ${t % 60}초`;

export const secClock = easy("l3-sec-clock", (rand) => {
  const [h, m, s] = [randInt(rand, 1, 12), randInt(rand, 0, 59), randInt(rand, 1, 59)];
  if (handsClose(m, s)) return null;
  return {
    key: `${h}:${m}:${s}`,
    prompt: "시계가 나타내는 시각은 몇 시 몇 분 몇 초인가요?",
    visual: clockScene1(h, m, s),
    answer: `${h},${m},${s}`,
    unit: ["시", "분", "초"],
    hint: "가장 가늘고 긴 바늘이 초바늘이에요. 초바늘이 가리키는 작은 눈금 한 칸은 1초예요.",
    explanation: `짧은바늘 ${h}시, 긴바늘 ${m}분, 초바늘 ${s}초 → ${h}시 ${m}분 ${s}초`,
  };
});

export const secHand = mid("l3-sec-hand", (rand) => {
  const a = randInt(rand, 1, 11);
  const gap = randInt(rand, 2, 9);
  const b = ((a + gap - 1) % 12) + 1;
  const [h, m] = [randInt(rand, 1, 12), randInt(rand, 0, 59)];
  // 긴바늘이 초바늘과 겹쳐 보이지 않게
  if (Math.abs(m - a * 5) < 4) return null;
  return {
    key: `${a}:${b}:${h}:${m}`,
    prompt: `초바늘이 지금 가리키는 곳에서 시계 방향으로 돌아 숫자 ${josa(b, "을/를")} 가리킬 때까지 걸리는 시간은 몇 초인가요?`,
    visual: clockScene1(h, m, a * 5),
    answer: gap * 5,
    unit: "초",
    hint: "초바늘이 숫자 한 칸(작은 눈금 5칸)을 가는 데 5초가 걸려요.",
    explanation: `초바늘은 숫자 ${josa(a, "을/를")} 가리키고 있어요. 숫자 ${b}까지 ${gap}칸 → 5 × ${gap} = ${gap * 5}(초)`,
    mistakes: { [gap]: "숫자 한 칸은 1초가 아니라 5초예요." },
  };
});

export const secDur = hard("l3-sec-dur", (rand) => {
  const start = randInt(rand, 1, 11) * 3600 + randInt(rand, 0, 50) * 60 + randInt(rand, 0, 59);
  const d = randInt(rand, 70, 239);
  const end = start + d;
  if (d % 60 === 0 || Math.floor(end / 3600) !== Math.floor(start / 3600)) return null;
  const parts = (t: number): [number, number, number] => [Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60];
  if ([start, end].some((t) => handsClose(parts(t)[1], parts(t)[2]))) return null;
  const name = nameOf(rand);
  return {
    key: `${start}:${d}`,
    prompt: `${name}가 줄넘기를 시작한 시각과 끝낸 시각입니다. 줄넘기를 한 시간은 몇 분 몇 초인가요?`,
    visual: twoClocks(parts(start), parts(end), ["시작한 시각", "끝낸 시각"]),
    answer: `${Math.floor(d / 60)},${d % 60}`,
    unit: ["분", "초"],
    hint: "두 시계의 시각을 몇 시 몇 분 몇 초로 읽은 뒤 (끝낸 시각) − (시작한 시각)을 구해요.",
    explanation: `${hms(end)} − ${hms(start)} = ${Math.floor(d / 60)}분 ${d % 60}초`,
  };
});

/* ── 시간의 덧셈 ── */

const hm = (m: number) => (m % 60 ? `${Math.floor(m / 60)}시 ${m % 60}분` : `${m / 60}시`);
const dur = (m: number) => (m % 60 ? (m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m}분`) : `${m / 60}시간`);
const HM = ["시", "분"];
const hmAnswer = (t: number) => `${Math.floor(t / 60)},${t % 60}`;

export const secAdd = easy("l3-sec-sum", (rand) => {
  const [a, b] = [randInt(rand, 1, 5), randInt(rand, 1, 4)];
  const [c, d] = [randInt(rand, 5, 40), randInt(rand, 5, 18)];
  if (c + d >= 60) return null;
  return {
    key: `${a}:${c}:${b}:${d}`,
    prompt: "계산해 보세요.",
    expression: `${a}분 ${c}초 + ${b}분 ${d}초 = □분 □초`,
    answer: `${a + b},${c + d}`,
    unit: ["분", "초"],
    hint: "분은 분끼리, 초는 초끼리 더해요.",
    explanation: `${a + b}분 ${c + d}초`,
  };
});

export const timeAfter = easy("l3-time-after", (rand) => {
  const h = randInt(rand, 1, 11);
  const m = randInt(rand, 0, 8) * 5;
  const k = randInt(rand, 2, 11 - m / 5) * 5;
  const t = h * 60 + m + k;
  return {
    key: `${h}:${m}:${k}`,
    prompt: `시계가 나타내는 시각에서 ${k}분 후의 시각은 몇 시 몇 분인가요?`,
    visual: clockScene1(h, m),
    answer: hmAnswer(t),
    unit: HM,
    hint: "먼저 시계의 시각을 읽고, 분끼리 더해요.",
    explanation: `${hm(h * 60 + m)} + ${k}분 = ${hm(t)}`,
  };
});

export const timeClock = mid("time-clock", (rand) => {
  const start = randInt(rand, 1, 8) * 60 + randInt(rand, 4, 11) * 5;
  const d = randInt(rand, 1, 2) * 60 + randInt(rand, 3, 11) * 5;
  const end = start + d;
  if ((start % 60) + (d % 60) < 60 || end >= 12 * 60) return null;
  return {
    key: `${start}:${d}`,
    prompt: `시계가 나타내는 시각에서 ${dur(d)} 후의 시각은 몇 시 몇 분인가요?`,
    visual: clockScene1(Math.floor(start / 60), start % 60),
    answer: hmAnswer(end),
    unit: HM,
    hint: "시간은 시간끼리, 분은 분끼리 더하고, 60분이 넘으면 1시간으로 받아올려요.",
    explanation: `${hm(start)} + ${dur(d)} = ${Math.floor(start / 60) + Math.floor(d / 60)}시 ${(start % 60) + (d % 60)}분 = ${hm(end)}`,
    mistakes: { [`${Math.floor(end / 60) - 1},${end % 60}`]: "받아올린 1시간을 더하지 않았어요." },
  };
});

export const secCarry = mid("l3-sec-carry", (rand) => {
  const [a, b] = [randInt(rand, 1, 5), randInt(rand, 1, 4)];
  const [c, d] = [randInt(rand, 20, 55), randInt(rand, 15, 50)];
  if (c + d < 60) return null;
  return {
    key: `${a}:${c}:${b}:${d}`,
    prompt: "계산해 보세요.",
    expression: `${a}분 ${c}초 + ${b}분 ${d}초 = □분 □초`,
    answer: `${a + b + 1},${c + d - 60}`,
    unit: ["분", "초"],
    hint: "초끼리의 합이 60초이거나 60초보다 크면 60초를 1분으로 받아올려요.",
    explanation: `${a + b}분 ${c + d}초 = ${a + b + 1}분 ${c + d - 60}초`,
    mistakes: { [`${a + b},${c + d - 60}`]: "받아올린 1분을 더하지 않았어요." },
  };
});

export const tripArrive = hard("w3-trip-arrive", (rand) => {
  const start = randInt(rand, 7, 9) * 60 + randInt(rand, 0, 11) * 5;
  const ride = 60 + randInt(rand, 1, 11) * 5;
  const rest = randInt(rand, 2, 6) * 5;
  const t = start + ride + rest;
  if (t >= 12 * 60) return null;
  return {
    key: `${start}:${ride}:${rest}`,
    prompt: `시계는 버스가 오전에 출발한 시각입니다. ${dur(ride)} 동안 버스를 타고 가서 휴게소에서 ${rest}분 쉬었습니다. 휴게소에서 다시 출발한 시각은 오전 몇 시 몇 분인가요?`,
    visual: clockScene1(Math.floor(start / 60), start % 60),
    answer: hmAnswer(t),
    unit: HM,
    hint: "출발한 시각에 버스를 탄 시간과 쉰 시간을 차례로 더해요. 60분이 넘으면 1시간으로 바꿔요.",
    explanation: `${hm(start)} + ${dur(ride)} = ${hm(start + ride)}, ${hm(start + ride)} + ${rest}분 = ${hm(t)}`,
  };
});

export const timeRule = hard("l3-time-rule", (rand) => {
  const start = randInt(rand, 8, 9) * 60 + pick(rand, [0, 10, 20, 30, 40]);
  const cls = 40;
  const rest = pick(rand, [10, 15]);
  const n = randInt(rand, 2, 4);
  const t = start + (n - 1) * (cls + rest);
  return {
    key: `${start}:${rest}:${n}`,
    prompt: `${nameOf(rand)}네 학교는 오전 ${hm(start)}에 1교시를 시작합니다. 수업은 ${cls}분씩 하고 쉬는 시간은 ${rest}분씩입니다. ${n}교시가 시작하는 시각은 몇 시 몇 분인가요?`,
    answer: hmAnswer(t),
    unit: HM,
    hint: "한 교시가 시작하고 다음 교시가 시작할 때까지 (수업 시간 + 쉬는 시간)이 걸려요.",
    explanation: `${cls} + ${rest} = ${cls + rest}(분)씩 ${n - 1}번 → ${hm(start)} + ${dur((n - 1) * (cls + rest))} = ${hm(t)}`,
  };
});

/* ── 시간의 뺄셈 ── */

export const timeSubEasy = easy("l3-time-sub", (rand) => {
  const a = randInt(rand, 3, 9) * 60 + randInt(rand, 20, 59);
  const b = randInt(rand, 1, Math.floor(a / 60) - 1) * 60 + randInt(rand, 1, a % 60);
  return {
    key: `${a}:${b}`,
    prompt: "계산해 보세요.",
    expression: `${dur(a)} − ${dur(b)} = □시간 □분`,
    answer: hmAnswer(a - b),
    unit: ["시간", "분"],
    hint: "시간은 시간끼리, 분은 분끼리 빼요.",
    explanation: `${dur(a - b)}`,
  };
});

export const timeBefore = easy("l3-time-before", (rand) => {
  const h = randInt(rand, 1, 11);
  const m = randInt(rand, 5, 11) * 5;
  const k = randInt(rand, 2, m / 5 - 1) * 5;
  const t = h * 60 + m - k;
  return {
    key: `${h}:${m}:${k}`,
    prompt: `시계가 나타내는 시각에서 ${k}분 전의 시각은 몇 시 몇 분인가요?`,
    visual: clockScene1(h, m),
    answer: hmAnswer(t),
    unit: HM,
    hint: "먼저 시계의 시각을 읽고, 분끼리 빼요.",
    explanation: `${hm(h * 60 + m)} − ${k}분 = ${hm(t)}`,
  };
});

export const timeSubBorrow = mid("l3-time-borrow", (rand) => {
  const a = randInt(rand, 4, 11) * 60 + randInt(rand, 0, 40);
  // 시의 차를 2 이상으로 해 답이 1시간 이상이 되게 한다(「0시간 □분」 꼴은 내지 않는다)
  const b = randInt(rand, 1, Math.floor(a / 60) - 2) * 60 + randInt(rand, (a % 60) + 1, 59);
  const d = a - b;
  return {
    key: `${a}:${b}`,
    prompt: "계산해 보세요.",
    expression: `${hm(a)} − ${hm(b)} = □시간 □분`,
    answer: hmAnswer(d),
    unit: ["시간", "분"],
    hint: "분끼리 뺄 수 없으면 1시간을 60분으로 받아내려요.",
    explanation: `${hm(a)} = ${Math.floor(a / 60) - 1}시 ${(a % 60) + 60}분 → ${dur(d)}`,
    mistakes: { [`${Math.floor(d / 60) + 1},${d % 60}`]: "받아내림한 뒤 시간에서 1을 빼지 않았어요." },
  };
});

export const timeDuration = mid("l3-time-dur", (rand) => {
  const s = randInt(rand, 1, 6) * 60 + randInt(rand, 0, 11) * 5;
  const d = randInt(rand, 12, 30) * 5;
  const e = s + d;
  if (e >= 12 * 60) return null;
  return {
    key: `${s}:${d}`,
    prompt: "오후에 영화가 시작한 시각과 끝난 시각입니다. 영화를 상영한 시간은 몇 시간 몇 분인가요?",
    visual: twoClocks([Math.floor(s / 60), s % 60], [Math.floor(e / 60), e % 60], ["시작한 시각", "끝난 시각"]),
    answer: hmAnswer(d),
    unit: ["시간", "분"],
    hint: "두 시각을 읽고 (끝난 시각) − (시작한 시각)을 구해요.",
    explanation: `${hm(e)} − ${hm(s)} = ${dur(d)}`,
  };
});

export const timeStart = hard("l3-time-start", (rand) => {
  const e = randInt(rand, 4, 9) * 60 + randInt(rand, 0, 11) * 5;
  const d = randInt(rand, 1, 2) * 60 + randInt(rand, 1, 11) * 5;
  const s = e - d;
  return {
    key: `${e}:${d}`,
    prompt: `${nameOf(rand)}는 ${dur(d)} 동안 등산을 하고 오후에 집에 도착했습니다. 시계는 도착한 시각입니다. 등산을 시작한 시각은 오후 몇 시 몇 분인가요?`,
    visual: clockScene1(Math.floor(e / 60), e % 60),
    answer: hmAnswer(s),
    unit: HM,
    hint: "도착한 시각에서 걸린 시간을 거꾸로 빼요.",
    explanation: `${hm(e)} − ${dur(d)} = ${hm(s)}`,
    mistakes: { [hmAnswer(e + d)]: "시작한 시각을 구하려면 빼야 해요." },
  };
});

export const timeWho = hard("l3-time-who", (rand) => {
  const [A, B] = twoNames(rand);
  const mk = () => {
    const s = randInt(rand, 1, 4) * 60 + pick(rand, [0, 10, 20, 30, 40, 50]);
    return [s, s + randInt(rand, 5, 16) * 5] as const;
  };
  const [a, b] = [mk(), mk()];
  const x = a[1] - a[0];
  const y = b[1] - b[0];
  if (x === y) return null;
  const diff = Math.abs(x - y);
  const { answer, choices } = whoMore(rand, x > y ? A : B, x > y ? B : A, `${diff}분`, `${diff + 10}분`);
  return {
    key: `${a.join(":")}:${b.join(":")}`,
    prompt: `${A}는 오후 ${hm(a[0])}부터 ${hm(a[1])}까지, ${B}는 오후 ${hm(b[0])}부터 ${hm(b[1])}까지 공부했습니다. 누가 몇 분 더 오래 공부했나요?`,
    answer,
    choices,
    hint: "각자 공부한 시간을 (끝난 시각) − (시작한 시각)으로 구해 비교해요.",
    explanation: `${A}: ${x}분, ${B}: ${y}분 → ${answer} 더`,
  };
});

/* ── 들이 ── */

export const vol = measureKit({
  key: "vol",
  big: "L",
  small: "mL",
  base: 1000,
  step: 10,
  range: [1, 9],
  order: (list, most) => `친구들이 받아 온 물의 양입니다. ${list}. 물을 가장 ${most ? "많이" : "적게"} 받아 온 사람은 누구인가요?`,
});

/** 컵마다 부은 횟수(또는 옮겨 담은 컵 수)를 같은 크기의 컵 그림으로. 크기를 다르게 그리면 답이 그림에 드러난다 */
function cupsScene(rows: [string, number][]): ShapeScene {
  const polygons: Parts["polygons"] = [];
  const texts: Parts["texts"] = [];
  rows.forEach(([name, n], i) => {
    const y = 26 + i * 44;
    texts.push({ at: [34, y], text: name });
    for (let k = 0; k < n; k++) {
      const x = 74 + k * 24;
      polygons.push({ points: [[x, y - 10], [x + 16, y - 10], [x + 13, y + 10], [x + 3, y + 10]], fill: true });
    }
  });
  const longest = Math.max(...rows.map(([, n]) => n * 24));
  return scene(Math.max(240, 84 + longest), 8 + rows.length * 44, "컵에 옮겨 담은 물을 컵 모양으로 나타낸 그림", { polygons, texts });
}

export const volCups = easy("l3-vol-cups", (rand) => {
  const [a, b] = [randInt(rand, 3, 11), randInt(rand, 3, 11)];
  if (a === b) return null;
  const answer = a > b ? "가 그릇" : "나 그릇";
  return {
    key: `${a}:${b}`,
    prompt: "가 그릇과 나 그릇에 물을 가득 채운 뒤, 모양과 크기가 같은 컵에 옮겨 담았더니 그림과 같았습니다. 들이가 더 많은 그릇을 고르세요.",
    visual: cupsScene([
      ["가 그릇", a],
      ["나 그릇", b],
    ]),
    answer,
    choices: ["가 그릇", "나 그릇", "들이가 같습니다", "알 수 없습니다"],
    hint: "같은 컵으로 옮겨 담았다면 컵 수가 많을수록 들이가 많아요.",
    explanation: `가 그릇 ${a}컵, 나 그릇 ${b}컵 → ${answer}`,
  };
});

export const volCupsDiff = mid("l3-vol-diff", (rand) => {
  const [a, b] = [randInt(rand, 6, 11), randInt(rand, 3, 9)];
  if (a <= b) return null;
  return {
    key: `${a}:${b}`,
    prompt: "주전자와 물병에 물을 가득 채운 뒤, 모양과 크기가 같은 컵에 옮겨 담았더니 그림과 같았습니다. 주전자는 물병보다 컵으로 몇 컵 더 많이 들어가나요?",
    visual: cupsScene([
      ["주전자", a],
      ["물병", b],
    ]),
    answer: a - b,
    unit: "컵",
    hint: "그림에서 컵 수를 각각 세어 차를 구해요.",
    explanation: `주전자 ${a}컵, 물병 ${b}컵 → ${a} − ${b} = ${a - b}(컵)`,
  };
});

export const volCupSize = mid("l3-vol-cup-size", (rand) => {
  const [a, b] = [randInt(rand, 3, 8), randInt(rand, 3, 8)];
  if (a === b) return null;
  const answer = a < b ? "가 컵" : "나 컵";
  return {
    key: `${a}:${b}`,
    prompt: "크기가 다른 가 컵과 나 컵으로 같은 물통에 물을 부어 가득 채웠습니다. 그림은 컵마다 부은 횟수입니다. 들이가 더 많은 컵을 고르세요.",
    visual: cupsScene([
      ["가 컵", a],
      ["나 컵", b],
    ]),
    answer,
    choices: ["가 컵", "나 컵", "들이가 같습니다", "알 수 없습니다"],
    hint: "같은 물통을 채울 때 적게 부어도 되는 컵이 한 번에 더 많이 담아요.",
    explanation: `가 컵 ${a}번, 나 컵 ${b}번 → 부은 횟수가 적은 ${answer}의 들이가 더 많아요.`,
    mistakes: { [a < b ? "나 컵" : "가 컵"]: "부은 횟수가 많을수록 컵은 작아요." },
  };
});

export const volFill = hard("l3-vol-fill", (rand) => {
  const k = randInt(rand, 2, 4);
  const m = randInt(rand, 2, 6);
  const a = k * m;
  return {
    key: `${k}:${m}`,
    prompt: `물통을 가득 채우려면 가 컵으로 ${a}번 부어야 합니다. 나 컵 1개의 들이는 가 컵 ${k}개의 들이와 같습니다. 나 컵으로는 몇 번 부어야 물통이 가득 차나요?`,
    answer: m,
    unit: "번",
    hint: `가 컵 ${k}번이 나 컵 1번과 같아요.`,
    explanation: `${a} ÷ ${k} = ${m}(번)`,
    mistakes: { [a * k]: "나 컵이 더 크므로 더 적게 부어도 돼요." },
  };
});

export const volOrder = hard("l3-vol-rank", (rand) => {
  const [x, y] = [randInt(rand, 3, 9), randInt(rand, 3, 9)];
  const z = randInt(rand, 3, 9);
  // 나 = x컵, 가 = 나보다 y컵 많음, 다 = 가보다 z컵 적음
  const vals = { 가: x + y, 나: x, 다: x + y - z };
  if (new Set(Object.values(vals)).size < 3) return null;
  const most = rand() < 0.5;
  const entries = Object.entries(vals);
  const target = most ? Math.max(...entries.map((e) => e[1])) : Math.min(...entries.map((e) => e[1]));
  const answer = `${entries.find((e) => e[1] === target)![0]} 그릇`;
  return {
    key: `${x}:${y}:${z}:${most}`,
    prompt: `같은 컵으로 그릇에 물을 가득 부었습니다. 나 그릇은 ${x}컵이 들어가고, 가 그릇은 나 그릇보다 ${y}컵 더 들어가며, 다 그릇은 가 그릇보다 ${z}컵 덜 들어갑니다. 들이가 가장 ${most ? "많은" : "적은"} 그릇을 고르세요.`,
    answer,
    choices: ["가 그릇", "나 그릇", "다 그릇", "알 수 없습니다"],
    hint: "각 그릇에 들어가는 컵 수를 먼저 구해요.",
    explanation: `가 ${vals.가}컵, 나 ${vals.나}컵, 다 ${vals.다}컵 → ${answer}`,
  };
});

/** mL 눈금 비커(1000 mL, 작은 눈금 50 mL) */
const mlBeaker = (x: number, bottom: number, water: number, step = 50) =>
  beaker({ x, bottom, max: 1000, step, px: step === 50 ? 8 : 14, labelEvery: 200, fmt: (ml) => `${ml} mL`, water });
/** L 눈금 물통(작은 눈금 100 mL) */
const lBeaker = (x: number, bottom: number, water: number, max: number, labelEvery: number) =>
  beaker({ x, bottom, max, step: 100, px: max > 3000 ? 4 : 6, labelEvery, fmt: lml, water });

export const volBeaker = easy("l3-vol-beaker", (rand) => {
  const w = randInt(rand, 3, 19) * 50;
  if (w % 200 === 0) return null;
  return {
    key: `${w}`,
    prompt: "비커에 담긴 물의 양은 몇 mL인가요?",
    visual: scene(176, 196, "눈금이 있는 1000 mL 비커에 담긴 물", mlBeaker(40, 186, w)),
    answer: w,
    unit: "mL",
    hint: "숫자가 적힌 눈금은 200 mL씩 커져요. 작은 눈금 한 칸이 몇 mL인지 먼저 알아봐요.",
    explanation: `작은 눈금 한 칸은 50 mL → 물의 높이는 ${w} mL 눈금`,
    mistakes: { [w - 50]: "물의 윗면과 같은 높이의 눈금을 읽어요.", [w + 50]: "물의 윗면과 같은 높이의 눈금을 읽어요." },
  };
});

export const volCupLml = mid("l3-vol-cup-lml", (rand) => {
  const w = randInt(rand, 1, 2) * 1000 + randInt(rand, 1, 9) * 100;
  if (w % 500 === 0) return null;
  return {
    key: `${w}`,
    prompt: "눈금이 있는 물통에 담긴 물의 양은 몇 L 몇 mL인가요?",
    visual: scene(200, 216, "3 L까지 눈금이 있는 물통에 담긴 물", lBeaker(40, 206, w, 3000, 500)),
    answer: split(w, 1000),
    unit: ["L", "mL"],
    hint: "1 L를 똑같이 10칸으로 나누었으므로 작은 눈금 한 칸은 100 mL예요.",
    explanation: `${Math.floor(w / 1000)} L에서 작은 눈금 ${(w % 1000) / 100}칸 더 → ${lml(w)}`,
    mistakes: { [`${Math.floor(w / 1000)},${(w % 1000) / 100}`]: "작은 눈금 한 칸은 100 mL예요." },
  };
});

const VOLUMES: [string, string, string[]][] = [
  ["우유갑 하나", "200 mL", ["2 mL", "20 L", "200 L"]],
  ["욕조", "200 L", ["200 mL", "2 L", "20 mL"]],
  ["물컵 하나", "250 mL", ["25 mL", "25 L", "250 L"]],
  ["양동이", "10 L", ["10 mL", "100 mL", "100 L"]],
  ["큰 생수병", "2 L", ["2 mL", "20 mL", "200 L"]],
  ["음료수 캔", "350 mL", ["35 mL", "35 L", "350 L"]],
  ["찻숟가락", "5 mL", ["5 L", "50 L", "500 L"]],
];

export const volEstimate = mid("l3-vol-est", (rand) => {
  const [what, right, wrong] = pick(rand, VOLUMES);
  return {
    key: what,
    prompt: `${what}의 들이로 가장 알맞은 것을 고르세요.`,
    answer: right,
    choices: shuffle(rand, [right, ...wrong]),
    hint: "1 L는 큰 우유갑 하나, 1 mL는 물 몇 방울쯤이에요.",
    explanation: `${what}의 들이는 약 ${right}입니다.`,
  };
});

export const volBeakerCmp = hard("l3-vol-beaker-cmp", (rand) => {
  const a = randInt(rand, 2, 9) * 100;
  const b = randInt(rand, 3, 19) * 50;
  if (a === b || b % 100 === 0) return null;
  const diff = Math.abs(a - b);
  const { answer, choices } = whoMore(rand, a > b ? "가" : "나", a > b ? "나" : "가", `${diff} mL`, `${diff + 100} mL`);
  const v = scene(334, 226, "눈금 간격이 다른 두 비커 가, 나에 담긴 물", mlBeaker(30, 200, a, 100), mlBeaker(200, 200, b), {
    texts: [
      { at: [58, 216], text: "가" },
      { at: [228, 216], text: "나" },
    ],
  });
  return {
    key: `${a}:${b}`,
    prompt: "두 비커 가, 나에 담긴 물의 양을 비교하려고 합니다. 어느 비커에 물이 몇 mL 더 많이 들어 있나요?",
    visual: v,
    answer,
    choices,
    hint: "두 비커는 작은 눈금 한 칸의 크기가 달라요. 각각 몇 mL인지 읽은 뒤 비교해요.",
    explanation: `가 ${a} mL, 나 ${b} mL → ${answer} 더`,
  };
});

/** 두 그릇(가, 나)에 담긴 물과 아래에 적은 양 */
function jarsScene(a: number, b: number): ShapeScene {
  const jar = (x: number, v: number): Parts => {
    const h = Math.max(10, Math.round((v / 5000) * 90));
    return {
      lines: [
        { from: [x, 30], to: [x, 120] },
        { from: [x, 120], to: [x + 80, 120] },
        { from: [x + 80, 120], to: [x + 80, 30] },
      ],
      polygons: [{ points: [[x + 2, 120 - h], [x + 78, 120 - h], [x + 78, 119], [x + 2, 119]], fill: true }],
    };
  };
  return scene(340, 156, "물이 담긴 두 그릇 가, 나와 물의 양", jar(50, a), jar(210, b), {
    texts: [
      { at: [90, 16], text: "가" },
      { at: [250, 16], text: "나" },
      { at: [90, 140], text: lml(a) },
      { at: [250, 140], text: lml(b) },
    ],
  });
}

export const volAdd = easy("l3-vol-add", (rand) => {
  const a = randInt(rand, 1, 3) * 1000 + randInt(rand, 1, 7) * 100 + pick(rand, [0, 50]);
  const b = randInt(rand, 1, 2) * 1000 + randInt(rand, 1, 8 - Math.floor((a % 1000) / 100)) * 100;
  if ((a % 1000) + (b % 1000) >= 1000) return null;
  const s = a + b;
  return {
    key: `${a}:${b}`,
    prompt: "가 그릇과 나 그릇에 담긴 물을 큰 그릇에 모두 부었습니다. 큰 그릇에 담긴 물은 몇 L 몇 mL인가요?",
    visual: jarsScene(a, b),
    answer: split(s, 1000),
    unit: ["L", "mL"],
    hint: "L는 L끼리, mL는 mL끼리 더해요.",
    explanation: `${lml(a)} + ${lml(b)} = ${lml(s)}`,
  };
});

export const volSub = mid("l3-vol-sub", (rand) => {
  const a = randInt(rand, 3, 4) * 1000 + randInt(rand, 1, 5) * 100;
  const b = randInt(rand, 1, 2) * 1000 + randInt(rand, 6, 9) * 100 + pick(rand, [0, 50]);
  const d = a - b;
  if (d < 1000) return null;
  return {
    key: `${a}:${b}`,
    prompt: "가 그릇의 물은 나 그릇의 물보다 몇 L 몇 mL 더 많은가요?",
    visual: jarsScene(a, b),
    answer: split(d, 1000),
    unit: ["L", "mL"],
    hint: "mL끼리 뺄 수 없으면 1 L를 1000 mL로 받아내려요.",
    explanation: `${lml(a)} − ${lml(b)} = ${Math.floor(a / 1000) - 1} L ${(a % 1000) + 1000} mL − ${lml(b)} = ${lml(d)}`,
    mistakes: { [`${Math.floor(a / 1000) - Math.floor(b / 1000)},${Math.abs((a % 1000) - (b % 1000))}`]: "받아내림을 하지 않았어요." },
  };
});

export const waterBottle = hard("w3-water-bottle", (rand) => {
  const start = randInt(rand, 1, 2) * 1000 + randInt(rand, 1, 9) * 100;
  const drink = randInt(rand, 20, 90) * 10;
  const add = 1000 + randInt(rand, 10, 90) * 10;
  const t = start - drink + add;
  if (start % 500 === 0 || t % 1000 === 0) return null;
  return {
    key: `${start}:${drink}:${add}`,
    prompt: `눈금이 있는 물통에 물이 그림만큼 들어 있었습니다. 이 물 중에서 ${drink} mL를 마시고 ${lml(add)}를 더 부었습니다. 물통의 물은 몇 L 몇 mL인가요?`,
    visual: scene(150, 232, "5 L까지 눈금이 있는 물통에 담긴 물", lBeaker(40, 222, start, 5000, 1000)),
    answer: split(t, 1000),
    unit: ["L", "mL"],
    hint: "먼저 눈금을 읽어 처음 물의 양을 구해요. 작은 눈금 한 칸은 100 mL예요.",
    explanation: `처음 ${lml(start)} → ${lml(start)} − ${drink} mL = ${lml(start - drink)}, ${lml(start - drink)} + ${lml(add)} = ${lml(t)}`,
  };
});

export const volRev = hard("l3-vol-rev", (rand) => {
  const used = randInt(rand, 2, 9) * 100 + randInt(rand, 1, 9) * 10;
  const added = randInt(rand, 1, 2) * 1000 + randInt(rand, 1, 9) * 100;
  const now = randInt(rand, 2, 5) * 1000 + randInt(rand, 1, 99) * 10;
  const start = now - added + used;
  if (start < 1000 || start % 1000 === 0 || now % 1000 === 0) return null;
  return {
    key: `${used}:${added}:${now}`,
    prompt: `수조에 물이 있었습니다. 그중 ${used} mL를 덜어 내고 ${lml(added)}를 더 부었더니 ${lml(now)}가 되었습니다. 처음 수조에 있던 물은 몇 L 몇 mL인가요?`,
    answer: split(start, 1000),
    unit: ["L", "mL"],
    hint: "거꾸로 생각해요: 부은 물은 빼고, 덜어 낸 물은 더해요.",
    explanation: `${lml(now)} − ${lml(added)} + ${used} mL = ${lml(start)}`,
  };
});

/* ── 무게 ── */

export const wt = measureKit({
  key: "wt",
  big: "kg",
  small: "g",
  base: 1000,
  step: 10,
  range: [1, 9],
  orderRange: [1, 5],
  order: (list, most) => `친구들의 가방 무게입니다. ${list}. 가방이 가장 ${most ? "무거운" : "가벼운"} 사람은 누구인가요?`,
});

/** 바둑돌로 무게를 잴 물건과 바둑돌 수의 범위(실제 무게 순서와 맞게) */
const STONE_ITEMS: [string, number, number][] = [
  ["지우개", 3, 5],
  ["딱풀", 6, 9],
  ["가위", 10, 13],
  ["필통", 14, 18],
];

function stonePair(rand: Rand) {
  const [i, j] = shuffle(rand, [0, 1, 2, 3]).slice(0, 2);
  const [p, pa, pb] = STONE_ITEMS[i];
  const [q, qa, qb] = STONE_ITEMS[j];
  const a = randInt(rand, pa, pb);
  const b = randInt(rand, qa, qb);
  return { p, q, a, b, visual: scene(480, 132, `양팔 저울에서 ${p}, ${josa(q, "과/와")} 무게가 같은 바둑돌`, balance(115, 80, p, a, 0), balance(365, 80, q, b, 0)) };
}

export const wtCoins = easy("l3-wt-coins", (rand) => {
  const { p, q, a, b, visual } = stonePair(rand);
  const answer = a > b ? p : q;
  return {
    key: `${p}:${q}:${a}:${b}`,
    prompt: "양팔 저울의 한쪽에 물건을, 다른 쪽에 바둑돌을 올려 수평을 맞추었습니다. 더 무거운 물건을 고르세요.",
    visual,
    answer,
    choices: [p, q, "무게가 같습니다", "알 수 없습니다"],
    hint: "같은 바둑돌로 쟀다면 바둑돌이 많을수록 무거워요.",
    explanation: `${josa(p, "은/는")} 바둑돌 ${a}개, ${josa(q, "은/는")} 바둑돌 ${b}개 → ${answer}`,
  };
});

export const wtCoinsDiff = mid("l3-wt-diff", (rand) => {
  const { p, q, a, b, visual } = stonePair(rand);
  const [H, L, h, l] = a > b ? [p, q, a, b] : [q, p, b, a];
  return {
    key: `${p}:${q}:${a}:${b}`,
    prompt: `양팔 저울로 물건과 무게가 같은 바둑돌의 수를 알아보았습니다. ${josa(H, "은/는")} ${L}보다 바둑돌 몇 개만큼 더 무거운가요?`,
    visual,
    answer: h - l,
    unit: "개",
    hint: "그림에서 바둑돌 수를 각각 세어 차를 구해요.",
    explanation: `${H} ${h}개, ${L} ${l}개 → ${h} − ${l} = ${h - l}(개)`,
  };
});

/** 귤 몇 개와 무게가 같은지(과일 실제 무게 순서와 맞게) */
const IN_TANGERINES: [string, number, number][] = [
  ["복숭아", 2, 3],
  ["사과", 2, 3],
  ["참외", 4, 5],
  ["배", 5, 6],
];

export const wtBalance = mid("l3-wt-balance", (rand) => {
  const [i, j] = shuffle(rand, [0, 1, 2, 3]).slice(0, 2);
  const [p, pa, pb] = IN_TANGERINES[i];
  const [q, qa, qb] = IN_TANGERINES[j];
  const [a, b] = [randInt(rand, pa, pb), randInt(rand, qa, qb)];
  if (a === b) return null;
  const answer = a > b ? p : q;
  return {
    key: `${p}:${q}:${a}:${b}`,
    prompt: `양팔 저울에서 ${p} 1개는 귤 ${a}개와, ${q} 1개는 귤 ${b}개와 무게가 같습니다. 귤의 무게가 모두 같을 때 더 무거운 과일을 고르세요.`,
    answer,
    choices: [p, q, "무게가 같습니다", "알 수 없습니다"],
    hint: "귤을 기준으로 삼아 몇 개와 같은지 비교해요.",
    explanation: `귤 ${Math.max(a, b)}개와 무게가 같은 ${josa(answer, "이/가")} 더 무거워요.`,
  };
});

/** 무거운 것부터 */
const FRUIT_ORDER = ["배", "사과", "귤", "딸기"];

export const wtTilt = mid("l3-wt-tilt", (rand) => {
  const skip = randInt(rand, 0, 3);
  const [A, B, C] = FRUIT_ORDER.filter((_, i) => i !== skip);
  // 무거운 쪽이 내려간다: 왼쪽이 무거우면 1, 오른쪽이 무거우면 −1
  const place = (h: string, l: string) => (rand() < 0.5 ? ([h, l, 1] as const) : ([l, h, -1] as const));
  const [l1, r1, t1] = place(A, B);
  const [l2, r2, t2] = place(B, C);
  const heavy = rand() < 0.5;
  const answer = heavy ? A : C;
  return {
    key: `${A}${B}${C}:${t1}:${t2}:${heavy}`,
    prompt: `양팔 저울로 과일 한 개씩의 무게를 비교했습니다. 가장 ${heavy ? "무거운" : "가벼운"} 과일을 고르세요.`,
    visual: scene(480, 140, "과일의 무게를 비교한 양팔 저울 두 개", balance(115, 84, l1, r1, t1), balance(365, 84, l2, r2, t2)),
    answer,
    choices: [...shuffle(rand, [A, B, C]), "알 수 없습니다"],
    hint: "양팔 저울은 더 무거운 쪽이 아래로 내려가요. 두 저울에 모두 있는 과일을 기준으로 비교해요.",
    explanation: `${josa(A, "은/는")} ${B}보다 무겁고, ${josa(B, "은/는")} ${C}보다 무거워요. → 가장 ${heavy ? "무거운" : "가벼운"} 과일은 ${answer}`,
  };
});

export const wtChain = hard("l3-wt-chain", (rand) => {
  const a = randInt(rand, 2, 6);
  const b = randInt(rand, 3, 9);
  return {
    key: `${a}:${b}`,
    prompt: `양팔 저울에서 사과 1개는 귤 ${a}개와 무게가 같고, 귤 1개는 바둑돌 ${b}개와 무게가 같습니다. 사과 1개는 바둑돌 몇 개와 무게가 같나요?`,
    answer: a * b,
    unit: "개",
    hint: "귤 1개를 바둑돌로 바꾸어 생각해요.",
    explanation: `${a} × ${b} = ${a * b}(개)`,
    mistakes: { [a + b]: "귤 한 개마다 바둑돌이 여러 개이므로 곱해요." },
  };
});

export const wtOrder = hard("l3-wt-rank", (rand) => {
  const [p, q, r] = shuffle(rand, ["빨간 공", "파란 공", "노란 공", "초록 공"]).slice(0, 3);
  const [x, d1, d2] = [randInt(rand, 10, 30), randInt(rand, 2, 9), randInt(rand, 2, 9)];
  if (d1 === d2) return null;
  // q = x개, p = q보다 d1개만큼 무거움, r = p보다 d2개만큼 가벼움
  const vals: [string, number][] = [
    [p, x + d1],
    [q, x],
    [r, x + d1 - d2],
  ];
  const light = vals.reduce((m, v) => (v[1] < m[1] ? v : m))[0];
  return {
    key: `${p}${q}${r}:${x}:${d1}:${d2}`,
    prompt: `같은 바둑돌로 공의 무게를 재었습니다. ${josa(q, "은/는")} 바둑돌 ${x}개와 무게가 같고, ${josa(p, "은/는")} ${q}보다 바둑돌 ${d1}개만큼 더 무겁고, ${josa(r, "은/는")} ${p}보다 바둑돌 ${d2}개만큼 더 가볍습니다. 가장 가벼운 공을 고르세요.`,
    answer: light,
    choices: [p, q, r, "알 수 없습니다"],
    hint: "각각 바둑돌 몇 개와 같은지 먼저 구해요.",
    explanation: vals.map(([n, v]) => `${n} ${v}개`).join(", ") + ` → ${light}`,
  };
});

/* 바늘 저울 */

const kgDial = (cx: number, item: string, value: number) =>
  dial({ c: [cx, 120], r: 64, max: 4000, step: 100, labelEvery: 1000, fmt: (g) => (g ? `${g / 1000} kg` : "0"), value, item });
const gDial = (cx: number, item: string, value: number) =>
  dial({ c: [cx, 120], r: 64, max: 1000, step: 50, labelEvery: 100, fmt: (g) => `${g} g`, value, item });

/** 4 kg 저울에 올릴 물건과 무게(kg) 범위 */
const KG_ITEMS: [string, number, number][] = [
  ["호박", 1, 3],
  ["가방", 2, 3],
  ["멜론", 1, 2],
  ["밀가루", 1, 2],
  ["책 묶음", 2, 3],
];
const kgValue = (rand: Rand, lo: number, hi: number) => randInt(rand, lo, hi) * 1000 + randInt(rand, 1, 9) * 100;

export const wtScale = easy("l3-wt-scale", (rand) => {
  const [item, lo, hi] = pick(rand, KG_ITEMS);
  const v = kgValue(rand, lo, hi);
  return {
    key: `${item}:${v}`,
    prompt: `저울에 ${josa(item, "을/를")} 올렸습니다. ${item}의 무게는 몇 kg 몇 g인가요?`,
    visual: scene(240, 206, `${josa(item, "을/를")} 올린 4 kg 저울`, kgDial(120, item, v)),
    answer: split(v, 1000),
    unit: ["kg", "g"],
    hint: "1 kg을 똑같이 10칸으로 나누었으므로 작은 눈금 한 칸은 100 g이에요.",
    explanation: `${Math.floor(v / 1000)} kg에서 작은 눈금 ${(v % 1000) / 100}칸 더 → ${kgg(v)}`,
    mistakes: { [`${Math.floor(v / 1000)},${(v % 1000) / 100}`]: "작은 눈금 한 칸은 100 g이에요." },
  };
});

/** 1 kg 저울에 올릴 물건과 무게(g) 범위 */
const G_ITEMS: [string, number, number][] = [
  ["사과", 200, 400],
  ["배", 450, 700],
  ["양파", 150, 300],
  ["필통", 200, 450],
  ["고구마", 150, 400],
];

export const wtScaleG = mid("l3-wt-scale-g", (rand) => {
  const [item, lo, hi] = pick(rand, G_ITEMS);
  const v = randInt(rand, lo / 50, hi / 50) * 50;
  return {
    key: `${item}:${v}`,
    prompt: `저울에 ${josa(item, "을/를")} 올렸습니다. ${item}의 무게는 몇 g인가요?`,
    visual: scene(240, 206, `${josa(item, "을/를")} 올린 1 kg 저울`, gDial(120, item, v)),
    answer: v,
    unit: "g",
    hint: "숫자가 적힌 눈금은 100 g씩 커지고, 그 사이를 2칸으로 나누었어요. 작은 눈금 한 칸은 50 g이에요.",
    explanation: `바늘이 가리키는 눈금은 ${v} g입니다.`,
    mistakes: { [v - 50]: "바늘이 가리키는 눈금을 다시 읽어요.", [v + 50]: "바늘이 가리키는 눈금을 다시 읽어요." },
  };
});

/** 4 kg 저울 두 개(물건 이름이 다르고 무게가 다름) */
function twoDials(rand: Rand) {
  const [[p, pl, ph], [q, ql, qh]] = shuffle(rand, KG_ITEMS).slice(0, 2);
  const [a, b] = [kgValue(rand, pl, ph), kgValue(rand, ql, qh)];
  return { p, q, a, b, visual: scene(480, 206, `${josa(p, "과/와")} ${josa(q, "을/를")} 올린 두 저울`, kgDial(120, p, a), kgDial(360, q, b)) };
}

export const wtScaleCmp = hard("l3-wt-scale-cmp", (rand) => {
  const { p, q, a, b, visual } = twoDials(rand);
  if (a === b) return null;
  const diff = Math.abs(a - b);
  const { answer, choices } = whoMore(rand, a > b ? p : q, a > b ? q : p, `${diff} g`, `${diff + 100} g`);
  return {
    key: `${p}:${q}:${a}:${b}`,
    prompt: "두 물건의 무게를 저울로 재었습니다. 어느 것이 몇 g 더 무거운가요?",
    visual,
    answer,
    choices,
    hint: "두 저울의 눈금을 각각 읽어 g으로 나타낸 뒤 비교해요.",
    explanation: `${p} ${kgg(a)} = ${a} g, ${q} ${kgg(b)} = ${b} g → ${answer} 더`,
  };
});

export const wtAdd = easy("l3-wt-add", (rand) => {
  const { p, q, a, b, visual } = twoDials(rand);
  if ((a % 1000) + (b % 1000) >= 1000) return null;
  const s = a + b;
  return {
    key: `${p}:${q}:${a}:${b}`,
    prompt: `저울로 ${josa(p, "과/와")} ${q}의 무게를 재었습니다. 두 물건의 무게의 합은 몇 kg 몇 g인가요?`,
    visual,
    answer: split(s, 1000),
    unit: ["kg", "g"],
    hint: "두 저울의 눈금을 읽은 뒤 kg은 kg끼리, g은 g끼리 더해요.",
    explanation: `${kgg(a)} + ${kgg(b)} = ${kgg(s)}`,
  };
});

export const wtSub = mid("l3-wt-sub", (rand) => {
  const { p, q, a, b, visual } = twoDials(rand);
  const [H, L, h, l] = a > b ? [p, q, a, b] : [q, p, b, a];
  const d = h - l;
  if (h % 1000 >= l % 1000 || d < 1000) return null;
  return {
    key: `${p}:${q}:${a}:${b}`,
    prompt: `저울로 두 물건의 무게를 재었습니다. ${josa(H, "은/는")} ${L}보다 몇 kg 몇 g 더 무거운가요?`,
    visual,
    answer: split(d, 1000),
    unit: ["kg", "g"],
    hint: "g끼리 뺄 수 없으면 1 kg을 1000 g으로 받아내려요.",
    explanation: `${kgg(h)} − ${kgg(l)} = ${kgg(d)}`,
    mistakes: { [`${Math.floor(h / 1000) - Math.floor(l / 1000)},${Math.abs((h % 1000) - (l % 1000))}`]: "받아내림을 하지 않았어요." },
  };
});

export const bagWeight = hard("w3-bag-weight", (rand) => {
  const bag = kgValue(rand, 1, 2);
  const book = randInt(rand, 20, 50) * 10;
  const n = randInt(rand, 2, 3);
  const t = bag + book * n;
  if (t % 1000 === 0) return null;
  return {
    key: `${bag}:${book}:${n}`,
    prompt: `빈 가방의 무게를 저울로 재었습니다. 이 가방에 ${book} g짜리 책 ${n}권을 넣으면 가방의 무게는 몇 kg 몇 g이 되나요?`,
    visual: scene(240, 206, "빈 가방을 올린 4 kg 저울", kgDial(120, "가방", bag)),
    answer: split(t, 1000),
    unit: ["kg", "g"],
    hint: "저울의 눈금을 읽어 가방의 무게를 구하고, 책의 무게를 곱셈으로 구해 더해요.",
    explanation: `가방 ${kgg(bag)}, 책 ${book} × ${n} = ${book * n}(g) → ${kgg(bag)} + ${book * n} g = ${kgg(t)}`,
  };
});

export const wtWho = hard("l3-wt-who", (rand) => {
  const [A, B] = twoNames(rand);
  const bag = () => randInt(rand, 1, 3) * 1000 + randInt(rand, 10, 90) * 10;
  const item = () => randInt(rand, 20, 90) * 10;
  const [a1, a2, b1, b2] = [bag(), item(), bag(), item()];
  const x = a1 + a2;
  const y = b1 + b2;
  if (x === y) return null;
  const diff = Math.abs(x - y);
  const { answer, choices } = whoMore(rand, x > y ? A : B, x > y ? B : A, `${diff} g`, `${diff + 100} g`);
  return {
    key: `${a1}:${a2}:${b1}:${b2}`,
    prompt: `${A}는 ${kgg(a1)}인 가방에 ${a2} g짜리 필통을 넣었고, ${B}는 ${kgg(b1)}인 가방에 ${b2} g짜리 도시락을 넣었습니다. 누구의 가방이 몇 g 더 무거운가요?`,
    answer,
    choices,
    hint: "각자의 가방 무게를 g으로 구해 비교해요.",
    explanation: `${A}: ${x} g, ${B}: ${y} g → ${answer} 더`,
  };
});
