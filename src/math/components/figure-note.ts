import type { Visual } from "../content/types";

/** 화면 읽기 프로그램에만 들리는 안내: 그림 설명만으로는 풀기 어려운 문제 */
export const FIGURE_NOTE = "그림을 보고 푸는 문제예요. 그림 설명만으로 풀기 어려우면 선생님이나 친구에게 그림을 읽어 달라고 하세요.";

/**
 * 그림을 봐야 풀 수 있는지. 도형 그림은 정답이 드러나지 않게 설명을 줄여 두었고(세거나 읽어야 한다),
 * 그래프는 묻는 항목(asked)의 값을 설명에서 뺀다. 나머지(분수 막대·원, 세로셈, 나눗셈 세로셈, 표)는
 * 설명이나 표 자체로 값을 모두 들을 수 있다.
 */
export function needsSight(visual: Visual): boolean {
  if (visual.kind === "shape") return true;
  if (visual.kind === "bars" || visual.kind === "line") return (visual.asked?.length ?? 0) > 0;
  return false;
}
