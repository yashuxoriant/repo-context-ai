import { createFeatureBranch, writeScopedFiles } from "./branch.js";
import { generateFileContents } from "./content-generation.js";
import { runPreMergeChecks } from "./safety-gate.js";
import { flagAiAuthoredTests } from "./test-flagging.js";

/**
 * Writes implementation + test content for a plan and runs the safety
 * gate, WITHOUT creating a git branch. Used by the CI/live-PR path, where
 * branch creation must be left to `create-pull-request` (it expects to
 * start from the base branch and create the feature branch itself from
 * uncommitted working-tree changes - a pre-existing local branch checkout
 * confuses its branch-diffing logic). See `implementChange()` below for
 * the branch-creating variant used for local demos/tests.
 */
export async function implementChangeFiles({ plan, repoRoot, callModel }) {
  const contentByPath = await generateFileContents({ plan, callModel });
  const writtenPaths = await writeScopedFiles(repoRoot, plan, contentByPath);

  const safetyGate = await runPreMergeChecks(repoRoot);
  const aiAuthoredTestFiles = flagAiAuthoredTests(writtenPaths);

  return {
    writtenPaths,
    aiAuthoredTestFiles,
    safetyGate,
    readyForReview: safetyGate.passed
  };
}

/**
 * Runs the full change-implementation capability: branch -> generate
 * content for every planned file -> write (scope-enforced) -> run the
 * repository's own safety gate. Does NOT open a pull request - that is
 * change-review-pipeline's responsibility, and it only proceeds if
 * safetyGate.passed is true.
 */
export async function implementChange({ plan, repoRoot, callModel, branchName }) {
  await createFeatureBranch(repoRoot, branchName);
  const result = await implementChangeFiles({ plan, repoRoot, callModel });
  return { branchName, ...result };
}

export { createFeatureBranch, writeScopedFiles, generateFileContents, runPreMergeChecks, flagAiAuthoredTests };
export { isTestFile } from "./classify.js";
