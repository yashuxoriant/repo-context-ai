import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

/**
 * Default output paths relative to a repository root: one canonical file
 * plus the paths AI coding tools already read natively (spec: "Canonical
 * output with tool-specific mirroring").
 */
export const DEFAULT_OUTPUT_PATHS = {
  canonical: "CONTEXT.md",
  mirrors: [".github/copilot-instructions.md"]
};

/**
 * Writes the canonical context file and mirrors identical content to each
 * configured tool-specific path, so no copy can silently drift from
 * another.
 */
export async function writeContextFile(repoRoot, content, outputPaths = DEFAULT_OUTPUT_PATHS) {
  const allPaths = [outputPaths.canonical, ...outputPaths.mirrors];
  const written = [];

  for (const relativePath of allPaths) {
    const fullPath = path.join(repoRoot, relativePath);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content, "utf8");
    written.push(relativePath);
  }

  return written;
}
