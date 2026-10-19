# `planning` module (change-planning capability)

Produces a grounded implementation plan for a ticket, using the target
repository's APPROVED context file and current scanned state as its only
inputs. Refuses to proceed on an unapproved repository or an ambiguous
ticket rather than guessing. See
`openspec/changes/add-jira-enhancement-pipeline/specs/change-planning/spec.md`
for the full behavior contract.

## Usage

```js
import { planChange } from "./index.js";
import { createOpenAiCompatibleProvider } from "../generator/model.js";

const callModel = createOpenAiCompatibleProvider({ endpoint, apiKey, model });

const result = await planChange({
  ticketDetails, // from src/jira/intake.js's extractTicketDetails()
  repoRoot: "/path/to/repo",
  callModel
});

switch (result.outcome) {
  case "not_eligible":       // repo has no APPROVED context yet
  case "needs_clarification": // ticket's acceptance criteria are absent/vague
  case "planned":             // result.plan = { approach, files }
}
```

## Pipeline

1. **`precondition.js`** - `checkApprovedContext()` reuses
   `src/pipeline/rollout-status.js`'s status reader; refuses to plan
   against a repository with no context file or only a DRAFT one.
2. **`ambiguity.js`** - `assessAmbiguity()` halts before any plan is
   produced when acceptance criteria are absent or too vague to scope a
   change unambiguously. The model is never called for an ambiguous ticket.
3. **`plan.js`** - `generatePlan()` renders a prompt grounded in the
   approved context file + a fresh repo scan, calls the (provider-agnostic)
   model, parses its JSON response, and rejects any plan whose file list
   includes an absolute path or a path escaping the repository
   (`validatePlanScope()`).

`planChange()` in `index.js` runs all three in order and returns a
discriminated `{ outcome, ... }` result so `change-review-pipeline` can
react appropriately (open a PR, or open a clarifying-questions draft)
without re-deriving why planning stopped.
