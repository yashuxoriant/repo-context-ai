import { describe, it, expect } from "vitest";
import { generateFileContents } from "../../src/implementation/content-generation.js";
import { createMockProvider } from "../../src/generator/model.js";

describe("generateFileContents", () => {
  it("generates content for every file in the plan, including test files", async () => {
    const plan = {
      approach: "Add a healthz command",
      files: ["src/index.js", "test/index.test.js"]
    };
    const callModel = createMockProvider("stub content");

    const contentByPath = await generateFileContents({ plan, callModel });

    expect(contentByPath.size).toBe(2);
    expect(contentByPath.has("src/index.js")).toBe(true);
    expect(contentByPath.has("test/index.test.js")).toBe(true);
    expect(contentByPath.get("test/index.test.js")).toBe("stub content");
  });

  it("produces at least one test file's content for a plan that includes one", async () => {
    const plan = { approach: "approach", files: ["src/a.js", "src/a.test.js"] };
    const contentByPath = await generateFileContents({ plan, callModel: createMockProvider("x") });

    const testFiles = [...contentByPath.keys()].filter((p) => p.includes(".test."));
    expect(testFiles.length).toBeGreaterThan(0);
  });
});
