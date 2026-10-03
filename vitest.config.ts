import { configDefaults, defineConfig } from "vitest/config";

// .claude/worktrees 안의 다른 작업 사본 테스트까지 돌지 않게 뺀다
export default defineConfig({
  test: { exclude: [...configDefaults.exclude, ".claude/**"] },
});
