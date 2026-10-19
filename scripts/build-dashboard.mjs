/**
 * Thin CLI wrapper: reads a rollout-status JSON file and writes the
 * rendered static HTML dashboard. Rendering logic itself lives in
 * src/pipeline/dashboard.js (unit tested there).
 *
 * Usage: node scripts/build-dashboard.mjs [path-to-status.json]
 *   (defaults to config/rollout-status.sample.json)
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderDashboard } from "../src/pipeline/dashboard.js";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const dataPath = process.argv[2] ?? path.join(ROOT, "config/rollout-status.sample.json");
const outputPath = path.join(ROOT, "dashboard.html");

const raw = await readFile(dataPath, "utf8");
const data = JSON.parse(raw);
await writeFile(outputPath, renderDashboard(data), "utf8");

console.log(`Dashboard written to: ${outputPath}`);
console.log(`Open it in a browser, e.g.: file://${outputPath.replace(/\\/g, "/")}`);
