/************************************************************
 * カテゴリ検索（select）
 * - archive-works / archive-news などで共通利用
 ************************************************************/

// ---------------------------------------------------------------------------
// data 属性（参照するものは定数で一覧化）
// ---------------------------------------------------------------------------
const MODULE_NAME = 'categorySearch';
const SELECTOR_ROOT = `[data-module="${MODULE_NAME}"]`;
const SELECTOR_SELECT = 'select';
const SEARCH_ANCHOR = 'search';

/**
 * 遷移先 URL に検索位置のアンカーを付与
 * @param {string} url
 * @returns {string}
 */
const withSearchAnchor = (url) => {
  if (url === '' || url === '#') {
    return url;
  }

  const baseUrl = url.split('#')[0];
  return `${baseUrl}#${SEARCH_ANCHOR}`;
};

/**
 * カテゴリ選択でタクソノミー／一覧へ遷移
 * @returns {void}
 */
const init = () => {
  const roots = document.querySelectorAll(SELECTOR_ROOT);
  if (roots.length === 0) {
    return;
  }

  roots.forEach((root) => {
    const select = root.querySelector(SELECTOR_SELECT);
    if (!(select instanceof HTMLSelectElement)) {
      return;
    }

    select.addEventListener('change', () => {
      const { value } = select;
      if (value === '') {
        return;
      }
      window.location.href = withSearchAnchor(value);
    });
  });
};

export const categorySearch = { init };
