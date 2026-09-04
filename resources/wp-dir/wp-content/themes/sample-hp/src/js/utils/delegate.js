/************************************************************
 * data-action 委譲ヘルパ
 * - ページ/モジュール内で data-action を scope root で一括リスン
 * - data-action は「prefix.actionName」形式がルール（例: page.xxx, modal.xxx）。
 *   形式に合わない値はコンソールにワーニングを出す。
 * - 委譲不可イベントは警告＋登録停止、委譲非推奨は警告のみ（js-fix-2 方針）
 ************************************************************/

import { DATA_ATTR } from '../constans/global.js';

const 委譲不可イベント = new Set([
  'focus',
  'blur',
  'mouseenter',
  'mouseleave',
  'pointerenter',
  'pointerleave',
  'load',
  'error',
  'abort',
  'resize',
  'scroll',
  'DOMContentLoaded',
  'readystatechange',
  'unload',
  'beforeunload',
  'pagehide',
  'visibilitychange',
]);

const 委譲非推奨イベント = new Set([
  'mousemove',
  'pointermove',
  'touchmove',
  'wheel',
  'drag',
  'dragover',
  'drop',
  'input',
  'keydown',
  'keyup',
]);

const ルート表示 = (root) => {
  if (root === document) return 'document';
  if (root instanceof Element) {
    const id = root.id ? `#${root.id}` : '';
    return `<${root.tagName.toLowerCase()}${id}>`;
  }
  return String(root);
};

const warn = (eventType, root, kind) => {
  const r = ルート表示(root);
  console.warn(
    `[delegate警告] ${kind}\n  event="${eventType}" / root=${r}\n  → 委譲設計の見直しを推奨します。`
  );
};

/** data-action の値が「prefix.actionName」形式（例: page.xxx, modal.xxx）かどうか */
const ACTION_KEY_PREFIX_PATTERN = /^[^.]+\.[^.]+$/;

const warnActionKeyFormat = (key, root) => {
  const r = ルート表示(root);
  console.warn(
    `[delegate警告] data-action は「prefix.actionName」形式で指定してください（例: page.xxx, modal.xxx）。\n  現在の値: "${key}" / root=${r}`
  );
};

/**
 * data-action を委譲で処理する
 * @param {Document|Element} root - 委譲のルート（document または Element）
 * @param {string|{ eventType: string, selector?: string, getKey?: (el: Element) => string, suppressWarn?: boolean, force?: boolean }} eventTypeOrOptions - イベントタイプ（必須）。文字列または { eventType } を含むオプション
 * @param {Record<string, (e: Event, el: Element) => void>} handlers - action 名 → ハンドラ
 */
export const delegate = (root, eventTypeOrOptions, handlers) => {
  if (eventTypeOrOptions === undefined || eventTypeOrOptions === null) {
    throw new Error('delegate: eventType は必須です。例: delegate(root, "click", handlers)');
  }

  const options =
    typeof eventTypeOrOptions === 'string' ? { eventType: eventTypeOrOptions } : eventTypeOrOptions;

  const {
    eventType,
    selector = `[${DATA_ATTR.ACTION}]`,
    getKey = (el) => el.getAttribute(DATA_ATTR.ACTION),
    suppressWarn = false,
    force = false,
  } = options;

  if (!eventType || typeof eventType !== 'string') {
    throw new Error('delegate: eventType は必須です。例: delegate(root, "click", handlers)');
  }

  if (!root) return;

  if (!suppressWarn) {
    if (委譲不可イベント.has(eventType)) {
      warn(eventType, root, '委譲不可イベントです（バブリングしない/扱いが特殊）');
      if (!force) return;
    } else if (委譲非推奨イベント.has(eventType)) {
      warn(eventType, root, '委譲は非推奨です（高頻度/重い可能性）');
    }
  }

  root.addEventListener(eventType, (e) => {
    const target = e.target instanceof Element ? e.target : null;
    if (!target) return;
    const el = target.closest(selector);
    if (!el) return;
    if (root instanceof Element && !root.contains(el)) return;
    const key = getKey(el);
    if (key && !suppressWarn && !ACTION_KEY_PREFIX_PATTERN.test(key)) {
      warnActionKeyFormat(key, root);
    }
    const fn = handlers[key];
    if (fn) fn(e, el);
  });
};
