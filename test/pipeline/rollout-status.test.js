import { describe, it, expect } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { readRepositoryContextStatus, computeRolloutStatus } from "../../src/pipeline/rollout-status.js";
import { stampLastValidated } from "../../src/generator/stamp.js";
import { buildSampleGeneratedDocument } from "../generator/fixtures.js";

describe("readRepositoryContextStatus", () => {
  it("reports not_started when no CONTEXT.md exists", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "rollout-status-"));
    try {
      const result = await readRepositoryContextStatus(dir);
      expect(result).toEqual({ status: "not_started", lastValidated: null });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("reports draft_pending_review for an unapproved generated file", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "rollout-status-"));
    try {
      const draft = stampLastValidated(buildSampleGeneratedDocument(), {
        generatedAt: "2026-10-18T00:00:00.000Z",
        commitSha: "abc123",
        status: "draft"
      });
      await writeFile(path.join(dir, "CONTEXT.md"), draft, "utf8");

      const result = await readRepositoryContextStatus(dir);
      expect(result.status).toBe("draft_pending_review");
      expect(result.lastValidated).toBe("2026-10-18T00:00:00.000Z");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("reports approved after the merge transition", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "rollout-status-"));
    try {
      const approved = stampLastValidated(buildSampleGeneratedDocument(), {
        generatedAt: "2026-10-10T00:00:00.000Z",
        commitSha: "abc123",
        status: "approved",
        approvedCommit: "merge-commit"
      });
      await writeFile(path.join(dir, "CONTEXT.md"), approved, "utf8");

      const result = await readRepositoryContextStatus(dir);
      expect(result.status).toBe("approved");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe("computeRolloutStatus", () => {
  it("aggregates status across multiple repository checkouts", async () => {
    const onboarded = await mkdtemp(path.join(tmpdir(), "rollout-status-"));
    const notStarted = await mkdtemp(path.join(tmpdir(), "rollout-status-"));
    try {
      const approved = stampLastValidated(buildSampleGeneratedDocument(), {
        generatedAt: "2026-10-10T00:00:00.000Z",
        commitSha: "abc123",
        status: "approved",
        approvedCommit: "merge-commit"
      });
      await writeFile(path.join(onboarded, "CONTEXT.md"), approved, "utf8");

      const result = await computeRolloutStatus([
        { name: "onboarded-repo", repoRoot: onboarded },
        { name: "not-started-repo", repoRoot: notStarted }
      ]);

      expect(result.repositories).toEqual([
        { name: "onboarded-repo", status: "approved", lastValidated: "2026-10-10T00:00:00.000Z", prUrl: null },
        { name: "not-started-repo", status: "not_started", lastValidated: null, prUrl: null }
      ]);
      expect(result.targets).toEqual({ coveragePercent: 100, stalenessDaysMax: 30 });
    } finally {
      await rm(onboarded, { recursive: true, force: true });
      await rm(notStarted, { recursive: true, force: true });
    }
  });
});
