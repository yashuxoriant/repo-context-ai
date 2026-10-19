import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const execFileAsync = promisify(execFile);

/** Creates and checks out a new feature branch for the implementation. */
export async function createFeatureBranch(repoRoot, branchName) {
  await execFileAsync("git", ["-C", repoRoot, "checkout", "-b", branchName]);
  return branchName;
}

/**
 * Writes file contents to the repository, but ONLY for paths explicitly
 * listed in the plan's `files` array - any attempt to write a path outside
 * that list is rejected before anything is written (spec: "Implementation
 * stays within the approved plan's scope").
 */
export async function writeScopedFiles(repoRoot, plan, contentByPath) {
  const allowed = new Set(plan.files);
  const outsideScope = [...contentByPath.keys()].filter((p) => !allowed.has(p));
  if (outsideScope.length > 0) {
    throw new Error(`Refusing to write file(s) outside the approved plan's scope: ${outsideScope.join(", ")}`);
  }

  const written = [];
  for (const [relativePath, content] of contentByPath.entries()) {
    const fullPath = path.join(repoRoot, relativePath);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content, "utf8");
    written.push(relativePath);
  }
  return written;
}
