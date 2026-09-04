/************************************************************
 * body へのページ状態クラス付与
 * - is_domLoaded: domReady 相当（DOMContentLoaded）
 * - is_windowLoaded: windowLoad 相当（load）
 * ※訪問セッション（is_alreadyVisit）は base.php のインラインで早期実行
 ************************************************************/

import { STATE_CLASSES } from '../constans/global.js';
import { domReady } from './domReady.js';
import { windowLoad } from './windowLoad.js';

/**
 * body に is_domLoaded / is_windowLoaded を付与する
 * ※ createPage 内で domReady 済みのあとに呼ぶ想定
 */
export function initBodyPageState() {
  const body = document.body;
  if (!body) {
    return;
  }

  void domReady().then(() => {
    body.classList.add(STATE_CLASSES.DOM_LOADED);
  });

  void windowLoad().then(() => {
    body.classList.add(STATE_CLASSES.WINDOW_LOADED);
  });
}
