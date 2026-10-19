# Design

## Context

See `proposal.md` - Why / What Changes for motivation. This design assumes:
- The target environment is a GitHub-based organization with 50+ repositories, a subset
  of which (an initial "priority tier") will onboard first.
- An LLM endpoint is available to the pipeline (Azure AI Foundry, GitHub Models, or any
  OpenAI-compatible API) via a shared, centrally managed credential - no individual
  developer API keys are required, consistent with how centralized AI services are
  provisioned elsewhere in the organization.
- GitHub Actions is the available CI/CD mechanism in target repositories.

## Goals / Non-Goals

**Goals:**
- Generate an accurate, evidence-grounded context file per repository with minimal
  manual authoring effort.
- Keep the system cheap to run: scanning and templating logic should not require an LLM
  call; only the generation step does.
- Make regeneration safe by construction - no code path can merge a context file without
  human review.
- Make the three capabilities (`repo-scanner`, `context-generator`,
  `context-refresh-pipeline`) independently testable and reusable, since
  `context-generator`'s evidence-grounding approach and `repo-scanner`'s redaction logic
  are both candidates for reuse by the organization's other AI initiatives later.

**Non-Goals:**
- This change does not implement the "Dependency Graph" extension (service-to-repository
  mapping, ownership/change-history linkage) referenced in the source proposal document -
  that remains a future, separate change.
- This change does not build a custom repo-browsing UI; review happens through normal
  pull request tooling.
- This change does not attempt full semantic code understanding (e.g., call-graph
  analysis); scanning is limited to structural and textual signals.

## Decisions

### Scanning approach: lightweight structural scan, not a custom static analyzer
Use `git`/filesystem commands (tree listing, `git log --name-only` for hot files, line
counts for largest files) plus direct reads of README/manifest/CI files, rather than
building or integrating a language-aware static analysis engine.
- **Alternative considered**: integrate a dedicated code-intelligence tool (e.g., a
  language server or AST-based summarizer) for deeper structural understanding.
  Rejected for v1 because it adds per-language tooling complexity disproportionate to
  the value - the fixed-schema context file leans on README/manifest/convention signals
  far more than deep code structure, and this can be revisited per-language later if
  evidence shows gaps.

### Generation model: single prompt call per repository, template-constrained
Use one LLM call per repository per generation pass, with the prompt enforcing the fixed
ten-section schema and an explicit "mark as not evident, do not invent" instruction,
rather than a multi-step agentic workflow.
- **Alternative considered**: a multi-step agent that iteratively explores the repo
  (reading files on demand). Rejected for v1 - adds cost, latency, and failure surface
  without a demonstrated accuracy gain over a single well-grounded prompt fed a curated
  scan bundle; can be revisited if review feedback shows the single-pass approach misses
  information that targeted follow-up reads would have found.

### Review mechanism: pull request, not a custom approval UI
Every generation/refresh run writes to a branch and opens a pull request using the
target repository's normal review process (required reviewers, branch protection).
- **Alternative considered**: a standalone review dashboard. Rejected - adds a new
  surface for engineers to learn and a new system to secure, when the org's existing PR
  review workflow already satisfies the "human must approve" requirement.

### Refresh trigger: path-filtered push + weekly schedule, not per-commit
Trigger regeneration only when configured significant paths change, plus a weekly
schedule as a safety net, rather than on every push.
- **Alternative considered**: regenerate on every commit to `main`. Rejected - this
  would produce excessive review-PR volume relative to how often the information in a
  context file actually changes, undermining reviewer trust in the pipeline.

### Rollout sequencing: pilot, then parallel fan-out across the priority tier
Validate the fixed template against 2-3 pilot repositories first, then run generation in
parallel (not sequentially) across the full priority tier once the template is
validated, before expanding toward the full 50+ repository estate.
- **Alternative considered**: sequential rollout, one repository at a time, across the
  full estate from the start. Rejected - front-loads review bottleneck risk and delays
  catching template quality issues that are cheaper to fix before scaling out.

### Secret redaction: pattern-based filtering at scan time, not at generation time
Redact/exclude secret-like content inside the `repo-scanner` capability, before any
content is assembled into a prompt, rather than relying on the LLM to avoid repeating
secrets it was shown.
- **Alternative considered**: redact only in the final generated output. Rejected -
  this would still transmit raw secret values to the LLM provider during generation,
  which is the actual point of exposure risk.

## Risks / Trade-offs

- [Pattern-based secret redaction misses an uncommon secret format] → Mitigation:
  maintain the redaction pattern list as a reviewable, versioned config (not hardcoded
  inline), and additionally exclude entire files matching common secret-file
  conventions (`.env*`, `*.pem`, `*.key`) as a second layer of defense.
- [Generated content is inaccurate or stale despite grounding instructions] → Mitigation:
  mandatory human review before any file is treated as approved context; draft status is
  visible in the file itself so nobody mistakes an unreviewed draft for approved context.
- [Review-PR volume becomes noisy, causing reviewers to rubber-stamp without reading] →
  Mitigation: path-filtered triggers plus a no-op check that skips opening a PR when the
  only difference is timestamp/commit metadata.
- [LLM endpoint cost or availability varies by provider] → Mitigation: keep the
  generation step behind a small internal interface so the underlying model/endpoint can
  be swapped without changing the scanner or pipeline capabilities.
- [Template becomes stale or low-quality if adopted org-wide before validation] →
  Mitigation: pilot-first rollout sequencing (see Decisions) before fan-out.

## Migration Plan

1. Build and validate `repo-scanner` and `context-generator` against 2-3 pilot
   repositories manually (no pipeline yet) to confirm template quality.
2. Add `context-refresh-pipeline` (manual-trigger mode only) and re-validate the pilot
   repositories end-to-end, including the PR review step.
3. Enable path-filtered and scheduled triggers on the pilot repositories.
4. Fan out to the full priority tier in parallel, repository by repository, each
   onboarding independently (no shared state between repositories).
5. Expand progressively to the remainder of the 50+ repository estate.

Rollback: disabling the pipeline for a given repository is simply removing its workflow
file / trigger configuration - no data migration is required since the pipeline never
owns anything beyond the context file itself, which remains a normal reviewed file in
that repository's history.

## Open Questions

- Which specific LLM endpoint/provider will be used in the shared credential, and what
  are its rate limits relative to running the priority tier in parallel? (Does not
  change the specs or approach - only affects pipeline concurrency configuration.)
- Where should the canonical list of "priority tier" repositories live (a config file in
  this project vs. an external source of truth)? (Deferred - does not affect the
  per-repository behavior specified in `repo-scanner`, `context-generator`, or
  `context-refresh-pipeline`.)
