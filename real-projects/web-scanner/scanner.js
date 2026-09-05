#!/usr/bin/env node

require('dotenv').config();
const { Command } = require('commander');
const { WebCrawler } = require('./crawlers');
const { VulnerabilityDetector } = require('./detectors');
const { printConsoleReport, generateJsonReport, saveJsonReport, saveHtmlReport } = require('./reporter');
const { configureProxy } = require('./utils');

const VERSION = '1.0.0';

const program = new Command();

program
  .name('web-scanner')
  .description('Web Application Security Scanner')
  .version(VERSION)
  .requiredOption('-u, --url <url>', 'Target URL to scan')
  .option('-m, --max-pages <number>', 'Maximum pages to crawl', '30')
  .option('-d, --max-depth <depth>', 'Maximum crawl depth', '3')
  .option('--delay <ms>', 'Delay between requests (ms)', '500')
  .option('--proxy <url>', 'HTTP proxy URL')
  .option('--output <dir>', 'Report output directory', './reports')
  .option('--json-only', 'Output JSON report only (no console)', false)
  .option('--html', 'Generate HTML report', false)
  .option('-v, --verbose', 'Verbose output', false)
  .option('--no-headers', 'Skip security header checks', false)
  .option('--no-sql', 'Skip SQL injection tests', false)
  .option('--no-xss', 'Skip XSS tests', false)
  .option('--no-traversal', 'Skip directory traversal tests', false)
  .option('--no-redirect', 'Skip open redirect tests', false)
  .option('--no-files', 'Skip sensitive file checks', false)
  .parse(process.argv);

const opts = program.opts();

async function main() {
  const startTime = Date.now();

  process.stdout.write('\n');
  process.stdout.write('  ╔══════════════════════════════════════════════════╗\n');
  process.stdout.write('  ║       Web Application Security Scanner          ║\n');
  process.stdout.write('  ║              v' + VERSION + '                         ║\n');
  process.stdout.write('  ╚══════════════════════════════════════════════════╝\n\n');

  let targetUrl = opts.url;
  try {
    const u = new URL(targetUrl);
    if (!u.protocol.startsWith('http')) {
      process.stdout.write('  Error: URL must start with http:// or https://\n');
      process.exit(1);
    }
  } catch {
    process.stdout.write(`  Error: Invalid URL "${targetUrl}"\n`);
    process.exit(1);
  }

  targetUrl = targetUrl.replace(/\/+$/, '');

  process.stdout.write(`  Target:       ${targetUrl}\n`);
  process.stdout.write(`  Max Pages:    ${opts.maxPages}\n`);
  process.stdout.write(`  Max Depth:    ${opts.maxDepth}\n`);
  process.stdout.write(`  Delay:        ${opts.delay}ms\n`);
  if (opts.proxy) process.stdout.write(`  Proxy:        ${opts.proxy}\n`);
  process.stdout.write('\n');

  if (opts.proxy) {
    configureProxy(opts.proxy);
  }

  process.stdout.write('  ── Phase 1: Crawling ──────────────────────────────\n');
  const crawler = new WebCrawler(targetUrl, {
    maxPages: parseInt(opts.maxPages),
    maxDepth: parseInt(opts.maxDepth),
    delay: parseInt(opts.delay),
    verbose: opts.verbose,
  });

  let crawlResults;
  try {
    crawlResults = await crawler.crawl();
  } catch (err) {
    process.stdout.write(`  Crawl error: ${err.message}\n`);
    process.exit(1);
  }

  process.stdout.write(`  Found ${crawlResults.pages.length} pages, ${crawlResults.forms.length} forms, ${crawlResults.links.length} links\n\n`);

  if (crawlResults.pages.length === 0) {
    process.stdout.write('  No pages could be retrieved. Check the target URL and try again.\n');
    process.exit(1);
  }

  process.stdout.write('  ── Phase 2: Vulnerability Detection ───────────────\n\n');
  const detector = new VulnerabilityDetector(targetUrl, {
    verbose: opts.verbose,
    delay: parseInt(opts.delay),
  });

  const filteredCrawl = {
    ...crawlResults,
    pages: opts.headers !== false ? crawlResults.pages : crawlResults.pages,
  };

  if (opts.noHeaders) delete detector.checkSecurityHeaders;

  const originalRunAll = detector.runAll.bind(detector);
  detector.runAll = async function(crawl) {
    const findings = [];
    if (!opts.noHeaders) findings.push(...await this.checkSecurityHeaders().then(() => this.findings.slice(-this.findings.length)));
    if (!opts.noFiles) await this.testSensitiveFiles();

    const pageUrls = crawl.pages.map(p => p.url);
    const uniqueUrls = [...new Set(pageUrls)];

    if (!opts.noSql) {
      await this.testSqlInjection(uniqueUrls);
      await this.testFormSqlInjection(crawl.forms);
    }
    if (!opts.noXss) {
      await this.testXss(uniqueUrls);
      await this.testFormXss(crawl.forms);
    }
    if (!opts.noTraversal) await this.testDirectoryTraversal(uniqueUrls);
    if (!opts.noRedirect) await this.testOpenRedirects(uniqueUrls);

    return this.findings;
  };

  let findings;
  try {
    findings = await detector.runAll(crawlResults);
  } catch (err) {
    process.stdout.write(`  Detection error: ${err.message}\n`);
    findings = [];
  }

  const crawlStats = {
    visited: crawlResults.visited,
    forms: crawlResults.forms.length,
    links: crawlResults.links.length,
  };

  if (!opts.jsonOnly) {
    printConsoleReport(findings, crawlStats, targetUrl, startTime);
  }

  const report = generateJsonReport(findings, crawlStats, targetUrl, startTime);

  try {
    const jsonPath = saveJsonReport(report, opts.output);
    process.stdout.write(`  JSON report: ${jsonPath}\n`);

    if (opts.html) {
      const htmlPath = saveHtmlReport(findings, crawlStats, targetUrl, startTime, opts.output);
      process.stdout.write(`  HTML report: ${htmlPath}\n`);
    }
  } catch (err) {
    process.stdout.write(`  Error saving report: ${err.message}\n`);
  }

  const hasCritical = findings.some(f => f.severity === 'critical' || f.severity === 'high');
  process.exit(hasCritical ? 1 : 0);
}

main().catch(err => {
  process.stderr.write(`\n  Fatal error: ${err.message}\n`);
  process.exit(2);
});
