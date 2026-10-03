/** 시드 고정 난수(mulberry32) — 같은 시드는 같은 문제를 만든다 */
export function createRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randInt(rand: () => number, min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}

export function pick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)];
}

export function shuffle<T>(rand: () => number, items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * 보기의 값(같은 값인지 비교용): 자연수·소수·분수·대분수 + 뒤에 붙은 말(cm, 개 …).
 * 2/4와 1/2, 1 3/8과 11/8처럼 모양만 다르고 값이 같으면 같은 키다. 수가 아니면 글자 그대로
 */
export function choiceKey(choice: string): string {
  const m = /^(\d+(?:\.\d+)?)?(?:(?:^|\s+)(\d+)\/(\d+))?\s*([^\d\s/][^\d]*)?$/.exec(choice.trim());
  if (!m || (m[1] === undefined && m[2] === undefined) || m[3] === "0") return choice;
  const v = Number(m[1] ?? 0) + (m[2] === undefined ? 0 : Number(m[2]) / Number(m[3]));
  return `${v.toFixed(9)}|${(m[4] ?? "").trim()}`;
}

/**
 * 정답과 오답 후보로 4지선다를 만든다. 글자가 같거나 값이 같은 보기(2/4와 1/2)는 넣지 않는다.
 * sameValueOk: '꼴'을 묻는 문제(기약분수로, 대분수로 나타낸 것)에서 값은 같고 꼴이 틀린 오답(2/24, 1 9/7)을 남길 때만 쓴다
 */
export function makeChoices(
  rand: () => number,
  answer: string,
  distractors: string[],
  fillers: () => string,
  sameValueOk = false,
): string[] {
  const key = sameValueOk ? (c: string) => c : choiceKey;
  const picked = new Map<string, string>([[key(answer), answer]]);
  const add = (c: string) => {
    if (picked.size < 4 && !picked.has(key(c))) picked.set(key(c), c);
  };
  for (const d of distractors) add(d);
  for (let i = 0; picked.size < 4 && i < 50; i++) add(fillers());
  return shuffle(rand, [...picked.values()]);
}
