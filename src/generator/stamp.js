/**
 * Stamps (or re-stamps) the "## Last Validated" section with generation
 * metadata and draft/approved status (spec: "Draft status stamping until
 * human approval"). The generator ALWAYS writes draft status - only the
 * context-refresh-pipeline's merge step is allowed to transition a file
 * to approved (spec: "Status transition on approval").
 */
export function stampLastValidated(content, { generatedAt, commitSha, status = "draft", approvedCommit }) {
  const lines = [
    "## Last Validated",
    "",
    `Generated: ${generatedAt}`,
    `Commit: ${commitSha}`,
    status === "draft"
      ? "Status: DRAFT - pending engineer review"
      : `Status: APPROVED (merge commit: ${approvedCommit})`
  ].join("\n");

  const sectionRegex = /## Last Validated[\s\S]*$/;
  if (sectionRegex.test(content)) {
    return content.replace(sectionRegex, lines);
  }
  return `${content.trimEnd()}\n\n${lines}\n`;
}

/**
 * Returns true when the only difference between two stamped documents is
 * the Last Validated section's generation metadata (date/commit), used by
 * the refresh pipeline to skip opening a no-op pull request (spec:
 * "No pull request is opened when there is no meaningful difference").
 */
export function isOnlyMetadataDifference(previousContent, nextContent) {
  const strip = (content) => content.replace(/## Last Validated[\s\S]*$/, "").trimEnd();
  return strip(previousContent) === strip(nextContent);
}
