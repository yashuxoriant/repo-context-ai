import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    passWithNoTests: true,
    environment: "node",
    testTimeout: 30000,
    // Many tests spawn npm/git subprocesses (safety gate, branch creation,
    // repo scanning). Running every test file in parallel causes CPU/IO
    // contention that shows up as flaky timeouts, especially in CI. Trade
    // some wall-clock time for reliability.
    fileParallelism: false
  }
});
