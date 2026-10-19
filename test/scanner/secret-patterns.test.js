import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { loadSecretPatterns } from "../../src/scanner/secret-patterns.js";

describe("loadSecretPatterns", () => {
  it("loads the versioned config and compiles line patterns to RegExp", async () => {
    const { linePatterns, excludedFileGlobs } = await loadSecretPatterns();

    expect(linePatterns.length).toBeGreaterThan(0);
    expect(excludedFileGlobs.length).toBeGreaterThan(0);
    for (const p of linePatterns) {
      expect(p.regex).toBeInstanceOf(RegExp);
      expect(typeof p.name).toBe("string");
    }
  });

  it("throws a clear error when the config is malformed", async () => {
    const fixturePath = fileURLToPath(
      new URL("../fixtures/invalid-secret-patterns.json", import.meta.url)
    );
    await expect(loadSecretPatterns(fixturePath)).rejects.toThrow(/Invalid secret-patterns config/);
  });
});
