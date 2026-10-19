import { describe, it, expect } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { runPreMergeChecks } from "../../src/implementation/safety-gate.js";

async function makeRepoWithScripts({ testExitCode, lintExitCode }) {
  const dir = await mkdtemp(path.join(tmpdir(), "safety-gate-"));
  await writeFile(
    path.join(dir, "package.json"),
    JSON.stringify({
      name: "safety-gate-fixture",
      scripts: {
        test: `node -e "process.exit(${testExitCode})"`,
        lint: `node -e "process.exit(${lintExitCode})"`
      }
    }),
    "utf8"
  );
  return dir;
}

describe("runPreMergeChecks", () => {
  it("passes when both test and lint scripts succeed", async () => {
    const dir = await makeRepoWithScripts({ testExitCode: 0, lintExitCode: 0 });
    try {
      const result = await runPreMergeChecks(dir);
      expect(result.passed).toBe(true);
      expect(result.test.passed).toBe(true);
      expect(result.lint.passed).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("fails overall when the test script fails, even if lint passes", async () => {
    const dir = await makeRepoWithScripts({ testExitCode: 1, lintExitCode: 0 });
    try {
      const result = await runPreMergeChecks(dir);
      expect(result.passed).toBe(false);
      expect(result.test.passed).toBe(false);
      expect(result.lint.passed).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("fails overall when the lint script fails, even if tests pass", async () => {
    const dir = await makeRepoWithScripts({ testExitCode: 0, lintExitCode: 1 });
    try {
      const result = await runPreMergeChecks(dir);
      expect(result.passed).toBe(false);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
