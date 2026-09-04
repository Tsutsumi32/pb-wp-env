import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { getEnv, loadEnv } from '../load-env.js';
import { CAPTURE_CONFIG } from './capture-config.js';
import { FLOW_RUNNERS } from './flows/kawamoto-service-hp.js';
import { preparePageForCapture } from './prepare-page.js';

const EXPECTED_WIDTH = 1440;

/**
 * キャプチャ用 Chromium（Linux のフォントヒンティング差を抑える）
 * @returns {Promise<import('@playwright/test').Browser>}
 */
export const launchCaptureBrowser = () => {
  return chromium.launch({
    headless: true,
    args: ['--font-render-hinting=none', '--disable-lcd-text'],
  });
};

/**
 * キャプチャ先ベース URL（Playwright コンテナ内は host.docker.internal 経由）
 * @param {string | undefined} explicit CLI の --base-url
 * @returns {string}
 */
export const resolveCaptureBaseUrl = (explicit) => {
  if (explicit) return explicit;
  if (process.env.CAPTURE_BASE_URL) return process.env.CAPTURE_BASE_URL;

  loadEnv();
  const port = getEnv('WP_CHAGE_PORT', getEnv('FRONT_PORT', '3000'));
  const localAddress = getEnv('LOCAL_ADDRESS', 'localhost');

  if (existsSync('/capture-out')) {
    return `http://host.docker.internal:${port}`;
  }

  return `http://${localAddress}:${port}`;
};

/**
 * WordPress / Browser Sync が HTML に出力する公開 origin（WP_HOME 相当）
 * @param {string | undefined} explicit
 * @returns {string}
 */
export const resolveCapturePublicOrigin = (explicit) => {
  if (explicit) return explicit;
  if (process.env.CAPTURE_PUBLIC_ORIGIN) return process.env.CAPTURE_PUBLIC_ORIGIN;

  loadEnv();
  const port = getEnv('WP_CHAGE_PORT', getEnv('FRONT_PORT', '3000'));
  const localAddress = getEnv('LOCAL_ADDRESS', 'localhost');
  return `http://${localAddress}:${port}`;
};

/**
 * HTML 上の localhost 等を Playwright コンテナから到達可能な origin へリライトする
 * @param {import('@playwright/test').Page} page
 * @param {string} fetchOrigin 実際に取得する origin（例: http://host.docker.internal:3000）
 * @param {string} publicOrigin HTML 上の origin（例: http://localhost:3000）
 */
export const setupCaptureRequestRouting = async (page, fetchOrigin, publicOrigin) => {
  const fetchUrl = new URL(fetchOrigin);
  const publicUrl = new URL(publicOrigin);

  if (fetchUrl.origin === publicUrl.origin) {
    return;
  }

  const rewriteOrigins = new Set([publicUrl.origin]);
  if (publicUrl.hostname === 'localhost') {
    rewriteOrigins.add(`http://127.0.0.1:${publicUrl.port || '80'}`);
  }

  const rewriteUrl = (urlString) => {
    try {
      const url = new URL(urlString);
      if (!rewriteOrigins.has(url.origin)) {
        return urlString;
      }
      return `${fetchUrl.origin}${url.pathname}${url.search}${url.hash}`;
    } catch {
      return urlString;
    }
  };

  await page.route('**/*', async (route) => {
    const request = route.request();
    const rewritten = rewriteUrl(request.url());
    if (rewritten !== request.url()) {
      await route.continue({ url: rewritten });
      return;
    }
    await route.continue();
  });
};

/**
 * @returns {Record<string, string | true>}
 */
export const parseArgs = () => {
  const args = process.argv.slice(2);
  const result = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const value = args[i + 1];
    if (!value || value.startsWith('--')) {
      result[key] = true;
      continue;
    }
    result[key] = value;
    i += 1;
  }
  return result;
};

/**
 * @param {string} value
 * @returns {string}
 */
export const toSlug = (value) => {
  const normalized = (value || '').replace(/^\/+|\/+$/g, '');
  if (!normalized) return 'top';
  return normalized.replace(/[^a-zA-Z0-9/_-]/g, '-').replace(/\//g, '-');
};

/**
 * @param {string} filePath
 * @returns {Promise<number>}
 */
export const readPngWidth = async (filePath) => {
  const fd = await fs.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(24);
    await fd.read(buffer, 0, 24, 0);
    return buffer.readUInt32BE(16);
  } finally {
    await fd.close();
  }
};

/**
 * @param {import('@playwright/test').Page} page
 * @param {{
 *   mode?: string;
 *   flow?: string;
 *   beforeCapture?: string;
 *   beforeCaptureArg?: string;
 * }} job
 * @returns {Promise<void>}
 */
export const runCaptureFlow = async (page, job) => {
  const mode = job.mode ?? 'input';

  if (mode === 'confirm') {
    const flowName = job.flow;
    if (!flowName || !FLOW_RUNNERS[flowName]) {
      throw new Error(`confirm mode requires a valid flow: ${flowName ?? '(missing)'}`);
    }
    await FLOW_RUNNERS[flowName](page);
    return;
  }

  if (job.beforeCapture === 'recruitmentTab') {
    await FLOW_RUNNERS.recruitmentTab(page, job.beforeCaptureArg ?? 'new');
  }

  if (job.flow && FLOW_RUNNERS[job.flow]) {
    await FLOW_RUNNERS[job.flow](page);
  }
};

/**
 * @param {import('@playwright/test').Browser} browser
 * @param {{
 *   slug: string;
 *   targetUrl: string;
 *   outputPath: string;
 *   mode?: string;
 *   flow?: string;
 *   beforeCapture?: string;
 *   beforeCaptureArg?: string;
 *   width?: number;
 *   height?: number;
 *   fetchOrigin?: string;
 *   publicOrigin?: string;
 * }} options
 * @returns {Promise<{ outputRelative: string; pngWidth: number }>}
 */
export const captureJob = async (browser, options) => {
  const width = options.width ?? EXPECTED_WIDTH;
  const height = options.height ?? 900;
  const mode = options.mode ?? 'input';
  const fetchOrigin = options.fetchOrigin ?? new URL(options.targetUrl).origin;
  const publicOrigin = options.publicOrigin ?? fetchOrigin;

  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();

  try {
    await setupCaptureRequestRouting(page, fetchOrigin, publicOrigin);
    await page.goto(options.targetUrl, { waitUntil: 'networkidle', timeout: 60000 });

    if (mode === 'input') {
      await preparePageForCapture(page, { resetForms: true });
      await runCaptureFlow(page, options);
      if (options.flow) {
        await preparePageForCapture(page, { resetForms: false });
      }
    } else {
      await runCaptureFlow(page, options);
      await preparePageForCapture(page, { resetForms: false });
    }

    await page.evaluate(async () => {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
    });
    await page.waitForTimeout(150);
    await page.screenshot({ path: options.outputPath, fullPage: true });

    const pngWidth = await readPngWidth(options.outputPath);
    if (pngWidth !== EXPECTED_WIDTH) {
      throw new Error(
        `PNG width must be ${EXPECTED_WIDTH}px but got ${pngWidth}px (slug: ${options.slug})`,
      );
    }

    return { outputRelative: options.outputPath, pngWidth };
  } finally {
    await context.close();
  }
};

/**
 * @param {string} slug
 * @returns {string}
 */
export const buildOutputPath = (slug) => {
  return path.join(CAPTURE_CONFIG.outputDir, `capture-${slug}.png`);
};

/**
 * @param {string} baseUrl
 * @param {string} pagePath
 * @returns {string}
 */
export const buildTargetUrl = (baseUrl, pagePath) => {
  return new URL(pagePath, baseUrl).toString();
};
