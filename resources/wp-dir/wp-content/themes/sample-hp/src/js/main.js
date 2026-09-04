/************************************************************
 * main.js（動的 import 版）
 * - BUILD_MODE: 'dynamic' 時にのみビルド。entry/ の外に置くので entry モードではコンパイル対象外
 * - ページキーに応じて pages/* を動的 import し、bootPage(start) で起動（start は無引数）
 ************************************************************ */

import 'whatwg-fetch';
import { bootPage } from './lifecycle/bootPage.js';

// 例外ルーティング（ファイル名が規則外のものだけキー変換）
const aliasMap = {
  index: 'sample',
  top: 'sample',
};

// ページキーを決定（/ → sample, /about.php → about）
function getPageKey() {
  const u = new URL(location.href);
  const pathname = u.pathname.endsWith('/') ? u.pathname.slice(0, -1) : u.pathname;
  let key = decodeURIComponent(pathname.substring(pathname.lastIndexOf('/') + 1))
    .replace(/(\.html|\.php)$/i, '')
    .trim();
  if (!key) key = 'sample';
  return aliasMap[key] ?? key;
}

// ページモジュールの動的 import（esbuild のコード分割用に明示列挙）
const pageLoaders = {
  sample: () => import('./pages/sample.js'),
};

// JS 実行できている＝no-JS モード解除
document.body.classList.remove('is_nojs');

(async function run() {
  const pageKey = getPageKey();
  const loader = pageLoaders[pageKey] ?? pageLoaders.sample;

  if (!pageLoaders[pageKey]) {
    console.warn(`"${pageKey}" が見つかりません。sample にフォールバック`);
  }

  const mod = await loader();
  const start = mod?.start;

  if (!start || typeof start !== 'function') {
    console.warn(`"${pageKey}" に start が見つかりません`);
    return;
  }

  const exec = () => {
    try {
      bootPage(start);
    } catch (e) {
      console.error(`${pageKey} 起動エラー`, e);
    }
  };

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', exec, { once: true })
    : exec();
})();
