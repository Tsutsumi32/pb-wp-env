/************************************************************
 * viewport の resize 制御
 * - スマホのアドレスバー表示/非表示は高さだけ変わり resize が連発する
 * - 幅が変わっていない resize はブレークポイント跨ぎではないため、Swiper の作り直し等を避ける
 ************************************************************/

/**
 * 幅が変わったときだけ debounce して callback を実行する
 * @param {() => void} callback
 * @param {number} [debounceMs=200]
 * @returns {() => void} リスナー解除用
 */
export const onViewportWidthResize = (callback, debounceMs = 200) => {
  let lastWidth = window.innerWidth;
  let timer;

  const handler = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const width = window.innerWidth;
      if (width === lastWidth) return;
      lastWidth = width;
      callback();
    }, debounceMs);
  };

  window.addEventListener('resize', handler);

  return () => {
    clearTimeout(timer);
    window.removeEventListener('resize', handler);
  };
};

/**
 * resize 時に幅変更か高さのみかを判定して処理を分ける（リニア Swiper 向け）
 * @param {{ onWidthChange: () => void, onHeightOnlyChange?: () => void }} handlers
 * @param {number} [debounceMs=200]
 * @returns {() => void} リスナー解除用
 */
export const onViewportResizeSplit = (handlers, debounceMs = 200) => {
  const { onWidthChange, onHeightOnlyChange } = handlers;
  let lastWidth = window.innerWidth;
  let timer;

  const handler = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const width = window.innerWidth;
      if (width !== lastWidth) {
        lastWidth = width;
        onWidthChange();
        return;
      }
      onHeightOnlyChange?.();
    }, debounceMs);
  };

  window.addEventListener('resize', handler);

  return () => {
    clearTimeout(timer);
    window.removeEventListener('resize', handler);
  };
};
