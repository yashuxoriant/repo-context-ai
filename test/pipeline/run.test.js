import { describe, it, expect } from "vitest";
import { mkdtemp, rm, cp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { runContextRefresh } from "../../src/pipeline/run.js";
import { createMockProvider } from "../../src/generator/model.js";
import { buildSampleGeneratedDocument } from "../generator/fixtures.js";

const execFileAsync = promisify(execFile);

const FIXTURE_ROOT = path.dirname(
  fileURLToPath(new URL("../fixtures/sample-repo/package.json", import.meta.url))
);

async function makeWorkingRepo() {
  const dir = await mkdtemp(path.join(tmpdir(), "pipeline-run-"));
  await cp(FIXTURE_ROOT, dir, { recursive: true });
  await execFileAsync("git", ["init", "-q", dir]);
  return dir;
}

describe("runContextRefresh", () => {
  it("reports changed=true on first generation (no previous approved file)", async () => {
    const dir = await makeWorkingRepo();
    try {
      const callModel = createMockProvider(buildSampleGeneratedDocument());
      const result = await runContextRefresh({
        repoRoot: dir,
        repoName: "sample-repo",
        commitSha: "commit1",
        callModel,
        now: () => "2026-01-01T00:00:00.000Z"
      });

      expect(result.changed).toBe(true);
      expect(result.writtenPaths).toContain("CONTEXT.md");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("reports changed=false when regeneration only differs in metadata from the approved file", async () => {
    const dir = await makeWorkingRepo();
    try {
      const callModel = createMockProvider(buildSampleGeneratedDocument());

      // First pass establishes the "approved" file (simulating a merged PR).
      await runContextRefresh({
        repoRoot: dir,
        repoName: "sample-repo",
        commitSha: "commit1",
        callModel,
        now: () => "2026-01-01T00:00:00.000Z"
      });

      // Second pass: same substantive content, different commit/date only.
      const result = await runContextRefresh({
        repoRoot: dir,
        repoName: "sample-repo",
        commitSha: "commit2",
        callModel,
        now: () => "2026-02-01T00:00:00.000Z"
      });

      expect(result.changed).toBe(false);
      expect(result.skippedReason).toMatch(/no meaningful difference/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("reports changed=true when substantive content changes between runs", async () => {
    const dir = await makeWorkingRepo();
    try {
      await runContextRefresh({
        repoRoot: dir,
        repoName: "sample-repo",
        commitSha: "commit1",
        callModel: createMockProvider(buildSampleGeneratedDocument({ Overview: "version one" })),
        now: () => "2026-01-01T00:00:00.000Z"
      });

      const result = await runContextRefresh({
        repoRoot: dir,
        repoName: "sample-repo",
        commitSha: "commit2",
        callModel: createMockProvider(buildSampleGeneratedDocument({ Overview: "version two - rewritten" })),
        now: () => "2026-02-01T00:00:00.000Z"
      });

      expect(result.changed).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("does not write any file and reports changed=false when access is denied", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "pipeline-denied-"));
    try {
      await writeFile(path.join(dir, "README.md"), "# not a git repo");
      const result = await runContextRefresh({
        repoRoot: dir,
        repoName: "denied-repo",
        commitSha: "commit1",
        callModel: createMockProvider(buildSampleGeneratedDocument())
      });

      expect(result.changed).toBe(false);
      expect(result.skippedReason).toMatch(/access denied/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
