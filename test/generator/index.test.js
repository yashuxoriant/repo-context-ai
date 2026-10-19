import { describe, it, expect } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { generateContextFile } from "../../src/generator/index.js";
import { createMockProvider } from "../../src/generator/model.js";
import { buildSampleGeneratedDocument } from "./fixtures.js";

describe("generateContextFile", () => {
  it("validates, stamps, and writes a schema-valid model result end-to-end", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "generator-e2e-"));
    try {
      const callModel = createMockProvider(buildSampleGeneratedDocument());

      const result = await generateContextFile({
        repoRoot: dir,
        repoName: "sample-repo",
        commitSha: "abc1234",
        bundle: { tree: [], readme: null, manifests: {}, ciConfig: null, hotFiles: [], largestFiles: [] },
        callModel,
        now: () => "2026-01-01T00:00:00.000Z"
      });

      expect(result.content).toMatch(/Status: DRAFT - pending engineer review/);
      expect(result.writtenPaths).toContain("CONTEXT.md");
      expect(result.writtenPaths).toContain(".github/copilot-instructions.md");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("throws rather than writing a file when the model output fails validation", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "generator-invalid-"));
    try {
      const callModel = createMockProvider("## Overview\nincomplete document");

      await expect(
        generateContextFile({
          repoRoot: dir,
          repoName: "sample-repo",
          commitSha: "abc1234",
          bundle: { tree: [], readme: null, manifests: {}, ciConfig: null, hotFiles: [], largestFiles: [] },
          callModel
        })
      ).rejects.toThrow(/failed validation/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
