/**
 * Provider-agnostic pull-request opener. Deliberately exposes ONLY
 * `openPullRequest()` - there is no merge method anywhere in this module or
 * anything that calls one, which is how "never auto-merges" (spec) is
 * enforced structurally rather than just by convention: the capability
 * literally has no code path that could merge a pull request.
 */

/**
 * In-memory mock provider for demos/tests - records every "opened" PR
 * without making any network call.
 */
export function createMockPrProvider() {
  const openedPullRequests = [];

  return {
    async openPullRequest({ repository, branchName, title, body }) {
      const pr = {
        number: openedPullRequests.length + 1,
        repository,
        branchName,
        title,
        body,
        state: "open"
      };
      openedPullRequests.push(pr);
      return pr;
    },

    /** Test/demo helper - not part of the provider interface itself. */
    _getOpenedPullRequests() {
      return [...openedPullRequests];
    }
  };
}
