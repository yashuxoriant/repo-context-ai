import { checkApprovedContext } from "./precondition.js";
import { assessAmbiguity } from "./ambiguity.js";
import { generatePlan } from "./plan.js";

/**
 * Runs the full change-planning capability for one ticket: approved-context
 * precondition -> ambiguity check -> plan generation. Returns a discriminated
 * result so callers (change-review-pipeline) know exactly which path to
 * take without re-deriving the reason.
 */
export async function planChange({ ticketDetails, repoRoot, callModel, outputPaths }) {
  const precondition = await checkApprovedContext(repoRoot);
  if (!precondition.eligible) {
    return { outcome: "not_eligible", reason: precondition.reason };
  }

  const ambiguity = assessAmbiguity(ticketDetails);
  if (ambiguity.ambiguous) {
    return { outcome: "needs_clarification", reason: ambiguity.reason };
  }

  const plan = await generatePlan({ ticketDetails, repoRoot, callModel, outputPaths });
  return { outcome: "planned", plan };
}

export { checkApprovedContext, assessAmbiguity, generatePlan };
export { renderPlanningPrompt, validatePlanScope } from "./plan.js";
