import { isTestFile } from "./classify.js";

/**
 * Generates file contents for every path in the plan, calling the
 * provider-agnostic model once per file with a role-specific prompt
 * (implementation vs. test) so a real model can tell the two apart - the
 * mock provider used for demos ignores prompt content and returns its
 * fixed response, which is expected and fine for demo/skeleton purposes
 * (spec: "Tests are written alongside the implementation").
 */
export async function generateFileContents({ plan, callModel }) {
  const contentByPath = new Map();

  for (const relativePath of plan.files) {
    const role = isTestFile(relativePath) ? "test" : "implementation";
    const prompt = [
      `Role: ${role}`,
      `File: ${relativePath}`,
      `Implementation approach: ${plan.approach}`,
      role === "test"
        ? "Write a test file covering the behavior described in the approach above."
        : "Write the implementation code described in the approach above."
    ].join("\n");

    const content = await callModel(prompt);
    contentByPath.set(relativePath, content);
  }

  return contentByPath;
}
