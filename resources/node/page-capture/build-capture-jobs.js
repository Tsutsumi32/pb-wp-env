import path from 'node:path';
import {
  CAPTURE_CONFIG,
  CAPTURE_SLUGS_REPLACED_BY_VARIANTS,
  CAPTURE_VARIANT_JOBS,
} from './capture-config.js';
import { parsePagesPhpSlugs } from './parse-pages-php.js';

/**
 * slug から URL パスを組み立てる
 * @param {string} slug
 * @returns {string}
 */
export const slugToPath = (slug) => {
  if (CAPTURE_CONFIG.pathOverrides[slug]) {
    return CAPTURE_CONFIG.pathOverrides[slug];
  }
  if (slug === 'top') {
    return '/';
  }
  return `/${slug}/`;
};

/**
 * キャプチャジョブ一覧を組み立てる
 * @param {string} resourcesRoot
 * @returns {Promise<Array<{
 *   slug: string;
 *   path: string;
 *   mode?: string;
 *   flow?: string;
 *   beforeCapture?: string;
 *   beforeCaptureArg?: string;
 * }>>}
 */
export const buildCaptureJobs = async (resourcesRoot) => {
  const pagesPhpPath = path.resolve(resourcesRoot, CAPTURE_CONFIG.pagesPhpPath);
  const pagesSlugs = await parsePagesPhpSlugs(pagesPhpPath);

  const baseJobs = pagesSlugs
    .filter((slug) => !CAPTURE_CONFIG.excludeSlugs.includes(slug))
    .filter((slug) => !CAPTURE_SLUGS_REPLACED_BY_VARIANTS.includes(slug))
    .map((slug) => ({
      slug,
      path: slugToPath(slug),
      mode: 'input',
    }));

  const variantJobs = CAPTURE_VARIANT_JOBS.map((job) => ({
    slug: job.slug,
    path: job.path,
    mode: job.mode ?? 'input',
    flow: job.flow,
    beforeCapture: job.beforeCapture,
    beforeCaptureArg: job.beforeCaptureArg,
  }));

  return [...baseJobs, ...variantJobs];
};
