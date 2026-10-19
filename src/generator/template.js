/**
 * Fixed ten-section schema required by the context-generator capability
 * (spec: "Fixed-schema context file generation"). Order matters - this is
 * the authoritative source for both prompt rendering and output validation.
 */
export const REQUIRED_SECTIONS = [
  "Overview",
  "Architecture",
  "Setup & Local Dev",
  "Key Modules / Directories",
  "Coding Conventions",
  "Dependencies",
  "Important Files",
  "Known Constraints / Gotchas",
  "Ownership",
  "Last Validated"
];

const NOT_EVIDENT_NOTE =
  'If something is unclear or not evident from the input, write "Not evident from available files - needs engineer input" rather than guessing.';

/**
 * Renders the generation prompt for a single repository from its scanner
 * bundle. Keeps the model call itself out of this module so the prompt
 * can be unit-tested without invoking any model (design.md - "generation
 * step behind a small internal interface").
 */
export function renderGenerationPrompt({ repoName, commitSha, bundle }) {
  const sectionList = REQUIRED_SECTIONS.map((s, i) => `${i + 1}. ${s}`).join("\n");

  return [
    "You are generating a repository context file for engineers and AI coding assistants.",
    "Base every statement ONLY on the evidence provided below. Do not invent architecture,",
    "conventions, or dependencies not supported by this evidence.",
    NOT_EVIDENT_NOTE,
    "",
    `Output must contain exactly these sections, in this order:\n${sectionList}`,
    "",
    `Repository: ${repoName}`,
    `Commit: ${commitSha}`,
    "",
    "--- Directory tree ---",
    JSON.stringify(bundle.tree, null, 2),
    "",
    "--- README ---",
    bundle.readme ?? "(not present)",
    "",
    "--- Manifests ---",
    JSON.stringify(bundle.manifests, null, 2),
    "",
    "--- CI configuration ---",
    bundle.ciConfig ? JSON.stringify(bundle.ciConfig, null, 2) : "(not present)",
    "",
    "--- Most frequently changed files ---",
    JSON.stringify(bundle.hotFiles, null, 2),
    "",
    "--- Largest source files ---",
    JSON.stringify(bundle.largestFiles, null, 2)
  ].join("\n");
}
