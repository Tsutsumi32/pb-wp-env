import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { BUILD_CONFIG } from '../../build-config.js';

const ROOT_DIR = process.cwd();
const FONT_SUBSET_CONFIG = BUILD_CONFIG.FONT_SUBSET;
const OUTPUT_FILE_PATH = path.resolve(ROOT_DIR, FONT_SUBSET_CONFIG.FILE_CHARS_CRAWLED);
// Docker ネットワーク上の到達先（例: http://wordpress / http://php）
const BASE_URL = process.env.FONT_CRAWL_BASE_URL || 'http://php';
// HTML 上のリンク origin（例: http://localhost:3000）。未指定時は BASE_URL と同じ。
const PUBLIC_ORIGIN = process.env.FONT_CRAWL_PUBLIC_ORIGIN || BASE_URL;
const START_PATHS = FONT_SUBSET_CONFIG.CRAWL_START_PATHS || ['/'];
const MAX_PAGES = FONT_SUBSET_CONFIG.CRAWL_MAX_PAGES || 200;
const MAX_DEPTH = FONT_SUBSET_CONFIG.CRAWL_MAX_DEPTH || 3;
const EXCLUDE_PATTERNS = FONT_SUBSET_CONFIG.CRAWL_EXCLUDE_PATTERNS || [];

// html-map 由来の文字列に含まれる代表的な実体参照を通常文字へ戻す。
const decodeHtmlEntities = (input) => {
  return input
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
};

const shouldExcludeUrl = (url) => {
  return EXCLUDE_PATTERNS.some((pattern) => url.pathname.includes(pattern));
};

const normalizeUrlForVisit = (url) => {
  const normalized = new URL(url.toString());
  normalized.hash = '';
  return normalized.toString();
};

// WP_HOME 由来の public origin を、ローカルプロキシ origin へ寄せる。
const toCrawlUrl = (url, crawlOrigin, publicOrigin) => {
  const target = new URL(url.toString());
  if (target.origin === publicOrigin) {
    return normalizeUrlForVisit(new URL(`${target.pathname}${target.search}`, crawlOrigin));
  }
  return normalizeUrlForVisit(target);
};

const extractLinks = async (page, allowedOrigins, crawlOrigin, publicOrigin) => {
  const hrefs = await page.$$eval('a[href]', (anchors) => anchors.map((a) => a.getAttribute('href') || ''));
  const urls = new Set();

  for (const href of hrefs) {
    if (!href) {
      continue;
    }
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
      continue;
    }

    let resolved;
    try {
      resolved = new URL(href, page.url());
    } catch {
      continue;
    }

    if (!allowedOrigins.has(resolved.origin)) {
      continue;
    }
    if (shouldExcludeUrl(resolved)) {
      continue;
    }

    urls.add(toCrawlUrl(resolved, crawlOrigin, publicOrigin));
  }

  return [...urls];
};

/**
 * Chromium は Host ヘッダ上書きを拒否するため、
 * 127.0.0.1 のプロキシ経由で upstream へ正しい Host を付けて転送する。
 */
const startCrawlProxy = (upstreamUrl, publicHost) => {
  const upstream = new URL(upstreamUrl);
  const upstreamPort = upstream.port || (upstream.protocol === 'https:' ? '443' : '80');

  const server = http.createServer((req, res) => {
    const headers = { ...req.headers, host: publicHost };
    const proxyReq = http.request(
      {
        protocol: upstream.protocol,
        hostname: upstream.hostname,
        port: upstreamPort,
        path: req.url,
        method: req.method,
        headers,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );
    proxyReq.on('error', (error) => {
      res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Proxy error: ${error.message}`);
    });
    req.pipe(proxyReq);
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Failed to bind crawl proxy'));
        return;
      }
      resolve({
        origin: `http://127.0.0.1:${address.port}`,
        close: () =>
          new Promise((closeResolve, closeReject) => {
            server.close((error) => (error ? closeReject(error) : closeResolve()));
          }),
      });
    });
  });
};

const main = async () => {
  const publicOrigin = new URL(PUBLIC_ORIGIN).origin;
  const publicHost = new URL(PUBLIC_ORIGIN).host;
  const crawlHost = new URL(BASE_URL).host;
  const needsProxy = publicHost !== crawlHost;

  let crawlOrigin = new URL(BASE_URL).origin;
  let proxyClose = async () => {};

  if (needsProxy) {
    const proxy = await startCrawlProxy(BASE_URL, publicHost);
    crawlOrigin = proxy.origin;
    proxyClose = proxy.close;
  }

  const allowedOrigins = new Set([crawlOrigin, publicOrigin, new URL(BASE_URL).origin]);

  const queue = START_PATHS.map((startPath) => ({
    url: toCrawlUrl(new URL(startPath, `${PUBLIC_ORIGIN}/`), crawlOrigin, publicOrigin),
    depth: 0,
  }));
  const visited = new Set();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  // 重複を避けるため Set で収集する。
  const charset = new Set();
  let crawledCount = 0;

  try {
    while (queue.length > 0 && crawledCount < MAX_PAGES) {
      const current = queue.shift();
      if (!current || visited.has(current.url)) {
        continue;
      }
      visited.add(current.url);

      try {
        await page.goto(current.url, { waitUntil: 'domcontentloaded' });
      } catch (error) {
        console.warn(`Skip (navigation failed): ${current.url} (${error.message})`);
        continue;
      }
      crawledCount += 1;

      // 画面上の可視テキストを取り出し、正規化した1文字単位で収集する。
      const textContent = await page.evaluate(() => document.body?.innerText || '');
      for (const char of decodeHtmlEntities(textContent).normalize('NFC')) {
        if (char.trim() === '') {
          continue;
        }
        charset.add(char);
      }

      if (current.depth >= MAX_DEPTH) {
        continue;
      }

      const links = await extractLinks(page, allowedOrigins, crawlOrigin, publicOrigin);
      for (const nextUrl of links) {
        if (!visited.has(nextUrl)) {
          queue.push({ url: nextUrl, depth: current.depth + 1 });
        }
      }
    }
  } finally {
    await browser.close();
    await proxyClose();
  }

  // 差分比較しやすいように並び順を固定して保存する。
  const sortedChars = [...charset].sort((a, b) => a.localeCompare(b, 'ja'));
  await fs.mkdir(path.dirname(OUTPUT_FILE_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_FILE_PATH, sortedChars.join('') + '\n', 'utf8');

  console.log(`Crawled ${crawledCount} pages.`);
  console.log(`Extracted ${sortedChars.length} unique characters.`);
  console.log(`Saved: ${OUTPUT_FILE_PATH}`);
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
