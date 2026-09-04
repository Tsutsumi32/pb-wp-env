/************************************************************
 * GSAP関連汎用処理
 ************************************************************/
import { BREAKPOINTS, STATE_CLASSES } from '../constans/global.js';

// ---------------------------------------------------------------------------
// data 属性（参照するものは定数で一覧化）
// ---------------------------------------------------------------------------
// ScrollSmoother
/** ScrollSmoother のルート要素 */
const ATTR_SMOOTH_ROOT = 'data-gsap-smooth-root';
/** ScrollSmoother の wrapper 要素 */
const ATTR_SMOOTH_WRAPPER = 'data-gsap-smooth-wrapper';
/** ScrollSmoother の content 要素 */
const ATTR_SMOOTH_CONTENT = 'data-gsap-smooth-content';
/** ScrollSmoother の適用スコープ（例: page） */
const ATTR_SMOOTH_SCOPE = 'data-gsap-smooth-scope';

const SELECTOR_SMOOTH_ROOT = `[${ATTR_SMOOTH_ROOT}]`;
const SELECTOR_SMOOTH_WRAPPER = `[${ATTR_SMOOTH_WRAPPER}]`;
const SELECTOR_SMOOTH_CONTENT = `[${ATTR_SMOOTH_CONTENT}]`;

// 横スクロール連動
/** ScrollTrigger の trigger */
const ATTR_HSCROLL_TRIGGER = 'data-gsap-hscroll-trigger';
/** pin 対象 */
const ATTR_HSCROLL_PIN = 'data-gsap-hscroll-pin';
/** translateX で動かす横並びコンテナ */
const ATTR_HSCROLL_TARGET = 'data-gsap-hscroll-target';
/** 横並びセクション（2件以上） */
const ATTR_HSCROLL_SECTION = 'data-gsap-hscroll-section';

const SELECTOR_HSCROLL_TRIGGER = `[${ATTR_HSCROLL_TRIGGER}]`;
const SELECTOR_HSCROLL_PIN = `[${ATTR_HSCROLL_PIN}]`;
const SELECTOR_HSCROLL_TARGET = `[${ATTR_HSCROLL_TARGET}]`;
const SELECTOR_HSCROLL_SECTION = `[${ATTR_HSCROLL_SECTION}]`;

// カード重なり
/** 重ね枠（位置はページ SCSS） */
const ATTR_CARD_STACK_FRAME = 'data-gsap-card-stack-frame';
/** 重ねるカード */
const ATTR_CARD_STACK_ITEM = 'data-gsap-card-stack-item';

// DOM 移動
/** 移動元ラッパー（位置・サイズは CSS で制御） */
const ATTR_DOM_MOVE_ORIGIN = 'data-gsap-dom-move-origin';
/** 移動するノード */
const ATTR_DOM_MOVE_NODE = 'data-gsap-dom-move-node';
/** 移動先ラッパー（位置・サイズは CSS で制御） */
const ATTR_DOM_MOVE_TARGET = 'data-gsap-dom-move-target';
/** 移動トリガーボタン */
const ATTR_DOM_MOVE_TRIGGER = 'data-gsap-dom-move-trigger';
/** 移動先（origin / target のいずれか） */
const ATTR_DOM_MOVE_TO = 'data-gsap-dom-move-to';
/** 移動速度 */
const ATTR_DOM_MOVE_SPEED = 'data-gsap-dom-move-speed';

const SELECTOR_DOM_MOVE_ORIGIN = `[${ATTR_DOM_MOVE_ORIGIN}]`;
const SELECTOR_DOM_MOVE_NODE = `[${ATTR_DOM_MOVE_NODE}]`;
const SELECTOR_DOM_MOVE_TARGET = `[${ATTR_DOM_MOVE_TARGET}]`;
const SELECTOR_DOM_MOVE_TRIGGER = `[${ATTR_DOM_MOVE_TRIGGER}]`;

/************************************************************
 * Viewport スコープ（PC / SP / 両方）
 ************************************************************/
/** @typedef {'pc' | 'sp' | 'both'} GsapViewportScope */

export const GSAP_VIEWPORT = Object.freeze({
  PC: 'pc',
  SP: 'sp',
  BOTH: 'both',
});

/** @type {Set<() => void>} */
const gsapViewportRefreshCallbacks = new Set();

const isSpViewport = () => window.innerWidth < BREAKPOINTS.SP;

/************************************************************
 * ScrollSmoother
 ************************************************************/
/**
 * @typedef {object} GsapSmoothConfig
 * @property {GsapViewportScope} [viewport='both']
 * @property {string} [rootSelector]
 * @property {number} [smooth]
 * @property {number} [smoothTouch]
 * @property {boolean} [effects]
 * @property {boolean} [normalizeScroll]
 */

const DEFAULT_SMOOTH_CONFIG = {
  rootSelector: SELECTOR_SMOOTH_ROOT,
  smooth: 1.2,
  smoothTouch: 0.1,
  effects: true,
  normalizeScroll: true,
};

/**
 * ScrollSmoother 用の対象要素を解決
 * @param {string} rootSelector
 * @returns {{ smoothRoot: Element, smoothWrapper: Element, smoothContent: Element, smoothScope: string } | null}
 */
export const resolveSmoothElements = (rootSelector = DEFAULT_SMOOTH_CONFIG.rootSelector) => {
  const smoothRoot = document.querySelector(rootSelector);
  if (!smoothRoot) return null;

  const smoothWrapper = smoothRoot.querySelector(SELECTOR_SMOOTH_WRAPPER);
  const smoothContent = smoothRoot.querySelector(SELECTOR_SMOOTH_CONTENT);

  if (!smoothWrapper || !smoothContent) return null;

  return {
    smoothRoot,
    smoothWrapper,
    smoothContent,
    smoothScope: smoothRoot.getAttribute(ATTR_SMOOTH_SCOPE) || 'page',
  };
};

/**
 * ScrollSmoother を初期化
 * @param {GsapSmoothConfig} [option={}]
 * @returns {{ refresh: () => void, kill: () => void } | undefined}
 */
export const initGsapScrollSmoother = (option = {}) => {
  const ScrollSmoother = window.ScrollSmoother;
  const { viewport = GSAP_VIEWPORT.BOTH, ...smoothOption } = option;
  const config = { ...DEFAULT_SMOOTH_CONFIG, ...smoothOption };
  const smoothElements = resolveSmoothElements(config.rootSelector);

  if (!ScrollSmoother || !smoothElements) {
    return undefined;
  }

  return createGsapViewportScopedFeature({
    viewport,
    styleTargets: [smoothElements.smoothRoot, smoothElements.smoothWrapper],
    create: () =>
      ScrollSmoother.create({
        wrapper: smoothElements.smoothWrapper,
        content: smoothElements.smoothContent,
        smooth: config.smooth,
        smoothTouch: config.smoothTouch,
        effects: config.effects,
        normalizeScroll: config.normalizeScroll,
      }),
  });
};

/************************************************************
 * ScrollTrigger
 ************************************************************/
let scrollTriggerResizeTimerId = null;
let isScrollTriggerResizeBound = false;

/**
 * ScrollTrigger の計測を再実行
 * @returns {void}
 */
export const refreshScrollTrigger = () => {
  window.ScrollTrigger?.refresh();
};

/**
 * リサイズ時の ScrollTrigger.refresh を debounce で1本化
 * @param {object} [option]
 * @param {number} [option.delay=200]
 * @param {() => void} [option.onBeforeRefresh] refresh 直前に実行する処理
 * @returns {void}
 */
export const bindScrollTriggerResizeRefresh = (option = {}) => {
  const { delay = 200, onBeforeRefresh } = option;

  if (isScrollTriggerResizeBound) return;
  isScrollTriggerResizeBound = true;

  window.addEventListener('resize', () => {
    clearTimeout(scrollTriggerResizeTimerId);
    scrollTriggerResizeTimerId = window.setTimeout(() => {
      gsapViewportRefreshCallbacks.forEach((callback) => callback());
      onBeforeRefresh?.();
      refreshScrollTrigger();
    }, delay);
  });
};

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * viewport スコープが現在有効か
 * @param {GsapViewportScope} [scope='both']
 * @returns {boolean}
 */
export const isGsapViewportScopeActive = (scope = GSAP_VIEWPORT.BOTH) => {
  if (scope === GSAP_VIEWPORT.BOTH) return true;
  if (scope === GSAP_VIEWPORT.PC) return !isSpViewport();
  if (scope === GSAP_VIEWPORT.SP) return isSpViewport();
  return true;
};

/**
 * GSAP 契約クラス要素の is_active を一括切替
 * @param {Element | Element[] | (() => Element[])} elements
 * @param {boolean} active
 */
export const setGsapContractActive = (elements, active) => {
  const resolved = typeof elements === 'function' ? elements() : elements;
  const list = (Array.isArray(resolved) ? resolved : [resolved]).filter(Boolean);

  list.forEach((el) => {
    el.classList.toggle(STATE_CLASSES.ACTIVE, active);
  });
};

/**
 * viewport に応じて GSAP 機能のスタイル（is_active）とインスタンスを切替
 *
 * @param {object} params
 * @param {GsapViewportScope} [params.viewport='both']
 * @param {Element | Element[] | (() => Element[])} params.styleTargets
 * @param {() => unknown} params.create
 * @param {() => void} [params.onDestroy]
 * @returns {{ refresh: () => void, kill: () => void }}
 */
export const createGsapViewportScopedFeature = ({
  viewport = GSAP_VIEWPORT.BOTH,
  styleTargets,
  create,
  onDestroy,
}) => {
  let instance = null;

  const resolveStyleTargets = () => {
    const targets = typeof styleTargets === 'function' ? styleTargets() : styleTargets;
    return (Array.isArray(targets) ? targets : [targets]).filter(Boolean);
  };

  const killInstance = () => {
    if (!instance) return;

    if (instance.scrollTrigger) {
      instance.scrollTrigger.kill();
    }
    if (typeof instance.kill === 'function') {
      instance.kill();
    }
    if (typeof instance.destroy === 'function') {
      instance.destroy();
    }

    onDestroy?.();
    instance = null;
  };

  const refresh = () => {
    killInstance();
    setGsapContractActive(resolveStyleTargets(), false);

    if (prefersReducedMotion() || !isGsapViewportScopeActive(viewport)) {
      return;
    }

    setGsapContractActive(resolveStyleTargets(), true);
    instance = create();
  };

  const kill = () => {
    killInstance();
    setGsapContractActive(resolveStyleTargets(), false);
    gsapViewportRefreshCallbacks.delete(refresh);
  };

  const isFirstViewportFeature = gsapViewportRefreshCallbacks.size === 0;
  gsapViewportRefreshCallbacks.add(refresh);

  if (isFirstViewportFeature) {
    bindScrollTriggerResizeRefresh();
  }

  refresh();

  return { refresh, kill };
};

/************************************************************
 * レスポンシブ値（PC / SP）
 ************************************************************/
/** @typedef {number | false} GsapHoldDuration */

/**
 * PC / SP で切り替える値
 * - sp:  viewport < BREAKPOINTS.SP（768）
 * - pc:  viewport >= BREAKPOINTS.SP（768）。省略時は sp と同値
 * @typedef {{ sp?: GsapHoldDuration | number, pc?: GsapHoldDuration | number }} GsapResponsiveValue
 */

/**
 * PC / SP 向けの値を現在の viewport に合わせて解決する
 * - number | false はそのまま返す
 * - { sp, pc } は viewport に応じて sp または pc を返す
 *
 * @template {GsapHoldDuration | number} T
 * @param {T | GsapResponsiveValue} value
 * @returns {T}
 *
 * @example
 * resolveGsapResponsiveValue(500)
 * resolveGsapResponsiveValue({ sp: 300, pc: 500 })
 * resolveGsapResponsiveValue({ sp: false, pc: 600 })
 */
export const resolveGsapResponsiveValue = (value) => {
  if (value === null || value === undefined || typeof value !== 'object') {
    return value;
  }

  const { sp, pc = sp } = value;
  return isSpViewport() ? sp : pc;
};

/************************************************************
 * 横スクロール（Section HScroll）
 ************************************************************/

/**
 * @typedef {object} GsapSectionHScrollEnterContext
 * @property {import('gsap').core.Timeline} tl
 * @property {Element} section
 * @property {number} index
 * @property {Element[]} sections
 * @property {Element} target
 * @property {Element} root
 */

/**
 * @typedef {object} GsapSectionHScrollOptions
 * @property {GsapViewportScope} [viewport='both']
 * @property {GsapHoldDuration | GsapResponsiveValue} [introScroll=600] 各セクション移動前の待機（false / 0 で無効）
 * @property {GsapHoldDuration | GsapResponsiveValue} [outroScroll=600] 最終セクション表示後の待機（false / 0 で無効）
 * @property {number | GsapResponsiveValue} [moveScroll=1] 横移動1区間あたりの縦スクロール量倍率（タイムライン duration に乗算）
 * @property {string | GsapResponsiveValue} [moveEase='none'] 横移動1区間の ease（scrub 時も区間内の加減速に効く）
 * @property {(ctx: GsapSectionHScrollEnterContext) => string | GsapResponsiveValue | void} [getMoveEase]
 *   セクション単位の moveEase。未指定時は moveEase を使用
 * @property {(ctx: GsapSectionHScrollEnterContext) => GsapHoldDuration | GsapResponsiveValue | void} [getIntroScroll]
 *   セクション単位の移動前待機。未指定時は introScroll を使用
 * @property {(ctx: GsapSectionHScrollEnterContext) => void} [onEnterSection]
 *   横移動後に呼ばれるコールバック（ページ固有の追加アニメ用）
 */

const DEFAULT_HSCROLL_HOLD = 600;

/**
 * 待機 duration を解決（false / 0 は待機なし）
 * @param {GsapHoldDuration | void} value
 * @param {number} defaultValue
 * @returns {number}
 */
const resolveHoldDuration = (value, defaultValue) => {
  const resolved = resolveGsapResponsiveValue(value);

  if (resolved === false || resolved === 0) return 0;
  if (resolved === undefined) return defaultValue;
  if (typeof resolved === 'number' && resolved > 0) return resolved;
  return 0;
};

/**
 * セクション移動前の待機 duration を解決
 * @param {GsapSectionHScrollOptions} option
 * @param {GsapSectionHScrollEnterContext} ctx
 * @returns {number}
 */
const resolveSectionIntroHold = (option, ctx) => {
  const { introScroll, getIntroScroll } = option;

  if (typeof getIntroScroll === 'function') {
    const custom = getIntroScroll(ctx);
    if (custom !== undefined) {
      return resolveHoldDuration(custom, DEFAULT_HSCROLL_HOLD);
    }
  }

  return resolveHoldDuration(introScroll, DEFAULT_HSCROLL_HOLD);
};

/**
 * 横移動1区間のタイムライン duration（= 縦スクロール量）を解決
 * @param {number} distance セクション間の offsetLeft 差分
 * @param {GsapSectionHScrollOptions} [option={}]
 * @returns {number}
 */
export const resolveGsapSectionHScrollMoveDuration = (distance, option = {}) => {
  const scale = resolveGsapResponsiveValue(option.moveScroll ?? 1);
  const multiplier = typeof scale === 'number' && scale > 0 ? scale : 1;
  return distance * multiplier;
};

/**
 * 横移動1区間の ease を解決
 * @param {GsapSectionHScrollOptions} [option={}]
 * @param {GsapSectionHScrollEnterContext} [ctx]
 * @returns {string}
 */
export const resolveGsapSectionHScrollMoveEase = (option = {}, ctx) => {
  if (ctx && typeof option.getMoveEase === 'function') {
    const custom = option.getMoveEase(ctx);
    if (custom !== undefined) {
      if (typeof custom === 'string') return custom;
      const resolved = resolveGsapResponsiveValue(custom);
      if (typeof resolved === 'string') return resolved;
    }
  }

  const ease = option.moveEase ?? 'none';
  if (typeof ease === 'string') return ease;
  const resolved = resolveGsapResponsiveValue(ease);
  return typeof resolved === 'string' ? resolved : 'none';
};

/**
 * 横並びセクションを縦スクロールに連動して横移動させるタイムラインを組み立てる
 *
 * root 配下に以下が必要:
 * - `[data-gsap-hscroll-trigger]` … ScrollTrigger の trigger
 * - `[data-gsap-hscroll-pin]` … pin 対象
 * - `[data-gsap-hscroll-target]` … translateX で動かす横並びコンテナ
 * - `[data-gsap-hscroll-section]` … 2件以上
 *
 * @param {Element} root
 * @param {GsapSectionHScrollOptions} [option={}]
 * @returns {{ refresh: () => void, kill: () => void } | null}
 */
export const createGsapSectionHScroll = (root, option = {}) => {
  const gsap = window.gsap;
  const { viewport = GSAP_VIEWPORT.BOTH, onEnterSection, ...hscrollOption } = option;

  if (!gsap) return null;

  const hScrollTrigger = root.querySelector(SELECTOR_HSCROLL_TRIGGER);
  const hScrollPin = root.querySelector(SELECTOR_HSCROLL_PIN);
  const hScrollTarget = root.querySelector(SELECTOR_HSCROLL_TARGET);
  const hScrollSection = root.querySelectorAll(SELECTOR_HSCROLL_SECTION);

  if (!hScrollTrigger || !hScrollPin || !hScrollTarget || hScrollSection.length <= 1) {
    return null;
  }

  const sections = gsap.utils.toArray(hScrollSection);

  /** @param {Element} section */
  const getMoveTo = (section) => -section.offsetLeft;

  return createGsapViewportScopedFeature({
    viewport,
    styleTargets: [hScrollTrigger, hScrollPin, hScrollTarget, ...sections],
    onDestroy: () => {
      gsap.set(hScrollTarget, { x: 0, clearProps: 'x' });
    },
    create: () => {
      /** @type {import('gsap').core.Timeline} */
      let hScrollTl;

      hScrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: hScrollTrigger,
          pin: hScrollPin,
          start: 'top top',
          end: () => `+=${hScrollTl.duration()}`,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      sections.forEach((section, i) => {
        if (i === 0) return;

        const enterCtx = {
          tl: hScrollTl,
          section,
          index: i,
          sections,
          target: hScrollTarget,
          root,
        };

        hScrollTl.to(
          {},
          {
            duration: () => resolveSectionIntroHold(hscrollOption, enterCtx),
          }
        );

        hScrollTl.to(hScrollTarget, {
          x: () => getMoveTo(section),
          ease: resolveGsapSectionHScrollMoveEase(hscrollOption, enterCtx),
          duration: () => {
            const prevSection = sections[i - 1];
            const distance = section.offsetLeft - prevSection.offsetLeft;
            return resolveGsapSectionHScrollMoveDuration(distance, hscrollOption);
          },
        });

        if (typeof onEnterSection === 'function') {
          onEnterSection(enterCtx);
        }
      });

      hScrollTl.to(
        {},
        {
          duration: () => resolveHoldDuration(hscrollOption.outroScroll, DEFAULT_HSCROLL_HOLD),
        }
      );

      return hScrollTl;
    },
  });
};

/**
 * 横スクロール全体の progress（0〜1）を、指定セクション区間の progress（0〜1）に変換
 *
 * @param {object} params
 * @param {Element} params.horizontalRoot 横スクロールコンテナ
 * @param {number} params.scrollProgress ScrollTrigger の self.progress
 * @param {number} [params.fromIndex=1] 開始セクション index（0始まり）
 * @param {number} [params.toIndex=2] 終了セクション index（0始まり）
 * @param {string} [params.sectionSelector='[data-gsap-hscroll-section]'] セクション要素のセレクタ
 * @returns {number}
 */
export const getGsapHScrollSectionProgress = ({
  horizontalRoot,
  scrollProgress,
  fromIndex = 1,
  toIndex = 2,
  sectionSelector = SELECTOR_HSCROLL_SECTION,
}) => {
  const gsap = window.gsap;
  if (!gsap || !horizontalRoot) return 0;

  const sections = gsap.utils.toArray(horizontalRoot.querySelectorAll(sectionSelector));
  const maxScroll = horizontalRoot.scrollWidth - window.innerWidth;
  const safeFromIndex = Math.max(0, fromIndex);
  const safeToIndex = Math.max(safeFromIndex, toIndex);
  const fromSection = sections[safeFromIndex];
  const toSection = sections[safeToIndex];

  if (!fromSection || !toSection || maxScroll <= 0) {
    return gsap.utils.clamp(0, 1, scrollProgress);
  }

  const start = fromSection.offsetLeft / maxScroll;
  const end = toSection.offsetLeft / maxScroll;
  const clamped = gsap.utils.clamp(start, end, scrollProgress);
  return gsap.utils.mapRange(start, end, 0, 1, clamped);
};

/************************************************************
 * CardStack（カード重なり）
 ************************************************************/
/** カード重なり: 重ね枠（位置はページ SCSS） */
export const GSAP_CARD_STACK_FRAME_SELECTOR = `[${ATTR_CARD_STACK_FRAME}]`;

/** カード重なり: 重ねるカード */
export const GSAP_CARD_STACK_ITEM_SELECTOR = `[${ATTR_CARD_STACK_ITEM}]`;

/**
 * @typedef {object} GsapCardStackCardContext
 * @property {number} index 登場するカードのインデックス（1 始まりのループ index）
 * @property {Element} item 登場するカード要素
 * @property {Element} prevItem 1枚前のカード要素
 * @property {Element[]} items カード要素の配列
 * @property {Element} scope 検索起点となった要素
 * @property {Element | null} frame 重ね枠（位置は CSS で制御）
 */

/**
 * @typedef {object} GsapCardStackOptions
 * @property {GsapViewportScope} [viewport='both']
 * @property {import('gsap').core.Timeline} [timeline] 指定時はこのタイムラインへ挿入
 * @property {string} [frameSelector] 重ね枠（位置は CSS 側）
 * @property {string} [itemSelector] 重ねるカード要素
 * @property {string | number} [hiddenY='100vh'] 2枚目以降の初期 y
 * @property {number | GsapResponsiveValue} [cardScroll] 1枚分の基準スクロール量（px）。未指定時は window.innerHeight
 * @property {number | GsapResponsiveValue} [moveScroll=1] 基準に対する倍率（横スクロールの moveScroll と同義）
 * @property {GsapHoldDuration | GsapResponsiveValue} [cardHoldRatio=0] 待機 = cardScroll × ratio（false / 0 で無効）
 * @property {(ctx: GsapCardStackCardContext) => GsapHoldDuration | GsapResponsiveValue | void} [getCardHold]
 *   カード単位の待機比率。未指定時は cardHoldRatio
 * @property {number | GsapResponsiveValue} [enterRatio=1] 登場（y → 0）= cardScroll × ratio
 * @property {number | GsapResponsiveValue} [scaleRatio] 前カード scale = cardScroll × ratio（未指定時は enterRatio）
 * @property {number | false | GsapResponsiveValue} [prevScale=0.92] 前カードの scale（false で無効）
 * @property {boolean} [includeFirstCard=false] true で1枚目も hidden から登場（初期は非表示）
 * @property {string} [firstCardEnterPosition='<'] timeline 指定時、1枚目 enter の開始位置（横移動と同時は '<'）
 * @property {number | (() => number)} [firstCardEnterDuration] 1枚目 enter のスクロール量（未指定時は cardScroll × enterRatio × moveScroll）
 * @property {boolean} [skipFirstCardHold=true] includeFirstCard 時、1枚目の登場前待機を省略
 * @property {string | GsapResponsiveValue} [ease='none'] 登場（y）・前カード scale 共通の ease
 * @property {(ctx: GsapCardStackCardContext) => string | GsapResponsiveValue | void} [getCardEase]
 *   カード単位の ease。未指定時は ease を使用
 */

/**
 * カードスタック1枚分の基準スクロール量（px）を解決
 * @param {GsapCardStackOptions} [option={}]
 * @returns {number}
 */
export const resolveGsapCardStackBaseScroll = (option = {}) => {
  const { cardScroll } = option;
  if (cardScroll !== undefined) {
    return resolveGsapResponsiveValue(cardScroll);
  }
  return window.innerHeight;
};

/**
 * 基準スクロール量に moveScroll 倍率を適用（横スクロールの resolveGsapSectionHScrollMoveDuration と同じ考え方）
 * @param {number} amount
 * @param {GsapCardStackOptions} [option={}]
 * @returns {number}
 */
export const resolveGsapCardStackMoveDuration = (amount, option = {}) => {
  const scale = resolveGsapResponsiveValue(option.moveScroll ?? 1);
  const multiplier = typeof scale === 'number' && scale > 0 ? scale : 1;
  return amount * multiplier;
};

/**
 * cardScroll × ratio × moveScroll を解決
 * @param {GsapCardStackOptions} option
 * @param {number} ratio
 * @returns {number}
 */
const resolveCardStackSegmentScroll = (option, ratio) => {
  const safeRatio = typeof ratio === 'number' && ratio > 0 ? ratio : 0;
  if (safeRatio <= 0) return 0;
  return resolveGsapCardStackMoveDuration(
    resolveGsapCardStackBaseScroll(option) * safeRatio,
    option
  );
};

/**
 * カード単位の待機スクロール量を解決
 * @param {GsapCardStackOptions} option
 * @param {GsapCardStackCardContext} ctx
 * @returns {number}
 */
const resolveCardStackHoldScroll = (option, ctx) => {
  if (option.includeFirstCard && ctx.index === 0 && option.skipFirstCardHold !== false) {
    return 0;
  }

  const { cardHoldRatio = 0, getCardHold } = option;

  if (typeof getCardHold === 'function') {
    const custom = getCardHold(ctx);
    if (custom !== undefined) {
      const holdRatio = resolveHoldDuration(custom, 0);
      return resolveCardStackSegmentScroll(option, holdRatio);
    }
  }

  const holdRatio = resolveHoldDuration(cardHoldRatio, 0);
  return resolveCardStackSegmentScroll(option, holdRatio);
};

/**
 * カード登場スクロール量を解決
 * @param {GsapCardStackOptions} option
 * @param {GsapCardStackCardContext} ctx
 * @returns {number | (() => number)}
 */
const resolveCardStackEnterScroll = (option, ctx) => {
  if (ctx.index === 0 && option.firstCardEnterDuration !== undefined) {
    const { firstCardEnterDuration } = option;
    if (typeof firstCardEnterDuration === 'function') {
      return firstCardEnterDuration;
    }
    return resolveGsapCardStackMoveDuration(
      resolveGsapResponsiveValue(firstCardEnterDuration),
      option
    );
  }

  const enterRatio = resolveGsapResponsiveValue(option.enterRatio ?? 1);
  return resolveCardStackSegmentScroll(option, enterRatio);
};

/**
 * 前カード scale のスクロール量を解決
 * @param {GsapCardStackOptions} option
 * @param {GsapCardStackCardContext} ctx
 * @returns {number}
 */
const resolveCardStackScaleScroll = (option, _ctx) => {
  const scaleRatio = option.scaleRatio ?? option.enterRatio ?? 1;
  return resolveCardStackSegmentScroll(option, resolveGsapResponsiveValue(scaleRatio));
};

/**
 * カードスタックの ease を解決（GSAP には文字列を渡す）
 * @param {GsapCardStackOptions} option
 * @param {GsapCardStackCardContext} ctx
 * @returns {string}
 */
export const resolveGsapCardStackEase = (option, ctx) => {
  if (typeof option.getCardEase === 'function') {
    const custom = option.getCardEase(ctx);
    if (custom !== undefined) {
      if (typeof custom === 'string') return custom;
      const resolved = resolveGsapResponsiveValue(custom);
      if (typeof resolved === 'string') return resolved;
    }
  }

  const ease = option.ease ?? 'none';
  if (typeof ease === 'string') return ease;
  const resolved = resolveGsapResponsiveValue(ease);
  return typeof resolved === 'string' ? resolved : 'none';
};

/**
 * タイムラインにカード重なりアニメーションを追加する
 * - 枠の位置・サイズは `[data-gsap-card-stack-frame]` の CSS に任せる
 * - 本処理は y 移動・（任意）scale のみ
 *
 * @param {Element} scope 重ね枠またはその親要素
 * @param {GsapCardStackOptions} [option={}]
 * @returns {import('gsap').core.Timeline | { refresh: () => void, kill: () => void } | null}
 */
export const createGsapCardStack = (scope, option = {}) => {
  const gsap = window.gsap;
  if (!gsap || !scope) return null;

  const {
    viewport = GSAP_VIEWPORT.BOTH,
    timeline,
    frameSelector = GSAP_CARD_STACK_FRAME_SELECTOR,
    itemSelector = GSAP_CARD_STACK_ITEM_SELECTOR,
    hiddenY = '100vh',
    includeFirstCard = false,
    firstCardEnterPosition = '<',
    prevScale = 0.92,
    ...cardOption
  } = option;

  const frame = scope.matches?.(frameSelector) ? scope : scope.querySelector(frameSelector);
  const container = frame || scope;
  const items = gsap.utils.toArray(container.querySelectorAll(itemSelector));

  if (items.length <= 1) return null;

  const buildCardStackTimeline = (parentTimeline) => {
    const tl = parentTimeline || gsap.timeline();

    gsap.set(items, {
      y: hiddenY,
      scale: 1,
      opacity: 1,
    });

    if (!includeFirstCard) {
      gsap.set(items[0], { y: 0 });
    }

    items.forEach((item, index) => {
      if (!includeFirstCard && index === 0) return;

      const cardCtx = {
        index,
        item,
        prevItem: items[index - 1],
        items,
        scope,
        frame,
      };

      if (resolveCardStackHoldScroll(cardOption, cardCtx) > 0) {
        tl.to(
          {},
          {
            duration: () => resolveCardStackHoldScroll(cardOption, cardCtx),
          }
        );
      }

      const enterPosition =
        includeFirstCard && index === 0 && parentTimeline ? firstCardEnterPosition : undefined;

      const cardEase = resolveGsapCardStackEase(cardOption, cardCtx);

      tl.to(
        item,
        {
          y: 0,
          ease: cardEase,
          duration: () => {
            const scroll = resolveCardStackEnterScroll(cardOption, cardCtx);
            return typeof scroll === 'function' ? scroll() : scroll;
          },
        },
        enterPosition
      );

      const resolvedPrevScale = () => resolveGsapResponsiveValue(prevScale);
      if (prevScale !== false && index > 0) {
        tl.to(
          items[index - 1],
          {
            scale: () => (resolvedPrevScale() === false ? 1 : resolvedPrevScale()),
            ease: cardEase,
            duration: () => resolveCardStackScaleScroll(cardOption, cardCtx),
          },
          '<'
        );
      }
    });

    return tl;
  };

  const resetCardStackStyles = () => {
    gsap.set(items, { clearProps: 'transform,y,scale,opacity' });
  };

  if (timeline) {
    if (prefersReducedMotion() || !isGsapViewportScopeActive(viewport)) {
      setGsapContractActive(items, false);
      resetCardStackStyles();
      return null;
    }

    setGsapContractActive(items, true);
    return buildCardStackTimeline(timeline);
  }

  return createGsapViewportScopedFeature({
    viewport,
    styleTargets: items,
    onDestroy: resetCardStackStyles,
    create: () => buildCardStackTimeline(),
  });
};

/************************************************************
 * DomMove（DOM移動）
 ************************************************************/
export const GSAP_DOM_MOVE_SELECTORS = {
  origin: SELECTOR_DOM_MOVE_ORIGIN,
  node: SELECTOR_DOM_MOVE_NODE,
  target: SELECTOR_DOM_MOVE_TARGET,
  button: SELECTOR_DOM_MOVE_TRIGGER,
};

/**
 * DOM移動コントローラを生成
 *
 * 使い方（HTML）
 * - root:   任意のルート要素（呼び出し側で指定）
 * - origin: [data-gsap-dom-move-origin] ※位置・サイズはこのラッパーで制御
 * - node:   [data-gsap-dom-move-node]
 * - target: [data-gsap-dom-move-target] ※位置・サイズはこのラッパーで制御
 *
 * 使い方（JS）
 * - setProgress(0~1) でスクロール追従
 * - animateToProgress(toRatio, speed) でボタン移動
 * - bindButtons() で data 属性ボタンを自動バインド
 *
 * @param {Element} root
 * @param {object} [option]
 * @param {GsapViewportScope} [option.viewport='both']
 * @param {string} [option.originSelector]
 * @param {string} [option.targetSelector]
 * @param {string} [option.buttonSelector]
 * @returns {object | null}
 */
export const createGsapDomMoveController = (root, option = {}) => {
  const gsap = window.gsap;
  const Flip = window.Flip;
  if (!gsap || !Flip || typeof Flip.getState !== 'function' || !root) return null;

  const {
    viewport = GSAP_VIEWPORT.BOTH,
    originSelector = GSAP_DOM_MOVE_SELECTORS.origin,
    targetSelector = GSAP_DOM_MOVE_SELECTORS.target,
    buttonSelector = GSAP_DOM_MOVE_SELECTORS.button,
  } = option;

  const origin = root.querySelector(originSelector);
  const node = origin?.querySelector(GSAP_DOM_MOVE_SELECTORS.node);
  const target = root.querySelector(targetSelector);
  if (!origin || !node || !target) return null;

  /** @type {ReturnType<typeof buildGsapDomMoveController> | null} */
  let controller = null;

  const buildGsapDomMoveController = () => {
    let flipTween = null;
    let moveTween = null;
    let currentRatio = 0;

    const FLIP_CLEAR_PROPS =
      'transform,top,left,right,bottom,width,height,maxWidth,maxHeight,position,zIndex,margin,opacity,objectFit,rotate,scale,x,y';

    /** Flip 由来のインラインスタイルを除去（Safari で初期表示が崩れるのを防ぐ） */
    const clearFlipArtifacts = () => {
      if (typeof Flip.killFlipsOf === 'function') {
        Flip.killFlipsOf(node);
      }
      gsap.set(node, { clearProps: FLIP_CLEAR_PROPS });
    };

    const normalizeNodeStyle = () => {
      gsap.set(node, {
        width: '100%',
        height: '100%',
        margin: 0,
        position: 'relative',
      });
    };

    const placeAtOrigin = () => {
      if (node.parentElement !== origin) {
        origin.appendChild(node);
      }
      clearFlipArtifacts();
      normalizeNodeStyle();
    };

    const placeAtTarget = () => {
      if (node.parentElement !== target) {
        target.appendChild(node);
      }
      clearFlipArtifacts();
      normalizeNodeStyle();
    };

    /** 移動元に戻しレイアウトを再同期（画像読み込み後・resize 後に利用） */
    const reconcileAtOrigin = () => {
      moveTween?.kill();
      moveTween = null;
      flipTween?.kill();
      flipTween = null;
      placeAtOrigin();
      currentRatio = 0;
    };

    const buildFlipTween = () => {
      placeAtOrigin();
      const state = Flip.getState(node);
      target.appendChild(node);
      normalizeNodeStyle();

      flipTween = Flip.from(state, {
        duration: 1,
        ease: 'none',
        absolute: true,
        nested: true,
        prune: true,
        paused: true,
      });
    };

    const setProgress = (ratio) => {
      const clamped = gsap.utils.clamp(0, 1, ratio);

      if (clamped <= 0.001) {
        reconcileAtOrigin();
        return;
      }
      if (clamped >= 0.999) {
        flipTween?.kill();
        flipTween = null;
        placeAtTarget();
        currentRatio = 1;
        return;
      }

      if (!flipTween) buildFlipTween();
      if (!flipTween) return;

      flipTween.progress(clamped);
      currentRatio = clamped;
    };

    const getDurationBySpeed = (toRatio, speed) => {
      const fromRect = origin.getBoundingClientRect();
      const toRect = target.getBoundingClientRect();
      const distance = Math.hypot(toRect.left - fromRect.left, toRect.top - fromRect.top);
      const ratioDistance = Math.abs(toRatio - currentRatio);
      const moveDistance = Math.max(distance * ratioDistance, 1);
      return moveDistance / speed;
    };

    const animateToProgress = (toRatio, speed = 700) => {
      const safeSpeed = Math.max(Number(speed) || 0, 80);
      const tweenState = { ratio: currentRatio };
      const duration = getDurationBySpeed(toRatio, safeSpeed);

      moveTween?.kill();
      moveTween = gsap.to(tweenState, {
        ratio: gsap.utils.clamp(0, 1, toRatio),
        duration,
        ease: 'none',
        onUpdate: () => setProgress(tweenState.ratio),
        onComplete: () => setProgress(tweenState.ratio),
      });

      return moveTween;
    };

    const bindButtons = () => {
      root.querySelectorAll(buttonSelector).forEach((button) => {
        button.addEventListener('click', () => {
          const to = button.getAttribute(ATTR_DOM_MOVE_TO);
          const speed = button.getAttribute(ATTR_DOM_MOVE_SPEED);
          animateToProgress(to === 'origin' ? 0 : 1, speed || 700);
        });
      });
    };

    const refreshIfLayerActive = () => {
      if (currentRatio > 0.001 && currentRatio < 0.999) {
        flipTween?.kill();
        flipTween = null;
        setProgress(currentRatio);
      }
    };

    const isAnimating = () => Boolean(moveTween?.isActive());

    return {
      setProgress,
      animateToProgress,
      bindButtons,
      refreshIfLayerActive,
      reconcileAtOrigin,
      isAnimating,
    };
  };

  const scoped = createGsapViewportScopedFeature({
    viewport,
    styleTargets: [node],
    onDestroy: () => {
      controller?.reconcileAtOrigin?.();
      controller = null;
    },
    create: () => {
      controller = buildGsapDomMoveController();
      controller.bindButtons();
      return controller;
    },
  });

  return {
    ...scoped,
    setProgress: (...args) => controller?.setProgress(...args),
    animateToProgress: (...args) => controller?.animateToProgress(...args),
    bindButtons: () => controller?.bindButtons(),
    refreshIfLayerActive: () => controller?.refreshIfLayerActive(),
    reconcileAtOrigin: () => controller?.reconcileAtOrigin(),
    isAnimating: () => Boolean(controller?.isAnimating()),
  };
};
