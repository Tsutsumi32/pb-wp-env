// watch-js.js
// - entry モード: pages をエントリとして使用。pages 変更 → その1件のみビルド / 依存（lifecycle 等）変更 → 全エントリビルド
// - dynamic モード: エントリまたは依存変更 → 1回の dynamic ビルド
import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs/promises';
import {
  runLintAll,
  buildJs,
  buildJsSingle,
  ENTRY_DIRS,
  isInEntryDependsDir,
  isInEntryDependsNamedDir,
  getEntryPathForNamedDependsFile,
  isInDynamicDependsDir,
} from './logic-js.js';
import { BUILD_CONFIG } from '../../build-config.js';

const JS_CONFIG = BUILD_CONFIG.JS;
const BUILD_MODE = JS_CONFIG.BUILD_MODE || 'entry';
const DYNAMIC_ENTRY = JS_CONFIG.DYNAMIC_ENTRY;

const watchPaths = [JS_CONFIG.DIR_SRC];

let buildTimeout = null;
let lintTimeout = null;

/** 変更ファイルが ENTRY_DIRS 直下の .js か */
function isEntryFile(filePath) {
  const normalized = path.normalize(path.resolve(filePath));
  for (const entryDir of ENTRY_DIRS) {
    const dirNorm = path.normalize(path.resolve(entryDir));
    if (!normalized.startsWith(dirNorm + path.sep) && normalized !== dirNorm) continue;
    const rel = path.relative(dirNorm, normalized);
    if (path.dirname(rel) !== '.' || !rel.endsWith('.js')) continue;
    return true;
  }
  return false;
}

/** 変更ファイルが dynamic エントリ（js/main.js）か */
function isDynamicEntryFile(filePath) {
  if (!DYNAMIC_ENTRY) return false;
  const normalized = path.normalize(path.resolve(filePath));
  const entryNorm = path.normalize(path.resolve(DYNAMIC_ENTRY));
  return normalized === entryNorm;
}

function handleChange(filePath) {
  if (!filePath.endsWith('.js')) return;

  if (buildTimeout) clearTimeout(buildTimeout);
  if (lintTimeout) clearTimeout(lintTimeout);

  buildTimeout = setTimeout(async () => {
    if (BUILD_MODE === 'dynamic') {
      if (isDynamicEntryFile(filePath) || isInDynamicDependsDir(filePath)) {
        console.log('🔄 dynamic ビルド');
        await buildJs();
      }
      return;
    }

    if (isEntryFile(filePath)) {
      try {
        await fs.access(filePath);
      } catch {
        // ファイル削除（unlink）時は存在しないので buildJsSingle は使わず全ビルド（orphan 削除される）
        console.log('🔄 エントリ削除検知: 全エントリを再ビルド');
        await buildJs();
        return;
      }
      console.log(`📝 コンパイル: ${path.basename(filePath)}`);
      await buildJsSingle(filePath);
    } else if (isInEntryDependsDir(filePath)) {
      if (isInEntryDependsNamedDir(filePath)) {
        const entryPath = await getEntryPathForNamedDependsFile(filePath);
        if (entryPath) {
          console.log(`📝 Entryファイル: ${path.basename(entryPath)} をコンパイル`);
          await buildJsSingle(entryPath);
        } else {
          console.log('🔄 Entryファイル: (対象ファイルなし) 全エントリをコンパイル');
          await buildJs();
        }
      } else {
        console.log('🔄 Entryファイル: 全エントリをコンパイル');
        await buildJs();
      }
    }
  }, 200);

  lintTimeout = setTimeout(() => runLintAll(), 250);
}

chokidar
  .watch(watchPaths, {
    ignored: /(^|[/\\])\../,
    persistent: true,
    ignoreInitial: true,
    usePolling: false,
    depth: 99,
    awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
  })
  .on('ready', () => {
    console.log('🟢 JSファイル監視 スタート');
  })
  .on('add', handleChange)
  .on('change', handleChange)
  .on('unlink', handleChange);
