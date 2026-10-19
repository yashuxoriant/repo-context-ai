import { runIntake } from "../jira/intake.js";
import { planChange } from "../planning/index.js";
import { implementChange } from "../implementation/index.js";
import { openReviewPullRequest, raiseClarifyingQuestions } from "../review/index.js";

/**
 * Runs the full Jira-to-PR pipeline for one ticket: intake -> planning ->
 * implementation -> review. Returns a discriminated `{ outcome, ... }`
 * result mirroring planChange()'s pattern, so callers (CLI, demo script,
 * CI workflow) can react without re-deriving why a ticket stopped where it
 * did. This module only orchestrates the four capabilities - it contains
 * no behavior of its own beyond sequencing and does not duplicate any of
 * their logic.
 */
export async function runJiraTicket({ ticket, repoRoot, callModel, jiraClient, prProvider }) {
  const { details, repoResolution } = runIntake(ticket);

  if (!repoResolution.resolved) {
    return { outcome: "unresolved_repository", reason: repoResolution.reason };
  }
  const repository = repoResolution.repository;

  const planResult = await planChange({ ticketDetails: details, repoRoot, callModel });

  if (planResult.outcome === "not_eligible") {
    return { outcome: "not_eligible", reason: planResult.reason };
  }

  if (planResult.outcome === "needs_clarification") {
    const clarification = await raiseClarifyingQuestions({
      ticketId: ticket.id,
      reason: planResult.reason,
      repository,
      prProvider,
      jiraClient
    });
    return { outcome: "needs_clarification", ...clarification };
  }

  const implementationResult = await implementChange({
    plan: planResult.plan,
    repoRoot,
    callModel,
    branchName: `feature/${ticket.id.toLowerCase()}`
  });

  if (!implementationResult.readyForReview) {
    return { outcome: "safety_gate_failed", implementationResult };
  }

  const pr = await openReviewPullRequest({
    ticketId: ticket.id,
    planApproach: planResult.plan.approach,
    implementationResult,
    repository,
    prProvider,
    jiraClient
  });

  return { outcome: "pr_opened", pr, implementationResult };
}
