// watch-scss-index.js
import chokidar from 'chokidar';
import { BUILD_CONFIG } from '../../build-config.js';
import { generateScssIndexFile } from './logic-scss-index.js';

const SCSS_INDEX = BUILD_CONFIG.SCSS_INDEX;
const entries = Array.isArray(SCSS_INDEX) ? SCSS_INDEX : [SCSS_INDEX];

// 全エントリのTARGET_DIRSを重複排除して監視対象に
const watchPaths = [...new Set(entries.flatMap((e) => e.TARGET_DIRS || []))];
const excludeDirs = [...new Set(entries.flatMap((e) => e.EXCLUDE_DIRS || []))];
// 生成されるファイルパス（これらの変更では再生成しない）
const generatedOutputSuffixes = entries.map((e) => e.OUTPUT_FILE?.replace(/\\/g, '/')).filter(Boolean);
function isGeneratedOutput(filePath) {
  const n = filePath.replace(/\\/g, '/');
  return generatedOutputSuffixes.some((suffix) => n.endsWith(suffix));
}

function isExcludedPath(filePath) {
  const n = filePath.replace(/\\/g, '/');
  return excludeDirs.some((dir) => {
    const exclude = dir.replace(/\\/g, '/');
    return n === exclude || n.startsWith(`${exclude}/`);
  });
}

let rebuildTimeout;
let isRebuilding = false;

/**
 * common.scssを再生成
 */
function rebuildScssIndex() {
  if (isRebuilding) return;

  if (rebuildTimeout) {
    clearTimeout(rebuildTimeout);
  }

  rebuildTimeout = setTimeout(() => {
    isRebuilding = true;

    try {
      generateScssIndexFile();
      console.log('✅ SCSSインデックス再生成完了');
    } catch (error) {
      console.error('❌ SCSSインデックス再生成でエラーが発生しました:', error.message);
    } finally {
      isRebuilding = false;
    }
  }, 300);
}

// SCSSファイルの監視を開始
chokidar
  .watch(watchPaths, {
    ignored: (filePath) => {
      if (/(^|[/\\])\../.test(filePath)) return true;
      return isExcludedPath(filePath);
    },
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
    console.log('🟢 SCSSインデックス監視 スタート');
  })
  .on('add', (filePath) => {
    if (
      filePath.endsWith('.scss') &&
      !isGeneratedOutput(filePath) &&
      !isExcludedPath(filePath)
    ) {
      console.log(`📝 ファイル追加検知: ${filePath}`);
      rebuildScssIndex();
    }
  })
  .on('change', (filePath) => {
    // 監視時には変更は無視（追加と削除のみ対応）
  })
  .on('unlink', (filePath) => {
    if (
      filePath.endsWith('.scss') &&
      !isGeneratedOutput(filePath) &&
      !isExcludedPath(filePath)
    ) {
      console.log(`🗑️  ファイル削除検知: ${filePath}`);
      rebuildScssIndex();
    }
  })
  .on('addDir', (dirPath) => {
    if (isExcludedPath(dirPath)) return;
    console.log(`📁 ディレクトリ追加検知: ${dirPath}`);
    rebuildScssIndex();
  })
  .on('unlinkDir', (dirPath) => {
    if (isExcludedPath(dirPath)) return;
    console.log(`🗑️  ディレクトリ削除検知: ${dirPath}`);
    rebuildScssIndex();
  });
