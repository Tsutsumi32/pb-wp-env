/************************************************************
 * スクロール交差で is_active を付与（features）
 * - data-feature="scrollObserver" が監視対象
 * - 交差相手は data-scroll-observer-against（viewport / 祖先セレクタ）
 * - 相手の位置は data-scroll-observer-edge（top / center / bottom）
 *   ※ root-margin 指定時は edge より優先
 * - is_active 付与先は data-scroll-observer-target（省略時は自身）
 * - data-scroll-observer-mode で挙動を切替（latch / toggle / once）
 * - latch 時の解除タイミングは data-scroll-observer-latch-deactivate-when で指定
 * - アニメーションは has_observer_xxxx クラス（animations/contracts/_observer.scss）で指定
 ************************************************************/

import { DATA_ATTR, MODE, STATE_CLASSES } from '../constans/global.js';

// ---------------------------------------------------------------------------
// data 属性（参照するものは定数で一覧化。DATA_ATTR.FEATURE は global.js）
// ---------------------------------------------------------------------------
/** 機能名（data-feature の値）。data 属性の値はキャメルケース */
const FEATURE_NAME = 'scrollObserver';
const FEATURE_ATTR_NAME = 'scroll-observer';
const FEATURE_DATA_PREFIX = `data-${FEATURE_ATTR_NAME}`;

/** 挙動モード（latch / toggle / once） */
const ATTR_MODE = `${FEATURE_DATA_PREFIX}-mode`;
/** 交差相手（viewport / 祖先要素のセレクタ） */
const ATTR_AGAINST = `${FEATURE_DATA_PREFIX}-against`;
/** 交差相手側の判定位置（top / center / bottom） */
const ATTR_EDGE = `${FEATURE_DATA_PREFIX}-edge`;
/** IntersectionObserver の rootMargin（指定時は edge より優先） */
const ATTR_ROOT_MARGIN = `${FEATURE_DATA_PREFIX}-root-margin`;
/** IntersectionObserver の threshold（要素ごとに上書き可） */
const ATTR_THRESHOLD = `${FEATURE_DATA_PREFIX}-threshold`;
/** is_active を付ける要素のセレクタ（省略時は監視要素自身） */
const ATTR_TARGET = `${FEATURE_DATA_PREFIX}-target`;
/** latch 時の is_active 解除タイミング（fullyHidden / outOfRoot） */
const ATTR_LATCH_DEACTIVATE_WHEN = `${FEATURE_DATA_PREFIX}-latch-deactivate-when`;

const SELECTOR_FEATURE = `[${DATA_ATTR.FEATURE}="${FEATURE_NAME}"]`;

/** 下方向通過後は is_active を維持し、上方向に戻ったときのみ解除（初期値） */
const MODE_LATCH = 'latch';

/** 範囲外に出たとき is_active を外し、再入場で付け直す */
const MODE_TOGGLE = 'toggle';

/** 初回の交差時のみ is_active を付与し、監視を解除 */
const MODE_ONCE = 'once';

/** 交差相手: 画面（初期値） */
const AGAINST_VIEWPORT = 'viewport';

/** 相手側の判定位置: 上端 */
const EDGE_TOP = 'top';

/** 相手側の判定位置: 中央 */
const EDGE_CENTER = 'center';

/** 相手側の判定位置: 下端 */
const EDGE_BOTTOM = 'bottom';

/** latch 解除: 要素が表示領域から完全に見えなくなってから（初期値） */
const LATCH_DEACTIVATE_FULLY_HIDDEN = 'fullyHidden';

/** latch 解除: rootMargin 適用後の root 境界を越えた時点 */
const LATCH_DEACTIVATE_OUT_OF_ROOT = 'outOfRoot';

/**
 * edge → rootMargin（相手側に 1px 相当の判定帯を作る）
 * @type {Readonly<Record<string, string>>}
 */
const EDGE_ROOT_MARGIN = Object.freeze({
  [EDGE_TOP]: '0px 0px calc(-100% + 1px) 0px',
  [EDGE_CENTER]: 'calc(-50% + 0.5px) 0px calc(-50% + 0.5px) 0px',
  [EDGE_BOTTOM]: 'calc(-100% + 1px) 0px 0px 0px',
});

/** @type {Map<EventTarget, { pending: Set<Element>, abort: AbortController }>} */
const latchScrollRegistry = new Map();

/** @type {WeakMap<Element, Element|null>} */
const latchPendingRoots = new WeakMap();

/** @type {WeakMap<Element, Element[]>} */
const latchPendingTargets = new WeakMap();

/**
 * develop 時のみ警告を出す
 * @param {string} message
 */
const warnDevelop = (message) => {
  if (MODE === 'develop') {
    console.warn(`[scrollObserver] ${message}`);
  }
};

/**
 * is_active の付与 / 解除
 * @param {Element[]} targets
 * @param {boolean} active
 */
const setActiveState = (targets, active) => {
  targets.forEach((target) => {
    target.classList.toggle(STATE_CLASSES.ACTIVE, active);
  });
};

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
 * @param {Element[]} targets
 * @param {Element|null} root
 */
const scheduleLatchDeactivateCheck = (element, targets, root) => {
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
  latchPendingTargets.set(element, targets);
  flushLatchPending(scrollTarget);
};

/**
 * @param {EventTarget} scrollTarget
 */
const flushLatchPending = (scrollTarget) => {
  const registry = latchScrollRegistry.get(scrollTarget);
  if (!registry) return;

  registry.pending.forEach((element) => {
    const targets = latchPendingTargets.get(element) ?? [element];
    const isAnyActive = targets.some((target) => target.classList.contains(STATE_CLASSES.ACTIVE));

    if (!element.isConnected || !isAnyActive) {
      registry.pending.delete(element);
      latchPendingRoots.delete(element);
      latchPendingTargets.delete(element);
      return;
    }

    const root = latchPendingRoots.get(element) ?? null;
    if (isRectFullyBelowVisibleArea(element.getBoundingClientRect(), root)) {
      setActiveState(targets, false);
      registry.pending.delete(element);
      latchPendingRoots.delete(element);
      latchPendingTargets.delete(element);
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
 * is_active 付与先を解決（省略時は監視要素自身）
 * @param {Element} element
 * @returns {Element[]}
 */
const resolveTargets = (element) => {
  const selector = element.getAttribute(ATTR_TARGET);
  if (!selector) {
    return [element];
  }

  const targets = [...document.querySelectorAll(selector)];
  if (targets.length === 0) {
    warnDevelop(`${ATTR_TARGET}="${selector}" に一致する要素がありません`);
    return [element];
  }

  return targets;
};

/**
 * 交差相手（IntersectionObserver root）を解決
 * @param {Element} element
 * @param {Element|null} defaultRoot
 * @returns {Element|null}
 */
const resolveAgainstRoot = (element, defaultRoot) => {
  const against = element.getAttribute(ATTR_AGAINST);

  if (!against || against === AGAINST_VIEWPORT) {
    return defaultRoot ?? null;
  }

  const rootEl = element.closest(against);
  if (!rootEl) {
    warnDevelop(
      `${ATTR_AGAINST}="${against}" の祖先要素が見つかりません（監視要素の祖先である必要があります）`
    );
    return defaultRoot ?? null;
  }

  return rootEl;
};

/**
 * edge / root-margin から rootMargin を解決
 * @param {Element} element
 * @param {string} defaultRootMargin
 * @returns {string}
 */
const resolveRootMargin = (element, defaultRootMargin) => {
  const rootMargin = element.getAttribute(ATTR_ROOT_MARGIN);
  if (rootMargin !== null && rootMargin !== '') {
    return rootMargin;
  }

  const edge = element.getAttribute(ATTR_EDGE);
  if (edge) {
    const fromEdge = EDGE_ROOT_MARGIN[edge];
    if (fromEdge) {
      return fromEdge;
    }
    warnDevelop(`${ATTR_EDGE}="${edge}" は未対応です（top / center / bottom）`);
  }

  return defaultRootMargin;
};

/**
 * 要素ごとの IntersectionObserver オプションを解決
 * @param {Element} element
 * @param {IntersectionObserverInit} defaultOptions
 * @returns {IntersectionObserverInit}
 */
const resolveObserverOptions = (element, defaultOptions) => {
  const threshold = element.getAttribute(ATTR_THRESHOLD);
  const defaultRootMargin = defaultOptions.rootMargin ?? '0px 0px -12% 0px';

  return {
    root: resolveAgainstRoot(element, defaultOptions.root ?? null),
    rootMargin: resolveRootMargin(element, defaultRootMargin),
    threshold:
      threshold !== null && threshold !== '' ? Number(threshold) : (defaultOptions.threshold ?? 0),
  };
};

/**
 * @param {Element} element
 * @param {Element[]} targets
 * @param {IntersectionObserverInit} observerOptions
 * @param {{ deactivateWhen?: string }} [latchOptions]
 * @returns {IntersectionObserver}
 */
const initLatch = (element, targets, observerOptions, latchOptions = {}) => {
  const deactivateWhen = latchOptions.deactivateWhen ?? LATCH_DEACTIVATE_FULLY_HIDDEN;
  const root = observerOptions.root ?? null;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const { isIntersecting } = entry;

      if (isIntersecting) {
        setActiveState(targets, true);
        return;
      }

      // リロード等で通過済み位置から復元されたとき、初回から is_active を維持する
      const isAnyActive = targets.some((target) => target.classList.contains(STATE_CLASSES.ACTIVE));
      if (isLatchPastPosition(entry, root) && !isAnyActive) {
        setActiveState(targets, true);
      }

      const shouldDeactivate =
        deactivateWhen === LATCH_DEACTIVATE_OUT_OF_ROOT
          ? isElementBelowRootBounds(entry)
          : isElementFullyBelowVisibleArea(entry, root);

      if (shouldDeactivate) {
        setActiveState(targets, false);
        return;
      }

      const shouldScheduleDeactivate =
        deactivateWhen === LATCH_DEACTIVATE_FULLY_HIDDEN &&
        targets.some((target) => target.classList.contains(STATE_CLASSES.ACTIVE));

      if (shouldScheduleDeactivate) {
        scheduleLatchDeactivateCheck(element, targets, root);
      }
    });
  }, observerOptions);

  observer.observe(element);
  return observer;
};

/**
 * @param {Element} element
 * @param {Element[]} targets
 * @param {IntersectionObserverInit} observerOptions
 * @returns {IntersectionObserver}
 */
const initToggle = (element, targets, observerOptions) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      setActiveState(targets, entry.isIntersecting);
    });
  }, observerOptions);

  observer.observe(element);
  return observer;
};

/**
 * @param {Element} element
 * @param {Element[]} targets
 * @param {IntersectionObserverInit} observerOptions
 * @returns {IntersectionObserver}
 */
const initOnce = (element, targets, observerOptions) => {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      setActiveState(targets, true);
      obs.unobserve(entry.target);
    });
  }, observerOptions);

  observer.observe(element);
  return observer;
};

/**
 * 初期化（[data-feature="scrollObserver"] を監視し、target に is_active を付与）
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

  root.querySelectorAll(SELECTOR_FEATURE).forEach((element) => {
    const mode = element.getAttribute(ATTR_MODE) || defaultMode;
    const targets = resolveTargets(element);
    const observerOptions = resolveObserverOptions(element, defaultOptions);
    const latchDeactivateWhen = resolveLatchDeactivateWhen(element, defaultLatchDeactivateWhen);

    if (mode === MODE_ONCE) {
      initOnce(element, targets, observerOptions);
    } else if (mode === MODE_TOGGLE) {
      initToggle(element, targets, observerOptions);
    } else {
      initLatch(element, targets, observerOptions, { deactivateWhen: latchDeactivateWhen });
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
  AGAINST_VIEWPORT,
  EDGE_TOP,
  EDGE_CENTER,
  EDGE_BOTTOM,
  LATCH_DEACTIVATE_FULLY_HIDDEN,
  LATCH_DEACTIVATE_OUT_OF_ROOT,
};
