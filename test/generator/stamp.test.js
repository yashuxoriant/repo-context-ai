import { describe, it, expect } from "vitest";
import { stampLastValidated, isOnlyMetadataDifference } from "../../src/generator/stamp.js";
import { buildSampleGeneratedDocument } from "./fixtures.js";

describe("stampLastValidated", () => {
  it("stamps a freshly generated document as draft with date and commit", () => {
    const doc = buildSampleGeneratedDocument();
    const stamped = stampLastValidated(doc, { generatedAt: "2026-01-01T00:00:00.000Z", commitSha: "abc123" });

    expect(stamped).toMatch(/Generated: 2026-01-01T00:00:00\.000Z/);
    expect(stamped).toMatch(/Commit: abc123/);
    expect(stamped).toMatch(/Status: DRAFT - pending engineer review/);
  });

  it("stamps approved status with the merge commit once approved", () => {
    const doc = buildSampleGeneratedDocument();
    const stamped = stampLastValidated(doc, {
      generatedAt: "2026-01-01T00:00:00.000Z",
      commitSha: "abc123",
      status: "approved",
      approvedCommit: "def456"
    });

    expect(stamped).toMatch(/Status: APPROVED \(merge commit: def456\)/);
  });
});

describe("isOnlyMetadataDifference", () => {
  it("returns true when only the Last Validated stamp differs", () => {
    const doc = buildSampleGeneratedDocument();
    const first = stampLastValidated(doc, { generatedAt: "2026-01-01T00:00:00.000Z", commitSha: "abc" });
    const second = stampLastValidated(doc, { generatedAt: "2026-02-01T00:00:00.000Z", commitSha: "def" });

    expect(isOnlyMetadataDifference(first, second)).toBe(true);
  });

  it("returns false when non-metadata content also changed", () => {
    const docA = buildSampleGeneratedDocument({ Overview: "original overview" });
    const docB = buildSampleGeneratedDocument({ Overview: "changed overview" });
    const first = stampLastValidated(docA, { generatedAt: "2026-01-01T00:00:00.000Z", commitSha: "abc" });
    const second = stampLastValidated(docB, { generatedAt: "2026-01-01T00:00:00.000Z", commitSha: "abc" });

    expect(isOnlyMetadataDifference(first, second)).toBe(false);
  });
});
