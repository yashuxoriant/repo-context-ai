# repo-context-ai

Automated repository context (Skill/context file) generation **and** an
AI-driven Jira-to-pull-request enhancement pipeline, both built using
[OpenSpec](https://github.com/Fission-AI/OpenSpec) spec-driven development.
See `openspec/changes/` for the full proposal, specs, design, and task list
each capability follows.

## What this does

**Phase 1 - Context Generation:** for a target repository, generates a
standardized context file (`CONTEXT.md`, mirrored to
`.github/copilot-instructions.md`) covering architecture, setup, conventions,
dependencies, gotchas, and ownership - grounded only in scanned evidence,
never invented.

**Phase 2 - Jira Enhancement Pipeline:** once a repository has an APPROVED
context file, turns an eligible Jira ticket into a reviewed pull request -
intake, implementation planning grounded in that context, code + test
generation, a pre-PR safety gate (the repo's own tests/lint), and PR review.
Halts and asks clarifying questions on ambiguous tickets rather than
guessing. Never deploys to production automatically.

**Both phases share the same guarantee:** every change is a pull request;
nothing is ever auto-merged.

## Capabilities (see `openspec/changes/.../specs/`)

| Capability | Module | What it does |
|---|---|---|
| `repo-scanner` | `src/scanner/` | Extracts structure, manifests, CI config, README, git history; redacts secrets |
| `context-generator` | `src/generator/` | Generates the fixed-schema context file from scan output; stamps draft status |
| `context-refresh-pipeline` | `src/pipeline/`, `.github/workflows/` | Detects significant changes, opens review PRs, handles approval transition |
| `ticket-intake` | `src/jira/` | Detects eligible tickets, extracts fields, resolves target repo from explicit links only |
| `change-planning` | `src/planning/` | Drafts an implementation plan grounded in approved context; halts on ambiguity |
| `change-implementation` | `src/implementation/` | Writes code + tests scoped strictly to the plan; runs the repo's safety gate |
| `change-review-pipeline` | `src/review/` | Opens the PR, syncs ticket status, never merges, raises clarifying questions |

## Getting started

```bash
npm install
npm test        # 109 tests across scanner, generator, pipeline, jira, planning, implementation, review
npm run lint
```

To generate a context file for a local repository checkout:

```bash
TARGET_REPO_PATH=/path/to/repo \
MODEL_ENDPOINT=https://your-endpoint \
MODEL_API_KEY=your-key \
npm run generate
```

### No-credentials demos

```bash
npm run demo        # Phase 1: context generation, run twice to see the no-op diff-skip
npm run demo:jira    # Phase 2: Jira-to-PR pipeline against 3 fixture ticket scenarios
```

`npm run demo` runs the full pipeline (scan -> generate -> validate -> stamp
-> write) against this project itself using a mock model response - no API
key or GitHub remote required. Run it twice: the first reports
`changed: true` and writes `CONTEXT.md`; the second reports `changed: false`
because nothing meaningful changed.

`npm run demo:jira` runs three fixture tickets end-to-end against a
disposable temp repo copy: one clear ticket (plans -> implements -> opens a
PR), one ambiguous ticket (halts, raises clarifying questions), and one with
no repository link (refuses to guess a target). Neither demo proves real AI
generation quality - that requires real `MODEL_ENDPOINT`/`MODEL_API_KEY`
credentials (and, for Jira, a real Jira connection - not built yet).

### Progress dashboard

```bash
npm run dashboard
```

Renders a self-contained static HTML dashboard (`dashboard.html` - open it
directly in any browser, no server needed) showing rollout progress: coverage
%, pending-review count, not-started count, and per-repository staleness
against the target in `config/rollout-status.sample.json`. In production,
`src/pipeline/rollout-status.js` computes this from each onboarded
repository's real `CONTEXT.md` instead of sample data - pass a custom JSON
file to `npm run dashboard -- path/to/real-status.json` once you have one.

To install the automated pipelines into a target repository, copy the
relevant `.github/workflows/*.yml` files into that repository and configure
the `MODEL_ENDPOINT` / `MODEL_API_KEY` secrets (see
`.github/workflows/README.md`).

## Rolling out to real repositories

See [`ROLLOUT.md`](./ROLLOUT.md) for the pilot and priority-tier rollout
runbook - this requires real repositories in your GitHub org and engineer
review time, so it isn't something this project can complete on its own.

## Project status

Implemented and verified (109/109 tests passing, lint clean):
`repo-scanner`, `context-generator`, `context-refresh-pipeline`,
`ticket-intake`, `change-planning`, `change-implementation`,
`change-review-pipeline`.

Pending (operational, requires your org's repositories and a real Jira
connection): pilot validation, priority-tier rollout, real Jira integration.

Run `openspec status --change <change-name>` for live progress against each
change's task list (`add-codebase-context-generation`,
`add-jira-enhancement-pipeline`).
