/************************************************************
 * 目次ナビ（アンカーリンク一覧）
 * - data-feature="anchorLinkList" が対象
 * - スクロール位置に応じてリンクへ is_active を付与
 ************************************************************/

import { DATA_ATTR, STATE_CLASSES } from '../constans/global.js';
import { getAnchorTriggerScrollY } from '../setup/tasks/smoothAnchorLink.js';

// ---------------------------------------------------------------------------
// data 属性（参照するものは定数で一覧化。DATA_ATTR.FEATURE は global.js）
// ---------------------------------------------------------------------------
/** 機能名（data-feature の値）。data 属性の値はキャメルケース */
const FEATURE_NAME = 'anchorLinkList';

const SELECTOR_TARGET = `[${DATA_ATTR.FEATURE}="${FEATURE_NAME}"]`;
const SELECTOR_LINK = 'a[href*="#"]';

/** @type {WeakMap<Element, { links: HTMLAnchorElement[]; sections: HTMLElement[]; onScroll: () => void }>} */
const instances = new WeakMap();

/**
 * href から同一ページ内アンカーのターゲット要素を取得
 * @param {HTMLAnchorElement} link
 * @returns {HTMLElement|null}
 */
const getTargetElement = (link) => {
  const href = link.getAttribute('href');
  if (!href || href === '#' || href === '#0') {
    return null;
  }

  try {
    const linkUrl = new URL(href, window.location.href);
    const hash = linkUrl.hash;

    if (!hash || hash === '#' || hash === '#0') {
      return null;
    }

    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    return target instanceof HTMLElement ? target : null;
  } catch {
    return null;
  }
};

/**
 * スクロール位置からアクティブなリンクのインデックスを取得
 * @param {HTMLElement[]} sections
 * @returns {number}
 */
const getActiveIndex = (sections) => {
  const scrollY = window.scrollY;
  let activeIndex = 0;

  sections.forEach((section, index) => {
    if (scrollY >= getAnchorTriggerScrollY(section)) {
      activeIndex = index;
    }
  });

  return activeIndex;
};

/**
 * アクティブ状態を更新
 * @param {HTMLAnchorElement[]} links
 * @param {HTMLElement[]} sections
 * @returns {void}
 */
const updateActiveState = (links, sections) => {
  const activeIndex = getActiveIndex(sections);

  links.forEach((link, index) => {
    link.classList.toggle(STATE_CLASSES.ACTIVE, index === activeIndex);
  });
};

/**
 * スクロール監視を登録
 * @param {{ links: HTMLAnchorElement[]; sections: HTMLElement[] }} state
 * @returns {() => void}
 */
const bindScrollObserver = (state) => {
  let ticking = false;

  const onScroll = () => {
    if (ticking) {
      return;
    }

    ticking = true;
    requestAnimationFrame(() => {
      updateActiveState(state.links, state.sections);
      ticking = false;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  return onScroll;
};

/**
 * 目次ナビを初期化
 * @param {{ root?: Document|Element }} [ctx]
 * @returns {void}
 */
const init = (ctx = {}) => {
  const { root = document } = ctx;
  const navRoots = root.querySelectorAll(SELECTOR_TARGET);

  navRoots.forEach((navRoot) => {
    if (instances.has(navRoot)) {
      return;
    }

    const links = [...navRoot.querySelectorAll(SELECTOR_LINK)].filter(
      (link) => link instanceof HTMLAnchorElement
    );
    const sections = links
      .map((link) => getTargetElement(link))
      .filter((section) => section instanceof HTMLElement);

    if (links.length === 0 || sections.length !== links.length) {
      return;
    }

    const onScroll = bindScrollObserver({ links, sections });
    instances.set(navRoot, { links, sections, onScroll });
    onScroll();
  });
};

export const anchorLinkList = { init };
