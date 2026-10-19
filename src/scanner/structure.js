import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const DEFAULT_EXCLUDED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "out",
  "coverage",
  ".next",
  ".venv",
  "__pycache__"
]);

const MANIFEST_CANDIDATES = [
  "package.json",
  "pom.xml",
  "build.gradle",
  "requirements.txt",
  "pyproject.toml",
  "go.mod",
  "Gemfile",
  "composer.json"
];
MANIFEST_CANDIDATES.push(...["*.csproj"]); // handled separately (glob-like, see findCsproj)

const CI_CONFIG_PATHS = [".github/workflows", "azure-pipelines.yml", ".gitlab-ci.yml", "Jenkinsfile"];

/**
 * Builds a depth-limited directory tree, excluding build/dependency
 * artifacts, as specified in repo-scanner's "Structured repository signal
 * extraction" requirement.
 */
export async function buildDirectoryTree(rootDir, { maxDepth = 2 } = {}) {
  async function walk(dir, depth) {
    if (depth > maxDepth) return [];
    const entries = await readdir(dir, { withFileTypes: true });
    const nodes = [];
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (DEFAULT_EXCLUDED_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
        const children = await walk(path.join(dir, entry.name), depth + 1);
        nodes.push({ name: entry.name, type: "dir", children });
      } else {
        nodes.push({ name: entry.name, type: "file" });
      }
    }
    return nodes;
  }

  return walk(rootDir, 1);
}

async function readIfExists(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function findCsproj(rootDir) {
  const entries = await readdir(rootDir, { withFileTypes: true });
  const match = entries.find((e) => e.isFile() && e.name.endsWith(".csproj"));
  return match ? match.name : null;
}

/**
 * Reads README, manifest file(s), and CI configuration present at the
 * repository root. Missing optional inputs are marked absent rather than
 * causing failure (spec: "Scan handles a repository missing optional
 * inputs").
 */
export async function readCoreSignals(rootDir) {
  const readme = await readIfExists(path.join(rootDir, "README.md"));

  const manifests = {};
  for (const name of MANIFEST_CANDIDATES) {
    if (name === "*.csproj") continue;
    const content = await readIfExists(path.join(rootDir, name));
    if (content !== null) manifests[name] = content;
  }
  const csprojName = await findCsproj(rootDir);
  if (csprojName) {
    manifests[csprojName] = await readIfExists(path.join(rootDir, csprojName));
  }

  const ciConfig = {};
  for (const ciPath of CI_CONFIG_PATHS) {
    const fullPath = path.join(rootDir, ciPath);
    try {
      const info = await stat(fullPath);
      if (info.isDirectory()) {
        const files = await readdir(fullPath);
        for (const f of files) {
          ciConfig[path.posix.join(ciPath, f)] = await readIfExists(path.join(fullPath, f));
        }
      } else {
        ciConfig[ciPath] = await readIfExists(fullPath);
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      // not present - leave unset, consistent with "mark field absent"
    }
  }

  return {
    readme,
    manifests,
    ciConfig: Object.keys(ciConfig).length > 0 ? ciConfig : null
  };
}
