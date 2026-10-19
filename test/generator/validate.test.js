import { describe, it, expect } from "vitest";
import { validateGeneratedContent } from "../../src/generator/validate.js";
import { buildSampleGeneratedDocument } from "./fixtures.js";

describe("validateGeneratedContent", () => {
  it("accepts a document with all ten required sections in order", () => {
    const doc = buildSampleGeneratedDocument();
    expect(validateGeneratedContent(doc)).toEqual({ valid: true });
  });

  it("flags a missing required section", () => {
    const doc = "## Overview\nstub\n\n## Architecture\nstub"; // missing most sections
    const result = validateGeneratedContent(doc);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/Missing required section/);
  });

  it("flags sections that are present but out of order", () => {
    const doc = [
      "## Architecture\nstub",
      "## Overview\nstub",
      "## Setup & Local Dev\nstub",
      "## Key Modules / Directories\nstub",
      "## Coding Conventions\nstub",
      "## Dependencies\nstub",
      "## Important Files\nstub",
      "## Known Constraints / Gotchas\nstub",
      "## Ownership\nstub",
      "## Last Validated\nstub"
    ].join("\n\n");

    const result = validateGeneratedContent(doc);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/out of order/);
  });
});
