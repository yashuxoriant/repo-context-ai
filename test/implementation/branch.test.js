import { describe, it, expect } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createFeatureBranch, writeScopedFiles } from "../../src/implementation/branch.js";

const execFileAsync = promisify(execFile);

async function makeGitRepo() {
  const dir = await mkdtemp(path.join(tmpdir(), "implementation-branch-"));
  await execFileAsync("git", ["init", "-q", dir]);
  await execFileAsync("git", ["-C", dir, "config", "user.email", "test@example.com"]);
  await execFileAsync("git", ["-C", dir, "config", "user.name", "Test"]);
  // need at least one commit for `checkout -b` to behave normally
  const { writeFile } = await import("node:fs/promises");
  await writeFile(path.join(dir, "README.md"), "# test repo", "utf8");
  await execFileAsync("git", ["-C", dir, "add", "-A"]);
  await execFileAsync("git", ["-C", dir, "commit", "-q", "-m", "initial"]);
  return dir;
}

describe("createFeatureBranch", () => {
  it("creates and checks out a new branch", async () => {
    const dir = await makeGitRepo();
    try {
      await createFeatureBranch(dir, "feature/demo-101");
      const { stdout } = await execFileAsync("git", ["-C", dir, "branch", "--show-current"]);
      expect(stdout.trim()).toBe("feature/demo-101");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe("writeScopedFiles", () => {
  it("writes every file listed in the plan", async () => {
    const dir = await makeGitRepo();
    try {
      const plan = { files: ["src/new-file.js", "test/new-file.test.js"] };
      const contentByPath = new Map([
        ["src/new-file.js", "export const x = 1;"],
        ["test/new-file.test.js", "test content"]
      ]);

      const written = await writeScopedFiles(dir, plan, contentByPath);
      expect(written.sort()).toEqual(["src/new-file.js", "test/new-file.test.js"].sort());
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("refuses to write a file outside the plan's listed scope", async () => {
    const dir = await makeGitRepo();
    try {
      const plan = { files: ["src/new-file.js"] };
      const contentByPath = new Map([
        ["src/new-file.js", "export const x = 1;"],
        ["src/unplanned-file.js", "export const y = 2;"]
      ]);

      await expect(writeScopedFiles(dir, plan, contentByPath)).rejects.toThrow(/outside the approved plan's scope/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
