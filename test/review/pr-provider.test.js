import { describe, it, expect } from "vitest";
import { createMockPrProvider } from "../../src/review/pr-provider.js";
import * as reviewModule from "../../src/review/index.js";

describe("createMockPrProvider", () => {
  it("records an opened pull request without any network call", async () => {
    const provider = createMockPrProvider();
    const pr = await provider.openPullRequest({
      repository: "yashuxoriant/repo-context-ai",
      branchName: "feature/demo-101",
      title: "DEMO-101: automated implementation",
      body: "body"
    });

    expect(pr.number).toBe(1);
    expect(pr.state).toBe("open");
    expect(provider._getOpenedPullRequests()).toHaveLength(1);
  });

  it("structurally has no merge capability - never auto-merges (spec requirement)", () => {
    const provider = createMockPrProvider();
    // The provider interface intentionally exposes only openPullRequest.
    expect(typeof provider.openPullRequest).toBe("function");
    expect(provider.mergePullRequest).toBeUndefined();
    expect(provider.approvePullRequest).toBeUndefined();
    expect(provider.merge).toBeUndefined();
  });
});

describe("change-review-pipeline module surface", () => {
  it("exports no merge-capable function anywhere in the capability", () => {
    const exportNames = Object.keys(reviewModule);
    const mergeLike = exportNames.filter((name) => /merge/i.test(name));
    expect(mergeLike).toEqual([]);
  });
});
