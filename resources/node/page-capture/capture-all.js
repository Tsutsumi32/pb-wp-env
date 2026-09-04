import fs from 'node:fs/promises';
import path from 'node:path';
import { buildCaptureJobs } from './build-capture-jobs.js';
import {
  buildOutputPath,
  buildTargetUrl,
  captureJob,
  parseArgs,
  launchCaptureBrowser,
  resolveCaptureBaseUrl,
  resolveCapturePublicOrigin,
} from './capture-runner.js';
import { writeCaptureCommandsMd } from './write-capture-commands-md.js';

const main = async () => {
  const args = parseArgs();
  const force = Boolean(args.force || process.env.CAPTURE_FORCE);
  const baseUrl = resolveCaptureBaseUrl(args['base-url']);
  const publicOrigin = resolveCapturePublicOrigin(args['public-origin']);
  const width = Number.parseInt(String(args.width || process.env.CAPTURE_WIDTH || '1440'), 10);
  const height = Number.parseInt(String(args.height || process.env.CAPTURE_HEIGHT || '900'), 10);
  const slugFilter = args.slug || process.env.CAPTURE_SLUG;

  const jobs = await buildCaptureJobs(process.cwd());
  const selectedJobs = slugFilter
    ? jobs.filter((job) => job.slug === slugFilter)
  : jobs;

  if (selectedJobs.length === 0) {
    throw new Error(`No capture jobs found${slugFilter ? ` for slug: ${slugFilter}` : ''}`);
  }

  const skipped = [];
  const succeeded = [];
  const failed = [];

  const browser = await launchCaptureBrowser();

  try {
    for (const job of selectedJobs) {
      const outputPath = buildOutputPath(job.slug);
      const targetUrl = buildTargetUrl(baseUrl, job.path);

      if (!force) {
        try {
          await fs.access(outputPath);
          skipped.push({ slug: job.slug, reason: 'already exists (use --force to overwrite)' });
          continue;
        } catch {
          // not exists
        }
      }

      try {
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        const result = await captureJob(browser, {
          slug: job.slug,
          targetUrl,
          outputPath,
          mode: job.mode,
          flow: job.flow,
          beforeCapture: job.beforeCapture,
          beforeCaptureArg: job.beforeCaptureArg,
          width,
          height,
          fetchOrigin: new URL(baseUrl).origin,
          publicOrigin,
        });
        succeeded.push({
          slug: job.slug,
          path: result.outputRelative,
          url: targetUrl,
          mode: job.mode ?? 'input',
        });
        console.log(`[capture-all] ok: capture-${job.slug}.png`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failed.push({ slug: job.slug, url: targetUrl, reason: message });
        console.error(`[capture-all] fail: ${job.slug} — ${message}`);
      }
    }
  } finally {
    await browser.close();
  }

  try {
    const commandsPath = await writeCaptureCommandsMd(process.cwd());
    console.log(`[capture-all] commands: ${commandsPath}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[capture-all] commands md failed: ${message}`);
  }

  console.log('\n[capture-all] summary');
  console.log(`  success: ${succeeded.length}`);
  console.log(`  skipped: ${skipped.length}`);
  console.log(`  failed: ${failed.length}`);

  if (succeeded.length > 0) {
    console.log('\n  saved:');
    succeeded.forEach((item) => {
      console.log(`    - capture-${item.slug}.png (${item.mode})`);
    });
  }

  if (skipped.length > 0) {
    console.log('\n  skipped:');
    skipped.forEach((item) => {
      console.log(`    - ${item.slug}: ${item.reason}`);
    });
  }

  if (failed.length > 0) {
    console.log('\n  failed:');
    failed.forEach((item) => {
      console.log(`    - ${item.slug}: ${item.reason}`);
    });
    process.exit(1);
  }
};

main().catch((error) => {
  console.error('[capture-all] failed:', error);
  process.exit(1);
});
