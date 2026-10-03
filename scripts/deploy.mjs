// 문제 은행을 푸시하고, 바뀐 내용을 쓰는 앱에 반영한다: npm run deploy
//   1) 이 저장소 검사(check, typecheck, test) → main에 푸시
//   2) 앱마다 고정된 question-bank 커밋을 최신으로 올림 → 그 앱의 검사 → 커밋·푸시 (Vercel 앱은 푸시하면 배포된다)
//   3) arena는 이 맥에서 돌므로 빌드하고 서비스를 다시 시작한다
// 옵션: --all (바뀐 것이 없어도 모든 앱), --dry-run (푸시·커밋·재시작 없이 검사까지만 하고 앱을 원래대로 돌려놓음)
// 어느 단계든 실패하면 거기서 멈추고, 그 앱은 푸시하지 않는다.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { userInfo } from "node:os";

const ALL = process.argv.includes("--all");
const DRY = process.argv.includes("--dry-run");
const REPO = "jinsyu/question-bank";

const sh = (cmd, cwd) => execSync(cmd, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const run = (cmd, cwd) => {
  console.log(`   $ ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit" });
};
const fail = (msg) => {
  console.error(`\n❌ ${msg}`);
  process.exit(1);
};

// 앱 폴더는 이 저장소(worktree면 원래 저장소) 옆에 있다. 다른 곳이면 APPS_DIR=경로
const APPS_DIR = resolve(process.env.APPS_DIR ?? join(dirname(resolve(sh("git rev-parse --git-common-dir"))), ".."));

/** paths: 이 폴더가 바뀌면 그 앱에 반영한다 */
const APPS = [
  {
    name: "math-king",
    dir: "math-king",
    paths: ["src/math/"],
    lock: "pnpm-lock.yaml",
    bump: "pnpm add github:jinsyu/question-bank",
    verify: ["pnpm typecheck", "pnpm test"],
  },
  {
    name: "arena",
    dir: "math-battle-arena",
    paths: ["src/math/"],
    lock: "pnpm-lock.yaml",
    bump: "pnpm add github:jinsyu/question-bank",
    verify: ["pnpm typecheck", "pnpm test", "pnpm build"],
    // 운영 서버가 이 폴더에서 돈다: 다시 시작하고 응답을 확인한다 (진행 중인 방은 끊긴다)
    after: [`launchctl kickstart -k gui/${userInfo().uid}/site.mathking.server`, "sleep 3", "curl -sf -o /dev/null http://localhost:3300/api/units"],
  },
  {
    name: "rpg",
    dir: "class-rpg-game",
    paths: ["questions/"],
    lock: "package-lock.json",
    bump: "npm install -D github:jinsyu/question-bank",
    // 지운 페이지의 옛 dev 타입(.next/dev/types)이 남아 있으면 타입 검사가 실패한다
    verify: ["rm -rf .next/dev/types", "npx next typegen", "npm run check"],
    // 운영 DB 적재는 Vercel 운영 배포(vercel-build)가 한다
  },
];

/** lock 파일에 고정된 question-bank 커밋 */
function pinned(app) {
  const text = readFileSync(join(APPS_DIR, app.dir, app.lock), "utf8");
  return text.match(/question-bank(?:\/tar\.gz\/|\.git#)([0-9a-f]{40})/)?.[1];
}

// ── 1. 이 저장소 ──
console.log("① question-bank 검사");
if (sh("git status --porcelain") && !DRY) fail("커밋하지 않은 변경이 있어요. 먼저 커밋해 주세요.");
for (const cmd of ["npm run check", "npm run typecheck", "npm test"]) run(cmd);

const head = sh("git rev-parse HEAD");
sh("git fetch -q origin main");
if (sh("git rev-parse origin/main") === head) console.log("   이미 푸시돼 있어요.");
else if (DRY) console.log("   (dry-run) 푸시는 건너뛰어요. 앱은 GitHub의 main 기준으로 확인해요.");
else run("git push origin HEAD:main");
const target = DRY ? sh("git rev-parse origin/main") : head;

// ── 2. 앱 ──
const done = [];
for (const app of APPS) {
  const dir = join(APPS_DIR, app.dir);
  const from = pinned(app);
  if (!from) fail(`${app.name}: ${app.lock}에서 question-bank 커밋을 찾지 못했어요.`);
  const changed = from === target ? [] : sh(`git diff --name-only ${from} ${target}`).split("\n");
  if (!ALL && !changed.some((f) => app.paths.some((p) => f.startsWith(p)))) {
    console.log(`\n② ${app.name}: 반영할 변경이 없어요 (${app.paths.join(", ")})`);
    continue;
  }
  console.log(`\n② ${app.name}: ${from.slice(0, 7)} → ${target.slice(0, 7)}`);
  if (sh("git branch --show-current", dir) !== "main") fail(`${app.name}: main 브랜치가 아니에요.`);
  if (sh("git status --porcelain --untracked-files=no", dir)) fail(`${app.name}: 커밋하지 않은 변경이 있어요.`);
  run("git pull -q --ff-only origin main", dir);

  const restore = () => {
    sh(`git checkout -- package.json ${app.lock}`, dir);
    sh(app.lock === "pnpm-lock.yaml" ? "pnpm install --frozen-lockfile" : "npm ci", dir);
  };
  try {
    if (from !== target) run(app.bump, dir);
    if (pinned(app) !== target) throw new Error(`lock이 ${target.slice(0, 7)}로 고정되지 않았어요 (GitHub 반영이 늦을 수 있어요. 잠시 뒤 다시 실행해 주세요).`);
    const touched = sh("git diff --name-only HEAD", dir).split("\n").filter(Boolean);
    if (touched.some((f) => f !== app.lock)) throw new Error(`lock 말고 다른 파일이 바뀌었어요: ${touched.join(", ")}`);
    for (const cmd of app.verify) run(cmd, dir);
  } catch (e) {
    restore();
    fail(`${app.name}: ${e.message}\n   앱은 원래대로 돌려놨고 푸시하지 않았어요.`);
  }

  if (DRY) {
    restore();
    console.log("   (dry-run) 검사 통과. 원래대로 돌려놨어요.");
    continue;
  }
  if (from !== target) {
    run(`git commit -q -m "question-bank 갱신 (${target.slice(0, 7)})" -- ${app.lock}`, dir);
    run("git push -q origin main", dir);
  }
  for (const cmd of app.after ?? []) run(cmd, dir);
  done.push(app.name);
}

console.log(`\n✅ 끝: question-bank ${target.slice(0, 7)}${done.length ? ` → ${done.join(", ")}` : " (앱 변경 없음)"}`);
if (done.some((n) => n !== "arena")) console.log(`   math-king·rpg는 Vercel이 배포 중이에요. 확인: gh api repos/jinsyu/<저장소>/commits/main/status --jq .state`);
