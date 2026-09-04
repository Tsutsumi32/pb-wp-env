// build-scss.js
import {
  runCommand,
  // runStylelint,
  runPostcss,
  cleanOrphanCssFiles,
  collectScssFiles
} from './logic-scss.js';
import { BUILD_CONFIG } from '../../build-config.js';
import { join, dirname } from 'path';
import { mkdirSync } from 'fs';

async function runOnce() {
  console.log('🟢 Sass コンパイル開始...');

  const SCSS_CONFIG = BUILD_CONFIG.SCSS;
  const scssDir = SCSS_CONFIG.DIR_SRC;
  const cssDir = SCSS_CONFIG.DIR_DIST;
  const PRESERVE_DIRECTORY_STRUCTURE = BUILD_CONFIG.PRESERVE_DIRECTORY_STRUCTURE;

  // 再帰的にSCSSファイルを収集（index.scssと_で始まるファイルを除外）
  const scssFiles = collectScssFiles(scssDir);

  // 各SCSSファイルをコンパイル
  const compileTasks = scssFiles.map(({ srcPath, relativePath }) => {
    let outputPath;

    if (PRESERVE_DIRECTORY_STRUCTURE) {
      // ディレクトリ構造を維持
      outputPath = join(cssDir, relativePath.replace('.scss', '.css'));
    } else {
      // 1階層に全て出力（ファイル名のみを使用）
      const fileName = relativePath.split(/[/\\]/).pop().replace('.scss', '.css');
      outputPath = join(cssDir, fileName);
    }

    // 出力先ディレクトリが存在しない場合は作成
    const outputDir = dirname(outputPath);
    try {
      mkdirSync(outputDir, { recursive: true });
    } catch (error) {
      // ディレクトリが既に存在する場合は無視
    }

    const relativeDisplay = relativePath.replace(/\\/g, '/');
    return runCommand(
      `npx sass --source-map ${srcPath}:${outputPath}`,
      relativeDisplay
    );
  });

  await Promise.all(compileTasks);
  console.log('✅ Sass コンパイル完了');

  // await runStylelint();
  await runPostcss();
  cleanOrphanCssFiles();
}

runOnce();
