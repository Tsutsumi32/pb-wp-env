/************************************************************
 * スクロールバー幅を :root の CSS 変数に同期
 ************************************************************/

import { CSS_VARS } from '../../constans/global.js';
import { SCROLL_LOCK_CLASS } from '../../utils/bodyScrollControll.js';
import { onViewportWidthResize } from '../../utils/viewportResize.js';

/**
 * スクロールバー幅を :root の CSS 変数にセットする
 * @description init 時および viewport 幅変更時に実測値を反映する
 */
export function initScrollbarWidthSync() {
  const syncScrollbarWidth = () => {
    // スクロール固定中はスクロールバーが消えるため、計測値が 0 になり誤更新されるのを防ぐ
    if (document.body.classList.contains(SCROLL_LOCK_CLASS)) {
      return;
    }

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty(CSS_VARS.SCROLLBAR_WIDTH, `${scrollbarWidth}px`);
  };

  syncScrollbarWidth();
  onViewportWidthResize(syncScrollbarWidth);
}
