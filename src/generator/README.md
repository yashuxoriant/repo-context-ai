# `context-generator`

Turns a `repo-scanner` signal bundle into the standardized, fixed-schema context
file consumed by engineers and AI coding tools. See
`openspec/changes/add-codebase-context-generation/specs/context-generator/spec.md`
for the full behavior contract.

## Usage

```js
import { generateContextFile } from "../src/generator/index.js";
import { createOpenAiCompatibleProvider } from "../src/generator/model.js";
import { scanRepository } from "../src/scanner/index.js";

const { bundle } = await scanRepository("/path/to/repo");

const callModel = createOpenAiCompatibleProvider({
  endpoint: process.env.MODEL_ENDPOINT,
  apiKey: process.env.MODEL_API_KEY,
  model: "gpt-4o-mini" // or whichever model the shared credential targets
});

const { content, writtenPaths } = await generateContextFile({
  repoRoot: "/path/to/repo",
  repoName: "my-service",
  commitSha: "abc1234",
  bundle,
  callModel
});
```

## Pipeline

1. **`template.js`** - renders the generation prompt, enforcing the fixed
   ten-section schema (`REQUIRED_SECTIONS`) and an explicit "mark as not
   evident, do not invent" instruction.
2. **`model.js`** - provider-agnostic model-call interface. Ships an
   OpenAI-compatible provider (works with Azure AI Foundry / GitHub Models /
   OpenAI with the right endpoint/key) and a mock provider for tests.
3. **`validate.js`** - rejects model output missing any required section or
   with sections out of order, rather than writing a malformed file.
4. **`stamp.js`** - stamps the `## Last Validated` section with generation
   date, commit SHA, and **always `DRAFT` status** - only the
   `context-refresh-pipeline` capability's merge step may mark a file
   `APPROVED`. Also exposes `isOnlyMetadataDifference` so the pipeline can
   skip opening a no-op review PR.
5. **`write.js`** - writes one canonical file (`CONTEXT.md`) and mirrors
   identical content to tool-specific paths
   (`.github/copilot-instructions.md`, etc.).

`generateContextFile()` in `index.js` runs all five steps in order and
throws rather than writing a file if validation fails - a malformed context
file is worse than none.
