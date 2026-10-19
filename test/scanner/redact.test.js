import { describe, it, expect } from "vitest";
import { loadSecretPatterns } from "../../src/scanner/secret-patterns.js";
import { redactSecretLines, isExcludedSecretFile } from "../../src/scanner/redact.js";

describe("redactSecretLines", () => {
  it("redacts a line containing a planted fake API key", async () => {
    const { linePatterns } = await loadSecretPatterns();
    const content = [
      "const config = {};",
      // Deliberately NOT shaped like a real provider's live-key prefix -
      // GitHub's push protection flags those even in test fixtures. This
      // still exercises the generic "api_key = ..." line pattern without
      // tripping that scanner.
      "const apiKey = 'TEST-PLACEHOLDER-NOT-A-REAL-SECRET-0000000000';",
      "console.log('done');"
    ].join("\n");

    const redacted = redactSecretLines(content, linePatterns);

    expect(redacted).not.toMatch(/NOT-A-REAL-SECRET/);
    expect(redacted).toMatch(/REDACTED LINE/);
    expect(redacted).toMatch(/const config = \{\};/); // unrelated lines untouched
  });

  it("leaves ordinary code untouched", async () => {
    const { linePatterns } = await loadSecretPatterns();
    const content = "export function add(a, b) { return a + b; }";
    expect(redactSecretLines(content, linePatterns)).toBe(content);
  });
});

describe("isExcludedSecretFile", () => {
  it("excludes conventional secret file paths", async () => {
    const { excludedFileGlobs } = await loadSecretPatterns();

    expect(isExcludedSecretFile(".env", excludedFileGlobs)).toBe(true);
    expect(isExcludedSecretFile(".env.production", excludedFileGlobs)).toBe(true);
    expect(isExcludedSecretFile("certs/server.pem", excludedFileGlobs)).toBe(true);
    expect(isExcludedSecretFile("config/secrets/db.json", excludedFileGlobs)).toBe(true);
  });

  it("does not exclude ordinary source files", async () => {
    const { excludedFileGlobs } = await loadSecretPatterns();

    expect(isExcludedSecretFile("src/index.js", excludedFileGlobs)).toBe(false);
    expect(isExcludedSecretFile("README.md", excludedFileGlobs)).toBe(false);
  });
});
