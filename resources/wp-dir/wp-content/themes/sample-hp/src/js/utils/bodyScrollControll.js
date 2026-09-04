/************************************************************
 * スクロール制御
 * bodyのスクロールの制御を行う。レイアウトシフト対応済
 ************************************************************/

/** スクロール固定時にbodyに付与するクラス名（CSSで固定要素の調整に利用可能） */
export const SCROLL_LOCK_CLASS = 'is-scroll-locked';

/** @type {{ stop?: () => void, start?: () => void } | null} */
let lenisRef = null;

/**
 * Lenis インスタンスをスクロールロック連携用に登録
 * @param {{ stop?: () => void, start?: () => void } | null} lenis
 */
export const bindLenis = (lenis) => {
  lenisRef = lenis;
};

/**
 * スクロールを無効化し、レイアウトシフトを防ぐ
 * @description bodyのoverflowをhiddenに設定してスクロールを無効化する。
 * --scrollbar-width は initCommon の initScrollbarWidthSync で管理する。
 * 固定中はbodyにSCROLL_LOCK_CLASSが付与される。
 */
export const disableScroll = () => {
  document.body.style.overflow = 'hidden';
  document.body.classList.add(SCROLL_LOCK_CLASS);
  lenisRef?.stop?.();
};

/**
 * スクロールを有効化し、レイアウトを元に戻す
 * @description bodyのoverflowをvisibleに設定してスクロールを有効化し、
 * 設定されていた幅を解除し、SCROLL_LOCK_CLASSを外してレイアウトを元に戻す。
 */
export const enableScroll = () => {
  document.body.style.overflow = 'visible';
  document.body.classList.remove(SCROLL_LOCK_CLASS);
  lenisRef?.start?.();
};

/**
 * スクロールイベントを防止する内部関数
 * @param {Event} e - イベントオブジェクト
 * @private
 */
const preventScroll = (e) => {
  e.preventDefault();
};

/**
 * スクロール防止イベントリスナーを追加する
 * @description wheelとtouchmoveイベントにpreventScroll関数をバインドして、
 * マウスホイールやタッチスクロールを防止する。
 * passive: falseでイベントのデフォルト動作を阻止可能にする。
 */
export const disableScrollPrevent = () => {
  document.addEventListener('wheel', preventScroll, { passive: false });
  document.addEventListener('touchmove', preventScroll, { passive: false });
};

/**
 * スクロール防止イベントリスナーを削除する
 * @description wheelとtouchmoveイベントからpreventScroll関数のイベントリスナーを削除して、
 * マウスホイールやタッチスクロールを再度有効化する。
 */
export const enableScrollPrevent = () => {
  document.removeEventListener('wheel', preventScroll, { passive: false });
  document.removeEventListener('touchmove', preventScroll, { passive: false });
};
