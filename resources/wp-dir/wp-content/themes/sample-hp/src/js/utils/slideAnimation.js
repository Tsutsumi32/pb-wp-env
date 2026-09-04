/************************************************************
 * スライドアニメーション
 ************************************************************/
/**
 * スライドアニメーション用ユーティリティ関数
 * jQueryのslideToggle、slideUp、slideDownをVanilla JavaScriptで実現
 */

/**
 * 要素をスライドダウン（開く）アニメーション
 * @param {HTMLElement} element - アニメーション対象の要素
 * @param {number} duration - アニメーション時間（ミリ秒）
 * @param {string} easing - イージング関数名
 */
export const slideDown = (element, duration = 300, easing = 'ease-out') => {
  // 既に表示されている場合は何もしない
  if (element.style.display !== 'none' && element.offsetHeight > 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    // 初期状態を設定
    element.style.display = 'block';
    element.style.height = '0px';
    element.style.overflow = 'hidden';
    element.style.transition = `height ${duration}ms ${easing}`;

    // 強制的にリフローを発生させて初期状態を適用
    element.offsetHeight;

    // 最終的な高さを取得
    const targetHeight = element.scrollHeight;
    element.style.height = targetHeight + 'px';

    // アニメーション完了を待つ
    setTimeout(() => {
      element.style.height = '';
      element.style.overflow = '';
      element.style.transition = '';
      resolve();
    }, duration);
  });
};

/**
 * 要素をスライドアップ（閉じる）アニメーション
 * @param {HTMLElement} element - アニメーション対象の要素
 * @param {number} duration - アニメーション時間（ミリ秒）
 * @param {string} easing - イージング関数名
 */
export const slideUp = (element, duration = 300, easing = 'ease-out') => {
  // 既に非表示の場合は何もしない
  if (element.style.display === 'none' || element.offsetHeight === 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    // 現在の高さを取得
    const currentHeight = element.offsetHeight;
    element.style.height = currentHeight + 'px';
    element.style.overflow = 'hidden';
    element.style.transition = `height ${duration}ms ${easing}`;

    // 強制的にリフローを発生させて初期状態を適用
    element.offsetHeight;

    // 高さを0に設定
    element.style.height = '0px';

    // アニメーション完了を待つ
    setTimeout(() => {
      element.style.display = 'none';
      element.style.height = '';
      element.style.overflow = '';
      element.style.transition = '';
      resolve();
    }, duration);
  });
};

/**
 * 要素のスライドトグル（開閉切り替え）アニメーション
 * @param {HTMLElement} element - アニメーション対象の要素
 * @param {number} duration - アニメーション時間（ミリ秒）
 * @param {string} easing - イージング関数名
 */
export const slideToggle = (element, duration = 300, easing = 'ease-out') => {
  // 現在の表示状態を確認
  const isVisible = element.style.display !== 'none' && element.offsetHeight > 0;

  if (isVisible) {
    return slideUp(element, duration, easing);
  } else {
    return slideDown(element, duration, easing);
  }
};

/**
 * 複数の要素を同時にスライドダウン
 * @param {HTMLElement[]} elements - アニメーション対象の要素配列
 * @param {number} duration - アニメーション時間（ミリ秒）
 * @param {string} easing - イージング関数名
 */
export const slideDownMultiple = (elements, duration = 300, easing = 'ease-out') => {
  return Promise.all(elements.map((element) => slideDown(element, duration, easing)));
};

/**
 * 複数の要素を同時にスライドアップ
 * @param {HTMLElement[]} elements - アニメーション対象の要素配列
 * @param {number} duration - アニメーション時間（ミリ秒）
 * @param {string} easing - イージング関数名
 */
export const slideUpMultiple = (elements, duration = 300, easing = 'ease-out') => {
  return Promise.all(elements.map((element) => slideUp(element, duration, easing)));
};

/**
 * カスタムイージング関数
 */
export const easingFunctions = {
  linear: 'linear',
  ease: 'ease',
  'ease-in': 'ease-in',
  'ease-out': 'ease-out',
  'ease-in-out': 'ease-in-out',
  'cubic-bezier(0.4, 0, 0.2, 1)': 'cubic-bezier(0.4, 0, 0.2, 1)', // Material Design
  'cubic-bezier(0.25, 0.46, 0.45, 0.94)': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // easeOutQuad
};
