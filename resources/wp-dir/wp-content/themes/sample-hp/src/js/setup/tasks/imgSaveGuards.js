/************************************************************
 * img の右クリック保存・ドラッグ選択などを抑止
 ************************************************************/

/**
 * img の右クリック保存・ドラッグ選択などを抑止
 */
export function initImgSaveGuards() {
  document.querySelectorAll('img').forEach((img) => {
    img.addEventListener('contextmenu', (e) => e.preventDefault());
    img.addEventListener('selectstart', (e) => e.preventDefault());
    img.addEventListener('mousedown', (e) => e.preventDefault());
  });
}
