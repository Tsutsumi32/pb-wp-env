/**
 * data-count 属性を持つ要素のカウントアップアニメーション
 * data-count-start から data-count までテキストをアニメーションする
 */

// ---------------------------------------------------------------------------
// data 属性（参照するものは定数で一覧化）
// ---------------------------------------------------------------------------
/** カウントアップの終了値 */
const ATTR_COUNT = 'data-count';
/** カウントアップの開始値（省略時 0） */
const ATTR_COUNT_START = 'data-count-start';
/** アニメーション時間（ミリ秒。省略時 DEFAULT_DURATION） */
const ATTR_COUNT_DURATION = 'data-count-duration';
/** 数値を表示する子要素 */
const ATTR_COUNT_TARGET = 'data-count-target';

const SELECTOR_COUNT = `[${ATTR_COUNT}]`;
const SELECTOR_COUNT_TARGET = `[${ATTR_COUNT_TARGET}]`;

const DEFAULT_DURATION = 2000;

/**
 * easeOutExpo - 終わりに向けて減速するイージング
 * @param {number} t - 0～1 の進行度
 * @returns {number}
 */
const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * 単一要素を指定範囲でカウントアップアニメーション
 * @param {HTMLElement} element - アニメーション対象要素
 * @param {Object} options
 * @param {number} options.start - 開始値
 * @param {number} options.end - 終了値
 * @param {number} [options.duration=2000] - アニメーション時間（ミリ秒）
 */
export const animateCountUp = (element, { start, end, duration = DEFAULT_DURATION }) => {
  const startTime = performance.now();

  const tick = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutExpo(progress);
    const current = Math.round(start + (end - start) * eased);

    element.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      element.textContent = end;
    }
  };

  requestAnimationFrame(tick);
};

/**
 * data-count を持つ要素を取得し、表示域に入ったらカウントアップを開始
 * カウントアップ対象は子要素の [data-count-target]。その兄弟に終了値を入れた span（opacity:0, aria-hidden）を挿入する
 * @param {HTMLElement|Document} [container=document] - 検索対象のコンテナ
 * @param {Object} [observerOptions] - IntersectionObserver のオプション
 */
export const initCountUp = (container = document, observerOptions = {}) => {
  const root = container instanceof Document ? document.body : container;
  const elements = root.querySelectorAll(SELECTOR_COUNT);

  if (!elements.length) return;

  const defaultObserverOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.2,
    ...observerOptions,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const countEl = entry.target;
      const targetEl = countEl.querySelector(SELECTOR_COUNT_TARGET);
      if (!targetEl) return;

      const end = Number(countEl.getAttribute(ATTR_COUNT));
      const startAttr = countEl.getAttribute(ATTR_COUNT_START);
      const start = startAttr !== null && startAttr !== '' ? Number(startAttr) : 0;
      const durationAttr = countEl.getAttribute(ATTR_COUNT_DURATION);
      const duration =
        durationAttr != null && durationAttr !== '' ? Number(durationAttr) : DEFAULT_DURATION;

      if (Number.isNaN(end)) return;

      // data-count-target を絶対配置（がたつき防止）
      countEl.style.position = 'relative';
      Object.assign(targetEl.style, {
        position: 'absolute',
        top: '0',
        right: '0',
      });

      // data-count-target の兄弟として、終了値用の span を挿入（opacity:0, aria-hidden）
      const hiddenSpan = document.createElement('span');
      hiddenSpan.textContent = String(end);
      hiddenSpan.style.opacity = '0';
      hiddenSpan.setAttribute('aria-hidden', 'true');
      targetEl.insertAdjacentElement('afterend', hiddenSpan);

      animateCountUp(targetEl, { start, end, duration });
      observer.unobserve(countEl);
    });
  }, defaultObserverOptions);

  elements.forEach((el) => observer.observe(el));
};
