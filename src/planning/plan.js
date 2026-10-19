import { readFile } from "node:fs/promises";
import path from "node:path";
import { scanRepository } from "../scanner/index.js";

/**
 * Renders the planning prompt: grounded in the repository's approved
 * context file and current scan, plus the ticket's extracted details.
 * Expects the model to return a JSON object: { approach: string, files:
 * string[] } - files are relative paths within the target repository.
 */
export function renderPlanningPrompt({ ticketDetails, approvedContextContent, bundle }) {
  return [
    "You are planning a code change for an engineering ticket. You have",
    "access to this repository's APPROVED context file (architecture,",
    "conventions) and a fresh scan of its current structure.",
    "",
    "Return ONLY a JSON object with this exact shape, no other text:",
    '{ "approach": "<1-3 sentence description of the implementation approach>",',
    '  "files": ["<relative file path>", ...] }',
    "",
    "Every path in \"files\" MUST be a relative path within this repository.",
    "Do not include paths starting with \"..\" or absolute paths.",
    "",
    `Ticket: ${ticketDetails.id} - ${ticketDetails.title}`,
    `Description: ${ticketDetails.description}`,
    `Acceptance criteria: ${JSON.stringify(ticketDetails.acceptanceCriteria)}`,
    "",
    "--- Approved repository context ---",
    approvedContextContent,
    "",
    "--- Current repository scan (directory tree) ---",
    JSON.stringify(bundle.tree, null, 2)
  ].join("\n");
}

/**
 * Validates that every file path in a plan is relative and stays within
 * the repository root - the enforcement mechanism behind spec requirement
 * "Plan scope is bounded to the ticket's linked repository".
 */
export function validatePlanScope(plan, repoRoot) {
  for (const relativePath of plan.files) {
    if (path.isAbsolute(relativePath)) {
      return { valid: false, reason: `Plan includes an absolute path: ${relativePath}` };
    }
    const resolved = path.resolve(repoRoot, relativePath);
    if (!resolved.startsWith(path.resolve(repoRoot) + path.sep) && resolved !== path.resolve(repoRoot)) {
      return { valid: false, reason: `Plan includes a path outside the repository: ${relativePath}` };
    }
  }
  return { valid: true };
}

/**
 * Generates and validates an implementation plan for a ticket. Callers are
 * expected to have already run checkApprovedContext() and assessAmbiguity()
 * - this function does not re-check those preconditions itself.
 */
export async function generatePlan({ ticketDetails, repoRoot, callModel, outputPaths }) {
  const approvedContextContent = await readFile(
    path.join(repoRoot, outputPaths?.canonical ?? "CONTEXT.md"),
    "utf8"
  );
  const scanResult = await scanRepository(repoRoot);
  if (!scanResult.allowed) {
    throw new Error(`Cannot plan: access denied for ${repoRoot} (${scanResult.reason})`);
  }

  const prompt = renderPlanningPrompt({ ticketDetails, approvedContextContent, bundle: scanResult.bundle });
  const rawResponse = await callModel(prompt);

  let plan;
  try {
    plan = JSON.parse(rawResponse);
  } catch {
    throw new Error("Planning model did not return valid JSON");
  }
  if (!plan.approach || !Array.isArray(plan.files)) {
    throw new Error('Planning model response missing required "approach" or "files" fields');
  }

  const scopeCheck = validatePlanScope(plan, repoRoot);
  if (!scopeCheck.valid) {
    throw new Error(`Plan rejected: ${scopeCheck.reason}`);
  }

  return plan;
}
