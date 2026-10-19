import { isTestFile } from "./classify.js";

/**
 * Returns which written files are test files, so the eventual pull request
 * description can flag them for explicit reviewer attention, separate from
 * the general code review (spec: "AI-authored tests require explicit human
 * review").
 */
export function flagAiAuthoredTests(writtenPaths) {
  return writtenPaths.filter((p) => isTestFile(p));
}
