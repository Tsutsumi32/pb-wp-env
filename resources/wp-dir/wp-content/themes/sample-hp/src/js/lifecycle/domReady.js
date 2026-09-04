/************************************************************
 * DOM構築完了の待機
 * - readyState が loading のときは DOMContentLoaded を待つ
 ************************************************************/

/**
 * DOM構築が完了するまで待機する Promise を返す
 * @returns {Promise<void>}
 */
export const domReady = () => {
  if (document.readyState === 'loading') {
    return new Promise((resolve) => {
      document.addEventListener('DOMContentLoaded', resolve, { once: true });
    });
  }
  return Promise.resolve();
};
