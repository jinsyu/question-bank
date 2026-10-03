/** 서수(전 학년 공용). "5째"처럼 숫자로 쓰지 않는다: 1~10은 첫째~열째, 그보다 크면 "13번째" */
export const ORD = ["", "첫째", "둘째", "셋째", "넷째", "다섯째", "여섯째", "일곱째", "여덟째", "아홉째", "열째"] as const;

export const ord = (n: number): string => (Number.isInteger(n) && n >= 1 && n < ORD.length ? ORD[n] : `${n}번째`);
