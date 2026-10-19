import { describe, it, expect } from "vitest";
import { renderGenerationPrompt, REQUIRED_SECTIONS } from "../../src/generator/template.js";

describe("renderGenerationPrompt", () => {
  it("includes the fixed section list and grounding instruction, given a sample bundle", () => {
    const prompt = renderGenerationPrompt({
      repoName: "sample-repo",
      commitSha: "abc1234",
      bundle: {
        tree: [{ name: "src", type: "dir", children: [] }],
        readme: "# Sample Repo",
        manifests: { "package.json": '{"name":"sample-repo"}' },
        ciConfig: null,
        hotFiles: [],
        largestFiles: []
      }
    });

    for (const section of REQUIRED_SECTIONS) {
      expect(prompt).toContain(section);
    }
    expect(prompt).toMatch(/Do not invent/);
    expect(prompt).toMatch(/Not evident from available files/);
    expect(prompt).toContain("sample-repo");
    expect(prompt).toContain("abc1234");
  });
});
