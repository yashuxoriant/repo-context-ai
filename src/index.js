#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { runContextRefresh } from "./pipeline/run.js";
import { markContextApproved } from "./pipeline/approve.js";
import { createOpenAiCompatibleProvider, createMockProvider } from "./generator/model.js";
import { REQUIRED_SECTIONS } from "./generator/template.js";

const execFileAsync = promisify(execFile);

function readRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function buildDemoDocument(repoName) {
  const placeholders = {
    Overview: `${repoName} - demo-mode placeholder content (no real model credentials were configured for this run).`,
    Architecture: "Not evident from available files - needs engineer input (demo mode does not inspect real scan output).",
    "Setup & Local Dev": "Not evident from available files - needs engineer input.",
    "Key Modules / Directories": "Not evident from available files - needs engineer input.",
    "Coding Conventions": "Not evident from available files - needs engineer input.",
    Dependencies: "Not evident from available files - needs engineer input.",
    "Important Files": "Not evident from available files - needs engineer input.",
    "Known Constraints / Gotchas":
      "This file was generated in DEMO MODE using a scripted response, not a real model call. Set MODEL_ENDPOINT and MODEL_API_KEY secrets and re-run for genuine AI-generated content.",
    Ownership: "Not evident from available files - needs engineer input.",
    "Last Validated": "placeholder"
  };
  return REQUIRED_SECTIONS.map((name) => `## ${name}\n${placeholders[name]}`).join("\n\n");
}

async function currentCommitSha(repoRoot) {
  const { stdout } = await execFileAsync("git", ["-C", repoRoot, "rev-parse", "HEAD"]);
  return stdout.trim();
}

async function repoNameFromPackageJson(repoRoot) {
  try {
    const raw = await readFile(path.join(repoRoot, "package.json"), "utf8");
    return JSON.parse(raw).name ?? path.basename(repoRoot);
  } catch {
    return path.basename(repoRoot);
  }
}

async function runGenerateCommand() {
  const repoRoot = process.env.TARGET_REPO_PATH ?? process.cwd();
  const commitSha = process.env.GITHUB_SHA ?? (await currentCommitSha(repoRoot));
  const repoName = process.env.GITHUB_REPOSITORY ?? (await repoNameFromPackageJson(repoRoot));

  let callModel;
  if (process.env.MODEL_ENDPOINT && process.env.MODEL_API_KEY) {
    callModel = createOpenAiCompatibleProvider({
      endpoint: process.env.MODEL_ENDPOINT,
      apiKey: process.env.MODEL_API_KEY,
      model: process.env.MODEL_NAME ?? "gpt-4o-mini"
    });
  } else {
    // DEMO MODE: no real model credentials configured. Falls back to a
    // scripted response so the pipeline (and the GitHub Actions workflow
    // that calls this command) can still be demoed end-to-end - validation,
    // draft stamping, mirroring, PR review, and the no-op diff-skip all
    // behave identically to the real path. This is NOT live AI-generated
    // content; replace MODEL_ENDPOINT/MODEL_API_KEY with real credentials
    // for genuine generation quality.
    console.warn(
      "WARNING: MODEL_ENDPOINT/MODEL_API_KEY not set - running in DEMO MODE with a scripted model response, not a real LLM call."
    );
    callModel = createMockProvider(buildDemoDocument(repoName));
  }

  const result = await runContextRefresh({ repoRoot, repoName, commitSha, callModel });

  if (result.changed) {
    console.log("changed=true");
    console.log(`Written: ${result.writtenPaths.join(", ")}`);
  } else {
    console.log("changed=false");
    console.log(`Reason: ${result.skippedReason}`);
  }

  // Emit a GitHub Actions output when running in that environment, so the
  // workflow can branch on whether to open a pull request.
  if (process.env.GITHUB_OUTPUT) {
    const { appendFile } = await import("node:fs/promises");
    await appendFile(process.env.GITHUB_OUTPUT, `changed=${result.changed}\n`);
  }
}

async function runApproveCommand() {
  const repoRoot = process.env.TARGET_REPO_PATH ?? process.cwd();
  const mergeCommit = readRequiredEnv("MERGE_COMMIT_SHA");

  const result = await markContextApproved({ repoRoot, mergeCommit });
  console.log(`Approved: ${result.updatedPaths.join(", ")}`);
}

const [, , command] = process.argv;

switch (command) {
  case "generate":
    await runGenerateCommand();
    break;
  case "approve":
    await runApproveCommand();
    break;
  default:
    console.error(`Unknown command: ${command ?? "(none)"}. Expected "generate" or "approve".`);
    process.exitCode = 1;
}
