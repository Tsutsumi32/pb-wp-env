/************************************************************
 * スクロールバー除外幅の 1% を :root の CSS 変数に同期
 ************************************************************/

import { CSS_VARS } from '../../constans/global.js';
import { onViewportWidthResize } from '../../utils/viewportResize.js';

/**
 * スクロールバーを除いた画面幅を100等分した値を :root にセットする
 * CSS では var(--viewport-unit) * 100 でスクロールバー除外の全幅を参照できる
 */
export function initViewportUnitSync() {
  const syncViewportUnit = () => {
    const unit = document.documentElement.clientWidth / 100;
    document.documentElement.style.setProperty(CSS_VARS.VIEWPORT_UNIT, `${unit}px`);
  };

  syncViewportUnit();
  onViewportWidthResize(syncViewportUnit);
}
