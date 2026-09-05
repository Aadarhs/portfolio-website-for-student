const { safeGet, safePost, resolveUrl, stripTags, sleep } = require('./utils');
const cheerio = require('cheerio');

const SQL_ERROR_PATTERNS = [
  { regex: /you have an error in your sql syntax/i, type: 'MySQL' },
  { regex: /warning.*mysql_/i, type: 'MySQL' },
  { regex: /unclosed quotation mark/i, type: 'MSSQL' },
  { regex: /microsoft.*ole db provider for/i, type: 'MSSQL' },
  { regex: /odbc sql server driver/i, type: 'MSSQL' },
  { regex: /pg_query\(\)/i, type: 'PostgreSQL' },
  { regex: /pg_exec\(\)/i, type: 'PostgreSQL' },
  { regex: /sqlite3::/i, type: 'SQLite' },
  { regex: /sqlite_error/i, type: 'SQLite' },
  { regex: /sqlstate/i, type: 'Generic' },
  { regex: /ORA-\d{5}/, type: 'Oracle' },
  { regex: /oracle.*driver/i, type: 'Oracle' },
  { regex: /syntax error at or near/i, type: 'PostgreSQL' },
  { regex: /supplied argument is not a valid/i, type: 'Generic' },
  { regex: /mysql_num_rows/i, type: 'MySQL' },
  { regex: /mysql_fetch/i, type: 'MySQL' },
  { regex: /valid MySQL result/i, type: 'MySQL' },
  { regex: /PostgreSQL.*ERROR/i, type: 'PostgreSQL' },
  { regex: /Warning.*\Wmysqli?_/i, type: 'MySQL' },
  { regex: /MySQLSyntaxErrorException/i, type: 'MySQL' },
  { regex: /java\.sql\.SQLException/i, type: 'Java/JDBC' },
  { regex: /SQLite\/JDBCDriver/i, type: 'SQLite' },
];

const SQL_INJECTION_PAYLOADS = [
  { payload: "'", label: 'single-quote' },
  { payload: " OR '1'='1", label: 'OR tautology' },
  { payload: " OR 1=1--", label: 'OR tautology (comment)' },
  { payload: "' OR ''='", label: 'empty string OR' },
  { payload: "1; DROP TABLE users--", label: 'DROP TABLE' },
  { payload: "' UNION SELECT NULL--", label: 'UNION SELECT' },
  { payload: "1' AND '1'='1", label: 'AND tautology' },
  { payload: "' UNION SELECT 1,2,3--", label: 'UNION columns' },
  { payload: "1 OR 1=1", label: 'numeric OR' },
  { payload: "'; SELECT 1--", label: 'stacked query' },
];

const BOOLEAN_PAYLOADS = [
  { truePayload: "' AND 1=1--", falsePayload: "' AND 1=2--", label: 'boolean AND' },
  { truePayload: "' AND 'a'='a", falsePayload: "' AND 'a'='b", label: 'boolean string' },
  { truePayload: "1 AND 1=1", falsePayload: "1 AND 1=2", label: 'numeric boolean' },
];

const XSS_PAYLOADS = [
  { payload: '<script>alert("XSS")</script>', label: 'basic script tag' },
  { payload: '"><script>alert("XSS")</script>', label: 'attribute escape' },
  { payload: "'-alert('XSS')-'", label: 'single-quote event' },
  { payload: '<img src=x onerror=alert("XSS")>', label: 'img onerror' },
  { payload: '<svg onload=alert("XSS")>', label: 'svg onload' },
  { payload: 'javascript:alert("XSS")', label: 'javascript URI' },
  { payload: '<body onload=alert("XSS")>', label: 'body onload' },
  { payload: '" onmouseover="alert(\'XSS\')"', label: 'double-quote event' },
  { payload: '<iframe src="javascript:alert(\'XSS\')">', label: 'iframe javascript' },
  { payload: '<input onfocus=alert("XSS") autofocus>', label: 'input autofocus' },
];

const DIRECTORY_TRAVERSAL_PAYLOADS = [
  { payload: '../../../../../../etc/passwd', unix: true, label: 'Unix passwd' },
  { payload: '../../../../../../etc/shadow', unix: true, label: 'Unix shadow' },
  { payload: '..\\..\\..\\..\\..\\..\\windows\\win.ini', windows: true, label: 'Windows win.ini' },
  { payload: '..\\..\\..\\..\\..\\..\\windows\\system32\\drivers\\etc\\hosts', windows: true, label: 'Windows hosts' },
  { payload: '....//....//....//etc/passwd', unix: true, label: 'double-encoded Unix' },
];

const TRAVERSAL_RESPONSE_PATTERNS = [
  { regex: /\[boot loader\]/i, label: 'Windows win.ini' },
  { regex: /\[extensions\]/i, label: 'Windows win.ini' },
  { regex: /root:.*:0:0:/i, label: 'Unix /etc/passwd' },
  { regex: /root:\$\d/i, label: 'Unix /etc/shadow' },
  { regex: /127\.0\.0\.1\s+localhost/i, label: 'Windows hosts' },
  { regex: / daemon:/i, label: 'Unix /etc/passwd' },
];

const OPEN_REDIRECT_PAYLOADS = [
  { payload: 'https://evil.com', label: 'absolute URL' },
  { payload: '//evil.com', label: 'protocol-relative' },
  { payload: 'https://evil.com%00.example.com', label: 'null byte' },
  { payload: '/\\evil.com', label: 'backslash bypass' },
  { payload: 'https://evil.com@example.com', label: 'userinfo bypass' },
  { payload: 'javascript:alert(1)', label: 'javascript protocol' },
];

const SECURITY_HEADERS = [
  { header: 'strict-transport-security', name: 'HSTS', severity: 'medium', description: 'HTTP Strict Transport Security not set' },
  { header: 'content-security-policy', name: 'CSP', severity: 'medium', description: 'Content Security Policy not set' },
  { header: 'x-frame-options', name: 'X-Frame-Options', severity: 'medium', description: 'X-Frame-Options not set (clickjacking risk)' },
  { header: 'x-content-type-options', name: 'X-Content-Type-Options', severity: 'low', description: 'X-Content-Type-Options not set' },
  { header: 'x-xss-protection', name: 'X-XSS-Protection', severity: 'low', description: 'X-XSS-Protection not set' },
  { header: 'referrer-policy', name: 'Referrer-Policy', severity: 'low', description: 'Referrer-Policy not set' },
  { header: 'permissions-policy', name: 'Permissions-Policy', severity: 'low', description: 'Permissions-Policy not set' },
];

class VulnerabilityDetector {
  constructor(targetUrl, options = {}) {
    this.targetUrl = targetUrl;
    this.verbose = options.verbose || false;
    this.delay = options.delay || 500;
    this.findings = [];
  }

  log(msg) {
    if (this.verbose) process.stdout.write(`  [detect] ${msg}\n`);
  }

  addFinding(finding) {
    this.findings.push({
      ...finding,
      timestamp: new Date().toISOString(),
    });
  }

  async checkSecurityHeaders() {
    this.log('Checking security headers...');
    const resp = await safeGet(this.targetUrl);

    if (!resp.ok) {
      this.log(`  Target returned ${resp.status}, skipping header checks`);
      return;
    }

    for (const hdr of SECURITY_HEADERS) {
      const value = resp.headers[hdr.header.toLowerCase()];
      if (!value) {
        this.addFinding({
          type: 'Missing Security Header',
          severity: hdr.severity,
          detail: hdr.description,
          evidence: `Header '${hdr.header}' not present in response`,
          url: this.targetUrl,
          remediation: `Add the '${hdr.header}' header to your HTTP responses.`,
        });
        this.log(`  MISSING: ${hdr.name} (${hdr.severity})`);
      } else {
        this.log(`  OK: ${hdr.name} = ${value.substring(0, 60)}`);

        if (hdr.header === 'content-security-policy' && value.includes("'unsafe-inline'")) {
          this.addFinding({
            type: 'Weak CSP',
            severity: 'medium',
            detail: "CSP allows 'unsafe-inline' which weakens XSS protection",
            evidence: `CSP header: ${value.substring(0, 200)}`,
            url: this.targetUrl,
            remediation: "Remove 'unsafe-inline' from CSP and use nonces or hashes.",
          });
        }

        if (hdr.header === 'strict-transport-security') {
          const maxAge = value.match(/max-age=(\d+)/);
          if (maxAge && parseInt(maxAge[1]) < 31536000) {
            this.addFinding({
              type: 'Weak HSTS',
              severity: 'low',
              detail: `HSTS max-age is ${maxAge[1]}, recommended >= 31536000 (1 year)`,
              evidence: `HSTS header: ${value}`,
              url: this.targetUrl,
              remediation: 'Set HSTS max-age to at least 31536000 and includeSubDomains.',
            });
          }
        }
      }
    }

    const serverHeader = resp.headers['server'];
    if (serverHeader) {
      this.addFinding({
        type: 'Information Disclosure',
        severity: 'info',
        detail: 'Server header reveals software version',
        evidence: `Server: ${serverHeader}`,
        url: this.targetUrl,
        remediation: 'Remove or obfuscate the Server header.',
      });
    }

    const xPoweredBy = resp.headers['x-powered-by'];
    if (xPoweredBy) {
      this.addFinding({
        type: 'Information Disclosure',
        severity: 'info',
        detail: 'X-Powered-By header reveals technology',
        evidence: `X-Powered-By: ${xPoweredBy}`,
        url: this.targetUrl,
        remediation: 'Remove the X-Powered-By header.',
      });
    }
  }

  async testSqlInjection(urls) {
    this.log(`Testing ${urls.length} URLs for SQL injection...`);

    for (const url of urls) {
      const parsedUrl = new URL(url);
      const params = [...parsedUrl.searchParams.entries()];

      if (params.length === 0) continue;

      for (const [paramName, paramValue] of params) {
        const baselineResp = await safeGet(url);
        const baselineLen = baselineResp.data.length;

        for (const { payload, label } of SQL_INJECTION_PAYLOADS) {
          const testUrl = new URL(url);
          testUrl.searchParams.set(paramName, paramValue + payload);

          const resp = await safeGet(testUrl.toString());
          if (resp.status === 0) continue;

          const sqlError = SQL_ERROR_PATTERNS.find(p => p.regex.test(resp.data) || p.regex.test(stripTags(resp.data)));
          if (sqlError) {
            this.addFinding({
              type: 'SQL Injection (Error-Based)',
              severity: 'critical',
              detail: `Parameter '${paramName}' is vulnerable to error-based SQL injection via ${label}`,
              evidence: `Payload: ${payload}\nDB Type: ${sqlError.type}\nResponse excerpt: ${stripTags(resp.data).substring(0, 300)}`,
              url,
              parameter: paramName,
              payload,
              remediation: 'Use parameterized queries/prepared statements. Never concatenate user input into SQL.',
            });
            this.log(`  CRITICAL: SQLi in '${paramName}' at ${url} (${label})`);
            break;
          }

          if (Math.abs(resp.data.length - baselineLen) > baselineLen * 0.3 && baselineLen > 0) {
            this.addFinding({
              type: 'SQL Injection (Anomalous Response)',
              severity: 'high',
              detail: `Parameter '${paramName}' shows significant response change with payload '${label}'`,
              evidence: `Baseline length: ${baselineLen}, Payload response length: ${resp.data.length}`,
              url,
              parameter: paramName,
              payload,
              remediation: 'Use parameterized queries/prepared statements.',
            });
            this.log(`  HIGH: Anomalous response for '${paramName}' at ${url}`);
          }

          await sleep(this.delay);
        }

        for (const { truePayload, falsePayload, label } of BOOLEAN_PAYLOADS) {
          const trueUrl = new URL(url);
          trueUrl.searchParams.set(paramName, paramValue + truePayload);
          const falseUrl = new URL(url);
          falseUrl.searchParams.set(paramName, paramValue + falsePayload);

          const trueResp = await safeGet(trueUrl.toString());
          const falseResp = await safeGet(falseUrl.toString());

          if (trueResp.status !== falseResp.status) {
            this.addFinding({
              type: 'SQL Injection (Boolean-Based)',
              severity: 'critical',
              detail: `Parameter '${paramName}' appears vulnerable to boolean-based blind SQL injection`,
              evidence: `True condition status: ${trueResp.status}, False condition status: ${falseResp.status}\nTrue payload: ${truePayload}\nFalse payload: ${falsePayload}`,
              url,
              parameter: paramName,
              payload: truePayload,
              remediation: 'Use parameterized queries/prepared statements.',
            });
            this.log(`  CRITICAL: Boolean SQLi in '${paramName}' at ${url}`);
          }

          await sleep(this.delay);
        }
      }
    }
  }

  async testFormSqlInjection(forms) {
    this.log(`Testing ${forms.length} forms for SQL injection...`);

    for (const form of forms) {
      if (form.method !== 'POST') continue;

      for (const input of form.inputs) {
        if (input.type === 'submit' || input.type === 'hidden') continue;

        const baselineData = {};
        form.inputs.forEach(i => { baselineData[i.name] = i.value || 'test'; });

        const baselineResp = await safePost(form.actionUrl, new URLSearchParams(baselineData).toString());
        const baselineLen = baselineResp.data.length;

        for (const { payload, label } of SQL_INJECTION_PAYLOADS) {
          const testData = {};
          form.inputs.forEach(i => {
            testData[i.name] = (i.name === input.name) ? (i.value || 'test') + payload : (i.value || 'test');
          });

          const resp = await safePost(form.actionUrl, new URLSearchParams(testData).toString());
          if (resp.status === 0) continue;

          const sqlError = SQL_ERROR_PATTERNS.find(p => p.regex.test(resp.data) || p.regex.test(stripTags(resp.data)));
          if (sqlError) {
            this.addFinding({
              type: 'SQL Injection - Form (Error-Based)',
              severity: 'critical',
              detail: `Form field '${input.name}' at ${form.actionUrl} is vulnerable to error-based SQL injection`,
              evidence: `Payload: ${payload}\nDB Type: ${sqlError.type}\nForm action: ${form.actionUrl}\nResponse: ${stripTags(resp.data).substring(0, 300)}`,
              url: form.actionUrl,
              parameter: input.name,
              payload,
              remediation: 'Use parameterized queries/prepared statements.',
            });
            this.log(`  CRITICAL: Form SQLi in '${input.name}' at ${form.actionUrl}`);
            break;
          }

          await sleep(this.delay);
        }
      }
    }
  }

  async testXss(urls) {
    this.log(`Testing ${urls.length} URLs for reflected XSS...`);

    for (const url of urls) {
      const parsedUrl = new URL(url);
      const params = [...parsedUrl.searchParams.entries()];

      if (params.length === 0) continue;

      for (const [paramName, paramValue] of params) {
        for (const { payload, label } of XSS_PAYLOADS) {
          const testUrl = new URL(url);
          testUrl.searchParams.set(paramName, payload);

          const resp = await safeGet(testUrl.toString());
          if (resp.status === 0) continue;

          const reflected = resp.data.includes(payload);
          if (reflected) {
            const $ = cheerio.load(resp.data);
            const inScript = $(`script:contains("${payload.replace(/"/g, '\\"')}")`).length > 0;
            const inHtml = resp.data.includes(payload) && !inScript;

            if (inHtml) {
              this.addFinding({
                type: 'Cross-Site Scripting (Reflected XSS)',
                severity: 'high',
                detail: `Parameter '${paramName}' reflects unsanitized input via ${label}`,
                evidence: `Payload reflected in response body.\nURL: ${testUrl.toString()}\nPayload: ${payload}`,
                url,
                parameter: paramName,
                payload,
                remediation: 'Encode all user input in output. Implement Content-Security-Policy.',
              });
              this.log(`  HIGH: XSS in '${paramName}' at ${url} (${label})`);
              break;
            }
          }

          await sleep(this.delay);
        }
      }
    }
  }

  async testFormXss(forms) {
    this.log(`Testing ${forms.length} forms for reflected XSS...`);

    for (const form of forms) {
      for (const input of form.inputs) {
        if (input.type === 'submit') continue;

        for (const { payload, label } of XSS_PAYLOADS) {
          const testData = {};
          form.inputs.forEach(i => {
            testData[i.name] = (i.name === input.name) ? payload : (i.value || 'test');
          });

          let resp;
          if (form.method === 'POST') {
            resp = await safePost(form.actionUrl, new URLSearchParams(testData).toString());
          } else {
            const testUrl = new URL(form.actionUrl);
            Object.entries(testData).forEach(([k, v]) => testUrl.searchParams.set(k, v));
            resp = await safeGet(testUrl.toString());
          }

          if (resp.status === 0) continue;

          if (resp.data.includes(payload)) {
            this.addFinding({
              type: 'Cross-Site Scripting - Form (Reflected)',
              severity: 'high',
              detail: `Form field '${input.name}' at ${form.actionUrl} reflects unsanitized input`,
              evidence: `Payload reflected in response.\nForm: ${form.method} ${form.actionUrl}\nPayload: ${payload}`,
              url: form.actionUrl,
              parameter: input.name,
              payload,
              remediation: 'Encode all user input in output. Implement Content-Security-Policy.',
            });
            this.log(`  HIGH: Form XSS in '${input.name}' at ${form.actionUrl}`);
            break;
          }

          await sleep(this.delay);
        }
      }
    }
  }

  async testDirectoryTraversal(urls) {
    this.log(`Testing ${urls.length} URLs for directory traversal...`);

    for (const url of urls) {
      const parsedUrl = new URL(url);
      const params = [...parsedUrl.searchParams.entries()];

      if (params.length === 0) continue;

      for (const [paramName, paramValue] of params) {
        for (const { payload, label } of DIRECTORY_TRAVERSAL_PAYLOADS) {
          const testUrl = new URL(url);
          testUrl.searchParams.set(paramName, payload);

          const resp = await safeGet(testUrl.toString());
          if (resp.status === 0) continue;

          const matchedPattern = TRAVERSAL_RESPONSE_PATTERNS.find(p => p.regex.test(resp.data));
          if (matchedPattern) {
            this.addFinding({
              type: 'Directory Traversal',
              severity: 'critical',
              detail: `Parameter '${paramName}' is vulnerable to directory traversal via ${label}`,
              evidence: `Payload: ${payload}\nDetected: ${matchedPattern.label}\nResponse excerpt: ${resp.data.substring(0, 300)}`,
              url,
              parameter: paramName,
              payload,
              remediation: 'Validate and sanitize file paths. Use a chroot jail or sandbox. Never use user input in file operations.',
            });
            this.log(`  CRITICAL: Traversal in '${paramName}' at ${url}`);
            break;
          }

          await sleep(this.delay);
        }
      }
    }
  }

  async testOpenRedirects(urls) {
    this.log(`Testing ${urls.length} URLs for open redirects...`);

    const redirectUrls = urls.filter(url => {
      try {
        const u = new URL(url);
        const redirectParams = ['url', 'next', 'return', 'redirect', 'redirect_url', 'redirect_uri', 'goto', 'continue', 'dest', 'destination', 'redir'];
        return [...u.searchParams.keys()].some(k => redirectParams.includes(k.toLowerCase()));
      } catch {
        return false;
      }
    });

    for (const url of redirectUrls) {
      const parsedUrl = new URL(url);
      const redirectParam = [...parsedUrl.searchParams.keys()].find(k => {
        const redirectParams = ['url', 'next', 'return', 'redirect', 'redirect_url', 'redirect_uri', 'goto', 'continue', 'dest', 'destination', 'redir'];
        return redirectParams.includes(k.toLowerCase());
      });

      if (!redirectParam) continue;

      for (const { payload, label } of OPEN_REDIRECT_PAYLOADS) {
        const testUrl = new URL(url);
        testUrl.searchParams.set(redirectParam, payload);

        const resp = await safeGet(testUrl.toString(), { followRedirects: false });

        if (resp.status >= 300 && resp.status < 400) {
          const location = resp.headers['location'] || '';
          if (location.includes('evil.com') || location.includes('javascript:')) {
            this.addFinding({
              type: 'Open Redirect',
              severity: 'medium',
              detail: `Parameter '${redirectParam}' allows redirecting to external domains via ${label}`,
              evidence: `Payload: ${payload}\nRedirect location: ${location}\nHTTP Status: ${resp.status}`,
              url,
              parameter: redirectParam,
              payload,
              remediation: 'Validate redirect targets against an allowlist. Never redirect to user-supplied URLs without validation.',
            });
            this.log(`  MEDIUM: Open redirect in '${redirectParam}' at ${url}`);
            break;
          }
        }

        await sleep(this.delay);
      }
    }
  }

  async testSensitiveFiles() {
    this.log('Checking for sensitive files...');
    const paths = [
      '/robots.txt', '/sitemap.xml', '/.env', '/.git/HEAD', '/.git/config',
      '/wp-admin/', '/wp-config.php.bak', '/.htaccess', '/.htpasswd',
      '/server-status', '/server-info', '/phpinfo.php', '/info.php',
      '/.DS_Store', '/crossdomain.xml', '/config.php.bak', '/database.sql',
      '/backup.zip', '/dump.sql', '/.svn/entries', '/web.config',
    ];

    for (const path of paths) {
      const url = resolveUrl(this.targetUrl, path);
      if (!url) continue;

      const resp = await safeGet(url);
      if (resp.ok && resp.data.length > 0) {
        let severity = 'info';
        let detail = '';

        if (path === '/.git/HEAD' || path === '/.git/config') {
          severity = 'critical';
          detail = 'Git repository exposed publicly';
        } else if (path === '/.env') {
          severity = 'critical';
          detail = 'Environment file exposed with potential secrets';
        } else if (path === '/.htpasswd' || path === '/wp-config.php.bak') {
          severity = 'high';
          detail = 'Sensitive configuration backup exposed';
        } else if (path === '/phpinfo.php' || path === '/info.php') {
          severity = 'medium';
          detail = 'PHP info page exposes server configuration';
        } else if (path === '/server-status' || path === '/server-info') {
          severity = 'medium';
          detail = 'Server status page exposes internal information';
        } else if (path === '/robots.txt') {
          severity = 'info';
          detail = 'Robots.txt may reveal hidden paths';
        } else if (path.includes('.bak') || path.includes('.sql') || path.includes('.zip')) {
          severity = 'high';
          detail = 'Backup or dump file accessible';
        }

        this.addFinding({
          type: 'Sensitive File Exposure',
          severity,
          detail,
          evidence: `URL: ${url}\nStatus: ${resp.status}\nSize: ${resp.data.length} bytes`,
          url,
          remediation: 'Restrict access to sensitive files via server configuration.',
        });
        this.log(`  ${severity.toUpperCase()}: ${path}`);
      }

      await sleep(100);
    }
  }

  async runAll(crawlResults) {
    await this.checkSecurityHeaders();
    await this.testSensitiveFiles();

    const pageUrls = crawlResults.pages.map(p => p.url);
    const uniqueUrls = [...new Set(pageUrls)];

    await this.testSqlInjection(uniqueUrls);
    await this.testFormSqlInjection(crawlResults.forms);
    await this.testXss(uniqueUrls);
    await this.testFormXss(crawlResults.forms);
    await this.testDirectoryTraversal(uniqueUrls);
    await this.testOpenRedirects(uniqueUrls);

    return this.findings;
  }
}

module.exports = { VulnerabilityDetector };
