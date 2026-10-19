import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { buildClarifyingQuestions, raiseClarifyingQuestions } from "../../src/review/clarifying-questions.js";
import { createMockPrProvider } from "../../src/review/pr-provider.js";
import { createMockJiraProvider } from "../../src/jira/mock-provider.js";
import { createJiraClient } from "../../src/jira/client.js";

const FIXTURE_PATH = fileURLToPath(new URL("../fixtures/jira-tickets.sample.json", import.meta.url));

describe("buildClarifyingQuestions", () => {
  it("asks for acceptance criteria when none are present", () => {
    const questions = buildClarifyingQuestions("No acceptance criteria present on the ticket");
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.join(" ")).toMatch(/acceptance criteria/i);
  });

  it("asks for concrete restatement when criteria are too vague", () => {
    const questions = buildClarifyingQuestions("At least one acceptance criterion is too vague to scope a change unambiguously");
    expect(questions.join(" ")).toMatch(/specific, checkable conditions/i);
  });
});

describe("raiseClarifyingQuestions", () => {
  it("opens a questions draft PR and updates ticket status, instead of silently dropping the ticket", async () => {
    const prProvider = createMockPrProvider();
    const jiraProvider = await createMockJiraProvider(FIXTURE_PATH);
    const jiraClient = createJiraClient(jiraProvider);

    const result = await raiseClarifyingQuestions({
      ticketId: "DEMO-102",
      reason: "No acceptance criteria present on the ticket",
      repository: "yashuxoriant/repo-context-ai",
      prProvider,
      jiraClient
    });

    expect(result.questions.length).toBeGreaterThan(0);
    expect(result.pr.title).toMatch(/Needs clarification/);
    expect(jiraProvider._getStatusHistory("DEMO-102")).toContain("needs_clarification");
  });
});
