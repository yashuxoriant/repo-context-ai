import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { openReviewPullRequest } from "../../src/review/index.js";
import { createMockPrProvider } from "../../src/review/pr-provider.js";
import { createMockJiraProvider } from "../../src/jira/mock-provider.js";
import { createJiraClient } from "../../src/jira/client.js";

const FIXTURE_PATH = fileURLToPath(new URL("../fixtures/jira-tickets.sample.json", import.meta.url));

describe("openReviewPullRequest", () => {
  it("opens a PR and syncs ticket status to pr_opened when the implementation is ready for review", async () => {
    const prProvider = createMockPrProvider();
    const jiraProvider = await createMockJiraProvider(FIXTURE_PATH);
    const jiraClient = createJiraClient(jiraProvider);

    const pr = await openReviewPullRequest({
      ticketId: "DEMO-101",
      planApproach: "Add a healthz command",
      implementationResult: {
        readyForReview: true,
        branchName: "feature/demo-101",
        safetyGate: { test: { passed: true }, lint: { passed: true } },
        aiAuthoredTestFiles: ["src/healthz.test.js"]
      },
      repository: "yashuxoriant/repo-context-ai",
      prProvider,
      jiraClient
    });

    expect(pr.title).toMatch(/DEMO-101/);
    expect(jiraProvider._getStatusHistory("DEMO-101")).toContain("pr_opened");
  });

  it("refuses to open a pull request when the implementation is not ready for review", async () => {
    const prProvider = createMockPrProvider();
    const jiraProvider = await createMockJiraProvider(FIXTURE_PATH);
    const jiraClient = createJiraClient(jiraProvider);

    await expect(
      openReviewPullRequest({
        ticketId: "DEMO-101",
        planApproach: "approach",
        implementationResult: { readyForReview: false, safetyGate: { test: { passed: false }, lint: { passed: true } } },
        repository: "yashuxoriant/repo-context-ai",
        prProvider,
        jiraClient
      })
    ).rejects.toThrow(/safety gate did not pass/);

    expect(prProvider._getOpenedPullRequests()).toHaveLength(0);
  });
});
