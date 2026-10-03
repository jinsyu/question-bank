import type { Visual } from "../types";
import { makeChoices, pick, randInt } from "../../lib/random";
import { mixedText } from "../generators/grade4";
import { gcd, reduced } from "../generators/grade5";
import { word as wordBase, type WordSpec } from "../words/word";
import { settleVisual } from "../figure-check";

export { gcd, mixedText, pick, randInt, reduced };
export type { WordSpec };

type Make = (rand: () => number) => WordSpec | null;
/** 글자가 선·원·호와 겹치면 글자를 몇 px 옮겨 살리고(settleVisual), 그래도 안 되거나 그림 밖이면 다시 뽑는다 */
const guard = (make: Make): Make => (rand) => {
  for (let i = 0; i < 20; i++) {
    const w = make(rand);
    const ok = settleVisual(w);
    if (ok) return ok;
  }
  return null;
};

/** 기본(하)·응용(중)·서술형(상) 문제 */
export const easy = (id: string, make: Make) => wordBase(id, guard(make), 1);
export const mid = (id: string, make: Make) => wordBase(id, guard(make), 2);
export const word = (id: string, make: Make) => wordBase(id, guard(make), 3);

/** 조사(는·가)가 자연스럽도록 받침 없는 이름만 쓴다 */
export const NAMES = ["지우", "서아", "수아", "도하", "유나", "이수"];
export const names = (rand: () => number, n: number) => {
  const pool = [...NAMES];
  return Array.from({ length: n }, () => pool.splice(randInt(rand, 0, pool.length - 1), 1)[0]);
};

export const trim = (n: number, p = 4) => String(Number(n.toFixed(p)));
export const won = (n: number) => n.toLocaleString("ko-KR");

/** 4지선다(중복 없음) */
export const opts = (rand: () => number, answer: string, others: string[], filler: () => string) =>
  makeChoices(rand, answer, others.filter((o) => o !== answer), filler);

/** 수 답의 4지선다 */
export const numOpts = (rand: () => number, ans: number, others: number[], step = 1) =>
  opts(rand, trim(ans), others.filter((o) => o > 0).map((o) => trim(o)), () => trim(ans + step * randInt(rand, 1, 15)));

/** 분수 답의 4지선다 */
export const fracOpts = (rand: () => number, answer: string, others: string[]) =>
  opts(rand, answer, others, () => reduced(randInt(rand, 1, 40), randInt(rand, 2, 12)));

/** 다각형 이름 앞부분: 3 → 삼 */
export const POLY = ["", "", "", "삼", "사", "오", "육", "칠", "팔", "구", "십"];
export const poly = (n: number) => `${POLY[n]}각`;

/** 서로 다른 한 자리 수 n개 */
export const digitsDistinct = (rand: () => number, n: number, min = 1, max = 9) => {
  const pool = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  return Array.from({ length: n }, () => pool.splice(randInt(rand, 0, pool.length - 1), 1)[0]);
};

/** 표 그림 */
export const table = (header: string[], rows: string[][]): Visual => ({ kind: "table", header, rows });

export const cmpText = (a: number, b: number) => (a > b ? ">" : a < b ? "<" : "=");

/** 수·단위 뒤 조사: 읽었을 때 받침이 있는지(ㄹ 받침은 따로) */
function finalSound(w: string): "none" | "ㄹ" | "other" {
  const t = w.trim();
  const last = t[t.length - 1];
  if (/[0-9]/.test(last)) return "036".includes(last) ? "other" : "178".includes(last) ? "ㄹ" : "none";
  if (/kg$|g$/.test(t)) return "other";
  if (/[A-Za-z]$/.test(t)) return "none";
  const code = last.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return "none";
  const jong = code % 28;
  return jong === 0 ? "none" : jong === 8 ? "ㄹ" : "other";
}

const PARTICLES = { 를: ["을", "를"], 가: ["이", "가"], 는: ["은", "는"], 와: ["과", "와"], 라고: ["이라고", "라고"] } as const;

/** 조사를 붙인다: j(7, "를") → "7을", j(3, "로") → "3으로", j(8, "로") → "8로" */
export function j(w: string | number, p: keyof typeof PARTICLES | "로"): string {
  const s = String(w);
  const f = finalSound(s);
  if (p === "로") return s + (f === "other" ? "으로" : "로");
  return s + PARTICLES[p][f === "none" ? 1 : 0];
}

/** 분수 뒤 조사: 분자로 끝나게 읽으므로 분자 기준(3/5 → "5분의 3을") */
export const jp = (numerator: number, p: Parameters<typeof j>[1]) => j(numerator, p).slice(String(numerator).length);

/** 분수 문자열("2 3/5", "3/5", "4") 뒤 조사: 분자 기준 */
export const jf = (text: string, p: Parameters<typeof j>[1]) => {
  const m = text.match(/(\d+)\/\d+$/);
  return text + (m ? jp(Number(m[1]), p) : j(text, p).slice(text.length));
};
