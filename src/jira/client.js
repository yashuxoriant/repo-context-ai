/**
 * Provider-agnostic Jira client interface, mirroring the
 * provider-swap pattern already used for the AI model in
 * src/generator/model.js. A provider is any object implementing:
 *   - fetchEligibleTickets(): Promise<Ticket[]>
 *   - getTicketDetails(ticketId): Promise<TicketDetails>
 *   - updateTicketStatus(ticketId, status): Promise<void>
 *
 * No real Jira provider exists yet (design.md - "Jira integration:
 * provider-agnostic client with a mock/demo provider"). This module only
 * documents/re-exports the shape; src/jira/mock-provider.js is the first
 * concrete implementation.
 */

/** Recognized pipeline-facing ticket statuses (design.md - ticket status sync). */
export const TICKET_STATUSES = Object.freeze({
  PR_OPENED: "pr_opened",
  PR_MERGED: "pr_merged",
  DEPLOYED_STAGING: "deployed_staging",
  NEEDS_CLARIFICATION: "needs_clarification"
});

/**
 * Thin pass-through used by calling code so the provider is always invoked
 * through one narrow surface - makes it trivial to swap the mock for a real
 * provider later without touching ticket-intake/change-planning/etc.
 */
export function createJiraClient(provider) {
  return {
    fetchEligibleTickets: () => provider.fetchEligibleTickets(),
    getTicketDetails: (ticketId) => provider.getTicketDetails(ticketId),
    updateTicketStatus: (ticketId, status) => provider.updateTicketStatus(ticketId, status)
  };
}
