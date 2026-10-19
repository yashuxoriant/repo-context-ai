import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { load } from "js-yaml";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

async function loadYaml(relativePath) {
  const raw = await readFile(path.join(ROOT, relativePath), "utf8");
  return load(raw);
}

describe("generate-context.yml", () => {
  it("is syntactically valid YAML with the expected trigger types", async () => {
    const workflow = await loadYaml(".github/workflows/generate-context.yml");

    // js-yaml parses the unquoted key `on:` as boolean `true`
    const triggers = workflow.true ?? workflow.on;
    expect(triggers).toHaveProperty("workflow_dispatch");
    expect(triggers).toHaveProperty("schedule");
    expect(triggers).toHaveProperty("push");
  });

  it("never merges a pull request directly - only opens one via create-pull-request", async () => {
    const raw = await readFile(path.join(ROOT, ".github/workflows/generate-context.yml"), "utf8");
    expect(raw).toMatch(/create-pull-request/);
    expect(raw).not.toMatch(/git push.*main/); // no direct push-to-main step
  });

  it("push trigger paths match config/refresh-triggers.json significant paths", async () => {
    const workflow = await loadYaml(".github/workflows/generate-context.yml");
    const triggerConfig = JSON.parse(
      await readFile(path.join(ROOT, "config/refresh-triggers.json"), "utf8")
    );

    const triggers = workflow.true ?? workflow.on;
    expect(triggers.push.paths.sort()).toEqual(triggerConfig.significantPaths.slice().sort());
  });

  it("schedule cron matches config/refresh-triggers.json", async () => {
    const workflow = await loadYaml(".github/workflows/generate-context.yml");
    const triggerConfig = JSON.parse(
      await readFile(path.join(ROOT, "config/refresh-triggers.json"), "utf8")
    );

    const triggers = workflow.true ?? workflow.on;
    expect(triggers.schedule[0].cron).toBe(triggerConfig.schedule.cron);
  });
});

describe("approve-context.yml", () => {
  it("is syntactically valid YAML and only triggers on a merged PR", async () => {
    const workflow = await loadYaml(".github/workflows/approve-context.yml");
    const triggers = workflow.true ?? workflow.on;

    expect(triggers.pull_request.types).toContain("closed");
    expect(workflow.jobs["mark-approved"].if).toMatch(/merged == true/);
  });
});

describe("jira-enhancement-pipeline.yml", () => {
  it("is syntactically valid YAML, manual-dispatch only for now", async () => {
    const workflow = await loadYaml(".github/workflows/jira-enhancement-pipeline.yml");
    const triggers = workflow.true ?? workflow.on;

    expect(triggers).toHaveProperty("workflow_dispatch");
    // No live Jira webhook/push/schedule trigger yet - intentional per design.md.
    expect(triggers).not.toHaveProperty("push");
  });

  it("never merges a pull request directly - only opens one via create-pull-request", async () => {
    const raw = await readFile(path.join(ROOT, ".github/workflows/jira-enhancement-pipeline.yml"), "utf8");
    expect(raw).toMatch(/create-pull-request/);
    expect(raw).not.toMatch(/git push.*main/);
  });

  it("runs the jira-demo CLI command and gates PR creation on its changed output", async () => {
    const workflow = await loadYaml(".github/workflows/jira-enhancement-pipeline.yml");
    const steps = workflow.jobs["jira-demo"].steps;

    const runStep = steps.find((s) => s.run?.includes("jira-demo"));
    expect(runStep).toBeTruthy();

    const prStep = steps.find((s) => s.uses?.includes("create-pull-request"));
    expect(prStep.if).toMatch(/changed == 'true'/);
  });
});
