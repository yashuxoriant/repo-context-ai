# Design

## Context

See `proposal.md` for motivation. Assumes the target repository already has
an APPROVED context file - this pipeline refuses to run on one that
doesn't. No real Jira instance is connected yet, so this introduces a
provider-agnostic Jira client (mirroring the existing model-provider
pattern) with a mock/fixture-backed provider for demos. The four governance
questions from proposal review are resolved below as firm decisions.

## Goals / Non-Goals

**Goals:**
- Turn an eligible, well-specified ticket into a reviewed PR without a
  human writing the first draft of code or tests.
- Make every step auditable and stoppable: ambiguous tickets halt visibly
  instead of a guessed implementation.
- Reuse existing trust patterns (never auto-merge, draft-vs-approved,
  provider-agnostic integrations) rather than inventing new ones.

**Non-Goals:**
- Fully automated production deployment - staging deploy on merge is in
  scope, production is not.
- Cross-repository change orchestration - a future Dependency Graph
  capability, not this one.
- Autonomous resolution of ambiguous requirements - the system asks, it
  does not guess.

## Decisions

- **Deployment: staging auto-deploy, production stays a separate gate.**
  Production always needs a separate, human-triggered approval - the
  single highest-risk shortcut available, so it is never automatic.
- **Ambiguity: halt and ask, never guess.** Insufficient acceptance criteria
  route to a clarifying-questions path instead of a flagged assumption - a
  baked-in guess is more likely to be rubber-stamped than a question is to
  be ignored.
- **Repository scope: explicit links only**, never inferred - cross-repo
  inference is the future Dependency Graph's job, not this pipeline's.
- **AI-authored tests get explicit, separate review attention**, flagged in
  the PR - a test can trivially pass against the code written to satisfy
  it.
- **Jira: provider-agnostic client with a mock/demo provider now**, real
  provider wired once credentials exist - specs don't depend on which Jira
  instance is behind the interface.

## Risks / Trade-offs

- *AI-generated code could be subtly wrong despite its own tests passing* ->
  safety gate also runs the repo's existing test suite; AI tests flagged
  for separate review.
- *Ambiguity detection could be too strict or lenient* -> biased toward
  halting, since a false halt costs a question, a false proceed costs a
  wrong implementation.
- *Ticket status could drift from real PR/deployment state* -> each
  transition ties to an observable event, reconcilable by re-checking it.
- *Mock Jira provider could diverge from real Jira's shape* -> interface
  stays minimal; real provider validated against it before replacing mock.

## Migration Plan

1. Build all four capabilities against the mock provider and a sandbox
   repo, demoable end-to-end.
2. Validate 1-2 real tickets once Jira is connected, with close human
   review of every step.
3. Expand to a small set of eligible ticket types (e.g., scoped bug fixes)
   before general feature work.

**Rollback:** remove the trigger/webhook config - the pipeline owns no
state beyond PRs and ticket status, both normal, reviewable artifacts.

## Open Questions

- Real Jira connection details (API vs MCP, auth, field names) - deferred
  until connected; no spec impact.
