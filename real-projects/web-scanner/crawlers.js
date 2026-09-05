const cheerio = require('cheerio');
const { safeGet, resolveUrl, normalizeUrl, isSameDomain, isStaticResource, sleep } = require('./utils');

class WebCrawler {
  constructor(targetUrl, options = {}) {
    this.targetUrl = targetUrl;
    this.maxPages = options.maxPages || 50;
    this.maxDepth = options.maxDepth || 4;
    this.delay = options.delay || 300;
    this.verbose = options.verbose || false;

    this.visited = new Set();
    this.queue = [];
    this.pages = [];
    this.forms = [];
    this.links = new Set();
  }

  log(msg) {
    if (this.verbose) process.stdout.write(`  [crawl] ${msg}\n`);
  }

  async crawl() {
    this.queue.push({ url: normalizeUrl(this.targetUrl), depth: 0 });
    this.log(`Starting crawl from ${this.targetUrl}`);

    while (this.queue.length > 0 && this.visited.size < this.maxPages) {
      const { url, depth } = this.queue.shift();
      const norm = normalizeUrl(url);

      if (this.visited.has(norm)) continue;
      if (depth > this.maxDepth) continue;
      if (!isSameDomain(this.targetUrl, url)) continue;

      this.visited.add(norm);
      this.log(`[${this.visited.size}/${this.maxPages}] depth=${depth} ${norm}`);

      const resp = await safeGet(url);
      if (!resp.ok) {
        this.log(`  -> ${resp.status} (skipped)`);
        continue;
      }

      const contentType = resp.headers['content-type'] || '';
      if (!contentType.includes('text/html')) {
        this.log(`  -> non-HTML content (skipped)`);
        continue;
      }

      this.pages.push({
        url,
        status: resp.status,
        headers: resp.headers,
        body: resp.data,
        depth,
      });

      this.extractLinks(url, resp.data, depth);
      this.extractForms(url, resp.data);

      await sleep(this.delay);
    }

    this.log(`Crawl complete: ${this.visited.size} pages, ${this.forms.length} forms found`);
    return {
      pages: this.pages,
      forms: this.forms,
      links: [...this.links],
      visited: this.visited.size,
    };
  }

  extractLinks(pageUrl, html, depth) {
    const $ = cheerio.load(html);

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) return;

      const absolute = resolveUrl(pageUrl, href);
      if (!absolute) return;

      this.links.add(absolute);

      if (isSameDomain(this.targetUrl, absolute) && !isStaticResource(absolute)) {
        const norm = normalizeUrl(absolute);
        if (!this.visited.has(norm)) {
          this.queue.push({ url: absolute, depth: depth + 1 });
        }
      }
    });

    $('[src]').each((_, el) => {
      const src = $(el).attr('src');
      if (src) {
        const absolute = resolveUrl(pageUrl, src);
        if (absolute) this.links.add(absolute);
      }
    });

    $('[action]').each((_, el) => {
      const action = $(el).attr('action');
      if (action) {
        const absolute = resolveUrl(pageUrl, action);
        if (absolute) this.links.add(absolute);
      }
    });
  }

  extractForms(pageUrl, html) {
    const $ = cheerio.load(html);

    $('form').each((_, formEl) => {
      const $form = $(formEl);
      const action = $form.attr('action') || '';
      const method = ($form.attr('method') || 'GET').toUpperCase();
      const enctype = $form.attr('enctype') || 'application/x-www-form-urlencoded';

      const actionUrl = resolveUrl(pageUrl, action) || pageUrl;

      const inputs = [];
      $form.find('input, textarea, select').each((__, inputEl) => {
        const $input = $(inputEl);
        const name = $input.attr('name');
        if (!name) return;

        inputs.push({
          name,
          type: $input.attr('type') || 'text',
          value: $input.attr('value') || '',
        });
      });

      const form = {
        pageUrl,
        actionUrl,
        method,
        enctype,
        inputs,
        id: $form.attr('id') || '',
        name: $form.attr('name') || '',
      };

      this.forms.push(form);
      this.log(`  form: ${method} ${actionUrl} (${inputs.length} inputs)`);
    });
  }
}

async function discoverForms(targetUrl, pages) {
  const forms = [];
  const seen = new Set();

  for (const page of pages) {
    const $ = cheerio.load(page.body);

    $('form').each((_, formEl) => {
      const $form = $(formEl);
      const action = $form.attr('action') || '';
      const method = ($form.attr('method') || 'GET').toUpperCase();
      const enctype = $form.attr('enctype') || 'application/x-www-form-urlencoded';

      const actionUrl = resolveUrl(page.url, action) || page.url;
      const key = `${method}:${actionUrl}`;

      if (seen.has(key)) return;
      seen.add(key);

      const inputs = [];
      $form.find('input, textarea, select').each((__, inputEl) => {
        const $input = $(inputEl);
        const name = $input.attr('name');
        if (!name) return;
        inputs.push({
          name,
          type: $input.attr('type') || 'text',
          value: $input.attr('value') || '',
        });
      });

      forms.push({ pageUrl: page.url, actionUrl, method, enctype, inputs });
    });
  }

  return forms;
}

module.exports = { WebCrawler, discoverForms };
