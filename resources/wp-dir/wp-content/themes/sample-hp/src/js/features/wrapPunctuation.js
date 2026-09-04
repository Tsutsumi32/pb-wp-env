/************************************************************
 * 句読点を span（クラス palt）で囲む（features）
 * - data-feature="wrapPunctuation" がついた要素内の句読点（、。（））を処理対象とする
 * - 関連属性: data-wrap-punctuation-processed（処理済みフラグ）
 ************************************************************/

import { DATA_ATTR } from '../constans/global.js';

// ---------------------------------------------------------------------------
// data 属性（参照するものは定数で一覧化。DATA_ATTR.FEATURE は global.js）
// ---------------------------------------------------------------------------
/** 機能名（data-feature の値）。data 属性の値はキャメルケース */
const FEATURE_NAME = 'wrapPunctuation';
const FEATURE_ATTR_NAME = 'wrap-punctuation';

/** 処理済みフラグ用属性（data-機能名-xxxx のルール） */
const ATTR_PROCESSED = `data-${FEATURE_ATTR_NAME}-processed`;

const SELECTOR_TARGET = `[${DATA_ATTR.FEATURE}="${FEATURE_NAME}"]`;

const PUNCTUATION_REGEX = /([、。（）])/g;
const SPAN_CLASS = 'palt';

/**
 * 要素内のテキストノードを走査して callback を実行
 * @param {Node} node
 * @param { (textNode: Text) => void } callback
 */
const walkTextNodes = (node, callback) => {
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      const parent = n.parentElement;
      if (parent && ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes = [];
  let textNode;
  while ((textNode = walker.nextNode())) textNodes.push(textNode);
  textNodes.forEach(callback);
};

/**
 * 初期化（対象要素の句読点を span.palt で囲む）
 */
const init = () => {
  const elements = document.querySelectorAll(SELECTOR_TARGET);
  elements.forEach((element) => {
    if (element.getAttribute(ATTR_PROCESSED) === 'true') return;

    walkTextNodes(element, (textNode) => {
      const text = textNode.textContent;
      if (!PUNCTUATION_REGEX.test(text)) return;

      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let match;
      PUNCTUATION_REGEX.lastIndex = 0;

      while ((match = PUNCTUATION_REGEX.exec(text)) !== null) {
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        }
        const span = document.createElement('span');
        span.className = SPAN_CLASS;
        span.style.fontFeatureSettings = '"palt"';
        span.textContent = match[0];
        fragment.appendChild(span);
        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }
      textNode.parentNode.replaceChild(fragment, textNode);
    });

    element.setAttribute(ATTR_PROCESSED, 'true');
  });
};

export const wrapPunctuation = { init };
