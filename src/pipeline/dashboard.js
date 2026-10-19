/**
 * Pure rendering logic for the rollout-status progress dashboard. Kept
 * separate from scripts/build-dashboard.mjs (the thin CLI wrapper) so it
 * can be unit tested without touching the filesystem.
 */

export const STATUS_META = {
  approved: { label: "Approved", color: "#1a7f37", bg: "#dafbe1" },
  draft_pending_review: { label: "Pending Review", color: "#9a6700", bg: "#fff8c5" },
  not_started: { label: "Not Started", color: "#59636e", bg: "#f6f8fa" }
};

export function daysSince(isoDate, referenceNow = Date.now()) {
  if (!isoDate) return null;
  const diffMs = referenceNow - new Date(isoDate).getTime();
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

export function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
}

function renderRow(repo, targets, now) {
  const meta = STATUS_META[repo.status] ?? STATUS_META.not_started;
  const stale = daysSince(repo.lastValidated, now);
  const isStale = stale !== null && stale > targets.stalenessDaysMax;
  const prLink = repo.prUrl ? `<a href="${escapeHtml(repo.prUrl)}" target="_blank">View PR</a>` : "-";

  return `
    <tr>
      <td>${escapeHtml(repo.name)}</td>
      <td><span class="badge" style="color:${meta.color};background:${meta.bg}">${meta.label}</span></td>
      <td>${repo.lastValidated ? escapeHtml(new Date(repo.lastValidated).toISOString().slice(0, 10)) : "-"}</td>
      <td class="${isStale ? "stale" : ""}">${stale === null ? "-" : `${stale} day(s)${isStale ? " \u26a0" : ""}`}</td>
      <td>${prLink}</td>
    </tr>`;
}

/** Computes the summary figures shown in the dashboard's top cards. */
export function computeSummary(data, now = Date.now()) {
  const total = data.repositories.length;
  const approved = data.repositories.filter((r) => r.status === "approved").length;
  const pending = data.repositories.filter((r) => r.status === "draft_pending_review").length;
  const notStarted = data.repositories.filter((r) => r.status === "not_started").length;
  const coveragePercent = total > 0 ? Math.round((approved / total) * 100) : 0;

  const validatedAges = data.repositories.map((r) => daysSince(r.lastValidated, now)).filter((d) => d !== null);
  const avgStaleness =
    validatedAges.length > 0 ? Math.round(validatedAges.reduce((a, b) => a + b, 0) / validatedAges.length) : null;

  return { total, approved, pending, notStarted, coveragePercent, avgStaleness };
}

/** Renders the full static HTML dashboard document for a rollout-status data set. */
export function renderDashboard(data, now = Date.now()) {
  const summary = computeSummary(data, now);
  const rows = data.repositories.map((r) => renderRow(r, data.targets, now)).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Repository Context Rollout - Progress Dashboard</title>
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; margin: 0; padding: 2rem; background: #f6f8fa; color: #1b1f23; }
  h1 { font-size: 1.4rem; margin-bottom: 0.25rem; }
  .meta { color: #59636e; font-size: 0.85rem; margin-bottom: 1.5rem; }
  .cards { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
  .card { background: white; border: 1px solid #d0d7de; border-radius: 8px; padding: 1rem 1.5rem; min-width: 150px; }
  .card .value { font-size: 1.8rem; font-weight: 600; }
  .card .label { font-size: 0.8rem; color: #59636e; }
  table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #d0d7de; border-radius: 8px; overflow: hidden; }
  th, td { text-align: left; padding: 0.6rem 1rem; border-bottom: 1px solid #d0d7de; font-size: 0.9rem; }
  th { background: #f6f8fa; font-weight: 600; }
  .badge { padding: 0.15rem 0.6rem; border-radius: 999px; font-size: 0.78rem; font-weight: 600; }
  .stale { color: #cf222e; font-weight: 600; }
  tr:last-child td { border-bottom: none; }
</style>
</head>
<body>
  <h1>Repository Context Rollout - Progress Dashboard</h1>
  <div class="meta">Generated: ${escapeHtml(data.generatedAt)} &middot; Target coverage: ${data.targets.coveragePercent}% &middot; Staleness target: &lt;${data.targets.stalenessDaysMax} days</div>

  <div class="cards">
    <div class="card"><div class="value">${summary.coveragePercent}%</div><div class="label">Approved coverage (${summary.approved}/${summary.total})</div></div>
    <div class="card"><div class="value">${summary.pending}</div><div class="label">Pending review</div></div>
    <div class="card"><div class="value">${summary.notStarted}</div><div class="label">Not started</div></div>
    <div class="card"><div class="value">${summary.avgStaleness === null ? "-" : `${summary.avgStaleness}d`}</div><div class="label">Avg. staleness (validated repos)</div></div>
  </div>

  <table>
    <thead><tr><th>Repository</th><th>Status</th><th>Last Validated</th><th>Staleness</th><th>Review PR</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}
