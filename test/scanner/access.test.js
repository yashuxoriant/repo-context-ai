import { describe, it, expect } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { checkRepositoryAccess } from "../../src/scanner/access.js";

const execFileAsync = promisify(execFile);

describe("checkRepositoryAccess", () => {
  it("allows access to a readable local git repository", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "repo-scanner-access-"));
    try {
      await execFileAsync("git", ["init", "-q", dir]);
      const result = await checkRepositoryAccess({ kind: "local", path: dir });
      expect(result.allowed).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("denies access to a path that is not a git repository", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "repo-scanner-noaccess-"));
    try {
      const result = await checkRepositoryAccess({ kind: "local", path: dir });
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeTruthy();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
