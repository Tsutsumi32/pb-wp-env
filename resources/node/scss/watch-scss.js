import chokidar from 'chokidar';
import {
  runPostcssForFiles,
  cleanOrphanCssFiles,
  runCommand,
} from './logic-scss.js';
import { resolveCompileEntries } from './logic-scss-deps.js';
import { BUILD_CONFIG } from '../../build-config.js';
import { join, dirname, relative, resolve, normalize } from 'path';
import { mkdirSync } from 'fs';

const SCSS_CONFIG = BUILD_CONFIG.SCSS;
const scssDir = normalize(resolve(SCSS_CONFIG.DIR_SRC)).replace(/\\/g, '/');
const cssDir = SCSS_CONFIG.DIR_DIST;
const PRESERVE_DIRECTORY_STRUCTURE = BUILD_CONFIG.PRESERVE_DIRECTORY_STRUCTURE;

let postcssTimeout;
let isPostcssRunning = false;
let compileTimeout;
let isCompileRunning = false;
const pendingPostcssOutputs = new Set();

/**
 * エントリSCSSの出力CSSパスを取得
 * @param {string} entryPath
 */
function getCssOutputPath(entryPath) {
  const relativePath = relative(scssDir, entryPath);
  const fileName = relativePath.split(/[/\\]/).pop() ?? '';

  if (PRESERVE_DIRECTORY_STRUCTURE) {
    return join(cssDir, relativePath.replace('.scss', '.css'));
  }

  return join(cssDir, fileName.replace('.scss', '.css'));
}

/**
 * 指定されたエントリのOUTPUT_FILEをコンパイルする
 * @param {string[]} entryPaths
 */
async function compileEntryFiles(entryPaths) {
  const uniqueEntries = [...new Set(entryPaths.map((entryPath) => normalize(resolve(entryPath)).replace(/\\/g, '/')))];
  const compiledCssPaths = [];

  if (uniqueEntries.length === 0) {
    console.warn('⚠️  コンパイル対象のエントリが見つかりませんでした');
    return compiledCssPaths;
  }

  for (const entryPath of uniqueEntries) {
    const outputPath = getCssOutputPath(entryPath);
    const outputDir = dirname(outputPath);

    try {
      mkdirSync(outputDir, { recursive: true });
    } catch (error) {
      // ディレクトリが既に存在する場合は無視
    }

    const displayPath = relative(scssDir, entryPath).replace(/\\/g, '/');
    console.log(`📝 コンパイル: ${displayPath}`);
    await runCommand(`npx sass --source-map ${entryPath}:${outputPath}`, displayPath);
    compiledCssPaths.push(outputPath);
  }

  return compiledCssPaths;
}

function schedulePostcss(cssPaths) {
  cssPaths.forEach((cssPath) => pendingPostcssOutputs.add(cssPath));

  if (postcssTimeout) {
    clearTimeout(postcssTimeout);
  }

  postcssTimeout = setTimeout(async () => {
    if (isPostcssRunning) return;
    isPostcssRunning = true;

    const targets = [...pendingPostcssOutputs];
    pendingPostcssOutputs.clear();
    await runPostcssForFiles(targets);
    isPostcssRunning = false;
  }, 500);
}

async function compileScssFile(scssPath) {
  const entryPaths = resolveCompileEntries(scssPath);

  if (entryPaths.length === 0) {
    const displayPath = relative(scssDir, scssPath).replace(/\\/g, '/');
    console.warn(`⚠️  コンパイル対象なし: ${displayPath}`);
    return;
  }

  if (entryPaths.length === 1) {
    console.log('🔄 依存エントリをコンパイル');
  } else {
    console.log(`🔄 依存エントリをコンパイル (${entryPaths.length}件)`);
  }

  const compiledCssPaths = await compileEntryFiles(entryPaths);
  schedulePostcss(compiledCssPaths);
}

const watchPaths = [scssDir];

function handleChange(scssPath) {
  if (!scssPath.endsWith('.scss')) return;

  if (compileTimeout) {
    clearTimeout(compileTimeout);
  }

  compileTimeout = setTimeout(async () => {
    if (isCompileRunning) return;
    isCompileRunning = true;

    try {
      await compileScssFile(scssPath);
    } finally {
      isCompileRunning = false;
    }
  }, 200);
}

chokidar
  .watch(watchPaths, {
    ignored: /(^|[/\\])\../,
    persistent: true,
    ignoreInitial: true,
    usePolling: false,
    depth: 99,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50,
    },
  })
  .on('ready', () => {
    console.log('🟢 SCSSファイル監視 スタート');
  })
  .on('add', handleChange)
  .on('change', handleChange)
  .on('unlink', (scssPath) => {
    console.log(`🗑️  削除検知: ${relative(scssDir, scssPath).replace(/\\/g, '/')}`);
    cleanOrphanCssFiles();
  });
