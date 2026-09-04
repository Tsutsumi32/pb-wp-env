/************************************************************
 * ページトップボタン
 * - data-module="pageTop" がボタン。data-action="pageTop.scroll" でクリック時トップへ
 * - [data-page-top-mv] を過ぎると表示（is_visible）
 ************************************************************/

import { DATA_ATTR, STATE_CLASSES } from '../constans/global.js';
import { smoothScrollTo } from '../setup/tasks/smoothAnchorLink.js';
import { delegate } from '../utils/delegate.js';

// ---------------------------------------------------------------------------
// data 属性（参照するものは定数で一覧化。DATA_ATTR は global.js）
// ---------------------------------------------------------------------------
const MODULE_PAGE_TOP = 'pageTop';
const ATTR_PAGE_TOP_MV = 'data-page-top-mv';

const SELECTOR_PAGE_TOP = `[${DATA_ATTR.MODULE}="${MODULE_PAGE_TOP}"]`;
const SELECTOR_MV = `[${ATTR_PAGE_TOP_MV}]`;

/**
 * 初期化（表示制御は [data-module="pageTop"] を参照。クリックは document に delegate、data-action="pageTop.scroll"）
 * @param {{ startSelector?: string }} [options] - 表示開始の基準要素（省略時は data-page-top-mv）
 */
const init = (_ctx = {}, options = {}) => {
  const pageTop = document.querySelector(SELECTOR_PAGE_TOP);
  const startEl = document.querySelector(options.startSelector || SELECTOR_MV);

  if (pageTop && startEl) {
    pageTop.setAttribute('aria-hidden', 'true');
    pageTop.hidden = true;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry) return;
        const show = !entry.isIntersecting;
        if (show) {
          pageTop.removeAttribute('aria-hidden');
          pageTop.hidden = false;
          pageTop.classList.add(STATE_CLASSES.VISIBLE);
        } else {
          pageTop.classList.remove(STATE_CLASSES.VISIBLE);
          pageTop.setAttribute('aria-hidden', 'true');
          pageTop.hidden = true;
        }
      },
      { rootMargin: '0px', threshold: 0 }
    );
    observer.observe(startEl);
  }

  delegate(document, 'click', {
    'pageTop.scroll': () => smoothScrollTo(0),
  });
};

export const pageTop = { init };
