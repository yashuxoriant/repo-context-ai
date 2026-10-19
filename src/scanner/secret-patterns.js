import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const DEFAULT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../config/secret-patterns.json"
);

/**
 * Loads and parses the versioned secret-pattern config used by the scanner's
 * redaction step. Kept as a small loader so the config file remains the
 * single reviewable source of truth (see design.md - "Secret redaction").
 */
export async function loadSecretPatterns(configPath = DEFAULT_PATH) {
  const raw = await readFile(configPath, "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed.linePatterns) || !Array.isArray(parsed.excludedFileGlobs)) {
    throw new Error(
      `Invalid secret-patterns config at ${configPath}: expected "linePatterns" and "excludedFileGlobs" arrays`
    );
  }

  return {
    linePatterns: parsed.linePatterns.map((p) => ({
      name: p.name,
      regex: new RegExp(p.pattern, "i")
    })),
    excludedFileGlobs: parsed.excludedFileGlobs
  };
}
