/************************************************************
 * フォーカス制御ユーティリティ
 * - オーバーレイ（モーダル・ドロワー等）内へのフォーカス移動・トラップ・復帰を共通化
 * - 開閉時のフォーカス移動・復帰はキーボード操作時のみ（isKeyboardTriggered）
 * - getFocusables / focusFirst / handleFocusTrapKeydown / returnFocus / prepareAndFocusContainer
 ************************************************************/

/** フォーカス可能な要素のデフォルトセレクター（tabindex="-1" は除く） */
export const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * イベントがキーボード操作由来かどうか
 * - KeyboardEvent（Escape / Tab 等）
 * - フォーカス中の要素で Enter / Space により発火した click（detail === 0）
 * @param {Event | null | undefined} event
 * @returns {boolean}
 */
export const isKeyboardTriggered = (event) => {
  if (!event) return false;
  if (event.type.startsWith('key')) return true;
  if (event.type === 'click' && 'detail' in event && event.detail === 0) return true;
  return false;
};

/**
 * コンテナ内のフォーカス可能要素を取得する
 * @param {HTMLElement} container - 取得対象のルート要素
 * @param {Object} [options] - オプション
 * @param {string} [options.selector] - フォーカス可能要素のセレクター（未指定時は FOCUSABLE_SELECTOR）
 * @param {boolean} [options.filterVisible=true] - true のとき display/visibility で非表示を除外
 * @returns {HTMLElement[]}
 */
export const getFocusables = (container, options = {}) => {
  const { selector = FOCUSABLE_SELECTOR, filterVisible = true } = options;
  const list = container.querySelectorAll(selector);
  if (!filterVisible) return Array.from(list);
  return Array.from(list).filter((el) => {
    if (el.hasAttribute('disabled')) return false;
    const style = window.getComputedStyle(el);
    return (
      style.display !== 'none' && style.visibility !== 'hidden' && style.visibility !== 'collapse'
    );
  });
};

/**
 * コンテナ内の先頭にフォーカスを移す（フォーカス可能要素がなければ fallback にフォーカス）
 * @param {HTMLElement} container - 対象コンテナ
 * @param {Object} [options] - オプション
 * @param {string} [options.fallbackSelector] - フォーカス可能要素が 0 個のときにフォーカスする要素のセレクター（例: '[role="dialog"]'）
 * @param {string} [options.selector] - getFocusables に渡す selector
 */
export const focusFirst = (container, options = {}) => {
  const { fallbackSelector, selector } = options;
  const focusables = getFocusables(container, { selector });
  const first = focusables[0];
  if (first) {
    first.focus();
    return;
  }
  if (fallbackSelector) {
    const fallback = container.querySelector(fallbackSelector);
    if (fallback instanceof HTMLElement) {
      if (!fallback.hasAttribute('tabindex')) fallback.setAttribute('tabindex', '-1');
      fallback.focus();
    }
  }
};

/**
 * Tab / Shift+Tab でコンテナ内にフォーカスを留める（トラップ）するキーダウン処理
 * 境界でループする。呼び出し元で keydown に登録する想定。
 * @param {HTMLElement} container - トラップ対象のコンテナ（例: モーダルルート）
 * @param {KeyboardEvent} e - keydown イベント
 * @param {Object} [options] - オプション（getFocusables に渡す）
 * @returns {boolean} - トラップで処理した場合 true（preventDefault 済み）
 */
export const handleFocusTrapKeydown = (container, e, options = {}) => {
  if (e.key !== 'Tab') return false;
  const focusables = getFocusables(container, options);
  if (focusables.length === 0) return false;
  const current = document.activeElement;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey) {
    if (current === first) {
      e.preventDefault();
      last.focus();
      return true;
    }
  } else {
    if (current === last) {
      e.preventDefault();
      first.focus();
      return true;
    }
  }
  return false;
};

/**
 * フォーカスを指定要素に戻す（要素が DOM 内に存在する場合のみ）
 * @param {HTMLElement | null | undefined} element - フォーカスを戻す要素（例: オープントリガー）
 */
export const returnFocus = (element) => {
  if (element instanceof HTMLElement && document.contains(element)) {
    element.focus();
  }
};

/**
 * トリガーを blur したうえで、次のフレームでコンテナ内にフォーカスを移す
 * キーボードで開いた直後に呼ぶ想定（Enter でトリガーにフォーカスが残るのを避ける）
 * @param {HTMLElement} container - フォーカスを移すコンテナ
 * @param {Object} [options] - オプション
 * @param {HTMLElement | null} [options.trigger] - 現在フォーカスがある場合に blur する要素
 * @param {string} [options.fallbackSelector] - focusFirst に渡す fallbackSelector
 */
export const prepareAndFocusContainer = (container, options = {}) => {
  const { trigger, fallbackSelector } = options;
  if (trigger instanceof HTMLElement && document.activeElement === trigger) {
    trigger.blur();
  }
  requestAnimationFrame(() => focusFirst(container, { fallbackSelector }));
};
