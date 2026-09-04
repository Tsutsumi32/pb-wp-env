/************************************************************
 * select の選択状態に応じて is_active を付与（features）
 * - data-feature="selectActiveState" を付けた要素が対象
 *   - <select> 自体に付与（通常の HTML）
 *   - 親要素に付与し、配下の <select> を制御（CF7 等で select に data 属性が付けられない場合）
 * - プレースホルダ相当（value が空）のときは is_active を付けない
 * - yubinbango.js は select.value を直接代入するため change/input が飛ばない。
 *   .p-postal-code 操作後に同一 .h-adr 内の select を再同期する。
 ************************************************************/

import { DATA_ATTR, STATE_CLASSES } from '../constans/global.js';

// ---------------------------------------------------------------------------
// data 属性（参照するものは定数。DATA_ATTR.FEATURE は global.js）
// ---------------------------------------------------------------------------
/** 機能名（data-feature の値）。data 属性の値はキャメルケース */
const FEATURE_NAME = 'selectActiveState';

const SELECTOR_HOST = `[${DATA_ATTR.FEATURE}="${FEATURE_NAME}"]`;

/** yubinbango が付与する郵便番号入力のクラス（Microformat） */
const SELECTOR_POSTAL = '.p-postal-code';

/** yubinbango は keyup のみ監視するため、貼り付け・オートフィル時に lookup を起こす inputType */
const POSTAL_LOOKUP_INPUT_TYPES = new Set([
  'insertFromPaste',
  'insertFromDrop',
  'insertReplacementCharacters',
]);

/**
 * yubinbango と同様に、郵便番号フィールドを含む h-adr ルートを返す
 * @param {Element | null} start
 * @returns {HTMLElement | null}
 */
const findHAdrRoot = (start) => {
  let cur = start;
  while (cur instanceof HTMLElement) {
    if (cur.classList.contains('h-adr')) return cur;
    cur = cur.parentElement;
  }
  return null;
};

/**
 * data-feature ホストから制御対象の select を列挙する
 * @param {Element} host
 * @returns {HTMLSelectElement[]}
 */
const resolveSelectsFromHost = (host) => {
  if (!(host instanceof Element)) return [];

  if (host.tagName === 'SELECT') {
    return [/** @type {HTMLSelectElement} */ (host)];
  }

  return Array.from(host.querySelectorAll('select')).filter(
    (el) => el instanceof HTMLSelectElement
  );
};

/**
 * スコープ内の制御対象 select を重複なく取得する
 * @param {ParentNode} scope
 * @returns {HTMLSelectElement[]}
 */
const collectManagedSelects = (scope) => {
  /** @type {Set<HTMLSelectElement>} */
  const selects = new Set();

  scope.querySelectorAll(SELECTOR_HOST).forEach((host) => {
    resolveSelectsFromHost(host).forEach((select) => {
      selects.add(select);
    });
  });

  return Array.from(selects);
};

/**
 * select が selectActiveState の管理対象かどうか
 * @param {HTMLSelectElement} select
 * @returns {boolean}
 */
const isManagedSelect = (select) => {
  if (select.matches(SELECTOR_HOST)) return true;
  return Boolean(select.closest(SELECTOR_HOST));
};

/**
 * @param {HTMLSelectElement} select
 * @returns {void}
 */
const syncSelectActive = (select) => {
  let hasValue = false;
  if (select.multiple) {
    hasValue = Array.from(select.selectedOptions).some((opt) => opt.value !== '');
  } else {
    hasValue = select.value !== '';
  }

  select.classList.toggle(STATE_CLASSES.ACTIVE, hasValue);
};

/**
 * @param {ParentNode} scope
 * @returns {void}
 */
const syncSelectActiveInScope = (scope) => {
  collectManagedSelects(scope).forEach((select) => {
    syncSelectActive(select);
  });
};

/** @type {WeakMap<HTMLElement, number>} */
const yubinResyncTimers = new WeakMap();

/**
 * 郵便番号まわりの更新後に select の見た目を合わせる（即時＋遅延）
 * @param {HTMLElement} hadrRoot
 * @returns {void}
 */
const scheduleSyncAfterPostalActivity = (hadrRoot) => {
  globalThis.queueMicrotask(() => {
    syncSelectActiveInScope(hadrRoot);
  });

  const prev = yubinResyncTimers.get(hadrRoot);
  if (prev !== undefined) window.clearTimeout(prev);
  const id = window.setTimeout(() => {
    yubinResyncTimers.delete(hadrRoot);
    syncSelectActiveInScope(hadrRoot);
  }, 300);
  yubinResyncTimers.set(hadrRoot, id);
};

/**
 * @param {{ root?: Document | Element }} [ctx]
 * @returns {void}
 */
const init = (ctx = {}) => {
  const { root = document } = ctx;

  const onSelectValueEvent = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    if (!isManagedSelect(target)) return;
    syncSelectActive(target);
  };

  syncSelectActiveInScope(root);

  root.addEventListener('change', onSelectValueEvent);
  root.addEventListener('input', onSelectValueEvent);

  const triggerYubinBangoLookup = (postalInput) => {
    const KeyEvent = globalThis.KeyboardEvent;
    if (!KeyEvent) return;
    postalInput.dispatchEvent(new KeyEvent('keyup', { bubbles: true }));
  };

  const onPostalRelatedEvent = (event) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.matches(SELECTOR_POSTAL)) return;

    const inputType =
      event.type === 'input' && 'inputType' in event ? String(event.inputType) : '';
    if (POSTAL_LOOKUP_INPUT_TYPES.has(inputType)) {
      triggerYubinBangoLookup(target);
    }

    const hadrRoot = findHAdrRoot(target);
    if (!hadrRoot) return;
    scheduleSyncAfterPostalActivity(hadrRoot);
  };

  root.addEventListener('keyup', onPostalRelatedEvent);
  root.addEventListener('input', onPostalRelatedEvent);
  root.addEventListener('focusout', onPostalRelatedEvent);
};

export const selectActiveState = { init };
