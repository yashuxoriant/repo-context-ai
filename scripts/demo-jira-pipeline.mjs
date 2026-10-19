/**
 * Local, no-credentials demo of the full Jira-to-PR pipeline.
 *
 * Runs all three fixture ticket scenarios (DEMO-101, DEMO-102, DEMO-103)
 * end-to-end against a disposable temp copy of the sample-repo fixture,
 * using the mock Jira provider and mock model/PR providers - no real Jira
 * instance, model credentials, or GitHub access required.
 *
 * NOTE: as with scripts/demo-local-dry-run.mjs, the "model" responses here
 * are scripted stand-ins, not live AI output. This proves the pipeline's
 * mechanics (intake, precondition/ambiguity checks, scope enforcement,
 * safety gate, never-auto-merge, status sync) work end-to-end; it does not
 * prove real code-generation quality.
 *
 * Usage: npm run demo:jira
 */
import { mkdtemp, rm, cp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { runJiraTicket } from "../src/pipeline/jira-run.js";
import { createMockProvider } from "../src/generator/model.js";
import { createMockPrProvider } from "../src/review/pr-provider.js";
import { createMockJiraProvider } from "../src/jira/mock-provider.js";
import { createJiraClient } from "../src/jira/client.js";
import { stampLastValidated } from "../src/generator/stamp.js";

const execFileAsync = promisify(execFile);
const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SAMPLE_REPO_FIXTURE = path.join(ROOT, "test/fixtures/sample-repo");
const JIRA_FIXTURE_PATH = path.join(ROOT, "test/fixtures/jira-tickets.sample.json");

async function setUpTargetRepo() {
  const dir = await mkdtemp(path.join(tmpdir(), "jira-pipeline-demo-"));
  await cp(SAMPLE_REPO_FIXTURE, dir, { recursive: true });
  await execFileAsync("git", ["init", "-q", dir]);
  await execFileAsync("git", ["-C", dir, "config", "user.email", "demo@example.com"]);
  await execFileAsync("git", ["-C", dir, "config", "user.name", "Demo"]);

  await writeFile(
    path.join(dir, "package.json"),
    JSON.stringify({
      name: "sample-repo",
      scripts: { test: 'node -e "process.exit(0)"', lint: 'node -e "process.exit(0)"' }
    }),
    "utf8"
  );

  // Simulate "this repository already went through Phase 1 and has an
  // APPROVED context file" - the precondition change-planning requires.
  const approvedContext = stampLastValidated(
    "## Overview\nSample repository used for demo purposes.\n\n## Architecture\nSimple Node.js project.\n\n## Setup & Local Dev\nRun npm test.\n\n## Key Modules / Directories\nsrc/ - source code\n\n## Coding Conventions\nStandard JS.\n\n## Dependencies\nNone notable.\n\n## Important Files\npackage.json\n\n## Known Constraints / Gotchas\nNone identified.\n\n## Ownership\nDemo team.\n\n## Last Validated\nplaceholder",
    { generatedAt: "2026-10-01T00:00:00.000Z", commitSha: "demo-base", status: "approved", approvedCommit: "demo-merge" }
  );
  await writeFile(path.join(dir, "CONTEXT.md"), approvedContext, "utf8");

  await execFileAsync("git", ["-C", dir, "add", "-A"]);
  await execFileAsync("git", ["-C", dir, "commit", "-q", "-m", "initial (simulated Phase 1 approved context)"]);
  return dir;
}

function printResult(ticketId, result) {
  console.log(`\n=== ${ticketId}: outcome = ${result.outcome} ===`);
  if (result.outcome === "unresolved_repository" || result.outcome === "not_eligible") {
    console.log(`Reason: ${result.reason}`);
  } else if (result.outcome === "needs_clarification") {
    console.log("Clarifying questions raised instead of guessing:");
    for (const q of result.questions) console.log(`  - ${q}`);
    console.log(`Draft PR opened: "${result.pr.title}"`);
  } else if (result.outcome === "pr_opened") {
    console.log(`Branch: ${result.implementationResult.branchName}`);
    console.log(`Files written: ${result.implementationResult.writtenPaths.join(", ")}`);
    console.log(`AI-authored test files flagged for review: ${result.implementationResult.aiAuthoredTestFiles.join(", ") || "(none)"}`);
    console.log(`Safety gate: ${result.implementationResult.safetyGate.passed ? "PASSED" : "FAILED"}`);
    console.log(`Pull request opened: "${result.pr.title}" (never auto-merged)`);
  } else if (result.outcome === "safety_gate_failed") {
    console.log("Safety gate failed - no pull request opened.");
  }
}

const dir = await setUpTargetRepo();
try {
  const jiraProvider = await createMockJiraProvider(JIRA_FIXTURE_PATH);
  const jiraClient = createJiraClient(jiraProvider);
  const prProvider = createMockPrProvider();

  // One well-formed ticket (DEMO-101): produces a real plan + implementation + PR.
  const planModel = createMockProvider(
    JSON.stringify({ approach: "Add a healthz CLI command printing status ok", files: ["src/healthz.js"] })
  );
  const ticket101 = await jiraProvider.getTicketDetails("DEMO-101");
  printResult("DEMO-101", await runJiraTicket({ ticket: ticket101, repoRoot: dir, callModel: planModel, jiraClient, prProvider }));

  // One ambiguous ticket (DEMO-102): halts and raises clarifying questions.
  const ticket102 = await jiraProvider.getTicketDetails("DEMO-102");
  printResult(
    "DEMO-102",
    await runJiraTicket({ ticket: ticket102, repoRoot: dir, callModel: planModel, jiraClient, prProvider })
  );

  // One ticket with no repository link (DEMO-103): never guesses a target.
  const ticket103 = await jiraProvider.getTicketDetails("DEMO-103");
  printResult(
    "DEMO-103",
    await runJiraTicket({ ticket: ticket103, repoRoot: dir, callModel: planModel, jiraClient, prProvider })
  );

  console.log(`\nAll ${prProvider._getOpenedPullRequests().length} pull request(s) remain open, unmerged.`);
} finally {
  await rm(dir, { recursive: true, force: true });
}
