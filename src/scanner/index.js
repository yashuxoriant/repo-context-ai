import { checkRepositoryAccess } from "./access.js";
import { buildDirectoryTree, readCoreSignals } from "./structure.js";
import { findHotFiles, findLargestFiles } from "./history.js";
import { loadSecretPatterns } from "./secret-patterns.js";
import { redactSecretLines, isExcludedSecretFile } from "./redact.js";

/**
 * Runs the full repo-scanner pipeline against a local repository checkout:
 * access check -> structural/core-signal extraction -> history signals ->
 * secret redaction/exclusion. Returns the structured bundle the
 * context-generator capability consumes as its only input (design.md -
 * "Scanning approach").
 */
export async function scanRepository(rootDir, options = {}) {
  const access = await checkRepositoryAccess({ kind: "local", path: rootDir });
  if (!access.allowed) {
    return { allowed: false, reason: access.reason, bundle: null };
  }

  const { linePatterns, excludedFileGlobs } = await loadSecretPatterns(options.secretPatternsPath);

  const [tree, coreSignals, hotFiles, largestFiles] = await Promise.all([
    buildDirectoryTree(rootDir, options),
    readCoreSignals(rootDir),
    findHotFiles(rootDir, options),
    findLargestFiles(rootDir, options)
  ]);

  // Apply whole-file exclusion + line redaction to README and manifest text,
  // since those are read verbatim and could themselves contain pasted secrets.
  const redactText = (relativePath, content) => {
    if (content === null) return null;
    if (isExcludedSecretFile(relativePath, excludedFileGlobs)) return null;
    return redactSecretLines(content, linePatterns);
  };

  const redactedManifests = {};
  for (const [name, content] of Object.entries(coreSignals.manifests)) {
    redactedManifests[name] = redactText(name, content);
  }

  let redactedCiConfig = null;
  if (coreSignals.ciConfig) {
    redactedCiConfig = {};
    for (const [name, content] of Object.entries(coreSignals.ciConfig)) {
      redactedCiConfig[name] = redactText(name, content);
    }
  }

  return {
    allowed: true,
    bundle: {
      tree,
      readme: redactText("README.md", coreSignals.readme),
      manifests: redactedManifests,
      ciConfig: redactedCiConfig,
      hotFiles,
      largestFiles
    }
  };
}

export { checkRepositoryAccess, buildDirectoryTree, readCoreSignals, findHotFiles, findLargestFiles };
