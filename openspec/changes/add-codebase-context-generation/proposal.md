# Proposal

## Why

AI coding assistants (Copilot, Cursor, Claude Code) start every session with
zero knowledge of a repo's architecture or conventions. Engineers re-explain
the same context repeatedly, across 50+ repos, and none of it is ever
captured or reused. This change builds a tool that auto-generates, reviews,
and refreshes a standard per-repo context file, so both AI tools and new
engineers get accurate, current context for free - no manual authoring.

## What Changes

- **Scan** a repo for structural signals: directory tree, manifests, CI
  config, README, recently-changed files, largest files - redacting any
  secret-looking content before it leaves this step.
- **Generate** a fixed 10-section Markdown context file (architecture,
  setup, conventions, dependencies, gotchas, ownership, last-validated date)
  from that scan, using an LLM grounded only in the scanned evidence.
- **Review**: every generated/refreshed file is opened as a pull request,
  never auto-merged. It stays marked `DRAFT` until a human approves it.
- **Refresh** automatically on significant file changes or weekly, diffing
  against the last approved version (skips opening a PR if nothing
  meaningful changed, to avoid reviewer fatigue).
- **Mirror** the file to the paths AI tools already read natively
  (`.github/copilot-instructions.md`, optionally `.cursorrules`/`CLAUDE.md`).
- Only runs against repos the pipeline already has read access to - no new
  permission model.

**Outcome:** every onboarded repo gets accurate, always-current, AI- and
human-readable documentation with zero ongoing manual effort, reducing
onboarding time and repeated context-explaining across the org.

## Capabilities

### New Capabilities
- `repo-scanner`: Extracts and redacts structured repository signals (tree,
  manifests, CI config, README, git history, largest files).
- `context-generator`: Produces the standardized context file from scanner
  output and writes it plus tool-specific mirrors to the right repo paths.
- `context-refresh-pipeline`: Detects meaningful changes, re-runs scanning
  and generation, and opens a human-reviewed PR; never auto-merges.

### Modified Capabilities
(none - this is a new, standalone project)

## Impact

- New standalone codebase, not integrated into any existing project.
- Adds one new CI/CD workflow (GitHub Actions) per repo once adopted there.
- Needs access to an LLM endpoint (Azure AI Foundry / GitHub Models / any
  OpenAI-compatible API) for generation; nothing else external for the MVP.
- No impact on existing production systems - this only reads source repos
  and proposes documentation changes via pull request.
