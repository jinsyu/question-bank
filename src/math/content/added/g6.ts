import type { WordMap } from "../words/word";
import { shuffle } from "../../lib/random";
import { bandGraph, compose, cuboid, boxLabels, cylinder, cylinderNet, pieGraph, prism, pyramid, SOLO, sphere, topView, type Item, type Pt } from "../lessons/g6-figs";
import { easy, gcd, j, mid, pick, poly, randInt, reduced, trim, word } from "../lessons/g6-util";

/*
 * 6학년 단원마다 새로 더한 생성기(하·중·상 하나씩).
 * 도형·측정·그래프 단원(각기둥과 각뿔, 여러 가지 그래프, 직육면체의 부피와 겉넓이, 공간과 입체, 원의 넓이, 원기둥·원뿔·구)은
 * 차시의 그림 문제 비율을 지키려고 모두 그림을 보고 푸는 문제로 만든다.
 */

const PI = 3.14;

/* ── 6-1-1 분수의 나눗셈 ── */

/** 하: (진분수) ÷ (자연수)를 분모에 곱하는 꼴로 바꾸기 */
const fd1Den = easy("a6-fd1-den", (rand) => {
  const b = randInt(rand, 2, 9);
  const a = randInt(rand, 1, b - 1);
  const c = randInt(rand, 2, 6);
  if (a % c === 0) return null;
  return {
    key: `${a}:${b}:${c}`,
    prompt: `□ 안에 알맞은 수를 구하세요.\n${a}/${b} ÷ ${c} = ${a}/□`,
    answer: b * c,
    hint: `${a}/${b} ÷ ${c} = ${a}/${b} × 1/${c}이에요. 분모끼리 곱해요.`,
    explanation: `${a}/${b} ÷ ${c} = ${a}/${b} × 1/${c} = ${a}/${b * c}이므로 □ = ${b} × ${c} = ${b * c}`,
    mistakes: { [b + c]: "분모에 나누는 수를 더했어요. 곱해야 해요." },
  };
});

/** 중: 몫이 가장 작은 나눗셈 고르기 */
const fd1Smallest = mid("a6-fd1-smallest", (rand) => {
  const exprs: { t: string; v: number; r: string }[] = [];
  for (let i = 0; exprs.length < 4 && i < 40; i++) {
    const b = randInt(rand, 3, 9);
    const a = randInt(rand, 1, b - 1);
    const c = randInt(rand, 2, 5);
    if (gcd(a, b) !== 1) continue;
    const v = a / (b * c);
    if (exprs.some((e) => Math.abs(e.v - v) < 1e-9 || e.t === `${a}/${b} ÷ ${c}`)) continue;
    exprs.push({ t: `${a}/${b} ÷ ${c}`, v, r: reduced(a, b * c) });
  }
  if (exprs.length < 4) return null;
  const best = exprs.reduce((m, e) => (e.v < m.v ? e : m));
  return {
    key: exprs.map((e) => e.t).join("|"),
    prompt: "계산 결과가 가장 작은 것을 고르세요.",
    choices: shuffle(rand, exprs.map((e) => e.t)),
    answer: best.t,
    hint: "(분수) ÷ (자연수)는 분모에 자연수를 곱한 분수예요. 각각 계산하여 크기를 비교해요.",
    explanation: exprs.map((e) => `${e.t} = ${e.r}`).join(", ") + ` → 가장 작은 것은 ${best.t}`,
  };
});

/** 상: 철사(대분수 m)로 정다각형을 만들 때 한 변의 길이(cm) */
const fd1Wire = word("a6-fd1-wire", (rand) => {
  const n = randInt(rand, 3, 6);
  const d = pick(rand, [2, 4, 5]);
  const w = randInt(rand, 1, 3);
  const k = randInt(rand, 1, d - 1);
  if (gcd(k, d) !== 1) return null;
  const cm = ((w * d + k) * 100) / d;
  if (cm % n !== 0) return null;
  const side = cm / n;
  return {
    key: `${n}:${w}:${k}:${d}`,
    prompt: `길이가 ${w} ${k}/${d} m인 철사를 겹치지 않게 모두 사용하여 정${poly(n)}형 한 개를 만들었습니다. 정${poly(n)}형의 한 변의 길이는 몇 cm인가요?`,
    answer: side,
    unit: "cm",
    hint: `정${poly(n)}형은 변이 ${n}개이고 길이가 모두 같아요. 철사의 길이 ÷ ${j(n, "를")} m로 구한 뒤 cm로 바꿔요.`,
    explanation: `${w} ${k}/${d} ÷ ${n} = ${reduced(w * d + k, d * n)} (m) → 1 m = 100 cm이므로 ${side} cm`,
    mistakes: { [trim(cm / 100 / n, 2)]: "m 단위로 구한 값이에요. cm로 바꿔야 해요." },
  };
});

/* ── 6-1-2 각기둥과 각뿔 ── */

/** 하: 겨냥도의 각기둥에서 꼭짓점의 수와 면의 수의 합 */
const prSum = easy("a6-pr-vf-sum", (rand) => {
  const n = randInt(rand, 3, 6);
  return {
    key: `${n}`,
    prompt: "그림의 각기둥에서 꼭짓점의 수와 면의 수의 합은 몇 개인가요?",
    visual: compose(220, 180, "각기둥의 겨냥도", prism(n, SOLO)),
    answer: 3 * n + 2,
    unit: "개",
    hint: "한 밑면의 변이 n개인 각기둥의 꼭짓점은 n × 2개, 면은 n + 2개예요.",
    explanation: `한 밑면의 변이 ${n}개 → 꼭짓점 ${2 * n}개, 면 ${n + 2}개 → ${2 * n} + ${n + 2} = ${3 * n + 2}(개)`,
    mistakes: { [3 * n]: "면의 수에서 두 밑면을 빼먹었어요." },
  };
});

/** 중: 밑면의 모양이 같은 각기둥과 각뿔의 모서리 수 차 */
const prVsPyr = mid("a6-pr-edge-gap", (rand) => {
  const n = randInt(rand, 3, 6);
  return {
    key: `${n}`,
    prompt: "그림의 각뿔과 밑면의 모양이 같은 각기둥이 있습니다. 각기둥의 모서리는 그림의 각뿔의 모서리보다 몇 개 더 많은가요?",
    visual: compose(220, 180, "각뿔의 겨냥도", pyramid(n, SOLO)),
    answer: n,
    unit: "개",
    hint: "밑면의 변이 n개일 때 각기둥의 모서리는 n × 3개, 각뿔의 모서리는 n × 2개예요.",
    explanation: `밑면의 변 ${n}개 → 각기둥 ${3 * n}개, 각뿔 ${2 * n}개 → ${3 * n} − ${2 * n} = ${n}(개)`,
    mistakes: { [2 * n]: "각뿔의 모서리 수를 답했어요." },
  };
});

/** 상: 각기둥과 꼭짓점의 수가 같은 각뿔의 모서리 수 */
const prSameVertex = word("a6-pr-same-vertex", (rand) => {
  const n = randInt(rand, 3, 6);
  const m = 2 * n - 1;
  return {
    key: `${n}`,
    prompt: "그림의 각기둥과 꼭짓점의 수가 같은 각뿔이 있습니다. 이 각뿔의 모서리는 몇 개인지 풀이 과정을 생각하며 구하세요.",
    visual: compose(220, 180, "각기둥의 겨냥도", prism(n, SOLO)),
    answer: 2 * m,
    unit: "개",
    hint: "각뿔의 꼭짓점은 (밑면의 변의 수) + 1개예요. 먼저 각기둥의 꼭짓점 수를 세요.",
    explanation: `각기둥의 꼭짓점 ${n} × 2 = ${2 * n}(개) → 각뿔의 밑면의 변은 ${2 * n} − 1 = ${m}(개) → 모서리 ${m} × 2 = ${2 * m}(개)`,
    mistakes: { [4 * n]: "각뿔의 꼭짓점을 밑면의 변의 수와 같다고 생각했어요.", [3 * n]: "각기둥의 모서리 수를 구했어요." },
  };
});

/* ── 6-1-3 소수의 나눗셈 ── */

/** 하: 리본(소수 m)을 자연수 도막으로 똑같이 나누기 */
const dd1Ribbon = easy("a6-dd1-ribbon", (rand) => {
  const n = randInt(rand, 2, 6);
  const each = randInt(rand, 11, 99) / 100;
  const total = Number((each * n).toFixed(2));
  // 0을 내리지 않게(이 차시는 0을 내리는 나눗셈 앞): 나누어지는 수도 소수 둘째 자리까지 있다
  if (Math.round(total * 100) % 10 === 0) return null;
  return {
    key: `${total}:${n}`,
    prompt: `길이가 ${total} m인 리본을 ${n}도막으로 똑같이 잘랐습니다. 한 도막의 길이는 몇 m인가요?`,
    answer: trim(each),
    unit: "m",
    hint: `${total} ÷ ${j(n, "를")} 계산해요. 몫의 소수점은 나누어지는 수의 소수점 위치에 맞춰 찍어요.`,
    explanation: `${total} ÷ ${n} = ${trim(each)}(m)`,
    mistakes: { [trim(each * 10)]: "몫의 소수점 위치가 틀렸어요." },
  };
});

/** 중: 나누어야 할 것을 잘못하여 곱했을 때 바르게 계산하기 */
const dd1Wrong = mid("a6-dd1-wrong-mul", (rand) => {
  const c = randInt(rand, 2, 5);
  const q = randInt(rand, 11, 99) / 10;
  const x = Number((q * c).toFixed(1));
  const wrong = Number((x * c).toFixed(1));
  // 0을 내리는 나눗셈과 (자연수) ÷ (자연수)가 나오지 않게 어떤 수와 잘못 계산한 값 모두 소수 첫째 자리가 0이 아니다
  if (Math.round(x * 10) % 10 === 0 || Math.round(wrong * 10) % 10 === 0) return null;
  return {
    key: `${c}:${q}`,
    prompt: `어떤 수를 ${j(c, "로")} 나누어야 할 것을 잘못하여 ${j(c, "를")} 곱했더니 ${j(trim(wrong), "가")} 되었습니다. 바르게 계산한 값은 얼마인가요?`,
    answer: trim(q),
    hint: `먼저 어떤 수를 구해요: ${trim(wrong)} ÷ ${c}. 그다음 어떤 수 ÷ ${j(c, "를")} 계산해요.`,
    explanation: `어떤 수 = ${trim(wrong)} ÷ ${c} = ${trim(x)} → ${trim(x)} ÷ ${c} = ${trim(q)}`,
    mistakes: { [trim(x)]: "어떤 수까지만 구했어요." },
  };
});

/** 상: 두 자동차의 1 L당 가는 거리 비교 */
const dd1Fuel = word("a6-dd1-fuel", (rand) => {
  const la = pick(rand, [2, 4, 5, 8]);
  const lb = pick(rand, [2, 4, 5, 8]);
  const ka = randInt(rand, 20, 120);
  const kb = randInt(rand, 20, 120);
  const ra = ka / la;
  const rb = kb / lb;
  if (la === lb || Math.abs(ra - rb) < 0.5 || ra < 8 || rb < 8 || ra > 20 || rb > 20) return null;
  if (Number.isInteger(ra) && Number.isInteger(rb)) return null;
  const diff = Math.abs(ra - rb);
  const better = ra > rb ? "가" : "나";
  return {
    key: `${la}:${ka}:${lb}:${kb}`,
    prompt: `가 자동차는 휘발유 ${la} L로 ${ka} km를 가고, 나 자동차는 휘발유 ${lb} L로 ${kb} km를 갑니다. 휘발유 1 L로 더 멀리 가는 자동차는 다른 자동차보다 1 L로 몇 km 더 가나요?`,
    answer: trim(diff),
    unit: "km",
    hint: "각 자동차가 1 L로 가는 거리를 (간 거리) ÷ (휘발유 양)으로 구해 비교해요.",
    explanation: `가: ${ka} ÷ ${la} = ${trim(ra)}(km), 나: ${kb} ÷ ${lb} = ${trim(rb)}(km) → ${better} 자동차가 ${trim(Math.max(ra, rb))} − ${trim(Math.min(ra, rb))} = ${trim(diff)}(km) 더 가요.`,
  };
});

/* ── 6-1-4 비와 비율 ── */

/** 하: 색칠한 칸은 전체의 몇 % */
const rtGrid = easy("a6-rt-grid-pct", (rand) => {
  const parts = pick(rand, [10, 20, 25]);
  const shaded = randInt(rand, 1, parts - 1);
  return {
    key: `${parts}:${shaded}`,
    prompt: `똑같이 ${parts}칸으로 나눈 띠에서 색칠한 부분은 전체의 몇 %인가요?`,
    visual: { kind: "bar", parts, shaded },
    answer: (shaded * 100) / parts,
    unit: "%",
    hint: "(색칠한 칸 수) ÷ (전체 칸 수)에 100을 곱해요.",
    explanation: `${shaded}/${parts} × 100 = ${(shaded * 100) / parts}(%)`,
    mistakes: { [shaded]: "색칠한 칸 수를 그대로 답했어요." },
  };
});

/** 중: 할인한 뒤 쿠폰까지 쓴 금액 */
const rtSale = mid("a6-rt-sale-coupon", (rand) => {
  const price = randInt(rand, 8, 40) * 1000;
  const r = pick(rand, [10, 20, 25, 30, 40]);
  const coupon = pick(rand, [500, 1000, 2000]);
  const after = (price * (100 - r)) / 100;
  if (after % 100 !== 0 || after <= coupon) return null;
  return {
    key: `${price}:${r}:${coupon}`,
    prompt: `${price}원인 물건을 ${r}% 할인하여 팔고 있습니다. 할인한 가격에서 ${coupon}원 할인 쿠폰을 더 쓴다면 내야 할 돈은 얼마인가요?`,
    answer: after - coupon,
    unit: "원",
    hint: `할인 금액은 (정가) × (할인율)로 구해요. 할인한 가격을 구한 뒤 쿠폰 금액을 빼요.`,
    explanation: `할인 금액 ${(price * r) / 100}원 → ${price} − ${(price * r) / 100} = ${after}(원) → ${after} − ${coupon} = ${after - coupon}(원)`,
    mistakes: { [after]: "쿠폰을 쓰지 않았어요.", [(price * r) / 100 - coupon]: "할인 금액에서 쿠폰을 뺐어요." },
  };
});

/** 상: 두 선수의 성공률 비교 */
const rtShoot = word("a6-rt-success", (rand) => {
  const na = pick(rand, [20, 25, 50]);
  const nb = pick(rand, [20, 25, 50]);
  const sa = randInt(rand, Math.ceil(na * 0.4), na - 2);
  const sb = randInt(rand, Math.ceil(nb * 0.4), nb - 2);
  const pa = (sa * 100) / na;
  const pb = (sb * 100) / nb;
  if (na === nb || pa === pb || !Number.isInteger(pa) || !Number.isInteger(pb)) return null;
  const hi = Math.max(pa, pb);
  return {
    key: `${na}:${sa}:${nb}:${sb}`,
    prompt: `농구 선수 지우는 공을 ${na}번 던져 ${sa}번 넣었고, 서아는 ${nb}번 던져 ${sb}번 넣었습니다. 성공률이 더 높은 선수의 성공률은 몇 %인가요?`,
    answer: hi,
    unit: "%",
    hint: "성공률 = (넣은 횟수) ÷ (던진 횟수) × 100이에요. 넣은 횟수만으로 비교하면 안 돼요.",
    explanation: `지우: ${sa}/${na} × 100 = ${pa}(%), 서아: ${sb}/${nb} × 100 = ${pb}(%) → 더 높은 성공률은 ${hi}%`,
    mistakes: { [Math.min(pa, pb)]: "더 낮은 성공률을 답했어요." },
  };
});

/* ── 6-1-5 여러 가지 그래프 ── */

const FRUITS = ["사과", "포도", "딸기", "수박"];
/** 합이 100인 서로 다른 5의 배수 백분율 4개(모두 15% 이상) */
function pcts(rand: () => number): number[] | null {
  const a = randInt(rand, 5, 8) * 5;
  const b = randInt(rand, 3, 6) * 5;
  const c = randInt(rand, 3, 5) * 5;
  const d = 100 - a - b - c;
  const all = shuffle(rand, [a, b, c, d]);
  if (d < 15 || new Set(all).size < 4) return null;
  return all;
}
const items = (ps: number[]): Item[] => FRUITS.map((name, i) => ({ name, pct: ps[i] }));
const pieScene = (ps: number[]) => compose(240, 230, "좋아하는 과일별 학생 수의 원그래프", pieGraph(items(ps), [120, 115], 95));
const bandScene = (ps: number[]) => compose(288, 66, "좋아하는 과일별 학생 수의 띠그래프", bandGraph(items(ps), [10, 10], 264, 46, false));

/** 하: 원그래프에서 가장 많은 학생이 좋아하는 과일 */
const grMost = easy("a6-gr-pie-most", (rand) => {
  const ps = pcts(rand);
  if (!ps) return null;
  const i = ps.indexOf(Math.max(...ps));
  return {
    key: ps.join(),
    prompt: "학생들이 좋아하는 과일을 조사하여 나타낸 원그래프입니다. 가장 많은 학생이 좋아하는 과일은 무엇인가요?",
    visual: pieScene(ps),
    choices: [...FRUITS],
    answer: FRUITS[i],
    hint: "원그래프에서 차지하는 부분이 넓을수록, 백분율이 클수록 많은 학생이 좋아해요.",
    explanation: `백분율이 가장 큰 것은 ${FRUITS[i]}(${ps[i]}%)예요.`,
  };
});

/** 중: 띠그래프와 전체 학생 수로 두 항목의 학생 수 차 */
const grBandGap = mid("a6-gr-band-gap", (rand) => {
  const ps = pcts(rand);
  if (!ps) return null;
  const N = pick(rand, [200, 300, 400, 500]);
  const [i, t] = shuffle(rand, [0, 1, 2, 3]);
  const hi = ps[i] > ps[t] ? i : t;
  const lo = hi === i ? t : i;
  const diff = (N * (ps[hi] - ps[lo])) / 100;
  return {
    key: `${ps.join()}:${N}:${hi}:${lo}`,
    prompt: `학생 ${N}명이 좋아하는 과일을 조사하여 나타낸 띠그래프입니다. ${j(FRUITS[hi], "를")} 좋아하는 학생은 ${j(FRUITS[lo], "를")} 좋아하는 학생보다 몇 명 더 많은가요?`,
    visual: bandScene(ps),
    answer: diff,
    unit: "명",
    hint: `두 항목의 백분율 차를 구한 뒤 전체 ${N}명에 곱해요.`,
    explanation: `${ps[hi]} − ${ps[lo]} = ${ps[hi] - ps[lo]}(%) → ${N} × ${ps[hi] - ps[lo]}/100 = ${diff}(명)`,
    mistakes: { [ps[hi] - ps[lo]]: "백분율의 차만 구했어요." },
  };
});

/** 상: 몇 명이 좋아하는 과일을 바꾸었을 때 바뀐 백분율 */
const grMove = word("a6-gr-pie-move", (rand) => {
  const ps = pcts(rand);
  if (!ps) return null;
  const N = pick(rand, [200, 400, 500]);
  const [i, t] = shuffle(rand, [0, 1, 2, 3]);
  const step = N / 100;
  const k = step * pick(rand, [5, 10]);
  if (k > (N * ps[i]) / 100 - step * 5) return null;
  const newPct = ps[t] + (k * 100) / N;
  return {
    key: `${ps.join()}:${N}:${i}:${t}:${k}`,
    prompt: `학생 ${N}명이 좋아하는 과일을 조사하여 나타낸 원그래프입니다. ${j(FRUITS[i], "를")} 좋아하던 학생 중 ${k}명이 ${j(FRUITS[t], "로")} 바꾸었다면, ${j(FRUITS[t], "를")} 좋아하는 학생은 전체의 몇 %가 되나요?`,
    visual: pieScene(ps),
    answer: newPct,
    unit: "%",
    hint: `먼저 ${j(FRUITS[t], "를")} 좋아하는 학생 수를 구하고 ${k}명을 더한 뒤, 전체 ${N}명에 대한 백분율로 나타내요.`,
    explanation: `${FRUITS[t]}: ${N} × ${ps[t]}/100 = ${(N * ps[t]) / 100}(명) → ${(N * ps[t]) / 100} + ${k} = ${(N * ps[t]) / 100 + k}(명) → ${(N * ps[t]) / 100 + k}/${N} × 100 = ${newPct}(%)`,
    mistakes: { [ps[t] + k]: "학생 수를 백분율에 그대로 더했어요." },
  };
});

/* ── 6-1-6 직육면체의 부피와 겉넓이 ── */

const cubeScene = (a: number | null) => {
  const b = cuboid([20, 140], 90, 90, 60);
  return compose(200, 160, "정육면체의 겨냥도", { ...b, texts: a === null ? [] : boxLabels(b, `${a} cm`, null, null) });
};

/** 하: 정육면체의 겉넓이 */
const vsCubeSurf = easy("a6-vs-cube-surface", (rand) => {
  const a = randInt(rand, 2, 12);
  return {
    key: `${a}`,
    prompt: "그림과 같은 정육면체의 겉넓이는 몇 cm²인가요?",
    visual: cubeScene(a),
    answer: a * a * 6,
    unit: "cm²",
    hint: "정육면체의 여섯 면은 모두 합동인 정사각형이에요. (한 면의 넓이) × 6",
    explanation: `${a} × ${a} × 6 = ${a * a * 6}(cm²)`,
    mistakes: { [a * a * a]: "부피를 구했어요.", [a * a * 4]: "네 면만 더했어요." },
  };
});

/** 중: 겉넓이로 정육면체의 부피 구하기 */
const vsSurfToVol = mid("a6-vs-surface-to-volume", (rand) => {
  const a = randInt(rand, 2, 10);
  return {
    key: `${a}`,
    prompt: `그림과 같은 정육면체의 겉넓이가 ${a * a * 6} cm²입니다. 이 정육면체의 부피는 몇 cm³인가요?`,
    visual: cubeScene(null),
    answer: a * a * a,
    unit: "cm³",
    hint: "겉넓이 ÷ 6으로 한 면의 넓이를 구하고, 같은 수를 두 번 곱해 그 넓이가 되는 수로 한 모서리를 찾아요.",
    explanation: `한 면 ${a * a * 6} ÷ 6 = ${a * a}(cm²) → 한 모서리 ${a} cm → ${a} × ${a} × ${a} = ${a * a * a}(cm³)`,
    mistakes: { [a * a]: "한 면의 넓이까지만 구했어요." },
  };
});

/** 상: 물이 든 수조에 돌을 넣었을 때 돌의 부피 */
const vsStone = word("a6-vs-stone", (rand) => {
  const w = randInt(rand, 2, 6) * 5;
  const d = randInt(rand, 2, 5) * 5;
  const h = randInt(rand, 3, 6) * 5;
  const h1 = randInt(rand, 5, h - 5);
  const rise = randInt(rand, 1, Math.min(4, h - h1));
  if (w === d) return null;
  const [pw, pd, ph] = [120, 60, 80].map((m, i) => Math.max(40, Math.min(m, [w, d, h][i] * 4)));
  const b = cuboid([20, Math.round(ph + 70)], pw, ph, pd, true, true);
  const top = Math.round(ph + 70 + pd * 0.6 + 40);
  return {
    key: `${w}:${d}:${h}:${h1}:${rise}`,
    prompt: `그림과 같이 안치수가 가로 ${w} cm, 세로 ${d} cm, 높이 ${h} cm인 수조에 물이 ${h1} cm 높이만큼 들어 있습니다. 돌 한 개를 완전히 잠기게 넣었더니 물의 높이가 ${h1 + rise} cm가 되었습니다. 돌의 부피는 몇 cm³인가요?`,
    visual: compose(Math.round(pw + pd * 0.8 + 90), top, "뚜껑이 없는 직육면체 모양 수조의 겨냥도", { ...b, texts: boxLabels(b, `${w} cm`, `${d} cm`, `${h} cm`) }),
    answer: w * d * rise,
    unit: "cm³",
    hint: "돌의 부피는 늘어난 물의 부피와 같아요. (가로) × (세로) × (늘어난 높이)",
    explanation: `늘어난 높이 ${h1 + rise} − ${h1} = ${rise}(cm) → ${w} × ${d} × ${rise} = ${w * d * rise}(cm³)`,
    mistakes: { [w * d * (h1 + rise)]: "늘어난 높이가 아니라 물 전체의 부피를 구했어요." },
  };
});

/* ── 6-2-1 분수의 나눗셈 ── */

/** 하: 대분수를 가분수로 바꾸어 나누기의 첫 단계 */
const fd2Improper = easy("a6-fd2-improper", (rand) => {
  const d = randInt(rand, 2, 9);
  const w = randInt(rand, 1, 4);
  const n = randInt(rand, 1, d - 1);
  const q = randInt(rand, 2, 9);
  const p = randInt(rand, 1, q - 1);
  if (gcd(n, d) !== 1 || gcd(p, q) !== 1) return null;
  return {
    key: `${w}:${n}:${d}:${p}:${q}`,
    prompt: `대분수를 가분수로 바꾸어 계산하려고 합니다. □ 안에 알맞은 수를 구하세요.\n${w} ${n}/${d} ÷ ${p}/${q} = □/${d} ÷ ${p}/${q}`,
    answer: w * d + n,
    hint: `${w} ${n}/${d}에서 자연수 ${j(w, "는")} 1/${d}이 ${w * d}개예요.`,
    explanation: `${w} ${n}/${d} = (${d} × ${w} + ${n})/${d} = ${w * d + n}/${d}`,
    mistakes: { [w + n]: "자연수와 분자를 그냥 더했어요." },
  };
});

/** 중: 한 길이가 다른 길이의 몇 배인지(분모가 다른 분수의 나눗셈) */
const fd2Times = mid("a6-fd2-times", (rand) => {
  const k = randInt(rand, 2, 5);
  const d = randInt(rand, 3, 12);
  const c = randInt(rand, 1, d - 1);
  if (gcd(c, d) !== 1 || k * c >= d * 2) return null;
  const a = reduced(k * c, d);
  if (!a.includes("/") || a.split("/")[1] === String(d)) return null;
  return {
    key: `${k}:${c}:${d}`,
    prompt: `빨간 끈은 ${a} m, 파란 끈은 ${c}/${d} m입니다. 빨간 끈의 길이는 파란 끈의 길이의 몇 배인가요?`,
    answer: k,
    unit: "배",
    hint: `(빨간 끈) ÷ (파란 끈)을 계산해요. 두 분수를 통분하거나 나누는 분수의 분모와 분자를 바꾸어 곱해요.`,
    explanation: `${a} ÷ ${c}/${d} = ${k * c}/${d} ÷ ${c}/${d} = ${k * c} ÷ ${c} = ${k}(배)`,
  };
});

/** 상: 분수 시간 동안 걸은 거리로 빠르기 구하고 다시 거리 구하기 */
const fd2Walk = word("a6-fd2-walk", (rand) => {
  const s = randInt(rand, 2, 5);
  const b = randInt(rand, 2, 6);
  const a = randInt(rand, 1, b - 1);
  const h = randInt(rand, 2, 4);
  if (gcd(a, b) !== 1) return null;
  const dist = reduced(s * a, b);
  if (!dist.includes("/")) return null;
  const distText = s * a > b ? `${Math.floor((s * a) / b)} ${reduced((s * a) % b, b)}` : dist;
  return {
    key: `${s}:${a}:${b}:${h}`,
    prompt: `수아는 ${a}/${b}시간 동안 ${distText} km를 걸었습니다. 같은 빠르기로 ${h}시간 동안 걷는다면 몇 km를 걸을 수 있나요?`,
    answer: s * h,
    unit: "km",
    hint: "먼저 1시간 동안 걷는 거리를 (거리) ÷ (시간)으로 구해요.",
    explanation: `1시간 동안 ${distText} ÷ ${a}/${b} = ${s}(km) → ${s} × ${h} = ${s * h}(km)`,
    mistakes: { [s]: "1시간 동안 걷는 거리까지만 구했어요." },
  };
});

/* ── 6-2-2 소수의 나눗셈 ── */

/** 하: 소수 m 끈을 소수 m씩 자르면 몇 도막 */
const dd2Cut = easy("a6-dd2-cut", (rand) => {
  const each = randInt(rand, 2, 9) / 10;
  const n = randInt(rand, 3, 12);
  const total = Number((each * n).toFixed(1));
  return {
    key: `${each}:${n}`,
    prompt: `길이가 ${total} m인 끈을 ${each} m씩 자르면 몇 도막이 되나요?`,
    answer: n,
    unit: "도막",
    hint: `${total} ÷ ${j(each, "를")} 계산해요. 두 수에 똑같이 10을 곱해도 몫은 같아요.`,
    explanation: `${total} ÷ ${each} = ${Math.round(total * 10)} ÷ ${Math.round(each * 10)} = ${n}(도막)`,
  };
});

/** 중: 소수로 나누어야 할 것을 잘못하여 곱했을 때 */
const dd2Wrong = mid("a6-dd2-wrong-mul", (rand) => {
  const c = randInt(rand, 2, 9) / 10;
  const q = randInt(rand, 2, 30);
  const x = Number((q * c).toFixed(1));
  const wrong = Number((x * c).toFixed(2));
  return {
    key: `${c}:${q}`,
    prompt: `어떤 수를 ${j(c, "로")} 나누어야 할 것을 잘못하여 ${j(c, "를")} 곱했더니 ${j(trim(wrong), "가")} 되었습니다. 바르게 계산한 값은 얼마인가요?`,
    answer: q,
    hint: `먼저 어떤 수를 구해요: ${trim(wrong)} ÷ ${c}. 그다음 어떤 수 ÷ ${j(c, "를")} 계산해요.`,
    explanation: `어떤 수 = ${trim(wrong)} ÷ ${c} = ${trim(x)} → ${trim(x)} ÷ ${c} = ${q}`,
    mistakes: { [trim(x)]: "어떤 수까지만 구했어요." },
  };
});

/** 상: 남은 리본으로 하나 더 만들려면 더 필요한 길이 */
const dd2More = word("a6-dd2-need-more", (rand) => {
  const each = randInt(rand, 12, 45) / 10;
  const n = randInt(rand, 3, 9);
  const restT = randInt(rand, 1, Math.round(each * 10) - 1);
  const total = Number((each * n + restT / 10).toFixed(1));
  const need = Number((each - restT / 10).toFixed(1));
  return {
    key: `${each}:${n}:${restT}`,
    prompt: `리본 ${total} m로 꽃 한 송이에 ${each} m씩 사용하여 꽃을 최대한 많이 만들었습니다. 남은 리본으로 꽃을 한 송이 더 만들려면 리본이 적어도 몇 m 더 있어야 하나요?`,
    answer: trim(need),
    unit: "m",
    hint: `${total} ÷ ${each}의 몫을 자연수까지 구하고 남는 리본의 길이를 구해요. 나머지의 소수점은 나누어지는 수의 처음 소수점 위치에 맞춰요.`,
    explanation: `${total} ÷ ${each} = ${n} … ${trim(restT / 10)} → 꽃 ${n}송이, 남은 리본 ${trim(restT / 10)} m → ${each} − ${trim(restT / 10)} = ${trim(need)}(m)`,
    mistakes: { [trim(restT / 10)]: "남은 리본의 길이를 답했어요." },
  };
});

/* ── 6-2-3 공간과 입체 ── */

/** 2~3줄 × 2~3칸, 칸마다 1~4개(빈칸은 0) */
function grid(rand: () => number): number[][] | null {
  const rows = randInt(rand, 2, 3);
  const cols = randInt(rand, 2, 3);
  const g = Array.from({ length: rows }, () => Array.from({ length: cols }, () => (rand() < 0.15 ? 0 : randInt(rand, 1, 4))));
  const flat = g.flat().filter((v) => v > 0);
  if (flat.length < 3 || new Set(flat).size < 2) return null;
  if (g.some((r) => r.every((v) => v === 0)) || g[0].some((_, c) => g.every((r) => r[c] === 0))) return null;
  // 쌓기나무가 놓인 칸은 변으로 모두 이어져 있다
  const cells = g.flatMap((r, i) => r.map((v, c) => (v ? `${i},${c}` : "")).filter(Boolean));
  const seen = new Set([cells[0]]);
  const todo = [cells[0]];
  while (todo.length) {
    const [i, c] = todo.pop()!.split(",").map(Number);
    for (const [di, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = `${i + di},${c + dc}`;
      if (cells.includes(k) && !seen.has(k)) seen.add(k), todo.push(k);
    }
  }
  if (seen.size !== cells.length) return null;
  return g;
}
const topScene = (g: number[][]) => {
  const s = 34;
  return compose(g[0].length * s + 20, g.length * s + 40, "쌓기나무를 쌓은 모양을 위에서 본 모양(칸의 수는 그 자리에 쌓은 쌓기나무의 개수, 아래쪽이 앞)", topView(g, [10, 10], s, true), {
    texts: [{ at: [10 + (g[0].length * s) / 2, g.length * s + 28], text: "앞" }],
  });
};
const TOP = "그림은 쌓기나무로 쌓은 모양을 위에서 본 모양이고, 칸의 수는 그 자리에 쌓은 쌓기나무의 개수입니다.";

/** 하: 가장 많이 쌓인 자리와 가장 적게 쌓인 자리의 개수 차 */
const spGap = easy("a6-sp-top-gap", (rand) => {
  const g = grid(rand);
  if (!g) return null;
  const v = g.flat().filter((x) => x > 0);
  const mx = Math.max(...v);
  const mn = Math.min(...v);
  return {
    key: g.map((r) => r.join("")).join("/"),
    prompt: `${TOP} 가장 많이 쌓은 자리와 가장 적게 쌓은 자리의 쌓기나무 개수의 차는 몇 개인가요?`,
    visual: topScene(g),
    answer: mx - mn,
    unit: "개",
    hint: "칸에 쓰인 수 중 가장 큰 수와 가장 작은 수를 찾아요.",
    explanation: `가장 많이 ${mx}개, 가장 적게 ${mn}개 → ${mx} − ${mn} = ${mx - mn}(개)`,
  };
});

/** 중: 모든 자리를 가장 높은 층까지 채우려면 더 필요한 쌓기나무 */
const spFill = mid("a6-sp-fill-level", (rand) => {
  const g = grid(rand);
  if (!g) return null;
  const v = g.flat().filter((x) => x > 0);
  const mx = Math.max(...v);
  const need = v.reduce((s, x) => s + (mx - x), 0);
  return {
    key: g.map((r) => r.join("")).join("/"),
    prompt: `${TOP} 쌓기나무가 놓인 자리는 그대로 두고, 모든 자리의 높이를 가장 높은 자리와 같게 만들려면 쌓기나무가 적어도 몇 개 더 필요한가요?`,
    visual: topScene(g),
    answer: need,
    unit: "개",
    hint: `가장 높은 자리는 ${mx}층이에요. 자리마다 ${mx}에서 쓰인 수를 뺀 만큼 더 필요해요.`,
    explanation: `${v.map((x) => `(${mx} − ${x})`).join(" + ")} = ${need}(개)`,
    mistakes: { [v.reduce((s, x) => s + x, 0)]: "지금 쌓은 쌓기나무의 수를 구했어요." },
  };
});

/** 상: 같은 모양 여러 개를 만들고 남은 쌓기나무로 정육면체 만들기 */
const spCube = word("a6-sp-copies-cube", (rand) => {
  const g = grid(rand);
  if (!g) return null;
  const T = g.flat().reduce((s, x) => s + x, 0);
  const m = randInt(rand, 2, 3);
  const r = randInt(rand, 1, 9);
  const all = m * T + r;
  const k = pick(rand, [3, 4]);
  if (all <= k * k * k || all - k * k * k > 60) return null;
  return {
    key: `${g.map((r) => r.join("")).join("/")}:${m}:${r}:${k}`,
    prompt: `${TOP} 가지고 있던 쌓기나무로 이와 똑같은 모양을 ${m}개 만들었더니 ${r}개가 남았습니다. 가지고 있던 쌓기나무를 모두 다시 써서 한 모서리에 쌓기나무가 ${k}개씩 놓이는 정육면체 모양을 한 개 만들면 쌓기나무는 몇 개 남나요?`,
    visual: topScene(g),
    answer: all - k * k * k,
    unit: "개",
    hint: "먼저 그림의 모양 한 개에 쓴 쌓기나무 수를 구하고, 가지고 있던 쌓기나무 수를 구해요.",
    explanation: `한 모양 ${T}개 → 가지고 있던 수 ${T} × ${m} + ${r} = ${all}(개) → 정육면체 ${k} × ${k} × ${k} = ${k * k * k}(개) → ${all} − ${k * k * k} = ${all - k * k * k}(개)`,
    mistakes: { [all]: "가지고 있던 쌓기나무 수까지만 구했어요." },
  };
});

/* ── 6-2-4 비례식과 비례배분 ── */

/** 하: 비례식에서 외항 찾기 */
const ppOuter = easy("a6-pp-outer", (rand) => {
  const a = randInt(rand, 2, 9);
  const b = randInt(rand, 2, 9);
  const k = randInt(rand, 2, 5);
  const [c, d] = [a * k, b * k];
  if (new Set([a, b, c, d]).size < 4) return null;
  const ans = `${a}, ${d}`;
  return {
    key: `${a}:${b}:${k}`,
    prompt: `비례식 ${a} : ${b} = ${c} : ${d}에서 외항을 모두 고르세요.`,
    choices: shuffle(rand, [ans, `${b}, ${c}`, `${a}, ${b}`, `${c}, ${d}`]),
    answer: ans,
    hint: "비례식에서 바깥쪽에 있는 두 항이 외항, 안쪽에 있는 두 항이 내항이에요.",
    explanation: `바깥쪽의 ${j(a, "와")} ${j(d, "가")} 외항, 안쪽의 ${j(b, "와")} ${j(c, "가")} 내항이에요.`,
  };
});

/** 중: 둘레와 가로·세로의 비로 가로 구하기 */
const ppRect = mid("a6-pp-rect-share", (rand) => {
  const a = randInt(rand, 1, 7);
  const b = randInt(rand, 1, 7);
  if (a === b || gcd(a, b) !== 1) return null;
  const u = randInt(rand, 2, 6);
  const P = 2 * (a + b) * u;
  return {
    key: `${a}:${b}:${u}`,
    prompt: `둘레가 ${P} cm인 직사각형의 가로와 세로의 비가 ${a} : ${b}입니다. 이 직사각형의 가로는 몇 cm인가요?`,
    answer: a * u,
    unit: "cm",
    hint: `가로와 세로의 합은 둘레의 절반인 ${P / 2} cm예요. 이것을 ${a} : ${j(b, "로")} 비례배분해요.`,
    explanation: `가로 + 세로 = ${P} ÷ 2 = ${P / 2}(cm) → 가로 = ${P / 2} × ${a}/${a + b} = ${a * u}(cm)`,
    mistakes: { [(P * a) / (a + b)]: "둘레를 그대로 비례배분했어요." },
  };
});

/** 상: 낸 돈의 비로 남은 돈 나누기 */
const ppChange = word("a6-pp-change-share", (rand) => {
  const a = randInt(rand, 2, 7);
  const b = randInt(rand, 2, 7);
  if (a === b || gcd(a, b) !== 1) return null;
  const unit = pick(rand, [500, 1000]);
  const ga = a * unit;
  const gb = b * unit;
  const price = randInt(rand, 2, Math.floor((ga + gb) / 1000) - 1) * 1000;
  const rest = ga + gb - price;
  if (rest <= 0 || rest % (a + b) !== 0 || (rest / (a + b)) % 10 !== 0) return null;
  const share = (rest * a) / (a + b);
  return {
    key: `${ga}:${gb}:${price}`,
    prompt: `지우는 ${ga}원, 도하는 ${gb}원을 내어 ${price}원짜리 선물을 샀습니다. 남은 돈을 낸 돈의 비로 나누어 가진다면 지우는 얼마를 가지게 되나요?`,
    answer: share,
    unit: "원",
    hint: "남은 돈을 먼저 구하고, 낸 돈의 비를 간단한 자연수의 비로 나타내어 비례배분해요.",
    explanation: `남은 돈 ${ga} + ${gb} − ${price} = ${rest}(원), 낸 돈의 비 ${ga} : ${gb} = ${a} : ${b} → ${rest} × ${a}/${a + b} = ${share}(원)`,
    mistakes: { [rest / 2]: "남은 돈을 똑같이 나누었어요.", [rest - share]: "도하가 가지는 돈을 구했어요." },
  };
});

/* ── 6-2-5 원의 넓이 ── */

/** 하: 지름이 주어진 원의 넓이 */
const caDiam = easy("a6-ca-diameter-area", (rand) => {
  const r = randInt(rand, 2, 10);
  const d = r * 2;
  const c: Pt = [100, 100];
  return {
    key: `${d}`,
    prompt: `그림과 같이 지름이 ${d} cm인 원의 넓이는 몇 cm²인가요? (원주율 3.14)`,
    visual: compose(200, 200, "지름을 그은 원", { circles: [{ c, r: 80 }], lines: [{ from: [20, 100], to: [180, 100] }], dots: [c] }),
    answer: trim(r * r * PI),
    unit: "cm²",
    hint: `원의 넓이 = 반지름 × 반지름 × 원주율이에요. 반지름은 지름의 절반이에요.`,
    explanation: `반지름 ${d} ÷ 2 = ${r}(cm) → ${r} × ${r} × 3.14 = ${trim(r * r * PI)}(cm²)`,
    mistakes: { [trim(d * d * PI)]: "지름으로 넓이를 구했어요.", [trim(d * PI)]: "원주를 구했어요." },
  };
});

/** 중: 직사각형과 반원 두 개로 된 운동장 둘레 */
const caTrack = mid("a6-ca-track", (rand) => {
  const L = randInt(rand, 3, 10) * 10;
  const D = randInt(rand, 2, 6) * 10;
  const ry = 50;
  const lx = 70;
  const rx = 190;
  const per = 2 * L + D * PI;
  return {
    key: `${L}:${D}`,
    prompt: `그림은 직사각형의 양쪽에 반원을 붙인 모양의 운동장입니다. 직사각형의 가로가 ${L} m, 반원의 지름이 ${D} m일 때 운동장의 둘레는 몇 m인가요? (원주율 3.14)`,
    visual: compose(260, 140, "직사각형의 양쪽에 반원을 붙인 운동장 모양", {
      lines: [
        { from: [lx, 70 - ry], to: [rx, 70 - ry] },
        { from: [lx, 70 + ry], to: [rx, 70 + ry] },
        { from: [lx, 70 - ry], to: [lx, 70 + ry], dashed: true },
        { from: [rx, 70 - ry], to: [rx, 70 + ry], dashed: true },
      ],
      arcs: [
        { c: [lx, 70], r: ry, from: 90, to: 270 },
        { c: [rx, 70], r: ry, from: -90, to: 90 },
      ],
    }),
    answer: trim(per),
    unit: "m",
    hint: "양쪽 반원 두 개를 합하면 원 한 개가 돼요. 둘레 = 직선 부분 2개 + 원 한 개의 원주",
    explanation: `직선 부분 ${L} × 2 = ${2 * L}(m), 반원 두 개 = 원주 ${D} × 3.14 = ${trim(D * PI)}(m) → ${2 * L} + ${trim(D * PI)} = ${trim(per)}(m)`,
    mistakes: { [trim(L + D * PI)]: "직선 부분을 한 번만 더했어요.", [trim(2 * L + 2 * D * PI)]: "반원 하나를 원 하나로 계산했어요." },
  };
});

/** 상: 큰 원 안의 작은 원 두 개를 뺀 부분의 넓이 */
const caTwo = word("a6-ca-two-circles", (rand) => {
  const R = randInt(rand, 2, 8) * 2;
  const r = R / 2;
  const area = R * R * PI - 2 * r * r * PI;
  return {
    key: `${R}`,
    prompt: `그림과 같이 반지름이 ${R} cm인 큰 원 안에, 큰 원의 지름 위에 크기가 같은 작은 원 두 개를 꼭 맞게 그렸습니다. 큰 원에서 작은 원 두 개를 뺀 부분의 넓이는 몇 cm²인가요? (원주율 3.14)`,
    visual: compose(200, 200, "큰 원 안에 크기가 같은 작은 원 두 개를 지름 위에 나란히 그린 그림", {
      circles: [
        { c: [100, 100], r: 80 },
        { c: [60, 100], r: 40 },
        { c: [140, 100], r: 40 },
      ],
    }),
    answer: trim(area),
    unit: "cm²",
    hint: `작은 원의 지름은 큰 원의 반지름과 같아요. 작은 원의 반지름은 ${R} ÷ 2예요.`,
    explanation: `큰 원 ${R} × ${R} × 3.14 = ${trim(R * R * PI)}(cm²), 작은 원 한 개 ${r} × ${r} × 3.14 = ${trim(r * r * PI)}(cm²) → ${trim(R * R * PI)} − ${trim(r * r * PI)} × 2 = ${trim(area)}(cm²)`,
    mistakes: { [trim(R * R * PI - r * r * PI)]: "작은 원을 한 개만 뺐어요." },
  };
});

/* ── 6-2-6 원기둥, 원뿔, 구 ── */

const CYL = { cx: 110, top: 40, bottom: 140, rx: 60, ry: 18 };

/** 하: 원기둥을 위에서 본 모양(밑면)의 넓이 */
const rsTop = easy("a6-rs-cyl-top-area", (rand) => {
  const r = randInt(rand, 2, 9);
  const h = randInt(rand, 5, 15);
  if (h === r) return null;
  return {
    key: `${r}:${h}`,
    prompt: `그림과 같이 밑면의 반지름이 ${r} cm, 높이가 ${h} cm인 원기둥을 위에서 본 모양의 넓이는 몇 cm²인가요? (원주율 3.14)`,
    visual: compose(220, 170, "원기둥의 겨냥도", cylinder(CYL)),
    answer: trim(r * r * PI),
    unit: "cm²",
    hint: "원기둥을 위에서 보면 밑면인 원이 보여요. 원의 넓이를 구해요.",
    explanation: `위에서 본 모양은 반지름 ${r} cm인 원 → ${r} × ${r} × 3.14 = ${trim(r * r * PI)}(cm²)`,
    mistakes: { [2 * r * h]: "앞에서 본 모양(직사각형)의 넓이를 구했어요." },
  };
});

/** 중: 원기둥 전개도에서 옆면(직사각형)의 둘레 */
const rsNetPer = mid("a6-rs-net-perimeter", (rand) => {
  const r = randInt(rand, 2, 6);
  const h = randInt(rand, 4, 12);
  const w = 2 * r * PI;
  const net = cylinderNet([20, 60], 180, 70, 28);
  return {
    key: `${r}:${h}`,
    prompt: `그림은 밑면의 반지름이 ${r} cm, 높이가 ${h} cm인 원기둥의 전개도입니다. 전개도에서 직사각형 모양인 면의 둘레는 몇 cm인가요? (원주율 3.14)`,
    visual: compose(220, 200, "원기둥의 전개도", net),
    answer: trim(2 * w + 2 * h),
    unit: "cm",
    hint: "직사각형의 가로는 밑면의 둘레(원주)와 같고, 세로는 원기둥의 높이와 같아요.",
    explanation: `가로 ${2 * r} × 3.14 = ${trim(w)}(cm), 세로 ${h} cm → (${trim(w)} + ${h}) × 2 = ${trim(2 * w + 2 * h)}(cm)`,
    mistakes: { [trim(w + h)]: "가로와 세로를 한 번씩만 더했어요.", [trim(2 * r * PI + 2 * h)]: "가로를 반지름으로 원주를 구했어요." },
  };
});

/** 상: 반원을 돌려 만든 구를 앞에서 본 모양의 둘레 */
const rsSphere = word("a6-rs-semicircle-sphere", (rand) => {
  const d = randInt(rand, 2, 10) * 2;
  return {
    key: `${d}`,
    prompt: `지름이 ${d} cm인 반원의 지름을 기준으로 한 바퀴 돌려 입체도형을 만들었습니다. 만든 입체도형을 앞에서 본 모양의 둘레는 몇 cm인가요? (원주율 3.14)`,
    visual: compose(220, 200, "반원을 지름을 기준으로 한 바퀴 돌려 만든 구", sphere([110, 100], 80, true), {
      lines: [{ from: [110, 10], to: [110, 190], dashed: true }],
    }),
    answer: trim(d * PI),
    unit: "cm",
    hint: "반원을 지름을 기준으로 돌리면 구가 되고, 구를 앞에서 보면 반원의 지름과 같은 지름의 원이에요.",
    explanation: `만든 입체도형은 구이고 앞에서 본 모양은 지름이 ${d} cm인 원 → ${d} × 3.14 = ${trim(d * PI)}(cm)`,
    mistakes: { [trim((d / 2) * PI)]: "반지름으로 원주를 구했어요.", [trim((d * PI) / 2 + d)]: "반원의 둘레를 구했어요." },
  };
});

/** 6학년 단원마다 새로 더한 생성기(하·중·상 하나씩): 단원 id → 차시 id → 생성기 */
export const addedG6: WordMap = {
  "g6-s1-frac-div": { "frac-whole": [fd1Den, fd1Smallest], "mixed-whole": [fd1Wire] },
  "g6-s1-prisms": { "prism-parts": [prSum, prSameVertex], "pyramid-parts": [prVsPyr] },
  "g6-s1-dec-div": { "dec-whole": [dd1Ribbon, dd1Wrong], "whole-dec": [dd1Fuel] },
  "g6-s1-ratio": { percent: [rtGrid], "percent-life": [rtSale, rtShoot] },
  "g6-s1-graphs": { circle: [grMost], band: [grBandGap], "graph-compare": [grMove] },
  "g6-s1-volume-surface": { surface: [vsCubeSurf, vsSurfToVol], volume: [vsStone] },
  "g6-s2-frac-div": { "mixed-frac": [fd2Improper], "diff-den": [fd2Times], "frac-frac": [fd2Walk] },
  "g6-s2-dec-div": { "same-places": [dd2Cut], "whole-dec": [dd2Wrong], remainder: [dd2More] },
  "g6-s2-space": { stack: [spGap, spFill, spCube] },
  "g6-s2-proportion": { "prop-property": [ppOuter], share: [ppRect, ppChange] },
  "g6-s2-circle-area": { area: [caDiam], circumference: [caTrack], "area-shapes": [caTwo] },
  "g6-s2-round-solids": { cylinder: [rsTop], net: [rsNetPer], sphere: [rsSphere] },
};
