import { TICKET_STATUSES } from "../jira/client.js";

/**
 * The only status transitions this pipeline is allowed to apply
 * automatically (spec: "Ticket status sync reflects pipeline stage"). There
 * is deliberately no "deployed_production" entry anywhere in this module -
 * production deployment requires a separate, explicit human action outside
 * this pipeline, and that is enforced by this list simply not containing
 * such a transition rather than by a runtime check that could be bypassed.
 */
export const AUTOMATIC_TRANSITIONS = Object.freeze([
  TICKET_STATUSES.PR_OPENED,
  TICKET_STATUSES.PR_MERGED,
  TICKET_STATUSES.DEPLOYED_STAGING
]);

/**
 * Applies one of the allowed automatic status transitions to a ticket.
 * Throws if asked for anything outside AUTOMATIC_TRANSITIONS, so a future
 * code change can't accidentally add a production-deploy transition here
 * without that being an explicit, visible change to this list.
 */
export async function syncTicketStatus(jiraClient, ticketId, transition) {
  if (!AUTOMATIC_TRANSITIONS.includes(transition)) {
    throw new Error(
      `Refusing to apply status transition "${transition}" - not in the pipeline's allowed automatic transitions`
    );
  }
  await jiraClient.updateTicketStatus(ticketId, transition);
}
