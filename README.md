# repo-context-ai

Automated repository context (Skill/context file) generation for AI coding
assistants (GitHub Copilot, Cursor, Claude Code). Built using
[OpenSpec](https://github.com/Fission-AI/OpenSpec) spec-driven development -
see `openspec/changes/add-codebase-context-generation/` for the full
proposal, specs, design, and task list this implementation follows.

## What this does

For a target repository, generates a standardized context file
(`CONTEXT.md`, mirrored to `.github/copilot-instructions.md`) covering
architecture, setup, conventions, dependencies, gotchas, and ownership -
grounded only in scanned evidence, never invented. Every generated/refreshed
file goes through mandatory human review via a pull request; nothing is ever
auto-merged. A GitHub Actions pipeline keeps it fresh automatically.

## Capabilities (see `openspec/changes/.../specs/`)

| Capability | Module | What it does |
|---|---|---|
| `repo-scanner` | `src/scanner/` | Extracts structure, manifests, CI config, README, git history; redacts secrets |
| `context-generator` | `src/generator/` | Generates the fixed-schema context file from scan output; stamps draft status |
| `context-refresh-pipeline` | `src/pipeline/`, `.github/workflows/` | Detects significant changes, opens review PRs, handles approval transition |

## Getting started

```bash
npm install
npm test        # 39 tests across scanner, generator, pipeline
npm run lint
```

To generate a context file for a local repository checkout:

```bash
TARGET_REPO_PATH=/path/to/repo \
MODEL_ENDPOINT=https://your-endpoint \
MODEL_API_KEY=your-key \
npm run generate
```

### No-credentials demo

```bash
npm run demo
```

Runs the full pipeline (scan -> generate -> validate -> stamp -> write) against
this project itself using a mock model response - no API key or GitHub remote
required. Run it twice to see the no-op diff-skip behavior: the first run
reports `changed: true` and writes `CONTEXT.md`; the second reports
`changed: false` because nothing meaningful changed. This proves the pipeline
mechanics work; it does not demonstrate real generation quality, which
requires `npm run generate` with a real model endpoint.

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

To install the automated pipeline into a target repository, copy
`.github/workflows/generate-context.yml` and `.github/workflows/approve-context.yml`
into that repository and configure the `MODEL_ENDPOINT` / `MODEL_API_KEY`
secrets (see `.github/workflows/README.md`).

## Rolling out to real repositories

See [`ROLLOUT.md`](./ROLLOUT.md) for the pilot and priority-tier rollout
runbook (OpenSpec tasks.md groups 5-6) - this requires real repositories in
your GitHub org and engineer review time, so it isn't something this project
can complete on its own.

## Project status

Implemented and verified (39/39 tests passing, lint clean):
`repo-scanner`, `context-generator`, `context-refresh-pipeline`.

Pending (operational, requires your org's repositories):
pilot validation, priority-tier rollout.

Run `openspec status --change add-codebase-context-generation` for live
progress against the full task list.
