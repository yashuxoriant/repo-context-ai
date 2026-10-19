import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { buildDirectoryTree, readCoreSignals } from "../../src/scanner/structure.js";

const FIXTURE_ROOT = path.dirname(
  fileURLToPath(new URL("../fixtures/sample-repo/package.json", import.meta.url))
);

describe("buildDirectoryTree", () => {
  it("excludes node_modules and dotfiles/dirs while including real source dirs", async () => {
    const tree = await buildDirectoryTree(FIXTURE_ROOT, { maxDepth: 2 });
    const names = tree.map((n) => n.name);

    expect(names).toContain("src");
    expect(names).not.toContain("node_modules");
    expect(names).not.toContain(".github");
  });
});

describe("readCoreSignals", () => {
  it("reads README, manifest, and CI config when all are present", async () => {
    const signals = await readCoreSignals(FIXTURE_ROOT);

    expect(signals.readme).toMatch(/Sample Repo/);
    expect(signals.manifests["package.json"]).toMatch(/sample-repo/);
    expect(signals.ciConfig).not.toBeNull();
    expect(Object.keys(signals.ciConfig).some((k) => k.includes("ci.yml"))).toBe(true);
  });

  it("marks CI config as absent (null) when no CI files exist", async () => {
    const dir = path.join(FIXTURE_ROOT, "src"); // a subdir with no CI config / manifest
    const signals = await readCoreSignals(dir);

    expect(signals.ciConfig).toBeNull();
    expect(signals.readme).toBeNull();
  });
});
