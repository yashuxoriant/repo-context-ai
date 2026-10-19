import { describe, it, expect } from "vitest";
import { mkdtemp, rm, cp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { renderPlanningPrompt, validatePlanScope, generatePlan } from "../../src/planning/plan.js";
import { stampLastValidated } from "../../src/generator/stamp.js";
import { buildSampleGeneratedDocument } from "../generator/fixtures.js";
import { createMockProvider } from "../../src/generator/model.js";

const execFileAsync = promisify(execFile);
const FIXTURE_ROOT = path.dirname(
  fileURLToPath(new URL("../fixtures/sample-repo/package.json", import.meta.url))
);

async function makeApprovedWorkingRepo() {
  const dir = await mkdtemp(path.join(tmpdir(), "planning-plan-"));
  await cp(FIXTURE_ROOT, dir, { recursive: true });
  await execFileAsync("git", ["init", "-q", dir]);
  const approved = stampLastValidated(buildSampleGeneratedDocument(), {
    generatedAt: "2026-10-10T00:00:00.000Z",
    commitSha: "abc123",
    status: "approved",
    approvedCommit: "merge-commit"
  });
  await writeFile(path.join(dir, "CONTEXT.md"), approved, "utf8");
  return dir;
}

const ticketDetails = {
  id: "DEMO-101",
  title: "Add a healthz endpoint",
  description: "Operators need a health check command.",
  acceptanceCriteria: ["Running the command prints status ok and exits 0"]
};

describe("renderPlanningPrompt", () => {
  it("includes the ticket, approved context, and JSON output instructions", () => {
    const prompt = renderPlanningPrompt({
      ticketDetails,
      approvedContextContent: "## Overview\nsome approved context",
      bundle: { tree: [] }
    });

    expect(prompt).toContain("DEMO-101");
    expect(prompt).toContain("some approved context");
    expect(prompt).toMatch(/"approach"/);
    expect(prompt).toMatch(/"files"/);
  });
});

describe("validatePlanScope", () => {
  it("accepts plans whose files are all relative paths within the repo", () => {
    const result = validatePlanScope({ files: ["src/index.js", "test/index.test.js"] }, "/repo");
    expect(result.valid).toBe(true);
  });

  it("rejects an absolute path", () => {
    const result = validatePlanScope({ files: ["/etc/passwd"] }, "/repo");
    expect(result.valid).toBe(false);
  });

  it("rejects a path escaping the repository via ..", () => {
    const result = validatePlanScope({ files: ["../outside-repo/file.js"] }, "/repo");
    expect(result.valid).toBe(false);
  });
});

describe("generatePlan", () => {
  it("produces a validated plan grounded in the approved context", async () => {
    const dir = await makeApprovedWorkingRepo();
    try {
      const callModel = createMockProvider(
        JSON.stringify({ approach: "Add a healthz command", files: ["src/index.js"] })
      );

      const plan = await generatePlan({ ticketDetails, repoRoot: dir, callModel });
      expect(plan.approach).toMatch(/healthz/);
      expect(plan.files).toEqual(["src/index.js"]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("rejects a plan whose model response includes an out-of-scope path", async () => {
    const dir = await makeApprovedWorkingRepo();
    try {
      const callModel = createMockProvider(
        JSON.stringify({ approach: "bad plan", files: ["../../etc/passwd"] })
      );

      await expect(generatePlan({ ticketDetails, repoRoot: dir, callModel })).rejects.toThrow(/Plan rejected/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("throws a clear error when the model response is not valid JSON", async () => {
    const dir = await makeApprovedWorkingRepo();
    try {
      const callModel = createMockProvider("not json at all");
      await expect(generatePlan({ ticketDetails, repoRoot: dir, callModel })).rejects.toThrow(
        /did not return valid JSON/
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
