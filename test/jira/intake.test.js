import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  filterEligibleTickets,
  extractTicketDetails,
  resolveTargetRepository,
  runIntake
} from "../../src/jira/intake.js";

const FIXTURE_PATH = fileURLToPath(new URL("../fixtures/jira-tickets.sample.json", import.meta.url));

async function loadFixtureTickets() {
  const raw = await readFile(FIXTURE_PATH, "utf8");
  return JSON.parse(raw).tickets;
}

describe("filterEligibleTickets", () => {
  it("includes eligible tickets and excludes ineligible ones", async () => {
    const tickets = await loadFixtureTickets();
    const eligible = filterEligibleTickets(tickets);

    expect(eligible.some((t) => t.id === "DEMO-101")).toBe(true);
    expect(eligible.some((t) => t.id === "DEMO-104")).toBe(false);
  });
});

describe("extractTicketDetails", () => {
  it("includes acceptance criteria verbatim when present", async () => {
    const tickets = await loadFixtureTickets();
    const ticket = tickets.find((t) => t.id === "DEMO-101");
    const result = extractTicketDetails(ticket);

    expect(result.acceptanceCriteria).toEqual(ticket.acceptanceCriteria);
  });

  it("marks acceptance criteria as absent (null) rather than inferring from description", async () => {
    const tickets = await loadFixtureTickets();
    const ticket = tickets.find((t) => t.id === "DEMO-102"); // empty acceptanceCriteria array
    const result = extractTicketDetails(ticket);

    expect(result.acceptanceCriteria).toBeNull();
  });
});

describe("resolveTargetRepository", () => {
  it("resolves the repository when exactly one is linked", async () => {
    const tickets = await loadFixtureTickets();
    const ticket = tickets.find((t) => t.id === "DEMO-101");
    const result = resolveTargetRepository(ticket);

    expect(result).toEqual({ resolved: true, repository: "yashuxoriant/repo-context-ai" });
  });

  it("marks unresolved rather than guessing when no repository is linked", async () => {
    const tickets = await loadFixtureTickets();
    const ticket = tickets.find((t) => t.id === "DEMO-103"); // repositoryLink: null
    const result = resolveTargetRepository(ticket);

    expect(result.resolved).toBe(false);
  });
});

describe("runIntake", () => {
  it("combines extraction and repository resolution for a well-formed ticket", async () => {
    const tickets = await loadFixtureTickets();
    const ticket = tickets.find((t) => t.id === "DEMO-101");
    const { details, repoResolution } = runIntake(ticket);

    expect(details.id).toBe("DEMO-101");
    expect(repoResolution.resolved).toBe(true);
  });
});
