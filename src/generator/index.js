import { renderGenerationPrompt } from "./template.js";
import { validateGeneratedContent } from "./validate.js";
import { stampLastValidated } from "./stamp.js";
import { writeContextFile, DEFAULT_OUTPUT_PATHS } from "./write.js";

/**
 * Runs the full context-generator pipeline: render prompt -> call model ->
 * validate schema -> stamp draft status -> write canonical + mirrored
 * files. Throws on invalid model output rather than writing a malformed
 * file, since a malformed context file is worse than no context file.
 */
export async function generateContextFile({
  repoRoot,
  repoName,
  commitSha,
  bundle,
  callModel,
  outputPaths = DEFAULT_OUTPUT_PATHS,
  now = () => new Date().toISOString()
}) {
  const prompt = renderGenerationPrompt({ repoName, commitSha, bundle });
  const rawContent = await callModel(prompt);

  const validation = validateGeneratedContent(rawContent);
  if (!validation.valid) {
    throw new Error(`Generated context file failed validation: ${validation.reason}`);
  }

  const stamped = stampLastValidated(rawContent, {
    generatedAt: now(),
    commitSha,
    status: "draft"
  });

  const writtenPaths = await writeContextFile(repoRoot, stamped, outputPaths);

  return { content: stamped, writtenPaths };
}

export { renderGenerationPrompt, validateGeneratedContent, stampLastValidated, writeContextFile };
export { REQUIRED_SECTIONS } from "./template.js";
export { createOpenAiCompatibleProvider, createMockProvider } from "./model.js";
export { isOnlyMetadataDifference } from "./stamp.js";
