/************************************************************
 * Lottie アニメーション（CDN 想定）
 * - data-feature="lottieAnimation" がコンテナ
 * - data-lottie-animation-src … JSON の URL（必須）
 * - data-lottie-animation-loop … ループ（省略時 true。"false" で停止）
 * - data-lottie-animation-autoplay … 自動再生（省略時 true。"false" で停止）
 *
 * 例:
 * <div
 *   data-feature="lottieAnimation"
 *   data-lottie-animation-src="/assets/motion/hor.json"
 *   data-lottie-animation-loop="false"
 * ></div>
 ************************************************************/

import { DATA_ATTR } from '../constans/global.js';

// ---------------------------------------------------------------------------
// data 属性
// ---------------------------------------------------------------------------
/** 機能名（data-feature の値） */
const FEATURE_NAME = 'lottieAnimation';

/** JSON パス（必須） */
const ATTR_SRC = 'data-lottie-animation-src';

/** ループ。未指定・空・"true" なら有効。"false" のみ無効 */
const ATTR_LOOP = 'data-lottie-animation-loop';

/** 自動再生。未指定・空・"true" なら有効。"false" のみ無効 */
const ATTR_AUTOPLAY = 'data-lottie-animation-autoplay';

const SELECTOR_TARGET = `[${DATA_ATTR.FEATURE}="${FEATURE_NAME}"]`;

/**
 * @param {Element} element
 * @param {string} path
 * @returns {object | undefined}
 */
const loadOnElement = (element, path) => {
  const lottieLib = window.lottie;
  if (!lottieLib) {
    return undefined;
  }

  // 属性省略時は loop / autoplay ともに true（"false" 文字列のみ無効）
  const loop = element.getAttribute(ATTR_LOOP) !== 'false';
  const autoplay = element.getAttribute(ATTR_AUTOPLAY) !== 'false';

  return lottieLib.loadAnimation({
    container: element,
    renderer: 'svg',
    loop,
    autoplay,
    path,
  });
};

/**
 * 初期化（lottie がグローバルに存在し、動きの軽減が無効な場合のみ）
 * @param {{ root?: Document|Element }} [ctx]
 */
const init = (ctx = {}) => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    return;
  }

  const { root = document } = ctx;
  root.querySelectorAll(SELECTOR_TARGET).forEach((element) => {
    const path = element.getAttribute(ATTR_SRC);
    if (!path) {
      return;
    }
    loadOnElement(element, path);
  });
};

export const lottieAnimation = { init };
