# Tasks

## 1. Project Setup

- [x] 1.1 Initialize the project scaffold (package.json, directory layout for
      `src/scanner`, `src/generator`, `.github/workflows`, `config/`) and verify
      `npm install` completes with no errors
- [x] 1.2 Add linting/formatting config (ESLint + Prettier or equivalent) and verify
      `npm run lint` passes on the empty scaffold
- [x] 1.3 Add a test runner (e.g. Vitest/Jest) and verify `npm test` runs successfully
      with zero tests as a baseline
- [x] 1.4 Define the redaction pattern list as a versioned config file
      (`config/secret-patterns.json` or similar) and verify it loads and parses in a
      unit test

## 2. Repo Scanner Capability (`repo-scanner`)

- [x] 2.1 Implement repository access check (verify invoking identity/token has read
      access before scanning) and verify a unit test covers both the allowed and
      denied paths (spec: "Repository access boundary enforcement")
- [x] 2.2 Implement directory tree extraction (depth-limited, excludes
      node_modules/.git/dist/build) and verify a unit test asserts exclusions are
      honored on a fixture repo
- [x] 2.3 Implement README, manifest, and CI config extraction and verify a unit test
      confirms correct output when all three are present (spec: "Structured repository
      signal extraction")
- [x] 2.4 Implement graceful handling when an optional input (e.g. CI config) is
      missing and verify a unit test confirms the bundle still completes with that
      field marked absent (spec: "Scan handles a repository missing optional inputs")
- [x] 2.5 Implement git-history-based hot-files extraction and largest-files extraction
      and verify a unit test validates the sort order and count limit
- [x] 2.6 Implement line-level redaction against the secret pattern config and verify a
      unit test confirms a planted fake secret is redacted in scanner output (spec:
      "Secret and credential redaction")
- [x] 2.7 Implement whole-file exclusion for conventional secret-file paths
      (`.env*`, `*.pem`, `*.key`, gitignored secret patterns) and verify a unit test
      confirms such files never appear in the output bundle
- [x] 2.8 Document the `repo-scanner` module's inputs/outputs in `src/scanner/README.md`
      and verify the documented example command produces the documented output shape

## 3. Context Generator Capability (`context-generator`)

- [x] 3.1 Finalize the generation prompt template enforcing the fixed ten-section
      schema and the "mark as not evident, do not invent" instruction, and verify a
      unit test asserts the prompt template renders correctly given a sample scan
      bundle (spec: "Fixed-schema context file generation")
- [x] 3.2 Implement the model-call interface (provider-agnostic) behind a small
      internal abstraction and verify a unit test can swap in a mock provider without
      changing calling code (design: "generation step behind a small internal
      interface")
- [x] 3.3 Implement output parsing/validation that rejects or flags a generated file
      missing any of the ten required sections and verify a unit test confirms a
      malformed sample output is caught
- [x] 3.4 Implement draft status stamping (generation date, source commit SHA, draft
      status) in the Last Validated section and verify a unit test confirms the stamp
      is present and correctly formatted (spec: "Draft status stamping until human
      approval")
- [x] 3.5 Implement canonical file writing plus mirroring to configured tool-specific
      paths (`.github/copilot-instructions.md`, optional `.cursorrules`/`CLAUDE.md`)
      and verify a unit test confirms identical content across canonical and mirrored
      outputs (spec: "Canonical output with tool-specific mirroring")
- [x] 3.6 Document the `context-generator` module and the fixed template schema in
      `src/generator/README.md` and verify the documented example reproduces a sample
      generated file

## 4. Review and Refresh Pipeline (`context-refresh-pipeline`)

- [x] 4.1 Author the GitHub Actions workflow with manual-dispatch trigger only (first
      pass) invoking scanner + generator and opening a pull request, and verify a
      workflow dry-run against a sandbox repository produces a PR with no direct commit
      to the default branch (spec: "Mandatory human review before adoption")
- [x] 4.2 Add path-filtered push trigger for configured significant paths and verify a
      test commit touching a significant path triggers the workflow while a commit
      touching only unrelated files does not (spec: "Change-triggered and scheduled
      regeneration")
- [x] 4.3 Add the weekly scheduled trigger and verify the workflow's cron configuration
      is syntactically valid and documented
- [x] 4.4 Implement the no-op diff check that skips opening a PR when the only
      difference from the previously approved file is the Last Validated timestamp or
      commit SHA, and verify a unit test confirms no PR branch is created in that case
      (spec: "No pull request is opened when there is no meaningful difference")
- [x] 4.5 Implement the approval status transition (draft to approved, recording the
      merge commit) triggered on PR merge, and verify a test confirms the merged file's
      status updates correctly (spec: "Status transition on approval")
- [x] 4.6 Document the pipeline's trigger configuration and rollback steps (removing
      the workflow file disables the pipeline for that repository) in
      `.github/workflows/README.md` and verify the documented rollback steps match the
      actual workflow file structure

## 5. Pilot Validation

- [ ] 5.1 Select 2-3 pilot repositories per the design's rollout sequencing and verify
      each has scanner + generator run manually (no pipeline) with output reviewed by
      an engineer
- [ ] 5.2 Incorporate pilot feedback into the template/prompt and re-run against the
      same pilot repositories, and verify the second-pass output addresses the
      specific feedback items raised
- [ ] 5.3 Enable the full `context-refresh-pipeline` (manual trigger first, then
      path-filtered and scheduled triggers) on the pilot repositories and verify an
      end-to-end run produces a mergeable, accurate pull request

## 6. Priority Tier Rollout

- [ ] 6.1 Define the priority-tier repository list (per design's deferred "source of
      truth" open question, default to a config file in this project unless directed
      otherwise) and verify the list loads correctly by the orchestration step
- [ ] 6.2 Run scanner + generator in parallel across the full priority tier and verify
      every repository produces an opened review pull request
- [ ] 6.3 Track review completion across the priority tier and verify all pull requests
      reach a merged or explicitly rejected state within the agreed review window

## Workflow follow-up

- Archive this change once the priority-tier rollout (task group 6) is complete and the
  pilot/rollout results have been reviewed with stakeholders.
- Verify the archived result reflects the final approved specs for `repo-scanner`,
  `context-generator`, and `context-refresh-pipeline`.
