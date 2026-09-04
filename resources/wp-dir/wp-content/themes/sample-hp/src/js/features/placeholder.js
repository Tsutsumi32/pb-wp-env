/************************************************************
 * ボタンセレクト（検索入力）プレースホルダー表示制御
 * - data-action="placeholder.sync" を input に付与
 * - data-placeholder-input / data-placeholder-placeholder で表示を入力有無で切替
 * - ルート外の input もあるため document に delegate（input / focus / blur）
 ************************************************************/

import { DATA_ATTR, STATE_CLASSES } from '../constans/global.js';
import { delegate } from '../utils/delegate.js';

// ---------------------------------------------------------------------------
// data 属性（参照するものは定数で一覧化。DATA_ATTR.FEATURE は global.js）
// ---------------------------------------------------------------------------
/** 機能名（data-feature の値）。data 属性の値はキャメルケース */
const FEATURE_NAME = 'placeholder';
const FEATURE_DATA_PREFIX = `data-${FEATURE_NAME}`;

const ATTR_INPUT = `${FEATURE_DATA_PREFIX}-input`;
const ATTR_PLACEHOLDER = `${FEATURE_DATA_PREFIX}-placeholder`;
/** 入力同期のイベント委譲トリガー */
const ACTION_SYNC = 'placeholder.sync';

const SELECTOR_INPUT = `[${ATTR_INPUT}]`;
const SELECTOR_PLACEHOLDER = `[${ATTR_PLACEHOLDER}]`;

const syncPlaceholder = (e, el) => {
  const placeholderEl = el.parentElement?.querySelector(SELECTOR_PLACEHOLDER);
  if (!placeholderEl) return;
  if (el.value.trim() === '') placeholderEl.classList.remove(STATE_CLASSES.HIDDEN);
  else placeholderEl.classList.add(STATE_CLASSES.HIDDEN);
};

/**
 * 初期化（document に delegate。data-action="placeholder.sync" を input/focus/blur で）
 */
const init = () => {
  delegate(document, { eventType: 'input' }, { [ACTION_SYNC]: syncPlaceholder });
  delegate(document, { eventType: 'focus' }, { [ACTION_SYNC]: syncPlaceholder });
  delegate(document, { eventType: 'blur' }, { [ACTION_SYNC]: syncPlaceholder });

  document
    .querySelectorAll(`${SELECTOR_INPUT}[${DATA_ATTR.ACTION}="${ACTION_SYNC}"]`)
    .forEach((input) => {
      const placeholderEl = input.parentElement?.querySelector(SELECTOR_PLACEHOLDER);
      if (placeholderEl) syncPlaceholder(null, input);
    });
};

export const placeholder = { init };
