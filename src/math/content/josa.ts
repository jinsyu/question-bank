/**
 * 받침에 맞는 조사 붙이기(전 학년 공용).
 * 숫자는 읽는 소리 기준(영·일·삼·육·칠·팔, 0으로 끝나면 십·백·천·만), 분수 a/b·대분수 w a/b는 'b분의 a'로 읽으므로 분자 기준,
 * 자음 ㄱ~ㅎ과 ㉠~㉭은 이름(기역·니은…), 모양 기호 ☆★는 별(받침 ㄹ), ①~⑳은 일·이·삼… 기준.
 * 단위는 읽는 말: g 그램, kg 킬로그램, t 톤 → 받침 있음 / cm·m·km·mm·L·mL·°·%·cm²·m³ 등 → 없음.
 */
const JAMO_RIEUL = "ㄹ";
const CIRCLED = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";
/** ㉠~㉭ → ㄱ~ㅎ */
const CIRCLED_JAMO = "㉠㉡㉢㉣㉤㉥㉦㉧㉨㉩㉪㉫㉬㉭";
const JAMO = "ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ";

export function hasFinal(text: string | number): { yes: boolean; rieul: boolean } {
  const t = String(text).trim();
  // 분수·대분수는 분자를 마지막에 읽는다(3/8 → 팔분의 삼)
  const frac = /(\d+)\/\d+$/.exec(t);
  if (frac) return hasFinal(frac[1]);
  if (/(^|[\d\s])(k?g|t)$/.test(t)) return { yes: true, rieul: false };
  const c = t.slice(-1);
  if (/\d/.test(c)) return { yes: "013678".includes(c), rieul: "178".includes(c) };
  // 모양 기호는 읽는 말로: ☆★ 별(받침 ㄹ), ○△□◇♡ 등(동그라미·세모·네모·마름모·하트)은 받침 없음
  if ("☆★".includes(c)) return { yes: true, rieul: true };
  const circled = CIRCLED.indexOf(c);
  if (circled >= 0) return hasFinal(circled + 1);
  const circledJamo = CIRCLED_JAMO.indexOf(c);
  if (circledJamo >= 0) return hasFinal(JAMO[circledJamo]);
  if (/[ㄱ-ㅎ]/.test(c)) return { yes: true, rieul: c === JAMO_RIEUL };
  const code = c.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return { yes: false, rieul: false };
  const jong = code % 28;
  return { yes: jong !== 0, rieul: jong === 8 };
}

export type JosaPair = "은/는" | "이/가" | "을/를" | "과/와" | "으로/로" | "이에요/예요" | "이라고/라고" | "이었/였";

/** 받침에 맞는 조사를 붙인다. josa(352, "을/를") → "352를" */
export function josa(text: string | number, pair: JosaPair): string {
  const [withF, noF] = pair.split("/");
  const f = hasFinal(text);
  const use = pair === "으로/로" ? (f.yes && !f.rieul ? withF : noF) : f.yes ? withF : noF;
  return `${text}${use}`;
}
