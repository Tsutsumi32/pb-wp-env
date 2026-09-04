/************************************************************
 * window load 完了の待機
 * - readyState が complete でないときは load を待つ
 ************************************************************/

/**
 * 画像・スタイルシート等を含むページの読み込みが完了するまで待機する Promise を返す
 * @returns {Promise<void>}
 */
export const windowLoad = () => {
  if (document.readyState === 'complete') {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    window.addEventListener('load', resolve, { once: true });
  });
};
