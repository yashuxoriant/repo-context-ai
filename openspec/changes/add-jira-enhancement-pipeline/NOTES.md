# Status Note (read this before writing specs/design/tasks)

This change is **intentionally paused after `proposal.md`**. It is not stuck
or incomplete by accident - `openspec validate` will show it failing because
no specs exist yet, and that is expected until the items below are resolved.

## Why specs aren't written yet

Writing `specs/` now would mean guessing at behavior contracts for decisions
that materially change what "correct" looks like. Per the proposal's own
"Impact" section, this capability is higher-risk than context generation
(it writes executable code, not documentation), so these should be answered
deliberately rather than assumed:

1. **How far does automated deployment go?**
   Working assumption so far: PR merge may auto-deploy to a lower/staging
   environment; production deployment requires a separate, explicit human
   approval gate - not a side effect of PR merge. Needs confirmation.

2. **What happens when a ticket is ambiguous or underspecified?**
   Needs a defined "stop and ask" path (e.g., open a draft PR with
   clarifying questions) rather than guessing and shipping something wrong.

3. **Scope boundaries per ticket** - does the pipeline only touch
   repositories explicitly linked to the ticket, or can it decide others are
   affected? (This likely depends on the future Dependency Graph capability
   from the original foundation proposal, not something to improvise here.)

4. **Test-generation trust level** - tests the AI writes for its own
   implementation need a second check (e.g., mutation testing, mandatory
   human test review) so it can't write a test that trivially passes its
   own code.

5. **Real integration details** - the actual Jira instance/API shape and the
   target repository's real CI/CD setup, which the user is connecting next.

## What to do when ready

Once (1)-(5) above are answered and a real repository/Jira connection is
available:

1. Revisit `proposal.md`'s Capabilities section - confirm
   `ticket-intake`, `change-planning`, `change-implementation`, and
   `change-review-pipeline` are still the right boundaries given the real
   integration details.
2. Write `specs/<capability>/spec.md` for each, now groundable in real
   constraints instead of assumptions.
3. Write `design.md`, including the answers to (1)-(4) as settled
   **Decisions**, not **Open Questions** (per this project's own
   instructions-file rule: a question that would change specs/approach
   should be resolved before writing, not deferred).
4. Write `tasks.md`.

Run `openspec status --change add-jira-enhancement-pipeline` at any time to
see current progress against this plan.
