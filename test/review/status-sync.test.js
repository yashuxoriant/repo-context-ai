import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { syncTicketStatus, AUTOMATIC_TRANSITIONS } from "../../src/review/status-sync.js";
import { createMockJiraProvider } from "../../src/jira/mock-provider.js";
import { createJiraClient } from "../../src/jira/client.js";

const FIXTURE_PATH = fileURLToPath(new URL("../fixtures/jira-tickets.sample.json", import.meta.url));

describe("AUTOMATIC_TRANSITIONS", () => {
  it("never includes a production-deployment transition", () => {
    const hasProductionTransition = AUTOMATIC_TRANSITIONS.some((t) => /production/i.test(t));
    expect(hasProductionTransition).toBe(false);
  });

  it("includes exactly the three expected pipeline-stage transitions", () => {
    expect([...AUTOMATIC_TRANSITIONS].sort()).toEqual(["deployed_staging", "pr_merged", "pr_opened"].sort());
  });
});

describe("syncTicketStatus", () => {
  it("applies an allowed transition", async () => {
    const jiraProvider = await createMockJiraProvider(FIXTURE_PATH);
    const jiraClient = createJiraClient(jiraProvider);

    await syncTicketStatus(jiraClient, "DEMO-101", "pr_opened");
    expect(jiraProvider._getStatusHistory("DEMO-101")).toContain("pr_opened");
  });

  it("refuses a transition that is not in the allowed list, such as a production deploy", async () => {
    const jiraProvider = await createMockJiraProvider(FIXTURE_PATH);
    const jiraClient = createJiraClient(jiraProvider);

    await expect(syncTicketStatus(jiraClient, "DEMO-101", "deployed_production")).rejects.toThrow(
      /not in the pipeline's allowed automatic transitions/
    );
  });
});
