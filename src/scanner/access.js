import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Checks whether the invoking identity has read access to the target
 * repository, by relying on the existing git/CI credential already
 * configured in the environment rather than introducing a new auth
 * mechanism (spec: repo-scanner "Repository access boundary enforcement").
 *
 * For a local git checkout, "access" means the path is a valid git
 * repository the current process can read. For a remote reference, it
 * means `git ls-remote` succeeds using the ambient credentials - a
 * failure (auth error, not found, no permission) is treated as denied.
 */
export async function checkRepositoryAccess(repoTarget) {
  try {
    if (repoTarget.kind === "local") {
      await execFileAsync("git", ["-C", repoTarget.path, "rev-parse", "--is-inside-work-tree"]);
      return { allowed: true };
    }

    if (repoTarget.kind === "remote") {
      await execFileAsync("git", ["ls-remote", "--exit-code", repoTarget.url]);
      return { allowed: true };
    }

    return { allowed: false, reason: `Unknown repository target kind: ${repoTarget.kind}` };
  } catch (error) {
    return { allowed: false, reason: error.message };
  }
}
