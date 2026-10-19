import { describe, it, expect } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { writeContextFile } from "../../src/generator/write.js";

describe("writeContextFile", () => {
  it("writes identical content to the canonical path and every mirror path", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "generator-write-"));
    try {
      const content = "## Overview\nstub content";
      const written = await writeContextFile(dir, content, {
        canonical: "CONTEXT.md",
        mirrors: [".github/copilot-instructions.md", ".cursorrules"]
      });

      expect(written).toEqual(["CONTEXT.md", ".github/copilot-instructions.md", ".cursorrules"]);

      const canonical = await readFile(path.join(dir, "CONTEXT.md"), "utf8");
      const mirror1 = await readFile(path.join(dir, ".github/copilot-instructions.md"), "utf8");
      const mirror2 = await readFile(path.join(dir, ".cursorrules"), "utf8");

      expect(canonical).toBe(content);
      expect(mirror1).toBe(content);
      expect(mirror2).toBe(content);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
