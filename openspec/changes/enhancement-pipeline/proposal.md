# Proposal

## Why

Once a repository has accurate, AI-maintained context (from the
context-generation pipeline), the natural next step is using that context to
safely automate real feature work - not just documentation. Today an
engineer still manually reads a Jira ticket, re-derives the repo's
architecture, writes the code and tests, and opens a PR. This proposal adds
a pipeline that drafts that implementation automatically from an already-
approved context file, under the same mandatory-human-review discipline
already established for context files.

This is a later-phase capability: it only runs against a repository that
already has an APPROVED context file.

## What Changes

- **Intake**: detect a new/updated Jira story assigned to this pipeline
  (exact integration finalized once the real Jira instance is connected).
- **Understand**: extract the story's description, acceptance criteria, and
  linked docs needed to scope the change.
- **Plan**: draft an implementation plan grounded in the target repo's
  APPROVED context file and its current code state.
- **Implement**: write the code change on a feature branch, strictly scoped
  to the plan.
- **Test**: write/update test cases for the change, then run the repo's own
  test suite and lint as a pre-PR safety gate.
- **Review**: open a PR linking back to the originating ticket, with a
  summary and safety-gate results - never auto-merged.
- **Sync**: update the Jira ticket's status as the PR opens, merges, and
  (optionally) deploys.
- **Explicitly out of scope:** fully automated production deployment.
  Staging deployment may be included; production always needs a separate,
  explicit human approval.

## Capabilities

### New Capabilities
- `ticket-intake`: Detects and reads an eligible Jira story and determines
  the target repository from explicit ticket links only.
- `change-planning`: Produces a grounded implementation plan using only the
  approved context file and current scan as input - refuses to proceed when
  acceptance criteria are too ambiguous to scope safely.
- `change-implementation`: Writes the code and tests on a feature branch,
  strictly within the plan's scope, and runs the safety gate before any PR.
- `change-review-pipeline`: Opens the PR, never auto-merges, and syncs
  status back to Jira (opened -> merged -> deployed-to-staging).

### Modified Capabilities
(none - depends on `repo-scanner`/`context-generator` as read-only inputs,
not modifications)

## Impact

- Depends on `add-codebase-context-generation` and a target repo having
  already completed the full approve cycle.
- Needs Jira API/MCP access (read stories, write ticket status) - scope and
  auth finalized once the real Jira instance is connected.
- Needs repository write access (branch/PR creation) scoped the same as the
  context pipeline - no new, broader access model.
- Materially higher risk than context-generation, since this writes
  executable code. Governance decisions below are resolved, not left open,
  before implementation begins.
