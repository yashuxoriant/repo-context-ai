# `jira` module (ticket-intake capability + Jira client foundation)

Provider-agnostic Jira client plus the `ticket-intake` capability. See
`openspec/changes/add-jira-enhancement-pipeline/specs/ticket-intake/spec.md`
for the full behavior contract.

**No real Jira instance is connected yet.** Everything here runs against a
mock provider backed by `test/fixtures/jira-tickets.sample.json` - the
architecture is real and tested, only the data source is a stand-in.

## Usage

```js
import { createJiraClient } from "./client.js";
import { createMockJiraProvider } from "./mock-provider.js";
import { runIntake, filterEligibleTickets } from "./intake.js";

const provider = await createMockJiraProvider("./test/fixtures/jira-tickets.sample.json");
const client = createJiraClient(provider);

const eligible = await client.fetchEligibleTickets();
for (const ticket of eligible) {
  const { details, repoResolution } = runIntake(ticket);
  if (!repoResolution.resolved) {
    console.log(`${ticket.id}: no repository linked, skipping`);
    continue;
  }
  console.log(`${ticket.id} -> ${repoResolution.repository}`, details);
}
```

## Files

- **`client.js`** - the provider interface (`fetchEligibleTickets`,
  `getTicketDetails`, `updateTicketStatus`) and `TICKET_STATUSES` constants.
  Mirrors `src/generator/model.js`'s swap-the-provider pattern.
- **`mock-provider.js`** - in-memory provider backed by the fixture file.
  Status updates mutate in-memory history only; nothing persists back to
  the fixture.
- **`intake.js`** - `ticket-intake` capability: eligibility filtering,
  structured field extraction (acceptance criteria marked *absent*, never
  inferred, when not populated), and repository resolution strictly from
  explicit ticket links.

## Swapping in a real Jira provider later

Implement the same three methods against the real Jira REST API or MCP
integration, validate it against the fixture-driven tests in
`test/jira/client.test.js` first, then pass it to `createJiraClient()`
instead of `createMockJiraProvider()`. No other module needs to change.
