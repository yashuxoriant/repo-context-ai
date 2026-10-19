import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { stampLastValidated } from "../generator/stamp.js";
import { DEFAULT_OUTPUT_PATHS } from "../generator/write.js";

/**
 * Transitions a context file from draft to approved status once its
 * review pull request has been merged, recording the merge commit (spec:
 * "Status transition on approval"). This is the ONLY code path allowed to
 * mark a file approved - the generator always stamps draft.
 */
export async function markContextApproved({
  repoRoot,
  mergeCommit,
  outputPaths = DEFAULT_OUTPUT_PATHS
}) {
  const canonicalPath = path.join(repoRoot, outputPaths.canonical);
  const content = await readFile(canonicalPath, "utf8");

  const generatedAtMatch = content.match(/Generated: (.+)/);
  const commitMatch = content.match(/Commit: (.+)/);

  const approved = stampLastValidated(content, {
    generatedAt: generatedAtMatch?.[1]?.trim() ?? new Date().toISOString(),
    commitSha: commitMatch?.[1]?.trim() ?? "unknown",
    status: "approved",
    approvedCommit: mergeCommit
  });

  const updatedPaths = [];
  for (const relativePath of [outputPaths.canonical, ...outputPaths.mirrors]) {
    await writeFile(path.join(repoRoot, relativePath), approved, "utf8");
    updatedPaths.push(relativePath);
  }

  return { content: approved, updatedPaths };
}
