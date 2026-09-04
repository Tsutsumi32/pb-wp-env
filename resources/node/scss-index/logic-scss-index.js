// logic-scss-index.js
import { BUILD_CONFIG } from '../../build-config.js';
import { join, dirname, relative, basename } from 'path';
import { writeFileSync, mkdirSync, readdirSync, lstatSync, existsSync } from 'fs';

/**
 * パスが EXCLUDE_DIRS に含まれるか（配下も含む）
 * @param {string} fullPath
 * @param {string[]} excludeDirs
 */
function isExcludedPath(fullPath, excludeDirs = []) {
  const normalized = fullPath.replace(/\\/g, '/');
  return excludeDirs.some((dir) => {
    const exclude = dir.replace(/\\/g, '/');
    return normalized === exclude || normalized.startsWith(`${exclude}/`);
  });
}

/**
 * コメント用ラベルを取得（scss/ 以降の相対パス）
 * @param {string} targetDir
 * @returns {string}
 */
function getDirCommentLabel(targetDir) {
  const normalized = targetDir.replace(/\\/g, '/');
  const scssMarker = '/scss/';
  const markerIndex = normalized.indexOf(scssMarker);

  if (markerIndex >= 0) {
    return normalized.slice(markerIndex + scssMarker.length);
  }

  return normalized.split('/').pop();
}

/**
 * index.scss を持つ TARGET ディレクトリ向けの @use / @forward パスを解決する。
 * OUTPUT ファイル名と TARGET ディレクトリ名が同一の場合、@use './name' が自ファイル参照になるため '/index' を付与する。
 *
 * @param {string} outputFile
 * @param {string} outputDirPath
 * @param {string} targetDir
 * @returns {string}
 */
function resolveIndexUsePath(outputFile, outputDirPath, targetDir) {
  const relativePath = relative(outputDirPath, targetDir).replace(/\\/g, '/');
  const usePath = `./${relativePath}`;

  const outputBaseName = basename(outputFile, '.scss');
  const targetBaseName = basename(targetDir);

  if (outputBaseName === targetBaseName) {
    return `${usePath}/index`;
  }

  return usePath;
}

/**
 * 指定したディレクトリ内のSCSSファイルを収集（index.scssと_で始まるファイルを除外）
 * @param {string} targetDir
 * @param {string[]} [excludeDirs=[]] 再帰探索から除外するディレクトリ
 */
export function collectScssFiles(targetDir, excludeDirs = []) {
  const files = [];

  if (!existsSync(targetDir) || isExcludedPath(targetDir, excludeDirs)) {
    return files;
  }

  try {
    const entries = readdirSync(targetDir);

    for (const entry of entries) {
      const fullPath = join(targetDir, entry);
      const stat = lstatSync(fullPath);

      if (stat.isDirectory()) {
        if (isExcludedPath(fullPath, excludeDirs)) {
          continue;
        }
        // ディレクトリの場合は再帰的に探索
        files.push(...collectScssFiles(fullPath, excludeDirs));
      } else if (entry.endsWith('.scss')) {
        // index.scssのみを除外（パーシャルファイルは含める）
        if (entry === 'index.scss') {
          continue;
        }
        // 対象ディレクトリからの相対パスを取得
        const relativePath = relative(targetDir, fullPath);
        files.push({
          relativePath: relativePath.replace(/\\/g, '/'),
          baseName: entry.replace('.scss', '')
        });
      }
    }
  } catch (error) {
    // エラーが発生した場合は無視
    console.warn(`警告: ${targetDir} の読み取りでエラーが発生しました: ${error.message}`);
  }

  return files;
}

/**
 * 1エントリ分のSCSSインデックスファイルのコンテンツを生成
 * @param {Object} entry - { OUTPUT_FILE, TARGET_DIRS, IMPORT_TYPE }
 * @returns {string}
 */
export function generateScssIndexContent(entry) {
  const outputFile = entry.OUTPUT_FILE;
  const targetDirs = entry.TARGET_DIRS;
  const excludeDirs = entry.EXCLUDE_DIRS || [];
  const importType = entry.IMPORT_TYPE || 'use'; // 'use' | 'forward'
  const directive = importType === 'forward' ? '@forward' : '@use';

  // 出力ファイルのディレクトリを取得（相対パス計算用）
  const outputDirPath = dirname(outputFile);

  let content = '';

  // 各対象ディレクトリを順に処理
  targetDirs.forEach((targetDir) => {
    const dirLabel = getDirCommentLabel(targetDir);

    // ディレクトリコメントを追加
    content += `/***********************************************************\n`;
    content += `/*  ${dirLabel}\n`;
    content += `************************************************************/\n`;

    // 対象ディレクトリ直下にindex.scssがあるかチェック
    const indexScssPath = join(targetDir, 'index.scss');
    const hasIndexScss = existsSync(indexScssPath);

    if (hasIndexScss) {
      // index.scssがある場合は、それだけを読み込む（拡張子なしのディレクトリパス）
      const usePath = resolveIndexUsePath(outputFile, outputDirPath, targetDir);
      content += `${directive} '${usePath}';\n`;
      content += '\n';
    } else {
      // index.scssがない場合は、ディレクトリ内のSCSSファイルを収集
      const scssFiles = collectScssFiles(targetDir, excludeDirs);

      // ファイルをソート（アルファベット順）
      scssFiles.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

      // ディレクティブ文を追加（@use または @forward）
      scssFiles.forEach((file) => {
        // 相対パスを作成（出力ファイルからの相対パス）
        const fileFullPath = join(targetDir, file.relativePath);
        const relativePath = relative(outputDirPath, fileFullPath);
        const usePath = `./${relativePath.replace(/\\/g, '/')}`;
        content += `${directive} '${usePath}';\n`;
      });

      // ディレクトリ間に空行を追加
      if (scssFiles.length > 0) {
        content += '\n';
      }
    }
  });

  return content;
}

/**
 * SCSSインデックスファイルを生成（設定された全エントリ分）
 */
export function generateScssIndexFile() {
  const SCSS_INDEX = BUILD_CONFIG.SCSS_INDEX;
  const entries = Array.isArray(SCSS_INDEX) ? SCSS_INDEX : [SCSS_INDEX];

  entries.forEach((entry) => {
    if (entry.AUTO_GENERATE === false) {
      return;
    }

    const outputFile = entry.OUTPUT_FILE;

    // 出力ファイルのディレクトリが存在しない場合は作成
    const outputDir = dirname(outputFile);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // コンテンツを生成
    const content = generateScssIndexContent(entry);

    // ファイルに書き込み
    writeFileSync(outputFile, content, 'utf8');
  });
}
