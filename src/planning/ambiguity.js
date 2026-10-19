/**
 * Evaluates whether a ticket's extracted acceptance criteria are sufficient
 * to scope a change unambiguously. Deliberately simple and conservative:
 * when in doubt, halt rather than guess (design.md - "Ambiguity handling:
 * halt and ask, never guess").
 */
export function assessAmbiguity(ticketDetails) {
  const { acceptanceCriteria } = ticketDetails;

  if (!acceptanceCriteria || acceptanceCriteria.length === 0) {
    return {
      ambiguous: true,
      reason: "No acceptance criteria present on the ticket"
    };
  }

  // Minimal, conservative heuristic for "too vague": every stated criterion
  // should be concrete enough to be checkable (long enough to likely
  // describe an observable behavior, not just a vague wish). This is
  // intentionally simple for the demo/mock phase - a real implementation
  // may hand this judgment to the planning model itself, but the pipeline's
  // behavior (halt vs proceed) is what the spec actually constrains.
  const tooVague = acceptanceCriteria.some((criterion) => criterion.trim().length < 20);
  if (tooVague) {
    return {
      ambiguous: true,
      reason: "At least one acceptance criterion is too vague to scope a change unambiguously"
    };
  }

  return { ambiguous: false };
}
