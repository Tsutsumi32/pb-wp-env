import fs from 'node:fs/promises';
import path from 'node:path';
import {
  buildOutputPath,
  buildTargetUrl,
  captureJob,
  parseArgs,
  launchCaptureBrowser,
  resolveCaptureBaseUrl,
  resolveCapturePublicOrigin,
  toSlug,
} from './capture-runner.js';

const main = async () => {
  const args = parseArgs();
  const width = Number.parseInt(String(args.width || process.env.CAPTURE_WIDTH || '1440'), 10);
  const height = Number.parseInt(String(args.height || process.env.CAPTURE_HEIGHT || '900'), 10);
  const baseUrl = resolveCaptureBaseUrl(args['base-url']);
  const publicOrigin = resolveCapturePublicOrigin(args['public-origin']);
  const pagePath = args.path || process.env.CAPTURE_PATH || '/';
  const explicitUrl = args.url || process.env.CAPTURE_URL;
  const mode = args.mode || process.env.CAPTURE_MODE || 'input';
  const flow = args.flow || process.env.CAPTURE_FLOW;
  const beforeCapture = args['before-capture'] || process.env.CAPTURE_BEFORE;
  const beforeCaptureArg = args['before-arg'] || process.env.CAPTURE_BEFORE_ARG;

  const targetUrl = explicitUrl || buildTargetUrl(baseUrl, pagePath);
  const slug = args.slug || process.env.CAPTURE_SLUG || toSlug(new URL(targetUrl).pathname);
  const outputPath =
    args.out || process.env.CAPTURE_OUT
      ? path.resolve(process.cwd(), String(args.out || process.env.CAPTURE_OUT))
      : buildOutputPath(slug);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const browser = await launchCaptureBrowser();
  try {
    const result = await captureJob(browser, {
      slug,
      targetUrl,
      outputPath,
      mode,
      flow,
      beforeCapture,
      beforeCaptureArg,
      width,
      height,
      fetchOrigin: new URL(baseUrl).origin,
      publicOrigin,
    });

    console.log(`[capture-page] saved: ${result.outputRelative}`);
    console.log(`[capture-page] url: ${targetUrl}`);
    console.log(`[capture-page] mode: ${mode}`);
    console.log(`[capture-page] png width: ${result.pngWidth}px`);
  } finally {
    await browser.close();
  }
};

main().catch((error) => {
  console.error('[capture-page] failed:', error);
  process.exit(1);
});
