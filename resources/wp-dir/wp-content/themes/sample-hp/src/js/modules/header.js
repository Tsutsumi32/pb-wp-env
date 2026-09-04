/************************************************************
 * ヘッダー（メニュー開閉）
 * - [data-module="header"] がルート。開閉状態はルートにのみ is_active で制御（CSS で表示・アニメーション）
 * - data-action="header.toggle" メニューボタン、data-action="header.close" 背景・リンク
 * - [data-header-btn] [data-header-menu] は参照用（背景は DOM + data-action="header.close" のみで可）
 * - ESC で閉じる、Tab 時はメニュー内にフォーカスをトラップ（a11y）
 * - 開くときのフォーカス移動はキーボード操作時のみ。閉じるときはメニュー内にフォーカスが残っていれば退避する
 ************************************************************/

import { DATA_ATTR, STATE_CLASSES } from '../constans/global.js';
import { delegate } from '../utils/delegate.js';
import { disableScroll, enableScroll } from '../utils/bodyScrollControll.js';
import {
  handleFocusTrapKeydown,
  isKeyboardTriggered,
  prepareAndFocusContainer,
  returnFocus,
} from '../utils/focusControl.js';

// ---------------------------------------------------------------------------
// data 属性（参照するものは定数で一覧化。DATA_ATTR は global.js）
// ---------------------------------------------------------------------------
const MODULE_HEADER = 'header';
const ATTR_HEADER_BTN = 'data-header-btn';
const ATTR_HEADER_MENU = 'data-header-menu';

const SELECTOR_HEADER = `[${DATA_ATTR.MODULE}="${MODULE_HEADER}"]`;
const SELECTOR_BTN = `[${ATTR_HEADER_BTN}]`;
const SELECTOR_MENU = `[${ATTR_HEADER_MENU}]`;
const SELECTOR_MENU_ACCORDION = `${SELECTOR_MENU} .has_accordion`;

/** @type {{ lockScroll: boolean, onAfterOpen: Function | null, onAfterClose: Function | null }} */
let headerConfig = {
  lockScroll: true,
  onAfterOpen: null,
  onAfterClose: null,
};

let lastFocusTrigger = null;
let shouldManageFocus = false;
let isInitialized = false;

const getHeader = () => document.querySelector(SELECTOR_HEADER);

const isOpen = () => getHeader()?.classList.contains(STATE_CLASSES.ACTIVE) ?? false;

/**
 * フックを安全に実行
 * @param {Function|null|undefined} hook
 * @param  {...any} args
 */
const runHook = (hook, ...args) => {
  if (typeof hook !== 'function') return;
  try {
    hook(...args);
  } catch (e) {
    console.warn('header hook error:', e);
  }
};

/**
 * 開閉状態を aria-expanded に反映（ルート・メニューボタン）
 * @param {HTMLElement} header
 * @param {HTMLElement | null} menuBtn
 * @param {boolean} expanded
 */
const setExpanded = (header, menuBtn, expanded) => {
  const value = expanded ? 'true' : 'false';
  header.setAttribute('aria-expanded', value);
  menuBtn?.setAttribute('aria-expanded', value);
  menuBtn?.setAttribute('aria-label', expanded ? 'メニューを閉じる' : 'メニューを開く');

  const { menu } = getHeaderParts(header);
  menu?.setAttribute('aria-hidden', expanded ? 'false' : 'true');
};

/**
 * @param {HTMLElement} header
 * @returns {{ menuBtn: HTMLElement | null, menu: HTMLElement | null }}
 */
const getHeaderParts = (header) => ({
  menuBtn: header.querySelector(SELECTOR_BTN),
  menu: header.querySelector(SELECTOR_MENU),
});

/**
 * visibility 切替後に grid アコーディオンの高さを再計算する
 * @param {HTMLElement | null} menu
 */
const reflowMenuAccordions = (menu) => {
  if (!menu) return;

  menu.querySelectorAll(`${SELECTOR_MENU_ACCORDION}.${STATE_CLASSES.ACTIVE}`).forEach((root) => {
    root.classList.remove(STATE_CLASSES.ACTIVE);
    void root.offsetHeight;
    root.classList.add(STATE_CLASSES.ACTIVE);
  });
};

/**
 * メニュー内にフォーカスが残っている場合、aria-hidden 付与前に退避する
 * @param {HTMLElement | null} menu
 * @param {HTMLElement | null} menuBtn
 */
const releaseMenuFocus = (menu, menuBtn) => {
  const active = document.activeElement;
  if (!(menu instanceof HTMLElement) || !(active instanceof HTMLElement) || !menu.contains(active)) {
    return;
  }
  returnFocus(lastFocusTrigger ?? menuBtn);
};

/**
 * メニューを開く
 * - .header に is_active を付与（表示・アニメーションは CSS 側）
 * @param {Event} [event] - 開く操作のイベント（キーボード判定に使用）
 */
const open = (event) => {
  const header = getHeader();
  if (!header || isOpen()) return;

  const { menuBtn, menu } = getHeaderParts(header);
  if (!menuBtn || !menu) return;

  shouldManageFocus = isKeyboardTriggered(event);
  lastFocusTrigger =
    shouldManageFocus && document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  header.classList.add(STATE_CLASSES.ACTIVE);
  setExpanded(header, menuBtn, true);

  if (headerConfig.lockScroll) {
    disableScroll(true);
  }

  if (shouldManageFocus) {
    prepareAndFocusContainer(menu, { trigger: lastFocusTrigger });
  }

  reflowMenuAccordions(menu);

  runHook(headerConfig.onAfterOpen, { header, menuBtn, menu });
};

/**
 * メニューを閉じる
 * - .header から is_active を除去（表示・アニメーションは CSS 側）
 * @param {Event} [event] - 閉じる操作のイベント（キーボード判定に使用）
 */
const close = (event) => {
  const header = getHeader();
  if (!header || !isOpen()) return;

  const { menuBtn, menu } = getHeaderParts(header);
  releaseMenuFocus(menu, menuBtn);
  header.classList.remove(STATE_CLASSES.ACTIVE);
  setExpanded(header, menuBtn, false);

  if (headerConfig.lockScroll) {
    enableScroll(true);
  }

  shouldManageFocus = false;
  lastFocusTrigger = null;

  runHook(headerConfig.onAfterClose, { header, menuBtn, menu });
};

/**
 * 初期化（ルートに delegate。data-action="header.toggle" / "header.close" で開閉。ESC・Tab は document）
 * @param {{
 *   lockScroll?: boolean,
 *   closeOnCrossBreakpoint?: number,
 *   onAfterOpen?: (payload: { header: HTMLElement, menuBtn: HTMLElement | null, menu: HTMLElement | null }) => void,
 *   onAfterClose?: (payload: { header: HTMLElement, menuBtn: HTMLElement | null, menu: HTMLElement | null }) => void,
 * }} [options]
 */
const init = (options = {}) => {
  headerConfig = {
    lockScroll: options.lockScroll ?? true,
    onAfterOpen: options.onAfterOpen ?? null,
    onAfterClose: options.onAfterClose ?? null,
  };

  const header = getHeader();
  if (!header) return;

  const { menuBtn } = getHeaderParts(header);
  setExpanded(header, menuBtn, false);

  if (isInitialized) return;
  isInitialized = true;

  delegate(header, 'click', {
    'header.toggle': (e) => {
      if (isOpen()) close(e);
      else open(e);
    },
    'header.close': (e) => close(e),
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) close(e);
    if (e.key === 'Tab' && isOpen()) {
      const { menu } = getHeaderParts(header);
      if (menu) handleFocusTrapKeydown(menu, e);
    }
  });

  const { closeOnCrossBreakpoint } = options;
  if (typeof closeOnCrossBreakpoint === 'number') {
    const mq = window.matchMedia(`(min-width: ${closeOnCrossBreakpoint}px)`);
    let previousMatch = mq.matches;

    mq.addEventListener('change', (e) => {
      if (e.matches !== previousMatch) close();
      previousMatch = e.matches;
    });
  }
};

export const header = { init, open, close };
