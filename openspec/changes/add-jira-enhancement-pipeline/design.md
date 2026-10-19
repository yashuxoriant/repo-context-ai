# Design

## Context

See `proposal.md` - Why / What Changes for motivation. This design assumes:
- A target repository already has an APPROVED context file from
  `add-codebase-context-generation` - this pipeline refuses to operate on a
  repository that doesn't.
- No real Jira instance is connected yet. This design introduces a
  provider-agnostic Jira client (mirroring the model-provider pattern from
  `context-generator`) with a mock/fixture-backed provider for demos, so the
  architecture is real and testable before real credentials exist.
- The four governance questions raised during proposal review are now
  resolved (see Decisions below) rather than left open.

## Goals / Non-Goals

**Goals:**
- Turn an eligible, well-specified Jira ticket into a reviewed pull request
  without a human writing the first draft of the code or tests.
- Make every step auditable and stoppable: ambiguous tickets halt visibly
  instead of producing a guessed implementation.
- Reuse the existing trust patterns (never auto-merge, draft-vs-approved,
  provider-agnostic external integrations) rather than inventing new ones.

**Non-Goals:**
- Fully automated production deployment - explicitly out of scope; staging
  deployment on merge is in scope, production is not.
- Cross-repository change orchestration - a ticket's plan is bounded to its
  explicitly linked repository; multi-repository impact is deferred to the
  future Dependency Graph capability referenced in the original foundation
  proposal.
- Autonomous resolution of ambiguous requirements - the system asks, it does
  not guess.

## Decisions

### Deployment scope: staging auto-deploy, production stays a separate gate
On PR merge, the pipeline may trigger deployment to a lower/staging
environment as part of its normal flow. Production deployment is explicitly
excluded from this pipeline's automatic behavior and requires a separate,
human-triggered approval outside of it.
- **Alternative considered**: fully automatic production deployment on
  merge. Rejected - this is the single highest-risk design choice available,
  and nothing about the proposal's reuse of the "never auto-merge" principle
  justifies skipping an equivalent gate for production release.

### Ambiguity handling: halt and ask, never guess
`change-planning` evaluates whether acceptance criteria are sufficient
before producing a plan. If not, the ticket is routed to
`change-review-pipeline`'s clarifying-questions path instead of continuing.
- **Alternative considered**: let the implementation step make a reasonable
  assumption and flag it in the PR description. Rejected - an assumption
  baked into working code is far more likely to be rubber-stamped by a
  reviewer than an explicit question is to be ignored.

### Repository scope: explicit links only, no inferred cross-repo changes
`ticket-intake` resolves target repositories only from explicit ticket
fields/links. `change-planning` then scopes exclusively to that resolution.
- **Alternative considered**: let planning infer other repositories it
  judges to be affected. Rejected for this phase - that is precisely the
  problem the future Dependency Graph capability is meant to solve properly
  (with real ownership/dependency data), not something to improvise here.

### Test trust: AI-authored tests get explicit, separate review attention
`change-implementation` must flag which test files it authored/modified in
the PR description, distinct from the general code review.
- **Alternative considered**: treat passing tests as sufficient trust signal
  on their own. Rejected - a test can trivially pass against the
  implementation that was written to satisfy it; a human needs to look at
  the test's actual assertions, not just its pass/fail result.

### Jira integration: provider-agnostic client with a mock/demo provider
Mirrors `context-generator`'s `model.js` pattern: a small interface
(`fetchEligibleTickets()`, `updateTicketStatus()`, etc.) with a real
provider (Jira REST API/MCP, to be wired once credentials exist) and a
mock provider backed by a local fixture file for demos and tests.
- **Alternative considered**: wait until real Jira credentials exist before
  writing any code. Rejected - the architecture, validation, and safety
  gates are all independent of which Jira instance is behind the interface,
  and building against a mock now lets the whole pipeline be demoed and
  tested today.

## Risks / Trade-offs

- [AI-generated code could be subtly wrong despite passing tests it also
  wrote] → Mitigation: pre-PR safety gate runs the repository's *existing*
  test suite (not just new tests), and AI-authored tests are explicitly
  flagged for separate reviewer attention.
- [Ambiguity detection itself could be wrong - either too strict (blocking
  valid tickets) or too lenient (proceeding on a bad assumption)] →
  Mitigation: when in doubt, the design biases toward halting and asking
  rather than guessing, since a false "halt" costs a clarifying question
  while a false "proceed" costs a wrong implementation.
- [Ticket status sync could drift from actual PR/deployment state if a step
  fails between updates] → Mitigation: each status transition is tied to an
  observable event (PR opened, PR merged, staging deploy completed) rather
  than pipeline-internal state, so it can be reconciled by re-checking those
  events.
- [Mock Jira provider could diverge from real Jira's actual data shape once
  connected] → Mitigation: the provider interface is intentionally minimal
  and the real provider implementation is expected to be validated against
  it before replacing the mock, same as `model.js`'s real-vs-mock providers
  today.

## Migration Plan

1. Build `ticket-intake`, `change-planning`, `change-implementation`, and
   `change-review-pipeline` against the mock Jira provider and a sandbox/
   fixture repository, so the full flow can be demoed end-to-end.
2. Validate against 1-2 real tickets in a real Jira instance once connected,
   with a human closely reviewing every step before trusting any part of it.
3. Expand to a small set of eligible ticket types (e.g., well-scoped bug
   fixes) before broadening to general feature work.

Rollback: disabling this pipeline is removing its trigger/webhook
configuration - it owns no state beyond pull requests and ticket status
updates, both of which remain normal, reviewable artifacts if the pipeline
is turned off.

## Open Questions

- Real Jira instance connection details (API vs MCP, auth model, custom
  field names for acceptance criteria/repository links) - genuinely
  deferred until the user's Jira instance is connected; does not change the
  specs or capability boundaries above, only the real provider's
  implementation.
