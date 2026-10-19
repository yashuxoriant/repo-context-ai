/**
 * Builds the pull request description for a completed implementation,
 * always including the ticket link, a change summary, and the pre-PR
 * safety-gate results (spec: "Pull request links back to the originating
 * ticket"), plus explicit flagging of any AI-authored test files (spec:
 * "AI-authored tests require explicit human review", change-implementation
 * capability).
 */
export function buildPrDescription({ ticketId, approach, safetyGate, aiAuthoredTestFiles }) {
  const lines = [
    `Automated implementation for ${ticketId}.`,
    "",
    "## Summary",
    approach,
    "",
    "## Safety Gate Results",
    `- Tests: ${safetyGate.test.passed ? "PASSED" : "FAILED"}`,
    `- Lint: ${safetyGate.lint.passed ? "PASSED" : "FAILED"}`,
    ""
  ];

  if (aiAuthoredTestFiles.length > 0) {
    lines.push(
      "## AI-Authored Tests - Needs Explicit Review",
      "The following test files were written by the pipeline and require",
      "separate reviewer attention beyond the general code review, since a",
      "test can trivially pass against the implementation it was written",
      "to satisfy:",
      ...aiAuthoredTestFiles.map((f) => `- ${f}`),
      ""
    );
  }

  lines.push(
    "**This pull request must be reviewed and merged by a human.** It is",
    "never merged automatically by this pipeline."
  );

  return lines.join("\n");
}
