// build-scss-index.js
import { BUILD_CONFIG } from '../../build-config.js';
import { generateScssIndexFile } from './logic-scss-index.js';

/**
 * SCSSインデックスファイルを生成（設定された全エントリ分）
 */
function generateScssIndex() {
  console.log('🟢 SCSSインデックス生成開始...');

  const SCSS_INDEX = BUILD_CONFIG.SCSS_INDEX;
  const entries = Array.isArray(SCSS_INDEX) ? SCSS_INDEX : [SCSS_INDEX];

  generateScssIndexFile();
  entries.forEach((e) => console.log(`✅ ${e.OUTPUT_FILE}`));
  console.log('✅ SCSSインデックス生成完了');
}

// 実行
generateScssIndex();
