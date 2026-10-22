# Design

## Context

See `proposal.md` for motivation. Assumes a GitHub-based org with 50+ repos
(a "priority tier" onboards first), a shared/centrally managed LLM endpoint
(no per-developer keys), and GitHub Actions as the CI/CD mechanism.

## Goals / Non-Goals

**Goals:**
- Generate an accurate, evidence-grounded context file per repo with no
  manual authoring.
- Keep it cheap: only generation calls an LLM; scanning/templating don't.
- Make regeneration safe by construction - no path can merge a context file
  without human review.
- Keep `repo-scanner`, `context-generator`, `context-refresh-pipeline`
  independently testable and reusable for future AI initiatives.

**Non-Goals:**
- The future "Dependency Graph" (service-to-repo ownership mapping) is a
  separate, later change.
- No custom review UI - review happens through normal pull requests.
- No deep code/call-graph analysis - scanning stays structural and textual.

## Decisions

- **Scanning: lightweight structural scan** (`git`/filesystem commands,
  README/manifest/CI reads), not a language-aware static analyzer - avoids
  per-language tooling complexity disproportionate to v1's needs.
- **Generation: one grounded prompt call per repo**, enforcing the fixed
  10-section schema and "never invent." A multi-step exploring agent was
  rejected - adds cost/latency with no demonstrated accuracy gain.
- **Review: normal pull requests**, reusing each repo's existing branch
  protection - no new review dashboard to build or secure.
- **Refresh trigger: path-filtered push + weekly schedule**, not per-commit
  - avoids excessive review-PR volume eroding reviewer trust.
- **Rollout: pilot 2-3 repos first**, then parallel fan-out across the
  priority tier before the full estate - catches template issues early.
- **Secret redaction happens at scan time**, before anything reaches a
  prompt - that is the actual point of exposure risk.

## Risks / Trade-offs

- *Redaction misses an uncommon format* → versioned pattern config, plus
  whole-file exclusion for `.env*`/`*.pem`/`*.key`.
- *Generated content is inaccurate or stale* → mandatory human review;
  draft status visible in the file itself.
- *Review-PR volume gets noisy* → path-filtered triggers plus a no-op check
  skipping PRs when only metadata changed.
- *LLM endpoint cost/availability varies* → generation sits behind a small
  swappable interface.
- *Template is low-quality if adopted too early* → pilot-first sequencing.

## Migration Plan

1. Validate scanner + generator manually against 2-3 pilot repos.
2. Add the refresh pipeline (manual trigger only); re-validate end-to-end.
3. Enable path-filtered and scheduled triggers on the pilots.
4. Fan out to the priority tier in parallel, each repo independently.
5. Expand progressively to the rest of the 50+ repo estate.

**Rollback:** remove the workflow file/trigger config for a repo - no data
migration needed; the context file stays a normal file in repo history.

## Open Questions

- Which LLM endpoint/provider, and its rate limits under parallel rollout?
  (Only affects concurrency config, not the specs.)
- Where should the "priority tier" repo list live - a config file here, or
  an external source of truth? (Deferred; no spec impact.)
