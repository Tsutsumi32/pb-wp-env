/************************************************************
 * テーマシステム設定初期化ユーティリティ
 * - システム設定（OSのダークモード設定）からテーマを判定・設定
 * - localStorageからユーザー設定を取得
 * - 優先順位: 1. localStorage > 2. システム設定 > 3. default
 ************************************************************/

/**
 * ストレージキー（themeToggle モジュールと統一）
 */
export const THEME_STORAGE_KEY = 'theme-mode';

/**
 * システム設定からテーマを取得
 * @returns {string} テーマ名（'default' | 'dark'）
 */
function getSystemTheme() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'default';
}

/**
 * localStorageからテーマを取得
 * @returns {string|null} 保存されているテーマ名、またはnull
 */
function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch (e) {
    console.warn('ローカルストレージへのアクセスに失敗しました。', e);
    return null;
  }
}

/**
 * テーマをHTML要素に設定
 * @param {string} theme - テーマ名
 */
function applyTheme(theme) {
  if (!theme) {
    theme = 'default';
  }
  document.documentElement.setAttribute('data-theme', theme);
}

/**
 * 初期テーマを設定
 * 優先順位: 1. localStorage > 2. システム設定 > 3. default
 * @param {boolean} storageEnabled - ストレージを使用するか
 * @returns {string} 設定されたテーマ名
 */
export function initializeThemeSystem(storageEnabled = true) {
  let theme = 'default';

  // 1. localStorageから取得（ユーザーが手動で設定した値）
  if (storageEnabled) {
    const storedTheme = getStoredTheme();
    if (storedTheme) {
      theme = storedTheme;
    }
  }

  // 2. ストレージにない場合、システム設定を確認
  if (!storageEnabled || !getStoredTheme()) {
    theme = getSystemTheme();
  }

  // テーマを適用
  applyTheme(theme);

  return theme;
}

/**
 * システム設定の変更を監視してテーマを更新
 * ユーザーが手動で設定していない場合のみ、システム設定を反映
 * @param {boolean} storageEnabled - ストレージを使用するか
 */
export function watchSystemThemeChange(storageEnabled = true) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleMediaChange = (e) => {
    // ユーザーが手動で設定していない場合のみ、システム設定を反映
    if (storageEnabled && !getStoredTheme()) {
      const systemTheme = e.matches ? 'dark' : 'default';
      applyTheme(systemTheme);

      // カスタムイベントを発火
      const event = new CustomEvent('themechange', {
        detail: { theme: systemTheme },
      });
      document.dispatchEvent(event);
    }
  };

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleMediaChange);
  } else {
    mediaQuery.addListener(handleMediaChange);
  }
}
