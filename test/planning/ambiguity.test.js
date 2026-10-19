import { describe, it, expect } from "vitest";
import { assessAmbiguity } from "../../src/planning/ambiguity.js";

describe("assessAmbiguity", () => {
  it("flags absent acceptance criteria as ambiguous", () => {
    const result = assessAmbiguity({ acceptanceCriteria: null });
    expect(result.ambiguous).toBe(true);
    expect(result.reason).toMatch(/No acceptance criteria/);
  });

  it("flags an empty acceptance criteria list as ambiguous", () => {
    const result = assessAmbiguity({ acceptanceCriteria: [] });
    expect(result.ambiguous).toBe(true);
  });

  it("flags a too-vague criterion as ambiguous", () => {
    const result = assessAmbiguity({ acceptanceCriteria: ["make it better"] });
    expect(result.ambiguous).toBe(true);
    expect(result.reason).toMatch(/too vague/);
  });

  it("accepts concrete, checkable acceptance criteria as unambiguous", () => {
    const result = assessAmbiguity({
      acceptanceCriteria: [
        "Running `node src/index.js healthz` prints a JSON object with status: ok and exits 0",
        "The command requires no network access and no model credentials"
      ]
    });
    expect(result.ambiguous).toBe(false);
  });
});
