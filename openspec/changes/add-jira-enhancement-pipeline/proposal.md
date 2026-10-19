# Proposal

## Why

Once a repository has accurate, AI-maintained context (`repo-scanner` +
`context-generator`), the natural next step is using that context to safely
automate real feature/enhancement work - not just documentation. Today, an
engineer still manually reads a Jira ticket, re-derives the repo's
architecture from scratch, writes the code, writes tests, and opens a PR.
This proposal adds a pipeline that uses the already-approved repository
context to draft that implementation automatically, while keeping every
code change under the same mandatory-human-review discipline already
established for context files.

This is explicitly a later-phase capability: it depends on a target
repository already having an APPROVED context file, and is not meant to run
against a repository that hasn't been onboarded yet.

## What Changes

- Add a Jira intake mechanism that detects a new or updated story assigned
  to this pipeline (via Jira API/MCP - exact integration to be finalized
  once the target Jira instance and repository are connected).
- Add a ticket-understanding step that extracts the story's description,
  acceptance criteria, and any linked documentation needed to scope the
  change.
- Add a planning step that drafts an implementation plan grounded in the
  target repository's APPROVED context file and current codebase state
  (reusing `repo-scanner` to re-scan current state, not just the last
  approved snapshot).
- Add an implementation step that writes the code change on a feature
  branch, strictly scoped to the plan from the previous step.
- Add a test-generation step that writes or updates test cases covering the
  change, and runs the repository's existing test suite and lint as a
  pre-PR safety gate.
- Add a pull-request step that opens a PR linking back to the originating
  Jira ticket, summarizing the change and including test results - never
  auto-merged, mirroring the context-refresh-pipeline's existing guarantee.
- Add a status-sync step that updates the Jira ticket once the PR is opened,
  and again once it is merged/deployed.
- **Explicitly out of scope for this proposal (see Design - Non-Goals):**
  fully automated production deployment. Deployment automation up to a
  lower/staging environment may be included; production deployment requires
  a separate, explicit human approval gate, not a side effect of PR merge.

## Capabilities

### New Capabilities
- `ticket-intake`: Detects and reads an eligible Jira story (description,
  acceptance criteria, linked docs) and determines the target repository/
  repositories it applies to.
- `change-planning`: Produces a grounded implementation plan for a ticket,
  using the target repository's approved context file and current scanned
  state as its only inputs - explicitly refusing to proceed when acceptance
  criteria are too ambiguous to scope safely.
- `change-implementation`: Writes the code change and corresponding tests on
  a feature branch strictly within the boundaries of the approved plan, and
  runs the existing test suite/lint as a safety gate before any PR is opened.
- `change-review-pipeline`: Opens a pull request linking the ticket to the
  change, never auto-merges, and syncs status back to Jira as the PR
  progresses (opened -> merged -> deployed-to-staging).

### Modified Capabilities
(none yet - depends on `repo-scanner` and `context-generator` from
`add-codebase-context-generation` as read-only dependencies, not
modifications to their behavior)

## Impact

- Depends on `add-codebase-context-generation` being implemented AND a
  target repository having gone through the full approve cycle (a repo with
  no approved context file is not a valid target for this pipeline yet).
- Requires Jira API/MCP access with read access to stories and write access
  to update ticket status - scope and auth model to be finalized once the
  real Jira instance is connected.
- Requires repository write access (branch creation, PR creation) scoped to
  the same identity/permission model already used by
  `context-refresh-pipeline` - no new, broader access model.
- Introduces materially higher risk than the context-generation pipeline,
  since this capability writes executable code rather than documentation.
  Several governance decisions are deliberately left open below rather than
  guessed, and must be resolved before implementation begins (see Design -
  Open Questions).
