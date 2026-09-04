/************************************************************
 * パンくずリスト
 * - 横幅を調整する（1行に納め、末尾のリストを末尾省略）
 * - data-module="breadCrumbs" がリスト、[data-bread-crumbs-wrap] がラッパー、[data-bread-crumbs-item] が各アイテム、[data-bread-crumbs-item-text] が末尾省略対象のテキスト要素
 * - 最終アイテムの max-width は [data-bread-crumbs-wrap] の横幅を基準に計算する
 ************************************************************/

import { DATA_ATTR } from '../constans/global.js';

// ---------------------------------------------------------------------------
// data 属性（参照するものは定数で一覧化。DATA_ATTR は global.js）
// ---------------------------------------------------------------------------
const MODULE_BREAD_CRUMBS = 'breadCrumbs';
const ATTR_BREADCRUMBS_WRAP = 'data-bread-crumbs-wrap';
const ATTR_BREADCRUMBS_ITEM = 'data-bread-crumbs-item';
/** 各アイテム内で省略表示を適用するテキスト要素（data 属性で参照） */
const ATTR_BREADCRUMBS_ITEM_TEXT = 'data-bread-crumbs-item-text';

const SELECTOR_BREADCRUMBS = `[${DATA_ATTR.MODULE}="${MODULE_BREAD_CRUMBS}"]`;
const SELECTOR_BREADCRUMBS_WRAP = `[${ATTR_BREADCRUMBS_WRAP}]`;
const SELECTOR_BREADCRUMBS_ITEM = `[${ATTR_BREADCRUMBS_ITEM}]`;
const SELECTOR_BREADCRUMBS_ITEM_TEXT = `[${ATTR_BREADCRUMBS_ITEM_TEXT}]`;

const DEFAULT_MARGIN_OFFSET = 16;

/**
 * [data-bread-crumbs-wrap] のコンテンツ幅（padding 除く）を取得
 * @param {HTMLElement} wrap
 * @returns {number}
 */
const getWrapContentWidth = (wrap) => {
  const wrapStyle = window.getComputedStyle(wrap);
  return (
    wrap.clientWidth -
    parseFloat(wrapStyle.paddingLeft) -
    parseFloat(wrapStyle.paddingRight)
  );
};

/**
 * 初期化
 * @param {{ marginOffset?: number }} [options]
 */
const init = (_ctx = {}, options = {}) => {
  const container = document.querySelector(SELECTOR_BREADCRUMBS);
  if (!container) return;

  const wrap = container.closest(SELECTOR_BREADCRUMBS_WRAP);
  if (!wrap) return;

  const items = container.querySelectorAll(SELECTOR_BREADCRUMBS_ITEM);
  if (!items.length) return;

  const marginOffset = options.marginOffset ?? DEFAULT_MARGIN_OFFSET;

  const adjustBreadWidth = () => {
    const referenceWidth = getWrapContentWidth(wrap);
    const containerStyle = window.getComputedStyle(container);
    const gap = parseFloat(containerStyle.columnGap || containerStyle.gap) || 0;
    let usedWidth = 0;

    items.forEach((item, index) => {
      if (index === items.length - 1) return;

      if (index > 0) {
        usedWidth += gap;
      }

      const rect = item.getBoundingClientRect();
      const style = window.getComputedStyle(item);
      usedWidth += rect.width + parseFloat(style.marginLeft) + parseFloat(style.marginRight);
    });

    const remainingWidth =
      referenceWidth - usedWidth - (items.length > 1 ? gap : 0);
    const lastItemWrapper = items[items.length - 1];
    const lastItemText = lastItemWrapper.querySelector(SELECTOR_BREADCRUMBS_ITEM_TEXT);

    if (lastItemText) {
      if (remainingWidth > 0) {
        lastItemText.style.maxWidth = `${remainingWidth - marginOffset}px`;
      } else {
        lastItemText.style.maxWidth = '';
      }
    }
  };

  adjustBreadWidth();
  window.addEventListener('resize', adjustBreadWidth);
};

export const breadCrumbs = { init };
