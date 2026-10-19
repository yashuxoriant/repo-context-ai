import { describe, it, expect } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { implementChange, implementChangeFiles } from "../../src/implementation/index.js";
import { createMockProvider } from "../../src/generator/model.js";

const execFileAsync = promisify(execFile);

async function makeRepo() {
  const dir = await mkdtemp(path.join(tmpdir(), "implementation-orchestration-"));
  await execFileAsync("git", ["init", "-q", dir]);
  await execFileAsync("git", ["-C", dir, "config", "user.email", "test@example.com"]);
  await execFileAsync("git", ["-C", dir, "config", "user.name", "Test"]);
  await writeFile(
    path.join(dir, "package.json"),
    JSON.stringify({
      name: "implementation-fixture",
      scripts: { test: 'node -e "process.exit(0)"', lint: 'node -e "process.exit(0)"' }
    }),
    "utf8"
  );
  await execFileAsync("git", ["-C", dir, "add", "-A"]);
  await execFileAsync("git", ["-C", dir, "commit", "-q", "-m", "initial"]);
  return dir;
}

describe("implementChange", () => {
  it("creates a branch, writes planned files, runs the safety gate, and flags AI-authored tests", async () => {
    const dir = await makeRepo();
    try {
      const plan = { approach: "Add a healthz command", files: ["src/healthz.js", "src/healthz.test.js"] };

      const result = await implementChange({
        plan,
        repoRoot: dir,
        callModel: createMockProvider("stub"),
        branchName: "feature/demo-101"
      });

      expect(result.branchName).toBe("feature/demo-101");
      expect(result.writtenPaths.sort()).toEqual(["src/healthz.js", "src/healthz.test.js"].sort());
      expect(result.aiAuthoredTestFiles).toEqual(["src/healthz.test.js"]);
      expect(result.safetyGate.passed).toBe(true);
      expect(result.readyForReview).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("marks readyForReview false when the safety gate fails", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "implementation-failing-"));
    try {
      await execFileAsync("git", ["init", "-q", dir]);
      await execFileAsync("git", ["-C", dir, "config", "user.email", "test@example.com"]);
      await execFileAsync("git", ["-C", dir, "config", "user.name", "Test"]);
      await writeFile(
        path.join(dir, "package.json"),
        JSON.stringify({
          name: "implementation-failing-fixture",
          scripts: { test: 'node -e "process.exit(1)"', lint: 'node -e "process.exit(0)"' }
        }),
        "utf8"
      );
      await execFileAsync("git", ["-C", dir, "add", "-A"]);
      await execFileAsync("git", ["-C", dir, "commit", "-q", "-m", "initial"]);

      const plan = { approach: "approach", files: ["src/a.js"] };
      const result = await implementChange({
        plan,
        repoRoot: dir,
        callModel: createMockProvider("stub"),
        branchName: "feature/demo-102"
      });

      expect(result.safetyGate.passed).toBe(false);
      expect(result.readyForReview).toBe(false);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe("implementChangeFiles", () => {
  it("writes planned files and runs the safety gate without creating or switching a git branch", async () => {
    const dir = await makeRepo();
    try {
      const before = await execFileAsync("git", ["-C", dir, "branch", "--show-current"]);
      const plan = { approach: "Add a healthz command", files: ["src/healthz.js", "src/healthz.test.js"] };

      const result = await implementChangeFiles({
        plan,
        repoRoot: dir,
        callModel: createMockProvider("stub")
      });

      const after = await execFileAsync("git", ["-C", dir, "branch", "--show-current"]);

      expect(result.branchName).toBeUndefined();
      expect(after.stdout).toBe(before.stdout);
      expect(result.writtenPaths.sort()).toEqual(["src/healthz.js", "src/healthz.test.js"].sort());
      expect(result.aiAuthoredTestFiles).toEqual(["src/healthz.test.js"]);
      expect(result.safetyGate.passed).toBe(true);
      expect(result.readyForReview).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
