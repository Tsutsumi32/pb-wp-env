/************************************************************
 * ページ離脱トランジション付きリンク遷移
 * - 同一オリジンの通常リンク遷移を一度止める
 * - runBeforeNavigate 完了後に location.assign で遷移
 ************************************************************/

import { STATE_CLASSES } from '../constans/global.js';

/**
 * @typedef {{ url: URL, anchor: HTMLAnchorElement }} NavigateContext
 */

/** 遷移前の標準待機時間（ms）css側のアニメーション秒数と一致 */
const DEFAULT_NAV_DELAY_MS = 450;

let isNavigating = false;

/**
 * 画面遷移インターセプトを初期化
 * @param {{
 *   runBeforeNavigate?: (ctx: NavigateContext) => Promise<void>|void,
 *   navDelayMs?: number,
 * }} [options]
 */
export function initPageUnmountOnLinkClick(options = {}) {
  const { navDelayMs = DEFAULT_NAV_DELAY_MS } = options;
  const runBeforeNavigate = options.runBeforeNavigate || createDefaultBeforeNavigate(navDelayMs);

  resetPageUnmountState();
  document.addEventListener('click', (event) => {
    void handleLinkNavigationWithDelay(event, runBeforeNavigate);
  });
}

/**
 * 離脱状態クラスを初期化（通常表示・BFCache復帰の両方に対応）
 */
function resetPageUnmountState() {
  isNavigating = false;
  document.body.classList.remove(STATE_CLASSES.PAGE_UNMOUNT);
  window.addEventListener('pageshow', () => {
    isNavigating = false;
    document.body.classList.remove(STATE_CLASSES.PAGE_UNMOUNT);
  });
}

/**
 * 既定の遷移前処理を生成
 * @param {number} navDelayMs
 * @returns {(ctx: NavigateContext) => Promise<void>}
 */
function createDefaultBeforeNavigate(navDelayMs) {
  return async () => {
    document.body.classList.add(STATE_CLASSES.PAGE_UNMOUNT);
    await wait(navDelayMs);
  };
}

/**
 * クリックされたリンクを判定し、必要であれば遅延遷移を実行
 * @param {MouseEvent} event
 * @param {(ctx: NavigateContext) => Promise<void>|void} runBeforeNavigate
 */
async function handleLinkNavigationWithDelay(event, runBeforeNavigate) {
  if (isNavigating) {
    event.preventDefault();
    return;
  }
  if (event.defaultPrevented || !isPrimaryMouseClick(event)) {
    return;
  }

  const anchor = getAnchorFromEvent(event);
  if (!anchor || shouldSkipIntercept(anchor)) {
    return;
  }

  const url = resolveAnchorUrl(anchor);
  if (!url || !isSameOriginUrl(url) || isHashOnlyNavigation(url)) {
    return;
  }

  event.preventDefault();
  isNavigating = true;
  await safeRunBeforeNavigate(runBeforeNavigate, { url, anchor });
  window.location.assign(url.href);
}

/**
 * 主ボタンの通常クリックか
 * @param {MouseEvent} event
 */
function isPrimaryMouseClick(event) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

/**
 * イベント発火元からアンカー要素を取得
 * @param {MouseEvent} event
 * @returns {HTMLAnchorElement|null}
 */
function getAnchorFromEvent(event) {
  if (!(event.target instanceof Element)) {
    return null;
  }
  const anchor = event.target.closest('a[href]');
  if (!anchor || anchor.tagName !== 'A') {
    return null;
  }
  return /** @type {HTMLAnchorElement} */ (anchor);
}

/**
 * 遅延対象外リンクかどうか
 * @param {HTMLAnchorElement} anchor
 */
function shouldSkipIntercept(anchor) {
  const rawHref = (anchor.getAttribute('href') || '').trim().toLowerCase();
  if (!rawHref) return true;
  if (rawHref.startsWith('#')) return true;
  if (rawHref.startsWith('javascript:')) return true;
  if (rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) return true;
  if (anchor.hasAttribute('download')) return true;

  const target = (anchor.getAttribute('target') || '').toLowerCase();
  if (target && target !== '_self') return true;

  return false;
}

/**
 * anchor の href を URL 化
 * @param {HTMLAnchorElement} anchor
 * @returns {URL|null}
 */
function resolveAnchorUrl(anchor) {
  try {
    return new URL(anchor.href, window.location.href);
  } catch {
    return null;
  }
}

/**
 * 同一オリジン URL かどうか
 * @param {URL} url
 */
function isSameOriginUrl(url) {
  return url.origin === window.location.origin;
}

/**
 * 同一ページ内ハッシュ移動のみかどうか
 * @param {URL} url
 */
function isHashOnlyNavigation(url) {
  return (
    url.pathname === window.location.pathname &&
    url.search === window.location.search &&
    Boolean(url.hash)
  );
}

/**
 * 遷移前フックを安全に実行（失敗しても遷移は継続）
 * @param {(ctx: NavigateContext) => Promise<void>|void} runBeforeNavigate
 * @param {NavigateContext} ctx
 */
async function safeRunBeforeNavigate(runBeforeNavigate, ctx) {
  try {
    await runBeforeNavigate(ctx);
  } catch {
    // 遷移ブロックを避けるため握りつぶす
  }
}

/**
 * 指定時間待機
 * @param {number} ms
 */
function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
