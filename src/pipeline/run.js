import { readFile } from "node:fs/promises";
import path from "node:path";
import { scanRepository } from "../scanner/index.js";
import { generateContextFile } from "../generator/index.js";
import { DEFAULT_OUTPUT_PATHS } from "../generator/write.js";
import { isOnlyMetadataDifference } from "../generator/stamp.js";

async function readIfExists(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

/**
 * Runs scanner -> generator against a repository checkout and determines
 * whether the result represents a meaningful change worth opening a review
 * pull request for (spec: "No pull request is opened when there is no
 * meaningful difference"). This function only writes to the working tree -
 * branching, committing, and opening the pull request are the calling
 * GitHub Actions workflow's responsibility, which keeps this module
 * testable without any git/GitHub API dependency and keeps the "never
 * auto-merge" guarantee entirely outside this code path (spec: "Mandatory
 * human review before adoption").
 */
export async function runContextRefresh({
  repoRoot,
  repoName,
  commitSha,
  callModel,
  outputPaths = DEFAULT_OUTPUT_PATHS,
  now
}) {
  const previousContent = await readIfExists(path.join(repoRoot, outputPaths.canonical));

  const scanResult = await scanRepository(repoRoot);
  if (!scanResult.allowed) {
    return { changed: false, skippedReason: `access denied: ${scanResult.reason}` };
  }

  const { content, writtenPaths } = await generateContextFile({
    repoRoot,
    repoName,
    commitSha,
    bundle: scanResult.bundle,
    callModel,
    outputPaths,
    ...(now ? { now } : {})
  });

  if (previousContent !== null && isOnlyMetadataDifference(previousContent, content)) {
    return { changed: false, skippedReason: "no meaningful difference from approved version", content };
  }

  return { changed: true, content, writtenPaths };
}
