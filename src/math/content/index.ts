import type { Unit } from "./types";
import { fractionDecimal } from "./units/g3s1-fraction-decimal";
import * as G1 from "./units/grade1";
import * as G2 from "./units/grade2";
import * as G3 from "./units/grade3";
import * as G4 from "./units/grade4";
import * as G5 from "./units/grade5";
import * as G6 from "./units/grade6";
import * as SG from "./units/shapes-graphs";
import { extras } from "./extras";

/** 예전 단계 id와 같은 차시에는 그 단계의 응용(중)·서술형(상) 생성기를 붙인다(이미 들어 있는 것은 빼고) */
const withWords = (u: Unit): Unit => ({
  ...u,
  standards: u.standards.map((s) => ({
    ...s,
    generators: [...new Set([...s.generators, ...extras(u.id, s.id)])],
  })),
});

/** 학년 → 학기 → 단원 번호 순서 */
export const units: Unit[] = [fractionDecimal, ...Object.values(G1), ...Object.values(G2), ...Object.values(G3), ...Object.values(G4), ...Object.values(G5), ...Object.values(G6), ...Object.values(SG)]
  .map(withWords)
  .sort((a, b) => a.grade - b.grade || a.semester - b.semester || a.number - b.number);

/** URL 조각 [g3, s1, fraction-decimal] — 서버→클라이언트로 함수 대신 넘기는 단원 식별자 */
export type UnitKey = [grade: string, semester: string, slug: string];

export function findUnit(grade: string, semester: string, slug: string): Unit | undefined {
  return units.find(
    (u) => `g${u.grade}` === grade && `s${u.semester}` === semester && u.slug === slug,
  );
}

export const unitPath = (u: Unit) => `/g${u.grade}/s${u.semester}/${u.slug}`;
