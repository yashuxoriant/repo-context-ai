# `repo-scanner`

Extracts a structured, redacted signal bundle from a repository for use as the
**only** input to the `context-generator` capability. See
`openspec/changes/add-codebase-context-generation/specs/repo-scanner/spec.md`
for the full behavior contract.

## Usage

```js
import { scanRepository } from "../src/scanner/index.js";

const result = await scanRepository("/path/to/local/repo/checkout");

if (!result.allowed) {
  console.error("Access denied:", result.reason);
} else {
  console.log(result.bundle);
  // {
  //   tree: [...],
  //   readme: "...",
  //   manifests: { "package.json": "..." },
  //   ciConfig: { ".github/workflows/ci.yml": "..." } | null,
  //   hotFiles: [{ file, changeCount }, ...],
  //   largestFiles: [{ file, lineCount }, ...]
  // }
}
```

## What it does

1. **Access check** (`access.js`) - confirms the invoking identity can read the
   target repository using the identity's existing git/CI credentials. No new
   auth mechanism is introduced.
2. **Structural scan** (`structure.js`) - builds a depth-limited directory tree
   (excluding `node_modules`, `.git`, `dist`, `build`, etc.) and reads
   README/manifest/CI-config content, marking anything missing as absent
   rather than failing.
3. **History scan** (`history.js`) - computes the most-frequently-changed
   files (via `git log`) and the largest source files by line count.
4. **Redaction** (`redact.js`, `secret-patterns.js`) - before any content
   leaves the scanner: lines matching a secret/credential pattern are
   replaced with a redaction marker, and whole files matching conventional
   secret-file paths (`.env*`, `*.pem`, `*.key`, `**/secrets/**`, etc.) are
   excluded entirely. Patterns are defined in `config/secret-patterns.json`
   so they can be reviewed/updated independently of code.

## Options

- `maxDepth` (default `2`) - directory tree depth limit
- `sinceMonths` (default `6`) - how far back to look for "hot files"
- `limit` (default `15` for hot files, `10` for largest files) - max items returned
- `secretPatternsPath` - override path to the redaction config (for testing)
