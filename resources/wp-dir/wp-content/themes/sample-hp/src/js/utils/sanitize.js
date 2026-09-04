/************************************************************
 * HTMLサニタイズ
 ************************************************************/
// @ts-ignore - sanitize-htmlの型定義がないため
import sanitizeHtmlLib from 'sanitize-html';

/**
 * HTMLコンテンツをサニタイズする（sanitize-html使用）
 * @param {string} html - サニタイズするHTML文字列
 * @returns {string} サニタイズされたHTML文字列
 */
export const sanitizeHtml = (html) => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return sanitizeHtmlLib(html, {
    allowedTags: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'b',
      'i',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'blockquote',
      'a',
      'img',
      'div',
      'span',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      div: ['class', 'id'],
      span: ['class', 'id'],
      p: ['class', 'id'],
      h1: ['class', 'id'],
      h2: ['class', 'id'],
      h3: ['class', 'id'],
      h4: ['class', 'id'],
      h5: ['class', 'id'],
      h6: ['class', 'id'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      a: ['http', 'https', 'mailto'],
      img: ['http', 'https'],
    },
  });
};

/**
 * プレーンテキストをサニタイズする（HTMLタグを除去）
 * @param {string} text - サニタイズするテキスト
 * @returns {string} サニタイズされたプレーンテキスト
 */
export const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return sanitizeHtmlLib(text, {
    allowedTags: [],
    allowedAttributes: {},
  });
};

/**
 * オブジェクトの文字列プロパティを再帰的にサニタイズする
 * @param {Object} obj - サニタイズするオブジェクト
 * @param {string[]} htmlFields - HTMLサニタイズを適用するフィールド名の配列
 * @returns {Object} サニタイズされたオブジェクト
 */
export const sanitizeObject = (obj, htmlFields = []) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = { ...obj };

  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      if (htmlFields.includes(key)) {
        sanitized[key] = sanitizeHtml(value);
      } else {
        sanitized[key] = sanitizeText(value);
      }
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string'
          ? htmlFields.includes(key)
            ? sanitizeHtml(item)
            : sanitizeText(item)
          : sanitizeObject(item, htmlFields)
      );
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value, htmlFields);
    }
  }

  return sanitized;
};
