/**
 * ticket-intake capability: eligible-ticket detection, structured
 * extraction, and repository resolution - strictly from what the ticket
 * explicitly states, never inferred (spec: ticket-intake).
 */

/**
 * Filters a list of tickets down to those eligible for this pipeline. The
 * mock/real provider already filters via fetchEligibleTickets(), but this
 * is exposed separately so callers working from a raw ticket list (e.g.
 * webhook payloads) can apply the same rule (spec: "Eligible ticket
 * detection").
 */
export function filterEligibleTickets(tickets) {
  return tickets.filter((t) => t.automationEligible === true);
}

/**
 * Extracts the structured fields intake cares about from a raw ticket,
 * marking acceptance criteria as absent (not inferred from description)
 * when none are populated (spec: "Structured ticket extraction").
 */
export function extractTicketDetails(ticket) {
  const hasAcceptanceCriteria = Array.isArray(ticket.acceptanceCriteria) && ticket.acceptanceCriteria.length > 0;

  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    acceptanceCriteria: hasAcceptanceCriteria ? ticket.acceptanceCriteria : null,
    linkedDocs: ticket.linkedDocs ?? []
  };
}

/**
 * Resolves the target repository strictly from the ticket's explicit
 * repository-link field. Returns { resolved: false } rather than guessing
 * when no link is present (spec: "Target repository resolution limited to
 * explicit links").
 */
export function resolveTargetRepository(ticket) {
  if (!ticket.repositoryLink) {
    return { resolved: false, reason: "No repository explicitly linked on the ticket" };
  }
  return { resolved: true, repository: ticket.repositoryLink };
}

/**
 * Runs the full intake pipeline for one ticket: extraction + repository
 * resolution. Does not call planning - that is a separate capability.
 */
export function runIntake(ticket) {
  const details = extractTicketDetails(ticket);
  const repoResolution = resolveTargetRepository(ticket);

  return { details, repoResolution };
}
