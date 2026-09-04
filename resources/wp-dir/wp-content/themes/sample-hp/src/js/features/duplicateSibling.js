/************************************************************
 * 指定要素を同階層の兄弟として複製する（features）
 * - data-feature="duplicateSibling" が複製元
 * - data-duplicate-sibling-count で複製数（省略時 1）
 * - data-duplicate-sibling-processed で処理済み判定
 ************************************************************/

import { DATA_ATTR } from '../constans/global.js';

// ---------------------------------------------------------------------------
// data 属性（参照するものは定数で一覧化。DATA_ATTR.FEATURE は global.js）
// ---------------------------------------------------------------------------
/** 機能名（data-feature の値）。data 属性の値はキャメルケース */
const FEATURE_NAME = 'duplicateSibling';
const FEATURE_ATTR_NAME = 'duplicate-sibling';
const FEATURE_DATA_PREFIX = `data-${FEATURE_ATTR_NAME}`;

/** 複製数（省略時 1） */
const ATTR_COUNT = `${FEATURE_DATA_PREFIX}-count`;
/** 処理済みフラグ */
const ATTR_PROCESSED = `${FEATURE_DATA_PREFIX}-processed`;

const SELECTOR_TARGET = `[${DATA_ATTR.FEATURE}="${FEATURE_NAME}"]`;

/** 省略時の複製数 */
const DEFAULT_COUNT = 1;

/**
 * 属性値を正の整数にパース
 * @param {string|null} value
 * @param {number} fallback
 * @returns {number}
 */
const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

/**
 * 複製元から feature 用属性を除去する
 * @param {Element} el
 * @returns {void}
 */
const stripFeatureAttributes = (el) => {
  el.removeAttribute(DATA_ATTR.FEATURE);
  el.removeAttribute(ATTR_COUNT);
};

/**
 * 1要素を同階層の兄弟として複製
 * @param {Element} el
 * @returns {void}
 */
const duplicateElement = (el) => {
  if (el.getAttribute(ATTR_PROCESSED) === 'true') return;

  const parent = el.parentNode;
  if (!parent) return;

  const count = parsePositiveInt(el.getAttribute(ATTR_COUNT), DEFAULT_COUNT);
  let insertBeforeNode = el.nextSibling;

  for (let i = 0; i < count; i++) {
    const clone = el.cloneNode(true);
    stripFeatureAttributes(clone);
    clone.setAttribute(ATTR_PROCESSED, 'true');
    parent.insertBefore(clone, insertBeforeNode);
    insertBeforeNode = clone.nextSibling;
  }

  el.setAttribute(ATTR_PROCESSED, 'true');
};

/**
 * 初期化（[data-feature="duplicateSibling"] を兄弟として複製）
 * @param {{ root?: Document|Element }} [ctx]
 * @returns {void}
 */
const init = (ctx = {}) => {
  const { root = document } = ctx;
  root.querySelectorAll(SELECTOR_TARGET).forEach(duplicateElement);
};

export const duplicateSibling = { init };
