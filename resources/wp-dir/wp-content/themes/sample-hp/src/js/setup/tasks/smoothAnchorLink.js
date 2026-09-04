/************************************************************
 * アンカーリンクスムーススクロール（Lenis 未利用時のフォールバック）
 * ページ内のアンカーリンクをクリックした際にスムーススクロールを実行
 * 画面遷移を伴う場合の位置調整は html の scroll-padding-top を参照
 ************************************************************/

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

    const hash = linkUrl.hash;
    if (!hash || hash === '#' || hash === '#0') {
      return null;
    }

    if (!isSamePagePathname(linkUrl.pathname, window.location.pathname)) {
      return null;
    }

    if (linkUrl.search !== window.location.search) {
      return null;
    }

    return decodeURIComponent(hash.slice(1));
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
 * アンカー要素のスクロール基準位置を取得
 * 要素上部 + padding-block-start が scroll-padding-top の位置に来る Y 座標
 * @param {HTMLElement} element - 基準要素
 * @returns {number}
 */
export function getAnchorTriggerScrollY(element) {
  const elementRect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);
  const paddingTop = parseFloat(computedStyle.getPropertyValue('padding-block-start'));
  const currentScrollY = window.scrollY;
  const { scrollPaddingTop } = window.getComputedStyle(document.documentElement);
  const scrollPadding = parseFloat(scrollPaddingTop);
  const offset = Number.isFinite(scrollPadding) ? scrollPadding : 0;
  const paddingBlockStart = Number.isFinite(paddingTop) ? paddingTop : 0;

  return currentScrollY + elementRect.top + paddingBlockStart - offset;
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
