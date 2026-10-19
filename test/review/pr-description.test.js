import { describe, it, expect } from "vitest";
import { buildPrDescription } from "../../src/review/pr-description.js";

describe("buildPrDescription", () => {
  it("includes the ticket id, change summary, and safety-gate results", () => {
    const body = buildPrDescription({
      ticketId: "DEMO-101",
      approach: "Add a healthz command",
      safetyGate: { test: { passed: true }, lint: { passed: true } },
      aiAuthoredTestFiles: []
    });

    expect(body).toContain("DEMO-101");
    expect(body).toContain("Add a healthz command");
    expect(body).toMatch(/Tests: PASSED/);
    expect(body).toMatch(/Lint: PASSED/);
  });

  it("flags AI-authored test files separately when present", () => {
    const body = buildPrDescription({
      ticketId: "DEMO-101",
      approach: "approach",
      safetyGate: { test: { passed: true }, lint: { passed: true } },
      aiAuthoredTestFiles: ["src/healthz.test.js"]
    });

    expect(body).toMatch(/AI-Authored Tests - Needs Explicit Review/);
    expect(body).toContain("src/healthz.test.js");
  });

  it("omits the AI-authored-tests section when no test files were written", () => {
    const body = buildPrDescription({
      ticketId: "DEMO-101",
      approach: "approach",
      safetyGate: { test: { passed: true }, lint: { passed: true } },
      aiAuthoredTestFiles: []
    });

    expect(body).not.toMatch(/AI-Authored Tests/);
  });

  it("always states the PR must be reviewed and merged by a human", () => {
    const body = buildPrDescription({
      ticketId: "DEMO-101",
      approach: "approach",
      safetyGate: { test: { passed: true }, lint: { passed: true } },
      aiAuthoredTestFiles: []
    });

    expect(body).toMatch(/must be reviewed and merged by a human/);
  });
});
