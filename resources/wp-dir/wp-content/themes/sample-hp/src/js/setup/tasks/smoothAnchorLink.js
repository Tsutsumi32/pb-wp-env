/************************************************************
 * アンカーリンクスムーススクロール（Lenis 未利用時のフォールバック）
 * ページ内のアンカーリンクをクリックした際にスムーススクロールを実行
 * 画面遷移を伴う場合は GSAP ScrollSmoother がコンテンツを position:fixed +
 * transform で仮想スクロールするため、ブラウザ標準のハッシュジャンプが機能しない。
 * そのため initHashScrollOnLoad でページ読み込み後に同様の位置調整を行う。
 ************************************************************/

import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { refreshScrollTrigger } from '../../features/gsap.js';
import { windowLoad } from '../../lifecycle/windowLoad.js';

// ---------------------------------------------------------------------------
// data 属性（参照するものは定数で一覧化）
// ---------------------------------------------------------------------------
/** ハッシュ付き遷移で、標準ジャンプ回避のために退避したターゲットID */
const ATTR_PENDING_HASH = 'data-gsap-pending-hash';

// ---------------------------------------------------------------------------
// 調整用定数
// ---------------------------------------------------------------------------
const SMOOTH_ANCHOR_LINK_CONFIG = Object.freeze({
  scrollDurationMs: 500,
  /** アクティブ判定をスクロール先より若干早めに行う余白（px） */
  activeThresholdOffsetPx: 24,
});

let isInitialized = false;

/**
 * アンカーリンクのスムーススクロール処理を初期化
 * 同一ページ内のアンカーリンク（`#section` / `/#section` 等）クリック時にスムーススクロールを実行
 * ヘッダーの高さを考慮した位置調整を行う
 */
export function initSmoothAnchorLink() {
  if (isInitialized) {
    return;
  }

  isInitialized = true;
  document.addEventListener('click', handleAnchorClick);
}

/**
 * 画面遷移を伴うアンカーリンク（他ページから `#section` 付きURLで遷移した場合）の初期スクロール
 * GSAP ScrollSmoother 初期化後はブラウザ標準のハッシュジャンプが機能しない（Safari では衝突して
 * スクロール不能になる）ため、header のインライン script で hash を退避し、
 * 画像等の読み込み完了・レイアウト確定後に smoother 経由で移動する
 */
export async function initHashScrollOnLoad() {
  const targetId = consumePendingHashTargetId();
  if (!targetId) {
    return;
  }

  const targetElement = document.getElementById(targetId);
  if (!targetElement) {
    restoreHash(targetId);
    return;
  }

  // 標準ジャンプや復元スクロールが残っている場合に備え、smoother 初期位置をトップへ戻す
  window.scrollTo(0, 0);
  ScrollSmoother.get()?.scrollTo(0, false);

  await windowLoad();
  refreshScrollTrigger();

  smoothScrollTo(getHashScrollTargetY(targetElement));
  restoreHash(targetId);
}

/**
 * 退避済み hash、なければ location.hash からターゲットIDを取得して消費する
 * @returns {string|null}
 */
function consumePendingHashTargetId() {
  const pendingId = document.documentElement.getAttribute(ATTR_PENDING_HASH);
  if (pendingId) {
    document.documentElement.removeAttribute(ATTR_PENDING_HASH);
    return pendingId;
  }

  return getHashTargetId(location.hash);
}

/**
 * アドレスバーの hash をスクロールを起こさずに戻す
 * @param {string} targetId
 * @returns {void}
 */
function restoreHash(targetId) {
  const nextUrl = `${location.pathname}${location.search}#${targetId}`;
  const currentUrl = `${location.pathname}${location.search}${location.hash}`;
  if (currentUrl === nextUrl) {
    return;
  }

  history.replaceState(null, '', nextUrl);
}

/**
 * URL の hash からターゲットIDを取得
 * @param {string} hash - `location.hash`（`#` を含む）
 * @returns {string|null}
 */
function getHashTargetId(hash) {
  if (!hash || hash === '#' || hash === '#0') {
    return null;
  }

  return decodeURIComponent(hash.slice(1));
}

/**
 * アンカーリンククリック時の処理
 * @param {Event} e - クリックイベント
 */
function handleAnchorClick(e) {
  const target = e.target;
  if (!(target instanceof Element)) {
    return;
  }

  const link = target.closest('a[href*="#"]');
  if (!link) {
    return;
  }

  const targetId = getSamePageAnchorTargetId(link.getAttribute('href'));
  if (!targetId) {
    return;
  }

  const targetElement = document.getElementById(targetId);

  if (!targetElement) {
    console.warn(`ターゲット要素 "#${targetId}" が見つかりません。`);
    return;
  }

  e.preventDefault();
  smoothScrollToElement(targetElement);
}

/**
 * 同一ページ内アンカーならターゲットIDを返す
 * @param {string|null} href
 * @returns {string|null}
 */
function getSamePageAnchorTargetId(href) {
  if (!href || href === '#' || href === '#0') {
    return null;
  }

  try {
    const linkUrl = new URL(href, window.location.href);

    if (linkUrl.origin !== window.location.origin) {
      return null;
    }

    if (!isSamePagePathname(linkUrl.pathname, window.location.pathname)) {
      return null;
    }

    if (linkUrl.search !== window.location.search) {
      return null;
    }

    return getHashTargetId(linkUrl.hash);
  } catch {
    return null;
  }
}

/**
 * パス名を正規化して同一ページか判定
 * @param {string} linkPathname
 * @param {string} currentPathname
 * @returns {boolean}
 */
function isSamePagePathname(linkPathname, currentPathname) {
  return normalizePathname(linkPathname) === normalizePathname(currentPathname);
}

/**
 * パス名を正規化（末尾 index.php / index.html をルート扱い）
 * @param {string} pathname
 * @returns {string}
 */
function normalizePathname(pathname) {
  const normalized = pathname.replace(/\/index\.(php|html?)$/i, '');
  return normalized === '' ? '/' : normalized;
}

/**
 * html の scroll-padding-top（ヘッダー高さ + 余白）を取得
 * @returns {number}
 */
function getScrollPaddingTop() {
  const { scrollPaddingTop } = window.getComputedStyle(document.documentElement);
  const scrollPadding = parseFloat(scrollPaddingTop);
  return Number.isFinite(scrollPadding) ? scrollPadding : 0;
}

/**
 * アンカー要素のスクロール基準位置を取得
 * 要素上部 + padding-block-start が scroll-padding-top の位置に来る Y 座標
 * @param {HTMLElement} element - 基準要素
 * @returns {number}
 */
export function getAnchorTriggerScrollY(element) {
  const elementRect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);
  const paddingTop = parseFloat(computedStyle.getPropertyValue('padding-block-start'));
  const paddingBlockStart = Number.isFinite(paddingTop) ? paddingTop : 0;

  return window.scrollY + elementRect.top + paddingBlockStart - getScrollPaddingTop();
}

/**
 * 画面遷移時のスクロール基準位置を取得
 * html の scroll-padding-top に純粋に合わせ、要素上部が scroll-padding-top の位置に来る Y 座標
 * （padding-block-start は考慮しない。クリック時の getAnchorTriggerScrollY とは基準が異なる）
 * @param {HTMLElement} element - 基準要素
 * @returns {number}
 */
export function getHashScrollTargetY(element) {
  const elementRect = element.getBoundingClientRect();

  return window.scrollY + elementRect.top - getScrollPaddingTop();
}

/**
 * アンカーリンクのアクティブ判定用スクロール位置
 * getAnchorTriggerScrollY より若干上（早め）で判定し、クリック遷移直後の未達を防ぐ
 * @param {HTMLElement} element - 基準要素
 * @returns {number}
 */
export function getAnchorActiveScrollY(element) {
  return getAnchorTriggerScrollY(element) - SMOOTH_ANCHOR_LINK_CONFIG.activeThresholdOffsetPx;
}

/**
 * 指定要素までスムーススクロール
 * @param {HTMLElement} element - スクロール先の要素
 */
function smoothScrollToElement(element) {
  smoothScrollTo(getAnchorTriggerScrollY(element), SMOOTH_ANCHOR_LINK_CONFIG.scrollDurationMs);
}

/**
 * 指定位置までスムーススクロール
 * @param {number} targetPosition - スクロール先の位置
 * @param {number} [duration=SMOOTH_ANCHOR_LINK_CONFIG.scrollDurationMs] - スクロール時間（ミリ秒）
 */
export function smoothScrollTo(
  targetPosition,
  duration = SMOOTH_ANCHOR_LINK_CONFIG.scrollDurationMs
) {
  // GSAP ScrollSmoother 稼働中はその scrollTo に委譲（window.scrollTo の直接操作は内部処理と競合するため）
  const smoother = ScrollSmoother.get();
  if (smoother) {
    smoother.scrollTo(targetPosition, true);
    return;
  }

  const startPosition = window.scrollY;
  const distance = targetPosition - startPosition;
  let startTime = null;

  /**
   * アニメーション関数
   * @param {number} currentTime - 現在時刻
   */
  function animation(currentTime) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);

    // イージング関数（easeInOutCubic）
    const easeInOutCubic =
      progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    window.scrollTo(0, startPosition + distance * easeInOutCubic);

    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  }

  requestAnimationFrame(animation);
}
