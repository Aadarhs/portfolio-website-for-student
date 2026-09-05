# Web Application Security Scanner

A Node.js security scanner that tests web applications for common vulnerabilities including SQL injection, XSS, open redirects, and more.

## Features

- **URL Crawling** - discovers pages, forms, and links up to configurable depth
- **SQL Injection** - error-based and boolean-based blind detection with 10+ payloads
- **Reflected XSS** - tests URL parameters and form inputs with 10+ payloads
- **Security Headers** - checks for CSP, HSTS, X-Frame-Options, and more
- **Directory Traversal** - Unix and Windows path traversal with pattern matching
- **Open Redirect** - tests common redirect parameters with bypass techniques
- **Sensitive Files** - checks for `.env`, `.git`, backups, phpinfo, and more
- **Form Analysis** - discovers and tests all form inputs
- **Reports** - JSON and HTML output with severity-sorted findings

## Install

```bash
cd web-scanner
npm install
```

## Usage

```bash
# Basic scan
node scanner.js --url http://example.com

# Verbose with HTML report
node scanner.js --url http://example.com -v --html --output ./reports

# Crawl deeper, skip XSS tests
node scanner.js --url http://example.com --max-depth 5 --max-pages 100 --no-xss

# Use a proxy
node scanner.js --url http://example.com --proxy http://127.0.0.1:8080

# Skip certain modules
node scanner.js --url http://example.com --no-sql --no-traversal
```

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `-u, --url <url>` | Target URL (required) | - |
| `-m, --max-pages <n>` | Max pages to crawl | 30 |
| `-d, --max-depth <n>` | Max crawl depth | 3 |
| `--delay <ms>` | Delay between requests | 500 |
| `--proxy <url>` | HTTP proxy | - |
| `--output <dir>` | Report output directory | ./reports |
| `--html` | Generate HTML report | false |
| `-v, --verbose` | Verbose output | false |
| `--no-headers` | Skip header checks | false |
| `--no-sql` | Skip SQL injection | false |
| `--no-xss` | Skip XSS tests | false |
| `--no-traversal` | Skip directory traversal | false |
| `--no-redirect` | Skip open redirect tests | false |
| `--no-files` | Skip sensitive file checks | false |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | No critical/high findings |
| 1 | Critical or high severity findings detected |
| 2 | Fatal error |

## Project Structure

```
scanner.js      - CLI entry point and orchestration
crawlers.js     - Web crawler, link discovery, form extraction
detectors.js    - Vulnerability detection modules (SQLi, XSS, traversal, etc.)
reporter.js     - Console, JSON, and HTML report generation
utils.js        - HTTP helpers, URL manipulation, safe requests
```

## Disclaimer

Use this tool only on applications you own or have explicit authorization to test. Unauthorized security scanning is illegal in most jurisdictions.
