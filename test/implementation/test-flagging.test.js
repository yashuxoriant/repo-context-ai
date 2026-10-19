import { describe, it, expect } from "vitest";
import { flagAiAuthoredTests } from "../../src/implementation/test-flagging.js";

describe("flagAiAuthoredTests", () => {
  it("identifies test files among a list of written paths", () => {
    const flagged = flagAiAuthoredTests(["src/index.js", "test/index.test.js", "src/helper.js"]);
    expect(flagged).toEqual(["test/index.test.js"]);
  });

  it("returns an empty list when no test files were written", () => {
    expect(flagAiAuthoredTests(["src/index.js", "src/helper.js"])).toEqual([]);
  });
});
