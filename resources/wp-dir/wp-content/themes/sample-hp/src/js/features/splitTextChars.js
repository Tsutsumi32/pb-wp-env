/************************************************************
 * テキストを1文字ずつ span で分割（features）
 * - data-feature="splitTextChars" が対象
 * - 子要素の br など HTML 構造は維持し、テキストノードのみ分割する
 * - 半角スペース（U+0020）は直前の文字と同一 span に含める（表示は U+00A0）
 * - 関連属性: data-split-text-chars-processed（処理済みフラグ）
 ************************************************************/

import { DATA_ATTR, STATE_CLASSES } from '../constans/global.js';

// ---------------------------------------------------------------------------
// data 属性（参照するものは定数で一覧化。DATA_ATTR.FEATURE は global.js）
// ---------------------------------------------------------------------------
/** 機能名（data-feature の値）。data 属性の値はキャメルケース */
const FEATURE_NAME = 'splitTextChars';
const FEATURE_ATTR_NAME = 'split-text-chars';

/** 処理済みフラグ用属性（data-機能名-xxxx のルール） */
const ATTR_PROCESSED = `data-${FEATURE_ATTR_NAME}-processed`;

const SELECTOR_TARGET = `[${DATA_ATTR.FEATURE}="${FEATURE_NAME}"]`;

/** 各 span への is_active 付与間隔（ミリ秒） */
const DEFAULT_ACTIVATE_DELAY = 50;

/** 先頭 span への is_active 付与までの待機時間（ミリ秒） */
const DEFAULT_ACTIVATE_START_DELAY = 0;

/** 半角スペース（U+0020） */
const HALF_WIDTH_SPACE = ' ';

/**
 * span 末尾に付与する半角スペース（U+00A0）
 * - インライン要素の末尾スペースは通常折りたたまれるため、表示用に nbsp を使う
 */
const VISIBLE_HALF_WIDTH_SPACE = '\u00A0';

/**
 * 文字列を書記素（grapheme）単位の配列に分割
 * @param {string} text
 * @returns {string[]}
 */
const toGraphemes = (text) => {
  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return [...segmenter.segment(text)].map(({ segment }) => segment);
  }
  return [...text];
};

/**
 * 書記素配列を span 単位にまとめる（半角スペースは直前の文字に含める）
 * @param {string[]} graphemes
 * @returns {string[]}
 */
const groupGraphemesForSpans = (graphemes) => {
  const groups = [];

  graphemes.forEach((char) => {
    if (char === HALF_WIDTH_SPACE) {
      if (groups.length > 0) {
        groups[groups.length - 1] += VISIBLE_HALF_WIDTH_SPACE;
        return;
      }
      groups.push(VISIBLE_HALF_WIDTH_SPACE);
      return;
    }
    groups.push(char);
  });

  return groups;
};

/**
 * テキストノードを1文字ずつ span に分割して置換
 * @param {Text} textNode
 */
const splitTextNode = (textNode) => {
  const text = textNode.textContent;
  if (!text) return;

  const fragment = document.createDocumentFragment();
  groupGraphemesForSpans(toGraphemes(text)).forEach((char) => {
    const span = document.createElement('span');
    span.textContent = char;
    fragment.appendChild(span);
  });

  textNode.parentNode.replaceChild(fragment, textNode);
};

/**
 * 要素内の子ノードを走査してテキストノードを分割
 * @param {Element} element
 */
const processElement = (element) => {
  [...element.childNodes].forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      splitTextNode(child);
      return;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) return;
    if (child.tagName === 'SCRIPT' || child.tagName === 'STYLE' || child.tagName === 'NOSCRIPT') {
      return;
    }
    if (child.tagName === 'BR') return;

    processElement(child);
  });
};

/**
 * 分割済み要素内の span 一覧を DOM 順で取得
 * @param {Element} element
 * @returns {HTMLSpanElement[]}
 */
const getCharSpans = (element) => [...element.querySelectorAll('span')];

/**
 * 分割済み要素内の span に is_active を順番に付与
 * @param {Element} element
 * @param {{ delay?: number, startDelay?: number }} [options]
 * @param {number} [options.delay=DEFAULT_ACTIVATE_DELAY] - 各 span への付与間隔（ミリ秒）
 * @param {number} [options.startDelay=DEFAULT_ACTIVATE_START_DELAY] - 先頭 span への付与までの待機時間（ミリ秒）
 * @returns {{ cancel: () => void }}
 */
const activateChars = (element, options = {}) => {
  const { delay = DEFAULT_ACTIVATE_DELAY, startDelay = DEFAULT_ACTIVATE_START_DELAY } = options;
  const spans = getCharSpans(element);

  if (!spans.length) {
    return { cancel: () => {} };
  }

  if (delay === 0 && startDelay === 0) {
    spans.forEach((span) => {
      span.classList.add(STATE_CLASSES.ACTIVE);
    });
    return { cancel: () => {} };
  }

  const timeoutIds = spans.map((span, index) =>
    window.setTimeout(
      () => {
        span.classList.add(STATE_CLASSES.ACTIVE);
      },
      startDelay + delay * index
    )
  );

  return {
    cancel: () => {
      timeoutIds.forEach((id) => window.clearTimeout(id));
    },
  };
};

/**
 * 初期化（対象要素のテキストを1文字ずつ span で分割）
 * @param {{ root?: Document|Element }} [ctx]
 * @returns {void}
 */
const init = (ctx = {}) => {
  const { root = document } = ctx;
  const scope = root instanceof Document ? root : root;
  const elements = scope.querySelectorAll(SELECTOR_TARGET);

  elements.forEach((element) => {
    if (element.getAttribute(ATTR_PROCESSED) === 'true') return;

    processElement(element);
    element.setAttribute(ATTR_PROCESSED, 'true');
  });
};

export const splitTextChars = {
  init,
  activateChars,
  DEFAULT_ACTIVATE_DELAY,
  DEFAULT_ACTIVATE_START_DELAY,
};
