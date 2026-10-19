import { readFile } from "node:fs/promises";

/**
 * In-memory Jira provider backed by a fixture file - for demos and tests,
 * never a real Jira instance (design.md - "Jira integration: provider-
 * agnostic client with a mock/demo provider"). Status updates mutate
 * in-memory state only; nothing is persisted back to the fixture file.
 */
export async function createMockJiraProvider(fixturePath) {
  const raw = await readFile(fixturePath, "utf8");
  const { tickets } = JSON.parse(raw);

  // Keyed by ticket id for O(1) lookup/update; status updates are appended
  // to a per-ticket history so callers/tests can inspect the full sequence,
  // not just the latest value.
  const statusHistory = new Map(tickets.map((t) => [t.id, [t.status]]));

  return {
    async fetchEligibleTickets() {
      return tickets.filter((t) => t.automationEligible === true);
    },

    async getTicketDetails(ticketId) {
      const ticket = tickets.find((t) => t.id === ticketId);
      if (!ticket) {
        throw new Error(`Unknown ticket: ${ticketId}`);
      }
      return { ...ticket };
    },

    async updateTicketStatus(ticketId, status) {
      if (!statusHistory.has(ticketId)) {
        throw new Error(`Unknown ticket: ${ticketId}`);
      }
      statusHistory.get(ticketId).push(status);
    },

    /** Test/demo helper - not part of the provider interface itself. */
    _getStatusHistory(ticketId) {
      return [...(statusHistory.get(ticketId) ?? [])];
    }
  };
}
