import { REQUIRED_SECTIONS } from "../../src/generator/template.js";

/** Builds a minimal, schema-valid generated document for tests. */
export function buildSampleGeneratedDocument(overrides = {}) {
  const sections = REQUIRED_SECTIONS.map((name) => `## ${name}\n${overrides[name] ?? "stub content"}`);
  return sections.join("\n\n");
}
