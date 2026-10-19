/**
 * Builds specific clarifying questions from the reason change-planning
 * halted on, so the pipeline surfaces a concrete ask rather than a generic
 * "please clarify" (spec: "Clarifying-questions path for halted planning").
 */
export function buildClarifyingQuestions(reason) {
  if (/no acceptance criteria/i.test(reason)) {
    return [
      "This ticket has no acceptance criteria. What specific, checkable behavior should this change produce?",
      "How would a reviewer verify this change is complete and correct?"
    ];
  }
  if (/too vague/i.test(reason)) {
    return [
      "One or more acceptance criteria are too vague to scope a change safely. Could you restate them as specific, checkable conditions (e.g. \"WHEN X THEN Y\")?"
    ];
  }
  return [`Planning could not proceed: ${reason}. Could you provide more detail?`];
}

/**
 * Surfaces clarifying questions for a halted ticket: opens a draft pull
 * request containing the questions and updates the ticket status to
 * needs_clarification - never silently drops the ticket (spec: "Ambiguous
 * ticket produces a questions draft").
 */
export async function raiseClarifyingQuestions({ ticketId, reason, repository, prProvider, jiraClient }) {
  const questions = buildClarifyingQuestions(reason);

  const body = [
    `Automated planning for ${ticketId} could not proceed without more detail.`,
    "",
    "## Questions",
    ...questions.map((q) => `- ${q}`)
  ].join("\n");

  const pr = await prProvider.openPullRequest({
    repository,
    branchName: `questions/${ticketId.toLowerCase()}`,
    title: `[Needs clarification] ${ticketId}`,
    body
  });

  await jiraClient.updateTicketStatus(ticketId, "needs_clarification");

  return { questions, pr };
}
