import type { Generator } from "./types";
import type { WordMap } from "./words/word";
import { words12 } from "./words/words12";
import { words34 } from "./words/words34";
import { words56 } from "./words/words56";
import { easies, mids } from "./words/mids";
import { ADDED } from "./added";

const WORDS: WordMap = { ...words12, ...words34, ...words56 };

/** 예전 단계(unitId/stdId)에 붙어 있던 기본·응용·서술형 생성기 — 차시를 나눌 때 새 차시로 옮겨 쓴다 */
export function extras(unitId: string, stdId: string): Generator[] {
  return [...(easies[unitId]?.[stdId] ?? []), ...(mids[unitId]?.[stdId] ?? []), ...(WORDS[unitId]?.[stdId] ?? []), ...(ADDED[unitId]?.[stdId] ?? [])];
}
