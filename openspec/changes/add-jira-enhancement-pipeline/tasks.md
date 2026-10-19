# Tasks

## 1. Jira Client Foundation (mock-backed, provider-agnostic)

- [x] 1.1 Define the Jira provider interface (`fetchEligibleTickets()`,
      `getTicketDetails()`, `updateTicketStatus()`) in `src/jira/client.js`
      and verify a unit test can swap in a mock implementation without
      changing calling code (mirrors `src/generator/model.js`)
- [x] 1.2 Create a dummy Jira fixture dataset
      (`test/fixtures/jira-tickets.sample.json`) containing at least: one
      ticket with clear acceptance criteria and a repository link, one with
      missing acceptance criteria, and one with no repository link, and
      verify it loads and parses in a unit test
- [x] 1.3 Implement a mock provider (`src/jira/mock-provider.js`) backed by
      that fixture, supporting `fetchEligibleTickets()`/`getTicketDetails()`/
      `updateTicketStatus()` against in-memory state, and verify a unit test
      confirms status updates are reflected on subsequent reads

## 2. Ticket Intake (`ticket-intake`)

- [x] 2.1 Implement eligible-ticket detection (automation-eligible label/
      status filter) and verify a unit test confirms an eligible ticket is
      picked up and an ineligible one is not (spec: "Eligible ticket
      detection")
- [x] 2.2 Implement structured extraction of title/description/acceptance
      criteria/linked docs, marking missing acceptance criteria as absent,
      and verify a unit test covers both present and absent cases (spec:
      "Structured ticket extraction")
- [x] 2.3 Implement repository resolution strictly from explicit ticket
      links, marking unresolved when none exist, and verify a unit test
      confirms no repository is inferred (spec: "Target repository
      resolution limited to explicit links")
- [x] 2.4 Document the `ticket-intake` module in `src/jira/README.md` and
      verify the documented example reproduces a sample extraction result

## 3. Change Planning (`change-planning`)

- [x] 3.1 Implement the approved-context precondition check (reuses
      `src/pipeline/rollout-status.js`'s context-status reading) and verify
      a unit test confirms planning refuses to proceed against a repository
      with no approved context (spec: "Planning requires an approved
      repository context")
- [x] 3.2 Implement the ambiguity check against extracted acceptance
      criteria and verify a unit test confirms a ticket with absent/vague
      criteria halts before any plan is produced (spec: "Ambiguity halts
      planning instead of guessing")
- [x] 3.3 Implement plan generation (provider-agnostic model call, reusing
      the pattern from `src/generator/model.js`) grounded in the approved
      context file and current scan, and verify a unit test confirms every
      planned file path stays within the resolved target repository (spec:
      "Plan scope is bounded to the ticket's linked repository")
- [x] 3.4 Document the `change-planning` module, including the mock-model
      demo path, in `src/planning/README.md`

## 4. Change Implementation (`change-implementation`)

- [x] 4.1 Implement branch creation and scoped file writing limited to the
      plan's listed files, and verify a unit test confirms a write attempt
      outside the plan's file list is rejected (spec: "Implementation stays
      within the approved plan's scope")
- [x] 4.2 Implement test-case generation/update alongside the code change
      and verify a unit test confirms at least one test file is produced
      for a plan describing a behavior change (spec: "Tests are written
      alongside the implementation")
- [x] 4.3 Implement the pre-PR safety gate (run the target repository's own
      test suite and lint) and verify a unit test confirms a failing gate
      blocks PR creation (spec: "Pre-PR safety gate")
- [x] 4.4 Implement AI-authored-test flagging for the eventual PR
      description and verify a unit test confirms modified/added test files
      are correctly identified (spec: "AI-authored tests require explicit
      human review")

## 5. Change Review Pipeline (`change-review-pipeline`)

- [ ] 5.1 Implement PR creation linking the ticket identifier, change
      summary, and safety-gate results, and verify a unit test confirms the
      PR body contains all three (spec: "Pull request links back to the
      originating ticket")
- [ ] 5.2 Confirm (via test, not just code inspection) that no code path in
      this capability calls a merge API, matching the existing
      `context-refresh-pipeline` guarantee (spec: "Never auto-merges")
- [ ] 5.3 Implement the clarifying-questions path triggered by a halted
      plan and verify a unit test confirms a ticket with insufficient
      acceptance criteria produces a questions draft instead of silence
      (spec: "Clarifying-questions path for halted planning")
- [ ] 5.4 Implement ticket status sync for PR-opened, PR-merged, and
      deployed-to-staging transitions against the mock provider, and verify
      a unit test confirms no status transition marks production-deployed
      automatically (spec: "Ticket status sync reflects pipeline stage")

## 6. End-to-End Demo Wiring

- [ ] 6.1 Build an end-to-end demo script (mirrors
      `scripts/demo-local-dry-run.mjs`) that runs intake -> planning ->
      implementation -> review against the mock Jira provider and this
      repository itself, and verify it produces a real local branch/diff
      without any live Jira or model credentials
- [ ] 6.2 Add a GitHub Actions workflow
      (`.github/workflows/jira-enhancement-pipeline.yml`) with
      `workflow_dispatch` only for now (no live Jira webhook yet), and
      verify a dry run produces a PR through the same mandatory-review path
      as `generate-context.yml`
- [ ] 6.3 Update `DEMO.md` with the new pipeline's demo steps and verify the
      documented commands match the actual npm scripts added

## Workflow follow-up

- Wire the real Jira provider once the user's Jira instance/credentials are
  connected, validating it against the same interface the mock provider
  implements before switching the default provider.
- Archive this change once the real-Jira validation step in the migration
  plan (design.md) has been completed and reviewed with stakeholders.
