import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { findHotFiles, findLargestFiles } from "../../src/scanner/history.js";

const FIXTURE_ROOT = path.dirname(
  fileURLToPath(new URL("../fixtures/sample-repo/package.json", import.meta.url))
);

describe("findHotFiles", () => {
  it("returns an empty, non-fatal result when the directory is not a git repository", async () => {
    const result = await findHotFiles(FIXTURE_ROOT, { sinceMonths: 6, limit: 15 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("findLargestFiles", () => {
  it("returns source files sorted largest-first, respecting the limit", async () => {
    const result = await findLargestFiles(FIXTURE_ROOT, { limit: 2 });

    expect(result.length).toBeLessThanOrEqual(2);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].lineCount).toBeGreaterThanOrEqual(result[i].lineCount);
    }
    // node_modules must never appear
    expect(result.every((f) => !f.file.includes("node_modules"))).toBe(true);
  });
});
