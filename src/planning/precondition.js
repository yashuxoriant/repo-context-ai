import { readRepositoryContextStatus } from "../pipeline/rollout-status.js";

/**
 * Checks the planning precondition: the target repository must have an
 * APPROVED context file (reuses the same status reader the rollout
 * dashboard uses) before any plan is produced (spec: "Planning requires an
 * approved repository context").
 */
export async function checkApprovedContext(repoRoot) {
  const { status } = await readRepositoryContextStatus(repoRoot);

  if (status !== "approved") {
    return {
      eligible: false,
      reason:
        status === "not_started"
          ? "Repository has no context file yet - not eligible for automated change planning"
          : "Repository context file is still DRAFT, pending review - not eligible until approved"
    };
  }

  return { eligible: true };
}
