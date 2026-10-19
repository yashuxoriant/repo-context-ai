import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const execFileAsync = promisify(execFile);

const SOURCE_EXTENSIONS = new Set([
  ".js",
  ".ts",
  ".jsx",
  ".tsx",
  ".py",
  ".java",
  ".cs",
  ".go",
  ".rb",
  ".php"
]);

const DEFAULT_EXCLUDED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "out",
  "coverage"
]);

/**
 * Returns the N most frequently changed files in `rootDir` over
 * `sinceMonths` months of git history, most-changed first (spec:
 * "Structured repository signal extraction").
 */
export async function findHotFiles(rootDir, { sinceMonths = 6, limit = 15 } = {}) {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["-C", rootDir, "log", `--since=${sinceMonths} months ago`, "--name-only", "--pretty=format:"],
      { maxBuffer: 10 * 1024 * 1024 }
    );

    const counts = new Map();
    for (const line of stdout.split(/\r?\n/)) {
      const file = line.trim();
      if (!file) continue;
      counts.set(file, (counts.get(file) ?? 0) + 1);
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([file, count]) => ({ file, changeCount: count }));
  } catch {
    // Not a git repository, or git unavailable - return an empty, non-fatal result.
    return [];
  }
}

async function walkFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (DEFAULT_EXCLUDED_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
      files.push(...(await walkFiles(fullPath)));
    } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Returns the N largest source files by line count, largest first (spec:
 * "Structured repository signal extraction").
 */
export async function findLargestFiles(rootDir, { limit = 10 } = {}) {
  const files = await walkFiles(rootDir);
  const sized = await Promise.all(
    files.map(async (filePath) => {
      const content = await readFile(filePath, "utf8");
      const lineCount = content.split(/\r?\n/).length;
      return { file: path.relative(rootDir, filePath), lineCount };
    })
  );

  return sized.sort((a, b) => b.lineCount - a.lineCount).slice(0, limit);
}
