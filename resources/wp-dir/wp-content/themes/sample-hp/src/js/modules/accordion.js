/************************************************************
 * アコーディオン
 * - [data-module="accordion"] がルート。開閉状態はルートにのみ is_active で制御（CSS で表示切替）
 ************************************************************/

import { DATA_ATTR, STATE_CLASSES } from '../constans/global.js';
import { delegate } from '../utils/delegate.js';

// ---------------------------------------------------------------------------
// data 属性（参照するものは定数で一覧化。DATA_ATTR は global.js）
// ---------------------------------------------------------------------------
const MODULE_ACCORDION = 'accordion';

const SELECTOR_ROOT = `[${DATA_ATTR.MODULE}="${MODULE_ACCORDION}"]`;

/**
 * 初期化（各アコーディオンルートにクリック委譲。data-action="accordion.toggle" をトリガーに）
 * @param {{ root?: Element }} [ctx]
 */
const init = (ctx = {}) => {
  const { root = document } = ctx;
  const roots = root.querySelectorAll(SELECTOR_ROOT);
  roots.forEach((accordionRoot) => {
    delegate(accordionRoot, 'click', {
      'accordion.toggle': (e) => {
        if (e.target.closest('a')) return;
        accordionRoot.classList.toggle(STATE_CLASSES.ACTIVE);

        const toggleBtn =
          e.target.closest('[data-action="accordion.toggle"]') ??
          accordionRoot.querySelector('[data-action="accordion.toggle"]');
        if (!toggleBtn) return;

        const isExpanded = accordionRoot.classList.contains(STATE_CLASSES.ACTIVE);
        toggleBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
      },
    });
  });
};

export const accordion = { init };
