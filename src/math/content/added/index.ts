import type { WordMap } from "../words/word";
import { addedG1 } from "./g1";
import { addedG2 } from "./g2";
import { addedG3 } from "./g3";
import { addedG4 } from "./g4";
import { addedG5 } from "./g5";
import { addedG6 } from "./g6";

/** 2026-10-04 단원마다 하·중·상 하나씩 더한 생성기 */
export const ADDED: WordMap = { ...addedG1, ...addedG2, ...addedG3, ...addedG4, ...addedG5, ...addedG6 };
