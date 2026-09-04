// build-js-once.js
import { ensureOutputDir, runLintAll, buildJs } from './logic-js.js';

async function run() {
  console.log('🟢 初回 JS ビルド処理...');
  ensureOutputDir();
  runLintAll();
  await buildJs();
}

run();
