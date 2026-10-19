/**
 * Local, no-credentials demo of the full generation pipeline.
 *
 * Runs scanner -> generator -> draft-stamping -> canonical+mirror write
 * against THIS project (dogfooding) using a mock model provider, so it can
 * be demoed without a real LLM endpoint/API key or a GitHub remote.
 *
 * NOTE: the document below is a hand-written stand-in for what a real
 * model call would return - it is NOT live AI output. Be transparent about
 * that in a demo: this script proves the pipeline mechanics (validation,
 * draft stamping, mirroring, change detection) work end-to-end; it does
 * not prove generation quality, which requires a real MODEL_ENDPOINT/
 * MODEL_API_KEY (see `npm run generate`).
 *
 * Usage: npm run demo
 */
import { runContextRefresh } from "../src/pipeline/run.js";
import { createMockProvider } from "../src/generator/model.js";

const sampleDoc = `## Overview
repo-context-ai automatically generates a standardized context file (CONTEXT.md) for a repository by scanning its structure, manifests, CI config, and git history, then having an LLM summarize it into a fixed schema. Context files are mirrored for GitHub Copilot and reviewed via pull request before being trusted.

## Architecture
A three-module pipeline: repo-scanner (src/scanner) extracts and redacts repository signals; context-generator (src/generator) turns those signals into a fixed-schema Markdown document via a pluggable LLM provider; context-refresh-pipeline (src/pipeline, .github/workflows) detects changes, opens review PRs, and marks approval on merge.

## Setup & Local Dev
Run \`npm install\`, then \`npm test\` to run the unit/integration suite, and \`npm run lint\`. Use \`npm run generate\` with MODEL_ENDPOINT/MODEL_API_KEY set to generate a context file for a target repo.

## Key Modules / Directories
- src/scanner - repository signal extraction and secret redaction
- src/generator - prompt template, model interface, validation, stamping, file writing
- src/pipeline - orchestration (run/approve) used by the GitHub Actions workflows
- openspec - the OpenSpec change (proposal, specs, design, tasks) this project was built from

## Coding Conventions
ES modules (type: module) throughout; Vitest for tests colocated under test/ mirroring src/ structure; ESLint + Prettier for formatting; each module ships its own README.md.

## Dependencies
Not evident from available files - needs engineer input for a full dependency audit; package.json lists eslint, prettier, vitest, js-yaml, and globals as devDependencies with no runtime dependencies beyond Node built-ins.

## Important Files
package.json (scripts), src/index.js (CLI entry point for generate/approve), config/secret-patterns.json (redaction rules), config/refresh-triggers.json (pipeline trigger config), .github/workflows/*.yml (automation).

## Known Constraints / Gotchas
The GitHub Actions workflows reference a <org>/repo-context-ai placeholder that must be replaced with the real published repository path before use; MODEL_ENDPOINT/MODEL_API_KEY must be configured as secrets for the pipeline to run.

## Ownership
Not evident from available files - needs engineer input.

## Last Validated
placeholder`;

const result = await runContextRefresh({
  repoRoot: process.cwd(),
  repoName: "repo-context-ai",
  commitSha: "demo-run",
  callModel: createMockProvider(sampleDoc),
  now: () => new Date().toISOString()
});

console.log(`changed: ${result.changed}`);
if (result.changed) {
  console.log(`written: ${result.writtenPaths.join(", ")}`);
  console.log("\n-> First run: no approved CONTEXT.md existed yet, so this is treated as a change.");
} else {
  console.log(`skipped reason: ${result.skippedReason}`);
  console.log("\n-> Re-run: content is identical to the last run (only the timestamp/commit differ),");
  console.log("   so the pipeline correctly skips opening a no-op review PR (spec requirement).");
}
console.log("\nOpen CONTEXT.md to see the generated file.");
