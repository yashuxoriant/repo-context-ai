# Proposal

## Why

AI coding assistants (GitHub Copilot, Cursor, Claude Code) start every session with zero
knowledge of a repository's architecture, conventions, and constraints. Engineers waste
5-15 minutes per session re-explaining the same context, repeated across every repository
in the organization's 50+ repo estate, and that explanation is never captured or reused.
This change builds a standalone tool that automatically generates, reviews, and refreshes
a standardized per-repository context file so AI tools and new engineers both get accurate,
current repo context for free.

## What Changes

- Add a repository scanner that extracts structured signals from a target repo (directory
  tree, manifest files, CI config, README, git history "hot files", largest source files)
  while redacting anything that looks like a secret/credential before it leaves the scan step.
- Add an LLM-based context generator that turns scanner output into a fixed-schema Markdown
  context file (architecture, setup, key modules, conventions, dependencies, important files,
  gotchas, ownership, last-validated metadata).
- Add a review workflow: every generated/refreshed context file is opened as a pull request
  and never auto-merged; a human must approve before it becomes "approved context."
- Add a refresh pipeline (CI/CD workflow) that detects significant repository changes
  (manifest/CI/README edits, or a weekly schedule) and re-triggers generation, diffing
  against the previously approved file.
- Add output mirroring so the canonical context file is also written to the paths AI tools
  already read natively (`.github/copilot-instructions.md`, optionally `.cursorrules` /
  `CLAUDE.md`).
- Add repository-access enforcement so generation only runs against repositories the
  invoking identity/service already has read access to - no new permission model is created.
- Provides a foundation for AI coding assistants and new engineers to quickly understand and work with any repository in the organization without repeatedly explaining the same context.
- Enables consistent and up-to-date repository context across the organization, reducing onboarding time and improving developer productivity.

## Capabilities

### New Capabilities
- `repo-scanner`: Extracts and redacts structured repository signals (tree, manifests, CI
  config, README, git history, largest files) used as input to context generation.
- `context-generator`: Produces the standardized context file from scanner output using a
  fixed template, and writes it plus its tool-specific mirrors to the correct repo paths.
- `context-refresh-pipeline`: Detects meaningful repository changes, re-runs scanning and
  generation, and opens a human-reviewed pull request with the proposed update; never
  auto-merges.

### Modified Capabilities
(none - this is a new, standalone project with no existing specs)

## Impact

- New standalone repository/codebase (not integrated into any existing project).
- New CI/CD workflow definitions (GitHub Actions) added to each target repository once this
  tool is adopted there.
- Depends on access to an LLM endpoint (Azure AI Foundry / GitHub Models / OpenAI-compatible
  API) for the generation step; no other external services required for the MVP.
- No impact on existing production systems - this tool only reads source repositories and
  proposes documentation changes via pull request.
