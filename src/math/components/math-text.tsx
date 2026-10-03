import { Fragment } from "react";

/** "3/5" 같은 분수를 세로 분수로 그려 준다 */
export function Fraction({ n, d }: { n: string; d: string }) {
  return (
    <span className="mx-0.5 inline-flex flex-col items-center align-middle leading-none">
      <span className="px-1 pb-0.5">{n}</span>
      <span className="w-full border-t-2 border-current" />
      <span className="px-1 pt-0.5">{d}</span>
      <span className="sr-only">{`${d}분의 ${n}`}</span>
    </span>
  );
}

const FRACTION = /(\d+|□)\/(\d+|□)/g;

/** 글 속 줄바꿈(조건 나열, 여러 줄 식)은 줄을 바꿔 보여 준다 */
function withBreaks(text: string, key: number): React.ReactNode {
  if (!text.includes("\n")) return text;
  return text.split("\n").map((line, i) => (
    <Fragment key={`${key}-${i}`}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ));
}

export function MathText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(FRACTION)) {
    parts.push(withBreaks(text.slice(last, m.index), last));
    parts.push(<Fraction key={m.index} n={m[1]} d={m[2]} />);
    last = m.index + m[0].length;
  }
  parts.push(withBreaks(text.slice(last), last));
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>{p}</Fragment>
      ))}
    </>
  );
}
