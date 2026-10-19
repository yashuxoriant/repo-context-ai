import { REQUIRED_SECTIONS } from "./template.js";

/**
 * Validates that generated content contains every required section header,
 * in order, flagging a malformed generation result instead of silently
 * accepting it (spec: "Fixed-schema context file generation" - implemented
 * as a guard against a model skipping or reordering sections).
 */
export function validateGeneratedContent(content) {
  const headerRegex = /^##\s+(.+?)\s*$/gm;
  const found = [...content.matchAll(headerRegex)].map((m) => m[1].trim());

  const missing = REQUIRED_SECTIONS.filter((section) => !found.includes(section));
  if (missing.length > 0) {
    return { valid: false, reason: `Missing required section(s): ${missing.join(", ")}` };
  }

  // Order check: each required section's first occurrence must appear in
  // the same relative order as REQUIRED_SECTIONS.
  const foundRequiredInOrder = found.filter((h) => REQUIRED_SECTIONS.includes(h));
  const expectedOrder = REQUIRED_SECTIONS.filter((s) => foundRequiredInOrder.includes(s));
  const isOrdered = foundRequiredInOrder.every((h, i) => h === expectedOrder[i]);

  if (!isOrdered) {
    return { valid: false, reason: "Required sections are present but out of order" };
  }

  return { valid: true };
}
