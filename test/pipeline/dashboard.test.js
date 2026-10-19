import { describe, it, expect } from "vitest";
import { daysSince, computeSummary, renderDashboard, escapeHtml } from "../../src/pipeline/dashboard.js";

const NOW = new Date("2026-10-19T00:00:00.000Z").getTime();

const sampleData = {
  generatedAt: "2026-10-19T00:00:00.000Z",
  targets: { coveragePercent: 100, stalenessDaysMax: 30 },
  repositories: [
    { name: "repo-a", status: "approved", lastValidated: "2026-10-10T00:00:00.000Z", prUrl: null },
    { name: "repo-b", status: "draft_pending_review", lastValidated: "2026-10-18T00:00:00.000Z", prUrl: "https://example.test/pr/1" },
    { name: "repo-c", status: "not_started", lastValidated: null, prUrl: null },
    { name: "repo-d-stale", status: "approved", lastValidated: "2026-08-01T00:00:00.000Z", prUrl: null }
  ]
};

describe("daysSince", () => {
  it("computes whole days between a timestamp and now", () => {
    expect(daysSince("2026-10-10T00:00:00.000Z", NOW)).toBe(9);
  });

  it("returns null for a missing timestamp", () => {
    expect(daysSince(null, NOW)).toBeNull();
  });
});

describe("computeSummary", () => {
  it("computes coverage, pending, not-started, and average staleness", () => {
    const summary = computeSummary(sampleData, NOW);

    expect(summary.total).toBe(4);
    expect(summary.approved).toBe(2);
    expect(summary.pending).toBe(1);
    expect(summary.notStarted).toBe(1);
    expect(summary.coveragePercent).toBe(50); // 2/4 approved
  });
});

describe("renderDashboard", () => {
  it("renders a self-contained HTML document including every repository and summary figures", () => {
    const html = renderDashboard(sampleData, NOW);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("repo-a");
    expect(html).toContain("repo-b");
    expect(html).toContain("repo-c");
    expect(html).toContain("50%"); // coverage
    expect(html).toContain("Pending Review");
    expect(html).toContain("Not Started");
  });

  it("flags a repository whose staleness exceeds the configured target", () => {
    const html = renderDashboard(sampleData, NOW);
    // repo-d-stale was validated ~79 days ago, exceeding the 30-day target
    expect(html).toMatch(/class="stale">79 day\(s\)/);
  });

  it("escapes HTML-significant characters in repository names to avoid injection", () => {
    const html = renderDashboard(
      {
        ...sampleData,
        repositories: [{ name: "<script>alert(1)</script>", status: "not_started", lastValidated: null, prUrl: null }]
      },
      NOW
    );
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("escapeHtml", () => {
  it("escapes the standard set of HTML-significant characters", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  });
});
