import { describe, it, expect } from "vitest";
import { mkdtemp, rm, readFile, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { markContextApproved } from "../../src/pipeline/approve.js";
import { stampLastValidated } from "../../src/generator/stamp.js";
import { buildSampleGeneratedDocument } from "../generator/fixtures.js";

describe("markContextApproved", () => {
  it("transitions a draft file to approved status, preserving generation metadata", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "pipeline-approve-"));
    try {
      const draft = stampLastValidated(buildSampleGeneratedDocument(), {
        generatedAt: "2026-01-01T00:00:00.000Z",
        commitSha: "abc1234",
        status: "draft"
      });

      await mkdir(path.join(dir, ".github"), { recursive: true });
      await writeFile(path.join(dir, "CONTEXT.md"), draft, "utf8");
      await writeFile(path.join(dir, ".github", "copilot-instructions.md"), draft, "utf8");

      const result = await markContextApproved({
        repoRoot: dir,
        mergeCommit: "merge-commit-789",
        outputPaths: { canonical: "CONTEXT.md", mirrors: [".github/copilot-instructions.md"] }
      });

      expect(result.content).toMatch(/Status: APPROVED \(merge commit: merge-commit-789\)/);
      expect(result.content).toMatch(/Generated: 2026-01-01T00:00:00\.000Z/);
      expect(result.content).toMatch(/Commit: abc1234/);

      const canonicalOnDisk = await readFile(path.join(dir, "CONTEXT.md"), "utf8");
      const mirrorOnDisk = await readFile(path.join(dir, ".github", "copilot-instructions.md"), "utf8");
      expect(canonicalOnDisk).toBe(result.content);
      expect(mirrorOnDisk).toBe(result.content);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
