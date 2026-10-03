import { josa } from "../josa";

type Pair = Parameters<typeof josa>[1];

/**
 * 받침에 맞는 조사(5학년 문장 공용). 분수는 읽는 소리의 끝인 분자 기준이다.
 * jq("3/5", "을/를") → "3/5을"(오분의 삼을), jq("1 1/2", "과/와") → "1 1/2과"(이분의 일과)
 */
export function jq(text: string | number, pair: Pair): string {
  const t = String(text);
  const m = /(\d+)\/\d+$/.exec(t);
  return m ? t + josa(m[1], pair).slice(m[1].length) : josa(t, pair);
}
