import type { Generator, Level, Visual } from "../types";
import { numberProblem } from "../generators/common";

/** 서술형(상) 한 문제의 재료 */
export type WordSpec = {
  key: string;
  prompt: string;
  expression?: string;
  visual?: Visual;
  answer: number | string;
  /** 답 칸 뒤 단위. 여러 칸이면 배열(예: ["시", "분"]) */
  unit?: string | string[];
  /** 주면 4지선다(또는 본래 3개인 선택지) */
  choices?: string[];
  hint: string;
  explanation: string;
  mistakes?: Record<string, string>;
};

/** 서술형 문제 생성기(상): 생활 속 상황을 읽고 두 단계 이상 계산한다. level을 주면 응용(중) 문제로도 쓴다 */
export function word(id: string, make: (rand: () => number) => WordSpec | null, level: Level = 3): Generator {
  const gen: Generator = {
    id,
    level,
    make(rand) {
      let w = make(rand);
      for (let i = 0; !w && i < 50; i++) w = make(rand);
      if (!w) throw new Error(`${id}: 조건에 맞는 문제를 만들지 못했어요`);
      if (w.choices) {
        return {
          key: `${id}:${w.key}`,
          typeId: id,
          prompt: w.prompt,
          expression: w.expression,
          visual: w.visual,
          input: "choice",
          choices: w.choices,
          answer: String(w.answer),
          hint: w.hint,
          explanation: w.explanation,
          mistakes: w.mistakes,
        };
      }
      return numberProblem({
        typeId: id,
        key: `${id}:${w.key}`,
        prompt: w.prompt,
        expression: w.expression,
        visual: w.visual,
        answer: w.answer,
        fields: w.unit === undefined ? undefined : Array.isArray(w.unit) ? w.unit : [w.unit],
        hint: w.hint,
        explanation: w.explanation,
        mistakes: w.mistakes,
      });
    },
  };
  return gen;
}

/** 단원 id → 단계 id → 서술형 생성기 */
export type WordMap = Record<string, Record<string, Generator[]>>;

/** 응용(중) 문제: □ 구하기, 거꾸로 생각하기, 한 단계 문장제 */
export const mid = (id: string, make: (rand: () => number) => WordSpec | null) => word(id, make, 2);
