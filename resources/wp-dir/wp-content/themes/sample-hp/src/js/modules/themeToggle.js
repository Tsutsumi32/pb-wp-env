/************************************************************
 * テーマ切替
 * - 切り替えボタンの機能のみを提供。システム設定からの初期化は config/themeSystemInit.js で行う。
 * - data-module="themeToggle" がボタン（各ボタンがルート）。data-action="themeToggle.toggle" でトリガー、data-theme-toggle-theme でモード指定
 * - ボタンはどこにあっても document に delegate。適用中のテーマは documentElement の data-theme に設定
 ************************************************************/
import { THEME_STORAGE_KEY } from '../config/themeSystemInit.js';
import { delegate } from '../utils/delegate.js';

// ---------------------------------------------------------------------------
// data 属性（参照するものは定数で一覧化。DATA_ATTR は global.js）
// ---------------------------------------------------------------------------
// const MODULE_THEME_TOGGLE = 'themeToggle';
/** ボタンに設定するテーマ値（data-モジュール名-xxx） */
const ATTR_THEME_TOGGLE_THEME = 'data-theme-toggle-theme';
/** 適用中のテーマを documentElement に付与する属性（グローバル） */
const ATTR_THEME = 'data-theme';

//const SELECTOR_THEME_TOGGLE = `[${DATA_ATTR.MODULE}="${MODULE_THEME_TOGGLE}"]`;

/** ストレージキー（config/themeSystemInit.js と統一） */
export const STORAGE_KEY = THEME_STORAGE_KEY;

/**
 * テーマを設定
 * @param {string} theme - テーマ名（'default' | 'dark' など）
 * @param {boolean} saveToStorage - ストレージに保存するか
 */
const setTheme = (theme, saveToStorage = true) => {
  if (!theme) theme = 'default';
  document.documentElement.setAttribute(ATTR_THEME, theme);
  if (saveToStorage) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      console.warn('ローカルストレージへの保存に失敗しました。', e);
    }
  }
  document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
};

/**
 * 現在のテーマを取得
 * @returns {string}
 */
const getCurrentTheme = () => {
  return document.documentElement.getAttribute(ATTR_THEME) || 'default';
};

/**
 * 初期化（document に delegate。data-action="themeToggle.toggle" をトリガーに。ボタンは data-module="themeToggle"）
 */
const init = () => {
  delegate(document, 'click', {
    'themeToggle.toggle': (e, el) => {
      const theme = el.getAttribute(ATTR_THEME_TOGGLE_THEME);
      if (theme) setTheme(theme, true);
      else console.warn(`${ATTR_THEME_TOGGLE_THEME}属性が設定されていません。`, el);
    },
  });
};

export const themeToggle = { init, setTheme, getCurrentTheme, STORAGE_KEY };
