const axios = require('axios');
const { URL } = require('url');

const DEFAULT_HEADERS = {
  'User-Agent': 'WebScanner/1.0 (Security Audit Tool)',
  'Accept': 'text/html,application/xhtml+xml,*/*',
  'Accept-Language': 'en-US,en;q=0.9',
};

const REQUEST_TIMEOUT = parseInt(process.env.SCANNER_TIMEOUT) || 15000;

let axiosInstance = axios.create({
  timeout: REQUEST_TIMEOUT,
  headers: DEFAULT_HEADERS,
  maxRedirects: 5,
  validateStatus: (status) => status < 500,
});

function configureProxy(proxyUrl) {
  if (!proxyUrl) return;
  const { URL } = require('url');
  const p = new URL(proxyUrl);
  axiosInstance.defaults.proxy = {
    protocol: p.protocol.replace(':', ''),
    host: p.hostname,
    port: parseInt(p.port),
  };
}

async function safeGet(url, opts = {}) {
  try {
    const resp = await axiosInstance.get(url, {
      headers: { ...DEFAULT_HEADERS, ...opts.headers },
      timeout: opts.timeout || REQUEST_TIMEOUT,
      maxRedirects: opts.followRedirects === false ? 0 : 5,
    });
    return {
      status: resp.status,
      headers: resp.headers,
      data: typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data),
      url: resp.request?.res?.responseUrl || url,
      ok: resp.status >= 200 && resp.status < 400,
    };
  } catch (err) {
    if (err.response) {
      return {
        status: err.response.status,
        headers: err.response.headers,
        data: typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data || ''),
        url,
        ok: false,
        error: err.message,
      };
    }
    return { status: 0, headers: {}, data: '', url, ok: false, error: err.message };
  }
}

async function safePost(url, data, opts = {}) {
  try {
    const resp = await axiosInstance.post(url, data, {
      headers: { ...DEFAULT_HEADERS, 'Content-Type': 'application/x-www-form-urlencoded', ...opts.headers },
      timeout: opts.timeout || REQUEST_TIMEOUT,
      maxRedirects: opts.followRedirects === false ? 0 : 5,
    });
    return {
      status: resp.status,
      headers: resp.headers,
      data: typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data),
      url: resp.request?.res?.responseUrl || url,
      ok: resp.status >= 200 && resp.status < 400,
    };
  } catch (err) {
    if (err.response) {
      return {
        status: err.response.status,
        headers: err.response.headers,
        data: typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data || ''),
        url,
        ok: false,
        error: err.message,
      };
    }
    return { status: 0, headers: {}, data: '', url, ok: false, error: err.message };
  }
}

function resolveUrl(base, href) {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    u.hash = '';
    let normalized = u.href.replace(/\/+$/, '');
    return normalized;
  } catch {
    return url;
  }
}

function isSameDomain(url1, url2) {
  try {
    return new URL(url1).hostname === new URL(url2).hostname;
  } catch {
    return false;
  }
}

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function getOrigin(url) {
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}

function isStaticResource(url) {
  const ext = url.split('?')[0].split('#')[0].split('.').pop().toLowerCase();
  const staticExts = ['css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot', 'map', 'pdf'];
  return staticExts.includes(ext);
}

function stripTags(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  safeGet,
  safePost,
  resolveUrl,
  normalizeUrl,
  isSameDomain,
  getDomain,
  getOrigin,
  isStaticResource,
  stripTags,
  sleep,
  configureProxy,
  DEFAULT_HEADERS,
};
