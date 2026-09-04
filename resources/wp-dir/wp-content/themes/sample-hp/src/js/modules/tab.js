/************************************************************
 * タブ
 * - [data-module="tab"] がルート。data-action="tab.select" でトリガー、[data-tab] で対象コンテンツ指定
 * - [data-tab-trigger] [data-tab-content] [data-tab] は参照用。アクティブは is_active（CSS で表示・フェード）
 * - ボタン等: data-tab-trigger + data-action="tab.select" + data-tab（クリックで切替）
 * - ラジオ: input[type="radio"] に上記属性を付与（change / クリックで切替、同一 name で checked を同期）
 * - 入れ子可。コンテンツ自身が内側の tab ルートでも、親グループのコンテンツとして扱う
 ************************************************************/

import { DATA_ATTR, STATE_CLASSES } from '../constans/global.js';
import { delegate } from '../utils/delegate.js';

// -----------------------------------------------------------------
// data 属性（参照するものは定数で一覧化。DATA_ATTR は global.js）
// -----------------------------------------------------------------
const MODULE_TAB = 'tab';
const ATTR_TAB_TRIGGER = 'data-tab-trigger';
const ATTR_TAB_CONTENT = 'data-tab-content';
const ATTR_TAB = 'data-tab';

const SELECTOR_ROOT = `[${DATA_ATTR.MODULE}="${MODULE_TAB}"]`;
const SELECTOR_TRIGGER = `[${ATTR_TAB_TRIGGER}]`;
const SELECTOR_CONTENT = `[${ATTR_TAB_CONTENT}]`;

/**
 * 要素が属する直近の tab ルートを返す
 * 要素自身が tab ルート（data-tab-content と data-module="tab" の兼任）なら親ルートを見る
 * @param {Element} el
 * @returns {Element | null}
 */
const getClosestTabRoot = (el) => {
  if (el.matches(SELECTOR_ROOT)) {
    return el.parentElement?.closest(SELECTOR_ROOT) ?? null;
  }
  return el.closest(SELECTOR_ROOT);
};

/**
 * 入れ子の tab モジュールに属さない要素だけを返す
 * @param {Element} root
 * @param {string} selector
 * @returns {Element[]}
 */
const getOwnTabEls = (root, selector) =>
  [...root.querySelectorAll(selector)].filter((el) => getClosestTabRoot(el) === root);

/**
 * ラジオトリガーかどうか
 * @param {Element} el
 * @returns {boolean}
 */
const isRadioTrigger = (el) => el instanceof HTMLInputElement && el.type === 'radio';

/**
 * トリガーのアクティブ状態を同期
 * @param {Element} root
 * @param {Element} activeEl
 */
const syncTriggers = (root, activeEl) => {
  const triggers = getOwnTabEls(root, SELECTOR_TRIGGER);
  if (isRadioTrigger(activeEl)) {
    triggers.forEach((t) => {
      t.classList.remove(STATE_CLASSES.ACTIVE);
      if (isRadioTrigger(t) && t.name === activeEl.name) {
        t.checked = t === activeEl;
        if (t === activeEl) {
          t.classList.add(STATE_CLASSES.ACTIVE);
        }
      }
    });
    return;
  }

  triggers.forEach((t) => {
    t.classList.remove(STATE_CLASSES.ACTIVE);
    if (isRadioTrigger(t)) {
      t.checked = false;
    }
  });
  activeEl.classList.add(STATE_CLASSES.ACTIVE);
};

/**
 * 初期表示に使うトリガー
 * @param {Element[]} triggers
 * @returns {Element | null}
 */
const getInitialTrigger = (_root, triggers) => {
  const checkedRadio = triggers.find((t) => isRadioTrigger(t) && t.checked);
  if (checkedRadio instanceof Element) {
    return checkedRadio;
  }

  const presetActive = triggers.find(
    (t) => t.classList.contains(STATE_CLASSES.ACTIVE) && !isRadioTrigger(t)
  );
  if (presetActive instanceof Element) {
    return presetActive;
  }

  return triggers[0] ?? null;
};

/**
 * タブを切り替える
 * @param {Element} root
 * @param {Element} el - トリガー要素
 */
const selectTab = (root, el) => {
  const targetTab = el.getAttribute(ATTR_TAB);
  if (!targetTab) return;

  const contents = getOwnTabEls(root, SELECTOR_CONTENT);
  const newContent = contents.find((content) => content.getAttribute(ATTR_TAB) === targetTab);
  if (!newContent || newContent.classList.contains(STATE_CLASSES.ACTIVE)) return;

  const currentContent = contents.find((content) =>
    content.classList.contains(STATE_CLASSES.ACTIVE)
  );
  if (currentContent) currentContent.classList.remove(STATE_CLASSES.ACTIVE);
  newContent.classList.add(STATE_CLASSES.ACTIVE);

  syncTriggers(root, el);
};

/**
 * 1 つのタブグループを初期化（ルートに delegate、data-action="tab.select"）
 * @param {Element} root
 */
const initTabGroup = (root) => {
  const triggers = getOwnTabEls(root, SELECTOR_TRIGGER);
  const contents = getOwnTabEls(root, SELECTOR_CONTENT);
  if (!triggers.length || !contents.length) return;

  const hasRadioTriggers = [...triggers].some((t) => isRadioTrigger(t));

  delegate(root, 'click', {
    'tab.select': (e, el) => {
      if (getClosestTabRoot(el) !== root) return;

      if (isRadioTrigger(el)) {
        selectTab(root, el);
        return;
      }

      e.preventDefault();
      if (el.classList.contains(STATE_CLASSES.ACTIVE)) return;
      selectTab(root, el);
    },
  });

  if (hasRadioTriggers) {
    root.addEventListener('change', (e) => {
      const target = e.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (!isRadioTrigger(target) || !target.matches(SELECTOR_TRIGGER)) return;
      if (getClosestTabRoot(target) !== root) return;
      selectTab(root, target);
    });
  }

  const initialTrigger = getInitialTrigger(root, triggers);
  if (initialTrigger) {
    selectTab(root, initialTrigger);
  }
};

/**
 * 初期化
 * @param {{ root?: Element }} [ctx]
 */
const init = (ctx = {}) => {
  const { root = document } = ctx;
  const roots = root.querySelectorAll(SELECTOR_ROOT);
  roots.forEach((r) => initTabGroup(r));
};

export const tab = { init };
