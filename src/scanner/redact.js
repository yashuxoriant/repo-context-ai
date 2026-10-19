import path from "node:path";

const REDACTION_MARKER = "[REDACTED LINE - matched secret pattern]";

/**
 * Redacts individual lines matching any configured secret/credential
 * pattern (spec: repo-scanner "Secret and credential redaction").
 */
export function redactSecretLines(content, linePatterns) {
  return content
    .split(/\r?\n/)
    .map((line) => (linePatterns.some((p) => p.regex.test(line)) ? REDACTION_MARKER : line))
    .join("\n");
}

/**
 * Converts a glob-ish pattern (supporting `*` and `**`) to a RegExp for
 * matching relative file paths.
 */
function globToRegExp(glob) {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "\u0000DOUBLESTAR\u0000")
    .replace(/\*/g, "[^/]*")
    .replace(/\u0000DOUBLESTAR\u0000/g, ".*");
  return new RegExp(`^${escaped}$`, "i");
}

/**
 * Returns true when a relative file path matches any configured
 * secret-file convention and should be excluded entirely, not merely
 * redacted line-by-line (spec: "Files conventionally reserved for secrets
 * are excluded entirely").
 */
export function isExcludedSecretFile(relativePath, excludedFileGlobs) {
  const normalized = relativePath.split(path.sep).join("/");
  const basename = normalized.split("/").pop();

  return excludedFileGlobs.some((glob) => {
    const regex = globToRegExp(glob);
    // A glob with no directory separator (e.g. "*.pem") should match the
    // file anywhere in the tree, not only at the repository root.
    return glob.includes("/") ? regex.test(normalized) : regex.test(basename);
  });
}
