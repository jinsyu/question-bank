import { shuffle } from "../../lib/random";
import type { Generator, Level } from "../types";
import { word, type WordSpec } from "../words/word";
import { settleVisual } from "../figure-check";
import { fractionValue } from "../generators/grade4";
import { josa } from "../josa";
import type { Parts, Pt } from "./g3-figures";

/**
 * 분수·소수 그림 도구(3~5학년 공용): 분수 막대, 수직선(눈금·㉠ 표시·뛰어 세기 화살표), 모눈(10×10).
 * 부분 그림(Parts)을 만들어 g3-figures의 scene()으로 합친다.
 */

type Rand = () => number;

/**
 * 하 칸 계산 연습 비중을 지키는 선택 비중: 하 생성기가 계산 유형 1개 + 그림 유형 1개인 차시에서
 * 그림 유형을 0.5로 두면 하 칸의 1/3이 그림 문제다(engine의 Generator.weight)
 */
export const BASIC_FIG_WEIGHT = 0.5;

/** 그림 글자가 겹치면 글자를 조금 옮기고(settleVisual), 그래도 안 되면 다시 뽑는 생성기. weight: 선택 비중(기본 1) */
export function figGen(id: string, level: Level, make: (rand: Rand) => WordSpec | null, weight?: number): Generator {
  const gen = word(
    id,
    (rand) => {
      for (let i = 0; i < 20; i++) {
        const ok = settleVisual(make(rand));
        if (ok) return ok;
      }
      return null;
    },
    level,
  );
  return weight === undefined ? gen : { ...gen, weight };
}

const r1 = (v: number) => Math.round(v * 10) / 10;

/** 세로 분수 글자(분자·가로선·분모). 가운데가 (x, y), 위아래로 18px씩 차지한다 */
export function fracLabel(x: number, y: number, n: number | string, d: number | string): Parts {
  return {
    texts: [
      { at: [x, y - 11], text: String(n) },
      { at: [x, y + 11], text: String(d) },
    ],
    lines: [{ from: [x - 8, y], to: [x + 8, y], width: 1.2 }],
  };
}

/**
 * 분수 막대: (x, y)에서 폭 w, 높이 h인 막대를 d칸으로 똑같이 나누고 왼쪽부터 shaded칸 색칠.
 * cross: [from, to) 칸에 ×표(덜어 낸 부분)
 */
export function fracBar(x: number, y: number, w: number, h: number, d: number, shaded: number, cross?: [number, number]): Parts {
  const cx = (i: number) => r1(x + (w * i) / d);
  const polygons: NonNullable<Parts["polygons"]> = [];
  if (shaded > 0) polygons.push({ points: [[x, y], [cx(shaded), y], [cx(shaded), y + h], [x, y + h]], fill: true });
  polygons.push({ points: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]] });
  const lines: NonNullable<Parts["lines"]> = Array.from({ length: d - 1 }, (_, i) => ({ from: [cx(i + 1), y] as Pt, to: [cx(i + 1), y + h] as Pt, width: 1.5 }));
  if (cross) {
    const s = Math.min(6, (w / d) * 0.3, h * 0.3);
    for (let i = cross[0]; i < cross[1]; i++) {
      const [mx, my] = [(cx(i) + cx(i + 1)) / 2, y + h / 2];
      lines.push({ from: [r1(mx - s), r1(my - s)], to: [r1(mx + s), r1(my + s)], width: 1.5 }, { from: [r1(mx - s), r1(my + s)], to: [r1(mx + s), r1(my - s)], width: 1.5 });
    }
  }
  return { polygons, lines };
}

export type NumberLine = {
  /** 첫 눈금 x, 수직선 y, 눈금 한 칸(px), 작은 눈금 수, 큰 눈금 간격(작은 눈금 몇 칸마다) */
  x0: number;
  y: number;
  step: number;
  ticks: number;
  major: number;
  /** 중간 눈금 간격(예: 0.1 눈금에서 0.5마다 조금 길게) */
  mid?: number;
  /** 눈금 번호 → 아래에 쓸 글자 */
  labels: { at: number; text: string }[];
  /** 눈금 번호 → 위에서 가리키는 화살표와 글자(㉠ 등) */
  marks?: { at: number; text: string }[];
};

/** 눈금 번호의 x */
export const tickX = (o: Pick<NumberLine, "x0" | "step">, i: number) => r1(o.x0 + i * o.step);

/** 수직선: 큰 눈금(굵게·길게)과 작은 눈금, 아래 수 글자, 위 ㉠ 표시 */
export function numberLine(o: NumberLine): Parts {
  const x = (i: number) => tickX(o, i);
  const lines: NonNullable<Parts["lines"]> = [{ from: [o.x0 - 12, o.y], to: [x(o.ticks) + 12, o.y] }];
  for (let i = 0; i <= o.ticks; i++) {
    const big = i % o.major === 0;
    const half = !big && !!o.mid && i % o.mid === 0;
    const len = big ? 8 : half ? 6.5 : 5;
    lines.push({ from: [x(i), o.y - len], to: [x(i), o.y + len], width: big ? 2 : 1 });
  }
  const texts: NonNullable<Parts["texts"]> = o.labels.map((l) => ({ at: [x(l.at), o.y + 22] as Pt, text: l.text }));
  for (const m of o.marks ?? []) {
    lines.push({ from: [x(m.at), o.y - 28], to: [x(m.at), o.y - 7], arrows: "end", width: 1.5 });
    texts.push({ at: [x(m.at), o.y - 38], text: m.text });
  }
  return { lines, texts };
}

/** 수직선 위 뛰어 세기 화살표: 눈금 from → to를 높이 y의 화살표로, 시작 눈금에서 수직선까지 점선 */
export function jumpArrow(o: Pick<NumberLine, "x0" | "step" | "y">, from: number, to: number, y: number): Parts {
  return {
    lines: [
      { from: [tickX(o, from), y], to: [tickX(o, to), y], arrows: "end", width: 1.5 },
      { from: [tickX(o, from), y], to: [tickX(o, from), o.y - 8], dashed: true, width: 1 },
      { from: [tickX(o, to), y + 4], to: [tickX(o, to), o.y - 8], dashed: true, width: 1 },
    ],
  };
}

/**
 * 10×10 모눈(한 칸 cell px). fills: 색칠할 직사각형 [열 시작, 행 시작, 열 수, 행 수].
 * 줄 긋는 선은 가늘게(1) 그려 색칠 위에 보이게 한다
 */
export function grid10(x: number, y: number, cell: number, fills: [number, number, number, number][]): Parts {
  const size = cell * 10;
  const polygons: NonNullable<Parts["polygons"]> = fills
    .filter(([, , c, r]) => c > 0 && r > 0)
    .map(([c0, r0, c, r]) => ({
      points: [[x + c0 * cell, y + r0 * cell], [x + (c0 + c) * cell, y + r0 * cell], [x + (c0 + c) * cell, y + (r0 + r) * cell], [x + c0 * cell, y + (r0 + r) * cell]] as Pt[],
      fill: true,
    }));
  polygons.push({ points: [[x, y], [x + size, y], [x + size, y + size], [x, y + size]] });
  const lines: NonNullable<Parts["lines"]> = [];
  for (let i = 1; i < 10; i++) {
    lines.push({ from: [x + i * cell, y], to: [x + i * cell, y + size], width: 1 });
    lines.push({ from: [x, y + i * cell], to: [x + size, y + i * cell], width: 1 });
  }
  return { polygons, lines };
}

/** 모눈에서 n칸(1~100)을 왼쪽 세로줄부터 위에서 아래로 색칠: 꽉 찬 줄 + 남은 칸 */
export function gridCells(n: number): [number, number, number, number][] {
  const full = Math.floor(n / 10);
  return [
    [0, 0, full, 10],
    [full, 0, 1, n % 10],
  ];
}

/** 소수 글자: 100분의 n → "0.35", "1.2" 처럼 끝의 0 없이 */
export const hundredths = (n: number) => String(Math.round(n) / 100);
export const tenths = (n: number) => String(Math.round(n) / 10);

/**
 * 보기 4개: 값(분수·소수)이 정답이나 다른 보기와 같은 것은 모양이 달라도 뺀다(1 3/8과 11/8, 0.4와 0.40).
 * 오답 후보가 모자라면 filler로 채운다
 */
export function valueChoices(rand: Rand, answer: string, wrongs: string[], filler: () => string): string[] {
  const seen = [fractionValue(answer)];
  const out = [answer];
  const add = (s: string) => {
    const v = fractionValue(s);
    if (out.length >= 4 || !Number.isFinite(v) || v <= 0 || seen.some((x) => Math.abs(x - v) < 1e-9)) return;
    seen.push(v);
    out.push(s);
  };
  wrongs.forEach(add);
  for (let i = 0; out.length < 4 && i < 100; i++) add(filler());
  return shuffle(rand, out);
}

/** 분수·소수 뒤 조사: 분수는 분자를 읽는 소리로(3/5 → 오분의 삼 → "3/5은") */
export function fj(t: string | number, pair: Parameters<typeof josa>[1]): string {
  const m = /(\d+)\/\d+$/.exec(String(t));
  return m ? `${t}${josa(m[1], pair).slice(m[1].length)}` : josa(t, pair);
}
