import { describe, it, expect } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { checkApprovedContext } from "../../src/planning/precondition.js";
import { stampLastValidated } from "../../src/generator/stamp.js";
import { buildSampleGeneratedDocument } from "../generator/fixtures.js";

describe("checkApprovedContext", () => {
  it("is ineligible when no context file exists", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "planning-precondition-"));
    try {
      const result = await checkApprovedContext(dir);
      expect(result.eligible).toBe(false);
      expect(result.reason).toMatch(/no context file/i);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("is ineligible when the context file is still DRAFT", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "planning-precondition-"));
    try {
      const draft = stampLastValidated(buildSampleGeneratedDocument(), {
        generatedAt: "2026-10-18T00:00:00.000Z",
        commitSha: "abc123",
        status: "draft"
      });
      await writeFile(path.join(dir, "CONTEXT.md"), draft, "utf8");

      const result = await checkApprovedContext(dir);
      expect(result.eligible).toBe(false);
      expect(result.reason).toMatch(/DRAFT/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("is eligible when the context file is APPROVED", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "planning-precondition-"));
    try {
      const approved = stampLastValidated(buildSampleGeneratedDocument(), {
        generatedAt: "2026-10-10T00:00:00.000Z",
        commitSha: "abc123",
        status: "approved",
        approvedCommit: "merge-commit"
      });
      await writeFile(path.join(dir, "CONTEXT.md"), approved, "utf8");

      const result = await checkApprovedContext(dir);
      expect(result.eligible).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
