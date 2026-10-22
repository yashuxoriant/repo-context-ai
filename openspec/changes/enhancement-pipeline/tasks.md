# Tasks

## 1. Jira Client Foundation (mock-backed, provider-agnostic)

- [x] 1.1 Define the Jira provider interface (`fetchEligibleTickets()`,
      `getTicketDetails()`, `updateTicketStatus()`) in `src/jira/client.js`
- [x] 1.2 Create a dummy Jira fixture dataset covering: a clear ticket, one
      with missing acceptance criteria, and one with no repository link
- [x] 1.3 Implement a mock provider backed by that fixture, with status
      updates reflected on subsequent reads

## 2. Ticket Intake (`ticket-intake`)

- [x] 2.1 Detect eligible tickets via label/status filter (spec: "Eligible
      ticket detection")
- [x] 2.2 Extract title/description/acceptance criteria/linked docs,
      marking missing criteria as absent (spec: "Structured ticket
      extraction")
- [x] 2.3 Resolve target repository strictly from explicit ticket links,
      never inferred (spec: "Target repository resolution limited to
      explicit links")
- [x] 2.4 Document the module in `src/jira/README.md`

## 3. Change Planning (`change-planning`)

- [x] 3.1 Require an approved repository context before planning proceeds
      (spec: "Planning requires an approved repository context")
- [x] 3.2 Halt on ambiguous/absent acceptance criteria before producing any
      plan (spec: "Ambiguity halts planning instead of guessing")
- [x] 3.3 Generate a plan grounded in the approved context and current
      scan, bounded to the resolved repository (spec: "Plan scope is
      bounded to the ticket's linked repository")
- [x] 3.4 Document the module, including the mock-model demo path

## 4. Change Implementation (`change-implementation`)

- [x] 4.1 Create a branch and write only the plan's listed files, rejecting
      any out-of-scope write (spec: "Implementation stays within the
      approved plan's scope")
- [x] 4.2 Generate/update test cases alongside the code change (spec:
      "Tests are written alongside the implementation")
- [x] 4.3 Run the target repo's own test suite and lint as a pre-PR safety
      gate that blocks PR creation on failure (spec: "Pre-PR safety gate")
- [x] 4.4 Flag AI-authored test files for the PR description (spec:
      "AI-authored tests require explicit human review")

## 5. Change Review Pipeline (`change-review-pipeline`)

- [x] 5.1 Open a PR linking the ticket ID, change summary, and safety-gate
      results (spec: "Pull request links back to the originating ticket")
- [x] 5.2 Confirm, via test, that no code path calls a merge API (spec:
      "Never auto-merges")
- [x] 5.3 Produce a clarifying-questions draft when planning halted, instead
      of silence (spec: "Clarifying-questions path for halted planning")
- [x] 5.4 Sync ticket status for PR-opened/merged/deployed-to-staging, with
      no automatic production-deployed transition (spec: "Ticket status
      sync reflects pipeline stage")

## 6. End-to-End Demo Wiring

- [x] 6.1 Build a local end-to-end demo (intake -> planning ->
      implementation -> review) against the mock Jira provider, producing a
      real local branch/diff with no live credentials
- [x] 6.2 Add a GitHub Actions workflow (`workflow_dispatch` only, no live
      Jira webhook yet) that opens a real PR through the same
      mandatory-review path as the context pipeline
- [x] 6.3 Update `DEMO.md` with this pipeline's demo steps

## Workflow follow-up

- Wire the real Jira provider once the user's instance/credentials are
  connected, validating it against the mock provider's interface first.
- Archive this change once real-Jira validation (see design.md's migration
  plan) is complete and reviewed with stakeholders.
