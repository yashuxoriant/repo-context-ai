import { describe, it, expect } from "vitest";
import { mkdtemp, rm, cp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { planChange } from "../../src/planning/index.js";
import { stampLastValidated } from "../../src/generator/stamp.js";
import { buildSampleGeneratedDocument } from "../generator/fixtures.js";
import { createMockProvider } from "../../src/generator/model.js";

const execFileAsync = promisify(execFile);
const FIXTURE_ROOT = path.dirname(
  fileURLToPath(new URL("../fixtures/sample-repo/package.json", import.meta.url))
);

async function makeWorkingRepo({ approved } = { approved: true }) {
  const dir = await mkdtemp(path.join(tmpdir(), "planning-orchestration-"));
  await cp(FIXTURE_ROOT, dir, { recursive: true });
  await execFileAsync("git", ["init", "-q", dir]);
  if (approved) {
    const content = stampLastValidated(buildSampleGeneratedDocument(), {
      generatedAt: "2026-10-10T00:00:00.000Z",
      commitSha: "abc123",
      status: "approved",
      approvedCommit: "merge-commit"
    });
    await writeFile(path.join(dir, "CONTEXT.md"), content, "utf8");
  }
  return dir;
}

describe("planChange", () => {
  it("returns not_eligible when the repository has no approved context", async () => {
    const dir = await makeWorkingRepo({ approved: false });
    try {
      const result = await planChange({
        ticketDetails: { id: "DEMO-101", acceptanceCriteria: ["Something long enough to be concrete"] },
        repoRoot: dir,
        callModel: createMockProvider("{}")
      });
      expect(result.outcome).toBe("not_eligible");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("returns needs_clarification for an ambiguous ticket, without calling the model", async () => {
    const dir = await makeWorkingRepo();
    try {
      let modelCalled = false;
      const callModel = async () => {
        modelCalled = true;
        return "{}";
      };

      const result = await planChange({
        ticketDetails: { id: "DEMO-102", acceptanceCriteria: [] },
        repoRoot: dir,
        callModel
      });

      expect(result.outcome).toBe("needs_clarification");
      expect(modelCalled).toBe(false);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("returns a planned outcome for an eligible, unambiguous ticket", async () => {
    const dir = await makeWorkingRepo();
    try {
      const callModel = createMockProvider(JSON.stringify({ approach: "Do the thing", files: ["src/index.js"] }));

      const result = await planChange({
        ticketDetails: {
          id: "DEMO-101",
          title: "Add healthz",
          description: "desc",
          acceptanceCriteria: ["Something long enough to be a concrete, checkable criterion"]
        },
        repoRoot: dir,
        callModel
      });

      expect(result.outcome).toBe("planned");
      expect(result.plan.files).toEqual(["src/index.js"]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
