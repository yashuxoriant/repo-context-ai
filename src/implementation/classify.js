/**
 * Shared test-file classification used by content-generation (which role
 * to generate for a given path), writeScopedFiles (no special behavior
 * needed there, but kept for consistency), and PR description flagging
 * (spec: "AI-authored tests require explicit human review").
 */
export function isTestFile(relativePath) {
  const normalized = relativePath.split("\\").join("/");
  return /\.(test|spec)\.[jt]sx?$/i.test(normalized) || /(^|\/)tests?\//i.test(normalized);
}
