import { createFeatureBranch, writeScopedFiles } from "./branch.js";
import { generateFileContents } from "./content-generation.js";
import { runPreMergeChecks } from "./safety-gate.js";
import { flagAiAuthoredTests } from "./test-flagging.js";

/**
 * Runs the full change-implementation capability: branch -> generate
 * content for every planned file -> write (scope-enforced) -> run the
 * repository's own safety gate. Does NOT open a pull request - that is
 * change-review-pipeline's responsibility, and it only proceeds if
 * safetyGate.passed is true.
 */
export async function implementChange({ plan, repoRoot, callModel, branchName }) {
  await createFeatureBranch(repoRoot, branchName);

  const contentByPath = await generateFileContents({ plan, callModel });
  const writtenPaths = await writeScopedFiles(repoRoot, plan, contentByPath);

  const safetyGate = await runPreMergeChecks(repoRoot);
  const aiAuthoredTestFiles = flagAiAuthoredTests(writtenPaths);

  return {
    branchName,
    writtenPaths,
    aiAuthoredTestFiles,
    safetyGate,
    readyForReview: safetyGate.passed
  };
}

export { createFeatureBranch, writeScopedFiles, generateFileContents, runPreMergeChecks, flagAiAuthoredTests };
export { isTestFile } from "./classify.js";
