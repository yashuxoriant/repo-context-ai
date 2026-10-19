import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function runNpmScript(repoRoot, scriptName) {
  try {
    const { stdout, stderr } = await execFileAsync("npm", ["run", scriptName], {
      cwd: repoRoot,
      shell: true // npm resolves to npm.cmd/npm.ps1 on Windows - needs shell resolution
    });
    return { passed: true, output: stdout + stderr };
  } catch (error) {
    return { passed: false, output: (error.stdout ?? "") + (error.stderr ?? "") + error.message };
  }
}

/**
 * Runs the target repository's OWN existing test suite and lint
 * configuration against the implementation branch - the pipeline does not
 * proceed to open a pull request if either fails (spec: "Pre-PR safety
 * gate").
 */
export async function runPreMergeChecks(repoRoot) {
  const test = await runNpmScript(repoRoot, "test");
  const lint = await runNpmScript(repoRoot, "lint");

  return {
    passed: test.passed && lint.passed,
    test,
    lint
  };
}
