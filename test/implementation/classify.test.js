import { describe, it, expect } from "vitest";
import { isTestFile } from "../../src/implementation/classify.js";

describe("isTestFile", () => {
  it("recognizes common test file naming conventions", () => {
    expect(isTestFile("src/index.test.js")).toBe(true);
    expect(isTestFile("src/index.spec.ts")).toBe(true);
    expect(isTestFile("test/foo.js")).toBe(true);
    expect(isTestFile("tests/foo.js")).toBe(true);
  });

  it("does not misclassify ordinary source files", () => {
    expect(isTestFile("src/index.js")).toBe(false);
    expect(isTestFile("src/testing-utils.js")).toBe(false); // contains "test" but isn't a test file
  });
});
