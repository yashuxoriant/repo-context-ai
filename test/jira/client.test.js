import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { createJiraClient, TICKET_STATUSES } from "../../src/jira/client.js";
import { createMockJiraProvider } from "../../src/jira/mock-provider.js";

const FIXTURE_PATH = fileURLToPath(new URL("../fixtures/jira-tickets.sample.json", import.meta.url));

describe("createMockJiraProvider", () => {
  it("loads the fixture and parses tickets", async () => {
    const provider = await createMockJiraProvider(FIXTURE_PATH);
    const eligible = await provider.fetchEligibleTickets();
    expect(eligible.length).toBeGreaterThan(0);
  });

  it("only returns automation-eligible tickets", async () => {
    const provider = await createMockJiraProvider(FIXTURE_PATH);
    const eligible = await provider.fetchEligibleTickets();
    expect(eligible.some((t) => t.id === "DEMO-104")).toBe(false); // explicitly ineligible
    expect(eligible.some((t) => t.id === "DEMO-101")).toBe(true);
  });

  it("returns ticket details by id", async () => {
    const provider = await createMockJiraProvider(FIXTURE_PATH);
    const details = await provider.getTicketDetails("DEMO-101");
    expect(details.title).toMatch(/healthz/);
  });

  it("reflects status updates on subsequent reads (history-based)", async () => {
    const provider = await createMockJiraProvider(FIXTURE_PATH);
    await provider.updateTicketStatus("DEMO-101", TICKET_STATUSES.PR_OPENED);
    await provider.updateTicketStatus("DEMO-101", TICKET_STATUSES.PR_MERGED);

    expect(provider._getStatusHistory("DEMO-101")).toEqual(["open", "pr_opened", "pr_merged"]);
  });

  it("throws for an unknown ticket id", async () => {
    const provider = await createMockJiraProvider(FIXTURE_PATH);
    await expect(provider.getTicketDetails("NOPE-1")).rejects.toThrow(/Unknown ticket/);
  });
});

describe("createJiraClient", () => {
  it("delegates every method to the underlying provider unchanged", async () => {
    const provider = await createMockJiraProvider(FIXTURE_PATH);
    const client = createJiraClient(provider);

    const eligible = await client.fetchEligibleTickets();
    expect(eligible.length).toBeGreaterThan(0);

    await client.updateTicketStatus("DEMO-101", TICKET_STATUSES.NEEDS_CLARIFICATION);
    expect(provider._getStatusHistory("DEMO-101")).toContain("needs_clarification");
  });
});
