import { buildPrDescription } from "./pr-description.js";
import { raiseClarifyingQuestions } from "./clarifying-questions.js";
import { syncTicketStatus, AUTOMATIC_TRANSITIONS } from "./status-sync.js";
import { TICKET_STATUSES } from "../jira/client.js";

/**
 * Runs the change-review-pipeline capability for a completed
 * implementation: opens a pull request (never merges it) and syncs ticket
 * status. Only called when implementation succeeded; the
 * needs-clarification path is handled separately via
 * raiseClarifyingQuestions() when change-planning halted earlier.
 */
export async function openReviewPullRequest({
  ticketId,
  planApproach,
  implementationResult,
  repository,
  prProvider,
  jiraClient
}) {
  if (!implementationResult.readyForReview) {
    throw new Error(
      `Refusing to open a pull request: safety gate did not pass for ${ticketId}`
    );
  }

  const body = buildPrDescription({
    ticketId,
    approach: planApproach,
    safetyGate: implementationResult.safetyGate,
    aiAuthoredTestFiles: implementationResult.aiAuthoredTestFiles
  });

  const pr = await prProvider.openPullRequest({
    repository,
    branchName: implementationResult.branchName,
    title: `${ticketId}: automated implementation`,
    body
  });

  await syncTicketStatus(jiraClient, ticketId, TICKET_STATUSES.PR_OPENED);

  return pr;
}

export { buildPrDescription, raiseClarifyingQuestions, syncTicketStatus, AUTOMATIC_TRANSITIONS };
export { createMockPrProvider } from "./pr-provider.js";
export { buildClarifyingQuestions } from "./clarifying-questions.js";
