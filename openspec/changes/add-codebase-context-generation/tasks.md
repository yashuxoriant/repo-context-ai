# Tasks

## 1. Project Setup

- [x] 1.1 Initialize project scaffold and verify `npm install` is clean
- [x] 1.2 Add lint/format config and verify `npm run lint` passes
- [x] 1.3 Add a test runner and verify `npm test` runs
- [x] 1.4 Define a versioned secret-redaction pattern config file

## 2. Repo Scanner Capability (`repo-scanner`)

- [x] 2.1 Enforce repository-access checks before scanning (spec:
      "Repository access boundary enforcement")
- [x] 2.2 Extract directory tree, excluding node_modules/.git/dist/build
- [x] 2.3 Extract README, manifest, and CI config (spec: "Structured
      repository signal extraction")
- [x] 2.4 Handle gracefully when an optional input is missing (spec: "Scan
      handles a repository missing optional inputs")
- [x] 2.5 Extract git-history hot files and largest files
- [x] 2.6 Redact secret-pattern matches from scanner output (spec: "Secret
      and credential redaction")
- [x] 2.7 Exclude whole conventional secret files (`.env*`, `*.pem`, `*.key`)
- [x] 2.8 Document the module in `src/scanner/README.md`

## 3. Context Generator Capability (`context-generator`)

- [x] 3.1 Finalize the prompt enforcing the fixed 10-section schema and
      "never invent" rule (spec: "Fixed-schema context file generation")
- [x] 3.2 Build a provider-agnostic model-call interface (swappable mock)
- [x] 3.3 Validate output and flag any generated file missing a required
      section
- [x] 3.4 Stamp draft status, generation date, and source commit SHA (spec:
      "Draft status stamping until human approval")
- [x] 3.5 Write the canonical file and mirror it to tool-specific paths
      (spec: "Canonical output with tool-specific mirroring")
- [x] 3.6 Document the module and template schema in
      `src/generator/README.md`

## 4. Review and Refresh Pipeline (`context-refresh-pipeline`)

- [x] 4.1 Add a manual-dispatch workflow that scans + generates + opens a
      PR, never commits directly (spec: "Mandatory human review before
      adoption")
- [x] 4.2 Add a path-filtered push trigger for significant files (spec:
      "Change-triggered and scheduled regeneration")
- [x] 4.3 Add the weekly scheduled trigger
- [x] 4.4 Skip opening a PR when only timestamp/commit metadata changed
      (spec: "No pull request is opened when there is no meaningful
      difference")
- [x] 4.5 Transition draft → approved on PR merge, recording the merge
      commit (spec: "Status transition on approval")
- [x] 4.6 Document trigger configuration and rollback steps

## 5. Pilot Validation

- [ ] 5.1 Select 2-3 pilot repos and run scanner + generator manually,
      reviewed by an engineer
- [ ] 5.2 Incorporate pilot feedback into the template and re-run
- [ ] 5.3 Enable the full pipeline (manual, then path-filtered/scheduled
      triggers) on the pilots end-to-end

## 6. Priority Tier Rollout

- [ ] 6.1 Define the priority-tier repository list
- [ ] 6.2 Run the pipeline in parallel across the full priority tier
- [ ] 6.3 Track every opened PR to a merged or explicitly rejected state

## Workflow follow-up

- Archive this change once priority-tier rollout (group 6) is complete and
  reviewed with stakeholders, reflecting the final approved specs.
