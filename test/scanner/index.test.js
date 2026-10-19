import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { mkdtemp, rm, cp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { scanRepository } from "../../src/scanner/index.js";

const execFileAsync = promisify(execFile);

const FIXTURE_ROOT = path.dirname(
  fileURLToPath(new URL("../fixtures/sample-repo/package.json", import.meta.url))
);

describe("scanRepository", () => {
  it("denies scanning when the target is not an accessible repository", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "repo-scanner-deny-"));
    try {
      const result = await scanRepository(dir);
      expect(result.allowed).toBe(false);
      expect(result.bundle).toBeNull();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("produces a complete, redacted signal bundle for an accessible repository", async () => {
    // Copy the fixture into a disposable temp dir and git-init there, so the
    // checked-in fixture under test/fixtures is never mutated by test runs.
    const workDir = await mkdtemp(path.join(tmpdir(), "repo-scanner-fixture-"));
    try {
      await cp(FIXTURE_ROOT, workDir, { recursive: true });
      await execFileAsync("git", ["init", "-q", workDir]);

      const result = await scanRepository(workDir, { maxDepth: 2, limit: 10 });

      expect(result.allowed).toBe(true);
      expect(result.bundle.readme).toMatch(/Sample Repo/);
      expect(result.bundle.manifests["package.json"]).toMatch(/sample-repo/);
      expect(result.bundle.ciConfig).not.toBeNull();
      expect(Array.isArray(result.bundle.largestFiles)).toBe(true);
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  });
});
