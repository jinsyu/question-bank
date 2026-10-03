import type { CSSProperties } from "react";
import type { LongDivision, LongDivNum } from "../content/types";

/** 나눗셈 세로셈(교과서식): 나누는 수 ) 나누어지는 수, 몫은 위, 아래로 곱한 수·뺀 결과와 뺄셈 선 */

const width = (n: LongDivNum) => (typeof n === "string" ? n.length : n.width);
const speak = (n: LongDivNum) => (typeof n === "string" ? n : n.blank === "□" ? "빈칸" : `빈칸 ${n.blank}`);

export function longDivLabel(v: LongDivision): string {
  return `나눗셈 세로셈: ${speak(v.dividend)} 나누기 ${speak(v.divisor)}, 몫 ${speak(v.quotient)}, 아래로 ${v.rows.map((r) => speak(r.num)).join(", ")}`;
}

/** 수 하나를 grid 칸에 놓는다: 숫자는 한 칸에 한 자리, 빈칸은 자리 수만큼 넓은 네모 */
function Num({ num, row, lastCol }: { num: LongDivNum; row: number; lastCol: number }) {
  const w = width(num);
  const first = lastCol - w + 1;
  if (typeof num !== "string")
    return (
      <span
        // 한 자리 빈칸은 정사각형(숫자 0과 헷갈리지 않게 각진 네모), 여러 자리는 자리 수만큼 넓게.
        // 높이를 줄의 절반 남짓으로 두고 가운데 놓아 곱한 수 줄 아래 뺄셈 선과 떨어뜨린다(글자 크기에 비례해 인쇄에서도 같다)
        style={{ gridRow: row, gridColumn: `${first} / ${lastCol + 1}`, width: `calc(${w} * 0.9em - 0.14em)`, height: "0.76em" }}
        className="flex items-center justify-center self-center justify-self-center rounded-none border-2 border-[var(--ink)] leading-none"
      >
        {num.blank !== "□" && <span className="text-[0.65em]">{num.blank}</span>}
      </span>
    );
  return (
    <>
      {[...num].map((ch, i) => (
        <span key={i} style={{ gridRow: row, gridColumn: first + i }} className="text-center">
          {ch}
        </span>
      ))}
    </>
  );
}

export function LongDivisionFigure({ visual: v }: { visual: LongDivision }) {
  const dw = width(v.divisor);
  const n = width(v.dividend);
  // grid 열: 1..dw 나누는 수, dw+1 괄호, dw+2.. 나누어지는 수
  const col = (end: number) => dw + 2 + end;
  const last = n - 1;
  const grid: CSSProperties = {
    gridTemplateColumns: `repeat(${dw}, 0.9em) 0.55em repeat(${n}, 0.9em)`,
    gridAutoRows: "1.45em",
  };
  return (
    <div role="img" aria-label={longDivLabel(v)} className="inline-grid pr-2 font-serif text-2xl tabular-nums sm:text-3xl print:text-lg" style={grid}>
      <Num num={v.quotient} row={1} lastCol={col(last)} />
      <Num num={v.divisor} row={2} lastCol={dw} />
      {/* 괄호: 오른쪽이 둥근 ')' 모양, 위 선과 이어진다 */}
      <span aria-hidden style={{ gridRow: 2, gridColumn: dw + 1 }} className="ml-[0.05em] w-[0.35em] rounded-r-[100%] border-r-2 border-[var(--ink)]" />
      <span aria-hidden style={{ gridRow: 2, gridColumn: `${dw + 1} / ${col(last) + 1}` }} className="border-t-2 border-[var(--ink)]" />
      <Num num={v.dividend} row={2} lastCol={col(last)} />
      {v.rows.map((r, k) => {
        // 뺄셈 선은 빼는 수(곱한 수)의 폭만큼
        const from = r.end - width(r.num) + 1;
        const to = r.end;
        return [
          <Num key={`n${k}`} num={r.num} row={k + 3} lastCol={col(r.end)} />,
          r.rule && (
            <span
              key={`r${k}`}
              aria-hidden
              style={{ gridRow: k + 3, gridColumn: `${col(from)} / ${col(to) + 1}` }}
              className="self-end border-b-2 border-[var(--ink)]"
            />
          ),
        ];
      })}
    </div>
  );
}
