import { readFile } from "node:fs/promises";
import path from "node:path";

async function readIfExists(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

/**
 * Reads a repository's generated CONTEXT.md (if present) and classifies its
 * rollout status, so the progress dashboard reflects real repository state
 * rather than hand-maintained data. Mirrors the status vocabulary used by
 * the context-refresh-pipeline capability (draft / approved).
 */
export async function readRepositoryContextStatus(repoRoot, outputPaths = { canonical: "CONTEXT.md" }) {
  const content = await readIfExists(path.join(repoRoot, outputPaths.canonical));
  if (content === null) {
    return { status: "not_started", lastValidated: null };
  }

  const generatedMatch = content.match(/Generated: (.+)/);
  const isApproved = /Status: APPROVED/.test(content);

  return {
    status: isApproved ? "approved" : "draft_pending_review",
    lastValidated: generatedMatch?.[1]?.trim() ?? null
  };
}

/**
 * Builds the full rollout-status data set (same shape consumed by
 * scripts/build-dashboard.mjs) from a list of local repository checkouts,
 * e.g. [{ name: "payments-service", repoRoot: "/path/to/checkout" }, ...].
 */
export async function computeRolloutStatus(repositories, targets) {
  const results = [];
  for (const repo of repositories) {
    const { status, lastValidated } = await readRepositoryContextStatus(repo.repoRoot);
    results.push({ name: repo.name, status, lastValidated, prUrl: repo.prUrl ?? null });
  }

  return {
    generatedAt: new Date().toISOString(),
    targets: targets ?? { coveragePercent: 100, stalenessDaysMax: 30 },
    repositories: results
  };
}
