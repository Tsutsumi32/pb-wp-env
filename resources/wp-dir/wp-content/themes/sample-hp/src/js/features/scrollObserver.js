/************************************************************
 * スクロール交差で is_active を付与（features）
 * - data-feature="scrollObserver" が対象
 * - data-scroll-observer-mode で挙動を切替（latch / toggle / once）
 * - latch 時の解除タイミングは data-scroll-observer-latch-deactivate-when で指定
 * - アニメーションは has_observer_xxxx クラス（animations/contracts/_observer.scss）で指定
 ************************************************************/

import { DATA_ATTR, STATE_CLASSES } from '../constans/global.js';

// ---------------------------------------------------------------------------
// data 属性（参照するものは定数で一覧化。DATA_ATTR.FEATURE は global.js）
// ---------------------------------------------------------------------------
/** 機能名（data-feature の値）。data 属性の値はキャメルケース */
const FEATURE_NAME = 'scrollObserver';
const FEATURE_ATTR_NAME = 'scroll-observer';
const FEATURE_DATA_PREFIX = `data-${FEATURE_ATTR_NAME}`;

/** 挙動モード（latch / toggle / once） */
const ATTR_MODE = `${FEATURE_DATA_PREFIX}-mode`;
/** IntersectionObserver の rootMargin（要素ごとに上書き可） */
const ATTR_ROOT_MARGIN = `${FEATURE_DATA_PREFIX}-root-margin`;
/** IntersectionObserver の threshold（要素ごとに上書き可） */
const ATTR_THRESHOLD = `${FEATURE_DATA_PREFIX}-threshold`;
/** latch 時の is_active 解除タイミング（fullyHidden / outOfRoot） */
const ATTR_LATCH_DEACTIVATE_WHEN = `${FEATURE_DATA_PREFIX}-latch-deactivate-when`;

const SELECTOR_TARGET = `[${DATA_ATTR.FEATURE}="${FEATURE_NAME}"]`;

/** 下方向通過後は is_active を維持し、上方向に戻ったときのみ解除（初期値） */
const MODE_LATCH = 'latch';

/** 範囲外に出たとき is_active を外し、再入場で付け直す */
const MODE_TOGGLE = 'toggle';

/** 初回の交差時のみ is_active を付与し、監視を解除 */
const MODE_ONCE = 'once';

/** latch 解除: 要素が表示領域から完全に見えなくなってから（初期値） */
const LATCH_DEACTIVATE_FULLY_HIDDEN = 'fullyHidden';

/** latch 解除: rootMargin 適用後の root 境界を越えた時点 */
const LATCH_DEACTIVATE_OUT_OF_ROOT = 'outOfRoot';

/** @type {Map<EventTarget, { pending: Set<Element>, abort: AbortController }>} */
const latchScrollRegistry = new Map();

/** @type {WeakMap<Element, Element|null>} */
const latchPendingRoots = new WeakMap();

/**
 * 要素が表示領域より上に完全に隠れたか
 * @param {DOMRectReadOnly} rect
 * @param {Element|null} root
 * @returns {boolean}
 */
const isRectFullyAboveVisibleArea = (rect, root) => {
  if (root) {
    return rect.bottom <= root.getBoundingClientRect().top;
  }

  return rect.bottom <= 0;
};

/**
 * 要素が表示領域より下に完全に隠れたか（上方向スクロールで領域外）
 * @param {DOMRectReadOnly} rect
 * @param {Element|null} root
 * @returns {boolean}
 */
const isRectFullyBelowVisibleArea = (rect, root) => {
  if (root) {
    return rect.top >= root.getBoundingClientRect().bottom;
  }

  return rect.top >= window.innerHeight;
};

/**
 * @param {IntersectionObserverEntry} entry
 * @param {Element|null} root
 * @returns {boolean}
 */
const isElementFullyBelowVisibleArea = (entry, root) =>
  isRectFullyBelowVisibleArea(entry.boundingClientRect, root);

/**
 * 下方向通過済みの位置か（未達位置では false）
 * @param {IntersectionObserverEntry} entry
 * @param {Element|null} root
 * @returns {boolean}
 */
const isLatchPastPosition = (entry, root) => {
  if (entry.isIntersecting) return false;

  const rect = entry.boundingClientRect;
  if (isRectFullyBelowVisibleArea(rect, root)) return false;

  const { rootBounds } = entry;
  if (rootBounds) {
    return rect.bottom <= rootBounds.top || rect.top < rootBounds.top;
  }

  return isRectFullyAboveVisibleArea(rect, root) || rect.top < 0;
};

/**
 * @param {Element|null} root
 * @returns {EventTarget}
 */
const getLatchScrollTarget = (root) => root ?? window;

/**
 * fullyHidden 解除待ちの要素をスクロール監視に登録
 * @param {Element} element
 * @param {Element|null} root
 */
const scheduleLatchDeactivateCheck = (element, root) => {
  const scrollTarget = getLatchScrollTarget(root);
  let registry = latchScrollRegistry.get(scrollTarget);

  if (!registry) {
    const abort = new AbortController();
    const listenerOptions = { passive: true, signal: abort.signal };
    const pending = new Set();

    const flush = () => flushLatchPending(scrollTarget);

    scrollTarget.addEventListener('scroll', flush, listenerOptions);
    if (scrollTarget === window) {
      window.addEventListener('resize', flush, listenerOptions);
    }

    registry = { pending, abort };
    latchScrollRegistry.set(scrollTarget, registry);
  }

  registry.pending.add(element);
  latchPendingRoots.set(element, root);
  flushLatchPending(scrollTarget);
};

/**
 * @param {EventTarget} scrollTarget
 */
const flushLatchPending = (scrollTarget) => {
  const registry = latchScrollRegistry.get(scrollTarget);
  if (!registry) return;

  registry.pending.forEach((element) => {
    if (!element.isConnected || !element.classList.contains(STATE_CLASSES.ACTIVE)) {
      registry.pending.delete(element);
      latchPendingRoots.delete(element);
      return;
    }

    const root = latchPendingRoots.get(element) ?? null;
    if (isRectFullyBelowVisibleArea(element.getBoundingClientRect(), root)) {
      element.classList.remove(STATE_CLASSES.ACTIVE);
      registry.pending.delete(element);
      latchPendingRoots.delete(element);
    }
  });

  if (registry.pending.size === 0) {
    registry.abort.abort();
    latchScrollRegistry.delete(scrollTarget);
  }
};

/**
 * 要素が IntersectionObserver の root 境界より下にあるか
 * @param {IntersectionObserverEntry} entry
 * @returns {boolean}
 */
const isElementBelowRootBounds = (entry) => {
  const { boundingClientRect, rootBounds } = entry;
  const rootBottom = rootBounds?.bottom ?? window.innerHeight;

  return boundingClientRect.top >= rootBottom;
};

/**
 * @param {Element} element
 * @param {string} defaultLatchDeactivateWhen
 * @returns {string}
 */
const resolveLatchDeactivateWhen = (element, defaultLatchDeactivateWhen) => {
  return element.getAttribute(ATTR_LATCH_DEACTIVATE_WHEN) || defaultLatchDeactivateWhen;
};

/**
 * @param {Element} element
 * @param {IntersectionObserverInit} observerOptions
 * @param {{ deactivateWhen?: string }} [latchOptions]
 * @returns {IntersectionObserver}
 */
const initLatch = (element, observerOptions, latchOptions = {}) => {
  const deactivateWhen = latchOptions.deactivateWhen ?? LATCH_DEACTIVATE_FULLY_HIDDEN;
  const root = observerOptions.root ?? null;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const { target, isIntersecting } = entry;

      if (isIntersecting) {
        target.classList.add(STATE_CLASSES.ACTIVE);
        return;
      }

      // リロード等で通過済み位置から復元されたとき、初回から is_active を維持する
      if (isLatchPastPosition(entry, root) && !target.classList.contains(STATE_CLASSES.ACTIVE)) {
        target.classList.add(STATE_CLASSES.ACTIVE);
      }

      const shouldDeactivate =
        deactivateWhen === LATCH_DEACTIVATE_OUT_OF_ROOT
          ? isElementBelowRootBounds(entry)
          : isElementFullyBelowVisibleArea(entry, root);

      if (shouldDeactivate) {
        target.classList.remove(STATE_CLASSES.ACTIVE);
        return;
      }

      if (
        deactivateWhen === LATCH_DEACTIVATE_FULLY_HIDDEN &&
        target.classList.contains(STATE_CLASSES.ACTIVE)
      ) {
        scheduleLatchDeactivateCheck(target, root);
      }
    });
  }, observerOptions);

  observer.observe(element);
  return observer;
};

/**
 * @param {Element} element
 * @param {IntersectionObserverInit} observerOptions
 * @returns {IntersectionObserver}
 */
const initToggle = (element, observerOptions) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle(STATE_CLASSES.ACTIVE, entry.isIntersecting);
    });
  }, observerOptions);

  observer.observe(element);
  return observer;
};

/**
 * @param {Element} element
 * @param {IntersectionObserverInit} observerOptions
 * @returns {IntersectionObserver}
 */
const initOnce = (element, observerOptions) => {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add(STATE_CLASSES.ACTIVE);
      obs.unobserve(entry.target);
    });
  }, observerOptions);

  observer.observe(element);
  return observer;
};

/**
 * 要素ごとの IntersectionObserver オプションを解決
 * @param {Element} element
 * @param {IntersectionObserverInit} defaultOptions
 * @returns {IntersectionObserverInit}
 */
const resolveObserverOptions = (element, defaultOptions) => {
  const rootMargin = element.getAttribute(ATTR_ROOT_MARGIN);
  const threshold = element.getAttribute(ATTR_THRESHOLD);

  return {
    root: defaultOptions.root ?? null,
    rootMargin: rootMargin ?? defaultOptions.rootMargin ?? '0px 0px -12% 0px',
    threshold:
      threshold !== null && threshold !== '' ? Number(threshold) : (defaultOptions.threshold ?? 0),
  };
};

/**
 * 初期化（[data-feature="scrollObserver"] に data-scroll-observer-mode に応じて適用）
 * @param {{ root?: Document|Element }} [ctx]
 * @param {{ root?: Element|null, rootMargin?: string, threshold?: number, defaultMode?: string, defaultLatchDeactivateWhen?: string }} [options]
 */
const init = (ctx = {}, options = {}) => {
  const { root = document } = ctx;
  const defaultOptions = {
    root: options.root ?? null,
    rootMargin: options.rootMargin ?? '0px 0px -18% 0px',
    threshold: options.threshold ?? 0,
  };
  const defaultMode = options.defaultMode ?? MODE_LATCH;
  const defaultLatchDeactivateWhen =
    options.defaultLatchDeactivateWhen ?? LATCH_DEACTIVATE_FULLY_HIDDEN;

  root.querySelectorAll(SELECTOR_TARGET).forEach((element) => {
    const mode = element.getAttribute(ATTR_MODE) || defaultMode;
    const observerOptions = resolveObserverOptions(element, defaultOptions);
    const latchDeactivateWhen = resolveLatchDeactivateWhen(element, defaultLatchDeactivateWhen);

    if (mode === MODE_ONCE) {
      initOnce(element, observerOptions);
    } else if (mode === MODE_TOGGLE) {
      initToggle(element, observerOptions);
    } else {
      initLatch(element, observerOptions, { deactivateWhen: latchDeactivateWhen });
    }
  });
};

export const scrollObserver = {
  init,
  initLatch,
  initToggle,
  initOnce,
  MODE_LATCH,
  MODE_TOGGLE,
  MODE_ONCE,
  LATCH_DEACTIVATE_FULLY_HIDDEN,
  LATCH_DEACTIVATE_OUT_OF_ROOT,
};
