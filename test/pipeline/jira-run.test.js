import { describe, it, expect } from "vitest";
import { mkdtemp, rm, cp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { runJiraTicket } from "../../src/pipeline/jira-run.js";
import { createMockProvider } from "../../src/generator/model.js";
import { createMockPrProvider } from "../../src/review/pr-provider.js";
import { createMockJiraProvider } from "../../src/jira/mock-provider.js";
import { createJiraClient } from "../../src/jira/client.js";
import { stampLastValidated } from "../../src/generator/stamp.js";
import { buildSampleGeneratedDocument } from "../generator/fixtures.js";

const execFileAsync = promisify(execFile);
const SAMPLE_REPO_FIXTURE = path.dirname(
  fileURLToPath(new URL("../fixtures/sample-repo/package.json", import.meta.url))
);
const JIRA_FIXTURE_PATH = fileURLToPath(new URL("../fixtures/jira-tickets.sample.json", import.meta.url));

async function makeApprovedRepo() {
  const dir = await mkdtemp(path.join(tmpdir(), "jira-run-"));
  await cp(SAMPLE_REPO_FIXTURE, dir, { recursive: true });
  await execFileAsync("git", ["init", "-q", dir]);
  await execFileAsync("git", ["-C", dir, "config", "user.email", "test@example.com"]);
  await execFileAsync("git", ["-C", dir, "config", "user.name", "Test"]);

  // Give the fixture repo working test/lint scripts so the safety gate can
  // genuinely pass (the sample-repo fixture has no package.json scripts).
  await writeFile(
    path.join(dir, "package.json"),
    JSON.stringify({
      name: "sample-repo",
      scripts: { test: 'node -e "process.exit(0)"', lint: 'node -e "process.exit(0)"' }
    }),
    "utf8"
  );

  const approved = stampLastValidated(buildSampleGeneratedDocument(), {
    generatedAt: "2026-10-10T00:00:00.000Z",
    commitSha: "abc123",
    status: "approved",
    approvedCommit: "merge-commit"
  });
  await writeFile(path.join(dir, "CONTEXT.md"), approved, "utf8");

  await execFileAsync("git", ["-C", dir, "add", "-A"]);
  await execFileAsync("git", ["-C", dir, "commit", "-q", "-m", "initial"]);
  return dir;
}

async function makeJiraSetup() {
  const jiraProvider = await createMockJiraProvider(JIRA_FIXTURE_PATH);
  const jiraClient = createJiraClient(jiraProvider);
  const prProvider = createMockPrProvider();
  return { jiraProvider, jiraClient, prProvider };
}

describe("runJiraTicket", () => {
  it("returns unresolved_repository for a ticket with no repository link (DEMO-103)", async () => {
    const { jiraClient, prProvider, jiraProvider } = await makeJiraSetup();
    const ticket = await jiraProvider.getTicketDetails("DEMO-103");

    const result = await runJiraTicket({
      ticket,
      repoRoot: "/irrelevant",
      callModel: createMockProvider("{}"),
      jiraClient,
      prProvider
    });

    expect(result.outcome).toBe("unresolved_repository");
  });

  it("returns needs_clarification for an ambiguous ticket (DEMO-102) and opens a questions draft", async () => {
    const dir = await makeApprovedRepo();
    try {
      const { jiraClient, prProvider, jiraProvider } = await makeJiraSetup();
      const ticket = await jiraProvider.getTicketDetails("DEMO-102");

      const result = await runJiraTicket({
        ticket,
        repoRoot: dir,
        callModel: createMockProvider("{}"),
        jiraClient,
        prProvider
      });

      expect(result.outcome).toBe("needs_clarification");
      expect(result.pr.title).toMatch(/Needs clarification/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("returns pr_opened end-to-end for a well-formed, eligible ticket (DEMO-101)", async () => {
    const dir = await makeApprovedRepo();
    try {
      const { jiraClient, prProvider, jiraProvider } = await makeJiraSetup();
      const ticket = await jiraProvider.getTicketDetails("DEMO-101");
      const callModel = createMockProvider(
        JSON.stringify({ approach: "Add a healthz command", files: ["src/healthz.js"] })
      );

      const result = await runJiraTicket({ ticket, repoRoot: dir, callModel, jiraClient, prProvider });

      expect(result.outcome).toBe("pr_opened");
      expect(result.pr.title).toMatch(/DEMO-101/);
      expect(jiraProvider._getStatusHistory("DEMO-101")).toContain("pr_opened");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
