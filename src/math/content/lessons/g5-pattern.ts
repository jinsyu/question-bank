import type { ShapeScene } from "../types";
import { fit, rp, type Pt, type Texts } from "./g5-figure";
import { ord } from "../ordinal";

/**
 * 5-1 규칙과 대응: 교과서처럼 배열 그림(첫째·둘째·셋째)을 보고 수를 세어 대응 관계를 찾는다.
 * 성냥개비 도형은 옆 도형과 한 변(성냥개비 한 개)을 함께 쓰도록 붙여 그린다.
 */

const S = 20;
const H3 = Math.sqrt(3) / 2;

/** 도형 k개를 한 줄로 붙인 모양의 다각형들(왼쪽 위 기준) */
function chain(shape: string, k: number): Pt[][] {
  const out: Pt[][] = [];
  for (let i = 0; i < k; i++) {
    if (shape === "정사각형") out.push([[i * S, 0], [(i + 1) * S, 0], [(i + 1) * S, S], [i * S, S]]);
    else if (shape === "정삼각형") {
      const x = (i * S) / 2;
      out.push(i % 2 === 0 ? [[x, S * H3], [x + S, S * H3], [x + S / 2, 0]] : [[x, 0], [x + S, 0], [x + S / 2, S * H3]]);
    } else if (shape === "오각형") {
      // 집 모양: 벽 두 개, 바닥, 지붕 두 개(성냥개비 5개)
      const x = i * S;
      out.push([[x, S * 1.6], [x + S, S * 1.6], [x + S, S * 0.6], [x + S / 2, 0], [x, S * 0.6]]);
    } else {
      // 세로 변이 있는 육각형
      const w = S * 2 * H3;
      const cx = w / 2 + i * w;
      out.push([0, 1, 2, 3, 4, 5].map((j): Pt => {
        const a = ((30 + 60 * j) * Math.PI) / 180;
        return [cx + S * Math.cos(a), S + S * Math.sin(a)];
      }));
    }
  }
  return out;
}

/** 성냥개비로 만든 도형 배열(첫째~셋째) */
export function sticksScene(shape: string): ShapeScene {
  const polygons: NonNullable<ShapeScene["polygons"]> = [];
  const texts: Texts = [];
  let y = 0;
  for (let k = 1; k <= 3; k++) {
    const polys = chain(shape, k);
    const h = Math.max(...polys.flat().map((p) => p[1]));
    polys.forEach((p) => polygons.push({ points: p.map(([px, py]) => rp([px + 44, py + y])) }));
    texts.push({ at: [16, y + h / 2], text: ord(k) });
    y += h + 16;
  }
  return fit({ label: `성냥개비로 ${shape}을 한 줄로 이어 만든 모양(첫째~셋째)`, polygons, texts }, 6);
}

/** 정사각형 탁자를 한 줄로 이어 붙이고 둘레에 의자(○)를 놓은 모양(첫째~셋째) */
export function tablesScene(): ShapeScene {
  const T = 22;
  const polygons: NonNullable<ShapeScene["polygons"]> = [];
  const lines: NonNullable<ShapeScene["lines"]> = [];
  const circles: NonNullable<ShapeScene["circles"]> = [];
  const texts: Texts = [];
  let y = 12;
  for (let k = 1; k <= 3; k++) {
    const x0 = 58;
    polygons.push({ points: [[x0, y], [x0 + k * T, y], [x0 + k * T, y + T], [x0, y + T]] });
    for (let i = 1; i < k; i++) lines.push({ from: [x0 + i * T, y], to: [x0 + i * T, y + T] });
    for (let i = 0; i < k; i++) {
      circles.push({ c: [x0 + i * T + T / 2, y - 7], r: 4 }, { c: [x0 + i * T + T / 2, y + T + 7], r: 4 });
    }
    circles.push({ c: [x0 - 8, y + T / 2], r: 4 }, { c: [x0 + k * T + 8, y + T / 2], r: 4 });
    texts.push({ at: [18, y + T / 2], text: ord(k) });
    y += T + 30;
  }
  return fit({ label: "탁자를 한 줄로 이어 붙이고 둘레에 의자(○)를 놓은 모양(첫째~셋째)", polygons, lines, circles, texts }, 6);
}
