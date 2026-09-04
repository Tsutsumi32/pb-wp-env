import { existsSync } from 'fs';
import { join, resolve, normalize, relative } from 'path';
import { BUILD_CONFIG } from '../../build-config.js';
import { collectScssFiles, isExcludedScssEntry } from './logic-scss.js';

const SCSS_CONFIG = BUILD_CONFIG.SCSS;
const SCSS_DIR = normalize(resolve(SCSS_CONFIG.DIR_SRC)).replace(/\\/g, '/');
const SCSS_INDEX = BUILD_CONFIG.SCSS_INDEX;
const SCSS_INDEX_ENTRIES = Array.isArray(SCSS_INDEX) ? SCSS_INDEX : [SCSS_INDEX];
const FOUNDATION_DIR = join(SCSS_DIR, 'foundation').replace(/\\/g, '/');
const WP_BLOCK_STYLES_ENTRY = join(SCSS_DIR, 'wp-block-styles.scss').replace(/\\/g, '/');
const WP_BLOCK_EDITOR_DIR = join(SCSS_DIR, 'wp-block-editor').replace(/\\/g, '/');
const PAGES_DIR = join(SCSS_DIR, 'pages').replace(/\\/g, '/');

let compileDependsCache = null;

/**
 * forward エントリの TARGET_DIRS のうち FOUNDATION_DIR 外のディレクトリを収集
 * foundation/index 経由で @forward されるが物理配置が foundation 外のパス用
 * @param {string} cwd
 * @returns {string[]}
 */
function getForwardExternalDirs(cwd) {
  const externalDirs = new Set();

  SCSS_INDEX_ENTRIES.forEach((indexEntry) => {
    if ((indexEntry.IMPORT_TYPE || 'use') !== 'forward' || !indexEntry.TARGET_DIRS) {
      return;
    }

    indexEntry.TARGET_DIRS.forEach((dir) => {
      const normalized = normalize(resolve(cwd, dir)).replace(/\\/g, '/');
      if (normalized !== FOUNDATION_DIR && !normalized.startsWith(`${FOUNDATION_DIR}/`)) {
        externalDirs.add(normalized);
      }
    });
  });

  return [...externalDirs];
}

/**
 * foundation 利用エントリ向けの依存ディレクトリを構築
 * @param {string} cwd
 * @param {string[]} additionalDirs
 * @returns {string[]}
 */
function buildFoundationDependsDirs(cwd, additionalDirs = []) {
  const dirs = new Set(additionalDirs);
  dirs.add(FOUNDATION_DIR);
  getForwardExternalDirs(cwd).forEach((dir) => dirs.add(dir));
  return [...dirs];
}

/**
 * パスが除外ディレクトリ配下か
 * @param {string} filePath
 * @param {string[]} excludeDirs
 */
function isExcludedPath(filePath, excludeDirs = []) {
  const normalized = normalize(resolve(filePath)).replace(/\\/g, '/');
  const cwd = process.cwd().replace(/\\/g, '/');

  return excludeDirs.some((dir) => {
    const exclude = normalize(resolve(cwd, dir)).replace(/\\/g, '/');
    return normalized === exclude || normalized.startsWith(`${exclude}/`);
  });
}

/**
 * コンパイルエントリと依存ディレクトリの対応を構築
 * @returns {{ entry: string, dirs: string[], excludeDirs: string[] }[]}
 */
export function getScssCompileDepends() {
  if (compileDependsCache) {
    return compileDependsCache;
  }

  const cwd = process.cwd();
  const depends = [];

  SCSS_INDEX_ENTRIES.forEach((indexEntry) => {
    if ((indexEntry.IMPORT_TYPE || 'use') !== 'use' || !indexEntry.OUTPUT_FILE) {
      return;
    }

    const entryPath = normalize(resolve(cwd, indexEntry.OUTPUT_FILE)).replace(/\\/g, '/');
    const dirs = new Set(
      (indexEntry.TARGET_DIRS || []).map((dir) =>
        normalize(resolve(cwd, dir)).replace(/\\/g, '/'),
      ),
    );
    buildFoundationDependsDirs(cwd).forEach((dir) => dirs.add(dir));

    depends.push({
      entry: entryPath,
      dirs: [...dirs],
      excludeDirs: indexEntry.EXCLUDE_DIRS || [],
    });
  });

  if (!isExcludedScssEntry(WP_BLOCK_STYLES_ENTRY)) {
    depends.push({
      entry: WP_BLOCK_STYLES_ENTRY,
      dirs: buildFoundationDependsDirs(cwd, [WP_BLOCK_EDITOR_DIR]),
      excludeDirs: [],
    });
  }

  if (existsSync(PAGES_DIR)) {
    const pageEntries = collectScssFiles(SCSS_CONFIG.DIR_SRC, 'pages');
    pageEntries.forEach(({ srcPath }) => {
      depends.push({
        entry: normalize(resolve(srcPath)).replace(/\\/g, '/'),
        dirs: buildFoundationDependsDirs(cwd, [PAGES_DIR]),
        excludeDirs: [],
      });
    });
  }

  compileDependsCache = depends;
  return depends;
}

/**
 * 変更ファイルに対応するコンパイル対象エントリを解決
 * @param {string} scssPath
 * @returns {string[]} コンパイル対象エントリの絶対パス（重複なし）
 */
export function resolveCompileEntries(scssPath) {
  const absolutePath = normalize(resolve(scssPath)).replace(/\\/g, '/');
  const relativePath = relative(SCSS_DIR, scssPath).replace(/\\/g, '/');
  const fileName = relativePath.split('/').pop() ?? '';
  const isPartial = fileName.startsWith('_');
  const isIndexScss = fileName === 'index.scss';

  if (!isPartial && !isIndexScss) {
    return isExcludedScssEntry(absolutePath) ? [] : [absolutePath];
  }

  const matchedEntries = new Set();

  getScssCompileDepends().forEach((dep) => {
    if (isExcludedPath(absolutePath, dep.excludeDirs)) {
      return;
    }

    const isMatched = dep.dirs.some((dir) => {
      return absolutePath === dir || absolutePath.startsWith(`${dir}/`);
    });

    if (isMatched) {
      matchedEntries.add(dep.entry);
    }
  });

  return [...matchedEntries];
}
