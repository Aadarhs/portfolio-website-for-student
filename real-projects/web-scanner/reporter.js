const fs = require('fs');
const path = require('path');

const SEVERITY_COLORS = {
  critical: '\x1b[31m',
  high: '\x1b[91m',
  medium: '\x1b[33m',
  low: '\x1b[36m',
  info: '\x1b[37m',
};

const SEVERITY_ICONS = {
  critical: '!!!',
  high: '!! ',
  medium: '!  ',
  low: '~  ',
  info: 'i  ',
};

function printConsoleReport(findings, crawlStats, targetUrl, startTime) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  process.stdout.write('\n');
  process.stdout.write('═'.repeat(70) + '\n');
  process.stdout.write('  WEB APPLICATION SECURITY SCAN REPORT\n');
  process.stdout.write('═'.repeat(70) + '\n\n');

  process.stdout.write(`  Target:       ${targetUrl}\n`);
  process.stdout.write(`  Pages Scanned: ${crawlStats.visited}\n`);
  process.stdout.write(`  Forms Found:   ${crawlStats.forms}\n`);
  process.stdout.write(`  Links Found:   ${crawlStats.links}\n`);
  process.stdout.write(`  Duration:      ${elapsed}s\n\n`);

  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  findings.forEach(f => { counts[f.severity] = (counts[f.severity] || 0) + 1; });

  process.stdout.write('  SEVERITY SUMMARY\n');
  process.stdout.write('  ' + '-'.repeat(40) + '\n');
  for (const [sev, count] of Object.entries(counts)) {
    const color = SEVERITY_COLORS[sev] || '';
    const bar = '#'.repeat(Math.min(count, 30));
    process.stdout.write(`  ${color}${sev.toUpperCase().padEnd(10)}\x1b[0m ${String(count).padStart(4)}  ${bar}\n`);
  }
  process.stdout.write('\n');

  if (findings.length === 0) {
    process.stdout.write('  \x1b[32mNo vulnerabilities found.\x1b[0m\n\n');
    process.stdout.write('═'.repeat(70) + '\n');
    return;
  }

  const sorted = [...findings].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    return (order[a.severity] || 5) - (order[b.severity] || 5);
  });

  process.stdout.write('  FINDINGS\n');
  process.stdout.write('  ' + '-'.repeat(40) + '\n\n');

  sorted.forEach((f, i) => {
    const color = SEVERITY_COLORS[f.severity] || '';
    const icon = SEVERITY_ICONS[f.severity] || '  ';
    process.stdout.write(`  \x1b[1m[${String(i + 1).padStart(3)}]\x1b[0m ${color}${icon} ${f.severity.toUpperCase().padEnd(8)}\x1b[0m ${f.type}\n`);
    process.stdout.write(`       ${f.detail}\n`);
    process.stdout.write(`       URL: ${f.url}\n`);
    if (f.parameter) process.stdout.write(`       Parameter: ${f.parameter}\n`);
    if (f.payload) process.stdout.write(`       Payload: ${f.payload}\n`);
    process.stdout.write('\n');
  });

  process.stdout.write('═'.repeat(70) + '\n');
  process.stdout.write(`  Total findings: ${findings.length}\n`);
  process.stdout.write('═'.repeat(70) + '\n\n');
}

function generateJsonReport(findings, crawlStats, targetUrl, startTime) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  findings.forEach(f => { counts[f.severity] = (counts[f.severity] || 0) + 1; });

  return {
    scanInfo: {
      target: targetUrl,
      timestamp: new Date().toISOString(),
      durationSeconds: parseFloat(elapsed),
      pagesScanned: crawlStats.visited,
      formsFound: crawlStats.forms,
      linksFound: crawlStats.links,
    },
    summary: {
      totalFindings: findings.length,
      bySeverity: counts,
    },
    findings: findings.map(f => ({
      type: f.type,
      severity: f.severity,
      detail: f.detail,
      evidence: f.evidence,
      url: f.url,
      parameter: f.parameter || null,
      payload: f.payload || null,
      remediation: f.remediation,
      timestamp: f.timestamp,
    })),
  };
}

function saveJsonReport(report, outputDir) {
  const dir = outputDir || process.env.REPORT_OUTPUT_DIR || '.';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const filename = `scan-report-${timestamp}.json`;
  const filepath = path.join(dir, filename);

  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  return filepath;
}

function saveHtmlReport(findings, crawlStats, targetUrl, startTime, outputDir) {
  const dir = outputDir || process.env.REPORT_OUTPUT_DIR || '.';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  findings.forEach(f => { counts[f.severity] = (counts[f.severity] || 0) + 1; });

  const rows = [...findings].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    return (order[a.severity] || 5) - (order[b.severity] || 5);
  }).map((f, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><span class="badge badge-${f.severity}">${f.severity.toUpperCase()}</span></td>
      <td>${escapeHtml(f.type)}</td>
      <td>${escapeHtml(f.detail)}</td>
      <td class="url">${escapeHtml(f.url)}</td>
      <td>${escapeHtml(f.parameter || '-')}</td>
      <td><code>${escapeHtml(f.payload || '-')}</code></td>
      <td>${escapeHtml(f.remediation)}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Security Scan Report - ${escapeHtml(targetUrl)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #c9d1d9; padding: 24px; }
    h1 { color: #58a6ff; margin-bottom: 8px; }
    .meta { color: #8b949e; margin-bottom: 24px; font-size: 14px; }
    .summary { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    .card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 16px 24px; min-width: 120px; text-align: center; }
    .card .count { font-size: 28px; font-weight: bold; }
    .card .label { font-size: 12px; color: #8b949e; text-transform: uppercase; }
    .badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; color: #fff; }
    .badge-critical { background: #da3633; }
    .badge-high { background: #d29922; }
    .badge-medium { background: #1f6feb; }
    .badge-low { background: #388bfd; }
    .badge-info { background: #484f58; }
    table { width: 100%; border-collapse: collapse; background: #161b22; border-radius: 8px; overflow: hidden; }
    th { background: #21262d; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #8b949e; }
    td { padding: 10px 12px; border-top: 1px solid #30363d; font-size: 13px; vertical-align: top; }
    td.url { max-width: 300px; word-break: break-all; font-size: 11px; }
    code { background: #21262d; padding: 2px 6px; border-radius: 3px; font-size: 12px; }
    .empty { text-align: center; padding: 40px; color: #3fb950; font-size: 18px; }
  </style>
</head>
<body>
  <h1>Security Scan Report</h1>
  <div class="meta">
    Target: ${escapeHtml(targetUrl)} | Scanned: ${new Date().toISOString()} | Duration: ${elapsed}s | Pages: ${crawlStats.visited} | Forms: ${crawlStats.forms}
  </div>
  <div class="summary">
    <div class="card"><div class="count" style="color:#da3633">${counts.critical}</div><div class="label">Critical</div></div>
    <div class="card"><div class="count" style="color:#d29922">${counts.high}</div><div class="label">High</div></div>
    <div class="card"><div class="count" style="color:#1f6feb">${counts.medium}</div><div class="label">Medium</div></div>
    <div class="card"><div class="count" style="color:#388bfd">${counts.low}</div><div class="label">Low</div></div>
    <div class="card"><div class="count" style="color:#484f58">${counts.info}</div><div class="label">Info</div></div>
  </div>
  ${findings.length === 0 ? '<div class="empty">No vulnerabilities found.</div>' : `
  <table>
    <thead><tr><th>#</th><th>Severity</th><th>Type</th><th>Detail</th><th>URL</th><th>Parameter</th><th>Payload</th><th>Remediation</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`}
</body>
</html>`;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const filename = `scan-report-${timestamp}.html`;
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, html);
  return filepath;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = {
  printConsoleReport,
  generateJsonReport,
  saveJsonReport,
  saveHtmlReport,
};
