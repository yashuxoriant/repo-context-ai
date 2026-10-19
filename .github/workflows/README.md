# `context-refresh-pipeline`

GitHub Actions automation that keeps generated context files current and routes
every change through mandatory human review. See
`openspec/changes/add-codebase-context-generation/specs/context-refresh-pipeline/spec.md`
for the full behavior contract.

## Workflows

### `.github/workflows/generate-context.yml`

Runs scanner + generator (via this project's `src/index.js generate`) against
the repository it is installed into, and opens a pull request when the result
represents a meaningful change.

**Triggers** (configured in `config/refresh-triggers.json`, the single source
of truth also checked by `test/pipeline/workflows.test.js`):
- `workflow_dispatch` - manual run, used for first-time generation
- `schedule` - weekly (`0 3 * * 1`, Mondays 03:00 UTC) as a safety net
- `push` to `main` touching a significant path (manifest files, CI config,
  README) - NOT on every commit

**Guarantee:** this workflow never pushes directly to `main` and never merges
a pull request. It only opens one, via `create-pull-request`, and the no-op
diff check (`isOnlyMetadataDifference`) skips opening a PR when the only
difference from the approved version is the generation timestamp/commit.

### `.github/workflows/approve-context.yml`

Reacts to a merged `automated/context-refresh` pull request and stamps the
context file's status from `DRAFT` to `APPROVED`, recording the merge commit.
It does not decide whether to merge - it only runs after a human already did.

## Rollback

Disabling this pipeline for a given repository requires no data migration:
remove (or rename to `.disabled`) the two workflow files in that repository's
`.github/workflows/`. The context file itself remains a normal, reviewed file
in that repository's git history - nothing else needs to be undone.

## Required repository configuration

- Secrets: `MODEL_ENDPOINT`, `MODEL_API_KEY` (shared, centrally managed
  credential - see design.md "Context")
- Permissions: `contents: write`, `pull-requests: write` (already set in both
  workflow files)
- This tooling repository (`repo-context-ai`) checked out as a step dependency
  - replace `<org>/repo-context-ai` in both workflow files with the actual
    repository path once published
