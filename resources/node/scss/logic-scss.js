// scss-tasks.js
import { exec } from 'child_process';
import { readdirSync, unlinkSync, lstatSync } from 'fs';
import { join, normalize, resolve } from 'path';
import { BUILD_CONFIG } from '../../build-config.js';

const SCSS_EXCLUDE_ENTRIES = BUILD_CONFIG.SCSS.EXCLUDE_ENTRIES || [];
const SCSS_EXCLUDE_DIRS = BUILD_CONFIG.SCSS.EXCLUDE_DIRS || [];

/**
 * コンパイル除外対象のエントリSCSS / 除外ディレクトリ配下か
 * @param {string} filePath
 */
export function isExcludedScssEntry(filePath) {
  const normalized = normalize(resolve(filePath)).replace(/\\/g, '/');
  const cwd = process.cwd().replace(/\\/g, '/');

  if (
    SCSS_EXCLUDE_ENTRIES.some((entry) => {
      const exclude = normalize(resolve(cwd, entry)).replace(/\\/g, '/');
      return normalized === exclude;
    })
  ) {
    return true;
  }

  return SCSS_EXCLUDE_DIRS.some((dir) => {
    const exclude = normalize(resolve(cwd, dir)).replace(/\\/g, '/');
    return normalized === exclude || normalized.startsWith(`${exclude}/`);
  });
}

export function runCommand(cmd, label = '') {
  return new Promise((resolve) => {
    exec(cmd, (error, stdout, stderr) => {
      if (label) console.log(`▶ ${label}`);
      if (stdout) console.log(stdout.trim());
      if (stderr) console.error(stderr.trim());
      resolve({ error });
    });
  });
}

// export async function runStylelint() {
//   console.log('📝 StyleLint チェック...');
//   const { error } = await runCommand(`npx stylelint "${DIR_SRC_PATH}scss/**/*.scss"`, 'StyleLint');
//   if (error) {
//     console.warn('❌ StyleLint エラー');
//     return false;
//   } else {
//     console.log('✅ StyleLint 完了');
//     return true;
//   }
// }

// 再帰的にSCSSファイルを収集するヘルパー関数（index.scssと_で始まるファイルを除外）
export function collectScssFiles(scssDir, basePath = '') {
  const files = [];
  const fullScssDir = basePath ? join(scssDir, basePath) : scssDir;

  try {
    const entries = readdirSync(fullScssDir);

    for (const entry of entries) {
      const fullPath = join(fullScssDir, entry);
      const stat = lstatSync(fullPath);

      if (stat.isDirectory()) {
        // 除外ディレクトリは探索しない
        if (isExcludedScssEntry(fullPath)) {
          continue;
        }
        // ディレクトリの場合は再帰的に探索
        const newBasePath = basePath ? join(basePath, entry) : entry;
        files.push(...collectScssFiles(scssDir, newBasePath));
      } else if (entry.endsWith('.scss')) {
        // index.scssと_で始まるファイル（パーシャル）を除外
        if (entry === 'index.scss' || entry.startsWith('_')) {
          continue;
        }
        if (isExcludedScssEntry(fullPath)) {
          continue;
        }
        const relativePath = basePath ? join(basePath, entry) : entry;
        files.push({
          srcPath: fullPath,
          relativePath: relativePath,
          baseName: entry.replace('.scss', '')
        });
      }
    }
  } catch (error) {
    // ディレクトリが存在しない場合は無視
  }

  return files;
}

// 再帰的にCSSファイルを収集するヘルパー関数
function collectCssFiles(dir) {
  const files = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = lstatSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...collectCssFiles(fullPath));
    } else if (entry.endsWith('.css')) {
      files.push(fullPath);
    }
  }

  return files;
}

export async function runPostcss() {
  const cssDir = BUILD_CONFIG.SCSS.DIR_DIST;
  const cssFiles = collectCssFiles(cssDir);
  await runPostcssForFiles(cssFiles);
}

export async function runPostcssForFiles(cssFiles) {
  if (!cssFiles.length) {
    return;
  }

  console.log('🛠️ PostCSS 開始...');

  const tasks = cssFiles.map((filepath) =>
    runCommand(`npx postcss ${filepath} --map --replace`),
  );

  await Promise.all(tasks);
  console.log('✅ PostCSS 完了');
}


// ✅ 孤立CSS・MAP削除
export function cleanOrphanCssFiles() {
  console.log('🗑️ 不要な CSS / MAP ファイル削除チェック...');

  const SCSS_CONFIG = BUILD_CONFIG.SCSS;
  const cssDir = SCSS_CONFIG.DIR_DIST;
  const scssDir = SCSS_CONFIG.DIR_SRC;
  const PRESERVE_DIRECTORY_STRUCTURE = BUILD_CONFIG.PRESERVE_DIRECTORY_STRUCTURE;

  // コンパイル対象のSCSSファイル一覧を取得
  const validScssFiles = collectScssFiles(scssDir);
  const validCssPaths = new Set();

  validScssFiles.forEach(({ relativePath }) => {
    if (PRESERVE_DIRECTORY_STRUCTURE) {
      // ディレクトリ構造を維持する場合
      const cssRelativePath = relativePath.replace('.scss', '.css');
      validCssPaths.add(join(cssDir, cssRelativePath));
      validCssPaths.add(join(cssDir, cssRelativePath + '.map'));
    } else {
      // 1階層に全て出力する場合
      const fileName = relativePath.split(/[/\\]/).pop().replace('.scss', '.css');
      validCssPaths.add(join(cssDir, fileName));
      validCssPaths.add(join(cssDir, fileName + '.map'));
    }
  });

  function processDirectory(dir) {
    const entries = readdirSync(dir);

    entries.forEach((entry) => {
      const fullPath = join(dir, entry);
      const stat = lstatSync(fullPath);

      if (stat.isDirectory()) {
        // ディレクトリの場合は再帰的に処理
        processDirectory(fullPath);
      } else if (entry.endsWith('.css') || entry.endsWith('.css.map')) {
        // 有効なCSSファイルリストに含まれていない場合は削除
        if (!validCssPaths.has(fullPath)) {
          unlinkSync(fullPath);
          console.log(`🗑️ 削除済み: ${fullPath}`);
        }
      }
    });
  }

  processDirectory(cssDir);
}
