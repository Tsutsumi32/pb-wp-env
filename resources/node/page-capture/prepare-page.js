/**
 * scrollObserver / GSAP を止め、キャプチャ用に表示を固定する
 * @param {import('@playwright/test').Page} page
 */
const freezeMotionForCapture = async (page) => {
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.setAttribute('data-capture-style', 'true');
    style.textContent = [
      'html { scrollbar-width: none !important; }',
      '::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }',
      '*, *::before, *::after { transition: none !important; animation: none !important; }',
      '[class*="has_observer_"] { opacity: 1 !important; visibility: visible !important; transform: none !important; }',
      '.has_gsap_smooth_wrapper { position: static !important; inset: auto !important; width: auto !important; height: auto !important; overflow: visible !important; transform: none !important; }',
      '[data-loading], .el_loading { display: none !important; }',
    ].join('\n');
    document.head.appendChild(style);

    const gsapWindow = window;
    try {
      gsapWindow.ScrollSmoother?.get?.()?.kill?.();
    } catch {
      // ScrollSmoother 未導入時は無視
    }
    try {
      gsapWindow.ScrollTrigger?.getAll?.()?.forEach((trigger) => trigger.kill());
    } catch {
      // ScrollTrigger 未導入時は無視
    }

    document.querySelectorAll('[data-feature="scrollObserver"], [class*="has_observer_"]').forEach((el) => {
      el.classList.add('is_active');
      el.classList.add('is_visible');
      const selector = el.getAttribute('data-scroll-observer-target');
      if (!selector) return;
      document.querySelectorAll(selector).forEach((target) => {
        target.classList.add('is_active');
        target.classList.add('is_visible');
      });
    });
  });
};

/**
 * webfont の適用を待つ（未適用だと英単語見出しなどが折り返す）
 * @param {import('@playwright/test').Page} page
 */
const ensureWebFontsReady = async (page) => {
  return page.evaluate(async () => {
    const waitFonts = async () => {
      if (!document.fonts?.ready) return;
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => {
          setTimeout(resolve, 10000);
        }),
      ]);

      const faces = ['700 62px "Noto Sans"', '700 20px "Noto Sans JP"', '400 16px "Noto Sans JP"'];
      await Promise.all(
        faces.map((face) =>
          document.fonts.load(face).catch(() => undefined),
        ),
      );
    };

    await waitFonts();

    const notoSans = [...document.fonts].filter((face) => /Noto Sans/i.test(face.family));
    const loaded = notoSans.filter((face) => face.status === 'loaded').length;
    return {
      registered: notoSans.length,
      loaded,
    };
  });
};

/**
 * Linux Chromium のわずかな文字幅差で、英語1単語が見出し枠内で途中改行されるのをキャプチャ時だけ防ぐ
 * @param {import('@playwright/test').Page} page
 */
const preventSpuriousLatinWrap = async (page) => {
  await page.evaluate(() => {
    const isSingleLatinWord = (text) => /^[A-Za-z0-9&]+$/.test(text);

    document.querySelectorAll('h1, h2, h3, h4, h5, h6, p').forEach((el) => {
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!isSingleLatinWord(text)) return;

      const style = getComputedStyle(el);
      const fontSize = Number.parseFloat(style.fontSize);
      const lineHeight =
        style.lineHeight === 'normal' ? fontSize : Number.parseFloat(style.lineHeight);
      if (!Number.isFinite(lineHeight) || lineHeight <= 0) return;

      if (el.getBoundingClientRect().height > lineHeight * 1.35) {
        el.style.whiteSpace = 'nowrap';
      }
    });
  });
};

/**
 * loading="lazy" の画像を読み込む（画面外ヒーロー等）
 * @param {import('@playwright/test').Page} page
 */
const ensureLazyImagesLoaded = async (page) => {
  await page.evaluate(async () => {
    const wait = (ms) => new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

    const loadImage = (img) =>
      new Promise((resolve) => {
        if (img.complete && img.naturalWidth > 0) {
          resolve();
          return;
        }

        const finish = () => resolve();
        img.addEventListener('load', finish, { once: true });
        img.addEventListener('error', finish, { once: true });
        img.loading = 'eager';

        const src = img.currentSrc || img.src;
        if (src) {
          img.src = src;
        }

        setTimeout(finish, 8000);
      });

    const maxScroll = Math.max(
      document.documentElement.scrollHeight,
      document.body?.scrollHeight ?? 0,
    );
    const step = Math.max(window.innerHeight, 1);

    for (let y = 0; y <= maxScroll; y += step) {
      window.scrollTo(0, y);
      await wait(80);
    }

    await Promise.all([...document.images].map(loadImage));
  });
};

/**
 * キャプチャ直前の DOM 準備（observer 表示・ヘッダー先頭・スクロールバー対策）
 * @param {import('@playwright/test').Page} page
 * @param {{ resetForms?: boolean }} [options]
 * @returns {Promise<number>} document.documentElement.clientWidth
 */
export const preparePageForCapture = async (page, options = {}) => {
  const { resetForms = false } = options;

  await freezeMotionForCapture(page);
  await ensureLazyImagesLoaded(page);
  const fontStatus = await ensureWebFontsReady(page);
  if (fontStatus && fontStatus.loaded === 0) {
    console.warn('[capture] web fonts were not loaded before screenshot');
  }

  const clientWidth = await page.evaluate((shouldResetForms) => {
    document.querySelectorAll('[data-feature="scrollObserver"], [class*="has_observer_"]').forEach((el) => {
      el.classList.add('is_active');
      el.classList.add('is_visible');
      const selector = el.getAttribute('data-scroll-observer-target');
      if (!selector) return;
      document.querySelectorAll(selector).forEach((target) => {
        target.classList.add('is_active');
        target.classList.add('is_visible');
      });
    });

    document.querySelectorAll('[data-count]').forEach((el) => {
      const end = el.getAttribute('data-count');
      const target = el.querySelector('[data-count-target]');
      if (target && end != null) target.textContent = end;
    });

    if (shouldResetForms) {
      document.querySelectorAll('form').forEach((form) => {
        form.reset();
      });
    }

    document.querySelector('[data-module="header"]')?.classList.remove('is_active');
    window.scrollTo(0, 0);

    return document.documentElement.clientWidth;
  }, resetForms);

  await preventSpuriousLatinWrap(page);
  return clientWidth;
};
