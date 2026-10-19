# Rollout Runbook (Tasks 5.1-6.3)

This covers the two task groups that require real repositories in your GitHub
org and cannot be executed from within this standalone project. Follow this
runbook to complete them; it maps directly to
`openspec/changes/add-codebase-context-generation/tasks.md` groups 5 and 6.

## Prerequisites

- [ ] Publish this repository (`repo-context-ai`) somewhere your org's other
      repositories can check it out as a step dependency (see `<org>/repo-context-ai`
      placeholder in both workflow files under `.github/workflows/`).
- [ ] Provision `MODEL_ENDPOINT` and `MODEL_API_KEY` as organization or
      repository secrets, pointing at your shared LLM credential (Azure AI
      Foundry / GitHub Models / OpenAI-compatible).

## 5. Pilot Validation

1. **(5.1) Select 2-3 pilot repositories.** Pick ones that are active, have a
   README and manifest file, and ideally where engineers have already
   complained about AI tools lacking context. Copy both workflow files from
   `.github/workflows/` into each, then run `workflow_dispatch` manually.
   Review the opened pull request with an engineer for each repo.
2. **(5.2) Incorporate feedback.** If the review surfaces template gaps
   (e.g., a section consistently needs more detail, or the model
   consistently invents something it shouldn't), adjust the prompt in
   `src/generator/template.js` and re-run `workflow_dispatch` on the same
   pilot repos. Confirm the second pass addresses the specific feedback.
3. **(5.3) Enable the full pipeline.** Once satisfied, leave both workflow
   files active (push-trigger + weekly schedule already configured) on the
   pilot repos and confirm an end-to-end run (a real significant-path
   commit, or waiting for the weekly schedule) produces a mergeable PR.

## 6. Priority-Tier Rollout

1. **(6.1) Define the priority-tier list.** Create a simple list (a text
   file, spreadsheet, or this project's own `config/` directory) of the
   ~16 repositories to onboard next, per the source proposal document's
   "priority set" framing.
2. **(6.2) Fan out in parallel.** Copy the workflow files into each
   priority-tier repository and trigger `workflow_dispatch` for all of them
   around the same time - generation is independent per repository, so
   there's no reason to do this sequentially.
3. **(6.3) Track review completion.** Use a shared tracker (GitHub Projects,
   a spreadsheet, whatever your team already uses) to confirm every opened
   PR reaches merged or explicitly rejected within your agreed review
   window (the source proposal's own estimate was ~1-2 engineer-hours per
   repository for first-time review).

## After rollout

Mark the corresponding checkboxes in
`openspec/changes/add-codebase-context-generation/tasks.md` as you complete
each step in your real environment, then run:

```bash
openspec status --change add-codebase-context-generation
```

Once all 30 tasks show complete, the change is ready to archive:

```bash
openspec instructions archive --change add-codebase-context-generation --json
```
