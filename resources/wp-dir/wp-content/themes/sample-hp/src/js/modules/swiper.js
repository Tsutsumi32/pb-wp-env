/************************************************************
 * Swiper
 * - [data-module="swiper"] がスライダーコンテナ。[data-swiper-linear] でリニアモード
 * - ナビ・ページネーションは [data-swiper-parent] 内の [data-swiper-next]/[data-swiper-prev]/[data-swiper-pagination]
 *
 * 読み込みの違い:
 * - CDN の swiper-bundle.min.js … window.Swiper のみ。modules オプションは不要（省略する）
 * - npm のモジュラー版 … `registerLibrary` または init の options.swiper で
 *   Swiper と swiper/modules の各モジュールを渡す（未登録だと機能が動かない）
 *
 * オプション補助:
 * - swiperFluidPair / swiperFluidValue … 画面幅に比例する spaceBetween
 * - swiperCalcSlidesPerView … Figma 等から slidesPerView を算出
 * - cloneSlidesForLoop … 通常モードで loop 用 DOM クローン（任意）
 ************************************************************/
import { BREAKPOINTS, DATA_ATTR, STATE_CLASSES } from '../constans/global.js';
import { onViewportResizeSplit, onViewportWidthResize } from '../utils/viewportResize.js';

// ---------------------------------------------------------------------------
// CDN / npm 両対応: コンストラクタとモジュール参照の解決
// ---------------------------------------------------------------------------

/** @type {{ Swiper?: any, modules?: Record<string, any> } | null} */
let registeredLibrary = null;

/**
 * npm の `swiper`（モジュラー版）を使うとき、init より前に 1 回呼ぶ。
 * `Swiper` を省略した場合は `window.Swiper`（CDN bundle）と組み合わせる。
 * @param {{ Swiper?: any, modules?: { Navigation?: any, Pagination?: any, Autoplay?: any, EffectFade?: any } }} api
 * @example
 * import Swiper from 'swiper';
 * import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
 * swiper.registerLibrary({
 *   Swiper,
 *   modules: { Navigation, Pagination, Autoplay, EffectFade },
 * });
 */
export function registerLibrary(api) {
  registeredLibrary = api && typeof api === 'object' ? api : null;
}

/** init(options) の options.swiper を優先し、なければ registerLibrary の内容を使う */
function resolveLibrary(options) {
  return options?.swiper ?? registeredLibrary ?? null;
}

/** lib に Swiper が無いときは CDN の window.Swiper にフォールバック */
function getSwiperConstructor(lib) {
  return lib?.Swiper ?? (typeof window !== 'undefined' ? window.Swiper : undefined);
}

/**
 * モジュラー版では使う分だけ関数として解決できたものだけ modules に渡す。
 * bundle 版では modules が空 → Swiper に modules キーを渡さない（undefined を混ぜない）。
 */
function buildModulesOption(lib, kind, baseOptions, currentOpt) {
  const table = lib?.modules;
  if (!table || typeof table !== 'object') return {};

  const wantNormalFade = baseOptions.effect === 'fade' || currentOpt.effect === 'fade';
  const keys =
    kind === 'linear'
      ? ['Autoplay']
      : wantNormalFade
        ? ['Navigation', 'Pagination', 'Autoplay', 'EffectFade']
        : ['Navigation', 'Pagination', 'Autoplay'];
  const list = keys.map((k) => table[k]).filter((fn) => typeof fn === 'function');
  return list.length ? { modules: list } : {};
}

/** Swiper 初期化完了時にスライダー要素へ付与するクラス */
const CLASS_PLUGIN_READY = STATE_CLASSES.CLASS_PLUGIN_READY;

/**
 * Swiper の `on` に `init` で CLASS_PLUGIN_READY を付与し、既存の `on.init` があれば続けて呼ぶ
 * @param {HTMLElement} swiperEl
 * @param {Record<string, unknown>} existingOn
 */
/**
 * @param {HTMLElement} swiperEl
 * @param {Record<string, unknown>} [existingOn]
 * @param {{ deferAutoplay?: boolean }} [hooks]
 */
function mergeOnWithPluginReady(swiperEl, existingOn = {}, hooks = {}) {
  const { deferAutoplay = false } = hooks;
  return {
    ...existingOn,
    init(swiper) {
      swiperEl.classList.add(CLASS_PLUGIN_READY);
      if (deferAutoplay && swiper.autoplay) {
        swiper.autoplay.stop();
      }
      if (typeof existingOn.init === 'function') {
        existingOn.init(swiper);
      }
    },
  };
}

// ---------------------------------------------------------------------------
// data 属性（参照するものは定数で一覧化。DATA_ATTR は global.js）
// ---------------------------------------------------------------------------
const MODULE_SWIPER = 'swiper';
const ATTR_SWIPER_LINEAR = 'data-swiper-linear';
const ATTR_SWIPER_PARENT = 'data-swiper-parent';
const ATTR_SWIPER_NEXT = 'data-swiper-next';
const ATTR_SWIPER_PREV = 'data-swiper-prev';
const ATTR_SWIPER_PAGINATION = 'data-swiper-pagination';

const SELECTOR_ROOT = `[${DATA_ATTR.MODULE}="${MODULE_SWIPER}"]`;
const SELECTOR_SWIPER_PARENT = `[${ATTR_SWIPER_PARENT}]`;
const SELECTOR_SWIPER_NEXT = `[${ATTR_SWIPER_NEXT}]`;
const SELECTOR_SWIPER_PREV = `[${ATTR_SWIPER_PREV}]`;
const SELECTOR_SWIPER_PAGINATION = `[${ATTR_SWIPER_PAGINATION}]`;

const DATASET_KEY_ORIGINAL = 'original';

// ---------------------------------------------------------------------------
// オプション補助（spaceBetween の fluid 指定 / slidesPerView 算出）
// ---------------------------------------------------------------------------

/**
 * 指定 viewport 幅における px 値を基準に、現在幅へ比例換算する（CSS vw 相当）
 * @param {{ at: number, value: number }} pair
 * @param {number} [viewportWidth=window.innerWidth]
 * @returns {number}
 */
export function swiperFluidValue(pair, viewportWidth = window.innerWidth) {
  if (!pair || typeof pair.at !== 'number' || typeof pair.value !== 'number') {
    throw new Error('swiperFluidValue: { at, value } is required.');
  }
  if (pair.at <= 0) throw new Error('swiperFluidValue: "at" must be > 0.');
  return (viewportWidth / pair.at) * pair.value;
}

/**
 * spaceBetween 等に渡す fluid 指定オブジェクトを生成する
 * @param {number} at - 基準となる画面幅（px）
 * @param {number} value - 基準幅における px 値
 * @returns {{ at: number, value: number }}
 * @example swiperFluidPair(1440, 64) // 1440px 幅で 64px
 */
export function swiperFluidPair(at, value) {
  return { at, value };
}

/**
 * Figma 等のリスト表示幅・スライド幅・間隔から slidesPerView を算出する。
 * n 枚表示時の必要幅は n * slideWidth + (n - 1) * spaceBetween（余白は枚数 - 1）。
 * @param {{ listWidth: number, slideWidth: number, spaceBetween?: number }} params
 * @returns {number}
 */
export function swiperCalcSlidesPerView({ listWidth, slideWidth, spaceBetween = 0 }) {
  if (!listWidth || !slideWidth) {
    throw new Error('swiperCalcSlidesPerView: listWidth and slideWidth are required.');
  }
  const unit = slideWidth + spaceBetween;
  if (unit <= 0) throw new Error('swiperCalcSlidesPerView: slideWidth + spaceBetween must be > 0.');
  return Math.round(((listWidth + spaceBetween) / unit) * 100) / 100;
}

/**
 * 数値または fluid 指定を px 数値へ解決する
 * @param {number | { at: number, value: number } | undefined} option
 * @param {number} viewportWidth
 * @returns {number | undefined}
 */
function resolveFluidSpaceBetween(option, viewportWidth) {
  if (option === undefined || option === null) return undefined;
  if (typeof option === 'number') return option;
  if (typeof option === 'object' && 'at' in option && 'value' in option) {
    return swiperFluidValue(option, viewportWidth);
  }
  return option;
}

/**
 * loop 安定のため、概ね 2 列分以上になるまでスライドをクローンする
 * @param {HTMLElement} wrapper
 * @param {HTMLElement[]} originalSlides
 * @param {number} slidesPerView
 */
function appendSlidesForLoop(wrapper, originalSlides, slidesPerView) {
  if (typeof slidesPerView !== 'number' || originalSlides.length === 0) return;
  let totalSlides = originalSlides.length;
  const required = Math.ceil(slidesPerView) * 2;
  while (totalSlides < required) {
    originalSlides.forEach((orig) => {
      const clone = orig.cloneNode(true);
      clone.dataset[DATASET_KEY_ORIGINAL] = 'false';
      wrapper.appendChild(clone);
      totalSlides++;
    });
  }
}

/**
 * Swiper の breakpoints 用オブジェクトを組み立てる
 * - 768px 未満: sp
 * - 768px 以上〜1024px 未満: tab（省略時は pc と同値）
 * - 1024px 以上: pc
 * レイアウト判定（isSp / isPc）とは独立。TAB 領域も PC レイアウト寄りの運用を想定
 */
export function swiperBreakPoints({ sp, tab, pc = {}, ...customBreakpoints }) {
  if (!sp) throw new Error('swiperBreakPoints: "sp" is required.');
  const tabOptions = tab ?? pc;
  const breakpoints = {
    0: { ...sp },
    [BREAKPOINTS.SP]: { ...tabOptions },
    [BREAKPOINTS.TAB]: { ...pc },
  };
  Object.keys(customBreakpoints).forEach((key) => {
    const numKey = Number(key);
    if (!isNaN(numKey) && numKey > 0) breakpoints[numKey] = { ...customBreakpoints[key] };
  });
  return breakpoints;
}

/**
 * 通常モード: ナビ・ページネーションあり。breakpoints で幅ごとに slidesPerView 等を切り替え可能。
 * リサイズのたびに一度 destroy して作り直し、DOM を「元スライド」から組み直す（loop 用の複製と整合させるため）。
 */
function initNormalSlider(swiperEl, options = {}, lib = null) {
  const SwiperCtor = getSwiperConstructor(lib);
  if (!SwiperCtor) return;
  const classNames = {
    parent: SELECTOR_SWIPER_PARENT,
    slide: '.swiper-slide',
    wrapper: '.swiper-wrapper',
    next: SELECTOR_SWIPER_NEXT,
    prev: SELECTOR_SWIPER_PREV,
    pagination: SELECTOR_SWIPER_PAGINATION,
  };
  const { cloneSlidesForLoop = false, breakpoints = {}, ...swiperOptions } = options;

  const swiperParent = swiperEl.closest(classNames.parent);
  let swiperInstance = null;

  // 現在の viewport 幅に一致する最大の breakpoint キー（数値）に紐づく設定を返す
  const getCurrentBreakpointOption = () => {
    const width = window.innerWidth;
    const matched = Object.keys(breakpoints)
      .map(Number)
      .sort((a, b) => b - a)
      .find((bp) => width >= bp);
    return breakpoints[matched] || {};
  };

  const initSwiperInstance = () => {
    if (swiperInstance) {
      swiperEl.classList.remove(CLASS_PLUGIN_READY);
      swiperInstance.destroy(true, true);
      swiperInstance = null;
    }
    const viewportWidth = window.innerWidth;
    const currentOpt = getCurrentBreakpointOption();
    const slidesWrapper = swiperEl.querySelector(classNames.wrapper);
    const navNext = swiperParent?.querySelector(classNames.next);
    const navPrev = swiperParent?.querySelector(classNames.prev);
    const pagination = swiperParent?.querySelector(classNames.pagination);

    const isEnabled = currentOpt.enable !== false;
    if (!isEnabled) {
      swiperEl.classList.remove(CLASS_PLUGIN_READY);
      [navNext, navPrev, pagination].forEach((el) => el && (el.style.display = 'none'));
      return;
    }

    // data-original="true" のみを正として wrapper を組み直す（Swiper が付与した複製を捨てる）
    const originalSlides = Array.from(swiperEl.querySelectorAll(classNames.slide)).filter(
      (s) => s.dataset[DATASET_KEY_ORIGINAL] === 'true'
    );
    slidesWrapper.innerHTML = '';
    originalSlides.forEach((s) => slidesWrapper.appendChild(s));

    const slideCount = originalSlides.length;
    const slidesPerView = currentOpt.slidesPerView ?? swiperOptions.slidesPerView ?? 1;
    let { loop, ...baseOptions } = swiperOptions;
    const shouldShowControls =
      typeof slidesPerView === 'number' ? slideCount > slidesPerView : slideCount > 1;

    // 1 画面に収まる枚数なら操作 UI は隠し、loop も切る（スワイプの意味がないため）
    // 判定はオリジナル枚数ベース。cloneSlidesForLoop による複製はこの判定後に行う
    if (!shouldShowControls) {
      [navNext, navPrev, pagination].forEach((el) => el && (el.style.display = 'none'));
      loop = false;
      baseOptions.centeredSlides = false;
    } else {
      if (navNext) navNext.style.display = 'block';
      if (navPrev) navPrev.style.display = 'block';
      if (pagination) pagination.style.display = 'flex';

      if (cloneSlidesForLoop && loop && typeof slidesPerView === 'number') {
        appendSlidesForLoop(slidesWrapper, originalSlides, slidesPerView);
      }
    }

    const {
      on: onFromBase,
      spaceBetween: baseSpaceBetween,
      slidesOffsetAfter: baseSlidesOffsetAfter,
      slidesOffsetBefore: baseSlidesOffsetBefore,
      ...baseWithoutOn
    } = baseOptions;
    const {
      on: onFromCurrent,
      spaceBetween: currentSpaceBetween,
      slidesOffsetAfter: currentSlidesOffsetAfter,
      slidesOffsetBefore: currentSlidesOffsetBefore,
      ...currentWithoutOn
    } = currentOpt;
    const mergedOn = mergeOnWithPluginReady(swiperEl, {
      ...(onFromBase || {}),
      ...(onFromCurrent || {}),
    });
    const resolvedSpaceBetween =
      resolveFluidSpaceBetween(currentSpaceBetween ?? baseSpaceBetween, viewportWidth) ?? 0;
    const resolvedSlidesOffsetAfter = resolveFluidSpaceBetween(
      currentSlidesOffsetAfter ?? baseSlidesOffsetAfter,
      viewportWidth
    );
    const resolvedSlidesOffsetBefore = resolveFluidSpaceBetween(
      currentSlidesOffsetBefore ?? baseSlidesOffsetBefore,
      viewportWidth
    );

    swiperInstance = new SwiperCtor(swiperEl, {
      ...buildModulesOption(lib, 'normal', baseOptions, currentOpt),
      ...baseWithoutOn,
      ...currentWithoutOn,
      spaceBetween: resolvedSpaceBetween,
      ...(resolvedSlidesOffsetAfter != null
        ? { slidesOffsetAfter: resolvedSlidesOffsetAfter }
        : {}),
      ...(resolvedSlidesOffsetBefore != null
        ? { slidesOffsetBefore: resolvedSlidesOffsetBefore }
        : {}),
      loop,
      navigation: navNext && navPrev ? { nextEl: navNext, prevEl: navPrev } : false,
      pagination: pagination ? { el: pagination, clickable: true } : false,
      on: mergedOn,
    });
  };

  // 初回のみ: data-original 未設定のスライドはオリジナルとしてマーク（以降の組み直しの基準になる）
  swiperEl.querySelectorAll(classNames.slide).forEach((s) => {
    if (!s.dataset[DATASET_KEY_ORIGINAL]) s.dataset[DATASET_KEY_ORIGINAL] = 'true';
  });
  initSwiperInstance();

  // ブレークポイント変更（幅が変わったとき）のみ再初期化。高さだけの resize（SP アドレスバー等）は無視
  onViewportWidthResize(initSwiperInstance);
}

/**
 * リニア無限スクロール: autoplay delay 0 + 線形イージング。
 * slidesPerView が数値のときは、loop が安定するよう枚数が足りなければクローンを足す。
 */
function initLinearSlider(swiperEl, options = {}, lib = null) {
  const SwiperCtor = getSwiperConstructor(lib);
  if (!SwiperCtor) return;
  const {
    speed = 15000,
    allowTouchMove = false,
    spaceBetween = 0,
    slidesPerView = 'auto',
    breakpoints = {},
    /** Autoplay 拡張（例: `{ reverseDirection: true }`）。`delay` はリニア用に常に 0 で上書き */
    autoplay: autoplayExtra = {},
    /** true のとき wrapper の組み直しを省略（MV イントロ直後の DOM を維持） */
    preserveWrapper = false,
    /** true のとき init 時に autoplay を止め、呼び出し側で start する */
    deferAutoplay = false,
  } = options;
  const wrapper = swiperEl.querySelector('.swiper-wrapper');
  if (!wrapper) return;

  let swiperInstance = null;

  // 通常モードと同様、viewport に合う breakpoint のオプションを取得
  const getCurrentBreakpointOption = () => {
    const width = window.innerWidth;
    const matched = Object.keys(breakpoints)
      .map(Number)
      .sort((a, b) => b - a)
      .find((bp) => width >= bp);
    return breakpoints[matched] || {};
  };

  const initSwiperInstance = () => {
    if (swiperInstance) {
      swiperEl.classList.remove(CLASS_PLUGIN_READY);
      swiperInstance.destroy(true, true);
      swiperInstance = null;
    }
    const viewportWidth = window.innerWidth;
    const currentOpt = getCurrentBreakpointOption();
    const currentSlidesPerView = currentOpt.slidesPerView ?? slidesPerView;
    // マーク無しも初回は混在しうるので拾い、すべてオリジナルとして統一してから組み直す
    const originalSlides = Array.from(swiperEl.querySelectorAll('.swiper-slide')).filter(
      (s) => s.dataset[DATASET_KEY_ORIGINAL] === 'true' || !s.dataset[DATASET_KEY_ORIGINAL]
    );
    originalSlides.forEach((s) => (s.dataset[DATASET_KEY_ORIGINAL] = 'true'));
    if (!preserveWrapper) {
      wrapper.innerHTML = '';
      originalSlides.forEach((s) => wrapper.appendChild(s));
    }

    if (typeof currentSlidesPerView === 'number') {
      appendSlidesForLoop(wrapper, originalSlides, currentSlidesPerView);
    }
    // CSS transition と合わせて一定速度の流れに見せる
    wrapper.style.transitionTimingFunction = 'linear';

    const resolvedSpaceBetween =
      resolveFluidSpaceBetween(currentOpt.spaceBetween ?? spaceBetween, viewportWidth) ?? 0;

    // delay: 0 の autoplay は「途切れない移動」用。speed で一周にかける時間を調整
    const mergedOnLinear = mergeOnWithPluginReady(
      swiperEl,
      {
        ...(options.on && typeof options.on === 'object' ? options.on : {}),
        ...(currentOpt.on && typeof currentOpt.on === 'object' ? currentOpt.on : {}),
      },
      { deferAutoplay }
    );
    swiperInstance = new SwiperCtor(swiperEl, {
      ...buildModulesOption(lib, 'linear', {}, currentOpt),
      loop: true,
      slidesPerView: currentSlidesPerView,
      speed,
      allowTouchMove,
      spaceBetween: resolvedSpaceBetween,
      breakpoints,
      autoplay: { ...autoplayExtra, delay: 0 },
      on: mergedOnLinear,
    });
  };

  initSwiperInstance();

  // 幅変更時は再初期化。高さのみ（vh スライド高の再計算）は destroy せず update のみ
  onViewportResizeSplit({
    onWidthChange: initSwiperInstance,
    onHeightOnlyChange: () => {
      swiperInstance?.update();
    },
  });
}

/**
 * 初期化（全 [data-module="swiper"] を対象。data-swiper-linear ありならリニア、なければ通常）
 * @param {{ root?: Element }} [ctx]
 * @param {{
 *   normal?: object,
 *   linear?: object,
 *   swiper?: { Swiper?: any, modules?: Record<string, any> },
 * }} [options] - 通常/リニアのデフォルトオプション。npm モジュラー版は `swiper` で API を渡すか registerLibrary を使う
 */
const init = (ctx = {}, options = {}) => {
  // lib が null のときは CDN bundle のみ想定。npm 利用時は options.swiper か registerLibrary で渡す
  const lib = resolveLibrary(options);
  if (!getSwiperConstructor(lib)) return;
  const { root = document } = ctx;

  const elements = root.querySelectorAll(SELECTOR_ROOT);
  elements.forEach((el) => {
    const isLinear = el.hasAttribute(ATTR_SWIPER_LINEAR);
    if (isLinear) initLinearSlider(el, options.linear || {}, lib);
    else initNormalSlider(el, options.normal || {}, lib);
  });
};

export const swiper = {
  init,
  swiperBreakPoints,
  swiperFluidPair,
  swiperFluidValue,
  swiperCalcSlidesPerView,
  registerLibrary,
};
