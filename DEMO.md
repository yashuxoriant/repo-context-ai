# Demo Guide

A step-by-step script for running and presenting `repo-context-ai` to others.
Total time: ~5 minutes. No GitHub account, API keys, or network access needed.

---

## 1. One-time setup (before the meeting)

```bash
cd repo-context-ai
npm install
```

Confirm it's healthy:

```bash
npm run lint
npm test
```

Expect: lint produces no output (clean), tests show `Test Files 15 passed (15)`,
`Tests 39 passed (39)`.

**Tip:** do this setup *before* the meeting so `npm install` isn't eating into
your demo time.

---

## 2. The demo script (what to run, in order, while talking)

### Step 1 - "Here's the problem we're solving" (30 sec, no command)
Open `openspec/changes/add-codebase-context-generation/proposal.md` and read
the "Why" section aloud, or paraphrase: *"AI coding tools start every session
with zero knowledge of a repo's architecture or conventions. We built a tool
that auto-generates and keeps that context current."*

### Step 2 - "Here's proof it's solid engineering" (30 sec)
```bash
npm test
```
Point out: **39 tests passing**, covering secret redaction, draft-vs-approved
status, and the "don't spam reviewers with no-op pull requests" rule - these
map directly to written specs under `openspec/changes/.../specs/`.

### Step 3 - "Here's it actually working, live" (90 sec) - the main moment
```bash
npm run demo
```
Narrate as it runs: *"This just scanned this repository's structure, README,
and manifest, and generated a context file."* Then run it again:
```bash
npm run demo
```
Point out it now says `changed: false` - *"It correctly detected nothing
meaningful changed, so it won't spam anyone with a duplicate pull request."*

### Step 4 - "Here's the actual output" (60 sec)
Open `CONTEXT.md` in the editor and scroll through it. Point out:
- The fixed 10-section structure (same for every repo, easy to scan)
- The `Known Constraints / Gotchas` section mentioning this is demo-mode content
- The `Last Validated` footer: generation date, commit SHA, and **`Status: DRAFT
  - pending engineer review`** - *"Nothing becomes trusted context until a human
  approves it."*

### Step 5 - "Here's how it plugs into the real workflow" (60 sec, no command)
Open `.github/workflows/generate-context.yml` and point out the three triggers:
manual, weekly schedule, and "significant file changed" (not every commit).
Mention: *"In production this opens a real pull request - never auto-merges.
A second workflow marks it approved only after a human merges that PR."*

### Step 6 - optional: "Here's it calling the exact same code path as production" (30 sec)
```bash
npm run generate
```
Point out the console warning: it automatically falls back to a safe demo
response because no real AI model key is configured in this environment -
*"Same code, same validation, same draft-stamping - just swap in a real model
endpoint and this becomes genuinely AI-written."*

### Step 7 - "Here's how we'd track rollout progress" (45 sec)
```bash
npm run dashboard
```
Open the generated `dashboard.html` in a browser. Narrate: *"This is what
tracking the rollout across all 50+ repos would look like - coverage
percentage, how many are pending review, which ones have gone stale past our
30-day target."* This uses sample data (`config/rollout-status.sample.json`)
since no real repos are onboarded yet, but the underlying collector
(`src/pipeline/rollout-status.js`) reads this from each repo's real
`CONTEXT.md` once pilots are live - it's wired to real state, not just mocked
for the demo.

---

## 3. Anticipated questions and honest answers

| Question | Answer |
|---|---|
| "Is the content in CONTEXT.md real AI output?" | No - this demo runs in a scripted/mock mode so it works without an API key. With real credentials (`MODEL_ENDPOINT`/`MODEL_API_KEY`), the exact same pipeline produces genuine LLM-written content. |
| "Has this run against a real GitHub repo yet?" | Not yet - it's been built and fully tested locally. The GitHub Actions workflows are written and ready; they just need to be installed into a real repository. |
| "What stops it from writing something wrong?" | Every generated/refreshed file is a pull request, never auto-merged. It's stamped DRAFT until a human approves it. |
| "Could it leak secrets from a repo it scans?" | No - the scanner redacts secret-pattern lines and excludes whole files like `.env`/`*.pem` before anything reaches the AI model. There are dedicated tests for this (`test/scanner/redact.test.js`). |
| "How long did this take to build?" | See `openspec/changes/add-codebase-context-generation/tasks.md` for the full task breakdown - built using spec-driven development (OpenSpec), so every piece traces back to a written requirement. |

---

## 4. If something goes wrong during the live demo

- **`npm test` fails unexpectedly:** re-run it - one access-check test spawns
  `git` and can occasionally be slow on a loaded machine; it isn't flaky logic.
- **`npm run demo` says `changed: false` on the very first run:** someone
  already ran it before - delete `CONTEXT.md` and
  `.github/copilot-instructions.md` and re-run.
- **Want a clean slate right before presenting:**
  ```bash
  git status --short   # should be empty - generated files are gitignored
  ```

---

## 5. Closing line

*"This is one of three AI foundation use cases we scoped. It's the fastest
and lowest-risk of the three, fully built and tested locally in under a day
using AI-assisted development - next step is picking 2-3 real repos to pilot
it on."*
